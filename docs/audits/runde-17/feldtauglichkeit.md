# Audit „Helfer im Feld“, Runde 17 (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-10-27 ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Code-Stand
Commit `be6b396` (`main`).

Zählung: **P0 0 · P1 0 · P2 0 · P3 9**

Reiner Prüfbericht, keine Codeänderung. Ab dieser Runde gibt es keine „bekannten
Grenzen“ mehr: Reste aus den Runden 11 bis 16 („teilweise“, „offen“), die im
Browser noch zu beobachten sind, stehen mit Verweis im Feld „Neu oder alt“.

## Prüfaufbau

Playwright/Chromium (globales Modul, `chromium.launch()` ohne Optionen),
`isMobile`/`hasTouch`, Locale de-DE, Telefon 360 × 640 und 390 × 844, einzelne
Läufe 320 × 568 (Ansichten „Feld“ und „Nacht“). Frischer Kontext je Lauf. Einsatzdaten:
(a) Sammlung „Hochwasser Musterstadt“ aus 8 vorbereiteten Einträgen, (b) frisch
angelegte Sammlung, in die 7 bzw. 30 Übungsbögen aus `examples/thw/` mit
aktuellem Stand über „Bögen einlesen…“ eingespielt wurden; eigener Bogen im
Assistenten (Husum, Bergungsgruppe), einmal als Schnellerfassung.

Durchgespielt: Startseite (Erstbesuch, Entwurf, Verwerfen), Assistent Schritt 1 bis 6
(Ortsvorschläge, Einheitstyp, Eingabeattribute, „Namen einfügen…“, Browser-Zurück),
Schnellerfassung, Sammlung: Kenntnisnahme, Karte aufklappen, „Abrücken“ (auch
Zweittipp), „Mehr…“, „Stärke ändern…“, „Auftrag/Notiz“, „Zug zuordnen“,
Tabelle, Scanner ohne Kamera, Dateien einlesen (Müll, Duplikat, kaputtes Bild),
Sammel-PDF mit 7 und 30 Bögen, Lageblatt, CSV, Excel, „Bogen als PDF“, Neuladen,
Neuladen ohne Netz, Anzeigemodi „Feld“ und „Nacht“.

**Nicht verifiziert:** echte Handschuhe und nasse Finger, Sonnenlicht und
Dunkelheit am Display, Kamera-Scan, echte Bildschirmtastatur und Autokorrektur,
WebKit/Safari, echtes Drucken, voller Speicher, Inhalt der erzeugten PDF-Seiten.
Die Hinweise „Anderer Einsatz?“ und „Zeitraum vorbei“ stammen aus der
Herkunft der Übungsbögen (andere Orte, andere Daten) und wurden nicht gewertet.

## Urteil

Alle Szenarien wurden **abgeschlossen**, ohne Datenverlust und ohne Sackgasse.
Es gibt keinen P0-, P1- oder P2-Befund; neun Kleinigkeiten (P3), davon fünf
Rest-Befunde aus früheren Runden, die im Browser weiterhin zu sehen sind.

## Nachprüfung der Behebungen aus Runde 16 im echten Browser

- **R16-H1 Verweise im Kasten „Neu seit der letzten Kenntnisnahme“:** „Zur Liste
  springen“, „Alle 7 einzeln anzeigen“, „Zuletzt gemeldete oben zeigen“ und
  „Zur Kenntnis genommen“ messen bei 360 × 640 mindestens 44 px; keine Zielfläche
  unter 44 px außer den 24-px-Kästchen in ihren Beschriftungen. Hält.
- **R16-H2 Namensfelder höherer Ebenen:** In Schritt 1 haben alle Textfelder der
  Zeilen (auch RB und LV, „Organisationsname“) `autocorrect=off`,
  `autocomplete=off`, `spellcheck=false`. Hält (zu weiteren Feldern siehe R17-H2).
- **R16-H3 Sprünge beim Erstbesuch:** hält nicht, siehe R17-H1.
- **Quittungsleiste:** „Abgerückt 17:24: Nr. 2 „THW Laufenburg Zugtrupp Fachzug
  Logistik““ und „Zur Kenntnis genommen: 7 Einheiten“ vollständig, 44-px-Knöpfe
  „Rückgängig“ und „✕“. Hält.
- **Doppeltipp-Sperre „Einen Moment …“:** fängt Zweittipps ab (siehe R17-H3 zur
  Reichweite). Hält.
- **Sammel-PDF:** Hinweis „bei 30 Bögen am Telefon etwa 45 Sekunden … Nicht noch einmal
  tippen“ während der Erzeugung, danach Quittung „✓ Einsatz … als PDF erzeugt“ und
  ein Download (gemessen rund 8 s bei 30 Bögen, die Schätzung ist also deutlich zu
  hoch, aber unschädlich). Hält.
- **Verwerfen eines Entwurfs:** Rückfrage „Angefangenen Bogen verwerfen?“ mit dem
  Hinweis auf „Zuletzt geschlossenen Bogen zurückholen“. Hält.
- **Browser-Zurück im Assistenten:** Schritt 3 → 2 → 1 → Startseite, ohne Verlust des
  Entwurfs. Hält.
- **Dateien einlesen:** beschädigte JSON-Datei, älterer Stand und unlesbares Bild
  erzeugen je eine verständliche Meldung („nur in die Historie gelegt, die Lage
  bleibt unverändert“). Hält.
- **Neuladen ohne Netz:** Startseite erscheint, App bleibt bedienbar. Hält.
- **Anzeigemodi „Feld“ und „Nacht“:** bei 320, 360 und 390 px kein seitliches
  Überlaufen; feste Leisten 57 bis 81 px. Hält.

## Befunde

### R17-H1 [P3] Beim Erstbesuch springen die Knöpfe der Startseite weiter um 42 bis 58 px

**Neu oder alt (Verweis):** alt — wie R16-H3, weiter offen.
**Evidence:** Observed (frischer Kontext, 360 × 640 und 390 × 844, Lage alle 100 bis
200 ms gemessen).
**Ort:** Startseite, grüner Kasten „Jetzt offline bereit … Übungsbögen und
Themenseiten werden nachgeladen (n von 549)“ und darunter „Neue Einsatz-Sammlung…“,
„Einheit schnell erfassen (nur Stärke)…“.
**Beobachtung:** Der Kasten wechselt in den ersten rund vier Sekunden mehrfach seine
Höhe (727 → 769 → 727 px Kastenhöhe bei 360 px); „Neue Einsatz-Sammlung…“ liegt
dabei bei 360 px erst bei 753, dann bei 811 px, bei 390 px bei 830 und 888 px. Danach
steht ein kurzer Satz („Funktioniert komplett offline“).
**Erwartung des Helfers:** Knöpfe, die stillstehen, wenn er sie antippt.
**Folge:** Gering. Ein Tipp in dieser Zeit trifft die Lücke oder den Nachbarknopf
(„Einheit schnell erfassen“ fragt nur nach der Sammlung, „Abbrechen“ genügt). Es
tritt nur beim ersten Aufruf mit Netz auf, also zu Hause oder in der Unterkunft.
**Empfehlung:** Dem Kasten eine feste Höhe für die längste Fassung geben oder den
Fortschritt unterhalb der Knöpfe zeigen.
**Nachprüfung:** Frischer Browser, Startseite: Oberkante von „Neue Einsatz-Sammlung…“
bleibt in den ersten zehn Sekunden gleich.

### R17-H2 [P3] Funkrufname, Einsatzname und Einsatzort lassen Autokorrektur und Rechtschreibprüfung an

**Neu oder alt (Verweis):** neu — gleiche Art wie R16-H2 (dort die Ebenen in Schritt 1,
behoben), hier andere Felder.
**Evidence:** Observed für die Attribute (`autocorrect` nicht gesetzt, `spellcheck` =
true, 360 × 640). Wirkung auf einer echten Bildschirmtastatur **nicht verifiziert**
(Likely).
**Ort:** (a) Sammlung, Fuß der Seite: „Funkrufname (optional)“ (Platzhalter
„z. B. Salus Übungsleitung“); (b) Dialog „Neue Einsatz-Sammlung anlegen“: „Name“
(„z. B. Hochwasser Weser“) und „Ort / Auftrag (optional)“ („z. B. Deichabschnitt Nord“);
(c) Einsatzkopf „Ort eintragen…“: „Name“, „Ort / Auftrag (optional)“, „Einsatzbeginn“;
(d) Karte › „Auftrag/Notiz“ („z. B. Deichabschnitt Nord ab 14:00“).
**Beobachtung:** Die Felder „Zug“ (z. B. „3. Zug“), Ort der Einheit, Kürzel, Telefon
und die Namen in Schritt 3 haben Autokorrektur und Prüfung aus; diese Felder nicht.
**Erwartung des Helfers:** Er tippt „Heros Husum 22/51“ oder „Deichabschnitt Nord“ und
erwartet den Text so, wie er ihn getippt hat.
**Folge:** Gering. Eine „Korrektur“ würde den Funkrufnamen oder Ortsnamen im Lageblatt
und in der Sammel-PDF verfälschen; der Fehler fiele erst beim Lesen auf.
**Empfehlung:** Autokorrektur, Rechtschreibprüfung und Autovervollständigung an den
genannten Feldern abschalten (Funkrufname, Einsatzname, Ort/Auftrag); bei der
Freitext-Notiz bewusst entscheiden.
**Nachprüfung:** Die vier Stellen öffnen: Felder haben `autocorrect=off` und
`spellcheck=false`.

### R17-H3 [P3] Die Doppeltipp-Sperre „Einen Moment …“ schluckt auch Tipps auf andere Knöpfe, bei „Weiter“ bis rund 1 s

**Neu oder alt (Verweis):** neu — Nebenwirkung der Sperre aus R14-G1/R15-G1/R16-D1.
**Evidence:** Observed (360 × 640, Abstand der Tipps gemessen).
**Ort:** (a) Assistent, „Weiter →“ zweimal hintereinander; (b) Karte: „Abrücken“,
dann „Mehr…“.
**Beobachtung:** (a) Zweiter „Weiter“-Tipp nach 300 und 700 ms: kein Schrittwechsel,
„Einen Moment …“; nach 1,1 s funktioniert er. (b) „Mehr…“ 0,5 und 1,0 s nach
„Abrücken“: kein Aufklappen, „Einen Moment …“; nach 1,5 s funktioniert es. Die
Sperre ist also seitenweit und nicht auf den Knopf bezogen, der gerade getippt wurde.
**Erwartung des Helfers:** Ein anderer Knopf reagiert immer; nur der gleiche Knopf
wird gegen Doppeltippen geschützt.
**Folge:** Gering. Wer in Schritt 2 (oft leer) schnell weitertippt oder nach „Abrücken“
sofort „Mehr…“ braucht, tippt ein zweites Mal; die Rückmeldung „Einen Moment …“
erklärt es, kostet aber eine Sekunde und einen Tipp.
**Empfehlung:** Sperre je Knopf oder je Aktion, nicht für die ganze Seite; bei
„Weiter“ kürzer oder entfallen lassen (Schrittwechsel ist harmlos und umkehrbar).
**Nachprüfung:** „Weiter“ zweimal im Abstand von 500 ms: zwei Schritte weiter;
„Abrücken“ und nach 500 ms „Mehr…“: Mehr klappt auf.

### R17-H4 [P3] „✓ Abgerückt“ sieht wie eine Statusanzeige aus, setzt aber beim Antippen den Status zurück

**Neu oder alt (Verweis):** neu — Folgebefund zu R14-G1 (Abrücken-Knopf).
**Evidence:** Observed (360 × 640): „Abrücken“ → Knopf heißt „✓ Abgerückt“, gestrichelter
Rand; Tipp darauf nach der Sperrzeit → Quittung „Wieder anwesend 17:25: Nr. 2 …“.
**Ort:** Karte aufgeklappt, Knopfleiste.
**Beobachtung:** Das Häkchen und der gestrichelte Rand zeigen Zustand; der Knopf
bleibt aber bedienbar und kehrt die Aktion um. Die Quittung mit „Rückgängig“ erscheint
(gut).
**Erwartung des Helfers:** „Abgerückt“ mit Haken ist erledigt; ein weiterer Tipp
bestätigt oder bewirkt nichts.
**Folge:** Gering. Die Einheit zählt wieder in die Stärke und steht wieder in der Lage;
ein unbemerktes Zurücksetzen fällt erst bei der Summe auf. Behebbar durch das
sichtbare „Rückgängig“.
**Empfehlung:** Rückkehr zu „anwesend“ als eigenen, benannten Knopf („Wieder
anwesend melden“) anbieten oder mit Rückfrage; den Haken-Zustand nicht als
tippbaren Knopf gestalten.
**Nachprüfung:** Karte einer abgerückten Einheit öffnen: es gibt keinen Knopf, der
wie eine Anzeige aussieht und den Status umkehrt.

### R17-H5 [P3] „Namen einfügen…“: Rufnummer am Zeilenende wird als Name zerlegt, die Person nicht übernommen

**Neu oder alt (Verweis):** alt — wie R16-E1, weiter teilweise offen (neuer Fall).
**Evidence:** Observed (360 × 640, Schritt 3, Eingabe `Anna Maria Schmidt`,
`Müller, Hans`, `Peter van der Berg GrFü`, `Kevin Meier 0171 1234567`,
`Susanne Kraus-Wolf; TrFü`).
**Ort:** Schritt 3 „Personal“ › „Namen einfügen…“, Vorschau.
**Beobachtung:** Vier Zeilen werden sauber erkannt („Schmidt, Anna Maria“, „van der Berg,
Peter · GrFü · Reihenfolge prüfen“, „Kraus-Wolf, Susanne · TrFü“). Die Zeile mit der
Nummer erscheint als „1234567, Kevin Meier 0171 · wird nicht übernommen · kein Name?“;
Knopf: „4 Personen übernehmen“.
**Erwartung des Helfers:** Eine Liste mit Handynummern ist üblich; „Kevin Meier“ wird
übernommen, die Nummer landet im Telefonfeld oder wird ignoriert.
**Folge:** Gering. Die Zeile ist sichtbar markiert und lässt sich anhaken; wer nur auf
„4 Personen übernehmen“ tippt, verliert „Kevin Meier“ ohne weiteren Hinweis.
**Empfehlung:** Rufnummer am Zeilenende erkennen (wie bei Tabulator-/Semikolon-Zeilen)
und abtrennen; Übernahmeknopf nennt die nicht übernommene Zeile („4 übernehmen,
1 nicht“).
**Nachprüfung:** Die Zeile `Kevin Meier 0171 1234567` einfügen: Vorschau „Meier, Kevin“
mit Telefon, Knopf zählt 5.

### R17-H6 [P3] Schnellerfassung: „In Einsatz übernehmen“ ist der kleinste, hellste Knopf der Leiste und umbricht in zwei Zeilen

**Neu oder alt (Verweis):** neu.
**Evidence:** Observed (360 × 640, Schritte 3 und 4 der Schnellerfassung).
**Ort:** Untere Leiste: „←“, „◐“, „In Einsatz übernehmen“ (85 × 52 px, weißer Grund,
zweizeilig), „Weiter →“ (dunkel, 104 × 44 px, größte Fläche).
**Beobachtung:** Die Leiste führt mit dem dunklen „Weiter →“ in die Schritte 4 bis 6
(bei der Schnellerfassung optional), während die eigentliche Abschlusshandlung hell
und klein steht. Zwischen den Knöpfen liegen 12 bis 20 px.
**Erwartung des Helfers:** Der Meldekopf nimmt eine Einheit im Stehen auf; er sucht den
Knopf „fertig, übernehmen“ und tippt den auffälligsten.
**Folge:** Gering. Wer „Weiter →“ tippt, landet in Fahrzeug-/Bedarfsschritten, die er
nicht braucht, und muss zurück oder dort „In Einsatz übernehmen“ finden; kein Verlust.
**Empfehlung:** In der Schnellerfassung „In Einsatz übernehmen“ als Hauptknopf
(dunkel, breiter), „Weiter →“ als Nebenknopf.
**Nachprüfung:** Schnellerfassung, Schritt 3, 360 × 640: der dunkle Knopf ist
„In Einsatz übernehmen“, einzeilig.

### R17-H7 [P3] Quittungsleiste und Ansichtsleiste verdecken zusammen ein Viertel des Bildschirms

**Neu oder alt (Verweis):** alt — wie R11-M3 und R15-M2, weiter offen.
**Evidence:** Observed (360 × 640, Karte aufgeklappt, nach „Abrücken“ und nach
„Zur Kenntnis genommen“).
**Ort:** Einsatzansicht, untere Bildschirmkante.
**Beobachtung:** Quittung (rund 106 px, drei Zeilen und zwei Knöpfe) plus Leiste
„Ansicht: Standard“ (57 px) belegen 162 px von 640, also 25 %. Das Ziel der letzten
Handlung (z. B. die Karte darunter) liegt dahinter und muss weggescrollt werden. Bei
390 × 844 ist es ein Fünftel.
**Erwartung des Helfers:** Rückmeldung ja, aber ohne den Bereich zu verdecken, in dem
er gerade arbeitet.
**Folge:** Gering. Die Quittung bleibt stehen, bis „✕“ oder „Rückgängig“ getippt wird;
bis dahin ist der nutzbare Bereich auf 478 px geschrumpft.
**Empfehlung:** Quittung nach Zeit einzeilig führen (wie in R16-W1 bei der
Quittungsleiste) und die Ansichtsleiste beim Bildlauf nach unten einziehen.
**Nachprüfung:** 360 × 640, Quittung offen: belegte Fläche höchstens 15 %.

### R17-H8 [P3] Tabellenansicht am Telefon: 31 Spalten, 1 835 px breit, Auftrag, Eintreffzeit und Bedarf erst nach mehreren Wischbewegungen

**Neu oder alt (Verweis):** neu — Folge von R15-N2 (Wischhinweis, behoben); der Hinweis
„Zum Weiterlesen seitlich wischen →“ steht, die Breite bleibt.
**Evidence:** Observed (360 × 640).
**Ort:** Einheitenliste › „Tabelle“.
**Beobachtung:** Die Tabelle ist 1 835 px breit bei 326 px Sichtbreite (5,6 Bildschirme);
sichtbar bleiben „Einheit“, „Ges.“, „F“, „U“, „M“. Zeilen sind rund 90 bis 110 px hoch
(Einheitsname umbricht in 4 bis 5 Zeilen), im Sichtfenster stehen drei bis vier
Zeilen.
**Erwartung des Helfers:** Auf einen Blick: Einheit, Stärke, Auftrag, Meldung vor, Bedarf.
**Folge:** Gering. Die Kartenansicht deckt das ab; die Tabelle ist am Telefon eher
Export-Vorschau als Arbeitsansicht.
**Empfehlung:** Am Telefon eine Kurzspaltenauswahl (Einheit, Gesamt, Auftrag,
Meldung vor, Bedarf) als Voreinstellung, „Alle Spalten“ wählbar.
**Nachprüfung:** 360 × 640: Tabelle zeigt ohne seitliches Wischen mindestens
Einheit, Gesamt, Meldung vor und Bedarf.

### R17-H9 [P3] Verweise in Fließtext und Verweisreihen der Startseite sind nur 17 px hoch

**Neu oder alt (Verweis):** alt — wie R14-H3 / R15-Feldtauglichkeit („Fließtext-Verweise
bleiben 17 px hoch“), weiter offen.
**Evidence:** Observed (360 × 640 und 390 × 844; gemessen 17 px Höhe).
**Ort:** Startseite, Abschnitt „Für welche Organisationen?“: „Erfassungsbogen im THW“,
„Feuerwehr“, „DLRG“, „DRK“, „Johanniter“, „Malteser“, „ASB“ (33 bis 75 px breit, in
Zeilen mit rund 7 px Abstand), außerdem „Anleitung zum Erfassungsbogen“, „Papier oder
digital?“.
**Beobachtung:** Dieselben Ziele sind weiter unten in der Länderliste 44 px hoch.
**Erwartung des Helfers:** Eine Reihe von Verweisen trifft er mit dem Daumen.
**Folge:** Gering (Nachschlageseiten, kein Einsatzvorgang): Fehltipps öffnen die Seite
der Nachbarorganisation.
**Empfehlung:** Die Organisationsreihe als Knopfreihe mit 44 px Höhe, oder in
Fließtext Zeilenabstand vergrößern.
**Nachprüfung:** 360 × 640: alle Verweise der Reihe messen mindestens 44 px Höhe.

## Comprehension check

- Orientation: understood
- Next action: understood
- System status: understood
- Error recovery: understood (Rückgängig bei Abrücken, Kenntnisnahme, Zug; Rückfragen
  bei Verwerfen; Browser-Zurück)
- Field suitability: limited (nicht verifiziert: Handschuhe, Sonnenlicht, Kamera,
  echte Tastatur; die gemessenen Befunde sind alle P3)
