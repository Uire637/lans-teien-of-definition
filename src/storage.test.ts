import { beforeEach, describe, expect, it } from "vitest";
import { initialState, localDate } from "./data";
import { loadState, saveState, STORAGE_KEY, type StorageLike } from "./storage";
const date = "2026-10-18";
let data: Record<string, string>;
let storage: StorageLike;
beforeEach(() => {
  data = {};
  storage = {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
});
describe("local persistence", () => {
  it("provides an editable example day on first use", () => {
    const { state, warning } = loadState(storage, date);
    expect(warning).toBeNull();
    expect(state.days[date].budget).toBe(7);
    expect(state.activities.length).toBeGreaterThan(0);
  });
  it("round-trips activities, check-in, budget, free time, shutdown and theme", () => {
    const state = initialState(date);
    state.days[date].budget = 3;
    state.days[date].sleep = 6.5;
    state.days[date].checkIn.mood = "relax";
    state.days[date].shutdown = {
      done: true,
      reflection: "好好吃饭",
      tomorrow: "散步",
      unfinished: "",
    };
    state.days[date].freeTime.title = "听音乐";
    state.activities[0].status = "later";
    state.theme = "dark";
    expect(saveState(storage, state)).toBe(true);
    expect(loadState(storage, date)).toEqual({ state, warning: null });
  });
  it("preserves an absolute timer deadline across reloads", () => {
    const state = initialState(date);
    state.timer = {
      activityId: state.activities[0].id,
      durationSeconds: 1200,
      remainingSeconds: 1200,
      endAt: Date.now() + 1200000,
    };
    saveState(storage, state);
    expect(loadState(storage, date).state.timer).toEqual(state.timer);
  });
  it("preserves a paused timer and its remaining seconds", () => {
    const state = initialState(date);
    state.timer = {
      activityId: state.activities[0].id,
      durationSeconds: 1200,
      remainingSeconds: 145,
      endAt: null,
    };
    saveState(storage, state);
    expect(loadState(storage, date).state.timer?.remainingSeconds).toBe(145);
    expect(loadState(storage, date).state.timer?.endAt).toBeNull();
  });
  it("creates a fresh day on rollover without discarding history or unfinished activities", () => {
    const state = initialState(date);
    state.days[date].budget = 2;
    saveState(storage, state);
    const loaded = loadState(storage, "2026-10-19").state;
    expect(loaded.days[date].budget).toBe(2);
    expect(loaded.days["2026-10-19"].budget).toBe(7);
    expect(loaded.activities).toEqual(state.activities);
  });
  it("reports invalid JSON without overwriting the original", () => {
    data[STORAGE_KEY] = "{broken";
    expect(loadState(storage, date).warning).toBeTruthy();
    expect(data[STORAGE_KEY]).toBe("{broken");
  });
  it("rejects incompatible schemas and invalid numeric/enumerated fields", () => {
    const state = initialState(date);
    const variants = [
      { ...state, version: 2 },
      { ...state, activities: [{ ...state.activities[0], energy: -1 }] },
      { ...state, days: { [date]: { ...state.days[date], budget: 11 } } },
      {
        ...state,
        activities: [{ ...state.activities[0], category: "unknown" }],
      },
    ];
    for (const invalid of variants) {
      data[STORAGE_KEY] = JSON.stringify(invalid);
      expect(loadState(storage, date).warning).toBeTruthy();
    }
  });
  it("clears an orphan timer without throwing away valid activities", () => {
    const state = initialState(date);
    state.timer = {
      activityId: "missing",
      durationSeconds: 60,
      remainingSeconds: 60,
      endAt: null,
    };
    saveState(storage, state);
    const result = loadState(storage, date);
    expect(result.warning).toBeNull();
    expect(result.state.timer).toBeNull();
    expect(result.state.activities).toEqual(state.activities);
  });
  it("reports denied reads and full storage without crashing", () => {
    const denied: StorageLike = {
      getItem: () => {
        throw Error("denied");
      },
      setItem: () => {
        throw Error("quota");
      },
    };
    expect(loadState(denied, date).warning).toBeTruthy();
    expect(saveState(denied, initialState(date))).toBe(false);
  });
  it("uses the local calendar date for day boundaries", () => {
    const d = new Date(2026, 0, 2, 0, 5);
    expect(localDate(d)).toBe("2026-01-02");
  });
});
