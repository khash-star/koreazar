import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { openExternalUrlSafe } from "../../utils/safeLinking";

const GAP = 8;
/** RN: aspectRatio = өргөн/өндөр. Утга багасах = нүүрэн солигддог баннер илүү өндөр */
const BANNER_CELL_ASPECT = 1.1;

export default function BannerHero({ banners }) {
  const [idx, setIdx] = useState(0);
  const { width: screenW } = useWindowDimensions();
  const pad = 16;
  const colW = (screenW - pad * 2 - GAP) / 2;

  useEffect(() => {
    if (banners.length <= 2) return;
    const t = setInterval(() => {
      setIdx((p) => (p + 2) % banners.length);
    }, 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners?.length) return null;

  const b0 = banners[idx];
  const b1 = banners.length > 1 ? banners[(idx + 1) % banners.length] : null;

  const open = (url) => {
    openExternalUrlSafe(url);
  };

  return (
    <View style={[styles.wrap, { paddingHorizontal: pad }]}>
      <View style={styles.row}>
        <Pressable style={[styles.cell, { width: colW, aspectRatio: BANNER_CELL_ASPECT }]} onPress={() => open(b0?.link)}>
          {b0?.image_url ? (
            <Image source={{ uri: b0.image_url }} style={styles.img} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={styles.ph} />
          )}
          {b0?.title ? (
            <View style={styles.cap}>
              <Text numberOfLines={1} style={styles.capText}>
                {b0.title}
              </Text>
            </View>
          ) : null}
        </Pressable>
        {b1 ? (
          <Pressable style={[styles.cell, { width: colW, aspectRatio: BANNER_CELL_ASPECT }]} onPress={() => open(b1?.link)}>
            {b1?.image_url ? (
              <Image source={{ uri: b1.image_url }} style={styles.img} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <View style={styles.ph} />
            )}
            {b1?.title ? (
              <View style={styles.cap}>
                <Text numberOfLines={1} style={styles.capText}>
                  {b1.title}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : (
          <View style={{ width: colW }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14, backgroundColor: "#111827", paddingVertical: 16 },
  row: { flexDirection: "row", gap: GAP, justifyContent: "space-between" },
  cell: { borderRadius: 12, overflow: "hidden", backgroundColor: "#1f2937" },
  img: { width: "100%", height: "100%" },
  ph: { flex: 1, backgroundColor: "#374151" },
  cap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  capText: { color: "#fff", fontSize: 11, fontWeight: "600" },
});
