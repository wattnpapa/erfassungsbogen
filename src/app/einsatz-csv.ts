/**
 * CSV-Export einer Einsatz-Sammlung für die Führungsstelle: eine Zeile je
 * aktuell anwesender Einheit (neueste Revision, nur anwesende — dieselbe
 * Auswahl wie die Summenleiste) plus eine Summenzeile.
 *
 * Bewusst OHNE neue Abhängigkeit: reines String-Building. Ausgabeformat auf
 * Excel(DE) getrimmt — Semikolon als Trenner, UTF-8-BOM, deutsche Dezimal-
 * kommas. Zahlen werden über {@link deZahl} formatiert, Felder über {@link feld}
 * bei Bedarf gequotet (Semikolon/Anführungszeichen/Zeilenumbruch).
 *
 * Enthält fremde Personendaten (nur Aggregate je Einheit, keine Namen) — bleibt
 * wie alle Exporte rein lokal.
 */

import { datumZuIso, staerke, unterbringungMWD, verpflegung, type Erfassungsbogen } from "../model";
import { datumDeutsch, orgLabel, vokabText, vokabularFuer } from "./hilfen";
import { aktuelleMeldungen } from "./auswertung";
import type { Einsatzsammlung, MeldeEintrag, MeldeQuelle } from "./einsaetze";

const TRENNER = ";";
/** Excel(DE) erkennt UTF-8 nur zuverlässig mit BOM; ohne BOM landen Umlaute falsch. */
const BOM = "﻿";

const QUELLE_LABEL: Record<MeldeQuelle, string> = {
  scan: "Scan",
  manuell: "Manuell",
  "pdf-import": "PDF-Import",
};

const SPALTEN = [
  "Einheit",
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
  "Quelle",
] as const;

/** Zahl deutsch: Ganzzahl bleibt schlicht, Bruch bekommt Dezimalkomma. */
function deZahl(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

/** CSV-Feld: quotet nur bei Trenner/Quote/Umbruch/Rand-Leerzeichen, verdoppelt interne Quotes. */
function feld(v: string | number): string {
  const s = typeof v === "number" ? deZahl(v) : v;
  return /[";\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

function zeile(werte: (string | number)[]): string {
  return werte.map(feld).join(TRENNER);
}

/** Anzeigename wie in der Meldekopf-Oberfläche: Name, sonst Einheitstyp, sonst Organisation. */
function einheitName(b: Erfassungsbogen): string {
  const org = b.einheit.organisation;
  return b.einheit.name || vokabText(b.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || orgLabel(org);
}

/** Fahrzeug-Kurzbezeichnungen einer Einheit, z. B. „GKW / MzKW". */
function fahrzeugListe(b: Erfassungsbogen): string {
  const tabelle = vokabularFuer(b.einheit.organisation, "fahrzeug");
  return b.fahrzeuge.map((f) => vokabText(f.typ, tabelle)).filter(Boolean).join(" / ");
}

function datenZeile(e: MeldeEintrag): string {
  const b = e.bogen;
  const st = staerke(b);
  const vp = verpflegung(b);
  const u = unterbringungMWD(b);
  const sb = b.sofortbedarf;
  return zeile([
    einheitName(b),
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
    datumDeutsch(datumZuIso(b.stand)),
    QUELLE_LABEL[e.quelle],
  ]);
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
  return zeile([
    `Summe (${meldungen.length} Einheiten)`,
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
  const meldungen = aktuelleMeldungen(s.eintraege).sort((a, b) =>
    einheitName(a.bogen).localeCompare(einheitName(b.bogen), "de"),
  );
  const zeilen = [zeile([...SPALTEN]), ...meldungen.map(datenZeile), summenZeile(meldungen)];
  return BOM + zeilen.join("\r\n") + "\r\n";
}
