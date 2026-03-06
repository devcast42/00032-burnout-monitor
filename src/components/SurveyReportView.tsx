"use client";

import { Download, Share2 } from "lucide-react";

type SurveyReportViewProps = {
    report: string;
    score: number;
    date?: string;
    reportId?: string;
    onClose?: () => void;
};

function getScoreColor(score: number) {
    if (score <= 25) return { bg: "bg-green-900/50", text: "text-green-200", border: "border-green-800", label: "Sin riesgo" };
    if (score <= 45) return { bg: "bg-blue-900/50", text: "text-blue-200", border: "border-blue-800", label: "Riesgo bajo" };
    if (score <= 65) return { bg: "bg-yellow-900/50", text: "text-yellow-200", border: "border-yellow-800", label: "Riesgo moderado" };
    if (score <= 80) return { bg: "bg-orange-900/50", text: "text-orange-200", border: "border-orange-800", label: "Riesgo severo" };
    return { bg: "bg-red-900/50", text: "text-red-200", border: "border-red-800", label: "Riesgo muy severo" };
}

function renderMarkdown(md: string) {
    const sections: { title: string; content: string }[] = [];
    const lines = md.split("\n");
    let currentTitle = "";
    let currentContent: string[] = [];

    for (const line of lines) {
        if (line.startsWith("## ")) {
            if (currentTitle || currentContent.length > 0) {
                sections.push({ title: currentTitle, content: currentContent.join("\n") });
            }
            currentTitle = line.replace("## ", "").trim();
            currentContent = [];
        } else {
            currentContent.push(line);
        }
    }
    if (currentTitle || currentContent.length > 0) {
        sections.push({ title: currentTitle, content: currentContent.join("\n") });
    }

    return sections;
}

const sectionIcons: Record<string, string> = {
    "Resumen del Estado": "📋",
    "Áreas de Riesgo Identificadas": "⚠️",
    "Recomendaciones Personalizadas": "💡",
    "Plan de Acción Inmediato": "🎯",
};

function formatContent(text: string) {
    return text
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line, idx) => {
            // Bold text
            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
                const content = formatted.replace(/^[\s]*[-*]\s+/, "");
                return (
                    <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300 leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-500" />
                        <span dangerouslySetInnerHTML={{ __html: content }} />
                    </li>
                );
            }

            // Numbered list
            const numMatch = formatted.match(/^[\s]*(\d+)\.\s+(.+)/);
            if (numMatch) {
                return (
                    <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300 leading-relaxed">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
                            {numMatch[1]}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: numMatch[2] }} />
                    </li>
                );
            }

            return (
                <p key={idx} className="text-sm text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
            );
        });
}

async function buildPDFBlob(report: string, score: number, date?: string) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const checkPageBreak = (needed: number) => {
        if (y + needed > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            y = 20;
        }
    };

    // ── Header ──
    doc.setFillColor(24, 24, 27); // zinc-950
    doc.rect(0, 0, pageWidth, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Informe de Bienestar", margin, 18);

    // Date
    if (date) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(161, 161, 170); // zinc-400
        const dateStr = new Date(date).toLocaleDateString("es-PE", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
        });
        doc.text(dateStr, margin, 26);
    }

    // Score badge
    const scoreLabel = score <= 25 ? "Sin riesgo" : score <= 45 ? "Riesgo bajo" : score <= 65 ? "Riesgo moderado" : score <= 80 ? "Riesgo severo" : "Riesgo muy severo";
    const r = score <= 25 ? 34 : score <= 45 ? 59 : score <= 65 ? 234 : score <= 80 ? 249 : 239;
    const g = score <= 25 ? 197 : score <= 45 ? 130 : score <= 65 ? 179 : score <= 80 ? 115 : 68;
    const b = score <= 25 ? 94 : score <= 45 ? 246 : score <= 65 ? 8 : score <= 80 ? 22 : 68;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(r, g, b);
    doc.text(`${scoreLabel} - ${score}%`, pageWidth - margin, 18, { align: "right" });

    // Progress bar
    doc.setFillColor(39, 39, 42); // zinc-800
    doc.roundedRect(margin, 32, contentWidth, 5, 2, 2, "F");
    const barWidth = (score / 100) * contentWidth;
    doc.setFillColor(r, g, b);
    doc.roundedRect(margin, 32, Math.max(barWidth, 4), 5, 2, 2, "F");

    doc.setFontSize(8);
    doc.setTextColor(161, 161, 170);
    doc.text(`Probabilidad de burnout: ${score}%`, margin, 42);

    y = 55;

    // ── Sections ──
    const sections = renderMarkdown(report).filter((s) => s.title);

    for (const section of sections) {
        checkPageBreak(25);

        // Section title
        doc.setFillColor(39, 39, 42);
        doc.roundedRect(margin - 2, y - 5, contentWidth + 4, 10, 2, 2, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(section.title, margin + 2, y + 1);
        y += 12;

        // Section content
        const lines = section.content.split("\n").filter((l) => l.trim() !== "");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(82, 82, 91); // zinc-600 for print readability

        for (const line of lines) {
            checkPageBreak(8);
            const cleanLine = line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/^[\s]*[-*]\s+/, "• ").replace(/^[\s]*\d+\.\s+/, (m) => m.trim() + " ");

            const splitLines = doc.splitTextToSize(cleanLine, contentWidth - 4);
            for (const sl of splitLines) {
                checkPageBreak(6);
                doc.text(sl, margin + 2, y);
                y += 5.5;
            }
            y += 1.5;
        }

        y += 6;
    }

    // ── Footer ──
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(161, 161, 170);
        doc.text("Burnout Monitor - Informe generado con IA", margin, doc.internal.pageSize.getHeight() - 10);
        doc.text(`Página ${i}/${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
    }

    // Return blob + filename
    const dateSlug = date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    const filename = `informe-burnout-${dateSlug}.pdf`;
    const blob = doc.output("blob");
    return { blob, filename, doc };
}

async function downloadReportAsPDF(report: string, score: number, date?: string) {
    const { doc, filename } = await buildPDFBlob(report, score, date);
    doc.save(filename);
}

function shareReportToWhatsApp(score: number, reportId?: string) {
    const scoreLabel = score <= 25 ? "Sin riesgo" : score <= 45 ? "Riesgo bajo" : score <= 65 ? "Riesgo moderado" : score <= 80 ? "Riesgo severo" : "Riesgo muy severo";

    // Build PDF URL from the current origin
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const pdfUrl = reportId
        ? `${baseUrl}/api/surveys/reports/${reportId}/pdf`
        : null;

    const text = encodeURIComponent(
        `📋 *Informe de Bienestar - Burnout Monitor*\n\n` +
        `🔹 Probabilidad de burnout: *${score}%*\n` +
        `🔹 Nivel: *${scoreLabel}*\n\n` +
        (pdfUrl ? `📎 Descarga el informe completo aquí:\n${pdfUrl}` : ``)
    );

    window.open(`https://wa.me/?text=${text}`, "_blank");
}

export default function SurveyReportView({ report, score, date, reportId, onClose }: SurveyReportViewProps) {
    const scoreInfo = getScoreColor(score);
    const sections = renderMarkdown(report);

    return (
        <div className="space-y-5">
            {/* Header with score badge */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Informe de Bienestar</h3>
                    {date && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {new Date(date).toLocaleDateString("es-PE", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    )}
                </div>
                <div className={`rounded-full px-3 py-1.5 text-xs font-semibold ${scoreInfo.bg} ${scoreInfo.text} border ${scoreInfo.border}`}>
                    {scoreInfo.label} · {score}%
                </div>
            </div>

            {/* Score progress bar */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-500">Probabilidad de burnout</span>
                    <span className="text-xs font-medium text-zinc-400">{score}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${score}%`,
                            background: score <= 25
                                ? "linear-gradient(90deg, #22c55e, #10b981)"
                                : score <= 45
                                    ? "linear-gradient(90deg, #3b82f6, #6366f1)"
                                    : score <= 65
                                        ? "linear-gradient(90deg, #eab308, #f59e0b)"
                                        : score <= 80
                                            ? "linear-gradient(90deg, #f97316, #ef4444)"
                                            : "linear-gradient(90deg, #ef4444, #dc2626)",
                        }}
                    />
                </div>
            </div>

            {/* Report sections */}
            {sections
                .filter((s) => s.title)
                .map((section, idx) => (
                    <div
                        key={idx}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{sectionIcons[section.title] || "📄"}</span>
                            <h4 className="text-sm font-semibold text-white">{section.title}</h4>
                        </div>
                        <div className="space-y-2">
                            {formatContent(section.content)}
                        </div>
                    </div>
                ))}

            {/* Action buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => downloadReportAsPDF(report, score, date)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
                >
                    <Download size={16} />
                    PDF
                </button>
                <button
                    onClick={() => shareReportToWhatsApp(score, reportId)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1fba59] transition-colors"
                >
                    <Share2 size={16} />
                    WhatsApp
                </button>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
                    >
                        Entendido
                    </button>
                )}
            </div>
        </div>
    );
}
