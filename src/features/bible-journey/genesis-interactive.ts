import type { JourneyLanguage } from "./types";
import type { BibleRef } from "./references";

/**
 * Camada interativa de Génesis: paragens no mapa, ponto de paragem (quiz),
 * família e tempo por movimento. Textos escritos para a Jornada, nos 6 idiomas.
 */
export type L<T = string> = Record<JourneyLanguage, T>;
export const L = <T = string>(pt: T, en: T, es: T, fr: T, it: T, de: T): L<T> => ({ "pt-PT": pt, en, es, fr, it, de });

export interface JourneyStop {
  id: string;
  /** Lugar do gazetteer (places.ts). Sem lugar = paragem só de texto. */
  placeId?: string;
  /** Título próprio quando o nome do lugar não basta. */
  title?: L;
  ref: BibleRef;
  people: string[];
  text: L;
}

export interface JourneyCheckpoint { ref: BibleRef; question: L; options: L<string[]>; answer: number; explanation: L }
export interface FamilyNode { person: string; spouses?: string[]; highlight?: boolean; children?: FamilyNode[] }
export interface JourneyFigure { src: string; width: number; height: number; title: L; artist: string; year: string; sourceUrl: string; license: string }

/** Parte do Tabernáculo: ponto na gravura (x, y em %) e/ou na planta da tenda (plan). */
export interface TabernaclePart { id: string; x?: number; y?: number; plan?: { x: number; y: number }; name: L; refs: BibleRef[]; text: L }

export interface JourneyInteractiveSection {
  stops: JourneyStop[];
  checkpoint: JourneyCheckpoint;
  family?: { root: FamilyNode; ref: BibleRef; abridged?: boolean };
  /** Marcos de tempo deste movimento (anos a.C. negativos); vazio = história primordial sem datação. */
  era: { label: L; year?: number }[];
  figure?: JourneyFigure;
  /** Figura interativa do Tabernáculo (Êxodo). */
  tabernacle?: { figure: JourneyFigure; parts: TabernaclePart[] };
}

export const journeyPeople: Record<string, L> = {
  god: L("Deus", "God", "Dios", "Dieu", "Dio", "Gott"),
  serpent: L("Serpente", "Serpent", "Serpiente", "Serpent", "Serpente", "Schlange"),
  adam: L("Adão", "Adam", "Adán", "Adam", "Adamo", "Adam"),
  eve: L("Eva", "Eve", "Eva", "Ève", "Eva", "Eva"),
  cain: L("Caim", "Cain", "Caín", "Caïn", "Caino", "Kain"),
  abel: L("Abel", "Abel", "Abel", "Abel", "Abele", "Abel"),
  seth: L("Set", "Seth", "Set", "Seth", "Set", "Set"),
  enosh: L("Enos", "Enosh", "Enós", "Énosh", "Enos", "Enosch"),
  enoch: L("Enoque", "Enoch", "Enoc", "Hénoch", "Enoch", "Henoch"),
  methuselah: L("Matusalém", "Methuselah", "Matusalén", "Mathusalem", "Matusalemme", "Metuschelach"),
  lamech: L("Lameque", "Lamech", "Lamec", "Lémek", "Lamech", "Lamech"),
  noah: L("Noé", "Noah", "Noé", "Noé", "Noè", "Noah"),
  shem: L("Sem", "Shem", "Sem", "Sem", "Sem", "Sem"),
  ham: L("Cam", "Ham", "Cam", "Cham", "Cam", "Ham"),
  japheth: L("Jafé", "Japheth", "Jafet", "Japhet", "Iafet", "Jafet"),
  nimrod: L("Ninrode", "Nimrod", "Nimrod", "Nimrod", "Nimrod", "Nimrod"),
  eber: L("Héber", "Eber", "Heber", "Héber", "Eber", "Eber"),
  peleg: L("Pelegue", "Peleg", "Peleg", "Péleg", "Peleg", "Peleg"),
  terah: L("Terá", "Terah", "Taré", "Térah", "Terach", "Terach"),
  abraham: L("Abraão", "Abraham", "Abraham", "Abraham", "Abramo", "Abraham"),
  sarah: L("Sara", "Sarah", "Sara", "Sara", "Sara", "Sara"),
  nahor: L("Naor", "Nahor", "Nacor", "Nahor", "Nacor", "Nahor"),
  haranSon: L("Harã", "Haran", "Harán", "Harân", "Aran", "Haran"),
  lot: L("Ló", "Lot", "Lot", "Loth", "Lot", "Lot"),
  hagar: L("Agar", "Hagar", "Agar", "Agar", "Agar", "Hagar"),
  ishmael: L("Ismael", "Ishmael", "Ismael", "Ismaël", "Ismaele", "Ismael"),
  isaac: L("Isaac", "Isaac", "Isaac", "Isaac", "Isacco", "Isaak"),
  rebekah: L("Rebeca", "Rebekah", "Rebeca", "Rébecca", "Rebecca", "Rebekka"),
  esau: L("Esaú", "Esau", "Esaú", "Ésaü", "Esaù", "Esau"),
  jacob: L("Jacob", "Jacob", "Jacob", "Jacob", "Giacobbe", "Jakob"),
  leah: L("Lia", "Leah", "Lea", "Léa", "Lia", "Lea"),
  rachel: L("Raquel", "Rachel", "Raquel", "Rachel", "Rachele", "Rahel"),
  laban: L("Labão", "Laban", "Labán", "Laban", "Labano", "Laban"),
  reuben: L("Rúben", "Reuben", "Rubén", "Ruben", "Ruben", "Ruben"),
  levi: L("Levi", "Levi", "Leví", "Lévi", "Levi", "Levi"),
  judah: L("Judá", "Judah", "Judá", "Juda", "Giuda", "Juda"),
  joseph: L("José", "Joseph", "José", "Joseph", "Giuseppe", "Josef"),
  benjamin: L("Benjamim", "Benjamin", "Benjamín", "Benjamin", "Beniamino", "Benjamin"),
  manasseh: L("Manassés", "Manasseh", "Manasés", "Manassé", "Manasse", "Manasse"),
  ephraim: L("Efraim", "Ephraim", "Efraín", "Éphraïm", "Efraim", "Ephraim"),
  pharaoh: L("Faraó", "Pharaoh", "Faraón", "Pharaon", "Faraone", "Pharao"),
  // Êxodo
  moses: L("Moisés", "Moses", "Moisés", "Moïse", "Mosè", "Mose"),
  aaron: L("Arão", "Aaron", "Aarón", "Aaron", "Aronne", "Aaron"),
  miriam: L("Miriam", "Miriam", "María", "Miriam", "Miriam", "Mirjam"),
  kohath: L("Coate", "Kohath", "Coat", "Qehath", "Keat", "Kehat"),
  amram: L("Anrão", "Amram", "Amram", "Amram", "Amram", "Amram"),
  jochebed: L("Joquebede", "Jochebed", "Jocabed", "Jokébed", "Iochebed", "Jochebed"),
  zipporah: L("Zípora", "Zipporah", "Séfora", "Séphora", "Zippora", "Zippora"),
  gershom: L("Gérson", "Gershom", "Gersón", "Guershom", "Ghersom", "Gerschom"),
  eliezer: L("Eliézer", "Eliezer", "Eliezer", "Éliézer", "Eliezer", "Elieser"),
  jethro: L("Jetro", "Jethro", "Jetro", "Jéthro", "Ietro", "Jitro"),
  joshua: L("Josué", "Joshua", "Josué", "Josué", "Giosuè", "Josua"),
  caleb: L("Calebe", "Caleb", "Caleb", "Caleb", "Caleb", "Kaleb"),
  hur: L("Hur", "Hur", "Hur", "Hur", "Cur", "Hur"),
  nadab: L("Nadabe", "Nadab", "Nadab", "Nadab", "Nadab", "Nadab"),
  abihu: L("Abiú", "Abihu", "Abiú", "Abihu", "Abiu", "Abihu"),
  eleazar: L("Eleazar", "Eleazar", "Eleazar", "Éléazar", "Eleazar", "Eleasar"),
  ithamar: L("Itamar", "Ithamar", "Itamar", "Ithamar", "Itamar", "Itamar"),
};

export const genesisInteractive: Record<string, JourneyInteractiveSection> = {
  creation: {
    stops: [
      { id: "garden", placeId: "eden", ref: { chapter: 2, verse: 8, endVerse: 9 }, people: ["god", "adam"], text: L(
        "Deus planta um jardim no Éden, a oriente, e ali põe o ser humano que formou.",
        "God plants a garden in Eden, in the east, and places there the human he has formed.",
        "Dios planta un jardín en Edén, al oriente, y pone allí al ser humano que formó.",
        "Dieu plante un jardin en Éden, à l'orient, et y place l'être humain qu'il a formé.",
        "Dio pianta un giardino in Eden, a oriente, e vi pone l'essere umano che ha plasmato.",
        "Gott pflanzt einen Garten in Eden, im Osten, und setzt den Menschen hinein, den er geformt hat.") },
      { id: "rivers", placeId: "tigris-euphrates", ref: { chapter: 2, verse: 10, endVerse: 14 }, people: [], text: L(
        "Um rio sai do Éden e divide-se em quatro. Dois deles, o Tigre e o Eufrates, ainda hoje têm nome.",
        "A river flows out of Eden and divides into four. Two of them, the Tigris and the Euphrates, still bear those names today.",
        "Un río sale del Edén y se divide en cuatro. Dos de ellos, el Tigris y el Éufrates, conservan hoy su nombre.",
        "Un fleuve sort d'Éden et se divise en quatre. Deux d'entre eux, le Tigre et l'Euphrate, portent encore ce nom aujourd'hui.",
        "Un fiume esce dall'Eden e si divide in quattro. Due di essi, il Tigri e l'Eufrate, portano ancora oggi quel nome.",
        "Ein Strom geht von Eden aus und teilt sich in vier. Zwei davon, Tigris und Euphrat, tragen den Namen bis heute.") },
    ],
    checkpoint: {
      ref: { chapter: 1, verse: 27, endVerse: 31 }, answer: 1,
      question: L("Em que dia da criação Deus forma o ser humano à sua imagem?", "On which day of creation does God make humankind in his image?", "¿En qué día de la creación forma Dios al ser humano a su imagen?", "Quel jour de la création Dieu fait-il l'être humain à son image ?", "In quale giorno della creazione Dio fa l'essere umano a sua immagine?", "An welchem Schöpfungstag schafft Gott den Menschen nach seinem Bild?"),
      options: L(["No primeiro dia", "No sexto dia", "No sétimo dia"], ["On the first day", "On the sixth day", "On the seventh day"], ["El primer día", "El sexto día", "El séptimo día"], ["Le premier jour", "Le sixième jour", "Le septième jour"], ["Il primo giorno", "Il sesto giorno", "Il settimo giorno"], ["Am ersten Tag", "Am sechsten Tag", "Am siebten Tag"]),
      explanation: L("No sexto dia (Gn 1:27–31). No sétimo, Deus descansa e santifica o dia (Gn 2:2–3).", "On the sixth day (Gen 1:27–31). On the seventh, God rests and blesses the day (Gen 2:2–3).", "El sexto día (Gn 1:27-31). En el séptimo, Dios descansa y santifica el día (Gn 2:2-3).", "Le sixième jour (Gn 1,27-31). Le septième, Dieu se repose et bénit ce jour (Gn 2,2-3).", "Il sesto giorno (Gen 1,27-31). Il settimo, Dio si riposa e benedice quel giorno (Gen 2,2-3).", "Am sechsten Tag (1. Mose 1,27–31). Am siebten ruht Gott und segnet den Tag (1. Mose 2,2–3)."),
    },
    family: { ref: { chapter: 2, verse: 22, endVerse: 24 }, root: { person: "adam", spouses: ["eve"] } },
    figure: { src: "/jornada/genesis/schnorr-003-criacao.webp", width: 720, height: 599, artist: "Julius Schnorr von Carolsfeld", year: "1860", license: "PD", sourceUrl: "https://commons.wikimedia.org/wiki/File:Schnorr_von_Carolsfeld_Bibel_in_Bildern_1860_003.png",
      title: L("A terra e as plantas (3.º dia)", "The land and plants (third day)", "La tierra y las plantas (tercer día)", "La terre et les plantes (troisième jour)", "La terra e le piante (terzo giorno)", "Das Land und die Pflanzen (dritter Tag)") },
    era: [],
  },
  fall: {
    stops: [
      { id: "tree", placeId: "eden", ref: { chapter: 3, verse: 6, endVerse: 15 }, people: ["adam", "eve", "serpent"], text: L(
        "No jardim, a desconfiança leva à desobediência. Mesmo assim, Deus anuncia que a descendência da mulher esmagará a serpente.",
        "In the garden, distrust leads to disobedience. Even so, God announces that the woman's offspring will crush the serpent.",
        "En el jardín, la desconfianza lleva a la desobediencia. Aun así, Dios anuncia que la descendencia de la mujer aplastará a la serpiente.",
        "Dans le jardin, la défiance mène à la désobéissance. Pourtant, Dieu annonce que la descendance de la femme écrasera le serpent.",
        "Nel giardino la sfiducia porta alla disobbedienza. Eppure Dio annuncia che la discendenza della donna schiaccerà il serpente.",
        "Im Garten führt Misstrauen zum Ungehorsam. Dennoch kündigt Gott an, dass der Nachkomme der Frau die Schlange zertreten wird.") },
      { id: "east-gate", placeId: "eden", ref: { chapter: 3, verse: 23, endVerse: 24 }, people: ["adam", "eve"],
        title: L("A oriente do jardim", "East of the garden", "Al oriente del jardín", "À l'orient du jardin", "A oriente del giardino", "Östlich des Gartens"), text: L(
        "Adão e Eva saem do jardim. Querubins guardam, a oriente, o caminho da árvore da vida.",
        "Adam and Eve leave the garden. Cherubim guard the way to the tree of life, on the east side.",
        "Adán y Eva salen del jardín. Querubines guardan, al oriente, el camino del árbol de la vida.",
        "Adam et Ève quittent le jardin. À l'orient, des chérubins gardent le chemin de l'arbre de vie.",
        "Adamo ed Eva escono dal giardino. A oriente, i cherubini custodiscono la via dell'albero della vita.",
        "Adam und Eva verlassen den Garten. Im Osten bewachen Cherubim den Weg zum Baum des Lebens.") },
    ],
    checkpoint: {
      ref: { chapter: 3, verse: 15 }, answer: 0,
      question: L("Que anúncio Deus faz logo depois da queda?", "What does God announce right after the fall?", "¿Qué anuncia Dios justo después de la caída?", "Qu'annonce Dieu juste après la chute ?", "Che cosa annuncia Dio subito dopo la caduta?", "Was kündigt Gott direkt nach dem Sündenfall an?"),
      options: L(
        ["Que a descendência da mulher esmagará a cabeça da serpente", "Que a terra será coberta por um dilúvio", "Que Abrão receberá a terra de Canaã"],
        ["That the woman's offspring will crush the serpent's head", "That a flood will cover the earth", "That Abram will receive the land of Canaan"],
        ["Que la descendencia de la mujer aplastará la cabeza de la serpiente", "Que un diluvio cubrirá la tierra", "Que Abram recibirá la tierra de Canaán"],
        ["Que la descendance de la femme écrasera la tête du serpent", "Qu'un déluge couvrira la terre", "Qu'Abram recevra le pays de Canaan"],
        ["Che la discendenza della donna schiaccerà la testa del serpente", "Che un diluvio coprirà la terra", "Che Abram riceverà la terra di Canaan"],
        ["Dass der Nachkomme der Frau der Schlange den Kopf zertreten wird", "Dass eine Flut die Erde bedecken wird", "Dass Abram das Land Kanaan erhalten wird"]),
      explanation: L("Gn 3:15 é chamado muitas vezes o «primeiro evangelho»: a promessa de vitória surge no próprio lugar da queda.", "Gen 3:15 is often called the \"first gospel\": the promise of victory appears in the very place of the fall.", "Gn 3:15 suele llamarse el «primer evangelio»: la promesa de victoria aparece en el mismo lugar de la caída.", "Gn 3,15 est souvent appelé le « protévangile » : la promesse de victoire surgit au lieu même de la chute.", "Gen 3,15 è spesso chiamato «protovangelo»: la promessa di vittoria nasce nel luogo stesso della caduta.", "1. Mose 3,15 wird oft „Protevangelium“ genannt: Die Verheißung des Sieges erscheint mitten im Sündenfall."),
    },
    figure: { src: "/jornada/genesis/schnorr-010-queda.webp", width: 720, height: 595, artist: "Julius Schnorr von Carolsfeld", year: "1860", license: "PD", sourceUrl: "https://commons.wikimedia.org/wiki/File:Schnorr_von_Carolsfeld_Bibel_in_Bildern_1860_010.png",
      title: L("A expulsão do jardim", "The expulsion from the garden", "La expulsión del jardín", "L'expulsion du jardin", "La cacciata dal giardino", "Die Vertreibung aus dem Garten") },
    era: [],
  },
  "first-generations": {
    stops: [
      { id: "offerings", placeId: "eden", ref: { chapter: 4, verse: 3, endVerse: 8 }, people: ["cain", "abel"],
        title: L("Fora do jardim", "Outside the garden", "Fuera del jardín", "Hors du jardin", "Fuori dal giardino", "Außerhalb des Gartens"), text: L(
        "Caim e Abel trazem ofertas. A inveja de Caim acaba no primeiro homicídio.",
        "Cain and Abel bring offerings. Cain's envy ends in the first murder.",
        "Caín y Abel presentan ofrendas. La envidia de Caín termina en el primer homicidio.",
        "Caïn et Abel apportent des offrandes. La jalousie de Caïn aboutit au premier meurtre.",
        "Caino e Abele portano offerte. L'invidia di Caino finisce nel primo omicidio.",
        "Kain und Abel bringen Opfer. Kains Neid endet im ersten Mord.") },
      { id: "nod", placeId: "nod", ref: { chapter: 4, verse: 16, endVerse: 17 }, people: ["cain"], text: L(
        "Caim vai habitar na terra de Node, a oriente do Éden, e funda uma cidade.",
        "Cain settles in the land of Nod, east of Eden, and builds a city.",
        "Caín se establece en la tierra de Nod, al oriente del Edén, y funda una ciudad.",
        "Caïn s'établit au pays de Nod, à l'est d'Éden, et bâtit une ville.",
        "Caino si stabilisce nel paese di Nod, a oriente dell'Eden, e costruisce una città.",
        "Kain lässt sich im Land Nod nieder, östlich von Eden, und baut eine Stadt.") },
      { id: "seth-line", ref: { chapter: 4, verse: 25, endChapter: 5, endVerse: 32 }, people: ["seth", "enoch", "noah"],
        title: L("A linhagem de Set", "The line of Seth", "El linaje de Set", "La lignée de Seth", "La discendenza di Set", "Die Linie Sets"), text: L(
        "Nasce Set e com ele uma linhagem que invoca o nome do Senhor. A lista de Génesis 5 chega até Noé.",
        "Seth is born, and with him a line that calls on the name of the Lord. The list in Genesis 5 reaches Noah.",
        "Nace Set y con él un linaje que invoca el nombre del Señor. La lista de Génesis 5 llega hasta Noé.",
        "Seth naît, et avec lui une lignée qui invoque le nom du Seigneur. La liste de Genèse 5 conduit jusqu'à Noé.",
        "Nasce Set e con lui una discendenza che invoca il nome del Signore. L'elenco di Genesi 5 arriva fino a Noè.",
        "Set wird geboren und mit ihm eine Linie, die den Namen des Herrn anruft. Die Liste in 1. Mose 5 reicht bis Noah.") },
    ],
    checkpoint: {
      ref: { chapter: 4, verse: 25, endChapter: 5, endVerse: 32 }, answer: 2,
      question: L("Por qual filho de Adão continua a linhagem que chega a Noé?", "Through which son of Adam does the line that reaches Noah continue?", "¿Por cuál hijo de Adán continúa el linaje que llega a Noé?", "Par quel fils d'Adam se poursuit la lignée qui mène à Noé ?", "Attraverso quale figlio di Adamo continua la discendenza che arriva a Noè?", "Durch welchen Sohn Adams setzt sich die Linie bis Noah fort?"),
      options: L(["Caim", "Abel", "Set"], ["Cain", "Abel", "Seth"], ["Caín", "Abel", "Set"], ["Caïn", "Abel", "Seth"], ["Caino", "Abele", "Set"], ["Kain", "Abel", "Set"]),
      explanation: L("Por Set (Gn 4:25–5:32). Abel morre sem descendência e a linhagem de Caim termina na violência de Lameque.", "Through Seth (Gen 4:25–5:32). Abel dies without children, and Cain's line ends in Lamech's violence.", "Por Set (Gn 4:25–5:32). Abel muere sin descendencia y el linaje de Caín termina en la violencia de Lamec.", "Par Seth (Gn 4,25–5,32). Abel meurt sans descendance et la lignée de Caïn s'achève dans la violence de Lémek.", "Attraverso Set (Gen 4,25–5,32). Abele muore senza figli e la discendenza di Caino finisce nella violenza di Lamech.", "Durch Set (1. Mose 4,25–5,32). Abel stirbt ohne Nachkommen, und Kains Linie endet in Lamechs Gewalt."),
    },
    family: { ref: { chapter: 5, verse: 1, endVerse: 32 }, abridged: true, root: { person: "adam", spouses: ["eve"], children: [
      { person: "cain" }, { person: "abel" },
      { person: "seth", highlight: true, children: [{ person: "enosh", children: [{ person: "enoch", children: [{ person: "methuselah", children: [{ person: "lamech", children: [{ person: "noah", highlight: true }] }] }] }] }] },
    ] } },
    figure: { src: "/jornada/genesis/schnorr-011-primeiras-geracoes.webp", width: 720, height: 586, artist: "Julius Schnorr von Carolsfeld", year: "1860", license: "PD", sourceUrl: "https://commons.wikimedia.org/wiki/File:Schnorr_von_Carolsfeld_Bibel_in_Bildern_1860_011.png",
      title: L("A família de Adão fora do Éden", "Adam's family outside Eden", "La familia de Adán fuera del Edén", "La famille d'Adam hors d'Éden", "La famiglia di Adamo fuori dall'Eden", "Adams Familie außerhalb Edens") },
    era: [],
  },
  flood: {
    stops: [
      { id: "ark", ref: { chapter: 6, verse: 13, endVerse: 22 }, people: ["noah"],
        title: L("A arca", "The ark", "El arca", "L'arche", "L'arca", "Die Arche"), text: L(
        "Num mundo cheio de violência, Noé acha graça diante de Deus e constrói a arca como lhe foi ordenado.",
        "In a world full of violence, Noah finds favour with God and builds the ark as he was commanded.",
        "En un mundo lleno de violencia, Noé halla gracia ante Dios y construye el arca como se le ordenó.",
        "Dans un monde rempli de violence, Noé trouve grâce aux yeux de Dieu et construit l'arche comme il lui a été ordonné.",
        "In un mondo pieno di violenza, Noè trova grazia davanti a Dio e costruisce l'arca come gli è stato ordinato.",
        "In einer Welt voller Gewalt findet Noah Gnade vor Gott und baut die Arche, wie es ihm geboten wurde.") },
      { id: "ararat", placeId: "ararat", ref: { chapter: 8, verse: 4 }, people: ["noah"], text: L(
        "Ao fim das águas, a arca repousa sobre os montes de Ararate, na região do antigo Urartu.",
        "As the waters recede, the ark comes to rest on the mountains of Ararat, in the region of ancient Urartu.",
        "Cuando las aguas bajan, el arca reposa sobre los montes de Ararat, en la región del antiguo Urartu.",
        "Quand les eaux baissent, l'arche s'arrête sur les monts d'Ararat, dans la région de l'ancien Urartu.",
        "Quando le acque calano, l'arca si posa sui monti dell'Ararat, nella regione dell'antico Urartu.",
        "Als die Wasser sinken, setzt die Arche auf dem Gebirge Ararat auf, im Gebiet des alten Urartu.") },
      { id: "bow", placeId: "ararat", ref: { chapter: 9, verse: 8, endVerse: 17 }, people: ["god", "noah"],
        title: L("O arco nas nuvens", "The bow in the clouds", "El arco en las nubes", "L'arc dans la nuée", "L'arco sulle nubi", "Der Bogen in den Wolken"), text: L(
        "Deus faz aliança com Noé e com toda a criação: nunca mais um dilúvio destruirá a terra.",
        "God makes a covenant with Noah and all creation: never again will a flood destroy the earth.",
        "Dios hace un pacto con Noé y con toda la creación: nunca más un diluvio destruirá la tierra.",
        "Dieu fait alliance avec Noé et toute la création : plus jamais un déluge ne détruira la terre.",
        "Dio stabilisce un'alleanza con Noè e con tutta la creazione: mai più un diluvio distruggerà la terra.",
        "Gott schließt einen Bund mit Noah und der ganzen Schöpfung: Nie wieder soll eine Flut die Erde verderben.") },
    ],
    checkpoint: {
      ref: { chapter: 9, verse: 12, endVerse: 17 }, answer: 1,
      question: L("Qual é o sinal da aliança de Deus com Noé?", "What is the sign of God's covenant with Noah?", "¿Cuál es la señal del pacto de Dios con Noé?", "Quel est le signe de l'alliance de Dieu avec Noé ?", "Qual è il segno dell'alleanza di Dio con Noè?", "Was ist das Zeichen von Gottes Bund mit Noah?"),
      options: L(["A circuncisão", "O arco nas nuvens", "O sábado"], ["Circumcision", "The bow in the clouds", "The Sabbath"], ["La circuncisión", "El arco en las nubes", "El sábado"], ["La circoncision", "L'arc dans la nuée", "Le sabbat"], ["La circoncisione", "L'arco sulle nubi", "Il sabato"], ["Die Beschneidung", "Der Bogen in den Wolken", "Der Sabbat"]),
      explanation: L("O arco nas nuvens (Gn 9:13). A circuncisão será o sinal da aliança com Abraão (Gn 17:11).", "The bow in the clouds (Gen 9:13). Circumcision will be the sign of the covenant with Abraham (Gen 17:11).", "El arco en las nubes (Gn 9:13). La circuncisión será la señal del pacto con Abraham (Gn 17:11).", "L'arc dans la nuée (Gn 9,13). La circoncision sera le signe de l'alliance avec Abraham (Gn 17,11).", "L'arco sulle nubi (Gen 9,13). La circoncisione sarà il segno dell'alleanza con Abramo (Gen 17,11).", "Der Bogen in den Wolken (1. Mose 9,13). Die Beschneidung wird das Zeichen des Bundes mit Abraham (1. Mose 17,11)."),
    },
    family: { ref: { chapter: 9, verse: 18, endVerse: 19 }, root: { person: "noah", children: [{ person: "shem", highlight: true }, { person: "ham" }, { person: "japheth" }] } },
    figure: { src: "/jornada/genesis/schnorr-018-diluvio.webp", width: 720, height: 577, artist: "Julius Schnorr von Carolsfeld", year: "1860", license: "PD", sourceUrl: "https://commons.wikimedia.org/wiki/File:Schnorr_von_Carolsfeld_Bibel_in_Bildern_1860_018.png",
      title: L("Noé e a família saem da arca", "Noah and his family leave the ark", "Noé y su familia salen del arca", "Noé et sa famille sortent de l'arche", "Noè e la famiglia escono dall'arca", "Noah und seine Familie verlassen die Arche") },
    era: [],
  },
  nations: {
    stops: [
      { id: "nineveh", placeId: "nineveh", ref: { chapter: 10, verse: 8, endVerse: 12 }, people: ["nimrod"], text: L(
        "Na tabela das nações, Ninrode funda cidades em Sinear e na Assíria, entre elas Nínive.",
        "In the table of nations, Nimrod founds cities in Shinar and Assyria, among them Nineveh.",
        "En la tabla de las naciones, Nimrod funda ciudades en Sinar y en Asiria, entre ellas Nínive.",
        "Dans la table des peuples, Nimrod fonde des villes en Shinéar et en Assyrie, dont Ninive.",
        "Nella tavola delle nazioni, Nimrod fonda città in Sinar e in Assiria, tra cui Ninive.",
        "In der Völkertafel gründet Nimrod Städte in Schinar und Assyrien, darunter Ninive.") },
      { id: "babel", placeId: "babel", ref: { chapter: 11, verse: 1, endVerse: 9 }, people: [], text: L(
        "Na planície de Sinear, os homens querem uma torre que chegue ao céu. Deus confunde a língua e dispersa-os.",
        "On the plain of Shinar, people want a tower that reaches heaven. God confuses their language and scatters them.",
        "En la llanura de Sinar, los hombres quieren una torre que llegue al cielo. Dios confunde su lengua y los dispersa.",
        "Dans la plaine de Shinéar, les hommes veulent une tour qui atteigne le ciel. Dieu brouille leur langue et les disperse.",
        "Nella pianura di Sinar gli uomini vogliono una torre che arrivi al cielo. Dio confonde la loro lingua e li disperde.",
        "In der Ebene Schinar wollen die Menschen einen Turm bis zum Himmel bauen. Gott verwirrt ihre Sprache und zerstreut sie.") },
      { id: "ur", placeId: "ur", ref: { chapter: 11, verse: 27, endVerse: 30 }, people: ["terah", "abraham", "sarah"], text: L(
        "Em Ur dos Caldeus vive a família de Terá. Sarai, mulher de Abrão, é estéril: a história da promessa começa num vazio.",
        "Terah's family lives in Ur of the Chaldeans. Sarai, Abram's wife, is barren: the story of the promise begins with an emptiness.",
        "En Ur de los caldeos vive la familia de Taré. Sarai, mujer de Abram, es estéril: la historia de la promesa empieza con un vacío.",
        "La famille de Térah vit à Ur en Chaldée. Saraï, femme d'Abram, est stérile : l'histoire de la promesse commence par un manque.",
        "A Ur dei Caldei vive la famiglia di Terach. Sarai, moglie di Abram, è sterile: la storia della promessa comincia da un vuoto.",
        "In Ur in Chaldäa lebt die Familie Terachs. Sarai, Abrams Frau, ist unfruchtbar: Die Geschichte der Verheißung beginnt mit einer Leere.") },
      { id: "haran", placeId: "haran", ref: { chapter: 11, verse: 31, endVerse: 32 }, people: ["terah", "abraham", "lot"], text: L(
        "Terá parte com Abrão, Sarai e Ló rumo a Canaã, mas ficam em Harã. Ali Terá morre.",
        "Terah sets out with Abram, Sarai and Lot for Canaan, but they settle in Haran. Terah dies there.",
        "Taré parte con Abram, Sarai y Lot hacia Canaán, pero se quedan en Harán. Allí muere Taré.",
        "Térah part avec Abram, Saraï et Loth vers Canaan, mais ils s'établissent à Harrân. Térah y meurt.",
        "Terach parte con Abram, Sarai e Lot verso Canaan, ma si fermano a Carran. Lì Terach muore.",
        "Terach bricht mit Abram, Sarai und Lot nach Kanaan auf, doch sie bleiben in Haran. Dort stirbt Terach.") },
    ],
    checkpoint: {
      ref: { chapter: 11, verse: 2 }, answer: 0,
      question: L("Onde os homens constroem a cidade e a torre de Babel?", "Where do people build the city and tower of Babel?", "¿Dónde construyen los hombres la ciudad y la torre de Babel?", "Où les hommes bâtissent-ils la ville et la tour de Babel ?", "Dove gli uomini costruiscono la città e la torre di Babele?", "Wo bauen die Menschen die Stadt und den Turm zu Babel?"),
      options: L(["Na planície de Sinear", "Em Canaã", "No Egito"], ["On the plain of Shinar", "In Canaan", "In Egypt"], ["En la llanura de Sinar", "En Canaán", "En Egipto"], ["Dans la plaine de Shinéar", "En Canaan", "En Égypte"], ["Nella pianura di Sinar", "In Canaan", "In Egitto"], ["In der Ebene Schinar", "In Kanaan", "In Ägypten"]),
      explanation: L("Na planície de Sinear (Gn 11:2), no sul da Mesopotâmia, a terra de Babilónia.", "On the plain of Shinar (Gen 11:2), in southern Mesopotamia, the land of Babylon.", "En la llanura de Sinar (Gn 11:2), en el sur de Mesopotamia, la tierra de Babilonia.", "Dans la plaine de Shinéar (Gn 11,2), au sud de la Mésopotamie, le pays de Babylone.", "Nella pianura di Sinar (Gen 11,2), nella Mesopotamia meridionale, la terra di Babilonia.", "In der Ebene Schinar (1. Mose 11,2), im südlichen Mesopotamien, dem Land Babylon."),
    },
    family: { ref: { chapter: 11, verse: 10, endVerse: 27 }, abridged: true, root: { person: "shem", children: [{ person: "eber", children: [{ person: "peleg", children: [{ person: "terah", children: [
      { person: "abraham", spouses: ["sarah"], highlight: true }, { person: "nahor" }, { person: "haranSon", children: [{ person: "lot" }] },
    ] }] }] }] } },
    figure: { src: "/jornada/genesis/schnorr-021-babel.webp", width: 720, height: 564, artist: "Julius Schnorr von Carolsfeld", year: "1860", license: "PD", sourceUrl: "https://commons.wikimedia.org/wiki/File:Schnorr_von_Carolsfeld_Bibel_in_Bildern_1860_021.png",
      title: L("A dispersão depois de Babel", "The scattering after Babel", "La dispersión después de Babel", "La dispersion après Babel", "La dispersione dopo Babele", "Die Zerstreuung nach Babel") },
    era: [],
  },
  patriarchs: {
    stops: [
      { id: "call", placeId: "haran", ref: { chapter: 12, verse: 1, endVerse: 4 }, people: ["abraham"], text: L(
        "«Sai da tua terra.» Aos 75 anos, Abrão parte de Harã com uma promessa: uma terra, um povo e uma bênção para todas as famílias.",
        "\"Go from your country.\" At 75, Abram leaves Haran with a promise: a land, a people and a blessing for all families.",
        "«Vete de tu tierra.» A los 75 años, Abram sale de Harán con una promesa: una tierra, un pueblo y una bendición para todas las familias.",
        "« Va-t'en de ton pays. » À 75 ans, Abram quitte Harrân avec une promesse : une terre, un peuple et une bénédiction pour toutes les familles.",
        "«Vattene dalla tua terra.» A 75 anni Abram lascia Carran con una promessa: una terra, un popolo e una benedizione per tutte le famiglie.",
        "„Geh aus deinem Land.“ Mit 75 Jahren verlässt Abram Haran mit einer Verheißung: ein Land, ein Volk und Segen für alle Geschlechter.") },
      { id: "shechem", placeId: "shechem", ref: { chapter: 12, verse: 6, endVerse: 7 }, people: ["abraham"], text: L(
        "Junto ao carvalho de Moré, Deus promete a terra à descendência de Abrão. Ele ergue o primeiro altar.",
        "By the oak of Moreh, God promises the land to Abram's offspring. He builds his first altar.",
        "Junto a la encina de More, Dios promete la tierra a la descendencia de Abram. Él levanta su primer altar.",
        "Près du chêne de Moré, Dieu promet le pays à la descendance d'Abram. Il bâtit son premier autel.",
        "Presso la quercia di More, Dio promette la terra alla discendenza di Abram. Egli erige il primo altare.",
        "An der Eiche More verheißt Gott Abrams Nachkommen das Land. Er baut seinen ersten Altar.") },
      { id: "bethel-ai", placeId: "bethel", ref: { chapter: 12, verse: 8 }, people: ["abraham"],
        title: L("Betel e Ai", "Bethel and Ai", "Betel y Hai", "Béthel et Aï", "Betel e Ai", "Bethel und Ai"), text: L(
        "Entre Betel e Ai, Abrão arma a tenda e invoca o nome do Senhor. É para aqui que volta depois do Egito.",
        "Between Bethel and Ai, Abram pitches his tent and calls on the name of the Lord. He returns here after Egypt.",
        "Entre Betel y Hai, Abram planta su tienda e invoca el nombre del Señor. Aquí vuelve después de Egipto.",
        "Entre Béthel et Aï, Abram dresse sa tente et invoque le nom du Seigneur. Il y revient après l'Égypte.",
        "Tra Betel e Ai, Abram pianta la tenda e invoca il nome del Signore. Qui torna dopo l'Egitto.",
        "Zwischen Bethel und Ai schlägt Abram sein Zelt auf und ruft den Namen des Herrn an. Hierher kehrt er nach Ägypten zurück.") },
      { id: "egypt", placeId: "egypt", ref: { chapter: 12, verse: 10, endVerse: 20 }, people: ["abraham", "sarah", "pharaoh"], text: L(
        "A fome leva Abrão ao Egito. Com medo, apresenta Sarai como irmã; Deus protege-a mesmo assim.",
        "Famine drives Abram to Egypt. Afraid, he presents Sarai as his sister; God protects her all the same.",
        "El hambre lleva a Abram a Egipto. Por miedo, presenta a Sarai como su hermana; aun así, Dios la protege.",
        "La famine pousse Abram en Égypte. Par peur, il fait passer Saraï pour sa sœur ; Dieu la protège malgré tout.",
        "La carestia spinge Abram in Egitto. Per paura presenta Sarai come sua sorella; Dio la protegge comunque.",
        "Eine Hungersnot treibt Abram nach Ägypten. Aus Angst gibt er Sarai als seine Schwester aus; Gott beschützt sie dennoch.") },
      { id: "mamre", placeId: "hebron", ref: { chapter: 18, verse: 1, endVerse: 15 }, people: ["abraham", "sarah"], text: L(
        "Junto aos carvalhos de Manre, Abraão recebe três visitantes e ouve que Sara terá um filho.",
        "By the oaks of Mamre, Abraham welcomes three visitors and hears that Sarah will have a son.",
        "Junto a las encinas de Mamre, Abraham recibe a tres visitantes y oye que Sara tendrá un hijo.",
        "Près des chênes de Mamré, Abraham accueille trois visiteurs et apprend que Sara aura un fils.",
        "Presso le querce di Mamre, Abramo accoglie tre visitatori e sente che Sara avrà un figlio.",
        "Bei den Eichen von Mamre empfängt Abraham drei Besucher und hört, dass Sara einen Sohn bekommen wird.") },
      { id: "beersheba", placeId: "beersheba", ref: { chapter: 21, verse: 1, endVerse: 33 }, people: ["abraham", "isaac"], text: L(
        "Nasce Isaac, o filho da promessa. Em Berseba, Abraão planta uma tamargueira e invoca o Deus eterno.",
        "Isaac, the son of promise, is born. At Beersheba Abraham plants a tamarisk and calls on the everlasting God.",
        "Nace Isaac, el hijo de la promesa. En Beerseba, Abraham planta un tamarisco e invoca al Dios eterno.",
        "Isaac, le fils de la promesse, naît. À Beer-Shéba, Abraham plante un tamaris et invoque le Dieu d'éternité.",
        "Nasce Isacco, il figlio della promessa. A Bersabea Abramo pianta un tamerisco e invoca il Dio eterno.",
        "Isaak, der Sohn der Verheißung, wird geboren. In Beerscheba pflanzt Abraham eine Tamariske und ruft den ewigen Gott an.") },
      { id: "moriah", placeId: "moriah", ref: { chapter: 22, verse: 1, endVerse: 14 }, people: ["abraham", "isaac"], text: L(
        "Deus prova Abraão num monte da terra de Moriá. Um carneiro é providenciado: «O Senhor proverá.»",
        "God tests Abraham on a mountain in the land of Moriah. A ram is provided: \"The Lord will provide.\"",
        "Dios prueba a Abraham en un monte de la tierra de Moriah. Se provee un carnero: «El Señor proveerá.»",
        "Dieu met Abraham à l'épreuve sur une montagne du pays de Morija. Un bélier est donné : « Le Seigneur pourvoira. »",
        "Dio mette alla prova Abramo su un monte nella terra di Moria. Viene provveduto un montone: «Il Signore provvederà.»",
        "Gott prüft Abraham auf einem Berg im Land Morija. Ein Widder wird bereitgestellt: „Der Herr sieht.“") },
      { id: "jacob-dream", placeId: "bethel", ref: { chapter: 28, verse: 10, endVerse: 22 }, people: ["jacob"],
        title: L("Betel · o sonho de Jacob", "Bethel · Jacob's dream", "Betel · el sueño de Jacob", "Béthel · le songe de Jacob", "Betel · il sogno di Giacobbe", "Bethel · Jakobs Traum"), text: L(
        "Em fuga de Esaú, Jacob sonha com uma escada entre a terra e o céu. Deus renova-lhe a promessa feita a Abraão.",
        "Fleeing from Esau, Jacob dreams of a stairway between earth and heaven. God renews to him the promise made to Abraham.",
        "Huyendo de Esaú, Jacob sueña con una escalera entre la tierra y el cielo. Dios le renueva la promesa hecha a Abraham.",
        "En fuite devant Ésaü, Jacob voit en songe une échelle entre la terre et le ciel. Dieu lui renouvelle la promesse faite à Abraham.",
        "In fuga da Esaù, Giacobbe sogna una scala tra la terra e il cielo. Dio gli rinnova la promessa fatta ad Abramo.",
        "Auf der Flucht vor Esau träumt Jakob von einer Leiter zwischen Erde und Himmel. Gott erneuert ihm die Verheißung an Abraham.") },
      { id: "laban", placeId: "haran", ref: { chapter: 29, endChapter: 31 }, people: ["jacob", "laban", "leah", "rachel"],
        title: L("Harã · casa de Labão", "Haran · Laban's house", "Harán · casa de Labán", "Harrân · chez Laban", "Carran · casa di Labano", "Haran · Labans Haus"), text: L(
        "Em Harã, Jacob serve Labão vinte anos, casa com Lia e Raquel, e nascem onze dos seus filhos.",
        "In Haran Jacob serves Laban for twenty years, marries Leah and Rachel, and eleven of his sons are born.",
        "En Harán, Jacob sirve a Labán veinte años, se casa con Lea y Raquel, y nacen once de sus hijos.",
        "À Harrân, Jacob sert Laban vingt ans, épouse Léa et Rachel, et onze de ses fils naissent.",
        "A Carran Giacobbe serve Labano per vent'anni, sposa Lia e Rachele e nascono undici dei suoi figli.",
        "In Haran dient Jakob Laban zwanzig Jahre, heiratet Lea und Rahel, und elf seiner Söhne werden geboren.") },
      { id: "peniel", placeId: "penuel", ref: { chapter: 32, verse: 22, endVerse: 32 }, people: ["jacob"], text: L(
        "Junto ao vau do Jaboque, Jacob luta até ao amanhecer e recebe um novo nome: Israel.",
        "At the ford of the Jabbok, Jacob wrestles until daybreak and receives a new name: Israel.",
        "Junto al vado del Jaboc, Jacob lucha hasta el amanecer y recibe un nombre nuevo: Israel.",
        "Au gué du Yabboq, Jacob lutte jusqu'à l'aube et reçoit un nom nouveau : Israël.",
        "Al guado dello Iabbok, Giacobbe lotta fino all'alba e riceve un nome nuovo: Israele.",
        "An der Furt des Jabbok ringt Jakob bis zum Morgengrauen und erhält einen neuen Namen: Israel.") },
      { id: "dothan", placeId: "dothan", ref: { chapter: 37, verse: 12, endVerse: 28 }, people: ["joseph"], text: L(
        "Em Dotã, os irmãos lançam José numa cisterna e vendem-no a mercadores que descem para o Egito.",
        "At Dothan, his brothers throw Joseph into a pit and sell him to traders going down to Egypt.",
        "En Dotán, los hermanos echan a José en una cisterna y lo venden a mercaderes que bajan a Egipto.",
        "À Dothan, ses frères jettent Joseph dans une citerne et le vendent à des marchands qui descendent en Égypte.",
        "A Dotan i fratelli gettano Giuseppe in una cisterna e lo vendono a mercanti diretti in Egitto.",
        "In Dotan werfen die Brüder Josef in eine Zisterne und verkaufen ihn an Händler, die nach Ägypten ziehen.") },
      { id: "goshen", placeId: "goshen", ref: { chapter: 45, verse: 4, endChapter: 47, endVerse: 27 }, people: ["joseph", "jacob"], text: L(
        "José, agora governador, revela-se aos irmãos. A família de Jacob instala-se em Gósen e é preservada da fome.",
        "Joseph, now governor, reveals himself to his brothers. Jacob's family settles in Goshen and is kept alive through the famine.",
        "José, ya gobernador, se da a conocer a sus hermanos. La familia de Jacob se establece en Gosén y es preservada del hambre.",
        "Joseph, devenu gouverneur, se fait reconnaître de ses frères. La famille de Jacob s'installe à Gosen et échappe à la famine.",
        "Giuseppe, ormai governatore, si fa riconoscere dai fratelli. La famiglia di Giacobbe si stabilisce a Gosen ed è salvata dalla carestia.",
        "Josef, inzwischen Statthalter, gibt sich seinen Brüdern zu erkennen. Jakobs Familie lässt sich in Goschen nieder und überlebt die Hungersnot.") },
      { id: "machpelah", placeId: "hebron", ref: { chapter: 50, verse: 12, endVerse: 26 }, people: ["jacob", "joseph"],
        title: L("Hebron · caverna de Macpela", "Hebron · cave of Machpelah", "Hebrón · cueva de Macpela", "Hébron · grotte de Makpéla", "Ebron · grotta di Macpela", "Hebron · Höhle Machpela"), text: L(
        "Jacob é sepultado na caverna de Macpela, com Abraão e Isaac. José morre no Egito pedindo que os seus ossos subam a Canaã.",
        "Jacob is buried in the cave of Machpelah with Abraham and Isaac. Joseph dies in Egypt asking that his bones go up to Canaan.",
        "Jacob es sepultado en la cueva de Macpela, con Abraham e Isaac. José muere en Egipto pidiendo que sus huesos suban a Canaán.",
        "Jacob est enseveli dans la grotte de Makpéla, avec Abraham et Isaac. Joseph meurt en Égypte en demandant que ses os remontent en Canaan.",
        "Giacobbe è sepolto nella grotta di Macpela, con Abramo e Isacco. Giuseppe muore in Egitto chiedendo che le sue ossa salgano in Canaan.",
        "Jakob wird in der Höhle Machpela bei Abraham und Isaak begraben. Josef stirbt in Ägypten und bittet, seine Gebeine nach Kanaan zu bringen.") },
    ],
    checkpoint: {
      ref: { chapter: 12, verse: 6, endVerse: 7 }, answer: 1,
      question: L("Em que lugar Deus promete, pela primeira vez, dar a terra à descendência de Abrão?", "Where does God first promise to give the land to Abram's offspring?", "¿En qué lugar promete Dios por primera vez dar la tierra a la descendencia de Abram?", "Où Dieu promet-il pour la première fois de donner le pays à la descendance d'Abram ?", "In quale luogo Dio promette per la prima volta la terra alla discendenza di Abram?", "Wo verheißt Gott Abrams Nachkommen zum ersten Mal das Land?"),
      options: L(["Harã", "Siquém", "Egito"], ["Haran", "Shechem", "Egypt"], ["Harán", "Siquem", "Egipto"], ["Harrân", "Sichem", "Égypte"], ["Carran", "Sichem", "Egitto"], ["Haran", "Sichem", "Ägypten"]),
      explanation: L("Em Siquém, junto ao carvalho de Moré (Gn 12:7). Abrão responde com um altar.", "At Shechem, by the oak of Moreh (Gen 12:7). Abram responds with an altar.", "En Siquem, junto a la encina de More (Gn 12:7). Abram responde con un altar.", "À Sichem, près du chêne de Moré (Gn 12,7). Abram répond par un autel.", "A Sichem, presso la quercia di More (Gen 12,7). Abram risponde con un altare.", "In Sichem, an der Eiche More (1. Mose 12,7). Abram antwortet mit einem Altar."),
    },
    family: { ref: { chapter: 25, verse: 19, endChapter: 35, endVerse: 26 }, abridged: true, root: { person: "abraham", spouses: ["sarah", "hagar"], highlight: true, children: [
      { person: "ishmael" },
      { person: "isaac", spouses: ["rebekah"], highlight: true, children: [
        { person: "esau" },
        { person: "jacob", spouses: ["leah", "rachel"], highlight: true, children: [
          { person: "reuben" }, { person: "levi" }, { person: "judah", highlight: true },
          { person: "joseph", children: [{ person: "manasseh" }, { person: "ephraim" }] }, { person: "benjamin" },
        ] },
      ] },
    ] } },
    figure: { src: "/jornada/genesis/schnorr-022-patriarcas.webp", width: 720, height: 594, artist: "Julius Schnorr von Carolsfeld", year: "1860", license: "PD", sourceUrl: "https://commons.wikimedia.org/wiki/File:Schnorr_von_Carolsfeld_Bibel_in_Bildern_1860_022.png",
      title: L("Abrão parte para Canaã", "Abram sets out for Canaan", "Abram parte hacia Canaán", "Abram part pour Canaan", "Abram parte per Canaan", "Abram zieht nach Kanaan") },
    era: [
      { year: -2090, label: L("Abrão parte de Harã", "Abram leaves Haran", "Abram sale de Harán", "Abram quitte Harrân", "Abram lascia Carran", "Abram verlässt Haran") },
      { year: -2000, label: L("Jacob em Betel", "Jacob at Bethel", "Jacob en Betel", "Jacob à Béthel", "Giacobbe a Betel", "Jakob in Bethel") },
      { year: -1875, label: L("Jacob desce ao Egito", "Jacob goes down to Egypt", "Jacob baja a Egipto", "Jacob descend en Égypte", "Giacobbe scende in Egitto", "Jakob zieht nach Ägypten") },
    ],
  },
};

export const getGenesisInteractive = (bookSlug: string, sectionSlug: string) =>
  bookSlug === "genesis" ? genesisInteractive[sectionSlug] : undefined;
