# Audit „Helfer im Feld“, Runde 19 (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-10-28 ·
Prüfgegenstand: Web-App, Produktionsbuild (Port 4173), Code-Stand Commit `0ac0d7f`
(`main`).

Zählung: **P0 0 · P1 0 · P2 0 · P3 11**

Reiner Prüfbericht, keine Codeänderung. Es gibt keine „bekannten Grenzen“: Reste aus
den Runden 11 bis 18, die im Browser noch zu beobachten sind, stehen mit Verweis im
Feld „Neu oder alt (Verweis)“. Behebungen, die im Browser nicht mehr zu beobachten
sind, stehen nur unter „Bestätigt“.

## Prüfaufbau

Playwright/Chromium (globales Modul, `chromium.launch()` ohne Optionen),
`isMobile`/`hasTouch`, Locale de-DE, Telefon 390 × 844, 360 × 640, 320 × 568 und
Querformat 640 × 360, frischer Kontext je Lauf. Tipps als Touch-Tipps mit Koordinaten.
Einsatzdaten: Sammlung „Übung Weser“ (Art „Übung“) mit 2, 3 oder 4 Beispielbögen aus
`examples/thw/` über „Bögen einlesen…“; Schnellerfassung (Husum); eigener Bogen im
Assistenten (Husum, FGr N, Schritt 1 bis 6).

Durchgespielt: Startseite (Lage der Knöpfe über 6 s), Assistent Schritt 1 bis 6
(Einheitstyp-Vorschläge, Namen einfügen, „Vorbelegung entfernen“, „Bogen übergeben…“,
„Bogen schließen“), Schnellerfassung (Ort fehlt, Stärke 0, Stärke eintragen, Zähler
mit 120 und 400 ms Tippabstand), Einheit manuell (Rückfrage „Nur Sollplätze“),
Sammlung: Kenntnisnahme, Karte aufklappen, „Abrücken“, Rückgängig nach 200 ms,
„Mehr…“, „Entfernen“ (Abbrechen nach 300 ms, Bestätigen nach 1,3 s), Neuladen,
Papierkorb, „Zurückholen“, neuer Bogen nach „Entfernen“, „Stärke ändern…“, Tabelle
(auch „Alle Spalten zeigen“), Scanner ohne Kamera, Dateien einlesen (Duplikat, Müll,
kaputtes Bild), Sammel-PDF, Lageblatt, beide CSV, Excel, „Übergabe vermerken…“,
„Einsatz als beendet markieren“, „Einsatz löschen…“, Anzeigemodi „Standard“, „Feld“,
„Nacht“, „Dunkel“, automatische Messung aller Ziele (Größe, Abstand, Überlappung).

**Nicht verifiziert:** echte Handschuhe und nasse Finger, Sonnenlicht und Dunkelheit
am Display, Kamera-Scan, echte Bildschirmtastatur und Autokorrektur (die Befunde
zu Eingabefeldern beruhen auf den Attributen), WebKit/Safari, echtes Drucken, voller
Speicher, Inhalt der erzeugten PDF-Seiten, Lageblatt-Download im Headless-Browser
(kein Download-Ereignis, aber Quittung „Lageblatt erzeugt“), Tastatur, die Dialoge
verdeckt. Das Alter der Beispielbögen („Stand vor 103 Tagen“, „Zeitraum vorbei“) stammt
aus den Beispieldateien und wurde nicht gewertet.

## Urteil

Alle Szenarien wurden **abgeschlossen**, ohne Datenverlust und ohne Sackgasse. Kein
P0-, P1- oder P2-Befund; elf Kleinigkeiten (P3).

## Bestätigt (Behebungen aus Runde 18 halten im echten Browser)

- **Tipp-Sperren und sichere Gegenhandlungen:** „Abbrechen“ in „Meldung entfernen?“
  schließt nach rund 300 ms; „Rückgängig“ nach „Abrücken“ wirkt nach rund 350 ms;
  „Meldung entfernen“ ist in den ersten Zehntelsekunden gesperrt (`aria-disabled`)
  und danach frei; Zähler „+“ nehmen fünf Tipps im Abstand von 120 ms an. Hält.
- **Quittungsleiste:** „Zur Kenntnis genommen“ (61 bis 86 px) und „Abgerückt“ (67 px)
  verschwinden von allein (bei 20 s noch da, bei 45 s weg). Hält.
- **Nummern bleiben:** Nach „Entfernen“ von Nr. 1 bleibt die Liste 2, 3, 4; ein neu
  eingelesener Bogen bekommt Nr. 4, nicht Nr. 1. Dialog und Quittung sagen es. Hält.
- **Papierkorb:** nach Neuladen mit Ablaufdatum; oben ein Verweis „1 entfernte Meldung
  im Papierkorb — ansehen und zurückholen ↓“; „Zurückholen“ (16, 430) und „Endgültig
  löschen…“ (183, 430) stehen nebeneinander mit 54 px Abstand. Hält (R18-H3).
- **Quittung „Entfernt: …“:** vollständig lesbar („Nr. 1 bleibt frei. 7 Tage im
  Papierkorb unter der Liste.“). Hält (R18-H2). Höhe siehe R19-H6.
- **Übergabe und Abschluss:** Checkliste der Weitergaben, „Übergabe vermerken…“ mit
  „Wie das Kästchen ‚übertragen [ ]‘ auf dem Papier“, „Einsatz beendet … — noch offen:
  …“ mit „Wieder öffnen“, „Einsatz löschen…“ mit Papierkorb 30 Tage. Hält.
- **Dateinamen:** `2026-10-28_0237_eeb-einsatz_Uebung_Weser.pdf`, `.csv`,
  `…-alle-daten_…csv`, `…-oldenburg_…xlsx`. Hält (R18-H9).
- **Scanner ohne Kamera:** Knöpfe „QR aus Bild einlesen…“ und „Fertig“ in fester
  Leiste unten, 44 px hoch, nicht im Rahmen. Hält (R18-H8).
- **Autokorrektur:** Einsatzort/Auftrag (Schritt 2), Personenfelder, Funkruf, Ort:
  `autocorrect=off`, `spellcheck=false`. Hält (R18-H5, Schritt 2 und 3).
- **Namen einfügen:** „Jürgen Weber +49 171 9876543 ZTrFü“ wird mit Telefon und
  Funktion gelesen; „12345“ als „nicht übernommen“ markiert. Hält (R18-H6).
- **Zielgrößen:** Startseite, Einsatzansicht, Karte, Assistent Schritt 1 bis 6 bei
  320, 360, 390: außer Kästchen (24 px in 44 px hohen Beschriftungen) keine Fläche
  unter 44 px; „In der Liste zeigen“, „DRK“, „ASB“ jetzt 44 px. Schrittleiste mit
  8 px Abstand. Hält (R18-H7).
- **Dateien einlesen:** Duplikat („0 Bögen aufgenommen, 1 bereits vorhanden.“), Müll-JSON
  und kaputtes Bild mit je einem Satz, was zu tun ist. Hält.
- **Weiteres:** Rückfrage „Stärke 0“ (487 px hoch bei 640) mit „Stärke eintragen“;
  „Vorbelegung entfernen“ mit Rückgängig in der Zeile; „Bogen schließen“ sagt „nicht
  gelöscht“; kein seitliches Überlaufen (320, 360, 390, alle Anzeigemodi); Querformat:
  nur die Fußleiste (56 px von 360) bleibt stehen.

## Befunde

### R19-H1 [P3] Schnellerfassung: „In Einsatz übernehmen“ ist bei 360 px Breite abgeschnitten, bei 320 px zu „Übernehmen“ verkürzt

**Neu oder alt (Verweis):** neu — Folge der Behebung von R18-W7 / R17-H6 (Hauptknopf
einzeilig); die Prüfung dort maß 390 px.
**Evidence:** Observed (360 × 640, Schnellerfassung Schritt 1 und 2; `scrollWidth` 134
gegen `clientWidth` 119, Schrift 14 px; bei 390 px 157 gegen 157).
**Ort:** Schnellerfassung, feste Fußleiste: „← Zurück“ · „In Einsatz übernehmen“ ·
„Weiter →“.
**Beobachtung:** Das Wort „übernehmen“ ragt über den Knopfrand; im Bildschirmfoto
steht „In Einsatz übernehme“ mit abgeschnittenem „n“, der Text berührt links und rechts
den Rand. Bei 320 px steht „Übernehmen“ ohne „In Einsatz“ und ohne Luft zum Rand.
**Erwartung des Helfers:** Ein Hauptknopf mit vollständiger, lesbarer Beschriftung;
360 × 640 ist ein sehr häufiges Telefonmaß.
**Folge:** Gering. Der Knopf bleibt verständlich und trifft; der halbe Buchstabe
wirkt unfertig, und „Übernehmen“ nennt das Ziel („Einsatz“) nicht.
**Empfehlung:** Beschriftung zweizeilig mit Innenabstand oder kürzer („Übernehmen“) bei
schmalen Breiten, nie abgeschnitten; Knopf bei 360 px breiter als „Weiter →“ halten.
**Nachprüfung:** 360 × 640 und 320 × 568: `scrollWidth` ≤ `clientWidth`, Text nicht
am Rand.

### R19-H2 [P3] Schnellerfassung zählt „Schritt 2 von 4“, die Überschrift sagt „3. Personal“, der Hinweis „Stärke in Schritt 3“

**Neu oder alt (Verweis):** neu (nicht in Runde 18 geführt).
**Evidence:** Observed (360 × 640).
**Ort:** Schnellerfassung: Kopfzeile „Schritt 2 von 4: Personal“; Überschrift „3.
Personal“; Schritt 1 „Schnellerfassung: Ort hier, Stärke in Schritt 3“; Schritt 3 von
4 heißt „4. Fahrzeuge“; Text „erst Schritt 4“.
**Beobachtung:** Die Schnellerfassung überspringt „2. Einsatz“, behält aber die
Nummern des vollständigen Assistenten. Kopf und Überschrift widersprechen sich um eins.
**Erwartung des Helfers:** Eine Zählung. Wer „Stärke in Schritt 3“ liest und „Schritt 2
von 4“ sieht, sucht einen Schritt, den es nicht gibt.
**Folge:** Gering. Kurz irritierend; der Weg führt trotzdem sicher zur Stärke.
**Empfehlung:** In der Schnellerfassung durchnummerieren („2. Stärke“) oder im
Hinweis „im nächsten Schritt“ sagen.
**Nachprüfung:** Kopfzeile, Überschrift und Hinweis nennen dieselbe Nummer.

### R19-H3 [P3] Schnellerfassung „nur Stärke“: erst drei Bildschirme Organisation, Einheitstyp und Ebenen, ehe die Zähler erscheinen

**Neu oder alt (Verweis):** alt — Rest von R18-W7 (erstes Eingabefeld bei y = 248 statt
unter 200; jetzt ist das erste sichtbare Feld „Organisation“ bei y ≈ 384).
**Evidence:** Observed (360 × 640).
**Ort:** Startseite/Einsatz „Einheit schnell erfassen (nur Stärke)…“ › Schritt 1 › Weiter
› Schritt 2.
**Beobachtung:** Über dem ersten Feld stehen Kopf (140 px) und der zugeklappte Kasten
„Angaben vom Zettel (optional)“; Schritt 1 ist 1 799 px hoch (Organisation,
Organisationsname, Einheitstyp, drei Ebenen, Ort, Kürzel, Telefon, E-Mail). Die
Zähler „Führer / Unterführer / Mannschaft“ stehen erst nach „Weiter“ bei y = 433 bis
608; „Mannschaft +“ ist ohne Wischen nur knapp erreichbar. Ohne Ort verweigert die
App die Übernahme („Ort der Einheit fehlt“), der Weg dorthin führt zurück.
**Erwartung des Helfers:** „Nur Stärke“ heißt: Ort, drei Zahlen, fertig, auf einem
Bild.
**Folge:** Gering. Wer im Stehen eine Einheit durchwinkt, braucht je Einheit etwa drei
Bildschirme und ein Zurück, wenn er den Ort vergisst.
**Empfehlung:** Schnellerfassung als ein Bild: Ort, Organisation, Zähler; Typ, Ebenen
und Kontakt unter „Mehr angeben“.
**Nachprüfung:** 360 × 640: Ort und Zähler „Führer/Unterführer/Mannschaft“ sind ohne
Wischen sichtbar; Übernahme in zwei Tipps nach der Eingabe.

### R19-H4 [P3] Aufgeklappte Karte ist im Modus „Feld“ 923 px (360 × 640) und 1 004 px (320 × 568) hoch

**Neu oder alt (Verweis):** alt — Rest von R18-M7 (1 139 px bei 320 × 568, jetzt
1 004 px).
**Evidence:** Observed (Höhe der Karte „Nr. 1“ mit „Mehr…“, alle Modi gemessen).
**Ort:** Einsatzansicht › Karte › „Aufklappen“ › „Mehr…“.
**Beobachtung:** 320 × 568: Standard 749 px, Feld 1 004, Nacht und Dunkel 758.
360 × 640: Standard 630, Feld 923, Nacht und Dunkel 639. Das sind 1,4 bis 1,8
Bildschirme für eine Karte.
**Erwartung des Helfers:** Eine Karte, deren Knöpfe (Abrücken, Zug, Notiz, Mehr) auf
einen Blick erreichbar sind, ohne in der Karte zu blättern.
**Folge:** Gering. Wer „Entfernen“ oder „Stärke ändern…“ sucht, wischt in der Karte;
die Knöpfe stehen in zwei Gruppen mit „Weniger“ dazwischen.
**Empfehlung:** Zweite Knopfgruppe („Mehr…“) in einem eigenen Fenster statt unter der
Karte; im Modus „Feld“ die Knöpfe zweispaltig.
**Nachprüfung:** Karte mit „Mehr…“ höchstens 1,2 Bildschirme im Modus „Feld“ bei 320 ×
568.

### R19-H5 [P3] Rückfragen füllen 72 bis 85 % des Bildes

**Neu oder alt (Verweis):** alt — Rest von R18-S4 (Rückfrage „Nur Sollplätze, keine
gemeldete Stärke“, nicht gemessen); jetzt gemessen.
**Evidence:** Observed.
**Ort:** (a) „Nur Sollplätze, keine gemeldete Stärke“: 458 von 640 px (72 %) bei 360 ×
640, 482 von 568 (85 %) bei 320 × 568, 50 Wörter, drei Knöpfe mit Folge in der
Unterzeile; (b) „Meldung entfernen?“: 513 von 640 px (80 %), vier Absätze; (c)
„Stärke ändern“: 595 von 640 px (93 %).
**Beobachtung:** Die Folge steht jetzt am Knopf (Besserung gegenüber Runde 18), (a)
bleibt aber über der damals genannten Marke von 60 %. (b) enthält Nummern, Rückgängig
und Papierkorb in vier Absätzen vor den Knöpfen, die bei 431 px beginnen.
**Erwartung des Helfers:** Zwei Sätze und die Antwort im oberen Drittel.
**Folge:** Gering. Mit Handschuh wird der Dialog überflogen; alle Wege sind sicher
und folgenlos zu verlassen.
**Empfehlung:** (b) auf zwei Absätze kürzen („Nr. 1 entfernen? Rückholbar 7 Tage.
Nummern bleiben.“); Knöpfe oben im Dialog.
**Nachprüfung:** 360 × 640: (a) und (b) höchstens 60 % des Bildes.

### R19-H6 [P3] Quittung „Entfernt: …“ ist 118 px hoch und steht mindestens 30 s vor Knöpfen am Listenende

**Neu oder alt (Verweis):** alt — Rest von R18-A8 (Höhe nach „Entfernen“ nicht neu
gemessen).
**Evidence:** Observed (360 × 640 und 390 × 844: 118 bis 119 px; bei 360 × 640 sind das
19 % des Bildes; nach 10, 20 und 30 s noch da).
**Ort:** Einsatzansicht, untere Kante nach „Meldung entfernen“.
**Beobachtung:** Die Quittung (vier Zeilen, „Rückgängig“, „✕“) deckt „Blanko-Vordruck
(Papier-Reserve)“ und den Text darunter ab; die Quittung von „Zur Kenntnis genommen“
braucht 61 px.
**Erwartung des Helfers:** Eine kurze Zeile, die das Weiterarbeiten nicht verdeckt.
**Folge:** Gering. Wer gleich danach exportieren will, schiebt die Quittung weg.
**Empfehlung:** Zwei Zeilen („Nr. 1 entfernt. 7 Tage im Papierkorb.“ und Knöpfe), etwa
80 px.
**Nachprüfung:** Quittung nach „Entfernen“ höchstens 90 px bei 360 × 640.

### R19-H7 [P3] Reihen verschiedener Ziele mit 4 bis 6 px Abstand: Fußzeilen-Links und „Karten | Tabelle“

**Neu oder alt (Verweis):** alt — Rest von R18-G5 (Schrittleiste behoben: 8 px).
**Evidence:** Observed (360 × 640, automatische Messung).
**Ort:** (a) Fußzeile: „Anleitung | Aufbau des Bogens | Blanko-Vordruck“, „Kontakt |
Open Source“, die Organisationsliste („THW | Feuerwehr | DLRG | DRK | Johanniter |
Malteser | ASB | Katastrophenschutz | Bundeseinheiten | Bundeswehr | Meldekopf“),
„erfassungsbogen.app | nachrichtenvordruck.app“ — je 44 px hoch, 4 px Abstand; (b)
„Karten“ und „Tabelle“ 6 px Abstand.
**Beobachtung:** Die Ziele berühren sich fast; (b) ist eine Umschaltung mit sofortiger
Wirkung.
**Erwartung des Helfers:** Mindestens 8 px zwischen verschieden wirkenden Zielen.
**Folge:** Gering. Fehltipp führt zu einer anderen Seite (a, Verweis) oder zur anderen
Ansicht (b, ein Tipp zurück).
**Empfehlung:** 8 bis 12 px Abstand in den Linklisten, 12 px bei „Karten | Tabelle“.
**Nachprüfung:** Messung der Reihen: keine Lücke unter 8 px.

### R19-H8 [P3] Quittung eines Exports mit Dateiname und Speicherort liegt außerhalb des Sichtbereichs

**Neu oder alt (Verweis):** neu.
**Evidence:** Observed (360 × 640; „Übersicht als CSV“: Quittung bei y = −193, Knopf bei
y = 221 nach dem Tipp; 1, 2 und 5 s später unverändert; Lageblatt gleich).
**Ort:** Einsatzansicht › „Einsatz weitergeben / sichern“ › Knöpfe „Übersicht als CSV“,
„Alle Daten als CSV“, „Excel-Liste“, „Lageblatt“.
**Beobachtung:** Die Zeile „✓ Gespeichert: 2026-10-28_0237_eeb-einsatz_Uebung_Weser.csv
— im Download-Ordner bzw. über das Teilen-Menü abgelegt.“ erscheint 414 px über dem
getippten Knopf und damit über dem Bildrand; die Seite scrollt nicht dorthin. Sichtbar
ändert sich nur die kleine Zeile „Übersicht als CSV: zuletzt erzeugt …“ über den
Knöpfen und die Checkliste weit unten. Die Quittungsleiste (Daumenzone) wird für
Exporte nicht benutzt.
**Erwartung des Helfers:** Wie bei „Abgerückt“: Unten am Bildrand steht „Gespeichert:
Dateiname“.
**Folge:** Gering. Der Helfer weiß nach dem Tipp nicht sicher, ob eine Datei entstanden
ist und wo sie liegt; er tippt ein zweites Mal und erzeugt eine zweite Datei.
**Empfehlung:** Export-Quittung in die Quittungsleiste legen oder in Sicht bringen.
**Nachprüfung:** Export tippen: Zeile mit Dateinamen im Bildschirm sichtbar, ohne zu
scrollen.

### R19-H9 [P3] Tabelle am Telefon zeigt eine leere Spalte „Auftrag“ statt „Bedarf“; Bedarf nur nach Wischen durch 1 854 px

**Neu oder alt (Verweis):** alt — Rest von R17-H8 / R18-E5 (vier Kernspalten ohne
Wischen bleiben; die Auswahl der Spalten hat sich geändert: Runde 18 nannte „Einheit,
Ges., Meldung vor, Bedarf“).
**Evidence:** Observed (360 × 640, 4 Einheiten ohne Auftrag; Spalten „Einheit“, „Ges.“,
„Eingetr.“, „Auftrag“; Zeilen 94 px; „Alle Spalten zeigen“: 1 854 px breit in 326 px).
**Ort:** Einsatzansicht › „Tabelle“.
**Beobachtung:** Die Spalte „Auftrag“ ist in allen Zeilen leer („4 ohne Auftrag“), der
Bedarf (Diesel 80 l, Ruhezeit) steht nur in „Alle Spalten zeigen“; „Eingetr.“ zeigt
statt der Uhrzeit nur „02:39 ⚠ Stand vor 102 Tagen“ in vier Zeilen.
**Erwartung des Helfers:** Die Kernspalten zeigen, was in den Zeilen steht, und
Bedarf ist dabei.
**Folge:** Gering. Wer Diesel- und Unterbringungsbedarf je Zug vergleicht, wischt nach
rechts oder blättert in Karten.
**Empfehlung:** Leere Spalten ausblenden und „Bedarf“ als Kernspalte behalten.
**Nachprüfung:** Tabelle bei 360 × 640 ohne Aufträge: „Bedarf“ sichtbar, keine ganz
leere Spalte.

### R19-H10 [P3] Startseite: „Neue Einsatz-Sammlung…“ steht unter dem Bildrand (y = 753 bei 360 × 640, Knopf endet bei 875 bei 390 × 844)

**Neu oder alt (Verweis):** neu (Runde 18 prüfte Sprung und Zielgrößen, nicht die Lage
des Meldekopf-Wegs).
**Evidence:** Observed (Lage über 6 s unverändert: 360 × 640: „Neuen Bogen erstellen“
395, „Neue Einsatz-Sammlung…“ 753, „Einheit schnell erfassen“ 811; 390 × 844: 440, 830,
888).
**Ort:** Startseite, erster Bildschirm.
**Beobachtung:** Der Kopf mit Titel und Einleitung nimmt 395 von 640 px ein; zuerst
steht „Meinen Bogen ausfüllen“ mit vier Knöpfen, der Meldekopf-Weg beginnt erst nach
dem Wischen und ragt bei 390 × 844 über den Rand (830 + 45 > 844).
**Erwartung des Helfers:** Ein Meldekopf-Helfer sieht „Bögen sammeln“ ohne Suchen.
**Folge:** Gering. Wer den Meldekopf betreut, sucht den Knopf unter dem Falz; gerade
beim ersten Aufruf mit Kopf in Zweizeilen-Titel und Einleitung.
**Empfehlung:** Kopf kompakter (Titel einzeilig, Einleitung kürzer) oder die beiden
Wege nebeneinander als zwei große Karten über dem Falz.
**Nachprüfung:** 390 × 844 und 360 × 640: beide Hauptwege („Neuen Bogen erstellen“,
„Neue Einsatz-Sammlung…“) vollständig über dem Falz.

### R19-H11 [P3] „Übergabe vermerken…“: Feld „An (Name oder Stelle)“ ist nicht als freiwillig gekennzeichnet; „Vermerken“ ohne Eintrag wird ohne Quittung angenommen

**Neu oder alt (Verweis):** neu.
**Evidence:** Observed (360 × 640; Dialog 44 px hohe Knöpfe; leeres Feld, „Vermerken“:
Dialog schließt, Checkliste zeigt „✓ Übergabe vermerkt 28.10.2026, 02:43.“; keine
Quittung unten).
**Ort:** Einsatzansicht › Übergabe und Abschluss › „Übergabe vermerken…“.
**Beobachtung:** Der Vermerk steht ohne Empfänger („An“ fehlt) in der Checkliste; ein
Hinweis „ohne Empfänger“ fehlt, ebenso eine Bestätigung am Bildrand. Auch „Einsatz als
beendet markieren“ geht ohne Rückfrage und Quittung (die Zeile „Einsatz beendet … —
noch offen: …“ mit „Wieder öffnen“ erscheint weit oben beim Kopf des Einsatzes, nicht im
Blickfeld des Knopfs).
**Erwartung des Helfers:** Das Papier-Kästchen „übertragen“ trägt Datum, Uhrzeit und
Namen; das Feld sagt, ob es Pflicht ist.
**Folge:** Gering. Ablösung und Stab können später nicht sehen, an wen übergeben wurde;
beide Schritte sind umkehrbar („Vermerk entfernen“, „Wieder öffnen“).
**Empfehlung:** „An (Name oder Stelle, freiwillig)“; in der Checkliste „Übergabe
vermerkt, ohne Empfänger“; beide Schritte mit Quittung unten.
**Nachprüfung:** Vermerken ohne Eintrag: Checkliste nennt „ohne Empfänger“, Quittung
am Bildrand; „Beenden“ zeigt sichtbare Quittung mit „Rückgängig“.

## Comprehension check

- Orientation: understood
- Next action: understood
- System status: understood (gespeichert/„nur auf diesem Gerät“, Quittungen, Papierkorb
  mit Ablaufdatum, Abschluss-Checkliste; Ausnahme Export-Quittung außerhalb des Bildes,
  R19-H8)
- Error recovery: understood (Rückgängig bei Kenntnis, Abrücken, Entfernen,
  Vorbelegung; Rückfragen mit sicherem „Abbrechen“; Papierkorb; Entwurf nach Neuladen)
- Field suitability: limited (nicht verifiziert: Handschuhe, Sonnenlicht, Kamera,
  echte Tastatur; alle gemessenen Befunde sind P3)
