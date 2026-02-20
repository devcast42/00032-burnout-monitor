"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import { TeamMember } from "@/lib/manager";
import LogoutButton from "./LogoutButton";
import SurveyForm from "./SurveyForm";
import SurveyHistory from "./SurveyHistory";
import Modal from "./Modal";
import { Home, Calendar, User as UserIcon, Video, Clock } from "lucide-react";

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

function getScoreColor(score: number) {
  if (score <= 18) return "bg-green-900/50 text-green-200 border border-green-800";
  if (score <= 32) return "bg-blue-900/50 text-blue-200 border border-blue-800";
  if (score <= 49) return "bg-yellow-900/50 text-yellow-200 border border-yellow-800";
  if (score <= 59) return "bg-orange-900/50 text-orange-200 border border-orange-800";
  return "bg-red-900/50 text-red-200 border border-red-800";
}

function getScoreLabel(score: number) {
  if (score <= 18) return "Sin riesgo";
  if (score <= 32) return "Riesgo bajo";
  if (score <= 49) return "Riesgo moderado";
  if (score <= 59) return "Riesgo severo";
  return "Riesgo muy severo";
}

export default function ManagerDashboard({
  user,
  team,
}: {
  user: User;
  team: TeamMember[];
}) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [modalFooter, setModalFooter] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (activeTab === "appointments") {
      setLoadingAppointments(true);
      fetch("/api/appointments")
        .then((res) => {
          if (res.status === 401) {
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data) setAppointments(data.appointments || []);
        })
        .finally(() => setLoadingAppointments(false));
    }
  }, [activeTab]);

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

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-20">
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl">
          {activeTab === "home" && (
            <div className="space-y-8">
              <h1 className="text-2xl font-semibold text-white">Hola, {user.name}</h1>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-white mb-6">Mi Equipo</h2>
                
                {team.length === 0 ? (
                  <p className="text-zinc-500">No tienes usuarios asignados.</p>
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                          {team.map((member) => (
                            <tr key={member.id} className="hover:bg-zinc-800/50 transition-colors">
                              <td className="px-6 py-4 font-medium text-white">{member.name}</td>
                              <td className="px-6 py-4">{member.email}</td>
                              <td className="px-6 py-4">
                                {member.lastSurvey
                                  ? new Date(member.lastSurvey.date).toLocaleDateString()
                                  : "Nunca"}
                              </td>
                              <td className="px-6 py-4">
                                {member.lastSurvey ? (
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getScoreColor(
                                      member.lastSurvey.score
                                    )}`}
                                  >
                                    {getScoreLabel(member.lastSurvey.score)}
                                  </span>
                                ) : (
                                  <span className="text-zinc-600 italic">Sin datos</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                      {team.map((member) => (
                        <div key={member.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
                          <div>
                            <div className="font-medium text-white">{member.name}</div>
                            <div className="text-sm text-zinc-500">{member.email}</div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-zinc-800/50">
                            <span className="text-zinc-400">Última encuesta:</span>
                            <span className="text-zinc-200">
                              {member.lastSurvey
                                ? new Date(member.lastSurvey.date).toLocaleDateString()
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
                                {getScoreLabel(member.lastSurvey.score)}
                              </span>
                            ) : (
                              <span className="text-zinc-600 italic">Sin datos</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-white">Encuesta Diaria</h2>
                  <button
                    onClick={() => setIsSurveyOpen(true)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="mb-2 text-3xl text-zinc-500 group-hover:text-white transition-colors">+</div>
                    <div className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">
                      Realizar nueva encuesta
                    </div>
                  </button>
                </div>
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-white">Historial</h2>
                  <SurveyHistory refreshKey={refreshKey} />
                </div>
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
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              activeTab === "home" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Home size={24} />
            <span className="text-xs font-medium">Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              activeTab === "appointments" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Calendar size={24} />
            <span className="text-xs font-medium">Citas</span>
          </button>
          
          <button
            onClick={() => setActiveTab("user")}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              activeTab === "user" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <UserIcon size={24} />
            <span className="text-xs font-medium">Usuario</span>
          </button>
        </div>
      </nav>

      <Modal 
        isOpen={isSurveyOpen} 
        onClose={() => setIsSurveyOpen(false)}
        title="Nueva Encuesta Diaria"
        footer={modalFooter}
      >
        <SurveyForm
          onSuccess={() => {
            setRefreshKey((k) => k + 1);
            setIsSurveyOpen(false);
          }}
          setFooterContent={setModalFooter}
        />
      </Modal>
    </div>
  );
}
