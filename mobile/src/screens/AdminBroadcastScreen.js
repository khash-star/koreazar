import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { sendMessageToAllUsers } from "../services/conversationService";
import { showAlert } from "../utils/showAlert";

export default function AdminBroadcastScreen() {
  const { email } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const onSend = async () => {
    const text = message.trim();
    if (!text) {
      showAlert("Анхаар", "Мессеж оруулна уу.");
      return;
    }
    if (!email) {
      showAlert("Алдаа", "Админ имэйл олдсонгүй.");
      return;
    }
    setSending(true);
    try {
      const result = await sendMessageToAllUsers(email, text);
      setMessage("");
      showAlert(
        "Амжилттай",
        `Илгээгдсэн: ${result.successCount}\nАлдсан: ${result.failCount}\nНийт: ${result.total}`
      );
    } catch (e) {
      showAlert("Алдаа", e?.message || "Мессеж илгээж чадсангүй.");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Бүх хэрэглэгчдэд мессеж</Text>
      <Text style={styles.sub}>Бүх бүртгэлтэй хэрэглэгчдэд мессеж хайрцгаар илгээнэ.</Text>
      <TextInput
        style={styles.input}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        placeholder="Мессежээ энд бичнэ үү..."
        value={message}
        onChangeText={setMessage}
        editable={!sending}
        maxLength={2000}
      />
      <Pressable
        style={[styles.sendBtn, (!message.trim() || sending) && styles.sendBtnDisabled]}
        disabled={!message.trim() || sending}
        onPress={onSend}
      >
        {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Илгээх</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  sub: { marginTop: 6, marginBottom: 12, color: "#64748b", fontSize: 14 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    minHeight: 140,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
  },
  sendBtn: {
    marginTop: 12,
    backgroundColor: "#ea580c",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
