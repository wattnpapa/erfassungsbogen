# Audit „Nacht und Sicht“, Runde 20 (Dunkelheit, Blendung, Sonnenlicht, Farbcodierung)

Prüfer: Rollenaudit `thw-night-visibility-reviewer` · Datum: 2026-10-28 ·
Zählung: **P0 0 · P1 0 · P2 0 · P3 5** · Hinweise (ohne Priorität): 3

Prüfgegenstand: Web-App auf `http://localhost:4173`, Code-Stand Commit `7c06324` (`main`, nach Behebung der Runde 19).
Reiner Prüfbericht, keine Codeänderung.

Gelesen vor dem Lauf: [docs/audits/README.md](../README.md), „Stand der Behebung“ in
[runde-19/README.md](../runde-19/README.md) und [runde-19/nacht-und-sicht.md](../runde-19/nacht-und-sicht.md).
Es gibt keine „bekannten Grenzen“: Als offen oder teilweise geführte Punkte stehen hier, wenn sie im Browser
noch zu beobachten sind (mit alter Befund-ID).

## Prüfaufbau

Chromium über Playwright (`chromium.launch()` ohne Optionen, globales Modul), Locale de-DE, `isMobile`/`hasTouch`,
Viewports 390 × 844 und 360 × 640 (Scanner zusätzlich 568 × 320 und 640 × 360), alle vier Ansichten
(Standard, Dunkel, Feld, Nacht) über `eeb.anzeigemodus.v1`. Zustand: Sammlung „Hochwasser Nord“ (Art Einsatz),
sechs Bögen aus `examples/thw/` über „Bögen einlesen…“ (alle Übung). Für die Speicherfälle wurde `localStorage`
bis zum Quota-Fehler gefüllt.

Gemessen je Zustand: Kontrast jedes Textknotens gegen die tatsächliche Fläche (Schwelle 4,5 : 1, Schrift unter
12 px), Rand-Kontrast von Knöpfen und Feldern (3 : 1), Zielgrößen unter 44 px, waagerechtes Rollen, Treffer-Test
(`elementFromPoint`) auf Knöpfe. Geprüfte Zustände: Einsatzansicht, aufgeklappte Karte, „Mehr…“, Tabelle, Suche,
„Ort eintragen…“, Scanner ohne Kamera, „Einheit manuell erfassen…“, Schnellerfassung (leer, ohne Ort, mit Ort,
Stärke 0), „Bögen einlesen…“ (auch doppelt), „Stärke ändern…“, „Verschieben…“, „Als Einsatzmeldung zählen…“,
Auftrag/Notiz, Zug zuordnen, Hinweise, Lagemonitor-Fenster, „Übergabe vermerken…“, „Einsatz als beendet markieren“,
Startseite nach Abschluss, „Einsatz löschen…“, Datensicherung, Beispielbögen, „Alle Daten löschen“, Bogen Schritt 1
bis 5, Abrücken-Quittung, „Entfernen“-Rückfrage mit Tipp-Sperre, Papierkorb nach Neuladen, Weitergabe und Export
bei vollem Speicher.

**Nicht prüfbar:** echtes Licht (Sonne, Scheinwerfer, Rotlicht), Displayhelligkeit, Kamerabild im Dunkeln (keine
Kamera), native Auswahlfenster, Ausdruck, Rot-Grün-Schwäche am echten Auge.

## Urteil

Kontrast und Codierung halten: In allen vier Ansichten, beiden Telefon-Viewports und allen genannten Zuständen
liegt kein sichtbarer Text unter 4,5 : 1 und keine Schrift unter 12 px; die Seite rollt nie waagerecht; die
Ränder der Knöpfe liegen über 3 : 1 (der Rand von „Ort eintragen…“ in „Dunkel“ ist jetzt 154/166/194 auf Blau).
Zustände tragen Wort oder Form („✓ Abgerückt“, „○ … noch nicht“, „⚠ Stand vor 102 Tagen“, „ÜBUNG“, „neu“,
„beendet“). Die Behebungen der Runde 19 halten fast alle (Tabelle unten). Übrig sind fünf kleine Befunde, keiner
verliert Daten oder verfälscht den Status. Die Aufgabe ist ohne fremde Hilfe machbar.

## Prüfung der Behebungen aus Runde 19

| Befund | Ergebnis |
| --- | --- |
| R19-O1 „Meldung entfernen“ bei vollem Speicher | hält: Rückfrage „Papierkorb voll … Endgültig entfernen?“, nach Neuladen steht Nr. 1 noch da |
| R19-O2 „Einsatz als beendet markieren“ | hält: „Einsatz nicht beendet — Die Änderung ist nicht gespeichert“, nach Neuladen nicht beendet |
| R19-O3 „Einsatz löschen“ | hält: „Nicht gelöscht“ mit Angebot „Endgültig löschen“ und Hinweis, dass es die einzige Kopie wäre |
| R19-O4 „Übergabe vermerken“ | hält: „Übergabe nicht vermerkt“, nach Neuladen „noch nicht vermerkt“ |
| Weitergabe/Export bei vollem Speicher | hält: Quittung nennt „Vermerk nicht gespeichert (Speicher voll)“; Restwiderspruch siehe R20-L3 |
| Quittungsleiste (R19-L6) | hält: 60 px hoch, bündig am Rand, „Rückgängig“ 100 × 44 und „✕“ 44 × 44, verschwindet nach unter 9 s (360 × 640 und 390 × 844) |
| Fußleiste ohne Textüberlauf (R19-A4/W2/H1) | hält: „In Einsatz übernehmen“ 167 × 44 ohne Überlauf; „← Zurück“ in Schritt 1 unsichtbar |
| Tipp-Sperre (R19-L3) | hält: Knopf bei 1,0 Deckkraft (Nacht 224/138/126 auf 23/21/15), Text „Einen Moment …“ erscheint beim Tippen, Sperre endet nach rund 0,6 s |
| Schnellerfassung mit Ort zuerst | hält: „Ort der Einheit (Pflicht)“ ist das erste Feld, „Zum Feld“ bei fehlendem Ort, „Stärke fehlt“-Rückfrage |
| Tabelle am Telefon | hält: 354 px breit bei 360 px, Namen vollständig, keine leere Spalte „Auftrag“ |
| Startseite (R19-L5) | hält: „beendet 28.10.2026, 07:52“ auf der Karte, „Neue Einsatz-Sammlung…“ oberhalb des Falzes bei 390 × 844 |
| Lagemonitor „Noch nichts gemeldet“ (R19-L1) | Hauptpunkt behoben („6 Übungsmeldungen nicht gezählt“), Rest siehe R20-L4 |
| Scanner ohne Kamera (R19-L2) | in Nacht, Standard, Dunkel hält; in „Feld“ Rest siehe R20-L5 |
| Papierkorb, Dateinamen, Nummern nach „Entfernen“ | halten |

## Befunde

### R20-L1 (P3, Bedienung) Kleine Zeilen-Links in der Karte: „Warum?“ nur 15 px hoch

- **Ort:** Einsatzansicht → Karte aufklappen, Warnzeile „Bogen nennt: … passt das zu dieser Lage? Zählt trotzdem mit. Warum?“, 360 × 640, alle Ansichten.
- **Beobachtung:** „Warum?“ ist ein unterstrichener Zeilen-Link von 54 × 15 px (Standard, Dunkel, Nacht) beziehungsweise 57 × 16 px (Feld). Daneben „ändern“ (Eintreffzeit) 44 × 43 und „Hinweise: Zeitraum vorbei“ 168 × 43. Alle übrigen Ziele sind mindestens 44 px.
- **Folge:** Mit Handschuh oder im Gehen trifft der Tipp eher die Zeile darüber oder darunter; der Link erklärt, warum eine Meldung trotz Abweichung zählt, und wird deshalb gerade im Stress gebraucht. Die Aufgabe bleibt machbar.
- **Empfehlung:** „Warum?“ als eigene Zeile oder Knopf in der Zielhöhe der übrigen Karten-Knöpfe, in „Feld“ entsprechend größer.
- **Neu oder alt (Verweis):** neu (Zielgrößen der Knöpfe wurden in R19 behoben; die Zeilen-Links nicht erfasst).
- **Nachprüfung:** Karte aufklappen, `getBoundingClientRect` von „Warum?“: mindestens 44 px hoch.

### R20-L2 (P3, Layout) „Alle Daten löschen“ bei 360 × 640: der sichere Weg liegt zur Hälfte unter der festen Entscheidungsleiste

- **Ort:** Startseite oder Fuß der Einsatzansicht → „Alle Daten löschen“, 360 × 640, alle Ansichten (bei 390 × 844 passt alles).
- **Beobachtung:** Kopfzeile (101 px) und die feste Entscheidungsleiste mit Haken, „Endgültig löschen“ und „Abbrechen“ (224 px) belegen 325 von 606 px des Fensters. „Vorher Sicherung erstellen…“ steht bei y 366 bis 411, die Leiste beginnt bei 386; der Treffer-Test in der Mitte des Knopfes trifft die Leiste, nicht den Knopf. „Was genau gelöscht wird“ liegt vollständig darunter. Im Bild sieht man nur eine abgeschnittene Kante.
- **Folge:** Wer vor dem Löschen noch sichern will, tippt ins Leere oder muss erst im Fenster rollen; ein Rollhinweis fehlt. Gelöscht wird nichts ohne Haken, es entsteht also kein Datenverlust.
- **Empfehlung:** Auf kleinen Bildschirmen die Leiste kompakter halten (Erklärtext einklappen) oder „Vorher Sicherung erstellen…“ oberhalb der Leiste festhalten.
- **Neu oder alt (Verweis):** neu, Folge der Behebung von R16-M2 (Entscheidungsknöpfe fest unten).
- **Nachprüfung:** 360 × 640, „Alle Daten löschen“ öffnen: „Vorher Sicherung erstellen…“ vollständig sichtbar und tippbar, ohne zu rollen.

### R20-L3 (P3, Text) Weitergabe bei vollem Speicher: Zeile „zuletzt erzeugt 07:50“ und Übergabe-Liste „noch nicht“ widersprechen sich

- **Ort:** Einsatzansicht → „Übersicht als CSV“ oder „Excel-Liste (Format „Oldenburg“)“ bei bis zum Quota-Fehler gefülltem `localStorage`, 360 × 640, Nacht.
- **Beobachtung:** Die Datei wird geladen, die Quittung sagt richtig „Vermerk nicht gespeichert (Speicher voll) — die Übergabe-Liste zeigt „noch nicht““. Im selben Bild steht aber unter dem Export-Block „Übersicht als CSV: zuletzt erzeugt 28.10.2026, 07:50 · seitdem keine neuen Bögen“ (bei Excel entsprechend), während die Liste „Übergabe und Abschluss“ „○ Übersicht als CSV: noch nicht“ zeigt. Nach Neuladen steht überall „noch nicht“.
- **Folge:** Wer die Zeile liest, hält den Export für vermerkt und die Übergabe für erledigt; wer die Liste liest, exportiert noch einmal. Beides ist harmlos, aber die Anzeige sagt zwei Dinge.
- **Empfehlung:** Die Zeile „zuletzt erzeugt …“ nur zeigen, wenn der Vermerk gespeichert wurde, sonst „Datei erzeugt, Vermerk nicht gespeichert“.
- **Neu oder alt (Verweis):** neu (Verweis: R19-O2/O4, Speicherfälle).
- **Nachprüfung:** Speicher füllen, CSV erzeugen: Export-Block und Übergabe-Liste nennen denselben Stand.

### R20-L4 (P3, Text) Lagemonitor: „Eingetroffen: THW Karlsruhe …“ neben „Noch keine Einheit gemeldet.“

- **Ort:** Einsatzansicht → „Lagemonitor für den Fernseher“ → „Lagemonitor öffnen“, 360 × 640, Nacht (Sammlung mit sechs Übungsbögen).
- **Beobachtung:** Die Stärkezeile sagt jetzt „6 Übungsmeldungen nicht gezählt“. Darunter steht aber „Eingetroffen: THW Karlsruhe Zugtrupp Technischer Zug gerade eben · + 5 weitere Bewegungen“ und im Block „Einheiten“ „Noch keine Einheit gemeldet.“
- **Folge:** Aus der Entfernung lesen sich beide Zeilen als Widerspruch: eine Einheit ist eingetroffen, aber keine ist gemeldet. Die Hauptaussage (nichts gezählt) ist richtig.
- **Empfehlung:** Übungseinheiten in der „Eingetroffen“-Zeile entweder weglassen oder mit „Übung“ kennzeichnen; „Noch keine Einheit gemeldet“ durch „Keine Einheit in der Lage (6 Übung)“ ersetzen.
- **Neu oder alt (Verweis):** alt, Rest von R19-L1.
- **Nachprüfung:** Einsatz mit ausschließlich Übungsbögen, Lagemonitor öffnen: „Eingetroffen“ und „Einheiten“ sagen dasselbe.

### R20-L5 (P3, Layout) Scanner ohne Kamera in „Feld“: aufgeklappte Handscanner-Hinweise rollen innen, ohne Rollhinweis

- **Ort:** „Bogen scannen…“ ohne Kamera → „Hinweise zum Handscanner“ aufklappen, Ansicht „Feld“, 360 × 640 (ebenso 568 × 320 in „Feld“ und „Nacht“).
- **Beobachtung:** Bei 360 × 640 reicht der aufgeklappte Hinweis bis y 719 (Bild 640), die Leiste „QR aus Bild einlesen…“ / „Fertig“ steht ab y 565; der Text bricht im gestrichelten Rahmen mitten im Satz ab („… Kommen die“). Bei 568 × 320 ist der Rahmen nur rund 240 px hoch, die Überschrift „Hinweise zum Handscanner“ steht am Rand, der Rest liegt außerhalb. Ein Rollbalken oder Hinweis ist nicht zu sehen. In „Nacht“ bei 360 × 640 und in allen Ansichten bei 390 × 844 passt es.
- **Folge:** Der Helfer sieht einen abgeschnittenen Satz und weiß nicht, dass der Rahmen sich rollen lässt; die Hinweise zur Einrichtung des Handscanners bleiben ungelesen. Das Einlesen selbst ist nicht betroffen.
- **Empfehlung:** Hinweis nach dem Aufklappen sichtbar machen (Rahmen wächst, Rollkante oder Schattenverlauf) oder die Hinweise in einem eigenen Fenster zeigen.
- **Neu oder alt (Verweis):** alt – R19-L2 (teilweise behoben; „Feld“ und Querformat bleiben), R19-M5/G9/S10, R18-L2.
- **Nachprüfung:** Ansicht „Feld“, 360 × 640 und 568 × 320, Scanner ohne Kamera, Hinweise aufklappen: Text vollständig lesbar oder Rollbarkeit erkennbar.

## Hinweise (ohne Priorität)

- **H1 Dreifache Aussage bei reinen Übungsbögen.** In der Einsatzansicht sagen „Nichts gezählt: alle 6 eingegangenen Meldungen sind Übung …“, „Neu seit der letzten Kenntnisnahme (6): alle 6 Übung, nicht gezählt.“ und „6 Übungsmeldungen nicht gezählt — anzeigen“ dasselbe; die Einheitenliste beginnt dadurch bei 390 × 844 erst nach etwa 1 200 px (Sprung „Zur Einheitenliste ↓“ vorhanden). Nur bei reinen Übungsbögen; im Einsatz mit echten Bögen entfallen die Kästen.
- **H2 Rücksprung gekürzt.** In der Schnellerfassung steht links oben „‹ Einsatz „Hochwasser …“ mit Auslassung bei 360 px (Text 217 px, Knopf 190 px); lange Einsatznamen sind nicht erkennbar, das Ziel bleibt klar.
- **H3 Tipp-Sperre in „Nacht“.** Das Wort „Einen Moment …“ steht in „Nacht“ etwa 0,6 s auf einer hellbeigen Fläche (217/205/182) von 139 × 58 px mitten in der dunklen Rückfrage; bewusst gesetzt und kurz, in Dunkelheit eine kleine Blendfläche.

## Schluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Lagemonitor und Export-Zeile bei vollem Speicher nennen „eingetroffen“ beziehungsweise „zuletzt erzeugt“, wo die übrige Anzeige „keine Einheit“ beziehungsweise „noch nicht“ sagt (R20-L4, R20-L3).
- **Größtes Einsatzrisiko:** Nicht prüfbar bleibt die echte Wirkung von Sonne und Scheinwerfer; die Messwerte sind Kontrastwerte, keine Helligkeitsmessung.
- **Top-Priorität für die nächste Iteration:** R20-L2 („Vorher Sicherung erstellen…“ nicht unter der Leiste), danach R20-L1 (Zielhöhe „Warum?“).
