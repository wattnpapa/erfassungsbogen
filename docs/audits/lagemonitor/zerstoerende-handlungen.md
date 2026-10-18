# Zerstörende Handlungen — Lagemonitor (R6-D)

Rolle: praktisch-technischer THW-Helfer, der riskante, irreversible oder
folgenschwere Bedienhandlungen prüft. Geprüft im Produktionsbuild (Port 4173),
Chrome 153 (Playwright), Einsatzansicht 1280 × 800, Monitor als zweites Fenster
im selben Kontext.

Nachgestellt: „Jetzt", „Löschen", Leeren des Funkrufnamens und Tippen im Block
„Lagemonitor für den Fernseher" mit Blick auf den Monitor; Teilbearbeitung und
Pfeiltasten im Feld „Einsatzbeginn"; Einsatz löschen (Papierkorb), Änderung in
einem anderen Einsatz, Wiederherstellen; „Alle Daten löschen" bei offenem
Monitor; „Schließen" im Monitor mit und ohne Opener; ob der Monitor selbst etwas
ändern kann (Durchsicht von `lagemonitor-ui.tsx` plus Lauf).

Urteil: Der Monitor selbst ist unkritisch — reine Anzeige ohne schreibende
Pfade, „Schließen" schließt nur das Fenster. Gefährlich ist der Eingabeblock in
der Einsatzansicht: Jede Eingabe wirkt sofort und ohne Rückfrage auf den
Fernseher, der Einsatzbeginn lässt sich mit einer einzigen Taste löschen, und es
gibt dafür kein Rückgängig. Außerdem geht der Funkrufname eines Einsatzes im
Papierkorb beim Weiterarbeiten verloren, und die Rückfrage beim Löschen warnt
davor nicht.

## Befunde

### R6-D1 (P1) — Ein Tastendruck im Feld „Einsatzbeginn" löscht den Beginn endgültig

- Fundstelle: Einsatzansicht, Block „Lagemonitor für den Fernseher", Feld
  „Einsatzbeginn" (datetime-local), 1280 × 800.
- Beobachtung: Klick in ein Segment (Stunde) und Rücktaste: Der Feldwert wird
  leer. Das ist nur ein unvollständiger Zwischenstand, die App behandelt ihn aber
  als „Beginn löschen". `localStorage["eeb.lagebeginn.v1"]` war danach `null`, der
  Monitor zeigte sofort „Einsatzbeginn nicht gesetzt", der Knopf „Löschen"
  verschwand. Pfeil-hoch im Monatssegment schrieb sofort 2026-11-18, der Monitor
  zeigte „Einsatz beginnt noch"; weitere Pfeiltasten schreiben jeweils sofort
  (Tag +2: 2026-11-20). Das Mausrad veränderte nichts. Es gibt keinen
  Rückgängig-Knopf, keine Meldung, keine Rückfrage; der alte Wert wird nirgends
  angezeigt oder gemerkt.
- Folge: Wer das Feld nur anfasst (Uhrzeit nachsehen, Minute verbessern), kann die
  laufende Einsatzdauer auf dem Fernseher auslöschen, ohne den alten Wert zu
  kennen; die Minute müsste aus dem Gedächtnis oder von einem Zettel neu gesetzt
  werden. „Einsatzbeginn nicht gesetzt" würde man als Hinweis auf einen anderen
  Einsatz fehldeuten.
- Empfehlung: Teilbearbeitungen nicht sofort speichern, sondern erst beim
  Verlassen des Feldes oder mit eigenem Knopf „Übernehmen"; ein leeres Feld darf
  den Beginn nicht löschen, gelöscht wird nur über „Löschen"; den alten Wert
  vorher merken und kurz „Rückgängig" anbieten.
- Nachprüfung: Feld fokussieren, Rücktaste im Stundensegment, Feld verlassen; der
  Beginn bleibt erhalten oder ist wiederherstellbar.

### R6-D2 (P1) — „Jetzt" und „Löschen" überschreiben den Beginn ohne Rückfrage und ohne Rückgängig

- Fundstelle: dieselbe Zeile wie D1. „Jetzt", „Löschen" und der blaue Knopf
  „Lagemonitor öffnen" stehen nebeneinander, die Zeile ist gut einen
  Zeigefinger breit.
- Beobachtung: „Jetzt" überschreibt einen vorhandenen Beginn (6 Stunden 27
  Minuten) mit der aktuellen Zeit, ohne Rückfrage; der Monitor wechselt sofort, der
  Vorwert wird nirgends gezeigt. „Löschen" entfernt den Beginn ebenfalls ohne
  Rückfrage und ohne Rückgängig; der Knopf verschwindet danach, der Monitor zeigt
  „Einsatzbeginn nicht gesetzt". Beim Einsatz selbst gibt es eine Rückfrage mit
  Papierkorb, beim Beginn nicht.
- Folge: Die Grundlage der Einsatzdauer lässt sich durch einen Fehltipp neben dem
  Hauptknopf „Lagemonitor öffnen" verwerfen. Das Risiko ist mit Handschuhen oder
  in Eile besonders hoch, weil die Knöpfe klein und eng beieinander liegen.
- Empfehlung: Bei vorhandenem Beginn „Jetzt" und „Löschen" mit kurzer Rückfrage
  versehen, die den alten Wert nennt („Beginn 18.10. 02:00 durch jetzt ersetzen?"),
  oder nach der Aktion für einige Sekunden „Beginn gelöscht – Rückgängig" zeigen;
  „Löschen" räumlich vom blauen Knopf trennen.
- Nachprüfung: Beginn setzen, „Jetzt" tippen; der alte Wert ist wiederherstellbar
  oder wird vorher bestätigt.

### R6-D3 (P1) — Funkrufname geht still verloren, wenn ein Einsatz im Papierkorb liegt und in einem anderen etwas gespeichert wird

- Fundstelle: Block „Lagemonitor für den Fernseher" in Einsatz B, dazu die
  Papierkorb-Wiederherstellung auf der Startseite.
- Beobachtung (nachgestellt): Einsatz A „Wattsturm 2026" mit Funkrufnamen
  „Salus Übungsleitung" und Beginn in den Papierkorb legen (die Rückfrage nennt 30
  Tage Rückholbarkeit). In Einsatz B im Funkrufnamen „Test X" eintippen:
  `eeb.lagefunkruf.v1` enthielt danach den Eintrag von A nicht mehr, während
  `eeb.lagebeginn.v1` ihn noch hatte. A aus dem Papierkorb zurückholen: Der Monitor
  zeigt wieder „Wattsturm 2026", der Funkrufname fehlt, unter „Einsatzdaten" steht
  „nicht gesetzt (in der Einsatzansicht einstellen)"; der Beginn ist noch da.
  Ursache laut Code: Der Block übergibt `einsaetzeLaden()` als bekannte Einsätze,
  das enthält den Papierkorb nicht, `einsatzWerte.setzen` verwirft alle Einträge zu
  unbekannten Einsätzen. Der Beginn überlebt nur, solange in B kein Beginn
  gespeichert wird; mit „Jetzt" oder „Löschen" in B fällt auch der Beginn von A weg
  (gleiche Logik, nicht nachgestellt).
- Folge: Die Rückfrage verspricht 30 Tage Rückholbarkeit, die Wiederherstellung
  verliert aber Anzeigedaten stillschweigend; bei Zugwechsel oder einem Fehlklick
  auf „Löschen…" ist das nicht erkennbar, bis der Fernseher falsch zeigt.
- Empfehlung: Die bekannten Einsätze müssen den Papierkorb einschließen (die
  Startseite hat dafür schon eine Liste aller Kennungen samt Papierkorb); beide
  Werte (Funkrufname und Beginn) gleich behandeln.
- Nachprüfung: Einsatz A mit Funkrufnamen in den Papierkorb, in B etwas speichern,
  A zurückholen; der Funkrufname bleibt.

### R6-D4 (P2) — Leeren des Funkrufnamens und halbfertiges Tippen wirken live am Fernseher

- Fundstelle: Feld „Funkrufname (optional)".
- Beobachtung: Alles markieren und löschen: Der Funkrufname verschwindet sofort
  vom Monitor, der Einsatzname rückt in die erste Zeile. Beim Neutippen zeigt der
  Fernseher jeden Zwischenstand (nach „Sal" stand „Sal" in der ersten Zeile).
  Teilweise Rettung: Strg+Z im Feld stellte „Salus Übungsleitung" wieder her und
  speicherte es (nur Browser-Rückgängig, ohne Hinweis, nach Verlassen des Feldes
  weg).
- Folge: Wer am Fernseher mitliest, sieht unfertige oder fehlende Funkrufnamen; ein
  versehentliches Leeren (Entf im markierten Feld) verändert die Kopfzeile ohne
  Warnung.
- Empfehlung: Erst beim Verlassen des Feldes oder mit „Übernehmen" speichern, oder
  das Leeren ausdrücklich melden („Funkrufname entfernt – Rückgängig").
- Nachprüfung: Im Feld alles löschen; der Monitor ändert sich erst nach
  „Übernehmen".

### R6-D5 (P2) — Löschen oder Papierkorb macht den offenen Monitor leer, ohne Grund zu nennen

- Fundstelle: Monitor, 1280 × 800, nach „Einsatz löschen" oder „Alle Daten löschen".
- Beobachtung: Einsatz in den Papierkorb legen: Der Monitor (offen, Takt 5 s) zeigt
  nur noch „Dieser Einsatz ist auf diesem Gerät nicht (mehr) vorhanden." und
  „Schließen"; auch das Wiederherstellen bringt die Anzeige ohne Hinweis zurück.
  „Alle Daten löschen" bei offenem Monitor: dasselbe leere Bild; die Rückfrage dort
  (Checkbox, Aufzählung der Sammlungen) erwähnt Monitor, Funkrufnamen und Beginn
  nicht (der Gate-Mechanismus ist sonst gut). Die leere Anzeige nennt nicht, welcher
  Einsatz betroffen war.
- Folge: Die Führung sieht am Fernseher plötzlich eine Fehlermeldung statt der
  Lage; wer die Löschung nicht selbst ausgelöst hat, weiß nicht, ob Daten zerstört
  sind oder der Einsatz im Papierkorb liegt.
- Empfehlung: „in den Papierkorb gelegt, rückholbar" von „nicht vorhanden"
  unterscheiden; die Löschabfragen erwähnen, dass ein offener Lagemonitor leer wird.
- Nachprüfung: Einsatz mit offenem Monitor in den Papierkorb legen; der Monitor
  nennt den Grund.

### R6-D6 (P3) — „Einsatz beginnt noch" bis zu 5 Sekunden nach „Jetzt"

- Fundstelle: Monitor, Zeile unter der Stärke.
- Beobachtung: Nach „Jetzt" zeigte der Monitor 300 ms später „Einsatz beginnt noch";
  der Takt (5 s) ist älter als der neu gesetzte Beginn und liest ihn als „in der
  Zukunft", bis der nächste Takt kommt.
- Folge: Kurze Irritation genau dann, wenn die Führungskraft den Beginn setzt und
  hinüberschaut.
- Empfehlung: Beim Speicher-Ereignis auch die Zeit neu lesen.
- Nachprüfung: „Jetzt" tippen; der Monitor zeigt sofort „0 Minuten" o. Ä.

### R6-D7 (P3) — „Schließen" ohne Opener landet in der vollen App; die Fehlermeldung nennt immer „Beginn"

- Fundstelle: Monitor-Optionen; Block-Fehlermeldung.
- Beobachtung: Mit Opener schließt „Schließen" das Fenster ohne Rückfrage. Ohne
  Opener (Adresse direkt aufgerufen, oder wenn die Popup-Sperre den Wechsel im
  selben Fenster erzwang) navigiert es auf die Startseite, im Test direkt wieder in
  die offene Einsatzansicht. Das Fernsehfenster zeigt dann die bedienbare App statt
  der Lage; mit Maus im Fahrzeug nur ein Umweg, kein Datenverlust. Laut Code lautet
  die Fehlermeldung bei vollem oder gesperrtem Speicher immer „Der Beginn konnte
  nicht gespeichert werden", auch wenn der Funkrufname betroffen war (nicht
  nachgestellt).
- Empfehlung: „Schließen" bei fehlendem Opener erklären; den Text der
  Fehlermeldung an das Feld anpassen.
- Nachprüfung: Monitor direkt per Adresse öffnen und „Schließen" tippen; es ist
  klar, was passiert.

Kann der Monitor selbst etwas verändern? Nein. Im Code und im Lauf gibt es keinen
schreibenden Pfad; Hell/Dunkel ist nur lokaler Zustand, Vollbild nur Anzeige,
„Schließen" ändert keine Daten. Das Risiko entsteht ausschließlich im
Eingabeblock der Einsatzansicht.

## Was gut ist

- Der Monitor ist reine Anzeige, ein Fehlklick am Fernseher kann keine Daten ändern.
- „Einsatz löschen" und „Alle Daten löschen" haben starke Rückfragen (Umfang,
  Papierkorb, Checkbox, Prellschutz); der Papierkorb funktioniert, und der Beginn
  bleibt bei der Wiederherstellung erhalten.
- Strg+Z im Funkrufnamen stellt den Wert wieder her, auch im Speicher.
- Die Länge des Funkrufnamens ist auf 60 Zeichen begrenzt.
- Nach dem Papierkorb-Löschen zeigt der Monitor eine eindeutige Meldung statt
  veralteter Zahlen.

## Zählung

| P0 | P1 | P2 | P3 |
| --- | --- | --- | --- |
| 0 | 3 | 2 | 2 |

Größtes Einsatzrisiko: Ein einziger versehentlicher Tastendruck löscht den
Einsatzbeginn am Fernseher, ohne Hinweis und ohne Rückgängig. Wichtigster nächster
Schritt: Eingaben des Blocks erst nach Bestätigung speichern (den Beginn nie durch
ein leeres Feld löschen) und für „Jetzt", „Löschen" und das Leeren des
Funkrufnamens ein Rückgängig oder eine Rückfrage mit altem Wert einbauen.
