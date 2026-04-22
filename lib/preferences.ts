import AsyncStorage from "@react-native-async-storage/async-storage";

const CALENDAR_KEY = "@remainder:calendar_sync";
const QUIET_HOURS_KEY = "@remainder:quiet_hours";

export type CalendarPrefs = {
  enabled: boolean;
  calendarId: string | null;
  calendarTitle: string | null;
};

export type QuietHoursPrefs = {
  enabled: boolean;
  startMinutes: number;
  endMinutes: number;
};

const DEFAULT_CALENDAR: CalendarPrefs = {
  enabled: false,
  calendarId: null,
  calendarTitle: null,
};

const DEFAULT_QUIET_HOURS: QuietHoursPrefs = {
  enabled: false,
  startMinutes: 1 * 60,
  endMinutes: 7 * 60,
};

export async function getCalendarPrefs(): Promise<CalendarPrefs> {
  try {
    const raw = await AsyncStorage.getItem(CALENDAR_KEY);
    if (!raw) return DEFAULT_CALENDAR;
    return { ...DEFAULT_CALENDAR, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CALENDAR;
  }
}

export async function setCalendarPrefs(prefs: CalendarPrefs): Promise<void> {
  await AsyncStorage.setItem(CALENDAR_KEY, JSON.stringify(prefs));
}

export async function getQuietHoursPrefs(): Promise<QuietHoursPrefs> {
  try {
    const raw = await AsyncStorage.getItem(QUIET_HOURS_KEY);
    if (!raw) return DEFAULT_QUIET_HOURS;
    return { ...DEFAULT_QUIET_HOURS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_QUIET_HOURS;
  }
}

export async function setQuietHoursPrefs(
  prefs: QuietHoursPrefs,
): Promise<void> {
  await AsyncStorage.setItem(QUIET_HOURS_KEY, JSON.stringify(prefs));
}

export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function isInQuietHours(d: Date, prefs: QuietHoursPrefs): boolean {
  if (!prefs.enabled) return false;
  const { startMinutes, endMinutes } = prefs;
  if (startMinutes === endMinutes) return false;
  const m = minutesOfDay(d);
  if (startMinutes < endMinutes) {
    return m >= startMinutes && m < endMinutes;
  }
  return m >= startMinutes || m < endMinutes;
}

// Returns the earliest Date at or after `d` that is NOT inside the quiet window.
export function shiftOutOfQuietHours(
  d: Date,
  prefs: QuietHoursPrefs,
): Date {
  if (!isInQuietHours(d, prefs)) return d;
  const shifted = new Date(d);
  const m = minutesOfDay(shifted);
  const { startMinutes, endMinutes } = prefs;
  const crossesMidnight = startMinutes > endMinutes;
  shifted.setSeconds(0, 0);
  if (crossesMidnight && m >= startMinutes) {
    shifted.setDate(shifted.getDate() + 1);
    shifted.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
  } else {
    shifted.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
  }
  return shifted;
}

export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const mm = m.toString().padStart(2, "0");
  return `${hour12}:${mm} ${ampm}`;
}

export function dateFromMinutes(totalMinutes: number): Date {
  const d = new Date();
  d.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  return d;
}
