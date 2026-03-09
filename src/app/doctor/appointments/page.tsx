"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppointmentCard from "@/components/AppointmentCard";
import { Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 6;

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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const statusFilters = [
    { id: "ALL", label: "Todas" },
    { id: "SCHEDULED", label: "Agendadas" },
    { id: "IN_PROGRESS", label: "En progreso" },
    { id: "COMPLETED", label: "Completadas" },
    { id: "CANCELLED", label: "Canceladas" },
  ];

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeStatus]);

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

  const filteredAppointments = useMemo(() => {
    const filtered = appointments.filter((appt) => {
      const matchesSearch = appt.patientName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = activeStatus === "ALL" || appt.status === activeStatus;
      return matchesSearch && matchesStatus;
    });

    // Custom sorting: SCHEDULED first, then IN_PROGRESS, then others. Secondary by date.
    return filtered.sort((a, b) => {
      const statusPriority: Record<string, number> = {
        SCHEDULED: 1,
        IN_PROGRESS: 2,
        COMPLETED: 3,
        CANCELLED: 4,
      };

      const priorityA = statusPriority[a.status] || 99;
      const priorityB = statusPriority[b.status] || 99;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same status priority, sort by date (closest first)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [appointments, searchTerm, activeStatus]);

  const totalPages = Math.ceil(filteredAppointments.length / PAGE_SIZE);
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAppointments.slice(start, start + PAGE_SIZE);
  }, [filteredAppointments, currentPage]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <div className="flex-1">
        <div className="mx-auto w-full max-w-lg">
          {/* Sticky Header Section */}
          <div className="sticky top-0 z-20 bg-zinc-950/80 px-6 pt-8 pb-4 backdrop-blur-md border-b border-zinc-900">
            <h1 className="text-2xl font-semibold text-white">
              Mis Pacientes
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Gestiona las citas con tus pacientes
            </p>

            <div className="mt-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nombre de paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-10 text-sm text-white placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Status Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveStatus(filter.id)}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition ${activeStatus === filter.id
                        ? "bg-white text-black"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 pt-6 pb-20">
            {loading ? (
              <p className="text-sm text-zinc-500 text-center py-12">Cargando citas...</p>
            ) : paginatedAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 px-6 py-16 text-center">
                <Filter className="mx-auto mb-4 h-12 w-12 text-zinc-700" />
                <p className="text-sm text-zinc-500">
                  {searchTerm || activeStatus !== "ALL"
                    ? "No se encontraron citas que coincidan con los filtros."
                    : "No tienes citas agendadas."}
                </p>
                {(searchTerm || activeStatus !== "ALL") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setActiveStatus("ALL");
                    }}
                    className="mt-4 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4">
                  {paginatedAppointments.map((appt) => (
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 disabled:opacity-30"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${currentPage === page
                              ? "bg-white text-black"
                              : "text-zinc-500 hover:bg-zinc-800 hover:text-white"
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 disabled:opacity-30"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
