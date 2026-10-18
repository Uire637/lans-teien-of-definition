import type { Activity, AppState, Category, Day } from "./types";
export const categories: Record<Category, { label: string; color: string }> = {
  study: { label: "学习", color: "blue" },
  work: { label: "工作", color: "blue" },
  hobby: { label: "兴趣", color: "purple" },
  exercise: { label: "运动", color: "green" },
  chores: { label: "生活", color: "orange" },
  rest: { label: "休息", color: "sage" },
};
export const loadLabels = { low: "低负荷", medium: "中负荷", high: "高负荷" };
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function newDay(): Day {
  return {
    budget: 7,
    sleep: null,
    fatigue: "medium",
    checkIn: {
      energy: "medium",
      mood: "any",
      availableMinutes: 30,
      urgentOnly: false,
    },
    freeTime: { start: "19:30", minutes: 45, title: "做一点喜欢的事" },
    shutdown: { done: false, reflection: "", tomorrow: "", unfinished: "" },
  };
}
export function makeActivity(
  fields: Partial<Activity> & Pick<Activity, "title">,
  date = localDate(),
): Activity {
  return {
    id: crypto.randomUUID(),
    category: "study",
    minutes: 25,
    energy: 2,
    load: "medium",
    priority: 2,
    urgent: false,
    endCondition: "",
    date,
    status: "planned",
    ...fields,
  };
}
export function initialState(date = localDate()): AppState {
  return {
    version: 1,
    theme: "light",
    timer: null,
    days: { [date]: newDay() },
    activities: [
      makeActivity(
        {
          title: "读几页喜欢的书",
          category: "hobby",
          minutes: 20,
          energy: 1,
          load: "low",
          endCondition: "读完一个小章节就好",
        },
        date,
      ),
      makeActivity(
        {
          title: "出门走走，透透气",
          category: "exercise",
          minutes: 15,
          energy: 1,
          load: "low",
          endCondition: "走到喜欢的地方，再慢慢回来",
        },
        date,
      ),
      makeActivity(
        {
          title: "复习一小节课程",
          category: "study",
          minutes: 25,
          energy: 2,
          load: "high",
          priority: 3,
          endCondition: "完成一小节，不需要多做",
        },
        date,
      ),
      makeActivity(
        {
          title: "整理一下桌面",
          category: "chores",
          minutes: 10,
          energy: 0.5,
          load: "low",
          priority: 1,
          endCondition: "收好桌面上散落的东西",
        },
        date,
      ),
    ],
  };
}
