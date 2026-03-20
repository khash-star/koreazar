import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { getListingImageUrl } from "../../utils/imageUrl";

const CARD_W = 260;
const IMG_H = 140;

export default function FeaturedStrip({ listings, onPressListing }) {
  if (!listings?.length) return null;

  return (
    <View style={styles.outer}>
      <Text style={styles.label}>Онцлох зарууд</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollInner}
      >
        {listings.map((item) => {
          const uri = getListingImageUrl(item.images?.[0], "w400");
          return (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => onPressListing(item.id)}
            >
              <View style={styles.imgWrap}>
                {uri ? (
                  <Image source={{ uri }} style={styles.img} contentFit="cover" cachePolicy="memory-disk" />
                ) : (
                  <View style={styles.ph} />
                )}
                {item.listing_type === "vip" ? (
                  <View style={styles.badgeVip}>
                    <Text style={styles.badgeText}>VIP</Text>
                  </View>
                ) : item.listing_type === "featured" ? (
                  <View style={styles.badgeFeat}>
                    <Text style={styles.badgeText}>Онцгой</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.body}>
                <Text numberOfLines={2} style={styles.title}>
                  {item.title}
                </Text>
                <Text style={styles.price}>
                  {item.price != null ? `₩${Number(item.price).toLocaleString("ko-KR")}` : "Үнэ тохирно"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { marginBottom: 8 },
  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
    flexDirection: "row",
  },
  card: {
    width: CARD_W,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 12,
  },
  imgWrap: { height: IMG_H, backgroundColor: "#f3f4f6", position: "relative" },
  img: { width: "100%", height: "100%" },
  ph: { flex: 1 },
  badgeVip: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeFeat: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#2563eb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  body: { padding: 10 },
  title: { fontSize: 14, fontWeight: "600", color: "#111827", minHeight: 40 },
  price: { fontSize: 15, fontWeight: "700", color: "#ea580c", marginTop: 6 },
});
