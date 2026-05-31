"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";

import {
  loginStaffAction,
  type StaffLoginState,
} from "@/app/actions/staff-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: StaffLoginState = { error: null };

export function StaffLoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(
    loginStaffAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="staff-username">
          Username
        </label>
        <Input
          id="staff-username"
          name="username"
          autoComplete="username"
          autoFocus
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="staff-password">
          Password
        </label>
        <Input
          id="staff-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error && (
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        <LogIn className="h-4 w-4" />
        {pending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
