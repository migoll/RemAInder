import AddReminderButton from "@/components/AddReminderButton";
import RemindersList, {
  type RemindersListHandle,
} from "@/components/RemindersList";
import { useAuthContext } from "@/hooks/useAuthContext";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user } = useAuthContext();
  const router = useRouter();
  const listRef = useRef<RemindersListHandle>(null);

  const fullName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const greetingName = fullName || user?.email?.split("@")[0] || "there";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hi, {greetingName}</Text>
          <Text style={styles.subtitle}>Here are your reminders</Text>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          hitSlop={12}
          style={styles.settingsButton}
          accessibilityLabel="Open settings"
        >
          <Feather name="settings" size={24} color="#2E7D32" />
        </Pressable>
      </View>

      <AddReminderButton onCreated={() => listRef.current?.refresh()} />

      <RemindersList ref={listRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFCF7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 10,
  },
  greeting: {
    fontSize: 26,
    fontFamily: "Nunito_700Bold",
    color: "#111418",
  },
  subtitle: {
    fontSize: 14,
    color: "#2E7D32",
    fontFamily: "Nunito_400Regular",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F8E9",
  },
});
