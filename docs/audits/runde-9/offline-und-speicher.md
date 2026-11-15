# Audit Runde 9 – Offline und Speicher (Erstladen, Funkloch, voller Speicher, zwei Fenster, Sicherung, Lagemonitor, Geräteuhr, Rohtext-Rettung)

Stand: 24.10.2026 · Code-Stand: Commit `c789947` (Produktionsbuild, `vite preview` auf Port 4173) · Prüfer: Rollenaudit
`thw-offline-resilience-reviewer`

Reiner Prüfbericht, keine Codeänderung. Schwerpunkt waren die Umbauten aus Runde 8, soweit sie Offline-Betrieb und
Speicher berühren: Rohtext-Rettung (`eeb.unlesbar.v1`, Feld `texte`), Sprungmarke, Rückfragen bei Zoom 200 %, Zwei-Fenster-
Rückfragen mit Werten, Lagemonitor, Entwurfsanonymisierung-Hinweis, Kasten zum beiseitegelegten Bogen.

## Prüfaufbau

- **Server:** der gemeinsame Server auf Port 4173, nicht neu gebaut, nicht angehalten, kein eigener Proxy. Ein
  Durchreich-Proxy für hängende Leitung wurde diesmal nicht gebraucht; die Funkloch-Läufe nutzen `setOffline` nach
  geladenem Service Worker (`navigator.serviceWorker.controller` vorhanden).
- **Geräte:** Telefon 360 × 640 als Grundeinstellung, dazu 320 × 568 mit `html{font-size:200%}`, 640 × 360 quer mit 200 %,
  Browser-Zoom nachgestellt (180 × 320 bei Gerätefaktor 2). `isMobile`/`hasTouch`, Locale de-DE, je Lauf ein eigener
  Browser-Kontext. Tablet nicht eigens: Die geprüften Zustände hängen nicht an der Breite.
- **Zustände:** `localStorage`-Seeds (Entwurf Verstärkter Bergungszug, Sammlung „Hochwasser Musterstadt“ mit 6 Einheiten aus
  `examples/thw/`), alle `uebung: false`, Stand auf heute. Beschädigte Gesamttexte in `eeb.einsaetze.v1`
  (`[{"id":"s1","name":"Hoch`, `{"a":1}`, `xx`), `eeb.vorlagen.v1` (`[[[`), `eeb.absenderkarte.v1` (`{"x`),
  `eeb.einsaetze-papierkorb.v1` (`xx`), `eeb.entwurf.v1` (abgebrochen); Speicher voll per `setItem`-Stub
  (`QuotaExceededError`) gezielt für einzelne Schlüssel; Uhrstand `eeb.uhr.v1` 100 Tage voraus bzw. zurück.
- **Reihenfolge:** Blind getestet wurden Offline-Neuladen und die beschädigten Texte; danach habe ich den Bericht
  Runde 8 und „Stand der Behebung“ gelesen und die übrigen Behebungen gezielt nachgestellt. Bildschirmfotos habe ich
  angesehen.
- Skripte und Bildschirmfotos: Scratchpad `runde9/o/` (nicht im Repo).

**Nicht prüfbar:** Kamera-Scan und Nahbereichs-Weitergabe, echter Flugmodus und echte Funkzelle, hängende (statt tote)
Leitung, Speicherräumung durch iOS/Safari, Update-Banner bei neuer Fassung (zweiter Build nötig), native Builds,
Wiederherstellung des Sitzungsspeichers nach Prozess-Ende des Browsers.

## Urteil

Die Offline-Fähigkeit trägt weiter. Nach dem Erstladen gehen Bogen, Übergabe (QR in 7 Teilen, PDF), Sicherung, Sammlung und
Lagemonitor ohne Netz; wer zu früh offline geht, wird gewarnt („⚠ Noch nicht offline bereit (0,3 von 7,0 MB geladen) —
ohne Netz diese Seite nicht neu laden“) und das Neuladen scheitert dann tatsächlich, die Warnung stimmt also. Die Behebung
aus Runde 8 für den größten Befund dieser Rolle hält: Ein unlesbarer Gesamttext von Sammlungen oder Vorlagen wird nicht mehr
still durch `[]` ersetzt, sondern roh beiseitegelegt, auf der Startseite genannt („Nicht lesbar: 1 beschädigter Gesamttext
… Nichts davon ist gelöscht“) und steckt in der Datensicherung. Die Sprungmarke ragt in keiner gemessenen Lage mehr ins Bild
(Unterkante −8 px). Die Zwei-Fenster-Leiste nennt jetzt zuerst „Hier wird nichts gespeichert“, das geänderte Feld und beide
Werte mit Sekunden.

Offen sind zwei Lücken an den Rändern der neuen Rettung: Sie setzt voraus, dass das Beiseitelegen gelingt, und prüft das
nicht (R9-O1, P2); und zwei Wege zeigen das Beiseitegelegte nicht oder irreführend an (R9-O2, R9-O3, je P3).

Die Aufgaben „offline weiterarbeiten, übergeben, sichern, in der Sammlung zusammenführen, Lage ansehen“ gelingen ohne
fremde Hilfe.

## Befunde

P0: keine. P1: keine. P2: eine. P3: zwei.

### P2

#### R9-O1 – Ist der Speicher voll, scheitert das Beiseitelegen still, und der beschädigte Text (Sammlung, Entwurf) wird trotzdem verworfen (gemessen im konstruierten Zustand)

- **Priorität:** P2
- **Kennzeichnung:** gemessen im konstruierten Zustand. Dass ein Gerät beide Bedingungen zugleich erreicht (unlesbarer Text
  und voller Speicher), ist Risiko: `localStorage` schreibt einen Wert unteilbar, und volle Speicher melden die App-Leisten
  schon vorher. Aber genau dann würde die Rettung gebraucht, und der Ausfall wäre ohne Spur.
- **Fundstelle:** Start mit beschädigtem `eeb.einsaetze.v1` bzw. `eeb.entwurf.v1`; Hülle um den Kern (Rettung nach
  `eeb.unlesbar.v1`, Entwurf nach `eeb.entwurf.beschaedigt.v1`), `src/app/unlesbar.ts`, `src/app/einsaetze-lesen.ts`.
- **Beobachtung:** `setItem` für `eeb.unlesbar.v1` wirft `QuotaExceededError`, 5 000 Zeichen Rohtext unter
  `eeb.einsaetze.v1`. Ergebnis nach dem Laden: `eeb.einsaetze.v1` = `[]`, kein `eeb.unlesbar.v1`, auf der Startseite
  kein „Nicht lesbar“-Hinweis (nur der Standardtext). Gleiches beim Entwurf: `setItem` für `eeb.entwurf.beschaedigt.v1`
  gesperrt, danach ist `eeb.entwurf.v1` entfernt, die Startseite zeigt weder Hinweis noch Kasten „Ein Bogen ließ sich
  nicht öffnen“. Ohne Sperre (Kontrolle) funktionieren beide Wege wie beschrieben, auch bei Doppelstart in zwei Fenstern
  (ein Eintrag, nicht doppelt) und nach dreimaligem Neuladen (kein Anwachsen).
- **Erwartung der Rolle:** Wer nicht retten kann, überschreibt nicht. Mindestens sagt die App laut, dass das Beiseitelegen
  nicht gelang und der Text noch unverändert liegt.
- **Folge:** Genau in dem Zustand, in dem die Rettung am nötigsten ist (Speicher knapp), geht der Text ohne Spur verloren
  und die Startseite zeigt eine leere Liste, die wie „noch nichts angelegt“ aussieht. Die Zusage „Nichts davon ist
  gelöscht“ gilt dann nicht, ohne dass der Helfer es erfährt.
- **Empfehlung:** Den Rohtext erst überschreiben oder entfernen, wenn das Beiseitelegen bestätigt ist; sonst Text
  liegen lassen und auf der Startseite die Meldung „Nicht lesbar und nicht beiseitegelegt (Speicher voll)“ mit dem Weg
  „Daten sichern…“ zeigen.
- **Nachprüfung:** `setItem` für `eeb.unlesbar.v1` bzw. `eeb.entwurf.beschaedigt.v1` sperren, beschädigten Text setzen,
  starten: Der Originalschlüssel behält den Rohtext, die Startseite nennt den Fund.

### P3

#### R9-O2 – Lagemonitor mit unlesbarem Sammlungstext sagt „Dieser Einsatz ist auf diesem Gerät nicht (mehr) vorhanden“ und verwirft den letzten gültigen Stand (gemessen im konstruierten Zustand)

- **Priorität:** P3
- **Kennzeichnung:** gemessen (zweites Fenster setzt `eeb.einsaetze.v1` auf `xx`, Monitor offen); Auslöser konstruiert.
- **Fundstelle:** `?lagemonitor=s1`, Statusfläche bei unlesbarer oder fehlender Sammlung.
- **Beobachtung:** Ein laufender Monitor mit Stärke 1 / 15 / 43 // 59 zeigt nach dem Ersetzen des Textes nur noch „Dieser
  Einsatz ist auf diesem Gerät nicht (mehr) vorhanden.“ mit Uhr und „Schließen“. Der Wortlaut für den Papierkorb
  (R7-O3) ist dagegen genau („liegt im Papierkorb … im Hauptfenster wiederherstellen“). Ein unlesbarer Text wird nicht
  als solcher benannt. Die Live-Aktualisierung bei normaler Änderung läuft (Stärke 59 → 42 nach Entfernen einer Einheit
  in einem anderen Fenster, nach unter 3 s).
- **Erwartung der Rolle:** Das große Lagebild sagt „nicht lesbar“ und nennt den Weg (Hauptfenster, Daten sichern), statt
  „nicht mehr vorhanden“ zu behaupten; ein zuletzt gültiger Stand wird mit Alter weiter gezeigt oder ausdrücklich
  aufgegeben.
- **Folge:** Gering wahrscheinlich. Auf einem Lageschirm im Raum steht aber „weg“ statt „Daten prüfen“, die falsche
  Auskunft kann zu Neuerfassung statt zu Rettung führen.
- **Empfehlung:** Im Monitor „nicht lesbar“ von „nicht vorhanden“ unterscheiden und auf Hauptfenster/Datensicherung
  verweisen.
- **Nachprüfung:** Monitor offen, in anderem Fenster `eeb.einsaetze.v1` auf `xx`: Text nennt „nicht lesbar“.

#### R9-O3 – Zwei Ränder der Beiseitelege-Anzeige: beschädigte Absenderkarte erscheint als „keine Angabe“, „Alle Daten löschen“ nennt Beiseitegelegtes nicht (gemessen, Dialogtext und Anzeige; Löschfolge nicht ausgelöst)

- **Priorität:** P3
- **Kennzeichnung:** gemessen im konstruierten Zustand; die Löschfolge habe ich nicht bis zum Ende bedient (Knopf
  „Endgültig löschen“ ist erst nach Bestätigung frei), die Auswirkung auf `eeb.unlesbar.v1` ist Risiko.
- **Fundstelle:** Startseite „Absender für übergebene Bögen“; Dialog „Alle lokalen Daten löschen“.
- **Beobachtung:** Unter `eeb.absenderkarte.v1` mit `{"x` zeigt die Startseite „Absender: keine Angabe · Name/Kontakt
  hinterlegen…“, kein „Nicht lesbar“-Hinweis (der Schlüssel bleibt unverändert liegen, die Sicherung enthält ihn roh).
  Dasselbe gilt für `eeb.einsaetze-papierkorb.v1` mit `xx`. Der Dialog „Alle lokalen Daten löschen“ zählt „0 Vorlagen (inkl.
  Papierkorb)“ und „0 Einsatz-Sammlungen“, während `eeb.unlesbar.v1` und der Vorlagen-Rohtext vorhanden sind; Beiseitegelegtes
  wird nicht genannt.
- **Erwartung der Rolle:** Was die App nicht lesen kann, wird als solches genannt, wo es sonst „leer“ aussieht; wer „alles
  löschen“ bestätigt, erfährt, dass auch das Beiseitegelegte dabei ist.
- **Folge:** Gering: Wer „keine Angabe“ liest, trägt den Absender neu ein und merkt nicht, dass ein alter Eintrag
  beschädigt war; wer alles löscht, nimmt die letzte Spur eines Gesamttextes ohne Hinweis mit.
- **Empfehlung:** Hinweis „Absenderkarte nicht lesbar“ und die Zeile „n beiseitegelegte Einträge“ in der Liste „Betroffen
  sind“.
- **Nachprüfung:** `eeb.absenderkarte.v1` = `{"x` setzen: Startseite nennt es; mit Beiseitegelegtem „Alle Daten löschen“
  öffnen: Liste nennt es.

## Bestätigtes

- **Erstladen und Bereitschaft:** „✓ Jetzt offline bereit für Bogen, PDF, QR-Code und Empfang. Übungsbögen und
  Themenseiten werden nachgeladen (99 von 549)“ nach 9 s; nach Neuladen ohne Netz „✓ Offline bereit … fehlen noch (144 von
  549), sie folgen beim nächsten Netz“. Nach 0,7 s offline gegangen: „⚠ Noch nicht offline bereit (0,3 von 7,0 MB geladen)“,
  Neuladen scheitert mit `ERR_INTERNET_DISCONNECTED`, die Warnung stimmt.
- **Übergabe offline:** Dialog „Bogen übergeben“ mit PDF-Vorschau, QR-Code („in 7 Teile aufgeteilt“), Vollbild und PDF
  ohne Netz.
- **Rohtext-Rettung (R8-O2 und Verwandte):** `[{"id":"s1","name":"Hoch` und `{"a":1}` unter `eeb.einsaetze.v1` sowie `[[[`
  unter `eeb.vorlagen.v1` landen in `eeb.unlesbar.v1.texte` (je Art ein Eintrag), Startseite meldet „1 beschädigter
  Gesamttext (Sammlungen oder Vorlagen) … Nichts davon ist gelöscht; die Daten stecken in der Datensicherung“; „Daten
  sichern…“ liefert die Datei (Rohtexte `[[[`, `xx` und `unlesbar` darin enthalten), „Beiseitegelegtes entfernen…“ fragt mit
  Folge nach („endgültig gelöscht … vorher ‚Daten sichern…‘“). `eeb.vorlagen.v1` bleibt unverändert liegen; Löschen einer
  Sammlung bei beschädigten Vorlagen lässt die Rettung bestehen. Nach Neuladen kein Anwachsen.
- **Sprungmarke (R8-O1):** `.sprungmarke` Unterkante −8 px bei 320 × 568 / 360 × 640 / 640 × 360 mit 200 % und bei 100 %;
  nichts verdeckt die Warnleisten.
- **Speicher voll, Entwurf:** feste Leiste „⚠ Nicht gespeichert — der Speicher dieses Geräts ist voll. Jetzt ‚Bogen
  übergeben‘ (PDF).“
- **Zwei Fenster (R8-N6/E4):** Das zweite Fenster sagt „⚠ Hier wird nichts gespeichert. Das andere Fenster hat den Bogen
  geändert: Einheit.“, beide Knöpfe („Anderen Stand laden“, „Meine Fassung behalten“) und „Genauer“ im Bild; „Genauer“
  nennt beide Stände mit Sekunden („Dort: … gespeichert 06:46:36 Uhr, 38 Personen · Hier: … zuletzt gespeichert 06:46:22 Uhr“).
  Im ändernden Fenster bleibt „✓ gespeichert · nur auf diesem Gerät“, auch nach Netzverlust.
- **Rückfragen bei großer Schrift und Zoom:** Dialog „Einsatz löschen?“ und „Beiseitegelegte Einträge entfernen?“ mit
  beiden Knöpfen im Bild bei 360 × 640, 320 × 568 mit 200 %, 640 × 360 quer mit 200 % (Knöpfe nebeneinander, 44 px) und
  180 × 320 (Dialog 16–304 von 320, Knöpfe 190–295).
- **Lagemonitor (R8-L1, L3–L5):** läuft offline neu geladen (Stärke 1 / 15 / 43 // 59, „letzte Meldung vor 1 Min“, 3 von 6
  Bewegungen mit „+ 3 weitere“, vollständige Tabelle), Telefon ohne Einheitentyp, Live-Aktualisierung bei Änderung.
- **Sicherung:** „Sicherung erstellen…“ liefert Datei (22 846 Byte), Dialog nennt „Letzte Sicherung auf diesem Gerät erstellt:
  24.10.26, 06:47 Uhr“; abgeschnittene Datei wird abgewiesen („… beschädigt oder unvollständig … Die Daten auf diesem Gerät
  sind unverändert“).
- **Geräteuhr:** Uhr 100 Tage zurückgegangen: Warnung „Bis du antwortest, löscht und anonymisiert die App nichts“, bei
  Dialog 180 × 320 Text im Bild, Knöpfe unter dem Bildrand (R7-G8/H9, bekannte Grenze).
- **Keine Fremdanfragen:** Beim Start gehen nur Abrufe an die eigene Adresse.

## Bekannte Grenzen (Stand)

| Grenze | Stand Runde 9 |
| --- | --- |
| R6-O9 Uhrstand in der Zukunft, frische Sammlung | gemessen unverändert: Uhrstand 100 Tage voraus, frische Sammlung: `eeb.einsaetze.v1` danach `[]`, Warnung sagt „löscht … nichts“ |
| R7-G8/H9 Geräteuhr-Warnung bei 200 % und 320 × 568 | unverändert: Knöpfe der Warnung unter dem Bildrand, Text ganz im Bild |
| R8-A1, R8-M6, R8-H5/S4, R7-G4/M8, R7-N1, R7-N9 | berühren diese Rolle nicht, nicht nachgestellt |

## Abgleich mit Runde 8

Grundlage: `docs/audits/runde-8/offline-und-speicher.md` (R8-O1 P2, R8-O2 P3) und „Stand der Behebung“ in
`docs/audits/runde-8/README.md`. Gegen Build `c789947` nachgestellt.

| Befund Runde 8 | Stand laut Bericht | Bewertung Runde 9 | Beobachtung |
| --- | --- | --- | --- |
| R8-O1 Sprungmarke verdeckt Warnleisten bei 320 × 568 und 200 % (P2) | behoben | hält | Unterkante −8 px in allen gemessenen Lagen. |
| R8-O2 Unlesbarer Text unter `eeb.einsaetze.v1` wird still durch `[]` ersetzt (P3) | behoben | hält, mit Lücke bei vollem Speicher | Rohtext in `eeb.unlesbar.v1.texte`, Hinweis auf der Startseite; bei gesperrtem Schreiben still verworfen (R9-O1, P2). |
| R8-O2 Risiko: beschädigte Vorlagen, Absenderkarte, Papierkorb-Text | Risiko (nicht nachgestellt) | teils gemessen | Vorlagen gerettet und gemeldet; Absenderkarte und Papierkorb-Text liegen unverändert, ohne Hinweis (R9-O3, P3). |
| R8-D1/H1/E1 (Rohtext, anderer Bericht) | behoben | hält | Verweis: gleiche Ursache wie oben. |
| R8-N6/E4 Zwei-Fenster-Rückfrage ohne Werte | behoben | hält | Beide Werte mit Sekunden. |
| R8-G1/M2 Rückfragen bei 200 % | behoben | hält | Knöpfe im Bild (Löschen, Entfernen), 180 × 320 geprüft. |
| R8-L1/L3–L5 Lagemonitor | behoben | hält | Offline, live; unlesbarer Text im Monitor siehe R9-O2 (P3). |
| R8-E3/D3 Anonymisierungs-Hinweis | behoben | nicht nachgestellt | Anderer Prüfer (Entwurfsanonymisierung); Geräteuhr-Warnung bleibt wie beschrieben. |

Nebenwirkungen der Runde-8-Änderungen, die ich gesucht habe:

| Änderung Runde 8 | Nebenwirkung gefunden? |
| --- | --- |
| Rohtext-Rettung vor jedem Lesen in der Hülle | Ja: bei gesperrtem Beiseitelegen wird trotzdem überschrieben (R9-O1). Sonst keine; kein Anwachsen bei Neuladen, kein Doppeleintrag bei zwei Fenstern. |
| Sprungmarke | Nein. |
| Rückfragen bei Zoom 200 % | Nein. |
| Lagemonitor | Nur der Wortlaut bei unlesbarem Text (R9-O2). |
| Kasten „Ein Bogen ließ sich nicht öffnen“ | Nicht gesondert nachgestellt. |

Bilanz: Die zwei Runde-8-Befunde dieser Rolle sind behoben (R8-O1 ohne Rest, R8-O2 mit der Lücke R9-O1). Neu in Runde 9:
R9-O1 (P2), R9-O2 und R9-O3 (je P3).

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Nichts davon ist gelöscht“ auf der Startseite stimmt nicht, wenn das Beiseitelegen wegen
  vollen Speichers still scheiterte (R9-O1), und „nicht mehr vorhanden“ im Lagemonitor meint auch „nur nicht lesbar“ (R9-O2).
- **Größtes Einsatzrisiko:** Die Rettung beschädigter Texte ist nicht atomar mit dem Verwerfen: bei knappem Speicher geht
  der Text ohne Meldung verloren (R9-O1); dazu bleibt der bekannte Fall mit zurückgestellter Uhr (R6-O9).
- **Top-Priorität für die nächste Iteration:** Den beschädigten Text erst verwerfen, wenn das Beiseitelegen bestätigt ist, und
  sonst die Startseite „nicht lesbar und nicht gesichert“ sagen lassen (R9-O1).
