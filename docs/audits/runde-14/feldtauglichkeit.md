# Audit „Helfer im Feld“, Runde 14 (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Code-Stand
Commit `429c41a` (`main` nach Runde 13).

Zählung: **P0 0 · P1 0 · P2 2 · P3 2**

Reiner Prüfbericht, keine Codeänderung. Die bekannten Grenzen und Reste aus den
Runden 6 bis 13 (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3,
R9-G5, R8-H5/S4, leere Karten bei „Nur Stärke“, Rückgängig für Meldungen überlebt
das Neuladen nicht, Tabellenzeilenhöhe bei 180 × 320, R11-S4, R11-H2, R11-K2,
R11-A2, R11-A5, R11-M1, R11-M3, R12-W3, R12-H3, R12-O2, R12-O4, R12-G3,
R13-W1 Vergleichsbasis in Dialog und Quittung, R13-W6 kein Zustand „beendet“,
R13-H1 keine Knöpfe mit nächsten Typen) wurden nicht neu gemeldet.

## Prüfaufbau

Playwright/Chromium (`chromium.launch()` ohne Optionen, globales Modul, da die
Projektkopie keinen passenden Browser fand), `isMobile`/`hasTouch`, Locale
de-DE, Telefon 390 × 844 und 360 × 640, einzelne Läufe quer (640 × 360). Jeder
Lauf mit frischem Kontext, keine Kamera. Einsatzdaten: Kopien der Übungsbögen
unter `examples/thw/` (`uebung: false`), über „Bögen einlesen…“ in eine frisch
angelegte Sammlung eingespielt (3, 5 und 22 Dateien); der Bogen zum Übergeben
wurde im Assistenten selbst ausgefüllt (Link über gestubbtes `navigator.share`).

Durchgespielt: (1) eigener Bogen: Organisation, Ort, Einheitstyp, Einsatz mit
„Einsatzbeginn eintragen“, Personal (Karten und Kurzliste, Vorbelegung entfernen,
Rückgängig), Fahrzeuge, Sofortbedarf, Übersicht, „Bogen übergeben…“ (hoch und
quer, QR im Vollbild, Link), Browser-Zurück/-Vor, Neuladen, Fortsetzen/Verwerfen;
(2) Schnellerfassung ohne Sammlung bis „In Einsatz-Sammlung ablegen…“;
(3) Empfang eines Links ohne und mit vorhandener Sammlung; (4) Meldekopf:
Sammlung anlegen, Dateien einlesen, „Zur Kenntnis genommen“, Aufklappen,
„Abrücken“ mit Quittung, „Stärke ändern…“ (Plausibilitätsfrage bei 250 und 900),
„Zug für alle“, manuelle Erfassung und „In Einsatz übernehmen“, Lageblatt,
„Einsatz weitergeben / sichern“, CSV, Excel; (5) Dialoge „Datensicherung“,
„Übungsbögen“, „Geräteschlüssel“, „Alle Daten löschen“, Scanner ohne Kamera;
(6) Eingabe-Attribute aller Felder der Schritte 1 bis 5, Zielgrößen und seitliches
Überlaufen in allen vier Ansichten, statische Begleitseiten bei 360 px.

**Nicht prüfbar** und deshalb *nicht verifiziert*: echte Handschuhe und nasse
Finger, Sonnenlicht und Dunkelheit am Display, Kamera-Scan, native Datums- und
Zeitauswahl, echte Bildschirmtastatur samt Autokorrektur, WebKit/Safari, echtes
Drucken, Verhalten bei vollem oder gesperrtem Speicher.

Hinweis zu den Daten: Die Übungsbögen tragen einen Stand ab dem Folgetag; die
dadurch erscheinenden Hinweise („Stand liegt nach dem Eintreffen“, „Zeitraum
vorbei“) sind ein Artefakt des Prüfaufbaus und wurden nicht gewertet.

## Urteil

Alle Szenarien wurden **abgeschlossen**, ohne Datenverlust und ohne Sackgasse.
Neu gefunden wurden zwei Lücken im Rückweg bzw. in der Einordnung am Meldekopf
(P2) und zwei Kleinigkeiten (P3). Der Kernweg trägt.

## Nachprüfung der Behebungen aus Runde 13

- **R13-H1 Einheitstyp-Suche:** „TZ“ liefert „ZTr TZ Zugtrupp Technischer Zug“
  zuerst, „BGr“ und „1. BGr“ schlagen „B Bergungsgruppe“ vor, „OV“ liefert
  „OV-Stab“ vor „FGr E“. Hält (der Rest „keine Knöpfe mit nächsten Typen“ bleibt
  bekannt).
- **R13-H2 Ortssuche:** „Neu Ulm“, „Baden Baden“, „Villingen Schwenningen“ finden
  „Neu-Ulm“, „Baden-Baden“, „Villingen-Schwenningen“ samt Kürzel. Hält.
- **R13-H3 Autokorrektur:** `spellcheck="false"` an Ort, Einheitstyp, Namen,
  Zug, Kennzeichen, Dienststellen-Kürzel; Fließtexte unverändert. Hält.
- **R13-E1/E2 Stärkegrenzen:** „Stärke ändern…“ fragt bei 250 Führer und 900
  Mannschaft („Stärke: 900 Mannschaft — stimmt das?“, „mehr als das Dreifache“).
  Hält.
- **R13-S1/S2 Schnellerfassung:** „In Einsatz-Sammlung ablegen…“ steht zuerst, der
  Hinweis „Meldung einer fremden Einheit …“ steht am Kopf. Hält. Die manuelle
  Erfassung mit „In Einsatz übernehmen“ ohne Personal fängt die Frage „Nur
  Sollplätze, keine gemeldete Stärke“ ab. Hält.
- **R13-O1 Sicherung einspielen:** Eine fremde Datei wird mit Namen und dem
  Hinweis auf den Dateinamen der Sicherung abgewiesen (siehe aber R14-H4).
  Hält.
- **R13-D1 bis D4, G2/G3:** Rückfrage „Vorbelegung entfernen“ mit Rückgängig,
  Verwerfen mit Rückfrage, Zielgrößen im Meldekopf ≥ 44 px mit 8 px Abstand.
  Hält.
- **R13-W5 Zug bei der Aufnahme:** Das Feld „Zug für alle“ ist da, hat aber die
  Lücke aus R14-H2.
- **Nicht gesondert erneut geprüft:** R13-A1 bis A5, R13-K1/K2, R13-M1 bis M3,
  R13-L1, R13-N1/N2.

## Befunde

### R14-H1 [P2] Link auf einem Gerät ohne Sammlung öffnet als „Gesamtübersicht“ des eigenen Bogens

**Evidence:** Observed (360 × 640, frischer Kontext, Link aus „Weitere Formate →
Link teilen“, auf `localhost:4173/#…` geöffnet).
**Ort:** Startvorgang beim Empfang eines Links, wenn auf dem Gerät noch keine
Einsatz-Sammlung und kein Entwurf liegt (das Telefon eines Helfers am Meldekopf
vor dem ersten Einsatz).
**Beobachtung:** Es erscheint ohne Rückfrage die Gesamtübersicht mit den sechs
Schritt-Reitern (Reiter „3 offen“), der Knopf „Bogen übergeben…“ steht oben und
ist der dunkle Hauptknopf, „In Einsatz-Sammlung ablegen…“ folgt als zweiter Knopf.
Darunter steht „⚠ 4 offene Punkte für die Weitergabe — antippen zum Beheben“ mit
Aufforderungen an den Absender („7 Personenkarten ohne Angaben … ausfüllen oder
entfernen“). Dass es sich um einen **unveränderten Bogen von fremder Stelle**
handelt, steht erst gut zwei Bildschirmhöhen weiter unten im Block QR-Code
(„Unveränderter Bogen von fremder Stelle … dieses Gerät hat nur gegengezeichnet“);
oben steht nur „Empfangen als: ✓ signiert von ca84 9419 …“. Der Hinweis „Meldung
einer fremden Einheit: Sie gehört in eine Einsatz-Sammlung …“, den die
Schnellerfassung am Kopf der Übersicht trägt, fehlt hier. Mit vorhandener Sammlung
ist es richtig gelöst („Meldung von … empfangen — Wohin damit?“).
**Erwartung des Helfers:** Er hat einen Link bekommen und will die Einheit „in die
Liste“ bringen. Er sieht einen Bogen mit Mängelliste, nimmt an, er solle ihn
vervollständigen, und tippt auf den dunklen Hauptknopf oder auf einen Mangel.
**Folge:** Wer Mängel behebt, macht aus dem fremden Bogen einen eigenen, der nur
noch vom eigenen Gerät signiert wird (so beschreibt es die Seite selbst); wer
„Bogen übergeben…“ nimmt, gibt eine Gegenzeichnung des Meldekopf-Geräts weiter,
keine Meldung der Einheit. Die eigentliche Absicht (aufnehmen) ist nur über den
zweiten Knopf zu erreichen, und dort kommt dann „Neue Sammlung anlegen…“. Kein
Datenverlust, aber Verwechslung von Absender und Empfänger an der wichtigsten
Stelle des Meldewegs.
**Empfehlung:** Für einen empfangenen, unveränderten Bogen ohne vorhandene Sammlung
dieselbe Rückfrage wie mit Sammlung zeigen, mit „Neue Einsatz-Sammlung anlegen und
aufnehmen“ als Hauptweg; mindestens den Kopf der Übersicht wie bei der
Schnellerfassung belegen (Hinweis „fremde Einheit“, „In Einsatz-Sammlung ablegen…“
als Hauptknopf, Mängelliste ausblenden oder als „Hinweise an die Einheit“ kennzeichnen).
**Nachprüfung:** Frisches Gerät, Link einer Einheit öffnen: Rückfrage oder Übersicht
mit Hauptknopf „ablegen“, ohne „offene Punkte … zum Beheben“ als Auftrag.

### R14-H2 [P2] „Zug für N Einheiten ohne Zug“ setzt alle auf einmal, ohne Quittung und ohne Rückgängig

**Evidence:** Observed (360 × 640, 5 aufgenommene Einheiten; ebenso mit 14).
**Ort:** Meldekopf, Einsatzansicht, Zeile „Zug für 5 Einheiten ohne Zug:“ mit
Feld und „Zuordnen“ (R13-W5), über „Zuletzt gemeldete oben zeigen“.
**Beobachtung:** Ein Tipp auf „Zuordnen“ trägt „1. Zug“ bei allen fünf Einheiten
ein. Danach verschwindet die ganze Zeile (es gibt keine Einheit ohne Zug mehr),
und es erscheint weder eine Statusmeldung („Zug „1. Zug“ für 5 Einheiten gesetzt“)
noch ein „Rückgängig“; die Live-Bereiche der Seite enthalten nichts dazu. Die
Änderung ist nur an den kleinen Marken „1. Zug“ auf den Karten zu erkennen. Die
Zeile heißt „Zug für alle“ (Platzhalter) bzw. „Zug für diese Einheiten“
(Beschriftung für Hilfsmittel), der Zähler steht davor; zu den fünf Karten, die
beim Tippen im Bild waren, gehört sie nicht (sie liegen unterhalb).
**Erwartung des Helfers:** Wie bei „Abrücken“, „Zur Kenntnis genommen“ und
„Vorbelegung entfernen“: kurze Bestätigung mit Rückgängig.
**Folge:** Ein falscher Zugname (Tippfehler, „2. Zug“ statt „1. Zug“, nur für drei
der 14 Einheiten gedacht) steht sofort bei allen Einheiten ohne Zug. Korrigieren
heißt je Einheit: Karte aufklappen, „Zug zuordnen“, Eintrag ändern, Speichern; bei
14 Einheiten sind das über 50 Tipps am Meldekopf, und Tippfehler erzeugen getrennte
Zwischensummen je Zug. Das Gegenteil der Absicht von R13-W5.
**Empfehlung:** Nach „Zuordnen“ dieselbe Quittung wie bei „Abrücken“ (Zugname,
Anzahl, „Rückgängig“); den Zähler mit den Namen der betroffenen Einheiten oder einer
Vorschau („betrifft: Laufenburg, Müllheim, … 5 Einheiten“) versehen; wenn der
Zugname bisher nirgends vorkommt, kurz nachfragen.
**Nachprüfung:** Fünf Einheiten ohne Zug aufnehmen, „3. Zug“ eintragen, „Zuordnen“:
Quittung mit „Rückgängig“ erscheint; Rückgängig stellt „ohne Zug“ bei allen wieder her.

### R14-H3 [P3] Länderliste der Übersichtsseite: Tippflächen 33 px hoch, 6 bis 8 px Abstand

**Evidence:** Observed (360 × 640, `uebersicht.html`, Messung der Elemente).
**Ort:** `uebersicht.html`, Liste der Länderseiten (Katastrophenschutz).
**Beobachtung:** Die Verweise „Baden-Württemberg“ (153 × 33 px), „Bayern“
(70 × 33 px), „Berlin“, „Brandenburg“, „Hessen“ usw. sind 33 px hoch, 13 Ziele
unter 44 px; Abstand waagerecht 8 px, senkrecht 6 px. Auch „Bogen digital
ausfüllen“ misst 200 × 43 px. Alle anderen geprüften Begleitseiten (THW, Feuerwehr,
DRK, Anleitung, Fachgruppenseite) haben nur Ziele ≥ 44 px und laufen nicht
seitlich über.
**Folge:** Gering; die Seiten sind Nachschlagewerk, keine Einsatzbedienung. Mit
Handschuhen führt ein Tipp neben das Ziel in das Nachbarland.
**Empfehlung:** Mindesthöhe 44 px und 8 px Abstand wie in der App.
**Nachprüfung:** Auf 360 px messen: alle Verweise der Liste ≥ 44 px hoch.

### R14-H4 [P3] Datensicherung: alte Fehlermeldung bleibt nach erfolgreicher Sicherung stehen, die Bestätigung liegt unter dem Bildrand

**Evidence:** Observed (360 × 640).
**Ort:** Dialog „Datensicherung“ (Startseite, Fuß).
**Beobachtung:** Wurde zuerst eine falsche Datei gewählt („„junk.json“ stammt nicht
aus dieser App. …“, rot), bleibt diese Zeile nach „Sicherung erstellen…“ stehen. Die
neue Bestätigung („Sicherung „eeb-sicherung-2026-10-26.json“ erzeugt — liegt im
Download-Ordner. Gesichert ist sie erst, wenn sie auf einem zweiten Gerät …“) und
„Letzte Sicherung … erstellt“ stehen darunter, außerhalb des sichtbaren Teils; im
Bild bleibt nach dem Tipp die rote Fehlermeldung.
**Folge:** Der Helfer sieht nach erfolgreicher Sicherung einen roten Fehler und
glaubt, sie sei misslungen; er wiederholt oder verlässt sich nicht auf die Datei.
**Empfehlung:** Frühere Meldungen beim nächsten Vorgang entfernen; die Quittung der
Sicherung in den sichtbaren Bereich rollen oder über die Knöpfe stellen.
**Nachprüfung:** Falsche Datei wählen, danach „Sicherung erstellen…“: Die rote Zeile
ist weg, die Bestätigung steht im Bild.

## Was gehalten hat (nicht ändern)

- **Eigener Bogen am Telefon:** Alle Schritte in 360 × 640 und 390 × 844 mit
  Zielen ≥ 44 px, kein seitliches Überlaufen in allen vier Ansichten, Zahlenfelder mit
  Zifferntastatur, Telefon-/E-Mail-Felder mit passender Tastatur, Kennzeichen und
  Kürzel in Großbuchstaben.
- **Vorbelegung entfernen:** Quittung „Stärke 9 → 1“ mit „Rückgängig“.
- **Schnellerfassung:** Schritte 2 und 5 entfallen, die Übersicht erklärt, dass die
  Meldung in eine Sammlung gehört; „Geschlecht: keine Angabe“.
- **Link mit vorhandener Sammlung:** „Meldung von … empfangen — Wohin damit?“ mit
  „In „…“ aufnehmen“, „Bogen öffnen“, „Abbrechen“.
- **Rückfragen mit Folgen:** „Stimmt die Stärke?“ (Zahlen vorher/nachher),
  „Nur Sollplätze, keine gemeldete Stärke“, „Angefangenen Bogen verwerfen?“ mit
  Rückholweg; Dialoge schließen nicht durch Tipp auf den Hintergrund, nur durch
  „Abbrechen“ oder Escape.
- **Quittungen der Ausgaben:** Lageblatt, Sammel-PDF, CSV und Excel melden Ziel und
  Zeit; „bitte nicht noch einmal tippen“ während der Erzeugung; Dateinamen mit
  Zeitgruppe.
- **Neuladen und Rückweg:** Entwurf kommt mit „Fortsetzen / Verwerfen“ zurück,
  Browser-Zurück bleibt in der App.
- **Scanner ohne Kamera:** Klare Aussage, Handscanner-Weg, „Fertig“ erreichbar.
- **Querformat (640 × 360):** „Bogen übergeben“ vollständig bedienbar.

## Verständnis-Check

- Orientierung: verstanden (am Meldekopf ohne Sammlung beim Empfang eines Links:
  unsicher, R14-H1)
- Nächste Handlung: verstanden
- Systemstatus: verstanden (außer fehlender Quittung bei „Zuordnen“, R14-H2, und der
  alten Fehlermeldung, R14-H4)
- Fehlerbehebung: verstanden, mit der Lücke bei „Zuordnen“
- Feldtauglichkeit: eingeschränkt geprüft (echte Handschuhe, Sonnenlicht, Kamera,
  Telefontastatur nicht prüfbar); soweit prüfbar geeignet
