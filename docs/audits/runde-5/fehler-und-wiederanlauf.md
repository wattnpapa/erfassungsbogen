# Audit „Fehler und Wiederanlauf", Runde 5 (Bedienfehler provozieren, selbst korrigieren)

Stand: 06.10.2026 · Prüfer: Rollenaudit `thw-error-recovery-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit `c0cbae0` (Code entspricht `4fcdbaf`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-4-Befunde, mit Schwerpunkt auf den dort umgebauten Stellen.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, Gerätedichte 2.
Jeder Lauf hatte einen eigenen Browser-Kontext mit leerem Speicher, elf
weitere Prüfer nutzten denselben Server. Zeiten sind deshalb nur als
Abstände zwischen meinen eigenen Tipps angegeben, nicht als Ladezeiten.
Tipps kamen über `touchscreen.tap` an Koordinaten (ein Locator-Tipp erreicht
die über die Zeile gelegten Aufklapp-Knöpfe der Einheitenkarten nicht).

Die Zustände habe ich über `localStorage`-Seeds aus `examples/thw/`
hergestellt, alle mit `uebung: false` und einem Einsatzzeitraum ab heute:

- `eeb.einsaetze.v1`: Sammlung „Hochwasser Donau" (Einsatz) mit 013 Ulm B,
  002 Biberach FGr O (B) und 006 Karlsruhe ZTr TZ; für „Verschieben" dazu
  „Übung Iller" mit 013 Ulm B; für den Import eine Einsatz-Datei mit einem
  Bogen ohne `einheitsTyp`.
- `eeb.entwurf.v1`: eigener Bogen 013 Ulm B oder 002 Biberach in Schritt 1
  bis 6; als Fremd-Erfassung 025 Neu-Ulm (mit `einheitsTyp` 4 und dem Namen
  „Ulm-Söflingen") mit `fremd.einsatzId` und `fremd.beginn`.
- `eeb.vorlagen.v1`: Vorlage aus 013 Ulm B (für die Musterung).

Geprüft habe ich in diesen Abständen und Stufen:

- **Doppeltipp** an derselben Stelle mit 120, 150, 300, 600, 700, 1 000,
  1 100, 1 300, 1 400 und 1 600 ms: „Stärke übernehmen", „Person entfernen",
  „Weiter →", „Zusammenführen", „In den Papierkorb", „Alle Daten löschen".
- **Zurück-Geste** (`history.back()`) bei offener Rückfrage in der Sammlung
  („Meldung entfernen", „Einsatz löschen", „Stärke ändern", die zweite
  Rückfrage „Stimmt die Stärke?"), im Assistenten („Bogen übergeben", Menü
  „Ansicht", „Verwerfen") und auf der Startseite.
- **Uhrsprünge** mit `page.clock`: +5 und +30 Minuten sowie +45, +200 und
  +365 Tage, die Minutenfälle und der 365-Tage-Fall mit Rücksprung auf die
  echte Zeit, jeweils mit Neuladen.
- **Speicher**: Stub auf `Storage.prototype.setItem`, der jede Schreibung
  unter `eeb.*` bzw. nur unter `eeb.einsaetze.v1` mit `QuotaExceededError`
  ablehnt, nach dem Laden gesetzt.
- **Neuladen** mitten in der Eingabe (0, 100 und 400 ms nach dem Tippen im
  Namensfeld), nach „Stärke ändern", mit Musterung und mit defekten Daten.
- **Dateien**: leere Datei, Textdatei, nach 3 000 Byte abgeschnittene
  Bogen-JSON, gültiger Bogen, Bogen und Einsatz-Datei ohne `einheitsTyp`.
- **Zahlen**: 6a, 6,5, −1, 1 000, leer, 60 statt 6, 0 / 0 / 0, 8 / 0 / 0.

Getestet habe ich zuerst ohne Blick in frühere Berichte (bis auf den
Abschnitt „Prüfaufbau" des Runde-4-READMEs). Danach habe ich den
Runde-4-Bericht samt „Stand der Behebung" gelesen und die Behebungen gezielt
nachgestellt. Erst zuletzt habe ich die schon vorliegenden Runde-5-Berichte
gelesen; was dort steht, ist hier nur als Verweis genannt.

Screenshots und Skripte liegen außerhalb des Repositorys unter
`/tmp/claude-0/-home-user-erfassungsbogen/80562043-ef9f-5d01-b383-2703357d8a5e/scratchpad/runde5/fehler/`.

**Nicht prüfbar:**

- Kamera und Handscanner (QR-Weg nur über Dateien), echte Handschuhe, echtes
  Licht.
- Der Zurück-Knopf eines Android-Geräts und der Gestenverlauf von iOS. Ich
  habe `history.back()` verwendet; wie sich das Verlassen der App auf einem
  echten Gerät anfühlt, ist nicht geprüft.
- Eine echte Zeitsynchronisation des Geräts. Die Uhr habe ich mit
  `page.clock` gesprungen; ein Gerät, das seine Zeit nach dem Funkloch
  nachstellt, habe ich damit nur nachgebildet.
- WebKit/Safari, native Builds (Android, iOS, Electron).
- Bildschirmtastatur (nur nachgestellt), Zeitmessungen unter Last: Elf
  weitere Prüfer nutzten den Server gleichzeitig. Die Sperrzeiten von 450 ms
  und 1,5 s habe ich als Abstände zwischen Tipps gemessen, nicht als
  Absolutzeiten.
- Gekürzter Link und voller Speicher in der Fremd-Erfassung (R4-E7): nur im
  Code gelesen, nicht in der Oberfläche nachgestellt.

Rolle: Helfer, der normale Fehler macht und danach selbst weiterkommen will.

## Urteil

Die Umbauten aus Runde 4 tragen. Eine Rückfrage nimmt Tipps an der Stelle des
auslösenden Fingers 1,5 s lang nicht an; „Person entfernen" blieb bei
Doppeltipps von 120 bis 1 400 ms folgenlos, „Stärke übernehmen" und
„Zusammenführen" legen auch bei 120 bis 1 600 ms genau eine Fassung an. Die
Zurück-Geste schließt in der Sammlung, was oben liegt, und lässt die Ansicht
stehen; bei zwei Rückfragen nacheinander („Stärke ändern", dann „Stimmt die
Stärke?") schließt sie erst die zweite und öffnet wieder die Eingabe mit den
getippten Zahlen. „Ist das dieselbe Einheit?" schlägt „Neu-Ulm" nicht mehr
gegen „Ulm" vor und stellt „Nein — als eigene Einheit" mit Fokus nach vorn.
„Stärke ändern…" nennt das falsche Feld („nicht lesbar: Mannschaft („6a")"),
warnt bei 60 statt 6 mit „8 → 62" und bietet nach der Übernahme „Rückgängig"
an, auch mehrfach hintereinander. „Zusammenführen" lässt sich zurücknehmen.
Die Startkarte sagt bei einem Speicherfehler „⚠ Nicht gespeichert … Letzter
gesicherter Stand: 12:00 Uhr". Die Geräteuhr-Warnung steht auf Startseite
und Sammlung.

Die Reibung sitzt jetzt an zwei Stellen, die erst durch die Umbauten
entstanden sind. Erstens ist die Uhr nicht nur eine Frage des Löschens (R5-D1):
Die App stempelt auch mit der nicht bestätigten Geräteuhr. Wer ihrer eigenen
Anweisung folgt und das Datum korrigiert, erlebt, dass seine nächste „Stärke
ändern…" quittiert wird, aber nicht gilt (R5-E2). Zweitens hat die App keinen
Fangnetzboden: Eine Einsatz-Datei mit einem unvollständigen Bogen macht die
App nach dem Import dauerhaft weiß, der Ausweg ist nur das Löschen aller
Browser-Daten (R5-E1). Dazu kommen kleinere Stellen an den neuen Quittungen:
Zwei „Rückgängig" mit gegensätzlicher Wirkung nebeneinander, eine Leiste, die
die Folge wegkürzt (R5-E3, R5-E4).

Den eigenen Bogen und die Meldekopf-Aufgaben schafft der Helfer ohne fremde
Hilfe. Bei den Korrekturen findet er die Rückwege jetzt an der Stelle, an der
er den Fehler macht; die Unsicherheit bleibt bei der Frage, was „Rückgängig"
dort genau tut.

## Befunde

### R5-E1 [P1] Ein unvollständiger Bogen in einer Einsatz-Datei macht die App dauerhaft weiß; kein Fangnetz, kein Weg zurück ohne Löschen aller Browser-Daten (neu)

**Priorität:** P1

**Kennzeichnung:** gemessen (Skripte `t24`–`t27`, Seitenfehler und Speicher
ausgelesen). Voraussetzung ist eine Datei mit einem fehlerhaften Bogen; wie
häufig das im Einsatz vorkommt, kann ich nicht beurteilen (Risiko).

**Fundstelle / Aufgabe:** Startseite → „Einsatz importieren…" mit einer
Einsatz-Datei, deren Bogen kein `einheit.einheitsTyp` hat (sonst gültig,
Schema 8, Umschlag `eeb-einsatz`). Code: `src/app/einsatz-transport.ts`,
`istBogen()` prüft nur `schemaVersion`, `einheit`, `einsatz` und
`Array.isArray(personal)`. Abgestürzt wird in `src/app/hilfen.ts` (um Zeile
680 und 1029) und `src/app/schritte/einheit.tsx` (Zeile 337), die
`einheitsTyp.code` ohne Prüfung lesen. Es gibt keinen `ErrorBoundary` in
`src/`.

**Beobachtung:**

- Nach „Einsatz importieren…" erscheint ein leerer, hellgrauer Bildschirm
  (Seitenfehler „Cannot read properties of undefined (reading 'code')"). Es
  gibt keinen Text und keinen Knopf.
- Die Sammlung ist da schon unter `eeb.einsaetze.v1` gespeichert. Neuladen
  (zweimal geprüft): wieder leer, wieder derselbe Seitenfehler. Die
  Startseite rechnet die Summen über alle Sammlungen und stürzt daran ab;
  „Alle Daten löschen", „Datensicherung" und alle übrigen Sammlungen sind
  damit nicht erreichbar.
- Dieselbe Ursache, schwächere Folge: Ein Entwurf ohne `einheitsTyp` zeigt auf
  der Startkarte „THW Ulm · Stärke 0 / 2 / 6 / 8 · gespeichert", „Fortsetzen"
  öffnet einen weißen Bildschirm, und nach dem Neuladen steht die Karte
  wieder da. „Aus Datei laden…" mit einem solchen Einzelbogen: weiß, nach dem
  Neuladen wieder normal (der Bogen wurde nicht gespeichert).
- „Bögen einlesen…" in der Sammlung lehnt denselben Bogen ab (kein Eintrag,
  keine Abstürze). Der Schutz fehlt also nur auf dem Import- und dem
  Entwurfsweg.
- Der Kern ist an dieser Stelle dem Namen nach defensiv („kaputte
  Einträge werden übersprungen statt alles zu verlieren",
  `vendor/bos-meldekopf/src/einsaetze.ts`), prüft aber nur die Hülle des
  JSON, nicht die Pflichtfelder des Bogens.

**Erwartung der Rolle:** Eine Datei, die die App nicht lesen kann, wird mit
einem Satz abgelehnt, wie die leere, die Text- und die abgeschnittene Datei.
Was sich einmal in die App geschlichen hat, darf sie nicht für immer
sperren.

**Auswirkung im Einsatz:** Das Gerät am Meldekopf, auf dem eine Sammlung von
einer Gegenstelle oder aus einer älteren Sicherung eingespielt wird, ist
danach nicht mehr zu benutzen. Die einzige Rettung ist das Löschen der
Website-Daten im Browser. Dabei gehen alle übrigen Sammlungen, Vorlagen und
der eigene Entwurf verloren, ohne dass die App vorher noch eine Sicherung
erzeugen kann. Ohne Mobilfunk gibt es keine Hilfe. Wie wahrscheinlich solche
Dateien sind (von Hand bearbeitet, von einem anderen Werkzeug erzeugt, aus
einem Zwischenstand), kann ich nicht beurteilen; der Schaden ist der größte,
den ich in diesem Lauf fand.

**Empfehlung:** Beim Lesen von Einsatz-Dateien, Sicherungen und Entwürfen die
Pflichtfelder des Bogens prüfen und beschädigte Einträge mit einem Satz
benennen („1 von 3 Bögen ist unvollständig und wurde nicht übernommen"). Und
unabhängig davon ein Fangnetz: eine Fehlerseite mit „Daten sichern" und „Alle
Daten löschen", die nicht von den Daten abhängt, die gerade abgestürzt sind.

**Nachprüfung:** Einsatz-Datei mit einem Bogen ohne `einheitsTyp` (und je
einer ohne `hierarchie`, `fahrzeuge`, `sofortbedarf`) importieren: Es kommt
ein Satz, die Startseite bleibt benutzbar, nach dem Neuladen ebenso. Entwurf
ohne Typ: „Fortsetzen" öffnet nicht weiß.

### R5-E2 [P1] Nach einer falsch gestellten oder zurückgestellten Uhr gilt die nächste „Stärke ändern…" nicht, die Quittung sagt das Gegenteil (neu, Nebenwirkung des Stempelns mit der nicht bestätigten Uhr)

**Priorität:** P1

**Kennzeichnung:** gemessen (Speicher und Karte nach jedem Schritt
ausgelesen, drei Läufe: +5 Minuten, +30 Minuten, +365 Tage). Dass eine echte
Geräteuhr beim Nachstellen zurückspringt, habe ich nur mit `page.clock`
nachgebildet.

**Fundstelle / Aufgabe:** Sammlung „Hochwasser Donau" mit Ulm B (0 / 2 / 6 /
8). Die Uhr geht 5 Minuten vor, „Mehr… → Stärke ändern…" auf 0 / 2 / 5 / 7
(1. Änderung). Die Uhr wird auf die echte Zeit gestellt, Neuladen, wieder
„Stärke ändern…" auf 0 / 2 / 4 / 6 (2. Änderung). Code: `src/app/nur-staerke.ts`
Zeile 71 (`b.stand = Math.max(stand, vorher.stand)`),
`src/app/einsaetze-ui.tsx` (`staerkeAendern`, `jetztZeitpunkt()`),
`vendor/bos-meldekopf/src/einsaetze.ts` (`istNeuer`: erst `bogen.stand`, bei
Gleichstand `empfangenAm`). Zum Stempel mit der Geräteuhr siehe
`src/app/datenschutz-uhr.ts`: Die geprüfte Uhr hält nur das Löschen zurück.

**Beobachtung:**

- Beide Fassungen tragen denselben `stand` (3 557 549 bei +30 min, 3 557 524
  bei +5 min), weil die zweite den älteren Stand der ersten übernimmt. Bei
  Gleichstand gewinnt die jüngere Empfangszeit, und die der zweiten liegt
  wegen des Rücksprungs vor der ersten.
- Die Daumenleiste meldet „Stärke geändert: „THW Ulm…" mit „Rückgängig". Die
  Karte zeigt weiter „Stärke 0 / 2 / 5 / 7", dazu „Folgemeldung … Stärke 6 →
  7 (+1)": Die eben eingegebene Fassung steht als die ältere da. Summe und
  Verpflegung der Lage rechnen mit 7. Eine Rückfrage oder ein Hinweis kommt
  nicht.
- Mit +365 Tagen (die App zeigt „⚠ Geräteuhr prüfen … Bis das geklärt ist,
  löscht und anonymisiert die App nichts. Datum falsch? In den
  Geräteeinstellungen korrigieren"): Die erste „Stärke ändern…" trägt den
  `stand` 06.10.2027 (4 083 118). Nach der Korrektur des Datums, genau wie die
  Warnung es verlangt, bleibt jede weitere Änderung dieser Einheit hinter
  dieser Fassung zurück: dieselbe Quittung, dieselbe unveränderte Zahl.
- Die „Historie" zeigt beide Fassungen mit „Stand 06.10.2026, 12:22",
  die jüngere mit „eingegangen 12:13", die ältere mit „12:22 (aktuell)".
  Über „Diese Fassung gilt…" lässt sich das beheben. Wer die Karte nicht
  gelesen hat, sucht diesen Weg nicht.
- Die Geräteuhr-Warnung steht auf Startseite und Sammlung, im Assistenten
  (Entwurf) nicht.

**Erwartung der Rolle:** Meine letzte Eingabe gilt, sonst sagt die App es
laut. Folge ich der Anweisung der App („Datum korrigieren"), bricht das
nichts.

**Auswirkung im Einsatz:** Die Lage zählt eine falsche Stärke, und die
Quittung bestätigt die richtige. Die Folge ist ein Fehler in Summen,
Verpflegung und Unterbringung, der erst auffällt, wenn jemand die Karte
nachrechnet. Betroffen ist, wer an einem Gerät mit falscher Uhr schon etwas
geändert hat und die Uhr danach richtet; die Wahrscheinlichkeit hängt davon
ab, wie oft solche Geräte im Einsatz stehen.

**Empfehlung:** Eine Handlung des Helfers hat Vorrang vor dem Sendestand:
Bei „Stärke ändern…" und anderen Handänderungen die neue Fassung sicher an
die Spitze legen (zum Beispiel über die Reihenfolge der Eingänge) oder
hinweisen, wenn sie gegenüber der geltenden Fassung nicht gilt. Und die
Eintrags-, Stempel- und Ordnungszeiten nicht mit der nicht bestätigten
Geräteuhr schreiben, solange die Warnung steht, oder die Warnung auch auf
den Weg „Stärke ändern…" ausdehnen.

**Nachprüfung:** Uhr 5 Minuten vorstellen, „Stärke ändern…" auf 5,
Uhr zurück, Neuladen, auf 4: Die Karte zeigt 4, die Historie führt die 4 an
erster Stelle. Ebenso mit +365 Tagen.

### R5-E3 [P2] Nach „Ja — als neue Fassung" liegen zwei „Rückgängig" mit gegensätzlicher Wirkung gleichzeitig im Bild (neu, Nebenwirkung der R4-E1-Behebung)

**Priorität:** P2

**Kennzeichnung:** gemessen (beide Knöpfe nacheinander in getrennten
Läufen betätigt, Speicher ausgelesen, Skript `t23`).

**Fundstelle / Aufgabe:** Sammlung mit Ulm B → „Einheit manuell erfassen…"
(Fremd-Erfassung „Ulm-Söflingen", Typ B, ohne gemeinsame Person) → „In
Einsatz übernehmen" → „Ist das dieselbe Einheit?" → „Ja — als neue Fassung
von …". Code: `src/app/app.tsx` Zeile 1934 und 3455 bis 3457
(Daumenleiste), 2057 bis 2075 (`zusammenlegungZuruecknehmen`);
`src/app/einsaetze-ui.tsx` Zeile 1343 (Link „Rückgängig" im Kasten „Zuletzt
eingelesen").

**Beobachtung:** Nach „Ja" stehen zwei Knöpfe „Rückgängig" in der Ansicht:

- Der große in der Daumenleiste (123 × 44 px). Er führt die Meldung als
  eigene Einheit weiter: danach „2 Einheiten", „Ulm-Söflingen … steht jetzt
  als eigene Einheit in der Sammlung; ‚THW Ulm Bergungsgruppe' gilt wie
  vorher".
- Ein Textlink im Kasten „Zuletzt eingelesen … Folgemeldung: Stärke 8 → 7
  (−1) …" (74 × 30 px), der von der Leiste zum Teil überdeckt wird. Er
  entfernt die Meldung ganz: danach „1 Einheit", „Folgemeldung
  zurückgenommen: … gilt wieder mit Stärke 8". Die erfassten sieben
  Personen und zwei Fahrzeuge sind weg und müssen neu erfasst werden.

Der Text der Leiste ist auf zwei Zeilen gekürzt und zeigt nur „„THW Ulm-
Söflingen…" (siehe R5-E4); wer noch nicht weiß, was das Zusammenlegen getan
hat, liest nicht, was das große „Rückgängig" daran ändert.

**Erwartung der Rolle:** Ein „Rückgängig" auf dem Bildschirm, ein Ergebnis.
Habe ich „Ja" getippt und merke den Fehler, bekomme ich meine Erfassung als
eigene Einheit zurück, nicht gelöscht.

**Auswirkung im Einsatz:** Wer den Fehler bemerkt und den kleinen Link im
Kasten erwischt (er liegt direkt über dem Rand der Leiste), verliert die
vollständige Erfassung der zweiten Einheit. Die Quittung („Folgemeldung
zurückgenommen") sagt das zwar, aber erst nachher.

**Empfehlung:** Nur einen Weg zeigen. Bei zusammengelegten Meldungen den Link
im Kasten ausblenden, oder beide gleich benennen: „Rückgängig — als eigene
Einheit führen" und „Meldung verwerfen".

**Nachprüfung:** Ulm B + Ulm-Söflingen, „Ja" tippen: Es gibt ein einziges
„Rückgängig" mit eindeutiger Bezeichnung, und die Erfassung bleibt erhalten.

### R5-E4 [P2] Die Daumenleiste kürzt den Satz so, dass die Folge nicht lesbar ist (neu, Nebenwirkung der Zwei-Zeilen-Regel aus R3)

**Priorität:** P2

**Kennzeichnung:** gemessen (Leistentext und Screenshots für vier Quittungen,
360 × 640).

**Fundstelle / Aufgabe:** Daumenleiste nach „Stärke ändern…", „Ja — als neue
Fassung", „Einsatz löschen", „Stärke ändern… auf 0". Code:
`src/app/daumen-quittung.tsx`; Klammer auf zwei Zeilen in `index.html` um
Zeile 2352 (`-webkit-line-clamp: 2`).

**Beobachtung:**

| Handlung | Was in der Leiste steht (sichtbar) | Was verloren geht |
| --- | --- | --- |
| „Stärke ändern…" 8 → 7 | „Stärke geändert: „THW Ulm…" | „8 → 7" |
| „Stärke ändern…" 8 → 0 | „Stärke geändert: „THW Ulm…" | „8 → 0" |
| „Ja — als neue Fassung" | „„THW Ulm-Söflingen…" | „als Fassung von „THW Ulm Bergungsgruppe" aufgenommen" |
| „Einsatz löschen" (Startseite) | „Einsatz „Hochwasser…" | „in den Papierkorb gelegt (30 Tage rückholbar)" |

Die Regel von R3 („Die Handlung steht vorn, der Name wird gekürzt") gilt für
„Stärke geändert:" und „Abgerückt", nicht für die Zusammenlegung und den
Papierkorb: Dort steht der Name vorn und die Handlung verschwindet. Bei
einer Stärke auf 0 steht die Folge („8 → 0") nur auf der Karte, die unter der
Leiste liegt.

**Erwartung der Rolle:** Die Leiste sagt in zwei Zeilen, was passiert ist
und was „Rückgängig" zurücknimmt.

**Auswirkung im Einsatz:** Wer „Rückgängig" tippen will, liest vorher nicht,
was es tut. Besonders „Stärke 8 → 0" und „in den Papierkorb" brauchen die
Zahl bzw. das Verb. Die Karte darunter nennt die Folge, wird aber von der
Leiste selbst überdeckt.

**Empfehlung:** Immer die Handlung und die Zahl vorn („Zusammengelegt",
„Stärke 8 → 0", „Im Papierkorb"), den Namen hinten kürzen.

**Nachprüfung:** Die vier Handlungen mit einem langen Einheitsnamen
(„Fachgruppe Wassergefahren (A) Ulm-Söflingen") bei 360 und 320 px: In jeder
Leiste stehen Handlung und Zahl.

### R5-E5 [P3] „Stimmt die Zeit?" stellt die Uhrzeit in der Zukunft als hervorgehobene Antwort nach vorn (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Screenshot `42-dlg`, Stand 20:42 mit
Eingabe 21:12, Skript `t42`).

**Fundstelle / Aufgabe:** „Einheit manuell erfassen…" → „Eingetroffen um"
21:12 bei 20:42 → „In Einsatz übernehmen". Code: `src/app/app.tsx` um Zeile
2618 bis 2632 (`frageWahl`, Wege `heute`, `gestern`, `abbruch: "Zeit
korrigieren"`).

**Beobachtung:** Der Text sagt „21:12 liegt in der Zukunft — Stunde oder Tag
vertauscht? Jetzt ist es 20:42 Uhr." Der dunkel hervorgehobene erste Knopf
ist „Heute 06.10.2026, 21:12", also genau die Zeit, die der Text eben als
unmöglich bezeichnet hat. „Gestern …" folgt, „Zeit korrigieren" steht
unten und ist hell. Die Wahl „Heute" legt die Eintreffzeit in die Zukunft.

**Erwartung der Rolle:** Der sichere Weg („korrigieren") steht vorn, wie bei
„Ist das dieselbe Einheit?".

**Auswirkung im Einsatz:** Bei einem Stundendreher ist weder „Heute" noch
„Gestern" richtig. Wer unter Zeitdruck den dunklen Knopf tippt, bekommt eine
Einheit, die erst in einer halben Stunde eingetroffen ist. Der Fehler fällt
auf der Karte nicht auf.

**Empfehlung:** „Zeit korrigieren" zuerst und hervorgehoben, „Heute" und
„Gestern" darunter.

**Nachprüfung:** 20:42 mit 21:12: Der hervorgehobene Knopf ist „Zeit
korrigieren".

### R5-E6 [P3] „Stärke ändern…" auf 0 / 0 / 0 nimmt eine Einheit ohne Rückfrage aus der Stärke (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (Skript `t48`).

**Fundstelle / Aufgabe:** „Mehr… → Stärke ändern…" mit 0 / 0 / 0 bei einer
Einheit mit 0 / 2 / 6 / 8. Code: `src/app/einsaetze-ui.tsx`
(`staerkeAendern`): Die Plausibilität prüft nach oben (60 statt 6, mehr als
das Dreifache, mehr Führer als Mannschaft), nicht nach unten.

**Beobachtung:** Der Dialog schließt, die Karte zeigt „Stärke 0 / 0 / 0 / 0",
dazu „Stärke fehlt", „Rückfrage: Stärke 0" und „Verpflegung 8 Personen → 0
Personen". Die Leiste meldet „Stärke geändert" mit „Rückgängig"; die Folge
(„8 → 0") ist abgeschnitten (R5-E4). 8 / 0 / 0 dagegen löst „mehr Führer als
Mannschaft — stimmt das?" aus. Die drei leeren Felder hat der Helfer vielleicht
nicht bewusst auf 0 gesetzt.

**Erwartung der Rolle:** Aus 8 werden 0, nur weil drei Felder 0 zeigen? Die
App fragt.

**Auswirkung im Einsatz:** Die Einheit zählt weder in Stärke noch in
Verpflegung. Eine Karte mit „Stärke fehlt" und „Rückgängig" erlaubt die
Korrektur; es bleibt aber eine stille Eingabe ohne Frage in einem Dialog, der
sonst genau danach fragt.

**Empfehlung:** Bei einer Gesamtstärke von 0 oder einem Absturz auf unter
ein Viertel dieselbe Rückfrage („Gesamt 8 → 0 — stimmt das?"). Für eine
Einheit, die gar nicht mehr da ist, bleibt „Abrücken".

**Nachprüfung:** 0 / 0 / 0 eintragen: Es erscheint die Rückfrage.

### R5-E7 [P3] „Stärke ändern…" bei vollem Speicher: Der Hinweis stimmt, die eingegebenen Zahlen sind weg (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (Stub auf `eeb.einsaetze.v1`, Skript `t32`).

**Fundstelle / Aufgabe:** „Mehr… → Stärke ändern…", „5" in „Mannschaft",
„Stärke übernehmen" bei abgelehnten Schreibungen. Code:
`src/app/einsaetze-ui.tsx` (`gesichert("Stärke ändern", …)`).

**Beobachtung:** Ein Hinweis „Stärke ändern | Der Speicher dieses Geräts
nimmt nichts mehr an (voll oder vom Browser gesperrt). Platz schafft nur
Löschen: nicht mehr benötigte Einsätze sichern, in den Papierkorb legen und
den Papierkorb leeren." mit „Alles klar". Es entsteht keine Phantom-Fassung
(3 Einträge, Karte unverändert, Leiste gibt es nicht): Das ist richtig. Der
Dialog ist danach zu; die getippte Zahl muss nach dem Platzschaffen neu
eingegeben werden, und der Hinweis nennt die gewünschte Stärke nicht.

**Erwartung der Rolle:** Der Hinweis erinnert an die Eingabe („Gewünscht war
0 / 2 / 5 / 7"), damit sie sich auf den Meldeblock schreiben lässt.

**Auswirkung im Einsatz:** Gering: eine Zahl neu eintippen. Bei mehreren
Einheiten hintereinander summiert sich das.

**Empfehlung:** Die gewünschte Stärke in den Hinweis schreiben, wie
„Stärke jetzt auf dem Meldeblock notieren" in der Fremd-Erfassung.

**Nachprüfung:** Stub setzen, „Stärke ändern…": Der Hinweis nennt die
Zahlen.

### Verweise auf Befunde in anderen Runde-5-Berichten

Unabhängig beobachtet und hier nicht gezählt:

- **R5-D1** (Uhrsprung, nach einem Tag bestätigt): Ich sehe dasselbe an Tag 0
  („⚠ Geräteuhr prüfen … Bis das geklärt ist, löscht und anonymisiert die App
  nichts") und ergänze mit R5-E2 die Folge für das Stempeln.
- **R5-S5** (Zurück-Geste bei offener Rückfrage auf der Startseite verlässt
  die App): Bei mir mit `history.back()` auf der Startseite mit „Verwerfen"
  und „Alle Daten löschen": Der Verlauf hat dort nur einen Eintrag, die
  Rückfrage bleibt unberührt, die Seite wird verlassen. In der Sammlung und im
  Assistenten schließt die Zurück-Geste dagegen die Rückfrage.
- **R5-G5 und R5-S2** (die Ortssperre schweigt): Ein Tipp auf „Nein — als
  eigene Einheit führen" 1,3 s nach dem Tipp auf „Jetzt" blieb wirkungslos,
  ohne Rückmeldung; bei 1,8 s wirkte er. Gleiches mit „Zahlen korrigieren"
  bei 0,9 s nach „Stärke übernehmen".
- **R5-S3** („Person entfernen": Nachtipps auf die Bestätigung): Ich habe
  nur den Doppeltipp auf den auslösenden Knopf geprüft (120 bis 1 400 ms:
  Person bleibt), nicht Nachtipps auf die Bestätigung.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Doppeltipp:** „Stärke übernehmen" mit 120, 300, 700, 1 100 und 1 600 ms:
  eine Fassung. „Zusammenführen" mit 300 und 1 000 ms: eine. „In den
  Papierkorb" mit 150, 700 und 1 300 ms: ein Einsatz im Papierkorb. „Weiter →"
  mit 120 bis 1 100 ms: ein Schritt (bei 1 600 ms zwei, gewollt). „Person
  entfernen" mit 120 bis 1 400 ms: acht Personen bleiben. „Alle Daten
  löschen": Rückfrage mit Namen der Sammlung („noch kein Export, Lageblatt
  oder keine Weitergabe von „Hochwasser Donau""), Daten bleiben.
- **Zurück-Geste in der Sammlung und im Assistenten:** schließt „Meldung
  entfernen", „Einsatz löschen", „Stärke ändern", „Bogen übergeben". Bei zwei
  Rückfragen nacheinander („Stärke ändern", „Stimmt die Stärke?") schließt
  sie erst die zweite und öffnet die Eingabe mit den getippten Zahlen
  wieder, dann die erste. Die Sammlung bleibt stehen, nichts wird übernommen.
- **„Stärke ändern…":** „6a" → „nicht lesbar: Mannschaft („6a")" mit
  erhaltenen Werten; 60 statt 6 → „Stärke 0 / 2 / 6 / 8 → 0 / 2 / 60 / 62 —
  Gesamt 8 → 62: mehr als das Dreifache"; „Zahlen korrigieren" öffnet
  die Eingabe, „Ja, so übernehmen" legt die Fassung an. „Rückgängig"
  zweimal hintereinander (7 → 6, dann 6 → 7) gibt jeweils den vorigen
  Stand.
- **„Ist das dieselbe Einheit?":** „Ulm" und „Neu-Ulm" mit gleichem Typ:
  keine Frage, zwei Einheiten. „Ulm" und „Ulm-Söflingen": Frage mit
  Gegenüberstellung („Bisher: Stärke 0 / 2 / 6 / 8 · Lehmann, Karsten …",
  „⚠ Keine gemeinsame Person, kein gemeinsames Fahrzeug — vielleicht eine
  andere Gruppe?"), erster Knopf „Nein — als eigene Einheit führen" mit
  Fokus.
- **„Zusammenführen":** Dialog „Danach: 0 / 2 / 6 / 8 · 2 Fzg", Quittung
  „Zusammengeführt: „THW Ulm Bergungsgruppe" · Stärke der Meldung 6 → 8",
  „Rückgängig" stellt „steht wieder in zwei Teilen" her.
- **Speicherfehler auf der Startkarte:** „⚠ Nicht gespeichert — dieser
  Browser lässt die App nichts speichern. Letzter gesicherter Stand: 12:00
  Uhr. Beim Schließen gehen die Änderungen verloren — jetzt „Fortsetzen"
  und „Bogen übergeben" (PDF oder QR-Code)." Im Assistenten dieselbe Zeile
  mit Ursache.
- **Geräteuhr-Warnung:** „⚠ Geräteuhr prüfen: Das Gerät zeigt den
  06.10.2027, beim letzten Start war der 06.10.2026. … Datum falsch? In den
  Geräteeinstellungen korrigieren." Bei +365 Tagen bleiben Sammlung und
  Entwurf an Tag 0 unverändert; +45 Tage werden angenommen.
- **Dieselbe Datei zweimal öffnen:** erster Weg mit Rückfrage („Bogen aus
  Datei öffnen?", Fokus auf „Datei öffnen", der eigene Bogen kommt auf den
  Rückholplatz); zweiter und dritter Weg ohne Rückfrage, Speicher
  „Entwurf = Ulm, ersetzt = Biberach".
- **Neuladen und Eingaben:** Ein Name, 0, 100 und 400 ms nach dem Tippen
  neu geladen, ist im Entwurf. Die Musterung kommt mit „Deine Haken von
  vorhin sind wieder da".
- **Eingetroffen um:** 21:12 um 20:42 → „Stimmt die Zeit?" mit Heute und
  Gestern. Liegt der Beginn der Erfassung mehr als fünf Minuten zurück,
  fragt die App „Wann ist die Einheit eingetroffen?".
- **Dateifehler:** leere Datei („ist leer — vermutlich wurde die Übertragung
  abgebrochen"), Textdatei („stammt nicht aus dieser App"), abgeschnittene
  JSON („beschädigt oder unvollständig"), jeweils mit nächstem Schritt, ohne
  Eingriff in die Sammlung.
- **Verschieben in eine Sammlung, die die Einheit schon führt:** „dort schon
  gemeldet, wird zusammengeführt", Quittung „beide Stände sind
  zusammengeführt", „Rückgängig" lässt beide Sammlungen mit je einem Eintrag
  zurück.
- **Speicher voll bei „Stärke ändern…":** keine Phantom-Fassung (R5-E7 nennt
  nur die verlorene Eingabe).

## Abschluss

- **Aufgabe geschafft:** eigener Bogen: ja. Meldekopf: ja, mit Umwegen bei
  der Korrektur nach einem Uhrsprung (R5-E2).
- **Fremde Hilfe nötig:** nein, bis auf einen Fall: Ein Gerät, das durch
  einen unvollständigen Bogen in einer Einsatz-Datei weiß bleibt, braucht
  die Browser-Einstellungen (R5-E1).
- **Größtes Missverständnis:** „Stärke geändert" mit „Rückgängig" liest sich
  wie „jetzt gilt es"; nach einem Uhrsprung gilt die alte Zahl weiter
  (R5-E2).
- **Größtes Einsatzrisiko:** Ein einziger unvollständiger Bogen in einer
  eingespielten Einsatz-Datei sperrt die ganze App samt aller Daten, ohne
  Meldung (R5-E1).
- **Top-Priorität für die nächste Iteration:** Beim Lesen von Dateien und
  Entwürfen die Pflichtfelder prüfen und eine Fehlerseite als Fangnetz
  anbieten (R5-E1); danach Handänderungen vom Sendestand lösen (R5-E2).

## Abgleich mit Runde 4

Grundlage: [../runde-4/fehler-und-wiederanlauf.md](../runde-4/fehler-und-wiederanlauf.md)
samt „Stand der Behebung" und [../runde-4/README.md](../runde-4/README.md).
Dazu die Behebungen aus Runde 4, die andere Rollen betreffen und die ich
beim Prüfen berührt habe (Rückfragen, Zurück-Geste, Zusammenführen, Uhr).

| Runde-4-Befund | Stand laut Runde 4 | Bewertung Runde 5 | Beobachtung |
| --- | --- | --- | --- |
| R4-E1 „Ist das dieselbe Einheit?" überschreibt die andere Einheit (P1) | behoben | hält, Nebenwirkung | Neu-Ulm / Ulm: keine Frage. Ulm / Ulm-Söflingen: „Nein — als eigene Einheit führen" vorn, mit Fokus, Gegenüberstellung. Nach „Ja" funktioniert „Rückgängig" in der Daumenleiste (eigene Einheit). Daneben liegt aber der zweite Link „Rückgängig" im Kasten, der die Meldung ganz entfernt (R5-E3), und der Leistentext ist gekürzt (R5-E4). |
| R4-E2 Derselbe Bogen zweimal räumt den Rückholplatz (P1) | behoben | hält | Zweimal dieselbe Datei: erste Öffnung mit Rückfrage, Fokus auf „Datei öffnen"; zweite und dritte ohne Rückfrage, Speicher Ulm / Biberach. |
| R4-E3 „Eingetroffen um" legt Zukunft still auf gestern (P2) | behoben | hält, Lücke daneben | 21:12 bei 20:42: „Stimmt die Zeit?" mit „Heute" und „Gestern". Der hervorgehobene Knopf ist die Zukunftszeit (R5-E5). |
| R4-E4 „Stärke ändern…": Zahlendreher, Fehler, „Rückgängig" (P2) | behoben | hält, zwei Nebenwirkungen | Feld benannt („Mannschaft („6a")"), Warnung „8 → 62", „Zahlen korrigieren", „Rückgängig" mehrfach. Aber: nach einem Uhrsprung gilt die Änderung nicht, die Quittung sagt es nicht (R5-E2); 0 / 0 / 0 geht ohne Frage durch (R5-E6); die Leiste kürzt „8 → 7" weg (R5-E4); bei vollem Speicher ist die Eingabe verloren (R5-E7). |
| R4-E5 Startkarte zeigt ungespeicherten Stand als „gespeichert" (P2) | behoben | hält | „⚠ Nicht gespeichert … Letzter gesicherter Stand: 12:00 Uhr. Beim Schließen gehen die Änderungen verloren …", mit „Fortsetzen" und „Verwerfen" darunter. |
| R4-E6 Verschieben in eine Sammlung, die die Einheit schon führt (P3) | behoben | hält | Dialog „dort schon gemeldet, wird zusammengeführt", Quittung „beide Stände sind zusammengeführt", „Rückgängig": beide Sammlungen behalten je einen Eintrag. |
| R4-E7 Kleinere Stellen beim Wiederanlauf (P3) | behoben | teilweise geprüft, hält | Musterung nach dem Neuladen: „Deine Haken von vorhin sind wieder da" (geprüft). Gekürzter Link und die Zeile bei vollem Speicher in der Fremd-Erfassung: nur im Code gelesen („bitte die Stärke jetzt auf dem Meldeblock notieren und Platz schaffen"), nicht in der Oberfläche nachgestellt. |
| R4-S1 Zurück bei offener Rückfrage (P2, Quelle: Stress) | behoben | hält, Rest auf der Startseite | In Sammlung und Assistent schließt Zurück das oberste Fenster und lässt die Ansicht stehen; zwei Fenster nacheinander werden einzeln geschlossen. Auf der Startseite (erster Verlaufseintrag) verlässt die Geste die App (R5-S5). |
| R4-S2 Doppeltipp auf „Weiter →" überspringt Schritt 2 (P3, Quelle: Stress) | behoben | hält | 120 bis 1 100 ms: genau ein Schritt. Bei 1 600 ms zwei, das ist gewollt. Die Sperre schweigt (R5-S2, R5-G5). |
| R4-G1 Rückfragen nehmen Nachtipps an (P1, Quelle: Handschuh) | behoben | hält | 450-ms-Prellschutz und 1,5-s-Ortssperre: „Person entfernen" mit Doppeltipp 120 bis 1 400 ms folgenlos; „Alle Daten löschen", „In den Papierkorb", „Stärke übernehmen" ebenso. Die gesperrte Stelle gibt keine Rückmeldung (R5-G5, R5-S2). |
| R4-D5 Zusammenführen ohne Rückweg (Quelle: Zerstörende Handlungen) | behoben | hält | Quittung „Zusammengeführt … Stärke der Meldung 6 → 8" mit „Rückgängig"; stellt den Stand mit zwei Teilen wieder her. Doppeltipp 300 und 1 000 ms: einmal. |
| R4-D1 Geräteuhr: Löschen bei Sprung (P1, Quelle: Zerstörende Handlungen) | teilweise | teilweise, verkehrt sich an einer Stelle | Sprung ab 60 Tagen: Warnung, kein Löschen an Tag 0 (hält). Die Löschung am Tag danach beschreibt R5-D1. Neu: Auch bei gehaltener Uhr schreibt die App Stände mit dem falschen Datum, und die Korrektur, die die Warnung verlangt, macht spätere Änderungen wirkungslos (R5-E2). |

Bilanz: Alle sieben eigenen Befunde aus Runde 4 halten. R4-E2, R4-E5 und
R4-E6 ohne Einschränkung; R4-E1, R4-E3 und R4-E4 mit einer Nebenwirkung oder
Lücke daneben (R5-E3 bis R5-E7); R4-E7 nur zum Teil nachgestellt. Verkehrt hat
sich eine Behebung teilweise: Die Zusammenlegung mit „Rückgängig" (R4-E1) hat
durch den zweiten, anders wirkenden Link im Kasten einen Weg, die neue
Erfassung zu verlieren (R5-E3). Neu sind R5-E1 (kein Fangnetz bei fehlerhaften
Daten) und R5-E2 (Stempel der Geräteuhr); R5-E2 ist die Folge von R4-D1 und
R4-E4 zusammen.
