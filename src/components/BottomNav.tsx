"use client";
import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Building2,
  Sparkles, FolderOpen, Briefcase,
  ClipboardCheck, Home, Settings,
} from "lucide-react";
import clsx from "clsx";
import { useCurrentUser } from "@/lib/user-context";

const OFFICE_DEPTS = ["ฝ่ายการเงิน", "ฝ่ายบัญชี", "ฝ่ายบุคคล", "ฝ่ายการตลาด", "ฝ่ายหลังการขาย"];

const ALL_TABS = [
  { href: "/dashboard",    label: "หน้าหลัก",    icon: LayoutDashboard, depts: [] as string[], adminOnly: false, managerOnly: false, officeOnly: false },
  { href: "/crm",          label: "ขาย",          icon: Users,           depts: ["ฝ่ายขาย"],    adminOnly: false, managerOnly: false, officeOnly: false },
  { href: "/construction", label: "ก่อสร้าง",     icon: Building2,       depts: ["ฝ่ายก่อสร้าง"], adminOnly: false, managerOnly: false, officeOnly: false },
  { href: "/office",       label: "ออฟฟิศ",       icon: Briefcase,       depts: OFFICE_DEPTS,   adminOnly: false, managerOnly: false, officeOnly: true },
  { href: "/approvals",    label: "อนุมัติ",      icon: ClipboardCheck,  depts: [],             adminOnly: false, managerOnly: true,  officeOnly: false },
  { href: "/community",    label: "นิติบุคคล",    icon: Home,            depts: [],             adminOnly: true,  managerOnly: false, officeOnly: false },
  { href: "/documents",    label: "เอกสาร",       icon: FolderOpen,      depts: [],             adminOnly: false, managerOnly: false, officeOnly: false },
  { href: "/ai",           label: "AI",            icon: Sparkles,        depts: [],             adminOnly: false, managerOnly: false, officeOnly: false },
  { href: "/settings",     label: "ตั้งค่า",      icon: Settings,        depts: [],             adminOnly: false, managerOnly: false, officeOnly: false },
];

export default function BottomNav() {
  const pathname = usePathname();
  const user = useCurrentUser();
  if (pathname === "/login") return null;

  const navItems = useMemo(() => ALL_TABS.filter((tab) => {
    if (tab.adminOnly) return user?.isAdmin ?? false;
    if (tab.managerOnly) return user?.isAdmin || user?.isManager || false;
    if (!user) return tab.depts.length === 0 && !tab.officeOnly;
    if (user.isAdmin || user.isManager) return true;
    if (tab.officeOnly) return tab.depts.some(d => d === user.department);
    if (tab.depts.length === 0) return true;
    return tab.depts.includes(user.department);
  }), [user]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-aviva-nav border-t border-aviva-gold/20">
      <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={clsx(
                "flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[58px]",
                active ? "text-aviva-gold" : "text-aviva-secondary/60 hover:text-aviva-secondary"
              )}>
              <Icon size={19} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[9px] font-medium whitespace-nowrap">{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-aviva-gold" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
