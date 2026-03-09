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
  ArrowRight
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
    (a) => a.status === "SCHEDULED" || a.status === "IN_PROGRESS"
  );
  const completedAppointments = appointments.filter(
    (a) => a.status === "COMPLETED"
  );

  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-white">Dr. {user.name}</h1>
            <p className="text-sm text-zinc-500">Bienvenido a tu panel de control</p>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Users size={18} />
                </div>
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Pacientes</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{stats?.totalPatients || 0}</span>
                <span className="text-xs text-zinc-500 italic">Total</span>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                  <AlertTriangle size={18} />
                </div>
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Riesgo Alto</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{stats?.distribution.high || 0}</span>
                <span className="text-xs text-red-500/70">Criticos</span>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400">
                  <Activity size={18} />
                </div>
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Promedio</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{stats?.avgBurnout || 0}%</span>
                <span className="text-xs text-zinc-500">Global</span>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
                  <TrendingDown size={18} />
                </div>
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Citas Hoy</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {scheduledAppointments.filter(a => {
                    const today = new Date().toISOString().split('T')[0];
                    return new Date(a.date).toISOString().split('T')[0] === today;
                  }).length}
                </span>
                <span className="text-xs text-zinc-500">Sesiones</span>
              </div>
            </div>
          </div>

          {/* Burnout Distribution Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Estado de Pacientes</h2>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-zinc-800 mb-6">
                <div
                  style={{ width: `${(stats?.distribution.high || 0) / (stats?.totalPatients || 1) * 100}%` }}
                  className="h-full bg-red-500 transition-all duration-500"
                />
                <div
                  style={{ width: `${(stats?.distribution.medium || 0) / (stats?.totalPatients || 1) * 100}%` }}
                  className="h-full bg-yellow-500 transition-all duration-500"
                />
                <div
                  style={{ width: `${(stats?.distribution.low || 0) / (stats?.totalPatients || 1) * 100}%` }}
                  className="h-full bg-green-500 transition-all duration-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-zinc-500 mb-1">Severo</span>
                  <span className="text-sm font-bold text-red-500">{stats?.distribution.high || 0}</span>
                </div>
                <div className="flex flex-col items-center border-l border-zinc-800">
                  <span className="text-xs text-zinc-500 mb-1">Moderado</span>
                  <span className="text-sm font-bold text-yellow-500">{stats?.distribution.medium || 0}</span>
                </div>
                <div className="flex flex-col items-center border-l border-zinc-800">
                  <span className="text-xs text-zinc-500 mb-1">Estable</span>
                  <span className="text-sm font-bold text-green-500">{stats?.distribution.low || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Patients At Risk List */}
          {stats && stats.riskPatients.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Pacientes con mayor score</h2>
              <div className="space-y-2">
                {stats.riskPatients.map((patient, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{patient.name}</div>
                        <div className="text-[10px] text-zinc-500">{patient.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-red-400">{patient.score}%</div>
                      <ArrowRight size={14} className="text-zinc-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                    onClick={() => router.push("/doctor/appointments")}
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
      </div>
    </div>
  );
}
