import { NextResponse } from "next/server";
import { getUserBySession } from "@/lib/auth";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const sessionMatch = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  const token = sessionMatch?.[1];
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await getUserBySession(token);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
