import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Transcribe an audio file using Google Gemini API.
 * @param filePath - Absolute path to the audio file
 * @returns The transcribed text in Spanish
 */
export async function transcribeAudio(filePath: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const audioBuffer = fs.readFileSync(filePath);
    const base64Audio = audioBuffer.toString("base64");

    const ext = path.extname(filePath).toLowerCase().replace(".", "");
    const mimeMap: Record<string, string> = {
        wav: "audio/wav",
        mp3: "audio/mp3",
        ogg: "audio/ogg",
        webm: "audio/webm",
        m4a: "audio/mp4",
        flac: "audio/flac",
    };
    const mimeType = mimeMap[ext] || "audio/webm";

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
