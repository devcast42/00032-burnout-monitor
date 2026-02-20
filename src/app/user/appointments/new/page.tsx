"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Doctor = {
 id: string;
 name: string;
 email: string;
 specialty: string;
 workStartHour: number;
 workEndHour: number;
};

type Slot = {
 start: string;
 end: string;
 available: boolean;
};

export default function NewAppointmentPage() {
 const router = useRouter();
 const [doctors, setDoctors] = useState<Doctor[]>([]);
 const [selectedDoctor, setSelectedDoctor] = useState("");
 const [selectedDate, setSelectedDate] = useState("");
 const [slots, setSlots] = useState<Slot[]>([]);
 const [selectedSlot, setSelectedSlot] = useState("");
 const [loadingSlots, setLoadingSlots] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [success, setSuccess] = useState(false);

 // Get today's date as min for date picker
 const today = new Date().toISOString().split("T")[0];

 useEffect(() => {
  fetch("/api/doctors")
   .then((res) => res.json())
   .then((data) => setDoctors(data.doctors || []));
 }, []);

 const handleDoctorChange = (value: string) => {
  setSelectedDoctor(value);
  setSlots([]);
  setSelectedSlot("");
  if (value && selectedDate) setLoadingSlots(true);
 };

 const handleDateChange = (value: string) => {
  setSelectedDate(value);
  setSlots([]);
  setSelectedSlot("");
  if (selectedDoctor && value) setLoadingSlots(true);
 };

 useEffect(() => {
  if (!selectedDoctor || !selectedDate) return;
  let cancelled = false;
  fetch(`/api/doctors/${selectedDoctor}/slots?date=${selectedDate}`)
   .then((res) => res.json())
   .then((data) => {
    if (!cancelled) {
     setSlots(data.slots || []);
     setLoadingSlots(false);
    }
   })
   .catch(() => {
    if (!cancelled) setLoadingSlots(false);
   });
  return () => {
   cancelled = true;
  };
 }, [selectedDoctor, selectedDate]);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedDoctor || !selectedSlot) return;

  setSubmitting(true);
  setError(null);

  const res = await fetch("/api/appointments", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    doctorId: selectedDoctor,
    date: selectedSlot,
   }),
  });

  if (!res.ok) {
   const data = await res.json();
   setError(data.error || "Error al crear la cita");
   setSubmitting(false);
   return;
  }

  setSuccess(true);
  setTimeout(() => router.push("/user/appointments"), 1500);
 };

 const selectedDoctorData = doctors.find((d) => d.id === selectedDoctor);

 return (
  <div className="min-h-screen bg-zinc-50 px-6 py-12">
   <div className="mx-auto max-w-2xl">
    <button
     onClick={() => router.back()}
     className="mb-6 text-sm text-zinc-500 transition hover:text-zinc-900"
    >
     ← Volver a mis citas
    </button>

    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
     <h1 className="text-2xl font-semibold text-zinc-900">
      Agendar nueva cita
     </h1>
     <p className="mt-2 text-sm text-zinc-500">
      Selecciona un doctor, fecha y horario disponible
     </p>

     {success ? (
      <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
       ✅ Cita agendada exitosamente. Redirigiendo...
      </div>
     ) : (
      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
       {/* Doctor selection */}
       <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="doctor">
         Doctor / Psicólogo
        </label>
        <select
         id="doctor"
         value={selectedDoctor}
         onChange={(e) => handleDoctorChange(e.target.value)}
         className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200"
         required
        >
         <option value="">Selecciona un doctor</option>
         {doctors.map((doc) => (
          <option key={doc.id} value={doc.id}>
           {doc.name} — {doc.specialty}
          </option>
         ))}
        </select>
       </div>

       {selectedDoctorData && (
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
         Horario de atención:{" "}
         <span className="font-medium text-zinc-700">
          {selectedDoctorData.workStartHour}:00 —{" "}
          {selectedDoctorData.workEndHour}:00
         </span>
        </div>
       )}

       {/* Date selection */}
       <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="date">
         Fecha
        </label>
        <input
         id="date"
         type="date"
         min={today}
         value={selectedDate}
         onChange={(e) => handleDateChange(e.target.value)}
         className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200"
         required
        />
       </div>

       {/* Slot selection */}
       {selectedDoctor && selectedDate && (
        <div className="space-y-2">
         <label className="text-sm font-medium text-zinc-700">
          Horario disponible
         </label>
         {loadingSlots ? (
          <p className="text-sm text-zinc-400">Cargando horarios...</p>
         ) : slots.length === 0 ? (
          <p className="text-sm text-zinc-400">No hay horarios disponibles</p>
         ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
           {slots.map((slot) => {
            const time = new Date(slot.start).toLocaleTimeString("es-PE", {
             hour: "2-digit",
             minute: "2-digit",
            });
            return (
             <button
              key={slot.start}
              type="button"
              disabled={!slot.available}
              onClick={() => setSelectedSlot(slot.start)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
               selectedSlot === slot.start
                ? "border-zinc-900 bg-zinc-900 text-white"
                : slot.available
                  ? "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                  : "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300 line-through"
              }`}
             >
              {time}
             </button>
            );
           })}
          </div>
         )}
        </div>
       )}

       {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
         {error}
        </div>
       )}

       <button
        type="submit"
        disabled={!selectedDoctor || !selectedSlot || submitting}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
       >
        {submitting ? "Agendando..." : "Confirmar cita"}
       </button>
      </form>
     )}
    </div>
   </div>
  </div>
 );
}
