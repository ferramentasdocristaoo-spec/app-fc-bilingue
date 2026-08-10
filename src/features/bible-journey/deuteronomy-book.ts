import type { JourneyBook, JourneyLanguage, JourneySection } from "./types";

const langs: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];
const local = <T>(values: T[]) => Object.fromEntries(langs.map((language, index) => [language, values[index]])) as Record<JourneyLanguage, T>;
const names = local(["Deuteronómio", "Deuteronomy", "Deuteronomio", "Deutéronome", "Deuteronomio", "Deuteronomium"]);
const descriptions = local(["Moisés prepara uma nova geração para amar, lembrar e obedecer a Deus.", "Moses prepares a new generation to love, remember and obey God.", "Moisés prepara a una nueva generación para amar, recordar y obedecer a Dios.", "Moïse prépare une nouvelle génération à aimer, se souvenir et obéir à Dieu.", "Mosè prepara una nuova generazione ad amare, ricordare e obbedire a Dio.", "Mose bereitet eine neue Generation darauf vor, Gott zu lieben, sich zu erinnern und zu gehorchen."]);
const prompts = local(["Que verdade precisas recordar e colocar em prática?", "What truth do you need to remember and put into practice?", "¿Qué verdad necesitas recordar y poner en práctica?", "Quelle vérité devez-vous vous rappeler et mettre en pratique ?", "Quale verità devi ricordare e mettere in pratica?", "Welche Wahrheit sollst du dir ins Gedächtnis rufen und umsetzen?"]);
const rows = [
  ["remember", 1, 4, ["Recordar o caminho percorrido", "Remembering the journey", "Recordar el camino recorrido", "Se souvenir du chemin parcouru", "Ricordare il cammino percorso", "An den zurückgelegten Weg erinnern"]],
  ["covenant-law", 5, 11, ["Amar a Deus e guardar a aliança", "Love God and keep the covenant", "Amar a Dios y guardar el pacto", "Aimer Dieu et garder l'alliance", "Amare Dio e custodire l'alleanza", "Gott lieben und den Bund halten"]],
  ["community-life", 12, 26, ["Vida do povo na Terra Prometida", "Life in the Promised Land", "Vida del pueblo en la Tierra Prometida", "Vie du peuple dans la Terre promise", "Vita del popolo nella Terra Promessa", "Leben des Volkes im verheißenen Land"]],
  ["choice", 27, 30, ["Bênção, maldição e escolha", "Blessing, curse and choice", "Bendición, maldición y elección", "Bénédiction, malédiction et choix", "Benedizione, maledizione e scelta", "Segen, Fluch und Entscheidung"]],
  ["moses-farewell", 31, 34, ["Despedida e morte de Moisés", "Moses' farewell and death", "Despedida y muerte de Moisés", "Adieux et mort de Moïse", "Addio e morte di Mosè", "Moses Abschied und Tod"]],
] as const;
const sections: JourneySection[] = rows.map(([slug, startChapter, endChapter, titles]) => ({ slug, startChapter, endChapter, icon: "scroll", content: Object.fromEntries(langs.map((language, index) => [language, { title: titles[index], description: descriptions[language] }])) as JourneySection["content"] }));
const authors = local(["Tradicionalmente atribuído a Moisés", "Traditionally attributed to Moses", "Tradicionalmente atribuido a Moisés", "Traditionnellement attribué à Moïse", "Tradizionalmente attribuito a Mosè", "Traditionell Mose zugeschrieben"]);
const origins = local(["Significa segunda lei ou repetição da lei.", "Means second law or repetition of the law.", "Significa segunda ley o repetición de la ley.", "Signifie seconde loi ou répétition de la loi.", "Significa seconda legge o ripetizione della legge.", "Bedeutet zweites Gesetz oder Wiederholung des Gesetzes."]);
const themes = local([["Aliança", "Memória", "Amor", "Obediência"], ["Covenant", "Memory", "Love", "Obedience"], ["Pacto", "Memoria", "Amor", "Obediencia"], ["Alliance", "Mémoire", "Amour", "Obéissance"], ["Alleanza", "Memoria", "Amore", "Obbedienza"], ["Bund", "Erinnerung", "Liebe", "Gehorsam"]]);
const characters = local([["Moisés", "Josué", "Israel"], ["Moses", "Joshua", "Israel"], ["Moisés", "Josué", "Israel"], ["Moïse", "Josué", "Israël"], ["Mosè", "Giosuè", "Israele"], ["Mose", "Josua", "Israel"]]);

export const deuteronomy: JourneyBook = {
  slug: "deuteronomy", testament: "old-testament", category: "pentateuch", bibleBookId: 5, chapterCount: 34, position: 5, coverKey: "deuteronomy",
  overview: Object.fromEntries(langs.map(language => [language, { title: names[language], description: descriptions[language], author: authors[language], date: "c. 1405", nameOrigin: origins[language], context: descriptions[language], themes: themes[language], characters: characters[language], principles: [prompts[language]] }])) as JourneyBook["overview"],
  sections,
  chapters: Array.from({ length: 34 }, (_, index) => { const number = index + 1; const section = sections.find(item => number >= item.startChapter && number <= item.endChapter)!; return { number, sectionSlug: section.slug, content: Object.fromEntries(langs.map(language => [language, { title: `${section.content[language].title} · ${number}`, description: descriptions[language], reflectionPrompt: prompts[language] }])) as JourneyBook["chapters"][number]["content"] }; }),
};
