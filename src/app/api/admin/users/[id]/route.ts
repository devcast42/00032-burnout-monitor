import { NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updates = [];
    const values = [];
    let paramIndex = 1;

  if (body.name) {
    updates.push(`name = $${paramIndex++}`);
    values.push(body.name);
  }
  if (body.email) {
    updates.push(`email = $${paramIndex++}`);
    values.push(body.email);
  }
  if (body.role) {
    updates.push(`role = $${paramIndex++}`);
    values.push(body.role);
  }
  if (body.managerId !== undefined) {
    updates.push(`manager_id = $${paramIndex++}`);
    values.push(body.managerId || null);
  }
  if (body.password) {
    updates.push(`password_hash = $${paramIndex++}`);
    values.push(hashPassword(body.password));
  }

  if (updates.length > 0) {
    values.push(id);
    await client.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      values
    );
  }

  // Update person data if user is a regular user
  if (body.role === "user" || (!body.role && await isUserRole(client, id))) {
    const personUpdates = [];
    const personValues = [];
    let pIndex = 1;

    if (body.designation !== undefined) {
      personUpdates.push(`designation = $${pIndex++}`);
      personValues.push(body.designation || null);
    }
    if (body.specialization !== undefined) {
      personUpdates.push(`specialization = $${pIndex++}`);
      personValues.push(body.specialization || null);
    }
    if (body.workArea !== undefined) {
      personUpdates.push(`work_area = $${pIndex++}`);
      personValues.push(body.workArea || null);
    }
    if (body.weeklyHours !== undefined) {
      personUpdates.push(`weekly_hours = $${pIndex++}`);
      personValues.push(body.weeklyHours ? parseInt(body.weeklyHours) : null);
    }
    if (body.address !== undefined) {
      personUpdates.push(`address = $${pIndex++}`);
      personValues.push(body.address || null);
    }
    if (body.contact !== undefined) {
      personUpdates.push(`contact = $${pIndex++}`);
      personValues.push(body.contact || null);
    }

    if (personUpdates.length > 0) {
      personValues.push(id);
      
      // Upsert person record
      const checkPerson = await client.query("SELECT id FROM persons WHERE user_id = $1", [id]);
      
      if (checkPerson.rows.length > 0) {
        await client.query(
          `UPDATE persons SET ${personUpdates.join(", ")} WHERE user_id = $${pIndex}`,
          personValues
        );
      } else {
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
    }
  }

  await client.query("COMMIT");
  return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function isUserRole(client: any, userId: string): Promise<boolean> {
  const res = await client.query("SELECT role FROM users WHERE id = $1", [userId]);
  return res.rows[0]?.role === "user";
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = params;
  await pool.query("DELETE FROM users WHERE id = $1", [id]);

  return NextResponse.json({ success: true });
}
