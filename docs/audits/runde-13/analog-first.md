# Audit „Analog first", Runde 13 (Papier-Rückfallebene, Rückweg vom Papier)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-10-26 · Prüfgegenstand: laufende Web-App,
Produktionsbuild auf http://localhost:4173, Code-Stand Commit `7637e61` (`main` nach Runde 12).

Zählung: **P0 0 · P1 0 · P2 0 · P3 5** (5 Befunde, neu).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, `docs/audits/runde-12/README.md`,
`docs/audits/runde-11/README.md` und die Befundüberschriften aller früheren Analog-first-Berichte (R2 bis R12).

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen; die Projektkopie fand keinen Browser, das globale
Playwright-Modul schon), `isMobile`/`hasTouch`, Locale de-DE, Telefon 390 × 844 und 360 × 640, jeweils frischer
Kontext. Einsatz-Sammlung mit 3, 4, 6 und 30 THW-Übungsbögen aus `examples/thw/` (auf `uebung: false`, Stand auf
„vor 1 bis 3 Stunden" gesetzt; für die Datenschutzfrist zusätzlich unveränderte Bögen mit Stand Mitte Juli),
eingelesen über „Bögen einlesen…". Durchgespielt: Zur Kenntnis nehmen, Auftrag/Notiz, Abrücken, „ändern" an Eintreff-
und Abrückzeit (Abrückzeit vor Eintreffen), Folgemeldung mit geänderter Stärke (Wartezeit über zwei Minuten),
Lageblatt (leer, 6, 30 Einheiten), Sammel-PDF (6 und 30 Einheiten, 15 und 69 Seiten), Blanko-Vordruck, „Einheit
manuell erfassen…" mit „Angaben vom Zettel", Datensicherung-Dialog, Seite „Papier oder digital?". Zweigeräte-Probe
mit zwei Kontexten: Sammel-PDF auf Gerät B über „Einsatz importieren…" einlesen, auf beiden Geräten dieselbe Einheit
ändern, Datei zurückspielen; außerdem eine ältere Datei über einen neueren Stand spielen. Geräteuhr mit
`page.clock` drei Stunden zurückgestellt. PDFs mit `pdftotext -layout`, `pdfinfo` und `pdftoppm` gelesen.

**Annahmen:** Der Meldekopf führt neben dem Gerät einen Meldeblock mit „an / ab" je Einheit; das zuletzt gedruckte
Lageblatt hängt nach einem Geräteausfall weiter an der Wand; die Sammel-PDF geht an die Ablösung.

**Nicht prüfbar:** echtes Drucken, Kamera- und Handscanner, Safari, native Builds, echte Akku- oder Geräteausfälle,
echte Uhrabweichungen eines Tablets ohne Netz.

**Bekannte Grenzen, nicht neu gemeldet:** alle in der Aufgabe genannten (R6-O9 bis R12-G3). Gesehen und nicht gewertet:
„Aus Datei laden…" mit einer Sammel-PDF öffnet nur den ersten Bogen als eigenen Entwurf, die Meldung nennt dafür
„Einsatz importieren…" (R11-A3 behoben); „Weitergabe-Datei erzeugt … Empfang nicht bestätigt" (R12-W3).

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert (Seitentext, PDF-Text); *beobachtet* = gesehen;
*Risiko* = abgeleitet.

## Urteil

Die Papierseite trägt weiter. Der Rundlauf Gerät A → Sammel-PDF → Gerät B hält (gemessen): Auftrag, Abgerückt-Stand
und Eintreffzeit kommen an, die neu eingelesenen Einheiten stehen wieder als „neu" da, der abgerückte Bogen nicht.
Ein Widerspruch zwischen zwei Geräten („hier Auftrag A-TEXT, in der Datei B-TEXT; der Stand dieses Geräts bleibt")
wird genannt und bleibt offen sichtbar; eine ältere Datei überschreibt einen neueren Stand nicht. Das Lageblatt gibt
es auch ohne Einheit als Vordruck mit 16 Nachtragszeilen und leeren Summenfeldern, bei 30 Einheiten auf 4 Seiten mit
11 Nachtragszeilen und „Summe einschl. Nachträge (von Hand)". Die Folgemeldung steht in der Änderungsspalte („Gesamtstärke:
von 11 auf 8 · Unterbringung M/W/D von M 8 / W 3 / D 0 auf M6/W2/D0"), die Bedarfszeile warnt „Verpflegung 11 statt
Stärke 8". Die Behebungen aus Runde 12 halten (siehe unten). Die Aufgabe „Lage auf Papier bringen, weitergeben, vom
Meldeblock nachtragen, auf einem zweiten Gerät fortsetzen" gelingt ohne fremde Hilfe.

Reibung entsteht nur an Rändern: beim Nachtragen einer schon abgerückten Einheit, bei einer falschen Geräteuhr, bei
Bögen mit abgelaufener Datenschutzfrist und an zwei Formulierungen.

## Befunde

### R13-A1 [P3] „Angaben vom Zettel" kennen kein „ab": Eine auf dem Meldeblock schon abgerückte Einheit wird mit „jetzt" abgerückt

- **Ort:** Einsatz-Sammlung → „Einheit manuell erfassen…" → Kopf „Angaben vom Zettel (optional): Eingetroffen um, Nr.,
  Zug"; Lageblatt, Kopf des Nachtragsfelds „Nachtrag von Hand (Einheit, Zug, Uhrzeit an / ab, Stärke …)".
- **Beobachtung (gemessen):** Die aufgeklappte Zettelzeile enthält genau drei Felder: „Eingetroffen um (vom
  Meldeblock)", „Nr. laut Zettel", „Zug / Verband (laut Zettel)". Eine Abrückzeit gibt es dort nicht. Das gedruckte
  Nachtragsfeld des Lageblatts und der Blanko-Vordruck („abgerückt am … um …") führen dagegen „an / ab". Auf der Karte
  stempelt „Abrücken" die Zeit des Tippens (im Test „abgerückt 06:44", gleich der Eintreffzeit); „ändern" daneben
  korrigiert sie.
- **Folge:** Wer nach einer Funkstörung oder einem Geräteausfall den Meldeblock nachträgt, trägt für eine Einheit, die
  zwischen 05:10 und 06:00 da war, zuerst eine Einheit „anwesend" ein, tippt „Abrücken" und muss dann ein zweites Mal
  an der Karte die Abrückzeit auf 06:00 setzen. Wer den zweiten Schritt vergisst, hat auf Lageblatt und Übergabe
  „abgerückt" mit der Zeit des Nachtragens. Vorübergehend zählt die Einheit zudem in den Summen.
- **Empfehlung:** In „Angaben vom Zettel" ein Feld „Abgerückt um (vom Meldeblock)"; ist es gefüllt, die Einheit gleich
  als abgerückt mit dieser Zeit anlegen und nicht in die Summen zählen.
- **Prüfung:** Zettel mit „an 05:10 / ab 06:00" erfassen; Karte, Lageblatt und Sammel-PDF müssen 05:10 und 06:00
  zeigen, die Summen die Einheit nicht enthalten.

### R13-A2 [P3] Anonymisierte Bögen verlieren auch die „Bemerkung der Einheit", die Meldung nennt es nicht

- **Ort:** Einlesen von Bögen mit Stand über 90 Tage; Quittung, Marke „ANONYMISIERT" auf der Karte, Spalte „Auftrag /
  Notiz (Bemerkung der Einheit)" im Lageblatt, Sammel-PDF.
- **Beobachtung (gemessen):** Der Übungsbogen Freiburg trägt „2 Sollplätze unbesetzt. Anh Plane/Spriegel in
  Instandsetzung — nicht mit ausgerückt." Mit frischem Stand zeigen Karte, Lageblatt (mit „(Rest: Sammel-PDF)") und
  Sammel-PDF den Satz. Mit Stand vor 102 Tagen fehlt er überall: Karte ohne „Bemerkung der Einheit", Lageblatt-Zelle
  leer, `pdftotext` ohne Treffer auf „Plane" und „StAN-Soll" (Albstadt: „MzKW zusätzlich über StAN-Soll dabei"). Der
  Kern löscht `sonstiges` bei der Anonymisierung. Die Erklärung der Marke und die Quittung nennen als entfernt nur
  „Namen, Funktionen, Qualifikationen und Erreichbarkeiten".
- **Folge:** Eine Angabe zu Fahrzeug und Besetzung („Anhänger nicht mit ausgerückt") fehlt am Meldekopf, ohne dass dort
  steht, dass es sie gab. Wer nur Lageblatt oder Übergabe liest, hält die Einheit für ohne Bemerkung. Die Rückfallebene
  „Papier der Einheit" ist für Namen genannt, für die Bemerkung nicht.
- **Empfehlung:** Die Erklärung und die Quittung um „Bemerkung der Einheit" ergänzen; im Lageblatt in der Notizzelle
  anonymisierter Bögen „Bemerkung entfernt (Datenschutzfrist), beim Papier der Einheit erfragen" drucken.
- **Prüfung:** Bogen mit `sonstiges` und Stand über 90 Tage einlesen; Quittung, Karte und beide PDFs müssen das
  Entfernen der Bemerkung nennen; ein frischer Bogen (Gegenprobe) zeigt die Bemerkung weiter.

### R13-A3 [P3] Geht die Geräteuhr nach, steht „Stand" nach „eingetroffen", und nichts weist darauf hin

- **Ort:** Karte („eingetroffen … · Stand …"), Quittung „Bögen aufgenommen", Lageblatt-Spalten „Eingetroffen" und
  „Stand", Kopf der Einsatzansicht.
- **Beobachtung (gemessen):** Geräteuhr auf 04:00 gestellt, sechs Bögen mit Stand 02:12 bis 04:42 eingelesen. Karte
  Nr. 1: „eingetroffen 26.10.2026, 04:00 · Stand 26.10.2026, 04:42"; Quittung und Kopf („letzte Meldung 04:00 (gerade eben)")
  ohne Hinweis, Lageblatt druckt dieselbe Reihenfolge. Die vorhandene Uhr-Prüfung (Sprung gegenüber dem letzten Start,
  „Geräteuhr prüfen") greift auf dem frischen Gerät nicht; die Zeile „Meldezeiten liegen in der Zukunft – Zeiten prüfen
  (Geräteuhr?)" gibt es nur im Lagemonitor und vergleicht den Empfang mit „jetzt", nicht den Stand mit dem Eintreffen.
- **Folge:** Ein Tablet ohne Netz, dessen Uhr abweicht, schreibt alle Eintreff- und Abrückzeiten falsch auf Karte,
  Lageblatt und Übergabe, ohne dass jemand es merkt; der Meldeblock mit Wanduhr widerspricht dem Gerät dann ohne
  Anhaltspunkt, welches stimmt. Bei Stunden Abweichung ist das ein Widerspruch zwischen Papier und Datei.
- **Empfehlung:** Liegt der Stand eines eben eingelesenen Bogens mehr als einige Minuten nach der Eintreffzeit, die
  Quittung um „Stand liegt nach dem Eintreffen — Geräteuhr oder Uhr des Absenders prüfen" ergänzen und auf der Karte
  kennzeichnen.
- **Prüfung:** Uhr eines frischen Kontexts um drei Stunden zurückstellen, Bogen mit Stand der Gegenwart einlesen;
  Quittung und Karte müssen den Hinweis tragen, eine Gegenprobe mit richtiger Uhr nicht.

### R13-A4 [P3] Nach dem Einspielen einer älteren Datei steht „Stand des anderen Geräts übernommen", obwohl nichts übernommen wurde

- **Ort:** Einsatzansicht, Zeile unter dem Kopf „Weitergabe-Datei erzeugt … · Stand des anderen Geräts übernommen
  <Uhrzeit>"; Quittung „Einsatz „…": keine neue Einheit. Jetzt 3 Einheiten …".
- **Beobachtung (gemessen):** Sammel-PDF erzeugt, danach Auftrag geändert und Einheit abgerückt, dieselbe Datei wieder
  über „Einsatz importieren…" eingespielt. Der Stand bleibt richtig (Auftrag „NEUER AUFTRAG" und „ABGERÜCKT" erhalten).
  Die Statuszeile lautet aber „Weitergabe-Datei erzeugt 06:49 — Empfang nicht bestätigt, seitdem hier 2 Änderungen
  (Abrücken, Auftrag). Führt inzwischen ein anderes Gerät die Lage, fehlt das dort: erneut weitergeben. Stand des
  anderen Geräts übernommen 06:49." Die Quittung sagt „keine neue Einheit", nicht, dass die Datei älter war und
  nichts verändert wurde.
- **Folge:** Der Satz „übernommen" liest sich so, als sei der Stand der Datei an die Stelle des eigenen getreten, dabei
  steht im selben Absatz, dass hier zwei Änderungen fehlen. Wer unter Zeitdruck die falsche (alte) Datei erwischt, kann
  glauben, die Änderungen seien weg, oder umgekehrt eine ältere Datei für abgeglichen halten.
- **Empfehlung:** Die Zeile nach dem Ergebnis des Einspielens richten: „Datei war älter: keine Änderung übernommen"
  statt „übernommen", oder „n Änderungen aus der Datei übernommen"; in der Quittung bei älterer Datei den Stand der
  Datei dem eigenen gegenüberstellen („Datei 06:49, hier neuer 06:51").
- **Prüfung:** Datei erzeugen, ändern, dieselbe Datei einspielen: Zeile und Quittung müssen „älter, nichts
  übernommen" sagen; eine Datei mit neuerem Stand muss die übernommenen Änderungen zählen.

### R13-A5 [P3] Lageblatt: Die Summenzeile bricht bei dreistelligen Werten um, die Gesamtstärke steht allein in der zweiten Zeile

- **Ort:** Lageblatt (A4 quer), Zeile „Summe laut Gerät", Spalte „Stärke F/U/M/G" ab etwa 30 Einheiten.
- **Beobachtung (gemessen, gerendert):** Bei 30 Einheiten steht in der Zelle „5 / 69 / 195 /" und darunter „269"; der
  Textauszug liest „5 / 69 / 195 / 83" (Fahrzeugspalte) in derselben Zeile. Die Einheitszeilen („0 / 3 / 9 / 12")
  passen dagegen in die Spalte.
- **Folge:** Beim Abtippen oder Weiterrechnen mit den Nachträgen kann der Helfer „269" für einen eigenen Wert
  halten; die Handsumme „Summe einschl. Nachträge" ist dort die Stelle, an der gerechnet wird.
- **Empfehlung:** Spalte „Stärke" bei der Summenzeile schmaler setzen oder die Summenzeile ohne Leerzeichen
  um die Schrägstriche drucken (wie „1/1/2/4" bei kleinen Werten).
- **Prüfung:** Lageblatt mit 30 Einheiten drucken; die Summenzelle muss „5 / 69 / 195 / 269" in einer Zeile tragen.

## Prüfung der Behebungen aus Runde 12

| Befund | Ergebnis |
| --- | --- |
| R12-A1 Anonymisierung auf Papier | hält: Lageblatt „ANONYMISIERT (Stand über 90 Tage): Namen und Rufnummern beim Papier der Einheit erfragen", keine „keine Rufnummer"-Hinweise, Sammel-PDF 8 Treffer auf „anonym" |
| R12-E5 leerer Einsatz | hält: „Noch keine Einheit im Einsatz — nichts zu sichern."; leeres Lageblatt mit Hinweis „die Datei enthält keine Zeilen" |
| R12-E1 bis E4 (Zettelfelder, Nr. doppelt, Eintreffzeit) | Zettelfelder vorhanden; Rest siehe R13-A1 |
| R12-W3 Weitergabe | Stand unverändert („Empfang nicht bestätigt", „zählt nicht als Lieferung an den Stab"), bekannte Grenze |
| R12-O2 Widerspruch | „Erledigt" vorhanden, Widerspruch bleibt sichtbar; kein Knopf „Wert der Datei übernehmen" (bekannt) |
| R12-K2/K3 Altersangaben | „älter als 24 h", „kürzlich eingetroffen" auf der Karte sichtbar |
| R12-D1 Vorlage und Rundlauf | Rundlauf Sammel-PDF → zweites Gerät hält |

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Eintreffen und Nr. vergeben | Nr. und Zeit automatisch, Summen laufend | Meldeblock mit Nr., Zeit, Zug; Kasten oben auf dem Blanko | „Angaben vom Zettel" (Zeit, Nr., Zug); „ab" fehlt dort (R13-A1) |
| Lage an die Wand | Lageblatt mit Summen und Veränderungsspalte, auch leer als Vordruck | Gedrucktes Lageblatt mit Nachtragszeilen und Handsumme | Nachtragszeilen mit „übertragen"; Summe bei großer Lage umgebrochen (R13-A5) |
| Schichtübergabe | Sammel-PDF mit allen Bögen und Zeiten | Papier, auf dem alles steht | „Einsatz importieren…" auf dem zweiten Gerät; Auftrag, Abrückzeit, Eintreffzeit kommen an |
| Zwei Geräte, derselbe Einsatz | Widerspruch wird genannt, eigener Stand bleibt | Beide Seiten mit Stift vergleichen | „Erledigt"; Satz „Stand des anderen Geräts übernommen" bei älterer Datei irreführend (R13-A4) |
| Bogen älter als 90 Tage | Bogen kommt ohne Namen an, Hinweis auf Papier der Einheit | Papier der Einheit in der Fahrzeugmappe | Namen vom Papier; die entfernte Bemerkung wird nicht genannt (R13-A2) |
| Uhrzeit des Eintreffens | Gerätezeit, korrigierbar | Wanduhr auf dem Meldeblock | „ändern" je Karte; bei falscher Geräteuhr kein Hinweis (R13-A3) |

## Würde ich dafür das Papier weglegen?

Nein, und die App verlangt es nicht: Lageblatt, Sammel-PDF und Blanko tragen alles, was ich bei Geräteausfall zum
Weiterarbeiten brauche, und der Rückweg vom Papier und von einem zweiten Gerät hält in meinen Proben. Das Gerät spart
mir das Summenrechnen und das Abtippen der Folgemeldungen, solange ich die Zeiten und Hinweise, die es druckt, an der
Wanduhr und am Papier der Einheit messen kann.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Stand des anderen Geräts übernommen" liest sich, als sei die Datei maßgeblich gewesen, obwohl der eigene Stand blieb.
- **Größtes Einsatzrisiko:** Eine nachgehende Geräteuhr schreibt Eintreff- und Abrückzeiten ohne Warnung falsch auf Karte, Lageblatt und Übergabe.
- **Top-Priorität für die nächste Iteration:** „Abgerückt um" in den „Angaben vom Zettel" (R13-A1), damit das Nachtragen vom Meldeblock „an / ab" in einem Schritt abbildet.
