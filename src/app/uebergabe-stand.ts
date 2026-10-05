/**
 * Wann wurde dieser Bogen zuletzt übergeben — und hat er sich seitdem geändert?
 *
 * Nach einer Übergabe sahen Startseite, Übersicht und Übergabe-Dialog genauso
 * aus wie vorher. Ob der Meldekopf die geänderte Stärke schon hat, musste der
 * Gruppenführer im Kopf behalten (Audit Runde 2, R2-W2). Der Stand wird mit dem
 * Entwurf gespeichert (entwurf.ts, `Entwurf.uebergabe`); er enthält keine
 * Personendaten, nur Zeitpunkt, Inhaltskennung, die Stärke als Zahlen und den
 * Weg.
 *
 * Ob die Gegenstelle etwas bekommen hat, kann die App offline nicht wissen.
 * Bis Runde 3 hieß jeder Weg „Übergeben … — seitdem unverändert", schon nach
 * einem kurzen Blick auf Teil 1 von 2 oder nach dem Herunterladen der PDF
 * (Audit Runde 3, R3-H3, R3-A7). Jetzt nennt der Vermerk, was passiert ist
 * („QR-Code gezeigt", „PDF erzeugt" …), und „Übergeben" erst nach einer
 * ausdrücklichen Bestätigung.
 */
import { staerke, type Erfassungsbogen } from "@bos/eeb-format/model";
import { bogenInhaltsId, einheitSchluessel } from "@bos/meldekopf/einsaetze";

/** Was mit dem Bogen geschah — nur das weiß die App, nicht ob er ankam. */
export type UebergabeWeg = "qr" | "pdf" | "link" | "kopiert" | "nah";

export interface UebergabeStand {
  /** Zeitpunkt der letzten Übergabe (Date.now()). */
  um: number;
  /** Weg der Übergabe; fehlt bei Ständen von vor Runde 3. */
  weg?: UebergabeWeg;
  /** Vom Nutzer bestätigt: die Gegenstelle hat den Bogen. */
  bestaetigt?: boolean;
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
export function uebergabeFesthalten(
  b: Erfassungsbogen,
  weg?: UebergabeWeg,
  bestaetigt = false,
  um = Date.now(),
): UebergabeStand {
  return {
    um,
    ...(weg ? { weg } : {}),
    ...(bestaetigt ? { bestaetigt: true } : {}),
    id: bogenInhaltsId(b),
    einheit: einheitSchluessel(b.einheit),
    staerke: staerkeText(b),
  };
}

/**
 * Neuer Vermerk nach einem Übergabeweg. Ein bestätigter Stand desselben,
 * unveränderten Bogens bleibt stehen: Eine PDF hinterher macht aus
 * „Übergeben ✓" nicht wieder „Empfang nicht bestätigt".
 */
export function uebergabeNachWeg(
  b: Erfassungsbogen,
  alt: UebergabeStand | null | undefined,
  weg: UebergabeWeg,
  bestaetigt = false,
  um = Date.now(),
): UebergabeStand {
  if (!bestaetigt && alt?.bestaetigt && uebergabeBestaetigen(b, alt)) return alt;
  return uebergabeFesthalten(b, weg, bestaetigt, um);
}

/**
 * Bestätigung nachreichen („Ist angekommen"): nur für denselben, seitdem
 * unveränderten Bogen — sonst bestätigte man einen Stand, den die
 * Gegenstelle nicht hat. Zeitpunkt bleibt der der Übergabe.
 */
export function uebergabeBestaetigen(b: Erfassungsbogen, stand: UebergabeStand | null | undefined): UebergabeStand | null {
  if (!stand || stand.einheit !== einheitSchluessel(b.einheit) || stand.id !== bogenInhaltsId(b)) return null;
  return { ...stand, bestaetigt: true };
}

/** Was geschah, als Satzanfang: „QR-Code gezeigt", „PDF erzeugt" … */
const EREIGNIS: Record<UebergabeWeg, string> = {
  qr: "QR-Code gezeigt",
  pdf: "PDF erzeugt",
  link: "Link geteilt",
  kopiert: "Link kopiert",
  nah: "An Gerät in der Nähe gesendet",
};

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
 * geändert — dann steht „neu übergeben" im Text. `offen`: unverändert, aber
 * der Empfang ist nicht bestätigt — dann bietet die Übersicht „Ist
 * angekommen" an.
 */
export function uebergabeText(
  b: Erfassungsbogen,
  stand: UebergabeStand | null | undefined,
): { text: string; geaendert: boolean; offen: boolean } | null {
  if (!stand || stand.einheit !== einheitSchluessel(b.einheit)) return null;
  const ereignis = stand.bestaetigt
    ? `Übergeben ${wann(stand.um)}`
    : stand.weg
      ? `${EREIGNIS[stand.weg]} ${wann(stand.um)}`
      : `Zuletzt weitergegeben ${wann(stand.um)}`;
  if (stand.id === bogenInhaltsId(b)) {
    return stand.bestaetigt
      ? { text: `✓ ${ereignis} (bestätigt) — seitdem unverändert.`, geaendert: false, offen: false }
      : { text: `${ereignis} — Empfang nicht bestätigt.`, geaendert: false, offen: true };
  }
  const jetzt = staerkeText(b);
  const staerkeAenderung = jetzt !== stand.staerke ? ` (Stärke ${stand.staerke} → ${jetzt})` : "";
  const seit = stand.bestaetigt ? `Seit der Übergabe ${wann(stand.um)}` : `Nach „${ereignis}“`;
  return {
    text: `⚠ ${seit} geändert${staerkeAenderung} — neu übergeben, damit der Meldekopf den Stand hat.`,
    geaendert: true,
    offen: false,
  };
}
