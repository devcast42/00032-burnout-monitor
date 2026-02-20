import { requireRole } from "@/lib/auth";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  const user = await requireRole(["admin"]);

  return <AdminDashboard user={user} />;
}
