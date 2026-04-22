import { cancelNotifications } from "@/lib/notifications";
import {
  deleteReminder,
  listReminders,
  markCompleted,
  type Reminder,
} from "@/lib/reminders";
import Feather from "@expo/vector-icons/Feather";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type RemindersListHandle = {
  refresh: () => void;
};

const RemindersList = forwardRef<RemindersListHandle>((_props, ref) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const rows = await listReminders();
      setReminders(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useImperativeHandle(ref, () => ({ refresh: () => load(true) }), [load]);

  async function onDelete(r: Reminder) {
    await cancelNotifications(r.notification_ids ?? []);
    await deleteReminder(r.id);
    setReminders((prev) => prev.filter((x) => x.id !== r.id));
  }

  async function onComplete(r: Reminder) {
    await cancelNotifications(r.notification_ids ?? []);
    await markCompleted(r.id);
    setReminders((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, status: "completed" } : x)),
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2E7D32" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor="#2E7D32"
        />
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {reminders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No reminders yet</Text>
          <Text style={styles.emptyText}>
            Tap &ldquo;New reminder&rdquo; above and type what you want to be
            reminded about.
          </Text>
        </View>
      ) : (
        reminders.map((r) => (
          <View
            key={r.id}
            style={[
              styles.card,
              r.status === "completed" && styles.cardCompleted,
            ]}
          >
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{r.title}</Text>
              {r.description ? (
                <Text style={styles.cardDescription}>{r.description}</Text>
              ) : null}
              <Text style={styles.cardMeta}>{formatWhen(r.scheduled_at)}</Text>
              {r.notify_before_minutes?.length ? (
                <Text style={styles.cardSubMeta}>
                  Notifies: {formatLeads(r.notify_before_minutes)}
                </Text>
              ) : null}
            </View>
            <View style={styles.cardActions}>
              {r.status !== "completed" ? (
                <Pressable
                  onPress={() => onComplete(r)}
                  style={styles.iconButton}
                  hitSlop={8}
                >
                  <Feather name="check" size={18} color="#2E7D32" />
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => onDelete(r)}
                style={styles.iconButton}
                hitSlop={8}
              >
                <Feather name="trash-2" size={18} color="#FF4081" />
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
});

RemindersList.displayName = "RemindersList";

export default RemindersList;

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLeads(minutes: number[]): string {
  return minutes
    .slice()
    .sort((a, b) => b - a)
    .map((m) => {
      if (m === 0) return "on time";
      if (m >= 60 * 24) {
        const d = Math.round(m / (60 * 24));
        return `${d}d before`;
      }
      if (m >= 60) {
        const h = Math.round(m / 60);
        return `${h}h before`;
      }
      return `${m}m before`;
    })
    .join(" · ");
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  centered: {
    paddingVertical: 24,
    alignItems: "center",
  },
  error: {
    color: "#d03535",
    paddingVertical: 8,
  },
  empty: {
    padding: 20,
    borderRadius: 14,
    backgroundColor: "#F1F8E9",
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#173404",
  },
  emptyText: {
    fontSize: 14,
    color: "#2E7D32",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#173404",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F1F8E9",
  },
  cardCompleted: {
    opacity: 0.55,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#173404",
  },
  cardDescription: {
    fontSize: 14,
    color: "#444",
  },
  cardMeta: {
    fontSize: 13,
    color: "#2E7D32",
    fontFamily: "Nunito_700Bold",
    marginTop: 2,
  },
  cardSubMeta: {
    fontSize: 12,
    color: "#6a6a6a",
  },
  cardActions: {
    flexDirection: "row",
    gap: 6,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F8E9",
  },
});
