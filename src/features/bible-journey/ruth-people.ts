import type { JourneyLanguage } from "./types";

/**
 * Pessoas novas de Rute (as que ainda não estão em `journeyPeople`).
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA. Nomes pela tradição bíblica de cada língua.
 * Reaproveitado de journeyPeople: god, judah (não usado na árvore, que começa em Perez como Rt 4:18).
 */
const p = (pt: string, en: string, es: string, fr: string, it: string, de: string): Record<JourneyLanguage, string> =>
  ({ "pt-PT": pt, en, es, fr, it, de });

export const ruthPeople: Record<string, Record<JourneyLanguage, string>> = {
  elimelech: p("Elimeleque", "Elimelech", "Elimelec", "Élimélek", "Elimèlec", "Elimelech"),
  naomi: p("Noemi", "Naomi", "Noemí", "Noémi", "Noemi", "Noomi"),
  mahlon: p("Malom", "Mahlon", "Mahlón", "Mahlôn", "Maclon", "Machlon"),
  chilion: p("Quiliom", "Chilion", "Quelión", "Kilyôn", "Chilion", "Kiljon"),
  orpah: p("Orfa", "Orpah", "Orfa", "Orpa", "Orpa", "Orpa"),
  ruth: p("Rute", "Ruth", "Rut", "Ruth", "Rut", "Rut"),
  boaz: p("Boaz", "Boaz", "Booz", "Booz", "Booz", "Boas"),
  obed: p("Obede", "Obed", "Obed", "Obed", "Obed", "Obed"),
  jesse: p("Jessé", "Jesse", "Isaí", "Jessé", "Iesse", "Isai"),
  david: p("Davi", "David", "David", "David", "Davide", "David"),
  perez: p("Perez", "Perez", "Fares", "Pérets", "Peres", "Perez"),
  hezron: p("Esrom", "Hezron", "Hezrón", "Hetsrôn", "Chesron", "Hezron"),
  ram: p("Rão", "Ram", "Ram", "Ram", "Ram", "Ram"),
  amminadab: p("Aminadabe", "Amminadab", "Aminadab", "Amminadab", "Amminadab", "Amminadab"),
  nahshon: p("Naassom", "Nahshon", "Naasón", "Nahshôn", "Nacson", "Nachschon"),
  salmon: p("Salmom", "Salmon", "Salmón", "Salmôn", "Salmon", "Salmon"),
};
