# Audit „Fehler und Wiederanlauf", Runde 16 (Bedienfehler provozieren, selbst korrigieren)

Prüfer: Rollenaudit `thw-error-recovery-reviewer`
Datum: 2026-10-26
Zählung: **P0 0 · P1 0 · P2 1 · P3 4** (5 neue Befunde)

Prüfgegenstand: Web-App im Produktionsbuild auf `http://localhost:4173`, Code-Stand Commit `36d549a`
(`main` nach Runde 15). Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md`,
`runde-15/README.md`, `runde-14/README.md`, `runde-13/README.md` und der Bericht
`runde-15/fehler-und-wiederanlauf.md`. Die dort genannten Grenzen und Reste (R6-O9 bis R15-O1, darunter
R15-E1, R15-E2, R15-D4, R15-S4, R15-M2) wurden nicht neu gemeldet.

## Prüfaufbau

Playwright (globales Modul unter `/opt/node22/lib/node_modules/playwright`, `chromium.launch()` ohne
Optionen), `isMobile`/`hasTouch`, Locale de-DE, Dichte 2. Telefon 390 × 844 und 360 × 640, einzelne
Messungen bei 640 × 360 (Querformat im geöffneten Dialog). Je Lauf ein neuer Browser-Kontext, Zustände durch
Bedienung; Übungsbögen aus `examples/thw/` als Dateien eingelesen, zusätzlich selbst abgewandelte Dateien
(zu neue und zu alte Schemaversion, fehlende Einheit, abgeschnittenes JSON, falsche Dateiendung, 30-MB-Datei).
Das Lageblatt wurde mit `pdftotext` gelesen. Nichts installiert, kein Prozess beendet.

Nicht geprüft: echte Kamera (Fehlerzweige der Kamera mit gestubbtem `getUserMedia`), Nahbereich, native
Builds, echte Bildschirmtastatur, HEIC-Fotos, mehrteilige QR-Codes (der Wortlaut aus R15-E3 wurde nicht
erneut gelesen).

Geprüft: Startseite, Assistent (Schritte 1 bis 6, Enter in Feldern, Zurück/Vor im Browser, Neuladen,
zwei Fenster mit demselben Entwurf), Telefon-, E-Mail-, Datums- und Kennzeichenfelder, „Namen einfügen…",
Schnellerfassung, Einsatz-Sammlung (anlegen, Dateien einlesen, Karte, Abrücken mit sofortigem Rückgängig,
Stärke ändern, Aufteilen, Auftrag/Notiz, Zeiten ändern, Suche ohne Treffer, Lageblatt, Löschen und
Papierkorb), „Einheit manuell erfassen…" mit vertauschten Zeiten, Bogen übergeben, „Für neuen Einsatz
vorbereiten", Vorlage, Datensicherung (Erstellen und Einspielen, fünf falsche Dateien), Kamera-Fehlerzweige.

## Urteil

Die Fehlerabsicherung ist weiter sehr dicht. Zahlendreher werden vor der Wirkung erkannt („Stimmt die
Stärke? … mehr als das Dreifache"), Abbruch, Zurück-Taste und Neuladen kosten keine Eingaben, ein zweites
Fenster wird am Überschreiben gehindert, falsche Dateien enden mit eigenem Satz. Datenverlust im Hauptweg
fand ich nicht; jede Korrektur gelang ohne fremde Hilfe. Reibung entsteht an einer Stelle, an der die App
„fremde" Eingaben stillschweigend umdeutet (eingefügte Namenslisten aus Tabellen), und an wenigen
Randstellen, an denen Hinweis oder Rückweg schwächer sind als in der Nachbarschaft.

### Runde-15-Behebungen, im echten Browser geprüft und gehalten

- R15-E4: „Aufteilen…" bei 360 × 640 zeigt Überschrift, Bezeichnungsfeld und Personenliste im Bild (erstes
  Feld bei y = 163, kein Nachscrollen nötig).
- R15-E5: „THW-8439" und „THW 843970" lösen „THW-Kennzeichen: fünf Ziffern, … hat 4/6. Stimmt das?" aus;
  „thw-84397" wird zu „THW-84397" ohne Hinweis.
- Doppeltipp-Sperre: „Rückgängig" nach „Abrücken" greift bei 250, 600, 1000 und 1400 ms; „←" nach „Weiter"
  greift bei 300 bis 1400 ms. Die Sperre „Einen Moment …" fängt nur gleiche Folgetipps ab.
- Zwei Fenster: „Hier wird nichts gespeichert. Das andere Fenster hat den Bogen geändert: Einheit (dort: „THW
  Bremen", hier: „THW Oldenburg")" mit „Anderen Stand laden"; Neuladen mit ungespeichertem Stand fragt vor
  dem Verlassen.
- „Stärke ändern…" mit 91/91/91: Rückfrage „Stimmt die Stärke?" mit je einem Satz je Zahl und „Gesamt 4 →
  273: mehr als das Dreifache"; „Zahlen korrigieren" führt zurück.
- Fehlzeit beim Erfassen vom Zettel: „Abgerückt um" vor „Eingetroffen um" → Dialog „Uhrzeiten vertauscht?"
  nach der Rückfrage „Stärke fehlt".
- Datensicherung einspielen: x.txt, leere Datei, `{"a":1}`, `[]` und ein einzelner Bogen enden je mit
  eigenem Satz; eine echte Sicherung zeigt vor dem Einspielen, was verloren geht („Sammlung „Hochwasser
  Test" mit 3 Meldungen / 0 Vorlagen / kein angefangener Bogen").
- Dateifehler in „Aus Datei laden…": zu neue Version („Bitte die App mit Netz neu laden"), fehlende Einheit,
  abgeschnittenes JSON, 30-MB-Datei ohne Bogen.
- Kamera: `NotAllowedError`/`SecurityError`, `NotReadableError` und „keine Kamera" haben je eigenen Satz,
  darunter bleibt der Handscanner-Weg.
- „Einsatz löschen…" → Papierkorb mit Rückgängig, nach Neuladen weiter „Papierkorb Einsätze (1)";
  „Fahrzeug entfernen" fragt mit Typ und Kennzeichen und nennt die 15-minütige Rückholung; „Verwerfen" des
  Entwurfs nennt die Rückholung auf der Startseite; Lagemonitor bei Beginn in der Zukunft: „Einsatz beginnt
  noch".

## Befunde

### R16-E1 [P2] „Namen einfügen…": Zeilen aus Tabellen (Tabulator, Semikolon) und dreiteilige Namen werden still falsch zerlegt

**Priorität:** P2

**Kennzeichnung:** gemessen (390 × 844, Schritt 3 „Personal", „Namen einfügen…").

**Fundstelle / Aufgabe:** Schritt 3 → „Namen einfügen…" → Liste einfügen → „n Personen übernehmen".

**Beobachtung:** Der Dialog wirbt mit „Praktisch, wenn die Liste schon existiert (Nachricht, Tabelle, Zettel):
einfach hier hineinkopieren." Eingefügt wurden fünf Zeilen, wie sie aus einer Tabellenkalkulation oder einer
Nachricht kommen.

- `Meier⇥Klaus⇥Führer` (Tabulator, wie beim Kopieren aus Excel): Vorschau „Meier · Klaus · Mannschaft", ohne
  Hinweis. Nach „übernehmen" steht in Person 1 Nachname „Meier", Vorname **leer**, der Kartenkopf lautet
  „Person 1 von 4 · Klaus", „Klaus" ist also als Funktion gelandet; „Führer" ist verschwunden, „Zählt als"
  steht auf Mannschaft. `Schmidt⇥Anna` gibt ebenso Nachname „Schmidt", Vorname leer, „Anna" als Funktion.
- `Koch;Jan;Helfer` (Semikolon, deutsches CSV): „wird nicht übernommen — kein Name?" mit dem Hinweistext
  „sieht nicht nach einem Namen aus (Ziffern, Klammern)"; weder Ziffern noch Klammern kommen vor, die
  Begründung trifft nicht zu.
- Ohne Komma mit drei Wörtern, `Mustermann Max Truppführer`: Vorschau „Truppführer, Mustermann Max"
  (Nachname „Truppführer"); `Schmidt Anna Maria`: „Maria, Schmidt Anna". Anders als bei „Lena Weber, ZTrFü"
  erscheint hier kein „Reihenfolge prüfen".
- `Meier, Klaus - Gruppenführer`: Vorschau „Meier, Klaus - Gruppenführer" (Zusatz im Vornamen).

Richtig und mit Vorschau gelöst sind „Nachname, Vorname", „Vorname Nachname", „Max von Mustermann", das
Komma mit Funktion („Schulz, Peter, Gruppenführer" → Unterführer/in) und Doppelte („doppelt").

**Erwartung der Rolle:** Aus einer Tabelle kopierte Spalten werden als Spalten gelesen; was die App nicht
versteht, wird in der Vorschau markiert und nicht stillschweigend in ein anderes Feld gelegt.

**Folge im Einsatz:** Wer Namen aus einer Dienststellenliste einfügt (der beworbene Fall), bekommt Personen
mit leerem Vornamen und Vornamen im Funktionsfeld. Die Vorschau sieht plausibel aus; der Fehler fällt erst
auf der Karte oder im PDF auf, auf dem eine Funktion „Klaus" steht. Das Erfassen einer 30-köpfigen Gruppe
kostet dann doppelte Arbeit; falsch geschriebene Namen auf Papier sind am Meldekopf schwer zu klären.

**Empfehlung:** Tabulator- und Semikolon-Trennung wie Komma lesen (Spalten: Nachname, Vorname, Funktion) oder
die Zeile in der Vorschau als „Reihenfolge prüfen" kennzeichnen; die Begründung bei nicht übernommenen Zeilen
am tatsächlichen Grund ausrichten (Trennzeichen statt „Ziffern, Klammern"); dreiteilige Namen ohne Komma
ebenfalls als „prüfen" kennzeichnen.

**Verifikation:** `Meier⇥Klaus⇥Führer` einfügen: Person 1 hat Nachname „Meier", Vorname „Klaus", „Zählt als"
Führer/in (oder die Vorschau warnt vor der Übernahme); `Koch;Jan;Helfer` wird gelesen oder mit einem Satz
über das Trennzeichen abgelehnt.

### R16-E2 [P3] „Für neuen Einsatz vorbereiten" lässt sich nicht zurücknehmen, obwohl Nachbarfunktionen Rückgängig haben

**Priorität:** P3

**Kennzeichnung:** gemessen (390 × 844, Bogen aus `001-albstadt-ztr-tz.json`, „Bogen übergeben…").

**Fundstelle / Aufgabe:** Übersicht → „Bogen übergeben…" → „Für neuen Einsatz vorbereiten" → „Zurücksetzen".

**Beobachtung:** Die Rückfrage ist gut: Sie nennt Zeitraum, Ort/Auftrag („Hochwasserlage Albstadt — Führung
Technischer Zug") und Sofortbedarf und endet mit „Das lässt sich hier nicht zurücknehmen — wer die Angaben
noch braucht, gibt den Bogen vorher weiter." Nach „Zurücksetzen" steht nur die Statuszeile „Einsatzdaten für
den neuen Einsatz zurückgesetzt — Ort/Auftrag eintragen." Es gibt kein „Rückgängig", und auf der Startseite
gibt es keinen Eintrag zum Zurückholen (dort steht nur „Fortsetzen"). Entfernte Personen, Fahrzeuge,
Meldungen, Aufträge, Verschiebungen und Gelöschte Einsätze haben dagegen überall Rückgängig oder einen
Papierkorb.

**Erwartung der Rolle:** Ein Knopf, der drei Angabenblöcke leert, hat wie die Nachbarn eine Rückholung;
wer aus Versehen bestätigt, kann nicht „vorher weitergeben".

**Folge im Einsatz:** Ein Versehen kostet das Abtippen von Zeitraum, Ort, Auftrag und Sofortbedarf. Die
Rückfrage ist deutlich, daher P3.

**Empfehlung:** Den Stand vor dem Zurücksetzen 15 Minuten lang wie bei „Fahrzeug entfernen" zurückholbar
halten (Quittung mit „Rückgängig") oder ihn als zuletzt geschlossenen Bogen anlegen.

**Verifikation:** „Zurücksetzen" bestätigen: Quittung mit „Rückgängig" erscheint, Tippen stellt Zeitraum,
Ort/Auftrag und Sofortbedarf wieder her, auch nach Neuladen.

### R16-E3 [P3] Telefonfeld: Ziffern aus einem Zusatz werden an die Nummer angehängt, der Hinweis nennt nur das entfernte Wort

**Priorität:** P3

**Kennzeichnung:** gemessen (390 × 844, Schritt 1, Feld „Telefon" der Zugehörigkeit).

**Fundstelle / Aufgabe:** Schritt 1 „Einheit" → Telefon.

**Beobachtung:** `0441 123456 App 12` wird zu `044112345612`; der Hinweis lautet „Nur Ziffern übernommen („App"
entfernt)." Die „12" ist an die Nummer gewachsen. Ebenso wird `0441/12345-0` zu `0441123450` (ohne Hinweis).
Gut gelöst sind `+49 441 123456`, „112" („Nur 3 Ziffern — stimmt die Nummer?") und `0170 1234567 oder 0171
7654321` („Zweite Nummer … nicht übernommen").

**Erwartung der Rolle:** Wer eine Nebenstelle mit Text schreibt, bekommt gesagt, dass aus Nummer und Zusatz
eine einzige Nummer geworden ist, und sieht das Ergebnis vor dem Weitergehen.

**Folge im Einsatz:** Die Absenderzeile trägt eine Rufnummer, die es nicht gibt; die Rückfrage am Meldekopf
läuft ins Leere. Der Hinweis ist sichtbar, deutet aber nur auf „App", nicht auf die „12".

**Empfehlung:** Hat ein Zusatz Ziffern, dies im Hinweis nennen („Aus „0441 123456 App 12" wurde
044112345612 — stimmt die Nummer?") oder die Ziffern des Zusatzes nicht anhängen.

**Verifikation:** `0441 123456 App 12` eintragen und das Feld verlassen: Der Hinweis nennt die
zusammengezogene Nummer als Ganzes oder die „12" bleibt draußen.

### R16-E4 [P3] Ort „Oldenburg" wird als „nicht im OV-Verzeichnis" gemeldet, obwohl er mehrdeutig ist

**Priorität:** P3

**Kennzeichnung:** gemessen (390 × 844, Schritt 1, „Ort der Einheit").

**Fundstelle / Aufgabe:** Schritt 1 → Ort der Einheit.

**Beobachtung:** Bei „Oldenburg" bietet die Liste „Oldenburg (NI) OODE · 26129 Oldenburg" und „Oldenburg in
Holstein OOLD". Verlässt man das Feld ohne Antippen, lautet die Meldung: „„Oldenburg" ist nicht im
OV-Verzeichnis — Vorschlag antippen, sonst fehlen Kürzel, Telefon und E-Mail. Ein Ortsverband, den es dort
nicht gibt, darf so stehen bleiben." Mit „Oldenburg (NI)" ergänzt die App Kürzel, Telefon, E-Mail und beide
übergeordneten Ebenen („mit Telefon und E-Mail, dazu die übergeordneten Ebenen") und bietet „Rückgängig".
Dasselbe bei „Ulm", das „Ulm", „Dülmen", „Kulmbach" und „Neu-Ulm" vorschlägt.

**Erwartung der Rolle:** Bei einem Ortsnamen, den es zweimal gibt, heißt es „mehrdeutig — bitte wählen",
nicht „nicht im Verzeichnis".

**Folge im Einsatz:** Wer „Oldenburg" schreibt, liest „darf so stehen bleiben" und lässt das Feld, wie es
ist; Kürzel, Telefon, E-Mail und die Ebenen darüber fehlen dann auf dem Bogen. Der Satz „Vorschlag antippen"
weist den Weg, die Aussage „nicht im Verzeichnis" ist aber unzutreffend.

**Empfehlung:** Bei mehreren Vorschlägen die Meldung auf „mehrere Orte heißen so — Vorschlag antippen"
stellen und den Satz „darf so stehen bleiben" nur bei null Vorschlägen zeigen.

**Verifikation:** „Oldenburg" eintragen und das Feld verlassen: Meldung nennt die zwei Treffer, nicht das
Fehlen im Verzeichnis.

### R16-E5 [P3] Datei ohne Bild, die „Bild" heißt, endet mit „Kein QR-Code im Bild gefunden"

**Priorität:** P3

**Kennzeichnung:** gemessen für eine Textdatei `fake.png`; für HEIC-Fotos nicht geprüft.

**Fundstelle / Aufgabe:** Einsatz-Sammlung → „Bögen einlesen…" (Dateien oder Fotos von QR-Codes).

**Beobachtung:** `foto.png` (Bildschirmfoto ohne QR) und `fake.png` (Text mit Endung .png) erhalten den
gleichen Satz „Kein QR-Code im Bild gefunden." Andere Dateiarten haben eigene Sätze („stammt nicht aus dieser
App. Beim Absender die PDF des Bogens anfordern oder den QR-Code scannen").

**Erwartung der Rolle:** Eine Datei, die sich nicht als Bild öffnen lässt, wird so genannt („Datei lässt sich
nicht als Bild öffnen"), damit der Helfer nicht das Foto neu macht.

**Folge im Einsatz:** Wer ein Foto von einem Gerät mit unlesbarem Format (Plausibel: HEIC auf einem PC-Browser,
nicht geprüft) wählt, versucht es mit besserem Licht statt mit einem anderen Format.

**Empfehlung:** Unterscheiden zwischen „Bild geöffnet, kein QR" und „Datei nicht als Bild lesbar" und im
zweiten Fall Format und Ausweg nennen (Foto als JPEG, Screenshot, PDF).

**Verifikation:** `fake.png` wählen: Meldung sagt, dass die Datei kein lesbares Bild ist.

## Abschluss

- **Aufgabe geschafft:** ja (alle geprüften Abläufe ohne fremde Hilfe)
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Namen einfügen… — einfach hineinkopieren" gilt nur für Komma- und
  Leerzeichenlisten, nicht für Tabellenzeilen, die der Helfer aus Excel kopiert.
- **Größtes Einsatzrisiko:** Falsch zerlegte Namenszeilen sehen in der Vorschau plausibel aus und führen zu
  Personen ohne Vornamen und mit Vornamen im Funktionsfeld.
- **Top-Priorität für die nächste Iteration:** R16-E1 (Tabulator und Semikolon lesen oder in der Vorschau
  markieren), danach R16-E2 (Rückholung für „Für neuen Einsatz vorbereiten").
