# Audit „Stress und Unterbrechung", Runde 5 (Zeitdruck, Ablenkung, Wiedereinstieg)

Stand: 06.10.2026 · Prüfer: Rollenaudit `thw-stress-test-user` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit c0cbae0 (Code entspricht 4fcdbaf).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-4-Befunde.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, Zeitzone
Europe/Berlin, ohne Kamera. Jeder Ablauf lief in einem eigenen
Browser-Kontext, damit die elf anderen Prüfer am selben Server nicht
hineinwirken. Doppeltipps und Tipp-Reihen habe ich mit `touchscreen.tap` an
derselben Bildstelle ausgelöst, die Zurück-Geste mit `page.goBack()`
nachgestellt, die offene Bildschirmtastatur mit einem Viewport von
360 × 380 px. Der Server war ausgelastet; Zeitangaben sind deshalb Abstände im
Skript, keine Bedienzeiten.

Getestet habe ich zuerst ohne Blick in frühere Berichte, gezielt an den in
Runde 4 umgebauten Stellen: Zurück-Geste bei offener Rückfrage und im
QR-Vollbild, Fingerstellen-Sperre von 1,5 s, zwei Fenster mit „Meine Fassung
behalten", „Wohin damit?" beim Kaltstart, Fußleiste und „Ansicht". Danach habe
ich den Runde-4-Bericht samt „Stand der Behebung" und die Runde-4-README
gelesen und die Behebungen einzeln nachgestellt, zuletzt die bis dahin
vorliegenden Runde-5-Berichte.

Zustände über `localStorage`-Seeds aus `examples/thw/`, jeweils mit
`uebung: false`: `eeb.entwurf.v1` mit 001 Albstadt (Schritt 1, 2, 3 oder 6),
mit dem Großbogen `grossbogen-verstaerkter-bergungszug.json` (7 QR-Teile) und
mit 013 Ulm als angefangene Fremd-Erfassung (`fremd`), dazu 010 Radolfzell auf
dem Rückholplatz (`eeb.entwurf.ersetzt.v1`); `eeb.einsaetze.v1` mit der
Sammlung „Hochwasser Albstadt" (001–003 bzw. 001–006). Der Bogen-Link für 016
Bamberg stammt aus dem Runde-4-Lauf (aus „Weitere Formate → Link teilen" der
App). Ein Seed wird je Kontext nur einmal gesetzt, sonst entstehen
Scheinkonflikte zwischen zwei Fenstern. Die Einsatzzeiträume der Seeds liegen
im Juli 2026; deshalb stehen in meinen Läufen „Zeitraum vorbei" und die
Datenschutzfrist-Zeile im Bild. Das gehört nicht zu den Befunden.

Rolle: ein Gruppenführer, der den eigenen Bogen zwischen Fahrzeug und Funk
führt, und ein Helfer am Meldekopf, der nebenbei Einheiten aufnimmt und dabei
angesprochen wird.

Szenarien:

1. **Zurück-Geste bei offenem Fenster:** „Person entfernen", „Einsatz
   löschen…" (Startseite und Einsatzansicht), „Verwerfen", Sammlungswahl der
   Schnellerfassung, Datenschutz, „Bogen übergeben", „In Einsatz-Sammlung
   ablegen", „Einheit für den Einsatz erfassen?", „Neuen Bogen erstellen";
   QR-Vollbild einteilig und siebenteilig, Zurück auf der Rückfrage „Hat die
   Gegenstelle gescannt?".
2. **Doppeltipp und Tipp-Reihen** mit 100 bis 2 200 ms Abstand auf
   „Weiter →", „Neuen Bogen erstellen", „Neu anfangen", „Verwerfen",
   „Person entfernen" samt Bestätigung, „Abrücken", „Weiter zu Teil n" im
   QR-Vollbild.
3. **Zwei Fenster:** gleicher Entwurf in zwei Tabs, beide tippen, beide
   Antworten auf die Konfliktwarnung; Tab B legt einen neuen Bogen an, Tab A
   behält seine Fassung; „Stand aus dem anderen Fenster laden"; Sammlung in
   zwei Tabs (Abrücken in beiden); Konfliktwarnung bei offener Tastatur.
4. **Eingehender Link („Wohin damit?"):** Kaltstart ohne Daten, mit
   Sammlung, mit Sammlung und eigenem Bogen; Link im selben Tab
   (`hashchange`), in einem zweiten Tab, Neuladen und Zurück bei offener
   Rückfrage, „Bogen öffnen" bei eigenem Bogen.
5. **Unterbrechung beim Tippen:** Tab schließen unmittelbar nach dem
   letzten Buchstaben, Fortsetzen im neuen Tab.
6. **Meldekopf:** Schnellerfassung (Sammlungswahl, „In Einsatz übernehmen"
   mit leerem Bogen), zweite Erfassung neben angefangener Fremd-Erfassung,
   Einsatzansicht mit sechs Einheiten.
7. **Fußleiste und „Ansicht":** „◐" im Assistenten, Umschalter und
   schwebendes „◐" in der Einsatzansicht, Fußleiste mit Sammelknopf in der
   Schnellerfassung.

Nicht prüfbar: echter Lärm und echte Unterbrechung durch Personen, die echte
Bildschirmtastatur (nur als verkleinerter Viewport nachgestellt), die
Zurück-Geste der installierten PWA und der nativen Builds (nur
`page.goBack()`), echte Doppeltipps mit Handschuh (Abstand und Trefferfläche
nachgestellt), Kamera- und Handscanner, Messenger-Verhalten beim Öffnen eines
Links, echte Bedienzeiten unter Last, Hintergrund-Beenden des Tabs durch das
Betriebssystem (nur Neuladen und Tab schließen).

## Urteil

Die Runde-4-Umbauten halten. Die Zurück-Geste schließt bei offener Rückfrage
nur die Rückfrage: Ansicht und Speicher bleiben, wo sie waren. Der zweite Tipp
nach „Weiter →", „Neuen Bogen erstellen" und „Neu anfangen" geht ins Leere,
bis 1,4 s nach dem ersten. „Meine Fassung behalten" legt den Stand des anderen
Fensters auf den Rückholplatz, „laden" führt in den Schritt zurück. Ein
Bogen-Link bei Kaltstart fragt „Wohin damit?" und nennt die Sammlung beim
Namen. Das Autosave hält auch das Schließen des Tabs unmittelbar nach dem
letzten Buchstaben aus.

Reibung entsteht dort, wo der neue Schutz an seine Grenzen stößt oder gar
nicht greift. Der gefährlichste Rest liegt im mehrteiligen QR-Vollbild: Zwei
schnelle Tipps auf „Weiter zu Teil 2" springen auf Teil 3, Teil 2 stand
150 ms im Bild und zählt als gezeigt, am Ende fragt die App ohne Warnung „alle
7 Teile gescannt?" (R5-S1). Die Fingerstellen-Sperre selbst schweigt: Wer in
einem Tempo von zwei Tipps pro Sekunde „Weiter →" drückt, bekommt nur jeden
dritten Tipp (R5-S2). Und nach „Person entfernen" öffnet ein Nachtipp auf die
Bestätigung die Rückfrage der nächsten Person, ein weiterer Tipp entfernt
sie, ohne dass die erste noch rückgängig zu machen ist (R5-S3). Die Warnung
bei zwei Fenstern nimmt bei offener Tastatur mehr als die Hälfte des Bildes
und verdeckt das Feld, in das man tippt (R5-S4).

Die Kernaufgaben gelingen ohne fremde Hilfe, auch mit Unterbrechungen. Wer in
den QR-Teilen hektisch tippt, kann aber eine Übergabe bestätigen, die
unvollständig ist.

## Befunde

### R5-S1 [P1] QR-Vollbild: Ein Doppeltipp auf „Weiter zu Teil n" überspringt einen Teil, und der Schluss fragt ohne Warnung „alle 7 Teile gescannt?" (neu)

**Priorität:** P1

**Nachweis:** gemessen (angezeigte Teile nach zwei Tipps, Text der
Rückfrage am Ende, Screenshot `a38-ende`; Skripte `a37`, `a38`). Dasselbe
steht in den Arbeitsnotizen von [feldtauglichkeit.md](feldtauglichkeit.md)
(dort „F1"); falls es dort als Befund ausgearbeitet wird, gilt dieser
Eintrag als Verweis.

**Fundstelle / Aufgabe:** Übergabe eines Bogens, der mehr als einen QR-Code
braucht („Bogen übergeben…" → „QR-Code im Vollbild zeigen"). Code:
`src/app/schritte/uebersicht.tsx` (`QrVollbild`, Knopf „Weiter zu Teil n →",
`gezeigt`-Menge, Phase `frage`).

**Beobachtung:** Großbogen „Verstärkter Bergungszug", 7 Teile. Teil 1 ist
offen, zwei Tipps an derselben Stelle auf „Weiter zu Teil 2 →":

| Abstand der Tipps | Teil danach |
| --- | --- |
| 150 ms | Teil 3 von 7 |
| 600 ms | Teil 3 von 7 |
| 1 200 ms | Teil 3 von 7 |
| 1 700 ms | Teil 3 von 7 |

Nach dem Wechsel liegt an derselben Stelle wieder „Weiter zu Teil n →" (der
Knopf trägt die nächste Zahl); die Ortssperre aus `tipp-schutz.ts` greift
hier nicht, weil der Teilwechsel in der Überlagerung keinen Ansichtswechsel
der App auslöst. Der übersprungene Teil 2 wurde dargestellt und zählt damit
als „gezeigt" (die Menge füllt sich beim Rendern, nicht nach einer
Mindestanzeigedauer). Weiter mit Tipps im Abstand von 1,7 s bis Teil 7,
„Schließen": Die Rückfrage lautet „Hat die Gegenstelle alle 7 Teile
gescannt?" mit „Ja, gescannt — übergeben". Der Hinweis „Teil n von 7 wurde
noch nicht gezeigt" erscheint nicht, weil die App Teil 2 als gezeigt führt.

**Erwartung der Rolle:** Ein Teil, den ich nie ruhig vor der Kamera des
Meldekopfs hatte, gilt nicht als gezeigt. Ein unsicherer zweiter Tipp darf
mich nicht an einem Code vorbeischieben.

**Folge im Einsatz:** Der Meldekopf scannt Teil 1, dann Teil 3 bis 7. Der
Absender bestätigt „Ja, gescannt — übergeben", die Übersicht trägt den Bogen
als übergeben. Der Bogen kommt aber unvollständig an; die Gegenstelle merkt es
erst beim Zusammensetzen, wenn der Absender schon weg ist. Das ist der Fall,
der die Teile-Prüfung aus R3-H3 verhindern sollte. Dasselbe passiert ohne
Doppeltipp, wenn ein Teil nur kurz im Bild steht und weitergetippt wird.

**Empfehlung:** Einen Teil erst als „gezeigt" zählen, wenn er eine
Mindestzeit im Bild stand (etwa 1,5 s), und „Weiter zu Teil n" nach dem
Wechsel an der Fingerstelle sperren wie in den Schritten des Assistenten. Ein
übersprungener Teil muss in der Abschlussfrage als „Teil 2 wurde nicht
gezeigt" stehen.

**Nachprüfung:** Großbogen, Doppeltipp mit 150, 600 und 1 200 ms auf „Weiter
zu Teil 2": Teil 2 ist offen. Mit zwei Tipps bis Teil 7 durchklicken und
„Schließen": Die App nennt die ausgelassenen Teile.

### R5-S2 [P2] Die Fingerstellen-Sperre schweigt: Wer „Weiter →" mit zwei Tipps pro Sekunde drückt, bekommt nur jeden dritten Tipp (neu, Nebenwirkung der Behebung von R4-S2)

**Priorität:** P2

**Nachweis:** gemessen (Schritt nach jedem Tipp, Skripte `a08`, `a09`). In
den Arbeitsnotizen von [feldtauglichkeit.md](feldtauglichkeit.md) steht
dieselbe Beobachtung („F2"); bei Ausarbeitung dort gilt dies als Verweis.

**Fundstelle / Aufgabe:** Leiste des Assistenten, „Weiter →". Code:
`src/app/tipp-schutz.ts` (`klickPruefen`, `ORTSSPERRE_MS` = 1 500,
`ORTSSPERRE_RADIUS_PX` = 40), Aufruf aus dem Verlaufs-Effekt in
`src/app/app.tsx`.

**Beobachtung:** Acht Tipps auf „Weiter →" im Abstand von rund 0,7 s,
beginnend in Schritt 1:

| Tipp | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Zeit (s) | 0,4 | 1,0 | 2,0 | 2,6 | 3,3 | 4,2 | 4,8 | 5,5 |
| Schritt danach | 2 | 2 | 3 | 3 | 3 | 4 | 4 | 4 |

Drei von acht Tipps wirkten, fünf wurden verworfen. Doppeltipps mit 100 bis
1 450 ms Abstand: Schritt 2; mit 1 600 und 2 200 ms: Schritt 3, die Sperre
endet also bei etwa 1,5 s. Ein verworfener Tipp zeigt nichts: keine Marke,
kein Zucken, kein gedrückter Zustand (Screenshot `a09-gesperrt`). Der Knopf
sieht aus, als nähme er nichts an.

**Erwartung der Rolle:** Ein Knopf, der gerade nicht reagieren darf, sagt
das, oder er reagiert sichtbar. Wer weiß, dass alles vorbelegt ist, will
Schritte zügig durchgehen.

**Folge im Einsatz:** Eine Gruppenführerin, die einen vorbelegten Bogen im
Gehen durchblättert, tippt weiter, sobald sie den Schritt gelesen hat (meist
nach 0,7 bis 1 s), und denkt, der Knopf hänge. Sie tippt fester und öfter.
Auf Dauer lernt sie, nach jedem Schritt zu warten, ohne zu wissen warum. Der
Schutz gegen das Überspringen ist richtig, er braucht aber Rückmeldung.

**Empfehlung:** Einen verworfenen Tipp sichtbar machen (der Knopf zeigt für
die Sperrzeit seinen gedrückten Zustand oder blinkt kurz), oder die Sperre
auf 0,8 bis 1 s kürzen und mit einer Rückmeldung an die Fingerstelle binden.
Dieselbe Rückmeldung an allen Stellen, an denen die Ortssperre greift
(Rückfragen, „Abrücken").

**Nachprüfung:** Tipp-Reihe im Abstand von 0,7 s auf „Weiter →": Entweder
rückt jeder Tipp einen Schritt weiter, oder jeder verworfene Tipp ist am
Knopf sichtbar.

### R5-S3 [P2] „Person entfernen": Nachtipps auf die Bestätigung öffnen die Rückfrage der nächsten Person und bestätigen sie; „Rückgängig" gilt nur für die letzte (neu)

**Priorität:** P2

**Nachweis:** gemessen (Personenzahl im Entwurf, Text der offenen Rückfrage
und der Daumenleiste, Screenshots `a20-nach1`, `a20-nach3`; Skripte `a17`,
`a19`, `a20`).

**Fundstelle / Aufgabe:** Assistent, Schritt 3 „Personal", „Lang, Sabine
entfernen" → Rückfrage → „Person entfernen". Code: Ortssperre in
`src/app/tipp-schutz.ts` (Parameter `ort` von `ortSperren`), Rückfrage in
`src/app/dialoge.tsx`.

**Beobachtung:** Vier Personen, die erste ist die Zugführerin und damit die
Ansprechperson. Tipp auf „Lang, Sabine entfernen", Rückfrage, Tipp auf die
Bestätigung, danach fünf bzw. sechs weitere Tipps an derselben Stelle:

| Abstand der Nachtipps | Personen danach | Rückfrage danach |
| --- | --- | --- |
| 150 ms | 4 → 3 | „Sommer, Sandra entfernen?" offen |
| 300 ms | 4 → 3 | „Sommer, Sandra entfernen?" offen |
| 500 ms | 4 → **2** | zu |
| 700 ms | 4 → **2** | zu |
| 1 000 ms | 4 → **2** | zu |

Nach der Bestätigung rutscht die nächste Person unter die Fingerstelle; ihr
Knopf „Person entfernen" liegt dort, wo eben die Bestätigung lag. Der erste
Nachtipp öffnet deren Rückfrage. Die Sperre von 1,5 s gilt nach dem Code-Kommentar der Stelle des auslösenden
Knopfs; an der Stelle der Bestätigung fängt sie die Nachtipps nicht ab (Deutung
aus Messung und Code), und die der zweiten Rückfrage läuft ab, bevor der
Nachtipp-Rhythmus endet. Der Bestätigungsknopf der zweiten Rückfrage liegt
dort, wo der Finger ohnehin ist. In der Daumenleiste steht danach nur noch
„Entfernt: Sommer, Sandra · Rückgängig". Sabine Lang ist nicht mehr
zurückzuholen.

**Erwartung der Rolle:** Ein zögernder Nachtipp bestätigt nicht die nächste,
nie gestellte Frage. Wer eine Person entfernt hat, kann sie auch dann noch
zurückholen, wenn er danach versehentlich eine zweite entfernt.

**Folge im Einsatz:** Das ist kein Doppeltipp mit 150 ms, sondern ein
Tipp-Rhythmus von 0,5 bis 1 s über zwei bis drei Sekunden: ein Helfer, der
nicht sicher ist, ob der erste Tipp angekommen ist, und beim zweiten
Hinsehen nichts mehr erkennt. Er verliert zwei Personen, davon die
Ansprechperson an erster Stelle; die Stärke in der Meldung stimmt dann nicht.
Gerettet wird nur die letzte.

**Empfehlung:** Nach einer bestätigten Entfernung die Stelle der Bestätigung
mitsperren (nicht nur die Stelle des auslösenden Knopfs) und die Sperre um
jeden verworfenen Tipp verlängern. Zusätzlich hält die Daumenleiste mehrere
Entfernungen vor („Entfernt: 2 Personen · Rückgängig").

**Nachprüfung:** Wie oben mit 150, 300, 500, 700 und 1 000 ms: Es verschwindet
genau eine Person; eine zweite Rückfrage öffnet sich nicht von allein.

### R5-S4 [P2] Konfliktwarnung zweier Fenster: Bei offener Tastatur verdeckt sie das Feld, in das man tippt (neu)

**Priorität:** P2

**Nachweis:** gemessen (Lage von Warnung und Fokusfeld bei Viewport
360 × 380 px als Nachstellung der Tastatur, Screenshot `a35-tastatur`;
Skript `a35`). Mit echter Bildschirmtastatur nicht geprüft.

**Fundstelle / Aufgabe:** Warnung „⚠ Dieser Bogen wurde in einem anderen
Fenster geändert …" mit „Stand aus dem anderen Fenster laden" und „Meine
Fassung behalten". Code: `FensterKonflikt` in
`src/app/fenster-abgleich.tsx`.

**Beobachtung:** Die Warnung steht fest am oberen Bildrand und ist durch den
längeren Text (Name und Stand des anderen Fensters, Runde-4-Behebung) jetzt
240 px hoch (Runde 4: etwa 178 px). Mit 380 px Viewhöhe bleiben 140 px für
den Bogen. Das fokussierte Feld „Einsatzort / Auftrag" liegt bei y 72 bis
116 und damit **unter der Warnung**; das Feld, in das man tippt, ist nicht zu
sehen. Solange nicht entschieden ist, wird nichts gespeichert: Alles Getippte
steht nur im Feld (gemessen: Speicher nach B-Eingabe unverändert).
Mit 640 px Höhe ohne Tastatur sind es 37 % des Bildes.

**Erwartung der Rolle:** Wenn ich nicht gespeichert werde, sehe ich
wenigstens, was ich tippe, und die Entscheidung liegt nicht über dem Feld.

**Folge im Einsatz:** Wer im zweiten Fenster weiterarbeitet, ohne die
Warnung zu lesen, tippt blind in ein Feld, dessen Inhalt nirgends landet. Das
Tippen fühlt sich normal an; die Zeile „gespeichert" ist durch die Warnung
ersetzt, die bei offener Tastatur aber den halben Bildschirm füllt und gerade
dann kaum gelesen wird. Bei 200 % Schrift ist der Zustand noch enger (nicht
gemessen).

**Empfehlung:** Die Warnung auf zwei Zeilen und die beiden Knöpfe kürzen
(der Hinweis auf den Rückholplatz gehört in die Rückfrage hinter „Meine
Fassung behalten", nicht in die Daueranzeige) und bei offener Tastatur
einklappen auf eine Zeile mit einem Tipp auf „Entscheiden".

**Nachprüfung:** Zwei Fenster, in A tippen, in B das Ortsfeld antippen bei
360 × 380 px: Das Feld liegt oberhalb der Tastatur und nicht unter der Warnung.

### R5-S5 [P3] Zurück-Geste bei offener Rückfrage auf der Startseite verlässt weiter die App (Rest von R4-S1)

**Priorität:** P3

**Nachweis:** gemessen (Skripte `a02`, `a33`).

**Fundstelle / Aufgabe:** Startseite im ersten Verlaufseintrag; Rückfragen
„Angefangenen Bogen verwerfen?", „Neuen Bogen anfangen?", „Einsatz
löschen?" (Startseite), Sammlungswahl der Schnellerfassung. Code: Lauscher
`beiVerlauf` in `src/app/app.tsx`, der Abfangweg wirkt nur bei einem
`popstate` innerhalb der App (Fenster zu, Verlaufseintrag neu).

**Beobachtung:** Wer die Startseite als erste Seite geöffnet hat (Link,
Startbildschirm), gelangt mit Zurück nicht auf ein `popstate` der App,
sondern aus der App heraus. Gemessen: „Verwerfen", „Einsatz löschen" und die
Sammlungswahl der Schnellerfassung bleiben mit Zurück nicht offen, die Seite
ist verlassen. Mit einem Verlaufseintrag davor (Fortsetzen, danach „‹
Startseite") schließt dieselbe Rückfrage dagegen sauber, auch „Neuen Bogen
erstellen" (zweites Zurück: Schritt 2 des Bogens). Im Assistenten, in der
Einsatzansicht, im Datenschutz-Fenster, in „Bogen übergeben" und in „In
Einsatz-Sammlung ablegen" ist das Verhalten richtig. Im Speicher verändert
sich nichts.

**Erwartung der Rolle:** Zurück ist mein „Abbrechen"; auf der Startseite
bleibe ich auf der Startseite.

**Folge im Einsatz:** Gering: Der Entwurf bleibt erhalten, und die Rückfrage
ist weg. Auf dem Telefon landet der Helfer aber nicht in der App, sondern im
Startbildschirm oder auf der zuvor geöffneten Seite und muss neu einsteigen.

**Empfehlung:** Beim Öffnen einer Rückfrage auf dem ersten Verlaufseintrag
einen eigenen Eintrag anlegen, damit Zurück die Rückfrage schließt.

**Nachprüfung:** App frisch öffnen, „Verwerfen" tippen, Zurück: Die
Startseite steht, die Rückfrage ist zu.

### R5-S6 [P3] Eine Meldung, auf die „Wohin damit?" noch wartet, ist nach Neuladen oder Zurück weg und hinterlässt keine Spur (neu)

**Priorität:** P3

**Nachweis:** gemessen (Skript `a14`).

**Fundstelle / Aufgabe:** Kaltstart mit Bogen-Link und mindestens einer
Sammlung („Meldung von … empfangen. Wohin damit?"). Code: `fragmentNehmen` in
`src/app/app.tsx` (entfernt das Fragment aus der Adresse, sobald es gelesen
ist).

**Beobachtung:** Mit offener Rückfrage und Neuladen: Die Startseite steht
ohne Rückfrage, ohne Hinweis und ohne den Bogen da. Auch Zurück führt aus der
App heraus (R5-S5). Gespeichert wird erst nach der Wahl. Die Rückfrage selbst
ist klar und nennt die Sammlung („In ‚Hochwasser Albstadt' aufnehmen",
Screenshot `a14-wohin`); zwei Tabs mit demselben Link legen die Einheit nicht
doppelt an (Sammlung bleibt bei 4 Einheiten).

**Erwartung der Rolle:** Wenn ich unterbrochen werde und die Seite
neugeladen wird, weiß die App noch, dass eine Meldung wartete, oder sie sagt,
dass sie verloren ist.

**Folge im Einsatz:** Auf dem Telefon beendet das Betriebssystem einen
Hintergrund-Tab oft von allein; wer zwischendurch angesprochen wird, kommt zu
einer Startseite zurück, auf der nichts auf die Meldung hinweist. Er scannt
oder tippt erneut (bei Link und QR ist der Weg offen), muss aber wissen, dass
er es muss.

**Empfehlung:** Das Fragment erst entfernen, wenn gewählt wurde, oder die
wartende Meldung kurz parken und auf der Startseite als „Meldung von … noch
nicht abgelegt" anbieten.

**Nachprüfung:** Link mit Sammlung öffnen, bei offener Rückfrage neu laden:
Die Startseite nennt die wartende Meldung oder fragt erneut.

### R5-S7 [P3] „Bogen öffnen" bei eigenem Bogen: zwei Rückfragen hintereinander (neu)

**Priorität:** P3

**Nachweis:** beobachtet (Skript `a15`, Screenshot `a15-doppelt`).

**Fundstelle / Aufgabe:** Link bei laufendem Bogen und vorhandener Sammlung:
„Meldung von … empfangen. Wohin damit?" → „Bogen öffnen (ansehen oder
bearbeiten)". Code: `empfangsZielWaehlen` und `darfBogenErsetzen` in
`src/app/app.tsx`.

**Beobachtung:** Die erste Rückfrage nennt unter „Bogen öffnen": „der eigene
angefangene Bogen bleibt über die Startseite zurückholbar". Nach der Wahl
folgt sofort eine zweite Rückfrage „Empfangenen Bogen öffnen? Der angefangene
Bogen … wird durch die empfangene Meldung ersetzt … bleibt … erreichbar"
mit „Meldung öffnen" und „Abbrechen". Die zweite sagt dasselbe wie die erste.
„In ‚Hochwasser Albstadt' aufnehmen" fragt nicht ein zweites Mal. Abbrechen
in der ersten Rückfrage lässt den Schritt und den Speicher unverändert
(gemessen).

**Erwartung der Rolle:** Ich habe „Bogen öffnen" gewählt; ich will nicht
dasselbe noch einmal bestätigen.

**Folge im Einsatz:** Ein Tipp mehr bei der Aufgabe, die am Meldekopf am
häufigsten vorkommt, und ein Anlass für den zweiten Tipp auf die vermeintlich
hängende Rückfrage. Gering, weil beide Rückfragen den eigenen Bogen schützen.

**Empfehlung:** Wenn die erste Rückfrage die Folge schon nennt, die zweite
überspringen (wie bei „Aus Datei laden…", Runde 4, R4-S5, „eine Rückfrage
statt zwei").

**Nachprüfung:** Link bei laufendem Bogen, „Bogen öffnen": Der Bogen öffnet
nach einer Rückfrage.

## Bestätigtes

- **Zurück bei offener Rückfrage (R4-S1):** „Person entfernen" (3. Personal),
  „Einsatz löschen…" (Einsatzansicht), „Einheit für den Einsatz erfassen?"
  (eigener Bogen im Hintergrund), Datenschutz, „Bogen übergeben", „In
  Einsatz-Sammlung ablegen", „Neuen Bogen erstellen": Fenster zu, Ansicht
  dieselbe, Personen und Sammlungen im Speicher unverändert (4 Personen /
  1 Einsatz). Bei „Neuen Bogen erstellen" führt ein zweites Zurück in den
  Bogen. Ausnahme: erster Verlaufseintrag (R5-S5).
- **QR-Vollbild und Zurück:** einteilig schließt Zurück das Vollbild und
  steht in der Übersicht; in der Rückfrage „Hat die Gegenstelle … gescannt?"
  wirkt Zurück wie „Nicht sicher" (Übergabestand „QR", ohne Bestätigung). Siebenteilig steht bei fehlenden Teilen „Teil 4 von 7 wurde noch
  nicht gezeigt. Ohne ihn hat die Gegenstelle den Bogen nicht." mit „Teil 4 von
  7 zeigen" und „Trotzdem schließen"; ein zweites Zurück schließt (so im Code
  vorgesehen).
- **Fingerstelle nach Ansichtswechsel (R4-S2, R4-S3):** Doppeltipp auf
  „Weiter →", „Neuen Bogen erstellen" und „Neu anfangen" (150 bis 1 400 ms):
  Schritt 2 bzw. Schritt 1, kein Darstellungsmenü; unter dem Finger liegt bei
  „Neu anfangen" ein Eingabefeld, das erst ab 1,7 s den Fokus nimmt.
  Nebenwirkung: R5-S2.
- **Doppeltipp auf Rückfragen (R4-G1):** „Neuen Bogen erstellen" (150 bis
  1 700 ms) und „Verwerfen" (250 ms): Rückfrage bleibt offen, Entwurf bleibt.
  „Neu anfangen" doppelt: ein Bogen. „Person entfernen" mit zwei Tipps: eine
  Person (aber R5-S3 bei Tipp-Reihen).
- **„Abrücken" doppelt (R3-S5):** 200 bis 1 400 ms: eine Einheit abgerückt,
  unter dem Finger „Auftrag/Notiz".
- **Zwei Fenster (R4-S4):** A tippt, B zeigt Warnung mit Name und Stand des
  anderen Fensters; B behält: Entwurf B, Rückholplatz A, keine Rückfrage, weil
  nichts endgültig fällt; A zeigt nun selbst die Warnung. Fall „B legt neu
  an, A behält": Entwurf A, Rückholplatz „Fenster B Neu", Startseite ohne
  doppelte Karte, „zuletzt bearbeitet 14:04 Uhr". „Stand aus dem anderen
  Fenster laden" öffnet im Schritt des Bogens, nicht auf der Startseite.
- **„Wohin damit?" (R4-W3):** Kaltstart mit Sammlung: Rückfrage mit
  Einheitsnamen, Stärke und Sammlungsname, „Abbrechen" ändert nichts.
  Kaltstart ohne Sammlung und ohne Entwurf öffnet den Bogen ohne Rückfrage
  (so im Code vorgesehen, `sammlungen.length === 0`); mit Entwurf fragt
  „Empfangenen Bogen öffnen?". Link im selben Tab (`hashchange`) bei
  laufendem Bogen: Schritt bleibt, Rückfrage kommt, „Abbrechen" lässt alles
  stehen.
- **Sammlung in zwei Tabs:** Abrücken in A, B zeigt ihn sofort; Abrücken in B
  danach; beide Einträge bleiben im Speicher (1,1,0).
- **Autosave:** Text im Ortsfeld tippen, Tab sofort schließen: Im neuen Tab
  steht der volle Text, „Fortsetzen" führt in „2. Einsatz".
- **Schnellerfassung:** Sammlungswahl, „Eingetroffen um" und „In Einsatz
  übernehmen" mit leerem Bogen („Name der Einheit fehlt" mit „Zum
  Namensfeld"); bei angefangener Fremd-Erfassung steht „Diese Erfassung
  fortsetzen / Verwerfen und neue Einheit erfassen" mit klarer Folge.

## Abschluss

- **Aufgabe geschafft:** eigener Bogen mit Unterbrechungen: ja. Meldekopf mit
  Unterbrechungen: ja. Übergabe eines mehrteiligen Bogens bei hektischem
  Tippen: mit Umwegen, es kann ein Teil fehlen (R5-S1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Ein Tipp, der keine Wirkung zeigt, heißt für
  die Hand „hat nicht geklappt", für die App „wurde absichtlich verworfen"
  (R5-S2).
- **Größtes Einsatzrisiko:** Ein Teil des QR-Codes steht 150 ms im Bild und
  gilt als gezeigt; die Übergabe wird als vollständig bestätigt (R5-S1).
- **Top-Priorität für die nächste Iteration:** Teile des QR-Vollbilds nur
  nach einer Mindestzeit als gezeigt zählen und den Teilwechsel an der
  Fingerstelle sperren (R5-S1).

## Abgleich mit Runde 4

Grundlage: [../runde-4/stress-und-unterbrechung.md](../runde-4/stress-und-unterbrechung.md)
mit „Stand der Behebung" und [../runde-4/README.md](../runde-4/README.md).

| Runde-4-Befund | Stand laut Tabelle | Bewertung Runde 5 | Beobachtung |
| --- | --- | --- | --- |
| R4-S1 Zurück-Geste bei offener Rückfrage (P2) | behoben | **hält, mit Rest** | Alle Fenster im Assistenten und in der Einsatzansicht schließen mit Zurück, Ansicht und Speicher bleiben. Auf der Startseite im ersten Verlaufseintrag verlässt Zurück die App, die Rückfrage ist weg (R5-S5); R4 hatte das für „Verwerfen" und die Sammlungswahl schon so beschrieben, die Behebung erfasst es nicht. Im QR-Vollbild hält die Zurück-Geste mit Teile-Warnung (R4-M5), die Warnung selbst hat aber R5-S1. |
| R4-S2 Doppeltipp auf „Weiter →" überspringt einen Schritt (P3) | behoben | **hält, mit Nebenwirkung** | 100 bis 1 450 ms: Schritt 2; ab 1 600 ms Schritt 3. Der Schutz wirkt, verwirft aber still jeden Tipp in 1,5 s und kostet beim zügigen Durchgehen zwei von drei Tipps (R5-S2). Im QR-Vollbild fehlt dieselbe Sperre (R5-S1). |
| R4-S3 Zweiter Tipp nach „Neuen Bogen erstellen" trifft „◐" (P3) | behoben | **hält** | „Neuen Bogen erstellen" (mit und ohne Entwurf) und „Neu anfangen": kein Darstellungsmenü; bei 1,7 s nimmt das Feld unter dem Finger den Fokus (Organisation, Name), nichts verändert sich. |
| R4-S4 „Meine Fassung behalten" verwirft das andere Fenster (P2) | weitgehend | **hält, mit dem bekannten Rest** | Stand des anderen Fensters liegt auf dem Rückholplatz, „laden" führt in den Schritt, die Startseite zeigt keine Doppelkarte, „zuletzt bearbeitet" nennt die Zeit. Die Warnung nennt Name und Stand, nicht das geänderte Feld; bei gleichem Einheitsnamen in beiden Fenstern (der Normalfall) unterscheidet der Name nichts. Neu: Bei offener Tastatur verdeckt sie das Tippfeld (R5-S4). |
| R4-S5 Kleinere Stellen beim Wiedereinstieg (P3) | teilweise | **teilweise, wie gemeldet** | Rückholplatz nennt „zuletzt bearbeitet" (hält). Rückfrage vor „Einsatz starten" ist eine statt zwei (nicht erneut gemessen). Offen bleibt: Eine zweite Fremd-Erfassung lässt sich nicht parallel anfangen; „Verwerfen und neue Einheit erfassen" legt die erste auf den Rückholplatz oder verwirft sie (so gemeldet, Dialog nennt die Folge). |
| R4-G1 Rückfragen: Zweiter Tipp nach gut 0,5 s bestätigt (P1, Verweis aus Handschuh-Bedienung) | behoben | **hält, mit Rest für „Person entfernen"** | „Verwerfen", „Neuen Bogen erstellen": zweiter Tipp bis 1,7 s ohne Wirkung, Rückfrage bleibt. „Person entfernen" hält bei zwei Tipps, bei einer Tipp-Reihe ab 0,5 s fällt die nächste Person (R5-S3). |
| R4-M5 Zurück-Geste im mehrteiligen QR-Vollbild (P2, Verweis) | behoben | **hält** | Zurück bei fehlenden Teilen zeigt „Teil 4 von 7 wurde noch nicht gezeigt"; ein zweites Zurück schließt (Absicht laut Code). |
| Verweis R4-W3 Kaltstart-Link macht den fremden Bogen zum eigenen Entwurf (P1, aus Arbeitsablauf) | behoben | **hält** | Mit Sammlung fragt „Wohin damit?"; ohne Sammlung öffnet der Bogen ohne Rückfrage (bewusst); neu ist R5-S6 (Neuladen verliert die wartende Meldung). |

Bilanz: Alle fünf Runde-4-Befunde dieses Berichts halten im Kern; keiner hat
sich verkehrt. Zwei sind mit Rest oder Nebenwirkung zu lesen: R4-S1 und
R4-S2 haben ihre Entsprechung in R5-S5 und R5-S2. R4-S4 hält mit bekanntem
Rest, R4-S5 bleibt teilweise wie gemeldet. Neu sind R5-S1 bis R5-S7: ein P1,
drei P2, drei P3. R5-S1 und R5-S2 stehen als Beobachtung auch in den
Arbeitsnotizen von [feldtauglichkeit.md](feldtauglichkeit.md); das schwebende
„◐" der Einsatzansicht (R5-L1 in [nacht-und-sicht.md](nacht-und-sicht.md))
und der unbeschriftete Vierer-Schalter dort (Runde-5-Bericht „Helfer ohne
Einweisung") sind hier nicht doppelt gezählt.
