import { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { categoryInfo } from "../../constants/listingForm.js";

const GAP = 8;

function chunkIntoRows(list, size) {
  const rows = [];
  for (let i = 0; i < list.length; i += size) {
    rows.push(list.slice(i, i + size));
  }
  return rows;
}

/**
 * Вэб: react-native-reanimated ашиглахгүй (semver / Metro алдаа гаргахгүй).
 * Pulse + даралт — RN Animated.
 */
function CategoryTileWeb({ item, active, onChange }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 880,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 880,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const scale = Animated.multiply(
    pulse,
    press.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] })
  );
  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <Pressable
      onPressIn={() => {
        Animated.spring(press, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 120,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(press, {
          toValue: 0,
          useNativeDriver: true,
          friction: 6,
          tension: 120,
        }).start();
      }}
      onPress={() => onChange(item.key)}
      style={styles.tilePressable}
    >
      <Animated.View style={[styles.tile, active && styles.tileActive, { transform: [{ translateY }, { scale }] }]}>
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
              <CategoryTileWeb
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
      default: {},
    }),
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  grid: { gap: GAP },
  row: {
    flexDirection: "row",
    gap: GAP,
    alignItems: "stretch",
    overflow: "visible",
  },
  tilePressable: { flex: 1, minWidth: 0 },
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
    cursor: "pointer",
  },
  tileSpacer: { flex: 1, minWidth: 0 },
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
  tileLabelActive: { color: "#c2410c" },
});
