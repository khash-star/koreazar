import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { createListing } from "../services/listingService.js";
import { uploadImageFromUri } from "../services/storageService.js";
import { categoryInfo, locations, subcategoryConfig } from "../constants/listingForm.js";
import { navigateToLogin, navigateToListingDetail } from "../utils/navigationHelpers.js";

const CONDITION_OPTIONS = [
  { value: "new", label: "Шинэ" },
  { value: "like_new", label: "Бараг шинэ" },
  { value: "used", label: "Хэрэглэсэн" },
  { value: "for_parts", label: "Сэлбэгт" },
];

export default function CreateListingScreen({ navigation }) {
  const { email, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    condition: "used",
    price: "",
    is_negotiable: true,
    location: "",
    phone: "",
    kakao_id: "",
    wechat_id: "",
    whatsapp: "",
  });

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Зөвшөөрөл", "Зураг сонгохын тулд номын сангийн зөвшөөрөл хэрэгтэй.");
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
      for (const asset of toAdd) {
        const { file_url } = await uploadImageFromUri(asset.uri);
        setImages((prev) => [...prev, { w800: file_url, w640: file_url, w400: file_url, w150: file_url }]);
      }
    } catch (e) {
      Alert.alert("Алдаа", e?.message || "Зураг upload амжилтгүй");
    } finally {
      setUploading(false);
    }
  }, [images.length]);

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !email) {
      Alert.alert("Нэвтрэх", "Зар нэмэхийн тулд нэвтэрнэ үү", [
        { text: "Цуцлах", style: "cancel" },
        { text: "Нэвтрэх", onPress: () => navigateToLogin(navigation) },
      ]);
      return;
    }
    if (!form.title?.trim()) {
      Alert.alert("Алдаа", "Гарчиг оруулна уу.");
      return;
    }
    if (!form.category) {
      Alert.alert("Алдаа", "Ангилал сонгоно уу.");
      return;
    }
    const priceNum = Number(form.price?.replace(/\D/g, "")) || 0;
    if (priceNum <= 0) {
      Alert.alert("Алдаа", "Үнэ оруулна уу (₩).");
      return;
    }
    if (images.length === 0) {
      Alert.alert("Алдаа", "Дор хаяж 1 зураг нэмнэ үү.");
      return;
    }
    setLoading(true);
    try {
      const submitData = {
        ...form,
        price: priceNum,
        images,
        status: "pending",
      };
      const created = await createListing(submitData);
      Alert.alert(
        "Амжилттай",
        "Зар илгээгдлээ. Админ баталгаажуулсны дараа харагдана.",
        [{ text: "OK", onPress: () => navigateToListingDetail(navigation, created.id) }]
      );
    } catch (e) {
      Alert.alert("Алдаа", e?.message || "Илгээж чадсангүй");
    } finally {
      setLoading(false);
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {Object.entries(categoryInfo).map(([key, info]) => (
              <Pressable
                key={key}
                style={[styles.chip, form.category === key && styles.chipActive]}
                onPress={() => update("category", key)}
              >
                <Text style={styles.chipIcon}>{info.icon}</Text>
                <Text style={[styles.chipText, form.category === key && styles.chipTextActive]}>{info.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {subcats.length > 0 && (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>Дэд ангилал</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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
              </ScrollView>
            </>
          )}
        </View>

        {/* Condition */}
        <View style={styles.section}>
          <Text style={styles.label}>Төлөв</Text>
          <View style={styles.row}>
            {CONDITION_OPTIONS.map((c) => (
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

        {/* Price */}
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

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Байршил</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {locations.map((loc) => (
              <Pressable
                key={loc}
                style={[styles.chip, styles.chipSmall, form.location === loc && styles.chipActive]}
                onPress={() => update("location", loc)}
              >
                <Text style={[styles.chipText, form.location === loc && styles.chipTextActive]}>{loc}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.label}>Холбоо барих</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(v) => update("phone", v)}
            placeholder="Утас"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
          />
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

        <Pressable style={[styles.submitBtn, loading && styles.submitDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitText}>Зар илгээх</Text>
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
  textArea: { minHeight: 100, textAlignVertical: "top" },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  imgWrap: { position: "relative", width: 80, height: 80, borderRadius: 10, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  removeBtn: { position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  addImg: { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderStyle: "dashed", borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  addImgText: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#f3f4f6" },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: "#fed7aa" },
  chipIcon: { fontSize: 18, marginRight: 6 },
  chipText: { fontSize: 14, color: "#374151", fontWeight: "600" },
  chipTextActive: { color: "#c2410c" },
  negotiableRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  negotiableLabel: { fontSize: 15, color: "#374151", fontWeight: "600" },
  submitBtn: { backgroundColor: "#ea580c", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 17 },
});
