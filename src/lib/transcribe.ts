import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function resolveMimeType(input: string): string {
    const normalized = input.toLowerCase();
    const mimeMap: Record<string, string> = {
        wav: "audio/wav",
        mp3: "audio/mp3",
        ogg: "audio/ogg",
        webm: "audio/webm",
        m4a: "audio/mp4",
        flac: "audio/flac",
        "audio/wav": "audio/wav",
        "audio/mp3": "audio/mp3",
        "audio/mpeg": "audio/mp3",
        "audio/ogg": "audio/ogg",
        "audio/webm": "audio/webm",
        "audio/mp4": "audio/mp4",
        "audio/flac": "audio/flac",
    };
    return mimeMap[normalized] || "audio/webm";
}

export async function transcribeAudioBuffer(
    audioBuffer: Buffer,
    mimeInput: string,
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const base64Audio = audioBuffer.toString("base64");
    const mimeType = resolveMimeType(mimeInput);

    const result = await model.generateContent([
        {
            inlineData: {
                mimeType,
                data: base64Audio,
            },
        },
        {
            text: "Transcribe el audio completo en español. Devuelve SOLO el texto transcrito, sin comentarios adicionales, sin marcas de tiempo, sin etiquetas de hablante. Si hay múltiples hablantes, separa cada intervención en un párrafo nuevo.",
        },
    ]);

    const response = result.response;
    return response.text();
}

/**
 * Transcribe an audio file using Google Gemini API.
 * @param filePath - Absolute path to the audio file
 * @returns The transcribed text in Spanish
 */
export async function transcribeAudio(filePath: string): Promise<string> {
    const audioBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase().replace(".", "");
    return transcribeAudioBuffer(audioBuffer, ext);
}
