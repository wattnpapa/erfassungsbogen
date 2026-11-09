# Audit „Handschuh-Bedienung“, Schwerpunkt Beispielbögen, Runde 2 (Nachprüfung und neue Befunde)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-11-09 ·
Prüfgegenstand: Live-Seite `https://erfassungsbogen.app/` (Code-Stand `085a93b`, `main`), nur der Bereich Beispielbögen

**Zählung:** P0: 0 · P1: 2 (BB2-G1, BB2-G2) · P2: 1 (BB2-G3) · P3: 4 (BB2-G4 bis BB2-G7) · Hinweise ohne Priorität: 3 (H1 bis H3)
· Nachprüfung Runde 1: behoben 3 · teilweise 4 · offen 3 (je ID unten)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `../handschuh-bedienung.md` (Runde 1, Aufbau und Messverfahren),
`../README.md` mit „Stand der Behebung“ (Nr. 7 bis 11 und 21 betreffen diese Rolle), zum Nachschlagen
`src/app/beispiele-dialog.tsx` und die Regeln `beispiel-…`/`beispiele-dialog` in `index.html`. Je Sachverhalt ein Befund, mit Typ
(Daten/Verlust, Bedienung, Layout/Abstand, Text) und Kennzeichnung „gemessen“, „im Bild“ oder „aus Messung abgeleitet“.

## Urteil aus Sicht der Rolle

Im Hochformat ist der Bereich mit Handschuh jetzt besser zu bedienen als in Runde 1: Die Karten bleiben beim Nachladen fast stehen
(Verschiebung 1 bis 4 px statt 50 px, kein Fehltreffer in 47 bis 55 Stichproben), „‹ Zurück“ und der Pfad kleben unter dem Kopf und
sind nach beliebig vielen Wischern mit einem Tipp erreichbar, „Alle“ ist 44 px breit, die Kopfzeile springt nicht mehr, der Dialog
öffnet wieder im zuletzt offenen Ordner, im Querformat gibt es Karten statt einer seitlich rollenden Tabelle. Neu entsteht Reibung an
zwei Stellen, die beide mit den Korrekturen zusammenhängen: Die klebende Pfadleiste ist in tiefen Ordnern zwei bis vier Zeilen hoch
und lässt im Querformat nur einen Streifen von 55 px (Feld) bzw. 145 px (Standard) frei, in dem nie Einheit und Knöpfe zusammen zu
sehen sind; und der neue Knopf „Alle … in eine Übungs-Sammlung“ steht genau dort, wo der zweite Tipp eines Doppeltipps auf die
Registerzeile landet, und legt dann ohne Rückfrage eine Übungs-Sammlung an und wechselt in sie. Die Aufgabe „Beispielbogen ansehen,
als PDF holen oder Link weitergeben“ ist ohne fremde Hilfe zu schaffen, im Querformat eines Telefons (844 × 390) im Modus „Feld“ nur
mit sehr genauem Rollen.

## Prüfaufbau

Chromium über das global installierte Playwright (`chromium.launch()` ohne Optionen), `isMobile`, `hasTouch`, `deviceScaleFactor` 1,
Locale de-DE, Touch-Tipps über `touchscreen.tap()`/`tap()`. Viewports 320 × 568, 360 × 640, 390 × 844, quer 640 × 360 und 844 × 390,
jeweils Anzeigemodus „Standard“ und „Feld“ (über `eeb.anzeigemodus.v1` = `feld` vor dem Laden; Grundschrift 17,92 px). Für einzelne
Messungen wurde der Einstiegsordner über `sessionStorage` `eeb.beispiel-pfad.v1` vor dem Laden gesetzt (dieselbe Funktion, die die
App selbst benutzt); der Weg über Tipps wurde zusätzlich bei 360 × 640 durchgegangen. Weg: Startseite → „Beispielbögen ansehen“ →
„THW“ (101 Bögen direkt, Unterordner „Alle Einheiten aller Ortsverbände (nach Landesverband, Regionalstelle, OV)“ mit 3 533) →
„Baden-Württemberg“ → „RSt Biberach“ → „OV Biberach/Riß“ (6 Karten), dazu Suche „Biberach“. Gemessen: Maße und Abstände per
`getBoundingClientRect`, Treffer per `elementFromPoint`, Nachladen ungedrosselt und gedrosselt (150 ms Latenz, 200 KiB/s, über CDP),
Doppeltipps mit 150 bis 700 ms Abstand. DOM und CSS nicht verändert, kein eingeschleustes Skript. Jeder Lauf in frischem Browser
(kein Service-Worker-Vorrat). Skripte und Bildschirmfotos in `/tmp/claude-0/r2-handschuh/` (außerhalb des Repositorys).

**Annahmen:** Ein Handschuhfinger trifft mit etwa 8 bis 14 px Abweichung um die gezielte Stelle; Mindestmaß 44 × 44 px, im Modus
„Feld“ 48 px. Ein Doppeltipp (prellender Finger, unsicheres „hat es reagiert?“) kommt mit Handschuh regelmäßig vor. Als bequem
einhändig erreichbar gilt das untere bis mittlere Drittel des Bildschirms. Beispielbögen sind Übungs- und Ausbildungsmaterial, kein
Einsatzweg; die Prioritäten sind daran gemessen.

**Nicht prüfbar:** echte Handschuhe und echte Fingerauflage; die Bildschirmtastatur (Playwright blendet keine ein, daher ist offen,
ob das Suchfeld bei geöffneter Tastatur im Bild bleibt); das Löschen-Kreuz von Safari/iOS (gemessen ist das von Chromium); die echte
Zurück-Geste von Android (ersatzweise Escape, das denselben `cancel` des Dialogs auslöst); Scroll-Verankerung in Safari (Chromium gleicht
eingeschobene Inhalte aus, Safari tut das nach unserem Kenntnisstand nicht – nicht geprüft); Share-Sheet hinter „Link“;
Electron- und App-Fassung.

## Messwerte im Überblick

| Ziel | 320 × 568 | 360 × 640 | 390 × 844 | 640 × 360 | 844 × 390 | Feld (360 × 640) |
| --- | --- | --- | --- | --- | --- | --- |
| Dialoghöhe (fest) | 536 | 608 | 812 | 328 | 358 | 608 |
| „Schließen“, Lage | 89 × 44, y 37 | 96 × 44, y 33 | 96 × 44, y 33 | 96 × 44, y 33 | 96 × 44, y 33 | 107 × 48, y 39 |
| Suchfeld | 238 × 44 | 278 × 44 | 308 × 44 | 494 × 44 | 512 × 44 | 276 × 54 |
| Schrift im Suchfeld | 16 px | 16 px | 16 px | 16 px | 16 px | 17,92 px |
| Löschen-Kreuz, wirksam ab rechtem Rand | 24 px | 24 px | – | 24 px | – | 24 px |
| „‹ Zurück“ | 84 × 44 | 84 × 44 | 84 × 44 | 84 × 44 | 84 × 44 | 100 × 54 |
| Pfad-Link „Alle“ | 44 × 44 | 44 × 44 | 44 × 44 | 44 × 44 | 44 × 44 | 44 × 54 |
| „…“ im verkürzten Pfad (kein Ziel) | 29 × 21 | 29 × 21 | 29 × 21 | 29 × 21 | nicht verkürzt | 35 × 25 |
| Pfadleiste klebend, Höhe im OV-Ordner | 121 (Feld 146–200) | 121 | 121 | 52 | 144 | 146 |
| frei unter Kopf + Pfad beim Rollen | 337 (Feld 304) | 418 | 622 | 207 | 145 | 376 |
| Darstellung im Ordner | Karten | Karten | Karten | Karten | Karten | Karten |
| „Alle … in eine Übungs-Sammlung“ | 238 × 60 | 255 × 44 | 255 × 44 | 255 × 44 | 255 × 44 | 276 × 72 |
| Anzeigen / PDF / Link | 104 / 72 / 71 × 44 | 104 / 72 / 71 × 44 | 104 / 72 / 71 × 44 | 104 / 72 / 71 × 44 | 104 / 72 / 71 × 44 | 125 / 86 / 85 × 54 |
| Abstand waagrecht / zur 2. Knopfzeile | 20 / 10 px | 20 / 10 px | 20 / 18 px, eine Zeile | 20 / 18, eine Zeile | 20 / 19, eine Zeile | 21 / 10 px |
| Kartenhöhe OV-Ordner | 300 (Feld 360) | 281–302 | 225 | 225 (Feld 270) | 225 (Feld 270) | 360 |
| Dialog-Inhalt Ordner „THW“ (scrollHeight) | 29 446 | 30 158 | 23 694 | 23 502 | 23 489 | 34 940 |

## Nachprüfung Runde 1

| ID | Ergebnis | Gemessen in Runde 2 |
| --- | --- | --- |
| BB-G1 | **teilweise** | Im Querformat jetzt Karten (640 × 360 und 844 × 390, Standard und Feld): Tabellenrahmen `clientWidth` = `scrollWidth` (494/494, 625/625, Feld 556/556, 623/623), Anzeigen, PDF und Link in einer Zeile innerhalb des Dialogs, kein Seitwärtswisch mehr. Die Prüfbedingung „Einheit daneben lesbar“ ist aber nicht erfüllt: Von der Einheitszeile bis zur Unterkante der Knöpfe braucht eine Karte 214 px (Standard) bzw. 257 px (Feld), frei sind beim Rollen nur 207/145 px (Standard 640/844) bzw. 190/55 px (Feld). Siehe BB2-G1. |
| BB-G2 | **teilweise** | 360 × 640, Ordner „THW“, sofort 600 px gerollt, Treffer an den Knopfmitten alle 150 ms bis zum Ende der Ladezeile: ungedrosselt 47, gedrosselt 55 Stichproben, **kein Fehltreffer**, Verschiebung höchstens 3 px (Feld 4 px). Rest: Bei 390 × 844 wandert die dritte sichtbare Knopfzeile um 18 px; die Liste wächst während des Ladens insgesamt um 1 063 px (22 965 → 24 028, rund 10 px je Karte), die Platzhalter sind also noch nicht ganz so hoch wie die fertige Karte. Im OV-Ordner (gedrosselt) springen die Knöpfe beim Verschwinden der Ladezeile um 20 px nach oben. Dazu kommt der verspätete Registereintrag über der Liste (BB2-G3). |
| BB-G3 | **teilweise** | Nach „Anzeigen“ im OV-Ordner → „‹ Startseite“ → „Beispielbögen ansehen“ öffnet der Dialog wieder in „OV Biberach/Riß“ (Standard und Feld). Der Rückweg kostet aber weiterhin „‹ Startseite“ (172 × 44, oben links), Rollen bis zum Einstieg bei y 2 151 von 3 506 px (3,4 Bildschirme; Feld y 2 624 von 4 872, 4,1 Bildschirme) und einen Tipp; einen Knopf „Zurück zu den Beispielbögen“ im geöffneten Bogen gibt es nicht (kein sichtbarer Knopf mit „Beispiel“ im Text). Die Stelle in der Liste geht verloren (Dialog öffnet bei Bildlauf 0) – im Ordner „THW“ mit 101 Karten heißt das wieder rollen. |
| BB-G4 | **teilweise** | Breite behoben: „Alle“ 44 px (vorher 24), „THW“ als Link 44 bzw. 51 px (Feld), „RSt Biberach“ 94 px. Senkrechter Abstand zwischen umbrochenen Pfadzeilen weiter 0 px: 844 × 390 Standard „Alle“/„THW“ y 282–326, „Baden-Württemberg“ ab y 326; ein Treffer 8 px unter „Alle“ und unter „THW“ landet auf „Baden-Württemberg“. 320 × 568 Feld: „Alle“ bis y 414, „Baden-Württemberg“ ab y 413. |
| BB-G5 | **behoben** | Pfadleiste mit „‹ Zurück“ klebt unter der Kopfzeile (`position: sticky`, gemessen y 85 bzw. Feld y 102 nach 400 und 900 px Bildlauf, alle Viewports). Folgeproblem der Höhe: BB2-G1; Lage oben: BB2-G6. |
| BB-G6 | **offen** | Unverändert: 390 × 844 Standard sowie quer Anzeigen, PDF, Link in einer Zeile; 360 × 640 und 320 × 568 Standard sowie 360/390 Feld Anzeigen und PDF oben, Link darunter links; 320 × 568 Feld Anzeigen allein, PDF und Link darunter. Unten links ist also mal Link, mal PDF. |
| H1 (Schließen springt) | **behoben** | Feste Dialoghöhe (Viewporthöhe minus 32 px), „Schließen“ bleibt auf Wurzel und in jedem Ordner auf derselben Stelle (y 33, Feld y 34–39). |
| H2 („›“ im Ordnernamen) | **behoben** | Ordner heißt jetzt „Alle Einheiten aller Ortsverbände (nach Landesverband, Regionalstelle, OV)“. |
| H3 („Schließen“ im Feld-Modus) | **offen** | Weiter 48 px hoch (107 × 48, 114 × 48, 95 × 48), alle übrigen Ziele im Feld-Modus 54 px. Erfüllt das Maß. |
| H4 (Lage des Einstiegs) | **offen** (bewusst) | Einstieg bei 360 × 640 auf y 2 151 (mit geöffnetem Bogen); laut README bewusst nicht geändert. Wirkt auf den Rückweg (BB-G3). |

## Befunde

### BB2-G1 [P1] Die klebende Pfadleiste lässt im Querformat nur einen schmalen Streifen frei: Einheit und ihre Knöpfe sind nie zusammen zu sehen, die sichtbaren Knöpfe stehen über der nächsten Einheit

**Typ:** Layout/Abstand · **Kennzeichnung:** gemessen und im Bild (`i-844x390-feld-knoepfe-im-band.png`, `i-844x390-std-knoepfe-im-band.png`,
`h-640x360-feld-ov-zentriert.png`).

**Fundstelle:** Dialog, jeder tiefe Ordner (z. B. „OV Biberach/Riß“, „RSt Biberach“) im Querformat; abgeschwächt im Hochformat bei 320 px und im Modus „Feld“.

**Beobachtung:** Kopfzeile und Pfadleiste kleben beide oben. Die Verkürzung des Pfads auf „Alle › … › letzte zwei Ebenen“ greift nur
bis 40 rem Fensterbreite (640 px); bei 844 × 390 steht der volle Pfad mit dem langen Namen „Alle Einheiten aller Ortsverbände (nach
Landesverband, Regionalstelle, OV)“ und bricht in drei Zeilen um. Gemessen beim Rollen im OV-Ordner (Dialoghöhe 358 px):

| Viewport | Kopf bis | Pfadleiste | frei bis Dialogunterkante | Karte: Einheit bis Unterkante Knöpfe |
| --- | --- | --- | --- | --- |
| 844 × 390 Feld | y 91 | 228 px | **55 px** | 257 px |
| 844 × 390 Standard | y 85 | 144 px | **145 px** | 214 px |
| 640 × 360 Feld | y 91 | 63 px | 190 px | 257 px |
| 640 × 360 Standard | y 85 | 52 px | 207 px | 214 px |
| 320 × 568 Feld (Hochformat) | y 102 | 146 px (RSt-Ebene 200 px) | 304 px | rund 300 px |

Bei 844 × 390 Feld passt in den freien Streifen genau eine Knopfzeile (54 px hoch, Anzeigen bei y 319 bis 373); Name, Herkunft und Stärke
der Karte liegen dann unter der Pfadleiste. Rollt man ein Stück weiter, erscheint direkt unter den Knöpfen der Name der *nächsten* Karte
(„Fachgruppe Logistik-Materialwirtschaft“ unter den Knöpfen der Karte davor, im Bild). `scrollIntoView` (auch `block: "center"`) legt die
Knöpfe bei 844 × 390 vollständig unter die Pfadleiste: `elementFromPoint` an der Knopfmitte trifft die Pfadleiste (Standard und Feld).
In den Hochformaten 360 und 390 bleiben 418 bzw. 622 px frei; dort ist es unkritisch.

**Erwartung der Rolle:** Ich sehe die Einheit und die Knöpfe, die zu ihr gehören, auf einen Blick, und ich muss nicht zentimetergenau rollen.

**Auswirkung im Einsatz (Ausbildung):** Wer das Telefon quer hält (Halterung im Fahrzeug, Hülle mit Ständer) und den Feld-Modus nutzt,
der gerade für Handschuhe gedacht ist, rollt in 55-px-Schritten und tippt auf Knöpfe, deren Einheit er nicht sieht – mit gutem Grund auf
die darunter stehende, falsche. „Anzeigen“ der falschen Karte öffnet den falschen Bogen und schließt den Dialog; „PDF“ lädt die falsche Datei.
Kein Datenverlust, aber Fehlbedienung wahrscheinlich und Korrektur nur über den Rückweg aus BB-G3.

**Empfehlung:** Die Pfadleiste in niedrigen Fenstern nicht oder nur einzeilig kleben lassen (Kopf und Pfad zusammen höchstens etwa ein
Viertel der Dialoghöhe), die Verkürzung „Alle › … › letzte Ebene“ an der verfügbaren Höhe bzw. Dialogbreite statt an 40 rem Fensterbreite
festmachen, „‹ Zurück“ in die Kopfzeile neben „Schließen“ nehmen, damit der Pfad nicht eine eigene Zeile braucht; im Querformat die
Knöpfe neben oder über den Namen der Karte setzen, damit Einheit und Aktion in derselben Zeile stehen.

**Nachprüfung:** 640 × 360 und 844 × 390, Standard und Feld, OV-Ordner: beim Rollen bleiben mindestens 60 % der Dialoghöhe frei; für jede
Karte gibt es eine Rollstellung, in der Einheitsname und alle drei Knöpfe gleichzeitig ganz im Bild sind; `scrollIntoView` eines Knopfs
legt ihn nicht unter die Pfadleiste.

### BB2-G2 [P1] Doppeltipp auf eine Registerzeile legt eine Übungs-Sammlung an: der zweite Tipp trifft „Alle … in eine Übungs-Sammlung“

**Typ:** Bedienung · **Kennzeichnung:** gemessen (Treffer per `elementFromPoint` vor dem zweiten Tipp, Zustand der App danach).

**Fundstelle:** Dialog, Wurzel-Register → Ordner mit losen Bögen (THW, DRK, Bundeswehr …); neuer Knopf „Alle n in eine Übungs-Sammlung“
über der Kartenliste.

**Beobachtung:** Nach dem Ordnerwechsel rollt der Dialog nach oben; der neue Sammelknopf (255 × 44, Feld 276 × 72) liegt dann an derselben
Bildschirmstelle wie vorher die angetippte Registerzeile. Die Doppeltipp-Sperre von 400 ms gilt nur für das Register, nicht für diesen Knopf.
Zweiter Tipp an dieselbe Stelle:

- 360 × 640 Standard, „THW“ (Zeile y 552): bei 150, 300, 450 und 600 ms Abstand jedes Mal Treffer auf „Alle 101 in eine Übungs-Sammlung“.
  Der Knopf wird grau (läuft), nach wenigen Sekunden schließt der Dialog und die App steht in der neuen Sammlung „Übung: THW“ mit
  101 Einheiten, 961 Personen (Bildschirmtext nach dem Lauf; `eeb.letzterEinsatz.v1` gesetzt). Keine Rückfrage.
- Ebenso bei 450 ms: 360 × 640 Standard „DRK“ (Alle 8 …) und „Bundeswehr“, 390 × 844 Feld „DRK“ und „Bundeswehr“ (Dialog danach geschlossen).
- Andere Viewports und Ordner: der zweite Tipp landet auf Hinweistext, Suchfeld oder leerer Fläche (harmlos) oder – nach Ablauf der 400 ms –
  auf einer Unterordner-Zeile (Katastrophenschutz → „Hessen“, Praktische Ausbildung → „JUH OV Akkonia“, THW → „Alle Einheiten …“ bei 320 Feld
  und 844 × 390); innerhalb von 400 ms greift die Sperre (Katastrophenschutz bei 200 und 350 ms: bleibt).

**Erwartung der Rolle:** Ein zweiter Tipp, weil ich nicht sicher war, ob der erste angekommen ist, öffnet höchstens denselben Ordner noch einmal –
aber er legt nichts an und führt mich nicht aus dem Dialog.

**Auswirkung im Einsatz (Ausbildung):** Wer mit Handschuh nur einen Ordner öffnen wollte, steht plötzlich in einer neu angelegten
Übungs-Sammlung mit 101 Einheiten und muss erst verstehen, woher sie kommt, und sie wieder loswerden. War vorher eine eigene Sammlung offen,
ist jetzt eine andere die aktuelle. Kein Datenverlust (der eigene Bogen bleibt laut Hinweistext), aber ein unerwarteter, bleibender Zustand.

**Empfehlung:** Den Sammelweg vor dem Anlegen bestätigen lassen (mit Zahl der Bögen und Name der Sammlung) oder ihn nach dem Ordnerwechsel
für einen Moment sperren wie das Register; ihn nicht an die Stelle legen, an der eben noch eine Registerzeile stand (z. B. unter die Liste
oder rechts im Zählerkopf).

**Nachprüfung:** Alle Viewports, Standard und Feld, jede Registerzeile mit Bögen: zweiter Tipp an dieselbe Stelle nach 100 bis 800 ms legt keine
Sammlung an und schließt den Dialog nicht.

### BB2-G3 [P2] Der Unterordner „Alle Einheiten aller Ortsverbände“ erscheint erst nach rund einer halben Sekunde über der Liste und schiebt alles um 138 bis 162 px nach unten

**Typ:** Bedienung · **Kennzeichnung:** gemessen (390 × 844, gedrosselt und ungedrosselt; Höhen der Dialogteile alle 250 ms).

**Fundstelle:** Dialog, Wurzel → „THW“ in einer frischen Sitzung (OV-Verzeichnis noch nicht geladen).

**Beobachtung:** In den ersten rund 300 bis 570 ms nach dem Tipp auf „THW“ fehlt das Register ganz (kein Platzhalter-Eintrag; die Wurzel zeigt
korrekt „THW … Bögen“). Dann erscheint die Zeile „Alle Einheiten aller Ortsverbände …“ (114 px) über Zähler, Sammelknopf und Karten; der
Tabellenanfang rückt von y 502 auf y 664 (+162 px). Bei direktem Öffnen in „THW“ (gespeicherter Pfad) kam die Zeile erst nach rund 6 s,
gleichzeitig mit dem Ende der Ladezeile (+138 px). Chromium hält den sichtbaren Inhalt per Scroll-Verankerung fest (Bildlauf 601 → 763),
deshalb gab es in den Stichproben keinen Fehltreffer; in Browsern ohne diese Verankerung (nach unserem Kenntnisstand Safari/iOS, nicht geprüft)
rutscht der Inhalt um die volle Höhe. Ohne Bildlauf (Dialog oben) verschiebt der Einschub auch in Chromium den Sammelknopf genau in dem Moment,
in dem der zweite Tipp eines Doppeltipps kommt (Ursache von BB2-G2).

**Erwartung der Rolle:** Was ich sehe, bleibt stehen, bis ich tippe.

**Auswirkung im Einsatz (Ausbildung):** Ein Tipp in der ersten halben Sekunde auf „Alle 101 in eine Übungs-Sammlung“ oder auf die erste Karte trifft
nach dem Einschub etwas anderes; auf dem iPhone ist das bei jedem frühen Tipp zu erwarten.

**Empfehlung:** Den Platzhalter-Eintrag „Alle Einheiten aller Ortsverbände – wird geladen …“ sofort beim Öffnen von „THW“ in voller Höhe zeigen
(laut README vorgesehen, hier nicht beobachtet); die Ladezeile in fester Höhe stehen lassen, statt sie am Ende zu entfernen.

**Nachprüfung:** Frische Sitzung, 390 × 844, „THW“ antippen, Höhe und Lage von Register, Zähler, Sammelknopf und erster Karte alle 100 ms bis
zum Ende der Ladezeile: Tabellenanfang verschiebt sich um höchstens 4 px.

### BB2-G4 [P3] Suchfeld: Löschen-Kreuz nur 24 px breit, ein Tipp ans Feldende löscht den Suchbegriff

**Typ:** Bedienung · **Kennzeichnung:** gemessen (Tipps im Abstand von 6 bis 44 px vom rechten Rand, ±8 und ±14 px senkrecht) und im Bild
(`k-360x640-std-suche.png`, `k-360x640-std-suche-kreuz.png`).

**Fundstelle:** Dialog, Feld „Suchen“ (Platzhalter „Ort, OV oder Einheit, z. B. Oldenburg“) mit eingegebenem Begriff.

**Beobachtung:** Das Feld selbst ist gut: 44 px hoch (Feld 54), so breit wie der Dialog (238 bis 512 px), Schrift 16 px (Feld 17,92), also kein
Zoom beim Antippen; Escape leert die Suche, ohne den Dialog zu schließen. Das Löschen-Kreuz ist das des Browsers: sichtbar ein Zeichen von
etwa 10 px, wirksam bei 6, 12, 18 und 24 px vom rechten Rand, nicht mehr bei 30 px; senkrecht bei ±8 px ja, bei ±14 px nein (Feld-Modus: auch
±14 px ja). In allen Viewports und Modi gleich 24 px breit. Ein Tipp in die rechten 24 px des Felds, etwa um den Cursor ans Ende zu setzen, leert
den Begriff. Das Suchfeld rollt mit dem Inhalt weg (nach 800 px Bildlauf bei y −630); zum Ändern des Begriffs zurück nach oben rollen.

**Erwartung der Rolle:** Ein Knopf „Suche leeren“ in Daumengröße; daneben genug Feld, um den Cursor zu setzen, ohne zu löschen.

**Auswirkung im Einsatz (Ausbildung):** Gering: Mit Handschuh trifft man das Kreuz oft nicht oder löscht versehentlich und tippt den Begriff neu
– auf der Bildschirmtastatur mit Handschuh der eigentliche Aufwand.

**Empfehlung:** Ein eigener Knopf „Leeren“ (mindestens 44 × 44, Feld 54) neben dem Feld statt des Browser-Kreuzes.

**Nachprüfung:** 360 × 640, Standard und Feld: Leeren-Ziel mindestens 44 px breit; Tipp 30 px vom rechten Rand des Textfelds löscht nicht.

### BB2-G5 [P3] „…“ in der verkürzten Pfadleiste ist kein Ziel, die ausgelassenen Ebenen sind nur über mehrfaches „Zurück“ erreichbar

**Typ:** Bedienung · **Kennzeichnung:** gemessen.

**Fundstelle:** Dialog, Pfadleiste ab der dritten Ebene bei Fensterbreite bis 640 px („Alle › … › RSt Biberach › OV Biberach/Riß“).

**Beobachtung:** „…“ ist ein Listeneintrag ohne Knopf, 29 × 21 px (Feld 35 × 25), `aria-hidden`; `elementFromPoint` trifft das `li`, ein Tipp
ändert nichts (Pfad vorher = nachher, alle Viewports bis 640 px). Er steht direkt rechts an „Alle“ (Kante an Kante, x 85). „THW“, „Alle Einheiten …“
und „Baden-Württemberg“ sind im OV-Ordner nicht mehr im Pfad; dorthin geht es nur über zwei bis drei Tipps auf „‹ Zurück“ oder „Alle“ und neu
hinab. Obwohl verkürzt, ist der Pfad im Hochformat drei Zeilen hoch (121 px, Feld 146 px), weil „‹ Zurück“ eine eigene Zeile belegt und der
aktuelle Ordner umbricht.

**Erwartung der Rolle:** Was wie ein Pfadteil aussieht, kann ich antippen – „…“ klappt den Pfad auf oder führt eine Ebene hoch.

**Auswirkung im Einsatz (Ausbildung):** Gering: ein Tipp ins Leere oder ein knapp danebenliegender Tipp auf „Alle“, der ganz nach oben führt
(dann fünf Tipps zurück in den OV-Ordner).

**Empfehlung:** „…“ als Knopf (mindestens 44 × 44) gestalten, der die ausgelassenen Ebenen zeigt, oder ihn durch die übergeordnete Ebene ersetzen;
zwischen „Alle“ und „…“ Abstand lassen.

**Nachprüfung:** 360 × 640, OV-Ordner: Tipp auf „…“ zeigt die ausgelassenen Ebenen oder geht eine Ebene hoch; Treffer 8 px links von „…“ landet nicht
auf „Alle“.

### BB2-G6 [P3] Einhändig: „Schließen“ und „‹ Zurück“ stehen nur ganz oben, die Zurück-Geste geht nicht verlässlich mehrere Ebenen hoch

**Typ:** Bedienung · **Kennzeichnung:** gemessen (Lage), Escape als Ersatz für die Zurück-Geste.

**Fundstelle:** Dialog, jede Ebene; besonders 390 × 844.

**Beobachtung:** Feste Dialoghöhe: „Schließen“ steht immer bei y 33 bis 77 (Feld bis 87), „‹ Zurück“ klebt beim Rollen bei y 89 bis 133 (Feld
y 106 bis 160). Bei 390 × 844 liegen beide in den oberen 16 % des Bildschirms, der untere Bereich des Dialogs (bis y 828) hat keine Navigation.
Ersatz wäre die Zurück-Geste (laut README eine Ebene hoch). Mit Escape geprüft, jeweils ohne Tipp dazwischen: aus „Baden-Württemberg“ → „Alle
Einheiten …“ → „THW“ → **Dialog geschlossen** (statt Wurzel); in einem zweiten Lauf aus „OV Biberach/Riß“ drei Ebenen hoch bis „Alle Einheiten …“,
danach blieben drei weitere Escape ohne Wirkung; in einem dritten Lauf ging es sauber bis zur Wurzel und dann zu. Das Verhalten hängt
offenbar davon ab, ob zwischen zwei Betätigungen getippt wurde (Annahme: Schutzregel des Browsers für wiederholtes Abfangen von Zurück).

**Erwartung der Rolle:** Mit dem Daumen der Hand, die das Gerät hält, eine Ebene hoch oder zu, ohne umzugreifen; mehrmals Zurück geht mehrmals
eine Ebene hoch.

**Auswirkung im Einsatz (Ausbildung):** Gering: Umgreifen oder zweite Hand nötig; mehrfaches Zurück schließt mitunter den Dialog (der Ordner
bleibt gespeichert, Wiederöffnen kostet den Weg über die Startseite, BB-G3).

**Empfehlung:** „‹ Zurück“ zusätzlich unten im Dialog anbieten (z. B. am Listenende oder als feste Fußleiste in tiefen Ordnern); die
Zurück-Geste auf echten Android-Geräten prüfen und dokumentieren, was nach mehreren Betätigungen geschieht.

**Nachprüfung:** 390 × 844: ein Navigationsziel „eine Ebene hoch“ liegt in der unteren Hälfte; auf einem Android-Gerät führen drei Zurück-Gesten
aus dem OV-Ordner genau drei Ebenen hoch.

### BB2-G7 [P3] Zwischen „Anzeigen“ und „Link“ darunter liegen nur 10 px

**Typ:** Layout/Abstand · **Kennzeichnung:** gemessen.

**Fundstelle:** Karten bei 320 und 360 px (Standard) sowie 320/360/390 im Modus „Feld“, wo die Knöpfe zweizeilig stehen.

**Beobachtung:** Waagrecht stehen Anzeigen und PDF 20 bis 21 px auseinander, senkrecht zur zweiten Knopfzeile nur 10 px (360 × 640 Standard:
Anzeigen bis y 866, Link ab y 876; Feld: bis y 1 066, ab 1 076; 320 × 568 Feld: Anzeigen bis 1 178, PDF/Link ab 1 188). „Link“ (bzw. bei 320 Feld
„PDF“) steht genau unter „Anzeigen“. Die Tabelle der Runde 1 nannte 19 px; die heutige Messung ergibt den Zeilenabstand von 0,6 rem.

**Erwartung der Rolle:** Der Knopf, der den Dialog verlässt („Anzeigen“), hat zu seinen Nachbarn mindestens so viel Luft wie die anderen.

**Auswirkung im Einsatz (Ausbildung):** Gering: Mit 8 bis 14 px Abweichung trifft ein Tipp am unteren Rand von „Link“ leicht „Anzeigen“ – dann
schließt der Dialog und der Bogen öffnet (Rückweg BB-G3).

**Empfehlung:** Senkrecht denselben Abstand wie waagrecht (rund 20 px), zusammen mit der festen Anordnung aus BB-G6.

**Nachprüfung:** 320 und 360 px, Standard und Feld: Abstand zwischen übereinanderliegenden Knöpfen einer Karte mindestens 16 px; Treffer 10 px über
„Link“ landet nicht auf „Anzeigen“.

## Hinweise (ohne Priorität)

- **H1 Suchtreffer-Zeilen sehr hoch (Layout):** Ordner-Treffer zeigen den ganzen Pfad als Namen: bei 360 × 640 sind die beiden Treffer zu „Biberach“
  je 184 px hoch (Feld 177 px bei 276 px Breite, 320 × 568 157/181 px); die erste Karte beginnt erst bei y 818 (Feld 889). Gute Tippziele, aber viel
  Rollen; ein kürzerer Pfad (nur LV › OV) spart einen Bildschirm.
- **H2 Sammelknopf auch bei Absicht ohne Rückfrage (Bedienung):** Ein einzelner, gewollter Tipp auf „Alle … in eine Übungs-Sammlung“ schließt den
  Dialog und wechselt die App in die neue Sammlung. Das ist so beschrieben („Legt eine neue Sammlung … an“), passt aber zu BB2-G2: Eine Rückfrage
  würde beide Fälle abfangen.
- **H3 Feld-Modus im Querformat (Layout):** Bei 844 × 390 Feld ist die Pfadleiste vier Zeilen hoch (228 px) – höher als die Dialoghöhe abzüglich
  Kopf und einer Karte; das ist der Kern von BB2-G1 und zeigt, dass der Feld-Modus mit größeren Zielen die Raumnot im Querformat verschärft.

## Abschluss

- **Aufgabe geschafft:** ja im Hochformat; mit Umwegen im Querformat (sehr genaues Rollen, BB2-G1), besonders 844 × 390 im Modus „Feld“
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Im Querformat gehören die sichtbaren Knöpfe zur Karte darüber, nicht zu der Einheit, deren Name direkt darunter steht.
- **Größtes Einsatzrisiko:** Ein Doppeltipp auf „THW“ legt ohne Rückfrage eine Übungs-Sammlung mit 101 Einheiten an und macht sie zur aktuellen (BB2-G2); kein Datenverlust.
- **Top-Priorität für die nächste Iteration:** BB2-G2: den Sammelweg bestätigen lassen bzw. nach dem Ordnerwechsel sperren, danach BB2-G1 (Pfadleiste im Querformat höchstens einzeilig kleben lassen).
