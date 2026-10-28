/**
 * Notweg „Einsatz löschen“ bei vollem Speicher (R19-O3, R20-W1). Eigene Datei, die erst im Fall des Falles nachgeladen wird: Das Startbündel
 * trägt diese Rückfragen nicht (ADR-003, Aufnahmeregel 5).
 *
 * Der Papierkorb braucht selbst Platz; das Löschen scheiterte also gerade dann, wenn man Platz schaffen wollte. Der Hinweis „Nicht gelöscht“
 * bietet deshalb „Endgültig löschen…“ an (ohne Papierkorb, nicht rückholbar), aber nie mit einem Tipp: Der Hauptweg sichert zuerst (wenn es
 * noch keinen Export gibt), „Endgültig löschen…“ führt in eine zweite Rückfrage, die die Folge nennt, mit „Einsatz behalten“ als Fokus.
 */
import { einsatzEndgueltigLoeschen, type Einsatzsammlung } from "@bos/meldekopf/einsaetze";
import { frageJaNein, frageWahl } from "./dialoge";
import { PAPIERKORB_LEER_RAT } from "./speicher-fehler-text";

/** Liefert, ob der Einsatz endgültig gelöscht wurde (`gesichert` meldet einen Fehler beim Schreiben selbst). */
export async function notwegEndgueltig(
  s: Einsatzsammlung,
  o: {
    papierkorbLeer: boolean;
    keinExport: boolean;
    sichern?: () => unknown;
    gesichert: (titel: string, aktion: () => void) => Promise<boolean>;
  },
): Promise<boolean> {
  const wahl = await frageWahl({
    titel: "Nicht gelöscht",
    text: o.papierkorbLeer
      ? PAPIERKORB_LEER_RAT
      : `Der Speicher dieses Geräts ist voll, der Papierkorb braucht selbst Platz: „${s.name}" ist nicht gelöscht.`,
    abbruch: "Einsatz behalten",
    fokus: "abbruch",
    wege: [
      ...(o.keinExport && o.sichern
        ? [{ wert: "sichern", label: "Erst sichern (Sammel-PDF erzeugen)", sicher: true, kurz: "Es gibt noch keinen Export." }]
        : []),
      { wert: "endgueltig", label: "Endgültig löschen…", gefahr: true, kurz: "Schafft Platz, nicht rückholbar." },
    ],
  });
  if (wahl === "sichern") {
    await o.sichern?.();
    return false;
  }
  if (wahl !== "endgueltig") return false;
  const meldungen = s.eintraege.length;
  const sicher = await frageJaNein({
    titel: `„${s.name}" endgültig löschen?`,
    text:
      `${meldungen} Meldung${meldungen === 1 ? "" : "en"} sind danach weg — nicht im Papierkorb, nicht rückholbar.` +
      (o.keinExport ? " Es gibt noch keinen Export: das wäre die einzige Kopie." : ""),
    ok: "Ja, endgültig löschen",
    abbruch: "Einsatz behalten",
    gefahr: true,
    fokus: "abbruch",
  });
  return sicher && (await o.gesichert("Nicht gelöscht", () => einsatzEndgueltigLoeschen(s.id)));
}
