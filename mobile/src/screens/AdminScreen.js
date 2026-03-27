import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Modal,
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
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import {
  getListingAutoApprove,
  setListingAutoApprove,
} from "../services/appConfigService";
import {
  deleteListing,
  getPendingListings,
  updateListing,
} from "../services/listingService";
import { getUnreadMessagesCount } from "../services/conversationService";
import { getListingImageUrl } from "../utils/imageUrl";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { getBottomTabNavigator, navigateToHomeListing } from "../utils/navigationHelpers";
import { showAlert } from "../utils/showAlert";

const IMG_H = 100;
const AUTO_APPROVE_KEY = "admin_auto_approve_listings";

export default function AdminScreen({ navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { email } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [actioningId, setActioningId] = useState(null);
  const [autoApprove, setAutoApprove] = useState(false);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTitle, setInfoTitle] = useState("");
  const [infoText, setInfoText] = useState("");

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

  const loadAdminStats = useCallback(async () => {
    try {
      const reportsQ = query(collection(db, "listing_reports"), where("status", "==", "pending"));
      const usersRef = collection(db, "users");
      const [reportsSnap, usersSnap, unread] = await Promise.all([
        getCountFromServer(reportsQ),
        getCountFromServer(usersRef),
        email ? getUnreadMessagesCount(email) : Promise.resolve(0),
      ]);
      setPendingReportsCount(reportsSnap.data().count || 0);
      setUsersCount(usersSnap.data().count || 0);
      setUnreadMessagesCount(unread || 0);
    } catch {
      setPendingReportsCount(0);
      setUnreadMessagesCount(0);
      setUsersCount(0);
    }
  }, [email]);

  const showInfo = useCallback((title, text) => {
    setInfoTitle(title || "Мэдэгдэл");
    setInfoText(text || "");
    setInfoOpen(true);
  }, []);

  const showMobileComingSoon = useCallback(() => {
    showInfo("Тун удахгүй", "Энэ админ цэсийг mobile дотор нэмэхээр ажиллаж байна.");
  }, [showInfo]);

  const openMessagesTab = useCallback(() => {
    const tab = getBottomTabNavigator(navigation);
    if (tab?.navigate) tab.navigate("MessagesTab");
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      load(false);
      loadAdminStats();
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          load(false);
          loadAdminStats();
        }
      });
      const t = autoApprove
        ? setInterval(() => {
            if (AppState.currentState !== "active") return;
            load(true);
          loadAdminStats();
          }, 25000)
        : null;
      return () => {
        if (t) clearInterval(t);
        sub.remove();
      };
    }, [load, autoApprove, loadAdminStats])
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
    <>
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
          <View style={styles.menuCardList}>
            <Pressable
              style={styles.menuCard}
              onPress={() => {
                navigation.navigate("AdminNewListings");
              }}
            >
              <View style={styles.menuHead}>
                <View style={[styles.menuIconWrap, { backgroundColor: "#fef3c7" }]}>
                  <Ionicons name="time-outline" size={22} color="#d97706" />
                </View>
                <View style={styles.menuHeadText}>
                  <Text style={styles.menuTitle}>Шинэ зарууд</Text>
                  <Text style={styles.menuSub}>Батлах хүлээгдэж буй зар</Text>
                </View>
              </View>
              <View style={styles.menuFooter}>
                <Text style={styles.menuFooterText}>
                  {rows.length > 0 ? `${rows.length} хүлээгдэж буй зар` : "Шинэ зар алга"}
                </Text>
              </View>
            </Pressable>

            <Pressable style={styles.menuCard} onPress={() => navigation.navigate("AdminAllListings")}>
              <View style={styles.menuHead}>
                <View style={[styles.menuIconWrap, { backgroundColor: "#dbeafe" }]}>
                  <Ionicons name="list-outline" size={22} color="#2563eb" />
                </View>
                <View style={styles.menuHeadText}>
                  <Text style={styles.menuTitle}>Бүх зарууд</Text>
                  <Text style={styles.menuSub}>Бүх зарын жагсаалт</Text>
                </View>
              </View>
              <View style={styles.menuFooter}>
                <Text style={styles.menuFooterText}>Хайх, устгах, засах, онцгой/VIP болгох</Text>
              </View>
            </Pressable>

            <Pressable style={styles.menuCard} onPress={() => navigation.navigate("AdminBanners")}>
              <View style={styles.menuHead}>
                <View style={[styles.menuIconWrap, { backgroundColor: "#ede9fe" }]}>
                  <Ionicons name="settings-outline" size={22} color="#7c3aed" />
                </View>
                <View style={styles.menuHeadText}>
                  <Text style={styles.menuTitle}>Баннер удирдах</Text>
                  <Text style={styles.menuSub}>Нүүр хуудасны баннер зар</Text>
                </View>
              </View>
              <View style={styles.menuFooter}>
                <Text style={styles.menuFooterText}>Баннер зар нэмэх, засах, устгах</Text>
              </View>
            </Pressable>

            <Pressable style={styles.menuCard} onPress={() => navigation.navigate("AdminBannerRequests")}>
              <View style={styles.menuHead}>
                <View style={[styles.menuIconWrap, { backgroundColor: "#dcfce7" }]}>
                  <Ionicons name="shield-checkmark-outline" size={22} color="#16a34a" />
                </View>
                <View style={styles.menuHeadText}>
                  <Text style={styles.menuTitle}>Баннер хүсэлтүүд</Text>
                  <Text style={styles.menuSub}>Хэрэглэгчдийн баннер зарын хүсэлт</Text>
                </View>
              </View>
              <View style={styles.menuFooter}>
                <Text style={styles.menuFooterText}>Хүсэлтүүдийг батлах, татгалзах</Text>
              </View>
            </Pressable>

            <Pressable style={styles.menuCard} onPress={() => navigation.navigate("AdminListingReports")}>
              <View style={styles.menuHead}>
                <View style={[styles.menuIconWrap, { backgroundColor: "#fee2e2" }]}>
                  <Ionicons name="flag-outline" size={22} color="#dc2626" />
                </View>
                <View style={styles.menuHeadText}>
                  <Text style={styles.menuTitle}>Зарын гомдол</Text>
                  <Text style={styles.menuSub}>Хэрэглэгчийн санал, гомдлын шалгалт</Text>
                </View>
              </View>
              <View style={styles.menuFooter}>
                <Text style={styles.menuFooterText}>
                  {pendingReportsCount > 0 ? `${pendingReportsCount} шинэ гомдол` : "Шинэ гомдол алга"}
                </Text>
              </View>
            </Pressable>

            <Pressable style={styles.menuCard} onPress={openMessagesTab}>
              <View style={styles.menuHead}>
                <View style={[styles.menuIconWrap, { backgroundColor: "#dbeafe" }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color="#2563eb" />
                </View>
                <View style={styles.menuHeadText}>
                  <Text style={styles.menuTitle}>Мессеж унших, хариу бичих</Text>
                  <Text style={styles.menuSub}>Хэрэглэгчдээс ирсэн мессежид хариу өгөх</Text>
                </View>
              </View>
              <View style={styles.menuFooter}>
                <Text style={styles.menuFooterText}>
                  {unreadMessagesCount > 0
                    ? `${unreadMessagesCount} уншаагүй мессеж байна`
                    : "Мессежийн жагсаалт руу орох"}
                </Text>
              </View>
            </Pressable>

            <Pressable style={styles.menuCard} onPress={() => navigation.navigate("AdminBroadcast")}>
              <View style={styles.menuHead}>
                <View style={[styles.menuIconWrap, { backgroundColor: "#fce7f3" }]}>
                  <Ionicons name="mail-open-outline" size={22} color="#db2777" />
                </View>
                <View style={styles.menuHeadText}>
                  <Text style={styles.menuTitle}>Бүх хэрэглэгчдэд мессеж</Text>
                  <Text style={styles.menuSub}>Бүх хэрэглэгчдэд мессеж илгээх</Text>
                </View>
              </View>
              <View style={styles.menuFooter}>
                <Text style={styles.menuFooterText}>Бүх бүртгэлтэй хэрэглэгчдэд мессеж илгээх</Text>
              </View>
            </Pressable>

            <Pressable style={styles.menuCard} onPress={() => navigation.navigate("AdminUsers")}>
              <View style={styles.menuHead}>
                <View style={[styles.menuIconWrap, { backgroundColor: "#e0e7ff" }]}>
                  <Ionicons name="people-outline" size={22} color="#4f46e5" />
                </View>
                <View style={styles.menuHeadText}>
                  <Text style={styles.menuTitle}>Хэрэглэгч хайх</Text>
                  <Text style={styles.menuSub}>Хэрэглэгч хайх, мэдээлэл үзэх</Text>
                </View>
              </View>
              <View style={styles.menuFooterInline}>
                <Text style={styles.menuFooterText}>Имэйл, нэр, утасны дугаараар хайх</Text>
                <View style={styles.countWrap}>
                  <Text style={styles.countLabel}>Нийт хэрэглэгч</Text>
                  <Text style={styles.countValue}>{usersCount}</Text>
                </View>
              </View>
            </Pressable>
          </View>

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
    <Modal visible={infoOpen} transparent animationType="fade" onRequestClose={() => setInfoOpen(false)}>
      <Pressable style={styles.modalBackdrop} onPress={() => setInfoOpen(false)}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{infoTitle}</Text>
          <Text style={styles.modalText}>{infoText}</Text>
          <Pressable style={styles.modalBtn} onPress={() => setInfoOpen(false)}>
            <Text style={styles.modalBtnText}>Ойлголоо</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  headerWrap: { marginBottom: 16 },
  menuCardList: { gap: 12, marginBottom: 14 },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  menuHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  menuHeadText: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  menuSub: { marginTop: 1, fontSize: 13, color: "#64748b" },
  menuFooter: {
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
    paddingTop: 6,
  },
  menuFooterInline: {
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  menuFooterText: { fontSize: 13, color: "#334155" },
  countWrap: { alignItems: "flex-end" },
  countLabel: { fontSize: 11, color: "#64748b" },
  countValue: { fontSize: 24, lineHeight: 26, fontWeight: "800", color: "#4f46e5" },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  modalText: { fontSize: 15, color: "#334155", lineHeight: 22, marginBottom: 14 },
  modalBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#ea580c",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  modalBtnText: { color: "#fff", fontWeight: "700" },
});
