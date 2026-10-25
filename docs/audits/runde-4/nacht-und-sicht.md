# Audit „Nacht und Sicht“, Runde 4 (Dunkelheit, Blendung, Sonnenlicht, Farbcodierung)

Stand: 05.10.2026 · Prüfer: Rollenaudit `thw-night-visibility-reviewer` ·
Prüfgegenstand: Web-App einschließlich der Begleitseiten unter `public/`,
Produktionsbuild (`vite preview`, Port 4173), Commit 3dd2ab5.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-3-Befunde. Geprüft habe ich zuerst ohne Kenntnis des Runde-3-Berichts
und der übrigen Runde-4-Berichte. Den Abgleich habe ich erst danach gemacht.

## Prüfaufbau

Produktionsbuild über `vite preview` (http://localhost:4173), Playwright aus
`node_modules` mit Chromium aus `/opt/pw-browsers/chromium`, `isMobile`/
`hasTouch`, Locale de-DE, Telefon 360 × 640 bei Pixelverhältnis 2, je
Anzeigezustand ein eigener Browser-Kontext. Geprüft in allen vier Modi
(Standard, Dunkel, Feld, Nacht) und mit Systemeinstellung „dunkel“ ohne
gespeicherte Wahl. Zustände über `localStorage`-Seeds aus `examples/thw/`
(`uebung: false`, `stand` auf heute): Entwurf FGr Öl (C) Weinsberg in
Schritt 3, Einsatz-Sammlung „Hochwasser Neckar“ mit sieben Meldungen (davon
eine abgerückt, eine mit gültiger, eine mit ungültiger Signatur), eine ruhende
Übungssammlung (70 Tage, Löschankündigung) und eine Vorlage. Für die
Kennfarben zusätzlich ein Entwurf je Organisation (DRK, Feuerwehr, DLRG,
ASB, Polizei, Bundeswehr, Malteser, Rettungsdienst; Bögen aus
`examples/drk`, `examples/feuerwehr`, `examples/dlrg`, `examples/asb`, die
Organisation im Seed umgestellt).

Durchlaufen: Startseite (vier Bildlagen), Assistent Schritt 1–5,
Gesamtübersicht, Übergabe-Dialog, QR-Vollbild, PDF-Erzeugung, Einsatz-Detail
(Kopf, Kartenliste, Tabelle, Verwalten), Rückfragen, Moduswechsel über Kopf und
„◐“-Leiste (360 × 640 und 320 × 568), „Bögen einlesen…“ mit falscher und
gültiger Datei, Tastaturfokus, Kaltstart mit um 2,5 s verzögertem App-Bundle,
alle 36 Begleitseiten unter `public/` in allen fünf Zuständen (180 Aufrufe).

Kontraste sind **gerechnet**: für jeden sichtbaren Textknoten Schriftfarbe gegen
die tatsächlich darunterliegende Fläche (Deckkraft der Vorfahren eingerechnet),
WCAG-Formel, Schwelle 4,5:1 bzw. 3:1 für große Schrift. Nicht-Text-Kontraste
(Rahmen, Marken, Haken) aus den Token in `index.html` gerechnet. Blendung als
mittlerer Luma-Wert (sRGB, 0–255) und Anteil heller Bildpunkte (Luma > 200) je
Bildschirmfoto; die Werte sind nicht 1:1 mit der linearen Luminanz aus Runde 3
vergleichbar.
Farbfehlsicht und geringe Displayhelligkeit als Bildfilter auf die
Bildschirmfotos (Deuteranopie-Matrix, Graustufen, Helligkeit × 0,3).

**Nicht prüfbar:** echtes Licht (Sonne, Arbeitsscheinwerfer, Rotlicht),
tatsächliche Displayhelligkeit, Spiegelung und Blickwinkel realer Geräte,
OLED-Schwarz, die native Android-/iOS-Fassung (Plattform-Layer
`.platform-ios`/`.platform-android` nur im Code gelesen), Kamera-Scanner im
Dunkeln, Ausdruck auf Papier.

## Urteil

Das Lichtkonzept hält. Im Nacht-Modus liegt kein aktiver Text unter 4,5:1,
der knappste Wert ist 4,54:1 (Nebenzeile „Letzte Meldung …“ auf dem
Bernsteinknopf). Über 18 Bildlagen der App bleibt der mittlere
Helligkeitswert nachts zwischen 18 und 47 (sRGB-Luma, 0–255), im
Standard-Modus zwischen 174 und 243. Der Kaltstart ist dunkel, die
Browserleiste nachts #221f16. Zustände tragen überall Wort oder Zeichen:
„✓“/„offen“ in der Schrittleiste, „ABGERÜCKT“ mit Durchstreichung,
„⚠ Signatur ungültig“ jetzt auch in der zugeklappten Karte und in der
Tabelle, „● Ruhezeit“. In Graustufen und unter Deuteranopie geht kein
Zustand verloren. Alle 36 Begleitseiten sind in allen fünf Zuständen ohne
Text unter 4,5:1. Die Rückmeldung nach „Bögen einlesen…“ steht jetzt im
Bild, und der Modus lässt sich im Assistenten über „◐“ von unten wechseln.

Reibung entsteht dort, wo die Kennfarbe einer anderen Organisation als des
THW den Kopfbalken füllt. Im Dunkel-Modus, der Vorgabe für jedes Telefon mit
dunkler Systemeinstellung, steht „✓ automatisch gespeichert“ grün auf der
Kennfarbe: 2,46:1 bei DLRG, 2,59:1 beim DRK, grün auf Rot (R4-L1). Der Link
„‹ Startseite“ erreicht auf DRK-Rot und DLRG-Gelb in drei Modi nur 3,75 bzw.
3,84:1 (R4-L2). Der THW-Bogen, mit dem die bisherigen Runden geprüft haben,
ist davon nicht betroffen. Dazu kommen kleinere Reste: Der Moduswechsel über
„◐“ hält die Stelle nicht immer, die Einsatzansicht hat keinen Umschalter
unten (R4-L3). Native Bedienelemente leuchten nachts reinweiß (R4-L4).

Die Aufgabe gelingt bei Nacht und in der Sonne ohne fremde Hilfe: Bogen
erfassen, übergeben, am Meldekopf sammeln, in der Anleitung nachschlagen.

## Befunde

Keine P0- und keine P1-Befunde.

### R4-L1 [P2] Dunkel-Modus: „✓ automatisch gespeichert“ grün auf der Kennfarbe, bei sieben Organisationen unter 4,5:1 (neu)

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Assistent, Kopfbalken, Zeile unter „‹ Startseite“.
Dunkel-Modus, also auch jedes Gerät ohne gespeicherte Wahl mit dunkler
Systemeinstellung. Code: `index.html`, Z. 4028
`.dunkel-modus .vollstaendig-ok, .dunkel-modus .autosave { color: var(--gut); }`.
Diese Regel überschreibt bei gleicher Spezifität die Kopfregel in Z. 808
(`.seiten-kopf .autosave { color: var(--kopf-auf-2) }`), weil sie später
im Blatt steht.

**Beobachtung:** Die Zeile steht im Dunkel-Modus in #6cd18a auf der
Kennfarbe des Bogens. Gemessen in Schritt 3, 360 × 640:

| Organisation | Kopfbalken | Kontrast „✓ automatisch gespeichert“ |
| --- | --- | --- |
| DLRG | #9c6b00 | 2,46:1 |
| DRK | #e30613 | 2,59:1 |
| Feuerwehr | #c8102e | 3,12:1 |
| ASB | #a34700 | 3,22:1 |
| Polizei | #2d6a2e | 3,46:1 (grün auf grün) |
| Bundeswehr | #4b5320 | 4,35:1 |
| Rettungsdienst | #4d4d4d | 4,48:1 |
| THW, Malteser, Johanniter | – | über 4,5:1 (THW 7,99:1) |

Schrift 13 px, Gewicht 400. Im Standard- und Feld-Modus trägt dieselbe
Zeile die für die Kennfarbe gerechnete Kopf-Zweitschrift und besteht. Im
Nacht-Modus ist der Balken ohnehin dunkel (#221f16) und die Zeile besteht.
Auf dem Screenshot DRK/Dunkel ist die Zeile ein grüner Schimmer auf Rot.

**Erwartung der Rolle:** Die Zeile, die mir sagt, dass meine Eingaben
gesichert sind, lese ich mit einem Blick, egal für welche Organisation ich
erfasse.

**Auswirkung im Einsatz:** Wer abends im abgedunkelten Raum einen DRK-,
Feuerwehr- oder DLRG-Bogen erfasst, kann die Bestätigung nicht lesen. Bei
Rot-Grün-Schwäche verschwindet Grün auf Rot ganz. Der Helfer weiß nicht, ob
gespeichert wurde, und tippt im Zweifel noch einmal oder übergibt zu früh.
Der Fehlerfall „⚠ Nicht gespeichert“ ist nicht betroffen, er hat einen
eigenen Warnfond.

**Empfehlung:** Die Dunkel-Regel für `.autosave` nur außerhalb des
Kopfbalkens anwenden. Im Balken dieselbe gerechnete Kopf-Zweitschrift wie in
Standard und Feld verwenden. Den Haken „✓“ nicht in Grün auf die Kennfarbe
setzen.

**Nachprüfung:** Entwurf je Organisation (alle elf Kennfarben), Dunkel-Modus
und System-dunkel, Schritt 1–5: „✓ automatisch gespeichert“ ≥ 4,5:1 gegen
den Kopfbalken, auch unter Deuteranopie-Filter erkennbar.

### R4-L2 [P3] Kopfbalken in DRK-Rot und DLRG-Gelb: „‹ Startseite“ unter 4,5:1, im Dunkel-Modus ein gesättigt roter Balken (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen; die Blendwirkung des roten Balkens ist ein
Risiko.

**Fundstelle / Aufgabe:** Assistent, Kopfbalken, Link „‹ Startseite“.
Standard-, Feld- und Dunkel-Modus. Code: `index.html`, Z. 806
(`.seiten-kopf .zur-start { color: var(--kopf-auf); opacity: 0.85; }`);
Kennfarben in `src/app/org-farben.ts`.

**Beobachtung:**

- Weiß auf DRK-Rot misst 4,88:1, auf DLRG-Gelb 4,65:1. Mit der Deckkraft
  0,85 sind es 3,75:1 (DRK) bzw. 3,84:1 (DLRG). Schrift 16 px, Gewicht 600;
  im Feld-Modus 17,9 px, damit noch keine große Schrift.
- Bei allen anderen Kennfarben besteht der Link.
- Im Dunkel-Modus bleibt der Kopfbalken in der Kennfarbe. Beim DRK ist das
  ein 130 px hoher Balken in #e30613 über die ganze Breite, dazu
  `theme-color` #e30613 für die Statusleiste. Die Stilblatt-Begründung („die
  Org-Töne sind ohnehin dunkel gehalten“) trifft auf DRK und Feuerwehr nicht
  zu.

**Erwartung der Rolle:** Der Rückweg zur Startseite ist so lesbar wie die
übrigen Knöpfe. Wer „Dunkel“ wählt, bekommt keine leuchtende Farbfläche.

**Auswirkung im Einsatz:** Gering. Der Link ist groß und an seiner Stelle
bekannt. Der rote Balken ist nicht hell im Sinne der Luminanz, zieht aber im
dunklen Raum den Blick auf sich.

**Empfehlung:** Die Deckkraft am Link weglassen oder die Kopfschrift für
helle Kennfarben auf mindestens 4,5:1 rechnen, wie es `org-farben.ts` für
die Zweitschrift schon tut. Im Dunkel-Modus den Kopfbalken für helle oder
stark gesättigte Kennfarben abdunkeln, ähnlich wie nachts.

**Nachprüfung:** Entwurf DRK und DLRG, Standard, Feld und Dunkel: „‹
Startseite“ ≥ 4,5:1. Dunkel-Modus DRK: Kopfbalken nicht heller oder
gesättigter als die Kennfarben von THW und Malteser.

### R4-L3 [P3] Moduswechsel: „◐“ hält die Stelle nicht immer, in der Einsatzansicht fehlt der Umschalter unten (Rest von R3-L6)

**Priorität:** P3

**Kennzeichnung:** gemessen (Assistent), beobachtet (Einsatzansicht).

**Fundstelle / Aufgabe:** Assistent, Schritt 3 „Personal“, auf scrollY 3 000
gescrollt (mitten in Person 2), dann über „◐“ umgeschaltet. Einsatzansicht
„Hochwasser Neckar“. Code: `src/app/anzeige-schalter.tsx`,
`AnzeigeLeistenKnopf.waehle`.

**Beobachtung:**

- Zwei Tipps genügen, die Leiste klappt über der festen Fußleiste auf.
- Als Anker dient das Element in der Bildmitte. Ist das die ganze
  Personenkarte, bleibt nur deren Oberkante stehen (−979 px), der Inhalt
  darin wächst im Feld-Modus mit. 360 × 640, Nacht → Feld: Die Beschriftung
  „Nummer“ stand vorher bei rund 136 px, danach bei rund 511 px; die Bildmitte zeigt
  danach „Weitere Qualifikationen“ statt „dienstlich / + Kontakt“. Rund
  375 px Versatz, mehr als eine halbe Bildhöhe.
- Bei 320 × 568 trifft die Bildmitte ein kleines Element („Art“), dort
  bleibt die Stelle exakt (281 → 281 px in allen Wechseln).
- Die Einsatzansicht hat keine feste Leiste und keinen „◐“. Der Umschalter
  steht bei 68 px und im Fuß bei 4 151 px, die Seite ist mit sieben
  Einheiten 4 501 px hoch. Mitten in der Einheitenliste sind es in beide
  Richtungen rund 2 000 px bis zum Umschalter.

**Erwartung der Rolle:** Wenn im Zelt das Licht ausgeht, schalte ich mit
einem Griff auf Nacht und sehe danach dieselbe Stelle.

**Auswirkung im Einsatz:** Im Assistenten kostet der Versatz einen Blick und
ein Wischen. Am Meldekopf, wo nachts am längsten auf das Gerät geschaut
wird, muss der Helfer weiter ganz nach oben oder unten, mit der Liste im
alten Licht.

**Empfehlung:** Als Anker ein kleines Element nehmen, etwa das Eingabefeld
oder die Zeile in der Bildmitte statt der umgebenden Karte. In der
Einsatzansicht denselben Weg von unten anbieten.

**Nachprüfung:** 360 × 640, Schritt 3, scrollY 3 000, Nacht → Feld → Dunkel
→ Nacht: das Element in der Bildmitte verschiebt sich um höchstens 40 px.
Einsatzansicht mitten in der Liste: Moduswechsel mit höchstens zwei Tipps
ohne Scrollen.

### R4-L4 [P3] Kleinere Sichtreste (Sammelbefund)

**Priorität:** P3

**Kennzeichnung:** je Punkt angegeben.

- **Native Bedienelemente nachts reinweiß (gemessen):** Der Ring der
  gewählten Optionsknöpfe (Schritt 3 „Personal vollständig erfassen“,
  „Alle Angaben (Karten)“) und das Kalendersymbol der Datumsfelder
  (Schritt 2) stehen in 255/255/255. Das sind die hellsten Bildpunkte
  im Nacht-Modus; der Nacht-Text hat Luma 206. Die Kästchen der
  Fahrzeugzeichen tragen mit Absicht eine helle Unterlage. Der Rahmen
  „Ohne Kamera: mit dem USB-Handscanner“ ist kaltgrau (179/179/179) statt
  warm. Alles klein, aber es sind die einzigen kalten weißen Punkte im
  sonst warmen Bild.
- **Fehlerzeile nach „Bögen einlesen…“ nur farbig (beobachtet):** „„falsch.json“
  stammt nicht aus dieser App …“ steht als Fließtext im Alarmton, ohne
  „⚠“ und ohne Rahmen. Die Erfolgsmeldung daneben hat einen Kasten. Unter
  Deuteranopie-Filter ist der Nacht-Alarmton (#e08a7e) beige wie der übrige
  Text; die Aussage trägt der Wortlaut.
- **Alarm und Warnung nachts unter Deuteranopie gleichfarbig
  (beobachtet):** „⚠ Signatur ungültig“ und „● Ruhezeit“, „Sitzplätze
  fehlen: 4“ erscheinen in demselben Beige. Unterscheidbar nur über „⚠“
  gegenüber „●“ bzw. kein Zeichen.
- **Nacht neben Feld (Risiko):** Im Umschalter liegen „Feld“ und „Nacht“
  nebeneinander. Ein Fehltipp aus Nacht heraus schaltet ohne Rückfrage auf
  die hellste Darstellung (Luma-Mittel 186 statt 33 in Schritt 2). Das ist mit
  einem zweiten Tipp behoben, blendet aber für diesen Moment voll.
- **Anleitungs-Aufnahme nicht ganz aktuell (beobachtet):** `start-schmal.png`
  in `anleitung.html` zeigt auf dem Telefon die ausgeklappte Segmentleiste
  „Standard | Dunkel | Feld | Nacht“. Die App zeigt bei 360 px den Klappknopf
  „Standard ▾“. Der Ladehinweis auf dem Bild hat noch den grünen Rahmen.

**Empfehlung:** Für die Optionsknöpfe und das Kalendersymbol nachts eine
warme Farbe setzen; den Handscanner-Rahmen in `--text-2`. Fehlerzeilen mit
„⚠“ oder Rahmen wie die Erfolgsmeldung. Alarmmarken nachts mit einem
zweiten Merkmal (gefüllte Marke oder dickerer Rahmen). „Nacht“ und „Feld“
im Umschalter nicht nebeneinander, oder „Nacht“ an den Rand neben
„Dunkel“. Aufnahme in der Anleitung erneuern.

**Nachprüfung:** Nacht-Modus, Schritt 2 und 3: kein Bildpunkt über Luma 230.
„Bögen einlesen…“ mit falscher Datei: Fehlerzeile mit Zeichen oder Rahmen.
Einsatzansicht unter Deuteranopie-Filter: „Signatur ungültig“ auf einen
Blick von den Warnmarken unterscheidbar.

### Verweise auf andere Runde-4-Berichte

- Abgeschnittene Prüfhinweise auf den Karten („Kennzeichen auf Anh steht
  mehr …“, „Alle 3 Personen stehen auf Ges …“): nachts und in der Sonne
  besonders schwer zu entziffern, steht als R4-K3 in
  [fuehrungssicht.md](fuehrungssicht.md).
- Feld-Modus, Schritt 5: „Zur Übersicht →“ ragt neben „◐“ über den rechten
  Rand, steht in [handschuh-bedienung.md](handschuh-bedienung.md).

## Bestätigtes

- **Text in der App:** Startseite (vier Bildlagen), Assistent Schritte 1–5,
  Gesamtübersicht (drei Bildlagen), Einsatzansicht (Kopf, vier Bildlagen
  Karten, Tabelle): in Standard, Feld, Dunkel, Nacht und System-dunkel kein
  aktiver Text unter 4,5:1 beim THW-Bogen. Übergabe-Dialog, QR-Vollbild,
  Scanner ohne Kamera und Rückfrage „Einsatz löschen?“ nachts nach
  Augenschein und Helligkeit ohne Auffälligkeit, die Einlese-Rückmeldung
  nachts gerechnet. Ausnahme nur der
  deaktivierte Knopf „← Zurück“ in Schritt 1 und leere „+ eigener Text“
  (2,59 bis 3,37:1). Knappste Werte nachts: 4,54:1 „Letzte Meldung …“ auf
  dem Bernsteinknopf, 4,71:1 Logo und Gesamtzahl „65“, 4,75:1 Platzhalter.
- **Begleitseiten:** 36 Seiten × 5 Zustände, kein Text unter 4,5:1. Klasse
  `nacht-modus`/`dunkel-modus` wird übernommen. Fotos und Aufnahmen tragen in
  Nacht, Dunkel und System-dunkel `brightness(0.7)`, die
  Handscanner-Codes bleiben ungefiltert weiß.
- **Helligkeit:** Luma-Mittel je Bildlage Nacht 18–47, Dunkel 24–60,
  Standard 174–243, Feld 154–236. Anteil heller Bildpunkte (Luma > 200)
  Nacht 0,5–3,5 %, Dunkel 0,7–6,1 %, Standard 62–96 %. Begleitseiten
  nachts 1–6 %.
- **QR-Vollbild nachts:** Die weiße Platte macht 34 % helle Bildpunkte aus
  (Standard 78 %), der Rest ist Nacht-Grund. Bewusste Entscheidung, kein
  Befund.
- **Kaltstart:** Mit um 2,5 s verzögertem App-Bundle zeigt das statische
  Gerüst nachts sofort den dunklen Grund (Luma-Mittel 24). Kein Blitz.
- **Browserleiste:** `theme-color` nachts #221f16, sonst Kennfarbe.
- **Kein Nur-Farbe-Zustand:** Schrittleiste mit „✓“ und „offen“, aktiver
  Schritt unterstrichen. „ABGERÜCKT“ als Marke mit Durchstreichung und
  gestrichelter Kante, in Karte und Tabelle. „⚠ Signatur ungültig“ zugeklappt
  und in der Tabelle. „● Ruhezeit“, „● Unterbr.“. In Graustufen bleibt alles
  erkennbar; bei Helligkeit × 0,3 bleiben Marken und Schrift lesbar.
- **Rückmeldung „Bögen einlesen…“:** Mit dem Knopf in Bildmitte steht die
  Fehlerzeile bei 317–391 px, „1 Bogen aufgenommen.“ bei 317–360 px, beide
  ganz im Bild.
- **Fokus:** 3 px Rahmen in der Akzentfarbe, nachts Bernstein 4,71:1 auf der
  Karte, im Feld-Modus 4 px.
- **Ladehinweis:** Rahmen in der Schriftfarbe des Hinweises, nachts Gelb auf
  Gelb, nicht mehr Grün.
- **Übergabe-Dialog:** Nur „QR-Code im Vollbild zeigen“ ist Primärknopf.
- **Feld-Umschalter:** Segmentgrenzen sichtbar.
- **Scanner nachts:** schwarzer Grund, warmer Text, Fehlerzeile im
  Nacht-Alarmton.
- **Feld-Modus:** Schwarz auf Hellgrau, 2-px-Rahmen, Markenrahmen #9c7a24
  (4,02:1 auf Weiß). Für die Sonne die richtige Antwort.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Wer im Dunkel-Modus einen DRK- oder
  DLRG-Bogen erfasst, kann nicht ablesen, ob gespeichert ist (R4-L1).
- **Größtes Einsatzrisiko:** Eine unlesbare Speicherbestätigung führt zu
  doppelter Eingabe oder verfrühter Übergabe (R4-L1).
- **Top-Priorität für die nächste Iteration:** Kopfbalken für alle elf
  Kennfarben in allen Modi nachmessen und die Dunkel-Regel für `.autosave`
  aus dem Balken nehmen (R4-L1, R4-L2).

## Abgleich mit Runde 3

Grundlage: [../runde-3/nacht-und-sicht.md](../runde-3/nacht-und-sicht.md)
und [../runde-3/README.md → Stand der Behebung](../runde-3/README.md#stand-der-behebung).

| Runde-3-Befund | Stand laut Bericht | Bewertung Runde 4 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R3-L1 Rückmeldung „Bögen einlesen…“ außerhalb des Bildes (P2) | behoben | **hält** | Falsche Datei: Fehlerzeile bei 317–391 px; gültige Datei: „1 Bogen aufgenommen.“ bei 317–360 px, darunter „Neu seit der letzten Kenntnisnahme“. Die Fehlerzeile trägt kein Zeichen (R4-L4). |
| R3-L2 „Signatur ungültig“ nur aufgeklappt (P2) | behoben | **hält** | Marke im Kopf der zugeklappten Karte und im Zeilenkopf der Tabelle, nachts 7,05:1, Feld 7,41:1. |
| R3-L3 Tabelle: Abgerückte auf 55 % (P3) | behoben | **hält** | Keine Deckkraft mehr, Name durchgestrichen, „ABGERÜCKT“ als Marke. Kleinster Tabellenwert 4,96 (Standard), 11,01 (Feld), 7,2 (Dunkel), 5,69:1 (Nacht). |
| R3-L4 Bilder im Dunkel-Modus ungedimmt (P3) | weitgehend | **hält, Rest bleibt** | `brightness(0.7)` in Dunkel, System-dunkel und Nacht; keine Bildfläche über Luma 200. Die Aufnahme in der Anleitung zeigt weiter nicht den aktuellen Stand (R4-L4). Eine dunkle Fassung fehlt, wie im Bericht vermerkt. |
| R3-L5 Größenzeichen unsichtbar (P3) | behoben | **hält** | Helle, gedämpfte Unterlage auf Startseitenkarte, im Kopf und in der Übersicht; die Punkte des Größenzeichens sind nachts und dunkel klar zu sehen. Native Apps nicht geprüft. |
| R3-L6 Moduswechsel nur ganz oben (P3) | behoben | **wirkt teilweise** | „◐“ mit zwei Tipps, bei 320 × 568 bleibt die Stelle exakt. Bei 360 × 640 springt der Inhalt Nacht → Feld um rund 375 px, weil die ganze Karte als Anker dient. Die Einsatzansicht hat keinen Umschalter unten (R4-L3). |
| R3-L7 Kleinere Sichtreste (P3) | behoben | **hält** | Platzhalter nachts 4,75:1; Ladehinweis mit Rahmen in Schriftfarbe; ein Primärknopf im Übergabe-Dialog; Segmentgrenzen im Feld-Modus sichtbar; Knopfrahmen #838ca1 3,09:1 auf dem Seitengrund; Markenrahmen Feld 4,02:1. |

Keine Behebung hat sich ins Gegenteil verkehrt. Von sieben Runde-3-Befunden
halten sechs (R3-L4 mit dem bekannten Rest), einer wirkt teilweise (R3-L6).
R4-L1 und R4-L2 sind keine Folge einer Behebung. Die Regeln stammen aus
einem früheren Stand; sie fielen bisher nicht auf, weil alle Runden mit
THW-Bögen geprüft haben. Neu in Runde 4: R4-L1 (P2), R4-L2 und R4-L4 (P3).
R4-L3 ist der Rest von R3-L6. Zusammen: 0 × P0, 0 × P1, 1 × P2, 3 × P3.

## Stand der Behebung

Stand 06.10.2026, Paket 3 „Layout, 200 % Schrift, Touch, Sicht“.
Geprüft mit Typprüfung, Unit-Tests (2 562 grün), Verhaltenstests (137 Szenarien, 1 749 Schritte grün)
und Nachmessung im Dev-Server (`isMobile`/`hasTouch`, de-DE, Port 5180,
360 × 640 und 320 × 568). Kontraste sind gerechnet: jeder sichtbare Textknoten
von Schritt 1 und 3 gegen die tatsächlich darunterliegende Fläche (Deckkraft
der Vorfahren eingerechnet), WCAG-Formel, Schwelle 4,5:1, für zwölf
Organisationen (THW, Feuerwehr, Polizei, Bundespolizei, DRK, Johanniter,
Malteser, ASB, DLRG, Bundeswehr, Rettungsdienst, Sonstige; Entwurf aus
`examples/thw/024-muehldorf-b.json`, Organisation im Seed umgestellt) in
Standard, Feld, Dunkel und Nacht. Aufgeführt sind nur die Befunde dieses
Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R4-L1 „✓ automatisch gespeichert“ grün auf der Kennfarbe | behoben | Im Kopfbalken gilt im Dunkel-Modus dieselbe auf 4,5:1 gerechnete Zweitschrift der Kennfarbe wie in Standard und Feld (`.dunkel-modus .seiten-kopf .autosave`); das Grün gilt nur noch auf der Seite. Die Zeile heißt jetzt „✓ gespeichert · 22:24 Uhr · nur auf diesem Gerät“. Gemessen im Dunkel-Modus (vorher → nachher): DLRG 2,46 → 10,26:1, DRK 2,59 → 10,17:1, Feuerwehr 3,12 → 8,32:1, ASB 3,22 → 8,22:1, Polizei 3,46 → 7,73:1, Bundeswehr 4,35 → 7,54:1, Rettungsdienst 4,48 → 7,50:1, THW 7,99 → 9,66:1. Alle zwölf Organisationen, alle vier Modi, Schritt 1 und 3: kein sichtbarer Text unter 4,5:1; knappste Werte DLRG Feld 4,53:1, Polizei Standard 4,54:1, ASB Standard 4,55:1, DRK Standard 4,56:1. |
| R4-L2 „‹ Startseite“ unter 4,5:1, Dunkel-Modus: gesättigt roter Balken | behoben | Der Rücksprung trägt statt der Deckkraft 0,85 die gerechnete Zweitschrift der Kennfarbe (DRK 3,75 → 4,56:1, DLRG 3,84 → 4,53:1 im Feld-Modus, Feuerwehr 4,62:1; THW 9,66:1, nachts 5,69:1). Im Dunkel-Modus nimmt der Kopfbalken die abgedunkelte Kennfarbe (`kopfDunkel()` in `org-farben.ts`: höchstens Leuchtdichte 0,05 und Sättigung 0,84, beides die Werte des Malteser-Bordeaux; THW, Malteser, Johanniter bleiben): DRK #e30613 → #7d0b12, Feuerwehr #c8102e → #800b1e, ASB #a34700 → #623009, DLRG #9c6b00 → #533b07; die Statusleiste (`theme-color`) folgt. Alle Texte im Kopfbalken des Dunkel-Modus: mindestens 6,83:1 (Rettungsdienst, Sonstige). |
| R4-L3 „◐“ hält die Stelle nicht immer, Einsatzansicht ohne Umschalter unten | behoben | Der Anker ist das erste Element um die Bildmitte, das höchstens eine Zeile hoch ist (Feld, Beschriftung, Knopf), nicht die ganze Karte; feste Leisten zählen nicht. Nachlauf (360 × 640, Schritt 3, `scrollY` 1 500 bis 4 500, Nacht → Feld → Dunkel → Nacht → Standard → Feld): Verschiebung der Bildmitten-Sonde 0 px (höchstens 22 px bei 320 × 568; vorher rund 375 px). Die Einsatzansicht hat unten links einen festen „◐“ (44 px, mit Rahmen und Schatten); mitten in der Liste (`scrollY` 2 911 von 5 822 px) genügen zwei Tipps ohne Rollen, die Verschiebung beträgt 1 px. Er weicht der Daumen-Quittung und der Bildschirmtastatur. |
| R4-L4 Kleinere Sichtreste | behoben | Nacht, Schritt 1–3: kein Bildpunkt über Luma 230, größter Wert 206 wie die Schrift (vorher 108 Punkte in Schritt 2 für das Kalendersymbol und 368 in Schritt 3 für die Optionsringe mit 255); Optionsknöpfe, Kästchen und Kalendersymbol sind per Filter warm und abgedunkelt. Handscanner-Rahmen in `--text-2` statt kaltgrau. Fehlerzeile nach „Bögen einlesen…“ mit „⚠“ und Rahmen. „⚠ Signatur ungültig“ ist auf dunklem Grund gefüllt (dunkle Schrift auf dem Alarmton: 7,55:1 nachts, 9,44:1 im Dunkel-Modus), die Warnmarken bleiben Umrisse. Umschalter in der Reihenfolge Standard, Feld, Dunkel, Nacht: „Nacht“ liegt nicht mehr neben „Feld“. Anleitungs-Aufnahmen (`public/screenshots/`, `npm run screenshots` + `npm run bilder-webp`) auf den aktuellen Stand gebracht, darunter `start-schmal.png` mit dem Klappknopf „Standard ▾“. Offen bleibt: Schritt 4 (Fahrzeuge) hat 4 Bildpunkte über Luma 230, die taktischen Zeichen tragen mit Absicht eine helle Unterlage. |
