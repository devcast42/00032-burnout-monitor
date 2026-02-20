"use client";

import { useEffect, useState } from "react";
import { User } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import UserForm from "./UserForm";
import Modal from "./Modal";

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
    <div className="flex min-h-screen justify-center bg-zinc-950 px-6 py-12">
      <div className="w-full max-w-6xl space-y-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">
              Panel de Administrador
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-zinc-400">
                {user.name} ({user.email})
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Usuarios</h2>
            <button
              onClick={openCreateModal}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
            >
              Crear Usuario
            </button>
          </div>

          {loading ? (
            <div className="text-center py-4 text-zinc-400">Cargando...</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950 text-zinc-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Nombre</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Rol</th>
                    <th className="px-6 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        {u.name}
                      </td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300 border border-zinc-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-zinc-400 hover:text-white transition-colors"
                        >
                          Editar
                        </button>
                        {u.id !== user.id && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? "Editar Usuario" : "Crear Usuario"}
        >
          <UserForm
            user={editingUser}
            onSuccess={() => {
              setRefreshKey((k) => k + 1);
              setIsModalOpen(false);
            }}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      </div>
    </div>
  );
}
