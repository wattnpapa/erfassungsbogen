# Audit „Führungssicht", Runde 18 (Lage führen, Lagemonitor, Stand übergeben)

Prüfer: Rollenaudit `thw-command-reviewer` · Datum: 2026-10-27 ·
Prüfgegenstand: Web-App im Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `ae3a8e9` (`main`).

Zählung: **P0: 0 · P1: 0 · P2: 1 · P3: 11** (12 Befunde)

Reiner Prüfbericht, keine Codeänderung. Maßstab: Es gibt keine „bekannten
Grenzen" zum Auslassen. Was im echten Browser noch zu beobachten ist, wird
gemeldet, auch wenn es früher als „teilweise", „offen" oder „nicht
reproduzierbar" geführt wurde (dann mit alter Befund-ID im Feld „Neu oder alt").

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, globales
Playwright-Modul unter `/opt/node-tools`, da die Projektkopie keinen Browser
findet), Locale de-DE, Zeitzone Europe/Berlin, `isMobile`/`hasTouch`, Telefon
390x844 und 360x640; der Lagemonitor zusätzlich bei 1280x720 und 1280x420.
Zustand: Einsatz „Hochwasser Neckar · BR Sporthalle Rottenburg"; sieben
Beispielbögen THW (Albstadt, Biberach/Riß, Crailsheim, Freiburg, Haßmersheim,
Karlsruhe, Laufenburg) aus „Beispielbögen › PDF" über „Bögen einlesen…"
aufgenommen und je Karte über „Mehr… › Als Einsatzmeldung zählen…" in die Lage
gehoben. Danach: Zug je Karte (1. bis 3. Zug), Auftrag (Nr. 3), Abrücken
(Nr. 6), „Stärke ändern…" (Nr. 2: 11 auf 8, Nr. 3: 12 auf 10), „Meldung
entfernen" und Zurückholen aus dem Papierkorb (Nr. 7), Suche/Sortierung/Filter,
Tabelle, „Zur Kenntnis genommen", Lageblatt (PDF, mit `pdftotext` gelesen),
Übersicht und „Alle Daten" als CSV, Excel-Liste, Nachtrag-CSV, Sammel-PDF
(16 Seiten, 1,5 s), „Einsatz importieren…" der Sammel-PDF auf einem leeren
Gerät, Lagemonitor (`?lagemonitor=<id>`) mit Funkrufname und „Jetzt",
Schnellerfassung, „Einsatz löschen…", Neuladen, Zurück-Geste, Doppeltipp,
Erstbesuch der Startseite (Layoutverschiebung mit `PerformanceObserver`).
Browserfehler in der Konsole: keine.

Nicht prüfbar: echter Fernseher, Vollbild, Drucken, Kamera.

## Urteil

Die Lage ist ohne fremde Hilfe zu lesen, zu pflegen und zu übergeben. Die
Behebungen der Runde 17 halten im echten Browser (siehe unten). Offen bleibt
vor allem eines: Das Lageblatt, die CSV-Dateien und einzelne Dialoge nennen als
„Stand" einer Meldung den Zeitpunkt der Aufnahme am Meldekopf, während die
Karte und der Warnhinweis „Stand vor 102 Tagen" das Alter des Bogens meinen
(R18-K1). Der Stab liest damit in derselben Zeile „Stand 28.10.2026, 01:22" und
„! Stand vor 102 Tagen". Der Rest sind Reihenfolge, Textmenge und
Flächenverbrauch am Telefon.

Geprüft und in Ordnung (Behebungen aus Runde 17):

- Doppeltipp: Doppelklick auf „Abrücken", „Lageblatt (A4 quer)" und „Einsatz
  weitergeben / sichern" erzeugt genau einen Vorgang bzw. genau eine Datei.
- Neuladen: Eine aufgeklappte Karte bleibt nach Neuladen offen; der Einsatz
  bleibt geöffnet.
- Zurück-Geste: Nach Startseite › „Öffnen" › Neuladen führt Zurück auf die
  Startseite, ein zweites Zurück aus der App heraus (zu Kaltstart siehe
  R18-K12).
- „Meldung entfernen": Der Dialog nennt Neuladen und 7 Tage; nach Neuladen
  steht „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar" mit
  „Zurückholen" und „Endgültig löschen…"; Zurückholen liefert die Meldung samt
  Alter.
- Alter bleibt: „Als Einsatzmeldung zählen…" lässt „⚠ Stand vor 102 Tagen" auf
  der Karte stehen (R17-K1 auf der Karte behoben, in Exporten nicht, siehe
  R18-K1).
- Startseite: Der Einsatz steht einmal (R17-K5); Abgerückte stehen hinter den
  Anwesenden (R17-K4); „Löschen…" fragt nach und nennt 30 Tage Papierkorb.
- Fußleiste im Assistenten 57 px, Quittung ersetzt die Ansichtsleiste statt sie
  zu überlagern; Abstände in Assistent und Einsatzansicht ohne Auffälligkeit.
- Tabelle am Telefon: vier Kernspalten (Einheit, Ges., Meldung vor, Bedarf)
  passen ohne seitliches Wischen in 360 und 390 px; „Alle Spalten zeigen"
  öffnet 26 Spalten mit Hinweis „seitlich wischen" und klebender Kopfzeile.
- Nachtrag-CSV (R17-K9): „NACHTRAG seit …" steht in der ersten Zelle der
  ersten Zeile, die Summenzeile unterscheidet „neue" und „geänderte" Einheiten.
- Lagemonitor bei 1280x720 (R17-K3): alle sechs Einheiten sichtbar, auch bei
  drei Bewegungen; bei 360x640 steht die Lage vor den Bedienknöpfen (R17-K11).
- „Stärke ändern…": Kurzzeile nennt „Namen, Fahrzeuge übernommen;
  Verpflegung und Unterbringung folgen der Stärke" (R17-K2).
- Übergabe: „Einsatz importieren…" der Sammel-PDF auf einem leeren Gerät ergibt
  „7 Einheiten, davon 6 anwesend", Zug, Auftrag und Abrückstatus kommen an.
- Zug-Zwischensummen gehen auf: im Lageblatt 4 + 20 + 22 + 4 = 50 Verpflegung
  (nach der Stärkeänderung in Nr. 2), am Telefon nach der zweiten
  Stärkeänderung (Nr. 3) 4 + 18 + 22 + 4 = 48.

## Befunde

### R18-K1 [P2] „Stand" im Lageblatt, in der CSV und in Dialogen meint die Aufnahmezeit, daneben steht „Stand vor 102 Tagen"

- **Neu oder alt (Verweis):** alt, R17-K1 (Karte behoben, Exporte und Dialoge
  nicht).
- **Ort:** Lageblatt (Spalte „Stand"), „Übersicht als CSV" und „Alle Daten als
  CSV" (Spalte „Stand"), Dialog „Meldung entfernen?", Karte nach „Stärke
  ändern…".
- **Beobachtung:** Nr. 1 (Bogen vom 17.07.2026, 08:05) steht auf der Karte mit
  „Stand 17.07.2026, 08:05" und „⚠ Stand vor 102 Tagen". Im Lageblatt trägt
  dieselbe Einheit in der Spalte „Stand" den Wert „28.10.2026, 01:22" und in
  derselben Zelle „! Stand vor 102 Tagen"; zwei Spalten weiter steht „unverändert
  gegenüber 17.07.2026, 08:05". Die CSV nennt „Stand" ebenfalls
  „28.10.2026, 01:22". Der Dialog „Meldung entfernen?" für Nr. 7 sagt „(4
  Personen, Stand 28.10.2026, 01:22)", die Karte „Stand 16.07.2026, 06:42". Nach
  „Stärke ändern…" zeigt die Karte Nr. 2 zugleich „⚠ Stand vor 103 Tagen" und
  „Stand 28.10.2026, 01:26"; die Folgemeldung-Zeile sagt „vorher Stand
  28.10.2026, 01:22".
- **Folge:** Wer das Lageblatt oder die CSV weiterliest, sieht eine frische
  Zeit und dahinter ein Alter von über drei Monaten; er kann nicht entscheiden,
  welche Angabe stimmt. Das Alter ist die Zahl, an der die Führung Aktualität
  misst. Der Stab bekommt in der Papierfassung eine widersprüchliche Zeile.
- **Empfehlung:** Eine einzige Bedeutung für „Stand": der Zeitpunkt, auf den
  sich die Angaben der Einheit beziehen. Die Aufnahmezeit am Meldekopf steht
  getrennt in „Eingetroffen". Bei einer Stärkeänderung am Meldekopf beide Zeiten
  nennen („Stärke 8: 28.10. 01:26 vom Meldekopf; Bogen: 17.07.") statt einer.

### R18-K2 [P3] Kopfzeile „letzte Meldung" übergeht Folgemeldungen aus „Stärke ändern…"

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatzkopf, Startseite, Dialog nach „Einsatz importieren…", Lagemonitor.
- **Beobachtung:** Nach Folgemeldungen um 01:26 und 01:28 steht im Kopf
  weiter „letzte Meldung 28.10.2026, 01:22 (vor 8 Min)"; derselbe Kopf listet
  darunter „Folgemeldung 01:26" und „Folgemeldung 01:28". Der Lagemonitor sagt
  dagegen „letzte Meldung gerade eben". Nach dem Import der Sammel-PDF steht
  „Stand der Datei: letzte Meldung 28.10.2026, 01:22", obwohl die Datei die
  Folgemeldung von 01:26 enthält.
- **Folge:** Die Führung liest „vor 8 Min" und hält die Lage für ruhiger, als
  sie ist; Kopf und Monitor widersprechen sich.
- **Empfehlung:** „letzte Meldung" zählt jede neue Fassung (auch Stärkeänderung
  und Abrücken), überall gleich.

### R18-K3 [P3] Die Einheitenliste beginnt erst nach 1,5 Bildschirmen, davor stehen vier Erfassungsknöpfe

- **Neu oder alt (Verweis):** alt, R17-K12.
- **Ort:** Einsatzansicht bei 390x844 und 360x640.
- **Beobachtung:** Gemessen ab Seitenanfang: „Bogen scannen…" bei 764 px,
  „Karten/Tabelle" bei 1092 px (390x844) bzw. 1080 px (360x640), die erste
  Karte bei 1315 px bzw. 1303 px. Der erste Bildschirm zeigt Kopf, Kennzahlen,
  Bedarf und den Anfang der Erfassungsknöpfe; bei 360x640 ist vom Bedarf nur
  die Hälfte sichtbar. „Zur Einheitenliste ↓" steht als Verweis bereit.
- **Folge:** Wer die Lage sucht (welche Einheit, welcher Zug, was ist älter),
  scrollt an vier gleich großen Knöpfen vorbei, die er in dem Moment nicht
  braucht.
- **Empfehlung:** Erfassungsknöpfe hinter die Liste oder als eine Zeile
  zusammenfassen; die Liste (oder wenigstens die Zugsummen) in den ersten
  Bildschirm.

### R18-K4 [P3] Jede Folgemeldung im Block „Neu seit der letzten Kenntnisnahme" wiederholt die lange Ortswarnung

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatzansicht, Block „Neu seit der letzten Kenntnisnahme (2)".
- **Beobachtung:** Je Eintrag (Biberach, Crailsheim) steht nach der Stärkeänderung
  derselbe Satz „⚠ Bogen nennt: „…", passt das zu dieser Lage? Kein Ortsname
  daraus kommt beim Ort der Sammlung oder bei den übrigen Einheiten vor." in
  fetter brauner Schrift; zwei Einträge füllen am Telefon mehr als einen
  Bildschirm.
- **Folge:** Die eigentliche Neuigkeit („Stärke 11 → 8 (−3)") geht im
  Warntext unter; die Ortswarnung hat mit der Stärkeänderung nichts zu tun und
  steht schon auf der Karte.
- **Empfehlung:** Im Block nur die Änderung und die Einheit; die Ortswarnung nur
  einmal als Zähler („bei 5 passt der Ort vielleicht nicht") wie beim
  Erstaufnahme-Block.

### R18-K5 [P3] Lagemonitor: „Stand 103 T" abgekürzt, Warnzeile winzig, Reihenfolge unbeschriftet

- **Neu oder alt (Verweis):** neu.
- **Ort:** Lagemonitor bei 360x640 und 1280x720.
- **Beobachtung:** In der Tabelle steht „THW ⚠ Stand 103 T" (gepunktet
  unterstrichen), am Telefon in der Spalte „Orga" umbrochen. Die wichtigste
  Warnung „⚠ älteste Meldung vor 103 Tagen, 6 von 6 älter als 1 Std" steht in
  der kleinsten Schrift der Seite unter der großen Zeile „6 Einheiten · 15
  Fahrzeuge". Die Zeilen stehen in der Reihenfolge Nr. 4, 7, 3, 5, 2, 1; weder
  Nr., Zug noch Name; ein Kriterium ist nicht angegeben.
- **Folge:** Auf dem Fernseher aus Entfernung liest sich „103 T" nicht als
  „Tage"; die Warnung wird überlesen; die Führung sucht „ihre" Einheit in einer
  scheinbar zufälligen Reihenfolge.
- **Empfehlung:** „103 Tage" ausschreiben oder „Stand alt" als Wort; Warnzeile
  gleich groß wie die Kennzahlenzeile; Sortierung benennen oder nach Zug und
  Nr. ordnen.

### R18-K6 [P3] „Gehört zu dieser Lage" ist nur 30 px hoch

- **Neu oder alt (Verweis):** alt, R17-G8/H9 (Verweise 17 px hoch; auf 44 px
  gehoben, dieser Knopf nicht).
- **Ort:** Aufgeklappte Karte mit Ortswarnung, 360x640 und 390x844.
- **Beobachtung:** Der Textverweis „Gehört zu dieser Lage" misst 141 x 30 px;
  alle anderen Knöpfe der Karte 44 px. Er steht am Ende eines vierzeiligen
  Warntexts, direkt über den Kennzeichen-Marken.
- **Folge:** Mit Handschuh oft daneben; ein Fehltipp trifft den Warntext oder
  die Marke darunter. Der Knopf entscheidet, ob eine Warnung dauerhaft
  verschwindet.
- **Empfehlung:** Auf 44 px Höhe bringen wie die übrigen Verweise.

### R18-K7 [P3] Startseite beim Erstbesuch: Inhalt unter der Offline-Zeile springt nach 2,5 s um 90 px

- **Neu oder alt (Verweis):** alt, R17-H1 (Sprung der Startseite beim
  Erstbesuch, „teilweise").
- **Ort:** Startseite, erster Besuch auf einem Gerät ohne gespeicherten Einsatz,
  390x844.
- **Beobachtung:** Bei 0,75 s erscheint die lange Zeile „✓ Jetzt offline bereit
  für Bogen, PDF, QR-Code und Empfang. Beispielbögen und Themenseiten werden
  nachgeladen (n von 549) — alle Daten bleiben auf diesem Gerät."; bei etwa 2,5 s
  wird sie zu „✓ Jetzt offline bereit. Funktioniert komplett offline — …". Die
  Seitenhöhe sinkt von 7272 auf 7182 px, „Einsatz-Sammlung (Meldekopf)" rutscht
  von 1722 auf 1632 px, „So funktioniert's" von 1195 auf 1105 px. Die Kopfzeile
  verschiebt sich um 0,0004 (Layoutverschiebungswert), die Inhalte darunter
  sind nicht im ersten Bildschirm.
- **Folge:** Wer gleich nach dem Öffnen weiterscrollt, erlebt einen Ruck von 90
  px; auf dem Erstgerät, das ein Zugführer im Bereitstellungsraum einrichtet, ist
  das kleiner Störfaktor, aber der Ruck ist reproduzierbar.
- **Empfehlung:** Die Zeile in beiden Zuständen gleich hoch halten oder den
  Platz für zwei Zeilen reservieren.

### R18-K8 [P3] Tabelle am Telefon: Bedienblock davor, Zeilen 61 bis 72 px hoch

- **Neu oder alt (Verweis):** alt, R17-K7/H8/G7 (Tabelle am Telefon zu breit; die
  Breite ist behoben, die Höhe nicht).
- **Ort:** Einsatzansicht › „Tabelle", 360x640 und 390x844.
- **Beobachtung:** Nach Tippen auf „Tabelle" und Scrollen auf den Umschalter
  steht über der Tabelle ein Block aus Karten/Tabelle, den zwei Verweisen „5 ohne
  Auftrag · 1 ohne Zug", „Suchen, sortieren, filtern" und „Alle Spalten zeigen"
  (etwa 280 px); bei 360x640 ist eine Datenzeile über der Fußleiste sichtbar.
  Zeilen sind 72 px (360 px Breite) bzw. 61 px (390 px) hoch, weil der Name
  („Nr. 3 THW Crailsheim Fachgruppe Wassergefahren (A)") auf vier Zeilen umbricht.
- **Folge:** Von sechs Einheiten sind am kleinen Telefon höchstens drei Zeilen
  zugleich lesbar; die Tabelle ersetzt den Überblick nicht, den sie bieten soll.
- **Empfehlung:** Bedienblock einklappen, wenn die Tabelle aktiv ist; Namen in
  der Tabelle auf Nr. und Ort kürzen (Typ in der Karte).

### R18-K9 [P3] Kennzahlenraster: zweite Zeile um etwa 5 px versetzt

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatzkopf, Kennzahlen „Einheiten / Führer / Unterf. / Mannsch. /
  Gesamt", 360x640 und 390x844.
- **Beobachtung:** Das Raster bricht in 3 + 2 Zellen um; in der zweiten Zeile
  beginnen „Mannsch." und „Gesamt" nicht auf der Linie der Zellen darüber (Zahl
  „40"/„33" bei x = 46, die obere Zeile bei x = 40); die Spalte „Gesamt" steht
  unter „Führer", der Platz unter „Unterf." bleibt leer.
- **Folge:** Die Zahlen lesen sich als zwei getrennte Gruppen; „Gesamt" (die
  Zahl, die der Stab hören will) steht in der zweiten Zeile statt hervorgehoben.
- **Empfehlung:** Eine Zeile mit allen fünf Zahlen oder „Gesamt" groß vor die
  Einzelwerte; Zellen auf einer Linie.

### R18-K10 [P3] Weitergabe-Bereich nach „Nur neue Bögen seit dem letzten Export": fünf Absätze Erklärung vor den Knöpfen

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatzansicht, unter der Liste, 390x844.
- **Beobachtung:** Nach dem Ankreuzen stehen vor den Nachtrag-Knöpfen: „Gerechnet
  ab dem Erzeugen der Datei — ob sie beim Stab angekommen ist, weiß das Gerät
  nicht." / „Sammel-PDF an den Stab: für den Stab noch keine Lieferung — alle
  Bögen sind neu. Die Weitergabe-Datei vom … zählt hier nicht (sie geht zum
  Sichern an die Ablösung oder ins Archiv). Das nächste Sammel-PDF hier ist die
  erste Lieferung an den Stab." / drei Zeilen „… zuletzt erzeugt …, seitdem 1
  neuer Bogen". Darüber steht bereits der Absatz zu „Einsatz weitergeben /
  sichern" mit derselben Erklärung.
- **Folge:** Unter Zeitdruck liest niemand diese Menge; der Unterschied
  zwischen „Weitergabe" und „Lieferung an den Stab" bleibt unklar.
- **Empfehlung:** Je Ziel („Stab", „Ablösung/Archiv") eine Zeile mit Stand und
  Zahl neuer Bögen; Erklärung hinter „Was heißt das?".

### R18-K11 [P3] Papierkorb zeigt entfernte Meldung ohne Zug, Stand und Stärke je Fassung

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatzansicht, „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar".
- **Beobachtung:** Der Eintrag lautet „Meldung Nr. 7 „THW Laufenburg Zugtrupp
  Fachzug Logistik" (4 Personen) · entfernt 28.10.2026, 01:26 · liegt bis
  04.11.2026, 01:26" mit „Zurückholen" und „Endgültig löschen…". Zug, Auftrag und
  das Alter der Angaben fehlen.
- **Folge:** Hat die Ablösung oder ein zweiter Meldekopf mehrere Meldungen
  derselben Einheit entfernt, lässt sich nicht erkennen, welche zurückgeholt
  werden soll.
- **Empfehlung:** Zug, Auftrag und Alter im Eintrag wie auf der Karte nennen.

### R18-K12 [P3] Kaltstart öffnet direkt den letzten Einsatz; Zurück verlässt die App

- **Neu oder alt (Verweis):** alt, R17 (Zurück-Geste führt zur Startseite,
  behoben nur nach Neuladen aus der Startseite).
- **Ort:** Erstes Öffnen von `/` auf einem Gerät mit gespeichertem Einsatz,
  390x844.
- **Beobachtung:** Die App öffnet ohne Zwischenschritt die Einsatzansicht
  (Verlauf: 2 Einträge). Ein Zurück wechselt nach `about:blank`, die App
  verschwindet. Aus der Startseite › „Öffnen" › Neuladen führt Zurück dagegen
  zur Startseite und erst ein zweites Zurück verlässt die App.
- **Folge:** Die Zurück-Geste verhält sich je nach Weg anders; wer nach dem
  Aufwachen des Geräts zurück will („die anderen Einsätze"), schließt die App
  stattdessen.
- **Empfehlung:** Beim Kaltstart einen Verlaufseintrag „Startseite" unter den
  Einsatz legen, damit Zurück immer zuerst die Startseite zeigt.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Stand" heißt im Lageblatt die Aufnahmezeit am
  Meldekopf, auf der Karte das Alter des Bogens, und beide stehen in
  derselben Zeile.
- **Größtes Einsatzrisiko:** Der Stab liest im weitergegebenen Lageblatt „Stand
  28.10.2026, 01:22" und hält Angaben für frisch, die über drei Monate alt sind.
- **Top-Priorität für die nächste Iteration:** R18-K1, eine einzige Bedeutung
  für „Stand" in Karte, Lageblatt, CSV und Dialogen.
