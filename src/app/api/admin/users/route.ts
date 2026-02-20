import { NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await pool.query(`
    SELECT 
      u.id, 
      u.email, 
      u.name, 
      u.role, 
      u.manager_id,
      p.designation,
      p.specialization,
      p.work_area,
      p.weekly_hours,
      p.address,
      p.contact
    FROM users u
    LEFT JOIN persons p ON u.id = p.user_id
    ORDER BY u.name ASC
  `);

  return NextResponse.json({ users: result.rows });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.name || !body.role || !body.password) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    body.email,
  ]);

  if (existing.rows.length > 0) {
    return NextResponse.json(
      { error: "El email ya está registrado" },
      { status: 400 }
    );
  }

  const id = randomUUID();
  const passwordHash = hashPassword(body.password);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    await client.query(
      "INSERT INTO users (id, email, name, role, manager_id, password_hash) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        id,
        body.email,
        body.name,
        body.role,
        body.managerId || null,
        passwordHash,
      ]
    );

    if (body.role === "user") {
      await client.query(
        `INSERT INTO persons (
          user_id, designation, specialization, work_area, weekly_hours, address, contact
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          body.designation || null,
          body.specialization || null,
          body.workArea || null,
          body.weeklyHours ? parseInt(body.weeklyHours) : null,
          body.address || null,
          body.contact || null,
        ]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true, id });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
