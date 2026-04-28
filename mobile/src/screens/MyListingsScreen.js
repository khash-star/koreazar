import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext.js";
import {
  deleteListing,
  getListingsByCreator,
  getListingsByCustomerId,
  updateListing,
} from "../services/listingService.js";
import { getListingImageUrl } from "../utils/imageUrl.js";
import {
  navigateToLogin,
  navigateToCreateListing,
  navigateToHomeListing,
  navigateToEditListing,
} from "../utils/navigationHelpers.js";
import { showAlert } from "../utils/showAlert";

const IMG_H = 120;

const statusLabel = { active: "Идэвхтэй", pending: "Хүлээгдэж буй" };
const MY_LISTINGS_CACHE_TTL_MS = 60 * 1000;
const myListingsCache = new Map();

export default function MyListingsScreen({ navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { email, isAuthenticated, isAdmin, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [menuItem, setMenuItem] = useState(null);

  const load = useCallback(async (isRefresh) => {
    if (!email) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError("");
      const customerIdRaw = userData?.customerId ?? userData?.customer_id;
      const customerId =
        customerIdRaw != null && customerIdRaw !== "" ? Number(customerIdRaw) : null;
      const cacheKey = Number.isFinite(customerId) && customerId > 0 ? `cid:${customerId}` : `email:${email}`;
      const cached = myListingsCache.get(cacheKey);
      if (
        !isRefresh &&
        cached?.data &&
        Date.now() - (cached.at || 0) < MY_LISTINGS_CACHE_TTL_MS &&
        Array.isArray(cached.data)
      ) {
        // Эхлээд кэшээ шууд үзүүлээд, ард нь шинэ өгөгдөл татна.
        setRows(cached.data);
        setLoading(false);
      }
      let data = [];

      // MySQL primary key-аар шүүх нь ихэвчлэн хурдан, тогтвортой.
      if (Number.isFinite(customerId) && customerId > 0) {
        try {
          data = await getListingsByCustomerId(customerId, 20, {
            timeoutMs: 12000,
            retries: 1,
            retryDelayMs: 300,
          });
        } catch {
          data = await getListingsByCreator(email, 20, {
            timeoutMs: 12000,
            retries: 1,
            retryDelayMs: 300,
          });
        }
      } else {
        data = await getListingsByCreator(email, 20, {
          timeoutMs: 12000,
          retries: 1,
          retryDelayMs: 300,
        });
      }
      setRows(data);
      myListingsCache.set(cacheKey, { at: Date.now(), data });
    } catch (e) {
      const msg = e?.message || "Ачаалахад алдаа гарлаа";
      setLoadError(msg);
      if (rows.length === 0) showAlert("Алдаа", msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [email, userData?.customerId, userData?.customer_id, rows.length]);

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
              try {
                await deleteListing(item.id);
                load(false);
              } catch (e) {
                showAlert("Алдаа", e?.message || "Устгаж чадсангүй");
              }
            },
          },
        ]
      );
    },
    [load]
  );

  const openActions = useCallback((item) => setMenuItem(item), []);

  const closeActions = useCallback(() => setMenuItem(null), []);
  const closeActionsThen = useCallback(
    (next) => {
      closeActions();
      // RN Web + Modal: avoid aria-hidden focus warning by blurring before route change/dialog.
      if (typeof document !== "undefined" && document?.activeElement?.blur) {
        document.activeElement.blur();
      }
      setTimeout(() => {
        if (typeof next === "function") next();
      }, 0);
    },
    [closeActions]
  );

  const handleReactivateListing = useCallback(async () => {
    if (!menuItem || menuItem.status !== "sold") return;
    try {
      await updateListing(menuItem.id, { status: "active" });
      closeActions();
      load(false);
    } catch (e) {
      showAlert("Алдаа", e?.message || "Төлөв шинэчилж чадсангүй");
    }
  }, [menuItem, closeActions, load]);

  const handleMakeVIP = useCallback(() => {
    if (!menuItem?.id) return;
    const id = menuItem.id;
    const title = menuItem.title || "Зар";
    closeActions();
    showAlert(
      "VIP болгох",
      `"${title}"-г VIP зар болгох уу? 7 хоногийн турш идэвхтэй болно.`,
      [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "VIP болгох",
          onPress: async () => {
            try {
              const exp = new Date();
              exp.setDate(exp.getDate() + 7);
              await updateListing(id, {
                listing_type: "vip",
                listing_type_expires: exp.toISOString(),
              });
              load(false);
              showAlert("Амжилттай", "VIP болголоо.");
            } catch (e) {
              showAlert("Алдаа", e?.message || "Шинэчилж чадсангүй");
            }
          },
        },
      ]
    );
  }, [menuItem, closeActions, load]);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Нэвтэрсний дараа миний зарууд харагдана.</Text>
        <Pressable style={styles.btn} onPress={() => navigateToLogin(navigation)}>
          <Text style={styles.btnText}>Нэвтрэх</Text>
        </Pressable>
      </View>
    );
  }

  if (loading && !refreshing && rows.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <>
    <FlatList
      scrollEventThrottle={16}
      data={rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, { paddingBottom: 24 + tabBarHeight }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#ea580c" />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{loadError ? "Ачаалж чадсангүй." : "Миний зар байхгүй."}</Text>
          {loadError ? (
            <>
              <Text style={styles.errorText}>{loadError}</Text>
              <Pressable style={styles.retryBtn} onPress={() => load(false)}>
                <Text style={styles.retryBtnText}>Дахин оролдох</Text>
              </Pressable>
            </>
          ) : null}
          <Pressable
            style={styles.addBtn}
            onPress={() => navigateToCreateListing(navigation)}
          >
            <Text style={styles.addBtnText}>Зар нэмэх</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => {
        const img = Array.isArray(item.images) ? item.images[0] : null;
        const uri = img ? getListingImageUrl(img, "w400") : "";
        const status = statusLabel[item.status] || item.status;
        return (
          <View style={styles.row}>
            <Pressable
              style={styles.mainPress}
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
                  {item.price ? `₩${Number(item.price).toLocaleString("ko-KR")}` : "Үнэ тохирно"}
                </Text>
                <View style={[styles.badge, item.status === "pending" && styles.badgePending]}>
                  <Text style={styles.badgeText}>{status}</Text>
                </View>
              </View>
            </Pressable>
            <View style={styles.trailingCol}>
              <Pressable
                style={styles.visibleBtn}
                onPress={() => navigateToEditListing(navigation, item.id)}
                hitSlop={6}
              >
                <Text style={styles.visibleBtnText}>Засах</Text>
              </Pressable>
              <Pressable
                style={[styles.visibleBtn, styles.visibleBtnDanger]}
                onPress={() => handleDelete(item)}
                hitSlop={6}
              >
                <Text style={styles.visibleBtnDangerText}>Устгах</Text>
              </Pressable>
              <Pressable style={styles.menuBtn} onPress={() => openActions(item)} hitSlop={8}>
                <Ionicons name="ellipsis-vertical" size={20} color="#111827" />
              </Pressable>
            </View>
          </View>
        );
      }}
    />
    {rows.length > 0 && loadError ? (
      <View style={styles.inlineErrorWrap}>
        <Text style={styles.inlineErrorText}>{loadError}</Text>
        <Pressable onPress={() => load(true)} hitSlop={8}>
          <Text style={styles.inlineRetryText}>Дахин</Text>
        </Pressable>
      </View>
    ) : null}
    <Modal visible={!!menuItem} transparent animationType="fade" onRequestClose={closeActions}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeActions} accessibilityRole="button" />
        <View style={styles.modalCardWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{menuItem?.title || "Зар"}</Text>
            <Pressable
              style={styles.modalItem}
              onPress={() => {
                if (!menuItem) return;
                closeActionsThen(() => navigateToHomeListing(navigation, menuItem.id));
              }}
            >
              <Text style={styles.modalItemText}>Харах</Text>
            </Pressable>
            <Pressable
              style={styles.modalItem}
              onPress={() => {
                if (isAdmin) {
                  handleMakeVIP();
                  return;
                }
                closeActionsThen(() =>
                  showAlert(
                    "VIP хүсэлт",
                    "VIP болгох хүсэлт зөвхөн админаар баталгаажна. Админ руу мессежээр хүсэлт илгээнэ үү."
                  )
                );
              }}
            >
              <Text style={styles.modalItemText}>{isAdmin ? "VIP болгох" : "VIP хүсэлт"}</Text>
            </Pressable>
            {menuItem?.status === "sold" ? (
              <Pressable style={styles.modalItem} onPress={handleReactivateListing}>
                <Text style={styles.modalItemText}>Идэвхжүүлэх</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.modalCancelBtn} onPress={closeActions}>
              <Text style={styles.modalCancelText}>Цуцлах</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { fontSize: 15, color: "#6b7280", marginBottom: 16, textAlign: "center" },
  btn: { backgroundColor: "#ea580c", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  empty: { padding: 32, alignItems: "center" },
  emptyText: { fontSize: 16, color: "#6b7280", marginBottom: 16 },
  errorText: { fontSize: 13, color: "#ef4444", textAlign: "center", marginBottom: 10 },
  retryBtn: { borderWidth: 1, borderColor: "#fdba74", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 12 },
  retryBtnText: { color: "#c2410c", fontWeight: "700" },
  addBtn: { backgroundColor: "#ea580c", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  inlineErrorWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 10,
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inlineErrorText: { color: "#9a3412", fontSize: 12, flex: 1, marginRight: 8 },
  inlineRetryText: { color: "#c2410c", fontSize: 13, fontWeight: "800" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  mainPress: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  trailingCol: {
    justifyContent: "center",
    alignItems: "stretch",
    paddingRight: 10,
    paddingVertical: 8,
    gap: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#f1f5f9",
    minWidth: 76,
  },
  visibleBtn: {
    borderWidth: 1,
    borderColor: "#fdba74",
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  visibleBtnText: { fontSize: 13, fontWeight: "700", color: "#c2410c" },
  visibleBtnDanger: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  visibleBtnDangerText: { fontSize: 13, fontWeight: "700", color: "#dc2626" },
  menuBtn: {
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: { width: 100, height: IMG_H, backgroundColor: "#e5e7eb" },
  thumbPh: { alignItems: "center", justifyContent: "center" },
  thumbPhText: { fontSize: 28, opacity: 0.5 },
  body: { flex: 1, padding: 12, justifyContent: "space-between" },
  title: { fontSize: 15, fontWeight: "600", color: "#111827" },
  price: { fontSize: 14, fontWeight: "700", color: "#ea580c", marginTop: 4 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#22c55e",
  },
  badgePending: { backgroundColor: "#f59e0b" },
  badgeText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCardWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    padding: 24,
    pointerEvents: "box-none",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  modalItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  modalItemText: { color: "#111827", fontSize: 15, fontWeight: "500" },
  modalCancelBtn: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 11,
    alignItems: "center",
  },
  modalCancelText: { color: "#374151", fontWeight: "600" },
});
