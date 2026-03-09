"use client";

import { useState, useMemo, useEffect } from "react";
import { FileText, Activity, ArrowLeft } from "lucide-react";
import Modal from "./Modal";
import SurveyLineChart from "./SurveyLineChart";
import SurveyReportView from "./SurveyReportView";

export type ReportData = {
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

type PatientHistoryModalProps = {
    isOpen: boolean;
    onClose: () => void;
    patientName: string;
    patientId: string;
};

type FilterPreset = "7d" | "30d" | "90d" | "all" | "custom";

export default function PatientHistoryModal({
    isOpen,
    onClose,
    patientName,
    patientId,
}: PatientHistoryModalProps) {
    const [reports, setReports] = useState<ReportData[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);

    // Filtering and pagination state
    const [historyPreset, setHistoryPreset] = useState<FilterPreset>("all");
    const [historyCustomFrom, setHistoryCustomFrom] = useState("");
    const [historyCustomTo, setHistoryCustomTo] = useState("");
    const [historyPage, setHistoryPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        if (isOpen && patientId) {
            fetchHistory();
        } else {
            // Reset state when closing
            setReports([]);
            setSelectedReport(null);
            setHistoryPage(1);
            setHistoryPreset("all");
        }
    }, [isOpen, patientId]);

    // Reset pagination when filters change
    useEffect(() => {
        setHistoryPage(1);
    }, [historyPreset, historyCustomFrom, historyCustomTo]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/doctor/patients/${patientId}/reports`);
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports || []);
            }
        } catch (err) {
            console.error("Error fetching patient history:", err);
        } finally {
            setLoading(false);
        }
    };

    const subtractDays = (days: number): string => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d.toISOString().split("T")[0];
    };

    const filteredReports = useMemo(() => {
        if (historyPreset === "all") return reports;

        let fromDate: string;
        let toDate: string = new Date().toISOString().split("T")[0];

        if (historyPreset === "custom") {
            if (!historyCustomFrom && !historyCustomTo) return reports;
            fromDate = historyCustomFrom || "1900-01-01";
            toDate = historyCustomTo || "2999-12-31";
        } else {
            const days = historyPreset === "7d" ? 7 : historyPreset === "30d" ? 30 : 90;
            fromDate = subtractDays(days);
        }

        return reports.filter((r) => r.survey.date >= fromDate && r.survey.date <= toDate);
    }, [reports, historyPreset, historyCustomFrom, historyCustomTo]);

    const totalPages = Math.max(1, Math.ceil(filteredReports.length / ITEMS_PER_PAGE));
    const paginatedReports = filteredReports.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

    const chartData = reports.map((r) => ({
        date: r.survey.date,
        score: r.score,
    }));

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

    const presetButtons: { key: FilterPreset; label: string }[] = [
        { key: "7d", label: "7 d" },
        { key: "30d", label: "30 d" },
        { key: "90d", label: "90 d" },
        { key: "all", label: "Todo" },
        { key: "custom", label: "Rango" },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={selectedReport ? "Detalle del Informe" : `Historial de ${patientName}`}
        >
            {selectedReport ? (
                <div className="space-y-4">
                    <button
                        onClick={() => setSelectedReport(null)}
                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-2"
                    >
                        <ArrowLeft size={16} /> Volver al listado
                    </button>
                    {selectedReport.report ? (
                        <SurveyReportView
                            report={selectedReport.report}
                            score={selectedReport.score}
                            date={selectedReport.createdAt}
                            reportId={selectedReport.id}
                            onClose={() => setSelectedReport(null)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <Activity size={48} className="text-zinc-700" />
                            <p className="text-sm text-zinc-400">Este informe no tiene resumen generado por IA.</p>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white"
                            >
                                Volver
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mt-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar space-y-6">
                    {loading ? (
                        <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-3">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
                            Cargando historial...
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center text-zinc-500">
                            <FileText size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm">El paciente no tiene análisis registrados.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chart Section */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-zinc-400">Evolución de Bienestar</h3>
                                <SurveyLineChart data={chartData} />
                            </div>

                            {/* Filters and List Section */}
                            <div className="space-y-4 border-t border-zinc-800 pt-6">
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-sm font-medium text-zinc-400">Listado de Informes</h3>

                                    <div className="flex flex-wrap gap-1.5">
                                        {presetButtons.map((btn) => (
                                            <button
                                                key={btn.key}
                                                onClick={() => setHistoryPreset(btn.key)}
                                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${historyPreset === btn.key
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                                                    }`}
                                            >
                                                {btn.label}
                                            </button>
                                        ))}
                                    </div>

                                    {historyPreset === "custom" && (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={historyCustomFrom}
                                                onChange={(e) => setHistoryCustomFrom(e.target.value)}
                                                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none ring-offset-0 focus:ring-0"
                                            />
                                            <span className="text-zinc-500">—</span>
                                            <input
                                                type="date"
                                                value={historyCustomTo}
                                                onChange={(e) => setHistoryCustomTo(e.target.value)}
                                                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none ring-offset-0 focus:ring-0"
                                            />
                                        </div>
                                    )}
                                </div>

                                {filteredReports.length === 0 ? (
                                    <div className="py-8 text-center text-zinc-500 text-sm italic">
                                        No hay datos en el rango seleccionado.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {paginatedReports.map((report) => (
                                            <button
                                                key={report.id}
                                                onClick={() => setSelectedReport(report)}
                                                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition hover:bg-zinc-800/50 group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 group-hover:bg-indigo-900/50 group-hover:text-indigo-300 transition-colors">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-zinc-200">
                                                                {new Date(report.survey.date + "T00:00:00").toLocaleDateString("es-PE", {
                                                                    weekday: "short",
                                                                    year: "numeric",
                                                                    month: "short",
                                                                    day: "numeric",
                                                                })}
                                                            </div>
                                                            <div className="text-xs text-zinc-500">
                                                                Score: {report.score}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`rounded-full px-2.5 py-1 text-xs font-medium border ${getScoreBadgeColor(report.score)}`}>
                                                        {getScoreLabel(report.score)}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setHistoryPage((p) => Math.max(1, p - 1)); }}
                                                    disabled={historyPage === 1}
                                                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Anterior
                                                </button>
                                                <span className="text-xs text-zinc-500">
                                                    Pág. {historyPage} / {totalPages}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setHistoryPage((p) => Math.min(totalPages, p + 1)); }}
                                                    disabled={historyPage === totalPages}
                                                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Siguiente
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
            <div className="mt-6 flex justify-end border-t border-zinc-800 pt-4">
                <button
                    onClick={onClose}
                    className="rounded-lg bg-zinc-800 border border-zinc-700 px-6 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                    Cerrar
                </button>
            </div>
        </Modal>
    );
}
