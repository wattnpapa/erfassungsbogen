# Audit „Mobile UI", Runde 19 (Darstellung und Bedienung auf dem Telefon)

Prüfer: Rollenaudit `mobile-ui-reviewer` · Datum: 2026-10-28 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (laufender Produktionsbuild,
Code-Stand Commit `0ac0d7f` = `main`) · Zählung: **P0 0 · P1 0 · P2 1 · P3 14**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md` und der
Abschnitt „Stand der Behebung" von `runde-18/README.md`. Es gibt keine „bekannten Grenzen";
auch Punkte, die dort als „offen", „teilweise" oder „nicht gemessen" stehen, sind gemeldet,
sofern sie im Browser noch zu sehen sind.

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen), `isMobile`,
`hasTouch`, Locale de-DE, Tipps per Touch (`tap`, bei Tipp-Sperren per `touchscreen.tap`, weil
`tap` auf `aria-disabled` wartet). Viewports 390 x 844, 360 x 640, 320 x 568 sowie quer
640 x 360 und 568 x 320; Ansichten „Standard" und „Feld". Zustand per `localStorage`-Seed:
Sammlung „Hochwasser Musterstadt" mit acht Meldungen aus `examples/thw/`.
Durchlaufen: Startseite, Offline-Hinweis über Zeit, Einsatzansicht (Kacheln, Bedarf, Karten,
aufgeklappte Karte, „Mehr…", Tabelle mit Kern- und allen Spalten, Weitergeben, Lageblatt,
Exporte mit Dateinamen, Lagemonitor, Übergabe und Abschluss, Einsatz verwalten), Entfernen
samt Tipp-Sperre, Quittung, Rückgängig und Papierkorb, Scanner ohne Kamera, Schnellerfassung,
Assistent Schritt 1 bis 6, Sollstärke-Rückfrage, Dialoge der Startseite (Neue Sammlung,
Datensicherung, Geräteschlüssel, „Alle Daten löschen", Sammlung löschen, Name/Kontakt).
Gemessen: seitlicher Überlauf, Bedienziele unter 44 px, Schriften unter 12 px, Text über dem
Knopfrand, Höhe fester Leisten und Dialoge, Lage des ersten Eingabefelds.
Nicht prüfbar: echte Bildschirmtastatur, Safe-Area, WebKit, Kamera, Handschuhe, Licht. Die
„103 Tage" alten Stände stammen aus dem Prüfdatensatz und sind nicht gewertet. Kästchen und
Optionsfelder in 48 px hohen Beschriftungen sind nicht gemeldet. Kein seitlicher Überlauf der
Seite und keine Konsolenfehler in allen geprüften Viewports und Ansichten.

## Behebungen der Runde 18, die im Browser halten (nicht gemeldet)

Tipp-Sperre mit „Einen Moment …" und frühes „Abbrechen" wirkt; Quittungsleiste mit
„Rückgängig"; Nummern bleiben nach „Entfernen" (Nr. 1 fehlt, 2 bis 8 bleiben, auch nach
Rückgängig vollständig); Papierkorb nach „Entfernen"; Dateinamen der Exporte
(`2026-10-28_0427_eeb-einsatz_…pdf`, `…-oldenburg_….xlsx`, `…-lageblatt_….pdf`); Tabelle am
Telefon (Kernspalten passen, Köpfe 12 px, erste Spalte bleibt beim Wischen); Erstbesuch-Sprung
(„Öffnen" bleibt von 0 bis 7 s auf derselben Höhe); Bedarfszeile bei 320 in „Feld" ohne
Überlauf; „Gehört zu dieser Lage" 44 px und höher; Scanner ohne Kamera überdeckt im
Hochformat keinen Text mehr; Sollstärke-Rückfrage fasst alle Knöpfe in den Bildschirm
(434 von 640 px beziehungsweise 536 von 568 px).

## Befunde

### R19-M1 [P2] Assistent-Fußleiste: Beschriftung „In Einsatz übernehmen" läuft aus dem Knopf und überdeckt den Nachbarknopf

**Neu oder alt (Verweis):** neu (Umfeld R17-M3, Fußleiste einzeilig; R18-M9).

**Ort:** Fußleiste des Assistenten und der Schnellerfassung (`.assistent-nav`), alle Schritte.
360 x 640 Standard: Schritt 1 bis 5; 320 x 568 Standard: Schritt 1 bis 5; 390 x 844 Standard,
Schritt 5; 390 und 360 „Feld", Schritt 5.

**Beobachtung:** Der mittlere Knopf ist durch die beiden Nachbarn („← Zurück", „Weiter →" oder
„Zur Übersicht →") auf 56 bis 121 px zusammengedrückt, seine einzeilige Beschriftung ist
85 bis 148 px breit und ragt links und rechts über den Rand. 360 x 640, Schritt 1: Knopf
114 bis 235 px, Text 101 bis 248 px. 320 x 568, Schritt 5: Knopf 56 px breit, Text 83 px; im Bild
steht „Übernehmen" über der Kante von „← Zurück" und unter dem Rand von „Übersicht →". In der
Schnellerfassung (360 Standard) steht „Einsatz übernehme" am rechten Knopfrand abgeschnitten,
das „In" fehlt.

**Folge:** Die wichtigste Aktion des Assistenten („In Einsatz übernehmen") ist in den
gängigen Telefonbreiten 360 und 320 in Standard schlecht lesbar und sieht aus wie ein Darstellungsfehler;
die Textflächen von „Zurück" und „Übernehmen" liegen übereinander, die Tippfläche des
Nachbarknopfs ist unklar.

**Empfehlung:** Beschriftung auf den verfügbaren Platz abstimmen: Knopf nicht unter die
Textbreite schrumpfen lassen (Zeilenumbruch oder kurze Beschriftung „Übernehmen" ab dem
Breitenwert, an dem sie sonst nicht passt), „← Zurück" auf den Pfeil kürzen.

**Nachprüfung:** `scrollWidth` jedes Knopfs der Fußleiste ist höchstens seine Breite, für
Schritt 1 bis 6, 390 / 360 / 320 und Standard und Feld.

### R19-M2 [P3] Karten-Aktionen: Beschriftungen „Als Übung kennzeichnen…", „Verschieben…", „Auftrag/Notiz" ragen über den Knopfrand

**Neu oder alt (Verweis):** neu (Umfeld R18-M7, Aktionsraster der Karte).

**Ort:** Aufgeklappte Karte → „Mehr…", Dreierraster der Aktionen. 390 Standard, 360 Standard,
360 Feld, 320 Feld.

**Beobachtung:** „Als Übung kennzeichnen…" (Text 105 bis 123 px) in Knöpfen von 84 bis 103 px
Breite, „Verschieben…" 95 bis 111 px in 84 bis 103 px, „Auftrag/Notiz" 84 px in 84 px (360
Standard) und 102 px in 103 px (320 Feld). Die Wörter laufen über den Rahmen (Bild
`Entfernen`-Bereich, 360 Standard: „kennzeichnen…" und „Verschieben…" berühren den Rand).

**Folge:** Das Raster wirkt zerbrochen; die Beschriftung am Rand lässt sich schlecht lesen, und
bei „Entfernen" im selben Raster (8 px Abstand zu „Verschieben…") ist der Sinn der Knöpfe am
Rand weniger klar.

**Empfehlung:** Zweispaltiges Raster mit Umbruch im Knopf, oder „Als Übung…" kürzen und die
Knopfbreite an den längsten Text binden; „Entfernen" in eine eigene Reihe stellen.

**Nachprüfung:** Kein Knopftext der aufgeklappten Karte breiter als sein Knopf, 390 / 360 / 320
in Standard und Feld.

### R19-M3 [P3] Aufgeklappte Karte füllt zwei bis drei Bildschirme — wie R18-M7

**Neu oder alt (Verweis):** alt, R18-M7 (Stand „Rest").

**Ort:** Einsatzansicht → Karte aufklappen → „Mehr…".

**Beobachtung:** Aufgeklappt / mit „Mehr…": 390 Standard 709 / 841 px, 390 Feld 1 107 / 1 322 px,
360 Standard 775 / 907 px, 360 Feld 1 164 / 1 385 px, 320 Standard 948 / 1 137 px, 320 Feld
1 298 / 1 520 px (bei 568 px Bildschirmhöhe). Davon belegen Warnsatz „Bogen nennt: …" und
„Hinweise: 2 Punkte" 300 bis 400 px vor den Aktionsknöpfen; die Aktionen beginnen 540 bis
900 px unter dem Kartenkopf.

**Folge:** „Abrücken" und „Zug zuordnen" liegen weit unter dem Kopf; wer mehrere Karten
nacheinander bearbeitet, rollt viel.

**Empfehlung:** Häufig gebrauchte Aktionen (Abrücken, Zug zuordnen) vor Warnsatz und Details;
Warnsatz einklappen.

**Nachprüfung:** Aufgeklappte Karte bei 320 x 568 in Feld unter 1 000 px.

### R19-M4 [P3] Quittung nach „Entfernen" steht dauerhaft und belegt 21 bis 26 % der Höhe

**Neu oder alt (Verweis):** alt, R18-H2 / R18-S2 (Quittung dauerhaft stehend) und R18-A8
(Höhe nach „Entfernen" nicht neu gemessen).

**Ort:** Einsatzansicht, Quittungsleiste (`.quittung-daumen`) nach „Meldung entfernen".

**Beobachtung:** Höhe 136 px bei 360 x 640 Standard (21 %), 146 px bei 320 x 568 Feld (26 %),
118 px bei 390 x 844 (14 %); der Text „Entfernt: Meldung Nr. 1 … Nr. 1 bleibt frei. 7 Tage im
Papierkorb unter der Liste." steht vier Zeilen hoch. Sie bleibt über 25 s stehen, schwindet nicht
von selbst und kehrt nach Verlassen und Wiederöffnen der Einsatzansicht zurück. Sie verdeckt
die Ansichtsleiste und die untere Karte; „Rückgängig" (100 x 44 px) und „✕" (44 x 44 px) sind
ausreichend. Nach „Rückgängig" schrumpft die Leiste auf 61 bis 72 px und verschwindet nach
etwa 12 s.

**Folge:** Auf 320 x 568 in Feld deckt sie ein Viertel des Bildschirms; wer danach die nächste
Karte bearbeitet, tippt auf Karten unter der Leiste oder rollt sie hoch.

**Empfehlung:** Text auf einen Satz kürzen („Nr. 1 entfernt · liegt 7 Tage im Papierkorb"),
Leiste einzeilig; nach wenigen Sekunden oder beim ersten Rollen einziehen, die Rückholung bleibt
über den Papierkorb.

**Nachprüfung:** Quittung nach „Entfernen" höchstens 72 px hoch bei 360 x 640 und 320 x 568.

### R19-M5 [P3] Scanner ohne Kamera, 320 x 568 „Feld": Anleitung in 160 px hohem Fenster, mitten im Satz abgeschnitten — wie R18-M5

**Neu oder alt (Verweis):** alt, R18-M5 (Stand „teilweise").

**Ort:** „Bogen scannen…" auf Gerät ohne nutzbare Kamera, 320 x 568 Feld (360 x 640 Feld ähnlich).

**Beobachtung:** Der Dialog rollt nicht als Ganzes; die gestrichelte Anleitungsbox ist ein
eigenes Rollfenster von etwa 155 px Höhe. Im ersten Bild endet es mit „1. QR-Code des" halb
abgeschnitten; „Bereit — warte auf den Handscanner" und „Hinweise zum Handscanner" liegen
außerhalb und sind erst nach Rollen in der Box zu sehen. Das Rollfenster hat keinen Hinweis
außer dem Textanschnitt. Knöpfe „QR aus Bild einlesen…" (200 x 54) und „Fertig" (71 x 54)
stehen darunter in zwei Reihen mit ungleicher Breite.

**Folge:** Wer mit USB-Handscanner arbeitet, sieht den Bereitschaftsstatus („Bereit — warte auf
den Handscanner") nicht und weiß nicht, ob der Scan angenommen wird.

**Empfehlung:** Bereitschaftsstatus aus der Box nehmen und über die Knöpfe stellen; in Feld
auf kleinen Bildschirmen den ersten Satz als Anleitung, den Rest unter „Hinweise".

**Nachprüfung:** Bei 320 x 568 in Feld ist der Bereitschaftsstatus ohne Rollen sichtbar und kein
Text mitten in der Zeile abgeschnitten.

### R19-M6 [P3] Assistent: Kopf und Schrittleiste schieben das erste Feld bei 320 px „Feld" auf 65 % der Höhe, Schritt 2 unter den Falz

**Neu oder alt (Verweis):** alt, R18-W7 (erstes Eingabefeld unter 200 px) und R18-M9
(Schrittreiter bei 320 px).

**Ort:** Assistent „Einheit manuell erfassen…", 320 x 568 Feld (und 360 Feld, 390 Feld).

**Beobachtung:** Erstes Feld („Organisation") y = 371 px bei 320 Feld (65 % der Höhe), 290 px bei
360 Feld, 272 px bei 390 Feld; Standard 236 bis 255 px. Schritt 2 („Einsatz"): erstes Feld bei
320 Feld y = 669 px und damit unter dem Falz (568 px), bei 360 Standard y = 427 px. Die
Schrittleiste umbricht bei 320 Feld in zwei Reihen, der Reiter „6" steht allein in der zweiten
Reihe in voller Breite; Kopf bis Fußleiste: 217 px oben plus 65 px unten (50 % der Höhe). Die
Fußleiste (65 px) liegt darüber hinaus fest.

**Folge:** Im ersten Bild zeigt Feld einen Kopf und eine Zusammenfassung statt eines Felds; auf
Schritt 2 steht zuerst ein Absatz von 8 Zeilen („Aufnahme am Meldekopf: …").

**Empfehlung:** Schrittleiste einzeilig (Zahlen ohne Wortteil, gleiche Breite), Kopf mitrollen
lassen, Einleitungstext von Schritt 2 hinter einen Aufklapper.

**Nachprüfung:** Bei 320 x 568 in Feld liegt das erste Eingabefeld jedes Schritts über 300 px
und die Schrittleiste ist einzeilig.

### R19-M7 [P3] Schnellerfassung: „Ort der Einheit (Pflicht)" erst nach ein bis zwei Bildschirmen

**Neu oder alt (Verweis):** alt, R18-W7 (Schnellerfassung, Stand „Rest").

**Ort:** Einsatzansicht → „Einheit schnell erfassen (nur Stärke)…", Schritt 1.

**Beobachtung:** Der Hinweis „Schnellerfassung: Ort hier, Stärke in Schritt 3" steht über den
Feldern Organisation, Organisationsname, Einheitstyp, Ebene; das Pflichtfeld „Ort der Einheit"
liegt bei 360 x 640 Standard auf y = 870 px (136 % der Höhe), bei 320 x 568 Feld auf y = 1 195 px
(210 %). Das erste sichtbare Feld ist die Organisation (y = 384 px bei 360 Standard).

**Folge:** Eine Funktion, die „Ort und Stärke vom Zettel" in Sekunden erfassen soll, verlangt
zwei Bildschirme Rollen, bevor der Ort eingetragen ist.

**Empfehlung:** In der Schnellerfassung Ort und Einheitstyp zuerst; Organisation, Ebene und
Kürzel hinter „Weitere Angaben".

**Nachprüfung:** „Ort der Einheit" bei 360 x 640 im ersten Bildschirm (y unter 500).

### R19-M8 [P3] Querformat 568 x 320 „Feld": Kennzahl-Beschriftungen brechen mitten im Wort („EINHEIT/EN", „MANNSCH/.")

**Neu oder alt (Verweis):** neu (Umfeld R18-M8, Kennzahlkacheln).

**Ort:** Einsatzansicht, Kennzahlen „7 EINHEITEN … 65 GESAMT", 568 x 320 in „Feld".

**Beobachtung:** Bei fünf Spalten à 77 px ist die Beschriftung 15,68 px groß; „EINHEITEN" und
„MANNSCH." umbrechen auf zwei Zeilen („EINHEIT" / „EN", „MANNSCH" / „."), die Kacheln sind 47 px
statt 24 px hoch, die Trennlinien laufen mitten durch die zweite Zeile. 640 x 360 Feld und alle
anderen Viewports sind sauber.

**Folge:** Gering; die Kennzahlen im Querformat wirken kaputt.

**Empfehlung:** In dieser Breite Beschriftungen kürzen („Einh.") oder das 3+2-Raster wie im
Hochformat verwenden.

**Nachprüfung:** Keine umbrochenen Wörter in den Kacheln bei 568 x 320 in Feld.

### R19-M9 [P3] Querformat: Hauptaktionen liegen unter dem Falz — wie R18-G2 / R18-S1

**Neu oder alt (Verweis):** alt, R18-G2 / R18-S1 (Aufnahmeknöpfe unter dem Falz).

**Ort:** Startseite und Einsatzansicht quer, 640 x 360 und 568 x 320.

**Beobachtung:** Startseite mit Sammlung: „Öffnen" bei y = 332 px (640 x 360 Standard), 364 px
(640 x 360 Feld), 325 px (568 x 320 Standard) und 418 px (568 x 320 Feld) — bei Fensterhöhen von
360 und 320 px; im ersten Bild stehen nur Kopfzeile, Titel, Ansichtswahl und Offline-Hinweis.
Einsatzansicht: „Bogen scannen…" bei y = 279 px (640 x 360, 57 px hoch), 317 px (640 x 360 Feld)
und 341 px (568 x 320 Feld, unter dem Falz); die feste Ansichtsleiste (y = 308 bis 360) liegt
über der Unterkante von „Bogen scannen…". Der erste Bildschirm besteht aus Kopf (370 px bei
568 x 320 Feld) und Kennzahlen.

**Folge:** Wer das Gerät quer in der Halterung führt, muss rollen, um „Öffnen" oder „Bogen
scannen…" zu erreichen.

**Empfehlung:** Im Querformat den Kopf auf eine Zeile verdichten und die Hauptaktion neben die
Kennzahlen stellen; Offline-Hinweis unter die Sammlung.

**Nachprüfung:** „Öffnen" und „Bogen scannen…" quer vollständig im ersten Bild.

### R19-M10 [P3] Assistent quer: nur ein Feld im ersten Bild, „gespeichert" ohne Schrift, Zettelzeile mit führendem Doppelpunkt — wie R18-M6

**Neu oder alt (Verweis):** alt, R18-M6 (Stand „behoben" für Hochformat).

**Ort:** Assistent aus der Einsatzansicht, 640 x 360 und 568 x 320, Standard und Feld.

**Beobachtung:** Erstes Eingabefeld bei y = 200 px (640 x 360 Standard) beziehungsweise 225 px
(568 x 320 Feld), feste Fußleiste ab y = 304 beziehungsweise 255 px; zwischen Kopf und Leiste
bleiben 100 bis 105 px, in Feld 30 px. Die Statuszeile „✓ gespeichert · 04:24 Uhr · nur auf
diesem Gerät" hat Schriftgröße 0 und zeigt nur „✓ 04:24". Die Zusammenfassung „Angaben vom
Zettel (optional)" zerfällt in zwei Spalten mit einer Lücke; die zweite beginnt mit einem
einzelnen Doppelpunkt („: Eingetroffen um, Abgerückt um, Nr., Zug"). Die Beschriftung
„In Einsatz übernehmen" hat im Querformat eine auffällig weite Lücke zwischen „Einsatz" und
„übernehmen".

**Folge:** Quer ist kaum ein Feld sichtbar; „gespeichert" wird nicht mehr ausgeschrieben, und
die Zettelzeile sieht defekt aus.

**Empfehlung:** Quer Kopf auf eine Zeile und mitrollen lassen; Zusammenfassung als ein
Textfluss ohne führenden Doppelpunkt.

**Nachprüfung:** Bei 640 x 360 mindestens zwei Felder sichtbar; Zettelzeile ohne Doppelpunkt am
Zeilenanfang.

### R19-M11 [P3] Chip „⚠ Anderer Einsatz? Prüfen ▸" auf der eingeklappten Karte tut nur das Aufklappen

**Neu oder alt (Verweis):** neu (Umfeld R18-K6 / R18-M4, „Gehört zu dieser Lage").

**Ort:** Eingeklappte Karte Nr. 1 und Nr. 4 (360 x 640, 210 x 44 px).

**Beobachtung:** Der Chip sieht wie ein Knopf mit Pfeil aus. Ein Tipp darauf wird vom
Aufklapp-Knopf der Karte aufgefangen (Playwright: „karte-aufklappen intercepts pointer
events") und klappt die Karte nur auf (`.karte-offen` 0 auf 1); der Entscheidungsknopf „Gehört
zu dieser Lage" liegt danach etwa 400 px tiefer in der Karte (y = 409 px innerhalb der Karte
bei 390 Standard).

**Folge:** „Prüfen ▸" verspricht Prüfen, zeigt aber nur die Karte; wer die Frage beantworten
will, muss den Warnsatz suchen.

**Empfehlung:** Nach dem Aufklappen zum Warnsatz scrollen oder den Chip als reine Marke ohne
Pfeil darstellen.

**Nachprüfung:** Tipp auf den Chip bringt „Gehört zu dieser Lage" in den ersten Bildschirm.

### R19-M12 [P3] „Einsatz als beendet markieren": keine Rückmeldung am Finger, Knopf verschwindet

**Neu oder alt (Verweis):** neu (Umfeld R18 „Übergabe und Abschluss", `eeb.abschluss.v1`).

**Ort:** Einsatzansicht, Abschnitt „Übergabe und Abschluss", 360 x 640.

**Beobachtung:** Der Tipp markiert den Einsatz sofort als beendet, ohne Rückfrage und ohne
Quittung. Die Meldung „Einsatz beendet 28.10.2026, 04:29 — noch offen: Weitergabe-Datei …
Wieder öffnen" erscheint am Anfang desselben Abschnitts und im Kopf der Seite, also oberhalb des
sichtbaren Bereichs. Im Bild bleibt der Abschnitt ohne Knopf und ohne Hinweis zurück
(Übergabe-Zeilen und „Einsatz verwalten").

**Folge:** Wer unten tippt, sieht, dass der Knopf weg ist, aber nicht, was geschehen ist oder
wie man es rückgängig macht („Wieder öffnen" steht außerhalb des Bildes).

**Empfehlung:** Quittungsleiste „Einsatz beendet · Rückgängig" (wie bei „Entfernen").

**Nachprüfung:** Nach dem Tipp zeigt der sichtbare Bereich die Meldung und einen Weg zurück.

### R19-M13 [P3] „Lagemonitor"-Block auf dem Telefon: 460 bis 650 px vor „Übergabe und Abschluss", Knöpfe stoßen ohne Abstand an die Karte

**Neu oder alt (Verweis):** neu.

**Ort:** Einsatzansicht unterhalb der Exporte: „Lagemonitor für den Fernseher", Felder
„Funkrufname", „Einsatzbeginn", „Jetzt", „Lagemonitor öffnen" (360 x 640 und 320 x 568 Feld).

**Beobachtung:** Der Block ist 463 px (360 Standard) beziehungsweise 645 px (320 Feld) hoch und
beschreibt ein zweites Fenster „auf den Fernseher ziehen (HDMI, erweiterter Bildschirm)". Die
Knöpfe „Jetzt" und „Lagemonitor öffnen" enden bei y = 4178 px, die Karte „Übergabe und
Abschluss" beginnt bei y = 4178 px: 0 px Abstand. „Übergabe vermerken…" steht als
unterstrichener Text 12 px eingerückt gegenüber den Zeilen darüber (Knopf von 175 x 44 px).

**Folge:** Eine Fernseher-Funktion steht zwischen Export und Übergabe und verlängert die Seite
am Telefon; die Knöpfe sehen an der Karte angeklebt aus.

**Empfehlung:** Lagemonitor-Block hinter einen Aufklapper; Abstand über der Karte;
„Übergabe vermerken…" als Knopf.

**Nachprüfung:** Mindestens 16 px zwischen „Lagemonitor öffnen" und der folgenden Karte.

### R19-M14 [P3] Tabelle: Einheitsname bei „…" abgeschnitten, Warnung in drei Zeilen, leere Spalte „Auftrag"

**Neu oder alt (Verweis):** alt, Umfeld R18-E5 / R18-S10 (Tabelle am Telefon).

**Ort:** Einsatzansicht → „Tabelle", Kernspalten, 360 x 640 und 320 x 568 in Feld (Standard
ähnlich).

**Beobachtung:** „THW Müllheim Fachgruppe Schwere…" endet mit „…", der Typ („Bergung (B)")
fehlt; Nr. 4: „THW Haßmersheim Fachgruppe…". Die Spalte „Eingetr." zeigt „27.10., 18:18" und
darunter „⚠ Stand vor 102 Tagen" in drei Zeilen; die Spalte „Auftrag" ist in allen acht Zeilen
leer. Zeilen sind 94 bis 105 px hoch, die Tabelle mit acht Zeilen etwa 760 px.

**Folge:** Zwei Einheiten mit ähnlichem Namen sind in der Tabelle nicht sicher zu
unterscheiden; eine leere Spalte belegt Breite, die die Warnung bräuchte.

**Empfehlung:** Namen mehrzeilig ohne Abschneiden, Warnung als kurzes Symbol mit Zahl,
leere Kernspalte ausblenden, solange kein Auftrag vorliegt.

**Nachprüfung:** Kein „…" in der Einheitsspalte; Zeilenhöhe höchstens 72 px bei 360 x 640.

### R19-M15 [P3] Dialoge bei 320 px „Feld": „Neue Einsatz-Sammlung" zeigt nur ein Feld, „Datensicherung" und „Alle Daten löschen" 2,5 bis 3 Bildschirme lang

**Neu oder alt (Verweis):** neu.

**Ort:** Startseite → „Neue Einsatz-Sammlung…", „Datensicherung", „Alle Daten löschen",
320 x 568 Feld.

**Beobachtung:** „Neue Einsatz-Sammlung anlegen": das Rollfenster ist 320 px hoch (Inhalt
498 px) und zeigt nach fünf Zeilen Einleitung nur „Name"; „Art" und „Ort" liegen erst nach
Rollen im Fenster (Hinweis nur ein leichter Schatten). „Datensicherung": Inhalt 1 309 px bei
532 px Fensterhöhe, „Sicherung erstellen…" bei y = 633 px. „Alle Daten löschen": Inhalt 1 551 px
in 532 px, „Endgültig löschen" bei y = 1 413 px, „Abbrechen" bei y = 1 499 px. „Schließen"
steht in beiden im Kopf des Rollbereichs.

**Folge:** Bei den heikelsten Dialogen müssen mehrere Bildschirme gelesen werden; wer den
Dialog nur anschaut, sieht weder alle Felder noch die Folgen.

**Empfehlung:** Einleitungstexte in Feld auf zwei Sätze kürzen, Knöpfe fest am Dialogfuß; die
erklärenden Absätze hinter „Mehr dazu".

**Nachprüfung:** Dialoge bei 320 x 568 in Feld höchstens zwei Bildschirme hoch, Felder und
Hauptknopf gemeinsam sichtbar.
