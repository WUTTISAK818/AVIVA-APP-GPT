import clsx from "clsx";

interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  showPercent?: boolean;
  color?: "gold" | "green" | "red";
  sublabel?: string;
}

export default function ProgressBar({
  label,
  value,
  max = 100,
  showPercent = true,
  color = "gold",
  sublabel,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  const trackColor = {
    gold: "bg-aviva-gold",
    green: "bg-green-500",
    red: "bg-red-500",
  }[color];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-aviva-text font-medium">{label}</span>
        {showPercent && (
          <span className="text-sm font-bold text-aviva-gold">{pct}%</span>
        )}
      </div>
      {sublabel && (
        <p className="text-xs text-aviva-secondary -mt-1">{sublabel}</p>
      )}
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all", trackColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
