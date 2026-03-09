import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user || user.role !== "doctor") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get all unique patients associated with this doctor
        const appointments = await prisma.appointment.findMany({
            where: { doctorId: user.id },
            select: { patientEmail: true },
            distinct: ["patientEmail"],
        });

        const patientEmails = appointments.map((a) => a.patientEmail).filter(Boolean) as string[];

        if (patientEmails.length === 0) {
            return NextResponse.json({
                stats: {
                    totalPatients: 0,
                    avgBurnout: 0,
                    distribution: { low: 0, medium: 0, high: 0 },
                    weeklyTrend: [],
                    riskPatients: [],
                },
            });
        }

        // 2. Get the latest surveys for these patients
        const latestSurveys = await prisma.survey.findMany({
            where: {
                user: {
                    email: { in: patientEmails },
                },
            },
            orderBy: { createdAt: "desc" },
            distinct: ["userId"],
        });

        const distribution = {
            low: latestSurveys.filter((s) => s.score <= 30).length,
            medium: latestSurveys.filter((s) => s.score > 30 && s.score <= 60).length,
            high: latestSurveys.filter((s) => s.score > 60).length,
        };

        const avgBurnout = latestSurveys.length > 0
            ? Math.round(latestSurveys.reduce((acc, s) => acc + s.score, 0) / latestSurveys.length)
            : 0;

        // 3. Weekly trend (last 4 weeks)
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const surveysLastMonth = await prisma.survey.findMany({
            where: {
                user: {
                    email: { in: patientEmails },
                },
                createdAt: { gte: fourWeeksAgo },
            },
            orderBy: { createdAt: "asc" },
        });

        // Group by week
        const weeklyTrend: { week: string; score: number }[] = [];
        for (let i = 0; i < 4; i++) {
            const start = new Date(fourWeeksAgo);
            start.setDate(start.getDate() + (i * 7));
            const end = new Date(start);
            end.setDate(end.getDate() + 7);

            const weekSurveys = surveysLastMonth.filter(s => {
                const d = s.createdAt ? new Date(s.createdAt) : new Date();
                return d >= start && d < end;
            });

            if (weekSurveys.length > 0) {
                const avg = Math.round(weekSurveys.reduce((acc, s) => acc + s.score, 0) / weekSurveys.length);
                weeklyTrend.push({
                    week: `Sem ${i + 1}`,
                    score: avg
                });
            } else {
                weeklyTrend.push({
                    week: `Sem ${i + 1}`,
                    score: 0
                });
            }
        }

        // 4. Patients at risk (highest recent scores)
        const riskPatientsData = await prisma.survey.findMany({
            where: {
                user: {
                    email: { in: patientEmails },
                },
            },
            orderBy: { score: "desc" },
            distinct: ["userId"],
            take: 5,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        const riskPatients = riskPatientsData.map(s => ({
            name: s.user.name,
            score: s.score,
            email: s.user.email
        }));

        return NextResponse.json({
            stats: {
                totalPatients: patientEmails.length,
                avgBurnout,
                distribution,
                weeklyTrend,
                riskPatients,
            },
        });
    } catch (error) {
        console.error("Error fetching doctor stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
