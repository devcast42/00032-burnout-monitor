import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public endpoint — accessible via link (no auth required so WhatsApp recipients can download)
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    const surveyReport = await prisma.surveyReport.findUnique({
        where: { id },
        include: {
            survey: {
                select: { date: true, score: true },
            },
        },
    });

    if (!surveyReport || !surveyReport.report) {
        return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 });
    }

    // Dynamic import jsPDF (works in Node.js)
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const checkPageBreak = (needed: number) => {
        if (y + needed > pageHeight - 20) {
            doc.addPage();
            y = 20;
        }
    };

    const score = surveyReport.score;
    const reportText = surveyReport.report;
    const dateStr = surveyReport.survey.date;

    // ── Header ──
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, pageWidth, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Informe de Bienestar", margin, 18);

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(161, 161, 170);
    const formattedDate = new Date(dateStr + "T00:00:00").toLocaleDateString("es-PE", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    doc.text(formattedDate, margin, 26);

    // Score
    const scoreLabel = score <= 25 ? "Sin riesgo" : score <= 45 ? "Riesgo bajo" : score <= 65 ? "Riesgo moderado" : score <= 80 ? "Riesgo severo" : "Riesgo muy severo";
    const r = score <= 25 ? 34 : score <= 45 ? 59 : score <= 65 ? 234 : score <= 80 ? 249 : 239;
    const g = score <= 25 ? 197 : score <= 45 ? 130 : score <= 65 ? 179 : score <= 80 ? 115 : 68;
    const b = score <= 25 ? 94 : score <= 45 ? 246 : score <= 65 ? 8 : score <= 80 ? 22 : 68;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(r, g, b);
    doc.text(`${scoreLabel} - ${score}%`, pageWidth - margin, 18, { align: "right" });

    // Progress bar
    doc.setFillColor(39, 39, 42);
    doc.roundedRect(margin, 32, contentWidth, 5, 2, 2, "F");
    const barWidth = (score / 100) * contentWidth;
    doc.setFillColor(r, g, b);
    doc.roundedRect(margin, 32, Math.max(barWidth, 4), 5, 2, 2, "F");

    doc.setFontSize(8);
    doc.setTextColor(161, 161, 170);
    doc.text(`Probabilidad de burnout: ${score}%`, margin, 42);

    y = 55;

    // ── Parse markdown sections ──
    const sections: { title: string; content: string }[] = [];
    const lines = reportText.split("\n");
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

    // ── Render sections ──
    for (const section of sections.filter((s) => s.title)) {
        checkPageBreak(25);

        doc.setFillColor(39, 39, 42);
        doc.roundedRect(margin - 2, y - 5, contentWidth + 4, 10, 2, 2, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(section.title, margin + 2, y + 1);
        y += 12;

        const contentLines = section.content.split("\n").filter((l) => l.trim() !== "");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(82, 82, 91);

        for (const line of contentLines) {
            checkPageBreak(8);
            const cleanLine = line
                .replace(/\*\*(.*?)\*\*/g, "$1")
                .replace(/^[\s]*[-*]\s+/, "• ")
                .replace(/^[\s]*\d+\.\s+/, (m) => m.trim() + " ");

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
        doc.text("Burnout Monitor - Informe generado con IA", margin, pageHeight - 10);
        doc.text(`Página ${i}/${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }

    // Return PDF as response
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const filename = `informe-burnout-${dateStr}.pdf`;

    return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename}"`,
            "Cache-Control": "public, max-age=3600",
        },
    });
}
