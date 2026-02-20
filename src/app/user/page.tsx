import { getManagerChain, requireRole } from "@/lib/auth";
import UserDashboard from "@/components/UserDashboard";

export default async function UserPage() {
  const user = await requireRole(["user"]);
  const chain = await getManagerChain(user);

  return <UserDashboard user={user} chain={chain} />;
}
