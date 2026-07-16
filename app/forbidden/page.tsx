import Link from "next/link";

export default function ForbiddenPage() {
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Access denied</p><h1 className="mt-2 text-3xl font-bold">You cannot open this page</h1><p className="mt-3 text-slate-600">Your account does not have the required role or branch access.</p><Link className="button button-primary mt-7" href="/dashboard">Return to dashboard</Link></section></main>;
}
