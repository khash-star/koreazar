import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { getLatestListings, getListingById } from "../services/listingService";
import { findSavedDocId, removeSaved, saveListing } from "../services/savedListingService";
import { createListingReport } from "../services/listingReportService";
import { getListingImageUrl } from "../utils/imageUrl";
import { toDate } from "../utils/firestoreDates";
import { conditionLabels } from "../constants/listings";
import { useAuth } from "../context/AuthContext.js";
import { navigateToLogin, navigateToMessagesChat } from "../utils/navigationHelpers.js";
import { openPhoneDialerSafe } from "../utils/safeLinking";
import { showAlert } from "../utils/showAlert";

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
  const [relatedListings, setRelatedListings] = useState([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportReason, setReportReason] = useState("Залилан/сэжигтэй");
  const [reportComment, setReportComment] = useState("");

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
      // Route param солигдох үед өмнөх дэлгэрэнгүйг цэвэрлэж холилдохоос сэргийлнэ.
      setListing(null);
      setRelatedListings([]);
      setImageIndex(0);
      setError("");
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

  useEffect(() => {
    let mounted = true;
    async function loadRelated() {
      if (!listing?.id || !listing?.category) {
        if (mounted) setRelatedListings([]);
        return;
      }
      try {
        const latest = await getLatestListings(60);
        const related = latest
          .filter(
            (row) =>
              String(row.id) !== String(listing.id) && row.category === listing.category
          )
          .slice(0, 10);
        if (mounted) setRelatedListings(related);
      } catch {
        if (mounted) setRelatedListings([]);
      }
    }
    loadRelated();
    return () => {
      mounted = false;
    };
  }, [listing?.id, listing?.category]);

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
      showAlert("Нэвтрэх", "Зар хадгалахын тулд нэвтэрнэ үү", [
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
      showAlert("Алдаа", e?.message || "Амжилтгүй");
    } finally {
      setSaveBusy(false);
    }
  }

  function openReportActions() {
    if (!isAuthenticated || !email) {
      showAlert("Нэвтрэх", "Санал/гомдол илгээхийн тулд нэвтэрнэ үү", [
        { text: "Цуцлах", style: "cancel" },
        { text: "Нэвтрэх", onPress: () => navigateToLogin(navigation) },
      ]);
      return;
    }
    setReportOpen(true);
  }

  async function submitReport() {
    if (!listing?.id) {
      showAlert("Алдаа", "Зарын ID олдсонгүй");
      return;
    }
    setReportBusy(true);
    try {
      await createListingReport({
        listingId: listing.id,
        listingTitle: listing.title || "",
        reason: reportReason,
        details: reportComment,
      });
      setReportOpen(false);
      setReportComment("");
      showAlert("Амжилттай", "Санал/гомдол хүлээн авлаа.");
    } catch (e) {
      showAlert("Алдаа", e?.message || "Илгээж чадсангүй");
    } finally {
      setReportBusy(false);
    }
  }

  const isOwner = !!(email && listing.created_by && email === listing.created_by);

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
            <Pressable onPress={() => openPhoneDialerSafe(listing.phone)}>
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
                showAlert("Нэвтрэх", "Чатлахын тулд нэвтэрнэ үү", [
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

        {listing.created_by && (!email || listing.created_by !== email) ? (
          <Pressable style={styles.reportBtn} onPress={openReportActions}>
            <Text style={styles.reportBtnText}>⚑ Санал/гомдол илгээх</Text>
          </Pressable>
        ) : null}

        {!isOwner && relatedListings.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ижил зарууд</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedRow}
            >
              {relatedListings.map((item) => {
                const first = item.images?.[0];
                const uri = first ? getListingImageUrl(first, "w400") : "";
                const priceText = item.price
                  ? `₩${Number(item.price).toLocaleString("ko-KR")}`
                  : "Үнэ тохирно";
                return (
                  <Pressable
                    key={item.id}
                    style={styles.relatedCard}
                    onPress={() => navigation.push("ListingDetail", { listingId: item.id })}
                  >
                    {uri ? (
                      <Image
                        source={{ uri }}
                        style={styles.relatedImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={[styles.relatedImage, styles.relatedImagePh]} />
                    )}
                    <View style={styles.relatedBody}>
                      <Text numberOfLines={2} style={styles.relatedTitle}>
                        {item.title || "Гарчиггүй"}
                      </Text>
                      <Text numberOfLines={1} style={styles.relatedPrice}>
                        {priceText}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
      <Modal
        visible={reportOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !reportBusy && setReportOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => !reportBusy && setReportOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Санал/гомдол</Text>
            <Text style={styles.modalHint}>Шалтгаанаа сонгоод илгээнэ үү.</Text>
            <View style={styles.reasonList}>
              {["Залилан/сэжигтэй", "Зохисгүй контент", "Буруу мэдээлэл", "Бусад"].map((r) => (
                <Pressable
                  key={r}
                  style={[styles.reasonChip, reportReason === r && styles.reasonChipActive]}
                  onPress={() => setReportReason(r)}
                  disabled={reportBusy}
                >
                  <Text style={[styles.reasonChipText, reportReason === r && styles.reasonChipTextActive]}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.commentLabel}>Тайлбар (заавал биш)</Text>
            <TextInput
              style={styles.commentInput}
              value={reportComment}
              onChangeText={setReportComment}
              placeholder="Нэмэлт тайлбар бичнэ үү..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!reportBusy}
              maxLength={500}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setReportOpen(false)}
                disabled={reportBusy}
              >
                <Text style={styles.modalCancelText}>Цуцлах</Text>
              </Pressable>
              <Pressable style={styles.modalSubmit} onPress={submitReport} disabled={reportBusy}>
                {reportBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Илгээх</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  reportBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  reportBtnText: { color: "#b91c1c", fontWeight: "700", fontSize: 15 },
  relatedRow: { gap: 10, paddingRight: 4 },
  relatedCard: {
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  relatedImage: { width: "100%", aspectRatio: 4 / 3, backgroundColor: "#e5e7eb" },
  relatedImagePh: { backgroundColor: "#e5e7eb" },
  relatedBody: { padding: 8 },
  relatedTitle: { fontSize: 13, fontWeight: "600", color: "#111827", minHeight: 32 },
  relatedPrice: { marginTop: 4, fontSize: 13, fontWeight: "700", color: "#ea580c" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 6 },
  modalHint: { fontSize: 14, color: "#6b7280", marginBottom: 12 },
  reasonList: { gap: 8, marginBottom: 14 },
  reasonChip: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  reasonChipActive: { borderColor: "#ef4444", backgroundColor: "#fef2f2" },
  reasonChipText: { color: "#374151", fontWeight: "600" },
  reasonChipTextActive: { color: "#b91c1c" },
  commentLabel: { fontSize: 13, color: "#6b7280", marginBottom: 6, fontWeight: "600" },
  commentInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    minHeight: 86,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12,
    color: "#111827",
    backgroundColor: "#fff",
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
  },
  modalCancelText: { color: "#374151", fontWeight: "600" },
  modalSubmit: {
    flex: 1,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
  },
  modalSubmitText: { color: "#fff", fontWeight: "700" },
});
