import type { JourneyBook, JourneyLanguage, JourneySection } from "./types";
import { genesisJourneyDetails, type JourneySectionDetails } from "./genesis-journey-details";

const exodusPlaces: Record<JourneyLanguage, Record<string, string>> = {
  "pt-PT": { deliverer: "Egito · Midiã · Horeb", confrontation: "Egito · Gósen", deliverance: "Mar Vermelho · Deserto", covenant: "Monte Sinai", tabernacle: "Sinai · Tabernáculo" },
  en: { deliverer: "Egypt · Midian · Horeb", confrontation: "Egypt · Goshen", deliverance: "Red Sea · Wilderness", covenant: "Mount Sinai", tabernacle: "Sinai · Tabernacle" },
  es: { deliverer: "Egipto · Madián · Horeb", confrontation: "Egipto · Gosén", deliverance: "Mar Rojo · Desierto", covenant: "Monte Sinaí", tabernacle: "Sinaí · Tabernáculo" },
  fr: { deliverer: "Égypte · Madian · Horeb", confrontation: "Égypte · Gosen", deliverance: "Mer Rouge · Désert", covenant: "Mont Sinaï", tabernacle: "Sinaï · Tabernacle" },
  it: { deliverer: "Egitto · Madian · Oreb", confrontation: "Egitto · Gosen", deliverance: "Mar Rosso · Deserto", covenant: "Monte Sinai", tabernacle: "Sinai · Tabernacolo" },
  de: { deliverer: "Ägypten · Midian · Horeb", confrontation: "Ägypten · Goschen", deliverance: "Rotes Meer · Wüste", covenant: "Berg Sinai", tabernacle: "Sinai · Stiftshütte" },
};

const numbersPlaces: Record<JourneyLanguage, Record<string, string>> = {
  "pt-PT": { preparation: "Sinai", departure: "Sinai · Parã", rebellion: "Deserto de Parã", "new-generation": "Moabe", "promised-land": "Planícies de Moabe" },
  en: { preparation: "Sinai", departure: "Sinai · Paran", rebellion: "Wilderness of Paran", "new-generation": "Moab", "promised-land": "Plains of Moab" },
  es: { preparation: "Sinaí", departure: "Sinaí · Parán", rebellion: "Desierto de Parán", "new-generation": "Moab", "promised-land": "Llanuras de Moab" },
  fr: { preparation: "Sinaï", departure: "Sinaï · Paran", rebellion: "Désert de Paran", "new-generation": "Moab", "promised-land": "Plaines de Moab" },
  it: { preparation: "Sinai", departure: "Sinai · Paran", rebellion: "Deserto di Paran", "new-generation": "Moab", "promised-land": "Pianure di Moab" },
  de: { preparation: "Sinai", departure: "Sinai · Paran", rebellion: "Wüste Paran", "new-generation": "Moab", "promised-land": "Ebenen von Moab" },
};

const deuteronomyPlaces: Record<JourneyLanguage, Record<string, string>> = {
  "pt-PT": { remember: "Planícies de Moabe", "covenant-law": "Moabe", "community-life": "À entrada de Canaã", choice: "Montes Ebal e Gerizim", "moses-farewell": "Moabe · Monte Nebo" },
  en: { remember: "Plains of Moab", "covenant-law": "Moab", "community-life": "Entrance to Canaan", choice: "Mount Ebal and Gerizim", "moses-farewell": "Moab · Mount Nebo" },
  es: { remember: "Llanuras de Moab", "covenant-law": "Moab", "community-life": "Entrada de Canaán", choice: "Montes Ebal y Gerizim", "moses-farewell": "Moab · Monte Nebo" },
  fr: { remember: "Plaines de Moab", "covenant-law": "Moab", "community-life": "Entrée de Canaan", choice: "Monts Ébal et Garizim", "moses-farewell": "Moab · Mont Nébo" },
  it: { remember: "Pianure di Moab", "covenant-law": "Moab", "community-life": "Ingresso di Canaan", choice: "Monti Ebal e Garizim", "moses-farewell": "Moab · Monte Nebo" },
  de: { remember: "Ebenen von Moab", "covenant-law": "Moab", "community-life": "Eingang nach Kanaan", choice: "Berge Ebal und Garizim", "moses-farewell": "Moab · Berg Nebo" },
};
const judgesPlaces: Record<JourneyLanguage, Record<string, string>> = {
  "pt-PT": { "unfinished-conquest": "Canaã", deliverers: "Monte Tabor · Jezreel", jephthah: "Gileade", samson: "Zorá · Filístia", chaos: "Efraim · Gibeá" },
  en: { "unfinished-conquest": "Canaan", deliverers: "Mount Tabor · Jezreel", jephthah: "Gilead", samson: "Zorah · Philistia", chaos: "Ephraim · Gibeah" },
  es: { "unfinished-conquest": "Canaán", deliverers: "Monte Tabor · Jezreel", jephthah: "Galaad", samson: "Zora · Filistea", chaos: "Efraín · Guibeá" },
  fr: { "unfinished-conquest": "Canaan", deliverers: "Mont Thabor · Jizreel", jephthah: "Galaad", samson: "Tsorea · Philistie", chaos: "Éphraïm · Guibea" },
  it: { "unfinished-conquest": "Canaan", deliverers: "Monte Tabor · Izreel", jephthah: "Galaad", samson: "Sorea · Filistea", chaos: "Efraim · Ghibea" },
  de: { "unfinished-conquest": "Kanaan", deliverers: "Berg Tabor · Jesreel", jephthah: "Gilead", samson: "Zora · Philistäa", chaos: "Ephraim · Gibea" },
};
const ruthPlaces: Record<JourneyLanguage, Record<string, string>> = {
  "pt-PT": { loss: "Moabe · Belém", providence: "Campos de Belém", redeemer: "Eira de Boaz", restoration: "Porta de Belém" },
  en: { loss: "Moab · Bethlehem", providence: "Fields of Bethlehem", redeemer: "Boaz's threshing floor", restoration: "Gate of Bethlehem" },
  es: { loss: "Moab · Belén", providence: "Campos de Belén", redeemer: "Era de Booz", restoration: "Puerta de Belén" },
  fr: { loss: "Moab · Bethléem", providence: "Champs de Bethléem", redeemer: "Aire de Booz", restoration: "Porte de Bethléem" },
  it: { loss: "Moab · Betlemme", providence: "Campi di Betlemme", redeemer: "Aia di Boaz", restoration: "Porta di Betlemme" },
  de: { loss: "Moab · Bethlehem", providence: "Felder von Bethlehem", redeemer: "Tenne des Boas", restoration: "Tor von Bethlehem" },
};
const firstSamuelPlaces: Record<JourneyLanguage, Record<string, string>> = {
  "pt-PT": { samuel: "Siló · Quiriate-Jearim", monarchy: "Ramá · Gilgal", "saul-fall": "Gilgal · Vale de Elá", "david-rises": "Belém · Gibeá", "david-fugitive": "Deserto de Judá", "saul-end": "En-Dor · Monte Gilboa" },
  en: { samuel: "Shiloh · Kiriath-jearim", monarchy: "Ramah · Gilgal", "saul-fall": "Gilgal · Valley of Elah", "david-rises": "Bethlehem · Gibeah", "david-fugitive": "Wilderness of Judah", "saul-end": "Endor · Mount Gilboa" },
  es: { samuel: "Silo · Quiriat-jearim", monarchy: "Ramá · Gilgal", "saul-fall": "Gilgal · Valle de Ela", "david-rises": "Belén · Guibeá", "david-fugitive": "Desierto de Judá", "saul-end": "Endor · Monte Gilboa" },
  fr: { samuel: "Silo · Qiryath-Yéarim", monarchy: "Rama · Guilgal", "saul-fall": "Guilgal · Vallée d'Éla", "david-rises": "Bethléem · Guibea", "david-fugitive": "Désert de Juda", "saul-end": "En-Dor · Mont Guilboa" },
  it: { samuel: "Silo · Kiriat-Iearim", monarchy: "Rama · Gàlgala", "saul-fall": "Gàlgala · Valle di Ela", "david-rises": "Betlemme · Ghibea", "david-fugitive": "Deserto di Giuda", "saul-end": "Endor · Monte Gelboe" },
  de: { samuel: "Silo · Kirjat-Jearim", monarchy: "Rama · Gilgal", "saul-fall": "Gilgal · Tal Ela", "david-rises": "Bethlehem · Gibea", "david-fugitive": "Wüste Juda", "saul-end": "En-Dor · Berg Gilboa" },
};
const secondSamuelPlaces: Record<JourneyLanguage, Record<string, string>> = Object.fromEntries((["pt-PT","en","es","fr","it","de"] as JourneyLanguage[]).map(language => [language, {
  judah: "Hebron", "united-kingdom": "Jerusalem", victories: "Jerusalem · Israel", fall: "Jerusalem", "family-crisis": "Jerusalem · Mahanaim", epilogue: "Israel · Jerusalem",
}])) as Record<JourneyLanguage, Record<string, string>>;
const firstKingsPlaces: Record<JourneyLanguage, Record<string, string>> = Object.fromEntries((["pt-PT","en","es","fr","it","de"] as JourneyLanguage[]).map(language => [language, {
  succession: "Jerusalem", "wisdom-temple": "Jerusalem · Temple", "solomon-decline": "Jerusalem", "divided-kingdom": "Jerusalem · Shechem", elijah: "Cherith · Carmel · Horeb", ahab: "Samaria · Jezreel",
}])) as Record<JourneyLanguage, Record<string, string>>;
const secondKingsPlaces: Record<JourneyLanguage, Record<string, string>> = Object.fromEntries((["pt-PT","en","es","fr","it","de"] as JourneyLanguage[]).map(language => [language, {
  "elijah-elisha": "Jordan · Jericho", elisha: "Samaria · Shunem", jehu: "Jezreel · Samaria", "israel-falls": "Samaria · Assyria", "judah-kings": "Jerusalem", "judah-falls": "Jerusalem · Babylon",
}])) as Record<JourneyLanguage, Record<string, string>>;
const firstChroniclesPlaces: Record<JourneyLanguage, Record<string, string>> = Object.fromEntries((["pt-PT","en","es","fr","it","de"] as JourneyLanguage[]).map(language => [language, {
  genealogies: "Israel · Judah", "david-crowned": "Hebron · Jerusalem", ark: "Jerusalem", kingdom: "Israel · Jerusalem", worship: "Jerusalem · Temple", legacy: "Jerusalem",
}])) as Record<JourneyLanguage, Record<string, string>>;
const bookPlaces: Record<string, string> = {
  matthew: "Galilee · Judea · Jerusalem", mark: "Galilee · Jerusalem", luke: "Galilee · Samaria · Jerusalem", john: "Galilee · Judea · Jerusalem", acts: "Jerusalem · Judea · Samaria · Rome",
  romans: "Rome", "1-corinthians": "Corinth", "2-corinthians": "Corinth · Macedonia", galatians: "Galatia", ephesians: "Ephesus", philippians: "Philippi", colossians: "Colossae", "1-thessalonians": "Thessalonica", "2-thessalonians": "Thessalonica", "1-timothy": "Ephesus", "2-timothy": "Rome", titus: "Crete", philemon: "Colossae",
  hebrews: "Christian communities", james: "The Diaspora", "1-peter": "Asia Minor", "2-peter": "Asia Minor", "1-john": "Asia Minor", "2-john": "Asia Minor", "3-john": "Asia Minor", jude: "Christian communities", revelation: "Patmos · Asia Minor",
};

export function getJourneySectionDetails(book: JourneyBook, section: JourneySection, language: JourneyLanguage): JourneySectionDetails {
  const editorial = book.slug === "genesis" ? genesisJourneyDetails[section.slug]?.[language] : undefined;
  if (editorial) return editorial;
  const overview = book.overview[language];
  const sectionIndex = Math.max(0, book.sections.findIndex(item => item.slug === section.slug));
  return {
    event: section.content[language].description,
    characters: overview.characters,
    place: (book.slug === "1-chronicles" ? firstChroniclesPlaces : book.slug === "2-kings" ? secondKingsPlaces : book.slug === "1-kings" ? firstKingsPlaces : book.slug === "2-samuel" ? secondSamuelPlaces : book.slug === "1-samuel" ? firstSamuelPlaces : book.slug === "ruth" ? ruthPlaces : book.slug === "judges" ? judgesPlaces : book.slug === "deuteronomy" ? deuteronomyPlaces : book.slug === "numbers" ? numbersPlaces : exodusPlaces)[language]?.[section.slug] ?? bookPlaces[book.slug] ?? "Israel",
    connection: overview.principles[sectionIndex % overview.principles.length],
  };
}
