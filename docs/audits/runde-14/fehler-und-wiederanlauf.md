# Audit „Fehler und Wiederanlauf", Runde 14 (Bedienfehler provozieren, selbst korrigieren)

Prüfer: Rollenaudit `thw-error-recovery-reviewer`
Datum: 2026-10-26
Zählung: **P0 0 · P1 0 · P2 1 · P3 6** (7 neue Befunde)

Prüfgegenstand: Web-App im Produktionsbuild auf `http://localhost:4173`, Code-Stand Commit `429c41a`
(`main` nach Runde 13). Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md`,
`docs/audits/runde-13/README.md`, `runde-12/README.md`, `runde-11/README.md`. Die dort genannten Grenzen und
Reste (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4, leere Karten bei
„Nur Stärke", Rückgängig für Meldungen ohne Überleben des Neuladens, Tabellenzeilenhöhe bei 180 × 320,
R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3, R12-W3, R12-H3, R12-O2, R12-O4, R12-G3, R13-W1,
R13-W6, R13-H1) wurden nicht neu gemeldet.

## Prüfaufbau

Playwright (globales Modul, `chromium.launch()` ohne Optionen; die Projektkopie fand keinen Browser),
`isMobile`/`hasTouch`, Locale de-DE, Dichte 2, Telefon 390 × 844 und 360 × 640. Neue Browser-Kontexte je
Lauf, Zustände durch Bedienung; Übungsbögen aus `examples/thw/` als Dateien eingelesen. Nichts
installiert, kein Prozess beendet. Die Handscanner-Eingabe wurde über Tastatureingaben mit Enter
nachgestellt (kein Kamerabild im Prüfaufbau).
Nicht geprüft: echte Kamera, Nahbereich, native Builds, echte Bildschirmtastatur, Zeitverhalten auf einem
echten Telefon.

Geprüft: Startseite, Assistent (Schnellerfassung, Zahlen in Personal, Fahrzeuge, Sofortbedarf, Übung),
Übersicht und Übergabe eines leeren Bogens, Einsatz-Sammlung (anlegen mit leerem und langem Namen,
Doppeltipp, Dateien einlesen, Zug zuordnen, Abrücken, Stärke ändern, Tabelle, Exporte), Einsatz
weitergeben und wieder importieren (zweimal; abweichender Stand auf zwei Geräten), zwei Fenster
gleichzeitig (Sammlung und Entwurf), Handscanner mit Fehlcodes, Datensicherung mit falschen Dateien,
Absenderkarte, Übungsbögen, Dialoge bei 360 × 640.

## Urteil

Die Fehlerabsicherung ist sehr dicht, und die Behebungen aus Runde 13 halten in der laufenden App:

- R13-E1/E2: Sitzplätze und Mengen: „7,5" wird gerundet und genannt, „abc" und „1e1" werden mit „Es gilt
  weiter 7." abgelehnt, „-3" nennt das Minus, 100000 wird mit „Höchstens 99 — dein Wert 100000 wurde auf 99
  gesetzt." begrenzt.
- R13-D1: „Beginn entfernen" fragt mit Gegenüberstellung nach. Sofortbedarf abwählen fragt, wenn Werte
  drinstehen.
- R13-O1: Falsche, kaputte und leere Sicherungsdatei enden mit je einem konkreten Satz, die Daten bleiben
  unverändert.
- R13-S3 und Folgen: Zug „Zug 1" wird zu „1. Zug" vereinheitlicht, leeres Zug-Feld sperrt „Zuordnen".
- R12-E-Gruppe: E-Mail-Adresse in der Absenderkarte fragt mit „Trotzdem übernehmen / Adresse prüfen".

Weiter bestätigt: Zwei Fenster gleichzeitig laufen sauber (Sammlung zieht nach, beim Entwurf steht „Hier
wird nichts gespeichert … Anderen Stand laden"); Einsatz-Import zweimal ergibt „keine neue Einheit … Datei
war älter oder gleich"; ein auf zwei Geräten abweichender Stand wird zusammengeführt („1 Meldung
aktualisiert: Albstadt abgerückt"); Doppeltipp auf „Einsatz anlegen" erzeugt nur einen Einsatz;
Übungsbogen und Datei ersetzen einen angefangenen Bogen nur nach Rückfrage; die Fahrzeug-Entfernen-Frage
nennt „Rückgängig … auch nach Neuladen"; verfälschte QR-Links (ein Zeichen geändert) werden abgewiesen.

Der Helfer schafft alle geprüften Aufgaben ohne fremde Hilfe. Datenverlust im Hauptweg fand ich nicht. Der
eine mittlere Befund betrifft eine fehlende Korrekturmöglichkeit am Meldekopf, die übrigen sind kleine
Unstimmigkeiten bei Fehlermeldungen und Prüfungen.

## Befunde

### R14-E1 [P2] Meldekopf: Eine fälschlich als „Übung" gemeldete Einheit lässt sich dort nicht auf „Einsatz" umstellen

**Priorität:** P2

**Kennzeichnung:** gemessen (390 × 844, Einsatz-Sammlung „Einsatz", Bogen `001-albstadt-ztr-tz.json`
eingelesen); Ursache im Ablauf des Absenders plausibel, nicht gemessen.

**Fundstelle / Aufgabe:** Einsatz-Sammlung, Karte einer Meldung mit Marke „ÜBUNG" → „Details" und
„Mehr…" (Aufteilen…, Stärke ändern…, Verschieben…, Entfernen).

**Beobachtung:** Die Meldung steht mit „ÜBUNG", der Kopf sagt „1 Übungsmeldung nicht gezählt — anzeigen",
die Summen stehen auf 0. Auf der Karte und in „Mehr…" gibt es keine Handlung, die Kennzeichnung zu ändern.
„Stärke ändern…" erzeugt eine Folgemeldung und behält „ÜBUNG" („Nr. 1 … ÜBUNG · neue Fassung", weiter
nicht gezählt). Bleiben „Entfernen" mit erneutem Erfassen von Hand oder eine neue Datei vom Absender.
Auf Absenderseite kommt die Marke leicht in den Bogen: Die Übungsbögen sind als Übung geöffnet, die
Anleitung nennt sie als Vorbelegung zum Anpassen, das Kästchen „Dies ist eine Übung" steht in Schritt 2
unter dem Formular.

**Erwartung der Rolle:** Wer am Meldekopf erkennt „die ist doch echt, nur das Kästchen steckt noch", will
das an der Karte umstellen (mit Quittung und Rückgängig wie beim Abrücken), statt den Bogen neu zu
bekommen oder abzutippen.

**Folge im Einsatz:** Eine reale Einheit fehlt in Stärke, Verpflegung und Bedarf der Lage, bis der Absender
einen neuen Bogen schickt. Der Hinweis „Übungsmeldung nicht gezählt" ist sichtbar, der Weg zur
Korrektur aber lang; unter Zeitdruck bleibt die Zeile stehen oder wird von Hand nachgebaut (Dubletten-Rückfrage,
Eingaben doppelt).

**Empfehlung:** An der Karte „Als Einsatzmeldung zählen" (und umgekehrt) mit Rückfrage, die die Folge in
Summen nennt, Quittung und Rückgängig; die Änderung als eigene Zeile in der Historie. Alternativ „Stärke
ändern…" um die Auswahl Übung/Einsatz erweitern.

**Verifikation:** Übungsbogen einlesen, Karte auf „Einsatz" umstellen: Summen steigen, Historie nennt die
Änderung, Rückgängig stellt die Übung wieder her; Lageblatt und CSV zeigen die neue Kennzeichnung.

### R14-E2 [P3] Handscanner: Die Fehlermeldung für fremde Codes läuft über den Rand, der Satz ist abgeschnitten

**Priorität:** P3

**Kennzeichnung:** gemessen (390 × 844 und 360 × 640, Scanner-Fenster ohne Kamera, Handscanner-Weg).

**Fundstelle / Aufgabe:** „Bogen scannen…" → Fenster „Ohne Kamera: mit dem USB-Handscanner scannen" →
Meldung „✗ Der gescannte QR-Code enthält keinen gültigen Erfassungsbogen. Empfangen: „…"".

**Beobachtung:** Wird ein fremder Code gelesen, der wie eine Adresse aussieht (etwa
„https://www.thw.de/SharedDocs/Downloads/…", im Fenster auf 40 Zeichen gekürzt), bricht der Text nicht um.
Das Meldefeld ragt rechts aus dem Fenster: bei 390 px bis 407 px, bei 360 px bis 406 px. Mit ihm rutschen
Überschrift, Anleitung und Rahmen nach rechts und sind abgeschnitten („… keine[n] gültig…", „Ohne Kamera: mit
dem USB-Handsca…"). Ein WLAN-Code („WIFI:T:WPA;S:…") bleibt noch innerhalb. Der Satz wird nur dann vollständig
lesbar, wenn der Fremdcode kurz ist.

**Erwartung der Rolle:** Die Meldung bleibt im Fenster und bricht um; der Hauptsatz („kein gültiger
Erfassungsbogen") steht vollständig vor dem Fremdtext.

**Folge im Einsatz:** Wer am Meldekopf versehentlich einen Webadressen-Code (Merkblatt, Plakat, Etikett) mit
dem Handscanner liest, sieht eine halb abgeschnittene Meldung und weiß nicht sicher, ob der Bogen
aufgenommen wurde. Die Anleitung im selben Fenster ist ebenfalls verschoben. Kamera-Weg nicht prüfbar.

**Empfehlung:** Fremdtext mit Umbruch an beliebiger Stelle zeigen, Hauptsatz zuerst und fett; Fenster nie
breiter als der Bildschirm.

**Verifikation:** Bei 360 × 640 die Zeichenfolge einer langen Webadresse eingeben und mit Enter abschließen:
Meldung, Überschrift und Anleitung bleiben vollständig im Rahmen, keine seitliche Verschiebung.

### R14-E3 [P3] Handscanner: Kurze Codes (bis 4 Zeichen) bleiben bei „Handscanner erkannt — n Zeichen …" stehen, ohne Ergebnis

**Priorität:** P3

**Kennzeichnung:** gemessen (390 × 844, Tastatureingabe plus Enter; „Kurz", „ab"; Gegenprobe mit
13 Ziffern).

**Fundstelle / Aufgabe:** Scanner-Fenster, Statuszeile.

**Beobachtung:** „Kurz" + Enter ergibt „Handscanner erkannt — 4 Zeichen …"; die Zeile bleibt unverändert, auch
nach 3 s, kein ✗, kein „zu kurz". Ebenso „ab" („2 Zeichen …"). 13 Ziffern (EAN) ergeben dagegen den Satz
„✗ Der gescannte QR-Code enthält keinen gültigen Erfassungsbogen. Empfangen: „4006381333931"". Das „…" liest
sich wie „wird noch empfangen".

**Erwartung der Rolle:** Jeder abgeschlossene Scan (Enter) endet mit einem Ergebnis; ein zu kurzer Code wird
als „kein Erfassungsbogen" gemeldet.

**Folge im Einsatz:** Wer ein kurzes Etikett scannt, wartet auf einen Abschluss, der nicht kommt, und scannt
erneut oder bricht ab. Kein Datenverlust.

**Empfehlung:** Nach Enter immer ein Ergebnis zeigen; zu kurze Eingaben mit demselben Satz wie fremde Codes
abweisen.

**Verifikation:** „ab" + Enter eingeben: Meldung „✗ …" erscheint, „Bereit — warte auf den Handscanner" kehrt
zurück.

### R14-E4 [P3] Erster Tipp auf „Bogen scannen…" kurz nach dem Öffnen der Sammlung geht verloren; „Einen Moment …" bleibt stehen

**Priorität:** P3

**Kennzeichnung:** gemessen, reproduziert, Ursache nicht geklärt (vermutlich Nachladen des Scanner-Teils
während der Einrichtung des Offline-Speichers beim ersten Besuch).

**Fundstelle / Aufgabe:** Neuer Browser-Kontext (Erstbesuch), „Neue Einsatz-Sammlung…" → „Einsatz anlegen" →
sofort „Bogen scannen…".

**Beobachtung:** Wartet man nach „Einsatz anlegen" 300 ms: 4 von 4 Läufen ohne Scanner; 800 ms: 3 von 4;
2000 ms und 5000 ms: 0 von 8. Im Fehlerfall erscheint die Meldung „Einen Moment …" und steht mehr als 30 s
unverändert, kein Scanner, kein Fehlersatz. Ein zweiter Tipp auf denselben Knopf öffnet den Scanner sofort.
Bei bereits eingerichtetem Speicher (zweiter Besuch im selben Browser) trat es nicht auf (0 von 3), ebenso
nicht beim Scanner von der Startseite aus (0 von 9) und bei „Einheit manuell erfassen…" (0 von 3).

**Erwartung der Rolle:** Entweder öffnet der Tipp das Scanner-Fenster, oder die Meldung verschwindet nach
wenigen Sekunden mit einem Satz wie „Bitte noch einmal tippen".

**Folge im Einsatz:** Wer die App frisch auf dem Gerät hat und sofort scannen will, hält die Meldung für
Warten und verliert Zeit am Meldekopf; erst ein zweiter Tipp hilft. Auf einem langsamen Telefon ist das
Fenster vermutlich länger.

**Empfehlung:** Meldung „Einen Moment …" nach spätestens 5 bis 10 s ersetzen durch „Scanner konnte nicht
gestartet werden — noch einmal tippen", und den ersten Tipp nicht verlieren.

**Verifikation:** Erstbesuch mit leerem Browserspeicher, Einsatz anlegen und innerhalb 1 s „Bogen scannen…"
tippen: Scanner öffnet oder die Meldung weist nach höchstens 10 s auf den Wiederholungstipp hin.

### R14-E5 [P3] Absenderkarte: Die Telefonnummer wird ohne Rückfrage übernommen, obwohl der Hinweis „sieht unvollständig aus" steht; Zahlenmischungen ohne Hinweis

**Priorität:** P3

**Kennzeichnung:** gemessen (390 × 844, Startseite → „Name/Kontakt hinterlegen…" → „Übernehmen", danach
Neuladen).

**Fundstelle / Aufgabe:** Absenderkarte, Felder Name, E-Mail, Telefon.

**Beobachtung:** „abc" und „12" im Feld Telefon zeigen schon beim Verlassen „Die Telefonnummer sieht
unvollständig aus.", „Übernehmen" speichert sie trotzdem ohne Rückfrage („Absender: abc · ändern", nach
Neuladen unverändert). Die E-Mail-Adresse „max@thw" bekommt dagegen die Rückfrage „E-Mail-Adresse übernehmen?
… Trotzdem übernehmen / Adresse prüfen". „0170 abc" und „0171 1234567 / 0441 99" (zwei Nummern in einem
Feld) werden ohne jeden Hinweis gespeichert, obwohl der Assistent bei Telefonfeldern die zweite Nummer
abschneidet und nennt (R12-E1).

**Erwartung der Rolle:** Dieselbe Prüfung wie im Assistenten und dieselbe Rückfrage wie bei der E-Mail.

**Folge im Einsatz:** Die Nummer reist mit Siegel in jedem übergebenen Bogen („Rückkanal"). Eine falsche
Nummer fällt erst auf, wenn die Gegenstelle jemanden erreichen will.

**Empfehlung:** Telefonprüfung der Absenderkarte an die des Assistenten angleichen (Buchstaben, zweite
Nummer) und bei Hinweis dieselbe Rückfrage „Trotzdem übernehmen / Nummer prüfen" stellen.

**Verifikation:** „0170 abc" und „12" eintragen und „Übernehmen": Rückfrage erscheint; „0171 1234567 / 0441
99": zweite Nummer wird genannt.

### R14-E6 [P3] Übungsbogen als eigene Meldung: Nach Abwählen von „Übung" fehlt jeder Hinweis auf fiktive Personen und Nummern

**Priorität:** P3

**Kennzeichnung:** gemessen (390 × 844, `001-albstadt-ztr-tz.json` als Datei geöffnet; plausibles Risiko
für die Folge).

**Fundstelle / Aufgabe:** Schritt 2 („Dies ist eine Übung"), Übersicht, Übergabe.

**Beobachtung:** Der Übungsbogen trägt „ÜBUNG" und die Zeile „Übungsbogen geöffnet — fiktive Daten zum
Ansehen und Ausprobieren." Die Zeile steht nur beim Öffnen; nach Neuladen fehlt sie. Wird „Dies ist eine
Übung" abgewählt und der Ort/Auftrag geändert, nennt die Übersicht als einzigen offenen Punkt „Einsatzzeitraum
… ist vorbei". Personal („Lang, Sabine", „Sommer, Sandra" …) und Nummern („Mobil: 5556968346") stehen
unverändert und gehen so in Link, QR-Code und PDF.

**Erwartung der Rolle:** Wird der Schutz „Übung" abgewählt, soll die App an Namen und Nummern erinnern, die
noch aus dem Beispiel stammen.

**Folge im Einsatz:** Die Gegenstelle erhält erfundene Personen und Telefonnummern als echte Rückkanäle.
Das Risiko besteht nur, wenn jemand den Übungsbogen als Vorlage nimmt und beide Schutzstellen (Übung,
Beispielzeile) umgeht.

**Empfehlung:** Beim Abwählen von „Übung" bei einem Bogen, der aus einem Beispiel stammt, eine Rückfrage
„Personal und Nummern stammen aus dem Beispiel — ersetzen?" und einen offenen Punkt in der Übersicht, bis
Personal geändert ist.

**Verifikation:** Übungsbogen öffnen, „Übung" abwählen: Rückfrage erscheint, Übersicht zeigt einen Punkt
zum Personal, der nach Änderung der Namen verschwindet.

### R14-E7 [P3] Leerer Bogen lässt sich ohne Rückfrage in die Einsatz-Sammlung ablegen und zählt als „1 zählend"

**Priorität:** P3

**Kennzeichnung:** gemessen (390 × 844, neuer Bogen ohne Eingabe → Übersicht → „In Einsatz-Sammlung
ablegen…" → neue Sammlung).

**Fundstelle / Aufgabe:** Übersicht des eigenen Bogens, „In Einsatz-Sammlung ablegen…".

**Beobachtung:** Der Bogen hat 4 offene Punkte (kein Ort, kein Typ, Stärke 0, kein Auftrag). Der Dialog zum
Ablegen nennt sie nicht. Danach steht in der Sammlung „Einheiten (1 gemeldet · 1 zählend)", Karte „THW …
neu · Stärke 0 / 0 / 0 / 0 · Ort der Einheit fehlt + 3 weitere".

**Erwartung der Rolle:** Vor dem Ablegen ein Hinweis wie bei „Bogen übergeben…" („4 offene Punkte —
trotzdem ablegen?").

**Folge im Einsatz:** Gering. Eine leere Zeile ohne Ort steht in der Liste und in der Zahl der Einheiten, bis
jemand sie entfernt; sie ist als solche erkennbar.

**Empfehlung:** Im Dialog „In Einsatz-Sammlung ablegen" die offenen Punkte nennen; Meldungen ohne Ort nicht
in „zählend" aufnehmen oder als „unvollständig" kennzeichnen.

**Verifikation:** Leeren Bogen ablegen: Dialog nennt die offenen Punkte; die Zeile zählt nicht als
Einheit, solange der Ort fehlt.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Einen Moment …" beim ersten Scanner-Tipp wird als Warten gelesen, obwohl der Tipp verloren ging.
- **Größtes Einsatzrisiko:** Eine echte Einheit mit versehentlich gesetzter Übung-Marke fehlt in der Lage, und der Meldekopf kann sie nicht selbst umstellen (R14-E1).
- **Top-Priorität für die nächste Iteration:** An der Karte einer Meldung „Als Einsatzmeldung zählen" mit Quittung und Rückgängig anbieten (R14-E1).
