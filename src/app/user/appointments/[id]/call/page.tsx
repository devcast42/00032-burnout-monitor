"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const JitsiRoom = dynamic(() => import("@/components/JitsiRoom"), {
 ssr: false,
 loading: () => (
  <div className="flex h-96 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
   <p className="text-sm text-zinc-400">Cargando videollamada...</p>
  </div>
 ),
});

type Appointment = {
 id: string;
 jitsiRoomName: string;
 patientName: string;
 status: string;
 doctor: { name: string; specialty: string };
};

type PageProps = {
 params: Promise<{ id: string }>;
};

export default function UserCallPage({ params }: PageProps) {
 const { id } = use(params);
 const router = useRouter();
 const [appointment, setAppointment] = useState<Appointment | null>(null);
 const [loading, setLoading] = useState(true);
 const [uploading, setUploading] = useState(false);
 const [uploaded, setUploaded] = useState(false);

 useEffect(() => {
  fetch(`/api/appointments/${id}`)
   .then((res) => res.json())
   .then((data) => {
    setAppointment(data.appointment || null);
    setLoading(false);
   })
   .catch(() => setLoading(false));
 }, [id]);

 const handleRecordingReady = useCallback(
  async (blob: Blob) => {
   setUploading(true);
   const formData = new FormData();
   formData.append("audio", blob, `recording-${id}.webm`);

   try {
    await fetch(`/api/appointments/${id}/recording`, {
     method: "POST",
     body: formData,
    });
    setUploaded(true);
   } catch (err) {
    console.error("Error subiendo grabación:", err);
   } finally {
    setUploading(false);
   }
  },
  [id],
 );

 const handleCallEnd = useCallback(() => {
  // Update status to COMPLETED
  fetch(`/api/appointments/${id}`, {
   method: "PATCH",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ status: "COMPLETED" }),
  }).then(() => {
   setTimeout(() => router.push("/user/appointments"), 2000);
  });
 }, [id, router]);

 if (loading) {
  return (
   <div className="flex min-h-screen items-center justify-center bg-zinc-50">
    <p className="text-sm text-zinc-400">Cargando...</p>
   </div>
  );
 }

 if (!appointment) {
  return (
   <div className="flex min-h-screen items-center justify-center bg-zinc-50">
    <p className="text-sm text-red-500">Cita no encontrada</p>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-zinc-50 px-6 py-8">
   <div className="mx-auto max-w-4xl">
    <button
     onClick={() => router.push("/user/appointments")}
     className="mb-4 text-sm text-zinc-500 transition hover:text-zinc-900"
    >
     ← Volver a mis citas
    </button>

    <div className="mb-4 rounded-xl border border-zinc-200 bg-white px-5 py-4">
     <h1 className="text-lg font-semibold text-zinc-900">
      Videollamada con {appointment.doctor.name}
     </h1>
     <p className="text-sm text-zinc-500">{appointment.doctor.specialty}</p>
    </div>

    {uploading && (
     <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
      ⏳ Subiendo grabación y procesando transcripción...
     </div>
    )}
    {uploaded && (
     <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
      ✅ Grabación subida y transcripción procesada
     </div>
    )}

    <JitsiRoom
     roomName={appointment.jitsiRoomName}
     displayName={appointment.patientName}
     onCallEnd={handleCallEnd}
     onRecordingReady={handleRecordingReady}
    />
   </div>
  </div>
 );
}
