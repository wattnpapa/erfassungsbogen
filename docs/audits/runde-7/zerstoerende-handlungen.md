# Audit „Zerstörende Handlungen", Runde 7 (Löschen, Überschreiben, Statuswechsel)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-destructive-action-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `a52f20a`.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-6-Befunde (siehe [../runde-6/zerstoerende-handlungen.md](../runde-6/zerstoerende-handlungen.md)
samt „Stand der Behebung"). Der laufende Build enthält die Behebungstexte aus
Runde 6 (geprüft an den neuen Dialogtexten, etwa „dann kann das neue Datum
kaum stimmen").

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Tipps als Touch-Tipp.
Grundeinstellung Telefon 360 × 640; dazu 320 × 568, 640 × 360 quer und
Zoom-Nachbildung 180 × 320; jeweils mit normaler Schrift und mit
`html { font-size: 200% }`. Jeder Lauf in einem eigenen Browser-Kontext, weil
elf weitere Prüfer denselben Server nutzten; der Server wurde nicht
angefasst.

Zustände kamen aus `localStorage`-Seeds (`eeb.entwurf.v1`, `eeb.einsaetze.v1`
mit sechs Einheiten aus `examples/thw/`, alle `uebung: false`, Stand auf
heute). Varianten: Sammlung mit eingestelltem Alter der letzten Änderung (0,
20, 30, 40, 50, 85 Tage), Sammlung im Papierkorb (14 Tage), eine zweite
Sammlung als Verschiebeziel, ein Entwurf mit vier unbenannten Plätzen, ein
abgeschnittener Entwurf (60 % des Textes), zwei Bogen-Dateien derselben
Einheit (älterer und neuerer Stand) und eine Sicherungsdatei ohne Sammlung.

Die Geräteuhr habe ich nachgestellt, indem eine zweite Seite im selben
Kontext mit einem Skript startete, das `Date.now()` und `new Date()` um N Tage
verschiebt; die Ausgangsseite war vorher geschlossen. Das Zugriffsprotokoll von
`localStorage` (Lesen und Schreiben von `eeb.uhr.v1` und `eeb.einsaetze.v1`)
habe ich mitgeschrieben. `page.clock.install` habe ich zunächst versucht und
verworfen: Es erzeugte in diesem Lauf widersprüchliche Uhrstände (ein Sprung
von 7,8 Jahren bei null Tagen Verschiebung, ein zweites Fenster ohne
verschobene Uhr schrieb dazwischen); aus diesen Läufen stammt kein Befund.
Zwei Fenster als zwei Seiten im selben Kontext.

Szenarien (zuerst ohne Blick in die Berichte, den Runde-6-Bericht danach):

1. Startseite: „Verwerfen", „Neuen Bogen erstellen", „Aus Datei laden…",
   „Geräteschlüssel neu erzeugen", „Alle Daten löschen" (Haken, Abbruch,
   Durchführung), „Datensicherung" mit „Sicherung einspielen…".
2. Zurückholen und Rückholplatz: Verwerfen, neuer Bogen, zwei Dateien
   nacheinander.
3. Einsatzansicht: „Abrücken" (Einfach- und Doppeltipp), „Entfernen",
   „Verschieben…" in eine zweite Sammlung, Bogen einlesen (älterer und
   neuerer Stand), „Einsatz löschen…", Papierkorb mit „Wiederherstellen" und
   „Endgültig löschen…", Rückgängig nach Seitenwechsel und Neuladen.
4. Assistent Schritt 3: Person entfernen (einzeln, in Reihe, Rückgängig),
   „Vorbelegung entfernen", „Bogen schließen", „Als Vorlage speichern".
5. Zwei Fenster: „Alle Daten löschen", Verwerfen in einem Fenster und Weiter-
   arbeit im anderen, Sammlung im anderen Fenster gelöscht und verändert.
6. Geräteuhr +59, +45, +65, +365 Tage mit verschieden alten Sammlungen.
7. Unlesbarer Entwurf: Karte, „Entfernen…", Aufzählung bei „Alle Daten
   löschen".
8. Dialoge bei 320 × 568 / 200 % Schrift / quer / Zoom-Nachbildung.

**Nicht prüfbar:** eine echt falsch gestellte Geräteuhr, zwei echte Geräte an
einer Sammlung, Beenden der App durch das Betriebssystem, Kamera-Scan, native
Builds, Handschuhe, die Dauer der Rückgängig-Fristen, das echte Verstreichen
der 90 Tage beim beiseitegelegten Bogen und „Papier-Abgleich" bis zum Ende
(nur Code gelesen).

## Urteil

Die Löschwege halten. Jede endgültige Handlung nennt vor dem Auslösen Zahl,
Namen und „keine Kopie": „Alle Daten löschen" zählt Vorlagen, Sammlungen mit
Meldungen, „noch kein Export, kein Lageblatt und keine Weitergabe von:
„Hochwasser Musterstadt"" und den Entwurf auf und sperrt den Knopf bis zum
Haken; „Sicherung einspielen" nennt beide Seiten; Papierkörbe nennen Datum
und Restzeit; „Person entfernen" fragt mit Namen und kann samt Neuladen
zurückgenommen werden; „Abrücken" und „Verschieben…" sind einfach, aber mit
„Rückgängig" abgesichert; ein Doppeltipp auf „Abrücken" kippt den Status nicht
zurück. Das zweite Fenster erfährt von Änderungen am Bogen und an der Sammlung
und schreibt nichts zurück. Die Geräteuhr-Rückfrage nennt Sammlungen jetzt mit
Namen und Alter und warnt, wenn eine „vor 1 Minute" noch bearbeitet wurde.

Drei Ränder sind offen: Der Schutz vor „Alle Daten löschen" im zweiten Fenster
greift nur zur Hälfte (R7-D1, Rest von R6-D1). Die Behebung für Sprünge von 30
bis 60 Tagen (R6-D7) hält nur beim ersten Lesen; beim zweiten wird die Frage
verworfen und die Sammlung gelöscht (R7-D2). Und der Rückholplatz fasst einen
Bogen: Wer nacheinander zwei Bogen-Dateien öffnet, verliert den eigenen Bogen,
obwohl beide Rückfragen „bleibt erreichbar" sagen (R7-D3). Ein P0 oder P1 habe
ich nicht gefunden; alle Aufgaben lassen sich ohne fremde Hilfe erledigen.

## Übersicht: Handlung → Bestätigung → Rückweg

Alles beobachtet bzw. im Speicher gemessen.

| Handlung | Bestätigung | Rückweg (geprüft) |
| --- | --- | --- |
| „Verwerfen" (Startseite) | Rückfrage mit Name des Bogens | „Zuletzt geschlossenen Bogen zurückholen" ✓; **nur ein Platz (R7-D3)** |
| „Neuen Bogen erstellen" mit Entwurf | Rückfrage „Neuen Bogen anfangen?" | wie oben |
| „Aus Datei laden…" mit Entwurf | Rückfrage „Bogen aus Datei öffnen?" bzw. Wahl mit „Ersetzt deinen angefangenen Bogen" | wie oben; **zweite Datei verdrängt den eigenen Bogen (R7-D3)** |
| „Bogen schließen" | Rückfrage, „nicht gelöscht" | Rückholplatz |
| „Person entfernen" | Rückfrage mit Name | Quittung „Rückgängig", überlebt Neuladen und Schrittwechsel ✓ |
| „Vorbelegung entfernen" (Schritt 3) | keine, bewusst | Quittung „Rückgängig" auch nach Neuladen ✓ |
| „Abrücken" | keine | „Rückgängig", „Wieder anwesend"; Doppeltipp bleibt bei einmal abgerückt ✓ |
| „Entfernen" (Meldung) | Rückfrage: „gibt es nur, solange die App geöffnet bleibt" | „Rückgängig" (nach Seitenwechsel ✓) |
| „Verschieben…" | Zielwahl mit Folge („verliert 4 Helfer", „wird zusammengeführt") | „Rückgängig — zurück nach „Hochwasser Musterstadt"" ✓ |
| Neuerer Bogenstand einlesen | keine; Stärkeänderung in „Neu seit der letzten Kenntnisnahme" | Historie |
| Älterer Bogenstand einlesen | keine; „nur in die Historie gelegt" | Historie |
| „Einsatz löschen…" | Rückfrage „30 Tage zurückholen" | Papierkorb, „Rückgängig" ✓ |
| Papierkorb „Endgültig löschen…" | Rückfrage mit „einzige Kopie" | keiner, bewusst |
| „Alle Daten löschen" | Aufzählung, Haken, Knopf gesperrt, „Vorher Sicherung erstellen…" | Sicherungsdatei |
| „Sicherung einspielen…" | Aufzählung beider Seiten, Haken | Sicherungsdatei |
| „Geräteschlüssel neu erzeugen" | eine Rückfrage, kein Haken (R7-D6) | keiner |
| Beiseitegelegter Bogen „Entfernen…" | Rückfrage mit Hinweis „Als Datei sichern" | Datei |
| Geräteuhr 60 Tage und mehr | Warnung, Rückfrage mit Namen und Alter | „Uhr korrigieren" ✓ |
| Geräteuhr 31 bis 59 Tage | **Halt fällt beim zweiten Lesen (R7-D2)** | keiner |

## Befunde

### R7-D1 [P2] „Alle Daten löschen" in Fenster A: Fenster B zeigt die Entwurfskarte weiter und schreibt über „Neu anfangen" den gelöschten Bogen mit 38 Namen in den Rückholplatz zurück (Rest von R6-D1)

**Priorität:** P2

**Kennzeichnung:** gemessen (Speicher vor und nach, Bildschirmfoto
`h1-b.png`).

**Fundstelle / Aufgabe:** Zwei Fenster im selben Gerät auf der Startseite, Seed
mit Entwurf (Großbogen „Verstärkter Bergungszug", 38 Personen) und einer
Sammlung. Fenster A: Fußzeile „Alle Daten löschen", Haken, „Endgültig löschen",
„Neu starten". Fenster B bleibt auf der Startseite. Code: `src/app/app.tsx`
(Startseite hält den Entwurf im Arbeitsspeicher), `src/app/entwurf.ts`
(`ersetztenEntwurfMerken` schreibt aus dem Arbeitsspeicher).

**Beobachtung:**

- Nach dem Löschen enthält der Speicher nur `eeb.uhr.v1` (und die
  Offline-Zeile). Fenster B baut sich teilweise neu auf: Die Vorlagenkarten und
  der Abschnitt „Einsatz-Sammlung" sind verschwunden (die Behebung von R6-D1
  wirkt dort). Die Karte „THW Oldenburg (NI) Verstärkter Bergungszug … Stärke
  1 / 9 / 28 / 38" mit „Fortsetzen", „Verwerfen" und dem Hinweis „⚠ In einem
  anderen Fenster gelöscht oder geschlossen — hier wird nichts gespeichert"
  bleibt stehen.
- „Neuen Bogen erstellen" in B fragt „Der angefangene Bogen „THW Oldenburg …"
  wird durch einen leeren Bogen ersetzt … unter „Zuletzt geschlossenen Bogen
  zurückholen" erreichbar" — den es nicht mehr gibt. Nach „Neu anfangen" liegt
  `eeb.entwurf.ersetzt.v1` mit 14 974 Zeichen im Speicher: der gelöschte Bogen
  mit allen 38 Namen. Der neue Bogen selbst wird nicht gespeichert (Leiste „hier
  wird nichts gespeichert").
- Die Behebung aus Runde 6 („Ein Fenster ohne offenen Bogen baut sich neu auf")
  greift damit nur für Fenster ohne Entwurfskarte. Das häufige Bild — beide
  Fenster zeigen die Startseite mit dem Entwurf — bleibt offen.

**Erwartung der Rolle:** Wer „Alle Daten löschen" bestätigt hat (Gerät geht an
eine andere Person), erwartet danach nichts Eigenes mehr im Speicher, auch wenn
ein zweites Fenster offen war. Die Karte im zweiten Fenster sollte nicht mehr
zum Ersetzen einladen.

**Auswirkung im Einsatz:** Namen und Erreichbarkeiten von 38 Personen stehen
nach dem „endgültigen" Löschen wieder auf dem Gerät und erscheinen unter
„Zuletzt geschlossenen Bogen zurückholen". Voraussetzung sind ein zweites
offenes Fenster und mehrere bewusste Tipps; deshalb P2.

**Empfehlung:** Meldet ein Fenster „Alle Daten gelöscht", baut ein anderes
Fenster die Startseite vollständig aus dem Speicher neu auf (auch die
Entwurfskarte); mindestens darf der Rückholplatz nicht aus dem Arbeitsspeicher
beschrieben werden, wenn der Entwurf extern entfernt wurde.

**Nachprüfung:** Wie oben; nach „Neu anfangen" in B darf
`eeb.entwurf.ersetzt.v1` nicht entstehen, und die Karte muss nach dem Löschen in
A verschwinden oder „Neuen Bogen erstellen" ohne Ersetzen-Frage arbeiten.

### R7-D2 [P2] Geräteuhr-Sprung von 31 bis 59 Tagen: Der Halt aus R6-D7 fällt beim zweiten Lesen, die Sammlung wird ohne Frage gelöscht

**Priorität:** P2

**Kennzeichnung:** gemessen (Zugriffsprotokoll des Speichers, Läufe mit
Ruhe/Sprung 40/59, 50/45, 40/45, 85/10, 0/59, 30/62, 20/75; Einheitentest der
Prüffunktion als Gegenprobe).

**Fundstelle / Aufgabe:** Sammlung „Hochwasser Musterstadt" mit Meldungen,
letzte Änderung vor 40 Tagen; Uhr springt um 59 Tage vor (Geräteuhr falsch oder
echte Pause). Code: `src/app/datenschutz-uhr.ts` (`geraeteuhrPruefen`, Zeilen
92 bis 96).

**Beobachtung:**

- Beim ersten Lesen hält die App den Sprung: Der Speicher bekommt
  `eeb.uhr.v1 = {"zuletzt":Z,"sprung":S}`. Unmittelbar danach, noch ohne
  Eingabe, schreibt sie `eeb.uhr.v1 = {"zuletzt":S}` (Sprung angenommen) und
  `eeb.einsaetze.v1 = []`; `eeb.aufgeraeumt.v1` hält den Namen. Es erscheint
  weder die Warnung „Geräteuhr prüfen" noch eine Rückfrage; nur der Hinweis
  „Automatisch gelöscht" mit „Verstanden" steht danach da.
- Ursache im Code: Der Zweig für Sprünge bis 60 Tage (`Math.abs(abstand) <=
  60 Tage`) fragt `bisher.sprung == null` ab. Ist der Sprung schon vermerkt,
  gilt beim nächsten Aufruf `annehmen()`. Der Kommentar nennt das Gegenteil
  („Ist der Sprung schon vermerkt, bleibt es dabei, bis die Uhr zurückpasst
  oder der Helfer bestätigt"). Der Einheitentest ruft die Prüfung nur einmal
  auf und sieht deshalb „gehalten".
- Gelöscht wurde bei Ruhe/Sprung 40/59 und 50/45 (jeweils mehr als 90 Tage
  zusammen). Nicht gelöscht, weil nichts fällig ist: 40/45, 0/59, 20/75 (über
  60 Tage: Warnung wie in Runde 6), 30/62.

**Erwartung der Rolle:** Würde der Sprung eine bisher nicht angekündigte
Sammlung löschen, fragt die App, wie sie es ab 60 Tagen tut — und fragt
weiter, bis jemand antwortet.

**Auswirkung im Einsatz:** Eine seit sechs Wochen ruhende Sammlung (zum Beispiel
eine Übung, die erst wieder gebraucht wird) verschwindet nach zwei Monaten ohne
Papierkorb und ohne Frage. Eine echte Pause von 59 Tagen ist ebenso betroffen.
Die Folge ist die einer unbestätigten Löschung; die Wahrscheinlichkeit ist
gering, deshalb P2. Im Bericht „Stand der Behebung" von Runde 6 steht R6-D7 als
behoben; im Browser ist die Wirkung nicht vorhanden.

**Empfehlung:** Den Halt auch bei schon vermerktem Sprung bis zur Antwort
beibehalten (die Bedingung für „kann überraschen" darf nicht an
`sprung == null` hängen), und den Test mit zwei aufeinanderfolgenden Aufrufen
schreiben.

**Nachprüfung:** Sammlung 40 Tage ruhend, Uhr +59 Tage, Seite zweimal laden:
Warnung „Geräteuhr prüfen" steht, `eeb.einsaetze.v1` bleibt unverändert.

### R7-D3 [P2] Der Rückholplatz fasst einen Bogen: Zwei Bogen-Dateien nacheinander verdrängen den eigenen Bogen, obwohl beide Rückfragen „bleibt erreichbar" sagen

**Priorität:** P2

**Kennzeichnung:** gemessen (Speicher nach jedem Schritt).

**Fundstelle / Aufgabe:** Startseite mit eigenem Entwurf (38 Personen) →
„Aus Datei laden…" mit Bogen A (Albstadt, 2 Personen) → Rückfrage „Bogen aus
Datei öffnen? … Der Stand bleibt … erreichbar" → „Datei öffnen" → Startseite →
„Aus Datei laden…" mit Bogen B → „Datei öffnen". Code: `src/app/entwurf.ts`
(`ersetztenEntwurfMerken`, `rueckholungNimmt`: Schutz nur gegen fremde
Erfassungen am Meldekopf, nicht gegen geöffnete Dateien).

**Beobachtung:** Nach der ersten Datei: Entwurf = Bogen A (2 Personen),
Rückholplatz = eigener Bogen (38). Nach der zweiten: Entwurf = Bogen B (1
Person), Rückholplatz = Bogen A (2); der eigene Bogen mit 38 Personen steht
nirgends mehr. Die zweite Rückfrage nennt nur den ersetzten Bogen A; dass der
Rückholplatz dabei den eigenen Bogen aufgibt, steht dort nicht.

**Erwartung der Rolle:** Der eigene, angefangene Bogen geht nicht verloren,
weil danach zwei fremde Dateien angesehen wurden; mindestens sagt die Rückfrage
„dabei fällt auch der zuvor beiseitegelegte Bogen weg".

**Auswirkung im Einsatz:** Wer am Meldekopf zwei Bögen aus Dateien nacheinander
ansieht (statt „In Sammlung aufnehmen"), verliert die eigene Meldung mit allen
Namen. Beide Rückfragen sind einzeln wahr; verloren geht der Bogen erst durch
die Kombination. P2, weil „In Einsatz aufnehmen" der vorgesehene Weg ist und
der Entwurf der Datei nicht verloren geht.

**Empfehlung:** Zwei Plätze (eigener Bogen und zuletzt angesehener), oder die
Rückfrage nennt den Verlust des beiseitegelegten Bogens, wenn der Platz belegt
ist („Dein früherer Bogen „THW Oldenburg …" (38 Personen) wird dabei endgültig
entfernt").

**Nachprüfung:** Wie oben; nach der zweiten Datei muss der eigene Bogen noch
unter „Zuletzt geschlossenen Bogen zurückholen" stehen oder die zweite
Rückfrage ihn nennen.

### R7-D4 [P3] Datumsformen in den Karten uneinheitlich (Rest von R6-D6)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** „Papierkorb Einsätze" (Sammlung 14 Tage vor dem
Löschen gesetzt) und Karte des beiseitegelegten Bogens.

**Beobachtung:** „gelöscht am 09.10.2026 — Wird am 8.11.2026 endgültig entfernt
(in 16 Tagen)" — zweistellig und einstellig in einem Satz. Die Karte des
beiseitegelegten Bogens: „löscht ihn am 21.1.2027 von selbst". Die Behebung
sagt „Datumsform der Papierkörbe ist einheitlich (zweistellig)"; der Satz
bleibt in der Restzeit einstellig.

**Folge:** Kein Datenverlust; beim schnellen Lesen von „8.11." gegen „09.10."
sieht die Restzeit aus wie ein anderes Format.

**Empfehlung:** Eine Formatfunktion für alle Datumsangaben der Löschfristen.

**Nachprüfung:** Sammlung mit Löschdatum im September: beide Daten
zweistellig.

### R7-D5 [P3] Warnung „Geräteuhr prüfen" bei nur einem Betroffenen: „wird die Namen … gelöscht"

**Priorität:** P3

**Kennzeichnung:** beobachtet (Warnung und Rückfrage, Sprung +365 Tage).

**Fundstelle / Aufgabe:** `src/app/uhr-folgen.ts` / `uhr-warnung.tsx`
(Zusammenfassungstext der Folgen).

**Beobachtung:** Ist nur der eigene Bogen betroffen: „Wenn das Datum stimmt,
wird die Namen im eigenen Bogen endgültig gelöscht." und in der Rückfrage
„Damit wird die Namen im eigenen Bogen endgültig gelöscht — nicht im
Papierkorb." Bei mehreren Betroffenen steht „werden 1 Sammlung und die Namen im
eigenen Bogen" richtig.

**Folge:** Ein Satz, der an der Stelle der Entscheidung holprig wirkt; die
Bedeutung bleibt erkennbar.

**Empfehlung:** „… werden die Namen im eigenen Bogen …" für den Fall mit einem
Posten.

**Nachprüfung:** Uhr +365 Tage mit nur einem Entwurf: Satz im Plural.

### R7-D6 [P3] „Geräteschlüssel neu erzeugen": eine Rückfrage ohne Haken und ohne „Vorher sichern"; der Text behauptet ein Löschen auch ohne Schlüssel

**Priorität:** P3

**Kennzeichnung:** gemessen (Speicher vor und nach, Dialogtext); Auswirkung als
Risiko.

**Fundstelle / Aufgabe:** Fußzeile „Geräteschlüssel neu erzeugen" →
„Geräteschlüssel neu erzeugen?" → „Neu erzeugen".

**Beobachtung:** Die Rückfrage (Absatz zu Empfängern, Kurzform, „lässt sich
danach nicht wiederherstellen") hat nur „Neu erzeugen" und „Abbrechen". „Alle
Daten löschen" und „Sicherung einspielen" verlangen dagegen einen Haken und
bieten eine Sicherung an; hier fehlt beides. Auf einem Gerät ohne Schlüssel
(`eeb.geraeteschluessel.v1` fehlte) sagt der Text trotzdem „Der bisherige
Signaturschlüssel dieses Geräts wird gelöscht"; danach liegt ein Schlüssel im
Speicher, die Quittung nennt die neue Kurzform.

**Folge:** Der neue Schlüssel macht die Kurzform für alle Empfänger ungültig, die
den alten kennen; der alte private Schlüssel ist nur noch in einer früheren
Sicherungsdatei. Wer ohne Sicherung antippt, kann die Herkunft früherer Bögen
nicht mehr selbst belegen. Wegen der Seltenheit P3.

**Empfehlung:** „Vorher Sicherung erstellen…" anbieten wie bei „Alle Daten
löschen"; den Satz nach vorhandenem Schlüssel unterscheiden.

**Nachprüfung:** Gerät mit und ohne Schlüssel: Text und Angebot passen zum
Bestand.

### R7-D7 [P3] „Alle Daten löschen" bei 200 % Schrift: Haken und Knopf liegen am Ende eines 4 000 px hohen Dialogs

**Priorität:** P3

**Kennzeichnung:** gemessen (Maße der Knöpfe im Dialog, Bildschirmfotos
`q1-*.png`).

**Fundstelle / Aufgabe:** „Alle Daten löschen" bei 320 × 568 mit
`font-size: 200 %`.

**Beobachtung:** Dialog 534 px sichtbar, Inhalt 4 014 px; „Endgültig löschen"
liegt bei 3 778, „Abbrechen" bei 3 926 (jeweils 88 bis 136 px hoch). Auf 360 ×
640: 3 408 px Inhalt. „Schließen" liegt oben (88 px hoch), Zurück-Taste und
Esc schließen ebenfalls. Normale Schrift 320 × 568: 1 169 px, quer 640 × 360:
701 px. Alle Knöpfe erreichbar, kein seitlicher Überlauf.

**Folge:** Wer mit großer Schrift löscht, scrollt sieben Bildschirme durch die
Aufzählung, bevor der Knopf kommt; das ist als Bremse gut, aber „Vorher
Sicherung erstellen…" liegt ebenfalls erst dort.

**Empfehlung:** Bei großer Schrift Sicherung und Abbrechen oben anbieten oder
die Aufzählung zusammenfassen.

**Nachprüfung:** 200 %: „Vorher Sicherung erstellen…" im ersten oder zweiten
Bildschirm.

### R7-D8 [P3] „Als Vorlage speichern" mit gleichem Namen legt eine zweite Vorlage an, ohne Hinweis

**Priorität:** P3

**Kennzeichnung:** gemessen (Speicher), Anzeige in der Vorlagenliste nicht
geprüft.

**Fundstelle / Aufgabe:** Assistent Übersicht → „Als Vorlage speichern" mit „OV
Test", dann Person entfernt, erneut mit „OV Test".

**Beobachtung:** `eeb.vorlagen.v1` enthält danach zwei Einträge „OV Test"
(14 761 und 14 456 Zeichen); kein Dialog, kein Überschreiben, kein Hinweis auf
den vorhandenen Namen.

**Folge:** Nichts geht verloren; beim Mustern wählt der Helfer zwischen zwei
gleich benannten Karten und weiß nicht, welche die aktuelle ist.

**Empfehlung:** Beim Speichern „Es gibt schon eine Vorlage „OV Test" (gespeichert
…) — ersetzen oder zusätzlich anlegen?" oder den Zeitpunkt in der Karte nennen.

**Nachprüfung:** Zweimal denselben Namen speichern: Frage oder unterscheidbare
Karten.

## Bestätigtes

Alles im Browser nachgespielt:

- **„Alle Daten löschen":** Aufzählung nennt Vorlagen, Sammlung mit Zahl der
  Bögen und „noch kein Export, kein Lageblatt und keine Weitergabe von:
  „Hochwasser Musterstadt"", den Entwurf, Absenderkarte, Geräteschlüssel,
  Einstellungen; „Endgültig löschen" ist ohne Haken gesperrt (Tipp mit
  erzwungenem Klick ändert nichts); danach Quittung „Alle lokalen Daten
  gelöscht — Neu starten". Der Speicher enthält nur `eeb.uhr.v1` und die
  Offline-Zeile.
- **Beiseitegelegter Bogen (R6-D2):** Die Aufzählung nennt „ein
  beiseitegelegter, unlesbarer Bogen (Startseite, „Als Datei sichern" vorher
  möglich)"; „Entfernen…" fragt mit Hinweis auf die Datei; die Karte nennt das
  Löschdatum.
- **Geräteuhr ab 60 Tagen (R6-D3):** Warnung und Rückfrage nennen „„Hochwasser
  Musterstadt" (vor 1 Minute geändert)" und „dann kann das neue Datum kaum
  stimmen"; „Eine Sammlung, die du noch brauchst, vorher exportieren: Dazu
  „Abbrechen" und die Sammlung öffnen." +65 Tage ohne Fälliges: keine Frage.
- **Rückgängig im Assistenten (R6-D4):** „Vorbelegung entfernen" (vier
  unbenannte Plätze, Stärke 38 → 34) mit Quittung, „Rückgängig" nach Neuladen
  und Schrittwechsel vorhanden. Mehrere „Person entfernen" fassen eine Quittung
  zusammen („Entfernt: 2 Personen (Wolf, Tim; Peters, Dominik)", Semikolon);
  ein „Rückgängig" holt beide zurück.
- **Rückfragen vor Ersetzen des Entwurfs:** „Neuen Bogen anfangen?", „Bogen aus
  Datei öffnen?", Wahl mit „In „Hochwasser Musterstadt" aufnehmen" vor „Bogen
  öffnen" (nennt „Ersetzt deinen angefangenen Bogen …").
- **Zwei-Fenster-Abgleich:** Fenster B zeigt nach „Verwerfen" in A „⚠ Dieser
  Bogen wurde in einem anderen Fenster gelöscht oder geschlossen. Hier wird
  nichts gespeichert, bis du entscheidest" mit „Neu laden, hier verwerfen" und
  „Bogen hier wieder speichern". Die Einsatzansicht meldet „Die Sammlung …
  wurde in einem anderen Fenster in den Papierkorb gelegt", der Knopf „Abrücken"
  ist weg, im Speicher bleibt der Status unverändert. „Abrücken" in einem
  Fenster erscheint im anderen und wird dort nicht überschrieben.
- **Zurück-Taste:** Bei offener Rückfrage („Meldung entfernen?") schließt „Zurück"
  den Dialog, die Meldung bleibt, die Seite wechselt nicht.
- **Papierkorb Einsätze:** „Wiederherstellen" und „Endgültig löschen…" mit
  „einzige Kopie"; „Einsatz löschen…" gibt „Rückgängig" auf der Startseite.
- **„Sicherung einspielen…":** Dialog mit beiden Seiten, Haken, Knopf gesperrt,
  „Vorher Sicherung erstellen…"; bei 360 × 640 liegt der Knopf unter dem Rand
  (Scrollen im Dialog).
- **Doppeltipp „Abrücken":** bleibt bei „abgerückt", weil der zweite Tipp
  wegfällt; „Wieder anwesend" liegt zwar im selben Raster, löst aber nicht aus.
- **Einlesen eines älteren Standes:** „nur in die Historie gelegt"; eines neueren
  Standes (Stärke 4 → 2) steht unter „Neu seit der letzten Kenntnisnahme" mit
  Zahlen.
- **Dialoge bei 320 × 568, 640 × 360, 200 % Schrift:** Knöpfe 44 bis 136 px
  hoch, 24 px (normal) bis 48 px (200 %) Haken; kein seitlicher Überlauf;
  die Quittung „Rückgängig" liegt über der Fußleiste, auch quer bei 200 %
  (221 bis 266 von 360 px).

## Abgleich mit Runde 6

| Befund Runde 6 | Stand in Runde 7 | Beleg |
| --- | --- | --- |
| R6-D1 „Alle Daten löschen" im zweiten Fenster (P2) | teilweise | Vorlagen und Sammlungen verschwinden in B; Entwurfskarte bleibt und schreibt den gelöschten Bogen in den Rückholplatz (R7-D1) |
| R6-D2 beiseitegelegter Bogen fehlt in der Aufzählung (P2) | hält | Aufzählung nennt ihn, „Entfernen…" ebenfalls |
| R6-D3 Rückfrage „Geräteuhr stimmt" ohne Namen (P2) | hält | Namen, Alter, „kaum stimmen" bei +365 Tagen |
| R6-D4 Rückweg Schritt 3 überlebt Neuladen nicht (P3) | hält | Quittung und „Rückgängig" nach Neuladen und Schrittwechsel |
| R6-D5 beiseitegelegter Bogen ohne Frist (P3) | hält wie angegeben | Karte nennt „löscht ihn am 21.1.2027"; der Rohtext bleibt bis dahin im Speicher (Stand der Behebung „teilweise"); Ablauf der 90 Tage nicht prüfbar. Datumsform siehe R7-D4 |
| R6-D6 Wortlaut, Datumsform (P3) | teilweise | Semikolon in der Quittung ✓; Datumsform in Papierkorb und Karte weiter uneinheitlich (R7-D4) |
| R6-D7 Sprung unter 60 Tagen ohne Frage (P3) | wirkungslos im Browser | Halt beim ersten Lesen, beim zweiten angenommen und gelöscht (R7-D2, hier P2) |

Nebenwirkungen der Runde-6-Änderungen: Die Fußleiste des Assistenten verdeckt
die Quittung „Rückgängig" nicht, auch nicht bei 200 % Schrift und quer. Der
Zurück-Verlauf der Startseitenfenster schließt Rückfragen, statt die Seite zu
wechseln. Die neue Rückholregel (Rückfrage nennt „bleibt erreichbar") ist für
einen Wechsel richtig und für zwei hintereinander falsch (R7-D3). Die neuen
Aufzählungen und Warnungen sind länger als die Fenster hoch (R7-D7), halten
aber alle Knöpfe erreichbar.

Verweise auf andere Runde-6-Berichte: Das Verhalten beim Neuladen und bei zwei
Fenstern steht ergänzend in
[offline-und-speicher.md](../runde-6/offline-und-speicher.md) und
[fehler-und-wiederanlauf.md](../runde-6/fehler-und-wiederanlauf.md).

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Der Stand bleibt erreichbar" gilt für den
  nächsten Wechsel, nicht für den übernächsten (R7-D3).
- **Größtes Einsatzrisiko:** Eine ruhende Sammlung fällt bei einem
  Uhrsprung von 31 bis 59 Tagen ohne Frage weg, weil der Halt nur beim ersten
  Lesen gilt (R7-D2).
- **Top-Priorität für die nächste Iteration:** den Halt der Geräteuhr bei
  Sprüngen unter 60 Tagen dauerhaft machen (`sprung == null` aus der Bedingung
  nehmen, Test mit zwei Aufrufen) und danach die Startseite des zweiten Fensters
  nach „Alle Daten löschen" vollständig neu aufbauen (R7-D1).

Zählung: P0 0, P1 0, P2 3 (R7-D1 bis R7-D3), P3 5 (R7-D4 bis R7-D8).
