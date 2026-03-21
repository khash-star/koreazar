import { useEffect, useMemo, useRef } from "react";
import { Animated, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { getListingImageUrl } from "../../utils/imageUrl";

const ITEM_W = 300;
const ITEM_H = 160;
const GAP = 12;
const PAD_L = 16;

function buildFirstRow(banners, vipListings) {
  const row = [];
  (banners || []).forEach((b) => row.push({ kind: "banner", data: b }));
  (vipListings || []).forEach((l) => row.push({ kind: "vip", data: l }));
  return row;
}

export default function MarqueeStrip({ banners, vipListings, onPressListing }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);

  const firstRow = useMemo(() => buildFirstRow(banners, vipListings), [banners, vipListings]);
  const items = useMemo(() => (firstRow.length ? [...firstRow, ...firstRow] : []), [firstRow]);

  const { segmentW, trackW } = useMemo(() => {
    const slot = ITEM_W + GAP;
    return {
      segmentW: firstRow.length * slot,
      trackW: PAD_L + items.length * slot,
    };
  }, [firstRow.length, items.length]);

  useEffect(() => {
    if (firstRow.length === 0) return;

    translateX.setValue(0);
    const duration = Math.max(14000, firstRow.length * 5000);

    // Вэб дээр native animated module байхгүй — useNativeDriver: false
    const useNativeDriver = Platform.OS !== "web";
    loopRef.current = Animated.loop(
      Animated.timing(translateX, {
        toValue: -segmentW,
        duration,
        useNativeDriver,
      })
    );
    loopRef.current.start();

    return () => {
      if (loopRef.current) loopRef.current.stop();
      translateX.stopAnimation();
    };
  }, [firstRow.length, segmentW, translateX]);

  if (items.length === 0) return null;

  const openBanner = (url) => {
    if (url && url !== "#") Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.outer}>
      <Text style={styles.sectionLabel}>Баннер · VIP</Text>
      <View style={styles.clip}>
        <Animated.View style={[styles.track, { width: trackW, transform: [{ translateX }] }]}>
          {items.map((item, idx) => (
            <View key={`${item.kind}-${item.data?.id}-${idx}`} style={[styles.slot, { width: ITEM_W, marginRight: GAP }]}>
              {item.kind === "banner" ? (
                <Pressable style={[styles.card, { height: ITEM_H }]} onPress={() => openBanner(item.data.link)}>
                  {item.data.image_url ? (
                    <Image
                      source={{ uri: item.data.image_url }}
                      style={styles.img}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={styles.ph} />
                  )}
                  <View style={styles.sponsored}>
                    <Text style={styles.sponsoredText}>Sponsored</Text>
                  </View>
                </Pressable>
              ) : (
                <Pressable style={[styles.card, { height: ITEM_H }]} onPress={() => onPressListing(item.data.id)}>
                  {getListingImageUrl(item.data.images?.[0], "w400") ? (
                    <Image
                      source={{ uri: getListingImageUrl(item.data.images[0], "w400") }}
                      style={styles.img}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={styles.ph} />
                  )}
                  <View style={styles.vipBadge}>
                    <Text style={styles.vipText}>VIP</Text>
                  </View>
                  <View style={styles.vipCap}>
                    <Text numberOfLines={1} style={styles.vipTitle}>
                      {item.data.title}
                    </Text>
                    <Text style={styles.vipPrice}>
                      {item.data.price != null ? `${Number(item.data.price).toLocaleString("ko-KR")}₩` : ""}
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  clip: {
    height: ITEM_H,
    overflow: "hidden",
    width: "100%",
    alignSelf: "stretch",
  },
  track: {
    flexDirection: "row",
    paddingLeft: PAD_L,
  },
  slot: {},
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  img: { width: "100%", height: "100%" },
  ph: { flex: 1, backgroundColor: "#d1d5db" },
  sponsored: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sponsoredText: { fontSize: 10, fontWeight: "700", color: "#374151" },
  vipBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ea580c",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  vipText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  vipCap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  vipTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  vipPrice: { color: "#fff", fontWeight: "800", fontSize: 18, marginTop: 4 },
});
