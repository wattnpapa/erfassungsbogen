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

import { staerke, type Erfassungsbogen } from "@bos/eeb-format/model";
import type { EinsatzArt } from "@bos/meldekopf/einsaetze";
import { geltendeJeEinheit } from "./fassung-vorrang";
import { einheitAnzeigename, nurSollstaerke, orgLabel, vokabText, vokabularFuer, zeitpunktDeutsch } from "./hilfen";
import { meldungsNummern, pruefpunkteEintrag } from "./einheiten-tabelle";
import { aktuelleMeldungen, unterbringungLage, verpflegungAngefordertLage, verpflegungLage, zaehltInLage } from "./auswertung";
import { csvDatei, csvZeile, mitNachtragSpalte } from "./csv";
import { exportKennzeile, nachtragGrundText, ortHinweisText, ortHinweise } from "./export-stand";
import { handAenderungText } from "./angaben-alter";
import { EINTREFF_HINWEIS, HERKUNFT_TEXT, eintreffzeit, eintreffzeitUnbestaetigt, zeitLang } from "./eintrag-zeiten";
import { MeldeStatus, type Einsatzsammlung, type MeldeEintrag, type MeldeQuelle } from "@bos/meldekopf/einsaetze";

const STATUS_LABEL: Record<MeldeStatus, string> = {
  [MeldeStatus.ANWESEND]: "anwesend",
  [MeldeStatus.ABGERUECKT]: "abgerückt",
  [MeldeStatus.AUFGEGANGEN]: "aufgegangen",
};

// Derselbe Wortlaut wie auf der Karte (Audit Runde 2, R2-K6).
const QUELLE_LABEL: Record<MeldeQuelle, string> = HERKUNFT_TEXT;

const SPALTEN = [
  // Laufende Nummer wie an der Karte und auf dem Lageblatt — Abgleich
  // zwischen Papier und Datei über „Nr. 7" (Audit Runde 3, R3-K7).
  "Nr.",
  "Einheit",
  "Teil",
  "Organisation",
  "Zug",
  "Stärke F",
  "Stärke U",
  "Stärke M",
  "Stärke gesamt",
  "Verpflegung gesamt",
  // „gesamt" ist die Kopfstärke nach Bogen; angefordert ist nur, was Schritt 5 anhakt (R11-W1).
  "Verpflegung angefordert",
  "Verpflegung veg.",
  "Verpflegung vegan",
  // Zwei Zahlen, zwei Fragen — wie auf Lageblatt und in der Excel-Liste (R4-W5):
  // Schlafplätze brauchen nur die Einheiten mit angeforderter Unterbringung,
  // WC und Duschen alle Anwesenden. Beide unter derselben Überschrift zu führen
  // ließ den Stab 50 statt 35 Plätze planen.
  "Unterbringung angefordert M",
  "Unterbringung angefordert W",
  "Unterbringung angefordert D",
  "WC/Dusche M",
  "WC/Dusche W",
  "WC/Dusche D",
  "Diesel (l)",
  "Benzin (l)",
  "Gemisch (l)",
  // Anzahl und Liste getrennt: in der Summenzeile stand eine Zahl unter einer
  // Liste (R4-K8).
  "Fahrzeuge (Anzahl)",
  "Fahrzeuge (Liste)",
  // „Stand der Angaben" = Zeitpunkt, auf den sich die Angaben der Einheit beziehen (beim Absender); „Aufnahme" =
  // Moment, in dem das Gerät die Meldung angenommen hat (R18-K1).
  "Stand der Angaben",
  // Eintreff- und Abrückzeit der Führungsstelle — für Einsatztagebuch und
  // Abrechnung (Führungssicht-Audit K2).
  "Eingetroffen",
  "Abgerückt",
  "Aufnahme",
  "Quelle",
  "Status",
  "Zählt in Lage",
  "Übung",
  "Sofortbedarf",
  // Offene Punkte der Meldung — gingen in jede Tabelle verloren (R4-K8).
  "Hinweise",
  "Signatur",
  "Absender",
  "Auftrag/Notiz",
  // Was die Einheit selbst dazuschreibt („Nachschub nötig") — stand nur in
  // „Alle Daten" und in der Excel-Liste (Audit Runde 3, R3-K3).
  "Bemerkung (Einheit)",
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

/** Wie auf Karte, Lageblatt und Sammel-PDF (R8-A1): die Zahl ist die Vorbelegung, nicht gemeldet. */
const SOLL_MARKE = "Sollstärke, nicht gemeldet";

/** „, davon 9 Personen Sollstärke, nicht gemeldet" für die Summenzeile; leer, wenn alles gezählt ist (R9-A2). */
function sollAnteilText(meldungen: MeldeEintrag[]): string {
  const soll = meldungen.filter((e) => nurSollstaerke(e.bogen));
  if (soll.length === 0) return "";
  const personen = soll.reduce((n, e) => n + staerke(e.bogen).gesamt, 0);
  return `, davon ${personen} ${personen === 1 ? "Person" : "Personen"} Sollstärke, nicht gemeldet`;
}

function datenZeile(art: EinsatzArt, e: MeldeEintrag, nr: number | undefined, grund?: string, fremderOrt?: string, eintreffUnbestaetigt = false, ersteQuelle?: MeldeQuelle): string {
  const b = e.bogen;
  const st = staerke(b);
  // Wie Tabelle und Summen: Schnellerfassung zählt die Stärke (R2-N5).
  const vp = verpflegungLage(b);
  const u = unterbringungLage(b);
  const sb = b.sofortbedarf;
  return csvZeile([
    nr ?? "",
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
    verpflegungAngefordertLage(b),
    vp.vegetarisch,
    vp.vegan,
    ...(sb?.unterbringung ? [u.m, u.w, u.d] : [0, 0, 0]),
    u.m,
    u.w,
    u.d,
    sb?.dieselLiter ?? 0,
    sb?.benzinLiter ?? 0,
    sb?.gemischLiter ?? 0,
    b.fahrzeuge.length,
    fahrzeugListe(b),
    // Eine Zeitform je Datei: „04.10.2026, 14:36" für Stand, Eingetroffen,
    // Abgerückt und Empfangen. Vorher standen „041436okt26",
    // „04.10.2026, 14:41" und „04.10.26, 14:41" in derselben Zeile (R3-K7).
    zeitpunktDeutsch(e.standAbsender ?? b.stand),
    // Stern wie auf Lageblatt und Sammel-PDF: Zeit des Einlesens, nicht bestätigt (R16-A1); Fußnote am Dateiende.
    `${zeitLang(eintreffzeit(e))}${eintreffUnbestaetigt ? " *" : ""}`,
    e.abgerueckAm != null ? zeitLang(e.abgerueckAm) : "",
    zeitLang(e.empfangenAm),
    // Eine am Meldekopf geänderte Fassung bleibt „Aus Datei, am Meldekopf geändert", nicht „Manuell erfasst" (R18-A3).
    e.angaben ? `${QUELLE_LABEL[e.quelle === "manuell" && ersteQuelle ? ersteQuelle : e.quelle]}, am Meldekopf geändert` : QUELLE_LABEL[e.quelle],
    STATUS_LABEL[e.status],
    zaehlt(art, e) ? "ja" : "nein",
    b.uebung ? "ÜBUNG" : "",
    sofortbedarfText(b),
    // Auch „Anderer Einsatz?": die Warnung der Karte gehört zu den offenen Punkten (R5-K5).
    // Sollstärke zuerst: Die Zahl in „Stärke" hat niemand gezählt (R9-A2).
    [...(handAenderungText(e) ? [handAenderungText(e)] : []), ...(nurSollstaerke(b) ? [SOLL_MARKE] : []), ...pruefpunkteEintrag(e).map((p) => p.text), ...(fremderOrt != null ? [ortHinweisText(fremderOrt)] : [])].join(" | "),
    signaturText(e),
    absenderText(e),
    e.notiz ?? "",
    b.sonstiges ?? "",
    // Nur im Nachtrag: warum die Zeile dabei ist (R5-W7).
    ...(grund != null ? [grund] : []),
  ]);
}

/** Zählt der Eintrag in die Lage? Status UND Übungskennzeichnung entscheiden. */
function zaehlt(art: EinsatzArt, e: MeldeEintrag): boolean {
  return e.status === MeldeStatus.ANWESEND && zaehltInLage(art, e.bogen);
}

/** Summenzeile über alle anwesenden Einheiten — spaltenweise passend zu den Datenzeilen. */
function summenZeile(meldungen: MeldeEintrag[], titel: string, mitGrund = false): string {
  const acc = {
    f: 0, u: 0, m: 0, gesamt: 0,
    vGesamt: 0, vAnf: 0, veg: 0, vegan: 0,
    anM: 0, anW: 0, anD: 0,
    uM: 0, uW: 0, uD: 0,
    diesel: 0, benzin: 0, gemisch: 0,
    fahrzeuge: 0,
  };
  for (const e of meldungen) {
    const b = e.bogen;
    const st = staerke(b);
    const vp = verpflegungLage(b);
    const un = unterbringungLage(b);
    acc.f += st.fuehrer;
    acc.u += st.unterfuehrer;
    acc.m += st.mannschaft;
    acc.gesamt += st.gesamt;
    acc.vGesamt += vp.gesamt;
    acc.vAnf += verpflegungAngefordertLage(b);
    acc.veg += vp.vegetarisch;
    acc.vegan += vp.vegan;
    if (b.sofortbedarf?.unterbringung) {
      acc.anM += un.m;
      acc.anW += un.w;
      acc.anD += un.d;
    }
    acc.uM += un.m;
    acc.uW += un.w;
    acc.uD += un.d;
    acc.diesel += b.sofortbedarf?.dieselLiter ?? 0;
    acc.benzin += b.sofortbedarf?.benzinLiter ?? 0;
    acc.gemisch += b.sofortbedarf?.gemischLiter ?? 0;
    acc.fahrzeuge += b.fahrzeuge.length;
  }
  return csvZeile([
    "",
    titel,
    "",
    "",
    "",
    acc.f, acc.u, acc.m, acc.gesamt,
    acc.vGesamt, acc.vAnf, acc.veg, acc.vegan,
    acc.anM, acc.anW, acc.anD,
    acc.uM, acc.uW, acc.uD,
    acc.diesel, acc.benzin, acc.gemisch,
    acc.fahrzeuge,
    "",
    "",
    "",
    "",
    "",
    ...(mitGrund ? [""] : []),
  ]);
}

/**
 * Einsatz-Sammlung → CSV-Text (mit BOM). Zeilen: Kopf, je anwesende Einheit
 * eine Zeile (nach Nr. sortiert), zuletzt die Summenzeile.
 *
 * Als Nachtrag („nur neue Bögen", `s.nachtragGruende`) nennt eine letzte Spalte
 * den Grund jeder Zeile („neu", „geändert: Zug"). Die „Summe Nachtrag" zählt nur
 * die neuen Einheiten; die geänderten stehen in einer eigenen Zeile und ersetzen
 * ihre Zeile der letzten Lieferung — wer beide addierte, zählte Kräfte doppelt
 * (R5-W7). Eine Schlusszeile sagt, dass die Datei nur ein Teil der Lage ist
 * (R5-K6).
 */
export function einsatzCsvInhalt(
  s: Einsatzsammlung,
  /** Nummern aus der ganzen Sammlung — beim Teilexport „nur neue" sonst verschoben. */
  nummern: Map<string, number> = meldungsNummern(s.eintraege),
  /** Nachtrag auch ohne Gründe (ältere Aufrufer): die Summe heißt „Summe Nachtrag" (R4-W4). */
  nachtrag = s.nachtragGruende != null,
  /** Ganze Sammlung für die Kennzeichnung der Eintreffzeit (beim Teilexport fehlt die erste Fassung sonst). */
  historie: readonly MeldeEintrag[] = s.eintraege,
  erstellt: number = Date.now(),
  /** Zeile über entfernte Nummern („Nr. 2 entfernt 04:21 (Papierkorb) — nicht in der Summe."), R19-A2; leer ohne Lücke. */
  luecken = "",
): string {
  // Alle gemeldeten Einheiten, nicht nur die zählenden: Eine abgerückte oder
  // als Übung geführte Einheit fiel bisher wortlos aus der Datei — die
  // Führungsstelle sah eine Lücke, die sie nicht als Lücke erkennen konnte.
  // Die Spalten „Status" und „Zählt in Lage" sagen, was die Summe enthält.
  // Nach Nr. wie Lageblatt, Sammel-PDF und Liste am Gerät (R8-A2): Wer Blatt und Tabelle nebeneinanderlegt,
  // vergleicht Zeile für Zeile. Ohne Nummer (kommt nicht vor) nach Name.
  const alle = geltendeJeEinheit(s.eintraege).sort(
    (a, b) =>
      (nummern.get(a.einheitSchluessel) ?? Infinity) - (nummern.get(b.einheitSchluessel) ?? Infinity) ||
      einheitName(a.bogen).localeCompare(einheitName(b.bogen), "de"),
  );
  const gruende = s.nachtragGruende;
  const zaehlende = aktuelleMeldungen(s.eintraege, s.art);
  const kopf = csvZeile([...SPALTEN, ...(gruende ? ["Im Nachtrag wegen"] : [])]);
  const orte = ortHinweise(s);
  const unbestaetigt = new Set(alle.filter((e) => eintreffzeitUnbestaetigt(e, historie)).map((e) => e.id));
  // Herkunft der ersten Fassung je Einheit: Eine am Meldekopf geänderte Fassung trägt selbst „manuell" (R18-A3).
  const ersteQuelleJe = (e: MeldeEintrag): MeldeQuelle | undefined =>
    historie.filter((x) => x.einheitSchluessel === e.einheitSchluessel).sort((a, b) => a.empfangenAm - b.empfangenAm)[0]?.quelle;
  const zeilen = alle.map((e) => datenZeile(s.art, e, nummern.get(e.einheitSchluessel), gruende ? nachtragGrundText(gruende[e.einheitSchluessel]) : undefined, orte[e.einheitSchluessel], unbestaetigt.has(e.id), e.angaben ? ersteQuelleJe(e) : undefined));
  // Schlusszeilen: Lage und Erstellzeit, bei gekennzeichneter Eintreffzeit die Fußnote (R16-A1). Die Kopfzeile bleibt Zeile 1.
  const fuss = [
    csvZeile([exportKennzeile(s, erstellt)]),
    ...(unbestaetigt.size > 0 ? [csvZeile([`* ${EINTREFF_HINWEIS}`])] : []),
    ...(luecken ? [csvZeile([luecken])] : []),
  ];
  if (!gruende) {
    return csvDatei([kopf, ...zeilen, summenZeile(zaehlende, `${nachtrag ? "Summe Nachtrag" : "Summe"} (${zaehlende.length} Einheiten${sollAnteilText(zaehlende)})`), ...fuss]);
  }
  const neu = zaehlende.filter((e) => gruende[e.einheitSchluessel]?.neu);
  const geaendert = zaehlende.filter((e) => gruende[e.einheitSchluessel] && !gruende[e.einheitSchluessel]!.neu);
  const seit = s.nachtragSeit != null ? ` seit ${zeitLang(s.nachtragSeit)}` : "";
  return csvDatei(
    mitNachtragSpalte(
      [
        kopf,
        ...zeilen,
        summenZeile(neu, `Summe Nachtrag — nur neue Einheiten (${neu.length}${sollAnteilText(neu)}), kein Gesamtstand`, true),
        ...(geaendert.length > 0
          ? [summenZeile(geaendert, `Geänderte Einheiten (${geaendert.length}) — ersetzen ihre Zeile der letzten Lieferung, NICHT zur Summe addieren`, true)]
          : []),
        csvZeile([`NACHTRAG${seit} — nicht die ganze Lage (${alle.length} ${alle.length === 1 ? "Einheit" : "Einheiten"} in dieser Datei)`]),
        ...fuss,
      ],
      `NACHTRAG${seit} — nicht die ganze Lage`,
      zeilen.length,
    ),
  );
}
