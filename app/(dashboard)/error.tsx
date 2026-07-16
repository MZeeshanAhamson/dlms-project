"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="panel panel-body"><p className="eyebrow">Something went wrong</p><h1 className="mt-2 text-2xl font-bold text-slate-950">The requested information could not be loaded</h1><p className="mt-2 text-sm text-slate-600">Try the request again. If it keeps failing, contact the system administrator.</p><button className="button button-primary mt-5" onClick={reset}>Try again</button></section>;
}
