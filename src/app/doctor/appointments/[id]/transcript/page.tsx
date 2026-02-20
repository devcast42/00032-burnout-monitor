"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

type Recording = {
 id: string;
 audioUrl: string | null;
 transcript: string | null;
 transcribedAt: string | null;
};

type Appointment = {
 id: string;
 patientName: string;
 patientEmail: string;
 date: string;
 doctor: { name: string; specialty: string };
};

type PageProps = {
 params: Promise<{ id: string }>;
};

export default function TranscriptPage({ params }: PageProps) {
 const { id } = use(params);
 const router = useRouter();
 const [appointment, setAppointment] = useState<Appointment | null>(null);
 const [recording, setRecording] = useState<Recording | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  Promise.all([
   fetch(`/api/appointments/${id}`).then((r) => r.json()),
   fetch(`/api/appointments/${id}/recording`).then((r) =>
    r.ok ? r.json() : { recording: null },
   ),
  ])
   .then(([apptData, recData]) => {
    setAppointment(apptData.appointment || null);
    setRecording(recData.recording || null);
    setLoading(false);
   })
   .catch(() => setLoading(false));
 }, [id]);

 if (loading) {
  return (
   <div className="flex min-h-screen items-center justify-center bg-zinc-50">
    <p className="text-sm text-zinc-400">Cargando...</p>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-zinc-50 px-6 py-12">
   <div className="mx-auto max-w-3xl">
    <button
     onClick={() => router.push("/doctor/appointments")}
     className="mb-6 text-sm text-zinc-500 transition hover:text-zinc-900"
    >
     ← Volver a mis citas
    </button>

    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
     <h1 className="text-2xl font-semibold text-zinc-900">
      Transcripción de la sesión
     </h1>
     {appointment && (
      <div className="mt-3 space-y-1 text-sm text-zinc-600">
       <p>
        <span className="font-medium text-zinc-700">Paciente:</span>{" "}
        {appointment.patientName}
       </p>
       <p>
        <span className="font-medium text-zinc-700">Fecha:</span>{" "}
        {new Date(appointment.date).toLocaleDateString("es-PE", {
         weekday: "long",
         year: "numeric",
         month: "long",
         day: "numeric",
         hour: "2-digit",
         minute: "2-digit",
        })}
       </p>
      </div>
     )}

     <div className="mt-6">
      {!recording ? (
       <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-8 text-center">
        <p className="text-sm text-zinc-500">
         No hay grabación disponible para esta cita.
        </p>
       </div>
      ) : (
       <>
        {recording.audioUrl && (
         <div className="mb-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">
           Audio de la sesión
          </h2>
          <audio controls className="w-full" src={recording.audioUrl}>
           Tu navegador no soporta audio.
          </audio>
         </div>
        )}

        <div>
         <h2 className="mb-2 text-sm font-semibold text-zinc-700">
          Transcripción
         </h2>
         {recording.transcript ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
           <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
            {recording.transcript}
           </p>
           {recording.transcribedAt && (
            <p className="mt-3 text-xs text-zinc-400">
             Transcrito:{" "}
             {new Date(recording.transcribedAt).toLocaleString("es-PE")}
            </p>
           )}
          </div>
         ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-8 text-center">
           <p className="text-sm text-zinc-500">
            La transcripción aún no está disponible. Asegúrate de configurar la
            GEMINI_API_KEY.
           </p>
          </div>
         )}
        </div>
       </>
      )}
     </div>
    </div>
   </div>
  </div>
 );
}
