const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const MODEL =
  process.env.EXPO_PUBLIC_OPENROUTER_MODEL ?? "anthropic/claude-3.5-haiku";

export type ParsedReminder = {
  title: string;
  description: string;
  category: string;
  scheduled_at: string;
  notify_before_minutes: number[];
  notification_message: string;
};

const SYSTEM_PROMPT = `You turn short natural-language reminder prompts into structured JSON.

The user will give you something terse like "call mom 7" or "gym tomorrow 6am" or "dentist appt next tuesday 2pm".

Infer:
- title: a short imperative title, Title Case (e.g. "Call Mom")
- description: one short sentence describing what to do
- category: one of "personal", "work", "health", "social", "errand", "other"
- scheduled_at: ISO-8601 date-time WITH the SAME timezone offset as the user's "Current local date-time" given below. Do not convert to UTC. Example: if current local is "2026-04-21T06:57:00+02:00" and user says "in 5 minutes", return "2026-04-21T07:02:00+02:00". Interpret ambiguous times generously (e.g. "7" when said in the morning means 7pm that day if 7pm is still in the future, otherwise next day; "tomorrow" means tomorrow; default to a reasonable sensible time).
- notify_before_minutes: array of minutes-before-event to pre-notify. Always include 0 (notify at the event time). Add additional pre-notifications based on the type of event: calls/quick tasks get [60, 0], appointments/meetings get [60, 15, 0], travel/trips get [1440, 60, 0]. Pick what's appropriate, never more than 3 entries.
- notification_message: the body text for the "it's time" notification. Friendly, direct, uses the event in context. Example: "It's 7pm — time to call your mom."

Rules:
- Respond ONLY with a single JSON object. No prose, no markdown, no code fences.
- Use the user's current local time as the reference for relative times.
- If the prompt is totally unparseable, make a best guess and set scheduled_at to 1 hour from now.`;

export async function parseReminderPrompt(
  prompt: string,
): Promise<ParsedReminder> {
  if (!API_KEY) {
    throw new Error(
      "Missing EXPO_PUBLIC_OPENROUTER_API_KEY — restart Expo after editing .env",
    );
  }

  const now = new Date();
  const localIso = formatLocalIso(now);
  const userMessage = `Current local date-time: ${localIso}
Current weekday: ${now.toLocaleDateString([], { weekday: "long" })}

User prompt: ${prompt}

Return scheduled_at using the SAME offset as the current local date-time above.`;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": "https://github.com/chrlnd/RemAInder",
      "X-Title": "RemAInder",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned no content");
  }

  const parsed = extractJson(content);
  return normalizeReminder(parsed);
}

function formatLocalIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const offset = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${offset}`
  );
}

function extractJson(content: string): any {
  try {
    return JSON.parse(content);
  } catch {}
  const match = content.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error(`Could not parse JSON from model output: ${content}`);
}

function normalizeReminder(raw: any): ParsedReminder {
  const scheduled = new Date(raw.scheduled_at);
  if (Number.isNaN(scheduled.getTime())) {
    throw new Error(`Invalid scheduled_at from model: ${raw.scheduled_at}`);
  }

  const rawMinutes: unknown = raw.notify_before_minutes;
  let minutes: number[] = Array.isArray(rawMinutes)
    ? rawMinutes
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v >= 0)
    : [0];
  if (!minutes.includes(0)) minutes.push(0);
  minutes = Array.from(new Set(minutes)).sort((a, b) => b - a);

  return {
    title: String(raw.title ?? "Reminder").slice(0, 80),
    description: String(raw.description ?? ""),
    category: String(raw.category ?? "other"),
    scheduled_at: scheduled.toISOString(),
    notify_before_minutes: minutes,
    notification_message: String(
      raw.notification_message ?? raw.title ?? "Reminder",
    ),
  };
}
