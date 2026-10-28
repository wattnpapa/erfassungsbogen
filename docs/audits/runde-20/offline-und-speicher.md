# Audit Runde 20 – Offline und Speicher

Prüfer: Rollenaudit `thw-offline-resilience-reviewer` · Datum: 2026-10-28 · Zählung: **P0 0 · P1 0 · P2 0 · P3 5 · Hinweise 3**

Reiner Prüfbericht, keine Codeänderung. Gegen die laufende App auf `http://localhost:4173` (Code-Stand `7c06324` = `main`),
Playwright mit Chromium (globales Modul, Projektkopie fand keinen Browser), Telefon 390 x 844 und 360 x 640, `isMobile`/`hasTouch`,
Locale de-DE, je Lauf ein eigener Browser-Kontext. Netz weg über `context.setOffline` (Neuladen offline), voller Speicher durch
Auffüllen von `localStorage` bis zum echten Quota-Fehler, zwei Tabs im selben Kontext. Beispielbögen aus `examples/thw`, alle über
die Oberfläche („Bögen einlesen…“). Vorab gelesen: `docs/audits/README.md`, „Stand der Behebung“ in Runde 19 und der
Runde-19-Bericht „Offline und Speicher“. Es gelten keine „bekannten Grenzen“; auch als „offen“ oder „teilweise“ geführte Punkte sind
gemeldet, wenn sie im Browser noch zu sehen waren.

Zählregel: ein Befund je Sachverhalt, ein Typ je Befund (Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast); P3 nur bei echter
Beeinträchtigung der Aufgabe, Geschmacksfragen unter „Hinweise“ ohne Priorität.

## Urteil

Die Runde-19-Behebungen halten. Bei vollem Speicher meldet jede geprüfte Schreibaktion ihr Scheitern am Tippziel, und keine
Quittung behauptet mehr etwas, das nach dem Neuladen nicht stimmt. Funkloch, Neuladen offline, Doppeleinlesen, zwei Tabs und
Papierkorb tragen. Die Aufgabe „Einsatz anlegen, Bögen einlesen, Netz weg, neu laden, abrücken, Lageblatt/Sicherung erzeugen,
Übergabe vermerken, löschen und zurückholen“ gelingt ohne fremde Hilfe, auch bei vollem Speicher (dort mit den gemeldeten
Fehlern und Umwegen über „Endgültig entfernen“). Übrig sind fünf kleine Befunde: eine abgeschnittene Sperrmeldung, eine
veraltete Zeile in der Übergabe-Liste, verlorener Tipptext nach einem Speicherfehler und zwei zu kleine Tippziele.

## Nachprüfung der Behebungen aus Runde 19 (halten, nicht gemeldet)

- **Voller Speicher, „Meldung entfernen“ (R19-O1):** Die Rückfrage führt zu „Papierkorb voll … Endgültig entfernen?“; „Endgültig
  entfernen“ quittiert „Nicht im Papierkorb: nur bis zum Neuladen zurückholbar“, und die Meldung ist nach Neuladen weg wie
  gesagt. Mit Platz: Quittung „Nr. 1 entfernt · Papierkorb“, Eintrag in `eeb.meldungen-papierkorb.v1`, nach Neuladen offline
  „Zuletzt entfernte Meldungen (1) – 7 Tage zurückholbar“.
- **Voller Speicher, „Einsatz löschen“ (R19-O3):** Dialog „Nicht gelöscht … Oder … jetzt endgültig löschen?“; nach Neuladen steht
  der Einsatz unverändert da, kein falscher Papierkorb-Eintrag.
- **Voller Speicher, „Einsatz als beendet markieren“, „Übergabe vermerken“ (R19-O2):** Dialoge „Einsatz nicht beendet“ und
  „Übergabe nicht vermerkt … Nichts hat sich geändert“.
- **Voller Speicher, Exporte (R19-O4):** Lageblatt, Sammel-PDF, CSV (Übersicht, alle Daten) und Excel erzeugen die Datei; die
  Quittung nennt „Vermerk nicht gespeichert (Speicher voll) – die Übergabe-Liste zeigt ‚noch nicht‘“. (Rest bei „Datensicherung“
  siehe R20-O2.)
- Weitere Schreibwege bei vollem Speicher melden den Fehler: Ort/Name des Einsatzes („Nicht geändert“), Auftrag/Notiz, Zug
  zuordnen, „Als Einsatzmeldung zählen“ („Kennzeichnung ändern“), Schnellerfassung „In Einsatz übernehmen“ („Nicht übernommen“,
  Eingaben bleiben im Assistenten), Entwurf im Assistenten („⚠ Nicht gespeichert … Jetzt ‚Bogen übergeben‘“).
- **Fußleiste ohne Textüberlauf:** Assistent bei 390 und 360, alle Schritte: kein abgeschnittener Knopf, kein Quer-Scroll
  (`scrollWidth` = Viewportbreite); „In Einsatz übernehmen“ in der Schnellerfassung bei 360 vollständig (167 px), bei 390 zweizeilig.
- **Quittungsleiste als Kurzfassung:** „Nr. 1 entfernt · Papierkorb“ mit „Details“, „Rückgängig“, „✕“; 60 px hoch (9 % von 640),
  „Abgerückt“ und Exportquittungen ebenso; steht etwa 9 s.
- **Schnellerfassung mit Ortsfeld zuerst:** „Ort der Einheit (Pflicht)“ bei y = 183, Zettel-Kasten darunter, bei 390 und 360.
- **Tabelle am Telefon:** Spalte „Auftrag“ entfallen, Zeilen 78 px, kein Quer-Scroll, Legende unter der Tabelle (Rest siehe Hinweis).
- **Startseite:** kein Überlauf bei 390 und 360, die zwei Kartenspalten tragen vollständig; Papierkorb der Einsätze überlebt Neuladen
  offline; „Wiederherstellen“ und „Endgültig löschen…“ 44 px hoch.
- **Tipp-Sperre mit Grund am Knopf:** Ein zweiter Tipp nach 150 ms bis 1,5 s auf „Lageblatt“ löst keinen zweiten Download aus
  (1 Download, 1 Quittung); der Knopf bekommt gestrichelten Rahmen und Text (zur Länge des Texts siehe R20-O1).
- Außerdem gehalten: Einsatz anlegen, Einlesen (zweites Einlesen derselben Bögen: „0 Bögen aufgenommen, 3 bereits vorhanden“,
  keine Dubletten), Neuladen offline (Service Worker, Einsatz samt Papierkorb vorhanden), Abrücken offline mit „Rückgängig“, zwei
  Tabs (Abrücken in Tab A und in Tab B, danach beide abgerückt), Sicherung erzeugen offline und bei vollem Speicher (Datei entsteht),
  Scanner ohne Kamera bei 360 x 640 ohne inneres Scrollen.
- **R19-K10 („7 Bögen aufgenommen, 7 bereits vorhanden“)** war mit sieben JSON-Beispielbögen in acht Läufen bei 390 x 844 nicht zu
  beobachten (immer „7 Bögen aufgenommen“); das Original lief mit PDFs, die hier nicht vorlagen. Deshalb weder bestätigt noch
  gemeldet.

## Befunde

### P3

#### R20-O1 – Tipp-Sperre: „Schon getippt — einen Moment …“ ist 1,5-mal breiter als der Knopf und wird abgeschnitten

- **Priorität:** P3
- **Typ:** Text
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** neu (die Behebung R19-E1/N2/K4 „Grund am Knopf“ hält für „Einen Moment …“; die zweite Textvariante passt nicht)
- **Ort:** Einsatz → „Lageblatt (A4 quer)“, „Übersicht als CSV“, „Alle Daten als CSV“; zweimal kurz nacheinander tippen, 390 x 844 und 360 x 640.
- **Beobachtung:** Der zweite Tipp (150 bis 1 500 ms nach dem ersten) wird verworfen; auf dem Knopf steht `data-tipp-text`
  „Schon getippt — einen Moment …“, `white-space: nowrap`, `overflow: visible`. Textbreite 225 px, Knopfbreite 148 bis 154 px. Der
  Text läuft links und rechts über den dunklen Knopf hinaus und ist dort weiß auf hellem Grund unsichtbar; lesbar bleibt „n getippt —
  einen Mome…“ (Screenshot `tt_360`). Der breite Knopf „Excel-Liste“ (248 px) zeigte den Text im Lauf nicht.
- **Erwartung der Rolle:** Die Sperrmeldung ist auf dem Knopf vollständig lesbar, besonders weil sie erklärt, warum nichts passiert.
- **Folge:** Der Helfer liest einen Satzrest, nicht den Grund „schon getippt“; er tippt ein drittes Mal oder zweifelt, ob die Datei
  entstand. Die Sperre wirkt (kein zweiter Download), nur ihre Erklärung ist verstümmelt.
- **Empfehlung:** Meldung kürzen („Schon getippt“) oder Umbruch zulassen, sodass sie in jeden Knopf ab 140 px passt.
- **Verifikation:** Doppeltipp auf „Lageblatt“ bei 360 px: der volle Text liegt innerhalb des Knopfs.

#### R20-O2 – Übergabe-Liste zeigt nach „Sicherung erstellen“ weiter „○ Datensicherung: noch nicht“, bei vollem Speicher ohne Erklärung

- **Priorität:** P3
- **Typ:** Text
- **Kennzeichnung:** gemessen (Neuladen, 390 x 844; Lauf dreimal, mit und ohne vollen Speicher)
- **Neu oder alt (Verweis):** alt (Rest von R19-O4: Vermerk-Zusatz fehlt am Weg „Datensicherung“; neu ist die veraltete Zeile auch ohne vollen Speicher)
- **Ort:** Einsatz → Fuß „Datensicherung“ → „Sicherung erstellen…“ → „Schließen“ → „Übergabe und Abschluss“.
- **Beobachtung:** Der Dialog meldet „Sicherung ‚eeb-sicherung-2026-10-28.json‘ erzeugt …“, die Datei wird geladen. Die Zeile darunter bleibt
  auch 2,5 s später und nach Scrollen „○ Datensicherung: noch nicht“; erst nach Neuladen oder nach einer anderen Exportaktion steht
  dort „✓ … zuletzt gesichert 28.10.2026, 07:27 · Sie enthält 1 Einsatz, 3 Meldungen“. Bei vollem Speicher bleibt die Zeile
  dauerhaft „noch nicht“, der Dialog sagt nichts dazu (die Exportquittungen sagen „Vermerk nicht gespeichert (Speicher voll)“).
- **Erwartung der Rolle:** Die Liste zeigt sofort „gesichert“ oder nennt bei vollem Speicher den Grund.
- **Folge:** Der Helfer hat die Sicherung, die Abschlussliste widerspricht dem Dialog und lässt ihn zweifeln oder erneut sichern.
- **Empfehlung:** Zeile nach dem Sichern neu zeichnen; bei vollem Speicher denselben Zusatz wie bei den Exporten im Dialog zeigen.
- **Verifikation:** Sicherung erstellen, Dialog schließen: Zeile sagt „zuletzt gesichert“; Speicher voll: Dialog nennt den fehlenden Vermerk.

#### R20-O3 – Nach einem Speicherfehler ist der eben getippte Text in „Auftrag/Notiz“ und „Zug zuordnen“ weg

- **Priorität:** P3
- **Typ:** Daten/Verlust
- **Kennzeichnung:** gemessen (Auftrag/Notiz, Zug zuordnen); Einsatz-Dialog „Name und Ort“ schließt ebenfalls, Feldinhalt dort nicht nachgemessen
- **Neu oder alt (Verweis):** neu
- **Ort:** Einsatz → Karte aufklappen → „Auftrag/Notiz“ oder „Zug zuordnen“, Speicher voll, 390 x 844.
- **Beobachtung:** Text eintragen, Eingabetaste: Dialog „Speichern fehlgeschlagen – der Speicher dieses Geräts ist voll …“. Nach
  „Alles klar“ ist das Eingabefeld verschwunden (Feld nicht mehr im DOM), nach Neuladen ist nichts gespeichert. Die Meldung sagt
  „Nichts hat sich geändert“, nennt aber nicht, dass der getippte Text verloren ist.
- **Erwartung der Rolle:** Das Feld bleibt mit Inhalt offen, damit man nach dem Platzschaffen nur „Speichern“ tippt.
- **Folge:** Wer Platz schafft (Sicherung, Papierkorb leeren), muss den Auftrag („Pumpen Keller Nord“) neu eintippen, am Funk
  vielleicht nicht mehr wörtlich zur Hand.
- **Empfehlung:** Feld bei Speicherfehler geöffnet und befüllt lassen oder den Text im Fehlerdialog anzeigen.
- **Verifikation:** Speicher füllen, Auftrag eintragen, Fehler quittieren: Text steht noch im Feld.

#### R20-O4 – „Warum?“ in der Warnung „Bogen nennt …“ ist 54 x 15 px groß

- **Priorität:** P3
- **Typ:** Bedienung
- **Kennzeichnung:** gemessen (390 und 360)
- **Neu oder alt (Verweis):** neu
- **Ort:** Einsatz → Karte mit abweichendem Einsatznamen im Bogen (Beispiel 5, „Hochwasserlage Albstadt – Führung Technischer Zug“): „⚠ Bogen nennt … passt das zu dieser Lage? Zählt trotzdem mit. Warum?“.
- **Beobachtung:** „Warum?“ ist ein `summary` von 54 x 15 px; 7 px darunter liegt der Knopf „Gehört zu dieser Lage“.
- **Erwartung der Rolle:** Jedes Tippziel mit Handschuh treffbar, besonders neben einem Knopf, der die Meldung verändert.
- **Folge:** Fehltipp auf „Gehört zu dieser Lage“ statt „Warum?“ bestätigt die Zuordnung, ohne dass die Erklärung gelesen wurde.
- **Empfehlung:** Zielhöhe 44 px mit mindestens 8 px Abstand zum Knopf darunter.
- **Verifikation:** Gemessene Höhe von „Warum?“ mindestens 44 px.

#### R20-O5 – Nach „Einsatz löschen“ ist der Weg zurück ein 33 px hoher Knopf 2,2 Bildschirme tiefer, die Quittung steht nur 9 s

- **Priorität:** P3
- **Typ:** Bedienung
- **Kennzeichnung:** gemessen (390: y = 1 410 von 7 023 px; 360: y = 1 446 von 7 324 px)
- **Neu oder alt (Verweis):** neu (verwandt mit R19-O3, dort ging es um die Ehrlichkeit der Quittung)
- **Ort:** Einsatz → „Einsatz löschen…“ → „In den Papierkorb“ → Startseite, nach Ablauf der Quittungsleiste.
- **Beobachtung:** Die Quittung „In den Papierkorb gelegt (30 Tage rückholbar)“ mit „Rückgängig“ steht etwa 9 s. Danach zeigt die
  Startseite oben nichts vom gelöschten Einsatz; „Papierkorb Einsätze (1)“ ist ein Knopf von 166 x 33 px unter „Einsatz-Sammlung
  (Meldekopf)“, 1 410 bis 1 446 px unter dem Seitenanfang, nach Aufklappen mit „Wiederherstellen“ (44 px).
- **Erwartung der Rolle:** Wer aus Versehen einen Einsatz mit allen Meldungen löscht, findet den Rückweg ohne Suchen.
- **Folge:** Ein Helfer, der die 9 s verpasst, sieht eine Startseite ohne Spur seines Einsatzes und scrollt über zwei Bildschirme
  oder hält ihn für verloren.
- **Empfehlung:** Hinweiszeile mit Link direkt unter den zwei Kartenspalten, solange der Papierkorb gefüllt ist, Knopf 44 px hoch.
- **Verifikation:** Einsatz löschen, 10 s warten: Der Rückweg ist ohne Scrollen sichtbar und 44 px hoch.

## Hinweise (ohne Priorität)

- **H1 – Dauerleiste „Ansicht: Standard“ belegt 57 px am unteren Rand** (alt, R19-K12): in der Einsatzansicht 9 % von 640 px, sie
  deckt unten Text ab, bis man scrollt; Quittungen ersetzen sie. Keine Aufgabe scheitert daran.
- **H2 – Tabelle: „Ges.“ und „Eingetr.“ bleiben abgekürzt** (alt, R19-N8): Die leere Spalte „Auftrag“ ist entfallen, die Legende
  steht unter der Tabelle; die Köpfe selbst sind weiter Kürzel.
- **H3 – Abstände 5 bis 7 px zwischen Sprunglinks** („Zur Einheitenliste ↓“, „Weitergeben, Lageblatt, Export ↓“, „Übergabe,
  Abschluss ↓“: 6 px; Tippziele aber 47 px hoch) (alt, R19-O8 / R18-G5). Keine Fehlbedienung beobachtet.

## Nicht prüfbar

Echte Funkloch-Übergänge am Telefon, Speicherräumung durch iOS, Hintergrund-Beenden, Kamera-Scan, native Builds, Ablauf der 7 und
30 Tage im Papierkorb, 568 x 320 (nicht Teil dieses Auftrags: Viewports 390 x 844 und 360 x 640), R19-K10 mit PDF-Dateien.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Die Übergabe-Liste („noch nicht“) widerspricht nach der Sicherung dem Dialog „Sicherung erzeugt“ (R20-O2).
- **Größtes Einsatzrisiko:** Ein verpasster Rückweg nach „Einsatz löschen“ (R20-O5) oder ein verlorener Auftragstext bei vollem Speicher (R20-O3).
- **Top-Priorität für die nächste Iteration:** R20-O3 (Eingabefeld und Text nach Speicherfehler erhalten), danach R20-O1 und R20-O2.
