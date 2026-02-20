import { getManagerChain, requireRole } from "@/lib/auth";
import UserDashboard from "@/components/UserDashboard";

export default async function UserPage() {
 const user = await requireRole(["user"]);
 const chain = await getManagerChain(user);

 return (
  <div>
   <div className="mt-6 flex gap-3">
    <a
     href="/user/appointments"
     className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
    >
     📅 Mis Citas
    </a>
   </div>
   <UserDashboard user={user} chain={chain} />
  </div>
 );
}
