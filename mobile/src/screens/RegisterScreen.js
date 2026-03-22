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
import { registerWithEmail, authErrorMessage } from "../services/authService";
import { showAlert } from "../utils/showAlert";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onRegister() {
    if (!email.trim() || !password) {
      showAlert("Анхаар", "Имэйл болон нууц үг заавал");
      return;
    }
    if (password.length < 6) {
      showAlert("Анхаар", "Нууц үг дор хаяж 6 тэмдэгт");
      return;
    }
    setBusy(true);
    try {
      await registerWithEmail(email, password, name);
      navigation.replace("Main");
    } catch (e) {
      showAlert("Бүртгэл амжилтгүй", authErrorMessage(e?.code) || e?.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.label}>Нэр (сонголттой)</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Таны нэр" />

      <Text style={styles.label}>Имэйл</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <Text style={styles.label}>Нууц үг</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />

      <Pressable style={[styles.primary, busy && styles.disabled]} onPress={onRegister} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Бүртгүүлэх</Text>
        )}
      </Pressable>

      <Pressable style={styles.link} onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Нэвтрэх хуудас руу буцах</Text>
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
  link: { marginTop: 20, alignItems: "center" },
  linkText: { color: "#2563eb", fontSize: 15, fontWeight: "600" },
});
