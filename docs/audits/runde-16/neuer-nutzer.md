# Rollenaudit Neuer Nutzer, Runde 16

- **Prüfer:** Rolle „Helfer ohne Einweisung" (Skill `thw-new-user-reviewer`)
- **Datum:** 2026-10-26
- **Gegenstand:** Web-App Erfassungsbogen, Produktionsbuild (`vite preview`, Port 4173), Code-Stand Commit 36d549a (`main` nach Runde 15)
- **Prüfaufbau:** Playwright mit Chromium (globales Modul), `isMobile`/`hasTouch`, Locale de-DE, Viewports 390x844 und 360x640 (Vollbild-QR zusätzlich 320x568 und 412x915). Keine Kamera. Für die Sammlung wurden Übungsbögen aus `examples/thw/` (mit `uebung: false` bzw. unverändert) über „Bögen einlesen…" aufgenommen. Es wurde kein Code geändert.
- **Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 4

## Urteil aus Sicht der Rolle

Der Einstieg trägt: Die Startseite trennt „Meinen Bogen ausfüllen" und „Bögen sammeln (Meldekopf)" verständlich, der Assistent führt in sechs Schritten ohne Sackgasse bis zur Gesamtübersicht, und die Übergabe (QR im Vollbild, PDF, Link) ist ohne Anleitung auffindbar. Fehlbedienungen werden fast durchweg freundlich aufgefangen: Fremde oder falsche Dateien werden bei allen drei Einlesewegen mit einem Satz und dem richtigen Rückweg abgewiesen, „Bogen schließen" sagt, dass nichts gelöscht wird, „Alle Daten löschen" zählt auf, was betroffen ist. Die vier neuen Befunde sind Wortwahl und Darstellung, keiner behindert eine Aufgabe. Die Aufgaben „eigenen Bogen erfassen und übergeben" und „Einsatz-Sammlung anlegen, Bögen aufnehmen, Einheit abrücken, Sammel-PDF erzeugen" sind ohne fremde Hilfe machbar.

## Bestätigte Behebungen aus Runde 15 (im echten Browser)

- R15-N1: Fahrzeuge aus der Vorbelegung starten bei „Ausstattung nach StAN" auf „— k. A.". Die Gesamtübersicht zeigt „—".
- R15-N2: Tabellen in der Übersicht tragen „Zum Weiterlesen seitlich wischen →", die Spalte heißt „Ausstattung (StAN)".
- R15-N3: Der Rückknopf der Gesamtübersicht nennt den Schritt („← Zurück zu Schritt 5 (Sofortbedarf)").
- R15-S2: Bei sechs und mehr neuen Einheiten erscheint die Kurzfassung mit „Zur Liste springen ↓" und „Alle 6 einzeln anzeigen".
- R15-W2: Die Tabelle trennt „Unterbr. M/W/D" und „WC M/W/D".
- R15-A5: „Bogen als PDF" quittiert mit „✓ Bogen als PDF erzeugt (neuer Tab oder Download-Ordner)"; die Sammel-PDF quittiert mit „✓ Einsatz … als PDF erzeugt …" und lädt `eeb-einsatz-…pdf` herunter.
- Das „Weiter" des Assistenten nimmt Tipps im Abstand unter etwa 1,2 s nicht an (Nachlauf aus R14-G1); bei 900 ms bis 1,4 s zwischen den Tipps lief jeder Schritt durch. Kein Befund.

## Befunde

### R16-N1 (P3) – Tabelle der Sammlung: Spalte „Meldung vor" zeigt „⚠ Stand 101 Tagen"

- **Fundstelle / Aufgabe:** Einsatz-Sammlung, Ansicht „Tabelle", Spalte „MELDUNG VOR", bei Bögen, deren Stand mehr als eine Stunde vor dem Eingang liegt (Übungsbögen, 390x844).
- **Beobachtung:** Der Spaltenkopf lautet „Meldung vor", die Zelle „⚠ Stand 101 Tagen" (DOM-Text der Zelle ebenfalls „⚠ Stand 101 Tagen", gemessen). Die Karte derselben Einheit schreibt richtig „⚠ Stand vor 101 Tagen". In der Tabelle fehlt das „vor", weil der Kopf es liefert; zusammen liest sich das als „Meldung vor | Stand 101 Tagen". Zusätzlich steht die Zahl in der Zelle im Dativ ohne Präposition.
- **Erwartung der Rolle:** Eine Zelle, die für sich lesbar ist („vor 101 Tagen"), oder ein Kopf, der zum Zelltext passt („Alter der Angaben").
- **Auswirkung im Einsatz:** Gering. Wer die Tabelle am Meldekopf überfliegt, muss „Stand" und „Meldung" gegeneinander auflösen und weiß nicht sicher, ob 101 Tage der Stand oder die Meldung betreffen. Die Warnmarke „⚠" trägt die Dringlichkeit trotzdem.
- **Empfehlung:** Zelle wie in der Karte („Stand vor 101 Tagen") oder Spaltenkopf „Alter der Angaben" mit Zellen „⚠ vor 101 Tagen (Stand)".
- **Verifikation:** Übungsbögen mit Stand älter als eine Stunde vor dem Eingang einlesen, Tabelle öffnen, Zelle und Karte vergleichen.

### R16-N2 (P3) – Startseite: derselbe Einsatz steht zweimal untereinander, mit derselben Statuszeile

- **Fundstelle / Aufgabe:** Startseite, sobald eine Einsatz-Sammlung existiert (390x844): unter „Bögen sammeln (Meldekopf)" der große Knopf „„Hochwasser Elbe" öffnen", weiter unten unter „Einsatz-Sammlung (Meldekopf)" die Karte „Hochwasser Elbe" mit „Öffnen" und „Löschen…".
- **Beobachtung:** Beide Blöcke tragen dieselbe lange Zeile („Letzte Meldung 26.10.2026, 15:41 (gerade eben) · ⚠ älteste Meldung vor 101 Tagen, 3 von 3 älter als 1 Std · 3 neu seit der letzten Kenntnisnahme"), aber unterschiedliche Zählwörter („3 Einheiten" gegenüber „3 Einheit(en) anwesend · Stärke 1 / 6 / 20 / 27"). Der zweite Block hat eine eigene Überschrift mit demselben Wort „Meldekopf" wie der erste.
- **Erwartung der Rolle:** Ein Einsatz, ein Eintrag. Wer zwei gleich benannte Einträge mit leicht verschiedenen Zahlen sieht, vermutet zwei Einsätze oder zwei Stände.
- **Auswirkung im Einsatz:** Gering bis mittel. Der Helfer zögert, welcher Eintrag der „richtige" ist, und liest die doppelte, lange Statuszeile zweimal. „Löschen…" liegt nur im zweiten Block; wer dort ist, kann den Einsatz versehentlich als Ersten von zwei Einträgen für ein Duplikat halten und löschen (die Rückfrage und der Papierkorb fangen das ab, nicht geprüft in dieser Runde).
- **Empfehlung:** Die Schnelleinstieg-Zeile oben und die Liste unten klar verschieden benennen (z. B. „Zuletzt geöffnet: …" gegenüber „Alle Einsätze"), die Statuszeile nur einmal ausführlich zeigen und die Zählwörter angleichen.
- **Verifikation:** Eine Sammlung anlegen, Bögen aufnehmen, Startseite öffnen; die Einträge sollen sich in Aufgabe und Wortwahl erkennbar unterscheiden.

### R16-N3 (P3) – „Namen einfügen…" spricht „Sie", die übrige App „du"

- **Fundstelle / Aufgabe:** Schritt 3 „Personal" → „Namen einfügen…", sobald Text im Feld steht: „Die Liste bleibt stehen, auch wenn Sie das Fenster schließen — bis Sie sie übernehmen oder leeren." (`src/app/schritte/personal.tsx`, Zeile 1633).
- **Beobachtung:** Es ist die einzige Stelle der Oberfläche mit der Anrede „Sie"; Startseite, Assistent, Rückfragen und Anleitung duzen („deine Einheit", „dein Bogen", „Einen neuen Bogen beginnst du"). Seit Runde 9 als Randbemerkung vermerkt (R9, Abschnitt „Verweise") und in Runde 10 zitiert, nie gezählt und nicht behoben.
- **Erwartung der Rolle:** Durchgängig dieselbe Anrede; der Wechsel mitten im Dialog wirkt wie ein fremder Text.
- **Auswirkung im Einsatz:** Gering; kein Verständnisproblem, aber ein Bruch, der den Dialog wie ein eingefügtes Fremdstück aussehen lässt.
- **Empfehlung:** „… auch wenn du das Fenster schließt — bis du sie übernimmst oder leerst."
- **Verifikation:** Dialog öffnen, eine Zeile eintippen, Text prüfen; Suche nach „Sie " in den Dialogtexten.

### R16-N4 (P3) – Vollbild-QR: Zeitangabe „Stand 15:42" bricht vor „Uhr" um

- **Fundstelle / Aufgabe:** Gesamtübersicht → „Bogen übergeben…" → „QR-Code im Vollbild zeigen", Kopfzeile über dem Code.
- **Beobachtung:** Bei 390x844 und bei 360x640 steht „Uhr" allein in einer eigenen, kleinen Zeile unter „· Stand 15:32"; bei 360x640 steht zusätzlich „Soll" allein in der Warnzeile „⚠ 9 Plätze ohne Namen — Stärke nach / Soll". Bei 320x568 und 412x915 wurde nur der Text der Zeile gelesen, der Umbruch nicht im Bild geprüft.
- **Erwartung der Rolle:** Uhrzeit und „Uhr" zusammen, ein Satz in der Warnzeile ohne Einzelwort.
- **Auswirkung im Einsatz:** Gering. Die Zeile wird beim Hochhalten des Telefons zum Scannen von der Gegenstelle gelesen; ein einzelnes „Uhr" in grauer Kleinschrift wirkt wie Rest, nicht wie Teil des Stands.
- **Empfehlung:** Uhrzeit und „Uhr" unteilbar halten (geschütztes Leerzeichen), die Warnzeile so setzen, dass kein Einzelwort stehen bleibt.
- **Verifikation:** Vollbild-QR bei 390x844 und 360x640 öffnen, Umbruch der Kopfzeile ansehen.

## Nicht neu gemeldet, aber beim Prüfen gesehen

- Schwebende Leiste „Ansicht: Standard" unten links verdeckt auf der Sammlungsseite die letzte Zeile der Karte unter dem Daumen (bekannte Ansichtswahl, Runde 15 M3).
- Eingabefelder „Zug" und „Auftrag/Notiz" in der aufgeklappten Karte tragen nur Platzhalter und ein „aria-label", kein sichtbares Etikett; der Knopf, der sie öffnet, steht direkt darüber. Beobachtung ohne Folge für die Aufgabe, deshalb nicht gezählt.
- Die Übungsbögen sind in der Sammlung älter als 90 Tage und werden anonymisiert; das ist ein Zustand der Beispieldaten, kein Befund.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Der Einsatz scheint auf der Startseite zweimal zu existieren, weil Schnelleinstieg und Liste dieselbe Sammlung getrennt und mit leicht anderen Zahlwörtern zeigen (R16-N2).
- **Größtes Einsatzrisiko:** Keines neu; die Befunde betreffen Wortwahl und Darstellung. Das verbleibende Restrisiko liegt in den bekannten Grenzen aus den Vorrunden.
- **Top-Priorität für die nächste Iteration:** R16-N2, die doppelte Darstellung des Einsatzes auf der Startseite auflösen.
