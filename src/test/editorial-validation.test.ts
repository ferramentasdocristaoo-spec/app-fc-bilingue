import { describe, expect, it } from "vitest";
import { hasEditorialErrors, validateEditorialResult } from "@/features/bible-journey/editorial-validation";
import type { EditorialGenerationResult } from "@/features/bible-journey/editorial-generator";

const validResult: EditorialGenerationResult = {
  title: "A criação ordenada por Deus",
  summary: "Deus cria e organiza todas as coisas, estabelecendo a vida e o propósito da humanidade.",
  keyTheme: "Deus é o Criador soberano",
  characters: ["Deus", "Homem", "Mulher"], places: ["Terra"],
  relatedReferences: ["João 1:1-3", "Hebreus 11:3"], reflectionPrompt: "Como a criação transforma a sua visão de Deus?",
  previousConnection: "Este capítulo inicia a narrativa bíblica com a origem de todas as coisas.",
  nextConnection: "O capítulo seguinte aprofunda a criação e a vocação da humanidade.",
};

describe("editorial quality validation", () => {
  it("accepts a complete editorial result", () => expect(hasEditorialErrors(validateEditorialResult(validResult))).toBe(false));
  it("blocks incomplete and duplicated content", () => {
    const issues = validateEditorialResult({ ...validResult, summary: "Curto", relatedReferences: ["João 1:1", "João 1:1"] });
    expect(hasEditorialErrors(issues)).toBe(true);
    expect(issues.some(issue => issue.message.includes("duplicadas"))).toBe(true);
  });
  it("uses warnings for details that may legitimately be absent", () => {
    const issues = validateEditorialResult({ ...validResult, characters: [], places: [] });
    expect(hasEditorialErrors(issues)).toBe(false);
    expect(issues.filter(issue => issue.severity === "warning")).toHaveLength(2);
  });
});
