import { NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { person: true },
  });

  type UserWithPerson = Awaited<ReturnType<typeof prisma.user.findMany>>[number] & {
    person: {
      designation: number | null;
      specialization: number | null;
      gender: number | null;
      ageCode: number | null;
      bmi: number | null;
    } | null;
  };

  // Map to the expected response format
  const result = (users as UserWithPerson[]).map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    manager_id: u.managerId,
    designation: u.person?.designation ?? null,
    specialization: u.person?.specialization ?? null,
  }));

  return NextResponse.json({ users: result });
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

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "El email ya está registrado" },
      { status: 400 },
    );
  }

  const passwordHash = hashPassword(body.password);

  const newUser = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      role: body.role,
      managerId: body.managerId || null,
      passwordHash,
      ...(body.role === "user"
        ? {
          person: {
            create: {
              designation: body.designation ? parseInt(body.designation) : null,
              specialization: body.specialization ? parseInt(body.specialization) : null,
            },
          },
        }
        : {}),
    },
  });

  return NextResponse.json({ success: true, id: newUser.id });
}
