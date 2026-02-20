"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginFormProps = {
  forbidden: boolean;
};

export default function LoginForm({ forbidden }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!response.ok) {
      setError("Credenciales inválidas");
      return;
    }
    const data = await response.json();
    const role = data?.user?.role;
    if (typeof role === "string") {
      router.push(`/${role}`);
      return;
    }
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-white">Ingresar</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Usa un email y contraseña válidos para acceder según tu rol.
        </p>
        {forbidden ? (
          <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-900/20 px-4 py-3 text-sm text-amber-500">
            No tienes permisos para acceder a esa sección.
          </div>
        ) : null}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white placeholder-zinc-500"
              placeholder="user@demo.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white placeholder-zinc-500"
              placeholder="demo123"
            />
          </div>
          {error ? <div className="text-sm text-red-500">{error}</div> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
