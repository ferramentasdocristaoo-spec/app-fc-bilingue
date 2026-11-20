import type { JourneyLanguage } from "./types";
import type { JourneyPlace } from "./places";

/**
 * Lugares novos de Deuteronômio (os que o gazetteer ainda não tinha).
 * Reaproveitados: plains-of-moab, sinai (Horebe), kadesh-barnea, edrei, pisgah, nebo, mount-ebal.
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA.
 * Coordenadas: OpenBible.info "Bible Geocoding Data" (CC BY 4.0),
 * https://github.com/openbibleinfo/Bible-Geocoding-Data — `openBibleId` aponta para o
 * registro em `data/ancient.jsonl` (primeira identificação, ponto de `lonlat`).
 * Confiança: Hesbom (Tell Hesban, 551 votos contra 111) "probable"; Gerizim tem uma só
 * identificação, "certain"; Bete-Peor tem duas identificações quase empatadas (129 × 124), "debated".
 */
const n = (pt: string, en: string, es: string, fr: string, it: string, de: string): Record<JourneyLanguage, string> =>
  ({ "pt-PT": pt, en, es, fr, it, de });

export const deuteronomyPlaces: Record<string, JourneyPlace> = {
  heshbon: { id: "heshbon", openBibleId: "abf2fc1", lon: 35.809062, lat: 31.800811, confidence: "probable", names: n("Hesbom", "Heshbon", "Hesbón", "Heshbôn", "Chesbon", "Heschbon") },
  "mount-gerizim": { id: "mount-gerizim", openBibleId: "a30e967", lon: 35.272778, lat: 32.199444, confidence: "certain", names: n("Monte Gerizim", "Mount Gerizim", "Monte Gerizim", "Mont Garizim", "Monte Garizim", "Berg Garizim") },
  "beth-peor": { id: "beth-peor", openBibleId: "af3ce34", lon: 35.738498, lat: 31.777021, confidence: "debated", names: n("Bete-Peor", "Beth-peor", "Bet-peor", "Beth-Péor", "Bet-Peor", "Bet-Peor") },
};
