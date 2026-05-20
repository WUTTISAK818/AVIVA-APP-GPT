"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Building2, TrendingUp, Sparkles } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/construction", label: "ก่อสร้าง", icon: Building2 },
  { href: "/finance", label: "การเงิน", icon: TrendingUp },
  { href: "/ai", label: "AI", icon: Sparkles },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-aviva-nav border-t border-aviva-gold/20">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active
                  ? "text-aviva-gold"
                  : "text-aviva-secondary/60 hover:text-aviva-secondary"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-aviva-gold" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
