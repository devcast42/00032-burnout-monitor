import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/doctor/patients/[userId]/reports — fetch survey history for a patient
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ userId: string }> },
) {
    const doctor = await getSessionUser();
    if (!doctor || doctor.role !== "doctor") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { userId } = await params;

    // Verify the user exists and has an appointment with this doctor
    const patientUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!patientUser) {
        return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    const hasAppointment = await prisma.appointment.findFirst({
        where: {
            doctorId: doctor.id,
            patientEmail: patientUser.email,
        },
    });

    if (!hasAppointment) {
        return NextResponse.json({ error: "No autorizado para ver este paciente" }, { status: 403 });
    }

    const surveys = await prisma.survey.findMany({
        where: { userId },
        include: {
            report: {
                select: {
                    id: true,
                    report: true,
                    score: true,
                    createdAt: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Map to the format needed by SurveyReportView and lists
    const reports = surveys.map((s) => ({
        id: s.report?.id ?? s.id,
        surveyId: s.id,
        report: s.report?.report ?? null,
        score: s.score,
        createdAt: s.report?.createdAt?.toISOString() ?? s.createdAt?.toISOString() ?? new Date().toISOString(),
        survey: {
            date: s.date,
            score: s.score,
            answers: s.answers as Record<string, number>,
        },
    }));

    return NextResponse.json({
        user: { id: patientUser.id, name: patientUser.name },
        reports,
    });
}
