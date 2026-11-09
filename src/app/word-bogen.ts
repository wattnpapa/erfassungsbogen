/**
 * Import ausgefüllter THW-Word-Erfassungsbögen (.docx aus den Vorlagen
 * `06-*_Erfassungsbogen.dotx`).
 *
 * Grundlage und Feldtabelle: docs/thw-word-vorlagen.md. Die Vorlagen tragen
 * klassische Word-Formularfelder (`w:ffData` mit `w:name`), in allen 44
 * Vorlagen gleich benannt. Der Wert eines Textfelds ist der Text zwischen
 * `fldChar separate` und `fldChar end`, ein Kästchen steht als `w:checked`.
 *
 * Ablauf: ZIP öffnen → `word/document.xml` entpacken (pako, begrenzt) →
 * mit DOMParser lesen → Felder einsammeln → auf das Modell abbilden. Was sich
 * nicht zuordnen lässt, landet in `sonstiges`, damit nichts stillschweigend
 * verloren geht; die Quittung sagt, was übernommen und was verworfen wurde.
 *
 * Nur nachgeladen (app.tsx), damit der Leser nicht im Startbündel steckt.
 */

import {
  Fahrerlaubnis,
  KontaktArt,
  MINUTEN_JE_TAG,
  OrganisationsTyp,
  StaerkeRolle,
  datumAusIso,
  staerke,
  type Erfassungsbogen,
  type Fahrzeug,
  type Funkrufname,
  type HierarchieEbene,
  type Kontakt,
  type Person,
  type Sofortbedarf,
  type VokabularWert,
} from "@bos/eeb-format/model";
import {
  FUNKRUF_KENNWOERTER,
  THW_EINHEITSTYPEN,
  THW_FAHRZEUGTYPEN,
  THW_FUNKTIONEN_ALLE,
  THW_HIERARCHIE_EBENEN,
  type VokabularEintrag,
} from "@bos/vokabulare/thw";
import { inflateRawBegrenzt, neuePerson, neuerBogen } from "./hilfen";
import { WordBogenFehler } from "./word-bogen-fehler";

/** Größte Word-Datei, die gelesen wird. Ein ausgefüllter Bogen hat rund 100 KB; Fotos im Dokument machen ihn größer. */
export const MAX_WORD_DATEI = 25 * 1024 * 1024;
/** Größte entpackte `word/document.xml`. Die Vorlagen liegen entpackt unter 1 MB. */
export const MAX_DOCUMENT_XML = 8 * 1024 * 1024;

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

// ------------------------------------------------------------------ ZIP lesen

/**
 * Eine Datei aus einem ZIP-Archiv holen (nur „stored“ und „deflate“, kein
 * ZIP64, keine Verschlüsselung — mehr schreibt Word nicht). Liefert null,
 * wenn der Eintrag fehlt. Wirft WordBogenFehler bei kaputtem Archiv.
 */
export function zipEintrag(bytes: Uint8Array, gesucht: string, grenze = MAX_DOCUMENT_XML): Uint8Array | null {
  const kaputt = () =>
    new WordBogenFehler("Die Word-Datei ist beschädigt oder unvollständig. Bitte in Word öffnen und erneut als .docx speichern.");
  const sicht = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (o: number) => sicht.getUint16(o, true);
  const u32 = (o: number) => sicht.getUint32(o, true);
  // Ende des Zentralverzeichnisses: von hinten suchen (dahinter höchstens 64 KB Kommentar).
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (u32(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw kaputt();
  const anzahl = u16(eocd + 10);
  let stelle = u32(eocd + 16);
  if (stelle === 0xffffffff || anzahl === 0xffff) throw kaputt(); // ZIP64
  const decoder = new TextDecoder();
  for (let n = 0; n < anzahl; n++) {
    if (stelle + 46 > bytes.length || u32(stelle) !== 0x02014b50) throw kaputt();
    const flags = u16(stelle + 8);
    const methode = u16(stelle + 10);
    const gepackt = u32(stelle + 20);
    const nameLaenge = u16(stelle + 28);
    const extraLaenge = u16(stelle + 30);
    const kommentarLaenge = u16(stelle + 32);
    const lokal = u32(stelle + 42);
    const name = decoder.decode(bytes.subarray(stelle + 46, stelle + 46 + nameLaenge));
    stelle += 46 + nameLaenge + extraLaenge + kommentarLaenge;
    if (name !== gesucht) continue;
    if (flags & 1) {
      throw new WordBogenFehler("Die Word-Datei ist mit einem Kennwort geschützt. Bitte ohne Kennwort speichern und erneut einlesen.");
    }
    if (lokal + 30 > bytes.length || u32(lokal) !== 0x04034b50) throw kaputt();
    const start = lokal + 30 + u16(lokal + 26) + u16(lokal + 28);
    if (start + gepackt > bytes.length) throw kaputt();
    const daten = bytes.subarray(start, start + gepackt);
    if (methode === 0) {
      if (daten.length > grenze) throw kaputt();
      return daten;
    }
    if (methode !== 8) throw kaputt();
    try {
      return inflateRawBegrenzt(daten, grenze);
    } catch {
      throw kaputt();
    }
  }
  return null;
}

// --------------------------------------------------------- Formularfelder lesen

/** Ein Formularfeld der Vorlage, wie Word es gespeichert hat. */
export interface WordFeld {
  name: string;
  /** Angezeigter Text (Textfelder); bei Kästchen leer. */
  text: string;
  /** Nur Kästchen: angekreuzt? */
  angekreuzt?: boolean;
  /** Fester Text der Tabellenzelle vor dem Feld (für die Funktionen der Personalzeilen). */
  davor: string;
}

function wAttr(el: Element, name: string): string | null {
  return el.getAttributeNS(W_NS, name) ?? el.getAttribute(`w:${name}`);
}

function kind(el: Element, lokal: string): Element | undefined {
  for (const k of Array.from(el.children)) if (k.localName === lokal) return k;
  return undefined;
}

function wahr(el: Element | undefined): boolean | undefined {
  if (!el) return undefined;
  const v = wAttr(el, "val");
  return v == null || !/^(0|false|off)$/i.test(v);
}

/** Text eines Bereichs ohne die Ergebnisse von Feldern (der feste Text der Vorlage), bis `bis` (exklusiv). */
function festerText(bereich: Element, bis?: Element): string {
  let tiefe = 0;
  let text = "";
  for (const el of Array.from(bereich.getElementsByTagName("*"))) {
    if (el === bis) break;
    if (el.namespaceURI !== W_NS) continue;
    if (el.localName === "fldChar") {
      const typ = wAttr(el, "fldCharType");
      if (typ === "begin") tiefe++;
      else if (typ === "end") tiefe = Math.max(0, tiefe - 1);
    } else if (el.localName === "t" && tiefe === 0) text += el.textContent ?? "";
    else if (el.localName === "tab" && tiefe === 0) text += " ";
  }
  return text;
}

function vorfahr(el: Element, lokal: string): Element | null {
  for (let p = el.parentElement; p; p = p.parentElement) if (p.localName === lokal) return p;
  return null;
}

/** Text vor dem Feld in derselben Tabellenzelle; ist der leer, der Text der Zelle links daneben. */
function textDavor(begin: Element): string {
  const zelle = vorfahr(begin, "tc");
  if (!zelle) return "";
  const eigen = festerText(zelle, begin).trim();
  if (eigen) return eigen;
  let links = zelle.previousElementSibling;
  while (links && links.localName !== "tc") links = links.previousElementSibling;
  return links ? festerText(links).trim() : "";
}

/** Word füllt leere Textfelder mit fünf Halbgeviert-Leerzeichen; die und Mehrfach-Leerzeichen entfernen. */
function saeubern(s: string): string {
  return s
    .replace(/[     ]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

/** Alle Formularfelder aus `word/document.xml`, in Dokumentreihenfolge. */
export function wordFelderLesen(xml: string): WordFeld[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new WordBogenFehler("Der Inhalt der Word-Datei ist unlesbar. Bitte in Word öffnen und erneut als .docx speichern.");
  }
  interface Offen {
    name: string;
    imErgebnis: boolean;
    text: string;
    angekreuzt?: boolean;
    begin: Element;
  }
  const stapel: Offen[] = [];
  const felder: WordFeld[] = [];
  for (const el of Array.from(doc.getElementsByTagName("*"))) {
    if (el.namespaceURI !== W_NS) continue;
    const oben = stapel[stapel.length - 1];
    switch (el.localName) {
      case "fldChar": {
        const typ = wAttr(el, "fldCharType");
        if (typ === "begin") {
          const ff = kind(el, "ffData");
          const nameEl = ff && kind(ff, "name");
          const box = ff && kind(ff, "checkBox");
          stapel.push({
            name: (nameEl && wAttr(nameEl, "val")) ?? "",
            imErgebnis: false,
            text: "",
            angekreuzt: box ? (wahr(kind(box, "checked")) ?? wahr(kind(box, "default")) ?? false) : undefined,
            begin: el,
          });
        } else if (typ === "separate" && oben) {
          oben.imErgebnis = true;
        } else if (typ === "end" && oben) {
          stapel.pop();
          if (oben.name) {
            felder.push({
              name: oben.name,
              text: saeubern(oben.text),
              ...(oben.angekreuzt != null ? { angekreuzt: oben.angekreuzt } : {}),
              davor: saeubern(textDavor(oben.begin)),
            });
          }
        }
        break;
      }
      case "t":
        if (oben?.imErgebnis) oben.text += el.textContent ?? "";
        break;
      case "tab":
        if (oben?.imErgebnis) oben.text += " ";
        break;
      case "br":
      case "cr":
        if (oben?.imErgebnis) oben.text += "\n";
        break;
    }
  }
  return felder;
}

// ------------------------------------------------------------ Hilfen Abbildung

/** Vergleichsform: klein, ohne Punkte, Leerzeichen vereinheitlicht. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Vokabular-Eintrag zu einem Text: Kurzform oder Name, nach Vereinheitlichung gleich. */
function imVokabular(text: string, liste: VokabularEintrag[]): VokabularEintrag | undefined {
  const t = norm(text);
  if (!t) return undefined;
  return liste.find((e) => norm(e.kurz) === t) ?? liste.find((e) => norm(e.name) === t);
}

/** Abkürzungen der Vorlage auf die Langform des Vokabulars bringen („FGr Kommunikation (A)“ → „Fachgruppe Kommunikation (A)“). */
function einheitstypLangform(text: string): string {
  return text
    .replace(/^FGr\.?\s+/i, "Fachgruppe ")
    .replace(/^ZTr\.?\s+/i, "Zugtrupp ")
    .replace(/^Tr\.?\s+/i, "Trupp ");
}

/** Kurzformen der Funktionen, wie sie als fester Text in den Personalzeilen stehen. */
const FUNKTION_AUS_VORLAGE: Record<string, { code?: number; rolle: StaerkeRolle; freitext?: string }> = {
  zfü: { code: 1, rolle: StaerkeRolle.FUEHRER },
  ztrfü: { code: 2, rolle: StaerkeRolle.UNTERFUEHRER },
  grfü: { code: 3, rolle: StaerkeRolle.UNTERFUEHRER },
  trfü: { code: 4, rolle: StaerkeRolle.UNTERFUEHRER },
  he: { code: 5, rolle: StaerkeRolle.MANNSCHAFT },
  sgl: { code: 7, rolle: StaerkeRolle.FUEHRER },
  psfk: { code: 12, rolle: StaerkeRolle.UNTERFUEHRER },
  psf: { code: 12, rolle: StaerkeRolle.UNTERFUEHRER },
  peer: { code: 13, rolle: StaerkeRolle.MANNSCHAFT },
  // „Erfassungsbogen Sonstige“: Führungskraft ohne StAN-Funktion — Freitext, Stärke als Unterführer.
  fükr: { rolle: StaerkeRolle.UNTERFUEHRER, freitext: "FüKr" },
};

/** Funktion aus dem festen Text vor `…_Zusatzf` („GrFü /“, „He /“). */
function grundfunktion(davor: string): { wert?: VokabularWert; rolle?: StaerkeRolle } {
  const text = davor.replace(/\/\s*$/, "").trim();
  if (!text) return {};
  // Nur der letzte Teil zählt — davor kann eine Spaltenbeschriftung stehen.
  const letzt = text.split(/\s+/).pop() ?? text;
  const bekannt = FUNKTION_AUS_VORLAGE[norm(letzt)] ?? FUNKTION_AUS_VORLAGE[norm(text)];
  if (bekannt) return { wert: bekannt.code != null ? { code: bekannt.code } : { freitext: bekannt.freitext }, rolle: bekannt.rolle };
  const imVok = imVokabular(text, THW_FUNKTIONEN_ALLE) ?? imVokabular(letzt, THW_FUNKTIONEN_ALLE);
  return { wert: imVok ? { code: imVok.code } : { freitext: text } };
}

const KLASSEN: Record<string, Fahrerlaubnis> = {
  am: Fahrerlaubnis.AM, a1: Fahrerlaubnis.A1, a2: Fahrerlaubnis.A2, a: Fahrerlaubnis.A, b: Fahrerlaubnis.B,
  be: Fahrerlaubnis.BE, c1: Fahrerlaubnis.C1, c1e: Fahrerlaubnis.C1E, c: Fahrerlaubnis.C, ce: Fahrerlaubnis.CE,
  d1: Fahrerlaubnis.D1, d1e: Fahrerlaubnis.D1E, d: Fahrerlaubnis.D, de: Fahrerlaubnis.DE,
};

/**
 * Zusatzfunktionen („Spr, SanHe“, „Kf CE“): bekannte über das Vokabular,
 * Fahrerlaubnis aus „Kf <Klasse>“ (oder einer eindeutigen Klasse wie „CE“),
 * der Rest als Freitext.
 */
function zusatzfunktionen(text: string): { funktionen: VokabularWert[]; fahrerlaubnis: Fahrerlaubnis } {
  const funktionen: VokabularWert[] = [];
  let fahrerlaubnis = Fahrerlaubnis.NONE;
  for (const teil of text.split(/[,;+\n]|\s\/\s/).map((s) => s.trim()).filter(Boolean)) {
    const kf = /^(?:kf|kl\.?|klasse)\s*([a-d][1e]?e?)?$/i.exec(teil) ?? /^(be|c1e?|ce|d1e?|de)$/i.exec(teil);
    if (kf) {
      const klasse = kf[1] ? KLASSEN[kf[1].toLowerCase()] : undefined;
      if (klasse != null) {
        fahrerlaubnis = Math.max(fahrerlaubnis, klasse);
        continue;
      }
    }
    const v = imVokabular(teil, THW_FUNKTIONEN_ALLE);
    funktionen.push(v ? { code: v.code } : { freitext: teil });
  }
  return { funktionen, fahrerlaubnis };
}

/** „Muster, Max“ → Nachname/Vorname; ohne Komma steht alles im Nachnamen (die Reihenfolge ist nicht erzwungen). */
function nameTeilen(text: string): { nachname: string; vorname: string } {
  const i = text.indexOf(",");
  if (i < 0) return { nachname: text.trim(), vorname: "" };
  return { nachname: text.slice(0, i).trim(), vorname: text.slice(i + 1).trim() };
}

/** Rufnummer → nur Ziffern; „+49“ wird zur führenden Null. */
function rufnummer(text: string): string {
  const t = text.trim().replace(/^\+49/, "0").replace(/^0049/, "0");
  return t.replace(/\D/g, "");
}

/** Zahl aus einem Textfeld („12“, „ca. 200“, „1.500“, „12,5“ → gerundet); keine Zahl → undefined. */
function zahl(text: string): number | undefined {
  const m = /\d[\d.]*(?:,\d+)?/.exec(text);
  if (!m) return undefined;
  const n = Number(m[0].replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

function datumAusTeilen(t: string, m: string, j: string | undefined, bezugsjahr: number): number | undefined {
  const tag = Number(t);
  const monat = Number(m);
  let jahr = j ? Number(j) : bezugsjahr;
  if (j && j.length <= 2) jahr += 2000;
  if (monat < 1 || monat > 12 || tag < 1 || tag > 31) return undefined;
  const d = new Date(Date.UTC(jahr, monat - 1, tag));
  if (d.getUTCMonth() !== monat - 1) return undefined;
  return datumAusIso(d.toISOString().slice(0, 10));
}

const DATUM = /(\d{1,2})\.(\d{1,2})\.(\d{2}(?:\d{2})?)?/g;

/** „1.1.25 - 31.12.27“, „12.03.2026“, „12.3.–14.3.26“ → Tage; sonst undefined. */
export function zeitraumLesen(text: string, heute: number): { von: number; bis: number } | undefined {
  const bezug = new Date(Date.UTC(2020, 0, 1) + heute * 86_400_000).getUTCFullYear();
  const treffer = [...text.matchAll(DATUM)];
  if (treffer.length === 0) return undefined;
  const letztesJahr = treffer[treffer.length - 1]![3];
  const tage = treffer.map((m) => datumAusTeilen(m[1]!, m[2]!, m[3] ?? letztesJahr, bezug));
  const von = tage[0];
  const bis = tage.length > 1 ? tage[tage.length - 1] : von;
  if (von == null || bis == null || bis < von) return undefined;
  return { von, bis };
}

/** „4:12“, „04:12 Uhr“, „12.3.26 8:00“ → Zeitpunkt; ohne Datum am Tag `tag`. Liefert auch, ob ein Datum dabeistand. */
export function zeitpunktLesen(text: string, tag: number, heute: number): { zeitpunkt: number; mitDatum: boolean } | undefined {
  const uhr = /(\d{1,2})[:h](\d{2})/.exec(text);
  const bezug = new Date(Date.UTC(2020, 0, 1) + heute * 86_400_000).getUTCFullYear();
  const d = [...text.matchAll(DATUM)][0];
  const datum = d ? datumAusTeilen(d[1]!, d[2]!, d[3], bezug) : undefined;
  if (!uhr && datum == null) return undefined;
  let minuten = 0;
  if (uhr) {
    const h = Number(uhr[1]);
    const min = Number(uhr[2]);
    if (h > 23 || min > 59) return undefined;
    minuten = h * 60 + min;
  }
  return { zeitpunkt: (datum ?? tag) * MINUTEN_JE_TAG + minuten, mitDatum: datum != null };
}

/** „Heros Oldenburg 22/51“ → Funkrufname; unbekanntes Kennwort oder ohne Zahlen → undefined. */
function funkrufnameLesen(text: string, ovName: string): Funkrufname | undefined {
  const m = /^(\S+)\s+(.+?)\s+(\d+(?:\s*\/\s*\d+)*)$/.exec(text.trim());
  if (!m) return undefined;
  const kennwort = imVokabular(m[1]!, FUNKRUF_KENNWOERTER);
  if (!kennwort) return undefined;
  const ort = m[2]!.trim();
  const eigen = ovName !== "" && norm(ort) === norm(ovName);
  return {
    kennwort: { code: kennwort.code },
    eigenerStandort: eigen,
    ...(eigen ? {} : { ort }),
    teile: m[3]!.split("/").map((s) => Number(s.trim())),
  };
}

// --------------------------------------------------------------- Abbildung

/** Ergebnis des Imports: der Bogen und die Quittung für den Meldekopf. */
export interface WordImport {
  bogen: Erfassungsbogen;
  /** Sätze: was übernommen wurde, was unter „Sonstiges“ steht, was verworfen wurde. */
  quittung: string[];
}

/** Vorbelegungen der Vorlage, die keine Angabe sind. */
function istVorbelegung(name: string, text: string): boolean {
  const t = text.replace(/\s+/g, "");
  if (/_Fax$/.test(name)) return /^-?18$/.test(t) || t === "-";
  if (/_Mail$/.test(name)) return t.startsWith("@") || t === "";
  if (/^Fz_\d+_Kennz$/.test(name)) return /^THW-?$/i.test(t);
  return false;
}

const PERSONAL_ZEILEN: { praefix: string; anzahl: number; rolle: StaerkeRolle; fuehrung: boolean }[] = [
  { praefix: "FüKr", anzahl: 3, rolle: StaerkeRolle.UNTERFUEHRER, fuehrung: true },
  { praefix: "He", anzahl: 17, rolle: StaerkeRolle.MANNSCHAFT, fuehrung: false },
];

function anzahlText(n: number, eins: string, viele: string): string {
  return `${n} ${n === 1 ? eins : viele}`;
}

/**
 * Formularfelder → Erfassungsbogen. Reine Abbildung ohne Datei — so testbar
 * ohne ZIP. Leere Personalzeilen (die Vorlage hat 17 Helferzeilen) fallen
 * wortlos weg.
 */
export function bogenAusWordFeldern(felder: WordFeld[]): WordImport {
  const nachName = new Map<string, WordFeld>();
  for (const f of felder) if (!nachName.has(f.name)) nachName.set(f.name, f);
  const benutzt = new Set<string>();
  const text = (name: string): string => {
    benutzt.add(name);
    const f = nachName.get(name);
    if (!f || f.angekreuzt != null) return "";
    return istVorbelegung(name, f.text) ? "" : f.text;
  };
  const kreuz = (name: string): boolean | undefined => {
    benutzt.add(name);
    const f = nachName.get(name);
    if (!f) return undefined;
    if (f.angekreuzt != null) return f.angekreuzt;
    // Ein Textfeld an der Stelle eines Kästchens: „x“, „ja“ zählen als angekreuzt.
    return /^(x|ja|j|✓|✔)$/i.test(f.text);
  };

  const bogen = neuerBogen();
  const heute = Math.floor(bogen.stand / MINUTEN_JE_TAG);
  const sonstiges: string[] = [];
  const sonstigesArten: string[] = [];
  const verworfen: string[] = [];
  const hinweise: string[] = [];

  // --- Einheit
  const teileinheit = text("Teileinheit");
  if (teileinheit && !/^sonstige$/i.test(teileinheit)) {
    const typ = imVokabular(teileinheit, THW_EINHEITSTYPEN) ?? imVokabular(einheitstypLangform(teileinheit), THW_EINHEITSTYPEN);
    bogen.einheit.einheitsTyp = typ ? { code: typ.code } : { freitext: teileinheit };
    if (!typ) hinweise.push(`Einheitstyp „${teileinheit}“ steht nicht im THW-Verzeichnis und ist als Freitext übernommen.`);
  } else {
    hinweise.push("Einheitstyp offen (Vorlage „Sonstige“ oder leer) — bitte in der App auswählen.");
  }
  const hierarchie: HierarchieEbene[] = [];
  const faxe: string[] = [];
  for (const [kurz, eintrag] of THW_HIERARCHIE_EBENEN.map((e) => [e.kurz, e] as const)) {
    const name = text(kurz);
    const tel = rufnummer(text(`${kurz}_Tel`));
    const mail = text(`${kurz}_Mail`);
    const fax = text(`${kurz}_Fax`);
    if (fax) faxe.push(`${kurz} ${fax}`);
    if (!name && !tel && !mail) continue;
    hierarchie.push({
      bezeichnung: { code: eintrag.code },
      name,
      ...(tel ? { telefon: tel } : {}),
      ...(mail ? { email: mail } : {}),
    });
  }
  // Die unterste Ebene (OV) ist Pflicht; fehlt sie, bleibt sie leer stehen.
  if (hierarchie[0]?.bezeichnung.code !== 1) hierarchie.unshift({ bezeichnung: { code: 1 }, name: "" });
  bogen.einheit = { organisation: OrganisationsTyp.THW, einheitsTyp: bogen.einheit.einheitsTyp, hierarchie };
  if (faxe.length) {
    sonstiges.push(`Fax: ${faxe.join(", ")}`);
    sonstigesArten.push("Faxnummern");
  }
  const ovName = hierarchie[0]?.name ?? "";

  // --- Einsatz
  const zeitraumText = text("Einsatzzeitraum");
  const zeitraum = zeitraumText ? zeitraumLesen(zeitraumText, heute) : undefined;
  bogen.einsatz = {
    zeitraumVon: zeitraum?.von ?? heute,
    zeitraumBis: zeitraum?.bis ?? heute,
    ortAuftrag: text("Einsatzort"),
  };
  if (!zeitraum) {
    if (zeitraumText) {
      sonstiges.push(`Einsatzzeitraum laut Bogen: ${zeitraumText}`);
      sonstigesArten.push("Einsatzzeitraum (nicht lesbar)");
    }
    hinweise.push("Einsatzzeitraum fehlt oder ist nicht lesbar — vorläufig heute eingetragen, bitte prüfen.");
  }
  const ohneDatum: string[] = [];
  for (const [feld, ziel] of [["Einsatzbeginn", "einsatzbeginn"], ["Einsatzende", "einsatzende"]] as const) {
    const t = text(feld);
    if (!t) continue;
    const bezugTag = ziel === "einsatzbeginn" ? bogen.einsatz.zeitraumVon : Math.floor((bogen.einsatz.einsatzbeginn ?? bogen.einsatz.zeitraumVon * MINUTEN_JE_TAG) / MINUTEN_JE_TAG);
    const z = zeitpunktLesen(t, bezugTag, heute);
    if (!z) {
      sonstiges.push(`${feld} laut Bogen: ${t}`);
      sonstigesArten.push(feld);
      continue;
    }
    let zp = z.zeitpunkt;
    // Ende ohne Datum vor dem Beginn: über Mitternacht, also am Folgetag.
    if (ziel === "einsatzende" && !z.mitDatum && bogen.einsatz.einsatzbeginn != null && zp < bogen.einsatz.einsatzbeginn) zp += MINUTEN_JE_TAG;
    bogen.einsatz[ziel] = zp;
    if (!z.mitDatum) ohneDatum.push(feld);
  }
  if (ohneDatum.length) hinweise.push(`${ohneDatum.join(" und ")} ohne Datum: auf den ersten Tag des Einsatzzeitraums bezogen, bitte prüfen.`);

  // --- Personal
  const personal: Person[] = [];
  /** Name, wie er im Bogen stand — für den Abgleich mit Kopf und Qualifikationen. */
  const rohNamen: string[] = [];
  for (const zeile of PERSONAL_ZEILEN) {
    for (let n = 1; n <= zeile.anzahl; n++) {
      const p = `${zeile.praefix}_${n}`;
      let name = text(`${p}_Name`);
      // Kopf-Führungskraft ohne eigene Zeile: in die erste Führungszeile.
      if (!name && zeile.fuehrung && n === 1) name = text("FüKr");
      const zusatz = text(`${p}_Zusatzf`);
      const ov = text(`${p}_OV`);
      const mobil = zeile.fuehrung ? rufnummer(text(`${p}_Mobil`)) : "";
      const mail = zeile.fuehrung ? text(`${p}_Mail`) : "";
      const privat = zeile.fuehrung ? kreuz(`${p}_Mobil_privat`) : undefined;
      const dienstlichKreuz = zeile.fuehrung ? kreuz(`${p}_Mobil_dientli`) : undefined;
      if (!name) {
        if (zusatz || ov || mobil || mail) {
          sonstiges.push(`Zeile ${p} ohne Namen: ${[zusatz, ov, mobil, mail].filter(Boolean).join(", ")}`);
          sonstigesArten.push("Personalzeilen ohne Namen");
        }
        continue;
      }
      const person = neuePerson();
      Object.assign(person, nameTeilen(name));
      const grund = grundfunktion(nachName.get(`${p}_Zusatzf`)?.davor ?? "");
      person.staerkeRolle = grund.rolle ?? zeile.rolle;
      const zf = zusatzfunktionen(zusatz);
      person.funktionen = [...(grund.wert ? [grund.wert] : []), ...zf.funktionen];
      person.fahrerlaubnis = zf.fahrerlaubnis;
      if (ov && norm(ov) !== norm(ovName)) person.dienststelle = ov;
      const kontakte: Kontakt[] = [];
      if (mobil) kontakte.push({ art: KontaktArt.MOBIL, dienstlich: privat === true ? dienstlichKreuz === true : true, wert: mobil });
      if (mail) kontakte.push({ art: KontaktArt.EMAIL, dienstlich: true, wert: mail });
      person.kontakte = kontakte;
      personal.push(person);
      rohNamen.push(name);
    }
  }
  const kopf = text("FüKr");
  if (kopf && !rohNamen.some((r) => norm(r) === norm(kopf))) {
    sonstiges.push(`Führungskraft laut Kopf: ${kopf}`);
    sonstigesArten.push("Führungskraft im Kopf (keiner Zeile zuzuordnen)");
  }
  bogen.personal = personal;

  // Qualifikationen → Person mit gleichem Namen (ganz, sonst eindeutiger Nachname).
  let qualiZugeordnet = 0;
  for (let n = 1; n <= 6; n++) {
    const name = text(`int_ext_He_${n}_Name`);
    const quali = text(`int_ext_He_${n}_Quali`);
    if (!name && !quali) continue;
    let i = name ? rohNamen.findIndex((r) => norm(r) === norm(name)) : -1;
    if (i < 0 && name) {
      const nur = nameTeilen(name).nachname;
      const passend = personal.map((p, j) => (norm(p.nachname) === norm(nur) ? j : -1)).filter((j) => j >= 0);
      if (passend.length === 1) i = passend[0]!;
    }
    if (i >= 0 && quali) {
      for (const q of quali.split(/[;\n]|,\s+/).map((s) => s.trim()).filter(Boolean)) personal[i]!.zusatzqualifikationen.push({ freitext: q });
      qualiZugeordnet++;
    } else {
      sonstiges.push(`Qualifikation ${name || "(ohne Namen)"}: ${quali || "(leer)"}`);
      sonstigesArten.push("Qualifikationen ohne passende Person");
    }
  }

  // Stärke im Kopf: nur Kontrolle, die App zählt selbst.
  const kopfStaerke = ["Fü", "UFü", "He", "Gesamt"].map((f) => text(f));
  if (kopfStaerke.some(Boolean)) {
    const s = staerke(bogen);
    const gezaehlt = [s.fuehrer, s.unterfuehrer, s.mannschaft, s.gesamt];
    const abweichung = kopfStaerke.some((t, i) => t !== "" && zahl(t) !== gezaehlt[i]);
    const kopfAnzeige = kopfStaerke.map((t) => t || "–").join("/");
    verworfen.push(
      abweichung
        ? `Stärke im Kopf ${kopfAnzeige} weicht von den Personalzeilen ab (gezählt ${gezaehlt.join("/")}) — bitte prüfen`
        : `Stärke im Kopf ${kopfAnzeige} (stimmt mit den Personalzeilen überein; die App zählt selbst)`,
    );
  }

  // --- Fahrzeuge
  const fahrzeuge: Fahrzeug[] = [];
  let nurVorbelegt = 0;
  for (let n = 1; n <= 5; n++) {
    const p = `Fz_${n}`;
    const typText = text(p);
    const kennz = text(`${p}_Kennz`);
    const furn = text(`${p}_FuRn`);
    const ja = kreuz(`${p}_StAN_ja`);
    const nein = kreuz(`${p}_StAN_nein`);
    const sonder = text(`${p}_Sonder`);
    if (!kennz && !furn && !ja && !nein && !sonder) {
      if (typText) nurVorbelegt++;
      continue;
    }
    const typ = typText ? imVokabular(typText, THW_FAHRZEUGTYPEN) : undefined;
    const fz: Fahrzeug = { typ: typ ? { code: typ.code } : typText ? { freitext: typText } : {} };
    if (kennz) fz.kennzeichen = kennz;
    if (furn) {
      const f = funkrufnameLesen(furn, ovName);
      if (f) fz.funkrufname = f;
      else {
        sonstiges.push(`Funkrufname ${typText || p}: ${furn}`);
        sonstigesArten.push("Funkrufnamen (nicht lesbar)");
      }
    }
    if (ja && !nein) fz.stanKonform = true;
    else if (nein && !ja) fz.stanKonform = false;
    if (sonder) fz.aenderungen = sonder;
    fahrzeuge.push(fz);
  }
  bogen.fahrzeuge = fahrzeuge;
  if (nurVorbelegt) verworfen.push(`${anzahlText(nurVorbelegt, "Fahrzeugzeile", "Fahrzeugzeilen")} nur mit der StAN-Vorbelegung, ohne Kennzeichen, Funkrufname oder Kreuz`);

  // --- Sofortbedarf
  const verpflegung = kreuz("Verpflegung");
  const personen = zahl(text("Personenzahl"));
  const betriebsstoff = kreuz("Betriebsstoff");
  const diesel = zahl(text("Liter_Diesel")) ?? 0;
  const benzin = zahl(text("Liter_Benzin")) ?? 0;
  const gemisch = zahl(text("Liter_Gemisch")) ?? 0;
  const ruhezeit = kreuz("Ruhezeit");
  const unterbringung = kreuz("Unterbringung");
  const vegetarier = text("Vegetarier");
  const mwd = ["Männlich", "Weiblich", "Divers"].map((f) => text(f));
  if (verpflegung || personen || betriebsstoff || diesel || benzin || gemisch || ruhezeit || unterbringung) {
    const sb: Sofortbedarf = {
      verpflegungPersonen: personen ?? (verpflegung ? personal.length : 0),
      dieselLiter: diesel,
      benzinLiter: benzin,
      gemischLiter: gemisch,
      unterbringung: unterbringung === true,
      ruhezeitErforderlich: ruhezeit === true,
    };
    bogen.sofortbedarf = sb;
    if (betriebsstoff && !diesel && !benzin && !gemisch) hinweise.push("Betriebsstoff angekreuzt, aber ohne Literangabe.");
  }
  // Die Aufteilung vegetarisch und nach Geschlecht hängt im Modell an den Personen; die Kopfzahlen bleiben lesbar unter Sonstiges.
  if (vegetarier) {
    sonstiges.push(`Verpflegung: davon vegetarisch ${vegetarier}`);
    sonstigesArten.push("Zahl der Vegetarier");
  }
  if (mwd.some(Boolean)) {
    sonstiges.push(`Unterbringung: männlich ${mwd[0] || "–"}, weiblich ${mwd[1] || "–"}, divers ${mwd[2] || "–"}`);
    sonstigesArten.push("Unterbringung nach Geschlecht");
  }

  // --- Unbekannte Felder mit Inhalt: nichts geht stillschweigend verloren.
  for (const f of nachName.values()) {
    if (benutzt.has(f.name)) continue;
    if (f.angekreuzt) {
      sonstiges.push(`${f.name}: angekreuzt`);
    } else if (f.text && !istVorbelegung(f.name, f.text)) {
      sonstiges.push(`${f.name}: ${f.text}`);
    } else continue;
    sonstigesArten.push("unbekannte Felder");
  }

  if (sonstiges.length) bogen.sonstiges = ["Aus dem Word-Bogen:", ...sonstiges].join("\n");

  // --- Quittung
  const fuehrung = personal.filter((p) => p.staerkeRolle !== StaerkeRolle.MANNSCHAFT).length;
  const uebernommen = [
    anzahlText(fuehrung, "Führungskraft", "Führungskräfte"),
    anzahlText(personal.length - fuehrung, "Helfer/in", "Helfer/innen"),
    anzahlText(fahrzeuge.length, "Fahrzeug", "Fahrzeuge"),
    ...(qualiZugeordnet ? [anzahlText(qualiZugeordnet, "Qualifikationszeile", "Qualifikationszeilen")] : []),
    ...(bogen.sofortbedarf ? ["Sofortbedarf"] : []),
  ];
  const quittung = [`Aus dem Word-Bogen übernommen: ${uebernommen.join(", ")}.`];
  const arten = [...new Set(sonstigesArten)];
  if (arten.length) quittung.push(`Unter „Sonstiges“ eingetragen: ${arten.join(", ")}.`);
  if (verworfen.length) quittung.push(`Nicht übernommen: ${verworfen.join("; ")}.`);
  quittung.push(...hinweise);

  if (personal.length === 0 && fahrzeuge.length === 0 && !ovName && !bogen.einsatz.ortAuftrag) {
    throw new WordBogenFehler(
      "Im Word-Bogen ist nichts ausgefüllt — weder Ortsverband noch Personal oder Fahrzeuge. Ist es die leere Vorlage?",
    );
  }
  return { bogen, quittung };
}

/** Bytes einer .docx → Bogen und Quittung. Wirft WordBogenFehler mit einem Satz für den Meldekopf. */
export function bogenAusWordBytes(bytes: Uint8Array): WordImport {
  if (bytes.length > MAX_WORD_DATEI) {
    throw new WordBogenFehler(`Die Word-Datei ist größer als ${MAX_WORD_DATEI / 1024 / 1024} MB und wird nicht gelesen.`);
  }
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    // Alte .doc (OLE, beginnt mit D0 CF 11 E0) oder etwas anderes.
    const alt = bytes[0] === 0xd0 && bytes[1] === 0xcf;
    throw new WordBogenFehler(
      alt
        ? "Das ist eine alte Word-Datei (.doc). Bitte in Word öffnen und als „Word-Dokument (.docx)“ speichern, dann erneut einlesen."
        : "Die Datei ist keine Word-Datei (.docx).",
    );
  }
  const xml = zipEintrag(bytes, "word/document.xml");
  if (!xml) throw new WordBogenFehler("In der Datei steckt kein Word-Dokument.");
  const felder = wordFelderLesen(new TextDecoder().decode(xml));
  if (felder.length === 0 || !felder.some((f) => f.name === "Teileinheit" || /^(FüKr|He)_1_Name$/.test(f.name))) {
    throw new WordBogenFehler(
      "Diese Word-Datei ist kein THW-Erfassungsbogen (die Formularfelder der Vorlage 06-…_Erfassungsbogen fehlen).",
    );
  }
  return bogenAusWordFeldern(felder);
}
