"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  EyeOff,
  RotateCcw,
  Thermometer,
} from "lucide-react";
import {
  moveCategoryAction,
  updateCategoryTemperatureAction,
  updateCategoryVisibilityAction,
} from "@/app/actions/categories";
import {
  resetMenuAction,
  resetPaymentTypesAction,
  syncMenuAction,
  syncPaymentTypesAction,
} from "@/app/actions/loyverse";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { moveCategoryInOrder } from "@/lib/menu/category-sort";

type SyncStatus = "idle" | "loading" | "success" | "error";

interface MenuSettingsCategory {
  id: string;
  name: string;
  sortOrder: number;
  asksTemperature: boolean;
  isVisibleInMenu: boolean;
  _count: { items: number };
}

export function MenuSettingsClient({
  categories,
}: {
  categories: MenuSettingsCategory[];
}) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [pendingSetting, setPendingSetting] = useState<
    "temperature" | "visibility" | "order" | null
  >(null);
  const [menuStatus, setMenuStatus] = useState<SyncStatus>("idle");
  const [paymentStatus, setPaymentStatus] = useState<SyncStatus>("idle");
  const [resetMenuStatus, setResetMenuStatus] = useState<SyncStatus>("idle");
  const [resetPaymentStatus, setResetPaymentStatus] =
    useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSyncMenu() {
    setMenuStatus("loading");
    setSyncMessage("");
    const result = await syncMenuAction();
    if (result.success && result.data) {
      setMenuStatus("success");
      setSyncMessage(
        `${result.data.categories} categories, ${result.data.items} items synced.`
      );
      toast.success("Menu synced from Loyverse.");
    } else {
      setMenuStatus("error");
      setSyncMessage(result.error || "Menu sync failed.");
      toast.error(result.error || "Menu sync failed.");
    }
  }

  async function handleSyncPayments() {
    setPaymentStatus("loading");
    setSyncMessage("");
    const result = await syncPaymentTypesAction();
    if (result.success && result.data) {
      setPaymentStatus("success");
      setSyncMessage(`${result.data.paymentTypes} payment types synced.`);
      toast.success("Payment types synced.");
    } else {
      setPaymentStatus("error");
      setSyncMessage(result.error || "Payment sync failed.");
      toast.error(result.error || "Payment sync failed.");
    }
  }

  async function handleResetMenu() {
    setResetMenuStatus("loading");
    setSyncMessage("");
    const result = await resetMenuAction();
    if (result.success && result.data) {
      setResetMenuStatus("success");
      setSyncMessage(`${result.data.deleted} menu items deleted.`);
      toast.success("Local menu reset.");
    } else {
      setResetMenuStatus("error");
      setSyncMessage(result.error || "Menu reset failed.");
      toast.error(result.error || "Menu reset failed.");
    }
  }

  async function handleResetPaymentTypes() {
    setResetPaymentStatus("loading");
    setSyncMessage("");
    const result = await resetPaymentTypesAction();
    if (result.success && result.data) {
      setResetPaymentStatus("success");
      setSyncMessage(`${result.data.deleted} payment types deleted.`);
      toast.success("Payment types reset.");
    } else {
      setResetPaymentStatus("error");
      setSyncMessage(result.error || "Payment reset failed.");
      toast.error(result.error || "Payment reset failed.");
    }
  }

  function toggleTemperature(category: MenuSettingsCategory) {
    const nextValue = !category.asksTemperature;
    setPendingCategoryId(category.id);
    setPendingSetting("temperature");

    startTransition(async () => {
      const result = await updateCategoryTemperatureAction({
        categoryId: category.id,
        asksTemperature: nextValue,
      });

      if (result.success) {
        setLocalCategories((current) =>
          current.map((item) =>
            item.id === category.id
              ? { ...item, asksTemperature: nextValue }
              : item
          )
        );
        toast.success(
          `${category.name} ${
            nextValue ? "will ask" : "will not ask"
          } for temperature.`
        );
      } else {
        toast.error(result.error);
      }

      setPendingCategoryId(null);
      setPendingSetting(null);
    });
  }

  function toggleVisibility(category: MenuSettingsCategory) {
    const nextValue = !category.isVisibleInMenu;
    setPendingCategoryId(category.id);
    setPendingSetting("visibility");

    startTransition(async () => {
      const result = await updateCategoryVisibilityAction({
        categoryId: category.id,
        isVisibleInMenu: nextValue,
      });

      if (result.success) {
        setLocalCategories((current) =>
          current.map((item) =>
            item.id === category.id
              ? { ...item, isVisibleInMenu: nextValue }
              : item
          )
        );
        toast.success(
          `${category.name} is now ${
            nextValue ? "shown on" : "hidden from"
          } the customer menu.`
        );
      } else {
        toast.error(result.error);
      }

      setPendingCategoryId(null);
      setPendingSetting(null);
    });
  }

  function moveCategory(
    category: MenuSettingsCategory,
    direction: "up" | "down"
  ) {
    setPendingCategoryId(category.id);
    setPendingSetting("order");

    startTransition(async () => {
      const result = await moveCategoryAction({
        categoryId: category.id,
        direction,
      });

      if (result.success) {
        setLocalCategories((current) =>
          moveCategoryInOrder(current, category.id, direction)
        );
      } else {
        toast.error(result.error);
      }

      setPendingCategoryId(null);
      setPendingSetting(null);
    });
  }

  return (
    <div className="staff-page space-y-4">
      <div className="staff-page-header flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="staff-page-title font-heading text-2xl font-bold">
            Menu
          </h1>
          <p className="staff-page-subtitle text-muted-foreground">
            Sync Loyverse data and manage customer category options.
          </p>
        </div>
        <Badge variant="outline">
          {localCategories.length} categories
        </Badge>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="grid gap-3 p-4 md:grid-cols-[minmax(12rem,1fr)_auto] md:items-center">
          <div>
            <h2 className="text-sm font-semibold">Loyverse sync</h2>
            <p className="text-xs text-muted-foreground">
              Refresh menu, variants, modifiers, and payment types from POS.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              type="button"
              size="sm"
              onClick={handleSyncMenu}
              disabled={menuStatus === "loading"}
            >
              <Download className="h-4 w-4" />
              {menuStatus === "loading" ? "Syncing" : "Sync menu"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSyncPayments}
              disabled={paymentStatus === "loading"}
            >
              <Download className="h-4 w-4" />
              {paymentStatus === "loading" ? "Syncing" : "Payments"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleResetMenu}
              disabled={resetMenuStatus === "loading"}
            >
              <RotateCcw className="h-4 w-4" />
              {resetMenuStatus === "loading" ? "Resetting" : "Reset menu"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleResetPaymentTypes}
              disabled={resetPaymentStatus === "loading"}
            >
              <RotateCcw className="h-4 w-4" />
              {resetPaymentStatus === "loading"
                ? "Resetting"
                : "Reset payments"}
            </Button>
          </div>
        </div>
        {syncMessage && (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            {syncMessage}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="hidden grid-cols-[minmax(14rem,1fr)_6rem_9rem_10rem_10rem] items-center gap-3 border-b bg-muted/30 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground md:grid">
          <span>Category</span>
          <span className="text-center">Order</span>
          <span>Status</span>
          <span className="text-center">Menu</span>
          <span className="text-center">Temperature</span>
        </div>
        <div className="divide-y">
          {localCategories.map((category, index) => {
            const isFirst = index === 0;
            const isLast = index === localCategories.length - 1;
            const orderDisabled =
              isPending &&
              pendingCategoryId === category.id &&
              pendingSetting === "order";
            const temperatureDisabled =
              isPending &&
              pendingCategoryId === category.id &&
              pendingSetting === "temperature";
            const visibilityDisabled =
              isPending &&
              pendingCategoryId === category.id &&
              pendingSetting === "visibility";

            return (
              <div
                key={category.id}
                className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(14rem,1fr)_6rem_9rem_10rem_10rem] md:items-center"
              >
                <div className="flex items-center justify-between gap-3 md:block">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                      {category.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {category._count.items}{" "}
                      {category._count.items === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1 md:hidden">
                    <CategoryBadges category={category} />
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Move ${category.name} up`}
                    disabled={orderDisabled || isFirst}
                    onClick={() => moveCategory(category, "up")}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Move ${category.name} down`}
                    disabled={orderDisabled || isLast}
                    onClick={() => moveCategory(category, "down")}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>

                <div className="hidden gap-1 md:flex">
                  <CategoryBadges category={category} />
                </div>

                <div className="grid grid-cols-2 gap-2 md:block">
                  <Button
                    type="button"
                    variant={category.isVisibleInMenu ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    disabled={visibilityDisabled}
                    onClick={() => toggleVisibility(category)}
                  >
                    {category.isVisibleInMenu ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                    {category.isVisibleInMenu ? "Shown" : "Hidden"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 md:block">
                  <Button
                    type="button"
                    variant={category.asksTemperature ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    disabled={temperatureDisabled}
                    onClick={() => toggleTemperature(category)}
                  >
                    <Thermometer className="h-4 w-4" />
                    {category.asksTemperature ? "Hot / Cold" : "No temp"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CategoryBadges({ category }: { category: MenuSettingsCategory }) {
  return (
    <>
      <Badge variant={category.isVisibleInMenu ? "default" : "secondary"}>
        {category.isVisibleInMenu ? "Visible" : "Hidden"}
      </Badge>
      <Badge variant={category.asksTemperature ? "outline" : "secondary"}>
        {category.asksTemperature ? "Temp" : "No temp"}
      </Badge>
    </>
  );
}
