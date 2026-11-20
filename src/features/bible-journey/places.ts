import type { JourneyLanguage } from "./types";
import { numbersPlaces } from "./numbers-places";
import { joshuaPlaces } from "./joshua-places";
import { deuteronomyPlaces } from "./deuteronomy-places";
import { judgesPlaces } from "./judges-places";
import { ruthPlaces } from "./ruth-places";

/**
 * Gazetteer da Jornada.
 * Coordenadas: OpenBible.info "Bible Geocoding Data" (CC BY 4.0),
 * https://github.com/openbibleinfo/Bible-Geocoding-Data — o campo `openBibleId`
 * aponta para o registo de origem em `data/ancient.jsonl`.
 * Nomes nos 6 idiomas: tradições bíblicas de cada língua (revistos à mão).
 */
export type PlaceConfidence = "certain" | "probable" | "debated" | "unknown";

export interface JourneyPlace {
  id: string;
  openBibleId?: string;
  lon: number;
  lat: number;
  confidence: PlaceConfidence;
  /** Raio (km) quando o lugar é uma região ou não tem localização conhecida. */
  areaKm?: number;
  names: Record<JourneyLanguage, string>;
}

const n = (pt: string, en: string, es: string, fr: string, it: string, de: string): Record<JourneyLanguage, string> =>
  ({ "pt-PT": pt, en, es, fr, it, de });

export const basePlaces: Record<string, JourneyPlace> = {
  // Éden e Node: sem localização conhecida. O ponto é só indicativo (perto do Tigre e Eufrates, Gn 2:14).
  eden: { id: "eden", openBibleId: "af3daeb", lon: 46.2, lat: 31.9, confidence: "unknown", areaKm: 170, names: n("Éden", "Eden", "Edén", "Éden", "Eden", "Eden") },
  "tigris-euphrates": { id: "tigris-euphrates", openBibleId: "a38ebfd", lon: 47.4421, lat: 31.0043, confidence: "probable", names: n("Tigre e Eufrates", "Tigris and Euphrates", "Tigris y Éufrates", "Tigre et Euphrate", "Tigri ed Eufrate", "Tigris und Euphrat") },
  nod: { id: "nod", openBibleId: "a1ad8e1", lon: 48.3, lat: 33.6, confidence: "unknown", areaKm: 170, names: n("Terra de Node", "Land of Nod", "Tierra de Nod", "Pays de Nod", "Paese di Nod", "Land Nod") },
  ararat: { id: "ararat", openBibleId: "ab89be9", lon: 44.300381, lat: 39.702761, confidence: "probable", areaKm: 140, names: n("Montes de Ararate", "Mountains of Ararat", "Montes de Ararat", "Monts d'Ararat", "Monti dell'Ararat", "Gebirge Ararat") },
  nineveh: { id: "nineveh", openBibleId: "a70fd5d", lon: 43.1528, lat: 36.3594, confidence: "certain", names: n("Nínive", "Nineveh", "Nínive", "Ninive", "Ninive", "Ninive") },
  babel: { id: "babel", openBibleId: "ab8fdbc", lon: 44.422222, lat: 32.543333, confidence: "probable", names: n("Babel · Sinear", "Babel · Shinar", "Babel · Sinar", "Babel · Shinéar", "Babele · Sinar", "Babel · Schinar") },
  ur: { id: "ur", openBibleId: "a6cf75c", lon: 46.104444, lat: 30.962222, confidence: "debated", names: n("Ur dos Caldeus", "Ur of the Chaldeans", "Ur de los caldeos", "Ur en Chaldée", "Ur dei Caldei", "Ur in Chaldäa") },
  haran: { id: "haran", openBibleId: "a6d9af3", lon: 39.032778, lat: 36.864444, confidence: "probable", names: n("Harã", "Haran", "Harán", "Harrân", "Carran", "Haran") },
  shechem: { id: "shechem", openBibleId: "adf74d4", lon: 35.281944, lat: 32.213611, confidence: "certain", names: n("Siquém", "Shechem", "Siquem", "Sichem", "Sichem", "Sichem") },
  bethel: { id: "bethel", openBibleId: "a64f355", lon: 35.241389, lat: 31.922778, confidence: "probable", names: n("Betel", "Bethel", "Betel", "Béthel", "Betel", "Bethel") },
  egypt: { id: "egypt", openBibleId: "af301ca", lon: 31.3075, lat: 30.129444, confidence: "certain", areaKm: 120, names: n("Egito", "Egypt", "Egipto", "Égypte", "Egitto", "Ägypten") },
  hebron: { id: "hebron", openBibleId: "a85151a", lon: 35.10222, lat: 31.525087, confidence: "certain", names: n("Hebron · Manre", "Hebron · Mamre", "Hebrón · Mamre", "Hébron · Mamré", "Ebron · Mamre", "Hebron · Mamre") },
  beersheba: { id: "beersheba", openBibleId: "a075d61", lon: 34.840833, lat: 31.244722, confidence: "probable", names: n("Berseba", "Beersheba", "Beerseba", "Beer-Shéba", "Bersabea", "Beerscheba") },
  moriah: { id: "moriah", openBibleId: "adaf385", lon: 35.235556, lat: 31.777778, confidence: "debated", names: n("Terra de Moriá", "Land of Moriah", "Tierra de Moriah", "Pays de Morija", "Terra di Moria", "Land Morija") },
  penuel: { id: "penuel", openBibleId: "a8a9ff9", lon: 35.69211, lat: 32.187016, confidence: "probable", names: n("Peniel", "Peniel", "Peniel", "Penuel", "Penuel", "Pnuël") },
  dothan: { id: "dothan", openBibleId: "ab635e4", lon: 35.239861, lat: 32.413528, confidence: "probable", names: n("Dotã", "Dothan", "Dotán", "Dothan", "Dotan", "Dotan") },
  goshen: { id: "goshen", openBibleId: "a60f092", lon: 31.834217, lat: 30.79937, confidence: "probable", areaKm: 40, names: n("Gósen", "Goshen", "Gosén", "Gosen", "Gosen", "Goschen") },
  machpelah: { id: "machpelah", openBibleId: "ae00861", lon: 35.110758, lat: 31.524672, confidence: "probable", names: n("Caverna de Macpela", "Cave of Machpelah", "Cueva de Macpela", "Grotte de Makpéla", "Grotta di Macpela", "Höhle Machpela") },
  // Êxodo. Quase todos debatidos: o ponto é a identificação mais votada no OpenBible.
  rameses: { id: "rameses", openBibleId: "a079b21", lon: 31.834217, lat: 30.79937, confidence: "probable", names: n("Ramessés", "Rameses", "Ramesés", "Ramsès", "Ramses", "Ramses") },
  succoth: { id: "succoth", openBibleId: "aa28709", lon: 32.099, lat: 30.5527, confidence: "probable", names: n("Sucote", "Succoth", "Sucot", "Soukkoth", "Succot", "Sukkot") },
  "red-sea": { id: "red-sea", openBibleId: "a3d18b2", lon: 32.377778, lat: 30.338333, confidence: "debated", names: n("Mar Vermelho", "Red Sea", "Mar Rojo", "Mer Rouge", "Mar Rosso", "Rotes Meer") },
  marah: { id: "marah", openBibleId: "ad3970d", lon: 32.94284, lat: 29.34604, confidence: "debated", names: n("Mara", "Marah", "Mara", "Mara", "Mara", "Mara") },
  elim: { id: "elim", openBibleId: "a2410c1", lon: 32.915833, lat: 29.254722, confidence: "debated", names: n("Elim", "Elim", "Elim", "Élim", "Elim", "Elim") },
  rephidim: { id: "rephidim", openBibleId: "a05ebb7", lon: 33.880278, lat: 28.623056, confidence: "debated", names: n("Refidim", "Rephidim", "Refidim", "Rephidim", "Refidim", "Refidim") },
  sinai: { id: "sinai", openBibleId: "abfba2a", lon: 33.973333, lat: 28.539722, confidence: "debated", names: n("Monte Sinai", "Mount Sinai", "Monte Sinaí", "Mont Sinaï", "Monte Sinai", "Berg Sinai") },
  midian: { id: "midian", openBibleId: "acc6d8e", lon: 35.0122, lat: 28.4947, confidence: "probable", areaKm: 60, names: n("Midiã", "Midian", "Madián", "Madian", "Madian", "Midian") },
  "kadesh-barnea": { id: "kadesh-barnea", openBibleId: "ac2cef0", lon: 34.422222, lat: 30.648333, confidence: "probable", names: n("Cades-Barneia", "Kadesh-barnea", "Cades-barnea", "Kadès-Barnéa", "Kades-Barnea", "Kadesch-Barnea") },
  nebo: { id: "nebo", openBibleId: "aefaa2d", lon: 35.75, lat: 31.766667, confidence: "probable", names: n("Monte Nebo", "Mount Nebo", "Monte Nebo", "Mont Nebo", "Monte Nebo", "Berg Nebo") },
};

/** Rótulos de regiões e águas desenhados no mapa-base (sem ponto). */
export const journeyMapLabels: { id: string; lon: number; lat: number; kind: "water" | "region"; names: Record<JourneyLanguage, string> }[] = [
  { id: "great-sea", lon: 32.4, lat: 33.6, kind: "water", names: n("Mar Grande", "Great Sea", "Mar Grande", "Grande Mer", "Mar Grande", "Großes Meer") },
  { id: "red-sea", lon: 34.7, lat: 27.85, kind: "water", names: n("Mar Vermelho", "Red Sea", "Mar Rojo", "Mer Rouge", "Mar Rosso", "Rotes Meer") },
  { id: "gulf", lon: 49.0, lat: 28.6, kind: "water", names: n("Golfo Pérsico", "Persian Gulf", "Golfo Pérsico", "Golfe Persique", "Golfo Persico", "Persischer Golf") },
  { id: "canaan", lon: 34.0, lat: 31.85, kind: "region", names: n("Canaã", "Canaan", "Canaán", "Canaan", "Canaan", "Kanaan") },
  { id: "aram", lon: 38.0, lat: 35.6, kind: "region", names: n("Arã", "Aram", "Aram", "Aram", "Aram", "Aram") },
  { id: "chaldea", lon: 45.4, lat: 30.1, kind: "region", names: n("Caldeia", "Chaldea", "Caldea", "Chaldée", "Caldea", "Chaldäa") },
  { id: "arabia", lon: 40.5, lat: 30.2, kind: "region", names: n("Deserto da Arábia", "Arabian Desert", "Desierto de Arabia", "Désert d'Arabie", "Deserto arabico", "Arabische Wüste") },
  { id: "egypt-label", lon: 30.3, lat: 28.6, kind: "region", names: n("Egito", "Egypt", "Egipto", "Égypte", "Egitto", "Ägypten") },
];

export const journeyPlace = (id: string) => journeyPlaces[id];

// Números e Josué (19/11/2026, pendente de revisão humana): lugares próprios em arquivos separados.
// shittim e jordan existem nos dois, com os mesmos dados.
// Deuteronômio, Juízes e Rute (20/11/2026, pendente de revisão humana). bethlehem existe em Juízes e Rute, com os mesmos dados.
export const journeyPlaces: Record<string, JourneyPlace> = { ...basePlaces, ...numbersPlaces, ...joshuaPlaces, ...deuteronomyPlaces, ...judgesPlaces, ...ruthPlaces };
