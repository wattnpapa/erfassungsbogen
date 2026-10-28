# Audit „Fehler und Wiederanlauf", Runde 18 (Bedienfehler provozieren, selbst korrigieren)

- **Prüfer:** Rollenaudit `thw-error-recovery-reviewer`
- **Datum:** 2026-10-27
- **Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 6 (davon 4 neu, 2 alt mit Verweis)
- **Gegenstand:** Web-App im Produktionsbuild auf `http://localhost:4173`, Code-Stand Commit `ae3a8e9` (`main`). Reiner Prüfbericht, keine Codeänderung.
- **Maßstab:** Es gibt keine „bekannten Grenzen" zum Auslassen; auch Punkte aus `runde-17` bis `runde-11`, die als „teilweise", „offen" oder „nicht reproduzierbar" standen, werden gemeldet, wenn sie im Browser noch zu sehen sind. Vorab gelesen: `docs/audits/README.md`, „Stand der Behebung" in `runde-17/README.md`, `runde-17/fehler-und-wiederanlauf.md`.

## Prüfaufbau

Playwright (globales Modul `/opt/node22/lib/node_modules/playwright`, `chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE, Dichte 2. Viewports 390 x 844 (Hauptlauf) und 360 x 640 (Startseite, Assistent Schritt 1 bis 6 auf seitlichen Überlauf und Fußleiste, Sammlung). Beispielbögen aus `examples/thw/` als Kopien mit `uebung: false`, aktuellem Stand und heutigem Zeitraum, über „Bögen einlesen…" aufgenommen (sechs Bögen; zusätzlich defekte Datei, älterer Stand, Doppeltes, Original-Beispielbögen als Übung). Nichts installiert, kein Prozess mit `pkill` beendet.

Geprüft: Startseite, Assistent (Ort mit Mehrdeutigkeit, Telefon/E-Mail-Fehleingaben, Doppeltipp auf „Weiter", Neuladen mit „Fortsetzen", Browser-Zurück schrittweise, Zeitraum vertauscht, doppeltes Kennzeichen, Fahrzeug entfernen, Sofortbedarf mit 9999 / „-3" / „abc" / „1,5" / 9000, Übersicht, „Bogen übergeben…", „Bogen schließen"), „Namen einfügen…", Sammlung (anlegen mit Doppeltipp, Einlesen, Abrücken mit Doppeltipp, Meldung entfernen mit Doppeltipp auf die Bestätigung, Neuladen, Papierkorb, Zurückholen, Tabelle bei 390 und 360 px, Zurück-Geste, Stärke ändern mit Zahlendreher, Auftrag/Notiz, Weitergabe-Datei und Nachtrag-Zeilen, „Anderer Einsatz?"), Handscanner-Fenster ohne Kamera.

Nicht geprüft: echte Kamera, echte Bildschirmtastatur, native Builds, Nahbereich, Lageblatt-/Sammel-PDF-Inhalt.

## Urteil aus Sicht der Rolle

Die Fehlerabsicherung trägt: Zahlendreher werden vor der Wirkung erkannt („Gesamt 4 → 24: mehr als das Dreifache"), Zeiträume und Kennzeichen werden gewarnt, jede zerstörende Handlung fragt mit Folgen, Neuladen und Browser-Zurück kosten keine Eingaben, und jede Korrektur gelang ohne fremde Hilfe. Datenverlust fand ich nicht. Übrig sind sechs Randpunkte (alle P3); der auffälligste ist, dass Tipps kurz nach dem Öffnen oder Schließen eines Dialogs ohne jede Rückmeldung wirkungslos bleiben.

### Behebungen der Runde 17, im echten Browser geprüft und gehalten (nicht als Befund)

- Doppeltipp: „Weiter" geht genau einen Schritt, „Einsatz anlegen" legt einen Einsatz an, „Abrücken" rückt einmal ab, „Meldung entfernen" entfernt genau eine Meldung.
- Neuladen: Entwurf mit „Fortsetzen / Verwerfen", aufgeklappte Karte bleibt offen (R17-E5), Bildlaufstelle bleibt; Browser-Zurück geht im Assistenten schrittweise zurück, aus der Sammlung zur Startseite.
- Papierkorb entfernter Meldungen: nach Neuladen „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar" mit „Zurückholen" (R17-E2 in der Sache behoben; Auffindbarkeit siehe R18-E3).
- Abgerückte Einheiten stehen unter „Abgerückt (1)" hinter den Anwesenden (R17-E6).
- Nachtrag: Zeilen „Die Weitergabe … zählt nicht als Lieferung an den Stab" (R17-E3).
- „Namen einfügen…": Reihenfolge-Wahl und „Reihenfolge prüfen" je Zeile (R17-E1). Handscanner-Echo gibt „hallo welt" unverändert wieder (R17-E7).
- Tabelle am Telefon: kein seitlicher Überlauf bei 390 und 360 px; Fußleiste im Assistenten 44-px-Knöpfe, kein Überlauf in Schritt 1 bis 6 bei 360 px.

## Befunde

### R18-E1 (P3) Tipps kurz nach dem Öffnen oder Schließen eines Dialogs werden ohne Rückmeldung verschluckt

- **Neu oder alt (Verweis):** neu (Nebenwirkung der Doppeltipp-Sperre aus Runde 17; verwandt mit R17 „Doppeltipp-Sperre … kein Befund").
- **Ort:** Assistent Schritt 4 „Fahrzeug entfernen" → Rückfrage; Übersicht „Bogen schließen" nach Schließen der Übergabe-Rückfrage; Sammlung „Meldung entfernen", 390 x 844.
- **Beobachtung:** Messreihe mit „Fahrzeug entfernen": Bestätigung 0,3 s und 0,7 s nach Erscheinen der Rückfrage getippt, Dialog bleibt offen, nichts passiert; ab 1,0 s wirkt der Tipp. Ebenso öffnete „Bogen schließen" 0,5 s nach Escape auf der Übergabe-Rückfrage keinen Dialog, nach 2,5 s sofort. Es gibt weder Wackeln, Hinweis noch Ton.
- **Folge:** Wer die Rückfrage schon kennt (Handschuh, Eile) tippt zweimal oder zweifelt, ob der Knopf funktioniert; die Wirkung hängt von der Tippgeschwindigkeit ab.
- **Empfehlung:** Die Sperre nur für wirkliche Doppeltipps auf denselben Knopf einsetzen, nicht für das erste Tippen nach dem Öffnen; sonst den gesperrten Knopf sichtbar abdunkeln.

### R18-E2 (P3) „⚠ Anderer Einsatz?" steht auf jeder Karte und lässt sich nicht quittieren

- **Neu oder alt (Verweis):** alt, wie R17-E4 / R14-W3, weiter offen.
- **Ort:** Sammlung mit Ort „Oldenburg", vier Original-Beispielbögen eingelesen, Einheitenliste, 390 x 844.
- **Beobachtung:** Alle vier Karten tragen „⚠ Anderer Einsatz?"; die aufgeklappte Karte nennt nur die Warnung und „Zeitraum vorbei", es gibt keinen Knopf „Passt so / Gehört zu dieser Lage" (Knopfliste der Karte: Details, Bogen als PDF, Abrücken, Zug zuordnen, Auftrag/Notiz, Mehr…).
- **Folge:** Eine Warnung, die auf jeder Karte steht und nicht wegzubekommen ist, wird nicht mehr gelesen; der eine echte Fehlgriff (Bogen aus anderem Einsatz) geht darin unter.
- **Empfehlung:** Je Karte eine Entscheidung „Gehört zu dieser Lage" zulassen, die die Marke auf Karte und Lageblatt entfernt.

### R18-E3 (P3) Papierkorb für entfernte Meldungen: Fundort liegt am Seitenende und wird nirgends genau genannt

- **Neu oder alt (Verweis):** neu (verwandt mit R17-E2, das die Rückholbarkeit betraf).
- **Ort:** Sammlung nach „Meldung entfernen" und Neuladen; Startseite, 390 x 844.
- **Beobachtung:** Die Rückfrage sagt „danach liegt die Meldung 7 Tage unter „Zuletzt entfernte Meldungen"". Nach Neuladen steht dieser eingeklappte Abschnitt erst unterhalb der letzten Karte, vor „Einsatz weitergeben / sichern"; bei 30 Karten ist das ein langer Bildlauf. Auf der Startseite ist der Papierkorb für Meldungen nicht zu sehen (nur Einsätze), und ein Link von der Meldungs-Kopfzeile fehlt.
- **Folge:** Wer nach dem Neuladen die entfernte Meldung sucht, hält sie für verloren.
- **Empfehlung:** In der Kopfzeile der Einheitenliste einen Verweis „1 entfernte Meldung — zurückholen" zeigen, der zum Abschnitt springt.

### R18-E4 (P3) Papierkorb: „Zurückholen" und „Endgültig löschen…" berühren sich

- **Neu oder alt (Verweis):** neu.
- **Ort:** Sammlung → „Zuletzt entfernte Meldungen", 390 x 844.
- **Beobachtung:** „Zurückholen" (Höhe 44 px) fließt hinter dem Text und endet auf derselben Linie, auf der „Endgültig löschen…" (rot, 44 px) beginnt; Abstand rund 1 px, beide ähnlich breit.
- **Folge:** Mit Handschuh trifft der Daumen leicht den falschen der beiden Knöpfe; der Fehltreffer öffnet zwar nur eine Rückfrage („…"), kostet aber Aufmerksamkeit bei einer Rückholung.
- **Empfehlung:** Die Knöpfe nebeneinander mit Abstand oder die destruktive Handlung klar abgesetzt (rechtsbündig) setzen, wie bei „Verschieben… / Entfernen" auf der Karte.

### R18-E5 (P3) Tabellenansicht am Telefon: Zeilen sind nicht bedienbar

- **Neu oder alt (Verweis):** neu.
- **Ort:** Sammlung → „Tabelle", 390 x 844 und 360 x 640.
- **Beobachtung:** Ein Tipp auf eine Tabellenzeile bewirkt nichts; es gibt weder Aufklappen noch Abrücken oder Details. Vier Kernspalten (Einheit, Ges., Meldung vor, Bedarf) sind lesbar, Überlauf keiner.
- **Folge:** Wer in der Tabelle eine Einheit findet und handeln will, muss zurück zu „Karten" und die Einheit dort erneut suchen.
- **Empfehlung:** Zeile antippbar machen (springt zur aufgeklappten Karte) oder einen Hinweis „Zum Bearbeiten: Karten" zeigen.

### R18-E6 (P3) Telefonfeld: Hinweis „entfernt" gibt die Eingabe verfälscht wieder

- **Neu oder alt (Verweis):** neu (gleiche Art wie R17-E7, das im Scanner-Fenster behoben ist).
- **Ort:** Assistent Schritt 1, Feld „Telefon", 390 x 844.
- **Beobachtung:** Eingabe `abc 12x` ergibt „Nur Ziffern übernommen („abcx" entfernt)" und im Feld „12". Leerzeichen entfallen, die entfernten Zeichen werden zusammengezogen.
- **Folge:** Gering: Der Hinweis nennt nicht, was getippt wurde; bei Rufnummern mit Zusätzen („App 12") wirkt „abcx" fremd.
- **Empfehlung:** Die entfernten Zeichen unverändert und in Reihenfolge nennen („abc", „x") oder die ursprüngliche Eingabe zeigen.

## Kein Befund (geprüft, trägt)

- Zeitraum „bis vor von" meldet sofort „⚠ Einsatzzeitraum: „bis" liegt vor „von"".
- Doppeltes Kennzeichen „thw 84397" / „THW-84397" wird als „steht mehrfach" erkannt.
- Sofortbedarf: „-3" („Minus geht nicht … Es gilt weiter 9999"), „abc" („keine Zahl"), „1,5" („auf ganze Liter gerundet: 2"), Verpflegung 9000 für 9 Personen erscheint als offener Punkt in der Übersicht.
- „Bogen übergeben…" nennt „7 offene Punkte — Übergeben ist trotzdem möglich"; „Bogen schließen" erklärt „geschlossen, nicht gelöscht".

## Abschluss

- **Aufgabe geschafft:** ja (Bogen erfassen, Fehler machen, korrigieren, übergeben; Sammlung führen, Einheiten abrücken, entfernen, zurückholen, Stärke ändern) — ohne Umwege.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Ein Knopf, der kurz nach dem Dialog „nicht reagiert", wirkt defekt (R18-E1).
- **Größtes Einsatzrisiko:** Eine dauerhaft angezeigte „Anderer Einsatz?"-Warnung stumpft ab (R18-E2).
- **Top-Priorität für die nächste Iteration:** Die Tippsperre nach Dialog-Wechsel aufheben oder sichtbar machen (R18-E1).
