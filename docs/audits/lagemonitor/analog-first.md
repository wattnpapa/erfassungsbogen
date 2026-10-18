# Analog first — Lagemonitor (R6-A)

Rolle: praktisch erfahrener, IT-skeptischer THW-Helfer, der Papier, Meldeblock,
Whiteboard und Funk bevorzugt. Geprüft im Produktionsbuild (Port 4173),
Chrome 153 (Playwright), Monitor 1920 × 1080, Einsatzansicht 1280 × 800;
Einsätze „Wattsturm 2026" (voll), „Hochwasser Süd" (leer), „Brandschutzübung
Nordhafen" (kurz).

Durchgeführt: Monitor und Hauptfenster in einem Kontext parallel betrieben;
Hauptfenster geschlossen, alle Fenster geschlossen und neu geöffnet; anderes
Browserprofil und beschädigten Speicher simuliert; Geräteuhr per
Playwright-Uhr um −2 h, +5 h und +7 h verstellt; den Monitor im Druckmedium als
PDF ausgegeben (zugeklappt und mit offener Tabelle); das Lageblatt (A4 quer)
aus der Einsatzansicht erzeugt und als Text gelesen; Quelltext zu Zeitformat,
Speicherschlüsseln und Geräteuhr-Prüfung gelesen. Nicht prüfbar (Annahmen):
echtes Abziehen des HDMI-Kabels, Ruhezustand des Laptops, Drosselung eines
verdeckten Fensters, Electron-Fenster, Wake-Lock auf echter Hardware.

Urteil: Bei Browser-Neustart bleibt die Lage erhalten, der Monitor ist in 25 ms
aktuell, sobald im Hauptfenster etwas geändert wird, und fällt Fernseher oder
Kabel aus, arbeitet das Hauptfenster weiter. Fällt der Laptop aus, ist die Lage
nur so aktuell wie das letzte von Hand erzeugte Lageblatt. Der Monitor gibt
weder Papier noch Bild ab, und was er zeigt, steht nicht auf dem Papier.

## Befunde

### R6-A1 (P1) — Kein Datenstand am Monitor

- Fundstelle: Monitor, alle Größen.
- Beobachtung: Nirgends steht, wann zuletzt etwas erfasst wurde oder wie alt die
  Daten sind. „Hochwasser Süd" zeigt „0 / 0 / 0 // 0" und „Einsatzbeginn nicht
  gesetzt", das sieht aus wie „niemand da" statt „noch nichts eingetragen". Die
  App kennt die Information („Lageblatt erstellt 18.10.2026, 08:10 · seitdem
  keine neue Meldung"), zeigt sie aber nur in der Einsatzansicht.
- Folge: Hat die Führungsstelle Meldungen per Funk oder als Nachtragszeile auf
  dem Lageblatt, die noch nicht erfasst sind, erkennt man am Fernseher nicht,
  dass das Bild hinterherhinkt, und hält die Zahl für maßgeblich.
- Empfehlung: Eine Zeile „Letzte Meldung erfasst: <DTG>" (oder „noch keine
  Meldung") und eine eindeutige Leerlage statt Nullen.
- Nachprüfung: Meldung erfassen, der Stand am Fernseher läuft mit; der leere
  Einsatz zeigt „noch keine Einheit gemeldet" im Kopf.

### R6-A2 (P1) — Zeit ist ungeprüfte Geräteuhr, ohne Quelle und Zone

- Fundstelle: Monitor, DTG und Dauer.
- Beobachtung: Bei Uhrsprung −2 h zeigte der Monitor binnen 5 s „0611" und
  „4 Stunden, 27 Minuten"; bei +5 h „1311" und „11 Stunden, 27 Minuten", ohne
  jeden Hinweis. DTG und Dauer kommen aus derselben Uhr und stimmen deshalb immer
  zueinander, auch wenn beide falsch sind. Die Geräteuhr-Prüfung der App
  („Geräteuhr prüfen") greift laut Quelltext erst bei Sprüngen über 60 Tagen und
  schützt Löschfristen, nicht die Uhrzeit. „Jetzt" speichert den Beginn mit
  derselben Uhr. Das DTG hat keinen Zonenbuchstaben (Annahme: Funk und Protokoll
  arbeiten im Einsatz mit Zonenangabe).
- Folge: Ein Laptop ohne Netz (Annahme: keine Zeitsynchronisation) kann
  Minuten bis Stunden danebenliegen. Alle Uhrzeiten (Monitor, Meldeeingang,
  Lageblatt) sind dann konsistent falsch und passen nicht zur Funkuhr oder zum
  Papierprotokoll.
- Empfehlung: Beim Öffnen des Monitors einmalig „Uhr mit Funk/Funkuhr
  abgleichen" und das Ergebnis dauerhaft kennzeichnen („Uhr abgeglichen 08:05");
  Zeitzone ausweisen; Beginn aus dem Protokoll eintragbar, nicht nur über „Jetzt".
- Nachprüfung: Systemzeit um 1 h verstellen; der Monitor macht die Abweichung
  erkennbar oder fordert zum Abgleich auf.

### R6-A3 (P1) — Das Lageblatt trägt nicht, was der Fernseher zeigt

- Fundstelle: Lageblatt (A4 quer, 3 Seiten bei 16 Einheiten) gegen Monitor.
- Beobachtung: Im Lageblatttext fehlen Funkrufname der Führungsstelle,
  Einsatzbeginn und Dauer; beides steht nur im Block „Lagemonitor für den
  Fernseher". Das Lageblatt trägt „Erstellt 18.10.2026, 08:10", der Fernseher das
  DTG „18 0811 okt 26" — zwei Zeitformate für dieselbe Lage. Funkruf und Beginn
  reisen mit der Gesamt-Datensicherung (`eeb.*`-Schlüssel), im Lageblatt und in
  der Sammel-PDF wurden sie nicht gefunden. Das Lageblatt wird nur auf Knopfdruck
  erzeugt.
- Folge: Fällt der Laptop aus, sind auf Papier weder Einsatzbeginn noch Dauer
  noch der eigene Funkrufname der Führungsstelle belegt; Zeiten müssen aus dem
  Funk-Journal oder dem Kopf rekonstruiert werden.
- Empfehlung: Funkrufname, Einsatzbeginn und Erstelldatum im DTG-Format in den
  Lageblatt-Kopf und die Sammel-PDF; Hinweis in der Einsatzansicht, wenn das
  Lageblatt älter als die letzte Meldung ist.
- Nachprüfung: Beginn und Funkruf setzen, Lageblatt erzeugen, im Kopf prüfen.

### R6-A4 (P2) — Der Monitor lässt sich nicht als Papier oder Bild sichern, die Tabelle passt nicht auf einen Schirm

- Fundstelle: Monitor, „Optionen" (nur Hell/Dunkel, Vollbild, Schließen).
- Beobachtung: Kein Drucken, kein Lageblatt, kein Bild. Im Druckmedium druckt
  zugeklappt nur der Kopf (1 Seite), mit offener Tabelle sind es 3 Seiten, und
  „Einheitentyp" bricht zu „Einheitenty/p", „Zugtrupp" zu „Zugtrup/p". Strg+P
  ist der einzige Weg, ein Hinweis fehlt. Bei 1920 × 1080 mit offener Tabelle sind
  4 von 16 Einheiten sichtbar (laut Prüfer; andere Prüfer messen etwa 7 bis 9 je
  nach Lage des Tabellenkopfs), die Seite ist 2064 px hoch.
- Folge: Wer „schnell ein Foto vom Fernseher" als Notizersatz macht, bekommt nur
  einen Teil der Einheiten. Ein digitaler Ausdruck der Lage ist nur über das
  Hauptfenster (Lageblatt) möglich.
- Empfehlung: Einen sichtbaren „Lageblatt drucken"-Weg im Monitor, eine
  Druckfassung des Kopfes mit Einheitentabelle auf einer Seite, die Tabelle auf
  einem Bildschirm unterbringen oder automatisch blättern.
- Nachprüfung: 16 Einheiten, Tabelle öffnen, Foto oder Ausdruck zeigt alle.

### R6-A5 (P2) — Keine laufende Nummer am Monitor

- Fundstelle: Tabelle „Einheiten" gegenüber Lageblatt und Karten.
- Beobachtung: Lageblatt und Karten nummerieren („Nr. 12 DRK Loppersum"), der
  Monitor hat nur Orga, Ort, Funkruf, Typ, F, U, M. In der Vorbelegung (alle
  Meldungen mit identischer Eingangszeit, daher nur indikativ) steht Jever
  (Nr. 3) an erster, Oldenburg (Nr. 1) an zweiter Stelle.
- Folge: Eine per Funk genannte „Nr. 12" lässt sich am Fernseher nicht zuordnen;
  die Reihenfolge von Monitor und Lageblatt kann abweichen, ohne dass es auffällt.
- Empfehlung: Nummer als erste Spalte und danach sortieren (oder die Sortierung
  kennzeichnen).
- Nachprüfung: Monitor und Lageblatt nebeneinander, gleiche Nr. an gleicher
  Stelle.

### R6-A6 (P2) — Fehlermeldung „nicht (mehr) vorhanden" ohne Ursache, mühsamer Wiederanlauf

- Fundstelle: Monitor nach Browser- oder Profilwechsel oder bei beschädigtem
  Speicher.
- Beobachtung: Im anderen Profil: „Dieser Einsatz ist auf diesem Gerät nicht
  (mehr) vorhanden." und nur „Schließen"; ebenso bei absichtlich beschädigtem
  Speicher. Ein Hinweis auf Browser oder Profil fehlt. Die Adresse trägt eine
  UUID und ist nicht abtippbar. Nach einem Browserausfall: App starten, Einsatz
  öffnen, weit nach unten scrollen, „Lagemonitor öffnen", Fenster wieder auf den
  Fernseher ziehen, Vollbild unter „Optionen". Gut: Nach Schließen aller Fenster
  und Neustart waren Einsatz, Funkruf und Beginn vorhanden.
- Folge: Wer den Monitor im falschen Browser öffnet, hält den Einsatz für gelöscht
  und sucht in Panik nach Datenverlust.
- Empfehlung: Meldung ergänzen („Im selben Browser und Profil wie die Erfassung
  öffnen. Daten liegen nicht auf einem Server."), Kurzweg „Monitor" auf der
  Einsatzkarte.
- Nachprüfung: Monitor-Adresse in einem anderen Profil öffnen, Text lesen.

### R6-A7 (P3) — Widersprüchliche Zwischenzustände am Fernseher

- Beobachtung: Nach „Jetzt" im Hauptfenster stand 0,3 s und 2 s später „Einsatz
  beginnt noch", erst nach rund 6 s „0 Stunden, 0 Minuten" (Takt 5 s). Der
  Funkrufname erscheint beim Tippen sofort am Fernseher (25 ms), auch halbfertig.
- Folge: Kurz irritierende Anzeige vor den Augen der Gruppe.
- Empfehlung: Beim Speicher-Ereignis sofort neu rechnen; den Funkrufnamen erst
  nach Verlassen des Felds übernehmen.
- Nachprüfung: „Jetzt" drücken, der Monitor zeigt sofort „0 Minuten".

## Was gut ist

- Die Daten liegen im Gerät und überleben Fenster- und Browserneustart.
- Update nach Erfassung in 25 ms.
- Das Schließen des Hauptfensters lässt den Monitor weiterlaufen.
- Bei Datenverlust zeigt der Monitor lieber nichts als alte Zahlen.
- Das Lageblatt hat handschriftliche Nachtragszeilen und die Spalte „übertragen",
  abgesichert durch den Hinweis „seitdem keine neue Meldung".
- Keine Personennamen am Fernseher.
- Zeitformat und Stärke „F / U / M // gesamt" sind funkgerecht.

## Analog-/Digital-Übergabe

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Lage am Fernseher | alle sehen dieselbe Zahl aus der Ferne | Lageblatt (A4 quer) oder Whiteboard | Nachtragszeilen „übertragen" abhaken; ein Hinweis auf nicht übertragene Zeilen fehlt am Monitor (R6-A1) |
| Einsatzzeit und Dauer | die Dauer rechnet sich selbst | Funk-Journal, Armbanduhr | Beginn aus dem Protokoll nachtragen; Zeitvergleich fehlt (R6-A2) |
| Funkrufname und Beginn der Führungsstelle | erscheint groß am Fernseher | Eintrag im Funkjournal | steht nicht im Lageblatt und nicht in der Sammel-PDF (R6-A3) |
| Fernseher, HDMI oder Fenster fällt aus | Hauptfenster arbeitet weiter | Lageblatt aus dem Hauptfenster drucken | Monitor neu öffnen: Einsatz, Block, Knopf (R6-A6) |
| Laptop fällt aus | Daten bleiben im Gerät | letztes Lageblatt plus handschriftliche Nachträge | Nachträge neu erfassen; Lageblatt nur auf Knopfdruck (R6-A3) |

Würde der Prüfer dafür das Papier weglegen? Nein. Das Lageblatt oder das
Whiteboard bleibt maßgeblich, weil der Monitor keinen Datenstand zeigt, nur die
ungeprüfte Geräteuhr kennt und weder Papier noch Bild abgibt. Als schnelle
Übersicht für die Gruppe ist er brauchbar.

## Zählung

| P0 | P1 | P2 | P3 |
| --- | --- | --- | --- |
| 0 | 3 | 3 | 1 |

Größtes Einsatzrisiko: Eine falsche Geräteuhr macht DTG, Dauer und Meldezeiten
zugleich falsch, und niemand sieht es. Wichtigster nächster Schritt: „Letzte
Meldung erfasst" und ein Uhrenabgleich am Monitor (R6-A1, R6-A2).
