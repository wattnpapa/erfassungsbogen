/**
 * Änderungsverlauf für Nutzerinnen und Nutzer („Was ist neu"), aufrufbar über
 * die Versionsnummer in der Fußzeile. Wunsch aus der Erprobung (OV Chemnitz,
 * 11/2026): Wer die App im September getestet hat, soll nachlesen können, was
 * seither anders ist, ohne die Commit-Liste auf GitHub zu lesen.
 *
 * Gepflegt von Hand, neueste Einträge oben. Nur, was man in der App oder auf
 * dem Papier bemerkt; Technik (Abhängigkeiten, Tests, Prüfberichte) bleibt
 * draußen. Ein Eintrag je Tag, Datum als ISO-Datum.
 */

export interface Aenderung {
  /** Tag der Änderung, ISO (JJJJ-MM-TT). */
  datum: string;
  punkte: readonly string[];
}

export const AENDERUNGEN: readonly Aenderung[] = [
  {
    datum: "2026-11-08",
    punkte: [
      "Stärke überall in der Schreibweise 0 / 2 / 9 // 11: die Gesamtstärke ist mit // abgesetzt.",
      "PDF: Fahrzeuge ohne eigene Sitzplatzangabe tragen den Richtwert ihres Typs, gekennzeichnet als „(Richtwert)“.",
      "PDF und Übersicht: Beim Sofortbedarf steht nur, was angefordert ist, keine Zeilen mit 0.",
      "Personalliste: Die Erreichbarkeit steht unter bzw. hinter dem Namen statt in einer eigenen Spalte; die Funktionen bekommen die Breite.",
      "Fachzug Logistik nach StAN 09-04 bis 09-07 (Stand 01.07.2026): Die Trupps der FGr Log-MW (Tr Log-M, Tr Log-VG, Tr Log-TL) sind eigene Einheitstypen mit Stärke, Fahrzeugen und Zeichen; die Fachgruppe als Ganzes belegt alle drei vor.",
      "Fahrzeuge im Fachzug Logistik: LKW K Lkr (Heros 63/63), Werkstattcontainer, Abrollbehälter Kraftstoff, Anh 5t Tandem und Anh FGr Log-MW (FGr Log-MW); Anh 12t Koffer und Anh Kühl (FGr Log-V); Auflieger Plane/Spriegel und Auflieger Container (Tr Log-TS).",
      "Abrollbehälter, Wechselbrücke und Container (10 ft, 20 ft) lassen sich als eigene Zeile angeben, mit taktischem Zeichen.",
      "Schnellerfassung „Nur Stärke“: Ein anderer Einheitstyp ersetzt die Sollzahlen, solange niemand gezählt hat.",
      "Weitergabe per Link: Braucht der weitergereichte Bogen einen QR-Code mehr als beim Absender, sagt die Übersicht warum (die Gegenzeichnung dieses Geräts reist mit).",
      "Dieser Änderungsverlauf ist über die Versionsnummer in der Fußzeile erreichbar.",
    ],
  },
  {
    datum: "2026-11-03",
    punkte: [
      "Die Excel-Liste im Format „Oldenburg“ entfällt. Für Tabellen bleibt die CSV-Datei (öffnet in Excel und LibreOffice), die Gegenstelle übernimmt Bögen über den Link oder die PDF.",
    ],
  },
  {
    datum: "2026-11-02",
    punkte: ["Erreichbarkeit einer Person auch als Funkrufname („Funk: Heros Oldenburg 18/13-1“), ohne dienstlich/privat."],
  },
  {
    datum: "2026-10-29",
    punkte: ["Einsatzzeitraum mit Uhrzeit, vorbelegt mit 08:00 bis 18:00."],
  },
  {
    datum: "2026-10-28",
    punkte: [
      "Die App startet schneller: Das Startpaket ist etwa halb so groß, Zeichen und Einsatzansicht werden nachgeladen und liegen trotzdem offline vor.",
      "Die Einsatzansicht öffnet auch ohne Netz nach dem Neuladen.",
      "Bei vollem Speicher geht ein geschlossener oder ersetzter Bogen nicht mehr verloren.",
    ],
  },
  {
    datum: "2026-10-26",
    punkte: [
      "Dienststelle je Person (für Einheiten aus mehreren Ortsverbänden), vorbelegt mit der Dienststelle der Einheit; im PDF als „OV: …“ am Namen.",
      "Berufe in einem eigenen Feld unter den Qualifikationen.",
      "USB-Handscanner werden auf der ganzen Seite erkannt; im Scanner lässt sich zwischen Kamera und Handscanner wählen.",
      "Ein Tipp neben einen Funktions-Chip löscht die Funktion nicht mehr.",
    ],
  },
  {
    datum: "2026-10-25",
    punkte: [
      "Schritt 1: Das Pflichtfeld heißt „Ort der Einheit“.",
      "Zahlenfelder bleiben beim Leeren leer und melden, wenn ein Komma gerundet oder ein Minus abgelehnt wird.",
    ],
  },
  {
    datum: "2026-10-17",
    punkte: ["Lagemonitor: Lageanzeige der Sammlung für einen Bildschirm im Führungsfahrzeug."],
  },
  {
    datum: "2026-09-29",
    punkte: [
      "Die App bittet den Browser um dauerhaften Speicher und erinnert an die Datensicherung, solange Daten ungesichert sind.",
      "„Funktioniert offline“ steht erst da, wenn wirklich alles auf dem Gerät liegt.",
      "Schnellerfassung am Meldekopf überarbeitet; der Stand der letzten Übergabe steht auf Startseite und Übersicht.",
    ],
  },
  {
    datum: "2026-09-28",
    punkte: [
      "Ein Wechsel des Einheitstyps ersetzt die vorbelegten Personen und Fahrzeuge durch die des neuen Typs, statt sie zu addieren.",
      "Schritt 1 sagt an, was nach StAN vorbelegt ist, und bietet „Vorbelegung entfernen“.",
    ],
  },
  {
    datum: "2026-09-27",
    punkte: [
      "Meldekopf: nur die neuen Bögen seit dem letzten Export weitergeben.",
      "Gespeicherte Vorlagen lassen sich bearbeiten.",
    ],
  },
  {
    datum: "2026-09-24",
    punkte: ["PDF-Vorschau: Browser ohne eingebauten PDF-Betrachter (etwa Chrome auf Android) laden die Datei herunter, statt einen leeren Rahmen zu zeigen."],
  },
  {
    datum: "2026-09-23",
    punkte: ["Vorlagen per QR-Code, Link oder Datei direkt an der Vorlagen-Karte teilen."],
  },
  {
    datum: "2026-09-18",
    punkte: ["Löschen, Ersetzen und Verwerfen fragen nach und bieten „Rückgängig“."],
  },
  {
    datum: "2026-09-15",
    punkte: [
      "Sitzplätze je Fahrzeug erfassbar; die App warnt, wenn die Plätze nicht für die Stärke reichen.",
      "Personal per Pfeilknopf umsortieren; die erste Person ist die Ansprechperson.",
    ],
  },
  {
    datum: "2026-09-13",
    punkte: ["Datenschutzfrist: Ein Bogen mit Stand älter als 90 Tage kommt ohne Namen, Funktionen und Rufnummern an."],
  },
  {
    datum: "2026-09-09",
    punkte: [
      "Scannen am Meldekopf: Bei mehrteiligen Codes quittiert der Suchrahmen jeden angenommenen Teil; in der Liste leuchtet die Zeile der eben eingegangenen Einheit auf. Ton und Zähler je Bogen gab es schon vorher.",
    ],
  },
  {
    datum: "2026-09-06",
    punkte: [
      "PDF-Vorschau: Der Rahmen blieb in einigen Browsern leer (Sicherheitsregel blockte ihn); behoben.",
      "Bogen aus einer PDF laden, notfalls über den QR-Code auf der PDF; ganze Ordner mit QR-Bildern auf einmal einlesen.",
      "Ein Knopf für alles, was fertig hereinkommt (Datei, PDF, Bild, Link).",
    ],
  },
  {
    datum: "2026-09-05",
    punkte: [
      "Gröbere QR-Codes: weniger Daten je Code, dafür bei großen Bögen mehr Teile; sie lassen sich zuverlässiger scannen, auch vom Handydisplay.",
      "Die PDF lässt sich auch offline erzeugen.",
    ],
  },
];

