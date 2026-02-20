"use client";

import { useState } from "react";
import { User } from "@/lib/auth";
import { TeamMember } from "@/lib/manager";
import LogoutButton from "./LogoutButton";
import SurveyForm from "./SurveyForm";
import SurveyHistory from "./SurveyHistory";
import Modal from "./Modal";

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);

  return (
    <div className="flex min-h-screen justify-center bg-zinc-950 px-6 py-12">
      <div className="w-full max-w-5xl space-y-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">Panel de Manager</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-zinc-400">
                {user.name} ({user.email})
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-white mb-6">Mi Equipo</h2>
          
          {team.length === 0 ? (
            <p className="text-zinc-500">No tienes usuarios asignados.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-800">
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

        <Modal isOpen={isSurveyOpen} onClose={() => setIsSurveyOpen(false)}>
          <SurveyForm
            onSuccess={() => {
              setRefreshKey((k) => k + 1);
              setIsSurveyOpen(false);
            }}
          />
        </Modal>
      </div>
    </div>
  );
}
