import Link from "next/link";
import type { UserRecord } from "@/lib/db/schema";
import { logoutAction } from "@/app/(dashboard)/actions";

const roleLabels = { ADMIN: "Administrator", DATA_ENTRY_OPERATOR: "Data Entry", PAYMENT_OFFICER: "Payment Officer", LICENSE_OFFICER: "License Officer", EXAMINER: "Examiner" } as const;

export function DashboardShell({ user, children }: { user: UserRecord; children: React.ReactNode }) {
  const nav = [
    { href: "/dashboard", label: "Overview", visible: true },
    { href: "/applicants", label: "Applicants", visible: user.role === "ADMIN" || user.role === "DATA_ENTRY_OPERATOR" },
    { href: "/admin/master-data/nationalities", label: "Master data", visible: user.role === "ADMIN" },
    { href: "/admin/configuration", label: "Policies & fees", visible: user.role === "ADMIN" },
    { href: "/admin/users", label: "Users", visible: user.role === "ADMIN" },
  ];
  return (
    <div className="dashboard-grid">
      <aside className="sidebar">
        <Link href="/dashboard" className="sidebar-brand"><span>DL</span><strong>DLMS</strong></Link>
        <nav className="nav-list" aria-label="Primary navigation">{nav.filter((item) => item.visible).map((item) => <Link key={item.href} className="nav-link" href={item.href}>{item.label}</Link>)}</nav>
        <div className="sidebar-user"><p className="font-semibold text-white">{user.name}</p><p>{roleLabels[user.role]}</p><form action={logoutAction}><button className="logout-button" type="submit">Sign out</button></form></div>
      </aside>
      <div className="min-w-0"><header className="topbar"><div><p className="eyebrow">Government of Pakistan</p><p className="text-sm font-semibold text-slate-900">Driver Licensing Management System</p></div><span className="status-pill">Secure session</span></header><main className="page-content">{children}</main></div>
    </div>
  );
}
