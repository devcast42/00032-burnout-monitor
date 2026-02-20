"use client";

import { useRouter } from "next/navigation";

type AppointmentCardProps = {
 id: string;
 doctorName: string;
 specialty: string;
 date: string;
 status: string;
 patientName?: string;
 role: "user" | "doctor";
};

const statusLabels: Record<string, { label: string; color: string }> = {
 SCHEDULED: { label: "Agendada", color: "bg-blue-100 text-blue-800" },
 IN_PROGRESS: { label: "En progreso", color: "bg-yellow-100 text-yellow-800" },
 COMPLETED: { label: "Completada", color: "bg-green-100 text-green-800" },
 CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800" },
};

export default function AppointmentCard({
 id,
 doctorName,
 specialty,
 date,
 status,
 patientName,
 role,
}: AppointmentCardProps) {
 const router = useRouter();
 const dateObj = new Date(date);
 const formattedDate = dateObj.toLocaleDateString("es-PE", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
 });
 const formattedTime = dateObj.toLocaleTimeString("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
 });

 const statusInfo = statusLabels[status] || {
  label: status,
  color: "bg-zinc-100 text-zinc-800",
 };

 const canJoinCall = status === "SCHEDULED" || status === "IN_PROGRESS";

 return (
  <div className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:shadow-md">
   <div className="flex items-start justify-between">
    <div>
     <h3 className="text-base font-semibold text-zinc-900">
      {role === "user" ? doctorName : patientName}
     </h3>
     <p className="text-sm text-zinc-500">
      {role === "user" ? specialty : "Paciente"}
     </p>
    </div>
    <span
     className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color}`}
    >
     {statusInfo.label}
    </span>
   </div>
   <div className="mt-3 text-sm text-zinc-600">
    <div>📅 {formattedDate}</div>
    <div>🕐 {formattedTime}</div>
   </div>
   <div className="mt-4 flex gap-2">
    {canJoinCall && (
     <button
      onClick={() => router.push(`/${role}/appointments/${id}/call`)}
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
     >
      Unirse a la llamada
     </button>
    )}
    {status === "COMPLETED" && role === "doctor" && (
     <button
      onClick={() => router.push(`/doctor/appointments/${id}/transcript`)}
      className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
     >
      Ver transcripción
     </button>
    )}
   </div>
  </div>
 );
}
