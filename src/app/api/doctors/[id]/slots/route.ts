import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");

    if (!dateParam) {
        return NextResponse.json(
            { error: "Se requiere el parámetro 'date' (YYYY-MM-DD)" },
            { status: 400 },
        );
    }

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
        return NextResponse.json({ error: "Doctor no encontrado" }, { status: 404 });
    }

    // Parse the date
    const targetDate = new Date(dateParam + "T00:00:00");
    if (isNaN(targetDate.getTime())) {
        return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }

    // Generate all possible slots for this doctor on this date
    const slots: { start: string; end: string; available: boolean }[] = [];
    const slotMinutes = doctor.slotDuration;

    for (let hour = doctor.workStartHour; hour < doctor.workEndHour; hour++) {
        const startTime = new Date(targetDate);
        startTime.setHours(hour, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + slotMinutes);

        slots.push({
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            available: true, // will be updated below
        });
    }

    // Get existing appointments for this doctor on this date
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
        where: {
            doctorId: id,
            date: { gte: dayStart, lte: dayEnd },
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        },
        select: { date: true, durationMin: true },
    });

    // Mark occupied slots as unavailable
    for (const slot of slots) {
        const slotStart = new Date(slot.start).getTime();
        for (const appt of existingAppointments) {
            const apptStart = new Date(appt.date).getTime();
            if (slotStart === apptStart) {
                slot.available = false;
                break;
            }
        }
    }

    return NextResponse.json({
        doctor: { id: doctor.id, name: doctor.name, specialty: doctor.specialty },
        date: dateParam,
        slots,
    });
}
