import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import {
  getListingAutoApprove,
  setListingAutoApprove,
} from "../services/appConfigService";
import {
  deleteListing,
  getPendingListings,
  updateListing,
} from "../services/listingService";
import { getListingImageUrl } from "../utils/imageUrl";
import { navigateToHomeListing } from "../utils/navigationHelpers";
import { showAlert } from "../utils/showAlert";

const IMG_H = 100;
const AUTO_APPROVE_KEY = "admin_auto_approve_listings";

export default function AdminScreen({ navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [actioningId, setActioningId] = useState(null);
  const [autoApprove, setAutoApprove] = useState(false);

  useEffect(() => {
    getListingAutoApprove()
      .then((v) => setAutoApprove(v))
      .catch(() => {
        AsyncStorage.getItem(AUTO_APPROVE_KEY).then((s) =>
          setAutoApprove(s === "true")
        );
      });
  }, []);

  const handleAutoApproveChange = useCallback((value) => {
    setAutoApprove(value);
    AsyncStorage.setItem(AUTO_APPROVE_KEY, String(value));
    setListingAutoApprove(value).catch(() => {});
  }, []);

  const load = useCallback(
    async (isRefresh) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const data = await getPendingListings();
        setRows(data);
        if (autoApprove && data.length > 0) {
          for (const item of data) {
            try {
              await updateListing(item.id, { status: "active" });
            } catch {
              /* skip on error */
            }
          }
          setRows([]);
        }
      } catch (e) {
        showAlert("Алдаа", e?.message || "Ачаалахад алдаа гарлаа");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [autoApprove]
  );

  useFocusEffect(
    useCallback(() => {
      load(false);
      if (!autoApprove) return;
      const t = setInterval(() => load(true), 15000);
      return () => clearInterval(t);
    }, [load, autoApprove])
  );

  useEffect(() => {
    if (autoApprove && rows.length > 0) {
      const approveAll = async () => {
        for (const item of rows) {
          try {
            await updateListing(item.id, { status: "active" });
          } catch {
            /* skip */
          }
        }
        setRows([]);
      };
      approveAll();
    }
  }, [autoApprove]);

  const handleApprove = useCallback(
    async (item) => {
      setActioningId(item.id);
      try {
        await updateListing(item.id, { status: "active" });
        setRows((prev) => prev.filter((r) => r.id !== item.id));
      } catch (e) {
        showAlert("Алдаа", e?.message || "Батлахад алдаа гарлаа");
      } finally {
        setActioningId(null);
      }
    },
    []
  );

  const handleReject = useCallback(
    (item) => {
      showAlert(
        "Татгалзах уу?",
        `"${item.title || "Гарчиггүй"}" зарыг татгалзах уу?`,
        [
          { text: "Үгүй", style: "cancel" },
          {
            text: "Татгалзах",
            style: "destructive",
            onPress: async () => {
              setActioningId(item.id);
              try {
                await updateListing(item.id, { status: "rejected" });
                setRows((prev) => prev.filter((r) => r.id !== item.id));
              } catch (e) {
                showAlert("Алдаа", e?.message || "Татгалзахад алдаа гарлаа");
              } finally {
                setActioningId(null);
              }
            },
          },
        ]
      );
    },
    []
  );

  const handleDelete = useCallback(
    (item) => {
      showAlert(
        "Устгах уу?",
        `"${item.title || "Гарчиггүй"}" зарыг устгана уу?`,
        [
          { text: "Үгүй", style: "cancel" },
          {
            text: "Устгах",
            style: "destructive",
            onPress: async () => {
              setActioningId(item.id);
              try {
                await deleteListing(item.id);
                setRows((prev) => prev.filter((r) => r.id !== item.id));
              } catch (e) {
                showAlert("Алдаа", e?.message || "Устгаж чадсангүй");
              } finally {
                setActioningId(null);
              }
            },
          },
        ]
      );
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

  return (
    <FlatList
      scrollEventThrottle={16}
      data={rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, { paddingBottom: 24 + tabBarHeight }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor="#ea580c"
        />
      }
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <View style={styles.autoApproveRow}>
            <Text style={styles.autoApproveLabel}>Автоматаар зөвшөөрөх</Text>
            <Switch
              value={autoApprove}
              onValueChange={handleAutoApproveChange}
              trackColor={{ false: "#d1d5db", true: "#22c55e" }}
              thumbColor="#fff"
            />
          </View>
          {rows.length > 0 ? (
            <View style={styles.header}>
              <Ionicons name="shield" size={24} color="#ea580c" />
              <Text style={styles.headerText}>
                {rows.length} батлах хүлээгдэж буй зар
              </Text>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
          <Text style={styles.emptyText}>Шинэ зар байхгүй байна</Text>
        </View>
      }
      renderItem={({ item }) => {
        const img = Array.isArray(item.images) ? item.images[0] : null;
        const uri = img ? getListingImageUrl(img, "w400") : "";
        const busy = actioningId === item.id;

        return (
          <View style={styles.row}>
            <Pressable
              style={styles.rowMain}
              onPress={() => navigateToHomeListing(navigation, item.id)}
            >
              {uri ? (
                <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbPh]}>
                  <Text style={styles.thumbPhText}>📷</Text>
                </View>
              )}
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title || "Гарчиггүй"}
                </Text>
                <Text style={styles.price}>
                  {item.price
                    ? `₩${Number(item.price).toLocaleString("ko-KR")}`
                    : "Үнэ тохирно"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleApprove(item)}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Батлах</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleReject(item)}
                disabled={busy}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Татгалзах</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleDelete(item)}
                disabled={busy}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  headerWrap: { marginBottom: 16 },
  autoApproveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fef3c7",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  autoApproveLabel: { fontSize: 15, fontWeight: "600", color: "#92400e" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  headerText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  empty: {
    padding: 48,
    alignItems: "center",
  },
  emptyText: { fontSize: 16, color: "#6b7280", marginTop: 12 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  thumb: { width: 80, height: IMG_H, backgroundColor: "#e5e7eb", borderRadius: 8 },
  thumbPh: { alignItems: "center", justifyContent: "center" },
  thumbPhText: { fontSize: 24, opacity: 0.5 },
  body: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: "600", color: "#111827" },
  price: { fontSize: 14, fontWeight: "700", color: "#ea580c", marginTop: 4 },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    padding: 8,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveBtn: { backgroundColor: "#22c55e" },
  rejectBtn: { backgroundColor: "#ef4444" },
  deleteBtn: { flex: 0, paddingHorizontal: 14, backgroundColor: "#6b7280" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
