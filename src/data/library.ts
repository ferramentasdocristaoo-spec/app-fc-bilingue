export type LibraryLanguage = "pt-PT" | "en" | "es" | "fr" | "it";

export const LIBRARY_PRODUCT_SLUG = "apocalipse-revelado";

const TITLES: Record<LibraryLanguage, string[]> = {
  "pt-PT": ["A Besta e o Falso Profeta", "Os Quatro Cavaleiros", "A Grande Tribulação", "A Grande Prostituta", "As Sete Trombetas", "A Mulher Vestida de Sol", "O Anticristo", "A Nova Jerusalém"],
  en: ["The Beast and the False Prophet", "The Four Horsemen", "The Great Tribulation", "The Great Prostitute", "The Seven Trumpets", "The Woman Clothed with the Sun", "The Antichrist", "The New Jerusalem"],
  es: ["La Bestia y el Falso Profeta", "Los Cuatro Jinetes", "La Gran Tribulación", "La Gran Prostituta", "Las Siete Trompetas", "La Mujer Vestida del Sol", "El Anticristo", "La Nueva Jerusalén"],
  fr: ["La Bête et le Faux Prophète", "Les Quatre Cavaliers", "La Grande Tribulation", "La Grande Prostituée", "Les Sept Trompettes", "La Femme Revêtue du Soleil", "L’Antéchrist", "La Nouvelle Jérusalem"],
  it: ["La Bestia e il Falso Profeta", "I Quattro Cavalieri", "La Grande Tribolazione", "La Grande Prostituta", "Le Sette Trombe", "La Donna Vestita di Sole", "L’Anticristo", "La Nuova Gerusalemme"],
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
    volumes: TITLES[lang].map((title, index) => ({
      slug: `volume-${index + 1}`,
      number: index + 1,
      title,
    })),
  };
}
