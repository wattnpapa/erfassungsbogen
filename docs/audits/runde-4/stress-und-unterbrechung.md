# Audit „Stress und Unterbrechung", Runde 4 (Zeitdruck, Ablenkung, Wiedereinstieg)

Stand: 05.10.2026 · Prüfer: Rollenaudit `thw-stress-test-user` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 3dd2ab5.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-3-Befunde.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, Zeitzone
Europe/Berlin, ohne Kamera. Eine Gegenprobe lief quer mit 640 × 360. Jeder
Ablauf hatte einen eigenen Browser-Kontext. Am selben Server arbeiteten elf
weitere Prüfer, deshalb gelten Zeitangaben nur als Abstände im Skript, nicht
als Bedienzeiten. Doppeltipps habe ich mit `touchscreen.tap` an derselben
Bildstelle ausgelöst, die Zurück-Geste mit `history.back()` nachgestellt.
Getestet habe ich zuerst ohne Blick in frühere Berichte. Den Runde-3-Bericht
samt „Stand der Behebung" und die Runde-3-README habe ich danach gelesen, die
übrigen Runde-4-Berichte erst zum Schluss.

Zustände über `localStorage`-Seeds aus `examples/thw/`, jeweils mit
`uebung: false`: `eeb.entwurf.v1` mit 001 Albstadt (Schritt 1, 3 oder 6),
010 Radolfzell als eigener Bogen im Hintergrund, 013 Ulm als angefangene
Fremd-Erfassung, `eeb.einsaetze.v1` mit der Sammlung „Hochwasser Albstadt"
(001–003 bzw. 001–006) und `eeb.vorlagen.v1` mit einer Vorlage aus 001. Der
Bogen-Link für 016 Bamberg stammt aus „Weitere Formate → Link teilen" der App
selbst. Ein Seed wird je Kontext nur einmal gesetzt. Ein früher Lauf, der den
Seed in jedem neuen Tab erneut schrieb, hatte einen Scheinkonflikt zwischen
zwei Fenstern erzeugt. Dieser Lauf ist verworfen.

Rolle: ein Gruppenführer, der den eigenen Bogen zwischen Fahrzeug und Funk
führt, und ein Helfer am Meldekopf, der nebenbei Einheiten aufnimmt und dabei
angesprochen wird.

Szenarien:

1. **Unterbrechung beim Tippen:** Neuladen sofort und 300 ms nach dem Tippen,
   Tab schließen, Seite in den Hintergrund (`visibilitychange`/`pagehide`),
   Browser-Zurück und -Vor durch den Assistenten, Drehen ins Querformat mit
   offener Vorschlagsliste.
2. **Zurück-Geste bei offenem Fenster:** Datenschutz, „Person entfernen",
   „Bogen übergeben…", „In Einsatz-Sammlung ablegen…", „Verwerfen",
   Schnellerfassung (Sammlungswahl), „Einsatz löschen…", „Einheit für den
   Einsatz erfassen?".
3. **Doppeltipp** mit 120 bis 1 800 ms Abstand auf „Weiter →", „Neuen Bogen
   erstellen", „Fortsetzen", „‹ Startseite", „← Zurück", „Öffnen",
   „Einheit manuell erfassen…", „In Einsatz übernehmen", „Abrücken",
   „Verwerfen", „Einsatz löschen…", „Löschen…", „Bogen schließen",
   Vorlage „Löschen", „Alle Daten löschen", „Person entfernen",
   „Fahrzeug entfernen".
4. **Zwei Aufgaben auf einem Telefon:** eigener Bogen im Hintergrund, dann
   Fremd-Erfassung, Abbruch, zweite Fremd-Erfassung; Vorlage in Bearbeitung,
   dann „Einsatz vorbereiten".
5. **Zwei Fenster:** derselbe Entwurf in zwei Tabs, beide tippen, beide
   Antworten auf die Konfliktwarnung; ein früher geöffneter Tab ohne Entwurf
   legt einen neuen Bogen an; Sammlung in zwei Tabs.
6. **Eingehender Link:** Bogen-Link im laufenden Tab (`hashchange`) und als
   neuer Tab, während ein eigener Bogen offen ist.
7. **Rückkehr nach 25 Minuten** (Uhr vorgestellt) in einer Schnellerfassung,
   mit Neuladen dazwischen.
8. **Links:** Kopf- und Fußzeilen-Links im selben und im neuen Tab.

Nicht prüfbar: echter Lärm und echte Unterbrechung durch Personen, die
Bildschirmtastatur, die Zurück-Geste der installierten PWA und der nativen
Builds (nur `history.back()`), echte Doppeltipps mit Handschuh (Abstand und
Trefferfläche nachgestellt), Kamera- und Handscanner, Messenger-Verhalten
beim Öffnen eines Links, echte Bedienzeiten unter Last.

## Urteil

Was Runde 3 als gefährlich fand, ist zu: Ein Bogen-Link bei offener App
fragt jetzt und legt den eigenen Bogen mit dem zuletzt getippten Stand auf
den Rückholplatz. Ein eigener Bogen nach Meldekopf-Aushilfe hat keinen
Aufnahme-Kontext mehr. Ein zweites Fenster fragt vor dem Überschreiben. Die
Vorschlagsliste liegt unter der Leiste. Ein zögernder Doppeltipp auf
„Abrücken" bleibt abgerückt, und nach 25 Minuten Pause fragt die App nach der
Eintreffzeit. Das Autosave hält jede Unterbrechung aus, die ich nachstellen
konnte. Auch ein Neuladen 0 ms nach dem letzten Buchstaben verliert nichts.

Reibung entsteht an zwei Stellen, die ein Helfer unter Stress reflexhaft
benutzt. Die erste ist die Zurück-Geste: Bei offener Rückfrage schließt sie
nicht die Rückfrage, sondern wechselt die Ansicht dahinter. Die Rückfrage
bleibt dann über der falschen Seite stehen und wirkt von dort, ohne
„Rückgängig" (R4-S1). Die zweite ist die Konfliktwarnung zweier Fenster:
„Meine Fassung behalten" klingt wie die sichere Wahl, verwirft aber den Stand
des anderen Fensters ohne Rückholplatz (R4-S4). Der gemessene Doppeltipp auf
Rückfragen steht schon als R4-G1 im Bericht „Handschuh-Bedienung". Er trifft
am Meldekopf auch eine Fremd-Erfassung, die dann endgültig weg ist (siehe
„Bestätigt aus anderen Runde-4-Berichten").

Die Kernaufgaben gelingen ohne fremde Hilfe. Wer nach einer Unterbrechung
mit der Zurück-Geste „raus" will, steht aber auf der Startseite vor einer
Frage zu einem Bogen, den er nicht mehr sieht.

## Befunde

### R4-S1 [P2] Zurück-Geste bei offener Rückfrage: Die Ansicht dahinter springt, die Rückfrage bleibt stehen und wirkt ohne Rückweg (neu)

**Priorität:** P2

**Nachweis:** gemessen (Ansicht und offene `dialog`-Elemente vor und nach
`history.back()`, Speicherinhalt nach Bestätigen, Screenshots
`27-einsatz-loeschen`, `27-wizard-person-entfernen`, `28-A`).

**Fundstelle / Aufgabe:** Alle Rückfragen der Dialogschicht
(`src/app/dialoge.tsx`, `Dialogschicht`/`Dialogfenster`) sowie die Fenster
„Bogen übergeben" und „In Einsatz-Sammlung ablegen". Einen eigenen
Verlaufseintrag, der die Zurück-Geste abfängt, hat nur das QR-Vollbild
(`src/app/modal-overlay.ts`, `ebeneBetreten`/`useEbeneZurueck`, genutzt in
`src/app/schritte/uebersicht.tsx`).

**Beobachtung:**

| Offen | Ansicht vorher | Nach Zurück | Fenster danach |
| --- | --- | --- | --- |
| „Lang, Sabine entfernen?" | 3. Personal | Startseite | **bleibt offen** |
| „Einsatz löschen?" | Einsatzansicht | Startseite | **bleibt offen** |
| „Einheit für den Einsatz erfassen?" | Einsatzansicht | Startseite | **bleibt offen** |
| Datenschutz (Fußzeile im Assistenten) | 3. Personal | Startseite | geschlossen |
| „Bogen übergeben" / „In Einsatz-Sammlung ablegen" | Übersicht | 3. Personal | geschlossen |
| „Angefangenen Bogen verwerfen?" / Sammlungswahl der Schnellerfassung | Startseite | App verlassen | – |

„Person entfernen" in der stehengebliebenen Rückfrage über der Startseite
bestätigt: Die Person fehlt danach im Entwurf (Stärke 1 / 1 / 2 / 4 →
0 / 1 / 2 / 3). Es war die Zugführerin, also die Ansprechperson an erster
Stelle. Eine Quittung oder ein „Rückgängig" gibt es nicht. Im Assistenten
selbst steht nach demselben Schritt eine Daumenleiste mit „Rückgängig".
„Einheit erfassen" aus der stehengebliebenen Rückfrage öffnet die
Fremd-Erfassung, der eigene Bogen geht dabei auf den Rückholplatz.

**Erwartung der Rolle:** Die Zurück-Taste ist mein „Abbrechen". Sie schließt,
was gerade oben liegt, und sonst nichts.

**Auswirkung im Einsatz:** Wer angesprochen wird und das Fenster mit der
Zurück-Geste wegwischt, verliert die Stelle im Bogen und sieht eine
Löschfrage über einer Seite, zu der sie nicht gehört. Bestätigt er sie, weil
er das Löschen ja wollte, wirkt sie auf einen Bogen, den er nicht sieht, und
der Rückweg aus dem Assistenten fehlt. Der Bericht „Fehler und
Wiederanlauf" hat dasselbe unabhängig an „Stärke ändern" gemessen: „Stärke
übernehmen" wirkte von der Startseite aus auf die Sammlung, ohne Quittung.

**Empfehlung:** Jede Rückfrage und jedes Fenster wie das QR-Vollbild
behandeln: Beim Öffnen einen Verlaufseintrag anlegen, Zurück schließt nur
das Fenster als „Abbrechen", die Ansicht dahinter bleibt.

**Nachprüfung:** „Person entfernen", „Einsatz löschen…", „Einheit manuell
erfassen…" mit eigenem Bogen im Hintergrund, „Bogen übergeben…" und
Datenschutz öffnen, jeweils Zurück: Das Fenster ist zu, die Ansicht dieselbe
wie vorher, im Speicher hat sich nichts geändert.

### R4-S4 [P2] Zwei Fenster: „Meine Fassung behalten" verwirft den Stand des anderen Fensters ohne Rückholplatz; die Warnung sagt nicht, was sich unterscheidet (neu)

**Priorität:** P2

**Nachweis:** gemessen (zwei Tabs in einem Browser-Kontext,
`eeb.entwurf.v1` und `eeb.entwurf.ersetzt.v1` nach jedem Schritt).

**Fundstelle / Aufgabe:** Konfliktwarnung „⚠ Dieser Bogen wurde in einem
anderen Fenster geändert …" mit „Stand aus dem anderen Fenster laden" und
„Meine Fassung behalten". Code: `src/app/fenster-abgleich.tsx` (`behalten`,
`neuLaden`) und `entwurfUeberschreibenErlauben()` in `src/app/entwurf.ts`.

**Beobachtung:**

- Gleicher Entwurf in Tab A und B. A tippt „A-Ort", B tippt „B-Ort". B zeigt
  die Warnung, „B-Ort" steht nur im Feld. B tippt „Meine Fassung behalten":
  Im Speicher steht „B-Ort", der Rückholplatz bleibt leer. A zeigt jetzt
  selbst die Warnung, „A-Ort" ist nirgends mehr gespeichert.
- Fall aus R3-S3: Tab B legt neu an, TabA geht richtig auf den Rückholplatz.
  Tab A tippt dann „Meine Fassung behalten": Im Speicher stehen TabA als
  Entwurf **und** TabA auf dem Rückholplatz. TabB ist in keinem Schlüssel
  mehr. Wird Tab B danach geschlossen, zeigt die Startseite zweimal
  „THW TabA" und nichts von TabB.
- Die Warnung nennt weder den anderen Stand (Uhrzeit, Feld, Name) noch, was
  „behalten" mit dem anderen Fenster macht.
- „Stand aus dem anderen Fenster laden" lädt neu und landet auf der
  Startseite, nicht im Schritt, in dem man war. Das kostet einen Tipp auf
  „Fortsetzen".

**Erwartung der Rolle:** „Meine Fassung behalten" heißt für mich: Meins geht
nicht verloren. Dass dabei das andere Fenster verliert, muss dastehen, oder
das andere landet auf dem Rückholplatz.

**Auswirkung im Einsatz:** Auf dem Telefon geht ein geteilter Link oft im
Browser auf, während die App schon offen ist (Code-Kommentar in
`fenster-abgleich.tsx`). Wer im zweiten Fenster weitergearbeitet hat und im
ersten die beruhigend klingende Antwort tippt, verliert die neuere Arbeit
ohne Hinweis.

**Empfehlung:** Bei „Meine Fassung behalten" den überschriebenen Stand auf
den Rückholplatz legen, wie es „Neuen Bogen erstellen" im anderen Fenster
schon tut, oder die Folge in den Knopftext schreiben. In der Warnung den
anderen Stand kurz nennen („anderes Fenster: 23:07, Einsatzort geändert").
Nach „laden" in den Schritt zurückkehren, in dem man war.

**Nachprüfung:** Beide Abläufe wie oben: Nach „Meine Fassung behalten" liegt
der Stand des anderen Fensters auf dem Rückholplatz (oder die Rückfrage sagt,
dass er verloren geht). Die Startseite zeigt keinen Bogen doppelt.

### R4-S2 [P3] Doppeltipp auf „Weiter →" überspringt einen Schritt (neu)

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Assistent, Leiste unten, „Weiter →". Code: Leiste
des Assistenten in `src/app/app.tsx`. Die Ortssperre aus
`src/app/tipp-schutz.ts` gilt hier nicht.

**Beobachtung:** Zwei Tipps an derselben Stelle mit 150, 350 und 700 ms
Abstand: Schritt 1 → Schritt 3. Nach dem ersten Tipp liegt dort wieder
„Weiter →". Schritt 2 (Zeitraum, Einsatzort, „Übung") bleibt ungesehen, die
Schrittleiste zeigt dort keine Marke. Bei einem neuen Bogen meldet die
Übersicht später „Ort/Auftrag ist noch leer" als offenen Punkt.

**Erwartung der Rolle:** Ein unsicherer zweiter Tipp darf mich nicht an
einer Seite vorbeischieben, die ich nie gesehen habe.

**Auswirkung im Einsatz:** Gering, weil die Übersicht den leeren Ort
auffängt. Ein vorbelegter, aber falscher Zeitraum oder das Kreuz „Übung"
fallen dort aber nicht auf.

**Empfehlung:** „Weiter →" nach dem Wechsel kurz an der Fingerstelle sperren
(Ortssperre wie bei „Abrücken").

**Nachprüfung:** Doppeltipp mit 300 und 700 ms auf „Weiter →" in Schritt 1:
Schritt 2 ist offen.

### R4-S3 [P3] Zweiter Tipp auf „Neuen Bogen erstellen" öffnet das Darstellungsmenü (neu)

**Priorität:** P3

**Nachweis:** gemessen (Element unter dem Finger nach dem ersten Tipp,
Screenshot `07-neu-doppel-150`).

**Fundstelle / Aufgabe:** Startseite ohne Entwurf, „Neuen Bogen erstellen"
doppelt (150, 350, 700 ms).

**Beobachtung:** Nach dem ersten Tipp liegt an derselben Stelle die Leiste
des Assistenten mit „◐". Der zweite Tipp öffnet die Auswahl „Standard /
Dunkel / Feld / Nacht" über dem Formular. Ein dritter Tipp an derselben Stelle
stellt die Darstellung um.

**Erwartung der Rolle:** Ich will einen Bogen anfangen. Ein Menü, das ich
nicht gerufen habe, verdeckt das erste Feld.

**Auswirkung im Einsatz:** Kurze Verwirrung, im ungünstigen Fall wechselt die
Anzeige auf „Nacht" oder „Dunkel", und der Helfer sucht, wie er zurückkommt.

**Empfehlung:** Nach einem Ansichtswechsel die Fingerstelle kurz sperren.
Das löst R4-S2 gleich mit.

**Nachprüfung:** Doppeltipp mit 300 und 700 ms auf „Neuen Bogen erstellen":
Schritt 1 ohne offenes Menü.

### R4-S5 [P3] Kleinere Stellen beim Wiedereinstieg (neu)

**Priorität:** P3

**Nachweis:** beobachtet; die Uhrzeit am Rückholplatz zusätzlich im Code
nachgesehen.

**Beobachtung:**

- **Eine Fremd-Erfassung zur Zeit:** Ist „THW Einheit-A" angefangen und
  kommt eine zweite Einheit dazu, bietet „Einheit manuell erfassen…" nur
  „Diese Erfassung fortsetzen" oder „Verwerfen und neue Einheit erfassen".
  Der Dialog sagt die Folge klar. Zwei Einheiten, die gleichzeitig vor dem
  Meldekopf stehen, lassen sich aber nicht parallel anfangen. Die halbe
  Erfassung geht verloren oder muss erst fertig werden.
- **„Stand" am Rückholplatz:** „Zuletzt verdrängter Bogen · Stand 22:45" nennt
  den Zeitpunkt des Verdrängens, nicht den der letzten Bearbeitung
  (`ersetztenEntwurfMerken` in `src/app/entwurf.ts` speichert `Date.now()`).
  Ein Bogen, der um 22:40 zuletzt bearbeitet war, wirkt dadurch neuer, als er
  ist. Bei zwei Bögen mit derselben Einheit (siehe R4-S4, R4-E2) hilft die
  Zeit dann nicht beim Unterscheiden.
- **Drei Schritte bis zum Bogen aus der Vorlage:** Musterung → „Alle aus der
  Vorlage dabei?" → „Bogen aus Vorlage anlegen?" (wenn eine
  Vorlagen-Bearbeitung offen ist). Jeder Schritt ist für sich begründet, unter
  Zeitdruck sind zwei Rückfragen hintereinander aber eine zu viel.

**Empfehlung:** Eine angefangene Fremd-Erfassung beim Wechsel parken statt
verwerfen, mindestens eine zweite. Am Rückholplatz die Zeit der letzten
Bearbeitung zeigen. Die beiden Rückfragen vor „Einsatz starten" zu einer
zusammenfassen.

**Nachprüfung:** Zwei Erfassungen nacheinander anfangen, beide sind danach in
der Sammlung als angefangen sichtbar. Bogen um 22:40 bearbeiten, um 22:45
verdrängen: Rückholplatz nennt 22:40.

## Bestätigt aus anderen Runde-4-Berichten

Unabhängig nachgestellt, hier nicht mitgezählt:

- **R4-G1 [P1] Rückfragen: Zweiter Tipp nach gut einer halben Sekunde
  bestätigt** ([handschuh-bedienung.md](handschuh-bedienung.md)). Gemessen
  an „Verwerfen" auf der Startseite: Auslöser bei y 358, Bestätigen der
  Rückfrage bei y 367–411. 300 ms: Rückfrage bleibt offen; 500, 650, 800,
  1 000 und 1 400 ms: Bogen verworfen. Der Prellschutz der Dialogschicht
  liegt bei 450 ms (`src/app/dialoge.tsx`), die Ortssperre bei 1 500 ms.
  **Ergänzung aus Stresssicht:** Ist die offene Arbeit eine
  **Fremd-Erfassung** und liegt der eigene Bogen schon auf dem Rückholplatz,
  geht sie mit dem Doppeltipp **endgültig** verloren. Gemessen mit „THW Ulm
  Bergungsgruppe", 8 Personen erfasst, Doppeltipp mit 700 ms auf
  „Verwerfen": Entwurf leer, Rückholplatz weiter Radolfzell, Sammlung
  unverändert (3 Einheiten). Die Rückfrage hatte „Sie ist noch in keiner
  Sammlung und wird verworfen" gesagt, gelesen hat sie niemand. Dort ist
  also nicht nur Suchzeit verloren, wie R4-G1 für „Verwerfen" annimmt.
  „Einsatz löschen…", „Löschen…" (Startseite), „Bogen schließen",
  „Person entfernen", „Fahrzeug entfernen" und „Alle Daten löschen" blieben
  bei mir bei 700 ms offen, weil ihr Bestätigen nicht unter dem Finger lag.
- **R4-M5 [P2] Zurück-Geste im mehrteiligen QR-Vollbild**
  ([mobile-ui.md](mobile-ui.md)) gehört zur selben Ursache wie R4-S1: Nur
  dort fängt ein Verlaufseintrag die Geste ab, aber ohne Rückfrage zu den
  fehlenden Teilen.

## Bestätigtes

- **Autosave beim Tippen:** „Albstadt" in „Name (Pflicht)" tippen, ohne das
  Feld zu verlassen sofort neu laden, nach 300 ms neu laden, Tab schließen
  oder Seite in den Hintergrund schicken: In allen vier Fällen steht der Name
  im Speicher und auf der Startseite („Entwurf vom … wiederhergestellt").
- **Browser-Zurück und -Vor** gehen im Assistenten Schritt für Schritt
  (5 → 4 → 3 → 2 → 1, Vor → 2), ohne die App zu verlassen.
- **Bogen-Link bei offener App** (R3-S1): Rückfrage nach 300 und 1 500 ms
  mit Namen des eigenen Bogens. Nach „Meldung öffnen" liegt der eigene Bogen
  mit dem zuletzt getippten Kürzel auf dem Rückholplatz. Als neuer Tab
  dieselbe Rückfrage.
- **Eigener Bogen nach Meldekopf-Aushilfe** (R3-S2): „Neuen Bogen erstellen"
  fragt, legt die Fremd-Erfassung „THW Aalen" auf den Rückholplatz und
  öffnet mit „‹ Startseite", ohne „In Einsatz übernehmen", ohne `fremd`.
- **Fenster ohne Entwurf legt neu an** (R3-S3): Rückfrage „In einem anderen
  Fenster ist ‚THW TabA' angefangen (Stand …)", danach TabA auf dem
  Rückholplatz. Die Warnung im älteren Fenster steht auch beim Tippen weit
  unten auf der Seite im Bild (fester Streifen oben, etwa 0–178 px).
- **Vorschlagsliste** (R3-S4): Mit offener Liste („Neustadt", „Ulm") liegt
  unter der Mitte von „In Einsatz übernehmen" der Knopf. Der Tipp führt zur
  Rückfrage „Stärke fehlt", nicht zur Auswahl eines Ortsverbands. Quer
  (640 × 360) bleibt Eingabe und Fokus beim Drehen erhalten.
- **„Abrücken" doppelt** (R3-S5): 200, 700 und 1 200 ms → abgerückt, unter
  dem Finger „✓ Abgerückt". Erst nach 1 800 ms nimmt der zweite Tipp das
  Abrücken zurück, das ist bewusst.
- **Eintreffzeit nach Pause** (R3-S6): Schnellerfassung, 25 Minuten Uhr
  vorgestellt und neu geladen: „Wann ist die Einheit eingetroffen? … Um 22:56
  (Beginn der Erfassung) / Jetzt, 23:21".
- **Neuladen in der Fremd-Erfassung** (R3-S7): direkt zurück in Schritt 3 der
  Schnellerfassung mit „‹ Einsatz" und „In Einsatz übernehmen". Die Quittung
  „Zuletzt eingelesen: ‚THW Testheim' · jetzt 4 Einheiten, Gesamt 37" steht
  nach dem Übernehmen ganz im Bild.
- **„In Einsatz übernehmen" doppelt** (120 bis 1 000 ms): eine Meldung,
  keine zwei. Der zweite Tipp landet in der Einsatzansicht auf leerer Fläche
  oder im Text der Rückfrage „Stärke fehlt".
- **Rückfragen beim Wechsel:** Eigener Bogen im Hintergrund und „Einheit
  manuell erfassen…" fragt mit Namen und nennt den Rückholplatz. Vorlage in
  Bearbeitung und „Einsatz vorbereiten" fragt ebenso. Die Startseite
  kennzeichnet „Bearbeitung der Vorlage … — kein Einsatzbogen" und
  „Angefangene Erfassung für ‚Hochwasser Albstadt'".
- **Sammlung in zwei Tabs:** Abrücken in B erscheint sofort in A (3 → 2
  Einheiten), ein Abrücken aus A danach geht nicht verloren.
- **Gleicher Entwurf, zwei Fenster:** Das Fenster, das zuletzt geschrieben
  hat, speichert weiter, das andere hört auf und sagt es oben fest im Bild.
  Kein stilles Überschreiben (zum Ausgang der Entscheidung siehe R4-S4).

## Abschluss

- **Aufgabe geschafft:** eigener Bogen mit Unterbrechungen: ja. Meldekopf mit
  Unterbrechungen: ja. Mit Zurück-Geste aus einer Rückfrage heraus: mit
  Umwegen, man landet auf der Startseite vor einer verwaisten Rückfrage
  (R4-S1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Meine Fassung behalten" klingt nach
  Sicherheit, verwirft aber still die Arbeit im anderen Fenster (R4-S4).
- **Größtes Einsatzrisiko:** Ein zögernder zweiter Tipp auf „Verwerfen"
  löscht eine angefangene Fremd-Erfassung endgültig (Ergänzung zu R4-G1).
- **Top-Priorität für die nächste Iteration:** Rückfragen an Ortssperre und
  Zurück-Geste binden: 1,5 s Sperre an der Fingerstelle und Zurück schließt
  nur das Fenster (R4-G1, R4-S1).

## Abgleich mit Runde 3

Grundlage: [../runde-3/stress-und-unterbrechung.md](../runde-3/stress-und-unterbrechung.md)
mit „Stand der Behebung" und [../runde-3/README.md](../runde-3/README.md).

| Runde-3-Befund | Stand laut Tabelle | Bewertung Runde 4 | Beobachtung |
| --- | --- | --- | --- |
| R3-S1 Link bei offener App ersetzt den eigenen Bogen (P0) | behoben | **hält** | `hashchange` und neuer Tab: Rückfrage mit Namen, nach „Meldung öffnen" eigener Bogen samt zuletzt getipptem Kürzel auf dem Rückholplatz. |
| R3-S2 Eigener Bogen erbt Aufnahme-Kontext (P1) | behoben | **hält** | Nach abgebrochener Fremd-Erfassung: „Neuen Bogen erstellen" fragt, Bogen mit „‹ Startseite", kein Übernehmen-Knopf, kein `fremd`. |
| R3-S3 Zweites Fenster überschreibt den Entwurf (P2) | behoben | **hält, mit neuem Rest** | Rückfrage vor dem Anlegen und Rückholplatz wie gefordert, Warnung fest oben im Bild. Die Antwort „Meine Fassung behalten" verwirft aber den Stand des anderen Fensters ohne Rückholplatz (R4-S4). |
| R3-S4 Vorschlagsliste über der Leiste (P2) | behoben | **hält** | Unter der Knopfmitte liegt der Knopf, auch bei „Neustadt" und „Ulm". Folge mit offener Tastatur siehe R4-G3 (Handschuh-Bedienung), hier nicht prüfbar. |
| R3-S5 „Abrücken" doppelt trifft „Wieder anwesend" (P2) | behoben | **hält** | 200/700/1 200 ms → abgerückt. Dieselbe Ortssperre fehlt aber bei Rückfragen (R4-G1) und bei „Weiter →" (R4-S2). |
| R3-S6 Unterbrechung wird Eintreffzeit (P2) | behoben | **hält** | Rückfrage „Um 22:56 (Beginn der Erfassung) / Jetzt, 23:21", auch nach Neuladen. |
| R3-S7 Kleinere Stellen beim Wiedereinstieg (P3) | behoben | **hält** | Quittung nach dem Übernehmen ganz im Bild. Hinweis „Angefangene Erfassung" direkt unter den Aufnahme-Knöpfen. Neuladen führt in die Erfassung zurück. |
| Verweis R3-L1 Rückmeldung nach „Bögen einlesen…" | (anderer Bericht) | nicht nachgeprüft | Ohne QR-Bilddateien nicht nachgestellt. |
| Verweis R3-H1 Einstieg mitten im Formular | (anderer Bericht) | nicht nachgeprüft | Hier nicht gezielt gemessen. |

Bilanz: Alle sieben Runde-3-Befunde halten, auch der P0 R3-S1. Keiner hat
sich verkehrt. Bei R3-S3 bleibt ein Rest in der Antwort auf die
Konfliktwarnung (R4-S4). Die Ortssperre aus R3-S5 wirkt, ist aber auf
„Abrücken" und die Quittungsleiste beschränkt. Rückfragen (R4-G1) und
Ansichtswechsel (R4-S2, R4-S3) haben sie nicht. Neu sind R4-S1 bis R4-S5:
zwei P2, drei P3. R4-G1 und R4-M5 stehen in anderen Runde-4-Berichten und
sind hier nicht mitgezählt.

## Stand der Behebung

Stand 05.10.2026, Paket 1 „Rückfragen, Links, Rückholplatz, Zurück-Geste".
Geprüft mit Typprüfung, Unit-Tests (2 446 grün), Verhaltenstests (137
Szenarien grün) und Nachmessung im Dev-Server (360 × 640,
`isMobile`/`hasTouch`, de-DE, Port 5180). Aufgeführt sind nur die Befunde
dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R4-S1 Zurück-Geste bei offener Rückfrage | behoben | Der Verlaufs-Lauscher schließt zuerst das oberste offene Fenster wie Escape und legt den verbrauchten Eintrag neu an; QR-Vollbild und Scanner führen ihren Rücksprung selbst. Nachlauf (`history.back()`): „Person entfernen", „Einsatz löschen…", „Einheit manuell erfassen…" mit eigenem Bogen, „Bogen übergeben", „In Einsatz-Sammlung ablegen", Datenschutz — Fenster zu, Ansicht wie vorher, Speicher unverändert; zweites Zurück → Startseite. |
| R4-S2 Doppeltipp auf „Weiter →" überspringt einen Schritt | behoben | Jeder Ansichtswechsel sperrt die Fingerstelle 1,5 s. Nachlauf t07: 150/350/700 ms → „2. Einsatz". |
| R4-S3 Zweiter Tipp nach „Neuen Bogen erstellen" trifft „◐" | behoben | Dieselbe Sperre. Nachlauf t07: 150/350/700 ms → „1. Einheit", kein Darstellungsmenü. |
| R4-S4 „Meine Fassung behalten" verwirft das andere Fenster | weitgehend | Der Stand des anderen Fensters kommt auf den Rückholplatz; fiele dort ein dritter Bogen, fragt „Meine Fassung behalten?" und nennt ihn. Die Warnung nennt Name und Stand des anderen Fensters, aber nicht das geänderte Feld; „laden" kehrt in den Schritt zurück. Nachlauf zwei Tabs: A-Ort/B-Ort, B behält → Entwurf B-Ort, Rückholplatz A-Ort; Fall R3-S3 → Rückfrage, dann Entwurf TabA2, Rückholplatz TabB, kein Bogen doppelt; „laden" → „2. Einsatz". |
