"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { User } from "@/lib/auth";
import {
 Home,
 Calendar,
 User as UserIcon,
 Video,
 Clock,
 FileText,
 Stethoscope,
} from "lucide-react";

type Tab = "home" | "appointments" | "profile";

type Appointment = {
 id: string;
 date: string;
 status: string;
 patientName: string;
 patientEmail: string;
 jitsiRoomName: string;
 doctor: { name: string; specialty: string };
};

export default function DoctorDashboard({
 user,
 chain,
}: {
 user: User;
 chain: User[];
}) {
 const router = useRouter();
 const [activeTab, setActiveTab] = useState<Tab>("home");
 const [appointments, setAppointments] = useState<Appointment[]>([]);
 const [loadingAppointments, setLoadingAppointments] = useState(
  () => true, // start as loading since we fetch on mount
 );

 useEffect(() => {
  if (activeTab === "home" || activeTab === "appointments") {
   const controller = new AbortController();
   // Use a microtask to set loading state, avoiding synchronous setState in effect
   queueMicrotask(() => setLoadingAppointments(true));
   fetch("/api/appointments", { signal: controller?.signal })
    .then((res) => {
     if (res.status === 401) return null;
     return res.json();
    })
    .then((data) => {
     if (data) setAppointments(data.appointments || []);
    })
    .catch((err) => {
     if (err.name !== "AbortError") console.error(err);
    })
    .finally(() => setLoadingAppointments(false));
   return () => controller.abort();
  }
 }, [activeTab]);

 const getStatusColor = (status: string) => {
  switch (status) {
   case "SCHEDULED":
    return "bg-blue-900/50 text-blue-200 border-blue-800";
   case "IN_PROGRESS":
    return "bg-yellow-900/50 text-yellow-200 border-yellow-800";
   case "COMPLETED":
    return "bg-green-900/50 text-green-200 border-green-800";
   case "CANCELLED":
    return "bg-red-900/50 text-red-200 border-red-800";
   default:
    return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
 };

 const getStatusLabel = (status: string) => {
  switch (status) {
   case "SCHEDULED":
    return "Agendada";
   case "IN_PROGRESS":
    return "En progreso";
   case "COMPLETED":
    return "Completada";
   case "CANCELLED":
    return "Cancelada";
   default:
    return status;
  }
 };

 const scheduledAppointments = appointments.filter(
  (a) => a.status === "SCHEDULED" || a.status === "IN_PROGRESS",
 );
 const completedAppointments = appointments.filter(
  (a) => a.status === "COMPLETED",
 );

 return (
  <div className="flex min-h-screen flex-col bg-zinc-950 pb-20">
   <div className="flex-1 px-6 py-8">
    <div className="mx-auto w-full max-w-lg">
     {activeTab === "home" && (
      <div className="space-y-8">
       <div>
        <h1 className="text-2xl font-semibold text-white">Dr. {user.name}</h1>
        <p className="text-sm text-zinc-500">Panel de Doctor</p>
       </div>

       {/* Upcoming appointments summary */}
       <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
         Próximas Citas
        </h2>
        {loadingAppointments ? (
         <div className="text-center py-8 text-zinc-500">Cargando...</div>
        ) : scheduledAppointments.length === 0 ? (
         <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <Stethoscope className="mx-auto mb-4 h-12 w-12 text-zinc-700" />
          <p className="text-sm text-zinc-500">No tienes citas pendientes.</p>
         </div>
        ) : (
         <div className="space-y-3">
          {scheduledAppointments.slice(0, 3).map((appt) => (
           <div
            key={appt.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition hover:bg-zinc-800/50"
           >
            <div className="flex items-start justify-between mb-3">
             <div>
              <h3 className="font-semibold text-white">{appt.patientName}</h3>
              <p className="text-xs text-zinc-500">{appt.patientEmail}</p>
             </div>
             <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusColor(appt.status)}`}
             >
              {getStatusLabel(appt.status)}
             </span>
            </div>
            <div className="space-y-1 text-sm text-zinc-400 mb-3">
             <div className="flex items-center gap-2">
              <Calendar size={14} />
              {new Date(appt.date).toLocaleDateString("es-PE", {
               weekday: "short",
               month: "short",
               day: "numeric",
              })}
             </div>
             <div className="flex items-center gap-2">
              <Clock size={14} />
              {new Date(appt.date).toLocaleTimeString("es-PE", {
               hour: "2-digit",
               minute: "2-digit",
              })}
             </div>
            </div>
            <button
             onClick={() => router.push(`/doctor/appointments/${appt.id}/call`)}
             className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
            >
             <Video size={16} />
             Unirse a la llamada
            </button>
           </div>
          ))}
          {scheduledAppointments.length > 3 && (
           <button
            onClick={() => setActiveTab("appointments")}
            className="w-full text-center text-sm text-zinc-500 hover:text-white transition-colors py-2"
           >
            Ver todas ({scheduledAppointments.length} citas) →
           </button>
          )}
         </div>
        )}
       </div>

       {/* Quick stats */}
       <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
         <div className="text-2xl font-bold text-white">
          {scheduledAppointments.length}
         </div>
         <div className="text-xs text-zinc-500 mt-1">Pendientes</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
         <div className="text-2xl font-bold text-white">
          {completedAppointments.length}
         </div>
         <div className="text-xs text-zinc-500 mt-1">Completadas</div>
        </div>
       </div>
      </div>
     )}

     {activeTab === "appointments" && (
      <div className="space-y-6">
       <h1 className="text-2xl font-semibold text-white">Mis Pacientes</h1>

       {loadingAppointments ? (
        <div className="text-center py-8 text-zinc-500">Cargando citas...</div>
       ) : appointments.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">
         <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
         <p>No tienes citas agendadas.</p>
        </div>
       ) : (
        <div className="space-y-4">
         {appointments.map((appt) => (
          <div
           key={appt.id}
           className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:bg-zinc-800/50"
          >
           <div className="flex items-start justify-between mb-4">
            <div>
             <h3 className="font-semibold text-white">{appt.patientName}</h3>
             <p className="text-sm text-zinc-400">Paciente</p>
            </div>
            <span
             className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusColor(appt.status)}`}
            >
             {getStatusLabel(appt.status)}
            </span>
           </div>

           <div className="space-y-2 text-sm text-zinc-400 mb-4">
            <div className="flex items-center gap-2">
             <Calendar size={16} />
             {new Date(appt.date).toLocaleDateString("es-PE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
             })}
            </div>
            <div className="flex items-center gap-2">
             <Clock size={16} />
             {new Date(appt.date).toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
             })}
            </div>
           </div>

           <div className="flex gap-2">
            {(appt.status === "SCHEDULED" || appt.status === "IN_PROGRESS") && (
             <button
              onClick={() =>
               router.push(`/doctor/appointments/${appt.id}/call`)
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
             >
              <Video size={16} />
              Unirse
             </button>
            )}
            {appt.status === "COMPLETED" && (
             <button
              onClick={() =>
               router.push(`/doctor/appointments/${appt.id}/transcript`)
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
             >
              <FileText size={16} />
              Ver transcripción
             </button>
            )}
           </div>
          </div>
         ))}
        </div>
       )}
      </div>
     )}

     {activeTab === "profile" && (
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
     )}
    </div>
   </div>

   <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-lg safe-area-bottom">
    <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-3">
     <button
      onClick={() => setActiveTab("home")}
      className={`flex flex-col items-center gap-1 p-2 transition-colors ${
       activeTab === "home" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
      }`}
     >
      <Home size={24} />
      <span className="text-xs font-medium">Home</span>
     </button>

     <button
      onClick={() => setActiveTab("appointments")}
      className={`flex flex-col items-center gap-1 p-2 transition-colors ${
       activeTab === "appointments"
        ? "text-white"
        : "text-zinc-500 hover:text-zinc-300"
      }`}
     >
      <Calendar size={24} />
      <span className="text-xs font-medium">Pacientes</span>
     </button>

     <button
      onClick={() => setActiveTab("profile")}
      className={`flex flex-col items-center gap-1 p-2 transition-colors ${
       activeTab === "profile"
        ? "text-white"
        : "text-zinc-500 hover:text-zinc-300"
      }`}
     >
      <UserIcon size={24} />
      <span className="text-xs font-medium">Perfil</span>
     </button>
    </div>
   </nav>
  </div>
 );
}
