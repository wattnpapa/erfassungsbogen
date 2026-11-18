/**
 * Liest Wachen und Einsatzfahrzeuge niedersächsischer Feuerwehren und
 * Hilfsorganisationen (DRK, JUH, MHD, ASB) von https://bos-fahrzeuge.info/ und
 * schreibt eine Momentaufnahme nach scripts/quellen/bos-fahrzeuge-nds.json.
 * Daraus baut scripts/bos-fahrzeuge-nds-beispielboegen.mts die Übungsbögen.
 *
 * Aufruf (Node ≥ 22):
 *   npm run quellen:bos-fahrzeuge                       ganz Niedersachsen
 *   npm run quellen:bos-fahrzeuge -- --kreis Friesland   nur Landkreise, deren Name das enthält
 *   npm run quellen:bos-fahrzeuge -- --nur-zwischenspeicher
 *       ohne Netz: nur, was in .cache/bos-fahrzeuge/ liegt; Landkreise mit
 *       fehlender Seite fallen ganz heraus (nach einem abgebrochenen Lauf)
 *
 * Vorgehen:
 *  1. Die Seite „Niedersachsen" nennt die Landkreise und kreisfreien Städte.
 *  2. Je Landkreis die Fahrzeugliste (Listenansicht, 48 je Seite) — dort stehen
 *     Funkrufname, Kennzeichen, Obergruppe, Organisation und Klassifizierung.
 *  3. Für jedes noch keiner Wache zugeordnete Fahrzeug einer der gesuchten
 *     Organisationen die Detailseite (sie nennt die Wache), dann die Wache
 *     selbst (Name, Ort, Mitgliederzahl, Fahrzeugtext) und ihren Reiter
 *     „Einsatzfahrzeuge" (alle Fahrzeuge der Wache). So kostet jede Wache drei
 *     Abrufe statt einen je Fahrzeug.
 *
 * Höflich: höchstens ein Abruf je Sekunde, jede Seite nur einmal — alle
 * Antworten liegen in .cache/bos-fahrzeuge/ (nicht im Repository), ein
 * abgebrochener Lauf setzt dort fort. Die Kennung des Programms im
 * User-Agent nennt keine Person.
 *
 * In der Momentaufnahme stehen nur Fakten zu Fahrzeugen und Wachen
 * (Funkrufname, Kennzeichen, Typ, Wachenname); keine Fotos, keine Texte der
 * Seite, keine Namen von Fotografen.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASIS = "https://bos-fahrzeuge.info";
const CACHE = join(wurzel, ".cache", "bos-fahrzeuge");
const ZIEL = join(wurzel, "scripts", "quellen", "bos-fahrzeuge-nds.json");
const PAUSE_MS = 1000;
/** Gleichzeitige Abrufe — die Seite antwortet langsam (rund 9 s), der Start bleibt bei einem je Sekunde. */
const PARALLEL = 4;
const USER_AGENT = "erfassungsbogen-beispielgenerator/1.0 (Uebungsboegen; ein Abruf je Sekunde)";

// ------------------------------------------------------------------ Abrufen

let naechsterStart = 0;
let abrufe = 0;

/** Wartet, bis der nächste Abruf starten darf: höchstens einer je PAUSE_MS, egal wie viele parallel laufen. */
async function startfreigabe(): Promise<void> {
  const jetzt = Date.now();
  const start = Math.max(jetzt, naechsterStart);
  naechsterStart = start + PAUSE_MS;
  if (start > jetzt) await new Promise((r) => setTimeout(r, start - jetzt));
}

const NUR_ZWISCHENSPEICHER = process.argv.includes("--nur-zwischenspeicher");
/** Seiten, die mit --nur-zwischenspeicher fehlten (je Landkreis zurückgesetzt). */
let fehlend = 0;

async function seite(pfad: string): Promise<string> {
  mkdirSync(CACHE, { recursive: true });
  const datei = join(CACHE, createHash("sha1").update(pfad).digest("hex") + ".html");
  if (existsSync(datei)) return readFileSync(datei, "utf8");
  if (NUR_ZWISCHENSPEICHER) {
    // Fehlende Detailseiten eines Fahrzeugs sind keine Lücke: Welche gebraucht
    // wird, hängt von der Reihenfolge der parallelen Abrufe ab; das Fahrzeug kam
    // im Online-Lauf über eine andere Gruppe zu seiner Wache. Es fehlt nur, wenn
    // eine Listen- oder Wachenseite fehlt.
    if (!pfad.startsWith("/einsatzfahrzeuge/")) fehlend++;
    return "";
  }
  for (let versuch = 1; ; versuch++) {
    await startfreigabe();
    try {
      const antwort = await fetch(BASIS + pfad, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(90_000),
      });
      if (antwort.status === 404) {
        writeFileSync(datei, "");
        return "";
      }
      if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
      const text = await antwort.text();
      writeFileSync(datei, text);
      abrufe++;
      if (abrufe % 25 === 0) console.log(`  … ${abrufe} Seiten abgerufen`);
      return text;
    } catch (err) {
      if (versuch >= 4) throw new Error(`${pfad}: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, 5000 * versuch));
    }
  }
}

/** Arbeitet `aufgaben` mit höchstens PARALLEL gleichzeitigen Abrufen ab. */
async function parallel<T>(aufgaben: T[], arbeit: (t: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(PARALLEL, aufgaben.length) }, async () => {
      while (i < aufgaben.length) await arbeit(aufgaben[i++]!);
    }),
  );
}

// ------------------------------------------------------------------- Parsen

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&rsaquo;/g, "›")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ListenFahrzeug {
  id: number;
  funkrufname: string;
  kennzeichen?: string;
  obergruppe?: string;
  organisation?: string;
  klassifizierung?: string;
  ausserDienst: boolean;
}

/** Alle `<table class="vehicle">` einer Listen- oder Wachen-Fahrzeugseite. */
function fahrzeugTabellen(html: string): ListenFahrzeug[] {
  const liste: ListenFahrzeug[] = [];
  for (const m of html.matchAll(/<table class="vehicle"[\s\S]*?<\/table>/g)) {
    const t = m[0];
    const kopf = /<th[^>]*class="head"[^>]*>\s*<a title="([^"]*)" href="\/einsatzfahrzeuge\/(\d+)\//.exec(t);
    if (!kopf) continue;
    const feld = (name: string): string | undefined => {
      const f = new RegExp(`<td[^>]*>\\s*${name}:\\s*([\\s\\S]*?)</td>`).exec(t);
      const wert = f ? text(f[1]!) : "";
      return wert && wert !== "k.A." ? wert : undefined;
    };
    const funkrufname = text(kopf[1]!);
    liste.push({
      id: Number(kopf[2]),
      funkrufname: funkrufname.replace(/\s*\(a\.\s?D\.[^)]*\)\s*$/, ""),
      kennzeichen: feld("Kennzeichen"),
      obergruppe: feld("Obergruppe"),
      organisation: feld("Organisation"),
      klassifizierung: feld("Klassifizierung"),
      ausserDienst: /\(a\.\s?D\./.test(funkrufname),
    });
  }
  return liste;
}

/** Feld aus der Informationstabelle einer Detailseite (`<dt>`/`<th>` + Wert). */
function infoFeld(html: string, name: string): string | undefined {
  // Die Detailseiten setzen Bezeichnung und Wert in getrennte Zellen; im
  // reinen Text folgen sie direkt aufeinander.
  const flach = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&rsaquo;/g, "›")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .split("\n")
    .map((z) => z.trim())
    .filter(Boolean);
  const i = flach.indexOf(name);
  if (i < 0) return undefined;
  const wert = flach[i + 1];
  return wert && wert !== "k.A." ? wert : undefined;
}

/** Fahrzeugliste aus dem Freitext der Wache: „Florian Friesland 13/46-02 - HLF 10". */
function fahrzeugTextZeilen(html: string): Map<string, string> {
  const flach = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .split("\n")
    .map((z) => z.trim())
    .filter(Boolean);
  const start = flach.indexOf("Fahrzeuge/Einsatzmittel");
  const ende = flach.indexOf("Adresse", start);
  const typen = new Map<string, string>();
  if (start < 0) return typen;
  for (const zeile of flach.slice(start + 1, ende < 0 ? start + 60 : ende)) {
    const m = /^(.+?\d)\s+[-–]\s+(.+)$/.exec(zeile);
    if (m) typen.set(normRuf(m[1]!), m[2]!.trim());
  }
  return typen;
}

function normRuf(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

// ------------------------------------------------------------ Organisationen

/** Gesuchte Organisationen: Freiwillige Feuerwehren und die vier Hilfsorganisationen. */
export function orgSchluessel(organisation: string | undefined): "ff" | "drk" | "juh" | "mhd" | "asb" | null {
  if (!organisation) return null;
  if (/Freiwillige Feuerwehr/.test(organisation)) return "ff";
  if (/Johanniter/.test(organisation)) return "juh";
  if (/Malteser/.test(organisation)) return "mhd";
  if (/Samariter|\bASB\b/.test(organisation)) return "asb";
  if (/Rotes Kreuz|\bDRK\b|\bBRK\b/.test(organisation)) return "drk";
  return null;
}

/** Hilfsorganisationen nur mit Einheiten des Katastrophenschutzes, nicht mit Rettungswachen. */
function gesucht(f: ListenFahrzeug): boolean {
  const org = orgSchluessel(f.organisation);
  if (!org || f.ausserDienst) return false;
  if (org === "ff") return f.obergruppe === "Feuerwehr" || f.obergruppe === "SEG/KatS";
  return f.obergruppe === "SEG/KatS";
}

// ---------------------------------------------------------------- Hauptlauf

interface Kreis {
  id: number;
  slug: string;
  name: string;
}

export interface Wache {
  id: number;
  name: string;
  kreis: string;
  organisation?: string;
  wachenart?: string;
  ort?: string;
  mitglieder?: number;
  fahrzeuge: (ListenFahrzeug & { typText?: string })[];
}

export interface Momentaufnahme {
  quelle: string;
  abgerufen: string;
  hinweis: string;
  wachen: Wache[];
}

async function kreiseNiedersachsen(): Promise<Kreis[]> {
  const html = await seite("/standorte/9/Niedersachsen/alle");
  const kreise = new Map<number, Kreis>();
  for (const m of html.matchAll(/href="\/standorte\/(\d+)\/([^"/]+)\/alle"[^>]*>([^<]*)</g)) {
    const id = Number(m[1]);
    if ([9, 29, 4576].includes(id)) continue;
    kreise.set(id, { id, slug: m[2]!, name: text(m[3]!) || m[2]! });
  }
  // Nur, was laut Brotkrumen wirklich in Niedersachsen liegt.
  const ergebnis: Kreis[] = [];
  for (const k of kreise.values()) {
    const erste = await seite(`/standorte/${k.id}/${k.slug}/alle/display/list/perpage/48`);
    if (/Deutschland \(Germany\)\s*&rsaquo;\s*Niedersachsen\s*&rsaquo;/.test(erste)) ergebnis.push(k);
  }
  return ergebnis;
}

/** Obergruppen in der Adresse der Landkreis-Liste: Feuerwehr und SEG/KatS (Rettungsdienst und Polizei bleiben draußen). */
const OBERGRUPPEN = ["feuerwehr", "seg-kats"];

async function fahrzeugeImKreis(k: Kreis): Promise<ListenFahrzeug[]> {
  const alle = new Map<number, ListenFahrzeug>();
  for (const gruppe of OBERGRUPPEN) {
    const basis = `/standorte/${k.id}/${k.slug}/${gruppe}/display/list/perpage/48`;
    const erste = await seite(basis);
    for (const f of fahrzeugTabellen(erste)) alle.set(f.id, f);
    const letzte = Math.max(1, ...[...erste.matchAll(/\/page\/(\d+)/g)].map((m) => Number(m[1])));
    // Weitere Seiten parallel; die Seitenleiste nennt nicht immer die letzte, daher nachfassen.
    let bis = letzte;
    for (let von = 2; von <= bis; ) {
      const nummern = Array.from({ length: bis - von + 1 }, (_, j) => von + j);
      const seiten: string[] = [];
      await parallel(nummern, async (nr) => {
        seiten[nr] = await seite(`${basis}/page/${nr}`);
      });
      von = bis + 1;
      for (const html of seiten.filter(Boolean)) {
        for (const f of fahrzeugTabellen(html)) alle.set(f.id, f);
        bis = Math.max(bis, ...[...html.matchAll(/\/page\/(\d+)/g)].map((m) => Number(m[1])));
      }
    }
  }
  return [...alle.values()];
}

async function wacheZu(f: ListenFahrzeug): Promise<{ id: number; pfad: string } | null> {
  const html = await seite(`/einsatzfahrzeuge/${f.id}`);
  const m = /href="(\/wachen\/(\d+)\/[^"/]+)"/.exec(html.slice(html.indexOf("Funkrufname")));
  return m ? { id: Number(m[2]), pfad: m[1]! } : null;
}

async function wacheLesen(pfad: string, id: number, kreis: string): Promise<Wache> {
  const info = await seite(pfad);
  const fzSeite = await seite(`${pfad}/einsatzfahrzeuge`);
  const name = /<h1[^>]*>\s*Wache:\s*([^<]+)</.exec(info)?.[1] ?? infoFeld(info, "Wache") ?? pfad.split("/").pop()!.replaceAll("_", " ");
  const typen = fahrzeugTextZeilen(info);
  const mitglieder = Number(infoFeld(info, "Anzahl Mitglieder"));
  return {
    id,
    name: text(name),
    kreis,
    organisation: infoFeld(info, "Organisation"),
    wachenart: infoFeld(info, "Wachenart"),
    ort: /<td[^>]*>\s*Adresse[\s\S]*?(\d{5}\s+[^<]+)</.exec(info)?.[1]?.trim() ?? infoFeld(info, "Adresse")?.trim(),
    ...(Number.isFinite(mitglieder) && mitglieder > 0 ? { mitglieder } : {}),
    fahrzeuge: fahrzeugTabellen(fzSeite).map((f) => {
      const typText = typen.get(normRuf(f.funkrufname));
      return typText ? { ...f, typText } : f;
    }),
  };
}

const kreisFilter = (() => {
  const i = process.argv.indexOf("--kreis");
  return i > 0 ? process.argv[i + 1]?.toLowerCase() : undefined;
})();

const kreise = (await kreiseNiedersachsen()).filter((k) => !kreisFilter || k.name.toLowerCase().includes(kreisFilter) || k.slug.toLowerCase().includes(kreisFilter));
console.log(`${kreise.length} Landkreise/kreisfreie Städte`);

const bisher: Momentaufnahme | null = existsSync(ZIEL) ? (JSON.parse(readFileSync(ZIEL, "utf8")) as Momentaufnahme) : null;
const wachen = new Map<number, Wache>((bisher?.wachen ?? []).filter((w) => !kreise.some((k) => k.name === w.kreis)).map((w) => [w.id, w]));

/** Vermutlich dieselbe Wache: Rufname ohne Fahrzeugkennung („Florian Friesland 13/…-02"). */
function gruppenSchluessel(f: ListenFahrzeug): string {
  const m = /^(.*?)(\d+)\s*[/-]\s*\d+((?:\s*[/-]\s*\d+)*)\s*$/.exec(f.funkrufname);
  return m ? `${m[1]}${m[2]}|${m[3]}` : f.funkrufname;
}

const wacheLaeuft = new Map<number, Promise<void>>();

for (const k of kreise) {
  fehlend = 0;
  const fahrzeuge = (await fahrzeugeImKreis(k)).filter(gesucht);
  console.log(`${k.name}: ${fahrzeuge.length} Fahrzeuge der gesuchten Organisationen im Dienst`);
  const gruppen = new Map<string, ListenFahrzeug[]>();
  for (const f of fahrzeuge) gruppen.set(gruppenSchluessel(f), [...(gruppen.get(gruppenSchluessel(f)) ?? []), f]);
  const zugeordnet = new Set<number>([...wachen.values()].flatMap((w) => w.fahrzeuge.map((f) => f.id)));
  await parallel([...gruppen.values()], async (gruppe) => {
    for (const f of gruppe) {
      if (zugeordnet.has(f.id)) continue;
      zugeordnet.add(f.id);
      const w = await wacheZu(f);
      if (!w) continue;
      if (!wacheLaeuft.has(w.id)) {
        wacheLaeuft.set(
          w.id,
          wacheLesen(w.pfad, w.id, k.name).then((gelesen) => {
            wachen.set(w.id, gelesen);
          }),
        );
      }
      await wacheLaeuft.get(w.id);
      for (const wf of wachen.get(w.id)?.fahrzeuge ?? []) zugeordnet.add(wf.id);
    }
  });
  if (fehlend > 0 || (NUR_ZWISCHENSPEICHER && fahrzeuge.length === 0)) {
    // Unvollständig: lieber ganz weglassen als einen halben Landkreis zeigen.
    for (const [id, w] of wachen) if (w.kreis === k.name) wachen.delete(id);
    console.log(`${k.name}: ausgelassen (${fehlend} Seiten nicht im Zwischenspeicher)`);
    continue;
  }
  console.log(`${k.name}: ${[...wachen.values()].filter((w) => w.kreis === k.name).length} Wachen`);
  speichern();
}

/** Momentaufnahme schreiben — nach jedem Landkreis, damit ein abgebrochener Lauf nichts verliert. */
function speichern(): number {
  const momentaufnahme: Momentaufnahme = {
    quelle: BASIS + "/",
    abgerufen: new Date().toISOString().slice(0, 10),
    hinweis:
      "Wachen und Fahrzeuge (Funkrufname, Kennzeichen, Organisation, Klassifizierung) aus der Wachen- und Fahrzeugdatenbank von bos-fahrzeuge.info, eingetragen von deren Nutzern. Nur Fakten, keine Fotos oder Texte.",
    wachen: [...wachen.values()].sort((a, b) => a.kreis.localeCompare(b.kreis, "de") || a.name.localeCompare(b.name, "de")),
  };
  writeFileSync(ZIEL, JSON.stringify(momentaufnahme, null, 1) + "\n");
  return momentaufnahme.wachen.length;
}

const anzahl = speichern();
console.log(`Fertig: ${anzahl} Wachen nach ${ZIEL} (${abrufe} neue Abrufe)`);
