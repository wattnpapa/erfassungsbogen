# Audit „Arbeitsablauf", Runde 14 (Einheit → Meldekopf → zweiter Funker → Ablösung)

Prüfer: Rollenaudit `thw-workflow-reviewer` · Datum: 2026-10-26 · Prüfgegenstand:
Web-App, Produktionsbuild (`vite preview`, Port 4173), Stand `main` nach Runde 13
(Commit `429c41a`).

**Zählung: P0 0 · P1 0 · P2 1 · P3 4**

Reiner Prüfbericht, keine Codeänderung. Nicht erneut gemeldet sind die bekannten
Grenzen (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5,
R8-H5/S4), die Reste aus Runde 10 (leere Karten bei „Nur Stärke", Rückgängig für
Meldungen überlebt das Neuladen nicht, Tabellenzeilenhöhe bei 180 × 320), Runde 11
(R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3), Runde 12 (R12-W3, R12-H3,
R12-O2, R12-O4, R12-G3) und Runde 13 (R13-W1 Vergleichsbasis in Dialog und Quittung,
R13-W6 kein Zustand „beendet", R13-H1 keine Knöpfe mit nächsten Typen).

## Prüfaufbau

Playwright (globales Modul `/opt/node22/lib/node_modules/playwright`,
`chromium.launch()` ohne Optionen, nichts installiert), `isMobile`/`hasTouch`,
Locale de-DE, Viewports 390 × 844 (durchgehend) und 360 × 640 (Dialoge der
Aufnahme, Sammel-PDF-Übernahme). Geräteuhr 26.10.2026. Je „Gerät" ein eigener
Browserkontext. Zustände aus den Übungsbögen unter `examples/thw/` (Sinsheim
FGr W (B), Albstadt Zugtrupp, Weinsberg FGr Öl (C), Radolfzell Tr Log-TS) mit
`uebung: false`, Zeitraum heute. Eingang über „Aus Datei laden…", „Bögen
einlesen…" (auch mehrere Dateien zugleich) und über Links („Weitere Formate →
Link teilen", `navigator.share` gestubbt, Host auf `localhost:4173`
umgeschrieben); Schnellerfassung und Stärkeänderung von Hand am Meldekopf;
Sammel-PDF und Lageblatt gespeichert und mit `pdftotext` gelesen; die
Sammel-PDF auf einem zweiten und dritten Gerät über „Einsatz importieren…"
bzw. „Bögen einlesen…" eingelesen. Nicht prüfbar: Kamera-Scan, Nahbereich,
echte Handschuhe, Bildschirmtastatur. Hinweis zur Seed-Zeit: Der `stand` der
ersten Beispieldateien lag künstlich nach dem Eintreffen (Warnzeile „Geräteuhr
prüfen"); das ist ein Artefakt der Vorbereitung und nicht gemeldet.

Erwartete Arbeitsfolge (**Annahme** zum realen THW-Ablauf, nicht bekannt):

1. Einheiten melden sich am Meldekopf per Link, Datei oder Funk; wer nur
   durchgewinkt wird, wird mit der Schnellerfassung (nur Stärke) aufgenommen.
2. Der Meldekopf ordnet Zug und Auftrag zu, korrigiert Zeiten und Stärke, lässt
   abrücken und druckt das Lageblatt für den Stab.
3. Zwei Funker am selben Einsatz führen ihre Sammlungen zusammen; nach einer
   Nachmeldung kommt der volle Bogen einer Einheit, die zuvor durchgewinkt wurde.
4. Schichtwechsel: die Sammlung geht als Datei an die Ablösung; am Einsatzende
   wird gesichert.

## Urteil

Der Ablauf trägt und ist gegenüber Runde 13 stabil. Aufnahme von vier Einheiten
per Link, Zugzuordnung in der Quittung, Auftrag, Zeiten, Abrücken mit Quittung,
Stärke ändern, Folgemeldung mit Gegenüberstellung, Lageblatt (Zahlen auf Papier
und Bildschirm stimmen überein) und Lagemonitor laufen ohne fremde Hilfe. Auch
das Zusammenführen zweier Geräte über die Sammel-PDF funktioniert: neue Einheiten
kommen dazu, ein Abrückvermerk und die neuere Fassung werden übernommen, Nummern
bleiben stabil. Reibung entsteht dort, wo die App über Lücken oder Unstimmigkeiten
Auskunft gibt: ein Lageblatt, das Nichterfasstes als „keine" liest, ein
Widerspruchshinweis mit zwei gleichen Uhrzeiten, eine Warnung „Anderer Einsatz?",
deren Auslöser sich nicht erschließt, und Zahlen, die in Dialog und Quittung
unterschiedlich gezählt werden.

### Behebungen aus Runde 13, geprüft

| Befund | Ergebnis |
| --- | --- |
| R13-W2 Abgerückte nicht „neu" | hält. Nach dem Abrücken verschwindet die Einheit aus „Neu seit der letzten Kenntnisnahme"; beim Import der Sammel-PDF auf einem zweiten Gerät steht nur die tatsächlich neue Einheit (Weinsberg) im Block, Albstadt steht als „ABGERÜCKT" ohne Neu-Marke |
| R13-W3 Zahlen auf der Startseite | hält. „2 Einheiten gemeldet · 0 anwesend" im Schnellzugriff und in der Sammlungskarte |
| R13-W5 Zug bei der Aufnahme | hält. Die Quittung „Zuletzt eingelesen" trägt das Feld „Zug dieser Einheit:", bei mehreren Einheiten ohne Zug „Zug für 2 Einheiten ohne Zug:"; nur Einheiten ohne Zug werden gesetzt; „Zug ändern" belegt das Feld vor |
| R13-W6 Hinweis zum Abschluss | hält als Teilbehebung: „Alle Einheiten sind abgerückt. Zum Abschluss den Einsatz sichern. Jetzt sichern"; ein Zustand „beendet" fehlt weiter (bekannt) |
| R13-S1 bis S3 Schnellerfassung | hält. „In Einsatz übernehmen" auf jedem Schritt, Schritt „Einsatz" entfällt, nach dem Ablegen steht der Zug-Eintrag in der Quittung; kommt der volle Bogen derselben Einheit, fragt die App „Einheit ist bereits gemeldet" |
| R13-A-Reihe Zeiten | hält. Eintreffzeit (auf 06:45 gesetzt), Zug und Auftrag bleiben nach „Stärke ändern…" erhalten |
| R13-W1 Grundfunktion | Sammel-PDF-Import ersetzt keine lokale Arbeit: Zug-, Auftrags- und Zeitangaben bleiben, Folgefassungen werden als „neue Fassung" geführt |
| Sammel-PDF auf zweitem Gerät | hält. „1 neue Einheit. Jetzt 3 Einheiten, davon 2 anwesend. 1 Meldung aktualisiert: Albstadt abgerückt 08:35" |
| Entfernen | hält. Dialog nennt die Folgenummerierung („Nr. 2 rückt auf und heißt danach Nr. 1") und die Grenze von „Rückgängig" |

## Befunde

### R14-W1 [P2] Lageblatt behauptet „keine Unterbringung / keine Ruhezeit" für Einheiten, deren Bedarf nie erfasst wurde

**Fundstelle / Aufgabe:** Meldekopf, Einheit über „Einheit schnell erfassen (nur Stärke)…"
aufnehmen (Sinsheim, 0 / 3 / 8 / 11), daneben eine vollständig gemeldete Einheit
(Albstadt); danach „Lageblatt (A4 quer)"; 390 × 844.

**Beobachtung:** Das Lageblatt führt die Schnell-Einheit mit leerer Bedarfszelle und
0 Fahrzeugen, die Kopfzeile aber lautet: „Bedarf: Verpflegung angefordert 4 (Stärke 15) ·
keine Unterbringung angefordert · keine Ruhezeit · Diesel 80 l · Benzin 0 l". Nur
die Verpflegung trägt den Zusatz „(Stärke 15)"; für Unterbringung und Ruhezeit steht
eine Verneinung, obwohl die Schnellerfassung diese Angaben gar nicht erfragt. In der App
steht in „Details" der Schnell-Einheit „Verpflegung —, Betriebsstoff —, Ruhezeit —"
(also „nicht erfasst"), auf der Karte fehlt jede Marke; die Bedarfszeile der Einsatzansicht
nennt nur bei der Verpflegung die Abweichung zur Stärke.

**Erwartung der Rolle:** Wer elf Personen mit „nur Stärke" durchgewinkt hat, erwartet auf
dem Blatt für den Stab „bei 1 Einheit nicht erfasst" und keine Aussage, dass nichts
gebraucht wird.

**Folge:** Das Papier geht an den Stab und lässt sich dort nicht gegenprüfen. „Keine
Unterbringung angefordert" kann dazu führen, dass für elf Personen nichts geplant wird;
das merkt erst, wer die Einheit später selbst anspricht.

**Empfehlung:** In Kopfzeile und Zeile des Lageblatts „nicht erfasst" ausweisen (z. B.
„Unterbringung: 3 Einheiten gemeldet, 1 ohne Angabe") und auf der Karte eine Marke
„Bedarf nicht erfasst" für Einheiten mit „nur Stärke" zeigen.

**Verifikation:** Schnell-Einheit aufnehmen, Lageblatt drucken: Kopfzeile und Zeile
unterscheiden „keine" von „nicht erfasst"; die Karte trägt die Marke.

### R14-W2 [P3] „Widerspruch zwischen den Geräten" mit zwei gleichen Uhrzeiten

**Fundstelle / Aufgabe:** Zwei Funker führen ihre Sammlungen zusammen: Gerät A hat
Sinsheim, Albstadt; Gerät B hat Sinsheim (neuere Fassung), Weinsberg und rückt Sinsheim ab.
B erzeugt „Einsatz weitergeben / sichern", A liest die PDF über „Bögen einlesen…" ein →
Dialog „Sammel-PDF einer anderen Sammlung" → „Übernehmen ohne Zug-Zuordnung".

**Beobachtung:** Die Quittung nennt: „1 Widerspruch zwischen den Geräten: Sinsheim
Eintreffzeit — hier eingetroffen 08:39, in der Datei eingetroffen 08:39; der Stand dieses
Geräts bleibt. Bitte prüfen (steht auch im Verlauf der Einheit)." Beide Zeiten lauten in
der Anzeige gleich; sie unterscheiden sich offenbar nur in den Sekunden, die nirgends
angezeigt werden.

**Erwartung der Rolle:** Ein Hinweis „Bitte prüfen" nennt einen erkennbaren Unterschied;
bei gleicher Minute ist es kein Widerspruch.

**Folge:** Gering. Der Funker sucht nach einem Unterschied, den es auf dem Schirm nicht gibt,
und lernt, Widerspruchshinweise nicht mehr ernst zu nehmen — auch wenn später ein echter
(z. B. 08:39 gegen 09:12) auftaucht.

**Empfehlung:** Zeiten innerhalb derselben Minute nicht als Widerspruch melden oder die
Sekunden mit anzeigen.

**Verifikation:** Dieselbe Einheit auf zwei Geräten in derselben Minute aufnehmen und
zusammenführen: kein Widerspruchshinweis; bei echtem Unterschied zwei verschiedene Zeiten
im Text.

### R14-W3 [P3] Warnung „⚠ Anderer Einsatz?" erscheint nur in bestimmten Konstellationen, auch bei längst vorhandenen Einheiten

**Fundstelle / Aufgabe:** Meldekopf, Stapel von Dateien über „Bögen einlesen…" bzw.
Zusammenführen über Sammel-PDF.

**Beobachtung:** Dieselben vier Übungsbögen lösen die Warnung unterschiedlich aus. Einzeln
nacheinander oder als Stapel aus Sinsheim, Albstadt, Weinsberg erscheint sie nie. Im Stapel
Sinsheim, Albstadt, Sinsheim (neuere Fassung), Weinsberg tragen Albstadt und Weinsberg die
Marke „⚠ Anderer Einsatz?" und im Block „Neu seit der letzten Kenntnisnahme" den Satz „Bogen
nennt: „Hochwasserlage Albstadt — Führung Technischer Zug", passt das zu dieser Lage?"
(Sinsheim nicht). Nach dem Übernehmen der Sammel-PDF von Gerät B erhält auf Gerät A auch die
Einheit Albstadt die Warnung, die dort schon vorher ohne Warnung aufgenommen war. Der
Auslöser ist von außen nicht erkennbar (reproduziert in vier Läufen; vermutet wird ein
Vergleich der Auftragstexte, sobald eine Einheit doppelt vorkommt — nicht belegt). Der
Sammlungsname „Hochwasser Weser" enthält keinen der genannten Orte; jede Einheit trägt in
„Ort / Auftrag" ihren eigenen Text.

**Erwartung der Rolle:** Eine Warnung, dass ein Bogen nicht zur Lage passt, ist verlässlich
und erscheint beim ersten Eingang — oder gar nicht.

**Folge:** Gering. Alarm bei richtigen Einheiten, keiner bei einer wirklich fremden; der Funker
ignoriert die Marke oder klärt Einheiten, die nichts zu klären haben.

**Empfehlung:** Die Regel erklären („Ort/Auftrag weicht vom Namen der Sammlung ab") und
unabhängig von Reihenfolge, Stapelgröße und Zusammenführen anwenden; Einheiten mit eigenem
Auftragstext nicht allein deshalb markieren.

**Verifikation:** Dieselbe Einheit einzeln, im Stapel und nach Sammel-PDF-Import aufnehmen:
gleiche Marke oder keine; die Marke nennt den Vergleichswert.

### R14-W4 [P3] „Stärke ändern…": Dialog verspricht „Namen bleiben", Details zeigen 8 gegen 11 Namen, Folgemeldung sagt „nicht erfasst"

**Fundstelle / Aufgabe:** Meldekopf, Karte → „Mehr…" → „Stärke ändern…" (Sinsheim 0 / 3 / 8 / 11,
Mannschaft auf 5), danach „Details".

**Beobachtung:** Der Dialog sagt „Fahrzeuge, Bedarf, Namen, Zug und Auftrag bleiben; die
bisherige Meldung wandert in die Historie." Danach zeigt „Details" die Überschrift
„Personal (0 / 3 / 5 / 8)" über unveränderten 11 Namen, darunter „Geschlecht: 4 männl. /
4 weibl. / 0 div." (zusammen 8). Die Folgemeldungszeile (Karte, „Neu seit …", Quittung) lautet
„Stärke 11 → 8 (−3) · Fahrzeuge, Personal und Sofortbedarf nicht erfasst", während dieselbe
Karte weiter „Diesel 130 l" und „Unterbringung angefordert" zeigt und die Lage damit rechnet
(Verpflegung 8, Unterbringung 8 Personen, Diesel 130 l). „Nicht erfasst" widerspricht also
dem Dialog („bleiben") und der Karte.

**Erwartung der Rolle:** Entweder die Namensliste entspricht der neuen Stärke, oder die
Details sagen ausdrücklich „Namensliste stammt aus der Meldung von 08:11 (11 Namen)".

**Folge:** Gering. Wer „Details" oder „Bogen als PDF" an den Stab weitergibt, hat acht
gemeldete Personen über elf Namen; wer „nicht erfasst" liest, hält Diesel und Unterbringung
für verloren.

**Empfehlung:** In „Details" einen Satz „Namensliste von … (11), Stärke von Hand auf 8
geändert" ausgeben und die Folgemeldungszeile an den Dialog angleichen („übernommen von der
Meldung vom …").

**Verifikation:** Stärke ändern, „Details" öffnen: Überschrift und Hinweis erklären den
Unterschied; die Folgemeldungszeile nennt Bedarf und Fahrzeuge als „übernommen".

### R14-W5 [P3] Nach durchgewinkter Einheit: Dialog nennt „9 weitere", die Quittung „20 weitere Änderungen" und lässt das Personal weg

**Fundstelle / Aufgabe:** Meldekopf, Einheit per Schnellerfassung (nur Stärke) aufgenommen,
später kommt der volle Bogen derselben Einheit per Link → „Einheit ist bereits gemeldet" →
„Als neue Fassung anhängen"; 390 × 844.

**Beobachtung:** Der Dialog nennt „Geändert: Personal: 11 neu · Fahrzeuge: 3 dazu ·
Verpflegung — → 11 Personen · Diesel — → 130 l · 9 weitere". Die Quittung für dieselbe Aktion
lautet „Folgemeldung: 3 Fahrzeuge dazu · Verpflegung — → 11 Personen · Diesel — → 130 l ·
20 weitere Änderungen". Das Personal (11 Namen, die wichtigste Änderung) steht in der Quittung
nicht mehr, sondern steckt in der Zahl 20 (9 + 11); die Karte trägt „Bemerkung neu · Folgem.
08:16", „Änderungen" nennt die Einzelheiten.

**Erwartung der Rolle:** Dialog und Quittung zählen gleich und nennen das Größte zuerst.

**Folge:** Gering. Wer die Zahl „20" liest, kann sie nicht mit dem „9" aus der Frage
vergleichen; das Personal wird erst in der Historie sichtbar.

**Empfehlung:** In der Quittung dieselbe Aufzählung wie im Dialog verwenden („Personal: 11
neu · …").

**Verifikation:** Schnell-Einheit durch den vollen Bogen ersetzen: Dialog und Quittung nennen
dieselbe Zahl „weitere" und dasselbe erste Element.

## Ergebnis

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Anderer Einsatz?" an Einheiten, die zur Lage gehören, bei
  anderen nicht (R14-W3).
- **Größtes Einsatzrisiko:** Das Lageblatt liest „nicht erfasst" als „keine Unterbringung,
  keine Ruhezeit" (R14-W1).
- **Top-Priorität für die nächste Iteration:** R14-W1 (Schnell-Einheiten im Lageblatt als
  „nicht erfasst" ausweisen).
