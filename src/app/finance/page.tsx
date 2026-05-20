"use client";

import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import clsx from "clsx";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import ProgressBar from "@/components/ProgressBar";
import AIInsightPanel from "@/components/AIInsightPanel";
import { financeSummary, cashflowData, transactions } from "@/lib/mock-data";

function formatM(n: number) {
  return `฿${(n / 1_000_000).toFixed(1)}M`;
}

export default function FinancePage() {
  return (
    <div className="min-h-screen bg-aviva-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-aviva-bg/95 backdrop-blur-sm border-b border-aviva-gold/10 px-4 pt-12 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-aviva-text">การเงิน & บัญชี</h1>
          <p className="text-xs text-aviva-secondary mt-0.5">สรุปรายการเงินโครงการ</p>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-3 text-center">
            <TrendingUp size={16} className="text-green-400 mx-auto mb-1" />
            <p className="text-base font-bold text-green-400">
              {formatM(financeSummary.totalIncome)}
            </p>
            <p className="text-[10px] text-aviva-secondary mt-0.5">รายรับรวม</p>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <TrendingDown size={16} className="text-red-400 mx-auto mb-1" />
            <p className="text-base font-bold text-red-400">
              {formatM(financeSummary.totalExpenses)}
            </p>
            <p className="text-[10px] text-aviva-secondary mt-0.5">รายจ่ายรวม</p>
          </GlassCard>
          <GlassCard gold className="p-3 text-center">
            <DollarSign size={16} className="text-aviva-gold mx-auto mb-1" />
            <p className="text-base font-bold text-aviva-gold">
              {formatM(financeSummary.netCashflow)}
            </p>
            <p className="text-[10px] text-aviva-secondary mt-0.5">Net Cashflow</p>
          </GlassCard>
        </div>

        {/* Cashflow Chart */}
        <GlassCard className="p-4">
          <SectionHeader title="Cashflow รายเดือน" subtitle="หน่วย: ล้านบาท" />
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#D1D5DB", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#D1D5DB", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#17332D",
                    border: "1px solid #D4AF37",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#incomeGrad)"
                  name="รายรับ"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#expenseGrad)"
                  name="รายจ่าย"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Budget Utilization */}
        <GlassCard className="p-4">
          <SectionHeader title="งบประมาณ" subtitle="การใช้จ่ายต่อหมวด" />
          <div className="space-y-4">
            <ProgressBar
              label="ค่าก่อสร้าง"
              value={financeSummary.contractorUsed}
              max={financeSummary.contractorBudget}
              sublabel={`${formatM(financeSummary.contractorUsed)} / ${formatM(financeSummary.contractorBudget)}`}
            />
            <ProgressBar
              label="การตลาด"
              value={financeSummary.marketingUsed}
              max={financeSummary.marketingBudget}
              sublabel={`${formatM(financeSummary.marketingUsed)} / ${formatM(financeSummary.marketingBudget)}`}
            />
            <ProgressBar
              label="ค่าดำเนินการ"
              value={financeSummary.adminUsed}
              max={financeSummary.adminBudget}
              sublabel={`${formatM(financeSummary.adminUsed)} / ${formatM(financeSummary.adminBudget)}`}
            />
          </div>
        </GlassCard>

        {/* Recent Transactions */}
        <div>
          <SectionHeader title="รายการล่าสุด" />
          <div className="space-y-2">
            {transactions.map((tx) => (
              <GlassCard key={tx.id} className="p-3 flex items-center gap-3">
                <div
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    tx.type === "income"
                      ? "bg-green-500/10"
                      : "bg-red-500/10"
                  )}
                >
                  {tx.type === "income" ? (
                    <TrendingUp size={14} className="text-green-400" />
                  ) : (
                    <TrendingDown size={14} className="text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-aviva-text font-medium truncate">{tx.desc}</p>
                  <p className="text-[10px] text-aviva-secondary">{tx.date}</p>
                </div>
                <span
                  className={clsx(
                    "text-sm font-bold flex-shrink-0",
                    tx.amount > 0 ? "text-green-400" : "text-red-400"
                  )}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {formatM(Math.abs(tx.amount))}
                </span>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* AI Alert */}
        <AIInsightPanel
          type="warning"
          priority="high"
          title="AI Financial Alert"
          message="Cashflow อาจติดลบในเดือนตุลาคม จากค่าก่อสร้างที่เพิ่มขึ้น แนะนำให้เร่งปิดการขาย 8 ยูนิตใน pipeline"
        />
      </div>
    </div>
  );
}
