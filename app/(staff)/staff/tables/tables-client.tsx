"use client";

import { QRCodeDisplay } from "@/components/staff/qr-code-display";

interface TableData {
  code: string;
  number: number;
  name: string | null;
  isActive: boolean;
  orderingUrl: string;
  qrDataUrl: string;
}

export function TablesPageClient({ tables }: { tables: TableData[] }) {
  const activeTables = tables.filter((table) => table.isActive).length;

  return (
    <div className="staff-page space-y-4">
      <div className="staff-page-header flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="staff-page-title font-heading text-2xl font-bold">
            Tables & QR Codes
          </h1>
          <p className="staff-page-subtitle text-muted-foreground">
            Print, test, or download the ordering QR for each table.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full border bg-card px-3 py-1 font-semibold">
            {tables.length} tables
          </span>
          <span className="rounded-full bg-accent/35 px-3 py-1 font-semibold text-accent-foreground">
            {activeTables} active
          </span>
        </div>
      </div>

      {tables.length === 0 ? (
        <p className="staff-empty-state rounded-xl border bg-card py-12 text-center text-muted-foreground">
          No tables found. Run the seed script to create tables.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-[0_8px_24px_rgba(51,51,51,0.05)]">
          <div className="hidden grid-cols-[minmax(12rem,1fr)_minmax(7rem,0.55fr)_minmax(15rem,1.1fr)_auto] items-center gap-3 border-b bg-muted/45 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground md:grid">
            <span>Table</span>
            <span>QR</span>
            <span>Ordering link</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y">
            {tables.map((table) => (
              <QRCodeDisplay
                key={table.code}
                tableCode={table.code}
                tableNumber={table.number}
                tableName={table.name}
                isActive={table.isActive}
                orderingUrl={table.orderingUrl}
                qrDataUrl={table.qrDataUrl}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
