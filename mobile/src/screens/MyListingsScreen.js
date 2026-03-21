import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { deleteListing, getListingsByCreator } from "../services/listingService.js";
import { getListingImageUrl } from "../utils/imageUrl.js";
import { navigateToLogin, navigateToCreateListing, navigateToHomeListing } from "../utils/navigationHelpers.js";
import { showAlert } from "../utils/showAlert.js";

const IMG_H = 120;

const statusLabel = { active: "Идэвхтэй", pending: "Хүлээгдэж буй" };

export default function MyListingsScreen({ navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { email, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);

  const load = useCallback(async (isRefresh) => {
    if (!email) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await getListingsByCreator(email);
      setRows(data);
    } catch (e) {
      showAlert("Алдаа", e?.message || "Ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [email]);

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
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#ea580c" />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Миний зар байхгүй.</Text>
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
          <Pressable
            style={styles.row}
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
            <Pressable
              style={styles.deleteBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#dc2626" />
            </Pressable>
          </Pressable>
        );
      }}
    />
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
  addBtn: { backgroundColor: "#ea580c", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
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
  deleteBtn: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
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
});
