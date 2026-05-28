import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  getAuthSyncSnapshot,
  isPhoneAuthSpikeEnabled,
  spikeConfirmOtp,
  spikeSendOtp,
  spikeSignOutJs,
  spikeSignOutRn,
  subscribeJsAuth,
  subscribeRnAuth,
  SPIKE_NATIVE_ONLY,
} from "../spike/phoneAuthSpike";
import { showAlert } from "../utils/showAlert";

const DEFAULT_PHONE =
  process.env.EXPO_PUBLIC_PHONE_SPIKE_E164 || "+821012345678";

export default function PhoneAuthSpikeScreen() {
  const [phone, setPhone] = useState(DEFAULT_PHONE);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [snapshot, setSnapshot] = useState(() => getAuthSyncSnapshot());

  const refresh = useCallback(() => {
    setSnapshot(getAuthSyncSnapshot());
  }, []);

  useEffect(() => {
    refresh();
    const unsubRn = subscribeRnAuth(setSnapshot);
    const unsubJs = subscribeJsAuth(setSnapshot);
    return () => {
      unsubRn();
      unsubJs();
    };
  }, [refresh]);

  if (!isPhoneAuthSpikeEnabled()) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Spike disabled</Text>
        <Text style={styles.muted}>
          Set EXPO_PUBLIC_PHONE_AUTH_SPIKE=true or use a __DEV__ build.
        </Text>
      </View>
    );
  }

  if (SPIKE_NATIVE_ONLY || Platform.OS === "web") {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Native only</Text>
        <Text style={styles.muted}>
          Run an EAS development build on iOS/Android. See mobile/docs/PHONE_OTP_NATIVE_SETUP.md
        </Text>
      </View>
    );
  }

  async function run(action) {
    setBusy(true);
    try {
      const result = await action();
      if (result) setSnapshot(result);
      else refresh();
    } catch (e) {
      showAlert("Spike error", e?.message || String(e));
      refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Phone OTP spike</Text>
      <Text style={styles.muted}>
        Tests @react-native-firebase/auth vs firebase JS auth. Not production login.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Auth sync</Text>
        <Text style={styles.mono}>{JSON.stringify(snapshot, null, 2)}</Text>
        <Pressable style={styles.secondaryBtn} onPress={refresh} disabled={busy}>
          <Text style={styles.secondaryBtnText}>Refresh snapshot</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Phone (E.164)</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        autoCapitalize="none"
        keyboardType="phone-pad"
        placeholder="+821012345678"
      />
      <Text style={styles.hint}>Use Firebase Console test numbers for fixed OTP.</Text>

      <Pressable
        style={[styles.primaryBtn, busy && styles.disabled]}
        disabled={busy}
        onPress={() => run(() => spikeSendOtp(phone))}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>1. RN signInWithPhoneNumber</Text>
        )}
      </Pressable>

      <Text style={styles.label}>OTP code</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="123456"
      />

      <Pressable
        style={[styles.primaryBtn, busy && styles.disabled]}
        disabled={busy}
        onPress={() => run(() => spikeConfirmOtp(code))}
      >
        <Text style={styles.primaryBtnText}>2. Confirm OTP (RN)</Text>
      </Pressable>

      <View style={styles.row}>
        <Pressable
          style={styles.secondaryBtn}
          disabled={busy}
          onPress={() => run(() => spikeSignOutRn())}
        >
          <Text style={styles.secondaryBtnText}>Sign out RN</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          disabled={busy}
          onPress={() => run(() => spikeSignOutJs())}
        >
          <Text style={styles.secondaryBtnText}>Sign out JS</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f8fafc" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 },
  muted: { fontSize: 14, color: "#6b7280", lineHeight: 20, marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8, color: "#374151" },
  mono: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 11, color: "#1f2937" },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  hint: { fontSize: 12, color: "#9ca3af", marginBottom: 12 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: "#ea580c",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  secondaryBtnText: { color: "#374151", fontWeight: "600", fontSize: 14 },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  disabled: { opacity: 0.7 },
});
