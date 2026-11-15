# Audit „Zerstörende Handlungen", Runde 14 (Löschen, Überschreiben, Statuswechsel)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Code-Stand
Commit `429c41a` (`main` nach Runde 13).

**Zählung: P0 0 · P1 0 · P2 2 · P3 2** (R14-D1 bis R14-D4).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`,
`docs/audits/runde-13/README.md`, `runde-12/README.md`, `runde-11/README.md` und der
Bericht `runde-13/zerstoerende-handlungen.md`. Die dort geführten bekannten Grenzen
(R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4, leere
Karten bei „Nur Stärke", Rückgängig für Meldungen überlebt das Neuladen nicht,
Tabellenzeilenhöhe bei 180 × 320, R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3,
R12-W3, R12-H3, R12-O2, R12-O4, R12-G3, R13-W1 Vergleichsbasis in Dialog und Quittung,
R13-W6, R13-H1) sind nicht erneut gemeldet.

## Prüfaufbau

Chromium über das globale `playwright`-Modul (`/opt/node22/lib/node_modules/playwright`),
`chromium.launch()` ohne Optionen, nichts installiert. `isMobile`/`hasTouch`, Locale
de-DE, Tipps als Touch-Tipp. Viewports 390 × 844 (durchgehend) und 360 × 640 (lange
Dialoge, Abstände). Je Szenario ein frischer Browserkontext. Zustände über die Bedienung
der App: Einsatz-Sammlung „Hochwasser Weser" anlegen, Übungsbögen aus
`examples/thw/` (Kopien außerhalb des Repositorys, `uebung: false`, Zeitraum und `stand`
auf heute) über „Bögen einlesen…" aufnehmen, eigener Bogen über „Aus Datei laden…".
Geräteuhr 26.10.2026. Kein Kamera-Scan, keine Handschuhe, keine nativen Builds, kein
Zweitgerät. Die Rückfragen haben eine kurze Tippsperre; Skripte haben darum vor dem
Bestätigen gewartet (die Sperre selbst ist gewollt und kein Befund).

Durchgespielt: Einheit entfernen (einzeln, zweimal hintereinander mit gestapeltem
Rückgängig), Aufteilen (mit allen Personen, mit vier Personen), Zusammenführen, Entfernen
von Stamm und von abgeteiltem Teil, Stärke ändern (leer, 0/0/0, 80 statt 8), Abrücken,
„Wieder anwesend", Rückgängig per Doppeltipp, Zeit „ändern" mit leerem Feld, Zug zuordnen
(einzeln und für alle Einheiten ohne Zug), Auftrag/Notiz überschreiben und leeren,
Verschieben in eine zweite Sammlung, Einsatz löschen, Papierkorb (Wiederherstellen bei
gleichnamiger Sammlung), „Beginn entfernen", „Zur Kenntnis genommen" mit nachfolgenden
Änderungen, doppelte und neuere Datei derselben Einheit, Nachtrag-Export, eigener Bogen
(Schließen, Verwerfen, „Neuen Bogen erstellen", „Aus Datei laden…", „Zuletzt geschlossenen
Bogen zurückholen", Person entfernen, „StAN-Sollplätze laden"), Vorlage mit gleichem
Namen, Absenderkarte leeren, Geräteschlüssel (mit und ohne Schlüssel), Zurück-Taste bei
offener Rückfrage, zweiter Tab im selben Profil.

Hinweis zum Prüfaufbau: Das Arbeitsverzeichnis `/tmp/claude-0/s` wurde von mehreren
Prüfläufen gemeinsam genutzt; dabei sind Skripte und Beispielkopien anderer Läufe
überschrieben bzw. gelöscht worden (die Beispielkopien sind aus dem Repository
wiederhergestellt). Auf die Befunde hat das keinen Einfluss; weitere Läufe sollten ein
eigenes Verzeichnis nehmen.

## Urteil

Die zerstörenden Handlungen sind auch in Runde 14 sehr gut gesichert. Fast jede
Löschung, Ersetzung und Statusänderung nennt Name, Zahl und Folge, die Rückfragen sind
mit einer kurzen Tippsperre gegen Doppeltippen geschützt, und wo ohne Rückfrage gehandelt
wird, steht eine Quittung mit „Rückgängig" am unteren Rand (bei gestapelten Entfernungen
mit dem Zusatz „davor noch 1 entfernt"). Ein Doppeltipp auf „Rückgängig" nimmt nur einen
Schritt zurück. Offen bleiben vier Ränder, keiner mit Datenverlust bei Fremddaten: die
Rückfrage zum Entfernen unterscheidet einen abgeteilten Trupp nicht von seiner
Stammeinheit (R14-D1), die Doppelzählungs-Prüfung nach dem Aufteilen greift beim
Einlesen von Dateien nicht (R14-D2), und zwei Handlungen hinterlassen keine eigene
Quittung (R14-D3, R14-D4). Alle Aufgaben ließen sich ohne fremde Hilfe erledigen.

## Behebungen aus Runde 13, geprüft

| Befund | Ergebnis |
| --- | --- |
| R13-D1 „Beginn entfernen" | hält. „Einsatzbeginn entfernen?" nennt den eingetragenen Wert („Eingetragen ist 08:47 Uhr, 26. Okt. 2026 … der Fernseher zeigt keine Dauer"), Knöpfe „Beginn entfernen" und „Beginn behalten" 332 × 44, Abstand 41 px; „Jetzt" und „Beginn entfernen" jetzt 28 px auseinander |
| R13-D2 Absenderkarte leeren | hält. Felder leeren und „Übernehmen" öffnet „Absenderangaben entfernen?"; danach „Absender: keine Angabe" |
| R13-D3 Aufteilen mit allen Personen | hält. Bei 11 von 11 steht „Beim Rest bliebe nichts übrig.", „Aufteilen" ist gesperrt; die Einheitenzahl bleibt unverändert |
| R13-D4 Vorlage ersetzen | hält. Die Rückfrage nennt neben Personen und Fahrzeugen Einheitstyp und Sofortbedarf („Einheitstyp: … → …; Sofortbedarf: 130 l Diesel … → 180 l Diesel …") und die drei Wege einzeln; Abstand der Knöpfe 12 px |
| R13-S1 Einsatz löschen, Rückgängig | hält. Nach „Rückgängig" steht kein Satz mehr, der den Einsatz im Papierkorb nennt; der Einsatz ist auf der Startseite wieder da |
| R12-D1 bis D3, R12-G1/G2 | halten (Vorlagen, Historie-Knöpfe, Geräteschlüssel, „Alle Daten löschen" gesperrt bis zum Haken) |
| Eigener Bogen | hält. „Bogen schließen?", „Neuen Bogen anfangen?", „Bogen aus Datei öffnen?", „Angefangenen Bogen verwerfen?" und „Geschlossenen Bogen zurückholen?" nennen den Namen; ist der Platz „Zuletzt geschlossener Bogen" belegt, sagen alle vier, dass der dort liegende Bogen (mit Stand, Personenzahl und Auftrag) endgültig gelöscht wird |
| Personal | hält. „Person entfernen" nennt bei der Ansprechperson, wer nachrückt und dass dann die Rückrufnummer fehlt; „StAN-Sollplätze laden?" nennt „11 eingetragene Namen gehen verloren" und bietet danach „Rückgängig" |
| Stärke ändern | hält. 0/0/0 und 0/3/80 führen in „Stimmt die Stärke?" mit Gegenüberstellung („mehr als das Dreifache"), leere Felder sperren „Stärke übernehmen" |
| Papierkorb, gleichnamige Sammlung | hält. „Zwei Sammlungen gleichen Namens" nennt Anlagezeit und Zahl der Meldungen beider |
| Mehrere Tabs | hält. Eine Aufnahme im ersten Tab erscheint im zweiten ohne Neuladen; kein gegenseitiges Überschreiben |
| Zurück-Taste bei offener Rückfrage | hält. Schließt die Rückfrage, die Einsatzansicht bleibt |

Ergänzend gemessen: Auftrag/Notiz leeren und Zug ändern schreiben die frühere Fassung in
die Historie („Auftrag/Notiz entfernt (war: …)"); abgerückt/„Wieder anwesend" sind mit
Quittung und „Rückgängig" versehen; Nachtrag-Knöpfe sind gesperrt, wenn nichts Neues da ist.

## Befunde

### R14-D1 [P2] „Meldung entfernen?" unterscheidet einen abgeteilten Trupp nicht von seiner Stammeinheit und nennt die Stärke nicht

**Kennzeichnung:** gemessen (Dialog- und Quittungstext, Kopfzahlen vor und nach dem Entfernen).

**Fundstelle / Aufgabe:** Einsatzansicht → Karte aufklappen → „Mehr…" → „Aufteilen…"
(Bezeichnung „Trupp 2", vier Personen) → danach bei einer der beiden Karten „Mehr…" →
„Entfernen"; 390 × 844.

**Beobachtung:** Nach dem Aufteilen stehen zwei Karten mit dem gleichen Namen: Nr. 1 „THW
Sinsheim Fachgruppe Wassergefahren (B)" (0 / 0 / 7 / 7) und Nr. 3 „… (B)" mit dem Zusatz
„Trupp 2" (0 / 3 / 1 / 4). Die Rückfrage beim Teil lautet nur: „„THW Sinsheim Fachgruppe
Wassergefahren (B)" (Stand 26.10.2026, 09:15) entfernen — samt Historie." Weder „Trupp 2"
noch die Nummer noch die Stärke (vier Personen, davon drei Unterführer) stehen darin; ein
Satz, dass diese Personen danach zu keiner Meldung gehören und „Zusammenführen…" der
sichere Weg wäre, fehlt. Dieselbe Rückfrage bei der Stammeinheit (Nr. 1) nennt ebenfalls
nur den Namen und „Nr. 2 rückt auf", nicht dass der Trupp stehen bleibt. Die Quittung nach
dem Entfernen des Teils: „Entfernt: Meldung Nr. 3 „THW Sinsheim Fachgruppe
Wassergefahren (B)"" — wieder ohne „Trupp 2". Gemessen: Kopf vorher 2 Einheiten / 21
Personen (7 + 4 + 10), danach 2 Einheiten / 17.

**Erwartung der Rolle:** Die Rückfrage nennt das, was auf der Karte steht: Nummer,
Zusatz „Trupp 2", Stärke („4 Personen"). Bei einem Teil der Hinweis, dass die Personen
sonst in der Lage fehlen („Zurück in die Einheit: „Zusammenführen…""). Die Zusammenführen-
Rückfrage nennt den Trupp mit Bezeichnung und Stärke; das Entfernen sollte es ebenso tun.

**Folge:** Wer in der Hektik die Karte mit dem gleichen Namen erwischt, bestätigt eine
Rückfrage, die für beide Karten wörtlich gleich lautet. Die Stärke der Lage fällt um die
abgeteilten Personen, ohne dass die Rückfrage das ankündigt. „Rückgängig" ist da, steht aber
nur, solange die App offen bleibt (bekannte Grenze), und die Quittung nennt wieder nur den
doppelten Namen. Wegen Rückgängig und der Karte vor dem Tipp P2, nicht höher.

**Empfehlung:** In Rückfrage und Quittung Nummer, Teilbezeichnung und Stärke nennen („Nr. 3
„THW Sinsheim … (B)", Teil „Trupp 2", 4 Personen"). Bei einem Teil den Satz „Die 4 Personen
zählen danach nirgends mehr" und den Verweis auf „Zusammenführen…"; bei einer Stammeinheit
mit stehenden Teilen die Zahl der Teile nennen.

**Nachprüfung:** Einheit aufteilen, den Teil entfernen: Rückfrage und Quittung nennen
„Trupp 2" und „4 Personen"; Stammeinheit entfernen: Rückfrage nennt den stehenden Trupp.

### R14-D2 [P2] Eine neuere Datei der aufgeteilten Einheit zählt die abgeteilten Personen doppelt — ohne Rückfrage und ohne Warnung (Lücke in der Behebung von R13-W1)

**Kennzeichnung:** gemessen (Kopfzahlen, Bedarfszeile, Quittungstexte vor und nach dem
Einlesen). Der Link- und Scan-Weg wurde nicht nachgestellt; für ihn nennt der Bericht
von Runde 13 die Rückfrage mit „ohne Trupp"-Weg.

**Fundstelle / Aufgabe:** Meldekopf → Einheit aufteilen („Trupp 2" mit vier Personen, bleibt
im Einsatz) → „Bögen einlesen…" → Datei derselben Einheit mit neuerem Stand (elf Personen,
enthält alle vier Personen des Trupps); 390 × 844.

**Beobachtung:** Vorher: 2 Einheiten, Gesamt 11 (Nr. 1: 7, Nr. 2 „Trupp 2": 4). Nach dem
Einlesen kommt kein Dialog. Die Statuszeile lautet „1 Bogen aufgenommen." und der Block
„Neu seit der letzten Kenntnisnahme" nennt „Folgemeldung 09:17: Stärke 7 → 11 (+4) ·
Verpflegung 7 Personen → 11 Personen". Danach: 2 Einheiten, 0 / 6 / 9 / **15**, „Verpflegung
15 · Unterbringung 15 Personen". Nr. 1 steht wieder mit 0 / 3 / 8 / 11, Nr. 2 „Trupp 2"
weiter mit 0 / 3 / 1 / 4. Ein Wort zu „abgeteilt", „doppelt" oder „stehen auch in der neuen
Meldung" erscheint nirgends auf der Seite. Die Prüfung aus Runde 13 (Rückfrage mit
„Als neue Fassung anhängen, ohne Trupp 2" und der Satz „… zählen doppelt" in der
Quittung) kommt damit auf diesem Weg nicht zum Zug. (Beim Lesen des Codes zur Klärung
gesehen: Der Stapelweg von „Bögen einlesen…" ruft die Prüfung nicht auf; geändert wurde
nichts.)

**Erwartung der Rolle:** Dieselbe Warnung wie bei Link und Scan: „Trupp 2 (4 Personen) ist
abgeteilt; … stehen auch in der neuen Meldung". Gerade das Einlesen einer Datei ist der
Alltagsweg (AirDrop, USB-Stick, Messenger — so nennt es die Startseite selbst).

**Folge:** Stärke, Verpflegung und Unterbringung der Lage sind um vier Personen
überzeichnet (15 statt 11), das Lageblatt trägt die Zahl auf Papier zum Stab. Die Quittung
„+4" liest sich wie eine echte Verstärkung. Der Fehler fällt nur auf, wer die Namen
vergleicht. Daten gehen nicht verloren, die Zahlen im Einsatzbild sind falsch; „Rückgängig"
für Meldungen gibt es nach dem Einlesen nicht. P2.

**Empfehlung:** Die Doppelungsprüfung auch im Stapelweg anwenden und im Satz der
Statuszeile nennen, mindestens als Warnung mit dem Weg „Zusammenführen…" oder „Trupp
entfernen"; besser dieselbe Rückfrage wie bei einer einzelnen Datei.

**Nachprüfung:** Einheit aufteilen, Datei mit neuerem Stand und denselben Namen über „Bögen
einlesen…" laden: Warnung oder Rückfrage nennt „Trupp 2" und die Namen; Gesamt bleibt 11
oder die Wahl wird abgefragt.

### R14-D3 [P3] „Zuordnen" setzt den Zug für alle Einheiten ohne Zug in einem Tipp, ohne Quittung; ein stehengebliebenes „Rückgängig" gehört dann zu einer älteren Handlung

**Kennzeichnung:** gemessen (Quittungsleiste, Kartentexte, Wirkung des „Rückgängig").

**Fundstelle / Aufgabe:** Meldekopf nach „Bögen einlesen…" (vier Einheiten) → Block „Neu
seit der letzten Kenntnisnahme" → Feld „Zug für 4 Einheiten ohne Zug:" → „Zuordnen"; ebenso
„Zug zuordnen" und „Auftrag/Notiz" an einer Karte.

**Beobachtung:** Mit „2.Zug" im Feld und „Zuordnen" tragen alle vier Karten sofort „2.Zug".
Es erscheint keine Quittung, kein „Rückgängig", die Zeile „Zug für … ohne Zug" verschwindet
samt Feld, und eine Sammelkorrektur gibt es nicht; ein Tippfehler („2.Zug" statt „2. Zug")
wird je Einheit einzeln über „Zug ändern" berichtigt (vier Mal aufklappen, tippen,
speichern). Beim Ändern von Zug, Auftrag oder Zeit an einer einzelnen Karte bleibt eine
ältere Quittung stehen: Nach „Zur Kenntnis genommen" und einem später falsch gesetzten Zug
zeigt die Leiste weiter „Zur Kenntnis genommen: 2 Einheiten — Rückgängig" (auch nach 8 s,
sie verschwindet nur mit ✕). Der Tipp darauf macht die Kenntnisnahme rückgängig („Neu
seit…" kommt zurück), der falsche Zug bleibt stehen. Die frühere Fassung von Zug und Auftrag
steht in der Historie der Einheit („09:21 Zug: 2. Zug", „Auftrag/Notiz entfernt (war: …)").

**Erwartung der Rolle:** Eine Handlung, die vier Karten auf einmal ändert, meldet sich mit
einer Quittung („Zug „2.Zug" für 4 Einheiten gesetzt") und lässt sich so zurücknehmen; ein
sichtbares „Rückgängig" gehört zur letzten Handlung.

**Folge:** Gering: ein falscher Zug verfälscht die Zwischensummen je Zug und das Lageblatt, die
Korrektur kostet Zeit. Wer „Rückgängig" für den Zug tippt, ändert stattdessen den Stand der
Kenntnisnahme. P3.

**Empfehlung:** Quittung mit Zahl der Einheiten und „Rückgängig" für „Zuordnen"; die
stehende Leiste durch jede neue Handlung ersetzen oder schließen.

**Nachprüfung:** „Zuordnen" tippen: Quittung nennt den Zug und die Zahl; „Rückgängig"
entfernt ihn bei allen. Danach Zug an einer Karte ändern: keine ältere Leiste mehr sichtbar.

### R14-D4 [P3] „Verschieben…": „Rückgängig" gibt es nur im Ergebnisdialog neben „Alles klar", danach fehlt im Ausgangs-Einsatz jede Spur

**Kennzeichnung:** gemessen (Dialogtext, Quittungsleiste und Seitentext nach „Alles klar").

**Fundstelle / Aufgabe:** Einsatzansicht „Hochwasser Weser" → Karte → „Mehr…" →
„Verschieben…" → Ziel „Bereitstellungsraum".

**Beobachtung:** Das Tippen auf den Zielnamen verschiebt sofort (die Rückfrage davor nennt
Einheit, Quelle und „die Lage verliert 11 Helfer"). Der Ergebnisdialog „Verschoben" bietet
„Rückgängig — zurück nach „Hochwasser Weser"" und „Alles klar". Nach „Alles klar" gibt es
keine Leiste mit „Rückgängig" und im Einsatz „Hochwasser Weser" keinen Satz, dass eine Einheit
verschoben wurde (Seitentext ohne „verschoben"); die Einheit fehlt nur in der Summe.

**Erwartung der Rolle:** Wie bei Entfernen und Abrücken eine Quittungsleiste, die bleibt,
bis etwas Neues kommt, oder ein Vermerk in der Einsatzansicht („1 Einheit nach
„Bereitstellungsraum" verschoben").

**Folge:** Wer den Dialog reflexhaft mit „Alles klar" schließt, kann die Handlung nur von
Hand zurückholen (Ziel-Einsatz öffnen, dort „Verschieben…"); wer später in „Hochwasser
Weser" die fehlende Einheit sucht, findet keinen Hinweis. Verloren geht nichts. P3.

**Empfehlung:** Rückgängig auch nach dem Schließen des Dialogs als Quittungsleiste, und
einen Vermerk in der Kopfzeile des Ausgangs-Einsatzes.

**Nachprüfung:** Einheit verschieben, „Alles klar" tippen: Leiste mit „Rückgängig" bzw.
Vermerk im Ausgangs-Einsatz.

## Nicht prüfbar / nicht geprüft

Kamera-Scan und Link-Weg (Rückfrage „Einheit ist bereits gemeldet" nach dem Aufteilen, siehe
R14-D2), Nahbereich-Weitergabe, echte Handschuhe, native Builds, ein zweites Gerät,
Sammel-PDF-Import mit abweichenden Fassungen (in Runde 13 geprüft, hier nicht wiederholt).
Der Ablauf von 30 Tagen im Papierkorb wurde nicht nachgestellt.

## Aufgabe geschafft

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Die Rückfrage zum Entfernen gilt für Stamm und abgeteilten Trupp wörtlich gleich, obwohl der Trupp Personen enthält, die sonst nirgends mehr zählen.
- **Größtes Einsatzrisiko:** Eine Datei mit neuerem Stand zählt die schon abgeteilten Personen doppelt, ohne dass die App es sagt, und die Zahl wandert auf das Lageblatt (R14-D2).
- **Top-Priorität für die nächste Iteration:** R14-D2, die Doppelungsprüfung für abgeteilte Trupps auch beim Einlesen von Dateien anwenden.
