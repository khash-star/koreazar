import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { updateListingReport, listListingReports } from "../services/listingReportService";
import { toDate } from "../utils/firestoreDates";
import { showAlert } from "../utils/showAlert";

function ReportCard({ item, onUpdate, busy }) {
  const created = toDate(item.created_date);
  const isPending = item.status === "pending";
  return (
    <View style={[styles.card, isPending ? styles.cardPending : styles.cardHandled]}>
      <View style={styles.rowTop}>
        <Text style={styles.title} numberOfLines={2}>
          {item.listing_title || "Гарчиггүй зар"}
        </Text>
        <View style={[styles.badge, isPending ? styles.badgePending : styles.badgeHandled]}>
          <Text style={[styles.badgeText, isPending ? styles.badgeTextPending : styles.badgeTextHandled]}>
            {item.status || "pending"}
          </Text>
        </View>
      </View>
      <Text style={styles.reason}>Гомдол: {item.reason || "Бусад"}</Text>
      {!!item.details && <Text style={styles.details}>{item.details}</Text>}
      <Text style={styles.meta}>
        {(item.reporter_email || "unknown") + (created ? ` · ${created.toLocaleString("mn-MN")}` : "")}
      </Text>
      {isPending ? (
        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, styles.btnPrimary, busy && styles.btnDisabled]}
            onPress={() => onUpdate(item.id, "reviewed")}
            disabled={busy}
          >
            <Text style={styles.btnPrimaryText}>Хянаж дууссан</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnOutline, busy && styles.btnDisabled]}
            onPress={() => onUpdate(item.id, "rejected")}
            disabled={busy}
          >
            <Text style={styles.btnOutlineText}>Хүчингүй</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function AdminListingReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [reports, setReports] = useState([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await listListingReports();
      setReports(data);
    } catch (e) {
      showAlert("Алдаа", e?.message || "Гомдол ачаалахад алдаа гарлаа");
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

  const onUpdate = useCallback(
    async (id, status) => {
      setBusyId(id);
      try {
        await updateListingReport(id, {
          status,
          reviewed_at: new Date().toISOString(),
        });
        setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      } catch (e) {
        showAlert("Алдаа", e?.message || "Статус шинэчилж чадсангүй");
      } finally {
        setBusyId("");
      }
    },
    []
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  const pending = reports.filter((r) => r.status === "pending");
  const handled = reports.filter((r) => r.status !== "pending");
  const data = [...pending, ...handled];

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#ea580c" />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Зарын гомдол</Text>
          <Text style={styles.headerSub}>Нийт: {reports.length}</Text>
          <Text style={styles.sectionTitle}>Шинэ гомдол ({pending.length})</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const previous = data[index - 1];
        const needsHandledHeader = previous && previous.status === "pending" && item.status !== "pending";
        return (
          <View>
            {needsHandledHeader ? <Text style={styles.sectionTitle}>Шийдвэрлэсэн ({handled.length})</Text> : null}
            <ReportCard item={item} onUpdate={onUpdate} busy={busyId === item.id} />
          </View>
        );
      }}
      ListEmptyComponent={<Text style={styles.empty}>Одоогоор гомдол алга.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  headerSub: { fontSize: 13, color: "#64748b", marginTop: 2, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#334155", marginVertical: 8 },
  card: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 10,
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)" },
      default: {
        shadowColor: "#0f172a",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      },
    }),
  },
  cardPending: { borderLeftWidth: 3, borderLeftColor: "#ef4444" },
  cardHandled: { borderLeftWidth: 3, borderLeftColor: "#94a3b8" },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { flex: 1, fontSize: 16, fontWeight: "700", color: "#0f172a" },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgePending: { backgroundColor: "#fee2e2" },
  badgeHandled: { backgroundColor: "#e2e8f0" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  badgeTextPending: { color: "#b91c1c" },
  badgeTextHandled: { color: "#334155" },
  reason: { marginTop: 6, fontSize: 14, color: "#334155" },
  details: { marginTop: 6, fontSize: 14, color: "#0f172a", lineHeight: 20 },
  meta: { marginTop: 6, fontSize: 12, color: "#64748b" },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: { borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  btnPrimary: { backgroundColor: "#ea580c" },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnOutline: { borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#fff" },
  btnOutlineText: { color: "#334155", fontWeight: "700", fontSize: 13 },
  btnDisabled: { opacity: 0.55 },
  empty: { textAlign: "center", color: "#64748b", fontSize: 14, marginTop: 22 },
});
