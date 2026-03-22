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
    <View style={styles.wrap}>
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
  wrap: {
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  grid: { gap: 6 },
  row: {
    flexDirection: "row",
    gap: 6,
    alignItems: "stretch",
    overflow: "visible",
  },
  tilePressable: { flex: 1, minWidth: 0 },
  tile: {
    width: "100%",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
    cursor: "pointer",
  },
  tileSpacer: { flex: 1, minWidth: 0 },
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
  tileLabelActive: { color: "#ea580c", fontWeight: "700" },
});
