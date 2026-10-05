/**
 * Der leere Erfassungsbogen (Blanko-Vordruck) — gemeinsame Quelle für die
 * ausgelieferte Datei public/downloads/einheiten-erfassungsbogen-blanko.pdf
 * (scripts/blanko-vordruck.ts, `npm run blanko-pdf`) und den Knopf
 * „Blanko-Vordruck (Papier-Reserve)" in der App (pdf.ts). Die App erzeugt
 * den Vordruck selbst, statt die Datei zu laden: so geht es offline, in der
 * Desktop-App (file:) und im Teilen-Fenster der mobilen App gleich (Audit
 * Runde 3, R3-A7).
 */

import {
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  type Erfassungsbogen,
} from "@bos/eeb-format/model";
import type { BlankoZeilen } from "./pdf-dokument";

/** Dateiname des Vordrucks — gleich wie der Download auf der Website. */
export const BLANKO_DATEINAME = "einheiten-erfassungsbogen-blanko.pdf";

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
export function leererBogen(): Erfassungsbogen {
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

/** Dokument-Metadaten des Vordrucks (Titel in PDF-Lesern und Suchmaschinen). */
export const BLANKO_INFO = {
  title: "Einheiten-Erfassungsbogen — Blanko-Vordruck",
  author: "Johannes Rudolph",
  subject:
    "Leerer Einheiten-Erfassungsbogen zum Ausdrucken: Stärkemeldung, Fahrzeuge, Personal und Sofortbedarf einer Einheit.",
  keywords:
    "Erfassungsbogen, Einheiten-Erfassungsbogen, Blanko, Vordruck, Stärkemeldung, Meldekopf, THW, Feuerwehr, Katastrophenschutz, BOS",
  creator: "erfassungsbogen.app",
};
