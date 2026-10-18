# Rollenaudits, Reviewer-Runde Lagemonitor (Stand 18.10.2026)

Prüfrunde für die neue Ansicht „Lagemonitor" (Fernseher im Zugtrupp-MTW), nach
dem Code-Stand `main` mit Commit `3a4cb7b`. Zehn Prüfberichte, alle gegen den
Produktionsbuild (`vite build` + `vite preview`, Port 4173) mit Chrome 153,
Monitor bei 1920 × 1080 (zusätzlich 1366 × 768 und 3840 × 2160), Einsatzansicht
bei 1280 × 800. Testdaten: drei Einsätze, davon „Wattsturm 2026" mit 16
Einheiten (THW, DRK, Feuerwehr), ein leerer Einsatz und eine Veranstaltung mit
einer Einheit. Jeder Prüfer hat ohne Kenntnis früherer Berichte getestet und
keinen Code verändert. Nicht geprüft: Handschuh-Bedienung und Mobile-UI (der
Fernseher wird nicht berührt; die Eingabefelder der Einsatzansicht sind das
einzige Berührungsziel) sowie ein echter Fernseher und ein zweiter Bildschirm.

Die Befunde der Berichte sind nicht zusammengeführt: Dieselbe Ursache steht oft
in mehreren Berichten (siehe unten), die Summe zählt jeden Bericht einzeln.

| Rolle | Bericht | Kennung | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- | --- | --- |
| Führungssicht | [fuehrungssicht.md](fuehrungssicht.md) | R6-K | 0 | 3 | 4 | 2 |
| Nacht und Sicht | [nacht-und-sicht.md](nacht-und-sicht.md) | R6-L | 0 | 1 | 3 | 1 |
| Stress und Unterbrechung | [stress-und-unterbrechung.md](stress-und-unterbrechung.md) | R6-S | 0 | 2 | 2 | 1 |
| Helfer ohne Einweisung | [neuer-nutzer.md](neuer-nutzer.md) | R6-N | 0 | 2 | 3 | 1 |
| Arbeitsablauf | [arbeitsablauf.md](arbeitsablauf.md) | R6-W | 0 | 1 | 3 | 3 |
| Analog first | [analog-first.md](analog-first.md) | R6-A | 0 | 3 | 3 | 1 |
| Offline und Speicher | [offline-und-speicher.md](offline-und-speicher.md) | R6-O | 0 | 1 | 3 | 1 |
| Fehler und Wiederanlauf | [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md) | R6-E | 0 | 3 | 4 | 2 |
| Zerstörende Handlungen | [zerstoerende-handlungen.md](zerstoerende-handlungen.md) | R6-D | 0 | 3 | 2 | 2 |
| Helfer im Feld | [feldtauglichkeit.md](feldtauglichkeit.md) | R6-H | 0 | 4 | 4 | 2 |
| Summe | | | 0 | 23 | 31 | 16 |

## Berichtsübergreifende Reihenfolge

Mehrere Prüfer sind unabhängig voneinander auf dieselben Ursachen gestoßen. Nach
Schwere und Häufigkeit:

1. Eingaben gehen verloren oder lassen sich nicht zurücknehmen (R6-E1, R6-D3,
   R6-E2, R6-D1, R6-E4, R6-D2, R6-D4, R6-O1, R6-W1). Das Beginn-Feld speichert jeden
   Zwischenzustand und löscht den Beginn, sobald ein Segment leer wird; „Jetzt",
   „Löschen" und das Leeren des Funkrufnamens wirken sofort am Fernseher ohne
   Rückfrage. Funkrufname und Beginn gehen beim Wiederherstellen aus dem Papierkorb
   verloren (die Aufräumregel kennt nur die aktiven Einsätze), sie reisen nicht in
   der Übergabedatei mit, und ein Speicherfehler beim Funkrufnamen wird als
   „Beginn" gemeldet.
2. Der Fernseher zeigt veraltete oder falsche Werte ohne Warnung (R6-S2, R6-A1,
   R6-A2, R6-E3, R6-W3, R6-W4). Es gibt keinen Datenstand, keine
   Uhrprüfung (die Warnung „Geräteuhr prüfen" des Hauptfensters fehlt am Monitor),
   keinen Hinweis, wenn im Hauptfenster ein anderer Einsatz offen ist, und „alle
   abgerückt" sieht aus wie „nichts gemeldet".
3. Die Einheitentabelle passt bei 16 Einheiten nicht auf den Fernseher (R6-K1,
   R6-H4, R6-L5, R6-A4) und bricht Wörter mitten im Wort („Einheitenty/p",
   „Feuerweh/r": R6-K6, R6-H3, R6-L4, R6-N6). Dazu kommen Standardzustand
   zugeklappt (R6-K3), fehlende Zahl der Einheiten und Fahrzeuge (R6-K2, R6-K7),
   fehlende laufende Nummer (R6-A5) und der Klappzustand, der beim Neuladen
   verloren geht (R6-E7, R6-H10).
4. Auffinden und Einrichten (R6-N1, R6-H1, R6-S5, R6-H2, R6-S1, R6-O3): Der Block
   liegt in der Einsatzansicht ganz unten, nach „Lagemonitor öffnen" fehlt jede
   Rückmeldung, und bei blockiertem Popup wird das Arbeitsfenster still zum
   Monitor. Der Erklärtext der Export-Knöpfe steht im Block (R6-H7, ein
   Einfügefehler).
5. Beschriftung (R6-N2, R6-K7, R6-N4, R6-N5): Die Stärkezeile hat keine Legende,
   die beiden Namenszeilen sind nicht beschriftet, „Löschen" neben dem Beginn ist
   mehrdeutig.
6. Blendung und Kontrast (R6-L1, R6-L2, R6-L3): Reinweiß auf Reinschwarz blendet
   nachts, die blauen Rahmen haben nur 2,44 : 1, und die Hell/Dunkel-Wahl liegt in
   den zugeklappten Optionen und wird nicht gemerkt.

## Was die Runde bestätigt

- Kein P0: Der Monitor selbst ist reine Anzeige und kann nichts verändern; Textfehler
  (HTML, Sonderzeichen, Emoji) sind unkritisch.
- Die Aktualisierung funktioniert, auch ohne Netz: Änderungen im Hauptfenster
  erscheinen in unter 0,5 s (storage-Ereignis).
- Zugeklappt passt der Monitor bei 1920 × 1080 und 1366 × 768 genau in ein Bild;
  Zeit, Stärke und Dauer sind aus der Entfernung gut lesbar, kein Zustand hängt
  allein an der Farbe.
- Der Einsatz wird beim Löschen mit Rückholfrist geschützt, und der offene Monitor
  erholt sich nach „Rückgängig" von selbst.

## Offen aus dieser Runde

Alle Befunde sind offen; behoben ist noch nichts. Die Befunde R6-E1/R6-D3,
R6-E2/R6-D1 und R6-H7 gehen auf die erste Fassung des Eingabeblocks zurück.
