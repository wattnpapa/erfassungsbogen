/**
 * Der Dialog „Beispielbögen" als eigener Baustein: Ordner, Suche, Tabelle und
 * die Adressliste aller Beispiel-Dateien (examples/**). Die Fußzeile lädt ihn
 * erst beim ersten Öffnen (lazy), damit er nicht in jedem App-Start liegt
 * (ADR-003, Bundle-Budget; vorher Teil von fusszeile.tsx).
 */

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { staerke, type Erfassungsbogen } from "@bos/eeb-format/model";
import { istNativ, linkTeilen, shareSheetVerfuegbar } from "./nativ";
import { fehlerText } from "./nachladen";
import { bogenVollUrl, einheitAnzeigename, einheitOrt, heuteDatum, migriereBogen, orgLabel, vokabText, vokabularFuer } from "./hilfen";
import { beispielAufHeute } from "./beispiel-heute";
import { stempelZeitpunkt } from "./datenschutz-uhr";
import { EinheitZeichen } from "./zeichen-bild";
import { zeigeHinweis } from "./dialoge";
import { FehlerImBild } from "./fehler-im-bild";
// Als Datei-URL, nicht als Modul: Der Index (rund 190 KB) lädt erst beim ersten Suchen
// und zählt weder ins Start- noch ins JS-Bündel (scripts/beispiele-suchindex.mts).
import SUCHINDEX_URL from "./beispiele-suchindex.json?url";
import { suchNorm, treffer, woerterVon } from "./beispiele-suche";

// Anzeigenamen für die Ordner in examples/. Erste Ebene ist die Organisation
// bzw. ein Thema (z. B. „Katastrophenschutz"), darunter können weitere Ebenen
// folgen (z. B. Bundesländer). Unbekannte Ordner erscheinen mit ihrem
// Ordnernamen in Großbuchstaben, damit neue Ordner auch ohne Eintrag hier
// sichtbar bleiben.
const ORDNER_LABEL: Record<string, string> = {
  thw: "THW",
  // Ohne „›" im Namen: Das Zeichen trennt in der Pfadleiste die Ebenen und
  // täuschte hier weitere vor (Prüfrunde Beispielbögen, BB-M4, BB-N3).
  ortsverbaende: "Alle Einheiten aller Ortsverbände (nach Landesverband, Regionalstelle, OV)",
  bbk: "BBK (Bundeseinheiten)",
  feuerwehr: "Feuerwehr",
  polizei: "Polizei",
  bundespolizei: "Bundespolizei",
  drk: "DRK",
  juh: "Johanniter (JUH)",
  mhd: "Malteser (MHD)",
  asb: "ASB",
  dlrg: "DLRG",
  bundeswehr: "Bundeswehr",
  rettungsdienst: "Rettungsdienst",
  katastrophenschutz: "Katastrophenschutz",
  // Ländernamen wie im Vordruck (Prüfrunde Beispielbögen, BB-E10, BB-K8, BB-L2,
  // BB-H7, BB-M8, BB-A7): vorher „BADENWUERTTEMBERG" aus dem Ersatzwert.
  badenwuerttemberg: "Baden-Württemberg",
  bayern: "Bayern",
  berlin: "Berlin",
  hessen: "Hessen",
  "mecklenburg-vorpommern": "Mecklenburg-Vorpommern",
  "nordrhein-westfalen": "Nordrhein-Westfalen",
  "rheinland-pfalz": "Rheinland-Pfalz",
  saarland: "Saarland",
  brandenburg: "Brandenburg",
  niedersachsen: "Niedersachsen",
  sachsen: "Sachsen",
  thueringen: "Thüringen",
  "praktische-ausbildung": "Praktische Ausbildung",
  malter: "JUH RV Malter",
  akkonia: "JUH OV Akkonia",
  johannesburg: "JUH OV Johannesburg",
  hannover: "Einlagen Kräfte Hannover",
};

function ordnerLabel(ordner: string): string {
  // Ersatz für neue Ordner ohne Eintrag: Wörter mit großem Anfangsbuchstaben statt
  // Versalien, die wie Rohdaten aussahen.
  return (
    ORDNER_LABEL[ordner] ??
    ORDNER_LABEL_NACHGELADEN.get(ordner) ??
    ordner
      .split("-")
      .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
      .join(" ")
  );
}

/** Bundesländer, für die es unter „Katastrophenschutz" noch keine Bögen gibt, sagt der Ordner selbst (BB-H7). */
const LAENDER: Record<string, string> = {
  badenwuerttemberg: "Baden-Württemberg", bayern: "Bayern", berlin: "Berlin", brandenburg: "Brandenburg",
  bremen: "Bremen", hamburg: "Hamburg", hessen: "Hessen", "mecklenburg-vorpommern": "Mecklenburg-Vorpommern",
  niedersachsen: "Niedersachsen", "nordrhein-westfalen": "Nordrhein-Westfalen", "rheinland-pfalz": "Rheinland-Pfalz",
  saarland: "Saarland", sachsen: "Sachsen", "sachsen-anhalt": "Sachsen-Anhalt", "schleswig-holstein": "Schleswig-Holstein",
  thueringen: "Thüringen",
};

// Beispielbögen aus examples/ — beliebig tief verschachtelt (z. B.
// examples/thw/*.json oder examples/katastrophenschutz/niedersachsen/*.json).
// Abgelegt ist nur das Bogen-JSON; die PDF entsteht erst beim Klick aus dem
// aktuellen Layout (siehe beispielPdf), damit Layout-Änderungen nicht jedes
// Mal ein Neurendern aller Beispiele erzwingen. Der Glob wird beim Build
// aufgelöst, neue Dateien und Ordner erscheinen also automatisch ohne
// Codeänderung (erzeugt von scripts/*-beispielboegen*.mts). `ordner` sind die
// Verzeichnissegmente zwischen examples/ und der Datei.
interface BeispielEintrag {
  ordner: string[];
  datei: string;
  url: string;
}

function beispielEintraege(glob: Record<string, unknown>): BeispielEintrag[] {
  return Object.entries(glob).map(([pfad, url]) => {
    const teile = pfad.split("/");
    const iExamples = teile.lastIndexOf("examples");
    return {
      ordner: teile.slice(iExamples + 1, teile.length - 1),
      datei: teile[teile.length - 1]!.replace(/\.json$/, ""),
      url: url as string,
    };
  });
}

const nachDatei = (a: BeispielEintrag, b: BeispielEintrag) => a.datei.localeCompare(b.datei, "de");

// Die rund 3.500 Bögen „alle Einheiten aller Ortsverbände" (examples/thw/
// ortsverbaende/, scripts/thw-ov-beispielboegen.mts) stehen nicht in diesem
// Glob: Ihre Adressliste allein wäre mehrere hundert KB groß und läge sonst
// in jedem App-Start. Sie kommt beim Öffnen des Dialogs aus einem eigenen
// Baustein (beispiele-thw-ov.ts) dazu.
const BEISPIELE: BeispielEintrag[] = beispielEintraege(
  import.meta.glob(["../../examples/**/*.json", "!../../examples/thw/ortsverbaende/**"], {
    eager: true,
    query: "?url",
    import: "default",
  }),
).sort(nachDatei);

/** Anzeigenamen der nachgeladenen Ordner (Landesverband, Regionalstelle, Ortsverband). */
const ORDNER_LABEL_NACHGELADEN = new Map<string, string>();
let ovBeispieleVersprechen: Promise<void> | null = null;
/** Ist der Baustein mit den Ordnern der Ortsverbände schon eingehängt? */
let ovGeladen = false;

/** Bögen aller Ortsverbände einmalig dazuholen; ein Fehlschlag (offline, alter Stand) darf später erneut versucht werden. */
function ovBeispieleLaden(): Promise<void> {
  ovBeispieleVersprechen ??= import("./beispiele-thw-ov")
    .then(({ THW_OV_BEISPIELE, THW_OV_ORDNER_LABEL }) => {
      BEISPIELE.push(...beispielEintraege(THW_OV_BEISPIELE));
      BEISPIELE.sort(nachDatei);
      for (const [ordner, label] of Object.entries(THW_OV_ORDNER_LABEL)) ORDNER_LABEL_NACHGELADEN.set(ordner, label);
      ovGeladen = true;
    })
    .catch((err: unknown) => {
      ovBeispieleVersprechen = null;
      throw err;
    });
  return ovBeispieleVersprechen;
}

/**
 * Zug einer Einheit aus „alle Ortsverbände" — steht im Dateinamen
 * („ov-stralsund-12-2-tz-b"), damit „B" im 1. und im 2. TZ in der Liste
 * unterscheidbar sind, ohne erst den Bogen zu lesen.
 */
function zugHinweis(datei: string): string {
  const m = /^ov-.+-\d{2}-(\d-tz|fz-fk|fz-log)-/.exec(datei);
  if (!m) return "";
  if (m[1] === "fz-fk") return "Fachzug Führung/Kommunikation";
  if (m[1] === "fz-log") return "Fachzug Logistik";
  return `${m[1]![0]}. Technischer Zug`;
}

/** Trefferliste unter einem Ordner-Pfad (Prefix-Abgleich). */
function unterPfad(pfad: string[]): BeispielEintrag[] {
  return BEISPIELE.filter((b) => pfad.every((seg, i) => b.ordner[i] === seg));
}

/** Direkte Unterordner (mit Bogenzahl) unterhalb eines Pfades. */
function unterordner(pfad: string[]): { ordner: string; anzahl: number }[] {
  const zaehler = new Map<string, number>();
  for (const b of unterPfad(pfad)) {
    if (b.ordner.length > pfad.length) {
      const naechster = b.ordner[pfad.length]!;
      zaehler.set(naechster, (zaehler.get(naechster) ?? 0) + 1);
    }
  }
  return [...zaehler.entries()]
    .map(([ordner, anzahl]) => ({ ordner, anzahl }))
    .sort((a, b) => ordnerLabel(a.ordner).localeCompare(ordnerLabel(b.ordner), "de"));
}

/** Bögen, die direkt in diesem Ordner liegen (keine tiefere Ebene mehr). */
function boegenHier(pfad: string[]): BeispielEintrag[] {
  return unterPfad(pfad).filter((b) => b.ordner.length === pfad.length);
}

// Einmal geladene Beispielbögen bleiben für die Sitzung liegen: die Tabelle
// zeigt Einheit, Herkunft und Stärke aus dem Bogen selbst, und beim Blättern
// zwischen den Ordnern (oder für PDF/Ansehen) wird nicht erneut geladen.
const BOGEN_CACHE = new Map<string, Erfassungsbogen>();

/**
 * Bögen der THW-Ortsverbände (examples/thw/ortsverbaende/, Dateinamen „ov-…"):
 * Die App lädt sie nie vorab (scripts/precache-aufteilung.ts, istNurAufAbruf).
 * Ohne Netz darf die Meldung deshalb kein Nachladen versprechen (Prüfrunde
 * Beispielbögen, BB-S1, BB-O1, BB-H3).
 */
const istOvBogen = (url: string): boolean => /\/ov-[^/]+\.json$/.test(url);
const OV_OFFLINE_TEXT =
  "Die Bögen der THW-Ortsverbände lädt die App nicht vorab: Ein Bogen braucht beim ersten Öffnen Netz und bleibt danach auf dem Gerät.";
const OV_ORDNER = ["thw", "ortsverbaende"];
const imOvOrdner = (pfad: string[]): boolean => OV_ORDNER.every((seg, i) => pfad[i] === seg);

/**
 * Zuletzt offener Ordner des Dialogs, je Tab (Prüfrunde Beispielbögen, BB-S3,
 * BB-G3, BB-E4, BB-H2, BB-N2, BB-W3): Nach „Anzeigen", Schließen oder
 * Neuladen begann der Dialog wieder bei „Alle" — bis zum eigenen OV fünf
 * Tipps. Nur der Ordnerpfad, keine Bogendaten.
 */
const PFAD_SCHLUESSEL = "eeb.beispiel-pfad.v1";
function pfadLaden(): string[] {
  try {
    const p: unknown = JSON.parse(sessionStorage.getItem(PFAD_SCHLUESSEL) ?? "[]");
    return Array.isArray(p) && p.every((x) => typeof x === "string") ? (p as string[]) : [];
  } catch {
    return [];
  }
}
function pfadMerken(p: string[]): void {
  try {
    if (p.length) sessionStorage.setItem(PFAD_SCHLUESSEL, JSON.stringify(p));
    else sessionStorage.removeItem(PFAD_SCHLUESSEL);
  } catch {
    /* gesperrt: dann beginnt der Dialog oben */
  }
}

const SUCHE_MAX_ORDNER = 20;
const SUCHE_MAX_BOEGEN = 60;

/** Inhalt von beispiele-suchindex.json (siehe scripts/beispiele-suchindex.mts). */
interface Suchindex {
  typen: Record<string, string>;
  ov: Record<string, number>;
  boegen: Record<string, string>;
}
let suchindex: Suchindex | null = null;
let suchindexVersprechen: Promise<Suchindex | null> | null = null;
/** Index einmal holen; ohne Netz und ohne Vorrat sucht der Dialog nur in Ordner- und Dateinamen. */
function suchindexLaden(): Promise<Suchindex | null> {
  suchindexVersprechen ??= fetch(SUCHINDEX_URL)
    .then((r) => (r.ok ? (r.json() as Promise<Suchindex>) : null))
    .then((i) => (suchindex = i))
    .catch(() => {
      suchindexVersprechen = null;
      return null;
    });
  return suchindexVersprechen;
}

/** Suchwörter eines Bogens: Ordner, Dateiname, Zug und, wenn geladen, Einheitstyp und Orte aus dem Index. */
function bogenWoerter(b: BeispielEintrag): string[] {
  const teile = [...b.ordner.map(ordnerLabel), ...b.ordner, b.datei, zugHinweis(b.datei)];
  if (suchindex) {
    const code = suchindex.ov[b.datei];
    teile.push(code != null ? (suchindex.typen[String(code)] ?? "") : (suchindex.boegen[[...b.ordner, b.datei].join("/")] ?? ""));
  }
  return woerterVon(teile.join(" "));
}

/**
 * Suche über Ordner, Dateinamen und den Suchindex (Einheitstyp, Träger, Orte).
 * Ordner: jeder, dessen eigener Name ein Suchwort trägt und dessen Pfad alle
 * trägt — so steht bei „Oldenburg" die RSt UND der OV da (BB2-S1, BB2-N6).
 * Sortiert nach Güte; Bögen mit ganzem Wort vor Wortanfängen.
 */
function suchTreffer(q: string): { ordner: string[][]; boegen: BeispielEintrag[]; mehr: boolean } {
  const such = woerterVon(q);
  if (such.length === 0) return { ordner: [], boegen: [], mehr: false };
  const ordner = new Map<string, { pfad: string[]; punkte: number }>();
  const boegen: { b: BeispielEintrag; punkte: number }[] = [];
  for (const b of BEISPIELE) {
    const pfadWoerter: string[] = [];
    for (let i = 0; i < b.ordner.length; i++) {
      const eigene = woerterVon(`${ordnerLabel(b.ordner[i]!)} ${b.ordner[i]!}`);
      pfadWoerter.push(...eigene);
      const schluessel = b.ordner.slice(0, i + 1).join("/");
      if (ordner.has(schluessel)) continue;
      const punkte = treffer(such, pfadWoerter);
      if (punkte >= 0 && such.some((w) => eigene.some((t) => t.startsWith(w)))) {
        ordner.set(schluessel, { pfad: b.ordner.slice(0, i + 1), punkte });
      }
    }
    const punkte = treffer(such, bogenWoerter(b));
    if (punkte >= 0) boegen.push({ b, punkte });
  }
  const ordnerListe = [...ordner.values()].sort((x, y) => y.punkte - x.punkte || y.pfad.length - x.pfad.length || x.pfad.map(ordnerLabel).join(" ").localeCompare(y.pfad.map(ordnerLabel).join(" "), "de"));
  boegen.sort((x, y) => y.punkte - x.punkte || nachDatei(x.b, y.b));
  return {
    ordner: ordnerListe.slice(0, SUCHE_MAX_ORDNER).map((o) => o.pfad),
    boegen: boegen.slice(0, SUCHE_MAX_BOEGEN).map((x) => x.b),
    mehr: ordnerListe.length > SUCHE_MAX_ORDNER || boegen.length > SUCHE_MAX_BOEGEN,
  };
}

/** Kurzer Ort eines Ordnertreffers: die zwei Ebenen darüber, ohne die immer gleichen THW-Sammelordner (BB2-M4). */
function ordnerHerkunft(pfad: string[]): string {
  return pfad
    .slice(0, -1)
    .filter((seg) => seg !== "ortsverbaende")
    .slice(-2)
    .map(ordnerLabel)
    .join(" › ");
}

/** Beispielbogen-JSON laden (gecacht) und auf das aktuelle Schema heben. */
async function beispielBogen(url: string): Promise<Erfassungsbogen> {
  const bekannt = BOGEN_CACHE.get(url);
  if (bekannt) return bekannt;
  let antwort: Response;
  try {
    antwort = await fetch(url);
  } catch {
    // Beispielbögen sind die zweite Stufe des Offline-Vorrats (R3-O3): ohne
    // Netz fehlen sie, bis die Startseite sie nachgeladen hat.
    throw new Error(
      istOvBogen(url)
        ? `Dieser Bogen liegt noch nicht auf dem Gerät. ${OV_OFFLINE_TEXT}`
        : "Dieser Beispielbogen liegt noch nicht auf dem Gerät — Beispielbögen werden nach dem ersten Laden mit Netz nachgeladen (siehe Offline-Zeile der Startseite).",
    );
  }
  const bogen = migriereBogen((await antwort.json()) as Erfassungsbogen);
  BOGEN_CACHE.set(url, bogen);
  return bogen;
}

/**
 * Eigene Kopie für alles, was den Bogen weitergibt (Öffnen, PDF): der geöffnete
 * Bogen wird bearbeitet, der Stand im Cache muss davon unberührt bleiben.
 */
async function beispielKopie(url: string): Promise<Erfassungsbogen> {
  // Zeitraum und Stand auf heute (BB-W5): sonst warnte jeder Beispielbogen vor seinem Alter.
  return beispielAufHeute(structuredClone(await beispielBogen(url)), heuteDatum(), stempelZeitpunkt());
}

/**
 * Beispielbogen laden und daraus die PDF im aktuellen Layout erzeugen —
 * Download (Web) bzw. Share-Sheet (App) übernimmt pdfErzeugen.
 */
async function beispielPdf(datei: string, url: string, abgebrochen: () => boolean = () => false): Promise<void> {
  // Dynamisch: pdfmake samt eingebetteter Schriften bleibt aus dem
  // Start-Bundle heraus und wird erst beim ersten PDF geladen.
  const { pdfErzeugen } = await import("./pdf");
  const bogen = await beispielKopie(url);
  if (abgebrochen()) return;
  await pdfErzeugen(bogen, `${datei}.pdf`, null, abgebrochen);
}

/**
 * Beispielbogen laden und daraus den Bogen-Link erzeugen — dieselbe Voll-URL,
 * die auch im Bogen selbst unter „Link teilen" steht: Sie trägt den kompletten
 * signierten Bogen im Fragment und öffnet ihn beim Antippen in der App.
 */
async function beispielLinkUrl(url: string): Promise<{ link: string; titel: string }> {
  const bogen = await beispielKopie(url);
  return { link: await bogenVollUrl(bogen), titel: `Erfassungsbogen ${einheitAnzeigename(bogen.einheit)}` };
}

/** Einheitstyp im Vokabular der Organisation („Betreuungsgruppe (BTGr)"). */
function einheitsTypText(b: Erfassungsbogen): string {
  return vokabText(b.einheit.einheitsTyp, vokabularFuer(b.einheit.organisation, "einheitstyp"), "name");
}

/** Träger der Einheit — der erfasste Organisationsname, sonst die Organisation. */
function traegerText(b: Erfassungsbogen): string {
  return b.einheit.organisationName?.trim() || orgLabel(b.einheit.organisation);
}

/**
 * Oberste Zuständigkeitsebene („THW Landesverband Baden-Württemberg"). Steckt
 * ihr Name schon im Träger („Feuerwehr Landkreis Stade" über der „Unteren
 * KatS-Behörde Landkreis Stade"), bringt die Zeile nichts Neues und entfällt.
 */
function obersteEbene(b: Erfassungsbogen): string {
  const ebene = b.einheit.hierarchie[b.einheit.hierarchie.length - 1];
  if (!ebene || b.einheit.hierarchie.length < 2) return "";
  if (ebene.name && traegerText(b).includes(ebene.name)) return "";
  const bezeichnung = vokabText(ebene.bezeichnung, vokabularFuer(b.einheit.organisation, "ebene"), "name");
  // Trägt der Name die Bezeichnung schon („Panzerpionierbataillon 700",
  // „DRK-Kreisverband …"), nicht doppelt (Prüfrunde Beispielbögen, BB-N5, BB-K5).
  if (bezeichnung && ebene.name && ebene.name.toLocaleLowerCase("de-DE").includes(bezeichnung.toLocaleLowerCase("de-DE"))) return ebene.name.trim();
  return [bezeichnung, ebene.name].filter(Boolean).join(" ").trim();
}

/**
 * Icons der Zeilen-Aktionen: inline statt Bilddatei, damit sie die Textfarbe
 * (und damit die Kennfarbe der Organisation) erben und offline da sind.
 */
function IconAuge() {
  return (
    <svg className="knopf-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.6-6.2 10-6.2S22 12 22 12s-3.6 6.2-10 6.2S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconPdf() {
  return (
    <svg className="knopf-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5Z" />
      <path d="M14 3v4.5h4.5" />
      <path d="M12 11v5" />
      <path d="m9.75 13.75 2.25 2.25 2.25-2.25" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg className="knopf-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.5 13.5a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5" />
      <path d="M13.5 10.5a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.5-1.5" />
    </svg>
  );
}


function Dialog({ titel, dialogRef, klasse, onSchliessen, children }: {
  titel: string;
  dialogRef: RefObject<HTMLDialogElement | null>;
  klasse?: string;
  /** Feuert auch bei Esc und Backdrop-Schluss, nicht nur beim Knopf. */
  onSchliessen?: () => void;
  children: ReactNode;
}) {
  return (
    <dialog ref={dialogRef} aria-label={titel} className={klasse} onClose={onSchliessen}>
      <div className="kopfzeile">
        <h2>{titel}</h2>
        <button type="button" onClick={() => dialogRef.current?.close()}>Schließen</button>
      </div>
      {children}
    </dialog>
  );
}

export default function BeispieleDialog({ anfrage, onBogenOeffnen, onAlsUebung }: {
  /** Zählt mit jeder Anfrage zum Öffnen hoch (beispielboegenOeffnen in fusszeile.tsx). */
  anfrage: number;
  /**
   * Beispielbogen in der App öffnen — wie ein frisch gescannter Bogen.
   * Rückgabe false = die Übernahme wurde abgelehnt (Rückfrage abgebrochen);
   * dann bleibt der Dialog stehen.
   */
  onBogenOeffnen: (bogen: Erfassungsbogen) => Promise<boolean>;
  /** Alle Bögen des offenen Ordners in eine neue Übungs-Sammlung legen (BB-K1). Ohne Angabe fehlt der Knopf. */
  onAlsUebung?: (boegen: { bogen: Erfassungsbogen; zug?: string }[], ordnerName: string) => Promise<boolean>;
}) {
  const beispiele = useRef<HTMLDialogElement>(null);
  // Ordner-Navigation im Beispielbögen-Dialog: erst Organisation/Thema, ggf.
  // weitere Ebenen (z. B. Bundesland), dann der Bogen.
  const [beispielPfad, setBeispielPfad] = useState<string[]>([]);
  const [beispielSuche, setBeispielSuche] = useState("");
  // Nach einem Ordnerwechsel im Dialog: nach oben rollen und den Fokus in den
  // Dialog setzen (BB-S4, BB-M3, BB-E7, BB-H5, BB-N3). Vorher blieb die
  // Rollhöhe stehen, und der Fokus fiel auf <body>.
  const fokusNachWechsel = useRef(false);
  function pfadSetzen(p: string[]) {
    fokusNachWechsel.current = true;
    letzterWechsel.current = performance.now();
    setLadeFehlt("");
    setBeispielFehler("");
    setBeispielSuche("");
    setBeispielPfad(p);
    pfadMerken(p);
  }
  /** Ordnerwechsel per Tipp: ein zweiter Tipp innerhalb von 400 ms ist ein Doppeltipp und zählt nicht (BB-E6, BB2-E2). */
  function tippWechsel(p: string[]) {
    if (performance.now() - letzterWechsel.current < 400) return;
    pfadSetzen(p);
  }
  // Suchtext, aus dem ein Ordnertreffer geöffnet wurde — für „‹ Zur Suche" (BB2-S7, BB2-H5).
  const [ausSuche, setAusSuche] = useState("");
  const pfadAktuell = useRef(beispielPfad);
  pfadAktuell.current = beispielPfad;
  const sucheAktuell = useRef(beispielSuche);
  sucheAktuell.current = beispielSuche;
  // Dateiname des Bogens, dessen PDF gerade entsteht (leer = keiner läuft).
  const [beispielLaeuft, setBeispielLaeuft] = useState("");
  const [beispielFehler, setBeispielFehler] = useState("");
  // Datei, deren Link gerade in der Zwischenablage liegt — die Zeile quittiert
  // das kurz selbst, statt dafür einen Dialog aufzumachen.
  const [beispielKopiert, setBeispielKopiert] = useState("");
  // Kurze Quittung nach „PDF" (BB-H9, BB-A6): Am Telefon ging die Datei still in den Download-Ordner.
  const [beispielQuittung, setBeispielQuittung] = useState("");
  // Bögen des offenen Ordners ließen sich nicht laden (ohne Netz). Steht über der
  // Liste statt am Ende, verschwindet beim Ordnerwechsel und lädt mit „Erneut
  // laden" oder bei Netzrückkehr neu (BB-E5, BB-O3, BB-O4).
  const [ladeFehlt, setLadeFehlt] = useState("");
  const [neuLaden, setNeuLaden] = useState(0);
  // Zeit des letzten Ordnerwechsels: Ein Doppeltipp auf ein Register öffnete
  // sonst mit dem zweiten Tipp einen Unterordner (BB-E6).
  const letzterWechsel = useRef(0);
  // Der Dialog lädt die Bögen des offenen Ordners nach, um Einheit, Herkunft
  // und Stärke in der Tabelle zu zeigen. Die Tabelle rendert ausschließlich aus
  // `beispielDaten` (URL → Bogen) — der Modul-Cache ist nur die Abkürzung beim
  // Nachladen, nie die Anzeigequelle. Sonst könnte die Ansicht mit einem
  // geleerten Cache dauerhaft leer stehen bleiben, ohne dass etwas nachlädt.
  const [beispieleOffen, setBeispieleOffen] = useState(false);
  const [beispielDaten, setBeispielDaten] = useState<Record<string, Erfassungsbogen>>({});
  // Prüfrunde Beispielbögen (BB-E1): Jedes Schließen des Dialogs (Escape,
  // Zurück-Geste, „Schließen") zählt hoch. Ein „Anzeigen" oder „PDF", das
  // davor begann, prüft vor dem Öffnen bzw. Herunterladen, ob der Dialog noch
  // derselbe ist — sonst öffnete der Bogen Sekunden später mitten in der
  // eigenen Arbeit.
  const beispielSitzung = useRef(0);
  // Der Baustein mit den Ordnern der Ortsverbände ließ sich nicht laden (ohne Netz).
  const [ovFehlt, setOvFehlt] = useState(false);
  // Lädt der Baustein der Ortsverbände noch? Dann stehen Platzhalter, statt dass
  // der Ordner später unbemerkt über der Liste erscheint (BB-S5, BB-H10, BB-N6).
  const [ovLaedt, setOvLaedt] = useState(!ovGeladen);
  const [beispielLaedt, setBeispielLaedt] = useState(false);

  // Bögen des offenen Ordners laden, sobald der Dialog offen ist bzw. der Pfad
  // wechselt. Fehlschläge (z. B. offline) sind kein Beinbruch: die Tabelle
  // zeigt dann den Dateinamen und meldet es unter der Liste.
  const beispielPfadSchluessel = beispielPfad.join("/");
  // Anzeigestand: Suche oder offener Ordner. Hängt mittelbar auch am
  // nachgeladenen Ordner der Ortsverbände (ovBeispieleStand löst das Neurechnen aus).
  const [, setSuchindexDa] = useState(suchindex != null);
  useEffect(() => {
    if (beispielSuche.trim().length < 2 || suchindex) return;
    let aktiv = true;
    void suchindexLaden().then((i) => aktiv && i && setSuchindexDa(true));
    return () => {
      aktiv = false;
    };
  }, [beispielSuche]);
  const suchErgebnis = beispielSuche.trim().length >= 2 ? suchTreffer(beispielSuche) : null;
  const beispielOrdner = suchErgebnis ? [] : unterordner(beispielPfad);
  const beispielBoegen = suchErgebnis ? suchErgebnis.boegen : boegenHier(beispielPfad);
  const sichtbarSchluessel = beispielBoegen.map((b) => b.url).join("|");
  // Bögen aller Ortsverbände beim ersten Öffnen dazuholen (eigener Baustein,
  // siehe ovBeispieleLaden); der Zähler lässt Ordnerliste und Tabelle neu rechnen.
  const [ovBeispieleStand, setOvBeispieleStand] = useState(0);
  useEffect(() => {
    if (!beispieleOffen) return;
    let aktiv = true;
    // Ohne Netz fehlt nur dieser Ordner. Der Dialog sagt es und versucht es
    // erneut, sobald das Netz zurück ist — vorher erst nach dem Neuladen
    // (Prüfrunde Beispielbögen, BB-E3).
    const laden = () =>
      ovBeispieleLaden().then(
        () => {
          if (!aktiv) return;
          setOvFehlt(false);
          setOvLaedt(false);
          setOvBeispieleStand((n) => n + 1);
        },
        () => {
          if (!aktiv) return;
          setOvFehlt(true);
          setOvLaedt(false);
        },
      );
    void laden();
    window.addEventListener("online", laden);
    return () => {
      aktiv = false;
      window.removeEventListener("online", laden);
    };
  }, [beispieleOffen]);
  useEffect(() => {
    if (!beispieleOffen) return;
    const urls = sichtbarSchluessel ? sichtbarSchluessel.split("|") : [];
    let aktiv = true;
    // Schon Bekanntes sofort zeigen, den Rest nachladen.
    const bekannt: Record<string, Erfassungsbogen> = {};
    for (const u of urls) {
      const b = BOGEN_CACHE.get(u);
      if (b) bekannt[u] = b;
    }
    setBeispielDaten(bekannt);
    setLadeFehlt("");
    const fehlend = urls.filter((u) => !(u in bekannt));
    if (fehlend.length === 0) {
      setBeispielLaedt(false);
      return;
    }
    setBeispielLaedt(true);
    // Je Bogen einzeln in den Stand geben statt erst am Ende: bei einem großen
    // Ordner (THW: über 100 Bögen) füllt sich die Tabelle so nach und nach.
    void Promise.all(
      fehlend.map((u) =>
        beispielBogen(u).then(
          (b) => {
            if (aktiv) setBeispielDaten((stand) => ({ ...stand, [u]: b }));
            return true;
          },
          () => false,
        ),
      ),
    ).then((geladen) => {
      if (!aktiv) return;
      setBeispielLaedt(false);
      if (geladen.some((ok) => !ok)) {
        setLadeFehlt(
          fehlend.some(istOvBogen)
            ? `Einige Bögen liegen noch nicht auf dem Gerät. ${OV_OFFLINE_TEXT}`
            : "Einige Beispielbögen liegen noch nicht auf dem Gerät — sie werden mit Netz nachgeladen (siehe Offline-Zeile der Startseite).",
        );
      }
    });
    return () => {
      aktiv = false;
    };
  }, [beispieleOffen, sichtbarSchluessel, neuLaden]);
  // Netz zurück: fehlende Angaben von selbst nachladen (BB-O3).
  useEffect(() => {
    if (!ladeFehlt) return;
    const wieder = () => setNeuLaden((n) => n + 1);
    window.addEventListener("online", wieder);
    return () => window.removeEventListener("online", wieder);
  }, [ladeFehlt]);

  // Nach einem Ordnerwechsel im Dialog: Ansicht nach oben, Fokus auf den Ort.
  useEffect(() => {
    if (!fokusNachWechsel.current) return;
    fokusNachWechsel.current = false;
    const d = beispiele.current;
    if (!d) return;
    d.scrollTop = 0;
    const ziel = d.querySelector<HTMLElement>(".beispiel-pfad [aria-current]") ?? d.querySelector<HTMLElement>(".beispiel-register button");
    ziel?.focus({ preventScroll: true });
  }, [beispielPfadSchluessel]);

  // Escape und die Zurück-Geste (cancel) gehen eine Ebene hoch bzw. leeren die
  // Suche, statt den ganzen Dialog zu schließen (BB-E4, BB-H2, BB-N2).
  // „Schließen" schließt weiterhin sofort.
  useEffect(() => {
    const d = beispiele.current;
    if (!d) return;
    const abbrechen = (e: Event) => {
      if (sucheAktuell.current) {
        e.preventDefault();
        setBeispielSuche("");
        return;
      }
      const p = pfadAktuell.current;
      if (p.length === 0) return;
      e.preventDefault();
      pfadSetzen(p.slice(0, -1));
    };
    d.addEventListener("cancel", abbrechen);
    return () => d.removeEventListener("cancel", abbrechen);
  }, []);

  // Die Pfadleiste klebt unter der Kopfzeile des Dialogs (BB-G5, BB-M5, BB-H5):
  // Deren Höhe hängt an Schriftgröße und Breite, deshalb gemessen.
  useEffect(() => {
    if (!beispieleOffen || typeof ResizeObserver !== "function") return;
    const d = beispiele.current;
    const kopf = d?.querySelector<HTMLElement>(":scope > .kopfzeile");
    if (!d || !kopf) return;
    const messen = () => d.style.setProperty("--beispiel-kopf", `${kopf.offsetHeight}px`);
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(kopf);
    return () => ro.disconnect();
  }, [beispieleOffen]);

  const beispielGeladen = beispielBoegen.filter((b) => b.url in beispielDaten).length;

  /** PDF eines Beispielbogens anfordern; Fehler im Dialog zeigen. */
  async function beispielHolen(datei: string, url: string, ordner: string[]) {
    setBeispielFehler("");
    setBeispielQuittung("");
    setBeispielLaeuft(datei);
    const sitzung = beispielSitzung.current;
    // Dateiname mit „uebung-beispiel" und Ordner (BB-A4, BB-H Hinweis 4): „01-zugtrupp.pdf" gab es in mehreren Ordnern.
    const name = ["uebung-beispiel", ...ordner, datei].join("-");
    try {
      await beispielPdf(name, url, () => beispielSitzung.current !== sitzung);
      if (beispielSitzung.current === sitzung) {
        setBeispielQuittung(istNativ() ? `PDF „${name}.pdf“ erzeugt.` : `PDF „${name}.pdf“ erzeugt — liegt im Download-Ordner.`);
        window.setTimeout(() => setBeispielQuittung((q) => (q.includes(name) ? "" : q)), 6000);
      }
    } catch (err) {
      setBeispielFehler(`PDF konnte nicht erzeugt werden: ${fehlerText(err)}`);
    } finally {
      setBeispielLaeuft("");
    }
  }

  /**
   * Link zum Beispielbogen weitergeben: Share-Sheet, wo es eins gibt (App,
   * mobiler Browser), sonst in die Zwischenablage. Fehlt beides, steht der Link
   * zum Markieren im Hinweis. Derselbe Weg wie „Link teilen" im Bogen selbst.
   */
  async function beispielLinkHolen(datei: string, url: string) {
    setBeispielFehler("");
    setBeispielKopiert("");
    setBeispielLaeuft(datei);
    try {
      const { link, titel } = await beispielLinkUrl(url);
      if (shareSheetVerfuegbar()) {
        if (istNativ()) await linkTeilen(titel, link);
        else await navigator.share({ title: titel, text: titel, url: link });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        setBeispielKopiert(datei);
        window.setTimeout(() => setBeispielKopiert((stand) => (stand === datei ? "" : stand)), 3000);
      } else {
        await zeigeHinweis({ titel: "Bogen-Link", text: "Zum Weitergeben markieren und kopieren:", kopiertext: link });
      }
    } catch (err) {
      // Abbruch im Share-Dialog ist kein Fehler.
      if (err instanceof Error && err.name === "AbortError") return;
      setBeispielFehler(`Link konnte nicht erzeugt werden: ${fehlerText(err)}`);
    } finally {
      setBeispielLaeuft("");
    }
  }

  /** Beispielbogen in der App öffnen — wie ein gescannter Bogen. */
  async function beispielAnsehen(datei: string, url: string) {
    setBeispielFehler("");
    setBeispielLaeuft(datei);
    const sitzung = beispielSitzung.current;
    try {
      const bogen = await beispielKopie(url);
      // Dialog inzwischen geschlossen: nichts mehr öffnen (BB-E1).
      if (beispielSitzung.current !== sitzung) return;
      if (await onBogenOeffnen(bogen)) beispiele.current?.close();
    } catch (err) {
      setBeispielFehler(`Bogen konnte nicht geladen werden: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBeispielLaeuft("");
    }
  }

  /** Alle Bögen des offenen Ordners in eine neue Übungs-Sammlung (BB-K1, BB-W4, BB-A1). */
  async function alleAlsUebung() {
    if (!onAlsUebung) return;
    // Ein Doppeltipp auf ein Register traf mit dem zweiten Tipp diesen Knopf und
    // legte ohne Rückfrage eine Sammlung an (Runde 2, BB2-G2, BB2-E2).
    if (performance.now() - letzterWechsel.current < 800) return;
    setBeispielFehler("");
    setBeispielLaeuft("*alle*");
    const sitzung = beispielSitzung.current;
    try {
      // Der Zug aus dem Dateinamen (2. TZ, FZ FK, FZ Log) reist mit: Ohne ihn legte die Sammlung
      // die Einheiten des 2. TZ als Folgemeldung auf die des 1. (BB2-K1) und führte sie „ohne Zug".
      const boegen = await Promise.all(
        beispielBoegen.map(async ({ url, datei }) => ({ bogen: await beispielKopie(url), zug: zugHinweis(datei) || undefined })),
      );
      if (beispielSitzung.current !== sitzung) return;
      // Kurzer Name: der offene Ordner, nicht der ganze Pfad (bis 161 Zeichen, BB2-K3, BB2-A4).
      if (await onAlsUebung(boegen, ordnerLabel(beispielPfad[beispielPfad.length - 1] ?? ""))) beispiele.current?.close();
    } catch (err) {
      setBeispielFehler(`Sammlung konnte nicht angelegt werden: ${fehlerText(err)}`);
    } finally {
      setBeispielLaeuft("");
    }
  }

  function beispieleOeffnen() {
    // Dort weiter, wo man zuletzt war (BB-S3, BB-W3); einen nicht mehr
    // vorhandenen Ordner verwirft der Dialog. Der Ordner der Ortsverbände kommt
    // erst mit seinem Baustein und darf deshalb kurz leer sein.
    const p = pfadLaden();
    setBeispielPfad(p.length === 0 || unterPfad(p).length > 0 || imOvOrdner(p) ? p : []);
    setBeispielSuche("");
    setAusSuche("");
    setBeispielFehler("");
    letzterWechsel.current = performance.now(); // Doppeltipp auf „Beispielbögen ansehen" trifft nichts im Dialog
    setBeispieleOffen(true);
    if (!beispiele.current?.open) beispiele.current?.showModal();
  }

  // Jede Anfrage öffnet den Dialog (auch die erste, mit der dieser Baustein geladen wurde).
  const oeffnenAktuell = useRef(beispieleOeffnen);
  oeffnenAktuell.current = beispieleOeffnen;
  useEffect(() => {
    if (anfrage > 0) oeffnenAktuell.current();
  }, [anfrage]);

  return (
    <>
      <Dialog
        titel="Beispielbögen"
        dialogRef={beispiele}
        klasse="breit beispiele-dialog"
        onSchliessen={() => {
          beispielSitzung.current++; // laufendes „Anzeigen"/„PDF" verfällt (BB-E1)
          setBeispieleOffen(false);
        }}
      >
        {/* Die Liste steht vorn, die Erklärung klappt auf (R8-M5): vorher gingen 15 Zeilen Text der Liste voran, die
            erst auf dem zweiten Bild begann. */}
        <details className="beispiele-erklaerung">
          <summary>Was sind Beispielbögen? Was heißen Anzeigen, PDF und Link?</summary>
          <p>
            Ausgefüllte Beispiel-Erfassungsbögen (fiktive Einheiten und Personen) –
            zum Ansehen, für Übungen oder zum Testen des QR-Imports. Alle sind als
            Übung gekennzeichnet: In der App erscheint ein Störer, PDFs tragen das
            Wasserzeichen „ÜBUNG". <strong>Anzeigen</strong>{" "}
            öffnet den Bogen in der App, als wäre er gerade gescannt worden;{" "}
            <strong>PDF</strong> erzeugt ihn im aktuellen Layout – die eingebetteten
            QR-Codes lassen sich direkt mit der App scannen. <strong>Link</strong>{" "}
            gibt den Bogen-Link weiter (Share-Sheet, sonst Zwischenablage): Er trägt
            den kompletten Bogen und öffnet ihn beim Antippen in der App.
          </p>
        </details>
        {/* Suche über alle Ordner und Bögen (BB-S2, BB-K4, BB-W8). */}
        <label className="beispiel-suche">
          <span>Suchen</span>
          <input
            type="search"
            value={beispielSuche}
            placeholder="Ort, OV oder Einheit, z. B. Oldenburg"
            enterKeyHint="search"
            onChange={(e) => setBeispielSuche(e.target.value)}
          />
        </label>
        {/* Pfadleiste: ein echter Zurück-Knopf plus der klickbare Pfad. Klebt
            unter der Kopfzeile; bei tiefen Ordnern stehen auf schmalen Geräten
            nur „Alle", „…" und die letzten zwei Ebenen. */}
        {/* Pfadleiste: Zurück-Knopf und Pfad in EINER Zeile, auf jeder Breite und
            Schriftgröße (Runde 2, BB2-M1, BB2-G1, BB2-M2, BB2-H1): tiefe Ordner
            zeigen „Alle", „…" und die letzten zwei Ebenen, lange Namen enden mit
            „…". Vorher wuchs die klebende Leiste bei 200 % auf 97 % des Dialogs. */}
        {!suchErgebnis && beispielPfad.length > 0 && (
          <nav className="beispiel-pfad" aria-label="Ordner">
            {ausSuche ? (
              <button
                type="button"
                onClick={() => {
                  setBeispielSuche(ausSuche);
                  setAusSuche("");
                }}
              >
                ‹ Zur Suche
              </button>
            ) : (
              <button type="button" onClick={() => tippWechsel(beispielPfad.slice(0, -1))}>‹ Zurück</button>
            )}
            <ol>
              <li>
                <button type="button" className="link" onClick={() => tippWechsel([])}>Alle</button>
              </li>
              {beispielPfad.length > 2 && (
                <li>
                  <button
                    type="button"
                    className="link"
                    aria-label={`Eine Ebene über „${ordnerLabel(beispielPfad[beispielPfad.length - 2]!)}“`}
                    title={beispielPfad.slice(0, -2).map(ordnerLabel).join(" › ")}
                    onClick={() => tippWechsel(beispielPfad.slice(0, -2))}
                  >
                    …
                  </button>
                </li>
              )}
              {beispielPfad.map((seg, i) =>
                beispielPfad.length > 2 && i < beispielPfad.length - 2 ? null : (
                  <li key={`${i}/${seg}`}>
                    {i === beispielPfad.length - 1 ? (
                      <strong aria-current="location" tabIndex={-1} title={ordnerLabel(seg)}>{ordnerLabel(seg)}</strong>
                    ) : (
                      <button type="button" className="link" title={ordnerLabel(seg)} onClick={() => tippWechsel(beispielPfad.slice(0, i + 1))}>
                        {ordnerLabel(seg)}
                      </button>
                    )}
                  </li>
                ),
              )}
            </ol>
          </nav>
        )}
        {/* Bildschirmleser: neuer Ordner bzw. Suchergebnis (BB-M3). */}
        <p className="nur-sr" aria-live="polite">
          {suchErgebnis
            ? `${suchErgebnis.ordner.length} Ordner und ${suchErgebnis.boegen.length} Bögen gefunden`
            : beispielPfad.length > 0
              ? `${ordnerLabel(beispielPfad[beispielPfad.length - 1]!)}: ${beispielBoegen.length} Bögen, ${beispielOrdner.length} Unterordner`
              : ""}
        </p>
        {suchErgebnis && (
          <p className="beispiel-zaehler">
            <strong>
              {suchErgebnis.ordner.length} Ordner, {suchErgebnis.boegen.length}{" "}
              {suchErgebnis.boegen.length === 1 ? "Bogen" : "Bögen"}
            </strong>
            {suchErgebnis.mehr && <span className="hinweis">Nicht alle Treffer gezeigt — genauer suchen, z. B. mit Einheit.</span>}
            {suchErgebnis.ordner.length === 0 && suchErgebnis.boegen.length === 0 && (
              <span className="hinweis">Nichts gefunden. Ort oder Einheit getrennt eingeben, z. B. „Bergungsgruppe Oldenburg“ oder „Zugtrupp Albstadt“.</span>
            )}
            {ovLaedt && <span className="hinweis">Bögen der Ortsverbände werden noch geladen …</span>}
          </p>
        )}
        {suchErgebnis && suchErgebnis.ordner.length > 0 && (
          <ul className="beispiel-register" aria-label="Gefundene Ordner">
            {suchErgebnis.ordner.map((pfad) => (
              <li key={`s/${pfad.join("/")}`}>
                <button
                  type="button"
                  onClick={() => {
                    const q = beispielSuche;
                    tippWechsel(pfad);
                    setAusSuche(q);
                  }}
                >
                  <span className="beispiel-register-name">
                    {ordnerLabel(pfad[pfad.length - 1]!)}
                    {ordnerHerkunft(pfad) && <span className="hinweis beispiel-register-herkunft">{ordnerHerkunft(pfad)}</span>}
                  </span>
                  <span className="beispiel-register-zahl">
                    {unterPfad(pfad).length.toLocaleString("de-DE")} {unterPfad(pfad).length === 1 ? "Bogen" : "Bögen"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {/* Ordner als Register: jede Zeile ganz antippbar, Name links, Bogenzahl
            rechts in der Datenschrift. Vorher eine Aufzählung unterstrichener
            Links mit der Zahl in Klammern. */}
        {(beispielOrdner.length > 0 || (ovLaedt && beispielPfad.length === 1 && beispielPfad[0] === "thw")) && (
          <ul className="beispiel-register" aria-label={beispielPfad.length === 0 ? "Organisation oder Thema" : "Unterordner"}>
            {beispielOrdner.map(({ ordner, anzahl }) => (
              <li key={`d/${ordner}`}>
                <button type="button" onClick={() => tippWechsel([...beispielPfad, ordner])}>
                  <span className="beispiel-register-name">{ordnerLabel(ordner)}</span>
                  <span className="beispiel-register-zahl">
                    {/* THW zählt erst fertig, wenn die Ortsverbände da sind (BB-L H5, BB-N6). */}
                    {ovLaedt && beispielPfad.length === 0 && ordner === "thw" ? "… Bögen" : `${anzahl.toLocaleString("de-DE")} ${anzahl === 1 ? "Bogen" : "Bögen"}`}
                  </span>
                </button>
              </li>
            ))}
            {/* Platzhalter, bis der Ordner der Ortsverbände geladen ist (BB-S5, BB-H10). */}
            {ovLaedt && beispielPfad.length === 1 && beispielPfad[0] === "thw" && (
              <li>
                <button type="button" disabled>
                  <span className="beispiel-register-name">{ordnerLabel("ortsverbaende")}</span>
                  <span className="beispiel-register-zahl">wird geladen …</span>
                </button>
              </li>
            )}
          </ul>
        )}
        {ovFehlt && beispielPfad.length <= 1 && (beispielPfad.length === 0 || beispielPfad[0] === "thw") && (
          <p className="hinweis" role="status">
            Ohne Netz fehlt unter „THW“ der Ordner „Alle Einheiten aller Ortsverbände“. Er erscheint, sobald das Netz zurück ist.
          </p>
        )}
        {!suchErgebnis && imOvOrdner(beispielPfad) && <p className="hinweis">{OV_OFFLINE_TEXT}</p>}
        {!suchErgebnis && beispielPfad.length === 1 && beispielPfad[0] === "katastrophenschutz" && (() => {
          const fehlen = Object.entries(LAENDER)
            .filter(([k]) => !beispielOrdner.some((o) => o.ordner === k))
            .map(([, n]) => n);
          return fehlen.length > 0 ? <p className="hinweis">Noch ohne Beispielbögen: {fehlen.join(", ")}.</p> : null;
        })()}
        {ladeFehlt && (
          <p className="hinweis warnung-text beispiel-ladefehler" role="status">
            {ladeFehlt}{" "}
            <button type="button" className="link" onClick={() => setNeuLaden((n) => n + 1)}>Erneut laden</button>
          </p>
        )}
        {beispielFehler && <FehlerImBild text={beispielFehler} />}
        {beispielQuittung && <p className="hinweis beispiel-quittung" role="status">{beispielQuittung}</p>}
        {/* Bogenzahl über der Tabelle, der Ladestand gleich dahinter: ein Ordner
            mit 45 Bögen braucht einen Moment, und eine Tabelle mit „—" sieht
            sonst aus wie „keine Daten". */}
        {!suchErgebnis && beispielBoegen.length > 0 && (
          <p className="beispiel-zaehler">
            <strong>
              {beispielBoegen.length.toLocaleString("de-DE")} {beispielBoegen.length === 1 ? "Bogen" : "Bögen"}
              {/* Lose Bögen neben Unterordnern (THW, DRK): sagen, dass sie direkt hier liegen (BB-S6, BB-N6, BB-W8). */}
              {beispielOrdner.length > 0 && beispielPfad.length > 0 && ` direkt in „${ordnerLabel(beispielPfad[beispielPfad.length - 1]!)}“, außerhalb der Ordner oben`}
            </strong>
            {beispielLaedt && (
              <span className="hinweis" role="status">
                Angaben werden geladen … {beispielGeladen} von {beispielBoegen.length}
              </span>
            )}
          </p>
        )}
        {onAlsUebung && !suchErgebnis && beispielBoegen.length > 1 && (
          <div className="beispiel-sammelweg">
            <button type="button" disabled={beispielLaeuft !== ""} onClick={() => void alleAlsUebung()}>
              Alle {beispielBoegen.length.toLocaleString("de-DE")} in eine Übungs-Sammlung
            </button>
            <span className="hinweis">
              Legt eine neue Sammlung der Art „Übung“ mit diesen Bögen an — mit Sammel-PDF, Lageblatt und Weitergabe. Dein offener Bogen bleibt, wie er ist.
            </span>
          </div>
        )}
        {beispielBoegen.length > 0 && (
          <div className="tabellen-scroll">
            {/* Die role-Attribute sind kein Selbstzweck: auf schmalen Geräten
                setzt das CSS die Zeilen auf display:block (Karten statt
                Seitwärtsrollen) und nähme der Tabelle sonst die Semantik. */}
            <table className="uebersicht beispiele" role="table">
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader">Einheit</th>
                  <th role="columnheader">Herkunft</th>
                  <th role="columnheader">Stärke</th>
                  <th role="columnheader">Bogen</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {beispielBoegen.map(({ datei, url, ordner }) => {
                  const b = beispielDaten[url];
                  const s = b ? staerke(b) : null;
                  return (
                    <tr key={datei} role="row">
                      <td role="cell">
                        <span className="beispiel-einheit">
                          {b ? (
                            <EinheitZeichen einheit={b.einheit} className="einheit-avatar" aria-hidden="true" />
                          ) : (
                            <span className="beispiel-zeichen-platz" aria-hidden="true" />
                          )}
                          <span>
                            <strong>{b ? einheitsTypText(b) || datei : datei}</strong>
                            {zugHinweis(datei) && <span className="hinweis">{zugHinweis(datei)}</span>}
                            {beispielLaeuft === datei && <span className="hinweis">wird vorbereitet …</span>}
                          </span>
                        </span>
                      </td>
                      <td role="cell">
                        {b ? (
                          <>
                            <strong>{einheitOrt(b.einheit) || "—"}</strong>
                            <span className="hinweis">{traegerText(b)}</span>
                            {obersteEbene(b) && <span className="hinweis">{obersteEbene(b)}</span>}
                          </>
                        ) : (
                          <span className="hinweis">{beispielLaedt ? "…" : "nicht geladen"}</span>
                        )}
                      </td>
                      <td className="zahl" role="cell">
                        {b && s ? (
                          <>
                            <strong>{s.fuehrer}/{s.unterfuehrer}/{s.mannschaft}//{s.gesamt}</strong>
                            <span className="hinweis">
                              {b.fahrzeuge.length} {b.fahrzeuge.length === 1 ? "Fahrzeug" : "Fahrzeuge"}
                            </span>
                          </>
                        ) : (
                          <span className="hinweis">{beispielLaedt ? "…" : "—"}</span>
                        )}
                      </td>
                      <td role="cell">
                        <span className="beispiel-aktionen">
                          {/* Bewusst kein .primaer: das ist in dieser App die
                              eine dominante Aktion einer Ansicht — in einer
                              Liste mit Dutzenden Zeilen wäre sie nur laut. */}
                          <button type="button"
                            disabled={beispielLaeuft !== ""}
                            onClick={() => void beispielAnsehen(datei, url)}
                          >
                            <IconAuge />
                            Anzeigen
                          </button>
                          <button type="button"
                            disabled={beispielLaeuft !== ""}
                            onClick={() => void beispielHolen(datei, url, ordner)}
                          >
                            <IconPdf />
                            PDF
                          </button>
                          <button type="button"
                            disabled={beispielLaeuft !== ""}
                            onClick={() => void beispielLinkHolen(datei, url)}
                          >
                            <IconLink />
                            {beispielKopiert === datei ? "Kopiert" : "Link"}
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Dialog>
    </>
  );
}
