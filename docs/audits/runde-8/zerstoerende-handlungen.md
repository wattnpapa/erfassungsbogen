# Audit „Zerstörende Handlungen", Runde 8 (Löschen, Überschreiben, Statuswechsel)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-destructive-action-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `3fee6e5` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-7-Befunde (siehe [../runde-7/zerstoerende-handlungen.md](../runde-7/zerstoerende-handlungen.md)
und [../runde-7/README.md → Stand der Behebung](../runde-7/README.md#stand-der-behebung-24102026)).
Zuerst habe ich ohne Blick in die Berichte getestet, danach die Behebungen von
Runde 7 einzeln nachgespielt.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Tipps als Touch-Tipp.
Grundeinstellung Telefon 360 × 640; dazu 320 × 568, 640 × 360 quer, Zoom-
Nachbildung (Telefon bei Faktor 2, also 180 × 320 CSS-Pixel), Feld-Modus und
`html { font-size: 200% }`. Jeder Lauf in einem eigenen Browser-Kontext; der
Server wurde weder neu gebaut noch angefasst.

Zustände kamen aus `localStorage`-Seeds (`eeb.entwurf.v1` mit dem Großbogen
„Verstärkter Bergungszug", 38 Personen; `eeb.einsaetze.v1` mit sechs Einheiten
aus `examples/thw/`; alle `uebung: false`, Stand auf heute). Varianten:
Sammlung mit eingestelltem Alter (50, 75, 89, 95 Tage), Entwurf mit
eingestelltem Stand (70, 80, 89, 95 Tage), abgeschnittene Texte (Entwurf,
Sammlung, Vorlagen), drei Meldungen mit `vomPapier`, zwei Bogen-Dateien
(Albstadt, Ulm), eine Sammel-PDF aus „Einsatz weitergeben / sichern".

Die Geräteuhr habe ich nachgestellt, indem eine zweite Seite im selben Kontext
mit einem Skript startete, das `Date` um N Tage verschiebt (die Ausgangsseite
war vorher geschlossen); `eeb.uhr.v1` stand im Format des Geräts
(`{"zuletzt":<Minuten>}`). Zwei Fenster als zwei Seiten im selben Kontext.

Szenarien:

1. Startseite: „Verwerfen", „Neuen Bogen erstellen", „Zuletzt geschlossenen
   Bogen zurückholen", Beispielbogen „Anzeigen", „Aus Datei laden…" (zwei
   Dateien nacheinander), „Geräteschlüssel neu erzeugen", „Alle Daten
   löschen", „Datensicherung" mit „Sicherung einspielen…", „Einsatz löschen…"
   mit Papierkorb.
2. Einsatzansicht: „Abrücken" (Einfach-, Doppeltipp, verzögerter Zweittipp),
   „Entfernen" (mit Nummernfolge, Neuladen, Rückgängig, Doppeltipp auf die
   Bestätigung), „Stärke ändern…", „Aufteilen…", „Verschieben…", „Einsatz
   importieren…" nach Änderungen, „Lage vom Papier abgleichen…", Lagemonitor
   bei gelöschter Sammlung.
3. Assistent: „Person entfernen", „Fahrzeug entfernen", „Bogen schließen",
   „In Einsatz-Sammlung ablegen…", „Als Vorlage speichern" (doppelt),
   „Bogen übergeben…" mit „Für neuen Einsatz vorbereiten".
4. Zwei Fenster: „Alle Daten löschen" in A, „Neu anfangen" in B; „Verwerfen" in
   A, Bearbeiten in B, „Neu laden, hier verwerfen".
5. Selbstlöschende Fristen: Sammlung 50/75/89/95 Tage, Entwurf 70 bis 95 Tage,
   Geräteuhr-Sprünge (Ruhe/Sprung 40/59, 50/45, 40/45, 20/75, 10/10, 365 Tage
   mit nur eigenem Bogen), jeweils mehrfaches Laden.
6. Beschädigte Speichertexte: Entwurf, Sammlung, Vorlagen.
7. Dialoge bei 320 × 568, 640 × 360, 200 % Schrift und Zoom-Nachbildung.

**Nicht prüfbar:** eine echt falsch gestellte Geräteuhr, zwei echte Geräte an
einer Sammlung, Beenden der App durch das Betriebssystem, Kamera-Scan, native
Builds, Handschuhe, das echte Verstreichen von 30 bzw. 90 Tagen (Alter und
Uhr sind nachgestellt), „Aufteilen…" bis zum Ende (nur geöffnet und
gelesen) und eine Sammlung, die ein zweites Gerät gleichzeitig ändert.

## Urteil

Die Löschwege halten, und die Runde-7-Behebungen aus meiner Rolle wirken: Alle
acht Befunde (R7-D1 bis R7-D8) sind im Browser nicht mehr nachzustellen. Jede
endgültige Handlung nennt vor dem Auslösen Namen, Zahl und Folge; „Alle Daten
löschen" und „Sicherung einspielen" zählen auf, was verloren geht, und sperren
den Knopf bis zum Haken; Papierkörbe nennen Datum und Restzeit; „Verwerfen",
„Neuen Bogen erstellen", „Aus Datei laden…" und „Zurückholen" nennen jetzt
auch, wenn der Rückholplatz einen anderen Bogen aufgibt; die Geräteuhr hält
auch beim dritten Lesen und nennt Sammlung und Alter; „Abrücken" und
„Entfernen" haben „Rückgängig" mit Prellschutz.

Offen ist ein Rand, an dem die neue Schutzlogik nicht greift: Ein
abgebrochener oder beschädigter Gesamttext der Sammlungen wird beim ersten
Lesen still durch eine leere Liste ersetzt, ohne Beiseitelegen und ohne
Hinweis (R8-D1), obwohl derselbe Fall beim Entwurf sauber behandelt ist. Dazu
kommt eine Folge des „Entfernen": Die Nummern der späteren Einheiten rücken
nach, ohne dass die Rückfrage das sagt (R8-D2). Ein P0 habe ich nicht
gefunden; alle Aufgaben lassen sich ohne fremde Hilfe erledigen.

## Übersicht: Handlung → Bestätigung → Rückweg

Alles beobachtet bzw. im Speicher gemessen.

| Handlung | Bestätigung | Rückweg (geprüft) |
| --- | --- | --- |
| „Verwerfen" (Startseite) | Rückfrage mit Name; bei belegtem Rückholplatz nennt sie den endgültigen Verlust des dortigen Bogens (Name, Stand, Personenzahl) | „Zuletzt geschlossenen Bogen zurückholen" |
| „Neuen Bogen erstellen" mit Entwurf | Rückfrage „Neuen Bogen anfangen?" | wie oben |
| „Aus Datei laden…" mit Entwurf | Rückfrage; beim zweiten Mal mit „… wird dabei endgültig gelöscht" | wie oben |
| „Zuletzt geschlossenen Bogen zurückholen" mit Entwurf | Rückfrage nennt den ersetzten Bogen | tauscht |
| Beispielbogen „Anzeigen" mit Entwurf | Rückfrage „Beispielbogen öffnen?" | Rückholplatz |
| „Bogen schließen" | Rückfrage, „nicht gelöscht" | Rückholplatz |
| „Person entfernen" | Rückfrage mit Name | Quittung „Rückgängig" |
| „Fahrzeug entfernen" | Rückfrage mit Kennzeichen; Text „gehen verloren", kein Wort zu „Rückgängig" | nicht geprüft |
| „Als Vorlage speichern", gleicher Name | Rückfrage „Zusätzlich anlegen / Vorhandene ersetzen" | — |
| „Für neuen Einsatz vorbereiten" | Rückfrage mit Folgen, „lässt sich hier nicht zurücknehmen" | keiner, bewusst |
| „Abrücken" | keine | Quittung „Rückgängig", ab etwa 1,4 s |
| „Entfernen" (Meldung) | Rückfrage: „gibt es nur, solange die App geöffnet bleibt" | „Rückgängig" (nicht nach Neuladen, wie angesagt); Nummern nicht genannt (R8-D2) |
| „Stärke ändern…" | Plausibilitätsfrage („mehr als das Dreifache") | Historie |
| „Einsatz importieren…" nach lokalen Änderungen | Frage zu entfernten Meldungen; abgerückt bleibt abgerückt | — |
| „Einsatz löschen…" | Rückfrage „30 Tage zurückholen" | Papierkorb, „Rückgängig" |
| Papierkorb „Endgültig löschen…" | Rückfrage | keiner, bewusst |
| „Alle Daten löschen" | Aufzählung, Haken, Knopf gesperrt, „Vorher Sicherung erstellen…" | Sicherungsdatei |
| „Sicherung einspielen…" | Aufzählung beider Seiten, Haken | Sicherungsdatei |
| „Geräteschlüssel neu erzeugen" | Rückfrage; mit Schlüssel „Vorher Sicherung erstellen…", ohne Schlüssel „gelöscht wird nichts" | Sicherungsdatei |
| Papier-Abgleich „Eingaben verwerfen…" | Rückfrage mit Zahl der Einheiten | — |
| Geräteuhr ab 31 Tage Sprung mit Fälligem | Warnung, Rückfrage mit Namen und Alter | „Uhr korrigieren" |
| Sammlung 90 Tage ruhend | Ankündigung ab etwa 60 Tagen auf der Startseite („in 15 Tag(en)") | Export |
| Entwurf 90 Tage alt | keine Ankündigung; Anonymisierung beim Start (R8-D3) | keiner |
| Abgeschnittener Entwurf | Karte „nicht gelöscht, sondern beiseitegelegt", „Als Datei sichern", „Entfernen…" | Datei |
| Abgeschnittener Sammlungstext | **keine** (R8-D1) | keiner |

## Befunde

### R8-D1 [P1] Ein abgebrochener oder beschädigter Gesamttext der Sammlungen wird beim ersten Lesen still durch `[]` ersetzt; ein beschädigter Vorlagentext bleibt unsichtbar liegen (Rest von R7-E2)

**Priorität:** P1

**Kennzeichnung:** gemessen (Speicher nach dem Start, drei Läufe; Vorlagen in
einem Lauf). Dass ein solcher Text im Betrieb entsteht, ist ein Risiko:
`localStorage` schreibt zwar einen Wert atomar, aber eine von Hand bearbeitete
oder eingespielte Datei, ein Fehler des Browsers oder ein abgebrochenes
Einspielen sind denkbar. Die App behandelt denselben Fall beim Entwurf als
plausibel und sichert ihn (Karte „Ein gespeicherter Bogen ließ sich nicht
öffnen").

**Fundstelle / Aufgabe:** Startseite mit `eeb.einsaetze.v1`, dessen Text nach
70 % abgeschnitten ist (Sammlung mit sechs Einheiten). Code:
`src/app/einsaetze-lesen.ts` (`unlesbaresRetten`),
`src/app/unlesbar.ts` (`unlesbareSammlungsteile` gibt bei nicht lesbarem JSON
nichts zurück).

**Beobachtung:**

- Vor dem Laden: `eeb.einsaetze.v1` mit etwa 13 900 Zeichen. Nach 1,8 s auf der
  Startseite: `eeb.einsaetze.v1` = 2 Zeichen (`[]`). `eeb.unlesbar.v1` fehlt,
  `sessionStorage` und IndexedDB enthalten nichts davon. Dasselbe bei einem Text
  ohne letztes Zeichen und bei einem Objekt statt einer Liste.
- Die Startseite zeigt keine Sammlungskarte und keinen Hinweis („beschädigt",
  „beiseitegelegt", „nicht öffnen" kommen nicht vor). Der Helfer sieht eine
  Startseite wie bei einem frischen Gerät.
- Zum Vergleich der abgeschnittene Entwurf im selben Lauf: `eeb.entwurf.beschaedigt.v1`
  hält die 10 240 Zeichen, die Karte nennt Ursache, Löschdatum (21.01.2027)
  und bietet „Als Datei sichern" und „Entfernen…".
- Ein abgeschnittener Vorlagentext (`eeb.vorlagen.v1`, 60 %) bleibt mit 8 857
  Zeichen im Speicher, es gibt weder eine Vorlagenkarte noch einen Hinweis. Beim
  nächsten Speichern einer Vorlage würde er voraussichtlich überschrieben
  (nicht ausgeführt, deshalb Risiko).

**Erwartung der Rolle:** Was die App nicht lesen kann, ist nicht weg: Sie legt
den Text beiseite wie beim Entwurf, nennt es auf der Startseite und bietet
„Als Datei sichern" an. Eine ganze Einsatz-Sammlung verschwindet nicht, ohne
dass es jemand merkt.

**Folge:** Ein Meldekopf mit einer beschädigten Sammlung (alle Meldungen,
Historie, Züge) hat danach einen leeren Speicher und keinen Anlass, nach einem
Rest zu suchen. Die Wiederherstellung geht nur über eine frühere Sicherungsdatei
oder das Papier. P1, weil der Eintritt selten ist, die Wirkung aber die ganze
Lage trifft und ohne jedes Zeichen geschieht; die Aufgabe „Lage weiterführen"
ist danach nur mit Papier und Umweg möglich.

**Empfehlung:** Nicht parsbaren Gesamttext (Sammlungen, Vorlagen) wie die
Teile aus R7-E2 unter `eeb.unlesbar.v1` beiseitelegen, auf der Startseite
benennen und „Als Datei sichern" anbieten; mindestens den Rohtext nicht durch
`[]` überschreiben, solange nichts Neues entstanden ist.

**Nachprüfung:** Sammlungstext abschneiden, Startseite laden: Der Rohtext liegt
noch im Speicher (anderer Schlüssel), und die Startseite nennt ihn mit Datum
und „Als Datei sichern". Vorlagentext abschneiden: Hinweis statt Schweigen.

### R8-D2 [P2] „Entfernen" einer Meldung verschiebt die Nummern der späteren Einheiten; die Rückfrage sagt es nicht

**Priorität:** P2

**Kennzeichnung:** gemessen (Kartenliste vorher, nachher, nach „Rückgängig").

**Fundstelle / Aufgabe:** Einsatzansicht mit sechs Einheiten (Nr. 1 bis 6) →
Karte Nr. 2 aufklappen → „Mehr…" → „Entfernen" → „Meldung entfernen". Code:
`src/app/einheiten-tabelle.ts` (`meldungsNummern`, Kommentar „Wird eine Einheit
entfernt, rücken die späteren nach").

**Beobachtung:**

- Rückfrage: „„THW Bamberg Fachgruppe Wassergefahren (A)" (Stand …) wird aus
  diesem Einsatz entfernt — samt Historie." Sie nennt weder die Nummer der
  Einheit noch, dass Nr. 3 bis 6 danach Nr. 2 bis 5 heißen.
- Danach stehen die Karten als Nr. 1 bis 5 da; „Rückgängig" stellt Nr. 1 bis 6
  wieder her. Gleiches bei Nr. 3 (Ulm), das ich im ersten Lauf entfernte: Nr. 4
  (Oberhausen-Rheinhausen) hieß danach Nr. 3.
- Die Nummer steht auf Karte, Tabelle und Lageblatt „dieselbe" (Kommentar im
  Code) und wird über Funk genannt („Nr. 3 rückt ab"). Die Quittung nach dem
  Entfernen nennt die entfernte Nummer („Meldung Nr. 3 …"), nicht die neue
  Reihenfolge.

**Erwartung der Rolle:** Eine Nummer, die am Funk und auf einem schon
gedruckten Lageblatt steht, bleibt bei derselben Einheit, solange die Lage
läuft; sonst sagt die Rückfrage vor dem Entfernen, welche Nummern sich ändern.

**Auswirkung im Einsatz:** Wer ein Lageblatt ausgedruckt hat und danach eine
Doppelmeldung entfernt, hat auf Papier und Display verschiedene Nummern für
dieselben Einheiten; „Nr. 4 abrücken" am Funk trifft zwei Verschiedene.
Fehlbedienungen wie „Abrücken" bei der falschen Karte sind die Folge. Die
Verwechslung setzt ein früheres Lageblatt oder Funkverkehr mit Nummern
voraus; deshalb P2.

**Empfehlung:** In der Rückfrage die Folge nennen („Die Nummern 3 bis 6
rücken nach") oder entfernte Nummern nicht neu vergeben; nach dem Entfernen
einmal kurz die geänderten Nummern anzeigen, solange „Rückgängig" steht.

**Nachprüfung:** Einheit Nr. 2 von 6 entfernen: Rückfrage und Quittung nennen
die verschobenen Nummern, oder die Nummern bleiben stehen.

### R8-D3 [P3] Entwurf: Anonymisierung nach 90 Tagen ohne Vorwarnung und ohne Zeichen auf der Startseite

**Priorität:** P3

**Kennzeichnung:** gemessen (Entwurf mit Stand 80 und 95 Tage zurück, Geräteuhr
unverändert).

**Fundstelle / Aufgabe:** Startseite mit Entwurf (38 Personen), `stand` 80
bzw. 95 Tage alt. Code: `src/app/datenschutz-uhr.ts` und das Format
`@bos/eeb-format/datenschutzfrist`.

**Beobachtung:**

- Bei 80 Tagen: Karte „Stärke 1 / 9 / 28 / 38 … gespeichert 04.08." mit
  „Fortsetzen", kein Wort zur Frist (im Gegensatz zur Sammlung, die ab etwa 60
  Tagen „Wird in 15 Tag(en) automatisch gelöscht" ankündigt).
- Bei 95 Tagen: Beim Start ist `personal[0]` im Speicher bereits „Einsatzkraft 1"
  ohne Vor- und Nachnamen, ohne Funktionen und Kontakte; die Startseite sieht
  unverändert aus (Stärke 1 / 9 / 28 / 38). Erst in den Schritten des Assistenten
  steht „DATENSCHUTZFRIST ABGELAUFEN — Namen, Funktionen, Qualifikationen und
  Erreichbarkeiten wurden 90 Tage nach der letzten Änderung entfernt."
- Schritt 2 trägt dauerhaft „Datenschutzfrist: Namen werden nach 90 Tagen
  anonymisiert".

**Erwartung der Rolle:** Was die App von selbst löscht, kündigt sie vorher an
(wie bei der Sammlung) und sagt es dort, wo man den Bogen wieder aufnimmt.

**Folge:** Namen und Erreichbarkeiten sind nach der Frist weg, bevor jemand den
Bogen weitergegeben hat; die Frist ist gewollt, die fehlende Ankündigung macht
sie zur Überraschung. Der Hinweis im Bogen kommt erst nach der Löschung.

**Empfehlung:** Auf der Entwurfskarte ab etwa 60 Tagen „Namen werden in n Tagen
anonymisiert — vorher weitergeben oder sichern" und nach dem Ablauf den Satz
auch auf der Startseite zeigen.

**Nachprüfung:** Entwurf 80 Tage alt: Karte nennt die Restzeit; 95 Tage: Karte
nennt die Anonymisierung.

### R8-D4 [P3] Startseite bei Zoom 400 % (180 CSS-Pixel breit): „Fortsetzen" und „Verwerfen" nebeneinander, die Beschriftungen laufen über den Knopf

**Priorität:** P3

**Kennzeichnung:** gemessen (Maße der Knöpfe), Bildschirmfoto `zoom2_start.png`.

**Fundstelle / Aufgabe:** Startseite mit Entwurfskarte, Zoom-Nachbildung
(Faktor 2 auf Telefon, 180 × 320).

**Beobachtung:** Beide Knöpfe 51 × 44 px nebeneinander, Abstand 12 px;
„Fortsetzen" misst 49 px Breite bei 59 px Text (weiße Schrift im dunklen Knopf
abgeschnitten: „ortsetze"), „Verwerfen" 49/57 px (roter Text ragt über den
Rahmen). Normal, 320 × 568, quer, Feld-Modus und 200 % Schrift: Knöpfe 96 bis
274 px breit, Abstand 12 bis 16 px, kein Überlauf. Andere Knöpfe der Startseite
und der Einsatzansicht laufen bei Zoom 2 nicht über.

**Erwartung der Rolle:** Bei großer Vergrößerung stehen die beiden Knöpfe
untereinander, mit ausgeschriebener Beschriftung.

**Folge:** Die Zerstörende von beiden bleibt lesbar und hat eine Rückfrage mit
Rückholplatz; die Verwechslung kostet deshalb nur einen Dialog. Die
abgeschnittene „Fortsetzen"-Beschriftung ist trotzdem an der Stelle
unangenehm, an der die Hauptaufgabe beginnt. Zoom-Befunde sonst siehe
[mobile-ui.md](mobile-ui.md) bzw. die Runde-8-Berichte der Layoutrollen.

**Empfehlung:** Umbruch der Knopfreihe unterhalb einer Mindestbreite.

**Nachprüfung:** Zoom-Nachbildung 180 × 320: beide Beschriftungen vollständig
sichtbar.

### R8-D5 [P3] „Rückgängig" erscheint unter dem eben getippten „Abrücken"; ein Zweittipp nach etwa 1,4 s nimmt den Statuswechsel zurück

**Priorität:** P3

**Kennzeichnung:** gemessen (Status im Speicher nach Zweittipp mit 0,3 bis 1,9
s Abstand), Risiko für die Wirkung im Einsatz.

**Fundstelle / Aufgabe:** Einsatzansicht, Karte aufgeklappt, „Abrücken" am
unteren Bildrand (Telefon 360 × 640, Knopf bei y 531 bis 575) → Quittungsleiste
„Abgerückt 21:16: Nr. 3 …" mit „Rückgängig" erscheint an derselben Stelle.

**Beobachtung:** Der Zweittipp auf dieselbe Stelle nach 0,04 bis 0,3 s trifft
den gesperrten „Rückgängig" (`disabled`) und ändert nichts; nach 0,6 bis 1,3 s
ist der Knopf freigegeben, löst aber noch nicht aus; ab 1,5 s ändert der Zweittipp
den Status zurück auf anwesend (`000000` statt `000100`). Der Prellschutz hält
also etwa 1,4 s.

**Erwartung der Rolle:** Wer „Abrücken" tippt und es nochmals „zur Kontrolle"
tippt, will nicht den Status zurückdrehen.

**Folge:** Ein Helfer mit Handschuhen, der nach zwei Sekunden nachtippt, setzt
die Einheit wieder auf „anwesend", die Quittung zeigt dabei „Rückgängig" nur
kurz. Die Folge ist gering und klar benannt („Abgerückt 21:16"), deshalb P3.

**Empfehlung:** Die Quittungsleiste nicht an der Stelle des auslösenden Knopfes
einblenden (oben statt unten) oder den Prellschutz auf etwa 2,5 s verlängern.

**Nachprüfung:** Zweittipp nach 2 s auf die Stelle des „Abrücken": Status
bleibt „abgerückt".

### R8-D6 [P3] „Für neuen Einsatz vorbereiten" liegt im Dialog „Bogen übergeben" zwischen „QR-Code im Vollbild zeigen" und „PDF erzeugen"

**Priorität:** P3

**Kennzeichnung:** beobachtet (Bildschirmfoto `ueb.png`); Rückfrage geprüft.

**Fundstelle / Aufgabe:** Assistent Übersicht → „Bogen übergeben…".

**Beobachtung:** Der Knopf steht mit der Form von „PDF erzeugen" (Rahmen, keine
Warnfarbe) direkt darüber, Abstand 24 px zum PDF-Knopf; darüber steht der
Hinweis „Dieser Bogen gehört zum Einsatz 16.07.2026 – 23.07.2026 — gilt er
noch?". Die Rückfrage nennt Zeitraum, Ort/Auftrag und Sofortbedarf mit
den Werten und „Das lässt sich hier nicht zurücknehmen — wer die Angaben noch
braucht, gibt den Bogen vorher weiter"; „Abbrechen, Bogen behalten" steht
daneben.

**Erwartung der Rolle:** Das Zurücksetzende liegt nicht zwischen zwei Wegen zum
Weitergeben.

**Folge:** Die Rückfrage fängt den Fehltipp ab; die Behebung von R7-G2 hält.
Übrig bleibt der Platz in der Reihenfolge, der bei Zeitdruck einen unnötigen
Dialog kostet.

**Empfehlung:** Den Knopf hinter „Weitere Formate" oder ans Ende des Dialogs.

**Nachprüfung:** Dialog öffnen: Zwischen „QR-Code" und „PDF" liegt nur
Weitergeben.

## Bestätigtes

Alles im Browser nachgespielt:

- **R7-D1 „Alle Daten löschen" im zweiten Fenster:** Nach dem Löschen in A
  enthält der Speicher nur `eeb.uhr.v1` und die Offline-Zeile. Fenster B zeigt
  „⚠ In einem anderen Fenster gelöscht oder geschlossen — hier wird nichts
  gespeichert"; „Neuen Bogen erstellen" in B fragt „Er wird hier nicht wieder
  abgelegt und ist danach nicht mehr erreichbar", und nach „Neu anfangen"
  entsteht kein `eeb.entwurf.ersetzt.v1`.
- **Zwei-Fenster-Leiste und Rückfragen:** Verwerfen in A, Bearbeiten in B: Leiste
  „⚠ Hier wird nichts gespeichert …" mit „Neu laden, hier verwerfen",
  „Bogen hier wieder speichern", „Genauer"; 104 px hoch bei 360 × 640 (16 %) und
  153 px bei 320 × 568 mit 200 % Schrift (27 %); eingetippte Änderung in B wird
  nicht gespeichert, „Neu laden, hier verwerfen" lädt neu, ohne weitere
  Rückfrage (so beschriftet).
- **R7-D2 Geräteuhr-Halt:** Ruhe/Sprung 40/59, 50/45, 20/75: dreimal laden,
  jedes Mal Warnung „Geräteuhr prüfen", `eeb.einsaetze.v1` unverändert. 40/45
  und 10/10: nichts fällig, keine Frage. Die Warnung steht auch in der
  Einsatzansicht; „Geräteuhr stimmt" fragt „Datum stimmt — jetzt endgültig
  löschen?" mit Namen und „vor 40 Tagen geändert".
- **R7-D3 Rückholplatz:** Zweite Bogen-Datei: Die Rückfrage nennt „Der dort
  bisher liegende Bogen „THW Oldenburg …" (Stand …, 38 Personen, „Großschadenslage
  …") wird dabei endgültig gelöscht". Gleiches bei „Verwerfen" nach „Neuer
  Bogen".
- **R7-D4 bis D6, D8:** Papierkorb „gelöscht am 13.09.2026 — Wird am
  13.10.2026 endgültig entfernt" zweistellig; Plural „werden die Namen im
  eigenen Bogen endgültig gelöscht"; Geräteschlüssel: mit Schlüssel
  „Vorher Sicherung erstellen…", ohne Schlüssel „gelöscht wird nichts"; zweite
  Vorlage „OV Test" fragt „Zusätzlich anlegen / Vorhandene ersetzen /
  Abbrechen" mit Zeitpunkt der vorhandenen.
- **R7-D7 bei 200 % Schrift:** „Vorher Sicherung erstellen…" liegt bei 320 ×
  568 und 200 % auf Höhe 852 bis 1 037 (zweiter Bildschirm); „Endgültig
  löschen" bei 3 806, „Abbrechen" bei 3 954 von 4 042 px Inhalt. Normal: 296 bis
  365 bzw. 1 082 und 1 139. Quer ohne Vergrößerung: „Endgültig löschen" und
  „Abbrechen" 12 px nebeneinander, „Verwerfen" und „Abbrechen" 8 px (jeweils
  243 × 44).
- **Beiseitegelegter Entwurf:** Karte nennt Ursache, Löschdatum und bietet
  „Als Datei sichern" und „Entfernen…"; „Aus Datei laden…" bleibt erreichbar.
- **Auto-Löschen der Sammlung:** 50 Tage still; 75 Tage „Wird in 15 Tag(en)
  automatisch gelöscht … exportiere sie jetzt"; 89 Tage „in 1 Tag(en)"; 95 Tage
  „Automatisch gelöscht … nicht im Papierkorb" mit Name und Zeitraum.
- **Papier-Abgleich:** Zwischenstand überlebt „Später" und Neuladen („Angefangene
  Eingaben für 1 Einheit sind noch da"); „Eingaben verwerfen…" fragt mit
  Zahl; „Abgleich übernehmen" prüft „Nr." und übernimmt bei Fehlern nichts.
- **Importreihenfolge:** „Einsatz importieren…" aus einer älteren Sammel-PDF
  nach lokalem „Abrücken" und „Entfernen": Frage zur entfernten Meldung
  („Wieder aufnehmen / Draußen lassen"), „abgerückt" bleibt abgerückt.
- **Stärke ändern:** „0 / 20 / 60 / 80" statt 0 / 2 / 6 / 8 löst „Stimmt die
  Stärke?" mit beiden Fassungen aus.
- **Lagemonitor und Papierkorb:** Nach „Einsatz löschen…" zeigt das zweite
  Fenster „Dieser Einsatz liegt im Papierkorb (30 Tage) — im Hauptfenster
  wiederherstellen." statt der alten Lage.
- **Sicherung einspielen:** Aufzählung beider Seiten, „Die laufenden Sammlungen
  dieses Geräts sind danach weg — ohne Papierkorb", Haken, „Vorher Sicherung
  erstellen…".
- **Doppeltipp auf Bestätigungen:** „Meldung entfernen" zweimal im Abstand
  0,04 bis 0,25 s: eine Meldung entfernt, der Zweittipp trifft „Aufklappen" bzw.
  nichts Zerstörendes.
- **Abstände:** „Entfernen" (rot) liegt hinter „Mehr…" in eigener Reihe, 136 px
  von „Verschieben…"; „✕" bei „Person entfernen" 44 px (Feld 54, 200 % 50 × 88)
  mit Abstand zu den Pfeilen; „Fortsetzen"/„Verwerfen" und „Löschen…"/„Öffnen"
  44 px hoch, Abstand 12 bis 16 px bzw. mehr als 150 px.

## Abgleich mit Runde 7

| Befund Runde 7 | Stand in Runde 8 | Beleg |
| --- | --- | --- |
| R7-D1 „Alle Daten löschen" im zweiten Fenster (P2) | hält | Kein `eeb.entwurf.ersetzt.v1` nach „Neu anfangen" in B; Rückfrage nennt „nicht mehr erreichbar" |
| R7-D2 Geräteuhr-Halt nur beim ersten Lesen (P2) | hält | Dreimal geladen, Sammlung bleibt, Warnung steht |
| R7-D3 Rückholplatz fasst einen Bogen (P2) | hält | Rückfrage nennt Verlust mit Name, Stand, Personenzahl |
| R7-D4 Datumsform (P3) | hält | Zweistellig in Papierkorb-Zeile |
| R7-D5 „wird die Namen" (P3) | hält | „werden die Namen im eigenen Bogen" |
| R7-D6 Geräteschlüssel ohne Sicherung (P3) | hält | „Vorher Sicherung erstellen…", Text nach Bestand |
| R7-D7 200 % Schrift, Sicherung am Ende (P3) | hält | „Vorher Sicherung" auf Höhe 852 statt am Ende (zweiter Bildschirm) |
| R7-D8 gleichnamige Vorlage (P3) | hält | Rückfrage „Zusätzlich anlegen / Vorhandene ersetzen" |
| R7-S1/G1 Papier-Abgleich verliert Eingaben | hält | Zwischenstand überlebt Neuladen, „Eingaben verwerfen…" fragt |
| R7-G2 „Für neuen Einsatz vorbereiten" | hält | Rückfrage mit Werten; Platz im Dialog siehe R8-D6 |
| R7-E1/E2/N3 Unlesbares (Entwurf, Teile) | hält mit Rand | Entwurf beiseitegelegt; ganzer Sammlungs- und Vorlagentext nicht (R8-D1) |
| R7-O7 / R6-O9 Uhrstand in der Zukunft | nicht berührt | Grenze bleibt, im Prüfaufbau nicht gemessen |
| R7-G4/M8, R7-G8/H9, R7-N1, R7-N9 | nicht berührt | bekannte Grenzen, nicht erneut geprüft |

Nebenwirkungen der Runde-7-Änderungen: Der Prellschutz an „Rückgängig" hält
den Doppeltipp zuverlässig ab, lässt aber den Zweittipp ab 1,5 s zu (R8-D5).
Der längere Dialog „Alle Daten löschen" und der Rollende-Rumpf-Aufbau der
Rückfragen halten alle Knöpfe erreichbar (320 × 568, quer, 200 %, Zoom 2). Die
neue Hülle für unlesbare Teile (`eeb.unlesbar.v1`) deckt Teile einer lesbaren
Sammlung ab, nicht den Gesamttext (R8-D1). Verweise: Verhalten beim Neuladen
und zwei Fenstern steht ergänzend in
[offline-und-speicher.md](../runde-7/offline-und-speicher.md) und
[fehler-und-wiederanlauf.md](../runde-7/fehler-und-wiederanlauf.md).

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Entfernen" nimmt eine Meldung aus dem Einsatz,
  verschiebt dabei aber unbemerkt die Nummern der übrigen (R8-D2).
- **Größtes Einsatzrisiko:** Ein beschädigter Gesamttext der Sammlungen
  verschwindet beim Start ohne Spur und ohne Hinweis (R8-D1).
- **Top-Priorität für die nächste Iteration:** Nicht lesbare Gesamttexte von
  Sammlungen und Vorlagen beiseitelegen und auf der Startseite benennen, wie es
  der Entwurf schon tut (R8-D1).

Zählung: P0 0, P1 1 (R8-D1), P2 1 (R8-D2), P3 4 (R8-D3 bis R8-D6).
