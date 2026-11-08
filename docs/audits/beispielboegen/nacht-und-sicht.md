# Audit „Nacht und Sicht", Schwerpunkt Beispielbögen

Prüfer: Rollenaudit `thw-night-visibility-reviewer` · Datum: 2026-11-08 ·
Prüfgegenstand: Live-Seite `https://erfassungsbogen.app/` (Fassung `v2026.1108.2056`, Code-Stand
Commit `0dd56d4` = `main`), nur der Bereich Beispielbögen: Abschnitt „Beispielbögen" der Startseite mit
dem Knopf „Beispielbögen ansehen" und der Dialog „Beispielbögen" (Aufklapper, Register, Pfadleiste,
Tabelle bzw. Karten, Knöpfe) · Zählung: **P0 0 · P1 0 · P2 1 · P3 1 · Hinweise 6**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md`, der Bericht
„Nacht und Sicht" von Runde 21 (Aufbau), `DESIGN.md`, `src/app/fusszeile.tsx` (Dialog),
`src/app/zeichen-bild.tsx` und die Stile in `index.html` (Suche `beispiel-`, `nacht-modus`,
`dunkel-modus`, `feld-modus`, `einheit-avatar`). Zählregel wie in den Runden: ein Befund je
Sachverhalt, ein Typ je Befund (Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast); P3 nur bei
echter Beeinträchtigung der Aufgabe, der Rest steht unter „Hinweise" ohne Priorität.

## Prüfaufbau

Chromium über das globale Playwright-Modul, `chromium.launch()` ohne Optionen, Locale de-DE,
`deviceScaleFactor` 1. Viewports 390 x 844 (`isMobile`, `hasTouch`, Kartenansicht der Tabelle) und
1280 x 900 (Maus, Tabellenansicht, `hover: hover`), zusätzlich 390 x 844 mit `colorScheme: 'dark'` ohne
gespeicherte Wahl. Die vier Ansichten (Standard, Dunkel, Feld, Nacht) wurden über die Bedienung
umgeschaltet: Umschalter „Anzeigemodus" in der Fußzeile (`.anzeige-schalter` ohne `klappbar`), Knopf
„Dunkel"/„Feld"/„Nacht" angetippt; die Klasse auf `<html>` danach ausgelesen (`dunkel-modus`,
`feld-modus`, `nacht-modus`). Kein `addScriptTag`, keine DOM-Änderung; Messfunktionen nur per
`page.evaluate` lesend.

Gemessen (WCAG-Formel, Vorder- gegen die zusammengesetzte Hintergrundfläche aus `getComputedStyle`,
Pseudo-Elemente `::after`/`::before`/`::backdrop` eingeschlossen): Bogenzahl im Register, Pfeil „›",
Erklärtext, Pfad-Trenner, Tabellenkopf, Hinweiszeilen, Linien und Kartenrahmen, Knopfrahmen, Fokusring
und Reiter (per Tab, nach Ablauf der 0,12-s-Überblendung), Hover-Zustand (1280 px). Dazu ein Durchlauf
über jeden sichtbaren Textknoten des Dialogs (Register, aufgeklappte Erklärung, DRK, DRK/Niedersachsen,
Katastrophenschutz/Baden-Württemberg) auf Kontrast unter 4,5 : 1 und Schrift unter 12 px sowie
waagerechtes Rollen. Helligkeit: Bildschirmfotos in einer leeren Seite per Canvas ausgewertet
(Mittel- und Höchstwert der Luma, Anteil der Pixel über 150/200). Taktische Zeichen: das `src` jedes
Zeichens (SVG als data-URL) auf der Dialogfläche des jeweiligen Modus nachgerendert, gezählt die Pixel
mit Kontrast unter 1,5 : 1 zum Grund, die Pixel heller als die Schrift (Luma über 206) und reinweiße
Pixel; je Organisation der erste Ordner mit Tabelle (ASB, BBK, Bundeswehr, DLRG, DRK,
Feuerwehr/Niedersachsen, Katastrophenschutz/Baden-Württemberg, Praktische Ausbildung/Einlagen Kräfte
Hannover, THW). Ein PDF-Knopf wurde ausgelöst („wird vorbereitet …", Download kam an).

Skripte und Bildschirmfotos: `/tmp/claude-0/audit-nacht/` (u. a. `messen.js`, `zeichen.js`,
`orgs.js`, `scan.js`, `zoom-vergleich.png`, `org-nacht-DRK.png`, `390x844-nacht-tabelle.png`).

**Annahmen:** Wer die Beispielbögen nachts aufruft, tut das meist zum Üben oder Zeigen (Dienstabend,
Fahrzeug, Zelt), nicht im laufenden Einsatz; die Bewertung folgt deshalb dem Maßstab der App selbst
(„Nacht: gedimmt, blendet nicht"), nicht einer Einsatzgefahr. Dass das Größenzeichen (Punkte, Striche
über dem Rechteck) für Helfer eine gelesene Angabe ist, steht so in Runde 3 (R3-L5) und im Code.

**Nicht prüfbar:** echtes Licht (Sonne, Scheinwerfer, Rotlicht), Displayhelligkeit und
Panel-Gamma, Dunkeladaption am echten Auge, Rot-Grün-Schwäche, die iOS- und Android-App (eigene
Plattformregeln, `platform-ios`/`platform-android`), der Inhalt der erzeugten PDF.

## Urteil aus Sicht der Rolle

Schrift und Bedienelemente tragen in allen vier Ansichten: Im Dialog liegt kein sichtbarer Text unter
4,5 : 1 (kleinster Wert 4,96 : 1, Tabellenkopf in Standard) und keiner unter 12 px. Die Bogenzahl in
Monospace misst nachts 6,31 : 1, der Pfad-Trenner „›" 4,75 : 1, der Fokusring 4,71 : 1. Nichts rollt
waagerecht. Ein dunkel eingestelltes Gerät startet in „Dunkel". In Nacht ist der Dialog mit offenem
Register ruhig (Luma-Mittel 15 bis 24, hellster Punkt 206 = Schrift), der Hintergrund liegt unter
einem Schleier von 45 % Schwarz.

Sobald ein Ordner mit Bögen offen ist, kippt das Bild: Die taktischen Zeichen in der Tabelle bekommen
weder die helle Unterlage noch die Dämpfung, die die App sonst überall für dunkle Ansichten setzt.
Die schwarzen Größenzeichen verschwinden (1,15 : 1), und bei ASB, DLRG, DRK, Sanitätseinheiten und der
Praktischen Ausbildung steht in jeder Zeile ein reinweißer Block, heller als jede Schrift (BB-L1).
Die Aufgabe „Beispiel finden und öffnen" gelingt trotzdem ohne Hilfe, weil Name und Stärke als Text
dastehen. Dazu kommen Ordnernamen in Versalien ohne Umlaut (BB-L2) und einige kleine Punkte.

## Positiv geprüft (im echten Browser)

| Prüfpunkt | Ergebnis |
| --- | --- |
| Startseite, Abschnitt „Beispielbögen" | Überschrift 12,45 : 1, Hinweis 6,77 : 1, Primärknopf Schrift 5,00 : 1 und Fläche 5,05 : 1 gegen Grund (Nacht); Standard 5,42 / 14,21; Dunkel 8,86 / 9,22; Feld 11,78 / 14,21 |
| Register: Name, Bogenzahl (Monospace grau), „›" | Nacht 11,61 / 6,31 / 4,75; Dunkel 14,46 / 8,17 / 5,22; Standard 18,43 / 5,92 / 4,69; Feld 21 / 14,18 / 14,18 (ruhend) |
| Register: Zielhöhe | 52 px (Feld 62,7 px) je Zeile, die ganze Zeile ist das Ziel |
| Reiter in Kennfarbe (Hover, 1280 px) | Nacht #a8791a 4,24 : 1 gegen die Hover-Fläche, Dunkel 8,20, Standard 11,91, Feld 11,04; am Telefon (kein Hover) ohne Reiter, wie im Stil vorgesehen |
| Fokus per Tab (Register, Zeilenknöpfe) | Ring 3 px (Feld 4 px) in Kennfarbe: Nacht 4,71 : 1, Dunkel 9,31, Standard und Feld 14,21; der Reiter erscheint nach 0,12 s Überblendung in allen Modi |
| Aufklapper „Was sind Beispielbögen? …" | Nacht 6,69 : 1, Erklärtext 6,31 : 1; Standard 9,92 / 5,92; Ziel 44 px hoch |
| Pfadleiste | „‹ Zurück" 11,61 : 1, „Alle" 6,69 : 1, aktueller Ordner 11,61 : 1, Trenner 4,75 : 1 (Nacht) |
| Tabellenkopf (1280 px) | Nacht 5,69 : 1, Dunkel 7,20, Standard 4,96, Feld 11,01 (13 px bzw. 15,7 px, Versalien, Monospace) |
| Hinweiszeilen, „Stärke"-Vorsatz in den Karten | Nacht 6,31 : 1, Dunkel 8,17, Standard 5,92, Feld 14,18 |
| Zeilenknöpfe mit Icons | Schrift Nacht 11,61 : 1, Rahmen 3,41 : 1, Icon in Schriftfarbe (`currentColor`), 44 px hoch (Feld 53,75 px); beim Vorbereiten gesperrt mit gestricheltem Rahmen statt Ausblenden, „wird vorbereitet …" steht in der Zeile |
| Rollen, Schriftgröße | in keinem Modus und Viewport waagerechtes Rollen (Dialog 356 bzw. 1022 px, Tabelle 308 bzw. 974 px ohne Überlauf), kein Text unter 12 px |
| Dialog-Hintergrund in Nacht | Schleier `rgba(0, 0, 0, 0.45)` in allen Modi; Nacht mit Register: Luma-Mittel 23,6 (390 px) bzw. 15,1 (1280 px), höchstens 206; keine helle Fläche hinter dem Dialog |
| `colorScheme: 'dark'` ohne Wahl | Start in `dunkel-modus`, kein weißer Erstbildschirm |

## Befunde

### BB-L1 (P2, Kontrast) Taktische Zeichen in der Beispieltabelle: in Dunkel und Nacht ohne Unterlage und Dämpfung — Größenzeichen unsichtbar, weiße Zeichen blenden

- **Ort:** Dialog „Beispielbögen" → beliebiger Ordner mit Bögen, Spalte „Einheit" (Tabelle bei 1280 px, Karten bei 390 px), Ansichten Dunkel und Nacht. Code: `src/app/fusszeile.tsx` Zeile 1355 (`<EinheitZeichen einheit={b.einheit} aria-hidden="true" />` ohne `className`); die Regeln für dunkle Ansichten in `index.html` (Zeilen 4806, 4905, 4913 f.) greifen nur an `img.einheit-avatar`.
- **Beobachtung:** Am Zeichen der Tabelle ist in Dunkel und Nacht `filter: none` und `background-color: transparent`; die Unterlage ist die Dialogfläche (#17150f bzw. #171a21). Die Zeichen sind für weißes Papier gezeichnet (Schwarz #000000 für Größenzeichen und Schrift, Weiß #FFFFFF, BBK Rot #FF0000, THW Blau #003399).
  - **Größenzeichen:** Schwarz auf der Dialogfläche misst 1,15 : 1 (Nacht) bzw. 1,21 : 1 (Dunkel). Im Bild sind die drei Punkte „Zug", die zwei Punkte „Gruppe" und der eine Punkt „Trupp" über dem Rechteck in Standard und Feld klar zu sehen, in Dunkel und Nacht praktisch nicht (Vergleich `zoom-vergleich.png`: THW „Zugtrupp", „Fachgruppe Ortung", BBK „Behandlungsbereitschaft", „Führungsgruppe"). Nachgerendert sind bei THW-Zeichen 1 bis 2 % der deckenden Pixel unter 1,5 : 1 zum Grund — genau die Größenzeichen.
  - **Helligkeit:** Bei ASB, DLRG, DRK, den Sanitätseinheiten des Katastrophenschutzes (z. B. „Bergrettungszug", „Einsatzeinheit Behandlung") und der Praktischen Ausbildung (Hannover) ist das Zeichen ein weißes Rechteck: je Zeichen 364 Pixel heller als die Schrift (Luma über 206), davon 312 reinweiß (Luma 255), also etwa 26 x 12 px. Bei DRK stehen acht solche Blöcke untereinander im Bild (`org-nacht-DRK.png`). Bei THW sind Schrift im Zeichen und Rand reinweiß (4 bis 52 Pixel je Zeichen, „Trupp Logistik-Schwerer Transport" 52), BBK und Feuerwehr zeigen ungedämpftes Vollrot. Das Bild der geöffneten Tabelle erreicht nachts Luma 255, mit offenem Register höchstens 206.
  - Zum Vergleich: Im Kopf des Assistenten und auf der Startseitenkarte (`einheit-avatar`) liegt dasselbe Zeichen nachts auf weißer Unterlage unter `brightness(0.6) sepia(0.4)`, in Dunkel unter `brightness(0.85)`.
- **Erwartung der Rolle:** Das Zeichen zeigt dieselbe Auskunft wie auf Papier (Organisation und Größe), und in „Nacht" ist nichts heller als die Schrift — so wie überall sonst in der App.
- **Folge:** Wer nachts Beispiele durchsieht, um Trupp, Gruppe und Zug am Zeichen zu unterscheiden (Ausbildung zu taktischen Zeichen, Vorbereitung einer Übung), sieht alle Zeichen einer Organisation gleich; die Größe steht nur noch im Namen. Die Reihe reinweißer Blöcke ist in der sonst gedimmten Ansicht der hellste Fleck und kostet bei wiederholtem Hin- und Herrollen Dunkeladaption — genau das, was die Nacht-Ansicht laut eigener Beschreibung vermeidet. Die Aufgabe bleibt machbar, weil Einheitsname und Stärke als Text dastehen.
- **Empfehlung:** Die Zeichen der Beispieltabelle in Dunkel und Nacht genauso behandeln wie die übrigen Zeichen der App: helle Unterlage, damit das Größenzeichen erscheint, und dieselbe Dämpfung, damit nichts heller als die Schrift wird.
- **Neu oder alt (Verweis):** alt in der Sache (R3-L5 „Größenzeichen 1,15 : 1 nachts" und die Avatar-Dämpfung „hellster Fleck im Bild"), in diesem Dialog nicht mitgezogen.
- **Nachprüfung:** Nacht und Dunkel, 390 x 844 und 1280 x 900, Ordner DRK und BBK: Größenzeichen über dem Rechteck sichtbar (Schwarz gegen seine Unterlage mindestens 3 : 1), kein Pixel der Tabelle heller als Luma 206 (Nacht).

### BB-L2 (P3, Text) Ordnernamen in Versalien ohne Umlaut und Bindestrich: „BADENWUERTTEMBERG", „MECKLENBURG VORPOMMERN"

- **Ort:** Dialog „Beispielbögen" → „Katastrophenschutz" (Register) und die Pfadleiste darunter, alle Modi; Code: `ordnerLabel` in `src/app/fusszeile.tsx` (Zeile 85), Rückfall `ordner.replace(/-/g, " ").toUpperCase()` für Ordner ohne Eintrag in der Namensliste.
- **Beobachtung:** Unter „Katastrophenschutz" stehen zwölf Länder, acht davon als Versalien aus dem Verzeichnisnamen: „BADENWUERTTEMBERG", „BAYERN", „BERLIN", „HESSEN", „MECKLENBURG VORPOMMERN", „NORDRHEIN WESTFALEN", „RHEINLAND PFALZ", „SAARLAND"; daneben in normaler Schreibung „Brandenburg", „Niedersachsen", „Sachsen", „Thüringen". In der Pfadleiste bei 390 px bricht „BADENWUERTTEMBERG" in eine eigene Zeile, die mit dem Trenner „›" beginnt (`390-nacht-kats-bw.png`). Kontrast ist nicht betroffen (11,61 : 1 nachts).
- **Erwartung der Rolle:** Ländernamen wie auf jeder Karte und jedem Schild: „Baden-Württemberg", „Mecklenburg-Vorpommern".
- **Folge:** Versalien ohne Wortgrenze lesen sich bei wenig Licht und kleiner Displayhelligkeit langsamer (keine Ober- und Unterlängen als Wortbild); „BADENWUERTTEMBERG" muss man buchstabieren. Die gemischte Schreibung lässt die Liste unsortiert wirken; wer „Mecklenburg-Vorpommern" sucht, findet es nicht beim schnellen Überfliegen.
- **Empfehlung:** Alle Ordner mit ihrem richtigen Namen in normaler Schreibung zeigen, auch die Länder unter „Katastrophenschutz".
- **Neu oder alt (Verweis):** neu.
- **Nachprüfung:** „Katastrophenschutz" öffnen: zwölf Ländernamen in normaler Schreibung mit Umlaut und Bindestrich; Pfadleiste bei 390 px ohne Zeile, die mit „›" beginnt.

## Hinweise (ohne Priorität)

- **H1 Trennlinien unter 3 : 1.** Registerlinien, Tabellenzellen (1280 px) und Kartenrahmen (390 px) tragen `--linie`: Nacht #423c2d 1,67 : 1, Dunkel 1,70 : 1, Standard 1,77 : 1 (Feld 18,58 : 1, 2 px). Die Zeilen sind hoch genug (Tabelle rund 74 px, Karten mit 12 px Abstand und dem Zeichen als Kopf), dass die Zugehörigkeit der Knöpfe im Versuch nicht verloren ging; bei kleinster Displayhelligkeit ist sie nicht prüfbar.
- **H2 Register-Pfeil „›" bei Hover.** Ruhend 4,75 : 1 (Nacht) bzw. 4,69 : 1 (Standard); auf der Hover-Fläche 4,29 : 1 (Nacht) bzw. 3,93 : 1 (Standard). Als Richtungszeichen reicht 3 : 1; nur der Vollständigkeit halber.
- **H3 Aufklapper ohne Aufklappzeichen.** Die Zeile „Was sind Beispielbögen? Was heißen Anzeigen, PDF und Link?" ist `display: flex`; damit fällt das Dreieck des Browsers weg, und es gibt kein eigenes Zeichen. Ob die Zeile aufklappt und ob sie offen ist, sieht man nur an der Kennfarbe und am darunter erscheinenden Text. Bei 390 px trennt sie „Anzei-gen".
- **H4 Ansicht bei offenem Dialog nicht umschaltbar.** Beide Umschalter (Kopf und Fußzeile) liegen unter dem modalen Dialog. Wer den Dialog nachts in Standard öffnet (Luma-Mittel des Dialogs 244 bei 390 px), muss ihn erst schließen, um auf Nacht zu gehen. Vorhersehbar, aber ein zusätzlicher Schritt.
- **H5 Bogenzahl „THW" springt.** Direkt nach dem Laden zeigt das Register „THW 101 Bögen", nach dem Nachladen der Ortsverbands-Beispiele „THW 3.634 Bögen" (Unterordner „Alle Einheiten aller Ortsverbände (LV › RSt › OV)", 3.533 Bögen). Kein Kontrastpunkt; wer zweimal hinsieht, liest zwei verschiedene Zahlen.
- **H6 „Alle" in der Pfadleiste schmal.** Das Ziel „Alle" ist 24 x 44 px (Feld 28 x 54 px), der aktuelle Ordner „DRK" 30 x 44 px; die Höhe stimmt, die Breite liegt unter 44 px. „‹ Zurück" daneben ist ein vollwertiger Knopf.

## Schluss

- **Aufgabe geschafft:** ja (Beispiel finden, aufklappen, Ordner wechseln, Anzeigen/PDF/Link in allen vier Ansichten)
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** In Dunkel und Nacht sehen Trupp, Gruppe und Zug einer Organisation am Zeichen gleich aus, weil das schwarze Größenzeichen auf dem dunklen Grund verschwindet (BB-L1).
- **Größtes Einsatzrisiko:** gering — der Bereich dient dem Üben; nachts blenden die reinweißen Zeichen von ASB, DLRG, DRK und Sanitätseinheiten als hellste Stellen im Bild (BB-L1); nicht prüfbar bleibt die Wirkung bei echtem Licht und kleinster Displayhelligkeit.
- **Top-Priorität für die nächste Iteration:** BB-L1 (Zeichen der Beispieltabelle wie die übrigen Zeichen der App auf heller, gedämpfter Unterlage), danach BB-L2.
