import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { JourneyBook, JourneyLanguage } from "@/features/bible-journey/types";

/**
 * Nome do livro da Jornada no idioma da interface.
 * O catálogo ainda não tem pt-BR (cai em pt-PT: "Génesis", "Deuteronómio"); quando a interface está em
 * português do Brasil, usa os nomes brasileiros de `biblia.books` pelo número canônico do livro.
 */
export function useJourneyBookTitle(language: JourneyLanguage) {
  const { t, i18n } = useTranslation();
  const ui = (i18n.resolvedLanguage || i18n.language || "").toLowerCase();
  const brasil = ui === "pt-br";
  return useCallback(
    (book: Pick<JourneyBook, "bibleBookId" | "overview">) => {
      if (brasil) {
        const nomes = t("biblia.books", { returnObjects: true });
        const nome = Array.isArray(nomes) ? nomes[book.bibleBookId - 1] : undefined;
        if (typeof nome === "string" && nome) return nome;
      }
      return book.overview[language]?.title ?? "";
    },
    [brasil, language, t]
  );
}
