import * as Calendar from "expo-calendar";
import { Platform } from "react-native";

export type PickableCalendar = {
  id: string;
  title: string;
  source: string;
  color?: string;
};

export async function ensureCalendarPermission(): Promise<boolean> {
  const existing = await Calendar.getCalendarPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const req = await Calendar.requestCalendarPermissionsAsync();
    status = req.status;
  }
  return status === "granted";
}

export async function listWritableCalendars(): Promise<PickableCalendar[]> {
  const granted = await ensureCalendarPermission();
  if (!granted) return [];

  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT,
  );

  return calendars
    .filter((c) => c.allowsModifications)
    .map((c) => ({
      id: c.id,
      title: c.title,
      source:
        typeof c.source === "string"
          ? c.source
          : (c.source?.name ?? "Calendar"),
      color: c.color,
    }));
}

export async function addReminderToCalendar(params: {
  calendarId: string;
  title: string;
  notes?: string | null;
  scheduledAt: Date;
}): Promise<string | null> {
  const granted = await ensureCalendarPermission();
  if (!granted) return null;

  const start = params.scheduledAt;
  const end = new Date(start.getTime() + 30 * 60_000);

  try {
    const id = await Calendar.createEventAsync(params.calendarId, {
      title: params.title,
      notes: params.notes ?? undefined,
      startDate: start,
      endDate: end,
      timeZone:
        Platform.OS === "ios"
          ? undefined
          : Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    return id;
  } catch (e) {
    console.warn("Failed to add event to calendar", e);
    return null;
  }
}
