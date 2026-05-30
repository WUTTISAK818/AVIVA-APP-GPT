"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Plus, X, Clock, ClipboardCheck,
  Receipt, FileText, Users, Phone, Briefcase, AlertCircle, Megaphone,
  Sparkles, Wrench, CheckCircle, AlertTriangle, Star, Download,
  XCircle, ShieldAlert, Package, Printer, ChevronDown, ChevronUp,
  FolderOpen, Upload, Search, Home,
} from "lucide-react";
import clsx from "clsx";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import ProgressBar from "@/components/ProgressBar";
import AIInsightPanel from "@/components/AIInsightPanel";
import AttachDocButton from "@/components/AttachDocButton";
import { supabase } from "@/lib/supabase";
import { logAction } from "@/lib/audit";
import { useCurrentUser } from "@/lib/user-context";
import PeriodFilter, { type Period } from "@/components/PeriodFilter";
import { createNotification } from "@/lib/notify";
import Toast, { type ToastType } from "@/components/Toast";
import { generateDocNumber } from "@/lib/doc-numbers";
import { SLA_DAYS, calcSlaDueAt } from "@/lib/approval-matrix";

type OfficeTab = "finance" | "accounting" | "marketing" | "hr" | "after-sales" | "approvals" | "materials" | "community" | "documents";

const PROJECT_ID = "aaaaaaaa-0000-0000-0000-000000000001";
const today = new Date().toISOString().split("T")[0];

// ─── Shared formatters ──────────────────────────────────────────────────────────────────────────────────

function formatM(n: number) {
  if (Math.abs(n) >= 1_000_000) return `฿${(Math.abs(n) / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `฿${(Math.abs(n) / 1_000).toFixed(0)}K`;
  return `฿${Math.abs(n).toLocaleString("th-TH")}`;
}

function formatThb(n: number) {
  return n.toLocaleString("th-TH");
}

// ─── Construction Payment Interfaces ─────────────────────────────────────────────────────

interface ContractorInstallmentPay {
  id: string;
  installment_no: number;
  name: string;
  amount: number;
  status: string;
  house_id: string;
  house_number?: string;
}

interface AccountingEntry {
  id: string;
  contractor_installment_id: string;
  amount: number;
  account_debit: string;
  account_credit: string;
  payment_method: string | null;
  reference_number: string | null;
  entry_date: string;
  entered_by: string | null;
  notes: string | null;
  created_at: string;
  inst_name?: string;
  house_number?: string;
}

// ─── Finance ──────────────────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface Approval {
  id: string;
  description: string;
  amount: number;
  status: string;
  requested_by: string;
  created_at: string;
}

const FINANCE_CATEGORIES = ["ค่าก่อสร้าง", "ค่าวัสดุ", "ค่าการตลาด", "เงินเดือน", "ค่าดำเนินการ", "รายรับจากการขาย", "อื่นๆ"];

const emptyFinanceForm = {
  transaction_type: "expense",
  amount: "",
  description: "",
  category: "ค่าก่อสร้าง",
  cost_center: "",
};

function FinanceContent() {
  const user = useCurrentUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [materialPurchasePending, setMaterialPurchasePending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyFinanceForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"txn" | "approval" | "construction">("txn");
  const [period, setPeriod] = useState<Period>("month");
  const [dateStart, setDateStart] = useState(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-01`; });
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [finLimit, setFinLimit] = useState(50);
  const [kpiModal, setKpiModal] = useState<"income" | "expense" | "cashflow" | "pending" | null>(null);
  const [approvedInsts, setApprovedInsts] = useState<ContractorInstallmentPay[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingInst, setPayingInst] = useState<ContractorInstallmentPay | null>(null);
  const [payForm, setPayForm] = useState({ payment_method: "โอนเงิน", reference_number: "", entry_date: new Date().toISOString().split("T")[0], notes: "" });

  const fetchData = (limit = finLimit) => {
    let txnQ = supabase.from("finance_transactions").select("*").eq("project_id", PROJECT_ID);
    if (dateStart) txnQ = txnQ.gte("created_at", dateStart);
    if (dateEnd) txnQ = txnQ.lte("created_at", dateEnd + "T23:59:59");
    Promise.all([
      txnQ.order("created_at", { ascending: false }).limit(limit),
      supabase.from("approvals").select("*").eq("module", "finance")
        .order("created_at", { ascending: false }),
      supabase.from("approval_logs").select("approval_id", { count: "exact", head: true })
        .eq("workflow_type", "Material_Purchase").eq("action_taken", "Pending"),
    ]).then(([txnRes, apprRes, matRes]) => {
      setTransactions((txnRes.data as Transaction[]) ?? []);
      setApprovals((apprRes.data as Approval[]) ?? []);
      setMaterialPurchasePending(matRes.count ?? 0);
      setLoading(false);
    });
  };

  const fetchApprovedInsts = async () => {
    const { data } = await supabase.from("contractor_installments")
      .select("id,installment_no,name,amount,status,house_id,houses(house_number)")
      .eq("status", "approved")
      .order("installment_no");
    const rows = ((data ?? []) as Record<string, unknown>[]).map(r => ({
      id: r.id as string,
      installment_no: r.installment_no as number,
      name: r.name as string,
      amount: r.amount as number,
      status: r.status as string,
      house_id: r.house_id as string,
      house_number: ((r.houses as Record<string, unknown> | null)?.house_number as string) ?? undefined,
    }));
    setApprovedInsts(rows);
  };

  const handlePayInstallment = async () => {
    if (!payingInst) return;
    setSaving(true);
    await supabase.from("accounting_entries").insert({
      contractor_installment_id: payingInst.id,
      amount: payingInst.amount,
      account_debit: "2100 เจ้าหนี้ผู้รับเหมา",
      account_credit: "1100 เงินสด/เงินฝากธนาคาร",
      payment_method: payForm.payment_method || null,
      reference_number: payForm.reference_number || null,
      entry_date: payForm.entry_date,
      entered_by: user?.full_name ?? user?.email ?? null,
      notes: payForm.notes || null,
    });
    await supabase.from("contractor_installments").update({ status: "paid" }).eq("id", payingInst.id);
    await createNotification({
      type: "success",
      title: `${payingInst.name} — บันทึกจ่ายแล้ว`,
      message: `ยูนิต ${payingInst.house_number ?? payingInst.house_id} — ฿${payingInst.amount.toLocaleString()}`,
      from_dept: "ฝ่ายการเงิน",
    });
    setSaving(false);
    setShowPayModal(false);
    setPayingInst(null);
    setPayForm({ payment_method: "โอนเงิน", reference_number: "", entry_date: new Date().toISOString().split("T")[0], notes: "" });
    fetchApprovedInsts();
  };

  useEffect(() => { setFinLimit(50); fetchData(50); fetchApprovedInsts(); }, [dateStart, dateEnd]);

  const totalIncome = transactions
    .filter(t => t.transaction_type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions
    .filter(t => t.transaction_type === "expense")
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const netCashflow = totalIncome - totalExpenses;
  const pendingApprovals = approvals.filter(a => a.status === "pending").length;

  const exportCSV = () => {
    const rows = [["วันที่", "ประเภท", "รายละเอียด", "จำนวนเงิน"]];
    transactions.forEach(tx => rows.push([
      new Date(tx.created_at).toLocaleDateString("th-TH"),
      tx.transaction_type === "income" ? "รายรับ" : "รายจ่าย",
      tx.description,
      String(tx.amount),
    ]));
    const csv = "﻿" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    const finUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.href = finUrl;
    a.download = `finance_${dateStart}_${dateEnd}.csv`;
    a.click();
    URL.revokeObjectURL(finUrl);
  };

  const handleSave = async () => {
    if (!form.amount || !form.description) return;
    setSaving(true);
    const amt = Number(form.amount);
    if (amt >= 100000) {
      const finDocNum = await generateDocNumber("FIN");
      const { data } = await supabase.from("approvals").insert({
        module: "finance",
        reference_type: "transaction",
        amount: amt,
        description: `[${form.category}] ${form.description}`,
        status: "pending",
        requested_by: user?.full_name ?? "Admin",
      }).select().single();
      await supabase.from("approval_logs").insert({
        workflow_type: "Finance_Approval",
        source_doc_index: `${finDocNum} | [${form.category}] ${form.description}${form.cost_center ? ` (${form.cost_center})` : ""} | โดย ${user?.full_name ?? user?.email ?? "Unknown"}`,
        source_record_id: data?.id ?? null,
        current_approver_role: amt >= 500000 ? "admin" : "manager",
        action_taken: "Pending",
        amount: amt,
        sla_due_at: calcSlaDueAt("Finance_Approval"),
        assigned_to_name: "ผู้จัดการ",
      });
      await logAction("finance", "request_approval", `ขออนุมัติ ฿${amt.toLocaleString()} — ${form.description}`, data?.id);
      await createNotification({ type: "approval", title: "ขออนุมัติรายจ่าย", message: `[${form.category}] ${form.description} ฿${amt.toLocaleString()}`, from_dept: "ฝ่ายการเงิน" });
    } else {
      const { data } = await supabase.from("finance_transactions").insert({
        project_id: PROJECT_ID,
        transaction_type: form.transaction_type,
        amount: form.transaction_type === "expense" ? -amt : amt,
        description: `[${form.category}] ${form.description}`,
      }).select().single();
      await logAction("finance", "add_transaction", `เพิ่มรายการ ${form.transaction_type} ฿${amt.toLocaleString()} — ${form.description}`, data?.id);
    }
    setSaving(false);
    setShowModal(false);
    setForm(emptyFinanceForm);
    fetchData();
  };

  const handleApprove = async (id: string, approved: boolean) => {
    const approval = approvals.find(a => a.id === id);
    if (!approval) return;
    await supabase.from("approvals").update({
      status: approved ? "approved" : "rejected",
      approved_by: "Admin",
      approved_at: new Date().toISOString(),
    }).eq("id", id);
    if (approved) {
      await supabase.from("finance_transactions").insert({
        project_id: PROJECT_ID,
        transaction_type: "expense",
        amount: -approval.amount,
        description: approval.description,
      });
    }
    await logAction("finance", approved ? "approve" : "reject",
      `${approved ? "อนุมัติ" : "ปฏิเสธ"} ฿${approval.amount.toLocaleString()} — ${approval.description}`, id);
    await createNotification({
      type: approved ? "success" : "info",
      title: approved ? "อนุมัติรายจ่ายแล้ว" : "ปฏิเสธรายจ่าย",
      message: `${approval.description} ฿${approval.amount.toLocaleString()}`,
      from_dept: "ฝ่ายการเงิน",
    });
    fetchData();
  };

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      {materialPurchasePending > 0 && (
        <GlassCard className="p-3 border border-orange-500/20 bg-orange-500/5">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={16} className="text-orange-400 flex-shrink-0" />
            <span className="text-xs text-orange-400 flex-1">
              รออนุมัติจัดซื้อวัสดุ <b>{materialPurchasePending}</b> รายการ
            </span>
          </div>
        </GlassCard>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setKpiModal("income")} className="active:scale-[0.97] transition-transform w-full text-left">
          <GlassCard className="p-3 text-center">
            <TrendingUp size={16} className="text-green-400 mx-auto mb-1" />
            <p className="text-base font-bold text-green-400">{formatM(totalIncome || 0)}</p>
            <p className="text-[10px] text-aviva-secondary mt-0.5">รายรับรวม</p>
          </GlassCard>
        </button>
        <button onClick={() => setKpiModal("expense")} className="active:scale-[0.97] transition-transform w-full text-left">
          <GlassCard className="p-3 text-center">
            <TrendingDown size={16} className="text-red-400 mx-auto mb-1" />
            <p className="text-base font-bold text-red-400">{formatM(totalExpenses || 0)}</p>
            <p className="text-[10px] text-aviva-secondary mt-0.5">รายจ่ายรวม</p>
          </GlassCard>
        </button>
        <button onClick={() => setKpiModal("cashflow")} className="active:scale-[0.97] transition-transform w-full text-left">
          <GlassCard gold className="p-3 text-center">
            <DollarSign size={16} className="text-aviva-gold mx-auto mb-1" />
            <p className="text-base font-bold text-aviva-gold">{formatM(netCashflow || 0)}</p>
            <p className="text-[10px] text-aviva-secondary mt-0.5">Net Cashflow</p>
          </GlassCard>
        </button>
        <button onClick={() => setKpiModal("pending")} className="active:scale-[0.97] transition-transform w-full text-left">
          <GlassCard className="p-3 text-center">
            <ClipboardCheck size={16} className="text-yellow-400 mx-auto mb-1" />
            <p className="text-base font-bold text-yellow-400">{pendingApprovals}</p>
            <p className="text-[10px] text-aviva-secondary mt-0.5">รออนุมัติ</p>
          </GlassCard>
        </button>
      </div>

      <AIInsightPanel
        type="info"
        priority="medium"
        title="AI: วิเคราะห์การเงิน"
        message="รายจ่ายเดือนนี้ควรตรวจสอบหมวดก่อสร้าง แนะนำทบทวนงบประมาณผู้รับเหมาก่อนสิ้นไตรมาส"
      />

      <PeriodFilter period={period} onChange={(p, s, e) => { setPeriod(p); setDateStart(s); setDateEnd(e); }} />

      {/* Add + Export buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-aviva-gold text-aviva-bg font-bold py-3 rounded-2xl text-sm"
        >
          <Plus size={16} /> เพิ่มรายการเงิน
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 border border-aviva-gold/30 text-aviva-gold px-4 py-3 rounded-2xl text-sm font-medium"
        >
          <Download size={15} /> CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { k: "txn", l: "รายการทั้งหมด" },
          { k: "approval", l: `รออนุมัติ${pendingApprovals > 0 ? ` (${pendingApprovals})` : ""}` },
          { k: "construction", l: `เบิกจ่ายก่อสร้าง${approvedInsts.length > 0 ? ` (${approvedInsts.length})` : ""}` },
        ].map(({ k, l }) => (
          <button key={k} onClick={() => setActiveTab(k as "txn" | "approval" | "construction")}
            className={clsx("flex-1 py-2 rounded-xl text-xs font-medium border transition-all",
              activeTab === k
                ? "bg-aviva-gold text-aviva-bg border-aviva-gold"
                : "bg-aviva-card text-aviva-secondary border-aviva-gold/10"
            )}>{l}</button>
        ))}
      </div>

      {activeTab === "txn" && (
        <div className="space-y-2">
          <SectionHeader title="รายการล่าสุด" />
          {loading
            ? [1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-aviva-card/50 animate-pulse" />)
            : transactions.length === 0
            ? <GlassCard className="p-6 text-center"><p className="text-aviva-secondary text-sm">ยังไม่มีรายการ</p></GlassCard>
            : transactions.map(tx => (
              <GlassCard key={tx.id} className="p-3 flex items-center gap-3">
                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  tx.transaction_type === "income" ? "bg-green-500/10" : "bg-red-500/10")}>
                  {tx.transaction_type === "income"
                    ? <TrendingUp size={14} className="text-green-400" />
                    : <TrendingDown size={14} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-aviva-text font-medium truncate">{tx.description}</p>
                  <p className="text-[10px] text-aviva-secondary">{new Date(tx.created_at).toLocaleDateString("th-TH")}</p>
                </div>
                <span className={clsx("text-sm font-bold flex-shrink-0", Number(tx.amount) > 0 ? "text-green-400" : "text-red-400")}>
                  {Number(tx.amount) > 0 ? "+" : ""}{formatM(tx.amount)}
                </span>
              </GlassCard>
            ))
          }
          {!loading && transactions.length >= finLimit && (
            <button onClick={() => { const next = finLimit + 50; setFinLimit(next); fetchData(next); }}
              className="w-full py-2.5 text-xs text-aviva-secondary border border-aviva-gold/10 rounded-xl bg-aviva-bg hover:border-aviva-gold/30 transition-all mt-1">
              โหลดเพิ่มเติม (แสดง {finLimit} รายการแล้ว)
            </button>
          )}
        </div>
      )}

      {activeTab === "approval" && (
        <div className="space-y-3">
          <SectionHeader title="รายการรออนุมัติ" subtitle="≥ ฿100,000 ต้องอนุมัติก่อน" />
          {approvals.length === 0
            ? <GlassCard className="p-6 text-center"><p className="text-aviva-secondary text-sm">ไม่มีรายการรออนุมัติ</p></GlassCard>
            : approvals.map(ap => (
              <GlassCard key={ap.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-aviva-text">{ap.description}</p>
                    <p className="text-xs text-aviva-secondary mt-0.5">โดย: {ap.requested_by}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-aviva-gold">฿{ap.amount.toLocaleString("th-TH")}</p>
                    <span className={clsx("text-[10px] px-2 py-0.5 rounded-full",
                      ap.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                      ap.status === "approved" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>
                      {ap.status === "pending" ? "รออนุมัติ" : ap.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
                    </span>
                  </div>
                </div>
                {ap.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(ap.id, true)}
                      className="flex-1 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-xs font-medium">
                      อนุมัติ
                    </button>
                    <button onClick={() => handleApprove(ap.id, false)}
                      className="flex-1 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-medium">
                      ปฏิเสธ
                    </button>
                  </div>
                )}
              </GlassCard>
            ))
          }
        </div>
      )}

      {activeTab === "construction" && (
        <div className="space-y-3">
          <SectionHeader title="เบิกจ่ายก่อสร้าง" subtitle="งวดงานที่อนุมัติแล้ว — รอบันทึกจ่าย" />
          {approvedInsts.length === 0 ? (
            <GlassCard className="p-6 text-center"><p className="text-aviva-secondary text-sm">ไม่มีงวดงานที่รอจ่าย</p></GlassCard>
          ) : approvedInsts.map(inst => (
            <GlassCard key={inst.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-aviva-text">{inst.name}</p>
                  {inst.house_number && <p className="text-xs text-aviva-secondary mt-0.5">ยูนิต: {inst.house_number}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-aviva-gold">฿{inst.amount.toLocaleString("th-TH")}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">อนุมัติแล้ว</span>
                </div>
              </div>
              <button onClick={() => { setPayingInst(inst); setShowPayModal(true); }}
                className="w-full py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-xs font-medium">
                บันทึกจ่าย
              </button>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Pay Installment Modal */}
      {showPayModal && payingInst && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-aviva-card rounded-t-3xl p-6 pb-10 space-y-4 mb-14">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-aviva-text">บันทึกจ่าย — {payingInst.name}</h2>
              <button onClick={() => { setShowPayModal(false); setPayingInst(null); }}><X size={20} className="text-aviva-secondary" /></button>
            </div>
            <p className="text-sm text-aviva-secondary">จำนวนเงิน: <span className="text-aviva-gold font-bold">฿{payingInst.amount.toLocaleString()}</span></p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-aviva-secondary mb-1 block">วิธีการชำระเงิน</label>
                <select value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}
                  className="w-full bg-aviva-bg border border-aviva-gold/20 rounded-xl px-4 py-3 text-sm text-aviva-text outline-none focus:border-aviva-gold/60">
                  {["โอนเงิน", "เช็ค", "เงินสด"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-aviva-secondary mb-1 block">เลขที่อ้างอิง (ถ้ามี)</label>
                <input type="text" value={payForm.reference_number} onChange={e => setPayForm({ ...payForm, reference_number: e.target.value })}
                  placeholder="เลขที่โอน / เลขที่เช็ค"
                  className="w-full bg-aviva-bg border border-aviva-gold/20 rounded-xl px-4 py-3 text-sm text-aviva-text placeholder:text-aviva-secondary/40 outline-none focus:border-aviva-gold/60" />
              </div>
              <div>
                <label className="text-xs text-aviva-secondary mb-1 block">วันที่จ่าย</label>
                <input type="date" value={payForm.entry_date} onChange={e => setPayForm({ ...payForm, entry_date: e.target.value })}
                  className="w-full bg-aviva-bg border border-aviva-gold/20 rounded-xl px-4 py-3 text-sm text-aviva-text outline-none focus:border-aviva-gold/60" />
              </div>
              <div>
                <label className="text-xs text-aviva-secondary mb-1 block">หมายเหตุ</label>
                <input type="text" value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })}
                  placeholder="หมายเหตุเพิ่มเติม"
                  className="w-full bg-aviva-bg border border-aviva-gold/20 rounded-xl px-4 py-3 text-sm text-aviva-text placeholder:text-aviva-secondary/40 outline-none focus:border-aviva-gold/60" />
              </div>
            </div>
            <button onClick={handlePayInstallment} disabled={saving}
              className="w-full bg-aviva-gold text-aviva-bg font-bold py-3.5 rounded-2xl text-sm disabled:opacity-50">
              {saving ? "กำลังบันทึก..." : "ยืนยันบันทึกจ่าย"}
            </button>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-aviva-card rounded-t-3xl p-6 pb-10 space-y-4 mb-14">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-aviva-text">เพิ่มรายการเงิน</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-aviva-secondary" /></button>
            </div>

            <div className="flex gap-2">
              {[
                { val: "expense", label: "รายจ่าย", color: "bg-red-500/20 text-red-400 border-red-500/30" },
                { val: "income", label: "รายรับ", color: "bg-green-500/20 text-green-400 border-green-500/30" },
              ].map(({ val, label, color }) => (
                <button key={val} onClick={() => setForm({ ...form, transaction_type: val })}
                  className={clsx("flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all",
                    form.transaction_type === val ? color : "bg-aviva-bg text-aviva-secondary border-aviva-gold/10"
                  )}>{label}</button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-aviva-secondary mb-1 block">จำนวนเงิน (บาท) *</label>
                <input type="number" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  className="w-full bg-aviva-bg border border-aviva-gold/20 rounded-xl px-4 py-3 text-sm text-aviva-text placeholder:text-aviva-secondary/40 outline-none focus:border-aviva-gold/60" />
                {Number(form.amount) >= 100000 && (
                  <p className="text-[11px] text-yellow-400 mt-1 flex items-center gap-1">
                    <Clock size={10} /> ≥ ฿100,000 จะเข้าระบบอนุมัติก่อน
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-aviva-secondary mb-1 block">รายละเอียด *</label>
                <input type="text" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="อธิบายรายการ..."
                  className="w-full bg-aviva-bg border border-aviva-gold/20 rounded-xl px-4 py-3 text-sm text-aviva-text placeholder:text-aviva-secondary/40 outline-none focus:border-aviva-gold/60" />
              </div>
              <div>
                <label className="text-xs text-aviva-secondary mb-1 block">หมวดหมู่</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-aviva-bg border border-aviva-gold/20 rounded-xl px-4 py-3 text-sm text-aviva-text outline-none focus:border-aviva-gold/60">
                  {FINANCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-aviva-secondary mb-1 block">Cost Center (ระบุถ้ามี)</label>
                <input type="text" value={form.cost_center}
                  onChange={e => setForm({ ...form, cost_center: e.target.value })}
                  placeholder="เช่น CC-001 ฝ่ายก่อสร้าง"
                  className="w-full bg-aviva-bg border border-aviva-gold/20 rounded-xl px-4 py-3 text-sm text-aviva-text placeholder:text-aviva-secondary/40 outline-none focus:border-aviva-gold/60" />
              </div>
            </div>

            <button onClick={handleSave} disabled={saving || !form.amount || !form.description}
              className="w-full bg-aviva-gold text-aviva-bg font-bold py-3.5 rounded-2xl text-sm disabled:opacity-50">
              {saving ? "กำลังบันทึก..." : Number(form.amount) >= 100000 ? "ส่งขออนุมัติ" : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* KPI Detail Modal */}
      {kpiModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-aviva-card rounded-t-3xl p-5 pb-10 mb-14 flex flex-col" style={{ maxHeight: "75vh" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-aviva-text">
                {kpiModal === "income" ? "รายรับทั้งหมด" :
                 kpiModal === "expense" ? "รายจ่ายทั้งหมด" :
                 kpiModal === "cashflow" ? "รายการทั้งหมด" : "รออนุมัติ"}
              </h2>
              <button onClick={() => setKpiModal(null)}><X size={20} className="text-aviva-secondary" /></button>
            </div>