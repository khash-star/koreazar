import React, { memo, useCallback, useMemo } from "react";
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ImageViewing from "react-native-image-viewing";
import { getListingImageUrl } from "../../utils/imageUrl";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const LB_SIZE = "w1600";

function ListingImageLightboxInner({
  visible,
  images,
  imageIndex,
  onClose,
  onImageIndexChange,
  insets,
}) {
  const imageSources = useMemo(() => {
    if (!Array.isArray(images) || images.length === 0) return [];
    return images
      .map((img) => {
        const uri = getListingImageUrl(img, LB_SIZE);
        return uri ? { uri } : null;
      })
      .filter(Boolean);
  }, [images]);

  const len = imageSources.length;

  const goDelta = useCallback(
    (delta, idx) => {
      if (len < 2 || !onImageIndexChange) return;
      const next = (idx + delta + len) % len;
      onImageIndexChange(next);
    },
    [len, onImageIndexChange]
  );

  const HeaderComponent = useCallback(
    ({ imageIndex: idx }) => (
      <View pointerEvents="box-none" style={{ width: SCREEN_W }}>
        <View
          style={[
            styles.headerBar,
            {
              paddingTop: Math.max(insets.top, 10),
              paddingLeft: Math.max(insets.left, 8),
              paddingRight: Math.max(insets.right, 8),
            },
          ]}
        >
          <View style={{ width: 44 }} />
          <View style={styles.topCenter}>
            {len > 1 ? (
              <Text style={styles.counter}>
                {idx + 1} / {len}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Хаах"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={34} color="#fff" />
          </Pressable>
        </View>

        {len > 1 ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.arrowRow,
              { top: Math.max(insets.top + 72, Math.round(SCREEN_H * 0.36)) },
            ]}
          >
            <Pressable
              style={styles.navHit}
              onPress={() => goDelta(-1, idx)}
              accessibilityRole="button"
              accessibilityLabel="Өмнөх зураг"
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Ionicons name="chevron-back" size={42} color="rgba(255,255,255,0.92)" />
            </Pressable>
            <Pressable
              style={styles.navHit}
              onPress={() => goDelta(1, idx)}
              accessibilityRole="button"
              accessibilityLabel="Дараагийн зураг"
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Ionicons name="chevron-forward" size={42} color="rgba(255,255,255,0.92)" />
            </Pressable>
          </View>
        ) : null}
      </View>
    ),
    [len, insets, onClose, goDelta]
  );

  if (len === 0) {
    return null;
  }

  return (
    <ImageViewing
      images={imageSources}
      imageIndex={Math.min(Math.max(0, imageIndex), len - 1)}
      visible={visible}
      onRequestClose={onClose}
      onImageIndexChange={onImageIndexChange}
      presentationStyle={Platform.OS === "ios" ? "fullScreen" : "overFullScreen"}
      animationType="fade"
      backgroundColor="#000"
      swipeToCloseEnabled
      doubleTapToZoomEnabled
      HeaderComponent={HeaderComponent}
      keyExtractor={(item, index) => {
        if (item && typeof item.uri === "string") return item.uri;
        return `img-${index}`;
      }}
    />
  );
}

export default memo(ListingImageLightboxInner);

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  arrowRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  topCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  counter: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navHit: {
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
});
