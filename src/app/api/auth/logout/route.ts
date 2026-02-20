import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const sessionMatch = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  const token = sessionMatch?.[1];
  if (token) {
    deleteSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: "session",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
