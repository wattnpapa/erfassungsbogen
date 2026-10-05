/**
 * Der leere Erfassungsbogen als PDF-Bytes — gemeinsamer Kern von
 * `npm run blanko-pdf` (schreibt public/downloads/…) und dem Wächtertest
 * blanko-vordruck.test.ts, der die ausgelieferte Datei gegen diesen Generator
 * prüft.
 *
 * Der Wächter ist nötig, weil die Datei bewusst im Repo liegt (direkt
 * verlinkbarer Download, auch ohne laufende App) und nicht im Build entsteht:
 * Nach R2-A6 stand die Stärke-Legende im Generator, aber nicht in der
 * ausgelieferten Datei — niemand hatte das Skript aufgerufen (Audit Runde 3,
 * R3-A4).
 *
 * Damit Datei und Generator byte-genau vergleichbar sind, ist die Ausgabe
 * deterministisch: das Erstelldatum wird übergeben (auf ganze Sekunden, wie
 * es in der PDF steht), und davon hängt auch die Datei-ID ab, die pdfkit aus
 * den Metadaten bildet. Der Test liest das Datum aus der ausgelieferten Datei
 * und erzeugt mit genau diesem Datum neu.
 */

import {
  Erfassungsbogen,
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
} from "@bos/eeb-format/model";
import { pdfDokument, type BlankoZeilen } from "../src/app/pdf-dokument";
import { pdfBytes } from "./pdf-in-node";

/** Pfad relativ zur Repo-Wurzel. */
export const BLANKO_DATEI = "public/downloads/einheiten-erfassungsbogen-blanko.pdf";

/**
 * Zeilenzahl des Vordrucks. Die Fahrzeug- und Personalzeilen füllen zusammen
 * genau zwei Seiten; mehr Personalzeilen würden eine dritte, fast leere Seite
 * anfangen — ein Vordruck, den man in zweifacher Ausfertigung kopiert, soll
 * kein Papier verschwenden.
 */
export const BLANKO_ZEILEN: BlankoZeilen = { fahrzeuge: 4, personal: 36, qualifikationen: 6 };

/**
 * Bogen ganz ohne Inhalt. `OrganisationsTyp.SONSTIGE` ist hier kein Notbehelf,
 * sondern die richtige Angabe: der Vordruck gehört keiner Organisation und
 * bekommt dadurch den neutralen grauen Kopfbalken statt einer fremden Kennfarbe.
 * Die Hierarchie-Ebenen tragen bewusst generische Bezeichnungen — welche Ebenen
 * eine Organisation kennt (OV/RB/LV, Gemeinde/Kreis, KV/LV …), entscheidet sich
 * erst beim Ausfüllen.
 */
function leererBogen(): Erfassungsbogen {
  const ebene = (bezeichnung: string) => ({
    bezeichnung: { freitext: bezeichnung },
    name: "",
    // Leerstring statt undefined: das Layout setzt für fehlende Angaben ein
    // „—" ein, und ein Gedankenstrich ist auf einem Vordruck keine Leerstelle.
    telefon: "",
    email: "",
  });
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 0, // im Vordruck nicht gedruckt (die Fußzeile bleibt zum Eintragen leer)
    einheit: {
      organisation: OrganisationsTyp.SONSTIGE,
      einheitsTyp: { freitext: "" },
      hierarchie: [ebene("Einheit / Standort"), ebene("übergeordnete Ebene")],
    },
    einsatz: { zeitraumVon: 0, zeitraumBis: 0, ortAuftrag: "" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [],
    fahrzeuge: [],
    // Der Sofortbedarf gehört zum Papierbogen; im Vordruck werden aus allen
    // Zahlen Ausfülllinien und aus allen Haken leere Kästchen.
    sofortbedarf: {
      verpflegungPersonen: 0,
      dieselLiter: 0,
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: false,
      ruhezeitErforderlich: false,
    },
    // Leerzeilen unter der Überschrift „Sonstiges" — ohne Inhalt entfiele die
    // Zeile ganz, und damit das Feld für Besonderheiten.
    sonstiges: "\n\n\n",
  };
}

/** Der Vordruck mit dem angegebenen Erstelldatum (Millisekunden werden verworfen). */
export async function blankoVordruck(erstellt: Date): Promise<Buffer> {
  const sekunden = new Date(Math.floor(erstellt.getTime() / 1000) * 1000);
  const dd = pdfDokument(leererBogen(), null, BLANKO_ZEILEN);
  return pdfBytes({
    ...dd,
    // Dokument-Metadaten: was Betriebssystem-Vorschau, PDF-Leser und
    // Suchmaschinen als Titel der Datei anzeigen.
    info: {
      title: "Einheiten-Erfassungsbogen — Blanko-Vordruck",
      author: "Johannes Rudolph",
      subject:
        "Leerer Einheiten-Erfassungsbogen zum Ausdrucken: Stärkemeldung, Fahrzeuge, Personal und Sofortbedarf einer Einheit.",
      keywords:
        "Erfassungsbogen, Einheiten-Erfassungsbogen, Blanko, Vordruck, Stärkemeldung, Meldekopf, THW, Feuerwehr, Katastrophenschutz, BOS",
      creator: "erfassungsbogen.app",
      creationDate: sekunden,
    },
  });
}

/**
 * Erstelldatum aus einer von pdfkit geschriebenen PDF. pdfkit legt den Wert
 * als eigenes Objekt ab („/CreationDate 31 0 R" … „31 0 obj (D:20260815153501Z)").
 */
export function erstelldatumAusPdf(pdf: Uint8Array): Date | null {
  const text = Buffer.from(pdf).toString("latin1");
  const ref = /\/CreationDate (\d+) 0 R/.exec(text);
  const roh = ref
    ? new RegExp(`(?:^|\\n)${ref[1]} 0 obj\\s*\\((D:[^)]*)\\)`).exec(text)?.[1]
    : /\/CreationDate \((D:[^)]*)\)/.exec(text)?.[1];
  const m = roh && /^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(roh);
  if (!m) return null;
  const [j, mo, t, h, mi, s] = m.slice(1).map(Number) as [number, number, number, number, number, number];
  return new Date(Date.UTC(j, mo - 1, t, h, mi, s));
}
