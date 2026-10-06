# Audit „Handschuh-Bedienung", Runde 5 (Touch-Ziele, Abstände, Doppeltipps, Formate)

Stand: 06.10.2026 · Prüfer: Rollenaudit `thw-glove-touch-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit c0cbae0 (der Code entspricht 4fcdbaf).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-4-Befunde. Geprüft sind vor allem die in Runde 4 umgebauten Stellen:
Fußleiste als Raster, Erfassungsleiste, Tastatur-Wächter, QR-Vollbild mit
„Weiter zu Teil n“, Daumen-Quittung, 1,5-s-Sperre, Kurz-Liste der Personen und
die Knöpfe unter der Einheitenliste (Lageblatt, Export).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch`, Locale de-DE, je Prüfung ein eigener Browser-Kontext.
Viewports 360 × 640, 640 × 360 und 320 × 568, im Standard- und im Feld-Modus
(`eeb.anzeigemodus.v1`), bei 100 % und bei „200 %“. Die 200 % sind nachgestellt
(`html { font-size: 200% }`), nicht die echte Systemschrift. Getestet habe ich
zuerst ohne Blick in frühere Berichte. Aus dem Runde-4-Bericht kannte ich vorab
nur den Abschnitt „Prüfaufbau“; Befunde, „Stand der Behebung“ und die
Runde-5-Berichte der anderen Rollen habe ich erst nach den Messungen gelesen.

Zustände per `localStorage`-Seed, jeweils mit `uebung: false`:

- `eeb.entwurf.v1` mit `examples/thw/013-ulm-b.json` (8 Personen) für die
  Schritte 1 bis 6 und die Kurz-Liste, mit
  `examples/thw/grossbogen-verstaerkter-bergungszug.json` für das mehrteilige
  QR-Vollbild (7 Teile).
- `eeb.einsaetze.v1` mit einer Sammlung „Hochwasser Musterstadt“ aus sechs
  Beispielbögen (001, 003, 009, 013, 016, 052).
- `eeb.vorlagen.v1` habe ich nicht gebraucht.

Gemessen habe ich alle sichtbaren Bedienelemente per `getBoundingClientRect`
(Kantenlänge, Abstand zum nächsten Ziel, feste Lage), grobe Tipps per
`elementFromPoint` und per `touchscreen.tap` neben der Knopfkante. Doppeltipps
habe ich als zwei `touchscreen.tap` auf dieselbe Stelle gesetzt, Soll-Abstand
120 bis 1 700 ms. Die Tastatur habe ich nachgestellt, indem ich nach dem
Antippen eines Felds das Fenster auf 360 px (bzw. die halbe Höhe)
verkleinert habe. Maßstab wie in Runde 4: 44 px Mindestkante, 8 px
Mindestabstand, mit Arbeitshandschuh eher 48 px und 12 px.

Elf weitere Prüfer nutzten den Server gleichzeitig. Zeitmessungen sind deshalb
unsicher. Die Soll-Abstände habe ich nicht gegengemessen; die Grenzen unten
sind in Stufen (120/300/600/1 000/1 200/1 400/1 700 ms) eingegrenzt. Einzelne
Tipps auf Knöpfe, die gerade erst gerendert wurden, gingen unter Last ins
Leere. Solche Läufe habe ich wiederholt und nicht gewertet.

**Nicht prüfbar:** echte Handschuhe auf echtem Glas und Nässe, die echte
Bildschirmtastatur (der verkleinerte Viewport ist nur ein Ersatz; Chrome
verkleinert das Layout dort nicht), Wischen und Ziehen (im Headless-Chromium
nicht auslösbar), Safari/WebKit (Doppeltipp-Zoom), native Datums- und
Zeitpicker, Kamera und Handscanner, native Builds, echte Systemschrift 200 %,
Zeitmessungen ohne Last.

Kennzeichnung im Nachweis: **gemessen** heißt Zahl aus dem Browser,
**beobachtet** heißt im Ablauf gesehen, **Risiko** heißt plausibel, aber nicht
nachgestellt.

Skripte und Bildschirmfotos liegen außerhalb des Repositorys im Scratchpad der
Sitzung (`runde5/handschuh/`).

## Urteil

Die Runde-4-Umbauten tragen. Die Fußleiste ist ein Raster mit festem Platz
rechts außen: „Weiter →“ bzw. „Zur Übersicht →“ endet in jedem Schritt, bei
jedem Viewport und in beiden Modi bei Bildbreite − 16 bis − 18 px (342 bei
360, 302 bei 320, 622 bei 640). Der Tastatur-Wächter blendet die Leiste bei
offener Tastatur aus, die Vorschläge sind danach 44 bis 67 px hoch, und ein
Tipp auf den ersten übernimmt „Ulm“. Die Rückfragen („Verwerfen“, „In den
Papierkorb“, „Person entfernen“) nehmen einen zweiten Tipp bis 1 250 ms nicht
an. „Abrücken“ ist bis 1 200 ms gegen den Nachtipp gesperrt, ab 1 700 ms nimmt
der zweite Tipp es bewusst zurück. Das Vollbild-QR hat einen großen
„Weiter zu Teil 2 →“ (277 × 44 px) mit 16 px Abstand zu „Schließen“. Die
Kurz-Liste rollt nicht mehr seitlich, die Seite hat auf allen Screens
`scrollWidth` gleich Bildbreite.

Reibung gibt es dort, wo die neue Sperre fehlt oder zu eng gebaut ist. Im
QR-Vollbild springt ein Doppeltipp über Teil 2 hinweg (R5-G1). Die Kurz-Liste
ist mit 320 px im Feld-Modus und bei 200 % Schrift so eng, dass „✕“ (Person
entfernen) über „⇑“ liegt (R5-G2). Zwischen „In Einsatz übernehmen“ und
„Weiter →“ liegen nur 10 px, und ein Tipp in die Lücke löst „In Einsatz
übernehmen“ aus (R5-G3).

Die Aufgaben (eigenen Bogen durchblättern und übergeben, 7-teiligen Code
durchschalten, Einheit abrücken, Einheit manuell erfassen, Person entfernen)
sind ohne fremde Hilfe zu schaffen. Es gibt keinen P0 und keinen P1. Alle
Fehlgriffe, die ich auslösen konnte, endeten in einer Rückfrage oder einem
„Rückgängig“.

## Befunde

### R5-G1 [P2] Im QR-Vollbild springt ein Doppeltipp auf „Weiter zu Teil n →“ über einen Teil hinweg (neu, Lücke der 1,5-s-Sperre)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** „Bogen übergeben…“ → „QR-Code im Vollbild zeigen“ bei
einem 7-teiligen Bogen, Knopf „Weiter zu Teil 2 →“. Code:
`src/app/schritte/uebersicht.tsx` (um Zeile 1245 bis 1270, `onClick={() =>
props.onTeil(index + 1)}`). Die Datei bindet `tipp-schutz.ts` nicht ein
(`ortSperren`, `PRELLSCHUTZ_MS` kommen dort nicht vor). Zum Vergleich
`src/app/app.tsx` um Zeile 955 und `tipp-schutz.ts`.

**Beobachtung:** Zwei Tipps auf dieselbe Stelle (Mitte von „Weiter zu Teil 2 →“,
360 × 640, Standard):

| Soll-Abstand | angezeigter Teil nach beiden Tipps |
| --- | --- |
| 150 ms | Teil 3 von 7 |
| 600 ms | Teil 3 von 7 |
| 1 200 ms | Teil 3 von 7 |
| 1 700 ms | Teil 3 von 7 |

Der Knopf bleibt nach dem ersten Tipp an derselben Stelle (die Beschriftung
wechselt zu „Weiter zu Teil 3 →“, der linke Nachbar wächst von „←“ auf „← Teil
1“, der rechte Rand bleibt bei 344 px). Der zweite Tipp trifft ihn also immer.
Teil 2 stand dabei nur für die Zeit zwischen den Tipps im Bild. Am Ende (Teil
7 von 7) steht dort „Teil 7 von 7 ist der letzte“ (235 × 44 px, gesperrt),
„← Teil 6“ misst 81 × 44 px, „Schließen“ 328 × 44 px bei y 567.

**Erwartung der Rolle:** Wer unsicher ist, ob der erste Tipp ankam, tippt
nach. Der Code bleibt dann beim nächsten Teil stehen, so wie die Fußleiste im
Assistenten.

**Auswirkung im Einsatz:** Die Gegenstelle steht mit der Kamera da und
scannt Teil für Teil. Ein übersprungener Teil wurde nicht gezeigt, aber auch
nicht gescannt. Die App merkt es erst, wenn der Helfer „Schließen“ tippt
(„Teil 2 wurde noch nicht gezeigt“). Bis dahin zeigt der Sender Teil 3, und
die Gegenstelle wartet auf einen Teil, der nicht mehr kommt. Der Helfer muss
mit „←“ zurück und neu ansetzen. Das ist ein Umweg, aber keine verlorene
Meldung.

**Empfehlung:** Die Stelle von „Weiter zu Teil n →“ nach jedem Teilwechsel
1,5 s sperren wie bei „Weiter →“ im Assistenten. Alternativ den Teilwechsel
nach einem Tipp bis zur nächsten Anzeige verzögern.

**Nachprüfung:** 7-teiligen Bogen im Vollbild zeigen, zweimal auf dieselbe
Stelle tippen im Abstand von 300, 600, 1 000 und 1 250 ms. Es steht jedes
Mal „Teil 2 von 7“. Ab 1 600 ms darf der zweite Tipp bewusst weiterschalten.

### R5-G2 [P2] Kurz-Liste: „✕“ (Person entfernen) liegt über „⇑“, bei 320 px im Feld-Modus um 12 px, bei 200 % Schrift auf allen Breiten um 38 bis 53 px (neu, Nebenwirkung des Umbaus zur gestapelten Liste)

**Priorität:** P2

**Nachweis:** gemessen; die 200 % sind nachgestellt (Schrift per
`html { font-size: 200% }`).

**Fundstelle / Aufgabe:** Schritt 3 „Personal“ → „Kurz-Liste (Tabelle)“, Zeile
ab der zweiten Person (dort stehen „▲“, „▼“, „⇑“ und „✕“). Code: `index.html`,
Regeln `table.uebersicht.schnell-tabelle` (um Zeile 1884 bis 1901):
`td.sortier-spalte` spannt die Spalten 3 bis 5, `.sortieren` ist `nowrap`,
`td.sortier-spalte + td` (das „✕“) liegt in Spalte 6. Die drei Sortierknöpfe
sind breiter als ihre Spalten.

**Beobachtung:** Person 2, rechte Kanten und Breiten:

| Ansicht | „⇑“ | „✕“ | Folge |
| --- | --- | --- | --- |
| 360 × 640, Standard | 44 px, bis 276 | 44 px, ab 283 | 7 px Lücke, ok |
| 360 × 640, Feld | 54 px, 220–274 | 54 px, 268–322 | **6 px Überlappung** |
| 320 × 568, Standard | 44 px, 199–243 | 44 px, 243–287 | 0 px, kein Abstand |
| 320 × 568, Feld | 54 px, 186–240 | 54 px, 228–282 | **12 px Überlappung** |
| 320 × 568, Feld, 200 % | 58 px, 181–239 | 96 px, 186–282 | **53 px Überlappung** |
| 360 × 640, Standard, 200 % | 50 px, 223–273 | 88 px, 235–323 | **38 px Überlappung** |

`elementFromPoint` auf der Höhe der Mitte liefert bei 320 px/Feld an den Stellen
231 und 233 px das „✕“, obwohl dort noch das „⇑“ sichtbar beginnt. Bei 200 %
liegt „✕“ im Bild mitten auf „⇑“, der Beschriftungstext der Zeile („TrFü, Spr“)
ist unter „▲“ abgeschnitten, die Namensfelder zeigen „Morit“ und „Herrm“
(Bildschirmfoto `f1-klein-feld-200`). Nach „✕“ kommt die Rückfrage
„Herrmann, Moritz entfernen?“ mit „Person entfernen“ (54 px) und „Abbrechen“.

**Erwartung der Rolle:** Die vier Knöpfe stehen nebeneinander, ohne dass einer
den anderen überdeckt. „⇑“ (nach ganz oben) liegt nicht unter „✕“ (löschen).

**Auswirkung im Einsatz:** Wer „⇑“ trifft und auf dessen rechter Seite landet,
löst „Person entfernen“ aus. Die Rückfrage mit Namen fängt das ab, und „✕“
ist über „Rückgängig“ rückholbar. Es kostet aber ein Suchmoment und einen
Zusatztipp. Bei 320 px mit Feld-Modus ist das die Kombination, die der
Handschuh nahelegt (Feld) auf dem kleinsten Gerät.

**Empfehlung:** Die Sortierknöpfe in der Kurz-Liste erst ab einer Breite
zeigen, bei der sie samt „✕“ passen, oder „✕“ in eine eigene Zeile bzw. mit
12 px Abstand rechts davon setzen. Die Zeile in der Höhe wachsen lassen, statt
Knöpfe überlappen zu lassen.

**Nachprüfung:** Kurz-Liste bei 320 und 360 px, Standard und Feld, 100 % und
200 %. Zwischen „⇑“ und „✕“ mindestens 12 px, kein Knopf überdeckt Text oder
einen anderen Knopf. `elementFromPoint` 6 px links von „✕“ trifft „⇑“.

### R5-G3 [P2] „In Einsatz übernehmen“ liegt nur 10 px über „Weiter →“, ein Tipp in die Lücke löst es aus (Rest von R4-G4, trotz Raster)

**Priorität:** P2

**Nachweis:** gemessen, beobachtet. Dass der Tipp mit Daten die Erfassung
übernimmt, ist Risiko.

**Fundstelle / Aufgabe:** Einsatzansicht → „Einheit manuell erfassen…“, feste
Erfassungsleiste (`footer.nav.assistent-nav.mit-uebernehmen`). Code:
`src/app/app.tsx` (um Zeile 4093 bis 4132), `index.html` um Zeile 1645 bis
1656.

**Beobachtung:**

| Ansicht | „In Einsatz übernehmen“ | „Weiter →“ | Lücke | Leiste |
| --- | --- | --- | --- | --- |
| 360 × 640, Standard | 328 × 44, y 530–574 | y 584–628 | **10 px** | 122 px (19 %) |
| 320 × 568, Standard | 288 × 44, y 458–502 | y 512–556 | **10 px** | 122 px (21 %) |
| 360 × 640, Feld | 324 × 48, y 517–565 | y 575–626 | **10 px** | 137 px (21 %) |
| 320 × 568, Feld, 200 % | 284 × 52, y 441–493 | y 501–556 | **8 px** | 142 px (25 %) |
| 640 × 360, Standard | 169 × 42 neben „Weiter →“ | | 14 px seitlich | 56 px |

Das ist weniger als die 14 px der Behebung von R3-G3 und als die 12 px, die
die Behebung von R4-G4 allgemein zusagt. Ein Tipp 5 px über der Oberkante von
„Weiter →“ (294/579, in der Lücke) hat bei 360 × 640 „In Einsatz übernehmen“
ausgelöst (Chrome rückt den Tipp auf das nächste Ziel). Ohne Namen kam
„Name der Einheit fehlt“, mit Namen und ohne Personen „Stärke nicht gezählt“
mit „Stärke jetzt eintragen“, „Als Sollstärke ablegen“ und „Abbrechen“.
Beide Rückfragen haben große, getrennte Knöpfe.

**Erwartung der Rolle:** Wer „Weiter →“ sucht und leicht darüber tippt, blättert
nicht in die Übernahme.

**Auswirkung im Einsatz:** Mit Name und Stärke (nicht geprüft) wäre der
Fehltipp die Übernahme der Meldung in die Lage, mit der Zeit des Tipps als
Eintreffzeit (Feld „Eingetroffen um“ ist dann leer). Der Fehltipp ist über die
Daumenleiste rückholbar, aber nur, wenn der Helfer sie bemerkt.

**Empfehlung:** Zwischen den beiden Zeilen mindestens 12 px, besser 16 px;
„In Einsatz übernehmen“ in der Breite von „Weiter →“ absetzen oder links
bündig stellen, damit es nicht über dem Daumenplatz rechts liegt.

**Nachprüfung:** Lücke neu messen (Standard und Feld, 320/360 px, 100 % und
200 %): mindestens 12 px. Ein Tipp 5 px über „Weiter →“ blättert nur.

### R5-G4 [P3] Kurz-Liste: Die Sortierknöpfe wechseln je Zeile ihre Stelle, und ein Doppeltipp auf „▼“ schiebt die zweite Person zurück (neu)

**Priorität:** P3

**Nachweis:** gemessen, beobachtet.

**Fundstelle / Aufgabe:** Schritt 3 → „Kurz-Liste (Tabelle)“, Knöpfe „▲“ „▼“ „⇑“
je Zeile. Code: `src/app/schritte/personal.tsx`, `index.html` um Zeile 1311
bis 1333.

**Beobachtung:** Die Zeilen sind rechtsbündig. In Zeile 1 fehlt „⇑“ (und „▲“
ist gesperrt), deshalb steht dort bei x 233 „▼“, in den Zeilen darunter an
derselben Stelle „⇑“. Zeile 1: „▲“(gesperrt) 185, „▼“ 233; Zeile 2: „▲“ 137,
„▼“ 185, „⇑“ 233 (360 × 640, Standard, linke Kante in px). Tipp auf „▼“ in Zeile 1
(Lehmann) tauscht Lehmann und Herrmann. Die Ansicht rollt dabei um 97 px, so
dass in Zeile 1 jetzt Herrmann steht und sein „▼“ unter dem Finger liegt. Ein
zweiter Tipp nach 150, 500, 1 200 und sogar 1 700 ms schiebt Herrmann nach
unten, die Reihenfolge ist wieder die alte (Lehmann, Herrmann, Hartmann,
Brandt). Eine Quittung gibt es nicht.

**Erwartung der Rolle:** Nach einem Tipp bewegt sich die Person, die ich
gemeint habe, und nur sie. Ein ungeduldiger zweiter Tipp macht nicht alles
rückgängig.

**Auswirkung im Einsatz:** Der Helfer sieht „nichts passiert“, tippt ein
drittes Mal und hat die Reihenfolge verschoben, ohne es zu wollen.
Reihenfolge ist in der Stärkemeldung nachrangig, deshalb P3.

**Empfehlung:** Nach dem Verschieben die Ansicht so rollen, dass die
verschobene Person unter dem Finger bleibt. Alternativ die Stelle 1,5 s
sperren. Die drei Knöpfe in jeder Zeile an feste Plätze setzen (gesperrte
Knöpfe sichtbar lassen).

**Nachprüfung:** „▼“ bei Person 1 doppelt antippen (300 ms, 1 000 ms). Person
1 steht danach an Platz 2. Die Plätze von „▲“, „▼“, „⇑“ sind in jeder Zeile
gleich.

### R5-G5 [P3] Ein zweiter Tipp binnen 1,5 s an derselben Stelle verfällt ohne jede Rückmeldung (neu, Nebenwirkung der Ortssperre)

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Fußleiste des Assistenten, „Weiter →“; ebenso
„Abrücken“ in der Einsatzansicht. Code: `src/app/tipp-schutz.ts`
(`ORTSSPERRE_MS = 1500`, `ORTSSPERRE_RADIUS_PX = 40`, `klickPruefen`).

**Beobachtung:** Zwei Tipps auf „Weiter →“ in Schritt 1: bei 120 bis 1 400 ms
Abstand steht danach „2. Einsatz“ (der zweite Tipp ist weg), bei 1 700 ms
„3. Personal“. Das ist die gewollte Sperre (R4-S2). Sie verwirft den Tipp aber
still: kein Zittern, keine Zeile, kein Ton, der Knopf sieht unverändert aus.
Wer ohne etwas einzugeben zwei Schritte weiterblättern will und im Takt von
etwa einer Sekunde tippt, sieht einen Tipp wirken und einen nicht. Dasselbe
bei „Abrücken“: zweiter Tipp nach 1 200 ms ohne Wirkung, nach 1 700 ms
„Wieder anwesend“. Die Beschriftung an der gesperrten Stelle wechselt
dabei von „✓ Abgerückt“ zu „Wieder anwesend“ (gemessen per
`elementFromPoint`).

**Erwartung der Rolle:** Ich sehe, ob mein Tipp angenommen wurde.

**Auswirkung im Einsatz:** Kostet im ungünstigen Fall einen Tipp und eine
Sekunde. Beim Abrücken einer Einheit kann der Helfer meinen, die App hänge.
Die Daumenleiste mit „Abgerückt 11:44“ erscheint immerhin sofort.

**Empfehlung:** Den gesperrten Tipp sichtbar quittieren (der Knopf zeigt kurz
einen Rahmen oder „eben gewechselt“) oder die Sperre so legen, dass sie nur
den Knopf trifft, der neu unter dem Finger liegt.

**Nachprüfung:** Zweimal im Abstand von 1 000 ms auf „Weiter →“ tippen: Der
zweite Tipp bleibt wirkungslos, die Leiste zeigt aber erkennbar, dass er
registriert und bewusst verworfen wurde.

Verweis: Dieselbe Beobachtung steht als Arbeitsnotiz in
[feldtauglichkeit.md](feldtauglichkeit.md) (noch ohne Befundnummer).

### R5-G6 [P3] Querformat mit 200 % Schrift: Beim Öffnen steht kein Formularfeld im Bild, Schritt „6“ liegt außerhalb der Schrittleiste (neu)

**Priorität:** P3

**Nachweis:** gemessen und beobachtet in der 200 %-Nachstellung; echte
Systemschrift nicht geprüft.

**Fundstelle / Aufgabe:** Schritt 3, 640 × 360, Standard und Feld, Schrift
200 %. Code: Kopf und Schrittleiste in `src/app/app.tsx`, Rasterleiste in
`index.html`.

**Beobachtung:** Der Kopf (Startseite, Ansicht, Schrittleiste) und der
Datenschutzfrist-Hinweis füllen das Bild bis zur festen Leiste (Bildschirmfoto
`a5-quer-feld-200`): Vom Formular steht nichts im ersten Bild. Die Leiste ist
73 px hoch (20 % von 360). In der Schrittleiste steht „6 . Übersicht“ bei x
656 bzw. 682 (Standard bzw. Feld, 200 %) und damit außerhalb von 640 px. Die
Seite selbst bleibt bei `scrollWidth` 640, die Leiste rollt in ihrem Rahmen.
Mit Wischen (nicht prüfbar) wäre sie erreichbar, „Weiter →“ führt auch ohne sie
bis zur Übersicht.

**Erwartung der Rolle:** Schritt und Formular sind zu sehen, ohne zu rollen.

**Auswirkung im Einsatz:** Gerät quer und Schrift groß ist die Ausnahme. Der
Helfer muss vor dem ersten Eintrag rollen. Die Übersicht erreicht er über
„Weiter →“.

**Empfehlung:** Bei kleiner Bildhöhe den Datenschutzfrist-Hinweis zuklappen
oder aus dem ersten Bild nehmen.

**Nachprüfung:** 640 × 360, 200 %: mindestens ein Eingabefeld im ersten Bild
ohne Rollen.

### R5-G7 [P3] Schalterreihen ohne Lücke: Schrittleiste, Moduswahl und „Karten“/„Tabelle“ (neu)

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Schrittleiste „1 . Einheit … 6 . Übersicht“ (44 × 44
bis 57 × 44 px), Moduswahl „Standard/Feld/Dunkel/Nacht“ in der Einsatzansicht
(77 × 44, 49 × 44, 65 × 44, 59 × 44 px, 0 px Lücke), Umschalter „Karten“/„Tabelle“
(73 × 44 / 77 × 44 px, 1 px Überdeckung).

**Beobachtung:** Die Ziele sind 44 px hoch und stoßen aneinander. Die
Schrittleiste springt bei einem Fehltipp zu Schritt n ± 1, die Moduswahl wechselt
zwischen „Feld“ und „Dunkel“ ohne Rückfrage (die helle Darstellung liegt
neben der dunklen). Beides ist einen Tipp rückholbar. Die Moduswahl in
der Fußleiste („◐“) ist dagegen gut gelöst: vier Segmente 83–84 × 60 px mit
Zweckzeile („große Tasten“, „abends“, „gedimmt“).

**Erwartung der Rolle:** Nebeneinander liegende Auswahlziele haben eine Lücke
von 8 px oder mehr, sonst fällt der Fehltipp nur auf, wenn der Bildschirm
umspringt.

**Auswirkung im Einsatz:** Meist ein Suchmoment, bei der Moduswahl ein kurzes
Aufblenden.

**Empfehlung:** Zwischen Segmenten 8 px Lücke oder Trennlinie von mindestens
2 px; die Moduswahl der Einsatzansicht wie in der Fußleiste mit Zweckzeile.

**Nachprüfung:** Tabelle neu messen: Lücke ≥ 8 px zwischen allen Segmenten.

## Verweise auf andere Runde-5-Berichte

Unabhängig beobachtet, dort zuerst beschrieben, hier nicht gezählt:

- **R5-L1** ([nacht-und-sicht.md](nacht-und-sicht.md)): Der feste „◐“ der
  Einsatzansicht liegt über Text und Knopfrändern am linken Rand. Gemessen:
  44 × 44 px bei x 12–56, y 584–628 (360 × 640) und deckt den linken Rand von
  „Einheit manuell erfassen…“ und „Bögen einlesen…“ (x 16–344), Chips und
  Fließtext („Excel“, „Nachtrag“). Ein Tipp dorthin öffnet die Ansichtswahl
  statt den Knopf.
- **R5-K4** ([fuehrungssicht.md](fuehrungssicht.md)): Die Einheitenliste
  beginnt erst nach mehreren Bildschirmen. Hier gemessen: „Karten“/„Tabelle“
  bei y 1 148, erste Karte bei y 1 236 (360 × 640, Standard, Seitenhöhe
  4 167 px).
- **Neuer Nutzer** ([neuer-nutzer.md](neuer-nutzer.md), Zwischenstand): „In
  Einsatz übernehmen“ mit offener Namensvorschlagsliste verlangt zwei Tipps.
  Die Vorschlagsliste ist dort auch ohne Tastatur-Nachstellung von der
  Fußleiste verdeckt. Hier nicht nachgemessen.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Fußleisten-Raster:** „← Zurück“/„←“, „◐“ und „Weiter →“ bzw. „Zur
  Übersicht →“ stehen in jedem Schritt in derselben Zeile. Rechter Rand des
  Primärknopfs (Schritt 5): 342 (360 px), 302 (320 px), 622 (640 px) im Feld-Modus
  und bei 200 %. Höhe 44 px (Standard), 51 px (Feld), 49–55 px bei 200 %.
  „←“ und „◐“ liegen 12 px auseinander. Weder Überlauf noch eine dritte Zeile.
- **Tastatur-Wächter:** Bei offener Tastatur (Fenster 360 × 320 bzw. 640 × 180)
  steht `tastatur-offen` auf `<html>`, `footer.nav` ist weg. Vorschläge 44 bis
  67 px hoch, 238–265 px breit, der Tipp auf „Ulm“ übernimmt (Standard 360/320,
  Feld 360), kein Dialog.
- **Rückfragen gegen Nachtipp:** „Verwerfen“ (Startseite) und „Einsatz
  löschen…“ (auf die Höhe des Bestätigungsknopfs gerollt): Rückfrage bleibt
  bei 500, 750, 1 000 und 1 250 ms offen. Bei „Person entfernen“ liegt
  der Dialog mit 85 px Abstand zwischen „Person entfernen“ und „Abbrechen“.
- **Daumen-Quittung:** „Abgerückt 11:44: Nr. 5 …“ 336 × 65 px bei y 563–628
  (360 × 640), „Rückgängig“ und „✕“ 12 px auseinander, über der Fußleiste. Der
  Nachtipp auf „Abrücken“ bleibt bis 1 200 ms ohne Wirkung.
- **Knopfreihen der Einheitenkarte** (nach dem Aufklappen): „Zuklappen“,
  „Details“, „Bogen als PDF“, „Abrücken“, „Zug zuordnen“, „Auftrag/Notiz“,
  „Mehr…“ je 44 px hoch, 8 px Lücke. Die ganze zugeklappte Karte ist ein Knopf
  zum Aufklappen (294 × 112–162 px).
- **Knöpfe unter der Liste** („Einsatz weitergeben / sichern“, „Lageblatt (A4
  quer)“, „Blanko-Vordruck“, „Übersicht als CSV“, „Alle Daten als CSV“,
  „Excel-Liste“): 44 px hoch, 8 px Lücke, „Einsatz löschen…“ 2 258 px weiter
  unten und nicht in ihrer Nähe.
- **Vollbild-QR:** „Weiter zu Teil 2 →“ 277 × 44 px (Feld 235 × 52 bei 320 px),
  Teilzahl im Knopf, „Schließen“ 16 px darunter, quer 209 × 44 px neben dem
  Code. Das Vollbild ist auch bei 320 × 568/Feld/200 % bedienbar.
- **Kein seitlicher Seitenversatz:** `scrollWidth` gleich Bildbreite in allen
  geprüften Kombinationen (320/360/640 px, Standard und Feld, 100 % und 200 %).
- **Doppeltipp-Zoom:** 0 von 187 Bedienelementen (Schritt 3) ohne
  `touch-action: manipulation`.
- **Keine Pflichtgesten:** Weder Wischen noch Ziehen noch langes Drücken nötig.

## Abschluss

- **Aufgabe geschafft:** ja. Mit Umweg im QR-Vollbild nach einem Doppeltipp
  (R5-G1) und in der Kurz-Liste bei 320 px/Feld (R5-G2).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Wer in der Kurz-Liste ein zweites Mal auf „▼“
  tippt, glaubt, die App habe nichts getan, und hat die Reihenfolge
  zurückgesetzt (R5-G4).
- **Größtes Einsatzrisiko:** Im QR-Vollbild überspringt ein Doppeltipp einen
  Teil, den die Gegenstelle noch scannen will (R5-G1).
- **Top-Priorität für die nächste Iteration:** Die 1,5-s-Sperre auf „Weiter zu
  Teil n →“ ausdehnen und die Kurz-Liste bei 320 px/Feld/200 % so setzen, dass
  „✕“ kein anderes Ziel überdeckt.

## Abgleich mit Runde 4

Grundlage: [../runde-4/handschuh-bedienung.md](../runde-4/handschuh-bedienung.md)
mit „Stand der Behebung“ und
[../runde-4/README.md](../runde-4/README.md).

| Runde-4-Befund | Stand laut Tabelle | Bewertung Runde 5 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R4-G1 Rückfragen nehmen nach 450 ms einen zweiten Tipp an (P1) | behoben | **hält** | „Verwerfen“, „Einsatz löschen…“ (auf Höhe des Bestätigungsknopfs) und „Person entfernen“ (Kurz-Liste): Rückfrage bei 500/750/1 000/1 250 ms offen, nichts verändert. Nach 1 700 ms nimmt der zweite Tipp bei „Verwerfen“ (Standard, Knopf unter dem Finger) bewusst an. Daumenleiste nach „In den Papierkorb“ habe ich nicht nachgemessen. |
| R4-G2 Feld-Modus, Schritt 5: „Zur Übersicht →“ über dem Rand (P2) | behoben | **hält** | Rechter Rand des Primärknopfs 342/302/622 px bei 360/320/640, in beiden Modi und bei 200 %. Erfassungsleiste zweizeilig, 122–142 px (19–25 % der Höhe). Primärknopf in jedem Schritt an derselben Stelle. |
| R4-G3 Offene Tastatur: Leiste über der Vorschlagsliste (P2) | behoben | **hält** | Leiste weg bei offener Tastatur (360 × 320 und 320 × 360, Standard, 360 Feld), Tipp auf den ersten Vorschlag übernimmt „Ulm“. Echtes Gerät nicht prüfbar. |
| R4-G4 Enge Paare (P3) | behoben | **hält nur teilweise** | 12 px bei „←“/„◐“, „Fortsetzen“/„Verwerfen“ (174→186), „Rückgängig“/„✕“, 16 px bei „Weiter zu Teil 2“/„Schließen“. Aber „In Einsatz übernehmen“/„Weiter →“ nur 10 px (8 px bei 200 %), und ein Tipp in die Lücke löst es aus (R5-G3). |
| R4-G5 Handschuh-Modus heißt nur „Feld“ (P3) | behoben | **hält** | Aufgeklappte Wahl in der Fußleiste: „Feld / große Tasten“ usw., 83–84 × 60 px. Die Viererreihe der Einsatzansicht ist ohne Zweckzeile (R5-G7). |
| R4-G6 Kein Schutz gegen Doppeltipp-Zoom (P3, Risiko) | behoben | **hält** (Chromium) | 0 von 187 Elementen ohne `touch-action: manipulation`. Safari nicht prüfbar. |
| R3-G3 / R4-G2 „In Einsatz übernehmen“ in eigener Zeile | behoben | **hält, mit Nebenwirkung** | Zeile steht über der Blätterzeile, aber nur 10 px darüber (14 px in Runde 4, R5-G3). |
| R4-S2 Doppeltipp auf „Weiter →“ überspringt Schritt 2 | behoben (anderer Bericht) | **hält, mit Nebenwirkung** | Zweiter Tipp bis 1 400 ms wirkungslos. Dieselbe Sperre fehlt im QR-Vollbild (R5-G1), und der verworfene Tipp bleibt ohne Rückmeldung (R5-G5). |
| R3-S5 / R4 „Abrücken“ gegen Doppeltipp | behoben | **hält** | Nachtipp bis 1 200 ms wirkungslos, ab 1 700 ms „Wieder anwesend“, Daumenleiste sofort. |
| R4-H2 / R4-N3 Kurz-Liste rollt seitlich (Verweis in R4-G) | im Paket „Layout“ behoben | **hält, im Detail ins Gegenteil verkehrt** | Kein seitliches Rollen mehr (Tabelle gestapelt, `scrollWidth` gleich Bildbreite). Dafür überlappt „✕“ das „⇑“ bei 320 px/Feld und bei 200 % (R5-G2), und die Sortierknöpfe wechseln je Zeile ihre Stelle (R5-G4). |
| Feld-Modus „Ziele 54 px“ (Bestätigtes Runde 4) | – | **hält mit Abweichung** | Kurz-Liste und Karten im Feld 54 px; die Fußleiste misst im Feld 51 px („◐“ 48 × 54), im Standard 44 px („◐“ 47). In Runde 4 stand 54 px. Kein Befund, aber der Feld-Modus bringt in der Fußleiste nur 7 px Zuwachs. |
| Stärke-Zähler 67 × 67 px (Bestätigtes Runde 4) | – | **nicht nachgemessen** | Der Weg über „Einheit schnell erfassen“ blieb unter Last ohne Wirkung. |
