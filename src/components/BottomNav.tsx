"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, TrendingUp,
  Sparkles, BookOpen, UserCheck, FolderOpen,
  Megaphone, Wrench,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard",   label: "บริหาร",    icon: LayoutDashboard },
  { href: "/crm",         label: "ขาย",       icon: Users },
  { href: "/construction",label: "ก่อสร้าง",  icon: Building2 },
  { href: "/finance",     label: "การเงิน",   icon: TrendingUp },
  { href: "/accounting",  label: "บัญชี",     icon: BookOpen },
  { href: "/hr",          label: "บุคคล",     icon: UserCheck },
  { href: "/marketing",   label: "การตลาด",   icon: Megaphone },
  { href: "/after-sales", label: "After Sales", icon: Wrench },
  { href: "/documents",   label: "เอกสาร",    icon: FolderOpen },
  { href: "/ai",          label: "AI",         icon: Sparkles },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-aviva-nav border-t border-aviva-gold/20">
      <div
        className="flex items-center gap-1 px-2 py-2 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[58px]",
                active
                  ? "text-aviva-gold"
                  : "text-aviva-secondary/60 hover:text-aviva-secondary"
              )}
            >
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
