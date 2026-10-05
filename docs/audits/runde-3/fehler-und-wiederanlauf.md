# Audit „Fehler und Wiederanlauf", Runde 3 (Bedienfehler provozieren, selbst korrigieren)

Stand: 04.10.2026 · Prüfer: Rollenaudit `thw-error-recovery-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/gifted-cray-ngieaz`, Commit 33ed426.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-2-Befunde.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, keine Kamera.
Jeder Lauf hatte einen eigenen Browser-Kontext mit leerem Speicher. Die
Zustände habe ich über `localStorage`-Seeds aus `examples/thw/` hergestellt,
alle mit `uebung: false`:

- `eeb.entwurf.v1`: eigener Bogen 003 Crailsheim FGr W (A) oder 016 Bamberg
  FGr W (A), offen in Schritt 1 bis 5. Für die Rückhol-Fälle zusätzlich
  `eeb.entwurf.ersetzt.v1` mit 005 Haßmersheim.
- `eeb.einsaetze.v1`: Sammlung „Hochwasser Jagst" (Einsatz) mit 003, 005,
  012 und 014, dazu „Übung Regnitz" (Übung) mit 016 und 018.

Den QR-Weg habe ich durch den inhaltsgleichen Link ersetzt („Weitere Formate →
Link teilen", `navigator.share` gestubbt). Dateien kamen über „Aus Datei
laden…" und „Bögen einlesen…". Prüfdateien: leere Datei, eine Bilddatei ohne
Bogen, eine CSV-Liste, eine nach 1 500 Byte abgeschnittene Bogen-JSON, eine
fremde JSON und gültige Bögen. Für den vollen Speicher habe ich
`Storage.prototype.setItem` gestubbt: Jede Schreibung unter `eeb.*`, die
einen Wert neu anlegt oder vergrößert, wirft `QuotaExceededError`. Zwei
Fenster habe ich als zwei Seiten im selben Kontext nachgestellt.

Getestet habe ich zuerst ohne Blick in frühere Berichte. Den Runde-2-Bericht,
die Tabelle „Stand der Behebung" und danach die vorliegenden Runde-3-Berichte
habe ich erst nach den Tests gelesen.

Rolle: Helfer, der normale Fehler macht und danach selbst weiterkommen will.
Szenarien, jeweils als ganzer Ablauf:

1. **Eigener Bogen mit Fehlgriffen:** Neuer Bogen ohne Eingaben bis zur
   Übersicht durchgetippt. Zeitraum „bis" vor „von", Jahr 2062. Person
   entfernt, zwischen „Nur Stärke" und „Personal vollständig erfassen" hin
   und her.
2. **Unterbrechen:** Neuladen mitten im Tippen, Browser-Zurück im
   Assistenten, „Fortsetzen", „Verwerfen" und „Neuen Bogen erstellen" bei
   offenem Entwurf, „Zuletzt verdrängten Bogen zurückholen". Derselbe Entwurf
   in zwei Fenstern.
3. **Meldekopf mit Fehlgriffen:** „Einheit manuell erfassen…" ohne jede
   Eingabe übernommen. Doppeltipp auf „In Einsatz übernehmen". Eine schon
   gemeldete Einheit noch einmal nur mit Name und Typ erfasst, danach die
   Fassung verworfen. Dreimal eine Erfassung angefangen und über „‹ Einsatz"
   abgebrochen, einmal neu geladen. Abrücken, Entfernen, Verschieben in die
   Übung. Eintreffzeit zehn Tage in die Zukunft „korrigiert", danach
   abgerückt. Einsatz gelöscht, „Alle Daten löschen" geöffnet.
4. **Falscher Kontext:** Bei offenem eigenem Entwurf einen abgeschnittenen,
   einen um ein Zeichen verfälschten und einen vollständigen Link geöffnet.
   Alle Prüfdateien über „Aus Datei laden…", gemischte Stapel über „Bögen
   einlesen…", dieselbe Datei zweimal.
5. **Speicher voll:** Tippen im Assistenten, „In Einsatz-Sammlung ablegen…",
   danach QR-Code und PDF als Rettungsweg.

Nicht prüfbar: Kamera-Scan mit echtem Bild, Handscanner,
Nahbereichs-Weitergabe, echtes Teilen, Geräte-Zurück der nativen Builds,
Bildschirmtastatur. Einen echt vollen Speicher habe ich nicht erzeugt, nur
den Stub oben. Die Datums-Uhrzeit-Felder zeigt Chromium im Headless-Betrieb
im US-Format. Das ist ein Prüfartefakt und kein Befund.

## Urteil

Die großen Lücken aus Runde 2 sind geschlossen. Eine abgebrochene
Erfassung am Meldekopf fragt jetzt „fortsetzen" oder „verwerfen". Der eigene
Bogen blieb nach drei Abbrüchen und einem Neuladen auf dem Rückholplatz, und
die Rückfrage sagt genau das. Nach dem Neuladen steht die Erfassung wieder
in ihrem Einsatz. Reine Sollplätze lösen „Stärke nicht gezählt" aus.
Dateifehler kommen in Alltagssprache mit nächstem Schritt. Fast jede
Handlung in der Sammlung hat einen Rückweg: „Rückgängig" nach Abrücken,
Entfernen und Fassung verwerfen, „Wieder anwesend", Papierkorb. Neuladen und
Browser-Zurück verlieren nichts.

Die Reibung liegt jetzt an Rändern, an denen etwas scheitert, nachdem der
Helfer schon zugestimmt hat. Bei vollem Speicher empfiehlt die App „Bogen
übergeben (PDF)". Auf einem Gerät, das noch nie einen Bogen übergeben hat,
scheitern genau dieser Weg und der QR-Code mit englischem Programmtext.
„Aus Datei laden…" fragt vor dem Lesen der Datei, ob der offene Bogen
weichen darf. Ist die Datei unbrauchbar, ist der Bogen vom Rückholplatz
trotzdem gelöscht. Kleinere Stellen: Eine ganz leere Erfassung lässt sich als
Einheit „THW" in die Lage übernehmen. Beim Einlesen eines gemischten Stapels
verdeckt die Fehlerzeile die Erfolgsmeldung. Eintreff- und Abrückzeiten
werden nicht auf Plausibilität geprüft.

Den eigenen Bogen und die Meldekopf-Aufgaben schafft der Helfer ohne
fremde Hilfe. Der volle Speicher auf einem frischen Gerät ist eine Sackgasse.

## Befunde

### R3-E1 [P1] Speicher voll, noch kein Geräteschlüssel: QR-Code und PDF scheitern mit Programmtext, der empfohlene Rettungsweg ist zu (neu)

**Priorität:** P1

**Kennzeichnung:** gemessen (Quota-Stub, siehe Prüfaufbau).

**Fundstelle / Aufgabe:** Eigener Bogen 016 Bamberg in Schritt 5, kein
`eeb.geraeteschluessel.v1` im Speicher, Speicher voll → „Zur Übersicht" →
„Bogen übergeben…" → „PDF erzeugen". Code:
`src/app/geraete-schluessel.ts`, `geraeteSchluesselSicherstellen()`.
Der `setItem`-Aufruf ist nicht abgefangen.

**Beobachtung:**

- Beim Tippen im Assistenten erscheint korrekt: „⚠ Nicht gespeichert — der
  Speicher dieses Geräts ist voll. Der Bogen bleibt geöffnet; bitte jetzt
  ‚Bogen übergeben' (PDF) oder … Sicherung erstellen."
- In der Gesamtübersicht steht statt des QR-Codes in Rot: „QR-Code: Failed
  to execute 'setItem' on 'Storage': Setting the value of
  'eeb.geraeteschluessel.v1' exceeded the quota."
- Im Dialog „Bogen übergeben" ist „QR-Code im Vollbild zeigen" ausgegraut.
  „PDF erzeugen" lädt nichts herunter. Unten im Dialog steht derselbe Text
  mit „PDF: Failed to execute 'setItem' …".
- Protokolliert: Der Entwurf wird geschrieben (`ok eeb.entwurf.v1`), danach
  scheitert nur das erstmalige Anlegen des Geräteschlüssels.
- Hat das Gerät schon einmal signiert, liegt der Schlüssel vor und das
  Problem tritt nicht auf. Betroffen sind frische Geräte und Geräte nach
  „Geräteschlüssel neu erzeugen".

**Erwartung der Rolle:** Wenn die App mir sagt „jetzt PDF erzeugen", dann
funktioniert das PDF. Notfalls ohne Siegel, aber mit dem Bogen.

**Auswirkung im Einsatz:** Gerade wenn der Speicher voll ist, ist das PDF
der letzte Weg, die Eingaben vom Gerät zu bekommen. Der Helfer liest
englischen Programmtext, der QR-Knopf ist grau, und es bleibt nur das
Abschreiben auf Papier. Wer den Hinweis nicht versteht, schließt die App,
und der nicht gespeicherte Stand ist weg.

**Empfehlung:** Den fehlenden Schlüssel nicht zur Bedingung der Übergabe
machen. Kann er nicht gespeichert werden, unsigniert übergeben oder einen
nur für diese Sitzung gültigen Schlüssel verwenden und das am Code sagen.
Programmtext nie anzeigen. Die Meldung „Speicher voll" sollte einen Weg
nennen, der in diesem Zustand sicher funktioniert.

**Nachprüfung:** Frisches Profil, Bogen ausfüllen, danach jede vergrößernde
Schreibung unter `eeb.*` scheitern lassen. QR-Code und PDF müssen entstehen,
die Meldung muss deutsch sein.

### R3-E2 [P1] „Aus Datei laden…" räumt den Rückholplatz, bevor die Datei gelesen ist; bei unbrauchbarer Datei ist der dort liegende Bogen umsonst gelöscht (neu)

**Priorität:** P1

**Kennzeichnung:** gemessen (Speicher vor und nach jedem Versuch
ausgelesen).

**Fundstelle / Aufgabe:** Startseite mit eigenem Entwurf 016 Bamberg und
Rückholplatz 005 Haßmersheim → „Aus Datei laden…" → abgeschnittene JSON
bzw. Bilddatei ohne Bogen. Code: `src/app/app.tsx`. Dort fragt
`darfBogenErsetzen({ titel: "Bogen aus Datei öffnen?" … })` vor dem Lesen
und verdrängt den Bogen mit `merkeVerdraengt`.

**Beobachtung:**

- Die Rückfrage kommt sofort nach der Dateiwahl, bei allen sieben
  Prüfdateien gleich, auch bei der leeren Datei, der CSV und dem Bild: „Der
  angefangene Bogen ‚THW Bamberg …' wird durch den Bogen aus der Datei
  ersetzt. … Der dort bisher liegende Bogen ‚THW Haßmersheim …' (Stand
  04.10.26, 18:41 Uhr) wird dabei endgültig gelöscht."
- Nach „Datei öffnen" kommt die richtige Fehlermeldung („‚abgeschnitten.json‘
  ist beschädigt oder unvollständig …" bzw. „‚foto.png‘ stammt nicht aus
  dieser App …"). Der offene Bogen bleibt Bamberg.
- Speicher vorher: `entwurf: Bamberg`, `ersetzt: Haßmersheim`. Nachher:
  `entwurf: Bamberg`, `ersetzt: Bamberg`. Haßmersheim ist in keinem Schlüssel
  mehr. Auf der Startseite steht „Zuletzt verdrängter Bogen" mit einer Kopie
  des offenen Bogens.
- Ohne belegten Rückholplatz geht nichts verloren, die Kopie ist dann nur
  irreführend.

**Erwartung der Rolle:** Ich habe zugestimmt, den alten Bogen für die neue
Datei aufzugeben. Öffnet sich die Datei nicht, ist nichts passiert. Und
wenn die Datei gar kein Bogen ist, fragt mich die App gar nicht erst.

**Auswirkung im Einsatz:** Auf dem Rückholplatz liegt typischerweise der
eigene Bogen, nachdem ein fremder Link oder Scan geöffnet wurde. Der Helfer
versucht, eine per Messenger halb angekommene Datei zu öffnen. Die Datei
scheitert, und der eigene Bogen ist weg, ohne dass etwas Neues geöffnet
wurde. Die Startseite zeigt danach zweimal denselben Bogen und verdeckt den
Verlust.

**Empfehlung:** Erst die Datei lesen und prüfen, dann fragen und verdrängen.
Eine unbrauchbare Datei meldet sich ohne Rückfrage und lässt beide Plätze
unberührt. Denselben Bogen nie als Kopie auf den Rückholplatz legen.

**Nachprüfung:** Entwurf A, Rückholplatz B, dann eine abgeschnittene JSON und
eine Bilddatei laden. Keine Rückfrage, Fehlermeldung, danach A offen und B
zurückholbar.

### R3-E3 [P2] Ganz leere Erfassung lässt sich übernehmen und steht als Einheit „THW" in der Lage (neu; Umfeld R2-E2)

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Sammlung „Hochwasser Jagst" (4 Einheiten) →
„Einheit manuell erfassen…" → ohne jede Eingabe „In Einsatz übernehmen".
Code: `src/app/app.tsx`, `erfassungUebernehmen()`. Geprüft wird nur
`sollstaerkeFreigeben`, ein leerer Bogen fällt nicht darunter.

**Beobachtung:** Keine Rückfrage. Der Hinweis „⚠ Zugehörigkeit: Der Name der
eigenen Einheit (unterste Ebene) fehlt." steht in Schritt 1, sperrt aber
nicht. Die Quittung lautet „Meldung von ‚THW' aufgenommen." Der Kopf zählt
„5 Einheiten", die Liste „Einheiten (5 gemeldet · 5 zählend)", die neue Karte
heißt „Nr. 5 THW" mit Stärke 0. Ein „Rückgängig" gibt es nicht. Entfernen
geht über „Mehr… → Entfernen".

**Erwartung der Rolle:** Ein versehentlicher Tipp auf „In Einsatz
übernehmen" direkt nach dem Öffnen legt keine namenlose Einheit an. Wenn
doch, sagt die App, dass Name und Stärke fehlen.

**Auswirkung im Einsatz:** Die Einheitenzahl in Lage, Lageblatt und Excel
ist um eins zu hoch. Die Karte „THW" lässt sich keiner Einheit zuordnen,
und niemand weiß, ob sie eine echte, schlecht erfasste Meldung ist.

**Empfehlung:** Ohne Name der Einheit nicht übernehmen, sondern zum Feld
springen. Mindestens dieselbe Rückfrage wie bei der Sollstärke („Name und
Stärke fehlen") zeigen und nach der Übernahme „Rückgängig" anbieten.

**Nachprüfung:** Erfassung öffnen, sofort übernehmen: Es darf keine Karte
entstehen, oder erst nach einer Rückfrage, die das Fehlende nennt.

### R3-E4 [P2] „Bögen einlesen…" mit gemischtem Stapel: Die Fehlerzeile verdrängt die Erfolgsmeldung, die Stapel-Quittung meldet „0 Bögen aufgenommen" (neu; Lage der Meldung siehe R3-L1)

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Einsatzansicht → „Bögen einlesen…" mit mehreren
Dateien zugleich. Code: `src/app/app.tsx`, `importiereBoegen()` setzt
Fehler und Meldung. Die Anzeige darunter zeigt nur `{fehler || meldung}`.

**Beobachtung:**

- Gültiger Bogen (Schwabach) und abgeschnittene JSON zusammen: Der Kopf
  springt auf „5 Einheiten“, Nr. 5 Schwabach steht in der Liste. Die einzige
  Rückmeldung ist „‚abgeschnitten.json‘ ist beschädigt oder unvollständig …".
  „1 Bogen aufgenommen." erscheint nicht. Mit dem Schwabach-Bogen allein
  erscheint es.
- Gültige JSON (Hilpoltstein, ein Übungsbogen), abgeschnittene JSON und eine
  Bilddatei zusammen: Die Fehlerzeile nennt die JSON, darunter steht der
  Kasten „Stapel eingelesen — 1 Bild gelesen — 0 Bögen aufgenommen. foto.png:
  Kein QR-Code im Bild gefunden." Die Hilpoltstein-Meldung wurde aber
  aufgenommen (Speicher: 5 Einträge). Nur oben steht „1 Übungsmeldung nicht
  gezählt — anzeigen".
- Dieselbe Datei noch einmal: „0 Bögen aufgenommen, 1 bereits vorhanden."
  Das ist richtig.

**Erwartung der Rolle:** Nach dem Einlesen steht eine Zeile, die sagt,
welche Dateien angekommen sind und welche nicht.

**Auswirkung im Einsatz:** Der Helfer sieht nur den Fehler oder „0 Bögen
aufgenommen" und liest den ganzen Stapel noch einmal ein. Oder er fordert
beim Absender Bögen nach, die längst in der Lage stehen. Die Dublettenprüfung
fängt das doppelte Einlesen ab, aber Zeit und Funkverkehr sind verloren.

**Empfehlung:** Eine gemeinsame Quittung je Stapel: „2 Dateien aufgenommen,
1 beschädigt (Name), 1 Bild ohne Code". Erfolgs- und Fehlerzeile nicht
gegeneinander ausspielen. Die Bild-Quittung soll die Dateien mitzählen oder
klar „von den Bildern" sagen.

**Nachprüfung:** Ein gültiger Bogen plus eine kaputte Datei: Beide Ergebnisse
müssen in einer Rückmeldung stehen. Gemischt mit Bild: Keine Zeile darf „0
Bögen aufgenommen" sagen, wenn ein Bogen aufgenommen wurde.

### R3-E5 [P2] Eintreff- und Abrückzeit: Zukunft und „abgerückt vor eingetroffen" gehen ohne Hinweis durch (Rest von R2-E4)

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Karte Crailsheim → „ändern" an „eingetroffen" →
14.10.2026, 18:22 (zehn Tage nach dem Prüftag) → „Speichern" → „Abrücken".
Code: `src/app/einsaetze-ui.tsx`, `zeitSpeichern()` ohne Plausibilitätsprüfung.

**Beobachtung:** Keine Rückfrage, kein Hinweis. Die Karte zeigt „Nr. 1 THW
Crailsheim … kürzlich eingetroffen" und „eingetroffen 14.10.2026, 18:22".
Nach dem Abrücken: „eingetroffen 14.10.2026, 18:22 ändern · abgerückt
04.10.2026, 20:39". Ein geleertes Feld schließt mit „Speichern" wortlos
und ändert nichts. Die Behebungstabelle zu R2-E4 nennt diesen Rest selbst.

**Erwartung der Rolle:** Ein Tag- oder Monatsdreher beim Nachtragen vom
Meldeblock fällt auf, wenn die Zeit in der Zukunft liegt oder das Abrücken
vor dem Eintreffen.

**Auswirkung im Einsatz:** Falsche Zeiten landen in Lageblatt, CSV, Excel
und in den „Vermerken der Führungsstelle". Die Marke „kürzlich
eingetroffen" und die Sortierung „Eintreffzeit (neueste zuerst)" sind für
diese Einheit tagelang falsch. Später, beim Einsatznachweis, lässt sich die
richtige Zeit nicht mehr rekonstruieren.

**Empfehlung:** Nicht sperrende Rückfrage bei Zeiten mehr als etwa 15
Minuten in der Zukunft und bei Abrücken vor Eintreffen, wie sie die
Nacherfassung schon kennt („eine Viertelstunde in der Zukunft, ist gestern
gemeint").

**Nachprüfung:** Eintreffzeit morgen setzen, danach abrücken: Beide Male muss
ein „stimmt das?" erscheinen.

### R3-E6 [P3] „Verschieben…" von der Einsatz- in die Übungssammlung ohne Hinweis auf die Folge, ohne „Rückgängig" (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Karte Crailsheim in „Hochwasser Jagst" (Einsatz) →
„Mehr…" → „Verschieben…" → „Übung Regnitz".

**Beobachtung:** Der Dialog nennt das Ziel als großen Knopf „Übung Regnitz".
Die Art steht nur klein darunter („Übung · angelegt 4.10.2026"). Ein Tipp
verschiebt sofort, die Quittung „Verschoben — … liegt jetzt in ‚Übung
Regnitz'" hat nur „Alles klar". Der Einsatz fällt von 54 auf 42 Helfer.
Zurück geht es nur über die Übungssammlung und noch einmal „Verschieben…".

**Erwartung der Rolle:** Wenn eine echte Einheit durch meinen Fehlgriff aus
der Lage verschwindet, sagt die App das und lässt mich mit einem Tipp
zurück.

**Auswirkung im Einsatz:** Bei zwei Sammlungen auf dem Gerät (Übung vom
Vortag, laufender Einsatz) verschwindet eine Einheit aus der Lage. Der
Fehler fällt erst auf, wenn die Summe nicht stimmt.

**Empfehlung:** Bei einem Wechsel zwischen Einsatz und Übung den Satz
„zählt dann nicht mehr in die Lage ‚Hochwasser Jagst'" zeigen. Die Quittung
mit „Rückgängig" ausstatten wie bei Abrücken und Entfernen.

**Nachprüfung:** Einheit aus einem Einsatz in eine Übung verschieben: Der
Dialog nennt die Folge, die Quittung bietet „Rückgängig".

### R3-E7 [P3] Ein Jahresdreher im Zeitraum erzeugt drei Hinweise, einer davon falsch (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Schritt 2, „Zeitraum von" 16.07.2062, „bis"
10.07.2026. Code: `src/app/hilfen.ts`, `pruefpunkte()`. Der Hinweis „ist
vorbei" prüft nur `zeitraumBis < heute`.

**Beobachtung:** Am Feld und in der Übersicht stehen nacheinander
„Einsatzzeitraum 16.07.2062 – 10.07.2026 ist vorbei — gilt dieser Bogen noch
für den aktuellen Einsatz? …", „‚bis' liegt vor ‚von'." und „… liegt mehr
als ein Jahr entfernt — Tippfehler im Jahr?". Die Übersicht zählt daraus 3
von 5 offenen Punkten.

**Erwartung der Rolle:** Ein Tippfehler, ein Hinweis, und der zeigt auf das
falsche Feld.

**Auswirkung im Einsatz:** „Ist vorbei" für ein Datum im Jahr 2062 lenkt auf
die falsche Fährte („Bogen neu anfangen?"). Drei Zeilen für einen Fehler
verdrängen andere offene Punkte aus dem Blick.

**Empfehlung:** Bei „bis vor von" die beiden anderen Hinweise unterdrücken
oder zu einem zusammenfassen, der das verdächtige Jahr nennt.

**Nachprüfung:** Dieselbe Eingabe: genau ein Hinweis, der 2062 nennt.

## Bestätigt aus anderen Runde-3-Berichten

Unabhängig beobachtet und hier nicht noch einmal gezählt:

- **R3-L1 [P2]** Rückmeldung nach „Bögen einlesen…" steht weit unter dem
  Bild. Gemessen: Fehlerzeile bei scrollY 2 735 von 4 483 px. Der Hinweis
  „Angefangene Erfassung für diesen Einsatz … Weiter erfassen" steht nach
  „‹ Einsatz" ebenso bei 2 741 px. Der Inhalt der Meldung ist R3-E4.
- **R3-A1 [P1]** Dieselbe Einheit noch einmal manuell nur mit Name und Typ
  erfasst, „Als Sollstärke ablegen" → „Als neue Fassung anhängen": Die Karte
  meldet „3 Fahrzeuge dazu · 3 Fahrzeuge abgemeldet", Ruhezeit und Kraftstoff
  der Einheit fallen weg. Zurück kam ich über „Historie → Fassung
  verwerfen…" mit Rückfrage und „Rückgängig".
- **R3-H3 [P2]** Nach „Link teilen" stand in der Übersicht „Übergeben 20:40
  Uhr — seitdem unverändert". Ob die Gegenstelle etwas bekam, weiß die App
  nicht.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Abgebrochene Erfassung:** „Einheit manuell erfassen…" bei angefangener
  Erfassung fragt „Diese Erfassung fortsetzen / Verwerfen und neue Einheit
  erfassen" und sagt „Dein eigener Bogen ‚THW Bamberg …' bleibt auf der
  Startseite zurückholbar". Nach drei Abbrüchen (Ansbach, Fürth, Erlangen)
  und einem Neuladen lag Bamberg weiter auf dem Rückholplatz.
- **Neuladen:** Ein Ortsname, der beim Neuladen noch nicht fertig getippt war,
  steht danach im Entwurf. Die Startseite sagt „Entwurf vom … wiederhergestellt". „Fortsetzen" öffnet den zuletzt
  offenen Schritt. Eine Erfassung kommt nach dem Neuladen in ihrem Einsatz
  zurück.
- **Browser-Zurück** geht im Assistenten einen Schritt zurück und verlässt
  die App nicht.
- **Leere Schritte** sperren nicht. „Weiter" geht, die Schrittleiste zeigt
  „offen", die Übersicht listet „3 offene Punkte … antippen zum Beheben".
- **Rückwege in der Sammlung:** „Rückgängig" nach Person entfernen, Abrücken,
  Meldung entfernen und Fassung verwerfen. „Wieder anwesend" an der
  abgerückten Karte. Einsatz löschen legt in den Papierkorb (30 Tage, mit
  „Rückgängig"). „Alle Daten löschen" zählt auf, was verloren geht, und
  verlangt eine Eingabe.
- **Rückfragen mit Inhalt:** „Nur die Stärke melden?" nennt die Zahl der
  Personen und die Startstärke. „Einheit ist bereits gemeldet" bietet „neue
  Fassung" oder „eigene Einheit". „Stärke nicht gezählt" vor reinen
  Sollplätzen. „Fassung verwerfen?" nennt, welcher Stand danach gilt.
- **Doppeltipp** auf „In Einsatz übernehmen" öffnet genau eine Rückfrage
  und legt genau eine Meldung an. Dieselbe Datei zweimal: „1 bereits
  vorhanden".
- **Links:** Abgeschnittener oder um ein Zeichen verfälschter Link: „Der
  geöffnete Link enthält keinen gültigen Erfassungsbogen." Der eigene Entwurf
  bleibt unberührt. Der gültige Link fragt vor dem Ersetzen und nennt den
  Rückholplatz.
- **Dateifehler** in Alltagssprache mit nächstem Schritt („beschädigt oder
  unvollständig … beim Absender neu anfordern oder den QR-Code scannen",
  „stammt nicht aus dieser App").
- **Zwei Fenster:** „⚠ Dieser Bogen wurde in einem anderen Fenster geändert.
  Eingaben hier werden erst wieder gespeichert, wenn du entscheidest." mit
  „Stand aus dem anderen Fenster laden". Kein stilles Überschreiben.
- **Speicher voll beim Tippen und Ablegen:** Die Speicherzeile meldet „Nicht
  gespeichert" mit letztem gesichertem Stand. „In Einsatz-Sammlung
  ablegen…" zeigt „Speichern fehlgeschlagen — … Platz schafft nur Löschen"
  im Dialog, die Sammlung bleibt unverändert (4 Einträge).
- **Plausibilität im Bogen:** „bis" vor „von", Jahr mehr als ein Jahr
  entfernt, doppeltes Kennzeichen und zu wenige Sitzplätze werden in der
  Übersicht genannt.

## Abschluss

- **Aufgabe geschafft:** eigener Bogen: ja. Meldekopf: ja. Rettung bei vollem
  Speicher auf einem frischen Gerät: nein (R3-E1).
- **Fremde Hilfe nötig:** nein, außer bei R3-E1.
- **Größtes Missverständnis:** „Datei öffnen" in der Rückfrage klingt nach
  „wenn die Datei aufgeht". Gelöscht wird aber schon vorher (R3-E2).
- **Größtes Einsatzrisiko:** Bei vollem Speicher fällt der einzige
  empfohlene Ausweg, PDF oder QR-Code, mit Programmtext aus (R3-E1).
- **Top-Priorität für die nächste Iteration:** Übergabe und Datei-Öffnen so
  ordnen, dass ein Scheitern nichts kostet: Schlüsselfehler abfangen, Datei
  erst prüfen, dann verdrängen (R3-E1, R3-E2).

## Abgleich mit Runde 2

Grundlage: [../runde-2/fehler-und-wiederanlauf.md](../runde-2/fehler-und-wiederanlauf.md)
und [../runde-2/README.md → Stand der Behebung](../runde-2/README.md#stand-der-behebung).

| Runde-2-Befund | Bewertung Runde 3 | Beobachtung |
| --- | --- | --- |
| R2-E1 Abgebrochene Erfassung verdrängt eigenen Bogen (P0) | hält | Drei Abbrüche über „‹ Einsatz", einmal „Verwerfen und neue Einheit erfassen", ein Neuladen: Speicher zeigt `entwurf: Erlangen (fremd)`, `ersetzt: Bamberg`. Die Rückfrage nennt den eigenen Bogen als zurückholbar, und das stimmt. Neuer, anderer Weg zum Verlust des Rückholplatzes: R3-E2. Der Hinweis „Angefangene Erfassung … Weiter erfassen" steht weiter unten auf der Seite (2 741 px). Die Rückfrage am Knopf fängt das ab. |
| R2-E2 Sollstärke als Meldung (P1) | hält | „Stärke nicht gezählt — … nur die Sollplätze nach StAN (Stärke 0 / 3 / 9 / 12, 3 Fahrzeuge)" mit „Stärke jetzt eintragen / Als Sollstärke ablegen". Die Karte trägt „Sollstärke, nicht gemeldet". Lücke daneben: Die ganz leere Erfassung fragt nicht (R3-E3). |
| R2-E3 Neuladen in der Einsatz-Erfassung (P2) | hält | Nach dem Neuladen öffnet die Einsatzansicht mit „Angefangene Erfassung für diesen Einsatz: ‚THW Ansbach'. Weiter erfassen". Die Marke „Aufnahme für: Hochwasser Jagst" und „In Einsatz übernehmen" sind in der Erfassung vorhanden. |
| R2-E4 Zahlendreher (P2) | weitgehend | Gemessen: Jahr 2062, „bis" vor „von", doppeltes Kennzeichen und Sitzplätze. Rufnummer/E-Mail/Namen aus Ziffern nur im Code (`hilfen.ts`) gesehen, nicht eingegeben. Offen wie in der Behebungstabelle vermerkt: Eintreff-/Abrückzeit in der Zukunft (R3-E5). Neu: dreifacher Hinweis mit falschem „ist vorbei" (R3-E7). |
| R2-E5 Programmtext bei Dateifehlern (P2) | hält, mit Ausnahme | Alle Datei-Wege melden sich deutsch mit nächstem Schritt. Programmtext erscheint aber bei vollem Speicher an QR-Code und PDF (R3-E1). Die Meldung der vorigen Handlung stand beim Einlesen nicht mehr daneben. Dafür verdrängt jetzt der Fehler die Erfolgsmeldung desselben Stapels (R3-E4). |
| R2-E6 Stille Überschreibungen (P3) | nicht nachgeprüft | Einsatzbeginn wieder anhaken, „Vorbelegung entfernen" und Pfeil + Enter im Einheitstyp habe ich in dieser Runde nicht nachgestellt. |

Einordnung der eigenen Befunde: R3-E1, R3-E2, R3-E3, R3-E4, R3-E6 und R3-E7
sind neu. R3-E5 ist der in der Behebungstabelle benannte Rest von R2-E4.
R3-E4 ergänzt R3-L1 um den Inhalt der Meldung.

Bilanz: Von sechs Runde-2-Befunden halten drei voll (R2-E1, R2-E2, R2-E3).
R2-E4 ist weitgehend umgesetzt, R2-E5 hält bis auf den Speicherfall,
R2-E6 habe ich nicht nachgeprüft. Verkehrt hat sich keine Behebung. Die
Verlustwege aus Runde 2 laufen über den Meldekopf und sind zu. Der neue
Verlustweg R3-E2 läuft über „Aus Datei laden…" und braucht einen belegten
Rückholplatz.

## Stand der Behebung

Stand 05.10.2026, Paket „Eigener Bogen, Rückholplatz, Übernahme". Geprüft mit
Typprüfung, Unit-Tests (2 295 grün) und Nachmessung im Dev-Server (360 × 640,
`isMobile`/`hasTouch`, de-DE), Prüfdateien dieses Audits. Aufgeführt sind nur die Befunde dieses
Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R3-E2 „Aus Datei laden…“ räumt den Rückholplatz vor dem Lesen | behoben | Erst lesen, dann fragen und verdrängen; unbrauchbare Datei meldet sich ohne Rückfrage; nie eine Kopie desselben Bogens auf den Rückholplatz. Nachlauf mit Entwurf Bamberg / Rückholplatz Ulm: abgeschnitten.json, foto.png, leer.json, liste.csv ohne Rückfrage, je richtige Fehlermeldung, danach Bamberg / Ulm. |
| R3-E3 Leere Erfassung wird übernommen | behoben | Ohne Namen der Einheit kein Ablegen: Hinweis „Name der Einheit fehlt“, „Zum Namensfeld“ springt mit Cursor ins Feld. Nachlauf (320 × 568, 360 × 640, 640 × 360): 0 Einträge, Schritt 1, Fokus `feld-einheit-name`. Kein „Rückgängig“ nach der Übernahme. |

Stand 05.10.2026, Paket „Speicher und Offline". Geprüft mit Typprüfung,
Unit-Tests (2 337 grün) und Nachmessung im Produktionsbuild (`vite preview`,
360 × 640, `isMobile`/`hasTouch`, de-DE), Prüfskript s30c dieses Audits.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R3-E1 Speicher voll, kein Geräteschlüssel: QR und PDF scheitern mit Programmtext | behoben | Lässt sich der neue Geräteschlüssel nicht speichern, signiert die App mit einem Schlüssel nur für diese Sitzung und speichert ihn, sobald Platz ist; die Übersicht sagt am Siegel „Das Siegel gilt nur, solange diese Seite offen ist …". Speicherfehler erscheinen überall deutsch (`fehlerText`). Nachlauf (016 Bamberg, kein Schlüssel, jede wachsende `eeb.*`-Schreibung scheitert): QR-Code in 3 Teilen, „QR-Code im Vollbild zeigen" bedienbar, „PDF erzeugen" lädt die PDF herunter, kein Programmtext. Signaturformat unverändert. |

Stand 05.10.2026, Paket „Rückmeldungen im Bild, Scrollposition, Doppeltipp,
Rückgängig". Geprüft mit Typprüfung, Unit-Tests (2 352 grün) und Nachmessung
im Dev-Server (360 × 640, 320 × 568, 640 × 360, `isMobile`/`hasTouch`,
de-DE). Aufgeführt sind nur die Befunde dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R3-E4 Gemischter Stapel: Fehler verdrängt Erfolg, „0 Bögen aufgenommen“ | behoben | Dateien und Bilder einer Auswahl laufen als ein Stapel mit einer Rückmeldung. Nur Dateien: Erfolg und Fehler untereinander unter den Aufnahme-Knöpfen. Mit Bildern: ein Bericht, erste Zeile zählt beides („2 Dateien und 1 Bild gelesen — 1 Bogen aufgenommen.“), darunter kaputte Dateien und Bilder ohne Code. Nachlauf: Schwabach + abgeschnitten.json → „1 Bogen aufgenommen.“ und die Beschädigt-Zeile zusammen; Hilpoltstein + abgeschnitten.json + foto.png → keine Zeile mit „0 Bögen“. |
