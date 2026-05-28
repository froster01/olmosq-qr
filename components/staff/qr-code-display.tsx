"use client";

import { useState } from "react";
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
    <Card>
      <CardContent className="pt-6 flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="font-semibold">Table {tableNumber}</p>
          {tableName && (
            <p className="text-sm text-muted-foreground">{tableName}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{tableCode}</p>
        </div>
        <img
          src={qrDataUrl}
          alt={`QR Code for Table ${tableNumber}`}
          className="w-48 h-48"
        />
        <Button
          size="sm"
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
