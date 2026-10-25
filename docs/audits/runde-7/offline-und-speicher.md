# Audit Runde 7 – Offline und Speicher (Erstladen, Funkloch, Offline-Betrieb, voller Speicher, zwei Fenster, Übergabe, Sicherung, Lagemonitor, Geräteuhr)

Stand: 23.10.2026 · Code-Stand: Commit `a52f20a` (Produktionsbuild, `vite preview` auf Port 4173) · Prüfer: Rollenaudit
`thw-offline-resilience-reviewer`

Reiner Prüfbericht, keine Codeänderung. Schwerpunkt waren die Umbauten aus Runde 6, soweit sie Offline-Betrieb und
Speicher berühren: Offline-Zeile und Nachladen, „In den Papierkorb“ bei vollem Speicher, Start-Gerüst, Themenseiten im
Funkloch, Geräteuhr-Rückfrage, Exportstand und Rückfrage nach dem QR-Vollbild, Zwei-Fenster-Abgleich, Rückweg im Schritt
Personal im Sitzungsspeicher, Deckel bei großer Schrift, Lagemonitor, Zurück-Verlauf der Startseitenfenster.

## Prüfaufbau

- **Server:** der gemeinsame Server auf Port 4173, nicht neu gebaut, nicht angehalten. Für die Läufe mit hängender
  Leitung ein eigener Durchreich-Proxy auf Port 4177 (nur lesend gegen 4173, am Ende beendet). Er kennt drei Lagen:
  *normal*, *hängt* (Verbindung wird angenommen, nie beantwortet) und *abgewiesen*. Nur so erfasst die Prüfung auch die
  Abrufe des Service Workers; `setOffline` allein erfasst sie nicht.
- **Echtes Offline:** erst mit Netz laden, bis Bereitschaftszeile **und** Steuerung durch den Service Worker da sind
  (`navigator.serviceWorker.controller`), dann `setOffline(true)` und Neuladen. Je Lauf ein eigener Browser-Kontext.
- **Geräte:** Telefon 360 × 640 als Grundeinstellung, dazu 320 × 568 und 640 × 360 quer; `isMobile`/`hasTouch`, Locale
  de-DE; große Schrift per `html{font-size:200%}`. Tablet und Browser-Zoom nicht eigens: Die Befunde hier hängen nicht
  an der Breite.
- **Zustände:** `localStorage`-Seeds aus `examples/thw/` (Entwurf 001 und 004, Verstärkter Bergungszug, Sammlung
  „Hochwasser Musterstadt“ mit 6 Einheiten), alle `uebung: false`, Stand auf heute. Speicher echt gefüllt (bis
  `QuotaExceededError`, sowie zu 70, 85 und 95 %); `setItem` per Stub gesperrt; Uhrstand `eeb.uhr.v1` in Minuten seit
  2020 gesetzt (30, 100, 400 Tage in der Zukunft, 100 Tage in der Vergangenheit).
- **Zwei Fenster:** zwei Seiten im selben Kontext, ein drittes Fenster für den Lagemonitor
  (`?lagemonitor=s1`).
- Getestet habe ich zuerst ohne Blick in die Berichte. Danach habe ich den Runde-6-Bericht dieser Rolle samt „Stand
  der Behebung“ gelesen und die Behebungen einzeln nachgestellt. Bildschirmfotos habe ich angesehen.
- Skripte und Bildschirmfotos: Scratchpad `runde7/offline/` (nicht im Repo).

**Nicht prüfbar:** Kamera-Scan und Nahbereichs-Weitergabe, echter Flugmodus und echte Funkzelle (der Proxy bildet die
Leitung nach, nicht das Funkmodul), Speicherräumung durch iOS/Safari, Entscheidung des Browsers über „dauerhaften
Speicher“, Update-Banner bei neuer Fassung (dafür wäre ein zweiter Build nötig), native Builds.

## Urteil

Die Offline-Fähigkeit trägt. Nach dem Erstladen (3,7 bis 7,8 s unter Last durch die anderen Prüfer) gehen Bogen,
Übergabe, QR-Vollbild, Sicherung, Sammlung, Lagemonitor und Importe ohne Netz; „✓ gespeichert · nur auf diesem Gerät“
steht synchron nach jedem Tippen, bei gesperrtem Speicher weicht es der festen Leiste „Nicht gespeichert“. Der
Exportstand (gezeigt, bestätigt, „seit der Übergabe geändert“) und die Rückfrage nach dem QR-Vollbild verhindern, dass
jemand „übergeben“ glaubt, der nur Teil 1 von 7 gezeigt hat. Voller Speicher meldet jetzt auch beim Papierkorb. Acht der
neun Behebungen aus Runde 6 für diese Rolle halten; R6-O9 ist, wie angekündigt, offen.

Reibung bleibt an einer Stelle, die aus einer Behebung entstanden ist: Der Deckel für die feste Warnleiste bei großer
Schrift hält die Leiste auf die Hälfte des Fensters, aber der zentrale Satz „Eingaben hier werden erst wieder gespeichert,
wenn du entscheidest“ und die beiden Entscheidungsknöpfe liegen dann hinter einem inneren Scrollbereich ohne Hinweis
(R7-O1, P2). Dazu kommen sechs P3, überwiegend Wortlaut und Randfälle.

Die Aufgaben „offline weiterarbeiten, übergeben, sichern, in der Sammlung zusammenführen“ gelingen ohne fremde Hilfe.

## Befunde

P0: keine. P1: keine. P2: eine. P3: sechs.

### P2

#### R7-O1 – Zwei-Fenster-Leiste bei großer Schrift: Der Satz „wird nicht gespeichert“ und die Entscheidungsknöpfe liegen hinter einem Scrollbereich in der Leiste (gemessen)

- **Priorität:** P2
- **Kennzeichnung:** gemessen (drei Fenstergrößen) und im Bildschirmfoto beobachtet. Nebenwirkung der Behebung R6-M1
  („auf die Hälfte des Fensters gedeckelt und rollt in sich“, Runde 6: „nicht bei 200 % gemessen“).
- **Fundstelle:** Bogen offen, Schritt 2 „Einsatz“, zweites Fenster hat den Entwurf geändert; feste Leiste
  „Dieser Bogen wurde in einem anderen Fenster geändert“ (`src/app/feste-warnung.tsx`, `src/app/fenster-abgleich.tsx`).
- **Beobachtung:** Bei `html{font-size:200%}` ist die Leiste 320 px hoch (360 × 640: 50 %), 284 px (320 × 568: 50 %),
  178 px (640 × 360: 49 %). Der Inhalt ist 772 px hoch (`overflow-y: auto`, `max-height: 320px`). Im Bild endet die Leiste
  mitten im Satz: „… hier: Stand 23.10.26, 18:10 Uhr, 10 Personen). Eingaben hier werden erst …“. „Stand aus dem anderen
  Fenster laden“ liegt bei y 502 bis 646 und „Meine Fassung behalten“ bei y 662 bis 764, beide jenseits der
  Leistenkante (320 px); erst nach Scrollen innerhalb der Leiste erreichbar. Es gibt keinen Pfeil, keinen
  Anschnitt-Schatten und keinen Hinweis. Quer (640 × 360) steht nur „Entscheiden“ und der Anfang „Dieser Bogen wurde in
  einem anderen Fenster geändert (dort: „THW Freiburg Fachgruppe …“. Währenddessen speichert das Fenster nichts: Nach
  „A“ im ersten und „B“ im zweiten Fenster steht im Speicher nur „A“. Die feste Leiste „Nicht gespeichert — Speicher
  voll“ ist dagegen bei 200 % lesbar (276 px = 43 bis 49 %, Satz und „Was tun?“ im Bild).
- **Erwartung der Rolle:** Wo eine Eingabe nicht ankommt, steht das in den ersten Worten sichtbar, und die Entscheidung
  liegt ohne Scrollen im Bild.
- **Folge:** Wer bei großer Schrift weitertippt, sieht „geändert“, aber nicht „hier wird nichts gespeichert“. Er tippt
  weiter, schließt die App, und die Eingaben dieses Fensters sind weg. Gering wahrscheinlich (zwei Fenster, große
  Schrift), aber der Fehler ist still.
- **Empfehlung:** Den Folgesatz an den Anfang („Hier wird nichts gespeichert — Bogen wurde in einem anderen Fenster
  geändert“), die Herkunftsangaben nach hinten. Die zwei Knöpfe in der Leiste fest im Bild halten oder die Leiste bei
  großer Schrift auf „Entscheiden“ mit sichtbarem Satz beschränken. Ein Rollhinweis, wenn der Inhalt höher ist als die
  Leiste.
- **Nachprüfung:** Zwei Fenster, Schrift 200 %, 360 × 640, 320 × 568 und 640 × 360: In der Leiste stehen ohne Scrollen
  „hier wird nichts gespeichert“ und beide Knöpfe (oder ein „Entscheiden“, das beides öffnet und sichtbar ist).
- **Verweis:** Geometrie und Deckel im Ganzen: R6-M1 und R6-M5 in `mobile-ui.md`.

### P3

#### R7-O2 – Zwei-Fenster-Vergleich nennt gleiche Zahlen auf beiden Seiten; der Unterschied ist nicht erkennbar (beobachtet)

- **Priorität:** P3
- **Kennzeichnung:** beobachtet.
- **Fundstelle:** feste Leiste „Dieser Bogen wurde in einem anderen Fenster geändert (dort: …, hier: …)“.
- **Beobachtung:** Ein Fenster ändert nur den Text „Einsatzort / Auftrag“. Die Leiste im anderen Fenster nennt
  „dort: … Stand 23.10.26, 17:49 Uhr, 38 Personen · hier: Stand 23.10.26, 17:49 Uhr, 38 Personen“. Minute und Zahl
  sind gleich, was abweicht, steht nirgends.
- **Erwartung der Rolle:** Vor einer Entscheidung, die eine Fassung verdrängt, erfährt man, was sich unterscheidet.
- **Folge:** Der Helfer wählt blind. Daten gehen nicht verloren („Stand laden“ und „Meine Fassung behalten“ legen die
  andere Fassung auf den Rückholplatz), aber er muss danach suchen.
- **Empfehlung:** Den geänderten Abschnitt benennen („dort geändert: Einsatz“), mindestens aber die Sekunde oder das
  geänderte Feld.
- **Nachprüfung:** Ein Feld im anderen Fenster ändern: Die Leiste nennt es.

#### R7-O3 – Lagemonitor sagt „nicht (mehr) vorhanden“, wenn die Sammlung im Papierkorb liegt (beobachtet)

- **Priorität:** P3
- **Kennzeichnung:** beobachtet.
- **Fundstelle:** zweites Fenster `?lagemonitor=<Kennung>`, Hauptfenster: „Löschen…“ → „In den Papierkorb“.
- **Beobachtung:** Der Lagemonitor wechselt innerhalb von drei Sekunden auf „Dieser Einsatz ist auf diesem Gerät nicht
  (mehr) vorhanden.“ mit „Schließen“, ohne Hinweis auf den Papierkorb. „Wiederherstellen“ im Hauptfenster bringt die
  Anzeige ohne Neuladen zurück; die Daten waren nie weg.
- **Erwartung der Rolle:** Eine Wandanzeige, die plötzlich leer wird, sagt, warum und wie es zurückgeht.
- **Folge:** An einer Führungsstelle sieht man „nicht vorhanden“ und hält die Lage für verloren, obwohl 30 Tage lang
  alles im Papierkorb liegt.
- **Empfehlung:** „Dieser Einsatz liegt im Papierkorb (30 Tage) — im Hauptfenster wiederherstellen.“ Bei endgültig
  gelöscht der bisherige Text.
- **Nachprüfung:** Einsatz in den Papierkorb legen: Der Monitor nennt den Papierkorb.

#### R7-O4 – Geräteuhr-Rückfrage bei Entwurf: „wird die Namen … gelöscht“, und der Bogen wird nicht genannt (beobachtet; Rest von R6-O8)

- **Priorität:** P3
- **Kennzeichnung:** beobachtet (Uhrstand 100 Tage alt, alter Entwurf).
- **Fundstelle:** Warnung „Geräteuhr prüfen“ und Rückfrage „Datum stimmt — jetzt endgültig löschen?“,
  `src/app/uhr-warnung.tsx`.
- **Beobachtung:** Die Warnung sagt „Wenn das Datum stimmt, wird die Namen im eigenen Bogen endgültig gelöscht.“ und die
  Rückfrage „Damit wird die Namen im eigenen Bogen endgültig gelöscht — nicht im Papierkorb.“ (Plural mit „wird“). Der
  Rettungssatz passt jetzt zum Fall („Den eigenen Bogen vorher sichern: … ‚Fortsetzen‘ … ‚Bogen übergeben…‘“). Welcher
  Bogen betroffen ist, steht nicht; bei der Sammlung steht der Name und „vor 1 Minute geändert“.
- **Erwartung der Rolle:** Eine Rückfrage mit unumkehrbarer Folge liest sich fehlerfrei und nennt das Betroffene.
- **Folge:** Gering: ein Stolpern in einem Satz, den der Helfer genau lesen soll.
- **Empfehlung:** „werden die Namen“; den Bogen nennen („THW Albstadt Zugtrupp …, zuletzt bearbeitet 15.07.“).
- **Nachprüfung:** Nur-Entwurf-Fall: Satz grammatisch richtig, Bogen genannt.

#### R7-O5 – Rückweg im Schritt Personal bleibt nach „Verwerfen“ im Sitzungsspeicher, mit Name, Funktionen und Rufnummern (gemessen; Ablauf nach 15 Minuten ist Risiko)

- **Priorität:** P3
- **Kennzeichnung:** gemessen (Verwerfen); Risiko (Ablauf): Aus `wegLesen` in `src/app/schritte/personal.tsx` ergibt sich,
  dass abgelaufene Einträge ignoriert, nicht entfernt werden. Nicht eigens gemessen.
- **Fundstelle:** Schritt Personal, „Person entfernen“; Startseite „Verwerfen“; `sessionStorage`-Schlüssel
  `eeb.personal.rueckweg` (Behebung R6-S4/R6-D4).
- **Beobachtung:** Person „Lang, Sabine“ entfernen, danach „‹ Startseite“ und „Verwerfen“: Der Bogen liegt auf dem
  Rückholplatz, die Startseite sagt „Angefangener Bogen verworfen“. `sessionStorage` enthält weiterhin
  `eeb.personal.rueckweg` mit Vor- und Nachname, Rolle, Funktionen. „Alle Daten löschen“ räumt ihn weg (Code,
  `alleDatenLoeschen`).
- **Erwartung der Rolle:** Was „entfernt“ oder „verworfen“ heißt, liegt danach nicht mehr in einem lesbaren Speicher
  dieses Tabs.
- **Folge:** Gering: Die Daten liegen nur bis zum Schließen des Tabs im Sitzungsspeicher und sind in ISK 3.3 D2m (c)
  beschrieben. Auf einem geteilten Gerät mit offenem Tab bleibt der Name einer ausdrücklich entfernten Person lesbar.
- **Empfehlung:** Beim Verwerfen, Schließen und Übergeben des Bogens und beim Ablauf der 15 Minuten den Schlüssel
  entfernen; ISK/DSFA entsprechend nachziehen.
- **Nachprüfung:** Person entfernen, Bogen verwerfen: kein Schlüssel `eeb.personal.rueckweg` mehr im `sessionStorage`.

#### R7-O6 – Themenseiten im Funkloch: erste Inhalte nach 1,3 s statt sofort (gemessen; Rest von R6-O3)

- **Priorität:** P3
- **Kennzeichnung:** gemessen (Proxy *hängt*, Vorrat vollständig, 508 von 508).
- **Fundstelle:** `vite.config.ts`, Laufzeit-Route für `*.html` (`NetworkFirst`, 1 s).
- **Beobachtung:** `thw.html` 1 344 ms, `feuerwehr.html` 1 274 ms bis zum ersten Inhalt (Runde 6: 5 s); `anleitung.html`
  270 ms und die Startseite 589 ms (Precache). Ohne jede Verbindung (`setOffline`) sofort.
- **Folge:** Gering: eine Sekunde Leere pro Themenseite im Funkloch mit Balken.
- **Empfehlung:** Für Seiten im Vorrat zuerst den Cache bedienen und im Hintergrund auffrischen.
- **Nachprüfung:** Vorrat voll, Proxy *hängt*, Themenseite: Inhalt unter 0,5 s.

#### R7-O7 – R6-O9 bleibt: Uhrstand in der Zukunft, frische Sammlung ist weg, obwohl die Warnung „löscht nichts“ sagt (gemessen im konstruierten Zustand)

- **Priorität:** P3
- **Kennzeichnung:** gemessen im konstruierten Zustand; ob ein Gerät ihn erreicht, bleibt Risiko (Behebungsstand
  Runde 6: „offen“, Grenze in Arc42).
- **Fundstelle:** Start mit `eeb.uhr.v1` 100 bzw. 400 Tage in der Zukunft, Sammlung „Hochwasser Musterstadt“ eben
  angelegt.
- **Beobachtung:** 30 Tage: Sammlung bleibt, keine Warnung. 100 und 400 Tage: Warnung „Geräteuhr prüfen … (100 Tage
  danach). … Bis du antwortest, löscht und anonymisiert die App nichts.“, zugleich `eeb.einsaetze.v1` = `[]`,
  `eeb.aufgeraeumt.v1` mit der Sammlung, die Startseite meldet „… gelöscht am 31.01.2027“ (ein Datum in der Zukunft).
  Nach Neuladen steht die Warnung weiter. Dasselbe, mit „Invalid Date (1238983256 Tage danach)“ im Text, wenn der
  Uhrstand kein gültiger Minutenwert ist (zum Beispiel ein Wert aus einer fremden Fassung).
- **Folge:** Selten; wenn es eintritt, ist der Wortlaut falsch und der Einsatz nur noch als Hinweis „greift auf einen
  Export oder das Papier zurück“ da.
- **Empfehlung:** Wie in Runde 6: Aufräumen unter gehaltener Uhr aussetzen; zusätzlich einen ungültigen Uhrstand
  verwerfen statt anzuzeigen.
- **Nachprüfung:** Uhrstand in der Zukunft, frische Sammlung: Sie bleibt, bis die Frage beantwortet ist; ungültiger
  Wert: keine Warnung mit „Invalid Date“.
- **Verweis:** R6-O9 in `offline-und-speicher.md` (Runde 6), Uhr im Ganzen in `zerstoerende-handlungen.md`.

## Bestätigtes

- **Erstladen und Bereitschaft:** Die Zeile „⏳ Wird für den Offline-Betrieb geladen: 0,0 von 6,9 MB“ steht in
  der ersten Sekunde, „✓ Jetzt offline bereit“ erscheint genau dann, wenn der Service Worker die Seite steuert
  (vier Läufe: 3,7 bis 7,8 s, jeweils Neuladen offline erfolgreich). Wer zu früh offline geht, sieht „⚠ Noch nicht offline
  bereit (1,9 von 6,9 MB geladen) — ohne Netz diese Seite nicht neu laden; beim nächsten Netz wird der Rest geladen“. Das
  Start-Gerüst sagt neutral „Nach dem ersten Laden funktioniert die App auch ohne Netz“ (R6-O2 hält; der Zusatz
  „Funktioniert komplett offline“ steht nicht mehr im Gerüst).
- **Kern im Funkloch (R6-O4):** Verbindung hängt bei 3,9 MB: Nach rund 22 s steht „5,1 von 6,9 MB — das Netz hakt, das
  Laden geht weiter, sobald es wieder da ist. Bitte geöffnet lassen.“ Netz zurück: nach 0,5 s „✓ Jetzt offline bereit“,
  nach 9 s „Funktioniert komplett offline“. Kein „Laden abgebrochen“.
- **Zweite Stufe (R6-O6, R6-O7):** Pause höchstens 20 s; nach 80 s Funkloch lief der Zähler 8 s nach der Rückkehr
  wieder. Nach Neuladen ohne Netz nennt die Zeile die Lücke: „Beispielbögen und Themenseiten fehlen noch (140 von 508),
  sie folgen beim nächsten Netz“ (`eeb.offline-zusatz.v1`).
- **Speicher voll (R6-O1, R6-O5):** Echt gefüllt, „Löschen…“ → „In den Papierkorb“: „Nicht gelöscht — Der Speicher
  dieses Geräts nimmt nichts mehr an … Platz schafft nur Löschen …“, die Warnzeile nennt den Weg, der wirkt, und „die
  Sicherung selbst schafft keinen Platz; bei vollem Speicher kostet schon das Ablegen in den Papierkorb Platz“. Warnung
  ab 85 % („zu 85 % (4,3 von 5 Mio. Zeichen) belegt“), bei 70 % keine. „Abgleich übernehmen“ bei vollem Speicher:
  „Speichern fehlgeschlagen — der Speicher dieses Geräts ist voll“. Feste Leiste „Nicht gespeichert“ bei Stub und echt
  voll, „Was tun?“ klappt auf.
- **Anzeige „gespeichert“:** Der Speicher ist nach dem Tippen sofort geschrieben (0 ms), die Zeile „✓ gespeichert · 17:48 Uhr ·
  nur auf diesem Gerät“ stimmt mit dem Inhalt von `eeb.entwurf.v1` überein.
- **Übergabe offline und Exportstand:** QR-Vollbild zeichnet offline („Teil 1 von 7“). Schließt man nach Teil 1, fragt die
  Rückfrage „Teil 2 von 7 wurde noch nicht gezeigt … Ohne ihn hat die Gegenstelle den Bogen nicht.“ mit „Teil 2 von 7
  zeigen“ und „Trotzdem schließen“; nach „Trotzdem schließen“ steht kein Übergabevermerk. Nach allen sieben Teilen
  (je 1,7 s) fragt die App „Hat die Gegenstelle alle 7 Teile gescannt? Die App kann das nicht selbst sehen.“ mit „Ja,
  gescannt — übergeben“, „Nicht sicher“, „← Code wieder zeigen“. „Ja“: „✓ Übergeben 17:45 Uhr (bestätigt) — seitdem
  unverändert.“ „Nicht sicher“: „QR-Code gezeigt 18:15 Uhr — Empfang nicht bestätigt.“ mit „Gegenstelle hat ihn — als
  übergeben vermerken“. Nach einer Änderung: „⚠ Seit der Übergabe 17:47 Uhr geändert — neu übergeben …“.
- **Zwei Fenster:** Das zweite Fenster speichert nichts, sagt „in einem anderen Fenster geändert“ mit beiden Ständen und
  zwei Wegen; der Speicher behält die Fassung des ersten Fensters.
- **Doppelte Wege:** „In Einsatz-Sammlung ablegen“ zweimal hintereinander legt keinen zweiten Eintrag an (7 Einträge,
  nicht 8); dieselbe Datei zweimal über „Bögen einlesen…“ meldet „bereits vorhanden“ (7 Einträge).
- **Zurück-Verlauf der Startseitenfenster:** Datensicherung, „Alle Daten löschen“ und Übergabe schließen mit „Zurück“,
  die Seite bleibt, der Bogen bleibt offen; „Zurück“ aus dem Bogen führt zur Startseite, „Vor“ zurück in den Bogen.
- **Sicherung offline:** „Sicherung erstellen…“ liefert `eeb-sicherung-2026-10-23.json`, der Dialog nennt danach „Letzte
  Sicherung auf diesem Gerät erstellt: 23.10.26, 18:06 Uhr“.
- **Lagemonitor:** läuft offline, aktualisiert Zahlen und „letzte Meldung vor 1 Min / gerade eben“ innerhalb von vier
  Sekunden nach einer Änderung im Hauptfenster; kommt nach „Wiederherstellen“ ohne Neuladen zurück (Wortlaut siehe R7-O3).
- **Geräteuhr (R6-O8):** Nur-Sammlung-Fall: „wird 1 Sammlung endgültig gelöscht … Eine Sammlung, die du noch brauchst,
  vorher exportieren“; Nur-Entwurf-Fall mit passendem Rettungssatz (Rest siehe R7-O4).
- **Deckel bei großer Schrift:** Die Leiste „Nicht gespeichert“ nimmt bei 200 % 43 bis 49 % des Fensters, Satz und
  „Was tun?“ stehen im Bild (Rest der Zwei-Fenster-Leiste siehe R7-O1).
- **Keine Fremdanfragen:** Beim Start mit vollem Vorrat gehen nur Abrufe an die eigene Adresse.

## Abgleich mit Runde 6

Grundlage: `docs/audits/runde-6/offline-und-speicher.md` samt „Stand der Behebung“ (8 behoben, 0 teilweise, 1 offen).
Jede Behebung habe ich gegen den Build `a52f20a` nachgestellt.

| Befund Runde 6 | Stand laut Bericht | Bewertung Runde 7 | Beobachtung |
| --- | --- | --- | --- |
| R6-O1 Papierkorb bei vollem Speicher scheitert stumm (P1) | behoben | hält | „Nicht gelöscht“ mit Ursache und Weg; Warnzeile nennt den Weg, der wirkt. Einsatzansicht („Einsatz löschen…“) nicht eigens geprüft. |
| R6-O2 Start-Gerüst „komplett offline“ (P2) | behoben | hält | Gerüst: „Nach dem ersten Laden funktioniert die App auch ohne Netz.“ |
| R6-O3 Themenseiten 5 s im Funkloch (P2) | behoben (nicht gemessen) | hält, mit Rest | 1,3 s statt 5 s gemessen (R7-O6, P3). |
| R6-O4 Kern im Funkloch ohne Auskunft (P2) | behoben | hält | Nach rund 22 s „das Netz hakt … geht weiter“, danach ohne „abgebrochen“. |
| R6-O5 Widersprüchliche Platz-Anweisung (P3) | behoben | hält | Warnleiste, Startseite und Datensicherung sagen dasselbe. |
| R6-O6 Nachladen bis 60 s Pause (P3) | behoben | hält | Nach 80 s Funkloch lief der Zähler 8 s nach der Rückkehr weiter. |
| R6-O7 Offline-Zeile verliert Auskunft nach Neuladen (P3) | behoben | hält | „fehlen noch (140 von 508)“ nach Neuladen ohne Netz. |
| R6-O8 Rückfrage Geräteuhr nennt „Sammlung“ beim Entwurf (P3) | behoben | hält, mit Rest | Rettungssatz passt; „wird die Namen“ bleibt (R7-O4, P3). |
| R6-O9 Uhr zurückgestellt: Aufräumen trotz Warnung (P3) | offen | offen, unverändert | Gemessen bei 100 und 400 Tagen (R7-O7, P3). |

Nebenwirkungen der Runde-6-Änderungen, die ich gesucht habe:

| Änderung Runde 6 | Nebenwirkung gefunden? |
| --- | --- |
| Deckel für Warnleisten bei großer Schrift (R6-M1) | Ja: Folgesatz und Knöpfe hinter innerem Scrollen (R7-O1, P2). |
| Rückweg im Schritt Personal im Sitzungsspeicher (R6-S4, R6-D4) | Rest: bleibt nach „Verwerfen“ lesbar (R7-O5, P3). |
| Rückfrage im QR-Vollbild, Exportstand | Nein; Rückfrage, Vermerk und „Nicht sicher“ stimmen, kein Vermerk nach Teilanzeige. |
| Zurück-Verlauf der Startseitenfenster | Nein. |
| Zwei-Fenster-Abgleich mit Rückfrage und Stand | Rest: Vergleich zeigt gleiche Zahlen (R7-O2, P3). |
| Lagemonitor mit Datenstand | Rest: Wortlaut bei Papierkorb (R7-O3, P3). |
| Papier-Abgleich | Nein; bei vollem Speicher meldet er „Speichern fehlgeschlagen“, nichts wird teilweise übernommen. |
| Geräteuhr-Rückfrage | Rest siehe R7-O4 und R7-O7. |

Bilanz: Alle neun Behebungen aus Runde 6 für diese Rolle sind gegen den Build geprüft; acht halten (zwei mit einem
Rest), eine ist offen wie angekündigt. Neu in Runde 7: R7-O1 (P2) und R7-O2 bis R7-O7 (P3).

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Wer bei großer Schrift die Zwei-Fenster-Leiste liest, versteht „geändert“, aber nicht, dass
  sein Fenster nichts mehr speichert (R7-O1).
- **Größtes Einsatzrisiko:** Weitertippen in einem Fenster, das stillschweigend nichts speichert, weil der Folgesatz
  hinter der Leistenkante liegt (R7-O1).
- **Top-Priorität für die nächste Iteration:** Den Folgesatz „hier wird nichts gespeichert“ an den Anfang der
  Zwei-Fenster-Leiste setzen und die Entscheidung bei großer Schrift ohne Scrollen erreichbar machen (R7-O1).
