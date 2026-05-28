"use client";

import { QRCodeDisplay } from "@/components/staff/qr-code-display";

interface TableData {
  code: string;
  number: number;
  name: string | null;
  isActive: boolean;
  qrDataUrl: string;
}

export function TablesPageClient({ tables }: { tables: TableData[] }) {
  return (
    <div className="staff-page space-y-6">
      <div className="staff-page-header">
        <h1 className="staff-page-title font-heading text-3xl font-bold">
          Tables & QR Codes
        </h1>
        <p className="staff-page-subtitle text-muted-foreground">
          Scan the QR codes to open the ordering page for each table.
        </p>
      </div>

      {tables.length === 0 ? (
        <p className="staff-empty-state py-12 text-center text-muted-foreground">
          No tables found. Run the seed script to create tables.
        </p>
      ) : (
        <div className="staff-table-grid grid gap-4 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
          {tables.map((table) => (
            <QRCodeDisplay
              key={table.code}
              tableCode={table.code}
              tableNumber={table.number}
              tableName={table.name}
              qrDataUrl={table.qrDataUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
