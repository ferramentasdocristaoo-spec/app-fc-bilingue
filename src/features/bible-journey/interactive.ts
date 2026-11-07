import { exodusInteractive } from "./exodus-interactive";
import { genesisInteractive, type JourneyFigure, type JourneyInteractiveSection } from "./genesis-interactive";

export interface JourneyInteractiveBook {
  sections: Record<string, JourneyInteractiveSection>;
  /** Movimentos sem datas formam a zona "história primordial" (só Génesis 1–11). */
  primeval: boolean;
  zoneKey: string;
  noteKey: string;
  nextKey: string;
}

export const journeyInteractiveBooks: Record<string, JourneyInteractiveBook> = {
  genesis: { sections: genesisInteractive, primeval: true, zoneKey: "journey.timePatriarchs", noteKey: "journey.timeNote", nextKey: "journey.nextBook" },
  exodus: { sections: exodusInteractive, primeval: false, zoneKey: "journey.timeExodus", noteKey: "journey.timeNoteExodus", nextKey: "journey.nextBookExodus" },
};

export const getJourneyInteractive = (bookSlug: string, sectionSlug: string): JourneyInteractiveSection | undefined =>
  journeyInteractiveBooks[bookSlug]?.sections[sectionSlug];

/** Todas as gravuras de domínio público usadas na Jornada (página Fontes e licenças). */
export const journeyPublicDomainFigures = (): JourneyFigure[] =>
  Object.values(journeyInteractiveBooks).flatMap(book => Object.values(book.sections).flatMap(section => section.figure ? [section.figure] : []));
