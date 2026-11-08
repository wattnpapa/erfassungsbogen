# Audit „Neuer Nutzer", Schwerpunkt Beispielbögen (Helfer ohne Einweisung)

Prüfer: Rollenaudit `thw-new-user-reviewer` · Datum: 2026-11-08 ·
Prüfgegenstand: Bereich „Beispielbögen" der Live-Seite `https://erfassungsbogen.app/` (frisch
deployt, Code-Stand Commit `0dd56d4` = `main`): Abschnitt auf der Startseite, Dialog „Beispielbögen",
Folgen von „Anzeigen", „PDF" und „Link" · Zählung: **P0 0 · P1 0 · P2 1 · P3 7 · Hinweise 9**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md` und
`docs/audits/runde-21/neuer-nutzer.md` (Aufbau). Zum Nachschlagen nach dem Test:
`src/app/fusszeile.tsx` (Dialog), `src/app/app.tsx` (`BeispielboegenStart`, `oeffneBeispiel`).
Zählregel wie in den Runden: ein Befund je Sachverhalt, ein Typ je Befund; P3 nur bei echter
Beeinträchtigung der Aufgabe, Geschmacksfragen und Kleinigkeiten stehen unter „Hinweise" ohne
Priorität.

## Prüfaufbau

Chromium über das globale Playwright-Modul, `chromium.launch()` ohne Optionen, Locale `de-DE`,
`deviceScaleFactor` 1; Telefon mit `isMobile` und `hasTouch` in 360 x 640 und 390 x 844, dazu Desktop
1280 x 900 ohne Touch. Frischer Browserzustand je Durchlauf, DOM unverändert (nur Lesen, Tippen,
Messen über `getBoundingClientRect`). Für „Link" Zwischenablage-Rechte erteilt (`navigator.share`
gibt es im Test-Chromium nicht, daher lief der Zwischenablage-Weg). Ladezustand zusätzlich mit
gedrosseltem Netz (50 kB/s, 300 ms Latenz, Service Worker gesperrt). Die PDF wurde mit `pdftotext`
und als Bild geprüft. Skripte und Screenshots liegen unter `/tmp/claude-0/audit-neuer-nutzer/`.

Durchlaufen: Startseite (Erststart und mit eigenem Bogen); „Beispielbögen ansehen"; Erklärung
auf- und zugeklappt; alle neun Register der ersten Ebene; tiefe Ordner THW › Alle Einheiten aller
Ortsverbände › Bremen, Niedersachsen › RSt Oldenburg › OV Oldenburg (NI), dazu Bayern und
Katastrophenschutz › Thüringen; „‹ Zurück", Pfad-Links, „Schließen", Escape, Browser-Zurück;
„Anzeigen" ohne eigenen Bogen, mit eigenem Bogen und zweimal nacheinander; „PDF"; „Link" und das
Öffnen des kopierten Links in einem frischen Browser; danach „Neuen Bogen erstellen".

**Annahmen:** Wer die Beispielbögen öffnet, will vor dem ersten Einsatz sehen, wie ein fertiger
Bogen aussieht, und mehrere Bögen (etwa die Einheiten des eigenen Ortsverbands) nacheinander
ansehen. Ob THW-Helfer die Abkürzungen LV, RSt und OV kennen, wird vorausgesetzt (allgemeines
THW-Wissen, kein Produktwissen).

**Nicht prüfbar:** echtes Share-Sheet (Android/iOS), WebKit/Safari, native App (Electron, Android),
echte Bildschirmleser, Handschuhe und Licht; der Offline-Fall der Beispielbögen nur über den
Code-Text (der Vorrat lud im Test nicht vollständig, siehe Startseiten-Zeile „Rest lädt noch …").

## Urteil aus Sicht der Rolle

Der Einstieg wirkt: Unter dem Erklärfilm steht ein eigener Abschnitt mit klarer Überschrift, einem
Satz, was mich erwartet, und einem großen Knopf. Der Dialog ist ohne Anleitung bedienbar: Register
mit Bogenzahl, Zurück-Knopf, Pfad, am Telefon Karten statt einer Tabelle, Knöpfe mit Text und
mindestens 44 px Höhe, kein seitlicher Überlauf. „Anzeigen" öffnet den Bogen mit Übungs-Störer
und Quittung, „PDF" liefert in rund 3 s eine Datei mit Wasserzeichen „ÜBUNG", „Link" quittiert mit
„Kopiert". Ist ein eigener Bogen offen, fragt die App vorher.

Reibung entsteht beim **Durchblättern mehrerer Beispiele**: Wer mit eigenem Bogen zwei Beispiele
nacheinander anzeigt, wird beim zweiten gefragt, ob der eigene Bogen „endgültig gelöscht" werden
soll (BB-N1). Nach jedem „Anzeigen" beginnt der Dialog wieder ganz oben, der Weg zum eigenen
Ortsverband kostet jedes Mal sechs Tipps (BB-N2). Dazu kommen Beschriftungen, die nach Rohdaten
aussehen (BB-N5), und Beispielbögen, die sich selbst als fehlerhaft melden (BB-N4). Die Aufgabe
„einen fertigen Bogen ansehen, als PDF holen, weitergeben" gelingt ohne fremde Hilfe.

## Bestätigtes Verhalten (kein Befund)

- **Abschnitt und Knopf:** „Beispielbögen" steht direkt unter „So funktioniert's" (Erklärfilm,
  drei Schritte), Knopf „Beispielbögen ansehen" 182 x 44 px. Der Fußzeilen-Link ist entfallen.
- **Register:** ganze Zeile antippbar (308 x 52 px bei 390), Bogenzahl rechts mit Tausenderpunkt
  („3.634 Bögen"), Pfeil „›".
- **Pfadleiste:** „‹ Zurück" 84 x 44 px, „Alle" und Zwischenebenen als Links (44 px hoch), aktuelle
  Ebene fett; „‹ Zurück" geht eine Ebene hoch und behält den Fokus.
- **Karten am Telefon / Tabelle am Desktop:** Einheit mit taktischem Zeichen, Herkunft, Stärke
  „0/1/4//5" mit Fahrzeugzahl; bei 1280 x 900 Tabelle mit Köpfen „Einheit · Herkunft · Stärke ·
  Bogen", drei Knöpfe in einer Reihe. Kein seitlicher Überlauf (Dialog `scrollWidth` gleich
  Breite bei 360, 390 und 1280).
- **Ladezustand:** Zähler „101 Bögen" mit „Angaben werden geladen … 7 von 101"; der THW-Ordner war
  nach 3,0 s (Desktop) bzw. 5,7 s (360, kalt) fertig, Karten füllen sich schon vorher.
- **Anzeigen ohne eigenen Bogen:** Dialog schließt, Bogen öffnet in der Übersicht, Streifen
  „ÜBUNG — Dieser Bogen ist als Übung gekennzeichnet …", Quittung „Beispielbogen geöffnet — fiktive
  Daten zum Ansehen und Ausprobieren." (nach 9 s noch sichtbar).
- **Anzeigen mit eigenem Bogen:** Rückfrage „Beispielbogen öffnen?" nennt den eigenen Bogen beim
  Namen und den Rückweg „Zuletzt geschlossenen Bogen zurückholen"; „Abbrechen" lässt den
  Beispieldialog offen.
- **PDF:** „wird vorbereitet …" an der Karte, alle Knöpfe gesperrt, Download nach 2,9 s
  (`wrv-bawue-fuehrungstrupp-elw1.pdf`, 3 Seiten), Kopfzeile „ÜBUNG — Dieser Bogen beschreibt
  keinen echten Einsatz." und diagonales Wasserzeichen „ÜBUNG".
- **Link:** Knopf zeigt 3 s lang „Kopiert"; die kopierte Adresse (904 Zeichen) öffnet in einem
  frischen Browser den Bogen mit Übungs-Störer.
- **Neuer Bogen nach dem Beispiel:** „Neuen Bogen erstellen" fragt „Neuen Bogen anfangen?", der
  neue Bogen ist leer und nicht als Übung markiert.

## Befunde

### BB-N1 (P2, Bedienung) – Zweites Beispiel droht den eigenen Bogen zu löschen

- **Neu oder alt (Verweis):** neu.
- **Fundstelle:** Startseite mit eigenem Bogen → „Beispielbögen ansehen" → ein Beispiel
  „Anzeigen" → „Beispielbogen öffnen" → zurück zur Startseite → ein zweites Beispiel „Anzeigen";
  390 x 844.
- **Beobachtung:** Beim ersten Beispiel wandert der eigene Bogen „THW Eigenbogen" auf den Platz
  „Zuletzt geschlossener Bogen" (Rückfrage sagt das richtig). Beim zweiten Beispiel lautet die
  Rückfrage: „Der angefangene Bogen „ASB-Kreisverband Rheindorf e. V. Betreuungskomponente
  (Einsatzeinheit)" wird durch den Beispielbogen ersetzt. Der Bogen „THW Eigenbogen" … auf dem Platz
  „Zuletzt geschlossener Bogen" wird dabei endgültig gelöscht: Er fasst nur einen Bogen." Angeboten
  werden ein roter Vollknopf „Beispielbogen öffnen — den alten Bogen vorher als Datei sichern", ein
  rot umrandeter „Beispielbogen öffnen — alten Bogen endgültig löschen" (beide 58 px) und
  „Abbrechen" (Fokus). Das unveränderte Beispiel heißt dabei „angefangener Bogen" und belegt den
  einzigen Rückholplatz; einen Weg „Beispiel verwerfen, eigenen Bogen behalten" gibt es nicht.
- **Erwartung der Rolle:** Beispiele anzusehen berührt meinen eigenen Bogen nicht. Ein Beispiel, an
  dem ich nichts geändert habe, wird beim nächsten Beispiel einfach weggelegt.
- **Folge:** Wer zwei Beispiele vergleicht, steht vor einer Löschfrage zu einem Bogen, an den er
  gerade nicht denkt. Der Text ist lang (sieben Zeilen bei 390 px); wer nur „Beispielbogen öffnen"
  liest, wählt einen der beiden roten Knöpfe. „Als Datei sichern" führt in einen Dateidialog, den
  ein neuer Nutzer nicht erwartet. Der eigene Bogen geht nicht still verloren (gut), aber das
  Ansehen von Beispielen wird zum Risiko für echte Daten.
- **Empfehlung:** Ein unverändertes Beispiel beim Ersetzen nicht auf den Rückholplatz legen (es
  liegt ja weiter im Dialog), sodass der eigene Bogen dort bleibt; dann entfällt die Löschfrage.
  Alternativ das Beispiel ohne Ersetzen des eigenen Bogens zum Ansehen öffnen.
- **Nachprüfung:** Eigenen Bogen anlegen, zwei Beispiele nacheinander anzeigen, Startseite:
  „Zuletzt geschlossenen Bogen zurückholen" muss den eigenen Bogen liefern, ohne dass eine
  Löschfrage erschien.
- **Typ:** Bedienung.

### BB-N2 (P3, Bedienung) – Dialog vergisst den Ordner: sechs Tipps je Beispiel

- **Neu oder alt (Verweis):** neu.
- **Fundstelle:** Dialog „Beispielbögen" nach „Anzeigen", „Schließen", Escape oder Browser-Zurück;
  360 x 640 und 390 x 844.
- **Beobachtung:** Bis zu den neun Bögen des OV Oldenburg sind es nach „Beispielbögen ansehen" fünf
  Ordner-Tipps (THW › Alle Einheiten aller Ortsverbände › Bremen, Niedersachsen › RSt Oldenburg › OV
  Oldenburg (NI)). Nach „Anzeigen" schließt der Dialog; beim nächsten Öffnen steht er wieder auf der
  ersten Ebene („Alle"). Dasselbe nach „Schließen" (zuvor in THW › … › Bayern) und nach Escape.
  Browser-Zurück (Android-Zurück-Taste) geht nicht eine Ebene hoch, sondern schließt den ganzen
  Dialog. Mit eigenem Bogen liegt der Abschnitt danach bei y = 2013 von 3499 px (rund 2,4
  Bildschirme scrollen).
- **Erwartung der Rolle:** Ich sehe mir die Gruppen meines Ortsverbands nacheinander an und lande
  nach dem Zurückkommen wieder dort, wo ich war; die Zurück-Taste geht eine Ebene zurück.
- **Folge:** Für jedes weitere Beispiel: zur Startseite, 2,4 Bildschirme scrollen, sechs Tipps.
  Neue Nutzer geben nach dem zweiten Bogen auf oder verirren sich in einem anderen Landesverband.
- **Empfehlung:** Den zuletzt geöffneten Ordner für die Sitzung behalten; Browser-Zurück im Dialog
  eine Ebene hoch führen.
- **Nachprüfung:** Bis OV Oldenburg (NI) gehen, ein Beispiel anzeigen, Dialog erneut öffnen: Pfad
  „Alle › THW › … › OV Oldenburg (NI)" steht noch da.
- **Typ:** Bedienung.

### BB-N3 (P3, Layout) – Nach dem Ordnerwechsel steht man mitten in der Liste, Pfad außer Sicht

- **Neu oder alt (Verweis):** neu.
- **Fundstelle:** Dialog, Register weiter unten antippen (z. B. Katastrophenschutz › Thüringen, RSt
  Oldenburg › OV Oldenburg (NI)); 360 x 640.
- **Beobachtung:** Der Dialog behält beim Ordnerwechsel seine Scrollhöhe. Nach „Thüringen" (letzte
  Zeile, Dialog vorher 300 px gescrollt) zeigt der Bildschirm Karten aus der Mitte („2.
  Wassertransporttrupp, Apolda"); Pfadleiste, Ordnername und Zähler „45 Bögen" liegen oberhalb. Nach
  „OV Oldenburg (NI)" steht die Pfadleiste bei y = −187 bis +36. Der Fokus springt dabei auf `BODY`.
  Ist sie sichtbar, braucht die Pfadleiste bei 360 px auf Ebene 4 rund 215 px (fünf Zeilen
  untereinander, „Alle Einheiten aller Ortsverbände (LV › RSt › OV)" allein zwei Zeilen; die „›"
  im Namen sehen aus wie Pfadtrenner).
- **Erwartung der Rolle:** Nach dem Antippen eines Ordners sehe ich oben, wo ich bin, und die erste
  Karte.
- **Folge:** Der Helfer weiß nicht, ob der Tipp gewirkt hat (die Karten sehen in jedem Ordner gleich
  aus), und hält eine Karte aus der Mitte für die erste. Zurück findet er erst nach Hochscrollen.
- **Empfehlung:** Beim Ordnerwechsel an den Anfang des Dialoginhalts springen (und den Fokus dorthin
  setzen); den Ordnernamen „Alle Einheiten aller Ortsverbände" ohne „›" kürzer fassen.
- **Nachprüfung:** 360 x 640, Katastrophenschutz öffnen, bis zur letzten Zeile scrollen,
  „Thüringen": Pfad und „45 Bögen" stehen oben im Bild.
- **Typ:** Layout.

### BB-N4 (P3, Text) – Beispielbögen melden sich selbst als fehlerhaft

- **Neu oder alt (Verweis):** neu.
- **Fundstelle:** „Anzeigen" bei DLRG › „Wasserrettungsverband — Führungstrupp (ELW 1)" und
  Feuerwehr › Niedersachsen › „Grundausstattungsfeuerwehr"; 390 x 844.
- **Beobachtung:** Direkt unter der Quittung „fiktive Daten zum Ansehen und Ausprobieren" steht
  „⚠ 4 offene Punkte für die Weitergabe — antippen zum Beheben": „Einsatzzeitraum 06.11.2023 –
  09.11.2023 ist vorbei …", „… liegt mehr als ein Jahr entfernt — Tippfehler im Jahr?", „Alle 4
  Personen stehen auf Geschlecht „männlich" — das ist die Vorbelegung", „mehr Führer als Mannschaft
  — stimmt das?". Der Reiter „3. Personal" trägt „fehlt" (beim Feuerwehr-Bogen „4 fehlt",
  Einsatzzeitraum 22.07.2026 „ist vorbei").
- **Erwartung der Rolle:** Ein Beispiel zeigt, wie ein richtig ausgefüllter Bogen aussieht.
- **Folge:** Der Helfer lernt am Beispiel, dass Warnungen normal sind, oder zweifelt, ob das Beispiel
  (und damit sein Verständnis der Felder) stimmt. Die Warnungen verlieren ihren Wert, bevor der
  erste echte Bogen entsteht.
- **Empfehlung:** Beispielbögen so pflegen, dass sie ohne offene Punkte und ohne „fehlt" öffnen
  (Zeitraum relativ zum heutigen Tag, Geschlecht gesetzt), oder die Einsatzzeit-Hinweise bei
  Beispielen weglassen.
- **Nachprüfung:** Je Organisation ein Beispiel anzeigen: keine „offenen Punkte", kein „fehlt" an
  den Reitern.
- **Typ:** Text.

### BB-N5 (P3, Text) – Ordner- und Herkunftsnamen sehen nach Rohdaten aus

- **Neu oder alt (Verweis):** neu.
- **Fundstelle:** Katastrophenschutz (Register), Bundeswehr und BBK (Spalte/Karte „Herkunft").
- **Beobachtung:** Unter „Katastrophenschutz" stehen „BADENWUERTTEMBERG" (bei 360 px umbrochen zu
  „BADENWUERTTEM / BERG"), „BAYERN", „BERLIN", „HESSEN", „MECKLENBURG VORPOMMERN", „NORDRHEIN
  WESTFALEN", „RHEINLAND PFALZ", „SAARLAND" neben „Brandenburg", „Niedersachsen", „Sachsen",
  „Thüringen". In der Herkunft: „übergeordnetes Landeskommando Landeskommando (fiktiv)",
  „Panzerpionierbataillon Panzerpionierbataillon 700 (fiktiv)", „SAR-Leitstelle SAR-Leitstelle
  Münster (RCC Münster)", „Landkreis/kreisfreie Stadt Landkreis Moorwehde"; beim Panzerpionierzug
  steht als Ort „Panzerpionierzug".
- **Erwartung der Rolle:** Bundesländer so geschrieben wie überall, Herkunft als ein lesbarer Name.
- **Folge:** Die Liste wirkt unfertig; Doppelwörter lassen den Helfer zweimal lesen, ob zwei Ebenen
  gemeint sind. Wer nach „Baden-Württemberg" sucht, überliest „BADENWUERTTEMBERG".
- **Empfehlung:** Landesnamen in amtlicher Schreibweise; Ebenentyp nicht vor einen Namen setzen, der
  ihn schon enthält.
- **Nachprüfung:** Katastrophenschutz öffnen und die zwölf Namen lesen; Bundeswehr und BBK: keine
  Wortdopplung in der Herkunft.
- **Typ:** Text.

### BB-N6 (P3, Text) – THW: „Alle Einheiten aller Ortsverbände" enthält nicht alle

- **Neu oder alt (Verweis):** neu.
- **Fundstelle:** Dialog → „THW"; 360 x 640 und 1280 x 900.
- **Beobachtung:** Die Ebene THW zeigt einen Unterordner „Alle Einheiten aller Ortsverbände (LV ›
  RSt › OV) · 3.533 Bögen" und darunter ohne Überschrift „101 Bögen", die selbst Ortsverbände tragen
  (Albstadt, Biberach/Riß, Crailsheim … „Landesverband Baden-Württemberg"). 3.533 + 101 = 3.634,
  die 101 liegen also neben „Alle". Was die 101 von den 3.533 unterscheidet, steht nirgends. Unmittelbar
  nach dem Öffnen zeigt die erste Ebene „THW · 101 Bögen", Sekunden später „3.634 Bögen".
- **Erwartung der Rolle:** „Alle" heißt alle; was daneben steht, hat eine eigene Überschrift
  („Auswahl" o. ä.).
- **Folge:** Der Helfer sucht seinen Ortsverband in den 101 und findet ihn nicht, oder wundert sich,
  warum Albstadt doppelt auftaucht. Die springende Zahl lässt zweifeln, ob etwas fehlt.
- **Empfehlung:** Die 101 Bögen als eigenen Ordner mit sprechendem Namen führen (oder kurz
  beschreiben) und „Alle Einheiten …" so nennen, wie es gemeint ist; die THW-Zahl erst zeigen,
  wenn sie feststeht, oder gleich die Gesamtzahl.
- **Nachprüfung:** THW öffnen und ohne Anleitung erklären lassen, was die 101 Bögen sind.
- **Typ:** Text.

### BB-N7 (P3, Layout) – Einstieg am Telefon erst nach 2,7 Bildschirmen

- **Neu oder alt (Verweis):** neu (Folge der Verlegung aus der Fußzeile).
- **Fundstelle:** Startseite beim Erststart; 360 x 640, 390 x 844, 1280 x 900.
- **Beobachtung:** Der Abschnitt beginnt bei 360 x 640 bei y = 1712 (2,7 Bildschirme), bei 390 x 844
  bei y = 1692 (2,0), am Desktop bei y = 1438 (1,6). Davor stehen die beiden Weg-Karten, der
  Offline-Hinweis, der Erklärfilm (185 px hoch) und die drei Schritte. Im ersten Bildschirm weist
  nichts auf Beispiele hin; der Erklärtext im Abschnitt selbst nennt sie den Weg „zum Ausprobieren".
  Der Knopf ist der dritte Primärknopf der Seite (neben „Neuen Bogen erstellen" und „Neue
  Einsatz-Sammlung…").
- **Erwartung der Rolle:** „Wie sieht so ein Bogen fertig aus?" ist die erste Frage; die Antwort
  liegt nah bei den Startknöpfen.
- **Folge:** Wer nicht scrollt, beginnt einen leeren Bogen, ohne je ein Beispiel gesehen zu haben.
- **Empfehlung:** Im ersten Bildschirm einen kurzen Verweis „Beispiel ansehen" (etwa neben „Neuen
  Bogen erstellen" oder im Untertitel) auf den Abschnitt bzw. den Dialog.
- **Nachprüfung:** 360 x 640, Erststart: ein Weg zu den Beispielbögen ist ohne Scrollen sichtbar.
- **Typ:** Layout.

### BB-N8 (P3, Text) – Startseite zeigt ein angezeigtes Beispiel als „meinen Bogen"

- **Neu oder alt (Verweis):** neu.
- **Fundstelle:** Beispiel „Anzeigen" → „‹ Startseite"; 390 x 844.
- **Beobachtung:** Die Karte oben auf der Startseite lautet „Freiwillige Feuerwehr Wietzendorf
  Grundausstattungsfeuerwehr · Einsatz 22.07.2026 · Stärke 2 / 8 / 10 // 20 · gespeichert 21:21 Uhr"
  mit „Fortsetzen" und „Bogen schließen" — ohne „Beispiel" oder „Übung". Im Bogen selbst stand
  „✓ gespeichert · nur auf diesem Gerät"; die ganze App trägt nun die Farbe der Feuerwehr. Die
  folgenden Rückfragen nennen das unveränderte Beispiel „der angefangene Bogen".
- **Erwartung der Rolle:** Ein angesehenes Beispiel ist als Beispiel erkennbar und nicht „mein"
  gespeicherter Bogen.
- **Folge:** Der Helfer hält das Beispiel für seinen eigenen Bogen, setzt ihn mit „Fortsetzen" fort
  und überschreibt die Beispieldaten mit echten Angaben (der Bogen bleibt dann als Übung markiert).
- **Empfehlung:** Auf der Startkarte und in Rückfragen „Beispiel (Übung)" vor den Namen setzen.
- **Nachprüfung:** Beispiel anzeigen, Startseite: Karte trägt „Beispiel"/„Übung".
- **Typ:** Text.

## Hinweise (keine Priorität)

- **H1 – Erklärung mit Fachwörtern:** Die aufgeklappte Erklärung (363 px hoch bei 360) spricht von
  „Störer", „Share-Sheet" und „im aktuellen Layout"; die Zeile „Was sind Beispielbögen? …" ist
  blauer Text ohne Aufklapp-Zeichen und sieht aus wie ein Link.
- **H2 – „Kopiert" nur am Knopf:** Nach „Link" steht 3 s lang „Kopiert" statt „Link", sonst keine
  Rückmeldung, was kopiert wurde und wohin damit.
- **H3 – PDF ohne Quittung, Dateiname ohne „Übung":** Nach dem Download zeigt der Dialog nichts an;
  `wrv-bawue-fuehrungstrupp-elw1.pdf` verrät im Download-Ordner nicht, dass es ein Beispiel ist.
- **H4 – Ebenen mit nur einem Ordner:** Feuerwehr enthält nur „Niedersachsen" (ein Tipp mehr ohne
  Wahl); bei DRK stehen neben dem Ordner „Niedersachsen" acht Bögen aus dem Saarland ohne eigenen
  Ordner.
- **H5 – Dateinamen beim Laden:** Bei langsamem Netz stehen bis zum Laden Dateinamen wie
  „bhp25-behandlung-gelb" mit „…" in den Karten (nach unter 2 s ersetzt).
- **H6 – „Link" am Telefon allein in der zweiten Reihe:** Bei 360 und 390 px passen nur „Anzeigen"
  und „PDF" nebeneinander, „Link" rutscht in eine eigene Zeile; jede Karte wird dadurch rund 60 px
  höher.
- **H7 – Link und Anzeigen sehen verschieden aus:** Der geöffnete Link zeigt „Meldung einer fremden
  Einheit: Sie gehört in eine Einsatz-Sammlung …" und „signiert von 3fb3 ed45 …", „Anzeigen" nicht;
  die Erklärung kündigt beides als gleichwertig an.
- **H8 – Störer-Satz:** „Übungsbögen unterliegen keiner Datenschutzfrist" erklärt sich einem neuen
  Nutzer nicht; der Störer ist bei 390 px mit „…" abgeschnitten.
- **H9 – Echt wirkende Kontaktdaten:** Im DLRG-Beispiel steht „info@baden.dlrg.de" bei sonst
  fiktiven Personen und 555er-Nummern; wer das Beispiel per Link weitergibt, gibt eine echt wirkende
  Adresse weiter.

## Aufgabe

- **Aufgabe geschafft:** ja (ansehen, PDF, Link); mehrere Beispiele nacheinander mit Umwegen
  (BB-N1, BB-N2)
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Ein angesehenes Beispiel wird zu „meinem" gespeicherten Bogen und
  belegt den Rückholplatz.
- **Größtes Einsatzrisiko:** Beim Vergleichen zweier Beispiele steht der eigene Bogen vor einer
  Löschfrage mit zwei roten Knöpfen (BB-N1).
- **Top-Priorität für die nächste Iteration:** Unveränderte Beispiele nicht auf den Platz „Zuletzt
  geschlossener Bogen" legen, damit Beispiele nie den eigenen Bogen gefährden (BB-N1).
