/**
 * Browser-Helfer für die SPA: Kompression (pako), QR-Erzeugung,
 * Datei speichern/laden, Vokabular-Anzeige.
 */

import { deflateRaw, inflateRaw } from "pako";
import QRCode from "qrcode";
import {
  Einheit,
  Erfassungsbogen,
  Ernaehrung,
  HierarchieEbene,
  Fahrerlaubnis,
  Fahrzeug,
  Kontakt,
  KontaktArt,
  OrganisationsTyp,
  Person,
  PersonalErfassung,
  SCHEMA_VERSION,
  Sofortbedarf,
  VokabularWert,
  datumAusIso,
  staerke,
  unterbringungMWD,
  verpflegung,
} from "../model";
import {
  EEB_KARTE_MAGIC,
  EEB_URL_PREFIX,
  QR_EINZEL_MAX_VERSION,
  QR_SEGMENT_ZIEL_VERSION,
  datenKodieren,
  segmentPayloadUrls,
  type Kompressor,
} from "../codec";
import { signiertePayloadBytes } from "../signatur";
import { absenderkarteLaden } from "./absenderkarte";
import { geraeteSchluesselSicherstellen } from "./geraete-schluessel";
import { istNativ, textTeilen } from "./nativ";
import {
  FUNKRUF_KENNWOERTER,
  THW_EINHEITSTYPEN,
  THW_FUNKTIONEN,
  THW_FAHRZEUGTYPEN,
  THW_HIERARCHIE_EBENEN,
  type VokabularEintrag,
} from "../vokabulare/thw";

export const browserKompressor: Kompressor = {
  deflateRaw: (d) => deflateRaw(d, { level: 9 }),
  inflateRaw: (d) => inflateRaw(d),
};

// ------------------------------------------------------------------ Anzeige

export const ORG_OPTIONEN: { wert: OrganisationsTyp; label: string }[] = [
  { wert: OrganisationsTyp.THW, label: "THW" },
  { wert: OrganisationsTyp.FEUERWEHR, label: "Feuerwehr" },
  { wert: OrganisationsTyp.POLIZEI, label: "Polizei" },
  { wert: OrganisationsTyp.BUNDESPOLIZEI, label: "Bundespolizei" },
  { wert: OrganisationsTyp.DRK, label: "DRK" },
  { wert: OrganisationsTyp.JUH, label: "Johanniter (JUH)" },
  { wert: OrganisationsTyp.MHD, label: "Malteser (MHD)" },
  { wert: OrganisationsTyp.ASB, label: "ASB" },
  { wert: OrganisationsTyp.DLRG, label: "DLRG" },
  { wert: OrganisationsTyp.BUNDESWEHR, label: "Bundeswehr" },
  { wert: OrganisationsTyp.RETTUNGSDIENST, label: "Rettungsdienst" },
  { wert: OrganisationsTyp.SONSTIGE, label: "Sonstige" },
];

export function orgLabel(o: OrganisationsTyp): string {
  return ORG_OPTIONEN.find((e) => e.wert === o)?.label ?? `Organisation #${o}`;
}

/** Vokabulare gelten organisationsspezifisch — bislang nur THW befüllt. */
export function vokabularFuer(
  org: OrganisationsTyp,
  art: "einheitstyp" | "funktion" | "fahrzeug" | "ebene" | "kennwort",
): VokabularEintrag[] {
  if (art === "kennwort") return FUNKRUF_KENNWOERTER;
  if (org !== OrganisationsTyp.THW) return [];
  switch (art) {
    case "einheitstyp": return THW_EINHEITSTYPEN;
    case "funktion": return THW_FUNKTIONEN;
    case "fahrzeug": return THW_FAHRZEUGTYPEN;
    case "ebene": return THW_HIERARCHIE_EBENEN;
  }
}

export function vokabText(
  v: VokabularWert | undefined,
  tabelle: VokabularEintrag[],
  form: "kurz" | "name" = "kurz",
): string {
  if (!v) return "";
  if (v.code != null) {
    const e = tabelle.find((t) => t.code === v.code);
    return e ? e[form] : `#${v.code}`;
  }
  return v.freitext ?? "";
}

export const FE_TEXT: Record<Fahrerlaubnis, string> = {
  [Fahrerlaubnis.NONE]: "—",
  [Fahrerlaubnis.AM]: "AM",
  [Fahrerlaubnis.A1]: "A1",
  [Fahrerlaubnis.A2]: "A2",
  [Fahrerlaubnis.A]: "A",
  [Fahrerlaubnis.B]: "B",
  [Fahrerlaubnis.BE]: "BE",
  [Fahrerlaubnis.C1]: "C1",
  [Fahrerlaubnis.C1E]: "C1E",
  [Fahrerlaubnis.C]: "C",
  [Fahrerlaubnis.CE]: "CE",
  [Fahrerlaubnis.D1]: "D1",
  [Fahrerlaubnis.D1E]: "D1E",
  [Fahrerlaubnis.D]: "D",
  [Fahrerlaubnis.DE]: "DE",
};

/** "GrFü / Kf C, SGL" wie auf dem Papierbogen. */
export function funktionsText(p: Person, org: OrganisationsTyp): string {
  const tabelle = vokabularFuer(org, "funktion");
  const [grund, ...rest] = p.funktionen.map((f) => vokabText(f, tabelle));
  const kf = p.fahrerlaubnis !== Fahrerlaubnis.NONE ? `Kf ${FE_TEXT[p.fahrerlaubnis]}` : "";
  const zusatz = [kf, ...rest].filter(Boolean).join(", ");
  return [grund, zusatz].filter(Boolean).join(" / ");
}

export function kennzeichenText(f: Fahrzeug): string {
  return f.kennzeichen ?? "";
}

/** Erreichbarkeit einer Person wie im Bogenkopf/PDF ("Mobil: … (D)"). */
export function kontaktText(k: Kontakt): string {
  if (k.emailTemplate === 1) return "eMail: Standard (D)";
  const art = k.art === KontaktArt.EMAIL ? "eMail" : k.art === KontaktArt.MOBIL ? "Mobil" : "Tel";
  return `${art}: ${k.wert ?? ""} (${k.dienstlich ? "D" : "P"})`;
}

export function funkrufText(f: Fahrzeug, standort: string): string {
  if (!f.funkrufname) return "";
  const fr = f.funkrufname;
  const kennwort = vokabText(fr.kennwort, FUNKRUF_KENNWOERTER);
  const ort = fr.eigenerStandort ? standort : (fr.ort ?? "");
  return [kennwort, ort, fr.teile.join("/")].filter(Boolean).join(" ");
}

/**
 * Standort der Einheit = Name der untersten Zugehörigkeits-Ebene
 * ("Oldenburg (NI)"). Speist den Ortsteil des Funkrufnamens.
 */
export function einheitOrt(e: Einheit): string {
  return e.hierarchie[0]?.name.trim() ?? "";
}

/**
 * Anzeigename der Einheit — abgeleitet statt erfasst: Organisation (bzw.
 * Organisationsname), Standort und Einheitstyp, z. B. „THW Oldenburg (NI)
 * FGr K (A)". Ist immer nicht-leer, weil die Organisation stets gesetzt ist.
 */
export function einheitAnzeigename(e: Einheit): string {
  const org = e.organisationName?.trim() || orgLabel(e.organisation);
  const typ = vokabText(e.einheitsTyp, vokabularFuer(e.organisation, "einheitstyp"), "name");
  return [org, einheitOrt(e), typ].filter(Boolean).join(" ");
}

export function datumDeutsch(iso: string): string {
  const [j, m, t] = iso.split("-");
  return `${t}.${m}.${j}`;
}

// ---------------------------------------------------------------- QR-Code

/** Ein QR-Bild eines Satzes: bei Segmentierung Teil `teilNr` von `anzahl`. */
export interface QrTeil {
  datenUrl: string;
  /** Der im QR-Code kodierte App-Link dieses Teils. */
  url: string;
  teilNr: number; // 1-basiert
  anzahl: number; // 1 = unsegmentiert
  version: number;
}

/**
 * Ergebnis der QR-Erzeugung: im Normalfall genau ein Teil (unsegmentiert),
 * bei zu großem Bogen mehrere Teile (Segmentierung, siehe docs/datenmodell.md).
 */
export interface QrSatz {
  teile: QrTeil[];
  segmentiert: boolean;
  /** Zeichenzahl der (unsegmentierten) Voll-URL — Maß für die Datengröße. */
  zeichen: number;
  /** Höchste QR-Version über alle Teile. */
  version: number;
  /**
   * Der vollständige App-Link mit dem gesamten (signierten) Payload — auch dann,
   * wenn der Bogen für einen einzelnen QR-Code zu groß ist: Segmentierung ist nur
   * eine Grenze des QR-Bildes, nicht des Links. Diese eine URL öffnet beim Antippen
   * den kompletten Bogen und lässt sich als Textlink teilen.
   */
  vollUrl: string;
  /** Container des Payloads — „EEB2K", sobald eine Absenderkarte mitreist. */
  container: "EEB2S" | "EEB2K";
}

const QR_OPTIONEN = { errorCorrectionLevel: "M" as const };

/** QR-Version einer URL messen; `Infinity`, wenn sie in keinen QR-Code passt. */
function qrVersion(url: string): number {
  try {
    return QRCode.create(url, QR_OPTIONEN).version;
  } catch {
    return Infinity;
  }
}

async function teilBild(url: string, teilNr: number, anzahl: number): Promise<QrTeil> {
  // margin 4 = volle Ruhezone (Quiet Zone) — hilft der Erkennung, den Code vom
  // Umfeld zu trennen, besonders wenn mehrere Codes auf einer Seite stehen.
  const datenUrl = await QRCode.toDataURL(url, { ...QR_OPTIONEN, width: 520, margin: 4 });
  return { datenUrl, url, teilNr, anzahl, version: qrVersion(url) };
}

/**
 * Bogen → QR-Satz. QR-Inhalt ist eine App-URL: Die Kamera erkennt sie und öffnet
 * die App bzw. die Web-App; die Daten stehen im Fragment (bleiben also lokal).
 * Passt der Bogen in einen QR-Code (Budget ≤ v25), bleibt es bei genau einem —
 * unverändert zu früher. Erst darüber wird der Payload segmentiert.
 *
 * Der Payload wird immer Ed25519-signiert (Container „EEB2S", netto +97 Bytes)
 * — der Geräteschlüssel bleibt lokal und wird bei Bedarf einmalig erzeugt.
 * Signieren und Segmentieren sind orthogonal: die Segment-Chunks setzen den
 * signierten Payload 1:1 wieder zusammen, die Signatur bleibt intakt.
 *
 * Ist eine Absenderkarte hinterlegt (freiwillig, siehe absenderkarte.ts), reist
 * sie mitsigniert im Container „EEB2K" mit; ohne Karte bleibt alles wie bisher.
 */
export async function qrErzeugen(b: Erfassungsbogen): Promise<QrSatz> {
  const karte = absenderkarteLaden();
  const payload = await signiertePayloadBytes(
    b,
    browserKompressor,
    await geraeteSchluesselSicherstellen(),
    karte,
  );
  // Nicht aus der Karte raten: das 5. Magic-Byte sagt, was tatsächlich drinsteht.
  const container = payload[4] === EEB_KARTE_MAGIC[4] ? "EEB2K" : "EEB2S";
  const url = EEB_URL_PREFIX + datenKodieren(payload);
  const einzelVersion = qrVersion(url);
  if (einzelVersion <= QR_EINZEL_MAX_VERSION) {
    const teil = await teilBild(url, 1, 1);
    return { teile: [teil], segmentiert: false, zeichen: url.length, version: teil.version, vollUrl: url, container };
  }

  // Zu groß: kleinste Teilzahl suchen, bei der jeder Teil auf die gröbere
  // Segment-Zielversion kommt (grobe Codes = zuverlässig scannbar).
  const maxTeile = Math.min(20, payload.length);
  let urls = segmentPayloadUrls(payload, Math.min(2, maxTeile));
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
    vollUrl: url,
    container,
  };
}

// ------------------------------------------------------------ Datei-Dialog

export async function bogenSpeichern(b: Erfassungsbogen): Promise<void> {
  const json = JSON.stringify(b, null, 2);
  const name = einheitAnzeigename(b.einheit).replace(/[^\wäöüÄÖÜß-]+/g, "_");
  if (istNativ()) {
    // In der App gibt es keinen Browser-Download: JSON übers Share-Sheet anbieten
    await textTeilen(`eeb-${name}.json`, json);
    return;
  }
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `eeb-${name}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Ältere Bögen (QR wie JSON) abwärtskompatibel auf das aktuelle Schema heben.
 * Muss zum Codec-Migrationspfad in `decodeBinaer` passen.
 */
export function migriereBogen(b: Erfassungsbogen): Erfassungsbogen {
  if (b.schemaVersion < 3) {
    for (const p of b.personal) {
      if (p.ernaehrung == null) p.ernaehrung = Ernaehrung.FLEISCH;
    }
    const sb = b.sofortbedarf as (Sofortbedarf & { davonVegetarisch?: number }) | undefined;
    if (sb) {
      if (sb.davonVegetarisch && sb.davonVegetarisch > 0 && !b.verpflegungManuell) {
        b.verpflegungManuell = { vegetarisch: sb.davonVegetarisch, vegan: 0 };
      }
      delete sb.davonVegetarisch;
    }
  }
  if (b.schemaVersion < 4) {
    // Getrennte Kennzeichenfelder zusammengeführt: THW-Nummer wird zum String.
    for (const f of b.fahrzeuge as (Fahrzeug & { thwKennzeichen?: number; kennzeichenFreitext?: string })[]) {
      if (f.kennzeichen == null) {
        f.kennzeichen =
          f.thwKennzeichen != null ? `THW-${String(f.thwKennzeichen).padStart(5, "0")}` : f.kennzeichenFreitext;
      }
      delete f.thwKennzeichen;
      delete f.kennzeichenFreitext;
    }
  }
  if (b.schemaVersion < 5) {
    // Bis Schema 4 war „Name der Einheit" ein eigenes Freitextfeld neben einer
    // optionalen Hierarchie — faktisch eine Doppeleingabe zur untersten Ebene.
    const e = b.einheit as Einheit & { name?: string };
    if (e.name && e.hierarchie.length === 0) e.hierarchie.push({ bezeichnung: {}, name: e.name });
    delete e.name;
  }
  b.schemaVersion = SCHEMA_VERSION;
  return b;
}

export async function bogenLaden(datei: File): Promise<Erfassungsbogen> {
  let daten: unknown;
  try {
    daten = JSON.parse(await datei.text());
  } catch {
    throw new Error("Datei ist kein gültiges JSON.");
  }
  const b = daten as Erfassungsbogen;
  if (typeof b?.schemaVersion !== "number" || b.schemaVersion < 2 || b.schemaVersion > SCHEMA_VERSION || !b.einheit || !b.einsatz || !Array.isArray(b.personal)) {
    throw new Error(`Keine gültige Erfassungsbogen-Datei (Schema-Version 2–${SCHEMA_VERSION} erwartet).`);
  }
  return migriereBogen(b);
}

// ------------------------------------------------------ Plausibilitätsprüfung

/**
 * Hinweise, die den Fahrzeug-Schritt betreffen (fehlende Kennzeichen).
 * Getrennt gehalten, damit sie auf der Fahrzeugseite erscheinen und nicht
 * schon bei der Personalerfassung stören.
 */
export function fahrzeugHinweise(b: Erfassungsbogen): string[] {
  const hinweise: string[] = [];
  b.fahrzeuge.forEach((f, i) => {
    if (!kennzeichenText(f).trim()) {
      hinweise.push(`Fahrzeug ${i + 1} hat noch kein Kennzeichen.`);
    }
  });
  return hinweise;
}

/**
 * Ein offener Punkt der Plausibilitäts-/Vollständigkeitsprüfung: der Hinweis
 * plus der Assistenten-Schritt (0-basiert), auf dem er sich beheben lässt —
 * die Übersicht macht daraus eine klickbare Checkliste.
 */
export interface Pruefpunkt {
  text: string;
  schritt: number;
}

// Schritt-Indizes des Assistenten (siehe SCHRITTE in main.tsx).
const S_EINHEIT = 0;
const S_EINSATZ = 1;
const S_PERSONAL = 2;
const S_FAHRZEUGE = 3;
const S_SOFORTBEDARF = 4;

/**
 * Nicht-blockierende Plausibilitätshinweise für Stärkemeldung, Unterbringung
 * und Einsatzzeitraum — je Punkt mit dem Schritt, auf dem er sich beheben
 * lässt. Leeres Array = alles plausibel. Die Fahrzeug-Hinweise hängen
 * standardmäßig mit an (für die Gesamtübersicht); auf der Personalseite
 * werden sie über `mitFahrzeugen = false` weggelassen.
 */
export function pruefpunkte(b: Erfassungsbogen, mitFahrzeugen = true): Pruefpunkt[] {
  const hinweise: Pruefpunkt[] = [];
  const s = staerke(b);
  const mwd = unterbringungMWD(b);

  // Ohne den Namen der untersten Ebene bleibt die Einheit auf dem Bogen
  // namenlos (nur Organisation + Einheitstyp) und der Funkrufname ortlos.
  if (!einheitOrt(b.einheit) && b.einheit.standortRef == null) {
    hinweise.push({ text: "Zugehörigkeit: Der Name der eigenen Einheit (unterste Ebene) fehlt.", schritt: S_EINHEIT });
  }
  if (s.gesamt === 0) {
    hinweise.push({ text: "Stärke ist 0 — es ist noch kein Personal erfasst.", schritt: S_PERSONAL });
  }
  if (s.gesamt !== s.fuehrer + s.unterfuehrer + s.mannschaft) {
    hinweise.push({
      text: `Stärke: ${s.fuehrer} + ${s.unterfuehrer} + ${s.mannschaft} ergibt nicht die Gesamtstärke ${s.gesamt}.`,
      schritt: S_PERSONAL,
    });
  }
  // Unterbringung nur prüfen, wenn sie belastbar ist: bei vollständiger
  // Personalerfassung abgeleitet, im Meldekopf-Modus nur wenn manuell erfasst.
  const mwdBelastbar =
    b.personalErfassung === PersonalErfassung.VOLLSTAENDIG || b.unterbringungManuell != null;
  const mwdSumme = mwd.m + mwd.w + mwd.d;
  if (mwdBelastbar && s.gesamt > 0 && mwdSumme !== s.gesamt) {
    hinweise.push({
      text: `Unterbringung: M ${mwd.m} + W ${mwd.w} + D ${mwd.d} = ${mwdSumme} weicht von der Gesamtstärke ${s.gesamt} ab.`,
      schritt: S_PERSONAL,
    });
  }
  if (
    b.personalErfassung === PersonalErfassung.NUR_STAERKE &&
    b.staerkeManuell &&
    b.personal.length > b.staerkeManuell.gesamt
  ) {
    hinweise.push({
      text: `Es sind ${b.personal.length} Ansprechpartner erfasst, die Gesamtstärke ist aber nur ${b.staerkeManuell.gesamt}.`,
      schritt: S_PERSONAL,
    });
  }
  if (b.einsatz.zeitraumBis < b.einsatz.zeitraumVon) {
    hinweise.push({ text: "Einsatzzeitraum: „bis“ liegt vor „von“.", schritt: S_EINSATZ });
  }
  if (b.sofortbedarf && s.gesamt > 0 && b.sofortbedarf.verpflegungPersonen > s.gesamt) {
    hinweise.push({
      text: `Verpflegung für ${b.sofortbedarf.verpflegungPersonen} Personen angefordert, die Gesamtstärke ist aber ${s.gesamt}.`,
      schritt: S_SOFORTBEDARF,
    });
  }
  if (b.sofortbedarf) {
    const vp = verpflegung(b);
    if (vp.vegetarisch + vp.vegan > b.sofortbedarf.verpflegungPersonen) {
      hinweise.push({
        text: "Sofortbedarf: mehr Vegetarier/Veganer erfasst als Personen mit Verpflegungsbedarf.",
        schritt: S_SOFORTBEDARF,
      });
    }
  }
  // Manuell erfasste Verpflegungs-Aufteilung (Meldekopf): veg + vegan dürfen die
  // Gesamtstärke nicht übersteigen — Hinweis schon bei der Stärkeerfassung.
  if (b.verpflegungManuell && s.gesamt > 0) {
    const vp = verpflegung(b);
    if (vp.vegetarisch + vp.vegan > s.gesamt) {
      hinweise.push({
        text: `Verpflegung: ${vp.vegetarisch} vegetarisch + ${vp.vegan} vegan übersteigen die Gesamtstärke ${s.gesamt}.`,
        schritt: S_PERSONAL,
      });
    }
  }
  // Vollständigkeit für die Weitergabe: genau die Angaben, wegen derer der
  // Meldekopf sonst zurückfragen muss (Auftrag, Erreichbarkeit). Die fehlenden
  // Kennzeichen prüft fahrzeugHinweise() auf dem Fahrzeug-Schritt.
  if (!b.einsatz.ortAuftrag.trim()) {
    hinweise.push({ text: "Ort/Auftrag ist noch leer.", schritt: S_EINSATZ });
  }
  const telefonErfasst = b.personal.some((p) =>
    p.kontakte.some((k) => k.art !== KontaktArt.EMAIL && (k.wert ?? "").trim() !== ""),
  );
  if (s.gesamt > 0 && !telefonErfasst) {
    hinweise.push({
      text: "Keine telefonische Erreichbarkeit erfasst — mindestens eine Führungskraft sollte eine Nummer angeben.",
      schritt: S_PERSONAL,
    });
  }
  if (mitFahrzeugen) {
    hinweise.push(...fahrzeugHinweise(b).map((text) => ({ text, schritt: S_FAHRZEUGE })));
  }
  return hinweise;
}

/** Nur die Hinweistexte — für Stellen, die keinen Sprung zum Schritt brauchen. */
export function plausibilitaet(b: Erfassungsbogen, mitFahrzeugen = true): string[] {
  return pruefpunkte(b, mitFahrzeugen).map((p) => p.text);
}

// ------------------------------------------------- Fortschritt je Schritt

/** Heuristischer Füllstand eines Assistenten-Schritts (reiner Orientierungshelfer). */
export type SchrittStatus = "leer" | "begonnen" | "ok";

export const SCHRITT_STATUS_TITEL: Record<SchrittStatus, string> = {
  leer: "noch leer",
  begonnen: "begonnen",
  ok: "ausgefüllt",
};

/**
 * Leichter Status je Schritt (Einheit, Einsatz, Personal, Fahrzeuge,
 * Sofortbedarf) aus dem Bogen abgeleitet — nur Orientierung, nichts wird
 * erzwungen. Die Übersicht (letzter Schritt) hat bewusst keinen Status.
 */
export function schrittStatus(b: Erfassungsbogen): SchrittStatus[] {
  const e = b.einheit;
  const typGesetzt = e.einheitsTyp.code != null || !!e.einheitsTyp.freitext?.trim();
  // Die erste Zugehörigkeits-Ebene ist die eigene Einheit und damit Pflicht.
  const nameGesetzt = !!einheitOrt(e) || e.standortRef != null;
  const einheitBegonnen = typGesetzt || nameGesetzt || e.hierarchie.length > 1 || !!e.organisationName;
  const einheit: SchrittStatus = typGesetzt && nameGesetzt ? "ok" : einheitBegonnen ? "begonnen" : "leer";

  const ez = b.einsatz;
  const einsatz: SchrittStatus = ez.ortAuftrag.trim()
    ? "ok"
    : ez.einsatzbeginn != null || ez.einsatzende != null
      ? "begonnen"
      : "leer";

  const personal: SchrittStatus = staerke(b).gesamt > 0 ? "ok" : b.personal.length > 0 ? "begonnen" : "leer";

  const fahrzeuge: SchrittStatus = b.fahrzeuge.length > 0 ? "ok" : "leer";

  // Sofortbedarf/Sonstiges ist durchweg optional: „ok", sobald etwas erfasst ist, sonst neutral „leer".
  const sofortbedarf: SchrittStatus = b.sofortbedarf != null || !!b.sonstiges?.trim() ? "ok" : "leer";

  return [einheit, einsatz, personal, fahrzeuge, sofortbedarf];
}

// ------------------------------------------------------------- Neuer Bogen

/**
 * Erste (unterste) Zugehörigkeits-Ebene: die eigene Einheit. Bezeichnung ist
 * mit der untersten Ebene der Organisation vorbelegt (THW: Ortsverband).
 */
export function ersteEbene(org: OrganisationsTyp): HierarchieEbene {
  const [unterste] = vokabularFuer(org, "ebene");
  return { bezeichnung: unterste ? { code: unterste.code } : {}, name: "" };
}

export function neuerBogen(): Erfassungsbogen {
  const heute = datumAusIso(new Date().toISOString().slice(0, 10));
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: heute,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: {},
      hierarchie: [ersteEbene(OrganisationsTyp.THW)],
    },
    einsatz: { zeitraumVon: heute, zeitraumBis: heute, ortAuftrag: "" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [],
    fahrzeuge: [],
  };
}

export function neuePerson(): Person {
  return {
    vorname: "",
    nachname: "",
    staerkeRolle: 0,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: 0,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
  };
}

export function neuesFahrzeug(): Fahrzeug {
  return { typ: {} };
}
