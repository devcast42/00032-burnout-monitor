"use client";

import { useRef, useEffect } from "react";

type DataPoint = {
    date: string;
    score: number;
};

type SurveyLineChartProps = {
    data: DataPoint[];
};

function getScoreColor(score: number): string {
    if (score <= 25) return "#22c55e";
    if (score <= 45) return "#3b82f6";
    if (score <= 65) return "#eab308";
    if (score <= 80) return "#f97316";
    return "#ef4444";
}

export default function SurveyLineChart({ data }: SurveyLineChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || data.length === 0) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = 220;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.scale(dpr, dpr);

        // Padding
        const padLeft = 40;
        const padRight = 20;
        const padTop = 20;
        const padBottom = 40;
        const chartW = width - padLeft - padRight;
        const chartH = height - padTop - padBottom;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Sort data by date
        const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
        const maxScore = 100;

        // Risk zone backgrounds
        const zones = [
            { min: 0, max: 25, color: "rgba(34,197,94,0.06)" },
            { min: 25, max: 45, color: "rgba(59,130,246,0.06)" },
            { min: 45, max: 65, color: "rgba(234,179,8,0.06)" },
            { min: 65, max: 80, color: "rgba(249,115,22,0.06)" },
            { min: 80, max: 100, color: "rgba(239,68,68,0.06)" },
        ];

        for (const zone of zones) {
            const y1 = padTop + chartH - (zone.max / maxScore) * chartH;
            const y2 = padTop + chartH - (zone.min / maxScore) * chartH;
            ctx.fillStyle = zone.color;
            ctx.fillRect(padLeft, y1, chartW, y2 - y1);
        }

        // Grid lines
        const gridLines = [0, 25, 45, 65, 80, 100];
        ctx.strokeStyle = "rgba(113,113,122,0.15)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        for (const val of gridLines) {
            const y = padTop + chartH - (val / maxScore) * chartH;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(padLeft + chartW, y);
            ctx.stroke();

            // Label
            ctx.fillStyle = "#71717a";
            ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillText(String(val), padLeft - 6, y);
        }
        ctx.setLineDash([]);

        // Calculate points
        const points = sorted.map((d, i) => {
            const x = sorted.length === 1
                ? padLeft + chartW / 2
                : padLeft + (i / (sorted.length - 1)) * chartW;
            const y = padTop + chartH - (d.score / maxScore) * chartH;
            return { x, y, score: d.score, date: d.date };
        });

        // Gradient fill under line
        if (points.length > 1) {
            const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
            gradient.addColorStop(0, "rgba(99,102,241,0.25)");
            gradient.addColorStop(1, "rgba(99,102,241,0.01)");

            ctx.beginPath();
            ctx.moveTo(points[0].x, padTop + chartH);
            for (const p of points) {
                ctx.lineTo(p.x, p.y);
            }
            ctx.lineTo(points[points.length - 1].x, padTop + chartH);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Draw line
        if (points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = "#6366f1";
            ctx.lineWidth = 2.5;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.stroke();
        }

        // Draw dots
        for (const p of points) {
            // Glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = getScoreColor(p.score) + "33";
            ctx.fill();

            // Dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = getScoreColor(p.score);
            ctx.fill();
            ctx.strokeStyle = "#18181b";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // X-axis labels (dates)
        ctx.fillStyle = "#71717a";
        ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const maxLabels = Math.min(sorted.length, 7);
        const step = Math.max(1, Math.floor(sorted.length / maxLabels));

        for (let i = 0; i < sorted.length; i += step) {
            const p = points[i];
            const d = new Date(sorted[i].date + "T00:00:00");
            const label = d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
            ctx.fillText(label, p.x, padTop + chartH + 8);
        }
        // Always show last label
        if (sorted.length > 1) {
            const lastP = points[points.length - 1];
            const lastD = new Date(sorted[sorted.length - 1].date + "T00:00:00");
            const lastLabel = lastD.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
            ctx.fillText(lastLabel, lastP.x, padTop + chartH + 8);
        }
    }, [data]);

    if (data.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
                <p className="text-sm text-zinc-500">No hay datos suficientes para mostrar el gráfico.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Evolución del Score</h3>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-[10px] text-zinc-500">Bajo</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span className="text-[10px] text-zinc-500">Moderado</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-[10px] text-zinc-500">Severo</span>
                    </div>
                </div>
            </div>
            <div ref={containerRef} className="w-full">
                <canvas ref={canvasRef} className="w-full" />
            </div>
        </div>
    );
}
