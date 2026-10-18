import type { Activity, CheckIn, Recommendation } from "./types";
/** Deterministic, explainable suggestions. Rest stays available regardless of deadlines. */
export function recommend(
  activities: Activity[],
  checkIn: CheckIn,
  remaining: number,
  recentHigh = false,
  skip: string[] = [],
  date?: string,
): Recommendation[] {
  const candidates = activities.filter(
    (a) =>
      a.status === "planned" &&
      (!date || a.date === date) &&
      !skip.includes(a.id) &&
      a.minutes <= checkIn.availableMinutes,
  );
  const restful = checkIn.energy === "low" || remaining <= 0 || recentHigh;
  const ranked = candidates
    .filter((a) => {
      if ((checkIn.energy === "low" || remaining <= 0) && a.load === "high")
        return false;
      if (checkIn.urgentOnly && !a.urgent && a.category !== "rest")
        return false;
      return a.category === "rest" || a.energy <= Math.max(0, remaining);
    })
    .map((activity) => {
      let score = activity.priority * 2;
      const reasons: string[] = [];
      if (activity.urgent) {
        score += 7;
        reasons.push("这件事比较紧急，先完成一小步");
      }
      if (restful && activity.load === "low") {
        score += 7;
        reasons.push(
          recentHigh
            ? "刚做过高负荷活动，换个轻松的节奏"
            : "适合现在的精力，不用太用力",
        );
      }
      if (checkIn.energy === "high" && activity.load === "high") {
        score += 3;
        reasons.push("现在精力不错，适合短时间投入");
      }
      const matchesMood =
        (checkIn.mood === "relax" &&
          ["hobby", "rest"].includes(activity.category)) ||
        (checkIn.mood === "move" && activity.category === "exercise") ||
        (checkIn.mood === "focus" &&
          ["study", "work"].includes(activity.category));
      if (matchesMood) {
        score += 8;
        reasons.push("和你此刻想做的事情很合拍");
      }
      if (activity.category === "hobby" && checkIn.mood === "any") score += 3;
      if (recentHigh && activity.load === "high") score -= 10;
      return {
        activity,
        score,
        reason: reasons[0] || "时间刚刚好，也在今天的精力预算内",
      };
    })
    .sort(
      (a, b) => b.score - a.score || a.activity.minutes - b.activity.minutes,
    );
  const rest: Recommendation = {
    activity: {
      id: "suggested-rest",
      title: "给自己一小段留白",
      category: "rest",
      minutes: Math.min(10, checkIn.availableMinutes),
      energy: 0,
      load: "low",
      priority: 2,
      urgent: false,
      endCondition: "放下屏幕，喝点水，什么都不用完成",
      date: date || "",
      status: "planned",
    },
    score: 0,
    reason:
      remaining <= 0
        ? "今天的计划已经很满了，休息无需额外预算"
        : recentHigh
          ? "刚完成高负荷活动，让脑袋缓一缓"
          : "休息本身就有价值，不需要先完成什么",
  };
  if (restful || !ranked.length)
    return skip.includes("suggested-rest")
      ? ranked.slice(0, 3)
      : [rest, ...ranked.slice(0, 2)];
  return ranked.slice(0, 3);
}
export function energyTotals(activities: Activity[], date: string) {
  const today = activities.filter(
    (a) => a.date === date && a.status !== "later",
  );
  return {
    planned: today.reduce((s, a) => s + a.energy, 0),
    used: today
      .filter((a) => a.status === "done")
      .reduce((s, a) => s + a.energy, 0),
    done: today.filter((a) => a.status === "done").length,
    total: today.length,
  };
}
