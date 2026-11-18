/**
 * Erzeugt Übungsbögen realer niedersächsischer Ortsfeuerwehren und Standorte
 * der Hilfsorganisationen (DRK, JUH, MHD, ASB) — ein Bogen je Wache mit ihren
 * echten Fahrzeugen, Funkrufnamen und Kennzeichen.
 *
 * Aufruf (Node ≥ 22):
 *   npm run beispiele:bos-nds              Bögen aus der Momentaufnahme erzeugen
 *   npm run quellen:bos-fahrzeuge          vorher die Momentaufnahme neu abrufen
 *
 * Quelle: scripts/quellen/bos-fahrzeuge-nds.json, abgerufen von
 * https://bos-fahrzeuge.info/ mit scripts/bos-fahrzeuge-abruf.mts. Übernommen
 * werden Name und Landkreis der Wache sowie je Fahrzeug Funkrufname,
 * Kennzeichen und Typ. Nur Fahrzeuge im Dienst; bei den Hilfsorganisationen
 * nur die des Katastrophenschutzes (Obergruppe SEG/KatS), keine Rettungswagen
 * des Regelrettungsdienstes.
 *
 * Ziel:
 *   examples/feuerwehr/niedersachsen/ortsfeuerwehren/lk-<landkreis>/wache-<wache>.json
 *   examples/<drk|juh|mhd|asb>/niedersachsen/standorte/lk-<landkreis>/wache-<wache>.json
 *
 * Wie die Bögen der THW-Ortsverbände sind sie nur auf Abruf (Dateinamen
 * „wache-…", scripts/precache-aufteilung.ts) und stehen nicht im Glob des
 * Übungsbögen-Dialogs, sondern im nachgeladenen Baustein
 * src/app/beispiele-thw-ov.ts; die Ordnernamen der Landkreise schreibt dieses
 * Skript nach src/app/beispiele-bos-ordner.ts.
 *
 * Konstruktion:
 *  - Fahrzeugtyp: die Kurzbezeichnung aus dem Fahrzeugtext der Wache („HLF 10"),
 *    sonst aus der Klassifizierung der Datenbank.
 *  - Besatzung: Normbesatzung des Fahrzeugs (Gruppe 9, Staffel 6, Trupp 3;
 *    Mannschaftstransport 6, Kommandowagen 2), höchstens so viele wie Plätze —
 *    dieselben Richtwerte wie die Sitzplatzprüfung der App. Anhänger und Boote
 *    ohne eigene Besatzung.
 *  - Führung: Ortsbrandmeister/-in bzw. Einheitsführer/-in auf dem
 *    Führungsfahrzeug (ELW, KdoW), sonst auf dem ersten Fahrzeug; die übrigen
 *    Fahrzeugführungen sind Unterführer.
 *  - Alle Personen erfunden, Rufnummern 555… (fakeTelefon). Zufall je Wache
 *    aus einem Seed, der nur von ihrer Kennung abhängt.
 *
 * Am Ende läuft eine Selbstprüfung (Codec-Roundtrip, Sitzplatzbilanz, nur
 * WinAnsi-Zeichen); jeder Zielordner bekommt eine README mit Übersicht.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  Erfassungsbogen,
  Ernaehrung as E,
  Fahrerlaubnis as FE,
  Fahrzeug,
  Geschlecht as G,
  HierarchieEbene,
  KontaktArt,
  OrganisationsTyp,
  Person,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle as R,
  datumAusIso,
  MINUTEN_JE_TAG,
  staerke,
} from "@bos/eeb-format/model";
import { decodePayload, encodePayload } from "@bos/eeb-format/codec";
import { nodeKompressor } from "@bos/eeb-format/qr-node";
import { sitzplaetzeAusFreitext, sitzplatzBilanz } from "@bos/vokabulare/sitzplaetze";
import { fakeTelefon } from "./fake-telefon";
import { NACHNAMEN, VORNAMEN_M, VORNAMEN_W, prng, slug } from "./thw-beispiel-daten";

/** Aufbau der Momentaufnahme — wie scripts/bos-fahrzeuge-abruf.mts sie schreibt. */
interface QuellFahrzeug {
  id: number;
  funkrufname: string;
  kennzeichen?: string;
  obergruppe?: string;
  organisation?: string;
  klassifizierung?: string;
  ausserDienst: boolean;
  /** Typ laut Fahrzeugtext der Wache („HLF 10"). */
  typText?: string;
}
interface Wache {
  id: number;
  name: string;
  kreis: string;
  organisation?: string;
  wachenart?: string;
  ort?: string;
  mitglieder?: number;
  fahrzeuge: QuellFahrzeug[];
}
interface Momentaufnahme {
  quelle: string;
  abgerufen: string;
  hinweis: string;
  wachen: Wache[];
}

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUELLE = join(wurzel, "scripts", "quellen", "bos-fahrzeuge-nds.json");

// ------------------------------------------------------------ Organisationen

type Org = "ff" | "drk" | "juh" | "mhd" | "asb";

/** Wie scripts/bos-fahrzeuge-abruf.mts — hier wiederholt, damit der Generator den Abruf nicht lädt. */
function orgSchluessel(organisation: string | undefined): Org | null {
  if (!organisation) return null;
  if (/Freiwillige Feuerwehr/.test(organisation)) return "ff";
  if (/Johanniter/.test(organisation)) return "juh";
  if (/Malteser/.test(organisation)) return "mhd";
  if (/Samariter|\bASB\b/.test(organisation)) return "asb";
  if (/Rotes Kreuz|\bDRK\b|\bBRK\b/.test(organisation)) return "drk";
  return null;
}

const ORG: Record<Org, { typ: OrganisationsTyp; name: string; kurz: string; ordner: string; kennwort: number }> = {
  ff: { typ: OrganisationsTyp.FEUERWEHR, name: "Freiwillige Feuerwehr", kurz: "FF", ordner: "feuerwehr", kennwort: 2 },
  drk: { typ: OrganisationsTyp.DRK, name: "Deutsches Rotes Kreuz", kurz: "DRK", ordner: "drk", kennwort: 3 },
  juh: { typ: OrganisationsTyp.JUH, name: "Johanniter-Unfall-Hilfe", kurz: "JUH", ordner: "juh", kennwort: 4 },
  mhd: { typ: OrganisationsTyp.MHD, name: "Malteser Hilfsdienst", kurz: "MHD", ordner: "mhd", kennwort: 5 },
  asb: { typ: OrganisationsTyp.ASB, name: "Arbeiter-Samariter-Bund", kurz: "ASB", ordner: "asb", kennwort: 6 },
};

/** Kennwörter im Funkrufnamen → Code im Vokabular FUNKRUF_KENNWOERTER. */
const KENNWORT: Record<string, number> = { Florian: 2, Rotkreuz: 3, Akkon: 4, Johannes: 5, Sama: 6, Pelikan: 7 };
/** „(a.D.)", „(a.D)", „( a.D. )", „(a.D./1)": außer Dienst — Fahrzeug oder ganze Wache. */
const AUSSER_DIENST = /\(\s*a\.\s?D\b/i;
const RUFNAME = /^(Florian|Rotkreuz|Akkon|Johannes|Malteser|Sama|Pelikan)\s/;

// ---------------------------------------------------------------- Fahrzeuge

/** Klassifizierung der Datenbank → Kurzbezeichnung, wenn die Wache keine nennt. */
const KLASSE_KURZ: [RegExp, string][] = [
  [/Hilfeleistungslöschgruppenfahrzeug/i, "HLF"],
  [/Löschgruppenfahrzeug/i, "LF"],
  [/Mittleres Löschfahrzeug/i, "MLF"],
  [/Staffellöschfahrzeug/i, "StLF"],
  [/Tragkraftspritzenfahrzeug/i, "TSF"],
  [/Tanklöschfahrzeug/i, "TLF"],
  [/Kleinlöschfahrzeug/i, "KLF"],
  [/Drehleiter/i, "DLK"],
  [/Hubrettungs|Teleskopmast|Gelenkmast/i, "TMF"],
  [/Rüstwagen/i, "RW"],
  [/Einsatzleitwagen\s*2|ELW\s*2/i, "ELW 2"],
  [/Einsatzleit/i, "ELW 1"],
  [/Kommandowagen|Kommandofahrzeug/i, "KdoW"],
  [/Mannschaftstransport|Mehrzweckfahrzeug|Mehrzweckwagen/i, "MTW"],
  [/Schlauchwagen/i, "SW"],
  [/Wechsellader/i, "WLF"],
  [/Abrollbehälter/i, "AB"],
  [/Anhänger/i, "Anh"],
  [/Boot/i, "Boot"],
  [/Gerätewagen.*Sanität|GW.?San/i, "GW-San"],
  [/Gerätewagen.*Betreuung|GW.?Bt/i, "GW-Bt"],
  [/Gerätewagen.*Gefahrgut/i, "GW-G"],
  [/Gerätewagen.*Logistik/i, "GW-L"],
  [/Gerätewagen/i, "GW"],
  [/Rettungswagen/i, "RTW"],
  [/Krankentransportwagen/i, "KTW"],
  [/Notarzteinsatzfahrzeug/i, "NEF"],
  [/Krankenkraftwagen/i, "KTW"],
  [/Betreuungs/i, "BtKombi"],
  [/Versorgungs|Verpflegung/i, "GW-V"],
  [/Lastkraftwagen|LKW/i, "LKW"],
  [/Personenkraftwagen|PKW|Kombi/i, "Kombi"],
];

/** Anhänger, Feldkochherde und Boote: keine eigene Besatzung, keine Sitzplätze. */
function ohneBesatzung(f: QuellFahrzeug): boolean {
  return /Anhänger|Feldkochherd|Boot|Abrollbehälter/i.test(f.klassifizierung ?? "");
}

function kurzVon(f: QuellFahrzeug): string {
  if (ohneBesatzung(f) && !f.typText) {
    // „Florian Friesland 17/FwA-JF-01" → „FwA-JF"
    const zusatz = /\d+\s*[/-]\s*([^\d\s][^/]*?)(?:[-\s]+\d+)?\s*$/.exec(f.funkrufname)?.[1];
    const k = f.klassifizierung ?? "Anhänger";
    if (zusatz && zusatz.length <= 24) return /anh|^fwa|^fkh|^[a-z]+a$/i.test(zusatz) ? zusatz : `${k} ${zusatz}`;
    return k;
  }
  const t = f.typText?.replace(/\s*\(NDS\)\s*$/, "").trim();
  if (t && t.length <= 24) return t;
  const k = f.klassifizierung ?? "";
  return KLASSE_KURZ.find(([m]) => m.test(k))?.[1] ?? (k || "Fahrzeug");
}

function istAnhaenger(kurz: string): boolean {
  return /^(Anh|AB|FwA|Boot|MZB|RTB)\b|anhänger|abrollbehälter/i.test(kurz);
}
function istFuehrung(kurz: string): boolean {
  return /^(ELW|KdoW|KdoF|KdW|FüKW|MZF\s*ELW)/i.test(kurz);
}
function istMannschaft(kurz: string): boolean {
  return /^(MTW|MTF|MZF|MZW|BtKombi|Bt-Kombi)/i.test(kurz);
}
function istSanitaet(kurz: string): boolean {
  return /^(RTW|KTW|NEF|GW.?San|ITW|NAW|BHP)/i.test(kurz);
}

/** Besatzungsstärke nach Normbesatzung, höchstens so viele wie Plätze. */
function besatzungsStaerke(kurz: string): number {
  if (istAnhaenger(kurz)) return 0;
  if (/^(KdoW|KdoF|KdW)/i.test(kurz)) return 2;
  const plaetze = sitzplaetzeAusFreitext(kurz);
  // Mannschaftstransport: Fahrzeugführung, Fahrer/-in und ein Trupp — die
  // übrigen Plätze bleiben frei für Kräfte anderer Fahrzeuge.
  if (istMannschaft(kurz)) return Math.min(4, plaetze ?? 4);
  if (/^N?-?\s?(KTW|RTW)/i.test(kurz)) return 2;
  if (/^(LF|HLF)\b/i.test(kurz)) return 9;
  if (/^(MLF|StLF|TSF|KLF)\b/i.test(kurz)) return 6;
  return Math.min(3, plaetze ?? 3);
}

function dieselFuer(kurz: string): number {
  if (istAnhaenger(kurz)) return 0;
  if (/^(WLF|TLF 4000|DLK|TMF|LKW)/i.test(kurz)) return 120;
  if (/^(LF|HLF|StLF|RW|GW|TLF|SW|ELW 2)/i.test(kurz)) return 70;
  return 45;
}

// ------------------------------------------------------------ Funkrufnamen

/** „Florian Friesland 13/46-02" → Kennwort, Ort, Kennzahlen. */
function funkrufname(ruf: string): Fahrzeug["funkrufname"] | undefined {
  const m = /^(\p{L}+)\s+(.+?)\s+(\d{1,3}(?:\s*[/-]\s*\d{1,3})+)\s*$/u.exec(ruf.trim());
  if (!m) return undefined;
  const code = KENNWORT[m[1]!];
  return {
    kennwort: code != null ? { code } : { freitext: m[1]! },
    eigenerStandort: false,
    ort: m[2]!,
    teile: m[3]!.split(/\s*[/-]\s*/).map(Number),
  };
}

// ------------------------------------------------------------------ Namen

function kreisName(roh: string): { name: string; kfz?: string } {
  const m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(roh);
  if (!m) return { name: roh };
  return { name: m[1]!.trim(), kfz: m[2]!.split(/[ ,]+/)[0] };
}

/** „FF Zetel OF Neuenburg" → Gemeinde „Zetel", Ortsfeuerwehr „Neuenburg". */
function ffNamen(wache: string): { gemeinde: string; ort: string } {
  const ohne = wache.replace(/^(FF|Freiwillige Feuerwehr|Feuerwehr)\s+/i, "").trim();
  const teile = ohne.split(/\s+(?:[-–]\s+)?(?:OF|Ortsfeuerwehr|Ortswehr|FF)\s+/);
  if (teile.length >= 2) return { gemeinde: teile[0]!.replace(/\s*[-–]\s*$/, ""), ort: teile.slice(1).join(" ") };
  const strich = ohne.split(/\s+[-–]\s+/);
  if (strich.length === 2) return { gemeinde: strich[0]!, ort: strich[1]! };
  return { gemeinde: ohne, ort: ohne };
}

/** „DRK KV Jeverland - BS Jever" → „Deutsches Rotes Kreuz Kreisverband Jeverland"; sonst Organisation und Landkreis. */
function hiorgName(wache: string, org: string, kreis: string): string {
  const kv = /\b(?:KV|Kreisverband)\s+(.+?)(?:\s+[-–]\s+|\s+(?:BS|OV|RW|SEG)\b|$)/.exec(wache)?.[1];
  if (kv) return `${org} Kreisverband ${kv.trim()}`;
  const rv = /\b(?:RV|Regionalverband)\s+(.+?)(?:\s+[-–]\s+|\s+(?:OV|SEG)\b|$)/.exec(wache)?.[1];
  if (rv) return `${org} Regionalverband ${rv.trim()}`;
  return `${org} ${kreis}`;
}

/** Einheitstyp der Hilfsorganisationen aus dem Wachennamen. */
function hiorgEinheit(wache: string, org: Org): string {
  if (/\bSEG\b/.test(wache)) return "Schnell-Einsatz-Gruppe (SEG)";
  if (/\b(BS|Bereitschaft)\b/.test(wache) || org === "drk") return "Bereitschaft";
  if (/\b(OV|Ortsverband|Ortsverein|Ortsgliederung)\b/.test(wache)) return "Ortsverband";
  return "Einsatzeinheit";
}

// --------------------------------------------------------------- Besatzung

interface Platz {
  rolle: R;
  funktion: string;
  quali?: string;
  fe?: FE;
}
const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

function crew(kurz: string, n: number, org: Org, leitung: Platz | null): Platz[] {
  if (n === 0) return [];
  const liste: Platz[] = [];
  const ff = org === "ff";
  const tf = ff ? "Atemschutzgeräteträger" : "Sanitätshelfer";
  if (leitung) liste.push(leitung);
  else if (n <= 3) liste.push({ rolle: U, funktion: "Fahrzeugführer/-in" });
  else liste.push({ rolle: U, funktion: n <= 6 ? "Staffelführer/-in" : "Gruppenführer/-in" });
  if (n >= 2) {
    liste.push(
      ff && !istMannschaft(kurz) && !istFuehrung(kurz)
        ? { rolle: M, funktion: "Maschinist/-in", quali: "Maschinist", fe: /^(TSF|MLF|KLF)/.test(kurz) ? FE.B : FE.C }
        : ff
        ? { rolle: M, funktion: "Fahrer/-in", fe: FE.B }
        : { rolle: M, funktion: "Fahrer/-in", fe: /^(LKW|GW|WLF)/.test(kurz) ? FE.C : FE.C1 },
    );
  }
  if (istFuehrung(kurz)) {
    while (liste.length < n) liste.push({ rolle: M, funktion: "Führungsassistent/-in", quali: "Sprechfunker" });
    return liste;
  }
  if (!ff && istSanitaet(kurz)) {
    const quali = ["Rettungssanitäter", "Rettungshelfer", "Sanitätshelfer"];
    let i = 0;
    while (liste.length < n) liste.push({ rolle: M, funktion: "Sanitäter/-in", quali: quali[Math.min(i++, 2)] });
    return liste;
  }
  if (n >= 9) liste.push({ rolle: M, funktion: "Melder/-in", quali: "Sprechfunker" });
  let tfDran = true;
  while (liste.length < n) {
    liste.push(
      ff
        ? { rolle: M, funktion: tfDran ? "Truppführer/-in" : "Truppmitglied", quali: tf }
        : { rolle: M, funktion: "Helfer/-in", quali: tfDran ? tf : undefined },
    );
    tfDran = !tfDran;
  }
  return liste;
}

// ---------------------------------------------------------------- Bogen bauen

function seedVon(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

const SZENARIO: Record<Org, string[]> = {
  ff: [
    "Überörtliche Hilfe Unwetter: Meldung am Bereitstellungsraum {kreis}, Auftrag folgt",
    "Waldbrand: Bereitstellung an der Technischen Einsatzleitung {kreis}",
    "Hochwasser: Sandsackverbau und Deichverteidigung im {kreis}",
    "Großbrand Gewerbegebiet: Wasserversorgung über lange Wegstrecke, Meldekopf {kreis}",
    "Übung Kreisfeuerwehrbereitschaft: Anmarsch im Verband, Meldekopf {kreis}",
  ],
  drk: ["MANV-Übung: Behandlungsplatz {kreis}", "Betreuung Evakuierte: Notunterkunft {kreis}", "Sanitätsdienst Großveranstaltung {kreis}"],
  juh: ["MANV-Übung: Behandlungsplatz {kreis}", "Betreuung Evakuierte: Notunterkunft {kreis}", "Sanitätsdienst Großveranstaltung {kreis}"],
  mhd: ["MANV-Übung: Behandlungsplatz {kreis}", "Betreuung Evakuierte: Notunterkunft {kreis}", "Sanitätsdienst Großveranstaltung {kreis}"],
  asb: ["MANV-Übung: Behandlungsplatz {kreis}", "Betreuung Evakuierte: Notunterkunft {kreis}", "Sanitätsdienst Großveranstaltung {kreis}"],
};

interface Ergebnis {
  org: Org;
  kreis: string;
  kreisOrdner: string;
  datei: string;
  wache: Wache;
  bogen: Erfassungsbogen;
  besatzungen: { kurz: string; anzahl: number; plaetze?: number }[];
}

function bogenBauen(w: Wache, org: Org, abgerufen: string): Ergebnis | null {
  const rnd = prng(seedVon(`bos-${w.id}`));
  const ganz = (a: number, b: number): number => a + Math.floor(rnd() * (b - a + 1));
  const wuerfel = (p: number): boolean => rnd() < p;
  const wahl = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)]!;

  const kreis = kreisName(w.kreis);
  const gesehen = new Set<string>();
  const fz = w.fahrzeuge
    .filter((f) => !f.ausserDienst && !AUSSER_DIENST.test(f.funkrufname) && orgSchluessel(f.organisation) === org)
    // Rückt nicht aus: Hausnotruf, Fahrschule, Museum.
    .filter((f) => !/Hausnotruf|Fahrschule|Oldtimer|Museum/i.test(`${f.funkrufname} ${f.klassifizierung ?? ""} ${f.typText ?? ""}`))
    // Nur echte Funkrufnamen: keine Gruppenfotos, Sammel- oder Scherzeinträge.
    .filter((f) => RUFNAME.test(f.funkrufname) && !/Gruppenfoto/i.test(f.klassifizierung ?? ""))
    .filter((f) => org === "ff" || f.obergruppe === "SEG/KatS")
    .filter((f) => {
      const k = f.funkrufname.toLowerCase();
      if (gesehen.has(k)) return false;
      gesehen.add(k);
      return true;
    })
    .map((f) => {
      const kurz = kurzVon(f);
      return { f, kurz, n: ohneBesatzung(f) ? 0 : besatzungsStaerke(kurz) };
    })
    .sort((a, b) => Number(istFuehrung(b.kurz)) - Number(istFuehrung(a.kurz)) || a.f.funkrufname.localeCompare(b.f.funkrufname, "de", { numeric: true }));
  if (fz.length === 0) return null;

  const namen = org === "ff" ? ffNamen(w.name) : null;
  const fuehrungTitel = org === "ff" ? "Ortsbrandmeister/-in" : "Einheitsführer/-in";
  const stvTitel = org === "ff" ? "stellv. Ortsbrandmeister/-in" : "stellv. Einheitsführer/-in";
  // Führung: Führungsfahrzeug, sonst das erste Fahrzeug mit Staffel- oder Gruppenbesatzung, sonst das erste besetzte.
  const ersteMit = (p: (x: (typeof fz)[number]) => boolean): number => fz.findIndex((x) => x.n > 0 && p(x));
  const leitIndex = [ersteMit((x) => istFuehrung(x.kurz)), ersteMit((x) => x.n >= 6 && !istMannschaft(x.kurz)), ersteMit(() => true)].find((i) => i >= 0) ?? 0;
  const stvIndex = fz.findIndex((x, i) => i !== leitIndex && x.n >= 3);

  const vergeben = new Set<string>();
  const person = (p: Platz, kurzFz: string, erste: boolean): Person => {
    const g = wuerfel(org === "ff" ? 0.15 : 0.4) ? G.W : G.M;
    let vorname = "";
    let nachname = "";
    do {
      vorname = wahl(g === G.W ? VORNAMEN_W : VORNAMEN_M);
      nachname = wahl(NACHNAMEN);
    } while (vergeben.has(`${vorname} ${nachname}`));
    vergeben.add(`${vorname} ${nachname}`);
    const pers: Person = {
      vorname,
      nachname,
      staerkeRolle: p.rolle,
      funktionen: [{ freitext: `${p.funktion} (${kurzFz})` }],
      fahrerlaubnis:
        p.fe ??
        (p.rolle !== M
          ? wahl([FE.C, FE.C, FE.CE, FE.C1, FE.B, FE.B])
          : wahl([FE.B, FE.B, FE.B, FE.B, FE.C1, FE.C, FE.NONE, FE.NONE])),
      geschlecht: g,
      ernaehrung: wuerfel(0.85) ? E.FLEISCH : wuerfel(0.7) ? E.VEGETARISCH : E.VEGAN,
      kontakte: [],
      zusatzqualifikationen: p.quali ? [{ freitext: p.quali }] : [],
    };
    if (erste || (p.rolle !== M && wuerfel(0.5))) {
      pers.kontakte.push({
        art: KontaktArt.MOBIL,
        dienstlich: false,
        wert: fakeTelefon(`01${ganz(5, 7)}${ganz(1, 9)}${String(ganz(0, 9999999)).padStart(7, "0")}`),
      });
    }
    return pers;
  };

  const personal: Person[] = [];
  const fahrzeuge: Fahrzeug[] = [];
  const besatzungen: Ergebnis["besatzungen"] = [];
  fz.forEach(({ f, kurz, n }, i) => {
    const leitung =
      i === leitIndex ? { rolle: F, funktion: fuehrungTitel } : i === stvIndex ? { rolle: U, funktion: stvTitel } : null;
    const c = crew(kurz, n, org, leitung);
    for (const p of c) personal.push(person(p, kurz, personal.length === 0));
    const fahrzeug: Fahrzeug = { typ: { freitext: kurz } };
    if (f.kennzeichen) fahrzeug.kennzeichen = f.kennzeichen;
    // Anhänger o. Ä. mit Kurzbezeichnung, die die Sitzplatztabelle nicht kennt: ausdrücklich 0 Plätze.
    if (n === 0 && ohneBesatzung(f) && sitzplaetzeAusFreitext(kurz) == null) fahrzeug.sitzplaetze = 0;
    const fr = funkrufname(f.funkrufname);
    if (fr) fahrzeug.funkrufname = fr;
    const aenderungen = [f.klassifizierung && f.klassifizierung !== kurz ? f.klassifizierung : "", fr ? "" : `Rufname laut Quelle: ${f.funkrufname}`]
      .filter(Boolean)
      .join("; ");
    if (aenderungen) fahrzeug.aenderungen = aenderungen;
    fahrzeuge.push(fahrzeug);
    besatzungen.push({ kurz, anzahl: c.length, plaetze: fahrzeug.sitzplaetze ?? sitzplaetzeAusFreitext(kurz) });
  });
  if (personal.length === 0) return null;

  const o = ORG[org];
  const hierarchie: HierarchieEbene[] =
    org === "ff"
      ? [
          { bezeichnung: { freitext: "Ortsfeuerwehr" }, name: namen!.ort },
          ...(namen!.gemeinde !== namen!.ort ? [{ bezeichnung: { code: 1 }, name: namen!.gemeinde }] : []),
          { bezeichnung: { code: 2 }, name: kreis.name },
        ]
      : [
          { bezeichnung: { freitext: "Standort" }, name: w.name },
          { bezeichnung: { freitext: "Landkreis" }, name: kreis.name },
        ];

  const tag = datumAusIso("2026-09-12") + ganz(0, 6);
  const stand = tag * MINUTEN_JE_TAG + ganz(6, 20) * 60 + ganz(0, 59);
  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    uebung: true, // Übungsbogen: Störer und PDF-Wasserzeichen
    stand,
    einheit: {
      organisation: o.typ,
      organisationName: org === "ff" ? `${o.name} ${namen!.gemeinde}` : hiorgName(w.name, o.name, kreis.name),
      einheitsTyp: { freitext: org === "ff" ? "Ortsfeuerwehr" : hiorgEinheit(w.name, org) },
      hierarchie,
    },
    einsatz: {
      zeitraumVon: tag,
      zeitraumBis: tag + ganz(0, 2),
      ortAuftrag: wahl(SZENARIO[org]).replaceAll("{kreis}", kreis.name),
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal,
    fahrzeuge,
    sofortbedarf: {
      verpflegungPersonen: personal.length,
      dieselLiter: fahrzeuge.reduce((s, x) => s + dieselFuer(x.typ.freitext ?? ""), 0),
      benzinLiter: 0,
      gemischLiter: fz.some(({ kurz }) => /^(TSF|LF 8|LF 10|MLF)/.test(kurz)) ? 10 : 0,
      unterbringung: wuerfel(0.3),
      ruhezeitErforderlich: false,
    },
    sonstiges: `Fahrzeuge, Funkrufnamen und Kennzeichen nach bos-fahrzeuge.info (Wache ${w.name}, Stand ${abgerufen}); alle Personen erfunden.`,
  };

  const kreisOrdner = `lk-${slug(kreis.name)}`;
  // „wache-" vorn: Daran erkennen Offline-Vorrat und Service Worker diese Bögen
  // (nur auf Abruf, wie die der THW-Ortsverbände; scripts/precache-aufteilung.ts).
  return { org, kreis: kreis.name, kreisOrdner, datei: `wache-${slug(w.name)}`, wache: w, bogen, besatzungen };
}

// ------------------------------------------------------------ Selbstprüfung

const NICHT_WINANSI = /[^ -~ -ÿ„“”‚‘’–—…•€]/u;

function pruefen(e: Ergebnis): string[] {
  const fehler: string[] = [];
  const name = `${e.kreisOrdner}/${e.datei}`;
  const fremd = NICHT_WINANSI.exec(JSON.stringify(e.bogen));
  if (fremd) fehler.push(`${name}: Zeichen „${fremd[0]}" nicht in WinAnsi`);
  for (const b of e.besatzungen) {
    if (b.plaetze != null && b.anzahl > b.plaetze) fehler.push(`${name}: ${b.kurz} ${b.anzahl} Personen auf ${b.plaetze} Plätzen`);
  }
  const bilanz = sitzplatzBilanz(e.bogen.fahrzeuge, [], e.bogen.personal.length);
  if (bilanz.fehlend > 0) fehler.push(`${name}: Sitzplatzbilanz fehlt ${bilanz.fehlend}`);
  const zurueck = decodePayload(encodePayload(e.bogen, nodeKompressor), nodeKompressor);
  if (staerke(zurueck).gesamt !== e.bogen.personal.length) fehler.push(`${name}: Codec-Roundtrip verliert Personal`);
  if (zurueck.fahrzeuge.length !== e.bogen.fahrzeuge.length) fehler.push(`${name}: Codec-Roundtrip verliert Fahrzeuge`);
  return fehler;
}

// ---------------------------------------------------------------- Hauptlauf

if (!existsSync(QUELLE)) {
  console.error(`${QUELLE} fehlt — zuerst: npm run quellen:bos-fahrzeuge`);
  process.exit(1);
}
const quelle = JSON.parse(readFileSync(QUELLE, "utf8")) as Momentaufnahme;

const ergebnisse: Ergebnis[] = [];
for (const w of quelle.wachen) {
  const org = orgSchluessel(w.organisation) ?? orgSchluessel(w.fahrzeuge.find((f) => orgSchluessel(f.organisation))?.organisation);
  if (!org) continue;
  if (AUSSER_DIENST.test(w.name)) continue; // aufgelöste Wache
  const e = bogenBauen(w, org, quelle.abgerufen);
  if (e) ergebnisse.push(e);
}

// Gleiche Dateinamen im selben Ordner: Kennung der Wache anhängen.
const belegt = new Map<string, number>();
for (const e of ergebnisse) {
  const k = `${e.org}/${e.kreisOrdner}/${e.datei}`;
  belegt.set(k, (belegt.get(k) ?? 0) + 1);
}
for (const e of ergebnisse) if ((belegt.get(`${e.org}/${e.kreisOrdner}/${e.datei}`) ?? 0) > 1) e.datei += `-${e.wache.id}`;

const fehler = ergebnisse.flatMap(pruefen);
if (fehler.length) {
  console.error(fehler.join("\n"));
  process.exit(1);
}

function zielOrdner(org: Org): string {
  return org === "ff"
    ? join(wurzel, "examples", "feuerwehr", "niedersachsen", "ortsfeuerwehren")
    : join(wurzel, "examples", ORG[org].ordner, "niedersachsen", "standorte");
}

const kreisLabel: Record<string, string> = {};
for (const org of Object.keys(ORG) as Org[]) {
  const basis = zielOrdner(org);
  rmSync(basis, { recursive: true, force: true });
  const eigene = ergebnisse.filter((e) => e.org === org);
  if (eigene.length === 0) continue;
  for (const e of eigene) {
    kreisLabel[e.kreisOrdner] = e.kreis;
    mkdirSync(join(basis, e.kreisOrdner), { recursive: true });
    writeFileSync(join(basis, e.kreisOrdner, `${e.datei}.json`), JSON.stringify(e.bogen, null, 2) + "\n");
  }
  const zeilen = eigene
    .sort((a, b) => a.kreis.localeCompare(b.kreis, "de") || a.wache.name.localeCompare(b.wache.name, "de"))
    .map((e) => {
      const s = staerke(e.bogen);
      const fz = e.bogen.fahrzeuge.map((f) => f.typ.freitext).join(", ");
      return `| ${e.kreis} | ${e.wache.name} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${fz} |`;
    });
  writeFileSync(
    join(basis, "README.md"),
    `# Übungsbögen — ${org === "ff" ? "Ortsfeuerwehren" : `Standorte ${ORG[org].kurz}`} in Niedersachsen

${eigene.length} Bögen realer ${org === "ff" ? "Ortsfeuerwehren" : "Standorte"} mit ihren Fahrzeugen, Funkrufnamen
und Kennzeichen nach der Wachen- und Fahrzeugdatenbank von
[bos-fahrzeuge.info](${quelle.quelle}) (Stand ${quelle.abgerufen}). Nur Fahrzeuge im
Dienst${org === "ff" ? "" : ", nur Katastrophenschutz (Obergruppe SEG/KatS)"}.

Die Besatzung folgt der Normbesatzung der Fahrzeuge (Gruppe 9, Staffel 6,
Trupp 3). Alle Personen und Rufnummern sind erfunden. Was in der Datenbank
fehlt oder veraltet ist, fehlt oder veraltet auch hier.

Neu erzeugen: \`npm run quellen:bos-fahrzeuge\` (Abruf), dann \`npm run beispiele:bos-nds\`.

| Landkreis | Wache | Stärke F/U/M/Σ | Fahrzeuge |
|---|---|---|---|
${zeilen.join("\n")}
`,
  );
}

// Anzeigenamen der Landkreis-Ordner für den Übungsbögen-Dialog.
const labelZeilen = Object.entries(kreisLabel)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
writeFileSync(
  join(wurzel, "src", "app", "beispiele-bos-ordner.ts"),
  `/**
 * Anzeigenamen der Landkreis-Ordner der Übungsbögen nach bos-fahrzeuge.info
 * (examples/<organisation>/niedersachsen/<ortsfeuerwehren|standorte>/lk-<landkreis>).
 *
 * GENERIERT — nicht von Hand bearbeiten.
 * Neu erzeugen mit:  npm run beispiele:bos-nds
 */

export const BOS_ORDNER_LABEL: Record<string, string> = {
${labelZeilen.join("\n")}
};
`,
);

const jeOrg = (Object.keys(ORG) as Org[]).map((o) => `${ORG[o].kurz} ${ergebnisse.filter((e) => e.org === o).length}`).join(", ");
console.log(`Fertig: ${ergebnisse.length} Bögen (${jeOrg}) aus ${quelle.wachen.length} Wachen`);
