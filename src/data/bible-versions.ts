/* Versões da Bíblia por idioma (a página da Bíblia e o Dock usam a mesma lista). */
export const VERSIONS_BY_LANG: Record<string, { id: string; name: string }[]> = {
  // Versões brasileiras: a mesma lista do FC Brasil (fc-sermon/src/pages/BibliaPage.tsx), fonte bolls.life.
  // Decisão do dono (14/11/2026): um app só; o brasileiro volta ao bilíngue. Padrão pt-BR = ARA.
  "pt-BR": [
    { id: "ACF11", name: "ACF - Almeida Corrigida Fiel" },
    { id: "ARA", name: "ARA - Almeida Revista e Atualizada" },
    { id: "ARC09", name: "ARC - Almeida Revista e Corrigida" },
    { id: "ALM21", name: "AS21 - Almeida Século 21" },
    { id: "KJA", name: "KJA - King James Atualizada" },
    { id: "NAA", name: "NAA - Nova Almeida Atualizada" },
    { id: "NBV07", name: "NBV - Nova Bíblia Viva" },
    { id: "NTLH", name: "NTLH - Nova Tradução Ling. de Hoje" },
    { id: "NVIPT", name: "NVI - Nova Versão Internacional" },
    { id: "NVT", name: "NVT - Nova Versão Transformadora" },
    { id: "TB10", name: "TB - Tradução Brasileira" },
    { id: "VFL", name: "VFL - Versão Fácil de Ler" },
    { id: "MENS", name: "MENS - A Mensagem" },
    { id: "CNBB", name: "CNBB - Bíblia CNBB" },
    { id: "OL", name: "OL - O Livro" },
    { id: "NTJud", name: "NTJ - Novo Testamento Judaico" },
  ],
  "pt-PT": [
    { id: "OL", name: "OL - O Livro (Português Europeu)" },
    { id: "NVIPT", name: "NVI-PT - Nova Versão Internacional" },
  ],
  "en": [
    { id: "KJV", name: "KJV - King James Version" },
    { id: "NKJV", name: "NKJV - New King James Version" },
    { id: "NIV2011", name: "NIV - New International Version" },
    { id: "ESV", name: "ESV - English Standard Version" },
    { id: "NLT", name: "NLT - New Living Translation" },
    { id: "WEB", name: "WEB - World English Bible" },
    { id: "ASV", name: "ASV - American Standard Version" },
    { id: "YLT", name: "YLT - Young's Literal Translation" },
    { id: "MSG", name: "MSG - The Message" },
  ],
  "es": [
    { id: "RV1960", name: "RVR60 - Reina-Valera 1960" },
    { id: "RV2004", name: "RVG - Reina Valera Gómez 2004" },
    { id: "NVI", name: "NVI - Nueva Versión Internacional" },
    { id: "BTX3", name: "BTX3 - Biblia Textual 3ª Edición" },
    { id: "NTV", name: "NTV - Nueva Traducción Viviente" },
    { id: "PDT", name: "PDT - Palabra de Dios para Todos" },
    { id: "LBLA", name: "LBLA - La Biblia de las Américas" },
  ],
  "fr": [
    { id: "FRLSG", name: "LSG - Louis Segond 1910" },
    { id: "NBS", name: "NBS - Nouvelle Bible Segond" },
    { id: "FRPDV17", name: "PDV - Parole de Vie 2017" },
    { id: "BDS", name: "BDS - Bible du Semeur" },
    { id: "FRDBY", name: "DBY - Bible de Darby" },
  ],
  "it": [
    { id: "NR06", name: "NR06 - Nuova Riveduta 2006" },
  ],
  "de": [
    { id: "LUT", name: "LUT - Luther 1912" },
    { id: "S00", name: "SCH2000 - Schlachter 2000" },
    { id: "HFA", name: "HFA - Hoffnung für Alle" },
    { id: "ELB", name: "ELB - Elberfelder" },
  ],
};

export const DEFAULT_VERSION_BY_LANG: Record<string, string> = {
  "pt-BR": "ARA",
  "pt-PT": "OL",
  "en": "KJV",
  "es": "RV1960",
  "fr": "FRLSG",
  "it": "NR06",
  "de": "LUT",
};

/**
 * Idioma da interface → idioma da lista de versões.
 * pt-BR (ou pt_BR) tem lista própria; "pt" sem região e os outros lusófonos continuam em pt-PT.
 */
export function normalizeBibleLanguage(language: string): keyof typeof VERSIONS_BY_LANG {
  const normalized = language.toLowerCase().replace("_", "-");

  if (normalized === "pt-br" || normalized.startsWith("pt-br-")) return "pt-BR";
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("de")) return "de";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("it")) return "it";
  return "pt-PT";
}
