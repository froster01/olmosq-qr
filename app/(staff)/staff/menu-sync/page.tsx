"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { syncMenuAction, syncPaymentTypesAction } from "@/app/actions/loyverse";

type SyncStatus = "idle" | "loading" | "success" | "error";

export default function MenuSyncPage() {
  const [menuStatus, setMenuStatus] = useState<SyncStatus>("idle");
  const [paymentStatus, setPaymentStatus] = useState<SyncStatus>("idle");
  const [menuResult, setMenuResult] = useState<string>("");
  const [paymentResult, setPaymentResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function handleSyncMenu() {
    setMenuStatus("loading");
    setError("");
    const result = await syncMenuAction();
    if (result.success && result.data) {
      setMenuStatus("success");
      setMenuResult(
        `${result.data.categories} categories, ${result.data.items} items synced`
      );
    } else {
      setMenuStatus("error");
      setError(result.error || "Sync failed");
    }
  }

  async function handleSyncPayments() {
    setPaymentStatus("loading");
    setError("");
    const result = await syncPaymentTypesAction();
    if (result.success && result.data) {
      setPaymentStatus("success");
      setPaymentResult(`${result.data.paymentTypes} payment types synced`);
    } else {
      setPaymentStatus("error");
      setError(result.error || "Sync failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Menu Sync</h1>
        <p className="text-muted-foreground">
          Sync menu items, categories, and payment types from Loyverse POS.
        </p>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(51,51,51,0.08)]">
          <CardHeader>
            <CardTitle>Menu Items</CardTitle>
            <CardDescription>
              Sync categories, items, variants, and modifiers from Loyverse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleSyncMenu}
              disabled={menuStatus === "loading"}
              className="w-full"
              size="lg"
            >
              {menuStatus === "loading" ? "Syncing..." : "Sync Menu"}
            </Button>
            {menuResult && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={menuStatus === "success" ? "default" : "destructive"}
                >
                  {menuStatus === "success" ? "Success" : "Failed"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {menuResult}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(51,51,51,0.08)]">
          <CardHeader>
            <CardTitle>Payment Types</CardTitle>
            <CardDescription>
              Sync available payment types from Loyverse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleSyncPayments}
              disabled={paymentStatus === "loading"}
              className="w-full"
              size="lg"
            >
              {paymentStatus === "loading" ? "Syncing..." : "Sync Payment Types"}
            </Button>
            {paymentResult && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    paymentStatus === "success" ? "default" : "destructive"
                  }
                >
                  {paymentStatus === "success" ? "Success" : "Failed"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {paymentResult}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
