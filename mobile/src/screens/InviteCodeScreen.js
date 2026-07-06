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
import { useAuth } from "../context/AuthContext.js";
import { getActiveMobileRegion } from "../config/region.js";
import { redeemInviteCode } from "../services/regionService.js";
import { showAlert } from "../utils/showAlert.js";

export default function InviteCodeScreen({ navigation }) {
  const { isAuthenticated, loading: authLoading, refreshUserData } = useAuth();
  const region = getActiveMobileRegion();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await redeemInviteCode(code);
      await refreshUserData();
    } catch (e) {
      showAlert("Invalid code", e?.message || "Could not redeem invite code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Zarusa — {region?.shortLabel || "DC / DMV"}</Text>
        <Text style={styles.subtitle}>
          Washington DC / DMV is in early access. Enter your invite code to continue.
        </Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="Invite code (e.g. DMV2026)"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!busy}
        />
        <Pressable
          style={[styles.primaryBtn, busy && styles.btnDisabled]}
          onPress={onSubmit}
          disabled={busy || authLoading}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {isAuthenticated ? "Continue" : "Sign in to continue"}
            </Text>
          )}
        </Pressable>
        {!isAuthenticated ? (
          <View style={styles.links}>
            <Pressable onPress={() => navigation.navigate("Login")}>
              <Text style={styles.link}>Sign in</Text>
            </Pressable>
            <Text style={styles.linkSep}>·</Text>
            <Pressable onPress={() => navigation.navigate("Register")}>
              <Text style={styles.link}>Create account</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4b5563",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  primaryBtn: {
    backgroundColor: "#ea580c",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  links: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  link: {
    color: "#ea580c",
    fontWeight: "600",
    fontSize: 15,
  },
  linkSep: { color: "#9ca3af" },
});
