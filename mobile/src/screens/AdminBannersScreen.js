import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { uploadImageFromUri } from "../services/storageService";
import { createBannerAd, deleteBannerAd, listBannerAds, updateBannerAd } from "../services/bannerService";
import { showAlert } from "../utils/showAlert";

export default function AdminBannersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState({
    image_url: "",
    title: "",
    link: "#",
    is_active: true,
    order: 0,
  });

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await listBannerAds();
      setRows(data || []);
    } catch (e) {
      showAlert("Алдаа", e?.message || "Баннер ачаалахад алдаа гарлаа");
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

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
    [rows]
  );

  const openCreate = useCallback(() => {
    setEditingId("");
    setForm({
      image_url: "",
      title: "",
      link: "#",
      is_active: true,
      order: sortedRows.length,
    });
    setDialogOpen(true);
  }, [sortedRows.length]);

  const openEdit = useCallback((banner) => {
    setEditingId(banner.id);
    setForm({
      image_url: banner.image_url || "",
      title: banner.title || "",
      link: banner.link || "#",
      is_active: banner.is_active !== false,
      order: Number(banner.order) || 0,
    });
    setDialogOpen(true);
  }, []);

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAlert("Зөвшөөрөл", "Зураг сонгохын тулд gallery зөвшөөрөл хэрэгтэй.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [2, 1],
    });
    if (result.canceled) return;
    const picked = result.assets?.[0];
    const uri = picked?.uri;
    if (!uri) return;
    setUploading(true);
    try {
      const uploaded = await uploadImageFromUri(uri, {
        mimeType: picked?.mimeType,
        fileName: picked?.fileName,
      });
      setForm((prev) => ({ ...prev, image_url: uploaded.file_url || "" }));
    } catch (e) {
      showAlert("Алдаа", e?.message || "Зураг upload амжилтгүй");
    } finally {
      setUploading(false);
    }
  }, []);

  const save = useCallback(async () => {
    if (!form.image_url) {
      showAlert("Алдаа", "Баннер зураг оруулна уу.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateBannerAd(editingId, form);
      } else {
        await createBannerAd(form);
      }
      setDialogOpen(false);
      await load(false);
    } catch (e) {
      showAlert("Алдаа", e?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }, [editingId, form, load]);

  const onDelete = useCallback((banner) => {
    showAlert("Баннер устгах уу?", `"${banner.title || "Баннер"}" устгах уу?`, [
      { text: "Үгүй", style: "cancel" },
      {
        text: "Устгах",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBannerAd(banner.id);
            await load(false);
          } catch (e) {
            showAlert("Алдаа", e?.message || "Устгаж чадсангүй");
          }
        },
      },
    ]);
  }, [load]);

  const move = useCallback(async (banner, direction) => {
    const idx = sortedRows.findIndex((r) => r.id === banner.id);
    if (idx < 0) return;
    const target = direction === "up" ? sortedRows[idx - 1] : sortedRows[idx + 1];
    if (!target) return;
    try {
      await updateBannerAd(banner.id, { order: Number(target.order) || 0 });
      await updateBannerAd(target.id, { order: Number(banner.order) || 0 });
      await load(false);
    } catch (e) {
      showAlert("Алдаа", e?.message || "Дараалал солиход алдаа гарлаа");
    }
  }, [load, sortedRows]);

  const toggleActive = useCallback(async (banner, checked) => {
    try {
      await updateBannerAd(banner.id, { is_active: checked });
      setRows((prev) => prev.map((r) => (r.id === banner.id ? { ...r, is_active: checked } : r)));
    } catch (e) {
      showAlert("Алдаа", e?.message || "Төлөв шинэчилж чадсангүй");
    }
  }, []);

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
      data={sortedRows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#ea580c" />}
      ListHeaderComponent={
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Баннер зарын удирдлага</Text>
          <Pressable style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addBtnText}>+ Баннер нэмэх</Text>
          </Pressable>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Баннер алга.</Text>}
      renderItem={({ item, index }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.thumb} contentFit="cover" /> : null}
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title || "Баннер"}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>{item.link || "-"}</Text>
              <View style={styles.badgeRow}>
                <Text style={[styles.badge, item.is_active ? styles.active : styles.inactive]}>
                  {item.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                </Text>
                <Text style={styles.orderText}>Дараалал: {Number(item.order) || 0}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.iconBtn} onPress={() => move(item, "up")} disabled={index === 0}>
                <Text style={[styles.icon, index === 0 && styles.dim]}>↑</Text>
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => move(item, "down")} disabled={index === sortedRows.length - 1}>
                <Text style={[styles.icon, index === sortedRows.length - 1 && styles.dim]}>↓</Text>
              </Pressable>
              <Switch
                value={item.is_active !== false}
                onValueChange={(checked) => toggleActive(item, checked)}
                trackColor={{ false: "#d1d5db", true: "#fb923c" }}
                thumbColor="#fff"
              />
              <Pressable style={styles.iconBtn} onPress={() => openEdit(item)}>
                <Text style={styles.icon}>✎</Text>
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => onDelete(item)}>
                <Text style={[styles.icon, styles.delIcon]}>🗑</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    />
    <Modal visible={dialogOpen} transparent animationType="fade" onRequestClose={() => setDialogOpen(false)}>
      <Pressable style={styles.modalBackdrop} onPress={() => !saving && setDialogOpen(false)}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{editingId ? "Баннер засах" : "Шинэ баннер"}</Text>
          <Pressable style={styles.pickBtn} onPress={pickImage} disabled={uploading || saving}>
            <Text style={styles.pickBtnText}>{uploading ? "Зураг upload..." : "Зураг сонгох"}</Text>
          </Pressable>
          {form.image_url ? <Image source={{ uri: form.image_url }} style={styles.preview} contentFit="cover" /> : null}
          <TextInput
            style={styles.input}
            placeholder="Нэр/Тайлбар"
            value={form.title}
            onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="https://..."
            value={form.link}
            onChangeText={(v) => setForm((p) => ({ ...p, link: v }))}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Дарааллын дугаар"
            value={String(form.order ?? 0)}
            onChangeText={(v) => setForm((p) => ({ ...p, order: Number(v.replace(/[^\d-]/g, "")) || 0 }))}
            keyboardType="number-pad"
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Идэвхтэй</Text>
            <Switch
              value={form.is_active}
              onValueChange={(checked) => setForm((p) => ({ ...p, is_active: checked }))}
              trackColor={{ false: "#d1d5db", true: "#fb923c" }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setDialogOpen(false)} disabled={saving}>
              <Text style={styles.cancelText}>Цуцлах</Text>
            </Pressable>
            <Pressable style={[styles.saveBtn, saving && styles.dimBtn]} onPress={save} disabled={saving}>
              <Text style={styles.saveText}>{saving ? "Хадгалж..." : "Хадгалах"}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 30 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  addBtn: { backgroundColor: "#d97706", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 30 },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  thumb: { width: 84, height: 52, borderRadius: 8, backgroundColor: "#e5e7eb" },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  meta: { marginTop: 2, fontSize: 12, color: "#64748b" },
  badgeRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { fontSize: 11, fontWeight: "700", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, overflow: "hidden" },
  active: { backgroundColor: "#dcfce7", color: "#16a34a" },
  inactive: { backgroundColor: "#e2e8f0", color: "#475569" },
  orderText: { fontSize: 11, color: "#64748b" },
  actions: { alignItems: "center", gap: 4 },
  iconBtn: { paddingHorizontal: 5, paddingVertical: 2 },
  icon: { fontSize: 16, color: "#334155" },
  delIcon: { color: "#dc2626" },
  dim: { opacity: 0.4 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 10 },
  pickBtn: { backgroundColor: "#ea580c", borderRadius: 10, alignItems: "center", paddingVertical: 10, marginBottom: 10 },
  pickBtnText: { color: "#fff", fontWeight: "700" },
  preview: { width: "100%", height: 140, borderRadius: 8, backgroundColor: "#e5e7eb", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, marginBottom: 8 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 10 },
  switchLabel: { fontSize: 14, color: "#334155", fontWeight: "600" },
  modalActions: { flexDirection: "row", gap: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, alignItems: "center", paddingVertical: 10 },
  cancelText: { color: "#334155", fontWeight: "700" },
  saveBtn: { flex: 1, backgroundColor: "#ea580c", borderRadius: 10, alignItems: "center", paddingVertical: 10 },
  saveText: { color: "#fff", fontWeight: "800" },
  dimBtn: { opacity: 0.6 },
});
