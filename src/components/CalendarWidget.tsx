"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/user-context";
import GlassCard from "./GlassCard";

interface CalEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  description: string | null;
}

const EVENT_TYPES = [
  { value: "general",    label: "ทั่วไป",      dot: "bg-blue-400" },
  { value: "meeting",    label: "ประชุม",       dot: "bg-aviva-gold" },
  { value: "deadline",   label: "กำหนดส่ง",    dot: "bg-red-400" },
  { value: "site_visit", label: "ตรวจพื้นที่", dot: "bg-green-400" },
];

const DOT: Record<string, string> = {
  general: "bg-blue-400", meeting: "bg-yellow-400",
  deadline: "bg-red-400", site_visit: "bg-green-400",
};

const DAYS_TH  = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const today = new Date().toISOString().split("T")[0];

export default function CalendarWidget() {
  const user = useCurrentUser();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [selected,     setSelected]     = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form,   setForm]   = useState({ title: "", event_type: "general", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchEvents = () => {
    const mm = String(month + 1).padStart(2, "0");
    supabase.from("events").select("*")
      .gte("event_date", `${year}-${mm}-01`)
      .lte("event_date", `${year}-${mm}-31`)
      .then(({ data }) => setEvents((data as CalEvent[]) ?? []));
  };

  useEffect(() => { fetchEvents(); }, [year, month]);

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const ds = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const dayEvents = (d: number) => events.filter(e => e.event_date === ds(d));
  const selectedEvents = selected ? events.filter(e => e.event_date === selected) : [];

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0);  setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleAdd = async () => {
    if (!form.title || !selected) return;
    setSaving(true);
    await supabase.from("events").insert({
      title: form.title,
      event_date: selected,
      event_type: form.event_type,
      description: form.description || null,
    });
    setSaving(false);
    setShowAddModal(false);
    setForm({ title: "", event_type: "general", description: "" });
    fetchEvents();
  };

  return (
    <>
      <GlassCard className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-aviva-gold/10 transition-colors">
            <ChevronLeft size={16} className="text-aviva-secondary" />
          </button>
          <h3 className="text-sm font-semibold text-aviva-text">
            {MONTHS_TH[month]} {year + 543}
          </h3>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-aviva-gold/10 transition-colors">
            <ChevronRight size={16} className="text-aviva-secondary" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_TH.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-aviva-secondary/60 py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const dateStr  = ds(d);
            const evts     = dayEvents(d);
            const isToday  = dateStr === today;
            const isSel    = dateStr === selected;
            return (
              <button key={i}
                onClick={() => setSelected(isSel ? null : dateStr)}
                className={`flex flex-col items-center py-1 rounded-lg transition-all ${
                  isSel    ? "bg-aviva-gold/20 border border-aviva-gold/40" :
                  isToday  ? "border border-aviva-gold/30" : ""
                }`}
              >
                <span className={`text-xs font-medium ${isToday ? "text-aviva-gold" : "text-aviva-text"}`}>{d}</span>
                {evts.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {evts.slice(0, 3).map(e => (
                      <span key={e.id} className={`w-1 h-1 rounded-full ${DOT[e.event_type] ?? "bg-blue-400"}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected date details */}
        {selected && (
          <div className="mt-3 border-t border-aviva-gold/10 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-aviva-text">
                {new Date(selected + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
              </p>
              {(user?.isAdmin || user?.isManager) && (
                <button onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 text-[11px] text-aviva-gold border border-aviva-gold/30 px-2 py-1 rounded-lg">
                  <Plus size={10} /> เพิ่ม
                </button>
              )}
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-aviva-secondary/60">ไม่มีกิจกรรม</p>
            ) : (
              <div className="space-y-1.5">
                {selectedEvents.map(e => {
                  const et = EVENT_TYPES.find(t => t.value === e.event_type);
                  return (
                    <div key={e.id} className="flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${DOT[e.event_type] ?? "bg-blue-400"}`} />
                      <div>
                        <p className="text-xs text-aviva-text font-medium">{e.title}</p>
                        {e.description && <p className="text-[10px] text-aviva-secondary">{e.description}</p>}
                        <p className="text-[10px] text-aviva-secondary/60">{et?.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Add event modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-aviva-card rounded-t-3xl p-6 pb-10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-aviva-text">เพิ่มกิจกรรม</h2>
              <button onClick={() => setShowAddModal(false)}><X size={18} className="text-aviva-secondary" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-aviva-secondary mb-1 block">ชื่อกิจกรรม *</label>
                <input type="text" value={form.title}
                  onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="เช่น ประชุมทีมขาย"
                  className="w-full bg-aviva-bg border border-aviva-gold/20 rounded-xl px-4 py-2.5 text-sm text-aviva-text placeholder:text-aviva-secondary/40 outline-none focus:border-aviva-gold/60" />
              </div>
              <div>
                <label className="text-xs text-aviva-secondary mb-1 block">ประเภท</label>
                <select value={form.event_type}
                  onChange={(e) => setForm(p => ({ ...p, event_type: e.target.value }))}
                  className="w-full bg-aviva-bg border border-aviva-gold/20 rounded-xl px-4 py-2.5 text-sm text-aviva-text outline-none focus:border-aviva-gold/60">
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-aviva-secondary mb-1 block">รายละเอียด</label>
                <textarea value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="รายละเอียดเพิ่มเติม..." rows={2}
                  className="w-full bg-aviva-bg border border-aviva-gold/20 rounded-xl px-4 py-2.5 text-sm text-aviva-text placeholder:text-aviva-secondary/40 outline-none focus:border-aviva-gold/60 resize-none" />
              </div>
            </div>
            <button onClick={handleAdd} disabled={saving || !form.title}
              className="w-full bg-aviva-gold text-aviva-bg font-bold py-3 rounded-2xl text-sm disabled:opacity-50">
              {saving ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
