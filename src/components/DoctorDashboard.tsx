"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import {
  Calendar,
  Video,
  Clock,
  Stethoscope,
  Users,
  AlertTriangle,
  TrendingDown,
  Activity,
  ArrowRight,
  LayoutDashboard,
  ExternalLink,
  Loader2
} from "lucide-react";

type Appointment = {
  id: string;
  date: string;
  status: string;
  patientName: string;
  patientEmail: string;
  jitsiRoomName: string;
  doctor: { name: string; specialty: string };
};

type DoctorStats = {
  totalPatients: number;
  avgBurnout: number;
  distribution: { low: number; medium: number; high: number };
  weeklyTrend: { week: string; score: number }[];
  riskPatients: { name: string; score: number; email: string }[];
};

export default function DoctorDashboard({
  user,
}: {
  user: User;
  chain: User[];
}) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    // Fetch Appointments
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

    // Fetch Stats
    fetch("/api/doctor/stats", { signal: controller?.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setLoadingStats(false));

    return () => controller.abort();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "IN_PROGRESS":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
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
    (a) => a.status === "SCHEDULED" || a.status === "IN_PROGRESS"
  );
  const completedAppointments = appointments.filter(
    (a) => a.status === "COMPLETED"
  );

  return (
    <div className="relative flex-1 px-6 py-10 min-h-screen">
      {/* Ambient background effects */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto w-full max-w-2xl relative z-10">
        <div className="space-y-10">
          <header className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LayoutDashboard size={16} className="text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Panel de Control</span>
              </div>
              <h1 className="text-gradient text-4xl font-bold">Dr. {user.name}</h1>
              <p className="mt-1 text-sm text-zinc-400">Bienvenido de nuevo a tu gestión médica.</p>
            </div>
            <div className="hidden sm:block">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-[#050507] bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                    P{i}
                  </div>
                ))}
                <div className="h-8 w-8 rounded-full border-2 border-[#050507] bg-indigo-900 flex items-center justify-center text-[8px] font-bold text-indigo-300">
                  +12
                </div>
              </div>
            </div>
          </header>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Pacientes", value: stats?.totalPatients || 0, icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10", sub: "Total" },
              { label: "Riesgo Alto", value: stats?.distribution.high || 0, icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10", sub: "Críticos" },
              { label: "Promedio", value: `${stats?.avgBurnout || 0}%`, icon: Activity, color: "text-amber-400", bg: "bg-amber-500/10", sub: "Global" },
              { label: "Citas Hoy", value: scheduledAppointments.filter(a => new Date(a.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]).length, icon: Calendar, color: "text-emerald-400", bg: "bg-emerald-500/10", sub: "Sesiones" }
            ].map((s, i) => (
              <div key={i} className="glass premium-border rounded-2xl p-4 transition-all hover:translate-y-[-2px] hover:bg-white/[0.04]">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
                    <s.icon size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{s.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white tracking-tight">{s.value}</span>
                  <span className="text-[10px] text-zinc-500 font-medium uppercase">{s.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Burnout Distribution Breakdown */}
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-zinc-500" />
                Estado de Pacientes
              </h2>
              <div className="glass premium-border rounded-2xl p-6">
                <div className="flex h-2 w-full gap-1 overflow-hidden rounded-full bg-zinc-800/50 mb-8 p-[1px]">
                  <div
                    style={{ width: `${(stats?.distribution.high || 0) / (stats?.totalPatients || 1) * 100}%` }}
                    className="h-full bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)] transition-all duration-700"
                  />
                  <div
                    style={{ width: `${(stats?.distribution.medium || 0) / (stats?.totalPatients || 1) * 100}%` }}
                    className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all duration-700"
                  />
                  <div
                    style={{ width: `${(stats?.distribution.low || 0) / (stats?.totalPatients || 1) * 100}%` }}
                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-700"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Severo", val: stats?.distribution.high || 0, color: "text-rose-500" },
                    { label: "Moderado", val: stats?.distribution.medium || 0, color: "text-amber-500" },
                    { label: "Estable", val: stats?.distribution.low || 0, color: "text-emerald-500" }
                  ].map((d, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span className="text-[10px] text-zinc-500 font-semibold mb-1 uppercase tracking-tighter">{d.label}</span>
                      <span className={`text-lg font-bold ${d.color}`}>{d.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Patients At Risk List */}
            {stats && stats.riskPatients.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingDown size={14} className="text-zinc-500" />
                  Prioridad de Atención
                </h2>
                <div className="space-y-2">
                  {stats.riskPatients.slice(0, 4).map((patient, i) => (
                    <div
                      key={i}
                      className="glass premium-border rounded-xl p-3 flex items-center justify-between group cursor-pointer transition-all hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{patient.name}</div>
                          <div className="text-[10px] text-zinc-500 font-medium">{patient.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-black text-rose-500">{patient.score}%</div>
                          <div className="text-[8px] text-zinc-500 uppercase font-bold tracking-tighter">Score</div>
                        </div>
                        <ArrowRight size={14} className="text-zinc-700 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Upcoming appointments summary */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} className="text-zinc-500" />
                Citas Programadas
              </h2>
              {!loadingAppointments && scheduledAppointments.length > 0 && (
                <button
                  onClick={() => router.push("/doctor/appointments")}
                  className="text-[10px] font-bold text-indigo-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
                >
                  Ver Todo <ArrowRight size={10} />
                </button>
              )}
            </div>

            {loadingAppointments ? (
              <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-zinc-500 border border-white/5 italic">
                <Loader2 size={24} className="animate-spin mb-4 text-indigo-500/40" />
                Sincronizando agenda...
              </div>
            ) : scheduledAppointments.length === 0 ? (
              <div className="glass premium-border rounded-2xl p-12 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-700 mb-4">
                  <Stethoscope size={32} />
                </div>
                <p className="text-sm text-zinc-500 font-medium">No hay citas pendientes en tu calendario.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scheduledAppointments.slice(0, 2).map((appt) => (
                  <div
                    key={appt.id}
                    className="glass premium-border rounded-2xl p-5 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#050507] bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                            {appt.patientName.charAt(0)}
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border ${getStatusColor(appt.status)} shadow-sm`}
                        >
                          {getStatusLabel(appt.status)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight">{appt.patientName}</h3>
                        <p className="text-[10px] text-zinc-500 font-medium">{appt.patientEmail}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-6 text-[11px] font-semibold text-zinc-400">
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1.5 border border-white/5">
                          <Calendar size={12} className="text-indigo-400" />
                          <span>
                            {new Date(appt.date).toLocaleDateString("es-PE", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1.5 border border-white/5">
                          <Clock size={12} className="text-indigo-400" />
                          <span>
                            {new Date(appt.date).toLocaleTimeString("es-PE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/doctor/appointments/${appt.id}/call`)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg shadow-white/5"
                    >
                      <Video size={14} strokeWidth={3} />
                      Unirse a sesión
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick stats / History summary */}
          <footer className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pendientes</span>
                <span className="text-xl font-bold text-white">{scheduledAppointments.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Historial</span>
                <span className="text-xl font-bold text-white">{completedAppointments.length}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
              <Stethoscope size={12} />
              Securitas Medical
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
