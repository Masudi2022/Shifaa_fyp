// app/_layout.jsx
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider } from "../context/AuthContext"; // adjust path if needed

export default function Layout() {
  const [showOnboarding, setShowOnboarding] = useState(null); // null = still loading

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem("hasSeenOnboarding");
        setShowOnboarding(hasSeen !== "true"); // true = show onboarding
      } catch (error) {
        console.error("AsyncStorage error:", error);
        setShowOnboarding(false); // fallback to not showing
      }
    };
    checkOnboarding();
  }, []);

  if (showOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <Stack
        initialRouteName={showOnboarding ? "onboarding" : "index"}
        screenOptions={{
          headerShown: false,
        }}
      />
    </AuthProvider>
  );
}
