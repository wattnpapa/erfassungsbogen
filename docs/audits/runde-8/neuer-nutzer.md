# Audit „Neuer Nutzer", Runde 8 (THW-Helfer ohne Einweisung)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-new-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `3fee6e5` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-7-Befunde (Stand der Behebung in
[../runde-7/README.md](../runde-7/README.md), Bericht meiner Rolle:
[../runde-7/neuer-nutzer.md](../runde-7/neuer-nutzer.md)). Geprüft habe ich auch
die Nebenwirkungen der Runde-7-Umbauten: Lagemonitor (Tabelle im Bild,
„+ n weitere“, Bewegungen, Telefonansicht), Zwei-Fenster-Leiste und Rückfragen,
Geräteuhr-Halt, Beiseitelegen unlesbarer Daten, „Nur Stärke“-Rückfrage,
Zug-Normalisierung, Sortierung nach Nr., Musterung als Verlaufsansicht,
Layout bei großer Schrift und Zoom, Zurück-Verlauf.

## Prüfaufbau

Playwright aus `node_modules`, Chromium unter `/opt/pw-browsers/chromium`
(`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Telefon 360 × 640
(Gerätepixelverhältnis 2), dazu 320 × 568, 640 × 360 quer, Tablet 820 × 1180
(und quer 1180 × 820); große Schrift als `html { font-size: 200% }`, Browser-Zoom
als halbierte Layoutbreite bei doppeltem Pixelverhältnis; der Lagemonitor
zusätzlich auf 1 920 × 1 080, 1 366 × 768, 1 280 × 720, 1 024 × 600 und
800 × 480. Produktionsbuild unter `http://localhost:4173`; je Lauf ein eigener
Browser-Kontext, Server weder neu gebaut noch angehalten. Elf weitere Prüfer
nutzten ihn gleichzeitig; Zeitwerte habe ich nicht gewertet.

Zustände entstanden durch Bedienung (leeres Gerät, „Neuen Bogen erstellen“ mit
Einheitstyp „FGr WP“ und „Bergungsgruppe“, „Einheit schnell erfassen…“,
„Als Vorlage speichern“ und „Einsatz vorbereiten“, „Bogen übergeben…“,
Abrücken, „Zug zuordnen“, „Bögen einlesen…“ mit Dateien, „Bogen scannen…“ ohne
Kamera) und durch `localStorage`-Seeds (`eeb.entwurf.v1`, `eeb.einsaetze.v1`,
`eeb.vorlagen.v1`) aus `examples/thw/`, jeweils mit `uebung: false` und `stand`
auf die Prüfzeit. Abgeleitete Prüfdateien: `001-albstadt-ztr-tz` einmal
ohne Einheitstyp, einmal mit einer Person weniger und späterem Stand,
`020-hilpoltstein-fgr-n` unverändert (zweimal und doppelt in einem Zug
eingelesen). Ein Eintrag ohne `einheit`-Block in einer Sammlung (unlesbar). Die
Geräteuhr stellte ich mit `page.clock.install` um 100 Tage vor; das
Zwei-Fenster-Verhalten mit zwei Seiten im selben Kontext. Der Lagemonitor lief
als `?lagemonitor=s1`, auch mit 18 Einheiten.

Ich habe zuerst ohne Blick in Berichte getestet (Startseite, Assistent in
sechs Schritten, Übergabe und QR-Vollbild, Schnellerfassung, Einsatz-Sammlung mit
Karten, Abrücken, Zug, Lagemonitor, Datei-Import, Zwei-Fenster, Geräteuhr),
danach `runde-7/neuer-nutzer.md` mit dem „Stand der Behebung“ gelesen und jede
Behebung meiner Rolle nachgestellt.

**Nicht prüfbar:** Kamera-Scan mit echtem Bild, Handscanner, echte
Handschuhe, echtes Licht, Bildschirmtastatur, native Datumsauswahl (headless
Chromium zeigt „10/23/2026“ im US-Format; nicht gewertet), Safari/WebKit,
echtes Drucken, native Builds, Funkloch-Verhalten der Themenseiten.
**Nicht gesondert nachgestellt:** Papier-Abgleich mit Sitzungsspeicher, Nacht-Stufe
und Zukunftszeiten des Lagemonitors, Kurz-Liste ab 8 Personen (Schritt 3 zeigte bei
zehn Personen Karten ohne erkennbaren Umschalt-Zwang; nicht nachgemessen),
Schlüsselfeld „lage“ im Umschlag.

Hinweis zum Prüfwerkzeug: Ein zweiter Tipp auf „Weiter“ innerhalb von etwa
0,6 s nach dem ersten wird nicht angenommen; nach 1,5 s geht er. Das ist die
bekannte Sofort-Sperre (R5-G4/S2), kein neuer Befund. Die Seeds tragen die
Zeiträume der Beispielbögen (Juli 2026); dass die Karten „Zeitraum vorbei“ und
„Anderer Einsatz?“ melden, ist dadurch bedingt und nicht gewertet (Lage, nicht Fehler).

## Urteil

Der eigene Bogen und der Meldekopf gelingen auch in Runde 8 ohne fremde Hilfe.
Startseite mit zwei Rollen, sechs Schritte mit Erklärung der StAN-Vorbelegung
(„Vorbelegt nach StAN: 12 Personen (Namen offen), 4 Fahrzeuge … Sie zählen in die
Stärke, bis sie ausgefüllt oder entfernt sind“), die Übersicht mit offenen
Punkten, „Bogen übergeben…“ mit QR-Vollbild („⚠ 12 Plätze ohne Namen — Stärke nach
Soll“), die Karten der Einsatz-Sammlung, Abrücken mit „Rückgängig“, die
Doppelungswarnung im Stapelimport und die Rückfragen sind verständlich. Alle
Befunde meiner Rolle aus Runde 7 halten oder sind bis auf die genannten Grenzen
behoben; die Rückfragen („Ist das dieselbe Einheit?“ mit „Geändert: Einheit: …
→ …“, Zwei-Fenster mit Feldname, Geräteuhr mit Namen der betroffenen Sammlung
und zweiter Bestätigung) sagen, worum es geht und was passiert.

Reibung bleibt in sieben kleinen Stellen (alle P3): Der Lagemonitor am Telefon
schiebt die Spalten F/U/M aus dem Bild (R8-N1); am Fernseher bleibt Platz frei,
während „+ 15 weitere Einheiten“ steht (R8-N2); bei großer Schrift ist der
Einsatzname in der Sammlung kleiner als die Zeile darunter (R8-N3); zwei Texte
der Schnellerfassung widersprechen sich bei den Fahrzeugen (R8-N4); „Zug 2“ und
„2. Zug“ zählen als zwei Züge (R8-N5); die Zwei-Fenster-Rückfrage nennt das Feld,
aber nicht die beiden Werte (R8-N6); die Auswahl „Ausstattung nach StAN“ zeigt
ihren Wert abgeschnitten (R8-N7). Kein P0, kein P1, kein P2.

Aufgabe 1 (eigener Bogen) gelingt ohne Hilfe. Aufgabe 2 (Meldekopf: Folgemeldung,
Doppelung, Zug, Abrücken, Lagemonitor) gelingt.

## Befunde

### R8-N1 [P3] Lagemonitor am Telefon: Die Spalten F/U/M liegen außerhalb des Bildes, kein Hinweis zum Wischen

**Priorität:** P3

**Kennzeichnung:** gemessen (360 × 640 und 320 × 568, 6 Einheiten); Wirkung im
Einsatz: Risiko.

**Fundstelle / Aufgabe:** Sammlung „Hochwasser Musterstadt“ → „Lagemonitor
öffnen“, Seite `?lagemonitor=s1` am Telefon.

**Beobachtung:** Die Tabelle „Einheiten“ ist 448 px breit in einem Container von
336 px (360 px Fenster) bzw. 298 px (320 px Fenster); der Container rollt
(`overflow-x: auto`), die Seite selbst bleibt bei 360 bzw. 320 px. Sichtbar sind
„Orga“, „Ort“, „Funkrufname“ und der Anfang von „Einheitentyp“
(„Materialwirtsc“, „Bergungsgrup“ abgeschnitten); „F“, „U“, „M“ stehen
rechts außerhalb. Eine Andeutung (Verlauf, Pfeil, Hinweis) gibt es nicht. Die
Gesamtstärke steht darüber („1 / 15 / 43 // 59“), die Stärke je Einheit nur nach
Wischen. Quer (640 × 360) und am Fernseher passt die Tabelle (602 von 602 px).

**Erwartung der Rolle:** Wer die Lage am Telefon liest, sieht je Einheit die
Stärke, oder erfährt, dass sie rechts weitergeht.

**Folge:** Gering: Der Helfer liest „Einheitentyp“ als vollständig und sucht die
Stärke der einzelnen Einheit nicht, solange er nicht zufällig wischt.

**Empfehlung:** Am Telefon die Stärke vor den Einheitentyp stellen oder die
Zeile zweizeilig führen (Einheit; darunter F/U/M); mindestens ein sichtbares
Zeichen für „weiter rechts“.

**Nachprüfung:** 360 × 640, Lagemonitor mit sechs Einheiten: F/U/M je Einheit
ohne seitliches Wischen sichtbar oder Hinweis erkennbar.

### R8-N2 [P3] Lagemonitor am Fernseher: „+ 15 weitere Einheiten“ steht, obwohl Platz für weitere Zeilen frei ist

**Priorität:** P3

**Kennzeichnung:** gemessen (Seed mit 18 THW-Einheiten; Desktop-Fenster ohne
Touch).

**Fundstelle / Aufgabe:** Lagemonitor, Bereich „Einheiten“.

**Beobachtung:** Bei 1 920 × 1 080 stehen drei Zeilen (je 43 px); die Zeile „+ 15
weitere Einheiten“ endet bei y = 898, die Fußleiste („Einsatzdaten“/„Optionen“)
beginnt bei y = 1 025. Dazwischen liegen etwa 127 px, das sind knapp drei
weitere Zeilen. Bei 1 366 × 768 sind es drei Zeilen (je 31 px) und 66 px frei,
bei 1 280 × 720 drei Zeilen (je 29 px) und 57 px frei, bei 1 024 × 600 zwei
Zeilen (je 24 px) und 53 px frei. Bei 800 × 480 zeigt die Seite alle 18 Zeilen
(Seite 954 px hoch, rollt). Die Kürzung ist ehrlich benannt (R7-K1/L1 halten); die
Fläche bleibt aber ungenutzt.

**Erwartung der Rolle:** Was auf den Schirm passt, steht da; das „+ n“ steht erst,
wenn kein Platz mehr ist.

**Folge:** Gering: Am Fernseher fehlen zwei bis drei Einheiten ohne Grund; wer
von weitem liest, sieht eine längere Restzahl, als nötig wäre.

**Empfehlung:** Zeilenzahl an die freie Höhe bis zur Fußleiste binden (Rest der
Bildhöhe nach Abzug der Zeile „+ n“ durch Zeilenhöhe).

**Nachprüfung:** Seed mit 18 Einheiten, 1 920 × 1 080: freier Rest zwischen der
Zeile „+ n“ und der Fußleiste kleiner als eine Zeilenhöhe.

### R8-N3 [P3] Große Schrift: Der Name der Einsatz-Sammlung ist kleiner als die Zeile darunter

**Priorität:** P3

**Kennzeichnung:** gemessen (`html { font-size: 200% }`, 360 × 640 und
320 × 568) und im Screenshot beobachtet.

**Fundstelle / Aufgabe:** Startseite → „Hochwasser Musterstadt“ öffnen, Kopf der
Einsatzansicht.

**Beobachtung:** Der `h1` mit dem Einsatznamen hat bei normaler Schrift 22 px,
bei 200 % nur 16 px (Wurzelschrift 32 px) — kleiner als vorher und kleiner als
der Fließtext. Die Zeile darunter („Einsatz · Musterstadt · letzte Meldung
23.10.2026, 21:22“) ist deutlich größer und heller. Der Name der Sammlung wirkt wie
eine Randnotiz, die Metazeile wie die Überschrift. Ursache vermutlich der
Deckel für die Kopfhöhe (R7-M7); nur beobachtet, nicht im Quelltext gelesen.

**Erwartung der Rolle:** Die Überschrift bleibt die größte Schrift des Kopfes.

**Folge:** Gering: Wer mit Brille oder großer Systemschrift arbeitet und mehrere
Einsätze führt, erkennt „welcher Einsatz“ weniger schnell.

**Empfehlung:** Den Deckel so wählen, dass die Überschrift nicht unter die
Normalgröße sinkt; ersatzweise die Metazeile deckeln.

**Nachprüfung:** 360 × 640 mit 200 % Schrift: `h1` mindestens so groß wie bei
100 %, größer als die Zeile darunter.

### R8-N4 [P3] „Nur Stärke“: Hinweistext und Startseite widersprechen sich bei den Fahrzeugen

**Priorität:** P3

**Kennzeichnung:** beobachtet (Startseite, Assistent Schritt 3 und 4 im
Modus „Schnellerfassung“).

**Fundstelle / Aufgabe:** Startseite, Absatz „Vom Erfassungsbogen zur
Kräfteübersicht“; Assistent, Schritt 3 „Nur Stärke (Meldekopf-Schnellerfassung)“.

**Beobachtung:** Die Startseite sagt: „Wer eine Einheit nur durchwinken muss, nimmt
die Schnellerfassung mit Stärke, Führungskraft und Fahrzeugen.“ Im Schritt 3
steht unter der Wahl: „„Nur Stärke“ meldet nur die Zahlen, ohne Namen und
Fahrzeuge.“ Der Assistent zeigt in der Schnellerfassung danach Schritt 4
„Fahrzeuge“ mit „+ Fahrzeug hinzufügen“ ungekürzt. Zwei Aussagen, ein Verhalten.
Die Rückfrage beim Wechsel („12 erfasste Personen zählen dann nicht mehr
einzeln … Die Namen bleiben als Erreichbarkeiten erhalten“) ist dagegen
klar.

**Erwartung der Rolle:** Ein Satz, der sagt, ob Fahrzeuge in die Schnellerfassung
gehören.

**Folge:** Gering: Der Helfer am Meldekopf lässt die Fahrzeuge aus, weil der
Hinweis es sagt, oder trägt sie ein, weil die Startseite es sagt; die
Meldung ist dann je nach Helfer unterschiedlich vollständig.

**Empfehlung:** Den Hinweis in Schritt 3 an die Startseite angleichen („ohne
Namen; Fahrzeuge in Schritt 4 möglich“).

**Nachprüfung:** Startseite und Hinweis in Schritt 3 nennen die Fahrzeuge
gleich.

### R8-N5 [P3] Zug-Schreibweise: „Zug 2“ und „2. Zug“ bilden zwei Züge; die Zwischensumme zeigt die Kleinschreibung

**Priorität:** P3

**Kennzeichnung:** gemessen (Sammlung mit sechs Einheiten; „Zug zuordnen“ mit
„2.zug“, „Zug 2“, „2. ZUG “).

**Fundstelle / Aufgabe:** Karte aufklappen → „Zug zuordnen“ → Feld mit
Vorschlägen → „Speichern“; „Zwischensummen nach Zug“.

**Beobachtung:** „2.zug“ und „2. ZUG “ werden zu einem Zug zusammengeführt (R7-K4
hält). „Zug 2“ bleibt ein eigener Zug: „Zwischensummen nach Zug (3 Züge)“ mit den
Zeilen „2. zug · 2 Einheit(en) · Stärke 0 / 6 / 19 / 25“, „Zug 2 · 1 Einheit(en)
· 0 / 3 / 8 / 11“ und „Ohne Zug“. Der zusammengeführte Zug heißt klein „2. zug“,
nicht in der Schreibweise der Eingabe. Gut: Die Eingabe schlägt vorhandene Züge
vor (Liste „Zug 1“ nach Eingabe von „Z“), das Feld trägt den Platzhalter „z. B.
2. Zug“ und das Beschriftungs-Attribut „Zug“.

**Erwartung der Rolle:** „Zug 2“ und „2. Zug“ sind derselbe Zug; der Name steht so,
wie ich ihn gewohnt bin.

**Folge:** Gering: Zwei Zwischensummen für denselben Zug; die Stärke je Zug
stimmt dann nicht.

**Empfehlung:** Ziffernfolge „Zug n“ und „n. Zug“ gleichsetzen oder beim Speichern
nach einem ähnlichen vorhandenen Zug fragen; die Anzeige in der ersten
Schreibweise führen.

**Nachprüfung:** „2. Zug“ und „Zug 2“ vergeben: eine Zeile in den
Zwischensummen, Schreibweise wie eingegeben.

### R8-N6 [P3] Zwei-Fenster-Rückfrage nennt das geänderte Feld, aber nicht die beiden Werte

**Priorität:** P3

**Kennzeichnung:** beobachtet (zwei Seiten im selben Kontext; Assistent Schritt 2,
„Einsatzort / Auftrag“ im ersten Fenster geändert).

**Fundstelle / Aufgabe:** Fenster B: feste Leiste oben → „Genauer“ und „Anderen
Stand laden“.

**Beobachtung:** Die Leiste sagt: „⚠ Hier wird nichts gespeichert. Das andere
Fenster hat den Bogen geändert: Ort / Auftrag.“ „Genauer“ nennt beide Stände mit
Sekunden („gespeichert 21:28:39 Uhr“ gegen „zuletzt gespeichert 21:28:24 Uhr“)
und erklärt beide Knöpfe. Die Rückfrage „Stand aus dem anderen Fenster laden?“
sagt „dort anders: Ort / Auftrag“. Welcher Text im anderen Fenster steht
(„Neuer Ort XY“) und welcher hier, steht nirgends. R7-N6 ist behoben (Feld und
Sekunden); es fehlt der Inhalt.

**Erwartung der Rolle:** Ich sehe beide Texte nebeneinander, bevor ich entscheide.

**Folge:** Gering: Die Wahl fällt nach der Uhrzeit, nicht nach dem Inhalt; die
eigene Fassung bleibt über „Zuletzt geschlossener Bogen“ erreichbar, die
Entscheidung ist also umkehrbar.

**Empfehlung:** Bei kurzen Textfeldern „dort: …, hier: …“ in die Rückfrage
aufnehmen (gekürzt bei langen Werten).

**Nachprüfung:** Zwei Fenster, nur „Einsatzort / Auftrag“ geändert: Rückfrage
nennt beide Texte.

### R8-N7 [P3] Fahrzeugkarte: „Ausstattung nach StAN“ zeigt „— (nicht a“ abgeschnitten

**Priorität:** P3

**Kennzeichnung:** beobachtet (360 × 640, normale Schrift; Screenshot).

**Fundstelle / Aufgabe:** Assistent Schritt 4 → „+ Fahrzeug hinzufügen“ →
Feld „Ausstattung nach StAN“.

**Beobachtung:** Das Auswahlfeld ist etwa 111 px breit (neben „Sitzplätze“);
der Vorgabewert „— (nicht anwendbar)“ steht als „— (nicht a“ da, Pfeil rechts. Die
Beschriftung bricht auf zwei Zeilen („Ausstattung nach / StAN“). Die Optionen
„ja“ und „nein“ sind kurz; nur der Vorgabewert ist lang. Ohne Fachwissen
(StAN = Stärke- und Ausstattungsnachweis; Annahme: dem THW-Helfer bekannt)
bleibt offen, was „nicht anwendbar“ heißt.

**Erwartung der Rolle:** Der Vorgabewert ist lesbar („nicht anw.“ oder „—“).

**Folge:** Gering: Der Wert wirkt wie ein Platzhalter; der Helfer lässt ihn.

**Empfehlung:** Kürzeren Text („— k. A.“) oder die Zeile über die volle Breite.

**Nachprüfung:** 360 × 640, Fahrzeugkarte: Vorgabewert vollständig lesbar.

## Verweise auf Befunde in anderen Berichten

- **Übersichtstabellen (Personal, Fahrzeuge) rollen seitlich:** Im Schritt 6 ist
  die Personaltabelle 456 px breit in einem Container von 326 px (360 px
  Fenster); „Erreichbarkeit“ („Mobil: 5556134834 (P)“) steht rechts außerhalb. Bereits
  R6-G9 in `../runde-7/handschuh-bedienung.md` (offen), hier nur als Verweis.
- **Ziffern der Schrittleiste (5, 6):** bekannte Grenze R7-N9; die Schrittleiste
  zeigt „6“ weiter nur als Ziffer, der Rückweg „← Zurück zu Schritt 5
  (Sofortbedarf)“ steht am Ende der Übersicht.

## Bestätigtes

- **Startseite:** zwei Rollen („Meinen Bogen ausfüllen“, „Bögen sammeln
  (Meldekopf)“), „So funktioniert’s“, Offline-Zeile mit Fortschritt („Wird für den
  Offline-Betrieb geladen: 6,4 von 6,9 MB — bitte mit Netz geöffnet lassen“,
  später „✓ Jetzt offline bereit …“). Gespeicherte Vorlagen stehen in eigenem
  Abschnitt; nach „Bogen schließen“ steht der Bogen unter „Zuletzt geschlossener
  Bogen“, das Fenster „Bogen schließen?“ sagt „geschlossen, nicht gelöscht“.
- **Assistent:** Schritt 1 erklärt die StAN-Vorbelegung, Schritt 2 „Zeitraum bis“
  samt „Zeitraum vorbei“, Schritt 3 „Vom Papier abtippen? … erst Schritt 4“ und
  „Nur Stärke“, die Fußleiste mit „←“, „◐“, „Weiter →“ bleibt in 1 bis 5; „Weiter“
  blockiert nicht. Die Rückfrage „Nur die Stärke melden?“ nennt Zahlen und
  Folgen (A1 hält).
- **Übergabe:** „Bogen übergeben…“ mit Hinweis auf den Einsatzzeitraum und „⚠ 1
  offener Punkt — … Übergeben ist trotzdem möglich“, „QR-Code im Vollbild“ (mit
  „⚠ 12 Plätze ohne Namen — Stärke nach Soll“, R7-N7 hält), „Für neuen Einsatz
  vorbereiten“, „PDF erzeugen“. Das QR-Vollbild zeigt Stärke und Stand.
- **Einsatz-Sammlung:** Karten mit „Nr.“ und Sortierung „Nr. (wie auf dem
  Lageblatt)“ als Vorgabe, „neu“/„kürzlich eingetroffen“, Chips (Ruhezeit, Diesel),
  „Bedarf:“ bricht nicht mehr im Wort (R7-M1/G9/K7 halten); aufgeklappte Karte mit
  „Details“, „Bogen als PDF“, „Abrücken“, „Zug zuordnen“, „Auftrag/Notiz“, „Mehr…“.
  Abrücken meldet sofort „Abgerückt 21:33: Nr. 1 …“ mit „Rückgängig“.
- **Stapelimport (R7-N1):** Quittung „„THW Albstadt“ ähnelt „THW Albstadt
  Zugtrupp Technischer Zug“ – beide zählen getrennt. Dieselbe Einheit? Dann die
  doppelte Karte unter „Mehr…“ › „Entfernen“ wegnehmen (mit „Rückgängig“); beide
  Karten tragen die Marke „ähnelt“.“ Summe 59 → 63. Der Zusammenführen-Knopf fehlt
  weiter (bekannte Grenze R7-N1). Ein genauer Duplikat (gleiche Datei, auch zweimal
  in einem Zug) wird erkannt: „0 Bögen aufgenommen, 2 bereits vorhanden.“
- **Rückfragen:** „Ist das dieselbe Einheit?“ nennt „Bisher“, „Neu“ und
  „Geändert: Einheit: „THW Albstadt Zugtrupp Technischer Zug“ → „THW Albstadt““
  (R7-N8 hält); „Ja — als neue Fassung“ meldet „Folgemeldung: Einheit
  geändert“.
- **Unlesbares (R7-N3):** Karte auf der Startseite „Nicht lesbar: 1 Meldung in
  einer Sammlung. Sie fehlen in Listen und Zählung — die Stärke kann zu niedrig
  sein. Nichts davon ist gelöscht; die Daten stecken in der Datensicherung.“ mit
  „Daten sichern…“ und „Beiseitegelegtes entfernen…“; „1 Meldung nicht lesbar —
  Daten sichern“ an der Sammlung; der Eintrag liegt unter `eeb.unlesbar.v1`.
- **Geräteuhr (R7-D2/W2):** „Geräteuhr prüfen: Das Gerät zeigt den 31.01.2027, beim
  letzten Start war der 23.10.2026. … Bis du antwortest, löscht und anonymisiert
  die App nichts.“ mit „Was genau betroffen wäre“ (Sammlung und „vor 1 Minute
  geändert“, Eigener Bogen) und zweiter Bestätigung „Datum stimmt — jetzt endgültig
  löschen?“ mit „nicht im Papierkorb“.
- **Zwei Fenster (R7-O2/N6):** Leiste und Rückfrage nennen das Feld („Ort /
  Auftrag“) und Sekunden; beide Knöpfe ohne Aufklappen; „Zuletzt geschlossener
  Bogen“ einheitlich benannt (R7-N4 hält).
- **Lagemonitor:** „Uhr“-Beschriftung, „THW“ in einer Zeile (43 px Zeilenhöhe bei
  1 920 × 1 080), „Stärke F / U / M // gesamt“, „Eingetroffen: … vor 1 Min“,
  höchstens drei Bewegungszeilen mit „+ 11 weitere Bewegungen“, „+ 15 weitere
  Einheiten“, keine Personennamen; die Seite rollt am Telefon (360 × 1 427 px).
  Tablet und Querformat ohne seitlichen Überlauf.
- **Layout bei großer Schrift und Zoom (R7-N2/M3–M5):** Vorschlagsliste „FGr WP“
  bei 360 × 640 mit 200 % Schrift im Bild (35 bis 325 px, Seite 360 px), bei
  320 × 568 ebenso (35 bis 285 px). Die Seiten bleiben in Startseite, Schritt 1
  bis 6 und Sammlung bei 320, 360, 640 quer, 200 % und doppeltem Zoom ohne
  seitlichen Überlauf der Seite (Übersichtstabellen rollen im Container).
- **Musterung:** „Einsatz vorbereiten“ öffnet die Ansicht „Mein Standard“ („Alle
  sind vorab angehakt — wer oder was fehlt, antippen und abwählen“), Zurück führt
  zur Startseite, die App wird nicht verlassen (R7-H2).
- **Zurück-Verlauf:** Datensicherung, Beispielbögen, Löschen-Fenster: Zurück
  schließt das Fenster, die Adresse bleibt; nach dem Schließen per Knopf und
  erneutem Öffnen schließt Zurück wieder nur das Fenster.
- **Scan ohne Kamera:** „Dieses Gerät meldet keine nutzbare Kamera.“ mit Weg über
  USB-Handscanner, „Kamera erneut versuchen“ und „QR aus Bild einlesen…“.

## Abgleich mit Runde 7

Grundlage: [../runde-7/neuer-nutzer.md](../runde-7/neuer-nutzer.md) mit „Stand der
Behebung“ in [../runde-7/README.md](../runde-7/README.md).

| Runde-7-Befund | Stand laut Runde 7 | Bewertung Runde 8 | Beobachtung |
| --- | --- | --- | --- |
| R7-N1 Stapelimport nennt Doppelung nicht (P2) | teilweise (Quittung, Marke; kein Zusammenführen-Tipp) | hält, Rest bleibt (bekannte Grenze) | Quittung nennt „ähnelt … beide zählen getrennt“, Weg „Mehr…“ › „Entfernen“, beide Karten tragen die Marke; Summe 59 → 63; Zusammenführen-Knopf fehlt weiter. |
| R7-N2 Große Schrift: Liste der Einheitstypen breiter als Fenster (P2) | behoben | hält | 360 × 640 mit 200 %: Liste 35–325 px, Seite 360 px; 320 × 568: 35–285 px. |
| R7-N3 Unbrauchbarer Eintrag fehlt still (P2) | behoben | hält | Karte „Nicht lesbar: 1 Meldung in einer Sammlung …“ mit „Daten sichern…“; Sammlung „1 Meldung nicht lesbar“. |
| R7-N4 „Rückholplatz“ (P3) | behoben | hält | Rückfrage und Startseite sagen „Zuletzt geschlossener Bogen“. |
| R7-N5 Lagemonitor „Orga“ und Uhr (P3) | behoben | hält | „THW“ einzeilig, Beschriftung „Uhr“; neu nur R8-N1/N2 zur Fläche. |
| R7-N6 Zwei-Fenster: gleiche Stände, „Weniger“ (P3) | behoben | hält | Leiste nennt „Ort / Auftrag“ und Sekunden; Knopf heißt „Zuklappen“; Werte fehlen weiter (R8-N6). |
| R7-N7 QR-Vollbild ohne Hinweis auf Sollstärke (P3) | behoben | hält | „⚠ 12 Plätze ohne Namen — Stärke nach Soll“. |
| R7-N8 „Ist das dieselbe Einheit?“ ohne Änderung (P3) | behoben | hält | „Geändert: Einheit: „…“ → „…““. |
| R7-N9 Übersicht ohne Fußleiste, Ziffern der Schrittleiste (P3) | teilweise | hält, Rest bleibt (bekannte Grenze) | „← Zurück zu Schritt 5 (Sofortbedarf)“ am Ende; „5“ und „6“ weiter als Ziffer. |
| R6-O9 Uhrstand in der Zukunft, frische Sammlung | bekannte Grenze | nicht erneut geprüft | Hier nur der Stand: weiter offen laut README; in meinem Lauf nicht berührt. |
| R7-G4/M8 Ecken-Knopf hochkant | teilweise | nicht gesondert geprüft | Fußknopf „◐ Ansicht: Standard“ liegt in der Sammlung unten über dem Inhalt und verdeckt die letzte Kartenzeile (Bauart, bekannt). |
| R7-G8/H9 Geräteuhr-Warnung bei 200 % und 320 × 568 | teilweise | nicht gesondert geprüft | Warnung bei 360 × 640 und 100 % mit beiden Knöpfen im Bild. |

Nebenwirkungen der Runde-7-Umbauten: Der Lagemonitor am Telefon (Seite rollt,
Tabelle in Container) schiebt F/U/M aus dem Bild (R8-N1); die Kürzung der Tabelle
am Fernseher lässt Platz frei (R8-N2); der Deckel bei großer Schrift drückt den
Einsatznamen unter die Normalgröße (R8-N3). Die Zwei-Fenster-Leiste, die
Rückfragen, die Geräteuhr, die Umschalter und die Fußleiste des Assistenten
verursachten bei mir keinen Fehler. Bilanz: von neun Befunden meiner Rolle halten
sieben, zwei bleiben in den bekannten Grenzen (R7-N1 Zusammenführen-Tipp, R7-N9
Ziffern). Neu: kein P0, kein P1, kein P2, sieben P3 (R8-N1 bis R8-N7).

## Abschluss

- **Aufgabe geschafft:** ja (eigener Bogen, Übergabe mit QR-Vollbild,
  Schnellerfassung, Vorlage und Musterung, Meldekopf mit Folgemeldung,
  Doppelung, Zug, Abrücken, Lagemonitor).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die Schnellerfassung „nur Stärke“ gilt je nach
  Textstelle mit oder ohne Fahrzeuge (R8-N4).
- **Größtes Einsatzrisiko:** „Zug 2“ und „2. Zug“ zählen als zwei Züge; die
  Zwischensumme je Zug stimmt dann nicht (R8-N5).
- **Top-Priorität für die nächste Iteration:** Schreibweisen „Zug n“ und „n. Zug“
  gleichsetzen und die Texte der Schnellerfassung angleichen (R8-N5, R8-N4).
