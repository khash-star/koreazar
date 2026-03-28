import "./bootstrap";
import { StatusBar } from "expo-status-bar";
import { LogBox, Platform } from "react-native";
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
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
