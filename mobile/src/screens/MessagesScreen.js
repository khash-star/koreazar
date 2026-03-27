import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext.js";
import {
  deleteConversationAndMessages,
  emailQueryVariants,
  filterConversations,
} from "../services/conversationService.js";
import { normalizeEmail } from "../utils/emailNormalize.js";
import { showAlert } from "../utils/showAlert";
import { getAdminEmail, getUserByEmail } from "../services/userProfileService.js";
import { navigateToLogin } from "../utils/navigationHelpers.js";

/** Вэбийн formatDistanceToNow-тай адил (өдөр, цаг, минут) */
function formatTimeAgo(d) {
  if (!d) return "";
  try {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const diffMs = now - date;
    const diffM = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffM < 1) return "Саяхан";
    if (diffM < 60) return `${diffM} минутын өмнө`;
    if (diffH < 24) return `${diffH} цагийн өмнө`;
    if (diffD < 7) return `${diffD} өдрийн өмнө`;
    return date.toLocaleDateString("mn-MN", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function MessagesScreen({ navigation }) {
  const { email, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [adminEmail, setAdminEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingConv, setDeletingConv] = useState(false);

  const load = useCallback(async () => {
    if (!email) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      const admin = await getAdminEmail();
      setAdminEmail(admin);

      const variants = emailQueryVariants(email);
      const me = normalizeEmail(email);
      const convLists = await Promise.all(
        variants.map(async (em) => {
          const [asP1, asP2] = await Promise.all([
            filterConversations({ participant_1: em }),
            filterConversations({ participant_2: em }),
          ]);
          return [...asP1, ...asP2];
        })
      );
      const all = convLists.flat();
      const otherEmails = [
        ...new Set(
          all.map((c) => {
            const p1 = normalizeEmail(c.participant_1);
            return p1 === me ? c.participant_2 : c.participant_1;
          })
        ),
      ];

      const nameMap = new Map();
      await Promise.all(
        otherEmails.map(async (em) => {
          if (admin && normalizeEmail(em) === normalizeEmail(admin)) {
            nameMap.set(em, "АДМИН");
            return;
          }
          const u = await getUserByEmail(em);
          nameMap.set(em, u?.displayName || em.split("@")[0]);
        })
      );

      const enriched = all.map((conv) => {
        const p1 = normalizeEmail(conv.participant_1);
        const other = p1 === me ? conv.participant_2 : conv.participant_1;
        const unread = p1 === me ? conv.unread_count_p1 : conv.unread_count_p2;
        return {
          ...conv,
          otherEmail: other,
          otherName: nameMap.get(other) || other.split("@")[0],
          unreadCount: unread || 0,
        };
      });

      const seen = new Set();
      const deduped = enriched
        .filter((c) => {
          const k = c.id;
          if (!k || seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .sort((a, b) => {
          const adminN = admin ? normalizeEmail(admin) : "";
          const aAdmin = adminN && normalizeEmail(a.otherEmail) === adminN;
          const bAdmin = adminN && normalizeEmail(b.otherEmail) === adminN;
          if (aAdmin && !bAdmin) return -1;
          if (!aAdmin && bAdmin) return 1;
          if (a.unreadCount !== b.unreadCount) return (b.unreadCount || 0) - (a.unreadCount || 0);
          const ta = new Date(a.last_message_time || a.last_message_date || 0).getTime();
          const tb = new Date(b.last_message_time || b.last_message_date || 0).getTime();
          return tb - ta;
        });
      setRows(deduped);
    } catch (e) {
      console.warn("MessagesScreen load:", e?.message);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") load();
      });
      const t = setInterval(() => {
        if (AppState.currentState !== "active") return;
        load();
      }, 12000);
      return () => {
        clearInterval(t);
        sub.remove();
      };
    }, [load])
  );

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase().trim();
    return rows.filter(
      (r) =>
        (r.otherName || "").toLowerCase().includes(q) ||
        (r.otherEmail || "").toLowerCase().includes(q) ||
        (r.last_message || "").toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  const hasAdminConversation =
    adminEmail && rows.some((r) => normalizeEmail(r.otherEmail) === normalizeEmail(adminEmail));
  const showAdminBtn = adminEmail && !hasAdminConversation;

  const openDeleteConversationModal = useCallback((item) => {
    setDeleteTarget(item);
  }, []);

  const runDeleteConversation = useCallback(async () => {
    const item = deleteTarget;
    if (!item?.id) return;
    setDeletingConv(true);
    try {
      await deleteConversationAndMessages(item.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      const code = e?.code || "";
      const msg =
        code === "permission-denied"
          ? "Эрх хүрэхгүй байна. Дахин нэвтэрч, Firestore дүрмийг шинэчилсэн эсэхээ шалгана уу."
          : e?.message || "Устгаж чадсангүй";
      showAlert("Алдаа", msg);
    } finally {
      setDeletingConv(false);
    }
  }, [deleteTarget, load]);

  if (!isAuthenticated || !email) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Мессеж</Text>
        <Text style={styles.sub}>Нэвтэрсний дараа хэрэглэгчидтэй чатлана.</Text>
        <Pressable style={styles.btn} onPress={() => navigateToLogin(navigation)}>
          <Text style={styles.btnText}>Нэвтрэх</Text>
        </Pressable>
      </View>
    );
  }

  if (loading && rows.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  const openAdminChat = () => {
    if (adminEmail) navigation.navigate("Chat", { otherUserEmail: adminEmail });
  };

  const listHeader = (
    <View style={styles.headerSection}>
      <View style={styles.headerTop}>
        <Text style={styles.headerSub}>{rows.length} харилцаа</Text>
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Хайх..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {showAdminBtn && filteredRows.length > 0 ? (
        <Pressable style={[styles.adminBtn, styles.adminBtnTop]} onPress={openAdminChat}>
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
          <Text style={styles.adminBtnTextFilled}>Админд мессеж илгээх</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => !deletingConv && setDeleteTarget(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => !deletingConv && setDeleteTarget(null)}>
          <Pressable style={styles.confirmCard} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.confirmTitle}>Харилцаа устгах уу?</Text>
            <Text style={styles.confirmText}>
              {deleteTarget?.otherName || deleteTarget?.otherEmail || "Энэ"} хэрэглэгчтэй харилцааг болон бүх
              мессежийг устгана. Буцаах боломжгүй.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={[styles.confirmBtn, styles.confirmBtnCancel]}
                onPress={() => !deletingConv && setDeleteTarget(null)}
                disabled={deletingConv}
              >
                <Text style={styles.confirmBtnCancelText}>Цуцлах</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, styles.confirmBtnDanger, deletingConv && styles.confirmBtnDisabled]}
                onPress={runDeleteConversation}
                disabled={deletingConv}
              >
                <Text style={styles.confirmBtnDangerText}>
                  {deletingConv ? "Устгаж байна..." : "Устгах"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <FlatList
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="always"
        data={filteredRows}
        keyExtractor={(item, index) => item?.id || `msg-${index}`}
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor="#ea580c"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? "Хайлтын үр дүн олдсонгүй" : "Мессеж байхгүй байна"}
            </Text>
            <Text style={styles.emptyHint}>
              {searchQuery.trim() ? "Өөр хайлт хийж үзнэ үү" : "Зар дээр дарж зарын эзэнтэй холбогдоорой"}
            </Text>
            {showAdminBtn ? (
              <Pressable style={[styles.adminBtn, styles.adminBtnFilled]} onPress={openAdminChat}>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={styles.adminBtnTextFilled}>Админд мессеж илгээх</Text>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.rowMain}
              activeOpacity={0.65}
              onPress={() =>
                navigation.navigate("Chat", {
                  conversationId: item.id,
                  otherUserEmail: item.otherEmail,
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.otherName || "?").slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.otherName}
                  </Text>
                  <Text style={styles.rowTime}>{formatTimeAgo(item.last_message_time || item.last_message_date)}</Text>
                </View>
                <Text style={styles.preview} numberOfLines={2}>
                  <Text>
                    {normalizeEmail(item.last_message_sender) === normalizeEmail(email) ? (
                      <Text style={styles.previewPrefix}>Та: </Text>
                    ) : null}
                    {(() => {
                      const s = String(item.last_message ?? "").trim();
                      return s || "Мессеж илгээх...";
                    })()}
                  </Text>
                </Text>
              </View>
              {item.unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unreadCount > 9 ? "9+" : item.unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rowDeleteWrap}
              activeOpacity={0.55}
              onPress={() => openDeleteConversationModal(item)}
              hitSlop={{ top: 14, bottom: 14, left: 12, right: 14 }}
              accessibilityLabel="Харилцаа устгах"
              delayPressIn={0}
              collapsable={false}
            >
              <View style={styles.rowDeleteInner}>
                <Ionicons name="trash-outline" size={22} color="#dc2626" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#f8fafc" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 },
  sub: { fontSize: 15, color: "#6b7280", textAlign: "center", marginBottom: 20, lineHeight: 22 },
  btn: { backgroundColor: "#ea580c", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  headerSection: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  headerTop: { marginBottom: 12 },
  headerSub: { fontSize: 16, fontWeight: "600", color: "#374151" },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  searchIcon: { marginLeft: 12 },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 10, paddingLeft: 6, fontSize: 16 },
  empty: { padding: 40, alignItems: "center" },
  emptyIcon: { marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#111827", marginBottom: 8 },
  emptyHint: { fontSize: 15, color: "#6b7280", marginBottom: 24, textAlign: "center" },
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  adminBtnTop: { backgroundColor: "#ea580c", marginTop: 12 },
  adminBtnFilled: { backgroundColor: "#ea580c", width: "100%" },
  adminBtnTextFilled: { color: "#fff", fontWeight: "700", fontSize: 16 },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  rowMain: {
    flex: 1,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    paddingLeft: 16,
    paddingVertical: 12,
    paddingRight: 8,
  },
  rowDeleteWrap: {
    flexShrink: 0,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    ...(Platform.OS === "android" ? { elevation: 20 } : {}),
  },
  rowDeleteInner: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fed7aa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#c2410c" },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  rowName: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  rowTime: { fontSize: 12, color: "#9ca3af" },
  preview: { fontSize: 14, color: "#6b7280" },
  previewPrefix: { color: "#9ca3af" },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ea580c",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  confirmCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  confirmTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  confirmText: { fontSize: 15, color: "#4b5563", lineHeight: 22, marginBottom: 20 },
  confirmActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  confirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  confirmBtnCancel: { backgroundColor: "#f3f4f6" },
  confirmBtnCancelText: { fontWeight: "700", color: "#374151" },
  confirmBtnDanger: { backgroundColor: "#dc2626" },
  confirmBtnDangerText: { fontWeight: "700", color: "#fff" },
  confirmBtnDisabled: { opacity: 0.6 },
});
