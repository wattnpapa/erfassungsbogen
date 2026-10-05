# Audit „Neuer Nutzer", Runde 4 (THW-Helfer ohne Einweisung)

Stand: 05.10.2026 · Prüfer: Rollenaudit `thw-new-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 3dd2ab5.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-3-Befunde.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, ohne Kamera.
Jeder Lauf hatte einen eigenen Browser-Kontext. Der Server lief gleichzeitig
für elf weitere Prüfer, Zeiten habe ich deshalb nicht gewertet. Ein Teil der
Läufe begann mit leerem Speicher, alle Zustände entstanden dort durch
Bedienung. Die übrigen Läufe begannen mit `localStorage`-Seeds aus
`examples/thw/` mit `uebung: false`:

- Entwurf (`eeb.entwurf.v1`): THW Mühldorf Bergungsgruppe (024), Schritt 3.
- Vorlage (`eeb.vorlagen.v1`): „Meine B-Gruppe“ aus 013-ulm-b (8 Personen,
  2 Fahrzeuge).
- Einsatz-Sammlung „Hochwasser Donau“ (`eeb.einsaetze.v1`) mit acht
  Einheiten (001, 003, 005, 009, 013, 021, 024, 027), drei davon im Zug
  „1. TZ“, eine abgerückt.

Ich habe zuerst ohne Blick in Anleitung, Dokumentation oder frühere Berichte
getestet. Den Runde-3-Bericht samt „Stand der Behebung“, die Übersicht
`runde-3/README.md` und die schon vorliegenden Runde-4-Berichte habe ich erst
danach gelesen.

Rolle: Helfer eines THW-Ortsverbands, kennt den Papier-Erfassungsbogen, hat
die App nie gesehen. Szenarien:

1. **Eigenen Bogen melden:** leeres Gerät → „Neuen Bogen erstellen“ →
   Einheitstyp „Bergung“ → Bergungsgruppe → OV „Ulm“ aus den Vorschlägen →
   Ort/Auftrag → „Namen einfügen…“ mit fünf Namen → Fahrzeuge (ein
   Kennzeichen) → Sofortbedarf → Übersicht → „Bogen übergeben…“ →
   QR-Vollbild → „Ja, gescannt — übergeben“ → „Bogen schließen“. Dazu
   „Weitere Formate“ → „Link teilen“, „In Einsatz-Sammlung ablegen…“.
2. **Unterbrechen und wieder einsteigen:** Reload in der Übersicht,
   „Verwerfen“, „Neuen Bogen erstellen“ bei vorhandenem Entwurf, zweimal
   hintereinander verdrängt; Vorlage → „Einsatz vorbereiten“ → Musterung →
   „Einsatz starten“.
3. **Am Meldekopf aushelfen:** neue Sammlung anlegen; Sammlung „Hochwasser
   Donau“ öffnen → Karte aufklappen → „Abrücken“, „Mehr…“, „Rückfrage“;
   „Einheit schnell erfassen“ von der Startseite → nur Name → „In Einsatz
   übernehmen“.
4. **Fremden Bogen annehmen:** Den Link aus Szenario 1 auf einem
   Meldekopf-Gerät öffnen, das dieselbe Einheit (Ulm B) schon führt; eine
   Beispieldatei über „Aus Datei laden…“ der Startseite öffnen.

**Nicht prüfbar:** Kamera-Scan mit echtem Bild, USB-Handscanner, native
Datums- und Auswahllisten, Bildschirmtastatur, native Builds, echtes Drucken.
Die Datumsfelder rendert headless Chromium im US-Format („10/05/2026,
08:37 PM“), auch mit `--lang=de-DE`. Das werte ich nicht. PDF-Inhalt,
„StAN-Sollplätze laden“ und der Weg zurück nach einer falsch gewählten
„neuen Fassung“ (Historie) habe ich nicht geprüft.

## Urteil

Der eigene Bogen gelingt ohne Hilfe. Die Startseite trennt „Meinen Bogen
ausfüllen“ und „Bögen sammeln (Meldekopf)“ im ersten Bild. Einheitstyp und
OV-Vorschlag füllen Schritt 1 fast allein: Aus „Ulm“ werden Kürzel, Telefon,
Mail, RB Biberach und LV Baden-Württemberg. „Namen einfügen…“ zeigt vorher,
wer auf welchen Platz kommt („Müller, Max → Platz 1: GrFü“). Die Übersicht
nennt fünf offene Punkte zum Antippen. Nach dem QR-Vollbild fragt die App
„Hat die Gegenstelle den Code gescannt?“ und vermerkt danach „Übergeben
20:42 Uhr (bestätigt)“. Jede Rückfrage vor dem Verdrängen sagt, wo der alte
Bogen bleibt, und beim zweiten Verdrängen auch, welcher endgültig gelöscht
wird. Die Runde-3-Befunde halten durchweg. Die Rückfrage „Stärke fehlt“ am
Meldekopf ist da, die Quittung steht im Bild.

Reibung entsteht dort, wo ein Neuling eine Entscheidung treffen soll, für die
ihm die Grundlage fehlt. Am deutlichsten ist das bei der Rückfrage „Einheit
ist bereits gemeldet“: Sie verlangt „neue Fassung oder eigene Einheit“, zeigt
aber weder die alte noch die neue Stärke, weder Stand noch Führungskraft. Der
zweite Fall ist „Aus Datei laden…“ auf der Startseite. Am Meldekopf öffnet es
eine fremde Meldung als eigenen Bogen. Derselbe Bogen als Link fragt dagegen
„Wohin damit?“ und bietet die Sammlung an. Dazu kommen kleinere Stellen: Die
Kurz-Liste nach „Namen einfügen“ schiebt die Spalte Geschlecht aus dem Bild,
Marken wie „alt“ erklären sich nur per Tooltip, und der Platzhalter beim
Organisationsnamen lenkt den OV ins falsche Feld.

Aufgabe 1 und 2 gelingen ohne fremde Hilfe. Aufgabe 3 gelingt; die
Schnellerfassung fängt die fehlende Stärke ab. Aufgabe 4 gelingt technisch,
die Entscheidung bei der Doppelmeldung trifft der Neuling aber geraten.

## Befunde

### R4-N1 [P2] „Einheit ist bereits gemeldet“: Entscheidung ohne Vergleich von alter und neuer Meldung (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet; Dialogtext im Code nachgesehen.

**Fundstelle / Aufgabe:** Meldekopf-Gerät mit Sammlung „Hochwasser Donau“,
darin THW Ulm Bergungsgruppe (013, Stärke 0 / 2 / 6 / 8, GrFü Karsten
Lehmann). Den Link aus Szenario 1 geöffnet (THW Ulm Bergungsgruppe, Stärke
0 / 2 / 7 / 9, GrFü Max Müller, andere Personen und Fahrzeuge) → „In
‚Hochwasser Donau‘ aufnehmen“. Code: `src/app/app.tsx` Z. 1496–1517
(`frageWahl` mit Titel „Einheit ist bereits gemeldet“).

**Beobachtung:** Der Dialog sagt nur: „‚THW Ulm Bergungsgruppe‘ steht in
diesem Einsatz schon. Wie soll der neue Bogen dazu stehen?“ Darunter stehen
„Als neue Fassung anhängen“ (dunkel hervorgehoben, „Der Normalfall bei einer
Folgemeldung“) und „Als eigene Einheit führen“. Er nennt weder die bisherige
noch die neue Stärke. Er nennt auch nicht den Stand der beiden Meldungen,
ihre Führungskraft oder ihre Fahrzeuge. Erst nach der Wahl zeigt die
Quittung „Folgemeldung: Stärke 8 → 9 (+1) · 2 Fahrzeuge dazu · 2 Fahrzeuge
abgemeldet · … 8 weitere Änderungen“. Im Testfall waren alle Namen und beide
Kennzeichen anders. Dass es sich womöglich um eine zweite Gruppe handelt,
hätte man vorher sehen müssen.

**Erwartung der Rolle:** Bevor ich entscheide, ob das dieselbe Gruppe ist,
will ich beide nebeneinander sehen: Stärke, Gruppenführer, Kennzeichen, wann
gemeldet. Ohne Einweisung weiß ich nicht, was „Fassung“ hier heißt.

**Auswirkung im Einsatz:** Der Neuling nimmt den hervorgehobenen Knopf. Ist
es in Wahrheit eine zweite gleichnamige Gruppe (zweiter TZ desselben OV,
Annahme), verschwindet die erste aus der Summe in die Historie. Die Lage zählt
9 statt 17, Verpflegung und Unterbringung fehlen für eine ganze Gruppe.
Umgekehrt zählt „eigene Einheit“ bei einer echten Folgemeldung doppelt.

**Empfehlung:** Im Dialog beide Meldungen kurz gegenüberstellen: Stärke,
erste Person (Ansprechperson), Kennzeichen, Stand. Fallen keine Person und
kein Kennzeichen zusammen, deutlich darauf hinweisen („Keine gemeinsame
Person, kein gemeinsames Fahrzeug — vielleicht eine andere Gruppe?“).

**Nachprüfung:** Wie oben eine gleich benannte Einheit mit ganz anderem
Personal einlesen. Der Dialog muss beide Stärken und Führungskräfte zeigen
und auf die fehlende Überschneidung hinweisen. Bei einer echten Folgemeldung
(gleiche Personen, +1) darf kein Warnhinweis kommen.

### R4-N2 [P2] „Aus Datei laden…“ auf der Startseite öffnet eine fremde Meldung als eigenen Bogen, der Link fragt „Wohin damit?“ (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet; Ursache im Code nachgesehen.

**Fundstelle / Aufgabe:** Startseite eines Meldekopf-Geräts mit Sammlung
„Hochwasser Donau“ und eigenem Entwurf (Mühldorf B). Datei
`016-bamberg-fgr-w-a.json` über „Aus Datei laden…“ gewählt. Code:
`src/app/app.tsx` Z. 1005 (`darfBogenErsetzen`, danach `setBogen` und
Übersicht) gegenüber `empfangsZielWaehlen()` ab Z. 1650 (Link und Scan).

**Beobachtung:** Es kommt die Rückfrage „Bogen aus Datei öffnen? Der
angefangene Bogen ‚THW Mühldorf Bergungsgruppe‘ wird durch den Bogen aus der
Datei ersetzt …“. Nach „Datei öffnen“ steht Bamberg als eigener Bogen in der
Übersicht, mit „Bogen übergeben…“ als erstem Knopf. In die Sammlung kommt er
nur über „In Einsatz-Sammlung ablegen…“. Derselbe Bogen als Link fragt
dagegen sofort „Meldung von … empfangen. Wohin damit? In ‚Hochwasser Donau‘
aufnehmen / Bogen öffnen“. „Aus Datei laden…“ steht im ersten Bild unter
„Meinen Bogen ausfüllen“. Den passenden Weg „Bögen einlesen…“ gibt es nur in
der geöffneten Sammlung.

**Erwartung der Rolle:** Ich habe eine Datei von einer Einheit bekommen und
nehme den ersten Knopf mit „Datei“. Danach erwarte ich, dass die App mich
fragt, wohin die Meldung soll, so wie beim Link.

**Auswirkung im Einsatz:** Die Einheit fehlt in der Lage, obwohl der Helfer
sie „geladen“ hat. Sein eigener Entwurf liegt jetzt auf dem Rückholplatz.
Lädt er so eine zweite Datei, geht der eigene Bogen endgültig verloren. Die
Rückfrage nennt das, aber der Neuling liest an dieser Stelle nicht genau.

**Empfehlung:** Bei vorhandener Sammlung nach dem Laden dieselbe Frage
„Wohin damit?“ stellen wie bei Link und Scan. Erst „Bogen öffnen“ verdrängt
den eigenen Entwurf.

**Nachprüfung:** Mit Sammlung und Entwurf eine Bogendatei über die
Startseite laden. Die App muss die Sammlung anbieten. Bei „In … aufnehmen“
bleibt der Entwurf unberührt auf seinem Platz.

### R4-N3 [P3] Nach „Namen einfügen…“ springt die Ansicht in die Kurz-Liste, die Spalte Geschlecht liegt außerhalb des Bilds (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Schritt 3, „Namen einfügen…“ mit „Max Müller,
Anna Schmidt, Jonas Weber, Lena Fischer, Tim Becker“. Code:
`src/app/schritte/personal.tsx` Z. 838 (`setSchnell(true)`).

**Beobachtung:** Nach dem Übernehmen steht die Ansicht ohne eigenes Zutun auf
„Kurz-Liste (Tabelle)“. Die Tabelle ist 637 px breit, sichtbar sind 326 px.
Im Bild stehen Stelle, Vorname, Nachname und ein abgeschnittenes „ZÄ…“. Die
Spalte Geschlecht folgt rechts außerhalb. Gleichzeitig steht oben weiter „Alle
9 Personen stehen auf Geschlecht ‚männlich‘ — das ist die Vorbelegung. Bitte
prüfen“. Anna und Lena stehen auf „M“. Die Zeilen sind zudem rund 110–160 px
hoch, weil die ausgeblendeten Spalten die Höhe bestimmen.

**Erwartung der Rolle:** Die Warnung sagt, ich soll das Geschlecht prüfen.
Dann muss ich das Feld dazu auch sehen.

**Auswirkung im Einsatz:** Der Helfer wechselt zurück auf die Karten oder
wischt die Tabelle seitwärts, wenn er das überhaupt bemerkt. Sonst gehen
zwei Frauen als Männer in Unterbringung und WC/Dusche ein. Die Warnung
bleibt bis zur Übersicht stehen, darum P3.

**Empfehlung:** Auf dem Telefon nach „Namen einfügen“ in der Kartenansicht
bleiben, oder die Spalte Geschlecht in der Kurz-Liste direkt nach dem Namen
zeigen. Einen sichtbaren Hinweis geben, dass die Tabelle seitlich weitergeht.

**Nachprüfung:** Fünf Namen einfügen, bei 360 px ohne Seitwärtswischen das
Geschlecht der zweiten Person ändern können.

### R4-N4 [P3] Marken und gekürzte Hinweise an Sammlungskarten erklären sich nur per Tooltip (Rest von R3-N5)

**Priorität:** P3

**Kennzeichnung:** beobachtet; `title`-Attribute gemessen.

**Fundstelle / Aufgabe:** Sammlung „Hochwasser Donau“, Kartenliste. Code:
`src/app/einsaetze-ui.tsx` Z. 1813–1819 (`AltBadge`), Z. 2618 und
2624 (`luecken-merkmal`).

**Beobachtung:**
- Aufgeklappte Karte: „Stand 16.07.2026, 16:32 **alt** · Empfangen“. Was
  „alt“ heißt („Stand des Absenders liegt mehr als 24 Stunden vor dem
  Eintreffen“), steht nur im `title`. Was „Empfangen“ an dieser Stelle
  bedeutet, steht nirgends.
- Zugeklappte Karte: „Alle 12 Personen stehen auf Ge … + 2 weitere“ und
  „Kennzeichen auf Anh steht mehr … + 1 weitere“ brechen mitten im Wort ab.
  Den vollen Text gibt es nur im `title`. Ein Tipp darauf klappt die Karte
  auf, statt die Hinweise zu zeigen. Dort steht er erneut gekürzt als
  „Rückfrage: …“, erst ein zweiter Tipp zeigt ihn ganz.
- In der Sammlungsansicht tragen 40 sichtbare Elemente ein `title`. Bei den
  Aufnahme-Knöpfen ist das harmlos (die Unterzeile aus R3-N5 steht sichtbar
  daneben), bei den Marken nicht.

**Erwartung der Rolle:** Ein Wort wie „alt“ neben einer Uhrzeit sagt mir
entweder, was alt ist, oder ich kann es antippen und bekomme es erklärt.

**Auswirkung im Einsatz:** Der Aushelfer übersieht, dass die Zahlen eines
Bogens drei Monate alt sind, oder er hält „alt“ für einen Fehler der App.
Kurzes Zögern bei den abgeschnittenen Hinweisen.

**Empfehlung:** „alt“ ausschreiben („Stand älter als 24 h“) und „Empfangen“
durch die Herkunft ersetzen, die gemeint ist. Gekürzte Hinweise an einer
Wortgrenze abschneiden. Der erste Tipp darauf soll die Hinweise zeigen.

**Nachprüfung:** Einem ungeschulten Helfer die aufgeklappte Karte zeigen und
fragen, was „alt“ und „Empfangen“ bedeuten. Er muss es ohne Tooltip sagen
können.

### R4-N5 [P3] Schritt 1: Der Platzhalter „z. B. THW Ortsverband Ulm“ lenkt den OV ins Feld Organisationsname (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Neuer Bogen, Schritt 1. Code:
`src/app/schritte/einheit.tsx` Z. 205.

**Beobachtung:** Das zweite Feld heißt „Organisationsname (optional)“ und
schlägt „z. B. THW Ortsverband Ulm“ vor. Ich habe dort „THW Ortsverband Ulm“
eingetragen und „Bergungsgruppe“ gewählt. Die Bezeichnung zeigt danach
„THW Ortsverband Ulm Bergungsgruppe“, sieht also richtig aus. Das
Pflichtfeld „Name (Pflicht)“ der Ebene „OV – Ortsverband“ weiter unten
bleibt leer, mit Warnung „Der Name der eigenen Einheit (unterste Ebene)
fehlt“. „Weiter →“ geht trotzdem. Den OV-Vorschlag mit Kürzel, Telefon und
übergeordneten Stellen bekommt nur, wer den Ort unten einträgt.

**Erwartung der Rolle:** Der Ortsverband ist das, was das Beispiel zeigt. Den
trage ich dort ein, wo das Beispiel steht. Für dieselbe Angabe ein zweites
Feld zu finden, erwarte ich nicht.

**Auswirkung im Einsatz:** Kontaktdaten von OV, RB und LV fehlen auf dem
Bogen. Die Warnung bleibt bis zur Übersicht stehen, und dort steht der
Ortsname scheinbar schon in der Bezeichnung. Deshalb P3.

**Empfehlung:** Für THW ein Beispiel wählen, das nicht den OV-Namen enthält,
oder das Feld unter „Zugehörigkeit“ legen. Steht ein Ortsname im
Organisationsnamen und ist die Ebene leer, den OV-Vorschlag dafür anbieten.

**Nachprüfung:** Einen ungeschulten Helfer Schritt 1 für „B-Gruppe OV Ulm“
ausfüllen lassen. Er muss den Ort im OV-Feld eintragen und die Vorschläge
bekommen.

### R4-N6 [P3] Kleinere Stolpersteine (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Beobachtung:**
- Musterung aus der Vorlage: Der Startknopf heißt „Einsatz vorbereiten:
  Meine B-Gruppe“, der Abschlussknopf „Einsatz starten · 8 Pers · 2 Fz“.
  Gestartet wird nur der eigene Bogen (weiter in „2. Einsatz“). Für einen
  Neuling klingt „Einsatz starten“ nach Alarmierung oder Meldung an jemanden.
- Schnellerfassung: Die Marken im Kopf brechen als „Schnellerfa…“ und
  „Aufnahme für: Hochwas…“ ab (360 px).
- „In Einsatz-Sammlung ablegen…“ am eigenen Bogen: „Dein Bogen wird als
  Meldung abgelegt“. Dass dabei nichts das Gerät verlässt, steht dort nicht.
  Ein Gruppenführer kann das für die Übergabe an den Meldekopf halten
  (Risiko). „Bogen übergeben…“ steht darüber und ist hervorgehoben.
- Schritt 5 zeigt nur das Kästchen „Sofortbedarf erfassen“, ohne Satz dazu,
  was darunter fällt. Nach dem Anhaken ist es klar (Verpflegung,
  Betriebsstoff, Unterbringung, Ruhezeit).

**Erwartung der Rolle:** Knöpfe sagen, was passiert. Beschriftungen sind
lesbar.

**Auswirkung im Einsatz:** Kurzes Stutzen, im dritten Punkt im
ungünstigsten Fall ein nicht übergebener Bogen.

**Empfehlung:** „Bogen anlegen · 8 Pers · 2 Fz“ statt „Einsatz starten“.
Kopfmarken umbrechen statt kürzen. Bei „In Einsatz-Sammlung ablegen…“ den
Halbsatz „nur auf diesem Gerät — an den Meldekopf geht er über ‚Bogen
übergeben…‘“. Unter „Sofortbedarf erfassen“ eine Zeile mit den vier
Bereichen.

**Nachprüfung:** Jeden Punkt einzeln bei 360 px ansehen.

**Verweis:** Dass die Einheitenliste der Sammlung erst rund vier
Bildschirme tief beginnt (bei mir Überschrift bei 1 967 px, erste Karte bei
2 411 px) und dazwischen die Exportknöpfe stehen, hat der Führungssicht-Bericht
schon als [R4-K5](fuehrungssicht.md) festgehalten. Ein Neuling, der wissen
will „wer ist schon da“, stolpert über dieselbe Stelle.

## Bestätigtes

- **Startseite:** Zweck, Offline-Stand („Jetzt offline bereit …“) und die zwei
  Rollen im ersten Bild. Mit Vorlage steht „Einsatz vorbereiten: Meine
  B-Gruppe“ als erster Knopf, mit Sammlung „‚Hochwasser Donau‘ öffnen“ samt
  letzter Meldung.
- **Schritt 1:** „Bergung“ liefert B, B (ASH), FGr BT, FGr SB (A/B), SEEBA
  mit Langnamen. Der OV-Vorschlag „Ulm · OULM · 89079 Ulm“ füllt Kürzel,
  Telefon, Mail, RB und LV. Der Hinweis zur StAN-Vorbelegung („9 Personen
  (Namen offen), 2 Fahrzeuge … Vorbelegung entfernen“) steht direkt unter
  dem Einheitstyp. Der Platzhalter beim Einheitstyp passt jetzt zum THW
  („z. B. Bergungsgruppe, FGr Wasser…“).
- **Schritt 2:** Erklärt „Zeitraum bis“, „Einsatzbeginn eintragen“ und dass
  Meldekopf-Zeiten nicht zurückkommen.
- **Schritt 3:** „Namen einfügen…“ mit Vorschau je Zeile („→ Platz 1:
  GrFü“), Quittung „5 Namen übernommen — 5 davon in freie Sollplätze.
  Rückgängig“. Geschlecht überall ausgeschrieben („9 männl. / 0 weibl. /
  0 div.“). Die Ansprechpersonen-Regel steht sichtbar unter der ersten Karte.
- **Schritt 4:** „eigener Standort“ einzeilig, Erklärung darunter.
  „Vorbelegung entfernen (1 Fahrzeug ohne eigene Angaben)“ lässt den GKW mit
  Sondergerät stehen, nimmt nur den Anhänger und bietet „Rückgängig“.
- **Übersicht und Übergabe:** „Bogen übergeben…“ als erster Knopf, „5 offene
  Punkte — ansehen · Übergeben ist trotzdem möglich“. QR-Vollbild mit
  Einheit, Stärke und Stand, danach „Hat die Gegenstelle den Code gescannt?
  Die App kann das nicht selbst sehen“ und Vermerk „Übergeben 20:42 Uhr
  (bestätigt) — seitdem unverändert“. „Link teilen“ erklärt die
  Offline-Grenze.
- **Rückholplatz:** „Bogen schließen“, „Verwerfen“ und „Neuen Bogen
  erstellen“ fragen nach und sagen, wo der Bogen bleibt. Beim zweiten
  Verdrängen nennt die Rückfrage den Bogen, der endgültig gelöscht wird, mit
  Stand, Personenzahl und Auftrag. Nach einem Reload steht der Bogen oben mit
  „Fortsetzen“.
- **Meldekopf:** Neue Sammlung erklärt sich („Die Sammelmappe des
  Meldekopfs … Der eigene Bogen entsteht unter ‚Meinen Bogen ausfüllen‘“).
  Aufnahme-Knöpfe mit Unterzeile. „Abrücken“ quittiert mit Uhrzeit und
  „Rückgängig“. Die Schnellerfassung fragt zuerst nach der Sammlung und bei
  Stärke 0 „Stärke fehlt — Stärke eintragen / Trotzdem mit Stärke 0
  übernehmen“; „Stärke eintragen“ springt zu den Zählern.
- **Link-Empfang:** „Meldung von … empfangen. Wohin damit?“ mit der Sammlung
  als erstem Weg. Die Quittung nach der Aufnahme steht ganz im Bild
  (Szenario 4).
- **Scanner ohne Kamera:** klare Meldung, Handscanner-Anleitung, „QR aus
  Bild einlesen…“.

## Abschluss

- **Aufgabe geschafft:** eigener Bogen ja; Wiedereinstieg ja; Meldekopf ja;
  fremden Bogen annehmen mit Umwegen (R4-N1, R4-N2).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Aus Datei laden…“ auf der Startseite nimmt
  eine fremde Meldung nicht in die Sammlung auf, sondern öffnet sie als
  eigenen Bogen (R4-N2).
- **Größtes Einsatzrisiko:** Bei einer gleichnamigen Einheit wählt der
  Neuling ohne Vergleich „neue Fassung“, und eine ganze Gruppe fällt aus der
  Summe (R4-N1).
- **Top-Priorität für die nächste Iteration:** In der Rückfrage „Einheit ist
  bereits gemeldet“ alte und neue Meldung gegenüberstellen (R4-N1).

## Abgleich mit Runde 3

Grundlage: [../runde-3/neuer-nutzer.md](../runde-3/neuer-nutzer.md) mit
Abschnitt „Stand der Behebung“ und [../runde-3/README.md](../runde-3/README.md).

| Runde-3-Befund | Stand laut Runde 3 | Bewertung Runde 4 | Beobachtung |
| --- | --- | --- | --- |
| R3-N1 Stärke 0 ohne Rückfrage, Quittung unter dem Bildrand (P1) | behoben | hält | Schnellerfassung „Göppingen“ nur mit Name → „In Einsatz übernehmen“ → Rückfrage „Stärke fehlt“ mit „Stärke eintragen“ (springt zu „3. Personal“, „Nur Stärke“ mit Zählern) und „Trotzdem mit Stärke 0 übernehmen“. Die Quittung „Zuletzt eingelesen: … jetzt 7 Einheiten, Gesamt 62“ steht nach der Link-Aufnahme ganz im ersten Bild. |
| R3-N2 „Vorbelegung entfernen“ löscht Sondergerät (P2) | behoben | hält | GKW mit „Lichtmast 2 kW, Tauchpumpe TP 4“: Knopf heißt „(1 Fahrzeug ohne eigene Angaben)“, steht unter der Liste, nimmt nur den Anhänger, Leiste „Vorbelegung entfernt: Anh Plane/Spriegel · Rückgängig“. |
| R3-N3 „M“ für Mannschaft und männlich (P2) | behoben | hält | Übersicht „Geschlecht: 9 männl. / 0 weibl. / 0 div.“, Bedarfskasten „WC/Dusche (alle Anwesenden) 47 männl. / 14 weibl. / 0 div.“, „Unterbringung angefordert 2 Einheiten, 19 Personen“ getrennt. |
| R3-N4 „offen“/„✓“ passen nicht (P3) | behoben | hält | 5 von 9 Namen → „3 offen“; Schnellerfassung nur mit Name → „1 ✓“; vorlesbar „offen, hier fehlt noch etwas“. |
| R3-N5 Erklärungen nur im Tooltip (P3) | behoben | teilweise | Die genannten Stellen halten: Unterzeilen an „Bogen scannen…“ / „Bögen einlesen…“, Regel zur Ansprechperson sichtbar. Der Grundsatz „Tooltip nicht als einzige Erklärung“ gilt an den Sammlungskarten aber noch nicht: „alt“, gekürzte Hinweise (R4-N4). |
| R3-N6 Kleinere Stolpersteine (P3) | behoben | hält | „eigener Standort“ einzeilig mit Erklärung darunter; Sammlung „‹ Startseite“; „Bogen schließen“ mit Rückfrage; Einheitstyp-Platzhalter „z. B. Bergungsgruppe, FGr Wasser…“. Ein Einstieg mitten im Formular trat nicht auf („Fortsetzen“ nicht nach gescrollter Startseite geprüft). |

Keine Behebung hat sich verkehrt. Am Rand von R3-N3 liegt R4-N3: Die
ausgeschriebene Geschlechter-Warnung steht in Schritt 3 richtig da. Nach
„Namen einfügen…“ springt die Ansicht aber in die Kurz-Liste, und dort liegt
am Telefon die Spalte, die die Warnung prüfen lässt, außerhalb des Bilds. Ob
dieses Springen aus einer früheren Behebung stammt, habe ich nicht geprüft.

Einordnung der eigenen Befunde: R4-N1, R4-N2, R4-N3, R4-N5 und R4-N6 sind
neu. R4-N4 ist der Rest von R3-N5. Auf einen bestehenden Runde-4-Befund
verweise ich nur: R4-K5 (Einheitenliste weit unten).

Bilanz: Von sechs Runde-3-Befunden halten fünf (R3-N1 bis R3-N4, R3-N6),
einer wirkt teilweise (R3-N5). Der P1 aus Runde 3 ist behoben. Neu sind
keine P0 oder P1, sondern zwei P2 an der Annahme fremder Bögen und vier P3.
