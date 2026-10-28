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
import { speicherBelegung } from "./eintrag-zeiten";
import { loeschenUmfangText } from "./einsatz-geloescht";
import { geltendeJeEinheit } from "./fassung-vorrang";

/**
 * Text von „Nicht gelöscht" (R21-H7, N7): ein Satz, was nicht geschah und warum (mit der Belegung), ein Satz, was jetzt zu tun ist.
 * Er nennt nur die Knöpfe, die darunter stehen: „Erst sichern" (oder auf der Startseite „Einsatz öffnen und sichern"), „Endgültig
 * löschen…" und „Einsatz behalten".
 */
export function notwegText(name: string, belegung: number | null, sichern: boolean, startseite: boolean): string {
  const prozent = belegung == null ? "" : ` (zu ${Math.round(belegung * 100)} % belegt)`;
  const weg = sichern
    ? startseite
      ? "Erst den Einsatz öffnen und sichern, dann „Endgültig löschen…“ (nicht rückholbar)."
      : "Erst sichern, dann „Endgültig löschen…“ (nicht rückholbar)."
    : "„Endgültig löschen…“ schafft Platz (nicht rückholbar).";
  return `„${name}" ist nicht gelöscht: Der Speicher dieses Geräts ist voll${prozent}, der Papierkorb braucht selbst Platz. ${weg}`;
}

/** Liefert, ob der Einsatz endgültig gelöscht wurde (`gesichert` meldet einen Fehler beim Schreiben selbst). */
export async function notwegEndgueltig(
  s: Einsatzsammlung,
  o: {
    papierkorbLeer: boolean;
    keinExport: boolean;
    sichern?: () => unknown;
    /** Auf der Startseite gibt es das Sammel-PDF nicht: Der Weg heißt dort „Einsatz öffnen und sichern" (R21-W6). */
    startseite?: boolean;
    gesichert: (titel: string, aktion: () => void) => Promise<boolean>;
  },
): Promise<boolean> {
  const sichernAngeboten = o.keinExport && !!o.sichern;
  const wahl = await frageWahl({
    titel: "Nicht gelöscht",
    text: notwegText(s.name, speicherBelegung()?.anteil ?? null, sichernAngeboten, !!o.startseite),
    abbruch: "Einsatz behalten",
    fokus: "abbruch",
    wege: [
      ...(sichernAngeboten
        ? [
            o.startseite
              ? { wert: "sichern", label: "Einsatz öffnen und sichern", sicher: true, kurz: "Dort „Einsatz weitergeben / sichern“." }
              : { wert: "sichern", label: "Erst sichern (Sammel-PDF erzeugen)", sicher: true, kurz: "Es gibt noch keinen Export." },
          ]
        : []),
      { wert: "endgueltig", label: "Endgültig löschen…", gefahr: true, kurz: "Schafft Platz, nicht rückholbar." },
    ],
  });
  if (wahl === "sichern") {
    await o.sichern?.();
    return false;
  }
  if (wahl !== "endgueltig") return false;
  const sicher = await frageJaNein({
    titel: `„${s.name}" endgültig löschen?`,
    text:
      `${loeschenUmfangText(geltendeJeEinheit(s.eintraege).length, s.eintraege.length)} sind danach weg — nicht im Papierkorb, nicht rückholbar.` +
      (o.keinExport ? " Es gibt noch keinen Export: das wäre die einzige Kopie." : ""),
    ok: "Ja, endgültig löschen",
    abbruch: "Einsatz behalten",
    gefahr: true,
    fokus: "abbruch",
  });
  return sicher && (await o.gesichert("Nicht gelöscht", () => einsatzEndgueltigLoeschen(s.id)));
}
