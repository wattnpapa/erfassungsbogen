# Audit „Zerstörende Handlungen", Runde 3 (Löschen, Überschreiben, Statuswechsel)

Stand: 04.10.2026 · Prüfer: Rollenaudit `thw-destructive-action-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 33ed426.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-2-Befunde (Stand der Behebung vom 28./29.09.2026). Die Commits nach
33ed426 enthalten nur Prüfberichte.

## Prüfaufbau

Wie in Runde 2: Chromium (Playwright aus `node_modules`,
`/opt/pw-browsers/chromium`), Viewport 360 × 640 px, `isMobile`/`hasTouch`,
Locale de-DE, keine Kamera. Jeder Lauf begann mit geleertem Speicher und
einem `localStorage`-Seed aus `examples/thw/` (`uebung: false`, `stand` auf
„jetzt"):

- `eeb.entwurf.v1`: eigener Bogen „THW Ulm Bergungsgruppe" (8 Personen,
  2 Fahrzeuge, Schritt 3). Für einen Lauf mit verändertem Einsatzort
  („ECHTER EINSATZ Deichsicherung") und 5 Personen, damit er sich von der
  gleichnamigen Vorlage unterscheiden lässt.
- `eeb.vorlagen.v1`: „OV Ulm B" (Standard, 8 Personen) und „Albstadt ZTr".
- `eeb.einsaetze.v1`: „Hochwasser Donau" (Einsatz, 5 Einheiten, 42 Kräfte)
  und „Übung Herbst" (2 Einheiten). Für Entfernen mit Folgemeldung und die
  Aufräumfrist zusätzlich eine Sammlung mit zwei Fassungen von „THW Ulm"
  und eine Sammlung „Altlage Frühjahr", zuletzt geändert vor 85 bzw.
  91 Tagen.
- Für die Rückholung bei Bedarf `eeb.entwurf.ersetzt.v1` mit dem Bogen
  „THW Albstadt Zugtrupp Technischer Zug".

Bogen-Links habe ich mit `encodePayloadUrl` aus
`examples/thw/` erzeugt (Lüneburg), Sicherungs- und Einsatzdateien mit der
App selbst („Einsatz weitergeben / sichern"). Nach jeder Handlung habe ich
den Speicher nachgelesen und die Bildschirmfotos angesehen.

Szenarien:

1. **Eigener Bogen:** „Verwerfen", „Neuen Bogen erstellen", „Einsatz
   vorbereiten" → „Einsatz starten", Vorlage „Bearbeiten" → zurück →
   „Verwerfen", „Zuletzt verdrängten Bogen zurückholen", „Aus Datei
   laden…", Bogen-Link als Kaltstart und als Fragmentwechsel, Schnellerfassung
   bei belegtem Rückholplatz. Person entfernen (auch Doppeltipp), Fahrzeug
   entfernen, „Nur Stärke", „StAN-Sollplätze laden", Übersicht „Neuer
   Bogen", „In Einsatz-Sammlung ablegen…".
2. **Vorlagen:** Löschen (auch Doppeltipp), Papierkorb, „Bearbeiten" →
   Person entfernen → „Vorlage aktualisieren" → „Rückgängig", Musterung
   „‹ Abbrechen".
3. **Meldekopf:** „Abrücken" einfach und als Doppeltipp (180 ms),
   Quittungsdauer, „Entfernen" mit einer und mit zwei Fassungen,
   „Rückgängig", Quittung nach Wegnavigieren, „Aufteilen" mit
   „Rückgängig", „Verschieben…", „Einsatz löschen…", Papierkorb
   „Endgültig löschen…".
4. **Übernahme von außen:** „Einsatz importieren…" mit der eigenen
   Sammel-PDF, nachdem vor Ort eine Meldung entfernt war.
5. **Gerät:** „Sicherung einspielen…", „Alle Daten löschen" (bis zum
   Neustart), „Geräteschlüssel neu erzeugen" (bis zur Rückfrage),
   Aufräumfrist 85 und 91 Tage.

Getestet habe ich zuerst ohne Blick in frühere Berichte. Den
Runde-2-Bericht und die Tabelle „Stand der Behebung" habe ich danach
gelesen, die übrigen Runde-3-Berichte erst zum Schluss.

**Nicht prüfbar:** Kamera-Scan und Kiosk-Stapel mit echten Codes,
Nahbereichs-Weitergabe, native Builds (Geräte-Zurück, nativer Link-Empfang
`bogenLinksEmpfangen`), echte Handschuhe, echte Wartezeit der 90-Tage-Frist
(nur mit zurückdatierten Sammlungen), zwei echte Geräte an einer Sammlung.
Den Doppeltipp auf „Abrücken" habe ich nur mit 180 ms Abstand gemessen.

## Urteil

Die Runde-2-Befunde dieser Rolle sind abgestellt. „Entfernen" nimmt die
Einheit mit allen Fassungen heraus, „Rückgängig" bringt alle zurück. „Vorlage
aktualisieren" nennt die Änderung („Personen 8 → 7") und lässt sich
zurücknehmen. „Sicherung einspielen" zählt auf, was verloren geht, und bietet
vorher eine Sicherung an. Der Import fragt bei hier entfernten Meldungen nach.
Die Aufräumfrist meldet sich vorher mit der richtigen Ruhezeit und hinterher
mit dem Namen der gelöschten Sammlung. Die Quittung im Meldekopf steht jetzt
fest unten im Bild, 108 × 44 px groß, und bleibt mindestens 30 s stehen.
Rückfragen nennen jetzt auch, welcher Bogen dabei vom Rückholplatz fällt
(„Der dort bisher liegende Bogen … wird dabei endgültig gelöscht").

Reibung entsteht jetzt an den Rändern des Rückholplatzes. Wer eine Vorlage
bearbeitet und die Bearbeitung danach auf der Startseite „verwirft", löscht
den echten eigenen Bogen. Auf dem Rückholplatz liegt dann eine unveränderte
Kopie der Vorlage. Die Rückfrage sagt das zwar, nennt aber zweimal denselben
Namen. Öffnet ein Bogen-Link die App neu, wird ein belegter Rückholplatz ohne
jede Frage überschrieben. Nach „Person entfernen" steht die Quittung mit
„Rückgängig" oberhalb des Bilds, und unter dem Finger liegt schon der
nächste „Person entfernen"-Knopf.

Die Aufgaben lassen sich ohne fremde Hilfe erledigen. Der eine schwere Fall
(R3-D1) verliert einen eigenen Bogen, obwohl der Helfer nach eigenem
Verständnis nur „die Vorlage zugemacht" hat.

## Übersicht: Handlung → Bestätigung → Rückweg

Alles beobachtet bzw. im Speicher gemessen.

| Handlung | Bestätigung | Rückweg (geprüft) |
| --- | --- | --- |
| Startseite „Verwerfen" | Rückfrage mit Name, nennt Rückholplatz und ggf. den dabei gelöschten Bogen, rot | Rückholung ✓ |
| „Neuen Bogen erstellen" / Datei / Schnellerfassung bei belegtem Rückholplatz | Rückfrage nennt beide Bögen mit Stand | Rückholung des offenen Bogens ✓, der vorige Inhalt ist angekündigt weg |
| Vorlage „Bearbeiten" → zurück → „Verwerfen" | Rückfrage nennt zweimal „THW Ulm Bergungsgruppe" | **eigener Bogen weg, Vorlagen-Kopie im Rückholplatz** (R3-D1) |
| Bogen-Link, Kaltstart | keine | offener Bogen in die Rückholung ✓, **vorheriger Rückholplatz still gelöscht** (R3-D2) |
| Bogen-Link, Fragmentwechsel (App mit Entwurf gestartet) | Rückfrage mit beiden Bögen | „Abbrechen" ändert nichts ✓ (siehe aber R3-S1) |
| Person entfernen | Rückfrage mit Namen, Doppeltipp abgefangen | „Rückgängig" ✓, aber **oberhalb des Bilds** (R3-D3) |
| Fahrzeug entfernen | Rückfrage mit Kennzeichen | keiner (R3-D4) |
| „Nur Stärke" / „StAN-Sollplätze laden" | Rückfrage mit Zahl bzw. den verlorenen Namen, „Ersetzen, Namen löschen" | Zurückschalten ✓ / nicht nachgeprüft |
| Vorlage „Löschen" | keine, bewusst | Quittung mit „Rückgängig" (Textlink 74 × 30 px), Papierkorb ✓ |
| „Vorlage aktualisieren" | Rückfrage „Personen 8 → 7 …" | „Rückgängig" auf der Startseite stellt 8 Personen wieder her ✓ |
| Musterung „‹ Abbrechen" | „Musterung verwerfen? … (1 Person abgewählt)" | – |
| „Abrücken" | keine, bewusst | Quittung unten mit „Rückgängig" ✓ (≥ 15 s); „Wieder anwesend" an der Karte |
| „Entfernen" (zwei Fassungen) | Rückfrage mit Name und Stand | alle Fassungen weg, „Rückgängig" bringt alle zurück ✓; Quittung verschwindet beim Verlassen der Ansicht |
| „Aufteilen" | Formular, Pflichtfeld | Quittung mit „Rückgängig" und Hinweis auf „Zusammenführen…" ✓ |
| „Verschieben…" | Zielauswahl | Quittung „Alles klar", kein „Rückgängig" (siehe R3-E6) |
| „Einsatz löschen…" | Rückfrage mit Name und Zahl | Quittung „30 Tage rückholbar. Rückgängig", Papierkorb ✓ |
| Papierkorb „Endgültig löschen…" | zweite Rückfrage „rückgängig geht das nicht" | keiner, bewusst |
| „Einsatz importieren…" mit hier entfernter Meldung | „Hier entfernte Meldungen in der Datei … Wieder aufnehmen / Draußen lassen" | ✓ |
| „Sicherung einspielen…" | Aufzählung beider Seiten, „Vorher Sicherung erstellen…", Haken | Sicherungsdatei ✓ |
| „Alle Daten löschen" | Aufzählung, Haken, „Vorher Sicherung erstellen…" | Sicherungsdatei ✓; belegter Rückholplatz nicht genannt (R3-D4) |
| „Geräteschlüssel neu erzeugen" | Rückfrage mit Folgen für Empfänger | keiner, bewusst |
| Aufräumfrist | Hinweis auf der Startseitenkarte ab Tag 60 mit richtiger Ruhezeit | danach Nachricht mit Name und Zeitraum bis „Verstanden" ✓ |

## Befunde

### R3-D1 [P1] Vorlage bearbeiten, dann „Verwerfen": Der eigene Bogen wird gelöscht, die unveränderte Vorlagen-Kopie bleibt (neu)

**Priorität:** P1

**Nachweis:** gemessen (Speicher vor und nach jedem Schritt, zweimal
nachgestellt).

**Fundstelle / Aufgabe:** Startseite mit eigenem Bogen „THW Ulm
Bergungsgruppe" (Einsatzort „ECHTER EINSATZ Deichsicherung", 5 Personen) →
Vorlage „OV Ulm B" → „Bearbeiten" → „Vorlage bearbeiten" → ohne Änderung
„‹ Startseite" → „Verwerfen" → „Verwerfen". Code: `src/app/app.tsx`,
Verwerfen-Handler (um Zeile 1150–1172, `merkeVerdraengt`) und
`darfBogenErsetzen`/`folgenFuerOffenenBogen` (um Zeile 975–1050).

**Beobachtung:**

| Schritt | Arbeitsplatz (`eeb.entwurf.v1`) | Rückholplatz (`eeb.entwurf.ersetzt.v1`) |
| --- | --- | --- |
| Start | 5 Personen, „ECHTER EINSATZ Deichsicherung" | leer |
| nach „Vorlage bearbeiten" | 8 Personen, „Gebäudeschaden Ulm …" (Vorlage) | 5 Personen, „ECHTER EINSATZ …" |
| nach „Verwerfen" | leer | 8 Personen, „Gebäudeschaden Ulm …" (Vorlage) |

Auf der Startseite stehen nach der Rückkehr zwei Karten mit demselben Titel
„THW Ulm Bergungsgruppe" (Screenshot `52-start-vorlage-offen`). Die obere,
mit „Fortsetzen" und „Verwerfen", ist die Vorlagen-Bearbeitung. Sie trägt
keinen Hinweis „Vorlage" oder „OV Ulm B". Die Rückfrage lautet: „‚THW Ulm
Bergungsgruppe' wird geschlossen. ‚THW Ulm Bergungsgruppe' bleibt auf der
Startseite unter ‚Zuletzt verdrängten Bogen zurückholen' erreichbar. Der dort
bisher liegende Bogen ‚THW Ulm Bergungsgruppe' (Stand …) wird dabei endgültig
gelöscht." (Screenshot `34-verwerfen-dlg`). Danach liegt auf dem Rückholplatz
eine Kopie der Vorlage, die ohnehin unverändert gespeichert ist. Der echte
Bogen mit Einsatzort und Personal ist weg.

**Erwartung der Rolle:** Ich habe nur in die Vorlage geschaut und will die
Bearbeitung beenden. „Verwerfen" heißt für mich: Die Änderungen an der
Vorlage fallen weg, mein Einsatzbogen kommt zurück oder bleibt wenigstens
auf dem Rückholplatz.

**Auswirkung im Einsatz:** Plausibler Ablauf vor dem Abmarsch: Der
Gruppenführer füllt den Bogen für den laufenden Einsatz aus und schaut kurz
in die OV-Vorlage, etwa um eine Person nachzusehen. Zurück auf der Startseite
sieht er „seinen" Bogen und verwirft die vermeintliche Doppelung. Die
Warnung liest sich wie „eine ältere Kopie fällt weg". Der Bogen mit
Einsatzauftrag, Personal und Erreichbarkeiten muss neu erfasst werden, unter
Zeitdruck und ohne Rückweg.

**Empfehlung:** Eine Vorlagen-Bearbeitung darf beim Verwerfen nicht auf den
Rückholplatz. Die Vorlage ist ja gespeichert. Die Rückfrage sollte dann
„Bearbeitung der Vorlage ‚OV Ulm B' beenden? Nicht übernommene Änderungen
gehen verloren, die Vorlage bleibt unverändert. Dein Bogen ‚…' bleibt
zurückholbar" heißen. Auf der Startseite sollte die Karte als
Vorlagen-Bearbeitung erkennbar sein (Vorlagenname, „Vorlage aktualisieren"
statt „Fortsetzen"). Allgemein: Zeigt eine Rückfrage zwei Bögen mit
demselben Namen, braucht sie ein Unterscheidungsmerkmal (Einsatzort, Stand,
Personenzahl).

**Nachprüfung:** Seed wie oben, „Bearbeiten" → „‹ Startseite" →
„Verwerfen": Danach muss der Bogen mit „ECHTER EINSATZ Deichsicherung" und
5 Personen zurückholbar sein, und die Vorlage „OV Ulm B" muss unverändert
sein.

### R3-D2 [P2] Kaltstart über Bogen-Link überschreibt einen belegten Rückholplatz ohne Frage; „Abbrechen" stellt nichts wieder her (neu; Umfeld R3-S1, R3-E2)

**Priorität:** P2

**Nachweis:** gemessen (Speicher bei offenem Empfangsdialog und nach jeder
der drei Wahlen).

**Fundstelle / Aufgabe:** Eigener Bogen „THW Ulm" offen, auf dem
Rückholplatz der eigene Bogen „THW Albstadt Zugtrupp" (früher verdrängt).
Dann öffnet ein Bogen-Link (Lüneburg) die App neu, etwa aus dem Messenger
oder über die Kamera-App. Code: `src/app/app.tsx`, `VERDRAENGT_BEIM_START`
(um Zeile 512), `ersetztenEntwurfMerken` in `src/app/entwurf.ts`.

**Beobachtung:** Noch während der Dialog „Meldung von ‚THW Lüneburg
Bergungsgruppe' empfangen … Wohin damit?" offen ist, steht im Speicher
schon: Arbeitsplatz Lüneburg, Rückholplatz Ulm. Albstadt ist gelöscht. Keine
Rückfrage und kein Hinweis nennen Albstadt. Der Dialog sagt zu „Bogen öffnen"
nur „der eigene angefangene Bogen bleibt über die Startseite zurückholbar".

| Wahl im Empfangsdialog | Arbeitsplatz danach | Rückholplatz danach |
| --- | --- | --- |
| „Abbrechen" | Lüneburg (fremd) | Ulm |
| „Bogen öffnen" | Lüneburg | Ulm |
| „In ‚Hochwasser Donau' aufnehmen" | Ulm (zurückgeholt) | leer |

Albstadt ist in allen drei Fällen weg. Derselbe Link im laufenden Tab
(Fragmentwechsel, App mit Entwurf gestartet) fragt dagegen sauber: „Der dort
bisher liegende Bogen ‚THW Albstadt …' wird dabei endgültig gelöscht." Dort
lässt „Abbrechen" beide Bögen, wo sie waren. Ein zweiter Kaltstart mit einem
weiteren Link verdrängt Ulm nicht mehr (die fremde Meldung darf den eigenen
Bogen nicht vom Rückholplatz schieben), das hält.

**Erwartung der Rolle:** „Abbrechen" heißt: Es ist nichts passiert. Und
wenn ein Link einen meiner Bögen endgültig löscht, will ich das vorher
lesen, wie bei jedem anderen Weg.

**Auswirkung im Einsatz:** Wer zwei eigene Bögen führt (eigene Einheit und
Teileinheit, oder alter und neuer Einsatz), verliert den älteren, sobald ein
Kamerad einen Bogen-Link schickt und die App geschlossen war. Gemerkt wird
das erst, wenn der Bogen gebraucht wird. Nach „Abbrechen" steht außerdem der
fremde Bogen auf dem Arbeitsplatz, und auf der Startseite heißt es
„Fortsetzen" bei der fremden Einheit.

**Empfehlung:** Beim Kaltstart erst fragen, dann verdrängen, wie beim
Fragmentwechsel. Dabei nennen, welcher Bogen vom Rückholplatz fällt. Mindestens
aber muss „Abbrechen" den Ausgangszustand wiederherstellen: den eigenen Bogen
zurück auf den Arbeitsplatz, die fremde Meldung verwerfen.

**Nachprüfung:** Seed mit Arbeitsplatz Ulm und Rückholplatz Albstadt, App
über einen Bogen-Link neu öffnen, „Abbrechen": Danach Arbeitsplatz Ulm,
Rückholplatz Albstadt.

### R3-D3 [P2] Person entfernen: Die Quittung mit „Rückgängig" steht oberhalb des Bilds, unter dem Finger liegt der nächste „Person entfernen" (Rest von R2-G1)

**Priorität:** P2

**Nachweis:** gemessen (Lage der Knöpfe vor und nach dem Entfernen,
Screenshot `24-undo-360-2`).

**Fundstelle / Aufgabe:** Schritt 3 „Personal", Detail-Karten, Person 3
„Hartmann, Karsten" → „Person entfernen" → „Person entfernen". Code:
`src/app/schritte/personal.tsx`, `aendernMitRueckweg` und die Quittung an
der Kartenstelle (um Zeile 650–672 und 1000–1013).

**Beobachtung:** Der Knopf „Person entfernen" stand bei y = 250 px. Nach dem
Entfernen steht die Quittung „Hartmann, Karsten entfernt. Rückgängig" bei
y = −168 px, also 168 px oberhalb des sichtbaren Bereichs, auch nach 1,5 s
noch. Bei y = 250 px steht jetzt „Person entfernen" der nächsten Person
„Brandt". Im Bild ist nichts zu sehen, was auf das Entfernen hinweist. Ein
Doppeltipp schadet nicht, denn der zweite Tipp landet im Rückfragetext. Der
Rückweg verfällt bei jeder weiteren Änderung und beim Wechsel in einen
anderen Schritt (gemessen: nach Schritt 4 und zurück kein „Rückgängig"
mehr).

**Erwartung der Rolle:** Nach dem Entfernen sehe ich an der Stelle, auf die
ich schaue, dass die Person weg ist und wie ich sie zurückhole.

**Auswirkung im Einsatz:** Wer sich vertippt hat (falsche Karte, zweimal
„Person entfernen" in Folge), merkt es nicht, weil die Liste einfach
weiterläuft. Die Quittung ist da, aber nur nach Hochscrollen. Wer erst später
merkt, dass ein Name fehlt, hat keinen Rückweg mehr. Die Rückfrage verhindert
den Fehlgriff nicht sicher, weil sie bei jeder Person gleich aussieht und
schnell bestätigt wird.

**Empfehlung:** Die Quittung so platzieren, dass sie nach dem Entfernen im
Bild steht. Entweder die Seite auf die Quittung rollen oder wie im Meldekopf
eine feste Leiste unten mit „Rückgängig" zeigen. Der Rückweg sollte
mindestens bis zum Verlassen des Schritts bestehen bleiben.

**Nachprüfung:** 360 × 640, Person 3 entfernen: Quittung und „Rückgängig"
müssen ohne Scrollen sichtbar sein, und unter der alten Fingerposition darf
nicht unmittelbar der nächste „Person entfernen" liegen.

### R3-D4 [P3] Kleinere Lücken bei Rückweg und Aufzählung (neu)

**Priorität:** P3

**Nachweis:** beobachtet bzw. gemessen, je Punkt.

**Fundstelle / Aufgabe:** verschiedene, siehe Liste.

**Beobachtung:**
- **Fahrzeug entfernen ohne „Rückgängig":** Die Rückfrage nennt Typ und
  Kennzeichen („GKW THW-80125 entfernen?"), danach gibt es keinen Rückweg.
  Bei Personen gibt es einen. Code: `src/app/schritte/fahrzeuge.tsx`
  (um Zeile 123–140, 295).
- **Vorlage löschen:** Die Quittung „in den Papierkorb gelegt (30 Tage
  rückholbar). Rückgängig" erscheint im Bild, „Rückgängig" ist aber ein
  Textlink mit 74 × 30 px. Im Meldekopf ist der gleiche Rückweg seit der
  Behebung von R2-H4 ein Knopf mit 108 × 44 px. Code:
  `src/app/vorlagen-ui.tsx` (um Zeile 129–130).
- **„Alle Daten löschen" nennt den Rückholplatz nicht:** Mit leerem
  Arbeitsplatz und belegtem Rückholplatz steht in der Aufzählung „kein
  offener Bogen-Entwurf". Der verdrängte Bogen wird trotzdem gelöscht.
- **Aufräumfrist nur auf der Startseite:** „Wird in 5 Tag(en) automatisch
  gelöscht …" steht auf der Startseitenkarte, in der Einsatzansicht derselben
  Sammlung fehlt er.
- **Quittung nach „Entfernen" einer Meldung** verschwindet, sobald man die
  Einsatzansicht verlässt. Danach führt nur „Einsatz importieren…" mit einer
  älteren Datei zurück.

**Erwartung der Rolle:** Gleiche Handlungen haben den gleichen Rückweg in
der gleichen Größe. Eine Aufzählung vor dem Löschen nennt alles, was
verschwindet.

**Auswirkung im Einsatz:** Einzelne Unsicherheiten und Nacharbeit, etwa ein
Fahrzeug neu eintippen. Kein Verlust gemeldeter Einsatzdaten.

**Empfehlung:** „Rückgängig" auch nach Fahrzeug entfernen. Den Rückweg bei
Vorlagen als vollen Knopf gestalten. In „Alle Daten löschen" den belegten
Rückholplatz mit Namen aufführen. Die Fristwarnung auch in der
Einsatzansicht zeigen.

**Nachprüfung:** Jeden Punkt einzeln wie beschrieben nachstellen.

## Bestätigt aus anderen Runde-3-Berichten

Diese Stellen habe ich unabhängig beobachtet. Sie stehen in den genannten
Berichten und werden hier nicht als eigene Befunde gezählt:

- **R3-S1 [P0] Bogen-Link im laufenden Tab:** Mein Lauf mit einer App, die
  mit Entwurf gestartet war, fragte beim Fragmentwechsel korrekt nach und
  nannte den Rückholplatz. Das passt zum technischen Hinweis dort (Zustand
  aus dem ersten Render). Den Fall „App ohne Entwurf gestartet" habe ich
  nicht nachgestellt. Den Kaltstart-Weg mit belegtem Rückholplatz führe ich
  als R3-D2.
- **R3-S5 [P2] Doppeltipp „Abrücken":** Nach dem ersten Tipp liegt „Wieder
  anwesend" genau unter dem Finger (gemessen). Bei 180 ms Abstand blieb die
  Einheit abgerückt. Längere Abstände habe ich nicht gemessen.
- **R3-E2 [P1] „Aus Datei laden…":** Die Rückfrage nennt bei gültiger Datei
  den Bogen, der vom Rückholplatz fällt. Die unbrauchbare Datei habe ich
  nicht nachgestellt.
- **R3-E6 [P3] „Verschieben…":** gleich beobachtet. Quittung „Verschoben …
  liegt jetzt in ‚Übung Herbst'" nur mit „Alles klar", der Einsatz fällt
  von 5 auf 4 Einheiten.

## Was gut funktioniert und erhalten bleiben sollte

- **Entfernen einer Einheit mit Folgemeldung:** Rückfrage mit Name und
  Stand, danach 1 statt 2 Einheiten und 1 statt 3 Einträge im Speicher.
  „Rückgängig" in der festen Leiste unten (108 × 44 px bei y = 566 px)
  bringt alle drei Einträge zurück.
- **Quittungsleiste im Meldekopf:** fest im Daumenbereich, mindestens 30 s
  sichtbar, mit „×".
- **Ehrliche Rückfragen beim Verdrängen:** „Neuen Bogen erstellen", „Aus
  Datei laden…", Schnellerfassung und Fragmentwechsel nennen den Bogen, der
  dabei vom Rückholplatz fällt, mit Stand, und färben den Knopf rot.
- **„Vorlage aktualisieren":** „Vorlage ‚OV Ulm B' überschreiben? Personen
  8 → 7 · davon mit Namen 8 → 7 · Fahrzeuge 2", danach „Rückgängig" auf der
  Startseite, das die 8 Personen zurückbringt.
- **„Sicherung einspielen":** zählt beide Seiten auf (Sammlungen mit Namen
  und Meldungszahl, Entwurf, Dateiinhalt mit Datum), sagt „ohne Papierkorb",
  bietet „Vorher Sicherung erstellen…" an und verlangt einen Haken.
- **„Alle Daten löschen":** Aufzählung, Haken, „Endgültig löschen" bis dahin
  gesperrt, danach „Alle lokalen Daten gelöscht … Neu starten" und ein
  leerer Speicher.
- **Import mit hier entfernter Meldung:** „Ohne deine Zustimmung bleibt sie
  draußen. Wieder aufnehmen / Draußen lassen".
- **Papierkorb:** Einsatz und Vorlage mit Quittung „30 Tage rückholbar.
  Rückgängig", „Endgültig löschen…" mit eigener Rückfrage („Darin stecken
  fremde Personendaten; rückgängig geht das nicht").
- **Rückfragen mit Inhalt:** „Nur die Stärke melden?" mit Startwert,
  „StAN-Sollplätze laden?" mit den verlorenen Namen und „Ersetzen, Namen
  löschen", „Geräteschlüssel neu erzeugen?" mit Folge für Empfänger,
  „Musterung verwerfen? … (1 Person abgewählt)".
- **Doppeltipp auf Rückfragen:** Der zweite Tipp bei „Person entfernen"
  landet im Rückfragetext und bestätigt nichts. Der zweite Tipp auf
  „Löschen" einer Vorlage trifft den Titel der nachgerückten Vorlage, nicht
  deren „Löschen".

## Abschluss

- **Aufgabe geschafft:** ja. Alle Handlungen sind auslösbar, fast alle führen
  zurück. Ausnahme ist R3-D1.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die obere Karte „THW Ulm Bergungsgruppe" auf
  der Startseite ist die Vorlagen-Bearbeitung, und „Verwerfen" löscht dabei
  den eigenen Bogen mit dem gleichen Namen (R3-D1).
- **Größtes Einsatzrisiko:** Ein eigener Einsatzbogen geht verloren, obwohl
  die Rückfrage gelesen und bestätigt wurde, weil sie zwei gleichnamige Bögen
  nicht unterscheidet (R3-D1).
- **Top-Priorität für die nächste Iteration:** Eine Vorlagen-Bearbeitung
  beim Verwerfen nicht auf den Rückholplatz legen und auf der Startseite als
  solche kennzeichnen (R3-D1). Danach den Kaltstart über Links fragen
  lassen, bevor er verdrängt (R3-D2).

## Abgleich mit Runde 2

Grundlage: [../runde-2/zerstoerende-handlungen.md](../runde-2/zerstoerende-handlungen.md)
und [../runde-2/README.md → Stand der Behebung](../runde-2/README.md#stand-der-behebung).

| Runde-2-Befund | Stand laut README | Bewertung Runde 3 | Beobachtung |
| --- | --- | --- | --- |
| R2-D1 Entfernen lässt ältere Fassung zählen (P1) | behoben | hält | Einheit mit zwei Fassungen einmal entfernt: 2 → 1 Einheit, 11 → 4 Kräfte, 3 → 1 Einträge im Speicher. „Rückgängig" stellt 3 Einträge und 11 Kräfte wieder her. |
| R2-D2 Vorlage aktualisieren (P2) | behoben | hält | Rückfrage „Personen 8 → 7 …", Quittung „Vorlage ‚OV Ulm B' aktualisiert. Rückgängig" (108 × 44 px), danach wieder 8 Personen. Neu im Umfeld: R3-D1. |
| R2-D3 Sicherung einspielen (P2) | behoben | hält | Aufzählung „Sammlung ‚Hochwasser Donau' mit 5 Meldungen …", Dateiinhalt mit Datum, „Vorher Sicherung erstellen…", Haken. |
| R2-D4 Import holt Entferntes zurück (P2) | behoben | hält | Sammel-PDF erzeugt, Meldung entfernt, PDF importiert: Rückfrage „Wieder aufnehmen / Draußen lassen", Bestand bleibt bei 4. |
| R2-D5 Stille 90-Tage-Löschung (P2) | behoben | hält | 91 Tage: Nachricht mit Name, Zeitraum, Zahl der Meldungen bis „Verstanden". 85 Tage: „Wird in 5 Tag(en) … seit 85 Tagen unverändert" (vorher falsch „seit 60"). Nur auf der Startseite (R3-D4). |
| R2-D6 Aufteilen, Einsatz löschen, Musterung (P3) | behoben | hält | Aufteilen: Quittung mit „Rückgängig" und Hinweis auf „Zusammenführen…", Rückgängig 7 → 5 Einträge. Einsatz löschen von der Startseite: Quittung mit „Rückgängig". Musterung: Rückfrage mit Zahl der abgewählten Personen. |
| Verweis R2-N1/R2-E1 Ein Rückholplatz (P0) | behoben | hält, mit zwei Lücken | Alle Rückfragen nennen jetzt den Bogen, der vom Rückholplatz fällt, fremde Erfassungen verdrängen den eigenen Bogen nicht mehr. Ohne Frage bleibt der Kaltstart über Links (R3-D2). Die Vorlagen-Bearbeitung landet selbst auf dem Platz (R3-D1). |
| Verweis R2-N2 Sollplätze laden (P1) | behoben | hält (Rückfrage), Rückgängig nicht nachgeprüft | „Dabei gehen 8 eingetragene Namen verloren: Lehmann, Karsten, …", Knopf „Ersetzen, Namen löschen". |
| Verweis R2-H4 Quittung außerhalb des Bilds (P2) | behoben | hält im Meldekopf, nicht im Assistenten | Abrücken und Entfernen: feste Leiste unten. Person entfernen: Quittung bei −168 px (R3-D3). |
| Verweis R2-G1 Doppeltipp bestätigt Rückfrage (P1) | behoben | hält | Zweiter Tipp landet im Rückfragetext, nichts entfernt. Die zugehörige Quittung „an der Stelle der Karte" steht aber außerhalb des Bilds (R3-D3). |
| Verweis R2-G4 Abrücken-Doppeltipp (P2) | behoben | teilweise | Bei 180 ms hält die Sperre. Bei längeren Abständen schaltet der zweite Tipp zurück, siehe R3-S5. |
| Verweis R2-W6 Übersicht „Neuer Bogen" (P3) | behoben | hält | „Bogen schließen? Der Bogen wird geschlossen, nicht gelöscht … bleibt … erreichbar". |

Bilanz: Alle sechs eigenen Runde-2-Befunde (R2-D1 bis R2-D6) halten. Von den
verwiesenen Befunden halten R2-N2, R2-G1 und R2-W6. R2-N1/R2-E1 und R2-H4
halten mit Lücken, die hier als R3-D1 bis R3-D3 geführt sind. Bei R2-G4
hält nur der kurze Doppeltipp (siehe R3-S5).

Einordnung der eigenen Befunde: R3-D1, R3-D2 und R3-D4 sind neu. R3-D3 ist
ein Rest von R2-G1/R2-H4. R3-D2 liegt im Umfeld von R3-S1 und R3-E2. Nur als
Verweis geführt (nicht gezählt): R3-S1, R3-S5, R3-E2, R3-E6.
