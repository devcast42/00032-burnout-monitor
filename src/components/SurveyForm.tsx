"use client";

import { useState } from "react";

const questions = [
  "Me siento agotado y sin energía física o emocional.",
  "Tengo pensamientos negativos sobre mi trabajo.",
  "Soy más duro y menos comprensivo con las personas de lo que quizás merecen.",
  "Me irrito fácilmente por problemas pequeños o por mis compañeros de trabajo y equipo.",
  "Me siento incomprendido o no valorado por mis compañeros de trabajo.",
  "Siento que no tengo con quién hablar.",
  "Siento que estoy logrando menos de lo que debería.",
  "Siento que no estoy obteniendo lo que quiero de mi trabajo.",
  "Siento que estoy en la organización o profesión equivocada.",
  "Estoy frustrado con partes de mi trabajo.",
  "Siento que la política organizacional o la burocracia frustran mi capacidad de hacer un buen trabajo.",
  "Siento que hay más trabajo del que prácticamente tengo la capacidad de hacer.",
  "Siento que no tengo tiempo para hacer muchas de las cosas que son importantes para hacer un trabajo de buena calidad.",
  "Encuentro que no tengo tiempo para planificar tanto como me gustaría.",
  "Otras profesiones relativamente tienen más comodidad y flexibilidad.",
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-white">Encuesta Diaria de Burnout</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Califica del 1 (Nunca) al 5 (Muy a menudo).
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-900/50 p-3 text-sm text-red-200 border border-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {questions.map((q, index) => (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              {index + 1}. {q}
            </label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer group">
                  <div className={`
                    flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors
                    ${answers[index] === val 
                      ? "border-blue-500 bg-blue-500 text-white" 
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 group-hover:border-zinc-600 group-hover:text-zinc-200"}
                  `}>
                    {val}
                  </div>
                  <input
                    type="radio"
                    name={`q-${index}`}
                    value={val}
                    checked={answers[index] === val}
                    onChange={() => handleAnswer(index, val)}
                    className="sr-only"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          {loading ? "Enviando..." : "Enviar Encuesta"}
        </button>
      </form>
    </div>
  );
}
