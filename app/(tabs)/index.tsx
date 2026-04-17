import SignOutButton from "@/components/socialAuthButtons/signOutButton";
import { useAuthContext } from "@/hooks/useAuthContext";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const { user } = useAuthContext();

  const fullName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const greetingName = fullName || user?.email || "der";

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Hello, {greetingName}</Text>
      </View>
      <Image
        source={require("@/assets/images/partial-react-logo.png")}
        style={styles.reactLogo}
      />
      <SignOutButton />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontFamily: "Nunito_700Bold",
    color: "#111418",
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
