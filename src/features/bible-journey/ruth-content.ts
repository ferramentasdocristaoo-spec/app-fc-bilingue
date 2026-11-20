import type { JourneyChapter, JourneyLanguage } from "./types";

/**
 * Títulos, descrições e pergunta de reflexão dos 4 capítulos de Rute.
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA. Escrito a partir do texto bíblico de cada capítulo;
 * ainda sem revisão teológica nem de tradução. Português na norma brasileira.
 */
const titles: Record<JourneyLanguage, string[]> = {
  "pt-PT": ["Noemi e Rute voltam a Belém", "Rute colhe no campo de Boaz", "Rute na eira de Boaz", "Boaz resgata, e nasce Obede"],
  en: ["Naomi and Ruth return to Bethlehem", "Ruth gleans in Boaz's field", "Ruth at Boaz's threshing floor", "Boaz redeems, and Obed is born"],
  es: ["Noemí y Rut vuelven a Belén", "Rut espiga en el campo de Booz", "Rut en la era de Booz", "Booz redime y nace Obed"],
  fr: ["Noémi et Ruth reviennent à Bethléem", "Ruth glane dans le champ de Booz", "Ruth sur l'aire de Booz", "Booz rachète, et Obed naît"],
  it: ["Noemi e Rut tornano a Betlemme", "Rut spigola nel campo di Booz", "Rut sull'aia di Booz", "Booz riscatta e nasce Obed"],
  de: ["Noomi und Rut kehren nach Betlehem zurück", "Rut liest Ähren auf dem Feld des Boas", "Rut auf der Tenne des Boas", "Boas löst ein, und Obed wird geboren"],
};

const descriptions: Record<JourneyLanguage, string[]> = {
  "pt-PT": [
    "Depois da fome e de três mortes em Moabe, Noemi volta para Belém; Rute se recusa a deixá-la.",
    "Rute colhe espigas atrás dos ceifeiros e, sem saber, chega ao campo de Boaz, parente de Elimeleque.",
    "Seguindo o conselho de Noemi, Rute pede a Boaz que cumpra o papel de resgatador.",
    "Na porta da cidade, Boaz resgata a herança e se casa com Rute; o filho deles é avô de Davi.",
  ],
  en: [
    "After famine and three deaths in Moab, Naomi returns to Bethlehem; Ruth refuses to leave her.",
    "Ruth gleans behind the reapers and happens to come to the field of Boaz, a relative of Elimelech.",
    "Following Naomi's advice, Ruth asks Boaz to act as redeemer.",
    "At the city gate, Boaz redeems the inheritance and marries Ruth; their son is David's grandfather.",
  ],
  es: [
    "Tras el hambre y tres muertes en Moab, Noemí vuelve a Belén; Rut se niega a dejarla.",
    "Rut recoge espigas tras los segadores y, sin saberlo, llega al campo de Booz, pariente de Elimelec.",
    "Siguiendo el consejo de Noemí, Rut pide a Booz que cumpla su papel de redentor.",
    "En la puerta de la ciudad, Booz redime la heredad y se casa con Rut; su hijo es abuelo de David.",
  ],
  fr: [
    "Après la famine et trois deuils en Moab, Noémi revient à Bethléem ; Ruth refuse de la quitter.",
    "Ruth glane derrière les moissonneurs et arrive, sans le savoir, dans le champ de Booz, parent d'Élimélek.",
    "Sur le conseil de Noémi, Ruth demande à Booz d'exercer son droit de rachat.",
    "À la porte de la ville, Booz rachète l'héritage et épouse Ruth ; leur fils est le grand-père de David.",
  ],
  it: [
    "Dopo la carestia e tre lutti in Moab, Noemi torna a Betlemme; Rut rifiuta di lasciarla.",
    "Rut spigola dietro i mietitori e capita, senza saperlo, nel campo di Booz, parente di Elimèlec.",
    "Su consiglio di Noemi, Rut chiede a Booz di esercitare il diritto di riscatto.",
    "Alla porta della città, Booz riscatta l'eredità e sposa Rut; il loro figlio è il nonno di Davide.",
  ],
  de: [
    "Nach Hungersnot und drei Todesfällen in Moab kehrt Noomi nach Betlehem zurück; Rut will sie nicht verlassen.",
    "Rut liest hinter den Schnittern Ähren auf und kommt, ohne es zu wissen, auf das Feld des Boas, eines Verwandten Elimelechs.",
    "Auf Noomis Rat bittet Rut Boas, als Löser einzutreten.",
    "Im Tor der Stadt löst Boas das Erbe ein und heiratet Rut; ihr Sohn ist der Großvater Davids.",
  ],
};

const prompts: Record<JourneyLanguage, string> = {
  "pt-PT": "Como este capítulo mostra o cuidado fiel de Deus em meio às perdas e às escolhas do dia a dia?",
  en: "How does this chapter show God's faithful care in the midst of loss and everyday choices?",
  es: "¿Cómo muestra este capítulo el cuidado fiel de Dios en medio de las pérdidas y las decisiones de cada día?",
  fr: "Comment ce chapitre montre-t-il le soin fidèle de Dieu au milieu des pertes et des choix de chaque jour ?",
  it: "In che modo questo capitolo mostra la cura fedele di Dio in mezzo alle perdite e alle scelte di ogni giorno?",
  de: "Wie zeigt dieses Kapitel Gottes treue Fürsorge mitten in Verlust und alltäglichen Entscheidungen?",
};

const sectionSlugs = ["loss", "providence", "redeemer", "restoration"] as const;

export function buildRuthChapters(): JourneyChapter[] {
  return sectionSlugs.map((sectionSlug, index) => ({
    number: index + 1,
    sectionSlug,
    content: Object.fromEntries((Object.keys(titles) as JourneyLanguage[]).map(language => [language, {
      title: titles[language][index], description: descriptions[language][index], reflectionPrompt: prompts[language],
    }])) as JourneyChapter["content"],
  }));
}
