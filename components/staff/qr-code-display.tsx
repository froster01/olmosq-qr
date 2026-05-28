"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QRCodeDisplayProps {
  tableCode: string;
  tableNumber: number;
  tableName: string | null;
  qrDataUrl: string;
}

export function QRCodeDisplay({
  tableCode,
  tableNumber,
  tableName,
  qrDataUrl,
}: QRCodeDisplayProps) {
  const [downloading, setDownloading] = useState(false);

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

  return (
    <Card className="staff-qr-card transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(51,51,51,0.08)]">
      <CardContent className="staff-qr-card-content flex flex-col items-center gap-4 pt-6">
        <div className="text-center">
          <p className="font-heading text-xl font-bold">Table {tableNumber}</p>
          {tableName && (
            <p className="text-sm text-muted-foreground">{tableName}</p>
          )}
          <p className="mt-1 inline-flex rounded-full bg-accent/35 px-3 py-1 text-xs font-semibold text-accent-foreground">
            {tableCode}
          </p>
        </div>
        <div className="staff-qr-frame rounded-2xl border bg-white p-3 shadow-sm">
          <Image
            src={qrDataUrl}
            alt={`QR Code for Table ${tableNumber}`}
            width={192}
            height={192}
            unoptimized
            className="staff-qr-image h-48 w-48"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleDownload}
          disabled={downloading}
        >
          Download PNG
        </Button>
      </CardContent>
    </Card>
  );
}
