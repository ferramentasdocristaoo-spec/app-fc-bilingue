import type { JourneyLanguage } from "./types";

/**
 * Pessoas novas de Josué (as que ainda não estão em `journeyPeople`).
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA. Nomes pela tradição bíblica de cada língua.
 * Reaproveitados de journeyPeople: god, moses, aaron, joshua, caleb, eleazar, abraham, jacob, joseph.
 * `phinehas` também está em numbers-people.ts com os mesmos nomes: ao registar, basta uma cópia.
 */
const p = (pt: string, en: string, es: string, fr: string, it: string, de: string): Record<JourneyLanguage, string> =>
  ({ "pt-PT": pt, en, es, fr, it, de });

export const joshuaPeople: Record<string, Record<JourneyLanguage, string>> = {
  rahab: p("Raabe", "Rahab", "Rahab", "Rahab", "Raab", "Rahab"),
  achan: p("Acã", "Achan", "Acán", "Akân", "Acan", "Achan"),
  "adoni-zedek": p("Adoni-Zedeque", "Adoni-zedek", "Adonisedec", "Adoni-Tsédeq", "Adoni-Sedek", "Adoni-Zedek"),
  jabin: p("Jabim", "Jabin", "Jabín", "Jabîn", "Iabin", "Jabin"),
  othniel: p("Otniel", "Othniel", "Otoniel", "Otniel", "Otniel", "Otniël"),
  achsah: p("Acsa", "Achsah", "Acsa", "Aksa", "Acsa", "Achsa"),
  phinehas: p("Fineias", "Phinehas", "Finees", "Phinéas", "Pincas", "Pinhas"),
};
