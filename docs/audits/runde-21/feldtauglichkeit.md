# Audit „Helfer im Feld“, Runde 21 (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-10-29 ·
Prüfgegenstand: Web-App, Produktionsbuild (Port 4173), Code-Stand Commit `f007590` (`main`, Runde 20; Merge `17f1487`).

Zählung: **P0 1 · P1 0 · P2 1 · P3 6 · Hinweise 5** (Hinweise ohne Priorität, nicht in der Zählung)

Reiner Prüfbericht, keine Codeänderung. Es gibt keine „bekannten Grenzen“: Reste aus den Runden 11 bis 20,
die im Browser noch zu beobachten sind, stehen mit Verweis im Feld „Neu oder alt (Verweis)“. Behebungen, die im
Browser nicht mehr zu beobachten sind, stehen nur unter „Bestätigt“. Je Sachverhalt ein Befund; der Typ steht im
Kopf jedes Befunds (Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast).

## Prüfaufbau

Playwright/Chromium (globales Modul, `chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE,
Telefon 390 × 844, 360 × 640, 320 × 568, Querformat 568 × 320 / 640 × 360, frischer Kontext je Lauf, Tipps als
Touch-Tipps. Einsatzdaten: Sammlung „Übung Weser“ mit drei per Schnellerfassung abgelegten Einheiten
(„THW Oldenburg“, „Feuerwehr Husum“, „DRK Bremen“) und vier Beispielbögen aus `examples/thw/`; eigener Bogen im
Assistenten (Entwurf, Schließen, Zurückholen). Voller Speicher: `localStorage` mit Füllschlüsseln bis zum
Quota-Fehler gefüllt.

Nachgeladene Teile (Zeichensammlung, Einsatzansicht): (1) Netzdrosselung über das Chrome-DevTools-Protokoll
(„schnelles 4G“ 1,6 MBit/s, 150 ms; „langsames 3G“ 400 kBit/s, 400 ms), Service Worker blockiert, Zeitverlauf von
Platzhalter, Kartenlage und Zeichen alle 250 ms gemessen; (2) Offline: nach dem ersten Laden und der Meldung „Jetzt
offline bereit“ das Netz getrennt (`setOffline`), danach Neuladen, Startseite, Einsatz öffnen, Assistent,
Blanko-PDF, „Bogen übergeben“; (3) Abgleich der Dateien in `dist/assets` mit dem Precache des Service Workers.
Kontrast: alle sichtbaren Textknoten in Standard und Feld, Stichprobe in Dunkel und Nacht mit aufgeklapptem Block.

**Nicht verifiziert:** echte Handschuhe und nasse Finger, Sonnenlicht und Dunkelheit am Display, Kamera-Scan,
echte Bildschirmtastatur, WebKit/Safari, echtes Drucken, Inhalt der erzeugten PDF-Seiten, ein echtes Mobilnetz
(die Drosselung ist nur eine Annäherung), das Verhalten auf einem anderen Webserver als `vite preview`
(siehe R21-H1: dort ist der Befund sogar „Likely“ auch online).

## Urteil

Fast alle Szenarien wurden **abgeschlossen**, ohne Datenverlust. Die Behebungen aus Runde 20 halten (siehe
„Bestätigt“). **Nicht abgeschlossen** ist ein Szenario, das erst durch das Nachladen entstanden ist: Wer die
App einmal online geladen hat, das Netz verliert und dann die Einsatzansicht öffnet (nach Neuladen oder frisch
gestarteter App), landet auf der Fehlerseite „Hier ist etwas schiefgelaufen“. Die Einsatz-Sammlung ist offline
nicht erreichbar, obwohl die Startseite „Funktioniert komplett offline“ zusagt (R21-H1, P0). Daneben: eine
Einheit eines anderen Verbands wird in der Schnellerfassung stillschweigend als „THW …“ abgelegt (R21-H2, P2).
Der Rest sind Kleinigkeiten (P3), überwiegend Reste.

## Bestätigt (Behebungen aus Runde 20 halten im echten Browser)

- **Voller Speicher, Bogen schließen:** „Bogen schließen“ › „Bogen schließen“: „Nicht geschlossen — Speicher
  voll … Der Bogen bleibt offen, nichts hat sich geändert. Erst als Datei sichern, dann Platz schaffen.“ mit
  „Bogen als Datei sichern“ / „Bogen bleibt offen“; die Karte „Fortsetzen“ bleibt, nach Neuladen liegt der Entwurf
  noch da. **Zurückholen:** „Zuletzt geschlossenen Bogen zurückholen“ bei vollem Speicher tauscht Entwurf und
  Rückholplatz; nach Neuladen steht „THW Husum Bergungsgruppe“ als Entwurf, „THW Kiel Fachgruppe Räumen“ auf dem
  Rückholplatz. Nichts ging verloren.
- **„Endgültig löschen“ im Notweg:** „Einsatz löschen…“ › „In den Papierkorb“ › „Nicht gelöscht“ › „Endgültig
  löschen…“ › zweite Rückfrage „„Übung Weser“ endgültig löschen? 3 Meldungen sind danach weg … Es gibt noch keinen
  Export: das wäre die einzige Kopie.“ Beide Schritte nötig, „Einsatz behalten“ in jedem Schritt.
- **Weitere Speicher-voll-Wege:** „Meldung entfernen“ › „Papierkorb voll – Meldung Nr. 1 „THW Oldenburg“ kam nicht
  in den Papierkorb … Endgültig entfernen?“ (nennt jetzt Nr. und Namen); „Abrücken“: „Nr. 1 „THW Oldenburg“ ist nicht
  als abgerückt vermerkt. Der Speicher ist voll — erst sichern …“ (kurz, nennt die Einheit); „Zur Kenntnis genommen“:
  Dialog „Kenntnisnahme nicht gespeichert“, danach keine Erfolgsquittung mehr.
- **Kein „THW THW Oldenburg“:** Ort „THW Oldenburg“ eingetragen: Karte „Nr. 1 THW Oldenburg“, Quittung „Nr. 1
  „THW Oldenburg“ abgelegt — Nummer auf den Zettel schreiben“ in der Leiste im ersten Bild.
- **„Ort der Einheit ändern…“** (Karte › „Mehr…“): Feld mit „Oldenburg“ vorbelegt, „Ort übernehmen“; nach „Delmenhorst“
  steht „Nr. 1 THW Delmenhorst“, „Name geändert: „THW Oldenburg“ → „THW Delmenhorst““, Historie, Rückgängig.
- **Schnellerfassung:** „Schritt 1 von 4: Einheit“, „Schritt 2 von 4: Personal“, „Schritt 3 von 4: Fahrzeuge“
  (Zählung stimmt, die Zahlenliste „2, 5 entfallen“ ist weg; Überschrift siehe R21-H3). Kopf „‹ Einsatz „Übung Weser““
  wird umgebrochen und ist vollständig. Fußleiste: „In Einsatz übernehmen“ ohne Überlauf bei 360 px.
- **Scanner ohne Kamera quer:** 568 × 320 Feld und 640 × 360: Anleitung, „Bereit — warte auf den Handscanner“,
  „Hinweise zum Handscanner“, „QR aus Bild einlesen…“ und „Fertig“ vollständig im Bild, Fenster 320 px hoch ohne
  inneres Rollen.
- **Einsatzansicht quer:** 568 × 320 Feld: „Bogen scannen…“ (68 px) vollständig im ersten Bild, Schalter „Ansicht:
  Feld“ im Kopf. „Ansicht“ steht jetzt auch im Kopf der Einsatzansicht bei 360 px.
- **Dialoge bei 320 × 568:** „Datensicherung“ 854 px Inhalt (vorher 1 141), „Alle Daten löschen“ 671 px (vorher 774);
  „Sicherung erstellen…“ bei y = 458, Haken bei y = 328 und „Endgültig löschen“ bei y = 422 ohne Wischen im Bild.
- **Tabelle am Telefon:** 338 px in 360 px, 296 in 320, 368 in 390, kein seitliches Überlaufen; Köpfe „Einheit /
  Stärke / Eingetroffen“ ausgeschrieben, Schrift 14 px, Zeilen 57 px; „Alle Spalten zeigen“ und „Suchen, sortieren,
  filtern“ mit 10 px Abstand.
- **Zielgrößen und Überlauf:** keine Fläche unter 44 px außer „Zum Inhalt springen“ (nur bei Tastaturfokus) und den
  Haken in eingeklappten Blöcken; kein seitliches Überlaufen bei 320, 360, 390; Sprungverweise „Weitergeben …“ und
  „Übergabe, Abschluss“ stehen mit 11 px Abstand.
- **Kontrast:** in Standard und Feld (Startseite und Einsatzansicht, alle Bildlaufstellen) kein Text unter 4,5 : 1;
  in Nacht mit aufgeklapptem Block „Neu seit der letzten Kenntnisnahme“ gut lesbar.
- **Nachgeladene Zeichensammlung:** Entwurfskarte auf der Startseite: die Karte steht mit leerem Quadrat 42 × 42 px an
  der Stelle, das Zeichen erscheint 0,45 s (schnelles 4G) bis 1,7 s (langsames 3G) später, ohne dass die Karte
  springt (Höhe 212 px, y = 249 vorher und nachher). Offline ist die Sammlung im Precache.
- **Offline ohne Einsatz:** Neuladen offline: Startseite, „Neuen Bogen erstellen“ (Assistent), Blanko-PDF
  (Download „einheiten-erfassungsbogen-blanko.pdf“), „Bogen übergeben“ mit „QR-Code im Vollbild zeigen“ / „PDF
  erzeugen“ funktionieren; kein fehlgeschlagener Abruf.

## Befunde

### R21-H1 [P0] Einsatzansicht offline nicht zu öffnen: Fehlerseite „Hier ist etwas schiefgelaufen“ („Unable to preload CSS“)

- **Typ:** Bedienung (Funktion nicht nutzbar)
- **Neu oder alt (Verweis):** neu (Folge der Nachladung der Einsatzansicht in Runde 20; die Startseite sagt dazu „Funktioniert komplett offline“, R19-O/R20-Offline).
- **Evidence:** Observed (360 × 640, mehrfach, drei Wege), Ursache Observed im Build; „auch online auf anderem Server“ Likely.
- **Ort:** Startseite › Einsatz-Karte › „Öffnen“; ebenso Neuladen mit zuletzt geöffnetem Einsatz.
- **Beobachtung:** Erst online geladen, bis „✓ Jetzt offline bereit. Funktioniert komplett offline — alle Daten
  bleiben auf diesem Gerät.“ gewartet, Sammlung „Übung Weser“ mit Bögen angelegt, dann Netz getrennt.
  (a) Neuladen, „Öffnen“: Seite „Hier ist etwas schiefgelaufen — Die Ansicht ließ sich nicht aufbauen. Deine Daten
  liegen weiter auf diesem Gerät …“ mit „Neu laden“, „Zur Startseite“, „Daten sichern“. (b) „Zur Startseite“ und
  erneut „Öffnen“: dieselbe Fehlerseite, jedes Mal. (c) App neu geöffnet (zweite Seite, gleiche Daten), 3 s warten,
  Netz trennen, „Öffnen“: dieselbe Fehlerseite, ohne Neuladen. Der Assistent, die Startseite ohne Einsatz, das
  Blanko-PDF und „Bogen übergeben“ funktionieren offline; nur die Einsatz-Sammlung nicht. Konsole: „Error: Unable to
  preload CSS for http://localhost:4173/assets/index-Bp0pLAQP.css“. Die Datei gibt es im Build nicht
  (`dist/assets` enthält nur `lagemonitor-ui-….css`; die Stile stehen in `index.html`), der nachgeladene Block
  `einsaetze-ui-….js` verweist aber noch auf sie. Online fängt `vite preview` die Adresse mit der Startseite ab (HTTP 200,
  `text/html`), deshalb fällt es dort nicht auf; offline holt der Service Worker sie nicht aus dem Vorrat (nicht im
  Precache), der Abruf scheitert, das Nachladen bricht ab. Ein Webserver, der für die fehlende Datei 404 liefert, würde
  die Fehlerseite wohl auch online zeigen (Likely, nicht geprüft). Die Fehlerseite nennt den Grund nicht und rät zu
  „Neu laden“, was offline nichts ändert.
- **Erwartung des Helfers:** Die App sagt „offline bereit“; am Meldekopf ohne Netz öffnet er seine Sammlung wie sonst.
- **Folge:** Ohne Netz ist die Kernfunktion der Sammlung (Lage, Karten, Abrücken, Export, Übergabe) nach Neustart der
  App oder des Telefons nicht erreichbar; nur „Daten sichern“ bleibt. Der Helfer hält die App für kaputt und greift
  zum Papier. Gerade im Funkloch (Einsatzort) ist das der Hauptfall. Daten gehen nicht verloren.
- **Empfehlung:** Den Verweis auf die nicht vorhandene Stildatei aus dem nachgeladenen Block entfernen (oder die Datei
  in den Precache nehmen bzw. die Stile wieder als Datei ausliefern); beim Ladefehler der Einsatzansicht einen eigenen
  Text zeigen („Ansicht nicht geladen — Verbindung prüfen“) mit „Nochmal versuchen“; den Hinweis „Funktioniert komplett
  offline“ erst zeigen, wenn dieser Test besteht.
- **Nachprüfung:** Online laden, „Jetzt offline bereit“ abwarten, Netz trennen, Neuladen, „Öffnen“: Einsatzansicht mit
  Karten, Tabelle, „Bogen scannen…“ erscheint; zusätzlich ohne Neuladen und mit Netz-aus unmittelbar nach dem ersten
  Laden; `dist` und Precache auf nicht vorhandene Verweise prüfen.

### R21-H2 [P2] Schnellerfassung: Eine Einheit eines anderen Verbands wird als „THW …“ abgelegt, die Organisation steht eingeklappt und ist an der Karte nicht änderbar

- **Typ:** Daten/Verlust (falsche Angabe im Bestand)
- **Neu oder alt (Verweis):** neu (verwandt mit R20-H1, dort „THW THW Oldenburg“; jetzt die Gegenrichtung).
- **Evidence:** Observed (360 × 640).
- **Ort:** Einsatz › „Einheit schnell erfassen (nur Stärke)…“ › „Ort der Einheit (Pflicht)“; Organisation unter
  „▸ Organisation, Ebene, Kontakt (optional)“; danach Karte › „Mehr…“.
- **Beobachtung:** Ich trage ab, was auf dem Zettel steht: „DRK Bremen“ (und „Feuerwehr Husum“). Die Organisation
  steht unsichtbar auf „THW“; sie liegt eingeklappt unter einem Block mit „(optional)“. Ergebnis: Liste und Tabelle
  zeigen „Nr. 3 THW DRK Bremen“, „Nr. 2 THW Feuerwehr Husum“; die Karte trägt „THW · Stärke …“. Unter „Mehr…“ (Aufteilen,
  Stärke ändern, Als Übung kennzeichnen, Ort der Einheit ändern, Verschieben, Entfernen) gibt es keine Änderung der
  Organisation. Beim Eintippen weist nur der Satz „„DRK Bremen“ ist nicht im OV-Verzeichnis …“ auf etwas hin, nicht auf
  die Organisation.
- **Erwartung des Helfers:** Er schreibt den Namen vom Zettel; steht „DRK“ darin, wird es DRK (oder die App fragt).
- **Folge:** Fremde Einheiten stehen als THW im Lageblatt, in der CSV und in der Organisations-Zählung; Korrektur nur
  über „Entfernen“ und neu erfassen, dabei bleibt die Nummer frei und weicht vom Zettel ab.
- **Empfehlung:** Organisation im ersten Bild sichtbar halten (eine Zeile, nicht „optional“) oder aus dem Namen
  erkennen und rückfragen; an der Karte „Organisation ändern…“ neben „Ort der Einheit ändern…“.
- **Nachprüfung:** „DRK Bremen“ eintragen: Karte zeigt DRK (oder die Rückfrage erscheint); Organisation an der Karte änderbar.

### R21-H3 [P3] Schnellerfassung: Kopf „Schritt 2 von 4: Personal“ steht über der Überschrift „3. Personal“

- **Typ:** Text
- **Neu oder alt (Verweis):** alt, R20-H3 (Rest: die Zählung im Kopf ist behoben, die Überschriften zählen weiter nach dem Vollassistenten; R19-A5).
- **Evidence:** Observed (360 × 640).
- **Ort:** Schnellerfassung, Kopfband und Überschrift je Schritt.
- **Beobachtung:** „Schritt 1 von 4: Einheit“ / „1. Einheit“; „Schritt 2 von 4: Personal“ / „3. Personal“; „Schritt 3 von 4:
  Fahrzeuge“ / „4. Fahrzeuge“. Die Zahlen widersprechen sich im selben Bild.
- **Erwartung des Helfers:** Die Zahl über dem Formular ist die Zahl im Kopf.
- **Folge:** Gering. Kurze Irritation („fehlt ein Schritt?“).
- **Empfehlung:** In der Schnellerfassung die Überschriften ohne Nummer oder mit der Zählung des Kopfes.
- **Nachprüfung:** Kopf und Überschrift zeigen dieselbe Zahl in allen vier Schritten.

### R21-H4 [P3] Nach dem Einlesen liegt die erste Einheitenkarte 1,6 bis 1,8 Bildschirme unter dem Kopf

- **Typ:** Layout/Abstand
- **Neu oder alt (Verweis):** alt, R20-H5 / R20-W6 / R20-G6 (Rest; R19-W4).
- **Evidence:** Observed (360 × 640).
- **Ort:** Einsatzansicht nach Schnellerfassung (3 Einheiten) und nach „Bögen einlesen…“ (4 Beispielbögen).
- **Beobachtung:** Überschrift „Einheiten (…)“ liegt bei y = 887 bis 897, die erste Karte „Nr. 1“ bei y = 1 010
  (drei Einheiten) und y = 1 153 (sieben, nach dem Einlesen); der Bildschirm ist 640 px hoch. Davor stehen Kennzahlen,
  die vier Aufnahmeknöpfe, Quittung, „Neu seit der letzten Kenntnisnahme“, Zug-Formular, Bedarf und Sprungverweise.
- **Erwartung des Helfers:** Nach dem Einlesen sieht er die eben aufgenommene Einheit.
- **Folge:** Gering; „Zur Einheitenliste ↓“ führt hin, wenn man den Verweis findet.
- **Empfehlung:** Liste unmittelbar nach den Kennzahlen; Aufnahmeknöpfe und Zug-Formular nach unten oder einklappen.
- **Nachprüfung:** Erste Karte unter y = 960 (1,5 Bildschirme) bei 360 × 640 nach dem Einlesen.

### R21-H5 [P3] Assistent im Querformat „Feld“ (568 × 320): „Ort der Einheit (Pflicht)“ liegt zur Hälfte unter der Fußleiste

- **Typ:** Layout/Abstand
- **Neu oder alt (Verweis):** alt, R20-N2 (Rest).
- **Evidence:** Observed (568 × 320, Feld; Standard 568 × 320 und 640 × 360 ohne Befund).
- **Ort:** „Neuen Bogen erstellen“, Schritt 1.
- **Beobachtung:** Die feste Leiste („Ansicht“, „Weiter →“) beginnt bei y = 255, das Feld „Ort der Einheit (Pflicht)“ liegt bei
  y = 238 bis 291; im ersten Bild sieht man die obere Hälfte, das Feld mit dem Fokus-Rahmen ist abgeschnitten. Erst
  der Tipp ins Feld rollt es frei (y = 120 bis 173).
- **Erwartung des Helfers:** Das Pflichtfeld steht im ersten Bild vollständig da.
- **Folge:** Gering; ein Tipp auf die sichtbare Hälfte genügt.
- **Empfehlung:** Im Querformat „Feld“ Organisation und Organisationsname in eine Zeile oder das Ortsfeld nach oben.
- **Nachprüfung:** 568 × 320 Feld, Schritt 1: Ortsfeld vollständig über der Leiste, ohne Wischen.

### R21-H6 [P3] Bei vollem Speicher sagt die erste Rückfrage zu, was die nächste widerruft

- **Typ:** Text
- **Neu oder alt (Verweis):** neu (Folge der Behebung von R20-D1 / R20-W1; die Handlungen sind sicher, die Reihenfolge der Texte neu).
- **Evidence:** Observed (360 × 640, Speicher gefüllt).
- **Ort:** „Bogen schließen“ (Startseite) und „Einsatz löschen…“ › „In den Papierkorb“.
- **Beobachtung:** Erste Rückfrage „Angefangenen Bogen schließen? … Der Stand bleibt auf der Startseite unter „Zuletzt
  geschlossenen Bogen zurückholen“ erreichbar.“ bzw. „Einsatz löschen? … wandert in den Papierkorb und lässt sich dort
  30 Tage lang zurückholen.“; nach der Bestätigung die zweite: „Nicht geschlossen — Speicher voll“ bzw. „Nicht gelöscht
  — Der Speicher ist voll …“. Die Startseite zeigt den vollen Speicher bereits in der Warnzeile darüber.
- **Erwartung des Helfers:** Wenn der Speicher voll ist, sagt die erste Frage es oder fragt gar nicht erst.
- **Folge:** Gering. Zwei Dialoge und ein Versprechen, das nicht gilt; kein Datenverlust.
- **Empfehlung:** Bei bekanntem vollem Speicher direkt die Notweg-Rückfrage zeigen.
- **Nachprüfung:** Speicher füllen, „Bogen schließen“ und „Einsatz löschen…“: ein Dialog, der den vollen Speicher nennt.

### R21-H7 [P3] Texte bei vollem Speicher bleiben lang: Warnzeile auf der Startseite acht Zeilen, „Nicht gelöscht“ fünf Sätze

- **Typ:** Text
- **Neu oder alt (Verweis):** alt, R20-H13 (Rest: „Abrücken“ und „Papierkorb voll“ sind kurz und nennen die Meldung, die übrigen nicht).
- **Evidence:** Observed (360 × 640, Speicher gefüllt).
- **Ort:** Startseite, Warnzeile „⚠ Gerätespeicher ist voll: 100 % (5 von 5 Mio. Zeichen) …“; Dialog „Nicht gelöscht“.
- **Beobachtung:** Die Warnzeile belegt acht Zeilen (etwa 220 px) und schiebt die Entwurfskarte unter den halben Bildschirm;
  sie spricht von „Zeichen“, „Ablegen in den Papierkorb“, „einen gesicherten Einsatz dort „Endgültig löschen…““. „Nicht
  gelöscht“: „… Erst sichern (Einsatz weitergeben / sichern). Platz schafft dann „Entfernen“ bei einer Einheit (mit
  „Endgültig entfernen“ in der Rückfrage), zuletzt „Alle Daten löschen“ (nach der Sicherung).“
- **Erwartung des Helfers:** Ein Satz, was nicht geschah, ein Satz, was jetzt zu tun ist.
- **Folge:** Gering. Unter Zeitdruck wird der Absatz überflogen; die Aktionsknöpfe rücken nach unten.
- **Empfehlung:** Warnzeile auf zwei Zeilen („Speicher voll — nichts wird mehr gespeichert. Erst sichern.“) mit „Mehr dazu“.
- **Nachprüfung:** Warnzeile höchstens drei Zeilen; Entwurfskarte im ersten Bild.

### R21-H8 [P3] „Datensicherung“ bei 320 px im Modus „Feld“: Der Titel bricht mitten im Wort („Datensicherun / g“)

- **Typ:** Layout/Abstand
- **Neu oder alt (Verweis):** neu (Nebenwirkung der Dialog-Verkürzung aus R20-H9).
- **Evidence:** Observed (320 × 568, Feld).
- **Ort:** Fußzeile › „Datensicherung“, Titelzeile neben „Schließen“.
- **Beobachtung:** Der Titel steht in zwei Zeilen „Datensicherun“ und „g“, weil „Schließen“ (Feld-Schrift) fast die halbe
  Breite belegt; die Trennung steht mitten im Wort. „Alle Daten löschen“ bricht an Wortgrenzen.
- **Erwartung des Helfers:** Der Titel steht ganz, „Schließen“ rutscht darunter.
- **Folge:** Gering; lesbar, wirkt fehlerhaft.
- **Empfehlung:** Titel über die volle Breite, „Schließen“ in eigener Zeile bei schmalem Fenster.
- **Nachprüfung:** 320 × 568 Feld: Titel ohne Silbentrennung im Wort.

## Hinweise (ohne Priorität, keine Beeinträchtigung der Aufgabe)

1. **Platzhalter beim Nachladen:** Die Einsatzansicht steht beim Laden als leere Fläche da (bei „schnellem 4G“ etwa
   0,5 s, bei „langsamem 3G“ etwa 1,8 s), ohne sichtbaren Text; „wird geladen“ steht nur für Hilfstechnik. Die Startseite
   springt dabei nur um 16 px („Neuen Bogen erstellen“ y = 547 auf 563), die Zeichen erscheinen bis 1,7 s später als
   der Kartentext. Wirkt weder wie ein Sprung noch wie ein Fehler; sichtbar nur beim langsamen Netz.
2. **Fußleiste der Schnellerfassung:** „← Zurück“ zeigt bei 320 und 360 px nur „←“ (44 px, Name bleibt „Zurück“), wie in Runde 20.
3. **Tabelle:** Köpfe und Zellen 14 px, die übrige App 16 bis 18 px; lesbar, bei Sonne knapp.
4. **Platzhalter „meist leer – OV unten eintragen“** (Organisationsname) ist bei 568 px quer und 320 px abgeschnitten;
   „OV“ ist THW-Sprache.
5. **Datensicherung bei 320 px Feld:** „Dauerhaften Speicher anfragen“ liegt bei y = 742 und braucht einen Wischer; der
   Weg „Sicherung erstellen…“ ist ohne Wischen erreichbar.

## Comprehension check

- Orientation: understood (Kopf, Marke „Schnellerfassung“, Quittungen; Ausnahme R21-H3)
- Next action: understood (Hauptknopf je Bild; offline in der Einsatzansicht: failed, R21-H1)
- System status: uncertain (Startseite sagt „Funktioniert komplett offline“, die Einsatzansicht öffnet offline nicht, R21-H1)
- Error recovery: understood (Speicher-voll-Wege sicher; die Fehlerseite offline sagt nicht, was zu tun ist, R21-H1; falsche Organisation nur über Entfernen, R21-H2)
- Field suitability: limited (offline: unsuitable bis R21-H1 behoben; online suitable)
