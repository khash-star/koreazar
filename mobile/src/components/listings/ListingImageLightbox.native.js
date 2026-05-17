import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ImageViewing from "react-native-image-viewing";
import { getListingImageUrl } from "../../utils/imageUrl";
import {
  lightboxNormalizeOrder,
  normalizeIndicesWithConcurrency,
  resolveLightboxDisplayUri,
} from "../../utils/normalizeImageOrientation";

/**
 * Opens immediately with remote URIs; EXIF normalize runs lazy (current → neighbors → background).
 */
const LB_SIZE = "w800";

function ListingImageLightboxInner({
  visible,
  images,
  imageIndex,
  onClose,
  onImageIndexChange,
  insets,
}) {
  const { width: winW } = useWindowDimensions();
  const [imageSources, setImageSources] = useState([]);
  const urisRef = useRef([]);
  const normalizedRef = useRef(new Set());
  const inFlightRef = useRef(new Set());
  const backgroundStartedRef = useRef(false);

  const slides = useMemo(() => {
    if (!Array.isArray(images) || images.length === 0) return [];
    return images
      .map((img, originalIndex) => ({
        originalIndex,
        remoteUri: getListingImageUrl(img, LB_SIZE),
      }))
      .filter((s) => typeof s.remoteUri === "string" && s.remoteUri.length > 0);
  }, [images]);

  const len = slides.length;

  const slideIndex = useMemo(() => {
    const pos = slides.findIndex((s) => s.originalIndex === imageIndex);
    return pos >= 0 ? pos : 0;
  }, [slides, imageIndex]);

  const remoteUris = useMemo(() => slides.map((s) => s.remoteUri), [slides]);

  const publish = useCallback(() => {
    const uris = urisRef.current;
    if (uris.length > 0) {
      setImageSources(uris.map((uri) => ({ uri })));
    }
  }, []);

  const normalizeAt = useCallback(
    async (i, cancelledRef) => {
      if (i < 0 || i >= urisRef.current.length) return;
      if (normalizedRef.current.has(i) || inFlightRef.current.has(i)) return;
      inFlightRef.current.add(i);
      try {
        const resolved = await resolveLightboxDisplayUri(remoteUris[i]);
        if (cancelledRef?.current) return;
        urisRef.current[i] = resolved;
        normalizedRef.current.add(i);
        publish();
      } catch {
        /* keep remote URI */
      } finally {
        inFlightRef.current.delete(i);
      }
    },
    [remoteUris, publish]
  );

  const prioritizeIndices = useCallback(
    (indices, cancelledRef) => {
      const unique = [...new Set(indices)].filter((i) => i >= 0 && i < len);
      return Promise.all(unique.map((i) => normalizeAt(i, cancelledRef)));
    },
    [len, normalizeAt]
  );

  /** Open instantly with HTTPS URIs when viewer opens or image set changes. */
  useEffect(() => {
    if (!visible || len === 0) {
      urisRef.current = [];
      normalizedRef.current = new Set();
      inFlightRef.current = new Set();
      backgroundStartedRef.current = false;
      setImageSources([]);
      return undefined;
    }

    urisRef.current = [...remoteUris];
    normalizedRef.current = new Set();
    inFlightRef.current = new Set();
    backgroundStartedRef.current = false;
    setImageSources(remoteUris.map((uri) => ({ uri })));

    const cancelled = { current: false };
    const startIndex = Math.min(Math.max(0, slideIndex), len - 1);

    (async () => {
      await prioritizeIndices([startIndex, startIndex - 1, startIndex + 1], cancelled);
      if (cancelled.current || backgroundStartedRef.current) return;
      backgroundStartedRef.current = true;
      const rest = lightboxNormalizeOrder(len, startIndex).filter(
        (i) => !normalizedRef.current.has(i) && !inFlightRef.current.has(i)
      );
      await normalizeIndicesWithConcurrency(rest, 2, async (i) => {
        await normalizeAt(i, cancelled);
      });
    })();

    return () => {
      cancelled.current = true;
    };
    // slideIndex intentionally excluded — swipe handled in separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, len, remoteUris, prioritizeIndices, normalizeAt]);

  /** Swipe: normalize new current ±1 only (no gallery reset). */
  useEffect(() => {
    if (!visible || len === 0) return undefined;
    const cancelled = { current: false };
    const cur = Math.min(Math.max(0, slideIndex), len - 1);
    prioritizeIndices([cur, cur - 1, cur + 1], cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [visible, slideIndex, len, prioritizeIndices]);

  const handleImageIndexChange = useCallback(
    (idx) => {
      if (!onImageIndexChange) return;
      const slide = slides[idx];
      if (slide) onImageIndexChange(slide.originalIndex);
    },
    [onImageIndexChange, slides]
  );

  const keyExtractor = useCallback((item, index) => {
    if (item && typeof item.uri === "string") return item.uri;
    return `img-${index}`;
  }, []);

  const HeaderComponent = useCallback(
    ({ imageIndex: idx }) => (
      <View pointerEvents="box-none" style={{ width: winW }}>
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
      </View>
    ),
    [len, insets, onClose, winW]
  );

  if (len === 0) {
    return null;
  }

  const viewerImages =
    imageSources.length === len ? imageSources : remoteUris.map((uri) => ({ uri }));

  return (
    <ImageViewing
      images={viewerImages}
      imageIndex={Math.min(Math.max(0, slideIndex), len - 1)}
      visible={visible}
      onRequestClose={onClose}
      onImageIndexChange={handleImageIndexChange}
      presentationStyle={Platform.OS === "ios" ? "fullScreen" : "overFullScreen"}
      animationType="fade"
      backgroundColor="#000"
      swipeToCloseEnabled
      doubleTapToZoomEnabled
      HeaderComponent={HeaderComponent}
      keyExtractor={keyExtractor}
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
});
