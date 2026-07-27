export type LibraryLanguage = "pt-PT" | "en" | "es" | "fr" | "it";

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
};

const OUTLINES_SUBTITLE: Localized = {
  "pt-PT": "30 esboços",
  en: "30 outlines",
  es: "30 bosquejos",
  fr: "30 plans",
  it: "30 schemi",
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
    },
    descriptions: {
      "pt-PT": "Uma coleção completa para compreender os principais acontecimentos e personagens do livro de Apocalipse.",
      en: "A complete collection to understand the main events and characters of the book of Revelation.",
      es: "Una colección completa para comprender los principales acontecimientos y personajes del libro de Apocalipsis.",
      fr: "Une collection complète pour comprendre les principaux événements et personnages du livre de l’Apocalypse.",
      it: "Una collezione completa per comprendere i principali avvenimenti e personaggi del libro dell’Apocalisse.",
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
    },
    descriptions: {
      "pt-PT": "Três volumes com 90 esboços de sermão — expositivos, temáticos e textuais — prontos para a preparação de mensagens.",
      en: "Three volumes with 90 sermon outlines — expository, topical and textual — ready for message preparation.",
      es: "Tres volúmenes con 90 bosquejos de sermón — expositivos, temáticos y textuales — listos para la preparación de mensajes.",
      fr: "Trois volumes avec 90 plans de sermon — expositifs, thématiques et textuels — prêts pour la préparation de messages.",
      it: "Tre volumi con 90 schemi di sermone — espositivi, tematici e testuali — pronti per la preparazione dei messaggi.",
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
    },
    descriptions: {
      "pt-PT": "Seis livros de formação ministerial: da vida espiritual do pregador à comunicação no púlpito.",
      en: "Six ministry-training books: from the preacher’s spiritual life to communication in the pulpit.",
      es: "Seis libros de formación ministerial: de la vida espiritual del predicador a la comunicación en el púlpito.",
      fr: "Six livres de formation ministérielle : de la vie spirituelle du prédicateur à la communication en chaire.",
      it: "Sei libri di formazione ministeriale: dalla vita spirituale del predicatore alla comunicazione dal pulpito.",
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
