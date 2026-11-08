# Prüfbericht Beispielbögen: Stress und Unterbrechung

- **Prüfer:** Rolle „Stress und Unterbrechung“ (thw-stress-test-user), erfahrener Helfer unter Zeitdruck, mit Unterbrechungen und wenig Aufmerksamkeit
- **Datum:** 2026-11-08
- **Prüfgegenstand:** nur der Bereich Beispielbögen: Abschnitt „Beispielbögen“ auf der Startseite unter „So funktioniert’s“ (Primärknopf „Beispielbögen ansehen“, Fußzeilen-Link entfallen) und Dialog „Beispielbögen“ (zugeklappte Erklärung, Register mit Bogenzahl, Pfadleiste „‹ Zurück“ / „Alle › …“, tiefe Ordner THW › Alle Einheiten aller Ortsverbände › LV › RSt › OV, Karten mit Anzeigen/PDF/Link, Ladezustand)
- **Code-Stand:** `main`, Commit `0dd56d4`, live auf `https://erfassungsbogen.app/` (Version `2026.1108.2056`); lokal nicht gebaut (privates Submodul fehlt)
- **Zählung:** P0: 0 · P1: 1 · P2: 4 · P3: 4 · Hinweise: 6
- **Kennzeichnung:** *gemessen* = im Testbrowser reproduziert, *Risiko* = abgeleitet.

## Prüfaufbau

- Playwright (`require('playwright')`, `chromium.launch()` ohne Optionen), je Lauf neuer Kontext, `isMobile`/`hasTouch`, Locale de-DE, `deviceScaleFactor` 1. Viewports 360x640 und 390x844. Skripte `b1.js` bis `b11.js` und Bildschirmfotos in `/tmp/claude-0/audit-stress/`.
- Tipps per `tap`/`touchscreen.tap`, Wischen per Mausrad im Dialog. DOM nicht verändert, keine eingeschleusten Skripte (strenge CSP).
- Unterbrechungen: Dialog mit Escape geschlossen (entspricht der Zurück-Geste unter Android), „Anzeigen“ und Rückkehr, Neuladen, Tab-Wechsel (anderer Tab im Vordergrund, 2 s).
- Langsames Netz: Baustein `beispiele-thw-ov-*` per Route um 4 s verzögert, Service Worker gesperrt.
- Offline: erst mit Netz laden, warten bis die Startseite „✓ Jetzt offline bereit. Funktioniert komplett offline“ meldet (nach rund 71 s, 549 Zusatzdateien), dann `context.setOffline(true)`.
- Szenario: Zugführer will kurz vor einer Übung den Bogen der Bergungsgruppe des THW OV Oldenburg (NI) finden und als PDF oder Link an die Helfer geben.
- Gelesen: `docs/audits/README.md`, `docs/audits/runde-21/stress-und-unterbrechung.md` (Aufbau), `src/app/fusszeile.tsx`, `src/app/app.tsx` (`BeispielboegenStart`), `scripts/precache-aufteilung.ts`, `examples/thw/ortsverbaende/README.md`.

## Annahmen

- Der Zugführer weiß, dass sein OV zum LV Bremen, Niedersachsen gehört; ob er die zuständige Regionalstelle sicher kennt, ist offen (Annahme: bei Oldenburg ja, bei kleineren OVs nicht immer).
- Der Bogen wird als Vorlage oder Anschauungsstück weitergegeben, nicht als echte Stärkemeldung; die App kennzeichnet ihn als Übung.
- Der übliche Ort für diese Aufgabe ist ein Telefon, teils ohne verlässliches Netz (Übungsgelände, Unterkunft).

## Nicht prüfbar

- Echtes Teilen-Menü (Android/iOS): Im Testbrowser gibt es kein `navigator.share`, der Link ging in die Zwischenablage.
- Echte Zurück-Geste und Wiederherstellung nach Prozessende durch das Betriebssystem (nur Escape, Neuladen, Tab-Wechsel nachgestellt).
- WebKit/iOS, native Builds, Handschuhe, Sonne, Lärm.
- Inhalt der PDF nur als Text geprüft (2 Seiten, Kopf „ÜBUNG — Dieser Bogen beschreibt keinen echten Einsatz.“).

## Urteil aus Sicht der Rolle

Mit Netz und Ortskenntnis ist der Bogen zu finden: 7 Tipps und rund 5 Wischbewegungen von der Startseite bis zur PDF (rund 1,4 s Erzeugung), „Link“ meldet „Kopiert“. Die Register sind groß, die Bogenzahl hilft beim Abschätzen. Unter Stress kostet der Weg aber unnötig viel: **keine Suche**, Vorwissen über Landesverband und Regionalstelle, jede Unterbrechung wirft zurück auf „Alle“, und neue Ebenen öffnen mitten in der Liste ohne Pfadleiste. **Ohne Netz geht es gar nicht**, obwohl die Startseite „Funktioniert komplett offline“ meldet und der Fehlertext ein Nachladen verspricht, das für diese Bögen nie kommt (BB-S1).

Weg im Szenario (360x640, gemessen):

| Schritt | Aktion | Bemerkung |
| --- | --- | --- |
| 0 | Startseite rund 1.840 px nach unten wischen (390x844: 1.823 px) | Knopf „Beispielbögen ansehen“ liegt knapp drei Bildschirme tief |
| 1 | „Beispielbögen ansehen“ | Dialog „Alle“ |
| 2 | „THW 3.634 Bögen“ | letzte Zeile, bei 360x640 am unteren Dialogrand angeschnitten (y 594 bis 646, Dialog endet bei 624) |
| 3 | „Alle Einheiten aller Ortsverbände (LV › RSt › OV)“ | darunter 101 weitere Bögen direkt auf der THW-Ebene |
| 4 | „Bremen, Niedersachsen 404 Bögen“ | 8 Landesverbände |
| 5 | „RSt Oldenburg 53 Bögen“ | 8 Regionalstellen, erst nach Wischen im Bild |
| 6 | „OV Oldenburg (NI) 9 Bögen“ | 10 OVs, erst nach Wischen im Bild |
| – | rund 2,5 Bildschirme wischen | „Bergungsgruppe“ ist die 5. von 9 Karten (Karte rund 300 px hoch) |
| 7 | „PDF“ | Datei `ov-oldenburg-ni-05-1-tz-b.pdf` nach 1,4 s |

## Befunde

### BB-S1 [P1, Offline] OV-Bögen sind offline nicht verfügbar; Startseite sagt „komplett offline“, Fehlertext verspricht ein Nachladen, das nie kommt

- **Kennzeichnung:** gemessen (`b8.js`, `b9.js`, 360x640)
- **Fundstelle / Aufgabe:** THW › Alle Einheiten aller Ortsverbände › Bremen, Niedersachsen › RSt Oldenburg › OV Oldenburg (NI) → „PDF“, ohne Netz.
- **Beobachtung:** Nach vollständigem Vorrat meldet die Startseite „✓ Jetzt offline bereit. Funktioniert komplett offline“. Offline zeigt der OV-Ordner 9 Karten mit Dateinamen statt Einheiten („ov-oldenburg-ni-05-1-tz-b“, „nicht geladen“, Stärke „—“), am Listenende „Einige Beispielbögen liegen noch nicht auf dem Gerät — sie werden mit Netz nachgeladen (siehe Offline-Zeile der Startseite).“ „PDF“ ergibt „PDF konnte nicht erzeugt werden: Dieser Beispielbogen liegt noch nicht auf dem Gerät — Beispielbögen werden nach dem ersten Laden mit Netz nachgeladen (siehe Offline-Zeile der Startseite).“ Die Ordner-Bögen sind laut `scripts/precache-aufteilung.ts` bewusst „nur auf Abruf“ und gehören nie zum Vorrat; die Offline-Zeile sagt dazu nichts. Die 101 Bögen direkt unter THW und die übrigen Organisationen gehen offline.
- **Erwartung der Rolle:** Was „komplett offline“ heißt, geht offline, oder die App sagt vorher klar: „Bögen der Ortsverbände nur mit Netz; einmal geöffnete bleiben auf dem Gerät.“
- **Auswirkung im Einsatz:** Auf dem Übungsgelände ohne Netz bekommt der Zugführer den Bogen seiner Einheit nicht. Der Text lässt ihn warten oder die Offline-Zeile suchen, die „fertig“ sagt. Dateinamen wie „…-05-1-tz-b“ machen nicht einmal erkennbar, welche Karte die Bergungsgruppe wäre.
- **Empfehlung:** Für OV-Ordner eine eigene, ehrliche Meldung („Nur mit Netz. Bereits geöffnete Bögen bleiben auf dem Gerät.“), schon beim Betreten des Ordners. Die Offline-Zeile der Startseite um diese Ausnahme ergänzen. Ohne Netz Einheit und Zug aus dem Dateinamen lesbar zeigen („Bergungsgruppe · 1. TZ“) statt der Kennung. Optional: „Diesen OV für offline merken“.
- **Nachprüfung:** Vorrat fertig laden, Netz trennen, OV Oldenburg öffnen: Hinweis nennt die Netzpflicht ohne Verweis auf die Offline-Zeile; Karten zeigen Einheitsnamen; die Startseite sagt nicht mehr pauschal „komplett offline“. Mit Netz einmal geöffnete Bögen gehen danach offline.

### BB-S2 [P2, Bedienung] Keine Suche: sechs Ebenen, Vorwissen über LV und Regionalstelle nötig

- **Kennzeichnung:** gemessen (Wegtabelle oben; `b4.js` zählt je LV 4 bis 12 Regionalstellen: NRW 12, Bayern 11, Hessen/RLP/Saarland 11)
- **Fundstelle / Aufgabe:** Dialog „Beispielbögen“, konkreten OV finden.
- **Beobachtung:** Es gibt kein Suchfeld, nur die Ordnerkette. Für 3.533 OV-Bögen aus 667 OVs führt der Weg über LV und Regionalstelle. Wer die Regionalstelle seines OV nicht kennt, tippt Regionalstellen der Reihe nach an und geht jeweils zurück. Ab Startseite: 7 Tipps und rund 5 Wischbewegungen, bei 360x640 liegen „THW“, die passende RSt und der OV jeweils am oder unter dem unteren Rand.
- **Erwartung der Rolle:** „Oldenburg“ eintippen, Treffer „OV Oldenburg (NI) · Bergungsgruppe“, PDF.
- **Auswirkung im Einsatz:** Unter Zeitdruck kostet das eine halbe bis ganze Minute volle Aufmerksamkeit; mit unbekannter RSt mehrere Fehlversuche. Der Name der Regionalstelle muss nicht zum OV passen; dann hilft nur Wissen über die Verwaltungsstruktur (Risiko).
- **Empfehlung:** Ein Suchfeld oben im Dialog über OV, Ort und Einheit (Treffer mit Pfad „LV › RSt › OV“), alternativ wenigstens eine alphabetische OV-Liste unter „Alle Einheiten aller Ortsverbände“.
- **Nachprüfung:** 360x640, Startseite: „Oldenburg Bergung“ in höchstens 4 Tipps bis zur PDF, ohne Kenntnis der Regionalstelle.

### BB-S3 [P2, Unterbrechung] Jede Unterbrechung wirft auf „Alle“ zurück

- **Kennzeichnung:** gemessen (`b4.js`, `b5.js`)
- **Fundstelle / Aufgabe:** Dialog bis OV Oldenburg navigiert, dann unterbrochen.
- **Beobachtung:** Escape (Zurück-Geste) schließt den Dialog; erneutes „Beispielbögen ansehen“ beginnt bei „Alle“. Ebenso nach „Anzeigen“ (Bogen öffnet, Dialog schließt; zurück über „‹ Startseite“, wieder wischen, wieder 6 Ebenen) und nach Neuladen (Seite steht oben, Knopf wieder rund 1.840 px tief). Nur der Tab-Wechsel hält Ordner und Bildlauf. Der Rücksprung ist im Code gewollt („beim Öffnen wieder ganz oben starten“).
- **Erwartung der Rolle:** Nach dem Wiederöffnen dort stehen, wo man war, oder mindestens ein „Zuletzt: OV Oldenburg (NI)“.
- **Auswirkung im Einsatz:** Wer zwei Bögen vergleicht (Anzeigen, zurück, nächster) oder kurz angesprochen wird und den Dialog wegwischt, macht den ganzen Weg erneut. Die Zurück-Geste ist unter Stress die häufigste Fehlbedienung.
- **Empfehlung:** Letzten Ordner für die Sitzung merken und beim Öffnen wieder anzeigen (mit „Alle“ in der Pfadleiste als Ausweg); nach „Anzeigen“ auf der Startseite einen Rückweg „Zurück zu den Beispielbögen (OV Oldenburg)“.
- **Nachprüfung:** OV Oldenburg öffnen, Escape, „Beispielbögen ansehen“: Ordner OV Oldenburg erscheint. Ebenso nach „Anzeigen“ und Rückkehr.

### BB-S4 [P2, Orientierung] Neue Ebene öffnet mitten in der Liste; Pfadleiste und „‹ Zurück“ scrollen weg

- **Kennzeichnung:** gemessen (`b10.js`, 360x640, Wischen per Mausrad)
- **Fundstelle / Aufgabe:** Ordner antippen, der erst nach Wischen im Bild war (RSt Oldenburg, OV Oldenburg).
- **Beobachtung:** Der Bildlauf des Dialogs bleibt beim Ordnerwechsel stehen. Nach dem Tipp auf „OV Oldenburg (NI)“ steht der Dialog bei 300 px; Pfadleiste (y −155) und „9 Bögen“ sind außer Bild, oben steht eine angeschnittene Karte (Bild `s-360-ov-wisch.png`). Die Pfadleiste ist nicht angeheftet (`position: static`). Von der Bergungsgruppe (Bildlauf 1.503 px) bis „‹ Zurück“ sind rund 2,5 Bildschirme hochzuwischen; auf der THW-Ebene mit 101 Karten bis zu 27.000 px.
- **Erwartung der Rolle:** Nach dem Tipp auf einen Ordner beginnt die neue Ansicht oben, mit „Du bist in: … › OV Oldenburg (NI)“ und der Bogenzahl. „Zurück“ ist immer erreichbar.
- **Auswirkung im Einsatz:** Nach einem Blick weg ist unklar, ob der Tipp gewirkt hat und in welchem OV man ist; die Karten nennen zwar „Oldenburg (NI)“, aber erst in der zweiten Zeile. Zurück kostet Wischen statt einen Tipp.
- **Empfehlung:** Beim Ordnerwechsel nach oben springen; Pfadleiste oder wenigstens „‹ Zurück“ mit dem aktuellen Ordnernamen am Dialogkopf festhalten.
- **Nachprüfung:** 360x640, in RSt Oldenburg wischen, „OV Oldenburg (NI)“ antippen: Pfadleiste und „9 Bögen“ im Bild. Von der letzten Karte aus „‹ Zurück“ ohne Wischen erreichbar.

### BB-S5 [P2, Ladezustand] THW-Ordner zeigt beim Nachladen erst 101 Bögen ohne Unterordner; der Ordner erscheint später unbemerkt oberhalb

- **Kennzeichnung:** gemessen (`b6.js`, `b7.js`, Baustein `beispiele-thw-ov` um 4 s verzögert, Service Worker gesperrt)
- **Fundstelle / Aufgabe:** Dialog öffnen und gleich „THW“ antippen, bei langsamem Netz.
- **Beobachtung:** Das Register zeigt zunächst „THW 101 Bögen“, nach rund 4 s ohne Übergang „3.634 Bögen“. Wer vorher tippt, sieht „101 Bögen · Angaben werden geladen … 0 von 101“ ohne den Ordner „Alle Einheiten aller Ortsverbände“; zum Nachladen der Ortsverbände gibt es keine Anzeige. Hat er schon gewischt, erscheint der Ordner oberhalb außer Bild (Bildlauf springt von 623 auf 737 px, die sichtbare Karte bleibt stehen). Die 101 Bögen dieser Ebene enthalten keinen Bogen des OV Oldenburg außer „Verstärkter Bergungszug Oldenburg (NI)“ als 101. Karte am Ende.
- **Erwartung der Rolle:** „Ortsverbände werden geladen …“ an der Stelle, an der der Ordner erscheinen wird.
- **Auswirkung im Einsatz:** Plausible, aber falsche Folgerung: „Es gibt nur 101 THW-Bögen, mein OV ist nicht dabei.“ Oder langes Wischen durch 101 Karten (rund 27.000 px) mit dem Verstärkten Bergungszug als einzigem Oldenburg-Treffer (BB-S6).
- **Empfehlung:** Platzhalterzeile „Alle Einheiten aller Ortsverbände – wird geladen …“ von Anfang an; Bogenzahl am Register erst nach dem Laden oder mit „…“.
- **Nachprüfung:** Baustein um 4 s verzögern, sofort „THW“: Platzhalter für den OV-Ordner sichtbar, kein Sprung der Zahl ohne Hinweis.

### BB-S6 [P3, Inhalt] Auf der THW-Ebene liegen 101 Einzelbögen neben dem OV-Ordner; derselbe OV erscheint zweimal in verschiedener Stärke

- **Kennzeichnung:** gemessen (`b3.js`, `b8.js`)
- **Fundstelle / Aufgabe:** THW-Ebene.
- **Beobachtung:** Unter dem einzigen Ordner folgen 101 Karten fiktiver Einheiten verschiedener OVs (sortiert nach Dateiname, zuletzt „Verstärkter Bergungszug Oldenburg (NI)“ 1/9/28//38). Im OV-Ordner liegt dazu die „Bergungsgruppe“ 0/2/7//9 desselben OV. Was den Unterschied macht (frei erfundene Beispiele gegen StAN-Bögen je OV), steht nirgends im Dialog, auch nicht in der zugeklappten Erklärung.
- **Auswirkung im Einsatz:** Wer zuerst auf die 101 Karten trifft, nimmt womöglich den Verstärkten Bergungszug als „unseren“ Bogen; die Stärke passt nicht zur Gruppe.
- **Empfehlung:** Die 101 Bögen in einen eigenen Ordner („Ausgewählte Beispiele“) legen oder unter dem OV-Ordner mit einer Zeile erklären.
- **Nachprüfung:** THW-Ebene zeigt nur Ordner mit sprechenden Namen; jede OV-Einheit hat einen eindeutigen Ort.

### BB-S7 [P3, Layout] Dialog wechselt zwischen den Ebenen Höhe und Lage

- **Kennzeichnung:** gemessen (`b11.js`, 390x844)
- **Beobachtung:** „Schließen“ steht auf „Alle“ bei y 115 (Dialog mittig, 648 px hoch), auf THW bei 33, auf „Alle Einheiten“ bei 35, auf Bremen, Niedersachsen bei 50, auf RSt/OV bei 33.
- **Auswirkung im Einsatz:** Kopf und „‹ Zurück“ springen; wer im Takt tippt, trifft beim nächsten Schritt daneben.
- **Empfehlung:** Dialog auf Telefonen in fester Höhe ab oben.
- **Nachprüfung:** 390x844, alle Ebenen: „Schließen“ an derselben y-Position.

### BB-S8 [P3, Layout] Pfadleiste wächst auf ein Drittel des Bildes; „Alle“ und „THW“ sind schmale Ziele

- **Kennzeichnung:** gemessen (`b3.js`, `b4.js`, 360x640)
- **Beobachtung:** Auf OV-Ebene ist die Pfadleiste 235 px hoch (37 % von 640), weil „Alle Einheiten aller Ortsverbände (LV › RSt › OV)“ zwei Zeilen braucht und jede Ebene eine eigene Zeile bekommt. „Alle“ ist 24x44, „THW“ 32x44 px. Kopf, Erklärungszeile und Pfadleiste lassen auf RSt-Ebene die erste Ordnerzeile erst bei y 374 beginnen.
- **Auswirkung im Einsatz:** Weniger Liste im Bild, mehr Wischen; Fehltipp zwischen „Alle“ und „THW“ wirft unnötig weit zurück (dann BB-S3-ähnlicher Neuanlauf).
- **Empfehlung:** Ordnernamen in der Pfadleiste kürzen („Ortsverbände“), Pfad in einer Zeile mit Kürzung vorn; kurze Ziele auf mindestens 44 px Breite.
- **Nachprüfung:** 360x640, OV-Ebene: Pfadleiste höchstens 2 Zeilen, alle Pfadziele mindestens 44 px breit.

### BB-S9 [P3, Missverständnis] PDF und Link geben den Übungsstand weiter (19.09.2026, erfundene Personen)

- **Kennzeichnung:** gemessen (PDF-Text, Anzeige nach „Anzeigen“, `b5.js`); Folge = Risiko
- **Beobachtung:** Die PDF der Bergungsgruppe trägt „vorgesehener Einsatzzeitraum: 19.09.2026 – 20.09.2026“, „Übung: Gebäudeschaden Oldenburg“ und neun erfundene Helfer mit 555-Rufnummern; nach „Anzeigen“ meldet die App „Einsatzzeitraum … ist vorbei“. Im Dialog steht der Hinweis „fiktive Einheiten und Personen“ nur in der zugeklappten Erklärung; die Karten sagen nichts. Kopfzeile der PDF: „ÜBUNG — Dieser Bogen beschreibt keinen echten Einsatz.“
- **Auswirkung im Einsatz:** Der Zugführer verteilt unter Zeitdruck einen Bogen mit fremden Namen und altem Datum; Helfer halten ihn für den Stand ihrer Gruppe oder müssen nachfragen. Der richtige Weg (Anzeigen, Personal und Zeitraum ändern, dann PDF/Link) ist im Dialog nicht angedeutet.
- **Empfehlung:** Über der Liste eine sichtbare Zeile „Fiktive Personen, Übungstag 19.09.2026 – für eigene Daten ‚Anzeigen‘ und anpassen“.
- **Nachprüfung:** Dialog ohne Aufklappen: Hinweis auf fiktive Personen und festes Datum im Bild.

## Hinweise (ohne Priorität)

- **H1 Seitentext scheint unter dem Dialog durch:** Bei 360x640 endet der Dialog bei y 624, darunter steht im grauen Hintergrund lesbar „Für Einsatz, Übung …“ (alle Bildschirmfotos `s-360-*`).
- **H2 „Kopiert“ steht nur 3 s am Link-Knopf** und sagt nicht, was kopiert wurde; wer wegsieht, weiß nicht, ob es geklappt hat (Testbrowser ohne Teilen-Menü; Zwischenablage enthielt den 688 Zeichen langen Link).
- **H3 Rückmeldung beim PDF:** 150 ms nach dem Tipp war weder „wird vorbereitet …“ zu sehen noch ein Knopf gesperrt; die Datei kam nach 1,4 s. Nicht eindeutig gemessen, im Gerät mit langsamerer PDF-Erzeugung nachprüfen (Doppeltipp erzeugt dann womöglich zwei Dateien).
- **H4 Tab-Wechsel hält:** Ordner, Bildlauf und Dialog bleiben nach 2 s im Hintergrund erhalten. Doppeltipp auf ein Register öffnet nur eine Ebene.
- **H5 E-Mail-Adressen wirken echt:** Die PDF nennt „OV-Oldenburg-Ni@thw.de“ und „Poststelle.RSt_Oldenburg@thw.de“ (Rufnummern dagegen erkennbar 555). Wer den Bogen als Vorlage weiterverwendet, schreibt womöglich an reale Postfächer.
- **H6 Erster Dialog bei 360x640:** „THW“, für THW-Nutzer die wichtigste Zeile, steht alphabetisch zuletzt und ist am unteren Rand angeschnitten.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (mit Netz in 7 Tipps und rund 5 Wischbewegungen; ohne Netz nein)
- **Fremde Hilfe nötig:** nein mit Netz, wenn die Regionalstelle bekannt ist; ohne Netz nicht lösbar
- **Größtes Missverständnis:** „Funktioniert komplett offline“ gilt nicht für die Bögen der Ortsverbände, und der Fehlertext verspricht ein Nachladen, das nicht kommt.
- **Größtes Einsatzrisiko:** Auf dem Übungsgelände ohne Netz ist der Bogen der eigenen Einheit nicht zu bekommen, und die Meldung führt in die falsche Richtung (BB-S1).
- **Top-Priorität für die nächste Iteration:** Suche nach OV/Ort im Dialog (BB-S2) zusammen mit einer ehrlichen Offline-Aussage für die OV-Ordner (BB-S1).
