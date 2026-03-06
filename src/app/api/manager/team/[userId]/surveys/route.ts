import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/manager/team/[userId]/surveys — fetch survey history for a team member
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ userId: string }> },
) {
    const manager = await getSessionUser();
    if (!manager || manager.role !== "manager") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { userId } = await params;

    // Verify the user is actually a subordinate of this manager
    const user = await prisma.user.findFirst({
        where: { id: userId, managerId: manager.id },
        select: { id: true, name: true },
    });

    if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const surveys = await prisma.survey.findMany({
        where: { userId },
        orderBy: { date: "asc" },
        select: {
            id: true,
            date: true,
            score: true,
            createdAt: true,
        },
    });

    return NextResponse.json({
        user: { id: user.id, name: user.name },
        surveys: surveys.map((s) => ({
            date: s.date,
            score: s.score,
        })),
    });
}
