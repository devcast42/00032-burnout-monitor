"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Video, FileText, Download, MessageCircle } from "lucide-react";
import Modal from "./Modal";

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

type ReportData = {
    id: string;
    score: number;
    createdAt: string;
    report: string | null;
    survey: {
        date: string;
        score: number;
        answers: Record<string, number>;
    };
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
    const [reports, setReports] = useState<ReportData[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

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

    const fetchHistory = async () => {
        if (!patientId) return;
        setIsHistoryOpen(true);
        setLoadingReports(true);
        try {
            const res = await fetch(`/api/doctor/patients/${patientId}/reports`);
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports || []);
            }
        } catch (err) {
            console.error("Error fetching patient history:", err);
        } finally {
            setLoadingReports(false);
        }
    };

    const getScoreBadgeColor = (score: number) => {
        if (score <= 30) return "bg-green-900/50 text-green-200 border-green-800";
        if (score <= 60) return "bg-yellow-900/50 text-yellow-200 border-yellow-800";
        return "bg-red-900/50 text-red-200 border-red-800";
    };

    const getScoreLabel = (score: number) => {
        if (score <= 30) return "Bajo";
        if (score <= 60) return "Medio";
        return "Alto";
    };

    const handleDownloadReport = (report: ReportData) => {
        const text = `Reporte de Burnout - ${patientName}\nFecha: ${new Date(report.createdAt).toLocaleDateString()}\nPuntuación: ${report.score}%\n\n${report.report || "Sin reporte detallado."}`;

        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Reporte_${patientName?.replace(/\s+/g, '_')}_${report.survey.date}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSendWhatsApp = (report: ReportData) => {
        const text = `Hola ${patientName}, te comparto el resumen de tu último análisis de bienestar:\n- Nivel de burnout: ${report.score}% (${getScoreLabel(report.score)})\n- Fecha: ${new Date(report.createdAt).toLocaleDateString()}\n\nPor favor, revísalo para nuestra próxima sesión.`;
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

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
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                    >
                        <Video size={16} />
                        Unirse a la llamada
                    </button>
                )}
                {role === "doctor" && patientId && (
                    <button
                        onClick={fetchHistory}
                        className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                        title="Ver historial del paciente"
                    >
                        <FileText size={16} />
                        <span className="hidden sm:inline">Historial</span>
                    </button>
                )}
                {status === "COMPLETED" && role === "doctor" && (
                    <button
                        onClick={() => router.push(`/doctor/appointments/${id}/transcript`)}
                        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
                    >
                        Ver transcripción
                    </button>
                )}
            </div>

            {/* Patient History Modal */}
            <Modal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title={`Historial de ${patientName}`}
            >
                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                    {loadingReports ? (
                        <div className="py-8 text-center text-zinc-500">Cargando historial...</div>
                    ) : reports.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-6 text-center text-zinc-500">
                            <p className="text-sm">El paciente no tiene análisis registrados.</p>
                        </div>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="text-sm font-medium text-zinc-200">
                                            {new Date(report.createdAt).toLocaleDateString("es-PE", {
                                                year: "numeric", month: "long", day: "numeric"
                                            })}
                                        </div>
                                    </div>
                                    <div className={`rounded-full px-2.5 py-1 text-xs font-medium border ${getScoreBadgeColor(report.score)}`}>
                                        {report.score}% · {getScoreLabel(report.score)}
                                    </div>
                                </div>

                                {report.report && (
                                    <div className="mb-4 rounded-lg bg-zinc-950 p-4">
                                        <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed line-clamp-4">
                                            {report.report}
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-800">
                                    <button
                                        onClick={() => handleDownloadReport(report)}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                                    >
                                        <Download size={14} /> Descargar PDF
                                    </button>
                                    <button
                                        onClick={() => handleSendWhatsApp(report)}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#075E54]/20 border border-[#075E54]/50 text-[#25D366] px-3 py-2 text-xs font-medium hover:bg-[#075E54]/30 transition-colors"
                                    >
                                        <MessageCircle size={14} /> Enviar a WhatsApp
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={() => setIsHistoryOpen(false)}
                        className="rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </Modal>
        </div>
    );
}
