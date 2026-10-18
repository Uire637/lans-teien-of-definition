export type Category =
  | "study"
  | "work"
  | "hobby"
  | "exercise"
  | "chores"
  | "rest";
export type Load = "low" | "medium" | "high";
export type Energy = "high" | "medium" | "low";
export type Mood = "any" | "focus" | "relax" | "move";
export type Page = "today" | "activities" | "later" | "shutdown";
export interface Activity {
  id: string;
  title: string;
  category: Category;
  minutes: number;
  energy: number;
  load: Load;
  priority: 1 | 2 | 3;
  urgent: boolean;
  endCondition: string;
  date: string;
  status: "planned" | "done" | "later";
  completedAt?: number;
}
export interface CheckIn {
  energy: Energy;
  mood: Mood;
  availableMinutes: number;
  urgentOnly: boolean;
}
export interface Day {
  budget: number;
  sleep: number | null;
  fatigue: Energy;
  checkIn: CheckIn;
  freeTime: { start: string; minutes: number; title: string };
  shutdown: {
    done: boolean;
    reflection: string;
    tomorrow: string;
    unfinished: string;
  };
}
export interface Timer {
  activityId: string;
  durationSeconds: number;
  remainingSeconds: number;
  endAt: number | null;
}
export interface AppState {
  version: 1;
  activities: Activity[];
  days: Record<string, Day>;
  timer: Timer | null;
  theme: "light" | "dark";
}
export interface Recommendation {
  activity: Activity;
  reason: string;
  score: number;
}
