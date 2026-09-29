# Rollenaudits, Runde 2 (Stand 28.09.2026)

Zweite Prüfrunde nach der Behebung der Befunde aus [Runde 1](../README.md).
Zwölf Prüfberichte, je einer pro Rolle, alle gegen den Produktionsbuild
(`vite build` + `vite preview`, Port 4173), Code-Stand Commit `354209b`,
Zweig `claude/adoring-sagan-9vnriv`. Jeder Prüfer hat zuerst ohne Kenntnis der
bisherigen Berichte getestet und danach im Abschnitt „Abgleich mit Runde 1"
festgehalten, welche Behebungen halten. Die Befunde anderer Runde-2-Berichte,
die ein Prüfer unabhängig nachgestellt hat, stehen dort nur als Verweis und
sind unten nicht doppelt gezählt.

Reine Prüfberichte ohne Codeänderung.

| Rolle | Bericht | Kennung | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- | --- | --- |
| Helfer ohne Einweisung | [neuer-nutzer.md](neuer-nutzer.md) | R2-N | 1 | 1 | 6 | 1 |
| Helfer im Feld | [feldtauglichkeit.md](feldtauglichkeit.md) | R2-H | 0 | 1 | 6 | 2 |
| Arbeitsablauf über mehrere Geräte | [arbeitsablauf.md](arbeitsablauf.md) | R2-W | 0 | 1 | 2 | 3 |
| Fehler und Wiederanlauf | [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md) | R2-E | 1 | 1 | 3 | 1 |
| Zerstörende Handlungen | [zerstoerende-handlungen.md](zerstoerende-handlungen.md) | R2-D | 0 | 1 | 4 | 1 |
| Offline und Speicher | [offline-und-speicher.md](offline-und-speicher.md) | R2-O | 0 | 2 | 4 | 1 |
| Stress und Unterbrechung | [stress-und-unterbrechung.md](stress-und-unterbrechung.md) | R2-S | 0 | 1 | 2 | 1 |
| Handschuh-Bedienung | [handschuh-bedienung.md](handschuh-bedienung.md) | R2-G | 0 | 1 | 3 | 1 |
| Nacht und Sicht | [nacht-und-sicht.md](nacht-und-sicht.md) | R2-L | 0 | 1 | 1 | 4 |
| Führungssicht | [fuehrungssicht.md](fuehrungssicht.md) | R2-K | 1 | 1 | 4 | 2 |
| Analog first | [analog-first.md](analog-first.md) | R2-A | 0 | 1 | 4 | 1 |
| Mobile-UI (allgemein) | [mobile-ui.md](mobile-ui.md) | R2-M | 0 | 1 | 3 | 4 |
| Summe | | | 3 | 13 | 42 | 22 |

## Berichtsübergreifende Reihenfolge

1. Eigener Bogen wird von einer fremden Erfassung verdrängt (R2-N1, R2-E1,
   R2-E3, R2-S2, Verweise in W, S, D). Wer auf demselben Gerät den eigenen
   Bogen führt und fremde Einheiten erfasst, verliert den eigenen Bogen.
   Das passiert über die Schnellerfassung auf der Startseite und ebenso über
   Abbrechen und Neubeginn in der Einsatzansicht. Die Rückfragen versprechen
   dabei, der Bogen bleibe erreichbar. Von vier Rollen unabhängig
   nachgestellt. Zwei P0.
2. Folgemeldung löscht Zug, Auftrag und Eintreffzeit (R2-K1, P0). Das
   passiert still, auf den Wegen „Bögen einlesen…" und „In Einsatz
   aufnehmen…".
3. Marke „alt" an jeder Meldung (R2-N4, bestätigt in W, S, K). `standIstAlt`
   in `src/app/einheiten-tabelle.ts` vergleicht Minuten seit 2020 mit
   Millisekunden. Deshalb fällt ein wirklich alter Bogen nicht mehr auf. Hängt
   mit R2-S1 zusammen: Ein 60 Tage alter Entwurf geht ohne Rückfrage in den
   QR-Code.
4. Sollplätze und Namen überschreiben sich gegenseitig (R2-N2, R2-D2, R2-E2,
   R2-W3). „Namen einfügen…" ersetzt GrFü/TrFü, „StAN-Sollplätze laden"
   löscht Namen, „Vorlage aktualisieren" macht beides dauerhaft. Außerdem
   zählen Soll-Stärke und Soll-Fahrzeuge in der Lage wie gemeldete Werte.
5. Quittungen und Meldungen außerhalb des Bildes (R2-H4, R2-G1, R2-G4, R2-A2,
   R2-L2, R2-O2). Das „Rückgängig" nach Abrücken oder Entfernen steht Tausende
   Pixel über der sichtbaren Stelle. Ein Doppeltipp bestätigt die folgende
   Rückfrage mit.
6. Exporte und Papier-Rückweg (R2-K2, R2-K3, R2-A1, R2-A3). Die Excel-Liste
   zählt abgerückte Einheiten mit. Das Lageblatt nennt den Bedarf nur als
   Summe. Gedruckte QR-Codes holen keine Zeiten und keine Abrückvermerke
   zurück.
7. Löschen einer Meldung mit Folgemeldung (R2-D1). Nur die neueste Fassung
   wird entfernt, die ältere zählt wieder mit. „Sicherung einspielen" ersetzt
   alle Sammlungen ohne Angebot einer Sicherung vorher (R2-D3).
8. Offline-Zusage vor fertigem Cache (R2-O1). Die Startseite meldet
   „Funktioniert komplett offline", bevor alle Dateien geladen sind.
9. Begleitseiten im Dunkel- und Nacht-Thema unlesbar (R2-L1). Kontrast
   1,01:1 auf allen 36 Seiten unter `public/`, vermutlich weil
   `scripts/content-stil.mts` die Textfarbe in den Themenblöcken hart setzt.
   Das ist die Kehrseite der Runde-1-Behebung N2.
10. Scrollposition und Rückwege (R2-H1, R2-H3, R2-H5, R2-M1 bis R2-M3).
    Schritte öffnen mitten im Formular, Zurück führt aus Schritt 1 aus der
    App, QR-Vollbild und Scanner sind nicht modal, und bei 200 % Schrift
    rutscht die Fußleiste aus dem Bild.

## Wie die Behebungen aus Runde 1 halten

Die Mehrzahl ist bestätigt: Scanner-Ausgang, Weitergabe der Sammlung mit
Abrückzeiten, Rückfragen vor Tabellen-Löschen und Organisationswechsel,
Zielgrößen im Formular, Themenwahl nach Systemeinstellung, Offline-Cache der
Beispielbögen, Stapel-Scan ohne Rückfrage. Nur teilweise wirken F2 (gilt nicht
für die Schnellerfassung auf der Startseite), D4 (Quittung außerhalb des
Bildes), E3 (Zurück aus Schritt 1), K1 bis K3 und K5 (Folgemeldung,
Exporte), A2/A5 (Eintreffzeit beim Einlesen, Kennungsabgleich) und O4
(Speicheranzeige). N2 hat sich ins Gegenteil verkehrt (R2-L1). Einzelheiten
stehen im Abschnitt „Abgleich mit Runde 1" des jeweiligen Berichts.

## Prüfaufbau

Wie in Runde 1: Playwright mit Chromium aus `/opt/pw-browsers/chromium`,
`isMobile`/`hasTouch`, Locale de-DE, Telefon 360 × 640 als Grundeinstellung.
Je nach Rolle kamen dazu: 640 × 360 quer, 320 × 568, 390 × 844, Tablet
820 × 1180 und Laptop 1366 × 768, mehrere Browser-Kontexte als getrennte Geräte,
`setOffline`, gedrosseltes Netz, Speicher-Quota-Stubs und 200 % Schriftgröße.
Lageblatt, Sammel-PDF, CSV und Excel wurden heruntergeladen und gegengelesen.
Nicht prüfbar: Kamera-Scan, Handscanner, Nahbereichs-Weitergabe, echte
Handschuhe, echtes Licht, Bildschirmtastatur, echtes Drucken, native Builds.

## Stand der Behebung

Stand 28.09.2026. Behoben sind die drei P0-Befunde. Geprüft wurde mit
Unit-Tests, Oberflächentests (`app.test.tsx`), den Cucumber-Szenarien, der
Typprüfung und einem Nachlauf der Audit-Abläufe im Produktionsbuild
(360 × 640 bzw. 820 × 1180).

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R2-N1 Schnellerfassung verdrängt eigenen Bogen | behoben | Erfassungen fremder Einheiten sind am Entwurf markiert (`Entwurf.fremd`) und dürfen einen eigenen Bogen nicht vom Rückholplatz verdrängen (`rueckholungNimmt`). Eine abgelegte Schnellerfassung wird geschlossen, die Quittung nennt, wo der eigene Bogen liegt. Die Rückfrage sagt, was verworfen wird oder endgültig verloren geht, und färbt den Knopf dann rot. Nachlauf: drei Schnellerfassungen, eine davon abgebrochen, „THW Ulm" blieb auf dem Rückholplatz. |
| R2-E1 Abgebrochene Einsatz-Erfassung verdrängt eigenen Bogen | behoben | „Einheit manuell erfassen…" fragt bei einer angefangenen Erfassung „fortsetzen" oder „verwerfen und neu"; verworfen wird nur die Erfassung. Nebenbei R2-E3: Die Ziel-Sammlung wandert mit dem Entwurf, nach dem Neuladen zeigt die Startseite „Angefangene Erfassung für ‚…'", und „Fortsetzen" führt zurück in die Erfassung mit „In Einsatz übernehmen". |
| R2-K1 Folgemeldung löscht Zug, Auftrag, Eintreffzeit | behoben | Alle Eingänge (Scan, Link, Dateien, Bilderstapel, „In Einsatz aufnehmen") laufen über `meldungAufnehmen`, das Eintreffzeit, Auftrag, Zug und Teil-Etikett der Vorgängerin vererbt. Vorher erbten nur Scan/Link und „In Einsatz aufnehmen", den Zug nie. Nachlauf: Folgemeldung per „Bögen einlesen…" hält „1. TZ", Auftrag und 22:07 auch nach Neuladen. |

### P1 (Stand 29.09.2026)

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R2-H1 Schritt öffnet mitten im Formular | behoben | Jeder Schrittwechsel beginnt oben, Fokus auf der Schrittüberschrift. Nachlauf 360 × 640, vorher auf 849 px gescrollt: Überschrift von Schritt 2–5 bei 328 px im Bild. |
| R2-G1 Doppeltipp bestätigt Rückfrage | behoben | Rückfragen nehmen 450 ms nach dem Öffnen keinen Zeiger-Klick an (Tastatur ausgenommen). „Person entfernen" quittiert mit „Rückgängig" an der Stelle der Karte. Die Quittung nach „Entfernen" einer Meldung steht weiter oben (R2-H4, offen). |
| R2-N2 Namen einfügen / Sollplätze laden | behoben | Namen füllen freie Sollplätze (Vorschau „→ Platz 1: GrFü"), vorangestelltes Kürzel wird Funktion; „StAN-Sollplätze laden" nennt die verlorenen Namen; beide mit „Rückgängig". |
| R2-E2 Sollstärke als Meldung | behoben | Rückfrage „Stärke nicht gezählt" vor dem Ablegen reiner Sollplätze; Karte trägt „Sollstärke, nicht gemeldet". |
| R2-W1 Sofortbedarf aus Vorlage | behoben | Musterung zeigt den Standard-Sofortbedarf als Kästchen, Vorgabe aus; übernommen folgt die Verpflegung der gemusterten Stärke. |
| R2-S1 Alter Entwurf als „plausibel" | behoben | Abgelaufener Zeitraum steht auf der Startseitenkarte, ist Prüfpunkt (kein „✓ plausibel"), und der Übergabe-Dialog bietet zuerst „Für neuen Einsatz vorbereiten". QR-Vollbild ohne Einheit und Stand bleibt (R2-O7, offen). |
| R2-O1 Offline-Zusage zu früh | behoben | Zusage erst bei aktivem Service Worker; vorher „Wird für den Offline-Betrieb geladen", ohne Netz „Noch nicht offline bereit"; Abschluss einmal quittiert. Nachlauf mit gedrosseltem Netz: Ladehinweis → „Jetzt offline bereit" → offline neu geladen erscheint die App. |
| R2-O2 Voller Speicher ohne Meldung | behoben | Auswahl beim Ablegen bleibt offen und zeigt den Grund; empfangener Bogen wird geöffnet statt verworfen; „Neue Einsatz-Sammlung" und „Als Vorlage speichern" melden im Dialog. Ungeprüft: weitere Schreibwege (etwa Datensicherung einspielen). |
| R2-D1 Entfernen lässt ältere Fassung zählen | behoben | „Entfernen" nimmt alle Fassungen der Einheit (Teil-Einheiten bleiben), „Rückgängig" bringt alle zurück; eigene Fassung lässt sich in der Historie verwerfen. |
| R2-K2 Excel-Liste zählt Abgerückte | behoben | SUBTOTAL nur über zählende Einheiten; Abgerückte, Aufgegangene und Übung in eigenem Block mit Grund und Abrückzeit; Auftrag der Führungsstelle in „Aufträge", Ort/Auftrag des Bogens in „Vorgesehener Auftrag", Eintreffzeit in „eingetr. / zugew.". „Rück-führung" bleibt der Führungsstelle. |
| R2-L1 Begleitseiten dunkel unlesbar | behoben | Ursache: Angleichregel in `scripts/content-stil.mts` galt auch für die Themenblöcke. 36 Seiten neu erzeugt, Generator-Test prüft Übereinstimmung und Kontrast. Nachlauf: in Dunkel, Nacht und System-dunkel kein Text unter 4,5:1 (niedrigster Wert 4,71:1). |
| R2-A1 Papier bringt Lage nicht zurück | teilweise | Ohne Formatwechsel: Kasten „Stand am Meldekopf" über jedem Bogen der Sammel-PDF und auf jeder QR-Seite, Hinweis, was der Code nicht enthält; Quittung beim Einlesen aus Bildern nennt das Nachtragen; eine Sammel-PDF-Datei verweist auf „Einsatz importieren…". Ein Code für die Lage selbst bräuchte einen Schemawechsel. |
| R2-M1 200 % Schrift | behoben | Umbruch statt `nowrap` an Stärke, Marken, Summenleiste, Vorschlagsfeld; Polster gedeckelt; Fußleiste einzeilig mit Obergrenzen; Assistenten-Kopf verdichtet sich per Container-Abfrage; Begleitseiten mit Umbruch-Block. Nachlauf 200 %: alle Ansichten auf 320/360/390/640 px gerätebreit, Fußleiste 75 px (vorher 179 px). |

### P2 (Stand 29.09.2026)

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R2-N3 Haken bei Sollplätzen | behoben | Reine Sollplätze und Fahrzeuge ohne Kennzeichen gelten als „begonnen"; Schrittleiste schreibt „offen" statt „•". |
| R2-N4 „alt" an jeder Karte | behoben | Bogen-Stand wird in Millisekunden umgerechnet; Stand lesbar („29.09.2026, 07:32"). Dateinamen und CSV-Spalte „Stand" unverändert. |
| R2-N5 Verpflegung 0 | behoben | Bedarfssummen aus der Stärke, unbekannte M/W/D-Aufteilung als „n ohne M/W/D-Angabe". |
| R2-N6 Schnellerfassung wie eigener Bogen | behoben | Zielsammlung zuerst, dann Marke, „‹ Einsatz" und „In Einsatz übernehmen"; „Weiter" direkt zur Stärke. |
| R2-N7 Rückwege | behoben | „‹ Einsätze" zur Startseite, „Fortsetzen" öffnet den zuletzt offenen Schritt, Knopf heißt „In Einsatz-Sammlung ablegen…". |
| R2-N8 Erstes Namensfeld tief | behoben | Sollstelle im Kartenkopf und als erste Tabellenspalte, Vorbelegungs-Knöpfe unter der Liste. |
| R2-H2 Offener Punkt ohne Cursor | behoben | Prüfpunkte tragen ihr Feld (Ort/Auftrag, Kennzeichen); Sprung rückt es in die Bildmitte und setzt den Cursor. Weitere Punkte ohne Feldziel springen weiter an den Schrittanfang. |
| R2-H3 Startseite nach Neuladen | behoben | Scrollposition wird nicht mehr vom Browser wiederhergestellt. |
| R2-H4 Quittung außerhalb des Bilds | behoben | Feste Quittungsleiste unten mit „Rückgängig" 108 × 44 px, gesperrt 600 ms gegen Doppeltipp. |
| R2-H5 Geräte-Zurück | behoben | Aus Schritt 1 zurück zur Startseite; im QR-Vollbild schließt Zurück nur das Vollbild. |
| R2-H6 Übergabeknöpfe unter dem Bild | behoben | Offene Punkte eingeklappt mit Anzahl über den Wegen. |
| R2-H7 Kopf zu hoch | in Arbeit | — |
| R2-E3 Neuladen in der Einsatz-Erfassung | behoben | mit den P0-Korrekturen: Ziel-Sammlung reist mit dem Entwurf. |
| R2-E4 Zahlendreher | behoben | Hinweise zu Rufnummer, E-Mail, Namen aus Ziffern, Sitzplätzen, doppeltem Kennzeichen, Zeitraum und Einsatzbeginn. Eintreff-/Abrückzeit in der Zukunft ohne Hinweis. |
| R2-E5 Programmtext bei Dateifehlern | behoben | Eigene Prüfung je Datei-Eingang mit Ursache und nächstem Schritt. |
| R2-W2 Übergabestand | behoben | Letzte Übergabe am Entwurf, Anzeige „seitdem unverändert" bzw. „geändert (Stärke … → …) — neu übergeben". |
| R2-W3 Soll-Fahrzeuge in der Schnellerfassung | behoben | Im Modus „nur Stärke" keine Fahrzeug-Vorbelegung. |
| R2-D2 Vorlage aktualisieren | behoben | Rückfrage mit Änderungen, danach „Rückgängig". |
| R2-D3 Sicherung einspielen | behoben | Datei vorher geprüft, Rückfrage nennt Sammlungen und Dateiinhalt, „Vorher Sicherung erstellen…", Haken bei laufenden Sammlungen. |
| R2-D4 Import holt Entferntes zurück | behoben | Entfernte Kennungen je Sammlung gemerkt (`eeb.entfernt.v1`), Import fragt. |
| R2-D5 Stille 90-Tage-Löschung | behoben | Startseite nennt die gelöschte Sammlung bis „Verstanden"; Ankündigung nennt die tatsächliche Ruhezeit. |
| R2-O3 „gespeichert" = Öffnungszeit | behoben | Zeit der letzten Änderung, mit Datum wenn nicht heute. |
| R2-O4 Zwei Fenster | behoben | Kein stilles Überschreiben; Warnung mit „Stand aus dem anderen Fenster laden" / „Meine Fassung behalten". |
| R2-O5 Link braucht Netz beim Empfänger | behoben | Hinweis am Link-Knopf. |
| R2-O6 Speicher nicht dauerhaft | behoben | `navigator.storage.persist` bei wertvollen Daten, Status und letzte Sicherung in der Datensicherung, Erinnerung nach drei Tagen. |
| R2-S2 Schneller und richtiger Weg | behoben | Siehe R2-N6; die Erfassung im Einsatz übernimmt den Modus der letzten Handerfassung. |
| R2-S3 Aufnahme-Knöpfe | behoben | Direkt unter der Stärkeleiste; nach der Aufnahme bleibt die Ansicht oben. |
| R2-G2 Tabelle schiebt Seite | behoben | Rollrahmen `position: relative`, Seite gerätebreit. |
| R2-G3 Kleine Ziele | in Arbeit | — |
| R2-G4 Abrücken-Doppeltipp | behoben | „Wieder anwesend" am selben Platz, Karte 600 ms gesperrt. |
| R2-M2 QR-Vollbild rollt nicht | behoben | `100dvh`, rollt, Knopfleiste klebt unten; quer zweispaltig. |
| R2-M3 Overlays nicht modal | behoben | QR-Vollbild und Scanner als modale Dialoge, Escape, Fokus zurück. |
| R2-M4 Karten ohne Struktur | behoben | Liste mit Überschriften, Knöpfe mit `aria-describedby` auf die Einheit. |
| R2-K3 Lageblatt | behoben | „von … auf …" statt Pfeil, Zug/Bedarf/Lücken je Einheit, bis etwa zwölf Einheiten eine Seite („A4 quer"). |
| R2-K4 Filter Sofortbedarf | behoben | Dringender Bedarf (Ruhezeit, Unterbringung, abweichende Verpflegung) hervorgehoben und als eigener Filter; Kraftstoff grau. |
| R2-K5 Tabelle | behoben | Neue Spaltenfolge, Einheitsspalte fixiert. Spalte „Lücken" nicht ergänzt. |
| R2-K6 Nachvollziehbarkeit | behoben | Vermerke der Führungsstelle mit Uhrzeit in der Historie, Herkunft einheitlich benannt. |
| R2-L2 Dateifehler außerhalb des Bilds | behoben | Startseite: `role="alert"`, rollt ins Bild. Einsatzansicht unverändert. |
| R2-A2 Foto mit zwei Codes | behoben | Mehrere Codes je Bild, Teile bis eine Stunde über Durchgänge gemerkt (nur Arbeitsspeicher), Quittung ins Bild. |
| R2-A3 Lageblatt weiterführen | behoben | Funkrufname, Rückrufnummer, freie Zeilen; Druckstand gemerkt; eine Sammel-PDF. |
| R2-A4 Stiftkorrektur | behoben | Kästchen „von Hand geändert" mit Stand neben jedem Code, Hinweis im Stapelbericht. |
| R2-A5 Nacherfassung | teilweise | Ähnlichkeitsrückfrage erkennt Vorsätze (OV, THW …), Feld „Eingetroffen um". Reihenfolge Personal/Fahrzeuge wie bisher. |

Die P3-Befunde sind offen.
