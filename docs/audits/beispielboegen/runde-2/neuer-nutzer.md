# Audit „Neuer Nutzer“, Beispielbögen Runde 2 (Helfer ohne Einweisung)

Prüfer: Rollenaudit `thw-new-user-reviewer` · Datum: 2026-11-09 ·
Prüfgegenstand: Bereich „Beispielbögen“ der Live-Seite `https://erfassungsbogen.app/` (Code-Stand
`main` Commit `085a93b`, angezeigte Version `v2026.1109.833`): Abschnitt auf der Startseite, Dialog
„Beispielbögen“ (jetzt nachgeladen), Folgen von „Anzeigen“, „PDF“, „Link“ und „Alle … in eine
Übungs-Sammlung“ · Zählung neue Befunde: **P0 0 · P1 0 · P2 1 · P3 5 · Hinweise 6** · aus Runde 1
noch zu beobachten: 1 offen, 5 teilweise (Befunde), dazu Hinweise siehe unten

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: der eigene Bericht aus Runde 1
(`../neuer-nutzer.md`) und `../README.md` mit „Stand der Behebung“ Nr. 1 bis 21. Zum Nachschlagen
nach dem Test: `src/app/beispiele-dialog.tsx` (Suche `suchTreffer`, Abbruch über `cancel`,
`alleAlsUebung`), `src/app/app.tsx`. Zählregel wie in Runde 1: ein Befund je Sachverhalt, ein Typ je
Befund; P3 nur bei echter Beeinträchtigung der Aufgabe, Kleinigkeiten unter „Hinweise“. Die Zählung
oben umfasst nur die neuen Befunde (BB2-N…); der Stand der alten steht unter „Nachprüfung Runde 1“.

## Prüfaufbau

Chromium über das globale Playwright-Modul, `chromium.launch()` ohne Optionen, Locale `de-DE`,
`deviceScaleFactor` 1; Telefon mit `isMobile` und `hasTouch` in 360 x 640 und 390 x 844, dazu
Querformat 740 x 360 und 844 x 390, Tablet 1024 x 768 (Touch) und Desktop 1280 x 900 ohne Touch.
Frischer Browserzustand je Durchlauf, DOM unverändert (nur Lesen, Tippen, Scrollen des Dialogs,
Messen über `getBoundingClientRect`). Für „Link“ Zwischenablage-Rechte erteilt (`navigator.share`
fehlt im Test-Chromium). Langsames Netz: 50 kB/s, 300 ms Latenz, Service Worker gesperrt. Offline
über `context.setOffline`. Zurück-Geste nachgestellt mit Browser-Zurück (`page.goBack`). PDF mit
`pdftotext` geprüft. Skripte und Screenshots: `/tmp/claude-0/r2-neuer-nutzer/`.

Durchlaufen: Startseite (Erststart, mit eigenem Bogen „THW Eigenbogen Bergungsgruppe“); erstes
Öffnen des nachgeladenen Dialogs schnell, gedrosselt, offline vor und nach fertigem Kern-Vorrat;
Suche (zwölf Suchwörter, auch Tippfehler und Suche aus einem Ordner heraus); Ordnerwege THW › Alle
Einheiten … › Bremen, Niedersachsen › RSt Oldenburg › OV Oldenburg (NI), Katastrophenschutz ›
Thüringen und Hessen, DRK › Niedersachsen; Escape und Zurück-Geste bis zum Schließen; Dialog nach
„Anzeigen“ und nach Neuladen wieder geöffnet; „Anzeigen“ zweimal nacheinander mit eigenem Bogen,
danach Neuladen und ein drittes „Anzeigen“; je ein Beispiel aus DLRG, Feuerwehr, ASB, Bundeswehr,
Praktische Ausbildung, Katastrophenschutz; „PDF“ von der ersten und der sechsten Karte; „Link“ und
Öffnen des Links in frischem Browser; „Alle 9 in eine Übungs-Sammlung“ zweimal; Ablage eines
Beispiels in eine echte Einsatz-Sammlung.

**Annahmen:** Wie Runde 1: Wer Beispiele öffnet, will vor dem ersten Einsatz sehen, wie ein fertiger
Bogen aussieht, und sucht gern die Einheiten des eigenen Ortsverbands oder eine bestimmte Einheitsart
(„Bergungsgruppe“). LV, RSt und OV gelten als allgemeines THW-Wissen. Dass mobile Browser
Hintergrund-Tabs verwerfen und beim Zurückkehren neu laden, wird als Alltag angenommen.

**Nicht prüfbar:** echte Android-Zurück-Geste (nur über Browser-Zurück nachgestellt), echtes
Share-Sheet, WebKit/Safari, native App (Electron, Android), Bildschirmleser (Live-Region nur im DOM
gesehen, nicht gehört), Handschuhe und Licht; Verhalten des Laufzeit-Caches `eeb-ov-beispiele` über
viele Ordner hinweg.

## Urteil aus Sicht der Rolle

Der Umbau wirkt beim **Durchblättern**: Der Dialog öffnet wieder im letzten Ordner (auch nach
„Anzeigen“ und Neuladen), Escape und Zurück gehen eine Ebene hoch, nach einem Ordnerwechsel stehe
ich oben, der Ordnername hat den Fokus, die Pfadleiste klebt. Zwei Beispiele nacheinander ersetzen
sich ohne Löschfrage, die Startkarte trägt „BEISPIEL“, die Quittung im Bogen sagt, wo mein eigener
Bogen liegt. Die Beispiele sind auf heute datiert, ein Link öffnet als „Empfangener Übungsbogen“, und
mit „Alle 9 in eine Übungs-Sammlung“ habe ich in unter einer Sekunde eine Übungslage. Die Ablage
eines Beispiels in eine echte Sammlung fragt vorher.

Reibung entsteht jetzt vor allem bei der **neuen Suche**: Sie sucht nicht in dem, was ich auf den
Karten lese, sondern in Dateinamen. „Bergungsgruppe“ ergibt „0 Ordner, 0 Bögen“, obwohl in fast jedem
OV-Ordner eine Bergungsgruppe steht (BB2-N1). Dazu kommen Nebenwirkungen: Offline vor fertigem Vorrat
ersetzt der Tipp auf „Beispielbögen ansehen“ die ganze App durch eine Fehlerseite (BB2-N2), die
Übungs-Sammlung heißt wie der ganze Ordnerpfad (BB2-N3) und entsteht bei jedem Tipp neu (BB2-N4),
die klebende Leiste nimmt am Telefon ein Drittel des Dialogs (BB2-N5). Nach einem Neuladen gilt ein
Beispiel wieder als „angefangener Bogen“ und die alte Löschfrage kommt zurück (BB-N1 teilweise).
Die Aufgabe „Beispiel ansehen, als PDF holen, weitergeben, mehrere nacheinander“ gelingt ohne fremde
Hilfe; die Aufgabe „eine bestimmte Einheitsart suchen“ scheitert.

## Bestätigtes Verhalten (kein Befund)

- **Nachgeladener Dialog:** öffnet bei vollem Netz in 0,46 s, bei 50 kB/s in 1,65 s; ein Doppeltipp
  während des Ladens öffnet ihn nur einmal. Nach fertigem Kern-Vorrat (hier nach 24 s) öffnet er auch
  offline.
- **Gemerkter Ordner:** Nach „Anzeigen“ → „‹ Startseite“ → „Beispielbögen ansehen“ steht der Pfad
  „Alle › … › RSt Oldenburg › OV Oldenburg (NI)“ mit 9 Bögen da, ebenso nach Neuladen der Seite.
  Endet man auf „Alle“, beginnt der Dialog auf „Alle“.
- **Escape / Zurück-Geste:** Katastrophenschutz › Hessen: erstes Zurück → Katastrophenschutz, zweites
  → Alle, drittes schließt den Dialog. Mit Text im Suchfeld leert Escape zuerst die Suche und kehrt
  in den vorher offenen Ordner (DLRG) zurück.
- **Ordnerwechsel:** nach „Thüringen“ aus der gescrollten Liste `scrollTop` 0, Fokus auf „Thüringen“
  (Pfad), Pfadleiste klebt beim Scrollen direkt unter der Kopfzeile (oben bei y = 85). Pfadziele
  „‹ Zurück“ 84 x 44, „Alle“ 44 x 44 px. Am Telefon gekürzt auf „Alle › … › RSt Oldenburg › OV
  Oldenburg (NI)“.
- **Karten nach Dialogbreite:** Karten bei 360, 390, 740 x 360 und 844 x 390 (Dialog 590 bzw. 673 px),
  Tabelle bei 1024 und 1280; in allen Fällen `scrollWidth` = `clientWidth`, „Link“ liegt im Dialog.
- **Zwei Beispiele nacheinander:** Erstes „Anzeigen“ fragt (eigener Bogen wandert auf den
  Rückholplatz), zweites ersetzt ohne Rückfrage; Startseite zeigt danach das Beispiel mit „BEISPIEL“
  und darunter weiter „THW Eigenbogen Bergungsgruppe – Zuletzt geschlossener Bogen“. Quittung im
  Bogen: „Solange du nichts änderst, ersetzt das nächste Beispiel ihn ohne Rückfrage. Dein eigener
  Bogen … liegt auf der Startseite unter ‚Zuletzt geschlossenen Bogen zurückholen‘.“
- **Auf heute datiert:** alle sechs geprüften Beispiele mit Zeitraum ab 09.11.2026; kein
  „ist vorbei“, kein „Tippfehler im Jahr?“.
- **Rückfrage vor Ablage:** Beispiel (ASB) → „In Einsatz-Sammlung ablegen…“ → echte Sammlung
  „Hochwasser Echt“: „Übungsbogen in diese Sammlung? … ist als ÜBUNG gekennzeichnet …“ mit „Trotzdem
  ablegen“ und „Abbrechen“.
- **Sammelweg:** „Alle 9 in eine Übungs-Sammlung“ legt in 0,8 s eine Sammlung der Art „Übung“ mit 9
  Einheiten an (jede Karte „ÜBUNG“), der offene eigene Bogen bleibt („Dein eigener Bogen … ist noch
  offen. Bogen fortsetzen“).
- **Link:** öffnet in frischem Browser mit „Empfangener Übungsbogen: Zum Melden am Meldekopf ‚Bogen
  übergeben…‘ …“ statt „Meldung einer fremden Einheit“.
- **PDF:** 3,3 s, Datei `uebung-beispiel-dlrg-wrv-bawue-fuehrungstrupp-elw1.pdf`, Quittung „PDF … erzeugt
  — liegt im Download-Ordner.“ (6 s sichtbar), Kopfzeile „ÜBUNG — Dieser Bogen beschreibt keinen
  echten Einsatz.“
- **Bezeichnungen:** Katastrophenschutz zeigt zwölf Länder in amtlicher Schreibweise, dazu „Noch ohne
  Beispielbögen: Bremen, Hamburg, Sachsen-Anhalt, Schleswig-Holstein.“; THW zeigt während des Ladens
  „… Bögen“ statt einer falschen Zahl.

## Nachprüfung Runde 1

| ID | Stand | Beobachtung Runde 2 |
| --- | --- | --- |
| BB-N1 (P2) | **teilweise** | In derselben Sitzung behoben (siehe oben). Nach Neuladen der Seite steht das Beispiel auf der Startseite als „ÜBUNG“ mit „Entwurf vom 09.11.26, 08:47 Uhr wiederhergestellt. ‚Fortsetzen‘ öffnet ihn dort, wo du warst.“; das nächste „Anzeigen“ bringt wieder „Der angefangene Bogen ‚THW Oldenburg (NI) Fachgruppe Führungsunterstützung‘ wird … ersetzt. Der Bogen ‚THW Eigenbogen Bergungsgruppe‘ … wird dabei endgültig gelöscht“ mit zwei roten Knöpfen. Am Telefon lädt ein verworfener Hintergrund-Tab genau so neu; Restpriorität **P2**. Nachprüfung: wie Runde 1, zwischen den Beispielen einmal neu laden. |
| BB-N2 (P3) | **behoben** | Ordner bleibt nach „Anzeigen“, „Schließen“, Escape auf oberster Ebene und Neuladen; Zurück geht eine Ebene hoch. Rest (bekannt, README Nr. 7): kein Weg „Zurück zu den Beispielbögen“ aus dem Bogen, der Startknopf liegt mit eigenem Bogen weiter tief auf der Startseite. |
| BB-N3 (P3) | **behoben** | Nach Ordnerwechsel oben, Fokus auf Ordnername, Pfadleiste klebt, „›“ aus dem Ordnernamen entfernt („Alle Einheiten aller Ortsverbände (nach Landesverband, Regionalstelle, OV)“). Nebenwirkung: Höhe der klebenden Leiste, siehe BB2-N5. |
| BB-N4 (P3) | **teilweise** | Zeitraum auf heute, Altersmeldungen weg; Katastrophenschutz › Thüringen und ASB öffnen ohne offenen Punkt. Weiter: DLRG „3. Personal fehlt“ und „2 offene Punkte“ (Geschlecht nur vorbelegt, „mehr Führer als Mannschaft“), Bundeswehr „Personal fehlt“ und „mehr Führer als Mannschaft“, Feuerwehr „4. Fahrzeuge fehlt“ und „14 brauchen eine andere Mitfahrgelegenheit“, Praktische Ausbildung „Kennzeichen H-JU XXX steht mehrfach“, THW OV Oldenburg Zugtrupp „Personal fehlt“. Restpriorität **P3**. |
| BB-N5 (P3) | **teilweise** | Ländernamen und „SAR-Leitstelle“ behoben. Weiter in den Karten: Bundeswehr „übergeordnetes Landeskommando Landeskommando (fiktiv)“, als Ort „Panzerpionierzug Panzerpionierzug“, „Pioniermaschinenzug Pioniermaschinenzug“, „Holzdorf/Schönewalde Holzdorf/Schönewalde“; BBK „Landkreis/kreisfreie Stadt Landkreis Moorwehde“. Restpriorität **P3**. |
| BB-N6 (P3) | **teilweise** | Zahl springt nicht mehr („… Bögen“), unter dem Ordner steht „101 Bögen direkt in ‚THW‘, außerhalb der Ordner oben“. Der Ordner heißt weiter „Alle Einheiten aller Ortsverbände …“ mit 3.533 von 3.634 Bögen; was die 101 anderen sind, sagt der Dialog nicht. Bei 50 kB/s ist das Register unter THW zuerst leer, der Ordner erscheint nach rund 2 s über den Karten. Restpriorität **P3**. |
| BB-N7 (P3) | **offen** (bewusst beibehalten, README Nr. 21) | Abschnitt bei 360 x 640 weiter bei y = 1712 (2,7 Bildschirme), Knopf bei y = 1843; im ersten Bildschirm kein Wort „Beispiel“. |
| BB-N8 (P3) | **teilweise** | „BEISPIEL“ auf der Startkarte. Nach Neuladen „ÜBUNG“ und „Entwurf … wiederhergestellt“, also wieder wie ein eigener Entwurf (gleiche Ursache wie BB-N1). Im Ablage-Dialog heißt das Beispiel „Dein Bogen wird als Meldung abgelegt“. Restpriorität **P3**. |
| H1 | offen | Erklärung weiter ohne Aufklappzeichen (`summary` mit `display: flex`, kein `::before`), Wörter „Störer“, „Share-Sheet“, „im aktuellen Layout“. |
| H2 | offen | „Link“ meldet weiter nur 3 s „Kopiert“ am Knopf, sonst nichts. |
| H3 | teilweise | Quittung und Dateiname mit „uebung-beispiel“ da. Die Quittung steht aber über der Liste: PDF von der sechsten Karte (DRK › Niedersachsen, 360 x 640) → Quittung bei y = −1512, nicht zu sehen, nach 6 s weg. |
| H4 | teilweise | DRK sagt „8 Bögen direkt in ‚DRK‘, außerhalb der Ordner oben“; Feuerwehr enthält weiter nur „Niedersachsen 12 Bögen“. |
| H5 | behoben | Platzhalter statt Dateinamen; Karten rutschen beim Laden noch 24 px (Katastrophenschutz › Hessen, 50 kB/s), früher bis 50 px. |
| H6 | teilweise | Bei 390 px stehen „Anzeigen“, „PDF“, „Link“ in einer Reihe; bei 360 px rutscht „Link“ weiter in die zweite Reihe (Karte 282 px hoch). |
| H7 | behoben | Link öffnet als „Empfangener Übungsbogen“ mit Handlungshinweis. |
| H8 | offen | Störer weiter „Übungsbögen unterliegen keiner Datenschutzfrist“, bei 390 px abgeschnitten („… gekennzeichnet …“). |
| H9 | offen | DLRG-Beispiel und PDF zeigen weiter „info@baden.dlrg.de“. |

## Neue Befunde

### BB2-N1 (P2, Bedienung) – Suche findet nicht, was auf den Karten steht

- **Neu oder alt (Verweis):** neu (Folge der Suche, README Nr. 10).
- **Fundstelle:** Dialog „Beispielbögen“, Feld „Suchen“ (Platzhalter „Ort, OV oder Einheit, z. B.
  Oldenburg“); 360 x 640 und 390 x 844.
- **Beobachtung:** Gemessene Treffer: „Bergungsgruppe“ → „0 Ordner, 0 Bögen“; „Bergung“ → 1 Bogen
  („Verstärkter Bergungszug“); „Zugtrupp“ → 18 Bögen, nur Johanniter und Feuerwehr, kein einziger
  THW-Zugtrupp; „Fachgruppe“ → 1 Bogen; „Bergung Oldenburg“ → 0; „Ortsverband Oldenburg“ → 0;
  „Oldenbrug“ (Tippfehler) → 0. Im OV Oldenburg (NI) stehen aber sichtbar „Bergungsgruppe“, „Zugtrupp
  Technischer Zug“, „Fachgruppe Räumen (A)“ usw.; im THW-Ordner steht in fast jedem
  OV-Ordner eine Bergungsgruppe (Stichprobe: Aurich, Emden, Oldenburg). Die Suche prüft nur Ordner- und Dateinamen (`suchTreffer`), nicht die
  angezeigte Einheit. Bei null Treffern steht nur „0 Ordner, 0 Bögen“ ohne Hinweis, wonach gesucht
  werden kann. „Oldenburg“ liefert 57 Bögen, deren erste Karten aus Aurich und Emden stammen (Treffer
  über den Ordner „RSt Oldenburg“), ohne dass die Karte sagt, warum sie passt.
- **Erwartung der Rolle:** Ich tippe ein, was ich auf den Karten lese („Bergungsgruppe“, „Zugtrupp“),
  und bekomme diese Bögen; der Platzhalter verspricht „Einheit“.
- **Folge:** Der Helfer schließt aus „0 Bögen“, dass es für seine Einheitsart kein Beispiel gibt, und
  sucht nicht weiter, obwohl fast jeder OV-Ordner eine hat. Das Vertrauen in die Suche ist nach dem ersten
  Fehlschlag weg; der lange Ordnerweg bleibt der einzige verlässliche.
- **Empfehlung:** In dem suchen, was die Karte zeigt (Einheit, Zug, Ort, Herkunft), oder den
  Platzhalter auf das beschränken, was wirklich geht; bei null Treffern sagen, worin gesucht wurde,
  und einen Ausweg nennen (Ordner öffnen, kürzeres Wort).
- **Nachprüfung:** „Bergungsgruppe“ und „Zugtrupp Oldenburg“ suchen: Treffer enthalten die
  Bergungsgruppe bzw. den Zugtrupp des OV Oldenburg (NI).
- **Typ:** Bedienung.

### BB2-N2 (P3, Robustheit) – Offline vor fertigem Vorrat: Beispiel-Knopf zeigt eine Fehlerseite

- **Neu oder alt (Verweis):** neu (Folge des nachgeladenen Dialogs).
- **Fundstelle:** Startseite beim ersten Besuch, Vorrat noch nicht fertig („⏳ Wird für den
  Offline-Betrieb geladen: 0,4 von 8,0 MB“), Verbindung weg, „Beispielbögen ansehen“; 360 x 640.
- **Beobachtung:** Statt des Dialogs ersetzt eine ganzseitige Meldung die App: „Hier ist etwas
  schiefgelaufen — Ein Teil der App konnte ohne Netz nicht geladen werden … Deine Daten und dein
  Einsatz sind unversehrt …“ mit „Seite neu laden“, „Zur Startseite“, „Daten sichern“. „Zur
  Startseite“ führt zurück, mit Netz öffnet der Dialog dann normal. Nach fertigem Kern-Vorrat (hier
  nach 24 s) tritt der Fehler nicht auf. Der Knopf selbst sagt nicht, dass er Netz braucht.
- **Erwartung der Rolle:** Ein Knopf zum Ansehen von Beispielen meldet höchstens „braucht Netz“ an
  Ort und Stelle; die App bleibt stehen.
- **Folge:** Ein neuer Nutzer, der in einer Halle mit schlechtem Empfang als Erstes die Beispiele
  ansehen will, sieht „etwas schiefgelaufen“ und hält die App für kaputt. Daten gehen nicht verloren
  (gut), der Rückweg ist da.
- **Empfehlung:** Fehlt der Dialog-Baustein, im Abschnitt oder einem kleinen Dialog sagen „Beispiele
  brauchen beim ersten Öffnen Netz“, statt die ganze App auszutauschen.
- **Nachprüfung:** Frischer Browser, nach 1–2 s offline, „Beispielbögen ansehen“: Startseite bleibt,
  Hinweis erscheint am Knopf.
- **Typ:** Robustheit.

### BB2-N3 (P3, Text) – Übungs-Sammlung heißt wie der ganze Ordnerpfad

- **Neu oder alt (Verweis):** neu (Folge des Sammelwegs, README Nr. 3).
- **Fundstelle:** OV Oldenburg (NI) → „Alle 9 in eine Übungs-Sammlung“, danach Sammlung und
  Startseite; 390 x 844.
- **Beobachtung:** Die Sammlung heißt „Übung: THW › Alle Einheiten aller Ortsverbände (nach
  Landesverband, Regionalstelle, OV) › Bremen, Niedersachsen › RSt Oldenburg › OV Oldenburg (NI)“.
  Der Titel der Sammlung belegt sieben Zeilen (rund 240 px) im Kopf, daneben „Ort eintragen…“; auf der
  Startseite steht derselbe Name über „Öffnen“. Das Entscheidende („OV Oldenburg (NI)“) steht ganz am
  Ende.
- **Erwartung der Rolle:** Ein kurzer Name wie „Übung OV Oldenburg (NI)“, den ich in der Liste
  wiederfinde.
- **Folge:** Mehr Scrollen in jeder Sammlungsansicht; in der Liste der Sammlungen unterscheiden sich
  Übungen erst in der letzten Zeile. Der Helfer benennt um oder lässt es und verwechselt Sammlungen.
- **Empfehlung:** Als Namen die letzte Ordnerebene (ggf. mit Organisation) nehmen, den Pfad höchstens
  als Beschreibung.
- **Nachprüfung:** Sammelweg aus OV Oldenburg (NI): Titel in höchstens zwei Zeilen bei 390 px.
- **Typ:** Text.

### BB2-N4 (P3, Bedienung) – Jeder Tipp auf den Sammelweg legt still eine weitere Sammlung an

- **Neu oder alt (Verweis):** neu (Folge des Sammelwegs).
- **Fundstelle:** OV Oldenburg (NI) → „Alle 9 in eine Übungs-Sammlung“ → „‹ Startseite“ → Dialog
  (öffnet im selben Ordner) → noch einmal „Alle 9 in eine Übungs-Sammlung“; 390 x 844.
- **Beobachtung:** Ohne Rückfrage entsteht eine zweite Sammlung mit demselben Namen. Die Startseite
  zeigt zwei gleich lautende Einträge, die sich nur in „angelegt 09.11.2026, 08:54“ und „08:55“
  unterscheiden, je mit „Löschen…“.
- **Erwartung der Rolle:** Beim zweiten Mal öffnet die App die schon angelegte Übung oder fragt
  „Gibt es schon — öffnen oder neu anlegen?“.
- **Folge:** Wer nachschauen will, „was der Knopf noch mal macht“, sammelt Doppel an und muss danach
  herausfinden, welche er löschen darf; im Übungsbetrieb landen Meldungen in der falschen Kopie.
- **Empfehlung:** Gibt es für diesen Ordner schon eine Übungs-Sammlung, sie anbieten statt still eine
  neue anzulegen.
- **Nachprüfung:** Sammelweg zweimal aus demselben Ordner: genau eine Sammlung oder eine Rückfrage.
- **Typ:** Bedienung.

### BB2-N5 (P3, Layout) – Klebende Kopf- und Pfadleiste belegt ein Drittel des Dialogs

- **Neu oder alt (Verweis):** neu (Nebenwirkung der klebenden Pfadleiste, README Nr. 8).
- **Fundstelle:** Dialog in einem Ordner, Liste gescrollt; 360 x 640, 740 x 360, 844 x 390.
- **Beobachtung:** Kopfzeile 68 px plus Pfadleiste („‹ Zurück“ in eigener Zeile, darunter Pfad, bei
  OV Oldenburg (NI) die aktuelle Ebene in einer dritten Zeile): bei 360 x 640 zusammen 168 px (DRK ›
  Niedersachsen) bis 189 px (OV Oldenburg) von 608 px Dialoghöhe, also 28–31 %. Im Querformat 740 x
  360 und 844 x 390 jeweils 120 px von 328 bzw. 358 px (37 % bzw. 34 %); eine Karte ist dort 217 px
  hoch und passt nicht ganz unter die Leiste, die Knöpfe einer Karte und der Name der nächsten sind
  nie zugleich zu sehen.
- **Erwartung der Rolle:** Oben bleibt ein schmaler Rückweg, der Rest gehört den Bögen.
- **Folge:** Mehr Scrollen je Karte; im Querformat (Telefon im Halter, Tablet quer) sieht der Helfer
  nie eine ganze Karte und tippt leichter die Knöpfe der falschen Karte.
- **Empfehlung:** „‹ Zurück“ und Pfad in einer Zeile führen und nur diese Zeile kleben lassen; bei
  geringer Höhe die Leiste beim Herunterscrollen einklappen.
- **Nachprüfung:** 740 x 360, DLRG, gescrollt: eine ganze Karte samt Knöpfen unter der Leiste sichtbar.
- **Typ:** Layout.

### BB2-N6 (P3, Text) – Suchtreffer-Ordner: siebenzeilige Pfade, der OV selbst fehlt

- **Neu oder alt (Verweis):** neu (Folge der Suche).
- **Fundstelle:** Suche „Oldenburg“; 360 x 640.
- **Beobachtung:** Zwei Ordner-Treffer, je als ganzer Pfad: „THW › Alle Einheiten aller
  Ortsverbände (nach Landesverband, Regionalstelle, OV) › Bremen, Niedersachsen › RSt Oldenburg“
  (sieben Zeilen) und „… › Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein › RSt Lübeck › OV
  Oldenburg in Holstein“; beide zusammen füllen den Bildschirm. Der gesuchte „OV Oldenburg (NI)“
  erscheint nicht als Treffer, nur sein Elternordner „RSt Oldenburg“ (die Suche nimmt den kürzesten
  passenden Pfad); man muss dort noch einmal „OV Oldenburg (NI)“ antippen.
- **Erwartung der Rolle:** Treffer „OV Oldenburg (NI)“ mit kurzer Herkunft darunter, ein Tipp bis zu
  den Bögen.
- **Folge:** Der Helfer liest lange Pfade, um zu erkennen, was gemeint ist, und landet zuerst in der
  Regionalstelle mit zehn Ortsverbänden.
- **Empfehlung:** Den letzten Ordnernamen fett voranstellen, den Pfad gekürzt als Herkunft darunter;
  Ortsverbände, die den Suchbegriff tragen, selbst als Treffer zeigen.
- **Nachprüfung:** Suche „Oldenburg“ bei 360 px: Treffer „OV Oldenburg (NI)“ in höchstens drei Zeilen,
  ein Tipp führt zu den 9 Bögen.
- **Typ:** Text.

## Hinweise (keine Priorität)

- **H2-1 – Nachladen ohne Rückmeldung:** Bei 50 kB/s vergehen 1,65 s zwischen Tipp und Dialog, der
  Knopf zeigt in der Zeit nichts (kein „wird geladen“, nicht gesperrt).
- **H2-2 – Suchfeld scrollt weg:** In einem gescrollten Ordner liegt das Suchfeld oberhalb (gemessen
  y = −730); wer suchen will, muss erst ganz hochscrollen. Die Suche gilt immer für alle Ordner, auch
  wenn man in einem Ordner steht; das steht nirgends.
- **H2-3 – Ablage-Texte für Beispiele:** „In Einsatz-Sammlung ablegen“ sagt bei einem Beispiel „Dein
  Bogen wird als Meldung abgelegt“; die Rückfrage „zählt nicht in die Lage, bekommt aber eine Nummer“
  erklärt einem neuen Nutzer nicht, was „Lage“ hier heißt.
- **H2-4 – Sammelweg steht vor den Karten:** In jedem Ordner kommen vor der ersten Karte der
  OV-Hinweis, „9 Bögen“, der Knopf „Alle 9 in eine Übungs-Sammlung“ und drei Zeilen Erklärung; bei
  360 x 640 beginnt die erste Karte erst unter dem ersten Bildschirm. Wer nur ein Beispiel ansehen
  will, hält den großen Knopf leicht für den Hauptweg.
- **H2-5 – Treffer ohne Grund:** Bei „Oldenburg“ zeigen die ersten Karten Aurich und Emden; dass sie
  über „RSt Oldenburg“ passen, steht nicht an der Karte.
- **H2-6 – Erklärung nennt die Suche nicht:** Der Aufklapper „Was sind Beispielbögen? Was heißen
  Anzeigen, PDF und Link?“ erklärt weder Suche noch Sammelweg.

## Aufgabe

- **Aufgabe geschafft:** ja (ansehen, PDF, Link, mehrere nacheinander, Übungs-Sammlung); eine
  bestimmte Einheitsart über die Suche finden: nein (BB2-N1)
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „0 Bögen“ bei „Bergungsgruppe“ heißt für den Helfer „gibt es nicht“,
  obwohl fast jeder OV-Ordner eine Bergungsgruppe enthält.
- **Größtes Einsatzrisiko:** Nach einem Neuladen gilt ein Beispiel wieder als angefangener Bogen, und
  das nächste „Anzeigen“ bietet an, den eigenen Bogen endgültig zu löschen (BB-N1 teilweise).
- **Top-Priorität für die nächste Iteration:** Die Suche in den angezeigten Einheitsnamen suchen
  lassen (BB2-N1); gleich danach die Beispiel-Kennung über das Neuladen retten (BB-N1).
