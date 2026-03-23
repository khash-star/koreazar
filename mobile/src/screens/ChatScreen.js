import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useAuth } from "../context/AuthContext.js";
import {
  createConversation,
  createMessage,
  findConversation,
  getConversation,
  listMessages,
  updateConversation,
  updateMessage,
} from "../services/conversationService.js";
import { getListingById } from "../services/listingService.js";
import { getAdminEmail, getUserByEmail } from "../services/userProfileService.js";
import { getListingImageUrl } from "../utils/imageUrl.js";
import { navigateToHomeListing } from "../utils/navigationHelpers.js";
import { Timestamp } from "firebase/firestore";

export default function ChatScreen({ route, navigation }) {
  const { conversationId: paramConvId, otherUserEmail: paramOther, listingId } = route?.params ?? {};
  const { email } = useAuth();

  const [convId, setConvId] = useState(paramConvId || null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  const scrollToEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const resolveConversation = useCallback(async () => {
    if (!email) return;
    if (paramConvId) {
      setConvId(paramConvId);
      return;
    }
    if (!paramOther) {
      setLoading(false);
      return;
    }
    if (paramOther === email) {
      Alert.alert("Чат", "Өөртөө мессеж илгээх боломжгүй.");
      setLoading(false);
      navigation.goBack();
      return;
    }
    let existing = await findConversation(email, paramOther);
    if (!existing) {
      const iso = new Date().toISOString();
      existing = await createConversation({
        participant_1: email,
        participant_2: paramOther,
        last_message: "",
        last_message_time: iso,
        last_message_sender: email,
        unread_count_p1: 0,
        unread_count_p2: 0,
      });
    }
    setConvId(existing.id);
  }, [email, paramConvId, paramOther, navigation]);

  const fetchMessages = useCallback(async () => {
    if (!convId || !email) return;
    try {
      const list = await listMessages(convId, 120);
      setMessages(list);
      scrollToEnd();

      const conv = await getConversation(convId);
      if (!conv) return;
      const unread = list.filter((m) => m.receiver_email === email && !m.is_read);
      if (unread.length === 0) return;
      for (const m of unread) {
        try {
          await updateMessage(m.id, { is_read: true });
        } catch {
          /* ignore */
        }
      }
      const isP1 = conv.participant_1 === email;
      try {
        await updateConversation(convId, {
          [isP1 ? "unread_count_p1" : "unread_count_p2"]: 0,
        });
      } catch {
        /* ignore */
      }
    } catch (e) {
      console.warn("listMessages:", e?.message);
    }
  }, [convId, email]);

  const loadMeta = useCallback(async () => {
    if (!convId || !email) return;
    try {
      const conv = await getConversation(convId);
      setConversation(conv);
      if (!conv) return;

      const other = conv.participant_1 === email ? conv.participant_2 : conv.participant_1;
      const admin = await getAdminEmail();
      let displayName;
      if (admin && other === admin) displayName = "АДМИН";
      else {
        const u = await getUserByEmail(other);
        displayName = u?.displayName || other.split("@")[0];
      }
      setOtherUser({ email: other, displayName });

      navigation.setOptions({ title: displayName || "Чат" });

      if (listingId) {
        const l = await getListingById(listingId);
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
      .finally(() => setLoading(false));
  }, [convId, loadMeta, fetchMessages]);

  useFocusEffect(
    useCallback(() => {
      if (!convId) return;
      fetchMessages();
      const t = setInterval(fetchMessages, 4000);
      return () => clearInterval(t);
    }, [convId, fetchMessages])
  );

  useEffect(() => {
    scrollToEnd();
  }, [messages.length]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || !email || !convId || !conversation || !otherUser?.email || sending) return;
    setSending(true);
    try {
      await createMessage({
        conversation_id: convId,
        sender_email: email,
        receiver_email: otherUser.email,
        message: text,
        is_read: false,
      });
      const isP1 = conversation.participant_1 === email;
      const otherKey = isP1 ? "unread_count_p2" : "unread_count_p1";
      const prevOther = isP1 ? conversation.unread_count_p2 : conversation.unread_count_p1;
      await updateConversation(convId, {
        last_message: text,
        last_message_date: Timestamp.now(),
        last_message_time: new Date().toISOString(),
        last_message_sender: email,
        [otherKey]: (prevOther || 0) + 1,
      });
      setDraft("");
      setConversation((c) =>
        c
          ? {
              ...c,
              last_message: text,
              last_message_sender: email,
              [otherKey]: (prevOther || 0) + 1,
            }
          : c
      );
      await fetchMessages();
    } catch (e) {
      Alert.alert("Алдаа", e?.message || "Илгээж чадсангүй");
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
    >
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

      <ScrollView ref={scrollRef} style={styles.msgScroll} contentContainerStyle={styles.msgContent}>
        {messages.map((m) => {
          const mine = m.sender_email === email;
          return (
            <View key={m.id} style={[styles.bubbleWrap, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
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
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
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
  bubbleWrap: { marginBottom: 10, maxWidth: "88%" },
  bubbleMine: { alignSelf: "flex-end" },
  bubbleTheirs: { alignSelf: "flex-start" },
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
