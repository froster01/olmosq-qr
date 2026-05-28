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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tables & QR Codes</h1>
        <p className="text-muted-foreground">
          Scan the QR codes to open the ordering page for each table.
        </p>
      </div>

      {tables.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No tables found. Run the seed script to create tables.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
