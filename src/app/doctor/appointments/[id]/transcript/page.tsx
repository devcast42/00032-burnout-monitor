"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, Stethoscope } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Recording = {
  id: string;
  audioUrl: string | null;
  transcript: string | null;
  diagnosis: string | null;
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => router.push("/doctor/appointments")}
          className="mb-6 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Volver a mis citas
        </button>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-white">
            Transcripción de la sesión
          </h1>
          {appointment && (
            <div className="mt-3 space-y-1 text-sm text-zinc-400">
              <p>
                <span className="font-medium text-zinc-300">Paciente:</span>{" "}
                {appointment.patientName}
              </p>
              <p>
                <span className="font-medium text-zinc-300">Fecha:</span>{" "}
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
              <div className="rounded-lg border border-dashed border-zinc-700 px-6 py-8 text-center">
                <p className="text-sm text-zinc-500">
                  No hay grabación disponible para esta cita.
                </p>
              </div>
            ) : (
              <>
                {recording.audioUrl && (
                  <div className="mb-4">
                    <h2 className="mb-2 text-sm font-semibold text-zinc-300">
                      Audio de la sesión
                    </h2>
                    <audio controls className="w-full" src={recording.audioUrl}>
                      Tu navegador no soporta audio.
                    </audio>
                  </div>
                )}

                {/* AI Diagnosis Section */}
                {recording.diagnosis && (
                  <div className="mb-6 rounded-xl border border-blue-900/40 bg-blue-950/20 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="text-blue-400" size={20} />
                      <h2 className="text-base font-semibold text-blue-100">
                        Diagnóstico Asistido por IA
                      </h2>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none prose-headings:text-blue-200 prose-p:text-zinc-300 prose-li:text-zinc-300">
                      <ReactMarkdown>{recording.diagnosis}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Transcript Section */}
                <div>
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                    <Stethoscope size={16} />
                    Transcripción
                  </h2>
                  {recording.transcript ? (
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                        {recording.transcript}
                      </p>
                      {recording.transcribedAt && (
                        <p className="mt-3 text-xs text-zinc-500">
                          Transcrito:{" "}
                          {new Date(recording.transcribedAt).toLocaleString("es-PE")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-zinc-700 px-6 py-8 text-center">
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
