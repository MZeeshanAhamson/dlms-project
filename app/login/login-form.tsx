"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/actions/state";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialActionState);
  return (
    <form action={action} className="space-y-5">
      <div><label className="label" htmlFor="email">Email address</label><input className="input" id="email" name="email" type="email" autoComplete="username" required /></div>
      <div><label className="label" htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required /></div>
      {state.status === "error" ? <p className="form-error" role="alert">{state.message}</p> : null}
      <button className="button button-primary w-full" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
