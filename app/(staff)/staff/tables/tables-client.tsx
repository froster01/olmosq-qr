"use client";

import { FormEvent, useState, useTransition } from "react";
import { Plus, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { generateTablesForQrAction } from "@/app/actions/tables";
import { QRCodeDisplay } from "@/components/staff/qr-code-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TableData {
  code: string;
  number: number;
  name: string | null;
  isActive: boolean;
  orderingUrl: string;
  qrDataUrl: string;
}

export function TablesPageClient({ tables }: { tables: TableData[] }) {
  const router = useRouter();
  const activeTables = tables.filter((table) => table.isActive).length;
  const [pending, startTransition] = useTransition();
  const [count, setCount] = useState(
    tables.length > 0 ? String(tables.length) : "10"
  );
  const [message, setMessage] = useState("");

  function handleGenerateTables(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const desiredCount = Number(count);

    startTransition(async () => {
      const result = await generateTablesForQrAction({ count: desiredCount });
      if (!result.success) {
        setMessage(result.error ?? "Could not generate table QR codes.");
        return;
      }

      const created = result.data?.createdCount ?? 0;
      const desiredTotal = result.data?.desiredTotal ?? desiredCount;
      setMessage(
        created === 0
          ? `${desiredTotal} table QR codes are already ready.`
          : `Generated ${created} table QR code${created === 1 ? "" : "s"}.`
      );
      router.refresh();
    });
  }

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
        <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
          <form
            onSubmit={handleGenerateTables}
            className="flex min-w-0 items-center gap-2 rounded-2xl border bg-card p-1.5 shadow-[0_6px_20px_rgba(51,51,51,0.04)]"
          >
            <label className="flex min-w-0 items-center gap-2 pl-2 text-sm font-semibold text-muted-foreground">
              <QrCode className="size-4 text-primary" />
              <span className="hidden sm:inline">QR count</span>
            </label>
            <Input
              type="number"
              min={1}
              max={200}
              step={1}
              value={count}
              onChange={(event) => setCount(event.target.value)}
              className="h-9 w-20 rounded-xl text-center font-semibold"
              aria-label="Number of table QR codes to generate"
            />
            <Button type="submit" size="sm" disabled={pending}>
              <Plus className="size-4" />
              {pending ? "Generating" : "Generate"}
            </Button>
          </form>
          <div className="flex items-center gap-2">
            <span className="rounded-full border bg-card px-3 py-1 font-semibold">
              {tables.length} tables
            </span>
            <span className="rounded-full bg-accent/35 px-3 py-1 font-semibold text-accent-foreground">
              {activeTables} active
            </span>
          </div>
        </div>
      </div>

      {message && (
        <p className="rounded-xl border bg-card px-4 py-3 text-sm font-medium text-muted-foreground">
          {message}
        </p>
      )}

      {tables.length === 0 ? (
        <div className="staff-empty-state rounded-xl border bg-card px-5 py-12 text-center text-muted-foreground">
          <QrCode className="mx-auto mb-3 size-8 text-primary" />
          <p className="font-heading text-lg font-bold text-foreground">
            No table QR codes yet
          </p>
          <p className="mx-auto mt-1 max-w-md">
            Enter how many table QR codes you need, then generate them here.
          </p>
        </div>
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
