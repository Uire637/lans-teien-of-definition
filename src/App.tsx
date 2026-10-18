import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  CloudSun,
  Coffee,
  Ellipsis,
  Feather,
  Heart,
  LayoutDashboard,
  Leaf,
  ListTodo,
  Menu,
  Moon,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunset,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type { Activity, CheckIn, Page } from "./types";
import { categories, loadLabels, makeActivity } from "./data";
import { energyTotals, recommend } from "./recommend";
import { useCompanion } from "./useCompanion";
import { ActivityForm, ActivityIcon, ActivityMeta, Modal } from "./components";
type Companion = ReturnType<typeof useCompanion>;
const navItems = [
  { id: "today", label: "今日概览", Icon: LayoutDashboard },
  { id: "activities", label: "活动清单", Icon: ListTodo },
  { id: "later", label: "以后再做", Icon: ArrowDownToLine },
  { id: "shutdown", label: "每日收尾", Icon: Moon },
] as const;

function Plant({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "plant small" : "plant"}
      viewBox="0 0 130 130"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="65" cy="65" r="60" fill="currentColor" opacity=".07" />
      <path
        d="M65 106V61m0 25C39 88 31 73 33 57c21 0 33 9 32 29Zm0-14c24 0 35-16 32-33-21 2-33 13-32 33Zm0-17C47 49 42 35 47 23c17 5 22 17 18 32Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m65 86-19-16m19 2 20-20m-20 3L54 36M49 107h33"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="103" cy="91" r="3" fill="currentColor" opacity=".4" />
      <path
        d="m22 34 3-6 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z"
        fill="currentColor"
        opacity=".4"
      />
    </svg>
  );
}

function EnergyCard({ app, onEdit }: { app: Companion; onEdit: () => void }) {
  const totals = energyTotals(app.state.activities, app.today);
  const remaining = app.day.budget - totals.used;
  return (
    <section className="card energy-card">
      <div className="card-top">
        <span className="section-label">
          <span className="mini-icon green">
            <Zap size={16} />
          </span>
          今日精力预算
        </span>
        <button className="text-btn" onClick={onEdit}>
          <Settings2 size={14} />
          调整预算
        </button>
      </div>
      <div className="energy-body">
        <div>
          <div className="energy-number">
            {app.day.budget}
            <span>
              / 10 <small>点</small>
            </span>
          </div>
          <p className="muted">按自己的感觉，给今天留一点余地。</p>
        </div>
        <Plant />
      </div>
      <div
        className="energy-segments"
        role="meter"
        aria-label="今日剩余精力"
        aria-valuemin={0}
        aria-valuemax={app.day.budget}
        aria-valuenow={Math.max(0, remaining)}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={
              i < totals.used ? "used" : i < app.day.budget ? "available" : ""
            }
          />
        ))}
      </div>
      <div className="energy-metrics">
        <div>
          <span>预计消耗</span>
          <strong>
            {totals.planned}
            <small> 点</small>
          </strong>
        </div>
        <div>
          <span>已用精力</span>
          <strong>
            {totals.used}
            <small> 点</small>
          </strong>
        </div>
        <div>
          <span>当前剩余</span>
          <strong className={remaining < 0 ? "over" : "green-text"}>
            {Math.max(0, remaining)}
            <small> 点</small>
          </strong>
        </div>
      </div>
      <p
        className={`energy-foot ${totals.planned > app.day.budget ? "warning" : ""}`}
      >
        <Leaf size={13} />
        {totals.planned > app.day.budget
          ? "计划有点满，试着把一两件事留给以后，不必挤占睡眠。"
          : "这是主观规划的刻度，不是对身体能量的测量。"}
      </p>
    </section>
  );
}
function CheckInCard({ app }: { app: Companion }) {
  const c = app.day.checkIn;
  const update = (fields: Partial<CheckIn>) =>
    app.updateDay({ checkIn: { ...c, ...fields } });
  return (
    <section className="card checkin-card">
      <div className="card-top">
        <span className="section-label">
          <span className="mini-icon peach">
            <Heart size={16} />
          </span>
          此刻，感觉如何？
        </span>
        <span className="tiny-tag">随时可改</span>
      </div>
      <p className="muted checkin-intro">听听身体的声音，再决定下一步。</p>
      <div className="energy-choices" role="group" aria-label="当前精力状态">
        {(
          [
            { value: "high", label: "充沛", Icon: Sun },
            { value: "medium", label: "一般", Icon: CloudSun },
            { value: "low", label: "疲惫", Icon: Moon },
          ] as const
        ).map(({ value, label, Icon }) => (
          <button
            key={value}
            aria-pressed={c.energy === value}
            className={c.energy === value ? "selected" : ""}
            onClick={() => update({ energy: value })}
          >
            <Icon size={21} strokeWidth={1.5} />
            {label}
            {c.energy === value && <span className="choice-dot" />}
          </button>
        ))}
      </div>
      <div className="checkin-fields">
        <label>
          现在更想
          <select
            value={c.mood}
            onChange={(e) =>
              update({ mood: e.target.value as CheckIn["mood"] })
            }
          >
            <option value="any">都可以，帮我选选</option>
            <option value="focus">专注做一件事</option>
            <option value="relax">轻松一下</option>
            <option value="move">活动活动身体</option>
          </select>
        </label>
        <label>
          有多少时间
          <select
            value={c.availableMinutes}
            onChange={(e) =>
              update({ availableMinutes: Number(e.target.value) })
            }
          >
            {[5, 10, 15, 30, 45, 60, 90, 120].map((n) => (
              <option key={n} value={n}>
                {n} 分钟
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="checkbox-label urgency-check">
        <input
          type="checkbox"
          checked={c.urgentOnly}
          onChange={(e) => update({ urgentOnly: e.target.checked })}
        />
        优先处理紧急的事<span className="optional">休息始终可选</span>
      </label>
    </section>
  );
}
function Recommendations({ app }: { app: Companion }) {
  const [skipped, setSkipped] = useState<string[]>([]);
  const totals = energyTotals(app.state.activities, app.today);
  const last = app.state.activities
    .filter((a) => a.status === "done" && a.completedAt)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
  const recentHigh = !!(
    last?.load === "high" &&
    last.completedAt &&
    app.now - last.completedAt < 90 * 60000
  );
  const suggestions = recommend(
    app.state.activities,
    app.day.checkIn,
    app.day.budget - totals.used,
    recentHigh,
    skipped,
    app.today,
  );
  function shuffle() {
    const next = [
      ...skipped,
      ...suggestions
        .filter((s) => s.activity.id !== "suggested-rest")
        .map((s) => s.activity.id),
    ];
    const eligible = app.state.activities.filter(
      (a) =>
        a.date === app.today &&
        a.status === "planned" &&
        a.minutes <= app.day.checkIn.availableMinutes,
    );
    setSkipped(eligible.some((a) => !next.includes(a.id)) ? next : []);
    app.notify("换个角度看看。没有合适的，也可以先休息。");
  }
  return (
    <section className="recommendations-section">
      <div className="section-heading">
        <div>
          <h2>
            <Sparkles size={19} />
            下一步，做点什么？
          </h2>
          <p>不用找最优解，选一个现在刚刚好的。</p>
        </div>
        <button className="text-btn" onClick={shuffle}>
          <RefreshCw size={14} />
          换一组
        </button>
      </div>
      {app.day.shutdown.done ? (
        <div className="card day-ended">
          <Moon size={26} />
          <h3>今天已经好好收尾了</h3>
          <p>剩下的时间，安心留给自己。</p>
          <button
            className="text-btn"
            onClick={() =>
              app.updateDay({ shutdown: { ...app.day.shutdown, done: false } })
            }
          >
            重新打开今天
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className="recommendation-grid">
          {!suggestions.length && (
            <div className="card suggestion-empty">
              <Coffee size={25} />
              <p>这会儿没有刚好的选项。什么都不做，也可以。</p>
              <button className="text-btn" onClick={() => setSkipped([])}>
                再看看这些建议
                <RefreshCw size={13} />
              </button>
            </div>
          )}
          {suggestions.map(({ activity: a, reason }, i) => (
            <article
              className={`recommendation-card tone-${categories[a.category].color}`}
              key={a.id}
            >
              <div className="recommendation-top">
                <span
                  className={`activity-icon ${categories[a.category].color}`}
                >
                  <ActivityIcon category={a.category} />
                </span>
                <span className="recommendation-tag">
                  {i === 0
                    ? "此刻推荐"
                    : a.category === "rest"
                      ? "留点空白"
                      : "也可以"}
                </span>
              </div>
              <h3>{a.title}</h3>
              <div className="rec-meta">
                <Clock3 size={12} />
                {a.minutes} 分钟<span>·</span>
                {a.energy === 0 ? "不消耗预算" : `${a.energy} 点精力`}
              </div>
              <p className="recommendation-reason">{reason}</p>
              <div className="recommendation-actions">
                <button
                  onClick={() => app.startActivity(a)}
                  className={i === 0 ? "rec-start primary" : "rec-start"}
                >
                  <Play size={12} fill="currentColor" />
                  就做这个
                </button>
                <button
                  className="icon-btn skip-btn"
                  aria-label={`跳过${a.title}`}
                  title="暂时跳过"
                  onClick={() => {
                    setSkipped((s) => [...s, a.id]);
                  }}
                >
                  <ArrowRight size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="recommendation-note">
        <ShieldCheck size={12} />
        建议会考虑你的时间、精力和意愿，最终由你决定。
      </p>
    </section>
  );
}
function ActivityRow({
  activity: a,
  app,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  app: Companion;
  onEdit: (a: Activity) => void;
  onDelete: (a: Activity) => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <div className={`activity-row ${a.status === "done" ? "is-done" : ""}`}>
      <button
        className="complete-btn"
        aria-label={
          a.status === "done" ? `重新打开${a.title}` : `完成${a.title}`
        }
        onClick={() =>
          a.status === "done"
            ? app.updateActivity(a.id, {
                status: "planned",
                completedAt: undefined,
              })
            : app.finishActivity(a.id)
        }
      >
        {a.status === "done" ? (
          <CheckCircle2 size={20} />
        ) : (
          <Circle size={20} />
        )}
      </button>
      <span className={`activity-icon ${categories[a.category].color}`}>
        <ActivityIcon category={a.category} size={18} />
      </span>
      <div className="activity-info">
        <div className="activity-title">
          {a.title}
          {a.urgent && <span className="urgent-badge">紧急</span>}
        </div>
        <ActivityMeta activity={a} />
      </div>
      <span className={`category-tag ${categories[a.category].color}`}>
        {categories[a.category].label}
      </span>
      {a.status !== "done" && (
        <button
          className="icon-btn row-play"
          aria-label={`开始${a.title}`}
          onClick={() => app.startActivity(a)}
        >
          <Play size={16} />
        </button>
      )}
      <div className="row-menu">
        <button
          className="icon-btn"
          aria-expanded={menu}
          aria-label={`${a.title}的更多操作`}
          onClick={() => setMenu(!menu)}
        >
          <Ellipsis size={19} />
        </button>
        {menu && (
          <>
            <button
              className="menu-dismiss"
              aria-label="关闭操作菜单"
              onClick={() => setMenu(false)}
            />
            <div className="dropdown-menu">
              <button
                onClick={() => {
                  onEdit(a);
                  setMenu(false);
                }}
              >
                编辑活动
              </button>
              {a.status !== "done" && (
                <button
                  onClick={() => {
                    if (app.state.timer?.activityId === a.id) {
                      app.notify("请先结束当前计时，再把这件事留给以后。");
                      return;
                    }
                    app.updateActivity(a.id, { status: "later" });
                    setMenu(false);
                    app.notify("已放进以后再做，想做的时候再回来。");
                  }}
                >
                  留给以后
                </button>
              )}
              <button
                className="danger-text"
                onClick={() => {
                  onDelete(a);
                  setMenu(false);
                }}
              >
                删除活动
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
function Activities({
  app,
  compact = false,
  onEdit,
  onDelete,
  onAdd,
  onViewAll,
}: {
  app: Companion;
  compact?: boolean;
  onEdit: (a: Activity) => void;
  onDelete: (a: Activity) => void;
  onAdd: () => void;
  onViewAll?: () => void;
}) {
  const [filter, setFilter] = useState("all"),
    [search, setSearch] = useState("");
  const all = app.state.activities.filter(
    (a) => a.date === app.today && a.status !== "later",
  );
  const visible = all.filter(
    (a) =>
      (filter === "all" ||
        (filter === "done" && a.status === "done") ||
        (filter === "planned" && a.status === "planned")) &&
      a.title.toLowerCase().includes(search.toLowerCase()),
  );
  const totals = energyTotals(app.state.activities, app.today);
  return (
    <section className="card activities-card">
      <div className="section-heading activity-heading">
        <div>
          <h2>
            今天想做的事<span className="count-badge">{all.length}</span>
          </h2>
          <p>
            {totals.done
              ? `已经完成 ${totals.done} 件，慢慢来就很好。`
              : "不必全部完成，计划可以随时改变。"}
          </p>
        </div>
        <button className="text-btn" onClick={onAdd}>
          <Plus size={15} />
          添加活动
        </button>
      </div>
      {!compact && (
        <div className="list-toolbar">
          <div className="tabs" role="group" aria-label="活动筛选">
            {[
              { id: "all", label: "全部活动" },
              { id: "planned", label: "待进行" },
              { id: "done", label: "已完成" },
            ].map((f) => (
              <button
                key={f.id}
                aria-pressed={filter === f.id}
                className={filter === f.id ? "active" : ""}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="搜索活动"
              placeholder="找一件想做的事…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      )}
      <div className="activity-list">
        {(compact ? visible.slice(0, 4) : visible).map((a) => (
          <ActivityRow
            activity={a}
            key={a.id}
            app={app}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {!visible.length && (
          <div className="empty-state">
            <Feather size={28} />
            <h3>{search ? "还没找到这件事" : "这里可以暂时空着"}</h3>
            <p>
              {search
                ? "试试换个词，或者加一件新的小事。"
                : "想做什么的时候，再把它加进来。"}
            </p>
            <button className="text-btn" onClick={onAdd}>
              <Plus size={14} />
              添加一件小事
            </button>
          </div>
        )}
      </div>
      {compact && (
        <div className="list-footer">
          <span>
            <span className="legend-dot" />
            示例活动可以编辑、删除，自由安排
          </span>
          <button className="text-btn" onClick={onViewAll}>
            查看全部
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </section>
  );
}
function TimerPanel({ app, onPick }: { app: Companion; onPick: () => void }) {
  const timer = app.state.timer;
  const activity = app.state.activities.find((a) => a.id === timer?.activityId);
  const finished = !!timer && app.seconds === 0;
  const time = timer
    ? `${String(Math.floor(app.seconds / 60)).padStart(2, "0")}:${String(app.seconds % 60).padStart(2, "0")}`
    : "25:00";
  const fraction = timer ? Math.min(1, app.seconds / timer.durationSeconds) : 1;
  return (
    <section className="timer-card">
      <div className="card-top">
        <span className="section-label">
          <Clock3 size={17} />
          一段专注，一点留白
        </span>
        <span className="timer-live">
          <span />
          {timer
            ? finished
              ? "到点了"
              : timer.endAt
                ? "进行中"
                : "已暂停"
            : "准备好了"}
        </span>
      </div>
      <div className="timer-dial">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="89" className="dial-track" />
          <circle
            cx="100"
            cy="100"
            r="89"
            className="dial-progress"
            strokeDasharray={2 * Math.PI * 89}
            strokeDashoffset={2 * Math.PI * 89 * (1 - fraction)}
          />
        </svg>
        <div>
          <span className="timer-caption">
            {finished
              ? "停下来，看看自己"
              : timer
                ? "给这一刻一点专注"
                : "专注于一件小事"}
          </span>
          <span
            className="timer-time"
            aria-label={`剩余${timer ? Math.ceil(app.seconds / 60) : 25}分钟`}
          >
            {time}
          </span>
          <span className="timer-task">
            {activity?.title || "选一件事，慢慢开始"}
          </span>
        </div>
      </div>
      {activity?.endCondition && (
        <p className="timer-condition">停在这里：{activity.endCondition}</p>
      )}
      {!timer ? (
        <button className="timer-main-btn" onClick={onPick}>
          <Play size={15} fill="currentColor" />
          选择一个活动
        </button>
      ) : finished ? (
        <div className="timer-buttons">
          <button
            className="timer-main-btn"
            onClick={() => app.finishActivity(timer.activityId)}
          >
            <Check size={16} />
            完成并休息
          </button>
          <button className="timer-small-btn" onClick={app.extendTimer}>
            再 5 分钟
          </button>
        </div>
      ) : (
        <div className="timer-buttons">
          <button className="timer-main-btn" onClick={app.toggleTimer}>
            {timer.endAt ? <Pause size={16} /> : <Play size={16} />}{" "}
            {timer.endAt ? "暂停一下" : "继续这件事"}
          </button>
          <button
            className="timer-small-btn"
            onClick={() => app.finishActivity(timer.activityId)}
            aria-label="结束并完成活动"
          >
            <Check size={19} />
          </button>
        </div>
      )}
      {timer && !finished && (
        <button className="timer-abandon" onClick={app.stopTimer}>
          先停下，暂不完成
        </button>
      )}
      <p className="timer-foot">
        <Leaf size={12} />
        时间到了，你可以选择停下，也可以继续。
      </p>
    </section>
  );
}
function FreeTime({ app, onEdit }: { app: Companion; onEdit: () => void }) {
  const f = app.day.freeTime;
  return (
    <section className="free-card">
      <div className="card-top">
        <span className="section-label">
          <Sunset size={17} />
          留给自己的时间
        </span>
        <button className="icon-btn" aria-label="调整自由时间" onClick={onEdit}>
          <Settings2 size={15} />
        </button>
      </div>
      <div className="free-time">
        {f.start}
        <span>· {f.minutes} 分钟</span>
        <Sun size={36} strokeWidth={1} />
      </div>
      <h3>{f.title}</h3>
      <p>
        这段时间属于你，
        <br />
        不用完成所有事，才能享受它。
      </p>
      <button
        className="free-action"
        onClick={() =>
          app.startActivity(
            makeActivity(
              {
                id: "suggested-rest",
                title: f.title,
                category: "hobby",
                minutes: f.minutes,
                energy: 0,
                load: "low",
                endCondition: "玩得尽兴就好，到了时间再问问自己",
              },
              app.today,
            ),
          )
        }
      >
        现在就享受一点
        <ArrowRight size={14} />
      </button>
    </section>
  );
}
function BudgetForm({ app, onClose }: { app: Companion; onClose: () => void }) {
  const [budget, setBudget] = useState(app.day.budget);
  return (
    <Modal
      title="今天，有多少精力？"
      subtitle="没有标准答案。按睡眠、疲劳和此刻的感觉，做一个温柔的估计。"
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          app.updateDay({
            budget,
            sleep: d.get("sleep") === "" ? null : Number(d.get("sleep")),
            fatigue: d.get("fatigue") as DayFatigue,
          });
          onClose();
          app.notify("预算已调整。你随时可以改变计划。");
        }}
      >
        <div className="budget-picker full">
          <span>
            {budget}
            <small> / 10 点</small>
          </span>
          <input
            aria-label="每日精力预算"
            type="range"
            min="1"
            max="10"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
          <div>
            <span>慢慢来的一天</span>
            <span>有余力的一天</span>
          </div>
        </div>
        <label>
          昨晚睡了多久（小时）
          <input
            name="sleep"
            type="number"
            min="0"
            max="24"
            step="0.5"
            placeholder="可选"
            defaultValue={app.day.sleep ?? ""}
          />
        </label>
        <label>
          主观疲劳程度
          <select name="fatigue" defaultValue={app.day.fatigue}>
            <option value="low">不太疲惫</option>
            <option value="medium">有一点疲惫</option>
            <option value="high">很疲惫</option>
          </select>
        </label>
        <div className="soft-note full">
          <Leaf size={17} />
          精力点数只是帮助安排生活的主观刻度。剩余点数不代表你应该继续做事。
        </div>
        <button type="submit" className="btn btn-primary full">
          就按这个节奏来
          <Check size={16} />
        </button>
      </form>
    </Modal>
  );
}
type DayFatigue = Companion["day"]["fatigue"];
function FreeTimeForm({
  app,
  onClose,
}: {
  app: Companion;
  onClose: () => void;
}) {
  const f = app.day.freeTime;
  return (
    <Modal
      title="给自己留一点时间"
      subtitle="自由时间不需要通过完成任务来换取。尽量把它安排在睡前更早一点。"
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          app.updateDay({
            freeTime: {
              title: String(d.get("title")).trim(),
              start: String(d.get("start")),
              minutes: Number(d.get("minutes")),
            },
          });
          onClose();
          app.notify("已经给自己留好时间了。");
        }}
      >
        <label className="full">
          想怎么度过？
          <input
            name="title"
            defaultValue={f.title}
            required
            maxLength={80}
            pattern=".*\S.*"
            placeholder="游戏、音乐，或什么也不做"
          />
        </label>
        <label>
          开始时间
          <input name="start" type="time" defaultValue={f.start} required />
        </label>
        <label>
          留多少分钟？
          <input
            name="minutes"
            type="number"
            min="5"
            max="240"
            step="5"
            defaultValue={f.minutes}
            required
          />
        </label>
        <p className="soft-note full">
          <Heart size={16} />
          这是为你保留的时间，不会强制打断活动，也不会产生打卡压力。
        </p>
        <button className="btn btn-primary full" type="submit">
          把这段时间留给自己
          <Check size={16} />
        </button>
      </form>
    </Modal>
  );
}
function LaterView({
  app,
  onEdit,
  onDelete,
}: {
  app: Companion;
  onEdit: (a: Activity) => void;
  onDelete: (a: Activity) => void;
}) {
  const later = app.state.activities.filter(
    (a) =>
      a.status === "later" || (a.status === "planned" && a.date < app.today),
  );
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">SOMEDAY, AT YOUR PACE</span>
        <h1>没做完，也没有被放弃。</h1>
        <p>把想做的事好好收起来。等有精力、有心情时，再继续。</p>
      </div>
      <div className="later-note">
        <ArrowDownToLine size={22} />
        <div>
          <strong>这里没有截止日期</strong>
          <p>以前留下的计划也会在这里等你，不会自动挤进今天。</p>
        </div>
        <span>{later.length} 件小事</span>
      </div>
      <div className="later-grid">
        {later.map((a) => (
          <article className="card later-card" key={a.id}>
            <div className="card-top">
              <span className={`activity-icon ${categories[a.category].color}`}>
                <ActivityIcon category={a.category} />
              </span>
              <span className={`category-tag ${categories[a.category].color}`}>
                {categories[a.category].label}
              </span>
            </div>
            <h3>{a.title}</h3>
            <ActivityMeta activity={a} />
            {a.endCondition && <p className="muted">{a.endCondition}</p>}
            <div className="later-actions">
              <button
                className="text-btn"
                onClick={() => {
                  app.updateActivity(a.id, {
                    status: "planned",
                    date: app.today,
                  });
                  app.notify("放回今天了。不必急着完成。");
                }}
              >
                今天想试试
                <ArrowRight size={14} />
              </button>
              <div>
                <button
                  className="icon-btn"
                  onClick={() => onEdit(a)}
                  aria-label={`编辑${a.title}`}
                >
                  <Settings2 size={15} />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => onDelete(a)}
                  aria-label={`删除${a.title}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!later.length && (
        <div className="empty-state card large-empty">
          <Feather size={40} />
          <h3>未来还有很多可能</h3>
          <p>
            从活动清单中选择「留给以后」，
            <br />
            或者在每日收尾时，把想做的事放进来。
          </p>
        </div>
      )}
    </>
  );
}
function ShutdownView({ app }: { app: Companion }) {
  const d = app.day.shutdown;
  const [selected, setSelected] = useState<string[]>([]);
  const activities = app.state.activities.filter(
    (a) => a.date === app.today && a.status !== "later",
  );
  const completed = activities.filter((a) => a.status === "done"),
    unfinished = activities.filter((a) => a.status === "planned");
  const set = (fields: Partial<typeof d>) =>
    app.updateDay({ shutdown: { ...d, ...fields } });
  function shutdown() {
    if (app.state.timer) {
      app.notify("你还有一段计时。先停下来或完成它，再结束今天吧。");
      return;
    }
    const extra = d.unfinished
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    app.setState((s) => ({
      ...s,
      activities: [
        ...s.activities.map((a) =>
          selected.includes(a.id) ? { ...a, status: "later" as const } : a,
        ),
        ...extra.map((title) =>
          makeActivity({ title, status: "later" }, app.today),
        ),
      ],
      days: {
        ...s.days,
        [app.today]: {
          ...app.day,
          shutdown: { ...d, done: true, unfinished: "" },
        },
      },
    }));
    setSelected([]);
    app.notify("今天到这里就好。晚安，明天再继续。");
  }
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">A GENTLE ENDING</span>
        <h1>{d.done ? "今天，就到这里吧。" : "给今天一个温柔的句号。"}</h1>
        <p>没完成的事可以明天继续。休息，不需要更多理由。</p>
      </div>
      {d.done ? (
        <div className="shutdown-complete card">
          <div className="night-illustration">
            <Moon size={54} strokeWidth={1} />
            <Sparkles size={22} />
          </div>
          <span className="eyebrow">YOU DID ENOUGH TODAY</span>
          <h2>你已经做得足够好了。</h2>
          <p>
            今天完成了 {completed.length} 件事，也给生活留了空间。
            <br />
            {d.tomorrow
              ? `明天想继续的：${d.tomorrow}`
              : "明天做什么，可以明天再决定。"}
          </p>
          {d.reflection && <blockquote>{d.reflection}</blockquote>}
          <button
            className="btn btn-secondary"
            onClick={() => set({ done: false })}
          >
            重新打开今天
            <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <div className="shutdown-layout">
          <form
            className="shutdown-form"
            onSubmit={(e) => {
              e.preventDefault();
              shutdown();
            }}
          >
            <section className="card shutdown-step">
              <span className="step-number">01</span>
              <div>
                <h2>先看看，今天已经做了什么</h2>
                <p className="muted">很小的事情，也值得被看见。</p>
                {completed.length ? (
                  <div className="completed-list">
                    {completed.map((a) => (
                      <span key={a.id}>
                        <CheckCircle2 size={16} />
                        {a.title}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="no-pressure">
                    没有完成清单上的事，也不代表今天没有价值。
                  </p>
                )}
                <label>
                  想记下的一点小事
                  <textarea
                    rows={3}
                    placeholder="比如：吃了一顿热饭，和朋友聊了天，或者好好休息了一会儿。"
                    maxLength={2000}
                    value={d.reflection}
                    onChange={(e) => set({ reflection: e.target.value })}
                  />
                </label>
              </div>
            </section>
            <section className="card shutdown-step">
              <span className="step-number">02</span>
              <div>
                <h2>还想做的事，先好好收起来</h2>
                <p className="muted">
                  选中的活动会移到「以后再做」。没有选中的，也会在那里等你到明天。
                </p>
                <div className="unfinished-list">
                  {unfinished.map((a) => (
                    <label className="checkbox-label" key={a.id}>
                      <input
                        type="checkbox"
                        checked={selected.includes(a.id)}
                        onChange={(e) =>
                          setSelected((s) =>
                            e.target.checked
                              ? [...s, a.id]
                              : s.filter((id) => id !== a.id),
                          )
                        }
                      />
                      {a.title}
                    </label>
                  ))}
                </div>
                <label>
                  还有其他想做的吗？
                  <textarea
                    rows={2}
                    placeholder="每行写一件，先存起来，不急着安排。"
                    maxLength={2000}
                    value={d.unfinished}
                    onChange={(e) => set({ unfinished: e.target.value })}
                  />
                </label>
              </div>
            </section>
            <section className="card shutdown-step">
              <span className="step-number">03</span>
              <div>
                <h2>明天，最想继续哪一件？</h2>
                <p className="muted">只选一件就够了，不选也完全可以。</p>
                <input
                  aria-label="明天最想继续的一件事"
                  list="tomorrow-ideas"
                  placeholder="明天想……"
                  maxLength={150}
                  value={d.tomorrow}
                  onChange={(e) => set({ tomorrow: e.target.value })}
                />
                <datalist id="tomorrow-ideas">
                  {app.state.activities
                    .filter((a) => a.status !== "done")
                    .map((a) => (
                      <option key={a.id} value={a.title} />
                    ))}
                </datalist>
              </div>
            </section>
            <button type="submit" className="btn btn-primary shutdown-submit">
              <Moon size={18} />
              结束今天的规划，安心休息
            </button>
            <p className="shutdown-disclaimer">
              今天的计划会保留。你随时可以重新打开今天。
            </p>
          </form>
          <aside className="shutdown-aside">
            <Plant />
            <h3>
              不是每一天，
              <br />
              都需要填得很满。
            </h3>
            <p>
              你不需要用疲惫证明努力，
              <br />
              也不需要用完成证明价值。
            </p>
            <span>TAKE A BREATH. YOU'RE HERE.</span>
          </aside>
        </div>
      )}
    </>
  );
}

export default function App() {
  const app = useCompanion();
  const [page, setPage] = useState<Page>("today");
  const [modal, setModal] = useState<"budget" | "add" | "free" | null>(null);
  const [editing, setEditing] = useState<Activity | null>(null),
    [deleting, setDeleting] = useState<Activity | null>(null);
  const [sidebar, setSidebar] = useState(false),
    [reminder, setReminder] = useState(false);
  const reminded = useRef<number | null>(null);
  const content = useRef<HTMLElement>(null);
  const { timer } = app.state;
  useEffect(() => {
    if (timer?.endAt && app.seconds === 0 && reminded.current !== timer.endAt) {
      reminded.current = timer.endAt;
      setReminder(true);
    }
    if (!timer || app.seconds > 0) setReminder(false);
  }, [timer, app.seconds]);
  useEffect(() => {
    document.title =
      timer && app.seconds === 0
        ? "该停下来看看自己了 · 留白"
        : "留白 · Personal Energy Companion";
  }, [timer, app.seconds]);
  function navigate(p: Page) {
    setPage(p);
    setSidebar(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    content.current?.focus();
  }
  function chooseActivity() {
    navigate("activities");
    app.notify("选一件现在想做的事，点击右侧开始按钮。");
  }
  const date = new Date(app.now).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const laterCount = app.state.activities.filter(
    (a) =>
      a.status === "later" || (a.status === "planned" && a.date < app.today),
  ).length;
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        跳转到主要内容
      </a>
      {sidebar && (
        <button
          className="sidebar-scrim"
          aria-label="关闭导航"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside className={`sidebar ${sidebar ? "open" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("today")}
          aria-label="留白首页"
        >
          <span className="brand-mark">
            <Leaf size={25} strokeWidth={1.6} />
          </span>
          <span>
            <strong>
              留白<span className="brand-dot">.</span>
            </strong>
            <small>ENERGY COMPANION</small>
          </span>
        </button>
        <div className="nav-caption">我的生活空间</div>
        <nav aria-label="主导航">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => navigate(id)}
              aria-label={label}
              aria-current={page === id ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
              {id === "later" && laterCount > 0 ? (
                <span className="nav-count">{laterCount}</span>
              ) : page === id ? (
                <span className="nav-active-dot" />
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Plant small />
          <p>
            生活不是一张
            <br />
            需要全部勾选的清单。
          </p>
          <span>LEAVE A LITTLE SPACE.</span>
        </div>
        <div className="sidebar-bottom">
          <div className="theme-control">
            <span>
              {app.state.theme === "light" ? (
                <Sun size={15} />
              ) : (
                <Moon size={15} />
              )}
              外观
            </span>
            <div>
              <button
                className={app.state.theme === "light" ? "active" : ""}
                aria-label="浅色主题"
                aria-pressed={app.state.theme === "light"}
                onClick={() => app.setState((s) => ({ ...s, theme: "light" }))}
              >
                <Sun size={14} />
              </button>
              <button
                className={app.state.theme === "dark" ? "active" : ""}
                aria-label="深色主题"
                aria-pressed={app.state.theme === "dark"}
                onClick={() => app.setState((s) => ({ ...s, theme: "dark" }))}
              >
                <Moon size={14} />
              </button>
            </div>
          </div>
          <div className="local-profile">
            <span className="profile-avatar">
              <Feather size={20} />
            </span>
            <div>
              <strong>我的小小世界</strong>
              <span>
                <span className="status-dot" />
                数据仅保存在此设备
              </span>
            </div>
            <ShieldCheck size={17} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="icon-btn mobile-menu"
              aria-label="展开导航"
              aria-expanded={sidebar}
              onClick={() => setSidebar(!sidebar)}
            >
              {sidebar ? <X size={21} /> : <Menu size={21} />}
            </button>
            <span className="breadcrumb">
              我的空间
              <ChevronRight size={13} />
              <strong>{navItems.find((n) => n.id === page)?.label}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="date-display">
              <CalendarDays size={15} />
              {date}
            </span>
            <span className="today-pill">
              <span />
              今天，慢慢来
            </span>
          </div>
        </header>
        <main className="main-content" id="main" ref={content} tabIndex={-1}>
          {app.storageWarning && (
            <div className="storage-warning" role="alert">
              <span>{app.storageWarning}</span>
              <button
                onClick={() => {
                  if (app.preserveOriginal) {
                    if (
                      window.confirm(
                        "这将用当前工作区覆盖无法读取的本地数据。请确认已备份原始数据。",
                      )
                    )
                      app.setPreserveOriginal(false);
                  } else app.setState((s) => ({ ...s }));
                }}
              >
                {app.preserveOriginal ? "使用当前工作区" : "重试保存"}
              </button>
            </div>
          )}
          {page === "today" && (
            <>
              <div className="page-intro dashboard-intro">
                <div>
                  <span className="eyebrow">
                    <Sun size={14} />A LITTLE SPACE FOR YOURSELF
                  </span>
                  <h1>
                    把今天，过得轻一点<span className="heading-period">。</span>
                  </h1>
                  <p>照顾好精力，也给喜欢的生活留个位置。</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setModal("add")}
                >
                  <Plus size={17} />
                  添加小事
                </button>
              </div>
              <div className="top-grid">
                <EnergyCard app={app} onEdit={() => setModal("budget")} />
                <CheckInCard app={app} />
              </div>
              <div className="workspace-grid">
                <div className="primary-column">
                  <Recommendations app={app} />
                  <Activities
                    app={app}
                    compact
                    onEdit={setEditing}
                    onDelete={setDeleting}
                    onAdd={() => setModal("add")}
                    onViewAll={() => navigate("activities")}
                  />
                </div>
                <div className="secondary-column">
                  <TimerPanel app={app} onPick={chooseActivity} />
                  <FreeTime app={app} onEdit={() => setModal("free")} />
                </div>
              </div>
              <div className="shutdown-banner">
                <span className="shutdown-banner-icon">
                  <Moon size={23} strokeWidth={1.5} />
                </span>
                <div>
                  <h3>
                    {app.day.shutdown.done
                      ? "今天，已经足够好了。"
                      : "今天做到这里，也已经很好了。"}
                  </h3>
                  <p>
                    {app.day.shutdown.done
                      ? "规划已经收好，剩下的时间安心留给自己。"
                      : "没做完的事情，可以留给以后的自己。"}
                  </p>
                </div>
                <button
                  className="text-btn"
                  onClick={() => navigate("shutdown")}
                >
                  {app.day.shutdown.done ? "看看今天的收尾" : "给今天收个尾"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
          {page === "activities" && (
            <>
              <div className="page-intro">
                <span className="eyebrow">MAKE ROOM FOR WHAT MATTERS</span>
                <h1>生活里的每一件小事。</h1>
                <p>
                  学习、兴趣和休息，都有自己的位置。这里没有必须清空的待办。
                </p>
              </div>
              <div className="activities-page-grid">
                <Activities
                  app={app}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                  onAdd={() => setModal("add")}
                />
                <div className="secondary-column">
                  <TimerPanel
                    app={app}
                    onPick={() => {
                      app.notify("点击左侧任意活动的开始按钮。");
                    }}
                  />
                  <div className="soft-note">
                    <Leaf size={19} />
                    一项活动太费力？试着把它缩小成一个可以轻松停止的步骤。
                  </div>
                </div>
              </div>
            </>
          )}
          {page === "later" && (
            <LaterView app={app} onEdit={setEditing} onDelete={setDeleting} />
          )}
          {page === "shutdown" && <ShutdownView app={app} />}
          <footer className="page-footer">
            <span>
              <Leaf size={13} />
              留一点白，给生活。
            </span>
            <span>按自己的节奏，就很好。</span>
          </footer>
        </main>
      </div>
      {app.toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {app.toast}
        </div>
      )}
      {modal === "budget" && (
        <BudgetForm app={app} onClose={() => setModal(null)} />
      )}
      {modal === "free" && (
        <FreeTimeForm app={app} onClose={() => setModal(null)} />
      )}
      {(modal === "add" || editing) && (
        <ActivityForm
          activity={editing || undefined}
          onClose={() => {
            setModal(null);
            setEditing(null);
          }}
          onSave={(fields) => {
            if (editing) app.updateActivity(editing.id, fields);
            else app.addActivity(fields);
            setModal(null);
            setEditing(null);
            app.notify(
              editing ? "这件事已经更新了。" : "已加入今天。不必急着全部完成。",
            );
          }}
        />
      )}
      {deleting && (
        <Modal
          title="不想做了，也没关系。"
          subtitle={`确定删除「${deleting.title}」？这项活动的记录也会一起删除。`}
          onClose={() => setDeleting(null)}
        >
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setDeleting(null)}
            >
              还是留着
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                app.setState((s) => ({
                  ...s,
                  activities: s.activities.filter((a) => a.id !== deleting.id),
                  timer: s.timer?.activityId === deleting.id ? null : s.timer,
                }));
                setDeleting(null);
                app.notify("已经放下这件事了。");
              }}
            >
              确认删除
            </button>
          </div>
        </Modal>
      )}
      {reminder && timer && !modal && !editing && !deleting && (
        <Modal
          title="到这里，就已经很好了。"
          subtitle="预定的时间到了。感受一下：现在是想继续，还是需要休息？"
          onClose={() => setReminder(false)}
        >
          <div className="timer-reminder">
            <Coffee size={39} strokeWidth={1.3} />
            <p>
              {app.state.activities.find((a) => a.id === timer.activityId)
                ?.endCondition || "喝一点水，伸展一下，看看现在的自己。"}
            </p>
            <div className="reminder-buttons">
              <button
                className="btn btn-primary"
                onClick={() => {
                  app.finishActivity(timer.activityId);
                  setReminder(false);
                }}
              >
                结束并完成
                <Check size={16} />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  app.extendTimer();
                  setReminder(false);
                }}
              >
                我想再继续 5 分钟
              </button>
              <button
                className="text-btn"
                onClick={() => {
                  app.stopTimer();
                  setReminder(false);
                }}
              >
                先停下，暂不标记完成
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
