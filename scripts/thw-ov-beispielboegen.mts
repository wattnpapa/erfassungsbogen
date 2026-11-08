/**
 * Erzeugt für jeden THW-Ortsverband einen Beispiel-Erfassungsbogen je Einheit
 * (Zugtrupps, Gruppen, Fachgruppen, Trupps) als JSON nach
 * examples/thw/ortsverbaende/<LV>/<RSt>/<OV>/. Wunsch aus Übungen: Jede
 * Einheit des eigenen OV (und der Nachbarn) als fertiger Übungsbogen, statt nur
 * 100 zufällig gewählte (die liegen weiter direkt in examples/thw/,
 * erzeugt von scripts/beispielboegen-pdf.mts).
 *
 * Aufruf (Node ≥ 22):
 *   npm run beispiele:thw-ov              Bögen aus der Quell-Momentaufnahme erzeugen
 *   npm run beispiele:thw-ov -- --abrufen  vorher die Einheitenliste neu abrufen
 *
 * Quelle der Einheiten je OV: https://thw.blafusel.de/ (inoffizielle OV-Karte,
 * dieselbe Quelle wie das OV-Verzeichnis in vendor/bos-vokabulare/src/thw-ov.ts).
 * Die Seite trägt je OV eine Liste von Einheiten-IDs (Namen ROT13-verschleiert).
 * --abrufen lädt sie und schreibt die Momentaufnahme nach
 * scripts/quellen/thw-ov-einheiten.json; ohne den Schalter läuft das Skript
 * offline und deterministisch aus dieser Datei.
 *
 * Konstruktion:
 *  - Zuordnung OV → Regionalstelle → Landesverband aus
 *    vendor/bos-vokabulare/src/thw-ov-regionalstruktur.ts.
 *  - Immer genau StAN-Stärke: Personal aus thw-stan-personal.ts, Fahrzeuge aus
 *    thw-stan-fahrzeuge.ts, keine Abweichungen, keine Helfer anderer OVs.
 *  - Alle Namen erfunden (Namens-Pools aus scripts/thw-beispiel-daten.ts),
 *    alle Rufnummern 555… (fakeTelefon). Zufall je OV aus einem Seed, der nur
 *    vom OV-Namen abhängt — ein neuer OV verschiebt die anderen nicht.
 *  - Funkrufnamen nach Taschenkarte THW-Funkrufnamen (02/2022): 1. TZ 21/22/
 *    (23 = 2. B)/24, 2. TZ 26/27/28, 3. TZ 71/72/73; Fachgruppen, Trupps und
 *    Fachzüge mit ihrer festen Kennzahl.
 *  - Bergungsgruppen mit Abstützsystem Holz (Kennung „ASH" auf der Karte)
 *    werden als B (ASH) erfasst.
 *
 * Dateinamen beginnen mit „ov-": Daran erkennt die Aufteilung des
 * Offline-Vorrats (scripts/precache-aufteilung.ts) diese Bögen und lädt sie
 * nicht vorab auf jedes Gerät (rund 3.700 Dateien) — sie kommen beim ersten
 * Öffnen aus dem Netz und bleiben danach im Cache. Die Ordnernamen tragen
 * „lv-", „rst-" und „ov-" vorn, damit sie nicht mit anderen Ordnern in
 * examples/ kollidieren; die Anzeigenamen schreibt das Skript nach
 * src/app/beispiele-thw-ov-ordner.ts.
 *
 * Am Ende läuft eine Selbstprüfung (StAN-Stärke, Funkrufnamen, Codec-Roundtrip
 * jedes Bogens, nur WinAnsi-Zeichen); examples/thw/ortsverbaende/README.md
 * bekommt eine Übersicht je Landesverband und Ortsverband.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  Erfassungsbogen,
  Ernaehrung as E,
  Fahrerlaubnis as FE,
  Fahrzeug,
  Geschlecht as G,
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
import { THW_EINHEITSTYPEN } from "@bos/vokabulare/thw";
import { THW_FAHRZEUG_KENNZAHLEN, teileinheitKennzahl } from "@bos/vokabulare/thw-funkrufnamen";
import { THW_STAN_FAHRZEUGE } from "@bos/vokabulare/thw-stan-fahrzeuge";
import { THW_STAN_PERSONAL } from "@bos/vokabulare/thw-stan-personal";
import { THW_ORTSVERBAENDE, type ThwOrtsverband } from "@bos/vokabulare/thw-ov";
import { THW_OV_REGIONALSTRUKTUR } from "@bos/vokabulare/thw-ov-regionalstruktur";
import { fakeTelefon } from "./fake-telefon";
import {
  KRAFTSTOFF,
  MIT_MOTORSAEGE,
  NACHNAMEN,
  OHNE_KENNZEICHEN,
  QUALI_POOL,
  SCHWERE_FAHRZEUGE,
  SZENARIO,
  VORNAMEN_M,
  VORNAMEN_W,
  ZUSATZ,
  hierarchieFuerOv,
  prng,
  slug,
} from "./thw-beispiel-daten";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUELLE_URL = "https://thw.blafusel.de/";
const QUELLE_DATEI = join(wurzel, "scripts", "quellen", "thw-ov-einheiten.json");
const AUSGABE = join(wurzel, "examples", "thw", "ortsverbaende");
const ORDNER_MODUL = join(wurzel, "src", "app", "beispiele-thw-ov-ordner.ts");

// ------------------------------------------------------------ Quelle abrufen

interface QuellOv {
  /** OV-Name wie auf der Karte (= THW_ORTSVERBAENDE[].name). */
  name: string;
  kurz: string;
  /** Einheiten-IDs der Karte in ihrer Reihenfolge (Zug-Überschriften inklusive). */
  einheiten: string[];
}

interface Quelle {
  quelle: string;
  abgerufen: string;
  ortsverbaende: QuellOv[];
}

const rot13 = (s: string): string =>
  s.replace(/[a-z]/gi, (c) => {
    const basis = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - basis + 13) % 26) + basis);
  });

async function quelleAbrufen(): Promise<Quelle> {
  const antwort = await fetch(QUELLE_URL, { headers: { "User-Agent": "erfassungsbogen-beispielgenerator" } });
  if (!antwort.ok) throw new Error(`${QUELLE_URL}: HTTP ${antwort.status}`);
  const html = await antwort.text();
  // createMarker(lat, lng, idx, ortsverband, strasse, ort, plz, telefon, fax, email, www, kurz, [einheiten])
  const muster =
    /createMarker\(\s*[-\d.]+,\s*[-\d.]+,\s*\d+,\s*"([^"]*)",\s*"[^"]*",\s*"[^"]*",\s*"[^"]*",\s*"[^"]*",\s*"[^"]*",\s*"[^"]*",\s*"[^"]*",\s*"([^"]*)",\s*\[([^\]]*)\]\)/g;
  const ortsverbaende: QuellOv[] = [];
  for (const m of html.matchAll(muster)) {
    ortsverbaende.push({
      name: rot13(m[1]!),
      kurz: rot13(m[2]!),
      einheiten: [...m[3]!.matchAll(/"(\d+)"/g)].map((t) => t[1]!),
    });
  }
  if (ortsverbaende.length < 600) throw new Error(`Nur ${ortsverbaende.length} OVs erkannt — Seitenaufbau geändert?`);
  ortsverbaende.sort((a, b) => a.name.localeCompare(b.name, "de"));
  return { quelle: QUELLE_URL, abgerufen: new Date().toISOString().slice(0, 10), ortsverbaende };
}

// ---------------------------------------------- Karten-IDs → THW-Einheitstypen

/**
 * Einheiten-IDs der Karte → Einheitstyp-Code (THW_EINHEITSTYPEN). Zug-
 * Überschriften (0/1/2/39, 36, 37), die ID 46 (Zugtrupp, je nach Zug) sowie 3
 * (ASH) und 17 (FGr Öl ohne Typ) behandelt einheitenAusQuelle gesondert.
 */
const KARTE_ZU_TYP: Record<string, number> = {
  "4": 4, // Bergungsgruppe
  "5": 23, // FGr Bergungstauchen
  "6": 11, // FGr Brückenbau
  "7": 25, // FGr Elektroversorgung
  "8": 42, // FGr Führungsunterstützung
  "10": 24, // FGr Infrastruktur
  "11": 43, // FGr Kommunikation (A)
  "13": 44, // FGr Kommunikation (B)
  "14": 37, // FGr Logistik-Materialwirtschaft
  "15": 38, // FGr Logistik-Verpflegung
  "16": 16, // FGr Notversorgung und Notinstandsetzung
  "18": 30, // FGr Ölschaden Typ A
  "19": 31, // FGr Ölschaden Typ B
  "20": 32, // FGr Ölschaden Typ C
  "21": 12, // FGr Ortung (A)
  "22": 13, // FGr Ortung (B)
  "23": 14, // FGr Ortung (C)
  "24": 6, // FGr Räumen (A)
  "25": 7, // FGr Räumen (B)
  "26": 8, // FGr Räumen (C)
  "27": 18, // FGr Schwere Bergung (A)
  "28": 19, // FGr Schwere Bergung (B)
  "29": 15, // FGr Sprengen
  "30": 26, // FGr Trinkwasserversorgung
  "31": 9, // FGr Wassergefahren (A)
  "32": 10, // FGr Wassergefahren (B)
  "33": 27, // FGr Wasserschaden/Pumpen (A)
  "34": 28, // FGr Wasserschaden/Pumpen (B)
  "35": 29, // FGr Wasserschaden/Pumpen (C)
  "40": 20, // Tr Einsatzstellensicherung
  "41": 21, // Tr Mobiler Hochwasserpegel
  "42": 39, // Tr Logistik-Schwerer Transport
  "43": 22, // Tr Unbemannte Luftfahrtsysteme
  "45": 41, // Zugtrupp FZ FK
};

type Zug = { art: "tz"; nr: number } | { art: "fk" } | { art: "log" };

interface OvEinheit {
  typ: number;
  zug: Zug;
}

function einheitenAusQuelle(ov: QuellOv): { einheiten: OvEinheit[]; unbekannt: string[] } {
  const einheiten: OvEinheit[] = [];
  const unbekannt: string[] = [];
  let zug: Zug | null = null;
  let tzZaehler = 0;
  const tz = (nr: number): Zug => ({ art: "tz", nr });
  for (const id of ov.einheiten) {
    switch (id) {
      case "0":
      case "1":
      case "2":
        tzZaehler = Number(id) + 1;
        zug = tz(tzZaehler);
        continue;
      case "39": // „Technischer Zug" ohne Nummer
        zug = tz(++tzZaehler);
        continue;
      case "36":
        zug = { art: "fk" };
        continue;
      case "37": // Fachzug Logistik; die Karte wiederholt die Überschrift nach dem Zugtrupp
        if (zug?.art !== "log") zug = { art: "log" };
        continue;
      case "17": // „FGr Ölschaden, allgemein" — Typ folgt als 18/19/20
        continue;
      case "46":
        if (zug?.art === "log") {
          einheiten.push({ typ: 36, zug });
        } else {
          if (zug?.art !== "tz") zug = tz(++tzZaehler);
          einheiten.push({ typ: 3, zug });
        }
        continue;
      case "3": {
        // Abstützsystem Holz: macht die Bergungsgruppe davor zur B (ASH).
        if (zug?.art !== "tz") zug = tz(++tzZaehler);
        const davor = einheiten[einheiten.length - 1];
        if (davor && davor.typ === 4 && davor.zug === zug) davor.typ = 5;
        else einheiten.push({ typ: 5, zug });
        continue;
      }
    }
    const typ = KARTE_ZU_TYP[id];
    if (typ == null) {
      unbekannt.push(id);
      continue;
    }
    if (typ === 41) zug = { art: "fk" };
    if (zug == null) zug = tz(++tzZaehler);
    einheiten.push({ typ, zug });
  }
  return { einheiten, unbekannt };
}

function zugText(zug: Zug): string {
  if (zug.art === "fk") return "Fachzug Führung/Kommunikation";
  if (zug.art === "log") return "Fachzug Logistik";
  return `${zug.nr}. Technischer Zug`;
}

function zugKurz(zug: Zug): string {
  if (zug.art === "fk") return "fz-fk";
  if (zug.art === "log") return "fz-log";
  return `${zug.nr}-tz`;
}

/**
 * Erste Zahl des Funkrufnamens. Taschenkarte: 1. TZ 21 (ZTr), 22 (B), 23
 * (2. B), 24 (FGr N); 2. TZ 26/27/28; 3. TZ als „sonstige Einheit" 71
 * (Führungstrupp), 72 (1. Gruppe), 73 (2. Gruppe). Alles andere hat eine feste
 * Kennzahl je Einheitstyp.
 */
function teileinheit(typ: number, zug: Zug, zweiteB: boolean): number | undefined {
  const basis = teileinheitKennzahl(typ);
  if (zug.art !== "tz") return basis;
  const istB = typ === 4 || typ === 5;
  if (zug.nr === 1) {
    if (istB && zweiteB) return 23;
    return istB ? 22 : basis;
  }
  if (zug.nr === 2) {
    if (typ === 3) return 26;
    if (istB) return zweiteB ? 73 : 27;
    if (typ === 16) return 28;
    return basis;
  }
  if (typ === 3) return 71;
  if (istB) return zweiteB ? 73 : 72;
  if (typ === 16) return 73;
  return basis;
}

// ------------------------------------------------------------ Bogen bauen

function seedAus(text: string): number {
  let h = 0x811c9dc5;
  for (const c of text) {
    h ^= c.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

interface Zufall {
  rnd: () => number;
  ganz: (min: number, max: number) => number;
  wuerfel: (p: number) => boolean;
  wahl: <T>(arr: readonly T[]) => T;
  gewichtet: <T>(paare: readonly (readonly [T, number])[]) => T;
}

function zufall(seed: number): Zufall {
  const rnd = prng(seed);
  return {
    rnd,
    ganz: (min, max) => min + Math.floor(rnd() * (max - min + 1)),
    wuerfel: (p) => rnd() < p,
    wahl: (arr) => arr[Math.floor(rnd() * arr.length)]!,
    gewichtet: (paare) => {
      const summe = paare.reduce((s, [, g]) => s + g, 0);
      let r = rnd() * summe;
      for (const [wert, g] of paare) {
        r -= g;
        if (r <= 0) return wert;
      }
      return paare[paare.length - 1]![0];
    },
  };
}

const mobilnummer = (z: Zufall): string =>
  fakeTelefon(`01${z.ganz(5, 7)}${z.ganz(1, 9)}${String(z.ganz(0, 9999999)).padStart(7, "0")}`);

/** StAN-Personal mit erfundenen Namen; Namen innerhalb eines OV eindeutig. */
function personalBauen(typ: number, z: Zufall, vergeben: Set<string>): Person[] {
  const personen: Person[] = [];
  for (const platz of THW_STAN_PERSONAL[typ] ?? []) {
    for (let i = 0; i < platz.anzahl; i++) {
      const g = z.wuerfel(0.22) ? G.W : G.M;
      let vorname = "";
      let nachname = "";
      let versuche = 0;
      do {
        vorname = z.wahl(g === G.W ? VORNAMEN_W : VORNAMEN_M);
        nachname = z.wahl(NACHNAMEN);
      } while (vergeben.has(`${vorname} ${nachname}`) && ++versuche < 200);
      vergeben.add(`${vorname} ${nachname}`);
      const fuehrung = platz.staerkeRolle !== R.MANNSCHAFT;
      const person: Person = {
        vorname,
        nachname,
        staerkeRolle: platz.staerkeRolle,
        funktionen: [{ code: platz.funktion ?? 5 }],
        fahrerlaubnis: fuehrung
          ? z.gewichtet<FE>([[FE.CE, 5], [FE.C, 4], [FE.B, 1]])
          : z.gewichtet<FE>([[FE.NONE, 7], [FE.B, 6], [FE.C, 4], [FE.CE, 3]]),
        geschlecht: g,
        ernaehrung: z.gewichtet<E>([[E.FLEISCH, 78], [E.VEGETARISCH, 15], [E.VEGAN, 7]]),
        kontakte: [],
        zusatzqualifikationen: z.wuerfel(0.1) ? [{ freitext: z.wahl(QUALI_POOL) }] : [],
      };
      // Führungskraft und zweite Führungskraft (zu 60 %) mit Mobilnummer.
      const fuehrungBisher = personen.filter((p) => p.staerkeRolle !== R.MANNSCHAFT).length;
      if (fuehrung && (fuehrungBisher === 0 || (fuehrungBisher === 1 && z.wuerfel(0.6)))) {
        person.kontakte.push({ art: KontaktArt.MOBIL, dienstlich: false, wert: mobilnummer(z) });
      }
      personen.push(person);
    }
  }
  const zusatz = ZUSATZ[typ];
  if (zusatz) {
    const helfer = personen.filter((p) => p.staerkeRolle === R.MANNSCHAFT);
    zusatz.pflicht.forEach((code, i) => {
      const ziel = helfer[i % Math.max(1, helfer.length)];
      if (ziel && !ziel.funktionen.some((f) => f.code === code)) ziel.funktionen.push({ code });
    });
    for (const p of personen) {
      if (z.wuerfel(0.3)) {
        const code = z.wahl(zusatz.pool);
        if (!p.funktionen.some((f) => f.code === code)) p.funktionen.push({ code });
      }
    }
  }
  return personen;
}

let naechstesKennzeichen = 60001;

function fahrzeugeBauen(typ: number, teil: number | undefined): Fahrzeug[] {
  const fahrzeuge: Fahrzeug[] = [];
  for (const vorgabe of THW_STAN_FAHRZEUGE[typ] ?? []) {
    for (let i = 0; i < vorgabe.anzahl; i++) {
      const fz: Fahrzeug = { typ: { ...vorgabe.typ }, stanKonform: true };
      const code = vorgabe.typ.code;
      fz.kennzeichen =
        code != null && OHNE_KENNZEICHEN[code]
          ? OHNE_KENNZEICHEN[code]
          : `THW-${String(naechstesKennzeichen++).padStart(5, "0")}`;
      const kennzahl = vorgabe.kennzahlen?.[i];
      if (teil != null && kennzahl != null) {
        fz.funkrufname = { kennwort: { code: 1 }, eigenerStandort: true, teile: [teil, kennzahl] };
      }
      fahrzeuge.push(fz);
    }
  }
  return fahrzeuge;
}

/** Übungstag: Samstag, 19. September 2026 (eine Übung, alle Einheiten). */
const UEBUNGSTAG = datumAusIso("2026-09-19");

function bogenBauen(
  ov: ThwOrtsverband,
  einheit: OvEinheit,
  teil: number | undefined,
  z: Zufall,
  namen: Set<string>,
): Erfassungsbogen {
  const personal = personalBauen(einheit.typ, z, namen);
  const fahrzeuge = fahrzeugeBauen(einheit.typ, teil);
  if (
    fahrzeuge.some((f) => f.typ.code != null && SCHWERE_FAHRZEUGE.has(f.typ.code)) &&
    !personal.some((p) => p.fahrerlaubnis === FE.CE)
  ) {
    personal[personal.length - 1]!.fahrerlaubnis = FE.CE;
  }
  let diesel = 0;
  let benzin = 0;
  for (const fz of fahrzeuge) {
    const [d, b] = fz.typ.code != null ? KRAFTSTOFF[fz.typ.code] ?? [0, 0] : [0, 0];
    diesel += d;
    benzin += b;
  }
  const dauer = z.ganz(0, 1);
  const szenario = z.wahl(SZENARIO[einheit.typ] ?? ["Einsatz {ort}"]).replaceAll("{ort}", ov.ort);
  return {
    schemaVersion: SCHEMA_VERSION,
    uebung: true,
    stand: UEBUNGSTAG * MINUTEN_JE_TAG + z.ganz(6, 8) * 60 + z.ganz(0, 59),
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: einheit.typ },
      hierarchie: hierarchieFuerOv(ov),
    },
    einsatz: {
      zeitraumVon: UEBUNGSTAG,
      zeitraumBis: UEBUNGSTAG + dauer,
      ortAuftrag: `Übung: ${szenario} (${zugText(einheit.zug)})`,
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal,
    fahrzeuge,
    sofortbedarf: {
      verpflegungPersonen: personal.length,
      dieselLiter: diesel,
      benzinLiter: benzin,
      gemischLiter: MIT_MOTORSAEGE.has(einheit.typ) ? 5 : 0,
      unterbringung: dauer >= 1,
      ruhezeitErforderlich: false,
    },
  };
}

// ------------------------------------------------------------ Selbstprüfung

const KENNZAHLEN_2 = new Set(THW_FAHRZEUG_KENNZAHLEN.map((k) => k.kennzahl));
/** Zeichen, die die PDF-Schrift (WinAnsi) darstellen kann — grob: Latin-1 plus „“–…»«. */
const NICHT_WINANSI = /[^ -~ -ÿ„“”‚‘’–—…•€]/u;

function pruefen(datei: string, b: Erfassungsbogen): string[] {
  const fehler: string[] = [];
  const soll = (THW_STAN_PERSONAL[b.einheit.einheitsTyp.code!] ?? []).reduce((s, p) => s + p.anzahl, 0);
  if (b.personal.length !== soll) fehler.push(`${datei}: Stärke ${b.personal.length} ≠ StAN ${soll}`);
  const belegt = new Set<string>();
  for (const fz of b.fahrzeuge) {
    const fr = fz.funkrufname;
    if (!fr) continue;
    const [, kfz] = fr.teile as [number, number];
    if (!KENNZAHLEN_2.has(kfz)) fehler.push(`${datei}: Fahrzeug-Kennzahl ${kfz} unbekannt`);
    const schluessel = fr.teile.join("/");
    if (belegt.has(schluessel)) fehler.push(`${datei}: Funkrufname ${schluessel} doppelt`);
    belegt.add(schluessel);
  }
  const text = JSON.stringify(b);
  const fremd = NICHT_WINANSI.exec(text);
  if (fremd) fehler.push(`${datei}: Zeichen „${fremd[0]}" nicht in WinAnsi`);
  const zurueck = decodePayload(encodePayload(b, nodeKompressor), nodeKompressor);
  if (staerke(zurueck).gesamt !== b.personal.length) fehler.push(`${datei}: Codec-Roundtrip verliert Personal`);
  if (zurueck.fahrzeuge.length !== b.fahrzeuge.length) fehler.push(`${datei}: Codec-Roundtrip verliert Fahrzeuge`);
  return fehler;
}

// ---------------------------------------------------------------- Hauptlauf

const quelle: Quelle = process.argv.includes("--abrufen")
  ? await quelleAbrufen()
  : (JSON.parse(readFileSync(QUELLE_DATEI, "utf8")) as Quelle);
if (process.argv.includes("--abrufen")) {
  mkdirSync(dirname(QUELLE_DATEI), { recursive: true });
  writeFileSync(
    QUELLE_DATEI,
    `{\n  "quelle": ${JSON.stringify(quelle.quelle)},\n  "abgerufen": ${JSON.stringify(quelle.abgerufen)},\n  "ortsverbaende": [\n` +
      quelle.ortsverbaende.map((o) => `    ${JSON.stringify(o)}`).join(",\n") +
      "\n  ]\n}\n",
  );
  console.log(`Quelle abgerufen: ${quelle.ortsverbaende.length} OVs → scripts/quellen/thw-ov-einheiten.json`);
}

const ovNachName = new Map(THW_ORTSVERBAENDE.map((o) => [o.name, o]));
const typKurz = (code: number): string => THW_EINHEITSTYPEN.find((t) => t.code === code)!.kurz;

rmSync(AUSGABE, { recursive: true, force: true });

const labels = new Map<string, string>();
const fehler: string[] = [];
const warnungen: string[] = [];
interface OvZeile {
  lv: string;
  rst: string;
  ov: string;
  einheiten: string[];
  personen: number;
}
const zeilen: OvZeile[] = [];
let anzahlBoegen = 0;
const jeTyp = new Map<number, number>();

for (const q of quelle.ortsverbaende) {
  const ov = ovNachName.get(q.name);
  if (!ov) {
    warnungen.push(`OV „${q.name}" fehlt im OV-Verzeichnis — übersprungen`);
    continue;
  }
  const struktur = THW_OV_REGIONALSTRUKTUR[ov.name];
  if (!struktur) {
    warnungen.push(`OV „${ov.name}" ohne Regionalstelle/Landesverband — übersprungen`);
    continue;
  }
  const { einheiten, unbekannt } = einheitenAusQuelle(q);
  if (unbekannt.length > 0) warnungen.push(`OV „${ov.name}": unbekannte Karten-IDs ${unbekannt.join(", ")}`);
  if (einheiten.length === 0) {
    warnungen.push(`OV „${ov.name}": keine Einheiten auf der Karte — übersprungen`);
    continue;
  }
  const lvOrdner = `lv-${slug(struktur.landesverband)}`;
  const rstOrdner = `rst-${slug(struktur.regionalstelle)}`;
  const ovOrdner = `ov-${slug(ov.name)}`;
  labels.set(lvOrdner, struktur.landesverband);
  labels.set(rstOrdner, `RSt ${struktur.regionalstelle}`);
  labels.set(ovOrdner, `OV ${ov.name}`);
  const verzeichnis = join(AUSGABE, lvOrdner, rstOrdner, ovOrdner);
  mkdirSync(verzeichnis, { recursive: true });

  const z = zufall(seedAus(ov.name));
  const namen = new Set<string>();
  const bInZug = new Map<string, number>();
  let personen = 0;
  einheiten.forEach((e, i) => {
    let zweiteB = false;
    if (e.typ === 4 || e.typ === 5) {
      const k = zugKurz(e.zug);
      const n = (bInZug.get(k) ?? 0) + 1;
      bInZug.set(k, n);
      zweiteB = n >= 2;
    }
    const bogen = bogenBauen(ov, e, teileinheit(e.typ, e.zug, zweiteB), z, namen);
    const datei = `ov-${slug(ov.name)}-${String(i + 1).padStart(2, "0")}-${zugKurz(e.zug)}-${slug(typKurz(e.typ))}`;
    fehler.push(...pruefen(datei, bogen));
    writeFileSync(join(verzeichnis, `${datei}.json`), JSON.stringify(bogen) + "\n");
    personen += bogen.personal.length;
    anzahlBoegen++;
    jeTyp.set(e.typ, (jeTyp.get(e.typ) ?? 0) + 1);
  });
  zeilen.push({
    lv: struktur.landesverband,
    rst: struktur.regionalstelle,
    ov: ov.name,
    einheiten: einheiten.map((e) => (e.zug.art === "tz" ? `${typKurz(e.typ)} (${e.zug.nr}. TZ)` : typKurz(e.typ))),
    personen,
  });
}

if (fehler.length > 0) throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.slice(0, 50).join("\n  ")}`);

// Anzeigenamen der Ordner für den Beispielbögen-Dialog.
const labelZeilen = [...labels.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
writeFileSync(
  ORDNER_MODUL,
  `/**
 * Anzeigenamen der Ordner unter examples/thw/ortsverbaende/ (Landesverband,
 * Regionalstelle, Ortsverband) für den Beispielbögen-Dialog.
 *
 * GENERIERT — nicht von Hand bearbeiten.
 * Neu erzeugen mit:  npm run beispiele:thw-ov
 */

export const THW_OV_ORDNER_LABEL: Record<string, string> = {
${labelZeilen.join("\n")}
};
`,
);

// Übersicht.
zeilen.sort((a, b) => a.lv.localeCompare(b.lv, "de") || a.rst.localeCompare(b.rst, "de") || a.ov.localeCompare(b.ov, "de"));
const jeLv = new Map<string, { ovs: number; boegen: number; personen: number }>();
for (const zz of zeilen) {
  const s = jeLv.get(zz.lv) ?? { ovs: 0, boegen: 0, personen: 0 };
  s.ovs++;
  s.boegen += zz.einheiten.length;
  s.personen += zz.personen;
  jeLv.set(zz.lv, s);
}
const typZeilen = [...jeTyp.entries()]
  .sort((a, b) => b[1] - a[1] || a[0] - b[0])
  .map(([code, n]) => `| ${typKurz(code)} | ${n} |`);
writeFileSync(
  join(AUSGABE, "README.md"),
  `# Alle THW-Einheiten aller Ortsverbände

Für Übungen: je Einheit eines Ortsverbands ein Beispiel-Erfassungsbogen,
gegliedert nach Landesverband › Regionalstelle › Ortsverband — zusätzlich zu den
100 fiktiven Einheiten eine Ebene höher. ${anzahlBoegen} Bögen aus ${zeilen.length}
Ortsverbänden.

- Einheiten je OV: [thw.blafusel.de](${QUELLE_URL}) (inoffizielle OV-Karte), Stand
  ${quelle.abgerufen}, Momentaufnahme in \`scripts/quellen/thw-ov-einheiten.json\`.
  Die Karte kann vom tatsächlichen Stand eines OV abweichen.
- Zuordnung OV → Regionalstelle → Landesverband aus \`thw-ov-regionalstruktur.ts\`.
- Immer genau StAN-Stärke (Personal und Fahrzeuge), keine Abweichungen.
- Alle Personen erfunden, alle Rufnummern beginnen mit 555. Alle Bögen sind als
  Übung gekennzeichnet (Übungstag 19.09.2026).
- Funkrufnamen nach Taschenkarte THW-Funkrufnamen (02/2022): 1. TZ 21/22/23/24,
  2. TZ 26/27/28, 3. TZ 71/72/73, sonst die feste Kennzahl der Einheit.
- Bergungsgruppen mit Abstützsystem Holz stehen als B (ASH) im Bogen.

Neu erzeugen mit \`npm run beispiele:thw-ov\` (deterministisch);
\`npm run beispiele:thw-ov -- --abrufen\` lädt vorher die Einheitenliste neu.

Die Dateien beginnen mit \`ov-\` und gehören nicht zum automatischen
Offline-Vorrat der Web-App: Ein Bogen wird beim ersten Öffnen geladen und
bleibt danach auf dem Gerät.

## Landesverbände

| Landesverband | OVs | Bögen | Helfer |
|---|---|---|---|
${[...jeLv.entries()].map(([lv, s]) => `| ${lv} | ${s.ovs} | ${s.boegen} | ${s.personen} |`).join("\n")}

## Einheitstypen

| Einheit | Anzahl |
|---|---|
${typZeilen.join("\n")}

## Ortsverbände

| Landesverband | Regionalstelle | Ortsverband | Einheiten |
|---|---|---|---|
${zeilen.map((zz) => `| ${zz.lv} | ${zz.rst} | ${zz.ov} | ${zz.einheiten.join(", ")} |`).join("\n")}
`,
);

for (const w of warnungen) console.warn(`Hinweis: ${w}`);
console.log(`\nFertig: ${anzahlBoegen} Bögen aus ${zeilen.length} OVs in examples/thw/ortsverbaende/ (+ README.md)`);
for (const [lv, s] of jeLv) console.log(`  ${lv}: ${s.ovs} OVs, ${s.boegen} Bögen`);
