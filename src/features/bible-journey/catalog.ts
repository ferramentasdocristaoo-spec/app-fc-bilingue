import type { JourneyBook, JourneyLanguage, JourneyRepository } from "./types";
import { buildGenesisChapters } from "./genesis-content";
import { buildExodusChapters } from "./exodus-content";
import { leviticus } from "./leviticus-book";
import { numbersBook } from "./numbers-book";
import { deuteronomy } from "./deuteronomy-book";
import { joshua } from "./joshua-book";
import { judges } from "./judges-book";
import { ruth } from "./ruth-book";
import { firstSamuel } from "./first-samuel-book";
import { secondSamuel } from "./second-samuel-book";
import { firstKings } from "./first-kings-book";
import { secondKings } from "./second-kings-book";
import { firstChronicles } from "./first-chronicles-book";
import { restorationBooks } from "./restoration-books";
import { wisdomBooks } from "./wisdom-books";
import { majorProphets } from "./major-prophets";
import { minorProphets } from "./minor-prophets";
import { gospelsAndActs } from "./gospels-and-acts";
import { paulineLetters } from "./pauline-letters";
import { finalNewTestamentBooks } from "./general-letters-revelation";
import { applyJourneyAuthorAttributions } from "./author-attributions";

const localized = <T>(values: Partial<Record<JourneyLanguage, T>>, fallback: T): Record<JourneyLanguage, T> => ({
  "pt-PT": values["pt-PT"] ?? fallback, en: values.en ?? fallback, es: values.es ?? fallback,
  fr: values.fr ?? fallback, it: values.it ?? fallback, de: values.de ?? fallback,
});

const genesis: JourneyBook = {
  slug: "genesis", testament: "old-testament", category: "pentateuch", bibleBookId: 1,
  chapterCount: 50, position: 1, coverKey: "genesis",
  overview: localized({
    "pt-PT": { title: "Génesis", description: "O livro das origens, da criação aos patriarcas.", author: "Tradicionalmente atribuído a Moisés", date: "c. 1500-1400 a.C.", nameOrigin: "Do grego génesis: origem ou começo.", context: "Apresenta as origens do mundo, da humanidade e do povo da aliança.", themes: ["Criação", "Queda", "Aliança", "Providência"], characters: ["Adão e Eva", "Noé", "Abraão e Sara", "Isaac", "Jacob", "José"], principles: ["Deus é o Criador soberano", "O pecado tem consequências", "Deus é fiel às suas promessas"] },
    en: { title: "Genesis", description: "The book of beginnings, from creation to the patriarchs.", author: "Traditionally attributed to Moses", date: "c. 1500-1400 BC", nameOrigin: "From Greek genesis: origin or beginning.", context: "Introduces the origins of the world, humanity and the covenant people.", themes: ["Creation", "Fall", "Covenant", "Providence"], characters: ["Adam and Eve", "Noah", "Abraham and Sarah", "Isaac", "Jacob", "Joseph"], principles: ["God is the sovereign Creator", "Sin has consequences", "God is faithful to his promises"] },
    es: { title: "Génesis", description: "El libro de los orígenes, desde la creación hasta los patriarcas.", author: "Tradicionalmente atribuido a Moisés", date: "c. 1500-1400 a.C.", nameOrigin: "Del griego génesis: origen o comienzo.", context: "Presenta los orígenes del mundo, de la humanidad y del pueblo del pacto.", themes: ["Creación", "Caída", "Pacto", "Providencia"], characters: ["Adán y Eva", "Noé", "Abraham y Sara", "Isaac", "Jacob", "José"], principles: ["Dios es el Creador soberano", "El pecado tiene consecuencias", "Dios es fiel a sus promesas"] },
    fr: { title: "Genèse", description: "Le livre des origines, de la création aux patriarches.", author: "Traditionnellement attribué à Moïse", date: "v. 1500-1400 av. J.-C.", nameOrigin: "Du grec genesis : origine ou commencement.", context: "Présente les origines du monde, de l'humanité et du peuple de l'alliance.", themes: ["Création", "Chute", "Alliance", "Providence"], characters: ["Adam et Ève", "Noé", "Abraham et Sara", "Isaac", "Jacob", "Joseph"], principles: ["Dieu est le Créateur souverain", "Le péché a des conséquences", "Dieu est fidèle à ses promesses"] },
    it: { title: "Genesi", description: "Il libro delle origini, dalla creazione ai patriarchi.", author: "Tradizionalmente attribuito a Mosè", date: "ca. 1500-1400 a.C.", nameOrigin: "Dal greco genesis: origine o inizio.", context: "Presenta le origini del mondo, dell'umanità e del popolo dell'alleanza.", themes: ["Creazione", "Caduta", "Alleanza", "Provvidenza"], characters: ["Adamo ed Eva", "Noè", "Abramo e Sara", "Isacco", "Giacobbe", "Giuseppe"], principles: ["Dio è il Creatore sovrano", "Il peccato ha conseguenze", "Dio è fedele alle promesse"] },
    de: { title: "Genesis", description: "Das Buch der Anfänge, von der Schöpfung bis zu den Erzvätern.", author: "Traditionell Mose zugeschrieben", date: "ca. 1500-1400 v. Chr.", nameOrigin: "Vom griechischen genesis: Ursprung oder Anfang.", context: "Beschreibt die Ursprünge der Welt, der Menschheit und des Bundesvolkes.", themes: ["Schöpfung", "Sündenfall", "Bund", "Vorsehung"], characters: ["Adam und Eva", "Noah", "Abraham und Sara", "Isaak", "Jakob", "Josef"], principles: ["Gott ist der souveräne Schöpfer", "Sünde hat Folgen", "Gott hält seine Verheißungen"] },
  }, {} as never),
  sections: [
    { slug: "creation", startChapter: 1, endChapter: 2, icon: "sparkles", content: localized({ fr: { title: "La création", description: "Dieu crée le monde et l'humanité." }, en: { title: "Creation", description: "God creates the world and humanity." }, es: { title: "La creación", description: "Dios crea el mundo y la humanidad." }, de: { title: "Die Schöpfung", description: "Gott erschafft die Welt und den Menschen." }, it: { title: "La creazione", description: "Dio crea il mondo e l'umanità." } }, { title: "A criação", description: "Deus cria o mundo e a humanidade." }) },
    { slug: "fall", startChapter: 3, endChapter: 3, icon: "triangle", content: localized({ fr: { title: "La chute", description: "Le péché entre dans l'histoire humaine." }, en: { title: "The fall", description: "Sin enters human history." }, es: { title: "La caída", description: "El pecado entra en la historia humana." }, de: { title: "Der Sündenfall", description: "Die Sünde tritt in die Menschheitsgeschichte ein." }, it: { title: "La caduta", description: "Il peccato entra nella storia umana." } }, { title: "A queda", description: "O pecado entra na história humana." }) },
    { slug: "first-generations", startChapter: 4, endChapter: 5, icon: "users", content: localized({ en: { title: "The first generations", description: "Cain, Abel and Adam's descendants." }, es: { title: "Las primeras generaciones", description: "Caín, Abel y la descendencia de Adán." }, fr: { title: "Les premières générations", description: "Caïn, Abel et la descendance d'Adam." }, it: { title: "Le prime generazioni", description: "Caino, Abele e la discendenza di Adamo." }, de: { title: "Die ersten Generationen", description: "Kain, Abel und die Nachkommen Adams." } }, { title: "As primeiras gerações", description: "Caim, Abel e a descendência de Adão." }) },
    { slug: "flood", startChapter: 6, endChapter: 9, icon: "waves", content: localized({ en: { title: "The flood and Noah", description: "Judgment, preservation and covenant." }, es: { title: "El diluvio y Noé", description: "Juicio, preservación y pacto." }, fr: { title: "Le déluge et Noé", description: "Jugement, préservation et alliance." }, it: { title: "Il diluvio e Noè", description: "Giudizio, preservazione e alleanza." }, de: { title: "Die Sintflut und Noah", description: "Gericht, Bewahrung und Bund." } }, { title: "O dilúvio e Noé", description: "Juízo, preservação e aliança." }) },
    { slug: "nations", startChapter: 10, endChapter: 11, icon: "tower", content: localized({ en: { title: "The nations and Babel", description: "The scattering of peoples and the tower of Babel." }, es: { title: "Las naciones y Babel", description: "La dispersión de los pueblos y la torre de Babel." }, fr: { title: "Les nations et Babel", description: "La dispersion des peuples et la tour de Babel." }, it: { title: "Le nazioni e Babele", description: "La dispersione dei popoli e la torre di Babele." }, de: { title: "Die Völker und Babel", description: "Die Zerstreuung der Völker und der Turmbau zu Babel." } }, { title: "As nações e Babel", description: "A dispersão dos povos e a torre de Babel." }) },
    { slug: "patriarchs", startChapter: 12, endChapter: 50, icon: "tent", content: localized({ en: { title: "The patriarchs", description: "Abraham, Isaac, Jacob and Joseph in the covenant story." }, es: { title: "Los patriarcas", description: "Abraham, Isaac, Jacob y José en la historia del pacto." }, fr: { title: "Les patriarches", description: "Abraham, Isaac, Jacob et Joseph dans l'histoire de l'alliance." }, it: { title: "I patriarchi", description: "Abramo, Isacco, Giacobbe e Giuseppe nella storia dell'alleanza." }, de: { title: "Die Erzväter", description: "Abraham, Isaak, Jakob und Josef in der Bundesgeschichte." } }, { title: "Os patriarcas", description: "Abraão, Isaac, Jacob e José na história da aliança." }) },
  ],
  chapters: buildGenesisChapters(),
};

const exodus: JourneyBook = {
  slug: "exodus", testament: "old-testament", category: "pentateuch", bibleBookId: 2, chapterCount: 40, position: 2, coverKey: "exodus",
  overview: localized({
    "pt-PT": { title: "Êxodo", description: "Da escravidão à presença de Deus no meio do povo.", author: "Tradicionalmente atribuído a Moisés", date: "c. 1500-1400 a.C.", nameOrigin: "Do grego exodos: saída ou partida.", context: "Narra a libertação de Israel, a aliança no Sinai e a construção do tabernáculo.", themes: ["Libertação", "Aliança", "Lei", "Presença"], characters: ["Moisés", "Arão", "Miriam", "Faraó", "Jetro"], principles: ["Deus ouve o clamor do seu povo", "A redenção conduz à aliança", "Deus deseja habitar entre o seu povo"] },
    en: { title: "Exodus", description: "From slavery to God's presence among his people.", author: "Traditionally attributed to Moses", date: "c. 1500-1400 BC", nameOrigin: "From Greek exodos: departure or going out.", context: "Tells of Israel's deliverance, the Sinai covenant and the building of the tabernacle.", themes: ["Deliverance", "Covenant", "Law", "Presence"], characters: ["Moses", "Aaron", "Miriam", "Pharaoh", "Jethro"], principles: ["God hears his people's cry", "Redemption leads to covenant", "God desires to dwell among his people"] },
    es: { title: "Éxodo", description: "De la esclavitud a la presencia de Dios entre su pueblo.", author: "Tradicionalmente atribuido a Moisés", date: "c. 1500-1400 a.C.", nameOrigin: "Del griego exodos: salida o partida.", context: "Narra la liberación de Israel, el pacto del Sinaí y la construcción del tabernáculo.", themes: ["Liberación", "Pacto", "Ley", "Presencia"], characters: ["Moisés", "Aarón", "Miriam", "Faraón", "Jetro"], principles: ["Dios escucha el clamor de su pueblo", "La redención conduce al pacto", "Dios desea habitar entre su pueblo"] },
    fr: { title: "Exode", description: "De l'esclavage à la présence de Dieu au milieu de son peuple.", author: "Traditionnellement attribué à Moïse", date: "v. 1500-1400 av. J.-C.", nameOrigin: "Du grec exodos : sortie ou départ.", context: "Raconte la délivrance d'Israël, l'alliance du Sinaï et la construction du tabernacle.", themes: ["Délivrance", "Alliance", "Loi", "Présence"], characters: ["Moïse", "Aaron", "Myriam", "Pharaon", "Jéthro"], principles: ["Dieu entend le cri de son peuple", "La rédemption conduit à l'alliance", "Dieu désire demeurer parmi son peuple"] },
    it: { title: "Esodo", description: "Dalla schiavitù alla presenza di Dio in mezzo al popolo.", author: "Tradizionalmente attribuito a Mosè", date: "ca. 1500-1400 a.C.", nameOrigin: "Dal greco exodos: uscita o partenza.", context: "Narra la liberazione d'Israele, l'alleanza del Sinai e la costruzione del tabernacolo.", themes: ["Liberazione", "Alleanza", "Legge", "Presenza"], characters: ["Mosè", "Aronne", "Miriam", "Faraone", "Ietro"], principles: ["Dio ascolta il grido del suo popolo", "La redenzione conduce all'alleanza", "Dio desidera abitare in mezzo al suo popolo"] },
    de: { title: "Exodus", description: "Von der Sklaverei zur Gegenwart Gottes unter seinem Volk.", author: "Traditionell Mose zugeschrieben", date: "ca. 1500-1400 v. Chr.", nameOrigin: "Vom griechischen exodos: Auszug oder Aufbruch.", context: "Erzählt von Israels Befreiung, dem Sinaibund und dem Bau der Stiftshütte.", themes: ["Befreiung", "Bund", "Gesetz", "Gegenwart"], characters: ["Mose", "Aaron", "Mirjam", "Pharao", "Jitro"], principles: ["Gott hört den Schrei seines Volkes", "Erlösung führt zum Bund", "Gott will unter seinem Volk wohnen"] },
  }, {} as never),
  sections: [
    { slug: "deliverer", startChapter: 1, endChapter: 4, icon: "flame", content: localized({ en: { title: "A deliverer is prepared", description: "Moses is born and called." }, es: { title: "Se prepara un libertador", description: "Moisés nace y es llamado." }, fr: { title: "Un libérateur est préparé", description: "Moïse naît et reçoit son appel." }, it: { title: "Un liberatore viene preparato", description: "Mosè nasce ed è chiamato." }, de: { title: "Ein Befreier wird vorbereitet", description: "Mose wird geboren und berufen." } }, { title: "Um libertador é preparado", description: "Moisés nasce e recebe o chamado." }) },
    { slug: "confrontation", startChapter: 5, endChapter: 12, icon: "crown", content: localized({ en: { title: "God confronts Pharaoh", description: "The plagues reveal who truly reigns." }, es: { title: "Dios confronta al faraón", description: "Las plagas revelan quién reina." }, fr: { title: "Dieu affronte Pharaon", description: "Les plaies révèlent qui règne." }, it: { title: "Dio affronta il faraone", description: "Le piaghe rivelano chi regna." }, de: { title: "Gott stellt sich dem Pharao", description: "Die Plagen zeigen, wer wirklich herrscht." } }, { title: "Deus confronta o Faraó", description: "As pragas revelam quem verdadeiramente reina." }) },
    { slug: "deliverance", startChapter: 13, endChapter: 18, icon: "waves", content: localized({ en: { title: "Deliverance through the sea", description: "God leads and sustains his people." }, es: { title: "Liberación por el mar", description: "Dios guía y sustenta a su pueblo." }, fr: { title: "La délivrance par la mer", description: "Dieu guide et soutient son peuple." }, it: { title: "Liberazione attraverso il mare", description: "Dio guida e sostiene il suo popolo." }, de: { title: "Befreiung durch das Meer", description: "Gott führt und versorgt sein Volk." } }, { title: "Libertação através do mar", description: "Deus conduz e sustenta o seu povo." }) },
    { slug: "covenant", startChapter: 19, endChapter: 24, icon: "tablets", content: localized({ en: { title: "Covenant at Sinai", description: "A redeemed people receives God's law." }, es: { title: "Alianza en el Sinaí", description: "El pueblo redimido recibe la ley." }, fr: { title: "L'alliance au Sinaï", description: "Le peuple racheté reçoit la loi." }, it: { title: "Alleanza al Sinai", description: "Il popolo redento riceve la legge." }, de: { title: "Bund am Sinai", description: "Das erlöste Volk empfängt Gottes Gesetz." } }, { title: "Aliança no Sinai", description: "O povo redimido recebe a lei de Deus." }) },
    { slug: "tabernacle", startChapter: 25, endChapter: 40, icon: "tent", content: localized({ en: { title: "God dwells among his people", description: "The tabernacle is designed and built." }, es: { title: "Dios habita entre su pueblo", description: "El tabernáculo es diseñado y construido." }, fr: { title: "Dieu demeure parmi son peuple", description: "Le tabernacle est conçu et construit." }, it: { title: "Dio dimora tra il suo popolo", description: "Il tabernacolo viene progettato e costruito." }, de: { title: "Gott wohnt unter seinem Volk", description: "Die Stiftshütte wird geplant und gebaut." } }, { title: "Deus habita entre o seu povo", description: "O tabernáculo é projetado e construído." }) },
  ],
  chapters: buildExodusChapters(),
};

const books = [genesis, exodus, leviticus, numbersBook, deuteronomy, joshua, judges, ruth, firstSamuel, secondSamuel, firstKings, secondKings, firstChronicles, ...restorationBooks, ...wisdomBooks, ...majorProphets, ...minorProphets, ...gospelsAndActs, ...paulineLetters, ...finalNewTestamentBooks].map(applyJourneyAuthorAttributions);

export const journeyCatalogRepository: JourneyRepository = {
  async listBooks(testament) { return testament ? books.filter((book) => book.testament === testament) : books; },
  async getBook(slug) { return books.find((book) => book.slug === slug) ?? null; },
};

export function normalizeJourneyLanguage(language: string): JourneyLanguage {
  const normalized = language.toLowerCase();
  if (normalized.startsWith("pt")) return "pt-PT";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("it")) return "it";
  if (normalized.startsWith("de")) return "de";
  return "en";
}
