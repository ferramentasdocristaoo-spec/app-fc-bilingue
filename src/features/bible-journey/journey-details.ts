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
// Lugares nos 6 idiomas (antes ficavam em inglês em todos). Pendente de revisão humana.
const secondSamuelPlaces: Record<JourneyLanguage, Record<string, string>> = {
  "pt-PT": { judah: "Hebrom", "united-kingdom": "Jerusalém", victories: "Jerusalém · Israel", fall: "Jerusalém", "family-crisis": "Jerusalém · Maanaim", epilogue: "Israel · Jerusalém" },
  en: { judah: "Hebron", "united-kingdom": "Jerusalem", victories: "Jerusalem · Israel", fall: "Jerusalem", "family-crisis": "Jerusalem · Mahanaim", epilogue: "Israel · Jerusalem" },
  es: { judah: "Hebrón", "united-kingdom": "Jerusalén", victories: "Jerusalén · Israel", fall: "Jerusalén", "family-crisis": "Jerusalén · Mahanaim", epilogue: "Israel · Jerusalén" },
  fr: { judah: "Hébron", "united-kingdom": "Jérusalem", victories: "Jérusalem · Israël", fall: "Jérusalem", "family-crisis": "Jérusalem · Mahanaïm", epilogue: "Israël · Jérusalem" },
  it: { judah: "Ebron", "united-kingdom": "Gerusalemme", victories: "Gerusalemme · Israele", fall: "Gerusalemme", "family-crisis": "Gerusalemme · Macanaim", epilogue: "Israele · Gerusalemme" },
  de: { judah: "Hebron", "united-kingdom": "Jerusalem", victories: "Jerusalem · Israel", fall: "Jerusalem", "family-crisis": "Jerusalem · Mahanajim", epilogue: "Israel · Jerusalem" },
};
const firstKingsPlaces: Record<JourneyLanguage, Record<string, string>> = {
  "pt-PT": { succession: "Jerusalém", "wisdom-temple": "Jerusalém · Templo", "solomon-decline": "Jerusalém", "divided-kingdom": "Jerusalém · Siquém", elijah: "Querite · Carmelo · Horebe", ahab: "Samaria · Jezreel" },
  en: { succession: "Jerusalem", "wisdom-temple": "Jerusalem · Temple", "solomon-decline": "Jerusalem", "divided-kingdom": "Jerusalem · Shechem", elijah: "Cherith · Carmel · Horeb", ahab: "Samaria · Jezreel" },
  es: { succession: "Jerusalén", "wisdom-temple": "Jerusalén · Templo", "solomon-decline": "Jerusalén", "divided-kingdom": "Jerusalén · Siquem", elijah: "Querit · Carmelo · Horeb", ahab: "Samaria · Jezreel" },
  fr: { succession: "Jérusalem", "wisdom-temple": "Jérusalem · Temple", "solomon-decline": "Jérusalem", "divided-kingdom": "Jérusalem · Sichem", elijah: "Kerith · Carmel · Horeb", ahab: "Samarie · Jizreel" },
  it: { succession: "Gerusalemme", "wisdom-temple": "Gerusalemme · Tempio", "solomon-decline": "Gerusalemme", "divided-kingdom": "Gerusalemme · Sichem", elijah: "Cherit · Carmelo · Oreb", ahab: "Samaria · Izreel" },
  de: { succession: "Jerusalem", "wisdom-temple": "Jerusalem · Tempel", "solomon-decline": "Jerusalem", "divided-kingdom": "Jerusalem · Sichem", elijah: "Krit · Karmel · Horeb", ahab: "Samaria · Jesreel" },
};
const secondKingsPlaces: Record<JourneyLanguage, Record<string, string>> = {
  "pt-PT": { "elijah-elisha": "Jordão · Jericó", elisha: "Samaria · Suném", jehu: "Jezreel · Samaria", "israel-falls": "Samaria · Assíria", "judah-kings": "Jerusalém", "judah-falls": "Jerusalém · Babilónia" },
  en: { "elijah-elisha": "Jordan · Jericho", elisha: "Samaria · Shunem", jehu: "Jezreel · Samaria", "israel-falls": "Samaria · Assyria", "judah-kings": "Jerusalem", "judah-falls": "Jerusalem · Babylon" },
  es: { "elijah-elisha": "Jordán · Jericó", elisha: "Samaria · Sunem", jehu: "Jezreel · Samaria", "israel-falls": "Samaria · Asiria", "judah-kings": "Jerusalén", "judah-falls": "Jerusalén · Babilonia" },
  fr: { "elijah-elisha": "Jourdain · Jéricho", elisha: "Samarie · Sunem", jehu: "Jizreel · Samarie", "israel-falls": "Samarie · Assyrie", "judah-kings": "Jérusalem", "judah-falls": "Jérusalem · Babylone" },
  it: { "elijah-elisha": "Giordano · Gerico", elisha: "Samaria · Sunem", jehu: "Izreel · Samaria", "israel-falls": "Samaria · Assiria", "judah-kings": "Gerusalemme", "judah-falls": "Gerusalemme · Babilonia" },
  de: { "elijah-elisha": "Jordan · Jericho", elisha: "Samaria · Schunem", jehu: "Jesreel · Samaria", "israel-falls": "Samaria · Assyrien", "judah-kings": "Jerusalem", "judah-falls": "Jerusalem · Babylon" },
};
const firstChroniclesPlaces: Record<JourneyLanguage, Record<string, string>> = {
  "pt-PT": { genealogies: "Israel · Judá", "david-crowned": "Hebrom · Jerusalém", ark: "Jerusalém", kingdom: "Israel · Jerusalém", worship: "Jerusalém · Templo", legacy: "Jerusalém" },
  en: { genealogies: "Israel · Judah", "david-crowned": "Hebron · Jerusalem", ark: "Jerusalem", kingdom: "Israel · Jerusalem", worship: "Jerusalem · Temple", legacy: "Jerusalem" },
  es: { genealogies: "Israel · Judá", "david-crowned": "Hebrón · Jerusalén", ark: "Jerusalén", kingdom: "Israel · Jerusalén", worship: "Jerusalén · Templo", legacy: "Jerusalén" },
  fr: { genealogies: "Israël · Juda", "david-crowned": "Hébron · Jérusalem", ark: "Jérusalem", kingdom: "Israël · Jérusalem", worship: "Jérusalem · Temple", legacy: "Jérusalem" },
  it: { genealogies: "Israele · Giuda", "david-crowned": "Ebron · Gerusalemme", ark: "Gerusalemme", kingdom: "Israele · Gerusalemme", worship: "Gerusalemme · Tempio", legacy: "Gerusalemme" },
  de: { genealogies: "Israel · Juda", "david-crowned": "Hebron · Jerusalem", ark: "Jerusalem", kingdom: "Israel · Jerusalem", worship: "Jerusalem · Tempel", legacy: "Jerusalem" },
};
/** Um lugar por livro (Novo Testamento), nos 6 idiomas. */
const bookPlaces: Record<string, Record<JourneyLanguage, string>> = {
  matthew: { "pt-PT": "Galileia · Judeia · Jerusalém", en: "Galilee · Judea · Jerusalem", es: "Galilea · Judea · Jerusalén", fr: "Galilée · Judée · Jérusalem", it: "Galilea · Giudea · Gerusalemme", de: "Galiläa · Judäa · Jerusalem" },
  mark: { "pt-PT": "Galileia · Jerusalém", en: "Galilee · Jerusalem", es: "Galilea · Jerusalén", fr: "Galilée · Jérusalem", it: "Galilea · Gerusalemme", de: "Galiläa · Jerusalem" },
  luke: { "pt-PT": "Galileia · Samaria · Jerusalém", en: "Galilee · Samaria · Jerusalem", es: "Galilea · Samaria · Jerusalén", fr: "Galilée · Samarie · Jérusalem", it: "Galilea · Samaria · Gerusalemme", de: "Galiläa · Samaria · Jerusalem" },
  john: { "pt-PT": "Galileia · Judeia · Jerusalém", en: "Galilee · Judea · Jerusalem", es: "Galilea · Judea · Jerusalén", fr: "Galilée · Judée · Jérusalem", it: "Galilea · Giudea · Gerusalemme", de: "Galiläa · Judäa · Jerusalem" },
  acts: { "pt-PT": "Jerusalém · Judeia · Samaria · Roma", en: "Jerusalem · Judea · Samaria · Rome", es: "Jerusalén · Judea · Samaria · Roma", fr: "Jérusalem · Judée · Samarie · Rome", it: "Gerusalemme · Giudea · Samaria · Roma", de: "Jerusalem · Judäa · Samaria · Rom" },
  romans: { "pt-PT": "Roma", en: "Rome", es: "Roma", fr: "Rome", it: "Roma", de: "Rom" },
  "1-corinthians": { "pt-PT": "Corinto", en: "Corinth", es: "Corinto", fr: "Corinthe", it: "Corinto", de: "Korinth" },
  "2-corinthians": { "pt-PT": "Corinto · Macedónia", en: "Corinth · Macedonia", es: "Corinto · Macedonia", fr: "Corinthe · Macédoine", it: "Corinto · Macedonia", de: "Korinth · Mazedonien" },
  galatians: { "pt-PT": "Galácia", en: "Galatia", es: "Galacia", fr: "Galatie", it: "Galazia", de: "Galatien" },
  ephesians: { "pt-PT": "Éfeso", en: "Ephesus", es: "Éfeso", fr: "Éphèse", it: "Efeso", de: "Ephesus" },
  philippians: { "pt-PT": "Filipos", en: "Philippi", es: "Filipos", fr: "Philippes", it: "Filippi", de: "Philippi" },
  colossians: { "pt-PT": "Colossos", en: "Colossae", es: "Colosas", fr: "Colosses", it: "Colossi", de: "Kolossä" },
  "1-thessalonians": { "pt-PT": "Tessalónica", en: "Thessalonica", es: "Tesalónica", fr: "Thessalonique", it: "Tessalonica", de: "Thessalonich" },
  "2-thessalonians": { "pt-PT": "Tessalónica", en: "Thessalonica", es: "Tesalónica", fr: "Thessalonique", it: "Tessalonica", de: "Thessalonich" },
  "1-timothy": { "pt-PT": "Éfeso", en: "Ephesus", es: "Éfeso", fr: "Éphèse", it: "Efeso", de: "Ephesus" },
  "2-timothy": { "pt-PT": "Roma", en: "Rome", es: "Roma", fr: "Rome", it: "Roma", de: "Rom" },
  titus: { "pt-PT": "Creta", en: "Crete", es: "Creta", fr: "Crète", it: "Creta", de: "Kreta" },
  philemon: { "pt-PT": "Colossos", en: "Colossae", es: "Colosas", fr: "Colosses", it: "Colossi", de: "Kolossä" },
  hebrews: { "pt-PT": "Comunidades cristãs", en: "Christian communities", es: "Comunidades cristianas", fr: "Communautés chrétiennes", it: "Comunità cristiane", de: "Christliche Gemeinden" },
  james: { "pt-PT": "A Diáspora", en: "The Diaspora", es: "La Diáspora", fr: "La Diaspora", it: "La Diaspora", de: "Die Diaspora" },
  "1-peter": { "pt-PT": "Ásia Menor", en: "Asia Minor", es: "Asia Menor", fr: "Asie Mineure", it: "Asia Minore", de: "Kleinasien" },
  jude: { "pt-PT": "Comunidades cristãs", en: "Christian communities", es: "Comunidades cristianas", fr: "Communautés chrétiennes", it: "Comunità cristiane", de: "Christliche Gemeinden" },
  revelation: { "pt-PT": "Patmos · Ásia Menor", en: "Patmos · Asia Minor", es: "Patmos · Asia Menor", fr: "Patmos · Asie Mineure", it: "Patmo · Asia Minore", de: "Patmos · Kleinasien" },
  "2-peter": { "pt-PT": "Ásia Menor", en: "Asia Minor", es: "Asia Menor", fr: "Asie Mineure", it: "Asia Minore", de: "Kleinasien" },
  "1-john": { "pt-PT": "Ásia Menor", en: "Asia Minor", es: "Asia Menor", fr: "Asie Mineure", it: "Asia Minore", de: "Kleinasien" },
  "2-john": { "pt-PT": "Ásia Menor", en: "Asia Minor", es: "Asia Menor", fr: "Asie Mineure", it: "Asia Minore", de: "Kleinasien" },
  "3-john": { "pt-PT": "Ásia Menor", en: "Asia Minor", es: "Asia Menor", fr: "Asie Mineure", it: "Asia Minore", de: "Kleinasien" },
};

const susa = (name: string) => ({ palace: `${name} · palácio`, threat: name, reversal: name, deliverance: name });
const estherPlaces: Record<JourneyLanguage, Record<string, string>> = {
  "pt-PT": { ...susa("Susã"), palace: "Susã · palácio real" }, en: { ...susa("Susa"), palace: "Susa · royal palace" }, es: { ...susa("Susa"), palace: "Susa · palacio real" },
  fr: { ...susa("Suse"), palace: "Suse · palais royal" }, it: { ...susa("Susa"), palace: "Susa · palazzo reale" }, de: { ...susa("Susa"), palace: "Susa · Königspalast" },
};

const placesByBook: Record<string, Record<JourneyLanguage, Record<string, string>>> = {
  exodus: exodusPlaces, numbers: numbersPlaces, deuteronomy: deuteronomyPlaces, judges: judgesPlaces, ruth: ruthPlaces,
  "1-samuel": firstSamuelPlaces, "2-samuel": secondSamuelPlaces, "1-kings": firstKingsPlaces, "2-kings": secondKingsPlaces, "1-chronicles": firstChroniclesPlaces, esther: estherPlaces,
};

const Isr: Record<JourneyLanguage, string> = { "pt-PT": "Israel", en: "Israel", es: "Israel", fr: "Israël", it: "Israele", de: "Israel" };

export function getJourneySectionDetails(book: JourneyBook, section: JourneySection, language: JourneyLanguage): JourneySectionDetails {
  const editorial = book.slug === "genesis" ? genesisJourneyDetails[section.slug]?.[language] : undefined;
  if (editorial) return editorial;
  const overview = book.overview[language];
  const sectionIndex = Math.max(0, book.sections.findIndex(item => item.slug === section.slug));
  return {
    event: section.content[language].description,
    characters: overview.characters,
    // Cada livro só lê a sua própria tabela. Antes, qualquer livro fora da lista caía nos lugares
    // do Êxodo e um slug coincidente (ex.: "deliverance" em Ester) mostrava "Mar Vermelho".
    place: placesByBook[book.slug]?.[language]?.[section.slug] ?? bookPlaces[book.slug]?.[language] ?? Isr[language],
    connection: overview.principles[sectionIndex % overview.principles.length],
  };
}
