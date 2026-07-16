import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db";
import { branches, users } from "@/lib/db/schema";
import { CreateUserForm, UserRowForm } from "./user-forms";

export default async function UsersPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.role !== "ADMIN") redirect("/forbidden");
  const database = getDatabase();
  const [userRows, branchRows] = await Promise.all([
    database.select().from(users).orderBy(asc(users.name)),
    database.select({ id: branches.id, name: branches.name }).from(branches).where(eq(branches.isActive, true)).orderBy(asc(branches.name)),
  ]);
  return <div><div className="page-heading"><div><p className="eyebrow">Administration</p><h1>Users and access</h1><p>Assign one operational role and branch to each specialist account.</p></div></div><section className="panel mb-6"><div className="panel-header"><h2 className="font-bold text-slate-900">Create user</h2></div><div className="panel-body"><CreateUserForm branches={branchRows} /></div></section><section className="panel"><div className="panel-header"><h2 className="font-bold text-slate-900">Staff accounts</h2><span className="badge badge-inactive">{userRows.length} total</span></div>{userRows.map((user) => <UserRowForm key={user.id} branches={branchRows} user={{ id: user.id, name: user.name, email: user.email, role: user.role, branchId: user.branchId, isActive: user.isActive }} />)}</section></div>;
}
