import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from "@expo-google-fonts/nunito";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import "react-native-reanimated";

import { SplashScreenController } from "@/components/SplashScreenController";

import { useAuthContext } from "@/hooks/useAuthContext";
import AuthProvider from "@/providers/authProvider";

// Separate RootNavigator so we can access the AuthContext
function RootNavigator() {
  const { isLoggedIn } = useAuthContext();

  return (
    <Stack>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    const nunitoStyle = { fontFamily: "Nunito_400Regular" };
    const mergeStyles = (existingStyle: unknown) =>
      Array.isArray(existingStyle)
        ? [...existingStyle, nunitoStyle]
        : existingStyle
          ? [existingStyle, nunitoStyle]
          : [nunitoStyle];

    const textDefaults = Text as typeof Text & {
      defaultProps?: { style?: unknown };
    };
    textDefaults.defaultProps = textDefaults.defaultProps ?? {};
    textDefaults.defaultProps.style = mergeStyles(
      textDefaults.defaultProps.style,
    );

    const textInputDefaults = TextInput as typeof TextInput & {
      defaultProps?: { style?: unknown };
    };
    textInputDefaults.defaultProps = textInputDefaults.defaultProps ?? {};
    textInputDefaults.defaultProps.style = mergeStyles(
      textInputDefaults.defaultProps.style,
    );
  }, [fontsLoaded]);

  return (
    <AuthProvider>
      <SplashScreenController ready={fontsLoaded || !!fontError} />
      <RootNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
