import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
    const user = await getSessionUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    let appointments;

    if (user.role === "doctor") {
        // Doctor sees their patients' appointments
        appointments = await prisma.appointment.findMany({
            where: { doctorId: user.id },
            include: { doctor: { select: { name: true } } },
            orderBy: { date: "desc" },
        });
    } else {
        // User sees their own appointments
        appointments = await prisma.appointment.findMany({
            where: { patientEmail: user.email },
            include: { doctor: { select: { name: true } } },
            orderBy: { date: "desc" },
        });
    }

    return NextResponse.json({ appointments });
}

export async function POST(request: Request) {
    const user = await getSessionUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.doctorId || !body.date) {
        return NextResponse.json(
            { error: "Se requiere doctorId y date" },
            { status: 400 },
        );
    }

    const doctorUser = await prisma.user.findUnique({
        where: { id: body.doctorId, role: "doctor" },
        include: { person: true },
    });
    if (!doctorUser || !doctorUser.person) {
        return NextResponse.json({ error: "Doctor no encontrado" }, { status: 404 });
    }

    const doctorPerson = doctorUser.person;
    const appointmentDate = new Date(body.date);
    if (isNaN(appointmentDate.getTime())) {
        return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }

    // Validate slot is within doctor's working hours
    const hour = appointmentDate.getHours();
    const workStart = doctorPerson.workStartHour ?? 8;
    const workEnd = doctorPerson.workEndHour ?? 20;

    if (hour < workStart || hour >= workEnd) {
        return NextResponse.json(
            { error: `El doctor atiende de ${workStart}:00 a ${workEnd}:00` },
            { status: 400 },
        );
    }

    // Check slot is not already taken
    const existingAppointment = await prisma.appointment.findFirst({
        where: {
            doctorId: body.doctorId,
            date: appointmentDate,
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        },
    });

    if (existingAppointment) {
        return NextResponse.json(
            { error: "Este horario ya está ocupado" },
            { status: 409 },
        );
    }

    // Create appointment with unique Jitsi room name
    const roomId = crypto.randomUUID().slice(0, 8);
    const jitsiRoomName = `burnout-${roomId}`;

    const appointment = await prisma.appointment.create({
        data: {
            doctorId: body.doctorId,
            patientName: user.name,
            patientEmail: user.email,
            date: appointmentDate,
            durationMin: doctorPerson.slotDuration ?? 60,
            jitsiRoomName,
        },
        include: { doctor: { select: { name: true } } },
    });

    return NextResponse.json({ appointment }, { status: 201 });
}
