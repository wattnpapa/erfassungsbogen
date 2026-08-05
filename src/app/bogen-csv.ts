/**
 * Voll-CSV („alle Daten") eines Erfassungsbogens bzw. einer ganzen
 * Einsatz-Sammlung — für Excel/Tabellenkalkulation in der Führungsstelle oder
 * der nachgelagerten Verwaltung (Verpflegungsabrechnung, Personalnachweis,
 * Fahrzeugaufstellung).
 *
 * Gegenstück zu {@link einsatzCsvInhalt}: dort eine Zeile je Einheit mit den
 * Summen (Lagekarte), hier ALLES, was im Bogen steht — bis zur einzelnen Person
 * und zum einzelnen Fahrzeug.
 *
 * ## Warum Langformat mit Satzart-Spalte
 *
 * Ein Bogen ist nicht flach: eine Einheit hat n Personen und m Fahrzeuge. Das
 * in eine Tabelle zu pressen geht auf drei Arten, und zwei davon sind schlecht:
 *  - Spalten je Person („Person 1 Nachname", „Person 2 Nachname", …) — die
 *    Spaltenzahl hinge an der größten Einheit und wäre nicht auswertbar.
 *  - Drei getrennte Dateien — der Nutzer hat ausdrücklich EINE Datei gewünscht.
 *  - Eine Zeile je Satz, unterschieden durch eine `Satzart`-Spalte. So bleibt
 *    jede Zeile ein Datensatz, Excel kann filtern („Satzart = Person") und
 *    pivotieren. Dafür sind die Blöcke der jeweils anderen Satzarten leer.
 *
 * Damit eine gefilterte Ansicht für sich lesbar bleibt, wiederholt der
 * Kontext-Block vorne (Einsatz, Einheit, Teil, Zug, Stand, Übung) auf JEDER
 * Zeile — sonst wüsste man bei „Satzart = Person" nicht mehr, zu wem sie gehört.
 *
 * ## Auswahl
 *
 * Aus einer Sammlung kommt die neueste Revision JEDER Einheit — auch abgerückte
 * und in andere Einheiten aufgegangene. Das entspricht genau der Einheitenliste
 * am Meldekopf; die `Status`-Spalte hält sie auseinander. Achtung beim naiven
 * Summieren: die Zahlen aufgegangener Truppteile stecken zusätzlich in der
 * Einheit, in die sie aufgegangen sind (dafür gibt es den Übersichts-Export).
 *
 * Enthält Personendaten im Klartext (Namen, Kontakte) — bleibt wie alle
 * Exporte rein lokal.
 */

import {
  Ernaehrung,
  Geschlecht,
  PersonalErfassung,
  StaerkeRolle,
  alleFahrerlaubnisse,
  staerke,
  unterbringungMWD,
  verpflegung,
  datumZuIso,
  zeitpunktZuIso,
  type EebDatum,
  type EebZeitpunkt,
  type Erfassungsbogen,
  type Fahrzeug,
  type Person,
} from "../model";
import {
  FE_TEXT,
  datumDeutsch,
  einheitAnzeigename,
  einheitOrt,
  funkrufText,
  kontaktText,
  orgLabel,
  vokabText,
  vokabularFuer,
  zeitgruppe,
} from "./hilfen";
import { csvDatei, csvZeile, jaNein } from "./csv";
import { neuesteJeEinheit, MeldeStatus, type Einsatzsammlung, type MeldeEintrag, type MeldeQuelle } from "./einsaetze";

// ------------------------------------------------------------------ Spalten

/**
 * Spaltenreihenfolge der Datei. Vier Blöcke: Kontext (auf jeder Zeile gefüllt),
 * dann je ein Block pro Satzart. Zeilen werden über einen Datensatz mit genau
 * diesen Schlüsseln gebaut — so kann keine Zeile aus dem Raster laufen.
 */
const SPALTEN = [
  // Kontext — auf jeder Zeile
  "Einsatz",
  "Einheit",
  "Teil",
  "Zug",
  "Stand",
  "Übung",
  "Satzart",
  "Nr",
  // Satzart „Einheit"
  "Organisation",
  "Organisationsname",
  "Einheitstyp",
  "Standort",
  "Zugehörigkeit",
  "Telefon Einheit",
  "E-Mail Einheit",
  "Auftrag",
  "Zeitraum von",
  "Zeitraum bis",
  "Einsatzbeginn",
  "Einsatzende",
  "Personalerfassung",
  "Stärke F",
  "Stärke U",
  "Stärke M",
  "Stärke gesamt",
  "Verpflegung gesamt",
  "Verpflegung Fleisch",
  "Verpflegung veg.",
  "Verpflegung vegan",
  "Unterbringung M",
  "Unterbringung W",
  "Unterbringung D",
  "Unterbringung nötig",
  "Ruhezeit nötig",
  "Diesel (l)",
  "Benzin (l)",
  "Gemisch (l)",
  "Anzahl Fahrzeuge",
  "Sonstiges",
  "Quelle",
  "Status",
  "Signatur",
  // Satzart „Person"
  "Nachname",
  "Vorname",
  "Rolle",
  "Funktionen",
  "Fahrerlaubnis",
  "Geschlecht",
  "Ernährung",
  "Kontakte",
  "Zusatzqualifikationen",
  // Satzart „Fahrzeug"
  "Fahrzeugtyp",
  "Kennzeichen",
  "Funkrufname",
  "StAN-konform",
  "Änderungen/Sondergerät",
] as const;

type Spalte = (typeof SPALTEN)[number];
type Satz = Partial<Record<Spalte, string | number>>;

// ------------------------------------------------------------------- Texte

const SATZART_EINHEIT = "Einheit";
const SATZART_PERSON = "Person";
const SATZART_FAHRZEUG = "Fahrzeug";

const ROLLE_TEXT: Record<StaerkeRolle, string> = {
  [StaerkeRolle.FUEHRER]: "Führer",
  [StaerkeRolle.UNTERFUEHRER]: "Unterführer",
  [StaerkeRolle.MANNSCHAFT]: "Mannschaft",
};

const GESCHLECHT_TEXT: Record<Geschlecht, string> = {
  [Geschlecht.M]: "m",
  [Geschlecht.W]: "w",
  [Geschlecht.D]: "d",
};

const ERNAEHRUNG_TEXT: Record<Ernaehrung, string> = {
  [Ernaehrung.FLEISCH]: "Fleisch",
  [Ernaehrung.VEGETARISCH]: "Vegetarisch",
  [Ernaehrung.VEGAN]: "Vegan",
};

const ERFASSUNG_TEXT: Record<PersonalErfassung, string> = {
  [PersonalErfassung.VOLLSTAENDIG]: "Vollständig",
  [PersonalErfassung.NUR_STAERKE]: "Nur Stärke",
};

const STATUS_TEXT: Record<MeldeStatus, string> = {
  [MeldeStatus.ANWESEND]: "Anwesend",
  [MeldeStatus.ABGERUECKT]: "Abgerückt",
  [MeldeStatus.AUFGEGANGEN]: "Aufgegangen",
};

const QUELLE_TEXT: Record<MeldeQuelle, string> = {
  scan: "Scan",
  manuell: "Manuell",
  "pdf-import": "PDF-Import",
  aufteilung: "Aufteilung",
  zusammenfuehrung: "Zusammenführung",
};

function datumText(d: EebDatum | undefined): string {
  return d != null ? datumDeutsch(datumZuIso(d)) : "";
}

/** „14.05.2025 08:30" — Datum wie im Bogen, Uhrzeit als lokale Wandzeit. */
function zeitpunktText(z: EebZeitpunkt | undefined): string {
  if (z == null) return "";
  const [datum = "", zeit = ""] = zeitpunktZuIso(z).split("T");
  return `${datumDeutsch(datum)} ${zeit}`.trim();
}

/** Ganze Zugehörigkeitskette: „OV Oldenburg (OODE) › RB Bremen". */
function zugehoerigkeitText(b: Erfassungsbogen): string {
  const tabelle = vokabularFuer(b.einheit.organisation, "ebene");
  return b.einheit.hierarchie
    .map((h) => {
      const art = vokabText(h.bezeichnung, tabelle);
      return [art, h.name, h.kurz ? `(${h.kurz})` : ""].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .join(" › ");
}

// -------------------------------------------------------------- Satzzeilen

/** Kontext-Block — wiederholt sich auf jeder Zeile eines Bogens. */
interface Kontext {
  /** Name der Einsatz-Sammlung; beim Einzelbogen leer. */
  einsatz?: string;
  teil?: string;
  zug?: string;
  quelle?: string;
  status?: string;
  signatur?: string;
}

function kontextFelder(b: Erfassungsbogen, k: Kontext, satzart: string, nr?: number): Satz {
  return {
    Einsatz: k.einsatz ?? "",
    Einheit: einheitAnzeigename(b.einheit),
    Teil: k.teil ?? "",
    Zug: k.zug ?? "",
    Stand: zeitgruppe(b.stand),
    "Übung": jaNein(b.uebung === true),
    Satzart: satzart,
    Nr: nr ?? "",
  };
}

function einheitSatz(b: Erfassungsbogen, k: Kontext): Satz {
  const st = staerke(b);
  const vp = verpflegung(b);
  const u = unterbringungMWD(b);
  const sb = b.sofortbedarf;
  const ebene0 = b.einheit.hierarchie[0];
  return {
    ...kontextFelder(b, k, SATZART_EINHEIT),
    Organisation: orgLabel(b.einheit.organisation),
    Organisationsname: b.einheit.organisationName ?? "",
    Einheitstyp: vokabText(b.einheit.einheitsTyp, vokabularFuer(b.einheit.organisation, "einheitstyp"), "name"),
    Standort: einheitOrt(b.einheit),
    "Zugehörigkeit": zugehoerigkeitText(b),
    "Telefon Einheit": ebene0?.telefon ?? "",
    "E-Mail Einheit": ebene0?.email ?? "",
    Auftrag: b.einsatz.ortAuftrag,
    "Zeitraum von": datumText(b.einsatz.zeitraumVon),
    "Zeitraum bis": datumText(b.einsatz.zeitraumBis),
    Einsatzbeginn: zeitpunktText(b.einsatz.einsatzbeginn),
    Einsatzende: zeitpunktText(b.einsatz.einsatzende),
    Personalerfassung: ERFASSUNG_TEXT[b.personalErfassung],
    "Stärke F": st.fuehrer,
    "Stärke U": st.unterfuehrer,
    "Stärke M": st.mannschaft,
    "Stärke gesamt": st.gesamt,
    "Verpflegung gesamt": vp.gesamt,
    "Verpflegung Fleisch": vp.fleisch,
    "Verpflegung veg.": vp.vegetarisch,
    "Verpflegung vegan": vp.vegan,
    "Unterbringung M": u.m,
    "Unterbringung W": u.w,
    "Unterbringung D": u.d,
    // Leer statt „nein", wenn gar kein Sofortbedarf erfasst wurde: „nicht
    // gefragt" und „ausdrücklich nicht nötig" sind verschiedene Aussagen.
    "Unterbringung nötig": sb ? jaNein(sb.unterbringung) : "",
    "Ruhezeit nötig": sb ? jaNein(sb.ruhezeitErforderlich) : "",
    "Diesel (l)": sb?.dieselLiter ?? 0,
    "Benzin (l)": sb?.benzinLiter ?? 0,
    "Gemisch (l)": sb?.gemischLiter ?? 0,
    "Anzahl Fahrzeuge": b.fahrzeuge.length,
    Sonstiges: b.sonstiges ?? "",
    Quelle: k.quelle ?? "",
    Status: k.status ?? "",
    Signatur: k.signatur ?? "",
  };
}

function personSatz(b: Erfassungsbogen, k: Kontext, p: Person, nr: number): Satz {
  const funktionen = vokabularFuer(b.einheit.organisation, "funktion");
  return {
    ...kontextFelder(b, k, SATZART_PERSON, nr),
    Nachname: p.nachname,
    Vorname: p.vorname,
    Rolle: ROLLE_TEXT[p.staerkeRolle],
    Funktionen: p.funktionen.map((f) => vokabText(f, funktionen)).filter(Boolean).join(", "),
    // FE_TEXT schreibt „—" für „keine" — das ist Anzeige-Kosmetik. In einer
    // Tabelle gehört dahin die leere Zelle, sonst zählt jeder Filter den
    // Gedankenstrich als Fahrerlaubnis mit. Mehrere Klassen (B + A) stehen
    // kommagetrennt in derselben Zelle.
    Fahrerlaubnis: alleFahrerlaubnisse(p).map((k) => FE_TEXT[k]).join(", "),
    Geschlecht: GESCHLECHT_TEXT[p.geschlecht],
    "Ernährung": ERNAEHRUNG_TEXT[p.ernaehrung],
    Kontakte: p.kontakte.map(kontaktText).join(" / "),
    Zusatzqualifikationen: p.zusatzqualifikationen.map((q) => vokabText(q, funktionen)).filter(Boolean).join(", "),
  };
}

function fahrzeugSatz(b: Erfassungsbogen, k: Kontext, f: Fahrzeug, nr: number): Satz {
  return {
    ...kontextFelder(b, k, SATZART_FAHRZEUG, nr),
    Fahrzeugtyp: vokabText(f.typ, vokabularFuer(b.einheit.organisation, "fahrzeug"), "name"),
    Kennzeichen: f.kennzeichen ?? "",
    Funkrufname: funkrufText(f, einheitOrt(b.einheit)),
    // undefined = Frage für diesen Fahrzeugtyp nicht anwendbar → leer lassen.
    "StAN-konform": f.stanKonform == null ? "" : jaNein(f.stanKonform),
    "Änderungen/Sondergerät": f.aenderungen ?? "",
  };
}

/** Alle Zeilen eines Bogens: Einheit, dann Personal, dann Fahrzeuge. */
function bogenSaetze(b: Erfassungsbogen, k: Kontext): Satz[] {
  return [
    einheitSatz(b, k),
    ...b.personal.map((p, i) => personSatz(b, k, p, i + 1)),
    ...b.fahrzeuge.map((f, i) => fahrzeugSatz(b, k, f, i + 1)),
  ];
}

function zuDatei(saetze: Satz[]): string {
  const kopf = csvZeile([...SPALTEN]);
  return csvDatei([kopf, ...saetze.map((s) => csvZeile(SPALTEN.map((sp) => s[sp] ?? "")))]);
}

// --------------------------------------------------------------- Öffentlich

/** Einzelner Erfassungsbogen → CSV-Text (mit BOM). */
export function bogenCsvInhalt(b: Erfassungsbogen): string {
  return zuDatei(bogenSaetze(b, {}));
}

function kontextAusMeldung(e: MeldeEintrag, einsatz: string): Kontext {
  return {
    einsatz,
    teil: e.teilEtikett,
    zug: e.zugEtikett,
    quelle: QUELLE_TEXT[e.quelle],
    status: STATUS_TEXT[e.status],
    signatur: e.signatur
      ? e.signatur.zustand === "gueltig"
        ? `gültig${e.signatur.kurzform ? ` (${e.signatur.kurzform})` : ""}`
        : "ungültig"
      : "",
  };
}

/**
 * Einsatz-Sammlung → CSV-Text (mit BOM): jede gemeldete Einheit in ihrer
 * neuesten Revision, nach Anzeigename sortiert, je Einheit die Einheits-,
 * Personal- und Fahrzeugzeilen.
 */
export function einsatzDetailCsvInhalt(s: Einsatzsammlung): string {
  const meldungen = neuesteJeEinheit(s.eintraege).sort(
    (a, b) =>
      einheitAnzeigename(a.bogen.einheit).localeCompare(einheitAnzeigename(b.bogen.einheit), "de") ||
      (a.teilEtikett ?? "").localeCompare(b.teilEtikett ?? "", "de"),
  );
  return zuDatei(meldungen.flatMap((e) => bogenSaetze(e.bogen, kontextAusMeldung(e, s.name))));
}
