# Audit „Zerstörende Handlungen“, Runde 21 (Löschen, Überschreiben, Statuswechsel, Offline-Verlässlichkeit)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-10-29 ·
Prüfgegenstand: Web-App, Produktionsbuild auf `http://localhost:4173`, Code-Stand
Commit `f007590` (`main`, Runde 20).

**Zählung: P0 1 · P1 0 · P2 0 · P3 3 · Hinweise 6** (R21-D1 bis R21-D4; Hinweise H1 bis H6).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, der
Abschnitt „Stand der Behebung“ in `runde-20/README.md` und der Bericht
`runde-20/zerstoerende-handlungen.md`. Es gibt keine „bekannten Grenzen“, die
ausgelassen werden: Was im Browser noch zu beobachten ist, steht hier, auch wenn es in
Runde 20 als „nicht ganz erreicht“ geführt wurde.

## Prüfaufbau

Chromium über das Projekt-`playwright`, `chromium.launch()` ohne Optionen, nichts
installiert, kein Code geändert. `isMobile`/`hasTouch`, Locale de-DE, Tipps über
`touchscreen.tap`. Je Szenario ein frischer Browserkontext. Viewports 390 × 844,
360 × 640, 320 × 568 sowie quer 844 × 390, 740 × 360 und 640 × 360. Zustand über die
Bedienung: Einsatz-Sammlung „Hochwasser Weser“ anlegen, die THW-Beispielbögen 012 bis 016
aus `examples/thw` als Kopien außerhalb des Repositorys (`uebung: false`, `stand` fünf
Minuten vor der Geräteuhr) über „Bögen einlesen…“ aufnehmen. Voller Speicher:
`localStorage` bis zum Quota-Fehler gefüllt. Netz: `context.setOffline(true)` nach dem
Hinweis „Jetzt offline bereit“ des Service Workers (Neuladen im Offline-Zustand), zum
Messen des Nachladens CDP-Drosselung (Fast 3G 1,6 MBit/s · 150 ms und Slow 3G
400 kBit/s · 400 ms, Service Worker blockiert, erster Besuch). Kein Kamera-Scan, keine
Handschuhe, kein Zweitgerät, keine nativen Builds.

Durchgespielt: Bogen schließen, Neuen Bogen anfangen und Geschlossenen Bogen
zurückholen jeweils bei vollem Speicher (mit und ohne zweiten Bogen); Einsatz löschen,
Papierkorb Einsätze, „Wiederherstellen“, „Endgültig löschen…“ bei vollem Speicher
(Doppelrückfrage, Sperrzeit); Schnellerfassung (Ort „THW Oldenburg“, Einheitstyp
„FGr WP“, Schrittzählung bis „In Einsatz übernehmen“); „Ort der Einheit ändern…“ (mit
„Rückgängig“); Einsatzbeginn „Jetzt“ und Feld überschreiben; Einsatz importieren
(Sammel-PDF in vorhandene gleichnamige Sammlung); „Einsatz als beendet markieren“,
„Abrücken“; Dialoge bei 320 × 568 (Meldung entfernen, Stärke ändern, Als Übung,
Verschieben, Ort ändern, Einsatz löschen, Übergabe vermerken, Alle Daten löschen,
Geräteschlüssel, Datensicherung); Scanner ohne Kamera quer (844 × 390, 640 × 360);
Assistent quer in „Standard“ und „Feld“ (Tab-Durchlauf, Fokus gegen Fußleiste);
Tabelle am Telefon (320, 360, 390); Nachladen unter Drosselung (Einsatzansicht,
Zeichensammlung); Offline: Startseite, Neuladen, Bogen aus Datei, „Bogen übergeben“
(PDF, QR-Vollbild), Neuer Bogen, QR-Scanner-Fenster, Einsatz anlegen und Einsatz öffnen.

## Urteil

Die Speicher-Behebungen aus Runde 20 halten: Bei vollem Speicher geht kein Bogen mehr
verloren, „Endgültig löschen“ im Notweg fragt zweimal und ist gesperrt, Dialoge sind
auch bei 320 px bedienbar, die Nachladestellen sind unter Drosselung kaum zu spüren. Der
größte Befund ist neu und kommt aus genau dieser Verkleinerung des Startbündels: **Die
Einsatzansicht, also das Werkzeug des Meldekopfs, lässt sich ohne Netz nicht öffnen**,
sobald die Seite im Offline-Zustand neu geladen wird oder dort ein Einsatz angelegt oder
geöffnet wird. Die App sagt zugleich „Funktioniert komplett offline“. Alle übrigen
Aufgaben ließen sich ohne fremde Hilfe erledigen; offline fehlt nur der Meldekopf.

## Behebungen aus Runde 20, im echten Browser geprüft

| Befund | Ergebnis |
| --- | --- |
| R20-D1 Bogen bei vollem Speicher | hält. Schließen, „Neu anfangen“ (zwei Bögen) und „Zurückholen“ legen den Bogen auf den Rückholplatz um, nichts geht verloren, auch nicht nach Neuladen. „Neuen Bogen erstellen“ bei vollem Speicher ohne Entwurf zeigt „⚠ Nicht gespeichert — der Speicher dieses Geräts ist voll. Jetzt „Bogen übergeben“ (PDF)“ |
| R20-W1 „Endgültig löschen…“ im Notweg | hält. Erst „Endgültig löschen…“, dann Rückfrage „Einsatz endgültig löschen?“ mit „einzige Kopie“; Bestätigung gesperrt, nach rund 1 s freigegeben |
| R20-H1 „THW THW Oldenburg“ | hält. Ort „THW Oldenburg“ plus Typ „FGr WP“ ergibt „Nr. 1 THW Oldenburg FGr WP“ |
| „Ort der Einheit ändern…“ | hält. Dialog nennt Folgen (Nummer, Zug, Auftrag, Historie bleiben), „Rückgängig“ in der Quittung, Karte zeigt „THW Oldenburg Fachgruppe Wassergefahren (B)“ |
| Schnellerfassung Schrittzählung | gebessert: „Schritt 1 von 4“ statt „von 6 … 2, 5 entfallen“, siehe Hinweis H1 |
| Scanner ohne Kamera quer | hält. 844 × 390 und 640 × 360: Text, „Kamera erneut versuchen“, Handscanner-Kasten, „QR aus Bild einlesen…“ und „Fertig“ ohne Überlauf |
| Assistent quer | hält. In „Standard“ und „Feld“ kein Fokusziel unter der Fußleiste (Tab-Durchlauf, `scroll-padding-bottom` 96 / 107 px). R20-N2 ließ sich nicht mehr nachstellen |
| Dialoge bei 320 px | halten. Alle zehn geprüften Dialoge innerhalb 288 px Breite, kein Seitenüberlauf, Bestätigen/Abbrechen mindestens 24 px getrennt (Ausnahme siehe H4); „Alle Daten löschen“ und „Datensicherung“ scrollen im Dialog, Bestätigung erreichbar |
| Tabelle am Telefon | bei 390 und 320 hält, bei 360 siehe R21-D3 |
| R20-D2 Einsatzbeginn überschreiben | behoben. Feld ändern: „Beginn war 11:20 Uhr, 28. Okt. 2026. Alten Beginn zurückholen“ |
| R20-D3 Zusammenführen | behoben. Rückfrage nennt „2 Nummern: Ansbach 1 → 4, Bamberg 2 → 5“ und „Rückgängig danach möglich“ |
| R20-D4 „Papierkorb Einsätze (n)“ | behoben. 44 px hoch |
| Nachladen (Zeichensammlung, Einsatzansicht) online | unauffällig. Slow 3G: Platzhalter der Einsatzansicht rund 600 ms (`aria-busy`), danach vollständig; Zeichen als unsichtbares Quadrat gleicher Höhe 140 bis 550 ms, Seitenhöhe ändert sich nicht (4909 px vor und nach dem Austausch). Kein Sprung, kein Fehlen taktischer Zeichen über die Platzhalterzeit hinaus |
| Nachladen offline (Bogenseite) | hält. Nach Neuladen offline: Neuer Bogen, Bogen aus Datei (Zeichen „geladen“), „Bogen übergeben“ mit PDF-Download und QR-Vollbild, QR-Scanner-Fenster, ohne fehlgeschlagene Anfrage |

## Befunde

### R21-D1 [P0] Einsatzansicht ist offline nicht zu öffnen: „Hier ist etwas schiefgelaufen“, obwohl die App „komplett offline“ verspricht

**Neu oder alt (Verweis):** neu (Folge der in Runde 20 nachgeladenen Einsatzansicht, `einsaetze-lazy.tsx`; Arc42 Kap. 11 behauptet „beide Chunks stehen im Service-Worker-Precache“).

**Typ:** Bedienung (Ausfall einer Kernfunktion ohne Netz). **Kennzeichnung:** gemessen (390 × 844, mehrfach wiederholt, frische Browserkontexte).

**Ort:** Startseite → „Öffnen“ am Einsatz oder „Neue Einsatz-Sammlung…“ → „Einsatz anlegen“; Neuladen, solange die Einsatzansicht offen ist.

**Beobachtung:** Erster Besuch online, Service Worker aktiv, Startseite meldet „✓ Jetzt offline bereit. Funktioniert komplett offline — alle Daten bleiben auf diesem Gerät.“ Danach Netz getrennt (`setOffline(true)`) und neu geladen:
1. Die Startseite und alles rund um den eigenen Bogen läuft (Neuer Bogen, Bogen aus Datei, PDF, QR-Vollbild, Scanner-Fenster, Zeichen).
2. „Öffnen“ am vorhandenen Einsatz und „Einsatz anlegen“ zeigen sofort „Hier ist etwas schiefgelaufen — Die Ansicht ließ sich nicht aufbauen.“ Technische Angabe: `Unable to preload CSS for http://localhost:4173/assets/index-Bp0pLAQP.css`.
3. War die Einsatzansicht beim Offline-Neuladen offen, kommt dieselbe Fehlerseite wieder; erst „Neu laden“ führt zur Startseite zurück. Der Einsatz bleibt unerreichbar, solange das Netz fehlt.
4. Ursache im Build: Der Chunk `einsaetze-ui-Ca8VFLhR.js` fordert `./index-Bp0pLAQP.css` an. Diese Datei gibt es in `dist/assets` nicht (dort liegt nur `lagemonitor-ui-C1Ho6b0A.css`) und sie steht deshalb nicht im Service-Worker-Precache (`dist/sw.js` führt `einsaetze-Cu4cKL97.js`, `einsaetze-ui-Ca8VFLhR.js`, `einsaetze-lesen-BccdnzrT.js` auf). Online beantwortet der Server die fehlende Datei mit „200 text/html“ (Rückfall auf die Startseite), deshalb fällt der Fehler online nicht auf und es gibt keine Konsolenwarnung außer der Service-Worker-Meldung.

**Folge:** Am Meldekopf ohne Funkloch-Reserve (Keller, Tunnel, Netz überlastet, Gerät neu gestartet) kann der Helfer keinen Einsatz öffnen, keine Bögen einlesen, kein Lageblatt, keine Sammel-PDF, keine CSV erzeugen: genau die Aufgabe, für die das Gerät am Meldekopf steht. Die Rückmeldung lenkt in die falsche Richtung: Der Fehlertext empfiehlt, den Einsatz einzeln zu löschen („Löschen…“, „Hilft nichts? Alle Daten löschen“), obwohl nur das Netz fehlt (siehe R21-D2). Der Hinweis auf der Startseite „Funktioniert komplett offline“ ist an dieser Stelle falsch und verleitet dazu, auf Papier-Reserve zu verzichten.

**Empfehlung:** Die Einsatzansicht muss nach dem ersten Laden ohne jede weitere Anfrage öffnen, auch nach Neuladen im Offline-Zustand: alle Dateien, die der Chunk anfordert (auch Stylesheets), müssen tatsächlich ausgeliefert und vorgehalten werden. Eine Nachprüfung „Einsatz öffnen, anlegen, Bögen einlesen, Lageblatt/PDF erzeugen ohne Netz, nach Neuladen“ gehört in die Freigabeprüfung. Solange das nicht gilt, den Hinweis „Funktioniert komplett offline“ auf das einschränken, was wirklich offline geht.

**Nachprüfung:** Frischer Browser, warten bis „Jetzt offline bereit“, Netz trennen, neu laden, „Neue Einsatz-Sammlung…“ anlegen, Bögen aus Datei einlesen, Sammel-PDF erzeugen; danach Neuladen mit geöffnetem Einsatz: keine Fehlerseite, keine fehlgeschlagene Anfrage.

### R21-D2 [P3] Fehlerseite rät bei Ladefehler offline zum Löschen des Einsatzes und aller Daten

**Neu oder alt (Verweis):** neu (folgt aus R21-D1, ist aber ein eigener Textfehler: gilt für jeden Ladefehler der Ansicht).

**Typ:** Text. **Kennzeichnung:** gemessen (390 × 844).

**Ort:** Fehlerseite „Hier ist etwas schiefgelaufen“ nach fehlgeschlagenem Öffnen der Einsatzansicht.

**Beobachtung:** Der Text sagt „Stürzt die Ansicht beim Öffnen eines Einsatzes ab, bleibt der Rest nutzbar: Auf der Startseite lässt sich dieser Einsatz einzeln löschen (Löschen…; danach liegt er 30 Tage im Papierkorb).“ Darunter „▸ Hilft nichts? Alle Daten löschen“. Dass die Ursache auch ein fehlendes Netz oder eine fehlende Datei sein kann, steht nicht da; die Ursache steht nur hinter „Technische Angabe“ (eingeklappt, englisch).

**Folge:** Ein Helfer ohne Netz folgt dem Text und löscht den Einsatz, der Papierkorb fängt ihn auf, aber bei vollem Speicher (siehe Runde 20) ist auch der Papierkorb eine Falle, und „Alle Daten löschen“ ist unumkehrbar.

**Empfehlung:** Bei fehlendem Netz oder nicht ladbarer Datei ausdrücklich „Ohne Netz konnte ein Teil der App nicht geladen werden — dein Einsatz ist unversehrt, mit Netz erneut öffnen“ nennen und die Löschwege nicht als erste Abhilfe anbieten.

**Nachprüfung:** Offline die Einsatzansicht öffnen: Text nennt Netz als wahrscheinliche Ursache, kein Löschhinweis davor.

### R21-D3 [P3] Tabelle bei 360 px: Bedarfsspalte schneidet die Einheit ab („Gemisch 10“ statt „Gemisch 10 l“)

**Neu oder alt (Verweis):** alt, R20-N6/H11/H12/S5 (Tabelle am Telefon): Überlauf der Karte und Tippziele sind behoben, ein Rest bleibt.

**Typ:** Layout/Abstand. **Kennzeichnung:** gemessen (360 × 640: Zelle „Ruhezeit · Diesel 60 l · Gemisch 10 l“ `scrollWidth` 85 > `clientWidth` 80; Kopf „Stärke gesamt“ 47 > 46). Bei 390 und 320 keine abgeschnittene Zelle.

**Ort:** Einsatzansicht → „Tabelle“ (5 Beispielbögen), Spalte „Bedarf“, Zeile Nr. 2 „THW Ulm Bergungsgruppe“.

**Beobachtung:** Der Text der Bedarfszelle ragt rund 5 px über die Zelle hinaus und wird am Tabellenrand abgeschnitten: sichtbar „Gemisch 10“, das „l“ fehlt. Der Name „Materialwirtschaft“ bricht in „Materialwirtsch / aft“.

**Folge:** Die Menge ohne Einheit ist als Bedarf zweideutig (10 l, 10 Kanister?); wer die Tabelle am Telefon zur Disposition liest, kann Gemisch falsch bestellen.

**Empfehlung:** Spaltenbreite oder Umbruch so, dass auch „Gemisch 10 l“ bei 360 px vollständig steht.

**Nachprüfung:** Beispielbögen 012 bis 016 einlesen, Tabelle bei 360 × 640: keine Zelle mit `scrollWidth` > `clientWidth`.

### R21-D4 [P3] Die erste Einheitenkarte liegt nach dem Einlesen rund 1100 bis 1130 px unter dem Seitenanfang

**Neu oder alt (Verweis):** alt, R20-W6/H5/G6 (in Runde 20 als „nicht ganz erreicht“ geführt).

**Typ:** Layout/Abstand. **Kennzeichnung:** gemessen (390 × 844: erste Karte „Nr. 1“ bei y = 1134; 360 × 640: bei y = 1086 bis 1102).

**Ort:** Einsatzansicht direkt nach „Bögen einlesen…“ mit fünf Bögen.

**Beobachtung:** Zwischen Kopf und erster Karte liegen vier Aufnahmeknöpfe (je rund 57 px), die Quittung „5 Bögen aufgenommen …“ (rund 130 px), „Neu seit der letzten Kenntnisnahme“, die Sprungverweise, Karten/Tabelle, Filter und Suche. Auf 844 px Höhe ist die erste Einheit erst nach gut einem Bildschirm sichtbar, auf 640 px nach fast zwei.

**Folge:** Wer nach dem Einlesen eine eingelesene Einheit prüfen oder abrücken will, muss erst durch Hilfsflächen scrollen; die Zahl „5 Einheiten“ oben und die Liste unten stehen weit auseinander.

**Empfehlung:** Die Liste vor die selten gebrauchten Flächen setzen (Quittung als schmale Leiste, Aufnahmeknöpfe einklappbar).

**Nachprüfung:** Fünf Bögen einlesen: erste Karte liegt bei 844 px Höhe vollständig oberhalb 960 px.

## Hinweise (ohne Priorität)

Keine Beeinträchtigung der Aufgabe belegt; zur Entscheidung durch das Projekt.

- **H1 [Text]** Schnellerfassung: Kopf „Schritt 2 von 4: Personal“, Überschrift darunter „3. Personal“ (Schritt 3 „Fahrzeuge“ trägt „4. Fahrzeuge“). Zählung im Kopf und in den Überschriften weichen ab. Alt, R20-H5 (gebessert).
- **H2 [Layout]** Startseite mit Entwurf: „Fortsetzen“ und das rote „Bogen schließen“ liegen 12 px nebeneinander (360 × 640: x = 33 und 186). Das Schließen fragt nach und ist über „Zuletzt geschlossenen Bogen zurückholen“ rückholbar. Alt, R20-H2.
- **H3 [Layout]** Startseite mit Entwurf und geschlossenem Bogen: „Neue Einsatz-Sammlung…“ bei y = 830 (360 × 640), also unter dem Falz; ohne Entwurf bei y = 563. Alt, R20-H3 / R19-W3.
- **H4 [Layout]** Rückfrage „Es gibt schon eine Sammlung …“ (360 × 640): „In die vorhandene Sammlung übernehmen“ und „Als eigene Sammlung“ liegen nur 12 px auseinander (die Vorderseite ist hervorgehoben, „Abbrechen“ liegt 24 px darunter). Der Dialog nennt die Folgen und bietet „Rückgängig“ danach. Neu.
- **H5 [Text]** Karte, aufgeklappt mit „Mehr…“: zwei Knöpfe „Weniger“ (Zeilenwechsel der Aktionsgruppe) und „Weniger anzeigen“ (unten) bei gleichzeitig sichtbarer Aktionsgruppe. Neu.
- **H6 [Bedienung]** Papierkorb Einsätze, „Einsatz endgültig löschen?“: Die Rückfrage nennt „es ist die einzige Kopie“, bietet aber keinen Weg, vorher eine Datei zu sichern; der Helfer muss abbrechen, „Wiederherstellen“, den Einsatz öffnen und exportieren. Gilt nur, wenn noch kein Export besteht. Neu.

## Geprüft ohne Befund

- Rückfragen „Meldung entfernen“, „Stärke ändern“, „Als Übung kennzeichnen“, „Ort der Einheit ändern“, „Einsatz löschen“, „Übergabe vermerken“, „Neuen Bogen anfangen“ (nennt den Bogen und das Sicherungsangebot), „Bogen schließen“ (nennt den Bogen auf dem Rückholplatz, der überschrieben wird), „Zurückholen“, „Geräteschlüssel“, „Alle Daten löschen“: Gegenstand und Folge genannt, Abstand der Knöpfe mindestens 24 px (Ausnahmen H4).
- „Einsatz als beendet markieren“: sofortige Wirkung mit Quittung („Rückgängig“, „Wieder öffnen“), Kopfzeile nennt die offenen Exporte; „Abrücken“: ohne Rückfrage, mit Quittung „✓ Abgerückt“ und Rückgängig.
- Voller Speicher: „Papierkorb voll“, „Nicht gespeichert“, „Einsatz löschen“ bei vollem Speicher, jeweils ohne stillen Verlust (R20-Tabelle gilt weiter).

## Nicht geprüft

Kamera-Scan, Handschuhe, ein zweites Gerät mit echter Weitergabe-Datei, native Builds,
Wechsel von online auf offline innerhalb derselben Sitzung ohne Neuladen, QR-Decoder mit
echtem Bild offline, die weiteren Einsatz-Funktionen offline (Lageblatt, CSV, Sammel-PDF
aus der Einsatzansicht), weil diese wegen R21-D1 offline nicht erreichbar sind.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (alle zerstörenden Handlungen sicher; Einsatzansicht ohne Netz nicht öffnenbar, siehe R21-D1)
- **Fremde Hilfe nötig:** nein (offline: nicht lösbar ohne Netz)
- **Größtes Missverständnis:** „Funktioniert komplett offline“ gilt für den Bogen, nicht für den Meldekopf (R21-D1).
- **Größtes Einsatzrisiko:** Am Meldekopf ohne Netz lässt sich der Einsatz nach Neuladen nicht öffnen, die Fehlerseite rät zum Löschen (R21-D1, R21-D2).
- **Top-Priorität für die nächste Iteration:** Die vom Einsatz-Chunk angeforderte Stylesheet-Datei ausliefern und vorhalten, danach ein Offline-Neuladen der Einsatzansicht in die Freigabeprüfung aufnehmen (R21-D1).
