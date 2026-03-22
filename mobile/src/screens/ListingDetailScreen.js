import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { getListingById } from "../services/listingService";
import { findSavedDocId, removeSaved, saveListing } from "../services/savedListingService";
import { getListingImageUrl } from "../utils/imageUrl";
import { toDate } from "../utils/firestoreDates";
import { conditionLabels } from "../constants/listings";
import { useAuth } from "../context/AuthContext.js";
import { navigateToLogin, navigateToMessagesChat } from "../utils/navigationHelpers.js";

const { width: SCREEN_W } = Dimensions.get("window");
const GALLERY_H = Math.round(SCREEN_W * (2 / 3));

export default function ListingDetailScreen({ route, navigation }) {
  const { listingId } = route?.params ?? {};
  const { email, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listing, setListing] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [savedDocId, setSavedDocId] = useState(null);
  const [saveBusy, setSaveBusy] = useState(false);

  const refreshSaved = useCallback(async () => {
    if (!email || !listingId) {
      setSavedDocId(null);
      return;
    }
    try {
      const id = await findSavedDocId(email, listingId);
      setSavedDocId(id);
    } catch {
      setSavedDocId(null);
    }
  }, [email, listingId]);

  useFocusEffect(
    useCallback(() => {
      refreshSaved();
    }, [refreshSaved])
  );

  const load = useCallback(async () => {
    if (!listingId) {
      setError("Зарын ID байхгүй");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getListingById(listingId);
      if (!data) {
        setError("Зар олдсонгүй");
        setListing(null);
      } else {
        setListing(data);
        setError("");
        navigation.setOptions({ title: data.title?.slice(0, 28) || "Зар" });
      }
    } catch (e) {
      setError(e?.message || "Ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, [listingId, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Зар олдсонгүй"}</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Дахин оролдох</Text>
        </Pressable>
      </View>
    );
  }

  const images = Array.isArray(listing.images) ? listing.images : [];
  const mainImg = images[imageIndex];
  const mainUri = mainImg ? getListingImageUrl(mainImg, "w800") : "";

  const formatPrice = () => {
    if (!listing.price) return "Үнэ тохирно";
    const n = Number(listing.price);
    return `₩${n.toLocaleString("ko-KR")}${listing.is_negotiable ? " (тохирно)" : ""}`;
  };

  const created = toDate(listing.created_date);

  async function toggleSave() {
    if (!isAuthenticated || !email) {
      Alert.alert("Нэвтрэх", "Зар хадгалахын тулд нэвтэрнэ үү", [
        { text: "Цуцлах", style: "cancel" },
        { text: "Нэвтрэх", onPress: () => navigateToLogin(navigation) },
      ]);
      return;
    }
    setSaveBusy(true);
    try {
      if (savedDocId) {
        await removeSaved(savedDocId);
        setSavedDocId(null);
      } else {
        const row = await saveListing(listing.id);
        setSavedDocId(row.id);
      }
    } catch (e) {
      Alert.alert("Алдаа", e?.message || "Амжилтгүй");
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {mainUri ? (
        <View style={styles.galleryWrap}>
          <Image
            source={{ uri: mainUri }}
            style={[styles.hero, { height: GALLERY_H }]}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbRow}
              contentContainerStyle={styles.thumbRowInner}
            >
              {images.map((img, i) => {
                const uri = getListingImageUrl(img, "w150");
                if (!uri) return null;
                return (
                  <Pressable key={i} onPress={() => setImageIndex(i)}>
                    <Image
                      source={{ uri }}
                      style={[styles.thumb, i === imageIndex && styles.thumbActive]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : (
        <View style={[styles.placeholder, { height: GALLERY_H }]}>
          <Text style={styles.placeholderText}>Зураг байхгүй</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.badgeRow}>
          {listing.listing_type === "vip" && (
            <View style={[styles.badge, styles.badgeVip]}>
              <Text style={styles.badgeText}>VIP</Text>
            </View>
          )}
          {listing.listing_type === "featured" && listing.listing_type !== "vip" && (
            <View style={[styles.badge, styles.badgeFeat]}>
              <Text style={styles.badgeText}>Онцгой</Text>
            </View>
          )}
          {listing.condition && conditionLabels[listing.condition] && (
            <View style={styles.badgeMuted}>
              <Text style={styles.badgeMutedText}>{conditionLabels[listing.condition]}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{listing.title || "Гарчиггүй"}</Text>
        <Text style={styles.price}>{formatPrice()}</Text>

        {(listing.location || created) && (
          <Text style={styles.meta}>
            {[listing.location, created ? created.toLocaleDateString("mn-MN") : null]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        )}

        {listing.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Тайлбар</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Холбоо барих</Text>
          {listing.phone ? (
            <Pressable onPress={() => Linking.openURL(`tel:${listing.phone}`)}>
              <Text style={styles.link}>📞 {listing.phone}</Text>
            </Pressable>
          ) : null}
          {listing.kakao_id ? <Text style={styles.contactLine}>Kakao: {listing.kakao_id}</Text> : null}
          {listing.wechat_id ? <Text style={styles.contactLine}>WeChat: {listing.wechat_id}</Text> : null}
          {listing.whatsapp ? <Text style={styles.contactLine}>WhatsApp: {listing.whatsapp}</Text> : null}
          {!listing.phone && !listing.kakao_id && !listing.wechat_id && !listing.whatsapp ? (
            <Text style={styles.muted}>Холбоо барих мэдээлэл байхгүй</Text>
          ) : null}
        </View>

        <Pressable
          style={[styles.saveBtn, savedDocId && styles.saveBtnActive]}
          onPress={toggleSave}
          disabled={saveBusy}
        >
          <Text style={[styles.saveBtnText, savedDocId && styles.saveBtnTextActive]}>
            {saveBusy ? "…" : savedDocId ? "♥ Хадгалсан (дарж хасна)" : "♡ Хадгалах"}
          </Text>
        </Pressable>

        {listing.created_by && (!email || listing.created_by !== email) ? (
          <Pressable
            style={styles.chatBtn}
            onPress={() => {
              if (!isAuthenticated || !email) {
                Alert.alert("Нэвтрэх", "Чатлахын тулд нэвтэрнэ үү", [
                  { text: "Цуцлах", style: "cancel" },
                  { text: "Нэвтрэх", onPress: () => navigateToLogin(navigation) },
                ]);
                return;
              }
              navigateToMessagesChat(navigation, {
                otherUserEmail: listing.created_by,
                listingId: listing.id,
              });
            }}
          >
            <Text style={styles.chatBtnText}>💬 Зар эзэнтэй чатлах</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingBottom: 32 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  error: { color: "#b91c1c", textAlign: "center", marginBottom: 16 },
  retryBtn: {
    backgroundColor: "#ea580c",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  galleryWrap: { backgroundColor: "#e5e7eb" },
  hero: { width: "100%", backgroundColor: "#e5e7eb" },
  thumbRow: { maxHeight: 76, marginTop: 8, marginBottom: 8 },
  thumbRowInner: { paddingHorizontal: 12, gap: 8, flexDirection: "row" },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: { borderColor: "#ea580c" },
  placeholder: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
  },
  placeholderText: { color: "#6b7280" },
  body: { padding: 16 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeVip: { backgroundColor: "#f59e0b" },
  badgeFeat: { backgroundColor: "#2563eb" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  badgeMuted: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeMutedText: { color: "#374151", fontSize: 12, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  price: { fontSize: 20, fontWeight: "800", color: "#ea580c", marginTop: 8 },
  meta: { fontSize: 14, color: "#6b7280", marginTop: 8 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  description: { fontSize: 15, color: "#374151", lineHeight: 22 },
  link: { fontSize: 16, color: "#2563eb", marginBottom: 6 },
  contactLine: { fontSize: 15, color: "#374151", marginBottom: 4 },
  muted: { color: "#9ca3af" },
  saveBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#fecaca",
    alignItems: "center",
  },
  saveBtnActive: {
    borderColor: "#ea580c",
    backgroundColor: "#fff7ed",
  },
  saveBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 16 },
  saveBtnTextActive: { color: "#c2410c" },
  chatBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  chatBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
