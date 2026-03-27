import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getLatestListings, getPendingListings } from "../services/listingService";
import { showAlert } from "../utils/showAlert";

export default function AdminAllListingsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const [active, pending] = await Promise.all([getLatestListings(120), getPendingListings(120)]);
      const merged = [...pending, ...active];
      setRows(merged);
    } catch (e) {
      showAlert("Алдаа", e?.message || "Зарын жагсаалт ачаалахад алдаа гарлаа");
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
      keyExtractor={(item, i) => `${item.id}-${i}`}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#ea580c" />}
      ListEmptyComponent={<Text style={styles.empty}>Зар алга.</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title || "Гарчиггүй"}
          </Text>
          <Text style={styles.meta}>{item.created_by || "-"}</Text>
          <Text style={styles.meta}>{item.status || "active"}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 30 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 30 },
  row: { backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  title: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  meta: { marginTop: 3, color: "#64748b", fontSize: 12 },
});
