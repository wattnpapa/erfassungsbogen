# Audit „Mobile UI", Runde 20 (Darstellung und Bedienung auf dem Telefon)

Prüfer: Rollenaudit `mobile-ui-reviewer` · Datum: 2026-10-28 · Prüfgegenstand: Web-App unter
`http://localhost:4173` (laufender Build, Code-Stand Commit `7c06324` = `main`) ·
Zählung: **P0 0 · P1 0 · P2 0 · P3 6 · Hinweise 4**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md` und der Abschnitt
„Stand der Behebung" von `runde-19/README.md` sowie `runde-19/mobile-ui.md`. Offene und
teilweise behobene Punkte aus Runde 19 sind gemeldet, soweit sie im Browser noch zu sehen sind.

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen), `isMobile`,
`hasTouch`, Locale de-DE, Tipps per Touch (bei Tipp-Sperren per `touchscreen.tap`). Viewports
390 x 844, 360 x 640, 320 x 568, quer 640 x 360 und 568 x 320; Ansichten „Standard" und „Feld".
Zustand per `localStorage`-Seed: Sammlung „Hochwasser Musterstadt" mit acht Meldungen aus
`examples/thw/` (als Einsatz, nicht als Übung). Die Hinweise „Stand vor 102 Tagen",
„Zeitraum vorbei" und „Anderer Einsatz?" stammen aus den alten Beispieldaten und sind nicht
gewertet, wohl aber das Verhalten ihrer Bedienelemente.
Durchlaufen: Startseite und ihre Dialoge, Einsatzansicht (Karten, aufgeklappte Karte, „Mehr…",
Tabelle mit Kern- und allen Spalten, Übergabe und Abschluss, Lagemonitor), Entfernen mit
Tipp-Sperre und Quittung, Scanner ohne Kamera, Schnellerfassung, Assistent Schritt 1 bis 5.
Gemessen: seitlicher Überlauf, Bedienziele unter 44 px, Schriften unter 12 px, Text über dem
Knopfrand (`scrollWidth` gegen Breite), Lage der Fußleiste, Höhe der Dialoge.
Nicht prüfbar: echte Bildschirmtastatur, Safe-Area, WebKit, Kamera, Handschuhe, Licht.
Kein seitlicher Überlauf der Seite und keine Konsolenfehler in allen geprüften Viewports.

## Behebungen der Runde 19, die im Browser halten (nicht gemeldet)

- Voller Speicher (`localStorage` bis zum Quota-Fehler gefüllt): „Meldung entfernen" meldet
  „Papierkorb voll" mit „Endgültig entfernen"/„Abbrechen"; „Einsatz als beendet markieren"
  meldet „Einsatz nicht beendet"; „Übergabe vermerken" meldet „Übergabe nicht vermerkt"
  (Status bleibt „noch nicht vermerkt"); „Einsatz löschen" meldet „Nicht gelöscht", die Sammlung
  bleibt aktiv. Keine stille Behauptung „gespeichert".
- Fußleiste des Assistenten: kein Text über dem Knopfrand (`scrollWidth` höchstens Knopfbreite)
  in Schritt 1 bis 5 bei 390, 360, 320 und „Feld"; „Zurück" schrumpft auf „←".
- Quittungsleiste nach „Entfernen": zwei Zeilen („Nr. 1 entfernt · Papierkorb Details",
  „Rückgängig", „✕"), 60 px bei 640 px Höhe.
- Tipp-Sperre: Knopf „Meldung entfernen" ist 1,3 s `aria-disabled`; ein Tipp darin setzt
  „Einen Moment …" auf den Knopf (`data-tipp-text`); „Abbrechen" bleibt frei.
- Schnellerfassung: „Ort der Einheit (Pflicht)" ist das erste Feld und liegt in allen
  Viewports im ersten Bild (Oberkante 481 bis 570 px).
- Tabelle am Telefon (360): Einheit, Gesamt, Eingetroffen und Bedarf passen ohne Wischen,
  Einheitsname vollständig, „Alle Spalten zeigen" wischt waagerecht im eigenen Rahmen.
- „Lagemonitor für den Fernseher" ist eingeklappt (eine Zeile statt 460 bis 650 px).
- Startseite: kein Überlauf, Hauptknopf „Neuen Bogen erstellen" im ersten Bild.
- „Einsatz als beendet markieren": Quittung „Einsatz beendet. Rückgängig" erscheint sofort.

## Befunde

### R20-M1 [P3] Chip „⚠ Anderer Einsatz? Prüfen ▸" ist kein eigenes Bedienziel, ein Tipp klappt nur die Karte auf

**Typ:** Bedienung
**Neu oder alt (Verweis):** alt (R19-M11)

**Ort:** Eingeklappte Karte in der Einheitenliste, 360 x 640 und 320 x 568.

**Beobachtung:** Playwright meldet für den Chip „`button.karte-aufklappen` intercepts pointer
events": Die Karte liegt als Knopf darüber. Ein Tipp mitten auf den Chip lässt die Karte
aufklappen (Anzahl „Zuklappen" 0 auf 1), die Seite scrollt nicht zum Hinweis, es öffnet sich
nichts zum Prüfen. Der Chip hat Rand und Pfeil „▸" wie ein eigener Knopf.

**Folge:** „Prüfen" verspricht eine Prüfhandlung. Der Helfer landet in einer 2 bis 3
Bildschirme langen Karte und muss den Grund („Bogen nennt: …") selbst suchen.

**Empfehlung:** Den Chip entweder als Text ohne Knopfoptik führen oder beim Tipp aufklappen und
zum Hinweis mit „Gehört zu dieser Lage" springen.

**Nachprüfung:** Tipp auf den Chip bringt den Hinweisabsatz in den sichtbaren Bereich.

### R20-M2 [P3] Scanner ohne Kamera, 568 x 320 „Feld": Anleitung in 238 px hohem Innenfenster, Satz abgeschnitten

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** alt (R19-L2, M5, G9, S10)

**Ort:** Dialog „Dieses Gerät meldet keine nutzbare Kamera", Feld `scanner-mitte`, quer 568 x 320
in „Feld". Bei 360 x 640, 320 x 568 und 640 x 360 kein Innenscrollen.

**Beobachtung:** `scanner-mitte` ist 238 px hoch bei 308 px Inhalt und rollt innen. Im Bild
bricht der Text am unteren Rand ab („Am Handscanner auslösen — das Fenster nimmt den Code
sofort an." und das Feld „Bereit — warte auf den Handscanner" ragen in die Fußleiste). Kein
Hinweis, dass dort weitergescrollt werden kann.

**Folge:** Ein Teil der Anleitung wird nur gefunden, wer in dem kleinen Feld wischt; der
Eindruck ist ein abgeschnittener Text.

**Empfehlung:** Im niedrigen Querformat Knopfleiste und Fußleiste in eine Zeile fassen oder
den Hinweistext kürzen, bis er ohne Innenscrollen passt.

**Nachprüfung:** `scrollHeight` von `scanner-mitte` höchstens `clientHeight` bei 568 x 320.

### R20-M3 [P3] Assistent quer 568 x 320 „Feld": Kopf, Schrittleiste und Fußleiste belegen 53 % der Höhe, ein Feld im Bild

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** alt (R19-M10, R19-K12)

**Ort:** Assistent und Schnellerfassung, Schritt 1, 568 x 320 „Feld" (in „Standard" 568 x 320:
Fußleiste 56 px).

**Beobachtung:** Kopf mit Schrittleiste 104 px, Fußleiste 65 px, dazu 151 px Inhalt. Sichtbar
sind „Organisation" und „Organisationsname" in einer Zeile, darunter beginnt der Fußbereich.
Die Fußleiste steht in der Ruhe auch ohne Eingabe immer in voller Höhe (57 px bei 360 x 640,
65 px in „Feld").

**Folge:** Beim Ausfüllen im Querformat sieht der Helfer nahezu nur Schrittnummern und
Knöpfe; mit eingeblendeter Bildschirmtastatur bleibt kein Eingabefeld sichtbar (nicht gemessen,
keine Tastatur emulierbar).

**Empfehlung:** Im niedrigen Querformat die Schrittleiste in die Kopfzeile ziehen und die
Fußleiste auf Knopfhöhe ohne Rand begrenzen.

**Nachprüfung:** Inhaltsfläche mindestens 55 % der Höhe bei 568 x 320 „Feld".

### R20-M4 [P3] Einsatzansicht quer 568 x 320 „Feld": „Bogen scannen…" beginnt erst bei 310 von 320 px

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** alt (R19-M9, R18-G2, R18-S1)

**Ort:** Kopf der Einsatzansicht, 568 x 320 „Feld" (in „Standard" 568 x 320: 276 px,
640 x 360: 276 px).

**Beobachtung:** Kopf mit Ort und Zeitangabe über drei Zeilen und die Kennzahlen (8 / 3 / 17 /
49 / 69) füllen das Bild. Die erste Hauptaktion liegt unter dem Falz.

**Folge:** Im Querformat ist der Bildschirm eine Lageanzeige ohne Bedienknopf; wer Meldungen
aufnehmen will, muss erst wischen.

**Empfehlung:** Kopf im Querformat zu einer Zeile zusammenziehen (Name, Ort, letzte Meldung)
oder die Aufnahmeknöpfe in die Kopfzeile legen.

**Nachprüfung:** Oberkante von „Bogen scannen…" kleiner als 60 % der Höhe bei 568 x 320.

### R20-M5 [P3] Dialoge der Startseite bei 320 x 568 „Feld": „Datensicherung" und „Alle Daten löschen" 1,4 bis 2 Bildschirme lang, Aktionsknöpfe unter dem Falz

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** alt (R19-M15)

**Ort:** Startseite, „Datensicherung" und „Alle Daten löschen", 320 x 568 „Feld" (und
„Datensicherung" bei 360 x 640: „Dauerhaften Speicher …" bei 683 von 640 px).

**Beobachtung:** Datensicherung 1141 px Inhalt in 536 px Fenster, „Sicherung erstellen…" bei
633 px; Alle Daten löschen 774 px, „Endgültig löschen" bei 645 px, „Abbrechen" bei 722 px.
Der Dialog rollt im Dialog, das Bild zeigt unten die Seite („Impressum") durch den Rand.

**Folge:** Die Entscheidung „löschen oder abbrechen" steht erst nach dem Scrollen; die
Warnung vor dem Löschen ist im ersten Bild lang.

**Empfehlung:** Erklärtexte in aufklappbare Zeilen fassen; Knöpfe als feste Fußzeile des Dialogs.

**Nachprüfung:** Beide Knöpfe von „Alle Daten löschen" im ersten Bild bei 320 x 568.

### R20-M6 [P3] Link „Warum?" in der aufgeklappten Karte ist 54 x 15 px groß

**Typ:** Bedienung
**Neu oder alt (Verweis):** neu

**Ort:** Aufgeklappte Karte, Zeile „⚠ Bogen nennt: „…" — passt das zu dieser Lage? Zählt
trotzdem mit. Warum?", 360 x 640 und 640 x 360 (in „Feld" 64 x 19 px).

**Beobachtung:** Der Link steht inline am Zeilenende und hat 15 px Höhe; die Nachbarn sind
44 bis 48 px hohe Knöpfe („Gehört zu dieser Lage", „ändern" 44 x 43).

**Folge:** Mit Handschuh oder im Gehen trifft der Tipp oft die Textzeile darüber; die Erklärung
bleibt ungelesen.

**Empfehlung:** Als eigene Zeile mit mindestens 44 px Höhe führen.

**Nachprüfung:** Höhe des Links mindestens 44 px in allen Ansichten.

## Hinweise (ohne Priorität)

- **H1 (Layout, alt R19-M14/R18-N8):** Startseite 360 x 640: zwei Spalten à rund 170 px, die
  Knöpfe brechen auf drei bis vier Zeilen („Einheit schnell erfassen (nur Stärke)…"). Lesbar,
  Bedienziele groß; Geschmacksfrage, ob eine Spalte besser wäre.
- **H2 (Text):** Assistent, Schritt 5 bei 320 px: der Hauptknopf zeigt sichtbar nur „→"
  (zugänglicher Name „Zur Übersicht →" ist gesetzt).
- **H3 (Layout):** Kartenüberschrift und Pfeil „▾" stoßen bei langen Namen („Nr. 3 THW Karlsruhe
  Zugtrupp Technischer Zug", 360 px) ohne Abstand aneinander, keine Überlagerung.
- **H4 (Text):** Querformat 568 x 320 und 640 x 360: Kennzahl-Beschriftungen („EINHEITEN",
  „FÜHRER", „MANNSCH.") in 11 px, die Werte darüber groß; kein Umbruch im Wort mehr (R19-M8).

## Nicht reproduzierbar

R19-K10 („7 aufgenommen, 7 bereits vorhanden") war ohne Kamera und ohne Bilddatei-Einlesung
nicht herbeizuführen und ist nicht gewertet. R19-N8 (Tabelle): mit Kernspalten bei 360 px kein
Befund mehr; Zeilen 78 px hoch durch die Warnung „Stand vor … Tagen" aus den Beispieldaten.
