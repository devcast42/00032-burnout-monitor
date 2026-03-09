"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";

const JitsiRoom = dynamic(() => import("@/components/JitsiRoom"), {
    ssr: false,
    loading: () => (
        <div className="flex h-96 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
            <p className="text-sm text-zinc-500">Cargando videollamada...</p>
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

export default function DoctorCallPage({ params }: PageProps) {
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

        // Mark as IN_PROGRESS when doctor joins
        fetch(`/api/appointments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "IN_PROGRESS" }),
        });
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
        fetch(`/api/appointments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "COMPLETED" }),
        }).then(() => {
            setTimeout(() => router.push("/doctor/appointments"), 2000);
        });
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <p className="text-sm text-zinc-500">Cargando...</p>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <p className="text-sm text-red-400">Cita no encontrada</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 px-6 py-8">
            <div className="mx-auto max-w-4xl">
                <button
                    onClick={() => router.push("/doctor/appointments")}
                    className="mb-4 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
                >
                    <ArrowLeft size={16} />
                    Volver a mis citas
                </button>

                <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
                    <h1 className="text-lg font-semibold text-white">
                        Videollamada con {appointment.patientName}
                    </h1>
                    <p className="text-sm text-zinc-400">Paciente</p>
                </div>

                {uploading && (
                    <div className="mb-4 rounded-lg border border-blue-800 bg-blue-900/50 px-4 py-3 text-sm text-blue-200">
                        ⏳ Subiendo grabación y procesando transcripción...
                    </div>
                )}
                {uploaded && (
                    <div className="mb-4 rounded-lg border border-green-800 bg-green-900/50 px-4 py-3 text-sm text-green-200">
                        ✅ Grabación subida y transcripción procesada
                    </div>
                )}

                <JitsiRoom
                    roomName={appointment.jitsiRoomName}
                    displayName={appointment.doctor.name}
                    onCallEnd={handleCallEnd}
                    onRecordingReady={handleRecordingReady}
                />
            </div>
        </div>
    );
}
