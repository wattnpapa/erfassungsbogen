# Audit „Fehler und Wiederanlauf", Runde 6 (Bedienfehler provozieren, selbst korrigieren)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-error-recovery-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit `03a0011`. Der Server wurde während der Prüfung neu gestartet
(gleicher Build); zwei spätere Commits auf `main`, die nur den Lagemonitor
ändern, sind im geprüften Build nicht enthalten.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-5-Befunde, mit Schwerpunkt auf den dort umgebauten Stellen:
Fehlerfänger und Pflichtfeldprüfung, Geräteuhr und „Stärke ändern…",
„Rückgängig" nach „als neue Fassung", Stärke 0, „Stimmt die Zeit?", voller
Speicher mit eingegebener Zahl, Zurück-Geste auf dem ersten Verlaufseintrag.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, Gerätedichte 2.
Jeder Lauf hatte einen eigenen Browser-Kontext mit leerem Speicher; elf
weitere Prüfer nutzten denselben Server. Zeiten sind deshalb nur als
Abstände zwischen meinen eigenen Tipps angegeben, nicht als Ladezeiten.

Zustände über `localStorage`-Seeds aus `examples/thw/` (003 Crailsheim FGr W
(A), 005 Haßmersheim FGr W (A), 002 Biberach FGr O (B), 006 Karlsruhe), alle
mit `uebung: false`, `stand` und Einsatzzeitraum auf heute gesetzt (die
Beispieldateien selbst sind inzwischen älter als 90 Tage und würden beim
Fortsetzen anonymisiert):

- `eeb.einsaetze.v1`: Sammlung „Hochwasser Test" mit zwei Einheiten; Varianten
  mit einem Bogen ohne `einheitsTyp`, ohne `fahrzeuge`, mit Zeitstempeln 30
  und 120 Tage in der Zukunft.
- `eeb.entwurf.v1` und `eeb.entwurf.ersetzt.v1`: eigener Bogen, auch ohne
  `einheitsTyp`, ohne `fahrzeuge`, mit `personal: null`, ohne `organisation`.
- `eeb.vorlagen.v1`: Vorlage mit und ohne `einheitsTyp` bzw. `fahrzeuge`.
- `eeb.uhr.v1`: letzter Start 30 bzw. 120 Tage in der Zukunft (Uhr
  zurückgestellt).

Geprüft habe ich:

- **Fehlerfänger und Pflichtfelder:** Bogen ohne Einheitstyp als Entwurf, als
  beiseitegelegter Entwurf, als Einzeldatei, in Einsatz-Datei (gemischt und
  nur fehlerhaft), als Sammlung im Speicher und in einer Sicherungsdatei;
  Vorlage und Sammlung ohne Fahrzeuge; Entwurf ohne Organisation.
- **Dateifehler:** abgeschnittene JSON, leere Datei, PNG, Bogen mit
  Schema 99, Sicherungsdatei und Einsatz-Datei am falschen Eingang, kaputtes
  PDF, JSON-Array, Textdatei.
- **Stärke ändern:** 0 / 0 / 0, 0 / 2 / 5, Doppeltipp auf „Stärke
  übernehmen" mit 120, 300, 600, 900, 1 300 und 1 800 ms (Koordinatentipp),
  Speicher voll (Stub auf `Storage.prototype.setItem` für `eeb.*`, nach dem
  Laden gesetzt), Uhr zurückgestellt (30 und 120 Tage).
- **„Als neue Fassung" und „Rückgängig":** eigener Bogen ohne Einheitstyp in
  eine Sammlung ablegen, in der „THW Crailsheim Fachgruppe Wassergefahren
  (A)" steht → „Ist das dieselbe Einheit?" → „Ja — als neue Fassung" →
  „Rückgängig" (mit 0 und 150 ms Nachtipp).
- **„Stimmt die Zeit?":** „Eingetroffen um" 23:59 in der Erfassung am
  Meldekopf; „ändern" an der Karte mit einem Termin 36 Stunden voraus.
- **Zurück-Geste** (`history.back()`): bei offener Rückfrage auf der
  Startseite, nach Neuladen mit offener Rückfrage, nach bestätigter und nach
  abgebrochener Rückfrage, nach „Fortsetzen", ohne Entwurf.
- **Neuladen** 0, 50, 300 und 1 200 ms nach dem Tippen im Namensfeld.
- **Speicher voll** im Assistenten: „In Einsatz übernehmen" in der
  Schnellerfassung und „In Einsatz-Sammlung ablegen…" beim eigenen Bogen.
- **Zahlen:** −1 und 99 statt 9 in der Schnellerfassung (ein Komma lässt das
  Zahlenfeld nicht zu).

Getestet habe ich zuerst ohne Blick in frühere Berichte (bis auf den
Abschnitt „Prüfaufbau" des Runde-5-READMEs). Danach habe ich den
Runde-5-Bericht samt „Stand der Behebung" gelesen und erst zuletzt die
anderen Runde-6-Berichte; was dort steht, ist hier nur als Verweis genannt.

Skripte und Screenshots liegen außerhalb des Repositorys unter
`/tmp/claude-0/-home-user-erfassungsbogen/80562043-ef9f-5d01-b383-2703357d8a5e/scratchpad/runde6/fehler/`.

**Nicht prüfbar:**

- Kamera und Handscanner (QR-Weg nur über Dateien), echte Handschuhe, echtes
  Licht.
- Der Zurück-Knopf eines Android-Geräts und der Gestenverlauf von iOS. Ich
  habe `history.back()` verwendet.
- Eine echte Zeitsynchronisation des Geräts; die Uhr ist über Seeds in
  `eeb.uhr.v1` nachgebildet, nicht über `page.clock`.
- Ob Altbestände mit fehlenden Pflichtfeldern (R6-E1) auf echten Geräten
  vorkommen. Ich habe nur den Zustand hergestellt, nicht seine Herkunft
  nachverfolgt.
- WebKit/Safari, native Builds (Android, iOS, Electron), Bildschirmtastatur
  (nur nachgestellt).
- Zeitmessungen unter Last: Ein Tipp 0,9 s nach einem Seitenwechsel wurde
  mehrfach von der Ortssperre verschluckt; ob das an der Last oder an der
  Sperre liegt, habe ich nicht getrennt. Die Skripte warten deshalb 1,7 s.

Rolle: Helfer, der normale Fehler macht und danach selbst weiterkommen will.

## Urteil

Die Umbauten aus Runde 5 tragen an den Stellen, an denen Daten hereinkommen.
Eine Einsatz-Datei mit einem Bogen ohne Organisation wird mit Ursache und
Zahl abgelehnt („1 von 3 Bögen ist unvollständig (die Organisation der
Einheit fehlt) und wurde nicht übernommen"), ein Bogen ohne Einheitstyp wird
ergänzt, und ein unlesbarer Entwurf wird beiseitegelegt statt überschrieben.
Alle acht Dateifehler nennen den nächsten Schritt. „Stärke ändern…" fragt bei
0 / 0 / 0, nennt bei vollem Speicher die gewünschte und die bisherige Stärke
und legt bei Doppeltipp von 120 bis 1 800 ms genau eine Fassung an. Nach
zurückgestellter Uhr (120 Tage) gilt die neue Fassung. Nach „als neue
Fassung" gibt es genau einen Rückweg, und er sagt, was er tut. „Stimmt die
Zeit?" hat die Korrekturzeile vorn. Die Zurück-Geste schließt eine Rückfrage
auf dem ersten Verlaufseintrag, statt die App zu verlassen.

Die Reibung sitzt dort, wo der Fangnetzboden nicht ankommt. Erstens prüft die
App nur, was neu hereinkommt; was schon im Speicher liegt (frühere Stände,
eingespielte Sicherung), wird beim Lesen nicht geprüft. Eine Sammlung ohne
Einheitstyp stürzt beim Öffnen ab, eine Vorlage ohne Fahrzeuge schon die
Startseite, und die Fehlerseite rät zu „Neu laden", das den Absturz nur
wiederholt (R6-E1). Zweitens meldet der Assistent einen vollen Speicher beim
„In Einsatz übernehmen" der Erfassung am Meldekopf an einer Stelle, die beim
Tippen außerhalb des Bildschirms liegt; der Helfer sieht nichts (R6-E2). Der
beiseitegelegte Entwurf lässt sich als Datei sichern, aber nicht wieder
einlesen (R6-E3).

Den eigenen Bogen und die Meldekopf-Aufgaben schafft der Helfer ohne fremde
Hilfe. Fremde Hilfe braucht nur, wer eine schon gespeicherte, unvollständige
Sammlung oder Vorlage hat: Der Ausweg ist das Löschen.

## Befunde

### R6-E1 [P1] Was schon im Speicher liegt, wird beim Lesen nicht geprüft: Sammlung ohne Einheitstyp stürzt beim Öffnen ab, Vorlage oder Sammlung ohne Fahrzeuge schon die Startseite; die Fehlerseite führt in eine Schleife (neu, Grenze der R5-E1-Behebung)

**Priorität:** P1

**Kennzeichnung:** beobachtet (Seeds in `localStorage` und Sicherungsdatei
über „Sicherung einspielen…", Seitenfehler und Fehlerseite ausgelesen). Dass
es solche Bestände auf Geräten gibt, ist ein Risiko: Sie entstehen durch
Stände vor der Pflichtfeldprüfung oder durch eine von Hand bearbeitete
Sicherung.

**Fundstelle / Aufgabe:** Sammlung „Hochwasser Test" mit zwei Bögen, einer
davon ohne `einheit.einheitsTyp`, im Speicher; Startseite → „Öffnen". Zweiter
Weg: dieselbe Sammlung in einer Sicherungsdatei („Datensicherung →
Sicherung einspielen…"): Die Rückfrage nennt „Sammlung „Hochwasser Test" mit
2 Meldungen", „Einspielen und ersetzen" läuft durch, „Öffnen" stürzt ab.
Dritter Weg: `eeb.vorlagen.v1` oder `eeb.einsaetze.v1` mit einem Bogen ohne
`fahrzeuge`: schon die Startseite zeigt die Fehlerseite. Code:
`src/app/sicherung.ts` (`sicherungEinspielen` schreibt die Werte ungeprüft),
`src/app/einsaetze-lesen.ts` und `src/app/vorlagen.ts` (lesen ohne
`bogenBefund`), Absturz in `src/app/hilfen.ts` (`einheitsTyp.code`);
`src/app/bogen-pruefung.ts` wird nur an den Eingängen aufgerufen
(`einsatz-transport.ts`, `entwurf.ts`, `hilfen.ts`).

**Beobachtung:**

- Beim Öffnen der Sammlung erscheint „Hier ist etwas schiefgelaufen — Deine
  Daten liegen weiter auf diesem Gerät", technische Angabe „Cannot read
  properties of undefined (reading 'code')". Das stimmt, und „Daten sichern"
  erzeugt die Datei.
- „Zur Startseite" und „Neu laden" führen zur Startseite zurück, die Sammlung
  steht noch da; „Öffnen" zeigt dieselbe Fehlerseite. Die Fehlerseite sagt
  „Zuerst neu laden; hilft das nicht, zur Startseite" — beides wiederholt den
  Absturz.
- Auf der Startseite bleiben „Löschen…" der Sammlung und „Alle Daten
  löschen". Aus der Sammlung heraus (Export, Lageblatt, Datei) ist nichts
  erreichbar, die Sicherungsdatei lässt sich nicht reparieren und wieder
  einspielen (sie führt zum selben Zustand).
- Bei der Vorlage oder Sammlung ohne Fahrzeuge ist schon die Startseite weg;
  der einzige Weg ist „Alle Daten löschen" auf der Fehlerseite.
- Zum Vergleich: Dieselben Bögen über „Einsatz importieren…", „Aus Datei
  laden…" oder als Entwurf werden ergänzt oder mit Ursache abgelehnt.
  Entwurf ohne Fahrzeuge: „Fortsetzen" geht.

**Erwartung der Rolle:** Ein Absturz einer einzelnen Sammlung sperrt nicht
den Rest. Die App liest den Bestand mit derselben Prüfung wie die Eingänge,
oder die Fehlerseite nennt die betroffene Sammlung und bietet an, nur sie
herauszunehmen.

**Auswirkung im Einsatz:** Wer mit einem Gerät mit älterem Bestand in einen
Einsatz geht, kann die Sammlung nicht öffnen. Die Zahlen bleiben für ihn
unerreichbar, bis er sie löscht; ein Meldekopf verliert damit seine Lage.
Eine Sicherungsdatei, die als Rettung gedacht ist, bringt den Absturz mit.

**Empfehlung:** Beim Lesen von Sammlungen, Vorlagen und beim Einspielen einer
Sicherung dieselbe Pflichtfeldprüfung anwenden wie an den Eingängen
(ergänzen, sonst die einzelne Sammlung oder Vorlage beiseitelegen wie den
Entwurf). Die Fehlerseite sollte nur dann „Neu laden" empfehlen, wenn das
etwas ändern kann, und die betroffene Sammlung nennen.

**Nachprüfung:** Seed mit Sammlung ohne `einheitsTyp` und eine Vorlage ohne
`fahrzeuge`: Startseite und Sammlung lassen sich öffnen oder die betroffene
Sammlung steht beiseitegelegt mit Ursache da; dasselbe nach „Sicherung
einspielen…".

### R6-E2 [P1] Voller Speicher beim „In Einsatz übernehmen" in der Erfassung am Meldekopf: Die Meldung liegt über dem Bildschirm, am Knopf passiert nichts Sichtbares (neu, Lücke neben R5-E7)

**Priorität:** P1

**Kennzeichnung:** gemessen (Lage der Meldung per `getBoundingClientRect`,
dreimal wiederholt; Screenshots gesehen).

**Fundstelle / Aufgabe:** Startseite → „Einheit schnell erfassen (nur Stärke)…"
→ „Für „Hochwasser Test" erfassen" → Name „Zahlentest" → Schritt 3 „Nur
Stärke" 1 / 3 / 9 → Speicher voll (Stub nach dem Laden) → „In Einsatz
übernehmen". Code: `src/app/app.tsx` (`erfassungUebernehmen`,
`bogenInSammlung`: Fehler über `setFehler`); die Meldung steht in einem
Fehlerblock oben im Assistenten.

**Beobachtung:**

- Nach dem Tipp bleibt das Bild unverändert (Zähler, Knopf, Fußleiste). Die
  Meldung „Speichern fehlgeschlagen — der Speicher dieses Geräts ist voll.
  Platz schafft nur Löschen …" ist da, aber bei Scrollstand 383 px liegt sie
  bei −174 bis −30 px, also über der Oberkante. Es gibt keinen Dialog und
  keine Bewegung dorthin; drei weitere Tipps ändern nichts.
- Die Kopfzeile sagt weiter „✓ gespeichert · … nur auf diesem Gerät" (der
  Stand des Entwurfs ist der letzte erfolgreiche).
- Die Eingaben bleiben stehen, es entsteht keine Phantom-Meldung. Das ist
  richtig.
- Zum Vergleich: „Stärke ändern…" zeigt einen Dialog mit den Zahlen, und beim
  eigenen Bogen („In Einsatz-Sammlung ablegen…") steht die Meldung im
  geöffneten Dialog. Nur dieser Weg zeigt sie nicht dort, wo der Finger ist.

**Erwartung der Rolle:** Ein Dialog wie bei „Stärke ändern…": „Nicht
gespeichert — Stärke 1 / 3 / 9 bitte auf dem Meldeblock notieren, Platz
schaffen, noch einmal übernehmen."

**Auswirkung im Einsatz:** Der Helfer am Meldekopf tippt „übernehmen",
sieht nichts, tippt wieder und glaubt an einen Fehler der App oder geht
weiter zur nächsten Einheit. Die Einheit fehlt dann in der Lage, die Zahl ist
nirgends festgehalten.

**Empfehlung:** Den Speicherfehler an dieser Stelle als Rückfrage mit den
eingegebenen Zahlen zeigen, wie bei „Stärke ändern…" (R5-E7), oder die Ansicht
zur Meldung bewegen und sie fest an den Knopf setzen.

**Nachprüfung:** Stub setzen, „In Einsatz übernehmen": Der Hinweis erscheint
im sichtbaren Bereich oder als Dialog und nennt die Stärke.

### R6-E3 [P2] Der beiseitegelegte Entwurf lässt sich als Datei sichern, die App liest die Datei aber nicht wieder ein (neu, Grenze der R5-E1-Behebung)

**Priorität:** P2

**Kennzeichnung:** gemessen (Datei gespeichert und über „Aus Datei laden…"
geöffnet).

**Fundstelle / Aufgabe:** Entwurf ohne `einheit.organisation` im Speicher →
Startseite: „Ein gespeicherter Bogen ließ sich nicht öffnen … Er ist nicht
gelöscht, sondern beiseitegelegt — als Datei sichern, dann lässt er sich
später prüfen oder reparieren." → „Als Datei sichern" → „Aus Datei laden…".
Code: `src/app/app.tsx` (Karte `beschaedigt`), `src/app/entwurf.ts`
(`beschaedigtBeiseite`).

**Beobachtung:**

- „Als Datei sichern" lädt `eeb-beschaedigter-entwurf.json` (3,4 KB) herunter.
  Auf der Karte ändert sich nichts, es gibt keine Bestätigung.
- Die Datei ist die Hülle des Entwurfs (`gespeichert`, `bogen`, …). „Aus
  Datei laden…" antwortet „„l1_gesichert.json“ stammt nicht aus dieser App.
  Beim Absender die PDF des Bogens anfordern oder den QR-Code scannen."
- Der Fehler „die Organisation der Einheit fehlt" lässt sich in der App nicht
  beheben; „prüfen oder reparieren" bedeutet Handarbeit an der JSON-Datei.

**Erwartung der Rolle:** Die gesicherte Datei lässt sich in der App öffnen,
mit der Frage nach dem Fehlenden (hier: Organisation); mindestens aber sagt
der Text, dass sie nur für den Support taugt.

**Auswirkung im Einsatz:** Gering bei seltenem Anlass, aber ein
versprochener Rückweg, der in eine Sackgasse führt. Der Helfer sichert, löscht
über „Entfernen…" und hat dann einen Bogen, den er nirgends mehr öffnen kann.

**Empfehlung:** Hüllen mit `bogen` beim Einlesen annehmen und die Pflichtfeld-
frage stellen; nach „Als Datei sichern" eine Bestätigung zeigen („Datei
gespeichert: …"). Bis dahin den Text ehrlich fassen.

**Nachprüfung:** Gesicherte Datei einlesen: Die App öffnet den Bogen oder
fragt nach der Organisation; nach „Als Datei sichern" steht eine Bestätigung.

### R6-E4 [P3] Nach einer bestätigten Rückfrage braucht es einen zusätzlichen Zurück-Tipp ohne sichtbare Wirkung (neu, Nebenwirkung der R5-S5-Behebung)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Verlauf mit `history.back()` Schritt für
Schritt ausgezählt).

**Fundstelle / Aufgabe:** Startseite mit Entwurf → „Neuen Bogen erstellen" →
„Neu anfangen" → Assistent → Zurück. Code: `src/app/modal-overlay.ts`
(Verlaufseintrag der Rückfrage), `src/app/app.tsx` (Ansichtsverlauf).

**Beobachtung:** Ohne Rückfrage (kein Entwurf): Assistent → Startseite →
App verlassen (zwei Tipps). Mit bestätigter Rückfrage: Assistent →
Startseite → Startseite (ohne Veränderung) → App verlassen (drei Tipps). Nach
Neuladen mit offener Rückfrage ebenso ein Tipp ohne Wirkung. Abgebrochene
Rückfrage und „Fortsetzen" sind in Ordnung.

**Erwartung der Rolle:** Jeder Zurück-Tipp ändert etwas Sichtbares.

**Auswirkung im Einsatz:** Gering. Auf Android drückt man einmal mehr, und
nichts geschieht; wer das für einen Hänger hält, tippt weiter.

**Empfehlung:** Den Eintrag der Rückfrage nach der Bestätigung aus dem Verlauf
nehmen oder überspringen.

**Nachprüfung:** Wie oben: Zwei Zurück-Tipps vom Assistenten bis zum
Verlassen, mit und ohne bestätigte Rückfrage.

### R6-E5 [P3] Bei zurückgestellter Uhr nennt die Sammelquittung „neu gemeldet" statt der Folgemeldung, und die Zeiten mischen zwei Zeitlinien (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Seeds: Stände und Eingänge 120 bzw. 30 Tage in
der Zukunft, Uhrstand entsprechend).

**Fundstelle / Aufgabe:** Sammlung öffnen, „Stärke ändern…" 12 → 7. Code:
`src/app/einsaetze-ui.tsx` (Sammelquittung „Neu seit der letzten
Kenntnisnahme", `folgeAenderung`), `src/app/fassung-vorrang.ts`.

**Beobachtung:**

- 120 Tage zurück (Warnung „Geräteuhr prüfen" steht): Die neue Fassung gilt
  (Stärke 7, „aktuell"), die Kachel zeigt 19. Die Sammelquittung dagegen
  lautet „THW Crailsheim … — neu gemeldet" statt „Folgemeldung: Stärke 12 → 7
  (−5)"; die Daumenleiste („Stärke 12 → 7 geändert") ist richtig.
- Die Historie nennt „Stand 14.02.2027, 11:18 … eingegangen 11:18 (aktuell)"
  und „eingegangen 14.02., 10:58": Stand in der gehaltenen Zeit, Eingang in
  der Gerätezeit.
- Jede Karte trägt „⚠ Eingetroffen … liegt in der Zukunft — Tag oder Monat
  vertauscht?", obwohl die Ursache die Uhr ist, die oben schon gemeldet wird.
- 30 Tage zurück (unter der Schwelle von 60 Tagen, keine Uhrwarnung): neue
  Fassung hat denselben Stand wie die alte („Stand 16.11.2026, 10:57" bei
  beiden), sie gilt nur durch die vorgezogene Empfangszeit; die Karte zeigt
  nur den Zukunftshinweis.

**Erwartung der Rolle:** Die Quittung nennt die Änderung 12 → 7 auch dann.
Der Zukunftshinweis verweist bei bekannter Uhrabweichung auf die Uhr.

**Auswirkung im Einsatz:** Gering: Eine Verringerung der Stärke liest sich in
der Sammelzeile wie eine neue Einheit. Die Karte zeigt die Änderung trotzdem.

**Empfehlung:** Die Folgemeldung nach Fassungsfolge statt nach Eingangszeit
bestimmen; den Zukunftshinweis um „Geräteuhr prüfen" ergänzen.

**Nachprüfung:** Seed wie oben, „Stärke ändern…": Die Sammelzeile nennt
„Folgemeldung … Stärke 12 → 7".

### R6-E6 [P3] In der Schnellerfassung fragt „In Einsatz übernehmen" bei einem Zahlendreher nicht (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** „Einheit schnell erfassen…" → Schritt 3 → Mannschaft
„99" statt „9" → „In Einsatz übernehmen". Code: `src/app/app.tsx`
(`erfassungUebernehmen` ruft `staerkeFreigeben`, die nur 0 prüft).

**Beobachtung:** Im Schritt 3 steht „⚠ Stärke: 99 Mannschaft — stimmt das?".
Übernommen wird ohne Rückfrage („Gesamt 127" in der Sammlung, Einheit mit
103 Personen). Bei „Stärke ändern…" fragt dieselbe Eingabe („mehr als das
Dreifache"). Ein negatives Feld (−1) wird still zu 0.

**Erwartung der Rolle:** Dieselbe Rückfrage wie bei „Stärke ändern…",
bevor die Einheit in die Lage zählt.

**Auswirkung im Einsatz:** Wer den Hinweis nicht sieht (Fußleiste, Eile),
nimmt 90 Personen zu viel in Verpflegung und Unterbringung auf; sichtbar wird
es in der Summe.

**Empfehlung:** Die Plausibilitätsfrage vor dem Ablegen stellen.

**Nachprüfung:** Mannschaft 99 bei Schnellerfassung: „Stimmt die Stärke?"
vor dem Ablegen.

### Verweise auf Befunde in anderen Runde-6-Berichten

Unabhängig beobachtet und hier nicht gezählt:

- „Bedarf:" bricht im Kopf der Sammlung mitten im Wort („Bed / arf:"):
  `mobile-ui.md`, `nacht-und-sicht.md`, `neuer-nutzer.md`.
- „Bögen einlesen…" mit „THW Albstadt" (ohne Einheitstyp) neben der
  Einheit mit Typ zählt kommentarlos doppelt, Quittung „1 Bogen aufgenommen.":
  `neuer-nutzer.md`. Ich sehe es mit Crailsheim ebenso (Gesamt 24 → 30). Beim eigenen Bogen („In Einsatz-Sammlung ablegen…") fragt die App
  dagegen („Ist das dieselbe Einheit?").
- Die Ortssperre verschluckt Tipps 0,9 s nach einem Wechsel ohne Rückmeldung
  („Weiter →", Auswahl in „Für welche Sammlung?"): bekannt aus R5-S2 und
  R5-G5, in meinen Läufen wiederholt aufgefallen.
- Fehlerseite: „Technische Angabe" und „Alle Daten löschen" sehen wie
  Fließtext aus: `neuer-nutzer.md`.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Pflichtfelder an den Eingängen:** Einsatz-Datei mit drei Bögen (einer ohne
  Einheitstyp, einer ohne Organisation): „Einsatz „Importtest" übernommen: 2
  Einheiten … 1 von 3 Bögen ist unvollständig (die Organisation der Einheit
  fehlt) und wurde nicht übernommen." Datei, in der alles unlesbar ist: „Kein
  Bogen in der Datei ist lesbar — …", keine leere Sammlung. Einzelbogen ohne
  Einheitstyp: öffnet mit „(Einheitstyp offen)".
- **Entwurf ohne Einheitstyp** (auch auf dem Rückholplatz) lässt sich
  fortsetzen bzw. zurückholen; Übergabe als PDF funktioniert. „Entwurf ohne
  Organisation": Karte „Ein gespeicherter Bogen ließ sich nicht öffnen —
  Ursache: …", nichts überschrieben.
- **Fehlerseite:** Alltagssprache, „Deine Daten liegen weiter auf diesem
  Gerät", „Daten sichern" liefert `eeb-sicherung-….json`, „Alle Daten
  löschen" nur mit Haken.
- **Dateifehler:** abgeschnittene JSON, leere Datei, PNG, Schema 99,
  Sicherung am falschen Eingang, kaputtes PDF, JSON-Array, Textdatei: jeweils
  ein Satz mit Ursache und nächstem Schritt, kein Eingriff in den Bestand.
- **„Stärke ändern…":** 0 / 0 / 0 → „Stimmt die Stärke? … zählt dann weder in
  der Stärke noch in der Verpflegung … bleibt „Abrücken"" mit „Zahlen
  korrigieren"; danach Quittung „Stärke 12 → 0 geändert" mit „Rückgängig".
  Doppeltipp 120, 300, 600, 900, 1 300, 1 800 ms: je genau eine neue Fassung.
  Voller Speicher: Hinweis „Gewünscht war für „…": Stärke 0 / 2 / 5 / 7
  (bisher 0 / 3 / 9 / 12). Bitte auf dem Meldeblock notieren …", Karte
  unverändert.
- **Uhr zurückgestellt (120 Tage):** „⚠ Geräteuhr prüfen: … beim letzten Start
  war der 14.02.2027 (120 Tage danach) … Bis du antwortest, löscht und
  anonymisiert die App nichts."; „Stärke ändern…" gilt, steht obenauf, die
  alte Fassung liegt in der Historie.
- **„Als neue Fassung":** „Ist das dieselbe Einheit?" mit Gegenüberstellung;
  nach „Ja — als neue Fassung" genau ein „Rückgängig"
  („Zusammengelegt: … — „Rückgängig" führt sie als eigene Einheit."), kein
  zweiter Link im Kasten; „Rückgängig" führt „THW Crailsheim" als eigene
  Einheit, die alte bleibt wie vorher, ein Nachtipp nach 150 ms hat nichts mehr
  zu treffen.
- **„Stimmt die Zeit?":** „Eingetroffen um" 23:59 um 11:26 → „Zeit
  korrigieren" vorn, „Trotzdem heute 17.10.2026, 23:59", „Gestern …"; „Zeit
  korrigieren" lässt den Wert im Feld. An der Karte: 36 Stunden voraus →
  „liegt in der Zukunft — Tag oder Monat vertauscht?" mit „Ja, so speichern"
  und „Zeit korrigieren".
- **Zurück-Geste:** Rückfrage auf dem ersten Verlaufseintrag („Angefangenen
  Bogen verwerfen?") wird geschlossen, die Startseite bleibt, der Entwurf
  auch.
- **Neuladen mitten in der Eingabe:** 0, 50, 300 und 1 200 ms nach dem Tippen:
  Name im Entwurf, Startseite bietet „Fortsetzen".
- **Speicher voll beim eigenen Bogen:** „In Einsatz-Sammlung ablegen…" zeigt
  „Speichern fehlgeschlagen …" im geöffneten Dialog.

## Abschluss

- **Aufgabe geschafft:** eigener Bogen: ja. Meldekopf: ja, mit Umweg bei vollem
  Speicher in der Erfassung (R6-E2); bei schon gespeicherten, unvollständigen
  Beständen nein (R6-E1).
- **Fremde Hilfe nötig:** nein, bis auf den Fall eines Altbestands, der die
  Fehlerseite auslöst (R6-E1); der Ausweg ist das Löschen.
- **Größtes Missverständnis:** „Neu laden" auf der Fehlerseite wirkt wie die
  Lösung, wiederholt aber nur den Absturz (R6-E1); „✓ gespeichert" bleibt
  stehen, obwohl das Übernehmen scheiterte (R6-E2).
- **Größtes Einsatzrisiko:** Der Helfer übernimmt eine Einheit am Meldekopf,
  der Speicher ist voll, und er sieht davon nichts (R6-E2).
- **Top-Priorität für die nächste Iteration:** Gelesene Bestände mit derselben
  Pflichtfeldprüfung wie die Eingänge lesen und die betroffene Sammlung
  beiseitelegen (R6-E1); den Speicherfehler beim „In Einsatz übernehmen" als
  Rückfrage zeigen (R6-E2).

## Abgleich mit Runde 5

Grundlage: [../runde-5/fehler-und-wiederanlauf.md](../runde-5/fehler-und-wiederanlauf.md)
samt „Stand der Behebung" und [../runde-5/README.md](../runde-5/README.md).

| Runde-5-Befund | Stand laut Runde 5 | Bewertung Runde 6 | Beobachtung |
| --- | --- | --- | --- |
| R5-E1 Unvollständiger Bogen macht die App weiß (P1) | behoben | hält an den Eingängen, nur teilweise beim Bestand | Einsatz-Datei, Einzelbogen, Entwurf: ergänzt oder mit Ursache abgelehnt, Entwurf beiseitegelegt, Fehlerseite statt weißem Bild. Der Bestand im Speicher und die Sicherung werden nicht geprüft: Sammlung ohne Einheitstyp stürzt beim Öffnen ab, Vorlage ohne Fahrzeuge schon die Startseite; „Neu laden" wiederholt den Absturz (R6-E1). Die gesicherte Datei des beiseitegelegten Entwurfs lässt sich nicht einlesen (R6-E3). |
| R5-E2 Nach zurückgestellter Uhr gilt „Stärke ändern…" nicht (P1) | behoben, im Browser nicht nachgestellt | hält (jetzt im Browser belegt) | 120 und 30 Tage zurück: neue Fassung gilt und steht obenauf. Nebenwirkungen: „neu gemeldet" statt Folgemeldung, gemischte Zeiten, Zukunftshinweis ohne Bezug zur Uhr (R6-E5). |
| R5-E3 Zwei „Rückgängig" mit gegensätzlicher Wirkung (P2) | behoben | hält | Genau ein „Rückgängig", Text sagt „führt sie als eigene Einheit". Wer die neue Meldung ganz loswerden will, nimmt danach „Entfernen"; das ist der gewollte zweite Weg. |
| R5-E4 Daumenleiste kürzt die Folge weg (P2) | behoben | hält | „Stärke 12 → 0 geändert: „THW …"" steht vorn, die Folge ist lesbar. |
| R5-E5 „Stimmt die Zeit?" stellt die Zukunftszeit vor (P3) | behoben | hält | „Zeit korrigieren" ist der erste Knopf und lässt den Wert im Feld. |
| R5-E6 „Stärke ändern…" 0 / 0 / 0 ohne Rückfrage (P3) | behoben | hält | Rückfrage „Stimmt die Stärke?" mit Hinweis auf „Abrücken". Für die Schnellerfassung gilt die obere Plausibilität nicht (R6-E6). |
| R5-E7 Voller Speicher bei „Stärke ändern…": Eingabe weg (P3) | behoben | hält, Lücke daneben | Hinweis nennt gewünschte und bisherige Stärke. Dieselbe Lage beim „In Einsatz übernehmen" der Erfassung zeigt keinen Hinweis im sichtbaren Bereich (R6-E2). |
| R5-S5 Zurück-Geste bei Rückfrage verlässt die App (Quelle: Stress) | behoben | hält, Nebenwirkung | Die Rückfrage auf dem ersten Eintrag wird geschlossen; nach bestätigter Rückfrage braucht es einen Zurück-Tipp mehr ohne Wirkung (R6-E4). |
| R5-D1 Geräteuhr-Sprung (Quelle: Zerstörende Handlungen) | behoben | hält | Warnung ab 60 Tagen, nichts wird gelöscht, bis geantwortet ist; bei 30 Tagen keine Warnung, nur der Zukunftshinweis an den Karten. |

Bilanz: Sieben eigene Befunde aus Runde 5 sind beobachtet, alle Behebungen
halten an den Stellen, an denen sie gedacht waren. Nur teilweise wirkt R5-E1:
Das Fangnetz fängt den Absturz auf, hilft aber nicht aus dem Zustand heraus,
und die Prüfung gilt nur für Neues (R6-E1, R6-E3). Verkehrt hat sich keine
Behebung; an drei Stellen sitzt eine Lücke neben der Behebung (R6-E2 neben
R5-E7, R6-E4 neben R5-S5, R6-E5 neben R5-E2). R6-E6 ist neu und gehört zu
R5-E6.

## Stand der Behebung

Stand 23.10.2026, auf demselben Zweig mit Typprüfung, Unit-Tests, Verhaltenstests (137 von 137 Szenarien) und, wo es sich messen ließ, Nachmessung im Browser (Playwright, Produktionsbuild). 6 behoben, 0 teilweise, 0 offen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R6-E1 | behoben | Sammlungen und Vorlagen werden beim Lesen wie an den Eingängen geprüft (`einsaetze-lesen.ts`, `vorlagen.ts`): Ergänzbares wird ergänzt, Unbrauchbares bleibt in der Ansicht weg. Unit-Tests für Vorlage und Sammlung ohne Einheitstyp/Fahrzeuge. Ein Bogen ohne Pflichtfeld wird nicht beiseitegelegt, sondern in der Ansicht ausgelassen (der Speicher bleibt unverändert). |
| R6-E2 | behoben | Bei vollem Speicher zeigt „In Einsatz übernehmen“ einen Dialog mit der Stärke zum Notieren, die Eingaben bleiben stehen. |
| R6-E3 | behoben | Die gesicherte Hülle des beiseitegelegten Entwurfs wird von „Aus Datei laden…“ gelesen; fehlt ein Pflichtfeld, nennt die Meldung es und sagt, dass die Datei nur der Support-Stelle dient. Nach „Als Datei sichern“ steht eine Bestätigung. |
| R6-E4 | behoben | Ein Ansichtswechsel nach beantworteter Rückfrage ersetzt deren Verlaufseintrag (`rueckfrageEintragErsetzbar`); kein Zurück-Tipp ohne Wirkung (im Browser belegt: vom Assistenten bis zum Verlassen zwei Zurück-Tipps, vorher drei). |
| R6-E5 | behoben | Die Folgemeldung wird nach der Fassungsfolge bestimmt, nicht nach der Eingangszeit (`folgeAenderung`). Unit-Test. |
| R6-E6 | behoben | „In Einsatz übernehmen“ stellt dieselbe Zahlendreher-Frage wie „Stärke ändern…“. Ein negatives Feld wird weiter still zu 0. |
