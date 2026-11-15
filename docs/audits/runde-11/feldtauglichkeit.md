# Audit „Helfer im Feld“, Runde 11 (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-10-25 ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Code-Stand
Merge „Runde 10“ (`37ee21d`).

Zählung: **P0 0 · P1 0 · P2 1 · P3 3**

Reiner Prüfbericht, keine Codeänderung. Bekannte Grenzen und die Reste aus
Runde 10 (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5,
R8-H5/S4, leere Karten bei „Nur Stärke“, Rückgängig für Meldungen überlebt das
Neuladen nicht, Tabellenzeilenhöhe bei 180 × 320) wurden nicht neu gemeldet.

## Prüfaufbau

Playwright/Chromium (`chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`,
Locale de-DE, Telefon 390 × 844 und 360 × 640, dazu 640 × 360, 320 × 480 und
360 × 340 (Stand-in für eine eingeblendete Tastatur). Jeder Lauf mit frischem
Browser-Kontext. Einsatzdaten kamen aus den Übungsbögen unter `examples/thw/`
(Kopien mit `uebung: false`, aktuellem Zeitraum und aktuellem Stand, über
„Bögen einlesen…“ bzw. „Aus Datei laden…“ eingespielt), nicht aus
`localStorage`-Seeds. Durchgespielt, jeweils vom natürlichen Einstieg aus:

1. Neuen Bogen anlegen: Einheit, Einsatz, Personal (Kurz-Liste, Karten,
   „Namen einfügen…“), Fahrzeuge, Sofortbedarf, Übersicht, „Bogen übergeben…“.
2. Meldekopf: Sammlung anlegen, 2 bis 40 Bögen einlesen, Karten und Tabelle,
   Suche, Zug zuordnen (sechs Schreibweisen), Eintreffzeit ändern (Zukunft),
   „Einheit manuell erfassen…“ (auch kurz nach Mitternacht mit Uhr 00:10 und
   Zettelzeit 23:50), Schnellerfassung, Lageblatt/Sammel-PDF/CSV-Download,
   zwei Sammlungen mit ähnlichem Namen und Datei-Empfang von der Startseite.
3. Unterbrechungen: Browser-Zurück aus Dialogen und Schritten, Entwurf bei
   „Neuen Bogen erstellen“, Offline nach geladenem Dienst (Neuladen, Bogen,
   PDF-Erzeugung), Tastaturhöhe 340 px mit Ortsvorschlägen.
4. Ansicht „Feld“ gegen „Standard“ (Zielgrößen, Schriftgrößen), Schriftgröße der
   Eingabefelder (alle ≥ 16 px, kein Zoom beim Fokussieren).

Reihenfolge: zuerst blind getestet, danach die beiden Übersichten unter
`docs/audits/` gelesen.

**Nicht prüfbar** und deshalb *nicht verifiziert*: echte Handschuhe und nasse
Finger, Sonnenlicht und Dunkelheit am Display, Kamera-Scan (der Testbrowser
meldet „keine nutzbare Kamera“; die Handscanner-Ausweichseite erscheint), native
Datums- und Zeitauswahl (der Testbrowser zeigt 12-Stunden-Zeit und
Monat/Tag/Jahr), echte Bildschirmtastatur samt Autokorrektur der Namensfelder
(Personennamen tragen `spellcheck=true`, ohne `autocorrect="off"`; ob eine
Telefontastatur „Lüdenscheidt“ oder „Haßmersheim“ verändert, ist nicht
gemessen), Zurück-Geste der installierten App, WebKit/Safari, echtes Drucken.

## Urteil

Alle sieben Szenarien wurden **abgeschlossen**. Der Kernweg (Bogen anlegen,
übergeben, am Meldekopf aufnehmen, abrücken, weitergeben) trägt, auch offline.
Neu gefunden wurden vier Stellen, an denen die App eine Eingabe nur in genau
einer Schreibweise versteht. Sie kosten Zeit und Vorbelegung, verlieren aber
keine Daten und werden zum Teil durch Hinweise aufgefangen.

Gedachtes Modell des Helfers: Er tippt Ortsnamen, Einheitentypen und Funktionen
so, wie er sie spricht und auf Papier schreibt („Hassmersheim“, „FGr
Wasserschaden“, „Gruppenfuehrer“), und erwartet, dass die App das findet.

## Befunde

### R11-H1 [P2] „Ort der Einheit“ findet „Hassmersheim“ nicht; Zugehörigkeit bleibt leer

**Evidence:** Observed.
**Ort:** Schritt 1, Feld „Ort der Einheit (Pflicht)“ (Vorschlagsliste), ebenso
„Einheit manuell erfassen…“ im Einsatz.
**Beobachtung:** Tippt man „Haßmersheim“, erscheint der Vorschlag, und mit ihm
füllen sich Dienststellen-Kürzel (OHAS), Telefon, E-Mail sowie die Ebenen
RB Mannheim (GMAN) und LV Baden-Württemberg (LVBW) samt Rufnummern. Tippt man
„Hassmersheim“, „Muellheim“ („Müllheim“), „Tuebingen“ oder „Schwaebisch Hall“,
kommt weder ein Vorschlag noch ein Hinweis. Das Feld bleibt Freitext, Kürzel,
Telefon, E-Mail, RB und LV bleiben leer. „Mullheim“ und „Tubingen“ (nur ü zu u)
werden dagegen gefunden; „ß“ gegen „ss“ und „ue“ gegen „ü“ nicht.
**Folge:** Wer den Ort so schreibt, wie er ihn spricht oder auf dem Zettel liest
(ß als „ss“ ist auf Schweizer und vielen Hardware-Tastaturen üblich, „ue“ beim
Diktat und bei Tastaturen ohne Umlaut), bekommt die Vorbelegung der
Zugehörigkeit nicht und weiß nicht, dass es sie gegeben hätte. Das Feld sieht
danach ausgefüllt aus. Die Folge steht erst später im Hinweis „Keine
telefonische Erreichbarkeit erfasst“, und die Nummern der drei Ebenen müssen von
Hand getippt werden, unter Zeitdruck am Meldekopf.
**Empfehlung:** Beim Vergleich ß/ss, ä/ae, ö/oe, ü/ue und ü/u gleichsetzen (auf
beiden Seiten falten). Zeigt die Liste nichts, einen Satz unter dem Feld
einblenden („Kein Ort mit diesem Namen in der Liste — Schreibweise prüfen“), statt
stumm Freitext zu übernehmen.
**Nachprüfung:** „Hassmersheim“ und „Muellheim“ tippen: Vorschlag erscheint,
Kürzel, Telefon und Ebenen füllen sich wie bei „Haßmersheim“.

### R11-H2 [P3] Einheitstyp und Funktionen: das Beispiel im Feld selbst findet nichts

**Evidence:** Observed.
**Ort:** Schritt 1, Feld „Einheitstyp“ (Platzhalter „z. B. Bergungsgruppe, FGr
Wasserschaden/Pumpen“); Schritt 3, „Funktion hinzufügen“ in den Karten.
**Beobachtung:** Der Platzhalter nennt „FGr Wasserschaden/Pumpen“. Genau diesen
Text eingetippt, kommt kein Vorschlag, ebenso bei „FGr Wasserschaden“,
„FGr Wasser“ und „Wasserschaden Pumpen“. Treffer gibt es nur für „FGr WP“,
„Fachgruppe Wasserschaden“ oder „Wasserschaden/Pumpen“, also entweder das Kürzel
allein oder den ausgeschriebenen Namen allein, als zusammenhängende Zeichenkette.
Bei den Funktionen liefert „Gruppenführer“ acht Treffer, „Gruppenfuhrer“,
„Gruppenfuehrer“ und „GrFu“ keinen.
**Folge:** Die App übernimmt den Text als Freitext. Der Hinweis „Einheitstyp
‚FGr Wasserschaden‘ nicht erkannt … deshalb fehlen taktisches Zeichen und
Soll-Vergleich“ erscheint zwar auf Schritt 1 und in der Übersicht, aber ohne
Weg zum richtigen Eintrag, und die StAN-Vorbelegung (Personen, Fahrzeuge) bleibt
aus (Schritt 3: „Stärke ist 0“). Wer dem Beispiel im Feld folgt, scheitert an
dem Beispiel.
**Empfehlung:** Vorschläge nach Wörtern statt nach zusammenhängender Zeichenkette
suchen (jedes Wort muss irgendwo in Kürzel oder Name vorkommen) und dieselbe
Schreibweisenfaltung wie bei R11-H1 nutzen. Den Hinweis „nicht erkannt“ um den
Knopf „Passende Typen zeigen“ ergänzen.
**Nachprüfung:** „FGr Wasserschaden/Pumpen“, „FGr Wasser“ und „Wasserschaden
Pumpen“ zeigen FGr WP (A), (B), (C).

### R11-H3 [P3] Suche in der Einsatzansicht: „Riss“, „Muellheim“, „OV Radolfzell“, „ZTr“ ohne Treffer

**Evidence:** Observed.
**Ort:** Einsatzansicht, „Suchen, sortieren, filtern“ → Feld „Suche“ (Platzhalter
„Einheit, Organisation, Ort, Zug, Kennzeichen, Auftrag…“).
**Beobachtung:** Bei zehn eingelesenen Bögen: „Haßmersheim“ 1 Treffer,
„hassmersheim“ 0, „Müllheim“ 1, „Muellheim“ 0, „Riß“ 1, „Riss“ 0,
„Radolfzell“ und „THW Radolfzell“ je 1, „OV Radolfzell“ 0, „Zugtrupp“ 3, „ZTr“
und „FGr O“ 0 (die Karten zeigen „Fachgruppe Ortung“ und „Zugtrupp Technischer
Zug“ ausgeschrieben). Die Meldung „Keine Einheit passt zu ‚…‘. Suche löschen“ ist
klar.
**Folge:** Am Meldekopf wird nach Funkdurchsage gesucht („Hassmersheim,
Fachgruppe W“). Ein stilles Null-Ergebnis verleitet dazu, die Einheit für nicht
eingetroffen zu halten und nachzufunken, obwohl sie in der Liste steht.
**Empfehlung:** Gleiche Schreibweisenfaltung wie R11-H1, die Kürzel der Typen
(„ZTr“, „FGr O“) und die Ebene („OV“) mitdurchsuchen. Bei Null-Treffern den
Hinweis „Auch ohne Umlaute oder in anderer Schreibweise versuchen“ ergänzen.
**Nachprüfung:** Suche nach „hassmersheim“, „Riss“, „ZTr“ liefert die jeweilige
Einheit.

### R11-H4 [P3] „Namen einfügen…“ zerlegt Namenszusätze und Tabellenspalten falsch

**Evidence:** Observed.
**Ort:** Schritt 3, „Namen einfügen…“ → Vorschau „n Personen übernehmen“.
**Beobachtung:** „Hans van Dijk“ wird zu „Dijk, Hans van“, „Ute von Hagen“ zu
„Hagen, Ute von“, „Maria de la Cruz“ zu „Cruz, Maria de la“, „Peter von der
Heide“ zu „Heide, Peter von der“; die gleichlautende Eingabe „von Hagen, Ute“
wird dagegen richtig gelesen. Eine aus einer Tabelle kopierte Zeile mit
Tabulator („Hans Müller⇥GrFü“) wird zu „GrFü, Hans Müller“ (die Funktionsspalte
wird Nachname). Dagegen werden Zeilen mit Ziffern oder Klammern („1. Müller,
Hans (GrFü)“, Zeile mit Telefonnummer) vorbildlich markiert und nicht
übernommen.
**Folge:** Die Vorschau zeigt „Nachname, Vorname“ und lässt sich korrigieren,
aber ein Helfer, der eine Liste aus der Nachricht oder Tabelle kopiert, prüft die
Vorschau erfahrungsgemäß nicht Wort für Wort. Falsch eingeordnete Nachnamen
stehen dann auf dem Bogen und in der Sortierung unter dem falschen Buchstaben.
**Empfehlung:** Kleingeschriebene Namenszusätze (von, van, de, der, den, zu, zur,
la, el, bin, ben) beim Zerlegen dem Nachnamen zuschlagen. Bei Tabulator trennen
(Spalte 1 Name, weitere Spalten ignorieren oder markieren).
**Nachprüfung:** Die vier Beispiele ergeben „van Dijk“, „von Hagen“, „de la Cruz“
und „von der Heide“ als Nachname; die Tabulatorzeile ergibt Name „Hans Müller“.

## Was gehalten hat (nicht ändern)

- **Browser-Zurück** schließt die Namensliste und führt Schritt für Schritt
  zurück; nach „Schließen“ bleibt kein verwaister Verlaufseintrag.
- **Offline nach geladenem Dienst:** Neuladen, Bogen anlegen und PDF erzeugen
  gehen ohne Netz; die Zeile „Jetzt offline bereit“ zählt ehrlich.
- **Zug zuordnen:** Sechs Schreibweisen („1. Zug“, „Zug 1“, „1.Zug“, „1 Zug“,
  „Zug1“, „ZUG 1“) landen alle als „1. Zug“.
- **Eintreffzeit:** Zeit in der Zukunft wird mit „Tag oder Monat vertauscht?“
  gemeldet; Zettelzeit 23:50 bei Uhr 00:10 wird als Vortag gelesen.
- **Zahlenfelder:** „Minus geht nicht“, „keine Zahl — nicht übernommen“,
  Obergrenzen mit Hinweis (99 Sitzplätze).
- **Datei-Empfang bei zwei Sammlungen:** Dialog „Wohin damit?“ mit Stärke und
  je einem Knopf je Sammlung, in 640 × 360 und 320 × 480 ohne Verdeckung.
- **Entwurf:** „Neuen Bogen anfangen?“ nennt den Namen des Entwurfs und den Weg
  zurück.
- **Ansicht „Feld“:** Fast alle Ziele ≥ 48 px, keine Schrift unter 13 px, kein
  seitliches Überlaufen bei 360 px.
- **Tastaturhöhe 340 px:** Ortsvorschläge bleiben über der Fußleiste sichtbar.

## Verständnis-Check

- Orientierung: verstanden
- Nächste Handlung: verstanden
- Systemstatus: verstanden (gespeichert, „Empfang nicht bestätigt“, Zeit des
  letzten Exports sind eindeutig)
- Fehlerbehebung: verstanden, mit der Einschränkung R11-H1 und R11-H2, wo die
  Eingabe ohne Hinweis ins Leere läuft
- Feldtauglichkeit: eingeschränkt geprüft (echte Handschuhe, Sonnenlicht,
  Kamera, Telefontastatur nicht prüfbar); soweit prüfbar geeignet
