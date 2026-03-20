import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext.js";
import AppNavigator from "./src/navigation/AppNavigator";

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
