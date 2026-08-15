/**
 * Erzeugt den leeren Erfassungsbogen als statisch abrufbare Datei
 * public/downloads/einheiten-erfassungsbogen-blanko.pdf — den Vordruck zum
 * Ausdrucken und Ausfüllen mit der Hand (Fahrzeugmappe, Reserve im Meldekopf,
 * Ausfall der Technik).
 *
 * Aufruf (Node ≥ 22): npm run blanko-pdf
 *
 * Die Datei liegt bewusst im Repo statt beim Aufruf erzeugt zu werden: sie ist
 * ein direkt verlinkbarer Download, der ohne laufende App funktionieren muss.
 * Damit sie nicht still vom Layout wegdriftet, entsteht sie ausschließlich über
 * dieses Skript aus derselben DocDefinition wie jede andere Bogen-PDF
 * (src/app/pdf-dokument.ts) — nach einer Layout-Änderung genügt ein erneuter
 * Aufruf.
 *
 * Warum nicht der Browser-Weg aus src/app/pdf.ts: dort registriert pdfmake die
 * Helvetica-Metriken von Hand ins virtuelle Dateisystem, weil der Browser-Build
 * sie nicht von Platte lesen kann. In Node liest pdfkit die Standardschriften
 * selbst — hier reicht die Zuordnung der vier Schnitte unten.
 */

import { mkdirSync } from "node:fs";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pdfMake from "pdfmake";
import {
  Erfassungsbogen,
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
} from "../src/model";
import { pdfDokument, type BlankoZeilen } from "../src/app/pdf-dokument";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const ZIEL = join(wurzel, "public", "downloads", "einheiten-erfassungsbogen-blanko.pdf");

/**
 * Zeilenzahl des Vordrucks. Die Fahrzeug- und Personalzeilen füllen zusammen
 * genau zwei Seiten; mehr Personalzeilen würden eine dritte, fast leere Seite
 * anfangen — ein Vordruck, den man in zweifacher Ausfertigung kopiert, soll
 * kein Papier verschwenden.
 */
const ZEILEN: BlankoZeilen = { fahrzeuge: 4, personal: 36, qualifikationen: 6 };

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

async function main(): Promise<void> {
  // Die vier Schnitte der PDF-Standardschrift Helvetica; pdfkit liefert die
  // Metriken in Node selbst mit (siehe Kopfkommentar).
  const schnitte = {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  };
  pdfMake.setFonts({ Helvetica: schnitte });
  // Der Vordruck besteht ausschließlich aus eingebautem Inhalt: keine URL, und
  // von der Platte nur die vier Schriftschnitte. Beides zunageln, statt pdfmake
  // blind auf Netz und Dateisystem zugreifen zu lassen.
  pdfMake.setUrlAccessPolicy(() => false);
  const erlaubt = new Set(Object.values(schnitte));
  pdfMake.setLocalAccessPolicy((pfad) => erlaubt.has(pfad));

  const dd = pdfDokument(leererBogen(), null, ZEILEN);
  mkdirSync(dirname(ZIEL), { recursive: true });
  await pdfMake
    .createPdf({
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
      },
    })
    .write(ZIEL);

  console.log(`${ZIEL} — ${(statSync(ZIEL).size / 1024).toFixed(1)} kB`);
}

await main();
