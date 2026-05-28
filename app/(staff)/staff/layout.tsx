import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { StaffNavLinks } from "@/components/staff/staff-nav-link";
import { ShiftControl } from "@/components/staff/shift-control";
import { prisma } from "@/lib/db";
import { calculateCashDrawerTotals } from "@/lib/payments/cash-drawer";
import { getCurrentShift } from "@/lib/shifts/current-shift";

export default async function StaffNavLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shift = await getCurrentShift();
  const expectedCash = shift
    ? calculateCashDrawerTotals({
        startingCash: Number(shift.startingCash),
        orders: (
          await prisma.order.findMany({
            where: { shiftId: shift.id },
            include: { paymentType: true },
          })
        ).map((order) => ({
          status: order.status,
          total: Number(order.total),
          cashReceived:
            order.cashReceived === null ? null : Number(order.cashReceived),
          cashChange:
            order.cashChange === null ? null : Number(order.cashChange),
          paymentType: order.paymentType,
        })),
        movements: (
          await prisma.cashMovement.findMany({
            where: { shiftId: shift.id },
            select: { type: true, amount: true },
          })
        ).map((movement) => ({
          type: movement.type,
          amount: Number(movement.amount),
        })),
      }).expectedCash
    : 0;
  const headerShift = shift
    ? {
        id: shift.id,
        shiftNumber: shift.shiftNumber,
        openedAt: shift.openedAt.toISOString(),
        expectedCash,
      }
    : null;

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
          <ShiftControl shift={headerShift} />
        </div>
      </header>
      <main className="staff-main mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
