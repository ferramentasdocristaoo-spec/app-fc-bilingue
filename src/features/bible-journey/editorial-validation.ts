import type { EditorialGenerationResult } from "./editorial-generator";

export type EditorialValidationSeverity = "error" | "warning";
export interface EditorialValidationIssue { field: keyof EditorialGenerationResult; severity: EditorialValidationSeverity; message: string }

export function validateEditorialResult(result: EditorialGenerationResult): EditorialValidationIssue[] {
  const issues: EditorialValidationIssue[] = [];
  const requiredText: Array<[keyof EditorialGenerationResult, string, number]> = [
    ["title", "O título precisa ser mais específico.", 5],
    ["summary", "O resumo precisa ter pelo menos 40 caracteres.", 40],
    ["keyTheme", "Informe claramente o tema central.", 5],
    ["reflectionPrompt", "A pergunta de reflexão está muito curta.", 15],
    ["previousConnection", "Explique a ligação com o capítulo anterior ou o início da narrativa.", 10],
    ["nextConnection", "Explique a ligação com o próximo capítulo ou o encerramento da narrativa.", 10],
  ];
  for (const [field, message, minimum] of requiredText) {
    if (String(result[field] || "").trim().length < minimum) issues.push({ field, severity: "error", message });
  }

  const references = result.relatedReferences.map(reference => reference.trim()).filter(Boolean);
  if (references.length < 2 || references.length > 5) issues.push({ field: "relatedReferences", severity: "error", message: "Use entre 2 e 5 referências bíblicas relacionadas." });
  if (new Set(references.map(reference => reference.toLowerCase())).size !== references.length) issues.push({ field: "relatedReferences", severity: "error", message: "Remova referências bíblicas duplicadas." });
  if (references.some(reference => !/\d/.test(reference))) issues.push({ field: "relatedReferences", severity: "warning", message: "Confira se todas as referências incluem capítulo ou versículo." });
  if (!result.characters.length) issues.push({ field: "characters", severity: "warning", message: "Nenhum personagem informado; confirme se isso corresponde ao capítulo." });
  if (!result.places.length) issues.push({ field: "places", severity: "warning", message: "Nenhum lugar informado; confirme se isso corresponde ao capítulo." });
  if (!/[?？]$/.test(result.reflectionPrompt.trim())) issues.push({ field: "reflectionPrompt", severity: "warning", message: "A reflexão deveria ser apresentada como pergunta." });
  return issues;
}

export const hasEditorialErrors = (issues: EditorialValidationIssue[]) => issues.some(issue => issue.severity === "error");
