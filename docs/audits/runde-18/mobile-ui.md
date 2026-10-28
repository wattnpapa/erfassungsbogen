# Audit „Mobile UI", Runde 18 (Darstellung und Bedienung auf dem Telefon)

Prüfer: Rollenaudit `mobile-ui-reviewer` · Datum: 2026-10-27 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (laufender Server, Code-Stand
Commit `ae3a8e9` = `main`) · Zählung: **P0 0 · P1 0 · P2 1 · P3 9**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md` und der
Abschnitt „Stand der Behebung" von Runde 17. Es gibt keine „bekannten Grenzen"; auch Punkte mit
Stand „teilweise" sind gemeldet, wenn sie im Browser noch zu sehen sind.

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen), `isMobile`,
`hasTouch`, Locale de-DE, Tipps per Touch. Viewports 390 x 844, 360 x 640, 320 x 568 sowie quer
640 x 360 und 568 x 320. Ansichten „Standard" und „Feld". Zustand per `localStorage`-Seed:
Sammlung „Hochwasser Musterstadt" mit acht Meldungen aus `examples/thw/`.
Durchlaufen: Startseite, Einsatzansicht (Kacheln, Karten, aufgeklappte Karte, „Mehr…", Zug
zuordnen, Auftrag/Notiz, Details, Tabelle mit Kern- und allen Spalten, Filter, Weitergeben),
Entfernen einer Meldung samt Rückgängig und Papierkorb, Scanner ohne Kamera, Schnellerfassung,
Name/Kontakt, Neue Sammlung, Datensicherung, Geräteschlüssel, „Alle Daten löschen",
Sammlung löschen, Assistent Schritt 1 bis 5 (aus der Einsatzansicht). Gemessen: seitlicher
Überlauf, Bedienziele unter 44 px, Schriften unter 12 px, abgeschnittener Text, Höhe fester
Leisten, Dialoghöhen, Sprung beim Erstbesuch.
Nicht prüfbar: echte Bildschirmtastatur, Safe-Area, WebKit, Kamera, Handschuhe, Licht. Die
„103 Tage" alten Stände stammen aus dem Prüfdatensatz und sind nicht gewertet. Kästchen und
Optionsfelder (24 px, in Feld 30 px) liegen in 48 px hohen Beschriftungen und sind nicht gemeldet.

## Urteil: Behebungen der Runde 17

Im Browser gehalten:

- Doppeltipp: zweimal schnell auf „Entfernen" öffnet genau eine Rückfrage; zweimal schnell auf
  „In Einsatz übernehmen" und auf „Als Sollstärke ablegen" legt genau eine Einheit an (8 auf 9).
- Neuladen: aufgeklappte Karte bleibt offen, der Assistent behält den Entwurf (Einheitstyp).
- Zurück-Geste: aus Einsatzansicht und Assistent führt sie zur Startseite beziehungsweise
  Einsatzansicht, kein Dialog bleibt offen.
- Papierkorb: entfernte Meldung erscheint unter „Zuletzt entfernte Meldungen (1) — 7 Tage
  zurückholbar", auch nach Neuladen; Quittung mit „Rückgängig".
- Fußleisten: Assistent 57 px (Feld 65 px) einzeilig bei 390, 360, 320; Einsatzansicht 57 px;
  Quittung neben der Ansichtsleiste.
- Assistentenkopf (R17-M1), Platzhalter „Einheitstyp" (R17-M4): Einsatzname vollständig,
  Platzhalter kurz. Fußleiste „In Einsatz übernehmen" einzeilig (R17-M3, bei 320 in Feld als
  „Übernehmen").
- Tabelle am Telefon: Kernspalten Einheit, Ges., Meldung vor, Bedarf passen in 356 px.
- Kein seitlicher Überlauf bei 390, 360, 640 x 360, 568 x 320 und 320 in Standard; keine
  Konsolenfehler; Dialogfüße liegen innerhalb der Dialoghöhe.

## Befunde

### R18-M1 [P2] 320 px, „Feld": Bedarfszeile der Einsatzansicht ist breiter als der Bildschirm, Seite wird 360 px breit

**Neu oder alt (Verweis):** neu.

**Ort:** Einsatzansicht, Block „Bedarf:" unter den Kennzahlen, Ansicht „Feld", 320 x 568.

**Beobachtung:** Der Eintrag „Unterbringung 27 Personen ·" (`.bedarf-posten`) bricht nicht um und
reicht bis x = 360. `scrollWidth` der Seite ist 360 bei 320 Fenstergröße (Layout-Viewport 360,
sichtbar 320). Im Bild endet die Zeile mit „Unterbringung 27 Perso" am Rand des Rahmens und
läuft darüber hinaus. In Standard bei 320 und in Feld bei 360 tritt es nicht auf.

**Folge:** Eine Kennzahl der Lage (Unterbringung) ist im Einsatz mit großer Schrift am kleinen
Telefon abgeschnitten; die ganze Seite lässt sich seitlich verschieben und wird gegenüber dem
Gerät unscharf verkleinert oder wackelt beim Wischen.

**Empfehlung:** Posten mit Zeilenumbruch innerhalb des Postens zulassen (Wörter umbrechen,
Breite auf den Rahmen begrenzen).

**Nachprüfung:** Bei 320 x 568 in „Feld" ist `scrollWidth` 320 und „Unterbringung 27 Personen"
vollständig lesbar.

### R18-M2 [P3] Tabelle: Spaltenköpfe 11 px, Marke „anon." 10 px, auch in „Feld"

**Neu oder alt (Verweis):** neu.

**Ort:** Einsatzansicht → „Tabelle", Kopfzeile und Einheitenspalte (390, 360, 320; Standard und
Feld).

**Beobachtung:** Spaltenköpfe „Einheit", „Ges.", „Stärke gesamt", „Meldung vor", „Bedarf" haben
11 px, die Marke „anon." 10 px; Zellen 13 px, Einheitsname 12 px. In „Feld" (große Schrift)
bleibt es bei 11 und 10 px, in Großbuchstaben mit Festbreitenschrift.

**Folge:** Kopfzeile und Marke sind am Telefon im Freien schwer lesbar; „Feld" verspricht
größere Schrift und hält sie hier nicht.

**Empfehlung:** Mindestens 12 px, in „Feld" mitwachsen lassen.

**Nachprüfung:** Keine Schrift unter 12 px in der Tabelle in Standard und Feld.

### R18-M3 [P3] Tabelle mit „Alle Spalten": Einheitenspalte rollt beim seitlichen Wischen mit weg

**Neu oder alt (Verweis):** neu (Umfeld Tabelle am Telefon, R17).

**Ort:** Einsatzansicht → „Tabelle" → „Alle Spalten zeigen" (390 und 360).

**Beobachtung:** Die Tabelle ist 1 915 px (390) beziehungsweise 2 128 px (360 Feld) breit in einem
356 px beziehungsweise 320 px breiten Fenster; die erste Spalte mit Nummer und Name hat
`position: static`. Beim Wischen nach rechts verschwindet der Name; die Zahlen stehen ohne Zeile.

**Folge:** Ab der dritten Spalte ist nicht mehr zu erkennen, zu welcher Einheit eine Zahl gehört.

**Empfehlung:** Erste Spalte am linken Rand halten (festgehalten) oder Nummer als Kurzmarke in
jeder Zeile wiederholen.

**Nachprüfung:** Tabelle ganz nach rechts wischen, die Einheit bleibt erkennbar.

### R18-M4 [P3] Inline-Knopf „Gehört zu dieser Lage" nur 30 px (Standard) beziehungsweise 40 px (Feld) hoch

**Neu oder alt (Verweis):** neu (Umfeld „44-px-Verweise", R17).

**Ort:** Aufgeklappte Karte mit Hinweis „Bogen nennt: …passt das zu dieser Lage?" (360, 640 x 360;
Feld 320).

**Beobachtung:** Der Knopf steht als Textverweis im Warnsatz: 141 x 30 px in Standard, 166 x 40 px
in Feld. Alle übrigen Knöpfe der Karte sind 44 px hoch. Zeilen darüber und darunter sind Text.

**Folge:** Die Entscheidung, ob ein Ortsname zur Lage gehört, ist der kleinste Tipp der Karte;
mit Handschuh trifft man leicht den Satz daneben.

**Empfehlung:** Als eigenen, 44 px hohen Knopf unter den Satz setzen.

**Nachprüfung:** Höhe mindestens 44 px in Standard und Feld.

### R18-M5 [P3] Scanner ohne Kamera: feste Knopfleiste überdeckt Rahmen und Anleitung — wie R16-M3, weiter sichtbar

**Neu oder alt (Verweis):** alt, R16-M3 (Hinweise-Überdeckung) und R17-M3 (Knopfleiste).

**Ort:** „QR-Code scannen…" auf Telefon ohne nutzbare Kamera.

**Beobachtung:** Der Dialog rollt (Inhalt 689 bis 938 px bei 640 bis 568 px Höhe), die drei Knöpfe
„Kamera erneut versuchen", „QR aus Bild einlesen…", „Abbrechen" sind fest. 360 x 640 Standard:
„Kamera erneut versuchen" (532 bis 576) liegt 21 px in der gestrichelten Anleitungsbox (107 bis
553). 320 x 568 Feld: die drei Knöpfe belegen 385 bis 562 px (177 px, 31 % des Bildes), die
Anleitung „1. QR-Code des …" liegt im ersten Bild halb darunter; Knöpfe ungleich breit und
versetzt.

**Folge:** Im ersten Bild ist die Anleitung für den Handscanner nicht zu lesen; ohne Rollen
bleibt unklar, was zu tun ist. Die Box wirkt überklebt.

**Empfehlung:** Knopfleiste unter der Box feststehen lassen und die Box in den verbleibenden
Raum rollen lassen (kein Überdecken); „Kamera erneut versuchen" in die Meldung oben setzen.

**Nachprüfung:** Bei 320 x 568 in Feld überdecken die Knöpfe keinen Text; höchstens 25 % Höhe.

### R18-M6 [P3] Assistent im Querformat: Kopf und Fußleiste belegen 55 bis 62 % der Höhe — wie R17-M2

**Neu oder alt (Verweis):** alt, R17-M2 (Stand „behoben" für Hochformat; im Querformat schlechter).

**Ort:** Assistent aus der Einsatzansicht, quer 640 x 360 und 568 x 320.

**Beobachtung:** Kopf 142 px (Feld 157) plus Fußleiste 56 px (Feld 65): 198 von 360 px (55 %),
Feld 222 von 360 (62 %); bei 568 x 320 198 von 320 (62 %). Das Inhaltsfenster misst 162 px
beziehungsweise 122 px; im ersten Bild steht nur die Überschrift „1. Einheit", kein Feld. In
Hochformat (390, 360, 320) ist es behoben. Die Statuszeile „gespeichert" hat im Querformat
Schriftgröße 0 und ist nicht sichtbar (nur „✓ 00:43").

**Folge:** Querformat bei angestecktem Handscanner oder in der Halterung zeigt kein Eingabefeld
ohne Rollen.

**Empfehlung:** Im Querformat Kopf auf eine Zeile, Schrittleiste in den Kopf rechts, Fußleiste
ohne Beschriftungen; Kopf mitrollen lassen.

**Nachprüfung:** Bei 640 x 360 bleibt mindestens die Hälfte des Bildes für Inhalt, das erste
Feld ist sichtbar.

### R18-M7 [P3] Aufgeklappte Karte: Aktionen stehen einspaltig als bis zu 12 Zeilen, bei 320 px Feld 1 830 px hoch

**Neu oder alt (Verweis):** neu.

**Ort:** Einsatzansicht → Karte aufklappen → „Mehr…".

**Beobachtung:** 390 x 844: aufgeklappt 710 px, mit „Mehr…" 895 px (8 Reihen). 360 x 640: 853 und
1 038 px. 320 x 568 Feld: 1 464 und 1 830 px (7 beziehungsweise 12 Reihen, Breiten 88 bis 215 px,
ungleich). Eine Karte füllt zwei bis drei Bildschirme.

**Folge:** „Abrücken" und „Zug zuordnen" liegen weit unter dem Kopf der Karte; wer mehrere Karten
nacheinander bearbeitet, rollt viel.

**Empfehlung:** Knöpfe zu einem Zweierraster gleicher Breite, „Mehr…" in einer Reihe; oft
gebrauchte Aktionen vor den Details.

**Nachprüfung:** Aufgeklappte Karte bei 320 x 568 in Feld unter 1 000 px.

### R18-M8 [P3] Kennzahlkacheln, 320 px Feld: Trennlinie schneidet die Beschriftung „MANNSCH."

**Neu oder alt (Verweis):** neu.

**Ort:** Einsatzansicht, Kacheln „47 MANNSCH." und „65 GESAMT", 320 x 568 in „Feld".

**Beobachtung:** Die senkrechte Linie zwischen den Kacheln läuft durch den Punkt hinter „MANNSCH."
und die Beschriftung stößt an „GESAMT" („MANNSCH.|GESAMT"). Bei 390 und 360 sauber.

**Folge:** Geringe Lesbarkeit, wirkt wie Überlagerung.

**Empfehlung:** Kachelinnenabstand rechts wie links; Beschriftung kürzen („Mann.") oder umbrechen.

**Nachprüfung:** Bei 320 in Feld keine Berührung von Beschriftung und Trennlinie.

### R18-M9 [P3] Assistent bei 320 px: Schrittreiter 42 bis 43 px breit

**Neu oder alt (Verweis):** neu.

**Ort:** Schrittleiste „1 … 6" im Kopf des Assistenten, 320 x 568 (Standard 43 x 44, Feld 42 x 49).

**Beobachtung:** Der aktive Reiter („1. Einheit") ist 42 bis 43 px breit, die übrigen sind ähnlich
schmal und liegen ohne Abstand aneinander.

**Folge:** Gering; mit Handschuh wechselt man leicht den falschen Schritt.

**Empfehlung:** Reiter mindestens 44 px breit (Zahlen ohne Wortteil, gleiche Breite).

**Nachprüfung:** Breite jedes Reiters mindestens 44 px bei 320.

### R18-M10 [P3] Erstbesuch mit Sammlung: „Öffnen" und alles darunter springt nach 2,5 bis 3,3 s um 90 px nach oben — wie R17-H1

**Neu oder alt (Verweis):** alt, R17-H1 (Stand „teilweise"; davor R16-H3).

**Ort:** Startseite, Hinweis „Jetzt offline bereit …" über der Einsatz-Sammlung (390, 360).

**Beobachtung:** Der Hinweis hat zunächst 144 px (Mindesthöhe 144 px, Text lässt eine leere
Fläche), nach 2,5 s (390) beziehungsweise 3,3 s (360) wechselt er auf 54 px. „Öffnen" springt von
y 497 auf y 407. Ohne Sammlung: derselbe Wechsel, „So funktioniert’s" 1 195 auf 1 105. Die
Layout-Shift-Messung des Browsers meldet 0, der Sprung ist dennoch real.

**Folge:** Wer gleich nach dem Laden auf „Öffnen" zielt, trifft darunterliegende Fläche; die
feste Höhe gilt nur für den Ladezustand, nicht für den Endzustand.

**Empfehlung:** Die Höhe des Endzustands von Anfang an reservieren (oder den Hinweis erst im
Endzustand einblenden); keinen leeren Raum im Ladezustand.

**Nachprüfung:** „Öffnen" und „So funktioniert’s" ändern ihre y-Lage von 0 bis 6 s nicht.

## Zusammenfassung

Die Behebungen der Runde 17 (Doppeltipp, Neuladen, Zurück-Geste, Fußleisten, Papierkorb für
entfernte Meldungen, Kernspalten, Assistentenkopf) halten im echten Browser. Offen bleiben ein
P2 (Bedarfszeile bei 320 px in „Feld") und neun P3-Darstellungspunkte, davon drei Altbefunde
(R16-M3/R17-M3, R17-M2, R17-H1).
