# Rollenaudit Neuer Nutzer, Runde 18

- **Prüfer:** Rolle „Helfer ohne Einweisung" (Skill `thw-new-user-reviewer`)
- **Datum:** 2026-10-27
- **Gegenstand:** Web-App Erfassungsbogen, Produktionsbuild auf `http://localhost:4173`, Code-Stand Commit ae3a8e9 (`main`)
- **Prüfaufbau:** Playwright mit Chromium (globales Modul, `chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE, Viewports 390x844 und 360x640. Keine Kamera. Sammlung „Hochwasser Elbe" mit acht Beispielbögen aus `examples/thw/` (`uebung: false`, Stand und Zeitraum auf heute gesetzt) über „Bögen einlesen…". Downloads (Lageblatt-PDF, CSV) geöffnet und gelesen. Kein Code geändert.
- **Maßstab:** Keine „bekannten Grenzen"; auch früher als teilweise, offen oder nicht reproduzierbar geführte Punkte werden gemeldet, wenn sie im Browser noch zu sehen sind.
- **Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 13

## Urteil aus Sicht der Rolle

Beide Aufgaben gehen ohne fremde Hilfe: „eigenen Bogen erfassen und übergeben" (sechs Schritte, Rückfrage „Ort der Einheit fehlt" mit Sprung ins Feld, Übergabe-Dialog mit „7 offene Punkte — Übergeben ist trotzdem möglich") und „Einsatz-Sammlung anlegen, acht Bögen aufnehmen, Einheit abrücken, Meldung entfernen und zurückholen, Lageblatt, Sammel-PDF, CSV, Excel, Lagemonitor". Fehlgriffe werden gut aufgefangen. Was bleibt, sind Wortwahl, stilles Verhalten in der ersten Sekunde nach einem Tipp und Darstellung; nichts davon verhindert eine Aufgabe.

## Bestätigte Behebungen aus Runde 17 (im echten Browser)

- Doppeltipp: Doppeltipp auf „Weiter →" geht genau einen Schritt weiter; Doppeltipp auf „Abrücken" rückt einmal ab (eine Sekunde „✓ Abgerückt", dann „Wieder anwesend"); Doppeltipp auf Lageblatt, Sammel-PDF, CSV und Excel erzeugt je genau eine Datei, mit der Zeile „… wird erzeugt — bitte nicht noch einmal tippen."
- Neuladen: aufgeklappte Karte bleibt offen, die Bildlaufstelle bleibt; ein Neuladen mitten im Assistenten führt zur Startseite mit „Fortsetzen / Verwerfen".
- Zurück-Geste führt aus der Sammlung zur Startseite, nicht aus der App.
- Papierkorb: „Meldung entfernen?" nennt die Folgen; nach dem Neuladen steht „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar" mit „Zurückholen" und „Endgültig löschen…"; Zurückholen bringt die Einheit wieder.
- Tabelle am Telefon: bei 390 und 360 px ohne seitlichen Überlauf (Spalten Einheit, Gesamtstärke, Meldung vor, Bedarf).
- Fußleiste im Assistenten 57 px, Schnellerfassung erklärt „–" („Schritt 2 und 5 entfallen hier"), Aufnahmeknöpfe tragen auch bei 360 px Unterzeilen, kein Layoutsprung der Startseite beim Erstbesuch (gemessen: Verschiebung 0,001), der Einsatz steht auf der Startseite einmal, „✓ Abgerückt" ist kein Schalter mehr, „Namen einfügen…" zeigt „Reihenfolge prüfen" und fragt einmal, der Lagemonitor schreibt „Führer / Unterführer / Mannschaft = gesamt", Scanner ohne Kamera nennt zuerst den Weg „Foto oder Bildschirmfoto … Knopf ‚QR aus Bild einlesen…'", die CSV-Knöpfe sind erklärt, „Anderer Einsatz?" steht auch im Lageblatt.

## Befunde

### R18-N1 (P3) – Tipps in der ersten Sekunde werden still verschluckt

- **Neu oder alt (Verweis):** neu (Nebenwirkung der Doppeltipp-Behebung aus Runde 17).
- **Ort:** Rückfrage „Meldung entfernen?" (Karte → Mehr… → Entfernen); Einsatz-Seite „Weitergeben, Lageblatt, Export", 390x844.
- **Beobachtung:** Tippt man „Meldung entfernen" 0,3 bis 0,7 s nach dem Öffnen der Rückfrage, passiert nichts: kein Schließen, keine Meldung, der Knopf sieht unverändert aus. Erst ab etwa 1,2 s wirkt der Tipp. Ebenso: „Übersicht als CSV" 0,5 s nach „Lageblatt (A4 quer)" getippt erzeugt keine Datei und keine Zeile; nach 2 s klappt es.
- **Erwartung der Rolle:** Ein Tipp auf einen sichtbaren Knopf wirkt oder sagt, warum nicht.
- **Folge:** Der Helfer glaubt an einen Fehler, tippt mehrfach oder bricht ab; bei der CSV bleibt unklar, ob die Datei gewollt fehlt.
- **Empfehlung:** Den Schutz sichtbar machen (Knopf kurz abgeblendet) oder den ersten Tipp ausführen und nur den zweiten sperren.
- **Verifikation:** Rückfrage öffnen und sofort tippen; Lageblatt tippen und sofort CSV tippen.

### R18-N2 (P3) – Quittung nach „Entfernen" schneidet die Folge ab

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatz-Seite nach „Meldung entfernen", 390x844.
- **Beobachtung:** Die Quittung unten lautet „Entfernt: Meldung Nr. 1 „THW Albstadt Zugtrupp Technischer Zug" (4 Personen). Die Einheiten Nr…" und endet nach drei Zeilen mit „…". „Rückgängig" und „✕" stehen daneben.
- **Erwartung der Rolle:** Der Satz, dass die Nummern aufrücken, ist gerade der, den man nach dem Entfernen lesen will.
- **Folge:** Der Helfer sieht nicht, dass Nr. 2 bis 8 jetzt anders heißen; Zurufe nach „Nr. 3" meinen dann eine andere Einheit.
- **Empfehlung:** Quittung vollständig zeigen (mehr Zeilen) oder den Nummernhinweis als eigene kurze Zeile.
- **Verifikation:** Meldung entfernen, Quittung lesen.

### R18-N3 (P3) – Aufnahme-Hinweis bleibt stehen und spricht von „Lageblatt: *"

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatz-Seite oben, nach „Bögen einlesen…", 390x844 und 360x640; Spalte „Eingetroffen" in Lageblatt und CSV.
- **Beobachtung:** „8 Bögen aufgenommen. Eintreffzeit dieser 8 Bögen ist die Zeit des Einlesens (Lageblatt: *); anders gewesen: Karte › „ändern"." bleibt auch nach „Zur Kenntnis genommen", Abrücken und Entfernen stehen, während der Kopf „7 Einheiten" zeigt. Das „*" steht in Lageblatt (Fußzeile) und CSV („27.10.2026, 22:41 *"), ohne dass der Hinweis dort „*" nennt.
- **Erwartung der Rolle:** Ein Hinweis zu einer Aktion verschwindet oder bleibt als Verlauf erkennbar; ein Sternchen wird dort erklärt, wo es steht.
- **Folge:** Zwei Zahlen (8 Bögen, 7 Einheiten) widersprechen sich scheinbar; der Stab liest in der CSV „22:41 *" ohne Deutung.
- **Empfehlung:** Hinweis nach Kenntnisnahme ausblenden oder als „Aufnahme 22:41: 8 Bögen" datieren; „*" in der CSV-Spalte ausschreiben („Eintreffzeit = Zeit des Einlesens").
- **Verifikation:** Acht Bögen einlesen, eine Einheit abrücken, Hinweis und CSV lesen.

### R18-N4 (P3) – Kopfzahlen der Sammlung brechen unregelmäßig um

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatz-Seite oben, 390x844 und 360x640.
- **Beobachtung:** Fünf Kennzahlen stehen in 3 + 2 Kacheln; die Zahlen der zweiten Reihe („47", „65") sitzen um einige Pixel versetzt zur ersten, „Gesamt" ist blau, „Einheiten" schwarz. In der leeren Sammlung steht darunter „Bedarf: Verpflegung 0".
- **Folge:** Wirkt unfertig; die Gesamtzahl ist nicht als Summe der drei Stärken erkennbar.
- **Empfehlung:** Eine Reihe „F · UF · M = Gesamt" und „Einheiten" abgesetzt; „Bedarf" erst zeigen, wenn es einen gibt.
- **Verifikation:** Leere und gefüllte Sammlung bei 360 px ansehen.

### R18-N5 (P3) – „Bogen scannen…" liegt hinter drei Hinweisblöcken

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatz-Seite nach dem Einlesen, 390x844 und 360x640.
- **Beobachtung:** Über den vier Aufnahmeknöpfen stehen Aufnahme-Hinweis, Kasten „Neu seit der letzten Kenntnisnahme (8)" mit Zugfeld, „Bedarf" (vier Zeilen) und zwei Verweise. „Bogen scannen…" beginnt bei 390 px erst bei etwa 1 230 px, also nach mehr als anderthalb Bildschirmen; in der leeren Sammlung bei 630 px.
- **Folge:** Wer am Meldekopf den nächsten Bogen annehmen will, scrollt jedes Mal an der Statistik vorbei.
- **Empfehlung:** Aufnahmeknöpfe unter die Kennzahlen, Hinweisblöcke darunter.
- **Verifikation:** Acht Bögen einlesen, die Lage des Knopfs ohne Scrollen suchen.

### R18-N6 (P3) – Dieselbe Handlung heißt „Verwerfen" und „Bogen schließen"

- **Neu oder alt (Verweis):** neu.
- **Ort:** Startseite (Entwurfskarte) und Gesamtübersicht, 360x640 und 390x844.
- **Beobachtung:** Die rote Taste der Entwurfskarte heißt „Verwerfen"; die Rückfrage („Angefangenen Bogen verwerfen?") sagt „wird geschlossen … erreichbar unter ‚Zuletzt geschlossenen Bogen zurückholen'". In der Übersicht heißt derselbe Weg „Bogen schließen" („Der Bogen wird geschlossen, nicht gelöscht").
- **Erwartung der Rolle:** „Verwerfen" heißt weg; „Schließen" heißt aufbewahren.
- **Folge:** Der Helfer scheut „Verwerfen" oder verlässt sich auf „weg", obwohl ein Stand liegen bleibt.
- **Empfehlung:** Einen Namen für beides („Bogen schließen") und einen für wirkliches Löschen.
- **Verifikation:** „Verwerfen" tippen, Rückfrage lesen, mit „Bogen schließen" vergleichen.

### R18-N7 (P3) – Entwurfskarte: Erklärsatz unter der Karte, Stärke aus Vorbelegung

- **Neu oder alt (Verweis):** neu.
- **Ort:** Startseite nach Neuladen mitten im Assistenten, 360x640.
- **Beobachtung:** Oben die Karte „THW Müllheim Bergungsgruppe / Stärke 0 / 2 / 7 / 9 (F / UF / M / Ges) · gespeichert 22:36 Uhr / Fortsetzen / Verwerfen", darunter der grüne Offline-Kasten, erst danach „Entwurf vom 27.10.26, 22:36 Uhr wiederhergestellt. „Fortsetzen" öffnet ihn dort, wo du warst." Die Stärke 9 stammt allein aus der StAN-Vorbelegung (keine Namen).
- **Folge:** Der Erklärsatz steht weit von seiner Karte; die Stärkeangabe liest sich wie eine Meldung.
- **Empfehlung:** Satz in die Karte, Stärke als „9 Sollplätze, noch ohne Namen" kennzeichnen.
- **Verifikation:** Bogen beginnen, Seite neu laden, Karte lesen.

### R18-N8 (P3) – Fußleiste im Assistenten: Zurück ist nur „←"

- **Neu oder alt (Verweis):** alt – Rest von R15-M2 (Fußleiste, „teilweise") und R17-N7; das „◐" ist weg, das Wort fehlt weiter.
- **Ort:** Assistent, alle Schritte, 360x640 und 390x844.
- **Beobachtung:** Links ein 44-px-Knopf „←" ohne Wort, im Schritt 1 gestrichelt (gesperrt), rechts „Weiter →" beziehungsweise „Zur Übersicht →". In der Übersicht heißt derselbe Weg dagegen „← Zurück zu Schritt 5 (Sofortbedarf)".
- **Folge:** Ein Pfeil allein lässt „Zurück zum Schritt" oder „Zurück zur Startseite" offen; im Kopf steht zusätzlich „‹ Startseite".
- **Empfehlung:** „← Zurück" mit Wort; die gestrichelte Sperre im Schritt 1 ausblenden.
- **Verifikation:** Assistent bei 360 px öffnen, Fußleiste lesen.

### R18-N9 (P3) – Tabelle: Spaltenkopf „MELDUNG VOR" und Wert „10 Min"

- **Neu oder alt (Verweis):** alt – R16-N1 und R17-H8/K7 (Tabelle am Telefon, behoben bis auf die Beschriftung).
- **Ort:** Einsatz-Seite → „Tabelle", 360x640 und 390x844.
- **Beobachtung:** Der Kopf bricht um zu „MELDUNG / VOR", die Zelle zeigt „10 Min". Die Langfassung („Alter der Angaben: Stand im Bogen, höchstens der Eingang") steht nur im ausgeblendeten Teil des Kopfs. Weitere Köpfe: „GES.".
- **Folge:** „Meldung vor 10 Min" liest sich als Satz, nicht als „Alter"; der Stab könnte es als Dauer der Meldung deuten.
- **Empfehlung:** Kopf „Stand: Alter" oder Werte „vor 10 Min".
- **Verifikation:** Tabelle ohne Erklärung lesen lassen.

### R18-N10 (P3) – Dateinamen und Quittungstexte der Ausgaben sind schwer lesbar

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatz-Seite → „Weitergeben, Lageblatt, Export".
- **Beobachtung:** Dateinamen wie `eeb-lageblatt-272237okt26_Hochwasser_Elbe.pdf` (Zeitstempel „272237okt26" für 27. um 22:37, Vorsilbe „eeb"). Die Quittung der Sammel-PDF: „Weitergegeben ist sie erst, wenn sie bei der Ablösung oder im Archiv angekommen ist. Für den Stab zählt sie nicht als Lieferung: Nachträge dorthin laufen über „Nur neue Bögen seit dem letzten Export"." (drei Sätze, „Ablösung", „Lieferung").
- **Folge:** Im Download-Ordner sortieren und erkennen fällt schwer; die Quittung verlangt, Begriffe der Nachtrag-Logik zu kennen.
- **Empfehlung:** Dateiname „Lageblatt_Hochwasser_Elbe_2026-10-27_22-37.pdf"; Quittung auf einen Satz („Gespeichert. Ob sie angekommen ist, weiß das Gerät nicht.") und die Nachtrag-Erklärung auf den Knopf verlegen.
- **Verifikation:** Datei erzeugen, Namen und Quittung lesen.

### R18-N11 (P3) – Übersicht: „Uhrzeit Beginn / Ende — / —" mit langem Anhang

- **Neu oder alt (Verweis):** alt – R17-N10 (Zeitraum und Uhrzeit), Überschriften sind klarer, die Übersichtszeile nicht.
- **Ort:** Assistent Schritt 6 „Übersicht", Block „Einsatz", 390x844.
- **Beobachtung:** „Uhrzeit Beginn / Ende — / — — für eigene Nachweise in Schritt 2 eintragen; die Zeiten des Meldekopfs kommen nicht hierher zurück." Zwei Gedankenstriche hintereinander, danach ein 25-Wörter-Satz in kleiner Schrift. Daneben „Ort / Auftrag —".
- **Folge:** Der Helfer weiß nicht, ob „—" fehlt oder „keine" bedeutet; der Satz gehört zum Schritt 2, nicht zur Übersicht.
- **Empfehlung:** „nicht eingetragen" ausschreiben, Anhang kürzen („optional, nur für eigene Nachweise").
- **Verifikation:** Bogen ohne Zeiten bis zur Übersicht ausfüllen.

### R18-N12 (P3) – Übersicht Personal: leere Namenszellen und Kürzel

- **Neu oder alt (Verweis):** neu.
- **Ort:** Assistent Schritt 6 „Personal (9)", 390x844.
- **Beobachtung:** Tabelle „ROLLE / FUNKTION / ZUSATZFUNKTION / NAME, VORNAME" mit den Marken „UFü", „Ma"; die Namenszellen sind leer, ohne „offen" oder „—". Fahrzeugtabelle darunter nur mit „Zum Weiterlesen seitlich wischen →".
- **Folge:** Neun Zeilen ohne Namen sehen nach Darstellungsfehler aus; „UFü" und „Ma" kennt nur, wer die Stärkemeldung kennt.
- **Empfehlung:** „(offen)" in leere Zellen; Rolle ausschreiben („Unterführer", „Mannschaft") oder Legende.
- **Verifikation:** Bogen mit Vorbelegung bis zur Übersicht ansehen.

### R18-N13 (P3) – Fachwörter der Sammlung ohne Erklärung

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatz-Seite, Kartenliste und Hinweisblöcke.
- **Beobachtung:** „Einheiten (8 gemeldet · 8 zählend)", „Neu seit der letzten Kenntnisnahme", „Zur Kenntnis genommen", „Folgem. 22:28 · 3 → 4", „Anderer Einsatz?", „Zählt in Lage" (CSV). Keiner der Begriffe wird an der Stelle erklärt; die Erklärung „Zählt…" steht nur in der Rückfrage zur Übungsmarkierung.
- **Folge:** Der Helfer fragt, ob „zählend" „anwesend" meint und ob „Zur Kenntnis genommen" etwas an die Einheiten sendet.
- **Empfehlung:** „anwesend" statt „zählend", „Gesehen"/„Alle gesehen" statt „Zur Kenntnis genommen", „Folgemeldung" ausschreiben.
- **Verifikation:** Sammlung ohne Anleitung lesen lassen und Begriffe deuten lassen.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Verwerfen" und „Bogen schließen" meinen dasselbe (Stand bleibt erhalten), klingen aber nach Löschen und nach Aufbewahren (R18-N6).
- **Größtes Einsatzrisiko:** Ein Tipp in der ersten Sekunde (Bestätigen, Export) wird ohne Rückmeldung verschluckt (R18-N1); Daten gehen dabei nicht verloren.
- **Top-Priorität für die nächste Iteration:** R18-N1 (sichtbarer Doppeltipp-Schutz) und R18-N5 (Aufnahmeknöpfe vor die Hinweisblöcke).
