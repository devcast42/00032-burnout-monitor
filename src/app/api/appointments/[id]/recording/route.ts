import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { transcribeAudioBuffer } from "@/lib/transcribe";
import { generateDiagnosisFromTranscript } from "@/lib/gemini";
import fs from "fs";
import path from "path";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const user = await getSessionUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
        return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    // Receive audio file from FormData
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
        return NextResponse.json(
            { error: "Se requiere archivo de audio" },
            { status: 400 },
        );
    }

    const ext = audioFile.name?.split(".").pop() || "webm";
    const fileName = `${id}.${ext}`;
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    let audioUrl: string | null = null;

    const recordingsDir = path.join(process.cwd(), "public", "recordings");
    const filePath = path.join(recordingsDir, fileName);
    try {
        if (!fs.existsSync(recordingsDir)) {
            fs.mkdirSync(recordingsDir, { recursive: true });
        }
        fs.writeFileSync(filePath, buffer);
        audioUrl = `/recordings/${fileName}`;
    } catch (err) {
        const maybeNodeError = err as NodeJS.ErrnoException;
        if (maybeNodeError.code !== "EROFS") {
            throw err;
        }
    }

    // Create recording entry
    let recording = await prisma.recording.findUnique({
        where: { appointmentId: id },
    });

    if (recording) {
        recording = await prisma.recording.update({
            where: { appointmentId: id },
            data: audioUrl ? { audioUrl } : {},
        });
    } else {
        recording = await prisma.recording.create({
            data: { appointmentId: id, audioUrl },
        });
    }

    // Attempt transcription and AI diagnosis (async, non-blocking for user)
    let transcript: string | null = null;
    let diagnosis: string | null = null;
    try {
        if (process.env.GEMINI_API_KEY) {
            transcript = await transcribeAudioBuffer(
                buffer,
                audioFile.type || ext,
            );

            if (transcript) {
                diagnosis = await generateDiagnosisFromTranscript(transcript);
            }

            await prisma.recording.update({
                where: { id: recording.id },
                data: {
                    transcript,
                    diagnosis,
                    transcribedAt: new Date()
                },
            });
        }
    } catch (err) {
        console.error("Error en transcripción o diagnóstico de IA:", err);
    }

    // Mark appointment as completed
    await prisma.appointment.update({
        where: { id },
        data: { status: "COMPLETED" },
    });

    return NextResponse.json({
        recording: {
            id: recording.id,
            audioUrl,
            transcript,
        },
    });
}

export async function GET(_request: Request, context: RouteContext) {
    const { id } = await context.params;

    const recording = await prisma.recording.findUnique({
        where: { appointmentId: id },
    });

    if (!recording) {
        return NextResponse.json(
            { error: "No hay grabación para esta cita" },
            { status: 404 },
        );
    }

    return NextResponse.json({ recording });
}
