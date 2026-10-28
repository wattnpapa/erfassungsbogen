# Audit „Nacht und Sicht", Runde 18 (Dunkelheit, Blendung, Sonnenlicht, Farbcodierung)

Prüfer: Rollenaudit `thw-night-visibility-reviewer` · Datum: 2026-10-27 ·
Zählung: **P0 0 · P1 0 · P2 0 · P3 4**

Prüfgegenstand: Web-App, Produktionsbuild auf `http://localhost:4173`, Code-Stand Commit `ae3a8e9`
(`main`, nach Behebung der Runde 17). Reiner Prüfbericht, keine Codeänderung.

Gelesen vor dem Lauf: [docs/audits/README.md](../README.md), „Stand der Behebung" in
[runde-17/README.md](../runde-17/README.md) und [runde-17/nacht-und-sicht.md](../runde-17/nacht-und-sicht.md).
Es gibt keine „bekannten Grenzen": Auch früher als teilweise oder offen geführte Punkte werden gemeldet,
wenn sie im Browser noch zu beobachten sind.

## Prüfaufbau

Chromium über Playwright (`chromium.launch()` ohne Optionen, globales playwright-Modul, da die
Projektkopie keinen Browser fand), Locale de-DE, `isMobile`/`hasTouch`, Viewports 360 × 640 und
390 × 844, alle vier Ansichten (Standard, Dunkel, Feld, Nacht) über `eeb.anzeigemodus.v1`.
Zustand: Sammlung „Hochwasser Nord" (Art Einsatz und Art Übung), sechs Bögen aus `examples/thw/`
über „Bögen einlesen…" eingelesen.

Gemessen wurde je Zustand: Kontrast jedes sichtbaren Textknotens gegen die tatsächlich darunterliegende
Fläche (Deckkraft eingerechnet, WCAG-Formel, deaktivierte Elemente gesondert), Platzhalter
(`::placeholder`), Schrift unter 12 px, waagerechtes Rollen und Zielgrößen unter 44 px. Zustände:
Startseite, Einsatzansicht, Liste, aufgeklappte Karte, „Mehr…", Abrücken-Quittung, „Entfernen"-Rückfrage,
Karten/Tabelle, „Suchen, sortieren, filtern", „Ort eintragen…", „Bogen scannen…", „Einheit manuell
erfassen…", „Einheit schnell erfassen…", „Bögen einlesen…", „Einsatz weitergeben / sichern" (mit laufender
PDF-Erzeugung), „Einsatz löschen…", Lagemonitor-Fenster samt Helligkeitsstufen, Ansichtswahl, „Neue
Einsatz-Sammlung…", „Alle Daten löschen", Datensicherung, Beispielbögen, Geräteschlüssel,
Impressum, Datenschutz, Name/Kontakt, „QR-Code scannen…", „Aus Datei laden…", „Einsatz importieren…",
Bogen Schritt 1 bis 5, sowie acht statische Seiten (Anleitung, Meldekopf, Datenschutz, Impressum, Übersicht,
THW, Vorlage, Autor) in Dunkel, Feld und Nacht. Bildschirmfotos für Nacht habe ich angesehen.

**Nicht prüfbar:** echtes Licht (Sonne, Scheinwerfer, Rotlicht), Displayhelligkeit, Kamerabild im Dunkeln
(keine Kamera; der Scanner zeigt die Ausweichansicht), die nativen Auswahlfenster des Betriebssystems
(Datum/Uhrzeit im Lagemonitor-Bereich; die Eingabe zeigt in dieser Umgebung „mm/dd/yyyy", das ist die
Browsersprache der Prüfumgebung, nicht die App), native Fassungen, Ausdruck, Rot-Grün-Schwäche am echten Auge
(geprüft nur, dass Zustände Wort oder Form tragen).

## Urteil

Kontrast und Codierung halten: In allen vier Ansichten, beiden Viewports und allen genannten Zuständen der
Hauptoberfläche liegt kein sichtbarer Text unter 4,5 : 1; Platzhalter, Dialoge, Scanner und statische Seiten
sind ohne Befund, die Seite rollt nie waagerecht. Zustände tragen Wort oder Form („✓ Abgerückt",
„⚠ Stand vor 102 Tagen", „ÜBUNG", „neu", „älter als 24 h"). Nacht bleibt warm und dunkel, die Systemeinstellung
„dunkel" wird ohne Ansichtswahl übernommen, beim Neuladen blitzt keine helle Fläche auf, die Browserleiste
(`theme-color`) folgt in Nacht. Ansichtswechsel unterbricht keinen Vorgang. Übrig sind vier kleine Punkte.
Die Aufgabe ist ohne fremde Hilfe machbar.

## Prüfung der Behebungen aus Runde 17

| Befund | Ergebnis |
| --- | --- |
| R17-L1 deaktivierte Knöpfe (Dimmung 0,4) | hält in der Hauptoberfläche: „← " in Bogen Schritt 1 und „Einsatz anlegen" mit Deckkraft 1 und eigenem Rand, in allen vier Ansichten über 4,5 : 1 (Standard 92/100/120 auf 232/235/242, Nacht 162/151/126 auf 34/31/22); „Einsatz anlegen geht erst, wenn das Feld „Name" ausgefüllt ist." und „„Endgültig löschen" geht erst, wenn der Haken gesetzt ist." stehen als Text. Offen bleibt die Lagemonitor-Variante (R18-L3) |
| R17-L2 Einsatzname im Kopf der Erfassung | hält: bei 360 px umbricht „‹ Einsatz „Hochwasser Nord"" auf zwei Zeilen, keine Kürzung mit „…" |
| R17-H7/K6/G5 Quittungsleiste, G4/M3 Fußleiste | hält: Fußleiste 57 px (583 bis 640 bei 640 px Höhe), „Abgerückt 00:16: … Rückgängig ✕" als eine Leiste unten, Kontrast über 4,5 : 1 |
| R17-E5/O2/S10/W5 Neuladen | hält: aufgeklappte Karte bleibt nach Neuladen offen (`eeb.karte-offen.v1`) |
| Zurück-Geste | hält: von der Einsatzansicht zur Startseite |
| R17-E2/D6 Papierkorb | hält: „Meldung entfernen" bleibt nach Neuladen als „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar" |
| Doppeltipp | hält: zwei Tipps im Abstand von 120 ms auf „Meldung entfernen" entfernen eine Meldung (5 von 6 bleiben), der erste Tipp kurz nach dem Öffnen der Rückfrage wird mit „Einen Moment …" verworfen und sichtbar quittiert |
| R17-H8/K7/G7 Tabelle am Telefon | hält bei Breite: 326 px bei 360, 356 px bei 390, kein Rollen der Seite; offen bleibt die Schriftgröße (R18-L1) |

## Befunde

### R18-L1 (P3) Tabelle der Einsatzansicht: Kopfzeile in 11 px, Marke „ÜBUNG" in 10 px

- **Ort:** Einsatzansicht → „Tabelle", 360 × 640 und 390 × 844, alle vier Ansichten.
- **Beobachtung:** Die Kopfzellen „EINHEIT", „GES.", „MELDUNG VOR", „BEDARF" sind 11 px groß, die Marke
  „ÜBUNG" in jeder Zeile 10 px (Nr. und Name der Einheit 12 px). Kontrast ist ausreichend (Standard 4,96 : 1,
  Nacht 5,69 : 1, Feld 11,0 : 1; Marke 7,5 bis 8,2 : 1); die Größe ist es, die bei Sonne oder schlechtem Licht
  zählt. Die Karten zeigen dieselbe Marke größer.
- **Folge:** Wer die Tabelle nachts oder bei Sonne liest, erkennt „ÜBUNG" (nicht gezählt) schlechter als auf der
  Karte. Gering, weil Spalten und Name lesbar bleiben und die Karte dieselbe Aussage trägt.
- **Empfehlung:** Kopfzeile und Marke in der Tabelle mindestens so groß wie die Karten-Beschriftung halten
  (12 px und mehr).
- **Neu oder alt (Verweis):** neu, Variante von R11-M2 und R12-M2 (kleine Tabellen- und Kachelschrift) sowie
  R17-H8/K7/G7 (Tabelle am Telefon); dort wurde Breite behoben, nicht Schriftgröße.
- **Nachprüfung:** Tabelle bei 360 und 390 px in allen Ansichten öffnen: keine Schrift unter 12 px.

### R18-L2 (P3) Scanner ohne Kamera: Knopfleiste verdeckt beim Öffnen „Hinweise zum Handscanner"

- **Ort:** Einsatzansicht → „Bogen scannen…", Ausweichansicht ohne Kamera, 360 × 640 (alle vier Ansichten);
  bei 390 × 844 passt alles ins Bild.
- **Beobachtung:** Der Inhalt ist 726 px hoch in einem 640-px-Fenster. Die Zeile „▸ Hinweise zum Handscanner"
  liegt bei y 527 bis 571, die Knopfleiste mit „Kamera erneut versuchen" bei y 532 bis 576 und darunter
  „QR aus Bild einlesen…", „Fertig" bei y 584 bis 628. Beim Öffnen deckt „Kamera erneut versuchen" die Aufklappzeile
  fast vollständig ab (sichtbar bleibt „▸ … er"). Erst nach Scrollen im Fenster steht sie frei.
- **Folge:** Wer nachts den Handscanner einrichten will, sieht die Hilfe nicht und tippt eher auf den
  darüberliegenden Knopf „Kamera erneut versuchen". Gering, weil die Hilfe nur ergänzt.
- **Empfehlung:** Die Aufklappzeile nicht unter der Leiste liegen lassen (Leiste kompakter oder Zeile oberhalb des
  scrollenden Bereichs), oder die Überdeckung durch Abstand unten im Fenster vermeiden.
- **Neu oder alt (Verweis):** alt – R16-M3 (bei 320 × 568 gemeldet), R17 nennt ihn nicht als behoben;
  bei 360 × 640 weiter zu beobachten.
- **Nachprüfung:** Scanner ohne Kamera bei 360 × 640 öffnen: „Hinweise zum Handscanner" ist ohne Scrollen
  vollständig sichtbar und nicht von einem Knopf überdeckt.

### R18-L3 (P3) Lagemonitor-Fenster: deaktivierte Stufenknöpfe „Dunkler" und „Heller" bei 2,2 bis 2,9 : 1

- **Ort:** Einsatzansicht → „Lagemonitor öffnen" → zweites Fenster, Leiste „Stufe: …" unten, 360 × 640.
- **Beobachtung:** An den Enden der Helligkeitsskala ist der Knopf mit Deckkraft 0,45 gedimmt und mit
  gestricheltem Rand versehen: „Dunkler" bei „Stufe: Gedimmt" 2,23 : 1, „Heller (weiß)" bei „Stufe: Dunkel"
  2,94 : 1. Der Grund (Anschlag erreicht) steht nirgends als Text; „Stufe: …" nennt nur den Ist-Zustand.
- **Folge:** Bei Sonne oder geringer Helligkeit wirkt der Knopf wie „nicht vorhanden" oder „defekt", ein Helfer
  tippt wiederholt auf ihn. Gering, weil der Fernseher ohnehin in Ruhe eingestellt wird.
- **Empfehlung:** Den Anschlag als Text nennen („Heller (weiß)" – „schon am Ende") und den Knopf über etwa 4,5 : 1
  lassen, wie in der Hauptoberfläche.
- **Neu oder alt (Verweis):** alt, Variante von R17-L1 (deaktivierte Knöpfe, Deckkraft); die Hauptoberfläche ist
  behoben, das Lagemonitor-Fenster nicht.
- **Nachprüfung:** Lagemonitor öffnen, Stufe an beiden Enden einstellen: deaktivierter Knopf mindestens 4,5 : 1
  oder Anschlag als Text.

### R18-L4 (P3) „Gehört zu dieser Lage" ist 31 px hoch

- **Ort:** Einsatzansicht, aufgeklappte Karte mit Warnung „⚠ Bogen nennt: …, passt das zu dieser Lage?", 360 × 640.
- **Beobachtung:** Der Knopf misst 141 × 31 px, alle übrigen Knöpfe der Karte 44 px oder mehr („ändern" 44 × 47,
  „Details", „Abrücken", „Mehr…" 44 hoch). Gemessen in Nacht; die Größe hängt nicht an der Ansicht.
- **Folge:** Mit Handschuhen oder bei schlechter Sicht wird der kleinere Knopf verfehlt oder die Zeile darüber
  getroffen; er quittiert eine Fachfrage zur Lage. Gering, die Aktion ist umkehrbar.
- **Empfehlung:** Auf dieselbe Mindesthöhe wie die übrigen Knöpfe bringen.
- **Neu oder alt (Verweis):** neu (Verweis R17-H9/G8: Verweise 17 px hoch, dort auf 44 px gebracht; dieser Knopf
  war nicht erfasst).
- **Nachprüfung:** Karte mit Lagewarnung aufklappen: „Gehört zu dieser Lage" mindestens 44 px hoch.

## Schluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** keines beobachtet; ein gedimmter Knopf im Lagemonitor wirkt wie ein Knopf, der nicht reagiert.
- **Größtes Einsatzrisiko:** nicht prüfbar bleibt die echte Wirkung von Sonne und Scheinwerfer auf das Display; die Messwerte sind Kontrastwerte, keine Helligkeitsmessung.
- **Top-Priorität für die nächste Iteration:** R18-L1 und R18-L2 (kleine Schrift in der Tabelle, überdeckte Hilfe im Scanner), danach auf einem echten Gerät bei Dunkelheit und Sonne messen.
