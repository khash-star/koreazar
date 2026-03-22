import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { loginWithEmail, authErrorMessage, sendResetEmail } from "../services/authService";
import { showAlert } from "../utils/showAlert";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onLogin() {
    if (!email.trim() || !password) {
      showAlert("Анхаар", "Имэйл болон нууц үгээ оруулна уу");
      return;
    }
    setBusy(true);
    try {
      await loginWithEmail(email, password);
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.replace("Main");
    } catch (e) {
      showAlert("Нэвтрэлт амжилтгүй", authErrorMessage(e?.code) || e?.message || "Имэйл эсвэл нууц үг буруу");
    } finally {
      setBusy(false);
    }
  }

  async function onForgot() {
    if (!email.trim()) {
      showAlert("Анхаар", "Нууц үг сэргээхийн тулд имэйлээ оруулна уу");
      return;
    }
    try {
      await sendResetEmail(email);
      showAlert("Илгээгдлээ", "Имэйлээ шалгаад зааврыг дагана уу");
    } catch (e) {
      showAlert("Алдаа", authErrorMessage(e?.code) || e?.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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

      <Pressable style={[styles.primary, busy && styles.disabled]} onPress={onLogin} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Нэвтрэх</Text>
        )}
      </Pressable>

      <Pressable style={styles.link} onPress={onForgot}>
        <Text style={styles.linkText}>Нууц үг мартсан уу?</Text>
      </Pressable>

      <Pressable style={styles.link} onPress={() => navigation.navigate("Register")}>
        <Text style={styles.linkText}>Шинэ бүртгэл үүсгэх</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, paddingTop: 24, backgroundColor: "#f8fafc" },
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
});
