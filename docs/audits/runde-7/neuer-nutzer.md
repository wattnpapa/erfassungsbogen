# Audit „Neuer Nutzer", Runde 7 (THW-Helfer ohne Einweisung)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-new-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `a52f20a` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-6-Befunde (Stand der Behebung in
[../runde-6/neuer-nutzer.md](../runde-6/neuer-nutzer.md)). Geprüft habe ich
auch die Nebenwirkungen der Runde-6-Umbauten: Fußleiste des Assistenten,
Zurück-Verlauf der Startseitenfenster, Rückfragen, Zwei-Fenster-Abgleich,
Lagemonitor mit Datenstand und Bewegungen, Papier-Abgleich, Geräteuhr-Rückfrage,
Offline-Zeile, Rückweg im Schritt Personal und Deckel bei großer Schrift.

## Prüfaufbau

Playwright aus `node_modules`, Chromium unter `/opt/pw-browsers/chromium`
(`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Telefon 360 × 640
(Gerätepixelverhältnis 2), dazu 320 × 568 und 640 × 360 quer; große Schrift als
`html { font-size: 200% }`; der Lagemonitor zusätzlich auf 1 920 × 1 080.
Produktionsbuild unter `http://localhost:4173`; je Lauf ein eigener
Browser-Kontext, Server weder neu gebaut noch angehalten. Elf weitere Prüfer
nutzten ihn gleichzeitig; Zeitwerte habe ich nicht gewertet.

Zustände entstanden durch Bedienung (leeres Gerät, „Neuen Bogen erstellen“ mit
Einheitstyp „FGr WP“, „Einheit schnell erfassen…“, „Neue Einsatz-Sammlung…“,
Person entfernen, Abrücken, Blanko-Vordruck, „Aus Datei laden…“) und durch
`localStorage`-Seeds (`eeb.entwurf.v1`, `eeb.einsaetze.v1`) aus `examples/`,
jeweils mit `uebung: false` und `stand` auf heute. Abgeleitete Prüfdateien: `001-albstadt-ztr-tz` ohne Einheitstyp
(einmal mit allen vier, einmal mit drei Personen) und `002-biberach-riss-fgr-o-b`
mit späterem Stand und zwei Personen weniger. Die Geräteuhr stellte ich mit
dem Uhrenwerkzeug von Playwright um 100 Tage vor; das Zwei-Fenster-Verhalten
mit zwei Seiten im selben Kontext; „offline“ mit `setOffline`.

Ich habe zuerst ohne Blick in Berichte getestet (Startseite, Assistent in
sechs Schritten, Übergabe, QR-Vollbild, Zurück-Taste, Meldekopf-Seite,
Lagemonitor, Uhr-Warnung), danach `runde-6/neuer-nutzer.md` mit „Stand der
Behebung“ gelesen und jede Behebung nachgestellt.

**Nicht prüfbar:** Kamera-Scan mit echtem Bild, Handscanner, echte
Handschuhe, echtes Licht, Bildschirmtastatur, native Datumsauswahl (headless
Chromium zeigt „10/23/2026“ im US-Format; nicht gewertet), Safari/WebKit,
echtes Drucken, native Builds. Nicht gesondert nachgestellt: R6-N9 (Einzahl
„1 braucht“, nur im Quelltext gelesen, `hilfen.ts`), R6-N10 (Verschiebung durch
die Quittung des Blanko-Vordrucks: Die Quittung steht jetzt unter dem Knopf, die
Messung der Knopfposition vor und nach dem Tipp war wegen des automatischen
Scrollens des Prüfwerkzeugs nicht aussagekräftig).

Hinweis zum Prüfwerkzeug: Ein Seed per `addInitScript` setzt sich in jeder
neuen Seite desselben Kontexts neu und überschreibt Änderungen. Das habe ich
beim Lagemonitor bemerkt und mit einem Merker im `localStorage` behoben; es ist
kein Befund der App.

## Urteil

Der eigene Bogen gelingt auch in Runde 7 ohne fremde Hilfe: Startseite,
sechs Schritte, die Erklärung der StAN-Vorbelegung in Schritt 1 („Vorbelegt
nach StAN: 12 Personen (Namen offen), 4 Fahrzeuge … Sie zählen in die Stärke,
bis sie ausgefüllt oder entfernt sind“), die Warnungen, die Übersicht und
„Bogen übergeben…“ sind verständlich. Die Behebungen der Runde 6 halten in der
Mehrzahl: Folgerückfragen bleiben stehen (R6-N1), der Papier-Abgleich meldet
den Rest ehrlich (R6-N3), die beiden Ansicht-Wahlen schließen sich gegenseitig
(R6-N5), offene Punkte der Übersicht springen an das Feld (R6-N7), die
Geräteuhr-Warnung und der Rückweg bei „Person entfernen“ tragen, und die
Zurück-Taste schließt jedes Fenster der Startseite, ohne die App zu verlassen.

Reibung bleibt an drei Stellen. Erstens: Der Stapelimport einer Datei meldet
die mögliche Doppelung („ähnelt …“) in meinem Lauf nicht; die Summe stieg von
27 auf 31, ohne Hinweis (R7-N1, Rest von R6-N2). Zweitens: Bei großer Schrift
öffnet die Liste der Einheitstypen 480 px breit in einem 360-px-Fenster und
weitet die Seite auf 515 px (R7-N2). Drittens: Ein im Speicher liegender, aber
unbrauchbarer Eintrag fehlt seit der Behebung R6-E1 stillschweigend in Zählung
und Liste (R7-N3). Dazu kommen sechs P3 zu Wortwahl und Lagemonitor.

Aufgabe 1 (eigener Bogen) gelingt ohne Hilfe. Aufgabe 2 (Meldekopf, Folgemeldung
von der Startseite, Papier-Abgleich, Abrücken, Lagemonitor) gelingt; nur die
Doppelungswarnung im Stapel fehlt.

## Befunde

### R7-N1 [P2] Stapelimport: Die Quittung nennt die mögliche Doppelung nicht, die Summe steigt still (Rest von R6-N2)

**Priorität:** P2

**Kennzeichnung:** beobachtet (zwei Dateivarianten, zwei Läufe); Ursache
(nur gelesen): Die Doppelungszeile aus `aehnlichImStapel` landet in
`zeilen` des Einleseergebnisses, die Quittung der Sammlung zeigt aber nur
`meldung`.

**Fundstelle / Aufgabe:** Sammlung „Hochwasser Musterstadt“ mit „THW Albstadt
Zugtrupp Technischer Zug“ (Einheitstyp gesetzt) → „Bögen einlesen…“ → Datei
`THW Albstadt` ohne Einheitstyp (einmal mit denselben vier Personen, einmal mit
drei). Code: `src/app/app.tsx` (`aehnlichImStapel`, ca. Z. 2148–2170; Rückgabe
mit `zeilen` und `meldung`, ca. Z. 3338–3347).

**Beobachtung:** Quittung „1 Bogen aufgenommen.“ und die Karte „Neu seit der
letzten Kenntnisnahme (1): THW Albstadt — neu gemeldet“. Die Liste zeigt
danach „Nr. 4 THW Albstadt“ neben „Nr. 3 THW Albstadt Zugtrupp Technischer
Zug“, die Summe steigt von 27 auf 31. Das Wort „ähnelt“ steht nirgends auf
der Seite (Textsuche im gesamten Dokument: nein). Über „Wohin damit?“ von der
Startseite (Einzeldatei) fragt die App dagegen richtig „Ist das dieselbe
Einheit?“.

**Erwartung der Rolle:** Zwei Karten „THW Albstadt“ lese ich als eine Einheit.
Wenn die App sie zweimal zählt, sagt sie es dort, wo ich die Quittung lese.

**Folge:** Die Stärke am Meldekopf ist um die Doppelmeldung zu hoch; das
Lageblatt gibt sie weiter. Der Stand der Behebung nennt die Quittung als
umgesetzt; im Browser kommt sie bei Dateien nicht an.

**Empfehlung:** Die Zeile in die sichtbare Quittung der Sammlung übernehmen
(wie die Folgemeldung) und an der Karte als Marke zeigen; dazu einen Tipp
„Zusammenführen…“.

**Nachprüfung:** Seed wie oben, Datei über „Bögen einlesen…“: Quittung nennt
„ähnelt … beide zählen getrennt“, Karte trägt die Marke, Zusammenführen
senkt die Summe.

### R7-N2 [P2] Große Schrift: Die Liste der Einheitstypen ist breiter als das Fenster und weitet die Seite (Rest von R6-M5, Deckel)

**Priorität:** P2

**Kennzeichnung:** gemessen (360 × 640 mit `html { font-size: 200% }`).

**Fundstelle / Aufgabe:** „Neuen Bogen erstellen“ → Schritt 1 → Feld
„Einheitstyp“, „FGr WP“ tippen.

**Beobachtung:** Die Vorschlagsliste ist 480 px breit (Fenster 360 px); der
Layoutbreite der Seite steigt auf 515 px (normale Schrift: Liste 294 px,
Seite 360 px; bei 320 px: Liste 254 px, Seite 320 px). Einträge wie „FGr WP (A)
Fachgruppe Wasserschaden/Pumper…“ laufen rechts aus dem Bild. Das Feld selbst
zeigt nach der Wahl nur „FGr WP (A) – Fachgruppe“ (Inhalt 528 px in 288 px
Feld); die Platzhalter „meist leer – OV unten eintrag…“ und „z. B.
Bergungsgruppe, FG…“ sind abgeschnitten. Ohne geöffnete Liste bleibt die
Seite bei 360 px (kein seitlicher Überlauf).

**Erwartung der Rolle:** Die Auswahl bleibt im Bild; der Name der Gruppe ist
vollständig lesbar.

**Folge:** Wer mit großer Schrift arbeitet (Brille, Handschuh-Nutzung nah am
Gerät), muss die Seite seitlich schieben, um den Typ zu erkennen; er wählt
„(A)“ statt „(B)“ nach dem Anfang des Namens.

**Empfehlung:** Liste auf Fensterbreite begrenzen, Namen umbrechen lassen;
das gewählte Feld mehrzeilig zeigen.

**Nachprüfung:** 360 × 640, 200 % Schrift, Liste öffnen: Breite ≤ Fenster,
`scrollWidth` = 360, voller Name lesbar.

### R7-N3 [P2] Ein unbrauchbarer Eintrag fehlt still in Zählung und Liste (Nebenwirkung der Behebung R6-E1; Risiko)

**Priorität:** P2

**Kennzeichnung:** beobachtet im Seed (Eintrag ohne `einheit`-Block in einer
Sammlung mit zwei Einheiten); Eintreten im Betrieb: Risiko.

**Fundstelle / Aufgabe:** Startseite → „Hochwasser Musterstadt“ öffnen.

**Beobachtung:** Kein Absturz mehr, keine Fehlerseite (R6-N4/R6-E1 erreicht).
Die Startseite zeigt „1 Einheit(en) anwesend · Stärke 0 / 3 / 9 / 12“, die
Einsatzansicht „Einheiten (1 gemeldet · 1 zählend)“. Von der zweiten Einheit
steht nichts da; eine Suche nach „lesbar“, „beschädigt“, „ausgelassen“ liefert
keinen Treffer. Im Speicher liegen weiter zwei Einträge.

**Erwartung der Rolle:** Wenn die App etwas nicht zeigen kann, sagt sie es
und nennt einen Weg (sichern, löschen).

**Folge:** Eine gemeldete Einheit fehlt in der Lage, ohne dass es jemand
merkt; die Gesamtstärke ist zu niedrig. Der Helfer hält die Zahl für
vollständig.

**Empfehlung:** Auslassungen zählen und anzeigen („1 Eintrag konnte nicht
gezeigt werden — Daten sichern“), am besten mit Weg zur Sicherung.

**Nachprüfung:** Seed wie oben: Hinweis in Sammlung und Startseite; die Zahl
der gezeigten Einheiten entspricht dem Hinweis.

### R7-N4 [P3] „Rückholplatz“ steht in den Rückfragen, auf der Startseite heißt es anders

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Zwei-Fenster-Rückfrage „Stand aus dem anderen
Fenster laden?“ („… kommt auf den Rückholplatz der Startseite“); Startseite
nach „Verwerfen“. Code: `src/app/fenster-abgleich.tsx`.

**Beobachtung:** Die Karte auf der Startseite heißt „Zuletzt geschlossener
Bogen“ mit dem Knopf „Zuletzt geschlossenen Bogen zurückholen“; die Meldung
nach „Verwerfen“ sagt „Rückholung oben auf der Startseite“. „Rückholplatz“
kommt auf der Startseite nicht vor (Textsuche: nein).

**Erwartung der Rolle:** Das Wort der Rückfrage steht dort, wo ich suche.

**Folge:** Gering: Der Helfer sucht nach einem Ort namens „Rückholplatz“.

**Empfehlung:** In den Rückfragen „unter ‚Zuletzt geschlossener Bogen‘ auf der
Startseite“ schreiben.

**Nachprüfung:** Text der Rückfrage und Beschriftung der Startseite
stimmen überein.

### R7-N5 [P3] Lagemonitor: Spalte „Orga“ bricht „THW“ und die Kopfzeile; die Uhr trägt keine Beschriftung

**Priorität:** P3

**Kennzeichnung:** beobachtet (1 920 × 1 080, sechs THW-Einheiten; ebenso mit
fünf nach dem Abrücken). Die Wirkung für den Betrachter am Fernseher: Risiko.

**Fundstelle / Aufgabe:** „Lagemonitor öffnen“ (zweites Fenster
`?lagemonitor=s1`).

**Beobachtung:** In der Einheitentabelle steht in der ersten Spalte „TH / W“
in zwei Zeilen, die Kopfzeile „Orga / a“. Die große Zeile „23 1807 okt 26“
(Datum-Zeit-Gruppe) hat keine Beschriftung; „Stärke F / U / M // gesamt“ nutzt
Abkürzungen. Gut: Das Abrücken erscheint als „Abgerückt: THW Albstadt
Zugtrupp Technischer Zug · gerade eben“ und als „· 1 abgerückt“; die
Summen sinken (59 → 55).

**Erwartung der Rolle:** „THW“ steht in einer Zeile; die Uhrzeit ist als
solche kenntlich.

**Folge:** Wer die Zeitgruppe nicht kennt, liest „1807“ als Zahl. Der Bruch in
„THW“ lässt die Tabelle fehlerhaft aussehen.

**Empfehlung:** Spaltenbreite für „Orga“ an den Inhalt binden; kleine
Beschriftung „Uhr“ bzw. „Stand“ über der Zeitgruppe.

**Nachprüfung:** 1 920 × 1 080: „THW“ in einer Zeile; Beschriftung
sichtbar.

### R7-N6 [P3] Zwei-Fenster-Warnung: Beide Stände lesen sich gleich; „Weniger“ ohne Bezug

**Priorität:** P3

**Kennzeichnung:** beobachtet (zwei Seiten im selben Kontext).

**Fundstelle / Aufgabe:** Assistent Schritt 2 in Fenster A, Fenster B öffnet
„Fortsetzen“, A ändert „Einsatzort / Auftrag“.

**Beobachtung:** Die feste Leiste nennt: „(dort: „THW Crailsheim …“, Stand
23.10.26, 17:55 Uhr, 12 Personen · hier: Stand 23.10.26, 17:55 Uhr, 12
Personen)“. Beide Stände sind gleich beschriftet; geändert war nur das Feld
im ersten Fenster. Rechts steht ein Knopf „Weniger“, ohne dass die Leiste
sagt, was sie weniger zeigt. Gut: „Stand aus dem anderen Fenster laden“
fragt nach und nennt die eigene Fassung auf dem Rückholplatz (R6-S1 hält);
die Leiste liegt bei 360 × 640 über dem Feld, das ich bearbeite, aber das Feld
bleibt sichtbar.

**Erwartung der Rolle:** Ich erkenne, welcher Stand der jüngere ist.

**Folge:** Die Wahl fällt blind, wenn beide Fenster in derselben Minute
und mit gleicher Personenzahl stehen.

**Empfehlung:** Sekunden oder „zuletzt geändert: Einsatzort“ nennen; „Weniger“
durch „Zuklappen“ ersetzen.

**Nachprüfung:** Zwei Fenster, Änderung nur im Text: Leiste benennt den
Unterschied.

### R7-N7 [P3] QR-Vollbild zeigt die Soll-Stärke ohne Hinweis auf nicht ausgefüllte Personenkarten (Verweis auf R6-A3, andere Stelle)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Neuer Bogen „FGr WP (A)“, vier Mal „Weiter“, „Bogen
übergeben…“ → „QR-Code im Vollbild zeigen“.

**Beobachtung:** Die Vorbelegung ist in Schritt 1, Schritt 3 und in der
Übersicht erklärt und gewarnt (9 offene Punkte). „Bogen übergeben…“ trägt
oben den Hinweis „⚠ 9 offene Punkte — ansehen · Übergeben ist trotzdem
möglich“. Das QR-Vollbild selbst zeigt „Stärke 0 / 3 / 9 / 12 · Stand 17:41
Uhr“ ohne Hinweis. Die Druckseite dieses Themas: R6-A3
([analog-first.md](analog-first.md)).

**Erwartung der Rolle:** Was die Gegenstelle sieht, trägt, falls zutreffend,
„Stärke nach Soll, Namen offen“.

**Folge:** Gering: Wer das Vollbild direkt zeigt, übergibt Sollzahlen als Ist.

**Empfehlung:** Eine kurze Zeile im Vollbild („9 Plätze ohne Namen“), solange
offene Punkte bestehen.

**Nachprüfung:** Bogen mit Vorbelegung → Vollbild: Zeile vorhanden.

### R7-N8 [P3] „Ist das dieselbe Einheit?“ zeigt „Bisher“ und „Neu“ gleich und nennt die Änderung nicht

**Priorität:** P3

**Kennzeichnung:** beobachtet (Albstadt ohne Typ).

**Fundstelle / Aufgabe:** Startseite, Datei laden → „Wohin damit?“ →
„Ist das dieselbe Einheit?“.

**Beobachtung:** Das Fenster erscheint jetzt und bleibt stehen (R6-N1 hält).
„Bisher: Stärke 1 / 1 / 2 / 4 · Lang, Sabine · … · Stand 17:41“ und „Neu:“
sind gleich; darunter „Geändert: 1 Änderung“ ohne Angabe, welche (der
fehlende Einheitstyp).

**Erwartung der Rolle:** „Geändert: Einheitstyp fehlt“.

**Folge:** Gering: Die Wahl „Ja“ oder „Nein“ fällt ohne den eigentlichen
Unterschied.

**Empfehlung:** Die Änderung benennen.

**Nachprüfung:** Datei ohne Typ: „Geändert: Einheitstyp (vorher Zugtrupp
Technischer Zug, jetzt leer)“.

### R7-N9 [P3] Übersicht ohne Fußleiste; Schrittleiste zeigt „5“ und „6“ nur als Ziffer (Risiko)

**Priorität:** P3

**Kennzeichnung:** beobachtet (360 × 640); Wirkung: Risiko.

**Fundstelle / Aufgabe:** Assistent, Schritt 6 „Gesamtübersicht“.

**Beobachtung:** In Schritt 1 bis 5 stehen unten „←“, „◐ Ansicht“ und
„Weiter →“. In Schritt 6 fehlt die Fußleiste ganz (kein Zurück, keine Ansicht,
Textsuche am Seitenende: keine Schaltfläche im unteren Bildbereich). Die
Schrittleiste zeigt „3 offen“, „4 offen“, aber „5“ und „6“ nur als Ziffer, ohne
Namen. Rücksprung geht über die Leiste oder die Zurück-Taste (springt in
Schritt 5). Gut: Die Zurück-Taste verlässt den Assistenten nicht.

**Erwartung der Rolle:** Am Ende noch ein „← Zurück“ an der gewohnten Stelle.

**Folge:** Gering: Wer von der Übersicht zurück will, sucht kurz.

**Empfehlung:** „← Zurück zu Schritt 5“ am Seitenende.

**Nachprüfung:** Schritt 6 öffnen: Zurück-Knopf unten.

## Verweise auf Befunde in anderen Berichten

- **„Bed / arf:“ bricht mitten im Wort und klebt an „Verpflegung …“** (Kopfzeile
  „Bedarf“ der Sammlungsseite, 360 px, normale Schrift): in meinem Lauf noch zu
  sehen. Bereits Runde 6 in `fehler-und-wiederanlauf.md` und `mobile-ui.md`;
  hier nur als Verweis.
- **Sofort-Sperre von Mehrfach-Tipps („Einen Moment …“):** Tippt man nach
  „Neuen Bogen erstellen“ innerhalb von 1,5 s auf dieselbe Stelle (etwa
  „Weiter“ oder das Feld „Einheitstyp“), nimmt die App den Tipp nicht an und
  zeigt „Einen Moment …“ über dem Finger. Gewolltes Verhalten (R5-G4/S2); ich
  nenne es hier, weil ich es als Neuling dreimal ausgelöst habe. Es erklärt
  sich selbst.

## Bestätigtes

- **Startseite:** zwei Rollen, „So funktioniert’s“, Ladefortschritt mit
  „Jetzt offline bereit“; die Offline-Zeile „⚠ Noch nicht offline bereit (1,9
  von 6,9 MB geladen) — ohne Netz diese Seite nicht neu laden …“ ist
  verständlich.
- **Assistent:** Schritt 1 erklärt die StAN-Vorbelegung samt „Vorbelegung
  entfernen“, Schritt 2 „Zeitraum bis“ samt „Zeitraum vorbei“, Schritt 3 den
  Hinweis „Vom Papier abtippen? … erst Schritt 4“ und „Nur Stärke“, die Karten
  tragen den Satz zu „⇑“ (R6-N6). „Weiter“ blockiert nicht, die Warnungen
  stehen sichtbar. „Einheit schnell erfassen…“ öffnet den Assistenten mit der
  Marke „Schnellerfassung“ und dem Satz „Es reichen der Name der Einheit hier
  und die Stärke in Schritt 3“.
- **Zurück-Verlauf der Startseitenfenster (R6-S3):** „Datensicherung“,
  „Beispielbögen“, „Geräteschlüssel neu erzeugen?“, „Alle lokalen Daten
  löschen“, „Einsatz löschen?“, „Neue Einsatz-Sammlung anlegen“: Die
  Zurück-Taste schließt jeweils nur das Fenster, die Adresse bleibt.
- **Rückfragen (R6-N1):** „Wohin damit?“ → „Einheit ist bereits gemeldet“
  und → „Ist das dieselbe Einheit?“ bleiben stehen; Zurück schließt die zweite
  Rückfrage, danach „… nicht aufgenommen.“ (vom Helfer gewählt, verständlich);
  „Als neue Fassung anhängen“ meldet „Folgemeldung: Stärke 11 → 9 (−2)“.
- **Papier-Abgleich (R6-N3):** Nach „Abgleich übernehmen“ ein Hinweisfenster
  „Eintreffzeit nicht bestätigt“ mit allen fünf Namen, danach die Karte
  „Abgeglichen bis auf die Eintreffzeit: 5 Einheiten“ mit „Eintreffzeiten
  nachtragen…“. Die Liste ist nicht nach „Nr.“ geordnet (3, 2, 1, 4, 5).
- **Ansicht-Wahl (R6-N5), offene Punkte (R6-N7), „Standort“ (R6-N8):**
  gemessen bzw. gesehen wie in der Behebung beschrieben; Sprung zu
  `feld-geschlecht-0` und `feld-sitzplaetze-0` landet im Bild (Feld bei y =
  250 bzw. 286 von 640).
- **Geräteuhr:** „Geräteuhr prüfen: Das Gerät zeigt den 31.01.2027, beim
  letzten Start war der 23.10.2026 (100 Tage davor) … Bis du antwortest, löscht
  und anonymisiert die App nichts.“ mit Namen der betroffenen Sammlung und dem
  Zusatz „dann kann das neue Datum kaum stimmen“. Die Karte „Fortsetzen“ liegt
  darunter, bleibt erreichbar.
- **Zwei Fenster:** Die Leiste erscheint, „Stand aus dem anderen Fenster
  laden“ fragt nach (R6-S1 hält).
- **Rückweg bei „Person entfernen“ (R6-S4/D4):** Quittung „Entfernt: Person 1
  — Rückgängig“ steht nach Schrittwechsel und nach Neuladen noch da.
- **Lagemonitor:** zeigt Abrücken als eigene Zeile samt Zeitangabe und senkt
  die Summen; zeigt keine Personennamen.
- **Übergabe:** „Bogen übergeben…“ mit „QR-Code im Vollbild zeigen“, „PDF
  erzeugen“, „Weitere Formate“; Hinweis auf offene Punkte; Blanko-Vordruck
  liefert `einheiten-erfassungsbogen-blanko.pdf` mit Quittung „✓
  Blanko-Vordruck erzeugt (2 Seiten A4, zum Ausfüllen mit der Hand).“
- **Entwurf verwerfen:** Rückfrage nennt den Rückholweg; die Startseite zeigt
  danach „Zuletzt geschlossener Bogen … zurückholen“.

## Abgleich mit Runde 6

Grundlage: [../runde-6/neuer-nutzer.md](../runde-6/neuer-nutzer.md) mit „Stand
der Behebung“.

| Runde-6-Befund | Stand laut Runde 6 | Bewertung Runde 7 | Beobachtung |
| --- | --- | --- | --- |
| R6-N1 Folgerückfrage schließt sich selbst (P1) | behoben | hält | „Wohin damit?“ → „Ist das dieselbe Einheit?“ und → „Einheit ist bereits gemeldet“ bleiben stehen; Zurück schließt nur die zweite Rückfrage. |
| R6-N2 Doppelung im Stapel (P2) | teilweise (Quittung) | hält nicht (R7-N1) | Quittung nennt die Doppelung für Dateien nicht; Summe 27 → 31. Zusammenführen-Tipp und Marke an der Karte weiter offen. |
| R6-N3 Karte „noch nicht abgeglichen“ (P2) | teilweise | hält überwiegend | Ein Hinweisfenster mit Namen; Karte „Abgeglichen bis auf die Eintreffzeit“; Sortierung nach Nr. fehlt weiter. |
| R6-N4 Fehlerseite bei kaputter Sammlung (P2) | behoben | Absturz entfällt, Fehlerseite nicht erreicht | Eintrag ohne `einheit` führt nicht mehr zum Absturz; er fehlt aber still (R7-N3). Wortlaut der Fehlerseite nicht nachgestellt. |
| R6-N5 zwei Ansicht-Schalter (P3) | behoben | hält | Kopf geöffnet, dann Fußleiste: Kopf-Wahl schließt sich. |
| R6-N6 „⇑“ in der Kartenansicht (P3) | behoben | hält | Satz „⇑ setzt eine Person ganz nach oben …“ steht in Schritt 3. |
| R6-N7 offener Punkt springt zum Feld (P3) | behoben | hält | Geschlecht und Sitzplätze: Fokus im Bild. |
| R6-N8 Einheitstyp als Zeilenbeschriftung (P3) | behoben | hält | DRK-Bogen: „Standort · Buchenrode“. |
| R6-N9 „1 brauchen“ (P3) | behoben | im Quelltext vorhanden, nicht gesondert nachgestellt | `hilfen.ts` unterscheidet „braucht“/„brauchen“. |
| R6-N10 Quittung schiebt den Knopf (P3) | behoben | nicht eindeutig nachgestellt | Quittung erscheint unter dem Knopf; Messung der Knopfposition wegen Prüfwerkzeug nicht aussagekräftig. |
| R6-N11 Beschriftungen (P3) | teilweise | hält teilweise | (a) „Verwerfen“ meint weiter „schließen“ (Rückfrage erklärt es); (b) Geräteuhr-Text nennt die Sammlung; „werden 1 Sammlung“ klingt holprig; (c) „Excel-Liste (Format „Oldenburg“)“ weiter ohne Erklärung; (d) Rückfrage „Person entfernen“ nennt „Rückgängig“ (hält). |

Nebenwirkungen der Runde-6-Umbauten: neu sind R7-N1 (Quittung kommt für
Dateien nicht an), R7-N3 (stille Auslassung), R7-N4 (Rückholplatz) und R7-N6
(Zwei-Fenster-Text). Die Fußleiste des Assistenten, die Rückfragen und die
Offline-Zeile verursachten bei mir keinen Fehler. Bilanz: von elf Befunden
meiner Rolle halten sieben, drei teilweise, einer (R6-N2) nicht in der
beschriebenen Form. Neu: kein P0, kein P1, drei P2, sechs P3 (R7-N1 bis R7-N9).

## Abschluss

- **Aufgabe geschafft:** ja (eigener Bogen, Übergabe, Meldekopf, Folgemeldung,
  Papier-Abgleich, Abrücken, Lagemonitor); mit Umweg bei der Doppelungswarnung
  im Stapel.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Zwei Karten „THW Albstadt“ nach dem
  Stapelimport sehen nach einer Einheit aus und zählen doppelt (R7-N1).
- **Größtes Einsatzrisiko:** Eine Einheit fehlt oder zählt doppelt, ohne dass
  die Oberfläche es sagt (R7-N1, R7-N3).
- **Top-Priorität für die nächste Iteration:** Die Doppelungs- und
  Auslassungshinweise in die sichtbare Quittung der Sammlung bringen
  (R7-N1, R7-N3).
