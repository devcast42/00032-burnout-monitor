"use client";

import { useState, useEffect } from "react";
import {
    staticFields,
    getBurnoutProfile,
    saveBurnoutProfile,
    type BurnoutProfile,
} from "@/lib/burnoutProfileData";

export default function BurnoutProfileCards() {
    const [profile, setProfile] = useState<BurnoutProfile | null>(null);

    useEffect(() => {
        setProfile(getBurnoutProfile());
    }, []);

    if (!profile) return null;

    const handleChange = (key: string, value: number) => {
        const updated = { ...profile, [key]: value };
        setProfile(updated);
        saveBurnoutProfile(updated);
    };

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400">
                Datos de perfil clínico
            </h3>
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
