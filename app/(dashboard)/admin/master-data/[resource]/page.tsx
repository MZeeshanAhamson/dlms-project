import Link from "next/link";
import { asc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db";
import { branches, provinces } from "@/lib/db/schema";
import { isMasterResource, masterNavigation, masterResources } from "@/lib/master-data/config";
import { MasterCreateForm, MasterRowForm } from "../master-forms";

export default async function MasterDataPage({ params }: { params: Promise<{ resource: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/forbidden");
  const { resource } = await params;
  if (!isMasterResource(resource)) notFound();
  const database = getDatabase();
  const provinceRows = await database.select({ id: provinces.id, name: provinces.name }).from(provinces).orderBy(asc(provinces.name));
  const rows = resource === "branches"
    ? await database.select().from(branches).orderBy(asc(branches.name))
    : await database.select().from(masterResources[resource].table).orderBy(asc(masterResources[resource].table.name));
  const label = resource === "branches" ? "Branches" : masterResources[resource].label;

  return (
    <div>
      <div className="page-heading"><div><p className="eyebrow">Administration</p><h1>{label}</h1><p>Maintain active options while preserving referenced history.</p></div></div>
      <nav className="mb-5 flex gap-2 overflow-x-auto pb-2" aria-label="Master data sections">{masterNavigation.map((item) => <Link className={`button ${item.resource === resource ? "button-primary" : "button-secondary"}`} key={item.resource} href={`/admin/master-data/${item.resource}`}>{item.label}</Link>)}</nav>
      <section className="panel mb-6"><div className="panel-header"><h2 className="font-bold text-slate-900">Add {label.toLowerCase()}</h2></div><div className="panel-body"><MasterCreateForm resource={resource} provinces={provinceRows} /></div></section>
      <section className="panel"><div className="panel-header"><h2 className="font-bold text-slate-900">Existing records</h2><span className="badge badge-inactive">{rows.length} total</span></div>{rows.length ? rows.map((row) => { const branch = resource === "branches" ? row as typeof branches.$inferSelect : null; return <MasterRowForm key={row.id} resource={resource} provinces={provinceRows} row={{ id: row.id, code: row.code, name: row.name, isActive: row.isActive, isProtected: row.isProtected, provinceId: branch?.provinceId, address: branch?.address }} />; }) : <p className="panel-body text-sm text-slate-500">No records yet.</p>}</section>
    </div>
  );
}
