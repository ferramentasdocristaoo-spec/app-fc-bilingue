import type { JourneyLanguage } from "./types";

/**
 * Pessoas novas de Números (as que ainda não estão em `journeyPeople`).
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA. Nomes pela tradição bíblica de cada língua.
 * Reaproveitados de journeyPeople: moses, aaron, miriam, joshua, caleb, nadab, abihu,
 * eleazar, ithamar, manasseh. A filha de Zelofeade chama-se `noa` (não confundir com `noah`, Noé).
 */
const p = (pt: string, en: string, es: string, fr: string, it: string, de: string): Record<JourneyLanguage, string> =>
  ({ "pt-PT": pt, en, es, fr, it, de });

export const numbersPeople: Record<string, Record<JourneyLanguage, string>> = {
  hobab: p("Hobabe", "Hobab", "Hobab", "Hobab", "Obab", "Hobab"),
  eldad: p("Eldade", "Eldad", "Eldad", "Eldad", "Eldad", "Eldad"),
  medad: p("Medade", "Medad", "Medad", "Médad", "Medad", "Medad"),
  korah: p("Corá", "Korah", "Coré", "Coré", "Core", "Korach"),
  dathan: p("Datã", "Dathan", "Datán", "Dathân", "Datan", "Datan"),
  abiram: p("Abirão", "Abiram", "Abiram", "Abiram", "Abiram", "Abiram"),
  sihon: p("Seom", "Sihon", "Sehón", "Sihôn", "Sicon", "Sihon"),
  og: p("Ogue", "Og", "Og", "Og", "Og", "Og"),
  balaam: p("Balaão", "Balaam", "Balaam", "Balaam", "Balaam", "Bileam"),
  balak: p("Balaque", "Balak", "Balac", "Balaq", "Balak", "Balak"),
  phinehas: p("Fineias", "Phinehas", "Finees", "Phinéas", "Pincas", "Pinhas"),
  zelophehad: p("Zelofeade", "Zelophehad", "Zelofehad", "Celofehad", "Zelofcad", "Zelofhad"),
  mahlah: p("Maalá", "Mahlah", "Maala", "Mahla", "Macla", "Machla"),
  noa: p("Noa", "Noah", "Noa", "Noa", "Noa", "Noa"),
  hoglah: p("Hogla", "Hoglah", "Hogla", "Hogla", "Cogla", "Hogla"),
  milcah: p("Milca", "Milcah", "Milca", "Milka", "Milca", "Milka"),
  tirzah: p("Tirza", "Tirzah", "Tirsa", "Tirtsa", "Tirza", "Tirza"),
};
