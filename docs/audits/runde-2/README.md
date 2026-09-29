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
| R2-M1 200 % Schrift | in Arbeit | — |

Die P2- und P3-Befunde sind offen.
