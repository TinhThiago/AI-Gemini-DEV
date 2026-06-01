import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { jsonrepair } from "jsonrepair";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

export const gemini = new GoogleGenAI({
  apiKey,
});

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isModelNotFound(error: any) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("not_found")
  );
}

function isRetryable(error: any) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("429")
  );
}

async function generateWithFallback(prompt: string, jsonMode = false) {
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Calling Gemini model=${model}, attempt=${attempt}`);

        const response = await gemini.models.generateContent({
          model,
          contents: prompt,
          config: jsonMode
            ? {
              responseMimeType: "application/json",
            }
            : undefined,
        });

        return response.text || "";
      } catch (error: any) {
        lastError = error;

        console.error(
          `Gemini error | model=${model} | attempt=${attempt}`,
          error?.message || error
        );

        if (isModelNotFound(error)) {
          break;
        }

        if (!isRetryable(error)) {
          throw error;
        }

        await sleep(1500 * attempt);
      }
    }
  }

  throw lastError;
}

export async function callGemini(prompt: string) {
  return generateWithFallback(prompt, false);
}

export async function callGeminiJson<T = any>(prompt: string): Promise<T> {
  const text = await generateWithFallback(prompt, true);
  const cleaned = cleanJsonText(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      const repaired = jsonrepair(cleaned);
      return JSON.parse(repaired);
    } catch (err: any) {
      const debugDir = path.join(process.cwd(), "debug");
      fs.mkdirSync(debugDir, { recursive: true });

      const debugFile = path.join(
        debugDir,
        `gemini-invalid-json-${Date.now()}.txt`
      );

      fs.writeFileSync(debugFile, cleaned, "utf8");

      console.error("RAW GEMINI JSON RESPONSE SAVED:", debugFile);
      console.error(cleaned.slice(0, 2000));

      throw new Error(
        `Gemini trả về JSON không hợp lệ. Đã lưu raw response tại: ${debugFile}`
      );
    }
  }
}

export function cleanJsonText(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}