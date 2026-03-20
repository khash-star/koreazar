import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const SavedStack = createNativeStackNavigator();
const MessagesStack = createNativeStackNavigator();
const CreateStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: true,
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: "Zarkorea" }} />
      <HomeStack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: "Зар" }} />
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
      <SavedStack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: "Зар" }} />
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
        options={{ title: "Зар нэмэх" }}
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

function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarH = 56 + Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={size}
              color={color}
            />
          ),
        }}
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
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
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
    <NavigationContainer>
      <RootStack.Navigator>
        <RootStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <RootStack.Screen name="Login" component={LoginScreen} options={{ title: "Нэвтрэх" }} />
        <RootStack.Screen name="Register" component={RegisterScreen} options={{ title: "Бүртгүүлэх" }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
