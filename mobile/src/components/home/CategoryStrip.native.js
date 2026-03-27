import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { categoryInfo } from "../../constants/listingForm.js";

const SPRING_PRESS_IN = { damping: 14, stiffness: 400, mass: 0.32 };
const SPRING_PRESS_OUT = { damping: 16, stiffness: 340, mass: 0.32 };

function chunkIntoRows(list, size) {
  const rows = [];
  for (let i = 0; i < list.length; i += size) {
    rows.push(list.slice(i, i + size));
  }
  return rows;
}

function triggerCategoryHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/**
 * Нэг ангиллын нүд — spring даралт + сонгогдсон үед pulse (iOS/Android).
 */
function CategoryTile({ item, active, onChange }) {
  const pressed = useSharedValue(0);
  const pulse = useSharedValue(1);
  const isIOS = Platform.OS === "ios";
  const isAndroid = Platform.OS === "android";

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.03, {
            duration: 880,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(1, {
            duration: 880,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 220 });
    }
    return () => cancelAnimation(pulse);
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min(1, pressed.value));
    const scale = pulse.value * (1 + 0.045 * p);
    const translateY = -4 * p;
    const base = {
      transform: [{ translateY }, { scale }],
      zIndex: p > 0.01 ? 2 : 0,
    };
    if (isIOS) {
      return {
        ...base,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 + 5 * p },
        shadowOpacity: 0.06 + 0.12 * p,
        shadowRadius: 4 + 10 * p,
      };
    }
    if (isAndroid) {
      const elevation = p < 0.03 ? 0 : 2 + 8 * p;
      return {
        ...base,
        elevation,
      };
    }
    return base;
  });

  const handlePress = () => {
    triggerCategoryHaptic();
    onChange(item.key);
  };

  return (
    <Pressable
      onPressIn={() => {
        pressed.value = withSpring(1, SPRING_PRESS_IN);
      }}
      onPressOut={() => {
        // Avoid tiny spring residue on Android that leaves ghost shadow.
        pressed.value = withTiming(0, { duration: 90 });
      }}
      onPress={handlePress}
      android_ripple={null}
      style={styles.tilePressable}
    >
      <Animated.View style={[styles.tile, active && styles.tileActive, animatedStyle]}>
        <Text style={styles.tileIcon} allowFontScaling={false}>
          {item.icon}
        </Text>
        <Text style={[styles.tileLabel, active && styles.tileLabelActive]} numberOfLines={2}>
          {item.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Нүүр дэлгэц — ангиллаар шүүх (Сүүлийн зарууд).
 * @param {string | null} value — null = бүгд
 */
export default function CategoryStrip({ value, onChange }) {
  const categoryList = [
    { key: null, name: "Бүгд", icon: "📋" },
    ...Object.entries(categoryInfo).map(([key, info]) => ({
      key,
      name: info.name,
      icon: info.icon,
    })),
  ];
  const rows = chunkIntoRows(categoryList, 3);

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {rows.map((row, ri) => (
          <View key={`row-${ri}`} style={styles.row}>
            {row.map((cell) => (
              <CategoryTile
                key={cell.key === null ? "all" : cell.key}
                item={cell}
                active={value === cell.key}
                onChange={onChange}
              />
            ))}
            {row.length < 3
              ? Array.from({ length: 3 - row.length }).map((_, i) => (
                  <View key={`spacer-${ri}-${i}`} style={styles.tileSpacer} />
                ))
              : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  grid: {
    gap: 6,
  },
  row: {
    flexDirection: "row",
    gap: 6,
    alignItems: "stretch",
    overflow: "visible",
  },
  tilePressable: {
    flex: 1,
    minWidth: 0,
  },
  tile: {
    width: "100%",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  tileSpacer: {
    flex: 1,
    minWidth: 0,
  },
  tileActive: {
    backgroundColor: "rgba(234, 88, 12, 0.08)",
    borderRadius: 10,
  },
  tileIcon: {
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 2,
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 12,
  },
  tileLabelActive: {
    color: "#ea580c",
    fontWeight: "700",
  },
});
