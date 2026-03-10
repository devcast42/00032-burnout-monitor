"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Mail, Loader2, ShieldAlert } from "lucide-react";

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
    try {
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
    } catch (err) {
      setLoading(false);
      setError("Error al conectar con el servidor");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050507] px-6 py-12">
      {/* Background ambient light */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px]" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px]" />

      <div className="glass premium-border relative w-full max-w-md overflow-hidden rounded-3xl p-8 shadow-2xl md:p-10">
        <div className="relative z-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 shadow-inner">
              <Lock size={32} />
            </div>
            <h1 className="text-gradient text-3xl font-bold tracking-tight">Bienvenido</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Ingresa a tu cuenta para continuar con Burnout Monitor
            </p>
          </div>

          {forbidden && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-500">
              <ShieldAlert size={18} className="shrink-0" />
              <p>No tienes permisos para acceder a esa sección.</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="email">
                Email Corporativo
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 group-focus-within:text-white transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-white/5 pl-10 pr-4 py-3 text-sm text-white transition-all focus:border-indigo-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-zinc-600"
                  placeholder="ejemplo@burnout.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="password">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 group-focus-within:text-white transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-white/5 pl-10 pr-4 py-3 text-sm text-white transition-all focus:border-indigo-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-zinc-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-4 py-3 text-sm font-bold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Ingresar</span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-500">
              &copy; 2024 Burnout Monitor. Sistema de Salud Inteligente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
