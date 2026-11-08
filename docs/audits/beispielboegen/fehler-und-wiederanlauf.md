# Audit „Fehler und Wiederanlauf“, Schwerpunkt Beispielbögen (Bedienfehler provozieren, selbst korrigieren)

- **Prüfer:** Rollenaudit `thw-error-recovery-reviewer`
- **Datum:** 2026-11-08
- **Zählung:** P0: 0 · P1: 1 · P2: 3 · P3: 6 · Hinweise (ohne Priorität): 5 (BB-E1 bis BB-E10; H1 bis H5)
- **Gegenstand:** Live-Seite `https://erfassungsbogen.app/` (Version `v2026.1108.2056`), Code-Stand Commit `0dd56d4` (`main`). Nur der Bereich Beispielbögen: Abschnitt „Beispielbögen“ unter „So funktioniert’s“ mit dem Knopf „Beispielbögen ansehen“, der Dialog „Beispielbögen“ (zugeklappte Erklärung, Register mit Bogenzahl, Pfadleiste, tiefe Ordner, Tabelle bzw. Karten mit Anzeigen/PDF/Link, Ladezustand) und was „Anzeigen“, „PDF“ und „Link“ danach auslösen. Reiner Prüfbericht, keine Codeänderung.
- **Maßstab:** wie Runde 21: je Sachverhalt ein Befund mit Typ (Daten/Verlust, Bedienung, Layout/Abstand, Text); P3 nur bei echter Beeinträchtigung der Aufgabe, Geschmacksfragen als Hinweis. Vorab gelesen: `docs/audits/README.md` und `docs/audits/runde-21/fehler-und-wiederanlauf.md`. Zum Nachschlagen: `src/app/fusszeile.tsx` (Dialog, `beispielAnsehen`, `beispielHolen`, `ovBeispieleLaden`, `beispieleOeffnen`), `src/app/app.tsx` (`BeispielboegenStart`, `oeffneBeispiel`, `darfBogenErsetzen`).

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen), `isMobile`, `hasTouch`, Locale de-DE, `deviceScaleFactor` 1. Viewports 390 x 844 (Hauptlauf) und 360 x 640. Frischer Browserkontext je Lauf, Skripte und Bildschirmfotos unter `/tmp/claude-0/audit-fehler/` (`bb1.js` bis `bb21.js`). Kein Eingriff ins DOM, kein eingeschleustes Skript; gelesen wurde nur über `evaluate` (Zustand, Rollposition, `localStorage`), Rollen im Dialog per `scrollTop` wie ein Wischen.

Provoziert: Doppeltipp auf Anzeigen, PDF, Register-Eintrag und „‹ Zurück“ (zwei `touchscreen.tap` im Abstand von 120 ms); Escape und Zurück-Geste (`page.goBack()`) mitten im Laden eines Bogens (Antwort der Bogen-JSONs per `context.route` um 3 bis 4 s verzögert); Dialog schließen und wieder öffnen; Neuladen bei offenem Dialog in tiefem Ordner (THW › Alle Einheiten aller Ortsverbände › Bremen, Niedersachsen › RSt Oldenburg › OV Oldenburg); „Anzeigen“ bei offenem eigenem Entwurf („THW Musterstadt Eigen“), danach ein zweiter Beispielbogen; Netz weg vor dem Öffnen und während ein Ordner lädt (`context.setOffline`), danach Netz zurück ohne Neuladen.

**Annahmen:** Ein Helfer schaut sich Beispielbögen an, um die App kennenzulernen oder einen Bogen „seines“ OV als Muster zu sehen; parallel kann ein eigener Bogen angefangen sein. Die Beispielbögen selbst haben keinen Wert, der eigene Entwurf schon.

**Nicht prüfbar / Grenzen:** `context.setOffline` sperrt in Chromium die Anfragen des Service Workers nicht zuverlässig (bei aktivem Worker liefen die Bögen „offline“ weiter nach). Die Offline-Fälle sind deshalb zusätzlich mit gesperrtem Service Worker (`serviceWorkers: 'block'`) geprüft; das entspricht dem ersten Besuch, bevor der Offline-Vorrat geladen ist (Startseite: „0,5 von 8,0 MB“). Nicht geprüft: native Apps (Share-Sheet), echte System-Zurück-Geste unter Android, Inhalt der erzeugten PDF, echte Bildschirmtastatur.

## Urteil aus Sicht der Rolle

Der Weg zu einem Beispielbogen ist ohne Hilfe zu schaffen, und die naheliegenden Fehler sind abgefangen: Doppeltipps auf Anzeigen/PDF/Link lösen nur eine Wirkung aus, „Anzeigen“ bei eigenem Entwurf fragt nach (Fokus auf „Abbrechen“), „Abbrechen“ lässt den Dialog offen, und der eigene Stand bleibt über „Zuletzt geschlossenen Bogen zurückholen“ erreichbar. Reibung entsteht beim **Abbrechen**: Escape oder Zurück mitten im Laden schließt nur den Dialog, der Bogen öffnet trotzdem, mit eigenem Entwurf erscheint die Rückfrage Sekunden später mitten in der eigenen Arbeit (BB-E1). Wer sich **zwei Beispielbögen** nacheinander ansieht, verdrängt seinen eigenen Entwurf vom einzigen Rückholplatz (BB-E2). In tiefen Ordnern geht der Weg bei jeder Unterbrechung verloren (BB-E4), und ohne Netz verschwindet der größte Ordner still bis zum Neuladen (BB-E3).

### Im Browser geprüft und gehalten (nicht als Befund)

- **Doppeltipp Anzeigen/PDF/Link:** Während ein Bogen vorbereitet wird, sind alle Knöpfe der Tabelle gesperrt, die Zeile zeigt „wird vorbereitet …“; ein Bogen geöffnet, eine PDF (`wrv-bawue-fuehrungstrupp-elw1.pdf`, nach 2,6 s), „Link“ quittiert in der Zeile mit „Kopiert“.
- **Rückfrage bei eigenem Entwurf:** „Beispielbogen öffnen? Der angefangene Bogen „THW Musterstadt Eigen“ wird durch den Beispielbogen ersetzt …“, Fokus auf „Abbrechen“; Escape bricht ab, Dialog und Pfad bleiben, Knöpfe sofort wieder frei. Nach Bestätigen liegt der eigene Stand unter `eeb.entwurf.ersetzt.v1` und auf der Startseite als „Zuletzt geschlossenen Bogen zurückholen“.
- **Escape** schließt den Dialog; kein Querüberlauf bei 360 und 390 px, auch nicht im tiefsten Ordner.
- **Offline-Meldungen sind konkret:** „PDF konnte nicht erzeugt werden: Der Baustein dafür ließ sich nicht nachladen. Dafür braucht die App einmal Netz …“ bzw. „Dieser Beispielbogen liegt noch nicht auf dem Gerät …“.
- **Ladezustand:** „Angaben werden geladen … 14 von 101“ über der Tabelle; Zeilen ohne Daten zeigen „…“ statt „—“.

## Befunde

### BB-E1 (P1, Bedienung) Abbrechen mitten im Laden bricht nicht ab: Bogen öffnet trotzdem, Rückfrage erscheint später in der eigenen Arbeit

- **Fundstelle:** Dialog „Beispielbögen“ → „Anzeigen“ (oder „PDF“) auf einer Zeile, deren Bogen noch lädt → Escape, Zurück-Geste oder „Schließen“.
- **Beobachtung:** Ordner Feuerwehr › Niedersachsen, Bogen-Antwort um 4 s verzögert. „Anzeigen“ → Zeile „wird vorbereitet …“ → Escape: Dialog zu, Startseite sichtbar. Rund 4 s später öffnet sich ohne weiteres Zutun der Beispielbogen in der Übersicht („Beispielbogen geöffnet — fiktive Daten …“). Mit eigenem Entwurf: Anzeigen → Zurück-Geste → Helfer tippt „Fortsetzen“ und arbeitet in seinem Bogen („Musterstadt Eigen“ im Feld) → 5 s später legt sich mitten im Formular die Rückfrage „Beispielbogen öffnen?“ mit dem dunklen Hauptknopf „Beispielbogen öffnen“ darüber (`bb14-rueckfrage-aus-dem-nichts.png`). Der Fokus steht immerhin auf „Abbrechen“. Ebenso „PDF“ → Escape: die PDF wird 3 s später trotzdem heruntergeladen. Ursache laut Code: `beispielAnsehen` wartet auf das Laden und ruft danach `onBogenOeffnen` auf, ohne zu prüfen, ob der Dialog inzwischen geschlossen wurde.
- **Folge:** Der Helfer hat bewusst abgebrochen und bekommt die Handlung trotzdem, zeitversetzt und außerhalb des Zusammenhangs. Wer gerade tippt oder mit Handschuh daneben tippt, bestätigt eine Frage, die er nicht gestellt hat; der eigene Bogen wandert dann auf den Rückholplatz, und liegt dort schon etwas, folgt die Dreifach-Wahl mit „alten Bogen endgültig löschen“ (siehe BB-E2). Bei langsamem Netz (Funkloch, erster Besuch) ist das kein Randfall, sondern der Normalfall.
- **Empfehlung:** Schließen des Dialogs bricht das laufende Anzeigen bzw. die PDF ab; erscheint der Bogen erst nach dem Schließen, passiert nichts. Alternativ den Dialog sichtbar offen halten, bis „wird vorbereitet …“ fertig ist, mit eigenem „Abbrechen“.
- **Nachprüfung:** Bogen-Antwort um 4 s verzögern, Anzeigen, Escape bzw. Zurück, 10 s warten: kein Bogen geöffnet, keine Rückfrage, kein Download. Dasselbe mit „Fortsetzen“ eines eigenen Entwurfs dazwischen.

### BB-E2 (P2, Daten/Verlust) Zweiter Beispielbogen verdrängt den eigenen Entwurf vom Rückholplatz

- **Fundstelle:** Eigener Entwurf offen → „Anzeigen“ Beispielbogen A (bestätigen) → „‹ Startseite“ → Dialog erneut → „Anzeigen“ Beispielbogen B.
- **Beobachtung:** Nach A steht der eigene „THW Musterstadt Eigen“ unter „Zuletzt geschlossener Bogen“, oben der Beispielbogen A mit „Fortsetzen / Bogen schließen“. Bei B lautet die Rückfrage: „Der angefangene Bogen „ASB-Kreisverband Rheindorf e. V. Betreuungskomponente (Einsatzeinheit)“ wird durch den Beispielbogen ersetzt. Der Bogen „THW Musterstadt Eigen“ … auf dem Platz „Zuletzt geschlossener Bogen“ wird dabei endgültig gelöscht: Er fasst nur einen Bogen.“ Wahl: „… den alten Bogen vorher als Datei sichern“, „… alten Bogen endgültig löschen“, „Abbrechen“. Nach dem Löschen-Weg liegt auf dem Rückholplatz der Beispielbogen A (`eeb.entwurf.ersetzt.v1`, `uebung: true`), der eigene Entwurf ist weg. Die Rückfrage nennt den Beispielbogen A „den angefangenen Bogen“.
- **Folge:** Durchklicken von zwei Mustern, genau wofür der Dialog gedacht ist, kostet den einzigen echten Entwurf, wenn der Helfer die lange Rückfrage überfliegt. Der verdrängende Stand ist ein Beispielbogen, der jederzeit wieder aus dem Dialog kommt, also wertlos. Die Warnung ist ehrlich, aber sie fragt nach etwas, das der Helfer nicht erwartet (er wollte nur ein zweites Beispiel sehen).
- **Empfehlung:** Ein ersetzter Beispielbogen belegt den Rückholplatz nicht (er wird einfach verworfen, der eigene Entwurf bleibt dort); die Rückfrage spricht dann vom „Beispielbogen“ statt vom „angefangenen Bogen“.
- **Nachprüfung:** Eigener Entwurf → Beispiel A → Beispiel B → Startseite: unter „Zuletzt geschlossener Bogen“ steht der eigene Entwurf; die Rückfrage bei B bietet keinen Löschweg an.

### BB-E3 (P2, Bedienung) Ohne Netz geöffnet: Ordner „Alle Einheiten aller Ortsverbände“ fehlt bis zum Neuladen, ohne Hinweis

- **Fundstelle:** Dialog „Beispielbögen“ → THW, nachdem der Dialog einmal ohne Netz geöffnet wurde (Service Worker gesperrt, entspricht dem ersten Besuch vor fertigem Offline-Vorrat).
- **Beobachtung:** Offline geöffnet zeigt das Register „THW 101 Bögen“ statt „3.634 Bögen“; in THW fehlt die Zeile „Alle Einheiten aller Ortsverbände (LV › RSt › OV)“, es gibt keine Meldung dazu. Netz wieder an, „Alle“ antippen, Dialog schließen und wieder öffnen, 3 s warten: weiter „THW 101 Bögen“. Erst Neuladen der Seite bringt „THW 3.634 Bögen“ zurück (`bb10.js`, `bb12.js`). Laut Code schluckt `ovBeispieleLaden` den Fehler bewusst („fehlt nur dieser Ordner“); das erneute Nachladen des Bausteins nach Netzrückkehr gelingt ohne Neuladen nicht.
- **Folge:** Der Helfer sucht seinen OV, findet ihn nicht und schließt daraus, dass es ihn nicht gibt. Nichts sagt ihm, dass 3.533 Bögen fehlen und ein Neuladen mit Netz hilft. Das ist eine Sackgasse ohne Wegweiser.
- **Empfehlung:** Fehlt der Ordner, eine Zeile an seiner Stelle: „Alle Einheiten aller Ortsverbände — ohne Netz nicht geladen. Mit Netz erneut versuchen“ mit Knopf; nach Netzrückkehr selbst nachladen.
- **Nachprüfung:** Ohne Netz öffnen → Hinweiszeile sichtbar; Netz an, Knopf bzw. Wiederöffnen → „THW 3.634 Bögen“ ohne Neuladen.

### BB-E4 (P2, Bedienung) Tiefe Ordner: Zurück-Geste schließt den ganzen Dialog, jedes Wiederöffnen beginnt bei „Alle“

- **Fundstelle:** THW › Alle Einheiten aller Ortsverbände › Bremen, Niedersachsen › RSt Oldenburg › OV Oldenburg (fünf Ebenen).
- **Beobachtung:** Das Öffnen des Dialogs legt einen Verlaufseintrag an (`history.length` 2 → 3), der Ordnerwechsel keinen. Zurück-Geste im OV-Ordner: Dialog zu, Startseite. Wieder öffnen: Register „ASB … THW“, also ganz oben (`setBeispielPfad([])` „beim Öffnen wieder ganz oben starten“). Ebenso nach „Schließen“, nach Neuladen (Dialog zu, Startseite oben, der Abschnitt „Beispielbögen“ liegt bei y = 1692 bei 390 x 844) und nach „Anzeigen“ + „‹ Startseite“. Im Dialog selbst steht ein „‹ Zurück“, das genau eine Ebene hoch geht; die System-Geste tut etwas anderes.
- **Folge:** Wer zwei Bögen seines OV vergleichen will oder nach einer Unterbrechung weitermacht, tippt jedes Mal fünf Ebenen neu durch. Unter Android ist die Zurück-Geste der übliche Weg „eine Ebene hoch“; sie wirft den Helfer aus dem Dialog.
- **Empfehlung:** Zurück-Geste geht im Dialog eine Ebene hoch (erst auf „Alle“ schließt sie); der zuletzt offene Ordner bleibt für die Sitzung gemerkt, mit „Alle“ in der Pfadleiste als Weg nach oben.
- **Nachprüfung:** OV-Ordner, Zurück-Geste → „RSt Oldenburg“; Schließen, „Beispielbögen ansehen“ → wieder „OV Oldenburg (NI)“.

### BB-E5 (P3, Bedienung) Ohne Netz: Meldung springt ans Listenende, bleibt nach Ordnerwechsel stehen, kein Neuversuch

- **Fundstelle:** Ordner mit nicht geladenen Bögen ohne Netz (Service Worker gesperrt), z. B. Katastrophenschutz › BADENWUERTTEMBERG oder THW (101 Bögen).
- **Beobachtung:** Die Zeilen zeigen Dateinamen („099-plauen-fgr-wp-c“) und „nicht geladen“, alle Knöpfe bleiben aktiv. Die Meldung „Einige Beispielbögen liegen noch nicht auf dem Gerät …“ steht unter der letzten Karte, und die Ansicht springt dorthin (360 x 640: `scrollTop` 3368 von 3974). „Anzeigen“ auf der ersten Zeile → erneuter Sprung ans Ende zu „Bogen konnte nicht geladen werden: …“. Netz wieder da: Die alte Meldung bleibt stehen, auch nach Wechsel zu „Alle“ und in den vollständig geladenen Ordner DLRG („7 Bögen“, alle Angaben da, darunter weiter „Einige Beispielbögen liegen noch nicht auf dem Gerät“). Einen Knopf „Erneut versuchen“ gibt es nicht; die geladenen Zeilen kommen erst nach einem Ordnerwechsel. Der Verweis „siehe Offline-Zeile der Startseite“ zeigt auf eine Zeile außerhalb des Dialogs.
- **Folge:** Der Helfer verliert seine Stelle in der Liste, sieht eine Fehlermeldung, die nicht mehr stimmt, und weiß nicht, ob das Problem behoben ist. Kein Datenverlust.
- **Empfehlung:** Meldung über der Tabelle statt darunter, ohne Sprung; bei Ordnerwechsel und Netzrückkehr neu bewerten; Knopf „Erneut laden“. Knöpfe nicht geladener Zeilen mit „(braucht Netz)“ kennzeichnen.
- **Nachprüfung:** Ohne Netz Ordner öffnen: Meldung oben, Rollposition bleibt; Netz an, „Erneut laden“: Angaben erscheinen, Meldung weg; anderer Ordner: keine alte Meldung.

### BB-E6 (P3, Bedienung) Doppeltipp auf einen Ordner öffnet einen falschen Unterordner

- **Fundstelle:** Register im Dialog.
- **Beobachtung:** Zwei Tipps im Abstand von 120 ms auf „Katastrophenschutz“ landen in „Katastrophenschutz › Niedersachsen“ (390 x 844) bzw. „› MECKLENBURG VORPOMMERN“ (360 x 640): Der zweite Tipp trifft den Unterordner, der nach dem Wechsel an derselben Stelle steht. Bei „THW“ (danach nur ein Eintrag oben) passiert nichts Falsches. Doppeltipp auf „‹ Zurück“ geht zwei Ebenen hoch (OV Bad Aibling → Bayern).
- **Folge:** Der Helfer steht in einem Bundesland, das er nicht gewählt hat, und findet „seinen“ Bogen nicht; die Pfadleiste zeigt es zwar, aber am Telefon liegt sie teils außer Sicht (BB-E7). Korrigierbar mit „‹ Zurück“.
- **Empfehlung:** Nach einem Ordnerwechsel Tipps für einen kurzen Moment (rund 300 ms) nicht annehmen, wie bei den Knöpfen Anzeigen/PDF.
- **Nachprüfung:** Doppeltipp auf „Katastrophenschutz“ → Pfad „Alle › Katastrophenschutz“.

### BB-E7 (P3, Layout/Abstand) Ordnerwechsel aus gerollter Liste: Pfadleiste und „‹ Zurück“ außer Sicht

- **Fundstelle:** 360 x 640, THW › … › RSt Biberach, Liste der Ortsverbände nach unten gerollt, „OV Weingarten“ angetippt.
- **Beobachtung:** Der neue Ordner übernimmt die Rollposition (`scrollTop` 300); die Pfadleiste liegt bei −155 bis 57 px, „‹ Zurück“ und der Name „OV Weingarten“ sind nicht zu sehen, oben steht angeschnitten „7 Bögen“ (`bb16-ov-360.png`). Die Pfadleiste selbst ist in diesem Ordner 191 px hoch (145–336), fast ein Drittel des Bildschirms. Bei 390 x 844 ist der Versatz kleiner (96 px), die Leiste bleibt sichtbar.
- **Folge:** Der Helfer sieht nicht, in welchem OV er gelandet ist; ein falscher Tipp (BB-E6) fällt nicht auf.
- **Empfehlung:** Beim Ordnerwechsel den Dialog an den Anfang der Pfadleiste rollen.
- **Nachprüfung:** 360 x 640, gerollte OV-Liste, Ordner antippen: „‹ Zurück“ und Ordnername im Bild.

### BB-E8 (P3, Text) Geöffneter Beispielbogen steht auf der Startseite wie ein eigener Bogen

- **Fundstelle:** Nach „Anzeigen“ → „‹ Startseite“.
- **Beobachtung:** Die oberste Karte zeigt „ASB-Kreisverband Rheindorf e. V. Betreuungskomponente (Einsatzeinheit) · Einsatz 06.09.2025 – 07.09.2025 · gespeichert 21:09 Uhr · Fortsetzen / Bogen schließen“, ohne „Beispiel“ oder „Übung“ (`bb6-start2.png`). In der Bogenansicht steht der Störer „ÜBUNG“, auf der Startseite nicht. Der Beispielbogen ist zugleich der gespeicherte Entwurf (`eeb.entwurf.v1`).
- **Folge:** Nach einer Pause hält der Helfer den Musterbogen für einen eigenen angefangenen Bogen, setzt ihn fort oder schließt ihn, ohne zu wissen, wo sein echter Stand ist (darunter „Zuletzt geschlossener Bogen“).
- **Empfehlung:** Karte mit „Beispielbogen (Übung)“ kennzeichnen, wie der Störer im Bogen.
- **Nachprüfung:** Beispiel anzeigen, Startseite: Karte trägt „Beispielbogen“.

### BB-E9 (P3, Text) Beispielbögen lösen die Plausibilitätswarnungen aus, die im Ernstfall schützen sollen

- **Fundstelle:** „Anzeigen“ → Übersicht des Beispielbogens.
- **Beobachtung:** DLRG „Wasserrettungsverband — Führungstrupp (ELW 1)“: „⚠ 4 offene Punkte für die Weitergabe“, u. a. „Alle 4 Personen stehen auf Geschlecht „männlich“ — das ist die Vorbelegung“, „Einsatzzeitraum 06.11.2023 – 09.11.2023 liegt mehr als ein Jahr entfernt — Tippfehler im Jahr?“, „Stärke 2 / 1 / 1 // 4: mehr Führer als Mannschaft — stimmt das?“, dazu „Dieser Bogen gehört zum Einsatz … — gilt er noch?“. ASB „Betreuungskomponente“: „2 offene Punkte“ (Zeitraum vorbei). Beide geprüften Bögen zeigen Warnungen.
- **Folge:** Das erste Bild, das ein neuer Helfer von einem „fertigen“ Bogen bekommt, ist eine Liste von Warnungen; er lernt, dass sie dazugehören, und übergeht sie später beim eigenen Bogen.
- **Empfehlung:** Beispielbögen so pflegen, dass sie ohne Warnung durchgehen (Zeitraum relativ zum Öffnen, Geschlecht gesetzt), oder die Warnungen bei Beispielbögen als „gehört zum Beispiel“ zurücknehmen.
- **Nachprüfung:** Je Organisation einen Bogen anzeigen: keine „offenen Punkte“.

### BB-E10 (P3, Text) Katastrophenschutz: Ordnernamen in Großbuchstaben ohne Umlaut, Wortbruch

- **Fundstelle:** Dialog → Katastrophenschutz.
- **Beobachtung:** Register „BADENWUERTTEMBERG“, „BAYERN“, „BERLIN“, „HESSEN“, „MECKLENBURG VORPOMMERN“, „NORDRHEIN WESTFALEN“, „RHEINLAND PFALZ“, „SAARLAND“ neben „Brandenburg“, „Niedersachsen“, „Sachsen“, „Thüringen“. Bei 360 x 640 bricht „BADENWUERTTEM“ / „BERG“ mitten im Wort (`bb18-kats-360.png`). Unter THW heißt dasselbe Land „Baden-Württemberg“.
- **Folge:** Beim Suchen eines Bundeslandes stolpert das Auge über zwei Schreibweisen; wer nach „Baden-Württemberg“ sucht, liest an der Zeile vorbei.
- **Empfehlung:** Einheitliche Ländernamen wie unter THW.
- **Nachprüfung:** Register Katastrophenschutz: „Baden-Württemberg“, „Mecklenburg-Vorpommern“ usw., kein Wortbruch bei 360 px.

## Hinweise (ohne Priorität)

- **H1 (Text):** „PDF“ quittiert im Dialog nichts: „wird vorbereitet …“ verschwindet nach rund 2,6 s, der Download läuft still. Am Telefon zeigt das der Browser, im Dialog fehlt ein „PDF erstellt“ wie das „Kopiert“ beim Link.
- **H2 (Bedienung):** Ordner THW lädt 101 Bögen in rund 7 s nach („Angaben werden geladen … 14 von 101“); bis dahin stehen Dateinamen („099-plauen-fgr-wp-c“) und „…“ in den Karten, die ersten Karten ohne taktisches Zeichen.
- **H3 (Layout):** Bei 360 x 640 passen Anzeigen, PDF und Link nicht in eine Zeile; „Link“ rutscht allein in eine zweite Reihe.
- **H4 (Bedienung):** Nach Neuladen bei offenem Dialog steht die Startseite oben, der Abschnitt „Beispielbögen“ liegt rund zwei Bildschirme tiefer (y = 1692 bei 390 x 844). Siehe BB-E4.
- **H5 (Text):** Der Dialog öffnet über der an dieser Stelle gerollten Seite; bei 360 x 640 sieht man unter dem Dialog Text der Startseite („Für Einsatz, Übung …“), der zum Dialog gehören könnte.

## Aufgabe geschafft: ja (online); mit Umwegen bei Unterbrechung, langsamem Netz und ohne Netz
## Fremde Hilfe nötig: nein (ohne Netz: Neuladen mit Netz muss man selbst erraten, BB-E3)
## Größtes Missverständnis: Escape oder Zurück mitten im Laden wirkt wie ein Abbruch, der Bogen öffnet aber trotzdem Sekunden später (BB-E1).
## Größtes Einsatzrisiko: Wer zwei Beispielbögen ansieht, kann mit einem Tipp seinen eigenen angefangenen Bogen vom einzigen Rückholplatz verdrängen (BB-E2).
## Top-Priorität für die nächste Iteration: BB-E1 (Schließen bricht Anzeigen und PDF ab), danach BB-E2.
