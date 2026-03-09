import { getManagerChain, requireRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import { Stethoscope } from "lucide-react";

export default async function DoctorProfilePage() {
    const user = await requireRole(["doctor"]);
    const chain = await getManagerChain(user);

    return (
        <div className="flex-1 px-6 py-8">
            <div className="mx-auto w-full max-w-lg">
                <div className="space-y-6">
                    <h1 className="text-2xl font-semibold text-white">Perfil</h1>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                                <Stethoscope size={24} />
                            </div>
                            <div>
                                <div className="font-medium text-white">{user.name}</div>
                                <div className="text-sm text-zinc-500">{user.email}</div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-800">
                            <h3 className="mb-2 text-sm font-medium text-zinc-400">
                                Jerarquía de managers
                            </h3>
                            {chain.length === 0 ? (
                                <p className="text-sm text-zinc-500">Sin manager asignado.</p>
                            ) : (
                                <ul className="space-y-2 text-sm text-zinc-400">
                                    {chain.map((manager) => (
                                        <li key={manager.id} className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                                            <span>
                                                {manager.name} ({manager.email})
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="pt-4 border-t border-zinc-800">
                            <div className="flex justify-end">
                                <LogoutButton />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
