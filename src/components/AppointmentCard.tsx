"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Video, FileText } from "lucide-react";
import PatientHistoryModal from "./PatientHistoryModal";

type AppointmentCardProps = {
    id: string;
    doctorName: string;
    specialty: string;
    date: string;
    status: string;
    patientName?: string;
    patientId?: string;
    role: "user" | "doctor";
};

const statusLabels: Record<string, { label: string; color: string }> = {
    SCHEDULED: { label: "Agendada", color: "bg-blue-900/50 text-blue-200 border-blue-800" },
    IN_PROGRESS: { label: "En progreso", color: "bg-yellow-900/50 text-yellow-200 border-yellow-800" },
    COMPLETED: { label: "Completada", color: "bg-green-900/50 text-green-200 border-green-800" },
    CANCELLED: { label: "Cancelada", color: "bg-red-900/50 text-red-200 border-red-800" },
};

export default function AppointmentCard({
    id,
    doctorName,
    specialty,
    date,
    status,
    patientName,
    patientId,
    role,
}: AppointmentCardProps) {
    const router = useRouter();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
        color: "bg-zinc-800 text-zinc-400 border-zinc-700",
    };

    const canJoinCall = status === "SCHEDULED" || status === "IN_PROGRESS";

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:bg-zinc-800/50">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-base font-semibold text-white">
                        {role === "user" ? doctorName : patientName}
                    </h3>
                    <p className="text-sm text-zinc-400">
                        {role === "user" ? specialty : "Paciente"}
                    </p>
                </div>
                <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusInfo.color}`}
                >
                    {statusInfo.label}
                </span>
            </div>
            <div className="space-y-2 text-sm text-zinc-400 mb-4">
                <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    {formattedDate}
                </div>
                <div className="flex items-center gap-2">
                    <Clock size={16} />
                    {formattedTime}
                </div>
            </div>
            <div className="flex gap-2">
                {canJoinCall && (
                    <button
                        onClick={() => router.push(`/${role}/appointments/${id}/call`)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                    >
                        <Video size={16} />
                        Unirse a la llamada
                    </button>
                )}
                {status === "COMPLETED" && role === "doctor" && (
                    <button
                        onClick={() => router.push(`/doctor/appointments/${id}/transcript`)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                    >
                        Ver transcripción
                    </button>
                )}
                {role === "doctor" && patientId && (
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                        title="Ver historial del paciente"
                    >
                        <FileText size={18} />
                    </button>
                )}
            </div>

            {/* Patient History Modal */}
            {patientId && (
                <PatientHistoryModal
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    patientId={patientId}
                    patientName={patientName || "Paciente"}
                />
            )}
        </div>
    );
}
