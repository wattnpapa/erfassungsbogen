# Audit „Stress und Unterbrechung“, Runde 14 (Zeitdruck, Ablenkung, Wiedereinstieg)

**Prüfer:** Rollenaudit `thw-stress-test-user` · **Datum:** 2026-10-26 ·
**Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 4 (insgesamt 4 neue Befunde)

Prüfgegenstand: Web-App, laufender Produktionsbuild unter
`http://localhost:4173` (`vite preview`), Code-Stand Commit `429c41a`
(`main` nach Runde 13). Reiner Prüfbericht, keine Codeänderung; es wurde kein
Prozess beendet.

## Prüfaufbau

Playwright (global, `/opt/node22/lib/node_modules/playwright`),
`chromium.launch()` ohne Optionen, `isMobile`/`hasTouch`, Locale de-DE,
Viewports 390 × 844 und 360 × 640 (je eigener Browser-Kontext). Tipps mit
`tap`/`touchscreen.tap`, Unterbrechung mit `reload()`, Zurück-Geste mit
`goBack()`, zweiter Tab im selben Kontext, Drehen des Viewports, Eingabetaste
und Escape in Rückfragen. Zustände über die Oberfläche („Neue
Einsatz-Sammlung…“, „Bögen einlesen…“ mit Übungsbögen aus `examples/thw/`,
„Einheit manuell erfassen…“, Schnellerfassung, „Neuen Bogen erstellen“).
Skripte im Scratchpad unter `.../scratchpad/r14/`.

Vorher gelesen: `docs/audits/README.md`, `docs/audits/runde-13/README.md`,
`runde-12/README.md`, `runde-11/README.md`. Die dort genannten bekannten
Grenzen (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5,
R8-H5/S4; Runde 10: leere Karten bei „Nur Stärke“, Rückgängig für Meldungen
überlebt Neuladen nicht, Zeilenhöhe bei 180 × 320; R11-S4, R11-H2, R11-K2,
R11-A2, R11-A5, R11-M1, R11-M3; R12-W3, R12-H3, R12-O2, R12-O4, R12-G3;
R13-W1, R13-W6, R13-H1) wurden nicht neu gemeldet. Gewollte Tipp-Sperren
sind bekannt und kein Befund. Was andere Rollen dieser Runde bereits
gefunden haben (u. a. „Zuordnen“ ohne Quittung, R14-H2 und R14-D3;
Schnellerfassung „vollständig“ bei offenem Einheitstyp, R14-N3), ist hier
nicht wiederholt.

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert; *Risiko* =
abgeleitet, nicht nachgestellt.

**Nicht geprüft:** echte Kamera, Lärm, Handschuhe, echte Bildschirmtastatur
(damit auch das Verhalten der Zurück-Geste bei offener Tastatur), WebKit,
native Builds, Zwei-Geräte-Abgleich, 180 × 320, Tablet, Alterung von
Zeitangaben über Stunden (der Testtakt feuert beim Vorspulen nur einmal; die
Anzeige „vor 10 Min“ und „vor 1 Std 0 Min“ lief korrekt weiter, ein Stand
nach mehreren Stunden ist daher nicht belegt).

## Urteil

Unter Stress und Unterbrechung bleibt die App im Kern beherrschbar; die
Aufgaben gelingen ohne fremde Hilfe. Die Behebungen aus Runde 13 halten, bis
auf eine Ausnahme (R14-S1). Reibung entsteht nur noch beim Wiederfinden der
eigenen Stelle nach einer Unterbrechung und an zwei Kleinigkeiten in der
Karte. Daten gingen in keinem Versuch verloren.

### Behebungen aus Runde 13, geprüft

- **R13-S1** (Meldung nach „Rückgängig“ beim Einsatz-Löschen) *gemessen,
  hält:* Nach „Rückgängig“ verschwindet der Satz „… in den Papierkorb gelegt“
  mit der Quittung; der Entwurf-Kasten heißt wieder „Angefangene Erfassung für
  „Löschtest““.
- **R13-S2** (Schnellerfassung: Reihenfolge der Knöpfe) *gemessen, hält:* Die
  Übersicht nennt „In Einsatz-Sammlung ablegen…“ zuerst, „Bogen übergeben…“
  danach, dazu der Satz „Meldung einer fremden Einheit: Sie gehört in eine
  Einsatz-Sammlung. „Bogen übergeben…“ gäbe sie mit dem Siegel dieses Geräts
  weiter.“
- **R13-S3** (Zug/Auftrag bei Browser-Zurück) *gemessen, hält nicht
  vollständig:* siehe R14-S1.
- **R13-W5/E-Familie** (Zug-Feld): Leeres Feld sperrt „Zuordnen“ (Knopf
  deaktiviert).
- Weiter in Ordnung (gemessen):
  - Neuladen unmittelbar nach dem Tippen (0, 150, 400, 900 ms) behält den
    Ort im Entwurf; „Fortsetzen“ öffnet den Schritt, in dem man war.
  - Zwei Fenster mit demselben Einsatz: Aufnahmen aus beiden Fenstern
    erscheinen in beiden; zwei Fenster mit demselben Entwurf: das veraltete
    Fenster sagt „⚠ Hier wird nichts gespeichert. Das andere Fenster hat den
    Bogen geändert: Einheit (dort: „THW Bonn“, hier: „THW Kiel Hafen“)“ mit
    „Anderen Stand laden“, nichts wird überschrieben.
  - Doppeltipp auf „Einsatz anlegen“ legt einen Einsatz an.
  - Rückfragen („Einsatz löschen?“, „Bogen schließen?“) setzen den Fokus auf
    „Abbrechen“; Eingabetaste (etwa als Endzeichen eines Handscanners) bestätigt
    nichts, Escape schließt; Tipp auf den Hintergrund schließt nur die
    Rückfrage „Einsatz löschen?“, ohne zu löschen.
  - „Stärke fehlt“ beim Übernehmen ohne Stärke: klare Wahl „Stärke eintragen“
    / „Trotzdem mit Stärke 0 übernehmen“ / „Abbrechen“.
  - Abrücken: Quittung „Abgerückt 09:34: Nr. 1 …“ mit „Rückgängig“, Zustand
    bleibt nach Neuladen.
  - Browser-Verlauf: Aufnahme-Schritte, Einsatz und Startseite werden in
    sinnvoller Reihenfolge zurückgegangen, Vorwärts funktioniert.
  - Scanner ohne Kamera: Satz „Dieses Gerät meldet keine nutzbare Kamera.“,
    Handscanner-Eingabe, „Kamera erneut versuchen“, „QR aus Bild einlesen…“,
    „Fertig“ sichtbar bei 360 × 640; Neuladen schließt den Scanner und lässt
    den Einsatz offen.
  - Querformat bei fokussiertem Ortsfeld: Feld bleibt sichtbar.
  - Stepper der Schnellerfassung 52 × 52 px, benannt („Mannschaft: erhöhen“).

## Befunde

### R14-S1 [P3] Zug und Auftrag/Notiz an der Karte: Browser-Zurück ohne Fokuswechsel verwirft den Text weiterhin (Behebung R13-S3 hält nicht)

**Priorität:** P3

**Kennzeichnung:** gemessen (Skripte `u3.js`, `u4.js`, 360 × 640); auf einem
echten Telefon mit Bildschirmtastatur *nicht prüfbar* (dort löst die erste
Zurück-Geste meist zuerst den Fokuswechsel aus). Auf dem Gerät daher Risiko.

**Fundstelle / Aufgabe:** Einsatzansicht → Karte aufklappen → „Auftrag/Notiz“
(und gleichlautend „Zug zuordnen“) → „Pumpen am Deich Nord“ bzw. „XYZ Test“
tippen, nicht „Speichern“, nicht aus dem Feld tippen → Zurück.

**Beobachtung:** Browser-Zurück (`goBack`) führt zur Startseite. Öffnet man
den Einsatz wieder, die Karte und das Feld, ist das Feld leer; der Text steht
weder in der Karte noch im Feld. Dieselbe Eingabe bleibt erhalten, wenn statt
Zurück „‹ Startseite“ getippt oder die Seite neu geladen wird. Der Bericht
zu Runde 13 führt „Entwurf von Zug und Auftrag bleibt beim Zurück“ als
behoben; im Testbrowser trifft das für den Weg „Zurück ohne Fokuswechsel“
nicht zu.

**Erwartung der Rolle:** Was ich getippt habe, ist da, wenn ich zurückkomme –
gleich, wie ich den Bildschirm verlassen habe.

**Folge im Einsatz:** Wer mitten im Satz angefunkt wird und per Zurück-Geste
die Ansicht verlässt, muss Auftrag oder Zugname neu tippen. Ohne Meldung fällt
das erst auf, wenn die Karte leer bleibt. Kein Datenverlust an Meldungen.

**Empfehlung:** Den Stand des Feldes beim Verlassen der Ansicht (auch beim
Browser-Zurück) übernehmen oder als Entwurf bis zum nächsten Öffnen der Karte
behalten.

**Nachprüfung:** Wie oben, danach Einsatz öffnen, Karte aufklappen: Text steht
in der Karte oder im geöffneten Feld.

### R14-S2 [P3] Nach Neuladen („Fortsetzen“) steht man wieder oben: Bildlaufstelle und aufgeklappte Karte gehen verloren

**Priorität:** P3

**Kennzeichnung:** gemessen (Skripte `g1.js`, `s1.js`, 390 × 844). Dass ein
Telefon die Seite im Hintergrund verwirft, ist Annahme; der Neuladen-Test ist
die Nachstellung.

**Fundstelle / Aufgabe:** (a) Einsatz mit acht Einheiten, Ansicht „Tabelle“,
900 px nach unten gescrollt → Neuladen. (b) Eigener Bogen, Schritt 3 mit neun
Personenkarten, Person 8 ausgefüllt (Bildlauf 1 901 px) → Neuladen →
„Fortsetzen“. (c) Karte 4 aufgeklappt → Neuladen.

**Beobachtung:** (a) Bildlauf vorher 2 017 px, nachher 0; die Tabellenansicht
bleibt erhalten. (b) „Fortsetzen“ öffnet Schritt 3 („3. Personal“), Bildlauf
0; Person 8 liegt 2 289 px weiter unten, der eingetippte Vorname „Jens“ ist
gespeichert. (c) Die Karte ist nach Neuladen wieder zugeklappt.

**Erwartung der Rolle:** Ich lande, wo ich war, oder die App sagt mir, wo es
weitergeht.

**Folge im Einsatz:** Nach jeder Unterbrechung mit Neuladen muss man die
Stelle in einer langen Liste neu suchen. Bei 30 Einheiten oder 15 Personen
kostet das Zeit und Aufmerksamkeit, die Daten sind aber da.

**Empfehlung:** Beim Wiederherstellen entweder die Bildlaufstelle bzw. die
zuletzt bearbeitete Karte/Person merken oder im Hinweis „Entwurf
wiederhergestellt“ nennen, was zuletzt bearbeitet wurde („Zuletzt: Person 8“).

**Nachprüfung:** Wie oben: Nach Neuladen steht die zuletzt bearbeitete Karte
oder Person im Bild.

### R14-S3 [P3] Karte wechselt beim Aufklappen die Marke „neu“ in „kürzlich eingetroffen“, während der Kasten oben weiter „3 neu“ zählt

**Priorität:** P3

**Kennzeichnung:** gemessen (Skript `i2.js`, 390 × 844).

**Fundstelle / Aufgabe:** Einsatz mit drei aufgenommenen Übungsbögen →
Karte „Nr. 1 THW Albstadt …“ aufklappen („▾“).

**Beobachtung:** Zugeklappt trägt jede Karte die Marke „neu“. Aufgeklappt
steht bei Nr. 1 stattdessen „kürzlich eingetroffen“; der Kasten oben meldet
unverändert „Neu seit der letzten Kenntnisnahme (3)“. Nach „Zuklappen“
(und Neuladen) steht wieder „neu“. Die Anzahl im Kasten ändert sich nie.

**Erwartung der Rolle:** Eine Marke hat eine Bedeutung. Wenn Aufklappen
„neu“ auflöst, will ich wissen, ob ich die Meldung damit zur Kenntnis genommen
habe; sonst soll „neu“ stehen bleiben.

**Folge im Einsatz:** Wer eine Karte zum Nachlesen aufklappt, sieht „neu“
verschwinden und kann annehmen, die Meldung sei abgehakt, obwohl der Kasten
sie noch als offen führt (Verwechslung zwischen „neu“ und „kürzlich“). Nichts
geht verloren.

**Empfehlung:** Beide Marken nebeneinander zeigen oder in der aufgeklappten
Karte „neu“ behalten und das Alter („eingetroffen 09:38“) zusätzlich nennen.

**Nachprüfung:** Karte aufklappen: Marke „neu“ bleibt, solange der Kasten die
Meldung zählt.

### R14-S4 [P3] Aufgeklappte Karte „Details“: Kontaktzeilen mit alleinstehendem „·“ und E-Mail-Adresse, die mitten im Wort umbricht

**Priorität:** P3

**Kennzeichnung:** gemessen (Skript `o3.js`, 390 × 844, Karte „Nr. 6 THW
Müllheim …“, „Details“).

**Fundstelle / Aufgabe:** Karte aufklappen → „Details“ → Block
„Zugehörigkeit“.

**Beobachtung:** Je Ebene (OV, RB, LV) stehen Name, Telefonnummer und
E-Mail in einer Zeile. Bei 390 px bricht die Zeile so, dass ein „·“ allein am
Zeilenanfang oder -ende steht („· OV-Muellheim@thw.de“) und die Adresse
„Poststelle.RSt_Freiburg@thw.de“ bei „thw.d“ / „e“ getrennt wird. Der
Absatz liest sich dadurch ungeordnet.

**Erwartung der Rolle:** Eine Rückrufnummer oder Adresse in ganzen Zeichen,
je Angabe eine Zeile.

**Folge im Einsatz:** Beim Abtippen oder Vorlesen einer Adresse am Funk wird
die zweite Hälfte leicht überlesen; kein Datenverlust, die Verknüpfungen
(`tel:`, `mailto:`) bleiben antippbar.

**Empfehlung:** Telefon und E-Mail je Ebene in eigene Zeilen setzen, Adressen
nur an „@“ oder „.“ trennen, kein „·“ am Zeilenrand.

**Nachprüfung:** Details einer Karte bei 360 und 390 px: Jede Angabe steht
in einer Zeile; keine Adresse bricht mitten im Wort.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Aufklappen einer Karte löst „neu“ auf, der Kasten
  oben zählt die Meldung weiter als offen (R14-S3).
- **Größtes Einsatzrisiko:** Nach Unterbrechung muss die zuletzt bearbeitete
  Stelle in langen Listen neu gesucht und ein per Zurück verlassener
  Notiztext neu getippt werden (R14-S1, R14-S2; beides ohne Datenverlust an
  Meldungen).
- **Top-Priorität für die nächste Iteration:** Zug und Auftrag/Notiz auch bei
  Browser-Zurück übernehmen (R14-S1), danach Wiedereinstieg an der zuletzt
  bearbeiteten Stelle (R14-S2).
