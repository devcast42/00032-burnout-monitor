"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppointmentCard from "@/components/AppointmentCard";
import { Home, Calendar, User as UserIcon, Plus, Loader2, Sparkles } from "lucide-react";

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
    <div className="relative flex min-h-screen flex-col bg-[#050507] pb-24 overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      <div className="flex-1 px-6 py-10 relative z-10">
        <div className="mx-auto w-full max-w-lg">
          <header className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-1 text-indigo-400">
                <Sparkles size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Salud Mental</span>
              </div>
              <h1 className="text-gradient text-4xl font-black tracking-tight">Mis Citas</h1>
              <p className="mt-2 text-sm text-zinc-500 font-medium">
                Gestiona tus sesiones y bienestar médico.
              </p>
            </div>
            <button
              onClick={() => router.push("/user/appointments/new")}
              className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
              title="Agendar Cita"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </header>

          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-600 italic">
                <Loader2 size={32} className="animate-spin mb-4 text-indigo-500/30" />
                <p className="text-sm font-bold uppercase tracking-widest text-[10px]">Cargando Citas...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="glass premium-border rounded-3xl px-8 py-16 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-900/50 text-zinc-700 shadow-inner">
                  <Calendar size={40} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Sin citas activas</h3>
                <p className="text-sm text-zinc-500 font-medium mb-8 max-w-[240px] mx-auto leading-relaxed">
                  No tienes sesiones programadas por el momento.
                </p>
                <button
                  onClick={() => router.push("/user/appointments/new")}
                  className="rounded-xl bg-indigo-600/10 border border-indigo-500/20 px-6 py-3 text-xs font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/5"
                >
                  Agendar Primera Cita
                </button>
              </div>
            ) : (
              <div className="space-y-5">
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
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
        <div className="glass premium-border flex items-center justify-around rounded-3xl p-3 shadow-2xl">
          {[
            { id: 'user', icon: Home, label: 'Inicio', path: '/user' },
            { id: 'appt', icon: Calendar, label: 'Citas', path: '/user/appointments', active: true },
            { id: 'profile', icon: UserIcon, label: 'Perfil', path: '/user' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`flex h-12 w-12 flex-col items-center justify-center rounded-2xl transition-all duration-300 group
                ${item.active
                  ? 'bg-white text-black shadow-lg shadow-white/5 scale-110'
                  : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300 hover:scale-105'
                }`}
            >
              <item.icon size={item.active ? 20 : 22} />
              {/* <span className="text-[10px] font-bold tracking-tighter mt-0.5">{item.label}</span> */}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
