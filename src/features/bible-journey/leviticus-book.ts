import type { JourneyBook, JourneyLanguage, JourneySection } from "./types";
import { buildLeviticusChapters } from "./leviticus-content";

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

// Princípios (ESTADO: PENDENTE DE REVISÃO HUMANA): Lv 19:2; 17:11; 19:18.
const principles = text([
  ["Deus é santo e chama o seu povo a ser santo como ele (Lv 19:2).", "A expiação é dádiva de Deus: é ele quem dá o sangue sobre o altar para resgatar a vida (Lv 17:11).", "A santidade aparece no trato com o próximo: amar o próximo como a si mesmo (Lv 19:18)."],
  ["God is holy and calls his people to be holy as he is (Lev 19:2).", "Atonement is God's gift: he gives the blood on the altar to ransom life (Lev 17:11).", "Holiness shows in how we treat others: love your neighbour as yourself (Lev 19:18)."],
  ["Dios es santo y llama a su pueblo a ser santo como él (Lv 19:2).", "La expiación es un don de Dios: él da la sangre sobre el altar para rescatar la vida (Lv 17:11).", "La santidad se ve en el trato con el prójimo: amarlo como a uno mismo (Lv 19:18)."],
  ["Dieu est saint et appelle son peuple à être saint comme lui (Lv 19,2).", "L'expiation est un don de Dieu : c'est lui qui donne le sang sur l'autel pour racheter la vie (Lv 17,11).", "La sainteté se voit dans la relation au prochain : l'aimer comme soi-même (Lv 19,18)."],
  ["Dio è santo e chiama il suo popolo a essere santo come lui (Lv 19,2).", "L'espiazione è un dono di Dio: è lui che dà il sangue sull'altare per riscattare la vita (Lv 17,11).", "La santità si vede nel rapporto con il prossimo: amarlo come se stessi (Lv 19,18)."],
  ["Gott ist heilig und ruft sein Volk, heilig zu sein wie er (3. Mose 19,2).", "Sühne ist Gottes Gabe: Er gibt das Blut auf dem Altar, um das Leben auszulösen (3. Mose 17,11).", "Heiligkeit zeigt sich im Umgang mit dem Nächsten: ihn lieben wie sich selbst (3. Mose 19,18)."],
]);

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
    characters: text([["Moisés", "Arão", "Sacerdotes"], ["Moses", "Aaron", "Priests"], ["Moisés", "Aarón", "Sacerdotes"], ["Moïse", "Aaron", "Prêtres"], ["Mosè", "Aronne", "Sacerdoti"], ["Mose", "Aaron", "Priester"]])[language], principles: principles[language],
  }])) as JourneyBook["overview"],
  sections,
  chapters: buildLeviticusChapters(),
};
