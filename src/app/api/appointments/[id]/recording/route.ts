import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { transcribeAudio } from "@/lib/transcribe";
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

    // Save audio to disk
    const recordingsDir = path.join(process.cwd(), "public", "recordings");
    if (!fs.existsSync(recordingsDir)) {
        fs.mkdirSync(recordingsDir, { recursive: true });
    }

    const ext = audioFile.name?.split(".").pop() || "webm";
    const fileName = `${id}.${ext}`;
    const filePath = path.join(recordingsDir, fileName);
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const audioUrl = `/recordings/${fileName}`;

    // Create recording entry
    let recording = await prisma.recording.findUnique({
        where: { appointmentId: id },
    });

    if (recording) {
        recording = await prisma.recording.update({
            where: { appointmentId: id },
            data: { audioUrl },
        });
    } else {
        recording = await prisma.recording.create({
            data: { appointmentId: id, audioUrl },
        });
    }

    // Attempt transcription (async, non-blocking for user)
    let transcript: string | null = null;
    try {
        if (process.env.GEMINI_API_KEY) {
            transcript = await transcribeAudio(filePath);
            await prisma.recording.update({
                where: { id: recording.id },
                data: { transcript, transcribedAt: new Date() },
            });
        }
    } catch (err) {
        console.error("Error en transcripción:", err);
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
