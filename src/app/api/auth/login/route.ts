import { NextResponse } from "next/server";
import { createSession, findUserByCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 400 });
  }

  const user = findUserByCredentials(body.email, body.password);
  if (!user) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const token = createSession(user.id);
  const response = NextResponse.json({ user });
  response.cookies.set({
    name: "session",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
