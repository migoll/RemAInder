import { supabase } from "./supabase";

export type Reminder = {
  id: string;
  user_id: string;
  prompt: string;
  title: string;
  description: string | null;
  category: string | null;
  scheduled_at: string;
  notify_before_minutes: number[];
  notification_message: string | null;
  notification_ids: string[];
  status: "pending" | "completed" | "dismissed";
  created_at: string;
};

export type NewReminderInput = Omit<
  Reminder,
  "id" | "user_id" | "created_at" | "status"
>;

export async function createReminder(
  input: NewReminderInput,
): Promise<Reminder> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("reminders")
    .insert({ ...input, user_id: user.id, status: "pending" })
    .select()
    .single();

  if (error) throw error;
  return data as Reminder;
}

export async function listReminders(): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Reminder[];
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw error;
}

export async function markCompleted(id: string): Promise<void> {
  const { error } = await supabase
    .from("reminders")
    .update({ status: "completed" })
    .eq("id", id);
  if (error) throw error;
}
