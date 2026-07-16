"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/actions/state";
import { roleValues, type Role } from "@/lib/db/schema";
import { createUserAction, resetPasswordAction, toggleUserAction, updateUserAction } from "./actions";

type BranchOption = { id: string; name: string };
type UserView = { id: string; name: string; email: string; role: Role; branchId: string | null; isActive: boolean };
const roleLabel: Record<Role, string> = { ADMIN: "Administrator", DATA_ENTRY_OPERATOR: "Data Entry Operator", PAYMENT_OFFICER: "Payment Officer", LICENSE_OFFICER: "License Officer", EXAMINER: "Examiner" };

function Result({ state }: { state: typeof initialActionState }) {
  return state.status === "idle" ? null : <p className={state.status === "error" ? "form-error" : "text-sm font-semibold text-emerald-700"} role="status">{state.message}</p>;
}

function RoleFields({ branches, defaultRole, defaultBranch }: { branches: BranchOption[]; defaultRole?: Role; defaultBranch?: string | null }) {
  return <><div><label className="label">Role</label><select className="select" name="role" defaultValue={defaultRole ?? "DATA_ENTRY_OPERATOR"}>{roleValues.map((role) => <option key={role} value={role}>{roleLabel[role]}</option>)}</select></div><div><label className="label">Branch (required for specialists)</label><select className="select" name="branchId" defaultValue={defaultBranch ?? ""}><option value="">No branch / Administrator</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></div></>;
}

export function CreateUserForm({ branches }: { branches: BranchOption[] }) {
  const [state, action, pending] = useActionState(createUserAction, initialActionState);
  return <form action={action} className="form-grid"><div><label className="label">Full name</label><input className="input" name="name" required /></div><div><label className="label">Email</label><input className="input" name="email" type="email" required /></div><RoleFields branches={branches} /><div><label className="label">Temporary password</label><input className="input" name="password" type="password" minLength={12} required /></div><div className="flex items-end"><button className="button button-primary" disabled={pending}>Create user</button></div><Result state={state} /></form>;
}

export function UserRowForm({ user, branches }: { user: UserView; branches: BranchOption[] }) {
  const [updateState, updateAction, updating] = useActionState(updateUserAction, initialActionState);
  const [toggleState, toggleAction, toggling] = useActionState(toggleUserAction, initialActionState);
  const [passwordState, passwordAction, resetting] = useActionState(resetPasswordAction, initialActionState);
  return <article className="border-b border-slate-200 p-4 last:border-0"><form action={updateAction} className="form-grid"><input type="hidden" name="id" value={user.id} /><div><label className="label">Full name</label><input className="input" name="name" defaultValue={user.name} required /></div><div><label className="label">Email</label><input className="input" name="email" type="email" defaultValue={user.email} required /></div><RoleFields branches={branches} defaultRole={user.role} defaultBranch={user.branchId} /><div className="flex items-center gap-3"><button className="button button-secondary" disabled={updating}>Save user</button><span className={`badge ${user.isActive ? "badge-active" : "badge-inactive"}`}>{user.isActive ? "Active" : "Inactive"}</span></div><Result state={updateState} /></form><div className="mt-4 grid gap-3 md:grid-cols-2"><form action={passwordAction} className="flex items-end gap-2"><input type="hidden" name="id" value={user.id} /><div className="grow"><label className="label">New password</label><input className="input" name="password" type="password" minLength={12} required /></div><button className="button button-secondary" disabled={resetting}>Reset</button></form><form action={toggleAction} className="flex items-end gap-3"><input type="hidden" name="id" value={user.id} /><button className={user.isActive ? "button button-danger" : "button button-secondary"} disabled={toggling}>{user.isActive ? "Deactivate user" : "Reactivate user"}</button></form></div><Result state={passwordState.status !== "idle" ? passwordState : toggleState} /></article>;
}
