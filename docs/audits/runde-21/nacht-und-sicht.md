# Audit „Nacht und Sicht", Runde 21

Prüfer: Rollenaudit `thw-night-visibility-reviewer` · Datum: 2026-10-29 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (laufender `vite preview`, Code-Stand
Commit `f007590` = `main`) · Zählung: **P0 1 · P1 0 · P2 1 · P3 5 · Hinweise 2**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md`, der Abschnitt
„Stand der Behebung" von Runde 20 und der Bericht „Nacht und Sicht" von Runde 20. Es gibt keine
„bekannten Grenzen": Punkte mit Stand „offen" oder „nicht ganz erreicht" sind gemeldet, wenn sie im
Browser noch zu sehen sind. Zählregel: ein Befund je Sachverhalt, ein Typ je Befund (Daten/Verlust,
Bedienung, Layout/Abstand, Text, Kontrast); P3 nur bei echter Beeinträchtigung der Aufgabe, der Rest
steht unter „Hinweise" ohne Priorität.

## Prüfaufbau

Chromium über das globale Playwright-Modul, `chromium.launch()` ohne Optionen, `isMobile`/`hasTouch`,
Locale de-DE. Viewports 390 x 844 und 360 x 640, dazu 320 x 568 (Dialoge, Tabelle) und quer
568 x 320 und 640 x 360 (Scanner, Assistent). Alle vier Ansichten (Standard, Dunkel, Feld, Nacht) über
`eeb.anzeigemodus.v1`. Zustand: Sammlung „Hochwasser Nord" mit zwei bis sechs Bögen aus `examples/thw/`
(Übung) sowie Einheiten aus der Schnellerfassung (echt).

Gemessen: Kontrast jedes sichtbaren Textknotens gegen die zusammengesetzte Hintergrundfläche (Schwelle
4,5 : 1, Schrift unter 12 px), Zielgrößen unter 44 px, waagerechtes Rollen. Geprüfte Zustände:
Startseite, Einsatzansicht, aufgeklappte Karte, „Mehr…", „Ort der Einheit ändern…", Tabelle,
Scanner ohne Kamera (auch mit aufgeklappten Handscanner-Hinweisen), Schnellerfassung Schritt 1 bis 3,
Vollassistent Schritt 1, voller Gerätespeicher (`localStorage` bis zum Quota-Fehler gefüllt) mit Bogen
schließen, ersetzen, zurückholen, „Einsatz löschen" und „Endgültig löschen".
Offline: Service Worker aktiv, 659 Einträge im Cache (Wartezeit bis über 540), dann
`context.setOffline(true)`, jeweils mit und ohne Neuladen. Nachladen: warmer Service Worker mit 6-facher
CPU-Drosselung (Layout-Sprünge über `layout-shift`, Zustand `data-zeichen` der Zeichen) und kalter Start
ohne Service Worker bei 400 kbit/s und 300 ms Latenz.

**Nicht prüfbar:** echtes Licht (Sonne, Scheinwerfer, Rotlicht), Displayhelligkeit, Kamerabild im
Dunkeln (keine Kamera), Rot-Grün-Schwäche am echten Auge, Ausdruck, echte Bildschirmtastatur.

## Urteil aus Sicht der Rolle

Kontrast und Codierung halten: In allen vier Ansichten, den Viewports 360 x 640 und 390 x 844 und allen
genannten Zuständen (auch bei vollem Speicher, in Rückfragen und im Scanner quer) liegt kein sichtbarer
Text unter 4,5 : 1 und keine Schrift unter 12 px; die Seite rollt nie waagerecht; Zustände tragen
Wort oder Form („⚠ Nicht gespeichert", „ÜBUNG", „neu", „⚠ Stand vor 103 Tagen"). Das Nachladen von
Zeichensammlung und Einsatzansicht ist **online und mit warmem Service Worker nicht spürbar**: Die
Einsatzansicht steht nach rund 60 bis 570 ms (6-fach CPU), es gibt keinen sichtbaren Platzhalter; die
Zeichen erscheinen nach etwa 210 ms ohne Höhensprung (unsichtbares Quadrat gleicher Größe),
Layout-Verschiebung 0,006 bis 0,03. **Offline dagegen ist die Einsatzansicht unbrauchbar** (R21-L1):
Wer ohne Netz einen Einsatz öffnet, sieht „Hier ist etwas schiefgelaufen", obwohl die Startseite
„Funktioniert komplett offline" verspricht. Bogen, Assistent, Beispielbögen und Datenschutz laufen
offline einwandfrei. Der Rest sind kleine Layout- und Textpunkte.

## Prüfung der Behebungen aus Runde 20 (im echten Browser)

| Behebung | Ergebnis |
| --- | --- |
| Bogen bei vollem Speicher schließen / ersetzen / zurückholen (R20-D1) | hält: Rückfrage nennt den Weg zurück; nach „Bogen schließen" und Neuladen steht „Zuletzt geschlossenen Bogen zurückholen"; „Neu anfangen" legt den Stand ab; Zurückholen stellt „THW Testort Alpha" wieder her; Statuszeile sagt ehrlich „⚠ Nicht gespeichert — der Speicher dieses Geräts ist voll" |
| „Endgültig löschen" im Notweg (R20-W1) | hält: „Nicht gelöscht" bietet „Endgültig löschen…", danach eigene Rückfrage „3 Meldungen sind danach weg … einzige Kopie"; Einsatz bleibt bis „Ja, endgültig löschen" |
| Kein „THW THW Oldenburg" (R20-H1) | hält: Schnellerfassung mit Ort „THW Oldenburg" ergibt „Nr. 3 THW Oldenburg" |
| „Ort der Einheit ändern…" | hält: Name wechselt, Historie nennt „Name geändert: … → …", „Rückgängig" in der Quittung (Feld bei 320 px siehe R21-L5) |
| Schnellerfassung mit Schrittzählung | zählt „Schritt 1 von 4" bis „3 von 4"; Rest siehe R21-L3 |
| Scanner ohne Kamera quer (R20-L5/E1) | hält: bei 568 x 320 in Feld und Nacht sind Fußknöpfe sichtbar, aufgeklappte Handscanner-Hinweise vollständig lesbar |
| Dialoge bei 320 px | halten bis auf R21-L5 |
| Tabelle am Telefon | hält bei 360 px (338 px breit); bei 320 px in Feld siehe R21-L6 |
| Kontrast und Zielgrößen (R20-L1 „Warum?") | in den geprüften Zuständen kein Ziel unter 44 px außer „ändern" 44 x 43; die „Warum?"-Zeile erschien nicht |

## Befunde

### R21-L1 (P0, Daten/Verlust) Einsatzansicht ist offline nicht nutzbar: „Hier ist etwas schiefgelaufen"

- **Ort:** Startseite → „Öffnen" einer Einsatz-Sammlung, oder Neuladen in der Einsatzansicht, nach Netztrennung (Service Worker aktiv, Cache vollständig), 360 x 640 und 390 x 844.
- **Beobachtung:** Nach dem ersten vollständigen Laden (Service Worker aktiv, 659 Cache-Einträge) und `setOffline(true)` lädt die Startseite, ebenso „Neuen Bogen erstellen", Beispielbögen und der Assistent. „Öffnen" bei einer Sammlung zeigt dagegen den Fehlerschirm „Hier ist etwas schiefgelaufen — Die Ansicht ließ sich nicht aufbauen". Die Konsole nennt `Unable to preload CSS for …/assets/index-Bp0pLAQP.css`. Diese Datei gibt es nicht im Build (`dist/assets` enthält nur `lagemonitor-ui-….css`; die Stile sind in die Seite eingebettet), der Nachlade-Chunk `einsaetze-ui-….js` verweist aber noch auf sie. Online beantwortet `vite preview` die Anfrage mit `200 text/html` (Rückfall auf die Startseite), deshalb fällt es dort nicht auf. Simuliert mit einem Host, der für die fehlende Datei `404` liefert (wie ein statischer Host), stürzt die Einsatzansicht **auch online** ab (Playwright-Route, kein echter Host geprüft). Die Startseite verspricht trotzdem „✓ Funktioniert komplett offline — alle Daten bleiben auf diesem Gerät" und „Bogen, PDF, QR-Code und Empfang gehen offline".
- **Folge:** Am Meldekopf im Funkloch (Keller, Halle, Wald) lässt sich keine Einsatz-Sammlung öffnen: keine Stärke-Summe, kein Lageblatt, keine Übergabe, kein Aufnehmen weiterer Bögen. Die Daten bleiben erhalten („Deine Daten liegen weiter auf diesem Gerät"), der Ablauf ist aber praktisch nicht fortsetzbar, und das Versprechen „komplett offline" ist falsch. Die Papier-Rückfallebene (Blanko-Vordruck) bleibt erreichbar.
- **Empfehlung:** Die Einsatzansicht muss nach dem ersten Laden offline und auf jedem statischen Host aufgehen; die verwaiste Stil-Datei darf nicht mehr angefordert werden (oder muss im Vorrat liegen). Bis dahin die Offline-Zusage auf der Startseite einschränken.
- **Neu oder alt (Verweis):** neu. Folge des Nachladens der Einsatzansicht aus Runde 20 („Startbündel halbiert"); in Runde 20 nicht geprüft.
- **Nachprüfung:** Seite laden, 15 s warten, Netz trennen, Startseite neu laden, „Öffnen" bei einer Sammlung, dann in der Einsatzansicht neu laden: Ansicht steht, Konsole ohne Fehler. Zusätzlich mit einem Host, der fehlende Dateien mit 404 beantwortet.

### R21-L2 (P2, Text) Fehlerschirm nennt bei fehlendem Netz keine Ursache und rät, den Einsatz zu löschen

- **Ort:** Fehlerschirm aus R21-L1, 360 x 640.
- **Beobachtung:** Der Text sagt „Zuerst neu laden; hilft das nicht, zur Startseite … Stürzt die Ansicht beim Öffnen eines Einsatzes ab, bleibt der Rest nutzbar: Auf der Startseite lässt sich dieser Einsatz einzeln löschen (Löschen…; danach liegt er 30 Tage im Papierkorb)." Von fehlendem Netz steht nichts da; „Neu laden" führt offline wieder zum selben Fehler.
- **Folge:** Wer im Funkloch steht, probiert „Neu laden", dann „Zur Startseite", dann „Öffnen" und landet wieder im Fehler; die Löschempfehlung klingt nach einem beschädigten Einsatz, obwohl der Einsatz in Ordnung ist. Unter Stress ist „Löschen…" bei einem unersetzlichen Einsatz der falsche Reflex.
- **Empfehlung:** Bei fehlender Verbindung den Fehlerschirm gesondert beschriften („Ohne Netz lässt sich diese Ansicht gerade nicht öffnen; deine Daten sind sicher") und die Löschempfehlung nur bei echtem Absturz zeigen.
- **Neu oder alt (Verweis):** neu (Folge von R21-L1).
- **Nachprüfung:** Offline „Öffnen": Text nennt das Netz als mögliche Ursache und rät nicht zum Löschen.

### R21-L3 (P3, Text) Schnellerfassung: Kapitelnummern „3. Personal" und „4. Fahrzeuge" unter „Schritt 2 von 4" und „Schritt 3 von 4"

- **Ort:** Einsatzansicht → „Einheit schnell erfassen (nur Stärke)…", Schritt 2 und 3, 360 x 640.
- **Beobachtung:** Der Kopf zählt jetzt „Schritt 1 von 4: Einheit", „Schritt 2 von 4: Personal", „Schritt 3 von 4: Fahrzeuge". Die Überschrift im Formular lautet aber „3. Personal" und „4. Fahrzeuge" (Nummern des Vollassistenten); Schritt 1 heißt „1. Einheit".
- **Folge:** Zwei Zählungen auf einem Bild; wer mitzählt, vermisst einen Schritt „2". Die Aufgabe bleibt machbar.
- **Empfehlung:** Die Überschriften in der Schnellerfassung ohne Nummer oder mit der Zählung des Kopfes.
- **Neu oder alt (Verweis):** alt (Rest von R20-A2/W3/H3/K4/N3, „Schritt 1 von 6 … entfallen").
- **Nachprüfung:** Schnellerfassung Schritt 2 und 3: Kopfzählung und Überschrift nennen dieselbe Nummer.

### R21-L4 (P3, Layout) Einsatzansicht: Einheitenliste beginnt erst nach rund 1,4 Bildschirmen

- **Ort:** Einsatzansicht, 390 x 844 und 360 x 640, mit Übungsbögen und mit echten Einheiten.
- **Beobachtung:** Die Überschrift „Einheiten (…)" steht bei y 909 (echte Einheiten) bis 964 (Übung), die erste Einheitenkarte bei y 1180 bis 1233, also unter dem Falz (844 beziehungsweise 640 px). Davor liegen Kennzahlen, vier Aufnahme-Knöpfe, die Quittung der letzten Aufnahme, „Neu seit der letzten Kenntnisnahme", der Bedarfskasten und die Sprungzeile.
- **Folge:** Wer mitten im Zulauf wissen will, welche Einheit zuletzt kam, rollt jedes Mal über anderthalb Bildschirme; in Nacht und Feld mit großer Schrift länger.
- **Empfehlung:** Die Karten früher beginnen lassen (Aufnahme-Knöpfe verdichten, Quittung und Bedarfskasten einklappen oder unter die Liste).
- **Neu oder alt (Verweis):** alt (R20-W6/H5/G6, laut Stand der Behebung „nicht ganz erreicht").
- **Nachprüfung:** 390 x 844, Einsatz mit sechs Bögen: erste Einheitenkarte oberhalb von y 844.

### R21-L5 (P3, Layout) Dialog „Ort der Einheit ändern…" in „Feld" bei 320 px: „Ort übernehmen" bricht mitten im Wort

- **Ort:** Karte aufklappen → „Mehr…" → „Ort der Einheit ändern…", Ansicht Feld, 320 x 568.
- **Beobachtung:** Der Hauptknopf der Rückfrage zeigt „Ort / übernehme / n": das Wort „übernehmen" bricht nach „übernehme". In Nacht bei 320 px und in Standard bei 360 px steht „Ort / übernehmen" sauber.
- **Folge:** Der Knopf bleibt lesbar und tippbar, sieht aber zerbrochen aus; im Stress verlangsamt ein gebrochenes Wort das Erkennen der Haupthandlung.
- **Empfehlung:** Knopfbeschriftung kürzen („Übernehmen") oder die beiden Knöpfe in „Feld" untereinander setzen.
- **Neu oder alt (Verweis):** neu (Dialoge bei 320 px, R20-H9/M5 sonst behoben).
- **Nachprüfung:** Ansicht Feld, 320 x 568: „Ort übernehmen" bricht nicht im Wort.

### R21-L6 (P3, Layout) Tabelle in „Feld" bei 320 px: Bedarfsspalte rechts angeschnitten, Einheit „l" fehlt

- **Ort:** Einsatzansicht → „Tabelle", Ansicht Feld, 320 x 568.
- **Beobachtung:** Der Tabellenrahmen ist 296 px sichtbar, 304 px breit (8 px rollbar, ohne Hinweis). Die letzte Spalte endet am Rand: statt „Diesel 180 l" steht sichtbar „Diesel 180", statt „Benzin 80 l" „Benzin 80". Bei 360 px (Standard, Nacht) passt die Tabelle (338 px).
- **Folge:** Die Mengenangabe ist ohne Einheit lesbar; „180" ohne „l" lässt sich als Stückzahl missdeuten. Nur bei 320 px in „Feld".
- **Empfehlung:** Die Tabelle in „Feld" bei sehr schmalen Fenstern umbrechen statt innen rollen lassen, oder die Bedarfsspalte schmaler setzen.
- **Neu oder alt (Verweis):** alt (Rest von R20-N6/H11/H12/S5, „Tabelle am Telefon").
- **Nachprüfung:** Feld, 320 x 568: kein innerer Rollbereich, „Diesel 180 l" vollständig.

### R21-L7 (P3, Layout) Vollassistent quer in „Feld": Kopf und Fußleiste belegen fast 40 % des Bildes, „Ort der Einheit" angeschnitten

- **Ort:** „Neuen Bogen erstellen", Schritt 1, Ansicht Feld, 568 x 320.
- **Beobachtung:** Kopfzeile (rund 58 px) und feste Fußleiste „Ansicht / Weiter" (y 255 bis 320, 65 px) lassen rund 190 von 320 px Inhalt. Beim Öffnen steht das Feld „Ort der Einheit (Pflicht)" nur mit der Oberkante über der Fußleiste; Beschriftung und Eingabefeld sind angeschnitten. Fokus per Tab verdeckt kein Feld (geprüft für die ersten 14 Felder), das Feld erreicht man also; in Nacht bei 568 x 320 ist der Inhaltsraum mit 56 px Fußleiste kaum größer.
- **Folge:** Das Pflichtfeld sieht beim Öffnen unvollständig aus; mit eingeblendeter Bildschirmtastatur bleibt im Querformat kaum Platz (nicht prüfbar).
- **Empfehlung:** Im Querformat Fußleiste und Kopf zusammenlegen oder die Fußleiste einzeilig und niedriger halten.
- **Neu oder alt (Verweis):** alt (R20-N2, laut Stand der Behebung „nicht ganz erreicht").
- **Nachprüfung:** 568 x 320, Feld und Nacht, Schritt 1: Beschriftung und Eingabefeld „Ort der Einheit" vollständig sichtbar, ohne zu rollen.

## Hinweise (ohne Priorität)

- **H1 Kaltstart ohne Service Worker auf langsamem Netz.** Bei 400 kbit/s und 300 ms Latenz (Service Worker gesperrt) dauerte „Neuen Bogen erstellen" in zwei Läufen 2,5 s und 7,7 s, die Startseite zeigt dabei keinen Hinweis auf das Laden. Betrifft nur den allerersten Aufruf vor Service-Worker-Aktivierung; mit aktivem Service Worker (60 bis 570 ms bei 6-facher CPU-Drosselung) nicht spürbar. Die Messungen schwanken, deshalb ohne Priorität.
- **H2 Obere Kante der „Mehr…"-Leiste in „Nacht".** Die Leiste trägt oben einen hellen, rund 3 px dicken Strich über die ganze Breite (im Bild beige), also eine schmale helle Linie in einer sonst dunklen Ansicht. Kontrast und Lesbarkeit sind nicht betroffen, gemessen wurde die Farbe nicht.

## Schluss

- **Aufgabe geschafft:** mit Umwegen (online ja; offline lässt sich die Einsatz-Sammlung nicht öffnen, Bogen und Assistent laufen)
- **Fremde Hilfe nötig:** nein (die Daten bleiben erhalten; ohne Netz fehlt aber der Weg in die Einsatzansicht)
- **Größtes Missverständnis:** Die Startseite sagt „Funktioniert komplett offline", die Einsatz-Sammlung öffnet ohne Netz aber nicht (R21-L1).
- **Größtes Einsatzrisiko:** Am Meldekopf im Funkloch steht die Einsatzansicht nicht zur Verfügung, und der Fehlerschirm rät zum Löschen (R21-L1, R21-L2); nicht prüfbar bleibt die echte Wirkung von Sonne und Scheinwerfer.
- **Top-Priorität für die nächste Iteration:** R21-L1 (Einsatzansicht offline und bei 404 der Stil-Datei), danach R21-L2.
