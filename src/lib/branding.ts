import logoPt from "@/assets/logo-pt.png";
import logoEn from "@/assets/logo-en.png";
import logoEs from "@/assets/logo-es.png";
import logoFr from "@/assets/logo-fr.png";
import logoIt from "@/assets/logo-it.png";
import logoDe from "@/assets/logo-de.png";

// O app se chama de forma diferente em cada idioma, e cada nome tem
// sua própria logo com as iniciais correspondentes.
const LOGOS: Record<string, string> = {
  pt: logoPt, // Ferramentas do Cristão
  en: logoEn, // Christian Tools
  es: logoEs, // Herramientas del Cristiano
  fr: logoFr, // Outils du Chrétien
  it: logoIt, // Strumenti del Cristiano
  de: logoDe, // Werkzeuge des Christen
};

export function appLogo(language: string): string {
  return LOGOS[language.toLowerCase().split("-")[0]] ?? logoPt;
}
