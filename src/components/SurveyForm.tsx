"use client";

import { useState } from "react";

const questions = [
  "I feel run down and drained of physical or emotional energy.",
  "I have negative thoughts about my job.",
  "I have harder and less sympathetic with people than perhaps they deserve.",
  "I am easily irritated by small problems, or by my co-workers and team.",
  "I feel misunderstood on unappreciated by my co-workers.",
  "I feel that I have no one to talk to.",
  "I feel that I am achieving less than I should.",
  "I feel that I am not getting what I want out of my job.",
  "Tengo problemas para dormir por pensar en el trabajo.",
  "Siento ansiedad al pensar en ir a trabajar.",
  "Me siento desconectado de mis compañeros.",
  "Siento que mi trabajo no tiene sentido.",
  "Me falta energía para ser productivo.",
  "Siento que estoy en el trabajo equivocado.",
  "Me siento frustrado con mi carrera profesional.",
];

export default function SurveyForm({ onSuccess }: { onSuccess: () => void }) {
  const [answers, setAnswers] = useState<number[]>(new Array(15).fill(0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnswer = (index: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const calculateScore = () => answers.reduce((a, b) => a + b, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (answers.some((a) => a === 0)) {
      setError("Por favor responde todas las preguntas.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          score: calculateScore(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al enviar la encuesta");
      }

      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-900">Encuesta Diaria de Burnout</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Califica del 1 (Nunca) al 5 (Muy a menudo).
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {questions.map((q, index) => (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium text-zinc-800">
              {index + 1}. {q}
            </label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((val) => (
                <label key={val} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${index}`}
                    value={val}
                    checked={answers[index] === val}
                    onChange={() => handleAnswer(index, val)}
                    className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <span className="text-sm text-zinc-600">{val}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar Encuesta"}
        </button>
      </form>
    </div>
  );
}
