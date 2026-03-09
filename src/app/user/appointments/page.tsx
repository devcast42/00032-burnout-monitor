"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppointmentCard from "@/components/AppointmentCard";
import { Home, Calendar, User as UserIcon } from "lucide-react";

type Appointment = {
  id: string;
  date: string;
  status: string;
  patientName: string;
  patientEmail: string;
  jitsiRoomName: string;
  doctor: { name: string; specialty: string };
};

export default function UserAppointmentsPage() {
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
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-20">
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">Mis Citas</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Gestiona tus citas médicas y sesiones de videollamada
              </p>
            </div>
            <button
              onClick={() => router.push("/user/appointments/new")}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              + Agendar
            </button>
          </div>

          <div className="mt-8">
            {loading ? (
              <p className="text-sm text-zinc-500">Cargando citas...</p>
            ) : appointments.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
                <p className="text-sm text-zinc-500">No tienes citas agendadas aún.</p>
                <button
                  onClick={() => router.push("/user/appointments/new")}
                  className="mt-4 text-sm text-white underline hover:text-zinc-300"
                >
                  Agendar tu primera cita
                </button>
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
                    role="user"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-lg safe-area-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-3">
          <button
            onClick={() => router.push("/user")}
            className="flex flex-col items-center gap-1 p-2 transition-colors text-zinc-500 hover:text-zinc-300"
          >
            <Home size={24} />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => router.push("/user")}
            className="flex flex-col items-center gap-1 p-2 transition-colors text-white"
          >
            <Calendar size={24} />
            <span className="text-xs font-medium">Citas</span>
          </button>

          <button
            onClick={() => router.push("/user")}
            className="flex flex-col items-center gap-1 p-2 transition-colors text-zinc-500 hover:text-zinc-300"
          >
            <UserIcon size={24} />
            <span className="text-xs font-medium">Usuario</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
