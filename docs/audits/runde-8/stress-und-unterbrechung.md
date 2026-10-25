# Audit „Stress und Unterbrechung“, Runde 8 (Zeitdruck, Ablenkung, Wiedereinstieg)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-stress-test-user` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `3fee6e5` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-7-Befunde. Der Server lief unverändert; ich habe ihn weder neu gebaut
noch neu gestartet und keinen Prozess beendet, den ich nicht selbst gestartet
hatte.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Grundeinstellung
360 × 640 px, dazu 320 × 568, 640 × 360 (quer), Zoom-Nachbildung mit
180 × 320 und 320 × 180 Layout-Pixeln (rund 200 % Browser-Zoom auf 360 px
Breite bzw. 640 px Breite quer) und `html { font-size: 200% }`. Jeder Lauf
hatte einen eigenen Browser-Kontext, weil elf weitere Prüfer denselben Server
nutzten; der Seed wurde je Kontext genau einmal geschrieben. Zwei Fenster sind
zwei Seiten im selben Kontext. Tipps mit `touchscreen.tap` an derselben
Bildstelle (Abstände 30 bis 2 000 ms), Zurück-Geste mit `page.goBack()`,
Unterbrechung als `reload()`.

Zustände über `localStorage`-Seeds aus `examples/thw/`, jeweils mit
`uebung: false` und `stand` auf heute: `eeb.entwurf.v1` mit 013 Ulm (8
Personen) und dem Großbogen „Verstärkter Bergungszug“ (38 Personen);
`eeb.einsaetze.v1` mit der Sammlung „Hochwasser Musterstadt“ (6 Einheiten
aus 001, 003, 009, 013, 016, 052), für den Papier-Abgleich bei drei Einheiten
`vomPapier` gesetzt; `eeb.vorlagen.v1` mit einer Vorlage (Musterung);
`eeb.uhr.v1` mit `zuletzt` 400 Tage in der Zukunft (Rückwärtssprung) und
204 Tage in der Vergangenheit bei entsprechend altem Entwurf und alter
Sammlung (Vorwärtssprung mit Folgen); ein abgebrochener `eeb.entwurf.v1`-Text
für das Beiseitelegen. Skripte und Screenshots liegen im Scratchpad unter
`runde8/s/`. In den Seeds trägt jede Karte „⚠ Anderer Einsatz? Zeitraum
vorbei“, weil die Beispielbögen Zeiträume im Juli tragen; das ist dem Seed
geschuldet und kein Befund.

Getestet habe ich zuerst ohne Blick in die Berichte: Start mit Entwurf und
Sammlung, Neuladen mitten im Tippen (Schritt 2), Zurück-Geste im Assistenten
und im Dialog „Einheit schnell erfassen“, Doppeltipp auf „Weiter →“ in
Abständen von 0 bis 2 000 ms, „Person entfernen“, „Bogen schließen“,
„Verwerfen“ und „Bogen übergeben“ mit QR-Vollbild und Zurück, „Nur Stärke“,
Schrittleiste und Zurück-Kette über Assistent, Startseite und Sammlung. Danach
habe ich den Runde-7-Bericht samt „Stand der Behebung“ gelesen und die
Behebungen einzeln gegengeprüft: Papier-Abgleich auf allen drei Verlustwegen,
Zwei-Fenster-Warnung (Hochformat, quer, 200 %) mit Rückfrage und Rückholplatz,
Geräteuhr (Rückwärts- und Vorwärtssprung, drei Lesungen, Hinweis im Assistenten,
Dialog „Datum stimmt“), Musterung mit Neuladen, „Fortsetzen“ in acht Lagen,
Rückfragen bei großer Schrift in vier Lagen.

Nicht prüfbar: echter Lärm und echte Unterbrechung durch Personen, echte
Bildschirmtastatur, Zurück-Geste der installierten PWA und der nativen Builds,
echte Doppeltipps mit Handschuh, Kamera und Handscanner, Hintergrund-Beenden
des Tabs durch das Betriebssystem (nur `reload()`), das Öffnen des
Lagemonitors als eigenes Fenster (im Lauf öffnete „Lagemonitor öffnen“ kein
zweites Fenster; der Lagemonitor selbst liegt bei den Führungsprüfern),
WebKit/Safari. Nicht geprüft: R6-O9 (Uhrstand in der Zukunft bei frischer
Sammlung), Zusammenführen-Tipp (R7-N1), Sammel-PDF-Download.

## Urteil

Die Runde-7-Behebungen halten, und ich habe an keiner geprüften Stelle eine
Nebenwirkung auf Verlauf, Rückfragen, Zwei-Fenster-Abgleich oder Geräteuhr
gefunden. Der Papier-Abgleich überlebt jetzt Neuladen, „Später“ und
„‹ Startseite“; die Karte sagt vorher „Angefangene Eingaben für 1 Einheit sind
noch da (nur in diesem Browserfenster, bis du sie übernimmst oder den Tab
schließt)“, „Eingaben verwerfen…“ fragt mit Folge, und nach „Abgleich
übernehmen“ bleibt nichts im Sitzungsspeicher zurück. Die Konfliktwarnung nennt
das geänderte Feld („Ort / Auftrag“) und Zeiten mit Sekunden; die Rückfrage
nennt den Stand, der geladen wird, und der Rückholplatz sagt „durch den Stand
des anderen Fensters ersetzt — deine Fassung“. Die Geräteuhr-Rückfrage nennt
die Richtung in Worten („Die Uhr ist 400 Tage zurückgegangen“, „… 204 Tage
vorgesprungen“) und hält bei der zweiten und dritten Lesung, im Assistenten
steht „Geräteuhr nicht bestätigt“. Die Musterung stellt die Haken nach dem
Neuladen wieder her („Deine Haken von vorhin sind wieder da“).

Reibung bleibt gering und liegt an den Rändern: ein Streifen der Sprungmarke
„Zum Inhalt springen“ liegt bei 320 × 568 und doppelter Schrift über dem
Seitenkopf und fängt Tipps auf „Alle Themen“ ab (R8-S1); der Hinweis auf einen
beiseitegelegten Bogen verlangt neun Zeilen Lesen, bevor der Weg weiter folgt
(R8-S2); bei Browser-Zoom 200 % liegt „Fortsetzen“ noch hinter dem ersten
Bild, und „Bergungsgruppe“ bricht mitten im Wort (R8-S3); und der Tipp-Schutz
nimmt einen Tipp an derselben Bildstelle bis etwa 1,3 s nach dem letzten nicht
an, auch wenn der Dialog den Knopf genau dorthin setzt (R8-S4).

Die Kernaufgaben gelingen ohne fremde Hilfe, auch mit Unterbrechungen und
hektischem Tippen. Kein P0, kein P1, kein P2.

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Der Text zum beiseitegelegten Bogen klingt nach
  Support-Fall; wer ihn überfliegt, sucht den Weg zum neuen Bogen unter dem
  Kasten, der den ersten Bildschirm füllt (R8-S2).
- **Größtes Einsatzrisiko:** Ein Tipp auf einen Dialogknopf kurz nach dem
  Öffnen wird still verworfen, wenn der Knopf dort liegt, wo eben der Auslöser
  war; nur „Einen Moment …“ zeigt es an (R8-S4).
- **Top-Priorität für die nächste Iteration:** Den Kasten „Ein gespeicherter
  Bogen ließ sich nicht öffnen“ auf zwei Sätze mit dem nächsten Schritt
  kürzen (R8-S2).

## Befunde

### R8-S1 [P3] Sprungmarke „Zum Inhalt springen“ ragt bei 320 × 568 und 200 % Schrift 22 px ins Bild und überdeckt „Alle Themen“

**Priorität:** P3

**Kennzeichnung:** gemessen (Rechteck der Sprungmarke, `elementFromPoint`;
Skripte `d2`, `d3`, `n1`, Screenshot `o-klein-g-1.png`).

**Fundstelle / Aufgabe:** Startseite, Assistent und Einsatzansicht bei
320 × 568 px mit `html { font-size: 200% }`. Code: `src/app/seiten-kopf.tsx`
(Knopf `.sprungmarke`, `position: absolute`, oberhalb des Bildes geparkt).

**Beobachtung:** Die Sprungmarke steht außerhalb des Bildes, solange sie in
einer Zeile Platz hat: bei 360 × 640 und 320 × 568 mit normaler Schrift liegt
sie bei −48 bis −9 px, bei 360 × 640 mit 200 % bei −96 bis −20 px. Bei
320 × 568 mit 200 % bricht ihr Text auf zwei Zeilen (Breite 304 px), das
Rechteck reicht von −96 bis +22 px: Ein 22 px hoher Streifen mit Rahmen liegt
über dem Seitenkopf. „Alle Themen“ liegt bei 0 bis 44 px; ein Tipp auf den
oberen Teil des Links trifft die Sprungmarke (`elementFromPoint` an der Oberkante
des Links liefert `sprungmarke`, in Mitte und Unterkante den Link). Auf allen
drei Bildschirmen gleich.

**Erwartung der Rolle:** Nichts liegt ohne Grund über der Navigation; wer
„Alle Themen“ antippt, kommt dorthin.

**Folge im Einsatz:** Gering. Wer mit großer Schrift auf einem kleinen Telefon
oben antippt, löst den Sprung zum Inhalt aus statt der Navigation; das ist
folgenlos, wirkt aber wie ein Fehltipp und kostet einen zweiten Versuch.

**Empfehlung:** Die Sprungmarke so weit aus dem Bild parken, dass auch ihre
Umbruchhöhe draußen bleibt, oder sie bei großer Schrift nicht umbrechen lassen.

**Nachprüfung:** 320 × 568, Schrift 200 %: Oberkante bis Unterkante der
Sprungmarke liegt bei 0 oder darüber (`bottom <= 0`); ein Tipp auf die obere
Hälfte von „Alle Themen“ trifft den Link.

### R8-S2 [P3] Beiseitegelegter Bogen: Der Hinweis füllt den ersten Bildschirm mit neun Zeilen Erklärung, der nächste Schritt steht darunter

**Priorität:** P3

**Kennzeichnung:** beobachtet (Startseite mit abgebrochenem
`eeb.entwurf.v1`-Text, Screenshot `t-unlesbar.png`; Skript `g1`).

**Fundstelle / Aufgabe:** Startseite, Kasten „Ein gespeicherter Bogen ließ
sich nicht öffnen“ mit „Als Datei sichern“ und „Entfernen…“. Der Seed ist ein
abgebrochener JSON-Text; `eeb.entwurf.beschaedigt.v1` steht danach im Speicher.

**Beobachtung:** Der Kasten benennt die Ursache („der gespeicherte Text ist
abgebrochen oder beschädigt“) und sagt zu Recht „Er ist nicht gelöscht, sondern
beiseitegelegt“. Danach folgen in einem Absatz „Aus Datei laden…“ „öffnet sie
nur, wenn die genannte Ursache nicht mehr zutrifft“, „fehlt eine Pflichtangabe,
nennt die App sie beim Einlesen“, „nachtragen lässt sie sich in der App nicht“,
„die Datei dient dann der Support-Stelle“ und das Löschdatum. Das sind etwa
70 Wörter in neun Zeilen bei 360 px Breite; der Kasten steht über „Meinen
Bogen ausfüllen“ und „Neuen Bogen erstellen“ und schiebt beides aus dem ersten
Bild. Ein Hinweis, dass man einfach mit „Neuen Bogen erstellen“ weiterarbeiten
kann, steht nicht im Kasten.

**Erwartung der Rolle:** Zwei Sätze: Was ist passiert, ist es weg? Und was
tue ich jetzt? Die Einzelheiten zur Datei nur auf Nachfrage.

**Folge im Einsatz:** Gering bis mittel für den seltenen Fall. Wer den Absatz
nicht liest, erfährt nicht, dass die Daten gesichert sind und dass ein neuer
Bogen sofort geht; wer ihn liest, verliert 20 Sekunden, die er im Einsatz nicht
hat. Gefahr für Daten besteht nicht.

**Empfehlung:** Den Kasten auf die Aussage „Dein Bogen ließ sich nicht öffnen.
Er ist nicht gelöscht, sondern beiseitegelegt“ und den Weg („Als Datei sichern“
oder gleich einen neuen Bogen beginnen) kürzen; die Erklärung zu „Aus Datei
laden…“, Pflichtangaben und Support-Stelle hinter „Mehr dazu“.

**Nachprüfung:** Abgebrochenen Entwurf seeden, Startseite bei 360 × 640 öffnen:
Der Kasten umfasst höchstens vier Zeilen, „Neuen Bogen erstellen“ liegt im
ersten Bild.

### R8-S3 [P3] Browser-Zoom 200 % auf 360 px: „Fortsetzen“ liegt 130 px unter dem ersten Bild, „Bergungsgruppe“ bricht mitten im Wort (Rest von R7-S4)

**Priorität:** P3

**Kennzeichnung:** gemessen (Oberkante des Knopfes, Skript `d1`, Screenshot
`o-telefon-n-2.png`).

**Fundstelle / Aufgabe:** Startseite mit Entwurf 013 Ulm bei 180 × 320 (Zoom
200 % auf 360 px) und bei 320 × 180 (Zoom 200 % quer auf 640 px).

**Beobachtung:** Die Behebung von R7-S4 greift für die Schriftgröße: 200 %
Schrift quer (640 × 360) bringt „Fortsetzen“ von 1 119 px auf 246 bis 310 px,
also in das erste Bild; 360 × 640 mit 200 % Schrift: 542 px; 320 × 568 mit
200 %: 516 px, beides im Bild. Beim echten Zoom bleibt es hinter dem Bild:
180 × 320: 450 px (vorher 516), 320 × 180: 360 px bei 180 px Bildhöhe. Der
erste Bildschirm besteht dort aus Navigation, Titel, „Ansicht: Standard ▾“ und
dem Anfang der Entwurfskarte. In der Karte bricht der Name „THW Ulm
Bergungsgruppe“ als „Bergungsgrup / pe“. Kein Seitenüberlauf (`scrollWidth`
gleich Breite).

**Erwartung der Rolle:** Wer vergrößert hat, findet „Fortsetzen“ im ersten
Bild oder wenigstens einen lesbaren Namen.

**Folge im Einsatz:** Gering. Der Entwurf ist nicht gefährdet; wer mit
Browser-Zoom auf 200 % arbeitet, rollt einmal.

**Empfehlung:** Bei sehr schmalem Bild Titelblock und „Ansicht“ enger setzen
oder die Entwurfskarte über den Titel ziehen; Wörter nur an Silbengrenzen
(Trennung) oder gar nicht umbrechen.

**Nachprüfung:** 180 × 320 mit Entwurf: Oberkante „Fortsetzen“ unter 320 px,
Name ohne Wortbruch mitten im Wort.

### R8-S4 [P3] Tipp-Schutz verwirft einen Tipp an derselben Bildstelle bis etwa 1,3 s nach dem letzten, auch auf dem Knopf eines eben geöffneten Dialogs

**Priorität:** P3

**Kennzeichnung:** gemessen mit Playwright-Platzierung (Tipps an Bildstellen,
die der Lauf wählte); die Häufigkeit für echte Finger ist Risiko. Skripte
`a9`, `a11`, `f1`, `f2`, `m2`. Ursache der Wartezeit: `src/app/tipp-schutz.ts`
(„Einen Moment …“), in Runde 7 als bewusst vermerkt (Abrücken, Ortssperre).

**Fundstelle / Aufgabe:** Startseite „Einheit schnell erfassen (nur Stärke)…“,
dann Dialog „Einheit schnell erfassen — für welche Sammlung?“ mit „Für
„Hochwasser Musterstadt“ erfassen“; Assistent „Weiter →“.

**Beobachtung:** (1) „Weiter →“ zweimal an derselben Stelle: der zweite Tipp
bringt bei Abständen von 0 bis 1 000 ms keinen zweiten Schritt (Schritt 3 bleibt
Schritt 3), ab 1 400 ms geht er an (Schritt 4). Das ist der gewünschte Schutz
gegen Doppeltipp. (2) Im Dialog der Schnellerfassung: Lag der Auslöser auf dem
Bildschirm so, dass der Dialogknopf „Für „Hochwasser Musterstadt“ erfassen“
(256 bis 316 px) an derselben Stelle liegt wie der eben getippte Auslöser,
blieb der Dialog nach dem Tipp bei Wartezeiten von 300, 600 und 1 000 ms offen;
erst nach 1 500 ms schloss der Tipp ihn und öffnete die Erfassung. (3) Dialog
mit Zurück oder „Abbrechen“ geschlossen und den Auslöser innerhalb von 200 ms
wieder getippt: der Dialog öffnet nicht (bei 700 ms und mehr schon). Über dem
Finger stand in allen Fällen „Einen Moment …“ (60 bis 900 ms gemessen).

**Erwartung der Rolle:** Doppeltipp wird abgefangen, aber der erste bewusste
Tipp auf einen frisch erschienenen Knopf geht durch. Wer „Abbrechen“ und gleich
wieder den Auslöser tippt, sieht den Dialog wieder.

**Folge im Einsatz:** Gering, solange „Einen Moment …“ erscheint; ein
Helfer, der nur kurz hinsieht, tippt ein zweites Mal und kommt durch. Die
Annahme, dass der Dialogknopf an der Auslöserstelle liegt, ist Risiko: Sie
hängt davon ab, wie weit er die Seite vorher gerollt hat.

**Empfehlung:** Den Schutz an einen neu geöffneten Dialog nicht übertragen
(Sperre beim Öffnen eines Dialogs aufheben) oder die Dauer auf die Zeit eines
echten Doppeltipps (rund 500 ms) begrenzen.

**Nachprüfung:** Auslöser und Dialogknopf auf dieselbe Bildstelle legen, nach
300 ms tippen: Der Dialog reagiert; zwei Tipps im Abstand von 150 ms auf
„Weiter →“ lösen weiter nur einen Schritt aus.

### Verweise auf Befunde anderer Berichte

- **Lange Einsatzansicht am Telefon:** Die Einsatzansicht ist bei 360 px rund
  4 660 px hoch; „Einsatz löschen…“ und „Lagemonitor öffnen“ liegen am Ende.
  Beobachtet im Lauf, Bewertung bei den Führungs- und Mobilprüfern.
- **Ansicht-Wahl dreifach in der Einsatzansicht** (Kopf, fester Balken,
  Seitenende): beobachtet; Rest von R6-S5, ausgearbeitet in
  [mobile-ui.md](../runde-7/mobile-ui.md) (R7-M8).

## Bestätigtes

- **Papier-Abgleich (R7-S1):** Nr. „77“, Zug „Abschnitt Nord“ und Status
  „abgerückt“ bei der ersten Einheit eingetragen. Neuladen: Die Karte steht
  zu, darüber „Angefangene Eingaben für 1 Einheit sind noch da …“; Wiederöffnen
  liefert dieselben Werte. „Später“ und „‹ Startseite“ und zurück: dieselben
  Werte. „Eingaben verwerfen…“ fragt „Die Eingaben für 1 Einheit werden
  gelöscht. Sie stehen dann nur noch auf dem Papier.“ „Abgleich übernehmen“:
  Dialog „Abgleich übernommen – drei Hinweise“ (fehlende Eintreffzeit bei 3
  Einheiten, fehlende Abrückzeit bei 1); danach nach Neuladen kein
  Zwischenstand mehr.
- **Konfliktwarnung (R7-S2):** Bei einer Änderung nur im Ort lautet die
  Warnung „Das andere Fenster hat den Bogen geändert: Ort / Auftrag. Dort: …
  gespeichert 21:29:28 Uhr, 8 Personen. Hier: … zuletzt gespeichert 21:29:17
  Uhr“; die Rückfrage sagt „Geladen wird der Stand des anderen Fensters
  (21:29:58 Uhr — dort anders: Ort / Auftrag)“.
- **Rückholplatz (R7-S3):** Karte „Zuletzt geschlossener Bogen (durch den Stand
  des anderen Fensters ersetzt — deine Fassung) · zuletzt bearbeitet … · 8
  Personen“.
- **Geräteuhr (R7-S5, D2, W2):** Rückwärtssprung 400 Tage: „Die Uhr ist 400
  Tage zurückgegangen.“; erste, zweite und dritte Lesung zeigen die Warnung;
  im Assistenten „⚠ Geräteuhr nicht bestätigt … Antworten kannst du auf der
  Startseite …“. Vorwärtssprung 204 Tage mit altem Entwurf und alter Sammlung:
  „Die Uhr ist 204 Tage vorgesprungen.“ mit „Wenn das Datum stimmt, werden 1
  Sammlung und die Namen im eigenen Bogen endgültig gelöscht. Wenn die Uhr
  falsch geht, bleibt alles.“ „Geräteuhr stimmt“ öffnet „Datum stimmt — jetzt
  endgültig löschen?“ mit Rumpf zum Rollen, „Ja, Datum stimmt — löschen“ und
  „Abbrechen“ im festen Fuß; nichts wird ohne diese zweite Antwort gelöscht.
- **Zwei-Fenster-Leiste (R7-M2, O1, G6):** 360 × 640: Warnung 104 px (16 %)
  mit beiden Knöpfen sofort sichtbar; 200 % Schrift 136 px (21 %); 320 × 568
  mit 200 %: 136 px (24 %). Quer (640 × 360): „Entscheiden“ klappt die Knöpfe
  auf („Zuklappen“). Kein Seitenüberlauf.
- **Rückfragen bei großer Schrift (R7-W1, E4):** „Person entfernen“ und „Nur
  Stärke melden“ bei 320 × 568 mit 200 %, bei Zoom 180 × 320 und quer mit 200 %:
  Dialog im Bild, beide Knöpfe in der Bildhöhe (Fuß fest, Rumpf rollt).
- **„Nur Stärke“-Rückfrage (A1):** „8 erfasste Personen zählen dann nicht mehr
  einzeln — die Stärke wird von Hand geführt und startet mit 0 / 2 / 6 / 8. Die
  Namen bleiben als Erreichbarkeiten erhalten.“; Zurück schließt den Dialog,
  die Auswahl bleibt bei „Personal vollständig erfassen“.
- **Musterung (H2):** „Einsatz vorbereiten“ ist eine eigene Ansicht
  (`history.state.eeb.muster`); nach Abwahl einer Person und Neuladen steht
  „Deine Haken von vorhin sind wieder da — die Musterung wurde unterbrochen.“
  (Personal 7/8). Die Haken kommen nur, wenn die Vorlage ein `geaendert`
  trägt (Seed-Beachtung).
- **Zurück-Kette:** Startseite → Fortsetzen → 3 → 4 → 5 → „‹ Startseite“ →
  Sammlung öffnen, dann sechs Mal Zurück: Startseite, Schritt 5, 4, 3, …,
  Startseite; keine Rückkehr in die Sammlung, die App wird nicht verlassen.
- **Dialoge der Startseite:** „Einheit schnell erfassen“ schließt mit Zurück,
  Verlaufslänge 2 → 3 → 3; „Bogen schließen“ schließt mit Zurück und lässt den
  Bogen offen.
- **Neuladen im Tippen:** Text im Feld „Ort / Auftrag“ bleibt ohne Verlassen
  des Feldes erhalten; Startseite bietet „Fortsetzen“.
- **Doppeltipp „Weiter →“:** bis 1 000 ms ein Schritt, ab 1 400 ms zwei Schritte
  (siehe R8-S4).
- **Verwerfen und Rückholen (D3):** „Verwerfen“ nennt „Der Stand bleibt auf der
  Startseite unter „Zuletzt geschlossenen Bogen zurückholen“ erreichbar“; nach
  dem Verwerfen steht „Angefangener Bogen verworfen — Rückholung oben auf der
  Startseite.“.
- **QR-Vollbild (N7):** „Teil 1 von 7“, „Weiter zu Teil 2 →“ (277 × 44 px),
  „Schließen“ (328 × 44 px); Zurück schließt es.

## Abgleich mit Runde 7

Grundlage: [../runde-7/stress-und-unterbrechung.md](../runde-7/stress-und-unterbrechung.md)
mit „Stand der Behebung“ in [../runde-7/README.md](../runde-7/README.md).

| Runde-7-Befund | Stand laut Tabelle | Bewertung Runde 8 | Beobachtung |
| --- | --- | --- | --- |
| R7-S1 Papier-Abgleich verliert Eingaben (P2) | behoben | **hält** | Neuladen, „Später“, „‹ Startseite“: Eingaben da; „Eingaben verwerfen…“ fragt; nach „Abgleich übernehmen“ kein Rest im Sitzungsspeicher. |
| R7-S2 „dort“ und „hier“ nicht zu unterscheiden (P3) | behoben | **hält** | Feld „Ort / Auftrag“ und Sekunden in Warnung und Rückfrage. |
| R7-S3 Rückholkarte trägt denselben Namen (P3) | behoben | **hält** | Karte nennt „durch den Stand des anderen Fensters ersetzt — deine Fassung“, Personenzahl, Zeit. |
| R7-S4 „Fortsetzen“ quer bei 200 % Schrift (P3) | behoben | **hält, Zoom nicht** | Quer 200 % Schrift im Bild (246 bis 310 px); bei Browser-Zoom 180 × 320 weiter 450 px, 320 × 180 weiter 360 px (R8-S3). |
| R7-S5 Geräteuhr „… (400 Tage danach)“ (P3) | behoben | **hält** | „Die Uhr ist 400 Tage zurückgegangen.“ / „… 204 Tage vorgesprungen.“ |
| Geräteuhr-Halt auch beim zweiten Lesen (D2, W2) | behoben | **hält** | Drei Lesungen mit Warnung; Hinweis im Assistenten. |
| Zwei-Fenster-Leiste und Rückfragen (M2, O1, G6, W1, E4) | behoben | **hält** | 16 bis 24 % der Höhe; Rumpf rollt, Fuß fest in vier Lagen. |
| „Nur Stärke“-Rückfrage (A1) | behoben | **hält** | Text an die Gleichheit der Zahlen gebunden. |
| Musterung als Verlaufsansicht (H2) | behoben | **hält** | Eigener Verlaufseintrag; Haken nach Neuladen zurück. |
| Verlauf: späte Rückkehr eines eigenen `back()` | behoben | **hält** | Zurück-Kette über Assistent, Startseite, Sammlung ohne Rückfall; Dialog mit Zurück schließt. |
| Beiseitelegen unlesbarer Daten (E1, E2, N3) | behoben | **hält, Text lang** | Kasten mit „Als Datei sichern“ und „Entfernen…“, Löschdatum genannt; Text zu lang (R8-S2). |
| Layout bei großer Schrift/Zoom (M3, M4, M5, M7, H1) | behoben | **hält, mit Rest** | Kein Seitenüberlauf in acht Lagen; Sprungmarke bei 320 × 568 mit 200 % (R8-S1), Zoom-Rest (R8-S3). |
| Lagemonitor, Sortierung, Kurz-Liste, Zug-Normalisierung, Umschlagfeld „lage“ | behoben | **nicht geprüft** | Gehört den Führungs- und Feldprüfern; Lagemonitor im Lauf nicht als zweites Fenster erreichbar. |
| R6-O9 Uhrstand in der Zukunft, frische Sammlung | bekannte Grenze | **nicht erneut geprüft** | Stand unverändert laut Runde 7. |
| R7-G4/M8 Ecken-Knopf hochkant | teilweise (Bauart) | **unverändert** | Fester Balken „◐ Ansicht: Standard“ liegt in der Einsatzansicht (360 × 640) über dem Ende des Inhalts. |
| R7-G8/H9 Geräteuhr-Warnung bei 200 % und 320 × 568 | teilweise | **unverändert, im Bild** | „Geräteuhr stimmt“ liegt bei 449 px von 568, „Fortsetzen“ bei 976 px darunter. |
| R7-N1 kein Zusammenführen-Tipp | teilweise | **nicht geprüft** | Nicht Gegenstand dieser Rolle. |
| R7-N9 Ziffern der Schrittleiste | teilweise | **unverändert** | Schrittleiste „1 offen“, „2 ✓“ … ohne Ziffernwörter, Ziele 44 px hoch. |

Bilanz: Alle fünf Runde-7-Befunde dieses Berichts halten; keine Behebung hat
sich verkehrt, ich habe keine Nebenwirkung an Verlauf, Dialogen, Fußleiste,
Zwei-Fenster-Abgleich, Geräteuhr, Papier-Abgleich oder Musterung gefunden. Neu
sind R8-S1 bis R8-S4, alle P3: 0 / 0 / 0 / 4 für P0 / P1 / P2 / P3.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Der Hinweis zum beiseitegelegten Bogen liest
  sich wie ein Support-Fall statt wie „Daten sind sicher, mach weiter“
  (R8-S2).
- **Größtes Einsatzrisiko:** Ein bewusster Tipp auf einen frisch erschienenen
  Dialogknopf wird still verworfen, wenn er dort liegt, wo eben der Auslöser
  getippt wurde (R8-S4).
- **Top-Priorität für die nächste Iteration:** Den Kasten zum beiseitegelegten
  Bogen kürzen und den nächsten Schritt in den Kasten setzen (R8-S2).
