import { useCallback, useEffect, useRef, useState } from "react";
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
  syncConversationLastMessageFromMessages,
  updateConversation,
  updateMessage,
} from "../services/conversationService.js";
import { getListingById } from "../services/listingService.js";
import {
  getAdminEmail,
  getUserByEmail,
  isSellerBlockedByViewer,
} from "../services/userProfileService.js";
import { getListingImageUrl } from "../utils/imageUrl.js";
import { navigateToHomeListing } from "../utils/navigationHelpers.js";
import { normalizeEmail } from "../utils/emailNormalize.js";
import { notifyUnreadTabBadge } from "../utils/unreadBadgeEvents.js";
import { setActiveChatConversationId } from "../utils/chatNotificationState.js";
import { blurActiveElementWeb } from "../utils/blurActiveElementWeb.js";
import { Timestamp } from "firebase/firestore";

export default function ChatScreen({ route, navigation }) {
  const { conversationId: paramConvId, otherUserEmail: paramOther, listingId } = route?.params ?? {};
  const normalizedOtherEmail = typeof paramOther === "string" ? paramOther.trim().toLowerCase() : "";
  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const { email, isAdmin } = useAuth();

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

  const scrollToEnd = () => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const resolveConversation = useCallback(async () => {
    if (!email) return;
    if (auth.currentUser) {
      await ensureUserDocEmailForFirestoreRules(auth.currentUser, email);
    }
    if (paramConvId) {
      setConvId(paramConvId);
      return;
    }
    if (!normalizedOtherEmail) {
      setLoading(false);
      return;
    }
    if (!isValidEmail(normalizedOtherEmail)) {
      showAlert("Чат", "Хэрэглэгчийн имэйл буруу байна.");
      setLoading(false);
      navigation.goBack();
      return;
    }
    if (normalizedOtherEmail === normalizeEmail(email)) {
      showAlert("Чат", "Өөртөө мессеж илгээх боломжгүй.");
      setLoading(false);
      navigation.goBack();
      return;
    }
    const adminForBlock = await getAdminEmail();
    if (
      !(adminForBlock && normalizeEmail(adminForBlock) === normalizeEmail(normalizedOtherEmail))
    ) {
      const myProfile = await getUserByEmail(normalizeEmail(email));
      if (myProfile && isSellerBlockedByViewer(myProfile, normalizedOtherEmail)) {
        showAlert("Чат", "Та энэ хэрэглэгчийг блоклосон.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
        setLoading(false);
        return;
      }
    }
    let existing = await findConversation(normalizeEmail(email), normalizedOtherEmail);
    if (!existing) {
      const iso = new Date().toISOString();
      existing = await createConversation({
        participant_1: normalizeEmail(email),
        participant_2: normalizedOtherEmail,
        last_message: "",
        last_message_time: iso,
        last_message_sender: normalizeEmail(email),
        unread_count_p1: 0,
        unread_count_p2: 0,
      });
    }
    setConvId(existing.id);
  }, [email, paramConvId, normalizedOtherEmail, listingId, navigation]);

  const fetchMessages = useCallback(async () => {
    if (!convId || !email) return;
    try {
      const list = await listMessages(convId, 120);
      if (!mountedRef.current) return;
      setMessages(list);
      scrollToEnd();

      const conv = await getConversation(convId);
      if (!conv) return;
      const me = normalizeEmail(email);
      const unread = list.filter((m) => normalizeEmail(m.receiver_email) === me && !m.is_read);
      if (unread.length === 0) return;
      for (const m of unread) {
        try {
          await updateMessage(m.id, { is_read: true });
        } catch {
          /* ignore */
        }
      }
      const isP1 = normalizeEmail(conv.participant_1) === normalizeEmail(email);
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
  }, [convId, email]);

  const loadMeta = useCallback(async () => {
    if (!convId || !email) return;
    try {
      if (auth.currentUser) {
        await ensureUserDocEmailForFirestoreRules(auth.currentUser, email);
      }
      const conv = await getConversation(convId);
      if (!mountedRef.current) return;
      setConversation(conv);
      if (!conv) return;

      const other =
        normalizeEmail(conv.participant_1) === normalizeEmail(email)
          ? conv.participant_2
          : conv.participant_1;
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
        const myProfile = await getUserByEmail(normalizeEmail(email));
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
  }, [convId, email, listingId, navigation]);

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
      if (convId) setActiveChatConversationId(convId);
      return () => setActiveChatConversationId(null);
    }, [convId])
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
      return () => {
        cleanupBlur();
        clearInterval(t);
        sub.remove();
      };
    }, [convId, fetchMessages])
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
    if (!text || !email || !convId || !otherUser?.email || sending) return;
    setSending(true);
    try {
      if (auth.currentUser) {
        await ensureUserDocEmailForFirestoreRules(auth.currentUser, email);
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
        sender_email: normalizeEmail(email),
        receiver_email: normalizeEmail(otherUser.email),
        message: text,
        is_read: false,
      });
      const isP1 = normalizeEmail(conv.participant_1) === normalizeEmail(email);
      const otherKey = isP1 ? "unread_count_p2" : "unread_count_p1";
      const prevOther = isP1 ? conv.unread_count_p2 : conv.unread_count_p1;
      await updateConversation(convId, {
        last_message: text,
        last_message_date: Timestamp.now(),
        last_message_time: new Date().toISOString(),
        last_message_sender: normalizeEmail(email),
        [otherKey]: (prevOther || 0) + 1,
      });
      setDraft("");
      setConversation((c) => {
        const base = c ?? conv;
        if (!base) return c;
        return {
          ...base,
          last_message: text,
          last_message_sender: normalizeEmail(email),
          [otherKey]: (prevOther || 0) + 1,
        };
      });
      await fetchMessages();
      notifyUnreadTabBadge();
    } catch (e) {
      const msg = e?.message || "Илгээж чадсангүй";
      showAlert("Алдаа", msg);
    } finally {
      setSending(false);
    }
  }

  if (!email) {
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

  const chatBody = (
    <>
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
                <Text style={styles.listingPrice}>₩{Number(listing.price).toLocaleString("ko-KR")}</Text>
              ) : null}
            </View>
          </View>
        </Pressable>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.msgScroll}
        contentContainerStyle={styles.msgContent}
        keyboardShouldPersistTaps="always"
      >
        {messages.map((m) => {
          const mine = normalizeEmail(m.sender_email) === normalizeEmail(email);
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

      <View
        style={[
          styles.inputRow,
          Platform.OS === "android" && keyboardHeight > 0 && { marginBottom: keyboardHeight },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Мессеж бичих…"
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!draft.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendBtnText}>Илгээх</Text>
          )}
        </Pressable>
      </View>
    </>
  );

  if (Platform.OS === "web") {
    return <View style={styles.flex}>{chatBody}</View>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {chatBody}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f1f5f9" },
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
  msgScroll: { flex: 1 },
  msgContent: { padding: 12, paddingBottom: 20 },
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
    padding: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    gap: 8,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
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
