import { addReminderToCalendar } from "@/lib/calendar";
import { scheduleReminderNotifications } from "@/lib/notifications";
import { parseReminderPrompt } from "@/lib/openrouter";
import { getCalendarPrefs } from "@/lib/preferences";
import { createReminder } from "@/lib/reminders";
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

type Props = {
  onCreated?: () => void;
};

export default function AddReminderButton({ onCreated }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetAndClose() {
    setPrompt("");
    setError(null);
    setSuccess(null);
    setModalOpen(false);
  }

  async function handleSubmit() {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const parsed = await parseReminderPrompt(trimmed);
      const scheduledAt = new Date(parsed.scheduled_at);

      const scheduled = await scheduleReminderNotifications({
        title: parsed.title,
        body: parsed.notification_message,
        scheduledAt,
        notifyBeforeMinutes: parsed.notify_before_minutes,
      });

      await createReminder({
        prompt: trimmed,
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        scheduled_at: parsed.scheduled_at,
        notify_before_minutes: parsed.notify_before_minutes,
        notification_message: parsed.notification_message,
        notification_ids: scheduled.map((s) => s.id),
      });

      const calendarPrefs = await getCalendarPrefs();
      if (calendarPrefs.enabled && calendarPrefs.calendarId) {
        await addReminderToCalendar({
          calendarId: calendarPrefs.calendarId,
          title: parsed.title,
          notes: parsed.description,
          scheduledAt: scheduledAt,
        });
      }

      setSuccess(
        `Reminder set for ${scheduledAt.toLocaleString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}`,
      );
      setPrompt("");
      onCreated?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Pressable style={styles.button} onPress={() => setModalOpen(true)}>
        <Feather name="plus" size={28} color="#ffffff" />
        <Text style={styles.buttonText}>New reminder</Text>
      </Pressable>

      <Modal transparent animationType="fade" visible={modalOpen}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>What should I remind you about?</Text>
            <Text style={styles.hint}>
              Try &ldquo;call mom 7&rdquo; or &ldquo;dentist tomorrow 2pm&rdquo;
            </Text>

            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="e.g. call mom 7"
              placeholderTextColor="#8a8f98"
              multiline
              autoFocus
              editable={!loading}
              style={styles.input}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={resetAndClose}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Close</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryButton,
                  (loading || !prompt.trim()) && styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create</Text>
                )}
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
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#2E7D32",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
  },
  backdrop: {
    backgroundColor: "rgba(33,33,33,0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: "Nunito_700Bold",
    color: "#173404",
  },
  hint: {
    fontSize: 13,
    color: "#2E7D32",
    fontFamily: "Nunito_400Regular",
    marginBottom: 4,
  },
  input: {
    borderColor: "#F1F8E9",
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 90,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#212121",
  },
  errorText: {
    color: "#d03535",
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
  },
  successText: {
    color: "#2E7D32",
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 8,
  },
  secondaryButton: {
    borderColor: "#2E7D32",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#2E7D32",
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
  },
});
