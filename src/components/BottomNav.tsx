"use client";
import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, TrendingUp,
  Sparkles, BookOpen, UserCheck, FolderOpen, Megaphone, Wrench,
  ClipboardCheck, Home,
} from "lucide-react";
import clsx from "clsx";
import { useCurrentUser } from "@/lib/user-context";

const ALL_TABS = [
  { href: "/dashboard",    label: "บริหาร",      icon: LayoutDashboard, depts: [] as string[], adminOnly: false, managerOnly: false },
  { href: "/crm",          label: "ขาย",         icon: Users,           depts: ["ฝ่ายขาย"],    adminOnly: false, managerOnly: false },
  { href: "/construction", label: "ก่อสร้าง",    icon: Building2,       depts: ["ฝ่ายก่อสร้าง"], adminOnly: false, managerOnly: false },
  { href: "/finance",      label: "การเงิน",     icon: TrendingUp,      depts: ["ฝ่ายการเงิน"],  adminOnly: false, managerOnly: false },
  { href: "/accounting",   label: "บัญชี",       icon: BookOpen,        depts: ["ฝ่ายบัญชี"],    adminOnly: false, managerOnly: false },
  { href: "/hr",           label: "บุคคล",       icon: UserCheck,       depts: ["ฝ่ายบุคคล"],    adminOnly: false, managerOnly: false },
  { href: "/marketing",    label: "การตลาด",     icon: Megaphone,       depts: ["ฝ่ายการตลาด"],  adminOnly: false, managerOnly: false },
  { href: "/after-sales",  label: "After Sales", icon: Wrench,          depts: ["ฝ่ายหลังการขาย"], adminOnly: false, managerOnly: false },
  { href: "/approvals",    label: "อนุมัติ",     icon: ClipboardCheck,  depts: [],              adminOnly: false, managerOnly: true },
  { href: "/community",    label: "นิติบุคคล",   icon: Home,            depts: [],              adminOnly: true,  managerOnly: false },
  { href: "/documents",    label: "เอกสาร",      icon: FolderOpen,      depts: [],              adminOnly: false, managerOnly: false },
  { href: "/ai",           label: "AI",           icon: Sparkles,        depts: [],              adminOnly: false, managerOnly: false },
];

export default function BottomNav() {
  const pathname = usePathname();
  const user = useCurrentUser();
  if (pathname === "/login") return null;

  const navItems = useMemo(() => ALL_TABS.filter((tab) => {
    if (tab.adminOnly) return user?.isAdmin ?? false;
    if (tab.managerOnly) return user?.isAdmin || user?.isManager || false;
    if (!user) return tab.depts.length === 0;
    if (user.isAdmin || user.isManager) return true;
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
