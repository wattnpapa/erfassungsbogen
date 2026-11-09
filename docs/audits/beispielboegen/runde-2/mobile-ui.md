# Audit „Mobile UI", Schwerpunkt Beispielbögen, Runde 2 (Nachprüfung und neue Befunde)

Prüfer: Rollenaudit `mobile-ui-reviewer` · Datum: 2026-11-09 · Prüfgegenstand: Live-Seite
`https://erfassungsbogen.app/` (Stand `main`, Commit `085a93b`), nur der Bereich Beispielbögen:
Abschnitt „Beispielbögen" auf der Startseite und Dialog „Beispielbögen"
(`src/app/beispiele-dialog.tsx`, nachgeladen über `src/app/fusszeile.tsx`) ·
Zählung: **P0 0 · P1 1 · P2 3 · P3 2 · Hinweise 3**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/beispielboegen/mobile-ui.md`
(Runde 1), `docs/audits/beispielboegen/README.md` mit „Stand der Behebung", `DESIGN.md`
(Deckel-Regel: feste Leisten wachsen nicht mit der Systemschrift, Umbrüche per Container-Abfrage,
nie per `@media`), zum Nachschlagen `src/app/beispiele-dialog.tsx`, `src/app/fusszeile.tsx` und die
Regeln `beispiel-*`, `dialog.beispiele-dialog` in `index.html`.

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()`), Locale de-DE,
`deviceScaleFactor` 1, `hasTouch` und `isMobile` für Telefon-Viewports; zusätzlich
`devices['iPhone 13']` (390 x 664, Faktor 3). Viewports 320 x 568, 360 x 640, 390 x 844, quer
844 x 390, Tablet 820 x 1180; für die Tabellenschwelle zusätzlich 1024, 1100 und 1280 px. Ansichten
„Standard" und „Feld" (über „Ansicht: Standard ▾"). Große Schrift: Die App hat keinen eigenen
Schalter „Schrift groß"; die Grundschrift des Browsers wurde wie in Runde 1 per CDP
`Page.setFontSizes` auf 24 px (150 %) und 32 px (200 %) gesetzt, die App setzt dann selbst
`html.schrift-gross`. Langsames Netz per CDP `Network.emulateNetworkConditions` (600 ms Latenz,
40 kB/s), ohne Netz per `context.setOffline`. Kein Eingriff ins DOM; Skripte lesen Maße, Fokus,
Live-Region und Rollstand, setzen höchstens `scrollTop` des Dialogs und lösen Klicks aus.
Wege: Startseite → „Beispielbögen ansehen" → Wurzel, ASB, DRK, Katastrophenschutz, THW (101 Bögen),
THW → „Alle Einheiten aller Ortsverbände (nach Landesverband, Regionalstelle, OV)" →
Baden-Württemberg → RSt Villingen-Schwenningen → OV Bad Säckingen (fünf Ebenen); „Bremen,
Niedersachsen" und zurück; Suche „Oldenburg", „OV Bad", „xyzqq"; „‹ Zurück", Pfad „Alle", Escape,
Tab/Umschalt+Tab. Skripte und Bildschirmfotos unter `/tmp/claude-0/r2-mobile/`.

Annahmen: frischer Browser (Erststart) ohne eigene Daten. Ladezeiten entsprechen der
Prüfumgebung. „Anzeigen", „PDF", „Link" und „Alle … in eine Übungs-Sammlung" wurden nicht ausgelöst
(außerhalb Layout/Bedienung des Dialogs).

Nicht prüfbar: Bildschirmtastatur (Chromium emuliert sie nicht; die Wirkung auf die Suche ist unter
Hinweis BB2-H3 abgeschätzt), echte Safe-Area-Werte (`env(safe-area-inset-*)` = 0), WebKit/iOS
Safari, echte Systemschrift-Skalierung von Android/iOS, tatsächliche Ansagen von
VoiceOver/TalkBack (nur Fokus und Text der Live-Region gemessen), Handschuhe, Licht. Dass die
Live-Seite genau `085a93b` entspricht, ließ sich nur an den Merkmalen prüfen (Suche, klebende
Pfadleiste, `--beispiel-kopf`, Container-Karten, feste Dialoghöhe sind vorhanden).

## Was im Browser hält (nicht gemeldet)

- Kein seitlicher Überlauf von Seite oder Dialog in allen Viewports und Schriftstufen.
- Feste Dialoghöhe: Oberkante Dialog 16 px, Kopfzeile 17 px auf allen fünf Ebenen in allen
  Viewports (vorher Sprünge um 45 bis 110 px).
- `--beispiel-kopf` folgt der gemessenen Kopfzeile (68 px normal, 77 px bei 320 px, 81 px bei
  150 %, 93 px bei 200 %); die Pfadleiste klebt ohne Lücke darunter (Abstand 0 px).
- Nach jedem Ordnerwechsel `scrollTop` 0, Fokus auf dem Ordnernamen (`strong[aria-current]`) im
  Dialog, Live-Region z. B. „OV Bad Säckingen: 6 Bögen, 0 Unterordner".
- Escape geht eine Ebene hoch, auf oberster Ebene schließt es; in der Suche leert es das Feld und
  lässt den Dialog offen.
- Tabelle erst, wenn sie passt: bei 1024, 1100 und 1280 px `scrollWidth` = `clientWidth`
  (769/830/974 px), darunter Karten.
- Suchfeld 16 px Schrift, 44 px hoch, Platzhalter passt bei 320 px.
- Pfadziele „Alle" und „THW" mindestens 44 x 44 px.
- Ohne Netz, aber mit fertig installiertem Service Worker öffnet der Dialog in 0,7 s.

## Nachprüfung Runde 1

| ID | Stand | Gemessen |
| --- | --- | --- |
| BB-M1 | **behoben** | Kein Zerfall in Einzelbuchstaben mehr. Bei 320 x 568 normal steht die Bogenzahl in allen Zeilen unter dem Namen (Name 215 px, Zeile 61 px), „Katastrophenschutz" ungebrochen. Bei 200 % trennt der Name nur noch mit Trennstrich an Silben („Bundeseinhei-/ten)", „Katastrophen-/schutz"), Name 195 bis 265 px breit. Die Restgröße der Zeilen bei 200 % (122 bis 218 px) siehe BB2-M1. |
| BB-M2 | **behoben** | 820 x 1180 und 844 x 390: Karten statt Tabelle, Rahmen 606 bzw. 625 px, `scrollWidth` = `clientWidth`, „Link" voll im Bild (endet bei 401 bzw. 404 px). Tabelle erst ab Containerbreite über 46 rem (1024 px Fenster), dort passend. |
| BB-M3 | **teilweise** | Fokus nach Ordnerwechsel auf dem Ordnernamen im Dialog, Live-Region sagt Ordner und Zahl an; innerhalb der Ebenen landet „‹ Zurück" auf dem Namen des Elternordners. Offen: Zurück zur obersten Ebene (über „‹ Zurück", Pfad „Alle" oder Escape) setzt den Fokus immer auf die erste Zeile „ASB", nicht auf die Zeile, aus der man kam (gemessen aus THW und DRK); die Live-Region ist dort leer, die oberste Ebene wird nicht angesagt. |
| BB-M4 | **teilweise** | „›" aus dem Ordnernamen entfernt („… (nach Landesverband, Regionalstelle, OV)"), „Alle" 44 px breit, unter 40 rem „Alle › … ›" plus zwei Ebenen. Nachprüfkriterien nicht erreicht: OV Bad Säckingen bei 360 x 640 Pfadleiste 4 Zeilen, 165 px („‹ Zurück" / „Alle › …" / „› RSt Villingen-Schwenningen" / „› OV Bad Säckingen", „›" weiter freistehend am Zeilenanfang); erste Karte bei 663 px, Dialogunterkante 624 px; quer keine Zeile im ersten Bild (erste Karte 549 px, Unterkante 374 px). Ursachen siehe BB2-M2 und BB2-M3. |
| BB-M5 | **teilweise** | „‹ Zurück" klebt jetzt und ist aus der Mitte des THW-Ordners ohne Wischen erreichbar. Karte bei 390 px 225 px, drei Knöpfe in einer Zeile. Offen: bei 320 und 360 px „Link" weiter allein in der zweiten Zeile, Karte 281 px (Ziel etwa 220 px); in „Feld" bei 360 px und iPhone 13 Karte 360 px, „Link" ebenfalls allein. |
| BB-M6 | **behoben** | Kopfzeile auf allen Ebenen bei 17 px, Dialoghöhe konstant (536/608/812/358/1148 px je Viewport). |
| BB-M7 | bewusst so entschieden, nur nachgeprüft | Unverändert: „Neuen Bogen erstellen", „Neue Einsatz-Sammlung…" und „Beispielbögen ansehen" (Klasse `primaer`, `rgb(18, 39, 94)`, bei 360 px auf 1.843 px) tragen dieselbe Fläche. Nicht neu gemeldet. |
| BB-M8 | **behoben** | Register Katastrophenschutz: „Baden-Württemberg", „Mecklenburg-Vorpommern", „Nordrhein-Westfalen", „Rheinland-Pfalz" usw. in derselben Schreibweise wie unter THW. |
| BB-M9 | **teilweise** | Titel und „Schließen" stehen in einer Zeile (`flex-wrap: nowrap`), auch bei 320 px und 200 %. Offen: Zusammenfassung „Was sind Beispielbögen? …" bei 200 % weiter 28 px fett in Kennfarbe, 4 Zeilen, 168 px hoch, größer als der auf 22 px gedeckelte Titel; ASB bei 200 %: erste Karte bei 1.354 px (Unterkante 624 px). Der Titel selbst trennt bei 320 px normal und bei 150/200 % auf zwei Zeilen („Beispiel-/bögen", Kopfzeile 77 bzw. 93 px). |
| H1 | **offen** | 820 x 1180 und 844 x 390: Register weiter einspaltig, Name 461 bis 514 px breit, Zahl rund 450 px weiter rechts. |
| H2 | **behoben** | Über den Karten „101 Bögen direkt in „THW", außerhalb der Ordner oben". |
| H3 | **offen** | `border-left-color: var(--akzent)` bei `:hover` (nur `hover: hover`) und `:focus-visible` unverändert. |
| H4 | **offen, nicht prüfbar** | Dialoghöhe `calc(100dvh - min(2rem, 32px))`, Dialog und klebende Kopfzeile ohne `env(safe-area-inset-*)`; Chromium meldet 0. Am Gerät prüfen. |

## Befunde

### BB2-M1 [P1] Große Schrift: Klebende Pfadleiste wächst ungedeckelt und verdeckt bis zu 97 % des Dialogs

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** neu (Folge der klebenden Pfadleiste aus der Behebung zu BB-M5/BB-G5)

**Ort:** Dialog „Beispielbögen", jeder Ordner, besonders THW → „Alle Einheiten aller
Ortsverbände (…)" und tiefer; 360 x 640 und 390 x 844 bei 150 % und 200 % Schrift.

**Beobachtung (gemessen):** Die Pfadleiste ist `position: sticky` unter der Kopfzeile, ihre Schrift
und Zielhöhe sind nicht gedeckelt („‹ Zurück" 166 x 88 px, „Alle" 69 x 88 px, aktueller Ordnername
etwa 28 px fett). Bei 360 x 640 und 200 % im Ordner „Alle Einheiten aller Ortsverbände (nach
Landesverband, Regionalstelle, OV)": Pfadleiste 494 px hoch (der Ordnername allein 294 px, sieben
Zeilen); Kopfzeile bis 110 px, Pfad bis 604 px, Dialogunterkante 624 px — beim Rollen bleiben
**20 px** (3 %) für die Liste. Ein Tipp auf die Register-Zeile „Baden-Württemberg" ließ sich nicht
ausführen: Playwright meldet, dass `nav.beispiel-pfad` bzw. die Kopfzeile den Tipp abfängt. Weitere
Werte im gerollten Zustand (Anteil Kopf + Pfad an der Dialoghöhe): 360 x 640 / 200 % THW 48 %,
OV Bad Säckingen bei 390 x 844 / 200 % 54 % (Pfad 344 px), 360 x 640 / 150 % OV 56 % (Pfad 258 px),
Tablet 820 x 1180 / 200 % 29 %. Eine Karte ist bei 200 % 867 bis 873 px hoch, bei 150 % 449 bis
481 px; bei 314 px freiem Raum (THW, 200 %) sind Bogenname und Knöpfe derselben Karte nie
gleichzeitig zu sehen. Die Verkürzung „Alle › … ›" greift erst ab drei Ebenen, im OV-Ordner (zwei
Ebenen) also gar nicht.

**Folge:** Wer die Systemschrift groß gestellt hat, kommt im Ordner der Ortsverbände nicht weiter:
Die Landesverbände liegen unter einer Leiste, die stehen bleibt. In tieferen Ordnern sieht man
nur einen Streifen der Liste und muss Knöpfe antippen, deren Bogen hinter der Leiste steht.
Ausgerechnet die Behebung für langes Wischen (BB-M5) blockiert hier die Bedienung.

**Empfehlung:** Die Pfadleiste wie andere feste Leisten nach der Deckel-Regel in `DESIGN.md`
behandeln: Schrift, Zielhöhe und Polster in px deckeln. Den aktuellen Ordnernamen in der klebenden
Fassung auf eine Zeile kürzen (Auslassung, voller Name im Inhalt darunter) oder nur „‹ Zurück" und
den Namen kleben lassen. Zusätzlich die Leiste nur kleben lassen, solange sie höchstens einen
kleinen Teil der Dialoghöhe braucht (sonst normal mitrollen).

**Nachprüfung:** 360 x 640 bei 32 px Grundschrift, Ordner der Ortsverbände und OV Bad Säckingen,
Dialog gerollt: Kopf + Pfad höchstens etwa 30 % der Dialoghöhe; jede Register-Zeile per Tipp
erreichbar; bei 150 % passen Name und Knöpfe einer Karte gleichzeitig in den freien Raum.

### BB2-M2 [P2] Querformat: Pfad wird nicht verkürzt, Kopf und Pfad nehmen 59 % der Höhe, kein Bogen im ersten Bild

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** neu (Rest von BB-M4 im Querformat)

**Ort:** Dialog „Beispielbögen", Ordner unterhalb von THW → Ortsverbände; 844 x 390.

**Beobachtung (gemessen):** Die Verkürzung „Alle › … ›" hängt an `@media (max-width: 40rem)` und
greift bei 844 px Fensterbreite nicht. OV Bad Säckingen: voller Pfad über drei Zeilen („‹ Zurück" /
„Alle › THW › Alle Einheiten aller Ortsverbände (nach Landesverband, Regionalstelle, OV)" /
„› Baden-Württemberg › RSt Villingen-Schwenningen › OV Bad Säckingen"), 144 px. Beim Rollen klebt
er unter der 68 px hohen Kopfzeile: 212 von 358 px (59 %) belegt, frei **145 px**; eine Karte ist
227 px hoch und passt nie ganz hinein. Im Bildschirmfoto nach dem Rollen steht direkt unter der
Pfadleiste die Knopfzeile „Anzeigen / PDF / Link" einer Karte, deren Name hinter der Leiste liegt;
darunter beginnt die nächste Karte. Ohne Rollen nach dem Ordnerwechsel: erste Karte bei 549 px,
Dialogunterkante 374 px — das erste Bild zeigt nur Kopf, Erklärung, Suche und Pfad.

**Folge:** Am Telefon quer (Fahrzeughalterung, Tisch) muss man in jedem Ortsverband erst rollen
und sieht dann Knöpfe ohne den zugehörigen Bogen. Ein Tipp auf „Anzeigen" kann den falschen Bogen
öffnen; die Prüfung, welcher Bogen gemeint ist, verlangt Hin- und Herrollen.

**Empfehlung:** Die Verkürzung per Container-Abfrage an der Dialogbreite und zusätzlich an niedriger
Höhe entscheiden (`DESIGN.md`: Umbrüche nie per `@media`), im Querformat den Pfad auf eine Zeile
halten (Auslassung wie im Hochformat, „‹ Zurück" in derselben Zeile). Bei niedriger Höhe die
Pfadleiste nicht kleben lassen oder auf „‹ Zurück" + Ordnername reduzieren.

**Nachprüfung:** 844 x 390, OV Bad Säckingen: Pfadleiste eine Zeile (höchstens etwa 52 px), im
gerollten Zustand mindestens eine ganze Karte sichtbar; nach dem Wechsel beginnt die erste Karte im
ersten Bild.

### BB2-M3 [P2] Nach jedem Ordnerwechsel stehen Erklärung, Suche, Hinweis und Sammelweg vor dem ersten Bogen

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** neu (Ursache des offenen Teils von BB-M4; verstärkt durch die neue Suche)

**Ort:** Dialog „Beispielbögen", jeder Ordner mit Bögen; 320 x 568, 360 x 640, 390 x 844, quer,
„Feld".

**Beobachtung (gemessen):** Der Dialog rollt nach jedem Wechsel auf 0. Über der Pfadleiste stehen
auf jeder Ebene die Zusammenfassung „Was sind Beispielbögen? …" und das Suchfeld mit Beschriftung:
Pfadleiste beginnt bei 230 px (320 px: 239 px), also 145 bis 154 px unter der Kopfzeile; bei
150 % bei 344 px, bei 200 % bei 480 px (Dialogunterkante 624 px). Zwischen Pfad und erster Karte
liegen im OV-Ordner zusätzlich der Hinweis „Die Bögen der THW-Ortsverbände lädt die App nicht
vorab …" (3 Zeilen), „6 Bögen" und der Sammelweg „Alle 6 in eine Übungs-Sammlung" mit drei Zeilen
Erklärung. Erste Karte in OV Bad Säckingen: 320 x 568 bei 728 px (Unterkante 552 px), 360 x 640 bei
663 px (624), 390 x 844 bei 619 px mit Knöpfen bei 788 bis 832 px (828, Knopfzeile angeschnitten),
„Feld" 360 x 640 bei 887 px (624), iPhone 13 bei 833 px (648). In ASB bei 200 %: 1.354 px.

**Folge:** Das Ziel der Navigation, der Bogen, liegt nach jedem Tipp unter dem ersten Bild; der
gleiche Kopfblock wird auf jeder Ebene erneut gezeigt. Am Telefon heißt jeder Ordnerwechsel:
tippen, dann wischen.

**Empfehlung:** Erklärung und Suche nur auf der obersten Ebene (oder in der Suche) zeigen bzw. in
Ordnern nach dem Wechsel so rollen, dass die Pfadleiste oben steht. Den OV-Hinweis und die
Erklärung zum Sammelweg kürzen (eine Zeile, Rest aufklappbar), damit die erste Karte mit ihren
Knöpfen im ersten Bild beginnt.

**Nachprüfung:** OV Bad Säckingen bei 360 x 640 und in „Feld": erste Karte einschließlich ihrer
Knopfzeile im ersten Bild; bei 320 x 568 mindestens Titel der ersten Karte.

### BB2-M4 [P2] Suchtreffer-Ordner zeigen den ganzen Pfad: 5 bis 9 Zeilen je Treffer, das Unterscheidende steht am Ende

**Typ:** Layout/Text
**Neu oder alt (Verweis):** neu (Suche neu seit Runde 1)

**Ort:** Dialog „Beispielbögen", Suchfeld; 320 x 568, 360 x 640, 200 % Schrift.

**Beobachtung (gemessen):** Jeder gefundene Ordner trägt den vollen Pfad als Namen, mit „›" als
Trenner, z. B. „THW › Alle Einheiten aller Ortsverbände (nach Landesverband, Regionalstelle, OV) ›
Bremen, Niedersachsen › RSt Oldenburg". „Oldenburg" bei 360 px: 2 Ordner, 7 und 9 Zeilen, 184 und
232 px hoch; bei 320 px 157 und 205 px; bei 200 % 506 und 746 px. Erste Bogenkarte bei 705 px
(360 x 640, Unterkante 624). „OV Bad": 19 Ordner (Hinweis „Nicht alle Treffer gezeigt"), je 133 bis
184 px, also rund 2.900 px Ordner vor dem ersten der 60 Bögen; die ersten Treffer sind
„… › Baden-Württemberg" und „… › Bayern › RSt Bad Tölz", weil „Bad" auch in „Baden" steckt. Die
ersten 75 Zeichen sind bei allen OV-Treffern gleich, der Name des gesuchten Ordners steht in der
letzten Zeile. Das „›" im Namen, in Runde 1 aus dem Ordnernamen entfernt, kehrt so in jedem
Treffer zurück. Nach Antippen eines Treffers ist das Suchfeld leer; der Rückweg zur Trefferliste
verlangt erneutes Tippen.

**Folge:** Mit offener Bildschirmtastatur bleibt unter dem Suchfeld (bei 360 x 640 Unterkante
214 px) Platz für etwa einen Treffer, und der zeigt fast nur den immer gleichen Vorspann. Wer
„OV Bad" sucht, wischt durch Landes- und Regionalstellen, bevor ein Ortsverband erscheint.

**Empfehlung:** Den Treffer mit dem eigenen Ordnernamen beginnen und den Pfad als leise zweite
Zeile darunter setzen, ohne den gleichbleibenden Vorspann („THW › Alle Einheiten …" weglassen
oder auf „THW-OV" kürzen). Treffer auf der Ordner-Ebene mit Wortanfang höher reihen als
Teilwort-Treffer; bei vielen Ordnern die Bögen nicht ganz ans Ende schieben.

**Nachprüfung:** 360 x 640, „Oldenburg": jeder Ordner-Treffer höchstens zwei Zeilen Name plus eine
Zeile Pfad; „OV Bad": OV-Ordner vor „Baden-Württemberg".

### BB2-M5 [P3] Erster Tipp auf „Beispielbögen ansehen": keine Rückmeldung während des Nachladens, ohne Netz ersetzt eine Fehlerseite die ganze App

**Typ:** Bedienung/Rückmeldung
**Neu oder alt (Verweis):** neu (Dialog seit Runde 1 nachgeladen)

**Ort:** Startseite, Knopf „Beispielbögen ansehen", erster Tipp; 360 x 640.

**Beobachtung (gemessen):** Der Dialog liegt in einem eigenen Baustein
(`beispiele-dialog-*.js`, 101 kB, 26 kB komprimiert), `<Suspense fallback={null}>`. Zeit vom Tipp
bis zum offenen Dialog: 0,4 bis 1,1 s im Prüfnetz, 2,3 s bei 600 ms Latenz und 40 kB/s. In dieser
Zeit ändert sich nichts: Knopf aktiv, kein Ladehinweis, kein `aria-busy`. Ohne Netz, bevor der
Service Worker den Kern vorgehalten hat (frisch geladene Seite, dann Netz weg): nach dem Tipp
erscheint statt der Startseite die Fehlerseite „Hier ist etwas schiefgelaufen — Ein Teil der App
konnte ohne Netz nicht geladen werden …" mit „Seite neu laden", „Zur Startseite", „Daten sichern".
Im Prüfnetz brauchte der Vorrat des Bausteins 16 s nach dem Laden. Mit fertigem Vorrat öffnet der
Dialog auch ohne Netz (0,7 s).

**Folge:** Bei schwachem Netz tippt man ein zweites Mal oder geht weiter, weil scheinbar nichts
passiert. Im Funkloch kurz nach dem ersten Aufruf verschwindet die ganze Startseite für einen
Nebenweg; die Meldung beruhigt zwar, aber der Zusammenhang ist weg.

**Empfehlung:** Während des Nachladens am Knopf eine Rückmeldung geben (z. B. „Beispielbögen werden
geladen …", Knopf solange gesperrt) und einen Ladefehler des Bausteins im Abschnitt „Beispielbögen"
abfangen („Ohne Netz noch nicht verfügbar, erneut versuchen") statt in der Fehlergrenze der App.

**Nachprüfung:** Erster Tipp bei 600 ms Latenz und 40 kB/s: innerhalb von 100 ms sichtbare
Rückmeldung; ohne Netz vor Abschluss des Vorrats: Startseite bleibt, Hinweis im Abschnitt.

### BB2-M6 [P3] Register bei 360 px: nur bei „THW" rutscht die Bogenzahl in die zweite Zeile

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** neu (Folge der Behebung zu BB-M1)

**Ort:** Dialog „Beispielbögen", oberste Ebene; 360 x 640, normale Schrift.

**Beobachtung (gemessen):** Name `flex: 1 1 9em`, Zahl rechts; „3.634 Bögen ›" ist breiter als die
übrigen Zahlen. Bei „ASB" bis „Praktische Ausbildung" steht die Zahl in der Zeile (Zeile 52 px,
„BBK (Bundeseinheiten)" und „Praktische Ausbildung" zweizeilig mit 64 px), bei „THW" allein unter
dem Namen (Name 255 px, Zeile 61 px). Bei 320 px stehen dagegen alle Zahlen unten (Zeilen 61 px),
bei 390 px alle in der Zeile.

**Folge:** Die rechte Zahlenspalte des Registers bricht ausgerechnet beim größten und meistgenutzten
Ordner ab; das Auge findet die Zahl nicht an der erwarteten Stelle.

**Empfehlung:** Entscheidung „Zahl in der Zeile oder darunter" für das ganze Register einheitlich
treffen (Container-Abfrage auf die Registerbreite) statt je Zeile nach Inhaltsbreite.

**Nachprüfung:** 360 x 640: alle Zahlen in derselben Lage (alle rechts oder alle unten).

## Hinweise (ohne Priorität)

- **BB2-H1 (Layout, neu):** Tablet 820 x 1180: Karten einspaltig, je 606 px breit und 227 px hoch;
  Inhalt links, Knöpfe in einer kurzen Zeile, rechts etwa 200 px leer. Zusammen mit dem einspaltigen
  Register (H1) wirkt die Tablet-Ansicht wie ein gestrecktes Telefon; ein zweispaltiges
  Kartenraster würde die Rollstrecke halbieren.
- **BB2-H2 (Bedienung, neu):** Die Live-Region meldet im Ordner der Ortsverbände „Alle Einheiten
  aller Ortsverbände (nach Landesverband, Regionalstelle, OV): 0 Bögen, 8 Unterordner". „0 Bögen"
  ist korrekt, klingt angesagt aber wie ein leerer Ordner; bei Ordnern ohne lose Bögen reicht die
  Zahl der Unterordner.
- **BB2-H3 (Formular, nicht prüfbar):** Bildschirmtastatur nicht emulierbar. Bei 360 x 640 endet das
  Suchfeld bei 214 px; eine übliche Tastatur von 260 bis 300 px lässt darunter etwa 100 bis 150 px,
  bei 844 x 390 quer praktisch nichts. Zusammen mit BB2-M4 am Gerät prüfen, ob nach Eingabe
  mindestens ein Treffer lesbar bleibt.

## Mobile-Breakpoint-Beobachtungen

- **320 x 568:** Register mit Zahl unter dem Namen (gut lesbar); Titel trennt auf zwei Zeilen;
  OV-Pfad 4 Zeilen, erste Karte 176 px unter dem ersten Bild; „Link" in zweiter Kartenzeile.
- **360 x 640:** wie 320, zusätzlich uneinheitliche Zahlenlage (BB2-M6); bei 150/200 % blockiert die
  klebende Pfadleiste (BB2-M1).
- **390 x 844:** Karten einzeilig (225 px); erste Karte knapp im ersten Bild, Knopfzeile angeschnitten.
- **844 x 390:** keine Pfadverkürzung, 59 % Kopf + Pfad, keine Karte im ersten Bild (BB2-M2).
- **820 x 1180:** Karten statt Tabelle (BB-M2 behoben), Register und Karten einspaltig (H1, BB2-H1).

## Was zuerst beheben

1. BB2-M1: Pfadleiste deckeln und in der Höhe begrenzen (sonst bei großer Schrift nicht bedienbar).
2. BB2-M2: Verkürzung per Container- bzw. Höhenabfrage, auch quer einzeilig.
3. BB2-M3: Erklärung und Suche nicht vor jeden Ordner setzen; erste Karte ins erste Bild.
4. BB2-M4: Suchtreffer mit eigenem Namen vorn, Pfad leise darunter.
5. BB-M3-Rest: Fokus beim Rückweg auf die Zeile des verlassenen Ordners.
