import type { JourneyLanguage } from "./types";
import type { JourneyPlace } from "./places";

/**
 * Lugares novos de Juízes (os que o gazetteer ainda não tinha).
 * Reaproveitados: debir, jericho (Cidade das Palmeiras, Jz 3:13), shechem, shiloh, jordan.
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA.
 * Coordenadas: OpenBible.info "Bible Geocoding Data" (CC BY 4.0),
 * https://github.com/openbibleinfo/Bible-Geocoding-Data — `openBibleId` aponta para o
 * registro em `data/ancient.jsonl` (primeira identificação, ponto de `lonlat`).
 * Confiança: "certain" quando a fonte só traz uma identificação; "probable" quando a
 * identificação principal domina; "debated" quando há alternativas próximas ou poucos votos.
 * `bethlehem` (Belém de Judá) pode existir também em ruth-places.ts com os mesmos dados.
 */
const n = (pt: string, en: string, es: string, fr: string, it: string, de: string): Record<JourneyLanguage, string> =>
  ({ "pt-PT": pt, en, es, fr, it, de });

export const judgesPlaces: Record<string, JourneyPlace> = {
  // OpenBible "Bezek 1" (Jz 1:4-5): a 1ª identificação remete à Khirbet Ibziq; local debatido.
  bezek: { id: "bezek", openBibleId: "af48fdd", lon: 35.39736, lat: 32.36884, confidence: "debated", names: n("Bezeque", "Bezek", "Bezec", "Bézeq", "Bezek", "Besek") },
  // Jz 2:1-5. A fonte identifica Boquim com Betel (ou com o carvalho de Alom-Bacute, perto dali).
  bochim: { id: "bochim", openBibleId: "a859268", lon: 35.241389, lat: 31.922778, confidence: "debated", names: n("Boquim", "Bochim", "Boquim", "Bokim", "Bochim", "Bochim") },
  "mount-tabor": { id: "mount-tabor", openBibleId: "acd63ee", lon: 35.392917, lat: 32.68625, confidence: "certain", names: n("Monte Tabor", "Mount Tabor", "Monte Tabor", "Mont Thabor", "Monte Tabor", "Berg Tabor") },
  kishon: { id: "kishon", openBibleId: "a5a6458", lon: 35.033333, lat: 32.816667, confidence: "probable", names: n("Rio Quisom", "Kishon River", "Río Cisón", "Torrent du Qishôn", "Torrente Kison", "Bach Kischon") },
  // Ofra dos abiezritas (Jz 6:11), "Ophrah 2" no OpenBible; várias identificações propostas.
  ophrah: { id: "ophrah", openBibleId: "abd637f", lon: 35.29, lat: 32.6057, confidence: "debated", names: n("Ofra", "Ophrah", "Ofra", "Ophra", "Ofra", "Ofra") },
  harod: { id: "harod", openBibleId: "ae3cace", lon: 35.355833, lat: 32.548611, confidence: "certain", names: n("Fonte de Harode", "Spring of Harod", "Fuente de Harod", "Source de Harod", "Fonte di Carod", "Quelle Harod") },
  "hill-of-moreh": { id: "hill-of-moreh", openBibleId: "a772880", lon: 35.34873, lat: 32.61764, confidence: "certain", names: n("Outeiro de Moré", "Hill of Moreh", "Collado de More", "Colline de Moré", "Colle di More", "Hügel More") },
  tob: { id: "tob", openBibleId: "aaff3e1", lon: 36.243889, lat: 32.563333, confidence: "probable", names: n("Terra de Tobe", "Land of Tob", "Tierra de Tob", "Pays de Tob", "Terra di Tob", "Land Tob") },
  // Mispa de Gileade (Jz 11:11, 29, 34), "Mizpah 1" no OpenBible.
  "mizpah-gilead": { id: "mizpah-gilead", openBibleId: "a0f8af9", lon: 35.77702, lat: 32.118511, confidence: "debated", names: n("Mispa de Gileade", "Mizpah of Gilead", "Mizpa de Galaad", "Mitspa de Galaad", "Mizpa di Gàlaad", "Mizpa in Gilead") },
  // Aroer de Jz 11:33 ("Aroer 2", em Amom), não a Aroer do Arnom.
  aroer: { id: "aroer", openBibleId: "af74969", lon: 35.871319, lat: 31.97016, confidence: "debated", names: n("Aroer", "Aroer", "Aroer", "Aroër", "Aroer", "Aroër") },
  zorah: { id: "zorah", openBibleId: "a08174b", lon: 34.985289, lat: 31.773992, confidence: "certain", names: n("Zorá", "Zorah", "Zora", "Tsorea", "Sorea", "Zora") },
  timnah: { id: "timnah", openBibleId: "a21f909", lon: 34.910297, lat: 31.784831, confidence: "probable", names: n("Timna", "Timnah", "Timnat", "Timna", "Timna", "Timna") },
  lehi: { id: "lehi", openBibleId: "aeeaca0", lon: 35.001006, lat: 31.748796, confidence: "debated", names: n("Leí", "Lehi", "Lehi", "Léhi", "Lechi", "Lehi") },
  gaza: { id: "gaza", openBibleId: "aa8edd2", lon: 34.4644, lat: 31.504, confidence: "certain", names: n("Gaza", "Gaza", "Gaza", "Gaza", "Gaza", "Gaza") },
  "sorek-valley": { id: "sorek-valley", openBibleId: "a339971", lon: 35.05, lat: 31.755833, confidence: "certain", names: n("Vale de Soreque", "Valley of Sorek", "Valle de Sorec", "Vallée de Soreq", "Valle di Sorek", "Tal Sorek") },
  dan: { id: "dan", openBibleId: "a513646", lon: 35.652, lat: 33.249, confidence: "certain", names: n("Dã · Laís", "Dan · Laish", "Dan · Lais", "Dan · Laïsh", "Dan · Lais", "Dan · Lajisch") },
  bethlehem: { id: "bethlehem", openBibleId: "a112427", lon: 35.207639, lat: 31.704306, confidence: "certain", names: n("Belém", "Bethlehem", "Belén", "Bethléem", "Betlemme", "Betlehem") },
  // Gibeá de Benjamim ("Gibeah 1").
  gibeah: { id: "gibeah", openBibleId: "ac24f5f", lon: 35.230718, lat: 31.823113, confidence: "probable", names: n("Gibeá", "Gibeah", "Gabaa", "Guibea", "Gabaa", "Gibea") },
  // Mispa de Benjamim (Jz 20:1), "Mizpah 3" (Tell en-Nasbeh).
  mizpah: { id: "mizpah", openBibleId: "a736f6c", lon: 35.216417, lat: 31.885136, confidence: "probable", names: n("Mispa", "Mizpah", "Mizpa", "Mitspa", "Mizpa", "Mizpa") },
};
