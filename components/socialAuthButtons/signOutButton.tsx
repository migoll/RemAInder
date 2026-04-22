import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

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

  return (
    <Pressable onPress={onSignOutButtonPress} style={styles.button}>
      <Text style={styles.buttonText}>Sign Out</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    backgroundColor: "#F1F8E9",
    borderColor: "#2E7D32",
    borderWidth: 0.5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#2E7D32",
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
  },
});
