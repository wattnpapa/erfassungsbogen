# Audit „Offline und Speicher" (Funkloch, Neustart ohne Netz, voller Speicher)

Stand: 27.09.2026 · Prüfer: Rollenaudit `thw-offline-resilience-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite build` + `vite preview`,
Service Worker aktiv), Zweig `claude/thw-reviewer-skills-dr76q1`, Commit
`27d734e`.

Reiner Prüfbericht, keine Codeänderung.

## Prüfaufbau

Chromium (Playwright), 360 × 640, `isMobile`/`hasTouch`, de-DE. Erstbesuch
online (Service Worker installiert, 108 Einträge im Cache), danach Netz
abgeschaltet und: Seite neu geladen, Entwurf fortgesetzt, Person ergänzt,
PDF erzeugt, Link geteilt, Scanner geöffnet (WebAssembly-Decoder),
Beispielbögen aufgerufen, Anleitung und drei Themenseiten geöffnet, einen
Bogen-Link empfangen; dann Netz zurück. Getrennt: dieselbe Meldung zweimal
aufnehmen (Unsicherheit, ob der Scan geklappt hat) und der Speicher am
Limit (localStorage bis auf 0 Byte gefüllt, dann Entwurf bearbeitet und in
einen Einsatz aufgenommen).

Die App hat keinen Server; „Synchronisation" heißt hier Übergabe per QR,
Link oder Datei. Nicht prüfbar: Erstbesuch ohne jedes Netz (dann gibt es
nichts zu laden — das ist keine Eigenschaft der App), Kamera-Scan, die
Update-Abfrage der Android-App gegen GitHub, Verhalten der nativen Builds.

## Urteil

Offline ist diese App zu Hause. Nach dem ersten Besuch läuft alles ohne
Netz: Neustart, Bearbeiten, PDF, QR-Code, Link, Scanner samt Decoder,
Anleitung, Themenseiten, sogar ein per Link eintreffender Bogen. Die
Statuszeile sagt ehrlich, was gilt („bleibt auf diesem Gerät"), und eine
versehentlich doppelt aufgenommene Meldung wird als „gleicher Inhalt"
erkannt und übersprungen. Zwei Dinge fallen aus dem Bild: Die Beispielbögen
werden bei Bedarf nachgeladen und reagieren offline gar nicht. Und wenn der
Gerätespeicher voll ist, behauptet die App „automatisch gespeichert", obwohl
nichts gespeichert wurde — und „In Einsatz aufnehmen" verwirft den Bogen
dann vollständig: nicht im Einsatz, nicht mehr als Entwurf, ohne Meldung.

## Befunde

### O1 [P0] Voller Speicher: „gespeichert" ohne Speichern, Aufnahme in den Einsatz verliert den Bogen

Fundstelle: Jeder Schritt (Statuszeile „✓ automatisch gespeichert · 20:55
Uhr — bleibt auf diesem Gerät"); Übersicht → „In Einsatz aufnehmen…".
Beobachtung: Mit vollem Speicher (0 Byte frei; hier 5 MB, was der übliche
Rahmen für localStorage ist) eine Person ergänzt: Die Statuszeile meldet
weiter „automatisch gespeichert", der Speicher enthält die Person nicht;
nach Neuladen ist sie weg. Danach den Bogen in den Einsatz aufgenommen:
unbehandelter Fehler in der Konsole („exceeded the quota"), keine Meldung im
Bild, die Einsatzliste enthält den Bogen nicht — und der Entwurf ist
gelöscht, weil die Aufnahme ihn wie vorgesehen „schließt". Nach dem Neuladen
gibt es weder Entwurf noch Meldung; die Startseite sieht aus wie nach einem
frischen Start.
Erwartung der Rolle: Wenn nicht gespeichert werden kann, sagt es die App —
und sie wirft nichts weg, was sie nicht sicher abgelegt hat.
Auswirkung im Einsatz: Ein Meldekopf-Tablet, das über Tage Bögen sammelt
(jede Meldung mit Signatur und Rohdaten, Historie, 30-Tage-Papierkorb),
erreicht das Limit im laufenden Betrieb. Ab da gehen Meldungen still
verloren, und die Statuszeile bestreitet es. Ein Bogen, den jemand vor Ort
eingetippt hat, ist nach „In Einsatz aufnehmen" weg — auf dem einzigen
Gerät, das ihn hatte. (Annahme zur Menge: 5 MB reichen für einige hundert
Meldungen; Papierkorb und Historie zählen mit.)
Empfehlung: Jeden Schreibfehler abfangen und sichtbar machen („Speichern
fehlgeschlagen — Speicher voll. Bogen bleibt geöffnet; Sicherung erstellen
oder Papierkorb leeren"); die Statuszeile nur dann „gespeichert" nennen,
wenn es stimmt; die Aufnahme in den Einsatz erst dann den Entwurf
schließen, wenn die Einsatzliste wirklich geschrieben ist; eine Anzeige
des belegten Speichers in der Datensicherung; ältere Papierkorb-Einträge
und Rohdaten automatisch räumen, bevor das Limit erreicht ist.
Verifikation: Speicher füllen, Person ergänzen — die Statuszeile muss den
Fehler nennen; „In Einsatz aufnehmen" muss scheitern, ohne den Entwurf zu
löschen.

### O2 [P2] Beispielbögen reagieren offline nicht

Fundstelle: Fußzeile „Beispielbögen" → Organisation → „Anzeigen" / „PDF" /
„Link".
Beobachtung: Der Dialog öffnet sich offline und listet alle 101 THW-Bögen;
„Anzeigen" tut nichts — kein Bogen, keine Fehlermeldung, der Dialog bleibt.
Die Bögen liegen als einzelne JSON-Dateien auf dem Server und gehören nicht
zum Offline-Cache (108 Einträge, keine JSON darunter).
Erwartung der Rolle: Was die App anbietet, geht auch offline — oder sie
sagt, dass es Netz braucht.
Auswirkung im Einsatz: Die Beispielbögen sind der Weg, den QR-Import zu
üben und eine Vorlage nach StAN zu ziehen; genau im Bereitstellungsraum
ohne Netz stehen sie nicht zur Verfügung, und niemand erfährt, warum.
Empfehlung: Beispielbögen mit in den Offline-Cache nehmen (rund 450
Dateien, kleine JSON) oder beim Öffnen ohne Netz sagen: „Beispielbögen
brauchen einmalig Netz — beim nächsten Aufruf mit Verbindung werden sie
gespeichert."
Verifikation: Offline einen Beispielbogen anzeigen — er muss erscheinen
oder eine Meldung den Grund nennen.

### O3 [P3] Die Rückfrage „bereits gemeldet" kommt vor der Gleichheitsprüfung

Fundstelle: Zweite Aufnahme derselben, unveränderten Meldung in denselben
Einsatz (Scan wiederholt, weil unklar war, ob er geklappt hat).
Beobachtung: Erst der Dialog „Einheit ist bereits gemeldet — Als neue Fassung
anhängen / Als eigene Einheit führen", dann nach der Wahl die Meldung
„Bereits vorhanden — übersprungen (gleicher Inhalt). Die Zeile in der Liste
ist quittiert." Ergebnis korrekt: keine Dublette, keine leere Historie.
Erwartung der Rolle: Bei gleichem Inhalt keine Frage — nur die Quittung.
Auswirkung im Einsatz: Ein überflüssiger Dialog pro Wiederholung; wer dort
„Als eigene Einheit führen" wählt, weil er die Frage falsch versteht, erzeugt
womöglich doch eine Dublette (nicht geprüft, ob die Gleichheitsprüfung auch
diesen Weg deckt).
Empfehlung: Gleichheit vor der Rückfrage prüfen und direkt quittieren.
Verifikation: Identische Meldung zweimal aufnehmen — nur die Quittung darf
erscheinen.

### O4 [P3] Kein Blick auf den Speicherstand

Fundstelle: Datensicherung, Papierkorb, Einsatzansicht.
Beobachtung: Nirgends steht, wie voll der Speicher ist oder wie viele
Meldungen, Historieneinträge und Papierkorb-Einträge liegen. „Alle Daten
löschen" zählt auf, was es gibt (Vorlagen, Einsätze, Bögen), aber nicht den
Platz.
Erwartung der Rolle: Eine Zeile „Belegt: 3,8 von 5 MB" in der
Datensicherung, damit man vor dem Einsatz aufräumt.
Auswirkung im Einsatz: O1 trifft ohne Vorwarnung.
Empfehlung: Speicherstand in der Datensicherung und im Papierkorb zeigen,
mit Hinweis auf den Weg zum Aufräumen (Sicherung erstellen, alte Einsätze
löschen, Papierkorb leeren).
Verifikation: Datensicherung öffnen — der Speicherstand muss lesbar sein.

## Was gut funktioniert und erhalten bleiben sollte

Nach dem ersten Besuch ist alles da: 108 Einträge im Cache, darunter alle
HTML-Seiten (Anleitung, Impressum, Datenschutz, 30 Themenseiten), die
Schriften und der WebAssembly-Decoder für den Scanner. Offline neu laden:
Startseite mit „Fortsetzen", Entwurf vollständig, Person ergänzen, PDF
erzeugen (Datei entstand), Link teilen (644 Zeichen), Scanner mit
Handscanner-Weg, Anleitung und Themenseiten alle mit Status 200. Ein
offline eintreffender Bogen-Link öffnet die App und den Bogen.

Die Startseite verspricht „Funktioniert komplett offline — alle Daten
bleiben auf diesem Gerät", die Statuszeile jedes Schritts sagt „bleibt auf
diesem Gerät": Es gibt keine Verwechslung zwischen „lokal" und „angekommen",
weil es keinen Server gibt, an dem etwas ankommen könnte. Angekommen ist
ein Bogen, wenn die Gegenstelle ihn gescannt hat — und das quittiert sie
sichtbar.

Wiederholte Aufnahme desselben Bogens wird am Inhalt erkannt und
übersprungen („gleicher Inhalt"); eine veränderte Fassung wird als
Folgemeldung mit Historie geführt. Duplikate durch Doppeltippen entstehen
nicht.

Der Themenwechsel, das Neuladen und das Zurückkehren des Netzes unterbrechen
nichts; nach dem Netz-Rückkehr-Neuladen steht „Entwurf vom 27.09.26, 20:51
Uhr wiederhergestellt".

## Abschluss

- Aufgabe geschafft: ja — offline arbeiten, übergeben und empfangen gelingt
  vollständig.
- Fremde Hilfe nötig: nein.
- Größtes Missverständnis: „automatisch gespeichert" wird auch dann
  angezeigt, wenn der Speicher voll ist und nichts gespeichert wurde.
- Größtes Einsatzrisiko: Bei vollem Speicher verwirft „In Einsatz aufnehmen"
  den Bogen ohne Meldung — er ist danach nirgends mehr.
- Top-Priorität für die nächste Iteration: Schreibfehler abfangen, ehrlich
  melden und den Entwurf erst nach erfolgreicher Ablage schließen (O1).
