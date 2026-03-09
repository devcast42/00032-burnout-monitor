"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import { TeamMember } from "@/lib/manager";
import LogoutButton from "./LogoutButton";
import BurnoutDynamicForm from "./BurnoutDynamicForm";
import BurnoutResult from "./BurnoutResult";
import SurveyReportView from "./SurveyReportView";
import SurveyLineChart from "./SurveyLineChart";
import Modal from "./Modal";
import { Home, Calendar, User as UserIcon, Video, Clock, ChevronRight, TrendingUp, Activity, FileText, Search } from "lucide-react";

type Tab = "home" | "appointments" | "user";

type Appointment = {
  id: string;
  date: string;
  status: string;
  patientName: string;
  patientEmail: string;
  jitsiRoomName: string;
  doctor: { name: string; specialty: string };
};

type MemberSurveyData = {
  date: string;
  score: number;
};

type Report = {
  id: string;
  report: string | null;
  score: number;
  createdAt: string;
  survey: {
    date: string;
    score: number;
    answers: Record<string, number>;
  };
};

function getScoreColor(score: number) {
  if (score <= 25) return "bg-green-900/50 text-green-200 border border-green-800";
  if (score <= 45) return "bg-blue-900/50 text-blue-200 border border-blue-800";
  if (score <= 65) return "bg-yellow-900/50 text-yellow-200 border border-yellow-800";
  if (score <= 80) return "bg-orange-900/50 text-orange-200 border border-orange-800";
  return "bg-red-900/50 text-red-200 border border-red-800";
}

function getScoreLabel(score: number) {
  if (score <= 25) return "Sin riesgo";
  if (score <= 45) return "Riesgo bajo";
  if (score <= 65) return "Riesgo moderado";
  if (score <= 80) return "Riesgo severo";
  return "Riesgo muy severo";
}

function getScoreBadgeColor(score: number) {
  if (score <= 25) return "bg-green-900/50 text-green-200 border-green-800";
  if (score <= 45) return "bg-blue-900/50 text-blue-200 border-blue-800";
  if (score <= 65) return "bg-yellow-900/50 text-yellow-200 border-yellow-800";
  if (score <= 80) return "bg-orange-900/50 text-orange-200 border-orange-800";
  return "bg-red-900/50 text-red-200 border-red-800";
}

export default function ManagerDashboard({
  user,
  team,
}: {
  user: User;
  team: TeamMember[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Own survey state (same as user dashboard)
  const [predictionResult, setPredictionResult] = useState<{ prediction: number; burnout_probability_percent: number; status: string; top_3_influential_factors?: string[]; report?: string | null; reportId?: string | null } | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportViewOpen, setIsReportViewOpen] = useState(false);

  // Latest report after analysis
  const [latestReport, setLatestReport] = useState<{ report: string; score: number; reportId?: string } | null>(null);
  const [isLatestReportOpen, setIsLatestReportOpen] = useState(false);

  // Member chart modal state
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberSurveys, setMemberSurveys] = useState<MemberSurveyData[]>([]);
  const [loadingMemberSurveys, setLoadingMemberSurveys] = useState(false);
  const [isMemberChartOpen, setIsMemberChartOpen] = useState(false);

  // Search filter for team
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  // History filtering and pagination state (Manager's own reports)
  type FilterPreset = "7d" | "30d" | "90d" | "all" | "custom";
  const [historyPreset, setHistoryPreset] = useState<FilterPreset>("all");
  const [historyCustomFrom, setHistoryCustomFrom] = useState("");
  const [historyCustomTo, setHistoryCustomTo] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // History filtering and pagination state (Team Member's reports)
  const [memberHistoryPreset, setMemberHistoryPreset] = useState<FilterPreset>("all");
  const [memberHistoryCustomFrom, setMemberHistoryCustomFrom] = useState("");
  const [memberHistoryCustomTo, setMemberHistoryCustomTo] = useState("");
  const [memberHistoryPage, setMemberHistoryPage] = useState(1);

  const fetchReports = useCallback(async (signal?: AbortSignal) => {
    setLoadingReports(true);
    try {
      const res = await fetch("/api/surveys/reports", { signal });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "appointments") {
      setLoadingAppointments(true);
      fetch("/api/appointments")
        .then((res) => {
          if (res.status === 401) return null;
          return res.json();
        })
        .then((data) => {
          if (data) setAppointments(data.appointments || []);
        })
        .finally(() => setLoadingAppointments(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "home") return;
    const controller = new AbortController();
    fetchReports(controller.signal);
    return () => controller.abort();
  }, [activeTab, fetchReports]);

  const handleMemberClick = useCallback(async (member: TeamMember) => {
    setSelectedMember(member);
    setIsMemberChartOpen(true);
    setLoadingMemberSurveys(true);
    setMemberSurveys([]);
    setMemberHistoryPreset("all");
    setMemberHistoryCustomFrom("");
    setMemberHistoryCustomTo("");
    setMemberHistoryPage(1);

    try {
      const res = await fetch(`/api/manager/team/${member.id}/surveys`);
      if (res.ok) {
        const data = await res.json();
        setMemberSurveys(data.surveys || []);
      }
    } catch (err) {
      console.error("Error fetching member surveys:", err);
    } finally {
      setLoadingMemberSurveys(false);
    }
  }, []);

  const subtractDays = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
  };

  const presetButtons: { key: FilterPreset; label: string }[] = [
    { key: "7d", label: "7 días" },
    { key: "30d", label: "30 días" },
    { key: "90d", label: "90 días" },
    { key: "all", label: "Todo" },
    { key: "custom", label: "Rango" },
  ];

  // --- Search team members ---
  const filteredTeam = useMemo(() => {
    if (!teamSearchQuery.trim()) return team;
    const query = teamSearchQuery.toLowerCase();
    return team.filter((m) =>
      m.name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query)
    );
  }, [team, teamSearchQuery]);

  // --- Manager's own history filtering and pagination ---
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

  useEffect(() => {
    setHistoryPage(1);
  }, [historyPreset, historyCustomFrom, historyCustomTo]);

  // --- Team member's history filtering and pagination ---
  const filteredMemberSurveys = useMemo(() => {
    if (memberHistoryPreset === "all") return memberSurveys;

    let fromDate: string;
    let toDate: string = new Date().toISOString().split("T")[0];

    if (memberHistoryPreset === "custom") {
      if (!memberHistoryCustomFrom && !memberHistoryCustomTo) return memberSurveys;
      fromDate = memberHistoryCustomFrom || "1900-01-01";
      toDate = memberHistoryCustomTo || "2999-12-31";
    } else {
      const days = memberHistoryPreset === "7d" ? 7 : memberHistoryPreset === "30d" ? 30 : 90;
      fromDate = subtractDays(days);
    }

    return memberSurveys.filter((s) => s.date >= fromDate && s.date <= toDate);
  }, [memberSurveys, memberHistoryPreset, memberHistoryCustomFrom, memberHistoryCustomTo]);

  const memberTotalPages = Math.max(1, Math.ceil(filteredMemberSurveys.length / ITEMS_PER_PAGE));
  const paginatedMemberSurveys = filteredMemberSurveys.slice((memberHistoryPage - 1) * ITEMS_PER_PAGE, memberHistoryPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setMemberHistoryPage(1);
  }, [memberHistoryPreset, memberHistoryCustomFrom, memberHistoryCustomTo]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "bg-blue-900/50 text-blue-200 border-blue-800";
      case "IN_PROGRESS": return "bg-yellow-900/50 text-yellow-200 border-yellow-800";
      case "COMPLETED": return "bg-green-900/50 text-green-200 border-green-800";
      case "CANCELLED": return "bg-red-900/50 text-red-200 border-red-800";
      default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "Agendada";
      case "IN_PROGRESS": return "En progreso";
      case "COMPLETED": return "Completada";
      case "CANCELLED": return "Cancelada";
      default: return status;
    }
  };

  // Chart data from own reports
  const chartData = reports.map((r) => ({
    date: r.survey.date,
    score: r.score,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-20">
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl">
          {activeTab === "home" && (
            <div className="space-y-8">
              <h1 className="text-2xl font-semibold text-white">Hola, {user.name}</h1>

              {/* ═══ Team section ═══ */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Mi Equipo</h2>
                    <span className="text-sm text-zinc-500">{team.length} usuario{team.length !== 1 ? "s" : ""}</span>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o email..."
                      value={teamSearchQuery}
                      onChange={(e) => setTeamSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>

                {team.length === 0 ? (
                  <p className="text-zinc-500">No tienes usuarios asignados.</p>
                ) : filteredTeam.length === 0 ? (
                  <p className="text-zinc-500 text-center py-6">No se encontraron usuarios que coincidan con la búsqueda.</p>
                ) : (
                  <>
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-hidden rounded-lg border border-zinc-800">
                      <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950 text-zinc-200">
                          <tr>
                            <th className="px-6 py-3 font-medium">Nombre</th>
                            <th className="px-6 py-3 font-medium">Email</th>
                            <th className="px-6 py-3 font-medium">Última Encuesta</th>
                            <th className="px-6 py-3 font-medium">Estado</th>
                            <th className="px-6 py-3 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                          {filteredTeam.map((member) => (
                            <tr
                              key={member.id}
                              onClick={() => handleMemberClick(member)}
                              className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                            >
                              <td className="px-6 py-4 font-medium text-white">{member.name}</td>
                              <td className="px-6 py-4">{member.email}</td>
                              <td className="px-6 py-4">
                                {member.lastSurvey
                                  ? new Date(member.lastSurvey.date + "T00:00:00").toLocaleDateString("es-PE", {
                                    day: "numeric", month: "short",
                                  })
                                  : "Nunca"}
                              </td>
                              <td className="px-6 py-4">
                                {member.lastSurvey ? (
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getScoreColor(
                                      member.lastSurvey.score
                                    )}`}
                                  >
                                    {member.lastSurvey.score}% · {getScoreLabel(member.lastSurvey.score)}
                                  </span>
                                ) : (
                                  <span className="text-zinc-600 italic">Sin datos</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-3">
                      {filteredTeam.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleMemberClick(member)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3 text-left transition hover:bg-zinc-800/50 group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white">{member.name}</div>
                              <div className="text-sm text-zinc-500">{member.email}</div>
                            </div>
                            <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                          </div>

                          <div className="flex items-center justify-between text-sm pt-2 border-t border-zinc-800/50">
                            <span className="text-zinc-400">Última encuesta:</span>
                            <span className="text-zinc-200">
                              {member.lastSurvey
                                ? new Date(member.lastSurvey.date + "T00:00:00").toLocaleDateString("es-PE", {
                                  day: "numeric", month: "short",
                                })
                                : "Nunca"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">Estado:</span>
                            {member.lastSurvey ? (
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getScoreColor(
                                  member.lastSurvey.score
                                )}`}
                              >
                                {member.lastSurvey.score}% · {getScoreLabel(member.lastSurvey.score)}
                              </span>
                            ) : (
                              <span className="text-zinc-600 italic">Sin datos</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* ═══ Own analysis section (same as user dashboard) ═══ */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-white">Análisis de Burnout</h2>
                {analyzeError && (
                  <div className="mb-4 rounded-lg bg-red-900/50 p-3 text-sm text-red-200 border border-red-800">
                    {analyzeError}
                  </div>
                )}
                <button
                  onClick={() => {
                    setAnalyzeError(null);
                    setIsAnalyzeOpen(true);
                  }}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center hover:bg-zinc-800 transition-colors group"
                >
                  <div className="mb-2 text-zinc-500 group-hover:text-blue-400 transition-colors">
                    <Activity className="mx-auto" size={36} />
                  </div>
                  <div className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">
                    Analizar
                  </div>
                </button>
              </div>

              {/* Own Line Chart */}
              <SurveyLineChart data={chartData} />

              {/* Own Reports list */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Historial de Análisis</h2>
                </div>

                {/* History Date Filter */}
                {!loadingReports && reports.length > 0 && (
                  <div className="mb-4 space-y-2">
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
                          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                          placeholder="Desde"
                        />
                        <span className="text-xs text-zinc-500">—</span>
                        <input
                          type="date"
                          value={historyCustomTo}
                          onChange={(e) => setHistoryCustomTo(e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                          placeholder="Hasta"
                        />
                      </div>
                    )}
                  </div>
                )}

                {loadingReports ? (
                  <div className="text-center py-6 text-zinc-500">Cargando informes...</div>
                ) : reports.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-500">
                    <p className="text-sm">Completa un análisis para ver tu historial aquí.</p>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-500">
                    <p className="text-sm">No tienes análisis en el rango seleccionado.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {paginatedReports.map((report) => (
                        <button
                          key={report.id}
                          onClick={() => {
                            setSelectedReport(report);
                            setIsReportViewOpen(true);
                          }}
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
                                  Puntuación: {report.score}%
                                </div>
                              </div>
                            </div>
                            <div className={`rounded-full px-2.5 py-1 text-xs font-medium border ${getScoreBadgeColor(report.score)}`}>
                              {getScoreLabel(report.score)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                        <button
                          onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={historyPage === 1}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        <span className="text-xs text-zinc-500">
                          Página {historyPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
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
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-white">Mis Citas</h1>
                <button
                  onClick={() => router.push("/user/appointments/new")}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
                >
                  + Agendar
                </button>
              </div>

              {loadingAppointments ? (
                <div className="text-center py-8 text-zinc-500">Cargando citas...</div>
              ) : appointments.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">
                  <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p className="mb-4">No tienes citas agendadas.</p>
                  <button
                    onClick={() => router.push("/user/appointments/new")}
                    className="text-sm text-white underline hover:text-zinc-300"
                  >
                    Agendar tu primera cita
                  </button>
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
                          <h3 className="font-semibold text-white">{appt.doctor.name}</h3>
                          <p className="text-sm text-zinc-400">{appt.doctor.specialty}</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusColor(
                            appt.status
                          )}`}
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

                      {(appt.status === "SCHEDULED" || appt.status === "IN_PROGRESS") && (
                        <button
                          onClick={() => router.push(`/user/appointments/${appt.id}/call`)}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
                        >
                          <Video size={16} />
                          Unirse a la llamada
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "user" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-semibold text-white">Perfil</h1>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                    <UserIcon size={24} />
                  </div>
                  <div>
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-sm text-zinc-500">{user.email}</div>
                    <div className="text-xs text-zinc-600 mt-1 uppercase tracking-wider">{user.role}</div>
                  </div>
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
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === "home" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            <Home size={24} />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === "appointments" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            <Calendar size={24} />
            <span className="text-xs font-medium">Citas</span>
          </button>

          <button
            onClick={() => setActiveTab("user")}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === "user" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            <UserIcon size={24} />
            <span className="text-xs font-medium">Usuario</span>
          </button>
        </div>
      </nav>

      {/* ═══ Modals ═══ */}

      {/* Analysis form modal */}
      <Modal isOpen={isAnalyzeOpen} onClose={() => setIsAnalyzeOpen(false)} title="Análisis de Burnout">
        <BurnoutDynamicForm
          onResult={(result) => {
            setIsAnalyzeOpen(false);
            setPredictionResult(result);
            setIsResultOpen(true);

            if (result.report) {
              setLatestReport({
                report: result.report,
                score: result.burnout_probability_percent ? Math.round(result.burnout_probability_percent) : 0,
                reportId: result.reportId || undefined,
              });
            }
          }}
          onError={(msg) => {
            setIsAnalyzeOpen(false);
            setAnalyzeError(msg);
          }}
        />
      </Modal>

      {/* Prediction result modal */}
      <Modal
        isOpen={isResultOpen}
        onClose={() => {
          setIsResultOpen(false);
          if (predictionResult?.report) {
            setLatestReport({
              report: predictionResult.report,
              score: predictionResult.burnout_probability_percent ? Math.round(predictionResult.burnout_probability_percent) : 0,
              reportId: predictionResult.reportId || undefined,
            });
            setIsLatestReportOpen(true);
          } else {
            fetchReports();
          }
        }}
        title="Resultados"
      >
        {predictionResult && (
          <BurnoutResult
            result={predictionResult}
            onClose={() => setIsResultOpen(false)}
          />
        )}
      </Modal>

      {/* Latest report modal */}
      <Modal
        isOpen={isLatestReportOpen}
        onClose={() => {
          setIsLatestReportOpen(false);
          fetchReports();
        }}
        title="Informe Generado"
      >
        {latestReport && (
          <SurveyReportView
            report={latestReport.report}
            score={latestReport.score}
            reportId={latestReport.reportId}
            onClose={() => {
              setIsLatestReportOpen(false);
              fetchReports();
            }}
          />
        )}
      </Modal>

      {/* Selected report from history */}
      <Modal
        isOpen={isReportViewOpen}
        onClose={() => {
          setIsReportViewOpen(false);
          setSelectedReport(null);
        }}
        title="Detalle del Informe"
      >
        {selectedReport && selectedReport.report ? (
          <SurveyReportView
            report={selectedReport.report}
            score={selectedReport.score}
            date={selectedReport.createdAt}
            reportId={selectedReport.id}
            onClose={() => {
              setIsReportViewOpen(false);
              setSelectedReport(null);
            }}
          />
        ) : selectedReport ? (
          <div className="space-y-4 text-center">
            <div className="text-4xl">⏳</div>
            <p className="text-sm text-zinc-400">
              El informe de IA no pudo generarse para este análisis.
            </p>
            <p className="text-xs text-zinc-500">
              Puntuación: {selectedReport.score}% · {selectedReport.survey.date}
            </p>
            <button
              onClick={() => {
                setIsReportViewOpen(false);
                setSelectedReport(null);
              }}
              className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : null}
      </Modal>

      {/* Team member score evolution modal */}
      <Modal
        isOpen={isMemberChartOpen}
        onClose={() => {
          setIsMemberChartOpen(false);
          setSelectedMember(null);
          setMemberSurveys([]);
        }}
        title={selectedMember ? `${selectedMember.name}` : "Evolución"}
      >
        <div className="space-y-5">
          {selectedMember && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-900/50 text-indigo-300">
                <UserIcon size={20} />
              </div>
              <div>
                <div className="text-sm font-medium text-white">{selectedMember.name}</div>
                <div className="text-xs text-zinc-500">{selectedMember.email}</div>
              </div>
              {selectedMember.lastSurvey && (
                <div className="ml-auto">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getScoreColor(selectedMember.lastSurvey.score)}`}>
                    {selectedMember.lastSurvey.score}%
                  </span>
                </div>
              )}
            </div>
          )}

          {loadingMemberSurveys ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <div className="text-center space-y-2">
                <div className="animate-spin h-6 w-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full mx-auto" />
                <p className="text-sm">Cargando datos...</p>
              </div>
            </div>
          ) : memberSurveys.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <TrendingUp size={32} className="mx-auto mb-3 text-zinc-600" />
              <p className="text-sm text-zinc-400">Este usuario aún no ha realizado encuestas.</p>
            </div>
          ) : (
            <>
              <SurveyLineChart data={memberSurveys} />

              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Historial ({filteredMemberSurveys.length} análisis en este rango)</h4>

                {/* Member History Date Filter */}
                <div className="mb-4 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {presetButtons.map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => setMemberHistoryPreset(btn.key)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${memberHistoryPreset === btn.key
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                          }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {memberHistoryPreset === "custom" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={memberHistoryCustomFrom}
                        onChange={(e) => setMemberHistoryCustomFrom(e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                        placeholder="Desde"
                      />
                      <span className="text-xs text-zinc-500">—</span>
                      <input
                        type="date"
                        value={memberHistoryCustomTo}
                        onChange={(e) => setMemberHistoryCustomTo(e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                        placeholder="Hasta"
                      />
                    </div>
                  )}
                </div>

                {filteredMemberSurveys.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-500">
                    <p className="text-sm">No hay análisis en el rango seleccionado.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {[...paginatedMemberSurveys].reverse().map((survey, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5">
                          <span className="text-sm text-zinc-400">
                            {new Date(survey.date + "T00:00:00").toLocaleDateString("es-PE", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getScoreColor(survey.score)}`}>
                            {survey.score}% · {getScoreLabel(survey.score)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Member Pagination Controls */}
                    {memberTotalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                        <button
                          onClick={() => setMemberHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={memberHistoryPage === 1}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        <span className="text-xs text-zinc-500">
                          Página {memberHistoryPage} de {memberTotalPages}
                        </span>
                        <button
                          onClick={() => setMemberHistoryPage((p) => Math.min(memberTotalPages, p + 1))}
                          disabled={memberHistoryPage === memberTotalPages}
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

          <button
            onClick={() => {
              setIsMemberChartOpen(false);
              setSelectedMember(null);
            }}
            className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}
