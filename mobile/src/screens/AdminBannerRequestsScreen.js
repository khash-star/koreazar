import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { listBannerRequests, updateBannerRequest } from "../services/bannerRequestService";
import { toDate } from "../utils/firestoreDates";
import { showAlert } from "../utils/showAlert";

export default function AdminBannerRequestsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [rows, setRows] = useState([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await listBannerRequests();
      setRows(data || []);
    } catch (e) {
      showAlert("Алдаа", e?.message || "Баннер хүсэлт ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const onUpdate = useCallback(async (id, status) => {
    setBusyId(id);
    try {
      await updateBannerRequest(id, status);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      showAlert("Алдаа", e?.message || "Хүсэлтийн төлөв шинэчилж чадсангүй");
    } finally {
      setBusyId("");
    }
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#ea580c" />}
      ListEmptyComponent={<Text style={styles.empty}>Баннер хүсэлт алга.</Text>}
      renderItem={({ item }) => {
        const created = toDate(item.created_date);
        const pending = item.status === "pending";
        const busy = busyId === item.id;
        return (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title || item.business_name || "Хүсэлт"}</Text>
            <Text style={styles.meta}>{item.requester_email || item.email || "-"}</Text>
            <Text style={styles.meta}>{created ? created.toLocaleString("mn-MN") : ""}</Text>
            <Text style={[styles.badge, pending ? styles.pending : styles.handled]}>{item.status || "pending"}</Text>
            {pending ? (
              <View style={styles.actions}>
                <Pressable style={[styles.btn, styles.ok, busy && styles.disabled]} onPress={() => onUpdate(item.id, "approved")} disabled={busy}>
                  <Text style={styles.btnText}>Батлах</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.reject, busy && styles.disabled]} onPress={() => onUpdate(item.id, "rejected")} disabled={busy}>
                  <Text style={styles.btnText}>Татгалзах</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 30 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 30 },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  title: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  meta: { marginTop: 3, color: "#64748b", fontSize: 12 },
  badge: { marginTop: 6, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, fontSize: 12, fontWeight: "700" },
  pending: { backgroundColor: "#fee2e2", color: "#b91c1c" },
  handled: { backgroundColor: "#e2e8f0", color: "#334155" },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: "center" },
  ok: { backgroundColor: "#22c55e" },
  reject: { backgroundColor: "#ef4444" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  disabled: { opacity: 0.6 },
});
