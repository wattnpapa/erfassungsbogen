/**
 * Generiert src/vokabulare/berufe.ts aus der Klassifikation der Berufe (KldB 2010).
 *
 * Verwendet wird die Ebene der Berufsuntergruppen (4-stellige Kennziffer, 701
 * gültige Einträge). Die 5-stellige Ebene wäre feiner, unterscheidet aber je
 * Beruf nur noch das Anforderungsniveau ("-Helf./Anlerntät.", "-kompl.Spez.tät.")
 * — für die Zusatzqualifikation einer Person ist das Rauschen.
 *
 * Die amtlichen Bezeichnungen sind auf 44 Zeichen gekürzt und darum stark
 * abgekürzt ("Berufe Maschinenb.&Betriebst.(son.spez.Tät.)"). Hier werden sie
 * auf lesbare Vorschlagstexte gebracht; ABKUERZUNGEN muss dafür vollständig
 * bleiben — bleibt ein Punkt stehen, bricht der Generator ab.
 *
 * Aufruf:  npx tsx scripts/berufe-vokabular.mts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HIER = dirname(fileURLToPath(import.meta.url));
const QUELLE = join(HIER, "quellen", "kldb-2010-berufe.csv");
const ZIEL = join(HIER, "..", "src", "vokabulare", "berufe.ts");

/**
 * Anhänge, die das Anforderungs- bzw. Spezialisierungsniveau markieren. Sie
 * unterscheiden Geschwister-Kennziffern (2510 "(o.Spez.)" vs. 2518
 * "(sonst.spez.Tät.)") und müssen deshalb erhalten bleiben — nur "(o.Spez.)"
 * fällt weg, weil es lediglich den Sammeleintrag der Gruppe bezeichnet.
 */
const NIVEAU: [RegExp, string][] = [
  [/\s*\(o\.\s?Spez\.\)/g, ""],
  [/\s*\((?:sonst|son|s)\.\s?(?:spez|sp)\.\s?Tät\.\)/g, " (sonstige Spezialtätigkeit)"],
  [/\(o\.Produktsp\.\)/g, "(ohne Produktspezialisierung)"],
  [/\(ohne Produktspezialisier\.\)/g, "(ohne Produktspezialisierung)"],
];

/** Rollen-Präfixe, die im Original mit Bindestrich am Sachgebiet kleben. */
const PRAEFIXE: [RegExp, string][] = [
  [/^Aufsichts-\s*&\s*Führungskr\.-\s*/, "Aufsichts- und Führungskräfte "],
  [/^Aufsicht-\s*&\s*Führungskr\.-\s*/, "Aufsichts- und Führungskräfte "],
  [/^Aufs\.\s*&\s*Führung\.-\s*/, "Aufsichts- und Führungskräfte "],
  [/^Aufsichtskr\.-\s*/, "Aufsichtskräfte "],
  [/^Führungskr\.-\s*/, "Führungskräfte "],
  // "Berufe X" ist die amtliche Sammelformulierung; als Vorschlag stört sie.
  [/^Berufe\s+/, ""],
];

/**
 * Einträge, bei denen die mechanische Auflösung daneben läge. Zwei Ursachen:
 * "Tech." steht je Sachgebiet für ein anderes Genus ("Technisches Zeichnen",
 * aber "Technischer Betrieb"), und wo das Original "&" direkt an eine gekürzte
 * Wortverbindung hängt ("Gesundh.&Krankenpfl."), fällt der Fugenstrich weg.
 * Schlüssel ist die KldB-Kennziffer.
 */
const SONDERFAELLE: Record<string, string> = {
  "1174": "Sammeln und Gewinnen von Pflanzen und anderen Naturprodukten",
  "2218": "Kunststoff- und Kautschukherstellung und -verarbeitung (sonstige Spezialtätigkeit)",
  "2233": "Produktion von Fertigprodukten aus Holz und Holzwerkstoffen",
  "2728": "Technisches Zeichnen, Konstruktion und Modellbau (sonstige Spezialtätigkeit)",
  "2729": "Aufsichts- und Führungskräfte Technisches Zeichnen, Konstruktion und Modellbau",
  "4338": "IT-Netzwerkadministration und -organisation (sonstige Spezialtätigkeit)",
  "5119": "Aufsichtskräfte Technischer Betrieb Eisenbahn-, Luft- und Schiffsverkehr",
  "5253": "Kranführer/innen, Aufzugsmaschinisten und Bedienung verwandter Hebeeinrichtungen",
  "7218": "Versicherungs- und Finanzdienstleistungen (sonstige Spezialtätigkeit)",
  "8138": "Gesundheits- und Krankenpflege (sonstige Spezialtätigkeit)",
};

/**
 * Abgekürzte Wortstämme → Langform. Aus allen 701 Bezeichnungen erhoben; die
 * Schlüssel enthalten den Punkt, damit "Verk." nicht in "Verkauf" trifft.
 */
const ABKUERZUNGEN: Record<string, string> = {
  "Abfallbeauftr.": "Abfallbeauftragte",
  "allgemeinb.": "allgemeinbildende",
  "and.": "andere",
  "Anlagentech.": "Anlagentechnik",
  "apothekenübl.": "apothekenübliche",
  "Arbeitssich.": "Arbeitssicherheit",
  "asiat.": "asiatischer",
  "Aufs.": "Aufsicht",
  "Aufzugsmasch.": "Aufzugsmaschinisten",
  "auß.": "außer",
  "Ausbild.": "Ausbildung",
  "außerschul.": "außerschulischer",
  "Baumsch.": "Baumschule",
  "Baustoffh.": "Baustoffherstellung",
  "Bautens.": "Bautenschutz",
  "Bauwerksab.": "Bauwerksabdichtung",
  "Bed.": "Bedienung",
  "Bekl.": "Bekleidung",
  "betriebl.": "betriebliche",
  "Betriebspäd.": "Betriebspädagogik",
  "Betriebst.": "Betriebstechnik",
  "Betriebstech.": "Betriebstechnik",
  "Betriebsw.": "Betriebswirtschaft",
  "Betr.": "Betrieb",
  "Bewegungsk.": "Bewegungskunst",
  "bild.": "bildende",
  "Bildungseinr.": "Bildungseinrichtungen",
  "Binnensch.": "Binnenschifffahrt",
  "Brandsch.": "Brandschutz",
  "Bürobed.": "Bürobedarf",
  "Bürokr.": "Bürokräfte",
  "Desinf.": "Desinfektion",
  "Dirigententät.": "Dirigententätigkeiten",
  "Druckweiterverarbeit.": "Druckweiterverarbeitung",
  "Edelmetallbear.": "Edelmetallbearbeitung",
  "Edelst.": "Edelsteine",
  "Erzieh.": "Erziehung",
  "Einrichtungsgegenst.": "Einrichtungsgegenstände",
  "Eisenbahninfrastrukt.": "Eisenbahninfrastruktur",
  "Eisenbahnverkehrsbetr.": "Eisenbahnverkehrsbetrieb",
  "Entw.": "Entwicklung",
  "Entwickl.": "Entwicklung",
  "Erdgasraffinationsanl.": "Erdgasraffinationsanlagen",
  "Ernähr.": "Ernährung",
  "Fahrz.": "Fahrzeug",
  "Fahrzeugelektr.": "Fahrzeugelektronik",
  "Fahrzeugführ.": "Fahrzeugführung",
  "Fernsehprod.": "Fernsehproduktion",
  "Fertigprod.": "Fertigprodukten",
  "Finanzdienstl.": "Finanzdienstleistungen",
  "Flechtwerkgestalt.": "Flechtwerkgestaltung",
  "Forsch.": "Forschung",
  "forstwirtsch.": "forstwirtschaftliche",
  "Führung.": "Führung",
  "Futtermittelherst.": "Futtermittelherstellung",
  "Geburtsh.": "Geburtshilfe",
  "Geflügelhalt.": "Geflügelhaltung",
  "Gemeindearb.": "Gemeindearbeit",
  "Genussmittelherst.": "Genussmittelherstellung",
  "Geschlechtsorg.": "Geschlechtsorgane",
  "Gesellschaftswiss.": "Gesellschaftswissenschaften",
  "Ges.": "Gesang",
  "Gesundh.": "Gesundheits",
  "Gesundheitsaufs.": "Gesundheitsaufsicht",
  "Gesundheitsber.": "Gesundheitsberatung",
  "Glaser.": "Glaserei",
  "Hafenverk.": "Hafenverkehr",
  "handwerkl.": "handwerkliche",
  "Haushaltsw.": "Haushaltswaren",
  "Haust.": "Haustier",
  "Hautkrankh.": "Hautkrankheiten",
  "Hebeeinr.": "Hebeeinrichtungen",
  "Heilerziehungspfl.": "Heilerziehungspflege",
  "Heilk.": "Heilkunde",
  "Heimw.": "Heimwerker",
  "Herstell.": "Herstellung",
  "Holzwerkst.": "Holzwerkstoffen",
  "Industrieker.": "Industriekeramik",
  "Inf.": "Informations",
  "Interessenorganis.": "Interessenorganisationen",
  "Isolier.": "Isolierung",
  "IT-Admin.": "IT-Administration",
  "IT-Anwendungsber.": "IT-Anwendungsberatung",
  "IT-Koord.": "IT-Koordination",
  "IT-Netzw.": "IT-Netzwerk",
  "IT-Netzwerkt.": "IT-Netzwerktechnik",
  "IT-Orga.": "IT-Organisation",
  "IT-Vertr.": "IT-Vertrieb",
  "Jagdw.": "Jagdwirtschaft",
  "kaufm.": "kaufmännische",
  "Kautschukh.": "Kautschukherstellung",
  "Kautschukher.": "Kautschukherstellung",
  // Nach der Klebe-Normalisierung steht hier ein Leerzeichen: "Kommunik.tech."
  "Kommunik. tech.": "Kommunikationstechnik",
  "Konfektionäre/innen": "Konfektionäre/innen",
  "Konst.": "Konstruktion",
  "Konstr.": "Konstruktion",
  "Korrekturles.": "Korrekturleser/innen",
  "Kraftfahrz.": "Kraftfahrzeuge",
  "Kranführ.": "Kranführer/innen",
  "Krankenpfl.": "Krankenpflege",
  "Kunsth.": "Kunsthandwerk",
  "kunsth.": "kunsthandwerkliche",
  "Kunst.": "Kunst",
  "Kunstst.": "Kunststoff",
  "Lagerw.": "Lagerwirtschaft",
  "landwirtschaftl.": "landwirtschaftlich",
  "Lebensmitt.": "Lebensmittel",
  "Lebensmittelherst.": "Lebensmittelherstellung",
  "Lederw.": "Lederwaren",
  "Literaturw.": "Literaturwissenschaften",
  "Literaturwiss.": "Literaturwissenschaften",
  "Literaturwissens.": "Literaturwissenschaften",
  "Luftverk.": "Luftverkehr",
  "Luftverkehrsbetr.": "Luftverkehrsbetrieb",
  "Maschinenb.": "Maschinenbau",
  "Med.": "Medizin",
  "Mediengest.": "Mediengestaltung",
  "Medizin.": "Medizinische",
  "Medizin.-techn.": "Medizinisch-technische",
  "Medizinisch-techn.": "Medizinisch-technische",
  "medizintechn.": "medizintechnische",
  "Modellb.": "Modellbau",
  "Mineralaufb.": "Mineralaufbereitung",
  "Mineralaufber.": "Mineralaufbereitung",
  "Metalloberflächenbe.": "Metalloberflächenbehandlung",
  "Metalloberflächenbehandl.": "Metalloberflächenbehandlung",
  "Moderat.": "Moderation",
  "Musikinstrumentenb.": "Musikinstrumentenbau",
  "Mützenherstell.": "Mützenherstellung",
  "Nautisch.": "Nautische",
  "Naturprod.": "Naturprodukten",
  "Neur.": "Neurologie",
  "nichtärzt.": "nichtärztliche",
  "Obj.": "Objektschutz",
  "öffentl.": "öffentliche",
  "operations-": "operations-",
  "Papierverarbeit.": "Papierverarbeitung",
  "Pelzherst.": "Pelzherstellung",
  "Pelzherstell.": "Pelzherstellung",
  "Pers.": "Personen",
  "Personentrans.": "Personentransport",
  "Pflanz.": "Pflanzen",
  "Porzellanmal.": "Porzellanmalerei",
  "Postdienstleistungskaufl.": "Postdienstleistungskaufleute",
  "Prod.": "Produktion",
  "Produktionsplan.": "Produktionsplanung",
  "Produktsp.": "Produktspezialisierung",
  "Produktspezialisier.": "Produktspezialisierung",
  "Psych.": "Psychiatrie",
  "psychos.": "psychosomatische",
  "Psychot.": "Psychotherapie",
  "Raumausstatt.": "Raumausstattung",
  "Rechtsb.": "Rechtsberatung",
  "Rechtsberat.": "Rechtsberatung",
  "Rettungsd.": "Rettungsdienst",
  "Schausp.": "Schauspiel",
  "Schiffbaut.": "Schiffbautechnik",
  "Schiffsoffizier.": "Schiffsoffiziere",
  "Schiffsv.": "Schiffsverkehr",
  "Schiffsverk.": "Schiffsverkehr",
  "Schiffsverkehrsbetr.": "Schiffsverkehrsbetrieb",
  "Servicekr.": "Servicekräfte",
  "Lehrkr.": "Lehrkräfte",
  "Assistenzkr.": "Assistenzkräfte",
  "Sicherheitstechn.": "Sicherheitstechnik",
  "son.": "sonstige",
  "sonst.": "sonstige",
  "Sozialarb.": "Sozialarbeit",
  "Sportart.": "Sportartikel",
  "Staudengärt.": "Staudengärtnerei",
  "Steu.": "Steuerung",
  "Steuer.": "Steuerung",
  "Straßenverk.": "Straßenverkehr",
  "Straßenverkehrsbetr.": "Straßenverkehrsbetrieb",
  "Stuckateurarb.": "Stuckateurarbeiten",
  "Tät.": "Tätigkeiten",
  "tech.": "technische",
  "Tech.": "Technische",
  "techn.": "technische",
  "Techn.": "Technische",
  "-techn.": "-technik",
  "Trockenb.": "Trockenbau",
  "verarbeit.": "verarbeitung",
  "Telekommunikationst.": "Telekommunikationstechnik",
  "Ther.": "Therapie",
  "Theol.": "Theologie",
  "Tiermed.": "Tiermedizin",
  "Tierheilk.": "Tierheilkunde",
  "Tont.": "Tontechnik",
  "Triebfahrzeugführ.": "Triebfahrzeugführer/innen",
  "Unterhalt.": "Unterhaltung",
  "Unternehmensorg.": "Unternehmensorganisation",
  "Unternehmensorganis.": "Unternehmensorganisation",
  "Veran.": "Veranstaltungstechnik",
  "Verf.": "Verfahrens",
  "Verk.": "Verkauf",
  "Verkehrsbet.": "Verkehrsbetrieb",
  "Verkehrsbetr.": "Verkehrsbetrieb",
  "Verkehrsflugzeugführ.": "Verkehrsflugzeugführer/innen",
  "Verpackungstech.": "Verpackungstechnik",
  "Vers.": "Versicherungs",
  "verw.": "verwandte",
  "v.": "von",
  "vis.": "visuelles",
  "Wart.": "Wartung",
  "Welln.": "Wellness",
  "Wirtschaftswissen.": "Wirtschaftswissenschaften",
  "Zeich.": "Zeichnen",
  "Zierpflanzenb.": "Zierpflanzenbau",
  "Zoobed.": "Zoobedarf",
  "Zubeh.": "Zubehör",
  "Zustell.": "Zustellung",
  "Überw.": "Überwachung",
  "Überwach.": "Überwachung",
  "-Erzieh.": "-Erziehung",
  "-Fahrz.": "-Fahrzeug",
  "-Gesundh.": "-Gesundheits",
  "-Lagerw.": "-Lagerwirtschaft",
  "-Obj.": "-Objektschutz",
  "-Orga.": "-Organisation",
  "-ordn.": "-ordnung",
  "-sprech.": "-sprechung",
  "-strat.": "-strategie",
  "-Tech.": "-Technik",
  "-Trockenb.": "-Trockenbau",
  "-ver.": "-verarbeitung",
  "-verarb.": "-verarbeitung",
  "-verarbeit.": "-verarbeitung",
  "-Überwach.": "-Überwachung",
  "-überwach.": "-überwachung",
  "Zimmer.": "Zimmerei",
};

/** Nach Länge absteigend, damit "Überwach." vor "Überw." und "-techn." vor "techn." greift. */
const ABK_SORTIERT = Object.keys(ABKUERZUNGEN).sort((a, b) => b.length - a.length);

function lesbar(roh: string): string {
  let s = roh.trim();
  for (const [muster, ersatz] of NIVEAU) s = s.replace(muster, ersatz);
  // Im Original klebt die Abkürzung oft am Folgewort ("Tech.Zeich.,Konst."),
  // weil die 44 Zeichen sonst nicht reichten. Erst trennen, dann auflösen —
  // sonst greift "Tech." dort, wo "Techn." gemeint ist.
  s = s.replace(/\.(?=[A-Za-zÄÖÜäöüß])/g, ". ");
  for (const [muster, ersatz] of PRAEFIXE) s = s.replace(muster, ersatz);

  // "&" ist im Original ohne Leerzeichen üblich ("Holzbe-&verarbeit."); erst
  // Leerzeichen setzen, dann die Wortstämme auflösen.
  s = s.replace(/\s*&\s*/g, " & ");
  for (const abk of ABK_SORTIERT) {
    s = s.split(abk).join(ABKUERZUNGEN[abk]!);
  }
  s = s.replace(/\s*&\s*/g, " und ");
  // Kommata ohne Folgeleerzeichen ("Maler-,Stuckateurarbeiten") auftrennen.
  s = s.replace(/,(?=\S)/g, ", ").replace(/\s{2,}/g, " ").trim();
  // Erstes Zeichen groß: aus "kaufmännische und technische Betriebswirtschaft"
  // wird sonst ein klein beginnender Vorschlag.
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const zeilen = readFileSync(QUELLE, "utf8").split("\n").slice(1);
const eintraege: { kennziffer: string; name: string }[] = [];
for (const zeile of zeilen) {
  if (!zeile.trim()) continue;
  const [kennziffer, bezeichnung, gueltig] = zeile.split(";").map((f) => f.replace(/^"|"$/g, ""));
  if (!kennziffer || !bezeichnung || gueltig !== "J") continue;
  if (kennziffer.length !== 4) continue;
  // Reine Systematik-Platzhalter ohne Berufsbezug helfen bei der Eingabe nicht.
  if (bezeichnung.startsWith("Systematikebene")) continue;
  eintraege.push({ kennziffer, name: SONDERFAELLE[kennziffer] ?? lesbar(bezeichnung) });
}

const uebrigeAbk = eintraege.filter((e) => /[a-zäöüß]\.(\s|$|,|\))/i.test(e.name));
if (uebrigeAbk.length > 0) {
  console.error("Nicht aufgelöste Abkürzungen — ABKUERZUNGEN ergänzen:");
  for (const e of uebrigeAbk) console.error(`  ${e.kennziffer}  ${e.name}`);
  process.exit(1);
}

const nachName = new Map<string, string[]>();
for (const e of eintraege) {
  const liste = nachName.get(e.name) ?? [];
  liste.push(e.kennziffer);
  nachName.set(e.name, liste);
}
const doppelte = [...nachName].filter(([, k]) => k.length > 1);
if (doppelte.length > 0) {
  console.error("Doppelte Bezeichnungen nach dem Aufräumen:");
  for (const [name, k] of doppelte) console.error(`  ${k.join(", ")}  ${name}`);
  process.exit(1);
}

if (eintraege.length < 650) {
  throw new Error(`Nur ${eintraege.length} Berufsuntergruppen gefunden — Quelldatei geändert?`);
}

const namen = eintraege.map((e) => e.name).sort((a, b) => a.localeCompare(b, "de"));

const datei = `/**
 * Berufsbezeichnungen als Vorschlagsliste für die Zusatzqualifikationen einer
 * Person (Ebene der Berufsuntergruppen der KldB 2010, ${namen.length} Einträge).
 *
 * GENERIERT — nicht von Hand bearbeiten.
 * Quelle: Klassifikation der Berufe 2010 der Bundesagentur für Arbeit,
 * scripts/quellen/kldb-2010-berufe.csv.
 * Neu erzeugen mit:  npx tsx scripts/berufe-vokabular.mts
 *
 * Bewusst nur Strings, keine Codes: ein Beruf wandert als Freitext in den Bogen.
 * Die Liste ist reine Tipphilfe — eigene Eingaben bleiben immer möglich —, und
 * so bleibt das QR-Format unberührt (kein Schema-Sprung, alte Bögen lesbar).
 */

export const BERUFE: readonly string[] = [
${namen.map((n) => `  ${JSON.stringify(n)},`).join("\n")}
];
`;

writeFileSync(ZIEL, datei);
console.log(`${namen.length} Berufsbezeichnungen → ${ZIEL}`);
