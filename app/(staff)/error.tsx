"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StaffError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Link href="/staff/orders">
            <Button variant="outline">Back to Orders</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
