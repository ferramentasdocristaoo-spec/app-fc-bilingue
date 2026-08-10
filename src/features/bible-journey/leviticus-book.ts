import type { JourneyBook, JourneyLanguage, JourneySection } from "./types";

const languages: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];
const text = <T>(values: T[]) => Object.fromEntries(languages.map((language, index) => [language, values[index]])) as Record<JourneyLanguage, T>;

const bookNames = text(["Levítico", "Leviticus", "Levítico", "Lévitique", "Levitico", "Levitikus"]);
const sectionData = [
  ["offerings", 1, 7, ["Sacrifícios e ofertas", "Sacrifices and offerings", "Sacrificios y ofrendas", "Sacrifices et offrandes", "Sacrifici e offerte", "Opfer und Gaben"]],
  ["priesthood", 8, 10, ["Consagração do sacerdócio", "Consecration of the priesthood", "Consagración del sacerdocio", "Consécration du sacerdoce", "Consacrazione del sacerdozio", "Weihe des Priestertums"]],
  ["purity", 11, 15, ["Pureza e impureza", "Purity and impurity", "Pureza e impureza", "Pureté et impureté", "Purezza e impurità", "Reinheit und Unreinheit"]],
  ["atonement", 16, 17, ["Expiação e santidade do sangue", "Atonement and the sanctity of blood", "Expiación y santidad de la sangre", "Expiation et sainteté du sang", "Espiazione e santità del sangue", "Sühne und Heiligkeit des Blutes"]],
  ["holy-life", 18, 27, ["Uma vida santa diante de Deus", "A holy life before God", "Una vida santa delante de Dios", "Une vie sainte devant Dieu", "Una vita santa davanti a Dio", "Ein heiliges Leben vor Gott"]],
] as const;

const descriptions = text(["Deus ensina o seu povo a aproximar-se dele com reverência.", "God teaches his people to approach him with reverence.", "Dios enseña a su pueblo a acercarse con reverencia.", "Dieu apprend à son peuple à s'approcher avec révérence.", "Dio insegna al suo popolo ad avvicinarsi con riverenza.", "Gott lehrt sein Volk, sich ihm ehrfürchtig zu nahen."]);
const prompts = text(["Como este capítulo ensina a viver em santidade diante de Deus?", "How does this chapter teach you to live in holiness before God?", "¿Cómo enseña este capítulo a vivir en santidad delante de Dios?", "Comment ce chapitre enseigne-t-il à vivre dans la sainteté devant Dieu ?", "In che modo questo capitolo insegna a vivere in santità davanti a Dio?", "Wie lehrt dieses Kapitel ein heiliges Leben vor Gott?"]);

const sections: JourneySection[] = sectionData.map(([slug, startChapter, endChapter, titles]) => ({
  slug, startChapter, endChapter, icon: slug === "atonement" ? "heart" : "flame",
  content: Object.fromEntries(languages.map((language, index) => [language, { title: titles[index], description: descriptions[language] }])) as JourneySection["content"],
}));

export const leviticus: JourneyBook = {
  slug: "leviticus", testament: "old-testament", category: "pentateuch", bibleBookId: 3, chapterCount: 27, position: 3, coverKey: "leviticus",
  overview: Object.fromEntries(languages.map(language => [language, {
    title: bookNames[language], description: descriptions[language], author: text(["Tradicionalmente atribuído a Moisés", "Traditionally attributed to Moses", "Tradicionalmente atribuido a Moisés", "Traditionnellement attribué à Moïse", "Tradizionalmente attribuito a Mosè", "Traditionell Mose zugeschrieben"])[language], date: text(["c. 1445-1405 a.C.", "c. 1445-1405 BC", "c. 1445-1405 a.C.", "v. 1445-1405 av. J.-C.", "ca. 1445-1405 a.C.", "ca. 1445-1405 v. Chr."])[language],
    nameOrigin: text(["Relaciona-se com os levitas e o culto.", "Relates to the Levites and worship.", "Se relaciona con los levitas y el culto.", "Se rapporte aux Lévites et au culte.", "Riguarda i leviti e il culto.", "Bezieht sich auf die Leviten und den Gottesdienst."])[language], context: descriptions[language],
    themes: text([["Santidade", "Expiação", "Adoração"], ["Holiness", "Atonement", "Worship"], ["Santidad", "Expiación", "Adoración"], ["Sainteté", "Expiation", "Adoration"], ["Santità", "Espiazione", "Adorazione"], ["Heiligkeit", "Sühne", "Anbetung"]])[language],
    characters: text([["Moisés", "Arão", "Sacerdotes"], ["Moses", "Aaron", "Priests"], ["Moisés", "Aarón", "Sacerdotes"], ["Moïse", "Aaron", "Prêtres"], ["Mosè", "Aronne", "Sacerdoti"], ["Mose", "Aaron", "Priester"]])[language], principles: [prompts[language]],
  }])) as JourneyBook["overview"],
  sections,
  chapters: Array.from({ length: 27 }, (_, index) => { const number = index + 1; const section = sections.find(item => number >= item.startChapter && number <= item.endChapter)!; return { number, sectionSlug: section.slug, content: Object.fromEntries(languages.map(language => [language, { title: `${section.content[language].title} · ${number}`, description: descriptions[language], reflectionPrompt: prompts[language] }])) as JourneyBook["chapters"][number]["content"] }; }),
};
