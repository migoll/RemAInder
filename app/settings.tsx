import {
  ensureCalendarPermission,
  listWritableCalendars,
  type PickableCalendar,
} from "@/lib/calendar";
import {
  formatMinutes,
  getCalendarPrefs,
  getQuietHoursPrefs,
  setCalendarPrefs,
  setQuietHoursPrefs,
  type CalendarPrefs,
  type QuietHoursPrefs,
} from "@/lib/preferences";
import { supabase } from "@/lib/supabase";
import Feather from "@expo/vector-icons/Feather";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const router = useRouter();
  const [calendar, setCalendar] = useState<CalendarPrefs | null>(null);
  const [quietHours, setQuietHours] = useState<QuietHoursPrefs | null>(null);

  const [calendarBusy, setCalendarBusy] = useState(false);
  const [androidPickerCalendars, setAndroidPickerCalendars] = useState<
    PickableCalendar[] | null
  >(null);
  const androidPickerResolveRef = useRef<
    ((c: PickableCalendar | null) => void) | null
  >(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    (async () => {
      const [cal, qh] = await Promise.all([
        getCalendarPrefs(),
        getQuietHoursPrefs(),
      ]);
      setCalendar(cal);
      setQuietHours(qh);
    })();
  }, []);

  async function promptCalendarPick(): Promise<PickableCalendar | null> {
    const granted = await ensureCalendarPermission();
    if (!granted) {
      Alert.alert(
        "Calendar access needed",
        "Grant calendar access in Settings to sync reminders.",
      );
      return null;
    }
    const calendars = await listWritableCalendars();
    if (calendars.length === 0) {
      Alert.alert(
        "No calendars available",
        "Add a calendar account on your device first, then try again.",
      );
      return null;
    }

    if (Platform.OS === "ios") {
      return new Promise((resolve) => {
        const labels = calendars.map((c) => `${c.title} (${c.source})`);
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: "Save reminders to",
            options: [...labels, "Cancel"],
            cancelButtonIndex: labels.length,
          },
          (idx) => {
            if (idx === labels.length || idx < 0) resolve(null);
            else resolve(calendars[idx]);
          },
        );
      });
    }

    return new Promise((resolve) => {
      androidPickerResolveRef.current = resolve;
      setAndroidPickerCalendars(calendars);
    });
  }

  async function onToggleCalendar(next: boolean) {
    if (!calendar) return;
    if (!next) {
      const updated = { ...calendar, enabled: false };
      setCalendar(updated);
      await setCalendarPrefs(updated);
      return;
    }

    setCalendarBusy(true);
    try {
      const picked = await promptCalendarPick();
      if (!picked) {
        setCalendar({ ...calendar, enabled: false });
        return;
      }
      const updated: CalendarPrefs = {
        enabled: true,
        calendarId: picked.id,
        calendarTitle: picked.title,
      };
      setCalendar(updated);
      await setCalendarPrefs(updated);
    } finally {
      setCalendarBusy(false);
    }
  }

  async function onChangeCalendar() {
    if (!calendar) return;
    setCalendarBusy(true);
    try {
      const picked = await promptCalendarPick();
      if (!picked) return;
      const updated: CalendarPrefs = {
        enabled: true,
        calendarId: picked.id,
        calendarTitle: picked.title,
      };
      setCalendar(updated);
      await setCalendarPrefs(updated);
    } finally {
      setCalendarBusy(false);
    }
  }

  async function onToggleQuietHours(next: boolean) {
    if (!quietHours) return;
    const updated = { ...quietHours, enabled: next };
    setQuietHours(updated);
    await setQuietHoursPrefs(updated);
  }

  async function onChangeStart(ev: DateTimePickerEvent, d?: Date) {
    if (Platform.OS !== "ios") setShowStartPicker(false);
    if (!quietHours || !d || ev.type === "dismissed") return;
    const startMinutes = d.getHours() * 60 + d.getMinutes();
    const updated = { ...quietHours, startMinutes };
    setQuietHours(updated);
    await setQuietHoursPrefs(updated);
  }

  async function onChangeEnd(ev: DateTimePickerEvent, d?: Date) {
    if (Platform.OS !== "ios") setShowEndPicker(false);
    if (!quietHours || !d || ev.type === "dismissed") return;
    const endMinutes = d.getHours() * 60 + d.getMinutes();
    const updated = { ...quietHours, endMinutes };
    setQuietHours(updated);
    await setQuietHoursPrefs(updated);
  }

  async function onSignOut() {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      Alert.alert("Sign out failed", error.message);
      return;
    }
    router.replace("/login");
  }

  if (!calendar || !quietHours) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loading}>
          <ActivityIndicator color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  const startDate = minutesToDate(quietHours.startMinutes);
  const endDate = minutesToDate(quietHours.endMinutes);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
        >
          <Feather name="chevron-left" size={28} color="#2E7D32" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title="Calendar">
          <Row
            label="Add reminders to calendar"
            sub={
              calendar.enabled && calendar.calendarTitle
                ? `Saving to ${calendar.calendarTitle}`
                : "Save new reminders as calendar events"
            }
            right={
              calendarBusy ? (
                <ActivityIndicator color="#2E7D32" />
              ) : (
                <Switch
                  value={calendar.enabled}
                  onValueChange={onToggleCalendar}
                  trackColor={{ true: "#A5D6A7", false: "#D7DBD3" }}
                  thumbColor={calendar.enabled ? "#2E7D32" : "#ffffff"}
                />
              )
            }
          />
          {calendar.enabled ? (
            <Pressable style={styles.subAction} onPress={onChangeCalendar}>
              <Text style={styles.subActionText}>Change calendar</Text>
              <Feather name="chevron-right" size={18} color="#2E7D32" />
            </Pressable>
          ) : null}
        </Section>

        <Section title="Quiet hours">
          <Row
            label="Silence notifications"
            sub="Reminders in this window are delayed until after it ends."
            right={
              <Switch
                value={quietHours.enabled}
                onValueChange={onToggleQuietHours}
                trackColor={{ true: "#A5D6A7", false: "#D7DBD3" }}
                thumbColor={quietHours.enabled ? "#2E7D32" : "#ffffff"}
              />
            }
          />
          {quietHours.enabled ? (
            <View style={styles.timeRow}>
              <TimeCell
                label="Start"
                value={formatMinutes(quietHours.startMinutes)}
                onPress={() => setShowStartPicker(true)}
              />
              <TimeCell
                label="End"
                value={formatMinutes(quietHours.endMinutes)}
                onPress={() => setShowEndPicker(true)}
              />
            </View>
          ) : null}
          {quietHours.enabled && Platform.OS === "ios" ? (
            <Text style={styles.hint}>
              Tip: iOS Focus / Sleep mode will also silence reminders at the OS
              level based on your Focus settings.
            </Text>
          ) : null}
        </Section>

        <Pressable
          style={[styles.signOutButton, signingOut && styles.buttonDisabled]}
          onPress={onSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator color="#FF4081" />
          ) : (
            <>
              <Feather name="log-out" size={18} color="#FF4081" />
              <Text style={styles.signOutText}>Log out</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {showStartPicker && Platform.OS === "ios" ? (
        <IosPickerSheet
          title="Quiet hours start"
          value={startDate}
          onCancel={() => setShowStartPicker(false)}
          onConfirm={(d) => {
            setShowStartPicker(false);
            onChangeStart({ type: "set" } as DateTimePickerEvent, d);
          }}
        />
      ) : null}
      {showEndPicker && Platform.OS === "ios" ? (
        <IosPickerSheet
          title="Quiet hours end"
          value={endDate}
          onCancel={() => setShowEndPicker(false)}
          onConfirm={(d) => {
            setShowEndPicker(false);
            onChangeEnd({ type: "set" } as DateTimePickerEvent, d);
          }}
        />
      ) : null}
      {showStartPicker && Platform.OS !== "ios" ? (
        <DateTimePicker
          value={startDate}
          mode="time"
          is24Hour={false}
          onChange={onChangeStart}
        />
      ) : null}
      {showEndPicker && Platform.OS !== "ios" ? (
        <DateTimePicker
          value={endDate}
          mode="time"
          is24Hour={false}
          onChange={onChangeEnd}
        />
      ) : null}

      {androidPickerCalendars ? (
        <AndroidCalendarPicker
          calendars={androidPickerCalendars}
          onPick={(c) => {
            const resolve = androidPickerResolveRef.current;
            androidPickerResolveRef.current = null;
            setAndroidPickerCalendars(null);
            resolve?.(c);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function minutesToDate(totalMinutes: number): Date {
  const d = new Date();
  d.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  return d;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  label,
  sub,
  right,
}: {
  label: string;
  sub?: string;
  right: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function TimeCell({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.timeCell} onPress={onPress}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={styles.timeValue}>{value}</Text>
    </Pressable>
  );
}

function IosPickerSheet({
  title,
  value,
  onCancel,
  onConfirm,
}: {
  title: string;
  value: Date;
  onCancel: () => void;
  onConfirm: (d: Date) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <Modal transparent animationType="slide" visible>
      <Pressable style={styles.sheetBackdrop} onPress={onCancel} />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={styles.sheetCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Pressable onPress={() => onConfirm(draft)} hitSlop={8}>
            <Text style={styles.sheetDone}>Done</Text>
          </Pressable>
        </View>
        <DateTimePicker
          value={draft}
          mode="time"
          display="spinner"
          onChange={(_, d) => {
            if (d) setDraft(d);
          }}
        />
      </View>
    </Modal>
  );
}

function AndroidCalendarPicker({
  calendars,
  onPick,
}: {
  calendars: PickableCalendar[];
  onPick: (c: PickableCalendar | null) => void;
}) {
  return (
    <Modal transparent animationType="fade" visible>
      <Pressable style={styles.sheetBackdrop} onPress={() => onPick(null)} />
      <View style={styles.sheet}>
        <Text style={[styles.sheetTitle, { padding: 16 }]}>
          Save reminders to
        </Text>
        {calendars.map((c) => (
          <Pressable
            key={c.id}
            style={styles.calendarOption}
            onPress={() => onPick(c)}
          >
            <View
              style={[
                styles.calendarDot,
                { backgroundColor: c.color ?? "#2E7D32" },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{c.title}</Text>
              <Text style={styles.rowSub}>{c.source}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFCF7" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  backButton: { width: 28, alignItems: "flex-start" },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Nunito_700Bold",
    color: "#2E7D32",
  },
  scroll: { padding: 16, gap: 20, paddingBottom: 32 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
    color: "#2E7D32",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F1F8E9",
    overflow: "hidden",
    shadowColor: "#173404",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: "#173404",
  },
  rowSub: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: "#2E7D32",
    marginTop: 2,
  },
  subAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F8E9",
  },
  subActionText: {
    fontSize: 14,
    fontFamily: "Nunito_700Bold",
    color: "#2E7D32",
  },
  timeRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1F8E9",
  },
  timeCell: {
    flex: 1,
    padding: 14,
    alignItems: "flex-start",
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: "#2E7D32",
  },
  timeValue: {
    fontSize: 20,
    fontFamily: "Nunito_700Bold",
    color: "#173404",
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: "#5c6a54",
    fontFamily: "Nunito_400Regular",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  signOutButton: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FF408170",
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: "#FF4081",
  },
  buttonDisabled: { opacity: 0.5 },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEFE8",
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: "#173404",
  },
  sheetCancel: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "#5c6a54",
  },
  sheetDone: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: "#2E7D32",
  },
  calendarOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F8E9",
  },
  calendarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
