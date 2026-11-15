# Audit „Stress und Unterbrechung", Runde 17 (Zeitdruck, Ablenkung, Wiedereinstieg)

**Prüfer:** Rollenaudit `thw-stress-test-user` · **Datum:** 2026-10-27 ·
**Zählung:** P0: 0 · P1: 0 · P2: 1 · P3: 11 (insgesamt 12 Befunde, davon 4 mit
Verweis auf ältere, weiter offene oder teilweise behobene Befunde)

Prüfgegenstand: Web-App, laufender Produktionsbuild unter
`http://localhost:4173`, Code-Stand Commit `be6b396` (`main`). Reiner
Prüfbericht, keine Codeänderung; es wurde kein Prozess beendet.

## Prüfaufbau

Playwright (globales Modul unter `/opt/node22/lib/node_modules/playwright`,
`chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE,
Dichte 2, Viewports 390 × 844 und 360 × 640 (je neuer Browser-Kontext), dazu
640 × 360 für den Dialogtest im Querformat. Tipps mit `touchscreen.tap`
(Doppeltipps mit 60 bis 1 600 ms Abstand), Unterbrechung mit `reload()`
(100 ms bis 3 s nach der letzten Eingabe), Zurück-Geste mit `goBack()`,
verstellte Uhr mit der Playwright-Uhr (45 Min und 3 h 45 Min). Zustände über die
Oberfläche („Neue Einsatz-Sammlung…", „Bögen einlesen…" mit 5, 6, 12, 30 und 40
Übungsbögen aus `examples/thw/`, „Einheit manuell erfassen…", „Einheit
schnell erfassen (nur Stärke)…", „Neuen Bogen erstellen", „Namen einfügen…",
Fremddateien: `.txt`, fremdes `.json`, Zufallsbytes, kaputtes und leeres
`.png`). Skripte im Scratchpad unter `.../scratchpad/s17/`.

Gelesen: `docs/audits/README.md` und die Abschnitte „Stand der Behebung" von
`runde-16/README.md` bis `runde-11/README.md` sowie den Bericht
`runde-16/stress-und-unterbrechung.md`. Ab dieser Runde gibt es keine
„bekannten Grenzen" mehr: Was im Browser noch zu beobachten war, steht unten,
auch wenn es dort als „teilweise" oder „offen" geführt ist (mit der alten ID
als Verweis).

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert; *Risiko* =
abgeleitet, nicht nachgestellt.

**Nicht geprüft:** echte Kamera (Scanner), Lärm, Handschuhe, echte
Bildschirmtastatur (Zeitwähler des Telefons bei „Eingetroffen um"), WebKit,
native Builds, Zwei-Geräte-Abgleich, Teilen-Menü des Betriebssystems, große
Systemschrift.

## Urteil

Unter Stress und Unterbrechung bleibt die App sehr belastbar. Einsatz anlegen,
Einheit von Hand und in der Schnellerfassung aufnehmen, 40 Bögen einlesen,
abrücken, Stärke korrigieren, Fremddateien und Neuladen mitten im Tippen
gelingen ohne fremde Hilfe; keine Eingabe ging verloren, die ein Mensch in
realer Geschwindigkeit getippt hat (Neuladen 100 ms nach der Ziffer: Wert und
Schritt kommen zurück). Die Reibung steckt in der Rückfrage „Nur Sollplätze,
keine gemeldete Stärke" (ein Versprechen im Text, das der Bildschirm nicht
einlöst, P2) und in elf kleinen P3-Stellen, an denen ein Helfer im Stehen eine
plausible, aber falsche Aktion wählt oder die App sich anders verhält, als er
nach der letzten Aktion erwartet.

### Behebungen aus Runde 16, im echten Browser geprüft

- **R16-S1** (Zahlenfelder markieren beim Antippen nicht) *gemessen, hält:* In
  „Stärke ändern…" und in Schritt 3 „Nur Stärke" markiert der Tipp in
  Führer, Unterführer und Mannschaft den ganzen Wert (Auswahl 0 bis 1); die
  Ziffer „3" ersetzt, statt anzuhängen (0, 2, 7 jeweils → 3 bzw. 6).
- **R16-S2** (Wortlaut Soll / „nicht gezählt", Reiter 3) *gemessen, teilweise:*
  Schritt 3 und Rückfrage sagen jetzt gleich „Sollwert, nicht gemeldet —
  erscheint in der Summe"; der Reiter 3 steht auf „offen". Der Rest steht in
  R17-S1.
- **R16-S3** („Zahlen stimmen, so gezählt" ohne „Rückgängig") *gemessen, hält
  nicht:* siehe R17-S1.
- **Weiter in Ordnung (gemessen):**
  - Stapelimport mit Neuladen: 40 Dateien, Neuladen nach 150 ms → „Import
    unterbrochen: 40 Dateien waren gewählt, 15 Meldungen kamen an …"; nach
    600 ms 39 von 40 mit demselben Hinweis; nach 3 s alle 40, kein Hinweis.
  - Doppeltipp auf „Einsatz anlegen" (60, 250, 700 ms), auf „Zahlen stimmen,
    so gezählt" und auf „Abrücken" (120 ms): je eine Einheit, ein Einsatz; die
    Beschriftung „✓ Abgerückt" fängt den zweiten Tipp ab.
  - Neuladen im Assistenten, im Einsatz, mit offenem Dialog und mitten im
    Eintippen einer Auftragsnotiz: Schritt, Zahl und Notiz kommen zurück; der
    Entwurf steht auf der Startseite mit „Fortsetzen / Verwerfen"; „Verwerfen"
    fragt nach und nennt „Zuletzt geschlossenen Bogen zurückholen".
  - „Person entfernen" bei einer Person mit Namen fragt nach und nennt
    „Rückgängig"; „Ort eintragen…" (Einsatz bearbeiten) quittiert mit
    „Rückgängig".
  - Fremddateien: eigene deutsche Meldung je Fall („stammt nicht aus dieser
    App", „lässt sich nicht als Bild öffnen", „Kein QR-Code im Bild gefunden").
  - Sammel-PDF mit 30 bis 40 Bögen: Hinweis „etwa 45 Sekunden oder länger.
    Nicht noch einmal tippen", Datei nach 7 bis 11 s, Quittung im Bild.
  - Querformat 640 × 360: beide Rückfragen der Schnellerfassung zeigen alle
    Knöpfe ohne inneren Bildlauf (Dialog 328 von 360 px).
  - Zurück-Geste im Assistenten: 4 → 3 → 1 → Einsatz → Startseite, ohne
    Datenverlust; Auftragsnotiz bleibt nach Neuladen auf der Karte, die
    Bildlaufstelle bleibt (2 667 px).

## Befunde

### R17-S1 [P2] „Zahlen stimmen, so gezählt": Rückfrage verspricht „Rückgängig", im Bild gibt es keines; Quittung und Kopfzeile sagen bei Soll und gezählt dasselbe

**Neu oder alt (Verweis):** alt — wie R16-S3, weiter offen; Rest von R16-S2.

**Kennzeichnung:** gemessen (Skripte `j.js`, `k.js`, `so.js`, 390 × 844;
Abstand auch bei 640 × 360).

**Fundstelle / Aufgabe:** Einsatz → „Einheit manuell erfassen…" → Ort,
Einheitstyp „Bergungsgruppe" → Schritt 3 → „Nur Stärke" → „Nur Stärke melden" →
„In Einsatz übernehmen" → Rückfrage „Nur Sollplätze, keine gemeldete Stärke".

**Beobachtung:** Der Text unter „Zahlen stimmen, so gezählt" lautet: „Die Einheit
hat genau diese Stärke gemeldet; … „Rückgängig" führt sie danach wieder als
Sollstärke." Nach dem Tipp steht im Einsatz die Quittung „Zuletzt abgelegt:
„THW Husum Bergungsgruppe" · jetzt 1 Einheit, Gesamt 9. In der Liste zeigen" — ohne
Knopf „Rückgängig"; im ganzen Dokument kommt das Wort nicht vor. Die Quittung ist
Wort für Wort dieselbe wie nach „Als Sollstärke ablegen". Die Karte trägt dann
„Stärke 0 / 2 / 7 / 9" ohne Marke (bei „Als Sollstärke ablegen" steht dort
„Sollstärke, nicht gemeldet"). Bei „Als Sollstärke ablegen" steht über der Liste
„Einheiten (1 gemeldet · 1 zählend)", obwohl der Satz darüber „nicht gemeldet"
sagt. Die drei Knöpfe der Rückfrage sind je 44 px hoch mit 12 px Abstand
(Oberkanten 527, 583, 639 px).

**Erwartung der Rolle:** Was der Dialog verspricht, finde ich nach dem Tipp
vor. „Nicht gemeldet" und „1 gemeldet" widersprechen sich nicht.

**Folge im Einsatz:** Wer 12 px neben der Hauptaktion trifft und sich auf den
Satz im Dialog verlässt, sucht vergeblich nach „Rückgängig". Die Lage führt
9 Personen als gemeldete Stärke, die niemand gezählt hat; ohne Marke an der
Karte bleibt das unsichtbar. Korrektur ist nur über „Stärke ändern…" möglich,
setzt voraus, dass jemand den Fehler bemerkt.

**Empfehlung:** Nach „Zahlen stimmen, so gezählt" eine Quittung mit
„Rückgängig" zeigen (wie bei Abrücken, Zug, Auftrag) oder den Dialogsatz
streichen; die Quittung nach beiden Wegen unterschiedlich benennen („als
gezählt abgelegt" / „als Sollstärke abgelegt"); die Zeile „Einheiten (…
gemeldet · … zählend)" für Sollstärke-Einheiten nicht als „gemeldet" führen;
die riskantere Antwort räumlich von der Hauptaktion trennen.

**Nachprüfung:** „Zahlen stimmen, so gezählt" antippen: Quittung mit
„Rückgängig", Tipp darauf → Karte „Sollstärke, nicht gemeldet". Bei
„Als Sollstärke ablegen" steht „1 Einheit nur Sollstärke" statt „1 gemeldet".

### R17-S2 [P3] Zurück-Geste nach dem Neuladen im Einsatz verlässt die App statt zur Startseite zu führen

**Neu oder alt (Verweis):** neu (verwandt mit R11-E8, dort die Gegenrichtung: Startseite schluckt Zurück-Gesten).

**Kennzeichnung:** gemessen (Skripte `r.js`, `s.js`, `s2.js`, 390 × 844).

**Fundstelle / Aufgabe:** Startseite → „Neue Einsatz-Sammlung…" → Einsatz offen
→ Neuladen (Unterbrechung, App im Hintergrund beendet) → Zurück-Geste.

**Beobachtung:** Ohne Neuladen führt Zurück aus dem Einsatz auf die Startseite.
Nach dem Neuladen (Verlauf `history.length` 3, Zustand des Einsatzes vorhanden)
führt dieselbe Geste direkt nach `about:blank`, also aus der App heraus; die
Startseite wird übersprungen. Das Protokoll zeigt: popstate auf den Eintrag der
Startseite aus dem früheren Lauf, danach ruft die App selbst `history.back()` auf.
Gleiches nach Neuladen im Assistenten (Zurück 1 und 2 beide `about:blank`).

**Erwartung der Rolle:** Zurück heißt immer „einen Schritt zurück", auch wenn
ich zwischendurch unterbrochen war.

**Folge im Einsatz:** Wer nach einer Unterbrechung zur Startseite zurück will,
fliegt aus der App; beim erneuten Öffnen kommt der Einsatz wieder (Daten sind
da), kostet aber einen Umweg und irritiert.

**Empfehlung:** Nach dem Neuladen den Eintrag der Startseite im Verlauf
behandeln wie einen aus dem laufenden Lauf, sodass Zurück die Startseite zeigt.

**Nachprüfung:** Einsatz anlegen, Neuladen, Zurück-Geste: Die Startseite
erscheint; erst die zweite Geste verlässt die App.

### R17-S3 [P3] „Einheit manuell erfassen…" öffnet im Einsatz dauerhaft als Schnellerfassung, sobald eine Einheit „nur Stärke" erfasst wurde

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (Skripte `z0.js`, `z1.js`, `z2.js`, `sk.js`, 390 × 844).

**Fundstelle / Aufgabe:** Einsatz, erste Einheit über „Nur Stärke melden"
erfasst, dann „Einheit manuell erfassen… von Hand, ohne Bogen" für die nächste.

**Beobachtung:** Der Assistent trägt die Marke „Schnellerfassung", die Reiter
2 und 5 stehen auf „–", „Nur Stärke" ist vorgewählt, im Schritt 3 ist die
Sollstärke nicht vorbelegt (0 / 0 / 0 / 0, „Stärke ist 0"), obwohl der
Einheitstyp „Bergungsgruppe" lautet (bei der ersten Einheit: 0 / 2 / 7 / 9 und
9 Personenkarten). Der Zustand gilt je Einsatz, hält nach Neuladen und
Neustart der Startseite und nach Wechsel auf „Personal vollständig erfassen"
(Soll bleibt leer); ein zweiter Einsatz startet wieder normal. Der Knopf selbst
heißt unverändert „Einheit manuell erfassen…", der Knopf daneben
„Einheit schnell erfassen (nur Stärke)…".

**Erwartung der Rolle:** Zwei Knöpfe, zwei Wege. Der „manuelle" Knopf öffnet
immer das gleiche, vollständige Formular.

**Folge im Einsatz:** Wer die zweite Einheit ausführlich erfassen will, merkt
erst in Schritt 3 oder an den „–"-Reitern, dass die Vorbelegung fehlt und
Einsatzdaten übersprungen werden; unter Zeitdruck wird dann ein Bogen mit
Stärke 0 abgelegt oder die Einheit unvollständig gemeldet.

**Empfehlung:** Jeden der beiden Knöpfe immer im eigenen Modus öffnen, oder
den gemerkten Modus am Knopf benennen.

**Nachprüfung:** Einheit „nur Stärke" erfassen, dann „Einheit manuell
erfassen…": Der Assistent zeigt keine Marke „Schnellerfassung", Reiter 2 und 5
sind offen, die Sollstärke ist vorbelegt.

### R17-S4 [P3] „Ort eintragen…" öffnet das Fenster mit markiertem Einsatznamen; der getippte Ort ersetzt den Namen

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (Skripte `ko.js`, `ko2.js`, 390 × 844).

**Fundstelle / Aufgabe:** Einsatzkopf → Knopf „Ort eintragen…" → Fenster
„Einsatz bearbeiten" (Felder Name, Ort, Auftrag).

**Beobachtung:** Fokus liegt im Feld „Name" (Wert „Hochwasser Test", Auswahl 0
bis 15). Tippen von „Flensburg" und Eingabetaste macht „Flensburg" zum
Einsatznamen; der Kopf zeigt weiter „Ort eintragen…". Die Quittung „Einsatz
geändert: „Flensburg"" mit „Rückgängig" erscheint, nennt aber nur den neuen Namen,
nicht den alten.

**Erwartung der Rolle:** Nach „Ort eintragen…" schreibe ich in das Feld „Ort".

**Folge im Einsatz:** Der Einsatz verliert still seinen Namen, Lageblatt und
Sammel-PDF tragen den Ort als Titel. Korrigierbar über „Rückgängig", das nur
15 s als Leiste, danach über „Ort eintragen…" bzw. Historie erreichbar ist.

**Empfehlung:** Der Knopf setzt den Fokus in das Feld, das er nennt („Ort"),
und die Quittung nennt Alt und Neu („Name: Hochwasser Test → Flensburg").

**Nachprüfung:** „Ort eintragen…" antippen, „Flensburg" tippen, Eingabetaste:
Der Kopf zeigt den alten Namen, darunter den Ort.

### R17-S5 [P3] Personenzeile: ▲, ▼, ⇑ und ✕ liegen 4 bis 6 px auseinander; „⇑" ändert still die Ansprechperson

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** Abstand gemessen (Skript `px.js`, 360 × 640); Wirkung
gemessen (`up.js`); Fehltipp Risiko.

**Fundstelle / Aufgabe:** Assistent Schritt 3, „Personal vollständig erfassen",
Ansicht „Kurz-Liste (Tabelle)".

**Beobachtung:** Die vier Knöpfe sind je 44 × 44 px, die Ränder liegen bei
137–181, 185–229, 233–277 und 283–327 px (Abstände 4, 4 und 6 px). „✕"
(Person entfernen) schließt sich mit 6 px an „⇑" an. „⇑" an Person 3 setzt sie
ohne Hinweis an Platz 1; dort gilt sie nach dem Satz über der Liste als
Ansprechperson für Rückfragen. Im Bild erscheint kein Hinweis, dass sich die
Ansprechperson geändert hat. „✕" ist bei einer Person mit Namen durch eine
Rückfrage gesichert (hält).

**Erwartung der Rolle:** Vier Knöpfe in einer Reihe mit Handschuhabstand;
eine Änderung der Ansprechperson sieht man.

**Folge im Einsatz:** Ein Tipp neben „▼" verschiebt eine Person; wer die Liste
von oben nach unten einträgt, ändert beiläufig, an wen die Gegenstelle ihre
Rückfragen richtet.

**Empfehlung:** Mindestens 8 px zwischen den Knöpfen; einen kurzen Hinweis
(„Ansprechperson jetzt: Meier") nach „⇑" oder bei jeder Änderung an Platz 1.

**Nachprüfung:** Bei 360 × 640 die Knopfränder messen (≥ 8 px); „⇑" an
Person 3 antippen: Hinweis zur Ansprechperson.

### R17-S6 [P3] Das Feld „Dienststelle" der Kurz-Liste ist bei 360 px ein leeres, unbeschriftetes Kästchen von 42 px Breite

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (Skripte `sm.js`, `pt.js`, 360 × 640 und 390 × 844).

**Fundstelle / Aufgabe:** Assistent Schritt 3, Kurz-Liste (Tabelle), je
Person, unter „Zählt als / Geschlecht".

**Beobachtung:** Das Feld ist 42 px breit (bei 390 px: 47 px) und 44 px hoch,
zeigt keine sichtbare Beschriftung; der Platzhalter („Husum", die
Dienststelle der Einheit) ist im Bild nicht zu lesen, das Kästchen erscheint
leer. Je Person eins, neun Stück untereinander bei der Sollbelegung. Nur das
Bedienelement trägt den Namen „Person 1: Dienststelle".

**Erwartung der Rolle:** Ein Feld hat eine Beschriftung und passt seinen
Inhalt hinein.

**Folge im Einsatz:** Neun leere Kästchen ohne Sinn erhöhen den Bildlauf um
rund eine Bildschirmhöhe und laden zu Fehleingaben ein (ein Wort passt nicht
hinein); wer es ausfüllt, sieht nicht, was er eingetragen hat.

**Empfehlung:** Beschriftung „Dienststelle (wie Einheit)" und mindestens so
breit, dass „OV Husum" lesbar ist, oder das Feld erst auf Wunsch aufklappen.

**Nachprüfung:** Bei 360 × 640 Schritt 3 öffnen: Jedes Kästchen trägt eine
sichtbare Beschriftung und fasst „OV Husum".

### R17-S7 [P3] „Namen einfügen…": Zeile „Lisa Meier, Fahrer" wird zu Nachname „Lisa Meier"; „Hans Meier GrFü" landet auf Platz 2 „TrFü"

**Neu oder alt (Verweis):** alt — wie R16-E1, weiter teilweise.

**Kennzeichnung:** gemessen (Skript `ni.js`, 390 × 844).

**Fundstelle / Aufgabe:** Schritt 3 → „Namen einfügen…" → fünf Zeilen
(„Anna Maria Schmidt", „Hans Meier GrFü", „Peter Müller<Tab>TrFü",
„Müller, Karl; Helfer", „Lisa Meier, Fahrer") → „5 Personen übernehmen".

**Beobachtung:** Die Vorschau erkennt „Reihenfolge prüfen" bei „Hans Meier GrFü"
und „Lisa Meier, Fahrer", die Schaltfläche „5 Personen übernehmen" bleibt voll
aktiv. Ergebnis: Vorname „Fahrer", Nachname „Lisa Meier". Die Zeile „Anna Maria
Schmidt" erhält keine Prüfmarke und wird zu „Schmidt, Anna Maria". Person 1
(ohne Funktion) bekommt Platz 1 „GrFü", Hans Meier mit Funktion „GrFü" Platz 2
„TrFü".

**Erwartung der Rolle:** Eine kopierte Zeile „Vorname Nachname, Funktion"
ergibt Vorname, Nachname und Funktion; die Funktion, die ich hinschreibe,
gilt.

**Folge im Einsatz:** Die Namensliste vom Zettel, im Stehen eingefügt, trägt
vertauschte Namen („Fahrer" als Vorname) und falsche Stellen ein; die Marke
in der Vorschau liest man unter Zeitdruck nicht.

**Empfehlung:** Bei „Vorname Nachname, Funktion" die Funktion nach dem Komma
erkennen (bekannte Funktionswörter), geratene Zeilen vor dem Übernehmen
bestätigen lassen, die Funktion der Zeile für die Stelle verwenden.

**Nachprüfung:** Die fünf Zeilen einfügen: „Lisa Meier" steht als Vorname und
Nachname, „Fahrer" als Funktion; „Hans Meier GrFü" erhält Platz 1.

### R17-S8 [P3] Die Quittung „Zuletzt abgelegt … jetzt 1 Einheit" bleibt über Stunden stehen, ohne Uhrzeit

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (Skript `y.js` mit verstellter Uhr, 390 × 844).

**Fundstelle / Aufgabe:** Einsatz, nach „Zahlen stimmen, so gezählt" oder
„Als Sollstärke ablegen"; Rückkehr nach einer Unterbrechung von 45 Min und
3 h 45 Min.

**Beobachtung:** Nach 3 h 45 Min steht über der Liste unverändert „Zuletzt
abgelegt: „THW Husum Bergungsgruppe" · jetzt 1 Einheit, Gesamt 9. In der Liste
zeigen" (ohne Zeit). Die Kopfzeile dagegen zählt mit („letzte Meldung ⚠ … vor
3 Std 47 Min").

**Erwartung der Rolle:** Eine Quittung, die „jetzt" sagt, ist von jetzt.

**Folge im Einsatz:** Wer nach langer Pause zurückkommt, liest „jetzt Gesamt 9"
als aktuellen Stand und nimmt nach einer Stunde Pause eine alte Zahl für neu.

**Empfehlung:** Die Quittung nach kurzer Zeit ausblenden oder mit Uhrzeit
(„18:23") führen und „jetzt" streichen.

**Nachprüfung:** Einheit ablegen, Uhr 45 Min weiter: Die Leiste ist weg oder
trägt „18:23" statt „jetzt".

### R17-S9 [P3] Startseite nach Neuladen: der laufende Einsatz steht unter „Meinen Bogen ausfüllen"

**Neu oder alt (Verweis):** alt — wie R11-S4, weiter offen.

**Kennzeichnung:** gemessen (Skripte `st.js`, `st2.js`).

**Fundstelle / Aufgabe:** Einsatz anlegen, eine Einheit ablegen, „Startseite",
Neuladen.

**Beobachtung:** Die erste Bildschirmseite bei 360 × 640 zeigt die Hinweiszeile
„Funktioniert komplett offline" und den Block „Meinen Bogen ausfüllen" (Neuen
Bogen erstellen, QR-Code scannen…, Aus Datei laden…, Leeren Vordruck). „„Hochwasser
Süd" öffnen · 1 Einheit anwesend" steht bei y = 743 px (Viewport 640), bei
390 × 844 bei 811 px, unter dem Block für den eigenen Bogen. Ein angefangener
Bogen dagegen steht ganz oben (R16 hält).

**Erwartung der Rolle:** Das, womit ich gerade arbeite, steht oben.

**Folge im Einsatz:** Wer den Meldekopf bedient und nach einer Unterbrechung
auf der Startseite landet, tippt zuerst in den falschen Block („Neuen Bogen
erstellen") oder sucht den Einsatz.

**Empfehlung:** Einen offenen Einsatz mit „öffnen" und Zahl der Einheiten
oberhalb der Blöcke zeigen.

**Nachprüfung:** Neuladen auf der Startseite mit offenem Einsatz: Die Zeile
steht auf der ersten Bildschirmseite.

### R17-S10 [P3] Neuladen schließt die aufgeklappte Karte

**Neu oder alt (Verweis):** alt — wie R14-S2, weiter teilweise.

**Kennzeichnung:** gemessen (Skript `rl.js`, 390 × 844, 12 Bögen).

**Fundstelle / Aufgabe:** Karte 7 aufklappen, „Auftrag/Notiz" öffnen, Text
tippen, 150 ms später Neuladen.

**Beobachtung:** Die Notiz steht danach auf der Karte (hält), die Bildlaufstelle
bleibt (2 667 px). Die Karte ist wieder zugeklappt (offene Karten 1 → 0).

**Erwartung der Rolle:** Ich sehe die Karte, mit der ich gerade gearbeitet
habe.

**Folge im Einsatz:** Bei 12 oder mehr Karten muss man die Einheit in der Liste
wiederfinden, um zu prüfen, ob die Notiz angekommen ist.

**Empfehlung:** Die zuletzt bearbeitete Karte nach dem Neuladen aufgeklappt
lassen.

**Nachprüfung:** Wie oben; nach Neuladen ist die Karte aufgeklappt.

### R17-S11 [P3] „Abrücken" verschiebt Karte und Knopf, bei 360 × 640 um 34 px

**Neu oder alt (Verweis):** neu (verwandt mit R12-G3, dort der Versatz der Knöpfe nach Abrücken).

**Kennzeichnung:** gemessen (Skripte `g3.js` bis `g6.js`).

**Fundstelle / Aufgabe:** Aufgeklappte Karte → „Abrücken" (ein Tipp).

**Beobachtung:** Bei 360 × 640 und einer Einheit ändert sich die Bildlaufstelle
um 243 px (1 253 → 1 010 px), der Knopf (jetzt „Wieder anwesend") sitzt 34 px
tiefer (222 → 256 px). Bei 390 × 844 mit 12 Einheiten springt er um 144 px nach
oben (647 → 503 px); ein zweiter Tipp an dieselbe Stelle trifft dort die neue
Quittungsleiste (Text), bei 360 × 640 eine leere Fläche der Karte. Folgen
bleiben harmlos (Doppeltipp fängt die Beschriftung „✓ Abgerückt" ab).

**Erwartung der Rolle:** Der Knopf, den ich gedrückt habe, bleibt, wo er ist.

**Folge im Einsatz:** Wer „Wieder anwesend" (Korrektur) sofort an der gleichen
Stelle antippt, trifft ins Leere und hält die Korrektur für wirkungslos.

**Empfehlung:** Die Seite beim Abrücken nicht springen lassen (Bildlaufanker
auf der Karte halten); Korrektur an dieser Stelle im Bild lassen.

**Nachprüfung:** Abrücken antippen, Knopf und Karte bleiben auf gleicher Höhe.

### R17-S12 [P3] Schnellerfassung: „Zurück zu Schritt 4" statt zum besuchten Schritt 5; „Weiter" und „Zur Übersicht" wechseln

**Neu oder alt (Verweis):** neu (verwandt mit R15-N3, dort Rückknopf nennt Schritt 4).

**Kennzeichnung:** gemessen (Skripte `w.js`, `w2.js`, 390 × 844).

**Fundstelle / Aufgabe:** „Einheit schnell erfassen (nur Stärke)…" von der
Startseite, mit „Weiter" über Schritt 3 und 4 zu Schritt 5 („Sofortbedarf",
„Zur Übersicht →"), dann Übersicht.

**Beobachtung:** Auf der Übersicht steht „← Zurück zu Schritt 4 (Fahrzeuge)", obwohl
Schritt 5 gerade besucht wurde. Der Tipp führt auf Schritt 4, dessen
rechter Knopf jetzt „Zur Übersicht →" heißt (beim ersten Besuch „Weiter →").
Im vollen Bogen steht an gleicher Stelle richtig „Zurück zu Schritt 5
(Sofortbedarf)". Die Übersicht nennt außerdem „Typ, Fahrzeuge, Bedarf fehlen
bewusst", obwohl der Einheitstyp gesetzt ist.

**Erwartung der Rolle:** Zurück geht dahin, woher ich komme; ein Knopf heißt
an derselben Stelle gleich.

**Folge im Einsatz:** Geringe; wer zurück will, landet einen Schritt früher als
gedacht und sucht Schritt 5.

**Empfehlung:** Zurück zum zuletzt besuchten Schritt; Knopfbeschriftung je
Schritt stabil halten; „Typ" aus dem Satz streichen, wenn er gesetzt ist.

**Nachprüfung:** Wie oben; Übersicht → Zurück führt auf Schritt 5.

## Nebenbeobachtungen (kein Befund)

- Der Scanner (`Bogen scannen…`) ließ sich im Testbrowser ohne Kamera nicht
  sinnvoll prüfen; nicht ausgewertet.
- „Angaben vom Zettel (optional)" ist ein zugeklapptes `details`; die
  Zeitfelder sind `type=time`. Wie der Zeitwähler eines Telefons unter Stress
  bedient wird, ist im Testbrowser nicht prüfbar.
- Der Sammel-PDF-Hinweis nennt „etwa 45 Sekunden oder länger"; im Testbrowser
  dauerte die Erzeugung bei 40 Bögen 1 bis 11 s (Desktop-Hardware, nicht
  repräsentativ für ein Telefon).

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Zahlen stimmen, so gezählt" verspricht im
  Dialog ein „Rückgängig", das nach dem Tipp nicht im Bild steht (R17-S1).
- **Größtes Einsatzrisiko:** Ein Tipp 12 px neben die Hauptaktion der Rückfrage
  „Nur Sollplätze" macht erfundene Zahlen ohne Marke und ohne „Rückgängig" zur
  gemeldeten Stärke (R17-S1).
- **Top-Priorität für die nächste Iteration:** Quittung mit „Rückgängig" nach
  „Zahlen stimmen, so gezählt", Marke „Sollstärke" bzw. „gezählt" an Quittung
  und Kopfzeile (R17-S1).
