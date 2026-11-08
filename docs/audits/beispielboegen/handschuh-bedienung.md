# Audit „Handschuh-Bedienung“, Schwerpunkt Beispielbögen (Startseiten-Abschnitt, Dialog, Register, Pfadleiste, Karten)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-11-08 ·
Prüfgegenstand: Live-Seite `https://erfassungsbogen.app/` (frisch deployt, Code-Stand `0dd56d4`, `main`), nur der Bereich Beispielbögen

**Zählung:** P0: 0 · P1: 0 · P2: 3 (BB-G1 bis BB-G3) · P3: 3 (BB-G4 bis BB-G6) · Hinweise ohne Priorität: 4 (H1 bis H4)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md`, `runde-21/handschuh-bedienung.md`
(Aufbau), zum Nachschlagen `src/app/fusszeile.tsx` (Dialog „Beispielbögen“) und die Regeln `beispiel-…` in `index.html`.
Je Sachverhalt ein Befund, mit Typ (Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast) und Kennzeichnung
„gemessen“, „im Bild“ oder „aus Messung abgeleitet“.

## Urteil aus Sicht der Rolle

Im Hochformat ist der Bereich mit Handschuh gut zu bedienen: Der Startknopf „Beispielbögen ansehen“ ist 182 × 44 (Feld 218 × 54),
die Registerzeilen sind über die ganze Breite antippbar und 52 bis 112 px hoch (Feld 63 bis 233), „‹ Zurück“ ist ein echter Knopf
(84 × 44, Feld 100 × 54), die Kartenknöpfe Anzeigen/PDF/Link sind 71 bis 104 px breit und 44 hoch (Feld 85 bis 125 × 54) mit 18 bis
20 px Abstand. Das Rollen im Dialog bleibt im Dialog (die Seite dahinter bewegt sich nicht, auch nicht am Listenende), ein Wisch,
der auf einem Knopf beginnt, löst nichts aus, ein Tipp auf den abgedunkelten Rand schließt nicht, und wer einen angefangenen Bogen hat,
bekommt vor dem Ersetzen die Rückfrage „Beispielbogen öffnen?“ (302 × 44, 24 px Abstand). Reibung entsteht an drei Stellen: im
Querformat stehen die Aktionen außerhalb des Bildes, während des Nachladens rutschen die Knöpfe unter dem Finger, und jeder Weg in einen
Bogen (gewollt oder versehentlich) wirft den Ordnerpfad weg. Die Aufgabe „Beispielbogen ansehen, als PDF holen oder Link weitergeben“
ist ohne fremde Hilfe zu schaffen, im Querformat nur mit einem nicht angezeigten Seitwärtswisch.

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen), `isMobile`, `hasTouch`, Pixeldichte 1, de-DE,
Touch-Tipps (`tap()`) und Wischgesten über CDP-Touch-Ereignisse. Viewports 360 × 640, 390 × 844, 320 × 568, quer 640 × 360, zur
Einordnung zusätzlich quer 568 × 320 und 844 × 390. Jeweils Anzeigemodus „Standard“ und „Feld“ (über `eeb.anzeigemodus.v1`, vor
dem Laden gesetzt; Klasse `feld-modus`, Grundschrift 17,92 px). Weg: Startseite → „Beispielbögen ansehen“ → Erklärung auf/zu →
„THW“ (101 Bögen direkt, Unterordner „Alle Einheiten aller Ortsverbände (LV › RSt › OV)“ mit 3 533) → „Baden-Württemberg“ →
„RSt Biberach“ → „OV Biberach/Riß“ (6 Karten). Gemessen: Knopfmaße und Abstände per `getBoundingClientRect`, Treffer per
`elementFromPoint` (DOM nicht verändert), Nachladen ungedrosselt und gedrosselt (150 ms Latenz, 200 KiB/s). Skripte und
Bildschirmfotos in `/tmp/claude-0/audit-handschuh/` (außerhalb des Repositorys).

**Annahmen:** Ein Handschuhfinger trifft mit etwa 8 bis 14 px Abweichung um die gezielte Stelle; als Mindestmaß gelten 44 × 44 px,
im Modus „Feld“ 48 px. Beispielbögen sind Übungs- und Ausbildungsmaterial, kein Einsatzweg; die Prioritäten sind daran gemessen.

**Nicht prüfbar:** echte Handschuhe und echte Fingerauflage; das Share-Sheet hinter „Link“ (im Prüfbrowser ohne sichtbare Rückmeldung,
„Kopiert“ erscheint nur beim Weg über die Zwischenablage); Zurück-Geste von Android als Schließen des Dialogs; Electron- und
App-Fassung; das Speichern der PDF auf einem echten Telefon (im Prüfbrowser kam der Download
`ov-biberach-riss-01-fz-log-ztr-fz-log.pdf`).

## Messwerte im Überblick

| Ziel | 360 × 640 | 390 × 844 | 320 × 568 | 640 × 360 | Feld (360 × 640) |
| --- | --- | --- | --- | --- | --- |
| „Beispielbögen ansehen“ | 182 × 44 | 182 × 44 | 182 × 44 | 182 × 44 | 218 × 54 |
| „Schließen“ (oben rechts, bleibt stehen) | 96 × 44, y 33 | 96 × 44, y 115 → 33 (H1) | 96 × 44, y 66 | 96 × 44, y 33 | 114 × 48 |
| „Was sind Beispielbögen? …“ | 278 × 44 | 308 × 44 | 238 × 44 | 494 × 44 | 276 × 54 (320: 236 × 76) |
| Registerzeile | 278 × 52 bis 112 | 308 × 52 bis 88 | 238 × 52 bis 160 | 494 × 52 | 276 × 63 bis 179 |
| „‹ Zurück“ | 84 × 44 | 84 × 44 | 84 × 44 | 84 × 44 | 100 × 54 |
| Pfad-Link „Alle“ / „THW“ | 24 × 44 / 32 × 44 | 24 × 44 / 32 × 44 | 24 × 44 / 32 × 44 | 24 × 44 / 32 × 44 | 28 × 54 / 38 × 54 |
| Anzeigen / PDF / Link | 104 / 72 / 71 × 44, Link 2. Zeile | 104 / 72 / 71 × 44, eine Zeile | wie 360 | Tabelle, außerhalb (BB-G1) | 125 / 86 / 85 × 54, Link 2. Zeile |
| Abstand Anzeigen–PDF / zur 2. Zeile | 20 / 19 px | 20 / 18 px (PDF–Link) | 20 / 19 px | 6 und 7 px (Tabelle) | 21 / 22 px |
| Dialoghöhe im Ordner „THW“ (scrollHeight) | 28 043 px | 21 489 px | 27 767 px | 7 566 px | 33 316 px |

## Befunde

### BB-G1 [P2] Querformat: Anzeigen, PDF und Link stehen rechts außerhalb des Dialogs; nach dem Seitwärtswisch fehlt die Einheit

**Typ:** Layout/Abstand · **Kennzeichnung:** gemessen und im Bild (640 × 360, Standard und Feld; zur Einordnung 568 × 320 und 844 × 390).

**Fundstelle:** Dialog „Beispielbögen“ im Querformat, jede Ebene mit Bögen (z. B. „THW“, „OV Biberach/Riß“).

**Beobachtung:** Bei 640 px Breite bleibt die Liste eine Tabelle (die Kartenform greift erst unter 34 rem). Der Tabellenbehälter ist
494 px breit, die Tabelle 763 px (Feld: 556 gegen 908 px). „Anzeigen“ beginnt bei x 567, genau am rechten Rand des sichtbaren Bereichs,
„PDF“ (x 677) und „Link“ (x 756) liegen ganz außerhalb; im ersten Bild ist von der Spalte „Bogen“ nur der Rand des Kopfs zu sehen
(Bild `j-640x360-standard-tabelle.png`). Ein Seitwärtswisch auf einer Zeile schiebt die Tabelle um 269 px; dann sind die drei Knöpfe
im Bild, Einheit und Ort aber abgeschnitten („adt“, „ach/Riß“, Bild `k-640x360-querwisch.png`). 568 × 320: Anzeigen bei x 535 von 527
sichtbar. 844 × 390: Anzeigen sichtbar, PDF halb, Link außerhalb. Kein Hinweis, dass die Tabelle seitlich weitergeht. Der Kopf
„Beispielbögen / Schließen“ bleibt stehen (68 von 328 px, Feld 73), sodass bei 360 px Höhe zwei Tabellenzeilen ins Bild passen.

**Erwartung der Rolle:** Die Aktionen einer Zeile stehen neben dem, was sie betreffen, ohne Seitwärtswischen.

**Auswirkung im Einsatz (Ausbildung):** Wer das Telefon quer hält (Halterung im Fahrzeug, Tablet-Hülle), findet die Knöpfe nicht oder
tippt nach dem Wisch auf eine Zeile, deren Einheit er nicht mehr sieht. Ein zweiter Wisch, der schräg gerät, rollt senkrecht statt seitlich.

**Empfehlung:** Die Kartenform auch im Querformat verwenden, solange die Tabelle nicht ganz in den Dialog passt, oder die Aktionen als
erste Spalte bzw. unter den Namen setzen.

**Nachprüfung:** 640 × 360 und 844 × 390, Standard und Feld, Ordner „THW“: Anzeigen, PDF und Link jeder Zeile ohne Seitwärtswisch
vollständig im Bild, Einheit daneben lesbar.

**Hinweis zur Ursache:** Umbruchgrenze nach Fensterbreite, nicht nach Dialogbreite (der Dialog ist quer höchstens 544 px breit, Feld 608).

### BB-G2 [P2] Beim Nachladen der Angaben rutschen die Karten nach unten: ein Tipp auf „Link“ trifft „Anzeigen“

**Typ:** Bedienung · **Kennzeichnung:** gemessen (Treffer per `elementFromPoint`, 360 × 640, Standard).

**Fundstelle:** Dialog, Ordner „THW“ (101 Bögen), in den ersten Sekunden nach dem Öffnen; Anzeige „Angaben werden geladen … n von 101“.

**Beobachtung:** Karten erscheinen zuerst mit Platzhaltern („…“), dann füllen sich Herkunft, Träger, Ebene und Fahrzeuge. Ungedrosselt,
Dialog auf 600 px gerollt: Die Mitte von „Link“ (x 85, y 529) liegt nach 0,66 s auf „Anzeigen“ der nächsten Zeile. Gedrosselt rutscht
„Anzeigen“ von y 152 auf y 202 (50 px), der Bildlauf springt dabei von 600 auf 650 und am Ende auf 627; der Ladevorgang dauert
ungedrosselt mehrere Sekunden (27 von 101 nach rund 1,5 s), gedrosselt 12 s. Am Ende verschwindet die Zeile „Angaben werden geladen …“, alles
rückt noch einmal nach oben. „Anzeigen“ öffnet den Bogen sofort und schließt den Dialog (ohne angefangenen Bogen ohne Rückfrage).

**Erwartung der Rolle:** Was ich gerade sehe, bleibt stehen, bis ich tippe.

**Auswirkung im Einsatz (Ausbildung):** Wer gleich nach dem Öffnen eines Ordners den Link eines Bogens weitergeben will, landet im Bogen
und verliert den Ordnerpfad (BB-G3). Mit Handschuh, wo der Tipp ohnehin langsamer kommt, fällt der Tipp genau in die Zeit des Nachladens.

**Empfehlung:** Platzhalter in der endgültigen Höhe anlegen (Herkunft drei Zeilen, Stärke zwei Zeilen) und die Ladezeile in fester Höhe
stehen lassen, oder die Knöpfe einer Karte erst freigeben, wenn ihre Angaben da sind.

**Nachprüfung:** 360 × 640, Ordner „THW“ öffnen, sofort 600 px rollen, Treffer an den Knopfmitten alle 150 ms bis „101 Bögen“ ohne
Ladezeile: jeder Punkt trifft durchgehend denselben Knopf (auch gedrosselt).

### BB-G3 [P2] Nach „Anzeigen“ ist der Ordnerpfad weg: zurück über die Startseite, 3,4 Bildschirme rollen, bis zu fünf Register erneut

**Typ:** Bedienung · **Kennzeichnung:** gemessen (360 × 640).

**Fundstelle:** Karte → „Anzeigen“ → im Bogen „‹ Startseite“ → „Beispielbögen ansehen“.

**Beobachtung:** „Anzeigen“ schließt den Dialog und öffnet den Bogen. „‹ Startseite“ führt an den Seitenanfang (Bildlauf 0); der
Knopf „Beispielbögen ansehen“ steht danach bei y 2 148 einer 3 503 px hohen Seite (vorher, ohne Bogen, bei y 1 843). Der Dialog öffnet
wieder auf der Wurzel („Alle“), der Pfad THW › Alle Einheiten › Baden-Württemberg › RSt Biberach › OV Biberach/Riß ist weg: fünf Tipps
plus Rollen, um zum Nachbarbogen zu kommen.

**Erwartung der Rolle:** Nach dem Ansehen eines Bogens komme ich mit einem Tipp dahin zurück, wo ich war, um den nächsten anzusehen
oder um nach einem Fehltipp doch das PDF zu holen.

**Auswirkung im Einsatz (Ausbildung):** Wer mehrere Bögen eines Ortsverbands zeigen will (Unterricht, Übungsvorbereitung) oder sich bei
Anzeigen/PDF vertippt hat, wiederholt jedes Mal den ganzen Weg; mit Handschuh rund 7 Tipps und 2 bis 3 Wischer statt einem.

**Empfehlung:** Den zuletzt offenen Ordner (für die Sitzung) beim Wiederöffnen beibehalten und aus dem geöffneten Beispielbogen einen
direkten Rückweg „Zurück zu den Beispielbögen“ anbieten.

**Nachprüfung:** OV Biberach/Riß → Anzeigen → zurück: Der Dialog steht wieder auf „OV Biberach/Riß“, erreichbar mit höchstens zwei Tipps.

### BB-G4 [P3] Pfadleiste: „Alle“ ist 24 px und „THW“ 32 px breit, die umbrochenen Pfadzeilen stoßen ohne Abstand aneinander

**Typ:** Layout/Abstand · **Kennzeichnung:** gemessen und im Bild (`l-pfad-360-feld.png`).

**Fundstelle:** Dialog, Pfadleiste ab der zweiten Ebene (z. B. Alle › THW › Alle Einheiten … › Baden-Württemberg › RSt Biberach).

**Beobachtung:** Die Pfad-Links sind 44 px hoch (Feld 54), aber nur so breit wie das Wort: „Alle“ 24 px (Feld 28), „THW“ 32 px (Feld 38);
zwischen beiden 17 px mit dem Trenner „›“, der nicht antippbar ist. Bei 360 px bricht der Pfad in vier Zeilen um: „Alle › THW“ (y 197 bis 241),
„Alle Einheiten aller Ortsverbände (LV › RSt › OV)“ (y 241 bis 292), „Baden-Württemberg“ (y 292 bis 336), „RSt Biberach“. Zwischen den Zeilen ist
kein Abstand: 8 px unter der Unterkante von „THW“ liegt „Alle Einheiten …“, 8 px über „Baden-Württemberg“ ebenfalls; im Feld-Modus
trifft 8 px unter „Alle Einheiten …“ schon „Baden-Württemberg“. Bei 320, 390 und quer gleich.

**Erwartung der Rolle:** Jede Pfadstufe ist ein Ziel in Daumenbreite, mit Luft zum Nachbarn.

**Auswirkung im Einsatz (Ausbildung):** Ein Tipp auf „THW“ landet leicht eine Ebene tiefer, ein Tipp auf „Alle“ geht ins Leere. Folge
gering: falsche Ebene, mit einem weiteren Tipp korrigiert.

**Empfehlung:** Pfad-Links mindestens 44 px breit machen (Innenabstand) und zwischen umbrochenen Pfadzeilen 8 px Abstand lassen; lange
Ordnernamen im Pfad kürzen.

**Nachprüfung:** 360 × 640, Standard und Feld, Ebene „RSt Biberach“: jeder Pfad-Link ≥ 44 px breit, senkrechter Abstand zwischen Pfadzeilen ≥ 8 px,
Treffer 8 px ober- und unterhalb jedes Links landen nicht auf einem anderen Link.

### BB-G5 [P3] „‹ Zurück“ und der Pfad rollen mit weg; im Ordner „THW“ sind es bis zu 33 000 px zurück nach oben

**Typ:** Bedienung · **Kennzeichnung:** gemessen (360 × 640).

**Fundstelle:** Dialog, Ordner „THW“ (101 Karten) und jede längere Ebene.

**Beobachtung:** Stehen bleibt nur der Kopf mit „Schließen“ (y 33). „‹ Zurück“ und die Pfad-Links liegen im rollenden Inhalt: nach vier
Wischern steht „‹ Zurück“ bei y −2 125. Der Ordner „THW“ ist 28 043 px hoch (Feld 33 316, 320 × 568: 27 767), rund 46 Bildschirme. Beide
Navigationsziele (Zurück oben links, Schließen oben rechts) liegen im oberen Drittel, bei 390 × 844 außerhalb der einhändigen Daumenreichweite.

**Erwartung der Rolle:** Den Ordner wechseln, ohne erst zum Anfang zurückzuwischen.

**Auswirkung im Einsatz (Ausbildung):** Wer im Ordner „THW“ nach unten gesucht hat und eine Ebene höher will, wischt viele Male zurück
oder schließt den Dialog und fängt neu an (BB-G3). Kein Datenrisiko.

**Empfehlung:** „‹ Zurück“ (mit der aktuellen Ebene) in den stehenden Kopf nehmen; die 101 einzelnen Bögen im Ordner „THW“ nach Art gliedern
oder eine Sprungmarke „nach oben“ anbieten.

**Nachprüfung:** Ordner „THW“, zehn Wischer nach unten: „‹ Zurück“ ist im Bild und mit einem Tipp erreichbar.

### BB-G6 [P3] Die Knöpfe einer Karte wechseln je nach Breite und Modus ihren Platz

**Typ:** Layout/Abstand · **Kennzeichnung:** gemessen.

**Fundstelle:** Karten am Telefon (Hochformat).

**Beobachtung:** 390 × 844 Standard: Anzeigen, PDF, Link in einer Zeile (x 50, 174, 264). 360 × 640 und 320 × 568 Standard sowie 360 und 390
im Feld-Modus: Anzeigen und PDF oben, Link darunter links (unter Anzeigen). 320 × 568 Feld: Anzeigen allein, PDF und Link darunter. Die
Stelle unten links ist also mal Link, mal PDF; die drei Knöpfe sind gleich gestaltet. Abstände 18 bis 22 px, Maße in Ordnung.

**Erwartung der Rolle:** Jede Aktion steht immer an derselben Stelle der Karte, damit der Daumen sie ohne Lesen findet.

**Auswirkung im Einsatz (Ausbildung):** Gering: Wer zwischen Geräten oder Modus wechselt, tippt nach Gewohnheit auf den falschen der drei
Knöpfe; Link statt PDF ist harmlos, Anzeigen statt PDF führt zu BB-G3.

**Empfehlung:** Eine feste Anordnung, die bei 320 px im Feld-Modus noch passt (z. B. drei gleich breite Knöpfe in einer Zeile oder
Anzeigen über die ganze Breite, darunter immer PDF links und Link rechts).

**Nachprüfung:** 320, 360, 390 px, Standard und Feld: Reihenfolge und Position der drei Knöpfe überall gleich.

## Hinweise (ohne Priorität)

- **H1 „Schließen“ springt (Layout):** Bei 390 × 844 steht der Dialog auf der Wurzel mittig (y 98 bis 746, „Schließen“ bei y 115); nach dem ersten
  Ordner füllt er die Höhe, „Schließen“ springt auf y 33. Ein zweiter Tipp an die alte Stelle trifft nichts Wirksames.
- **H2 Ordnername mit „›“ (Text):** „Alle Einheiten aller Ortsverbände (LV › RSt › OV)“ trägt im Namen dasselbe Zeichen, das die Pfadleiste als
  Trenner benutzt; im Pfad liest sich das wie fünf Stufen.
- **H3 „Schließen“ im Feld-Modus (Layout):** wächst nur auf 48 px, die übrigen Ziele auf 54; erfüllt das Maß, wirkt neben „‹ Zurück“ aber kleiner.
- **H4 Lage des Einstiegs (Layout):** Der Abschnitt „Beispielbögen“ beginnt bei 360 × 640 rund 2,9 Bildschirme unter dem Seitenanfang
  (Knopf bei y 1 843), mit geöffnetem Bogen bei y 2 148. Er ist der einzige Einstieg (laut Code), siehe BB-G3.

## Abschluss

- **Aufgabe geschafft:** ja im Hochformat; mit Umwegen im Querformat (Seitwärtswisch, BB-G1)
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Im Querformat sieht die Tabelle aus, als hätte sie keine Aktionen.
- **Größtes Einsatzrisiko:** Ein Tipp während des Nachladens öffnet den falschen Bogen und wirft den Ordnerpfad weg (BB-G2 mit BB-G3); kein Datenverlust.
- **Top-Priorität für die nächste Iteration:** BB-G2: Kartenhöhe während des Nachladens festhalten, damit kein Knopf unter den Finger eines anderen rutscht.
