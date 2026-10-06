# Audit „Mobile UI", Runde 5 (Darstellung und Bedienung auf dem Telefon)

Stand: 06.10.2026 · Prüfer: Rollenaudit `mobile-ui-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `c0cbae0` (Code entspricht `4fcdbaf`).

Reiner Prüfbericht, keine Codeänderung. Er prüft die in Runde 4 umgebauten
Stellen nach: Fußleisten-Raster, Erfassungsleiste, Tastatur-Wächter,
Daumen-Quittung, QR-Vollbild bei 200 %, Zwei-Spalten-Ansicht ab 72 rem,
Kurz-Liste und die Startseite mit „Leeren Vordruck drucken". Der Abgleich
bezieht sich auf [Runde 4](../runde-4/mobile-ui.md) samt „Stand der
Behebung".

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch`, Locale de-DE, Zeitzone Europe/Berlin,
`deviceScaleFactor` 1. Jeder Lauf hatte einen eigenen Browser-Kontext, weil
elf weitere Prüfer denselben Server nutzten. Viewports: 360 × 640,
320 × 568, 390 × 844, 640 × 360 (Telefon quer), dazu Tablet 820 × 1180 und
1180 × 820 (quer, über 72 rem) und zwei Zoom-Nachbildungen (180 × 320 und
160 × 284 Layout-Pixel, entspricht rund 400 % und 450 % Browser-Zoom). Jeweils
mit normaler Schrift und mit 200 % Schrift. Die 200 % habe ich wie in
Runde 4 als `html { font-size: 200% !important }` eingespielt.

Ich habe zuerst getestet und erst danach den Runde-4-Bericht samt „Stand der
Behebung" und die anderen Runde-5-Berichte gelesen. Eine Ausnahme: Für Aufbau
und Seeds habe ich vorab die Abschnitte „Prüfaufbau" und „Stand der Behebung"
des Runde-4-README und den Aufbau des Runde-4-Berichts angesehen. Die
Seeds und Skripte der Runde 4 habe ich wiederverwendet. Die Befunde selbst
stammen aus eigenen Messungen.

Zustände kamen aus `localStorage`-Seeds aus `examples/thw/`, alle mit
`uebung: false`:
- `eeb.entwurf.v1`: THW Mühldorf Bergungsgruppe (9 Personen, 2 Fahrzeuge),
  Schritt 6; für mehrteilige QR-Codes der Großbogen „Verstärkter
  Bergungszug" (7 Teile).
- `eeb.einsaetze.v1`: „Hochwasser Kocher" mit 14 Meldungen in drei Zügen, zwei
  abgerückt, eine Übung, dazu eine Übungssammlung.
- `eeb.vorlagen.v1`: Vorlage „B Regen (Stamm)".

Durchlaufen habe ich: Startseite (leer und mit Seed), Assistent Schritt 1–6,
Kurz-Liste in Schritt 3, Übergabe-Dialog und QR-Vollbild (7 Teile, Blättern,
Geräte-Zurück per `history.back()`), Einsatzansicht als Karten und Tabelle,
„Abrücken" mit Daumen-Quittung, „Einheit manuell erfassen…" mit der Leiste
„In Einsatz übernehmen" (Schritt 1–5), die Rückfrage vor dem Ersetzen des
Entwurfs, den Namens-Hinweis beim Übernehmen.

Gemessen habe ich:
- `innerWidth`/`scrollWidth` und das Element, das die Seite verbreitert;
- Lage, Höhe und Flächenanteil von Fußleiste, Quittung, Kopf und
  Dialogknöpfen (`getBoundingClientRect`), dazu Raster der Leistenknöpfe;
- den Tastatur-Wächter: Fokus in ein Textfeld, danach Fenster verkleinert
  (Höhe minus 300 px, quer minus 160 px) als Ersatz für die Tastatur; geprüft
  wurden Klasse `tastatur-offen`, Fußleiste, schwebendes „◐" und Lage des
  Feldes;
- einen Tab-Durchlauf (60–100 Ziele) in Einsatzansicht und Schritt 3 bei 100 %
  und 200 %: ob ein Ziel verdeckt ist (`elementFromPoint`), außerhalb des
  Bilds liegt oder keinen Fokusrahmen hat;
- die Lage der ersten Einheitenkarte, des ersten Primärknopfs der Startseite
  und der Knöpfe im Übergabe-Dialog.

Jede Aussage zu Lage und Größe habe ich am Screenshot gegengeprüft.
Skripte und Screenshots liegen außerhalb des Repositorys im Scratchpad.

**Prioritäten:** Der Skill verwendet Critical / High / Medium / Low. Ich habe
das auf P0 / P1 / P2 / P3 abgebildet.

**Kennzeichnung der Nachweise:**
- *gemessen* heißt im Testbrowser mit Zahlen reproduziert;
- *beobachtet* heißt im Testbrowser gesehen, aber ohne eigene Messreihe;
- *Risiko* heißt aus Code oder CSS abgeleitet, im Testbrowser nicht
  nachgestellt.

**Nicht prüfbar:**
- echte Geräte mit Systemschrift unter Android und iOS. Die 200 % sind eine
  Nachbildung über die Wurzelschrift. Sie unterscheidet sich von echter
  Schrift-Skalierung in einem Punkt: Media-Queries in `rem` rechnen im Browser
  mit der Browser-Grundschrift, in der Nachbildung aber mit 16 px (siehe
  R5-M6);
- die echte Bildschirmtastatur (nachgestellt durch ein kleineres Fenster), also
  auch ob sie Fußleiste oder Dialogknöpfe in Android-App, iOS-Safari oder
  Chrome-Android mit „resizes-visual" verdeckt;
- Safe-Area-Einsätze (Notch, Home-Indikator), weil `env()` im Testbrowser 0
  ist. Gelesen habe ich nur das CSS (`viewport-fit=cover`, 23 Stellen mit
  `env(safe-area-inset-*)`);
- ein- und ausgeblendete Browserleiste (`vh` gegen `dvh`);
- Vorleseprogramme (TalkBack, VoiceOver), Kamera und Handscanner, echte
  Handschuhe und echtes Licht;
- echtes Wischen vom Bildschirmrand für die Zurück-Geste (nachgestellt mit
  `history.back()`);
- WebKit/Safari und die nativen Builds.

## Urteil

Die Umbauten aus Runde 4 halten. Auf allen vier Telefon-Viewports läuft
keine Ansicht seitlich über, auch nicht bei 200 % Schrift und auch nicht bei
Zoom-Nachbildungen bis 180 × 320. Die Fußleiste des Assistenten ist ein
festes Raster: „←", „◐" und der Primärknopf stehen in allen Schritten bei
100 % und 200 % an derselben Stelle, die Leiste belegt 11–14 % der Höhe (quer
15–19 %). Die Erfassungsleiste bleibt in Schritt 1–5 gleich (19–23 %), „Weiter →"
und „Zur Übersicht →" enden am selben rechten Rand. Die Daumen-Quittung steht
bei 200 % vollständig im Bild, das QR-Vollbild zeigt bei 200 % auf jeder
Größe Code, „Teil 1 von 7" und alle Knöpfe ohne Rollen. Der Tastatur-Wächter
blendet die Leiste aus und rückt das Feld nach oben. Beim Tab-Durchlauf
verdeckt nichts ein Fokusziel, und jedes hat einen Fokusrahmen.

Was bleibt, sind keine Blocker, sondern Reste an den Rändern, vor allem bei
200 % Schrift: Der Übergabe-Dialog ist als einziges großes Overlay nicht
gedeckelt, sodass der Weg zum QR-Code dort zwei Bildschirme tief liegt. Die
Startseite zeigt beim Erstbesuch keinen Primärknopf im ersten Bild und
schiebt ihn bei 200 % auf den dritten Bildschirm. In der Erfassung bleibt
bei 200 % auf kleinen Fenstern kaum Platz für das Formular. Dazu kommen drei
kleine Stellen an Tabelle, Kurz-Liste und Tablet.

Die Hauptaufgabe, einen Bogen erfassen und übergeben, gelingt bei normaler
und bei 200 % Schrift auf allen vier Telefon-Viewports. Die Befunde sind 0 × P0,
0 × P1, 3 × P2, 4 × P3.

## Befunde

### R5-M1 [P2] Übergabe-Dialog bei 200 % Schrift: Der Weg zum QR-Code liegt bis zu zwei Bildschirme tief (Rest von R4-M4, der das Vollbild, nicht den Dialog betraf)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle:** Dialog `dialog.teilen-dialog` („Bogen übergeben"),
`src/app/schritte/uebersicht.tsx`. CSS in `index.html`. Die Deckel-Regel
(Schrift, Zielhöhe und Polster in px gedeckelt, DESIGN.md) wurde für Leisten,
Quittung und `dialog.qr-vollbild` angewendet, nicht für diesen Dialog.

**Beobachtung:** Lage des Knopfs „QR-Code im Vollbild zeigen" im Dialog
(gemessen als Abstand vom oberen Fensterrand, Dialog ungerollt), Seed
Großbogen:

| Viewport | 100 % Schrift | 200 % Schrift |
| --- | --- | --- |
| 360 × 640 | 357 px | 1 170 px (1,8 Bildschirme) |
| 320 × 568 | 376 px | 1 212 px (2,1) |
| 390 × 844 | 432 px | 1 044 px (1,2) |
| 640 × 360 | 263 px (unteres Drittel) | 677 px (1,9) |

Der Dialog ist bei 200 % und 360 × 640 1 901 px hoch (Fenster 606 px). Im
ersten Bild steht „Bogen übergeben", „Schließen", die Zeile „Dieser Bogen
gehört zum Einsatz …" und der Anfang von „Für neuen Einsatz vorbereiten".
Der Schließen-Knopf steht schmal rechts unter der Überschrift
(130–319 px), der Überschrift selbst läuft über zwei Zeilen. Bei 100 % steht der
Primärknopf im ersten Bild (Screenshot `t11-dialog-a`), bei 200 % nicht
(`t11-dialog-a-f`).

**Folge:** Die Übergabe per Code ist der Kernweg der App. Wer mit großer
Schrift am Gerät arbeitet, öffnet „Bogen übergeben…" und sieht eine Textwand
und als einzigen Knopf „Für neuen Einsatz vorbereiten", der Personal und
Fahrzeuge stehen lässt, aber Zeitraum, Ort und Sofortbedarf leert. Den
Primärknopf muss er erst finden. Ein Hinweis, dass darunter mehr steht, fehlt.
Die Reihenfolge begünstigt außerdem den falschen Tipp.

**Empfehlung:** Den Dialog wie das Vollbild deckeln (Schrift, Knopfmaß und
Polster in px) und den Primärknopf „QR-Code im Vollbild zeigen" vor „Für
neuen Einsatz vorbereiten" stellen oder bei großer Schrift im Dialog
festhalten. Die Meldung „Dieser Bogen gehört zum Einsatz …" wäre eine Zeile
über dem Knopf.

**Nachprüfung:** 360 × 640, 320 × 568 und 640 × 360 bei 200 %: „QR-Code im
Vollbild zeigen" steht im ersten Bild des Dialogs ohne Rollen
(`getBoundingClientRect().bottom` kleiner als `innerHeight`).

### R5-M2 [P2] Startseite: Beim Erstbesuch steht im ersten Bild keine Aktion, bei 200 % Schrift erst auf dem dritten Bildschirm (neu)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle:** Startseite ohne Entwurf. Reihenfolge `P` (Einleitung),
`P.offline-badge`, `DIV.weiche` („Meinen Bogen ausfüllen"). CSS in `index.html`.
`P.offline-badge`-Text aus der Offline-Prüfung des Service Workers.

**Beobachtung:** Lage des ersten Primärknopfs („Neuen Bogen erstellen") im
leeren Zustand, nachdem der Offline-Hinweis „✓ Jetzt offline bereit …"
steht (nach rund 5 s):

| Viewport | Knopf oben | Fensterhöhe | Hinweis-Höhe |
| --- | --- | --- | --- |
| 360 × 640, 100 % | 655 px | 640 | 117 px |
| 320 × 568, 100 % | 692 px | 568 | 117 px |
| 390 × 844, 100 % | 634 px | 844 | 96 px |
| 360 × 640, 200 % | 2 136 px | 640 | 483 px |

Im ersten Bild stehen bei 360 × 640 Kopf, ein vierzeiliger Einleitungsabsatz,
der Offline-Hinweis und die Überschrift „Meinen Bogen ausfüllen" samt einem
Satz (Screenshot `t15-a-leer`). In den ersten Sekunden ist der Hinweis
länger: „⏳ Wird für den Offline-Betrieb geladen: 0,0 von 6,8 MB — bitte mit
Netz geöffnet lassen. …" (nach rund 5 s auf „✓ Jetzt offline bereit …"
gewechselt, gemessen). Bei 200 % füllt der Hinweis allein 75 % der
Fensterhöhe, der Knopf liegt bei 3,3 Bildschirmen.

Mit gespeichertem Entwurf steht „Fortsetzen" im ersten Bild (Screenshot
`t1-start-a`), das ist gut gelöst.

**Folge:** Wer das erste Mal kommt, sieht eine Seite, auf der nichts zu tippen
ist, und muss rollen. Am Telefon im Feld ist die Startseite der Einstieg in
jeden Einsatz. Ein Erstnutzer, der bei großer Schrift ein Viertel der Seite
liest, bevor die erste Aktion kommt, rollt erst einmal und sucht.

**Empfehlung:** Den Offline-Hinweis nach dem ersten Bereitmelden auf eine
Zeile kürzen oder unter die Aktionen setzen. Die Einleitung am Telefon
kürzen. Ziel: der erste Primärknopf („Neuen Bogen erstellen" bzw.
„Fortsetzen") liegt bei 360 × 640 und 320 × 568 im ersten Bild.

**Nachprüfung:** Leerer Zustand, 360 × 640 und 320 × 568, 100 % und 200 %:
`Neuen Bogen erstellen` mit `getBoundingClientRect().top` kleiner als
`innerHeight` (200 % kann abweichen, dort höchstens ein Bildschirm).

### R5-M3 [P2] Erfassung bei 200 % Schrift auf kleinen Fenstern: Kopf und Leiste lassen kaum Formular, quer nur den Kopf (Rest von R4-M2 und R4-M7)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle:** Meldekopf-Erfassung („Einheit manuell erfassen…", „Einheit
schnell erfassen"), Kopf `header.seiten-kopf` und `footer.nav.mit-uebernehmen`
(`index.html`). Der Kopf scrollt mit, nur die Leiste klebt.

**Beobachtung:**

| Lage | Kopf unten bei | Leiste | erstes Feld | Bild für Formular |
| --- | --- | --- | --- | --- |
| 360 × 640, 100 % | 167 px | 122 px (19 %) | 232–276 px | 351 px |
| 360 × 640, 200 % | 260 px | 130 px (20 %) | 427–515 px | 250 px, Feld 427–510 |
| 320 × 568, 100 % | 167 px | 122 px (21 %) | 232–276 px | 279 px |
| 320 × 568, 200 % | 260 px | 130 px (23 %) | 427–515 px | 178 px, **Feld ab 438 verdeckt** |
| 640 × 360, 100 % | 128 px | 56 px (15 %) | 193–237 px | 176 px |
| 640 × 360, 200 % | **384 px** | 69 px (19 %) | — | **0 px** |

Bei 640 × 360 und 200 % ist der Kopf höher als das Fenster (384 gegen 360 px).
Im ersten Bild stehen nur Kopf und Leiste, kein Formularfeld (Screenshot
`t9-erf1-q-f`). Bei 320 × 568 und 200 % schneidet die Leiste das erste Feld
ab 438 px ab: Zu sehen sind die Beschriftung „Eingetroffen um (vom
Meldeblock)" und die oberen 11 px des Feldes. Das entspricht der in Runde 4
benannten Grenze.

Bei 100 % und 360 × 640 ist es gut: Kopf, Zeitfeld, Hinweistext und die
zweizeilige Leiste stehen zusammen im Bild (Screenshot `t9-erf1-a`).

**Folge:** Die Erfassung am Meldekopf ist der Einsatz-Alltag der Führungsstelle,
oft quer am Tablet oder Telefon. Mit großer Schrift im Querformat muss man
zuerst über den Kopf rollen, bevor das erste Feld erscheint. Der Kopf mit
Schritten und Marke „Aufnahme für: …" ist in der Erfassung wichtiger als im
Assistenten, aber er bleibt nicht stehen, man rollt ihn weg und hat dann die
Schrittleiste nicht mehr.

**Empfehlung:** Bei großer Schrift und niedrigem Fenster (Höhe unter etwa
420 px oder Kopf über 40 % der Höhe) den Kopf auf eine Zeile verdichten:
Rücksprung, Schrittzeile, Marke in eine Zeile. Die Schrittleiste kann kleiner
bleiben als die Schrift. Quer die Sammlungsmarke in die Titelzeile ziehen.

**Nachprüfung:** Erfassung Schritt 1, 640 × 360 und 320 × 568 bei 200 %: Das
erste Eingabefeld ist im ersten Bild ganz zu sehen (`bottom` kleiner als
Leistenoberkante).

### R5-M4 [P3] Tabellenansicht am Telefon: Die Spalte „Zug" beginnt unter der klebenden Spalte, „ABGERÜCKT" bricht mitten im Wort (neu)

**Priorität:** P3

**Nachweis:** gemessen und im Screenshot beobachtet.

**Fundstelle:** Einsatzansicht, Umschalter „Tabelle" (`einheiten-tabelle.ts`,
`.einheiten-tabelle`, `.tabellen-scroll`, `index.html`).

**Beobachtung:** 360 × 640, 100 %: Die klebende Spalte „Einheit" reicht von 34
bis 152 px, die Zelle „Zug" beginnt bei 151 px. Der Text „1. TZ Albstadt"
steht ohne Innenabstand am Rand und wird links angeschnitten: Im Bild steht
„. TZ / Albstadt" mit halbem „A" (Screenshot `c-zug.png`, Ausschnitt aus
`t21-a`). In der klebenden Spalte bricht die Marke „ABGERÜCKT" als „ABGERÜCK /
T", und „Materialwirtschaft" bricht als „Materialwirtsch / aft". Die
14 Zeilen sind 1 852 px hoch (rund 130 px je Zeile), bei 200 % 7 191 px hoch
und 3 534 px breit.

**Folge:** Die Zugzuordnung ist in dieser Ansicht nicht lesbar, die Ansicht
wirkt kaputt. Die Tabelle ist nicht der Standard, aber der Umschalter steht
im ersten Bild der Liste.

**Empfehlung:** Die Zelle nach der klebenden Spalte mit linkem Innenabstand
versehen. „ABGERÜCKT" nicht trennen (`white-space: nowrap` oder kürzere
Marke), Silbentrennung nur für Namen.

**Nachprüfung:** 360 × 640, Tabelle: Der Text der Zelle „Zug" beginnt rechts
der klebenden Spalte (`left` der Textbox größer als Spaltenrand), und
„ABGERÜCKT" steht in einer Zeile.

### R5-M5 [P3] Kurz-Liste: Eine neu hinzugefügte Person hat zwei Felder ohne sichtbare Beschriftung (neu)

**Priorität:** P3

**Nachweis:** gemessen und im Screenshot beobachtet.

**Fundstelle:** Schritt 3, „Kurz-Liste (Tabelle)", `table.schnell-tabelle`
(`src/app/schritte/personal.tsx`). Die Felder tragen nur `aria-label`
(„Person 10: Vorname"), kein Platzhalter.

**Beobachtung:** 360 × 640, nach „+ Person hinzufügen": Die letzte Zeile zeigt
„Mannschaft" und zwei leere Kästen, darunter zwei Auswahlfelder „Mannschaft"
und „M" (Screenshot `t14-kurz-neu-a`). Welches Feld Vorname, welches
Nachname ist, steht nirgends. Bei gefüllten Zeilen ergibt es sich aus dem
Inhalt. Die Zeilenköpfe zeigen zudem „He" und „He, AGT" (gekürzt), die Knöpfe
▲ ▼ ⇑ und das rote × haben 44 × 44 px (gemessen, Ziel erreicht).

**Folge:** Gering: Der Fokus liegt im ersten Feld, und die Reihenfolge Vorname,
Nachname ist üblich. Wer aber ein Feld überspringt oder mit Handschuh tippt,
kann Vor- und Nachnamen vertauschen. Die Kurz-Liste ist gerade für das
schnelle Abtippen gedacht.

**Empfehlung:** Platzhalter „Vorname" und „Nachname" in die leeren Felder
(verschwinden beim Tippen) oder eine Kopfzeile je Person.

**Nachprüfung:** Kurz-Liste, „+ Person hinzufügen": Die leeren Felder zeigen
ihre Bezeichnung.

### R5-M6 [P3] Tablet quer (1180 × 820) bei 200 % Schrift: Zwei-Spalten-Ansicht greift, aber die Liste schrumpft auf eine Spalte von 230 px (Risiko, Nachbildung)

**Priorität:** P3

**Nachweis:** gemessen in der Nachbildung. Ob es mit echter Schrift-
Skalierung auftritt, ist **Risiko**.

**Fundstelle:** `@media (min-width: 72rem)` und `grid-template-columns:
minmax(20rem, 27rem) minmax(0, 1fr)` für `main.einsatz-detail` (`index.html`,
um Zeile 2385).

**Beobachtung:** Bei 1180 × 820 und 100 % stehen die Spalten wie gedacht
nebeneinander: links Kopfzahlen, Aufnahme, Bedarf, rechts die Liste, die erste
Karte beginnt bei 404 px (Screenshot `t12-einsatz-tq`). Bei 200 % (Wurzelschrift)
bleibt die Media-Query an, weil `72rem` dort mit 16 px rechnet, aber die linke
Spalte ist 27 rem = 864 px breit. Rechts bleiben 230 px, die Überschrift
„Einheiten (14 gemeldet · 11 zählend)" bricht in fünf Zeilen, „Karten" und
„Tabelle" rutschen übereinander, und zwei „Auftrag/Notiz"-Knöpfe reichen
19 px über den Rand (`scrollWidth` 1199 bei 1180; Screenshot
`t12-einsatz-tq-f`). Bei 820 × 1180 (Hochformat) und bei Telefonen ist es nicht
betroffen.

Mit der echten Browser-Einstellung für die Schriftgröße rechnet der Browser
Media-Queries in `rem` mit derselben Grundschrift, dann würde die Abfrage
bei 200 % erst bei 2 304 px greifen. Das habe ich nicht nachgestellt.

**Folge:** Nur falls die Zwei-Spalten-Ansicht trotz großer Schrift greift, wird
die Liste unbrauchbar. Ich nenne es, weil der 200 %-Test in dieser Prüfreihe
genau so nachgebildet wird.

**Empfehlung:** Eine Container-Abfrage statt Media-Query, oder ein Deckel für
die linke Spalte in px. Beim Nachprüfen mit echter Schriftskalierung testen.

**Nachprüfung:** Tablet quer mit Systemschrift auf 200 % (Gerät oder
Browser-Grundschrift 32 px): kein Überlauf, die Liste hat mindestens 20 rem.

### R5-M7 [P3] Tablet quer: Die feste Leiste des Assistenten steht am Fensterrand, 110 px neben der Spalte (neu)

**Priorität:** P3

**Nachweis:** beobachtet und gemessen.

**Fundstelle:** `footer.nav.assistent-nav` bei Breiten über der Satzspiegel-Breite
(`index.html`).

**Beobachtung:** 1180 × 820, Assistent Schritt 3: Der Inhalt steht in einer
Spalte von 126 bis 1054 px. Die Leiste ist 1180 px breit, „← Zurück" links bei
16 px und „Weiter →" rechts bei 1064–1164 px, also 110 bis 120 px
außerhalb der Spalte (Screenshot `t12-w3-tq`). Bei 820 × 1180 liegt die
Spalte bei 16–804 px und die Leiste passt.

**Folge:** Die Hand wandert beim Tippen von „Weiter" über das ganze Tablet. Ein
Fehler ist es nicht, aber der Daumen-Weg ist am Tablet quer länger, als er
sein müsste.

**Empfehlung:** Den Inhalt der Leiste auf die Breite der Spalte begrenzen.

**Nachprüfung:** 1180 × 820: `Weiter →` endet am rechten Spaltenrand
(1054 px) und nicht am Fensterrand.

### Verweise auf andere Runde-5-Berichte

- **Schwebendes „◐" in der Einsatzansicht** liegt links unten über Text,
  Marken und Kästchen (bei 360 × 640 und 640 × 360 auch über der Kante von
  „Bögen einlesen…", Screenshots `t4-scroll-1900`, `t2-einsatz-q`): R5-L1 in
  [nacht-und-sicht.md](nacht-und-sicht.md). Kein eigener Befund.
- **Die erste Einheitenkarte liegt weit unten:** Ich habe 1 746 px bei
  360 × 640, 1 809 px bei 320 × 568, 1 618 px bei 390 × 844 und 1 145 px quer
  (Runde 4: 2 234 / 2 368 / 2 085 / 1 461) gemessen, bei 200 % Schrift 5 635 px
  (8,8 Bildschirme) bei 360 × 640 und 7 348 px (12,9) bei 320 × 568. R5-K4 in
  [fuehrungssicht.md](fuehrungssicht.md). Kein eigener Befund.

## Bestätigtes

- **Kein seitlicher Überlauf:** Startseite, Assistent 1–6, Erfassung,
  Einsatzansicht, Tabelle (im Rollrahmen), Dialoge und Vollbild bleiben auf
  320, 360, 390 und 640 px bei 100 % und 200 % gerätebreit. Auch bei 180 × 320
  (rund 400 % Zoom) bleibt die Seite breit wie das Fenster. Bei 160 × 284
  ragt Schritt 3 um 11 px hinaus, die Schrittleiste rollt in ihrem Rahmen.
- **Fußleiste des Assistenten:** 360 × 640, 100 %: 70 px (11 %), 200 %: 78 px
  (12 %); 320 × 568: 12 % bzw. 14 %; quer 56 px (15 %) bzw. 69 px (19 %).
  „←", „◐", „Weiter →" und „Zur Übersicht →" bleiben im Bild und enden in jedem
  Schritt am selben rechten Rand (344 bzw. 342 px). Das Grundmaß liegt bei
  44–49 px.
- **Erfassungsleiste:** Zweizeilig mit 122–130 px (19–23 %), in Schritt 1–5 an
  gleicher Stelle, auch bei 200 % und 320 px. Quer einzeilig (56 px).
- **Tastatur-Wächter:** Nach Fokus in ein Textfeld und Verkleinerung des
  Fensters um 300 px (quer 160 px) setzt er `tastatur-offen`, blendet die
  Leiste und das schwebende „◐" aus und rückt das Feld auf 72 px unter den
  Rand. Auch bei 200 %.
- **Daumen-Quittung:** „Abrücken": 360 × 640, 100 %: 65 px hoch, „Rückgängig"
  123 × 44, „✕" 44 × 44. Bei 200 %: 135 px (21 %), Text, „Rückgängig" und „✕"
  vollständig im Bild, `top` 481 px bei Fensterhöhe 640. Bei 320 × 568 und 200 %
  24 % der Höhe. Der Inhalt endet am Seitenende über der Quittung.
- **QR-Vollbild bei 200 %:** Großbogen, 7 Teile, `scrollTop` 0, Code ganz
  im Bild: 360 × 640 Code 279 px, 320 × 568 207 px, 390 × 844 358 px, 640 × 360
  296 px, Tablet 788 px. „Teil 1 von 7", „←", „Weiter zu Teil 2 →" und
  „Schließen" im Bild (quer 36 px Rollweg, `scrollHeight` 396 bei 360).
- **Geräte-Zurück im QR-Vollbild** (R4-M5): Beim ersten Zurück bleibt das
  Vollbild offen und zeigt „Teil 3 von 7 wurde noch nicht gezeigt …" mit
  „Teil 3 von 7 zeigen" und „Trotzdem schließen". Das zweite Zurück schließt.
- **Zwei-Spalten-Ansicht ab 72 rem** (bei 100 %): 1180 × 820 links Kopfzahlen,
  Aufnahme, Bedarf, rechts die Liste, erste Karte bei 404 px. Bei 820 × 1180
  eine Spalte, erste Karte bei 1 017 px.
- **Kurz-Liste:** Alle Felder, Auswahlen und Knöpfe (▲ ▼ ⇑ ×) haben 44 px
  Höhe, bei 200 % 88 px; kein Überlauf.
- **Fokus:** Tab-Durchlauf Einsatzansicht (69 Ziele) und Schritt 3 (97 Ziele),
  100 % und 200 %: kein Ziel verdeckt, keines außerhalb des Bilds, alle mit
  Fokusrahmen. Einzige Auffälligkeit: Bei 320 × 568 und 200 % lag im Schritt-1-Durchlauf
  „‹ Startseite" unter dem Element der Sprungmarke (`elementFromPoint`);
  ich habe das nicht weiter verfolgt.
- **Rückfragen:** Die Rückfrage „Einheit für den Einsatz erfassen?" und der
  Hinweis „Name der Einheit fehlt" zeigen beide Knöpfe auch bei 200 % und
  320 × 568 ohne Rollen (Knopf an der unteren Dialogkante).
- **Startseite mit Entwurf:** „Fortsetzen" und „Verwerfen" stehen im ersten
  Bild. „Leeren Vordruck drucken (PDF) · Papier-Reserve zum Ausfüllen mit der
  Hand" ist ein Knopf in voller Spaltenbreite (57 px hoch bei 360, 94 px bei
  320), bei 200 % 298 px hoch (5 Zeilen), aber vollständig und ohne
  Überlauf.
- **Offline-Hinweis:** Wechselt nach rund 5 s von „Wird … geladen: 0,0 von
  6,8 MB" auf „✓ Jetzt offline bereit …" (Service Worker und Cache
  `workbox-precache` stehen).

## Abgleich mit Runde 4

Legende: **hält**, **teilweise**, **ins Gegenteil verkehrt**.

| Befund Runde 4 | Stand in Runde 5 | Nachweis |
| --- | --- | --- |
| R4-M1 200 %: Einsatzansicht und 320-px-Seiten breiter als das Gerät; Quittung und Rückfragen aus dem Bild | **hält** | Einsatzansicht, Startseite, Assistent bei 360, 320, 390, 640 gerätebreit; Quittung 200 % vollständig im Bild (135 px), „Rückgängig" und „✕" sichtbar; Rückfragen zeigen beide Knöpfe. Ausnahme nur in der Nachbildung auf dem Tablet quer (R5-M6, Risiko). |
| R4-M2 200 %: Fußleiste läuft über, Erfassungsleiste 42 % | **hält, mit Rest** | Assistent 12–14 % (quer 19 %), Erfassung 20–23 %, kein Knopf außerhalb. Rest wie in der Behebung benannt: 320 × 568, 200 %: Feld ab 438 px verdeckt. Dazu neu quer 640 × 360, 200 %: Kopf 384 px, kein Feld im ersten Bild (R5-M3). |
| R4-M3 Erfassungsleiste springt in Schritt 5 auf drei Zeilen | **hält** | 360 × 640 und 320 × 568, 100 % und 200 %: Leiste in Schritt 1–5 gleich hoch (122/130 px), „Zur Übersicht →" am selben rechten Rand wie „Weiter →". |
| R4-M4 QR-Vollbild bei 200 %: kein Code im ersten Bild | **hält** | Alle Größen Code, „Teil 1 von 7" und Knöpfe im Bild ohne Rollen. Der Übergabe-Dialog davor ist dagegen nicht gedeckelt, siehe R5-M1. |
| R4-M5 Geräte-Zurück im QR-Vollbild | **hält** | Erstes Zurück hält an und nennt Teil 3; zweites schließt. |
| R4-M6 Startseite 200 %: „Standard ▾" über dem Titel | **hält** | 360 × 640, 200 %: Titel „Digitaler Einheiten-Erfassungsbogen" und der Knopf „Ansicht: Standard ▾" stehen untereinander ohne Überlappung. Der Knopf heißt jetzt „Ansicht: Standard ▾". |
| R4-M7 Kleinere Stellen | **teilweise** | Moduswahl 44 px mit Schatten (hält); Sammlungsmarke bricht um statt zu kürzen (hält); Speicherzeile steht ganz („✓ gespeichert · 13:47 Uhr · nur auf diesem Gerät", hält); klebende Tabellenspalte 114 von 322 px (36 %, hält). Erfassung quer bleibt bei 128 px Kopf (wie in der Behebung vermerkt) und wird bei 200 % zum Problem (R5-M3). |
| Verweis R4-K5 (Einheitenliste weit unten) | **teilweise gelöst** | 1 746 gegen 2 234 px (360 × 640), siehe Verweis oben auf R5-K4. |

**Neue Reibung durch die Behebungen aus Runde 4:**
- **Schwebendes „◐" in der Einsatzansicht (R4-L3):** liegt auf dem Inhalt,
  siehe Verweis auf R5-L1.
- **Zwei-Spalten-Ansicht ab 72 rem (R4-K5):** Bei 100 % gelöst. In `rem`
  und mit Wurzelschrift nachgebildet kippt sie (R5-M6, nur Risiko).
- **Kurz-Liste (Neuerung seit Runde 4):** Zielmaße stimmen; die Beschriftung neuer
  Zeilen fehlt (R5-M5).
- **Deckel-Regel (R4-M1/M2/M4):** Sie hält überall, wo sie angewendet wurde. Der
  Übergabe-Dialog ist die eine große Fläche, die sie nicht bekam (R5-M1). Die
  Erfassung ist die zweite, wo sie bei kleinen Fenstern nicht reicht (R5-M3).
- **Nicht ins Gegenteil verkehrt:** Keine Behebung aus Runde 4 hat sich ins
  Gegenteil verkehrt. Die Rückschritte sind Ränder, keine Umkehrungen.
