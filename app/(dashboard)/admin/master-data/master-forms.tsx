"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/actions/state";
import type { MasterResource } from "@/lib/master-data/config";
import { createMasterAction, reactivateMasterAction, removeMasterAction, updateMasterAction } from "./actions";

type ProvinceOption = { id: string; name: string };
type MasterRow = { id: string; code: string; name: string; isActive: boolean; isProtected: boolean; provinceId?: string; address?: string };

function Result({ state }: { state: typeof initialActionState }) {
  return state.status === "idle" ? null : <p className={state.status === "error" ? "form-error" : "text-sm font-semibold text-emerald-700"} role="status">{state.message}</p>;
}

export function MasterCreateForm({ resource, provinces }: { resource: MasterResource; provinces: ProvinceOption[] }) {
  const action = createMasterAction.bind(null, resource);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  return (
    <form action={formAction} className="form-grid">
      <div><label className="label" htmlFor="new-code">Code</label><input className="input" id="new-code" name="code" required maxLength={40} /></div>
      <div><label className="label" htmlFor="new-name">Name</label><input className="input" id="new-name" name="name" required maxLength={120} /></div>
      {resource === "branches" ? <><div><label className="label" htmlFor="new-province">Province</label><select className="select" id="new-province" name="provinceId" required><option value="">Select province</option>{provinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}</select></div><div><label className="label" htmlFor="new-address">Address</label><input className="input" id="new-address" name="address" required maxLength={240} /></div></> : null}
      <div className="flex items-center gap-3"><button className="button button-primary" disabled={pending} type="submit">{pending ? "Creating…" : "Create record"}</button></div>
      <Result state={state} />
    </form>
  );
}

export function MasterRowForm({ resource, row, provinces }: { resource: MasterResource; row: MasterRow; provinces: ProvinceOption[] }) {
  const update = updateMasterAction.bind(null, resource);
  const remove = removeMasterAction.bind(null, resource);
  const reactivate = reactivateMasterAction.bind(null, resource);
  const [updateState, updateAction, updating] = useActionState(update, initialActionState);
  const [removeState, removeAction, removing] = useActionState(remove, initialActionState);
  const [reactivateState, reactivateAction, reactivating] = useActionState(reactivate, initialActionState);
  return (
    <article className="border-b border-slate-200 p-4 last:border-0">
      <form action={updateAction} className="form-grid">
        <input type="hidden" name="id" value={row.id} />
        <div><label className="label" htmlFor={`code-${row.id}`}>Code</label><input className="input" id={`code-${row.id}`} name="code" defaultValue={row.code} readOnly={row.isProtected} /></div>
        <div><label className="label" htmlFor={`name-${row.id}`}>Name</label><input className="input" id={`name-${row.id}`} name="name" defaultValue={row.name} required /></div>
        {resource === "branches" ? <><div><label className="label" htmlFor={`province-${row.id}`}>Province</label><select className="select" id={`province-${row.id}`} name="provinceId" defaultValue={row.provinceId} required>{provinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}</select></div><div><label className="label" htmlFor={`address-${row.id}`}>Address</label><input className="input" id={`address-${row.id}`} name="address" defaultValue={row.address} required /></div></> : null}
        <div className="flex flex-wrap items-center gap-2"><button className="button button-secondary" disabled={updating} type="submit">Save</button><span className={`badge ${row.isActive ? "badge-active" : "badge-inactive"}`}>{row.isActive ? "Active" : "Inactive"}</span>{row.isProtected ? <span className="badge badge-inactive">Protected code</span> : null}</div>
        <Result state={updateState} />
      </form>
      {!row.isProtected ? row.isActive ? <form action={removeAction} className="mt-3 flex items-center gap-3"><input type="hidden" name="id" value={row.id} /><button className="button button-danger" disabled={removing} type="submit">Remove or deactivate</button><Result state={removeState} /></form> : <form action={reactivateAction} className="mt-3 flex items-center gap-3"><input type="hidden" name="id" value={row.id} /><button className="button button-secondary" disabled={reactivating} type="submit">Reactivate</button><Result state={reactivateState} /></form> : null}
    </article>
  );
}
