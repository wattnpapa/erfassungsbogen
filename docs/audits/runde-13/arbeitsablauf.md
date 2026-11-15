# Audit „Arbeitsablauf", Runde 13 (Einheit → Meldekopf → Ablösung)

Prüfer: Rollenaudit `thw-workflow-reviewer` · Datum: 2026-10-26 · Prüfgegenstand:
Web-App, Produktionsbuild (`vite preview`, Port 4173), Stand `main` nach Runde 12
(Commit `7637e61`).

**Zählung: P0 0 · P1 0 · P2 1 · P3 5**

Reiner Prüfbericht, keine Codeänderung. Nicht erneut gemeldet sind die bekannten
Grenzen (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5,
R8-H5/S4), die Reste aus Runde 10 (leere Karten bei „Nur Stärke", Rückgängig für
Meldungen überlebt das Neuladen nicht, Tabellenzeilenhöhe bei 180 × 320), Runde 11
(R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3) und Runde 12 (R12-W3 keine
Bestätigung der Übergabe, R12-H3, R12-O2, R12-O4, R12-G3).

## Prüfaufbau

Playwright (globales Modul `/opt/node22/lib/node_modules/playwright`,
`chromium.launch()` ohne Optionen, nichts installiert), `isMobile`/`hasTouch`,
Locale de-DE, Viewports 390 × 844 und 360 × 640, je Gerät ein eigener Kontext.
Geräteuhr 26.10.2026. Zustände über `localStorage`-Seed des Entwurfs
(`eeb.entwurf.v1`) aus den Übungsbögen unter `examples/thw/` (Sinsheim FGr W (B),
Albstadt Zugtrupp) mit `uebung: false`, Zeitraum und `stand` auf heute. Der Link-Weg
ersetzt den QR-Transport (`navigator.share` gestubbt, Host auf `localhost:4173`
umgeschrieben); Folgemeldung durch einen zweiten Link mit einer Person weniger und
Diesel 60 l. Sammel-PDF, Lageblatt und CSV wurden gespeichert, mit `pdftotext`
gelesen und auf einem dritten Gerät über „Einsatz importieren…" eingelesen. Nicht
prüfbar: Kamera-Scan, Nahbereich, echte Handschuhe, Bildschirmtastatur.

Erwartete Arbeitsfolge (**Annahme** zum realen THW-Ablauf, nicht bekannt):

1. Die Einheit übergibt ihren Bogen per Link, QR oder PDF.
2. Der Meldekopf nimmt auf, ordnet Zug und Auftrag zu, lässt abrücken, teilt bei
   Bedarf eine Einheit auf, druckt das Lageblatt.
3. Nach einer Änderung folgt eine Nachmeldung der Einheit, die der Meldekopf einordnet.
4. Schichtwechsel: die Sammlung geht als Datei an die Ablösung; am Einsatzende wird
   sie gesichert.

## Urteil

Der Ablauf trägt und ist gegenüber Runde 12 stabil: Aufnahme, Folgemeldung mit
Gegenüberstellung, Abrücken mit Zeitprüfung („Stimmt die Zeit?"), Lageblatt, CSV und
die Übergabe an das dritte Gerät laufen ohne fremde Hilfe. Auftrag, Zug, Zeiten,
Abrückstatus, Funkrufname und Einsatzbeginn des Lagemonitors kommen beim Import
vollständig an. Reibung entsteht dort, wo zwei Meldekopf-Handlungen zusammentreffen
(Aufteilen und spätere Folgemeldung) und bei Kennzeichnungen, die nach dem Abrücken
nicht mehr zusammenpassen.

### Behebungen aus Runde 12, geprüft

| Befund | Ergebnis |
| --- | --- |
| R12-W1 Rückruf antippbar | hält. In „Details" 6 `tel:`/`mailto:`-Verknüpfungen der Ebenen plus „Mobil" der Person, je 44 px hoch |
| R12-W2 Vegetarier bei 0 Portionen | hält für die Warnung (keine Hinweiszeile, kein Chip, Lageblatt „angefordert 0 Portionen, Stärke 11 (7 Fleisch / 3 vegetarisch / 1 vegan)"); Rest siehe R13-W4 |
| R12-W3 Kopfzeile „Weitergegeben" | hält als Teilbehebung: „Weitergabe-Datei erzeugt 26.10.2026, 05:30 — Empfang nicht bestätigt, seitdem hier nichts Neues."; nach lokaler Änderung „seitdem hier 1 Änderung (Auftrag)" |
| R12-W4 Nachmeldung nach Abrücken, 360 × 640 | hält. „⚠ Die Einheit war abgerückt – mit der neuen Fassung zählt sie wieder mit." steht als erste Zeile unter der Überschrift, vor „Bisher / Neu / Geändert"; Rollbereich 394 von 523 px |
| R12-E-Reihe, Abrückzeit | hält. Abgerückt 01:00 bei Eintreffen 05:37 fragt „Stimmt die Zeit?" mit „Zeit korrigieren" |
| Eintreffzeit bei Folgemeldung | hält. Auf 02:00 gesetzt, nach „Als neue Fassung anhängen" weiter 02:00; Auftrag und Zug bleiben erhalten |
| Import eines älteren eigenen Sammel-PDF | hält. Lokal nachgetragener Auftrag bleibt, Meldung „keine neue Einheit" |

## Befunde

### R13-W1 [P2] Folgemeldung nach „Aufteilen" zählt die abgeteilten Personen doppelt

**Fundstelle / Aufgabe:** Meldekopf, Karte → „Mehr…" → „Aufteilen…", danach Folgemeldung
derselben Einheit per Link → „Einheit ist bereits gemeldet" → „Als neue Fassung anhängen";
390 × 844.

**Beobachtung:** Sinsheim (11 Personen) aufgeteilt: Scherer und Heinrich als „Trupp Fähre"
(Nr. 2, 0 / 2 / 0 / 2, bleibt im Einsatz); Nr. 1 danach 0 / 1 / 8 / 9, Summe 11. Trifft
jetzt die Folgemeldung der Einheit ein (10 Personen, enthält Scherer und Heinrich),
nennt der Dialog nichts von dem abgeteilten Trupp. Er rechnet gegen die aktuelle Fassung:
„Geändert: Stärke 9 → 10 · Personal: 1 getauscht, 1 neu". Nach „Als neue Fassung anhängen"
stehen Nr. 1 mit 0 / 3 / 7 / 10 und Nr. 2 mit 0 / 2 / 0 / 2 nebeneinander: „jetzt 2 Einheiten,
Gesamt 12", Kopfzeile „Verpflegung angefordert 13 (Stärke 12) · Unterbringung 12 Personen".
Die Quittung und die Karte rechnen dagegen gegen die Fassung vor der Aufteilung
(„Folgemeldung … Stärke 11 → 10 (−1)"). Eine Warnung, dass dieselben Namen in zwei
Einheiten stehen, gibt es nirgends; „Hinweise" an Nr. 1 nennt nur „Verpflegung 11 statt
Stärke 10".

**Erwartung der Rolle:** Wer einen Trupp abgeteilt hat und danach die aktualisierte Meldung
der Stammeinheit annimmt, will die Lage nicht verfälscht sehen — mindestens eine Frage
oder einen Hinweis „Scherer und Heinrich stehen schon in Nr. 2".

**Folge:** Stärke, Verpflegung und Unterbringung der Lage sind um die abgeteilten Personen
überzeichnet (12 statt 10), ohne dass die Zahl auffällt. Die beiden Rechnungen („9 → 10" im
Dialog, „11 → 10" in der Quittung) lassen den Meldekopf an der Zahl zweifeln, ohne zu
erkennen, was fehlt. Das Lageblatt trägt die 12 auf Papier in den Stab.

**Empfehlung:** Im Dialog „Einheit ist bereits gemeldet" die abgeteilten Teile der Einheit
nennen („Trupp Fähre (2 Personen) ist abgeteilt; sie stehen auch in der neuen Meldung")
und anbieten, sie zurückzuführen oder aus der neuen Fassung herauszunehmen; die
Vergleichsbasis in Dialog, Quittung und Karte angleichen.

**Verifikation:** Aufteilen mit zwei Personen, Folgemeldung mit denselben Personen
aufnehmen: Der Dialog nennt den Trupp, die Summe bleibt 10 oder die Doppelung wird
sichtbar markiert; „Stärke a → b" ist in Dialog, Quittung und Karte dieselbe Zahl.

### R13-W2 [P3] „Neu"-Kennzeichnung nach Abrücken widerspricht sich zwischen Ansichten

**Fundstelle / Aufgabe:** Meldekopf, eine aufgenommene Einheit abrücken (ohne vorher „Zur
Kenntnis genommen"), danach „‹ Startseite" und wieder „Hochwasser Weser öffnen".

**Beobachtung:** Direkt nach „Abrücken" verschwindet in der offenen Einsatzansicht der Block
„Neu seit der letzten Kenntnisnahme" samt Knopf; die Zeile „Zuletzt eingelesen: „THW
Sinsheim …" · jetzt 0 Einheiten, Gesamt 0" bleibt stehen und liest sich, als sei die Einheit
verschwunden. Auf der Startseite steht dagegen „Letzte Meldung … · 1 neu seit der letzten
Kenntnisnahme", und beim erneuten Öffnen (auch nach Neuladen) erscheint der Block wieder
mit „THW Sinsheim … — neu gemeldet" für die abgerückte Einheit. Mit zwei Einheiten, von
denen eine abrückt, bleibt der Block dagegen in beiden Ansichten stehen.

**Erwartung der Rolle:** Eine Einheit, die schon wieder abgerückt ist, steht entweder nicht
mehr als „neu" da oder in allen Ansichten gleich.

**Folge:** Gering. Der Meldekopf sieht eine „neue" Einheit, die er schon abgefertigt hat, und
muss sie noch einmal „zur Kenntnis nehmen"; die Zeile „jetzt 0 Einheiten" nach dem Abrücken
kann als Datenverlust gelesen werden.

**Empfehlung:** Abrücken und „Zur Kenntnis genommen" gleich behandeln oder abgerückte
Einheiten aus der Neu-Liste und der Startseitenzahl ausnehmen; die Quittungszeile nach dem
Abrücken durch die Abrück-Quittung ersetzen.

**Verifikation:** Einzige Einheit abrücken: Startseite und Einsatzansicht zeigen dieselbe
Neu-Zahl (null), die Zeile „Zuletzt eingelesen" nennt kein „jetzt 0 Einheiten".

### R13-W3 [P3] Startseite nennt für denselben Einsatz zwei verschiedene Einheitenzahlen

**Fundstelle / Aufgabe:** Startseite mit einer Sammlung, deren einzige Einheit abgerückt ist.

**Beobachtung:** Der Schnellzugriff „„Hochwasser Weser" öffnen" nennt „1 Einheit", die Karte
weiter unten im Abschnitt „Einsatz-Sammlung (Meldekopf)" für dieselbe Sammlung „0 Einheit(en)
anwesend · Stärke 0 / 0 / 0 / 0". Beide Aussagen stimmen für sich (gemeldet bzw. anwesend),
stehen aber ohne Erklärung auf einem Bildschirm.

**Erwartung der Rolle:** Eine Sammlung, eine Zahl, oder beide mit ihrem Wort („1 gemeldet,
0 anwesend").

**Folge:** Gering. Wer die Startseite nach dem Abrücken liest, fragt sich, ob die Einheit noch
da ist.

**Empfehlung:** Beide Stellen wie in der Einsatzansicht beschriften („1 gemeldet · 0 anwesend").

**Verifikation:** Sammlung mit einer abgerückten Einheit: beide Stellen nennen dieselbe
Aufteilung.

### R13-W4 [P3] „0 Personen, davon 3 vegetarisch, 1 vegan" in Übersicht und Details

**Fundstelle / Aufgabe:** Einheit: Übersicht, Block „Sofortbedarf & Sonstiges"; Meldekopf:
„Details" derselben Einheit; Verpflegung auf 0 gesetzt (Selbstversorgung).

**Beobachtung:** Die Warnung aus R12-W2 ist weg. Der Block liest weiter „Verpflegung: 0
Personen, davon 3 vegetarisch, 1 vegan". Das Lageblatt formuliert sauber („angefordert 0
Portionen, Stärke 11 (7 Fleisch / 3 vegetarisch / 1 vegan)").

**Erwartung der Rolle:** Bei 0 angeforderten Portionen steht „nicht angefordert" und die
Ernährung der Personen getrennt.

**Folge:** Gering; der Satz widerspricht sich und verleitet die Einheit zum „Korrigieren".

**Empfehlung:** Bei 0 Portionen „nicht angefordert (Ernährung der Personen: 3 vegetarisch,
1 vegan)" ausgeben, wie das Lageblatt.

**Verifikation:** Verpflegung 0 setzen: Übersicht und Details nennen keine „davon"-Zahl unter
„0 Personen".

### R13-W5 [P3] Zug und Auftrag nur einzeln je Karte, nicht bei der Aufnahme

**Fundstelle / Aufgabe:** Meldekopf, mehrere Einheiten kurz nacheinander aufgenommen
(Link/Datei); Zug- und Auftragszuordnung.

**Beobachtung:** Die Aufnahme fragt nicht nach Zug oder Auftrag (nur die manuelle Erfassung
hat die Zettelfelder). Je Einheit sind es Karte aufklappen, „Zug zuordnen", Eintrag tippen,
Speichern (und für den Auftrag nochmals „Auftrag/Notiz" und Speichern); die Tabelle sagt
selbst „Details, Historie und Aktionen einer Einheit stehen in der Kartenansicht". Die Marken
„2 ohne Auftrag · 2 ohne Zug" zeigen die offene Arbeit, erledigen sie aber nicht. Das Zugfeld
ist Freitext mit Vorschlägen.

**Erwartung der Rolle (Annahme):** Wer weiß, zu welchem Zug eine eintreffende Einheit gehört,
trägt das beim Eintreffen ein und nicht in einem zweiten Durchgang.

**Folge:** Gering bis mittel bei vielen gleichzeitigen Eintreffen: ein zweiter Durchgang über
alle Karten, in dem Tippfehler im Zugnamen getrennte Zwischensummen erzeugen.

**Empfehlung:** In der Quittung „Zuletzt eingelesen" ein Zugfeld anbieten und die Zuordnung
für mehrere Einheiten zugleich ermöglichen.

**Verifikation:** Drei Einheiten aufnehmen: Zug ist in der Quittung oder in einem
Mehrfachvorgang in unter zwei Tipps je Einheit gesetzt.

### R13-W6 [P3] Kein Abschluss des Einsatzes

**Fundstelle / Aufgabe:** Meldekopf, Einsatzende: alle Einheiten abgerückt, Sammlung sichern.

**Beobachtung:** Sind alle Einheiten abgerückt, zeigt die Einsatzansicht 0 / 0 / 0 / 0 und
„Einheiten (1 gemeldet · 0 zählend)", aber keinen Hinweis wie „Alle abgerückt — Einsatz
sichern?" und keinen Zustand „abgeschlossen". Unter „Einsatz verwalten" gibt es nur „Einsatz
löschen…"; die Startseite führt die Sammlung weiter oben unter „Bögen sammeln" und als
Schnellzugriff. (Annahme: ein Abschlusszustand wäre im Ablauf nützlich; eine THW-Vorschrift
dazu ist nicht bekannt.)

**Erwartung der Rolle:** Am Ende ein erkennbarer Schritt: sichern, dann als beendet ablegen,
damit die nächste Lage nicht neben der alten Sammlung beginnt.

**Folge:** Gering. Alte Sammlungen bleiben gleichrangig neben der aktuellen stehen; bei der
Aufnahme per Link fragt die App bei mehreren Sammlungen jedes Mal „Wohin damit?" und führt
die alte mit auf.

**Empfehlung:** Nach dem letzten Abrücken einen Satz mit „Einsatz sichern" anbieten und
eine Sammlung als beendet markieren können (aus der Aufnahmeauswahl und dem Schnellzugriff
nehmen, abrufbar lassen).

**Verifikation:** Alle Einheiten abrücken: Hinweis zum Sichern erscheint; beendete Sammlung
fehlt in „Wohin damit?".

## Ergebnis

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Stärke 11 → 10" (Quittung) und „9 → 10" (Dialog) für dieselbe
  Folgemeldung, sobald ein Trupp abgeteilt ist (R13-W1).
- **Größtes Einsatzrisiko:** Abgeteilte Personen werden durch die Folgemeldung der Stammeinheit
  doppelt gezählt, ohne Warnung (R13-W1).
- **Top-Priorität für die nächste Iteration:** R13-W1 (Aufteilen und Folgemeldung
  zusammenführen oder die Doppelung sichtbar machen).
