import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if ((await auth())?.user) redirect("/dashboard");
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">DL</div>
        <p className="eyebrow">Driver Licensing Management System</p>
        <h1 id="login-title" className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Welcome back</h1>
        <p className="mt-2 mb-8 text-sm leading-6 text-slate-600">Sign in with your assigned staff account.</p>
        <LoginForm />
      </section>
    </main>
  );
}
