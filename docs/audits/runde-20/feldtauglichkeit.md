# Audit „Helfer im Feld“, Runde 20 (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-10-28 ·
Prüfgegenstand: Web-App, Produktionsbuild (Port 4173), Code-Stand Commit `7c06324` (`main`).

Zählung: **P0 0 · P1 0 · P2 1 · P3 13 · Hinweise 6** (Hinweise ohne Priorität, nicht in der Zählung)

Reiner Prüfbericht, keine Codeänderung. Es gibt keine „bekannten Grenzen“: Reste aus den
Runden 11 bis 19, die im Browser noch zu beobachten sind, stehen mit Verweis im Feld „Neu oder
alt (Verweis)“. Behebungen, die im Browser nicht mehr zu beobachten sind, stehen nur unter
„Bestätigt“. Je Sachverhalt ein Befund; der Typ steht im Kopf jedes Befunds (Daten/Verlust,
Bedienung, Layout/Abstand, Text, Kontrast).

## Prüfaufbau

Playwright/Chromium (globales Modul, `chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`,
Locale de-DE, Telefon 390 × 844, 360 × 640, 320 × 568 und Querformat 568 × 320 / 640 × 360,
frischer Kontext je Lauf. Tipps als Touch-Tipps. Einsatzdaten: Sammlung „Übung Weser“ mit 2 bis
7 Beispielbögen aus `examples/thw/` über „Bögen einlesen…“; Schnellerfassung (Husum,
„THW Oldenburg“); eigener Bogen im Assistenten (Schritt 1 bis 6); Anzeigemodi Standard, Feld,
Dunkel, Nacht. Voller Speicher: `localStorage` mit Füllschlüsseln bis zum Quota-Fehler
(`QuotaExceededError` schon bei 1 Zeichen) gefüllt, danach die Handlungen im Einsatz.
Messungen: Zielgrößen, Abstände, Textüberlauf (`scrollWidth` gegen `clientWidth`), Kontrast
aller sichtbaren Textknoten in allen vier Modi (Soll 4,5, groß 3), Dokumentbreite.

Durchgespielt: Startseite (ohne und mit Einsatz, beendeter Einsatz), Assistent Schritt 1 bis 6
(auch nach Neuladen: „Entwurf wiederhergestellt“), Schnellerfassung aus der Startseite und aus
dem Einsatz (Ort fehlt, Stärke, „In Einsatz übernehmen“), Sammlung: Kenntnisnahme, Karte
aufklappen, „Abrücken“, „Mehr…“, „Entfernen“ (Tipp in der Sperre, Bestätigen), Tabelle,
Scanner ohne Kamera, Exporte (CSV), Übergabe vermerken, „Einsatz als beendet markieren“,
„Einsatz löschen…“, Lagemonitor, Dialoge „Datensicherung“, „Alle Daten löschen“, „Neue
Einsatz-Sammlung“.

**Nicht verifiziert:** echte Handschuhe und nasse Finger, Sonnenlicht und Dunkelheit am
Display, Kamera-Scan, echte Bildschirmtastatur und Autokorrektur, WebKit/Safari, echtes
Drucken, Inhalt der erzeugten PDF-Seiten, echter Download der CSV-Datei (Quittung „Gespeichert“
erscheint, ein Download-Ereignis wurde nicht ausgewertet), Datumsfeld im Lagemonitor-Block (der
Headless-Browser zeigt „mm/dd/yyyy“, das sagt nichts über ein Gerät mit deutscher Region),
„7 aufgenommen, 7 bereits vorhanden“ (R19-K10: mit sieben JSON-Beispielbögen in sechs Läufen
nicht aufgetreten; der Fall betraf PDFs, die hier nicht vorlagen), Alter der Beispielbögen
(„Stand vor 102 Tagen“, „Zeitraum vorbei“ stammt aus den Beispieldateien, nicht gewertet).

## Urteil

Alle Szenarien wurden **abgeschlossen**, ohne Datenverlust und ohne Sackgasse. Die Behebungen aus
Runde 19 halten (siehe „Bestätigt“). Neu fällt auf: Wer in der Schnellerfassung den Namen so
einträgt, wie er auf dem Zettel steht („THW Oldenburg“), bekommt „THW THW Oldenburg“ und kann den
Namen nicht mehr ändern (R20-H1, P2). Alles andere sind Kleinigkeiten (P3), überwiegend Reste.

## Bestätigt (Behebungen aus Runde 19 halten im echten Browser)

- **Voller Speicher, sechs Wege** (Speicher bis zum Quota-Fehler gefüllt, 360 × 640):
  - „Meldung entfernen“: Rückfrage „Papierkorb voll – Die Meldung kam nicht in den Papierkorb …
    Endgültig entfernen?“; „Abbrechen“ lässt die Meldung stehen; nach dem Neuladen ist Nr. 1 noch da.
  - „Einsatz löschen…“: „Nicht gelöscht – Der Speicher ist voll, der Papierkorb leer – der
    Einsatz ist nicht gelöscht“ mit „Endgültig löschen“ / „Abbrechen“; nach dem Neuladen steht
    der Einsatz noch da.
  - „Einsatz als beendet markieren“: „Einsatz nicht beendet – Die Änderung ist nicht gespeichert
    … Nichts hat sich geändert.“ Nach dem Neuladen nicht beendet.
  - „Übergabe vermerken…“ › „Vermerken“: „Übergabe nicht vermerkt … Nichts hat sich geändert.“
  - „Abrücken“: „Speichern fehlgeschlagen“; nach „Alles klar“ steht die Karte wieder ohne
    „Abgerückt“ (Ansicht und Speicher stimmen).
  - „Zur Kenntnis genommen“: „Kenntnisnahme nicht gespeichert … erscheinen nach dem Neuladen
    aber wieder als ‚neu‘“ (Quittung dazu siehe R20-H14).
  Die Warnzeile „Belegter Speicher: etwa 100 % … Er ist voll“ steht auf der Startseite.
- **Fußleiste ohne Textüberlauf:** Schnellerfassung aus dem Einsatz, Schritt 1 und 3: „In Einsatz
  übernehmen“ 167 px breit bei 360 px (`scrollWidth` 165 = `clientWidth` 165), 127 px bei 320 px
  (zweizeilig, ganz lesbar), 159 px bei 390 px; „Weiter →“ und „←“ ohne Überlauf; Abstand zwischen
  den Knöpfen 16 px. Aus der Startseite: „← Zurück“ und „Zur Übersicht →“ ohne Überlauf.
- **Quittungsleiste als Kurzfassung:** „Zur Kenntnis: 3 · Details · Rückgängig · ✕“,
  „Nr. 1 abgerückt 06:36 · Details“, „Nr. 1 entfernt · Papierkorb · Details“, „Einsatz beendet.“,
  „Übergabe vermerkt – ohne Empfänger.“: je 60 px hoch (9 % von 640), ein bis zwei Zeilen,
  „Rückgängig“ und „✕“ je 44 px; die Leiste verschwindet nach etwa 9 Sekunden. Die Ansicht-Leiste
  darunter ist dann ausgeblendet. Export-Quittung „✓ Gespeichert: 2026-10-28_0646_eeb-einsatz_
  Uebung_Weser.csv …“ ebenfalls 60 px, im Bild.
- **Tipp-Sperre mit „Einen Moment …“:** „Meldung entfernen“ in der Rückfrage ist die ersten
  650 ms `aria-disabled`; ein Tipp in dieser Zeit färbt den Knopf dunkel und schreibt „Einen
  Moment …“ auf den Knopf (kein Verdecken des Dialogtexts); ab 1,5 s frei. „Abbrechen“ ist nie
  gesperrt.
- **Schnellerfassung mit Ortsfeld zuerst:** „Ort der Einheit (Pflicht)“ steht bei 360 × 640 und
  390 × 844 bei y = 183 im ersten Bild, darunter „Einheitstyp“; Organisation, Ebene und Kontakt
  stehen eingeklappt unter „Organisation, Ebene, Kontakt (optional)“. Ohne Ort: „Ort der Einheit
  fehlt … Zum Feld ‚Ort der Einheit‘“. Zähler „Führer / Unterführer / Mannschaft“ (52 px) im
  zweiten Schritt ohne Wischen. Kopf, Überschrift und Hinweis zählen gleich („Schritt 3 von 6:
  Personal“ über „3. Personal“).
- **Tabelle am Telefon:** 354 px in 360 px (kein seitliches Überlaufen), Spalten Einheit / Ges. /
  Eingetr. / Bedarf, Namen in zwei bis drei Zeilen vollständig, Zeilen 78 px, Summenzeile, Legende
  darunter; „Alle Spalten zeigen“ als eigener Knopf. Die leere Spalte „Auftrag“ ist weg, der
  Bedarf steht in den Kernspalten.
- **Startseite:** mit vorhandenem Einsatz steht die Karte „Einsatz-Sammlung (Meldekopf)“ mit
  „Öffnen“ (74 px × 44) zuerst; „Neuen Bogen erstellen“ und „Neue Einsatz-Sammlung…“ stehen bei
  360 × 640 bei y = 579 (55 px hoch, sichtbar), bei 390 × 844 bei y = 579. Ohne Einsatz stehen sie
  bei 360 × 640 bei y = 362. Ein beendeter Einsatz steht als „beendet 28.10.2026, 06:47 ·
  übergeben … (ohne Empfänger)“ auf der Startseite. Ein halb ausgefüllter Bogen kommt nach
  Neuladen als „Entwurf … wiederhergestellt. ‚Fortsetzen‘ öffnet ihn dort, wo du warst.“ zurück.
- **Kontrast:** In Standard, Feld, Dunkel und Nacht (Startseite und Sammlung mit aufgeklappter
  Karte, alle Bildlaufstellen) unterschreitet kein sichtbarer Text 4,5 : 1 (große Schrift 3 : 1).
- **Kein seitliches Überlaufen** bei 320, 360, 390 in allen Modi; keine Fläche unter 44 px außer
  „Zum Inhalt springen“ (nur bei Tastaturfokus sichtbar) und „ändern“ an der Eintreffzeit
  (44 × 43 px).
- **Aufgeklappte Karte:** 455 px (Standard) bis 491 px (Feld) bei 360 × 640, 472 px bis 536 px bei
  320 × 568; vorher 923 px bzw. 1 004 px (siehe Hinweis 2).
- **Weiteres:** Rückfragen „Meldung entfernen?“ (320 px Höhe von 640) und „Alle lokalen Daten
  löschen“ (573 px) stehen mit Bestätigung und „Abbrechen“ im Bild; „Nummern bleiben: Nr. 1 bleibt
  frei …“ im Dialog; Papierkorb „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar“.

## Befunde

### R20-H1 [P2] Schnellerfassung: „THW Oldenburg“ als Ort wird zu „THW THW Oldenburg“, der Name ist danach nicht mehr änderbar

- **Typ:** Daten/Verlust (falsche Angabe im Bestand)
- **Neu oder alt (Verweis):** neu.
- **Evidence:** Observed (360 × 640).
- **Ort:** Einsatz › „Einheit schnell erfassen (nur Stärke)…“ › Feld „Ort der Einheit (Pflicht)“
  (Platzhalter „tippen für Vorschläge…“, Organisation auf THW voreingestellt) › Stärke 3 › „In
  Einsatz übernehmen“.
- **Beobachtung:** Ich trage ein, was auf dem Zettel steht: „THW Oldenburg“. Quittung: „Zuletzt
  abgelegt: „THW THW Oldenburg““; Karte „Nr. 1 THW THW Oldenburg“; Hinweis „„THW THW Oldenburg“
  hat Nr. 1 — die Nummer auf dem Zettel eintragen.“ Details der Karte: Organisation „THW“,
  „OV THW Oldenburg“. Das Feld heißt „Ort“, nimmt aber den ganzen Namen an und setzt die
  Organisation davor, ohne zu sagen, dass sie schon dabeisteht. In den Aktionen der Karte
  (Abrücken, Zug zuordnen, Auftrag/Notiz, Mehr…: Aufteilen, Stärke ändern, Als Übung
  kennzeichnen, Verschieben, Entfernen) gibt es keine Möglichkeit, Name oder Ort zu ändern.
- **Erwartung des Helfers:** Er schreibt den Namen wie auf dem Zettel; die App merkt, dass „THW“
  doppelt wäre, oder erlaubt die Korrektur.
- **Folge:** Der falsche Name steht in Liste, Quittung und Karte (Lageblatt und CSV nehmen den
  Namen der Karte: Likely, nicht geöffnet). Korrigieren geht nur über „Entfernen“ und neu
  erfassen; dabei bleibt „Nr. 1 frei“, und die Nummer auf dem Papier weicht von der Liste ab.
- **Empfehlung:** Beim Speichern erkennen, dass der Ort mit der Organisation beginnt, und sie
  nicht doppelt setzen (oder beim Eintippen fragen); zusätzlich unter „Mehr…“ „Name/Ort ändern…“.
- **Nachprüfung:** Ort „THW Oldenburg“ eintragen: Karte zeigt „THW Oldenburg“; Name/Ort an der
  Karte änderbar.

### R20-H2 [P3] Nach „In Einsatz übernehmen“ nennt die sichtbare Quittung keine Nummer; der Satz „hat Nr. 1 — die Nummer auf dem Zettel eintragen“ steht am Seitenende

- **Typ:** Bedienung
- **Neu oder alt (Verweis):** neu (verwandt: R15-S3, die Zeile auf der Startseite; hier die Lage in der Einsatzansicht).
- **Evidence:** Observed (360 × 640, Einsatz mit einer Einheit).
- **Ort:** Einsatzansicht direkt nach der Übernahme aus der Schnellerfassung.
- **Beobachtung:** Das erste Bild zeigt Kennzahlen („1 Einheit, Mannschaft 3“) und die vier
  Aufnahmeknöpfe. Die Quittung „Zuletzt abgelegt: „THW Husum“ · jetzt 1 Einheit, Gesamt 3. In der
  Liste zeigen“ steht bei y = 670, unter dem Bildrand, ohne Nummer. Der Satz „„THW Husum“ hat
  Nr. 1 — die Nummer auf dem Zettel eintragen.“ steht bei y = 3115, nach der Einheitenliste, den
  Exportknöpfen und dem Lagemonitor, direkt über der Fußzeile.
- **Erwartung des Helfers:** Er schreibt die Nummer sofort auf den Zettel des Trupps und sieht sie
  dort, wo er „Übernehmen“ getippt hat.
- **Folge:** Gering. Wer die Nummer sucht, rollt zur Liste oder übersieht sie; auf dem Papier
  fehlt dann die Nummer, die in Lageblatt und Liste steht.
- **Empfehlung:** Die Nummer in die Quittung schreiben („Nr. 1 THW Husum abgelegt – Nummer auf den
  Zettel schreiben“) und die Quittung im Bild halten; den losen Satz am Seitenende entfernen.
- **Nachprüfung:** Nach „In Einsatz übernehmen“ steht „Nr. 1“ im ersten Bild.

### R20-H3 [P3] Schnellerfassung: Kopfzeile „Schritt 3 von 6: Personal · 2, 5 entfallen“ ist ohne Vorwissen nicht zu lesen

- **Typ:** Text
- **Neu oder alt (Verweis):** neu (Folge der Behebung von R19-H2 / R19-A5: die Zählung ist jetzt einheitlich, der Zusatz neu).
- **Evidence:** Observed (360 × 640, alle Schritte der Schnellerfassung).
- **Ort:** Kopfband der Schnellerfassung, zweite Zeile.
- **Beobachtung:** „Schritt 1 von 6: Einheit · 2, 5 entfallen“, „Schritt 4 von 6: Fahrzeuge · 2, 5
  entfallen“. Nur „Schritt 6 von 6: Übersicht“ steht ohne Zusatz. Welche „2“ und „5“ gemeint sind
  (Einsatz, Sofortbedarf), steht nirgends; der Helfer sieht keine Schritte 2 und 5.
- **Erwartung des Helfers:** „Schritt 1 von 4“ oder ein Satz ohne Zahlen.
- **Folge:** Gering. Kurze Irritation; kein Einfluss auf den Weg.
- **Empfehlung:** Nur die gezeigten Schritte zählen („Schritt 1 von 4“) oder „Einsatz und
  Sofortbedarf entfallen hier“ ausschreiben.
- **Nachprüfung:** Kopfzeile ohne Zahlenliste, Zählung passt zur Zahl der Bildschirme.

### R20-H4 [P3] Einsatzansicht: Der Schalter für Feld/Nacht fehlt im Kopf und erscheint nur nach Rollen

- **Typ:** Bedienung
- **Neu oder alt (Verweis):** alt, R19-G6 (Rest); dazu R19-handschuh-bedienung.
- **Evidence:** Observed (360 × 640 und 390 × 844).
- **Ort:** Einsatzansicht, ganz oben.
- **Beobachtung:** Der Kopf trägt „‹ Startseite“, Einsatzname und „Name / Ort ändern…“, aber kein
  „Ansicht“. Die feste Leiste „◐ Ansicht: Standard“ (44 px) ist ganz oben unsichtbar
  (`visibility: hidden`) und erscheint erst, wenn man nach unten gerollt ist und ein Stück
  zurückrollt (gemessen: nach 600 px und Zurückrollen auf 560 px). In der Startseite und im
  Assistenten steht „Ansicht: Standard ▾“ im Kopf; im Quelltext heißt es, der Kopf trage dieselbe
  Wahl.
- **Erwartung des Helfers:** Er will bei Dunkelheit sofort „Nacht“ oder mit Handschuhen „Feld“.
- **Folge:** Gering. Wer die Leiste nicht kennt, sucht den Schalter oder findet ihn am Seitenende
  (rund 4 600 px).
- **Empfehlung:** „Ansicht“ in den Kopf der Einsatzansicht, wie im Assistenten.
- **Nachprüfung:** 360 × 640, Einsatzansicht oben: „Ansicht“ im Bild und mit einem Tipp erreichbar.

### R20-H5 [P3] Nach dem Einlesen liegt die Einheitenliste gut zwei Bildschirme unter dem Kopf

- **Typ:** Layout/Abstand
- **Neu oder alt (Verweis):** alt, R19-W4 (Rest: war „mehr als drei Bildschirme“, jetzt etwa zweieinhalb).
- **Evidence:** Observed (360 × 640, drei Beispielbögen).
- **Ort:** Einsatzansicht nach „Bögen einlesen…“.
- **Beobachtung:** Vor der Überschrift „Einheiten (…)“ (y = 1 317) und der ersten Karte (y = 1 542)
  stehen Kennzahlen, vier Aufnahmeknöpfe, Aufnahmequittung, „Neu seit der letzten Kenntnisnahme“
  (eingeklappt), „3 Übungsmeldungen nicht gezählt — anzeigen“, Zug-Formular, „Bedarf“ und zwei
  Sprungverweise.
- **Erwartung des Helfers:** Nach dem Einlesen sieht er die Einheit, die er eben aufgenommen hat.
- **Folge:** Gering. „Zur Einheitenliste ↓“ führt hin, wenn man den Verweis findet.
- **Empfehlung:** Liste unmittelbar nach den Kennzahlen; Aufnahmeknöpfe und Zug-Formular nach
  unten oder einklappen.
- **Nachprüfung:** Erste Karte innerhalb von 1,5 Bildschirmen.

### R20-H6 [P3] Sprungverweise und „Suchen, sortieren, filtern“ stehen 5 bis 6 px voneinander entfernt

- **Typ:** Layout/Abstand
- **Neu oder alt (Verweis):** alt, R19-H7 (Rest: „Karten | Tabelle“ und die Fußzeilen-Links stehen jetzt mit ≥ 8 px).
- **Evidence:** Observed (360 × 640, 320 × 568, 390 × 844).
- **Ort:** Einsatzansicht: „Zur Einheitenliste ↓“ (47 px) über „Weitergeben, Lageblatt, Export ↓“ und
  „Übergabe, Abschluss ↓“ (Zeilenboxen der beiden Verweise berühren sich); Tabelle: „Suchen,
  sortieren, filtern“ über „Alle Spalten zeigen“ (6 px).
- **Beobachtung:** Die Verweise liegen als umbrochener Fließtext untereinander; die Zielflächen
  überlappen oder berühren sich (v = 5 bis 6 px). Im Feld-Modus bei 320 px 5 px.
- **Folge:** Gering. Mit Handschuh trifft ein Tipp leicht den Nachbarn und springt an die falsche
  Stelle; der Weg zurück ist ein Bildlauf.
- **Empfehlung:** Die Verweise als getrennte Zeilen mit mindestens 8 px Abstand; in der Tabelle
  Abstand zwischen den beiden Knöpfen.
- **Nachprüfung:** Gemessener Abstand benachbarter Ziele ≥ 8 px, keine Überlappung.

### R20-H7 [P3] Querformat 568 × 320 im Modus „Feld“: Das erste Bild zeigt nur Kopf und Kennzahlen, „Bogen scannen…“ liegt am Bildrand

- **Typ:** Layout/Abstand
- **Neu oder alt (Verweis):** alt, R19-M9 (und R18-G2 / R18-S1).
- **Evidence:** Observed (568 × 320, Feld; Standard 640 × 360 und 568 × 320 ähnlich).
- **Ort:** Einsatzansicht, oben.
- **Beobachtung:** Kopf und Kennzahlen belegen 287 px von 320 (90 %); „Bogen scannen…“ beginnt bei
  y = 287 und ist nur 33 px sichtbar. Im Standardmodus beginnt der Knopf bei y = 256 (80 %).
- **Folge:** Gering. Das Telefon im Querformat (am Fahrzeug, im Halter) zeigt keine Aktion; man rollt.
- **Empfehlung:** Im Querformat Kopf und Kennzahlen niedriger (eine Zeile) oder die Hauptaktion
  neben die Kennzahlen.
- **Nachprüfung:** 568 × 320 Feld: „Bogen scannen…“ ohne Rollen vollständig im Bild.

### R20-H8 [P3] Scanner ohne Kamera im Querformat „Feld“: Die Anleitung steht in einem zu niedrigen Fenster und ist mitten im Satz abgeschnitten

- **Typ:** Layout/Abstand
- **Neu oder alt (Verweis):** alt, R19-M5 / R19-L2 / R19-G9 / R19-S10 (Rest, nur Querformat).
- **Evidence:** Observed (568 × 320, Feld, Gerät ohne nutzbare Kamera; Hochformat 360 × 640 und
  320 × 568 in Ordnung).
- **Ort:** „Bogen scannen…“ › Fenster „Dieses Gerät meldet keine nutzbare Kamera“.
- **Beobachtung:** Der gestrichelte Kasten „Am Telefon: Foto … — Knopf unten / Oder mit dem
  USB-Handscanner scannen / Am Handscanner auslösen — das Fenster nimmt den Code sofort an.“ ist
  nur etwa 160 px hoch; die Zeile „Am Handscanner auslösen — … sofort an.“ und „Bereit — warte auf
  den Handscanner“ sind unten abgeschnitten, „Hinweise zum Handscanner“ liegt unter der festen
  Leiste mit „QR aus Bild einlesen…“ und „Fertig“. Das Fenster rollt innen, ohne sichtbare Rollleiste.
- **Folge:** Gering. Wer ohne Kamera arbeitet (Tablet, Handscanner), liest den halben Satz.
- **Empfehlung:** Im Querformat die Anleitung kürzen oder den Kasten über die ganze Höhe rollen
  lassen, mit sichtbarer Rollleiste.
- **Nachprüfung:** 568 × 320 Feld: Anleitung vollständig lesbar oder erkennbar rollbar.

### R20-H9 [P3] Dialoge bei 320 × 568 im Modus „Feld“: „Datensicherung“ ist 1 141 px hoch, „Alle Daten löschen“ 774 px

- **Typ:** Layout/Abstand
- **Neu oder alt (Verweis):** alt, R19-M15.
- **Evidence:** Observed (320 × 568, Feld; bei 360 × 640 Standard 793 und 571 px).
- **Ort:** Startseite/Fußzeile › „Datensicherung“ und „Alle Daten löschen“.
- **Beobachtung:** Das Fenster ist 536 px hoch und rollt innen; in „Datensicherung“ liegt „Sicherung
  erstellen…“ bei 633 px, „Dauerhaften Speicher anfragen“ bei 1 007 px, in „Alle Daten löschen“
  „Endgültig löschen“ bei 645 px und „Abbrechen“ bei 722 px. Der Haken „Ja, alle lokalen Daten
  … endgültig löschen“ wird im ersten Bild vom unteren Rand halb abgeschnitten.
- **Folge:** Gering. Der Weg ist sicher (die Bestätigung steht am Ende), kostet aber zwei bis drei
  Wischer bei Handschuhen.
- **Empfehlung:** Erklärtexte hinter „Was genau gelöscht wird“ einklappen; Bestätigung früher.
- **Nachprüfung:** 320 × 568 Feld: Haken und Knopf höchstens einen Wischer vom Anfang.

### R20-H10 [P3] Rücksprung im Kopf der Erfassung aus dem Einsatz ist gekürzt („‹ Einsatz „Übung We…“)

- **Typ:** Layout/Abstand
- **Neu oder alt (Verweis):** alt, R17-L2 / R17-M1.
- **Evidence:** Observed (360 × 640 und 320 × 568; `scrollWidth` 181 gegen `clientWidth` 170 bzw. 130).
- **Ort:** Schnellerfassung und Assistent, aus dem Einsatz geöffnet: Knopf links im Kopf.
- **Beobachtung:** „‹ Einsatz „Übung We…“ (360 px), „‹ Einsatz „Übun…“ (320 px); das schließende
  Anführungszeichen fehlt. Bei zwei Einsätzen mit gleichem Anfang ist die Kopfzeile nicht eindeutig.
- **Folge:** Gering. Wer nach Unterbrechung zurück will, liest den Namen nicht ganz.
- **Empfehlung:** Namen umbrechen statt kürzen oder „‹ Zum Einsatz“ plus Name in der Marke.
- **Nachprüfung:** Einsatz mit langem Namen: Kopf zeigt den Namen vollständig.

### R20-H11 [P3] Tabelle: Köpfe „Ges.“ und „Eingetr.“ bleiben gekürzt, Schrift 12 und 13 px

- **Typ:** Text
- **Neu oder alt (Verweis):** alt, R19-N8 (leere Spalte „Auftrag“ behoben; Kürzel und Schriftgröße bleiben).
- **Evidence:** Observed (360 × 640, 320 × 568).
- **Ort:** Einsatzansicht › „Tabelle“.
- **Beobachtung:** Spaltenköpfe „EINHEIT · GES. · EINGETR. · BEDARF“ in 12 px, Zellen in 13 px (die
  übrige App 16 bis 18 px). Die Erklärung „Ges. = Stärke gesamt, Eingetr. = eingetroffen“ steht
  erst in der Legende unter der Tabelle (bei vier Zeilen etwa 130 px tiefer, bei langen Listen
  nach dem Rollen).
- **Folge:** Gering. Wer die Tabelle bei Sonne oder mit Brille liest, erkennt „Ges.“ nicht sicher.
- **Empfehlung:** „Stärke“ und „Eingetroffen“ ausschreiben (die Spalten sind breit genug, wenn die
  Warnung in R20-H12 entfällt); Schrift mindestens 14 px.
- **Nachprüfung:** Tabelle bei 360 px ohne Legende lesen lassen.

### R20-H12 [P3] Tabelle: Die Warnung „⚠ Stand vor 102 Tagen“ steht in der Spalte „Eingetr.“ und macht die Zeilen dreizeilig

- **Typ:** Text
- **Neu oder alt (Verweis):** alt, R19-M14 (Warnung in drei Zeilen; Spalte „Auftrag“ ist entfallen).
- **Evidence:** Observed (360 × 640, vier Beispielbögen).
- **Ort:** Einsatzansicht › „Tabelle“, Spalte „Eingetr.“.
- **Beobachtung:** Zelle „06:40 * ⚠ Stand vor 102 Tagen“: Zeit, Stern und Warnung in einer Spalte, die
  Warnung bricht in drei Zeilen. „Eingetr.“ liest sich dadurch wie „eingetroffen vor 102 Tagen“,
  gemeint ist das Alter der Angaben.
- **Folge:** Gering. Die Spalte sagt nicht, was sie meint; die Zeilen werden 78 px hoch.
- **Empfehlung:** Warnung als eigene Spalte („Stand“) oder unter dem Namen, nicht unter „Eingetr.“.
- **Nachprüfung:** Spalte „Eingetr.“ zeigt nur die Eintreffzeit.

### R20-H13 [P3] Texte bei vollem Speicher: lang, fachsprachlich und die Rückfrage „Papierkorb voll“ nennt die Meldung nicht

- **Typ:** Text
- **Neu oder alt (Verweis):** neu (Folge der Behebung von R19-O1 bis R19-O5; die Handlungen sind sicher, die Texte neu).
- **Evidence:** Observed (360 × 640, Speicher gefüllt).
- **Ort:** Dialoge „Abrücken“, „Nicht gelöscht“, „Papierkorb voll“.
- **Beobachtung:** „Abrücken – Speichern fehlgeschlagen — der Speicher dieses Geräts ist voll. Platz
  schafft nur Löschen: nicht mehr benötigte Einsätze sichern, den Papierkorb leeren oder einen
  gesicherten Einsatz dort endgültig löschen (die Sicherung selbst schafft keinen Platz;
  ins Papierkorb-Legen braucht bei vollem Speicher selbst etwas).“ (sieben Zeilen); „Nicht gelöscht
  … Platz schafft nur Verkleinern: unter „Mehr…“ Meldungen oder Einheiten entfernen, zuletzt „Alle
  Daten löschen“ (nach der Sicherung). Oder „Übung Weser“ jetzt endgültig löschen? …“ (zehn
  Zeilen, 280 px). Die Rückfrage „Papierkorb voll“ („Die Meldung kam nicht in den Papierkorb …
  Endgültig entfernen?“) nennt weder Nr. noch Namen der Meldung. Im Dialog „Abrücken“ steht nicht,
  welche Einheit nicht abgerückt wurde.
- **Erwartung des Helfers:** „Nr. 1 ist nicht als abgerückt vermerkt. Speicher voll: erst sichern.“
- **Folge:** Gering. Die Lage ist klar, der Helfer liest aber unter Zeitdruck einen Absatz zu
  „Papierkorb“ und „Verkleinern“.
- **Empfehlung:** Erster Satz: was nicht geschehen ist (mit Nr. und Namen); zweiter: ein Weg
  („Erst sichern: Einsatz weitergeben / sichern“); den Rest hinter „Mehr dazu“.
- **Nachprüfung:** Speicher füllen, „Abrücken“: Dialog höchstens vier Zeilen, nennt die Einheit.

### R20-H14 [P3] „Zur Kenntnis genommen“ bei vollem Speicher: Die Quittung behauptet Erfolg und bietet „Rückgängig“ an, daneben steht „nicht gespeichert“

- **Typ:** Text
- **Neu oder alt (Verweis):** neu (R19-O4 für die Übergabe-Checkliste behoben; die Kenntnisnahme zeigt noch beide Aussagen).
- **Evidence:** Observed (360 × 640, Speicher gefüllt).
- **Ort:** Sammlung › „Neu seit der letzten Kenntnisnahme“ › „Zur Kenntnis genommen“.
- **Beobachtung:** Der Dialog „Kenntnisnahme nicht gespeichert – … erscheinen nach dem Neuladen
  aber wieder als ‚neu‘“ ist richtig. Dahinter bleibt die Leiste „Zur Kenntnis genommen: 3
  Einheiten · Zur Kenntnis: 3 · Details · Rückgängig · ✕“ stehen (etwa 9 s).
- **Folge:** Gering. Wer „Alles klar“ tippt, sieht danach noch „Zur Kenntnis genommen“ mit
  „Rückgängig“ und hält es für gespeichert; nach dem Neuladen ist alles wieder „neu“.
- **Empfehlung:** Bei Speicherfehler die Quittung nicht zeigen oder als „nur in dieser Ansicht“
  kennzeichnen.
- **Nachprüfung:** Voller Speicher: Nach dem Dialog keine Erfolgsquittung.

## Hinweise (ohne Priorität, keine Beeinträchtigung der Aufgabe)

1. **Fußleiste der Schnellerfassung im Einsatz:** „← Zurück“ zeigt bei 320 und 360 px nur „←“
   (44 px, Name bleibt „Zurück“); neben „In Einsatz übernehmen“ und „Weiter →“ ist das verständlich,
   bei 390 px steht das Wort.
2. **Aufgeklappte Karte:** 455 bis 491 px (360 × 640) und bis 536 px (320 × 568 Feld), das sind
   71 bis 94 % der Bildhöhe; sie rollt, deckt aber Kopf und Fuß der Karte nie zugleich ab.
3. **„Mehr…“:** öffnet unten eine Leiste (Aufteilen, Stärke ändern, Als Übung kennzeichnen,
   Verschieben, Entfernen, Weniger anzeigen) und tauscht zugleich den Kartenknopf in „Weniger“;
   daneben „Zuklappen“. Drei Wege zum Schließen für dieselbe Sache.
4. **Platzhalter „meist leer – OV unten eintragen“** im Feld „Organisationsname (optional)“ ist bei
   320 px abgeschnitten („… OV unten eintr“); „OV“ ist THW-Sprache und für andere Organisationen
   unklar.
5. **Quittungsleiste:** Der Knopf „Details“ in der Leiste heißt wie der Knopf „Details“ an der
   Karte; er öffnet das Protokoll, nicht die Karte.
6. **Zeitfenster der Quittung:** Sie verschwindet nach etwa 9 s (vorher 30 s); „Rückgängig“ für
   „Zur Kenntnis genommen“ ist danach nicht mehr da (harmlos, die Einheiten bleiben auffindbar).

## Comprehension check

- Orientation: understood (Kopf, Marke „Schnellerfassung“, Quittungen; Ausnahme R20-H3, R20-H10)
- Next action: understood (Hauptknopf je Bild; Ausnahme R20-H2: Nummer für den Zettel)
- System status: understood (Speicher-voll-Wege sicher; R20-H14 widerspricht sich)
- Error recovery: understood (Rückgängig, Papierkorb, Entwurf; R20-H1: kein Weg, den Namen zu ändern)
- Field suitability: suitable (mit den Einschränkungen oben)
