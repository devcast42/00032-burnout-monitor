import { getManagerChain, requireRole } from "@/lib/auth";
import DoctorDashboard from "@/components/DoctorDashboard";

export default async function DoctorPage() {
 const user = await requireRole(["doctor"]);
 const chain = await getManagerChain(user);

 return <DoctorDashboard user={user} chain={chain} />;
}
