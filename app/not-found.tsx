import Link from "next/link";

export default function NotFound() {
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">404</p><h1 className="mt-2 text-3xl font-bold">Page not found</h1><p className="mt-3 text-slate-600">The page may have moved or no longer exists.</p><Link className="button button-primary mt-7" href="/dashboard">Return to dashboard</Link></section></main>;
}
