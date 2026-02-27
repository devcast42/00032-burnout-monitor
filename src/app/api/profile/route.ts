import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Mapping between API keys (matching prediction API) and Prisma field names
const fieldMap: Record<string, string> = {
    Gender: "gender",
    "Age code": "ageCode",
    BMI: "bmi",
    Designation: "designation",
    Specialization: "specialization",
    Working_Place: "workingPlace",
    Duration: "duration",
    Private_Practice: "privatePractice",
    Working_Hour: "workingHour",
    Weekly_Vacation: "weeklyVacation",
    Marital_Status: "maritalStatus",
    Income: "income",
    Family_members: "familyMembers",
    "Liabilities ": "liabilities",
    Staying_with_Family: "stayingWithFamily",
};

const reverseFieldMap = Object.fromEntries(
    Object.entries(fieldMap).map(([k, v]) => [v, k]),
);

export async function GET() {
    const user = await getSessionUser();
    if (!user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const person = await prisma.person.findUnique({
        where: { userId: user.id },
    });

    // Build response using prediction API keys
    const profile: Record<string, number> = {};
    for (const [apiKey, prismaField] of Object.entries(fieldMap)) {
        profile[apiKey] = person
            ? (person as Record<string, unknown>)[prismaField] as number ?? 0
            : 0;
    }

    return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
    const user = await getSessionUser();
    if (!user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Convert API keys to Prisma field names
    const data: Record<string, number | null> = {};
    for (const [apiKey, prismaField] of Object.entries(fieldMap)) {
        if (apiKey in body) {
            const val = Number(body[apiKey]);
            data[prismaField] = isNaN(val) || val === 0 ? null : val;
        }
    }

    const person = await prisma.person.upsert({
        where: { userId: user.id },
        update: data,
        create: { userId: user.id, ...data },
    });

    // Return the updated profile in API key format
    const profile: Record<string, number> = {};
    for (const [apiKey, prismaField] of Object.entries(fieldMap)) {
        profile[apiKey] = (person as Record<string, unknown>)[prismaField] as number ?? 0;
    }

    return NextResponse.json({ profile });
}
