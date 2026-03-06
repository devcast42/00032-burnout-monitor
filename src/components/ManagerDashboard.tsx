"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import { TeamMember } from "@/lib/manager";
import LogoutButton from "./LogoutButton";
import SurveyForm from "./SurveyForm";
import SurveyHistory from "./SurveyHistory";
import SurveyLineChart from "./SurveyLineChart";
import Modal from "./Modal";
import { Home, Calendar, User as UserIcon, Video, Clock, ChevronRight, TrendingUp } from "lucide-react";

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

  // Member chart modal state
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberSurveys, setMemberSurveys] = useState<MemberSurveyData[]>([]);
  const [loadingMemberSurveys, setLoadingMemberSurveys] = useState(false);
  const [isMemberChartOpen, setIsMemberChartOpen] = useState(false);

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

  const handleMemberClick = useCallback(async (member: TeamMember) => {
    setSelectedMember(member);
    setIsMemberChartOpen(true);
    setLoadingMemberSurveys(true);
    setMemberSurveys([]);

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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Mi Equipo</h2>
                  <span className="text-sm text-zinc-500">{team.length} usuario{team.length !== 1 ? "s" : ""}</span>
                </div>

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
                            <th className="px-6 py-3 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                          {team.map((member) => (
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
                      {team.map((member) => (
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

      {/* Modal for team member score evolution */}
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
          {/* Member info header */}
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

          {/* Chart */}
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

              {/* Survey history list */}
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Historial ({memberSurveys.length} análisis)</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[...memberSurveys].reverse().map((survey, idx) => (
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
