import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext.js";
import { filterConversations } from "../services/conversationService.js";
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

  const load = useCallback(async () => {
    if (!email) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      const admin = await getAdminEmail();
      setAdminEmail(admin);

      const [convs1, convs2] = await Promise.all([
        filterConversations({ participant_1: email }),
        filterConversations({ participant_2: email }),
      ]);
      const all = [...convs1, ...convs2];
      const otherEmails = [
        ...new Set(
          all.map((c) => (c.participant_1 === email ? c.participant_2 : c.participant_1))
        ),
      ];

      const nameMap = new Map();
      await Promise.all(
        otherEmails.map(async (em) => {
          if (em === admin) {
            nameMap.set(em, "АДМИН");
            return;
          }
          const u = await getUserByEmail(em);
          nameMap.set(em, u?.displayName || em.split("@")[0]);
        })
      );

      const enriched = all.map((conv) => {
        const other = conv.participant_1 === email ? conv.participant_2 : conv.participant_1;
        const unread = conv.participant_1 === email ? conv.unread_count_p1 : conv.unread_count_p2;
        return {
          ...conv,
          otherEmail: other,
          otherName: nameMap.get(other) || other.split("@")[0],
          unreadCount: unread || 0,
        };
      });

      enriched.sort((a, b) => {
        const aAdmin = a.otherEmail === admin;
        const bAdmin = b.otherEmail === admin;
        if (aAdmin && !bAdmin) return -1;
        if (!aAdmin && bAdmin) return 1;
        if (a.unreadCount !== b.unreadCount) return (b.unreadCount || 0) - (a.unreadCount || 0);
        const ta = new Date(a.last_message_time || a.last_message_date || 0).getTime();
        const tb = new Date(b.last_message_time || b.last_message_date || 0).getTime();
        return tb - ta;
      });

      const seen = new Set();
      const deduped = enriched.filter((c) => {
        const k = c.id;
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
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
      const t = setInterval(load, 8000);
      return () => clearInterval(t);
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

  const hasAdminConversation = rows.some((r) => r.otherEmail === adminEmail);
  const showAdminBtn = adminEmail && !hasAdminConversation;

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
        <Text style={styles.headerTitle}>Мессеж</Text>
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
      <FlatList
        scrollEventThrottle={16}
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
          <Pressable
            style={styles.row}
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
                {item.last_message_sender === email && (
                  <Text style={styles.previewPrefix}>Та: </Text>
                )}
                {item.last_message || "Мессеж илгээх..."}
              </Text>
            </View>
            {item.unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount > 9 ? "9+" : item.unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 14, color: "#6b7280", marginTop: 2 },
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
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
});
