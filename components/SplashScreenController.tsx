import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { useAuthContext } from "../hooks/useAuthContext";

SplashScreen.preventAutoHideAsync();

export function SplashScreenController({ ready }: { ready: boolean }) {
  const { isLoading } = useAuthContext();

  useEffect(() => {
    if (ready && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [ready, isLoading]);

  return null;
}
