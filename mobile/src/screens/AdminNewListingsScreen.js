import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { deleteListing, getPendingListings, updateListing } from "../services/listingService";
import { getListingImageUrl } from "../utils/imageUrl";
import { navigateToHomeListing } from "../utils/navigationHelpers";
import { showAlert } from "../utils/showAlert";

export default function AdminNewListingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [rows, setRows] = useState([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await getPendingListings(150);
      setRows(data);
    } catch (e) {
      showAlert("Алдаа", e?.message || "Шинэ зар ачаалахад алдаа гарлаа");
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

  const updateStatus = useCallback(async (item, status) => {
    setBusyId(item.id);
    try {
      await updateListing(item.id, { status });
      setRows((prev) => prev.filter((r) => r.id !== item.id));
    } catch (e) {
      showAlert("Алдаа", e?.message || "Төлөв шинэчилж чадсангүй");
    } finally {
      setBusyId("");
    }
  }, []);

  const remove = useCallback(async (item) => {
    setBusyId(item.id);
    try {
      await deleteListing(item.id);
      setRows((prev) => prev.filter((r) => r.id !== item.id));
    } catch (e) {
      showAlert("Алдаа", e?.message || "Устгаж чадсангүй");
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
      ListEmptyComponent={<Text style={styles.empty}>Шинэ зар алга.</Text>}
      renderItem={({ item }) => {
        const uri = item.images?.[0] ? getListingImageUrl(item.images[0], "w400") : "";
        const busy = busyId === item.id;
        return (
          <View style={styles.card}>
            <Pressable style={styles.row} onPress={() => navigateToHomeListing(navigation, item.id)}>
              {uri ? (
                <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, styles.ph]} />
              )}
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title || "Гарчиггүй"}
                </Text>
                <Text style={styles.price}>
                  {item.price ? `₩${Number(item.price).toLocaleString("ko-KR")}` : "Үнэ тохирно"}
                </Text>
              </View>
            </Pressable>
            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.ok, busy && styles.disabled]} onPress={() => updateStatus(item, "active")} disabled={busy}>
                <Text style={styles.btnText}>Батлах</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.reject, busy && styles.disabled]} onPress={() => updateStatus(item, "rejected")} disabled={busy}>
                <Text style={styles.btnText}>Татгалзах</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.del, busy && styles.disabled]} onPress={() => remove(item)} disabled={busy}>
                <Text style={styles.btnText}>Устгах</Text>
              </Pressable>
            </View>
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
  card: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 12, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 10 },
  thumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: "#e5e7eb" },
  ph: { backgroundColor: "#e5e7eb" },
  body: { flex: 1, marginLeft: 10 },
  title: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  price: { marginTop: 4, fontSize: 14, color: "#ea580c", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8, paddingHorizontal: 10, paddingBottom: 10 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: "center" },
  ok: { backgroundColor: "#22c55e" },
  reject: { backgroundColor: "#ef4444" },
  del: { backgroundColor: "#64748b" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  disabled: { opacity: 0.6 },
});
