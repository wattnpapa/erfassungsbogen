# Rollenaudit Neuer Nutzer, Runde 17

- **Prüfer:** Rolle „Helfer ohne Einweisung" (Skill `thw-new-user-reviewer`)
- **Datum:** 2026-10-27
- **Gegenstand:** Web-App Erfassungsbogen, Produktionsbuild (`vite preview`, Port 4173), Code-Stand Commit be6b396 (`main`)
- **Prüfaufbau:** Playwright mit Chromium (globales Modul, `chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE, Viewports 390x844, 360x640 und 320x568 (nur Überlauf geprüft). Keine Kamera. Für die Sammlung wurden acht Übungsbögen aus `examples/thw/` mit `uebung: false` und frischem Stand über „Bögen einlesen…" aufgenommen. Kein Code geändert.
- **Maßstab ab dieser Runde:** Es gibt keine „bekannten Grenzen" zum Auslassen; auch teilweise behobene oder offene Punkte aus den Vorrunden werden gemeldet, wenn sie im Browser noch zu sehen sind.
- **Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 11

## Urteil aus Sicht der Rolle

Beide Aufgaben gehen ohne fremde Hilfe: „eigenen Bogen erfassen und übergeben" (sechs Schritte, Übergabe-Dialog mit QR, PDF, Weiteres) und „Einsatz-Sammlung anlegen, Bögen aufnehmen, Einheit abrücken, Lageblatt/Sammel-PDF/CSV/Excel erzeugen, Lagemonitor öffnen". Fehlgriffe werden gut aufgefangen: Fremde Dateien („stammt nicht aus dieser App … PDF des Bogens anfordern oder QR-Code scannen") an Start- und Sammlungsseite, „Ort der Einheit fehlt" mit Sprung ins Feld, „Meldung entfernen?" mit Folgen (Nummern rücken auf, Rückgängig-Grenze), „Einsatz löschen?" mit Papierkorb 30 Tage, Abrücken mit Quittung und Rückgängig, Historie „Abgerückt / Wieder als anwesend geführt". Offline-Hinweis kippt nach kurzer Zeit auf „Jetzt offline bereit". Kein horizontaler Seitenüberlauf bei 360 und 320 px. Was bleibt, sind Wortwahl, Beschriftungen und Darstellung; nichts davon verhindert eine Aufgabe.

## Bestätigte Behebungen aus Runde 16 (im echten Browser)

- R16-N3: „Namen einfügen…" duzt („auch wenn du das Fenster schließt — bis du sie übernimmst oder leerst").
- R16-N1: Die Tabelle schreibt „⚠ Stand vor 9 Std 32 Min" in der Zelle.
- R16-N2: Der Schnelleinstieg zeigt nur noch „8 Einheiten anwesend" und die Letzte-Meldung-Zeile, die Stärke- und Warnzeile steht nur noch unten (Rest siehe R17-N2).
- Quittungen: Lageblatt, Sammel-PDF, CSV und Excel melden sich mit eigener Zeile; „Die Excel-Liste wird erzeugt — bitte nicht noch einmal tippen." erscheint.
- Aufnahme: „8 Einheiten neu gemeldet — Zeilen je Einheit ausgeblendet", „Alle 8 einzeln anzeigen" und „Zur Liste springen" funktionieren; „Zuordnen" bleibt gesperrt, bis ein Zugname getippt ist.

## Befunde

### R17-N1 (P3) – „Namen einfügen…": „Nachname Vorname" ohne Komma wird vertauscht, ohne Prüfmarke

- **Neu oder alt (Verweis):** alt – wie R16-E1 („Anna Maria Schmidt" ohne Funktion bleibt ohne Prüfmarke), weiter teilweise.
- **Ort:** Assistent, Schritt 3 „Personal" → „Namen einfügen…", 390x844.
- **Beobachtung:** Eingabe „Karl Heinz Meier" ergibt „Meier, Karl Heinz" (richtig). Eingabe „Meier Karl" ergibt „Karl, Meier", „Müller-Lüdenscheidt Maria" ergibt „Maria, Müller-Lüdenscheidt". Die Vorschau zeigt nur „→ Platz 2: TrFü", keine Marke „Reihenfolge prüfen" (die gibt es nur für Tabulator-/Semikolon-Zeilen). Nach „4 Personen übernehmen" steht die Quittung „4 Namen übernommen — 4 davon in freie Sollplätze".
- **Folge:** Eine Namensliste aus einer Nachricht oder Tabelle „Nachname Vorname" landet mit vertauschten Namen im Bogen und im QR-Code; der Helfer erkennt es nur, wenn er die Vorschau Zeile für Zeile liest.
- **Empfehlung:** Bei Zeilen ohne Komma, in denen das erste Wort ein bekannter Vorname oder das letzte ein bekannter Nachname sein könnte, eine Prüfmarke „Reihenfolge prüfen" setzen; oder eine Wahl „Nachname zuerst / Vorname zuerst" für die ganze Liste anbieten.
- **Verifikation:** Die vier Zeilen oben einfügen und die Vorschau ansehen.

### R17-N2 (P3) – Startseite: derselbe Einsatz steht noch zweimal untereinander

- **Neu oder alt (Verweis):** alt – wie R16-N2, weiter teilweise.
- **Ort:** Startseite mit einer Sammlung, 390x844.
- **Beobachtung:** Unter „Bögen sammeln (Meldekopf)" der Knopf „„Hochwasser Elbe" öffnen / 8 Einheiten anwesend / Letzte Meldung 27.10.2026, 17:32 (gerade eben)". Weiter unten unter „Einsatz-Sammlung (Meldekopf)" die Karte „Hochwasser Elbe / Öffnen / Einsatz / 8 Einheiten anwesend · Stärke 3 / 17 / 49 / 69 / Letzte Meldung 27.10.2026, 17:32 (gerade eben) · …". Die Zeilen „Letzte Meldung …" und „8 Einheiten anwesend" stehen wörtlich zweimal; beide Blöcke tragen „Meldekopf" im Titel.
- **Folge:** Zwei gleich benannte Einträge mit „Öffnen" lassen an zwei Einsätze denken; „Löschen…" liegt nur im zweiten.
- **Empfehlung:** Schnelleinstieg „Zuletzt geöffnet: …" und Liste „Alle Einsätze" nennen, die Statuszeile nur einmal zeigen, die Überschrift „Einsatz-Sammlung (Meldekopf)" von „Bögen sammeln (Meldekopf)" absetzen.
- **Verifikation:** Sammlung anlegen, Startseite öffnen, Einträge zählen und vergleichen.

### R17-N3 (P3) – Schwebende Leiste „Ansicht: Standard" verdeckt unten links Inhalt

- **Neu oder alt (Verweis):** alt – wie die Randbeobachtung in R16 „Nicht neu gemeldet" und R15-M3 (Ansichtswahl), weiter offen.
- **Ort:** Einsatz-Sammlung, 390x844 und 360x640, auch aufgeklappte Karte.
- **Beobachtung:** Die weiße Leiste mit „◐ Ansicht: Standard" (171x44 px, unten links) liegt über dem Seitenende der Liste. Bei aufgeklappter Karte schneidet sie den Knopf „Mehr…" und die Zeile darüber an; bei 360x640 belegt sie mit Rand rund 55 von 640 px. Eine Quittung (z. B. „Abgerückt 17:29 … Rückgängig") steht darüber, die Leiste bleibt darunter stehen.
- **Folge:** Beim ersten Hinsehen wirkt der unterste Knopf abgeschnitten; man scrollt nach, obwohl die Seite schon am Ende ist.
- **Empfehlung:** Die Ansichtswahl nicht über dem Inhalt schweben lassen (am Seitenende einreihen oder nur im Kopf) oder unten ausreichend Leerraum lassen.
- **Verifikation:** Sammlung öffnen, Karte aufklappen und bis zum Ende scrollen; unterster Knopf muss ganz frei sein.

### R17-N4 (P3) – Karte: „✓ Abgerückt" sieht wie ein Status aus, ist aber ein Schalter

- **Neu oder alt (Verweis):** neu (R14 und R16 haben das Verhalten als „hält" beschrieben, nicht die Beschriftung).
- **Ort:** Karte einer Einheit, aufgeklappt → „Abrücken".
- **Beobachtung:** Nach „Abrücken" wird derselbe Knopf zu „✓ Abgerückt" (gestrichelter Rand, wie ein Zustand). Ein Tipp darauf macht die Einheit wieder anwesend, der Knopf heißt dann „✓ Anwesend". Die Historie führt „17:32 Abgerückt / 17:32 Wieder als anwesend geführt". Die Karte trägt danach wieder „neu · kürzlich eingetroffen" (die ursprüngliche Eintreffzeit 17:30 bleibt erhalten, richtig). Eine Rückfrage gibt es nicht; eine Quittung mit „Rückgängig" ist da.
- **Erwartung der Rolle:** Ein Haken mit gestricheltem Rand ist eine Anzeige („schon erledigt"), kein Knopf, der Gegenteiliges auslöst.
- **Folge:** Wer „✓ Abgerückt" antippt, um zu prüfen, ob es klappte, holt die Einheit zurück in die Zählung.
- **Empfehlung:** Zustand und Aktion trennen: Anzeige „Abgerückt 17:29" und daneben ein klarer Knopf „Wieder anwesend". Das Etikett „neu" nach dem Zurückholen nicht erneut setzen.
- **Verifikation:** Abrücken, den Knopf antippen, Beschriftung und Zählung (Kopfzeile „Einheiten") lesen.

### R17-N5 (P3) – Schnellerfassung: aufklappbare Zettelzeile ohne Pfeil, Reiter „2 –" und „5 –" unerklärt

- **Neu oder alt (Verweis):** neu.
- **Ort:** Sammlung → „Einheit schnell erfassen (nur Stärke)…", 390x844.
- **Beobachtung:** Oben steht ein Kasten „Angaben vom Zettel (optional): Eingetroffen um, Abgerückt um, Nr., Zug". Er ist ein `summary` ohne Aufklappmarke und sieht wie eine Überschrift aus; erst ein Tipp öffnet vier Felder. Im Reiterstreifen tragen „2 –" und „5 –" einen Strich, ohne dass ein Wort sagt, was er bedeutet (der Fließtext nennt „Einsatzdaten, Fahrzeuge und Sofortbedarf können offen bleiben"). Die Kästen „Schnellerfassung" und „Aufnahme für: Hochwasser Elbe" haben den Rahmen eines Knopfs.
- **Folge:** Eintreff- und Abrückzeit vom Meldeblock werden übersehen und die Einheit bekommt die Zeit des Tippens; der Strich wirkt wie „fehlt noch".
- **Empfehlung:** „▸" vor die Zettelzeile (wie bei „Suchen, sortieren, filtern"), Strich im Reiter mit „entfällt" oder „optional" ausschreiben, die beiden Kennzeichen als Text ohne Knopfrahmen.
- **Verifikation:** Schnellerfassung öffnen; Zettelzeile und Reiter ohne Erklärung deuten lassen.

### R17-N6 (P3) – 360 px: Unterzeilen der Aufnahmeknöpfe entfallen

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatz-Sammlung oben, 360x640.
- **Beobachtung:** Bei 390 px tragen die vier Knöpfe Unterzeilen („von Hand, ohne Bogen", „Ort und Stärke vom Zettel", „Dateien oder Fotos von QR-Codes"). Bei 360 px stehen „Einheit manuell erfassen…" und „Einheit schnell erfassen (nur Stärke)…" nebeneinander ohne Unterzeile, „Bögen einlesen…" allein darunter.
- **Folge:** Der Unterschied zwischen „manuell" und „schnell" und der Zweck von „Bögen einlesen" erschließen sich nur noch aus dem Namen, ausgerechnet bei kleinen Telefonen.
- **Empfehlung:** Unterzeilen auch bei 360 px zeigen (Knöpfe untereinander, nicht nebeneinander).
- **Verifikation:** Sammlung bei 360x640 öffnen, mit 390x844 vergleichen.

### R17-N7 (P3) – 360 px: Fußleiste zeigt „Ansicht" nur als „◐", und die Ansichtswahl gibt es zweimal

- **Neu oder alt (Verweis):** alt, Nebenwirkung von R15-M2 (Fußleiste einzeilig, „teilweise").
- **Ort:** Assistent, alle Schritte, 360x640 (bei 390x844 steht „◐ Ansicht").
- **Beobachtung:** Der Knopf links neben „Weiter →" ist bei 360 px ein reines „◐" (44 px), im Kopf steht zusätzlich „Ansicht: Standard ▾". Zwei Bedienelemente für dieselbe Wahl, eines davon ohne Wort.
- **Folge:** „◐" lässt sich als Helligkeit, Nachtmodus oder Kontrast lesen; der Helfer probiert es aus, statt zu wissen.
- **Empfehlung:** Wort „Ansicht" auch im schmalen Fall zeigen oder die Wahl nur an einer Stelle anbieten.
- **Verifikation:** Assistent bei 360x640 öffnen, Fußleiste lesen.

### R17-N8 (P3) – Scanner ohne Kamera: Hauptweg ist der USB-Handscanner, der Weg für Telefone steht klein unten

- **Neu oder alt (Verweis):** neu.
- **Ort:** Sammlung → „Bogen scannen…" (primärer Knopf), Gerät ohne nutzbare Kamera.
- **Beobachtung:** Schwarzer Bildschirm, oben rot „Dieses Gerät meldet keine nutzbare Kamera.", in der Mitte der große Rahmen „Ohne Kamera: mit dem USB-Handscanner scannen" mit zwei Schritten und „Bereit — warte auf den Handscanner". Unten, klein: „Kamera erneut versuchen", „QR aus Bild einlesen…", „Fertig".
- **Erwartung der Rolle:** Am Telefon ohne Kamera (oder bei verweigerter Erlaubnis) ist der naheliegende Weg ein Foto oder Bildschirmfoto des Codes; ein USB-Handscanner ist am Telefon die Ausnahme.
- **Folge:** Der Helfer liest zuerst eine Anleitung für ein Gerät, das er nicht hat, und findet „QR aus Bild einlesen…" erst danach; zwischen „keine Kamera" und „Erlaubnis verweigert" unterscheidet der Satz nicht.
- **Empfehlung:** „QR aus Bild einlesen…" als gleichrangigen Knopf in die Mitte, den Handscanner-Rahmen darunter; bei verweigerter Erlaubnis den Satz „Kamera-Zugriff erlauben" nennen.
- **Verifikation:** Scanner in einem Browser ohne Kamera und mit verweigerter Kamera öffnen; Reihenfolge und Wortlaut lesen.

### R17-N9 (P3) – „Übersicht als CSV" und „Alle Daten als CSV": Unterschied unerklärt

- **Neu oder alt (Verweis):** neu (in R16 nur als Fundort genannt).
- **Ort:** Sammlung → „Weitergeben, Lageblatt, Export", zwei Knöpfe nebeneinander.
- **Beobachtung:** Der Text darüber erklärt „Einsatz weitergeben / sichern" und den Nachtrag, aber nicht, was „Übersicht" und „Alle Daten" enthalten. Die Dateien heißen `eeb-einsatz-…csv` und `eeb-einsatz-…-alle-daten.csv`.
- **Folge:** Der Helfer lädt beide, um zu sehen, welche der Stab braucht; bei „alle Daten" ist nicht erkennbar, ob Personennamen oder Rufnummern enthalten sind.
- **Empfehlung:** Je eine Zeile unter den Knöpfen („eine Zeile je Einheit, ohne Namen" / „mit allen Feldern der Bögen"), und ob Namen enthalten sind.
- **Verifikation:** Beide Knöpfe lesen; ohne Datei zu öffnen sagen können, wofür welcher gilt.

### R17-N10 (P3) – „Zeitraum" (Datum) und „Einsatzbeginn/-ende" (Datum und Uhrzeit) stehen nebeneinander und widersprechen sich scheinbar

- **Neu oder alt (Verweis):** neu (verwandt mit R13-N1, dort Anleitungsverweis).
- **Ort:** Assistent, Schritt 2 „Einsatz", und Gesamtübersicht, Block „Einsatz".
- **Beobachtung:** Schritt 2 zeigt „Zeitraum von / bis" (zwei Datumsfelder, vorbelegt mit heute) und darunter zwei Kästchen „Einsatzbeginn eintragen" / „Einsatzende eintragen", die erst beim Ankreuzen ein Feld „Einsatzbeginn (Datum, Uhrzeit)" öffnen. Der erklärende Satz („Setzt die aktuelle Uhrzeit, danach änderbar …") steht erst unter beiden Kästchen. Die Übersicht zeigt dann „Zeitraum 27.10.2026 – 27.10.2026" und „Beginn / Ende — / —" mit dem Zusatz „für eigene Nachweise in Schritt 2 eintragen".
- **Erwartung der Rolle:** Ein Zeitraum ist ein Zeitraum; wozu zweimal Beginn und Ende?
- **Folge:** Der Helfer trägt Beginn/Ende ein oder lässt sie leer, ohne zu wissen, welche Angabe der Meldekopf sieht („Zeitraum vorbei" hängt am Datum, nicht an Beginn/Ende).
- **Empfehlung:** Zwei Beschriftungen („Gilt für den Tag / die Tage" gegenüber „Uhrzeit Beginn/Ende für meine Nachweise") oder die Uhrzeitfelder unter den Datumsfeldern zusammenfassen; Erklärsatz direkt unter die Kästchen-Überschrift.
- **Verifikation:** Schritt 2 und Übersicht ohne Anleitung lesen und erklären lassen, welche Angabe wohin geht.

### R17-N11 (P3) – Lagemonitor: „Stärke F / U / M // gesamt" ohne Auflösung

- **Neu oder alt (Verweis):** neu.
- **Ort:** Lagemonitor (Zweitfenster, „Lagemonitor öffnen").
- **Beobachtung:** Kopfzeile „Stärke F / U / M // gesamt: 3 / 17 / 49 // 69". Auf der Karte der Sammlung steht „Stärke auf den Karten: Führer / Unterführer / Mannschaft / Gesamt", auf der Übersicht „(F / UF / M / Ges)"; der Monitor schreibt „U" statt „UF" und trennt „gesamt" mit „//".
- **Folge:** Für den Fernseher gedacht, den andere ablesen; „U" liest sich als „Übung" oder „Unterkunft", die Schreibweise weicht von den beiden anderen Orten ab.
- **Empfehlung:** Auf dem Monitor „Führer / Unterführer / Mannschaft = Gesamt" ausschreiben (Platz ist da), mindestens „UF" wie sonst.
- **Verifikation:** Monitor öffnen und die Kopfzeile mit Karte und Übersicht vergleichen.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „✓ Abgerückt" sieht wie eine Anzeige aus, ist aber ein Schalter, der die Einheit zurück in die Zählung holt (R17-N4).
- **Größtes Einsatzrisiko:** Vertauschte Namen aus „Namen einfügen…" ohne Prüfmarke (R17-N1); sonst nur Wortwahl und Darstellung.
- **Top-Priorität für die nächste Iteration:** R17-N1 und R17-N4, weil beide Daten im Bogen unbemerkt verändern können.
