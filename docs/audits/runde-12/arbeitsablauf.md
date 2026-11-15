# Audit „Arbeitsablauf", Runde 12 (Einheit → Meldekopf → Ablösung)

Prüfer: Rollenaudit `thw-workflow-reviewer` · Datum: 2026-10-26 · Prüfgegenstand:
Web-App, Produktionsbuild (`vite preview`, Port 4173), Stand `main` nach Runde 11
(Commit `2c96abe`).

**Zählung: P0 0 · P1 0 · P2 1 · P3 3**

Reiner Prüfbericht, keine Codeänderung. Nicht erneut gemeldet sind die bekannten
Grenzen (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5,
R8-H5/S4), die Reste aus Runde 10 (leere Karten bei „Nur Stärke", Rückgängig für
Meldungen überlebt das Neuladen nicht, Tabellenzeilenhöhe bei 180 × 320) und aus
Runde 11 (R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3). Die Zeile
„Unterbringung 11Personen" in der Kopfzeile „Bedarf:" hat in Runde 12 bereits der
Bericht Feldtauglichkeit als R12-H1 gemeldet und wird hier nicht doppelt gezählt.

## Prüfaufbau

Playwright (globales Modul, weil die Projektkopie eine nicht installierte
Chromium-Revision verlangt; `chromium.launch()` ohne Optionen, nichts installiert),
`isMobile`/`hasTouch`, Locale de-DE, Viewports 390 × 844 und 360 × 640, je Gerät ein
eigener Kontext, Tipp-Sperre von 0,9 s eingehalten. Geräteuhr 26.10.2026.
Zustände über `localStorage`-Seed des Entwurfs (`eeb.entwurf.v1`) aus den
Übungsbögen unter `examples/thw/` mit `uebung: false`, Zeitraum und `stand` auf
heute gesetzt (sonst greift die Datenschutzfrist). Der Link-Weg ersetzt den
QR-Transport (`navigator.share` gestubbt, Host auf `localhost:4173` umgeschrieben);
PDFs und CSV wurden gespeichert und mit `pdftotext` gelesen. Nicht prüfbar:
Kamera-Scan, Nahbereich, echte Handschuhe, Bildschirmtastatur, Einfügen in Excel.

Erwartete Arbeitsfolge (**Annahme** zum realen THW-Ablauf, nicht bekannt):

1. Die Einheit hat ihren Bogen (aus Vorlage), hinterlegt Name und Rückkanal und
   übergibt per Link, QR oder PDF.
2. Der Meldekopf nimmt auf, ordnet Zug und Auftrag zu, lässt abrücken, druckt das
   Lageblatt und gibt den Einsatz an die Ablösung weiter.
3. Rückfragen an die Einheit laufen über den Absender.
4. Nach einer Änderung der Einheit folgt eine Nachmeldung, die der Meldekopf
   einordnet.

Durchlaufen: Einheit aus Entwurf bis Übersicht, Absender hinterlegen, Übergabe per
Link, PDF und Kopie-Weg ohne `navigator.share`, Änderung nach der Übergabe („Neu
übergeben"-Hinweis), Vorlage speichern, Bogen schließen, „Einsatz vorbereiten" mit
Rückfrage „Alle aus der Vorlage dabei?"; Meldekopf: Sammlung anlegen, Aufnahme per
Link und per Einzel-PDF, Nachmeldung (anhängen), Nachmeldung nach Abrücken, drei
Einheiten, Kenntnisnahme mit Rückgängig, Zug (Vorschlagsliste), Eintreffzeit
„ändern", Abrücken, Lageblatt, CSV, Sammel-PDF und Import auf zweitem Gerät
(auch bei gleichnamiger Sammlung), Lageblatt-PDF als Eingabe, „Einheit manuell
erfassen" bis „In Einsatz übernehmen", Browser-Zurück.

## Urteil

Der Ablauf trägt und ist gegenüber Runde 11 spürbar glatter. Ein Helfer schafft den
Weg Einheit → Meldekopf → Ablösung ohne fremde Hilfe. Reibung bleibt an den
Rändern des Prozesses: beim Rückruf (die Nummer steht da, lässt sich aber nicht
antippen), bei Hinweisen, die eine bewusste Entscheidung der Einheit als Fehler
lesen, und bei zwei Formulierungen, die mehr zusichern, als die App weiß.

### Behebungen aus Runde 11, geprüft

| Befund | Ergebnis |
| --- | --- |
| R11-W1 Verpflegung | hält. Ohne Anforderung steht „Verpflegung angefordert 0 (Stärke 11)" in Kopfzeile, Lageblatt („angefordert 0 Portionen, Stärke 11") und CSV; mit Anforderung „Verpflegung 11" |
| R11-W2 Absender am Meldekopf | hält. „Absender: Hans Beispiel · hans@example.org · 0170 5551234" auf der aufgeklappten Karte, im Block „Absender (Rückfrage)" unter „Details" und in der Spalte „Funkrufname / Rückruf" des Lageblatts |
| R11-W3 Editor schluckt Tipp | hält. Zug „2. Zug" eingetragen, ein Tipp auf „Abrücken" (nach 1,1 s): Zug gespeichert und abgerückt in einem Tipp |
| R11-W4 Funkrufname | hält. Lageblatt: „Heros Sinsheim 37/46 (Vorbelegung)" bei Fahrzeugen ohne Kennzeichen |
| R11-W5 „mustern" | hält. „… lässt sich für den nächsten Einsatz laden und verwenden" |
| R11-D1 Kenntnisnahme | hält. „Zur Kenntnis genommen: 2 Einheiten" mit „Rückgängig" |
| R11-K3 gleichnamige Sammlung | hält. Dialog „Es gibt schon eine Sammlung …" mit „In die vorhandene Sammlung übernehmen" / „Als eigene Sammlung" |
| Nachmeldung nach Abrücken | hält. „Die Einheit war abgerückt – mit der neuen Fassung zählt sie wieder mit", danach „⚠ wieder anwesend" und „Wieder abrücken" |
| Lageblatt als Eingabe | hält. Klare Meldung „ist ein Lageblatt … enthält keine Bögen" mit Verweis auf Sammel-PDF |

## Befunde

### R12-W1 [P2] Rückrufnummer und E-Mail des Absenders sind Text, keine Verknüpfungen

**Fundstelle / Aufgabe:** Meldekopf, aufgeklappte Karte der Einheit (Zeile „Absender:
…") und „Details" → „Absender (Rückfrage)"; 360 × 640 und 390 × 844.

**Beobachtung:** Mit hinterlegtem Absender (Name, E-Mail, Telefon) zeigt die Karte
„Absender: Hans Beispiel · hans@example.org · 0170 5551234", „Details" dieselbe Zeile.
Im aufgeklappten Zustand gibt es auf der Seite keinen einzigen `tel:`-Verweis und
keinen `mailto:`-Verweis auf diese Angaben (gezählt: nur die vier `mailto:`-Verweise
der Fußzeile auf den Kontakt des Autors). Dasselbe gilt für die Telefonnummern der
Ebenen „OV / RB / LV" unter „Details" und für den „Mobil"-Eintrag im Personal. Die
Nummer ist am Telefon markierbar, aber nicht mit einem Tipp wählbar.

**Erwartung der Rolle:** Das Gerät, auf dem die Rückfrage entsteht, ist ein Telefon.
Wer „Rückfrage" liest, tippt auf die Nummer und ruft an.

**Folge:** Der Meldekopf muss die Nummer markieren, kopieren oder abtippen (mit
Handschuhen, nebenbei am Funk). Ein Zahlendreher führt zur falschen Person und wird
nicht bemerkt. Das ist genau der Zweck, für den die Einheit ihre Nummer freiwillig
hinterlegt hat („damit die Gegenstelle bei Rückfragen weiß, wen sie erreicht").

**Empfehlung:** Telefonnummern und E-Mail-Adressen des Absenders (und der Ebenen
unter „Details") als antippbare Verknüpfung mit Zielgröße von 44 px darstellen;
das Format der Nummer so lassen, wie die Einheit es eingetragen hat.

**Verifikation:** Absender mit Telefon hinterlegen, übergeben, am Meldekopf aufnehmen,
Karte aufklappen: ein Tipp auf die Nummer öffnet die Wählhilfe, ein Tipp auf die
Adresse das Mailprogramm.

### R12-W2 [P3] Selbstversorger: „mehr Vegetarier/Veganer als Verpflegte" bei bewusst 0 Portionen

**Fundstelle / Aufgabe:** Einheit: Schritt 5 „Sofortbedarf erfassen" (Verpflegung
auf 0 gesetzt, z. B. nur Diesel angefordert), Übersicht, Übergabe. Meldekopf: Chip
an der Karte, Lageblatt, Tabelle.

**Beobachtung:** Schritt 5 belegt „Verpflegung (Personen)" aus der Stärke vor (11).
Wer Selbstversorgung meldet und die Zahl auf 0 setzt, bekommt auf Schritt 5 und in
der Übersicht unter „⚠ 2 offene Punkte für die Weitergabe" den Satz „Sofortbedarf:
mehr Vegetarier/Veganer erfasst als Personen mit Verpflegungsbedarf." (die Ernährung
steht bei den Personen aus Schritt 3: 3 vegetarisch, 1 vegan). Am Meldekopf trägt
die Karte den Chip „mehr Vegetarier als Verpflegte + 1 weitere", das Lageblatt in
der Spalte „Hinweise" „mehr Vegetarier als Verpflegte". Die Kopfzeile nennt
korrekt „Verpflegung angefordert 0 (Stärke 11)" (R11-W1). Die Regel prüft nur
`vegetarisch + vegan > verpflegungPersonen`, nicht, ob überhaupt Verpflegung
angefordert wurde.

**Erwartung der Rolle:** Wer keine Verpflegung anfordert, wird nicht nach der
Zusammensetzung der nicht bestellten Portionen gefragt.

**Folge:** Gering bis mittel. Die Einheit liest den Hinweis als Fehler und räumt ihn
mit einer falschen Angabe ab (Verpflegung wieder > 0, damit wird bestellt, was nicht
gewollt ist; oder die Ernährung der Personen wird gelöscht). Der Meldekopf sieht auf
Karte und Papier eine Warnung ohne Sinn und fragt womöglich zurück.

**Empfehlung:** Den Hinweis nur zeigen, wenn Verpflegung angefordert ist (> 0);
bei 0 Portionen die Ernährungszeile als „nicht angefordert" darstellen.

**Verifikation:** Verpflegung auf 0 setzen, Personen mit „vegetarisch" belassen:
weder Übersicht noch Karte noch Lageblatt nennen den Hinweis; bei Verpflegung 2 mit
3 Vegetariern erscheint er weiter.

### R12-W3 [P3] „Weitergegeben 03:00" steht nach dem Erzeugen der Datei, nicht nach der Übergabe

**Fundstelle / Aufgabe:** Meldekopf, „Einsatz weitergeben / sichern" an die Ablösung;
Kopf der Einsatzansicht und Startseitenkarte der Sammlung.

**Beobachtung:** Nach dem Tipp (ohne dass jemand die Datei gesehen hat) steht im Kopf
„Weitergegeben 26.10.2026, 03:00 — seitdem hier nichts Neues." und auf der
Startseite „Lageblatt: noch keins · Export: noch keiner · Weitergegeben 26.10.2026,
03:00 (seitdem keine neue Meldung)". Die Quittung unter dem Knopf sagt dagegen
selbst: „Weitergegeben ist sie erst, wenn sie bei der Ablösung oder im Archiv
angekommen ist." Auf der Einheitenseite benennt die App denselben Zustand ehrlich
(„Link geteilt 02:42 Uhr — Empfang nicht bestätigt", „PDF erzeugt 03:02 Uhr — Empfang
nicht bestätigt").

**Erwartung der Rolle:** Der Vermerk im Kopf sagt, was feststeht: Die Datei wurde
erzeugt.

**Folge:** Gering. Wer in der Schichtübergabe nur auf die Kopfzeile schaut, liest
„weitergegeben, nichts Neues" und geht davon aus, die Ablösung habe den Stand. Hat
der Download-Ordner die Datei nicht oder in einer Umgebung ohne Dateizugriff
abgelegt, stimmt die Aussage nicht.

**Empfehlung:** Den Vermerk wie auf der Einheitenseite formulieren („Sammel-PDF
erzeugt 03:00 — Empfang nicht bestätigt, seitdem nichts Neues") und dieselbe
Marke „als übergeben vermerken", wenn die Ablösung die Übernahme bestätigt.

**Verifikation:** „Einsatz weitergeben / sichern" tippen: Kopf und Startseite nennen
„erzeugt" und „nicht bestätigt".

### R12-W4 [P3] Nachmeldungs-Rückfrage bei 360 × 640 zeigt die Wiederanwesenheits-Warnung unter dem Falz

**Fundstelle / Aufgabe:** Meldekopf: Einheit ist abgerückt, dieselbe Einheit sendet
einen geänderten Bogen (Link). Dialog „Einheit ist bereits gemeldet".

**Beobachtung:** Bei 360 × 640 bleibt für den Text ein Rollbereich von 338 px bei
590 px Inhalt (`abfrage-rumpf`). Sichtbar sind „Bisher", „Neu" und der Anfang von
„Geändert". Die Zeile „⚠ Die Einheit war abgerückt – mit der neuen Fassung zählt sie
wieder mit." und die Erklärungen der drei Wege („Als neue Fassung anhängen: …")
liegen darunter und sind von der Knopfleiste mit einem Verlauf überdeckt; der Knopf
„Als neue Fassung anhängen" ist als einziger hervorgehoben. Bei 390 × 844 passt der
Text ohne Rollen. Die Folge ist nicht endgültig: Karte und Quittung nennen
anschließend „⚠ wieder anwesend — war abgerückt" und bieten „Rückgängig" an.

**Erwartung der Rolle:** Was die Wahl für den Anwesenheitsstand bedeutet, steht vor
den Knöpfen und nicht dahinter.

**Folge:** Gering: Ein Meldekopf, der den hervorgehobenen Knopf ohne Rollen tippt,
setzt eine abgerückte Einheit wieder in die Lage und die Summen, ohne die Warnung
gelesen zu haben. Die Quittung mit „Rückgängig" fängt das auf.

**Empfehlung:** Den abgerückt-Hinweis als erste Zeile unter die Überschrift setzen
(vor „Bisher / Neu / Geändert") und die drei Erklärungen kürzer fassen, so dass bei
360 × 640 der Hinweis ohne Rollen sichtbar ist.

**Verifikation:** Einheit abrücken, geänderten Bogen aufnehmen, 360 × 640: Der
Hinweis steht ohne Rollen im sichtbaren Bereich.

## Ergebnis

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Verpflegung 0" als bewusste Selbstversorgung liest
  die App als Fehler der Ernährungsangaben (R12-W2).
- **Größtes Einsatzrisiko:** Die Rückfrage an die Einheit scheitert an einer
  abgetippten Nummer (R12-W1); die Kopfzeile „Weitergegeben" meldet in der
  Schichtübergabe mehr, als die App weiß (R12-W3).
- **Top-Priorität für die nächste Iteration:** R12-W1 (Nummer und Adresse des
  Absenders antippbar).
