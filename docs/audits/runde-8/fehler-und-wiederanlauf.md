# Audit „Fehler und Wiederanlauf", Runde 8 (Bedienfehler provozieren, selbst korrigieren)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-error-recovery-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `3fee6e5` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-7-Befunde ([Runde 7](../runde-7/fehler-und-wiederanlauf.md) samt „Stand
der Behebung" in [../runde-7/README.md](../runde-7/README.md)). Schwerpunkt:
Beiseitelegen unlesbarer Daten (`eeb.unlesbar.v1`), Zwei-Fenster-Leiste mit
Unterschiedstexten, Rückfragen mit rollendem Rumpf und festem Fuß, Geräteuhr-Halt
auch beim zweiten Lesen, Papier-Abgleich im Sitzungsspeicher, „Nur Stärke"-
Rückfrage, Grenzen sichtbar an Zahlenfeldern, Rückgängig beim Organisationswechsel.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Gerätedichte 2. Jeder Lauf
hatte einen eigenen Browser-Kontext mit leerem Speicher; elf weitere Prüfer
nutzten denselben Server. Grundeinstellung Telefon 360 × 640 px, dazu 320 × 568,
640 × 360 quer und, für die Rückfragen, `html { font-size: 200% }`. Server nicht
angerührt, nichts neu gebaut.

Zustände entstanden durch Bedienung und durch `localStorage`-Seeds aus
`examples/thw/` (alle mit `uebung: false`, `stand` auf heute, Datum 24.10.2026
laut Auftrag; die Geräteuhr des Prüfrechners zeigte 23.10.2026, 21:40 bis 22:05 Uhr,
die Berichte rechnen mit dem Wert der App):

- `eeb.entwurf.v1`: Großbogen „Verstärkter Bergungszug" (38 Personen, 10
  Fahrzeuge); Varianten ohne `organisation`, mit abgeschnittenem Text, mit
  fremdem Schema, mit `stand` 100 Tage alt.
- `eeb.einsaetze.v1`: Sammlung „Hochwasser Musterstadt" mit sechs Einheiten;
  Varianten abgeschnittener Text, `eintraege: null`, ein Eintrag mit `bogen:
  {foo:1}`, ein Bogen ohne `einheit`, `null` in der Liste, `vomPapier` gesetzt
  (für den Papier-Abgleich).
- `eeb.vorlagen.v1`: zwei Vorlagen, vollständig und um 900 Zeichen gekürzt.
- `eeb.uhr.v1`: letzter Start 120 Tage in der Zukunft, kombiniert mit `stand`
  heute, heute − 100 Tage und heute + 120 Tage.
- `eeb.entwurf.ersetzt.v1` (Platz „Zuletzt geschlossener Bogen") belegt.
- Dateien: abgeschnittene, leere, fremde JSON-Dateien, Bogendateien ohne
  `einheit` und mit `personal: null`, gesicherte Hülle eines beschädigten Entwurfs,
  Sicherungsdateien (abgeschnitten, Format 99, leere `eintraege`, beschädigter
  Einsatz-Text innen, beschädigter Entwurf innen, Müll als Geräteschlüssel).

Geprüft habe ich, zuerst ohne Blick in die Berichte:

- **Falsche Eingabe:** Verpflegung −5 und 380 statt 38, 99 999 999 l Diesel,
  Sitzplätze 999, Mannschaft 830 statt 83 und 0 in der Schnellerfassung,
  Eintreffzeit 23:30 (in der Zukunft) und 08:00, „Weiter" ohne Namen,
  „In Einsatz übernehmen" ohne Namen und mit Stärke 0, „Namen einfügen…" mit
  Ziffern, Klammern, Semikolon und Doppelung, Nr. laut Blatt „7", „7", „1,5".
- **Abbruch und Neuladen:** Tippen und sofort neu laden, Neuladen auf Schritt 3,
  im Papier-Abgleich und in der Sammlung, Zurück-Geste vom Assistenten, von der
  Sammlung, bei offener Rückfrage und im Dialog „Namen einfügen…", Escape.
- **Falscher Kontext:** Person und Fahrzeug entfernen (auch zwei Personen
  hintereinander), „Verwerfen", „Neuen Bogen erstellen" und „Aus Datei laden…"
  bei belegtem Platz „Zuletzt geschlossener Bogen", Organisation wechseln und
  Rückgängig, „Einheit ist bereits gemeldet" (gleicher Typ und Name wie in der
  Sammlung), zwei Sammlungen-Wege der Schnellerfassung.
- **Doppeltes Auslösen:** Doppeltipp auf „In Einsatz übernehmen", auf „+ Person
  hinzufügen" (80 und 400 ms) und „+ Fahrzeug hinzufügen" (80 ms).
- **Zwei Fenster:** derselbe Entwurf in zwei Fenstern desselben Kontexts
  (bloßes Öffnen, Ändern in beiden, „Stand aus dem anderen Fenster laden",
  „Meine Fassung behalten"); dieselbe Sammlung in zwei Fenstern, „Abrücken" in
  beiden.
- **Bestand:** beschädigte und strukturell unvollständige Speicherstände (siehe
  oben), danach Start, Öffnen und Schreiben.
- **Dateien und Sicherung:** siehe oben, Rückfragen von „Sicherung einspielen…".
- **Speicher voll:** Stub auf `Storage.prototype.setItem` für `eeb.*` nach dem
  Laden, Tippen im Schritt Personal.
- **Papier-Abgleich:** Eingaben, „Später", Neuladen, Wiederöffnen, „Abgleich
  übernehmen" mit doppelter und kaputter Nr.
- **Geräteuhr:** Start und zwei Neuladen mit Uhrstand in der Zukunft, danach
  „Fortsetzen" im Assistenten.
- **Verlauf:** `history.back()`/`forward()` im Assistenten (Schritte 3, 5, 6),
  in der Sammlung und im Lagemonitor-Fenster.

**Nicht prüfbar:** Kamera und Handscanner, echte Handschuhe, echtes Licht,
Bildschirmtastatur (nur nachgestellt), der Zurück-Knopf eines Android-Geräts
(nur `history.back()`), WebKit/Safari, native Builds, ein Browser, der bei
Platzmangel Speicher räumt. Das zweite Fenster des Lagemonitors öffnete sich in
meinen Läufen nicht als eigenes Fenster (Aufruf mit `?lagemonitor=<id>`
geprüft, siehe Bestätigtes). Zeitmessung unter Last: Tipps in den ersten rund
0,6 bis 1 s nach dem Öffnen oder Schließen einer Rückfrage wurden mehrfach
verschluckt (bekannt aus R5-S2, R7-E, nicht neu gezählt).

Skripte und Screenshots liegen außerhalb des Repositorys unter
`/tmp/claude-0/-home-user-erfassungsbogen/80562043-ef9f-5d01-b383-2703357d8a5e/scratchpad/runde8/e/`.

Rolle: Helfer, der normale Fehler macht und danach selbst weiterkommen will.

## Urteil

Die Wiederanlauf-Wege halten fast durchgehend. Fehleingaben werden vor der
Wirkung gefragt und nennen den Wert und das Richtige: „Verpflegung für 380
Personen angefordert, die Gesamtstärke ist aber 38", „99.999.999 l Diesel für 10
Fahrzeuge … Stimmt das?", „Stärke: 830 Mannschaft — stimmt das?", „Eingetroffen
um 23:30 liegt in der Zukunft — Stunde oder Tag vertauscht?" mit „Heute" und
„Gestern" zur Wahl. Weggeworfenes lässt sich zurückholen: Person und Fahrzeug
mit „Rückgängig", mehrere Personen nacheinander, der Organisationswechsel samt
Hinweis auf das bleibende Kennwort, „Abgerückt" mit „Rückgängig", das
„Zuletzt geschlossen"-Fach mit der ausdrücklichen Warnung, wenn es einen anderen
Bogen verdrängt. Neuladen mitten im Tippen, Zurück-Geste, zwei Fenster, voller
Speicher und das Beiseitelegen beschädigter Bogen sind beherrscht; beschädigte
Einzelteile einer Sammlung werden gezählt und genannt („Nicht lesbar: 1 Meldung
in einer Sammlung … Nichts davon ist gelöscht"). Der Papier-Abgleich überlebt
„Später" und Neuladen und lehnt doppelte und unsinnige Nummern vor dem
Übernehmen ab.

Reibung bleibt an den Rändern, nicht im Hauptweg: Ein syntaktisch
beschädigter Text im Speicher wird beim nächsten Schreiben still ersetzt (Vorlagen
gemessen; Einsatz-Sammlungen siehe Verweis), Dateien der eigenen App mit einem
defekten Feld bekommen eine falsche Ursache genannt, eine eingefügte Namensliste
geht bei Escape oder Zurück-Geste ohne Rückfrage verloren, und die Zwei-Fenster-
Leiste zählt eine umbenannte Person als zwei Einträge. Alles P3; einen Befund mit
Datenverlust im Hauptweg fand ich nicht.

Den eigenen Bogen und die Meldekopf-Aufgaben schafft der Helfer ohne fremde Hilfe.

## Befunde

### R8-E1 [P3] Ein beschädigter Vorlagen-Text wird beim nächsten „Als Vorlage speichern" still durch die neue Vorlage ersetzt; „Sicherung einspielen…" nennt Beschädigtes in der Datei nicht (neu, Rest von R7-E2)

**Priorität:** P3

**Kennzeichnung:** gemessen im konstruierten Zustand (abgeschnittener Text); ob
ein Gerät diesen Zustand erreicht, ist Risiko (Rücksicherung, fremde Fassung,
von Hand bearbeitete Datei).

**Fundstelle / Aufgabe:** `eeb.vorlagen.v1` mit zwei Vorlagen, um 900 Zeichen
gekürzt → Start → Entwurf fortsetzen → Schritt 6 → „Als Vorlage speichern" →
Name „Neue Vorlage". Außerdem „Datensicherung" → „Sicherung einspielen…" mit
einer Datei, deren innerer Einsatz-Text abgeschnitten ist. Code:
`src/app/vorlagen.ts`, `src/app/unlesbar.ts` (`unlesbareSammlungsteile` erkennt
nur gültiges JSON).

**Beobachtung:**

- Beim Start bleibt der abgeschnittene Vorlagentext unverändert im Speicher
  (kein Verlust beim Laden); die Liste der Vorlagen ist leer, ein Hinweis fehlt.
- Nach „Vorlage speichern" ist `eeb.vorlagen.v1` ein neuer, gültiger Text mit
  nur „Neue Vorlage". „Alte Vorlage" und „Zweite Vorlage" stehen nirgends mehr
  (`eeb.unlesbar.v1` fehlt, kein Hinweis). Die Quittung lautet „Als Vorlage „Neue
  Vorlage" gespeichert."
- Der beschädigte Entwurf wird dagegen beiseitegelegt und erklärt; bei der
  Sammlung gilt das nur für gültiges JSON (der Startfall steht in
  `offline-und-speicher.md` R8-O2 und `zerstoerende-handlungen.md`, hier nur
  Verweis; der Vorlagen-Schreibfall war dort „nicht ausgeführt", hier
  ausgeführt).
- Sicherungsdatei mit abgeschnittenem Einsatz-Text innen: Die Rückfrage „Sicherung
  einspielen?" führt die Datei-Seite mit „keine laufende Einsatz-Sammlung" auf,
  ohne zu sagen, dass in der Datei ein beschädigter Einsatz-Text steckt. Nach dem
  Einspielen und dem nächsten Start folgt der Fall aus R8-O2.

**Erwartung der Rolle:** Was die App nicht lesen kann, wird nicht stillschweigend
ersetzt, sondern beiseitegelegt und genannt; die Rückfrage vor dem Einspielen sagt,
dass die Datei einen beschädigten Teil enthält.

**Folge:** Gering. Wer Vorlagen für wiederkehrende Einsätze pflegt, merkt erst
beim nächsten Einsatz, dass sie fehlen, und tippt sie neu. Beim Einspielen
einer teilweise beschädigten Sicherung fehlt die Warnung, solange die Datei selbst
noch greifbar ist.

**Empfehlung:** Den Rohtext vor dem ersten Überschreiben beiseitelegen (wie beim
Entwurf, `eeb.unlesbar.v1`) und auf der Startseite nennen; die Rückfrage der
Sicherung um „in der Datei beschädigt: Einsatz-Sammlung" ergänzen.

**Nachprüfung:** `eeb.vorlagen.v1` mit abgeschnittenem Text seeden, Vorlage
speichern: Der alte Text liegt beiseite und lässt sich sichern, die Startseite
nennt den Fund. Sicherung mit abgeschnittenem Einsatz-Text einspielen: Die Rückfrage
nennt die Beschädigung.

### R8-E2 [P3] „Namen einfügen…": Escape und Zurück-Geste schließen den Dialog und verwerfen die eingefügte Liste ohne Rückfrage (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (fünf Zeilen eingefügt, Entwurf danach ausgelesen).

**Fundstelle / Aufgabe:** Schritt 3 → „Namen einfügen…" → Liste einfügen → Escape,
`history.back()` oder Tipp neben den Dialog.

**Beobachtung:** Escape und Zurück-Geste schließen den Dialog sofort; die Liste ist
weg (Wiederöffnen: leeres Feld), der Entwurf hat weiter 38 Personen. Ein Tipp neben
den Dialog schließt nicht (gut). Die Vorschau selbst ist gut: „12345",
„(Gf), Max Mustermann" und „Karl, Bauer;" tragen „kein Name?" und „wird nicht
übernommen", „doppelt" ist markiert, die Zeilen „3 Zeilen sehen nicht nach einem
Namen aus … Wer sie doch braucht, hakt sie an".

**Erwartung der Rolle:** Eine Liste, die der Helfer mühsam aus einer Nachricht
zusammengesucht hat, geht nicht durch eine Wischgeste verloren; wenigstens eine
Rückfrage bei mehr als einer Zeile.

**Folge:** Gering: Die Quelle (Nachricht, Zettel) ist meist noch da, das erneute
Einfügen kostet Sekunden. Bei einer Liste, die aus mehreren Zetteln getippt wurde
(38 Namen), wären es Minuten.

**Empfehlung:** Bei Escape und Zurück-Geste mit eingetragenem Text fragen („Liste
verwerfen?") oder den Text bis zum Schließen der Seite im Sitzungsspeicher halten,
wie beim Papier-Abgleich.

**Nachprüfung:** Liste einfügen, Escape: Rückfrage oder beim Wiederöffnen steht die
Liste noch da.

### R8-E3 [P3] Eigene Bogendateien mit einem defekten Feld bekommen eine falsche Ursache genannt: „stammt nicht aus dieser App" und „Schema-Version 2–9 erwartet" bei Version 8 (neu, verwandt mit R7-E1)

**Priorität:** P3

**Kennzeichnung:** gemessen (zwei Dateien aus `examples/thw/…` mit je einem
entfernten bzw. auf `null` gesetzten Feld, über „Aus Datei laden…").

**Fundstelle / Aufgabe:** Startseite → „Aus Datei laden…". Code:
`src/app/datei-fehler.ts`, `src/app/hilfen.ts` (`bogenLaden`).

**Beobachtung:**

- Datei mit `schemaVersion: 8`, ohne `einheit`: „„ohne-einheit.json“ stammt nicht
  aus dieser App. Beim Absender die PDF des Bogens anfordern oder den QR-Code
  scannen."
- Datei mit `schemaVersion: 8` und `personal: null`: „Keine gültige
  Erfassungsbogen-Datei (Schema-Version 2–9 erwartet)." Die Datei trägt die
  Version 8; der Satz widerspricht sich.
- Der gesicherte beschädigte Entwurf (Hülle) wird dagegen richtig erklärt: „Der
  gesicherte Entwurf lässt sich nicht öffnen. Der Bogen ist unvollständig: die
  Organisation …" (R7-E1 hält). Leere und abgeschnittene Dateien, eine Textdatei
  und Sicherung Format 99 haben jeweils eine passende, handlungsleitende Meldung.

**Erwartung der Rolle:** Die Meldung nennt das fehlende Feld („Einheit fehlt") und
sagt, dass die Datei von dieser App stammt, aber unvollständig ist.

**Folge:** Gering: Der Helfer sucht beim „Absender" nach einem Bogen, den er selbst
gesichert oder von Hand verändert hat, oder hält die Datei für fremd.

**Empfehlung:** Bei vorhandenem `schemaVersion` im gültigen Bereich die Prüfmeldung
des Bogens zeigen (fehlendes Pflichtfeld) statt der Klassifizierung „fremd" oder
„Version".

**Nachprüfung:** Bogen mit `schemaVersion: 8` ohne `einheit` einlesen: Die Meldung
nennt „Einheit fehlt"; mit `personal: null` nennt sie „Personal fehlt oder unlesbar".

### R8-E4 [P3] Zwei-Fenster-Leiste: „Personal (2 Einträge)" bei einer umbenannten Person; weder Person noch Feld genannt (neu, Nebenwirkung der Unterschiedstexte)

**Priorität:** P3

**Kennzeichnung:** gemessen (Vorname einer Person im zweiten Fenster geändert);
Ursache im Code gegengelesen (`src/app/fenster-unterschied.ts`: Zugang + Abgang +
Geändert).

**Fundstelle / Aufgabe:** Fenster A: Schritt 3. Fenster B im selben Kontext:
Fortsetzen, Schritt 3, bei der ersten Person „Sandra" durch „QQQ" ersetzen. Fenster
A zeigt: „Hier wird nichts gespeichert. Das andere Fenster hat den Bogen geändert:
Personal (2 Einträge)." Bei zusätzlich einer Änderung in A: „(4 Einträge)".

**Beobachtung:** Eine geänderte Person erscheint als zwei Einträge (ein Abgang, ein
Zugang), zwei geänderte als vier. Die Leiste nennt nicht, welche Person und welches
Feld. Das ist gegenüber Runde 7 („dort … hier …" gleich lautend) eine klare
Verbesserung; die Zahl bleibt unterwegs ungenau. Die Rückfragen „Stand aus dem
anderen Fenster laden?" und „Meine Fassung behalten?" nennen Fenster, Stand mit
Sekunden und denselben Unterschiedstext und sagen, wohin die verdrängte Fassung
geht (gut). Bloßes Öffnen im zweiten Fenster löst keine Leiste mehr aus (R7-E3
hält).

**Erwartung der Rolle:** „Personal: 1 Person geändert (Otto, Sandra)" statt einer
Zahl, die der Helfer nicht nachrechnen kann.

**Folge:** Gering: Der Helfer weiß nicht, ob er bei „Anderen Stand laden" eine
Person oder zwei verliert, und entscheidet nach Gefühl.

**Empfehlung:** Geänderte Personen einmal zählen (Zugang und Abgang derselben
Stelle zusammenfassen) und bis zu drei Namen nennen.

**Nachprüfung:** Eine Person im anderen Fenster umbenennen: Die Leiste sagt „Personal
(1 Eintrag)" oder nennt den Namen.

### R8-E5 [P3] Rückfrage „Fahrzeug entfernen" sagt „gehen verloren" und verschweigt das „Rückgängig", das danach erscheint (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Schritt 4 → „Fahrzeug entfernen" bei „MzKW THW-80375".

**Beobachtung:** Die Rückfrage lautet „Die erfassten Angaben dieses Fahrzeugs gehen
verloren — Typ, Kennzeichen, Funkrufname, Sitzplätze und Änderungen." Nach „Fahrzeug
entfernen" steht eine Leiste mit „Rückgängig". Die Rückfrage für Personen sagt dagegen
ausdrücklich: „„Rückgängig“ in der Leiste unten holt sie zurück."

**Erwartung der Rolle:** Gleiche Aktion, gleiche Aussage: Der Helfer, der zögert,
erfährt vorher, dass der Schritt umkehrbar ist.

**Folge:** Gering: Ein Helfer, der den Satz wörtlich nimmt, bricht ab oder tippt
Kennzeichen und Funkrufname vorsorglich auf Papier ab.

**Empfehlung:** Satz wie bei Personen ergänzen.

**Nachprüfung:** Rückfrage „Fahrzeug entfernen" nennt „Rückgängig".

### Verweise auf Befunde in anderen Runde-8-Berichten

Unabhängig beobachtet und hier nicht gezählt:

- Syntaktisch beschädigter Text unter `eeb.einsaetze.v1` wird beim Start still
  durch `[]` ersetzt; kein `eeb.unlesbar.v1`, kein Hinweis (gemessen, abgeschnittener
  Text und Objekt statt Liste): `offline-und-speicher.md` R8-O2,
  `zerstoerende-handlungen.md` (Abschnitt zur abgeschnittenen Sammlung). Meine
  Messungen decken sich; zusätzlich: `eintraege: null` und Bogen ohne `einheit`
  bzw. mit `{foo:1}` werden dagegen gezählt und genannt („Nicht lesbar: 1
  Meldung in einer Sammlung", „1 Meldung nicht lesbar — Daten sichern"). Ein
  `null` als Listenelement fällt still weg (kein Hinweis, kein Zähler; trivial).
- Eintreffzeit und „Ortssperre" verschlucken Tipps in den ersten 0,6 bis 1 s nach dem
  Öffnen oder Schließen einer Rückfrage: bekannt aus R5-S2, R7.
- Rückfrage „Neuen Bogen anfangen?" im Querformat: „Neu anfangen" liegt 12 (100 %)
  bzw. 24 px (200 %) höher als „Abbrechen"; Größe und Fokus stimmen. Darstellung,
  nicht Gegenstand dieser Rolle.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Plausibilitätsfragen vor der Wirkung:** Verpflegung 380 für 38 Personen,
  99.999.999 l Diesel („mehr als 1.000 l je Fahrzeug. Stimmt das?"), Mannschaft 830
  („Stimmt die Stärke?" mit „Ja, so übernehmen" und „Zahlen korrigieren"),
  Eintreffzeit 23:30 in der Zukunft („Stunde oder Tag vertauscht?" mit „Zeit
  korrigieren", „Trotzdem heute", „Gestern"), Stärke 0 („Stärke fehlt" mit „Stärke
  eintragen" und „Trotzdem mit Stärke 0 übernehmen"), fehlender Name („Zum
  Namensfeld"). Alle stehen auch in „offene Punkte für die Weitergabe".
- **Grenzen sichtbar (R7-E6):** Sitzplätze 999 → „Höchstens 99 — dein Wert 999 wurde
  auf 99 gesetzt."
- **Rückweg:** Person entfernen mit Rückfrage (Fokus „Abbrechen"), „Rückgängig"
  bleibt über Schrittwechsel stehen und stellt bei zwei hintereinander entfernten
  Personen beide wieder her; Fahrzeug entfernen mit „Rückgängig"; „Abrücken" mit
  „Rückgängig" in der Leiste; Organisation wechseln mit „Rückgängig" (Einheitstyp
  und Zugehörigkeit kommen zurück; die Rückfrage nennt das bleibende Kennwort
  „Heros") (R7-E5 hält).
- **„Zuletzt geschlossener Bogen":** „Verwerfen", „Neuen Bogen anfangen?" und „Bogen
  aus Datei öffnen?" nennen bei belegtem Platz Name, Stand, Stärke und Auftrag des
  Bogens, der endgültig gelöscht würde, und sagen, was bleibt.
- **Neuladen mitten im Tippen:** „ZZTEST" im Namensfeld ohne Verlassen des Feldes
  steht nach dem Neuladen im Entwurf und im Feld; „Fortsetzen" landet im
  selben Schritt. Nach dem Neuladen in der Sammlung öffnet die App die Sammlung
  wieder.
- **Zurück-Verlauf:** Schritt 6 → 5 → 3 → Startseite → App verlassen; vorwärts
  läuft dieselbe Reihenfolge; Zurück bei offener Rückfrage schließt die Rückfrage und
  bleibt in der App.
- **Zwei Fenster, Entwurf:** Leiste nur bei echtem Inhaltsunterschied, „Anderen
  Stand laden" und „Meine Fassung behalten" fragen mit Fenster, Stand und
  Unterschied nach und sagen, wohin die verdrängte Fassung geht (R7-E3, R7-O2 u. a.
  halten). **Zwei Fenster, Sammlung:** „Abrücken" im zweiten, veralteten Fenster
  überschreibt das erste nicht; im Speicher stehen beide Abgänge (Lesen vor dem
  Schreiben).
- **Doppelt auslösen:** „In Einsatz übernehmen" zählt genau einmal (6 → 7); Doppeltipp
  auf „+ Person hinzufügen" und „+ Fahrzeug hinzufügen" (80 ms) legt je eine Zeile an.
- **Voller Speicher im Assistenten:** feste gelbe Leiste oben „⚠ Nicht gespeichert —
  dieser Browser lässt die App nichts speichern. Jetzt „Bogen übergeben“ (PDF)." mit
  „Was tun?", auch bei weit nach unten gerollter Personenliste sichtbar.
- **Beschädigte Entwürfe (R7-E1):** abgeschnittener Text und fremdes Schema:
  Karte „Ein gespeicherter Bogen ließ sich nicht öffnen" mit Ursache, Löschdatum
  und „Als Datei sichern". Die gesicherte Hülle wird beim Einlesen erklärt („…
  unvollständig: die Organisation …").
- **Unlesbare Teile einer Sammlung (R7-E2, N3):** `eintraege: null` →
  „Nicht lesbar: 1 ganze Sammlung. Sie fehlen in Listen und Zählung — die Stärke
  kann zu niedrig sein. Nichts davon ist gelöscht"; ein Eintrag mit `{foo:1}` oder
  ohne `einheit` → „1 Meldung nicht lesbar — Daten sichern" an der Karte und in der
  Sammlung; `eeb.unlesbar.v1` gefüllt.
- **Datei und Sicherung:** Meldungen für abgeschnittene, leere und fremde Dateien
  nennen Ursache und nächsten Schritt; „Die Daten auf diesem Gerät sind
  unverändert." Sicherung Format 99: „bitte erst die App aktualisieren". „Sicherung
  einspielen?" stellt Gerät und Datei gegenüber und bietet „Vorher Sicherung
  erstellen…".
- **Papier-Abgleich (R7-S1, G1):** Eingaben überleben „Später" und Neuladen („Angefangene
  Eingaben für 3 Einheiten sind noch da (nur in diesem Browserfenster …)"); „Abgleich
  übernehmen" lehnt „1,5" als Nr. und die doppelte Nr. „7" ab und nennt beide
  Einheiten („Nichts übernommen").
- **„Nur Stärke" und Doppelmeldung (R7-A1):** „Einheit ist bereits gemeldet" stellt
  „Bisher" und „Neu" mit Stärke und Stand gegenüber und nennt „Geändert: Stärke 4 → 7
  · Personal: 4 weg · Fahrzeuge: 2 abgemeldet …" mit „Nur die Stärke ändern",
  „Als neue Fassung anhängen", „Als eigene Einheit führen".
- **Geräteuhr (R7-W2):** Uhrstand 120 Tage in der Zukunft: „Geräteuhr prüfen … Bis du
  antwortest, löscht und anonymisiert die App nichts." mit „Geräteuhr stimmt" und
  „Uhr korrigieren" nach dem Start, nach zwei weiteren Neuladen und im Assistenten
  nach „Fortsetzen" (Entwurf mit `stand` in der Zukunft blieb unverändert).
- **Rückfragen bei 200 % Schrift (R7-E4, W1):** „Neuen Bogen anfangen?" bei 320 × 568,
  360 × 640 und 640 × 360: Überschrift beim Öffnen im Bild (Oberkante 33 px), Fokus
  auf „Abbrechen", beide Knöpfe im Fenster.
- **Vorschlagsliste des Einheitstyps (R7-E8):** bei 360 × 640 stehen beide Vorschläge
  über der Fußleiste (249 bis 367 px bei Leiste ab 512 px), ebenso bei 320 × 568 und
  640 × 360.
- **Lagemonitor-Aufruf:** unbekannte Kennung zeigt „Dieser Einsatz ist auf diesem Gerät
  nicht (mehr) vorhanden." mit „Schließen"; im Monitor liegt „Schließen" unter
  „Optionen" und führt ohne eigenes Fenster zur Startseite.

## Abgleich mit Runde 7

Grundlage: [../runde-7/fehler-und-wiederanlauf.md](../runde-7/fehler-und-wiederanlauf.md)
samt „Stand der Behebung" (E1 bis E8 dort „behoben").

| Runde-7-Befund | Stand laut Runde 7 | Bewertung Runde 8 | Beobachtung |
| --- | --- | --- | --- |
| R7-E1 Hülle des beiseitegelegten Entwurfs wird abgewiesen (P2) | behoben | hält | Meldung nennt „unvollständig: die Organisation …". Rest als R8-E3 (andere Dateien mit defektem Feld). |
| R7-E2 Unlesbares steht als „Noch keine Meldung." da / fällt weg (P2) | behoben | hält, Rest offen | Gültiges JSON mit unbrauchbaren Teilen wird beiseitegelegt, gezählt und genannt. Syntaktisch beschädigter Text unter `eeb.einsaetze.v1` wird beim Start still durch `[]` ersetzt (R8-O2, Verweis); beschädigte Vorlagen beim nächsten Speichern (R8-E1). |
| R7-E3 Warnung schon beim bloßen Öffnen (P3) | behoben | hält | Bloßes Öffnen im zweiten Fenster: keine Leiste; Änderung dort: Leiste mit Unterschiedstext. Zahl ungenau (R8-E4). |
| R7-E4 Fokus „Neu anfangen"; Frage über der Kante bei 200 % (P3) | behoben | hält | Fokus auf „Abbrechen"; Überschrift beim Öffnen im Bild (33 px) bei allen drei Fenstergrößen. |
| R7-E5 Kein „Rückgängig" nach Organisationswechsel (P3) | behoben | hält | „Rückgängig" stellt Einheitstyp und Zugehörigkeit wieder her; Hinweis zum Kennwort „Heros" in der Rückfrage. |
| R7-E6 Zahlenfelder begrenzen still (P3) | behoben | hält | „Höchstens 99 — dein Wert 999 wurde auf 99 gesetzt." |
| R7-E7 „Namen einfügen…" ohne Markierung (P3) | behoben | hält | Marke „kein Name?" und „wird nicht übernommen", Hinweis zum Anhaken; Rest R8-E2 (Escape verwirft die Liste). |
| R7-E8 Vorschlagsliste unter der Fußleiste (P3) | behoben | hält | Beide Vorschläge über der Leiste bei 360 × 640, 320 × 568 und 640 × 360. |

Bekannte Grenzen aus Runde 7, Stand: R6-O9 (Uhrstand in der Zukunft, frische
Sammlung), R7-G4/M8 (Ecken-Knopf hochkant), R7-G8/H9 (Geräteuhr-Warnung bei 200 %
und 320 × 568), R7-N1 (kein Zusammenführen-Tipp), R7-N9 (Ziffern der Schrittleiste)
liegen außerhalb dieser Rolle und habe ich nicht neu gemessen; mein Uhr-Lauf
widerspricht dem bekannten Stand nicht.

Bilanz: Alle acht Behebungen aus Runde 7 halten im Browser; R7-E2 hält nur für
gültig gelesene Daten, der Rest (beschädigter Text) steht in R8-O2 und R8-E1. Neu aus
Nebenwirkungen: R8-E4 (Zählung im Unterschiedstext) und R8-E2 (Escape im Dialog
zu „Namen einfügen…"); neu aus Randfällen: R8-E1, R8-E3, R8-E5. Eine Behebung hat
nichts verschlechtert.

## Abschluss

- **Aufgabe geschafft:** ja. Eigener Bogen, Meldekopf-Erfassung, Papier-Abgleich,
  Korrektur nach Fehleingaben und Wiederanlauf nach Neuladen, Abbruch, Zurück-Geste und
  zweitem Fenster gehen ohne fremde Hilfe.
- **Fremde Hilfe nötig:** nein; nur bei einem beschädigten Speicherstand der
  Sammlungen oder Vorlagen bleibt allein die frühere Sicherungsdatei.
- **Größtes Missverständnis:** „Personal (2 Einträge)" und „stammt nicht aus dieser
  App" sagen dem Helfer etwas anderes, als tatsächlich vorliegt (R8-E4, R8-E3).
- **Größtes Einsatzrisiko:** Ein syntaktisch beschädigter Text im Speicher wird
  beim nächsten Schreiben still ersetzt; bei den Vorlagen gemessen (R8-E1), bei den
  Sammlungen beim Start (R8-O2).
- **Top-Priorität für die nächste Iteration:** Jeden nicht lesbaren Speichertext vor
  dem ersten Überschreiben beiseitelegen und nennen, nicht nur den Entwurf und
  gültiges JSON (R8-E1, R8-O2).
