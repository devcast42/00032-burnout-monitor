import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
    const { id } = await context.params;

    const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
            doctor: { select: { name: true, specialty: true, email: true } },
            recording: true,
        },
    });

    if (!appointment) {
        return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ appointment });
}

export async function PATCH(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const user = await getSessionUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.status) {
        return NextResponse.json({ error: "Se requiere status" }, { status: 400 });
    }

    const validStatuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
            { error: `Status inválido. Debe ser: ${validStatuses.join(", ")}` },
            { status: 400 },
        );
    }

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
        return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
        where: { id },
        data: { status: body.status },
        include: { doctor: { select: { name: true, specialty: true } } },
    });

    return NextResponse.json({ appointment: updated });
}
