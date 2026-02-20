import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";

export type Role = "user" | "manager" | "doctor" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  managerId?: string | null;
};

type StoredUser = User & {
  passwordHash: string;
};

const SESSION_SECRET =
  process.env.AUTH_SECRET ??
  ((globalThis as { __authSessionSecret?: string }).__authSessionSecret ??=
    crypto.randomBytes(32).toString("hex"));

function signValue(value: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function verifyValue(value: string, signature: string): boolean {
  const expected = signValue(value);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

function sanitizeUser(user: StoredUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    managerId: user.managerId ?? null,
  };
}

function parseHash(passwordHash: string): { iterations: number; salt: string; hash: string } | null {
  const parts = passwordHash.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return null;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations)) return null;
  return { iterations, salt: parts[2], hash: parts[3] };
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const parsed = parseHash(passwordHash);
  if (!parsed) {
    return passwordHash === password;
  }
  const derived = crypto.pbkdf2Sync(
    password,
    parsed.salt,
    parsed.iterations,
    Buffer.from(parsed.hash, "base64url").length,
    "sha256",
  );
  const expected = Buffer.from(parsed.hash, "base64url");
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function mapRow(row: {
  id: string;
  email: string;
  name: string;
  role: Role;
  managerId: string | null;
  passwordHash?: string;
}): StoredUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    managerId: row.managerId ?? null,
    passwordHash: row.passwordHash ?? "",
  };
}

export async function findUserByCredentials(
  email: string,
  password: string,
): Promise<User | null> {
  const result = await pool.query<{
    id: string;
    email: string;
    name: string;
    role: Role;
    managerId: string | null;
    passwordHash: string;
  }>(
    `select id, email, name, role, manager_id as "managerId", password_hash as "passwordHash"
     from users
     where lower(email) = lower($1)
     limit 1`,
    [email],
  );
  const row = result.rows[0];
  if (!row) return null;
  const user = mapRow(row);
  if (!verifyPassword(password, user.passwordHash)) return null;
  return sanitizeUser(user);
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query<{
    id: string;
    email: string;
    name: string;
    role: Role;
    managerId: string | null;
  }>(
    `select id, email, name, role, manager_id as "managerId"
     from users
     where id = $1
     limit 1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  return sanitizeUser(mapRow(row));
}

export function createSession(userId: string): string {
  const signature = signValue(userId);
  return `${userId}.${signature}`;
}

export function deleteSession(token: string): void {
  token.toString();
}

export async function getUserBySession(token: string): Promise<User | null> {
  const [userId, signature] = token.split(".");
  if (!userId || !signature) return null;
  if (!verifyValue(userId, signature)) return null;
  return getUserById(userId);
}

export async function getManagerChain(user: User): Promise<User[]> {
  const chain: User[] = [];
  let current = user.managerId ? await getUserById(user.managerId) : null;
  while (current) {
    chain.push(current);
    current = current.managerId ? await getUserById(current.managerId) : null;
  }
  return chain;
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return getUserBySession(token);
}

export async function requireRole(roles: Role[]): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (!roles.includes(user.role)) {
    redirect("/login?forbidden=1");
  }
  return user;
}
