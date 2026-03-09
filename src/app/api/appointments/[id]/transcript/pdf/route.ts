import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public endpoint for downloading diagnosis PDFs
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    const recording = await prisma.recording.findUnique({
        where: { appointmentId: id },
        include: {
            appointment: {
                select: {
                    date: true,
                    patientName: true,
                    doctor: {
                        select: { name: true, specialty: true }
                    }
                },
            },
        },
    });

    if (!recording || !recording.diagnosis) {
        return NextResponse.json({ error: "Diagnóstico no encontrado" }, { status: 404 });
    }

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

    // ── Header ──
    doc.setFillColor(24, 24, 27); // zinc-950
    doc.rect(0, 0, pageWidth, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Diagnóstico Clínico", margin, 18);

    // Date and Patient
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(161, 161, 170); // zinc-400
    const formattedDate = new Date(recording.appointment.date).toLocaleDateString("es-PE", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    doc.text(`${formattedDate} | Paciente: ${recording.appointment.patientName}`, margin, 26);
    doc.text(`${recording.appointment.doctor.specialty}: ${recording.appointment.doctor.name}`, margin, 32);

    y = 55;

    // ── Content ──
    const diagnosisText = recording.diagnosis;
    const transcriptText = recording.transcript;

    // Diagnosis Section
    doc.setFillColor(30, 58, 138); // blue-900
    doc.roundedRect(margin - 2, y - 5, contentWidth + 4, 10, 2, 2, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Resumen del Diagnóstico (IA)", margin + 2, y + 1);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(39, 39, 42); // zinc-800 for readability

    const diagnosisLines = doc.splitTextToSize(diagnosisText.replace(/\*\*(.*?)\*\*/g, "$1"), contentWidth - 4);
    for (const line of diagnosisLines) {
        checkPageBreak(6);
        doc.text(line, margin + 2, y);
        y += 6;
    }

    y += 10;

    // Transcript Section
    if (transcriptText) {
        checkPageBreak(30);
        doc.setFillColor(63, 63, 70); // zinc-700
        doc.roundedRect(margin - 2, y - 5, contentWidth + 4, 10, 2, 2, "F");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("Transcripción de la Sesión", margin + 2, y + 1);
        y += 12;

        doc.setFontSize(9);
        doc.setTextColor(82, 82, 91); // zinc-600
        const transcriptLines = doc.splitTextToSize(transcriptText, contentWidth - 4);
        for (const line of transcriptLines) {
            checkPageBreak(5);
            doc.text(line, margin + 2, y);
            y += 5;
        }
    }

    // ── Footer ──
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(161, 161, 170);
        doc.text("Burnout Monitor - Generado automáticamente", margin, pageHeight - 10);
        doc.text(`Página ${i}/${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const filename = `diagnostico-${id}.pdf`;

    return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename}"`,
        },
    });
}
