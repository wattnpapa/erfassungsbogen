# Audit „Analog first", Runde 7 (Papier-Rückfallebene, Rückweg vom Papier)

Stand: 23.10.2026 · Code-Stand: `a52f20a` (Zweig `main`) · Prüfer: Rollenaudit
`thw-analog-first-reviewer` · Prüfgegenstand: Web-App, Produktionsbuild
(`vite preview`, Port 4173, nicht neu gebaut).

Reiner Prüfbericht, keine Codeänderung. Siebte Runde nach der Behebung der
Runde-6-Befunde (Stand der Behebung im Bericht
[../runde-6/analog-first.md](../runde-6/analog-first.md): 5 behoben, 4
teilweise, 0 offen).

## Prüfaufbau

Playwright aus `node_modules`, Chromium unter `/opt/pw-browsers/chromium`
(`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Telefon 360 × 640 px
(Skalierung 2) als Grundeinstellung, dazu 320 × 568, 640 × 360 quer und
`html{font-size:200%}`. Jeder Durchgang lief in einem eigenen, frischen
Browser-Kontext, weil elf weitere Prüfer denselben Server nutzten;
Zeitmessungen unter dieser Last sind Größenordnungen. Der Server wurde nicht
angefasst. Zuerst habe ich ohne Kenntnis der Berichte getestet, danach den
Runde-6-Bericht samt „Stand der Behebung" gelesen und jede Behebung am
laufenden Build nachgestellt.

Zustände: `localStorage`-Seeds (`eeb.einsaetze.v1`, `eeb.entwurf.v1`,
`eeb.anzeigemodus.v1`, `eeb.uhr.v1`) aus `examples/thw/` mit `uebung: false` und
`stand` auf heute:

- „Hochwasser Musterstadt" mit 6 Bögen (001, 003, 009, 013, 016, 052), Stärke
  1 / 15 / 43 / 59.
- Leeres Zweitgerät „Wiederanlauf" für den Rückweg vom Papier.
- Entwurf `013-ulm-b` mit kyrillischem Vornamen und Sonderzeichen im Nachnamen,
  Ansicht „Nacht".
- Zustand für die Geräteuhr: letzter Start 120 Tage vor dem Gerätedatum, eine
  Sammlung, deren letzte Änderung 3 Tage nach dem letzten Start liegt.

Heruntergeladen und mit `pdftotext -layout`, `pdftotext -bbox`, `pdfinfo`,
`pdftoppm` gelesen und angesehen:

| Datei | Weg | Seiten |
| --- | --- | --- |
| Sammel-PDF, 6 Einheiten | „Einsatz weitergeben / sichern" | 17 |
| Sammel-PDF nach Abgleich vom Papier | dito, auf dem Zweitgerät | 18 |
| Sammel-PDF mit Nur-Stärke-Einheit (Nr. 7) | dito | 19 |
| Lageblatt: 6 Einheiten / nach Abgleich / mit Nur-Stärke-Einheit | „Lageblatt (A4 quer)" | 2 / 2 / 2 |
| Einzel-PDF Ulm mit Sonderzeichen, Ansicht „Nacht" | „Bogen übergeben…" → „PDF erzeugen" | 2 |
| Blanko-Vordruck | Startseite und Einsatzansicht | 2 |
| CSV „Übersicht" | Einsatzansicht | – |

Die 17 Seiten der Sammel-PDF habe ich als Bilder (130 dpi) auf einem leeren
Gerät über „Bögen einlesen…" gelesen und danach „Lage vom Papier
abgleichen…" ausgeführt (Nr. 1–6, Eintreffzeit nur bei einer Einheit, Zug bei
zweien, Notiz bei einer, eine Einheit „abgerückt" ohne Abrückzeit).

Weitere Szenarien: manuelle Erfassung mit „Nr. laut Zettel", „Zug / Verband",
„Eingetroffen um" und „Nur Stärke" (Sinsheim, Nr. 7); Exportstand mit CSV und
„Nur neue Bögen seit dem letzten Export"; Lagemonitor als zweites Fenster
(auch nach Schließen des Hauptfensters); Zurück-Taste an den Fenstern der
Startseite; Offline-Betrieb mit `setOffline` unmittelbar nach dem Laden und nach
25 s; Geräteuhr-Rückfrage; zweiter Tab desselben Geräts; Fußleiste bei
`html{font-size:200%}` auf 320 × 568, 360 × 640, 640 × 360.

**Annahmen**, die sich nicht aus Vorschriften belegen lassen: Die laufende
Nummer („Nr. 3") dient am Meldekopf und im Funk als Kurzbezeichnung. Nach einem
Geräteausfall hängt das zuletzt gedruckte Lageblatt weiter an der Wand. Ein
handschriftlich ausgefüllter Blanko kommt ohne Gerät zum Meldekopf.

**Nicht prüfbar** waren echtes Drucken (Druckrand, Graustufen, Heften), der
Kamera-Live-Scan, der Handscanner, echte Fotos im Zelt (ersetzt durch gerenderte
Seitenbilder), die PDF-Vorschau im Bogen, das Datum-Zeit-Feld im Abgleich
(Headless-Chromium zeigt das US-Format, nicht gewertet), echte Akku- und
Geräteausfälle (ersetzt durch frische Kontexte), echte Geräteuhr-Sprünge
(ersetzt durch den Seed `eeb.uhr.v1`), native Builds und Safari. Die Sammel-PDF
fällt mit 17 statt 11 Seiten länger aus als in Runde 6, weil die Seed-Bögen
Einsatzzeiträume im Juli tragen und jede Einheit den Hinweis „Zeitraum vorbei /
Anderer Einsatz?" druckt; das ist ein Artefakt der Seeds und nicht gewertet.

## Urteil

Die Papierseite trägt, und die Runde-6-Behebungen halten bis auf einen Rest an
der Nur-Stärke-Erfassung. Der Kasten „Stand am Meldekopf" trägt jetzt „(nicht
bestätigt, vom Papier)" bei jeder Einheit ohne Zeit vom Blatt, im Kasten über dem
Bogen wie auf der Codeseite (gemessen an allen 18 Seiten der Sammel-PDF nach dem
Abgleich). Die Kopfzeile liegt mit ihrem Text bei y = 17 pt (6,0 mm vom Rand), der
Blanko nennt „mehr als 29 Personen", „PDF erzeugen" trägt den Hinweis „immer
hell, für Papier", und der Abgleich bricht bei fehlender Abrückzeit nicht mehr
ab. Der Rückweg gelingt ohne fremde Hilfe: aus 17 Seitenbildern kamen 6 Bögen,
der Abgleich übernahm Nr., Zug, Notiz und Status, und die neue Rückfrage
„Eintreffzeit nicht bestätigt" nennt die betroffenen Einheiten namentlich, bevor
die Ansicht weitergeht.

Reibung bleibt an einer Stelle, in der Spur von R6-A8: Wer am Meldekopf eine
Einheit „nur nach Stärke" aufnimmt und die vorbelegten Sollzahlen stehen lässt,
meldet sie ohne Hinweis und ohne Rückfrage als gezählte Stärke (R7-A1). Dazu drei
kleine Lücken in der Kennzeichnung (R7-A2 bis R7-A4).

Aufgaben: Papier erzeugen geht ohne fremde Hilfe. Nachtrag vom Meldeblock mit
Nr., Zug und Eintreffzeit geht ohne fremde Hilfe. Wiederanlauf nur vom Papier geht
ohne fremde Hilfe.

## Befunde

### R7-A1 [P2] „Nur Stärke" legt die Sollzahlen der StAN ohne Hinweis und ohne Rückfrage als gemeldete Stärke ab

**Priorität:** P2

**Kennzeichnung:** beobachtet (Verhalten, Lage, Lageblatt, Sammel-PDF); Ursache
der fehlenden Meldung aus dem Quelltext gelesen, nicht im Browser nachgeprüft.

**Fundstelle / Aufgabe:** „Einheit manuell erfassen…" mit Typ „Bergungsgruppe" →
Schritt 3 „Personal" → „Nur Stärke (Meldekopf-Schnellerfassung)" → „Nur Stärke
melden" → „In Einsatz übernehmen"; `src/app/schritte/personal.tsx` Zeile 1168 ff.
(Hinweis „Vorgabe nach Einheitstyp (Sollstärke), nicht gezählt").

**Beobachtung:**
- Nach der Bestätigung stehen Führer 0, Unterführer 2, Mannschaft 7, Gesamt 9 in
  den Zählfeldern, keine Platzhalter. Der in Runde 6 angekündigte Satz „Vorgabe
  nach Einheitstyp (Sollstärke), nicht gezählt: Mit der gezählten Stärke
  überschreiben, nicht dazuzählen." war im Text der Seite nicht vorhanden. Ablesbar
  im Quelltext: Er erscheint nur, wenn alle vorbelegten Personenkarten leer sind;
  bei „Bergungsgruppe" tragen zwei Karten schon die Funktionen „GrFü" und „TrFü",
  und die Bedingung trifft nicht zu.
- „In Einsatz übernehmen" ohne eine Zahl anzufassen führte ohne Rückfrage in die
  Lage: Kopfzeile von 6 auf 7 Einheiten, Gesamt von 59 auf 68. Auf dem Weg ohne
  „Nur Stärke" (volle Erfassung, dieselben Sollwerte) erscheint dagegen die
  Rückfrage „Stärke nicht gezählt — Stärke jetzt eintragen / Als Sollstärke
  ablegen" (gemessen, zweiter Tab-Lauf).
- Die Karte zeigt „Stärke 0 / 2 / 7 / 9" ohne Marke „Sollstärke, nicht gemeldet".
  Das Lageblatt führt Nr. 7 mit „0/2/7/9", Fahrzeuge 2 (Summe 24) und den Hinweisen
  „Kennzeichen fehlt; Kennzeichen fehlt". Die Einheit-Seite der Sammel-PDF druckt
  „Stärke (F / UF / M / Ges.): 0/2/7/9 [ ] von Hand geändert".

**Erwartung der Rolle:** Was ich nicht gezählt habe, soll nicht wie eine Zählung
aussehen. Auf dem Zettel steht eine Zahl, die ich übertrage; steht keine da, bleibt
das Feld leer oder fragt nach.

**Folge:** Am Meldekopf im Stehen wird die Einheit „aufgenommen", der Helfer tippt
„Übernehmen", und die Lage zählt neun Personen und zwei Fahrzeuge, die niemand
gemeldet hat. Das Lageblatt hängt mit dieser Zahl an der Wand und wird am Funk
vorgelesen. Wer die Zahlen dagegen mit „+" aufbaut, addiert zur Sollstärke
(R6-A8, nicht erneut gemessen).

**Empfehlung:** Dieselbe Rückfrage wie auf dem Weg ohne „Nur Stärke", wenn die
Zahlen noch den Sollwerten gleichen; den Hinweis über den Zählfeldern an die
Gleichheit der Zahlen binden und nicht an leere Personenkarten. Oder die
Zählfelder leer starten.

**Nachprüfung:** Typ „Bergungsgruppe" wählen, „Nur Stärke", ohne Eingabe
„In Einsatz übernehmen": Rückfrage oder Marke „Sollstärke, nicht gemeldet" an
Karte, Lageblatt und Sammel-PDF; Hinweis über den Zählfeldern sichtbar.

### R7-A2 [P3] Fehlende Abrückzeit bleibt auf Karte, Lageblatt und Übersichtsseite ungekennzeichnet

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** „Lage vom Papier abgleichen…", Ulm auf „abgerückt" ohne
Abrückzeit → Karte „Zeiten, Details und Aktionen", Lageblatt, Sammel-PDF Seite 1.

**Beobachtung:**
- Der Abgleich geht durch (R6-A6 behoben). Die Karte zeigt „abgerückt ändern" ohne
  Zeit und ohne Vermerk.
- Das Lageblatt führt Ulm im Block „Abgerückt (1)" mit „Zeit nicht bestätigt (vom
  Papier)" in der Spalte „Eingetroffen (abgerückt)", aber ohne Abrückzeit und ohne
  Hinweis, dass sie fehlt. Die Übersichtsseite der Sammel-PDF ist gleich.
- Die Rückfrage nach der Übernahme nennt nur „Für 5 Einheiten stand keine
  Eintreffzeit"; von der Abrückzeit schreibt sie nichts. Nur der Kasten über dem
  Bogen sagt „ABGERÜCKT (nicht mehr vor Ort)".

**Erwartung der Rolle:** R6-A6 empfahl, die Abrückzeit wie die Eintreffzeit zu
behandeln: „Abrückzeit nicht bestätigt". Wo auf dem Wandblatt keine Uhrzeit steht,
steht auch im Gerät keine, und das soll sichtbar sein.

**Folge:** Gering. Die Lücke ist ruhig statt falsch, aber bei der nächsten
Nachfrage „Seit wann ist Ulm weg?" zeigt das Papier eine leere Stelle, und niemand
weiß, ob sie noch offen oder nie bekannt war.

**Empfehlung:** Bei „abgerückt" ohne Zeit auf Karte, Lageblatt und Übersichtsseite
„Abrückzeit nicht bestätigt (vom Papier)" ausgeben; die Rückfrage nach der
Übernahme um diese Zahl ergänzen.

**Nachprüfung:** Einheit „abgerückt" ohne Zeit übernehmen: Karte, Lageblatt und
Sammel-PDF tragen den Vermerk.

### R7-A3 [P3] „weitergegeben/gesichert" meldet das Erzeugen einer Datei, nicht den Ablageort, und der Exportstand zählt das Erzeugen als Export

**Priorität:** P3

**Kennzeichnung:** beobachtet (Wortlaut, Exportstand); Folge Risiko.

**Fundstelle / Aufgabe:** Einsatzansicht → „Einsatz weitergeben / sichern",
„Lageblatt (A4 quer)", „Übersicht als CSV"; Exportstand „zuletzt 17:51 · seitdem
keine neuen Bögen".

**Beobachtung:**
- Nach „Einsatz weitergeben / sichern" steht „✓ Einsatz … als PDF
  weitergegeben/gesichert — mit allen Meldungen, Zeiten und Historie." Nach dem
  Lageblatt steht „✓ Lageblatt erzeugt (A4 quer)." Beide nennen keinen Ablageort.
  Das Einzel-PDF sagt dagegen „PDF gespeichert: … — liegt im Download-Ordner des
  Browsers."
- Es entsteht nur eine Datei. Von „weitergegeben" ist niemand erreicht worden.
- Der Exportstand schreibt nach dem Erzeugen „Übersicht als CSV: zuletzt
  23.10.2026, 17:51 · seitdem keine neuen Bögen"; „Nur neue Bögen seit dem letzten
  Export" rechnet von diesem Zeitpunkt.

**Erwartung der Rolle:** Weitergegeben ist, was der Stab in der Hand hat. Das Gerät
kann nur sagen, wo die Datei liegt.

**Folge:** Gering bis mittel (Risiko). Wird die Datei erzeugt und nie gedruckt oder
verschickt, nimmt der nächste Nachtrag mit „Nur neue Bögen" die schon als exportiert
geführten Einheiten nicht mehr mit, und der Stab bekommt sie nie. Auf Papier wäre es
umgekehrt: Was nicht übergeben ist, steht nicht auf der Strichliste.

**Empfehlung:** Wortlaut „als Datei erzeugt — liegt im Download-Ordner" wie beim
Einzel-PDF; beim Exportstand „zuletzt erzeugt" statt „exportiert", oder ein Haken
„dem Stab übergeben" als Bezugspunkt des Nachtrags.

**Nachprüfung:** Lageblatt und Sammel-PDF erzeugen: Meldung nennt den Ablageort;
Exportstand und Nachtrag unterscheiden „erzeugt" von „übergeben".

### R7-A4 [P3] Quittung nennt nur die Zahl der Namen mit nicht darstellbaren Zeichen, nicht die Person; die Ansprechperson steht als „????????"

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** „Bogen übergeben…" → „PDF erzeugen" mit Bogen Ulm, erste
Person „Владимир Lehmann"; Einzel-PDF Seite 1, Feld „Ansprechpartner/in".

**Beobachtung:**
- Die Quittung nach „PDF erzeugen" lautet jetzt: „1 Name enthält Zeichen, die die
  PDF nicht darstellen kann (z. B. kyrillisch, arabisch, Emoji) – sie stehen dort
  als „?". Der QR-Code trägt die Namen unverändert." (R6-A5, Quittung wirkt.)
- Auf dem Papier steht im Feld „Ansprechpartner/in" „???????? Lehmann". Die erste
  Person der Liste ist die Person, bei der der Meldekopf nachfragt.
- Die Quittung sagt nicht, welcher Name betroffen ist.

**Erwartung der Rolle:** Der Rückruf-Name ist die eine Stelle auf dem Papier, die
immer lesbar sein muss; sonst nennt die Quittung wenigstens die Person.

**Folge:** Gering. Wer die Quittung liest, weiß, dass etwas fehlt, aber nicht was; das
Wandblatt zeigt eine Reihe Fragezeichen, wo der Rückruf-Name stehen sollte.

**Empfehlung:** In der Quittung die Person nennen („Ansprechperson: Name nicht
darstellbar"); für die Ansprechperson die Umschrift auf dem Papier.

**Nachprüfung:** Bogen mit kyrillischer Ansprechperson drucken: Quittung nennt die
Person, das Feld ist lesbar oder gekennzeichnet.

## Bestätigtes

- **Kasten „Stand am Meldekopf" (R6-A1):** Nach dem Abgleich (17 Seitenbilder →
  18-seitige Sammel-PDF) lautet der Kasten über jedem Bogen und auf jeder
  Codeseite „Nr. 2 · Eingetroffen 23.10.2026, 17:42 (nicht bestätigt, vom Papier)";
  bei Nr. 1 mit der eingetragenen Zeit 09:15 ohne Marke. Übersicht und Lageblatt
  tragen „Zeit nicht bestätigt (vom Papier)" für dieselben Einheiten.
- **Kopfzeile (R6-A2):** Text ab y = 17 pt (6,0 mm) auf allen Bogenseiten der
  Sammel-PDF und auf Seite 1 des Einzel-PDFs („Meldekopf: Nr. ____ · eingegangen
  ____ um ____ Uhr · übertragen [ ] von ____ um ____ Uhr"). Probedruck weiterhin
  nicht möglich.
- **Blanko (R6-A4):** „Reicht der Platz nicht (mehr als 29 Personen, 4 Fahrzeuge
  oder 6 Qualifikationen): weiteren Vordruck als Beiblatt nehmen …"; die beiden
  Zeilen berühren sich bei 110 dpi nicht. Der Blanko aus der Startseite und aus der
  Einsatzansicht ist 2 Seiten stark.
- **Hinweis am Knopf (R6-A7):** In „Nacht" steht im Dialog „Bogen übergeben" unter
  „PDF erzeugen": „Das PDF ist immer hell, für Papier — auch in der Ansicht
  „Nacht"."
- **Abgleich (R6-A6):** „abgerückt" ohne Abrückzeit übernimmt alle 6 Einheiten; die
  Marke „vom Papier, Zeiten prüfen" steht an den fünf Karten ohne Eintreffzeit.
  Nr., Zug und Notiz kamen an (Lageblatt: Nr. 1 „1. TZ", Eintreffzeit 09:15; Nr. 2
  „1. TZ", „Deichwache Nord"). Der Bericht danach lautet „Abgeglichen bis auf die
  Eintreffzeit: 5 Einheiten … Sie lässt sich hier nachtragen" und ersetzt den
  veralteten Satz „alle stehen als anwesend, ohne Zug, Auftrag und Nummer".
- **Rückfrage „Eintreffzeit nicht bestätigt":** Nach „Abgleich übernehmen" nennt
  ein Fenster die fünf Einheiten namentlich, erklärt, was weiter gilt, und braucht
  „Alles klar". Es liegt auf 360 × 640 px vollständig im Bild.
- **Rückfrage „Stärke nicht gezählt":** Bei voller Erfassung mit unveränderten
  Sollwerten fragt die App vor „In Einsatz übernehmen" nach (siehe R7-A1 für den
  Weg „Nur Stärke").
- **Lageblatt:** Nach Nr. sortiert (Nr. 1–6, Block „Abgerückt (1)"), Nachtragszeilen
  mit „übertragen [ ] ______", „Summe laut Gerät (5 zählend · 1 abgerückt)",
  „Summe einschl. Nachträge", Zug „1. TZ" und Funkrufname/Rückruf je Einheit.
- **Nur-Stärke-Einheit auf Papier (R6-A3):** Im Sammel-PDF stehen bei Sinsheim keine
  „Ausstattung nach StAN: ja [X]"-Angabe und kein Funkrufname; das Fahrzeugfeld ist
  leer. Rest: Fahrzeugsumme im Lageblatt (siehe Abgleich).
- **Rückweg vom Papier:** 17 Bilder → 6 Bögen aufgenommen; Lage 59 Personen wie im
  Original. Bericht nennt die Dateien ohne lesbaren QR-Code und den Grund.
- **Exportstand:** Nach „Übersicht als CSV" steht „zuletzt 23.10.2026, 17:51 ·
  seitdem keine neuen Bögen"; nach Ankreuzen von „Nur neue Bögen" je Format ein
  eigener Bezugspunkt („Sammel-PDF an den Stab: noch nicht in diesem Format
  exportiert — alle Bögen sind neu").
- **Lagemonitor:** Zweites Fenster mit Funkrufname, Einsatzname, Uhrzeit, Stärke
  „0 / 14 / 41 // 55", „5 Einheiten · 20 Fahrzeuge · 1 abgerückt", „letzte Meldung
  vor 1 Min", „seit erster Meldung: 0 Stunden, 6 Minuten", ohne Personennamen. Es
  folgt dem Abrücken einer Einheit nach wenigen Sekunden und läuft nach dem
  Schließen des Hauptfensters weiter (liest denselben Gerätespeicher).
- **Manuelle Erfassung:** „Eingetroffen um (vom Meldeblock)", „Nr. laut Zettel
  (leer = die App vergibt)", „Zug / Verband (laut Zettel)" vorhanden; Nr. 7, Zug
  „1. TZ" und Eintreffzeit 10:30 stehen in Lageblatt und Sammel-PDF.
- **Zurück-Taste:** Auf der Startseite schließt sie die Fenster „Neue
  Einsatz-Sammlung", „Einheit schnell erfassen" und „Einsatz löschen?" (mit Hinweis
  „Papierkorb, 30 Tage") und verlässt die Seite nicht; aus dem Bogen führt sie zur
  Startseite.
- **Offline:** 25 s nach dem ersten Laden: „✓ Jetzt offline bereit …", Blanko
  lässt sich ohne Netz erzeugen, die Seite lädt nach `setOffline` mit Status 200.
  Unmittelbar nach dem Laden (2 s, 0,4 von 6,9 MB) sagt die App ehrlich „⚠ Noch
  nicht offline bereit" und beim Blanko „Der Baustein dafür ließ sich nicht
  nachladen … mit Verbindung die Seite neu laden"; ein erster Aufruf ohne Netz
  scheitert erwartungsgemäß. Der Blanko ist also erst nach dem vollständigen Laden
  garantiert (Verweis auf `offline-und-speicher.md`).
- **Geräteuhr:** Bei 120 Tagen Sprung steht oben „Geräteuhr prüfen … Bis du
  antwortest, löscht und anonymisiert die App nichts." mit Zahl der betroffenen
  Sammlungen; „Geräteuhr stimmt" öffnet eine zweite Rückfrage „Datum stimmt — jetzt
  endgültig löschen?" mit „nicht im Papierkorb" und „Abbrechen".
- **Große Schrift:** Bei `html{font-size:200%}` bleibt die Fußleiste im
  Assistenten bei 136 px Höhe (24 % von 568 px, 21 % von 640 px) und bei 69 px im
  Querformat; „In Einsatz übernehmen" und „Weiter →" bleiben erreichbar (Deckel
  hält).

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
|---|---|---|---|
| Bogen der Einheit ausfüllen | Vorlage, StAN-Vorbelegung, Summen, Prüfhinweise | Blanko aus App oder Datei, 2 Seiten, Meldekopf-Kasten, 29 Personalzeilen, Beiblatt-Hinweis mit Personenzahl; erst nach vollständigem Laden (6,9 MB) offline garantiert | „Einheit manuell erfassen…" mit „Nr. laut Zettel", „Zug / Verband", „Eingetroffen um"; „Nur Stärke" nur mit Sollzahlen-Falle (R7-A1) |
| Bogen übergeben | QR, Link, Datei, PDF mit Code | Einzel-PDF mit Kopfzeile je Seite, „von Hand geändert"; Quittung nennt nicht darstellbare Namen (R7-A4) | Code aus Seitenbild lesbar; Bericht nennt Dateien ohne Code |
| Lage führen | Laufende Summen, Zwischensummen je Zug, Lagemonitor, Lageblatt nach Nr. | Lageblatt mit Nachtragszeilen und „übertragen"; Exportstand je Format (R7-A3) | Nachtrag vom Zettel mit Nr., Zug, Zeit; Sollstärke ohne Marke bei „Nur Stärke" (R7-A1) |
| Geräteausfall Meldekopf | „Einsatz weitergeben / sichern": Datei bringt alles zurück | Letzte Sammel-PDF mit Kopfzeile je Seite und Kasten „Stand am Meldekopf" mit Marke | Nur Papier: 6 von 6 Bögen, Abgleich mit Nr., Zug, Notiz, Status; nicht bestätigte Zeit bleibt sichtbar, Abrückzeit ohne Vermerk (R7-A2) |

## Würde ich dafür das Papier weglegen?

Für den Wiederanlauf nach einem Geräteausfall ja: Der Kasten über dem Bogen sagt
jetzt dasselbe wie die Übersicht, die Kopfzeile trägt Nr., Einheit und Blatt, und
der Abgleich holt Nr., Zug und Status zurück. Für die Aufnahme einer eintreffenden
Einheit nur nach Stärke noch nicht ohne Gegenprobe: Solange die Sollzahlen ohne
Hinweis als Zählung in die Lage gehen (R7-A1), vergleiche ich die erste Zeile im
Lageblatt mit dem Meldeblock, bevor ich sie vorlese. Der Probedruck der Kopfzeile
bleibt offen, weil er sich hier nicht prüfen lässt.

## Abgleich mit Runde 6

Grundlage: [../runde-6/analog-first.md](../runde-6/analog-first.md) samt „Stand der
Behebung" (5 behoben, 4 teilweise, 0 offen).

| Runde-6-Befund | Stand laut Tabelle | Bewertung Runde 7 | Beobachtung |
| --- | --- | --- | --- |
| R6-A1 Kasten ohne „nicht bestätigt" (P2) | behoben | **hält** | „(nicht bestätigt, vom Papier)" in Kasten und Codeseite; bei bestätigter Zeit ohne Marke (gemessen, 18 Seiten). |
| R6-A2 Kopfzeile 2,1 mm vom Rand (P2) | behoben | **hält** | Text bei y = 17 pt (6,0 mm). Probedruck nicht möglich. |
| R6-A3 StAN „ja [X]" und Funkrufname bei „Nur Stärke" (P2) | teilweise | **wirkt teilweise, wie angegeben** | „nach StAN: ja" und Funkrufname entfallen. Lageblatt zählt 2 vorbelegte Fahrzeuge (Summe 24) und nennt „Kennzeichen fehlt" doppelt. |
| R6-A4 Beiblatt-Hinweis ohne Personal (P3) | behoben | **hält** | „mehr als 29 Personen" steht im Hinweis; Zeilen berühren sich nicht. |
| R6-A5 Nicht darstellbare Namen als „?" (P3) | teilweise | **wirkt teilweise, wie angegeben** | Quittung nennt die Zahl; Person und Ansprechperson bleiben ungekennzeichnet (R7-A4). |
| R6-A6 Abgleich verweigert bei fehlender Abrückzeit (P3) | behoben | **hält, mit Rest** | Abgleich geht durch; die fehlende Abrückzeit steht nirgends als „nicht bestätigt" (R7-A2). |
| R6-A7 Hinweis „PDF hell" fern vom Knopf (P3) | behoben | **hält** | Satz im Dialog „Bogen übergeben" bei „PDF erzeugen", auch in „Nacht". |
| R6-A8 „Nur Stärke" startet mit Sollzahlen (P3) | teilweise | **wirkt im Normalfall nicht** | Der Hinweis über den Zählfeldern erscheint bei „Bergungsgruppe" nicht; kein Rückfragefenster, keine Marke (R7-A1, angehoben auf P2). |
| R6-A9 Stapelbericht bei Erfolg mit Warnzeile (P3) | teilweise | **wirkt teilweise, wie angegeben** | „17 Bilder gelesen — 6 Bögen aufgenommen. 9 Bilder ohne lesbaren QR-Code … bei Bogen- und Übersichtsseiten normal". Die Zählung „6 von 6 Einheiten" fehlt weiter. Kein neuer Befund. |

Bilanz: Von neun Runde-6-Befunden halten fünf (A6 mit Rest), drei wirken teilweise
wie angegeben (A3, A5, A9), einer wirkt im Normalfall nicht (A8). Nichts hat sich
ins Gegenteil verkehrt. Nebenwirkungen der Runde-6-Änderungen auf diese Rolle: Die
neue Rückfrage „Eintreffzeit nicht bestätigt" hilft und blockiert nichts; der
Exportstand und der Lagemonitor sind sachlich, tragen aber an einer Stelle das Wort
„Export" für das bloße Erzeugen einer Datei (R7-A3). Die Zurück-Taste, die
Offline-Zeile, die Geräteuhr-Rückfrage und der Deckel der Fußleiste bei großer
Schrift verhielten sich wie beschrieben.

## Abschluss

- **Aufgabe geschafft:** Papier erzeugen: ja. Nachtrag vom Meldeblock mit Nr., Zug
  und Zeit: ja. Wiederanlauf nur vom Papier: ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Dass „Nur Stärke" mit den vorbelegten Zahlen eine
  Zählung wäre, weil die Zahlen so aussehen und niemand nachfragt.
- **Größtes Einsatzrisiko:** Eine am Meldekopf nur nach Stärke aufgenommene Einheit
  geht mit Sollzahlen und zwei Fahrzeugen ohne Marke in Lage, Lageblatt und
  Sammel-PDF (R7-A1).
- **Top-Priorität für die nächste Iteration:** Bei „Nur Stärke" mit unveränderten
  Sollzahlen eine Rückfrage oder eine Marke „Sollstärke, nicht gemeldet" zeigen
  (R7-A1).

**Zählung:** P0 0 · P1 0 · P2 1 · P3 3.
