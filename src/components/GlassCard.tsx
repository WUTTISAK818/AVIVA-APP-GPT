import clsx from "clsx";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
}

export default function GlassCard({ children, className, gold }: GlassCardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border backdrop-blur-sm",
        gold
          ? "bg-aviva-gold/5 border-aviva-gold/30"
          : "bg-aviva-card/80 border-aviva-gold/10",
        className
      )}
    >
      {children}
    </div>
  );
}
