import { describe, expect, it } from "vitest";
import { energyTotals, recommend } from "./recommend";
import { makeActivity } from "./data";
import type { CheckIn } from "./types";
const date = "2026-10-18";
const check: CheckIn = {
  energy: "medium",
  mood: "any",
  availableMinutes: 30,
  urgentOnly: false,
};
const activity = (fields: Parameters<typeof makeActivity>[0]) =>
  makeActivity(fields, date);
describe("transparent recommendations", () => {
  it("only suggests current pending activities that fit the available time", () => {
    const choices = [
      activity({ title: "合适", minutes: 15 }),
      activity({ title: "太久", minutes: 45 }),
      activity({ title: "已完成", status: "done" }),
      activity({ title: "以后", status: "later" }),
      activity({ title: "昨天", date: "2026-10-17" }),
    ];
    expect(
      recommend(choices, check, 7, false, [], date).map(
        (r) => r.activity.title,
      ),
    ).toEqual(["合适"]);
  });
  it("never returns more than three options", () => {
    expect(
      recommend(
        Array.from({ length: 8 }, (_, i) => activity({ title: String(i) })),
        check,
        10,
      ),
    ).toHaveLength(3);
  });
  it("prioritizes an urgent task when it is feasible and explains why", () => {
    const r = recommend(
      [
        activity({ title: "随时可做", priority: 3 }),
        activity({ title: "有期限", urgent: true, priority: 1 }),
      ],
      check,
      7,
    );
    expect(r[0].activity.title).toBe("有期限");
    expect(r[0].reason).toContain("紧急");
  });
  it("respects preferences without requiring complicated optimization", () => {
    const r = recommend(
      [
        activity({ title: "复习", category: "study", priority: 3 }),
        activity({ title: "听歌", category: "hobby" }),
      ],
      { ...check, mood: "relax" },
      7,
    );
    expect(r[0].activity.title).toBe("听歌");
    expect(r[0].reason).toContain("合拍");
  });
  it("offers rest when tired and excludes high cognitive loads", () => {
    const r = recommend(
      [
        activity({ title: "难题", load: "high" }),
        activity({ title: "散步", load: "low", energy: 1 }),
      ],
      { ...check, energy: "low" },
      7,
    );
    expect(r[0].activity.category).toBe("rest");
    expect(r.some((r) => r.activity.title === "难题")).toBe(false);
  });
  it("allows rest even when the energy budget is exhausted and urgency is on", () => {
    const r = recommend(
      [activity({ title: "紧急任务", urgent: true, energy: 3 })],
      { ...check, urgentOnly: true },
      -1,
    );
    expect(r).toHaveLength(1);
    expect(r[0].activity.energy).toBe(0);
    expect(r[0].reason).toContain("预算");
  });
  it("only returns urgent tasks or rest under urgent filtering", () => {
    const r = recommend(
      [
        activity({ title: "读书" }),
        activity({ title: "交作业", urgent: true }),
      ],
      { ...check, urgentOnly: true },
      7,
    );
    expect(r.map((r) => r.activity.title)).toEqual(["交作业"]);
  });
  it("suggests a recovery break after recent intensive activity", () => {
    const r = recommend(
      [
        activity({ title: "继续学习", load: "high" }),
        activity({ title: "散步", load: "low" }),
      ],
      check,
      7,
      true,
    );
    expect(r[0].activity.category).toBe("rest");
    expect(r[1].activity.title).toBe("散步");
  });
  it("does not recommend tasks that exceed the remaining budget", () => {
    const r = recommend(
      [
        activity({ title: "太费力", energy: 4 }),
        activity({ title: "轻松点", energy: 1 }),
      ],
      check,
      2,
    );
    expect(r.map((r) => r.activity.title)).toEqual(["轻松点"]);
  });
  it("skips an option and keeps the fallback within available time", () => {
    const a = activity({ title: "跳过我" });
    const r = recommend([a], { ...check, availableMinutes: 5 }, 7, false, [
      a.id,
    ]);
    expect(r[0].activity.category).toBe("rest");
    expect(r[0].activity.minutes).toBe(5);
  });
  it("allows the user to skip the rest suggestion as well", () => {
    expect(recommend([], check, 0, false, ["suggested-rest"])).toEqual([]);
  });
});
describe("energy accounting", () => {
  it("keeps planned consumption separate from completed consumption and excludes later/other dates", () => {
    const items = [
      activity({ title: "已做", energy: 2, status: "done" }),
      activity({ title: "待做", energy: 3 }),
      activity({ title: "以后", energy: 4, status: "later" }),
      activity({ title: "昨天", energy: 4, date: "2026-10-17" }),
    ];
    expect(energyTotals(items, date)).toEqual({
      planned: 5,
      used: 2,
      done: 1,
      total: 2,
    });
  });
});
