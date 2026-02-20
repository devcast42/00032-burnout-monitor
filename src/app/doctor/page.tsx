import { getManagerChain, requireRole } from "@/lib/auth";

export default async function DoctorPage() {
 const user = await requireRole(["doctor"]);
 const chain = await getManagerChain(user);

 return (
  <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
   <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
    <h1 className="text-2xl font-semibold text-zinc-900">Panel de Doctor</h1>
    <div className="mt-4 space-y-2 text-sm text-zinc-700">
     <div>Nombre: {user.name}</div>
     <div>Email: {user.email}</div>
     <div>Rol: {user.role}</div>
    </div>
    <div className="mt-6">
     <h2 className="text-sm font-semibold text-zinc-900">
      Jerarquía de managers
     </h2>
     {chain.length === 0 ? (
      <p className="mt-2 text-sm text-zinc-600">Sin manager asignado.</p>
     ) : (
      <ul className="mt-2 space-y-1 text-sm text-zinc-700">
       {chain.map((manager) => (
        <li key={manager.id}>
         {manager.name} · {manager.email}
        </li>
       ))}
      </ul>
     )}
    </div>
    <div className="mt-6 flex gap-3">
     <a
      href="/doctor/appointments"
      className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
     >
      📅 Mis Citas
     </a>
    </div>
   </div>
  </div>
 );
}
