import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    const doctors = await prisma.user.findMany({
        where: { role: "doctor" },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            email: true,
            person: {
                select: {
                    workStartHour: true,
                    workEndHour: true,
                    slotDuration: true,
                },
            },
        },
    });

    // Flatten the result to match the expected format
    const flattenedDoctors = doctors.map((doc) => ({
        id: doc.id,
        name: doc.name,
        email: doc.email,
        specialty: "Médico", // Default specialty
        workStartHour: doc.person?.workStartHour ?? 8,
        workEndHour: doc.person?.workEndHour ?? 20,
        slotDuration: doc.person?.slotDuration ?? 60,
    }));

    return NextResponse.json({ doctors: flattenedDoctors });
}
