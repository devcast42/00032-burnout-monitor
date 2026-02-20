"use client";

import { useState } from "react";
import { User, Role } from "@/lib/auth";

type UserFormProps = {
 user?: User & {
  designation?: string;
  specialization?: string;
  work_area?: string;
  weekly_hours?: number;
  address?: string;
  contact?: string;
 };
 onSuccess: () => void;
 onCancel: () => void;
};

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
 const [email, setEmail] = useState(user?.email || "");
 const [name, setName] = useState(user?.name || "");
 const [role, setRole] = useState<Role>(user?.role || "user");
 const [password, setPassword] = useState("");
 const [managerId, setManagerId] = useState(user?.managerId || "");

 // Person fields
 const [designation, setDesignation] = useState(user?.designation || "");
 const [specialization, setSpecialization] = useState(
  user?.specialization || "",
 );
 const [workArea, setWorkArea] = useState(user?.work_area || "");
 const [weeklyHours, setWeeklyHours] = useState(
  user?.weekly_hours?.toString() || "",
 );
 const [address, setAddress] = useState(user?.address || "");
 const [contact, setContact] = useState(user?.contact || "");

 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
   const url = user ? `/api/admin/users/${user.id}` : "/api/admin/users";
   const method = user ? "PUT" : "POST";
   const body: Record<string, string | number | null> = {
    email,
    name,
    role,
    managerId,
    designation,
    specialization,
    workArea,
    weeklyHours: weeklyHours ? parseInt(weeklyHours) : null,
    address,
    contact,
   };
   if (password) body.password = password;

   const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
   });

   if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Error al guardar usuario");
   }

   onSuccess();
  } catch (err) {
   if (err instanceof Error) {
    setError(err.message);
   } else {
    setError("Ocurrió un error desconocido");
   }
  } finally {
   setLoading(false);
  }
 };

 return (
  <form onSubmit={handleSubmit} className="space-y-4">
   {error && (
    <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-200 border border-red-800">
     {error}
    </div>
   )}

   <div>
    <label className="block text-sm font-medium text-zinc-300">Nombre</label>
    <input
     type="text"
     value={name}
     onChange={(e) => setName(e.target.value)}
     required
     className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-white focus:outline-none"
    />
   </div>

   <div>
    <label className="block text-sm font-medium text-zinc-300">Email</label>
    <input
     type="email"
     value={email}
     onChange={(e) => setEmail(e.target.value)}
     required
     className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-white focus:outline-none"
    />
   </div>

   <div>
    <label className="block text-sm font-medium text-zinc-300">Rol</label>
    <select
     value={role}
     onChange={(e) => setRole(e.target.value as Role)}
     className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-white focus:outline-none"
    >
     <option value="user">User</option>
     <option value="manager">Manager</option>
     <option value="doctor">Doctor</option>
     <option value="admin">Admin</option>
    </select>
   </div>

   {role === "user" && (
    <div className="space-y-4 border-t border-zinc-800 pt-4 mt-4">
     <h3 className="text-sm font-semibold text-zinc-400">Datos Personales</h3>

     <div className="grid grid-cols-2 gap-4">
      <div>
       <label className="block text-sm font-medium text-zinc-300">
        Designación
       </label>
       <input
        type="text"
        value={designation}
        onChange={(e) => setDesignation(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-white focus:outline-none"
       />
      </div>
      <div>
       <label className="block text-sm font-medium text-zinc-300">
        Especialización
       </label>
       <input
        type="text"
        value={specialization}
        onChange={(e) => setSpecialization(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-white focus:outline-none"
       />
      </div>
     </div>

     <div className="grid grid-cols-2 gap-4">
      <div>
       <label className="block text-sm font-medium text-zinc-300">
        Área de Trabajo
       </label>
       <input
        type="text"
        value={workArea}
        onChange={(e) => setWorkArea(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-white focus:outline-none"
       />
      </div>
      <div>
       <label className="block text-sm font-medium text-zinc-300">
        Horas Semanales
       </label>
       <input
        type="number"
        value={weeklyHours}
        onChange={(e) => setWeeklyHours(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-white focus:outline-none"
       />
      </div>
     </div>

     <div>
      <label className="block text-sm font-medium text-zinc-300">
       Dirección
      </label>
      <input
       type="text"
       value={address}
       onChange={(e) => setAddress(e.target.value)}
       className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-white focus:outline-none"
      />
     </div>

     <div>
      <label className="block text-sm font-medium text-zinc-300">
       Contacto
      </label>
      <input
       type="text"
       value={contact}
       onChange={(e) => setContact(e.target.value)}
       className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-white focus:outline-none"
      />
     </div>
    </div>
   )}

   <div>
    <label className="block text-sm font-medium text-zinc-300">
     Manager ID (Opcional)
    </label>
    <input
     type="text"
     value={managerId}
     onChange={(e) => setManagerId(e.target.value)}
     className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-white focus:outline-none"
     placeholder="ID del manager"
    />
   </div>

   <div>
    <label className="block text-sm font-medium text-zinc-300">
     Contraseña {user && "(Dejar en blanco para no cambiar)"}
    </label>
    <input
     type="password"
     value={password}
     onChange={(e) => setPassword(e.target.value)}
     required={!user}
     className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-white focus:outline-none"
    />
   </div>

   <div className="flex gap-4 pt-4">
    <button
     type="button"
     onClick={onCancel}
     className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
    >
     Cancelar
    </button>
    <button
     type="submit"
     disabled={loading}
     className="flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
    >
     {loading ? "Guardando..." : "Guardar"}
    </button>
   </div>
  </form>
 );
}
