/**
 * Browser-Helfer für die SPA: Kompression (pako), QR-Erzeugung,
 * Datei speichern/laden, Vokabular-Anzeige.
 */

import { deflateRaw, inflateRaw } from "pako";
import QRCode from "qrcode";
import {
  Erfassungsbogen,
  Ernaehrung,
  Fahrerlaubnis,
  Fahrzeug,
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
import { encodePayloadUrl, type Kompressor } from "../codec";
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
  return f.thwKennzeichen != null ? `THW-${String(f.thwKennzeichen).padStart(5, "0")}` : (f.kennzeichenFreitext ?? "");
}

export function funkrufText(f: Fahrzeug, einheitOrt: string): string {
  if (!f.funkrufname) return "";
  const fr = f.funkrufname;
  const kennwort = vokabText(fr.kennwort, FUNKRUF_KENNWOERTER);
  const ort = fr.eigenerStandort ? einheitOrt : (fr.ort ?? "");
  return [kennwort, ort, fr.teile.join("/")].filter(Boolean).join(" ");
}

export function datumDeutsch(iso: string): string {
  const [j, m, t] = iso.split("-");
  return `${t}.${m}.${j}`;
}

// ---------------------------------------------------------------- QR-Code

export interface QrInfo {
  datenUrl: string;
  zeichen: number;
  version: number;
}

export async function qrErzeugen(b: Erfassungsbogen): Promise<QrInfo> {
  // QR-Inhalt ist eine App-URL: Die Kamera erkennt sie und öffnet die App
  // bzw. die Web-App; die Daten stehen im Fragment (bleiben also lokal).
  const url = encodePayloadUrl(b, browserKompressor);
  const optionen = { errorCorrectionLevel: "M" as const };
  const datenUrl = await QRCode.toDataURL(url, { ...optionen, width: 520, margin: 2 });
  return { datenUrl, zeichen: url.length, version: QRCode.create(url, optionen).version };
}

// ------------------------------------------------------------ Datei-Dialog

export async function bogenSpeichern(b: Erfassungsbogen): Promise<void> {
  const json = JSON.stringify(b, null, 2);
  const name = (b.einheit.name || "bogen").replace(/[^\wäöüÄÖÜß-]+/g, "_");
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
 * Nicht-blockierende Plausibilitätshinweise für Stärkemeldung, Unterbringung
 * und Einsatzzeitraum. Leeres Array = alles plausibel.
 */
export function plausibilitaet(b: Erfassungsbogen): string[] {
  const hinweise: string[] = [];
  const s = staerke(b);
  const mwd = unterbringungMWD(b);

  if (s.gesamt === 0) {
    hinweise.push("Stärke ist 0 — es ist noch kein Personal erfasst.");
  }
  if (s.gesamt !== s.fuehrer + s.unterfuehrer + s.mannschaft) {
    hinweise.push(
      `Stärke: ${s.fuehrer} + ${s.unterfuehrer} + ${s.mannschaft} ergibt nicht die Gesamtstärke ${s.gesamt}.`,
    );
  }
  // Unterbringung nur prüfen, wenn sie belastbar ist: bei vollständiger
  // Personalerfassung abgeleitet, im Meldekopf-Modus nur wenn manuell erfasst.
  const mwdBelastbar =
    b.personalErfassung === PersonalErfassung.VOLLSTAENDIG || b.unterbringungManuell != null;
  const mwdSumme = mwd.m + mwd.w + mwd.d;
  if (mwdBelastbar && s.gesamt > 0 && mwdSumme !== s.gesamt) {
    hinweise.push(
      `Unterbringung: M ${mwd.m} + W ${mwd.w} + D ${mwd.d} = ${mwdSumme} weicht von der Gesamtstärke ${s.gesamt} ab.`,
    );
  }
  if (
    b.personalErfassung === PersonalErfassung.NUR_STAERKE &&
    b.staerkeManuell &&
    b.personal.length > b.staerkeManuell.gesamt
  ) {
    hinweise.push(
      `Es sind ${b.personal.length} Ansprechpartner erfasst, die Gesamtstärke ist aber nur ${b.staerkeManuell.gesamt}.`,
    );
  }
  if (b.einsatz.zeitraumBis < b.einsatz.zeitraumVon) {
    hinweise.push("Einsatzzeitraum: „bis“ liegt vor „von“.");
  }
  if (b.sofortbedarf && s.gesamt > 0 && b.sofortbedarf.verpflegungPersonen > s.gesamt) {
    hinweise.push(
      `Verpflegung für ${b.sofortbedarf.verpflegungPersonen} Personen angefordert, die Gesamtstärke ist aber ${s.gesamt}.`,
    );
  }
  if (b.sofortbedarf) {
    const vp = verpflegung(b);
    if (vp.vegetarisch + vp.vegan > b.sofortbedarf.verpflegungPersonen) {
      hinweise.push("Sofortbedarf: mehr Vegetarier/Veganer erfasst als Personen mit Verpflegungsbedarf.");
    }
  }
  return hinweise;
}

// ------------------------------------------------------------- Neuer Bogen

export function neuerBogen(): Erfassungsbogen {
  const heute = datumAusIso(new Date().toISOString().slice(0, 10));
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: heute,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: {},
      name: "",
      hierarchie: [],
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
