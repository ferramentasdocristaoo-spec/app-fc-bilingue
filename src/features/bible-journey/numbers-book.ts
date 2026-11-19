import type { JourneyBook, JourneyLanguage, JourneySection } from "./types";
import { buildNumbersChapters } from "./numbers-content";

const langs: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];
const local = <T>(values: T[]) => Object.fromEntries(langs.map((language, index) => [language, values[index]])) as Record<JourneyLanguage, T>;
const names = local(["Números", "Numbers", "Números", "Nombres", "Numeri", "Numeri"]);
const descriptions = local(["A jornada de Israel pelo deserto entre fé, rebelião e fidelidade divina.", "Israel's wilderness journey through faith, rebellion and divine faithfulness.", "El viaje de Israel por el desierto entre fe, rebelión y fidelidad divina.", "Le parcours d'Israël au désert entre foi, révolte et fidélité divine.", "Il viaggio d'Israele nel deserto tra fede, ribellione e fedeltà divina.", "Israels Wüstenreise zwischen Glauben, Auflehnung und Gottes Treue."]);
const sectionRows = [
  ["preparation", 1, 10, ["Preparação no Sinai", "Preparation at Sinai", "Preparación en el Sinaí", "Préparation au Sinaï", "Preparazione al Sinai", "Vorbereitung am Sinai"]],
  ["departure", 11, 12, ["Partida e primeiras crises", "Departure and first crises", "Partida y primeras crisis", "Départ et premières crises", "Partenza e prime crisi", "Aufbruch und erste Krisen"]],
  ["rebellion", 13, 20, ["Rebelião e anos no deserto", "Rebellion and wilderness years", "Rebelión y años en el desierto", "Révolte et années au désert", "Ribellione e anni nel deserto", "Auflehnung und Jahre in der Wüste"]],
  ["new-generation", 21, 25, ["Vitórias e uma nova geração", "Victories and a new generation", "Victorias y una nueva generación", "Victoires et nouvelle génération", "Vittorie e una nuova generazione", "Siege und eine neue Generation"]],
  ["promised-land", 26, 36, ["Preparação para a Terra Prometida", "Preparing for the Promised Land", "Preparación para la Tierra Prometida", "Préparation à la Terre promise", "Preparazione alla Terra Promessa", "Vorbereitung auf das verheißene Land"]],
] as const;

const sections: JourneySection[] = sectionRows.map(([slug, startChapter, endChapter, titles]) => ({ slug, startChapter, endChapter, icon: "compass", content: Object.fromEntries(langs.map((language, index) => [language, { title: titles[index], description: descriptions[language] }])) as JourneySection["content"] }));

const authors = local(["Tradicionalmente atribuído a Moisés", "Traditionally attributed to Moses", "Tradicionalmente atribuido a Moisés", "Traditionnellement attribué à Moïse", "Tradizionalmente attribuito a Mosè", "Traditionell Mose zugeschrieben"]);
const origins = local(["O nome vem dos recenseamentos de Israel.", "The name comes from Israel's censuses.", "El nombre procede de los censos de Israel.", "Le nom vient des recensements d'Israël.", "Il nome deriva dai censimenti d'Israele.", "Der Name stammt von Israels Volkszählungen."]);
const themes = local([["Fidelidade", "Peregrinação", "Obediência"], ["Faithfulness", "Journey", "Obedience"], ["Fidelidad", "Peregrinación", "Obediencia"], ["Fidélité", "Pèlerinage", "Obéissance"], ["Fedeltà", "Pellegrinaggio", "Obbedienza"], ["Treue", "Wanderschaft", "Gehorsam"]]);
// Princípios (ESTADO: PENDENTE DE REVISÃO HUMANA): Nm 9:17–23; 14:9, 24; 23:19.
const principles = local([
  ["Deus guia o seu povo passo a passo, e a obediência segue o ritmo da sua direção (Nm 9:17–23).", "A incredulidade fecha portas que a promessa abria; a fé de Calebe e Josué olha para o Senhor, não para os gigantes (Nm 14:9, 24).", "Deus não é homem para mentir: o que ele promete, ele cumpre, mesmo quando o povo falha (Nm 23:19)."],
  ["God guides his people step by step, and obedience follows the pace of his direction (Num 9:17–23).", "Unbelief shuts doors the promise had opened; the faith of Caleb and Joshua looks to the Lord, not to the giants (Num 14:9, 24).", "God is not a man, that he should lie: what he promises, he fulfils, even when the people fail (Num 23:19)."],
  ["Dios guía a su pueblo paso a paso, y la obediencia sigue el ritmo de su dirección (Nm 9:17–23).", "La incredulidad cierra puertas que la promesa abría; la fe de Caleb y Josué mira al Señor, no a los gigantes (Nm 14:9, 24).", "Dios no es hombre para mentir: lo que promete, lo cumple, aun cuando el pueblo falla (Nm 23:19)."],
  ["Dieu guide son peuple pas à pas, et l'obéissance suit le rythme de sa direction (Nb 9,17–23).", "L'incrédulité ferme les portes que la promesse ouvrait ; la foi de Caleb et de Josué regarde au Seigneur, non aux géants (Nb 14,9.24).", "Dieu n'est pas un homme pour mentir : ce qu'il promet, il l'accomplit, même quand le peuple faillit (Nb 23,19)."],
  ["Dio guida il suo popolo passo dopo passo, e l'obbedienza segue il ritmo della sua guida (Nm 9,17–23).", "L'incredulità chiude le porte che la promessa apriva; la fede di Caleb e Giosuè guarda al Signore, non ai giganti (Nm 14,9.24).", "Dio non è un uomo perché possa mentire: ciò che promette lo compie, anche quando il popolo viene meno (Nm 23,19)."],
  ["Gott führt sein Volk Schritt für Schritt, und der Gehorsam folgt dem Takt seiner Führung (4. Mose 9,17–23).", "Unglaube verschließt Türen, die die Verheißung geöffnet hatte; der Glaube Kalebs und Josuas blickt auf den Herrn, nicht auf die Riesen (4. Mose 14,9.24).", "Gott ist nicht ein Mensch, dass er lüge: Was er verheißt, das hält er, auch wenn das Volk versagt (4. Mose 23,19)."],
]);
const characters = local([["Moisés", "Arão", "Miriam", "Josué", "Calebe", "Balaão"], ["Moses", "Aaron", "Miriam", "Joshua", "Caleb", "Balaam"], ["Moisés", "Aarón", "Miriam", "Josué", "Caleb", "Balaam"], ["Moïse", "Aaron", "Myriam", "Josué", "Caleb", "Balaam"], ["Mosè", "Aronne", "Miriam", "Giosuè", "Caleb", "Balaam"], ["Mose", "Aaron", "Mirjam", "Josua", "Kaleb", "Bileam"]]);

export const numbersBook: JourneyBook = {
  slug: "numbers", testament: "old-testament", category: "pentateuch", bibleBookId: 4, chapterCount: 36, position: 4, coverKey: "numbers",
  overview: Object.fromEntries(langs.map(language => [language, { title: names[language], description: descriptions[language], author: authors[language], date: "c. 1445-1405", nameOrigin: origins[language], context: descriptions[language], themes: themes[language], characters: characters[language], principles: principles[language] }])) as JourneyBook["overview"],
  sections,
  chapters: buildNumbersChapters(),
};
