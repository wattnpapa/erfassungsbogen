# Audit „Fehler und Wiederanlauf", Runde 7 (Bedienfehler provozieren, selbst korrigieren)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-error-recovery-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `a52f20a` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-6-Befunde ([Runde 6](../runde-6/fehler-und-wiederanlauf.md) samt „Stand
der Behebung"), mit Schwerpunkt auf den Stellen, die Runde 6 umgebaut hat:
Fußleiste des Assistenten, Zurück-Verlauf der Startseitenfenster, Rückfragen,
Zwei-Fenster-Abgleich, Lagemonitor mit Datenstand und Bewegungen,
Geräteuhr-Rückfrage, Rückweg im Schritt Personal im Sitzungsspeicher und
Deckel bei großer Schrift.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Gerätedichte 2. Jeder
Lauf hatte einen eigenen Browser-Kontext mit leerem Speicher; elf weitere
Prüfer nutzten denselben Server. Grundeinstellung Telefon 360 × 640 px, dazu
320 × 568, 640 × 360 quer und, für die Rückfragen, `html { font-size: 200% }`.
Der Server wurde nicht angerührt, nichts neu gebaut.

Zustände entstanden durch Bedienung und durch `localStorage`-Seeds aus
`examples/thw/` (alle mit `uebung: false`, `stand` auf heute):

- `eeb.entwurf.v1`: Großbogen „Verstärkter Bergungszug" (38 Personen, 10
  Fahrzeuge); Varianten ohne `organisation`, mit `stand` 85 und 100 Tage alt.
- `eeb.einsaetze.v1`: Sammlung „Hochwasser Musterstadt" mit sechs Einheiten;
  Varianten mit Einträgen ohne `organisation`, `einheitsTyp`, `fahrzeuge`,
  mit `einheit`/`personal`/`einsatz`/`stand`/`hierarchie` gleich `null`, mit
  `eintraege: null`, ohne `id`, mit `status: 99`.
- `eeb.vorlagen.v1`: Vorlage mit und ohne `fahrzeuge`, `einheitsTyp`,
  `organisation`, mit `personal: null`.
- `eeb.uhr.v1`: letzter Start 30, 70, 120 und 400 Tage in der Zukunft; zur
  Nachprüfung von R6-E5 die Sammlung samt Zeitstempeln um 120 Tage nach vorn
  geschoben (gleiche Zeitlinie).

Geprüft habe ich, zuerst ohne Blick in die Berichte:

- **Falsche Eingabe:** „Weiter" ohne Pflichtfelder, Einsatzzeitraum mit Ende
  vor Beginn und mit Jahr 2062 bzw. 2020, Sitzplätze 999, −5, 1,5 und 83,
  Verpflegung 380 statt 38, 62 000 l Diesel, Benzin −40, Mannschaft 99 statt 9
  und −1 in der Schnellerfassung, „Namen einfügen…" mit leerer Zeile, Zahl,
  Doppelung und Klammerzusatz.
- **Abbruch und Neuladen:** Tippen und sofort neu laden, Neuladen im
  Assistenten, Neuladen im Offline-Betrieb (Dienst-Skript warm, `setOffline`),
  Zurück-Geste (`history.back()`) von jedem Schritt bis zum Verlassen, bei
  offener Rückfrage und nach dem „Startseite"-Knopf.
- **Falscher Kontext:** „Neuen Bogen erstellen" bei vorhandenem Entwurf,
  „Verwerfen", Organisation wechseln nach Eingabe von Einheitstyp und
  Zugehörigkeit, Einheitstyp wechseln nach eingetragenem Namen, „Entfernen"
  einer Meldung, „Einsatz löschen…" bei offenem Lagemonitor und Rückholen,
  „Sicherung einspielen…" mit neuerem Stand auf dem Gerät.
- **Doppeltes Auslösen:** Doppeltipp auf „Neuen Bogen erstellen" mit 0, 120,
  300, 600 und 900 ms.
- **Zwei Fenster:** derselbe Entwurf in zwei Fenstern desselben Kontexts,
  jedes Fenster zuerst, „Stand aus dem anderen Fenster laden", „Meine Fassung
  behalten".
- **Bestand:** Sammlungen und Vorlagen mit fehlenden oder `null`-Feldern,
  Startseite und Sammlung öffnen, danach schreiben.
- **Speicher voll** (Stub auf `Storage.prototype.setItem` für `eeb.*`, nach dem
  Laden gesetzt) bei „In Einsatz übernehmen" der Schnellerfassung.
- **Datei:** „Als Datei sichern" des beiseitegelegten Entwurfs und Einlesen
  über „Aus Datei laden…".
- **Rückweg:** „Person entfernen" mit Schrittwechsel, Neuladen und weiterem
  Tippen; „Rückgängig" von „Abrücken".
- **Datenschutzfrist am Entwurf** (85 und 100 Tage alt).

**Nicht prüfbar:** Kamera und Handscanner, echte Handschuhe, echtes Licht,
Bildschirmtastatur (nur nachgestellt), der Zurück-Knopf eines Android-Geräts
(nur `history.back()`), WebKit/Safari, native Builds, Zeitmessung unter Last
(Tipps in den ersten 0,9 s nach einem Wechsel verschluckt die Ortssperre; die
Skripte warten 1,7 s). Papier-Abgleich und Exportstand habe ich nicht
eigens durchgespielt; was dort auffiel, steht in den Berichten
`handschuh-bedienung.md` und `stress-und-unterbrechung.md` (R7-G1, R7-S1).

**Nicht als Befund gewertet:** Ein Seed mit Zeitstempeln der echten Zeit und
einem Uhrstand 120 Tage in der Zukunft führte beim Start zur endgültigen
Löschung der Sammlung („Automatisch gelöscht … 90 Tage unverändert"), obwohl
die Geräteuhr-Rückfrage versprach, bis zur Antwort nichts zu löschen. Diese
Mischung zweier Zeitlinien entsteht im Betrieb nur, wenn Daten vor einem
falschen Start entstanden und der falsche Stand danach angenommen wurde; ich
habe den Weg nicht nachgestellt und werte es als Seed-Artefakt, nicht als
Befund. Mit durchgehend verschobenen Zeitstempeln blieb alles erhalten (siehe
Bestätigtes).

Skripte und Screenshots liegen außerhalb des Repositorys unter
`/tmp/claude-0/-home-user-erfassungsbogen/80562043-ef9f-5d01-b383-2703357d8a5e/scratchpad/runde7/`.

Rolle: Helfer, der normale Fehler macht und danach selbst weiterkommen will.

## Urteil

Die Umbauten aus Runde 6 halten fast überall. Der Bestand aus dem Speicher
stürzt nicht mehr ab: Sammlungen und Vorlagen ohne Einheitstyp, ohne Fahrzeuge,
mit `null` in `hierarchie`, `einsatz`, `stand` oder `personal` öffnen sich;
keine Fehlerseite. Voller Speicher bei „In Einsatz übernehmen" zeigt jetzt
einen Dialog mit der Stärke zum Notieren. Der Zahlendreher in der
Schnellerfassung (99 statt 9) wird gefragt. Die Zurück-Geste führt vom
Assistenten in zwei Schritten aus der App, mit und ohne bestätigte Rückfrage.
Der Rückweg nach „Person entfernen" überlebt Schrittwechsel und Neuladen und
holt die Person an ihren Platz zurück. Fast jede Rückfrage nennt, was
verloren geht und wo es zu holen ist: „Neuen Bogen anfangen?", „Einsatz
löschen?", „Meldung entfernen?", „Organisation wechseln?", „Sicherung
einspielen?" (mit Gegenüberstellung der Bestände), „Stand aus dem anderen
Fenster laden?". Der Lagemonitor folgt dem Löschen und Zurückholen des
Einsatzes ohne Zutun.

Reibung bleibt dort, wo die Behebungen der Runde 6 nur halb greifen oder
etwas verschweigen. Erstens liest „Aus Datei laden…" die gesicherte Hülle des
beiseitegelegten Entwurfs weiterhin nicht: Die Meldung „stammt nicht aus
dieser App" steht dort, wo nach Behebungsstand die Ursache und der Hinweis
„nur für die Support-Stelle" stehen sollten (R7-E1). Zweitens zeigt die App
unbrauchbare Einträge nicht mehr durch Absturz an, sondern gar nicht: Eine
Sammlung, deren Einträge alle unbrauchbar sind, steht als „Noch keine
Meldung." da (R7-E2, Fortsetzung von R7-N3). Alles andere sind kleine Lücken
im Wiederanlauf (R7-E3 bis R7-E8).

Den eigenen Bogen und die Meldekopf-Aufgaben schafft der Helfer ohne fremde
Hilfe; Stellen, an denen er in eine Sackgasse läuft, fand ich nur im
Altbestand (R7-E1, R7-E2).

## Befunde

### R7-E1 [P2] Die gesicherte Hülle des beiseitegelegten Entwurfs wird beim Einlesen als „nicht aus dieser App" abgewiesen; die zugesagte Ursache fehlt (Rest von R6-E3)

**Priorität:** P2

**Kennzeichnung:** gemessen (Datei erzeugt, über „Aus Datei laden…" eingelesen,
Meldung ausgelesen; Ursache im Code gegengelesen).

**Fundstelle / Aufgabe:** Entwurf ohne `einheit.organisation` im Speicher →
Startseite: „Ein gespeicherter Bogen ließ sich nicht öffnen …" → „Als Datei
sichern" → „Aus Datei laden…" mit der gespeicherten Datei. Code:
`src/app/datei-fehler.ts` (`jsonArt`, `dateiFehlerMeldung`),
`src/app/hilfen.ts` (`bogenLaden`).

**Beobachtung:**

- „Als Datei sichern" lädt `eeb-beschaedigter-entwurf.json` herunter, und die
  Karte bestätigt: „Datei „eeb-beschaedigter-entwurf.json“ gespeichert
  (Downloads). Der beiseitegelegte Bogen bleibt zusätzlich auf dem Gerät."
  Das ist neu und gut.
- Die Datei einzulesen endet mit: „„besch.json“ stammt nicht aus dieser App.
  Beim Absender die PDF des Bogens anfordern oder den QR-Code scannen." Der
  Stand der Behebung nennt eine Meldung mit dem fehlenden Pflichtfeld und dem
  Hinweis, die Datei diene nur der Support-Stelle; sie erscheint nicht.
- Ursache laut Code: `bogenLaden` erkennt die Hülle (`gespeichert`, `bogen`)
  und wirft die genaue Meldung. `dateiFehlerMeldung` ersetzt sie aber durch
  die Klassifizierung des Dateitexts, und `jsonArt` kennt die Hülle nicht
  (kein `schemaVersion` auf oberster Ebene), also `json-fremd`. Die eigene
  Meldung wird nur gezeigt, wenn die Klassifizierung nichts erklärt.
- Die Startseite verspricht dagegen: „… als Datei sichern, dann lässt er sich
  über „Aus Datei laden…“ wieder einlesen, sobald nichts Wesentliches mehr
  fehlt." Was „Wesentliches" ist und wie es sich in der App nachtragen ließe,
  steht nirgends; die App bietet dafür keinen Weg.

**Erwartung der Rolle:** Die Meldung nennt die Ursache („die Organisation der
Einheit fehlt") und sagt ehrlich, dass sich das in der App nicht nachtragen
lässt. Der Helfer, der den Bogen schon verworfen glaubt, weiß dann, dass er
nur noch das Papier oder die Absender-PDF hat.

**Folge:** Der Helfer sichert, liest ein, erhält eine falsche Auskunft und
sucht beim „Absender" nach einem Bogen, den er selbst geschrieben hat. Er
verliert Zeit und hält die Datei für kaputt. Gering bei seltenem Anlass.

**Empfehlung:** Die Hülle bei der Klassifizierung als Bogen-Datei erkennen,
damit die genaue Meldung gezeigt wird. Den Versprechenssatz auf der
Startseite an das tatsächlich Mögliche anpassen.

**Nachprüfung:** Entwurf ohne Organisation seeden, „Als Datei sichern", Datei
über „Aus Datei laden…" wählen: Die Meldung nennt „Organisation der Einheit
fehlt" und den Hinweis zum Support.

### R7-E2 [P2] Eine Sammlung mit nur unbrauchbaren Einträgen steht als „Noch keine Meldung." da; ein unlesbarer Rest fällt beim nächsten Schreiben weg, eine Vorlage ohne Organisation verschwindet still (Fortsetzung von R7-N3, Nebenwirkung der Behebung R6-E1)

**Priorität:** P2

**Kennzeichnung:** beobachtet im Seed (Einträge ohne `organisation`,
`eintraege: null`, Vorlage ohne `organisation`); dass es solche Bestände im
Betrieb gibt, ist ein Risiko (frühere Stände vor der Pflichtfeldprüfung, von
Hand bearbeitete Sicherung).

**Fundstelle / Aufgabe:** Startseite → Karte der Sammlung; Sammlung öffnen;
danach „Neue Einsatz-Sammlung…" anlegen; Startseite → Vorlagen. Code:
`src/app/einsaetze-lesen.ts`, `src/app/vorlagen.ts`.

**Beobachtung:**

- Beide Einträge der Sammlung ohne `organisation`: Die Karte sagt „0
  Einheit(en) anwesend · Stärke 0 / 0 / 0 / 0 — Noch keine Meldung.", im
  Speicher liegen zwei Einträge. Der Satz ist falsch: Es gibt zwei Meldungen,
  die App kann sie nur nicht anzeigen. Ein Hinweis, ein Zähler der
  ausgelassenen Einträge oder ein Weg zur Sicherung fehlt (der Fall mit einem
  von zwei Einträgen ist in R7-N3 beschrieben und hier nur als Verweis
  gezählt).
- Ein unbrauchbarer Eintrag neben brauchbaren bleibt beim Schreiben im Speicher
  erhalten (Abrücken geprüft: weiter 2 Einträge). Das ist richtig.
- Eine Sammlung, deren `eintraege` kein Feld ist (`null`), verschwindet von
  der Startseite ohne jedes Zeichen; legt der Helfer danach eine neue
  Sammlung an, steht im Speicher nur noch die neue (`[{"n":"Neu","e":0}]`).
  Die unlesbare Sammlung ist damit weg, ohne Papierkorb.
- Eine Vorlage ohne `organisation` oder mit `personal: null` erscheint nicht
  in der Liste, Fehlermeldung keine. Vorlagen ohne `fahrzeuge` oder ohne
  `einheitsTyp` erscheinen (ergänzt).
- Die Rückfrage von „Sicherung einspielen…" zählt solche Sammlungen mit
  („Sammlung … mit 6 Meldungen"), obwohl die Ansicht weniger zeigt.

**Erwartung der Rolle:** Was die App nicht zeigen kann, benennt sie („2
Meldungen ließen sich nicht lesen — Daten sichern") und legt es nicht still
beiseite oder überschreibt es. „Noch keine Meldung" bleibt für wirklich leere
Sammlungen.

**Folge:** Ein Meldekopf mit Altbestand sieht eine leere Lage, hält sie für
leer und beginnt von vorn; die gespeicherten Meldungen sind nicht mehr
erreichbar und gehen beim nächsten Neuanlegen verloren. Die Zahlen, die er an
den Stab gibt, sind zu niedrig.

**Empfehlung:** Ausgelassene Einträge zählen und anzeigen (Startseite und
Sammlung), mit „Daten sichern" als Weg. Nichts Unlesbares überschreiben,
solange es nicht gesichert oder ausdrücklich verworfen ist; leere Sammlung
und „nur Unlesbares" sprachlich trennen.

**Nachprüfung:** Seed mit Sammlung, deren Einträge alle `organisation`
vermissen: Die Karte nennt die Zahl der nicht lesbaren Meldungen statt „Noch
keine Meldung"; danach „Neue Einsatz-Sammlung…": Die alte bleibt im Speicher
oder liegt beiseitegelegt mit Hinweis.

### R7-E3 [P3] Die Zwei-Fenster-Warnung erscheint schon, wenn ein zweites Fenster den Entwurf nur öffnet; ihr Satz „Eingaben hier werden nicht gespeichert" stimmt dann nicht (neu, Nebenwirkung des Zwei-Fenster-Abgleichs)

**Priorität:** P3

**Kennzeichnung:** gemessen (zwei Seiten in einem Kontext, Speicher nach jedem
Schritt ausgelesen).

**Fundstelle / Aufgabe:** Fenster A: „Fortsetzen" → Schritt 3. Fenster B im
selben Kontext: „Fortsetzen" → Schritt 3, ohne zu tippen. Code:
`src/app/fenster-abgleich.tsx`.

**Beobachtung:**

- Sobald B den Entwurf öffnet, zeigt A die feste Leiste „⚠ Dieser Bogen wurde
  in einem anderen Fenster geändert … Eingaben hier werden erst wieder
  gespeichert, wenn du entscheidest." B hat nichts eingegeben; das Fortsetzen
  schreibt den Entwurf neu.
- Tippt A danach weiter („A1", „A2"), landen beide Eingaben im Speicher. Der
  Satz „werden erst wieder gespeichert" stimmt also nicht, die Leiste bleibt
  stehen. Hat B dagegen echten Inhalt geändert („B1"), wird A's Eingabe nicht
  mehr gespeichert (Speicher bleibt bei „B1", „Braun"); dann stimmt der
  Satz.
- Die Gegenüberstellung „dort: … Stand 23.10.26, 17:55 Uhr, 38 Personen · hier:
  … Stand 23.10.26, 17:55 Uhr, 38 Personen" lautet in beiden Hälften
  gleich; weder Warnung noch Rückfrage sagen, was sich unterscheidet (hier
  nur als Verweis: R7-W5, R7-N6, R7-S2, R7-G6; Größe der Leiste: R7-M2).
- Schutz bleibt: „Stand aus dem anderen Fenster laden" und „Meine Fassung
  behalten" fragen mit „kommt auf den Rückholplatz … lässt sich zurückholen"
  nach; der Weg führt nirgends in Datenverlust.

**Erwartung der Rolle:** Die Warnung kommt, wenn tatsächlich anderer Inhalt
im Speicher liegt, und sagt dann wahr, ob die eigenen Eingaben gerade
gespeichert werden.

**Folge:** Der Helfer, der nur ein zweites Fenster geöffnet hat, sieht einen
gelben Block, der ein Drittel des Bildes belegt, und glaubt, seine Eingaben
gingen verloren. Er tippt „Stand … laden" oder „Meine Fassung behalten", ohne
dass etwas zu entscheiden war.

**Empfehlung:** Die Leiste nur bei tatsächlichem Inhaltsunterschied zeigen;
bei bloßem Neuschreiben nichts. Den Speichersatz an den echten Zustand
koppeln.

**Nachprüfung:** Fenster B nur öffnen: A zeigt keine Warnung. B ändert ein
Feld: A zeigt sie und speichert nicht; B ändert nichts, A tippt: A speichert.

### R7-E4 [P3] Rückfragen: „Neu anfangen" hat den Fokus auf dem Bestätigen-Knopf, „Verwerfen" auf „Abbrechen"; bei 200 % Schrift liegt die Frage über der Kante (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (`document.activeElement`, Dialoggeometrie bei
320 × 568, 360 × 640 und 640 × 360, jeweils mit 200 % Schrift).

**Fundstelle / Aufgabe:** Startseite mit Entwurf → „Neuen Bogen erstellen" →
„Neuen Bogen anfangen?"; dasselbe mit „Verwerfen". Code:
`src/app/dialoge.tsx`.

**Beobachtung:**

- „Neuen Bogen anfangen?": Fokus auf „Neu anfangen". „Angefangenen Bogen
  verwerfen?": Fokus auf „Abbrechen". Beide Rückfragen führen auf denselben
  Rückholplatz.
- Bei 200 % Schrift öffnet „Neuen Bogen anfangen?" (320 × 568, 360 × 640) bis
  zum Ende gerollt: Der Dialog ist 1 265 bzw. 1 086 px hoch bei 534 bzw. 606
  px Fenster; sichtbar sind die letzten Zeilen („… unter „Zuletzt
  geschlossenen Bogen zurückholen“ erreichbar.") und die zwei Knöpfe, die
  Überschrift und der Name des Bogens („wird durch einen leeren Bogen ersetzt")
  liegen darüber. Im Querformat (640 × 360) ist es genauso.
- Doppeltipp auf den Auslöser (0 bis 900 ms): Der Knopf „Neu anfangen" liegt
  109 bis 112 px unter dem Auslöser; kein Doppeltipp erreicht ihn.

**Erwartung der Rolle:** Bei zerstörenden Rückfragen liegt der Fokus auf der
sicheren Wahl; die Frage steht beim Öffnen zuerst im Bild.

**Folge:** Gering: Die Wirkung ist über den Rückholplatz umkehrbar. Wer bei
großer Schrift nur die untere Hälfte liest, bestätigt ohne den Namen des
Bogens gelesen zu haben; ein Enter auf der Tastatur (Tablet mit Tastatur)
bestätigt „Neu anfangen".

**Empfehlung:** Fokus auf „Abbrechen", wie bei „Verwerfen". Dialog beim
Öffnen an den Anfang rollen.

**Nachprüfung:** 320 × 568 bei 200 %: Überschrift und erster Satz stehen beim
Öffnen im Bild; Fokus auf „Abbrechen".

### R7-E5 [P3] Nach „Organisation wechseln" gibt es kein „Rückgängig"; Fahrzeuge behalten das THW-Kennwort (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (Entwurfsstand vor und nach dem Wechsel).

**Fundstelle / Aufgabe:** Entwurf THW mit OV/RB/LV → Schritt 1 → Organisation
„Feuerwehr" → „Organisation wechseln".

**Beobachtung:**

- Die Rückfrage ist gut: „Diese Angaben passen nur zu „THW" und gehen beim
  Wechsel verloren: Einheitstyp …; Zugehörigkeit (OV Oldenburg (NI), RB
  Oldenburg, LV Bremen, Niedersachsen) samt Kürzel, Telefon und E-Mail.
  Benannte Personen und Fahrzeuge mit Kennzeichen bleiben erhalten." „Abbrechen"
  lässt alles stehen.
- Nach der Bestätigung steht `hierarchie` auf einer leeren Zeile, der
  Einheitstyp ist leer. Es erscheint kein „Rückgängig" (Knöpfe der Ansicht
  ausgelesen), anders als beim Wechsel des Einheitstyps („Vorbelegung des
  bisherigen Typs ersetzt: 8 Personen, 2 Fahrzeuge — Stärke 9 → 5." mit
  „Rückgängig").
- Die Fahrzeuge behalten Kennwort und Funkrufnamen („Heros – Heros (THW)");
  bei einer Feuerwehr-Einheit steht das so weiter in Schritt 4 und in der
  Übersicht.

**Erwartung der Rolle:** Wer die Rückfrage mit dem Daumen bestätigt hat und
merkt, dass er das falsche Feld erwischt hat, kommt mit einem Tipp zurück,
wie beim Typwechsel. Das THW-Kennwort fällt auf oder wird erklärt.

**Folge:** Drei Ebenen mit Telefonnummern und E-Mails von Hand neu zu
tippen, unter Stress. Das Kennwort „Heros" bleibt unbemerkt auf dem Bogen
einer anderen Organisation.

**Empfehlung:** „Rückgängig" auch hier; bei Fahrzeugen mit fremdem Kennwort
einen Hinweis in der Rückfrage („Funkrufnamen mit Kennwort Heros bleiben").

**Nachprüfung:** Wie oben: Nach dem Wechsel stellt „Rückgängig" Einheitstyp und
Zugehörigkeit wieder her.

### R7-E6 [P3] Zahlenfelder begrenzen das Getippte still: Sitzplätze 999 werden 99, −5 wird 0, 1,5 wird 1 (neu, beobachtet; Rest von R6-E6)

**Priorität:** P3

**Kennzeichnung:** gemessen (Feldwert nach dem Tippen ausgelesen).

**Fundstelle / Aufgabe:** Schritt 4 „Sitzplätze" (`min 0`, `max 99`); Schritt 5
„Benzin (l)".

**Beobachtung:** 999 wird zu 99, danach rechnet „Sitzplätze: 131 für 38
Personen" mit der Begrenzung, ohne zu sagen, dass die Eingabe verändert wurde.
−5 wird 0, 1,5 wird 1; Benzin −40 wird 0. „83" bleibt stehen und wird in der
Übersicht als „83 Sitzplätze — stimmt das?" gefragt (gut). Die Schnellerfassung
zeigt bei −1 in „Mannschaft" die Rückfrage „mehr Führer als Mannschaft", die
den Wert 0 nennt (gut).

**Erwartung der Rolle:** Eine Eingabe außerhalb des Bereichs wird sichtbar
abgelehnt oder die Begrenzung genannt, statt still einen anderen Wert zu
setzen.

**Folge:** Gering. Wer 120 für einen Reisebus tippt, bekommt 99; die Summe
stimmt dann nicht mehr, und der Helfer sucht den Fehler an der falschen Stelle.

**Empfehlung:** Hinweis am Feld „höchstens 99", sobald der Wert begrenzt wird.

**Nachprüfung:** 999 in „Sitzplätze" tippen: Das Feld zeigt 99 und nennt die
Grenze.

### R7-E7 [P3] „Namen einfügen…" übernimmt Zahlen und Klammerzusätze als Namen, ohne sie zu markieren (neu, Risiko)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Vorschau im Dialog).

**Fundstelle / Aufgabe:** Schritt 3 → „Namen einfügen…" mit sieben Zeilen:
„Müller, Hans", „Schmidt Anna", Leerzeile, „12345", „Müller, Hans", „Max
Mustermann (Gf)", „; DROP;".

**Beobachtung:** Die Vorschau führt sechs Personen auf. „Müller, Hans"
steht doppelt und trägt die Marke „doppelt" (gut, mit erklärendem Satz).
„12345" erscheint als Nachname, „Max Mustermann (Gf)" als „(Gf), Max
Mustermann", „Schmidt Anna" als „Anna, Schmidt" (nach der erklärten Regel
„Vorname Nachname"). Keine Zeile trägt einen Hinweis.

**Erwartung der Rolle:** Zeilen, die kein Name sind (nur Ziffern, Klammer am
Zeilenende), werden markiert, bevor sie übernommen werden.

**Folge:** Nach „6 Personen übernehmen" stehen Fehler im Personal, die nur
beim genauen Lesen der Karten auffallen. Gering, weil die Vorschau sie zeigt.

**Empfehlung:** Auffällige Zeilen mit Marke versehen („kein Name?") und
standardmäßig nicht anhaken.

**Nachprüfung:** Wie oben: „12345" und die Klammerzeile tragen eine Marke.

### R7-E8 [P3] Schnellerfassung: Die Vorschlagsliste des Einheitstyps liegt unter der zweizeiligen Fußleiste (neu, Nebenwirkung der Fußleiste)

**Priorität:** P3

**Kennzeichnung:** gemessen (`getBoundingClientRect`, 360 × 640).

**Fundstelle / Aufgabe:** „Einheit schnell erfassen" (oder „Einheit manuell
erfassen…") → Schritt 1 → „Einheitstyp" antippen → „Fachgruppe Wassergefahren"
tippen.

**Beobachtung:** Die Fußleiste mit „In Einsatz übernehmen" und „← ◐ Ansicht
Weiter →" beginnt bei 512 px; die zwei Vorschläge liegen bei 497 bis 555 und
555 bis 615 px. „FGr W (A)" ist angeschnitten, „FGr W (B)" liegt ganz
darunter. Die Seite rollt nicht zur Liste. Im Assistenten für den eigenen
Bogen (einzeilige Fußleiste ab 570 px) liegen die ersten Vorschläge bei 431
bis 578 px und sind bedienbar; bei 320 × 568 (Leiste ab 498 px) und 640 × 360 (Leiste ab 304 px) liegt schon
der zweite Eintrag unter der Leiste.

**Erwartung der Rolle:** Die Vorschläge stehen im Bild, auch wenn die
Tastatur oder eine Leiste unten Platz nimmt.

**Folge:** Der Helfer sieht „FGr W (A)" halb, die Variante „(B)" gar nicht
und wählt die falsche Fachgruppe oder muss erst rollen. Die Wahl lässt sich
korrigieren, kostet aber Zeit am Meldekopf.

**Empfehlung:** Die Liste beim Öffnen in den freien Bereich rollen oder nach
oben aufklappen.

**Nachprüfung:** 360 × 640, Schnellerfassung: beide Fachgruppen sind ohne Rollen
sichtbar und antippbar.

### Verweise auf Befunde in anderen Runde-7-Berichten

Unabhängig beobachtet und hier nicht gezählt:

- „Für neuen Einsatz vorbereiten" setzt Ort/Auftrag, Zeitraum und Sofortbedarf
  mit einem Tipp zurück (bei mir: 620 l Diesel, Verpflegung 38 verschwinden),
  ohne Rückfrage und ohne „Rückgängig": `handschuh-bedienung.md` R7-G2.
- Papier-Abgleich: „Später", Neuladen und Verlassen verwerfen alle Eingaben:
  `handschuh-bedienung.md` R7-G1, `stress-und-unterbrechung.md` R7-S1.
- Unbrauchbarer Eintrag fehlt still in Zählung und Liste (ein von zwei
  Einträgen): `neuer-nutzer.md` R7-N3.
- Geräteuhr-Rückfrage steht nur auf der Startseite: `arbeitsablauf.md` R7-W2.
- „Bisher" und „Neu" sehen in „Ist das dieselbe Einheit?" gleich aus:
  `neuer-nutzer.md` R7-N8.
- Zwei-Fenster-Leiste: Größe, gleichrangige Knöpfe, gleiche Stände „dort" und
  „hier": `mobile-ui.md` R7-M2, `handschuh-bedienung.md` R7-G6,
  `arbeitsablauf.md` R7-W5, `neuer-nutzer.md` R7-N6,
  `stress-und-unterbrechung.md` R7-S2.
- „Rückholplatz" in den Rückfragen: `neuer-nutzer.md` R7-N4,
  `stress-und-unterbrechung.md` R7-S3.
- Ortssperre verschluckt Tipps in den ersten 0,9 s nach einem Wechsel: bekannt
  aus R5-S2, R5-G5; in meinen Läufen wiederholt aufgefallen.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Bestand aus dem Speicher (R6-E1):** Sammlungen mit Einträgen ohne
  `einheitsTyp`, ohne `fahrzeuge`, mit `hierarchie`, `einsatz`, `stand`,
  `personal` oder `einheit` gleich `null`, ohne `id` oder mit `status: 99`:
  Startseite und Sammlung öffnen sich, keine Fehlerseite. Vorlagen ohne
  `fahrzeuge` oder `einheitsTyp` erscheinen ergänzt. Ein unbrauchbarer Eintrag
  bleibt beim Schreiben im Speicher (Abrücken geprüft).
- **Voller Speicher in der Schnellerfassung (R6-E2):** „Nicht übernommen" als
  Dialog, „„THW Zahlentest“, Stärke 1 / 3 / 9 / 13: bitte auf dem Meldeblock
  notieren, Platz schaffen und dann noch einmal übernehmen. Die Eingaben
  bleiben stehen." Dazu der Block „Speichern fehlgeschlagen" oben im
  Assistenten.
- **Zahlendreher in der Schnellerfassung (R6-E6):** Mannschaft 99 statt 9 →
  „Stimmt die Stärke?" mit „Ja, so übernehmen" und „Zahlen korrigieren".
  Mannschaft −1 → Rückfrage „mehr Führer als Mannschaft — stimmt das?" mit
  dem Wert 0.
- **Zurück-Verlauf (R6-E4):** Assistent → Zurück → Startseite → Zurück → App
  verlassen (zwei Tipps) auch nach bestätigter Rückfrage; Zurück bei offener
  Rückfrage auf der Startseite lässt die Startseite stehen; nach dem
  „Startseite"-Knopf führt Zurück in den Assistenten (Gesamtübersicht) zurück.
- **Folgemeldung bei zurückgestellter Uhr (R6-E5):** Zeitstempel und Uhrstand
  120 Tage in der Zukunft: „Stärke ändern…" 12 → 7 ergibt in der
  Sammelquittung „Folgemeldung 20.02., 17:50: Stärke 12 → 7 (−5)" und in der
  Daumenleiste „Stärke 12 → 7 geändert". Die Warnung „Geräteuhr prüfen"
  („Bis du antwortest, löscht und anonymisiert die App nichts.") steht mit
  „Geräteuhr stimmt" und „Uhr korrigieren" vorn.
- **Rückweg nach „Person entfernen":** Rückfrage „Die Angaben dieser Person
  werden entfernt — … „Rückgängig“ in der Leiste unten holt sie zurück.",
  „Person entfernen" / „Abbrechen" (Fokus „Abbrechen"). Das „Rückgängig"
  bleibt über Schrittwechsel und Neuladen stehen und stellt Person 1 samt
  Stärke 1 / 9 / 28 / 38 wieder her. Nach weiterem Tippen verschwindet es.
- **Vorbelegung:** Typwechsel ersetzt die unbenannte Vorbelegung, behält die
  benannte Person und meldet „Vorbelegung des bisherigen Typs ersetzt: 8
  Personen, 2 Fahrzeuge — Stärke 9 → 5." mit „Rückgängig".
- **Plausibilitäten:** Ende vor Beginn („„bis“ liegt vor „von“"), Jahr 2062
  („Tippfehler im Jahr 2062?"), vergangener Zeitraum („gilt dieser Bogen noch
  für den aktuellen Einsatz?"), Verpflegung 380 für 38 Personen, 62 000 l
  Diesel („mehr als 1.000 l je Fahrzeug. Stimmt das?"), 83 Sitzplätze („stimmt
  das?"). Alle stehen in „offene Punkte für die Weitergabe".
- **Rückfragen mit Folge und Rückweg:** „Neuen Bogen anfangen?" (nennt den
  Bogen und den Rückholplatz), „Einsatz löschen?" (6 Einheiten, Papierkorb 30
  Tage, danach „Rückgängig" in der Leiste), „Meldung entfernen?" (sagt, dass
  „Rückgängig" nur bei geöffneter App gilt, nennt Export-Stand),
  „Organisation wechseln?" (listet den Verlust), „Sicherung einspielen?"
  (Gegenüberstellung „geht dabei verloren" und „in der Datei", „ohne
  Papierkorb", „Vorher Sicherung erstellen…").
- **Neuladen mitten im Tippen:** Namensfeld gefüllt und sofort neu geladen:
  Entwurf mit dem Namen vorhanden, Startseite bietet „Fortsetzen" und
  „Verwerfen". Neuladen offline (Dienst-Skript warm): Startseite, Entwurf und
  „Bogen übergeben…" gehen ohne Netz; die Offline-Zeile nennt den Stand.
- **Doppelt auslösen:** „Abrücken" zählt genau einmal, „Rückgängig" in der
  Leiste. Doppeltipp auf „Neuen Bogen erstellen" erreicht die Bestätigung nicht
  (Knopf 109 bis 112 px darunter).
- **Lagemonitor:** Folgt „Abrücken" („5 Einheiten · 20 Fahrzeuge · 1
  abgerückt", „Abgerückt: THW Albstadt …"), zeigt nach „Einsatz löschen…" „Dieser
  Einsatz ist auf diesem Gerät nicht (mehr) vorhanden." und nach „Rückgängig"
  wieder die Lage, ohne Zutun.
- **Datenschutzfrist am Entwurf:** 85 Tage: „Die Personaldaten dieses Bogens
  werden am 28.10.2026 anonymisiert (noch 5 Tage)." 100 Tage: „DATENSCHUTZFRIST
  ABGELAUFEN — … Stärke und Summen bleiben erhalten." Beides steht auf der
  Seite, auf der „Fortsetzen" landet.
- **Beiseitegelegter Entwurf:** Karte mit Ursache („die Organisation der
  Einheit fehlt"), Löschdatum („am 21.1.2027 von selbst") und Bestätigung nach
  „Als Datei sichern".
- **Wiederanlauf beim zweiten Fenster:** „Stand aus dem anderen Fenster
  laden?" und „Meine Fassung behalten?" nennen beide, wohin die verdrängte
  Fassung geht; ein Tipp ändert nichts am Inhalt, ohne dass die Rückfrage
  kam.

## Abgleich mit Runde 6

Grundlage: [../runde-6/fehler-und-wiederanlauf.md](../runde-6/fehler-und-wiederanlauf.md)
samt „Stand der Behebung" (6 behoben, 0 teilweise, 0 offen).

| Runde-6-Befund | Stand laut Runde 6 | Bewertung Runde 7 | Beobachtung |
| --- | --- | --- | --- |
| R6-E1 Bestand im Speicher stürzt ab (P1) | behoben | hält, Nebenwirkung | Kein Absturz mehr bei Einträgen ohne Einheitstyp, Fahrzeuge oder mit `null`-Feldern; Sammlung und Vorlage öffnen. Wer nicht gezeigt werden kann, fällt still weg: „Noch keine Meldung." bei nur unbrauchbaren Einträgen, Vorlage ohne Organisation verschwindet, unlesbare Sammlung geht beim Neuanlegen verloren (R7-E2, R7-N3). |
| R6-E2 Voller Speicher: Meldung über dem Bildschirm (P1) | behoben | hält | Dialog „Nicht übernommen" mit Stärke zum Notieren; Eingaben bleiben. |
| R6-E3 Gesicherter Entwurf lässt sich nicht einlesen (P2) | behoben | teilweise | Bestätigung nach „Als Datei sichern" hält. Die Ursachenmeldung beim Einlesen erscheint nicht: Die Hülle wird als „nicht aus dieser App" abgewiesen (R7-E1). |
| R6-E4 Zurück-Tipp ohne Wirkung nach Rückfrage (P3) | behoben | hält | Zwei Tipps vom Assistenten bis zum Verlassen, mit und ohne bestätigte Rückfrage. |
| R6-E5 Folgemeldung bei zurückgestellter Uhr (P3) | behoben | hält | Sammelquittung nennt „Folgemeldung … Stärke 12 → 7 (−5)". |
| R6-E6 Zahlendreher in der Schnellerfassung (P3) | behoben | hält | „Stimmt die Stärke?" bei 99 statt 9. Negative Felder werden weiter still zu 0 (Rest in R7-E6). |

Bilanz: Alle sechs Behebungen aus Runde 6 sind im Browser belegt; fünf halten,
R6-E3 nur zur Hälfte (R7-E1). Verkehrt hat sich keine Behebung. Neu aus
Nebenwirkungen: R7-E2 (zu R6-E1), R7-E3 (zum Zwei-Fenster-Abgleich), R7-E8
(zur Fußleiste), R7-E4 (zu Rückfragen und Deckel bei großer Schrift). Aus
Runde 6 neu dazugekommene Stellen, die ich durchgespielt habe und für gut
befinde: Rückweg im Schritt Personal, Rückfragen von Organisationswechsel,
Sicherung einspielen und Entfernen, Lagemonitor beim Löschen und Zurückholen.

## Abschluss

- **Aufgabe geschafft:** ja. Eigener Bogen, Meldekopf-Erfassung, Korrektur nach
  Fehleingaben und Wiederanlauf nach Neuladen, Abbruch und zweitem Fenster
  gehen ohne fremde Hilfe; mit Umweg nur beim Altbestand (R7-E1, R7-E2).
- **Fremde Hilfe nötig:** nein, außer bei einem Altbestand, den die App nicht
  zeigt oder nicht einliest; dort bleibt nur das Löschen oder die Handarbeit
  an der Datei.
- **Größtes Missverständnis:** „Noch keine Meldung." und „stammt nicht aus
  dieser App" sagen dem Helfer etwas anderes, als im Speicher liegt (R7-E2,
  R7-E1).
- **Größtes Einsatzrisiko:** Ein Meldekopf mit Altbestand sieht eine leere
  Lage, legt eine neue Sammlung an, und die alte, nicht gezeigte Sammlung
  geht dabei verloren (R7-E2).
- **Top-Priorität für die nächste Iteration:** Nicht anzeigbare Einträge
  zählen, benennen und nie still überschreiben (R7-E2); die Hülle des
  beiseitegelegten Entwurfs beim Einlesen erkennen und die genaue Meldung
  zeigen (R7-E1).
