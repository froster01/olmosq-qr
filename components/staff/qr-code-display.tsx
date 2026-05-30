"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Copy, Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface QRCodeDisplayProps {
  tableCode: string;
  tableNumber: number;
  tableName: string | null;
  isActive: boolean;
  orderingUrl: string;
  qrDataUrl: string;
}

export function QRCodeDisplay({
  tableCode,
  tableNumber,
  tableName,
  isActive,
  orderingUrl,
  qrDataUrl,
}: QRCodeDisplayProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const link = document.createElement("a");
      link.download = `qr-table-${tableCode}.png`;
      link.href = qrDataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(orderingUrl);
      setCopied(true);
      toast.success("Ordering link copied");
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Could not copy ordering link");
    }
  }

  return (
    <div className="grid gap-3 px-4 py-3 transition-colors hover:bg-muted/25 md:grid-cols-[minmax(12rem,1fr)_minmax(7rem,0.55fr)_minmax(15rem,1.1fr)_auto] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-sm font-bold text-primary">
          {tableNumber}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-base font-bold">
              Table {tableNumber}
            </p>
            <Badge
              variant={isActive ? "default" : "outline"}
              className={
                isActive
                  ? "bg-accent/35 text-accent-foreground"
                  : "text-muted-foreground"
              }
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {tableName && <span className="truncate">{tableName}</span>}
            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
              {tableCode}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-2">
        <div className="staff-qr-frame rounded-lg border bg-[oklch(0.998_0.003_63)] p-2 shadow-sm">
          <Image
            src={qrDataUrl}
            alt={`QR Code for Table ${tableNumber}`}
            width={96}
            height={96}
            unoptimized
            className="staff-qr-image size-24"
          />
        </div>
        <div className="md:hidden">
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
            QR code
          </p>
          <p className="text-sm text-muted-foreground">Ready to print</p>
        </div>
      </div>

      <div className="min-w-0 rounded-lg bg-muted/35 px-3 py-2 md:bg-transparent md:px-0 md:py-0">
        <p className="truncate font-mono text-xs text-muted-foreground">
          {orderingUrl}
        </p>
      </div>

      <div className="flex items-center gap-2 md:justify-end">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={orderingUrl} target="_blank" rel="noreferrer" />}
        >
          <ExternalLink className="h-4 w-4" />
          Open
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleCopy}
          aria-label="Copy ordering link"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">
            {downloading ? "Downloading" : "PNG"}
          </span>
        </Button>
      </div>
    </div>
  );
}
