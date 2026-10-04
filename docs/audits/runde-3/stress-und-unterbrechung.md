# Audit „Stress und Unterbrechung", Runde 3 (Zeitdruck, Ablenkung, Wiedereinstieg)

Stand: 04.10.2026 · Prüfer: Rollenaudit `thw-stress-test-user` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/gifted-cray-ngieaz`, Commit 33ed426.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-2-Befunde.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, Pixeldichte 2,
ohne Kamera. Eine Gegenprobe lief quer mit 640 × 360. Getestet habe ich
zuerst ohne Blick in frühere Berichte. Den Runde-2-Bericht und die Tabelle
„Stand der Behebung" habe ich danach gelesen, die übrigen Runde-3-Berichte
erst zum Schluss.

Die meisten Zustände sind durch Bedienung entstanden: Sammlung „Hochwasser
Deich" angelegt, dann 001 Albstadt, 002 Biberach, 003 Crailsheim und
006 Karlsruhe über „Bögen einlesen…" aufgenommen. Seeds habe ich nur für
eigene Entwürfe gesetzt: `eeb.entwurf.v1` mit `examples/thw/013-ulm-b.json`,
mit `uebung: false`, offen auf Schritt 3 bzw. 6, einmal mit Einsatzzeitraum
gestern. Die Bogen-Links für 013 Ulm und 016 Bamberg stammen aus „Weitere
Formate → Link" der App selbst.

Rolle: ein Gruppenführer, der den eigenen Bogen zwischen Fahrzeug und Funk in
10 bis 20 Sekunden je Bildschirm führt, und ein Helfer am Meldekopf, der
nebenbei Einheiten aufnimmt und dabei angesprochen wird.

Szenarien:

1. **Unterbrechung im eigenen Bogen:** Neuladen mitten im Tippen (Feld nicht
   verlassen), Browser-Zurück und -Vor, „Verwerfen" auf der Startseite.
2. **Unterbrechung am Meldekopf:** „Einheit manuell erfassen…" → Name →
   Neuladen; „‹ Einsatz" mitten in der Erfassung und erneut erfassen, dreimal
   hintereinander, jeweils mit eigenem Entwurf im Hintergrund; 25 Minuten
   Pause (Uhr vorgestellt) vor „In Einsatz übernehmen".
3. **Zwei Aufgaben auf einem Telefon:** angefangene Einsatz-Erfassung, dann
   „‹ Einsätze" → „Neuen Bogen erstellen" für den eigenen Bogen.
4. **Eingehender Link:** eigener Bogen in Arbeit, dann ein Bogen-Link aus
   dem Messenger, einmal im laufenden Tab (nur das Fragment ändert sich),
   einmal als neuer Tab und einmal nach Schließen des Tabs.
5. **Zwei Fenster:** dieselbe App in zwei Tabs, einmal am eigenen Bogen,
   einmal in der Sammlung.
6. **Mehrfaches Tippen:** Doppeltipp auf „In Einsatz übernehmen" und auf
   „Abrücken" mit 150, 300, 600 und 1 000 ms Abstand; Tipp auf „In Einsatz
   übernehmen", während unter dem Namensfeld noch Vorschläge offen sind.
7. **Wiedereinstieg:** Entwurf mit Zeitraum im Juli bzw. gestern →
   „Fortsetzen" → „Bogen übergeben…" → „Für neuen Einsatz vorbereiten";
   Schnellerfassung von der Startseite und danach die nächste Einheit aus
   der Sammlung.

Nicht prüfbar: echter Lärm und echte Unterbrechung durch Personen, die
Bildschirmtastatur (sie verdeckt am Telefon zusätzlich die untere Leiste),
der Kamera-Scan, der Handscanner, das Verhalten echter Messenger- und
System-Apps beim Öffnen eines Links (ob sie den vorhandenen Tab weiterbenutzen,
ist geräteabhängig, siehe R3-S1), die installierte PWA und die nativen Builds.
Echte Bedienzeiten lassen sich im Skript nicht messen und werden nicht
gewertet.

## Urteil

Der eigene Bogen übersteht die alltäglichen Unterbrechungen: Ein halb
getippter Nachname ist nach dem Neuladen da, Browser-Zurück geht einen
Schritt zurück, „Verwerfen" fragt nach und nennt den Rückholplatz. Am
Meldekopf hält, was Runde 2 gefordert hat. Drei abgebrochene Erfassungen
hintereinander lassen den eigenen Bogen auf dem Rückholplatz. Die
Schnellerfassung kennt ihre Sammlung, und „Nur Stärke" gilt auch für die
nächste Einheit. Ein Doppeltipp auf „In Einsatz übernehmen" erzeugt eine
Meldung, keine zwei. Ein alter Bogen geht nicht mehr als „plausibel" durch.

Gefährlich wird es dort, wo etwas von außen dazwischenkommt. Ein Bogen-Link,
den man bei offener App antippt, ersetzt den eigenen Bogen ohne Frage und ohne
Rückweg (R3-S1, P0). Ein Telefon, das eben noch Einheiten für den Meldekopf
aufgenommen hat, legt den danach begonnenen eigenen Bogen mit „In Einsatz
übernehmen" in die fremde Sammlung (R3-S2). Ein zweiter Tab überschreibt den
Entwurf, und die Warnung steht außerhalb des Bilds (R3-S3). Dazu kommen drei
Stellen, an denen ein unkonzentrierter Tipp etwas anderes tut als gedacht:
die Namensvorschläge über der Aktionsleiste (R3-S4), „Wieder anwesend" am
Platz von „Abrücken" (R3-S5) und die Eintreffzeit, die nach einer Pause die
Uhrzeit des Übernehmens wird (R3-S6).

Die Kernaufgaben gelingen ohne fremde Hilfe. Wer aber während der Arbeit am
eigenen Bogen einen Link antippt, verliert den Bogen, ohne es zu merken.

## Befunde

### R3-S1 [P0] Bogen-Link bei offener App ersetzt den eigenen Bogen ohne Frage und ohne Rückholung (neu)

**Priorität:** P0

**Nachweis:** gemessen (Speicherinhalt vor und nach dem Link, Dialoge nach
200, 600 und 1 500 ms abgefragt).

**Fundstelle / Aufgabe:** Eigener Bogen „THW Eigenstadt Bergungsgruppe",
Einheit und „Einsatzort / Auftrag: Deich Nord" eingetragen, App offen. Dann
geht ein Bogen-Link (016 Bamberg) ein und wird im selben Tab geöffnet. Es
ändert sich nur das Fragment (`hashchange`). Code: `src/app/app.tsx`,
Listener `beiFragmentwechsel` (um Zeile 1677), weiter über `uebernehmeText` →
`uebernimmBogen` → `darfBogenErsetzen`.

**Beobachtung:**

| Weg | Rückfrage | Entwurf danach | Rückholplatz danach | Hinweis |
| --- | --- | --- | --- | --- |
| Link im laufenden Tab (`hashchange`) | keine | Bamberg | leer | keiner |
| Link als neuer Tab | keine (Kaltstart) | Bamberg | Eigenstadt | „Der empfangene Bogen hat deinen angefangenen Bogen aus dem Arbeitsplatz genommen …" |
| Tab geschlossen, dann Link | keine (Kaltstart) | Bamberg | Eigenstadt | wie oben |

Im ersten Fall steht sofort die Übersicht von Bamberg mit „Empfangen als: ✓
signiert" da. Die Startseite zeigt danach nur noch Bamberg unter
„Fortsetzen". „Zuletzt verdrängten Bogen zurückholen" gibt es nicht.
Eigenstadt ist aus dem Gerätespeicher verschwunden. Ein zweites Antippen
desselben Links ändert nichts mehr.

Der Code-Kommentar am Listener nennt genau diesen Weg den „Normalfall" auf dem
Telefon: Der Browser benutzt den vorhandenen Tab bzw. die laufende PWA weiter.

Technischer Hinweis für die Behebung, nicht Teil der Rollenbewertung: Der
Listener wird mit leeren Abhängigkeiten einmal registriert („der Handler nutzt
ausschließlich stabile Setter"). `darfBogenErsetzen` liest aber den Zustand
`bogen` aus dem ersten Render. War die App ohne Entwurf gestartet, ist das
`null`, also gilt „kein Inhalt": keine Frage, kein `merkeVerdraengt`. War sie
mit Entwurf gestartet, fragt sie nach dem alten Stand und legt diesen auf
den Rückholplatz, nicht den aktuellen. Der native Weg
(`bogenLinksEmpfangen`, gleich darunter) ist gleich gebaut. Dort ist es ein
Risiko, geprüft habe ich ihn nicht.

**Erwartung der Rolle:** Ich fülle meinen Bogen aus, ein Kamerad schickt mir
seinen Bogen per Messenger, ich tippe drauf. Entweder fragt die App, ob mein
Bogen weichen soll, oder er liegt wie beim frischen Start auf dem
Rückholplatz.

**Auswirkung im Einsatz:** Der eigene Bogen ist weg, ohne Meldung. Gemerkt
wird es erst am Meldekopf oder beim Übergeben, wenn plötzlich eine fremde
Einheit „mein Bogen" ist. Unter Zeitdruck wird dann womöglich der fremde
Bogen als eigener gezeigt. Gerade bei Meldekopf-Telefonen, die Links von
Einheiten bekommen, ist das kein Sonderfall.

**Empfehlung:** Ein eingehender Link muss sich verhalten wie ein Scan bei
offener App: Rückfrage mit dem Namen des eigenen Bogens oder mindestens der
Rückholplatz plus Hinweis, wie beim Kaltstart. Der Weg sollte gegen den
aktuellen Arbeitsstand prüfen, nicht gegen den beim Start.

**Nachprüfung:** App ohne Entwurf öffnen, eigenen Bogen anlegen und Einheit
eintragen, dann im selben Tab `location.hash` auf einen Bogen-Link setzen:
Rückfrage oder Rückholplatz mit dem *aktuellen* Stand. Dasselbe, wenn die
App mit einem älteren Entwurf gestartet und dieser vorher geändert wurde.

### R3-S2 [P1] Eigener Bogen nach einer Einsatz-Erfassung bleibt im Aufnahme-Kontext; „In Einsatz übernehmen" legt ihn in die fremde Sammlung (neu)

**Priorität:** P1

**Nachweis:** gemessen (Speicherinhalt, Screenshot).

**Fundstelle / Aufgabe:** Sammlung „Hochwasser Deich" → „Einheit manuell
erfassen…" → Name „Aalen" → „‹ Einsatz" (Unterbrechung) → „‹ Einsätze" →
unter „Meinen Bogen ausfüllen" „Neuen Bogen erstellen" → „Neu anfangen" →
Einheitstyp und Name „Eigenstadt". Code: `src/app/app.tsx`, Knopf „Neuen
Bogen erstellen" (um Zeile 2569) setzt Bogen und Schritt neu, die Ziel-Sammlung
(`sammelZielId`, Zeile 2721) aber nicht.

**Beobachtung:** Der leere Bogen öffnet mit Kopf „‹ Einsatz ‚Hochwasser
Deich'", Marke „Aufnahme für: Hochwasser Deich" und unten „In Einsatz
übernehmen". Im Speicher ist er als eigener Bogen markiert (nicht `fremd`).
Die Sammlung zeigt ihn als „Angefangene Erfassung für diesen Einsatz:
‚THW Eigenstadt Bergungsgruppe'". Ein Tipp auf „In Einsatz übernehmen" legt
Eigenstadt als fünfte Einheit in „Hochwasser Deich" („Zuletzt eingelesen:
‚THW Eigenstadt Bergungsgruppe' · jetzt 5 Einheiten"). Der Entwurf ist danach
leer, auf der Startseite steht kein eigener Bogen mehr. Wer stattdessen
„Einheit manuell erfassen…" tippt, bekommt die Rückfrage, den eigenen Bogen
zugunsten der neuen Einheit zu verdrängen. Dabei wird die dort liegende
Erfassung „THW Aalen" endgültig gelöscht. Der Dialog sagt das.

Nach dem Neuladen ist der Kontext richtig: Die Startseite zeigt Eigenstadt
als eigenen Bogen ohne „Aufnahme für".

**Erwartung der Rolle:** „Meinen Bogen ausfüllen → Neuen Bogen erstellen" ist
mein Bogen. Mit dem Meldekopf, an dem ich eben ausgeholfen habe, hat er nichts
zu tun.

**Auswirkung im Einsatz:** Die eigene Einheit steht als Meldung in einer
Sammlung, die womöglich gar nicht ihre ist, und zählt dort in der Stärke mit.
Der eigene Bogen fehlt auf der Startseite. Der Helfer sucht ihn oder fängt
neu an. Der größere Knopf in der Leiste („In Einsatz übernehmen") ist für
einen gestressten Nutzer die plausible Wahl, „Weiter →" daneben wirkt wie
ein Zwischenschritt.

**Empfehlung:** „Neuen Bogen erstellen" (und jeder andere Weg aus „Meinen
Bogen ausfüllen") beendet den Aufnahme-Kontext. Kopf, Marke und
„In Einsatz übernehmen" erscheinen nur bei einer als fremd markierten
Erfassung.

**Nachprüfung:** Ablauf wie oben: Der neue Bogen zeigt „‹ Startseite", keine
Marke „Aufnahme für", kein „In Einsatz übernehmen". Die Sammlung nennt ihn
nicht als angefangene Erfassung.

### R3-S3 [P2] Zweites Fenster überschreibt den Entwurf ohne Rückfrage; die Warnung im ersten Fenster steht außerhalb des Bilds (neu)

**Priorität:** P2

**Nachweis:** gemessen (zwei Tabs im selben Browser-Kontext, Speicherinhalt,
Lage der Warnung).

**Fundstelle / Aufgabe:** Tab B mit der Startseite offen (zum Beispiel ein
früher geöffneter Tab). In Tab A „Neuen Bogen erstellen", Name „TabA". Dann
in Tab B „Neuen Bogen erstellen", Name „TabB". Zurück in Tab A, Kürzel
„KZA" tippen. Code: `src/app/fenster-abgleich.tsx`, in Tab B
`darfBogenErsetzen` in `src/app/app.tsx`.

**Beobachtung:** Tab B zeigt den Entwurf von Tab A nicht an (kein
„Fortsetzen"), fragt beim Anlegen nichts und überschreibt `eeb.entwurf.v1`
mit TabB. Der Rückholplatz bleibt leer. Tab A erkennt den Konflikt und zeigt
„⚠ Dieser Bogen wurde in einem anderen Fenster geändert. Eingaben hier
werden erst wieder gespeichert, wenn du entscheidest." mit „Stand aus dem
anderen Fenster laden" und „Meine Fassung behalten". Die Warnung steht aber
oben auf der Seite. Beim Tippen im Kürzel-Feld (scrollY 555) liegt sie bei
−488 px, im Bild sind nur Felder und „Weiter →" (Screenshot `25b-A-sicht`).
„KZA" wird nicht gespeichert. Wird Tab A ohne Entscheidung geschlossen, ist
TabA verloren. Die Startseite in Tab B zeigt danach nur TabB.

Die Sammlung dagegen gleicht sich über Tabs ab: Ein Import in A erscheint in
B (4 → 5), ein Import in B in A (→ 6), keine Meldung geht verloren.

**Erwartung der Rolle:** Wenn ich etwas tippe und es nicht gespeichert wird,
muss ich das dort sehen, wo ich tippe. Ein anderer Tab darf meinen Bogen
nicht still wegwerfen.

**Auswirkung im Einsatz:** Wer einen Link in einem neuen Tab geöffnet und
später den alten Tab wiedergefunden hat, tippt dort weiter, ohne dass etwas
gespeichert wird. Der Verlust zeigt sich erst beim nächsten Öffnen.

**Empfehlung:** Die Konfliktwarnung fest am Bildrand oder an der Leiste
zeigen, solange nicht entschieden ist. Ein Tab, dessen Startseite den
gespeicherten Entwurf nicht kennt, sollte vor dem Anlegen den gespeicherten
Stand prüfen und ihn auf den Rückholplatz legen.

**Nachprüfung:** Ablauf wie oben: Die Warnung steht beim Tippen im Bild. Nach
dem Anlegen in Tab B liegt TabA auf dem Rückholplatz.

### R3-S4 [P2] Namensvorschläge liegen über der Aktionsleiste: Der Tipp auf „In Einsatz übernehmen" übernimmt einen Ortsverband statt der Einheit (neu)

**Priorität:** P2

**Nachweis:** gemessen (Element unter der Knopfmitte, Feldinhalte danach,
Screenshots `42-vor-tap`, `42-nach-tap`).

**Fundstelle / Aufgabe:** Einsatz-Erfassung, Schritt 1: Einheitstyp
„Bergungsgruppe", Name „Neustadt" getippt, dann sofort „In Einsatz
übernehmen". Code: Vorschlagsliste (`role="option"`) in
`src/app/schritte/bausteine.tsx`.

**Beobachtung:** Unter dem Namensfeld öffnet die Vorschlagsliste („Neustadt
ONST · 23730 Neustadt", „Neustadt an der Aisch" …). Sie überdeckt die untere
Leiste. An der Mitte von „In Einsatz übernehmen" liegt das erste
`li role="option"`. Der Tipp wählt diesen Vorschlag: Kürzel „ONST" und die
Kontaktdaten dieses Ortsverbands werden eingetragen. Bei „Ulm" kamen auch
die übergeordneten Ebenen dazu (RB Biberach, LV Baden-Württemberg mit
Telefon und E-Mail). Übernommen wird die Einheit nicht, die Erfassung bleibt
offen. Es braucht einen zweiten Tipp.

**Erwartung der Rolle:** Ich tippe auf den Knopf, den ich sehe. Eine Liste
über dem Knopf schließe ich nicht erst bewusst.

**Auswirkung im Einsatz:** Bei mehrdeutigen Namen (es gibt mehrere
„Neustadt") stehen Kürzel und Rückrufnummern eines anderen Ortsverbands im
Bogen, ohne dass der Helfer sie gewählt hat. Er bemerkt das nicht, weil
der Name stimmt. Dazu kommt ein Fehlversuch: Die Einheit scheint übernommen,
ist es aber nicht.

**Empfehlung:** Die Vorschlagsliste nicht über die feste Leiste legen (nach
oben öffnen oder Leiste darüber), oder ein Tipp außerhalb des Felds schließt
die Liste nur, ohne zu wählen. Ein gewählter Vorschlag, der weitere Felder
füllt, sollte das kurz sagen.

**Nachprüfung:** Name tippen, Liste offen, Tipp auf „In Einsatz übernehmen":
Die Einheit ist übernommen, Kürzel und Telefon sind leer.

### R3-S5 [P2] Doppeltipp auf „Abrücken": Der zweite Tipp trifft „Wieder anwesend" am selben Platz (neu)

**Priorität:** P2

**Nachweis:** gemessen (Status im Speicher nach zwei Tipps an derselben
Stelle).

**Fundstelle / Aufgabe:** Einsatzansicht → Karte „Nr. 1 THW Albstadt" →
„Aufklappen" → „Abrücken". Code: `src/app/einsaetze-ui.tsx`.

**Beobachtung:**

| Abstand der Tipps | Status danach | Quittung |
| --- | --- | --- |
| 150 ms | abgerückt | „… abgerückt 20:39 · Rückgängig" |
| 300 ms | abgerückt | wie oben |
| 600 ms | anwesend | „… wieder anwesend 20:40" |
| 1 000 ms | anwesend | „… wieder anwesend 20:40" |

Nach dem ersten Tipp steht „Wieder anwesend" genau dort, wo „Abrücken" war
(Screenshot `29-abruecken-2`). Die Quittung unten ist gut sichtbar und bleibt
stehen (nach 30 s noch da), sie meldet beim zweiten Tipp aber „wieder
anwesend". Die Einheit zählt weiter in der Stärke.

**Erwartung der Rolle:** Mit Handschuh tippe ich lieber zweimal, wenn ich
nicht sicher bin, ob der erste Tipp angekommen ist. Danach ist die Einheit
abgerückt.

**Auswirkung im Einsatz:** Die Einheit bleibt in der Lage, obwohl sie weg
ist. Die Stärke ist zu hoch, und wer nicht auf die Quittung schaut, merkt es
nicht. Der Rückweg ist da (dieselbe Taste noch einmal), aber nur, wenn man es
bemerkt.

**Empfehlung:** Nach dem Statuswechsel den Gegenknopf kurz sperren oder an
einen anderen Platz setzen. „Rückgängig" in der Quittung genügt als Rückweg.

**Nachprüfung:** Zwei Tipps im Abstand von 600 und 1 000 ms auf „Abrücken":
Die Einheit ist danach abgerückt.

### R3-S6 [P2] Nach einer Unterbrechung wird die Uhrzeit des Übernehmens zur Eintreffzeit (neu)

**Priorität:** P2

**Nachweis:** gemessen (Uhr im Browser um 25 Minuten vorgestellt).

**Fundstelle / Aufgabe:** „Einheit manuell erfassen…" um 12:00 Uhr,
Einheitstyp und Name „Ulm" eingetragen, „Eingetroffen um (vom Meldeblock)"
leer gelassen. 25 Minuten Unterbrechung, dann „In Einsatz übernehmen". Code:
`src/app/nacherfassung.tsx` (Feld und Erklärtext).

**Beobachtung:** Gespeichert ist „eingetroffen 12:25". Der Erklärtext unter
dem Feld sagt das so: „Leer lassen, wenn die Einheit gerade eintrifft — dann
gilt die Uhrzeit von ‚In Einsatz übernehmen'." Beim Zurückkehren nach der
Pause zeigt die Erfassung keinen Hinweis, dass seit dem Beginn Zeit vergangen
ist. Das Feld bleibt leer.

**Erwartung der Rolle:** Die Einheit kam um 12:00, als ich angefangen habe.
Dass ich zwischendurch weg war, soll die Zeit nicht verschieben.

**Auswirkung im Einsatz:** Eintreffzeit und daraus abgeleitete Angaben
(Ruhezeit, Nachweis, Sortierung „neueste zuerst") sind um die Dauer der
Unterbrechung verschoben. Gemerkt wird das nur, wenn jemand den Meldeblock
gegenliest.

**Empfehlung:** Den Beginn der Erfassung als Vorschlag für die Eintreffzeit
merken. Liegt beim Übernehmen deutlich Zeit dazwischen (etwa über 5 Minuten),
kurz fragen: „Eingetroffen 12:00 (Beginn der Erfassung) oder jetzt 12:25?"

**Nachprüfung:** Erfassung beginnen, 25 Minuten warten, übernehmen: Die
Eintreffzeit ist 12:00 oder wird ausdrücklich abgefragt.

### R3-S7 [P3] Kleinere Stellen beim Wiedereinstieg (neu)

**Priorität:** P3

**Nachweis:** gemessen bzw. beobachtet.

**Beobachtung:**

- **Quittung am Bildrand:** Nach „In Einsatz übernehmen" bleibt die Ansicht
  oben (gut), „Zuletzt eingelesen: ‚THW Ulm' · jetzt 5 Einheiten, Gesamt 40"
  beginnt aber bei 636 px, also an der Unterkante des 640-px-Bilds, unter
  den drei Aufnahme-Knöpfen. Im ersten Bild sieht man die geänderte Summe,
  den Namen nicht.
- **Angefangene Erfassung in der Sammlung:** Der Hinweis „Angefangene
  Erfassung für diesen Einsatz: … Weiter erfassen" steht bei 2 672 px. Es
  fällt nicht ins Gewicht, weil „Einheit manuell erfassen…" sie mit
  „Diese Erfassung fortsetzen" zuerst anbietet.
- **Neuladen in der Einsatz-Erfassung** führt zur Startseite mit der Karte
  „Angefangene Erfassung für ‚Hochwasser Deich'", nicht direkt zurück in die
  Erfassung. Das kostet einen Tipp, die Karte ist klar beschriftet.

**Empfehlung:** Die Quittung über die Aufnahme-Knöpfe oder in die Summenleiste
setzen. Den Hinweis auf die angefangene Erfassung neben „Einheit manuell
erfassen…" zeigen.

**Nachprüfung:** 360 × 640, Einheit übernehmen: Name und neue Summe stehen
ohne Scrollen im Bild.

## Bestätigt aus anderen Runde-3-Berichten

Unabhängig nachgestellt, hier nicht mitgezählt:

- **R3-L1 [P2] Rückmeldung nach „Bögen einlesen…" außerhalb des Bilds.**
  Dieselbe Datei ein zweites Mal eingelesen: „0 Bögen aufgenommen, 1 bereits
  vorhanden." steht bei 2 807 px (Seite 4 049 px hoch). Oben ändert sich
  nichts, auch „Zuletzt aufgenommen (4)" bleibt stehen. Aus Stresssicht:
  Man weiß nicht, ob der Tipp gewirkt hat, und liest die Datei ein drittes
  Mal ein.
- **R3-H1 [P1] Einstieg mitten im Formular.** Auch in der Einsatz-Erfassung
  steht das Bild beim Tippen auf den Namen bei Schritt 1 unten. Kopf und
  Marke „Aufnahme für" liegen außerhalb, was R3-S2 zusätzlich verdeckt.

## Bestätigtes

- **Sicherung beim Tippen:** „Kowalski" tippen und ohne Verlassen des Felds
  neu laden: Der Entwurf steht mit „Jan Kowalski" auf der Startseite,
  „Fortsetzen" führt zurück auf „3. Personal".
- **Browser-Zurück und -Vor** gehen im Assistenten einen Schritt, die
  Adresse bleibt, die App wird nicht verlassen.
- **„Verwerfen" fragt nach** („Angefangenen Bogen verwerfen? … bleibt auf der
  Startseite unter ‚Zuletzt verdrängten Bogen zurückholen' erreichbar") mit
  rotem Knopf und „Abbrechen" darunter.
- **Drei abgebrochene Einsatz-Erfassungen** (Aalen, Bruchsal, Calw) mit
  eigenem Entwurf Ulm: Ulm bleibt auf dem Rückholplatz. Jede Rückfrage sagt,
  dass nur die fremde Erfassung verworfen wird. Wird doch einmal eine
  Erfassung endgültig gelöscht, sagt der Dialog es mit Namen und Uhrzeit.
- **Link als Kaltstart** (neuer Tab, geschlossener Tab): Der eigene Bogen
  kommt auf den Rückholplatz, die Übersicht sagt es oben.
- **Doppeltipp auf „In Einsatz übernehmen"** (120 ms): eine Meldung, keine
  zwei.
- **Schnellerfassung:** Von der Startseite fragt sie zuerst nach der Sammlung
  („Für ‚Hochwasser Deich'"). „Nur Stärke" ist vorgewählt. Nach dem
  Übernehmen ist kein Entwurf offen, und die nächste Einheit über die
  Sammlung startet ebenfalls mit „Nur Stärke".
- **Nach dem Übernehmen** bleibt die Einsatzansicht oben. Summe und
  „Bogen scannen…" (bei rund 490 px) stehen im ersten Bild.
- **Alter Bogen:** Die Übersicht meldet „Einsatzzeitraum 03.10.2026 ist
  vorbei — gilt dieser Bogen noch …?" als offenen Punkt. „Bogen übergeben…"
  bietet zuerst „Für neuen Einsatz vorbereiten". Danach stehen Zeitraum heute,
  Ort/Auftrag leer und der Hinweis „Personal und Fahrzeuge sind geblieben".
- **Abrück-Quittung** steht unten fest im Bild, mit „Rückgängig" und „×",
  und bleibt mindestens 30 s.
- **Sammlung in zwei Tabs** gleicht sich ab, ohne Meldungen zu verlieren.
- **Scanner ohne Kamera** öffnet direkt „Ohne Kamera: mit dem USB-Handscanner
  scannen … Bereit — warte auf den Handscanner" mit „Kamera erneut versuchen",
  „QR aus Bild einlesen…" und „Fertig".

## Abschluss

- **Aufgabe geschafft:** eigener Bogen mit Unterbrechungen: ja. Meldekopf
  mit Unterbrechungen: ja. Eigener Bogen und eingehender Link bei offener
  App: nein, der eigene Bogen ging verloren (R3-S1). Eigener Bogen nach
  Meldekopf-Aushilfe: mit Umwegen, der Bogen landet mit einem plausiblen Tipp
  in der Sammlung (R3-S2).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Neuen Bogen erstellen" unter „Meinen Bogen
  ausfüllen" erzeugt nach einer Einsatz-Erfassung eine Aufnahme für den
  Meldekopf (R3-S2).
- **Größtes Einsatzrisiko:** Ein angetippter Bogen-Link ersetzt den eigenen
  Bogen still und endgültig (R3-S1).
- **Top-Priorität für die nächste Iteration:** Eingehende Links gegen den
  aktuellen Arbeitsstand prüfen, mit Rückfrage oder Rückholplatz wie beim
  Kaltstart (R3-S1).

## Abgleich mit Runde 2

Grundlage: [../runde-2/stress-und-unterbrechung.md](../runde-2/stress-und-unterbrechung.md)
und [../runde-2/README.md → Stand der Behebung](../runde-2/README.md#stand-der-behebung).

| Runde-2-Befund | Stand laut Tabelle | Bewertung Runde 3 | Beobachtung |
| --- | --- | --- | --- |
| R2-S1 Alter Entwurf als „plausibel" (P1) | behoben | hält | Startseitenkarte nennt „Einsatz 18.07.2026 – 19.07.2026". Die Übersicht führt den abgelaufenen Zeitraum als offenen Punkt statt „✓ plausibel", auch für gestern. Der Übergabe-Dialog nennt „Dieser Bogen gehört zum Einsatz …" und bietet „Für neuen Einsatz vorbereiten" zuerst. QR-Vollbild ohne Einheit und Stand ist laut Tabelle offen (R2-O7), hier nicht erneut geprüft. |
| R2-S2 Schneller und richtiger Weg (P2) | behoben | hält | Schnellerfassung fragt nach der Sammlung, „Nur Stärke" vorgewählt, nach dem Übernehmen kein offener Entwurf. Die nächste Einheit aus der Sammlung startet ebenfalls mit „Nur Stärke". |
| R2-S3 Aufnahme-Knöpfe unter dem ersten Bild (P2) | behoben | hält (Rest in R3-S7) | Knöpfe direkt unter der Stärkeleiste, nach dem Übernehmen bleibt die Ansicht oben. Die Quittung mit Namen beginnt bei 636 px am Bildrand (R3-S7). |
| R2-S4 Wer kam zuletzt (P3) | behoben | hält | „Zuletzt aufgenommen (4): THW Albstadt …, THW Biberach/Riß …, THW Crailsheim …, THW Karlsruhe …" mit „Neueste oben zeigen". Nach einem Duplikat bleibt die Zeile aber unverändert stehen, die eigentliche Quittung liegt außerhalb des Bilds (R3-L1). |
| R2-N1 / R2-E1 Eigener Bogen geht bei fremder Aufnahme verloren (P0, dort bestätigt) | behoben | hält für die Meldekopf-Wege, neuer Verlustweg | Drei abgebrochene Erfassungen und Schnellerfassung: Ulm bleibt auf dem Rückholplatz. Neu: Ein Link bei offener App ersetzt den eigenen Bogen ohne Rückholung (R3-S1), und ein danach angelegter eigener Bogen erbt den Aufnahme-Kontext (R3-S2). |
| R2-E3 Neuladen in der Einsatz-Erfassung (P2, dort bestätigt) | behoben | hält | Startseite zeigt „Angefangene Erfassung für ‚Hochwasser Deich'". „Fortsetzen" führt zurück mit „Aufnahme für" und „In Einsatz übernehmen". |
| R2-H4 Rückgängig beim Abrücken außerhalb des Bilds (P2, dort bestätigt) | behoben | hält, mit neuer Nebenwirkung | Quittung mit „Rückgängig" fest unten im Bild, 30 s stehen geblieben. Der Gegenknopf „Wieder anwesend" am selben Platz macht einen langsamen Doppeltipp rückgängig (R3-S5). |

Bilanz: Alle vier eigenen Runde-2-Befunde (R2-S1 bis R2-S4) halten, R2-S3
und R2-S4 mit kleinen Resten. Die drei dort bestätigten Fremdbefunde halten
ebenfalls. Was neu auftaucht, kommt von außen in die App: ein Link, ein
zweiter Tab, ein Rollenwechsel auf demselben Telefon. R3-S1 bis R3-S7 sind
neu. R3-L1 und R3-H1 stehen schon in anderen Runde-3-Berichten und sind hier
nicht mitgezählt.
