import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Role = "user" | "manager" | "doctor" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  managerId?: string | null;
};

type StoredUser = User & {
  password: string;
};

const users: StoredUser[] = [
  {
    id: "u1",
    email: "user@demo.com",
    name: "Usuario Demo",
    role: "user",
    password: "demo123",
    managerId: "m1",
  },
  {
    id: "m1",
    email: "manager@demo.com",
    name: "Manager Demo",
    role: "manager",
    password: "demo123",
    managerId: "m2",
  },
  {
    id: "m2",
    email: "manager2@demo.com",
    name: "Manager Superior",
    role: "manager",
    password: "demo123",
    managerId: null,
  },
  {
    id: "d1",
    email: "doctor@demo.com",
    name: "Doctora Demo",
    role: "doctor",
    password: "demo123",
    managerId: null,
  },
  {
    id: "a1",
    email: "admin@demo.com",
    name: "Admin Demo",
    role: "admin",
    password: "demo123",
    managerId: null,
  },
];

const sessions = new Map<string, { userId: string; createdAt: number }>();

export const demoAccounts = users.map(({ password, ...user }) => ({
  ...user,
  password,
}));

function sanitizeUser(user: StoredUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    managerId: user.managerId ?? null,
  };
}

export function findUserByCredentials(email: string, password: string): User | null {
  const user = users.find(
    (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password,
  );
  if (!user) return null;
  return sanitizeUser(user);
}

export function getUserById(id: string): User | null {
  const user = users.find((item) => item.id === id);
  if (!user) return null;
  return sanitizeUser(user);
}

export function createSession(userId: string): string {
  const token = crypto.randomUUID();
  sessions.set(token, { userId, createdAt: Date.now() });
  return token;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}

export function getUserBySession(token: string): User | null {
  const session = sessions.get(token);
  if (!session) return null;
  return getUserById(session.userId);
}

export function getManagerChain(user: User): User[] {
  const chain: User[] = [];
  let current = user.managerId ? getUserById(user.managerId) : null;
  while (current) {
    chain.push(current);
    current = current.managerId ? getUserById(current.managerId) : null;
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
