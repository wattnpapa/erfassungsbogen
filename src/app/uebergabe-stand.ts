/**
 * Wann wurde dieser Bogen zuletzt übergeben — und hat er sich seitdem geändert?
 *
 * Nach einer Übergabe sahen Startseite, Übersicht und Übergabe-Dialog genauso
 * aus wie vorher. Ob der Meldekopf die geänderte Stärke schon hat, musste der
 * Gruppenführer im Kopf behalten (Audit Runde 2, R2-W2). Der Stand wird mit dem
 * Entwurf gespeichert (entwurf.ts, `Entwurf.uebergabe`); er enthält keine
 * Personendaten, nur Zeitpunkt, Inhaltskennung und die Stärke als Zahlen.
 */
import { staerke, type Erfassungsbogen } from "@bos/eeb-format/model";
import { bogenInhaltsId, einheitSchluessel } from "@bos/meldekopf/einsaetze";

export interface UebergabeStand {
  /** Zeitpunkt der letzten Übergabe (Date.now()). */
  um: number;
  /** Inhaltskennung des übergebenen Bogens — gleich = unverändert. */
  id: string;
  /** Einheit, für die der Stand gilt: ein anderer Bogen hat keinen. */
  einheit: string;
  /** Stärke beim Übergeben, „F / UF / M / G". */
  staerke: string;
}

function staerkeText(b: Erfassungsbogen): string {
  const s = staerke(b);
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
}

/** Stand im Moment der Übergabe festhalten. */
export function uebergabeFesthalten(b: Erfassungsbogen, um = Date.now()): UebergabeStand {
  return { um, id: bogenInhaltsId(b), einheit: einheitSchluessel(b.einheit), staerke: staerkeText(b) };
}

/** Uhrzeit, bei anderem Tag mit Datum. */
function wann(um: number): string {
  const d = new Date(um);
  const uhr = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString()
    ? `${uhr} Uhr`
    : `${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}, ${uhr} Uhr`;
}

/**
 * Anzeige für Startseite und Übersicht. `null`: nie übergeben (oder der
 * Stand gehört zu einer anderen Einheit). `geaendert`: seit der Übergabe
 * geändert — dann steht „neu übergeben" im Text.
 */
export function uebergabeText(
  b: Erfassungsbogen,
  stand: UebergabeStand | null | undefined,
): { text: string; geaendert: boolean } | null {
  if (!stand || stand.einheit !== einheitSchluessel(b.einheit)) return null;
  if (stand.id === bogenInhaltsId(b)) {
    return { text: `Übergeben ${wann(stand.um)} — seitdem unverändert.`, geaendert: false };
  }
  const jetzt = staerkeText(b);
  const staerkeAenderung = jetzt !== stand.staerke ? ` (Stärke ${stand.staerke} → ${jetzt})` : "";
  return {
    text: `⚠ Seit der Übergabe ${wann(stand.um)} geändert${staerkeAenderung} — neu übergeben, damit der Meldekopf den Stand hat.`,
    geaendert: true,
  };
}
