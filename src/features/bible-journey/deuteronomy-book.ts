import type { JourneyBook, JourneyLanguage, JourneySection } from "./types";
import { buildDeuteronomyChapters } from "./deuteronomy-content";

const langs: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];
const local = <T>(values: T[]) => Object.fromEntries(langs.map((language, index) => [language, values[index]])) as Record<JourneyLanguage, T>;
const names = local(["Deuteronômio", "Deuteronomy", "Deuteronomio", "Deutéronome", "Deuteronomio", "Deuteronomium"]);
const descriptions = local(["Moisés prepara uma nova geração para amar, lembrar e obedecer a Deus.", "Moses prepares a new generation to love, remember and obey God.", "Moisés prepara a una nueva generación para amar, recordar y obedecer a Dios.", "Moïse prépare une nouvelle génération à aimer, se souvenir et obéir à Dieu.", "Mosè prepara una nuova generazione ad amare, ricordare e obbedire a Dio.", "Mose bereitet eine neue Generation darauf vor, Gott zu lieben, sich zu erinnern und zu gehorchen."]);
// Princípios (ESTADO: PENDENTE DE REVISÃO HUMANA): Dt 6:4-5; 8:3; 30:19-20.
const principles = local([
  ["Deus pede um amor inteiro: de todo o coração, de toda a alma e de toda a força (Dt 6:4-5).", "O homem não vive só de pão, mas de tudo o que sai da boca do Senhor (Dt 8:3).", "Diante da vida e da morte, Deus chama o seu povo a escolher a vida, amando-o e apegando-se a ele (Dt 30:19-20)."],
  ["God asks for a whole love: with all the heart, all the soul and all the strength (Deut 6:4–5).", "Man does not live by bread alone, but by every word that comes from the mouth of the Lord (Deut 8:3).", "Before life and death, God calls his people to choose life, loving him and holding fast to him (Deut 30:19–20)."],
  ["Dios pide un amor completo: de todo corazón, de toda alma y con todas las fuerzas (Dt 6:4-5).", "No solo de pan vive el hombre, sino de todo lo que sale de la boca del Señor (Dt 8:3).", "Ante la vida y la muerte, Dios llama a su pueblo a escoger la vida, amándolo y siguiéndolo a él (Dt 30:19-20)."],
  ["Dieu demande un amour entier : de tout le cœur, de toute l'âme et de toute la force (Dt 6,4-5).", "L'homme ne vit pas de pain seulement, mais de tout ce qui sort de la bouche du Seigneur (Dt 8,3).", "Devant la vie et la mort, Dieu appelle son peuple à choisir la vie, en l'aimant et en s'attachant à lui (Dt 30,19-20)."],
  ["Dio chiede un amore totale: con tutto il cuore, con tutta l'anima e con tutte le forze (Dt 6,4-5).", "L'uomo non vive di solo pane, ma di quanto esce dalla bocca del Signore (Dt 8,3).", "Davanti alla vita e alla morte, Dio chiama il suo popolo a scegliere la vita, amandolo e restando unito a lui (Dt 30,19-20)."],
  ["Gott fordert eine ganze Liebe: von ganzem Herzen, von ganzer Seele und mit aller Kraft (5. Mose 6,4–5).", "Der Mensch lebt nicht vom Brot allein, sondern von allem, was aus dem Mund des Herrn kommt (5. Mose 8,3).", "Vor Leben und Tod ruft Gott sein Volk, das Leben zu wählen, indem es ihn liebt und ihm anhängt (5. Mose 30,19–20)."],
]);
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
  overview: Object.fromEntries(langs.map(language => [language, { title: names[language], description: descriptions[language], author: authors[language], date: "c. 1406", nameOrigin: origins[language], context: descriptions[language], themes: themes[language], characters: characters[language], principles: principles[language] }])) as JourneyBook["overview"],
  sections,
  chapters: buildDeuteronomyChapters(),
};
