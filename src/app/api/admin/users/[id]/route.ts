import { NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  // Build user update data
  const userData: Record<string, unknown> = {};
  if (body.name) userData.name = body.name;
  if (body.email) userData.email = body.email;
  if (body.role) userData.role = body.role;
  if (body.managerId !== undefined) userData.managerId = body.managerId || null;
  if (body.password) userData.passwordHash = hashPassword(body.password);

  // Update user
  if (Object.keys(userData).length > 0) {
    await prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  // Update person data if applicable
  const targetRole = body.role || (await prisma.user.findUnique({ where: { id }, select: { role: true } }))?.role;
  if (targetRole === "user") {
    const personData: Record<string, unknown> = {};
    if (body.designation !== undefined) personData.designation = body.designation || null;
    if (body.specialization !== undefined) personData.specialization = body.specialization || null;
    if (body.workArea !== undefined) personData.workArea = body.workArea || null;
    if (body.weeklyHours !== undefined) personData.weeklyHours = body.weeklyHours ? parseInt(body.weeklyHours) : null;
    if (body.address !== undefined) personData.address = body.address || null;
    if (body.contact !== undefined) personData.contact = body.contact || null;

    if (Object.keys(personData).length > 0) {
      await prisma.person.upsert({
        where: { userId: id },
        update: personData,
        create: {
          userId: id,
          designation: (body.designation as string) || null,
          specialization: (body.specialization as string) || null,
          workArea: (body.workArea as string) || null,
          weeklyHours: body.weeklyHours ? parseInt(body.weeklyHours) : null,
          address: (body.address as string) || null,
          contact: (body.contact as string) || null,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  // Delete person first if exists (cascade should handle, but explicit is safer)
  await prisma.person.deleteMany({ where: { userId: id } });
  await prisma.survey.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
