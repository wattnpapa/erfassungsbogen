# Helfer im Feld — Lagemonitor (R6-H)

Rolle: THW-Helfer, praktisch, kein IT-Profi, Zeitdruck, wenig Schulung.
Geprüft im Produktionsbuild (Port 4173), Chrome 153 (Headless, Playwright);
Einsatzansicht 1280 × 800, Monitor 1920 × 1080 und 1366 × 768.

Durchgeführt: Einrichten nach Einsatzkarte „Wattsturm 2026" (16 Einheiten) und
„Hochwasser Süd" (leer) — Block suchen, Funkrufname tippen, „Jetzt", „Lagemonitor
öffnen"; Monitor mit allen drei Bereichen auf und zu; Einheitentabelle
vermessen; Bedienung nur mit Tastatur (Tab, Enter, Bild-ab, Vollbild);
Aktualisierung nach 5 s; Neuladen. Die Aufgabe „Monitor einrichten" ist mit
Schwierigkeit erledigt: Die Schritte selbst brauchen unter einer Minute, das
Finden des Blocks und das Erkennen des Ergebnisses kosten Zeit (R6-H1, R6-H2).
Nicht prüfbar: echtes Ziehen auf einen zweiten Bildschirm, echtes Vollbild mit
Esc, Mauszeiger, Lesen aus einigen Metern — das ist am Fahrzeug-Fernseher
manuell zu testen.

## Befunde

### R6-H1 (P1) — Der Block „Lagemonitor für den Fernseher" liegt tief in der Einsatzansicht

- Fundstelle: Einsatzansicht 1280 × 800.
- Beobachtung: Bei „Wattsturm 2026" liegt der Block bei y ≈ 3341 von 4826 px
  Seitenhöhe, nach 16 Einheitenkarten, etwa vier Bildschirmhöhen Scrollen. Bei
  „Hochwasser Süd" (leer) bei y ≈ 999 von 2484. Oben gibt es einen Sprunglink
  „Weitergeben, Lageblatt, Export ↓", aber keinen zum Lagemonitor.
- Folge: Im Fahrzeug, kurz nach dem Eintreffen, sucht der Helfer erst; die
  Zwei-Minuten-Vorgabe wird mit Scrollen und Raten gefährdet.
- Empfehlung: Sprunglink „Lagemonitor für den Fernseher ↓" neben den
  vorhandenen Sprunglink oder den Block (zumindest „Lagemonitor öffnen") weit
  nach oben.
- Nachprüfung: Einsatz mit 16 Einheiten öffnen und zählen, wie viele
  Bildschirme bis zum Knopf nötig sind (Ziel: ein Tipp oder ein Bildschirm).

### R6-H2 (P1) — Keine Rückmeldung nach „Lagemonitor öffnen"

- Fundstelle: Einsatzansicht, Knopf „Lagemonitor öffnen".
- Beobachtung: Nach dem Klick öffnet sich ein Fenster (gleiche Größe, Adresse
  `?lagemonitor=…`), das Hauptfenster bleibt unverändert, ohne Meldung wie
  „Monitor geöffnet — auf den Fernseher ziehen, dort Optionen → Vollbild". Der
  Hinweistext nennt nur „auf den Fernseher ziehen (HDMI, erweiterter
  Bildschirm)". Ein Popup-Blocker würde den Klick lautlos wirkungslos machen
  (nicht verifiziert). Eine Anleitung, den Fernseher als zweiten Bildschirm
  einzurichten (z. B. Windows-Taste + P), fehlt.
- Folge: Der Helfer weiß nicht, ob das Fenster aufgegangen ist und hinter dem
  Hauptfenster liegt, und kennt den nächsten Schritt nicht.
- Empfehlung: Statuszeile unter dem Knopf („Monitor-Fenster geöffnet. Ziehen Sie
  es auf den Fernseher, dann dort: Optionen → Vollbild."), Meldung bei
  blockiertem Fenster, ein Satz mit dem Tastenkürzel zum Erweitern des
  Bildschirms.
- Nachprüfung: Knopf drücken, auch mit aktivem Popup-Blocker; es erscheint immer
  eine verständliche Meldung.

### R6-H3 (P1) — Einheitentabelle: Wörter brechen mitten im Wort, Spaltenbreiten schlecht verteilt

- Fundstelle: Monitor, „Einheiten", 1920 × 1080 und 1366 × 768.
- Beobachtung: „Einheitentyp" bricht als „Einheitenty / p", „Feuerwehr" in der
  Spalte Orga als „Feuerweh / r". Zeilenhöhe dadurch 104 statt 58 px (1920)
  bzw. 74 statt 41 px (1366). Spaltenbreiten bei 1920: Orga 224, Ort 382,
  Funkrufname 536, Einheitentyp 257, F/U/M je 139. Die Funkrufname-Spalte ist am
  breitesten, die Zahlenspalten sind breit und leer. Zweizeilige Orte
  („Haverie Kommando") oder Funkrufnamen („Heros Übungsort Nord 21/10")
  verdoppeln die Zeilenhöhe ebenfalls.
- Folge: Aus einigen Metern ist „Feuerweh r" ein Lesefehler und wirkt wie ein
  Darstellungsfehler; die doppelten Zeilen kosten Platz (R6-H4).
- Empfehlung: Orga- und Typ-Spalte so breit, dass das längste Wort nie getrennt
  wird; Zahlenspalten schmal; Umbrüche nur an Leerzeichen; alternativ „Typ" als
  Überschrift.
- Nachprüfung: „Wattsturm" bei 1920 × 1080 und 1366 × 768 öffnen; kein Wort
  bricht mitten im Wort.

### R6-H4 (P1) — Mit aufgeklappten Einheiten passt nicht alles in ein Bild

- Fundstelle: Monitor 1920 × 1080 und 1366 × 768.
- Beobachtung: Zugeklappt passt alles genau (Seitenhöhe gleich Fensterhöhe).
  Mit aufgeklappten Einheiten (16) ist die Seite 2064 px (1920) bzw. 1488 px
  (1366) hoch; alle drei Bereiche auf: 2420 bzw. 1746 px. Bei 1920 × 1080 sind
  nur etwa die ersten neun Einheiten sichtbar. Ohne Maus ist Scrollen nur per
  Tastatur möglich, und die Führungskraft sitzt am Laptop, nicht am Fernseher.
  Die Tabellenschrift (39,7 px bei 1920) ist gut, nimmt aber den Platz. Die
  Aktualisierung alle 5 s hält die Scrollposition (geprüft: `scrollY` blieb 861).
- Folge: Bei mehr als etwa 9 bis 10 Einheiten sieht der Fernseher nie die ganze
  Lage, und das Wichtigste (Zeit, Stärke, Dauer) scrollt weg. Annahme: In
  Zugtrupp-Lagen sind 16 und mehr Einheiten realistisch.
- Empfehlung: Bei aufgeklappter Tabelle den Kopfbereich schrumpfen lassen und
  die Zeilen verdichten, oder die Tabelle in zwei Blöcke nebeneinander teilen,
  oder selbständig seitenweise blättern; im Hauptfenster einen Hinweis geben.
- Nachprüfung: 16 und 25 Einheiten bei 1920 × 1080 und 1366 × 768 aufklappen;
  alles sichtbar oder sichtbares selbständiges Weiterblättern.

### R6-H5 (P2) — Fokusrahmen im dunklen Monitor kaum zu sehen, toter Tab-Stopp

- Fundstelle: Monitor, Tastaturbedienung ohne Maus.
- Beobachtung: Der Fokusrahmen der Knöpfe „Hell / Vollbild / Schließen" ist 3 px
  dunkelblau (rgb 18, 39, 94) auf Schwarz; die Aufklapper-Überschriften haben
  die Standardmarke (1 px). Der Tabulator läuft Einheiten, Einsatzdaten,
  Optionen, Hell, Vollbild, Schließen, dann ein Stopp auf dem Seitenrumpf
  (nichts erkennbar), dann wieder Einheiten. Keine Tastenkürzel (e, o, v, h, Esc
  taten nichts). Positiv: Tab, Enter und Bild-ab erreichen alles.
- Folge: Im Vollbild ohne Maus sieht man nicht sicher, wo man ist; der
  Leerlauf-Tab verwirrt.
- Empfehlung: heller, dicker Fokusrahmen (weiß oder gelb), toten Stopp
  vermeiden, optional Kürzel (V = Vollbild).
- Nachprüfung: Mit Tab durch den Monitor gehen und aus 3 m erkennen, welcher
  Knopf aktiv ist.

### R6-H6 (P2) — Bedienelemente im Monitor klein, „Optionen" sagt nicht, was darin liegt

- Fundstelle: Monitor 1920 × 1080.
- Beobachtung: Die Aufklapper-Überschriften sind nur etwa 50 px hoch, deutlich
  kleiner als die Zeilen darüber. Die Optionsknöpfe sind 58 px hoch, aber weiß
  auf Schwarz mit kleiner Schrift. „Vollbild" und „Schließen" liegen im
  eingeklappten Bereich „Optionen", dessen Name nicht verrät, dass dort
  „Vollbild" ist.
- Folge: Wer schnell Vollbild will, sucht; „Optionen" ist keine
  Handlungsaufforderung.
- Empfehlung: Beschriftung „Optionen (Vollbild, Hell/Dunkel)" oder „Vollbild"
  direkt sichtbar; Aufklapper-Überschriften etwas größer.
- Nachprüfung: Ein neuer Nutzer bringt den Monitor ohne Hilfe in Vollbild; Zeit
  stoppen.

### R6-H7 (P2) — Erklärtext der Export-Knöpfe steht im Monitor-Block

- Fundstelle: Einsatzansicht, Block Lagemonitor.
- Beobachtung: Der lange Absatz „Einsatz weitergeben / sichern erzeugt die
  Sammel-PDF …" steht direkt unter den Feldern und Knöpfen des Lagemonitors
  (zwischen „Lagemonitor öffnen" und der Checkbox „Nur neue Bögen seit dem
  letzten Export"), gehört aber zu den Export-Knöpfen. Der Block hat keine
  sichtbare Grenze und endet nicht erkennbar.
- Folge: Der Helfer liest den Absatz als Erklärung zum Monitor und begreift
  nicht, wo der Block endet.
- Empfehlung: Absatz zu den Export-Knöpfen verschieben (Ursache: der Block wurde
  vor den Erklärtext eingefügt), den Monitor-Block mit Rahmen abgrenzen.
- Nachprüfung: Block ansehen; die Abgrenzung ist auf einen Blick klar.

### R6-H8 (P2) — Eingabe Einsatzbeginn: Format und Vorbelegung

- Fundstelle: Feld „Einsatzbeginn".
- Beobachtung: Natives Datum/Zeit-Feld („10/18/2026, 08:10 AM", Prüfumgebung
  en-US; in Deutschland wahrscheinlich 24 h, nicht verifiziert) mit kleinem
  Kalender-Symbol. „Jetzt" setzt auf die aktuelle Minute (geprüft), „Löschen"
  leert. Der Monitor zeigt den Beginn als DTG („0144"), das Feld eine andere
  Schreibweise; die Beschriftung erklärt nicht, dass er von Hand gesetzt wird und
  dass ohne ihn nur „Einsatzbeginn nicht gesetzt" erscheint, und nicht, dass ein
  nachträglicher Beginn (z. B. die Alarmzeit) möglich ist.
- Folge: Wer den echten Alarmzeitpunkt eintragen will, muss mit mehreren
  kleinen Teilfeldern hantieren. Der Normalfall „Jetzt" ist gut.
- Empfehlung: Hinweis „Jetzt = Beginn jetzt; sonst Alarmzeit eintragen." und den
  Zeitpunkt in der Schreibweise des Monitors mit anzeigen.
- Nachprüfung: Beginn auf eine vergangene Zeit setzen; die Einsatzdauer im
  Monitor stimmt.

### R6-H9 (P3) — „0 Stunden, 0 Minuten" nach „Jetzt" wirkt wie eine hängende Anzeige

- Beobachtung: Nach „Jetzt" erscheint „0 Stunden, 0 Minuten" (richtig, aber nicht
  als laufend erkennbar). Unklar, ob die Anzeige hängt.
- Empfehlung: „seit 0 Minuten" o. ä. oder gesicherter Wechsel nach einer Minute.
- Nachprüfung: Nach „Jetzt" eine Minute warten.

### R6-H10 (P3) — „Hell/Dunkel" zeigt das Ziel, nicht den Zustand; Aufklapp-Zustand geht beim Neuladen verloren

- Beobachtung: Im dunklen Monitor steht „Hell", im hellen „Dunkel". Der
  geöffnete Bereich geht beim Neuladen zu (geprüft); nach einem Neustart des
  Browsers muss die Tabelle neu geöffnet werden.
- Empfehlung: „Hell schalten" / „Dunkel schalten" oder Zustand dazuschreiben;
  Aufklapp-Zustand merken.
- Nachprüfung: Neu laden und prüfen.

## Was gut ist

- Der Funkrufname wird sofort übernommen, „Jetzt" setzt den Beginn zuverlässig,
  alle Werte bleiben je Einsatz.
- Zugeklappt passt der Monitor bei 1920 × 1080 und 1366 × 768 exakt in ein Bild
  ohne Scrollen; Zeit rot, groß, fett; Stärke mit unterstrichener Gesamtzahl klar.
- Ohne Funkrufnamen rückt der Einsatzname nach oben; leer sieht sauber aus
  („0 / 0 / 0 // 0").
- Tastatur: Erster Tab landet auf „Einheiten", Enter klappt auf, Bild-ab
  scrollt; die 5-s-Aktualisierung behält Scrollposition, geöffnete Bereiche und
  Fokus.
- Der Vollbild-Knopf funktionierte; Tabellenschrift (39,7 px bei 1920, 28 px bei
  1366) ist für Fernseher brauchbar.
- Der Hinweistext im Block sagt ehrlich „ohne Personennamen".

## Zählung

| P0 | P1 | P2 | P3 |
| --- | --- | --- | --- |
| 0 | 4 | 4 | 2 |

Verständnisprüfung: Orientierung unsicher (Block schwer zu finden, nicht
abgegrenzt); nächste Handlung unsicher (nach „Lagemonitor öffnen" fehlt die
Anleitung); Systemstatus im Monitor verstanden, im Hauptfenster unsicher;
Fehlerbehebung nicht getestet (Popup blockiert, Fensterwahl); Feldtauglichkeit
eingeschränkt (zugeklappt gut, Tabelle über etwa 9 Einheiten nicht in einem Bild).
