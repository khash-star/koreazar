import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { loginWithEmail, authErrorMessage, sendResetEmail } from "../services/authService";
import { showAlert } from "../utils/showAlert";
import { openExternalUrlSafe } from "../utils/safeLinking";

const PRIVACY_URL = "https://zarkorea.com/Privacy";

export default function LoginScreen({ navigation }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.replace("Main");
    }
  }, [isAuthenticated, authLoading, navigation]);

  async function onLogin() {
    Keyboard.dismiss();
    if (!termsAccepted) {
      setTermsError("Эхлээд үйлчилгээний нөхцөлийг зөвшөөрснөө тэмдэглэнэ үү.");
      return;
    }
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
      showAlert("Имэйл илгээгдлээ", "Имэйл хайрцгаа шалгаад зааврыг дагана уу. Spam email-аа давхар шалгаарай.");
    } catch (e) {
      showAlert("Алдаа", authErrorMessage(e?.code) || e?.message);
    } finally {
      setResetting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
            <Pressable onPress={() => openExternalUrlSafe(PRIVACY_URL)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
              <Text style={styles.agreeLink}>үйлчилгээний нөхцөл</Text>
            </Pressable>
            <Text style={styles.agreeFragment}> хүлээн зөвшөөрч, мөн өөрийгөө 18 нас хүрсэн болохыг баталж байна.</Text>
          </View>
        </View>
        <Text style={styles.prohibitedNote}>Хүчирхийлэл, spam, хууль бус контент хориглоно.</Text>
        {termsError ? <Text style={styles.termsError}>{termsError}</Text> : null}

        <Pressable style={[styles.primary, busy && styles.disabled]} onPress={onLogin} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Нэвтрэх</Text>
          )}
        </Pressable>

        <Pressable style={[styles.link, resetting && styles.disabled]} onPress={onForgot} disabled={resetting}>
          {resetting ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Text style={styles.linkText}>Нууц үг мартсан уу?</Text>
          )}
        </Pressable>

        <Pressable style={styles.link} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>Шинэ бүртгэл үүсгэх</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 20, paddingTop: 24, paddingBottom: 32 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
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
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 4, marginBottom: 4 },
  agreeWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: 2,
  },
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
  prohibitedNote: {
    fontSize: 12,
    lineHeight: 17,
    color: "#6b7280",
    marginTop: 2,
    marginBottom: 4,
    marginLeft: 32,
  },
});
