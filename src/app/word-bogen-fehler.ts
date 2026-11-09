/**
 * Fehler beim Lesen eines THW-Word-Erfassungsbogens (.docx).
 *
 * Eigene Datei, damit `datei-fehler.ts` die Meldung erkennt, ohne den Leser
 * (`word-bogen.ts`, nur nachgeladen) ins Startbündel zu ziehen. Der Text ist
 * immer ein ganzer Satz für den Meldekopf, nie Parser-Text.
 */
export class WordBogenFehler extends Error {
  constructor(meldung: string) {
    super(meldung);
    this.name = "WordBogenFehler";
  }
}

/** Ist die Datei ein Word-Dokument (.docx/.dotx/.docm oder alte .doc)? Endung ODER MIME-Typ. */
export function istWordDatei(datei: Pick<File, "name" | "type">): boolean {
  const name = datei.name.toLowerCase();
  return (
    /\.(docx|dotx|docm|doc)$/.test(name) ||
    datei.type === "application/msword" ||
    datei.type.startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml")
  );
}

/** Was die Dateifelder für Word-Bögen vorschlagen. */
export const WORD_DATEI_ARTEN = ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
