import type { JourneyLanguage } from "./types";
import type { JourneyPlace } from "./places";

/**
 * Lugares novos de Josué (os que o gazetteer de places.ts ainda não tinha).
 * Reaproveitados de places.ts: shechem (Siquém), hebron (Hebron · Manre), bethel.
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA.
 * Coordenadas: OpenBible.info "Bible Geocoding Data" (CC BY 4.0),
 * https://github.com/openbibleinfo/Bible-Geocoding-Data — `openBibleId` aponta para o
 * registo em `data/ancient.jsonl` (primeira identificação, ponto de `lonlat`).
 * Confiança: "certain" quando a fonte só traz uma identificação; "probable" quando a
 * identificação principal domina; "debated" quando há alternativas próximas ou poucos votos.
 * `shittim` e `jordan` também estão em numbers-places.ts com os mesmos dados (mesma fonte):
 * ao registar, basta uma cópia de cada.
 */
const n = (pt: string, en: string, es: string, fr: string, it: string, de: string): Record<JourneyLanguage, string> =>
  ({ "pt-PT": pt, en, es, fr, it, de });

export const joshuaPlaces: Record<string, JourneyPlace> = {
  shittim: { id: "shittim", openBibleId: "af64fb3", lon: 35.67368, lat: 31.84018, confidence: "probable", names: n("Sitim", "Shittim", "Sitim", "Shittim", "Sittim", "Schittim") },
  // Ponto do rio diante de Jericó (Js 3:16), não a nascente.
  jordan: { id: "jordan", openBibleId: "ae686c9", lon: 35.558333, lat: 31.761389, confidence: "certain", names: n("Rio Jordão", "Jordan River", "Río Jordán", "Le Jourdain", "Fiume Giordano", "Jordan") },
  gilgal: { id: "gilgal", openBibleId: "ab94aea", lon: 35.459969, lat: 31.881883, confidence: "probable", names: n("Gilgal", "Gilgal", "Gilgal", "Guilgal", "Gàlgala", "Gilgal") },
  jericho: { id: "jericho", openBibleId: "a231f80", lon: 35.444564, lat: 31.871719, confidence: "certain", names: n("Jericó", "Jericho", "Jericó", "Jéricho", "Gerico", "Jericho") },
  ai: { id: "ai", openBibleId: "a7e13e1", lon: 35.261111, lat: 31.916944, confidence: "probable", names: n("Ai", "Ai", "Hai", "Aï", "Ai", "Ai") },
  "mount-ebal": { id: "mount-ebal", openBibleId: "aa5cc66", lon: 35.2733, lat: 32.234, confidence: "certain", names: n("Monte Ebal", "Mount Ebal", "Monte Ebal", "Mont Ébal", "Monte Ebal", "Berg Ebal") },
  gibeon: { id: "gibeon", openBibleId: "aede336", lon: 35.183351, lat: 31.847451, confidence: "certain", names: n("Gibeom", "Gibeon", "Gabaón", "Gabaon", "Gàbaon", "Gibeon") },
  "aijalon-valley": { id: "aijalon-valley", openBibleId: "a2e6de9", lon: 34.959444, lat: 31.8675, confidence: "certain", names: n("Vale de Aijalom", "Valley of Aijalon", "Valle de Ajalón", "Vallée d'Ayyalôn", "Valle di Aialon", "Tal Ajalon") },
  hazor: { id: "hazor", openBibleId: "a6f33c5", lon: 35.569167, lat: 33.018333, confidence: "certain", names: n("Hazor", "Hazor", "Hazor", "Hatsor", "Cazor", "Hazor") },
  debir: { id: "debir", openBibleId: "ad2048e", lon: 35.01485, lat: 31.43209, confidence: "probable", names: n("Debir", "Debir", "Debir", "Debir", "Debir", "Debir") },
  shiloh: { id: "shiloh", openBibleId: "aa4680a", lon: 35.289536, lat: 32.055703, confidence: "certain", names: n("Siló", "Shiloh", "Silo", "Silo", "Silo", "Silo") },
  // No OpenBible: "Timnath-heres" (Jz 2:9), o mesmo registo de Js 19:50 e 24:30.
  "timnath-serah": { id: "timnath-serah", openBibleId: "a6e6528", lon: 35.10729, lat: 32.00806, confidence: "certain", names: n("Timnate-Sera", "Timnath-serah", "Timnat-sera", "Timnath-Sérah", "Timnat-Serach", "Timnat-Serach") },
  kedesh: { id: "kedesh", openBibleId: "a321cb8", lon: 35.529517, lat: 33.111638, confidence: "probable", names: n("Quedes", "Kedesh", "Cedes", "Qédesh", "Kedes", "Kedesch") },
};
