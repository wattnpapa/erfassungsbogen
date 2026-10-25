/**
 * Erzeugt Beispiel-Erfassungsbögen aus einer praktischen Ausbildung (Johanniter-
 * Akademie Niedersachsen/Bremen) als JSON nach examples/praktische-ausbildung/.
 * Abgelegt ist nur das Bogen-JSON; die PDF entsteht erst beim Anklicken in der
 * App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:ausbildung
 *
 * QUELLE: vier vom Auftraggeber bereitgestellte Bogensätze auf dem Vordruck
 * „Einheitenerfassungsbogen" der Johanniter-Akademie:
 *   malter       „JUH RV Malter"          5 Bögen, Word-Vordruck, mit Namensliste
 *                                         und „Begründung meiner Planung"
 *   akkonia      „JUH OV Akkonia"         7 Bögen, Word-Vordruck, mit Namensliste
 *   johannesburg „JUH OV Johannesburg"    6 Bögen, Word-Vordruck, mit Namensliste
 *   hannover     „Einlagen Kräfte"        23 handschriftlich ausgefüllte Deckblätter
 *                                         (Papier-Scan) ohne Namensliste; Einheiten
 *                                         von JUH, DRK, MHD und ASB für die
 *                                         Landeshauptstadt Hannover plus drei Bögen
 *                                         einer SEG Aller-Leine und je einer aus
 *                                         Landesbergen und Wunstorf
 *
 * Die Bögen werden eins zu eins übernommen: Namen, Funktionen, Qualifikationen,
 * Fahrzeuge, Kennzeichen und Rufnamen stehen so da, wie sie auf dem Papier
 * stehen — auch Eigenheiten der Vorlage (leere Namensplätze, Kennzeichen-
 * Platzhalter „H-JU XXX", doppelt vergebene Kennzeichen oder Rufnamen). Nur
 * Leerzeichen um Bindestriche sind vereinheitlicht („GW -SAN" → „GW-SAN").
 *
 * WAS DAS MODELL NICHT KENNT, steht im Feld „Sonstiges": Fachdienst-Kreuze,
 * Hauptleistung (BHP/BTP mit Behandlungs- bzw. Betreuungsplätzen), das Feld
 * „Kommunikation" (Rufname, Kanal, Fax, Sonst.) und die handschriftlichen
 * Bemerkungen der Vorlage.
 *
 * ERGÄNZT, weil das Modell sie verlangt und die Vordrucke sie nicht führen:
 *   – Geschlecht: nach Vornamen zugeordnet (nur für die Unterbringungs-
 *     auswertung; der Vordruck hat kein Feld dafür)
 *   – Ernährung „Fleisch", Fahrerlaubnis „keine Angabe" für alle Personen
 *   – Einsatz (Zeitraum, Ortsangabe): Übungsbezeichnung, Datum 17.02.2024
 *     (Unterschriftsdatum der Vordrucke)
 *   – Funkrufname-Kennwort „Akkon" bei den JUH-Bögen, in denen nur die Zahlen-
 *     folge „55-17-1" steht
 *
 * TELEFON, FAX, E-MAIL der SEG Aller-Leine stehen im Original als echte
 * Angaben; sie sind hier durch erkennbare Platzhalter ersetzt (555…,
 * *.example), weil Beispieldaten keine echten Kontakte enthalten dürfen
 * (siehe scripts/fake-telefon.ts).
 *
 * Bögen ohne Namensliste (hannover) sind im Modus „Nur Stärke": die Zahlen
 * VF/ZF/Arzt – GF – TF/He – Gesamt stehen als manuelle Stärke im Bogen.
 *
 * Am Ende läuft ein Codec-Roundtrip; examples/praktische-ausbildung/README.md
 * bekommt eine Übersichtstabelle.
 */

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  Erfassungsbogen,
  Ernaehrung as E,
  Fahrerlaubnis as FE,
  Fahrzeug,
  Geschlecht as G,
  HierarchieEbene,
  OrganisationsTyp as O,
  Person,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle as R,
  Staerke,
  VokabularWert,
  datumAusIso,
  staerke,
  zeitpunktAusIso,
} from "@bos/eeb-format/model";
import { decodePayload, encodePayload } from "@bos/eeb-format/codec";
import { nodeKompressor } from "@bos/eeb-format/qr-node";
import { fakeTelefon } from "./fake-telefon";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");

// ----------------------------------------------------------------- Bausteine

const STAND = "2024-02-17T00:00";
const DATUM = "2024-02-17";

const KENNWORT_AKKON: VokabularWert = { code: 4 }; // FUNKRUF_KENNWOERTER: Akkon (JUH)
const EBENE_OV: VokabularWert = { code: 1 }; // JUH_HIERARCHIE_EBENEN: Ortsverband
const EBENE_RV: VokabularWert = { code: 2 }; // JUH_HIERARCHIE_EBENEN: Regionalverband
const EBENE_UNBEKANNT: VokabularWert = { freitext: "Standort" };

/** Vornamen, die auf den Bögen vorkommen und weiblich gelesen werden; alles andere männlich. */
const WEIBLICH = new Set([
  "Sabine", "Anabel", "Lisa", "Ute", "Ramona", "Sandy", "Jutta", "Rita", "Simone", "Uschi", "Karo", "Susanne",
  "Gabi", "Sarah", "Jenny", "Isolde", "Martina", "Julia", "Regina", "Brunhilde", "Maike", "Tina", "Silvia",
  "Michell", "Michelle", "Michalea", "Michaela", "Helen", "Chantal", "Nicole", "Manuela", "Yvonne", "Chayenne",
  "Sybille", "Mia", "Vicky", "Franziska", "Stefanie", "Sabrina", "Selina", "Cindy", "Fatma", "Virginia", "Frauke",
  "Elli", "Silke",
]);

type Rolle = "F" | "U" | "M";
const ROLLE: Record<Rolle, R> = { F: R.FUEHRER, U: R.UNTERFUEHRER, M: R.MANNSCHAFT };

/** Zeile der Personalübersicht: Nachname, Vorname, Funktion, Qualifikation, Stärke-Spalte. */
type PersonZeile = readonly [nachname: string, vorname: string, funktion: string, quali: string, rolle: Rolle];

function person([nachname, vorname, funktion, quali, rolle]: PersonZeile): Person {
  return {
    nachname,
    vorname,
    staerkeRolle: ROLLE[rolle],
    funktionen: funktion ? [{ freitext: funktion }] : [],
    fahrerlaubnis: FE.NONE,
    geschlecht: WEIBLICH.has(vorname) ? G.W : G.M,
    ernaehrung: E.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: quali ? [{ freitext: quali }] : [],
  };
}

/** Fahrzeug-Zeile: Typ, Kennzeichen, Rufname („55-17-1"), Zuordnung/Bemerkung. */
interface FzZeile {
  typ: string;
  kennz?: string;
  ruf?: string; // „55-17-1" oder, mit Ort-Präfix, „HK 50-11-1"
  bem?: string;
}

function fahrzeug(z: FzZeile, ort: string): Fahrzeug {
  const f: Fahrzeug = { typ: { freitext: z.typ } };
  if (z.kennz) f.kennzeichen = z.kennz;
  if (z.bem) f.aenderungen = z.bem;
  if (z.ruf) {
    const m = /^(?:([A-Z]{2})\s+)?(\d+)\s*-\s*(\d+)\s*-\s*(\d+)$/.exec(z.ruf.trim());
    if (!m) throw new Error(`Rufname nicht lesbar: ${z.ruf}`);
    f.funkrufname = {
      kennwort: KENNWORT_AKKON,
      eigenerStandort: false,
      ort: m[1] ?? ort,
      teile: [Number(m[2]), Number(m[3]), Number(m[4])],
    };
  }
  return f;
}

// ------------------------------------------------------------------ Bauplan

interface Standort {
  organisation: O;
  organisationName?: string;
  ebene: VokabularWert;
  ort: string;
  telefon?: string; // Original; wird durch Platzhalter ersetzt
  email?: string; // Original; wird durch Platzhalter ersetzt
}

interface Feld {
  fachdienst?: string;
  leistung?: string;
  rufname?: string;
  kanal?: string;
  fax?: string;
  sonstKomm?: string;
  bemerkung?: string;
}

interface Bauplan {
  ordner: string;
  datei: string;
  bezeichnung: string;
  standort: Standort;
  fahrzeuge: FzZeile[];
  feld: Feld;
  /** Soll aus der Stärke-Zeile des Vordrucks: VF/ZF/Arzt, GF, TF/He, Gesamt. */
  soll: readonly [number, number, number, number];
  /** Mit Namensliste (Word-Vordrucke) oder ohne (Papier-Deckblätter, „Nur Stärke"). */
  personal?: PersonZeile[];
  einsatz: string;
}

function sonstigesText(f: Feld, extra?: string): string | undefined {
  const teile: string[] = [];
  if (f.fachdienst) teile.push(`Fachdienst: ${f.fachdienst}.`);
  if (f.leistung) teile.push(`Hauptleistung: ${f.leistung}.`);
  const komm = [
    f.rufname ? `Rufname ${f.rufname}` : "",
    f.kanal ? `Kanal/Rufgruppe ${f.kanal}` : "",
    f.fax ? `Fax ${f.fax}` : "",
    f.sonstKomm ? `Sonst. ${f.sonstKomm}` : "",
  ].filter(Boolean);
  if (komm.length > 0) teile.push(`Kommunikation: ${komm.join(", ")}.`);
  if (f.bemerkung) teile.push(f.bemerkung);
  if (extra) teile.push(extra);
  return teile.length > 0 ? teile.join(" ") : undefined;
}

function hierarchie(s: Standort): HierarchieEbene[] {
  const ebene: HierarchieEbene = { bezeichnung: s.ebene, name: s.ort };
  if (s.telefon) ebene.telefon = fakeTelefon(s.telefon);
  if (s.email) ebene.email = s.email.replace(/@.*$/, "@johanniter.example");
  return [ebene];
}

const ZEITRAUM = datumAusIso(DATUM);

function bogenAus(p: Bauplan, extra?: string): Erfassungsbogen {
  const mitNamen = p.personal !== undefined;
  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    uebung: true, // Beispielbogen: überall als Übung gekennzeichnet
    stand: zeitpunktAusIso(STAND),
    einheit: {
      organisation: p.standort.organisation,
      ...(p.standort.organisationName ? { organisationName: p.standort.organisationName } : {}),
      einheitsTyp: { freitext: p.bezeichnung },
      hierarchie: hierarchie(p.standort),
    },
    einsatz: { zeitraumVon: ZEITRAUM, zeitraumBis: ZEITRAUM, ortAuftrag: p.einsatz },
    personalErfassung: mitNamen ? PersonalErfassung.VOLLSTAENDIG : PersonalErfassung.NUR_STAERKE,
    personal: (p.personal ?? []).map(person),
    fahrzeuge: p.fahrzeuge.map((z) => fahrzeug(z, p.standort.ort)),
  };
  if (!mitNamen) {
    const [fuehrer, unterfuehrer, mannschaft, gesamt] = p.soll;
    bogen.staerkeManuell = { fuehrer, unterfuehrer, mannschaft, gesamt };
  }
  const sonstiges = sonstigesText(p.feld, extra);
  if (sonstiges) bogen.sonstiges = sonstiges;
  return bogen;
}

// ------------------------------------------------------------------ Malter

const EINSATZ_TEXT = "Praktische Ausbildung (Übung): Einheitenerfassung der geplanten Einsatzeinheiten";
const EINSATZ_HANNOVER = "Praktische Ausbildung (Übung): Einlagen Kräfte, Landeshauptstadt Hannover";

const MALTER: Standort = { organisation: O.JUH, ebene: EBENE_RV, ort: "Malter" };

const MALTER_BEGRUENDUNG = `Begründung meiner Planung: Da wir als OV den Einsatz nicht allein bewältigen können, habe ich den Einsatz als einen RB - Einsatz geplant. Folgende Teileinheiten habe ich eingeplant: 1. Zugtrupp, 2. 3 Sanitätsgruppen, 3. Transportstaffel mit Erweiterung der Allradstaffel, 4. Sicherheit und Technik, 5. Verpflegung, 6. Motorradstaffel. Zugtrupp: Der Zugtrupp übernimmt die Führung von allen Einheiten, ich habe die 2-5 Regel bei diesem Einsatz auf 7 Einheiten erweitert (ist laut Konzept möglich). Je nach Lage muss die Überlegung die Führung auf eine Führungsgruppe zu erweitern immer im Hinterkopf vorhanden sein, damit im Fall der Fälle die Führung erweitert werden kann. Führung läuft aus dem ELW. Sollte das Feuerwehrhaus einen Lagebesprechungsraum haben, wird die Führungsstelle vom ELW in diesen Raum verlegt. Bessere Voraussetzungen im Lagebesprechungsrum als im ELW. Muss vor Ort entschieden werden. Zu Beginn sind alle Einheiten auf den Marschkanal. Ein Funkplan wird vor Ort nach vorheriger Absprache mit der örtlichen Gesamteinsatzleitung erstellt. San-Gruppen: Es sind drei San Gruppen vor die eigenständig je nach Lage eine UHS unabhängig voneinander betreiben können. Die UHS 1 ist die einzige UHS, die dauerhaft mit Arzt besetzt ist. Bei Bedarf ist der Arzt für die andren UHSen anforderbar. Auf Grund des Auftrages, das bis zu drei Ortschaften eine Basisversorgung gewährt werden soll, führe ich drei Gruppen inkl. Material mit. Alle drei Gruppen können eigenständig eine UHS betreiben, eine feste Unterkunft wird hierfür nicht benötigt. Transporteinheit: Da der Regelrettungsdienst bei Bedarf unterstützt werden soll, führen wir auch einen RTW mit, der bei Bedarf auch als NAW (Arzt von der UHS 1 steigt zu) eingesetzt werden kann. Der RTW wird bei der UHS 1 stationiert. Zusätzlich wird jeweils ein KTW bei der UHS 2 und der UHS 3 stationiert. Der Gruppenführer von der Transporteinheit verbleibt in der Führung und übernimmt die Funktion des Transportorganisator für unsere Fahrzeuge. Da das Schadensgebiet schwer zugänglich ist, führen wir einen geländefähigen KTW vom Typ B mit, der ins unwegsame Gelände fahren kann. Da das Schadensgebiet schwer zu erreichen ist, sind zusätzlich 2 UTVs in der Transporteinheit mit eingebunden. Mit diesen Fahrzeugen ist es möglich Material ins Schadensgebiet zu bringen und bei Bedarf verletzte Personen aus dem Schadensgebiet in die UHS zu bringen. Diese Fahrzeuge sind für das Gelände gebaut und die Fahrer auf schwieriges Gelände geschult. Technik und Sicherheit: Die Gruppe stellt die beiden Container auf die 2 Parkplätze, die zur Verfügung stehen, WLF mit Anhänger wird auf einen geeigneten Platz abgestellt. Die Gruppe baut die Unterkunft auf (Organisation Gruppenführer Tesi) und ist für alle weiteren logistischen Aufgaben und den ggf. anfallenden Personaltransport während des Einsatzes zuständig. Bei Bedarf unterstützt die Gruppe die Verpflegungsgruppe. Die Lima dient zur Ausleuchtung vom Feuerwehrgelände, sollte die Stromversorgung zusammenbrechen oder nicht ausreichen, so ist der autarke Betrieb der Unterkunft gewährleistet. Sollte der Platz beim Feuerwehrhaus knapp werden, kann der Container mit dem Unterkunftsmaterial nach dem Aufbau wieder aufgesattelt werden. Dadurch wird ein weiterer Platz vor der Feuerwehr wieder freigegeben. Verpflegung: Die Gruppe kümmert sich um die Verpflegung der Einsatzkräfte. Der GW Logistik steht für Einkäufe und sonstige Besorgungen zur Verfügung und steht auf dem Parkplatz vor dem Feuerwehrhaus. Organisation und Aufbau übernimmt der Gruppenführer der Verpflegungsgruppe. Motorradstaffel: Während der Anfahrt und Abfahrt übernimmt die Staffel Erkundungs- und Sicherheitsaufgaben (Sicherungsposten, Absperrungen, Erkunden für Pausen und Co). Im Einsatzgebiet stehen die Kräder als Melder, Bote oder als Erkunder zur Verfügung (1 Krad ist geländetauglich). Sollten Kräfte nachrücken, werden Lotsendienste übernommen. Personaltausch nach spätestens 72 Stunden Einsatz wird von der RB - Führung in der Dienststelle organisiert und mit dem Zugführer abgesprochen. Auf eine PSNV - Staffel habe ich verzichtet, da wir geschulte PSNV - Helfer in den San Gruppen mitführen. Sollte es sich herausstellen, dass wir Betroffene betreuen sollen, muss eine Betreuungsgruppe nachgefordert werden. Sollte es dazukommen, ist dann der Punkt erreicht, die Führung auf eine Führungsgruppe aufzustocken.`;

const betreuer = (n: string, v: string, f: string, r: Rolle): PersonZeile => [n, v, f, "Betreuungshelfer", r];
const verpfleger = (n: string, v: string, f: string, q: string, r: Rolle): PersonZeile => [n, v, f, q, r];

const baeuplaene: Bauplan[] = [
  // ---------------------------------------------------------------- Malter
  {
    ordner: "malter", datei: "01-zugtrupp", bezeichnung: "Zugtrupp (Ztr)", standort: MALTER, einsatz: EINSATZ_TEXT,
    soll: [2, 0, 2, 4],
    feld: { fachdienst: "Zugtrupp", leistung: "Führung", rufname: "54-17-1" },
    fahrzeuge: [{ typ: "ELW 2", kennz: "MA-JU 10", ruf: "56-17-1" }],
    personal: [
      ["Vogelsand", "Holger", "ZF", "RA", "F"],
      ["Schreiber", "Manuel", "stv. ZF Zugtruppführer", "RS", "F"],
      ["Stern", "Norbert", "Funker, Melder", "SAN-HE", "M"],
      ["Putzer", "Angelo", "Kraftfahrer, Melder, Funker", "SAN-HE", "M"],
    ],
  },
  {
    ordner: "malter", datei: "02-1-betreuungsgruppe", bezeichnung: "1. Betreuungsgruppe", standort: MALTER, einsatz: EINSATZ_TEXT,
    soll: [0, 1, 9, 10],
    feld: { fachdienst: "Betreuungsdienst", leistung: "BTP", rufname: "54-17-2" },
    fahrzeuge: [
      { typ: "GW-Betreuung", kennz: "MA-JU 11", ruf: "54-75-1" },
      { typ: "MTW", kennz: "MA-JU 12", ruf: "54-17-2" },
    ],
    personal: [
      betreuer("Syiemens", "Gabi", "GF", "U"),
      betreuer("Pfeiffer", "Sarah", "TF", "M"),
      betreuer("Gruber", "Jenny", "HE", "M"),
      betreuer("Garper", "Emil", "TF", "M"),
      betreuer("Schenker", "Willi", "HE", "M"),
      betreuer("Bonse", "Michell", "TF", "M"),
      betreuer("Maler", "Benjamin", "HE", "M"),
      betreuer("Wieter", "Andrew", "Kraftfahrer/Melder", "M"),
      betreuer("Alter", "Josef", "Kraftfahrer/Melder", "M"),
      betreuer("Schütze", "Wilhelm", "HE", "M"),
    ],
  },
  {
    ordner: "malter", datei: "03-2-betreuungsgruppe", bezeichnung: "2. Betreuungsgruppe", standort: MALTER, einsatz: EINSATZ_TEXT,
    soll: [0, 1, 7, 8],
    feld: { fachdienst: "Betreuungsdienst", leistung: "BTP", rufname: "54-17-2" },
    fahrzeuge: [
      { typ: "MTW", kennz: "MA-JU 13", ruf: "54-17-03" },
      { typ: "Betreuungsanhänger", kennz: "MA-JU-14" },
    ],
    personal: [
      betreuer("Diestel", "Julia", "GF", "U"),
      betreuer("Meyer", "Martina", "TF", "M"),
      betreuer("Jecken", "Julian", "HE", "M"),
      betreuer("Heyder", "Isolde", "TF", "M"),
      betreuer("Dante", "Regina", "HE", "M"),
      betreuer("Schwarz", "Felix", "TF", "M"),
      betreuer("Schäfer", "Brunhilde", "HE", "M"),
      betreuer("Sacken", "Maike", "Kraftfahrer/Melder", "M"),
    ],
  },
  {
    ordner: "malter", datei: "04-1-betreuungstrupp", bezeichnung: "1. Betreuungstrupp", standort: MALTER, einsatz: EINSATZ_TEXT,
    soll: [0, 1, 1, 2],
    feld: { fachdienst: "Betreuungsdienst", leistung: "BTP", rufname: "54-75-02" },
    fahrzeuge: [{ typ: "GW-Betreuung", kennz: "MA-JU 15", ruf: "54-75-02" }],
    personal: [betreuer("Weber", "Markus", "GF", "U"), betreuer("Tone", "Tina", "TF", "M")],
  },
  {
    ordner: "malter", datei: "05-verpflegungsgruppe", bezeichnung: "Verpflegungsgruppe", standort: MALTER, einsatz: EINSATZ_TEXT,
    soll: [0, 1, 8, 9],
    feld: { fachdienst: "Verpflegung", leistung: "Verpflegung", rufname: "54-17-04" },
    fahrzeuge: [
      { typ: "MTW", kennz: "MA-JU 16", ruf: "54-17-04" },
      { typ: "Feldküche", kennz: "MA-JU 17" },
      { typ: "GW-Logistik", kennz: "MA-JU 18", ruf: "54-66-01" },
      { typ: "Kühlanhänger", kennz: "MA-JU 19" },
    ],
    personal: [
      verpfleger("Maus", "Stefan", "GF", "Verpflegungshelfer", "U"),
      verpfleger("Niele", "Silvia", "Kraftfahrer/Melder", "Verpflegungshelfer", "M"),
      verpfleger("Brome", "Cornelius", "Kraftfahrer/Melder", "Verpflegungshelfer", "M"),
      verpfleger("Pieperton", "Michelle", "Feldkoch", "Feldkoch", "M"),
      verpfleger("Müller", "Jordan", "Helfer", "Verpflegungshelfer", "M"),
      verpfleger("Bergmann", "Markus", "Feldkoch", "Feldkoch", "M"),
      verpfleger("Stein", "Michalea", "Helfer", "Verpflegungshelfer", "M"),
      verpfleger("Grober", "Niklas", "Feldkoch", "Feldkoch", "M"),
      verpfleger("Hoppe", "Samir", "Helfer", "Verpflegungshelfer", "M"),
    ],
  },
];

// ---------------------------------------------------------------- Akkonia

const AKKONIA: Standort = { organisation: O.JUH, ebene: EBENE_OV, ort: "Akkonia" };
const san = (n: string, v: string, f: string, q: string, r: Rolle = "M"): PersonZeile => [n, v, f, q, r];
const betrH = (n: string, v: string, f: string, r: Rolle = "M"): PersonZeile => [n, v, f, "Betr.-H", r];
const sanH = (n: string, v: string, f: string, r: Rolle = "M"): PersonZeile => [n, v, f, "SAN-H", r];

baeuplaene.push(
  {
    ordner: "akkonia", datei: "01-zugtrupp", bezeichnung: "Zugtrupp (Ztr)", standort: AKKONIA, einsatz: EINSATZ_TEXT,
    soll: [2, 0, 2, 4],
    feld: { fachdienst: "Zugtrupp", leistung: "Führung", rufname: "56-11-1" },
    fahrzeuge: [{ typ: "ELW 1", kennz: "AK-JU 33", ruf: "56-11-1" }],
    personal: [
      ["", "", "ZF", "", "F"],
      ["", "", "stv. ZF Zugtruppführer", "", "F"],
      ["Puchtar", "Fabian", "Funker, Melder", "", "M"],
      ["Hagemeyer", "Tobias", "Kraftfahrer, Melder, Funker", "", "M"],
    ],
  },
  {
    ordner: "akkonia", datei: "02-1-sanitaetsgruppe", bezeichnung: "1. Sanitätsgruppe", standort: AKKONIA, einsatz: EINSATZ_TEXT,
    soll: [1, 1, 7, 9],
    feld: { fachdienst: "Sanitätsdienst", leistung: "BHP", rufname: "56-96-1" },
    fahrzeuge: [
      { typ: "GW-SAN", kennz: "AK-JU 34", ruf: "56-96-1" },
      { typ: "MTW", kennz: "AK-JU 35", ruf: "56-17-2" },
    ],
    personal: [
      san("Kohlmeyer", "Helen", "GF", "RS", "U"),
      san("Wagner", "Leon", "Arzt", "Arzt", "F"),
      sanH("Richter", "Frank", "TF"),
      san("Schuster", "Chantal", "HE", "RS"),
      sanH("Vogel", "Rüdiger", "TF"),
      san("Schulze", "Andreas", "HE", "RS"),
      san("Franke", "Nicole", "TF", "RS"),
      sanH("Franke", "Dirk", "HE"),
      sanH("Schluz", "Manuela", "Kraftfahrer/Melder"),
    ],
  },
  {
    ordner: "akkonia", datei: "03-2-sanitaetsgruppe", bezeichnung: "2. Sanitätsgruppe", standort: AKKONIA, einsatz: EINSATZ_TEXT,
    soll: [0, 1, 5, 6],
    feld: { fachdienst: "Sanitätsdienst", leistung: "BHP (UHS 2)", rufname: "56-17-3" },
    fahrzeuge: [
      { typ: "MTW", kennz: "AK-JU 36", ruf: "56-17-03" },
      { typ: "Geräteanhänger-SAN", kennz: "AK-JU-37" },
    ],
    personal: [
      san("Gruber", "Hannes", "GF", "RS", "U"),
      san("Fiedler", "Nicole", "TF", "RS"),
      sanH("Estorff", "Pascal", "HE"),
      san("Kunst", "Michael", "TF", "RS"),
      sanH("Hoffmann", "Mirko", "HE"),
      sanH("Dommeyer", "Stefan", "Kraftfahrer/Melder"),
    ],
  },
  {
    ordner: "akkonia", datei: "04-1-betreuungsgruppe", bezeichnung: "1. Betreuungsgruppe", standort: AKKONIA, einsatz: EINSATZ_TEXT,
    soll: [0, 1, 8, 9],
    feld: { fachdienst: "Betreuungsdienst", leistung: "BTP", rufname: "56-17-04" },
    fahrzeuge: [
      { typ: "GW-Betreuung", kennz: "AK-JU 38", ruf: "56-69-01" },
      { typ: "MTW", kennz: "AK-JU 39", ruf: "56-17-04" },
    ],
    personal: [
      betrH("Schrader", "Yvonne", "GF", "U"),
      betrH("Schmidt", "Chayenne", "TF"),
      betrH("Teichmann", "Lothar", "HE"),
      betrH("Witzig", "Sabine", "TF"),
      betrH("Rüttemann", "Sybille", "HE"),
      betrH("Wolke", "Silvia", "TF"),
      betrH("Mayer", "Mia", "HE"),
      betrH("Sandvoß", "Vicky", "Melder"),
      betrH("Schlosser", "Tobias", "Kraftfahrer"),
    ],
  },
  {
    ordner: "akkonia", datei: "05-transportgruppe", bezeichnung: "Transportgruppe", standort: AKKONIA, einsatz: EINSATZ_TEXT,
    soll: [0, 1, 7, 8],
    feld: { fachdienst: "Sonst.: Transport", leistung: "Sonst.: Transport", rufname: "56-17-05" },
    fahrzeuge: [
      { typ: "MTW", kennz: "AK-JU 39", ruf: "56-17-05" },
      { typ: "RTW", kennz: "AK-JU 40", ruf: "56-85-01" },
      { typ: "KTW", kennz: "AK-JU 41", ruf: "56-92-01" },
      { typ: "KTW Bund", kennz: "AK-JU 42", ruf: "56-92-02" },
    ],
    personal: [
      sanH("Gärner", "Steffen", "GF", "U"),
      san("Power", "Harry", "(RTW)", "NFS"),
      san("Symiens", "Ute", "(RTW)", "RS"),
      san("Bender", "Anton", "(KTW 1)", "RS"),
      sanH("Fischer", "Ulrich", "(KTW 1)"),
      san("Knaller", "Tina", "(KTW2)", "RS"),
      sanH("Schimmer", "Elli", "(KTW 2)"),
      sanH("Marten", "Stefanie", "Kraftfahrer Melder"),
    ],
  },
  {
    ordner: "akkonia", datei: "06-verpflegungsgruppe", bezeichnung: "Verpflegungsgruppe", standort: AKKONIA, einsatz: EINSATZ_TEXT,
    soll: [0, 1, 5, 6],
    feld: { fachdienst: "Verpflegung", leistung: "Verpflegung", rufname: "56-17-06", kanal: "DMO 601" },
    fahrzeuge: [
      { typ: "MTW", kennz: "AK-JU 43", ruf: "56-17-06" },
      { typ: "Feldküche", kennz: "AK-JU 44" },
      { typ: "GW-Logistik-Küche", kennz: "AK-JU 45", ruf: "56-66-01" },
      { typ: "Kühlanhänger", kennz: "AK-JU 46" },
    ],
    personal: [
      betrH("Kurzer", "Michael", "GF", "U"),
      betrH("Fischer", "Fabian", "Feldkoch"),
      betrH("Brome", "Franziska", "Verpflegungshelfer"),
      betrH("Pieper", "Sarah", "Feldkoch"),
      betrH("Müller", "Jens", "Verpflegungshelfer"),
      betrH("Berger", "Markus", "Kraftfahrer/Melder"),
    ],
  },
  {
    ordner: "akkonia", datei: "07-psnv-staffel", bezeichnung: "PSNV-Staffel", standort: AKKONIA, einsatz: EINSATZ_TEXT,
    soll: [0, 1, 5, 6],
    feld: { fachdienst: "PSNV", leistung: "Sonst.", rufname: "56-17-07" },
    fahrzeuge: [
      { typ: "MTW", kennz: "AK-JU 47", ruf: "56-17-7" },
      { typ: "Kühlanhänger", kennz: "CE-JU 5005" },
    ],
    personal: [
      sanH("Kurzer", "Michael", "GF", "U"),
      sanH("Ascher", "Sabrina", "PSNV-B"),
      sanH("Zeppelin", "Selina", "PSNV-B"),
      sanH("Pape", "Julia", "PSNV-E"),
      sanH("Herzog", "Cindy", "PSNV-E"),
      sanH("Howard", "Lars", "Kraftfahrer/Melder"),
    ],
  },
);

// ------------------------------------------------------------ Johannesburg

const JOHANNESBURG: Standort = { organisation: O.JUH, ebene: EBENE_OV, ort: "Johannesburg" };
const tesi = (n: string, v: string, f: string, r: Rolle = "M"): PersonZeile => [n, v, f, "TeSi-Helfer", r];

baeuplaene.push(
  {
    ordner: "johannesburg", datei: "01-zugtrupp", bezeichnung: "Zugtrupp (Ztr)", standort: JOHANNESBURG, einsatz: EINSATZ_TEXT,
    soll: [2, 0, 2, 4],
    feld: { fachdienst: "Zugtrupp", leistung: "Führung", rufname: "55-17-1" },
    fahrzeuge: [{ typ: "ELW 2", kennz: "JO-JU 20", ruf: "55-17-1" }],
    personal: [
      sanH("Lampe", "Nils", "ZF", "F"),
      sanH("Schridde", "Helmut", "stv. ZF Zugtruppführer", "F"),
      sanH("Stolkan", "Lars", "Funker, Melder"),
      sanH("Polter", "Jan", "Kraftfahrer, Melder, Funker"),
    ],
  },
  {
    ordner: "johannesburg", datei: "02-1-sanitaetsgruppe", bezeichnung: "1. Sanitätsgruppe", standort: JOHANNESBURG, einsatz: EINSATZ_TEXT,
    soll: [1, 1, 8, 10],
    feld: { fachdienst: "Sanitätsdienst", leistung: "BHP", rufname: "55-96-1" },
    fahrzeuge: [
      { typ: "GW-SAN", kennz: "JO-JU 21", ruf: "55-96-1" },
      { typ: "MTW", kennz: "JO-JU 22", ruf: "55-17-2" },
    ],
    personal: [
      san("Symietz", "Sabine", "GF", "RS", "U"),
      san("Garbosch", "Kurt", "Arzt", "Arzt", "F"),
      san("Pietsch", "Jürgen", "TF", "NFS"),
      sanH("Garten", "Anabel", "HE"),
      san("Wiese", "Lisa", "TF", "RS"),
      sanH("Meyer", "Ute", "HE"),
      sanH("Schridde", "Benjamin", "TF"),
      sanH("Wittenberg", "Roland", "HE"),
      sanH("Rodern", "Philipp", "Kraftfahrer/Melder"),
      sanH("Schütter", "Ramona", "Kraftfahrer/Melder"),
    ],
  },
  {
    ordner: "johannesburg", datei: "03-2-sanitaetsgruppe", bezeichnung: "2. Sanitätsgruppe", standort: JOHANNESBURG, einsatz: EINSATZ_TEXT,
    soll: [0, 1, 5, 6],
    feld: { fachdienst: "Sanitätsdienst", leistung: "BHP", rufname: "55-96-2", kanal: "601" },
    fahrzeuge: [{ typ: "GW-SAN", kennz: "JO-JU 23", ruf: "55-96-02" }],
    personal: [
      san("Tomaka", "Sandy", "GF", "RS", "U"),
      san("Müller", "Jutta", "TF", "RS"),
      sanH("Recken", "Friedhelm", "HE"),
      san("Heyer", "Markus", "TF", "RS"),
      san("Dahma", "Rita", "HE", "RS"),
      sanH("Jakob", "Ulf", "Kraftfahrer/Melder"),
    ],
  },
  {
    ordner: "johannesburg", datei: "04-transportgruppe", bezeichnung: "Transportgruppe", standort: JOHANNESBURG, einsatz: EINSATZ_TEXT,
    soll: [2, 0, 6, 8],
    feld: { fachdienst: "Sonst.: Transport", leistung: "Sonst.: Transport", rufname: "55-82-01" },
    fahrzeuge: [
      { typ: "NEF", kennz: "JO-JU 24", ruf: "55-82-01" },
      { typ: "NEF", kennz: "JO-JU 25", ruf: "55-82-02" },
      { typ: "RTW", kennz: "JO-JU 26", ruf: "55-83-1" },
      { typ: "RTW", kennz: "JO-JU 27", ruf: "55-83-02" },
    ],
    personal: [
      ["Schütte", "Ingo", "NEF 1", "Arzt", "F"],
      ["Poul", "Simone", "NEF 1", "NFS", "M"],
      ["Fehren", "Uschi", "NEF 2", "Arzt", "F"],
      ["Taucher", "Karo", "NEF 2", "NFS", "M"],
      ["Willer", "Nils", "RTW 1", "NFS", "M"],
      ["Knoller", "Mario", "RTW 1", "RS", "M"],
      ["Sommer", "Matthias", "RTW 2", "NFS", "M"],
      ["Eckert", "Susanne", "RTW 2", "RS", "M"],
    ],
  },
  {
    ordner: "johannesburg", datei: "05-technik-und-sicherheit", bezeichnung: "Technik und Sicherheit", standort: JOHANNESBURG, einsatz: EINSATZ_TEXT,
    soll: [0, 1, 9, 10],
    feld: { fachdienst: "Technik u. Logistik", leistung: "Sonst.: Technik und Sicherheit", rufname: "55-17-3" },
    fahrzeuge: [
      { typ: "MTW", kennz: "JO-JU 28", ruf: "55-17-03" },
      { typ: "GA-Lima (Anhänger)", kennz: "JO-JU 29" },
      { typ: "WLF (TeSi - Container)", kennz: "JU-JU 30", ruf: "55-66-01" },
      { typ: "Containeranhänger", kennz: "JO-JU 31", bem: "Unterkunftsmaterial" },
    ],
    personal: [
      tesi("Zacken", "Benjamin", "GF", "U"),
      tesi("Wilbold", "Volker", "Kraftfahrer/Melder"),
      tesi("Alkcakayas", "Mohammed", "HE"),
      tesi("Recken", "Michaela", "Kraftfahrer/Melder"),
      tesi("Sürücü", "Fatma", "TF"),
      tesi("Gigo", "Herbert", "HE"),
      tesi("Hein", "Dieter", "TF"),
      tesi("Glad", "Viktor", "HE"),
      tesi("Selle", "Virginia", "TF"),
      tesi("Puster", "Frauke", "HE"),
    ],
  },
  {
    ordner: "johannesburg", datei: "06-kradmelder", bezeichnung: "Kradmelder", standort: JOHANNESBURG, einsatz: EINSATZ_TEXT,
    soll: [0, 0, 2, 2],
    feld: { fachdienst: "Sonst.: Kradmelder", leistung: "Sonst.: Sicherungsposten, Melde- und Lotsendienst", rufname: "55-79-1" },
    fahrzeuge: [
      { typ: "Krad", kennz: "JO-JU 32", ruf: "55-79-01" },
      { typ: "Krad", kennz: "JO-JU 33", ruf: "55-79-02" },
    ],
    personal: [sanH("Knoken", "Willi", "Kradmelder"), sanH("Rowald", "Silke", "Kradmelder")],
  },
);

// ---------------------------------------------------------------- Hannover

const LHH = "Landeshauptstadt Hannover";
const JUH_WASSERTURM: Standort = { organisation: O.JUH, ebene: EBENE_OV, ort: "Hannover-Wasserturm" };
const JUH_WASSERTURM_KURZ: Standort = { organisation: O.JUH, ebene: EBENE_OV, ort: "Wasserturm" };
const MHD_H: Standort = { organisation: O.MHD, ebene: EBENE_UNBEKANNT, ort: "Hannover" };
const DRK_H: Standort = { organisation: O.DRK, ebene: EBENE_UNBEKANNT, ort: "Hannover" };
const DRK_MITTE: Standort = { organisation: O.DRK, ebene: EBENE_UNBEKANNT, ort: "Hannover (Mitte)" };
const ASB_H: Standort = { organisation: O.ASB, ebene: EBENE_UNBEKANNT, ort: "Hannover" };
const ASB_MHD_H: Standort = { organisation: O.SONSTIGE, organisationName: "ASB/MHD", ebene: EBENE_UNBEKANNT, ort: "Hannover" };
const AL: Omit<Standort, "telefon" | "email"> = { organisation: O.JUH, ebene: EBENE_OV, ort: "Aller-Leine" };
const LANDESBERGEN: Standort = { organisation: O.JUH, ebene: EBENE_UNBEKANNT, ort: "Landesbergen" };
const WUNSTORF: Standort = { organisation: O.JUH, ebene: EBENE_OV, ort: "Wunstorf-Steinhuder Meer" };

const hJu = (typ: string, bem?: string): FzZeile => ({ typ, kennz: "H-JU XXX", ...(bem ? { bem } : {}) });
const hX = (typ: string, bem?: string): FzZeile => ({ typ, kennz: "H-X XXX", ...(bem ? { bem } : {}) });

function hannover(
  datei: string,
  bezeichnung: string,
  standort: Standort,
  soll: readonly [number, number, number, number],
  feld: Feld,
  fahrzeuge: FzZeile[],
): Bauplan {
  return { ordner: "hannover", datei, bezeichnung, standort, soll, feld, fahrzeuge, einsatz: EINSATZ_HANNOVER };
}

baeuplaene.push(
  hannover("01-2-einsatzzug-zugtrupp", `2. Einsatzzug ${LHH}`, JUH_WASSERTURM, [1, 1, 2, 4],
    { fachdienst: "Zugtrupp", leistung: "Führung (Zugführung)", rufname: "Akkon" },
    [hJu("ELW 1"), hJu("PKW gl.")]),
  hannover("02-2-einsatzzug-1-sanitaetsgruppe", `2. Einsatzzug ${LHH}`, JUH_WASSERTURM, [0, 1, 7, 8],
    { fachdienst: "Sanitätsdienst", leistung: "BHP (15)", rufname: "Akkon", bemerkung: "2x NFS! Taktisches Zeichen mit Ordnungszahl 1." },
    [hJu("GW-San"), hJu("MTW")]),
  hannover("03-2-einsatzzug-2-sanitaetsgruppe", `2. Einsatzzug ${LHH}`, JUH_WASSERTURM, [0, 1, 8, 9],
    { fachdienst: "Sanitätsdienst", leistung: "BHP (15)", rufname: "Akkon", bemerkung: "2x NFS! Taktisches Zeichen mit Ordnungszahl 2." },
    [hJu("GW-San"), hJu("MTW")]),
  hannover("04-2-einsatzzug-betreuungsgruppe", `2. Einsatzzug ${LHH}`, JUH_WASSERTURM, [0, 1, 5, 6],
    { fachdienst: "Betreuungsdienst", leistung: "BTP (20)", rufname: "Akkon" },
    [hJu("GW-Betreuung"), hJu("WLF + Ab Betr.")]),
  hannover("05-3-einsatzzug", `3. Einsatzzug ${LHH}`, JUH_WASSERTURM, [1, 4, 23, 28],
    { fachdienst: "Zugtrupp, Sanitätsdienst, Betreuungsdienst", leistung: "Führung (Zug), BHP (50) oder BTP (200)", rufname: "Akkon", bemerkung: "3x NFS!" },
    [
      hJu("ELW 1", "ZTr"),
      hJu("PKW gl.", "ZTr"),
      hJu("WLF/Ab BHP 50", "1. SanGr"),
      hJu("MTW", "1. SanGr"),
      hJu("MTW", "2. SanGr"),
      hJu("GW-Betr.", "BetrGr"),
      hJu("MTW", "BetrGr"),
    ]),
  hannover("06-1-fuehrungsgruppe", `1. Führungsgruppe ${LHH}`, JUH_WASSERTURM, [4, 3, 2, 9],
    { fachdienst: "Führungsgruppe", leistung: "Führung (BHP/BTP Nds.)", rufname: "Akkon" },
    [hJu("FüKW (N1)"), hJu("KdoW (Bund)"), hJu("PKW 1"), hJu("PKW 2")]),
  hannover("07-2-fuehrungsgruppe", `2. Führungsgruppe ${LHH}`, MHD_H, [4, 3, 2, 9],
    { fachdienst: "Führungsgruppe", leistung: "Führung (BHP/BTP N1)", rufname: "Malta" },
    [hX("FüKW (Ni)"), hX("GW-IuK"), hX("Anh. Fm")]),
  hannover("08-2-verpflegungsgruppe", `2. Verpflegungsgruppe ${LHH}`, JUH_WASSERTURM, [0, 1, 8, 9],
    { fachdienst: "Verpflegung", leistung: "Verpflegung (250 Pers.)", rufname: "Akkon" },
    [hJu("GW-Verpflegung"), hJu("FKH"), hJu("MTW"), hJu("Anh. Kühlung")]),
  hannover("09-3-verpflegungsgruppe", `3. Verpflegungsgruppe ${LHH}`, JUH_WASSERTURM, [0, 1, 5, 6],
    { fachdienst: "Verpflegung", leistung: "Verpflegung (200 Pers.)", rufname: "Akkon" },
    [hJu("LKW Lbw Sto"), hJu("FKH"), hJu("GW-Verpflegung"), hJu("Kühlanhänger")]),
  hannover("10-4-verpflegungsgruppe", `4. Verpflegungsgruppe ${LHH}`, MHD_H, [0, 1, 8, 9],
    { fachdienst: "Verpflegung", leistung: "Verpflegung (250 Pers.)", rufname: "Malta" },
    [hX("LKW Lbw (1)"), hX("LKW Lbw (2)"), hX("FKH"), hX("MTW")]),
  hannover("11-2-gruppe-technik-und-logistik", `2. Gruppe T+L ${LHH}`, JUH_WASSERTURM_KURZ, [0, 1, 5, 6],
    { fachdienst: "Technik u. Logistik", leistung: "Sonst.: Materialumschlag: Radlader mit Palettengabel!", rufname: "Akkon" },
    [hJu("LKW Lbw Sto"), hJu("Anh. Stromerz. + Lima"), hJu("WLF/Ab Log"), hJu("Radlader"), hJu("Tieflader")]),
  hannover("12-1-staffel-psnv", `1. Staffel PSNV ${LHH}`, JUH_WASSERTURM, [0, 1, 4, 5],
    { fachdienst: "PSNV", leistung: "Sonst.: Betreuung Betroffene + Einsatzkräfte", rufname: "Akkon" },
    [hJu("MTW"), hJu("PKW")]),
  hannover("13-1-einsatzzug", `1. Einsatzzug ${LHH}`, DRK_MITTE, [3, 4, 24, 31],
    {
      fachdienst: "Zugtrupp, Sanitätsdienst, Betreuungsdienst (-)",
      leistung: "BHP (25), Sonst.: Schwerpunkt BHP!",
      rufname: "Rotkreuz",
      bemerkung: "Taktisches Zeichen mit Ordnungszahl 1.",
    },
    [
      hX("ELW 1", "Ztr"),
      hX("KdoW", "Ztr"),
      { typ: "GW San + MTW", kennz: "H-X XXX + H-X XXX", bem: "1. SanGr" },
      { typ: "GW San + MTW", kennz: "H-X XXX + H-X XXX", bem: "2. SanGr" },
      { typ: "GW-Betr. + MTW", kennz: "H-X XXX + H-X XXX", bem: "BetrGr" },
    ]),
  hannover("14-4-einsatzzug", `4. Einsatzzug ${LHH}`, ASB_MHD_H, [1, 4, 16, 21],
    {
      fachdienst: "Zugtrupp, Sanitätsdienst, Betreuungsdienst",
      leistung: "BHP (30), Sonst.: Schwerpunkt BHP!",
      rufname: "Samma",
      bemerkung: "Taktisches Zeichen mit Ordnungszahl 4.",
    },
    [
      { typ: "ELW 1", kennz: "H-XXXX", bem: "Ztr., ASB, 1/1/1" },
      { typ: "GW-San", kennz: "H-XXXX", bem: "1. SanGr, MHD, -/1/5/6" },
      { typ: "GW-San", kennz: "H-XXXX", bem: "2. SanGr, ASB, -/1/5/6" },
      { typ: "GW-San", kennz: "H-XXXX", bem: "Betr.Gr, ASB, -/1/5/6" },
    ]),
  hannover("15-1-gruppe-technik-und-logistik", `1. Gruppe T+L ${LHH}`, DRK_H, [0, 1, 8, 9],
    { fachdienst: "Technik u. Logistik", rufname: "Rotkreuz" },
    [hX("GW-Log (klein)"), hX("GW-Log (groß)"), hX("Stromerzeuger"), hX("MTW")]),
  hannover("16-2-patiententransportstaffel", `2. Patiententransp. Staffel LHH`, ASB_H, [0, 1, 5, 6],
    { fachdienst: "Sonst.: Patiententransp.", rufname: "Samma" },
    [
      { typ: "KTW", kennz: "H-S XXX" },
      { typ: "KTW", kennz: "H-J XXX" },
      { typ: "KTW", kennz: "H-J XXX" },
    ]),
  hannover("17-3-patiententransportstaffel", `3. Patiententransportstaffel LHH`, DRK_H, [0, 1, 5, 6],
    { fachdienst: "Sonst.: Patiententransp.", rufname: "Rotkreuz" },
    [hX("KTW"), hX("KTW-B"), hX("KTW-B")]),
  hannover("18-4-patiententransportstaffel", `4. Patiententransportstaffel LHH`, JUH_WASSERTURM, [0, 1, 5, 6],
    { fachdienst: "Sonst.: Patiententransp.", rufname: "Akkon" },
    [hJu("KTW-B"), hJu("KTW-B"), hJu("KTW-B")]),
  // Drei Bögen der SEG Aller-Leine (maschinell ausgefüllt): Telefon, Fax, E-Mail stehen im Original als echte Angaben.
  {
    ...hannover("19-seg-aller-leine-zugtrupp", "Zugtrupp (Einsatzzug / San-Zug)",
      { ...AL, telefon: "01622119614", email: "elw-aller-leine@johanniter.de" }, [1, 0, 4, 5],
      {
        fachdienst: "Zugtrupp", leistung: "Führung (GW-SAN + Transportgruppe)", rufname: "HK 50-11-1", kanal: "R_HK_3",
        fax: fakeTelefon("01622119624"), bemerkung: "Organisationseinheit auf dem Bogen: SEG-Johanniter (JUH OV Aller-Leine).",
      },
      [
        { typ: "ELW1", kennz: "HK-R5011", ruf: "HK 50-11-1" },
        { typ: "Krad", kennz: "SFA R5164", ruf: "52-79-1" },
        { typ: "Krad", kennz: "HK R5165", ruf: "52-79-1" },
      ]),
  },
  hannover("20-seg-aller-leine-gw-san", "GW-SAN (Einsatzzug / San-Zug)", { ...AL }, [0, 1, 7, 8],
    {
      fachdienst: "Sanitätsdienst", leistung: "BHP (10)", rufname: "50-96-1", kanal: "R_HK_3",
      bemerkung: "Organisationseinheit auf dem Bogen: SEG Johanniter (JUH OV Aller-Leine). Taktisches Zeichen mit Aufschrift JUH.",
    },
    [
      { typ: "GW-SAN", kennz: "HK-R 5096", ruf: "50-96-1" },
      { typ: "MTW", kennz: "HK-R 5061", ruf: "50-17-1" },
    ]),
  {
    ...hannover("21-seg-aller-leine-patiententransportgruppe", "Patiententransportgruppe (Einsatzzug / San-Zug)",
      { ...AL, telefon: "01622119629" }, [0, 1, 9, 10],
      {
        fachdienst: "Sonst.: Transportgruppe", leistung: "Sonst.: Transport", rufname: "50-85-1", kanal: "R_HK_3",
        bemerkung: "Organisationseinheit auf dem Bogen: SEG-Johanniter (JUH OV Aller-Leine).",
      },
      [
        { typ: "SEG-RTW Schwarmstedt", kennz: "HK-R 5051", ruf: "50-85-1" },
        { typ: "SEG-RTW Hodenhagen", kennz: "HK-R 5251", ruf: "52-85-1" },
        { typ: "SEG-KTW Typ A", kennz: "HK R 5091", ruf: "50-92-1" },
        { typ: "SEG-KTW4", kennz: "SFA 8054", ruf: "52-94-1" },
        { typ: "HA-RTW 5", kennz: "HK-R 5035", ruf: "50-83-5" },
      ]),
  },
  hannover("22-seg-san-landesbergen", "SEG-San", LANDESBERGEN, [0, 4, 11, 15],
    { fachdienst: "keine Angabe", leistung: "BHP (20)" },
    [
      { typ: "KdoW", kennz: "NI", ruf: "NI 50-10-1", bem: "-/1/1/2" },
      { typ: "RTW", kennz: "NI", ruf: "NI 50-85-1", bem: "-/1/1/2" },
      { typ: "RTW", kennz: "NI", ruf: "NI 50-85-2", bem: "-/1/1/2" },
      { typ: "MTW", kennz: "NI", ruf: "NI 50-17-1", bem: "-/1/8/9" },
      { typ: "Anh. BHP", kennz: "NI", ruf: "NI 50-90-1" },
    ]),
  hannover("23-seg-wunstorf-san-betreuungszug", "SEG (San/Betr-Zug / Einsatzzug)", WUNSTORF, [1, 4, 22, 27],
    {
      fachdienst: "Zugtrupp, Sanitätsdienst, Betreuungsdienst",
      leistung: "Führung (Zug), BHP (25), BTP (200), Sonst.: Schwerpunkt BHP!",
      rufname: "Akkon Holland XX XX XX",
    },
    [
      { typ: "KdoW", ruf: "55-10-1", bem: "ZTr" },
      { typ: "ELW", ruf: "55-11-1", bem: "ZTr, 1/1/2/4" },
      { typ: "MTW", ruf: "55-17-5", bem: "1. SanGr" },
      { typ: "GW-San", ruf: "55-96-1", bem: "1. SanGr, -/1/7/8" },
      { typ: "MTW", ruf: "55-17-6", bem: "2. SanGr, -/1/5/6" },
      { typ: "MTW", ruf: "55-17-2", bem: "Betr.Gr" },
      { typ: "MTW", ruf: "55-17-3", bem: "Betr.Gr" },
      { typ: "MTW", ruf: "55-19-1", bem: "Betr.Gr" },
      { typ: "WLF/Ab Plane", ruf: "55-66-1", bem: "Betr.Gr, -/1/8/9" },
    ]),
);

// ------------------------------------------------------------ Selbstprüfung

/** Vordrucke, deren Stärke-Zeile sich selbst nicht aufsummiert (Wunstorf: 1/4/22/28); das Modell leitet die Gesamtstärke ab, daher 27. */
const SUMME_STIMMT_NICHT = new Set<string>();

function pruefen(): void {
  const fehler: string[] = [];
  const dateien = new Set<string>();
  for (const p of baeuplaene) {
    const schluessel = `${p.ordner}/${p.datei}`;
    if (dateien.has(schluessel)) fehler.push(`Dateiname doppelt: ${schluessel}`);
    dateien.add(schluessel);
    const [f, u, m, g] = p.soll;
    if (f + u + m !== g && !SUMME_STIMMT_NICHT.has(schluessel)) fehler.push(`${schluessel}: Soll ${f}/${u}/${m}/${g} summiert sich nicht`);
    if (p.personal) {
      const ist = staerke({ personal: p.personal.map(person) });
      if (ist.fuehrer !== f || ist.unterfuehrer !== u || ist.mannschaft !== m || ist.gesamt !== g) {
        fehler.push(`${schluessel}: Stärke ${ist.fuehrer}/${ist.unterfuehrer}/${ist.mannschaft}/${ist.gesamt} ≠ Vordruck ${f}/${u}/${m}/${g}`);
      }
    }
  }
  if (fehler.length > 0) throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
}

function roundtrip(bogen: Erfassungsbogen, name: string): void {
  const zurueck = decodePayload(encodePayload(bogen, nodeKompressor), nodeKompressor);
  const a = staerke(bogen);
  const b = staerke(zurueck);
  if (a.gesamt !== b.gesamt || a.fuehrer !== b.fuehrer || a.unterfuehrer !== b.unterfuehrer) {
    throw new Error(`${name}: Roundtrip-Stärke ${b.fuehrer}/${b.unterfuehrer}/${b.mannschaft}/${b.gesamt} ≠ ${a.fuehrer}/${a.unterfuehrer}/${a.mannschaft}/${a.gesamt}`);
  }
  if (zurueck.personal.length !== bogen.personal.length) throw new Error(`${name}: Roundtrip verliert Personen`);
  if (zurueck.fahrzeuge.length !== bogen.fahrzeuge.length) throw new Error(`${name}: Roundtrip verliert Fahrzeuge`);
  if ((zurueck.sonstiges ?? "") !== (bogen.sonstiges ?? "")) throw new Error(`${name}: Roundtrip verändert „Sonstiges“`);
}

// ---------------------------------------------------------------- Hauptlauf

pruefen();

const ausgabe = join(wurzel, "examples", "praktische-ausbildung");
for (const ordner of new Set(baeuplaene.map((p) => p.ordner))) {
  const pfad = join(ausgabe, ordner);
  mkdirSync(pfad, { recursive: true });
  for (const datei of readdirSync(pfad)) if (datei.endsWith(".json")) rmSync(join(pfad, datei));
}

const ORDNER_TITEL: Record<string, string> = {
  malter: "JUH RV Malter",
  akkonia: "JUH OV Akkonia",
  johannesburg: "JUH OV Johannesburg",
  hannover: "Einlagen Kräfte Landeshauptstadt Hannover",
};

const zeilen: Record<string, string[]> = {};
const summe: Record<string, Staerke> = {};
for (const plan of baeuplaene) {
  // Die „Begründung meiner Planung" steht im Original auf der letzten Seite der Malter-Bögen.
  const extra = plan.ordner === "malter" && plan.datei === "05-verpflegungsgruppe" ? MALTER_BEGRUENDUNG : undefined;
  const bogen = bogenAus(plan, extra);
  roundtrip(bogen, `${plan.ordner}/${plan.datei}`);
  writeFileSync(join(ausgabe, plan.ordner, `${plan.datei}.json`), JSON.stringify(bogen, null, 2) + "\n");
  const s = staerke(bogen);
  const gesamt = (summe[plan.ordner] ??= { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 });
  gesamt.fuehrer += s.fuehrer;
  gesamt.unterfuehrer += s.unterfuehrer;
  gesamt.mannschaft += s.mannschaft;
  gesamt.gesamt += s.gesamt;
  const orgText = bogen.einheit.organisationName ?? O[bogen.einheit.organisation];
  (zeilen[plan.ordner] ??= []).push(
    `| ${plan.datei} | ${plan.bezeichnung} | ${orgText} ${plan.standort.ort} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${bogen.fahrzeuge.length} | ${bogen.personalErfassung === PersonalErfassung.NUR_STAERKE ? "nur Stärke" : "mit Namen"} |`,
  );
  console.log(`✓ ${plan.ordner}/${plan.datei} (${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt})`);
}

const tabellen = Object.keys(zeilen)
  .map((ordner) => {
    const s = summe[ordner]!;
    return `## ${ORDNER_TITEL[ordner]} (\`${ordner}/\`)

${zeilen[ordner]!.length} Bögen, zusammen ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt}.

| Datei | Einheit | Organisation | Stärke | Fz | Erfassung |
|---|---|---|---|---|---|
${zeilen[ordner]!.join("\n")}
`;
  })
  .join("\n");

writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Praktische Ausbildung

${baeuplaene.length} Bögen aus vier Bogensätzen einer praktischen Ausbildung (Vordruck
„Einheitenerfassungsbogen" der Johanniter-Akademie Niedersachsen/Bremen), eins zu
eins übernommen. Die Stärkezahlen im Format VF/ZF/Arzt – GF – TF/He – Gesamt entsprechen
Führer/Unterführer/Mannschaft/Gesamt der App.

Namen, Funktionen, Qualifikationen, Fahrzeuge, Kennzeichen und Rufnamen stehen so da,
wie sie auf den Vordrucken stehen, einschließlich ihrer Eigenheiten:

- Leere Namensplätze (Akkonia, Zugtrupp: Zugführer und Stellvertreter ohne Namen).
- Kennzeichen-Platzhalter „H-JU XXX" auf den handschriftlichen Bögen aus Hannover.
- Doppelt vergebene Angaben: Kennzeichen „AK-JU 39" (Akkonia, 1. Betreuungsgruppe und
  Transportgruppe), Rufname „52-79-1" (zwei Krads der SEG Aller-Leine), Michael Kurzer als
  Gruppenführer in Verpflegungsgruppe und PSNV-Staffel (Akkonia).
- Malter, Zugtrupp: Funkrufname „54-17-1" im Feld Kommunikation, „56-17-1" beim ELW 2.
- Hannover, SEG Wunstorf: Die Stärke-Zeile lautet 1/4/22/28, summiert sich aber auf 27
  (die Teileinheiten auf dem Bogen ergeben ebenfalls 27). Das Datenmodell leitet die
  Gesamtstärke aus den Teilzahlen ab, der Bogen steht deshalb als 1/4/22/27 da.
- Malter, 1. Betreuungstrupp: Das zweite Fahrzeug des 1. Betreuungstrupps (Malter) hat nur das
  Kennzeichen „MA-" ohne Fahrzeugtyp und fehlt deshalb.

Was das Datenmodell nicht kennt, steht im Feld „Sonstiges": Fachdienst-Kreuze,
Hauptleistung (BHP/BTP mit Plätzen), das Feld Kommunikation und handschriftliche
Bemerkungen. Bei Malter hängt die „Begründung meiner Planung" von der letzten Seite am
Bogen der Verpflegungsgruppe.

Ergänzt, weil das Modell sie verlangt und die Vordrucke sie nicht führen: Geschlecht
(nach Vornamen, nur für die Unterbringungsauswertung), Ernährung „Fleisch",
Fahrerlaubnis „keine Angabe", Einsatzbezeichnung und Datum 17.02.2024 (Datum der
Unterschrift auf den Vordrucken), bei JUH-Bögen mit nackten Rufnamen das Kennwort „Akkon".
Telefon, Fax und E-Mail der SEG Aller-Leine sind im Original echt und hier durch
Platzhalter ersetzt (555…, *.example).

Die Bögen aus Hannover liegen als Papierscan ohne Namensliste vor und sind im Modus
„Nur Stärke" angelegt. Gelesen wurde handschriftlich; unsicher sind „LKW Lbw Sto" und der
Rufname „Akkon Holland XX XX XX" (Wunstorf).

Alle Bögen sind als Übung gekennzeichnet.

Neu erzeugen mit: \`npm run beispiele:ausbildung\` (deterministisch).

${tabellen}`,
);

console.log(`\nFertig: ${baeuplaene.length} Beispielbögen in examples/praktische-ausbildung/ (+ README.md)`);
