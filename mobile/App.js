import "./bootstrap";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { LogBox, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext.js";
import AppNavigator from "./src/navigation/AppNavigator";

/** RN Web + react-navigation дотоод — бидний код биш, консолыг цэвэрхэн байлгана */
if (__DEV__ && Platform.OS === "web") {
  LogBox.ignoreLogs([
    "props.pointerEvents is deprecated",
    /shadow.*style props are deprecated/i,
  ]);
}

export default function App() {
  useEffect(() => {
    if (Platform.OS !== "web") {
      import("./src/utils/pushNotifications.js").catch(() => {});
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <AuthProvider>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
          <AppNavigator />
          <StatusBar style="dark" />
        </SafeAreaProvider>
      </AuthProvider>
    </View>
  );
}
