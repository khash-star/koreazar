import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext.js";
import { logout } from "../services/authService";
import { navigateToLogin, navigateToRegister } from "../utils/navigationHelpers.js";

export default function ProfileTabScreen({ navigation }) {
  const { user, email, isAuthenticated, loading } = useAuth();

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f8fafc" },
  inner: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 16 },
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
    borderWidth: 2,
    borderColor: "#ea580c",
    marginBottom: 12,
  },
  outlineBtnText: { color: "#ea580c", fontWeight: "700", fontSize: 16 },
  linkBtn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  linkBtnText: { color: "#2563eb", fontWeight: "600", fontSize: 16 },
});
