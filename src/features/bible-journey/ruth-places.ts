import type { JourneyLanguage } from "./types";
import type { JourneyPlace } from "./places";

/**
 * Lugares novos de Rute (os que o gazetteer de places.ts ainda não tinha).
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA.
 * Coordenadas: OpenBible.info "Bible Geocoding Data" (CC BY 4.0),
 * https://github.com/openbibleinfo/Bible-Geocoding-Data — `openBibleId` aponta para o
 * registro em `data/ancient.jsonl` (primeira identificação, ponto de `lonlat`).
 * `bethlehem` é "Bethlehem 1" (Belém de Judá, Rt 1:1), não a Belém de Zebulom.
 * `moab` é "Moab 1" (a região a leste do mar Morto); `areaKm` indica que é uma região.
 * O ajudante de Juízes pode registrar `bethlehem` com os mesmos dados (mesma fonte):
 * ao registrar, basta uma cópia.
 */
const n = (pt: string, en: string, es: string, fr: string, it: string, de: string): Record<JourneyLanguage, string> =>
  ({ "pt-PT": pt, en, es, fr, it, de });

export const ruthPlaces: Record<string, JourneyPlace> = {
  moab: { id: "moab", openBibleId: "aa0b1d6", lon: 35.701389, lat: 31.180556, confidence: "certain", areaKm: 40, names: n("Moabe", "Moab", "Moab", "Moab", "Moab", "Moab") },
  bethlehem: { id: "bethlehem", openBibleId: "a112427", lon: 35.207639, lat: 31.704306, confidence: "certain", names: n("Belém", "Bethlehem", "Belén", "Bethléem", "Betlemme", "Betlehem") },
};
