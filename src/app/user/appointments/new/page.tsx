"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Calendar, User as UserIcon, ArrowLeft } from "lucide-react";

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
    setTimeout(() => router.push("/user"), 1500);
  };

  const selectedDoctorData = doctors.find((d) => d.id === selectedDoctor);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-20">
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-lg">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Volver a mis citas
          </button>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-white">
              Agendar nueva cita
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Selecciona un doctor, fecha y horario disponible
            </p>

            {success ? (
              <div className="mt-6 rounded-lg border border-green-800 bg-green-900/50 px-4 py-3 text-sm text-green-200">
                ✅ Cita agendada exitosamente. Redirigiendo...
              </div>
            ) : (
              <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                {/* Doctor selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300" htmlFor="doctor">
                    Doctor / Psicólogo
                  </label>
                  <select
                    id="doctor"
                    value={selectedDoctor}
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
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
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-xs text-zinc-400">
                    Horario de atención:{" "}
                    <span className="font-medium text-zinc-200">
                      {selectedDoctorData.workStartHour}:00 —{" "}
                      {selectedDoctorData.workEndHour}:00
                    </span>
                  </div>
                )}

                {/* Date selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300" htmlFor="date">
                    Fecha
                  </label>
                  <input
                    id="date"
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    required
                  />
                </div>

                {/* Slot selection */}
                {selectedDoctor && selectedDate && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">
                      Horario disponible
                    </label>
                    {loadingSlots ? (
                      <p className="text-sm text-zinc-500">Cargando horarios...</p>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-zinc-500">No hay horarios disponibles</p>
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
                              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${selectedSlot === slot.start
                                  ? "border-white bg-white text-black"
                                  : slot.available
                                    ? "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                                    : "cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-600 line-through"
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
                  <div className="rounded-lg border border-red-800 bg-red-900/50 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedDoctor || !selectedSlot || submitting}
                  className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Agendando..." : "Confirmar cita"}
                </button>
              </form>
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
