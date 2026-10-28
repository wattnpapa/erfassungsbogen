/**
 * Meldung, wenn ein Bogen nicht auf der Startseite abgelegt werden konnte (Speicher voll, R20-D1). Eigene Datei, die erst im Fall
 * des Falles nachgeladen wird: Das Startbündel trägt diesen Text nicht (ADR-003, Aufnahmeregel 5).
 */
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { frageWahl } from "./dialoge";
import { bogenSpeichern, einheitAnzeigename } from "./hilfen";

/**
 * Der Bogen bleibt offen, nichts hat sich geändert. Der sichere Ausweg ist die Datei; erst danach lohnt es sich, Platz zu schaffen.
 * `was`: „geschlossen“, „ersetzt“, „zurückgeholt“, „beendet“.
 */
export async function ablageVollMelden(b: Erfassungsbogen, was: string): Promise<void> {
  const name = einheitAnzeigename(b.einheit) || "(noch ohne Namen)";
  const wahl = await frageWahl({
    titel: `Nicht ${was} — Speicher voll`,
    text: `„${name}" passt nicht mehr auf die Startseite. Der Bogen bleibt offen, nichts hat sich geändert. Erst als Datei sichern, dann Platz schaffen.`,
    abbruch: "Bogen bleibt offen",
    fokus: "abbruch",
    wege: [{ wert: "sichern", label: "Bogen als Datei sichern", sicher: true }],
  });
  if (wahl === "sichern") await bogenSpeichern(b);
}
