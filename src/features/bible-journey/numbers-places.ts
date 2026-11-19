import type { JourneyLanguage } from "./types";
import type { JourneyPlace } from "./places";

/**
 * Lugares novos de Números (os que o gazetteer de places.ts ainda não tinha).
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA.
 * Coordenadas: OpenBible.info "Bible Geocoding Data" (CC BY 4.0),
 * https://github.com/openbibleinfo/Bible-Geocoding-Data — `openBibleId` aponta para o
 * registo em `data/ancient.jsonl` (primeira identificação, ponto ou ponto representativo).
 * Confiança: "probable" quando a identificação principal domina; "debated" quando a fonte
 * traz várias identificações próximas em pontuação; "unknown" quando a fonte só dá um raio.
 * Reaproveitados de places.ts: sinai, kadesh-barnea, nebo, hebron, midian.
 */
const n = (pt: string, en: string, es: string, fr: string, it: string, de: string): Record<JourneyLanguage, string> =>
  ({ "pt-PT": pt, en, es, fr, it, de });

export const numbersPlaces: Record<string, JourneyPlace> = {
  // Região: a fonte dá o deserto de Parã como área (Nm 10:12; 12:16; 13:3).
  paran: { id: "paran", openBibleId: "aa6b19b", lon: 34.776667, lat: 30.303218, confidence: "probable", areaKm: 70, names: n("Deserto de Parã", "Wilderness of Paran", "Desierto de Parán", "Désert de Paran", "Deserto di Paran", "Wüste Paran") },
  // A fonte só diz «a menos de 50 km de Quibrote-Hataavá» (Nm 11:3).
  taberah: { id: "taberah", openBibleId: "a028191", lon: 34.275439, lat: 28.788667, confidence: "unknown", areaKm: 50, names: n("Taberá", "Taberah", "Taberá", "Tabeéra", "Tabera", "Tabera") },
  "kibroth-hattaavah": { id: "kibroth-hattaavah", openBibleId: "ae7836a", lon: 34.275439, lat: 28.788667, confidence: "debated", names: n("Quibrote-Hataavá", "Kibroth-hattaavah", "Kibrot-hataava", "Qibroth-Hattaava", "Kibrot-Taava", "Kibrot-Hattaawa") },
  hazeroth: { id: "hazeroth", openBibleId: "a1b6474", lon: 34.421667, lat: 28.896944, confidence: "probable", names: n("Hazerote", "Hazeroth", "Hazerot", "Hacéroth", "Caserot", "Hazerot") },
  // A fonte coloca o vale a menos de 5 km de Hebrom (Nm 13:22–24).
  eshcol: { id: "eshcol", openBibleId: "a38ecff", lon: 35.10222, lat: 31.525087, confidence: "probable", areaKm: 5, names: n("Vale de Escol", "Valley of Eshcol", "Valle de Escol", "Vallée d'Eshkol", "Valle di Escol", "Tal Eschkol") },
  zin: { id: "zin", openBibleId: "a0b5c50", lon: 35.325, lat: 30.971, confidence: "probable", areaKm: 40, names: n("Deserto de Zim", "Wilderness of Zin", "Desierto de Zin", "Désert de Tsin", "Deserto di Sin", "Wüste Zin") },
  "mount-hor": { id: "mount-hor", openBibleId: "ad8027f", lon: 35.056872, lat: 30.832057, confidence: "debated", names: n("Monte Hor", "Mount Hor", "Monte Hor", "Mont Hor", "Monte Or", "Berg Hor") },
  arad: { id: "arad", openBibleId: "abc358b", lon: 35.125, lat: 31.280833, confidence: "debated", names: n("Arade", "Arad", "Arad", "Arad", "Arad", "Arad") },
  jahaz: { id: "jahaz", openBibleId: "ad9b1cd", lon: 35.907928, lat: 31.588347, confidence: "debated", names: n("Jaza", "Jahaz", "Jahaza", "Yahats", "Iaas", "Jahaz") },
  edrei: { id: "edrei", openBibleId: "aaa6f7a", lon: 36.106111, lat: 32.625278, confidence: "probable", names: n("Edrei", "Edrei", "Edrei", "Édréï", "Edrei", "Edreï") },
  pisgah: { id: "pisgah", openBibleId: "afd9259", lon: 35.725556, lat: 31.767778, confidence: "probable", names: n("Monte Pisga", "Mount Pisgah", "Monte Pisga", "Mont Pisga", "Monte Pisga", "Berg Pisga") },
  shittim: { id: "shittim", openBibleId: "af64fb3", lon: 35.67368, lat: 31.84018, confidence: "probable", names: n("Sitim", "Shittim", "Sitim", "Shittim", "Sittim", "Schittim") },
  // Região «Moab 2» da fonte: as planícies de Moabe junto ao Jordão, em frente a Jericó (Nm 22:1; 33:48–50).
  "plains-of-moab": { id: "plains-of-moab", openBibleId: "aca767b", lon: 35.67368, lat: 31.84018, confidence: "probable", areaKm: 15, names: n("Planícies de Moabe", "Plains of Moab", "Llanuras de Moab", "Plaines de Moab", "Steppe di Moab", "Steppen Moabs") },
  gilead: { id: "gilead", openBibleId: "ae73b90", lon: 35.69211, lat: 32.187016, confidence: "probable", areaKm: 40, names: n("Gileade", "Gilead", "Galaad", "Galaad", "Galaad", "Gilead") },
  jordan: { id: "jordan", openBibleId: "ae686c9", lon: 35.558333, lat: 31.761389, confidence: "certain", names: n("Rio Jordão", "Jordan River", "Río Jordán", "Le Jourdain", "Fiume Giordano", "Jordan") },
};
