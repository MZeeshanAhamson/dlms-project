import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { FlashToast } from "@/components/flash-toast";
import { getCurrentUser } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <DashboardShell user={user}><Suspense><FlashToast /></Suspense>{children}</DashboardShell>;
}
