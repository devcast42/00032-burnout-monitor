import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateBurnoutReport } from "@/lib/gemini";
import crypto from "crypto";

const BURNOUT_THRESHOLD = 50; // Score > 50 out of 75 triggers auto-appointment

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || (!Array.isArray(body.answers) && (typeof body.answers !== "object" || body.answers === null))) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Coerce score to a number (handles null/undefined from prediction API)
  const score = typeof body.score === "number" && !isNaN(body.score) ? body.score : 0;

  // Verificar si ya completó la encuesta hoy
  const today = new Date().toISOString().split("T")[0];
  // const existing = await prisma.survey.findFirst({
  //   where: { userId: user.id, date: today },
  // });

  // if (existing) {
  //   return NextResponse.json(
  //     { error: "Ya has completado la encuesta de hoy" },
  //     { status: 400 },
  //   );
  // }

  const survey = await prisma.survey.create({
    data: {
      userId: user.id,
      date: today,
      score: score,
      answers: body.answers,
    },
  });

  // ── Generar informe con Gemini ──
  let reportContent: string | null = null;
  let reportId: string | null = null;
  try {
    const prediction = body.prediction || null;
    reportContent = await generateBurnoutReport(score, body.answers as Record<string, number>, prediction);
    const surveyReport = await prisma.surveyReport.create({
      data: {
        surveyId: survey.id,
        report: reportContent,
        score: score,
      },
    });
    reportId = surveyReport.id;
  } catch (err) {
    console.error("Error al generar informe con Gemini:", err);
  }

  // ── Auto-agendar cita si score > 50 ──
  let autoAppointment = null;

  if (score > BURNOUT_THRESHOLD) {
    try {
      // Find first available user with doctor role
      const doctorUser = await prisma.user.findFirst({
        where: { role: "doctor" },
        include: { person: true },
        orderBy: { name: "asc" },
      });

      if (doctorUser && doctorUser.person) {
        // Find next available slot (starting tomorrow)
        const appointment = await findNextAvailableSlot(doctorUser, user);

        if (appointment) {
          autoAppointment = {
            id: appointment.id,
            doctorName: doctorUser.name,
            specialty: "Médico", // Default if not found in Person
            date: appointment.date.toISOString(),
          };
        }
      }
    } catch (err) {
      console.error("Error al auto-agendar cita:", err);
      // Don't fail the survey submission if auto-scheduling fails
    }
  }

  return NextResponse.json({
    success: true,
    id: survey.id,
    score,
    report: reportContent,
    reportId,
    autoAppointment,
  });
}

async function findNextAvailableSlot(
  doctorUser: any, // User & { person: Person }
  user: { name: string; email: string },
) {
  const doctorPerson = doctorUser.person;
  const startHour = doctorPerson.workStartHour ?? 8;
  const endHour = doctorPerson.workEndHour ?? 20;
  const slotDuration = doctorPerson.slotDuration ?? 60;

  // Check the next 7 days for an available slot
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);

    for (let hour = startHour; hour < endHour; hour++) {
      const slotDate = new Date(targetDate);
      slotDate.setHours(hour, 0, 0, 0);

      // Check if slot is already taken
      const existingAppt = await prisma.appointment.findFirst({
        where: {
          doctorId: doctorUser.id,
          date: slotDate,
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        },
      });

      if (!existingAppt) {
        // Also check if user already has a pending appointment
        const userPending = await prisma.appointment.findFirst({
          where: {
            patientEmail: user.email,
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          },
        });

        if (userPending) {
          // User already has a pending appointment, skip auto-scheduling
          return null;
        }

        // Create the appointment
        const roomId = crypto.randomUUID().slice(0, 8);
        const appointment = await prisma.appointment.create({
          data: {
            doctorId: doctorUser.id,
            patientName: user.name,
            patientEmail: user.email,
            date: slotDate,
            durationMin: slotDuration,
            jitsiRoomName: `burnout-auto-${roomId}`,
          },
        });

        return appointment;
      }
    }
  }

  return null; // No available slots in the next 7 days
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const surveys = await prisma.survey.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      score: true,
      answers: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ surveys });
}
