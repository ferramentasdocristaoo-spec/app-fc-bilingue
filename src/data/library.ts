export type LibraryLanguage = "pt-PT" | "en" | "es" | "fr" | "it";

export const LIBRARY_PRODUCT_SLUG = "apocalipse-revelado";

// Volumes na ordem narrativa do livro de Apocalipse.
// O slug identifica o conteúdo no banco e não muda com a reordenação.
const VOLUMES: { slug: string; ref: string; titles: Record<LibraryLanguage, string> }[] = [
  {
    slug: "volume-2",
    ref: "6",
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
    ref: "7",
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
    ref: "8–11",
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
    ref: "12",
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
    ref: "13",
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
    ref: "13",
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
    ref: "17–18",
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
    ref: "21–22",
    titles: {
      "pt-PT": "A Nova Jerusalém",
      en: "The New Jerusalem",
      es: "La Nueva Jerusalén",
      fr: "La Nouvelle Jérusalem",
      it: "La Nuova Gerusalemme",
    },
  },
];

const REF_BOOK: Record<LibraryLanguage, string> = {
  "pt-PT": "Apocalipse",
  en: "Revelation",
  es: "Apocalipsis",
  fr: "Apocalypse",
  it: "Apocalisse",
};

const PRODUCT_TITLE: Record<LibraryLanguage, string> = {
  "pt-PT": "Apocalipse Revelado",
  en: "Revelation Revealed",
  es: "Apocalipsis Revelado",
  fr: "L’Apocalypse Révélée",
  it: "Apocalisse Rivelata",
};

export function libraryLanguage(language: string): LibraryLanguage {
  const lang = language.toLowerCase();
  if (lang.startsWith("en")) return "en";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("it")) return "it";
  return "pt-PT";
}

export function libraryProduct(language: string) {
  const lang = libraryLanguage(language);
  return {
    slug: LIBRARY_PRODUCT_SLUG,
    title: PRODUCT_TITLE[lang],
    volumes: VOLUMES.map((volume, index) => ({
      slug: volume.slug,
      number: index + 1,
      ref: `${REF_BOOK[lang]} ${volume.ref}`,
      title: volume.titles[lang],
    })),
  };
}

export const LIBRARY_VOLUME_COUNT = VOLUMES.length;

// Progresso de leitura (por volume e agregado do produto), em localStorage.
const volumeProgressKey = (volumeSlug: string) =>
  `library-progress-vol:${LIBRARY_PRODUCT_SLUG}:${volumeSlug}`;

export function getVolumeProgress(volumeSlug: string): number {
  return Number(localStorage.getItem(volumeProgressKey(volumeSlug)) || 0);
}

export function setVolumeProgress(volumeSlug: string, percent: number) {
  const current = getVolumeProgress(volumeSlug);
  const next = Math.max(current, Math.min(100, Math.round(percent)));
  localStorage.setItem(volumeProgressKey(volumeSlug), String(next));
  const total = VOLUMES.reduce((sum, v) => sum + getVolumeProgress(v.slug), 0);
  localStorage.setItem(
    `library-progress:${LIBRARY_PRODUCT_SLUG}`,
    String(Math.round(total / VOLUMES.length)),
  );
}
