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

/**
 * Ein Satz je Monat über den Einträgen: Wer nach Wochen zurückkommt, liest zuerst
 * das Wichtigste und blättert nur bei Bedarf in die Tage. Schlüssel JJJJ-MM; jeder
 * Monat mit Einträgen braucht einen Satz (Test in fusszeile.test.tsx).
 */
export const MONATE: Readonly<Record<string, string>> = {
  "2026-11":
    "Rückmeldungen aus der Erprobung (FAG THW, OV Chemnitz): Stärke als 0 / 2 / 9 // 11, PDF im Raster der THW-Word-Vorlage mit THW-Logo und gezeichneten Kästchen, Fachzug Logistik nach StAN mit einzeln meldbaren Trupps, Ladungsträger wie Abrollbehälter, Funkrufname als Erreichbarkeit, Import ausgefüllter THW-Word-Bögen und dieser Änderungsverlauf. Die Excel-Liste „Oldenburg“ entfällt.",
  "2026-10":
    "Viele Prüfrunden aus Sicht von Helfern, Führungskräften und Meldekopf: sicherere Bedienung, Lagemonitor für den Bildschirm im Führungsfahrzeug, Dienststelle und Beruf je Person, USB-Handscanner überall, Einsatzzeitraum mit Uhrzeit und ein schnellerer Start.",
  "2026-09":
    "Zuverlässiger einlesen und scannen: PDF-Vorschau repariert, Bögen aus PDF und Bildern laden, gröbere QR-Codes. Dazu Sitzplätze je Fahrzeug, Datenschutzfrist, Rückfragen vor dem Löschen und eine Erinnerung an die Datensicherung.",
  "2026-08":
    "Werkzeuge für den Meldekopf: Suche nach Qualifikation, CSV-Export, USB-Handscanner, Züge aufteilen und zusammenführen. Die Startseite fragt zuerst, was man vorhat; Anzeige für Feld und Nacht; Beispielbögen aus fast allen Bundesländern.",
  "2026-07":
    "Vom ersten Entwurf zur Grundausstattung: Assistent, PDF im Papier-Layout, Übergabe per QR-Code, Vorlagen, Einsatz-Sammlung für den Meldekopf, Offline-Betrieb, Echtheits-Siegel, Datensicherung und Dauerscan.",
};

export const AENDERUNGEN: readonly Aenderung[] = [
  {
    datum: "2026-11-09",
    punkte: [
      "Ausgefüllte THW-Word-Erfassungsbögen (.docx aus den Vorlagen 06-…_Erfassungsbogen) lassen sich über „Aus Datei laden…“ und „Bögen einlesen…“ übernehmen. Was keinem Feld zuzuordnen ist (etwa Fax, Zahl der Vegetarier), steht unter „Sonstiges“; eine Quittung nennt, was übernommen und was weggelassen wurde.",
      "PDF im Raster der THW-Word-Vorlage: gleiche Rahmen, Linien, Spaltenkanten, Zeilenhöhen und Seitenränder, Schrift 10 pt. Fahrzeuge und Sofortbedarf schließen wie auf dem Papierbogen direkt aneinander an.",
      "Titelzeile im PDF wie in der Vorlage: links das Kurzzeichen der Einheit, in der Mitte der Titel auf der Kennfarbe, rechts beim THW das THW-Logo, bei allen anderen der Name der Organisation. THW-Bögen tragen das Blau der Vorlage.",
      "Ankreuzkästchen im PDF sind gezeichnete Quadrate wie in Word, angekreuzt mit einem X, statt „[X]“ als Text.",
      "Personen-, Fahrzeug- und Qualifikationstabellen bleiben so lang wie nötig; der Kopf der Personentabelle steht auf jeder Seite.",
      "Blanko-Vordruck: 25 Personalzeilen statt 29, damit er bei den höheren Zeilen der Vorlage auf zwei Seiten bleibt.",
      "Kleine Bögen tragen den QR-Code jetzt öfter auf Seite 2, weil das Formular im Raster der Vorlage mehr Platz braucht.",
    ],
  },
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
      "Die Beispielbögen haben einen eigenen Abschnitt auf der Startseite unter „So funktioniert’s“; der Link in der Fußzeile entfällt.",
      "Beispielbögen-Dialog aufgeräumt: Organisationen und Themen als Verzeichnis mit Bogenzahl, ein Pfad mit Zurück-Knopf, die drei Knöpfe je Bogen in einer Zeile.",
      "Beispielbögen nacheinander ansehen: Ein unverändertes Beispiel wird ohne Rückfrage ersetzt oder geschlossen und verdrängt den eigenen Bogen nicht mehr vom Platz „Zuletzt geschlossener Bogen“.",
      "Beispielbögen: „Alle … in eine Übungs-Sammlung“ legt einen ganzen Ordner auf einmal in eine neue Sammlung der Art „Übung“, mit Sammel-PDF und Lageblatt.",
      "Beispielbögen: Wer den Dialog während des Ladens schließt, bekommt den Bogen oder die PDF nicht mehr nachträglich.",
      "Offline: Die Startseite nennt die Ausnahme, die Bögen der THW-Ortsverbände kommen nur mit Netz; geöffnete bleiben in einem eigenen Speicher und verdrängen die übrigen Beispiele nicht mehr.",
      "Beispielbögen Praktische Ausbildung Hannover: Zugtrupp, 1. und 2. Sanitätsgruppe und Betreuungsgruppe des 2. Einsatzzugs sind eigene Einheiten.",
      "Beispielbögen: Suche nach Ort, OV oder Einheit über alle Ordner; der Dialog öffnet wieder im zuletzt offenen Ordner; Escape und die Zurück-Geste gehen eine Ebene hoch.",
      "Beispielbögen: Pfadleiste bleibt beim Rollen oben stehen, ein neuer Ordner beginnt oben; Karten statt Tabelle, sobald der Dialog schmal ist (auch quer und am Tablet); beim Nachladen springt die Liste nicht mehr.",
      "Übungsbögen: Rückfrage, bevor einer in eine Sammlung der Art „Einsatz“ kommt; eine neue Sammlung für einen Übungsbogen schlägt die Art „Übung“ vor; Startseite und Vorlagen zeigen „ÜBUNG“ bzw. „BEISPIEL“.",
      "Beispielbögen tragen beim Anzeigen, als PDF und als Link das heutige Datum; die PDF heißt „uebung-beispiel-…“, trägt „ÜBUNG“ in der Fußzeile jeder Seite und ein kräftigeres Wasserzeichen.",
      "Ein per Link empfangener Übungsbogen zeigt „Bogen übergeben…“ vorn — zum Melden am Meldekopf.",
      "Beispielbögen: Ländernamen ausgeschrieben, fehlende Länder genannt, „Erneut laden“ ohne Netz, feste Dialoghöhe.",
      "Beispielbögen: Die Suche findet Einheiten („Bergungsgruppe Oldenburg“) und zeigt Ortsverbände als eigene Treffer; „‹ Zur Suche“ führt zur Trefferliste zurück.",
      "Beispielbögen: „Alle … in eine Übungs-Sammlung“ fragt vorher, legt keine zweite gleichnamige Sammlung ohne Nachfrage an und führt den Zug mit (zwei Technische Züge eines OV bleiben getrennt).",
      "Beispielbögen: Pfadleiste immer einzeilig; ein angesehenes Beispiel verdrängt den eigenen Bogen auch nach dem Neuladen nicht; ohne Netz ein Hinweis statt einer Fehlerseite.",
      "Beispielbögen für Übungen: Unter THW › „Alle Einheiten aller Ortsverbände“ steht jede Einheit jedes Ortsverbands als Übungsbogen in StAN-Stärke, gegliedert nach Landesverband, Regionalstelle und Ortsverband (alle Namen erfunden). Ein Bogen wird beim ersten Öffnen geladen.",
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
      "Die App startet schneller, besonders bei schwachem Netz; offline funktioniert weiterhin alles.",
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
      "Die PDF-Vorschau blieb in einigen Browsern leer; behoben.",
      "Bogen aus einer PDF laden, notfalls über den QR-Code auf der PDF; ganze Ordner mit QR-Bildern auf einmal einlesen.",
      "Ein gemeinsamer Knopf zum Einlesen von Datei, PDF, Bild oder Link.",
    ],
  },
  {
    datum: "2026-09-05",
    punkte: [
      "QR-Codes sind gröber und lassen sich zuverlässiger scannen, auch vom Handydisplay; große Bögen verteilen sich dafür auf mehr Codes.",
      "Die PDF lässt sich auch offline erzeugen.",
    ],
  },
  {
    datum: "2026-08-31",
    punkte: [
      "QR-Scanner: Wo die Hauptkamera nicht mehr scharf stellt, liest er Codes auch aus kurzer Entfernung.",
      "Berufsvorschläge aus BERUFENET der Bundesagentur für Arbeit.",
    ],
  },
  {
    datum: "2026-08-29",
    punkte: [
      "USB-Handscanner: Die Anleitung zeigt Codes zum Einrichten und zum Zurücksetzen; eine verdrehte Tastaturbelegung des Scanners rechnet die App zurück.",
      "Ohne Kamera zeigt der Scanner den Stand eines mehrteiligen Bogens und nennt, warum ein Code nicht gelesen wurde.",
    ],
  },
  {
    datum: "2026-08-19",
    punkte: ["Der Dateiname der PDF trägt die Zeitgruppe des Stands (z. B. 191430aug26)."],
  },
  {
    datum: "2026-08-16",
    punkte: [
      "Themenseiten für Katastrophenschutz, Feuerwehr, Bundeswehr und die THW-Fachgruppen, mit anklickbarer Deutschlandkarte.",
      "Der erklärende Text auf der Startseite erscheint nur noch beim ersten Aufruf im Browser.",
    ],
  },
  {
    datum: "2026-08-15",
    punkte: ["Beispielbögen für DRK-Sanitätsdienst, ASB, Bundeswehr in der Amtshilfe und Pionierzüge."],
  },
  {
    datum: "2026-08-14",
    punkte: [
      "Beispielbögen des Katastrophenschutzes aus Baden-Württemberg, Rheinland-Pfalz, Mecklenburg-Vorpommern, Hessen, Bayern, Berlin, Nordrhein-Westfalen und dem Saarland sowie der Medizinischen Task Force des BBK.",
    ],
  },
  {
    datum: "2026-08-07",
    punkte: [
      "Tippziele für Handschuhe bemessen; im Querformat im Fahrzeug liegt der Weiter-Knopf nicht mehr unter der Leiste.",
      "Das PDF trägt oben die Zeile für den Meldekopf (Nr., eingegangen, übertragen) wie der Papiervordruck.",
    ],
  },
  {
    datum: "2026-08-06",
    punkte: [
      "Die Startseite fragt zuerst, was man vorhat: einen Bogen ausfüllen oder Bögen sammeln.",
      "Der Einheitstyp lässt sich tippen und aus Vorschlägen wählen.",
      "MzKW und MzGW in der THW-Fahrzeugauswahl; FGr N, FGr SB (B) und FGr BrB haben ihren MzGW in der Vorbelegung.",
      "Beim Scannen mehrteiliger Codes zeigt eine Kästchenzeile, welcher Teil noch fehlt.",
      "Eingegangene Einheiten, geänderte Stärken und neue Dialoge sind kurz hervorgehoben, damit man sieht, was sich getan hat.",
    ],
  },
  {
    datum: "2026-08-05",
    punkte: [
      "Einheitenliste als Excel-Datei im Format „Oldenburg“ (am 03.11.2026 wieder entfernt, siehe dort).",
      "USB-Handscanner am PC: Die Scan-Ansicht nimmt Codes auch über die Tastatur an.",
      "Fehlende Kraftfahrer für die Fahrzeuge einer Einheit fallen auf.",
    ],
  },
  {
    datum: "2026-08-04",
    punkte: [
      "Der Meldekopf findet Einsatzkräfte nach Qualifikation, etwa alle Kraftfahrer CE.",
      "Ein Bogen und ein ganzer Einsatz lassen sich als CSV-Datei für Excel herausgeben.",
      "Taktische Zeichen aus der Sammlung von jonas-koeritz (DV 102).",
      "Funktionen und Berufe schlagen sich beim Tippen selbst vor; Auswahllisten stehen im Alphabet.",
      "Anzeige wählbar: Standard, Feld (kräftiger Kontrast), Dunkel und Nacht.",
    ],
  },
  {
    datum: "2026-08-01",
    punkte: [
      "Der Bogen rechnet nach, ob alle einen Sitzplatz haben.",
      "Auseinandergerissene Züge lassen sich am Meldekopf aufteilen und wieder zusammenführen.",
      "Die Sammel-PDF nennt auch den Verpflegungsbedarf.",
      "Weitergabe per AirDrop und Quick Share ans Nachbargerät.",
      "Der Scanner sagt, wo die Kamerafreigabe hängt; die Windows-App auf ARM-Geräten findet ihre Kamera.",
    ],
  },
  {
    datum: "2026-07-31",
    punkte: [
      "Eingefügte Namenslisten füllen zuerst die leeren Plätze der Vorlage.",
      "Die Ebene (OV, Regionalstelle, Landesverband …) ist eine Auswahl statt eines Freitexts.",
      "Beispielbögen der Feuerwehren in Niedersachsen.",
    ],
  },
  {
    datum: "2026-07-30",
    punkte: [
      "Übungsbögen sind als solche gekennzeichnet, im Bogen, im PDF (Wasserzeichen) und in der Sammlung, und zählen nicht in die Lage.",
      "Der Stand eines Bogens trägt die Uhrzeit, als Zeitgruppe wie im Funk.",
    ],
  },
  {
    datum: "2026-07-29",
    punkte: ["Der Teilen-Link wird in Chat-Programmen vollständig als Link erkannt."],
  },
  {
    datum: "2026-07-28",
    punkte: ["Die App startet schneller: Was nur die PDF braucht, wird erst dann geladen."],
  },
  {
    datum: "2026-07-26",
    punkte: [
      "Einheitenliste am Meldekopf durchsuchen und sortieren.",
      "Folgemeldungen zeigen, was sich seit der letzten Meldung derselben Einheit geändert hat.",
      "Kleinere QR-Codes durch eine dichtere Kodierung.",
      "Ein weitergereichter Bogen behält das Echtheits-Siegel seines Ursprungs.",
      "Bedienung auch mit der Tastatur.",
    ],
  },
  {
    datum: "2026-07-25",
    punkte: [
      "Neues Erscheinungsbild der Oberfläche; die Fußzeile ist nach Zweck gegliedert.",
      "Beispielbögen als Tabelle mit Einheit und Herkunft, zum Anzeigen oder als PDF.",
      "„Alle Daten löschen“ nennt vorher, was gelöscht wird.",
      "Ein gescannter Bogen lässt sich aus der Übersicht direkt in eine Sammlung legen.",
    ],
  },
  {
    datum: "2026-07-24",
    punkte: [
      "Gemeldete Einheiten lassen sich am Meldekopf im Detail einsehen.",
      "Bogen als Link teilen, mit demselben Inhalt wie der QR-Code.",
      "Landesvorlagen der Bundesländer als Vorbelegung in Schritt 1.",
      "Die Farbe der Oberfläche folgt der Organisation des Bogens.",
      "Dauerscan am Meldekopf: Die Kamera bleibt an, jeder angenommene Bogen piept und zählt mit.",
      "Nachtmodus, Schnelleingabe für Namen und Übergeben-Dialog.",
      "Die Sammel-PDF trägt die komplette Einsatz-Sammlung, für die Schichtübergabe in einer Datei.",
    ],
  },
  {
    datum: "2026-07-18",
    punkte: [
      "Ein gemeinsames Feld für das Kennzeichen statt des THW-Sonderformats.",
      "Der Name der Einheit ergibt sich aus Organisation, Ort und Einheitstyp, statt doppelt erfasst zu werden.",
      "Der Kopf der PDF trägt die Kennfarbe der Organisation.",
      "QR-Code aus einem Foto oder Bildschirmfoto einlesen, direkt im Scanner.",
      "Beispielbögen des Katastrophenschutzes in Sachsen, Brandenburg und Thüringen.",
      "Zählung der Aufrufe über GoatCounter, beschrieben in der Datenschutzerklärung.",
    ],
  },
  {
    datum: "2026-07-17",
    punkte: [
      "Die PDF ist an die THWin-Vorlage angeglichen: Farben, Schrift, Ränder.",
      "Beispielbögen der DLRG und des Katastrophenschutzes in Niedersachsen.",
    ],
  },
  {
    datum: "2026-07-15",
    punkte: [
      "Datensicherung aller Daten in einer Datei, zum Einspielen auf einem anderen Gerät.",
      "Feld-Modus mit kräftigem Kontrast für draußen.",
      "Der angefangene Bogen speichert sich laufend selbst.",
      "QR-Code im Vollbild zum Vorzeigen.",
      "Hinweise auf fehlende Angaben; gelöschte Bögen landen erst im Papierkorb.",
    ],
  },
  {
    datum: "2026-07-14",
    punkte: [
      "Regionalstelle und Landesverband werden mit Kontaktdaten zum Ortsverband vorgeschlagen.",
      "100 Beispielbögen von THW-Einheiten aus ganz Deutschland, unten in der Fußzeile.",
    ],
  },
  {
    datum: "2026-07-13",
    punkte: [
      "Die Web-App funktioniert nach dem ersten Aufruf auch ohne Netz.",
      "Große Bögen verteilen sich auf mehrere QR-Codes; der Assistent zeigt den Fortschritt der Schritte.",
      "Echtheits-Siegel: Jeder Bogen wird mit einem Schlüssel des Geräts signiert.",
      "CSV-Export der Einsatz-Sammlung für die Führungsstelle.",
    ],
  },
  {
    datum: "2026-07-12",
    punkte: [
      "Vorlagen: einen Bogen als Vorlage speichern, vor dem Einsatz mustern (wer fehlt, wird gestrichen) und per QR-Code teilen.",
      "Einsatz-Sammlung für Meldekopf und Zugführer: Bögen sammeln, Stärke und Bedarf zusammenzählen, Zwischensummen je Zug, Sammel-PDF, Export und Import als Datei.",
      "Die PDF enthält die Daten des Bogens, sodass sie sich wieder einlesen lässt; unter dem QR-Code steht ein anklickbarer Link.",
      "Taktische Zeichen je Fahrzeug im PDF; Funkrufnamen nach der THW-Taschenkarte in der Vorbelegung.",
      "Ein Bogen-Link öffnet direkt die App, wenn sie installiert ist.",
    ],
  },
  {
    datum: "2026-07-11",
    punkte: [
      "Erste Fassung: Assistent in Schritten, PDF im Papier-Layout des Erfassungsbogens, Übergabe per QR-Code ohne Netz.",
      "Fahrzeuge werden nach StAN zum gewählten Einheitstyp vorbelegt; Hinweise auf unplausible Angaben.",
      "Kürzel des Ortsverbands mit Vorschlägen aus dem OV-Verzeichnis.",
      "Neben der Web-App gibt es Apps für Android, Windows und Linux; QR-Scanner in der App und im Browser.",
    ],
  },
];
