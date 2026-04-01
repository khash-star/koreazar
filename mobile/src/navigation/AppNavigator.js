import { Ionicons } from "@expo/vector-icons";
import * as ExpoLinking from "expo-linking";
import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AppState, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getPendingListingsCount } from "../services/listingService";
import { getUnreadMessagesCount } from "../services/conversationService";
import { subscribeUnreadTabBadge } from "../utils/unreadBadgeEvents.js";
import HomeScreen from "../screens/HomeScreen.js";
import ListingDetailScreen from "../screens/ListingDetailScreen.js";
import LoginScreen from "../screens/LoginScreen.js";
import RegisterScreen from "../screens/RegisterScreen.js";
import SavedListingsScreen from "../screens/SavedListingsScreen.js";
import MessagesScreen from "../screens/MessagesScreen.js";
import ChatScreen from "../screens/ChatScreen.js";
import CreateListingScreen from "../screens/CreateListingScreen.js";
import ProfileTabScreen from "../screens/ProfileTabScreen.js";
import MyListingsScreen from "../screens/MyListingsScreen.js";
import AdminScreen from "../screens/AdminScreen.js";
import AdminListingReportsScreen from "../screens/AdminListingReportsScreen.js";
import AdminNewListingsScreen from "../screens/AdminNewListingsScreen.js";
import AdminAllListingsScreen from "../screens/AdminAllListingsScreen.js";
import AdminBannersScreen from "../screens/AdminBannersScreen.js";
import AdminBannerRequestsScreen from "../screens/AdminBannerRequestsScreen.js";
import AdminUsersScreen from "../screens/AdminUsersScreen.js";
import AdminBroadcastScreen from "../screens/AdminBroadcastScreen.js";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen.js";

const RootStack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const SavedStack = createNativeStackNavigator();
const MessagesStack = createNativeStackNavigator();
const CreateStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();

/** createURL зарим iOS/EAS төлөвт алдаа гарвал бүх модуль унаж цагаан дэлгэц гарна */
function getLinkingPrefixes() {
  const out = ["zarkorea://"];
  try {
    const u = ExpoLinking.createURL("/");
    if (typeof u === "string" && u.length > 0 && !out.includes(u)) {
      out.unshift(u);
    }
  } catch {
    // зөвхөн scheme-ээр үлдэнэ
  }
  return out;
}

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#f3f4f6",
    card: "#ffffff",
  },
};

/** RN Web дээр tabBarBadge ихэвчлэн харагдахгүй — икон дээр өөрөө зурна */
function MessagesTabIconWithBadge({ color, size, focused, unreadCount }) {
  const n = Number(unreadCount) || 0;
  const label = n > 99 ? "99+" : n > 9 ? "9+" : n > 0 ? String(n) : null;
  return (
    <View
      style={{
        width: 32,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        zIndex: 1,
      }}
    >
      <Ionicons
        name={focused ? "chatbubbles" : "chatbubbles-outline"}
        size={size}
        color={color}
      />
      {label ? (
        <View
          style={{
            position: "absolute",
            right: -2,
            top: -2,
            minWidth: 18,
            height: 18,
            paddingHorizontal: label.length > 1 ? 3 : 0,
            borderRadius: 9,
            backgroundColor: "#ef4444",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800", lineHeight: 12 }}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const linking = {
  prefixes: getLinkingPrefixes(),
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: {
            screens: {
              HomeMain: "",
              ListingDetail: {
                path: "listing/:listingId",
                parse: {
                  listingId: (value) => String(value || "").trim(),
                },
              },
            },
          },
          MessagesTab: {
            screens: {
              MsgMain: "messages",
              Chat: {
                path: "chat/:otherUserEmail?",
                parse: {
                  otherUserEmail: (value) => (value ? decodeURIComponent(String(value)) : undefined),
                },
              },
            },
          },
          SavedTab: {
            screens: {
              SavedMain: "saved",
            },
          },
          CreateTab: {
            screens: {
              CreateMain: "create",
            },
          },
          ProfileTab: {
            screens: {
              ProfileMain: "profile",
              MyListings: "my-listings",
            },
          },
        },
      },
      Login: "login",
      Register: "register",
      Privacy: "privacy-policy",
    },
  },
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "700" },
        headerTitleAlign: "center",
        headerShadowVisible: true,
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: "ZARKOREA.COM" }} />
      <HomeStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        initialParams={{}}
        options={{ title: "Зар" }}
      />
    </HomeStack.Navigator>
  );
}

function SavedStackNavigator() {
  return (
    <SavedStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: true,
      }}
    >
      <SavedStack.Screen name="SavedMain" component={SavedListingsScreen} options={{ title: "Хадгалсан" }} />
      <SavedStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        initialParams={{}}
        options={{ title: "Зар" }}
      />
    </SavedStack.Navigator>
  );
}

function MessagesStackNavigator() {
  return (
    <MessagesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <MessagesStack.Screen name="MsgMain" component={MessagesScreen} options={{ title: "Мессеж" }} />
      <MessagesStack.Screen
        name="Chat"
        component={ChatScreen}
        initialParams={{}}
        options={{ title: "Чат", headerBackTitleVisible: true }}
      />
    </MessagesStack.Navigator>
  );
}

function CreateStackNavigator() {
  return (
    <CreateStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <CreateStack.Screen
        name="CreateMain"
        component={CreateListingScreen}
        options={({ route }) => ({
          title: route.params?.listingId ? "Зар засах" : "Зар нэмэх",
        })}
      />
    </CreateStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileTabScreen} options={{ title: "Профайл" }} />
      <ProfileStack.Screen name="MyListings" component={MyListingsScreen} options={{ title: "Миний зарууд" }} />
    </ProfileStack.Navigator>
  );
}

function AdminStackNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <AdminStack.Screen name="AdminMain" component={AdminScreen} options={{ title: "Админ" }} />
      <AdminStack.Screen
        name="AdminNewListings"
        component={AdminNewListingsScreen}
        options={{ title: "Шинэ зарууд" }}
      />
      <AdminStack.Screen
        name="AdminAllListings"
        component={AdminAllListingsScreen}
        options={{ title: "Бүх зарууд" }}
      />
      <AdminStack.Screen
        name="AdminBanners"
        component={AdminBannersScreen}
        options={{ title: "Баннер удирдах" }}
      />
      <AdminStack.Screen
        name="AdminBannerRequests"
        component={AdminBannerRequestsScreen}
        options={{ title: "Баннер хүсэлтүүд" }}
      />
      <AdminStack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ title: "Хэрэглэгч хайх" }}
      />
      <AdminStack.Screen
        name="AdminBroadcast"
        component={AdminBroadcastScreen}
        options={{ title: "Бүх хэрэглэгчдэд мессеж" }}
      />
      <AdminStack.Screen
        name="AdminListingReports"
        component={AdminListingReportsScreen}
        options={{ title: "Зарын гомдол" }}
      />
    </AdminStack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarH = 56 + Math.max(insets.bottom, 8);
  const { isAdmin, email } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    const refresh = () => getPendingListingsCount().then(setPendingCount).catch(() => {});
    refresh();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    const interval = setInterval(
      () => {
        if (AppState.currentState !== "active") return;
        refresh();
      },
      20000
    );
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!email) {
      setUnreadCount(0);
      return;
    }
    const refresh = () => getUnreadMessagesCount(email).then(setUnreadCount).catch(() => {});
    refresh();
    const unsubBadge = subscribeUnreadTabBadge(refresh);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    const interval = setInterval(
      () => {
        if (AppState.currentState !== "active") return;
        refresh();
      },
      8000
    );
    return () => {
      unsubBadge();
      clearInterval(interval);
      sub.remove();
    };
  }, [email]);

  return (
    <Tab.Navigator
      detachInactiveScreens={Platform.OS === "android"}
      sceneContainerStyle={{ backgroundColor: "#f3f4f6" }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#ea580c",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          borderTopColor: "#e5e7eb",
          height: tabBarH,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Нүүр",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SavedTab"
        component={SavedStackNavigator}
        options={{
          title: "Хадгал",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStackNavigator}
        options={{
          title: "Мессеж",
          tabBarItemStyle: Platform.OS === "web" ? { overflow: "visible" } : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <MessagesTabIconWithBadge
              color={color}
              size={size}
              focused={focused}
              unreadCount={unreadCount}
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate("MessagesTab", { screen: "MsgMain", params: {} });
            if (email) {
              getUnreadMessagesCount(email).then(setUnreadCount).catch(() => {});
            }
          },
        })}
      />
      <Tab.Screen
        name="CreateTab"
        component={CreateStackNavigator}
        options={{
          title: "Нэмэх",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={size} color={color} />
          ),
        }}
      />
      {isAdmin && (
        <Tab.Screen
          name="AdminTab"
          component={AdminStackNavigator}
          options={{
            title: "Админ",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "shield" : "shield-outline"} size={size} color={color} />
            ),
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          }}
        />
      )}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate("ProfileTab", { screen: "ProfileMain", params: {} });
          },
        })}
        options={{
          title: "Профайл",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking}>
      <RootStack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: "#f3f4f6" },
        }}
      >
        <RootStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <RootStack.Screen name="Login" component={LoginScreen} options={{ title: "Нэвтрэх" }} />
        <RootStack.Screen name="Register" component={RegisterScreen} options={{ title: "Бүртгүүлэх" }} />
        <RootStack.Screen
          name="Privacy"
          component={PrivacyPolicyScreen}
          options={{ title: "Нууцлалын бодлого" }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
