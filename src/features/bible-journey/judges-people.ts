import type { JourneyLanguage } from "./types";

/**
 * Pessoas novas de Juízes (as que ainda não estão em `journeyPeople`).
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA. Nomes pela tradição bíblica de cada língua.
 * Reaproveitados de journeyPeople: god, joshua, caleb, othniel, achsah, jabin, phinehas, eleazar.
 * `abimelech` aqui é o filho de Gideão (Jz 9), não o rei de Gerar de Gênesis.
 */
const p = (pt: string, en: string, es: string, fr: string, it: string, de: string): Record<JourneyLanguage, string> =>
  ({ "pt-PT": pt, en, es, fr, it, de });

export const judgesPeople: Record<string, Record<JourneyLanguage, string>> = {
  "adoni-bezek": p("Adoni-Bezeque", "Adoni-bezek", "Adoni-bezec", "Adoni-Bézeq", "Adoni-Bezek", "Adoni-Besek"),
  "cushan-rishathaim": p("Cusã-Risataim", "Cushan-rishathaim", "Cusan-risataim", "Koushân-Risheatayim", "Cusan-Risataim", "Kuschan-Rischatajim"),
  ehud: p("Eúde", "Ehud", "Aod", "Éhoud", "Eud", "Ehud"),
  eglon: p("Eglom", "Eglon", "Eglón", "Églôn", "Eglon", "Eglon"),
  deborah: p("Débora", "Deborah", "Débora", "Débora", "Debora", "Debora"),
  barak: p("Baraque", "Barak", "Barac", "Baraq", "Barak", "Barak"),
  // Jabim de Jz 4, rei de Canaã em Hazor; não é o Jabim de Js 11 (morto em Js 11:10).
  "jabin-canaan": p("Jabim", "Jabin", "Jabín", "Jabîn", "Iabin", "Jabin"),
  sisera: p("Sísera", "Sisera", "Sísara", "Sisera", "Sìsara", "Sisera"),
  jael: p("Jael", "Jael", "Jael", "Yaël", "Giaele", "Jaël"),
  gideon: p("Gideão", "Gideon", "Gedeón", "Gédéon", "Gedeone", "Gideon"),
  "joash-abiezrite": p("Joás, o abiezrita", "Joash the Abiezrite", "Joás abiezerita", "Joas l'Abiézérite", "Ioas l'Abiezerita", "Joasch der Abiësriter"),
  jether: p("Jéter", "Jether", "Jeter", "Yéter", "Ieter", "Jeter"),
  abimelech: p("Abimeleque", "Abimelech", "Abimelec", "Abimélek", "Abimèlec", "Abimelech"),
  jotham: p("Jotão", "Jotham", "Jotam", "Yotam", "Iotam", "Jotam"),
  jephthah: p("Jefté", "Jephthah", "Jefté", "Jephté", "Iefte", "Jeftah"),
  "jephthah-daughter": p("Filha de Jefté", "Jephthah's daughter", "Hija de Jefté", "Fille de Jephté", "Figlia di Iefte", "Jeftahs Tochter"),
  manoah: p("Manoá", "Manoah", "Manoa", "Manoah", "Manoach", "Manoach"),
  "manoah-wife": p("Mulher de Manoá", "Manoah's wife", "Mujer de Manoa", "Femme de Manoah", "Moglie di Manoach", "Manoachs Frau"),
  samson: p("Sansão", "Samson", "Sansón", "Samson", "Sansone", "Simson"),
  delilah: p("Dalila", "Delilah", "Dalila", "Dalila", "Dalila", "Delila"),
  micah: p("Mica", "Micah", "Micaía", "Mika", "Mica", "Micha"),
  "levite-bethlehem": p("Jovem levita de Belém", "Young Levite from Bethlehem", "Joven levita de Belén", "Jeune lévite de Bethléem", "Giovane levita di Betlemme", "Junger Levit aus Betlehem"),
  "levite-ephraim": p("Levita de Efraim", "Levite from Ephraim", "Levita de Efraín", "Lévite d'Éphraïm", "Levita di Èfraim", "Levit aus Ephraim"),
};
