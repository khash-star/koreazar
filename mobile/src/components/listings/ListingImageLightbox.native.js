import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
import { normalizeImageOrientation } from "../../utils/normalizeImageOrientation";

/**
 * Orientation: patched react-native-image-viewing uses useWindowDimensions for paging.
 * Image URIs are EXIF-normalized before display (see normalizeImageOrientation).
 */
const LB_SIZE = "w1600";

function ListingImageLightboxInner({
  visible,
  images,
  imageIndex,
  onClose,
  onImageIndexChange,
  insets,
}) {
  const { width: winW, height: winH } = useWindowDimensions();
  const [imageSources, setImageSources] = useState([]);
  const [preparing, setPreparing] = useState(false);

  const remoteUris = useMemo(() => {
    if (!Array.isArray(images) || images.length === 0) return [];
    return images
      .map((img) => getListingImageUrl(img, LB_SIZE))
      .filter((u) => typeof u === "string" && u.length > 0);
  }, [images]);

  const len = remoteUris.length;

  useEffect(() => {
    let cancelled = false;
    if (!visible || len === 0) {
      setImageSources([]);
      setPreparing(false);
      return undefined;
    }

    setPreparing(true);
    (async () => {
      try {
        const normalized = await Promise.all(
          remoteUris.map((uri) => normalizeImageOrientation(uri))
        );
        if (cancelled) return;
        setImageSources(
          normalized
            .filter((uri) => typeof uri === "string" && uri.length > 0)
            .map((uri) => ({ uri }))
        );
      } catch {
        if (!cancelled) {
          setImageSources(remoteUris.map((uri) => ({ uri })));
        }
      } finally {
        if (!cancelled) setPreparing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, len, remoteUris]);

  /** Warm disk/memory cache while browsing listing so first lightbox open is fast. */
  useEffect(() => {
    if (len === 0) return;
    remoteUris.forEach((uri) => {
      normalizeImageOrientation(uri).catch(() => {});
    });
  }, [remoteUris, len]);

  const goDelta = useCallback(
    (delta, idx) => {
      if (len < 2 || !onImageIndexChange) return;
      onImageIndexChange((idx + delta + len) % len);
    },
    [len, onImageIndexChange]
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

        {len > 1 ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.arrowRow,
              { top: Math.max(insets.top + 72, Math.round(winH * 0.36)) },
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
    [len, insets, onClose, goDelta, winW, winH]
  );

  if (len === 0) {
    return null;
  }

  const sourcesReady = imageSources.length === len;
  const showViewer = visible && sourcesReady;

  return (
    <>
      <Modal
        visible={visible && preparing && !sourcesReady}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Pressable style={styles.prepareOverlay} onPress={onClose}>
          <ActivityIndicator size="large" color="#fff" />
        </Pressable>
      </Modal>
      <ImageViewing
        images={imageSources.length > 0 ? imageSources : remoteUris.map((uri) => ({ uri }))}
        imageIndex={Math.min(Math.max(0, imageIndex), len - 1)}
        visible={showViewer}
        onRequestClose={onClose}
        onImageIndexChange={onImageIndexChange}
        presentationStyle={Platform.OS === "ios" ? "fullScreen" : "overFullScreen"}
        animationType="fade"
        backgroundColor="#000"
        swipeToCloseEnabled
        doubleTapToZoomEnabled
        HeaderComponent={HeaderComponent}
        keyExtractor={keyExtractor}
      />
    </>
  );
}

export default memo(ListingImageLightboxInner);

const styles = StyleSheet.create({
  prepareOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
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
