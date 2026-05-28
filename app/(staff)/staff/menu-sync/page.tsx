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
import {
  syncMenuAction,
  syncPaymentTypesAction,
  resetMenuAction,
  resetPaymentTypesAction,
} from "@/app/actions/loyverse";
import { Download, RotateCcw } from "lucide-react";

type SyncStatus = "idle" | "loading" | "success" | "error";

export default function MenuSyncPage() {
  const [menuStatus, setMenuStatus] = useState<SyncStatus>("idle");
  const [paymentStatus, setPaymentStatus] = useState<SyncStatus>("idle");
  const [resetMenuStatus, setResetMenuStatus] = useState<SyncStatus>("idle");
  const [resetPaymentStatus, setResetPaymentStatus] = useState<SyncStatus>("idle");
  const [menuResult, setMenuResult] = useState<string>("");
  const [paymentResult, setPaymentResult] = useState<string>("");
  const [resetMenuResult, setResetMenuResult] = useState<string>("");
  const [resetPaymentResult, setResetPaymentResult] = useState<string>("");
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

  async function handleResetMenu() {
    setResetMenuStatus("loading");
    setError("");
    const result = await resetMenuAction();
    if (result.success && result.data) {
      setResetMenuStatus("success");
      setResetMenuResult(`${result.data.deleted} items deleted`);
    } else {
      setResetMenuStatus("error");
      setError(result.error || "Reset failed");
    }
  }

  async function handleResetPaymentTypes() {
    setResetPaymentStatus("loading");
    setError("");
    const result = await resetPaymentTypesAction();
    if (result.success && result.data) {
      setResetPaymentStatus("success");
      setResetPaymentResult(`${result.data.deleted} payment types deleted`);
    } else {
      setResetPaymentStatus("error");
      setError(result.error || "Reset failed");
    }
  }

  return (
    <div className="staff-page space-y-6">
      <div className="staff-page-header">
        <h1 className="staff-page-title font-heading text-3xl font-bold">
          Menu Sync
        </h1>
        <p className="staff-page-subtitle text-muted-foreground">
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

      <div className="staff-sync-grid grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(18rem,1fr))]">
        <Card className="staff-sync-card transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(51,51,51,0.08)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Menu Items
            </CardTitle>
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

        <Card className="staff-sync-card transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(51,51,51,0.08)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Payment Types
            </CardTitle>
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

        <Card className="staff-sync-card transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(51,51,51,0.08)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset Menu
            </CardTitle>
            <CardDescription>
              Delete all local menu items and categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleResetMenu}
              disabled={resetMenuStatus === "loading"}
              className="w-full"
              size="lg"
              variant="destructive"
            >
              {resetMenuStatus === "loading" ? "Resetting..." : "Reset Menu"}
            </Button>
            {resetMenuResult && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={resetMenuStatus === "success" ? "default" : "destructive"}
                >
                  {resetMenuStatus === "success" ? "Success" : "Failed"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {resetMenuResult}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="staff-sync-card transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(51,51,51,0.08)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset Payment Types
            </CardTitle>
            <CardDescription>
              Delete all local payment types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleResetPaymentTypes}
              disabled={resetPaymentStatus === "loading"}
              className="w-full"
              size="lg"
              variant="destructive"
            >
              {resetPaymentStatus === "loading" ? "Resetting..." : "Reset Payment Types"}
            </Button>
            {resetPaymentResult && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={resetPaymentStatus === "success" ? "default" : "destructive"}
                >
                  {resetPaymentStatus === "success" ? "Success" : "Failed"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {resetPaymentResult}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
