import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { getListingsByCreator } from "../services/listingService";
import { deleteUserProfile, updateUserBlocked } from "../services/userProfileService";
import { showAlert } from "../utils/showAlert";

export default function AdminUsersScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [userStats, setUserStats] = useState({ total: 0, active: 0, pending: 0 });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const closeProfileModal = useCallback(() => {
    setConfirmDeleteOpen(false);
    setSelectedUser(null);
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRows(data);
    } catch (e) {
      showAlert("Алдаа", e?.message || "Хэрэглэгчид ачаалахад алдаа гарлаа");
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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((u) => {
      const email = String(u.email || "").toLowerCase();
      const name = String(u.displayName || u.name || "").toLowerCase();
      const phone = String(u.phone || "").toLowerCase();
      return email.includes(term) || name.includes(term) || phone.includes(term);
    });
  }, [rows, q]);

  const openUserProfile = useCallback(async (user) => {
    setConfirmDeleteOpen(false);
    setSelectedUser(user);
    setStatsLoading(true);
    setUserStats({ total: 0, active: 0, pending: 0 });
    try {
      const listings = await getListingsByCreator(user.email || "", 300);
      const total = listings.length;
      const active = listings.filter((l) => l.status === "active").length;
      const pending = listings.filter((l) => l.status === "pending").length;
      setUserStats({ total, active, pending });
    } catch {
      setUserStats({ total: 0, active: 0, pending: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const onToggleBlock = useCallback(() => {
    if (!selectedUser) return;
    if (selectedUser.role === "admin") {
      showAlert("Анхаар", "Админ хэрэглэгчийг блоклох боломжгүй.");
      return;
    }
    if (selectedUser.id === user?.uid) {
      showAlert("Анхаар", "Өөрийгөө блоклох боломжгүй.");
      return;
    }
    const nextBlocked = !selectedUser.blocked;
    showAlert(
      nextBlocked ? "Хэрэглэгч блоклох уу?" : "Блок цуцлах уу?",
      selectedUser.email || "Сонгосон хэрэглэгч",
      [
        { text: "Үгүй", style: "cancel" },
        {
          text: nextBlocked ? "Блоклох" : "Цуцлах",
          onPress: async () => {
            try {
              await updateUserBlocked(selectedUser.id, nextBlocked);
              setRows((prev) =>
                prev.map((u) => (u.id === selectedUser.id ? { ...u, blocked: nextBlocked } : u))
              );
              setSelectedUser((prev) => (prev ? { ...prev, blocked: nextBlocked } : prev));
            } catch (e) {
              showAlert("Алдаа", e?.message || "Блоклох үйлдэл амжилтгүй.");
            }
          },
        },
      ]
    );
  }, [selectedUser, user?.uid]);

  const onDeleteUser = useCallback(() => {
    if (!selectedUser) return;
    if (selectedUser.role === "admin") {
      showAlert("Анхаар", "Админ хэрэглэгчийг устгах боломжгүй.");
      return;
    }
    if (selectedUser.id === user?.uid) {
      showAlert("Анхаар", "Өөрийн профайлыг эндээс устгах боломжгүй.");
      return;
    }
    setConfirmDeleteOpen(true);
  }, [selectedUser, user?.uid]);

  const confirmDeleteUser = useCallback(async () => {
    if (!selectedUser) return;
    setDeleting(true);
    try {
      await deleteUserProfile(selectedUser.id);
      setRows((prev) => prev.filter((u) => u.id !== selectedUser.id));
      closeProfileModal();
    } catch (e) {
      showAlert("Алдаа", e?.message || "Хэрэглэгч устгаж чадсангүй.");
    } finally {
      setDeleting(false);
    }
  }, [selectedUser, closeProfileModal]);

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
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#ea580c" />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Хэрэглэгч хайх</Text>
          <Text style={styles.sub}>Имэйл, нэр, утсаар шүүнэ</Text>
          <TextInput
            style={styles.input}
            placeholder="Имэйл, нэр, утас..."
            value={q}
            onChangeText={setQ}
            autoCapitalize="none"
          />
          <Text style={styles.count}>Нийт: {rows.length} · Илэрсэн: {filtered.length}</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Хэрэглэгч олдсонгүй.</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => openUserProfile(item)}>
          <Text style={styles.name}>{item.displayName || item.name || item.email?.split("@")[0] || "Хэрэглэгч"}</Text>
          <Text style={styles.meta}>{item.email || "-"}</Text>
          {!!item.phone && <Text style={styles.meta}>📞 {item.phone}</Text>}
          <Text style={styles.role}>{item.role === "admin" ? "Админ" : "Хэрэглэгч"}</Text>
        </Pressable>
      )}
    >
    </FlatList>
    <Modal
      visible={!!selectedUser}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (deleting) return;
        if (confirmDeleteOpen) setConfirmDeleteOpen(false);
        else closeProfileModal();
      }}
    >
      <View style={styles.modalBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (deleting) return;
            if (confirmDeleteOpen) setConfirmDeleteOpen(false);
            else closeProfileModal();
          }}
          accessibilityRole="button"
        />
        <View style={styles.modalCardWrap} pointerEvents="box-none">
          <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Хэрэглэгчийн профайл</Text>
            <Pressable onPress={closeProfileModal}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.modalSub}>Хэрэглэгчийн дэлгэрэнгүй мэдээлэл</Text>

          <View style={styles.heroCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(selectedUser?.displayName || selectedUser?.name || selectedUser?.email || "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.heroName}>
                {selectedUser?.displayName || selectedUser?.name || "Хэрэглэгч"}
              </Text>
              <Text style={styles.heroEmail}>{selectedUser?.email || "-"}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Үндсэн мэдээлэл</Text>
              <Text style={styles.k}>Имэйл</Text>
              <Text style={styles.v}>{selectedUser?.email || "-"}</Text>
              <Text style={styles.k}>Утасны дугаар</Text>
              <Text style={styles.v}>{selectedUser?.phone || "-"}</Text>
              <Text style={styles.k}>Эрх</Text>
              <Text style={styles.v}>{selectedUser?.role === "admin" ? "Админ" : "Хэрэглэгч"}</Text>
            </View>
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Заруудын статистик</Text>
              {statsLoading ? (
                <ActivityIndicator color="#ea580c" style={{ marginTop: 12 }} />
              ) : (
                <View style={styles.statRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Нийт</Text>
                    <Text style={styles.statValue}>{userStats.total}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Идэвхтэй</Text>
                    <Text style={[styles.statValue, { color: "#16a34a" }]}>{userStats.active}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Хүлээгдэж</Text>
                    <Text style={[styles.statValue, { color: "#ca8a04" }]}>{userStats.pending}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={styles.modalActions}>
            <Pressable
              style={[styles.actionBtn, styles.warnBtn]}
              onPress={onToggleBlock}
            >
              <Text style={styles.warnBtnText}>{selectedUser?.blocked ? "Блок цуцлах" : "Блоклох"}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.dangerBtn]}
              onPress={onDeleteUser}
            >
              <Text style={styles.dangerBtnText}>Устгах</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.closeBtn]} onPress={closeProfileModal}>
              <Text style={styles.closeBtnText}>Хаах</Text>
            </Pressable>
          </View>
          </View>
        </View>

        {confirmDeleteOpen && (
          <View style={styles.confirmOverlay} pointerEvents="box-none">
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => !deleting && setConfirmDeleteOpen(false)}
              accessibilityRole="button"
            />
            <View style={styles.confirmCardWrap} pointerEvents="box-none">
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>Хэрэглэгч устгах уу?</Text>
                <Text style={styles.confirmText}>
                  {selectedUser?.email || "Сонгосон хэрэглэгч"} профайлыг устгах гэж байна. Энэ үйлдлийг буцаах боломжгүй.
                </Text>
                <View style={styles.confirmActions}>
                  <Pressable
                    style={[styles.actionBtn, styles.closeBtn, deleting && styles.dimBtn]}
                    onPress={() => setConfirmDeleteOpen(false)}
                    disabled={deleting}
                  >
                    <Text style={styles.closeBtnText}>Цуцлах</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.dangerBtn, deleting && styles.dimBtn]}
                    onPress={confirmDeleteUser}
                    disabled={deleting}
                  >
                    <Text style={styles.dangerBtnText}>{deleting ? "Устгаж байна..." : "Тийм, устгах"}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 30 },
  header: { marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  sub: { marginTop: 2, marginBottom: 8, color: "#64748b", fontSize: 13 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  count: { marginTop: 8, color: "#64748b", fontSize: 12 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 26 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    marginBottom: 8,
  },
  name: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  meta: { marginTop: 2, color: "#64748b", fontSize: 13 },
  role: { marginTop: 6, fontSize: 12, color: "#334155", fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalCardWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    padding: 16,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14 },
  /** Нэг Modal дотор — iPad дээр давхар Modal-ийн touch/stack алдааг засна */
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
    elevation: 50,
  },
  confirmCardWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    padding: 16,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 30, fontWeight: "800", color: "#111827" },
  closeText: { fontSize: 20, color: "#6b7280", fontWeight: "700" },
  modalSub: { marginTop: 4, color: "#6b7280", marginBottom: 10, fontSize: 16 },
  heroCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 22 },
  heroName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  heroEmail: { marginTop: 2, color: "#4b5563", fontSize: 14 },
  grid: { flexDirection: "row", gap: 8, marginTop: 10 },
  block: { flex: 1, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 10 },
  blockTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 8 },
  k: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  v: { fontSize: 13, color: "#111827", fontWeight: "600", marginTop: 1 },
  statRow: { flexDirection: "row", gap: 6 },
  statBox: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 8, alignItems: "center", paddingVertical: 8 },
  statLabel: { fontSize: 11, color: "#6b7280" },
  statValue: { marginTop: 2, fontSize: 22, fontWeight: "800", color: "#111827" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 12 },
  actionBtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  warnBtn: { borderWidth: 1, borderColor: "#f59e0b", backgroundColor: "#fffbeb" },
  warnBtnText: { color: "#b45309", fontWeight: "700" },
  dangerBtn: { backgroundColor: "#ef4444" },
  dangerBtnText: { color: "#fff", fontWeight: "700" },
  closeBtn: { borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#fff" },
  closeBtnText: { color: "#374151", fontWeight: "700" },
  confirmCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16 },
  confirmTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 8 },
  confirmText: { fontSize: 14, color: "#4b5563", lineHeight: 22, marginBottom: 14 },
  confirmActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  dimBtn: { opacity: 0.6 },
});
