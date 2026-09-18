/**
 * CSV-Export einer Einsatz-Sammlung für die Führungsstelle: eine Zeile je
 * aktuell anwesender Einheit (neueste Revision, nur anwesende — dieselbe
 * Auswahl wie die Summenleiste) plus eine Summenzeile.
 *
 * Die Kurzfassung für die Lagekarte — das Gegenstück mit ALLEN Feldern bis zur
 * einzelnen Person steht in {@link einsatzDetailCsvInhalt} (bogen-csv.ts).
 *
 * Format und Feld-Quotierung kommen aus csv.ts (Excel(DE): Semikolon, BOM,
 * Dezimalkomma).
 *
 * Enthält fremde Personendaten (nur Aggregate je Einheit, keine Namen) — bleibt
 * wie alle Exporte rein lokal.
 */

import { staerke, unterbringungMWD, verpflegung, type Erfassungsbogen } from "@bos/eeb-format/model";
import type { EinsatzArt } from "@bos/meldekopf/einsaetze";
import { einheitAnzeigename, orgLabel, vokabText, vokabularFuer, zeitgruppe } from "./hilfen";
import { aktuelleMeldungen, zaehltInLage } from "./auswertung";
import { csvDatei, csvZeile } from "./csv";
import { MeldeStatus, neuesteJeEinheit, type Einsatzsammlung, type MeldeEintrag, type MeldeQuelle } from "@bos/meldekopf/einsaetze";

const STATUS_LABEL: Record<MeldeStatus, string> = {
  [MeldeStatus.ANWESEND]: "anwesend",
  [MeldeStatus.ABGERUECKT]: "abgerückt",
  [MeldeStatus.AUFGEGANGEN]: "aufgegangen",
};

const QUELLE_LABEL: Record<MeldeQuelle, string> = {
  scan: "Scan",
  manuell: "Manuell",
  "pdf-import": "PDF-Import",
  aufteilung: "Aufteilung",
  zusammenfuehrung: "Zusammenführung",
};

const SPALTEN = [
  "Einheit",
  "Teil",
  "Organisation",
  "Zug",
  "Stärke F",
  "Stärke U",
  "Stärke M",
  "Stärke gesamt",
  "Verpflegung gesamt",
  "Verpflegung veg.",
  "Verpflegung vegan",
  "Unterbringung M",
  "Unterbringung W",
  "Unterbringung D",
  "Diesel (l)",
  "Benzin (l)",
  "Gemisch (l)",
  "Fahrzeuge",
  "Stand",
  "Empfangen",
  "Quelle",
  "Status",
  "Zählt in Lage",
  "Übung",
  "Sofortbedarf",
  "Signatur",
  "Absender",
] as const;

/** Anzeigename wie in der Meldekopf-Oberfläche: Organisation + Standort + Einheitstyp. */
function einheitName(b: Erfassungsbogen): string {
  return einheitAnzeigename(b.einheit);
}

/** Fahrzeug-Kurzbezeichnungen einer Einheit, z. B. „GKW / MzKW". */
function fahrzeugListe(b: Erfassungsbogen): string {
  const tabelle = vokabularFuer(b.einheit.organisation, "fahrzeug");
  return b.fahrzeuge.map((f) => vokabText(f.typ, tabelle)).filter(Boolean).join(" / ");
}

/** Kurzform der Sofortbedarfs-Merker, die sonst nur als Zahl 0 sichtbar wären. */
function sofortbedarfText(b: Erfassungsbogen): string {
  const sb = b.sofortbedarf;
  if (!sb) return "";
  const teile: string[] = [];
  if (sb.unterbringung) teile.push("Unterbringung");
  if (sb.ruhezeitErforderlich) teile.push("Ruhezeit");
  if (sb.dieselLiter || sb.benzinLiter || sb.gemischLiter) teile.push("Kraftstoff");
  return teile.join(" / ");
}

function signaturText(e: MeldeEintrag): string {
  if (!e.signatur) return "unsigniert";
  return e.signatur.zustand === "gueltig"
    ? `gültig${e.signatur.kurzform ? ` (${e.signatur.kurzform})` : ""}`
    : "UNGÜLTIG";
}

/** Freiwillige Absenderangaben der mitsignierten Karte — für die Rückfrage. */
function absenderText(e: MeldeEintrag): string {
  const a = e.signatur?.absender;
  if (!a) return "";
  return [a.name, a.telefon, a.email].map((x) => x?.trim()).filter(Boolean).join(" · ");
}

function datenZeile(art: EinsatzArt, e: MeldeEintrag): string {
  const b = e.bogen;
  const st = staerke(b);
  const vp = verpflegung(b);
  const u = unterbringungMWD(b);
  const sb = b.sofortbedarf;
  return csvZeile([
    einheitName(b),
    // Eigene Spalte statt Anhängsel am Namen: nach einer Aufteilung stehen
    // sonst zwei gleichnamige Zeilen da, und filtern lässt sich das auch nicht.
    e.teilEtikett ?? "",
    orgLabel(b.einheit.organisation),
    e.zugEtikett ?? "",
    st.fuehrer,
    st.unterfuehrer,
    st.mannschaft,
    st.gesamt,
    vp.gesamt,
    vp.vegetarisch,
    vp.vegan,
    u.m,
    u.w,
    u.d,
    sb?.dieselLiter ?? 0,
    sb?.benzinLiter ?? 0,
    sb?.gemischLiter ?? 0,
    fahrzeugListe(b),
    zeitgruppe(b.stand),
    new Date(e.empfangenAm).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" }),
    QUELLE_LABEL[e.quelle],
    STATUS_LABEL[e.status],
    zaehlt(art, e) ? "ja" : "nein",
    b.uebung ? "ÜBUNG" : "",
    sofortbedarfText(b),
    signaturText(e),
    absenderText(e),
  ]);
}

/** Zählt der Eintrag in die Lage? Status UND Übungskennzeichnung entscheiden. */
function zaehlt(art: EinsatzArt, e: MeldeEintrag): boolean {
  return e.status === MeldeStatus.ANWESEND && zaehltInLage(art, e.bogen);
}

/** Summenzeile über alle anwesenden Einheiten — spaltenweise passend zu den Datenzeilen. */
function summenZeile(meldungen: MeldeEintrag[]): string {
  const acc = {
    f: 0, u: 0, m: 0, gesamt: 0,
    vGesamt: 0, veg: 0, vegan: 0,
    uM: 0, uW: 0, uD: 0,
    diesel: 0, benzin: 0, gemisch: 0,
    fahrzeuge: 0,
  };
  for (const e of meldungen) {
    const b = e.bogen;
    const st = staerke(b);
    const vp = verpflegung(b);
    const un = unterbringungMWD(b);
    acc.f += st.fuehrer;
    acc.u += st.unterfuehrer;
    acc.m += st.mannschaft;
    acc.gesamt += st.gesamt;
    acc.vGesamt += vp.gesamt;
    acc.veg += vp.vegetarisch;
    acc.vegan += vp.vegan;
    acc.uM += un.m;
    acc.uW += un.w;
    acc.uD += un.d;
    acc.diesel += b.sofortbedarf?.dieselLiter ?? 0;
    acc.benzin += b.sofortbedarf?.benzinLiter ?? 0;
    acc.gemisch += b.sofortbedarf?.gemischLiter ?? 0;
    acc.fahrzeuge += b.fahrzeuge.length;
  }
  return csvZeile([
    `Summe (${meldungen.length} Einheiten)`,
    "",
    "",
    "",
    acc.f, acc.u, acc.m, acc.gesamt,
    acc.vGesamt, acc.veg, acc.vegan,
    acc.uM, acc.uW, acc.uD,
    acc.diesel, acc.benzin, acc.gemisch,
    acc.fahrzeuge,
    "",
    "",
  ]);
}

/**
 * Einsatz-Sammlung → CSV-Text (mit BOM). Zeilen: Kopf, je anwesende Einheit
 * eine Zeile (nach Anzeigename sortiert), zuletzt die Summenzeile.
 */
export function einsatzCsvInhalt(s: Einsatzsammlung): string {
  // Alle gemeldeten Einheiten, nicht nur die zählenden: Eine abgerückte oder
  // als Übung geführte Einheit fiel bisher wortlos aus der Datei — die
  // Führungsstelle sah eine Lücke, die sie nicht als Lücke erkennen konnte.
  // Die Spalten „Status" und „Zählt in Lage" sagen, was die Summe enthält.
  const alle = neuesteJeEinheit(s.eintraege).sort((a, b) =>
    einheitName(a.bogen).localeCompare(einheitName(b.bogen), "de"),
  );
  const zaehlende = aktuelleMeldungen(s.eintraege, s.art);
  return csvDatei([
    csvZeile([...SPALTEN]),
    ...alle.map((e) => datenZeile(s.art, e)),
    summenZeile(zaehlende),
  ]);
}
