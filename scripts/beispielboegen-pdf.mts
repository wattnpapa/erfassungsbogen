/**
 * Erzeugt den Stress-Test-Bogen „Verstärkter Bergungszug" als JSON nach
 * examples/thw/: bewusst so groß, dass er nicht in einen einzelnen QR-Code
 * passt und die Segmentierung greift. Abgelegt wird nur der Bogen selbst; die
 * PDF entsteht erst beim Anklicken in der App aus dem jeweils aktuellen Layout.
 *
 * Bis 11/2026 erzeugte dieses Skript zusätzlich 100 zufällig gewählte
 * Beispiel-Einheiten. Sie sind entfallen: Die Übungsbögen aller Einheiten
 * aller Ortsverbände (scripts/thw-ov-beispielboegen.mts, examples/thw/
 * ortsverbaende/) decken sie ab.
 *
 * Aufruf (Node ≥ 22): npm run beispiele   (deterministisch, fester Zufalls-Seed)
 *
 * Funkrufnamen nach Taschenkarte THW-Funkrufnamen (02/2022). Am Ende läuft
 * eine Selbstprüfung (Funkrufnamen-Regeln, QR-Roundtrip, Segmentierung);
 * examples/thw/README.md bekommt eine Übersichtstabelle.
 */

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import QRCode from "qrcode";
import {
  Erfassungsbogen,
  Ernaehrung as E,
  Fahrerlaubnis as FE,
  Fahrzeug,
  Funkrufname,
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
import {
  EEB_URL_PREFIX,
  QR_EINZEL_MAX_VERSION,
  QR_SEGMENT_ZIEL_VERSION,
  base64UrlDekodieren,
  base64UrlKodieren,
  decodePayload,
  encodePayload,
  parseSegmentUrl,
  segmentPayloadUrls,
} from "@bos/eeb-format/codec";
import { nodeKompressor } from "@bos/eeb-format/qr-node";
import { fakeTelefon } from "./fake-telefon";
import {
  NACHNAMEN,
  QUALI_POOL,
  VORNAMEN_M,
  VORNAMEN_W,
  hierarchieFuerOv,
  prng,
} from "./thw-beispiel-daten";
import type { QrSatz, QrTeil } from "../src/app/hilfen";
import { THW_EINHEITSTYPEN } from "@bos/vokabulare/thw";
import {
  THW_FAHRZEUG_KENNZAHLEN,
  THW_TEILEINHEIT_KENNZAHLEN,
  teileinheitKennzahl,
} from "@bos/vokabulare/thw-funkrufnamen";
import { THW_ORTSVERBAENDE, type ThwOrtsverband } from "@bos/vokabulare/thw-ov";
import { THW_OV_REGIONALSTRUKTUR } from "@bos/vokabulare/thw-ov-regionalstruktur";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");

// ------------------------------------------------------------ Zufall (seeded)

const rnd = prng(20260714);

const ganz = (minInkl: number, maxInkl: number): number =>
  minInkl + Math.floor(rnd() * (maxInkl - minInkl + 1));
const wuerfel = (p: number): boolean => rnd() < p;
const wahl = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
/** Gewichtete Auswahl: `paare` = [Wert, Gewicht]. */
function gewichtet<T>(paare: readonly (readonly [T, number])[]): T {
  const summe = paare.reduce((s, [, g]) => s + g, 0);
  let r = rnd() * summe;
  for (const [wert, g] of paare) {
    r -= g;
    if (r <= 0) return wert;
  }
  return paare[paare.length - 1]![0];
}


// --------------------------------------------------------------- Kurzhelfer

const typEintrag = (code: number) => THW_EINHEITSTYPEN.find((t) => t.code === code)!;


// ------------------------------------------------------- Personal generieren

interface PersonenFabrik {
  neu: (rolle: R, funktion: number | undefined, kontakt: boolean) => Person;
}

/** Namens-Fabrik je Bogen: eindeutige Namen, plausible Attribute. */
function personenFabrik(): PersonenFabrik {
  const vergeben = new Set<string>();
  return {
    neu: (rolle, funktion, kontakt) => {
      const g = wuerfel(0.22) ? G.W : G.M;
      let vorname = "";
      let nachname = "";
      do {
        vorname = wahl(g === G.W ? VORNAMEN_W : VORNAMEN_M);
        nachname = wahl(NACHNAMEN);
      } while (vergeben.has(`${vorname} ${nachname}`));
      vergeben.add(`${vorname} ${nachname}`);

      const fe =
        rolle === R.FUEHRER || rolle === R.UNTERFUEHRER
          ? gewichtet<FE>([[FE.CE, 5], [FE.C, 4], [FE.B, 1]])
          : gewichtet<FE>([[FE.NONE, 7], [FE.B, 6], [FE.C, 4], [FE.CE, 3]]);

      const person: Person = {
        vorname,
        nachname,
        staerkeRolle: rolle,
        funktionen: funktion != null ? [{ code: funktion }] : [{ code: 5 }],
        fahrerlaubnis: fe,
        geschlecht: g,
        ernaehrung: gewichtet<E>([[E.FLEISCH, 78], [E.VEGETARISCH, 15], [E.VEGAN, 7]]),
        kontakte: [],
        zusatzqualifikationen: wuerfel(0.1) ? [{ freitext: wahl(QUALI_POOL) }] : [],
      };
      if (kontakt) {
        person.kontakte.push({
          art: KontaktArt.MOBIL,
          dienstlich: false,
          wert: fakeTelefon(`01${ganz(5, 7)}${ganz(1, 9)}${String(ganz(0, 9999999)).padStart(7, "0")}`),
        });
      }
      return person;
    },
  };
}


// ------------------------------------------------------ Fahrzeuge generieren

let naechstesKennzeichen = 80101;

/** THW-Kennzeichen in der Schreibweise am Fahrzeug: 84397 → "THW-84397". */
function thwKennzeichen(nummer: number): string {
  return `THW-${String(nummer).padStart(5, "0")}`;
}


// ------------------------------------------- Helfer aus anderen Ortsverbänden

/**
 * Nachbar-Ortsverbände: dieselbe Regionalstelle, sonst derselbe Landesverband.
 * Von dort kommen im Einsatz die Helfer, die eine Einheit auffüllen.
 */
function nachbarOvs(ov: ThwOrtsverband): ThwOrtsverband[] {
  const eigene = THW_OV_REGIONALSTRUKTUR[ov.name];
  const gleicheRst = THW_ORTSVERBAENDE.filter(
    (o) => o.name !== ov.name && THW_OV_REGIONALSTRUKTUR[o.name]?.regionalstelle === eigene?.regionalstelle,
  );
  if (gleicheRst.length > 0) return gleicheRst;
  const gleicherLv = THW_ORTSVERBAENDE.filter(
    (o) => o.name !== ov.name && THW_OV_REGIONALSTRUKTUR[o.name]?.landesverband === eigene?.landesverband,
  );
  return gleicherLv.length > 0 ? gleicherLv : THW_ORTSVERBAENDE.filter((o) => o.name !== ov.name);
}


// -------------------------------------------------------- Bogen zusammensetzen

interface BeispielBogen {
  datei: string;
  bogen: Erfassungsbogen;
  ov: ThwOrtsverband;
  landesverband: string;
  abweichung: string; // "—" = StAN-Soll
}


// --------------------------------------- Stress-Test: sehr großer Bogen (QR-Segmentierung)

/**
 * "Verstärkter Bergungszug" — bewusst überfüllt (40 Personen mit Kontakten und
 * Qualifikationen, 10 Fahrzeuge, lange Freitexte), damit der Payload nicht in
 * einen einzelnen QR-Code passt und die Segmentierung greift (Sammel-Scan zum
 * Ausprobieren). Funkrufnamen nach Taschenkarte für sonstige Einheiten
 * (z. B. 3. TZ): 71 = Führungstrupp, 72 = 1. Gruppe, 73 = 2. Gruppe.
 */
function grossbogenBauen(): BeispielBogen {
  const ov = THW_ORTSVERBAENDE.find((o) => o.name.startsWith("Oldenburg")) ?? THW_ORTSVERBAENDE[0]!;
  const fabrik = personenFabrik();
  const personal: Person[] = [fabrik.neu(R.FUEHRER, 1, true), fabrik.neu(R.UNTERFUEHRER, 2, true)];
  for (let gruppe = 0; gruppe < 4; gruppe++) {
    personal.push(fabrik.neu(R.UNTERFUEHRER, 3, true));
    personal.push(fabrik.neu(R.UNTERFUEHRER, 4, false));
    for (let i = 0; i < 7; i++) personal.push(fabrik.neu(R.MANNSCHAFT, undefined, false));
  }
  // Datenmenge über das QR-Budget treiben: Zusatzfunktionen, Qualifikationen,
  // Mobilnummern für alle.
  // Auch hier Helfer aus Nachbar-Ortsverbänden: ein verstärkter Zug wird aus
  // mehreren OVs zusammengestellt — vier Helfer tragen einen fremden OV.
  const fremdeOvs = nachbarOvs(ov);
  [5, 12, 20, 33].forEach((index, i) => {
    personal[index]!.dienststelle = fremdeOvs[i % fremdeOvs.length]!.name;
  });
  const zusatzPool = [30, 31, 32, 36, 38, 41, 49, 51, 67];
  personal.forEach((p, i) => {
    const code = zusatzPool[i % zusatzPool.length]!;
    if (!p.funktionen.some((f) => f.code === code)) p.funktionen.push({ code });
    p.zusatzqualifikationen = [
      { freitext: QUALI_POOL[i % QUALI_POOL.length]! },
      { freitext: QUALI_POOL[(i + 4) % QUALI_POOL.length]! },
    ];
    if (p.kontakte.length === 0) {
      p.kontakte.push({
        art: KontaktArt.MOBIL,
        dienstlich: false,
        wert: fakeTelefon(`01701${String(230000 + i).padStart(6, "0")}`),
      });
    }
  });

  const fr = (teile: [number, number]): Funkrufname =>
    ({ kennwort: { code: 1 }, eigenerStandort: true, teile });
  const fahrzeuge: Fahrzeug[] = [
    { typ: { code: 24 }, kennzeichen: thwKennzeichen(naechstesKennzeichen++), funkrufname: fr([71, 25]), stanKonform: true }, // MTW gl Führungstrupp
    { typ: { code: 4 }, kennzeichen: thwKennzeichen(naechstesKennzeichen++), funkrufname: fr([72, 51]), stanKonform: true }, // GKW 1. Gruppe
    { typ: { freitext: "MzKW" }, kennzeichen: thwKennzeichen(naechstesKennzeichen++), funkrufname: fr([72, 54]), stanKonform: false, aenderungen: "OV-eigenes Fahrzeug, zusätzlich zur StAN" },
    { typ: { code: 16 }, kennzeichen: "Kettenbagger 8 t (Mietgerät)", funkrufname: fr([72, 71]), stanKonform: false, aenderungen: "Mietgerät — Tiltrotator und Abbruchgreifer" },
    { typ: { code: 4 }, kennzeichen: thwKennzeichen(naechstesKennzeichen++), funkrufname: fr([73, 51]), stanKonform: true }, // GKW 2. Gruppe
    { typ: { code: 7 }, kennzeichen: thwKennzeichen(naechstesKennzeichen++), funkrufname: fr([73, 61]), stanKonform: true }, // LKW Kipper 2. Gruppe
    { typ: { code: 8 }, kennzeichen: thwKennzeichen(naechstesKennzeichen++), funkrufname: fr([71, 43]), stanKonform: true, aenderungen: "Materialtransport Schwere Bergung, Ladebordwand" },
    { typ: { code: 45 }, kennzeichen: thwKennzeichen(naechstesKennzeichen++), stanKonform: true, aenderungen: "Tieflader für Bagger" },
    { typ: { code: 47 }, kennzeichen: thwKennzeichen(naechstesKennzeichen++), stanKonform: true, aenderungen: "NEA 50 kVA für Baustellenbeleuchtung" },
    { typ: { code: 43 }, kennzeichen: thwKennzeichen(naechstesKennzeichen++), stanKonform: true, aenderungen: "Verpflegungs- und Sanitätsausstattung" },
  ];

  // Wie bei den übrigen Bögen: `tag` zählt Tage (Einsatzzeitraum), `stand`
  // Minuten (Schema 7). Feste Uhrzeit — dieser eine Bogen soll nicht würfeln.
  const tag = datumAusIso("2026-07-16");
  const stand = tag * MINUTEN_JE_TAG + 9 * 60;
  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    uebung: true, // Beispielbogen: überall als Übung gekennzeichnet (Störer, PDF-Wasserzeichen)
    stand,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { freitext: "Verstärkter Bergungszug" },
      hierarchie: hierarchieFuerOv(ov),
    },
    einsatz: {
      zeitraumVon: tag,
      zeitraumBis: tag + 7,
      ortAuftrag:
        `Großschadenslage nach Starkregen und Hangrutsch im Landkreis ${ov.ort} — ` +
        "Verstärkter Bergungszug mit Schwerer Bergung: Menschenrettung aus verschütteten " +
        "Gebäuden, Abstützen einsturzgefährdeter Bauwerke, Beräumung der Zufahrtswege, " +
        "Aufbau einer Bereitstellungsraum-Struktur für nachrückende Kräfte.",
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal,
    fahrzeuge,
    sofortbedarf: {
      verpflegungPersonen: personal.length,
      dieselLiter: 620,
      benzinLiter: 40,
      gemischLiter: 20,
      unterbringung: true,
      ruhezeitErforderlich: true,
    },
    sonstiges:
      "Einsatz mehrschichtig über mindestens sieben Tage geplant. Ablösung nach je 12 h " +
      "erforderlich, zweite Schicht wird nachgeführt. Unterbringung in Turnhalle organisiert, " +
      "Feldküche der FGr Log-V angefragt. Schwere Bergung benötigt zusätzlich Rüstholz, " +
      "Baustützen und Abbruchhämmer — Nachforderung über die Regionalstelle läuft.",
  };

  return {
    datei: "grossbogen-verstaerkter-bergungszug",
    bogen,
    ov,
    landesverband: THW_OV_REGIONALSTRUKTUR[ov.name]?.landesverband ?? "?",
    abweichung: "Großbogen (Stress-Test QR-Segmentierung)",
  };
}

// ------------------------------------------------------------- QR-Erzeugung
// Node-Pendant zu qrErzeugen() in src/app/hilfen.ts: ein einzelner QR-Code bis
// QR_EINZEL_MAX_VERSION; darüber Segmentierung, wobei jeder Teil auf die
// gröbere, gut scannbare QR_SEGMENT_ZIEL_VERSION zielt.

const QR_OPTIONEN = { errorCorrectionLevel: "M" as const };

function qrVersion(url: string): number {
  try {
    return QRCode.create(url, QR_OPTIONEN).version;
  } catch {
    return Infinity;
  }
}

async function teilBild(url: string, teilNr: number, anzahl: number): Promise<QrTeil> {
  const png = await QRCode.toBuffer(url, { ...QR_OPTIONEN, type: "png", width: 520 });
  return {
    datenUrl: `data:image/png;base64,${png.toString("base64")}`,
    url,
    teilNr,
    anzahl,
    version: qrVersion(url),
  };
}

async function qrSatz(b: Erfassungsbogen): Promise<QrSatz> {
  const payload = encodePayload(b, nodeKompressor);
  const url = EEB_URL_PREFIX + base64UrlKodieren(payload);
  if (qrVersion(url) <= QR_EINZEL_MAX_VERSION) {
    const teil = await teilBild(url, 1, 1);
    return { teile: [teil], segmentiert: false, zeichen: url.length, version: teil.version };
  }
  const maxTeile = Math.min(20, payload.length);
  let urls = segmentPayloadUrls(payload, 2);
  for (let anzahl = 2; anzahl <= maxTeile; anzahl++) {
    urls = segmentPayloadUrls(payload, anzahl);
    if (urls.every((u) => qrVersion(u) <= QR_SEGMENT_ZIEL_VERSION)) break;
  }
  const teile = await Promise.all(urls.map((u, i) => teilBild(u, i + 1, urls.length)));
  return {
    teile,
    segmentiert: true,
    zeichen: url.length,
    version: Math.max(...teile.map((t) => t.version)),
  };
}

// ------------------------------------------------------------ Selbstprüfung

const KENNZAHLEN_2 = new Set(THW_FAHRZEUG_KENNZAHLEN.map((k) => k.kennzahl));

function pruefen(beispiele: BeispielBogen[]): void {
  const fehler: string[] = [];
  const kennzeichen = new Set<string>();
  for (const b of beispiele) {
    const teilSoll = teileinheitKennzahl(b.bogen.einheit.einheitsTyp.code);
    const belegt = new Set<string>();
    for (const fz of b.bogen.fahrzeuge) {
      if (fz.kennzeichen?.startsWith("THW-")) {
        if (kennzeichen.has(fz.kennzeichen)) fehler.push(`${b.datei}: Kennzeichen doppelt`);
        kennzeichen.add(fz.kennzeichen);
      }
      const fr = fz.funkrufname;
      if (!fr) continue;
      if (fr.kennwort.code !== 1 || !fr.eigenerStandort || fr.teile.length !== 2) {
        fehler.push(`${b.datei}: Funkrufname-Form ungültig (${fr.teile.join("/")})`);
        continue;
      }
      const [teil, kfz] = fr.teile as [number, number];
      if (teilSoll != null) {
        if (teil !== teilSoll) fehler.push(`${b.datei}: Teileinheit ${teil} ≠ ${teilSoll}`);
      } else if (!THW_TEILEINHEIT_KENNZAHLEN.some((k) => k.kennzahl === teil)) {
        // Freitext-Einheiten (Großbogen): Teileinheit muss in der Taschenkarte stehen.
        fehler.push(`${b.datei}: Teileinheit-Kennzahl ${teil} unbekannt`);
      }
      if (!KENNZAHLEN_2.has(kfz)) fehler.push(`${b.datei}: Fahrzeug-Kennzahl ${kfz} unbekannt`);
      // Taschenkarte: 20, 30, 40, 50, 60, 70, 80, 90 werden nicht belegt.
      if (kfz >= 20 && kfz % 10 === 0) fehler.push(`${b.datei}: Kennzahl ${kfz} darf nicht belegt werden`);
      if (belegt.has(`${teil}/${kfz}`)) fehler.push(`${b.datei}: Funkrufname ${teil}/${kfz} doppelt`);
      belegt.add(`${teil}/${kfz}`);
    }
  }
  if (fehler.length > 0) {
    throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
  }
}

/** QR-Roundtrip: Payload (ggf. aus Segmenten zusammengesetzt) → Bogen dekodierbar. */
function roundtrip(satz: QrSatz, erwartetGesamt: number, datei: string): void {
  let payload: Uint8Array;
  if (!satz.segmentiert) {
    const url = satz.teile[0]!.url;
    payload = base64UrlDekodieren(url.slice(url.indexOf("#") + 1));
  } else {
    const teile = satz.teile.map((t) => parseSegmentUrl(t.url)).sort((a, b) => a.teilNr - b.teilNr);
    const gesamt = teile.reduce((s, t) => s + t.chunk.length, 0);
    payload = new Uint8Array(gesamt);
    let offset = 0;
    for (const t of teile) {
      payload.set(t.chunk, offset);
      offset += t.chunk.length;
    }
  }
  const dekodiert = decodePayload(payload, nodeKompressor);
  const s = staerke(dekodiert);
  if (s.gesamt !== erwartetGesamt) {
    throw new Error(`${datei}: QR-Roundtrip-Stärke ${s.gesamt} ≠ ${erwartetGesamt}`);
  }
}

// ---------------------------------------------------------------- Hauptlauf

const beispiele = [grossbogenBauen()];

pruefen(beispiele);

// Ausgabe in den Organisations-Unterordner — dieser Generator erzeugt THW-Bögen.
const ausgabe = join(wurzel, "examples", "thw");
mkdirSync(ausgabe, { recursive: true });
// Alte Beispiel-JSONs entfernen (qr-demo-Ausgaben .png/.svg bleiben unberührt).
for (const datei of readdirSync(ausgabe)) {
  if (datei.endsWith(".json")) rmSync(join(ausgabe, datei));
}

for (const bsp of beispiele) {
  const qr = await qrSatz(bsp.bogen);
  roundtrip(qr, bsp.bogen.personal.length, bsp.datei);
  if (!qr.segmentiert) throw new Error(`${bsp.datei}: passt in einen einzelnen QR-Code, soll aber segmentieren`);
  writeFileSync(join(ausgabe, `${bsp.datei}.json`), JSON.stringify(bsp.bogen, null, 2) + "\n");
}

// Übersichtstabelle für examples/thw/README.md.
const zeilen = beispiele.map((b) => {
  const s = staerke(b.bogen);
  const typText =
    b.bogen.einheit.einheitsTyp.freitext ?? typEintrag(b.bogen.einheit.einheitsTyp.code!).kurz;
  return `| ${b.datei} | ${typText} | ${b.ov.name} | ${b.landesverband} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${b.bogen.fahrzeuge.length} | ${b.abweichung} |`;
});
writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen THW

In [\`ortsverbaende/\`](ortsverbaende/README.md) liegen alle Einheiten aller
Ortsverbände als Übungsbögen, gegliedert nach Landesverband › Regionalstelle ›
Ortsverband (\`npm run beispiele:thw-ov\`).

Direkt in diesem Ordner liegt nur ein bewusst übergroßer Stress-Test-Bogen, der
die QR-Segmentierung auslöst (Sammel-Scan zum Ausprobieren). Neu erzeugen mit:
\`npm run beispiele\` (deterministisch, fester Zufalls-Seed). Die früheren 100
zufällig gewählten Beispiel-Einheiten sind seit 11/2026 entfallen.

| Datei | Einheit | OV | Landesverband | Stärke | Fz | Abweichung |
|---|---|---|---|---|---|---|
${zeilen.join("\n")}
`,
);

console.log(`\nFertig: ${beispiele.length} Beispielbogen in examples/thw/ (+ README.md)`);
