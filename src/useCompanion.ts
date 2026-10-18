import { useEffect, useRef, useState } from "react";
import { localDate, makeActivity, newDay } from "./data";
import { loadState, saveState } from "./storage";
import type { Activity, AppState, Day } from "./types";
const browserStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) =>
    window.localStorage.setItem(key, value),
};
export function useCompanion() {
  const [boot] = useState(() => loadState(browserStorage));
  const [state, setState] = useState<AppState>(boot.state);
  const [storageWarning, setStorageWarning] = useState(boot.warning);
  const [preserveOriginal, setPreserveOriginal] = useState(!!boot.warning);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState("");
  const toastTime = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const today = localDate(new Date(now));
  const day = state.days[today] || newDay();
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => () => clearTimeout(toastTime.current), []);
  useEffect(() => {
    if (!state.days[today])
      setState((s) => ({ ...s, days: { ...s.days, [today]: newDay() } }));
  }, [today, state.days]);
  useEffect(() => {
    if (preserveOriginal) return;
    const ok = saveState(browserStorage, state);
    setStorageWarning(
      ok
        ? null
        : "本地保存失败（存储空间或权限受限）。当前更改只在此页面中，请勿关闭页面。",
    );
  }, [state, preserveOriginal]);
  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.style.colorScheme = state.theme;
  }, [state.theme]);
  function notify(message: string) {
    setToast(message);
    clearTimeout(toastTime.current);
    toastTime.current = setTimeout(() => setToast(""), 3500);
  }
  function updateDay(fields: Partial<Day>) {
    setState((s) => ({
      ...s,
      days: {
        ...s.days,
        [today]: { ...(s.days[today] || newDay()), ...fields },
      },
    }));
  }
  function addActivity(fields: Partial<Activity> & Pick<Activity, "title">) {
    const a = makeActivity(fields, today);
    setState((s) => ({ ...s, activities: [...s.activities, a] }));
    return a;
  }
  function updateActivity(id: string, fields: Partial<Activity>) {
    setState((s) => ({
      ...s,
      activities: s.activities.map((a) =>
        a.id === id ? { ...a, ...fields } : a,
      ),
    }));
  }
  function finishActivity(id: string) {
    setState((s) => ({
      ...s,
      activities: s.activities.map((a) =>
        a.id === id
          ? { ...a, status: "done", date: today, completedAt: Date.now() }
          : a,
      ),
      timer: s.timer?.activityId === id ? null : s.timer,
    }));
    notify("这件事完成了。也记得给自己一点休息。");
  }
  function startActivity(a: Activity) {
    if (day.shutdown.done) {
      notify("今天已经收尾了。想继续的话，可以先重新打开今天。");
      return false;
    }
    if (state.timer) {
      notify("先处理当前的计时，再开始下一件事。");
      return false;
    }
    let id = a.id;
    if (id === "suggested-rest")
      id = addActivity({ ...a, id: crypto.randomUUID(), date: today }).id;
    setState((s) => ({
      ...s,
      timer: {
        activityId: id,
        durationSeconds: a.minutes * 60,
        remainingSeconds: a.minutes * 60,
        endAt: Date.now() + a.minutes * 60000,
      },
    }));
    notify(
      a.category === "rest"
        ? "这段时间，什么都不用完成。"
        : "开始了。做到预定的地方，就可以停下来。",
    );
    return true;
  }
  const seconds = state.timer
    ? Math.max(
        0,
        state.timer.endAt
          ? Math.ceil((state.timer.endAt - now) / 1000)
          : state.timer.remainingSeconds,
      )
    : 0;
  function toggleTimer() {
    setState((s) => {
      if (!s.timer) return s;
      const t = s.timer;
      return {
        ...s,
        timer: t.endAt
          ? {
              ...t,
              remainingSeconds: Math.max(
                0,
                Math.ceil((t.endAt - Date.now()) / 1000),
              ),
              endAt: null,
            }
          : { ...t, endAt: Date.now() + t.remainingSeconds * 1000 },
      };
    });
  }
  function extendTimer() {
    setState((s) =>
      s.timer
        ? {
            ...s,
            timer: {
              ...s.timer,
              durationSeconds: s.timer.durationSeconds + 300,
              remainingSeconds: 300,
              endAt: Date.now() + 300000,
            },
          }
        : s,
    );
  }
  function stopTimer() {
    setState((s) => ({ ...s, timer: null }));
    notify("已经停下来了。进度不会因为休息而失去价值。");
  }
  return {
    state,
    setState,
    today,
    day,
    now,
    seconds,
    toast,
    storageWarning,
    preserveOriginal,
    setPreserveOriginal,
    notify,
    updateDay,
    addActivity,
    updateActivity,
    finishActivity,
    startActivity,
    toggleTimer,
    extendTimer,
    stopTimer,
  };
}
