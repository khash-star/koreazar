/**
 * Вэб: react-native-image-viewing орохгүй (Metro bundle унадаг) — энгийн Modal + RN Image.
 */
import React, { memo, useCallback, useMemo } from "react";
import {
  Dimensions,
  Image as RNImage,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getListingImageUrl } from "../../utils/imageUrl";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

function ListingImageLightboxInner({
  visible,
  images,
  imageIndex,
  onClose,
  onImageIndexChange,
  insets,
}) {
  const list = Array.isArray(images) ? images : [];
  const len = list.length;

  const lightboxAreaH = useMemo(
    () => Math.max(220, SCREEN_H - insets.top - insets.bottom - 56),
    [insets.top, insets.bottom]
  );

  const lightboxUri = useMemo(() => {
    if (len === 0 || !list[imageIndex]) return "";
    return getListingImageUrl(list[imageIndex], "w800");
  }, [list, len, imageIndex]);

  const goPrev = useCallback(() => {
    if (len < 2 || !onImageIndexChange) return;
    onImageIndexChange(imageIndex === 0 ? len - 1 : imageIndex - 1);
  }, [len, imageIndex, onImageIndexChange]);

  const goNext = useCallback(() => {
    if (len < 2 || !onImageIndexChange) return;
    onImageIndexChange(imageIndex === len - 1 ? 0 : imageIndex + 1);
  }, [len, imageIndex, onImageIndexChange]);

  if (len === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <View
          style={[
            styles.topBar,
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
                {imageIndex + 1} / {len}
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

        <View
          style={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, 12), minHeight: lightboxAreaH },
          ]}
        >
          {!!lightboxUri && (
            <RNImage
              source={{ uri: lightboxUri }}
              style={{ width: SCREEN_W, height: lightboxAreaH }}
              resizeMode="contain"
            />
          )}
        </View>

        {len > 1 ? (
          <>
            <Pressable
              style={[
                styles.nav,
                styles.navLeft,
                { top: Math.max(insets.top + 72, Math.round(SCREEN_H * 0.36)) },
              ]}
              onPress={goPrev}
              accessibilityRole="button"
              accessibilityLabel="Өмнөх зураг"
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Ionicons name="chevron-back" size={42} color="rgba(255,255,255,0.92)" />
            </Pressable>
            <Pressable
              style={[
                styles.nav,
                styles.navRight,
                { top: Math.max(insets.top + 72, Math.round(SCREEN_H * 0.36)) },
              ]}
              onPress={goNext}
              accessibilityRole="button"
              accessibilityLabel="Дараагийн зураг"
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Ionicons name="chevron-forward" size={42} color="rgba(255,255,255,0.92)" />
            </Pressable>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

export default memo(ListingImageLightboxInner);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
    zIndex: 20,
  },
  topCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  nav: {
    position: "absolute",
    zIndex: 15,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  navLeft: { left: 4 },
  navRight: { right: 4 },
});
