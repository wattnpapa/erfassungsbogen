# Audit „Helfer im Feld“, Runde 7 (Feldtauglichkeit)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-field-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `a52f20a` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-6-Befunde
([../runde-6/feldtauglichkeit.md → Stand der Behebung](../runde-6/feldtauglichkeit.md#stand-der-behebung)
und [../runde-6/README.md → Stand der Behebung](../runde-6/README.md#stand-der-behebung)).
Runde 6 änderte u. a. die Fußleiste des Assistenten, den Zurück-Verlauf der
Startseitenfenster, Rückfragen, den Zwei-Fenster-Abgleich, den Lagemonitor, den
Papier-Abgleich, den Exportstand, die Geräteuhr-Rückfrage, die Offline-Zeile,
den Rückweg im Schritt Personal und die Deckel bei großer Schrift; der Bericht
prüft sie auf Nebenwirkungen im Feldweg.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE. Jeder Lauf in einem
eigenen Browser-Kontext mit frischem Speicher, weil elf weitere Prüfer
denselben Server nutzten; **Zeitangaben sind deshalb nur grob und unter Last
gemessen.** Grundeinstellung Telefon 360 × 640 px, dazu 320 × 568, quer
640 × 360 und die Breiten 560 bis 1180 px (Tablet). Browser-Zoom ist über
halbierte CSS-Pixel nachgestellt (Zoom 150 % = 240 × 427, Zoom 200 % =
180 × 320), große Schrift über `html { font-size: 200% }` (die App setzt dann
die Klasse `schrift-gross`). Bedient wurde mit `tap()` bzw. `touchscreen.tap()`;
Wartezeiten zwischen Tipps 150 ms bis 1,8 s, um die Tipp-Sperre
(1,5 s Ortssperre) zu treffen bzw. zu umgehen.

Zustände kamen über `localStorage`-Seeds mit `uebung: false` und `stand` auf
heute: Entwurf (`eeb.entwurf.v1`) aus `examples/thw/` (Bergungsgruppe Ulm mit
8 Personen, Großbogen „Verstärkter Bergungszug“ Oldenburg mit 38 Personen und
7 QR-Teilen, dazu auf 9, 12 und 13 Personen gekürzt), Vorlage
(`eeb.vorlagen.v1`, der Großbogen), Einsatz-Sammlung mit sechs THW-Bögen
(`eeb.einsaetze.v1`) und ein Uhrstand (`eeb.uhr.v1`) 100 Tage zurück bei einer
100 Tage alten Sammlung. Dass die Beispielbögen einen vergangenen
Einsatzzeitraum tragen („Zeitraum vorbei“, „Anderer Einsatz?“), ist
Seed-Wirkung und kein Befund. Skripte und Bilder liegen im Scratchpad unter
`runde7/`.

Reihenfolge: Zuerst habe ich blind geprüft — Startseite, „Neuen Bogen
erstellen“ mit Einheitstyp-Eingabe, Schritte 1 bis 6, Übersicht, „Bogen
übergeben…“, QR-Vollbild, Einsatz-Sammlung, „Einheit schnell erfassen“,
„QR-Code scannen…“ — und erst danach den Runde-6-Bericht gelesen. Die
Nachprüfung der Behebungen (H1 bis H6) und die Nebenwirkungs-Läufe folgten
nach diesem Lesen; ihre Messungen sind frisch, ihre Auswahl ist durch den
Runde-6-Bericht gelenkt. Befunde anderer Runde-7-Berichte kenne ich nicht.

Rolle: Helfer einer Bergungsgruppe, praktisch erfahren, bedient die App
selten, steht mit dem Telefon in einer Hand am Fahrzeug oder am Meldekopf und
wird zwischendurch gerufen.

Szenarien, jeweils vom natürlichen Einstieg aus:

1. **Neuen Bogen anlegen:** Startseite → „Neuen Bogen erstellen“ → Einheitstyp
   tippen und wählen → Schritte → Übersicht. Abgeschlossen: **ja**.
2. **Mit Vorlage ausrücken:** „Einsatz vorbereiten: Mein Zug“ → Musterung →
   „Alle abwählen“ → „Bogen anlegen“ (auch mit 0 Personen). Abgeschlossen:
   **ja**.
3. **Großbogen in sieben Teilen übergeben:** Übersicht → „Bogen übergeben…“ →
   „QR-Code im Vollbild zeigen“ → „Weiter zu Teil n →“ (Nachtipp nach
   150 ms), Teil 7 nach 300 ms schließen. Abgeschlossen: **ja**.
4. **Unterbrechung und Zurück:** Zurück-Geste in Assistent, Sammlung,
   Rückfrage, Fenster der Startseite („Impressum“, „Datenschutz“) und
   Musterung; „Person entfernen“ → Rückgängig über Schrittwechsel und
   Neuladen. Abgeschlossen: **ja, mit einer Ausnahme (R7-H2)**.
5. **Meldekopf:** Sammlung öffnen, „Einheit schnell erfassen“, Datei einlesen
   und „Einheit ist bereits gemeldet“ (R6-N1), „QR-Code scannen…“ ohne
   Kamera. Abgeschlossen: **ja**.
6. **Sicht und Schrift:** Startseite, Assistent, Musterung und Schnellerfassung
   bei 200 % Schrift, Zoom 150 % und 200 %, hoch und quer. Abgeschlossen:
   **mit Schwierigkeit** (R7-H1).
7. **Zwei Fenster und Geräteuhr:** zwei Seiten im selben Kontext; Uhr 100 Tage
   zurück mit alter Sammlung. Abgeschlossen: **ja**.

**Nicht prüfbar** und deshalb *nicht geprüft*: echte Handschuhe und nasse
Finger, Sonnenlicht und Dunkelheit am echten Display, Kamera-Scan (auch ob
sieben Teile am echten Gerät mit der 1,5-s-Mindestzeit sicher lesen), die
Zurück-Geste der installierten PWA (hier nur `history.back()`), Bildschirm-
tastatur und ihr Einfluss auf die untere Leiste, native Datums- und
Auswahllisten, WebKit/Safari, native Builds, echtes Drucken, Wake-Lock.

## Urteil

Der Kernweg trägt weiter: Mit Vorlage oder neuem Bogen bis zum bestätigten
QR-Code, auch beim sieben­teiligen Großbogen. Die Runde-6-Behebungen, die meinen
Weg betreffen, halten: R6-H1 (der Hinweis „Einen Moment …“ steht jetzt im
QR-Vollbild im Bild, im Browser belegt), R6-H5 (leere Musterung fragt „Keine
Person aus der Vorlage?“) und, als Teillösung, R6-H2 (die Rückfrage „Teil n
von n wurde noch nicht gezeigt“ nennt die Mindestzeit, der Haken „✓ gezeigt“
fehlt). R6-H3, R6-H4 und R6-H6 sind offen bzw. unverändert, so wie der
Bericht es sagt.

Neu und als einziges mit P2 gewertet: Die Behebung für große Schrift
(R6-M5/R6-M6, Deckel der Entwurfskarte) hat die Karte „Entwurf fortsetzen“ ab
481 px Breite zerlegt: Bei 200 % Schrift im Querformat und am Tablet bricht der
Einheitsname Buchstabe für Buchstabe um, die Karte ist 2 339 px hoch, und
„Fortsetzen“ liegt 1 457 px unter dem Seitenanfang (R7-H1). Wer mit großer
Schrift quer arbeitet, findet den Weg zu seinem angefangenen Bogen erst nach
vier Bildschirmen. Sonst sind es acht Kleinigkeiten, darunter die
Rückkehr aus der Musterung per Zurück, die die App verlässt (R7-H2), und
eine Konfliktwarnung zwischen zwei Fenstern, die bei gleicher Zeit und gleicher
Personenzahl nichts Unterscheidendes nennt (R7-H3). Kein P0, kein P1.

## Befunde

Zählung (ohne die Verweise unten): P0: 0 · P1: 0 · P2: 1 · P3: 8.

### R7-H1 [P2] Entwurfskarte bei großer Schrift ab 481 px Breite: Name bricht Buchstabe für Buchstabe, Karte 2 339 px hoch, „Fortsetzen“ vier Bildschirme tiefer (neu, Nebenwirkung R6-M5/R6-M6)

**Priorität:** P2

**Kennzeichnung:** gemessen (Breite des Textblocks, Höhe der Karte, Oberkante
von „Fortsetzen“ per `getBoundingClientRect`; Bild `o4-qG.png`).

**Fundstelle / Aufgabe:** Startseite mit angefangenem Bogen, 200 % Schrift,
Breite über 480 CSS-px (Telefon quer, Tablet). Code: `index.html`, Regeln
`html.schrift-gross .entwurf-karte …` (Zeilen 2050 bis 2055) zusammen mit der
Zeilenumbruch-Regel der Karte, die nur unter `max-width: 30rem` greift
(Zeile 2030).

**Beobachtung:** Bei 200 % Schrift (`schrift-gross` gesetzt) setzt die
Behebung R6-M6 „Fortsetzen/Verwerfen“ auf volle Breite
(`.entwurf-aktionen { width: 100% }`). Die Karte bricht aber nur bis 480 px
um (Media-Query in `rem`, also im Browser-Standard, nicht im vergrößerten
`html`). Darüber bleibt sie eine Zeile ohne Umbruch: Der Aktionsblock nimmt
die ganze Breite, der Textblock `.entwurf-text` schrumpft auf **0 px**.
Gemessen bei 640 × 360, 560 × 360, 600 × 360, 700 × 360, 844 × 390,
820 × 1180 und 1180 × 820: Karte 2 339 px, Textbreite 0 px, „Fortsetzen“
bei 1 457 px, „Einsatz vorbereiten“ (Vorlage) bei 3 184 px bei 640 × 360.
Ohne große Schrift quer: Karte 115 px, Text 283 px. Hochformat mit großer
Schrift: Karte 304 px, „Fortsetzen“ bei 542 px (360 × 640) bzw. 516 px
(320 × 568), also so, wie Runde 6 es als behoben meldet.

**Erwartung der Rolle:** Die Karte „Entwurf fortsetzen“ zeigt Name und
Fortsetzen im ersten Bild, auch quer und auch am Tablet.

**Reaktion des Helfers:** Er sieht beim Öffnen quer eine Seite aus
senkrechten Einzelbuchstaben („T / H / W / U / l / m …“), hält die App für
kaputt und sucht „Fortsetzen“ nicht dort, wo es steht.

**Folge im Einsatz:** Wer in Großschrift arbeitet (Handschuh, Brille, Sonne)
und das Telefon quer in den Halter am Fahrzeug legt, kommt nur über vier
Bildschirme Rollen zu seinem Entwurf; Tablets (Führungsstelle) sind jedes
Mal betroffen. Der Entwurf geht nicht verloren.

**Empfehlung:** Die Umbruchregel der Karte an die Klasse `schrift-gross`
koppeln (nicht nur an eine Breite in `rem`) oder die Aktionen bei großer
Schrift nur dann auf volle Breite setzen, wenn die Karte umbricht. Der
Textblock braucht eine Mindestbreite.

**Nachprüfung:** Entwurf vorhanden, `html { font-size: 200% }`, 640 × 360 und
820 × 1180: Der Name steht in Wörtern, die Karte ist unter 400 px hoch,
„Fortsetzen“ liegt im ersten Bild.

### R7-H2 [P3] Musterung: Zurück verlässt die App, statt zur Startseite zu führen (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Verlaufslänge 2 vor und nach dem Öffnen der
Musterung, Adresse nach `history.back()` ist `about:blank`). Die Geste der
installierten PWA ist nicht prüfbar (Risiko).

**Fundstelle / Aufgabe:** Startseite mit Vorlage → „Einsatz vorbereiten:
Mein Zug“ → Zurück-Geste. Code: Ansichtswechsel in `src/app/app.tsx` (die
Musterung legt keinen Verlaufseintrag an; Assistent, Einsatz-Sammlung und
Rückfragen tun es).

**Beobachtung:** Der Verlauf bleibt bei 2 Einträgen, Zurück führt auf
`about:blank`. Dagegen legen die Sammlung (Verlauf 2 → 3, Zurück führt zur
Startseite), der Assistent (jeder Schrittwechsel) und die Fenster der
Startseite („Impressum“, „Datenschutz“, Rückfrage „Löschen…“) je einen
Eintrag an und kehren richtig zurück. Die Musterung ist die Ausnahme. Die
Haken bleiben erhalten: Nach `goForward()` und nach erneutem Öffnen steht
„Deine Haken von vorhin sind wieder da — die Musterung wurde unterbrochen“.

**Erwartung der Rolle:** Zurück bricht die Musterung ab und zeigt die
Startseite, wie das sichtbare „‹ Abbrechen“ oben links.

**Reaktion des Helfers:** Er hat sich bei der Musterung vertippt, drückt Zurück
und steht außerhalb der App.

**Folge im Einsatz:** Gering; nichts geht verloren, aber der Weg zurück ist
„App neu öffnen“, in der Eile ein Stolperstein am wichtigsten Einstieg
(„ausrücken mit Vorlage“).

**Empfehlung:** Die Musterung wie die Sammlung als eigene Ansicht in den
Verlauf aufnehmen; Zurück wirkt wie „‹ Abbrechen“ (die Haken bleiben
trotzdem erhalten).

**Nachprüfung:** Startseite → „Einsatz vorbereiten“ → Zurück: Startseite
steht, Verlauf wieder 2.

### R7-H3 [P3] Zwei-Fenster-Warnung nennt bei einer Namensänderung zwei gleiche Stände (Rest von R6-S2)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Zwei Seiten im selben Browser, beide im Schritt
„Personal“; in Fenster B wird der Vorname der ersten Person geändert, Fenster
A zeigt die feste Warnleiste. Code: Konfliktwarnung in `src/app/app.tsx`
(Behebung R6-S2).

**Beobachtung:** Die Leiste (200 px von 640 px hoch, fest oben) lautet „Dieser
Bogen wurde in einem anderen Fenster geändert (dort: „THW Ulm
Bergungsgruppe“, Stand 23.10.26, 18:28 Uhr, 8 Personen · hier: Stand 23.10.26,
18:28 Uhr, 8 Personen). Eingaben hier werden erst wieder gespeichert, wenn du
entscheidest.“ Beide Stände sind gleich (Minute, Personenzahl); was sich
unterscheidet, steht nirgends. Die Knöpfe „Stand aus dem anderen Fenster
laden“ und „Meine Fassung behalten“ verlangen aber eine Entscheidung.

**Erwartung der Rolle:** Die Leiste sagt, was anders ist („Person 1:
Vorname geändert“) oder wenigstens, dass beide Fassungen sich nur in Details
unterscheiden.

**Reaktion des Helfers:** „Beide gleich — dann ist es egal?“ Er tippt „Meine
Fassung behalten“ und überschreibt vielleicht die bessere Fassung.

**Folge im Einsatz:** Gering bis mittel, selten: zwei Fenster derselben App
(Browser und installierte App) auf einem Gerät. Die Rückholung der eigenen
Fassung (R6-S1) fängt Fehlentscheidungen ab.

**Empfehlung:** Neben Zeit und Zahl den ersten Unterschied nennen (Feld und
Wert) oder „Namen, Funktionen oder Zeiten sind geändert“.

**Nachprüfung:** Name in einem Fenster ändern: Das andere nennt die Änderung.

Verweis: [stress-und-unterbrechung.md](../runde-6/stress-und-unterbrechung.md)
(R6-S2, laut Bericht „behoben“: Die Warnung nennt beide Stände mit Zeit und
Personenzahl).

### R7-H4 [P3] „Einen Moment …“ im QR-Vollbild quer verdeckt „Teil n von m“ (neu, Nebenwirkung R6-H1)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Bild `qr2-quer.png`, 150 ms nach dem ersten
Tipp).

**Fundstelle / Aufgabe:** Großbogen, QR-Vollbild bei 640 × 360, zweiter Tipp
auf „Weiter zu Teil 3 →“. Code: `src/app/tipp-schutz.ts` (`verworfenZeigen`,
Hinweis `top = Tippstelle − 72 px`).

**Beobachtung:** Der Hinweis erscheint jetzt im Bild (R6-H1 hält: im Dialog,
Deckkraft 1; hoch 360 × 640 liegt er im weißen Rand unter dem Code, die
Code-Module bleiben frei). Quer liegt die Pille über „Teil 2 von 7“ und
verdeckt die „7“ für etwa 0,9 s. Bei 200 % Schrift hoch liegt sie 49 px über
dem Knopf.

**Erwartung der Rolle:** Der Hinweis liegt nicht auf dem, was zur Orientierung
dient.

**Reaktion des Helfers:** Er liest „Teil 2 von …“ und weiß kurz nicht, wie viele
Teile es sind.

**Folge im Einsatz:** Gering; nach 0,9 s ist die Zahl wieder da.

**Empfehlung:** Die Pille im Vollbild an eine feste Stelle neben dem Knopf
(nicht über den Tipport) setzen.

**Nachprüfung:** 640 × 360, Vollbild, zweiter Tipp nach 150 ms: „Teil n von m“
bleibt lesbar.

### R7-H5 [P3] Tipp-Sperre bei Browser-Zoom ab 150 %: Der Radius von 40 CSS-px sperrt den Nachbarreiter der Schrittleiste (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Zoom nachgestellt; echter Browser-Zoom nicht
geprüft).

**Fundstelle / Aufgabe:** Assistent, Reiter der Schrittleiste nacheinander
antippen. Code: `src/app/tipp-schutz.ts` (`ORTSSPERRE_RADIUS_PX = 40`,
Ortssperre 1,5 s nach Schrittwechsel, `app.tsx`).

**Beobachtung:** Bei 360 × 640 und 320 × 568 (Reiter 44 bis 53 px breit,
Abstand der Mitten 45 bis 55 px) nimmt jeder Reiter den Tipp an (Reiter 5, 4,
3, 2 im Abstand von 600 ms). Bei Zoom 150 % (240 CSS-px, Mittenabstand 35 px)
und 200 % (180 CSS-px, 25 px) bleibt der Nachbarreiter 600 ms nach dem
ersten Tipp gesperrt: Reiter 5 → 4 wird verworfen, die Pille „Einen Moment
…“ erscheint; Reiter 3 → 2 bei 150 % ebenso.

**Erwartung der Rolle:** Ein bewusster Tipp auf den Nachbarreiter wirkt, auch
wenn der Bildschirm vergrößert ist; die Sperre schützt gegen den
Doppeltipp, nicht gegen den nächsten Reiter.

**Reaktion des Helfers:** Er tippt Reiter 4, sieht „Einen Moment …“ und tippt
noch einmal.

**Folge im Einsatz:** Gering, die Rückmeldung ist da; wer vergrößert, braucht
einen Tipp mehr.

**Empfehlung:** Den Sperrradius an die Breite des Ziels binden (halbe
Reiterbreite) oder in physischen statt CSS-Pixeln rechnen.

**Nachprüfung:** Zoom 150 %: Reiter 5 und 4 im Abstand von 700 ms springen
beide.

### R7-H6 [P3] Karten bis 12 Personen: 14 481 px bei neun, 18 760 px bei zwölf Personen; Kurz-Liste erst ab 13 (Rest von R6-H3)

**Priorität:** P3

**Kennzeichnung:** gemessen (`scrollHeight`).

**Fundstelle / Aufgabe:** Schritt 3 „Personal“, Entwurf mit 9, 12, 13 und 38
Personen (Großbogen gekürzt). Code: `src/app/schritte/personal.tsx`.

**Beobachtung:** 9 Personen: 14 481 px (Karten, rund 23 Bildschirme);
12 Personen: 18 760 px (29 Bildschirme); 13 Personen: 3 876 px (Kurz-Liste
ist Voreinstellung); 38 Personen: 8 826 px. Die Schwelle 13 und die Länge der
Karten sind unverändert gegenüber Runde 6. Die Beispielbögen tragen
Zusatzqualifikationen und Kontakte, deshalb liegen die Werte über Runde 6.

**Erwartung der Rolle:** Wer eine Person ändern will, findet sie ohne 20
Bildschirme Rollen.

**Reaktion des Helfers:** Er sucht die Person per Rollen und gibt auf.

**Folge im Einsatz:** Gering; der Normalweg („Weiter →“) berührt die Liste
nicht.

**Empfehlung:** Wie in Runde 6: Schwelle auf etwa 8 Personen senken.

**Nachprüfung:** Zwölf Personen: Schritt 3 beginnt in der Liste.

Verweis: Der Bericht der Vorrunde führt den Befund als offen
([../runde-6/feldtauglichkeit.md](../runde-6/feldtauglichkeit.md) R6-H3).

### R7-H7 [P3] Musterung: Klebende Kopfzeile nimmt bei 200 % Schrift quer fast die ganze Höhe; die Stärke-Leiste scheint durch (Rest von R6-H4)

**Priorität:** P3

**Kennzeichnung:** gemessen (Höhe der klebenden Blöcke, Bild `h4-querG.png`,
`h5-frage.png`).

**Fundstelle / Aufgabe:** Musterung mit 38 Personen, Schrift 200 % und
Telefon quer. Code: `src/app/vorlagen-ui.tsx`.

**Beobachtung:** Kopfzeile „Personal (38/38)“ mit „Alle abwählen“:
640 × 360 normal 60 px, 320 × 568 93 px, 360 × 640 mit 200 % Schrift 238 px,
640 × 360 mit 200 % Schrift 186 px bei 360 px Bildhöhe; dazu die feste Leiste
„Bogen anlegen“ (66 px). Im Bild bleibt eine Zeile Liste („Jonas Günther“).
Unter der Kopfzeile scheinen bei 360 × 640 die Trennstriche der Stärke-Leiste
durch (Bild `h5-frage.png`, oberer Rand).

**Erwartung der Rolle:** Beim Abhaken sind mindestens drei Zeilen im Bild.

**Reaktion des Helfers:** Er sieht eine Zeile und scrollt in Millimeter-
schritten.

**Folge im Einsatz:** Gering; Randfall.

**Empfehlung:** Wie in Runde 6: Bei Höhen unter 400 px die Kopfzeile nicht
kleben lassen oder auf eine Zeile bringen.

**Nachprüfung:** 640 × 360 bei 200 % Schrift: mindestens drei Zeilen Liste,
keine Reste der Stärke-Leiste unter der Kopfzeile.

Verweis: [../runde-6/feldtauglichkeit.md](../runde-6/feldtauglichkeit.md)
(R6-H4, laut Bericht offen).

### R7-H8 [P3] Erster Hauptknopf quer mit Vorlage liegt 2 px unter dem Bild (Rest von R6-H6)

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Startseite mit Vorlage, erster Besuch. Code:
Startseite in `src/app/app.tsx`.

**Beobachtung:** Oberkante von „Einsatz vorbereiten: Mein Zug“: 449 px bei
360 × 640, 440 px bei 320 × 568, 362 px bei 640 × 360 (Bildhöhe 360 px, der
Knopf 45 px hoch) — Werte genau wie in Runde 6. Der Ladehinweis „Wird für den
Offline-Betrieb geladen: 0,0 von 6,9 MB …“ steht dreizeilig über dem Knopf
(Runde 6: vier Zeilen), die Kopfzeile mit Themenleiste und der Ansichtwahl
nimmt quer 380 px.

**Erwartung der Rolle:** Im ersten Bild steht eine Handlung.

**Reaktion des Helfers:** Er sieht quer beim ersten Besuch nur Navigation und
Hinweis.

**Folge im Einsatz:** Gering; ein Wisch.

**Empfehlung:** Wie in Runde 6: Ladehinweis quer auf zwei Zeilen kürzen oder
unter den ersten Knopf setzen.

**Nachprüfung:** 640 × 360, erster Besuch mit Vorlage: Oberkante des ersten
Knopfs höchstens 320 px.

### R7-H9 [P3] Geräteuhr-Warnung bei 200 % Schrift: 1 502 px hoch, „Fortsetzen“ liegt drei Bildschirme tiefer (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (Höhe der Warnung `uhr-warnung`, 360 × 640 mit
200 % Schrift: 1 502 px; Oberkante 319 px). Der Fall selbst ist ein Seed:
Uhrstand 100 Tage zurück, Sammlung 100 Tage alt.

**Fundstelle / Aufgabe:** Startseite mit angefangenem Bogen und Sammlung,
Geräteuhr gesprungen. Code: `src/app/fusszeile.tsx` bzw. Startseite
(`uhr-warnung`).

**Beobachtung:** Die Warnung ist inhaltlich gut: „⚠ Geräteuhr prüfen: Das
Gerät zeigt den 23.10.2026, beim letzten Start war der 15.07.2026 (100 Tage
davor)… Bis du antwortest, löscht und anonymisiert die App nichts. Wenn das
Datum stimmt, wird 1 Sammlung endgültig gelöscht. Wenn die Uhr falsch geht,
bleibt alles.“ mit „Geräteuhr stimmt“ und „Uhr korrigieren“. Normal ist sie
391 px (360 × 640) bzw. 286 px (640 × 360) hoch. Bei 200 % Schrift ist sie
1 502 px hoch und schiebt „Fortsetzen“ und alle anderen Knöpfe weit nach
unten; anders als die feste Warnleiste der zwei Fenster (R6-M1) hat sie
keinen Deckel.

**Erwartung der Rolle:** Die Entscheidung steht im ersten Bild, Fortsetzen
bleibt erreichbar.

**Reaktion des Helfers:** Er will seinen Entwurf fortsetzen, sieht eine
Textwand und scrollt über die Warnung hinweg.

**Folge im Einsatz:** Gering, selten; die Warnung hält die Löschung zurück,
solange niemand antwortet.

**Empfehlung:** Bei großer Schrift Text kürzen (die zwei Entscheidungsknöpfe
zuerst) oder wie die Warnleiste deckeln.

**Nachprüfung:** Uhrstand 100 Tage zurück, 200 % Schrift: Die Warnung ist
unter 400 px hoch, beide Knöpfe im ersten Bild.

### Verweise auf andere Runde-6-Berichte

Dort zuerst festgehalten, von mir hier nachgemessen, nicht doppelt gezählt:

- **Fußleiste bei Browser-Zoom 200 %**
  ([handschuh-bedienung.md](../runde-6/handschuh-bedienung.md), R6-G2,
  „teilweise“): Im normalen Assistenten stimmt `scrollWidth` bei 180 × 320
  (Leiste 128 px = 40 %). In der **Schnellerfassung** („Aufnahme für:
  Hochwasser …“, Leiste mit „In Einsatz übernehmen“) ist die Leiste 186 px =
  58 % der Bildhöhe von 320 px, die Seite 205 statt 180 px breit, „In Einsatz
  übernehmen“ und „Weiter →“ ragen über den rechten Rand (Bild `f4-z2.png`);
  die Badge „Aufnahme für: …“ ebenfalls. Bei Zoom 150 % ist sie 186 von
  427 px (44 %), ohne Überlauf. Die Aussage der Behebung „alle Knöpfe bleiben
  im Bild“ gilt für die Schnellerfassung bei 200 % nicht.
- **„Alle abwählen“ springt, Breite ungleich**
  ([handschuh-bedienung.md](../runde-6/handschuh-bedienung.md), R6-G4,
  „behoben“, „Sprunghöhe nicht nachgemessen“): Gemessen bei 360 × 640: Nach
  dem Tipp rückt die Seite um 33 px nach oben (Knopf 382 → 349 px, erste
  Zeile 434 → 401 px, die Kopfzeile schrumpft von 93 auf 60 px, weil
  „Personal (38/38)“ zu „(0/38)“ kürzer wird); der Knopf ist mit „Alle
  abwählen“ 121 px, mit „Alle anhaken“ 113 px breit, behält die Breite also
  nicht. Bei 320 px keine Verschiebung. Die Sperre von 1,5 s (Nachtipp an
  derselben Stelle) wirkt; wer erst nach der Sperre ein zweites Mal an die
  alte Stelle tippt, trifft die erste Person der Liste.
- **Konfliktwarnung** (R6-S2): siehe R7-H3.

## Bestätigtes

- **Kernweg neuer Bogen:** „Neuen Bogen erstellen“, Einheitstyp „Bergungsgruppe“
  eintippen → Vorschläge „B – Bergungsgruppe“ und „B (ASH) …“, Übernahme der
  StAN-Vorbelegung („9 Personen (Namen offen), 2 Fahrzeuge (Kennzeichen
  offen)“ mit „Vorbelegung entfernen“). Der erste Tipp auf das Feld innerhalb
  1,5 s nach „Neuen Bogen erstellen“ wird von der Ortssperre als „Einen Moment
  …“ verworfen, weil das Feld unter dem Finger des Starttipps liegt; nach
  1,8 s funktioniert er (Verhalten gewollt, siehe `tipp-schutz.ts`).
- **QR-Vollbild (R6-H1, R6-H2):** „Teil 1 von 7“ über dem Code (323 px),
  „Weiter zu Teil 2 →“ als Hauptknopf, „← Teil 1“, „Schließen“. Zweiter Tipp
  nach 150 ms: „Einen Moment …“ steht im Bild (im Dialog), der Teil bleibt.
  Teil 7 nach 300 ms schließen: „Teil 7 von 7 wurde noch nicht gezeigt. Ein
  Teil gilt als gezeigt, wenn er mindestens 1,5 s im Bild stand. Ohne ihn hat
  die Gegenstelle den Bogen nicht.“ mit „Teil 7 von 7 zeigen“ und „Trotzdem
  schließen“. Ein einzelner Code (Ulm): Schließen → „Hat die Gegenstelle den
  Code gescannt? … Ja, gescannt — übergeben / Nicht sicher / ← Code wieder
  zeigen“. Ein Haken „✓ gezeigt“ fehlt weiterhin (R6-H2 „teilweise“).
- **Musterung leer (R6-H5):** Beide Gruppen abwählen: „Keine Person aus der
  Vorlage?“ mit „Ja, ohne Personal anlegen“ und „Zurück zur Liste“; der Text
  nennt Stärke 0 und fehlende Fahrzeuge.
- **Deckel bei großer Schrift hoch (R6-M6):** „Fortsetzen“ bei 542 px
  (360 × 640) und 516 px (320 × 568) mit Entwurf; `scrollWidth` gleich
  Bildbreite in allen Schritten bei 360, 320 und Zoom 200 % (außer
  Schnellerfassung, siehe Verweis) und 640 × 360 mit 200 % Schrift.
- **Zurück-Verlauf (R6-S3):** „Impressum“ und „Datenschutz“ legen einen
  Verlaufseintrag an (Länge 2 → 3), Zurück schließt das Fenster, die
  Startseite bleibt; per „Schließen“ geschlossen, führt das nächste Zurück
  aus der App heraus (richtig). Rückfrage „Einsatz löschen?“: Zurück schließt
  sie. Assistent: Zurück geht Schritt für Schritt zurück, dann zur
  Startseite. Sammlung: Zurück zur Startseite.
- **Rückfragen (R6-N1):** Datei einlesen, „In „Hochwasser Musterstadt“
  aufnehmen“ → „Einheit ist bereits gemeldet“ bleibt nach 100, 300, 800 und
  1 500 ms stehen und nennt Bisher/Neu mit Stand.
- **Rückweg im Schritt Personal (R6-S4):** Person entfernen (Rückfrage mit
  Namen), „Rückgängig“ bleibt nach Schrittwechsel und nach Neuladen mit
  „Fortsetzen“ sichtbar; die Stärke sinkt von 8 auf 7 Personen.
- **Geräteuhr-Rückfrage (R6-D3, R6-D7):** Bei 100 Tagen Sprung und fälliger
  Sammlung erscheint „⚠ Geräteuhr prüfen: … Bis du antwortest, löscht und
  anonymisiert die App nichts. Wenn das Datum stimmt, wird 1 Sammlung
  endgültig gelöscht. Wenn die Uhr falsch geht, bleibt alles.“ mit
  „Geräteuhr stimmt“ und „Uhr korrigieren“, ohne Folge für den Entwurf.
- **Offline-Zeile:** Erster Besuch: „⏳ Wird für den Offline-Betrieb geladen:
  1,9 von 6,9 MB — bitte mit Netz geöffnet lassen. Danach gehen Bogen, PDF,
  QR-Code und Empfang ohne Netz.“ Danach: „✓ Jetzt offline bereit für Bogen,
  PDF, QR-Code und Empfang. Beispielbögen und Themenseiten werden nachgeladen
  (19 von 508) — alle Daten bleiben auf diesem Gerät.“ Die Zeile trennt den
  Kernweg (bereit) vom Nachladen, das ist für den Helfer richtig.
- **Meldekopf:** Sammlung zeigt oben „6 Einheiten · 1 Führer · 15 Unterf. · 43
  Mannsch. · 59 gesamt“, dann „Bogen scannen… / Einheit manuell erfassen… /
  Bögen einlesen…“; „Einheit schnell erfassen“ fragt zuerst „für welche
  Sammlung?“ mit „Für „Hochwasser …“ erfassen“ als Hauptknopf.
  „QR-Code scannen…“ ohne Kamera zeigt „Dieses Gerät meldet keine nutzbare
  Kamera.“ mit USB-Handscanner-Weg und „QR aus Bild einlesen…“.

## Abgleich mit Runde 6

Grundlage: [../runde-6/feldtauglichkeit.md](../runde-6/feldtauglichkeit.md)
samt „Stand der Behebung“.

| Runde-6-Befund | Stand laut Bericht | Bewertung Runde 7 | Beobachtung |
| --- | --- | --- | --- |
| R6-H1 „Einen Moment …“ im QR-Vollbild unsichtbar | behoben (nur Unit-Test) | **hält** | Im Browser belegt: Pille im Dialog im Bild, 150 ms nach dem ersten Tipp (Hoch und quer, 200 % Schrift). Nebenwirkung: quer verdeckt sie „Teil n von m“ (R7-H4). |
| R6-H2 Rückfrage nennt Mindestzeit nicht | teilweise | **teilweise, wie gemeldet** | Text nennt „mindestens 1,5 s im Bild“; „✓ gezeigt“ im Vollbild fehlt. |
| R6-H3 Länge der Kartenliste | offen | **offen** | 9 Personen 14 481 px, 12 Personen 18 760 px, Schwelle 13 (R7-H6). |
| R6-H4 Klebende Kopfzeile der Musterung | offen | **offen** | 93 px bei 320, 238 px bei 200 % hoch, 186 von 360 px quer; Stärke-Leiste scheint durch (R7-H7). |
| R6-H5 Leere Musterung ohne Rückfrage | behoben | **hält** | „Keine Person aus der Vorlage?“ mit zwei Wegen. |
| R6-H6 Erster Hauptknopf quer mit Vorlage | teilweise | **teilweise, Lage unverändert** | 449 / 440 / 362 px wie in Runde 6; Ladehinweis dreizeilig (R7-H8). |

Zu den Runde-6-Änderungen anderer Rollen, soweit sie meinen Weg berührten:

| Runde-6-Änderung | Bewertung Runde 7 | Beobachtung |
| --- | --- | --- |
| Fußleiste des Assistenten (R6-G1) | **hält** | Keine Überlappung bei 360, 320, 640 quer, 200 % Schrift. Bei Zoom 200 % in der Schnellerfassung überläuft sie (Verweis R6-G2). |
| Zurück-Verlauf der Startseitenfenster (R6-S3) | **hält** | „Impressum“, „Datenschutz“, Rückfragen. Die Musterung fehlt (R7-H2). |
| Rückfragen (R6-N1) | **hält** | Rückfrage nach „Wohin damit?“ bleibt stehen. |
| Zwei-Fenster-Abgleich (R6-S1, R6-S2) | **teilweise** | Beide Fassungen werden genannt, bei Namensänderung gleich (R7-H3). |
| Rückweg im Schritt Personal (R6-S4, R6-D4) | **hält** | Über Schrittwechsel und Neuladen. |
| Deckel bei großer Schrift (R6-M5, R6-M6) | **hält hoch, verkehrt quer** | Hochformat wie gemeldet; ab 481 px Breite Entwurfskarte zerlegt (R7-H1). |
| Geräteuhr-Rückfrage (R6-D3, R6-D7) | **hält** | Bei 200 % Schrift 1 502 px hoch (R7-H9). |
| Offline-Zeile (R6-O) | **hält** | Trennt „bereit“ und „nachgeladen“; Zahlen laufen sichtbar (19 → 105 von 508). |
| Lagemonitor, Datenstand, Bewegungen, Papier-Abgleich, Exportstand | **nicht gezielt geprüft** | Auf der Startseite und in der Sammlung nur Zustandszeilen gesehen („Lageblatt: noch keins · Export: noch keiner“, „Letzte Meldung …“); der Fernsehweg gehört nicht zum Helferweg. |

Einordnung: Von den sechs Befunden meiner Rolle halten zwei (H1, H5), zwei
bleiben teilweise (H2, H6) und zwei offen (H3, H4), jeweils wie der Bericht
„Stand der Behebung“ sagt. Gegenteilig verkehrt hat sich nichts, aber die
Behebung von R6-M5/R6-M6 hat eine neue, größere Störung erzeugt (R7-H1), die
Runde 6 nicht messen konnte, weil sie nur hoch mit 200 % Schrift prüfte.

## Abschluss

- **Aufgabe geschafft:** Neuer Bogen bis zur Übersicht: ja. Mit Vorlage bis
  zum bestätigten Code, auch sieben Teile: ja. Entfernte Person
  zurückholen nach Schrittwechsel und Neuladen: ja. Mit großer Schrift quer
  den angefangenen Bogen finden: **mit Schwierigkeit** (R7-H1).
- **Fremde Hilfe nötig:** nein.
- **Mentales Modell:** Papierbogen aus der Mappe (Vorlage), Fehlende
  streichen, Ort eintragen, vorzeigen, nachfragen „hast du’s?“; am
  Meldekopf: scannen, zählen, weitergeben.
- **Größtes Einsatzrisiko:** Kein P0 oder P1. Am nächsten kommt R7-H1: Wer
  mit Großschrift quer oder am Tablet öffnet, sieht eine Seite aus
  Einzelbuchstaben und findet „Fortsetzen“ erst nach vier Bildschirmen.
- **Top-Priorität für die nächste Iteration:** Umbruchregel der
  Entwurfskarte an die Schriftklasse koppeln (R7-H1); danach Musterung als
  Verlaufseintrag (R7-H2) und die Unterschiedsangabe der Zwei-Fenster-Warnung
  (R7-H3).

**Verständnisprüfung**

- Orientierung: **verstanden**. Schrittleiste mit Haken, „Teil n von m“ über
  dem Code, Sammlung mit Summen und Einsatzname.
- Nächster Schritt: **verstanden**. „Einsatz vorbereiten: …“, „Bogen
  anlegen“, „Weiter zu Teil n →“, „Ja, gescannt — übergeben“, „Bogen
  scannen…“. Ausnahme: die zerlegte Entwurfskarte bei großer Schrift quer.
- Systemzustand: **verstanden**. „✓ gespeichert · … nur auf diesem Gerät“,
  Offline-Zeile, Teilzähler, „Einen Moment …“. Lücke: Zwei-Fenster-Warnung
  ohne Unterschied (R7-H3).
- Fehlerbehebung: **verstanden**. Rückfragen mit Namen, „Rückgängig“ nach
  Neuladen, „Nicht sicher“, „Code wieder zeigen“, Geräteuhr-Rückfrage. Lücke:
  Zurück in der Musterung (R7-H2).
- Feldtauglichkeit: **geeignet, nicht vollständig geprüft**. Handschuhe,
  Sonnenlicht, echter Kamera-Scan mit 1,5 s Mindestzeit, Bildschirmtastatur,
  echter Browser-Zoom und die Zurück-Geste der installierten App gehören in
  einen Praxistest.
