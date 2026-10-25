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
import { bogenDiff, FELD_GESAMTSTAERKE, type BogenDiff } from "@bos/meldekopf/meldung-diff";
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
  /** Was sich zwischen den Meldungen geändert hat („Personal 1 neu · …"); leer ohne Unterschied (R6-W2). */
  geaendert: string;
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

/** „…" mit höchstens 40 Zeichen. */
function kurzZitat(text: string): string {
  const t = text.trim();
  if (t === "" || t === "—") return "leer";
  return `„${t.length > 40 ? `${t.slice(0, 39).trimEnd()} …` : t}"`;
}

/**
 * Was sich zwischen den Meldungen ändert, mit Werten — dieselbe Art Angabe wie
 * die Quittung danach („Diesel 80 l → 100 l · Personal: 1 getauscht"). „3 Änderungen"
 * ließ offen, welche (Audit Runde 7, R7-W3, R7-N8). Leer ohne Unterschied.
 */
export function aenderungsText(d: BogenDiff, hoechstens = 4): string {
  if (d.anzahl === 0) return "";
  const teile: string[] = [];
  const gesamt = d.staerke.find((a) => a.feld === FELD_GESAMTSTAERKE);
  if (gesamt) teile.push(`Stärke ${gesamt.vorher} → ${gesamt.nachher}`);
  const tausch = Math.min(d.personalZugang.length, d.personalAbgang.length);
  const personal: string[] = [];
  if (tausch > 0) personal.push(`${tausch} getauscht`);
  if (d.personalZugang.length > tausch) personal.push(`${d.personalZugang.length - tausch} neu`);
  if (d.personalAbgang.length > tausch) personal.push(`${d.personalAbgang.length - tausch} weg`);
  if (d.personalGeaendert.length > 0) personal.push(`${d.personalGeaendert.length} geändert`);
  if (personal.length > 0) teile.push(`Personal: ${personal.join(", ")}`);
  const fz: string[] = [];
  if (d.fahrzeugeZugang.length > 0) fz.push(`${d.fahrzeugeZugang.length} dazu`);
  if (d.fahrzeugeAbgang.length > 0) fz.push(`${d.fahrzeugeAbgang.length} abgemeldet`);
  if (d.fahrzeugeGeaendert.length > 0) fz.push(`${d.fahrzeugeGeaendert.length} geändert`);
  if (fz.length > 0) teile.push(`Fahrzeuge: ${fz.join(", ")}`);
  for (const a of d.bedarf) if (a.feld !== "Unterbringung M/W/D" || !gesamt) teile.push(`${a.feld} ${a.vorher} → ${a.nachher}`);
  for (const a of d.sonstiges) {
    // Kurze Werte im Wortlaut (Einheit, Zeitraum), lange Freitexte nur mit Namen.
    const kurz = a.vorher.length <= 40 && a.nachher.length <= 40;
    teile.push(kurz ? `${a.feld}: ${kurzZitat(a.vorher)} → ${kurzZitat(a.nachher)}` : `${a.feld} geändert`);
  }
  if (teile.length === 0) return `${d.anzahl} ${d.anzahl === 1 ? "Änderung" : "Änderungen"}`;
  const gezeigt = teile.slice(0, hoechstens);
  const rest = teile.length - gezeigt.length;
  return gezeigt.join(" · ") + (rest > 0 ? ` · ${rest} weitere` : "");
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
  let geaendert = "";
  try {
    geaendert = aenderungsText(bogenDiff(bisher, neu));
  } catch {
    /* der Vergleich ist Zugabe – ohne ihn bleibt die Gegenüberstellung wie sie war */
  }
  return { bisher: steckbrief(bisher), neu: steckbrief(neu), keineUeberschneidung, geaendert };
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
