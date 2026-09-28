# Audit „Fehler und Wiederanlauf", Runde 2 (Bedienfehler provozieren, selbst korrigieren)

Stand: 28.09.2026 · Prüfer: Rollenaudit `thw-error-recovery-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/adoring-sagan-9vnriv`, Commit 354209b.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-1-Befunde vom 27.09.2026.

## Prüfaufbau

Chromium (Playwright, `/opt/pw-browsers/chromium`), Viewport 360 × 640 px,
`isMobile`/`hasTouch`, Locale de-DE, keine Kamera. Jeder Skriptlauf begann
mit leerem Speicher. Eigene Entwürfe habe ich über den Seed `eeb.entwurf.v1`
aus `examples/thw/` angelegt (009 Oberhausen-Rheinhausen, 013 Ulm, 021
Kirchehrenbach), Sammlungen und Meldungen durch Bedienung. Den QR-Weg habe
ich durch den inhaltsgleichen Link ersetzt („Weitere Formate → Link teilen",
`navigator.share` gestubbt), Dateien über „Bögen einlesen…", „Aus Datei
laden…" und „Einsatz importieren…". Den Handscanner habe ich als Tastenfolge
in den offenen Scanner getippt.

Getestet habe ich zuerst ohne Blick in frühere Berichte. Den Runde-1-Bericht,
die Tabelle „Stand der Behebung" und die vorliegenden Runde-2-Berichte habe
ich erst danach gelesen.

Rolle: Helfer, der normale Fehler macht und danach selbst weiterkommen will.
Szenarien, jeweils als ganzer Ablauf:

1. **Eigener Bogen mit Fehlgriffen:** Einheitstyp per Enter aus der
   Vorschlagsliste, danach Typ wechseln, nachdem zwei Namen eingetragen sind.
   Organisation versehentlich auf „Feuerwehr". Zeitraum „bis" vor „von",
   Jahr 2062 statt 2026, Einsatzende vor Einsatzbeginn, Häkchen
   „Einsatzbeginn eintragen" aus und wieder an. Doppeltipp auf „+ Person
   hinzufügen", Person entfernen, „Vorbelegung entfernen", „Namen
   einfügen…" mit Dublette und Zahl. Sitzplätze −2 und 90, doppeltes
   Kennzeichen, Diesel 6 000 l, Telefon „abc-xyz", E-Mail „keinemail".
2. **Unterbrechen:** Neuladen mitten im Tippen, Browser-Zurück im Assistenten,
   „‹ Startseite", „Neuen Bogen erstellen" und „Verwerfen" bei offenem
   Entwurf, „Zuletzt verdrängten Bogen zurückholen".
3. **Meldekopf mit Fehlgriffen:** Doppeltipp auf „Einsatz anlegen",
   „Einheit manuell erfassen…" mit Übernahme schon auf Schritt 1 (Doppeltipp),
   angefangene Erfassung abbrechen und neu beginnen, Neuladen mitten in der
   Erfassung, Schnellerfassung mit 70 statt 7 Mannschaft und 90 vegan.
   Bogen in die falsche Sammlung ablegen und verschieben, denselben Bogen
   zweimal ablegen, ältere Fassung nach der neueren einlesen, Doppeltipp auf
   „Abrücken", „Entfernen" mit „Rückgängig", Eintreffzeit auf morgen 21:09
   „korrigieren", Einsatz löschen.
4. **Falscher Kontext:** Eigener Entwurf offen, dann zwei empfangene Links
   nacheinander, einmal mit falscher Wahl „Bogen öffnen" statt „In ‚…'
   aufnehmen". Abgeschnittener Link. Kaputte JSON-Datei und CSV-Datei auf
   allen drei Datei-Wegen. Fehlcode im Scanner.

Nicht prüfbar: Kamera-Scan mit echtem Bild, Geräte-Zurück der nativen
Builds, Bildschirmtastatur, voller Speicher. Die Zurück-Taste aus Schritt 1
und aus dem QR-Vollbild habe ich nicht selbst nachgestellt (siehe R2-H5).

## Urteil

Die meisten Fehlgriffe fängt die App jetzt ab, und zwar dort, wo sie passieren.
Doppeltipps auf „Einsatz anlegen", „+ Person hinzufügen", „In Einsatz
übernehmen", „Abrücken" und auf den Einsatz in der Ablageliste wirken genau
einmal. Derselbe Bogen ein zweites Mal abgelegt wird als „Bereits vorhanden —
übersprungen" quittiert. Eine ältere Fassung, die nach der neueren eintrifft,
überschreibt nichts. Falsche Sammlung ist mit „Verschieben…" in zwei Tipps
repariert. Rückfragen stehen vor jedem echten Verlust im eigenen Bogen
(Organisationswechsel mit Aufzählung, Person entfernen, Neuer Bogen,
Verwerfen, empfangener Link). Zahlendreher bei Stärke, Verpflegung, Diesel
und Zeitraum bekommen ein „stimmt das?" am Feld. Neuladen verliert keinen
Buchstaben.

Die Reibung sitzt jetzt beim Abbrechen und Neuladen am Meldekopf. Die
Erfassung einer fremden Einheit im Einsatz belegt denselben einzigen
Entwurfsplatz wie der eigene Bogen. Wer eine Erfassung abbricht und die
nächste beginnt, verliert den eigenen Bogen endgültig, obwohl jede Rückfrage
das Gegenteil verspricht. Wer mitten in der Erfassung neu lädt, findet die
fremde Einheit als „Meinen Bogen" auf der Startseite wieder. Und „In Einsatz
übernehmen" auf Schritt 1 legt die StAN-Sollstärke als gemeldete Stärke in die
Lage, ohne zu fragen. Kleinere Lücken: einige unplausible Werte (Sitzplätze
90, doppeltes Kennzeichen, Telefon „abc-xyz", Eintreffzeit morgen) gehen
ohne Hinweis durch, und kaputte Dateien melden sich mit Parser-Text.

Den eigenen Bogen schafft der Helfer ohne fremde Hilfe, mit wenigen Umwegen.
Am Meldekopf gelingt die Aufgabe auch, aber ein normaler Abbruch kostet auf
einem gemeinsam genutzten Gerät den eigenen Bogen.

## Befunde

### R2-E1 [P0] Abgebrochene Erfassung im Einsatz verdrängt beim nächsten „Einheit manuell erfassen…" den eigenen Bogen endgültig (neu; zweiter Weg zu R2-N1)

**Priorität:** P0

**Nachweis:** beobachtet, dreimal nachgestellt, Speicher geprüft.

**Fundstelle / Aufgabe:** Eigener Entwurf „THW Oberhausen-Rheinhausen
Bergungsgruppe" (7 Personen mit Namen) → Sammlung „Hochwasser Weser" →
„Einheit manuell erfassen…" → Rückfrage „Einheit erfassen" → Name
„Falschstadt" (falsche Einheit angefangen) → „‹ Einsatz ‚Hochwasser Weser'"
→ noch einmal „Einheit manuell erfassen…".

**Beobachtung:** Die erste Rückfrage sagt: „Der angefangene Bogen ‚THW
Oberhausen-Rheinhausen Bergungsgruppe' wird durch die neu zu erfassende
Einheit ersetzt. Er bleibt auf der Startseite unter ‚Zuletzt verdrängten Bogen
zurückholen' erreichbar." Nach dem Abbruch über „‹ Einsatz …" bleibt
„Falschstadt" als Entwurf liegen. Der Hinweis „Angefangene Erfassung für
diesen Einsatz: ‚THW Falschstadt'. Weiter erfassen" steht ganz unten auf der
Seite, unter „Einsatz löschen…". Die zweite Rückfrage nennt nur noch „THW
Falschstadt" und verspricht wieder „bleibt … erreichbar". Danach liegt
„Falschstadt" auf dem Rückholplatz. Der eigene Bogen ist weg: nicht auf der
Startseite und in keinem `localStorage`-Schlüssel (Suche nach dem
eingetragenen Vornamen ergab null Treffer). Ohne Abbruch, also mit „In Einsatz
übernehmen" nach der ersten Erfassung, bleibt der eigene Bogen erhalten. Der
Unterschied liegt allein darin, ob die erste Erfassung zu Ende gebracht
wurde. Nach einem Neuladen mitten in der Erfassung (R2-E3) führt die nächste
Erfassung auf denselben Verlust.

**Erwartung der Rolle:** Eine falsch angefangene Erfassung breche ich ab und
fange neu an. Das ist der Normalfall am Meldekopf und darf nichts kosten,
was nicht zu dieser Erfassung gehört. Wenn die App sagt, mein Bogen „bleibt
erreichbar", gilt das, bis ich selbst etwas lösche.

**Auswirkung im Einsatz:** Zug- oder Gruppenführer mit eigenem Bogen
übernimmt im Bereitstellungsraum kurz den Meldekopf. Er tippt bei der ersten
nachrückenden Einheit den falschen OV, geht zurück und fängt neu an. Der
eigene Bogen samt Namensliste ist weg, und er merkt es erst bei der
Übergabe. Gleiche Ursache wie R2-N1 (ein einziger Entwurfsplatz für eigenen
Bogen und fremde Erfassungen, ein einziger Rückholplatz). Dieser Weg führt
aber über die Einsatzansicht, die R2-N1 als sicher beschreibt, und er braucht
nicht einmal ein Ablegen, nur einen Abbruch.

**Empfehlung:** Die Erfassung fremder Einheiten nie auf den Platz des eigenen
Bogens legen. Solange das nicht getrennt ist: Eine abgebrochene fremde
Erfassung beim nächsten „Einheit manuell erfassen…" verwerfen oder fortsetzen
lassen, statt sie auf den Rückholplatz zu schieben. Und die Rückfrage muss
sagen, welcher Bogen dabei *endgültig* verloren geht. Den Hinweis „Angefangene
Erfassung … Weiter erfassen" neben „Einheit manuell erfassen…" zeigen, nicht
unter „Einsatz löschen…".

**Verifikation:** Eigenen Bogen mit Namen anlegen, in einer Sammlung dreimal
„Einheit manuell erfassen…" beginnen und jeweils über „‹ Einsatz …"
abbrechen, einmal zusätzlich mitten in der Erfassung neu laden. Der eigene
Bogen muss danach mit allen Namen zurückholbar sein.

### R2-E2 [P1] „In Einsatz übernehmen" auf Schritt 1 legt die StAN-Sollstärke ungefragt als gemeldete Stärke in die Lage (neu; Umfeld R2-W3, F8)

**Priorität:** P1

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Einsatzansicht → „Einheit manuell erfassen…" →
Schritt 1: Einheitstyp „Bergung…" (Enter), Name „Fremdstadt" → „In Einsatz
übernehmen" (steht seit Runde 1 auf jedem Schritt).

**Beobachtung:** Der Knopf übernimmt sofort, ohne Rückfrage und ohne dass
Schritt 3 je offen war. In der Sammlung stehen danach „1 Einheiten · 0 Führer
· 2 Unterf. · 7 Mannsch. · 9 Gesamt", „Verpflegung 9", „Fahrzeuge 2". Die
Karte zeigt „Stärke 0 / 2 / 7 / 9 … Manuell erfasst · 7 Lücken". Keine der
neun Personen und keines der beiden Fahrzeuge wurde von jemandem angegeben.
Es sind die Sollplätze aus dem Einheitstyp. Schritt 1 hatte das in einem
Satz angekündigt („Vorbelegt nach StAN: 9 Personen … Sie zählen in die
Stärke"). Vor dem Übernehmen kommt keine Rückfrage. In der Sammlung wirkt die Summe,
als hätte die Einheit 9 gemeldet.

**Erwartung der Rolle:** Am Meldekopf zählt, was die Einheit meldet oder was
ich gezählt habe. Wenn ich nur Name und Typ eingetragen habe, fragt die App
beim Übernehmen: „Stärke nicht erfasst — Sollstärke 0/2/7/9 übernehmen oder
Stärke eintragen?"

**Auswirkung im Einsatz:** Wer unter Druck eine eintreffende Einheit erst
einmal „mit Namen" anlegt, um sie später zu vervollständigen, meldet der
Führungsstelle die Sollstärke. Kommt die Gruppe mit 6 statt 9, stehen 3
Helfer, 3 Essen und ein Fahrzeug zu viel in der Lage. Die Marke „7 Lücken"
ist dieselbe wie bei echten Datenlücken und fällt nicht auf. (R2-W3 beschreibt
dasselbe für die Fahrzeuge bei der Schnellerfassung von der Startseite. F8 ist
bewusst zurückgestellt. Hier geht es um den Meldekopf-Weg und um die Stärke.)

**Empfehlung:** Vor dem Übernehmen einer Erfassung, deren Stärke nur aus
Sollplätzen besteht, nachfragen und die Stärke zur Bestätigung zeigen. In der
Sammlung solche Einheiten als „Sollstärke, nicht gemeldet" kennzeichnen,
nicht als gewöhnliche Lücke.

**Verifikation:** Im Einsatz eine Bergungsgruppe nur mit Name und Typ
übernehmen: Vor dem Ablegen muss eine Rückfrage zur Stärke kommen, und die
Karte muss die Sollstärke als solche ausweisen.

### R2-E3 [P2] Neuladen mitten in der Einsatz-Erfassung: Der Bezug zur Sammlung ist weg, die fremde Einheit steht als „Meinen Bogen" da (neu)

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Einsatzansicht „Hochwasser Weser" → „Einheit
manuell erfassen…" → Typ, Name „Fremdstadt", Schritt 3 erster Vorname
„Gustav" → Seite neu laden (steht für: App vom System beendet, Akku,
versehentliches Wischen).

**Beobachtung:** Nach dem Neuladen öffnet die Startseite, nicht die Sammlung
und nicht die Erfassung. Die Karte oben lautet „THW Fremdstadt
Bergungsgruppe · Stärke 0 / 2 / 7 / 9 · gespeichert … Fortsetzen · Verwerfen"
und steht unter „Meinen Bogen ausfüllen". Die Eingaben sind vollständig
erhalten, „Gustav" steht im Entwurf. „Fortsetzen" öffnet die
Gesamtübersicht mit „Bogen übergeben… / In Einsatz aufnehmen…" und dem
Rückweg „‹ Startseite". Marke „Aufnahme für: …", „‹ Einsatz ‚…'" und „In
Einsatz übernehmen" sind verschwunden. Der Weg zurück führt über „In Einsatz
aufnehmen…" und die richtige Sammlung, die der Helfer selbst wissen muss.

**Erwartung der Rolle:** Nach der Unterbrechung bin ich wieder da, wo ich war:
in der Erfassung für „Hochwasser Weser".

**Auswirkung im Einsatz:** Der Helfer hält die fremde Einheit für einen
eigenen Bogen oder weiß nicht, ob sie schon in der Sammlung ist. Er legt sie
entweder nicht ab (fehlt in der Lage) oder beginnt über „Einheit manuell
erfassen…" neu. Genau das löst R2-E1 aus. Daten gehen beim Neuladen selbst
nicht verloren.

**Empfehlung:** Den Bezug „Erfassung für Sammlung X" mit dem Entwurf sichern
und nach dem Neuladen wiederherstellen. Die Startseite soll die Karte als
„Angefangene Erfassung für ‚Hochwasser Weser'" zeigen, nicht unter „Meinen
Bogen ausfüllen".

**Verifikation:** In der Einsatz-Erfassung auf Schritt 3 neu laden: Die App
muss in der Erfassung mit „‹ Einsatz ‚…'" und „In Einsatz übernehmen"
weitermachen, oder die Startseite muss die Karte als Erfassung für diese
Sammlung ausweisen.

### R2-E4 [P2] Einige Zahlendreher und unplausible Werte gehen weiter ohne Hinweis durch (Wiederaufnahme von E4)

**Priorität:** P2

**Nachweis:** beobachtet; Übersicht jeweils mit „1 offener Punkt" oder „✓
Alle Angaben vollständig und plausibel" gegengeprüft.

**Fundstelle / Aufgabe:** Schritte 1, 2, 3 und 4 im eigenen Bogen,
Karte in der Sammlung.

**Beobachtung:** Kein Hinweis am Feld und keiner in der Übersicht bei:
- Schritt 1: Telefon „abc-xyz" und E-Mail „keinemail" in der Zugehörigkeit
  (wie in Runde 1).
- Schritt 2: Zeitraum 28.09.**2062**. Einsatzbeginn 28.09.2026 (per
  „Einsatzbeginn eintragen" gesetzt) bei Zeitraum 16.07.–19.07.2026. Die
  Übersicht meldet „✓ Alle Angaben vollständig und plausibel".
- Schritt 4: Sitzplätze **90** am GKW (Richtwert 9). Zwei Fahrzeuge mit
  demselben Kennzeichen „THW-80117". Die Übersicht listet beides
  kommentarlos.
- „Namen einfügen…": Die Zeile „12345" wird als Person „12345 · Mannschaft"
  übernommen. Dubletten markiert die Vorschau dagegen mit „doppelt".
- Sammlung: Eintreffzeit per „ändern" auf 29.09., 21:09 gesetzt (morgen
  Abend). Die Karte zeigt „eingetroffen 29.09., 21:09" ohne Nachfrage.

Gut abgefangen werden dagegen „bis" vor „von" (jetzt auf Schritt 2),
Einsatzende vor Einsatzbeginn, 70 Mannschaft („stimmt das?"), 90 vegan über
der Gesamtstärke, 6 000 l Diesel für 2 Fahrzeuge und Sitzplätze −2 (auf 0
gehalten, mit Hinweis).

**Erwartung der Rolle:** Ein Tippfehler, der offensichtlich falsch ist,
fällt auf, bevor der Bogen das Telefon verlässt, ganz gleich in welchem Feld.

**Auswirkung im Einsatz:** Rückrufnummer ohne Ziffern: Der Meldekopf erreicht
bei Rückfragen niemanden. 90 Sitzplätze verdecken den Hinweis „7 brauchen
eine andere Mitfahrgelegenheit". Doppeltes Kennzeichen macht die
Fahrzeugliste am Meldekopf unzuverlässig. Eine Eintreffzeit in der Zukunft
verfälscht Lageblatt und Reihenfolge „Eintreffzeit (neueste zuerst)".

**Empfehlung:** Dieselben nicht sperrenden „stimmt das?"-Hinweise auch für
Rufnummer ohne Ziffern, E-Mail ohne „@", Sitzplätze weit über dem Richtwert,
gleiches Kennzeichen zweimal, Datum mehr als ein Jahr entfernt, Einsatzbeginn
außerhalb des Zeitraums, Namen aus Ziffern und Eintreff-/Abrückzeit in der
Zukunft.

**Verifikation:** Jeden der Werte oben eingeben: Am Feld und in der Übersicht
muss ein Hinweis erscheinen.

### R2-E5 [P2] Kaputte oder falsche Datei: Die Meldung ist Programmtext und sagt nicht, was zu tun ist (neu)

**Priorität:** P2

**Nachweis:** beobachtet. Die CSV-Datei habe ich am Dateifilter vorbei
übergeben. Eine abgeschnittene JSON-Datei (etwa nach abgebrochener
Übertragung) kommt dagegen auch durch den Filter.

**Fundstelle / Aufgabe:** Abgeschnittene `*.json` und eine CSV-Namensliste
auf drei Wegen: Startseite „Aus Datei laden…", Startseite „Einsatz
importieren…", Einsatzansicht „Bögen einlesen…".

**Beobachtung:**
- „Aus Datei laden…": „Datei ist kein gültiges JSON." (beide Dateien).
- „Einsatz importieren…": „Unexpected end of JSON input", rot unter dem
  Einleitungstext der Startseite.
- „Bögen einlesen…" (zwei Dateien zugleich): „Import: kaputt.json
  (Unexpected end of JSON input), liste.csv (Unexpected token 'N',
  "Name;Vorna"... is not valid JSON)". In derselben Statuszeile steht
  zugleich noch „Meldung ‚THW Kirchehrenbach Bergungsgruppe' entfernt.
  Rückgängig" von der Handlung davor.

Runde 1 lobte für Fremd-PDF und Fremd-JSON konkrete Meldungen mit dem
nächsten Schritt. Diese gibt es für PDFs weiterhin, für JSON nicht.

**Erwartung der Rolle:** „Diese Datei ist beschädigt oder unvollständig —
bitte beim Absender neu anfordern oder den QR-Code scannen." Eine Liste
ist keine Datei der App, und das sagt die App auch so.

**Auswirkung im Einsatz:** Der Helfer versteht die Meldung nicht, versucht
dieselbe Datei erneut oder hält die App für defekt. Die Einheit bleibt
ungemeldet, bis jemand per Funk nachfragt.

**Empfehlung:** Parser-Texte nie anzeigen. Auf allen drei Wegen dieselbe
Meldung mit Ursache in Alltagssprache und nächstem Schritt (neu anfordern,
QR scannen, PDF statt Tabelle). Alte Meldungen bei der neuen Handlung
ausblenden (Rest von E6).

**Verifikation:** Eine auf halbe Länge gekürzte Bogen-JSON auf allen drei
Wegen laden: Jede Meldung muss ohne englischen Programmtext auskommen und
einen nächsten Schritt nennen.

### R2-E6 [P3] Kleine stille Überschreibungen im eigenen Bogen (neu)

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Schritt 2 und Schritt 3.

**Beobachtung:**
- Schritt 2: „Einsatzbeginn eintragen" angehakt, Zeit auf 16.07.2026, 09:30
  korrigiert, Häkchen versehentlich ab- und wieder angetippt: Das Feld steht
  auf „jetzt" (28.09.2026, 12:08). Die korrigierte Zeit ist weg, und kein
  Hinweis sagt es.
- Schritt 3: Einer unbenannten Sollplatz-Karte die Fahrerlaubnis „CE"
  gegeben (Helfer erst später bekannt). „Vorbelegung entfernen (8 Personen
  ohne Namen)" nimmt diese Karte ohne Rückfrage mit. Eine Karte mit nur
  Nachname „Dietz" bleibt dagegen. Laut Beschriftung zählt nur der Name.
  „StAN-Sollplätze laden" bringt die Karte zurück, die CE nicht.
- Schritt 1: Einheitstyp „Bergung" + Pfeil ab + Enter wählt „B (ASH)"
  statt der ersten Zeile „B". Nur Enter wählt „B". Der Unterschied ist in der
  Liste sichtbar, fällt aber leicht durch.

**Erwartung der Rolle:** Was ich eingetragen habe, bleibt stehen, bis ich es
selbst ändere. Oder die App sagt, was sie verwirft.

**Auswirkung im Einsatz:** Falscher Einsatzbeginn im PDF (Nachweis,
Freistellung). Eine vorbereitete Qualifikationsangabe geht verloren. Eine
Gruppe mit falschem Typ bekommt andere Sollplätze, was E1 aus Runde 1 jetzt
beim Wechsel sauber auffängt.

**Empfehlung:** Beim Wiederanhaken die zuletzt eingetragene Zeit
wiederherstellen und „jetzt" nur beim ersten Mal setzen. „Vorbelegung
entfernen" nur für Karten ganz ohne Angaben, oder die übrigen mit Anzahl
nennen („1 Karte mit Fahrerlaubnis bleibt").

**Verifikation:** Beginn korrigieren, Häkchen aus/an: Die korrigierte Zeit
muss stehen. Eine unbenannte Karte mit Fahrerlaubnis darf „Vorbelegung
entfernen" überstehen.

## Bestätigt aus anderen Runde-2-Berichten

Die folgenden Stellen habe ich unabhängig beobachtet. Sie werden hier nicht
noch einmal als eigene Befunde gezählt:

- **R2-N1 [P0]** Gleiche Ursache wie R2-E1. Den Weg über die Schnellerfassung
  der Startseite habe ich nicht nachgestellt, den Weg über die
  Einsatzansicht mit Abbruch schon (R2-E1).
- **R2-N2 [P1]** „Namen einfügen…" mit fünf Zeilen ersetzte die neun
  Sollplätze. Die Stärke fiel von 0/2/7/9 auf 0/0/5/5, die Vorschau zeigte
  jede Zeile „· Mannschaft". Die Dublette „Hans Meier" war mit „doppelt"
  gekennzeichnet, übernommen wurde sie trotzdem, wie angekündigt.
- **R2-N7 [P2]** „‹ Einsätze" in der Sammlung „Übung Kabelblitz" führte bei
  offenem eigenen Entwurf in dessen Gesamtübersicht. „Fortsetzen" öffnet
  die Gesamtübersicht, nicht den letzten Schritt.
- **R2-H2 [P2]** Offener Punkt „6.000 l Diesel … Stimmt das?" angetippt:
  Schritt 5 öffnet, der Fokus bleibt auf `BODY`.
- **R2-H4 [P2]** „Abrücken" wirkt ohne Rückfrage. Der Rückweg „Als
  anwesend" an der Karte funktioniert. Die Lage der Quittung habe ich nicht
  vermessen.

## Was gut funktioniert und erhalten bleiben sollte

- **Doppeltipps** auf „Einsatz anlegen", „+ Person hinzufügen", „In Einsatz
  übernehmen", „Abrücken" und auf den Sammlungsnamen im Ablage-Dialog
  wirken genau einmal.
- **Gleicher Inhalt zweimal** abgelegt: „Bereits vorhanden — übersprungen
  (gleicher Inhalt). Die Zeile in der Liste ist quittiert." **Ältere Fassung**
  nach der neueren eingelesen: Die neuere bleibt maßgeblich, die Historie
  zeigt beide.
- **Falsche Sammlung:** „Verschieben…" mit Zielauswahl und Quittung
  „‚THW Oberhausen-Rheinhausen Bergungsgruppe' liegt jetzt in ‚Hochwasser
  Weser'".
- **Falscher Kontext:** Ein Übungsbogen in einer Einsatz-Sammlung wird
  sofort gemeldet: „Achtung: als ÜBUNG gekennzeichnet — zählt nicht in die
  Lage." Ein empfangener Link fragt „Wohin damit?" und bietet die Sammlung
  zuerst an. Auch bei der falschen Wahl „Bogen öffnen" kommt eine zweite
  Rückfrage. Nach zwei empfangenen Links nacheinander lag der eigene Bogen
  noch auf dem Rückholplatz.
- **Organisationswechsel** fragt nach und zählt auf, was verloren ginge
  (Einheitstyp, OV/RB/LV samt Kürzel, Telefon, E-Mail). „Abbrechen" lässt
  alles stehen.
- **Typwechsel** nach eingetragenen Namen: Benannte Karten bleiben, unbenannte
  werden durch die Sollplätze des neuen Typs ersetzt.
- **Entfernen** einer Meldung: Rückfrage mit Namen und Stand, danach
  „Rückgängig". Einsatz löschen: Papierkorb mit 30 Tagen. Verwerfen: Hinweis
  „bis ein anderer Bogen diesen Platz braucht".
- **Neuladen** mitten im Tippen: Der Vorname stand nach dem Neuladen im
  Entwurf. Browser-Zurück geht im Assistenten einen Schritt zurück
  (Schritt 4 → 3).
- **Scanner:** Fehlcode „HALLODASISTKEINCODE" wird im offenen Scanner
  gemeldet („Empfangen: …"), der Scanner bleibt bereit.
  **Abgeschnittener Link:** „Der geöffnete Link enthält keinen gültigen
  Erfassungsbogen.", der eigene Entwurf bleibt unberührt.

## Abschluss

- **Aufgabe geschafft:** eigener Bogen: ja. Meldekopf: ja, mit Umwegen nach
  Neuladen (R2-E3). Eigener Bogen plus Meldekopf auf einem Gerät mit einem
  Abbruch: nein, der eigene Bogen ging verloren (R2-E1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Bleibt unter ‚Zuletzt verdrängten Bogen
  zurückholen' erreichbar" gilt nur bis zur nächsten angefangenen Erfassung,
  auch wenn die vorige nur abgebrochen war.
- **Größtes Einsatzrisiko:** Eine abgebrochene Erfassung am Meldekopf löscht
  unbemerkt den eigenen Bogen. Eine nur mit Name und Typ übernommene Einheit
  meldet ihre Sollstärke als Ist-Stärke an die Lage.
- **Top-Priorität für die nächste Iteration:** Fremde Erfassungen (Einsatz
  und Schnellerfassung) von dem Platz des eigenen Bogens trennen, sodass kein
  Abbruch und kein Ablegen den eigenen Bogen verdrängen kann (R2-E1 zusammen
  mit R2-N1).

## Abgleich mit Runde 1

Grundlage: [../fehler-und-wiederanlauf.md](../fehler-und-wiederanlauf.md)
und [../README.md → Stand der Behebung](../README.md#stand-der-behebung).

| Runde-1-Befund | Bewertung Runde 2 | Beobachtung |
| --- | --- | --- |
| E1 Vorbelegung stapelt | bestätigt behoben | Schritt 1 kündigt an: „Vorbelegt nach StAN: 12 Personen (Namen offen) … ein anderer Einheitstyp ersetzt sie". Wechsel B → FGr SB (A) nach zwei Namen: 2 benannte + 12 neue Sollplätze, die 7 alten unbenannten sind weg. „Vorbelegung entfernen" auf Schritt 1 und 3 vorhanden. Rest: nimmt unbenannte Karten mit Angaben mit (R2-E6). Sollstärke bei der Übernahme am Meldekopf siehe R2-E2. |
| E2 Organisationswechsel löscht | bestätigt behoben | Rückfrage „Organisation auf ‚Feuerwehr' wechseln?" zählt Einheitstyp und OV/RB/LV samt Kürzel, Telefon, E-Mail auf. „Abbrechen" lässt THW und alle Angaben stehen. |
| E3 Browser-Zurück verlässt die App | teilweise | Von Schritt 4 führt Zurück auf Schritt 3 (beobachtet). Aus Schritt 1 und aus dem QR-Vollbild selbst nicht nachgestellt; dort laut R2-H5 weiter falsch. |
| E4 Unplausible Werte | teilweise | Behoben: „bis" vor „von" jetzt auf Schritt 2, Ende vor Beginn mit deutscher Zeitangabe, Stärke 70, vegan über Stärke, Diesel, Sitzplätze −2. Offen: Telefon/E-Mail, Sitzplätze 90, doppeltes Kennzeichen, Jahr 2062, Beginn außerhalb Zeitraum, Eintreffzeit in der Zukunft (R2-E4). |
| E5 Falscher Einsatz | bestätigt behoben | „Verschieben…" an der Karte, Zielauswahl mit Anlegedatum, Quittung. Doppeltes Ablegen wird als gleicher Inhalt übersprungen. |
| E6 Stehende Meldungen, Scanner, Dubletten | teilweise | Scanner bleibt nach Fehlcode offen und zeigt die Meldung darin. Dubletten sind in der Einfüge-Vorschau als „doppelt" markiert. Beim Einlesen stand die Meldung der vorigen Handlung („… entfernt. Rückgängig") noch neben der Importmeldung, und die Importmeldung selbst ist Parser-Text (R2-E5). |

Einordnung der eigenen Befunde: R2-E1, R2-E2, R2-E3, R2-E5 und R2-E6 sind
neu. R2-E1 hat dieselbe Ursache wie R2-N1, zeigt sie aber auf dem Weg, den
R2-N1 als sicher beschreibt. R2-E4 nimmt E4 wieder auf.

Bilanz: Von sechs Runde-1-Befunden sind drei bestätigt behoben (E1, E2, E5)
und drei teilweise (E3, E4, E6). Offen geblieben ist keiner. Die beiden P1
aus Runde 1, die stillen Verluste bei Typ- und Organisationswechsel, sind
sauber gelöst. Der schwerste neue Befund (R2-E1) sitzt nicht mehr im
Assistenten, sondern im Zusammenspiel von eigenem Bogen und
Meldekopf-Erfassung auf einem Gerät.
