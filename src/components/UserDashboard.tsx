"use client";

import { useState } from "react";
import SurveyForm from "@/components/SurveyForm";
import SurveyHistory from "@/components/SurveyHistory";
import { User } from "@/lib/auth";

export default function UserDashboard({ user, chain }: { user: User, chain: User[] }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-5xl space-y-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-zinc-900">Panel de Usuario</h1>
            <div className="text-sm text-zinc-500">
              {user.name} ({user.email})
            </div>
          </div>
          
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-zinc-900">Jerarquía de managers</h2>
            {chain.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-600">Sin manager asignado.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {chain.map((manager) => (
                  <li key={manager.id}>
                    {manager.name} · {manager.email}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Nueva Encuesta</h2>
            <SurveyForm onSuccess={() => setRefreshKey((k) => k + 1)} />
          </div>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Historial</h2>
            <SurveyHistory refreshKey={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
}
