import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.answers) || typeof body.score !== "number") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Verificar si ya completó la encuesta hoy
  const today = new Date().toISOString().split("T")[0];
  const existing = await prisma.survey.findFirst({
    where: { userId: user.id, date: today },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Ya has completado la encuesta de hoy" },
      { status: 400 },
    );
  }

  const survey = await prisma.survey.create({
    data: {
      userId: user.id,
      date: today,
      score: body.score,
      answers: body.answers,
    },
  });

  return NextResponse.json({ success: true, id: survey.id });
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
