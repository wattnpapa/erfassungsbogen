# Audit „Zerstörende Handlungen", Runde 11 (Löschen, Überschreiben, Statuswechsel)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-10-25 ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173).

**Zählung: P0 0 · P1 0 · P2 1 · P3 4** (R11-D1 bis R11-D5).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md` und
`docs/audits/runde-10/README.md` samt Bericht R10 „Zerstörende Handlungen". Die dort
geführten bekannten Grenzen (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6,
R9-M3, R9-G5, R8-H5/S4, leere Karten bei „Nur Stärke", Rückgängig für Meldungen
überlebt Neuladen nicht, Tabellenzeilenhöhe bei 180x320) sind nicht erneut gemeldet.

## Prüfaufbau

Chromium über `require('playwright')` ohne Startoptionen, `isMobile`/`hasTouch`,
Locale de-DE, Tipps als Touch-Tipp. Viewports 390 × 844 und 360 × 640. Zustände über
die Bedienung der App: Einsatz-Sammlung anlegen, vier THW-Übungsbögen aus
`examples/thw/` (mit `uebung: false`) über „Bögen einlesen…" aufnehmen, zweiter
Browser-Tab im selben Profil, zweite Sammlung, Sammel-PDF als Datei. Kein Kamera-Scan,
keine Handschuhe, keine nativen Builds, kein echtes Zweitgerät.

**Neu gegenüber Runde 10 betrachtet:** „Zur Kenntnis genommen", Einsatzbeginn „Jetzt",
„Aufteilen…"/„Zusammenführen…" samt Quittung, „Verschieben…", Sammel-PDF-Import in eine
Sammlung mit neueren Änderungen, älterer Stand desselben Bogens, zwei Tabs gegen
denselben Einsatz, Browser-Zurück bei offener Rückfrage, Papierkorb mit gleichnamigem
Einsatz, StAN-Sollplätze laden, Einheitstyp-Wechsel mit Personal, erste Person entfernen,
„Einheit schnell erfassen" mit zwei Sammlungen, Sicherung einspielen mit falscher Datei,
Übungsbögen in einer Sammlung.

## Urteil

Die schweren Handlungen sind in dieser Runde durchweg gut gesichert: Jede Rückfrage
nennt Name, Zahl und Folge, und die Zusammenführung zweier Datenstände verliert nichts.
Das gilt besonders dort, wo zwei Stände aufeinandertreffen. Ein älterer Bogen derselben
Einheit wird „nur in die Historie gelegt, die Lage bleibt unverändert"; ein älteres
Sammel-PDF übernimmt keine Abrückung zurück („keine neue Einheit", Abrücken bleibt);
zwei Tabs im selben Profil zeigen sofort denselben Stand und überschreiben sich nicht.
Offen sind fünf kleine Ränder. Der gewichtigste: „Zur Kenntnis genommen" ist ein
unbestätigter, nicht rückholbarer Sammelschalter auf einem 30 Pixel hohen Ziel direkt
unter einem zweiten 30-Pixel-Ziel. Alle Aufgaben ließen sich ohne fremde Hilfe erledigen.

## Befunde

### R11-D1 [P2] „Zur Kenntnis genommen" löscht die Liste „Neu seit der letzten Kenntnisnahme" für alle Einheiten auf einen Tipp, ohne Rückfrage und ohne Rückgängig, auf einem 30-Pixel-Ziel

**Kennzeichnung:** gemessen (Größe und Lage per `getBoundingClientRect`, Zustand vor und
nach dem Tipp und nach Neuladen).

**Fundstelle / Aufgabe:** Einsatzansicht → Kopfbereich unter den Zählern, Liste „Neu seit
der letzten Kenntnisnahme (n)", Knopf „Zur Kenntnis genommen".

**Beobachtung:** Der Knopf ist bei 390 × 844 und bei 360 × 640 155 × 30 px groß. Direkt
über ihm, ohne Abstand (Lücke 0 px), liegt der zweite 30-Pixel-Knopf „Zuletzt gemeldete
oben zeigen". Ein Tipp auf „Zur Kenntnis genommen" nimmt alle Einträge der Liste auf
einmal heraus (4 Einheiten: vorher 3 „neu"-Marken auf den Karten, danach 0; die Liste ist
weg). Es erscheint weder eine Rückfrage noch eine Quittung mit „Rückgängig" (geprüft: kein
„Rückgängig"-Knopf, auch nach dem Neuladen nicht wieder da). In der Liste standen auch die
Plausibilitätshinweise („⚠ Bogen nennt: „Hochwasserlage Crailsheim …", passt das zu dieser
Lage?"); sie sind mit der Liste verschwunden und stehen nur noch zugeklappt unter
„Hinweise … + 2 weitere" auf der Karte. Eine Folgemeldung bleibt dagegen auf der Karte
stehen („Folgem. 16:47 · 4 → 2"), das hält.

**Erwartung der Rolle:** Ein Sammelschalter, der die Merkliste des Meldekopfs für alle
Einheiten abräumt, braucht ein Ziel in Fingergröße mit Abstand zu den Nachbarn und einen
Rückweg; auf jeden Fall nicht direkt unter einem Umschalter gleicher Größe.

**Auswirkung im Einsatz:** Wer die Sortierung umschalten will und den Knopf darunter
trifft, verliert die Übersicht, welche Einheiten er noch nicht gesichtet hat, und die
offenen Rückfragen („passt das zu dieser Lage?"). Mit Handschuhen auf kleinem Display ist
das eine plausible Fehlbedienung; neue Einheiten gehen im Ablauf unter. Daten gehen nicht
verloren, aber die Merkliste lässt sich nicht herstellen. P2.

**Empfehlung:** Knopf auf 44 px und mit sichtbarem Abstand vom Sortierumschalter setzen,
nach dem Tipp eine Quittung „n Einheiten zur Kenntnis genommen — Rückgängig" zeigen.

**Verifikation:** 360 × 640: Zielhöhe ≥ 44 px, Abstand zum Nachbarknopf ≥ 8 px, nach dem
Tipp „Rückgängig" in der Leiste, danach ist die Liste samt ⚠ wieder da.

### R11-D2 [P3] Die Quittungsleiste schneidet den Text nach zwei Zeilen ab; bei „Aufteilen" fehlt damit der Weg zurück, bei „Entfernen" die Umnummerierung

**Kennzeichnung:** gemessen (`scrollHeight` gegen `clientHeight` des Textes der Leiste).

**Fundstelle / Aufgabe:** Einsatzansicht → „Mehr…" → „Aufteilen…" → „Aufteilen"; und „Mehr…"
→ „Entfernen" → bestätigen.

**Beobachtung:** Der Volltext der Aufteil-Quittung lautet „„Trupp A" von „THW Albstadt
Zugtrupp Technischer Zug" abgeteilt. Später zurück über „Mehr…" › „Zusammenführen…"."
Sichtbar sind bei 390 px nur zwei Zeilen („„Trupp A" von „THW Albstadt Zugtrupp…"), 35 von
105 px; das Wort „abgeteilt" und der Hinweis auf „Zusammenführen…" fehlen. Bei „Entfernt:
Meldung Nr. 1 „THW Albstadt …". Die Einheiten Nr. 2–4 rücken auf und heißen danach Nr. 1–3."
sind es 35 von 105 px (390) bzw. 35 von 140 px (360 × 640); die Umnummerierung ist nicht
zu sehen. Selbst „Abgerückt 16:41: Nr. 1 „THW Albstadt Zugtrupp Technischer Zug"" ist bei 390 px
(53 px Text) und 360 px (70 px) abgeschnitten. Die Leiste hat keinen Weg, den Rest zu lesen.

**Erwartung der Rolle:** Die Folge einer Handlung (was passiert ist, wie es zurückgeht)
steht in der Quittung im Bild.

**Auswirkung im Einsatz:** Wer die Leiste nach dem Aufteilen kurz ansieht, liest nicht,
dass die Meldung geteilt wurde und wie man sie wieder zusammenführt. Ein Rückgängig
bleibt in der Leiste, solange sie steht; danach hilft nur das Wissen um „Zusammenführen…".
P3, weil die Rückfragen vorher alles nennen und „Rückgängig" erreichbar ist.

**Empfehlung:** Quittungstext kürzen (Handlung zuerst, dann die Einheit), oder die Leiste
mit der Länge des Textes wachsen lassen.

**Verifikation:** 360 × 640: Vollständiger Quittungstext sichtbar oder auf den
Kernsatz („„Trupp A" abgeteilt — Rückgängig") gekürzt.

### R11-D3 [P3] Die Rückfrage beim Entfernen der ersten Person nennt nicht, dass sie die Ansprechperson ist und wer an ihre Stelle rückt

**Kennzeichnung:** gemessen (Entwurf im Speicher nach jedem Entfernen).

**Fundstelle / Aufgabe:** Assistent Schritt 3 „Personal" → „Person entfernen" an Person 1.

**Beobachtung:** Der Schritt sagt selbst: „Die erste Person der Liste steht im PDF und in
der Meldung als Ansprechperson — bei ihr fragt der Meldekopf nach." Die Rückfrage „Lang,
Sabine entfernen?" lautet bei der ersten Person aber wie bei jeder anderen („… Name,
Funktionen, Qualifikationen und Erreichbarkeiten …"). Im Übungsbogen hatte nur die erste
Person eine Nummer. Nach zweimaligem Entfernen war Person 1 „Lehmann" ohne Kontakt;
erst in der Übersicht steht „Keine telefonische Erreichbarkeit erfasst …" (3 offene Punkte).

**Erwartung der Rolle:** Wer die Ansprechperson entfernt, sieht in der Rückfrage, dass
damit die Rückfragenummer des Bogens wechselt.

**Auswirkung im Einsatz:** Ein Bogen, der ohne Rückrufnummer zum Meldekopf geht, wenn der
Warnhinweis in der Übersicht überlesen wird. P3, weil die Übersicht warnt.

**Empfehlung:** Bei Person 1 einen Satz ergänzen („Ansprechperson — danach gilt <Name> /
niemand mit Nummer") oder die Warnung sofort im Schritt zeigen.

**Verifikation:** Person 1 entfernen: Rückfrage nennt die Rolle und den Nachfolger.

### R11-D4 [P3] „Jetzt" überschreibt einen eingetragenen Einsatzbeginn ohne Rückfrage und ohne Rückgängig

**Kennzeichnung:** gemessen (Feldwert vor und nach dem Tipp).

**Fundstelle / Aufgabe:** Einsatzansicht → unten, Abschnitt „Lagemonitor für den Fernseher"
→ Feld „Einsatzbeginn" und Knopf „Jetzt" (62 × 44 px).

**Beobachtung:** Feldwert `2026-10-24T08:00`; Tipp auf „Jetzt" setzt `2026-10-25T16:31`.
Keine Rückfrage, keine Quittung. „Jetzt" liegt mit 8 px Abstand links von „Lagemonitor
öffnen".

**Erwartung der Rolle:** Ein bewusst eingetragener Beginn wird nicht durch einen Tipp auf
eine Abkürzung ersetzt, ohne dass der alte Wert zu sehen ist.

**Auswirkung im Einsatz:** Der tatsächliche Einsatzbeginn ist weg; der alte Wert muss aus
dem Gedächtnis oder von Papier nachgetragen werden. P3, weil es nur ein Feld ist.

**Empfehlung:** „Jetzt" nur anbieten, solange das Feld leer ist, oder den alten Wert in
einer Quittung mit „Rückgängig" nennen.

**Verifikation:** Beginn eintragen, „Jetzt" tippen: Rückfrage oder Rückgängig mit altem Wert.

### R11-D5 [P3] Zwei Sammlungen mit gleichem Namen sind in „Einheit schnell erfassen" nicht zu unterscheiden; „Wiederherstellen" aus dem Papierkorb legt sie stumm doppelt an

**Kennzeichnung:** gemessen (Dialogtext, Startseite nach „Wiederherstellen").

**Fundstelle / Aufgabe:** Startseite → „Einheit schnell erfassen (nur Stärke)…" und
„Papierkorb Einsätze" → „Wiederherstellen".

**Beobachtung:** „Einsatz löschen…" für „Hochwasser Test", danach „Neue Einsatz-Sammlung…"
mit gleichem Namen, danach „Wiederherstellen": Es gibt zwei Sammlungen „Hochwasser Test",
ohne Hinweis. Im Dialog „für welche Sammlung?" stehen bei zwei gleich benannten Sammlungen
zwei identische Zeilen („Für „Hochwasser" erfassen: Einsatz · 0 Einheit(en) anwesend").
Die Anlage einer gleichnamigen Sammlung (auch über „Neue Einsatz-Sammlung…") wird nicht
beanstandet. Doppeltipp auf „Einsatz anlegen" legt dagegen nur eine an (geprüft).

**Erwartung der Rolle:** Wer eine Einheit aufnimmt, erkennt an Namen oder Zusatz, in welche
Sammlung sie geht; ein stilles Duplikat bei der Wiederherstellung fällt auf.

**Auswirkung im Einsatz:** Eine Einheit landet in der falschen von zwei gleich benannten
Sammlungen; sie ist dort nur über „Verschieben…" zu holen. P3, weil es eine aktive
Gleichnamigkeit voraussetzt und der Dialog zumindest die Zahl der Einheiten nennt.

**Empfehlung:** Beim Anlegen und Wiederherstellen auf den gleichen Namen hinweisen, im
Auswahldialog „angelegt am …" und Ort/Auftrag mit nennen.

**Verifikation:** Zwei gleichnamige Sammlungen: Auswahldialog zeigt einen Unterschied je
Zeile; Wiederherstellen weist auf die gleichnamige Sammlung hin.

## Bestätigtes

Alles im Browser nachgespielt (390 × 844, soweit nicht anders vermerkt):

- **Bogen aus Datei laden mit Entwurf:** Rückfrage „Bogen aus Datei öffnen?" mit Name des
  angefangenen Bogens und Hinweis auf „Zuletzt geschlossenen Bogen zurückholen"; Entwurf
  bleibt bis zur Bestätigung unverändert (2019 Zeichen vorher und nachher).
- **Übungsbögen „Anzeigen"** mit vorhandenem Entwurf: Entwurf unverändert.
- **Sammel-PDF zurück einlesen** (Stand von vor dem Abrücken, Einheit 2 inzwischen
  abgerückt): „keine neue Einheit. Jetzt 4 Einheiten, davon 3 anwesend"; Abrückung bleibt,
  Meldungszeile „Stand des anderen Geräts übernommen".
- **Älterer Stand desselben Bogens:** „älterer Stand als der vorhandene … nur in die
  Historie gelegt, die Lage bleibt unverändert"; Folgemeldung (neuerer Stand, 4 → 2)
  erscheint als „Folgemeldung … Stärke 4 → 2 (−2)".
- **Zwei Tabs:** Abrücken in Tab 1, danach Abrücken in Tab 2: Tab 2 zeigte den Stand von
  Tab 1 schon vor der Aktion, am Ende 2 abgerückt, nichts überschrieben.
- **„Einheit schnell erfassen"** mit zwei Sammlungen: Auswahl „für welche Sammlung?" mit
  „Ohne Sammlung erfassen" und „Abbrechen" (Unterscheidung bei gleichem Namen siehe R11-D5).
- **„Verschieben…":** Dialog mit Folge („die Lage … verliert 4 Helfer"), danach Ergebnis-
  dialog „Verschoben" mit „Rückgängig — zurück nach …".
- **„Aufteilen…" / „Zusammenführen…":** Vorschau „Rest: 0 / 1 / 2 / 3 · 2 Fzg — Trupp A:
  1 / 0 / 0 / 1", Quittung mit „Rückgängig" (mindestens 19 s stehend, Rückgängig stellt
  4 Einheiten her); nach Neuladen ist „Zusammenführen…" an der abgeteilten Einheit da, mit
  Vorschau „Danach: 1 / 1 / 2 / 4".
- **„StAN-Sollplätze laden":** Rückfrage „wird … ersetzt … 12 eingetragene Namen gehen verloren";
  ein Tipp ohne Bestätigung ändert nichts (12 Personen).
- **Einheitstyp ändern mit Personal:** nichts geht verloren, der Zusatz „Vorbelegt nach StAN:
  12 Personen (Namen offen), 3 Fahrzeuge" steht im Schritt; „Vorbelegung entfernen" vorhanden.
- **Sicherung einspielen mit einem Einzelbogen:** „„s0.json" ist ein einzelner Bogen. Er wird auf
  der Startseite über „Aus Datei laden…" geöffnet …", nichts eingespielt.
- **Übungsbogen in einer Sammlung:** „davon 1 Übung, nicht gezählt", „5 gemeldet · 4 zählend".
- **Browser-Zurück bei offener Rückfrage „Entfernen":** schließt die Rückfrage, Einsatz unverändert.
- **Toast räumt beim Wechsel der Sammlung auf:** „Rückgängig" aus Sammlung B steht nach dem
  Wechsel in Sammlung A nicht mehr.
- **„Einsatz löschen…":** Rückfrage mit Namen und „4 gemeldeten Einheiten", „30 Tage".
- **Abrücken** (Quittung mit Uhrzeit, danach „Wieder anwesend"): hält; Doppeltipp auf
  „Einsatz anlegen" erzeugt nur eine Sammlung.

## Abgleich mit Runde 10

R10-D1 bis R10-D3 habe ich nicht neu geprüft (Stand laut Runde-10-README: behoben bzw.
teilweise). Die dort genannte Grenze „Rückgängig für Meldungen überlebt Neuladen nicht" ist
hier nicht erneut gemeldet; „Aufteilen" hat dagegen den Weg „Zusammenführen…" über das
Neuladen hinaus (bestätigt).

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Wer „Zur Kenntnis genommen" tippt, glaubt nur eine Marke
  zu setzen und nimmt tatsächlich die ganze Merkliste samt Plausibilitätshinweisen heraus (R11-D1).
- **Größtes Einsatzrisiko:** Ein Fehltipp auf ein 30-Pixel-Ziel ohne Abstand löscht die
  Merkliste ohne Rückweg; die Einheiten selbst bleiben unversehrt (R11-D1).
- **Top-Priorität für die nächste Iteration:** „Zur Kenntnis genommen" auf 44 px mit Abstand
  zum Sortierumschalter und mit „Rückgängig" in der Quittung (R11-D1).

Zählung: P0 0, P1 0, P2 1, P3 4 (R11-D1 bis R11-D5).
