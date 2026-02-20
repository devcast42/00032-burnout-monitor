import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    const doctors = await prisma.doctor.findMany({
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
            workStartHour: true,
            workEndHour: true,
            slotDuration: true,
        },
    });

    return NextResponse.json({ doctors });
}
