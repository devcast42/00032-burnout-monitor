"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import Modal from "@/components/Modal";
import BurnoutProfileCards from "@/components/BurnoutProfileCards";
import BurnoutDynamicForm from "@/components/BurnoutDynamicForm";
import BurnoutResult from "@/components/BurnoutResult";
import { User } from "@/lib/auth";
import { Home, Calendar, User as UserIcon, Video, Clock, Activity } from "lucide-react";

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

export default function UserDashboard({
  user,
  chain,
}: {
  user: User;
  chain: User[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{ prediction: number; burnout_probability: number; status: string } | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (signal?: AbortSignal) => {
    setLoadingAppointments(true);
    try {
      const res = await fetch("/api/appointments", { signal });
      if (res.status === 401) return;
      const data = await res.json();
      if (!signal?.aborted) {
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    } finally {
      if (!signal?.aborted) setLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "appointments") return;
    const controller = new AbortController();
    fetchAppointments(controller.signal);
    return () => controller.abort();
  }, [activeTab, fetchAppointments]);

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


  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-20">
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-lg">
          {activeTab === "home" && (
            <div className="space-y-8">
              <h1 className="text-2xl font-semibold text-white">Hola, {user.name}</h1>

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
                            appt.status,
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

              <BurnoutProfileCards />
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
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === "appointments"
              ? "text-white"
              : "text-zinc-500 hover:text-zinc-300"
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


      <Modal
        isOpen={isAnalyzeOpen}
        onClose={() => setIsAnalyzeOpen(false)}
        title="Análisis de Burnout"
      >
        <BurnoutDynamicForm
          onResult={(result) => {
            setIsAnalyzeOpen(false);
            setPredictionResult(result);
            setIsResultOpen(true);
          }}
          onError={(msg) => {
            setIsAnalyzeOpen(false);
            setAnalyzeError(msg);
          }}
        />
      </Modal>

      <Modal
        isOpen={isResultOpen}
        onClose={() => setIsResultOpen(false)}
        title="Resultado del Análisis"
      >
        {predictionResult && (
          <BurnoutResult
            result={predictionResult}
            onClose={() => setIsResultOpen(false)}
            onScheduleAppointment={() => {
              setIsResultOpen(false);
              router.push("/user/appointments/new");
            }}
          />
        )}
      </Modal>
    </div>
  );
}
