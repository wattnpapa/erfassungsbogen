# Audit Runde 6 – Offline und Speicher (Erstladen, Funkloch, Netzwechsel, voller und gesperrter Speicher, zwei Fenster, Sicherung, Exporte und Importe ohne Netz)

Stand: 23.10.2026 · Code-Stand: Commit `03a0011` (geprüfter Build; zwei spätere Commits auf `main` ändern nur den
Lagemonitor und sind nicht enthalten) · Prüfer: Rollenaudit `thw-offline-resilience-reviewer`

Reiner Prüfbericht, keine Codeänderung. Die ganze Rolle ist geprüft: Erstladen, Offline-Betrieb, Funkloch, Netzwechsel,
Speicher voll oder gesperrt, Zwei-Fenster-Betrieb, Sicherung, Exporte und Importe ohne Netz, die Anzeige „gespeichert“
und die Offline-Zeile. Schwerpunkt waren die Umbauten aus Runde 5: Nachladen der zweiten Stufe mit Wiederholung, Fotos
der Themenseiten im Vorrat, die feste Warnleiste „Nicht gespeichert“, „wird erzeugt…“ bei den PDF-Wegen, Fenster A/B
beim Löschen und beim Papierkorb, Speicher gesperrt auf der Startseite und die Geräteuhr-Warnung nach echter Pause.

## Prüfaufbau

- **Eigener Server aus demselben `dist/`:** `vite preview` auf Port 4175 (nicht neu gebaut; der gemeinsame Server auf
  Port 4173 blieb unberührt). Für die gedrosselten Läufe ein eigener Reverse-Proxy (Port 4176, Skript aus Runde 5).
  Er drosselt die **gesamte** Leitung, auch die Abrufe des Service Workers (`setOffline` und die CDP-Drosselung
  erfassen den Service Worker nicht). Drei Lagen: *normal* (1,6 bis 8 Mbit/s, 80 bis 300 ms Latenz), *Funkloch*
  (Verbindung wird angenommen, aber nie beantwortet) und *weg* (Verbindung wird abgerissen). Beim Rückschalten auf
  *normal* reißt der Proxy die hängenden Verbindungen ab.
- **Echtes Offline:** eigener Server gestoppt (Verbindung abgewiesen), zusätzlich `setOffline`, damit `online` und
  `offline` auslösen. „Browser glaubt sich online, die Leitung liefert nichts“ (Funkloch mit Balken): Proxy auf
  *Funkloch*.
- Playwright aus `node_modules`, Chromium `/opt/pw-browsers/chromium`, `isMobile`/`hasTouch`, Locale de-DE,
  360 × 640, Pixeldichte 2, je Prüfung ein frischer Browser-Kontext. Für die PDF-Läufe CPU über
  `Emulation.setCPUThrottlingRate` auf ein Viertel.
- **Zustände** per `localStorage`-Seeds (`eeb.entwurf.v1`, `eeb.einsaetze.v1`, `eeb.vorlagen.v1`) aus `examples/thw/`,
  alle mit `uebung: false`: Entwurf 001 Albstadt (Schritt 3), Sammlung „Hochwasser Neckar“ mit 3, 6, 8, 12 und 30
  Bögen, eine Vorlage „Mein OV“ aus 006.
- **Speicher voll:** (1) echt gefüllt, bis `localStorage` selbst `QuotaExceededError` wirft (Anzeige „5 von 5 Mio.
  Zeichen“), einmal mit Fremdschlüsseln, einmal mit eigenen Sammlungen gefüllt (zwei aktive, eine im Papierkorb);
  (2) Stub, bei dem jedes `setItem` `QuotaExceededError` wirft; (3) Stub mit `SecurityError` bei jedem `setItem`;
  (4) schon der Zugriff auf `localStorage` wirft `SecurityError`.
- **Geräteuhr:** gespeicherter Uhrstand (`eeb.uhr.v1`) für 45 und 100 Tage Pause (Geräteuhr unverändert), mit und ohne
  alte Sammlung, mit altem Entwurf; zusätzlich Uhrstand 30, 100 und 400 Tage in der Zukunft (Uhr zurückgegangen).
- **Zwei Fenster:** zwei Seiten im selben Kontext (gleicher `localStorage`).
- Getestet habe ich zuerst ohne Blick in frühere Berichte. Den Runde-5-Bericht samt „Stand der Behebung“ und die
  README habe ich danach gelesen, die übrigen Runde-6-Berichte zuletzt. Was dort schon steht, nenne ich nur als
  Verweis.
- Skripte und Bildschirmfotos: Scratchpad `runde6/offline/` (nicht im Repo). Die Bildschirmfotos habe ich angesehen.

**Nicht prüfbar:**

- Kamera-Scan und Nahbereichs-Weitergabe (keine Kamera, kein zweites Gerät); Teilen-Dialog des Telefons.
- Die echte Domain `erfassungsbogen.app` und der Empfänger, der die App noch nie geöffnet hat.
- Echter Flugmodus, echte Funkzelle, Wechsel WLAN–Mobilfunk mit Radio: Der Proxy bildet die Leitung nach, nicht das
  Funkmodul. Insbesondere feuert der Proxy kein `online`-Ereignis; auf dem Telefon kann das Ereignis Wartezeiten
  (R6-O6) verkürzen.
- Echte CPU eines Mittelklasse-Telefons (nur 4-fach gedrosselt); Speicherräumung durch Safari/iOS; Privatmodus älterer
  Safari-Versionen (nur Stubs); Entscheidung des Browsers über „dauerhaften Speicher“.
- Das Update-Banner bei einer neuen Fassung (dafür wäre ein zweiter Build nötig) und die Update-Prüfung der
  Android-App. Die nativen Builds (Android, iOS, Electron).
- Der Kamera-Scan-Eingang bei vollem Speicher und „Einsatz löschen…“ aus der Einsatzansicht (R6-O1 habe ich nur
  über die Karte auf der Startseite gemessen; der Code der Einsatzansicht ruft dieselbe Funktion ohne Fehlerbehandlung).
- Ungedrosselte Erstladezeit: Auf dem Server liefen gleichzeitig andere Prüfer.
- Die Plattform-Reaktion auf ein hängendes Dokument (ein Browser, der „Seite reagiert nicht“ meldet) nach den
  30 Sekunden Sammel-PDF bei 4-facher Drosselung.

## Urteil

Die Umbauten aus Runde 5 halten. Das Nachladen der zweiten Stufe überlebt flackerndes Netz (drei Funklöcher zu je 12 s:
508 von 508 nach 89 s, die Zeile sagt „das Netz hakt“ und läuft von selbst weiter). Alle 37 Themenseiten gehen offline
auf, mit allen Fotos. „Nicht gespeichert“ sitzt als feste Leiste am oberen Bildrand und bleibt beim Scrollen im Bild.
„Einsatz weitergeben / sichern“, Lageblatt, Blanko und Bogen-PDF sperren sich und sagen „wird erzeugt…“, auch bei drei
Tipps entsteht eine Datei. In den zwei Fenstern überschreibt nichts etwas still, und das offene Fenster sagt, was im
anderen geschah. Ein gesperrter Speicher steht auf der Startseite. Die Geräteuhr-Warnung fragt nach einer echten Pause
nur, wenn etwas fällig würde. Sicherung, alle Exporte und alle Importe gehen ohne Netz, kaputte Dateien werden
abgewiesen, ohne Daten anzufassen.

Eine Stelle ist neu und ernst. **Bei vollem Speicher scheitert „In den Papierkorb“ stumm** (R6-O1): Der Dialog schließt
wie bei Erfolg, die Sammlung bleibt, es gibt keine Meldung, und die Warnzeile empfiehlt genau diesen Schritt als Weg
zu Platz. Dazu kommen drei P2: Das statische Start-Gerüst behauptet vor dem ersten Skriptlauf „✓ Funktioniert komplett
offline“ (R6-O2), Themenseiten brauchen im Funkloch fünf Sekunden bis zum ersten Bild (R6-O3), und das Laden des Kerns
sagt im Funkloch eine Minute lang nur „wird geladen“ (R6-O4). Fünf Stellen bleiben P3.

Die Aufgaben „offline weiterarbeiten, sichern, übergeben, empfangen“ gelingen ohne fremde Hilfe. Mit Umweg nur bei
vollem Speicher (R6-O1).

## Befunde

P0: keine. P1: eine. P2: drei. P3: fünf.

### P1

#### R6-O1 – Voller Speicher: „In den Papierkorb“ scheitert stumm, obwohl die Warnzeile genau das als Weg zu Platz nennt (gemessen)

- **Kennzeichnung:** gemessen (echt gefüllter Speicher, zwei Läufe).
- **Fundstelle:** Startseite, Karte der Sammlung, „Löschen…“ → „In den Papierkorb“; `src/app/einsaetze-ui.tsx`,
  `loeschen(s)` (Z. 404, ruft `einsatzLoeschen(s.id)` ohne `try`/`catch`; derselbe Aufruf in der Einsatzansicht,
  Z. 1205 ff.); Warntexte in `src/app/speicher-warnung.tsx` und `src/app/speicher-fehler-text.ts`.
- **Beobachtung:** Speicher auf 100 % („5 von 5 Mio. Zeichen“), mit zwei aktiven Sammlungen und einer im Papierkorb.
  Die Startseite sagt: „Platz schafft nur Löschen: nicht mehr benötigte Einsätze sichern, in den Papierkorb legen und
  den Papierkorb leeren.“ Tipp auf „Löschen…“, „In den Papierkorb“: Der Dialog schließt, in der Konsole steht
  `Failed to execute 'setItem' on 'Storage': Setting the value of 'eeb.einsaetze.v1' exceeded the quota`, die Sammlung
  steht unverändert „aktiv“ in der Liste (Speicher geprüft), es erscheint keine Meldung und kein Eintrag im
  Papierkorb (`t21-nach-papierkorb.png`). Der Schritt „Papierkorb leeren“ (Endgültig löschen…) klappt dagegen und
  schafft Platz. Andere Schreibwege melden dagegen richtig: „Einsatz importieren“, „Neue Einsatz-Sammlung“ und
  „Abrücken“ zeigen „Speichern fehlgeschlagen — der Speicher dieses Geräts ist voll …“.
- **Folge:** Der Helfer folgt der Anweisung, legt die älteste Lage in den Papierkorb und sieht, dass der Dialog sich
  schließt. Dann versucht er die nächste Aufgabe und scheitert wieder. Dass nichts passiert ist, erfährt er nirgends.
  Der Papierkorb als Zwischenschritt ist beim vollen Speicher zudem gar nicht möglich, weil das Setzen von
  `geloeschtAm` Bytes kostet. Wer in der Einsatzansicht „Einsatz löschen…“ tippt, bekommt vermutlich dasselbe (nicht
  gemessen). Daten gehen nicht verloren, aber der Einsatz hängt, wenn das Gerät gerade voll ist und Platz gebraucht
  wird.
- **Empfehlung:** Scheitert das Löschen, in den Papierkorb zu legen, eine Meldung wie bei den anderen Schreibwegen
  („Nicht gelöscht — der Speicher ist voll. Zuerst … endgültig löschen oder Sicherung erstellen“). Die Zeile bei
  vollem Speicher sollte den Weg nennen, der wirkt: Sicherung erstellen, danach „Endgültig löschen…“ im Papierkorb
  oder ein gezieltes „Endgültig löschen“ der Sammlung, nicht „in den Papierkorb legen“.
- **Nachprüfung:** Speicher echt auf 100 % füllen, „Löschen…“ → „In den Papierkorb“ tippen: Es erscheint eine Meldung,
  oder die Sammlung wandert trotzdem (zum Beispiel durch Platz, der vorher freigehalten wird).
- **Verweis:** Verwandt, aber anderer Ort: R6-E2 in `fehler-und-wiederanlauf.md` (voller Speicher beim „In Einsatz
  übernehmen“, Meldung außer Sicht).

### P2

#### R6-O2 – Das statische Start-Gerüst sagt „✓ Funktioniert komplett offline“, bevor die App läuft und bevor etwas im Cache liegt (gemessen)

- **Kennzeichnung:** gemessen (600 kbit/s, 300 ms; wiederholt auch bei schnelleren Läufen als erster Wert).
- **Fundstelle:** `index.html` Z. 4899 (`<p class="offline-badge">✓ Funktioniert komplett offline — alle Daten bleiben
  auf diesem Gerät.</p>`), Teil des Start-Gerüsts, das vor dem Bundle steht.
- **Beobachtung:** Frischer Browser ohne Service Worker, Leitung 600 kbit/s: Nach 1,7 s steht das Gerüst im Bild, grün
  umrandet, mit „✓ Funktioniert komplett offline — alle Daten bleiben auf diesem Gerät.“ (`t28-2.png`). Erst nach
  5,5 s hat die App das Gerüst ersetzt und zeigt „⏳ Wird für den Offline-Betrieb geladen“. Fertig ist der Vorrat
  nach 67 s. In diesen 3,8 s (bei langsamerer Leitung länger) ist die Aussage falsch.
- **Folge:** Wer die Seite zum ersten Mal im Fahrzeug öffnet und sofort wegsteckt, hat ein grünes Häkchen gesehen und
  nichts im Gerät. Ohne Netz geht die Seite dann nicht mehr auf. Beim nächsten Besuch (Service Worker aktiv) ist die
  Aussage gedeckt.
- **Empfehlung:** Im Gerüst keine Bereitschaftsaussage, oder neutral („Lädt …“); die Zeile erst setzen, wenn die App
  den Stand kennt.
- **Nachprüfung:** Neuer Browser-Kontext, Leitung drosseln, Erstaufruf: Solange der Service Worker die Seite nicht
  steuert, steht nie „komplett offline“.

#### R6-O3 – Themenseiten bleiben im Funkloch fünf Sekunden leer, obwohl sie im Gerät liegen (gemessen)

- **Kennzeichnung:** gemessen (Proxy *Funkloch* und *weg*, Vorrat vollständig; offline ohne Verbindung 72 bis 81 ms).
- **Fundstelle:** `vite.config.ts` Z. 321 bis 324: Laufzeit-Route für `*.html` mit `NetworkFirst` und
  `networkTimeoutSeconds: 5`.
- **Beobachtung:** Vollständig geladen, dann Verbindung hängt (Browser glaubt sich online). `thw.html` und
  `feuerwehr.html`: weiße Seite, erstes Byte nach 5,05 s (mit Netz 0,12 s). `anleitung.html` und die Startseite
  kommen sofort (Precache). Mit abgewiesener Verbindung (`weg`) ebenfalls 5,1 s. Ohne jede Verbindung (Server aus,
  `setOffline`) 81 ms für `thw.html`.
- **Folge:** Im Funkloch mit Balken ist die Wartezeit der Normalfall: Jeder Tipp auf ein Thema (THW, Feuerwehr, DRK, …)
  zeigt fünf Sekunden nichts. Der Helfer tippt noch einmal oder lädt neu und verlängert die Wartezeit.
- **Empfehlung:** Für Seiten, die im Vorrat liegen, zuerst den Cache bedienen und im Hintergrund auffrischen, oder die
  Zeitgrenze auf ein bis zwei Sekunden senken.
- **Nachprüfung:** Vorrat voll, Proxy auf *Funkloch*, Themenseite öffnen: Der Text steht unter einer Sekunde.

#### R6-O4 – Das Laden des Kerns im Funkloch: Zeile bleibt eine Minute bei „wird geladen“, danach kurz „Laden abgebrochen — neu laden“ (gemessen)

- **Kennzeichnung:** gemessen (ein Lauf, 1,6 Mbit/s, 60 s Funkloch bei 4,0 von 6,9 MB).
- **Fundstelle:** Startseite, Offline-Zeile; `src/app/offline-bereit.ts` (Stillstandserkennung nur bei `online`,
  Text `abgebrochen`).
- **Beobachtung:** Der Zähler stand bei „6,3 von 6,9 MB“. Während der 60 s Funkloch lautete die Zeile unverändert
  „⏳ Wird für den Offline-Betrieb geladen: 6,3 von 6,9 MB — bitte mit Netz geöffnet lassen.“ Der Hinweis „das Netz
  hakt“ gibt es nur für die zweite Stufe (R5-O2), nicht für den Kern. Nach der Netzrückkehr stand 1 s lang „⚠ Laden
  abgebrochen bei 6,3 von 6,9 MB — mit Netz einmal neu laden, dann geht es weiter“, 2 s später lief der Zähler von
  selbst weiter, nach 3 s stand „✓ Jetzt offline bereit“.
- **Folge:** Gering bis mittel. Wer im Funkloch auf den Ladevorgang wartet, sieht einen Zähler, der sich nicht
  bewegt, ohne Auskunft. Die Aufforderung „neu laden“ danach überholt sich in Sekunden. Beides ist harmlos, kostet
  aber Aufmerksamkeit.
- **Empfehlung:** Steht der Zähler länger als etwa 20 s, sagen: „Das Netz hakt — Laden geht weiter, sobald es wieder
  da ist.“ „Laden abgebrochen — neu laden“ erst zeigen, wenn die Registrierung wirklich weg ist und der Zähler danach
  nicht weiterläuft.
- **Nachprüfung:** Wie oben: Kern halb laden, 60 s Funkloch, Netz zurück: Die Zeile nennt den Stillstand, und es
  erscheint nie eine Aufforderung, die sich selbst erledigt.

### P3

#### R6-O5 – Warnleiste im Bogen nennt „Sicherung erstellen“ als Weg zu Platz, die Startseite sagt das Gegenteil (beobachtet)

- **Kennzeichnung:** beobachtet.
- **Fundstelle:** `src/app/speicher-fehler-text.ts` Z. 30 und 33 („Platz schaffen: in der Fußzeile der Startseite
  Papierkorb leeren bzw. Sicherung erstellen“); Gegenstück in `src/app/speicher-warnung.tsx` und im Dialog
  „Datensicherung“ („die Sicherung selbst schafft keinen Platz“).
- **Beobachtung:** Voller Speicher, Bogen offen, „Was tun?“ aufgeklappt: Der Text zählt „Sicherung erstellen“ als
  Platzbeschaffung auf. Auf der Startseite steht dort ausdrücklich, dass die Sicherung keinen Platz schafft.
- **Folge:** Gering. Wer zuerst sichert, verliert nichts, aber Zeit.
- **Empfehlung:** Einheitlich: „Zuerst sichern, dann Platz schaffen: Papierkorb leeren oder alte Einsätze endgültig
  löschen.“
- **Nachprüfung:** Beide Texte nennen dasselbe.

#### R6-O6 – Nach dem Funkloch läuft das Nachladen bis zu 60 s nicht weiter, wenn kein `online`-Ereignis kommt (gemessen)

- **Kennzeichnung:** gemessen (Proxy *weg* 70 s, dann *normal*; auf dem Telefon kann ein `online`-Ereignis es
  verkürzen).
- **Fundstelle:** `src/app/offline-vorrat.ts`, `nachladePause()` (2, 4, 8, 16, 30, dann 60 s).
- **Beobachtung:** Nach 70 s ohne Verbindung hatte die Pause 60 s erreicht. Beim Netz zurück (87 s) stand die Zeile
  weiter auf „74 von 508 da, das Netz hakt — der nächste Versuch läuft von selbst“; der Zähler lief erst nach 59,3 s
  weiter, alles da nach 163 s.
- **Folge:** Gering. Der Vorrat wird vollständig, die Zeile ist ehrlich; nur der Zeitpunkt, zu dem Themenseiten und
  Beispielbögen wirklich da sind, verschiebt sich bis zu einer Minute nach hinten.
- **Empfehlung:** Bei jedem erfolgreichen Abruf anderer Anfragen der Seite (oder beim Sichtbarwerden der Seite) die
  Pause zurücksetzen; die Obergrenze auf 15 bis 20 s senken.
- **Nachprüfung:** Wie oben: Nach der Netzrückkehr läuft der Zähler innerhalb von 20 s wieder.

#### R6-O7 – Nach einem Neuladen ohne Netz verliert die Offline-Zeile die Auskunft über fehlende Themenseiten und Beispielbögen (beobachtet)

- **Kennzeichnung:** beobachtet.
- **Fundstelle:** `src/app/offline-bereit.ts`, `offlineText()` (zweiter Zweig „sicher ist nur der Kern“), `umfangLaden()`
  holt `offline-zusatz.json` nur mit Netz oder aus dem Laufzeit-Cache.
- **Beobachtung:** Kern da, 41 von 508 der zweiten Stufe, dann echt offline: Zeile „… Beispielbögen und Themenseiten
  fehlen noch (41 von 508), sie folgen beim nächsten Netz“. Nach einem Neuladen ohne Netz nur noch „✓ Offline bereit
  für Bogen, PDF, QR-Code und Empfang — alle Daten bleiben auf diesem Gerät.“ Themenseiten zeigen die Fehlerseite des
  Browsers („No internet“), ein Beispielbogen meldet „Dieser Beispielbogen liegt noch nicht auf dem Gerät … (siehe
  Offline-Zeile der Startseite)“, die Zeile sagt dazu aber nichts mehr.
- **Folge:** Gering. Der Verweis „siehe Offline-Zeile“ läuft ins Leere.
- **Empfehlung:** Die Auskunft „Themenseiten und Beispielbögen fehlen“ in dem Fall aus dem letzten bekannten Stand
  weiterführen oder die Meldung am Beispielbogen selbst vollständig machen.
- **Nachprüfung:** Wie oben, dann Neuladen offline: Die Zeile nennt weiter die Lücke.

#### R6-O8 – Geräteuhr: Die Rückfrage „Datum stimmt — jetzt aufräumen?“ nennt bei einem Entwurf eine „Sammlung“ (beobachtet)

- **Kennzeichnung:** beobachtet.
- **Fundstelle:** `src/app/uhr-warnung.tsx`, `stimmt()` (fester Text „Eine Sammlung, die du noch brauchst, vorher
  exportieren: Dazu „Abbrechen“ und die Sammlung öffnen.“).
- **Beobachtung:** Uhrstand 100 Tage alt, nur ein alter Entwurf: Die Warnung sagt „die Namen im eigenen Bogen“ werden
  gelöscht. Die Rückfrage hängt trotzdem „Eine Sammlung, die du noch brauchst … die Sammlung öffnen“ an. Der Fall
  „1 Sammlung“ liest sich außerdem „werden 1 Sammlung endgültig gelöscht“.
- **Folge:** Gering: Ein Satz, der nicht zum Fall passt, in einer Rückfrage mit unumkehrbarer Folge.
- **Empfehlung:** Den Zusatz nur nennen, wenn eine Sammlung betroffen ist, und beim Entwurf den Weg „Fortsetzen“ und
  „Bogen übergeben“ nennen.
- **Nachprüfung:** Wie oben: Nur-Entwurf-Fall und Nur-Sammlung-Fall tragen je ihren passenden Satz.

#### R6-O9 – Geräteuhr zurückgestellt, Sammlung mit Stempeln aus der „früheren Zeitlinie“: Die App löscht beim Start, obwohl die Warnung „löscht nichts“ sagt (gemessen im konstruierten Zustand; Erreichbarkeit Risiko)

- **Kennzeichnung:** gemessen im konstruierten Zustand; ob ein Gerät diesen Zustand erreicht, ist ein Risiko aus der
  Analyse des Codes, nicht beobachtet.
- **Fundstelle:** `src/app/datenschutz-uhr.ts`, `uhrVersatzMs()` (Versatz Gerät minus letzter Stand, auch rückwärts),
  `src/app/uhr-korrektur.ts` (verschiebt `geaendert` um den Versatz), Kern löscht nach 90 Tagen.
- **Beobachtung:** Uhrstand `zuletzt` 100 bzw. 400 Tage in der Zukunft, Sammlung mit `geaendert` = jetzt. Start: Die
  Warnung „Geräteuhr prüfen … (400 Tage danach)“ steht („Bis du antwortest, löscht und anonymisiert die App
  nichts“), aber die Sammlung ist weg (`eeb.einsaetze.v1` = `[]`, `eeb.aufgeraeumt.v1` angelegt, Karte nicht mehr da).
  Bei 30 Tagen bleibt sie, ohne Warnung. In dem Zustand ist der Stempel der Sammlung jünger als der Uhrstand; das ist
  ein Zustand, den nur ein Gerät erreicht, dessen Uhr nach einem angenommenen Sprung zurückgestellt wurde, ohne dass
  die Sammlung zwischendurch angefasst wurde (zum Beispiel nach einem Vorwärtssprung unter 90 Tagen, wenn dann Wochen
  vergehen).
- **Folge:** Selten, aber der Wortlaut der Warnung ist dann falsch, und die Sammlung ist unwiederbringlich weg.
- **Empfehlung:** Den Versatz nur auf Stempel anwenden, die nicht jünger als der letzte Stand sind, oder die Aufräumung
  unter gehaltener Uhr ganz aussetzen.
- **Nachprüfung:** Wie oben: Uhrstand in der Zukunft, frische Sammlung: Sie bleibt, bis die Frage beantwortet ist.
- **Verweis:** Uhr, Löschfristen und Rückwärtssprung im Ganzen: `zerstoerende-handlungen.md` (Geräteuhr) und
  `fehler-und-wiederanlauf.md` (Uhr zurückgestellt, 120 Tage). Hier nur der Fall „Stempel jünger als Uhrstand“.

## Bestätigtes

- **Nachladen der zweiten Stufe mit Wiederholung (R5-O2):** Proxy 12 s Funkloch, 6 s Netz, dreimal, bei 6 Mbit/s: 6 von
  508 nach dem ersten Loch, dann ohne Neuladen bis 508 von 508 nach 89 s („✓ Jetzt offline bereit. Funktioniert
  komplett offline“). Der Zähler fällt nie zurück. „Das Netz hakt — der nächste Versuch läuft von selbst“ erscheint,
  sobald die Zeitgrenze (20 s je Abruf) verstrichen ist, und verschwindet beim nächsten Fortschritt. Im Funkloch
  kommt der Hinweis erst nach der Zeitgrenze, nicht sofort.
- **Fotos der Themenseiten (R5-O4):** Vollständig geladen, Server aus, `setOffline`: alle 37 HTML-Seiten (Status 200),
  alle Bilder geladen (nach Scrollen, die Fotos sind `lazy`), keine fehlgeschlagene Anfrage. Offline 72 bis 81 ms je
  Seite.
- **Feste Warnleiste (R5-O1):** Stub, Tippen in „Vorname“ von Person 1 im Schritt Personal: Leiste „⚠ Nicht gespeichert
  — dieser Browser lässt die App nichts speichern. Jetzt „Bogen übergeben“ (PDF).“ bei `y` = 0, 58 px hoch, bleibt
  bei `scrollY` 700 und am Seitenende im Bild; „Was tun?“ klappt die Einzelheiten und den letzten gesicherten Stand
  auf (~150 px). Nach Neuladen steht der letzte gespeicherte Stand („gespeichert 11:21 Uhr“). Echt voller Speicher:
  Leiste „der Speicher dieses Geräts ist voll“.
- **„wird erzeugt…“ und Sperre (R5-O3, R5-H4, R5-L4):** 30 Bögen, CPU 1/4: Beschriftung „Einsatz wird erzeugt…“ und
  alle PDF-Knöpfe gesperrt nach 1,1 s, danach ~33 s eingefroren, ein Download bei zwei Tipps (Abstand 300 ms).
  Bogen-PDF im Assistenten: drei Tipps, eine Datei („PDF wird erstellt…“ nach 0,5 s). Lageblatt und Blanko-Vordruck
  (Einsatzansicht) ebenso. Die Quittung steht danach direkt unter den Knöpfen. Offen am Rand: „Bogen als PDF“ im
  einzelnen Eintrag nutzt eine eigene Sperre (`einsaetze-ui.tsx`, `bogenPdf`) und nicht die gemeinsame
  (`arbeitet.ts`); zwei verschiedene PDF-Wege gleichzeitig starten zwei Erzeugungen (nicht gemessen).
- **Fenster A/B (R5-O6):** A legt den Einsatz in den Papierkorb, den B offen hat: B zeigt auf der Startseite „Die
  Sammlung „Hochwasser Neckar“ wurde in einem anderen Fenster in den Papierkorb gelegt. Sie lässt sich dort 30 Tage
  lang zurückholen …“. A stellt aus dem Papierkorb wieder her: B blendet den Papierkorb sofort aus (kein Knopf
  „Wiederherstellen“/„Endgültig“ mehr). A verwirft den Entwurf, B im Bogen: feste Leiste „Dieser Bogen wurde in einem
  anderen Fenster gelöscht oder geschlossen. Hier wird nichts gespeichert, bis du entscheidest.“ mit „Neu laden, hier
  verwerfen“ und „Bogen hier wieder speichern“; B speichert beim Weitertippen nichts.
- **Speicher gesperrt (R5-O7):** `SecurityError` beim Schreiben, `SecurityError` beim Zugriff und `QuotaExceededError`-
  Stub: Die Startseite zeigt sofort „⚠ Dieser Browser lässt die App gerade nichts speichern …“, die Offline-Zeile
  endet auf „Dieser Browser speichert nichts, Eingaben gehen beim Schließen verloren.“, im Bogen steht die feste
  Leiste. Keine Seitenfehler.
- **Speicher voll (echt):** Startseite „Gerätespeicher ist voll: 100 % (5 von 5 Mio. Zeichen) … Am meisten belegen:
  „Einsatz 3“ im Papierkorb (33 %) …“. Bogen: Leiste „der Speicher dieses Geräts ist voll“. „‹ Startseite“ mit
  nicht gespeichertem Bogen: Der Bogen bleibt im Arbeitsspeicher, die Startkarte sagt „Nicht gespeichert … Beim
  Schließen gehen die Änderungen verloren — jetzt „Fortsetzen“ und „Bogen übergeben“ (PDF oder QR-Code)“. Einsatz
  importieren, Neue Sammlung, Abrücken: „Speichern fehlgeschlagen — der Speicher dieses Geräts ist voll …“, Status
  unverändert. „Endgültig löschen…“ im Papierkorb mit Rückfrage („es ist die einzige Kopie“) schafft Platz.
- **Geräteuhr nach echter Pause (R5-O5, R5-D1):** Uhrstand 45 Tage alt, Sammlung 80 Tage ruhend: keine Warnung, die
  Startseite kündigt „Wird in 10 Tag(en) automatisch gelöscht“ an. 100 Tage, nichts Altes: keine Frage, Stand rückt
  nach. 100 Tage und Sammlung 100 Tage alt: Warnung „Geräteuhr prüfen: Das Gerät zeigt den 23.10.2026, beim letzten
  Start war der 15.07.2026 (100 Tage davor). Stimmt das heutige Datum? … löscht und anonymisiert die App nichts“, die
  Sammlung bleibt, „Geräteuhr stimmt“ fragt vorher „Datum stimmt — jetzt aufräumen?“ mit Zahl. 100 Tage und alter
  Entwurf: Warnung nennt „die Namen im eigenen Bogen“. Uhrstand 400 Tage in der Zukunft mit Entwurf (die Sammlung
  in diesem Lauf siehe R6-O9): Warnung „(400 Tage danach)“, der Entwurf bleibt, die Warnung steht beim zweiten Start
  noch, „Geräteuhr stimmt“ löst sie ohne Rückfrage auf.
- **Erstladen gedrosselt:** 1,6 Mbit/s, 200 ms: erster Inhalt 1 s, Startseite bedienbar 3 s, Zähler in 0,1-MB-Schritten
  ab 4 s, Kern („Jetzt offline bereit“) nach ~35 s. 600 kbit/s, 300 ms: bedienbar 5,5 s, Kern nach 67 s. Netz zurück
  nach Funkloch: Neu-Registrierung trägt (R4-O1, mit Rest R6-O4).
- **Kaltstart ohne Netz:** Neuladen offline (Server aus): Startseite 0,35 bis 0,6 s, Entwurf, „Fortsetzen“. Im Funkloch
  mit hängender Verbindung: Startseite 0,35 s, Bogen-PDF 2,1 s (mit abgewiesener Verbindung 1,6 s).
- **Exporte offline (Vorrat voll, Server aus):** Übersicht als CSV, Alle Daten als CSV (22 KB), Excel-Liste „Oldenburg“,
  Lageblatt (16 KB), Blanko-Vordruck (13 KB), „Einsatz weitergeben / sichern“ mit 8 Bögen (439 KB): alle Downloads
  entstehen, die „zuletzt …“-Zeilen und Quittungen stehen. „Bogen übergeben“-Dialog (QR-Vollbild mit Einheit und
  Stand, PDF, Link, CSV, Excel, Blanko) funktioniert, das QR-Vollbild zeichnet offline.
- **Importe und Sicherung offline:** „Sicherung erstellen…“ (31 KB) und „Sicherung einspielen…“ (Rundlauf mit Rückfrage
  „Auf diesem Gerät — geht dabei verloren: …“); eine kaputte, eine abgeschnittene und eine fremde Datei werden mit
  klarer Meldung abgewiesen („Die Daten auf diesem Gerät sind unverändert“). „Aus Datei laden“: kaputter Bogen
  wird abgewiesen, ein guter Beispielbogen geht auf, Entwurf „gespeichert · 15:36 Uhr · nur auf diesem Gerät“. „Einsatz
  importieren…“: Sammel-PDF (3 Einheiten) geht, kaputte JSON-Datei wird abgewiesen.
- **Anzeige „gespeichert“:** Speichern ist synchron (kein Aufschub, `useEffect` auf jede Änderung); „✓ gespeichert“
  steht nur nach gelungenem `setItem` und weicht bei Fehler der festen Leiste.
- **Keine Fremdanfragen:** Beim Start mit vollem Vorrat gehen nur Anfragen an die eigene Adresse (und ein Zählpixel
  für die Statistik, hier ohne Netz nicht erreichbar, ohne Wirkung).

## Abschluss

- **Aufgabe geschafft:** ja. Mit Umweg nur bei vollem Speicher (R6-O1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „✓ Funktioniert komplett offline“ im Start-Gerüst, solange noch nichts im Cache liegt
  (R6-O2); und „in den Papierkorb legen schafft Platz“ bei vollem Speicher (R6-O1).
- **Größtes Einsatzrisiko:** Der Speicher ist voll, der Helfer legt die älteste Lage in den Papierkorb wie empfohlen,
  nichts passiert, und die App sagt es nicht (R6-O1).
- **Top-Priorität für die nächste Iteration:** Den Fehler beim Löschen in den Papierkorb sichtbar machen und die
  Anweisung bei vollem Speicher auf den Weg ändern, der wirkt (R6-O1, R6-O5). Danach die Zeitgrenze für Themenseiten im
  Funkloch senken (R6-O3) und das Start-Gerüst neutral machen (R6-O2).

## Abgleich mit Runde 5

Grundlage: [../runde-5/offline-und-speicher.md](../runde-5/offline-und-speicher.md) samt „Stand der Behebung“ und
[../runde-5/README.md](../runde-5/README.md). Die Behebungen aus dem Stand vom 14.10.2026 habe ich einzeln gegen den
Build `03a0011` geprüft.

| Behebung aus Runde 5 | Stand laut Bericht | Bewertung Runde 6 | Beobachtung |
| --- | --- | --- | --- |
| R5-O1 „Nicht gespeichert“ steht im wegscrollenden Kopf | behoben | hält | Feste Leiste bei `y` = 0, 58 px, auch am Seitenende im Bild; „Was tun?“ nennt Einzelheiten und den letzten Stand. Folge zu R5-S4 (Konfliktleiste verdeckt das Feld) nicht eigens geprüft, die Leiste dort stand beim Tippen im Bild. |
| R5-O2 Nachladen gibt beim ersten Fehler auf | behoben | hält, mit Rest | 508 von 508 nach drei Funklöchern ohne Neuladen, „das Netz hakt“ erscheint und verschwindet. Rest: Nach der Netzrückkehr bis zu 60 s Wartezeit (R6-O6, P3). Der Kern hat den entsprechenden Hinweis nicht (R6-O4, P2). |
| R5-O3 „Einsatz weitergeben / sichern“ ohne Rückmeldung, zwei Dateien | behoben | hält | „Einsatz wird erzeugt…“ nach 1,1 s, alle PDF-Knöpfe gesperrt, ein Download bei zwei und drei Tipps. Bogen-PDF im Assistenten ebenso. Der Einzelbogen-PDF im Eintrag nutzt weiter eine eigene Sperre (Rand, nicht gemessen). |
| R5-O4 Fotos der Themenseiten fehlen offline | behoben | hält | 37 von 37 Themenseiten offline mit allen Bildern. Neu und verwandt: Im Funkloch brauchen diese Seiten 5 s (R6-O3, P2); mit Kern, aber ohne Zusatzstufe zeigen sie die Fehlerseite des Browsers (steht in der Zeile, R6-O7). |
| R5-O5 „Geräteuhr prüfen“ bei echter Pause und zuvor zurückgestellter Uhr | behoben | hält, mit Rest | 45 Tage: keine Warnung; 100 Tage ohne Fälliges: keine Frage; mit Fälligem: Warnung mit zwei Möglichkeiten und Rückfrage. Reste: Dialogtext passt beim Entwurf nicht (R6-O8, P3); im konstruierten Rückwärts-Zustand löscht die App trotz Warnung (R6-O9, P3, Risiko). |
| R5-O6 Wortloser Sprung bei Papierkorb im anderen Fenster | behoben | hält | Die Startseite nennt Sammlung und Papierkorb-Frist; auch Wiederherstellen in A wird in B sofort sichtbar; Verwerfen in A: Leiste in B. |
| R5-O7 Gesperrter Speicher: Warnung erst im Bogen | behoben | hält | Warnung und angepasste Offline-Zeile auf der Startseite in allen drei Sperrfällen, keine Seitenfehler. |
| R4-O1 Erstladen bricht ab (aus Runde 5: hält, mit Rest) | behoben | hält, Rest bleibt | Neu-Registrierung trägt. Rest aus Runde 5 („Laden abgebrochen“ bleibt stehen, obwohl die App selbst weiterlädt): Jetzt nur ~1 s, danach läuft es von selbst. Es bleibt der Hinweis ohne Stillstandsauskunft im Funkloch (R6-O4). |
| R4-O2 „PDF erzeugen“ ohne Baustein | behoben | nicht neu geprüft | Kein Lauf ohne Service Worker mit fehlendem Baustein; Stand aus Runde 5 gilt. |

Bilanz: Alle sieben Behebungen aus Runde 5 halten. Keine hat sich ins Gegenteil verkehrt. Drei halten mit einem Rest
(R5-O2, R5-O5, R4-O1 über R6-O4), die übrigen ohne. Neu in Runde 6: R6-O1 (P1, Lücke neben der Warnzeile bei vollem
Speicher, nicht aus einer Behebung entstanden), R6-O2 bis R6-O4 (P2) und R6-O5 bis R6-O9 (P3). R6-O2 und R6-O3 liegen
in Teilen, die in Runde 5 nicht geprüft wurden (Start-Gerüst, Laufzeit-Route für `*.html`). Als Verweis, nicht gezählt:
R6-E2 in `fehler-und-wiederanlauf.md` (Speicherfehler beim Übernehmen am Meldekopf).

## Stand der Behebung

Stand 23.10.2026, auf demselben Zweig mit Typprüfung, Unit-Tests, Verhaltenstests (137 von 137 Szenarien) und, wo es sich messen ließ, Nachmessung im Browser (Playwright, Produktionsbuild). 8 behoben, 0 teilweise, 1 offen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R6-O1 | behoben | „In den Papierkorb“ zeigt bei vollem Speicher „Nicht gelöscht“ mit der Ursache (Karte und Einsatzansicht); die Platz-Anweisung nennt jetzt den Weg, der wirkt (Papierkorb leeren oder gesicherten Einsatz endgültig löschen). Unit-Test mit gesperrtem Speicher. |
| R6-O2 | behoben | Das Start-Gerüst sagt neutral „Nach dem ersten Laden funktioniert die App auch ohne Netz“. |
| R6-O3 | behoben | HTML-Themenseiten: Zeitgrenze `NetworkFirst` 1 s statt 5 s (`vite.config.ts`). Nicht im Browser mit Proxy nachgemessen. |
| R6-O4 | behoben | Steht der Zähler bei lebender Registrierung still, sagt die Zeile „das Netz hakt, das Laden geht weiter“; „Laden abgebrochen“ erst beim zweiten Stillstand nach Neuanlage. |
| R6-O5 | behoben | Einheitliche Anweisung in allen Texten („Zuerst sichern, dann Platz schaffen …, die Sicherung selbst schafft keinen Platz“). |
| R6-O6 | behoben | Nachladepause höchstens 20 s (vorher 60 s). |
| R6-O7 | behoben | Der letzte Stand der zweiten Stufe liegt in `eeb.offline-zusatz.v1`; die Zeile nennt die Lücke auch nach Neuladen ohne Netz (ISK 3.3 D2o). |
| R6-O8 | behoben | Der Rettungssatz der Rückfrage passt zum Fall (Sammlung exportieren bzw. Bogen übergeben); „wird 1 Sammlung“ statt „werden“. |
| R6-O9 | offen | Nicht geändert. Der Zustand (Uhrstand in der Zukunft, frische Sammlung) gilt nach der geprüften Uhr als alt; ein Eingriff in die Ablage-Hülle würde die Stempel beim Zurückschreiben verschieben. Grenze in Arc42. |
