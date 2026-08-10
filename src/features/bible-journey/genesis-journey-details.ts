import type { JourneyLanguage } from "./types";

export interface JourneySectionDetails { event: string; characters: string[]; place: string; connection: string; }
type LocalizedDetails = Record<JourneyLanguage, JourneySectionDetails>;

export const genesisJourneyDetails: Record<string, LocalizedDetails> = {
  creation: {
    "pt-PT": { event: "Deus dá origem ao universo, à vida e à humanidade.", characters: ["Deus", "Adão", "Eva"], place: "Éden", connection: "Aqui começa a história bíblica: criação, propósito e comunhão." },
    en: { event: "God brings the universe, life and humanity into being.", characters: ["God", "Adam", "Eve"], place: "Eden", connection: "The biblical story begins here: creation, purpose and communion." },
    es: { event: "Dios da origen al universo, a la vida y a la humanidad.", characters: ["Dios", "Adán", "Eva"], place: "Edén", connection: "Aquí comienza la historia bíblica: creación, propósito y comunión." },
    fr: { event: "Dieu donne naissance à l'univers, à la vie et à l'humanité.", characters: ["Dieu", "Adam", "Ève"], place: "Éden", connection: "L'histoire biblique commence ici : création, vocation et communion." },
    it: { event: "Dio dà origine all'universo, alla vita e all'umanità.", characters: ["Dio", "Adamo", "Eva"], place: "Eden", connection: "Qui inizia la storia biblica: creazione, scopo e comunione." },
    de: { event: "Gott erschafft das Universum, das Leben und die Menschheit.", characters: ["Gott", "Adam", "Eva"], place: "Eden", connection: "Hier beginnt die biblische Geschichte: Schöpfung, Bestimmung und Gemeinschaft." },
  },
  fall: {
    "pt-PT": { event: "A desobediência rompe a comunhão e introduz o pecado.", characters: ["Adão", "Eva", "Serpente"], place: "Jardim do Éden", connection: "A promessa de redenção nasce no mesmo cenário da queda." },
    en: { event: "Disobedience breaks communion and introduces sin.", characters: ["Adam", "Eve", "Serpent"], place: "Garden of Eden", connection: "The promise of redemption appears in the very setting of the fall." },
    es: { event: "La desobediencia rompe la comunión e introduce el pecado.", characters: ["Adán", "Eva", "Serpiente"], place: "Jardín del Edén", connection: "La promesa de redención nace en el mismo escenario de la caída." },
    fr: { event: "La désobéissance brise la communion et introduit le péché.", characters: ["Adam", "Ève", "Serpent"], place: "Jardin d'Éden", connection: "La promesse de rédemption naît au cœur même de la chute." },
    it: { event: "La disobbedienza spezza la comunione e introduce il peccato.", characters: ["Adamo", "Eva", "Serpente"], place: "Giardino dell'Eden", connection: "La promessa di redenzione nasce nello stesso scenario della caduta." },
    de: { event: "Ungehorsam zerbricht die Gemeinschaft und bringt die Sünde.", characters: ["Adam", "Eva", "Schlange"], place: "Garten Eden", connection: "Mitten im Sündenfall erscheint die Verheißung der Erlösung." },
  },
  "first-generations": {
    "pt-PT": { event: "O pecado alcança as primeiras famílias, mas a linhagem continua.", characters: ["Caim", "Abel", "Set"], place: "A leste do Éden", connection: "Duas linhagens revelam escolhas e consequências distintas." },
    en: { event: "Sin reaches the first families, yet the lineage continues.", characters: ["Cain", "Abel", "Seth"], place: "East of Eden", connection: "Two family lines reveal different choices and consequences." },
    es: { event: "El pecado alcanza a las primeras familias, pero el linaje continúa.", characters: ["Caín", "Abel", "Set"], place: "Al este del Edén", connection: "Dos linajes revelan decisiones y consecuencias distintas." },
    fr: { event: "Le péché atteint les premières familles, mais la lignée se poursuit.", characters: ["Caïn", "Abel", "Seth"], place: "À l'est d'Éden", connection: "Deux lignées révèlent des choix et des conséquences différents." },
    it: { event: "Il peccato raggiunge le prime famiglie, ma la discendenza continua.", characters: ["Caino", "Abele", "Set"], place: "A est dell'Eden", connection: "Due discendenze mostrano scelte e conseguenze diverse." },
    de: { event: "Die Sünde erreicht die ersten Familien, doch die Linie bleibt bestehen.", characters: ["Kain", "Abel", "Set"], place: "Östlich von Eden", connection: "Zwei Abstammungslinien zeigen unterschiedliche Entscheidungen und Folgen." },
  },
  flood: {
    "pt-PT": { event: "Deus julga a violência, preserva Noé e estabelece uma aliança.", characters: ["Noé", "Família de Noé"], place: "Arca · Ararate", connection: "Depois do juízo, a aliança reafirma o valor da vida." },
    en: { event: "God judges violence, preserves Noah and establishes a covenant.", characters: ["Noah", "Noah's family"], place: "Ark · Ararat", connection: "After judgment, the covenant reaffirms the value of life." },
    es: { event: "Dios juzga la violencia, preserva a Noé y establece un pacto.", characters: ["Noé", "Familia de Noé"], place: "Arca · Ararat", connection: "Después del juicio, el pacto reafirma el valor de la vida." },
    fr: { event: "Dieu juge la violence, préserve Noé et établit une alliance.", characters: ["Noé", "Famille de Noé"], place: "Arche · Ararat", connection: "Après le jugement, l'alliance réaffirme la valeur de la vie." },
    it: { event: "Dio giudica la violenza, preserva Noè e stabilisce un'alleanza.", characters: ["Noè", "Famiglia di Noè"], place: "Arca · Ararat", connection: "Dopo il giudizio, l'alleanza riafferma il valore della vita." },
    de: { event: "Gott richtet die Gewalt, bewahrt Noah und schließt einen Bund.", characters: ["Noah", "Noahs Familie"], place: "Arche · Ararat", connection: "Nach dem Gericht bekräftigt der Bund den Wert des Lebens." },
  },
  nations: {
    "pt-PT": { event: "As nações espalham-se e Babel expõe a ambição humana.", characters: ["Descendentes de Noé", "Construtores de Babel"], place: "Sinear · Babel", connection: "A dispersão prepara o cenário para o chamado de uma família." },
    en: { event: "The nations spread and Babel exposes human ambition.", characters: ["Noah's descendants", "Builders of Babel"], place: "Shinar · Babel", connection: "The scattering prepares the stage for the call of one family." },
    es: { event: "Las naciones se dispersan y Babel expone la ambición humana.", characters: ["Descendientes de Noé", "Constructores de Babel"], place: "Sinar · Babel", connection: "La dispersión prepara el escenario para el llamado de una familia." },
    fr: { event: "Les nations se dispersent et Babel révèle l'ambition humaine.", characters: ["Descendants de Noé", "Bâtisseurs de Babel"], place: "Shinéar · Babel", connection: "La dispersion prépare l'appel d'une famille." },
    it: { event: "Le nazioni si disperdono e Babele rivela l'ambizione umana.", characters: ["Discendenti di Noè", "Costruttori di Babele"], place: "Sinar · Babele", connection: "La dispersione prepara la chiamata di una famiglia." },
    de: { event: "Die Völker zerstreuen sich und Babel enthüllt menschlichen Ehrgeiz.", characters: ["Noahs Nachkommen", "Babels Erbauer"], place: "Schinar · Babel", connection: "Die Zerstreuung bereitet die Berufung einer Familie vor." },
  },
  patriarchs: {
    "pt-PT": { event: "Deus conduz uma família por promessas, crises e providência.", characters: ["Abraão", "Sara", "Isaac", "Jacob", "José"], place: "Canaã · Harã · Egito", connection: "A família da promessa torna-se o povo que continuará em Êxodo." },
    en: { event: "God leads one family through promises, crises and providence.", characters: ["Abraham", "Sarah", "Isaac", "Jacob", "Joseph"], place: "Canaan · Haran · Egypt", connection: "The family of promise becomes the people whose story continues in Exodus." },
    es: { event: "Dios conduce a una familia entre promesas, crisis y providencia.", characters: ["Abraham", "Sara", "Isaac", "Jacob", "José"], place: "Canaán · Harán · Egipto", connection: "La familia de la promesa se convierte en el pueblo que continúa en Éxodo." },
    fr: { event: "Dieu conduit une famille à travers promesses, crises et providence.", characters: ["Abraham", "Sara", "Isaac", "Jacob", "Joseph"], place: "Canaan · Harrân · Égypte", connection: "La famille de la promesse devient le peuple dont l'histoire continue dans l'Exode." },
    it: { event: "Dio guida una famiglia attraverso promesse, crisi e provvidenza.", characters: ["Abramo", "Sara", "Isacco", "Giacobbe", "Giuseppe"], place: "Canaan · Carran · Egitto", connection: "La famiglia della promessa diventa il popolo la cui storia continua nell'Esodo." },
    de: { event: "Gott führt eine Familie durch Verheißungen, Krisen und Vorsehung.", characters: ["Abraham", "Sara", "Isaak", "Jakob", "Josef"], place: "Kanaan · Haran · Ägypten", connection: "Die Familie der Verheißung wird zum Volk, dessen Geschichte im Exodus weitergeht." },
  },
};
