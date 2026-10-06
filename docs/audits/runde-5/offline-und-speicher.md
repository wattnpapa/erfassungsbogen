# Audit Runde 5 – Offline und Speicher (Erstladen, Funkloch, Netzwechsel, voller und gesperrter Speicher, zwei Fenster, Sicherung, Exporte und Importe ohne Netz)

Stand: 06.10.2026 · Code-Stand: Commit `c0cbae0` (der Code entspricht `4fcdbaf`) · Prüfer: Rollenaudit
`thw-offline-resilience-reviewer`

Reiner Prüfbericht, keine Codeänderung. In Runde 4 war diese Prüfung nach zwei Befunden abgebrochen worden; der Bericht
war unvollständig. Diesmal ist die ganze Rolle geprüft: Erstladen, Offline-Betrieb, Funkloch, Netzwechsel, Speicher voll
oder gesperrt, Zwei-Fenster-Betrieb, Sicherung, Exporte und Importe ohne Netz, die Anzeige „gespeichert“ und die
Offline-Zeile.

## Prüfaufbau

- **Eigener Server aus demselben `dist/`:** `vite preview` auf Port 4175 (nicht gebaut, der gemeinsame Server auf Port
  4173 blieb unberührt und wurde nicht angefasst). Für die gedrosselten Läufe davor ein eigener Reverse-Proxy (Port
  4176) nach dem Vorbild aus Runde 4. Er drosselt die **gesamte** Leitung, auch die Abrufe des Service Workers
  (`setOffline` und die CDP-Drosselung erfassen den Service Worker nicht). Drei Lagen: *normal* (hier 1,6 bis
  3,2 Mbit/s, 200 bis 300 ms Latenz), *Funkloch* (Verbindung wird angenommen, aber nie beantwortet) und *weg*
  (Verbindung wird sofort abgewiesen). Beim Rückschalten auf *normal* reißt der Proxy die hängenden Verbindungen ab,
  wie ein Netz, das nach dem Funkloch wieder da ist.
- **Echtes Offline:** eigener Server gestoppt (Verbindung abgewiesen), zusätzlich `setOffline`, um die Ereignisse
  `online`/`offline` auszulösen. Die Lage „Browser glaubt sich online, die Leitung liefert nichts“ (Funkloch mit
  Balken) mit dem Proxy auf *Funkloch*.
- Playwright aus `node_modules`, Chromium `/opt/pw-browsers/chromium`, `isMobile`/`hasTouch`, Locale de-DE,
  360 × 640, Pixeldichte 2, je Prüfung ein frischer Browser-Kontext. Für die Laufzeit der Sammel-PDF CPU über
  `Emulation.setCPUThrottlingRate` auf ein Viertel.
- **Zustände** per `localStorage`-Seeds (`eeb.entwurf.v1`, `eeb.einsaetze.v1`, `eeb.vorlagen.v1`) aus `examples/thw/`,
  alle mit `uebung: false`: Entwurf 001 Albstadt (Schritt 2), Sammlung „Hochwasser Neckar“ mit 3, 5, 12 und 30 Bögen,
  eine Vorlage „Mein OV“ aus 006.
- **Speicher voll:** (1) echt gefüllt, bis `localStorage` selbst `QuotaExceededError` wirft (Anzeige „5 von 5 Mio.
  Zeichen“); (2) Stub, bei dem jedes `setItem` `QuotaExceededError` wirft; (3) Stub mit `SecurityError` bei jedem
  `setItem`; (4) schon der Zugriff auf `localStorage` wirft `SecurityError` (blockierte Website-Daten).
- **Geräteuhr:** Verschiebung von `Date` per Init-Skript um +400 und −400 Tage, gespeicherter Uhrstand
  (`eeb.uhr.v1`) für 45 und 100 Tage Pause.
- **Zwei Fenster:** zwei Seiten im selben Kontext (gleicher `localStorage`), offline.
- Getestet habe ich zuerst ohne Blick in frühere Berichte. Die Berichte aus Runde 3 und 4 und die übrigen
  Runde-5-Berichte habe ich erst danach gelesen. Was dort schon steht, nenne ich nur als Verweis.
- Skripte und Bildschirmfotos: Scratchpad `runde5/offline/` (nicht im Repo). Die Bildschirmfotos habe ich angesehen.

**Nicht prüfbar:**

- Kamera-Scan und Nahbereichs-Weitergabe (keine Kamera, kein zweites Gerät); Teilen-Dialog des Telefons.
- Die echte Domain `erfassungsbogen.app`: Ein geteilter Link zeigt dorthin. Ich habe ihn auf `localhost` umgeschrieben
  und nur gezeigt, dass er ohne Netz aus dem Service Worker aufgeht. Wie der Empfänger ohne vorherigen Besuch dasteht,
  ist hier nicht prüfbar (Hinweis steht laut Runde 3 am Knopf).
- Echter Flugmodus, echte Funkzelle, Netzwechsel WLAN–Mobilfunk mit Radio: Der Proxy bildet das Verhalten der Leitung
  nach, nicht des Funkmoduls.
- Echte CPU eines Mittelklasse-Telefons (nur 4-fach gedrosselt); Speicherräumung durch Safari/iOS; Privatmodus älterer
  Safari-Versionen (nur Stubs); Entscheidung des Browsers über „dauerhaften Speicher“.
- Das Update-Banner bei einer neuen Fassung (dafür wäre ein zweiter Build nötig) und die Update-Prüfung der
  Android-App.
- Die nativen Builds (Android, iOS, Electron).
- Ungedrosselte Erstladezeit: Auf dem Server liefen gleichzeitig andere Prüfer, deshalb nur die gedrosselten Zeiten
  über den eigenen Proxy (sie hängen an der Bandbreite).

## Urteil

Die Behebungen aus Runde 4 tragen. Bricht das Erstladen im Funkloch ab, registriert die App den Service Worker neu und
läuft nach der Netzrückkehr ohne Neuladen bis „✓ Jetzt offline bereit“ durch (R4-O1). Fehlt beim „PDF erzeugen“ der
Baustein, steht die Meldung mit dem Ausweg „nur der QR-Code“ im Bild, direkt unter dem Knopf (R4-O2). Die Geräteuhr
wird am ersten Tag geprüft, nichts wird gelöscht, die Warnung steht auf der Startseite. Ein Speicherfehler steht auf
der Startkarte und im Assistenten.

Nach dem ersten vollständigen Laden arbeitet die App ohne Netz ohne Lücke: Neuladen offline, Entwurf fortsetzen,
Bogen-PDF, QR-Vollbild, „Link teilen“, Lageblatt, Blanko-Vordruck, beide CSV, Excel-Liste, Sammel-PDF, Datensicherung
erstellen und einspielen, „Aus Datei laden“, „Einsatz importieren…“, Beispielbögen und Themenseiten gingen offline.
Ein voller oder gesperrter Speicher wird gemeldet, die Eingabe bleibt offen, das Schließen fragt nach. Zwei Fenster
überschreiben sich nicht still. Die Offline-Zeile sagt nichts Falsches, solange der Vorrat nicht vollständig ist.

Reibung bleibt an drei Stellen, alle P2. **Erstens** steht die Warnung „Nicht gespeichert“ im Kopf, der mit der Seite
wegscrollt. Wer mitten im Schritt tippt, sieht sie erst, wenn er nach oben scrollt oder „Weiter →“ drückt (R5-O1).
**Zweitens** gibt das Nachladen der Beispielbögen und Themenseiten beim ersten Fehler auf. Bei flackerndem Netz steht
der Zähler minutenlang bei „werden nachgeladen (25 von 474)“, obwohl nichts mehr geladen wird (R5-O2). **Drittens**
braucht „Einsatz weitergeben / sichern“ bei 30 Bögen 18 s ohne jede Rückmeldung, der Knopf bleibt frei, und ein
zweiter Tipp erzeugt eine zweite Datei (R5-O3). Dazu kommen vier Stellen mit P3.

Die Aufgaben „offline weiterarbeiten, sichern, übergeben, empfangen“ gelingen ohne fremde Hilfe.

## Befunde

P0: keine. P1: keine. P2: drei. P3: vier.

### P2

#### R5-O1 – Speicherfehler beim Tippen mitten im Schritt: „Nicht gespeichert“ steht im Kopf und ist nicht im Bild (gemessen)

- **Kennzeichnung:** gemessen (Lage der Meldung bei `scrollY` 715; beide Fälle mit Stub und mit echt vollem
  Speicher).
- **Fundstelle:** Assistent, Kopfbalken mit der Speicherzeile und der Warnung; `src/app/app.tsx` (Block um Zeile
  3579 bis 3590, `speicherFehler`), Warnung nicht klebend. Zum Vergleich: Die Konfliktwarnung der zwei Fenster
  (`src/app/fenster-abgleich.tsx`) ist am oberen Bildrand festgesetzt.
- **Beobachtung:** Entwurf 001, Schritt 3 „Personal“, Speicher voll (Stub für alle Schreibzugriffe oder echt bis zum
  letzten Zeichen gefüllt). Der Helfer scrollt zu „Person 1“ und tippt den Nachnamen. Die Meldung „⚠ Nicht gespeichert
  — … Der Bogen bleibt geöffnet; bitte jetzt „Bogen übergeben“ (PDF) …“ steht im Kopf. Sie liegt bei `y` = −657 px
  (Fenster 640 px hoch, `scrollY` 715), ist also nicht im Bild. Im Bild steht nur das Feld mit dem getippten Text,
  darunter „Weiter →“ (Bildschirmfoto `t5d-feld.png`). Erst „Weiter →“ springt zum Seitenanfang und zeigt die Warnung
  (`t5d-weiter.png`). Im Normalfall gilt dasselbe für „✓ gespeichert · 12:04 Uhr · nur auf diesem Gerät“: Man sieht
  sie nur am Seitenanfang. Beim echt vollen Speicher kommt am Ende „⚠ Nicht gespeichert … Letzter gesicherter Stand:
  11:51 Uhr“, ebenfalls nur im Kopf (`t5-echtvoll-2-getippt.png` zeigt die Seite ohne Kopf). Die Konfliktwarnung der
  zwei Fenster steht dagegen bei `y` = 8 px, auch bei `scrollY` 466 (`t10-B-getippt.png`).
- **Folge:** Der Helfer erfasst 40 Personen im Schritt „Personal“ und glaubt, die App sichere mit, wie sie es sonst
  tut. Dass der Speicher nichts mehr annimmt, merkt er erst beim Weiterschalten oder beim Hochscrollen. Bis dahin
  hängt sein Stand nur am offenen Fenster; Neuladen oder ein Anruf, der die App aus dem Speicher wirft, kostet alles
  seit dem letzten gelungenen Speichern. Die Meldung ist richtig und deutlich, sie steht nur an der falschen Stelle.
- **Empfehlung:** Dieselbe Behandlung wie bei der Konfliktwarnung: Bei „Nicht gespeichert“ eine kurze, im Bild
  festgesetzte Zeile („⚠ Nicht gespeichert — Speicher voll“), mit Weg zu den Einzelheiten.
- **Nachprüfung:** Stub oder vollen Speicher einstellen, in Schritt 3 zur dritten Person scrollen und tippen: Die
  Warnung ist ohne Scrollen sichtbar, solange der Speicher nicht annimmt, und verschwindet, wenn wieder gespeichert
  wird.

#### R5-O2 – Das Nachladen der Beispielbögen und Themenseiten gibt beim ersten Fehler auf; die Zeile sagt weiter „werden nachgeladen“ (gemessen, 2 von 3 Läufen; Ursache im Code)

- **Kennzeichnung:** gemessen (vier Läufe); der Hang bei einem Abruf ohne Antwort ist ein Risiko aus dem Code.
- **Fundstelle:** Startseite, Offline-Zeile; `src/app/offline-vorrat.ts`, `zusatzNachladen()` (in der Schleife
  `catch { netzWeg = true; }`, alle vier Arbeiter enden), angestoßen in `src/app/offline-bereit.ts` nur durch den
  Effekt mit den Abhängigkeiten `[stand, umfang, online]`.
- **Beobachtung:** Erstladen über 2 Mbit/s. Sobald der Kern da ist und die zweite Stufe läuft („Beispielbögen und
  Themenseiten werden nachgeladen (20 von 474)“), flackert die Leitung: fünfmal 10 s Funkloch, dazwischen 6 s Netz.
  Danach ist das Netz stabil. In drei von vier Läufen bleibt der Zähler stehen: im ersten Lauf (Flackern von Anfang an) bei 23 von 474, 311 s lang,
  im zweiten bei 25 von 474, 151 s lang ohne jede Bewegung, im dritten bei 117 von 474 (`navigator.onLine` blieb
  `true`, es kam kein `online`-Ereignis). Die Zeile sagt in dieser Zeit weiter „… werden nachgeladen (25 von 474)“. Ein
  Neuladen bringt in 15 s 293 von 474. Im vierten Lauf lief alles durch („✓ Funktioniert komplett offline“). Ein
  einzelnes Loch von 8 bis 12 s erholte sich in drei von vier Läufen von selbst; im vierten blieb der Zähler bei
  473 von 474 stehen, auch noch 6 s nach einem Neuladen. Der Fehlschlag des ersten Abrufs beendet die
  Schleife, ein erneuter Versuch kommt nur mit einem `online`-Ereignis oder einem Seitenaufruf. Ein Abruf, der nie
  beantwortet wird (echtes Funkloch mit Balken), hat im Code keine Zeitgrenze.
- **Folge:** Der Kern (Bogen, PDF, QR, Empfang) liegt im Gerät, daran ändert sich nichts. Es fehlen Beispielbögen und
  Themenseiten. Die Zeile verspricht aber „werden nachgeladen“ und zählt nicht weiter. Wer im Fahrzeug im Funkloch
  den Beispielbogen eines anderen Verbands öffnen will, liest „Dieser Beispielbogen liegt noch nicht auf dem Gerät“,
  obwohl er die Seite lange mit Netz offen hatte. Die Meldung ist ehrlich, der Vorrat hätte aber vollständig sein
  können.
- **Empfehlung:** Nach einem Fehlschlag in Abständen erneut versuchen, solange die Seite offen ist und `onLine` wahr
  ist. Hängende Abrufe mit Zeitgrenze abbrechen. Steht das Nachladen, sagt die Zeile das („pausiert, Netz
  unterbrochen“) statt „werden nachgeladen“.
- **Nachprüfung:** Wie oben: zweite Stufe starten, mehrmals Funkloch und Netz im Wechsel, danach stabiles Netz. Der
  Zähler läuft ohne Neuladen bis 474 von 474, oder die Zeile nennt den Stillstand.

#### R5-O3 – „Einsatz weitergeben / sichern“: 18 s ohne Rückmeldung bei 30 Bögen, der Knopf bleibt frei, ein zweiter Tipp erzeugt eine zweite Datei (gemessen)

- **Kennzeichnung:** gemessen (Zeit, Doppeldatei); CPU 4-fach gedrosselt, Seite eingefroren; die Dauer auf einem
  echten Telefon ist ein Risiko.
- **Fundstelle:** Einsatzansicht, „Einsatz weitergeben / sichern“; `src/app/app.tsx`, `sammelPdf()` (um Zeile 2850),
  `src/app/pdf.ts`, `einsatzPdfErzeugen()` (um Zeile 220: je Bogen ein QR-Code, dazu ein Probesatz).
- **Beobachtung:** Sammlung „Hochwasser Neckar“ mit 30 Bögen, offline. Nach dem Tipp ändert sich 1,5 s lang nichts:
  Knopf unverändert beschriftet und nicht gesperrt, keine Zeile „wird erstellt“ (`t9-30-1-wartet.png`). Die Datei
  kommt nach 18,2 s. Mit 4-fach gedrosselter CPU steht die Seite so lange, dass ein Bildschirmfoto nach 30 s
  abbricht. Zweimal getippt (12 Bögen, 2,5 s Abstand): zwei Downloads mit demselben Dateinamen
  (`eeb-einsatz-…_Hochwasser_Neckar.pdf`). Zum Vergleich: Beim Bogen-PDF steht sofort „PDF wird erstellt…“.
- **Folge:** „Einsatz weitergeben / sichern“ ist der Weg, die ganze Lage für die Ablösung oder das Archiv aus dem
  Gerät zu bekommen. Wer nach einigen Sekunden ohne Reaktion noch einmal tippt, hat zwei gleiche Dateien (ob der
  Exportvermerk dabei doppelt zählt, habe ich nicht geprüft). Wer die Seite für hängend hält und neu lädt, bricht die Sicherung ab.
- **Empfehlung:** Knopf während der Erzeugung sperren und beschriften („wird erstellt …“), wie beim Bogen-PDF. Bei
  großen Lagen einen Fortschritt nennen („17 von 30 Bögen“).
- **Nachprüfung:** Sammlung mit 30 Bögen, Knopf zweimal schnell tippen: sofort sichtbarer Zustand am Knopf, eine
  Datei.
- **Verweis:** Gleiche Ursache, anderer Knopf: Bogen-PDF beim Großbogen in `feldtauglichkeit.md` (R5-H4), Blanko-
  Vordruck und Lageblatt in `nacht-und-sicht.md` (R5-L4). Die Sammel-PDF wird dort an diese Stelle verwiesen.

### P3

#### R5-O4 – Themenseiten sind offline da, ihre Fotos nicht: leere Fläche mit Bildtext (beobachtet)

- **Kennzeichnung:** beobachtet.
- **Fundstelle:** `thw.html`, `feuerwehr.html`, `drk.html` und die anderen Themenseiten, `anleitung.html`; Vorrat in
  `vite.config.ts` / `scripts/precache-aufteilung.ts` (`offline-zusatz.json` enthält die Beispielbögen und Seiten,
  aber nicht `bilder/*.jpg|webp` und `screenshots/*`).
- **Beobachtung:** Nach vollständigem Laden („✓ Funktioniert komplett offline“), Server aus: Die Seiten gehen auf
  (Status 200), aber je Seite fehlt ein Bild: `bilder/thw-gkw-radolfzell.jpg`, `bilder/feuerwehr-loeschfahrzeug-…`,
  `bilder/drk-rettungswagen-…`, auf `anleitung.html` `screenshots/start-breit.png`. Es bleibt eine weiße Fläche von
  rund 490 px Höhe mit dem Symbol eines fehlenden Bildes und dem Bildtext (`t25-thw-bild.png`). Die Anfragen scheitern
  mit `ERR_CONNECTION_REFUSED`.
- **Folge:** Gering. Der Text ist da, ein Bildschirm voll weißer Fläche mit Fehlersymbol wirkt aber wie ein Defekt.
  Die Zusage „Themenseiten … komplett offline“ stimmt im Wortsinn.
- **Empfehlung:** Die Fotos in die zweite Stufe aufnehmen, oder die Fläche so setzen, dass ein fehlendes Bild keinen
  Platz einnimmt.
- **Nachprüfung:** Vollständig laden, offline `thw.html` öffnen: Das Foto ist da, oder es bleibt keine leere Fläche.

#### R5-O5 – „Geräteuhr prüfen“ warnt auch dann, wenn die Uhr jetzt stimmt: nach langer Pause und nach einer zuvor zu früh gehenden Uhr (gemessen)

- **Kennzeichnung:** gemessen.
- **Fundstelle:** Startseite, `src/app/uhr-warnung.tsx`, `src/app/datenschutz-uhr.ts` (`geraeteuhrPruefen`,
  `UHR_SPRUNG_TAGE = 60`).
- **Beobachtung:** Vier Läufe, jeweils ein Start mit echter Uhr (zuletzt) nach dem genannten Vorlauf:
  - 45 Tage Pause: keine Warnung.
  - 100 Tage Pause (Uhr stimmt): „⚠ Geräteuhr prüfen: Das Gerät zeigt den 06.10.2026, beim letzten Start war der
    28.06.2026. Bis das geklärt ist, löscht und anonymisiert die App nichts. Datum falsch? In den
    Geräteeinstellungen korrigieren. …“ Die Sammlung bleibt.
  - Uhr zuerst 400 Tage zu früh (kein Hinweis, „gespeichert 06.10., 12:05 Uhr“ steht in der Zukunft), dann korrigiert:
    Beim nächsten Start „Das Gerät zeigt den 06.10.2026, beim letzten Start war der 01.09.2025 …“, obwohl die
    Uhr jetzt richtig geht. Der Uhrstand wurde beim Start mit der falschen Uhr auf 2025 gesetzt.
  - Zum Vorwärtssprung (+400 Tage): Die Warnung kommt, nichts wird gelöscht, auch beim zweiten Start nicht. Das
    hält (siehe Abgleich).
- **Folge:** Die Meldung schickt den Helfer in die Geräteeinstellungen, wo nichts zu korrigieren ist. Der echte Fall
  „Funkloch, nach dem Netz stellt sich die Uhr von selbst richtig“ trifft genau die dritte Zeile. Dass die Fristen am
  Folgetag trotzdem greifen, ist Gegenstand von R5-D1.
- **Empfehlung:** Die Meldung für beide Richtungen und für lange Pausen neutral formulieren („Zwischen den beiden
  Starts liegen 100 Tage. Stimmt das Datum heute? Dann nichts tun“) und nicht nur den Fall „Datum falsch“ nennen.
- **Nachprüfung:** Uhr 400 Tage zurück starten, dann normal starten: Die Meldung nennt beide Möglichkeiten.
- **Verweis:** Folgen am nächsten Tag und Sicherung mit altem Uhrstand: `zerstoerende-handlungen.md` (R5-D1,
  R5-D4); Wortlaut bei echter Pause auch in `neuer-nutzer.md`. Hier nicht doppelt gezählt ist nur der Teil „Uhr
  rückwärts, dann korrigiert“.

#### R5-O6 – Sammlung im anderen Fenster in den Papierkorb gelegt: Das offene Fenster springt wortlos auf die Startseite (beobachtet)

- **Kennzeichnung:** beobachtet.
- **Fundstelle:** `src/app/fenster-abgleich.tsx`, Abgleich der Sammlungen über das `storage`-Ereignis.
- **Beobachtung:** Zwei Fenster offline, beide in der Einsatzansicht „Hochwasser Neckar“. Fenster A: „Einsatz
  löschen…“ → „In den Papierkorb“. Fenster B zeigt danach ohne Zutun die Startseite. Eine Meldung, was geschehen ist,
  gibt es nicht (`t19-B-nach.png`); in der Fußzeile steht „Papierkorb (1)“. Im Speicher liegt die Sammlung mit
  allen drei Einträgen im Papierkorb, nichts ist verloren.
- **Folge:** Gering. Wer in B gerade Einheiten aufnahm, sieht die Lage verschwinden und weiß nicht, ob die App
  abgestürzt ist. Die Rückholung ist möglich, aber unbekannt.
- **Empfehlung:** In B einen Satz zeigen: „Die Sammlung wurde in einem anderen Fenster in den Papierkorb gelegt.“,
  mit Weg zum Papierkorb.
- **Nachprüfung:** Wie oben; B nennt die Ursache.

#### R5-O7 – Blockiert der Browser den Speicher ganz, steht auf der Startseite nur „Alle Daten bleiben auf diesem Gerät“; die Warnung kommt erst im Bogen (beobachtet)

- **Kennzeichnung:** beobachtet (Stub: schon der Zugriff auf `localStorage` wirft `SecurityError`).
- **Fundstelle:** Startseite, Offline-Zeile (`src/app/offline-bereit.ts`, Text endet auf „Alle Daten bleiben auf
  diesem Gerät.“); Warnung `SpeicherNimmtNichtsAn` nur dort, wo gelesen oder gespeichert wurde.
- **Beobachtung:** Startseite und alle Knöpfe erscheinen, ohne Warnung. „Neuen Bogen erstellen“ zeigt sofort „⚠
  Nicht gespeichert — dieser Browser lässt die App nichts speichern (etwa im privaten Modus …)“ mit Hinweis auf „Bogen
  übergeben“. Der Bogen bleibt offen und nutzbar. Mit schreibgesperrtem Speicher und vorhandenem Entwurf steht die
  Warnung dagegen schon auf der Startkarte.
- **Folge:** Gering. Wer im Privatmodus nur die Startseite liest, hört „Alle Daten bleiben auf diesem Gerät“, ohne
  dass etwas auf dem Gerät bleibt. Der Fehler erscheint, bevor Daten verloren gehen können.
- **Empfehlung:** Ist der Speicher nicht lesbar, die Offline-Zeile um den Satz ergänzen oder ersetzen („Dieser Browser
  speichert nichts — Eingaben gehen beim Schließen verloren“).
- **Nachprüfung:** Zugriff auf `localStorage` sperren, Startseite öffnen: Die Zeile nennt die Sperre.

## Bestätigtes

- **R4-O1 trägt:** Erstladen mit 3,2 Mbit/s, bei 1,0 MB 40 s Funkloch (Verbindungen hängen, Zeile „0,7 von 6,8 MB“).
  Nach der Netzrückkehr (Verbindungen werden abgerissen) steht nach 5 s „⚠ Laden abgebrochen bei 0,7 von 6,8 MB — mit
  Netz einmal neu laden, dann geht es weiter …“ mit Knopf „Jetzt neu laden“ (`t1-3.png`), nach 8 s läuft der Zähler
  weiter (1,6, 4,0, 6,6 von 6,8 MB), rund 18 s nach der Netzrückkehr ist „✓ Jetzt offline bereit“
  erreicht, nach 61 s „✓ Funktioniert komplett offline“, beides ohne Neuladen. Die Registrierung ist danach aktiv.
- **Erstladen gedrosselt (Proxy, 1,6 Mbit/s, 300 ms):** Startseite bedienbar nach 2,4 s; Fortschritt ab 3,7 s („0,0
  von 6,8 MB“, dann in 0,1-MB-Schritten); „✓ Jetzt offline bereit für Bogen, PDF, QR-Code und Empfang“ nach 41,5 s
  (2,84 MB über die Leitung); „✓ Funktioniert komplett offline“ nach 80,7 s (3,85 MB, 568 Anfragen).
- **Kaltstart ohne Netz:** Neuladen offline: Startseite, Entwurfskarte, „Fortsetzen“. Anleitung, Datenschutz, Impressum,
  `thw.html`, `vorlage.html` kommen mit Status 200 aus dem Service Worker. Eine unbekannte Seite (`gibtsnicht.html`)
  zeigt offline die Fehlerseite des Browsers statt der eigenen 404-Seite (die Seitenumleitung des Service Workers
  nimmt `.html`-Adressen aus, siehe `navigateFallbackDenylist`).
- **Offline arbeiten und exportieren (mit vollem Vorrat, Server aus):** Bogen-PDF (2,5 s, „PDF erzeugt 11:54 Uhr —
  Empfang nicht bestätigt“), QR-Vollbild mit Einheit, Stärke und Stand, „Link teilen“ („Link kopiert 12:35 Uhr —
  Empfang nicht bestätigt“; der Link geht ohne Netz auf), Lageblatt (1,3 s), Blanko-Vordruck (0,2 s), „Übersicht als
  CSV“, „Alle Daten als CSV“, Excel-Liste „Oldenburg“, Sammel-PDF (siehe R5-O3). Keine Konsolenfehler, keine
  fehlgeschlagene Anfrage außer den Fotos (R5-O4).
- **Importe offline:** „Aus Datei laden“ mit einem Beispielbogen geht. Eine abgeschnittene JSON-Datei meldet
  „… ist beschädigt oder unvollständig (etwa nach abgebrochener Übertragung) …“. „Einsatz importieren…“ mit dem
  Sammel-PDF der App geht.
- **Datensicherung offline:** „Sicherung erstellen…“ (23 KB, „Letzte Sicherung auf diesem Gerät erstellt: 06.10.26,
  12:06 Uhr“), „Sicherung einspielen…“ in ein leeres Gerät (Rückfrage zählt auf, was verloren geht; danach Entwurf,
  Sammlung und Vorlagen da). Eine kaputte, eine fremde und eine abgeschnittene Datei werden abgewiesen, die Meldung
  steht direkt unter dem Knopf, die vorhandenen Daten bleiben unverändert.
- **Ohne Baustein, ohne Netz (Seite ohne Service Worker):** Jeder Knopf nennt die Lage: „Lageblatt: Der Baustein
  dafür ließ sich nicht nachladen. Dafür braucht die App einmal Netz …“. CSV geht, QR-Vollbild geht, die Meldung zu
  „PDF erzeugen“ steht im Bild, direkt unter dem Knopf, bei `y` 527 bis 623 px (R4-O2).
- **Beispielbögen mit unvollständigem Vorrat:** Der Eintrag zeigt „nicht geladen“, „Anzeigen“, „PDF“ und „Link“
  melden „Dieser Beispielbogen liegt noch nicht auf dem Gerät …“, im Bild.
- **Anzeige „gespeichert“:** Im Bogen „✓ gespeichert · 12:04 Uhr · nur auf diesem Gerät“. Ein älterer Entwurf trägt
  den Tag („gespeichert 06.10., 12:04 Uhr“). Die Startkarte zeigt dieselbe Zeit.
- **Speicher voll (echt gefüllt bis 5 von 5 Mio. Zeichen):** Startseite „⚠ Gerätespeicher ist voll: 100 % (5 von 5
  Mio. Zeichen) — die App kann nichts mehr speichern …“. Im Assistenten „⚠ Nicht gespeichert — der Speicher dieses
  Geräts ist voll … Letzter gesicherter Stand: 11:51 Uhr.“, die Eingabe bleibt offen, nach dem Neuladen steht der
  letzte gespeicherte Stand. „In Einsatz übernehmen“ bei vollem Speicher: Meldung „Nicht gespeichert — der Speicher
  dieses Geräts ist voll. Die Erfassung bleibt geöffnet …“, die Sammlung bleibt bei 3 Einträgen. Gesperrt (nur
  `SecurityError` beim Schreiben): „… dieser Browser lässt die App nichts speichern …“, auch auf der Startkarte
  („Beim Schließen gehen die Änderungen verloren — jetzt „Fortsetzen“ und „Bogen übergeben“ …“). Mit dem
  Stub `QuotaExceededError` bei jedem Schreibzugriff steht ebenfalls die Sperr-Meldung, weil die App den Fehler mit
  einem kleinen Probeschreiben unterscheidet; mit echt vollem Speicher steht richtig „voll“.
- **Zwei Fenster, ein Bogen:** Fenster B meldet nach dem Tippen in A: „⚠ Dieser Bogen wurde in einem anderen
  Fenster geändert (dort: „THW Albstadt Zugtrupp Technischer Zug“, Stand 06.10.26, 12:04 Uhr). Eingaben hier werden
  erst wieder gespeichert, wenn du entscheidest. …“ mit „Stand aus dem anderen Fenster laden“ und „Meine Fassung
  behalten“, am oberen Bildrand festgesetzt. Im Speicher bleibt Fassung A, B überschreibt nichts.
- **Geräteuhr, Vorwärtssprung:** +400 Tage: Warnung „Gerät zeigt den 10.11.2027, beim letzten Start war der
  06.10.2026“, Sammlung, Vorlage und Entwurf bleiben, auch beim zweiten Start mit dem Sprung. Die Uhr danach
  wieder normal: Warnung weg, Daten da.
- **Keine Fremdanfragen:** Beim Start mit vollem Vorrat gehen nur `/` und `/offline-zusatz.json` an den Server.

## Abschluss

- **Aufgabe geschafft:** ja. Mit Umwegen nur beim Speicherfehler im laufenden Schritt (R5-O1) und beim
  Sammel-PDF (R5-O3).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „… werden nachgeladen (25 von 474)“: Die Zeile verspricht Arbeit, die schon
  aufgegeben ist (R5-O2).
- **Größtes Einsatzrisiko:** Bei vollem Speicher tippt der Helfer mitten im Schritt weiter, und die Warnung steht
  außer Sicht im Kopf (R5-O1).
- **Top-Priorität für die nächste Iteration:** „Nicht gespeichert“ im Bild festsetzen wie die Konfliktwarnung der
  zwei Fenster (R5-O1). Danach das Nachladen der zweiten Stufe wiederholen lassen (R5-O2).

## Abgleich mit Runde 4

Grundlage: [../runde-4/offline-und-speicher.md](../runde-4/offline-und-speicher.md) samt „Stand der Behebung“ und
[../runde-4/README.md](../runde-4/README.md). Der Runde-4-Bericht war unvollständig; er kannte nur R4-O1 und R4-O2.
Die weiteren hier geprüften Behebungen stammen aus dem Paket 4 („Uhr, Speicher, Löschen, Offline, Zeiten“) und aus
dem Bericht zu Fehlern und Wiederanlauf.

| Behebung aus Runde 4 | Stand laut Bericht | Bewertung Runde 5 | Beobachtung |
| --- | --- | --- | --- |
| R4-O1 Erstladen bricht ab, Zeile bleibt bei „wird geladen“ | behoben | hält, mit Rest | Neu-Registrierung trägt (siehe Bestätigtes): 5 s bis „Laden abgebrochen“ mit „Jetzt neu laden“, 8 s bis der Zähler weiterläuft, kein Neuladen nötig. Rest: Bei flackerndem Netz bleibt „⚠ Laden abgebrochen … mit Netz einmal neu laden“ bis zu 53 s stehen, während die App ihn schon selbst weiterlaufen lässt (gemessen, 71 bis 124 s). Die Aufforderung ist dann überholt, aber harmlos. Das Nachladen der zweiten Stufe hat den entsprechenden Mechanismus nicht (R5-O2). |
| R4-O2 „PDF erzeugen“ ohne Baustein: Meldung außer Sicht | behoben | hält | Meldung bei `y` 527 bis 623 px, nennt den QR-Code als Ausweg, kommt einmal vor. Auch „Lageblatt“, „Blanko-Vordruck“, „Excel-Liste“ und „Einsatz weitergeben“ melden den fehlenden Baustein in der Einsatzansicht mit Text (nicht auf Lage im Bild geprüft). |
| R4-D1 Geräteuhr: Korrektur (Paket 4) | behoben | hält am ersten Tag, mit zwei Resten | +400 Tage: Warnung, nichts gelöscht, auch beim zweiten Start. Rest 1: falsche Warnung bei langer Pause und nach einer zuvor zu früh gehenden Uhr (R5-O5). Rest 2, nicht von mir gemessen: Am Folgetag wird der Sprung übernommen und die Sammlung gelöscht (R5-D1). |
| R4-E5 Speicherfehler auf der Startkarte | behoben | hält | Gesperrter Speicher und Entwurf: Karte zeigt „⚠ Nicht gespeichert … Beim Schließen gehen die Änderungen verloren — jetzt „Fortsetzen“ und „Bogen übergeben““. Voller Speicher: Startseite „Gerätespeicher ist voll“. Gilt nicht, wenn der Zugriff auf den Speicher ganz gesperrt ist und kein Entwurf da ist (R5-O7). |
| R4-S4 Zwei Fenster: Warnung nennt den anderen Stand, „Meine Fassung behalten“ legt ihn auf den Rückholplatz | behoben | hält (Warnung), Wahl nicht durchgespielt | Warnung mit neuem Wortlaut und beiden Knöpfen, festgesetzt am oberen Bildrand. Die Entscheidung selbst habe ich nicht ausgeführt. Neu und kleiner: kein Hinweis, wenn das andere Fenster die Sammlung in den Papierkorb legt (R5-O6). |
| R4-L1 „✓ gespeichert · … · nur auf diesem Gerät“ | behoben | hält | Text steht im Assistenten (Abschneiden im Feld-Modus: R5-L2). Sichtbarkeit der Zeile beim Tippen: R5-O1. |

Am Rand die Runde-3-Behebungen, die ich mitgesehen habe: R3-O3 (zweistufiger Vorrat mit Fortschritt) hält, hat aber
die Nebenwirkung R5-O2. R3-O4 (gesperrter Speicher heißt „gesperrt“, bei 100 % „ist voll“) hält. R3-O1 und R3-O2
(volle Sammlung beim Einlesen, Rückschreiben beim Lesen) habe ich nicht eigens nachgemessen.

Bilanz: Keine Behebung hat sich ins Gegenteil verkehrt. Zwei wirken mit einem Rest (R4-O1, R4-D1), die übrigen
halten. Neu sind R5-O1 bis R5-O7. Nur als Verweis geführt (nicht gezählt): R5-H4, R5-L4 (gleiche Ursache wie R5-O3 an
anderen Knöpfen), R5-D1, R5-D4 (Uhr und Sicherung), R5-L2 (Speicherzeile abgeschnitten), R5-S4 (Konfliktwarnung
verdeckt das Feld), R5-E7 (Stärke ändern bei vollem Speicher).
