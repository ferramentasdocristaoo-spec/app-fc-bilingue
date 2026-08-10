import type { JourneyBook, JourneyLanguage, JourneySection } from "./types";

const langs: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];
const local = <T>(values: T[]) => Object.fromEntries(langs.map((language, index) => [language, values[index]])) as Record<JourneyLanguage, T>;
const names = local(["Números", "Numbers", "Números", "Nombres", "Numeri", "Numeri"]);
const descriptions = local(["A jornada de Israel pelo deserto entre fé, rebelião e fidelidade divina.", "Israel's wilderness journey through faith, rebellion and divine faithfulness.", "El viaje de Israel por el desierto entre fe, rebelión y fidelidad divina.", "Le parcours d'Israël au désert entre foi, révolte et fidélité divine.", "Il viaggio d'Israele nel deserto tra fede, ribellione e fedeltà divina.", "Israels Wüstenreise zwischen Glauben, Auflehnung und Gottes Treue."]);
const prompts = local(["O que esta etapa ensina sobre confiar na direção de Deus?", "What does this stage teach about trusting God's direction?", "¿Qué enseña esta etapa sobre confiar en la dirección de Dios?", "Qu'enseigne cette étape sur la confiance en la direction de Dieu ?", "Che cosa insegna questa tappa sulla fiducia nella guida di Dio?", "Was lehrt diese Etappe über das Vertrauen auf Gottes Führung?"]);
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
const characters = local([["Moisés", "Arão", "Miriam", "Josué", "Caleb", "Balaão"], ["Moses", "Aaron", "Miriam", "Joshua", "Caleb", "Balaam"], ["Moisés", "Aarón", "Miriam", "Josué", "Caleb", "Balaam"], ["Moïse", "Aaron", "Myriam", "Josué", "Caleb", "Balaam"], ["Mosè", "Aronne", "Miriam", "Giosuè", "Caleb", "Balaam"], ["Mose", "Aaron", "Mirjam", "Josua", "Kaleb", "Bileam"]]);

export const numbersBook: JourneyBook = {
  slug: "numbers", testament: "old-testament", category: "pentateuch", bibleBookId: 4, chapterCount: 36, position: 4, coverKey: "numbers",
  overview: Object.fromEntries(langs.map(language => [language, { title: names[language], description: descriptions[language], author: authors[language], date: "c. 1445-1405", nameOrigin: origins[language], context: descriptions[language], themes: themes[language], characters: characters[language], principles: [prompts[language]] }])) as JourneyBook["overview"],
  sections,
  chapters: Array.from({ length: 36 }, (_, index) => { const number = index + 1; const section = sections.find(item => number >= item.startChapter && number <= item.endChapter)!; return { number, sectionSlug: section.slug, content: Object.fromEntries(langs.map(language => [language, { title: `${section.content[language].title} · ${number}`, description: descriptions[language], reflectionPrompt: prompts[language] }])) as JourneyBook["chapters"][number]["content"] }; }),
};
