"use client";

import { useEffect, useState } from "react";

type Survey = {
  id: string;
  date: string;
  score: number;
  answers: number[];
  created_at: string;
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

export default function SurveyHistory({ refreshKey }: { refreshKey: number }) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/surveys")
      .then((res) => res.json())
      .then((data) => {
        if (data.surveys) setSurveys(data.surveys);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <div className="text-center py-4 text-zinc-400">Cargando historial...</div>;
  if (surveys.length === 0) return <div className="text-center py-4 text-zinc-500">No hay encuestas registradas.</div>;

  return (
    <div className="space-y-4">
      {surveys.map((survey) => (
        <div key={survey.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
          <div>
            <div className="text-sm font-medium text-zinc-200">
              {new Date(survey.created_at).toLocaleDateString()}
            </div>
            <div className="text-xs text-zinc-500">
              Puntuación: {survey.score}
            </div>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-medium ${getScoreColor(survey.score)}`}>
            {getScoreLabel(survey.score)}
          </div>
        </div>
      ))}
    </div>
  );
}
