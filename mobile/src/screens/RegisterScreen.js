import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { registerWithEmail, authErrorMessage } from "../services/authService";
import { showAlert } from "../utils/showAlert";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  async function onRegister() {
    Keyboard.dismiss();
    setFormError("");
    if (!city.trim()) {
      const msg = "Хот заавал оруулна уу";
      setFormError(msg);
      showAlert("Анхаар", msg);
      return;
    }
    if (!district.trim()) {
      const msg = "Дүүрэг заавал оруулна уу";
      setFormError(msg);
      showAlert("Анхаар", msg);
      return;
    }
    if (!email.trim() || !password) {
      const msg = "Имэйл болон нууц үг заавал";
      setFormError(msg);
      showAlert("Анхаар", msg);
      return;
    }
    const phoneDigits = phone.replace(/[\s\-()+]/g, "");
    if (!phoneDigits || !/^\d+$/.test(phoneDigits)) {
      const msg = "Утасны дугаараа зөв оруулна уу";
      setFormError(msg);
      showAlert("Анхаар", msg);
      return;
    }
    if (phoneDigits.length < 8 || phoneDigits.length > 11) {
      const msg = "Утасны дугаар 8-11 оронтой байх ёстой";
      setFormError(msg);
      showAlert("Анхаар", msg);
      return;
    }
    if (password.length < 6) {
      const msg = "Нууц үг дор хаяж 6 тэмдэгт";
      setFormError(msg);
      showAlert("Анхаар", msg);
      return;
    }
    setBusy(true);
    try {
      await registerWithEmail(email, password, name, phoneDigits, city, district);
      navigation.replace("Main");
    } catch (e) {
      const msg = authErrorMessage(e?.code) || e?.message || "Бүртгэл амжилтгүй";
      setFormError(msg);
      showAlert("Бүртгэл амжилтгүй", msg);
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

      <Text style={styles.label}>Хот *</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Жишээ: Seoul" />

      <Text style={styles.label}>Дүүрэг *</Text>
      <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholder="Жишээ: Gangnam-gu" />

      <Text style={styles.label}>Утасны дугаар *</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Жишээ: 01012345678"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Имэйл *</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <Text style={styles.label}>Нууц үг *</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />

      {!!formError && <Text style={styles.errorText}>{formError}</Text>}

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
  errorText: { color: "#dc2626", marginBottom: 8, fontSize: 13, fontWeight: "600" },
  link: { marginTop: 20, alignItems: "center" },
  linkText: { color: "#2563eb", fontSize: 15, fontWeight: "600" },
});
