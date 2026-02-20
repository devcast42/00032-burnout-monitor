"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppointmentCard from "@/components/AppointmentCard";

type Appointment = {
 id: string;
 date: string;
 status: string;
 patientName: string;
 patientEmail: string;
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
  <div className="min-h-screen bg-zinc-50 px-6 py-12">
   <div className="mx-auto max-w-3xl">
    <h1 className="text-2xl font-semibold text-zinc-900">
     Mis Pacientes — Citas
    </h1>
    <p className="mt-1 text-sm text-zinc-500">
     Gestiona las citas con tus pacientes
    </p>

    <div className="mt-8">
     {loading ? (
      <p className="text-sm text-zinc-500">Cargando citas...</p>
     ) : appointments.length === 0 ? (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
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
         role="doctor"
        />
       ))}
      </div>
     )}
    </div>
   </div>
  </div>
 );
}
