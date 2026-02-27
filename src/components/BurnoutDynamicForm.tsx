"use client";

import { useState } from "react";
import {
    dynamicFields,
    getBurnoutProfile,
    isStaticProfileComplete,
    type BurnoutProfile,
} from "@/lib/burnoutProfileData";

type PredictionResult = {
    prediction: number;
    burnout_probability: number;
    status: string;
};

export default function BurnoutDynamicForm({
    onResult,
    onError,
}: {
    onResult: (result: PredictionResult) => void;
    onError: (msg: string) => void;
}) {
    const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, number>>(
        Object.fromEntries(dynamicFields.map((f) => [f.key, 0])),
    );
    const [loading, setLoading] = useState(false);

    const handleChange = (key: string, value: number) => {
        setDynamicAnswers((prev) => ({ ...prev, [key]: value }));
    };

    const allAnswered = dynamicFields.every((f) => dynamicAnswers[f.key] !== 0);

    const handleSubmit = async () => {
        if (!allAnswered) return;

        const staticProfile = getBurnoutProfile();
        if (!isStaticProfileComplete(staticProfile)) {
            onError(
                "Completa todos los campos de tu perfil clínico en la pestaña Usuario antes de analizar.",
            );
            return;
        }

        const fullPayload: BurnoutProfile = { ...staticProfile, ...dynamicAnswers };

        setLoading(true);
        try {
            const res = await fetch(
                "https://burnout-api-5o7t.onrender.com/predict",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(fullPayload),
                },
            );
            if (!res.ok) throw new Error("Error en la API");
            const data = await res.json();
            onResult(data);
        } catch {
            onError(
                "No se pudo conectar con el servicio de predicción. Intenta de nuevo.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <p className="text-sm text-zinc-400">
                Responde estas preguntas sobre cómo te sientes actualmente.
            </p>

            <div className="space-y-4">
                {dynamicFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-300">
                            {field.label}
                        </label>
                        <select
                            value={dynamicAnswers[field.key] || 0}
                            onChange={(e) => handleChange(field.key, Number(e.target.value))}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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

            <button
                onClick={handleSubmit}
                disabled={!allAnswered || loading}
                className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
                {loading ? "Analizando..." : "Enviar análisis"}
            </button>
        </div>
    );
}
