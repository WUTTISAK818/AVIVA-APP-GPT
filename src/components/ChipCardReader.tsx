"use client";
import { useState } from "react";
import { Cpu, Loader2, Usb } from "lucide-react";
import { isWebUSBSupported, requestReader, readThaiIdFromChip, type ChipIdFields } from "@/lib/thai-id-reader";

interface Props {
  onExtracted: (fields: ChipIdFields) => void;
  onError?: (message: string) => void;
}

export default function ChipCardReader({ onExtracted, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const supported = isWebUSBSupported();

  if (!supported) {
    return (
      <div className="flex items-center gap-2 w-full bg-aviva-bg border border-aviva-gold/10 rounded-xl px-4 py-3 opacity-70">
        <Usb size={16} className="text-aviva-secondary/60" />
        <span className="text-xs text-aviva-secondary">
          อุปกรณ์นี้ไม่รองรับเครื่องอ่านชิป (ใช้ได้บน Chrome/Android) — ใช้ถ่ายรูปบัตรแทน
        </span>
      </div>
    );
  }

  const read = async () => {
    setLoading(true);
    try {
      const device = await requestReader();
      const fields = await readThaiIdFromChip(device);
      if (!fields.national_id && !fields.full_name) {
        onError?.("อ่านชิปไม่สำเร็จ ตรวจสอบว่าเสียบบัตรถูกด้านและลองใหม่");
        return;
      }
      onExtracted(fields);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "อ่านชิปไม่สำเร็จ";
      // ผู้ใช้กดยกเลิกหน้าต่างเลือกอุปกรณ์
      onError?.(/No device selected|cancel/i.test(msg) ? "ยกเลิกการเลือกเครื่องอ่าน" : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={read} disabled={loading}
      className="flex items-center gap-3 w-full bg-aviva-bg border border-aviva-gold/40 rounded-xl px-4 py-3.5 disabled:opacity-60">
      {loading ? <Loader2 size={18} className="text-aviva-gold animate-spin" /> : <Cpu size={18} className="text-aviva-gold" />}
      <span className="text-sm font-medium text-aviva-text">
        {loading ? "กำลังอ่านชิปบัตร..." : "อ่านบัตรจากชิป (เครื่องอ่าน USB)"}
      </span>
      <Usb size={16} className="text-aviva-secondary/60 ml-auto" />
    </button>
  );
}
