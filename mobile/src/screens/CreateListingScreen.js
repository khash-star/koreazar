import { useCallback, useEffect, useRef, useState } from "react";
import { useRoute } from "@react-navigation/native";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext.js";
import { getListingAutoApprove } from "../services/appConfigService.js";
import { createListing, getListingById, updateListing } from "../services/listingService.js";
import { uploadImageFromUri } from "../services/storageService";
import { categoryInfo, locations, subcategoryConfig, conditionOptions as _conditionOptions } from "../constants/listingForm.js";

const conditionOptions = _conditionOptions ?? [
  { value: "new", label: "Шинэ" },
  { value: "like_new", label: "Бараг шинэ" },
  { value: "used", label: "Хэрэглэсэн" },
  { value: "for_parts", label: "Сэлбэгт" },
];
import {
  navigateToLogin,
  navigateToListingDetail,
  navigateToHomeMain,
} from "../utils/navigationHelpers.js";
import { showAlert } from "../utils/showAlert";

function listingExpiresToIso(exp) {
  if (!exp) return undefined;
  if (exp instanceof Date) return exp.toISOString();
  if (typeof exp === "string") return exp;
  try {
    const d = new Date(exp);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  } catch {
    /* ignore */
  }
  return undefined;
}

export default function CreateListingScreen({ navigation }) {
  const route = useRoute();
  const editListingId =
    route.params?.listingId != null && String(route.params.listingId).trim() !== ""
      ? String(route.params.listingId).trim()
      : null;
  const prevEditIdRef = useRef(null);

  const { email, isAuthenticated, userData, user } = useAuth();
  const submittingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const lockedName = (
    userData?.displayName ||
    user?.displayName ||
    userData?.email?.split?.("@")?.[0] ||
    email?.split?.("@")?.[0] ||
    ""
  ).trim();
  const lockedPhone = (userData?.phone || user?.phoneNumber || "").trim();
  const createInitialForm = useCallback(
    () => ({
      title: "",
      description: "",
      category: "",
      subcategory: "",
      condition: "used",
      price: "",
      is_negotiable: true,
      location: "",
      contact_name: lockedName,
      phone: lockedPhone,
      kakao_id: "",
      wechat_id: "",
      whatsapp: "",
    }),
    [lockedName, lockedPhone]
  );

  useEffect(() => {
    setForm((f) => ({ ...f, contact_name: lockedName, phone: lockedPhone }));
  }, [lockedName, lockedPhone]);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState(createInitialForm);
  const [initialListing, setInitialListing] = useState(null);
  const [loadingListing, setLoadingListing] = useState(false);

  useEffect(() => {
    if (!editListingId) {
      if (prevEditIdRef.current) {
        setInitialListing(null);
        setForm(createInitialForm());
        setImages([]);
      }
      prevEditIdRef.current = null;
      return;
    }
    prevEditIdRef.current = editListingId;
    let cancelled = false;
    (async () => {
      setLoadingListing(true);
      try {
        const listing = await getListingById(editListingId);
        if (cancelled) return;
        if (!listing) {
          showAlert("Алдаа", "Зар олдсонгүй.");
          navigation.setParams({ listingId: undefined });
          return;
        }
        setInitialListing(listing);
        setForm({
          title: listing.title || "",
          description: listing.description || "",
          category: listing.category || "",
          subcategory: listing.subcategory || "",
          condition: listing.condition || "used",
          price: listing.category === "free" ? "" : String(listing.price ?? ""),
          is_negotiable: listing.is_negotiable === false || listing.is_negotiable === 0 ? false : true,
          location: listing.location || "",
          contact_name: lockedName,
          phone: lockedPhone,
          kakao_id: listing.kakao_id || "",
          wechat_id: listing.wechat_id || "",
          whatsapp: listing.whatsapp || "",
        });
        setImages(Array.isArray(listing.images) ? listing.images : []);
      } catch (e) {
        showAlert("Алдаа", e?.message || "Ачаалахад алдаа гарлаа");
        navigation.setParams({ listingId: undefined });
      } finally {
        if (!cancelled) setLoadingListing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editListingId, navigation]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("Зөвшөөрөл", "Зураг сонгохын тулд номын сангийн зөвшөөрөл хэрэгтэй.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    const toAdd = result.assets.slice(0, 10 - images.length);
    if (toAdd.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        toAdd.map(async (asset) => {
          const { file_url } = await uploadImageFromUri(asset.uri);
          return { w800: file_url, w640: file_url, w400: file_url, w150: file_url };
        })
      );
      setImages((prev) => [...prev, ...uploaded]);
    } catch (e) {
      showAlert("Алдаа", e?.message || "Зураг upload амжилтгүй");
    } finally {
      setUploading(false);
    }
  }, [images.length]);

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (!isAuthenticated || !email) {
      showAlert("Нэвтрэх", "Зар нэмэхийн тулд нэвтэрнэ үү", [
        { text: "Цуцлах", style: "cancel" },
        { text: "Нэвтрэх", onPress: () => navigateToLogin(navigation) },
      ]);
      return;
    }
    if (!form.title?.trim()) {
      showAlert("Алдаа", "Гарчиг оруулна уу.");
      return;
    }
    if (!form.category) {
      showAlert("Алдаа", "Ангилал сонгоно уу.");
      return;
    }
    if (!lockedPhone) {
      showAlert("Алдаа", "Профайл дээр утасны дугаараа оруулсны дараа зар нэмнэ үү.");
      return;
    }
    const isFreeCategory = form.category === "free";
    const priceNum = isFreeCategory ? 0 : Number(form.price?.replace(/\D/g, "")) || 0;
    if (!isFreeCategory && priceNum <= 0) {
      showAlert("Алдаа", "Үнэ оруулна уу (₩).");
      return;
    }
    if (images.length === 0) {
      showAlert("Алдаа", "Дор хаяж 1 зураг нэмнэ үү.");
      return;
    }
    if (editListingId) {
      if (!initialListing) {
        showAlert("Алдаа", "Зар ачаалагдаж байна.");
        return;
      }
      submittingRef.current = true;
      setLoading(true);
      try {
        await updateListing(editListingId, {
          title: form.title.trim(),
          description: form.description || "",
          category: form.category,
          subcategory: form.subcategory || "",
          condition: form.condition,
          price: priceNum,
          is_negotiable: form.is_negotiable,
          location: form.location || "",
          phone: lockedPhone,
          kakao_id: form.kakao_id || "",
          wechat_id: form.wechat_id || "",
          whatsapp: form.whatsapp || "",
          images,
          status: initialListing.status,
          listing_type: initialListing.listing_type || "regular",
          listing_type_expires: listingExpiresToIso(initialListing.listing_type_expires),
        });
        setInitialListing(null);
        showAlert("Амжилттай", "Хадгалагдлаа.", [
          {
            text: "OK",
            onPress: () => {
              navigation.setParams({ listingId: undefined });
              navigateToHomeMain(navigation);
            },
          },
        ]);
      } catch (e) {
        showAlert("Алдаа", e?.message || "Хадгалж чадсангүй");
      } finally {
        setLoading(false);
        submittingRef.current = false;
      }
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      const autoApprove = await getListingAutoApprove();
      const submitData = {
        ...form,
        contact_name: lockedName,
        phone: lockedPhone,
        price: priceNum,
        images,
        status: autoApprove ? "active" : "pending",
      };
      const created = await createListing(submitData);
      // Keep Create tab clean after successful submit.
      setImages([]);
      setForm(createInitialForm());
      showAlert(
        "Амжилттай",
        autoApprove
          ? "Зар илгээгдлээ. Нүүр хуудсан дээр харагдана."
          : "Зар илгээгдлээ. Админ баталгаажуулсны дараа харагдана.",
        [{ text: "OK", onPress: () => navigateToListingDetail(navigation, created.id) }]
      );
    } catch (e) {
      showAlert("Алдаа", e?.message || "Илгээж чадсангүй");
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const subcats = form.category ? (subcategoryConfig[form.category] || []) : [];

  if (!isAuthenticated || !email) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Зар нэмэх</Text>
        <Text style={styles.sub}>Нэвтэрсний дараа зар нэмж болно.</Text>
        <Pressable style={styles.btn} onPress={() => navigateToLogin(navigation)}>
          <Text style={styles.btnText}>Нэвтрэх</Text>
        </Pressable>
      </View>
    );
  }

  if (editListingId && loadingListing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.label}>Зургууд *</Text>
          <View style={styles.imageRow}>
            {images.map((img, i) => (
              <View key={i} style={styles.imgWrap}>
                <Image source={{ uri: img.w400 || img.w800 }} style={styles.thumb} contentFit="cover" />
                <Pressable style={styles.removeBtn} onPress={() => removeImage(i)}>
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>
              </View>
            ))}
            {images.length < 10 && (
              <Pressable style={styles.addImg} onPress={pickImage} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator color="#ea580c" size="small" />
                ) : (
                  <>
                    <Ionicons name="add" size={32} color="#9ca3af" />
                    <Text style={styles.addImgText}>Нэмэх</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>

        {/* Basic */}
        <View style={styles.section}>
          <Text style={styles.label}>Гарчиг *</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(v) => update("title", v)}
            placeholder="Зарын гарчиг"
            placeholderTextColor="#9ca3af"
          />
          <Text style={[styles.label, { marginTop: 16 }]}>Тайлбар</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description}
            onChangeText={(v) => update("description", v)}
            placeholder="Дэлгэрэнгүй тайлбар..."
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Ангилал *</Text>
          <View style={styles.chipRowWrap}>
            {Object.entries(categoryInfo).map(([key, info]) => (
              <Pressable
                key={key}
                style={[styles.chip, form.category === key && styles.chipActive]}
                onPress={() => {
                  setForm((prev) => ({
                    ...prev,
                    category: key,
                    subcategory: "",
                    price: key === "free" ? "" : prev.price,
                  }));
                }}
              >
                <Text style={styles.chipIcon}>{info.icon}</Text>
                <Text style={[styles.chipText, form.category === key && styles.chipTextActive]}>{info.name}</Text>
              </Pressable>
            ))}
          </View>
          {subcats.length > 0 && (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>Дэд ангилал</Text>
              <View style={styles.chipRowWrap}>
                {subcats.map((s) => (
                  <Pressable
                    key={s.value}
                    style={[styles.chip, styles.chipSmall, form.subcategory === s.value && styles.chipActive]}
                    onPress={() => update("subcategory", s.value)}
                  >
                    <Text style={[styles.chipText, form.subcategory === s.value && styles.chipTextActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Condition */}
        <View style={styles.section}>
          <Text style={styles.label}>Төлөв</Text>
          <View style={styles.row}>
            {conditionOptions.map((c) => (
              <Pressable
                key={c.value}
                style={[styles.chip, styles.chipSmall, form.condition === c.value && styles.chipActive]}
                onPress={() => update("condition", c.value)}
              >
                <Text style={[styles.chipText, form.condition === c.value && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Price - hidden for free category */}
        {form.category !== "free" && (
          <View style={styles.section}>
            <Text style={styles.label}>Үнэ (₩) *</Text>
            <TextInput
              style={styles.input}
              value={form.price}
              onChangeText={(v) => update("price", v.replace(/[^0-9]/g, ""))}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
            <View style={styles.negotiableRow}>
              <Text style={styles.negotiableLabel}>Үнэ тохирно</Text>
              <Switch value={form.is_negotiable} onValueChange={(v) => update("is_negotiable", v)} trackColor={{ false: "#d1d5db", true: "#fed7aa" }} thumbColor="#ea580c" />
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Байршил</Text>
          <View style={styles.chipRowWrap}>
            {locations.map((loc) => (
              <Pressable
                key={loc}
                style={[styles.chip, styles.chipSmall, form.location === loc && styles.chipActive]}
                onPress={() => update("location", loc)}
              >
                <Text style={[styles.chipText, form.location === loc && styles.chipTextActive]}>{loc}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.label}>Холбоо барих</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={form.contact_name}
            placeholder="Нэр"
            editable={false}
          />
          <TextInput
            style={[styles.input, styles.inputDisabled, { marginTop: 8 }]}
            value={form.phone}
            placeholder="Утас"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            editable={false}
          />
          <Text style={styles.inputHint}>Профайл дахь нэр, утас автоматаар ашиглагдана</Text>
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={form.kakao_id}
            onChangeText={(v) => update("kakao_id", v)}
            placeholder="Kakao ID"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={form.wechat_id}
            onChangeText={(v) => update("wechat_id", v)}
            placeholder="WeChat ID"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={form.whatsapp}
            onChangeText={(v) => update("whatsapp", v)}
            placeholder="WhatsApp"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
          />
        </View>

        <Pressable
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitText} selectable={false}>
              {editListingId ? "Хадгалах" : "Зар илгээх"}
            </Text>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#f8fafc" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 },
  sub: { fontSize: 15, color: "#6b7280", marginBottom: 20, textAlign: "center" },
  btn: { backgroundColor: "#ea580c", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  label: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, backgroundColor: "#f9fafb" },
  inputDisabled: { backgroundColor: "#f3f4f6", opacity: 0.9 },
  inputHint: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  imgWrap: { position: "relative", width: 80, height: 80, borderRadius: 10, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  removeBtn: { position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  addImg: { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderStyle: "dashed", borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  addImgText: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chipRowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#f3f4f6" },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: "#fed7aa" },
  chipIcon: { fontSize: 18, marginRight: 6 },
  chipText: { fontSize: 14, color: "#374151", fontWeight: "600" },
  chipTextActive: { color: "#c2410c" },
  negotiableRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  negotiableLabel: { fontSize: 15, color: "#374151", fontWeight: "600" },
  submitBtn: {
    backgroundColor: "#ea580c",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    ...Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
  },
  submitDisabled: { opacity: 0.7 },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
    ...Platform.select({
      web: { userSelect: "none", cursor: "pointer" },
      default: {},
    }),
  },
});
