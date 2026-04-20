import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ReminderResponse = string;

export default function AddReminderButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReminderResponse | null>(null);

  async function handleSubmit() {
    if (!prompt.trim()) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "",
          messages: [
            {
              role: "user",
              content: `${prompt}\nReturn JSON with keys: title, date, time, description, category, reminder.`,
            },
          ],
        }),
      });

      const data: unknown = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setResult(`Failed to generate reminder: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Pressable style={styles.button} onPress={() => setModalOpen(true)}>
        <Text style={styles.buttonIcon}>
          <Feather name="plus" size={40} color="white" />
        </Text>
      </Pressable>

      <Modal transparent visible={modalOpen}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>Generate Reminder</Text>

            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Describe what you want to be reminded about"
              multiline
              style={styles.input}
            />

            {loading ? <ActivityIndicator /> : null}
            {result ? <Text style={styles.result}>{result}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setModalOpen(false)}
              >
                <Text style={styles.secondaryButtonText}>Close</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleSubmit}>
                <Text style={styles.primaryButtonText}>Generate</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    margin: 16,
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingVertical: 100,
    alignItems: "center",
  },
  buttonIcon: {
    color: "#ffffff",
    fontWeight: "600",
  },
  backdrop: {
    backgroundColor: "rgba(33,33,33,0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#2E7D32",
  },
  input: {
    borderColor: "#F1F8E9",
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 90,
    padding: 10,
    textAlignVertical: "top",
  },
  result: {
    backgroundColor: "#F1F8E9",
    borderRadius: 8,
    fontFamily: "Nunito_400Regular",
    color: "#212121",
    marginTop: 10,
    padding: 10,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 12,
  },
  secondaryButton: {
    borderColor: "#2E7D32",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#2E7D32",
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
  },
});
