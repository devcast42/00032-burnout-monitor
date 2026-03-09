"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppointmentCard from "@/components/AppointmentCard";
import { ArrowLeft } from "lucide-react";

type Appointment = {
  id: string;
  date: string;
  status: string;
  patientName: string;
  patientEmail: string;
  patientId?: string;
  jitsiRoomName: string;
  doctor: { name: string; specialty: string };
};

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/appointments")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setAppointments(data.appointments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Volver
          </button>

          <h1 className="text-2xl font-semibold text-white">
            Mis Pacientes — Citas
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gestiona las citas con tus pacientes
          </p>

          <div className="mt-8">
            {loading ? (
              <p className="text-sm text-zinc-500">Cargando citas...</p>
            ) : appointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900 px-6 py-12 text-center">
                <p className="text-sm text-zinc-500">No tienes citas agendadas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    id={appt.id}
                    doctorName={appt.doctor.name}
                    specialty={appt.doctor.specialty}
                    date={appt.date}
                    status={appt.status}
                    patientName={appt.patientName}
                    patientId={appt.patientId}
                    role="doctor"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
