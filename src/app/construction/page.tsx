"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import clsx from "clsx";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import ProgressBar from "@/components/ProgressBar";
import { houseProgress, type HouseStatus } from "@/lib/mock-data";

type Filter = "all" | HouseStatus;

const statusConfig = {
  complete: { label: "เสร็จแล้ว", icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  "on-track": { label: "ตามแผน", icon: Clock, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  delayed: { label: "ล่าช้า", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
};

export default function ConstructionPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = {
    complete: houseProgress.filter((h) => h.status === "complete").length,
    "on-track": houseProgress.filter((h) => h.status === "on-track").length,
    delayed: houseProgress.filter((h) => h.status === "delayed").length,
  };

  const overallProgress = Math.round(
    houseProgress.reduce((sum, h) => sum + h.progress, 0) / houseProgress.length
  );

  const filtered =
    filter === "all" ? houseProgress : houseProgress.filter((h) => h.status === filter);

  const progressColor = (pct: number): "gold" | "green" | "red" => {
    if (pct === 100) return "green";
    if (pct < 50) return "red";
    return "gold";
  };

  return (
    <div className="min-h-screen bg-aviva-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-aviva-bg/95 backdrop-blur-sm border-b border-aviva-gold/10 px-4 pt-12 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-aviva-text">การก่อสร้าง</h1>
          <p className="text-xs text-aviva-secondary mt-0.5">ติดตามความคืบหน้าทุกยูนิต</p>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        {/* Overall Progress */}
        <GlassCard gold className="p-4">
          <SectionHeader title="ภาพรวมการก่อสร้าง" />
          <ProgressBar
            label="ความคืบหน้าโดยรวม"
            value={overallProgress}
            sublabel={`${houseProgress.length} ยูนิต`}
          />
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {(["complete", "on-track", "delayed"] as HouseStatus[]).map((s) => {
            const { label, icon: Icon, color, bg } = statusConfig[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(filter === s ? "all" : s)}
                className={clsx(
                  "rounded-2xl border p-3 flex flex-col items-center gap-1.5 transition-all",
                  bg,
                  filter === s && "ring-2 ring-aviva-gold/50"
                )}
              >
                <Icon size={18} className={color} />
                <span className={clsx("text-xl font-bold", color)}>{counts[s]}</span>
                <span className="text-[10px] text-aviva-secondary">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["all", "complete", "on-track", "delayed"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "flex-1 py-2 rounded-xl text-xs font-medium border transition-all",
                filter === f
                  ? "bg-aviva-gold text-aviva-bg border-aviva-gold"
                  : "bg-aviva-card text-aviva-secondary border-aviva-gold/10"
              )}
            >
              {f === "all" ? "ทั้งหมด" : statusConfig[f].label}
            </button>
          ))}
        </div>

        {/* House Cards */}
        <div>
          <SectionHeader
            title={`ยูนิต (${filtered.length})`}
            subtitle="แตะที่สถานะเพื่อกรอง"
          />
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((house) => {
              const { label, icon: Icon, color, bg } = statusConfig[house.status];
              return (
                <GlassCard key={house.unit} className={clsx("p-3 border", bg)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-aviva-text">{house.unit}</span>
                    <Icon size={14} className={color} />
                  </div>
                  <ProgressBar
                    label=""
                    value={house.progress}
                    showPercent={false}
                    color={progressColor(house.progress)}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-aviva-secondary truncate">{house.phase}</span>
                    <span className={clsx("text-xs font-bold", color)}>{house.progress}%</span>
                  </div>
                  {house.delay && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <AlertTriangle size={10} className="text-red-400" />
                      <span className="text-[10px] text-red-400">ล่าช้า {house.delay} วัน</span>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
