import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext.js";
import { deleteAccountWithPassword, logout } from "../services/authService";
import { createFeedback } from "../services/feedbackService";
import { getBottomTabNavigator, navigateToLogin, navigateToRegister } from "../utils/navigationHelpers.js";
import { openExternalUrlSafe } from "../utils/safeLinking";

export default function ProfileTabScreen({ navigation }) {
  const { user, email, isAuthenticated, loading } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [delPwd, setDelPwd] = useState("");
  const [delConfirm, setDelConfirm] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackErr, setFeedbackErr] = useState("");

  const closeDeleteModal = () => {
    if (delBusy) return;
    setDeleteOpen(false);
    setDelPwd("");
    setDelConfirm("");
    setDelErr("");
  };

  const runDeleteAccount = async () => {
    if (delConfirm !== "УСТГАХ") {
      setDelErr("Баталгаажуулахын тулд УСТГАХ гэж яг энэ үгийг бичнэ үү.");
      return;
    }
    setDelBusy(true);
    setDelErr("");
    try {
      await deleteAccountWithPassword(delPwd);
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

  const submitFeedback = async () => {
    setFeedbackBusy(true);
    setFeedbackErr("");
    try {
      await createFeedback(feedbackText);
      setFeedbackOpen(false);
      setFeedbackText("");
    } catch (e) {
      setFeedbackErr(e?.message || "Санал илгээж чадсангүй.");
    } finally {
      setFeedbackBusy(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.inner}>
      <Text style={styles.title}>Профайл</Text>

      {loading ? (
        <Text style={styles.muted}>Ачаалж байна…</Text>
      ) : isAuthenticated ? (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>Нэвтэрсэн</Text>
            <Text style={styles.email}>{email || user?.email}</Text>
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
            <Pressable style={styles.helpItem} onPress={() => openExternalUrlSafe("https://zarkorea.com/Privacy")}>
              <Text style={styles.helpItemText}>Нууцлалын бодлого</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.dangerOutline}
            onPress={() => {
              setDelPwd("");
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

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={closeDeleteModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeDeleteModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Бүртгэл устгах</Text>
            <Text style={styles.modalHint}>
              Профайл, зар, хадгалсан зар, чатны түүх устгагдана. Нууц үгээ оруулж, доор{" "}
              <Text style={styles.modalHintBold}>УСТГАХ</Text> гэж бичнэ үү.
            </Text>
            {delErr ? <Text style={styles.modalErr}>{delErr}</Text> : null}
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
              <Pressable style={styles.modalCancel} onPress={closeDeleteModal} disabled={delBusy}>
                <Text style={styles.modalCancelText}>Цуцлах</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalDelete,
                  (delBusy || !delPwd.trim() || delConfirm !== "УСТГАХ") && styles.modalDeleteDisabled,
                ]}
                onPress={runDeleteAccount}
                disabled={delBusy || !delPwd.trim() || delConfirm !== "УСТГАХ"}
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
        onRequestClose={() => !feedbackBusy && setFeedbackOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => !feedbackBusy && setFeedbackOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Санал хүсэлт</Text>
            <Text style={styles.modalHint}>Таны саналыг бид сайжруулалтад ашиглана.</Text>
            {feedbackErr ? <Text style={styles.modalErr}>{feedbackErr}</Text> : null}
            <TextInput
              style={[styles.input, { minHeight: 110, textAlignVertical: "top" }]}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Санал хүсэлтээ энд бичнэ үү"
              multiline
              numberOfLines={4}
              editable={!feedbackBusy}
              maxLength={1000}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setFeedbackOpen(false)}
                disabled={feedbackBusy}
              >
                <Text style={styles.modalCancelText}>Цуцлах</Text>
              </Pressable>
              <Pressable
                style={[styles.modalDelete, (!feedbackText.trim() || feedbackBusy) && styles.modalDeleteDisabled]}
                onPress={submitFeedback}
                disabled={!feedbackText.trim() || feedbackBusy}
              >
                {feedbackBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalDeleteText}>Илгээх</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
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
