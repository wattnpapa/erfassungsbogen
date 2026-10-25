# Audit „Arbeitsablauf", Runde 3 (Einheit → Meldekopf → zweites Gerät → zurück → Exporte → nächster Einsatz)

Stand: 04.10.2026 · Prüfer: Rollenaudit `thw-workflow-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/gifted-cray-ngieaz`, Commit 33ed426.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-2-Befunde. Schwerpunkt dieser Runde: Arbeit mit derselben Lage auf
mehreren Geräten.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Locale de-DE. Jedes Gerät ist ein eigener Browser-Kontext mit eigenem
Speicher:

- **E1–E4**: Telefone der Einheiten, 360 × 640, `isMobile`/`hasTouch`.
  Bogen per Seed `eeb.entwurf.v1` aus `examples/thw/` (`001` Albstadt ZTr TZ,
  `002` Biberach/Riß FGr O (B), `013` Ulm B, `012` Sinsheim FGr W (B),
  `006` Karlsruhe ZTr TZ), `uebung: false`, Stand und Zeitraum auf den
  Prüftag gesetzt. Eine Folgemeldung Albstadt (+1 Helfer, Stärke 4 → 5) als
  zweiter Seed.
- **MK1**: Meldekopf-Tablet 820 × 1180, `isMobile`/`hasTouch`.
- **MK2**: zweites Gerät der Führungsstelle (Ablösung bzw. Laptop im Stab),
  1366 × 768 ohne Touch.
- **ZFü**: Telefon eines Zugführers, 360 × 640, der im Bereitstellungsraum
  eine eigene Sammlung führt.

Sammlungen und Vorlagen sind durch Bedienung entstanden, nicht per Seed. Den
QR-Weg habe ich durch den inhaltsgleichen Link ersetzt („Weitere Formate →
Link teilen", Inhalt aus der Zwischenablage), den Mail-Weg durch die
erzeugte PDF-Datei. Lageblatt, Sammel-PDF (16 Seiten), „Übersicht als CSV",
„Alle Daten als CSV" und die Excel-Liste „Oldenburg" habe ich
heruntergeladen und gegengelesen (`pdftotext`, XLSX als XML). Die
Screenshots habe ich angesehen. Ich habe zuerst ohne Blick in frühere
Berichte getestet. Den Runde-2-Bericht und die Tabelle „Stand der Behebung"
habe ich danach gelesen, die übrigen Runde-3-Berichte erst zum Schluss.

Hinweis zur Methode: Tipps innerhalb von 450 ms nach dem Öffnen eines
Dialogs verwirft die App absichtlich (Prellschutz, `src/app/dialoge.tsx`).
Einige frühe Skriptläufe scheiterten daran. Das ist ein Artefakt meiner
Skripte und kein Befund.

Erwartete Arbeitsfolge. Wo der reale THW-Ablauf nicht bekannt ist, steht
**Annahme**:

1. Die Einheit übergibt am Meldekopf ihren Bogen (QR, Link oder PDF).
2. Der Meldekopf sammelt, ordnet Züge zu, vergibt Aufträge, lässt abrücken.
3. Ein zweites Gerät übernimmt die Lage: Schichtwechsel, Laptop im Stab,
   Ersatzgerät bei leerem Akku.
4. **Annahme:** Beide Geräte arbeiten eine Zeit lang parallel, etwa
   Meldekopf am Eingang und Stab im Gebäude. Oder die Lage geht nach der
   Schicht zurück auf das erste Gerät. Danach müssen beide denselben Stand
   haben.
5. **Annahme:** Ein Zugführer sammelt im Bereitstellungsraum die Bögen
   seines Zuges und gibt sie gebündelt an den Meldekopf weiter.
6. Die Führungsstelle druckt das Lageblatt und gibt CSV oder Excel weiter.
7. Die Einheit meldet Änderungen neu und bereitet den nächsten Einsatz vor.

Durchgeführt:

- **Szenario 1 (E → MK1):** MK1 legt „Hochwasser Albstadt" an, öffnet den
  Link von E1 („In ‚Hochwasser Albstadt' aufnehmen") und liest drei PDFs auf
  einmal über „Bögen einlesen…" ein, darunter E1 noch einmal. Danach „Zug
  zuordnen" für Albstadt und Ulm, „Auftrag/Notiz" für Ulm, „Abrücken" für
  Biberach.
- **Szenario 2 (MK1 → MK2 → MK1):** MK1 „Einsatz weitergeben / sichern",
  MK2 „Einsatz importieren…". MK2 nimmt Sinsheim per Link auf und hängt die
  Folgemeldung Albstadt als neue Fassung an. MK1 vergibt in der Zwischenzeit
  eine Notiz an Albstadt. Danach gibt MK2 die Lage zurück und MK1 importiert.
- **Szenario 3 (Gegenrichtung, frische Geräte A und B):** A sammelt drei
  Einheiten und gibt weiter, B importiert. B lässt Ulm abrücken, ordnet
  Biberach „2. TZ" zu und vergibt eine Notiz. A lässt derweil Albstadt
  abrücken. B gibt zurück, A importiert. Zum Schluss importiert B noch einmal
  den Stand von A.
- **Szenario 4 (ZFü → MK):** ZFü sammelt Albstadt und Ulm in „1. TZ
  Albstadt" und erzeugt die Sammel-PDF. MK liest sie einmal über „Bögen
  einlesen…" in die eigene Sammlung und einmal über „Einsatz importieren…"
  ein. Danach öffne ich „Mehr… → Verschieben…".
- **Szenario 5 (Exporte):** Lageblatt, Sammel-PDF, beide CSV und Excel aus
  MK1 nach Szenario 2.
- **Szenario 6 (Einheit):** Übergabe per QR-Vollbild, danach eine Person
  ergänzt und die Übersicht geprüft. Doppelrolle: eigener Bogen Karlsruhe,
  dann zwei Schnellerfassungen, eine abgebrochen. „Als Vorlage speichern" →
  „Neuer Bogen" → „Einsatz vorbereiten".

**Nicht prüfbar:** Kamera-Scan und QR-Codes aus Fotos, Nahbereichs-
Weitergabe, Handscanner, echte Mail- und Messenger-Wege (nur Datei und
Link), zwei Geräte gleichzeitig am selben Netz (die App hat keinen
Server-Abgleich), echtes Drucken, Darstellung der Excel-Datei in Excel,
native Builds. „Namen einfügen…" (R2-N2) habe ich nicht erneut geprüft.

## Urteil

Der Weg einer Einheit bis in die Lage trägt. Ein Link landet mit einem Tipp
in der offenen Sammlung. Drei PDFs auf einmal quittiert die App mit „2 Bögen
aufgenommen, 1 bereits vorhanden". Die Folgemeldung fragt „Als neue Fassung
anhängen" und erbt den Zug. Danach zeigt die Karte „seit …: Stärke 4 → 5“.
Die Übergabe auf ein zweites Gerät bringt Zug, Auftrag, Abrückzeit und
Siegel vollständig mit. Lageblatt, Sammel-PDF, CSV und Excel nennen dieselben
Zahlen. Das Telefon der Einheit sagt jetzt „Seit der Übergabe … geändert
(Stärke … → …) — neu übergeben". Der eigene Bogen überlebt die
Schnellerfassung.

Der Ablauf bricht, sobald die Lage zurückläuft oder zwei Geräte
parallel arbeiten. Ein Import ergänzt nur Meldungen, die das Gerät noch nicht
kennt. Was das andere Gerät an bekannten Einheiten geändert hat (Abrücken,
Zug, Auftrag), fällt ohne Hinweis weg. Die Quittung lautet „0 neue
Meldung(en) ergänzt", und danach zeigen die beiden Geräte verschiedene
Stärken für dieselbe Lage. Beide sagen dabei „seitdem hier nichts Neues"
(R3-W1). Der Weitergabe-Vermerk zählt außerdem zurückimportierte Meldungen
als „hier neu" und fordert zum erneuten Weitergeben auf (R3-W2). Die
gebündelte Weitergabe vom Zugführer an den Meldekopf hat keinen sauberen
Weg: Entweder fehlen Siegel und Lageangaben, oder es entsteht eine zweite
Sammlung, die Einheit für Einheit umgebucht werden muss (R3-W3).

Die Einzelaufgaben schafft man ohne fremde Hilfe. Eine Lage, die zwischen
zwei Geräten hin- und hergeht, endet ohne Warnung mit zwei unterschiedlichen
Ständen.

## Befunde

### R3-W1 [P0] Rückimport übernimmt keine Änderungen an bekannten Meldungen: Abrücken, Zug und Auftrag des anderen Geräts gehen still verloren (neu)

**Priorität:** P0 · gemessen

**Fundstelle / Aufgabe:** Szenario 3 und 2. Einsatzansicht → „‹ Einsätze"
→ „Einsatz importieren…" mit der Sammel-PDF des anderen Geräts. Code:
`vendor/bos-meldekopf/src/einsaetze.ts`, `einsatzImportieren()`: Zusammengeführt
wird nur über die Eintrags-ID. Einträge, die schon vorhanden sind, werden
nicht angefasst.

**Beobachtung:**

| Schritt | Gerät A | Gerät B |
| --- | --- | --- |
| A gibt weiter, B importiert | 3 Einheiten, 1 / 5 / 17 / 23 | „importiert (3 Meldung(en))", 1 / 5 / 17 / 23 |
| B: Ulm abgerückt, Biberach „2. TZ", Notiz „Ortung Trümmerkegel B27" | – | 1 / 3 / 11 / 15 |
| A: Albstadt abgerückt | 0 / 4 / 15 / 19 | – |
| B gibt weiter, A importiert | „0 neue Meldung(en) ergänzt.", weiter 0 / 4 / 15 / 19, Ulm anwesend, Biberach ohne Zug und ohne Notiz | – |
| A gibt weiter, B importiert | – | „0 neue Meldung(en) ergänzt.", weiter 1 / 3 / 11 / 15, Albstadt anwesend |

Im Speicher von A stehen danach Ulm und Biberach mit `status 0`, ohne
`zugEtikett` und ohne `notiz`. Beide Geräte zeigen oben „Weitergegeben … —
seitdem hier nichts Neues."

Szenario 2 zeigt dieselbe Ursache aus der anderen Richtung. MK1 vergibt nach
der Weitergabe die Notiz „Lagekarte führen" an Albstadt. MK2 hängt
inzwischen die Folgemeldung Albstadt an. Nach dem Rückimport ist auf MK1
die Fassung von MK2 die aktuelle. Sie trägt den Zug, aber nicht die Notiz.
Die Karte zeigt „Auftrag/Notiz" ohne Text, Lageblatt und Sammel-PDF zeigen
„Auftrag / Notiz: –". Die Notiz hängt nur noch an der alten Fassung in der
Historie.

**Erwartung der Rolle:** Nach dem Import kenne ich den Stand beider Geräte.
Hat das andere Gerät eine Einheit abrücken lassen, ist sie bei mir auch
abgerückt. Widersprechen sich zwei Geräte, sagt mir die App, wo.

**Auswirkung im Einsatz:** Die Führungsstelle plant mit einer Einheit, die
den Einsatz schon verlassen hat, und vergibt ihr unter Umständen einen
Auftrag. Stärke, Verpflegung und Unterbringung sind auf dem zurückgekehrten
Gerät falsch (hier 19 statt 15 Personen). Ein Auftrag, den das andere Gerät
vergeben hat, ist verschwunden. Die Quittung „0 neue Meldung(en)" und der
Vermerk „nichts Neues" bestätigen den falschen Stand sogar. **Annahme:**
Lagen gehen tatsächlich zurück, etwa bei Schichtende, nach einem Ersatzgerät
oder zwischen Meldekopf und Stab. Die Anleitung im Bild beschreibt
„Einsatz importieren…" ausdrücklich als Weg zwischen Geräten.

**Empfehlung:** Beim Import vorhandene Meldungen abgleichen: Status mit
Abrückzeit, Zug, Auftrag/Notiz und Vermerke jeweils nach dem jüngeren
Zeitstempel übernehmen. Beim Anhängen einer neuen Fassung Auftrag/Notiz
genauso vererben wie den Zug. Unterscheiden sich beide Stände, das vor dem
Übernehmen zeigen („Ulm: hier anwesend, in der Datei abgerückt 20:47 —
übernehmen?"). Die Quittung muss geänderte Meldungen mitzählen und darf nie
„0" melden, wenn sich die Lage unterscheidet.

**Verifikation:** Szenario 3 nachstellen. Nach dem Import auf A muss Ulm
abgerückt sein und Biberach „2. TZ" mit der Notiz tragen. Albstadt muss
abgerückt bleiben, weil es auf A jünger ist. Beide Geräte müssen danach
dieselben Kopfzahlen zeigen. Die Quittung muss die übernommenen Änderungen
nennen.

### R3-W2 [P2] Der Weitergabe-Vermerk zählt importierte Meldungen als „hier neu" und schickt zum erneuten Weitergeben (neu; Rest von R2-W5)

**Priorität:** P2 · gemessen

**Fundstelle / Aufgabe:** Szenario 2, MK1 nach dem Rückimport von MK2.
Gelber Vermerk oben in der Einsatzansicht. Code: `src/app/einsaetze-ui.tsx`
(Text „seitdem hier …", um Zeile 916), Stand in `eeb.weitergabe-stand.v1`.

**Beobachtung:** MK1 hatte um 20:46 weitergegeben. Danach kamen Sinsheim und
die Folgemeldung Albstadt ausschließlich über den Import *von* MK2. MK1
zeigt: „Weitergegeben 04.10.2026, 20:46 — seitdem hier 2 neue Meldungen.
Führt inzwischen ein anderes Gerät die Lage, fehlt das dort: erneut
weitergeben." MK2 hat beide Meldungen aber schon, sie stammen von dort. In
Szenario 3 gilt umgekehrt „seitdem hier nichts Neues", obwohl beide Geräte
verschiedene Stände führen (R3-W1). Ein Abschluss der Sammlung („nur noch
lesen") fehlt weiterhin; „Einsatz verwalten" bietet nur „Einsatz löschen…".

**Erwartung der Rolle:** Der Vermerk sagt mir, ob das andere Gerät etwas
nicht hat. Was ich gerade von dort bekommen habe, gehört nicht dazu.

**Auswirkung im Einsatz:** Die Führungsstelle schickt unnötig PDFs hin und
her oder lernt, den gelben Kasten zu übergehen. Dann übersieht sie ihn auch,
wenn wirklich ein Nachzügler fehlt, also genau in dem Fall, für den R2-W5 ihn
gefordert hat.

**Empfehlung:** Meldungen aus einem Import nicht als „hier neu" zählen,
sondern nur, was auf diesem Gerät aufgenommen oder geändert wurde. Den Text
auf Änderungen ausweiten (Abrücken, Zug, Auftrag), sobald R3-W1 sie
überträgt. Optional nach dem Import „Stand von Gerät X übernommen um …"
vermerken.

**Verifikation:** Szenario 2 nachstellen. Nach dem Rückimport darf MK1
nicht zum erneuten Weitergeben auffordern. Nimmt MK1 danach eine Einheit
selbst auf, muss der Vermerk „1 neue Meldung" zeigen.

### R3-W3 [P2] Sammlung des Zugführers an den Meldekopf: entweder ohne Siegel, oder als zweite Sammlung mit Umbuchen Einheit für Einheit (neu)

**Priorität:** P2 · beobachtet

**Fundstelle / Aufgabe:** Szenario 4. MK-Tablet mit eigener Sammlung
„Hochwasser Albstadt" (Biberach per Link), Sammel-PDF des ZFü-Telefons
(„1. TZ Albstadt": Albstadt, Ulm, beide per Link mit Siegel aufgenommen).
Code: Hinweistext in `src/app/qr-stapel.ts` (um Zeile 360), „Verschieben…" in
`src/app/einsaetze-ui.tsx`.

**Beobachtung:**

- **Über „Bögen einlesen…" in die eigene Sammlung:** „2 Bögen aufgenommen".
  Albstadt und Ulm stehen mit „Stärke 1 / 1 / 2 / 4" bzw. „0 / 2 / 6 / 8"
  und „Aus Datei" da, aber ohne „✓ signiert". Einzel-PDFs derselben Einheiten
  behalten das Siegel auf demselben Weg („✓ signiert 4402 c713 …"). Die App
  sagt dazu: „Die PDF enthält die vollständige Einsatz-Sammlung mit Zeiten,
  Abrückvermerken und Zügen — für die ganze Lage ‚Einsatz importieren…'
  verwenden."
- **Über „Einsatz importieren…":** Es entsteht eine zweite Sammlung „1. TZ
  Albstadt" neben „Hochwasser Albstadt" (Speicher: `Hochwasser Albstadt:1`,
  `1. TZ Albstadt:2`). Die Siegel bleiben erhalten. In die Lage kommen die
  Einheiten nur einzeln: „Mehr…" → „Verschieben…" → Zielsammlung wählen, drei
  Tipps je Einheit.

**Erwartung der Rolle:** Der Zugführer übergibt seinen Zug als ein Paket.
Der Meldekopf nimmt es mit einem Schritt in die laufende Lage auf, mit
Siegel, Eintreffzeiten und Zug.

**Auswirkung im Einsatz:** **Annahme:** Ein Zug mit fünf bis acht
Teileinheiten trifft gesammelt ein. Der Meldekopf wählt dann zwischen einer
Lage ohne Herkunftsnachweis und ohne die Lageangaben des Zugführers und 15
bis 24 Tipps zum Umbuchen. Wer umbucht, kann eine Einheit vergessen. Sie
steht dann in einer Nebensammlung, die in keiner Summe der Lage auftaucht.

**Empfehlung:** Beim Einlesen einer Sammel-PDF in eine *andere* Sammlung
fragen: „Sammlung ‚1. TZ Albstadt' mit 2 Einheiten — in ‚Hochwasser
Albstadt' übernehmen (mit Zeiten, Zug, Siegel)?" Den Zugnamen dabei als
Vorschlag für das Zug-Etikett anbieten. Siegel aus der eingebetteten
Sammlung auch beim Einzeleinlesen übernehmen.

**Verifikation:** Szenario 4 nachstellen. Nach einem Schritt müssen beide
Einheiten in „Hochwasser Albstadt" stehen, mit Siegel, Eintreffzeit vom ZFü
und Zug „1. TZ Albstadt". Eine zweite Sammlung darf nicht entstehen.

## Verweise auf andere Runde-3-Berichte

Diese Stellen habe ich ebenfalls beobachtet. Sie stehen schon in anderen
Berichten und werden hier nicht als eigene Befunde gezählt:

- **R3-H3** ([feldtauglichkeit.md](feldtauglichkeit.md)) und **R3-A7**
  ([analog-first.md](analog-first.md)): Nach einem Blick auf das QR-Vollbild
  zeigt die Übersicht „Übergeben 20:49 Uhr — seitdem unverändert", ohne dass
  ein Scan bestätigt ist. Nach dem Erzeugen der PDF steht „Übergeben 20:38
  Uhr", obwohl die Datei nur im Download-Ordner liegt.
- **R3-A7**: Die Übersichts-CSV führt „Stand" als `042039okt26`,
  „Eingetroffen" als `04.10.2026, 20:46` und „Empfangen" als `04.10.26,
  20:46`, drei Zeitformen in einer Zeile.
- **R3-D2** ([zerstoerende-handlungen.md](zerstoerende-handlungen.md)) und
  **R3-S1** ([stress-und-unterbrechung.md](stress-und-unterbrechung.md)):
  Wird ein Bogen-Link am Meldekopf per Kaltstart geöffnet, steht der fremde
  Bogen hinter der Frage „Einheit ist bereits gemeldet" schon als eigener
  Bogen im Assistenten („Empfangen als …", „automatisch gespeichert"). Nach
  dem Aufnehmen verschwindet er wieder. Den Verlust eines belegten
  Rückholplatzes beschreiben die beiden Berichte.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Empfang:** Link bei vorhandener Sammlung → „Meldung von ‚THW Albstadt
  Zugtrupp Technischer Zug' empfangen · Stärke 1 / 1 / 2 / 4. Wohin damit?"
  mit „In ‚Hochwasser Albstadt' aufnehmen" zuerst. Gilt für Kaltstart und
  laufende App.
- **Stapel und Dubletten:** Drei PDFs auf einmal, eine davon schon per Link
  da: „2 Bögen aufgenommen, 1 bereits vorhanden." und „Zuletzt aufgenommen
  (2): …".
- **Folgemeldung:** „Als neue Fassung anhängen — die bisherige Meldung
  wandert in die Historie". Die neue Fassung erbt Zug und Ersteintreffzeit
  und zeigt „seit 04.10.2026, 20:39: Stärke 4 → 5", „Historie (2)". Im
  Sammel-PDF steht die Änderung ausgeschrieben („Personal neu: Becker, Jonas
  …").
- **Übergabe in eine Richtung:** „Einsatz importieren…" auf einem frischen
  Gerät bringt Zug „1. TZ Albstadt", „Auftrag/Notiz: Sandsackverbau Deich
  Nord ab 20:00", „abgerückt 20:46" und Siegel mit. Die Quittung lautet
  „Einsatz ‚Hochwasser Albstadt' als PDF weitergegeben/gesichert — mit allen
  Meldungen, Zeiten und Historie".
- **Exporte stimmen überein:** Lageblatt, Übergabe-Übersicht, Übersichts-CSV
  und Excel zeigen dieselben 1 / 6 / 17 / 24 bei 3 zählenden und 1
  abgerückten Einheit. Abgerückte stehen im eigenen Block, „Summe (3 zählend
  · 1 abgerückt)". Excel trennt „Nicht in der Lage gezählt (abgerückt,
  aufgegangen oder Übung) — 1 Einheit(en)" und trägt Zug, Auftrag,
  Fahrzeuge und die Eintrags-ID. Die Detail-CSV hat in allen 50 Zeilen 57
  Spalten.
- **Rückkanal auf dem Einheitstelefon:** „Übergeben 20:49 Uhr — seitdem
  unverändert" und nach einer ergänzten Person „⚠ Seit der Übergabe 20:49 Uhr
  geändert (Stärke 0 / 2 / 6 / 8 → 0 / 2 / 7 / 9) — neu übergeben, damit der
  Meldekopf den Stand hat."
- **Doppelrolle:** Die Schnellerfassung fragt zuerst nach der Zielsammlung.
  Der eigene Bogen „THW Karlsruhe Zugtrupp Technischer Zug" bleibt nach zwei
  Schnellerfassungen (eine davon abgebrochen und verworfen) auf dem
  Rückholplatz. Die Rückfrage sagt genau, was verworfen wird.
- **Wiedereinstieg:** Nach dem Neuladen öffnet die App die zuletzt offene
  Sammlung und bietet „Angefangene Erfassung für diesen Einsatz: ‚THW Ulm
  Bergungsgruppe'. Weiter erfassen" an.
- **Folgeeinsatz:** „Einsatz vorbereiten" zeigt „Sofortbedarf aus der
  Vorlage" durchgestrichen, das Kästchen ist nicht angehakt: „Stammt aus
  einem früheren Einsatz — nur anhaken, wenn er auch jetzt gilt."

## Abschluss

- **Aufgabe geschafft:** mit Umwegen. Einheit melden, neu melden, sammeln,
  abrücken, an ein zweites Gerät übergeben und exportieren: ja. Lage
  zwischen zwei Geräten zurückgeben oder parallel führen: nein, Änderungen
  gehen still verloren (R3-W1). Zug-Sammlung an den Meldekopf: nur mit
  Umbuchen Einheit für Einheit (R3-W3).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Einsatz importieren…" klingt nach
  Zusammenführen. Es ergänzt aber nur unbekannte Meldungen und lässt alles
  andere auf dem alten Stand (R3-W1).
- **Größtes Einsatzrisiko:** Nach einem Rückimport führt die Führungsstelle
  eine abgerückte Einheit als anwesend, mit falscher Stärke und ohne den
  Auftrag, den das andere Gerät vergeben hat. Die App bestätigt das mit „0
  neue Meldung(en)" und „nichts Neues" (R3-W1).
- **Top-Priorität für die nächste Iteration:** Beim Import Status, Zug und
  Auftrag vorhandener Meldungen nach Zeitstempel abgleichen und Widersprüche
  anzeigen (R3-W1).

## Abgleich mit Runde 2

Grundlage: [../runde-2/arbeitsablauf.md](../runde-2/arbeitsablauf.md) und
[../runde-2/README.md → Stand der Behebung](../runde-2/README.md#stand-der-behebung).

| Runde-2-Befund | Stand laut Behebungstabelle | Bewertung Runde 3 | Beobachtung |
| --- | --- | --- | --- |
| R2-W1 Sofortbedarf aus Vorlage (P1) | behoben | hält | Musterung: „Sofortbedarf aus der Vorlage — Ruhezeit · Diesel 60 l · Gemisch 10 l" durchgestrichen, Kästchen leer, Erklärtext. „Einsatz starten · 8 Pers · 2 Fz". |
| R2-W2 Übergabestand (P2) | behoben | hält, mit Rest | „seitdem unverändert" bzw. „Seit der Übergabe … geändert (Stärke … → …) — neu übergeben". Rest: Der Vermerk entsteht schon beim Zeigen des QR-Codes bzw. beim Erzeugen der PDF (R3-H3, R3-A7). |
| R2-W3 Soll-Fahrzeuge in der Schnellerfassung (P2) | behoben | nicht erneut geprüft | Die Schnellerfassung habe ich nur bis zur Stärke bedient, die Fahrzeugsumme danach nicht ausgewertet. |
| R2-W4 Einsatzzeiten (P3) | behoben | hält | Übersicht: „Beginn / Ende — / — — für eigene Nachweise in Schritt 2 eintragen; die Zeiten des Meldekopfs kommen nicht hierher zurück." |
| R2-W5 Zwei Geräte, eine Sammlung (P3) | teilweise | teilweise, Grundlage trägt nicht | Der Übergabevermerk ist da („Weitergegeben 20:46 — seitdem hier …"). Er zählt aber Importiertes als neu (R3-W2). Einen Abschluss gibt es nicht. Die Aussage aus Runde 2 („Das Zusammenführen funktioniert") gilt nur für neue Meldungen. Änderungen an bekannten Meldungen kommen nicht an (R3-W1). Runde 2 hatte nur diese Richtung geprüft. |
| R2-W6 Kleinere Brüche (P3) | behoben | hält, mit Rest | QR-Vollbild mit „THW · Bergungsgruppe · Ulm · Stärke 0 / 2 / 6 / 8 · Stand 20:49 Uhr". Einzel-PDF über „Bögen einlesen…" mit Siegel („✓ signiert 4402 c713 …"). Rest: Aus einer Sammel-PDF eingelesene Bögen kommen ohne Siegel an (R3-W3). |
| R2-N1 Schnellerfassung verdrängt eigenen Bogen (P0, bestätigt aus anderem Bericht) | behoben | hält | Zwei Schnellerfassungen, eine verworfen: „THW Karlsruhe Zugtrupp Technischer Zug" bleibt unter „Zuletzt verdrängten Bogen zurückholen". Die zweite Rückfrage sagt: „Sie ist noch in keiner Sammlung und wird verworfen. Dein eigener Bogen … bleibt auf der Startseite zurückholbar." |
| R2-N2 „Namen einfügen…" (P1) | behoben | nicht erneut geprüft | – |
| R2-N4 „alt" an jeder Karte (P2) | behoben | hält | Keine Karte trägt „alt". Frische Meldungen tragen „kürzlich eingetroffen" und „Stand 04.10.2026, 20:39". |
| R2-N5 Verpflegung in der Bedarfssumme (P2) | behoben | hält | „Verpflegung 24 (5 vegetarisch / 1 vegan)" bei Gesamt 24. Abweichende Einzelangabe als Marke „Verpflegung 4 (Stärke 5)" auf Karte und Lageblatt. |
| R2-N6 Schnellerfassung wie eigener Bogen (P2) | behoben | hält | „Einheit schnell erfassen — für welche Sammlung?" zuerst, „Für ‚BR Süd' erfassen", danach „In Einsatz übernehmen". |
| R2-N7 Rückwege (P2) | behoben | hält | „‹ Einsätze" führt zur Startseite. Nach dem Neuladen öffnet die App die zuletzt offene Sammlung. |

Bilanz: Von den sechs eigenen Runde-2-Befunden halten vier, R2-W1 und R2-W4
vollständig, R2-W2 und R2-W6 mit Rest. R2-W3 habe ich nicht erneut geprüft. R2-W5
bleibt teilweise. Unter dem Vermerk liegt ein Abgleich, der Änderungen nicht
überträgt (R3-W1, R3-W2). Die aus anderen Berichten bestätigten Befunde
halten, soweit geprüft (R2-N1, R2-N4 bis R2-N7). Die Risiken liegen nicht
mehr beim Weg der einzelnen Einheit. Sie liegen dort, wo dieselbe Lage auf
mehr als einem Gerät geführt wird.

## Stand der Behebung

Stand 05.10.2026, Paket „Einsatz-Import, Abgleich zwischen Geräten,
Papier-Rückweg". Geprüft mit Typprüfung, Unit- und Oberflächentests
(2 310 grün) und Nachmessung im Dev-Server (360 × 640, `isMobile`/`hasTouch`,
de-DE, je Gerät ein eigener Browser-Kontext), Prüfdateien dieses Audits.
Aufgeführt sind nur die Befunde dieses Pakets. Der Kern-Import im Submodul
ist unverändert; der Abgleich liegt in `src/app/einsatz-abgleich.ts`.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R3-W1 Rückimport übernimmt keine Änderungen | behoben | Der Import gleicht bekannte Einheiten ab: Status samt Abrückzeit, Zug, Auftrag/Notiz, Eintreffzeit. Es gilt die Seite, die das Feld seit dem gemeinsamen Stand geändert hat (Verlauf mit Uhrzeit). Haben beide geändert, gilt der jüngere Vermerk; der Widerspruch steht in der Quittung und im Verlauf der Einheit. Ohne Verlauf wird nur ein leerer Wert gefüllt. Die Werte landen auch auf einer Folgemeldung vom anderen Gerät (Szenario 2). Quittung: „0 neue Meldung(en) ergänzt. 2 Meldungen aktualisiert: Biberach/Riß Zug „2. TZ“, Auftrag „Ortung Trümmerkegel B27“; Ulm abgerückt 06:07." Nachlauf Szenario 3 (r2.cjs): A und B danach beide 0 / 2 / 9 / 11, Albstadt bleibt auf A abgerückt und kommt auf B an. Szenario 2: „Lagekarte führen" bleibt an Albstadt. |
| R3-W2 Weitergabe-Vermerk zählt Importiertes | behoben | Was ein Import brachte, gilt als beim anderen Gerät bekannt (Kennungen und Prüfsummen der Vermerke im Weitergabe-Stand). Der Vermerk zählt auch Änderungen: „seitdem hier 1 neue Meldung und 1 Änderung (Auftrag)", dazu „Stand des anderen Geräts übernommen …". Nachlauf Szenario 2: Nach dem Rückimport nur „1 Änderung (Auftrag)" (die eigene Notiz), nach eigener Aufnahme „1 neue Meldung und 1 Änderung". Offen: Abschluss der Sammlung („nur noch lesen"). |
| R3-W3 Sammlung des Zugführers an den Meldekopf | behoben | „Bögen einlesen…" mit einer Sammel-PDF einer anderen Sammlung fragt: „… ‚1. TZ Albstadt' mit 2 Einheiten. In ‚Hochwasser Albstadt' übernehmen — mit Eintreffzeiten, Abrückvermerken, Auftrag und Siegel?" mit „Übernehmen, Zug ‚1. TZ Albstadt'", „ohne Zug-Zuordnung" oder „Nur die Bögen". Bekannte Einheiten behalten ihren Zug. Nachlauf Szenario 4 (zfue-buendel.pdf): eine Sammlung mit 3 Einträgen, Albstadt und Ulm mit Zug und Siegel. |
