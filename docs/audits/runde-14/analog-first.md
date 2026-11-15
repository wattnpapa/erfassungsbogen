# Audit „Analog first", Runde 14 (Papier-Rückfallebene, Rückweg vom Papier)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-10-26 · Prüfgegenstand: laufende Web-App,
Produktionsbuild auf http://localhost:4173, Code-Stand Commit `429c41a` (`main` nach Runde 13).

Zählung: **P0 0 · P1 0 · P2 1 · P3 2** (3 Befunde, neu).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, `docs/audits/runde-13/README.md`,
`runde-12/README.md`, `runde-11/README.md` sowie die Überschriften der früheren Analog-first-Berichte (R11 bis R13).
Die parallel entstandenen Berichte der Runde 14 wurden nur auf Doppelungen durchgesehen; Befunde, die dort schon stehen
(Zug „Zuordnen" ohne Quittung R14-H2/-G2/-D3, „Meldung vor …" R14-K1, Lageblatt-Hinweise R14-W1/-K2/-K4), sind hier
nicht erneut gemeldet.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen; die Projektkopie fand keinen Browser, das globale
Playwright-Modul schon), `isMobile`/`hasTouch`, Locale de-DE, Telefon 390 × 844 und 360 × 640, jeweils frischer
Kontext. Einsatz-Sammlung mit 2, 3, 4, 6 und 40 THW-Übungsbögen aus `examples/thw/` (auf `uebung: false`, Stand auf
„vor 60 bis 180 Minuten" gesetzt; zusätzlich zwei unveränderte Bögen mit Stand Juli und eine Mischung mit einem
Übungsbogen), eingelesen über „Bögen einlesen…". Durchgespielt:

- Zur Kenntnis nehmen, Auftrag/Notiz (auch 230 Zeichen), Zug für alle, Abrücken, „ändern" an Eintreff- und
  Abrückzeit (Abrücken vor Eintreffen), „Wieder anwesend".
- Lageblatt (2, 4, 5 und 40 Einheiten: 2 bis 5 Seiten), Sammel-PDF (6 Einheiten 15 Seiten, 40 Einheiten 94 Seiten,
  2,2 MB), Blanko-Vordruck, Übersicht- und Vollständig-CSV, Excel-Liste, Seite „Papier oder digital?".
- „Einheit manuell erfassen…" und „Einheit schnell erfassen" mit „Angaben vom Zettel" (Eingetroffen, Abgerückt, Nr.,
  Zug), doppelte Nr., vertauschte Zeiten, Mitternacht (Geräteuhr 23:10, Zettel 23:50).
- Zweigeräte-Probe mit zwei Kontexten: Sammel-PDF über „Einsatz importieren…" auf Gerät B; ältere Datei über neueren
  Stand; Datensicherung erstellen und auf leerem Gerät einspielen; Sicherungsdatei in „Einsatz importieren…" und
  „Aus Datei laden…" (falscher Weg).
- Geräteuhr mit `page.clock` um drei Stunden zurückgestellt; Offline-Betrieb mit `setOffline(true)` und Neuladen.
- PDFs mit `pdftotext -layout`, `pdfinfo` und `pdftoppm` gelesen.

**Annahmen:** Der Meldekopf führt neben dem Gerät einen Meldeblock mit „an / ab" je Einheit; das zuletzt gedruckte
Lageblatt hängt nach einem Geräteausfall weiter an der Wand und wird von Zugführern und der Ablösung gelesen; die
Sammel-PDF geht an die Ablösung.

**Nicht prüfbar:** echtes Drucken (Druckrand, Graustufen, Heften), Kamera- und Handscanner, Safari, native Builds,
echte Akku- oder Geräteausfälle, echte Uhrabweichungen eines Tablets ohne Netz. Bei Übungsbögen entstehen „Zeitraum
vorbei" und „Anderer Einsatz?" aus den Daten (Zeitraum Juli, Auftragstext anderer Lagen); das ist Seed-Artefakt und
nicht gewertet.

**Bekannte Grenzen, nicht neu gemeldet:** alle in der Aufgabe genannten (R6-O9 bis R13-H1). Gesehen und nicht gewertet:
„Weitergabe-Datei erzeugt … Empfang nicht bestätigt" (R12-W3), kein Zustand „beendet" (R13-W6), „Lageblatt: Bemerkung
der Einheit gekürzt, Rest: Sammel-PDF" (gewollt, R11-A5).

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert (Seitentext, PDF-Text); *beobachtet* = gesehen;
*Risiko* = abgeleitet.

## Urteil

Die Papierseite trägt weiter und ist seit Runde 13 noch dichter geworden. Der Rundlauf Gerät A → Sammel-PDF → Gerät B
hält (gemessen): Auftrag, Abgerückt-Stand, Zug und Eintreffzeit kommen an, auch bei einer von Hand erfassten Einheit
ohne Bogen („Nr. 17 · THW Verden · 2. Zug · eingetroffen 08:00 · am Meldekopf von Hand erfasst"). Das Lageblatt sagt
von sich aus, wann es veraltet: „Lageblatt erstellt 10:09 · seitdem 1 Änderung (Abrücken) — Aushang ist nicht mehr
aktuell, neu drucken", ebenso nach einer Änderung des Auftrags. Bei 40 Einheiten bleibt es bei 5 Seiten mit Nachtragszeilen
und „Summe einschl. Nachträge (von Hand)". Übungsbögen stehen als „ÜBUNG · zählt nicht in diese Lage" auf Papier. Die
Zettel-Eingabe fängt Zahlendreher ab (Abgerückt vor Eintreffen: „Stimmt die Zeit?"; 23:50 um 23:10: „Stunde oder Tag
vertauscht?" mit Knopf „Gestern 25.10.2026, 23:50"; doppelte Nr.: „Nr. schon vergeben"). Der falsche Weg für eine
Sicherungsdatei wird erklärt („… ist eine Datensicherung. Sie wird über die Fußzeile „Datensicherung" eingespielt").
Offline mit Neuladen läuft ohne Einschränkung.

Die Aufgabe „Lage auf Papier bringen, weitergeben, vom Meldeblock nachtragen, auf einem zweiten Gerät fortsetzen"
gelingt ohne fremde Hilfe. Reibung entsteht nur an einem Rand: Was das Gerät auf dem Bildschirm weiß, steht nicht
mehr auf dem Blatt an der Wand, sobald das Blatt gedruckt ist.

## Prüfung der Behebungen aus Runde 13

| Befund | Ergebnis |
| --- | --- |
| R13-A1 „Angaben vom Zettel" ohne „ab" | hält. Feld „Abgerückt um (vom Meldeblock, leer = noch da)"; Abgerückt vor Eingetroffen fragt „Stimmt die Zeit?" (Knöpfe „Ja, so speichern" / „Zeit korrigieren") |
| R13-A2 Bemerkung anonymisierter Bögen | hält. Quittung „… auch die Bemerkung der Einheit fehlt; Angaben vom Papier der Einheit nachfragen"; Lageblatt „ANONYMISIERT (Stand über 90 Tage) … beim Papier der Einheit erfragen" |
| R13-A3 nachgehende Geräteuhr | hält auf dem Bildschirm („3 Meldungen: Stand liegt nach dem Eintreffen — Geräteuhr oder Uhr des Absenders prüfen", Warnzeile je Karte); **nicht auf dem Papier**, siehe R14-A1 |
| R13-A4 ältere Datei | hält. „Datei war älter oder gleich: keine Änderung übernommen, dieser Stand bleibt." |
| R13-A5 Summenzeile dreistellig | hält. Bei 40 Einheiten „6/91/268/365" und „109" in einer Zeile, „Summe laut Gerät (40 zählend)" |
| R13-W2 bis W5, K1, K2, S3 (soweit Papier berührt) | halten. Abgerückt-Block mit „ab"-Zeit, Zug in der Lageblatt-Spalte, „Verpflegung angefordert 15 (Stärke 23)" |

## Befunde

### R14-A1 [P2] „Eingetroffen" auf dem Lageblatt ist bei eingelesenen Bögen die Zeit des Einlesens, wird aber wie eine Ankunftszeit gedruckt; von Hand korrigierte Zeiten sehen genauso aus

- **Ort:** Einsatzansicht → „Bögen einlesen…" / „Bogen scannen…" → Lageblatt (A4 quer), Spalte „Eingetroffen
  (abgerückt)"; Sammel-PDF, Seite „Übergabe-Übersicht" und Kasten „Stand am Meldekopf" über jedem Bogen.
- **Beobachtung (gemessen):** Sechs Bögen in einem Zug eingelesen: Alle sechs Zeilen des Lageblatts tragen
  „26.10.2026, 09:56". Dasselbe Bild bei 40 Bögen (alle „10:07"). Auf der Karte steht daneben nur „eingetroffen
  26.10.2026, 09:56 ändern" und die Marke „kürzlich eingetroffen"; die Quittung lautet „6 Bögen aufgenommen." und sagt
  nichts zur Eintreffzeit. Wird eine Zeit von Hand korrigiert (Zettel-Eingabe „Eingetroffen um 08:00", Nr. 17 Verden),
  druckt das Lageblatt sie im selben Format und ohne Kennzeichnung („26.10.2026, 08:00"); in der Sammel-PDF steht
  „Eingetroffen 26.10.2026, 08:00" und „Stand 10:06" in derselben Form wie bei den eingelesenen Einheiten. Aus dem
  Blatt allein ist nicht zu unterscheiden, welche Zeit der Meldeblock hergibt und welche das Gerät gestempelt hat. Auf
  dem Bildschirm gibt es „ändern" als Hinweis darauf; das Papier trägt ihn nicht.
- **Erwartung der Rolle:** Das Blatt unterscheidet „aufgenommen um …" (Gerät) von „eingetroffen um …" (Meldeblock,
  Zettel oder von Hand bestätigt), zumindest durch ein Zeichen und eine Zeile in der Fußnote.
- **Folge im Einsatz:** Wer das Blatt an der Wand liest (Zugführer, Ablösung, Stab), nimmt „alle sechs Einheiten um
  09:56 eingetroffen" als Tatsache. Entscheidungen hängen an der Eintreffzeit (Ruhezeit, Ablösung nach Stunden, wer
  zuerst da war). Fällt das Gerät aus, ist das Blatt die einzige Quelle, und die Kennzeichnung der unsicheren Zeit ist
  mit dem Bildschirm verschwunden. Je später nach dem Eintreffen gescannt wird, desto größer die Abweichung.
- **Empfehlung:** Auf dem Papier eingelesene und gestempelte Eintreffzeiten mit einem Marker versehen („aufgen." oder
  ein Stern mit Fußnote „Zeit des Einlesens, nicht geprüft"); von Hand gesetzte oder bestätigte Zeiten ohne Marker.
  Die Quittung nach „Bögen einlesen…" nennt einmal, dass die Eintreffzeit die Zeit des Einlesens ist und wo man sie
  ändert.
- **Verifikation:** Sechs Bögen einlesen, bei einer Einheit „Eingetroffen" auf 08:00 ändern, Lageblatt drucken: fünf
  Zeilen mit Marker, eine ohne; Fußnote erklärt den Marker; Sammel-PDF zeigt dasselbe im Kasten „Stand am Meldekopf".

### R14-A2 [P3] Eine nachgehende Geräteuhr wird auf dem Bildschirm gemeldet, auf dem Lageblatt und in der Sammel-PDF nicht

- **Ort:** Lageblatt und Sammel-PDF nach „Bögen einlesen…" bei einer Geräteuhr, die hinter dem Stand der Bögen liegt
  (Behebung von R13-A3).
- **Beobachtung (gemessen):** Geräteuhr um drei Stunden zurückgestellt, drei Bögen mit Stand 08:53, 08:23, 07:53 eingelesen
  (Uhr 07:09). Bildschirm: „3 Meldungen: Stand liegt nach dem Eintreffen — Geräteuhr oder Uhr des Absenders prüfen" und
  je Karte „⚠ Stand liegt nach dem Eintreffen …". Das Lageblatt dazu („Erstellt 26.10.2026, 07:10") druckt
  „Eingetroffen 07:10" neben „Stand 08:53", Spalte „Hinweise" nur „Zeitraum vorbei"; im Text der Sammel-PDF und des
  Lageblatts kommt weder „Uhr" noch „nach dem Eintreffen" vor.
- **Erwartung der Rolle:** Was das Gerät als Zeitwiderspruch erkannt hat, steht als Hinweiszeile auch auf dem Blatt, das
  weitergegeben wird.
- **Folge im Einsatz:** Das Blatt trägt „Erstellt 07:10" und „Stand 08:53" nebeneinander, der Widerspruch fällt nur dem
  Leser auf, der genau nachrechnet. Alle Zeiten des Blatts sind dann um Stunden versetzt, ohne dass das Blatt es sagt.
- **Empfehlung:** Dieselbe Warnung als Zeile im Kopf des Lageblatts („Geräteuhr geht vermutlich nach: 3 Stände liegen
  nach dem Eintreffen") und als Hinweis in der Zeile der betroffenen Einheit.
- **Verifikation:** Uhr zurückstellen, Bögen einlesen, Lageblatt und Sammel-PDF erzeugen: Hinweis im Kopf und je Zeile.

### R14-A3 [P3] Lageblatt druckt die Rückrufnummer ohne die Kennzeichnung „D/P" des Bogens

- **Ort:** Lageblatt (A4 quer), Spalte „Funkrufname / Rückruf", z. B. „Heros Albstadt 21/10 · 5556968346 (S. Lang)".
- **Beobachtung (gemessen):** Im Bogen ist die Nummer von Sabine Lang als privat gekennzeichnet; der gedruckte Bogen in
  der Sammel-PDF zeigt „Mobil: 5556968346 (P)" unter der Überschrift „D = dienstlich / P = privat". Das Lageblatt druckt
  dieselbe Nummer ohne „(P)" und ohne Legende; bei den geprüften Einheiten steht überall nur „Nummer (Name)".
- **Erwartung der Rolle:** Auf dem Blatt, das an der Wand hängt und von mehr Leuten gelesen wird als der Einzelbogen,
  steht mindestens dasselbe Zeichen wie auf dem Bogen. Wer anruft, soll wissen, dass er eine Privatnummer wählt.
  (Annahme: private Rufnummern sollen nur nach Bedarf gewählt werden; eine organisationsinterne Regel dazu ist nicht
  bekannt und wird nicht behauptet.)
- **Folge im Einsatz:** Ein Zugführer wählt nachts die Privatnummer, weil sie die einzige im Blatt ist, ohne es zu
  wissen; und die Nummer steht ohne die Einschränkung des Bogens öffentlich im Raum. Der Wandaushang wird nicht wie der
  Bogen verwahrt.
- **Empfehlung:** „(P)" bzw. „(D)" wie im Bogen hinter die Nummer setzen und die Legende in die Fußnote aufnehmen;
  eine dienstliche Nummer der Einheit (Einheit/Standort) vorrangig drucken, wenn vorhanden.
- **Verifikation:** Bogen mit privater Nummer der Führungskraft einlesen, Lageblatt drucken: „(P)" steht hinter der
  Nummer, Fußnote erklärt es.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Einheit trifft ein | Scan, alle Daten in einem Zug, Stärke-Summen laufend | Meldeblock „an / ab"; Blanko-Vordruck („Papier-Reserve") mit Feld „abgerückt am … um …" und „ins Gerät übertragen [ ]" | „Einheit manuell erfassen…" mit „Angaben vom Zettel (Eingetroffen, Abgerückt, Nr., Zug)"; Zahlendreher und doppelte Nr. werden abgefangen. Eingelesene Zeiten tragen auf Papier keine Kennzeichnung (R14-A1) |
| Lage für Wand und Ablösung | Summen, Bedarf, Zug, Auftrag, „Aushang nicht mehr aktuell" | Lageblatt A4 quer mit Nachtragszeilen und „Summe einschl. Nachträge (von Hand)" | Nachträge von Hand abtippen; Lageblatt selbst ist nicht einlesbar (R11-A3, mit Hinweis erklärt) |
| Gerät fällt aus / Gerätewechsel | Sammel-PDF mit allen Bögen, Zeiten, Historie, Zügen | Sammel-PDF auf Papier, Bögen mit QR | „Einsatz importieren…" auf dem zweiten Gerät; ältere Datei überschreibt keinen neueren Stand (gemessen) |
| Uhr stimmt nicht | Warnung auf Bildschirm und Karte | Blatt trägt „Erstellt" und „Stand" | Warnung fehlt auf dem Blatt (R14-A2) |
| Rückruf an Einheit | Funkrufname und Nummer in einer Spalte | Lageblatt, Bogen | „(P)/(D)" des Bogens fehlt im Lageblatt (R14-A3) |
| Komplettverlust des Geräts | Datensicherung als eine Datei, Hinweis „Gesichert ist sie erst, wenn sie auf einem zweiten Gerät liegt" | Sammel-PDF, zuletzt gedrucktes Lageblatt | Sicherung einspielen ersetzt alles (Dialog nennt, was verloren geht); Sammel-PDF genügt für den Einsatz allein |

## Würde ich dafür das Papier weglegen?

Nein, nicht ganz, und das ist gewollt: Die App erzeugt das Papier selbst (Lageblatt, Bogen mit QR, Blanko) und weiß,
wann ihr Aushang veraltet ist. Mein Meldeblock bleibt, solange die Eintreffzeit auf dem gedruckten Blatt nicht
erkennbar von „eingelesen" zu „vom Zettel" unterschieden wird; für die Summen, den Bedarf und die Übergabe an die
Ablösung würde ich dagegen das Gerät benutzen und das Blatt nur noch als Rückfallebene mitführen.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Eingetroffen" auf dem Lageblatt gilt als Zeit des Eintreffens, ist bei eingelesenen
  Bögen aber die Zeit des Einlesens.
- **Größtes Einsatzrisiko:** Das gedruckte Lageblatt trägt weniger Warnungen als der Bildschirm (Eintreffzeit, Uhr,
  Rufnummernart) und ist nach einem Geräteausfall die einzige Quelle.
- **Top-Priorität für die nächste Iteration:** Auf dem Lageblatt gestempelte von bestätigten Eintreffzeiten
  unterscheiden (R14-A1) und die Warnungen des Bildschirms in den Kopf des Blatts übernehmen (R14-A2).
