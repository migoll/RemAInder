import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React from "react";
import { Button } from "react-native";

export default function SignOutButton() {
  const router = useRouter();

  async function onSignOutButtonPress() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      return;
    }

    router.replace("/login");
  }

  return <Button title="Sign out" onPress={onSignOutButtonPress} />;
}
