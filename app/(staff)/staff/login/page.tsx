import { BrandMark } from "@/components/brand-mark";
import { getSafeStaffNextPath } from "@/lib/staff-auth/paths";
import { StaffLoginForm } from "./staff-login-form";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function StaffLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next ?? null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-[0_12px_30px_rgba(51,51,51,0.08)]">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark className="size-10" />
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              Olmosq Staff
            </p>
            <h1 className="font-heading text-2xl font-bold">Sign in</h1>
          </div>
        </div>
        <StaffLoginForm next={getSafeStaffNextPath(next)} />
      </section>
    </main>
  );
}
