"use client";

import { useState, useEffect } from "react";

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

type AutoAppointment = {
 id: string;
 doctorName: string;
 specialty: string;
 date: string;
};

export default function SurveyForm({
 onSuccess,
 setFooterContent,
}: {
 onSuccess: () => void;
 setFooterContent?: (content: React.ReactNode) => void;
}) {
 const [answers, setAnswers] = useState<number[]>(new Array(15).fill(0));
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [autoAppointment, setAutoAppointment] = useState<AutoAppointment | null>(
  null,
 );

 const calculateScore = () => answers.reduce((a, b) => a + b, 0);

 const handleSubmit = async (e?: React.FormEvent) => {
  e?.preventDefault();
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

   const data = await response.json();

   if (data.autoAppointment) {
    setAutoAppointment(data.autoAppointment);
    // Don't close the modal yet — show the appointment notification first
   } else {
    onSuccess();
   }
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

 useEffect(() => {
  if (setFooterContent) {
   if (autoAppointment) {
    setFooterContent(
     <button
      onClick={onSuccess}
      className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
     >
      Entendido
     </button>,
    );
   } else {
    setFooterContent(
     <button
      onClick={() => handleSubmit()}
      disabled={loading}
      className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
     >
      {loading ? "Enviando..." : "Enviar Encuesta"}
     </button>,
    );
   }
  }
 }, [loading, answers, autoAppointment]);

 if (autoAppointment) {
  const apptDate = new Date(autoAppointment.date);
  return (
   <div className="space-y-6">
    <div className="rounded-xl border border-yellow-800 bg-yellow-900/30 p-5 space-y-3">
     <div className="flex items-center gap-2 text-yellow-200">
      <span className="text-xl">⚠️</span>
      <h3 className="font-semibold">Nivel de estrés alto detectado</h3>
     </div>
     <p className="text-sm text-yellow-100/80">
      Tu puntuación ({calculateScore()}/75) indica un nivel alto de burnout. Se
      ha agendado automáticamente una cita para ti.
     </p>
    </div>

    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
     <h3 className="font-semibold text-white">Cita agendada</h3>
     <div className="space-y-2 text-sm text-zinc-400">
      <div>👨‍⚕️ {autoAppointment.doctorName}</div>
      <div className="text-xs text-zinc-500">{autoAppointment.specialty}</div>
      <div>
       📅{" "}
       {apptDate.toLocaleDateString("es-PE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
       })}
      </div>
      <div>
       🕐{" "}
       {apptDate.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
       })}
      </div>
     </div>
    </div>

    {!setFooterContent && (
     <button
      onClick={onSuccess}
      className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
     >
      Entendido
     </button>
    )}
   </div>
  );
 }

 return (
  <div className="space-y-6">
   <p className="text-sm text-zinc-400">
    Califica del 1 (Nunca) al 5 (Muy a menudo).
   </p>

   {error && (
    <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-200 border border-red-800">
     {error}
    </div>
   )}

   <div className="space-y-8">
    {questions.map((q, index) => (
     <div key={index} className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">
       {index + 1}. {q}
      </label>
      <div className="flex justify-between gap-2">
       {[1, 2, 3, 4, 5].map((val) => (
        <button
         key={val}
         type="button"
         onClick={() => {
          const newAnswers = [...answers];
          newAnswers[index] = val;
          setAnswers(newAnswers);
         }}
         className={`
                    flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors
                    ${
                     answers[index] === val
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                    }
                  `}
        >
         {val}
        </button>
       ))}
      </div>
     </div>
    ))}
   </div>

   {!setFooterContent && (
    <button
     onClick={() => handleSubmit()}
     disabled={loading}
     className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-6"
    >
     {loading ? "Enviando..." : "Enviar Encuesta"}
    </button>
   )}
  </div>
 );
}
