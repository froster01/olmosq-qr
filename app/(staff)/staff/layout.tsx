import Link from "next/link";
import { Coffee, ClipboardList, RefreshCw, QrCode } from "lucide-react";

const navItems = [
  { href: "/staff/orders", label: "Orders", icon: ClipboardList },
  { href: "/staff/menu-sync", label: "Menu Sync", icon: RefreshCw },
  { href: "/staff/tables", label: "Tables & QR", icon: QrCode },
];

export default function StaffNavLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-muted/30 flex flex-col">
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link href="/staff/orders" className="flex items-center gap-2 font-semibold">
            <Coffee className="h-5 w-5" />
            Olmosq Staff
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
