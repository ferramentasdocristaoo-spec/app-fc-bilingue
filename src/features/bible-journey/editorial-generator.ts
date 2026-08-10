import type { JourneyLanguage } from "./types";
import { supabase } from "@/integrations/supabase/client";
import type { AdminCredentials } from "./published-editorial";

export interface EditorialGenerationInput {
  bookName: string;
  chapter: number;
  language: JourneyLanguage;
  scriptureText: string;
  previousChapterTitle?: string;
  nextChapterTitle?: string;
}

export interface EditorialGenerationResult {
  title: string;
  summary: string;
  keyTheme: string;
  characters: string[];
  places: string[];
  relatedReferences: string[];
  reflectionPrompt: string;
  previousConnection: string;
  nextConnection: string;
}

export interface JourneyAiUsage { used: number; limit: number; remaining: number }

export const editorialResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "keyTheme", "characters", "places", "relatedReferences", "reflectionPrompt", "previousConnection", "nextConnection"],
  properties: {
    title: { type: "string" }, summary: { type: "string" }, keyTheme: { type: "string" },
    characters: { type: "array", items: { type: "string" } }, places: { type: "array", items: { type: "string" } },
    relatedReferences: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 }, reflectionPrompt: { type: "string" },
    previousConnection: { type: "string" }, nextConnection: { type: "string" },
  },
} as const;

export function buildEditorialPrompt(input: EditorialGenerationInput): string {
  return `Create a faithful editorial guide for ${input.bookName} ${input.chapter} in ${input.language}.
Use only information supported by the supplied biblical chapter. Do not invent characters, places, events or quotations.
Write a specific title, a concise 2-3 sentence summary, the central theme, named characters, explicit places, 2-5 related Bible references, one reflective question, and short narrative connections.
Previous chapter: ${input.previousChapterTitle || "none"}.
Next chapter: ${input.nextChapterTitle || "none"}.
BIBLICAL TEXT:\n${input.scriptureText}`;
}

export async function generateChapterEditorial(input: EditorialGenerationInput, adminCredentials: AdminCredentials): Promise<EditorialGenerationResult> {
  if (!input.scriptureText.trim()) throw new Error("scripture_text_required");
  const { data, error } = await supabase.functions.invoke("ai-assistant", {
    body: { action: "jornada-capitulo", adminCredentials, payload: { lang: input.language, bookName: input.bookName, chapter: input.chapter, scriptureText: input.scriptureText, previousChapterTitle: input.previousChapterTitle, nextChapterTitle: input.nextChapterTitle } },
  });
  if (error) throw error;
  if (!data?.result) throw new Error("editorial_generation_failed");
  return data.result as EditorialGenerationResult;
}

export async function getJourneyAiUsage(adminCredentials: AdminCredentials): Promise<JourneyAiUsage> {
  const { data, error } = await supabase.functions.invoke("ai-assistant", {
    body: { action: "jornada-uso", adminCredentials, payload: { lang: "pt-PT" } },
  });
  if (error || !data?.result) throw error || new Error("journey_usage_failed");
  return data.result as JourneyAiUsage;
}
