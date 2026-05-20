import { Sparkles, AlertTriangle, CheckCircle, Info } from "lucide-react";
import clsx from "clsx";

interface AIInsightPanelProps {
  type: "warning" | "success" | "alert" | "info";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
}

const config = {
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  success: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  alert: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
};

const priorityLabel = {
  high: { label: "ด่วน", color: "bg-red-500/20 text-red-400" },
  medium: { label: "ปานกลาง", color: "bg-yellow-500/20 text-yellow-400" },
  low: { label: "ทั่วไป", color: "bg-blue-500/20 text-blue-400" },
};

export default function AIInsightPanel({ type, priority, title, message }: AIInsightPanelProps) {
  const { icon: Icon, color, bg } = config[type];
  const p = priorityLabel[priority];

  return (
    <div className={clsx("rounded-xl border p-3 flex gap-3", bg)}>
      <div className="flex-shrink-0 mt-0.5">
        <Icon size={16} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-aviva-text">{title}</span>
          <span className={clsx("text-[10px] font-medium px-1.5 py-0.5 rounded-full", p.color)}>
            {p.label}
          </span>
        </div>
        <p className="text-xs text-aviva-secondary leading-relaxed">{message}</p>
      </div>
      <Sparkles size={12} className="text-aviva-gold flex-shrink-0 mt-0.5" />
    </div>
  );
}
