# Audit Runde 8 – Offline und Speicher (Erstladen, Funkloch, voller Speicher, zwei Fenster, Sicherung, Papier-Abgleich, Lagemonitor, Geräteuhr, unlesbare Daten)

Stand: 24.10.2026 · Code-Stand: Commit `3fee6e5` (Produktionsbuild, `vite preview` auf Port 4173) · Prüfer: Rollenaudit
`thw-offline-resilience-reviewer`

Reiner Prüfbericht, keine Codeänderung. Schwerpunkt waren die Umbauten aus Runde 7, soweit sie Offline-Betrieb und
Speicher berühren: Zwei-Fenster-Leiste mit Unterschiedstexten, Geräteuhr-Halt beim zweiten Lesen und Hinweis im
Assistenten, Beiseitelegen unlesbarer Daten (`eeb.unlesbar.v1`), Papier-Abgleich im Sitzungsspeicher, Lagemonitor
(Papierkorb-Wortlaut, Telefonansicht), Rückweg im Schritt Personal, Themenseiten mit `StaleWhileRevalidate`, Layout bei
großer Schrift.

## Prüfaufbau

- **Server:** der gemeinsame Server auf Port 4173, nicht neu gebaut, nicht angehalten. Für die Läufe mit hängender oder
  toter Leitung ein eigener Durchreich-Proxy auf Port 4291 (nur lesend gegen 4173; Lagen *normal*, *hängt*, *tot*; am
  Ende per PID beendet). `setOffline` allein erfasst die Abrufe des Service Workers nicht, deshalb der Proxy.
- **Echtes Offline:** erst mit Netz laden, bis „✓ Jetzt offline bereit“ **und** `navigator.serviceWorker.controller`
  da sind, dann Netz weg und Neuladen. Je Lauf ein eigener Browser-Kontext.
- **Geräte:** Telefon 360 × 640 als Grundeinstellung, dazu 320 × 568 und 640 × 360 quer; `isMobile`/`hasTouch`, Locale
  de-DE; große Schrift per `html{font-size:…%}` (100 bis 250 %). Tablet und Browser-Zoom nicht eigens: Die Befunde
  hängen nicht an der Breite, außer R8-O1 (gemessen über die Schriftstufen).
- **Zustände:** `localStorage`-Seeds aus `examples/thw/` (Entwurf Verstärkter Bergungszug, Sammlung „Hochwasser
  Musterstadt“ mit 6 Einheiten, 1 Einheit bei vollem Speicher), alle `uebung: false`, Stand auf heute. Speicher per
  `setItem`-Stub gesperrt (`QuotaExceededError`); Uhrstand `eeb.uhr.v1` (JSON `{"zuletzt": Minuten seit 2020}`) 100 Tage
  vor und zurück, ungültig; beschädigte Texte in `eeb.entwurf.v1`, `eeb.einsaetze.v1`, `eeb.vorlagen.v1`,
  `eeb.absenderkarte.v1`, `eeb.einsaetze-papierkorb.v1`.
- **Zwei Fenster:** zwei Seiten im selben Kontext, ein drittes für den Lagemonitor (`?lagemonitor=s1`).
- Zuerst ohne Blick in die Berichte getestet. Danach Bericht Runde 7 dieser Rolle und „Stand der Behebung“ gelesen und
  jede Behebung nachgestellt. Bildschirmfotos habe ich angesehen.
- Skripte und Bildschirmfotos: Scratchpad `runde8/o/` (nicht im Repo).

**Nicht prüfbar:** Kamera-Scan und Nahbereichs-Weitergabe, echter Flugmodus und echte Funkzelle, Speicherräumung durch
iOS/Safari, Update-Banner bei neuer Fassung (dafür wäre ein zweiter Build nötig), native Builds, Wiederherstellung des
Sitzungsspeichers nach Prozess-Ende des Browsers.

## Urteil

Die Offline-Fähigkeit trägt weiter, und Runde 7 hat die Reibung dieser Rolle fast vollständig beseitigt. Nach dem
Erstladen gehen Bogen, Übergabe, Sicherung, Sammlung und Lagemonitor ohne Netz; wer zu früh offline geht, wird gewarnt
(„⚠ Noch nicht offline bereit (4,0 von 6,9 MB geladen) — ohne Netz diese Seite nicht neu laden“). Voller Speicher wird
an jeder geprüften Stelle laut gemeldet und nennt den Weg, der wirkt (Entwurf: „Nicht gespeichert … Jetzt ‚Bogen
übergeben‘“; Einlesen in die Sammlung: „Nicht aufgenommen: 1 Bogen … die Datei selbst ist in Ordnung“). Die Zwei-Fenster-
Leiste sagt jetzt zuerst „Hier wird nichts gespeichert“, nennt das geänderte Feld und die Sekunden und hält beide Knöpfe
im Bild. Der Geräteuhr-Halt gilt auch beim zweiten Lesen und steht im Assistenten und im Übergabedialog. Unlesbare
Meldungen werden beiseitegelegt und gezählt. Alle 7 Runde-7-Befunde dieser Rolle halten (R7-O7 mit dem bekannten Rest
R6-O9).

Zwei Dinge sind neu: Bei 320 × 568 und 200 % Schrift (und bei 360 × 640 und 250 %) ragt die unsichtbar gedachte
Sprungmarke „Zum Inhalt springen“ als leerer weißer Kasten in die erste Bildschirmzeile und verdeckt dort ausgerechnet
die Überschrift der Warnleisten (R8-O1, P2). Und ein unlesbarer Text unter `eeb.einsaetze.v1` wird beim Start still
durch `[]` ersetzt, ohne Hinweis und ohne Beiseitelegen, anders als beim Entwurf (R8-O2, P3).

Die Aufgaben „offline weiterarbeiten, übergeben, sichern, in der Sammlung zusammenführen, Papier abgleichen“ gelingen
ohne fremde Hilfe.

## Befunde

P0: keine. P1: keine. P2: eine. P3: eine.

### P2

#### R8-O1 – Sprungmarke „Zum Inhalt springen“ liegt bei 320 × 568 und 200 % Schrift sichtbar über dem Seitenanfang und verdeckt die erste Zeile der Warnleisten (gemessen)

- **Priorität:** P2
- **Kennzeichnung:** gemessen (Position der Sprungmarke über sechs Schriftstufen und drei Fenstergrößen) und im
  Bildschirmfoto beobachtet. Wirkt an jeder Seite; für diese Rolle zählt, dass es Warnleisten trifft, die „hier wird
  nichts gespeichert“ sagen. Berührt das Layout-Thema aus Runde 7 (R7-M3 bis M7), deshalb Verweis auf den Mobile-Bericht.
- **Fundstelle:** `index.html` (`.sprungmarke`, `position: absolute; top: -3rem`), `src/app/seiten-kopf.tsx`; sichtbar bei
  großer Schrift auf der Startseite, im Bogen und über jeder festen Warnleiste.
- **Beobachtung:** Die Sprungmarke versteckt sich über den Seitenrand (`top: -3rem`). Bei 200 % Schrift wird ihre Beschriftung
  in der schmalen Breite dreizeilig, die Marke 118 px hoch statt 76 px: Ihr Unterrand liegt bei y = +22 (320 × 568), bei
  360 × 640 noch bei −20 (unsichtbar). Gemessen (Unterkante in px): 320 × 568 mit 100 bis 175 % −9 bis −17 (versteckt), 200 %
  +22 und 250 % +27 (sichtbar); 360 × 640 mit 200 % −20, 250 % +27 (sichtbar); 640 × 360 bis 250 % versteckt. Im Bild ist
  sie ein leerer weißer Kasten mit dunklem Rand (Text oberhalb des Bildes). Bei 320 × 568 und 200 % schneidet sie die
  Überschrift „⚠ Nicht gespeichert —“ der festen Leiste bei vollem Speicher an, und bei der Zwei-Fenster-Leiste liegt sie über
  „⚠ Hier wird nichts“ (sichtbar bleibt „gespeichert. Das andere Fenster …“). Auf der Startseite liegt sie über „Alle
  Themen / Anleitung“.
- **Erwartung der Rolle:** Was „nicht gespeichert“ meldet, steht ohne Überlappung im Bild; ein Hilfselement, das für den
  Nutzer unsichtbar sein soll, ist es auch.
- **Folge:** Der Anfang der wichtigsten Warnung ist unter einem leeren Kasten verdeckt. Der Rest des Satzes bleibt lesbar und
  die Knöpfe bleiben erreichbar, aber der Helfer sieht einen Fremdkörper und liest die Warnung ungenau. Betrifft nur
  Telefone mit kleiner Breite und großer Systemschrift.
- **Empfehlung:** Die Sprungmarke so verstecken, dass ihre Höhe keine Rolle spielt (vollständig außerhalb des Bildes oder nicht
  gerendert, bis sie den Fokus hat) und ihre Beschriftung nicht umbrechen lassen.
- **Nachprüfung:** 320 × 568 und 360 × 640 mit 200 % und 250 % Schrift, Startseite und Bogen mit Leiste „Nicht gespeichert“
  und Zwei-Fenster-Leiste: kein sichtbares Element über der Leiste, solange die Sprungmarke keinen Fokus hat.
- **Verweis:** Layout bei großer Schrift im Ganzen: `mobile-ui.md` (Runde 8) und R7-M3 bis M7.

### P3

#### R8-O2 – Ein unlesbarer Text unter `eeb.einsaetze.v1` wird beim Start still durch `[]` ersetzt; die Sammlungen sind weg, ohne Hinweis und ohne Beiseitelegen (gemessen im konstruierten Zustand)

- **Priorität:** P3
- **Kennzeichnung:** gemessen im konstruierten Zustand (drei Texte: abgebrochenes JSON `[{"id":"s1","name":…`, ein Objekt `{"a":1}`
  und `xx`). Ob ein Gerät diesen Zustand erreicht, ist Risiko; `localStorage` schreibt einen Wert unteilbar, abgebrochene
  Texte kommen eher aus einer fehlerhaften Rücksicherung oder einer fremden Fassung. Die Randbedingung ist die Grenze des
  Moduls `vendor/bos-meldekopf` (Kern liest den Text, ersetzt bei Fristbereinigung und schreibt zurück).
- **Fundstelle:** Start mit beschädigtem `eeb.einsaetze.v1`; `src/app/einsaetze-lesen.ts` (`unlesbaresRetten`),
  `src/app/unlesbar.ts` (`unlesbareSammlungsteile` erkennt nur gültiges JSON mit Array).
- **Beobachtung:** Nach dem Laden der Startseite steht `eeb.einsaetze.v1` auf `[]`; `eeb.unlesbar.v1` und
  `eeb.entwurf.beschaedigt.v1` gibt es nicht, die Startseite zeigt keinen Hinweis. Dagegen wird ein beschädigter
  **Entwurf** beiseitegelegt und erklärt („Ein gespeicherter Bogen ließ sich nicht öffnen … Er ist nicht gelöscht, sondern
  beiseitegelegt — als Datei sichern“, `eeb.entwurf.beschaedigt.v1` mit 90 Tagen Frist), und einzelne unlesbare Meldungen
  oder Sammlungsteile landen in `eeb.unlesbar.v1` („Nicht lesbar: 1 weitere Meldung (beiseitegelegt) … Nichts davon ist
  gelöscht“, beides nachgestellt und gut). Beschädigte Texte unter `eeb.vorlagen.v1`, `eeb.absenderkarte.v1` und
  `eeb.einsaetze-papierkorb.v1` bleiben beim Start unverändert liegen (kein Verlust beim Laden); was beim nächsten
  Schreiben dort geschieht, habe ich nicht nachgestellt (Risiko).
- **Erwartung der Rolle:** Was die App nicht lesen kann, wird nicht schweigend ersetzt, sondern wie beim Entwurf
  beiseitegelegt und genannt.
- **Folge:** Gering wahrscheinlich, aber im Fall schwerwiegend: Die laufende Einsatz-Sammlung des Meldekopfs ist ohne
  Spur weg, und die Startseite zeigt eine leere Liste, die wie „noch nichts angelegt“ aussieht.
- **Empfehlung:** Den Rohtext vor dem ersten Überschreiben beiseitelegen (wie beim Entwurf) und die Startseite sagen
  lassen, dass etwas nicht lesbar war, mit dem Weg „als Datei sichern“.
- **Nachprüfung:** `eeb.einsaetze.v1` auf `[{"id":"s1"` setzen und starten: Startseite nennt den Fund, der Rohtext liegt
  beiseite und lässt sich sichern; `eeb.einsaetze.v1` wird nicht ohne Hinweis geleert.

## Bestätigtes

- **Erstladen und Bereitschaft:** Zeile „✓ Jetzt offline bereit für Bogen, PDF, QR-Code und Empfang. Beispielbögen und
  Themenseiten werden nachgeladen (92 von 508)“ nach 5 s, „… Funktioniert komplett offline“ nach rund 15 s (Last durch
  andere Prüfer). Zu früh offline (4,0 von 6,9 MB): „⚠ Noch nicht offline bereit … ohne Netz diese Seite nicht neu
  laden; beim nächsten Netz wird der Rest geladen“; Neuladen schlägt dann tatsächlich fehl, die Warnung stimmt. Nach
  Neuladen ohne Netz nennt die Zeile die Lücke („Beispielbögen und Themenseiten fehlen noch (43 von 508), sie folgen beim
  nächsten Netz“).
- **Beispielbögen ohne Vorrat:** Bei toter Leitung zeigt die Liste je Bogen „nicht geladen“, und „Anzeigen“, „PDF“, „Link“
  antworten mit „… konnte nicht … werden: Dieser Beispielbogen liegt noch nicht auf dem Gerät — Beispielbögen werden nach
  dem ersten Laden mit Netz nachgeladen (siehe Offline-Zeile der Startseite)“.
- **Themenseiten im Funkloch (R7-O6):** Proxy *hängt*, Vorrat voll: `thw.html` 502 ms, `datenschutz.html` 503 ms,
  `feuerwehr.html` 853 ms, `anleitung.html` 677 ms, `meldekopf.html` 992 ms bis zum ersten Inhalt (inklusive Öffnen der
  Seite und Abfrage alle 50 ms, unter Last; Runde 7: 1,3 s).
- **Speicher voll:** Entwurf: feste Leiste „Nicht gespeichert — der Speicher dieses Geräts ist voll. Jetzt ‚Bogen
  übergeben‘ (PDF)“, „Was tun?“ im Bild (bei 200 % bis auf R8-O1). Einlesen in die Sammlung: „⚠ Nicht aufgenommen: 1 Bogen …
  Platz schafft nur Löschen …; danach dieselbe Datei noch einmal einlesen“, Speicher unverändert (1 Eintrag). Papierkorb-
  Dialog nennt Folgen („wandert in den Papierkorb und lässt sich dort 30 Tage lang zurückholen“).
- **Zwei Fenster (R7-O1, R7-O2):** Zweites Fenster speichert nichts und sagt es zuerst („⚠ Hier wird nichts gespeichert. Das
  andere Fenster hat den Bogen geändert: Einheit.“). Bei 200 % ist die Leiste 135 px hoch (21 % bei 360 × 640, rund 24 % bei
  320 × 568 im Bild gemessen, mit dem Kasten aus R8-O1 darüber), beide Knöpfe liegen im Bild, quer ein Knopf „Entscheiden“. „Genauer“ nennt beide
  Stände mit Sekunden („Dort: … gespeichert 21:54:59 Uhr, 38 Personen · Hier: … zuletzt gespeichert 21:54:49 Uhr“), „Anderen
  Stand laden“ fragt mit Folgen nach („deine kommt unter ‚Zuletzt geschlossener Bogen‘ …“). In einem Fenster verworfener
  Bogen: das andere Fenster sagt „… in einem anderen Fenster gelöscht oder geschlossen“, schreibt nichts zurück und
  stellt den Bogen nicht wieder her (`eeb.entwurf.v1` bleibt leer).
- **Geräteuhr (R7-D2, R7-W2, R7-O7):** Uhr 100 Tage vorgesprungen, Sammlung 100 Tage alt: Warnung „… Bis du antwortest,
  löscht und anonymisiert die App nichts“, `eeb.einsaetze.v1` (19 851 Zeichen) und Entwurf unverändert, auch nach Neuladen.
  Im Assistenten und im Dialog „Bogen übergeben“ steht „⚠ Geräteuhr nicht bestätigt … Datum und Stand dieses Bogens
  stimmen vielleicht nicht.“ Ungültiger Uhrstand (`"abc"`, 1 238 983 256): keine Warnung, kein „Invalid Date“.
  Rest R6-O9 gemessen wie angekündigt (Uhr 100 Tage zurück, frische Sammlung: Sammlung ist weg, Warnung sagt „löscht nichts“;
  siehe Tabelle).
- **Unlesbares beiseitegelegt (R7-E1, E2, N3):** Meldung `null` und Sammlung ohne `id` landen in `eeb.unlesbar.v1`;
  Startseite: „1 Meldung nicht lesbar — Daten sichern“, „Nicht lesbar: 1 weitere Meldung (beiseitegelegt). Sie fehlen in
  Liste und Zählung — die Stärke kann zu niedrig sein.“ Beschädigter Entwurf wird beiseitegelegt, erklärt und mit Löschtermin
  genannt.
- **Papier-Abgleich (R7-S1, R7-G1):** Eingabe „Pumpe 2 defekt“, Neuladen: `sessionStorage` hält `eeb.papierabgleich.v1.s1`, die
  Startseite sagt „Angefangene Eingaben für 1 Einheit sind noch da (nur in diesem Browserfenster, bis du sie übernimmst
  oder den Tab schließt)“. „Später“ ist von „Eingaben verwerfen…“ abgesetzt.
- **Sicherung:** „Sicherung erstellen…“ liefert `eeb-sicherung-2026-10-23.json` (39 849 Byte), der Dialog nennt
  „Letzte Sicherung auf diesem Gerät erstellt“. Eine abgeschnittene Datei wird abgewiesen („… ist beschädigt oder
  unvollständig (etwa nach abgebrochener Übertragung). Die Daten auf diesem Gerät sind unverändert.“), eine gute Datei führt zu
  „Sicherung einspielen?“ mit Gegenüberstellung (was auf dem Gerät verloren geht, was in der Datei steht) und „Vorher Sicherung
  erstellen…“.
- **Lagemonitor (R7-O3):** läuft offline neu geladen, zeigt Stärke, „letzte Meldung vor 1 Min“, „Eingetroffen: …“, „+ 3
  weitere Bewegungen“ und die Tabelle. Hauptfenster „In den Papierkorb“: Monitor sagt „Dieser Einsatz liegt im Papierkorb (30
  Tage) — im Hauptfenster wiederherstellen.“
- **Rückweg Personal (R7-O5):** Person entfernen, „Verwerfen“ auf der Startseite: `sessionStorage` hat danach keinen
  Schlüssel `eeb.personal.rueckweg` mehr.
- **Anzeige „gespeichert“, Entwurf offline:** „✓ gespeichert · 21:17 Uhr · nur auf diesem Gerät“ steht synchron; Entwurf
  nach Neuladen ohne Netz fortsetzbar.
- **Keine Fremdanfragen:** Beim Start gehen nur Abrufe an die eigene Adresse.

## Abgleich mit Runde 7

Grundlage: `docs/audits/runde-7/offline-und-speicher.md` und „Stand der Behebung“ in `docs/audits/runde-7/README.md`
(7 Befunde dieser Rolle: O1 bis O7, alle als behoben gemeldet, O7 mit Rest R6-O9). Jede Behebung gegen den Build
`3fee6e5` nachgestellt.

| Befund Runde 7 | Stand laut Bericht | Bewertung Runde 8 | Beobachtung |
| --- | --- | --- | --- |
| R7-O1 Zwei-Fenster-Leiste bei großer Schrift: Satz und Knöpfe hinter Scrollbereich (P2) | behoben | hält, mit Nebenwirkung | Satz zuerst, beide Knöpfe im Bild, 21 % der Höhe bei 360 × 640. Bei 320 × 568 deckt die Sprungmarke die erste Zeile (R8-O1, P2). |
| R7-O2 Zwei-Fenster-Vergleich nennt gleiche Zahlen (P3) | behoben | hält | „geändert: Einheit“, Sekunden in „Genauer“. |
| R7-O3 Lagemonitor „nicht (mehr) vorhanden“ bei Papierkorb (P3) | behoben | hält | „Dieser Einsatz liegt im Papierkorb (30 Tage) — im Hauptfenster wiederherstellen.“ |
| R7-O4 Geräteuhr-Rückfrage „wird die Namen“ (P3) | behoben | hält (Wortlaut nicht erneut ausgelöst) | Nur-Entwurf-Fall nicht nachgestellt; Sammlungsfall mit Name und Frist unverändert. |
| R7-O5 Rückweg Personal nach „Verwerfen“ im Sitzungsspeicher (P3) | behoben | hält | Schlüssel nach „Verwerfen“ weg. |
| R7-O6 Themenseiten im Funkloch 1,3 s (P3) | behoben (im Funkloch nicht gemessen) | hält | 0,5 bis 1,0 s unter Last, Proxy *hängt*. |
| R7-O7 Uhrstand in der Zukunft / „Invalid Date“ (P3) | behoben, Rest offen | Hälfte hält, Rest R6-O9 offen | Ungültiger Uhrstand: keine Warnung. Uhr 100 Tage zurück, frische Sammlung: `eeb.einsaetze.v1` = `[]`, `eeb.aufgeraeumt.v1` gefüllt, Warnung sagt „löscht nichts“, Meldung „gelöscht am 31.01.2027“ (bekannte Grenze, nicht erneut gemeldet). |
| R7-D2 (anderer Bericht) Geräteuhr-Halt nur beim ersten Lesen | behoben | hält | Zweites Lesen (Neuladen) hält, Speicher unverändert. |
| R7-W2 Geräteuhr nur auf der Startseite | behoben | hält | Hinweis im Assistenten und im Dialog „Bogen übergeben“. |
| R7-S1, G1 Papier-Abgleich verliert Eingaben | behoben | hält | Sitzungsspeicher, Hinweis auf der Startseite. |
| R7-E1, E2, N3 Unlesbares | behoben | hält, mit Lücke | Meldungen und Teile beiseitegelegt; unlesbarer Gesamttext nicht (R8-O2, P3). |

Nebenwirkungen der Runde-7-Änderungen, die ich gesucht habe:

| Änderung Runde 7 | Nebenwirkung gefunden? |
| --- | --- |
| Zwei-Fenster-Leiste (Satz zuerst, Knöpfe fest) | Nur bei 320 × 568 und 200 %: Sprungmarke darüber (R8-O1). |
| Rollender Rumpf, fester Fuß der Rückfragen | Nein (Rückfragen „Sicherung einspielen?“, „Stand aus dem anderen Fenster laden?“ lesbar). |
| Geräteuhr-Halt beim zweiten Lesen | Nein. |
| Beiseitelegen unlesbarer Daten | Lücke bei unparsbarem Gesamttext (R8-O2). |
| Themenseiten `StaleWhileRevalidate` | Nein; keine Verzögerung bei hängender Leitung. Eine veraltete Themenseite bis zum nächsten Aufruf ist die erwartbare Folge (Risiko, nicht gemessen). |
| Lagemonitor in Telefonansicht, Tabelle im Bild | Nein; läuft offline und nach Papierkorb. |
| Papier-Abgleich im Sitzungsspeicher | Nein; Grenze: Eingaben sind nach Schließen des Tabs weg, das nennt der Hinweis. |
| Layout bei großer Schrift und Zoom | Ja: R8-O1. |

Bilanz: Alle sieben Behebungen aus Runde 7 für diese Rolle sind gegen den Build geprüft; sechs halten ohne Rest, R7-O7 hält
bis auf die bekannte Grenze R6-O9. Neu in Runde 8: R8-O1 (P2) und R8-O2 (P3).

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Wer bei großer Schrift auf einem schmalen Telefon die Warnleiste liest, sieht über der
  Überschrift einen leeren Kasten und hält ihn für einen Fehler der App (R8-O1).
- **Größtes Einsatzrisiko:** Die Sammlung des Meldekopfs verschwindet ohne Spur, wenn ihr gespeicherter Text als Ganzes unlesbar
  ist (R8-O2), und der bekannte Fall mit zurückgestellter Uhr (R6-O9).
- **Top-Priorität für die nächste Iteration:** Die Sprungmarke so verstecken, dass sie bei 320 × 568 und 200 % Schrift nichts
  verdeckt (R8-O1); danach den unlesbaren Gesamttext der Sammlung wie den Entwurf beiseitelegen (R8-O2).
