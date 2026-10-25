# Audit „Zerstörende Handlungen", Runde 6 (Löschen, Überschreiben, Statuswechsel)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-destructive-action-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 03a0011 (zwei spätere Commits auf main betreffen nur den Lagemonitor
und sind im geprüften Build nicht enthalten).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-5-Befunde (siehe [../runde-5/zerstoerende-handlungen.md](../runde-5/zerstoerende-handlungen.md)).

## Prüfaufbau

Wie in Runde 5 (siehe [../runde-5/README.md → Prüfaufbau](../runde-5/README.md#prüfaufbau)):
Chromium aus Playwright (`node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, Tipps als
Touch-Tipp. Jeder Lauf in einem eigenen Browser-Kontext. Der Zustand kommt aus
`localStorage`-Seeds (`eeb.entwurf.v1`, `eeb.einsaetze.v1`, `eeb.vorlagen.v1`
aus `examples/thw/`, `uebung: false`), die nach dem ersten Laden gesetzt und
nach einem Neuladen wie echte Daten gelesen werden. Wichtig für die Uhrläufe:
Erst nach dem Neuladen existiert `eeb.uhr.v1` (Stand des letzten Starts); ein
Seed ohne diesen Schritt behandelt den Start als Erstlauf und löscht ohne Frage
(so beim ersten Versuch dieser Runde, kein Befund).

Seeds: eigener Bogen „THW Ulm Bergungsgruppe" (8 Personen); Sammlungen
„Hochwasser Test" (3 Einheiten, vor 1 h geändert), „Übung Herbst" (10 Tage),
„Altlage Frühjahr" (85 Tage), Papierkorb „Vorgestern" (2 Tage) und „Fast Weg"
(29,7 Tage); Vorlagen „OV Ulm B", „Meine FGr W", „Kirchehrenbach", im
Papierkorb „Alte Vorlage weg" (29,5 Tage). Dazu Varianten: ruhende Sammlungen
im Papierkorb (80 und 85 Tage), ein Entwurf mit zwei benannten und drei
unbenannten Personen, ein abgeschnittener Entwurf (unlesbar), eine
Sicherungsdatei mit Stand 100 Tage zuvor.

Geräteuhr mit `page.clock.install({ time })` auf einer neuen Seite im selben
Kontext (gleicher Speicher), Tag 0 und Tag 1,5 nach dem Sprung. Sprünge: +59,
+65, +365, +400 Tage, −100 Tage (zurückgestellt), +100 Tage nach echter Pause,
dazu Rückkehr zur echten Uhr. Zwei Fenster als zwei Seiten im selben Kontext.
Nach jeder Handlung Speicher nachgelesen, Bildschirmfotos angesehen. Elf
weitere Prüfer nutzten den Server gleichzeitig; Zeitmessungen sind unsicher
und wurden nicht ausgewertet. Skripte und Fotos liegen im Scratchpad
`runde6/zerstoerend/` (nicht im Repository).

Szenarien: (1) Geräteuhr, alle Sprünge und Folgen für Sammlungen, Papierkorb,
Entwurf, Vorlagen; „Geräteuhr stimmt" mit Rückfrage und Abbruch; Arbeit unter
gehaltener Uhr, danach echte Uhr. (2) Papierkorb Einsätze und Vorlagen:
Restzeit, „Wiederherstellen" ruhender Sammlungen nach sechs Tagen,
„Endgültig löschen…". (3) „Sicherung einspielen" mit 100 Tage alter Datei bis
zum Ende. (4) „Alle Daten löschen" in einem von zwei Fenstern, danach Arbeit
im zweiten (Sammlungsansicht, Startseite). (5) Personen entfernen in Reihe,
Doppel- und Dreifachtipp auf Knopf und Rückfrage, Sammel-Rückgängig.
(6) „Vorbelegung entfernen" in Schritt 1 und 3, Doppeltipp, Neuladen.
(7) Unlesbarer Entwurf: „Entfernen…", „Neuen Bogen erstellen", „Alle Daten
löschen".

Getestet habe ich zuerst ohne Blick in frühere Berichte. Den Runde-5-Bericht
samt „Stand der Behebung" habe ich danach gelesen, die anderen Runde-6-Berichte
zuletzt.

**Nicht prüfbar:** eine echt falsch gestellte Geräteuhr (nur `page.clock`),
zwei echte Geräte an einer Sammlung, Beenden der App durch das Betriebssystem
(nur Neuladen), Kamera-Scan, Kaltstart über Bogen-Link, „Geräteschlüssel neu
erzeugen" bis zum Ende, native Builds, Handschuhe. Die Rückgängig-Fristen
(15 s, 20 s) nicht vermessen. Beim Sprung über die Zeitumstellung (+65 Tage)
trugen unter gehaltener Uhr geänderte Sammlungen einen Stempel eine Stunde in
der Zukunft; das habe ich nicht weiter verfolgt (folgenlos).

## Urteil

Die Löschwege aus Runde 5 halten fast alle. Die Geräteuhr bleibt bei +65, +365
und +400 Tagen, am ersten Tag wie 1,5 Tage später, „nicht bestätigt": Nichts
wird gelöscht, bis jemand „Geräteuhr stimmt" tippt und die Rückfrage mit Zahlen
bejaht. „Wiederherstellen" holt auch eine 85 Tage ruhende Sammlung dauerhaft
zurück, „Sicherung einspielen" mit alter Datei sagt vorher, was am nächsten
Tag wieder fällt, und Personen lassen sich auch mit Dreifachtipp nur einzeln
und mit Namen in der Rückfrage entfernen. Beide neuen Papierkörbe nennen
Datum und Restzeit.

Was bleibt, sind Lücken an den Rändern dieser Wege: Das zweite Fenster nach
„Alle Daten löschen" zeigt auf der Startseite weiter die gelöschten Vorlagen
und schreibt über sie den gelöschten Entwurf samt Namen in den Rückholplatz
zurück (R6-D1). Die Rückfrage „Geräteuhr stimmt" nennt Sammlungen nur als Zahl,
auch die von vor einer Stunde (R6-D3). Und der beiseitegelegte Entwurf ist in
der „Alle Daten löschen"-Aufzählung unsichtbar (R6-D2). Nichts davon verliert
Daten ohne mehrere bewusste Schritte; ein P0 oder P1 habe ich nicht gefunden.

Alle Aufgaben lassen sich ohne fremde Hilfe erledigen.

## Übersicht: Handlung → Bestätigung → Rückweg

Alles beobachtet bzw. im Speicher gemessen.

| Handlung | Bestätigung | Rückweg (geprüft) |
| --- | --- | --- |
| Geräteuhr ≥ 60 Tage vor oder zurück | Warnung mit Folgen in Zahlen, nichts wird gelöscht | „Uhr korrigieren"; echte Uhr am nächsten Tag: Warnung weg, alles unverändert ✓ |
| „Geräteuhr stimmt" | Rückfrage „Datum stimmt — jetzt aufräumen?" mit Zahlen, „nicht im Papierkorb"; **Sammlungen ohne Namen (R6-D3)** | keiner, bewusst; Abbruch lässt alles |
| Aufräumung bei Sprung bis 59 Tage | Nachricht danach mit Name der Sammlung | Export vorher (Ankündigung ab Tag 60) |
| Papierkorb „Wiederherstellen" (Einsätze, Vorlagen) | keine | Sammlung bleibt, auch ruhende ✓ |
| Papierkorb „Endgültig löschen…" | Rückfrage mit Name, Zahl, „einzige Kopie" | keiner, bewusst |
| „Sicherung einspielen…" | Aufzählung beider Seiten, „Davon fällt sofort wieder weg: …" mit Namen, Haken | Sicherungsdatei ✓ |
| „Alle Daten löschen" | Aufzählung mit Zahlen und Namen ohne Export, Haken; **beiseitegelegter Bogen fehlt (R6-D2)** | Sicherungsdatei ✓ |
| „Person entfernen" | Rückfrage mit Name | Quittung „Rückgängig" (mehrere Entfernungen in einer Quittung) ✓ |
| „Vorbelegung entfernen" Schritt 1 | keine, bewusst | Quittung, „Rückgängig" überlebt Neuladen ✓ |
| „Vorbelegung entfernen" Schritt 3 | keine, bewusst | Quittung, **Rückgängig weg nach Neuladen (R6-D4)** |
| Beiseitegelegter Entwurf „Entfernen…" | Rückfrage, nennt „Als Datei sichern" | Datei |

## Befunde

### R6-D1 [P2] „Alle Daten löschen" in Fenster A: Die Startseite von Fenster B zeigt die gelöschten Vorlagen weiter und schreibt über „Bogen anlegen" den gelöschten Entwurf samt 8 Namen in den Rückholplatz zurück (Rest von R5-D3)

**Priorität:** P2

**Kennzeichnung:** gemessen (Speicher vor und nach, Bildschirmfoto
`d3b-p2-warn.png`).

**Fundstelle / Aufgabe:** Zwei Fenster im selben Gerät, Seeds wie oben.
Fenster A: Fußzeile „Alle Daten löschen", Haken, „Endgültig löschen". Fenster B
bleibt auf der Startseite stehen. Code: `src/app/app.tsx` (Startseite hält
Vorlagen und Entwurf im Arbeitsspeicher), `src/app/entwurf.ts`
(`entwurfFremdEntfernt` schützt nur das Schreiben von `eeb.entwurf.v1`, nicht
das des Rückholplatzes `eeb.entwurf.ersetzt.v1`).

**Beobachtung:**

- Nach dem Löschen enthält der Speicher nur noch `eeb.uhr.v1`. Fenster B zeigt
  oben die Startkarte mit „⚠ In einem anderen Fenster gelöscht oder
  geschlossen — hier wird nichts gespeichert" (die R5-D3-Behebung wirkt), aber
  darunter weiter „Einsatz vorbereiten: OV Ulm B", „Meine FGr W" und die
  Vorlagenkarten mit allen Namen.
- Tipp auf „Einsatz vorbereiten: OV Ulm B" öffnet die Musterung mit den 8
  Namen und schreibt `eeb.musterung.v1`. „Bogen anlegen · 8 Pers · 2 Fz" fragt
  „… Der angefangene Bogen „THW Ulm Bergungsgruppe" wird durch den Bogen aus
  der Vorlage ersetzt … unter „Zuletzt geschlossenen Bogen zurückholen"
  erreichbar" — den es nicht mehr gibt. Nach „Ja, alle sind da — anlegen" liegt
  `eeb.entwurf.ersetzt.v1` mit 2 540 Zeichen im Speicher: die 8 Namen des
  gelöschten Bogens (Karsten Lehmann, Moritz Herrmann …), Einheit „Ulm".
- Der neue Bogen selbst wird nicht gespeichert (Leiste „hier wird nichts
  gespeichert"). Die Vorlagen kommen nicht zurück, „Löschen" einer solchen
  Geisterkarte schreibt nur `[]` und zeigt keine Quittung.

**Erwartung der Rolle:** Wer „Alle Daten löschen" bestätigt hat, erwartet, dass
nach dem Vorgang nichts mehr von diesen Daten auf dem Gerät liegt, auch wenn
ein zweites Fenster offen war. Fenster B sollte nach dem Löschen nicht mehr mit
den alten Karten arbeiten lassen.

**Auswirkung im Einsatz:** Personendaten, die ausdrücklich gelöscht wurden
(Gerät wird an eine andere Person übergeben), stehen wieder auf dem Gerät und
erscheinen unter „Zuletzt geschlossenen Bogen zurückholen". Voraussetzung sind
ein zweites offenes Fenster und mehrere bewusste Tipps; deshalb P2.

**Empfehlung:** Das Fenster, das ein Löschen bemerkt (`storage`-Ereignis,
`entwurfFremdEntfernt`), baut seine Startseite aus dem Speicher neu auf oder
sperrt sie mit der Leiste; mindestens darf der Rückholplatz nicht aus dem
Arbeitsspeicher beschrieben werden, wenn der Entwurf extern entfernt wurde.

**Nachprüfung:** Wie oben; nach „Bogen anlegen" in Fenster B darf
`eeb.entwurf.ersetzt.v1` nicht entstehen, und die Vorlagenkarten müssen nach dem
Löschen in A verschwinden oder gesperrt sein.

### R6-D2 [P2] „Alle Daten löschen" nennt den beiseitegelegten Bogen nicht und sagt „kein offener Bogen-Entwurf", löscht ihn aber mit

**Priorität:** P2

**Kennzeichnung:** gemessen (Dialogtext und Speicher vor und nach).

**Fundstelle / Aufgabe:** Unlesbarer (abgeschnittener) Entwurf im Speicher →
Startseite: „Ein gespeicherter Bogen ließ sich nicht öffnen … nicht gelöscht,
sondern beiseitegelegt — als Datei sichern" → Fußzeile „Alle Daten löschen".
Code: `src/app/sicherung.ts` (`datenUmfang`, `alleDatenLoeschen`: löscht alle
`eeb.*`, die Aufzählung kennt `eeb.entwurf.beschaedigt.v1` nicht).

**Beobachtung:**

- Bei leerem Gerät außer dem beiseitegelegten Bogen (2 127 Zeichen) steht in der
  Aufzählung: „0 Vorlagen … 0 Einsatz-Sammlungen … kein offener
  Bogen-Entwurf …". Nach „Endgültig löschen" ist `eeb.entwurf.beschaedigt.v1`
  weg, ohne dass er genannt wurde.
- Dieselbe Karte verspricht zuvor „Er ist nicht gelöscht, sondern
  beiseitegelegt". Die Aufzählung widerspricht dem: Sie nennt weder Dasein noch
  Einheit.
- „Entfernen…" auf der Karte fragt „Beschädigten Bogen entfernen? … endgültig
  gelöscht" ohne Einheit oder Personenzahl (die Karte kennt die Daten nicht, der
  Text ist nur Rohtext).

**Erwartung der Rolle:** „Betroffen sind" nennt alles, was verschwindet,
auch den beiseitegelegten Bogen („1 beschädigter Bogen, noch nicht als Datei
gesichert").

**Auswirkung im Einsatz:** Wer den Bogen später reparieren wollte, verliert ihn
beim Aufräumen des Geräts, ohne dass die Rückfrage ihn erwähnt. Gering, weil
das Löschen gewollt ist; aber genau der Satz „nicht gelöscht, sondern
beiseitegelegt" macht ihn zur einzigen Kopie.

**Empfehlung:** Zeile „1 beiseitegelegter, unlesbarer Bogen (noch nicht als
Datei gesichert)" in die Aufzählung; bei „Datensicherung" und „Sicherung
einspielen" ebenso.

**Nachprüfung:** Seed wie oben; die Aufzählung nennt den Bogen, solange
`eeb.entwurf.beschaedigt.v1` existiert.

### R6-D3 [P2] „Geräteuhr stimmt" nennt die Sammlungen nur als Zahl, auch die von vor einer Stunde

**Priorität:** P2

**Kennzeichnung:** gemessen (Dialog `s2-365-dialog.png`, Speicher danach).

**Fundstelle / Aufgabe:** Uhr +365 Tage → Warnung „Geräteuhr prüfen" → „Geräteuhr
stimmt". Code: `src/app/uhr-warnung.tsx` (`stimmt`), `src/app/uhr-folgen.ts`
(`UhrFolgen.namen` wird für die Sicherungs-Rückfrage genutzt, hier nicht).

**Beobachtung:**

- Warnung und Rückfrage: „… werden 3 Sammlungen, 3 Papierkorb-Einträge und die
  Namen im eigenen Bogen endgültig gelöscht — nicht im Papierkorb." Welche
  Sammlungen, steht nicht da. Ein Tipp auf „Ja, Datum stimmt — löschen" löschte
  „Hochwasser Test" (vor einer Stunde geändert), „Übung Herbst" und „Altlage
  Frühjahr"; die Namen stehen erst danach in der Nachricht „Automatisch
  gelöscht".
- „Sicherung einspielen" nennt dieselben Betroffenen mit Namen („Betroffen:
  „Hochwasser Test", …").
- Die Rückfrage sagt „Dazu „Abbrechen" und die Sammlung öffnen", aber nicht,
  welche.

**Erwartung der Rolle:** Die Rückfrage nennt die Sammlungen mit Namen und dem
Alter der letzten Änderung. Dann fällt auf, dass eine laufende Sammlung dabei
ist, und das Datum kann nicht stimmen.

**Auswirkung im Einsatz:** Wer die Uhr für richtig hält (nach Akkuleere oder
Neustart), tippt auf „Stimmt" und verliert die laufende Sammlung, ohne sie
vorher gesehen zu haben. Die Zahl „3 Sammlungen" bei einem Gerät mit drei
Sammlungen ist ein deutlicher Hinweis, aber kein Name.

**Empfehlung:** Namen (bis zu fünf, dann „und 2 weitere") und letzte Änderung in
Warnung und Rückfrage; ist eine Sammlung in den letzten 7 Tagen geändert worden,
den Satz „Diese Sammlung wurde vor 1 Stunde noch bearbeitet" ergänzen.

**Nachprüfung:** Uhr +365: Warnung und Rückfrage nennen „Hochwasser Test (vor
1 Stunde geändert)".

### R6-D4 [P3] „Vorbelegung entfernen" in Schritt 3: Der Rückweg überlebt das Neuladen nicht (Teil von R5-D5)

**Priorität:** P3

**Kennzeichnung:** gemessen (Neuladen und Rückgängig-Knöpfe gezählt).

**Fundstelle / Aufgabe:** Bogen mit drei unbenannten Sollplätzen → Schritt 3
„Personal" → „Vorbelegung entfernen (3 Personen ohne Namen)" → Neuladen →
„Fortsetzen" → Schritt 3. Code: `src/app/schritte/personal.tsx`
(`aendernMitRueckweg`), `src/app/vorbelegung-rueckweg.ts` wird nur in
`schritte/einheit.tsx` genutzt.

**Beobachtung:** Schritt 1: Quittung „Vorbelegung entfernt: 3 Personen (3 mit
geänderter Rolle oder Funktion) — Stärke 5 → 2", nach Neuladen steht sie samt
„Rückgängig" wieder da ✓. Schritt 3: dieselbe Quittung, nach Neuladen kein
„Rückgängig" mehr, Personal bleibt bei 2 Personen. Die Behebung von R5-D5 gilt
nur für den Weg über Schritt 1.

**Folge:** Rolle, Funktion, Geschlecht und Ernährung der Sollplätze sind nach
einem Neuladen weg; der Weg zurück ist „StAN-Sollplätze laden", der die benannten
Personen verdrängt (die Rückfrage nennt sie).

**Empfehlung:** Den Sitzungsspeicher-Rückweg auch für Schritt 3 verwenden.

**Nachprüfung:** Schritt 3, Entfernen, Neuladen: „Rückgängig" steht in
Schritt 3 oder auf der Karte bereit.

### R6-D5 [P3] Der beiseitegelegte Entwurf liegt als Rohtext mit Namen auf dem Gerät und erreicht keine Datenschutzfrist

**Priorität:** P3

**Kennzeichnung:** Risiko (Code `src/app/uhr-folgen.ts` und `src/app/entwurf.ts`
gelesen; `eeb.entwurf.beschaedigt.v1` blieb in jedem Lauf bestehen, die
Anonymisierung nach 90 Tagen aber nicht ausgelöst, weil die Uhr gehalten war).

**Fundstelle / Aufgabe:** Beiseitegelegter Entwurf (2 127 Zeichen mit
Namen) bleibt in `eeb.entwurf.beschaedigt.v1`. Die Datenschutzfrist arbeitet auf
geparsten Bögen und kennt den Rohtext nicht.

**Beobachtung:** Weder die Startkarte noch die Datenschutzerklärung nennt eine
Frist für den beiseitegelegten Bogen; „Alle Daten löschen" entfernt ihn (siehe
R6-D2), sonst nur „Entfernen…".

**Folge:** Namen, die die App für alle anderen Bögen nach 90 Tagen entfernt,
bleiben hier unbegrenzt liegen.

**Empfehlung:** Frist wie beim Entwurf oder Hinweis „wird nach 90 Tagen
gelöscht" auf der Karte; Datenschutzfolgenabschätzung (Datenkategorien,
Löschwege) nachziehen.

**Nachprüfung:** Beiseitegelegten Bogen anlegen, Uhr (bestätigt) +100 Tage:
Text gelöscht oder anonymisiert, Karte sagt es.

### R6-D6 [P3] Wortlaut: Namenslisten mit Komma und uneinheitliche Datumsform

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Quittung nach mehreren Entfernungen, Papierkörbe.

**Beobachtung:** „Entfernt: 3 Personen (Lehmann, Karsten, Herrmann, Moritz,
Hartmann, Karsten)" — der Name „Nachname, Vorname" und der Listentrenner sind
beide ein Komma, sechs Namen lesen sich wie sechs Personen. In „Papierkorb
Einsätze" und „Papierkorb Vorlagen" steht „gelöscht am 24.9.2026", in der
Restzeit-Zeile „16.10.2026" mit führender Null.

**Folge:** Bei der Kontrolle vor „Rückgängig" schwer lesbar; kein Datenverlust.

**Empfehlung:** Namen mit Semikolon oder „Vorname Nachname", Datumsform
vereinheitlichen.

**Nachprüfung:** Drei Personen entfernen; Quittung zeigt drei lesbare Namen.

### R6-D7 [P3] Uhrsprung bis 59 Tage: eine Sammlung mit 31 bis 59 Tagen Ruhe fällt ohne Rückfrage und ohne vorherige Ankündigung

**Priorität:** P3

**Kennzeichnung:** gemessen für 85 Tage + 59 (Ankündigung lag vor), Risiko für
den Bereich 31 bis 59 Tage (aus dem Code abgeleitet).

**Fundstelle / Aufgabe:** `src/app/datenschutz-uhr.ts` (`UHR_SPRUNG_TAGE = 60`).

**Beobachtung:** Bei +59 Tagen gilt die Uhr ohne Frage; „Altlage Frühjahr" (85
Tage ruhend, seit Tag 60 mit „Wird in 5 Tagen automatisch gelöscht" angekündigt)
wird gelöscht, die Nachricht danach nennt den Namen und sagt „nach dem Datum
dieses Geräts". Eine Sammlung, die 40 Tage ruhte, würde bei +59 Tagen ebenfalls
gelöscht, ohne dass der Hinweis ab Tag 60 je erschien.

**Folge:** Ein Fehlstand der Uhr von weniger als zwei Monaten kann eine
Sammlung ohne Vorwarnung kosten.

**Empfehlung:** Die Grenze an die Ankündigungsfrist koppeln: Würde durch den
Sprung etwas fällig, das noch nicht angekündigt war, wird gefragt.

**Nachprüfung:** Sammlung 40 Tage ruhend, Uhr +59 Tage: Warnung statt Löschung.

## Bestätigtes

Alles im Browser nachgespielt:

- **Geräteuhr:** +65, +365, +400 Tage, Tag 0 und Tag 1,5: keine Löschung,
  `eeb.uhr.v1` behält den Stand, die Warnung nennt beide Möglichkeiten und die
  Folgen in Zahlen und bleibt in der Sammlungsansicht stehen. „Geräteuhr stimmt"
  → Rückfrage → Abbrechen lässt alles; „Ja" löscht und stellt die Uhr. Nach
  einem Tag mit echter Uhr: keine Warnung, nichts verändert.
- **Zurückgestellte Uhr (−100 Tage):** Warnung „100 Tage danach"; eine unter
  dieser Uhr gelöschte Vorlage trägt den Zeitstempel der echten Zeitlinie, nach
  Rückkehr zur echten Uhr steht sie im Papierkorb ohne Warnung (R5-E2 jetzt auch
  im Browser).
- **100 Tage echte Pause** mit nichts Altem auf dem Gerät ist keine Frage wert;
  mit Sammlungen auf dem Gerät fragt die App und hält auch nach einem Tag.
- **„Wiederherstellen"** aus „Papierkorb Einsätze" bei Sammlungen mit 80 und 85
  Tagen Ruhe, sechs Tage nach dem Löschen: bleiben in der Liste, auch nach
  Neuladen; die Karte sagt „Beim Wiederherstellen beginnt die Aufräumfrist von 90
  Tagen neu".
- **„Sicherung einspielen"** mit 100 Tage alter Datei: Dialog mit beiden Seiten
  und „Davon fällt sofort wieder weg: 3 Sammlungen, 3 Papierkorb-Einträge und die
  Namen im eigenen Bogen … Betroffen: …", Haken, Knopf gesperrt bis zum Haken;
  danach „Neu laden"; Uhrstand des Geräts bleibt (R5-D4 jetzt im Browser).
- **„Alle Daten löschen" in Fenster A:** Sammlungsansicht und Bogen in Fenster B
  schreiben nichts zurück („Die Sammlung … gibt es nicht mehr", feste Leiste);
  nur die Startseite hat die Lücke R6-D1.
- **Personen entfernen in Reihe:** Dreifachtipp auf denselben Punkt öffnet
  genau eine Rückfrage „Lehmann, Karsten entfernen?"; Dreifachtipp auf „Person
  entfernen" der Rückfrage entfernt genau eine Person; drei einzelne
  Entfernungen werden in einer Quittung „Entfernt: 3 Personen" zusammengefasst,
  ein „Rückgängig" holt alle drei an ihre Plätze, auch nach Neuladen.
- **„Vorbelegung entfernen" Doppeltipp (Schritt 3):** Nach dem ersten Tipp rückt
  der Inhalt nach, der zweite trifft „StAN-Sollplätze laden"; diese Rückfrage
  nennt die zwei Namen, die dabei verloren gingen, und fängt es ab.
- **Unlesbarer Entwurf:** liegt beiseite, Karte mit Ursache, „Als Datei sichern"
  und „Entfernen…" (mit Rückfrage); „Neuen Bogen erstellen" lässt ihn
  unberührt (R5-E1 für den Entwurf).
- **Beide Papierkörbe:** Karte nennt Datum, „wird morgen endgültig entfernt",
  „Endgültig löschen…" bei Einsatz („einzige Kopie") und Vorlage mit
  Rückfrage und namentlicher Nennung.

## Abgleich mit Runde 5

| Befund Runde 5 | Stand in Runde 6 | Beleg |
| --- | --- | --- |
| R5-D1 Uhrsprung gilt nach einem Tag als bestätigt (P1) | hält | +65, +365, +400 Tage, Tag 0 und 1,5, −100 Tage, +100 Tage Pause: nichts gelöscht bis „Geräteuhr stimmt". Die Rückfrage nennt die Sammlungen nur als Zahl (R6-D3, neu) und der Bereich unter 60 Tagen bleibt ohne Frage (R6-D7) |
| R5-D2 „Wiederherstellen" löscht ruhende Sammlung (P1) | hält | 80 und 85 Tage Ruhe, sechs Tage nach dem Löschen, auch nach Neuladen |
| R5-D3 „Alle Daten löschen" in einem Fenster (P2) | teilweise | Entwurf, Sammlungsansicht und Bogen halten; die Startseite des zweiten Fensters arbeitet mit gelöschten Vorlagen und schreibt den Entwurf in den Rückholplatz (R6-D1) |
| R5-D4 „Sicherung einspielen" mit alter Datei (P2) | hält | jetzt im Browser belegt, Rückfrage mit Namen, Uhrstand des Geräts bleibt |
| R5-D5 Wortlaut und Rest-Lücken (P3) | teilweise | Papierkörbe heißen „Papierkorb Einsätze"/„Papierkorb Vorlagen", „noch kein Export …" steht in der Aufzählung, Rückweg von Schritt 1 überlebt Neuladen; in Schritt 3 nicht (R6-D4) |
| R5-E2 Uhr zurückgestellt (aus Runde 5, Paket 2) | hält | Stempel unter zurückgestellter Uhr liegen in der echten Zeitlinie |
| R5-E1 unlesbarer Entwurf | hält für den Entwurf | beiseitegelegt; in der Löschaufzählung fehlt er (R6-D2), Datenschutzfrist reicht nicht hin (R6-D5) |

Nach Runde 5 verkehrt hat sich nichts: Keine Behebung hat einen früheren
Schutz geschwächt. Neu sind die Lücken an den Rändern (R6-D1 bis R6-D7).

Verweise auf andere Runde-6-Berichte: Der beiseitegelegte Entwurf als
Datei ohne Wiedereinlesen steht in
[fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md) (R6-E3); das
Fensterverhalten von Sammlungen und Entwurf in
[offline-und-speicher.md](offline-und-speicher.md) hält dort ebenfalls.

## Stand der Behebung

Stand 23.10.2026, auf demselben Zweig mit Typprüfung, Unit-Tests, Verhaltenstests (137 von 137 Szenarien) und, wo es sich messen ließ, Nachmessung im Browser (Playwright, Produktionsbuild). 6 behoben, 1 teilweise, 0 offen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R6-D1 | behoben | Ein Fenster ohne offenen Bogen baut sich neu auf, wenn ein anderes „Alle Daten löschen“ meldet (`storage`-Ereignis mit `key === null`). Unit-Test. |
| R6-D2 | behoben | Die Aufzählung nennt den beiseitegelegten Bogen. |
| R6-D3 | behoben | Warnung und Rückfrage nennen bis zu fünf Sammlungen mit Alter der letzten Änderung (gegenüber dem letzten akzeptierten Zeitpunkt) und, wenn eine in den letzten 7 Tagen bearbeitet wurde, dass das Datum kaum stimmen kann. |
| R6-D4 | behoben | Der Rückweg im Schritt „Personal“ liegt im Sitzungsspeicher (`eeb.personal.rueckweg`) und überlebt Neuladen und Schrittwechsel (ISK 3.3 D2m (c)). |
| R6-D5 | teilweise | Die Frist von 90 Tagen stand im Code schon (`beschaedigterEntwurf`); die Karte nennt jetzt das Datum. Der Rohtext bleibt bis dahin im Speicher. |
| R6-D6 | behoben | Namen in der „Entfernt“-Quittung mit Semikolon getrennt, die Datumsform der Papierkörbe ist einheitlich (zweistellig). |
| R6-D7 | behoben | Ein Sprung ab 30 Tagen wird gehalten und gefragt, wenn dabei eine Sammlung fällig würde, die beim letzten Start noch nicht angekündigt war (`geraeteuhrPruefen`, Unit-Test). |
