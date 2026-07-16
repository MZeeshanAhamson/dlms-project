"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/actions/state";
import { createFeeAction, createPolicyAction } from "./actions";

type Option = { id: string; name: string };
function Result({ state }: { state: typeof initialActionState }) { return state.status === "idle" ? null : <p className={state.status === "error" ? "form-error" : "text-sm font-semibold text-emerald-700"} role="status">{state.message}</p>; }

export function PolicyForm() {
  const [state, action, pending] = useActionState(createPolicyAction, initialActionState);
  return <form action={action} className="form-grid"><div><label className="label">Permanent eligibility days</label><input className="input" name="permanentEligibilityDays" type="number" defaultValue="42" min="0" required /></div><div><label className="label">Learner validity months</label><input className="input" name="learnerValidityMonths" type="number" defaultValue="6" min="1" required /></div><div><label className="label">Permanent validity months</label><input className="input" name="permanentValidityMonths" type="number" defaultValue="60" min="1" required /></div><div><label className="label">International validity months</label><input className="input" name="internationalValidityMonths" type="number" defaultValue="12" min="1" required /></div><div><label className="label">Computer pass percentage</label><input className="input" name="computerPassPercentage" type="number" defaultValue="80" min="1" max="100" required /></div><div><label className="label">Effective from</label><input className="input" name="effectiveFrom" type="date" required /></div><button className="button button-primary" disabled={pending}>Add policy version</button><Result state={state} /></form>;
}

export function FeeForm({ types, categories }: { types: Option[]; categories: Option[] }) {
  const [state, action, pending] = useActionState(createFeeAction, initialActionState);
  return <form action={action} className="form-grid"><div><label className="label">Application type</label><select className="select" name="applicationTypeId" required><option value="">Select type</option>{types.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div><label className="label">License category</label><select className="select" name="licenseCategoryId" required><option value="">Select category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div><label className="label">Amount (PKR)</label><input className="input" name="amount" type="number" min="1" step="0.01" required /></div><div><label className="label">Effective from</label><input className="input" name="effectiveFrom" type="date" required /></div><button className="button button-primary" disabled={pending}>Add fee version</button><Result state={state} /></form>;
}
