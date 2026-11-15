# Audit „Analog first", Runde 11 (Papier-Rückfallebene, Rückweg vom Papier)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-10-25 · Prüfgegenstand: laufende Web-App,
Produktionsbuild auf http://localhost:4173 (nicht neu gebaut, nicht angehalten), Repo-Stand Merge „Runde 10"
(`37ee21d`).

Zählung: **P0 0 · P1 0 · P2 1 · P3 4** (5 Befunde, alle neu).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, `docs/audits/runde-10/README.md`
und die Befundüberschriften aller früheren Analog-first-Berichte (R2 bis R10), damit nichts doppelt gemeldet wird.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, `isMobile`/`hasTouch`, Locale de-DE), Telefon 390 × 844
und 360 × 640. Jeder Durchgang in einem frischen Browser-Kontext. Die Sammlungen wurden mit den Übungsbögen aus
`examples/thw/` (auf `uebung: false` gesetzt, 6 und 40 Stück) über „Bögen einlesen…" gefüllt, für die
Datenschutzfrist mit Kopien, deren `stand` 30, 85 und 95 Tage zurückliegt. Papier-Ausgaben wurden heruntergeladen
und mit `pdftotext -layout`, `pdfinfo` und `pdftoppm` gelesen: Lageblatt (6 und 40 Einheiten), Sammel-PDF (6 und 40
Einheiten, 13 und 82 Seiten), Einzel-PDF, Blanko-Vordruck (in der App und unter `dist/downloads/`), dazu die
statischen Seiten „Papier oder digital?", „Anleitung", „Meldekopf digital", „Vorlage und Blanko".

Durchgespielt: Einsatz-Sammlung anlegen, Einheiten einlesen, „Einheit manuell erfassen…" (Schritt 3 „Nur
Stärke" mit Geschlechts- und Ernährungsaufteilung, Schritt 5), Zug zuordnen, Abrücken (mit sofortigem und
verzögertem Tippen auf „Lageblatt"), „Meldung entfernen", Einsatz importieren (ältere Sammel-PDF in einen
neueren Stand derselben Sammlung; Lageblatt- und Blanko-PDF als falsche Datei), „Aus Datei laden…" mit einer
Sammel-PDF, Datensicherung, „Geräteschlüssel neu erzeugen", „Alle Daten löschen", „Bogen übergeben…", Offline-Betrieb
(`setOffline`) für die Startseite und alle statischen Seiten.

**Annahmen** (nicht aus Vorschriften belegt): Der Meldekopf führt neben dem Gerät einen Meldeblock mit Nr.,
Eintreff- und Abrückzeit. Das zuletzt gedruckte Lageblatt hängt nach einem Geräteausfall weiter an der Wand. Eine
Einheit führt ihren Bogen als „Papier-Reserve" in der Fahrzeugmappe (so empfiehlt es die Seite „Papier oder digital?").

**Nicht prüfbar:** echtes Drucken (Druckrand, Graustufen), Kamera- und Handscanner, QR-Weg vom Papier
(ersetzt durch den inhaltsgleichen Dateiweg), native Builds, Safari, echte Geräte- und Akkuausfälle (ersetzt durch frische
Kontexte). Die Übungsbögen tragen Einsatzzeiträume im Juli; „Zeitraum vorbei", „Anderer Einsatz?" und die Hinweise „keine
Rufnummer / kein Kraftfahrer" sind Artefakte der Seeds und nicht gewertet.

**Bekannte Grenzen, nicht neu gemeldet:** R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5,
R8-H5/S4 sowie die Reste aus Runde 10 (leere Karten bei „Nur Stärke", Rückgängig für Meldungen überlebt das Neuladen
nicht, Tabellenzeilenhöhe bei 180 × 320). Zu R8-H5/S4: Mein Lageblatt-Tipp unmittelbar nach „Abrücken" blieb ohne
Wirkung; das ist die dokumentierte Ortssperre (`tipp-schutz.ts`), die Wirkung trat erst nach rund 1,5 s ein. Nicht gewertet.

**Kennzeichnung:** *gemessen* = im Testbrowser mit Zahlen oder Dateiinhalt reproduziert; *beobachtet* = gesehen, ohne
Messreihe; *Risiko* = aus Ausgaben abgeleitet, nicht nachgestellt.

## Urteil

Die Papierseite trägt weiter. Das Lageblatt (2 Seiten bei 6 Einheiten, 6 Seiten bei 40) trägt Zeit, Nr., Stärke,
Bedarf, Nachtragszeilen und die Summe „laut Gerät"; die Sammel-PDF beginnt mit der Übergabe-Übersicht, jeder Bogen trägt
den Kasten „Stand am Meldekopf" und die Zeile „übertragen [ ]". Die Sammel-PDF einer älteren Fassung lässt sich in einen
neueren Stand derselben Sammlung einlesen, ohne dass etwas doppelt zählt („keine neue Einheit. Jetzt 5 Einheiten"). Offline
liefern die Startseite, alle Themenseiten und der Blanko-Download aus dem Service Worker. Die Erzeugung der Sammel-PDF
friert die Seite zwar rund 9 s ein (40 Einheiten, Testrechner), sagt aber „Einsatz wird erzeugt…". Die Rückfragen vor
„Geräteschlüssel neu erzeugen" und „Alle Daten löschen" nennen Folgen und Papier-Rückweg.

Reibung entsteht an einer Stelle, an der Papier und Gerät auseinanderlaufen, ohne dass es jemand merkt: Ein älterer
Bogen kommt am Meldekopf ohne Namen und Erreichbarkeiten an, während das Papier sie trägt (R11-A1). Dazu vier kleine
Ränder an Papier und Beschreibung. Nichts davon blockiert den Ablauf; die Aufgabe „Papier erzeugen, Papier wieder
einlesen, Nachtrag vom Meldeblock" gelingt ohne fremde Hilfe.

## Befunde

### R11-A1 [P2] Ein Bogen mit Stand über 90 Tage kommt am Meldekopf anonymisiert an, die Aufnahme sagt es nicht, das Papier trägt die Namen

**Kennzeichnung:** gemessen (Dateiweg); QR- und PDF-Weg laufen über dieselbe Aufnahme (*Risiko*).

**Fundstelle / Aufgabe:** Einsatz-Sammlung, „Bögen einlesen…" mit drei Bögen verschiedener Einheiten, `stand` 30, 85
und 95 Tage vor heute; danach Karte und Quittung. Gegenstück: Seite „Papier oder digital?" („druck das PDF und führ
Papier mit") und Einzel-PDF („Stand 170805jul26" nur im Kasten am QR-Code).

**Beobachtung:** Die Bögen mit 30 und 85 Tagen kommen mit Namen an. Der Bogen mit 95 Tagen trägt auf der Karte die
Marke „ANONYMISIERT"; deren Erklärung („Datenschutzfrist abgelaufen: Namen, Funktionen, Qualifikationen und
Erreichbarkeiten wurden entfernt.") steht nur im `title` der Marke, also nicht auf einem Touch-Gerät. Die Quittung lautet
„3 Bögen aufgenommen." und nennt den anonymisierten Bogen nicht; die Zeile „Neu seit der letzten Kenntnisnahme" auch nicht.
Die Frist rechnet ab dem Stand des Bogens, nicht ab dem Eingang und nicht ab dem Ausdruck: Wer seinen unveränderten
Bogen heute neu druckt, trägt ein Blatt mit lesbaren Namen und Telefonnummern, dessen Code sie nach 90 Tagen
nicht mehr liefert. „PDF erzeugen" setzt den Stand nicht zurück (Einzel-PDF: Stand weiter 17.07.).

**Erwartung der Rolle:** Das Papier in der Fahrzeugmappe ist die Reserve für den Tag, an dem das Gerät fehlt. Was darauf
steht, soll am Meldekopf auch ankommen, oder die App soll beim Einlesen sagen: „Bei diesem Bogen fehlen die Namen
wegen der Frist, sie stehen auf dem Papier."

**Auswirkung im Einsatz:** Der Meldekopf hat im Gerät eine Einheit mit Stärke, aber ohne Ansprechperson und ohne
Rufnummer. Er merkt es erst, wenn er sie braucht (Rückfrage, Fahrer gesucht). Das Papier hat die Angaben, nur liegt es
dann nicht mehr beim Meldekopf. Die Datenschutzfrist selbst ist gewollt; die Stille an der Annahme und der unsichtbare
Grund sind das Problem.

**Empfehlung:** Die Quittung des Einlesens nennt anonymisierte Bögen ausdrücklich („1 Bogen ohne Namen und
Erreichbarkeiten: Datenschutzfrist, Stand vor 95 Tagen — Angaben vom Papier nachfragen"). Die Erklärung der Marke
steht sichtbar auf der aufgeklappten Karte. Auf dem Ausdruck steht neben dem Code, bis wann er Namen liefert („Namen im Code
gültig bis …"), damit die Einheit rechtzeitig neu bearbeitet.

**Verifikation:** Übungsbogen mit `stand` 95 Tage zurück einlesen: die Quittung nennt den Bogen, die Karte erklärt die
Marke ohne Antippen des Tooltips. Einzel-PDF eines 80 Tage alten Bogens drucken: der Gültigkeitsvermerk steht neben dem
Code.

### R11-A2 [P3] Auf dem Papier gibt es keinen Platz für die Abrückzeit, obwohl die Beschreibung die Abmeldung als Feld nennt

**Kennzeichnung:** gemessen (Blanko, Einzel-PDF, Sammel-PDF-Kasten, Lageblatt gelesen); die Wirkung im Einsatz ist *Risiko*.

**Fundstelle / Aufgabe:** Meldekopf-Zeile von Blanko und Einzel-PDF („Meldekopf: Nr. ___ · eingegangen am ___ um ___ Uhr
· Zug / Verband ___ · … übertragen [ ] von … um …"), Kasten „Stand am Meldekopf" der Sammel-PDF, Lageblatt-Spalte
„Eingetroffen (abgerückt)", Nachtragszeilen („Einheit, Zug, Uhrzeit, Stärke …"), Seite „Vorlage und Blanko-PDF" (Zeile
„Einsatz": „… sowie der Zeitpunkt des Eintreffens und der Abmeldung").

**Beobachtung:** Für die Eintreffzeit gibt es auf dem Vordruck ein Feld. Für das Abrücken gibt es keins: Die Meldekopf-Zeile
kennt nur „eingegangen" und „übertragen", das Lageblatt druckt den Abrückstand zum Druckzeitpunkt, und die Nachtragszeilen
sind freier Text ohne Spalte für eine Abrückzeit. Der Kasten „Stand am Meldekopf" zeigt beim Druck „anwesend". Die App
verlangt die Abrückzeit später im Papier-Abgleich („Abrückzeit nicht bestätigt (vom Papier)").

**Erwartung der Rolle:** Rückt eine Einheit ab, während das Gerät aus ist, schreibt der Meldekopf die Uhrzeit auf ihr Blatt.
Dafür sollte ein Feld im Kasten stehen, so wie für die Eintreffzeit.

**Auswirkung im Einsatz:** Die Abrückzeit steht auf dem Meldeblock oder gar nicht und fehlt beim späteren Nachtragen; der
Abgleich kennzeichnet sie dann „nicht bestätigt". Die Beschreibung auf der Vorlagenseite verspricht ein Feld, das das Blatt
nicht hat.

**Empfehlung:** In der Meldekopf-Zeile von Blanko, Einzel-PDF und im Kasten der Sammel-PDF ein Feld „abgerückt am … um …
Uhr" neben „eingegangen". Oder, wenn das Blatt unverändert bleiben soll: Satz der Vorlagenseite anpassen („Zeitpunkt des
Eintreffens am Meldekopf"), und die Nachtragszeilen des Lageblatts bekommen eine Spalte „abgerückt um".

**Verifikation:** Blanko drucken: „abgerückt" ist neben „eingegangen" auszufüllen. Lageblatt: Nachtragszeile hat eine Zelle
für die Abrückzeit; der Papier-Abgleich übernimmt sie.

### R11-A3 [P3] Ein Lageblatt oder Blanko als PDF lässt sich nicht einlesen, und die Meldung erklärt weder das noch den Weg

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** „Einsatz importieren…" und „Bögen einlesen…" mit der heruntergeladenen Lageblatt-PDF und mit
dem Blanko-PDF. Banner „Nicht lesbar: …" (`unlesbar-hinweis.tsx`): „Weg zurück auf Papier: die letzte Sammel-PDF und das
Lageblatt gelten weiter. Die Bögen daraus mit „Bögen einlesen…" bzw. „Einsatz importieren…" neu einlesen."

**Beobachtung:** „Einsatz importieren…" antwortet: „In dieser PDF steckt weder eine Einsatz-Sammlung noch ein einzelner
Bogen — es sind keine eingebetteten Daten und kein lesbarer QR-Code darin." „Bögen einlesen…" antwortet: „Keine Bögen
in der Datei gefunden — weder eingebettete Daten noch ein lesbarer QR-Code." Beide Texte sagen nicht, dass es sich um ein
Lageblatt bzw. einen Blanko-Vordruck handelt und dass die Sammel-PDF der lesbare Träger ist. Der Banner nennt Sammel-PDF
und Lageblatt in einem Satz und schickt „die Bögen daraus" zum Einlesen; im Lageblatt stehen keine Bögen.

**Erwartung der Rolle:** Wer nach dem Ausfall im Postfach nur das Lageblatt-PDF findet, versucht es zu laden. Die Meldung
soll sagen: „Das ist ein Lageblatt (nur zum Lesen). Zum Weiterarbeiten die Sammel-PDF ‚Einsatz weitergeben / sichern'
laden."

**Auswirkung im Einsatz:** Zeitverlust und Zweifel, ob die Datei defekt ist, in einem Moment, in dem ohnehin das Gerät
ausgefallen ist. Eine Gefahr für Daten entsteht nicht.

**Empfehlung:** Beim Einlesen ein Lageblatt- oder Blanko-PDF am Titel erkennen und einen eigenen Satz zeigen. Im Banner
trennen: „Sammel-PDF: Bögen einlesen oder Einsatz importieren. Lageblatt: nur zum Aushängen und Abgleichen."

**Verifikation:** Lageblatt-PDF in „Einsatz importieren…" und „Bögen einlesen…" laden: Beide Meldungen nennen „Lageblatt"
und den Weg über die Sammel-PDF.

### R11-A4 [P3] Die Vorlagenseite verspricht Platz für 36 Helfer und rund 11 kB, der Vordruck hat 29 Zeilen und 13 149 Byte

**Kennzeichnung:** gemessen (Vordruck gezählt: 10 Zeilen auf Seite 1, 19 auf Seite 2; Dateigröße `dist/downloads/`).

**Fundstelle / Aufgabe:** `vorlage.html` („mit Platz für vier Fahrzeuge und 36 Helferinnen und Helfer", „PDF, 2 Seiten A4, rund
11 kB") gegen den Vordruck („Reicht der Platz nicht (mehr als 29 Personen, 4 Fahrzeuge oder 6 Qualifikationen): weiteren Vordruck
als Beiblatt nehmen").

**Beobachtung:** Der Vordruck selbst nennt 29; die Seite 36. Der Blanko aus der App und der aus dem Download sind textgleich.

**Erwartung der Rolle:** Wer Vordrucke für eine Einheit mit 33 Personen vorplant, hält einen für ausreichend und merkt
erst vor Ort, dass sieben Zeilen fehlen.

**Auswirkung im Einsatz:** Gering; das Blatt weist selbst aufs Beiblatt hin. Es kostet aber ein Beiblatt in der Hektik.

**Empfehlung:** Zahl auf der Seite aus derselben Quelle wie der Vordruck-Hinweis ableiten (29), Dateigröße streichen oder
mit angeben „rund 13 kB".

**Verifikation:** Seite und Vordruck nennen dieselbe Zahl; Zeilen auf dem Blatt zählen.

### R11-A5 [P3] „Schichtübergabe auf einem Blatt, eine Zeile je Einheit" gilt in der Sammel-PDF nur bei Einheiten ohne Hinweise

**Kennzeichnung:** gemessen mit Seed-Bögen; die Länge hängt stark an den Hinweisen der Seeds, deshalb nur P3.

**Fundstelle / Aufgabe:** `meldekopf.html` („Die Sammel-PDF beginnt mit genau dieser Übersicht, eine Zeile je Einheit — das ist
die Schichtübergabe auf einem Blatt"); Übergabe-Übersicht der Sammel-PDF.

**Beobachtung:** Sechs Einheiten ergeben 3 Seiten Übergabe-Übersicht (Seite 3 nur „Bedarf gesamt"), vierzig Einheiten 12 Seiten
mit 3 bis 4 Einheiten je Seite, bevor der erste Bogen kommt. Jeder Hinweis steht ausgeschrieben (drei Sätze je Einheit) im schmalen
Einheitenfeld, 6 bis 12 Zeilen je Einheit. Das Lageblatt kürzt dieselben Hinweise („Zeitraum vorbei; keine Rufnummer; kein
Kraftfahrer") und braucht bei vierzig Einheiten 6 Seiten.

**Erwartung der Rolle:** Die Übersicht ist der Teil, den der nächste Stab als Erstes liest. Sie soll auch bei 20 Einheiten ein
Blatt, höchstens zwei umfassen.

**Auswirkung im Einsatz:** Wer die Sammel-PDF druckt, hält bei einer größeren Lage ein Dutzend Seiten Übersicht in der Hand
und sucht die Summe auf der letzten.

**Empfehlung:** In der Sammel-PDF die Kurzform des Lageblatts verwenden und die ausgeschriebenen Hinweise auf der Bogenseite
belassen (dort steht sie ohnehin als Kasten); oder die Seite so formulieren, dass sie die Länge nicht verspricht.

**Verifikation:** Sammel-PDF mit 20 Einheiten, von denen jede zwei Hinweise trägt: Übersicht höchstens 2 Seiten.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
|---|---|---|---|
| Bogen einer Einheit führen | Vorlagen, Summen, Signatur | Einzel-PDF / Blanko in der Fahrzeugmappe | QR oder Datei; nach 90 Tagen Stand fehlen im Gerät die Namen, ohne Hinweis beim Einlesen (R11-A1) |
| Einheit am Meldekopf aufnehmen | Scan, Summe, Historie | Blanko mit Meldekopf-Zeile, Meldeblock | „Einheit manuell erfassen…" mit Eintreffzeit, Nr., Zug; „Nur Stärke" mit Aufteilung nach Geschlecht und Ernährung |
| Abrücken | Karte, Quittung, Zeit | Meldeblock, Nachtragszeile am Lageblatt | Papier-Abgleich; Abrückzeit hat auf dem Blatt kein Feld, bleibt „nicht bestätigt" (R11-A2) |
| Lage aushängen | Lageblatt, Lagemonitor | Lageblatt an der Wand, Nachtragszeilen | Nachtrag von Hand → „Eintreffzeiten nachtragen…"; das Lageblatt-PDF selbst ist nicht einlesbar und sagt es nicht (R11-A3) |
| Geräteausfall am Meldekopf | „Einsatz weitergeben / sichern" als Datei | Letzte Sammel-PDF und Lageblatt | Sammel-PDF als Datei oder Seitenbilder; ältere Fassung wird mit dem neueren Stand zusammengeführt ohne Dubletten |
| Vorplanung der Vordrucke | Blanko aus App und Download | Gedruckter Vordruck, Beiblatt | Abtippen im Assistenten; Platzangabe der Vorlagenseite stimmt nicht (R11-A4) |
| Weitergabe an Stab | Sammel-PDF mit Übersicht, CSV, Excel | Ausgedruckte Übersicht | „Einsatz importieren…"; Übersicht wächst bei großen Lagen auf viele Seiten (R11-A5) |

## Würde ich dafür das Papier weglegen?

Nein, für den Weg „Einheit mit Papier-Reserve trifft ein" nicht: Das Papier trägt die Namen und Telefonnummern, die das Gerät nach
90 Tagen Stand ohne Hinweis aus dem Code verliert (R11-A1), und der Vordruck hat für das Abrücken keinen Platz (R11-A2). Den
Rest der Papierkette (Lageblatt, Sammel-PDF, Nachtrag vom Meldeblock, Wiederanlauf aus Datei) halte ich für belastbar genug, dass ich
das Papier daneben legen und im Normalfall nicht brauchen würde.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Wer sein Papier-Reserve-Blatt frisch druckt, hält es für aktuell, dabei zählt für den Code der alte
  Stand (R11-A1).
- **Größtes Einsatzrisiko:** Eine Einheit kommt am Meldekopf ohne Namen und Rufnummern an, ohne dass Quittung oder Karte es auf
  dem Telefon sagen (R11-A1).
- **Top-Priorität für die nächste Iteration:** Beim Einlesen anonymisierte Bögen in der Quittung nennen und die Erklärung
  der Marke „ANONYMISIERT" sichtbar auf die Karte setzen (R11-A1).
