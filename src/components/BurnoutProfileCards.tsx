"use client";

import { useState, useEffect, useCallback } from "react";
import {
    staticFields,
    type BurnoutProfile,
} from "@/lib/burnoutProfileData";

export default function BurnoutProfileCards() {
    const [profile, setProfile] = useState<BurnoutProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then((data) => setProfile(data.profile))
            .catch(() => setProfile(Object.fromEntries(staticFields.map((f) => [f.key, 0]))))
            .finally(() => setLoading(false));
    }, []);

    const saveProfile = useCallback(async (updated: BurnoutProfile) => {
        setSaving(true);
        try {
            await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });
        } catch (err) {
            console.error("Error saving profile:", err);
        } finally {
            setSaving(false);
        }
    }, []);

    if (loading) {
        return <div className="text-sm text-zinc-500 py-4 text-center">Cargando perfil...</div>;
    }

    if (!profile) return null;

    const handleChange = (key: string, value: number) => {
        const updated = { ...profile, [key]: value };
        setProfile(updated);
        saveProfile(updated);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-400">
                    Datos de perfil clínico
                </h3>
                {saving && (
                    <span className="text-xs text-zinc-500">Guardando...</span>
                )}
            </div>
            <div className="grid grid-cols-1 gap-3">
                {staticFields.map((field) => (
                    <div
                        key={field.key}
                        className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
                    >
                        <label className="mb-2 block text-xs font-medium text-zinc-400">
                            {field.label}
                        </label>
                        <select
                            value={profile[field.key] || 0}
                            onChange={(e) => handleChange(field.key, Number(e.target.value))}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value={0} disabled>
                                Seleccionar...
                            </option>
                            {field.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
}
