/**
 * Zwei Meldungen derselben (oder einer ähnlich benannten) Einheit
 * gegenüberstellen — für die Rückfrage „Einheit ist bereits gemeldet".
 *
 * Die Rückfrage nannte nur den Namen und bot „Als neue Fassung anhängen" als
 * hervorgehobenen Normalfall an. Ob die neue Meldung eine Folgemeldung
 * derselben Gruppe oder eine zweite gleich benannte Gruppe ist, sah man erst
 * in der Quittung danach: Stärke, Führungskraft, Fahrzeuge (Audit Runde 4,
 * R4-N1). Diese Datei liefert die Gegenüberstellung und sagt, ob die beiden
 * Meldungen überhaupt eine Person oder ein Fahrzeug gemeinsam haben.
 */

import { staerke, type Erfassungsbogen } from "@bos/eeb-format/model";
import { zeitpunktDeutsch } from "./hilfen";

export interface MeldungsSteckbrief {
  /** „F / UF / M / Ges" */
  staerke: string;
  /** Erste Person der Liste (Ansprechperson), „Nachname, Vorname" — leer ohne Namen. */
  ansprechperson: string;
  /** Kennzeichen der Fahrzeuge, so weit eingetragen. */
  kennzeichen: string[];
  /** Stand der Meldung (Sender-Zeit). */
  stand: string;
}

export interface MeldungsVergleich {
  bisher: MeldungsSteckbrief;
  neu: MeldungsSteckbrief;
  /**
   * Beide Meldungen tragen Namen bzw. Kennzeichen, aber keinen einzigen
   * gemeinsam — eher eine andere Gruppe als eine Folgemeldung.
   */
  keineUeberschneidung: boolean;
}

function personName(p: { nachname: string; vorname: string }): string {
  return [p.nachname.trim(), p.vorname.trim()].filter(Boolean).join(", ");
}

function namensSchluessel(p: { nachname: string; vorname: string }): string {
  return `${p.nachname.trim().toLocaleLowerCase("de-DE")}|${p.vorname.trim().toLocaleLowerCase("de-DE")}`;
}

function kennzeichenSchluessel(k: string): string {
  return k.toLocaleUpperCase("de-DE").replace(/[^\p{L}\p{N}]/gu, "");
}

export function steckbrief(b: Erfassungsbogen): MeldungsSteckbrief {
  const s = staerke(b);
  const erste = b.personal.find((p) => personName(p));
  return {
    staerke: `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`,
    ansprechperson: erste ? personName(erste) : "",
    kennzeichen: b.fahrzeuge.map((f) => (f.kennzeichen ?? "").trim()).filter(Boolean),
    stand: zeitpunktDeutsch(b.stand),
  };
}

export function meldungenVergleichen(bisher: Erfassungsbogen, neu: Erfassungsbogen): MeldungsVergleich {
  const namenBisher = new Set(bisher.personal.filter((p) => personName(p)).map(namensSchluessel));
  const namenNeu = neu.personal.filter((p) => personName(p)).map(namensSchluessel);
  const kzBisher = new Set(bisher.fahrzeuge.map((f) => kennzeichenSchluessel(f.kennzeichen ?? "")).filter(Boolean));
  const kzNeu = neu.fahrzeuge.map((f) => kennzeichenSchluessel(f.kennzeichen ?? "")).filter(Boolean);
  // Nur urteilen, wo es etwas zu vergleichen gibt: Eine Meldung nur mit
  // Stärke (Schnellerfassung) hat keine Namen — das ist kein Widerspruch.
  const namenVergleichbar = namenBisher.size > 0 && namenNeu.length > 0;
  const kzVergleichbar = kzBisher.size > 0 && kzNeu.length > 0;
  const gemeinsamePerson = namenNeu.some((n) => namenBisher.has(n));
  const gemeinsamesFahrzeug = kzNeu.some((k) => kzBisher.has(k));
  const keineUeberschneidung =
    (namenVergleichbar || kzVergleichbar) &&
    !(namenVergleichbar && gemeinsamePerson) &&
    !(kzVergleichbar && gemeinsamesFahrzeug);
  return { bisher: steckbrief(bisher), neu: steckbrief(neu), keineUeberschneidung };
}

/** Eine Zeile der Gegenüberstellung: „Stärke 0 / 2 / 6 / 8 · Lehmann, Karsten · THW-84397 · Stand …". */
export function steckbriefZeile(s: MeldungsSteckbrief): string {
  return [
    `Stärke ${s.staerke}`,
    s.ansprechperson,
    s.kennzeichen.length > 0 ? s.kennzeichen.slice(0, 3).join(", ") + (s.kennzeichen.length > 3 ? " …" : "") : "",
    `Stand ${s.stand}`,
  ]
    .filter(Boolean)
    .join(" · ");
}
