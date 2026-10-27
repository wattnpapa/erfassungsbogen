# Audit „Helfer im Feld“, Runde 18 (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-10-27 ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Code-Stand
Commit `ae3a8e9` (`main`).

Zählung: **P0 0 · P1 0 · P2 0 · P3 9**

Reiner Prüfbericht, keine Codeänderung. Es gibt keine „bekannten Grenzen“: Reste aus
den Runden 11 bis 17 („teilweise“, „offen“), die im Browser noch zu beobachten sind,
stehen mit Verweis im Feld „Neu oder alt (Verweis)“.

## Prüfaufbau

Playwright/Chromium (globales Modul, `chromium.launch()` ohne Optionen; die
Projektkopie fand keinen Browser), `isMobile`/`hasTouch`, Locale de-DE, Telefon
360 × 640 und 390 × 844, frischer Kontext je Lauf. Tipps als Touch-Tipps mit
Koordinaten, damit Abstände zwischen Tipps stimmen. Einsatzdaten: Sammlung
„Übung Weser“ (Art „Übung“), darin 3, 4 oder 7 Beispielbögen aus `examples/thw/`
über „Bögen einlesen…“; eigener Bogen im Assistenten (Husum); Schnellerfassung.

Durchgespielt: Startseite (Erstbesuch mit Messung der Knopflage, Entwurf nach
Neuladen ohne Netz, Einsatzkarte), Assistent Schritt 1 bis 6 (Ortsvorschlag,
Einheitstyp, „Namen einfügen…“, Fahrzeug, Übersicht, „Bogen schließen“),
Schnellerfassung, Sammlung: Kenntnisnahme, Karte aufklappen, „Abrücken“ und
„Wieder anwesend“ (auch Doppeltipp), „Mehr…“, „Entfernen“ mit Papierkorb
(Neuladen, Zurückholen, endgültig löschen), „Zug zuordnen“, „Auftrag/Notiz“,
Tabelle, Scanner ohne Kamera, Dateien einlesen (Müll, Duplikat, kaputtes Bild),
Sammel-PDF, Lageblatt, beide CSV, Excel, Neuladen mit aufgeklappter Karte,
Browser-Zurück (auch bei offenem Dialog), Anzeigemodi „Nacht“, „Feld“, „Dunkel“,
automatische Zielgrößenmessung auf Startseite, Einsatz, Karte, Details.

**Nicht verifiziert:** echte Handschuhe und nasse Finger, Sonnenlicht und
Dunkelheit am Display, Kamera-Scan, echte Bildschirmtastatur und Autokorrektur
(die Befunde zu Autokorrektur beruhen auf den Attributen der Felder), WebKit/Safari,
echtes Drucken, voller Speicher, Inhalt der erzeugten PDF-Seiten, Datumsfelder in
deutscher Darstellung (das Headless-Chromium zeigt `10/27/2026`). Die Hinweise
„Anderer Einsatz?“ und „Zeitraum vorbei“ stammen aus der Herkunft der Beispielbögen
und wurden nicht gewertet.

## Urteil

Alle Szenarien wurden **abgeschlossen**, ohne Datenverlust und ohne Sackgasse. Kein
P0-, P1- oder P2-Befund; neun Kleinigkeiten (P3), davon fünf Reste aus Runde 17.

## Nachprüfung der Behebungen aus Runde 17 im echten Browser

- **Doppeltipp:** Zweiter Tipp auf denselben Knopf im Abstand von 120 ms auf „Abrücken“
  wird verworfen (ein Klick, Knopf wird „Wieder anwesend“); „Weiter →“ im Abstand von
  150 und 350 ms geht nur einen Schritt, ab 600 ms zwei. „Mehr…“ nach „Abrücken“ reagiert
  schon nach 150 ms (R17-H3 zu anderen Knöpfen: behoben). Hält.
- **Startseite beim Erstbesuch (R17-H1):** Lage von „Neue Einsatz-Sammlung…“ und
  „Einheit schnell erfassen“ über sieben Sekunden alle 250 ms gemessen: unverändert 753
  und 811 px. Hält.
- **Neuladen:** aufgeklappte Karte bleibt offen, Bildlaufstand 1497 px bleibt gleich.
  Hält. **Zurück-Geste:** aus der Einsatzansicht zur Startseite, vorwärts zurück; bei
  offenem Dialog (Rückfrage, „Namen einfügen“) schließt sie den Dialog und die Namensliste
  bleibt erhalten. Hält.
- **Papierkorb für entfernte Meldungen:** „Meldung entfernen“ nennt die Folgen
  (Nummern rücken auf, 7 Tage unter „Zuletzt entfernte Meldungen“); nach Neuladen steht
  der Eintrag mit Ablaufdatum da, „Zurückholen“ und „Endgültig löschen…“ (mit Rückfrage)
  funktionieren. Hält (Feinheiten siehe R18-H3).
- **Abstände, Fußleiste:** Fußleiste im Assistenten 57 px bei 360 × 640 und 390 × 844;
  Kopf und Leiste ohne seitliches Überlaufen in „Standard“, „Feld“, „Nacht“, „Dunkel“.
  Alle Knöpfe und Verweise messen mindestens 44 px Höhe (Ausnahmen R18-H7). Hält.
- **Tabelle am Telefon:** vier Kernspalten (Einheit, Ges., Meldung vor, Bedarf) in 326 px
  Breite ohne Wischen, Zeilen 72 bis 102 px, „Alle Spalten zeigen“ vorhanden. Hält
  (R17-H8 behoben).
- **„✓ Abgerückt“ (R17-H4):** heißt jetzt „Wieder anwesend“. Hält. **Schnellerfassung
  (R17-H6):** „In Einsatz übernehmen“ ist der dunkle Hauptknopf, einzeilig. Hält.
  **„Namen einfügen…“ (R17-H5, „Kevin Meier 0171 1234567“):** wird mit Telefon
  übernommen. Teilweise, siehe R18-H6.
- **Exporte:** Sammel-PDF (7 Bögen, 2,2 s), Lageblatt, „Übersicht als CSV“, „Alle Daten als
  CSV“, Excel erzeugen je eine Datei; Quittung „als PDF erzeugt“. Hält.
- **Neuladen ohne Netz:** Startseite mit „Entwurf … wiederhergestellt. ‚Fortsetzen‘
  öffnet ihn dort, wo du warst.“ Hält.

## Befunde

### R18-H1 [P3] Die Quittung bleibt für immer stehen und verdeckt solange den Umschalter „Ansicht“

**Neu oder alt (Verweis):** alt — Rest von R17-H7 (Quittungs- und Ansichtsleiste; die
Fläche ist auf rund 15 % gesunken, die Leiste „Ansicht“ ist jetzt statt dessen weg).
**Evidence:** Observed (360 × 640; Abfrage nach 10, 20, 30, 45, 60 und 90 s).
**Ort:** Einsatzansicht, untere Kante, nach „Zur Kenntnis genommen“, „Abrücken“,
„Entfernen“ und anderen Aktionen.
**Beobachtung:** Die Quittung („Zur Kenntnis genommen: 3 Einheiten“, „Rückgängig“, „✕“)
verschwindet nie von allein, auch nach 90 s nicht. Solange sie steht, ist der Knopf
„Ansicht: Standard“ (Nacht, Feld) nicht erreichbar (nicht sichtbar); er kehrt erst
nach „✕“ oder der nächsten Aktion zurück. Die Quittung deckt das Ende der Liste und
die Knöpfe „Einsatz weitergeben / sichern“ ab.
**Erwartung des Helfers:** Eine Bestätigung, die nach einigen Sekunden von allein
geht; die Anzeigeeinstellung bleibt immer greifbar, auch nachts.
**Folge:** Gering. Wer nachts auf „Nacht“ umschalten will, sucht den Knopf, den die
Quittung der letzten Aktion verdeckt; die Quittung einer Stunde zuvor stünde noch da
und würde ein „Rückgängig“ für eine längst überholte Handlung anbieten.
**Empfehlung:** Quittung nach etwa 15 bis 20 s ausblenden (das Rückgängig bleibt
dann über die Historie); Ansichtsschalter neben oder oberhalb der Quittung belassen.
**Nachprüfung:** Aktion ausführen, 20 s warten: Quittung ist weg, „Ansicht“ erreichbar;
bei stehender Quittung ist „Ansicht“ sichtbar und ≥ 44 px.

### R18-H2 [P3] Quittung „Entfernt: …“ ist nach vier Zeilen abgeschnitten

**Neu oder alt (Verweis):** neu.
**Evidence:** Observed (360 × 640, nach „Meldung entfernen“).
**Ort:** Einsatzansicht, Quittung nach dem Entfernen einer Meldung.
**Beobachtung:** „Entfernt: Meldung Nr. 1 „THW Albstadt Zugtrupp Technischer Zug“ (4
Personen). Die Einheit…“ — der Satz endet mit „…“, der wichtige Rest (wo die Meldung
nachzulesen ist: 7 Tage im Papierkorb) fehlt in der Quittung.
**Erwartung des Helfers:** Er liest, dass die Meldung zurückholbar ist und wo.
**Folge:** Gering. „Rückgängig“ steht daneben; wer die Quittung weggetippt hat,
findet den Papierkorb nur, wenn er die Liste bis zum Ende scrollt („Zuletzt entfernte
Meldungen“).
**Empfehlung:** Satz kürzen („Entfernt: Nr. 1 THW Albstadt. 7 Tage im Papierkorb
unter der Liste.“) statt zu kürzen und zu verschweigen.
**Nachprüfung:** Entfernen, Quittung lesen: der Hinweis auf den Papierkorb steht
vollständig da.

### R18-H3 [P3] Papierkorb: „Zurückholen“ und „Endgültig löschen…“ berühren sich, der Papierkorb steht erst unter der Liste

**Neu oder alt (Verweis):** neu — Folge der Behebung von R17-E2/D6.
**Evidence:** Observed (360 × 640, nach Neuladen).
**Ort:** Einsatzansicht, ganz unten unter der letzten Karte: „Zuletzt entfernte
Meldungen (1) — 7 Tage zurückholbar“, aufgeklappt.
**Beobachtung:** „Zurückholen“ (185,355, 113 × 44) liegt rechts am Zeilenende direkt
über „Endgültig löschen…“ (56,399, 161 × 44): Abstand 0 px, versetzt ausgerichtet.
Der Eintrag ist nur zu sehen, wenn man die ganze Liste durchscrollt; oben in der Seite
weist nichts auf entfernte Meldungen hin.
**Erwartung des Helfers:** Zwei getrennte, gleich ausgerichtete Knöpfe; ein Hinweis
oben bei den Zahlen („1 entfernte Meldung im Papierkorb“).
**Folge:** Gering. Mit Handschuh ist ein Fehltipp auf den roten Knopf möglich; er
fragt noch einmal zurück („Meldung endgültig löschen?“), es geht nichts verloren. Wer
eine entfernte Meldung sucht, findet sie spät.
**Empfehlung:** Knöpfe untereinander mit mindestens 12 px Abstand, gleiche
Ausrichtung; „Endgültig löschen…“ abgesetzt; Verweis „Papierkorb (1)“ im Kopf der
Einheitenliste.
**Nachprüfung:** 360 × 640: Abstand der beiden Knöpfe mindestens 12 px; oberhalb der
Liste steht ein Verweis auf den Papierkorb, solange er nicht leer ist.

### R18-H4 [P3] Knöpfe in Rückfragen reagieren in der ersten Sekunde nicht, auch „Abbrechen“

**Neu oder alt (Verweis):** alt — Rest von R17-H3 (Reichweite der Doppeltipp-Sperre).
**Evidence:** Observed (360 × 640; Rückfrage „Meldung entfernen?“, „Abbrechen“ nach
300 und 700 ms: Dialog bleibt offen; nach 1100 und 1600 ms: schließt).
**Ort:** Rückfragen („Meldung entfernen?“, „Meldung endgültig löschen?“).
**Beobachtung:** Ein schneller Tipp auf „Abbrechen“ direkt nach dem Öffnen bewirkt
nichts, ohne dass eine Meldung erscheint.
**Erwartung des Helfers:** „Abbrechen“ wirkt immer; die gefährliche Bestätigung darf
kurz gesperrt sein, der Rückzug nicht.
**Folge:** Gering. Wer aus Versehen „Entfernen“ getippt hat und sofort „Abbrechen“
tippt, muss ein zweites Mal tippen; er meint zunächst, die App hänge.
**Empfehlung:** Die Sperre nur für den bestätigenden Knopf; „Abbrechen“ ohne Sperre.
**Nachprüfung:** Rückfrage öffnen, nach 300 ms „Abbrechen“ tippen: Dialog schließt.

### R18-H5 [P3] Einsatzort/Auftrag (Schritt 2), „Änderungen bzw. Sondergerät“ (Schritt 4), „Sonstiges“ (Schritt 5) und „Zug“ der Zettel-Angaben lassen Autokorrektur an

**Neu oder alt (Verweis):** alt — Rest von R17-H2 (die Felder aus R17-H2 sind behoben:
Funkrufname, Einsatzname, Ort/Auftrag im Dialog und in der Einsatzansicht, Auftrag/Notiz
haben `autocorrect=off`, `spellcheck=false`).
**Evidence:** Observed für die Attribute (`autocorrect` nicht gesetzt, `spellcheck` =
true; 360 × 640). Wirkung auf einer echten Tastatur **nicht verifiziert** (Likely).
**Ort:** (a) Assistent Schritt 2, „Einsatzort / Auftrag“ („z. B. Fernmeldebauübung
Kabelblitz“); (b) Schritt 4, „Änderungen bzw. Sondergerät“; (c) Schritt 5, „Sonstiges
(Freitext)“; (d) Schnellerfassung, „Angaben vom Zettel“ › „Nr.“ und „Zug“.
**Erwartung des Helfers:** Eingaben wie „Deichabschnitt Nord“ oder „MzKW“ bleiben
unverändert.
**Folge:** Gering. Eine Korrektur ändert Ort und Sondergerät im PDF und in der Sammlung
unbemerkt.
**Empfehlung:** Autokorrektur und Rechtschreibprüfung an (a), (b) und (d) abschalten;
bei (c) bewusst entscheiden.
**Nachprüfung:** Die Felder öffnen: `autocorrect=off`, `spellcheck=false`.

### R18-H6 [P3] „Namen einfügen…“: Nummer mitten in der Zeile mit Funktion dahinter wird als Nachname „ZTrFü“ gelesen

**Neu oder alt (Verweis):** alt — Rest von R17-H5 (Nummer am Zeilenende ist behoben).
**Evidence:** Observed (360 × 640; Eingabe `Jürgen Weber +49 171 9876543 ZTrFü` neben
vier sauber erkannten Zeilen).
**Ort:** Schritt 3 › „Namen einfügen…“, Vorschau.
**Beobachtung:** Die Zeile erscheint als „ZTrFü, Jürgen Weber +49 171 9876543 · wird
nicht übernommen · kein Name?“. Der Knopf heißt „5 Personen übernehmen (1 nicht)“ und
nennt die Zeile also; dennoch fehlt Jürgen Weber in der Liste.
**Erwartung des Helfers:** Jürgen Weber mit Telefon und Funktion ZTrFü; die Reihenfolge
„Name, Nummer, Funktion“ ist in Alarmlisten üblich.
**Folge:** Gering. Die Zeile ist markiert, sie kann angehakt werden, dann steht die
Funktion als Nachname im Bogen.
**Empfehlung:** Funktionswort nach der Rufnummer erkennen und abtrennen.
**Nachprüfung:** Die Zeile einfügen: Vorschau „Weber, Jürgen · Tel. +49 171 9876543 ·
ZTrFü“, Knopf zählt mit.

### R18-H7 [P3] Wenige Ziele unter 44 px: „In der Liste zeigen“ 30 px hoch, „DRK“ und „ASB“ nur 35 und 33 px breit

**Neu oder alt (Verweis):** alt — Rest von R17-H9 (Höhe der Verweisreihe ist behoben,
alle messen jetzt 44 px Höhe).
**Evidence:** Observed (360 × 640 und 390 × 844; automatische Messung über Startseite,
Einsatz, Karte und Details).
**Ort:** (a) Einsatzansicht, Kasten „Zuletzt abgelegt: „THW Husum“ · jetzt 1 Einheit,
Gesamt 9. In der Liste zeigen“ — Verweis 114 × 30 px; (b) Startseite, Abschnitt „Für
welche Organisationen?“: „DRK“ 35 × 44, „ASB“ 33 × 44 px, in Reihe mit 12 bis 20 px
Abstand.
**Erwartung des Helfers:** Eine Fläche, die der Daumen im Handschuh trifft.
**Folge:** Gering. (a) ist der Weg zur gerade abgelegten Einheit; ein Fehltipp trifft
den Text daneben und tut nichts. (b) sind Nachschlageseiten.
**Empfehlung:** (a) als Knopf mit 44 px Höhe; (b) Mindestbreite 44 px.
**Nachprüfung:** Messung aller Verweise und Knöpfe: keine Fläche unter 44 × 44 px
außer Kästchen in 44 px hohen Beschriftungen.

### R18-H8 [P3] Scanner ohne Kamera: „Kamera erneut versuchen“ liegt auf dem Rahmen, die Knöpfe darunter sitzen 8 bis 12 px davon entfernt

**Neu oder alt (Verweis):** neu.
**Evidence:** Observed (360 × 640, Gerät ohne nutzbare Kamera).
**Ort:** „Bogen scannen…“ › Vollbild mit der Meldung „Dieses Gerät meldet keine nutzbare
Kamera.“
**Beobachtung:** „Kamera erneut versuchen“ (82,532, 196 × 44) überlappt den unteren
Rand des gestrichelten Rahmens („Am Telefon: Foto … Handscanner“); darunter folgen
„QR aus Bild einlesen…“ (dunkel) und das kleinere weiße „Fertig“ (69 × 44) mit 8 px
Abstand zum Knopf darüber und 12 px untereinander. Die Meldung steht in blassem Rosa
auf Schwarz.
**Erwartung des Helfers:** Ein klarer Hauptweg (Foto einlesen) und ein getrennter
Knopf zum Verlassen.
**Folge:** Gering. Mit Handschuh trifft man leicht „Fertig“ statt „QR aus Bild
einlesen…“; beide sind folgenlos (der Scanner schließt, ein Tipp mehr).
**Empfehlung:** Knöpfe aus dem Rahmen herausnehmen, mindestens 16 px Abstand, „Fertig“
von den Einlese-Knöpfen räumlich trennen; Meldung in kontrastreicher Farbe.
**Nachprüfung:** 360 × 640: kein Knopf überlappt den Rahmen; Abstände ≥ 16 px.

### R18-H9 [P3] Dateinamen der Exporte tragen Datum und Uhrzeit ohne Trenner: „eeb-einsatz-272239okt26_Uebung_Weser.pdf“

**Neu oder alt (Verweis):** neu.
**Evidence:** Observed (Sammel-PDF, beide CSV, Excel, Lageblatt: gleiche Schreibweise).
**Ort:** Namen der heruntergeladenen Dateien.
**Beobachtung:** „272239okt26“ meint 27. um 22:39 Uhr im Oktober 2026; ohne Kenntnis des
Schemas liest man es nicht. Sortiert man den Download-Ordner nach Namen, ordnen sich
Dateien nicht nach Zeit.
**Erwartung des Helfers:** „2026-10-27_2239“ oder ähnlich, lesbar und sortierbar.
**Folge:** Gering. Bei mehreren Exporten am Einsatztag fällt es schwer, die letzte
Fassung der Weitergabe zu erkennen, besonders bei der Übergabe an die Ablösung.
**Empfehlung:** Zeitstempel als `JJJJ-MM-TT_HHMM`; Namen der Einsatzdateien sonst
unverändert.
**Nachprüfung:** Export erzeugen: Dateiname beginnt mit lesbarem Datum und Uhrzeit,
Sortierung nach Namen entspricht der zeitlichen Folge.

## Comprehension check

- Orientation: understood
- Next action: understood
- System status: understood (gespeichert/„nur auf diesem Gerät“, Quittungen,
  Papierkorb mit Ablaufdatum; die dauerhaft stehende Quittung siehe R18-H1)
- Error recovery: understood (Rückgängig bei Kenntnis, Abrücken, Entfernen, Namen
  übernehmen; Rückfragen; Papierkorb; Entwurf nach Neuladen; Browser-Zurück)
- Field suitability: limited (nicht verifiziert: Handschuhe, Sonnenlicht, Kamera,
  echte Tastatur; alle gemessenen Befunde sind P3)
