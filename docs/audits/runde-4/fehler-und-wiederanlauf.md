# Audit „Fehler und Wiederanlauf", Runde 4 (Bedienfehler provozieren, selbst korrigieren)

Stand: 05.10.2026 · Prüfer: Rollenaudit `thw-error-recovery-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit `3dd2ab5`.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-3-Befunde.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, keine Kamera.
Jeder Lauf hatte einen eigenen Browser-Kontext mit leerem Speicher. Elf
weitere Prüfer nutzten denselben Server. Zeiten sind deshalb nur als
Abstände zwischen meinen eigenen Tipps angegeben, nicht als Ladezeiten. Die
Zustände habe ich über `localStorage`-Seeds aus `examples/thw/` hergestellt,
alle mit `uebung: false` und einem Einsatzzeitraum ab heute:

- `eeb.entwurf.v1`: eigener Bogen 013 Ulm B, 002 Biberach FGr O (B) oder
  016 Bamberg FGr W (A), offen in Schritt 1 bis 5. Für die Rückhol-Fälle
  zusätzlich `eeb.entwurf.ersetzt.v1` mit 005 Haßmersheim. Für die
  Fremd-Erfassung 025 Neu-Ulm FGr F mit `fremd.beginn` 40 Minuten zurück.
- `eeb.einsaetze.v1`: Sammlung „Hochwasser Donau" (Einsatz) mit 013 Ulm B,
  002 Biberach und 006 Karlsruhe ZTr TZ, für das Verschieben dazu
  „Übung Iller" (Übung).
- `eeb.vorlagen.v1`: Vorlagen aus 013 Ulm B und 006 Karlsruhe.

Den QR-Weg habe ich durch den inhaltsgleichen Link ersetzt („Weitere Formate
→ Link teilen", `navigator.share` gestubbt, 632 Zeichen). Dateien kamen über
„Aus Datei laden…", „Bögen einlesen…" und „Sicherung einspielen…".
Prüfdateien: leere Datei, Textdatei, Bild ohne Code, CSV, eine nach 3 000
Byte abgeschnittene Bogen-JSON und gültige Bögen. Für den Speicher gab es
zwei Stubs auf `Storage.prototype.setItem`: (a) jede Schreibung wirft
`QuotaExceededError`, (b) wie in Runde 3 wirft nur jede Schreibung unter
`eeb.*`, die einen Wert neu anlegt oder vergrößert. Doppeltipps habe ich
mit `touchscreen.tap` im Abstand von 150, 250, 300 und 700 ms an derselben
Stelle ausgelöst.

Getestet habe ich zuerst ohne Blick in frühere Berichte. Den Runde-3-Bericht
samt „Stand der Behebung" und das Runde-3-README habe ich erst danach
gelesen und die Behebungen gezielt nachgestellt. Erst danach habe ich die
schon vorliegenden Runde-4-Berichte gelesen.

Rolle: Helfer, der normale Fehler macht und danach selbst weiterkommen will.
Szenarien, jeweils als ganzer Ablauf:

1. **Eigener Bogen mit Fehlgriffen:** „Weiter" ohne Pflichtfeld, Neuladen
   mitten im Tippen, Browser-Zurück, „Verwerfen" mit und ohne belegten
   Rückholplatz, zweimal „Neuen Bogen erstellen", Doppeltipp auf „Weiter →"
   und „Zur Übersicht →", Jahresdreher im Zeitraum.
2. **Meldekopf mit Fehlgriffen:** „Einheit manuell erfassen…" ohne Namen
   übernommen. Zahlendreher „60" statt „6" Mannschaft, danach Korrektur.
   Andere Einheit desselben Orts (Ulm FGr R) und des Nachbarorts (Neu-Ulm)
   erfasst. „Eingetroffen um" 30 Minuten und 3 Stunden in der Zukunft.
   „Stärke ändern…" mit „66", „-3", „6o" und leerem Feld. Doppeltipp auf
   „In Einsatz übernehmen". Zurück, Neuladen und Wiederaufnahme einer
   halben Erfassung. Verschieben in eine Übung und „Rückgängig".
3. **Falscher Kontext:** Bei offenem eigenem Bogen einen gekürzten und
   denselben vollständigen Link zweimal geöffnet, dieselbe Bogen-Datei
   zweimal geladen. Falsche Dateien auf allen drei Datei-Wegen, gemischter
   Stapel über „Bögen einlesen…".
4. **Vorlage:** Musterung angefangen (drei Personen abgehakt), dann
   neu geladen.
5. **Speicher voll oder gesperrt:** Tippen im Assistenten, Wechsel auf die
   Startseite, Neuladen. „In Einsatz übernehmen" bei vollem Speicher. QR
   und PDF auf einem Gerät ohne Geräteschlüssel.

**Nicht prüfbar:** Kamera-Scan mit echtem Bild, USB-Handscanner,
Nahbereichs-Weitergabe, echtes Teilen über Messenger, Geräte-Zurück der
nativen Builds (nur Browser-Zurück), Bildschirmtastatur, echte Handschuhe.
Einen echt vollen Speicher habe ich nicht erzeugt, nur die beiden Stubs.
Mit Stub (b) stuft die App den Speicher als „gesperrt" statt „voll" ein,
weil auch die 1-Zeichen-Probe scheitert. Das ist ein Prüfartefakt und kein
Befund. Ob ein mobiler Browser beim Neuladen die `beforeunload`-Warnung
zeigt, lässt sich im Headless-Betrieb nicht prüfen.

## Urteil

Die Runde-3-Lücken sind zu. Ein voller Speicher auf einem frischen Gerät
liefert QR-Code und PDF mit einem Sitzungs-Siegel. Eine unbrauchbare Datei
lässt den Rückholplatz in Ruhe. Eine namenlose Erfassung springt ins
Namensfeld. Der gemischte Stapel meldet Erfolg und Fehler zusammen. Eine
Eintreffzeit in der Zukunft fragt an der Karte nach. Verschieben in eine
Übung nennt die Folge und bietet „Rückgängig". Neuladen, Zurück und eine
abgebrochene Erfassung kosten keine Eingabe. Die Rückfragen beim Verdrängen
nennen den Bogen, der dabei verloren geht. Dateifehler kommen in
Alltagssprache mit nächstem Schritt.

Die Reibung sitzt jetzt in Rückfragen, die einen unnötigen oder falschen Weg
vorschlagen. Erfasst der Meldekopf eine zweite Einheit desselben
Ortsverbands oder des Nachbarorts, schlägt die App „dieselbe Einheit" vor.
Der hervorgehobene erste Knopf überschreibt dann die Stärke der anderen
Einheit, und die neue Einheit fehlt in der Lage (R4-E1). Öffnet der Helfer
denselben Bogen zweimal, etwa einen Link im Chat, fragt die App, ob sie den
eigenen Bogen vom Rückholplatz löschen darf. Diese Löschung hat keinen
Nutzen (R4-E2). Kleinere Lücken: Eine Uhrzeit vom Meldeblock, die in der
Zukunft liegt, wird ohne Nachfrage auf gestern gelegt (R4-E3). „Stärke
ändern…" prüft keine Zahlendreher und bietet kein „Rückgängig" (R4-E4).
Bei gesperrtem Speicher verschweigt die Startseite, dass der angezeigte
Stand nicht gespeichert ist (R4-E5).

Den eigenen Bogen und die Meldekopf-Aufgaben schafft der Helfer ohne
fremde Hilfe. Einen Fehlgriff bei der Ähnlichkeitsfrage bemerkt er
allerdings nur, wenn er die Summe nachrechnet. Den Rückweg über „Historie →
Fassung verwerfen…" findet er ohne Einweisung kaum.

## Befunde

### R4-E1 [P1] „Ist das dieselbe Einheit?" schlägt bei verschiedenen Einheiten desselben Orts das Zusammenlegen vor, und der vorbelegte Knopf überschreibt die andere Einheit (neu)

**Priorität:** P1

**Kennzeichnung:** gemessen (Speicher und Kopfzahlen vor und nach der
Antwort ausgelesen).

**Fundstelle / Aufgabe:** Sammlung „Hochwasser Donau" mit „THW Ulm
Bergungsgruppe" (0 / 2 / 6 / 8) → „Einheit manuell erfassen…" → eine andere
Einheit → „In Einsatz übernehmen". Code: `src/app/app.tsx`, um Zeile 1527 bis
1575 (Ähnlichkeitsprüfung vor `meldungAufnehmen`). Dort reichen gleiche
Organisation und `aehnlicherOrt()`. `src/app/nacherfassung.tsx`,
`ortWoerter()`/`aehnlicherOrt()`: „Neu-Ulm" zerfällt in „neu ulm" und
enthält damit „ulm". Der Einheitstyp spielt keine Rolle.

**Beobachtung:**

- „Ulm" + „Fachgruppe Räumen", nur Stärke 0 / 3 / 9: Die Rückfrage lautet
  „Ist das dieselbe Einheit? In diesem Einsatz steht schon ‚THW Ulm
  Bergungsgruppe' (Stärke 0 / 2 / 6 / 8). Die neue Meldung heißt ‚THW Ulm
  Fachgruppe Räumen'." Der erste Knopf ist dunkel hervorgehoben: „Ja — nur
  die Stärke von ‚THW Ulm Bergungsgruppe' ändern (0 / 2 / 6 / 8 → 0 / 3 / 9 /
  12)". Danach folgen „Ja — als neue Fassung …", „Nein — als eigene Einheit
  führen" und „Abbrechen".
- „Neu-Ulm" + „Fachgruppe Führung", nur Stärke: dieselbe Frage zu „THW Ulm
  Bergungsgruppe", wieder mit „Ja — nur die Stärke … ändern" vorn.
- Vollständiger Bogen 025 Neu-Ulm FGr F aus einer angefangenen Erfassung:
  Der erste, hervorgehobene Knopf ist „Ja — als neue Fassung von ‚THW Ulm
  Bergungsgruppe'".
- Auf „Ja — nur die Stärke ändern" (Ulm FGr R): Kopf weiter „3 Einheiten",
  Quittung „Zuletzt eingelesen: ‚THW Ulm Bergungsgruppe' — Folgemeldung:
  Stärke 9 → 12 (+3)". Eine Karte „Ulm Fachgruppe Räumen" gibt es nicht. Die
  Quittung nennt den Namen der alten Einheit, nicht den der eben erfassten.
  Ein „Rückgängig" gibt es nicht.
- Zurück kommt man über „Aufklappen → Historie → Fassung verwerfen… →
  Fassung verwerfen". Danach steht Ulm B wieder mit 0 / 2 / 6 / 8 da. Die
  verworfene Erfassung der FGr R ist dann weg und muss neu erfasst werden.

**Erwartung der Rolle:** Zwei Fachgruppen aus demselben Ortsverband sind
zwei Einheiten. Ulm und Neu-Ulm sind zwei Ortsverbände. Fragt die App
trotzdem nach, liegt der sichere Weg vorn: „eigene Einheit".

**Auswirkung im Einsatz:** Am Meldekopf treffen oft mehrere Teileinheiten
eines Ortsverbands nacheinander ein (B, FGr R, FGr N). Ulm und Neu-Ulm
liegen direkt nebeneinander. Wer unter Zeitdruck den vorgeschlagenen Knopf
tippt, verliert eine Einheit aus der Lage, und die Stärke der anderen ist
falsch. Die Kopfzahl bleibt plausibel, die Quittung nennt den alten Namen.
Der Fehler fällt erst auf, wenn die eingetroffene Fachgruppe nach ihrem
Auftrag fragt.

**Empfehlung:** Den Einheitstyp in den Vergleich nehmen. Bei
unterschiedlichem Typ nicht fragen, oder „eigene Einheit" als ersten,
hervorgehobenen Weg anbieten. Ortsnamen nur als ganzes Wort vergleichen,
damit „Neu-Ulm" nicht „Ulm" trifft. Bei „Albstadt" ↔ „Albstadt-Ebingen" ist
der Fall weniger klar. Nach jedem „Ja" eine Quittung mit beiden Namen und
„Rückgängig" zeigen.

**Nachprüfung:** Sammlung mit Ulm B. „Ulm / Fachgruppe Räumen" und
„Neu-Ulm / Fachgruppe Führung" erfassen. Entweder kommt keine Rückfrage,
oder der erste hervorgehobene Weg ist „eigene Einheit". Nach einem „Ja"
bietet die Quittung „Rückgängig".

### R4-E2 [P1] Denselben Bogen zweimal öffnen löscht den eigenen Bogen vom Rückholplatz für eine Kopie (neu; Rest von R3-E2)

**Priorität:** P1

**Kennzeichnung:** gemessen (`eeb.entwurf.v1` und
`eeb.entwurf.ersetzt.v1` nach jedem Schritt ausgelesen).

**Fundstelle / Aufgabe:** Startseite mit eigenem Entwurf (Biberach, Ort
„EIGENER BOGEN Biberach" bzw. Bamberg). Derselbe Ulm-Link wird zweimal
geöffnet, oder dieselbe Ulm-Datei zweimal über „Aus Datei laden…". Code:
`src/app/app.tsx`, `darfBogenErsetzen()` und `merkeVerdraengt()`. Die
Kopie-Sperre aus R3-E2 vergleicht nur den Rückholplatz mit dem offenen
Bogen. Ob der eintreffende Bogen dem offenen gleicht, prüft sie nicht.

**Beobachtung:**

- Erstes Öffnen: Rückfrage „Empfangenen Bogen öffnen?" bzw. „Bogen aus Datei
  öffnen?". Danach ist Ulm offen und Biberach (Bamberg) liegt auf dem
  Rückholplatz. Das ist richtig.
- Zweites Öffnen, inhaltsgleich: „Der angefangene Bogen ‚THW Ulm
  Bergungsgruppe' wird durch die empfangene Meldung ersetzt. … Der dort
  bisher liegende Bogen ‚THW Biberach/Riß Fachgruppe Ortung (B)' (Stand …
  · 11 Personen · ‚EIGENER BOGEN Biberach') wird dabei endgültig gelöscht."
  Der rote Knopf „Meldung öffnen" hat beim Link den Fokus.
- Nach „Meldung öffnen" bzw. „Datei öffnen" enthält der Speicher Ulm / Ulm.
  Die Startseite zeigt zweimal „THW Ulm Bergungsgruppe", einmal als
  offenen Bogen und einmal als „Zuletzt verdrängter Bogen". Der eigene
  Bogen ist in keinem Schlüssel mehr.

**Erwartung der Rolle:** Tippe ich dieselbe Meldung noch einmal an, sehe
ich sie einfach wieder. Mein eigener Bogen bleibt, wo er ist.

**Auswirkung im Einsatz:** Ein Link im Gruppenchat wird leicht zweimal
geöffnet, beim Zurückscrollen oder weil der erste Tipp scheinbar nicht
ankam. Die Rückfrage ist ehrlich, aber lang (sieben Zeilen am Telefon), und
der rote Knopf ist vorausgewählt. Wer liest „Ulm wird durch Ulm ersetzt"
und tippt, verliert seinen eigenen Bogen für nichts.

**Empfehlung:** Gleicht der eintreffende Bogen dem offenen, gar nicht
fragen, den offenen Bogen zeigen und „Dieser Bogen ist schon offen" melden.
Den Fokus in Rückfragen mit Verlust auf „Abbrechen" setzen.

**Nachprüfung:** Eigener Bogen A, Link B öffnen und bestätigen, Link B noch
einmal öffnen: keine Rückfrage, A bleibt auf dem Rückholplatz. Ebenso mit
derselben Datei.

### R4-E3 [P2] „Eingetroffen um" in der Erfassung legt eine Uhrzeit in der Zukunft ohne Nachfrage auf gestern (neu; Umfeld R3-E5)

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Sammlung (angelegt vor 90 Minuten) → „Einheit
manuell erfassen…" → „Eingetroffen um (vom Meldeblock)" 21:12 bei
Prüfzeit 20:42 (Stundendreher 20 ↔ 21) → „In Einsatz übernehmen". Code:
`src/app/nacherfassung.tsx`, `eintreffzeitAusUhrzeit()`. Liegt eine
Uhrzeit mehr als 15 Minuten in der Zukunft, nimmt die Funktion immer den
Vortag.

**Beobachtung:** Keine Rückfrage, kein Hinweis am Feld. Die Karte zeigt
„eingetroffen 04.10.2026, 21:12", also fast 24 Stunden vor der Erfassung und
vor dem Anlegen des Einsatzes. Mit 23:41 (drei Stunden voraus) ist es
genauso. An der Karte („ändern") fragt dieselbe Eingabe dagegen „Stimmt die
Zeit? Eingetroffen 05.10.2026, 21:39 liegt in der Zukunft — Tag oder Monat
vertauscht?".

**Erwartung der Rolle:** Vertippe ich mich beim Abschreiben vom Meldeblock,
fragt die App so nach wie an der Karte. „Gestern" ist nur kurz nach
Mitternacht plausibel.

**Auswirkung im Einsatz:** Die Einheit gilt als seit gestern vor Ort. Das
verfälscht die Sortierung nach Eintreffzeit, die Ruhezeit-Planung, das
Lageblatt und den Einsatznachweis. Weil das Datum klein neben der Uhrzeit
steht, fällt der Fehler auf der Karte kaum auf.

**Empfehlung:** Den Vortag still nur annehmen, wenn die Uhrzeit kurz vor
Mitternacht liegt und jetzt kurz danach ist, oder wenn der Einsatz schon
vor dieser Uhrzeit bestand. Sonst dieselbe Rückfrage wie an der Karte
zeigen, mit „heute HH:MM" und „gestern HH:MM" zur Wahl.

**Nachprüfung:** Um 20:42 „21:12" eintragen und übernehmen: Es kommt eine
Rückfrage, oder es wird heute 21:12 mit dem Hinweis „liegt in der Zukunft".
Um 00:20 „23:50" eintragen: still gestern, wie bisher.

### R4-E4 [P2] Stärke-Zahlendreher: „Stärke ändern…" prüft nicht, zeigt keine Summe und verliert bei Tippfehlern alle Felder; nach der Folgemeldung kein „Rückgängig" (neu)

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Karte „THW Ulm Bergungsgruppe" (0 / 2 / 6 / 8) →
„Mehr…" → „Stärke ändern…". Dazu die Folgemeldung über „Einheit manuell
erfassen…" mit „60" Mannschaft. Code: `src/app/einsaetze-ui.tsx`, um Zeile
2410 bis 2440 (`staerkeAendern`). Quittung „Zuletzt eingelesen" um Zeile
1115.

**Beobachtung:**

- Im Assistenten warnt „Nur Stärke" richtig: „⚠ Stärke: 60 Mannschaft —
  stimmt das?".
- „Stärke ändern…" nimmt „66" statt „6" ohne jede Warnung an. Der Dialog
  zeigt nur die drei Felder, keine neue Gesamtzahl und keinen Vergleich zu
  „bisher 0 / 2 / 6 / 8". Ergebnis: Karte „Stärke 0 / 2 / 66 / 68", Quittung
  ohne „Rückgängig".
- „-3", „6o" oder ein leeres Feld: Der Dialog schließt, ein Hinweis meldet
  „Bitte in jedes Feld eine ganze Zahl eintragen (0 bis 999). Nichts
  geändert." mit „Alles klar". Welches Feld falsch war, steht nicht da. Die
  übrigen Eingaben sind weg, und der Weg beginnt wieder bei „Mehr… → Stärke
  ändern…".
- Nach der Folgemeldung mit „60" (Quittung „Stärke 8 → 62 (+54)") gibt es
  ebenfalls kein „Rückgängig". Korrigieren lässt sich das über „Historie →
  Fassung verwerfen…" (fünf Tipps, mit sauberer Rückfrage) oder über
  „Stärke ändern…", das eine weitere Fassung anlegt.

**Erwartung der Rolle:** Eine Zahl, die das Zehnfache der bisherigen ist,
fällt der App auf, bevor sie in der Lage steht. Habe ich mich vertippt,
behalte ich meine Eingaben und sehe das falsche Feld. Habe ich gerade etwas
falsch übernommen, nehme ich es mit einem Tipp zurück, wie beim Abrücken.

**Auswirkung im Einsatz:** Verpflegung, Unterbringung und Gesamtstärke
springen um 54 bzw. 60 Personen. Nach der Übernahme ist die Zahl in der
Lage, bis jemand die Karte prüft. Der Rückweg über die Historie ist richtig
gebaut, aber versteckt.

**Empfehlung:** Dieselbe Plausibilitätswarnung wie im Assistenten auch in
„Stärke ändern…" zeigen, dazu die neue Summe neben der alten („8 → 68").
Fehler am Feld anzeigen und den Dialog offen lassen. Nach „Stärke ändern"
und nach einer Folgemeldung die Daumenleiste mit „Rückgängig" zeigen, wie
nach Abrücken und Verschieben.

**Nachprüfung:** „66" eintragen: Es erscheint eine Warnung und „8 → 68".
„6o" eintragen: Der Dialog bleibt offen, das Feld ist markiert. Nach der
Übernahme stellt „Rückgängig" 0 / 2 / 6 / 8 wieder her.

### R4-E5 [P2] Speicher nimmt nichts an: Startseite zeigt den ungespeicherten Stand als „gespeichert", ohne Warnung (neu; Umfeld R3-O4)

**Priorität:** P2

**Kennzeichnung:** gemessen (Stub a und b, siehe Prüfaufbau).

**Fundstelle / Aufgabe:** Entwurf Ulm B fortsetzen → Speicher fällt aus →
Name auf „Ulm-Söflingen-Nord" geändert → „‹ Startseite" → Neuladen. Code:
`src/app/app.tsx`. Die Speicherzeile mit „Nicht gespeichert" steht nur im
Assistenten. Die Startkarte setzt „· gespeichert {Uhrzeit} Uhr" um Zeile
3020 auch bei `speicherFehler`.

**Beobachtung:**

- Im Assistenten steht korrekt „⚠ Nicht gespeichert — … Letzter gesicherter
  Stand: 20:43 Uhr".
- Auf der Startseite steht die Karte „THW Ulm-Söflingen-Nord Bergungsgruppe
  · Stärke 0 / 2 / 6 / 8 · gespeichert 21:01 Uhr" mit „Fortsetzen". Ein
  Hinweis auf den Speicher fehlt (Text nach „Nicht gespeichert" und „voll"
  durchsucht).
- Nach dem Neuladen (die `beforeunload`-Frage im Test bestätigt) heißt der
  Bogen wieder „THW Ulm Bergungsgruppe". Die Änderung ist weg.

**Erwartung der Rolle:** Wenn etwas nicht gespeichert ist, sagt das jede
Seite, die den Bogen zeigt, besonders die, von der aus ich die App
schließe.

**Auswirkung im Einsatz:** Der Helfer geht nach dem Ausfüllen auf die
Startseite, sieht seinen neuen Namen mit „gespeichert" und schließt die App.
Viele mobile Browser zeigen die `beforeunload`-Frage nicht. Beim nächsten
Öffnen steht der alte Stand da, ohne Hinweis, dass etwas fehlt.

**Empfehlung:** Die Speicherzeile auch an der Startkarte zeigen („nicht
gespeichert — letzter gesicherter Stand 20:43 Uhr, jetzt PDF oder QR
übergeben"). Die Startkarte nicht mit dem ungespeicherten Stand beschriften,
ohne das zu sagen.

**Nachprüfung:** Speicher sperren, im Bogen tippen, auf die Startseite
wechseln. Die Karte nennt den Speicherfehler und den letzten gesicherten
Stand.

### R4-E6 [P3] „Verschieben…" in eine Sammlung, die denselben Bogen schon führt: still zusammengelegt, „Rückgängig" nimmt deren Eintrag mit (neu; Umfeld R3-E6)

**Priorität:** P3

**Kennzeichnung:** gemessen (beide Sammlungen über die Oberfläche mit
derselben Datei `ulm-echt.json` befüllt, Speicher ausgelesen).

**Fundstelle / Aufgabe:** „Übung Iller" führt Ulm B, „Hochwasser Donau"
führt Ulm B und Biberach (gleiche Eintrags-ID, weil inhaltsgleich). In der
Donau-Sammlung: „Mehr… → Verschieben… → Übung Iller", danach „Rückgängig —
zurück nach ‚Hochwasser Donau'". Code: `src/app/einsaetze-ui.tsx`
(Verschieben) und der Kern `vendor/bos-meldekopf`, der Einträge über die
Eintrags-ID abgleicht.

**Beobachtung:** Der Dialog nennt die Folge richtig („verliert 8 Helfer",
„zählt in keiner Lage mehr"), erwähnt aber nicht, dass Ulm in der Übung
schon steht. Danach hat die Übung einen Ulm-Eintrag. Nach „Rückgängig"
steht Ulm wieder in „Hochwasser Donau", „Übung Iller" ist leer. Deren
eigener Ulm-Eintrag mit eigenen Zeiten ist weg.

**Erwartung der Rolle:** „Rückgängig" stellt beide Sammlungen so her, wie
sie vorher waren.

**Auswirkung im Einsatz:** Selten. Es braucht denselben unveränderten Bogen
in zwei Sammlungen, etwa nach einer Übung am Vortag. Es geht nur der
Übungseintrag verloren, die Lage stimmt.

**Empfehlung:** Steht die Einheit im Ziel schon, das im Dialog sagen
(„dort schon gemeldet — wird zusammengeführt"). „Rückgängig" soll den
vorigen Zielzustand wiederherstellen.

**Nachprüfung:** Wie oben. Nach „Rückgängig" führen beide Sammlungen je
einen Ulm-Eintrag.

### R4-E7 [P3] Kleinere Stellen beim Wiederanlauf (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen, je Punkt.

**Fundstelle / Aufgabe und Beobachtung:**

- **Musterung überlebt kein Neuladen:** Vorlage „Einsatz vorbereiten", drei
  von acht Personen abgehakt („Einsatz starten · 5 Pers · 2 Fz"), Neuladen.
  Die Startseite steht ohne Hinweis da, die Auswahl ist weg. Bei einem Zug
  mit 30 Personen ist das eine Minute Arbeit. Der Bogen selbst überlebt
  jedes Neuladen.
- **Gekürzter Link:** „Der geöffnete Link enthält keinen gültigen
  Erfassungsbogen." Ein nächster Schritt fehlt, etwa „Link vermutlich
  abgeschnitten — QR-Code oder PDF anfordern". Die Dateiwege sagen das
  schon.
- **Voller Speicher in der Fremd-Erfassung:** Die Zeile rät „bitte jetzt
  ‚Bogen übergeben' (PDF)". Am Meldekopf ist die PDF des fremden Bogens
  nicht der Rettungsweg. Die Stärke gehört auf den Meldeblock, und der
  Speicher muss frei werden. Die zweite Zeile („Platz schafft nur Löschen
  …") stimmt.

**Erwartung der Rolle:** Kurze Arbeitsschritte überleben ein Neuladen. Jede
Fehlermeldung sagt, was als Nächstes zu tun ist, und zwar passend zur
Rolle.

**Auswirkung im Einsatz:** Zeitverlust, kein Datenverlust in der Lage.

**Empfehlung:** Die Musterungsauswahl wie den Entwurf sichern. Die
Link-Meldung um den nächsten Schritt ergänzen. In der Fremd-Erfassung bei
vollem Speicher „Stärke auf dem Meldeblock notieren" statt PDF empfehlen.

**Nachprüfung:** Jeden Punkt wie beschrieben nachstellen.

## Bestätigt aus anderen Runde-4-Berichten

Unabhängig beobachtet und hier nicht noch einmal gezählt:

- **R4-S1 [P2]** Zurück bei offener Rückfrage: Bei mir blieb „Stärke
  ändern" mit der eingetippten „7" über der Startseite stehen.
  „Stärke übernehmen" wirkte von dort auf die Sammlung (Startseite danach
  „Stärke 1 / 5 / 18 / 24"), ohne Quittung. Die Rückfrage „Ist das dieselbe
  Einheit?" blieb nach Zurück ebenso stehen.
- **R4-S2 [P3]** Doppeltipp auf „Weiter →" in Schritt 1 mit 150, 300 und
  700 ms: Schritt 3 öffnet, Schritt 2 (mit „Dies ist eine Übung" und Ort)
  bleibt ungesehen. „Zur Übersicht →" doppelt getippt bleibt folgenlos.
- **R4-N1 [P2]** steht neben R4-E1: Dort geht es um die Rückfrage für
  dieselbe Einheit, hier um die Ähnlichkeitsfrage für verschiedene
  Einheiten.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Neuladen und Zurück:** Ein angefangener Name übersteht das Neuladen
  sofort („Entwurf vom … wiederhergestellt"). Eine angefangene Erfassung
  bietet nach Zurück „Angefangene Erfassung für diesen Einsatz … Weiter
  erfassen" und kommt nach dem Neuladen in ihrer Sammlung zurück.
- **Verwerfen und Neu anfangen:** „Verwerfen" fragt, nennt den Rückholplatz
  und quittiert „Angefangener Bogen verworfen — Rückholung unten auf der
  Startseite". Der zweite Wechsel nennt den Bogen, der dabei endgültig
  gelöscht wird, mit Stand, Personenzahl und Ort. Der Knopf ist dann rot.
- **Pflichtfeld:** „Weiter" ohne Namen sperrt nicht, Schritt 1 zeigt
  „offen". „In Einsatz übernehmen" ohne Namen: „Name der Einheit fehlt …
  Zum Namensfeld". Stärke 0: „Stärke fehlt" mit „Stärke eintragen".
- **Doppeltipp:** „In Einsatz übernehmen" mit 250 ms: genau eine Meldung.
  Ein Tipp auf einen Rückfrage-Knopf 400 ms nach dem Öffnen wirkte nicht
  (Prellschutz, siehe auch handschuh-bedienung.md).
- **Eintreffzeit:** Liegt der Beginn der Erfassung mehr als fünf Minuten
  zurück, fragt die App „Wann ist die Einheit eingetroffen? Um 20:14
  (Beginn der Erfassung) / Jetzt, 20:54".
- **Korrektur über die Historie:** „Fassung verwerfen?" nennt, welcher Stand
  danach gilt („Gültig ist dann wieder Stand 18.07.2026 … 0 / 2 / 6 / 8"),
  mit „Rückgängig" danach.
- **Dateiwege:** Textdatei, Bild, leere Datei und CSV: „stammt nicht aus
  dieser App". Abgeschnittene JSON: „beschädigt oder unvollständig …".
  Einzelbogen bei „Einsatz importieren…": „Keine Einsatz-Sammlung in der
  Datei … Dafür einen neuen Einsatz anlegen?". Einzelbogen bei „Sicherung
  einspielen…": „… ist ein einzelner Bogen. Er wird auf der Startseite über
  ‚Aus Datei laden…' geöffnet …". Kaputte Sicherung: „Die Daten auf diesem
  Gerät sind unverändert."
- **Speicher voll im Meldekopf:** „In Einsatz übernehmen" meldet „Speichern
  fehlgeschlagen — … Platz schafft nur Löschen", die Erfassung bleibt offen.

## Abschluss

- **Aufgabe geschafft:** eigener Bogen: ja. Meldekopf: ja, mit Umwegen bei
  der Korrektur (R4-E1, R4-E4).
- **Fremde Hilfe nötig:** nein. Den Rückweg „Historie → Fassung verwerfen…"
  findet man aber nur, wenn man die Karte kennt.
- **Größtes Missverständnis:** „Ist das dieselbe Einheit?" mit vorbelegtem
  „Ja" liest sich wie eine Bestätigung der App, dass es dieselbe Einheit ist
  (R4-E1).
- **Größtes Einsatzrisiko:** Eine eintreffende Fachgruppe verschwindet mit
  einem Tipp aus der Lage, und die Stärke der anderen Einheit desselben
  Ortsverbands stimmt nicht mehr (R4-E1).
- **Top-Priorität für die nächste Iteration:** In der Ähnlichkeitsfrage den
  Einheitstyp berücksichtigen und „eigene Einheit" vorn anbieten. Nach jedem
  Zusammenlegen oder Stärkewechsel „Rückgängig" zeigen (R4-E1, R4-E4).

## Abgleich mit Runde 3

Grundlage: [../runde-3/fehler-und-wiederanlauf.md](../runde-3/fehler-und-wiederanlauf.md)
samt „Stand der Behebung" und [../runde-3/README.md](../runde-3/README.md).

| Runde-3-Befund | Stand laut Runde 3 | Bewertung Runde 4 | Beobachtung |
| --- | --- | --- | --- |
| R3-E1 Speicher voll, kein Geräteschlüssel: QR/PDF scheitern (P1) | behoben | hält | Stub b, Bamberg, Schlüssel vorher entfernt: „Das Siegel gilt nur, solange diese Seite offen ist …", „QR-Code im Vollbild zeigen" bedienbar („3 Teile nacheinander"), „PDF erzeugen" lädt `eeb-…Bamberg….pdf` herunter, kein Programmtext. |
| R3-E2 „Aus Datei laden…" räumt den Rückholplatz vor dem Lesen (P1) | behoben | teilweise | Entwurf Bamberg, Rückholplatz Haßmersheim: abgeschnittene JSON, Bild, leere Datei und CSV ohne Rückfrage, danach Bamberg / Haßmersheim. Das hält. Die zugesagte Regel „nie eine Kopie desselben Bogens auf den Rückholplatz" greift aber nicht, wenn derselbe Bogen ein zweites Mal geöffnet wird, per Datei oder Link. Dann liegt Ulm / Ulm im Speicher, der eigene Bogen ist gelöscht (R4-E2). |
| R3-E3 Leere Erfassung wird übernommen (P2) | behoben | hält | „Name der Einheit fehlt … Zum Namensfeld", keine Karte. Weiter ohne „Rückgängig" nach einer Übernahme. Das wiegt bei R4-E1 und R4-E4 schwerer. |
| R3-E4 Gemischter Stapel: Fehler verdrängt Erfolg (P2) | behoben | hält | Schwabach + abgeschnittene JSON: „1 Bogen aufgenommen." und die Beschädigt-Zeile untereinander. Mit Bild: „2 Dateien und 1 Bild gelesen — 0 Bögen aufgenommen, 1 bereits vorhanden.", dazu beide Fehlerzeilen. Die „0" stimmt hier, weil Schwabach schon drin war. |
| R3-E5 Zukunft / Abrücken vor Eintreffen ohne Hinweis (P2) | behoben | hält, Lücke daneben | An der Karte fragt +40 min „Stimmt die Zeit? … liegt in der Zukunft". Das Feld „Eingetroffen um" in der Erfassung legt dieselbe Eingabe still auf gestern (R4-E3). |
| R3-E6 Verschieben in Übung ohne Folge und Rückweg (P3) | behoben | hält, Randfall | Dialog „… verliert 8 Helfer … als Übung zählt die Einheit in keiner Lage mehr", Quittung „Rückgängig — zurück nach ‚Hochwasser Donau'", danach wieder 23. Randfall mit demselben Bogen in beiden Sammlungen: R4-E6. |
| R3-E7 Jahresdreher erzeugt drei Hinweise (P3) | behoben | hält | 05.10.2062 – 05.10.2026: „1 offener Punkt … ‚bis' liegt vor ‚von' — 05.10.2062 liegt mehr als ein Jahr entfernt, Tippfehler im Jahr 2062?". |

Einordnung der eigenen Befunde: R4-E1, R4-E4, R4-E5 und R4-E7 sind neu.
R4-E2 ist der nicht abgedeckte Rest von R3-E2. R4-E3 und R4-E6 liegen neben
den Behebungen von R3-E5 und R3-E6, deren eigentliche Fälle halten.

Bilanz: Von sieben Runde-3-Befunden halten sechs. R3-E2 hält nur teilweise.
Verkehrt hat sich keine Behebung. Die Ähnlichkeitsfrage aus R2-A5 ist nicht
neu, ihr vorbelegter „nur die Stärke ändern"-Weg ist aber erst mit der
Behebung von R3-A1 dazugekommen. Dadurch hat ein Fehlgriff dort jetzt eine
stillere Folge als vorher (R4-E1).

## Stand der Behebung

Stand 05.10.2026, Paket 1 „Rückfragen, Links, Rückholplatz, Zurück-Geste".
Geprüft mit Typprüfung, Unit-Tests (2 446 grün), Verhaltenstests (137
Szenarien grün) und Nachmessung im Dev-Server (360 × 640,
`isMobile`/`hasTouch`, de-DE, Port 5180). Aufgeführt sind nur die Befunde
dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R4-E1 „Ist das dieselbe Einheit?" bei verschiedenen Einheiten | behoben | Zwei eingetragene, verschiedene Einheitstypen fragen nicht mehr; Orte nur vom Namensanfang verglichen („Neu-Ulm" ≠ „Ulm"). Wo noch gefragt wird, steht „Nein — als eigene Einheit führen" vorn, mit Gegenüberstellung beider Meldungen; nach „Ja" Daumenleiste mit beiden Namen und „Rückgängig" (führt die Meldung als eigene Einheit). Nachlauf: Ulm FGr R und Neu-Ulm FGr F ohne Rückfrage; Ulm ohne Typ → „Ja" → „Rückgängig" → 2 Einheiten. |
| R4-E2 Derselbe Bogen zweimal räumt den Rückholplatz | behoben | Gleicht der eintreffende Bogen dem offenen, gibt es keine Rückfrage: „Dieser Bogen ist schon offen … Nichts ersetzt." In Rückfragen mit Verlust hat „Abbrechen" den Fokus. Nachlauf (eigener Bogen Biberach, Ulm per Link offen und kalt sowie per Datei): nach dem 2. Öffnen keine Rückfrage, Speicher Ulm / Biberach. |

Stand 06.10.2026, Paket 2 „Meldungsfassungen, Exportstand, Führungssicht".
Geprüft mit Typprüfung, Unit-Tests (2 494 grün), Verhaltenstests (137
Szenarien grün) und Nachmessung im Dev-Server (360 × 640,
`isMobile`/`hasTouch`, de-DE, Port 5180; Downloads gelesen, PDF mit
`pdftotext`). Aufgeführt ist nur der Befund dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R4-E6 „Verschieben…“ in eine Sammlung, die die Einheit schon führt | behoben | Der Dialog nennt am Ziel „dort schon gemeldet, wird zusammengeführt“, die Quittung „war sie schon gemeldet; beide Stände sind zusammengeführt“. „Rückgängig“ legt die eigenen Einträge des Ziels zurück und nimmt sie aus der Ausgangssammlung wieder heraus: Beide Sammlungen führen danach je einen Eintrag, die Übung mit ihrem eigenen Auftrag (Test). |


Stand 06.10.2026, Paket 4 „Uhr, Speicher, Löschen, Offline, Zeiten".
Geprüft mit Typprüfung, Unit-Tests (2 614 grün), Verhaltenstests (137 Szenarien, 1 749 Schritte
grün) und Nachmessung im Browser (360 × 640, `isMobile`/`hasTouch`, de-DE;
Dev-Server Port 5180, für den Service Worker Produktionsbuild mit
`vite preview` Port 4174 hinter einem drosselnden Reverse-Proxy). Aufgeführt
sind nur die Befunde dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R4-E3 „Eingetroffen um" legt Zukunft still auf gestern | behoben | Gestern gilt ohne Nachfrage nur, wenn es höchstens sechs Stunden zurückliegt (23:50 um 00:20). Sonst fragt „Stimmt die Zeit?" („Eingetroffen um" 21:12 liegt in der Zukunft — Stunde oder Tag vertauscht?) mit „Heute …" und „Gestern …" zur Wahl; „Zeit korrigieren" lässt das Feld stehen. Test: 20:42 mit 21:12 und 23:41 → Rückfrage, 00:20 mit 23:50 → still gestern. |
| R4-E4 Stärke-Zahlendreher in „Stärke ändern…" | behoben | „6o", „-3" und leere Felder öffnen den Dialog mit den eingegebenen Werten wieder und nennen das Feld („nicht lesbar: Mannschaft („6o")"). „66" statt „6" fragt wie im Assistenten („Stärke: 66 Mannschaft — stimmt das?") mit „0 / 0 / 3 / 3 → 0 / 0 / 66 / 66"; auch mehr als das Dreifache warnt; „Zahlen korrigieren" geht zurück in den Dialog. Nach der Übernahme Daumenleiste „Stärke geändert: … 3 → 66" mit „Rückgängig"; die Quittung „Zuletzt eingelesen" trägt bei einer Folgemeldung ebenfalls „Rückgängig" (nimmt die Fassung heraus, die davor gilt wieder). |
| R4-E5 Startkarte zeigt ungespeicherten Stand als „gespeichert" | behoben | Bei Speicherfehler steht auf der Startkarte kein „gespeichert … Uhr" mehr, sondern als Alarm „⚠ Nicht gespeichert — der Speicher dieses Geräts ist voll. Letzter gesicherter Stand: 21:01 Uhr. Beim Schließen gehen die Änderungen verloren — jetzt „Fortsetzen" und „Bogen übergeben" (PDF oder QR-Code)." (gesperrter Speicher: eigener Wortlaut). |
| R4-E7 Kleinere Stellen beim Wiederanlauf | behoben | Musterung: Die Haken liegen unter `eeb.musterung.v1` (Kennung und Fassung der Vorlage, Wahrheitswerte je Stelle; keine Namen) und kommen nach dem Neuladen mit dem Hinweis „Deine Haken von vorhin sind wieder da" zurück; das Ende der Musterung räumt sie weg, gilt höchstens einen Tag (neuer Speicherort, in ISK 3.3 D2k und DSFA nachgetragen). Gekürzter Link: „… Er ist vermutlich unterwegs abgeschnitten worden — bitte den QR-Code oder die PDF des Absenders verwenden oder den Link neu anfordern." Fremd-Erfassung bei vollem Speicher: „bitte die Stärke jetzt auf dem Meldeblock notieren und Platz schaffen" statt „Bogen übergeben (PDF)". |
