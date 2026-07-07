import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { navigateToPrivacyPolicy, navigateAfterRootAuth } from "../utils/navigationHelpers.js";
import {
  loginWithEmail,
  authErrorMessage,
  sendResetEmail,
  startPhoneLogin,
  confirmPhoneLogin,
  completePhoneUserProfile,
} from "../services/authService";
import { clearPendingPhoneOtp as clearNativePending } from "../services/phoneAuth";
import { buildPhoneE164 } from "../utils/phoneNormalize";
import { showAlert } from "../utils/showAlert";

const OTP_RESEND_COOLDOWN_SEC = 60;
const PHONE_COUNTRIES = [
  { value: "+82", label: "🇰🇷 +82" },
  { value: "+976", label: "🇲🇳 +976" },
];

export default function LoginScreen({ navigation }) {
  const { isAuthenticated, loading: authLoading, userData } = useAuth();
  const [loginMethod, setLoginMethod] = useState(Platform.OS === "web" ? "email" : "phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");

  const [phoneCountryPrefix, setPhoneCountryPrefix] = useState("+82");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [phoneNameSetup, setPhoneNameSetup] = useState(false);
  const [phoneAuthFlowActive, setPhoneAuthFlowActive] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const startResendCountdown = useCallback(() => {
    setResendCountdown(OTP_RESEND_COOLDOWN_SEC);
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;
    const t = setTimeout(() => setResendCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !phoneNameSetup && !phoneAuthFlowActive) {
      navigateAfterRootAuth(navigation, userData);
    }
  }, [isAuthenticated, authLoading, navigation, phoneNameSetup, phoneAuthFlowActive, userData]);

  function requireTerms() {
    if (!termsAccepted) {
      setTermsError("Эхлээд үйлчилгээний нөхцөлийг зөвшөөрснөө тэмдэглэнэ үү.");
      return false;
    }
    setTermsError("");
    return true;
  }

  function resetPhoneOtpFlow() {
    setOtpSent(false);
    setOtpCode("");
    setPhoneError("");
    setResendCountdown(0);
    clearNativePending();
  }

  async function sendOtp() {
    Keyboard.dismiss();
    if (!requireTerms()) return;
    const normalized = buildPhoneE164(phoneCountryPrefix, phoneLocal);
    if (!normalized || normalized.length < 10) {
      setPhoneError("Утасны дугаараа зөв оруулна уу");
      return;
    }
    setPhoneError("");
    setPhoneLoading(true);
    try {
      await startPhoneLogin(normalized);
      setOtpSent(true);
      startResendCountdown();
    } catch (e) {
      setPhoneError(authErrorMessage(e?.code) || e?.message || "OTP илгээж чадсангүй");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function confirmOtp() {
    Keyboard.dismiss();
    if (!otpCode.trim()) {
      setPhoneError("OTP код оруулна уу");
      return;
    }
    const normalized = buildPhoneE164(phoneCountryPrefix, phoneLocal);
    setPhoneLoading(true);
    setPhoneError("");
    setPhoneAuthFlowActive(true);
    try {
      const { needsNameSetup } = await confirmPhoneLogin(otpCode, normalized);
      if (needsNameSetup) {
        setPhoneNameSetup(true);
        setProfileDisplayName("");
      } else {
        setPhoneAuthFlowActive(false);
      }
    } catch (e) {
      setPhoneAuthFlowActive(false);
      setPhoneError(authErrorMessage(e?.code) || e?.message || "Баталгаажуулалт амжилтгүй");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function savePhoneName() {
    const name = profileDisplayName.trim();
    if (name.length < 2) {
      setPhoneError("Нэр хамгийн багадаа 2 тэмдэгт байх ёстой");
      return;
    }
    setPhoneLoading(true);
    setPhoneError("");
    try {
      await completePhoneUserProfile(name);
      setPhoneNameSetup(false);
      setPhoneAuthFlowActive(false);
    } catch (e) {
      setPhoneError(e?.message || "Профайл хадгалахад алдаа гарлаа");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function onLogin() {
    Keyboard.dismiss();
    if (!requireTerms()) return;
    if (!email.trim() || !password) {
      showAlert("Анхаар", "Имэйл болон нууц үгээ оруулна уу");
      return;
    }
    setBusy(true);
    try {
      await loginWithEmail(email, password);
    } catch (e) {
      showAlert("Нэвтрэлт амжилтгүй", authErrorMessage(e?.code) || e?.message || "Имэйл эсвэл нууц үг буруу");
    } finally {
      setBusy(false);
    }
  }

  async function onForgot() {
    Keyboard.dismiss();
    if (!email.trim()) {
      showAlert("Анхаар", "Нууц үг сэргээхийн тулд имэйлээ оруулна уу");
      return;
    }
    setResetting(true);
    try {
      await sendResetEmail(email);
      showAlert("Имэйл илгээгдлээ", "Имэйл хайрцгаа шалгаад зааврыг дагана уу.");
    } catch (e) {
      showAlert("Алдаа", authErrorMessage(e?.code) || e?.message);
    } finally {
      setResetting(false);
    }
  }

  const termsBlock = (
    <>
      <View style={styles.termsRow}>
        <Pressable
          style={[styles.checkBox, termsAccepted && styles.checkBoxOn]}
          onPress={() => {
            setTermsAccepted((v) => !v);
            setTermsError("");
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termsAccepted }}
          hitSlop={8}
        >
          {termsAccepted ? <Text style={styles.checkMark}>✓</Text> : null}
        </Pressable>
        <View style={styles.agreeWrap}>
          <Text style={styles.agreeFragment}>Би ZARKOREA.COM сайтын </Text>
          <Pressable onPress={() => navigateToPrivacyPolicy(navigation)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
            <Text style={styles.agreeLink}>үйлчилгээний нөхцөл</Text>
          </Pressable>
          <Text style={styles.agreeFragment}> хүлээн зөвшөөрч, мөн өөрийгөө 18 нас хүрсэн болохыг баталж байна.</Text>
        </View>
      </View>
      <Text style={styles.prohibitedNote}>Хүчирхийлэл, spam, хууль бус контент хориглоно.</Text>
      {termsError ? <Text style={styles.termsError}>{termsError}</Text> : null}
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Нэвтрэх</Text>
        <Text style={styles.subheading}>Имэйл эсвэл утсаар OTP код ашиглан нэвтрэнэ үү</Text>

        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tab, loginMethod === "phone" && styles.tabActive]}
            onPress={() => {
              setLoginMethod("phone");
              setPhoneError("");
            }}
          >
            <Text style={[styles.tabText, loginMethod === "phone" && styles.tabTextActive]}>Утас</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, loginMethod === "email" && styles.tabActive]}
            onPress={() => {
              setLoginMethod("email");
              setPhoneError("");
              resetPhoneOtpFlow();
            }}
          >
            <Text style={[styles.tabText, loginMethod === "email" && styles.tabTextActive]}>Имэйл</Text>
          </Pressable>
        </View>

        {loginMethod === "phone" ? (
          <>
            {!otpSent && !phoneNameSetup ? (
              <>
                <Text style={styles.label}>Утасны дугаар</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.prefixCol}>
                    {PHONE_COUNTRIES.map((c) => (
                      <Pressable
                        key={c.value}
                        style={[styles.prefixBtn, phoneCountryPrefix === c.value && styles.prefixBtnActive]}
                        onPress={() => setPhoneCountryPrefix(c.value)}
                      >
                        <Text style={[styles.prefixBtnText, phoneCountryPrefix === c.value && styles.prefixBtnTextActive]}>
                          {c.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    value={phoneLocal}
                    onChangeText={setPhoneLocal}
                    keyboardType="phone-pad"
                    placeholder="010-9497-0939"
                    autoComplete="tel"
                  />
                </View>
                <Text style={styles.hint}>
                  Зураас, зайтай эсвэл зураасгүй оруулж болно. Эхний 0 автоматаар хасагдана.
                </Text>
                {termsBlock}
                <Pressable
                  style={[styles.primary, phoneLoading && styles.disabled]}
                  onPress={sendOtp}
                  disabled={phoneLoading}
                >
                  {phoneLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>OTP код илгээх</Text>}
                </Pressable>
              </>
            ) : null}

            {otpSent && !phoneNameSetup ? (
              <>
                <Text style={styles.label}>OTP код</Text>
                <TextInput
                  style={styles.input}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="123456"
                  autoComplete="one-time-code"
                />
                {termsBlock}
                <Pressable
                  style={[styles.primary, phoneLoading && styles.disabled]}
                  onPress={confirmOtp}
                  disabled={phoneLoading}
                >
                  {phoneLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Баталгаажуулах</Text>}
                </Pressable>
                <Pressable
                  style={[styles.link, (phoneLoading || resendCountdown > 0) && styles.disabled]}
                  onPress={sendOtp}
                  disabled={phoneLoading || resendCountdown > 0}
                >
                  <Text style={styles.linkText}>
                    {resendCountdown > 0 ? `Дахин илгээх (${resendCountdown}с)` : "Дахин код илгээх"}
                  </Text>
                </Pressable>
                <Pressable style={styles.link} onPress={resetPhoneOtpFlow} disabled={phoneLoading}>
                  <Text style={styles.linkTextMuted}>Дугаар солих</Text>
                </Pressable>
              </>
            ) : null}

            {phoneError ? <Text style={styles.phoneError}>{phoneError}</Text> : null}
          </>
        ) : (
          <>
            <Text style={styles.label}>Имэйл</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
            />
            <Text style={styles.label}>Нууц үг</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
            {termsBlock}
            <Pressable style={[styles.primary, busy && styles.disabled]} onPress={onLogin} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Нэвтрэх</Text>}
            </Pressable>
            <Pressable style={[styles.link, resetting && styles.disabled]} onPress={onForgot} disabled={resetting}>
              {resetting ? <ActivityIndicator size="small" color="#2563eb" /> : <Text style={styles.linkText}>Нууц үг мартсан уу?</Text>}
            </Pressable>
          </>
        )}

        <Pressable style={styles.link} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>Шинэ бүртгэл үүсгэх</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={phoneNameSetup} transparent animationType="fade" onRequestClose={() => {}}>
        <KeyboardAvoidingView style={styles.modalWrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Таны нэр</Text>
            <Text style={styles.modalHint}>Профайл дээр харагдах нэрээ оруулна уу.</Text>
            <TextInput
              style={styles.input}
              value={profileDisplayName}
              onChangeText={setProfileDisplayName}
              placeholder="Нэр"
              autoFocus
            />
            {phoneError ? <Text style={styles.phoneError}>{phoneError}</Text> : null}
            <Pressable style={[styles.primary, phoneLoading && styles.disabled]} onPress={savePhoneName} disabled={phoneLoading}>
              {phoneLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Хадгалах</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 20, paddingTop: 24, paddingBottom: 32 },
  heading: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 4 },
  subheading: { fontSize: 14, color: "#6b7280", marginBottom: 16, lineHeight: 20 },
  tabRow: { flexDirection: "row", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: "#ea580c" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "#fff" },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  hint: { fontSize: 12, color: "#9ca3af", marginBottom: 12, lineHeight: 17 },
  phoneRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  prefixCol: { gap: 6 },
  prefixBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  prefixBtnActive: { borderColor: "#ea580c", backgroundColor: "#fff7ed" },
  prefixBtnText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  prefixBtnTextActive: { color: "#ea580c" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  phoneInput: { flex: 1, marginBottom: 0 },
  primary: {
    backgroundColor: "#ea580c",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  disabled: { opacity: 0.7 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { marginTop: 16, alignItems: "center" },
  linkText: { color: "#2563eb", fontSize: 15, fontWeight: "600" },
  linkTextMuted: { color: "#6b7280", fontSize: 15, fontWeight: "600" },
  phoneError: { color: "#dc2626", fontSize: 13, marginTop: 8 },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 4, marginBottom: 4 },
  agreeWrap: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", rowGap: 2 },
  agreeFragment: { fontSize: 14, lineHeight: 20, color: "#4b5563" },
  checkBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#9ca3af",
    borderRadius: 4,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkBoxOn: { borderColor: "#ea580c", backgroundColor: "#fff7ed" },
  checkMark: { color: "#ea580c", fontSize: 14, fontWeight: "800" },
  agreeLink: { fontSize: 14, lineHeight: 20, color: "#dc2626", fontWeight: "600", textDecorationLine: "underline" },
  termsError: { color: "#dc2626", fontSize: 13, marginBottom: 8, marginLeft: 32 },
  prohibitedNote: { fontSize: 12, lineHeight: 17, color: "#6b7280", marginTop: 2, marginBottom: 4, marginLeft: 32 },
  modalWrap: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.45)" },
  modalCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 6 },
  modalHint: { fontSize: 14, color: "#6b7280", marginBottom: 12 },
});
