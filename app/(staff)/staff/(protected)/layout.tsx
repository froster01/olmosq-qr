import Link from "next/link";
import { LogOut } from "lucide-react";

import { logoutStaffAction } from "@/app/actions/staff-auth";
import { BrandMark } from "@/components/brand-mark";
import { StaffPushAlerts } from "@/components/staff/staff-push-alerts";
import { StaffNavLinks } from "@/components/staff/staff-nav-link";
import { Button } from "@/components/ui/button";
import { requireStaffPageUser } from "@/lib/staff-auth/guards";

export default async function StaffNavLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStaffPageUser();

  return (
    <div className="staff-shell flex min-h-dvh flex-col bg-background">
      <header className="staff-header sticky top-0 z-40 border-b bg-background/95 shadow-sm backdrop-blur">
        <div className="staff-header-inner mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap md:gap-6">
          <Link
            href="/staff/orders"
            className="staff-brand flex items-center gap-2 font-heading text-lg font-bold text-primary"
          >
            <BrandMark className="size-8" />
            <span>Olmosq Staff</span>
          </Link>
          <nav className="staff-nav flex items-center gap-1 overflow-x-auto">
            <StaffNavLinks />
          </nav>
          <StaffPushAlerts />
          <form action={logoutStaffAction} className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="staff-logout-button">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="staff-main mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
