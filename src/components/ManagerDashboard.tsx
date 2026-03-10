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
import { Home, Calendar, User as UserIcon, Video, Clock, ChevronRight, TrendingUp, Activity, FileText, Search, Sparkles, LayoutDashboard, Users, UserCircle, Loader2, LogOut, ArrowUpRight } from "lucide-react";

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
  if (score <= 25) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10";
  if (score <= 45) return "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/10";
  if (score <= 65) return "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10";
  if (score <= 80) return "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/10";
  return "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10";
}

function getScoreLabel(score: number) {
  if (score <= 25) return "Sin riesgo";
  if (score <= 45) return "Riesgo bajo";
  if (score <= 65) return "Riesgo moderado";
  if (score <= 80) return "Riesgo severo";
  return "Riesgo muy severo";
}

function getScoreBadgeColor(score: number) {
  return getScoreColor(score);
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

  // Own survey state
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

  // History filtering and pagination state
  type FilterPreset = "7d" | "30d" | "90d" | "all" | "custom";
  const [historyPreset, setHistoryPreset] = useState<FilterPreset>("all");
  const [historyCustomFrom, setHistoryCustomFrom] = useState("");
  const [historyCustomTo, setHistoryCustomTo] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // History filtering and pagination state for Member
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

  const filteredTeam = useMemo(() => {
    if (!teamSearchQuery.trim()) return team;
    const query = teamSearchQuery.toLowerCase();
    return team.filter((m) =>
      m.name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query)
    );
  }, [team, teamSearchQuery]);

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
      case "SCHEDULED": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/10";
      case "IN_PROGRESS": return "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10";
      case "COMPLETED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10";
      case "CANCELLED": return "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10";
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

  const chartData = reports.map((r) => ({
    date: r.survey.date,
    score: r.score,
  }));

  return (
    <div className="relative flex min-h-screen flex-col bg-[#050507] pb-24 overflow-hidden">
      <div className="absolute top-0 left-0 h-[600px] w-[600px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      <div className="flex-1 px-6 py-10 relative z-10">
        <div className="mx-auto w-full max-w-5xl">
          {activeTab === "home" && (
            <div className="space-y-10">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1 text-indigo-400">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Panel de Control</span>
                  </div>
                  <h1 className="text-gradient text-4xl font-black tracking-tight">Hola, {user.name}</h1>
                  <p className="mt-2 text-sm text-zinc-500 font-medium max-w-md">
                    Gestiona el bienestar de tu equipo y supervisa las métricas de burnout.
                  </p>
                </div>
                <div className="glass premium-border flex items-center gap-4 rounded-2xl p-4 shadow-xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Tu Equipo</div>
                    <div className="text-xl font-black text-white text-right">{team.length} Integrantes</div>
                  </div>
                </div>
              </header>

              <section className="glass premium-border rounded-3xl overflow-hidden shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 border-b border-white/5 bg-white/[0.02]">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Mi Equipo</h2>
                    <p className="text-sm text-zinc-500 font-medium">Supervisión de salud preventiva</p>
                  </div>
                  <div className="relative w-full sm:w-72 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                    <input
                      type="text"
                      placeholder="Filtrar integrantes..."
                      value={teamSearchQuery}
                      onChange={(e) => setTeamSearchQuery(e.target.value)}
                      className="w-full rounded-2xl border border-white/5 bg-black/40 py-2.5 pl-11 pr-4 text-xs font-bold text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                  </div>
                </div>

                <div className="p-2">
                  {filteredTeam.length === 0 ? (
                    <div className="py-20 text-center">
                      <Search className="mx-auto mb-4 text-zinc-800" size={48} />
                      <p className="text-sm text-zinc-500 font-medium">Sin resultados.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl">
                      <table className="w-full text-left text-sm">
                        <thead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white/[0.01]">
                          <tr>
                            <th className="px-6 py-4">Integrante</th>
                            <th className="px-6 py-4">Última Encuesta</th>
                            <th className="px-6 py-4 text-right">Nivel de Riesgo</th>
                            <th className="px-6 py-4 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                          {filteredTeam.map((member) => (
                            <tr key={member.id} onClick={() => handleMemberClick(member)} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-white/5 font-bold text-zinc-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner">
                                    {member.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{member.name}</div>
                                    <div className="text-[10px] text-zinc-500 font-medium">{member.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-zinc-400 font-semibold text-xs">
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-zinc-600" />
                                  {member.lastSurvey ? new Date(member.lastSurvey.date + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long" }) : "Pendiente"}
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                {member.lastSurvey ? (
                                  <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${getScoreColor(member.lastSurvey.score)} shadow-sm`}>
                                    {member.lastSurvey.score}%
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-800">Inactivo</span>
                                )}
                              </td>
                              <td className="px-6 py-5">
                                <ChevronRight size={16} className="text-zinc-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Activity size={14} className="text-indigo-400" /> Auto-Análisis
                  </h2>
                  <button onClick={() => { setAnalyzeError(null); setIsAnalyzeOpen(true); }} className="glass premium-border group relative w-full rounded-3xl p-8 text-center transition-all hover:bg-indigo-500 hover:scale-[1.02] shadow-2xl">
                    <Activity className="mx-auto mb-4 text-indigo-400 group-hover:text-white transition-all" size={48} />
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-white transition-colors">Iniciar Test</div>
                  </button>
                </div>
                <div className="md:col-span-2 space-y-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <TrendingUp size={14} className="text-indigo-400" /> Evolución Personal
                  </h2>
                  <div className="glass premium-border rounded-3xl p-6 h-[260px] shadow-2xl overflow-hidden">
                    <SurveyLineChart data={chartData} />
                  </div>
                </div>
              </div>

              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <FileText size={14} className="text-indigo-400" /> Historial de Análisis
                  </h2>
                  {!loadingReports && reports.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="glass premium-border flex p-1 rounded-xl shadow-inner">
                        {presetButtons.map((btn) => (
                          <button key={btn.key} onClick={() => setHistoryPreset(btn.key)} className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${historyPreset === btn.key ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}>
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {loadingReports ? (
                  <div className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto mb-4 opacity-30 text-indigo-400" /></div>
                ) : reports.length === 0 ? (
                  <div className="glass premium-border rounded-3xl p-12 text-center shadow-xl text-zinc-500 italic">Sin datos de historial.</div>
                ) : (
                  <div className="space-y-3">
                    {paginatedReports.map((report) => (
                      <button key={report.id} onClick={() => { setSelectedReport(report); setIsReportViewOpen(true); }} className="glass premium-border group flex items-center justify-between rounded-2xl p-5 text-left transition-all hover:bg-white/[0.04] active:scale-[0.99] shadow-lg">
                        <div className="flex items-center gap-5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-white/5 text-zinc-500 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner"><FileText size={20} /></div>
                          <div>
                            <div className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{new Date(report.survey.date + "T00:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "long" })}</div>
                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Burnout Score: {report.score}%</div>
                          </div>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${getScoreBadgeColor(report.score)} shadow-sm`}>{getScoreLabel(report.score)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header>
                <div className="flex items-center gap-2 mb-1 text-indigo-400">
                  <Video size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sesiones Virtuales</span>
                </div>
                <h1 className="text-gradient text-4xl font-black tracking-tight">Citas Médicas</h1>
              </header>

              {loadingAppointments ? (
                <div className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto mb-4 opacity-30 text-indigo-400" /></div>
              ) : appointments.length === 0 ? (
                <div className="glass premium-border rounded-3xl p-20 text-center shadow-2xl">
                  <Calendar size={48} className="mx-auto mb-4 text-zinc-800" />
                  <p className="text-zinc-500 font-medium">No tienes citas programadas.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="glass premium-border rounded-3xl p-6 shadow-xl space-y-5 transition-all hover:scale-[1.01]">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">{appt.doctor.specialty}</div>
                          <h3 className="text-lg font-black text-white tracking-tight leading-none">{appt.doctor.name}</h3>
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(appt.status)} shadow-sm`}>
                          {getStatusLabel(appt.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5"><Calendar size={12} className="text-zinc-600" /> {new Date(appt.date).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1.5"><Clock size={12} className="text-zinc-600" /> {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      {(appt.status === "SCHEDULED" || appt.status === "IN_PROGRESS") && (
                        <button onClick={() => router.push(`/user/appointments/${appt.id}/call`)} className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                          <Video size={14} /> Entrar a Videollamada
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "user" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header>
                <div className="flex items-center gap-2 mb-1 text-indigo-400">
                  <UserCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Configuración</span>
                </div>
                <h1 className="text-gradient text-4xl font-black tracking-tight">Mi Perfil</h1>
              </header>

              <div className="glass premium-border rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
                  <UserCircle size={120} strokeWidth={1} />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                  <div className="h-24 w-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl font-black text-indigo-400 shadow-inner">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-center sm:text-left space-y-2">
                    <h2 className="text-2xl font-black text-white tracking-tight">{user.name}</h2>
                    <div className="text-sm text-zinc-500 font-medium">{user.email}</div>
                    <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest text-indigo-400 shadow-sm">
                      {user.role} · Burnout Monitor Pro
                    </div>
                  </div>
                </div>
                <div className="relative z-10 mt-10 pt-8 border-t border-white/5 flex justify-end">
                  <LogoutButton />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-lg">
        <div className="glass premium-border rounded-3xl p-2 shadow-2xl flex items-center justify-between bg-black/40">
          <button onClick={() => setActiveTab("home")} className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-300 ${activeTab === "home" ? "bg-white text-black shadow-xl scale-100" : "text-zinc-500 hover:text-white hover:bg-white/5 active:scale-95"}`}>
            <LayoutDashboard size={20} strokeWidth={activeTab === "home" ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">Inicio</span>
          </button>
          <button onClick={() => setActiveTab("appointments")} className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-300 ${activeTab === "appointments" ? "bg-white text-black shadow-xl scale-100" : "text-zinc-500 hover:text-white hover:bg-white/5 active:scale-95"}`}>
            <Calendar size={20} strokeWidth={activeTab === "appointments" ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">Sesiones</span>
          </button>
          <button onClick={() => setActiveTab("user")} className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-300 ${activeTab === "user" ? "bg-white text-black shadow-xl scale-100" : "text-zinc-500 hover:text-white hover:bg-white/5 active:scale-95"}`}>
            <UserIcon size={20} strokeWidth={activeTab === "user" ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">Perfil</span>
          </button>
        </div>
      </nav>

      {/* ═══ Modals ═══ */}
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
          onError={(msg) => { setIsAnalyzeOpen(false); setAnalyzeError(msg); }}
        />
      </Modal>

      <Modal isOpen={isResultOpen} onClose={() => { setIsResultOpen(false); if (predictionResult?.report) { setIsLatestReportOpen(true); } else { fetchReports(); } }} title="Resultados">
        {predictionResult && <BurnoutResult result={predictionResult} onClose={() => setIsResultOpen(false)} />}
      </Modal>

      <Modal isOpen={isLatestReportOpen} onClose={() => { setIsLatestReportOpen(false); fetchReports(); }} title="Informe de IA">
        {latestReport && <SurveyReportView report={latestReport.report} score={latestReport.score} reportId={latestReport.reportId} onClose={() => { setIsLatestReportOpen(false); fetchReports(); }} />}
      </Modal>

      <Modal isOpen={isReportViewOpen} onClose={() => { setIsReportViewOpen(false); setSelectedReport(null); }} title="Detalle del Informe">
        {selectedReport && selectedReport.report ? (
          <SurveyReportView report={selectedReport.report} score={selectedReport.score} date={selectedReport.createdAt} reportId={selectedReport.id} onClose={() => { setIsReportViewOpen(false); setSelectedReport(null); }} />
        ) : selectedReport ? (
          <div className="p-8 text-center space-y-4">
            <div className="text-4xl">⏳</div>
            <p className="text-sm text-zinc-400 font-medium tracking-tight">El informe detallado no está disponible para este registro.</p>
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Puntuación: {selectedReport.score}%</div>
            <button onClick={() => { setIsReportViewOpen(false); setSelectedReport(null); }} className="w-full bg-white text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95">Cerrar</button>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={isMemberChartOpen} onClose={() => { setIsMemberChartOpen(false); setSelectedMember(null); setMemberSurveys([]); }} title={selectedMember ? `${selectedMember.name}` : "Análisis de Equipo"}>
        <div className="space-y-6">
          {selectedMember && (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center font-black text-indigo-400">{selectedMember.name.charAt(0)}</div>
              <div className="flex-1">
                <div className="text-sm font-black text-white leading-none mb-1">{selectedMember.name}</div>
                <div className="text-[10px] text-zinc-500 font-medium">{selectedMember.email}</div>
              </div>
              {selectedMember.lastSurvey && <div className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${getScoreColor(selectedMember.lastSurvey.score)} shadow-sm`}>{selectedMember.lastSurvey.score}%</div>}
            </div>
          )}

          {loadingMemberSurveys ? (
            <div className="py-12 text-center"><Loader2 size={24} className="animate-spin mx-auto opacity-30 text-indigo-400" /></div>
          ) : memberSurveys.length === 0 ? (
            <div className="py-12 text-center text-zinc-600 italic text-sm">Este usuario aún no tiene registros.</div>
          ) : (
            <>
              <div className="h-[200px]"><SurveyLineChart data={memberSurveys} /></div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Historial Reciente</h4>
                {memberSurveys.slice(-5).reverse().map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-zinc-400">{new Date(s.date + "T00:00:00").toLocaleDateString()}</span>
                    <span className={`text-[10px] font-black ${getScoreColor(s.score).split(' ').pop()}`}>{s.score}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <button onClick={() => { setIsMemberChartOpen(false); setSelectedMember(null); }} className="w-full bg-white text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Cerrar Panel</button>
        </div>
      </Modal>
    </div>
  );
}
