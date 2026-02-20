import { requireRole } from "@/lib/auth";
import { getTeamMembers } from "@/lib/manager";
import ManagerDashboard from "@/components/ManagerDashboard";

export default async function ManagerPage() {
  const user = await requireRole(["manager"]);
  const team = await getTeamMembers(user.id);

  return <ManagerDashboard user={user} team={team} />;
}
