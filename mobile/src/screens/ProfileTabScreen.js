import { useEffect, useRef, useState } from "react";
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
import { useAuth } from "../context/AuthContext.js";
import {
  deleteAccountForCurrentUser,
  logout,
  startPhoneLogin,
  updateUserData,
} from "../services/authService";
import { showAlert } from "../utils/showAlert";
import { createFeedback } from "../services/feedbackService";
import {
  getBottomTabNavigator,
  navigateToLogin,
  navigateToPrivacyPolicy,
  navigateToRegister,
} from "../utils/navigationHelpers.js";
import { openExternalUrlSafe } from "../utils/safeLinking";
import { isSyntheticPhoneAuthEmail } from "../utils/emailNormalize.js";
import { isPhoneAuthSpikeEnabled } from "../spike/phoneAuthSpikeEnabled";

const emptyProfileForm = () => ({
  displayName: "",
  phone: "",
  city: "",
  district: "",
  kakao_id: "",
  wechat_id: "",
  whatsapp: "",
  facebook: "",
});

function toUserFacingError(e) {
  const code = String(e?.code || "");
  const msg = String(e?.message || "");
  if (code === "already-exists" || /already exists/i.test(msg)) {
    return "Санал аль хэдийн илгээгдсэн. Хэсэг хүлээж дахин оролдоно уу.";
  }
  if (code === "permission-denied" || /insufficient permissions/i.test(msg)) {
    return "Эрх хүрэхгүй байна. Дахин нэвтэрнэ үү.";
  }
  if (/projects\//.test(msg) || /documents\//.test(msg)) {
    return "Серверийн алдаа. Дахин оролдоно уу.";
  }
  return msg || "Алдаа гарлаа";
}

export default function ProfileTabScreen({ navigation }) {
  const { user, userData, email, isAuthenticated, loading, refreshUserData } = useAuth();
  const displayEmail = email && !isSyntheticPhoneAuthEmail(email) ? email : null;
  const isPhoneOnlyAccount =
    !!user?.uid &&
    !user?.email &&
    (!!user?.phoneNumber || !!userData?.phone || !!userData?.phoneNumber);
  const [editOpen, setEditOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [delPwd, setDelPwd] = useState("");
  const [delOtp, setDelOtp] = useState("");
  const [delOtpSent, setDelOtpSent] = useState(false);
  const [delOtpBusy, setDelOtpBusy] = useState(false);
  const [delConfirm, setDelConfirm] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackErr, setFeedbackErr] = useState("");
  const [feedbackKeyboardInset, setFeedbackKeyboardInset] = useState(0);
  const feedbackSubmittingRef = useRef(false);
  const feedbackScrollRef = useRef(null);

  const closeDeleteModal = () => {
    if (delBusy || delOtpBusy) return;
    setDeleteOpen(false);
    setDelPwd("");
    setDelOtp("");
    setDelOtpSent(false);
    setDelOtpBusy(false);
    setDelConfirm("");
    setDelErr("");
  };

  const sendDeleteOtp = async () => {
    const phone = user?.phoneNumber || userData?.phoneNumber || userData?.phone || "";
    if (!phone) {
      setDelErr("Утасны дугаар олдсонгүй. Дахин нэвтэрч оролдоно уу.");
      return;
    }
    setDelOtpBusy(true);
    setDelErr("");
    try {
      await startPhoneLogin(phone);
      setDelOtp("");
      setDelOtpSent(true);
      showAlert("OTP илгээгдлээ", "Бүртгэл устгахын тулд ирсэн кодыг оруулна уу.");
    } catch (e) {
      setDelErr(e?.message || "OTP код илгээж чадсангүй.");
    } finally {
      setDelOtpBusy(false);
    }
  };

  const runDeleteAccount = async () => {
    if (delConfirm !== "УСТГАХ") {
      setDelErr("Баталгаажуулахын тулд УСТГАХ гэж яг энэ үгийг бичнэ үү.");
      return;
    }
    if (isPhoneOnlyAccount && !delOtp.trim()) {
      setDelErr("OTP код оруулна уу.");
      return;
    }
    setDelBusy(true);
    setDelErr("");
    try {
      await deleteAccountForCurrentUser(
        isPhoneOnlyAccount ? "" : delPwd,
        isPhoneOnlyAccount ? delOtp : ""
      );
      closeDeleteModal();
    } catch (e) {
      setDelErr(e?.message || "Бүртгэл устгахад алдаа гарлаа.");
    } finally {
      setDelBusy(false);
    }
  };

  const openMessagesTab = () => {
    const tab = getBottomTabNavigator(navigation);
    if (tab?.navigate) tab.navigate("MessagesTab");
  };

  useEffect(() => {
    if (!editOpen || !user) return;
    setEditErr("");
    setProfileForm({
      displayName: userData?.displayName || user?.displayName || "",
      phone: userData?.phone || "",
      city: userData?.city || "",
      district: userData?.district || "",
      kakao_id: userData?.kakao_id || "",
      wechat_id: userData?.wechat_id || "",
      whatsapp: userData?.whatsapp || "",
      facebook: userData?.facebook || "",
    });
  }, [editOpen, user, userData]);

  const saveProfile = async () => {
    if (!user?.uid) return;
    setEditBusy(true);
    setEditErr("");
    try {
      await updateUserData(user.uid, profileForm);
      await refreshUserData();
      setEditOpen(false);
      showAlert("Амжилттай", "Профайлын мэдээлэл шинэчлэгдлээ.");
    } catch (e) {
      setEditErr(e?.message || "Хадгалахад алдаа гарлаа.");
    } finally {
      setEditBusy(false);
    }
  };

  const closeFeedbackModal = () => {
    if (feedbackBusy) return;
    Keyboard.dismiss();
    setFeedbackOpen(false);
    setFeedbackErr("");
    setFeedbackKeyboardInset(0);
  };

  useEffect(() => {
    if (!feedbackOpen) {
      setFeedbackKeyboardInset(0);
      return;
    }
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = (e) => {
      const h = e?.endCoordinates?.height ?? 0;
      setFeedbackKeyboardInset(h);
      setTimeout(() => feedbackScrollRef.current?.scrollToEnd({ animated: true }), 50);
    };
    const onHide = () => setFeedbackKeyboardInset(0);
    const subShow = Keyboard.addListener(showEvt, onShow);
    const subHide = Keyboard.addListener(hideEvt, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [feedbackOpen]);

  const submitFeedback = async () => {
    const text = feedbackText.trim();
    if (!text || feedbackBusy || feedbackSubmittingRef.current) return;
    Keyboard.dismiss();
    feedbackSubmittingRef.current = true;
    setFeedbackBusy(true);
    setFeedbackErr("");
    try {
      await createFeedback(text);
      setFeedbackText("");
      setFeedbackOpen(false);
      setFeedbackKeyboardInset(0);
      showAlert("Амжилттай", "Санал хүсэлт хүлээн авлаа. Баярлалаа!");
    } catch (e) {
      setFeedbackErr(toUserFacingError(e));
    } finally {
      feedbackSubmittingRef.current = false;
      setFeedbackBusy(false);
    }
  };

  return (
    <>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.inner}>
      <Text style={styles.title}>Профайл</Text>

      {loading ? (
        <Text style={styles.muted}>Ачаалж байна…</Text>
      ) : isAuthenticated ? (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>Нэвтэрсэн</Text>
            <Text style={styles.email}>{displayEmail || ""}</Text>
            {(userData?.displayName || user?.displayName) ? (
              <Text style={styles.displayName}>
                {userData?.displayName || user?.displayName}
              </Text>
            ) : null}
            {(userData?.phone || user?.phoneNumber) ? (
              <Text style={styles.phoneLine}>{userData?.phone || user?.phoneNumber}</Text>
            ) : null}
            <Pressable
              style={styles.editProfileBtn}
              onPress={() => setEditOpen(true)}
            >
              <Text style={styles.editProfileBtnText}>Профайл засах</Text>
            </Pressable>
          </View>
          <Pressable
            style={styles.linkBtn}
            onPress={() => navigation.navigate("MyListings")}
          >
            <Text style={styles.linkBtnText}>Миний зарууд</Text>
          </Pressable>
          <Pressable style={styles.outlineBtn} onPress={() => logout()}>
            <Text style={styles.outlineBtnText}>Гарах</Text>
          </Pressable>

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Тусламж</Text>
            <Pressable style={styles.helpItem} onPress={() => openExternalUrlSafe("https://zarkorea.com/AIBot")}>
              <Text style={styles.helpItemText}>Түгээмэл асуулт, хариулт</Text>
            </Pressable>
            <Pressable
              style={styles.helpItem}
              onPress={() => {
                setFeedbackErr("");
                setFeedbackText("");
                setFeedbackOpen(true);
              }}
            >
              <Text style={styles.helpItemText}>Санал хүсэлт илгээх</Text>
            </Pressable>
            <Pressable style={styles.helpItem} onPress={openMessagesTab}>
              <Text style={styles.helpItemText}>Админтай холбогдох</Text>
            </Pressable>
            <Pressable style={styles.helpItem} onPress={() => navigateToPrivacyPolicy(navigation)}>
              <Text style={styles.helpItemText}>Нууцлалын бодлого</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.dangerOutline}
            onPress={() => {
              setDelPwd("");
              setDelOtp("");
              setDelOtpSent(false);
              setDelOtpBusy(false);
              setDelConfirm("");
              setDelErr("");
              setDeleteOpen(true);
            }}
          >
            <Text style={styles.dangerOutlineText}>Бүртгэл устгах</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.sub}>Нэвтэрснээр хадгалсан зар, профайл ашиглана.</Text>
          <Pressable style={styles.btn} onPress={() => navigateToLogin(navigation)}>
            <Text style={styles.btnText}>Нэвтрэх</Text>
          </Pressable>
          <Pressable style={styles.outlineBtn} onPress={() => navigateToRegister(navigation)}>
            <Text style={styles.outlineBtnText}>Бүртгүүлэх</Text>
          </Pressable>
        </>
      )}

      {isPhoneAuthSpikeEnabled() ? (
        <Pressable
          style={styles.spikeDevLink}
          onPress={() => navigation.navigate("PhoneAuthSpike")}
        >
          <Text style={styles.spikeDevLinkText}>Phone OTP spike (dev)</Text>
        </Pressable>
      ) : null}
    </ScrollView>

      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !editBusy && setEditOpen(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => !editBusy && setEditOpen(false)}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.editScroll}
              showsVerticalScrollIndicator={false}
            >
              <Pressable style={styles.modalCardWide} onPress={(e) => e.stopPropagation?.()}>
              <Text style={styles.modalTitle}>Профайл засах</Text>
              <Text style={styles.modalHint}>Нэр, утас зэргээ шинэчилнэ үү. Имэйлийг энд өөрчлөх боломжгүй.</Text>
              {editErr ? <Text style={styles.modalErr}>{editErr}</Text> : null}
              <Text style={styles.inputLabel}>Нэр (харуулах)</Text>
              <TextInput
                style={styles.input}
                value={profileForm.displayName}
                onChangeText={(t) => setProfileForm((p) => ({ ...p, displayName: t }))}
                placeholder="Таны нэр"
                editable={!editBusy}
              />
              <Text style={styles.inputLabel}>Утас</Text>
              <TextInput
                style={styles.input}
                value={profileForm.phone}
                onChangeText={(t) => setProfileForm((p) => ({ ...p, phone: t }))}
                placeholder="010-0000-0000"
                keyboardType="phone-pad"
                editable={!editBusy}
              />
              <Text style={styles.inputLabel}>Хот</Text>
              <TextInput
                style={styles.input}
                value={profileForm.city}
                onChangeText={(t) => setProfileForm((p) => ({ ...p, city: t }))}
                placeholder="Жишээ: Сөүл"
                editable={!editBusy}
              />
              <Text style={styles.inputLabel}>Дүүрэг / хороо</Text>
              <TextInput
                style={styles.input}
                value={profileForm.district}
                onChangeText={(t) => setProfileForm((p) => ({ ...p, district: t }))}
                placeholder="Сонголттой"
                editable={!editBusy}
              />
              <Text style={styles.inputLabel}>Kakao ID</Text>
              <TextInput
                style={styles.input}
                value={profileForm.kakao_id}
                onChangeText={(t) => setProfileForm((p) => ({ ...p, kakao_id: t }))}
                placeholder="Сонголттой"
                editable={!editBusy}
                autoCapitalize="none"
              />
              <Text style={styles.inputLabel}>WeChat ID</Text>
              <TextInput
                style={styles.input}
                value={profileForm.wechat_id}
                onChangeText={(t) => setProfileForm((p) => ({ ...p, wechat_id: t }))}
                placeholder="Сонголттой"
                editable={!editBusy}
                autoCapitalize="none"
              />
              <Text style={styles.inputLabel}>WhatsApp</Text>
              <TextInput
                style={styles.input}
                value={profileForm.whatsapp}
                onChangeText={(t) => setProfileForm((p) => ({ ...p, whatsapp: t }))}
                placeholder="Сонголттой"
                editable={!editBusy}
                autoCapitalize="none"
              />
              <Text style={styles.inputLabel}>Facebook</Text>
              <TextInput
                style={styles.input}
                value={profileForm.facebook}
                onChangeText={(t) => setProfileForm((p) => ({ ...p, facebook: t }))}
                placeholder="Сонголттой"
                editable={!editBusy}
                autoCapitalize="none"
              />
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalCancel}
                  onPress={() => !editBusy && setEditOpen(false)}
                  disabled={editBusy}
                >
                  <Text style={styles.modalCancelText}>Цуцлах</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveProfileBtn, editBusy && styles.modalDeleteDisabled]}
                  onPress={saveProfile}
                  disabled={editBusy}
                >
                  {editBusy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveProfileBtnText}>Хадгалах</Text>
                  )}
                </Pressable>
              </View>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={closeDeleteModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeDeleteModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.modalTitle}>Бүртгэл устгах</Text>
            <Text style={styles.modalHint}>
              {isPhoneOnlyAccount
                ? "Профайл, зар, хадгалсан зар, чатны түүх устгагдана. OTP кодоор дахин баталгаажуулж, доор "
                : "Профайл, зар, хадгалсан зар, чатны түүх устгагдана. Нууц үгээ оруулж, доор "}
              <Text style={styles.modalHintBold}>УСТГАХ</Text> гэж бичнэ үү.
            </Text>
            {delErr ? <Text style={styles.modalErr}>{delErr}</Text> : null}
            {isPhoneOnlyAccount ? (
              <>
                <Pressable
                  style={[styles.otpBtn, (delBusy || delOtpBusy) && styles.modalDeleteDisabled]}
                  onPress={sendDeleteOtp}
                  disabled={delBusy || delOtpBusy}
                >
                  {delOtpBusy ? (
                    <ActivityIndicator color="#ea580c" />
                  ) : (
                    <Text style={styles.otpBtnText}>
                      {delOtpSent ? "OTP дахин илгээх" : "OTP код илгээх"}
                    </Text>
                  )}
                </Pressable>
                {delOtpSent ? (
                  <Text style={styles.otpSentHint}>Ирсэн OTP кодыг оруулна уу.</Text>
                ) : null}
                <Text style={styles.inputLabel}>OTP код</Text>
                <TextInput
                  style={styles.input}
                  value={delOtp}
                  onChangeText={setDelOtp}
                  placeholder="6 оронтой код"
                  editable={!delBusy}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Нууц үг</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={delPwd}
                  onChangeText={setDelPwd}
                  placeholder="Одоогийн нууц үг"
                  editable={!delBusy}
                  autoCapitalize="none"
                />
              </>
            )}
            <Text style={styles.inputLabel}>Баталгаажуулах</Text>
            <TextInput
              style={styles.input}
              value={delConfirm}
              onChangeText={setDelConfirm}
              placeholder="УСТГАХ"
              editable={!delBusy}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={closeDeleteModal}
                disabled={delBusy || delOtpBusy}
              >
                <Text style={styles.modalCancelText}>Цуцлах</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalDelete,
                  (delBusy ||
                    delOtpBusy ||
                    delConfirm !== "УСТГАХ" ||
                    (isPhoneOnlyAccount
                      ? !delOtpSent || !delOtp.trim()
                      : !delPwd.trim())) &&
                    styles.modalDeleteDisabled,
                ]}
                onPress={runDeleteAccount}
                disabled={
                  delBusy ||
                  delOtpBusy ||
                  delConfirm !== "УСТГАХ" ||
                  (isPhoneOnlyAccount
                    ? !delOtpSent || !delOtp.trim()
                    : !delPwd.trim())
                }
              >
                {delBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalDeleteText}>Устгах</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={feedbackOpen}
        transparent
        animationType="fade"
        onRequestClose={closeFeedbackModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboardRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeFeedbackModal}>
            <ScrollView
              ref={feedbackScrollRef}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.feedbackScroll,
                { paddingBottom: Math.max(36, feedbackKeyboardInset + 24) },
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation?.()}>
                <Text style={styles.modalTitle}>Санал хүсэлт</Text>
                <Text style={styles.modalHint}>Таны саналыг бид сайжруулалтад ашиглана.</Text>
                {feedbackErr ? <Text style={styles.modalErr}>{feedbackErr}</Text> : null}
                <TextInput
                  style={[styles.input, styles.feedbackInput]}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  placeholder="Санал хүсэлтээ энд бичнэ үү"
                  multiline
                  textAlignVertical="top"
                  editable={!feedbackBusy}
                  maxLength={1000}
                  onFocus={() => {
                    setTimeout(() => feedbackScrollRef.current?.scrollToEnd({ animated: true }), 80);
                  }}
                />
                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.modalCancel}
                    onPress={closeFeedbackModal}
                    disabled={feedbackBusy}
                  >
                    <Text style={styles.modalCancelText}>Цуцлах</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalDelete, (!feedbackText.trim() || feedbackBusy) && styles.modalDeleteDisabled]}
                    onPress={submitFeedback}
                    disabled={!feedbackText.trim() || feedbackBusy}
                  >
                    {feedbackBusy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalDeleteText}>Илгээх</Text>
                    )}
                  </Pressable>
                </View>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f3f4f6" },
  inner: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 14 },
  muted: { color: "#6b7280" },
  sub: { fontSize: 15, color: "#6b7280", marginBottom: 20, lineHeight: 22 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  label: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  email: { fontSize: 16, fontWeight: "600", color: "#111827" },
  displayName: { fontSize: 15, color: "#374151", marginTop: 8, fontWeight: "500" },
  phoneLine: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  editProfileBtn: {
    marginTop: 14,
    backgroundColor: "#ea580c",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  editProfileBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  editScroll: { flexGrow: 1, justifyContent: "center", padding: 20, paddingBottom: 36 },
  modalCardWide: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  saveProfileBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#ea580c",
  },
  saveProfileBtnText: { fontWeight: "700", color: "#fff" },
  btn: {
    backgroundColor: "#ea580c",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  outlineBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  outlineBtnText: { color: "#111827", fontWeight: "600", fontSize: 16 },
  dangerOutline: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  dangerOutlineText: { color: "#b91c1c", fontWeight: "700", fontSize: 16 },
  helpCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
  },
  helpTitle: { color: "#111827", fontWeight: "700", fontSize: 18, marginBottom: 8 },
  helpItem: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  helpItemText: { color: "#374151", fontSize: 15, fontWeight: "500" },
  spikeDevLink: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 10,
    backgroundColor: "#fffbeb",
  },
  spikeDevLinkText: { color: "#b45309", fontSize: 14, fontWeight: "600" },
  linkBtn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  linkBtnText: { color: "#111827", fontWeight: "600", fontSize: 16 },
  modalKeyboardRoot: { flex: 1 },
  feedbackScroll: { flexGrow: 1, justifyContent: "flex-start", padding: 24, paddingTop: 56 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  feedbackInput: { minHeight: 110, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  modalHint: { fontSize: 14, color: "#4b5563", lineHeight: 20, marginBottom: 12 },
  modalHintBold: { fontWeight: "700", color: "#111827" },
  modalErr: { color: "#b91c1c", fontSize: 14, marginBottom: 8 },
  inputLabel: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    color: "#111827",
  },
  otpBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
    marginBottom: 8,
  },
  otpBtnText: { fontWeight: "700", color: "#ea580c" },
  otpSentHint: { color: "#4b5563", fontSize: 13, marginBottom: 8 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalCancelText: { fontWeight: "600", color: "#374151" },
  modalDelete: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#dc2626",
  },
  modalDeleteDisabled: { opacity: 0.5 },
  modalDeleteText: { fontWeight: "700", color: "#fff" },
});
