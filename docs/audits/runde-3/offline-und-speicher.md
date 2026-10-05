# Audit „Offline und Speicher", Runde 3 (Funkloch, Kaltstart ohne Netz, voller und gesperrter Speicher)

Stand: 04.10.2026 · Prüfer: Rollenaudit `thw-offline-resilience-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild mit Service Worker (`vite preview`,
Port 4173), Zweig `claude/gifted-cray-ngieaz`, Commit 33ed426.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-2-Befunde. Die Commits nach 33ed426 ändern nur Prüfberichte unter
`docs/audits/runde-3/`. `src/`, `vendor/` und der laufende Build sind
unverändert.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, Pixeldichte 2.
Jeder Durchgang lief in einem eigenen, frischen Browser-Kontext mit
erlaubtem Service Worker. Den Netzausfall habe ich über `context.setOffline`
nachgestellt. Für schwaches Netz habe ich über CDP
(`Network.emulateNetworkConditions`) 400 ms Latenz und 1,6 Mbit/s
eingestellt, das entspricht etwa „Fast 3G“. Für Laufzeitmessungen habe ich
die CPU über `Emulation.setCPUThrottlingRate` auf ein Viertel gedrosselt.

Die Zustände kamen aus `localStorage`-Seeds aus `examples/thw/`, alle mit
`uebung: false`:

- `eeb.entwurf.v1`: 001 Albstadt ZTr TZ, Schritt 3. Für die Prüfung der
  Zeitangabe zusätzlich mit einem Stand von vor drei Tagen.
- `eeb.einsaetze.v1`: Sammlung „Hochwasser Neckar“ mit acht Bögen (001–008).
  Für den vollen Speicher kam eine zweite Sammlung „Großschadenslage
  Archiv“ dazu, bis an die Grenze von 5 242 860 Zeichen gefüllt
  (1 802 Einträge). Für die Laufzeit gab es drei Größen: 23 000,
  1,18 Mio. und 4,93 Mio. Zeichen.
- `eeb.vorlagen.v1`: eine Vorlage aus 002.

Den vollen Speicher habe ich auf drei Arten erzeugt:

1. **Echt gefüllt:** echte Sammlungsdaten bis zum letzten Zeichen.
2. **Stub für wachsende Schreibzugriffe:** `Storage.prototype.setItem` wirft
   `QuotaExceededError`, sobald `eeb.einsaetze.v1` oder `eeb.vorlagen.v1`
   länger würde. So verhält sich ein voller Speicher, ohne dass die App die
   Füllmenge sieht.
3. **Stub für jeden Schreibzugriff:** `setItem` wirft immer. Das entspricht
   einem gesperrten Speicher oder einem Speicher mit Quote 0.

Dazu kam ein Durchgang, in dem schon der Zugriff auf `localStorage` einen
`SecurityError` wirft, wie bei blockierten Website-Daten.

Getestet habe ich zuerst ohne Blick in frühere Berichte. Den
Runde-2-Bericht, die Tabelle „Stand der Behebung“ und die vorliegenden
Runde-3-Berichte habe ich erst danach gelesen.

Rolle: Helfer, der nicht mit Netz rechnet. Er will weiterarbeiten und wissen,
was mit seinen Eingaben passiert. Die App hat keinen Server, deshalb heißt
„angekommen“ hier: Die Gegenstelle hat QR, Link oder Datei eingelesen, und
der eigene Stand liegt sicher im Gerätespeicher. Szenarien:

1. **Erstbesuch:** einmal ungedrosselt und einmal mit „Fast 3G“. Ich habe
   die Zeit bis „Jetzt offline bereit“, die Zahl der Cache-Einträge und die
   Größe gemessen. Dann gedrosselt geladen und vor der Bereitschaft
   offline gegangen, weitergearbeitet und neu geladen.
2. **Kaltstart ohne Netz:** Neuladen offline. Danach Startseite,
   „Fortsetzen“, Assistent, Übergabe (PDF, Link, QR-Vollbild),
   Einsatzansicht mit Lageblatt, beiden CSV, Excel-Liste „Oldenburg“,
   „Einsatz weitergeben / sichern“, Beispielbögen, Datensicherung sowie
   die Begleitseiten und der Blanko-Vordruck.
3. **Abbruch mitten im Tippen:** Text eintippen und sofort neu laden, ohne
   das Feld zu verlassen.
4. **Zwei Zustände:** derselbe Entwurf in zwei Tabs, dieselbe Sammlung in
   zwei Tabs mit „Abrücken“ in beiden.
5. **Voller Speicher:** Eingabe im Assistenten, Bogen in eine Sammlung
   ablegen, „Als Vorlage speichern“, „Neue Einsatz-Sammlung…“, Link-Empfang
   am Meldekopf, „Abrücken“, „Bögen einlesen…“ mit zwei PDFs der App. Danach
   den Tab mit nicht gespeicherter Eingabe schließen.
6. **Gesperrter Speicher:** Start, „Fortsetzen“, „Öffnen“ einer Sammlung,
   „Neuen Bogen erstellen“.
7. **Laufzeit mit großer Sammlung:** Start, Öffnen und Abrücken bei den drei
   Sammlungsgrößen, CPU auf ein Viertel gedrosselt. Ich habe gezählt, wie
   oft und wie viel die App in den Speicher schreibt.

**Nicht prüfbar:**

- Kamera-Scan, auch der Stapel-Scan aus Bildern, und Nahbereichs-Weitergabe
  (keine Kamera, kein zweites Gerät).
- Die echte Domain `erfassungsbogen.app`.
- Die Speicherräumung durch Safari/iOS.
- Das Verhalten echter Browser bei Quote 0 (Privatmodus älterer
  Safari-Versionen). Hier habe ich nur den Stub geprüft.
- Das Update-Banner bei einer neuen Fassung (dafür wäre ein zweiter Build
  nötig).
- Die Sicherungs-Erinnerung nach drei Tagen (zeitabhängig).
- Echter Flugmodus und echte CPU eines Mittelklasse-Telefons. Die Drosselung
  ist eine Näherung.
- Die nativen Builds.

Die ungedrosselte Erstladezeit war nicht sauber messbar, weil andere Prüfer
denselben Server gleichzeitig nutzten. Ein Lauf ohne parallele Last ergab
4,6 s, ein Lauf unter Last 25,8 s. Die gedrosselte Messung hängt an der
Bandbreite und ist belastbar.

## Urteil

Nach dem ersten vollständigen Laden arbeitet die App ohne Netz vollständig.
Ich habe offline neu geladen, den Bogen fortgesetzt, ein PDF erzeugt, den
Link kopiert und den QR-Code im Vollbild gezeigt. Lageblatt, beide CSV,
Excel-Liste, Sammel-PDF, Datensicherung, Beispielbögen, Anleitung und
Blanko-Vordruck gingen ebenfalls offline. Es gab keine fehlgeschlagene
Anfrage und keinen Konsolenfehler. Die Offline-Zeile ist jetzt ehrlich: „⏳
Wird für den Offline-Betrieb geladen“, nach Abschluss einmal „✓ Jetzt
offline bereit“. Geht das Netz vorher weg, warnt sie: „ohne Netz diese
Seite nicht neu laden“. Ein Text, der eingetippt und sofort neu geladen
wird, bleibt erhalten. Zwei Fenster überschreiben sich nicht mehr still.
Beim vollen Speicher melden Assistent, Ablegen, Vorlage, neue Sammlung,
Abrücken und Link-Empfang den Fehler jetzt dort, wo gehandelt wurde. Die
Runde-2-Befunde sind damit im Kern behoben.

Reibung bleibt an drei Stellen. **Erstens** meldet „Bögen einlesen…“ bei
vollem Speicher „Keine Bögen in der Datei gefunden“. Die Datei ist in
Ordnung, nur der Speicher ist voll. Das ist die letzte Schreibstelle, die den
vollen Speicher verschweigt, und sie liegt am Meldekopf. **Zweitens**
schreibt die App bei jedem Lesen die ganze Einsatzliste zurück. Bei einer
großen Sammlung dauert der Start dadurch 10 s und jedes Abrücken fast 9 s.
Scheitert dieser Schreibzugriff, bleibt der Bildschirm leer. **Drittens**
dauert es bei schwachem Mobilfunk über eine Minute, bis die App offline
bereit ist. Ein Fortschritt wird dabei nicht angezeigt.

Die Aufgaben „offline weiterarbeiten, übergeben, empfangen“ gelingen ohne
fremde Hilfe. Bei vollem Speicher am Meldekopf gelingt das Einlesen von
Dateien nur mit Umweg, weil die Meldung auf die falsche Ursache zeigt.

## Befunde

### R3-O1 [P1] „Bögen einlesen…“ bei vollem Speicher: „Keine Bögen in der Datei gefunden“ statt „Speicher voll“ (neu, Rest von R2-O2)

**Priorität:** P1

**Nachweis:** gemessen mit dem Stub für wachsende Schreibzugriffe, offline.
Gegenprobe mit freiem Speicher. Zum Stapel-Scan aus Bildern nur ein Risiko
aus dem Code.

**Fundstelle / Aufgabe:** Einsatzansicht „Hochwasser Neckar“ → „Bögen
einlesen…“ → zwei PDFs der App: ein Einzel-PDF Albstadt und ein Sammel-PDF.
Code: `src/app/app.tsx`, `boegenAufnehmen()` (um Zeile 2147) und
`importiereBoegen()` (um Zeile 2170).

**Beobachtung:**

- Bei freiem Speicher kommt „9 Bögen aufgenommen. Die PDF enthält die
  vollständige Einsatz-Sammlung …“. Der Kopf springt von 8 auf 16
  Einheiten.
- Bei vollem Speicher kommt mit denselben Dateien „Keine Bögen in der Datei
  gefunden — weder eingebettete Daten noch ein lesbarer QR-Code.“ Der Kopf
  bleibt bei 8, und im Speicher stehen weiter 8 Einträge.
- Ein Hinweis auf den Speicher kommt nicht. Die Speicherzeile in der
  Datensicherung zeigt im Stub-Aufbau „etwa 1 %“, weil der Stub nur die
  Schreibzugriffe sperrt.
- Ursache im Code: `boegenAufnehmen()` fängt jeden Fehler aus
  `meldungAufnehmen()` mit dem Kommentar „ungültiger Bogen — überspringen“
  ab. Den `QuotaExceededError` behandelt die Funktion also wie einen
  kaputten Bogen. Weil am Ende kein Bogen aufgenommen ist, gilt die
  Meldung für „nichts gefunden“.
- Alle anderen Schreibstellen unterscheiden den vollen Speicher richtig:
  Einzel-Empfang (`istSpeicherVoll` um Zeile 1335), „Einsatz importieren…“
  (`dateiFehlerMeldung`), Abrücken, Vorlage und Sammlung.
- Risiko, nicht geprüft: Im Stapel-Scan aus Bildern (um Zeile 2269) ruft
  die Schleife `meldungAufnehmen()` ohne eigenen `try` auf. Der erste
  Fehlschlag bricht den Stapel ab und meldet „Stapel einlesen: …“. Wie viele
  Bögen davor schon aufgenommen waren, wird dann nicht mehr gemeldet.

**Erwartung der Rolle:** Wenn eine Datei nicht aufgenommen wird, sagt mir
die App den wahren Grund. Ist der Speicher voll, will ich das und den Weg
zum Platzschaffen sehen. Dass die Datei kaputt sei, darf dann nicht dastehen.

**Auswirkung im Einsatz:** Am Meldekopf-Tablet, das über Tage sammelt, ist
der volle Speicher der wahrscheinlichste Fall. Eine Einheit hat ihr PDF
per Messenger geschickt, als es noch Netz gab. Der Meldekopf liest es ein
und erfährt „Keine Bögen in der Datei gefunden“. Er hält die Datei für
defekt und fordert über Funk eine neue an, oder er trägt die Einheit von
Hand ein. Die nächste Datei scheitert genauso. Dass der Speicher voll ist,
erfährt er an dieser Stelle nicht, und die Einheiten fehlen in der Lage.
Dazu kommt, dass die Meldung weit unter dem Bild steht (siehe R3-L1).

**Empfehlung:** Den vollen Speicher beim Einlesen genauso melden wie beim
Einzel-Empfang: „Nicht aufgenommen — der Speicher dieses Geräts ist voll …“,
mit Zahl der betroffenen Bögen. Bögen, die vor dem Fehlschlag aufgenommen
wurden, mitzählen. Den Stapel-Scan genauso behandeln.

**Nachprüfung:** Speicher füllen und eine gültige App-PDF über „Bögen
einlesen…“ wählen. Die Meldung muss den vollen Speicher nennen und im Bild
stehen. Mit freiem Speicher muss dieselbe Datei aufgenommen werden.

### R3-O2 [P1] Jedes Lesen schreibt die ganze Einsatzliste zurück: große Sammlung 10 s Start, leere Seite, wenn das Schreiben scheitert (neu)

**Priorität:** P1

**Nachweis:** Laufzeit und Schreibmenge gemessen (CPU auf ein Viertel
gedrosselt). Die leere Seite ist mit dem Stub für jeden Schreibzugriff
gemessen. Wie oft ein echter Browser so einen gesperrten Speicher hat, ist
ein Risiko und hier nicht prüfbar.

**Fundstelle / Aufgabe:** Startseite, „Öffnen“ einer Sammlung, „Abrücken“,
„Fortsetzen“. Code: `vendor/bos-meldekopf/src/einsaetze.ts`,
`alleEinsaetzeLaden()` (um Zeile 447) mit `fristBereinigt()` (um Zeile 248).

**Beobachtung:**

- `fristBereinigt()` gibt die Liste über `liste.map(…)` immer als neues
  Array zurück. Deshalb ist in `alleEinsaetzeLaden()` die Bedingung
  `f.liste !== r.liste` immer wahr. Jeder Lesezugriff schreibt die ganze
  Einsatzliste mit `einsaetzeSpeichern()` neu.
- Gemessen bei gedrosselter CPU:

  | Sammlungsgröße | Start | Schreibvorgänge beim Start | Öffnen | Abrücken |
  | --- | --- | --- | --- | --- |
  | 23 000 Zeichen (8 Einheiten) | 0,9 s | 6, 0,12 Mio. Zeichen | 0,5 s | 0,5 s |
  | 1,18 Mio. Zeichen (+400) | 2,0 s | 6, 5,9 Mio. Zeichen, 0,3 s Schreibzeit | 1,3 s | 1,3 s |
  | 4,93 Mio. Zeichen (+1 700) | 10,2 s | 14, 64 Mio. Zeichen, 2,7 s Schreibzeit | 4,2 s | 8,8 s |

  Beim echt gefüllten Speicher (5,24 Mio. Zeichen) schrieb der Start
  `eeb.einsaetze.v1` 13-mal neu, zusammen 68 Mio. Zeichen. Bis zum
  Abrücken in der großen Sammlung kamen 32 Schreibvorgänge mit 148 Mio.
  Zeichen zusammen.
- **Wenn das Schreiben scheitert** (Stub für jeden Schreibzugriff):
  - „Fortsetzen“ oder „Öffnen“ einer Sammlung → **leerer Bildschirm**, ohne
    Text und ohne Knopf (Bild `06b-fortsetzen.png`). In der Konsole steht
    ein unbehandelter `QuotaExceededError` für `eeb.einsaetze.v1`.
  - Ist der Speicher von Anfang an schreibgesperrt und leer, zeigt die
    Startseite nur den statischen Kopf und „✓ Funktioniert komplett
    offline“. „Neuen Bogen erstellen“ und alle anderen Knöpfe fehlen.
  - „Neuen Bogen erstellen“ geht dagegen, wenn Daten da sind, und zeigt
    richtig „⚠ Nicht gespeichert“.
- Gegenprobe: Ist der Speicher bis zum letzten Zeichen mit echten Daten
  gefüllt, gelingt das Zurückschreiben, weil der neue Text gleich lang ist.
  Startseite, „Fortsetzen“ und Einsatzansicht erscheinen dann normal.
- Blockiert der Browser den Speicherzugriff ganz (`SecurityError`), läuft
  die App ohne Speicher. Startseite und Assistent erscheinen. Zur Meldung
  siehe R3-O4.

**Erwartung der Rolle:** Öffnen und Ansehen verändern nichts. Eine große
Lage öffnet ohne merkliche Wartezeit. Kann die App nicht speichern, zeigt
sie trotzdem, was da ist, und sagt, dass sie nicht speichern kann.

**Auswirkung im Einsatz:** Am Meldekopf mit einer großen, über Tage
gewachsenen Sammlung wartet der Helfer bei jedem Abrücken 9 s und beim
Start 10 s. In dieser Zeit tippt er noch einmal, das Abrücken trifft dann
womöglich die nächste Zeile, oder er hält die App für hängend und lädt
neu. Jedes Ansehen schreibt Megabytes in den Speicher, und das
Zurückschreiben ist eine Gelegenheit zum Scheitern, die es ohne diesen
Effekt nicht gäbe. Scheitert es, sieht der Helfer eine leere Seite statt
seiner Lage, ohne Hinweis und ohne Weg zur Datensicherung.

**Empfehlung:** Beim Lesen nur dann zurückschreiben, wenn sich durch
Papierkorb, Aufräumfrist oder Datenschutzfrist tatsächlich etwas geändert
hat. Scheitert dieses Zurückschreiben, die Liste trotzdem anzeigen und den
vollen oder gesperrten Speicher melden. Den Start nicht von einem
Schreibzugriff abhängig machen.

**Nachprüfung:** Sammlung mit etwa 5 Mio. Zeichen, CPU auf ein Viertel
gedrosselt. Der Start muss ohne Schreibzugriff auf `eeb.einsaetze.v1`
auskommen, und Abrücken muss in etwa 1 s fertig sein. Mit einem Stub, der
jeden Schreibzugriff ablehnt, müssen „Fortsetzen“ und „Öffnen“ die Daten
zeigen und den Speicherfehler melden.

### R3-O3 [P2] Erstbesuch bei schwachem Mobilfunk: 73 s bis „offline bereit“, ohne Fortschritt (neu, Folge der Behebung von R2-O1)

**Priorität:** P2

**Nachweis:** gemessen (CDP-Drosselung „Fast 3G“: 400 ms Latenz,
1,6 Mbit/s).

**Fundstelle / Aufgabe:** Erster Aufruf der Startseite, Offline-Zeile.
Precache in `vite.config.ts` (`globPatterns`, um Zeile 268).

**Beobachtung:**

- Die Startseite ist nach 2,8 s bedienbar. „⏳ Wird für den Offline-Betrieb
  geladen — bitte mit Netz geöffnet lassen“ steht dann 73 s lang, bis „✓
  Jetzt offline bereit“ kommt.
- Der Offline-Cache umfasst 552 Einträge mit rund 11,5 MB laut
  `navigator.storage.estimate()`. Darin stecken alle JSON-Beispielbögen,
  Begleitseiten, Bilder und PDFs aus `downloads/`.
- Wie weit das Laden ist, zeigt die App nicht. Es gibt weder eine Zahl noch
  einen Balken.
- Wer vorher offline geht, bekommt richtig „⚠ Noch nicht offline bereit —
  ohne Netz diese Seite nicht neu laden; beim nächsten Netz wird der Rest
  geladen.“ Arbeiten geht weiter, der Entwurf wird gespeichert. Ein
  Neuladen bringt die Fehlerseite des Browsers (`ERR_INTERNET_DISCONNECTED`).
  Davor warnt die Zeile.

**Erwartung der Rolle:** Wenn ich die App „mit Netz geöffnet lassen“ soll,
will ich wissen, wie lange noch. Das Nötige für den Bogen soll zuerst
offline da sein.

**Auswirkung im Einsatz:** Der Link zur App kommt oft erst auf der Anfahrt.
Über eine Minute „geöffnet lassen“ bei wechselndem Mobilfunk ist im
Fahrzeug oft nicht drin. Das Telefon geht in den Ruhezustand, oder der
Helfer wechselt in den Messenger. Kommt er im Funkloch an, liegt die App
nicht im Gerät. Die Warnung ist ehrlich, hilft aber nur, solange der Tab
nicht beendet wird.

**Empfehlung:** Zuerst nur das laden, was für Bogen, PDF, QR und Empfang
nötig ist, und ab dann „offline bereit für den Bogen“ melden. Beispielbögen,
Begleitseiten und Bilder danach nachladen. Während des Ladens einen groben
Fortschritt zeigen („noch etwa 6 MB“ oder „3 von 5 Teilen“).

**Nachprüfung:** Erstbesuch mit „Fast 3G“: Die Zeit bis zur ersten
Offline-Bereitschaft für den Bogen messen. Während des Ladens muss ein
Fortschritt sichtbar sein. Nach dieser Zeit offline neu laden: Bogen, PDF
und QR funktionieren.

### R3-O4 [P3] Kleinere Stellen zu Speichermeldungen und Schließen ohne Rückfrage (neu)

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** siehe Liste.

**Beobachtung:**

- **Gesperrter Speicher heißt „voll“:** Blockiert der Browser den
  Speicherzugriff (`SecurityError`), meldet der Assistent „⚠ Nicht
  gespeichert — der Speicher dieses Geräts ist voll … Papierkorb leeren bzw.
  Sicherung erstellen.“ Der Speicher ist aber leer, und Papierkorb leeren
  hilft nicht. Richtig wäre der Hinweis, dass der Browser das Speichern
  blockiert, etwa im Privatmodus oder durch eine Datenschutzeinstellung.
- **100 % und 104 %:** Bei echt gefülltem Speicher steht auf Startseite und
  in der Einsatzansicht „Gerätespeicher zu 100 % (5 von 5 Mio. Zeichen)
  belegt. Wird er voll, kann die App nichts mehr speichern. Am meisten
  belegen: ‚Großschadenslage Archiv‘ (104 %).“ Bei 100 % ist „wird er voll“
  vorbei. Eine Sammlung mit 104 % von einem Ganzen mit 100 % irritiert.
- **Schließen ohne Rückfrage:** Mit vollem Speicher steht im Assistenten
  richtig „⚠ Nicht gespeichert …“ Wer den Tab dann schließt, wird nicht
  gefragt (kein `beforeunload`-Dialog). Nach dem Neustart steht der alte
  Einsatzort im Entwurf, die Eingabe ist weg. Viele mobile Browser zeigen
  diesen Dialog ohnehin nicht. Auf Tablet und Laptop am Meldekopf würde er
  aber greifen.

**Erwartung der Rolle:** Die Meldung nennt den wahren Grund und den Weg,
der hilft. Zahlen passen zusammen. Was nicht gespeichert ist, geht nicht ohne
Rückfrage verloren.

**Auswirkung im Einsatz:** Gering. Wer den falschen Grund liest, räumt
vergeblich den Papierkorb auf, statt den Privatmodus zu verlassen. Am
Laptop geht eine nicht gespeicherte Eingabe beim versehentlichen Schließen
verloren.

**Empfehlung:** Den gesperrten Speicher eigens benennen. Prozentangaben
der Sammlungen auf die Grenze beziehen und deckeln, bei 100 % „ist voll“
schreiben. Bei nicht gespeicherten Eingaben vor dem Schließen fragen, wo
der Browser das zulässt.

**Nachprüfung:** `localStorage`-Zugriff sperren und „Neuen Bogen
erstellen“ wählen: Die Meldung nennt die Sperre. Speicher füllen: Keine
Angabe über 100 %. Mit vollem Speicher tippen und den Tab schließen: Es
erscheint eine Rückfrage.

## Bestätigt aus anderen Runde-3-Berichten

Diese Stellen habe ich unabhängig beobachtet. Sie sind in den genannten
Berichten beschrieben und werden hier nicht noch einmal als eigene Befunde
gezählt:

- **R3-L1 [P2]:** Rückmeldung nach „Bögen einlesen…“ steht weit unter dem
  Bild. Bei R3-O1 kommt zur falschen Ursache dieselbe Lage hinzu (Bild
  `13-import-voll.png` zeigt nach dem Einlesen nur Kacheln und Knöpfe).
- **R3-H3 [P2] / R3-A7 [P3]:** „Übergeben … — seitdem unverändert“ ohne
  Nachweis eines Empfangs. Ich habe es auch schon nach bloßem „Link teilen“
  (Link in der Zwischenablage) gesehen. Für diese Rolle bleibt damit offen,
  was wirklich angekommen ist.
- **R3-L7 [P3]:** Die Ladezeile „⏳ Wird für den Offline-Betrieb geladen“
  und die Warnung „⚠ Noch nicht offline bereit“ stehen im grünen Rahmen der
  Gut-Farbe (Bild `02-abbruch-offline.png`).

## Bestätigtes

- **Offline-Zusage an die Bereitschaft gekoppelt:** erst „⏳ Wird für den
  Offline-Betrieb geladen“, dann einmal „✓ Jetzt offline bereit“. Danach
  steht „✓ Funktioniert komplett offline“. Ohne Netz vor der Bereitschaft
  kommt „⚠ Noch nicht offline bereit — ohne Netz diese Seite nicht neu
  laden“.
- **Kaltstart ohne Netz:** Offline neu geladen erscheinen Startseite,
  Entwurfskarte und „Fortsetzen“. Anleitung, Datenschutz, `thw.html`,
  `meldekopf.html` und der Blanko-Vordruck kommen mit Status 200 aus dem
  Service Worker.
- **Übergabe offline:** Das PDF entstand (43 KB) mit Vermerk in der
  Übersicht. Der Link (627 Zeichen) landete in der Zwischenablage. Das
  QR-Vollbild zeigt jetzt „THW · Zugtrupp Technischer Zug · Albstadt“,
  „Stärke 1 / 1 / 2 / 4“ und „Stand 20:45 Uhr“.
- **Link-Hinweis:** Am Knopf „Link teilen“ steht „Ohne Netz öffnet er sich
  nur, wenn die Gegenstelle die App schon einmal mit Netz geöffnet hat —
  sonst …“
- **Meldekopf offline:** Lageblatt (8 KB), „Übersicht als CSV“, „Alle Daten
  als CSV“, Excel-Liste „Oldenburg“ und „Einsatz weitergeben / sichern“
  gehen offline. Danach steht „Lageblatt erstellt 04.10.2026, 20:38 ·
  seitdem keine neue Meldung“. Beispielbögen öffnen offline. „Bögen
  einlesen…“ mit Einzel- und Sammel-PDF geht offline (9 Bögen).
- **Keine Fremdanfragen offline:** keine fehlgeschlagene Anfrage, kein
  Konsolenfehler im ganzen Offline-Durchgang.
- **Eingabe überlebt sofortiges Neuladen:** „TIPPTEST“ eintippen und ohne
  Verlassen des Felds neu laden. Der Text steht im Entwurf.
- **„gespeichert“ zeigt den Stand:** Ein drei Tage alter Entwurf heißt auf
  Karte, Meldung und Statuszeile „01.10., 20:45 Uhr“. Das bleibt auch nach
  „Fortsetzen“ und erneutem Öffnen so.
- **Zwei Fenster:** Tab B meldet „⚠ Dieser Bogen wurde in einem anderen
  Fenster geändert. Eingaben hier werden erst wieder gespeichert, wenn du
  entscheidest.“ mit „Stand aus dem anderen Fenster laden“ / „Meine Fassung
  behalten“. Im Speicher bleibt Fassung A. In der Sammlung rückt A Einheit 1
  ab und B Einheit 2. Beide Abrückvermerke bleiben, und beide Tabs zeigen 6
  anwesende Einheiten.
- **Voller Speicher, im Bild gemeldet:**
  - Assistent: „⚠ Nicht gespeichert … Letzter gesicherter Stand: 20:39 Uhr“.
  - Ablegen in eine Sammlung: Der Dialog bleibt offen und zeigt „Speichern
    fehlgeschlagen — der Speicher dieses Geräts ist voll …“ bei 159 px.
  - Vorlage: „Vorlage nicht gespeichert“.
  - Sammlung: „Sammlung nicht angelegt“.
  - Abrücken: Dialog „Speichern fehlgeschlagen“, der Status bleibt
    unverändert.
  - Link-Empfang: Der empfangene Bogen wird mit Rückfrage geöffnet statt
    verworfen. Der eigene Entwurf bleibt über „Zuletzt verdrängten Bogen
    zurückholen“ erreichbar.
- **Speicherstand sichtbar:** Die Warnung steht bei vollem Speicher auf der
  Startseite und in der Einsatzansicht und nennt die größte Sammlung. Die
  Datensicherung zeigt „Belegter Speicher: etwa 1 % (0 von 5 Mio.
  Zeichen)“, „Der Speicher ist nicht dauerhaft … Dauerhaften Speicher
  anfragen“ und „Auf diesem Gerät wurde noch keine Sicherung erstellt“. Die
  Startseite sagt „Noch keine Datensicherung erstellt. Alles liegt nur auf
  diesem Gerät.“ Die Sicherung entsteht offline (34 KB).

## Abschluss

- **Aufgabe geschafft:** ja, nach vollständigem Erstbesuch. Mit Umwegen bei
  vollem Speicher am Meldekopf („Bögen einlesen…“ nennt den falschen
  Grund, R3-O1) und bei großer Sammlung (Wartezeiten, R3-O2).
- **Fremde Hilfe nötig:** nein. Bei R3-O1 womöglich doch, weil der Helfer die
  Ursache nicht selbst findet.
- **Größtes Missverständnis:** „Keine Bögen in der Datei gefunden“ bei
  vollem Speicher. Der Meldekopf hält gültige PDFs für kaputt (R3-O1).
- **Größtes Einsatzrisiko:** Jedes Ansehen schreibt die ganze Lage neu. Bei
  großer Sammlung wird die App zäh, und scheitert das Schreiben, bleibt der
  Bildschirm leer (R3-O2).
- **Top-Priorität für die nächste Iteration:** Beim Einlesen den vollen
  Speicher als solchen melden (R3-O1). Direkt danach das Zurückschreiben
  beim Lesen auf echte Änderungen beschränken (R3-O2).

## Abgleich mit Runde 2

Grundlage: [../runde-2/offline-und-speicher.md](../runde-2/offline-und-speicher.md)
und [../runde-2/README.md → Stand der Behebung](../runde-2/README.md#stand-der-behebung).

| Runde-2-Befund | Stand laut Tabelle | Bewertung Runde 3 | Beobachtung |
| --- | --- | --- | --- |
| R2-O1 Offline-Zusage zu früh | behoben | hält | Ladehinweis, dann „Jetzt offline bereit“. Vor der Bereitschaft offline kommt eine Warnung. Nach der Bereitschaft geht das Offline-Neuladen. Neu ist die lange Wartezeit bei schwachem Netz (R3-O3). |
| R2-O2 Voller Speicher ohne Meldung | behoben | hält teilweise | Ablegen, Vorlage, neue Sammlung, Link-Empfang und Abrücken melden im Bild, und der empfangene Bogen bleibt erhalten. Nicht gehalten bei „Bögen einlesen…“, dort steht die falsche Ursache (R3-O1). Die in der Tabelle als ungeprüft vermerkten weiteren Schreibwege habe ich so gefunden. |
| R2-O3 „gespeichert“ = Öffnungszeit | behoben | hält | Ein drei Tage alter Entwurf zeigt überall „01.10., 20:45 Uhr“, auch nach dem Öffnen. |
| R2-O4 Zwei Fenster | behoben | hält | Warnung mit beiden Wahlknöpfen, kein stilles Überschreiben. Die Sammlung führt die Stände zusammen, und beide Tabs zeigen dieselbe Summe. |
| R2-O5 Link braucht Netz beim Empfänger | behoben | hält | Der Hinweis steht am Knopf „Link teilen“. |
| R2-O6 Speicher nicht dauerhaft | behoben | hält (Erinnerung nicht geprüft) | „Der Speicher ist nicht dauerhaft …“, „Dauerhaften Speicher anfragen“, Stand der letzten Sicherung in Dialog und Startseite. Die Erinnerung nach drei Tagen ist zeitabhängig und nicht geprüft. |
| R2-O7 Speicher, Blanko, QR-Vollbild | behoben | hält, mit Rest | Die Anzeige läuft in Zeichen und ist bei 100 % gedeckelt. Die Warnung steht auf Startseite und in der Einsatzansicht. Der Blanko-Vordruck kommt offline aus dem Service Worker, das QR-Vollbild zeigt Einheit und Stand. Rest: Die Sammlung wird mit „104 %“ angegeben (R3-O4). |

Einordnung der eigenen Befunde: R3-O1 ist der Rest von R2-O2 an einer
Schreibstelle, die Runde 2 nicht geprüft hatte. R3-O3 ist eine Folge der
Behebung von R2-O1. R3-O2 und R3-O4 sind neu. Nur als Verweis geführt (nicht
gezählt): R3-L1, R3-H3/R3-A7, R3-L7.

Bilanz: Von sieben Runde-2-Befunden halten sechs (R2-O1, R2-O3 bis R2-O7,
bei R2-O7 mit kleinem Rest) und einer teilweise (R2-O2). Keiner ist
unverändert offen.

## Stand der Behebung

Stand 05.10.2026, Paket „Speicher und Offline". Geprüft mit Typprüfung,
Unit-Tests (2 337 grün) und Nachmessung im Produktionsbuild (`vite preview`,
360 × 640, `isMobile`/`hasTouch`, de-DE), Prüfskripte dieses Audits (s06b,
s08, s10, s13) und eigene Skripte. Kern (`vendor/`) und Transportformat
unverändert.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R3-O1 „Bögen einlesen…" bei vollem Speicher: „Keine Bögen gefunden" | behoben | Am vollen Speicher gescheiterte Bögen werden eigens gezählt: „Nicht aufgenommen: 2 Bögen — der Speicher dieses Geräts ist voll, die Datei selbst ist in Ordnung …" in der Fehlerzeile im Bild; vorher Aufgenommenes bleibt in der Erfolgsmeldung. Ebenso „Einsatz importieren…" mit Einzel-PDF und der Bilderstapel, der jetzt bis zum Ende läuft. Nachlauf s13 offline: frei → 9 Einheiten wie bisher, voll → Meldung mit Speicher, Kopf und Speicher bleiben 8. |
| R3-O2 Lesen schreibt die ganze Einsatzliste zurück | behoben (ohne Kernänderung) | Hülle `speicher-schonend.ts` außen um die Ablage: kein Schreiben unveränderten Textes; ein scheiterndes Zurückschreiben beim bloßen Lesen wird gemerkt und auf Startseite/Einsatzansicht gemeldet (voll bzw. gesperrt), die Liste erscheint. Die Oberfläche liest über `einsaetze-lesen.ts` (Ergebnis gemerkt, solange der Speichertext gleich ist), Revisionen je Karte über `einheiten-index.ts` statt quadratisch. Nachlauf 4,93 Mio. Zeichen, CPU 4× gedrosselt, Klick im Seitenkontext: Start 13,3 → 1,7 s, Schreibvorgänge beim Start 18 (89 Mio. Zeichen) → 0, Öffnen 3,6 → 0,5 s, Abrücken 4,3 → 1,7–2,4 s mit einem Schreibvorgang. Mit s10 (Playwright-Rollensuche, die bei 1 700 Karten selbst ~15 s kostet): Start 12,8 → 1,6 s. Stub „jedes Schreiben scheitert": „Fortsetzen" und „Öffnen" zeigen Bogen bzw. Sammlung, leere gesperrte Startseite mit allen Knöpfen. Rest: Abrücken bleibt bei dieser Größe über 1 s, weil der Kern beim Ändern die ganze Liste parst und schreibt. |
| R3-O3 Erstbesuch: lange bis „offline bereit", ohne Fortschritt | behoben | Vorrat zweistufig: Kern (78 Dateien, 6,7 MB: App, PDF, QR-Decoder, Landesvorlagen, Blanko, Anleitung) im Precache, Beispielbögen und Themenseiten (474 Dateien, 4,0 MB) danach nachgeladen. Zeile: „⏳ … geladen: 2,1 von 6,7 MB", dann „✓ Jetzt offline bereit für Bogen, PDF, QR-Code und Empfang. Beispielbögen und Themenseiten werden nachgeladen (120 von 474)". Die CDP-Drosselung der Seite greift nicht auf den Service Worker; nachgebildete gemeinsame Leitung (400 ms, 1,6 Mbit/s): vorher 294 s bis bereit ohne Fortschritt, nachher Fortschritt ab 9 s, Kern bereit nach 77 s, alles nach 135 s. Danach offline neu geladen: Bogen, QR, PDF, thw.html gehen. |
| R3-O4 Speichermeldungen, 104 %, Schließen ohne Rückfrage | behoben | Gesperrter Speicher wird benannt („dieser Browser lässt die App nichts speichern …"), bei 100 % „Gerätespeicher ist voll", Sammlungsanteile gedeckelt, `beforeunload`-Rückfrage bei „Nicht gespeichert". Nachlauf: SecurityError → Sperr-Text; 5 240 563 Zeichen → „ist voll: 100 % … ‚Großschadenslage Archiv' (99 %)"; Schließen mit nicht Gespeichertem → Dialog `beforeunload`. |
