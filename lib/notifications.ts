import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permissionChecked = false;
let permissionGranted = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (permissionChecked) return permissionGranted;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }

  permissionChecked = true;
  permissionGranted = status === "granted";
  return permissionGranted;
}

export type ScheduledNotification = {
  id: string;
  fireAt: string;
};

export async function scheduleReminderNotifications(params: {
  title: string;
  body: string;
  scheduledAt: Date;
  notifyBeforeMinutes: number[];
}): Promise<ScheduledNotification[]> {
  const granted = await ensureNotificationPermission();
  if (!granted) return [];

  const now = Date.now();
  const out: ScheduledNotification[] = [];

  for (const minutesBefore of params.notifyBeforeMinutes) {
    const fireAt = new Date(
      params.scheduledAt.getTime() - minutesBefore * 60_000,
    );
    if (fireAt.getTime() <= now + 1000) continue;

    const body =
      minutesBefore === 0
        ? params.body
        : `In ${formatLead(minutesBefore)}: ${params.title}`;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body,
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: Platform.OS === "android" ? "reminders" : undefined,
      },
    });

    out.push({ id, fireAt: fireAt.toISOString() });
  }

  return out;
}

export async function cancelNotifications(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
}

function formatLead(minutes: number): string {
  if (minutes >= 60 * 24) {
    const days = Math.round(minutes / (60 * 24));
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (minutes >= 60) {
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${minutes} min`;
}
