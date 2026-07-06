import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext.js";
import { auth } from "../config/firebase";
import { ensureUserDocEmailForFirestoreRules } from "../services/authService.js";
import { showAlert } from "../utils/showAlert";
import {
  createConversation,
  createMessage,
  deleteMessage,
  findConversation,
  getConversation,
  listMessages,
  repairConversationParticipants,
  resolveChatParticipantEmail,
  syncConversationLastMessageFromMessages,
  updateConversation,
  updateConversationAfterMessage,
  updateMessage,
} from "../services/conversationService.js";
import { getListingById } from "../services/listingService.js";
import {
  getAdminEmail,
  getUserByEmail,
  isSellerBlockedByViewer,
} from "../services/userProfileService.js";
import { getListingImageUrl } from "../utils/imageUrl.js";
import { formatListingPrice } from "../utils/formatPrice.js";
import { navigateToHomeListing } from "../utils/navigationHelpers.js";
import { normalizeEmail, areEmailVariants } from "../utils/emailNormalize.js";
import { notifyUnreadTabBadge, notifyMessagesListRefresh } from "../utils/unreadBadgeEvents.js";
import { blurActiveElementWeb } from "../utils/blurActiveElementWeb.js";

function toUserFacingError(e) {
  const code = String(e?.code || "");
  const msg = String(e?.message || "");
  if (code === "already-exists" || /already exists/i.test(msg)) {
    return "Мессеж аль хэдийн илгээгдсэн.";
  }
  if (code === "permission-denied" || /insufficient permissions/i.test(msg)) {
    return "Эрх хүрэхгүй байна. Дахин нэвтэрнэ үү.";
  }
  if (/projects\//.test(msg) || /documents\//.test(msg)) {
    return "Мессеж илгээхэд алдаа гарлаа. Дахин оролдоно уу.";
  }
  return msg || "Илгээж чадсангүй";
}

export default function ChatScreen({ route, navigation }) {
  const { conversationId: paramConvId, otherUserEmail: paramOther, listingId } = route?.params ?? {};
  const normalizedOtherEmail = typeof paramOther === "string" ? paramOther.trim().toLowerCase() : "";
  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const { isAdmin } = useAuth();

  const [chatEmail, setChatEmail] = useState("");
  const [convId, setConvId] = useState(paramConvId || null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const mountedRef = useRef(true);
  const scrollTimerRef = useRef(null);
  const sendingRef = useRef(false);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const resolvedOtherEmail = useMemo(() => {
    if (otherUser?.email) return otherUser.email;
    if (normalizedOtherEmail) return normalizedOtherEmail;
    if (!conversation || !chatEmail) return null;
    const meNorm = normalizeEmail(chatEmail);
    const p1 = conversation.participant_1;
    const p2 = conversation.participant_2;
    if (normalizeEmail(p1) === meNorm || areEmailVariants(p1, meNorm)) return p2;
    if (normalizeEmail(p2) === meNorm || areEmailVariants(p2, meNorm)) return p1;
    return p2 || p1 || null;
  }, [otherUser?.email, normalizedOtherEmail, conversation, chatEmail]);

  const canSend = Boolean(draft.trim()) && !sending;

  useEffect(() => {
    mountedRef.current = true;
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0)
    );
    return () => {
      mountedRef.current = false;
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (!auth.currentUser?.uid) {
      setChatEmail("");
      return;
    }
    let cancelled = false;
    (async () => {
      const em = await resolveChatParticipantEmail();
      if (!cancelled && em) setChatEmail(em);
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.currentUser?.uid]);

  const scrollToEnd = () => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const resolveConversation = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const me = await resolveChatParticipantEmail();
      if (!me) {
        showAlert("Чат", "Профайл имэйл тохируулагдаагүй байна. Дахин нэвтэрнэ үү.");
        return;
      }
      if (mountedRef.current) setChatEmail(me);
      if (paramConvId) {
        setConvId(paramConvId);
        return;
      }
      if (!normalizedOtherEmail) {
        return;
      }
      if (!isValidEmail(normalizedOtherEmail)) {
        showAlert("Чат", "Хэрэглэгчийн имэйл буруу байна.");
        navigation.goBack();
        return;
      }
      if (normalizedOtherEmail === normalizeEmail(me)) {
        showAlert("Чат", "Өөртөө мессеж илгээх боломжгүй.");
        navigation.goBack();
        return;
      }
      const adminForBlock = await getAdminEmail();
      if (
        !(adminForBlock && normalizeEmail(adminForBlock) === normalizeEmail(normalizedOtherEmail))
      ) {
        const myProfile = await getUserByEmail(normalizeEmail(me));
        if (myProfile && isSellerBlockedByViewer(myProfile, normalizedOtherEmail)) {
          showAlert("Чат", "Та энэ хэрэглэгчийг блоклосон.", [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
          return;
        }
      }
      let existing = await findConversation(normalizeEmail(me), normalizedOtherEmail);
      if (!existing) {
        const iso = new Date().toISOString();
        existing = await createConversation({
          participant_1: normalizeEmail(me),
          participant_2: normalizedOtherEmail,
          last_message: "",
          last_message_time: iso,
          last_message_sender: normalizeEmail(me),
          unread_count_p1: 0,
          unread_count_p2: 0,
        });
      }
      setConvId(existing.id);
    } catch (e) {
      console.warn("resolveConversation:", e?.message);
      showAlert("Чат", e?.message || "Яриа эхлүүлж чадсангүй. Дахин оролдоно уу.");
      navigation.goBack();
    }
  }, [paramConvId, normalizedOtherEmail, navigation]);

  const fetchMessages = useCallback(async () => {
    if (!convId) return;
    const me = chatEmail || (await resolveChatParticipantEmail());
    if (!me) return;
    if (!chatEmail && me && mountedRef.current) setChatEmail(me);
    try {
      const list = await listMessages(convId, 120);
      if (!mountedRef.current) return;
      setMessages(list);
      scrollToEnd();

      const conv = await getConversation(convId);
      if (!conv) return;
      const meNorm = normalizeEmail(me);
      const unread = list.filter((m) => normalizeEmail(m.receiver_email) === meNorm && !m.is_read);
      if (unread.length === 0) return;
      for (const m of unread) {
        try {
          await updateMessage(m.id, { is_read: true });
        } catch {
          /* ignore */
        }
      }
      const isP1 = normalizeEmail(conv.participant_1) === meNorm;
      try {
        await updateConversation(convId, {
          [isP1 ? "unread_count_p1" : "unread_count_p2"]: 0,
        });
      } catch {
        /* ignore */
      }
      notifyUnreadTabBadge();
    } catch (e) {
      console.warn("listMessages:", e?.message);
    }
  }, [convId, chatEmail]);

  const loadMeta = useCallback(async () => {
    if (!convId) return;
    const me = chatEmail || (await resolveChatParticipantEmail());
    if (!me) return;
    if (!chatEmail && me && mountedRef.current) setChatEmail(me);
    try {
      if (auth.currentUser) {
        await ensureUserDocEmailForFirestoreRules(auth.currentUser, me);
      }
      const conv = await getConversation(convId);
      if (!mountedRef.current) return;
      if (!conv) return;
      const repaired = await repairConversationParticipants(conv, { meEmail: me });
      setConversation(repaired || conv);
      const activeConv = repaired || conv;
      notifyMessagesListRefresh();

      const meNorm = normalizeEmail(me);
      const other =
        normalizeEmail(activeConv.participant_1) === meNorm ||
        areEmailVariants(activeConv.participant_1, meNorm)
          ? activeConv.participant_2
          : activeConv.participant_1;
      const admin = await getAdminEmail();
      let displayName;
      if (admin && normalizeEmail(other) === normalizeEmail(admin)) displayName = "АДМИН";
      else {
        const u = await getUserByEmail(other);
        displayName = u?.displayName || other.split("@")[0];
      }
      if (!mountedRef.current) return;
      setOtherUser({ email: other, displayName });

      if (!(admin && normalizeEmail(admin) === normalizeEmail(other))) {
        const myProfile = await getUserByEmail(meNorm);
        if (myProfile && isSellerBlockedByViewer(myProfile, other)) {
          if (!mountedRef.current) return;
          showAlert("Чат", "Та энэ хэрэглэгчийг блоклосон.", [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
          return;
        }
      }

      navigation.setOptions({ title: displayName || "Чат" });

      if (listingId) {
        const l = await getListingById(listingId);
        if (!mountedRef.current) return;
        setListing(l);
      } else {
        setListing(null);
      }
    } catch (e) {
      console.warn("loadMeta:", e?.message);
    }
  }, [convId, chatEmail, listingId, navigation]);

  useEffect(() => {
    setLoading(true);
    resolveConversation().finally(() => setLoading(false));
  }, [resolveConversation]);

  useEffect(() => {
    if (!convId) return;
    setLoading(true);
    loadMeta()
      .then(() => fetchMessages())
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, [convId, loadMeta, fetchMessages]);

  useFocusEffect(
    useCallback(() => {
      const tabNav = navigation.getParent();
      tabNav?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        tabNav?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation])
  );

  useFocusEffect(
    useCallback(() => {
      const cleanupBlur = () => {
        blurActiveElementWeb();
        inputRef.current?.blur?.();
      };
      if (!convId) {
        return cleanupBlur;
      }
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") fetchMessages();
      });
      const t = setInterval(() => {
        if (AppState.currentState !== "active") return;
        fetchMessages();
      }, 10000);
      const unsubNav = navigation.addListener("blur", () => {
        notifyMessagesListRefresh();
      });
      return () => {
        cleanupBlur();
        clearInterval(t);
        sub.remove();
        unsubNav();
      };
    }, [convId, fetchMessages, navigation])
  );

  useEffect(() => {
    scrollToEnd();
  }, [messages.length]);

  const confirmDeleteMessage = useCallback(
    (m) => {
      if (!isAdmin || !convId) return;
      showAlert("Мессеж устгах", "Энэ мессежийг устгах уу?", [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Устгах",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMessage(m.id);
              await syncConversationLastMessageFromMessages(convId);
              await fetchMessages();
              const conv = await getConversation(convId);
              if (conv) setConversation(conv);
            } catch (e) {
              showAlert("Алдаа", e?.message || "Устгаж чадсангүй");
            }
          },
        },
      ]);
    },
    [isAdmin, convId, fetchMessages]
  );

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending || sendingRef.current) return;
    const recipient = resolvedOtherEmail;
    if (!convId || !recipient) {
      showAlert("Чат", "Харилцагчийн мэдээлэл ачаалагдаагүй байна. Дахин оролдоно уу.");
      return;
    }
    sendingRef.current = true;
    setSending(true);
    try {
      const meEmail = await resolveChatParticipantEmail();
      if (!meEmail) {
        showAlert("Алдаа", "Нэвтрэлтийн мэдээлэл олдсонгүй. Дахин нэвтэрнэ үү.");
        return;
      }
      let conv = conversation;
      if (!conv) {
        conv = await getConversation(convId);
        if (conv && mountedRef.current) setConversation(conv);
      }
      if (!conv) {
        showAlert(
          "Алдаа",
          "Ярианы мэдээлэл ачаалагдаагүй байна. Сүлжээ, нэвтрэл эсвэл Firestore дүрмээ шалгана уу."
        );
        return;
      }
      await createMessage({
        conversation_id: convId,
        sender_email: normalizeEmail(meEmail),
        receiver_email: normalizeEmail(recipient),
        message: text,
        is_read: false,
      });
      const updated = await updateConversationAfterMessage({
        conversationId: convId,
        conversation: conv,
        senderEmail: meEmail,
        receiverEmail: recipient,
        messageText: text,
      });
      setDraft("");
      setConversation(updated);
      await fetchMessages();
      notifyUnreadTabBadge();
    } catch (e) {
      showAlert("Алдаа", toUserFacingError(e));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  useEffect(() => {
    if (loading || convId || paramConvId || normalizedOtherEmail) return;
    if (!auth.currentUser) return;
    navigation.replace("MsgMain");
  }, [loading, convId, paramConvId, normalizedOtherEmail, navigation]);

  if (!auth.currentUser) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Нэвтэрнэ үү.</Text>
      </View>
    );
  }

  if (loading && !convId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  if (!convId) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Яриа эхлүүлэх мэдээлэл байхгүй.</Text>
      </View>
    );
  }

  const inputBottomPad = Math.max(insets.bottom, Platform.OS === "ios" ? 12 : 8);

  const chatBody = (
    <View style={styles.chatColumn}>
      {listing ? (
        <Pressable
          style={styles.listingBanner}
          onPress={() => navigateToHomeListing(navigation, listing.id)}
        >
          <Text style={styles.listingBannerLabel}>Зар</Text>
          <View style={styles.listingRow}>
            {listing.images?.[0] ? (
              <Image
                source={{ uri: getListingImageUrl(listing.images[0], "w150") }}
                style={styles.listingThumb}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.listingThumb, styles.listingThumbPh]} />
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={styles.listingTitle}>
                {listing.title}
              </Text>
              {listing.price != null ? (
                <Text style={styles.listingPrice}>
                  {formatListingPrice(listing.price, { countryCode: listing.country_code })}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.msgScroll}
        contentContainerStyle={styles.msgContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
      >
        {messages.map((m) => {
          const meNorm = normalizeEmail(chatEmail);
          const mine = meNorm && normalizeEmail(m.sender_email) === meNorm;
          const delBtn = isAdmin ? (
            <Pressable
              style={styles.adminDeleteBtn}
              onPress={() => confirmDeleteMessage(m)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Мессеж устгах"
            >
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
            </Pressable>
          ) : null;
          const bubbleEl = (
            <View style={[styles.bubble, mine ? styles.bubbleBgMine : styles.bubbleBgTheirs]}>
              <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
                {m.message}
              </Text>
              <Text style={[styles.timeSmall, mine ? styles.timeMine : styles.timeTheirs]}>
                {m.created_date instanceof Date
                  ? m.created_date.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })
                  : ""}
              </Text>
            </View>
          );
          return (
            <View key={m.id} style={[styles.bubbleWrap, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              {mine ? (
                <>
                  {bubbleEl}
                  {delBtn}
                </>
              ) : (
                <>
                  {delBtn}
                  {bubbleEl}
                </>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.inputRow, { paddingBottom: inputBottomPad }]} pointerEvents="box-none">
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Мессеж бичих…"
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={2000}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.75}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Илгээх"
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendBtnText}>Илгээх</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Web: RN KeyboardAvoidingView padding only (no VisualViewport yet — refine after device QA).
  const chatKeyboardBehavior =
    Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : "padding";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={chatKeyboardBehavior}
      keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
    >
      {chatBody}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f1f5f9" },
  chatColumn: { flex: 1, minHeight: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { color: "#6b7280", fontSize: 15 },
  listingBanner: {
    backgroundColor: "#fff7ed",
    borderBottomWidth: 1,
    borderBottomColor: "#fed7aa",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  listingBannerLabel: { fontSize: 11, fontWeight: "700", color: "#c2410c", marginBottom: 6 },
  listingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  listingThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#e5e7eb" },
  listingThumbPh: { alignItems: "center", justifyContent: "center" },
  listingTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  listingPrice: { fontSize: 13, color: "#ea580c", fontWeight: "700", marginTop: 2 },
  msgScroll: { flex: 1, minHeight: 0 },
  msgContent: { padding: 12, paddingBottom: 20, flexGrow: 1 },
  bubbleWrap: {
    marginBottom: 10,
    maxWidth: "88%",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    zIndex: 1,
  },
  bubbleMine: { alignSelf: "flex-end" },
  bubbleTheirs: { alignSelf: "flex-start" },
  adminDeleteBtn: {
    marginBottom: 2,
    zIndex: 20,
    ...(Platform.OS === "android" ? { elevation: 24 } : {}),
  },
  adminDeleteHit: { padding: 8, justifyContent: "center", alignItems: "center" },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleBgMine: { backgroundColor: "#ea580c" },
  bubbleBgTheirs: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTextMine: { color: "#fff" },
  bubbleTextTheirs: { color: "#111827" },
  timeSmall: { fontSize: 10, marginTop: 4, opacity: 0.85 },
  timeMine: { color: "rgba(255,255,255,0.9)" },
  timeTheirs: { color: "#9ca3af" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 8,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    position: "relative",
    zIndex: 30,
    ...(Platform.OS === "android" ? { elevation: 12 } : {}),
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  sendBtn: {
    backgroundColor: "#ea580c",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
