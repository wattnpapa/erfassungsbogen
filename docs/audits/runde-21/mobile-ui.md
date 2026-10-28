# Audit „Mobile UI", Runde 21 (Darstellung und Bedienung auf dem Telefon)

Prüfer: Rollenaudit `mobile-ui-reviewer` · Datum: 2026-10-29 · Prüfgegenstand: Web-App unter
`http://localhost:4173` (`vite preview`, Code-Stand Commit `f007590` = `main`) ·
Zählung: **P0 0 · P1 1 · P2 0 · P3 5 · Hinweise 5**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md`, der Abschnitt
„Stand der Behebung" in `runde-20/README.md` und `runde-20/mobile-ui.md`. Offene und „nicht ganz
erreichte" Punkte sind gemeldet, soweit sie im Browser noch zu sehen sind (mit alter Befund-ID).

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen), `isMobile`,
`hasTouch`, Locale de-DE. Viewports 390 x 844, 360 x 640, 320 x 568, quer 640 x 360 und
568 x 320; Ansichten „Standard" und „Feld". Zustand: Sammlung „Hochwasser Test" mit fünf Bögen aus
`examples/thw/` (über „Bögen einlesen…" aufgenommen; sie gelten als Übung und als „Stand vor 103
Tagen", das ist kein Befund). Netz: Playwright `setOffline`, CDP-Drosselung (1,6 Mbit/s, 150 ms) und
verzögerte Antworten einzelner Dateien. Dazu das Cache-Verhalten des Service Workers (Cache-Namen,
Schlüssel, Antwort der Server-Pfade). Gemessen: seitlicher Überlauf (keiner in allen Viewports,
keine Konsolenfehler außer unten genannt), Bedienziele unter 44 px (keine bis auf Kontrollkästchen mit
44 px großem Beschriftungsfeld), Schriften unter 12 px (keine), Lage der Fußleisten, Höhe und
Innenrollen der Dialoge, Layout-Verschiebungen. Nicht prüfbar: echte Bildschirmtastatur,
Safe-Area, WebKit, Kamera, Handschuhe, Licht, echter Auslieferungsserver.

## Behebungen der Runde 20, die im Browser halten (nicht gemeldet)

- Bogen bei vollem Speicher (`localStorage` bis zum Quota-Fehler gefüllt): Schließen, Ersetzen
  („Neuen Bogen erstellen") und Zurückholen bei vorhandenem Entwurf lassen den Bogen nicht mehr
  verschwinden; Entwurf und Ablage bleiben nach der Handlung als Schlüssel vorhanden
  (`eeb.entwurf.v1`, `eeb.entwurf.ersetzt.v1`). Den Fehlerfall (Ablage passt nicht mehr) konnte ich
  nicht herbeiführen, weil die Ablage nie größer wurde als der freigegebene Entwurf.
- „Einsatz löschen…" bei vollem Speicher: „Nicht gelöscht", „Endgültig löschen…" fragt danach noch
  einmal („Ja, endgültig löschen", mit Hinweis auf den fehlenden Export) und löscht nichts sofort. Die
  Tipp-Sperre von 1,3 s greift auf dem ersten Knopf.
- Schnellerfassung: „THW Oldenburg" als Ort ergibt die Zeile „THW · (Einheitstyp offen) · Oldenburg"
  und die Karte „Nr. 6 THW Oldenburg", kein „THW THW". „Ort der Einheit ändern…" liegt unter „Mehr…",
  öffnet ein Fenster mit vorbelegtem Feld und 58 px hohen Knöpfen. Schrittzählung „Schritt 1 bis 4 von 4".
- Scanner ohne Kamera quer (568 x 320 „Feld", 640 x 360, 360 x 640, 320 x 568): kein Innenscrollen,
  Anleitung vollständig, „QR aus Bild einlesen…" und „Fertig" im Bild.
- Assistent quer: Schrittleiste in der Kopfzeile, Fußleiste 56 bis 65 px, Inhalt rund 63 % der Höhe.
- Dialoge bei 320 x 568: „Alle Daten löschen" (Knöpfe bei 419 und 487 px), „Neue Einsatz-Sammlung…",
  „Geräteschlüssel neu erzeugen" und „Beispielbögen" passen mit allen Aktionsknöpfen ins Bild.
- Tabelle am Telefon: Einheit, Stärke, Eingetroffen, Bedarf ohne Wischen bei 360 und 390;
  „Alle Spalten" wischt im eigenen Rahmen mit Hinweis.
- „Warum?" und „Anderer Einsatz? Prüfen ▸": 44 px hohe Bedienziele; der Chip klappt die Karte auf und
  rollt den Hinweis ins Bild.
- Kein seitlicher Überlauf, keine Bedienziele unter 44 px (außer Kontrollkästchen mit Beschriftungsfeld).

## Nachgeladene Teile: Wirkung beim Laden und offline

- **Zeichensammlung:** Taktische Zeichen erscheinen im ersten Durchgang des Fahrzeugschritts, auch
  offline und nach Neuladen; der Platzhalter hält die Zeile (Bild 36 px hoch von Beginn an), keine
  Verschiebung durch das Zeichen.
- **Einsatzansicht, Netz da:** Bei 1,6 Mbit/s steht die Platzhalterfläche etwa 0,5 s, dann die Ansicht;
  siehe aber R21-M2 (sehr langsame Verbindung) und H1 (Sprung von der Startseite).
- **Einsatzansicht, kein Netz:** funktioniert **nicht** (R21-M1). Mit einer von Hand ersetzten leeren
  CSS-Antwort für die eine fehlende Datei laufen dagegen alle weiteren nachgeladenen Teile offline
  (Einsatzansicht, „Einheit manuell erfassen…", „Bögen einlesen…", Lagemonitor-Block, Neuladen im
  Offline-Zustand, Zeichen). Der Fehler hat also genau eine Ursache.
- **Bogen offline:** Startseite, „Neuen Bogen erstellen", alle sechs Schritte, Fahrzeuge mit
  Zeichen und „Einheit schnell erfassen" laufen offline, auch nach Neuladen im Offline-Zustand und
  schon in der Sekunde, in der „Bogen, PDF, QR-Code und Empfang gehen offline" erscheint.

## Befunde

### R21-M1 [P1] Einsatzansicht lässt sich ohne Netz nicht öffnen: „Hier ist etwas schiefgelaufen" wegen fehlender CSS-Datei

**Typ:** Bedienung
**Neu oder alt (Verweis):** neu (Folge des Nachladens der Einsatzansicht in Runde 20)

**Ort:** Startseite → „Öffnen" einer Sammlung, „Neue Einsatz-Sammlung…" → „Einsatz anlegen", jeder
Neustart mit zuletzt geöffneter Sammlung; 390 x 844 und 360 x 640. Gilt für alle Viewports.

**Beobachtung:** Nach „✓ Jetzt offline bereit" (Service Worker `activated`, 110 Einträge im
Precache-Cache, 550 in `eeb-zusatz`), Netz getrennt und Neuladen: Eine vorhandene Sammlung zeigt
statt der Einsatzansicht den Fehlerschirm „Hier ist etwas schiefgelaufen — Die Ansicht ließ sich nicht
aufbauen". Konsole: `Unable to preload CSS for http://localhost:4173/assets/index-Bp0pLAQP.css`.
Ebenso offline „Neue Einsatz-Sammlung…" → „Einsatz anlegen": die Sammlung wird geschrieben
(`eeb.einsaetze.v1`), die Ansicht stürzt ab. Ursache: Die Datei `index-Bp0pLAQP.css` gibt es in `dist/`
nicht (das Build-Plugin `eeb-font-css-inline` in `vite.config.ts` fügt das CSS in `index.html` ein und
entfernt die Datei), aber das nachgeladene Paket `einsaetze-ui-Ca8VFLhR.js` fordert sie weiter als
Abhängigkeit an; sie steht auch nicht im Precache. Online fällt das hier nur nicht auf, weil
`vite preview` für den unbekannten Pfad die Startseite mit Status 200 zurückgibt. Mit einer 404-Antwort
für diese eine Datei (so antwortet ein statischer Server; `dist/404.html` legt diesen Fall nahe) stürzt
die Einsatzansicht auch **mit** Netz ab (nachgestellt, nicht an einem echten Server geprüft).
Bogen ausfüllen, Scannen, Schnellerfassung und der Rest der Startseite laufen offline weiter.

**Folge:** Das Meldekopf-Gerät kann ohne Netz keine Sammlung öffnen oder anlegen, genau die Lage, für
die „funktioniert komplett offline" auf der Startseite und im Hinweis „Empfang geht offline" steht. Die
Daten bleiben erhalten, der Fehlerschirm erklärt das; einen Weg zur Lage gibt es aber nur über Netz
oder „Daten sichern". Auf einem Server mit 404 wäre auch der Online-Betrieb betroffen.

**Empfehlung:** Dafür sorgen, dass das Nachladepaket keine nicht mehr vorhandene CSS-Datei anfordert
(entfernte Datei auch aus den Abhängigkeiten nehmen oder die Datei mit ausliefern und precachen) und
den Prüfstand (Neuladen im Offline-Zustand, dann Einsatzansicht öffnen) in die Abnahme aufnehmen.
Abnahme gegen einen Server, der unbekannte Pfade mit 404 beantwortet.

**Nachprüfung:** Nach „Jetzt offline bereit" Netz trennen, Neuladen, Sammlung öffnen und neue anlegen:
Einsatzansicht erscheint; keine Anfrage an `index-*.css`; auch mit 404 für fehlende Dateien.

### R21-M2 [P3] Beim langsamen Nachladen steht eine leere weiße Fläche ohne Kopf, Rückweg und sichtbare Ladeanzeige

**Typ:** Bedienung
**Neu oder alt (Verweis):** neu

**Ort:** Einsatzansicht, 390 x 844, Platzhalter `einsatz-laedt` (Antwort auf `einsaetze-ui-*.js` um
4 s verzögert, Service Worker aus; entspricht dem ersten Laden auf schwachem Netz).

**Beobachtung:** Das Bild zeigt oben eine leere weiße Fläche von 591 px Höhe, darunter die Fußzeile der
Startseite („Daten", „Rechtliches"). Weder „‹ Startseite" noch „Hochwasser Test" noch ein Wort wie
„Lädt…" sind zu sehen; der Ladezustand ist nur für Hilfstechnik gekennzeichnet (`aria-label`). Bei
1,6 Mbit/s dauert das etwa 0,5 s, bei schwacher Verbindung entsprechend länger.

**Folge:** Der Helfer sieht eine leere Seite, ohne Rückweg, und kann nicht wissen, ob die App hängt oder
lädt; er lädt womöglich neu.

**Empfehlung:** In der Platzhalterfläche den Kopf mit „‹ Startseite" und dem Sammlungsnamen sowie
ein sichtbares „Einsatzansicht lädt…" zeigen.

**Nachprüfung:** Antwort auf `einsaetze-ui-*.js` um 4 s verzögern: Name der Sammlung, Rückweg und
Ladehinweis stehen im Bild.

### R21-M3 [P3] Schnellerfassung: Schrittzähler „Schritt 2 von 4", Überschrift und Fenster sagen „3. Personal" und „4. Fahrzeuge"

**Typ:** Text
**Neu oder alt (Verweis):** teilweise alt (R20-A2, W3, H3, K4, N3: Zählung im Kopf behoben, Rest steht)

**Ort:** Schnellerfassung (aus der Einsatzansicht), 360 x 640; Kopf, Abschnittsüberschrift und das
Fenster „Stärke fehlt".

**Beobachtung:** Kopf: „Schritt 2 von 4: Personal", die Überschrift darunter „3. Personal"; Schritt 3
heißt im Kopf „Schritt 3 von 4: Fahrzeuge" und darunter „4. Fahrzeuge". Das Fenster „Stärke fehlt"
sagt „Springt zu „3. Personal"." — einen dritten Schritt gibt es in dieser Ansicht nicht.

**Folge:** Zwei Zahlen für denselben Schritt; der Hinweis „Springt zu …" verweist auf einen Schritt, den
es hier so nicht gibt.

**Empfehlung:** In der Schnellerfassung die Nummern der Überschriften und des Fensters an die
Zählung „von 4" anpassen oder weglassen.

**Nachprüfung:** Schnellerfassung durchgehen: Kopfzeile, Überschrift und Fenstertext nennen dieselbe
Nummer.

### R21-M4 [P3] Assistent quer 568 x 320 „Feld": „Ort der Einheit (Pflicht)" liegt zur Hälfte unter der Fußleiste

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** alt (R20-N2)

**Ort:** „Neuen Bogen erstellen", Schritt 1 „Einheit", 568 x 320 und 640 x 360 in „Feld" (in
„Standard" liegt das Feld bei 214 bis 258 px, Fußleiste ab 264, passt).

**Beobachtung:** Feld „Ort der Einheit" 238 bis 291 px, Fußleiste beginnt bei 255 px (bei 640 x 360:
Feld 238 bis 291, Fußleiste ab 295, dort knapp frei). Im Bild sieht man nur die obere Hälfte des
Pflichtfelds, die Fußleiste mit „◐ Ansicht" und „Weiter →" steht davor.

**Folge:** Das erste Pflichtfeld muss vor der Eingabe erst ins Bild gewischt werden.

**Empfehlung:** Im niedrigen Querformat in „Feld" die Felder „Organisation" und „Organisationsname"
untereinander lassen und den Abstand verkleinern, oder das Feld „Ort der Einheit" an erste Stelle setzen.

**Nachprüfung:** `bottom` von „Ort der Einheit" kleiner als `top` der Fußleiste bei 568 x 320 „Feld".

### R21-M5 [P3] Einsatzansicht: Die erste Einheitenkarte liegt 1,1 bis 1,6 Bildschirme unter dem Kopf

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** alt (R20-W6, H5, G6)

**Ort:** Einsatzansicht mit fünf Einheiten, Oberkante der ersten Karte: 390 x 844 1101 px (Feld 1346),
360 x 640 1089 px (Feld 1360), 320 x 568 1168 px (Feld 1430).

**Beobachtung:** Zwischen Kopf und Liste liegen die Kennzahlen, vier Aufnahmeknöpfe, „Neu seit der
letzten Kenntnisnahme", die Links „Weitergeben…" und die Überschrift „Einheiten" mit
Karten/Tabelle-Wechsel, den Filterlinks und „Suchen, sortieren, filtern". Bei 390 x 844 steht im
ersten Bild keine Einheit.

**Folge:** Wer die Lage sehen will (Wer ist da?), muss auf jedem Telefon erst weiter als einen Bildschirm
wischen.

**Empfehlung:** Aufnahmeknöpfe in eine Zeile oder eine ausklappbare Gruppe fassen und die Karten vor die
Filter- und Weitergabezeilen setzen.

**Nachprüfung:** Oberkante der ersten Karte unter 960 px bei 390 x 844.

### R21-M6 [P3] Tabelle bei 320 px: Bedarfsspalte rechts abgeschnitten, „Technische / r Zug" bricht mitten im Wort

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** alt (R19-N8, in Runde 20 für 360 px behoben)

**Ort:** Einsatzansicht → „Tabelle", Kernspalten, 320 x 568 (Standard und Feld).

**Beobachtung:** Der Rahmen ist 298 px breit, der Inhalt 306 px; „Diesel 80 l", „Benzin 80 l" und
„Diesel 180 l" stoßen am rechten Rand an und sind dort angeschnitten (nur durch kurzes seitliches
Wischen lesbar, ohne Hinweis in den Kernspalten). Der Einheitsname bricht in „Technische" / „r Zug".
Bei 360 und 390 px passt alles.

**Folge:** Der Bedarf, die Spalte für die Meldung an den Meldekopf, ist bei 320 px abgeschnitten.

**Empfehlung:** Spaltenbreiten bei 320 px so setzen, dass der Inhalt in den Rahmen passt, und
Einheitsnamen nur an Leerzeichen oder Silbentrennung umbrechen.

**Nachprüfung:** `scrollWidth` des Tabellenrahmens höchstens `clientWidth` bei 320 px; kein
Wortbruch ohne Trennstrich.

## Hinweise (ohne Priorität)

- **H1 (Layout, neu):** Beim Neustart mit zuletzt geöffneter Sammlung steht zuerst die statische
  Startseite (bei 1,6 Mbit/s etwa 0,5 bis 2 s), dann springt das Bild in die Einsatzansicht
  (Layout-Verschiebung 0,3 beim Wechsel). Geschmacks- und Gewöhnungsfrage; ein Tipp während dieses
  Fensters geht ins Leere (Startseite noch ohne App).
- **H2 (Layout, alt R20-M4):** Einsatzansicht quer 568 x 320: „Bogen scannen…" beginnt bei 240 px
  („Feld": 269 px) von 320, die Aufnahmeknöpfe stehen im unteren Viertel; nur ein Teil im ersten Bild.
- **H3 (Text, neu):** Assistent quer 568 x 320 „Feld": die Fußleiste trägt „◐ Ansicht" ohne die
  Angabe der gewählten Ansicht („Feld"); die Beschriftung der Startseite lautet „Ansicht: Feld".
- **H4 (Layout, alt R20-M5):** Dialog „Datensicherung" bei 320 x 568 und 360 x 640 rollt im Dialog
  (842 auf 534 px); „Sicherung erstellen…" liegt bei 449 px im Bild, „Dauerhaften Speicher
  anfragen" erst nach dem Wischen.
- **H5 (Text, neu):** „Alle Daten löschen" trägt oben „Schließen" und unten „Abbrechen" mit gleicher
  Wirkung; zwei Wörter für dasselbe.
