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

const GAP = 8;

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
  if (Platform.OS === "web") return;
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
    const p = pressed.value;
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
      return {
        ...base,
        elevation: 2 + 8 * p,
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
        pressed.value = withSpring(0, SPRING_PRESS_OUT);
      }}
      onPress={handlePress}
      android_ripple={{ color: "rgba(234, 88, 12, 0.2)", foreground: true }}
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
    <View style={styles.card}>
      <Text style={styles.title}>Ангилал</Text>
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
  card: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    ...Platform.select({
      web: { boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  grid: {
    gap: GAP,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
    alignItems: "stretch",
    overflow: "visible",
  },
  tilePressable: {
    flex: 1,
    minWidth: 0,
  },
  tile: {
    width: "100%",
    minHeight: 78,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    ...Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
  },
  tileSpacer: {
    flex: 1,
    minWidth: 0,
  },
  tileActive: {
    backgroundColor: "#fff7ed",
    borderColor: "#ea580c",
  },
  tileIcon: {
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 4,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 14,
  },
  tileLabelActive: {
    color: "#c2410c",
  },
});
