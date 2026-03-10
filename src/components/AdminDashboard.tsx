"use client";

import { useEffect, useState } from "react";
import { User } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import UserForm from "./UserForm";
import Modal from "./Modal";
import { Shield, Plus, UserPlus, Edit2, Trash2, Loader2, Mail, BadgeCheck } from "lucide-react";

export default function AdminDashboard({ user }: { user: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setRefreshKey((k) => k + 1);
  };

  const openCreateModal = () => {
    setEditingUser(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="relative flex min-h-screen justify-center bg-[#050507] px-6 py-12 overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-6xl space-y-10 relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="glass premium-border rounded-3xl p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-2xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 shadow-inner ring-1 ring-indigo-500/20">
              <Shield size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BadgeCheck size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Sistema Seguro</span>
              </div>
              <h1 className="text-gradient text-3xl font-black tracking-tight">Administración</h1>
              <div className="mt-1 flex items-center gap-3 text-sm font-medium text-zinc-500">
                <span className="flex items-center gap-1.5"><Mail size={12} /> {user.email}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-800" />
                <span className="text-indigo-400/80">Root Access</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="flex h-14 items-center gap-3 rounded-2xl bg-white px-6 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-zinc-200 active:scale-95 shadow-xl shadow-white/5"
            >
              <UserPlus size={18} strokeWidth={3} />
              <span>Nuevo Usuario</span>
            </button>
            <div className="glass premium-border rounded-2xl p-1.5">
              <LogoutButton />
            </div>
          </div>
        </header>

        <section className="glass premium-border rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Gestión de Cuentas
            </h2>
            <span className="text-[10px] font-bold text-zinc-600 uppercase bg-white/5 px-2 py-1 rounded-md border border-white/5">
              {users.length} Registros
            </span>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 text-zinc-600 italic">
                <Loader2 size={32} className="animate-spin mb-4 text-indigo-500/30" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Base de Datos...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl">
                <table className="w-full text-left text-sm">
                  <thead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white/[0.02]">
                    <tr>
                      <th className="px-6 py-4">Usuario</th>
                      <th className="px-6 py-4">Email Corporativo</th>
                      <th className="px-6 py-4">Permisos</th>
                      <th className="px-6 py-4 text-right">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-white/5 text-xs font-bold text-zinc-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-medium text-zinc-400">{u.email}</td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border shadow-sm
                            ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              u.role === 'doctor' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                                'bg-zinc-800/10 text-zinc-400 border-zinc-700/50'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                              title="Editar Usuario"
                            >
                              <Edit2 size={16} />
                            </button>
                            {u.id !== user.id && (
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="p-2 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                title="Eliminar Usuario"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? "Modificar Perfil" : "Nueva Cuenta"}
        >
          <div className="p-1">
            <UserForm
              user={editingUser}
              onSuccess={() => {
                setRefreshKey((k) => k + 1);
                setIsModalOpen(false);
              }}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </Modal>
      </div>
    </div>
  );
}
