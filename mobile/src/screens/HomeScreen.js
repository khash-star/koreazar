import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
import BannerHero from "../components/home/BannerHero.js";
import CategoryStrip from "../components/home/CategoryStrip";
import FeaturedStrip from "../components/home/FeaturedStrip.js";
import MarqueeStrip from "../components/home/MarqueeStrip.js";
import { getActiveBannerAds } from "../services/bannerService";
import { getLatestListings } from "../services/listingService";
import { logout } from "../services/authService";
import { getListingImageUrl } from "../utils/imageUrl";
import { useAuth } from "../context/AuthContext.js";
import { navigateToLogin } from "../utils/navigationHelpers.js";

const CARD_IMG_H = 160;

function ListingItem({ item, onPress }) {
  const first = item.images?.[0];
  const uri = first ? getListingImageUrl(first, "w400") : "";

  return (
    <Pressable style={styles.card} onPress={() => onPress(item.id)}>
      <View style={styles.cardImageWrap}>
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.cardImage}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={styles.cardImagePlaceholderText}>📷</Text>
          </View>
        )}
        {item.listing_type === "vip" && (
          <View style={[styles.cardRibbon, styles.cardRibbonVip]}>
            <Text style={styles.cardRibbonText}>VIP</Text>
          </View>
        )}
        {item.listing_type === "featured" && item.listing_type !== "vip" && (
          <View style={[styles.cardRibbon, styles.cardRibbonFeat]}>
            <Text style={styles.cardRibbonText}>Онцгой</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.cardTitle}>
          {item.title || "Гарчиггүй"}
        </Text>
        <Text style={styles.cardSub}>{item.location || ""}</Text>
        <Text style={styles.cardPrice}>
          {item.price ? `₩${Number(item.price).toLocaleString("ko-KR")}` : "Үнэ тохирно"}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [listings, setListings] = useState([]);
  const [banners, setBanners] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const [listingData, bannerData] = await Promise.all([
        getLatestListings(50),
        getActiveBannerAds().catch(() => []),
      ]);
      setListings(listingData);
      setBanners(Array.isArray(bannerData) ? bannerData : []);
      setError("");
    } catch (err) {
      setError(err?.message || "Зарууд ачаалагдсангүй");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        authLoading ? (
          <ActivityIndicator style={{ marginRight: 12 }} size="small" color="#ea580c" />
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8 }}>
            {isAuthenticated ? (
              <Pressable onPress={() => logout()} hitSlop={8}>
                <Text style={{ color: "#6b7280", fontWeight: "600", fontSize: 15 }}>Гарах</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => navigateToLogin(navigation)} hitSlop={8}>
                <Text style={{ color: "#ea580c", fontWeight: "700", fontSize: 15 }}>Нэвтрэх</Text>
              </Pressable>
            )}
          </View>
        ),
    });
  }, [navigation, isAuthenticated, authLoading]);

  const onPressListing = useCallback(
    (id) => {
      navigation.navigate("ListingDetail", { listingId: id });
    },
    [navigation]
  );

  const vipMarquee = useMemo(
    () => listings.filter((l) => l.listing_type === "vip").slice(0, 5),
    [listings]
  );

  const featuredList = useMemo(
    () =>
      listings
        .filter((l) => l.listing_type === "featured" || l.listing_type === "vip")
        .slice(0, 10),
    [listings]
  );

  const displayedListings = useMemo(() => {
    if (!selectedCategory) return listings;
    return listings.filter((l) => l.category === selectedCategory);
  }, [listings, selectedCategory]);

  const listHeader = useMemo(
    () => (
      <View>
        <BannerHero banners={banners} />
        <CategoryStrip value={selectedCategory} onChange={setSelectedCategory} />
        <MarqueeStrip
          banners={banners}
          vipListings={vipMarquee}
          onPressListing={onPressListing}
        />
        <FeaturedStrip listings={featuredList} onPressListing={onPressListing} />
        <Text style={styles.listSectionTitle}>Сүүлийн зарууд</Text>
      </View>
    ),
    [banners, vipMarquee, featuredList, onPressListing, selectedCategory]
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  if (error && listings.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => load(false)}>
          <Text style={styles.retryText}>Дахин оролдох</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
        scrollEventThrottle={16}
      data={displayedListings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { paddingBottom: 24 + tabBarHeight }]}
      ListHeaderComponent={listHeader}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#ea580c" />
      }
      renderItem={({ item }) => <ListingItem item={item} onPress={onPressListing} />}
      ListEmptyComponent={
        <Text style={styles.empty}>
          {selectedCategory && listings.length > 0
            ? "Энэ ангилалд одоогоор зар алга."
            : "Идэвхтэй зар байхгүй."}
        </Text>
      }
      ListFooterComponent={
        error ? (
          <Text style={styles.footerError}>{error}</Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
    paddingTop: 8,
  },
  listSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardImageWrap: {
    height: CARD_IMG_H,
    backgroundColor: "#f3f4f6",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: CARD_IMG_H,
  },
  cardImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardImagePlaceholderText: { fontSize: 36, opacity: 0.35 },
  cardRibbon: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardRibbonVip: { backgroundColor: "#f59e0b" },
  cardRibbonFeat: { backgroundColor: "#2563eb" },
  cardRibbonText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  cardBody: { padding: 12 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    minHeight: 44,
  },
  cardSub: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ea580c",
    marginTop: 8,
  },
  error: {
    color: "#b91c1c",
    textAlign: "center",
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: "#ea580c",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  empty: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 24,
  },
  footerError: {
    color: "#b45309",
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 16,
  },
});
