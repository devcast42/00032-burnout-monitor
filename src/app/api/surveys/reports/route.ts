import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    const user = await getSessionUser();
    if (!user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Return all surveys with their optional reports
    const surveys = await prisma.survey.findMany({
        where: { userId: user.id },
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

    // Map to a unified format
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

    return NextResponse.json({ reports });
}
