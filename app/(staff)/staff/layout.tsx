import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { StaffNavLinks } from "@/components/staff/staff-nav-link";

export default function StaffNavLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap md:gap-6">
          <Link
            href="/staff/orders"
            className="flex items-center gap-2 font-heading text-lg font-bold text-primary"
          >
            <BrandMark className="size-8" />
            Olmosq Staff
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            <StaffNavLinks />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
