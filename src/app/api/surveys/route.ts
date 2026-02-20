import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

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
  const existing = await pool.query(
    "SELECT id FROM surveys WHERE user_id = $1 AND date = $2 LIMIT 1",
    [user.id, today],
  );

  if (existing.rows.length > 0) {
    return NextResponse.json(
      { error: "Ya has completado la encuesta de hoy" },
      { status: 400 },
    );
  }

  const id = randomUUID();
  await pool.query(
    "INSERT INTO surveys (id, user_id, date, score, answers) VALUES ($1, $2, $3, $4, $5)",
    [id, user.id, today, body.score, JSON.stringify(body.answers)],
  );

  return NextResponse.json({ success: true, id });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await pool.query(
    "SELECT id, date, score, answers, created_at FROM surveys WHERE user_id = $1 ORDER BY date DESC",
    [user.id],
  );

  return NextResponse.json({ surveys: result.rows });
}
