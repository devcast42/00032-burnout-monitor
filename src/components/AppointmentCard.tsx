"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Video, FileText, ChevronRight } from "lucide-react";
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
    SCHEDULED: { label: "Agendada", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/10" },
    IN_PROGRESS: { label: "En progreso", color: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10" },
    COMPLETED: { label: "Completada", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10" },
    CANCELLED: { label: "Cancelada", color: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10" },
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
        weekday: "short",
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
        <div className="glass premium-border relative overflow-hidden rounded-2xl p-5 transition-all hover:bg-white/[0.04] group">
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner">
                        {(role === "user" ? doctorName : patientName)?.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                            {role === "user" ? doctorName : patientName}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            {role === "user" ? specialty : "Paciente Registrado"}
                        </p>
                    </div>
                </div>
                <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border ${statusInfo.color} shadow-lg shadow-black/20`}
                >
                    {statusInfo.label}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2 text-xs font-semibold text-zinc-400">
                    <Calendar size={14} className="text-indigo-400/70" />
                    <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2 text-xs font-semibold text-zinc-400">
                    <Clock size={14} className="text-indigo-400/70" />
                    <span>{formattedTime}</span>
                </div>
            </div>

            <div className="flex gap-2">
                {canJoinCall && (
                    <button
                        onClick={() => router.push(`/${role}/appointments/${id}/call`)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-zinc-200 active:scale-[0.98] shadow-lg shadow-white/5"
                    >
                        <Video size={14} strokeWidth={3} />
                        Unirse a Sesión
                    </button>
                )}
                {status === "COMPLETED" && role === "doctor" && (
                    <button
                        onClick={() => router.push(`/doctor/appointments/${id}/transcript`)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 active:scale-[0.98]"
                    >
                        Transcripción
                    </button>
                )}
                {role === "doctor" && patientId && (
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98]"
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
