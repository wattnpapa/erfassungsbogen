# Audit „Zerstörende Handlungen", Runde 4 (Löschen, Überschreiben, Statuswechsel)

Stand: 05.10.2026 · Prüfer: Rollenaudit `thw-destructive-action-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 3dd2ab5.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-3-Befunde (Stand der Behebung vom 05.10.2026).

## Prüfaufbau

Wie in Runde 3 (siehe [../runde-3/README.md → Prüfaufbau](../runde-3/README.md#prüfaufbau)):
Chromium aus Playwright (`node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE. Jeder Lauf in
einem eigenen Browser-Kontext mit leerem Speicher und `localStorage`-Seed aus
`examples/thw/` (`uebung: false`, Einsatzzeitraum auf heute):

- `eeb.entwurf.v1`: eigener Bogen „THW Ulm Bergungsgruppe" (8 Personen,
  2 Fahrzeuge), für den Vorlagen-Lauf mit 5 Personen und Einsatzort „ECHTER
  EINSATZ Deichsicherung".
- `eeb.entwurf.ersetzt.v1` (Rückholplatz): „THW Kirchehrenbach",
  „THW Albstadt Zugtrupp" oder „THW Crailsheim FGr W (A)".
- `eeb.vorlagen.v1`: „OV Ulm B", „Meine FGr W", „Ulm Stamm", „Kirchehrenbach".
- `eeb.einsaetze.v1`: „Hochwasser Test" (2 bis 5 Einheiten), „Übung Herbst",
  Papierkorb-Einträge von vor 2 und 29,7 Tagen, „Altlage Frühjahr"
  (85 Tage unverändert).

Bogen-Link (Lüneburg) mit `encodePayloadUrl` erzeugt, Sicherungsdatei mit
der App selbst. Uhrsprünge mit `page.clock.install` im selben Kontext
(gleicher Speicher, neuer Tab mit vorgestellter Uhr). Nach jeder Handlung
Speicher nachgelesen und Bildschirmfotos angesehen. Elf weitere Prüfer
nutzten den Server gleichzeitig; Zeitangaben unter 1 s sind deshalb nur grob.

Szenarien:

1. **Eigener Bogen:** Startseite „Verwerfen" mit leerem und belegtem
   Rückholplatz, Übersicht „Bogen schließen", Vorlage „Bearbeiten" →
   „‹ Startseite" → „Verwerfen", Kaltstart über Bogen-Link (mit und ohne
   Sammlung, „Abbrechen" und „Bogen öffnen"), Person / Erreichbarkeit /
   Fahrzeug entfernen, „Vorbelegung entfernen", zwei Fenster am selben Bogen.
2. **Vorlagen:** Löschen einfach und als Doppeltipp (150 bis 1000 ms),
   Rückgängig.
3. **Meldekopf:** „Abrücken" einfach und als Doppeltipp (120, 400, 900,
   1600, 2500 ms), Quittungsdauer (40 s), „Entfernen" mit Rückgängig nach
   Wegnavigieren und nach Neuladen, „Aufteilen", „Zusammenführen",
   „Verschieben…", „Einsatz löschen…", Papierkorb, zwei Fenster an derselben
   Sammlung.
4. **Gerät:** „Sicherung einspielen…" ohne laufende Sammlung, „Alle Daten
   löschen" (bis zur Rückfrage), Aufräumfrist 85 Tage, Geräteuhr 40, 365
   und 400 Tage vorgestellt.

Getestet habe ich zuerst ohne Blick in frühere Berichte. Den
Runde-3-Bericht samt „Stand der Behebung" habe ich danach gelesen, die
übrigen Runde-4-Berichte zum Schluss (sie waren zu dem Zeitpunkt zum
größten Teil noch leer).

**Nicht prüfbar:** Kamera-Scan und Kiosk-Stapel mit echten Codes,
Nahbereichs-Weitergabe, native Builds (Geräte-Zurück, nativer Link-Empfang,
echtes Beenden der App im Hintergrund durch das Betriebssystem — nur als
Neuladen nachgestellt), echte Handschuhe, ein echtes Gerät mit falsch
gestellter Uhr (nur per `page.clock` nachgestellt), zwei echte Geräte an
einer Sammlung, „Geräteschlüssel neu erzeugen" bis zum Ende (nur bis zur
Rückfrage im Code gelesen). Bogen-Link als Fragmentwechsel im laufenden Tab
habe ich in dieser Runde nicht nachgestellt.

## Urteil

Die Bedienhandlungen selbst sind gut abgesichert. Jede Löschung im Assistenten
fragt mit Namen nach und bietet danach „Rückgängig" in der Daumenleiste.
Abrücken geht ohne Rückfrage, quittiert aber unten im Bild und bleibt
mindestens 40 s rücknehmbar. Ein Doppeltipp bis 900 ms schadet nicht. Die
Rückfragen zum Rückholplatz nennen jetzt immer, welcher Bogen dabei endgültig
fällt, mit Stand, Personenzahl und Einsatzort. Die beiden Runde-3-Fälle, in
denen ein eigener Bogen verloren ging (Vorlagen-Bearbeitung verwerfen,
Kaltstart über Link), halten nachweislich. Zwei Fenster am selben Bogen oder
an derselben Sammlung überschreiben sich nicht mehr.

Gefährlich wird es jetzt dort, wo der Helfer gar nichts tippt. Ist die
Geräteuhr vorgestellt, löscht die App beim Start eine laufende Sammlung
endgültig und ohne Rückfrage, weil die 90-Tage-Aufräumfrist ohne die
Uhrprüfung rechnet, die den Entwurf schützt (R4-D1). Zweitens zählt
„Sicherung einspielen" nicht alles auf, was verloren geht: Rückholplatz und
Absenderkarte fehlen, und die Bilanz kann „nichts" sagen, während ein Bogen
verschwindet (R4-D2). Drittens hängt der Rückweg einer entfernten Meldung am
Arbeitsspeicher. Nach einem Neuladen ist er weg, und die Rückfrage sagt das
nicht (R4-D3).

Alle Aufgaben lassen sich ohne fremde Hilfe erledigen.

## Übersicht: Handlung → Bestätigung → Rückweg

Alles beobachtet bzw. im Speicher gemessen.

| Handlung | Bestätigung | Rückweg (geprüft) |
| --- | --- | --- |
| Startseite „Verwerfen" | Rückfrage mit Name, nennt Rückholplatz und den dabei gelöschten Bogen mit Stand, Personenzahl, Einsatzort | Rückholung ✓ |
| Übersicht „Bogen schließen" | „Der Bogen wird geschlossen, nicht gelöscht …" | Rückholung ✓ |
| Vorlage „Bearbeiten" → „‹ Startseite" → „Verwerfen" | „Bearbeitung der Vorlage beenden? … Dein Bogen … (5 Personen · ‚ECHTER EINSATZ …') bleibt zurückholbar" | eigener Bogen auf dem Rückholplatz, Vorlage unverändert ✓ |
| Bogen-Link, Kaltstart | ohne Sammlung: „Empfangenen Bogen öffnen?" nennt den fallenden Bogen; mit Sammlung: „Wohin damit?", dann dieselbe Rückfrage | „Abbrechen" lässt Arbeitsplatz und Rückholplatz unverändert ✓ |
| Person / Erreichbarkeit / Fahrzeug entfernen | Rückfrage mit Namen bzw. Nummer bzw. Typ und Kennzeichen | Daumenleiste „Rückgängig" 108 × 44 px bei y = 509 ✓ |
| „Vorbelegung entfernen" | keine | **keiner, keine Quittung** (R4-D4) |
| Vorlage „Löschen" | keine, bewusst | Papierkorb, „Rückgängig" 108 × 44 px ✓; Doppeltipp trifft keine zweite Vorlage |
| „Abrücken" | keine, bewusst | Quittung unten, nach 40 s noch da ✓; Gegenknopf ab etwa 1,5 s |
| „Entfernen" einer Meldung | „Meldung entfernen? … samt Historie" | „Rückgängig" übersteht Verlassen der Ansicht, **nicht das Neuladen** (R4-D3) |
| „Aufteilen" | Formular mit Pflichtfeld | Quittung mit „Rückgängig" ✓ |
| „Zusammenführen" | Formular mit Vorschau „Danach: 0 / 2 / 6 / 8" | **keine Quittung, kein „Rückgängig"** (R4-D5) |
| „Verschieben…" | Zielauswahl mit „verliert 8 Helfer" | „Rückgängig — zurück nach ‚Hochwasser Donau'" ✓ |
| „Einsatz löschen…" | Rückfrage mit Name und Zahl, „30 Tage" | Quittung mit „Rückgängig", Papierkorb ✓ |
| Papierkorb „Endgültig löschen…" | zweite Rückfrage | keiner, bewusst |
| „Sicherung einspielen…" | Aufzählung beider Seiten, Haken nur bei laufender Sammlung | Sicherungsdatei; **Aufzählung unvollständig** (R4-D2) |
| „Alle Daten löschen" | Aufzählung, Haken, Knopf bis dahin gesperrt | Sicherungsdatei ✓ |
| Aufräumfrist (85 Tage) | Hinweis auf Startkarte und in der Einsatzansicht | Export ✓ |
| Geräteuhr vorgestellt | **keine** | **keiner** (R4-D1) |

## Befunde

### R4-D1 [P1] Vorgestellte Geräteuhr löscht laufende Sammlungen beim Start endgültig, ohne Rückfrage (neu)

**Priorität:** P1

**Nachweis:** gemessen (Speicher vor und nach dem Start mit vorgestellter
Uhr, zwei Läufe, Screenshots `28-sprung-365`, `28-sprung-400`).

**Fundstelle / Aufgabe:** Meldekopf-Tablet mit laufender Sammlung „Laufender
Einsatz" (2 Einheiten, heute angelegt, heute geändert) und eigenem Entwurf.
Die App wird mit einer vorgestellten Geräteuhr neu geöffnet. Code: die
Aufräumfrist rechnet mit `Date.now()` in `src/app/aufraeum-hinweis.ts`
(`ruhendeVormerken`, `jetzt = Date.now()`) und im Kern
`vendor/bos-meldekopf/src/einsaetze.ts` (`tageBisAufraeumen` und
`ruhendeBereinigt`, um Zeile 173–195), die Papierkorbfrist ebenso in
`vendor/bos-meldekopf/src/papierkorb.ts` (`papierkorbBereinigt`). Nur die
Datenschutzfrist des Entwurfs läuft über die geprüfte Uhr
(`src/app/datenschutz-uhr.ts`, `uhrPruefen` mit `UHR_SPRUNG_TAGE = 366` in
`vendor/eeb-format/src/datenschutzfrist.ts`).

**Beobachtung:**

| Uhr | Sammlung „Laufender Einsatz" | Eigener Entwurf | Hinweis |
| --- | --- | --- | --- |
| +40 Tage | bleibt | bleibt | Papierkorb-Eintrag von gestern endgültig weg |
| +365 Tage (falsches Jahr) | **endgültig gelöscht**, nicht im Papierkorb | **anonymisiert** („Einsatzkraft 1") | „Automatisch gelöscht: Diese Sammlung lag 90 Tage unverändert …" |
| +400 Tage | **endgültig gelöscht** | bleibt (Uhrprüfung greift) | dieselbe Nachricht, „… 05.10.2026 bis 05.10.2026 · gelöscht am 09.11.2027" |

Es gibt keine Rückfrage vor der Löschung und keinen Rückweg danach. Bei
+400 Tagen erkennt die App den Uhrsprung für den Entwurf und schützt ihn,
löscht aber im selben Start die Sammlung. Die Nachricht behauptet „lag
90 Tage unverändert", obwohl sie am selben Tag geändert wurde.

**Erwartung der Rolle:** Meine laufende Lage verschwindet nicht, nur weil am
Tablet das Datum falsch steht. Wenn die App etwas endgültig löschen will,
das ich gestern noch benutzt habe, fragt sie oder legt es wenigstens in den
Papierkorb.

**Auswirkung im Einsatz:** Ein falsch gestelltes Jahr (Einrichtung von Hand,
Werkszustand, ein Gerät ohne Netzzeit im Bereitstellungsraum) genügt. Der
Meldekopf öffnet die App und findet statt der Lage nur eine Löschnachricht.
Stärke, Eintreffzeiten und Abrückzeiten aller Einheiten sind weg; Rückweg nur
über einen Export, falls es einen gibt, sonst über das Papier. Stellt jemand
die Uhr danach richtig, kommt nichts zurück. Die Wahrscheinlichkeit ist
gering, der Schaden aber der größte, den die App anrichten kann.

**Empfehlung:** Aufräum- und Papierkorbfrist an dieselbe geprüfte Uhr hängen
wie die Datenschutzfrist. Den Sprung enger fassen, sodass ein falsches Jahr
(+365 Tage) als Sprung gilt. Vor allem nie im selben Start löschen, in dem
die Uhr gesprungen ist: Eine automatisch fällige Sammlung zuerst in den
Papierkorb legen und die Nachricht mit „Rückgängig" zeigen, oder bei
unplausiblem Abstand zur letzten Änderung fragen („Datum des Geräts prüfen").

**Nachprüfung:** Sammlung heute anlegen, App schließen, Geräteuhr um 365 und
um 400 Tage vorstellen, App öffnen: Die Sammlung muss vollständig da sein
(oder im Papierkorb mit Rückweg), und eine Rückfrage zum Datum muss
erscheinen. Danach Uhr zurückstellen: nichts verändert.

### R4-D2 [P2] „Sicherung einspielen": Die Bilanz verschweigt Rückholplatz und Absenderkarte und kann „nichts geht verloren" sagen (neu)

**Priorität:** P2

**Nachweis:** gemessen (Speicher vor und nach dem Einspielen,
Screenshot `13-einspielen-dlg`).

**Fundstelle / Aufgabe:** Fußzeile „Datensicherung" → „Sicherung
einspielen…" mit einer älteren Sicherung (1 Vorlage). Auf dem Gerät: kein
offener Bogen, aber ein Bogen auf dem Rückholplatz („THW Crailsheim FGr W
(A)") und eine Absenderkarte. Code: `src/app/sicherung.ts`
(`geraetBestand`/`bestandUmfang`, um Zeile 113–142, zählt nur Sammlungen,
Vorlagen und Entwurf), `src/app/fusszeile.tsx` (`BestandListe` um Zeile 1181,
Dialog „Sicherung einspielen?" um Zeile 877–930).

**Beobachtung:** Der Dialog sagt unter „Auf diesem Gerät — geht dabei
verloren": „keine laufende Einsatz-Sammlung · 0 Vorlagen · kein
angefangener Bogen". Ein Haken wird nicht verlangt, „Einspielen und
ersetzen" ist sofort aktiv. Nach dem Tipp sind `eeb.entwurf.ersetzt.v1`
(Crailsheim) und `eeb.absenderkarte.v1` gelöscht. Der Geräteschlüssel wird
im Einleitungssatz erwähnt, in der Aufzählung aber nicht. „Alle Daten
löschen" nennt Rückholplatz, Absenderkarte und Geräteschlüssel dagegen
einzeln (R3-D4 behoben); die beiden Aufzählungen sind verschieden gebaut.

**Erwartung der Rolle:** Wenn die Liste „geht dabei verloren" sagt, steht
dort alles. Steht dort „nichts", geht auch nichts verloren.

**Auswirkung im Einsatz:** Plausibler Ablauf: Ein Gerät wird für den
Einsatz aus der OV-Sicherung eingerichtet, nachdem jemand schon einen Bogen
angefangen und wieder geschlossen hat. Der Bogen verschwindet ohne Hinweis.
Ebenso die hinterlegte Absenderangabe, sodass die nächsten Bögen ohne
Rückkanal unterwegs sind. Ein ersetzter Geräteschlüssel ändert die Kurzform,
die Empfänger abgeglichen haben, ohne dass der Helfer das vorher gelesen
hat.

**Empfehlung:** Dieselbe Aufzählung wie bei „Alle Daten löschen" verwenden:
Rückholplatz mit Namen, Absenderkarte, Geräteschlüssel (mit Kurzform vorher
und nachher), Vorlagen getrennt nach aktiv und Papierkorb. Den Haken
verlangen, sobald auf dem Gerät überhaupt ein Bogen, eine Vorlage oder ein
Geräteschlüssel steht, nicht nur bei laufenden Sammlungen.

**Nachprüfung:** Gerät mit leerem Arbeitsplatz, belegtem Rückholplatz und
Absenderkarte, ältere Sicherung einspielen: Die Liste muss beide nennen,
und „Einspielen und ersetzen" muss bis zum Haken gesperrt sein.

### R4-D3 [P2] „Meldung entfernen": Der Rückweg überlebt kein Neuladen, und die Rückfrage sagt nicht, dass es endgültig ist (Rest von R3-D4)

**Priorität:** P2

**Nachweis:** gemessen (Speicher und Quittung nach Wegnavigieren und nach
Neuladen).

**Fundstelle / Aufgabe:** Einsatzansicht → Karte „THW Ulm Bergungsgruppe" →
„Mehr…" → „Entfernen" → „Meldung entfernen". Code: `src/app/einsaetze-ui.tsx`,
`entfernen()` (um Zeile 2484) und der Merker der entfernten Meldung (um
Zeile 690, „nur Arbeitsspeicher").

**Beobachtung:** Die Rückfrage lautet: „‚THW Ulm Bergungsgruppe' (Stand …)
wird aus diesem Einsatz entfernt — samt Historie." Danach steht unten
„Entfernt: Meldung Nr. 1 … Rückgängig". Nach „‹ Startseite" und erneutem
Öffnen ist „Rückgängig" noch da. Nach einem Neuladen ist es weg, die Meldung
ist endgültig gelöscht. „Einsatz löschen…" legt dagegen in den Papierkorb
und sagt „30 Tage lang zurückholen".

**Erwartung der Rolle:** Eine einzelne Einheit zu entfernen ist für mich
harmloser als den ganzen Einsatz zu löschen. Entweder gibt es einen
Papierkorb, oder die Rückfrage sagt klar, dass es danach nur noch über einen
Export zurückgeht.

**Auswirkung im Einsatz:** Auf dem Telefon beendet das Betriebssystem die
App im Hintergrund regelmäßig (Funkgespräch, Kamera, Navigation). Wer den
Fehlgriff erst danach bemerkt, hat die Einheit samt Eintreffzeit, Auftrag
und Historie verloren. Zurück geht es nur, wenn vorher ein Sammel-PDF
erzeugt wurde, und nur mit dem Stand von damals.

**Empfehlung:** Entfernte Meldungen wie Einsätze in einen Papierkorb der
Sammlung legen (dauerhaft, mit Frist), oder den Rückweg wenigstens im Speicher
halten, bis die Ansicht bewusst geschlossen wird. Mindestens die Rückfrage
ergänzen: „Rückgängig ist nur bis zum Neustart der App möglich; letzter
Export: …/noch keiner".

**Nachprüfung:** Meldung entfernen, Seite neu laden, Sammlung öffnen: Die
Meldung muss zurückholbar sein, oder die Rückfrage muss vorher den Verlust
beim Neustart genannt haben.

### R4-D4 [P3] „Vorbelegung entfernen" und Wechsel des Einheitstyps nehmen ausgefüllte Sollplätze still mit (neu)

**Priorität:** P3

**Nachweis:** gemessen (Speicher vor und nach dem Tipp, Screenshot
`24-nach`).

**Fundstelle / Aufgabe:** Schritt 1 „Einheit", Hinweis „Vorbelegt nach
StAN: 3 Personen (Namen offen)" → „Vorbelegung entfernen". Die drei
Sollplätze hatten keinen Namen, aber Geschlecht und Ernährung waren
eingetragen. Code: `src/app/schritte/einheit.tsx` (`vorbelegungEntfernen`
um Zeile 280, `einheitstypSetzen` um Zeile 254), `src/app/hilfen.ts`
(`personUnbenannt` um Zeile 1176: zählt Name, Erreichbarkeiten,
Fahrerlaubnis und Zusatzqualifikationen, nicht Geschlecht, Ernährung,
„Zählt als" oder geänderte Funktionen).

**Beobachtung:** Ein Tipp, keine Rückfrage, keine Quittung, kein
„Rückgängig". Die Personalliste fällt von 8 auf 5, die Stärke von 0/2/6/8 auf
0/2/3/5; auf dem Bildschirm ändert sich nur, dass der Hinweis verschwindet.
Derselbe Maßstab gilt, wenn der Einheitstyp gewechselt wird. Bei Fahrzeugen
ist die Regel seit R3-N2 enger (Sondergerät und Sitzplätze zählen als
Inhalt), bei Personen nicht.

**Erwartung der Rolle:** Was ich eingetragen habe, gilt als Inhalt, auch
ohne Namen. Wenn die Stärke um drei sinkt, sehe ich es und kann es
zurücknehmen.

**Auswirkung im Einsatz:** Gering, aber still: Verpflegung (vegan,
vegetarisch) und Unterbringung (W/D) der unbenannten Plätze fallen weg; wer
nur nach dem Namen geschaut hat, meldet danach eine zu kleine Stärke.

**Empfehlung:** Jede abweichende Angabe an einem Sollplatz als Inhalt
zählen. Nach „Vorbelegung entfernen" und Typwechsel dieselbe Daumenleiste
mit „Rückgängig" und der Stärke vorher → nachher zeigen wie bei Person
entfernen.

**Nachprüfung:** Drei Sollplätze ohne Namen mit „vegan"/„W" belegen,
„Vorbelegung entfernen": Die Plätze bleiben, oder eine Quittung mit
„Rückgängig" zeigt „Stärke 8 → 5".

### R4-D5 [P3] Kleinere Lücken bei Rückweg und Benennung (neu)

**Priorität:** P3

**Nachweis:** beobachtet, je Punkt.

**Fundstelle / Aufgabe:** verschiedene, siehe Liste.

**Beobachtung:**
- **„Zusammenführen" ohne Quittung:** Nach dem Tipp schließt das Formular,
  die Karte zeigt „seit …: Stärke 6 → 8", aber es gibt weder Quittung noch
  „Rückgängig". „Aufteilen" hat beides. Zurück geht es nur, indem man von
  Hand neu aufteilt und die Personen wieder auswählt. Code:
  `src/app/einsaetze-ui.tsx`, `zusammenfuehrenAusfuehren` (um Zeile 2370).
- **Papierkorb ohne Restfrist:** Ein Einsatz, der vor 29,7 Tagen gelöscht
  wurde, steht als „gelöscht am 6.9.2026 — wird nach 30 Tagen automatisch
  endgültig entfernt" da, genauso wie einer von vorgestern. Dass er morgen
  verschwindet, muss man selbst ausrechnen.
- **Endgültige Löschungen ohne Exportstand:** „Alle Daten löschen" nennt
  „1 Einsatz-Sammlung mit 2 gemeldeten Bögen", „Endgültig löschen…" im
  Papierkorb nennt Name und Zahl. Beide sagen nicht, dass es von dieser
  Sammlung noch keinen Export gibt, obwohl die Startkarte das weiß
  („Export: noch keiner").
- **Startkarte der Vorlagen-Bearbeitung:** Der Knopf heißt weiter
  „Verwerfen", die Rückfrage dahinter „Bearbeitung beenden". Das Wort auf der
  Karte klingt schärfer, als es ist, und gleicht dem „Verwerfen" eines echten
  Bogens.

**Erwartung der Rolle:** Gleiche Handlungen haben den gleichen Rückweg. Vor
dem endgültigen Löschen sehe ich, ob es eine Kopie gibt.

**Auswirkung im Einsatz:** Nacharbeit und Unsicherheit, kein Verlust
gemeldeter Daten.

**Empfehlung:** Nach „Zusammenführen" die Daumenleiste mit „Rückgängig"
zeigen. Im Papierkorb das Löschdatum nennen („wird am 06.10.2026 endgültig
entfernt", ab drei Tagen hervorgehoben). In beiden endgültigen Löschungen
den Exportstand je Sammlung nennen. Die Karte der Vorlagen-Bearbeitung mit
„Bearbeitung beenden" beschriften.

**Nachprüfung:** Jeden Punkt einzeln wie beschrieben nachstellen.

### Verweise auf andere Runde-4-Berichte

- [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md), Zwischennotiz zur
  Ähnlichkeitsfrage „Ist das dieselbe Einheit?": Dort ist „Ja — nur die
  Stärke … ändern" vorbelegt, auch bei Ulm ↔ Neu-Ulm. Aus Sicht dieser Rolle
  ein stilles Überschreiben einer fremden Einheit. Nicht selbst nachgestellt,
  hier nicht gezählt.

## Bestätigtes

- **Rückfragen beim Verdrängen:** Startseite „Verwerfen", Kaltstart über
  Link und „Bogen öffnen" nennen den Bogen, der vom Rückholplatz fällt, mit
  Stand, Personenzahl und Einsatzort („… 9 Personen · ‚Hochwasser
  Kirchehrenbach — Sandsackver…' wird dabei endgültig gelöscht"), Knopf rot.
- **Löschen im Assistenten:** Person, Erreichbarkeit und Fahrzeug mit
  Rückfrage und Namen, danach „Rückgängig" (108 × 44 px) in der Daumenleiste
  über „Weiter".
- **Abrücken:** ohne Rückfrage, Quittung unten mindestens 40 s, Doppeltipp
  mit 120, 400 und 900 ms bleibt abgerückt („✓ Abgerückt" gesperrt). Ab etwa
  1,5 s liegt „Wieder anwesend" unter dem Finger; das ist der gewollte
  Rückweg und wird ebenfalls quittiert.
- **Vorlage löschen:** Doppeltipp mit 150 bis 1000 ms legt nur die getroffene
  Vorlage in den Papierkorb.
- **„Alle Daten löschen":** Aufzählung mit Vorlagen, Sammlungen, Entwurf,
  Absenderkarte, Geräteschlüssel, „Vorher Sicherung erstellen…", Haken,
  „Endgültig löschen" bis dahin gesperrt.
- **„Verschieben…":** Rückfrage „verliert 8 Helfer", danach „Rückgängig —
  zurück nach ‚Hochwasser Donau'".
- **Zwei Fenster:** Am selben Bogen speichert das ältere Fenster nicht mehr
  („Eingaben hier werden erst wieder gespeichert, wenn du entscheidest").
  An derselben Sammlung übernimmt das zweite Fenster die Entfernung des
  ersten, bevor es selbst schreibt.
- **Aufräumfrist bei richtiger Uhr:** „Wird in 5 Tag(en) automatisch
  gelöscht …" auf der Startkarte und in der Einsatzansicht.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Sicherung einspielen" listet „0 Vorlagen ·
  kein angefangener Bogen" als Verlust, und trotzdem verschwinden der Bogen auf
  dem Rückholplatz und die Absenderkarte (R4-D2).
- **Größtes Einsatzrisiko:** Ein Tablet mit falschem Jahr löscht beim Öffnen
  die laufende Lage endgültig, ohne dass jemand etwas getippt hat (R4-D1).
- **Top-Priorität für die nächste Iteration:** Aufräum- und Papierkorbfrist
  an die geprüfte Uhr hängen und automatische Löschungen über den Papierkorb
  führen (R4-D1).

## Abgleich mit Runde 3

Grundlage: [../runde-3/zerstoerende-handlungen.md](../runde-3/zerstoerende-handlungen.md)
und [../runde-3/README.md → Stand der Behebung](../runde-3/README.md#stand-der-behebung).

| Runde-3-Befund | Stand laut Behebung | Bewertung Runde 4 | Beobachtung |
| --- | --- | --- | --- |
| R3-D1 Vorlage bearbeiten, „Verwerfen" löscht eigenen Bogen (P1) | behoben | hält | Rückfrage „Bearbeitung der Vorlage beenden? … Dein Bogen ‚THW Ulm Bergungsgruppe' (5 Personen · ‚ECHTER EINSATZ Deichsicherung') bleibt … zurückholbar". Danach Rückholplatz 5 Personen / „ECHTER EINSATZ …", Vorlage 8 Personen. Startkarte „Bearbeitung der Vorlage ‚OV Ulm B' — kein Einsatzbogen"; Knopf heißt noch „Verwerfen" (R4-D5). |
| R3-D2 Kaltstart über Link überschreibt Rückholplatz (P2) | behoben | hält | Während des Dialogs Arbeitsplatz Ulm, Rückholplatz Albstadt. „Abbrechen" mit und ohne Sammlung: unverändert. „Bogen öffnen" fragt erst und nennt Albstadt, „Meldung öffnen" danach Lüneburg / Ulm. |
| R3-D3 Person entfernen: Quittung oberhalb des Bilds (P2) | behoben | hält | Quittung „Entfernt: Herrmann, Moritz · Rückgängig" in der Daumenleiste über „Weiter", im Bild. Fahrzeug: „Rückgängig" bei y = 509, 108 × 44 px. |
| R3-D4 Kleinere Lücken (P3) | behoben | weitgehend | Fahrzeug-„Rückgängig" ✓, Vorlagen-„Rückgängig" 108 × 44 px ✓, „Alle Daten löschen" nennt den Rückholplatz ✓ (aber „Sicherung einspielen" nicht, R4-D2), Fristwarnung in der Einsatzansicht ✓. Der Rückweg einer entfernten Meldung übersteht Wegnavigieren, aber kein Neuladen; als R4-D3 weitergeführt. |
| Verweis R3-S5 Doppeltipp „Abrücken" (P2) | behoben | hält | 120 bis 900 ms: bleibt abgerückt, „✓ Abgerückt" gesperrt. Ab 1,6 s schaltet der zweite Tipp bewusst zurück, mit Quittung. |
| Verweis R3-E6 „Verschieben…" ohne Rückgängig (P3) | behoben | hält | „Rückgängig — zurück nach ‚Hochwasser Donau'" im Folgedialog. |
| Verweis R3-S1 Link im laufenden Tab (P0) | behoben | nicht nachgeprüft | Nur der Kaltstart wurde nachgestellt (siehe R3-D2). |
| Verweis R3-S3 Zweites Fenster überschreibt Entwurf | behoben | hält | Älteres Fenster speichert nicht, Hinweis „Stand aus dem anderen Fenster laden". |

Bilanz: Alle vier eigenen Runde-3-Befunde halten, R3-D4 mit einem Rest
(R4-D3). Keine Behebung hat sich verkehrt. Neu sind R4-D1, R4-D2, R4-D4 und
R4-D5; sie liegen in Wegen, die Runde 3 nicht geprüft hat (Uhrsprung,
Einspielen ohne laufende Sammlung, Vorbelegung, Zusammenführen).

## Stand der Behebung

Stand 05.10.2026, Paket 1 „Rückfragen, Links, Rückholplatz, Zurück-Geste".
Geprüft mit Typprüfung, Unit-Tests (2 446 grün), Verhaltenstests (137
Szenarien grün) und Nachmessung im Dev-Server (360 × 640,
`isMobile`/`hasTouch`, de-DE, Port 5180). Aufgeführt sind nur die Befunde
dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R4-D2 „Sicherung einspielen" verschweigt Rückholplatz und Absenderkarte | behoben | Beide Aufzählungen nennen Vorlagen (aktiv/Papierkorb), Rückholplatz, Absenderkarte und Geräteschlüssel mit Kurzform vorher/nachher; der Haken ist Pflicht, sobald auf dem Gerät etwas verloren geht. Nachlauf (leerer Arbeitsplatz, Rückholplatz Crailsheim, Absenderkarte, Schlüssel; Sicherung mit 1 Vorlage): alle drei genannt, „Einspielen und ersetzen" bis zum Haken gesperrt. |
