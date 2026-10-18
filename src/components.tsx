import { useEffect, useRef, type ReactNode } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  Headphones,
  Footprints,
  Coffee,
  Sparkles,
  X,
  Plus,
  Clock3,
  Zap,
} from "lucide-react";
import type { Activity, Category } from "./types";
import { categories, loadLabels } from "./data";
export function ActivityIcon({
  category,
  size = 20,
}: {
  category: Category;
  size?: number;
}) {
  const Icon = {
    study: BookOpen,
    work: BriefcaseBusiness,
    hobby: Headphones,
    exercise: Footprints,
    chores: Sparkles,
    rest: Coffee,
  }[category];
  return <Icon size={size} strokeWidth={1.7} />;
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const last = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'button,input,select,textarea,[tabindex="0"]',
        ) || [],
      ).filter((e) => !e.hasAttribute("disabled"));
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key === "Tab") {
        const els = focusable(),
          first = els[0],
          end = els[els.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          end?.focus();
        }
        if (!event.shiftKey && document.activeElement === end) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", onKey);
      last?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialog}
      >
        <button
          className="icon-btn modal-close"
          onClick={onClose}
          aria-label="关闭弹窗"
        >
          <X size={20} />
        </button>
        <h2 id="modal-title">{title}</h2>
        {subtitle && <p className="modal-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
export function ActivityForm({
  activity,
  onSave,
  onClose,
}: {
  activity?: Activity;
  onSave: (fields: Partial<Activity> & Pick<Activity, "title">) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title={activity ? "编辑这件小事" : "给生活加一件小事"}
      subtitle="学习、玩耍或什么也不做，都值得留一点时间。"
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          onSave({
            title: String(data.get("title")).trim(),
            category: data.get("category") as Category,
            minutes: Number(data.get("minutes")),
            energy: Number(data.get("energy")),
            load: data.get("load") as Activity["load"],
            priority: Number(data.get("priority")) as Activity["priority"],
            urgent: data.get("urgent") === "on",
            endCondition: String(data.get("endCondition")).trim(),
          });
        }}
        className="form-grid"
      >
        <label className="full">
          想做什么
          <input
            name="title"
            placeholder="比如：去楼下晒十分钟太阳"
            required
            maxLength={80}
            defaultValue={activity?.title}
            autoComplete="off"
            pattern=".*\S.*"
          />
        </label>
        <label>
          活动类型
          <select name="category" defaultValue={activity?.category || "study"}>
            {Object.entries(categories).map(([value, c]) => (
              <option value={value} key={value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          优先级
          <select name="priority" defaultValue={activity?.priority || 2}>
            <option value="1">随心就好</option>
            <option value="2">有空想做</option>
            <option value="3">比较重要</option>
          </select>
        </label>
        <label>
          预计时间（分钟）
          <input
            name="minutes"
            type="number"
            min="1"
            max="480"
            required
            defaultValue={activity?.minutes || 25}
          />
        </label>
        <label>
          预计精力（点）
          <input
            name="energy"
            type="number"
            min="0"
            max="10"
            step="0.5"
            required
            defaultValue={activity?.energy ?? 2}
          />
        </label>
        <label className="full">
          认知负荷
          <select name="load" defaultValue={activity?.load || "medium"}>
            {Object.entries(loadLabels).map(([v, l]) => (
              <option value={v} key={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="full">
          什么时候可以停下来？<span className="optional">可选</span>
          <input
            name="endCondition"
            placeholder="比如：读完一小节，而不是整本书"
            maxLength={150}
            defaultValue={activity?.endCondition}
          />
        </label>
        <label className="checkbox-label full">
          <input
            type="checkbox"
            name="urgent"
            defaultChecked={activity?.urgent}
          />
          这件事有明确的紧急期限
        </label>
        <div className="modal-actions full">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            先不加了
          </button>
          <button className="btn btn-primary" type="submit">
            <Plus size={16} />
            {activity ? "保存修改" : "加入今天"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function ActivityMeta({ activity }: { activity: Activity }) {
  return (
    <span className="activity-meta">
      <span>
        <Clock3 size={13} />
        {activity.minutes} 分钟
      </span>
      <span>
        <Zap size={13} />
        {activity.energy} 点
      </span>
      <span>{loadLabels[activity.load]}</span>
    </span>
  );
}
