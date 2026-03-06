import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { dynamicFields } from "@/lib/burnoutProfileData";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function mapAnswersToText(answers: Record<string, number>): string {
    return dynamicFields
        .map((field) => {
            const selected = field.options.find((o) => o.value === answers[field.key]);
            return `- ${field.label}: ${selected?.label ?? "No respondido"}`;
        })
        .join("\n");
}

function getScoreLabel(score: number): string {
    if (score <= 18) return "Sin riesgo";
    if (score <= 32) return "Riesgo bajo";
    if (score <= 49) return "Riesgo moderado";
    if (score <= 59) return "Riesgo severo";
    return "Riesgo muy severo";
}

async function callGeminiWithRetry(prompt: string, maxRetries = 3): Promise<string> {
    const models = ["gemini-3-flash-preview"];

    for (const modelName of models) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                return result.response.text();
            } catch (err: unknown) {
                const error = err as { status?: number; message?: string };
                console.error(`Gemini attempt ${attempt + 1} with ${modelName}:`, error.message || err);

                // If rate limited, wait and retry
                if (error.status === 429) {
                    const waitMs = Math.min(1000 * Math.pow(2, attempt), 10000);
                    console.log(`Rate limited. Waiting ${waitMs}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitMs));
                    continue;
                }

                // For other errors, try next model
                break;
            }
        }
    }

    throw new Error("All Gemini models exhausted or rate limited");
}

export async function generateBurnoutReport(
    score: number,
    answers: Record<string, number>,
    prediction: { prediction: number; burnout_probability: number } | null,
): Promise<string> {
    const answersText = mapAnswersToText(answers);
    const riskLevel = getScoreLabel(score);
    const predictionText = prediction
        ? `Predicción de IA: ${prediction.prediction === 1 ? "Tiene Burnout" : "No tiene Burnout"} (Probabilidad: ${(prediction.burnout_probability * 100).toFixed(1)}%)`
        : "Sin predicción disponible";

    const prompt = `Eres un experto en salud mental ocupacional y bienestar laboral. Genera un informe profesional y empático en español basado en los resultados de una encuesta de burnout.

DATOS DEL PACIENTE:
- Puntuación total: ${score}/75
- Nivel de riesgo: ${riskLevel}
- ${predictionText}

RESPUESTAS DE LA ENCUESTA:
${answersText}

Genera un informe en formato markdown con EXACTAMENTE estas 4 secciones. Usa encabezados con ##:

## Resumen del Estado
Un párrafo breve evaluando el estado general del paciente basándose en los datos.

## Áreas de Riesgo Identificadas
Lista los factores de riesgo detectados según las respuestas (máximo 4 puntos).

## Recomendaciones Personalizadas
Acciones específicas y prácticas que el paciente puede tomar (máximo 5 recomendaciones).

## Plan de Acción Inmediato
3 pasos concretos para las próximas 2 semanas.

IMPORTANTE: Sé empático, profesional y constructivo. No uses lenguaje alarmista. Cada sección debe ser concisa pero útil.`;

    return callGeminiWithRetry(prompt);
}