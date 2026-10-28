# Audit „Neuer Nutzer", Runde 21 (Helfer ohne Einweisung)

Prüfer: Rollenaudit `thw-new-user-reviewer` · Datum: 2026-10-29 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (laufender `vite preview`, Code-Stand
Commit `f007590` = `main`) · Zählung: **P0 1 · P1 0 · P2 0 · P3 6 · Hinweise 5**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md` und der Abschnitt
„Stand der Behebung" von Runde 20. Es gibt keine „bekannten Grenzen"; auch Punkte mit Stand „offen"
oder „nicht ganz erreicht" sind gemeldet, wenn sie im Browser noch zu sehen sind. Zählregel: ein
Befund je Sachverhalt, ein Typ je Befund; P3 nur bei echter Beeinträchtigung der Aufgabe,
Geschmacksfragen und Kleinigkeiten stehen unter „Hinweise" ohne Priorität.

## Prüfaufbau

Chromium über das globale Playwright-Modul, `chromium.launch()` ohne Optionen, `isMobile`, `hasTouch`.
Viewports 390 x 844 und 360 x 640, dazu 320 x 568 (Dialoge) und quer 568 x 320, 640 x 360, 844 x 390
(Scanner, Assistent; Ansicht „Standard" und „Feld"). Frischer Browserzustand je Durchlauf. Offline
wurde über `context.setOffline(true)` nach vollständigem ersten Laden geprüft (Service Worker
bereit, 549 Zusatzdateien im Cache, 15 s Wartezeit), jeweils mit und ohne Neuladen. Das
Nachladeverhalten wurde mit gedrosseltem Netz (rund 400 kbit/s, 300 ms Latenz, Service Worker
gesperrt, also kalter Start) und mit 6-fach gedrosselter CPU bei warmem Service Worker gemessen
(Layout-Sprünge über `layout-shift`). Voller Speicher: `localStorage` bis zum Quota-Fehler gefüllt.
Durchlaufen: Startseite; „Neuen Bogen erstellen" (Schritt 1 bis 6); „Neue Einsatz-Sammlung…";
„Einheit schnell erfassen" (Schritt 1 bis 4, mehrere Einheiten); Karte, „Mehr…", „Ort der Einheit
ändern…", „Stärke ändern…", „Verschieben…", „Als Übung kennzeichnen…"; Tabelle; „Bögen
einlesen…"; Scanner ohne Kamera; Exporte (Sammel-PDF, Lageblatt, beide CSV, Excel); Beispielbögen;
„Übergabe vermerken…", „Einsatz beenden", „Einsatz löschen…".
Nicht prüfbar: Kamera, echte Bildschirmtastatur, Handschuhe, Licht, WebKit, Safe-Area.

## Urteil aus Sicht der Rolle

Online geht alles ohne fremde Hilfe: eigenen Bogen erfassen, Einsatz-Sammlung anlegen, Einheiten
aufnehmen, Ort ändern, exportieren, bei vollem Speicher sauber scheitern. Die Behebungen aus Runde 20
halten fast vollständig. **Offline bricht dagegen die gesamte Einsatz-Sammlung weg:** Die Einsatzansicht
lässt sich ohne Netz nicht mehr öffnen und die Startseite behauptet trotzdem „Funktioniert komplett
offline". Das ist die Folge des Nachladens der Einsatzansicht (R21-N1) und der einzige
einsatzkritische Befund dieser Runde. Bogen, Assistent, Zeichensammlung, Beispielbögen und PDF
laufen offline einwandfrei.

## Bestätigte Behebungen aus Runde 20 (im echten Browser)

- **Voller Speicher, Bogen** (gefüllter `localStorage`, 100 %-Warnung auf der Startseite): „Bogen
  schließen" legt den Bogen unter „Zuletzt geschlossenen Bogen zurückholen" ab, er übersteht ein
  Neuladen, „zurückholen" öffnet ihn mit Quittung. „Neuen Bogen erstellen" bei offenem Bogen fragt
  „Neuen Bogen anfangen?", ersetzt und hält den alten Stand zurückholbar (R20-D1 gehalten). Die
  Statuszeile sagt bei Änderungen ehrlich „Nicht gespeichert — der Speicher dieses Geräts ist voll".
- **Notweg „Endgültig löschen"** (voller Speicher): „Einsatz löschen…" → „Nicht gelöscht" mit
  „Erst sichern", „Endgültig löschen…", „Einsatz behalten"; „Endgültig löschen…" führt in eine zweite
  Rückfrage mit Folge und Fokus auf „Einsatz behalten", erst „Ja, endgültig löschen" löscht und
  meldet „Endgültig gelöscht" (R20-W1 gehalten, auch bei 320 px ohne Überlauf).
- **Kein „THW THW Oldenburg"**: Eingabe „THW Oldenburg" ergibt „Nr. 1 THW Oldenburg" in Quittung,
  Karte und Tabelle (R20-H1 gehalten).
- **„Ort der Einheit ändern…"** (unter „Mehr…"): Dialog mit vorbelegtem Ort ohne Präfix, „Ort
  übernehmen" ergibt „THW Elsfleth", Historie „Name geändert: „THW Oldenburg" → „THW Elsfleth"" (kein
  Doppelpräfix).
- **Schnellerfassung**: Ort steht zuerst, Quittungsleiste „Nr. 1 „THW Oldenburg" abgelegt · Details ·
  Rückgängig · ✕" am unteren Rand sichtbar (R20-N4 gehalten); „2, 5 entfallen" ist weg (Neuer Befund
  dazu: R21-N2).
- **Scanner ohne Kamera quer** (568 x 320 und 640 x 360, „Standard" und „Feld"): Dialog füllt das
  Fenster, kein inneres Rollen, „Kamera erneut versuchen", „QR aus Bild einlesen…" und „Fertig" ohne
  Scrollen erreichbar.
- **Assistent quer**: „Ort der Einheit (Pflicht)" liegt bei 568 x 320 und 640 x 360 („Feld") ganz über
  der Fußleiste, auch mit geöffneter Vorschlagsliste (R20-N2 in diesem Teil gehalten).
- **Dialoge bei 320 px**: Übergabe vermerken, Einsatz löschen, Notweg (3 Knöpfe), endgültig löschen:
  kein seitlicher Überlauf (`scrollWidth` gleich Breite), Knöpfe 44 bis 58 px hoch, nichts abgeschnitten.
- **Tabelle am Telefon** (360 und 390): kein seitlicher Überlauf, Köpfe „Einheit · Stärke ·
  Eingetroffen" ausgeschrieben, Namen vollständig, Legende darunter.
- **Startseite**: Hinweis „Rest lädt noch (Beispielbögen, Themenseiten): 325 von 549" statt falschem
  „Jetzt offline bereit" beim Nachladen (R20-N7 gehalten).
- **Nachgeladene Zeichensammlung**: Beim Wählen des Einheitstyps erscheint das taktische Zeichen ohne
  sichtbare Verzögerung, auch bei 400 kbit/s kalt; offline im Assistenten und in den Beispielbögen
  vorhanden. Kein Befund.
- **Warmer Start der Einsatzansicht**: mit Service Worker und 6-fach gedrosselter CPU 0,76 s von „Einsatz
  anlegen" bis zur Ansicht, kein Platzhalter sichtbar, Layout-Sprung 0.

## Befunde

### R21-N1 (P0, Bedienung) – Einsatz-Sammlung lässt sich offline nicht öffnen

- **Neu oder alt (Verweis):** neu (Folge des Nachladens der Einsatzansicht aus Runde 20,
  „Startbündel halbiert").
- **Ort:** Startseite → „Öffnen" an einem Einsatz oder „Neue Einsatz-Sammlung…" → „Einsatz anlegen",
  ohne Netz.
- **Beobachtung:** Nach dem ersten vollständigen Laden („✓ Jetzt offline bereit. Funktioniert komplett
  offline", 549 Zusatzdateien im Cache) trenne ich das Netz und lade neu. Die Startseite erscheint,
  der Einsatz steht in der Liste. „Öffnen" zeigt aber „Hier ist etwas schiefgelaufen — Die Ansicht
  ließ sich nicht aufbauen" (Fehlerseite der App). Konsole: `Unable to preload CSS for
  http://localhost:4173/assets/index-Bp0pLAQP.css`. Die Datei gibt es im Build nicht (nur
  `lagemonitor-ui-C1Ho6b0A.css`, das Haupt-CSS steckt inline in `index.html`); online beantwortet der
  Server die Anfrage mit der HTML-Ersatzseite, offline scheitert sie. Gleiches Ergebnis ohne Neuladen,
  wenn die Einsatzansicht in dieser Sitzung noch nie geladen war (Einsatz anlegen nach Netztrennung);
  nur wenn sie vorher einmal online geöffnet wurde, geht es bis zum nächsten Neuladen weiter. „Neu
  laden" und „Zur Startseite" führen immer wieder in denselben Absturz; ein zweiter Versuch scheitert
  gleich. Die Daten bleiben erhalten (Fehlertext sagt es), aber der Einsatz ist unbenutzbar.
- **Erwartung der Rolle:** Der Meldekopf arbeitet im Funkloch weiter, wie es der grüne Kasten
  verspricht: Einsatz öffnen, Einheiten aufnehmen, Lageblatt.
- **Folge:** Wer die App vor der Anfahrt geladen hat und im Einsatz ohne Netz neu startet (Absturz des
  Browsers, Akkuwechsel, neu geöffneter Tab), kann die Einsatz-Sammlung nicht mehr nutzen und muss
  einen Ort mit Netz suchen; bereits erfasste Meldungen sind nicht einsehbar, nichts davon lässt sich
  ausgeben. Die Aussage „Funktioniert komplett offline" ist an dieser Stelle falsch.
- **Empfehlung:** Die nachgeladene Einsatzansicht darf nicht von einer nicht ausgelieferten
  CSS-Datei abhängen; das Laden der Ansicht offline mit Service Worker als feste Prüfung vor jeder
  Auslieferung. Bis dahin den Offline-Hinweis nicht für die Einsatz-Sammlung behaupten.
- **Verifikation:** Startseite öffnen, 15 s warten, Netz trennen, neu laden, „Neue Einsatz-Sammlung…"
  und danach „Öffnen" an einem vorhandenen Einsatz: Ansicht muss erscheinen, Einheit aufnehmen und
  Lageblatt erzeugen müssen offline gehen.

### R21-N2 (P3, Text) – Schnellerfassung: Kopf, Überschrift und Rücklink zählen unterschiedlich

- **Neu oder alt (Verweis):** neu (Folge der Behebung von R20-N3/R19-N3: die Kopfzeile zählt jetzt
  „von 4", die Überschriften nicht).
- **Ort:** Schnellerfassung, 360 x 640, Schritt 2 bis 4.
- **Beobachtung:** „Schritt 2 von 4: Personal" steht über „3. Personal"; „Schritt 3 von 4: Fahrzeuge"
  über „4. Fahrzeuge"; „Schritt 4 von 4: Übersicht" hat keine Zahl, aber der Rücklink heißt „← Zurück
  zu Schritt 4 (Fahrzeuge)", obwohl Fahrzeuge „Schritt 3" war.
- **Erwartung der Rolle:** Eine Zählung.
- **Folge:** Der Helfer fragt sich, ob ein Schritt übersprungen wurde; „Schritt 4" bezeichnet je nach
  Stelle Fahrzeuge oder Übersicht.
- **Empfehlung:** Überschriften und Rücklink wie die Kopfzeile zählen (oder die Zahlen der Überschriften
  weglassen).
- **Verifikation:** Schnellerfassung durchgehen, Kopf, Überschrift und Rücklink je Schritt vergleichen.

### R21-N3 (P3, Bedienung) – Vollassistent: leeres Pflichtfeld „Ort der Einheit" bleibt ohne Hinweis

- **Neu oder alt (Verweis):** alt – Rest von R20-N2 / R19-N4 (die Lage des Felds ist behoben, die
  fehlende Rückmeldung nicht).
- **Ort:** „Neuen Bogen erstellen" → Schritt 1, 360 x 640 und 390 x 844.
- **Beobachtung:** Das Feld „Ort der Einheit (Pflicht)" liegt jetzt im ersten Bildschirm (y = 367). „Weiter"
  ist ohne Ort aktiv; in Schritt 2 trägt der Reiter „1" weder Haken noch „fehlt" (Reiter 3 und 4
  zeigen „fehlt" erst, wenn etwas eingetragen ist). Dass der Ort fehlt, steht erst in der Übersicht
  unter „offene Punkte" (in der Schnellerfassung dagegen sperrt „Weiter" mit „Ort der Einheit fehlt").
- **Erwartung der Rolle:** Dieselbe Rückfrage wie in der Schnellerfassung oder ein „fehlt" am Reiter.
- **Folge:** Der Bogen wird ohne Ort bis zur Übergabe getragen und erst dort bemerkt.
- **Empfehlung:** Reiter „1" mit „fehlt" kennzeichnen, solange der Ort leer ist, oder „Weiter" wie in der
  Schnellerfassung rückfragen lassen.
- **Verifikation:** Assistent öffnen, ohne Ort „Weiter" tippen, Reiter „1" lesen.

### R21-N4 (P3, Layout) – Erste Einheitenkarte erst nach rund 1140 px

- **Neu oder alt (Verweis):** alt – R20-W6/H5/G6 („nicht ganz erreicht").
- **Ort:** Einsatz-Seite nach der Aufnahme von vier Einheiten, 360 x 640 (Tabelle bei 1140 px).
- **Beobachtung:** Über der Liste stehen Kennzahlen, vier Aufnahmeknöpfe, die Quittung „Zuletzt
  abgelegt", „Neu seit der letzten Kenntnisnahme", Sprunglinks, „Suchen, sortieren, filtern" und die
  Legende. Die erste Karte beginnt bei y = 1141, bei 390 x 844 bei rund 1100 px; sichtbar sind nach dem
  Öffnen nur die Kennzahlen und die Knöpfe.
- **Erwartung der Rolle:** Nach dem Einlesen sehe ich die Einheiten.
- **Folge:** Nach jeder Aufnahme zwei Bildschirme scrollen, um zu prüfen, was angekommen ist.
- **Empfehlung:** Quittung und Aufnahmeknöpfe verdichten (Quittung nur in der Leiste), Liste vor die
  Blöcke „Neu seit …" und „Suchen, sortieren, filtern".
- **Verifikation:** Vier Einheiten aufnehmen, Lage der ersten Karte messen (Ziel: im ersten Bildschirm).

### R21-N5 (P3, Layout) – Einsatzansicht beim Nachladen: leere Seite ohne Kopf, Höhensprung

- **Neu oder alt (Verweis):** neu (Folge des Nachladens der Einsatzansicht).
- **Ort:** „Einsatz anlegen" oder „Öffnen" bei langsamem Netz oder vor dem ersten vollständigen Laden.
- **Beobachtung:** Bei 400 kbit/s (kalter Start) zeigt die Seite 1,7 s lang nur eine leere Fläche mit
  Fußbereich („Daten", „Rechtliches"), ohne Einsatzname, „‹ Startseite" und Ladehinweis (der
  Ladezustand ist nur für Hilfstechnik gekennzeichnet). Danach springt die Seitenhöhe von 1921 auf
  3654 px, gemessene Layout-Verschiebung 0,30. Mit warmem Service Worker tritt das nicht auf (0 s
  sichtbar, Verschiebung 0).
- **Erwartung der Rolle:** Name und Zurück-Knopf sind sofort da, ein sichtbares „lädt …".
- **Folge:** Im Funknetz mit schlechter Verbindung sieht der Helfer eine leere Seite und tippt
  mehrfach oder verlässt sie.
- **Empfehlung:** Kopf mit Einsatzname und Zurück-Knopf sofort rendern, die Platzhalterfläche mit einem
  sichtbaren Text („Einsatzansicht wird geladen …") füllen.
- **Verifikation:** Netz auf 400 kbit/s drosseln, Service Worker aus, „Einsatz anlegen": Name und
  Ladetext sofort sichtbar, kein Höhensprung.

### R21-N6 (P3, Text) – Fachwörter der Sammlung ohne Erklärung

- **Neu oder alt (Verweis):** alt – R20-N5 (R19-N7).
- **Ort:** Einsatz-Seite (Blöcke über der Liste, Tabellenfuß, Bedarfszeile).
- **Beobachtung:** Weiter zu lesen sind „Summe (4 zählend)", „Neu seit der letzten Kenntnisnahme (3)",
  „Bedarf: Verpflegung: keine angefordert (9 Personen vor Ort) · bei 3 Einheiten nicht erfasst",
  „bedarf nicht erfasst" an jeder Karte. Die Zeile sagt in einem Satz „keine angefordert" und „nicht
  erfasst"; „zählend" erklärt nur die Legende unter der Tabelle.
- **Erwartung der Rolle:** Wörter vom Funk: „anwesend", „gesehen", „kein Bedarf gemeldet".
- **Folge:** Der Helfer fragt, ob „keine angefordert" heißt, dass nichts gebraucht wird, oder dass nichts
  gemeldet wurde.
- **Empfehlung:** „Summe (4 anwesend)", „Neu seit dem letzten Mal", Bedarfszeile in einem Satz
  („Verpflegung: bei 3 von 3 Einheiten nicht gemeldet").
- **Verifikation:** Sammlung ohne Anleitung lesen lassen und die Begriffe deuten lassen.

### R21-N7 (P3, Text) – Notweg „Nicht gelöscht" nennt andere Wege als die angebotenen

- **Neu oder alt (Verweis):** alt – R20-N9 (Rest nach der Behebung von R20-W1).
- **Ort:** „Einsatz löschen…" → „In den Papierkorb" bei vollem Speicher, 320 und 390 px.
- **Beobachtung:** Der Text lautet „Der Speicher ist voll, der Papierkorb leer — der Einsatz ist nicht
  gelöscht. Erst sichern … Platz schafft dann „Entfernen" bei einer Einheit (mit „Endgültig entfernen"
  in der Rückfrage), zuletzt „Alle Daten löschen" (nach der Sicherung)." Der Knopf „Endgültig
  löschen…" darunter, der den Einsatz selbst entfernt, kommt im Text nicht vor; die Belegung (wie viel
  frei werden muss) wird nicht genannt.
- **Erwartung der Rolle:** Der Text beschreibt die Knöpfe, die darunter stehen.
- **Folge:** Der Helfer sucht „Entfernen" bei einzelnen Einheiten, obwohl „Endgültig löschen…" in einem
  Tipp erreichbar ist.
- **Empfehlung:** Text auf die drei Knöpfe abstimmen, Belegung nennen.
- **Verifikation:** Speicher füllen, Dialog lesen, jeden genannten Weg ausführen.

## Hinweise (keine Priorität)

- **H1 – Grammatik:** Rückfrage „„Hochwasser Elbe" endgültig löschen?" sagt „1 Meldung sind danach
  weg" (Einzahl mit „sind").
- **H2 – Vorschlagsliste verdeckt das Folgefeld:** Im Assistenten bleibt die Ortsliste nach der Eingabe
  offen und liegt über „Einheitstyp"; ein Tipp auf das verdeckte Feld bewirkt nichts sichtbar, die
  Liste verschwindet erst nach Auswahl oder Tab. Der Hinweis „kann mehrere Ortsverbände meinen" ist
  hilfreich, das Verhalten Geschmackssache.
- **H3 – Übergabe-Dialog zeigt „✓ PDF gespeichert" sofort:** Nach „PDF herunterladen" in der
  Übersicht und anschließendem Öffnen von „Bogen übergeben…" steht die Erfolgsmeldung schon im frisch
  geöffneten Dialog, ohne dass dort „PDF erzeugen" getippt wurde.
- **H4 – Dateinamen:** „eeb" im Namen (`…eeb-einsatz-sammel-pdf_…`, `…eeb_THW_Oldenburg_….pdf`) erklärt
  sich nur dem Entwickler; die Excel-Datei heißt `…eeb-einsatz-oldenburg_Hochwasser_Elbe.xlsx`
  („Oldenburg" ist das Format, nicht der Ort). Die fünf Einsatzdateien sind aber untereinander
  unterscheidbar (Rest von R20-N8).
- **H5 – Scanner ohne Kamera:** Der Dialog hat keine Überschrift und nur „Fertig" zum Verlassen (Rest
  von R20-H3); die Aufgabe geht über „QR aus Bild einlesen…".

## Aufgabe

- **Aufgabe geschafft:** mit Umwegen (online ja; Einsatz-Sammlung offline nein, R21-N1)
- **Fremde Hilfe nötig:** nein (offline: Netz suchen)
- **Größtes Missverständnis:** „Funktioniert komplett offline" gilt für Bogen und PDF, nicht für die
  Einsatz-Sammlung.
- **Größtes Einsatzrisiko:** Der Meldekopf startet im Funkloch neu und kommt nicht mehr an seine
  Einsatz-Sammlung (R21-N1).
- **Top-Priorität für die nächste Iteration:** Einsatzansicht offline öffnen können (fehlende
  CSS-Abhängigkeit im nachgeladenen Teil beheben und offline automatisiert prüfen, R21-N1).
