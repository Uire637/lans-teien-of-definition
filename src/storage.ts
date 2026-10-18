import type { Activity, AppState, Day } from "./types";
import { initialState, localDate, newDay } from "./data";
export const STORAGE_KEY = "liubai-energy:v1";
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const finite = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const oneOf = (v: unknown, values: string[]) =>
  typeof v === "string" && values.includes(v);
function validActivity(a: unknown): a is Activity {
  return (
    object(a) &&
    typeof a.id === "string" &&
    typeof a.title === "string" &&
    a.title.trim().length > 0 &&
    typeof a.endCondition === "string" &&
    oneOf(a.category, [
      "study",
      "work",
      "hobby",
      "exercise",
      "chores",
      "rest",
    ]) &&
    oneOf(a.load, ["low", "medium", "high"]) &&
    finite(a.minutes, 1, 480) &&
    finite(a.energy, 0, 10) &&
    [1, 2, 3].includes(a.priority as number) &&
    typeof a.urgent === "boolean" &&
    typeof a.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(a.date) &&
    oneOf(a.status, ["planned", "done", "later"]) &&
    (a.completedAt === undefined ||
      finite(a.completedAt, 0, Number.MAX_SAFE_INTEGER))
  );
}
function validDay(d: unknown): d is Day {
  if (
    !object(d) ||
    !object(d.checkIn) ||
    !object(d.freeTime) ||
    !object(d.shutdown)
  )
    return false;
  return (
    finite(d.budget, 1, 10) &&
    (d.sleep === null || finite(d.sleep, 0, 24)) &&
    oneOf(d.fatigue, ["high", "medium", "low"]) &&
    oneOf(d.checkIn.energy, ["high", "medium", "low"]) &&
    oneOf(d.checkIn.mood, ["any", "focus", "relax", "move"]) &&
    finite(d.checkIn.availableMinutes, 1, 480) &&
    typeof d.checkIn.urgentOnly === "boolean" &&
    typeof d.freeTime.start === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(d.freeTime.start) &&
    finite(d.freeTime.minutes, 5, 240) &&
    typeof d.freeTime.title === "string" &&
    typeof d.shutdown.done === "boolean" &&
    ["reflection", "tomorrow", "unfinished"].every(
      (k) => typeof (d.shutdown as Record<string, unknown>)[k] === "string",
    )
  );
}
export function loadState(
  storage: StorageLike,
  date = localDate(),
): { state: AppState; warning: string | null } {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      state: initialState(date),
      warning: "浏览器暂时无法读取本地数据，请检查存储权限。",
    };
  }
  if (!raw) return { state: initialState(date), warning: null };
  try {
    const s: unknown = JSON.parse(raw);
    if (
      !object(s) ||
      s.version !== 1 ||
      !Array.isArray(s.activities) ||
      !s.activities.every(validActivity) ||
      !object(s.days) ||
      !Object.values(s.days).every(validDay) ||
      !oneOf(s.theme, ["light", "dark"])
    )
      throw Error("Invalid data");
    const state = s as unknown as AppState;
    if (state.timer !== null) {
      const t = state.timer;
      if (
        !object(t) ||
        typeof t.activityId !== "string" ||
        !state.activities.some(
          (a) => a.id === t.activityId && a.status === "planned",
        ) ||
        !finite(t.durationSeconds, 1, 28800) ||
        !finite(t.remainingSeconds, 0, 28800) ||
        (t.endAt !== null && !finite(t.endAt, 0, Number.MAX_SAFE_INTEGER))
      )
        state.timer = null;
    }
    if (!state.days[date]) state.days[date] = newDay();
    return { state, warning: null };
  } catch {
    return {
      state: initialState(date),
      warning:
        "本地数据无法识别，已打开临时工作区。原数据未覆盖，请先备份浏览器中的 liubai-energy:v1 数据后再重置。",
    };
  }
}
export function saveState(storage: StorageLike, state: AppState): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
