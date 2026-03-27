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
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext.js";
import { getSavedListingsWithDetails, removeSaved } from "../services/savedListingService";
import { getListingImageUrl } from "../utils/imageUrl";
import { navigateToLogin } from "../utils/navigationHelpers.js";

const IMG_H = 140;

export default function SavedListingsScreen({ navigation }) {
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
      const data = await getSavedListingsWithDetails(email);
      setRows(data);
    } catch (e) {
      showAlert("Алдаа", e?.message || "Ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  async function onUnsave(savedId, title) {
    showAlert("Хасах уу?", title || "Энэ зарыг хадгалснаас хасна", [
      { text: "Цуцлах", style: "cancel" },
      {
        text: "Хасах",
        style: "destructive",
        onPress: async () => {
          try {
            await removeSaved(savedId);
            setRows((prev) => prev.filter((r) => r.savedId !== savedId));
          } catch (e) {
            showAlert("Алдаа", e?.message);
          }
        },
      },
    ]);
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Нэвтэрсний дараа хадгалсан зарууд харагдана.</Text>
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
      keyExtractor={(item) => item.savedId}
      contentContainerStyle={[styles.list, { paddingBottom: 24 + tabBarHeight }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#ea580c" />
      }
      renderItem={({ item }) => {
        const { listing, savedId } = item;
        const first = listing.images?.[0];
        const uri = first ? getListingImageUrl(first, "w400") : "";
        return (
          <View style={styles.card}>
            <Pressable
              onPress={() => navigation.navigate("ListingDetail", { listingId: listing.id })}
              style={styles.cardPress}
            >
              {uri ? (
                <Image source={{ uri }} style={styles.img} contentFit="cover" cachePolicy="memory-disk" />
              ) : (
                <View style={[styles.img, styles.imgPh]}>
                  <Text>📷</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <Text numberOfLines={2} style={styles.title}>
                  {listing.title}
                </Text>
                <Text style={styles.price}>
                  {listing.price ? `₩${Number(listing.price).toLocaleString("ko-KR")}` : "Үнэ тохирно"}
                </Text>
              </View>
            </Pressable>
            <Pressable style={styles.unsave} onPress={() => onUnsave(savedId, listing.title)}>
              <Text style={styles.unsaveText}>Хасах</Text>
            </Pressable>
          </View>
        );
      }}
      ListEmptyComponent={<Text style={styles.empty}>Хадгалсан зар байхгүй.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#f8fafc" },
  muted: { color: "#6b7280", textAlign: "center", marginBottom: 16 },
  btn: { backgroundColor: "#ea580c", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "700" },
  list: { padding: 16, paddingBottom: 32, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  cardPress: { flexDirection: "row" },
  img: { width: 120, height: IMG_H, backgroundColor: "#f3f4f6" },
  imgPh: { alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, padding: 12, justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "600", color: "#111827" },
  price: { fontSize: 15, fontWeight: "700", color: "#ea580c", marginTop: 6 },
  unsave: { paddingVertical: 10, alignItems: "center", borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  unsaveText: { color: "#dc2626", fontWeight: "600" },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
});
