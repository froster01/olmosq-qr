"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  ClipboardList,
  QrCode,
  Settings2,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/staff/orders", label: "Orders", icon: ClipboardList },
  { href: "/staff/shift", label: "Shift", icon: Banknote },
  { href: "/staff/menu-settings", label: "Menu", icon: Settings2 },
  { href: "/staff/tables", label: "Tables & QR", icon: QrCode },
];

export function StaffNavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "staff-nav-link flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/35 hover:text-primary",
              active && "bg-accent/40 text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="staff-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
