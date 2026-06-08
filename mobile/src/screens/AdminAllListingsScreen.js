import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import {
  deleteListing,
  getLatestListings,
  getPendingListings,
  updateListing,
} from "../services/listingService";
import { getListingImageUrl } from "../utils/imageUrl";
import { navigateToHomeListing } from "../utils/navigationHelpers";
import { showAlert } from "../utils/showAlert";
import { notifyListingBadgeRefresh } from "../utils/listingBadgeEvents.js";

function typeLabel(listingType) {
  if (listingType === "vip") return "VIP";
  if (listingType === "featured") return "Онцгой";
  return null;
}

function statusStyle(status) {
  if (status === "pending") return styles.statusPending;
  if (status === "rejected") return styles.statusRejected;
  if (status === "sold") return styles.statusSold;
  return styles.statusActive;
}

export default function AdminAllListingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const [active, pending] = await Promise.all([getLatestListings(120), getPendingListings(120)]);
      const seen = new Set();
      const merged = [];
      for (const row of [...pending, ...active]) {
        const id = String(row?.id ?? "");
        if (!id || seen.has(id)) continue;
        seen.add(id);
        merged.push(row);
      }
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

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.title ?? "").toLowerCase().includes(q) ||
        String(r.created_by ?? "").toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  const removeFromRows = useCallback((id) => {
    setRows((prev) => prev.filter((r) => String(r.id) !== String(id)));
  }, []);

  const handleDelete = useCallback(
    (item) => {
      const title = item.title || "Гарчиггүй";
      showAlert(
        "Устгах уу?",
        `"${title}" зарыг бүрмөсөн устгана. Энэ үйлдлийг буцаах боломжгүй.`,
        [
          { text: "Цуцлах", style: "cancel" },
          {
            text: "Устгах",
            style: "destructive",
            onPress: async () => {
              setBusyId(item.id);
              try {
                await deleteListing(item.id);
                removeFromRows(item.id);
                notifyListingBadgeRefresh();
              } catch (e) {
                showAlert("Алдаа", e?.message || "Устгаж чадсангүй");
              } finally {
                setBusyId("");
              }
            },
          },
        ]
      );
    },
    [removeFromRows]
  );

  const handleMakeVIP = useCallback(
    (item) => {
      const title = item.title || "Гарчиггүй";
      showAlert(
        "VIP болгох",
        `"${title}"-г VIP зар болгох уу? 30 хоногийн турш идэвхтэй болно.`,
        [
          { text: "Цуцлах", style: "cancel" },
          {
            text: "VIP болгох",
            onPress: async () => {
              setBusyId(item.id);
              try {
                const exp = new Date();
                exp.setDate(exp.getDate() + 30);
                await updateListing(item.id, {
                  listing_type: "vip",
                  listing_type_expires: exp.toISOString(),
                });
                setRows((prev) =>
                  prev.map((r) =>
                    String(r.id) === String(item.id)
                      ? {
                          ...r,
                          listing_type: "vip",
                          listing_type_expires: exp.toISOString(),
                        }
                      : r
                  )
                );
                showAlert("Амжилттай", "VIP болголоо.");
              } catch (e) {
                showAlert("Алдаа", e?.message || "Шинэчилж чадсангүй");
              } finally {
                setBusyId("");
              }
            },
          },
        ]
      );
    },
    []
  );

  const handleMakeFeatured = useCallback(
    (item) => {
      const title = item.title || "Гарчиггүй";
      showAlert(
        "Онцгой болгох",
        `"${title}"-г онцгой зар болгох уу? 30 хоногийн турш идэвхтэй болно.`,
        [
          { text: "Цуцлах", style: "cancel" },
          {
            text: "Онцгой болгох",
            onPress: async () => {
              setBusyId(item.id);
              try {
                const exp = new Date();
                exp.setDate(exp.getDate() + 30);
                await updateListing(item.id, {
                  listing_type: "featured",
                  listing_type_expires: exp.toISOString(),
                });
                setRows((prev) =>
                  prev.map((r) =>
                    String(r.id) === String(item.id)
                      ? {
                          ...r,
                          listing_type: "featured",
                          listing_type_expires: exp.toISOString(),
                        }
                      : r
                  )
                );
                showAlert("Амжилттай", "Онцгой болголоо.");
              } catch (e) {
                showAlert("Алдаа", e?.message || "Шинэчилж чадсангүй");
              } finally {
                setBusyId("");
              }
            },
          },
        ]
      );
    },
    []
  );

  const listHeader = (
    <View style={styles.searchWrap}>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Гарчиг эсвэл имэйлээр хайх…"
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.searchMeta}>
        {filteredRows.length} / {rows.length} зар
      </Text>
    </View>
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
      data={filteredRows}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={listHeader}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#ea580c" />
      }
      ListEmptyComponent={<Text style={styles.empty}>Зар олдсонгүй.</Text>}
      renderItem={({ item }) => {
        const uri = item.images?.[0] ? getListingImageUrl(item.images[0], "w400") : "";
        const busy = String(busyId) === String(item.id);
        const badge = typeLabel(item.listing_type);
        return (
          <View style={styles.card}>
            <Pressable
              style={styles.row}
              onPress={() => navigateToHomeListing(navigation, item.id)}
              disabled={busy}
            >
              {uri ? (
                <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, styles.ph]} />
              )}
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title || "Гарчиггүй"}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.created_by || "-"}
                </Text>
                <View style={styles.badgeRow}>
                  <Text style={[styles.statusBadge, statusStyle(item.status)]}>
                    {item.status || "active"}
                  </Text>
                  {badge ? <Text style={styles.typeBadge}>{badge}</Text> : null}
                </View>
                <Text style={styles.price}>
                  {item.price ? `₩${Number(item.price).toLocaleString("ko-KR")}` : "Үнэ тохирно"}
                </Text>
              </View>
            </Pressable>
            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, styles.vipBtn, busy && styles.disabled]}
                onPress={() => handleMakeVIP(item)}
                disabled={busy}
              >
                <Text style={styles.btnText}>VIP</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.featuredBtn, busy && styles.disabled]}
                onPress={() => handleMakeFeatured(item)}
                disabled={busy}
              >
                <Text style={styles.btnText}>Онцгой</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.delBtn, busy && styles.disabled]}
                onPress={() => handleDelete(item)}
                disabled={busy}
              >
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
  searchWrap: { marginBottom: 12 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  searchMeta: { marginTop: 6, fontSize: 12, color: "#64748b" },
  empty: { textAlign: "center", color: "#64748b", marginTop: 30 },
  card: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 12, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 10 },
  thumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: "#e5e7eb" },
  ph: { backgroundColor: "#e5e7eb" },
  body: { flex: 1, marginLeft: 10, minWidth: 0 },
  title: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  meta: { marginTop: 2, fontSize: 12, color: "#64748b" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  statusBadge: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  statusPending: { backgroundColor: "#fef3c7", color: "#b45309" },
  statusActive: { backgroundColor: "#dcfce7", color: "#15803d" },
  statusRejected: { backgroundColor: "#fee2e2", color: "#b91c1c" },
  statusSold: { backgroundColor: "#e2e8f0", color: "#475569" },
  typeBadge: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#ede9fe",
    color: "#6d28d9",
  },
  price: { marginTop: 4, fontSize: 14, color: "#ea580c", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8, paddingHorizontal: 10, paddingBottom: 10 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: "center" },
  vipBtn: { backgroundColor: "#7c3aed" },
  featuredBtn: { backgroundColor: "#2563eb" },
  delBtn: { backgroundColor: "#64748b" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  disabled: { opacity: 0.6 },
});
