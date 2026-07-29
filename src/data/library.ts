export type LibraryLanguage = "pt-PT" | "en" | "es" | "fr" | "it" | "de";

type Localized = Record<LibraryLanguage, string>;

interface VolumeDef {
  slug: string;
  // Referência bíblica (capítulos) ou subtítulo livre, mostrado sob a capa.
  refChapters?: string;
  subtitle?: Localized;
  titles: Localized;
}

interface ProductDef {
  slug: string;
  titles: Localized;
  descriptions: Localized;
  volumes: VolumeDef[];
}

const REF_BOOK: Localized = {
  "pt-PT": "Apocalipse",
  en: "Revelation",
  es: "Apocalipsis",
  fr: "Apocalypse",
  it: "Apocalisse",
  de: "Offenbarung",
};

const OUTLINES_SUBTITLE: Localized = {
  "pt-PT": "30 esboços",
  en: "30 outlines",
  es: "30 bosquejos",
  fr: "30 plans",
  it: "30 schemi",
  de: "30 Predigtentwürfe",
};

// Volumes do Apocalipse na ordem narrativa do livro de Apocalipse.
// O slug identifica o conteúdo no banco e não muda com a reordenação.
const PRODUCTS: ProductDef[] = [
  {
    slug: "apocalipse-revelado",
    titles: {
      "pt-PT": "Apocalipse Revelado",
      en: "Revelation Revealed",
      es: "Apocalipsis Revelado",
      fr: "L’Apocalypse Révélée",
      it: "Apocalisse Rivelata",
      de: "Offenbarung Enthüllt",
    },
    descriptions: {
      "pt-PT": "Uma coleção completa para compreender os principais acontecimentos e personagens do livro de Apocalipse.",
      en: "A complete collection to understand the main events and characters of the book of Revelation.",
      es: "Una colección completa para comprender los principales acontecimientos y personajes del libro de Apocalipsis.",
      fr: "Une collection complète pour comprendre les principaux événements et personnages du livre de l’Apocalypse.",
      it: "Una collezione completa per comprendere i principali avvenimenti e personaggi del libro dell’Apocalisse.",
      de: "Eine vollständige Sammlung zum Verständnis der wichtigsten Ereignisse und Gestalten des Buches der Offenbarung.",
    },
    volumes: [
      {
        slug: "volume-2",
        refChapters: "6",
        titles: {
          "pt-PT": "Os Quatro Cavaleiros",
          en: "The Four Horsemen",
          es: "Los Cuatro Jinetes",
          fr: "Les Quatre Cavaliers",
          it: "I Quattro Cavalieri",
          de: "Die Vier Reiter",
        },
      },
      {
        slug: "volume-3",
        refChapters: "7",
        titles: {
          "pt-PT": "A Grande Tribulação",
          en: "The Great Tribulation",
          es: "La Gran Tribulación",
          fr: "La Grande Tribulation",
          it: "La Grande Tribolazione",
          de: "Die Große Trübsal",
        },
      },
      {
        slug: "volume-5",
        refChapters: "8–11",
        titles: {
          "pt-PT": "As Sete Trombetas",
          en: "The Seven Trumpets",
          es: "Las Siete Trompetas",
          fr: "Les Sept Trompettes",
          it: "Le Sette Trombe",
          de: "Die Sieben Posaunen",
        },
      },
      {
        slug: "volume-6",
        refChapters: "12",
        titles: {
          "pt-PT": "A Mulher Vestida de Sol",
          en: "The Woman Clothed with the Sun",
          es: "La Mujer Vestida del Sol",
          fr: "La Femme Revêtue du Soleil",
          it: "La Donna Vestita di Sole",
          de: "Die Frau, mit der Sonne bekleidet",
        },
      },
      {
        slug: "volume-1",
        refChapters: "13",
        titles: {
          "pt-PT": "A Besta e o Falso Profeta",
          en: "The Beast and the False Prophet",
          es: "La Bestia y el Falso Profeta",
          fr: "La Bête et le Faux Prophète",
          it: "La Bestia e il Falso Profeta",
          de: "Das Tier und der Falsche Prophet",
        },
      },
      {
        slug: "volume-7",
        refChapters: "13",
        titles: {
          "pt-PT": "O Anticristo",
          en: "The Antichrist",
          es: "El Anticristo",
          fr: "L’Antéchrist",
          it: "L’Anticristo",
          de: "Der Antichrist",
        },
      },
      {
        slug: "volume-4",
        refChapters: "17–18",
        titles: {
          "pt-PT": "A Grande Prostituta",
          en: "The Great Prostitute",
          es: "La Gran Prostituta",
          fr: "La Grande Prostituée",
          it: "La Grande Prostituta",
          de: "Die Große Hure",
        },
      },
      {
        slug: "volume-8",
        refChapters: "21–22",
        titles: {
          "pt-PT": "A Nova Jerusalém",
          en: "The New Jerusalem",
          es: "La Nueva Jerusalén",
          fr: "La Nouvelle Jérusalem",
          it: "La Nuova Gerusalemme",
          de: "Das Neue Jerusalem",
        },
      },
    ],
  },
  {
    slug: "trilogia-de-esbocos",
    titles: {
      "pt-PT": "Trilogia de Esboços",
      en: "Sermon Outline Trilogy",
      es: "Trilogía de Bosquejos",
      fr: "Trilogie de Plans de Sermon",
      it: "Trilogia di Schemi",
      de: "Predigtentwurf-Trilogie",
    },
    descriptions: {
      "pt-PT": "Três volumes com 90 esboços de sermão — expositivos, temáticos e textuais — prontos para a preparação de mensagens.",
      en: "Three volumes with 90 sermon outlines — expository, topical and textual — ready for message preparation.",
      es: "Tres volúmenes con 90 bosquejos de sermón — expositivos, temáticos y textuales — listos para la preparación de mensajes.",
      fr: "Trois volumes avec 90 plans de sermon — expositifs, thématiques et textuels — prêts pour la préparation de messages.",
      it: "Tre volumi con 90 schemi di sermone — espositivi, tematici e testuali — pronti per la preparazione dei messaggi.",
      de: "Drei Bände mit 90 Predigtentwürfen — auslegend, thematisch und textbezogen — bereit für die Predigtvorbereitung.",
    },
    volumes: [
      {
        slug: "volume-1",
        subtitle: OUTLINES_SUBTITLE,
        titles: {
          "pt-PT": "Esboços Expositivos",
          en: "Expository Outlines",
          es: "Bosquejos Expositivos",
          fr: "Plans Expositifs",
          it: "Schemi Espositivi",
          de: "Auslegende Predigtentwürfe",
        },
      },
      {
        slug: "volume-2",
        subtitle: OUTLINES_SUBTITLE,
        titles: {
          "pt-PT": "Esboços Temáticos",
          en: "Topical Outlines",
          es: "Bosquejos Temáticos",
          fr: "Plans Thématiques",
          it: "Schemi Tematici",
          de: "Thematische Predigtentwürfe",
        },
      },
      {
        slug: "volume-3",
        subtitle: OUTLINES_SUBTITLE,
        titles: {
          "pt-PT": "Esboços Textuais",
          en: "Textual Outlines",
          es: "Bosquejos Textuales",
          fr: "Plans Textuels",
          it: "Schemi Testuali",
          de: "Textbezogene Predigtentwürfe",
        },
      },
    ],
  },
  {
    slug: "kit-do-pregador",
    titles: {
      "pt-PT": "Kit do Pregador",
      en: "The Preacher’s Kit",
      es: "Kit del Predicador",
      fr: "Kit du Prédicateur",
      it: "Kit del Predicatore",
      de: "Das Prediger-Set",
    },
    descriptions: {
      "pt-PT": "Sete livros de formação ministerial: da vida espiritual do pregador à comunicação no púlpito.",
      en: "Seven ministry-training books: from the preacher’s spiritual life to communication in the pulpit.",
      es: "Siete libros de formación ministerial: de la vida espiritual del predicador a la comunicación en el púlpito.",
      fr: "Sept livres de formation ministérielle : de la vie spirituelle du prédicateur à la communication en chaire.",
      it: "Sette libri di formazione ministeriale: dalla vita spirituale del predicatore alla comunicazione dal pulpito.",
      de: "Sieben Bücher zur Ausbildung im Predigtdienst: vom geistlichen Leben des Predigers bis zur Kommunikation auf der Kanzel.",
    },
    volumes: [
      {
        slug: "volume-1",
        titles: {
          "pt-PT": "Desenvolvimento Espiritual do Pregador",
          en: "The Preacher’s Spiritual Development",
          es: "Desarrollo Espiritual del Predicador",
          fr: "Le Développement Spirituel du Prédicateur",
          it: "Lo Sviluppo Spirituale del Predicatore",
          de: "Die Geistliche Entwicklung des Predigers",
        },
      },
      {
        slug: "volume-2",
        titles: {
          "pt-PT": "Exegese e Hermenêutica Bíblica",
          en: "Biblical Exegesis and Hermeneutics",
          es: "Exégesis y Hermenéutica Bíblica",
          fr: "Exégèse et Herméneutique Bibliques",
          it: "Esegesi ed Ermeneutica Biblica",
          de: "Biblische Exegese und Hermeneutik",
        },
      },
      {
        slug: "volume-3",
        titles: {
          "pt-PT": "História da Pregação Cristã",
          en: "History of Christian Preaching",
          es: "Historia de la Predicación Cristiana",
          fr: "Histoire de la Prédication Chrétienne",
          it: "Storia della Predicazione Cristiana",
          de: "Geschichte der Christlichen Predigt",
        },
      },
      {
        slug: "volume-4",
        titles: {
          "pt-PT": "Preparação de Sermões — Guia Prático",
          en: "Sermon Preparation — A Practical Guide",
          es: "Preparación de Sermones — Guía Práctica",
          fr: "Préparation de Sermons — Guide Pratique",
          it: "Preparazione di Sermoni — Guida Pratica",
          de: "Predigtvorbereitung — Ein Praktischer Leitfaden",
        },
      },
      {
        slug: "volume-5",
        titles: {
          "pt-PT": "Pregação Temática",
          en: "Topical Preaching",
          es: "Predicación Temática",
          fr: "Prédication Thématique",
          it: "Predicazione Tematica",
          de: "Thematische Predigt",
        },
      },
      {
        slug: "volume-6",
        titles: {
          "pt-PT": "Pregação Expositiva",
          en: "Expository Preaching",
          es: "Predicación Expositiva",
          fr: "Prédication Expositive",
          it: "Predicazione Espositiva",
          de: "Auslegungspredigt",
        },
      },
      {
        slug: "volume-7",
        titles: {
          "pt-PT": "Comunicação Eficaz no Púlpito",
          en: "Effective Communication in the Pulpit",
          es: "Comunicación Eficaz en el Púlpito",
          fr: "Communication Efficace en Chaire",
          it: "Comunicazione Efficace dal Pulpito",
          de: "Wirksame Kommunikation auf der Kanzel",
        },
      },
    ],
  },
  {
    slug: "panorama-teologico",
    titles: {
      "pt-PT": "Panorama Teológico",
      en: "Theological Survey",
      es: "Panorama Teológico",
      fr: "Panorama Théologique",
      it: "Panorama Teologico",
      de: "Theologischer Überblick",
    },
    descriptions: {
      "pt-PT": "Dois volumes com os grandes temas teológicos do Antigo e do Novo Testamento.",
      en: "Two volumes covering the great theological themes of the Old and New Testaments.",
      es: "Dos volúmenes con los grandes temas teológicos del Antiguo y del Nuevo Testamento.",
      fr: "Deux volumes couvrant les grands thèmes théologiques de l’Ancien et du Nouveau Testament.",
      it: "Due volumi con i grandi temi teologici dell’Antico e del Nuovo Testamento.",
      de: "Zwei Bände mit den großen theologischen Themen des Alten und Neuen Testaments.",
    },
    volumes: [
      {
        slug: "volume-1",
        titles: {
          "pt-PT": "Panorama Teológico do Velho Testamento",
          en: "Theological Survey of the Old Testament",
          es: "Panorama Teológico del Antiguo Testamento",
          fr: "Panorama Théologique de l’Ancien Testament",
          it: "Panorama Teologico dell’Antico Testamento",
          de: "Theologischer Überblick über das Alte Testament",
        },
      },
      {
        slug: "volume-2",
        titles: {
          "pt-PT": "Panorama Teológico do Novo Testamento",
          en: "Theological Survey of the New Testament",
          es: "Panorama Teológico del Nuevo Testamento",
          fr: "Panorama Théologique du Nouveau Testament",
          it: "Panorama Teologico del Nuovo Testamento",
          de: "Theologischer Überblick über das Neue Testament",
        },
      },
    ],
  },
  {
    slug: "a-uncao-do-leao",
    titles: {
      "pt-PT": "A Unção do Leão",
      en: "The Lion’s Anointing",
      es: "La Unción del León",
      fr: "L’Onction du Lion",
      it: "L’Unzione del Leone",
      de: "Die Salbung des Löwen",
    },
    descriptions: {
      "pt-PT": "Oito estudos sobre autoridade espiritual: de Jesus, o modelo, ao crescimento na unção.",
      en: "Eight studies on spiritual authority: from Jesus, the model, to growing in the anointing.",
      es: "Ocho estudios sobre autoridad espiritual: de Jesús, el modelo, al crecimiento en la unción.",
      fr: "Huit études sur l’autorité spirituelle : de Jésus, le modèle, à la croissance dans l’onction.",
      it: "Otto studi sull’autorità spirituale: da Gesù, il modello, alla crescita nell’unzione.",
      de: "Acht Studien über geistliche Autorität: von Jesus, dem Vorbild, bis zum Wachstum in der Salbung.",
    },
    volumes: [
      {
        slug: "volume-1",
        titles: {
          "pt-PT": "Jesus, o Modelo de Autoridade",
          en: "Jesus, the Model of Authority",
          es: "Jesús, el Modelo de Autoridad",
          fr: "Jésus, le Modèle d’Autorité",
          it: "Gesù, il Modello di Autorità",
          de: "Jesus, das Vorbild der Autorität",
        },
      },
      {
        slug: "volume-2",
        titles: {
          "pt-PT": "Autoridade Espiritual",
          en: "Spiritual Authority",
          es: "Autoridad Espiritual",
          fr: "Autorité Spirituelle",
          it: "Autorità Spirituale",
          de: "Geistliche Autorität",
        },
      },
      {
        slug: "volume-3",
        titles: {
          "pt-PT": "A Unção do Espírito Santo",
          en: "The Anointing of the Holy Spirit",
          es: "La Unción del Espíritu Santo",
          fr: "L’Onction du Saint-Esprit",
          it: "L’Unzione dello Spirito Santo",
          de: "Die Salbung des Heiligen Geistes",
        },
      },
      {
        slug: "volume-4",
        titles: {
          "pt-PT": "Autoridade na Oração e Intercessão",
          en: "Authority in Prayer and Intercession",
          es: "Autoridad en la Oración y la Intercesión",
          fr: "Autorité dans la Prière et l’Intercession",
          it: "Autorità nella Preghiera e nell’Intercessione",
          de: "Autorität im Gebet und in der Fürbitte",
        },
      },
      {
        slug: "volume-5",
        titles: {
          "pt-PT": "Autoridade da Fé",
          en: "The Authority of Faith",
          es: "La Autoridad de la Fe",
          fr: "L’Autorité de la Foi",
          it: "L’Autorità della Fede",
          de: "Die Autorität des Glaubens",
        },
      },
      {
        slug: "volume-6",
        titles: {
          "pt-PT": "Autoridade na Pregação e no Ensino",
          en: "Authority in Preaching and Teaching",
          es: "Autoridad en la Predicación y la Enseñanza",
          fr: "Autorité dans la Prédication et l’Enseignement",
          it: "Autorità nella Predicazione e nell’Insegnamento",
          de: "Autorität in Predigt und Lehre",
        },
      },
      {
        slug: "volume-7",
        titles: {
          "pt-PT": "Autoridade sobre as Potestades das Trevas",
          en: "Authority over the Powers of Darkness",
          es: "Autoridad sobre las Potestades de las Tinieblas",
          fr: "Autorité sur les Puissances des Ténèbres",
          it: "Autorità sulle Potestà delle Tenebre",
          de: "Autorität über die Mächte der Finsternis",
        },
      },
      {
        slug: "volume-8",
        titles: {
          "pt-PT": "Crescendo na Autoridade Espiritual",
          en: "Growing in Spiritual Authority",
          es: "Creciendo en Autoridad Espiritual",
          fr: "Grandir dans l’Autorité Spirituelle",
          it: "Crescere nell’Autorità Spirituale",
          de: "Wachsen in Geistlicher Autorität",
        },
      },
    ],
  },
  {
    slug: "as-sete-dispensacoes",
    titles: {
      "pt-PT": "As Sete Dispensações",
      en: "The Seven Dispensations",
      es: "Las Siete Dispensaciones",
      fr: "Les Sept Dispensations",
      it: "Le Sette Dispensazioni",
      de: "Die Sieben Dispensationen",
    },
    descriptions: {
      "pt-PT": "Uma jornada através do plano divino de salvação ao longo das épocas.",
      en: "A journey through God’s divine plan of salvation across the ages.",
      es: "Un viaje a través del plan divino de salvación a lo largo de las épocas.",
      fr: "Un voyage à travers le plan divin du salut à travers les âges.",
      it: "Un viaggio attraverso il piano divino di salvezza attraverso le epoche.",
      de: "Eine Reise durch Gottes göttlichen Heilsplan durch die Zeitalter.",
    },
    volumes: [
      {
        slug: "volume-1",
        titles: {
          "pt-PT": "As Sete Dispensações",
          en: "The Seven Dispensations",
          es: "Las Siete Dispensaciones",
          fr: "Les Sept Dispensations",
          it: "Le Sette Dispensazioni",
          de: "Die Sieben Dispensationen",
        },
      },
    ],
  },
  {
    slug: "tesouros-de-conhecimento-biblico",
    titles: {
      "pt-PT": "Tesouros de Conhecimento Bíblico",
      en: "Treasures of Biblical Knowledge",
      es: "Tesoros de Conocimiento Bíblico",
      fr: "Trésors de Connaissance Biblique",
      it: "Tesori di Conoscenza Biblica",
      de: "Schätze Biblischen Wissens",
    },
    descriptions: {
      "pt-PT": "História, cultura e arqueologia reveladas sob a luz das Escrituras.",
      en: "History, culture and archaeology revealed in the light of Scripture.",
      es: "Historia, cultura y arqueología reveladas a la luz de las Escrituras.",
      fr: "Histoire, culture et archéologie révélées à la lumière des Écritures.",
      it: "Storia, cultura e archeologia rivelate alla luce delle Scritture.",
      de: "Geschichte, Kultur und Archäologie im Licht der Heiligen Schrift.",
    },
    volumes: [
      {
        slug: "volume-1",
        titles: {
          "pt-PT": "Tesouros de Conhecimento Bíblico",
          en: "Treasures of Biblical Knowledge",
          es: "Tesoros de Conocimiento Bíblico",
          fr: "Trésors de Connaissance Biblique",
          it: "Tesori di Conoscenza Biblica",
          de: "Schätze Biblischen Wissens",
        },
      },
    ],
  },
];

export function libraryLanguage(language: string): LibraryLanguage {
  const lang = language.toLowerCase();
  if (lang.startsWith("en")) return "en";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("it")) return "it";
  if (lang.startsWith("de")) return "de";
  return "pt-PT";
}

function mapProduct(product: ProductDef, lang: LibraryLanguage) {
  return {
    slug: product.slug,
    title: product.titles[lang],
    description: product.descriptions[lang],
    volumes: product.volumes.map((volume, index) => ({
      slug: volume.slug,
      number: index + 1,
      ref: volume.refChapters ? `${REF_BOOK[lang]} ${volume.refChapters}` : volume.subtitle?.[lang],
      title: volume.titles[lang],
    })),
  };
}

export type LibraryProduct = ReturnType<typeof mapProduct>;

export function libraryProducts(language: string): LibraryProduct[] {
  const lang = libraryLanguage(language);
  return PRODUCTS.map((product) => mapProduct(product, lang));
}

export function libraryProduct(language: string, productSlug: string): LibraryProduct | undefined {
  const product = PRODUCTS.find((item) => item.slug === productSlug);
  return product ? mapProduct(product, libraryLanguage(language)) : undefined;
}

// Progresso de leitura (por volume e agregado do produto), em localStorage.
const volumeProgressKey = (productSlug: string, volumeSlug: string) =>
  `library-progress-vol:${productSlug}:${volumeSlug}`;

export function getVolumeProgress(productSlug: string, volumeSlug: string): number {
  return Number(localStorage.getItem(volumeProgressKey(productSlug, volumeSlug)) || 0);
}

export function getProductProgress(productSlug: string): number {
  return Number(localStorage.getItem(`library-progress:${productSlug}`) || 0);
}

export function setVolumeProgress(productSlug: string, volumeSlug: string, percent: number) {
  const product = PRODUCTS.find((item) => item.slug === productSlug);
  if (!product) return;
  const current = getVolumeProgress(productSlug, volumeSlug);
  const next = Math.max(current, Math.min(100, Math.round(percent)));
  localStorage.setItem(volumeProgressKey(productSlug, volumeSlug), String(next));
  const total = product.volumes.reduce((sum, v) => sum + getVolumeProgress(productSlug, v.slug), 0);
  localStorage.setItem(
    `library-progress:${productSlug}`,
    String(Math.round(total / product.volumes.length)),
  );
}

// Última leitura (para o "continuar de onde parou" da tela inicial).
const LAST_READ_KEY = "library-last-read";

export function setLastRead(productSlug: string, volumeSlug: string, chapter: number, totalChapters: number) {
  localStorage.setItem(LAST_READ_KEY, JSON.stringify({ productSlug, volumeSlug, chapter, totalChapters }));
}

export function getLastRead(language: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(LAST_READ_KEY) ?? "null");
    if (!saved?.productSlug) return null;
    const product = libraryProduct(language, saved.productSlug);
    const volume = product?.volumes.find((v) => v.slug === saved.volumeSlug);
    if (!product || !volume) return null;
    return {
      productSlug: saved.productSlug as string,
      volumeSlug: saved.volumeSlug as string,
      chapter: Number(saved.chapter) || 1,
      totalChapters: Number(saved.totalChapters) || 0,
      productTitle: product.title,
      volumeTitle: volume.title,
      progress: getVolumeProgress(saved.productSlug, saved.volumeSlug),
    };
  } catch {
    return null;
  }
}

// Crescimento do leitor: livros concluídos no total da biblioteca.
export function libraryStats() {
  let total = 0;
  let completed = 0;
  for (const product of PRODUCTS) {
    for (const volume of product.volumes) {
      total += 1;
      if (getVolumeProgress(product.slug, volume.slug) >= 100) completed += 1;
    }
  }
  return { total, completed };
}
