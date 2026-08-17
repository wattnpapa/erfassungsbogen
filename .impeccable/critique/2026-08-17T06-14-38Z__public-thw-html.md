---
target: Content-Landingpages (public/*.html)
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-17T06-14-38Z
slug: public-thw-html
---
Method: dual-agent (A: Designreview, isoliert · B: Detektor + Browser-Evidenz, isoliert)
Einschränkung: Assessment A brach im ersten Anlauf an einem Kontingentlimit ab. Beim zweiten Lauf lagen Bs Befunde bereits im Synthese-Kontext. A selbst lief in eigenem Kontext und hat Bs Ausgabe nie gesehen — die vorgesehene Reihenfolge (A zuerst) ist aber gebrochen und wird hier offen ausgewiesen.

## Design Health Score

| # | Heuristik | Score | Kernbefund |
|---|-----------|-------|------------|
| 1 | Sichtbarkeit des Systemstatus | 2 | Länderseiten ohne Breadcrumb; „Katastrophenschutz → Niedersachsen" steht nirgends |
| 2 | Übereinstimmung mit der realen Welt | 4 | Fachterminologie durchgehend korrekt: Stärke, Sofortbedarf, StAN, Kennwort „Heros" |
| 3 | Nutzerkontrolle und Freiheit | 3 | Rückweg nur über Browser-Zurück oder die 19-Link-Fußzeile; Aufklappmenüs auf Touch bewusst aus |
| 4 | Konsistenz und Standards | 2 | Farbige Überschriften, acht Schriftgrade neben der App-Leiter, kein Karten-Vokabular; Rolltabelle ohne `role="region"` |
| 5 | Fehlervermeidung | 3 | Tote Bundesländer grau und nicht verlinkt — aber `#e6e8ee` gegen `#fff` ist kaum unterscheidbar |
| 6 | Wiedererkennen statt Erinnern | 3 | Nav und Fußzeile überall präsent; Fußzeile aber 19 Ziele ohne Gruppe |
| 7 | Flexibilität und Effizienz | 3 | Sprunglink, Aufklappmenüs, Karte als Direktzugriff — alle nur mit Desktop-Maus |
| 8 | Ästhetik und minimalistisches Design | 2 | `katastrophenschutz.html` 6.450 px mobil; Karte und Tabelle sagen dasselbe auf 1.453 px |
| 9 | Fehler erkennen und beheben | 3 | Fehlendes Bundesland sauber gestaltet (grau, `title`, FAQ-Antwort) |
| 10 | Hilfe und Dokumentation | 4 | `anleitung.html`, FAQ-Schema auf 6 von 7 Seiten, FAQ-Block am Ende jeder Seite |
| **Summe** | | **29/40** | **Gut — tragfähige Grundlage, zwei Regelbrüche auf jeder Seite** |

Kein `n/a` vergeben: alle zehn Heuristiken greifen auf diesen Seiten tatsächlich. Auch 7 und 10 nicht — es gibt echte Abkürzungen (Sprunglink, Aufklappmenüs, Karte) und mit `anleitung.html` eine vollwertige Dokumentationsseite.

## Design-Spezifitäts-Verdikt

**Die Texte gehören diesem Produkt. Das Layout gehört keinem.**

**LLM-Bewertung.** Auf der Copy-Ebene ist die Spezifität praktisch nicht kopierbar. „Heros <OV> 22/51 steht, ohne dass du die Zahlen nachschlägst"; „am Bildschirm statt auf der Motorhaube"; die Meldekopf-FAQ „Was passiert, wenn ich dieselbe Einheit zweimal scanne?". Kein beliebiges SaaS-Produkt könnte diese Sätze verwenden.

Visuell bricht es an vier Stellen, jede gegen eine benannte Regel in DESIGN.md:

1. **Die Gewichts-Regel fällt.** `h1` und `h2` stehen in der Kennfarbe, `h2` zusätzlich mit 2-px-Unterlinie in Blau. DESIGN.md: „Farbige Überschriften sind verboten; die Kennfarbe bleibt Aktionen vorbehalten." Auf `katastrophenschutz.html` mobil erscheint die Kennfarbe dreimal in drei Bedeutungen auf einem Bildschirm — Titel, Abschnitt, Aktion.
2. **Die Ein-Leiter-Regel existiert hier nicht.** `thw.html` setzt acht Schriftgrade (0.72, 0.78, 0.82, 0.85, 0.95, 1.0, 1.1, 1.4 rem). Genau einer liegt auf der App-Leiter. Ergebnis: h1 22,4 px, h2 17,6 px, h3 16 px = Fließtextgröße. Zwischen h2 und Fließtext liegen 1,6 px — die Größenhierarchie leistet nichts, weshalb die Farbe einspringen muss. Ein Fehler, zweimal sichtbar.
3. **Das Bauteil-Vokabular fehlt.** Karten mit 1-px-Rahmen, Deckzeilen-Regel, Versalzeile, Zählwert-Figur: nichts davon existiert. `content-stil.mts` zieht Null-Radius und zwei Grauwerte nach — die drei Regeln, die sich per Regex nachziehen ließen. Der Kommentar behauptet, das Skript gleiche „den Basis-Stil an die Handschrift der App an"; es gleicht drei Werte an.
4. **Die Systemschrift** ist begründet (Archivo kostet einen blockierenden Download) — aber die Kompensation wurde nie gebaut. Zusammen mit blauen Überschriften und flacher Leiter entsteht die Anmutung eines gepflegten Behörden-Blogs, nicht die eines Vordrucks.

**Deterministischer Scan.** `detect.mjs` über sieben Seiten: Exitcode 2, **50 Befunde**.

| Regel | Schwere | n | Beanstandete Werte |
|---|---|---|---|
| `design-system-font-size` | advisory | 17 | `0.72rem`, `0.78rem`, `0.95rem` |
| `design-system-color` | advisory | 14 | `#1a1c22`, `rgba(0,0,0,0.15)` |
| `design-system-font` | warning | 7 | `Roboto` |
| `flat-type-hierarchy` | warning | 7 | Ramp 11,5–22,4 px, Verhältnis 1,8–1,9:1 |
| `em-dash-overuse` | warning | 5 | 16–22 Halbgevierte je Seite |

Der Browser-Detektor bestätigt es auf fünf Seiten: `flat-type-hierarchy` feuert überall genau einmal.

**Wo Detektor und Review sich decken:** `flat-type-hierarchy` und `design-system-font-size` treffen exakt den P0 der Designbewertung, unabhängig voneinander gefunden. Die Ramp-Messung (1,8:1 zwischen den Ebenen) ist die maschinelle Fassung von „zwischen h2 und Fließtext liegen 1,6 px".

**Fehlalarme — dreieinhalb von fünf Regeln:**
- `design-system-font` „Roboto" ist kein gewählter Font, sondern ein Glied des System-Stacks. Chrome meldet den ersten benannten Treffer.
- `text-overflow` (18–37 Befunde je Seite im Browserlauf): inline-`<a>`/`<strong>` in umbrechenden Absätzen, deren Rechteck mehrere Zeilenboxen umspannt. Gegenbeweis: `scrollWidth === clientWidth` bei 1280 **und** 375 px auf allen fünf Seiten.
- `em-dash-overuse`: die Zählung stimmt, die Regel ist auf englische KI-Prosa geeicht. Im Deutschen ist der Halbgeviertstrich reguläre Zeichensetzung.
- `design-system-color` `rgba(0,0,0,0.15)`: **B hat das als echte Abweichung gewertet — das ist ein Irrtum.** Es ist der Schatten des Aufklappmenüs in der Kopfnavigation, und ein Aufklappmenü ist genau der Fall, den die Flach-im-Stand-Regel erlaubt („Schatten nur an Dropdown/Dialog"). Der Wert ist zudem bitgenau der in DESIGN.md dokumentierte Vorschlagslisten-Schatten `0 4px 12px rgba(0,0,0,0.15)`. Regelkonform.

**Echt bleibt genau ein Detektorbefund, den die Designbewertung übersehen hat:** `#1a1c22` als Literalfarbe für den Fließtext, wo ein Token stünde. Klein, aber es ist Token-Drift.

**Visuelle Overlays:** Injektion gelang (Mutationstest bestanden), der Detektor lief in fünf Seiten. Ein Overlay ist derzeit **nicht** im Browser sichtbar — der Lauf wurde bewusst mit `autoScan: false` wiederholt, weil das Overlay die Kontrastmessung verfälscht hatte, und beide Hilfsserver sind gestoppt. Die berichteten Zahlen stammen aus dem sauberen Lauf.

**Was der Scan ausdrücklich nicht gefunden hat** — und das ist ein Befund für sich: 0 Konsolenfehler, 0 fehlgeschlagene Netzwerkanfragen (alle 36 Anfragen 200/304), 0 `<img>` ohne `alt` über alle 35 HTML-Dateien, genau eine H1 je Seite, 0 Überschriftensprünge, 0 Kontrastwerte unter 4,5:1, kein horizontales Scrollen bei 375 px. Die technische Grundlage ist sauber.

## Gesamteindruck

Ein Werkzeugbauer, der seine Fachdomäne beherrscht, hat 33 Seiten mit einer Präzision geschrieben, die man nicht kaufen kann — und sie dann in ein Layout gesetzt, das jeder Content-Baukasten ausgespuckt hätte. Die Substanz trägt, die Form trägt nicht mit.

Die größte einzelne Chance ist nicht Kosmetik: Es sind zwei Regelbrüche, die sich gegenseitig stützen. Die Schriftleiter ist so flach, dass die Kennfarbe die Gliederung übernehmen muss; damit verliert sie die Signalwirkung, die sie in der App hat. Wer von einer Landingpage in die App wechselt, sieht zwei Produkte. Beide Brüche lassen sich generatorseitig in einem Zug beheben.

## Was funktioniert

**1. Die Fachtiefe kauft Vertrauen mit Präzision statt mit Testimonials.** Die Funkrufnamen-Bildung wird auf `thw.html` inklusive Randfällen erklärt („Anhänger und Nicht-Funkstellen bleiben folgerichtig ohne Funkrufnamen"). Das funktioniert, weil BOS-Ehrenamtliche in drei Sätzen erkennen, ob jemand die Materie kennt; ein falscher Fachbegriff hätte die Seite erledigt. Es gibt keinen. Da PRODUCT.md Testimonials und Nutzerzahlen ausdrücklich ausschließt, ist das die einzig verfügbare Vertrauensstrategie — und sie ist konsequent durchgehalten.

**2. Die Deutschlandkarte ist barrierefrei richtig gebaut, mit dokumentierter Begründung.** Das `<svg>` trägt `aria-hidden="true"`, jedes `<a>` darin `tabindex="-1"`, die vollständige Textalternative steht als Tabelle darunter. Die Begründung im Kommentar ist die richtige: ein fokussierbares Element im `aria-hidden`-Teilbaum ist ein Tabstopp, den die Vorlesesoftware nicht ankündigt. Genauso das senkrechte Polster an den Nav-Links mit der Notiz, dass sie ohne es 19,7 px hoch wären und WCAG 2.5.8 verfehlen. Diese Sorgfaltsebene ist selten — und der Messlauf bestätigt sie: kein fehlendes `alt`, keine Überschriftensprünge, eine H1 je Seite über alle 35 Dateien.

**3. Der Markenhinweis als Ehrlichkeitssignal.** Bei einer Seitenwelt, die THW-, DRK- und Malteser-Namen führt und Länderverordnungen auswertet, räumt „ein unabhängiges, privates Projekt … keine Zusammenarbeit" die Erwartung „das ist offiziell" ab, bevor sie enttäuscht werden kann. Gegenüber einer auf Amtlichkeit trainierten Zielgruppe ist das kein Kleingedrucktes, sondern Substanz.

## Prioritätsprobleme

### [P0] Die Kennfarbe trägt die Hierarchie, die die Schriftleiter nicht leistet

**Warum es zählt:** Zwei benannte DESIGN.md-Regeln fallen auf jeder Seite, und sie stützen sich gegenseitig. Bei h1 22,4 / h2 17,6 / h3 16 px — drei Ebenen auf 6,4 px Spannweite — *muss* Farbe die Gliederung machen. Die Folge: Die Kennfarbe erscheint mobil dreimal in drei Bedeutungen auf einem Bildschirm und verliert genau die Signalwirkung, die die Kennfarben-Regel schützt. Der Detektor bestätigt es unabhängig (`flat-type-hierarchy` 7×, `design-system-font-size` 17×).

**Fix:** In `scripts/content-stil.mts` zwei idempotente Regeln über alle 33 Seiten: (a) `h1`/`h2` auf `#11141b`, `h2`-Unterlinie von `2px solid var(--blau)` auf `1px solid var(--rand)` — die Kennfarbe bleibt dann `.start` und Links vorbehalten; (b) die acht Grade auf die App-Leiter mappen: h1 `1.75rem`, h2 `1.375rem`, h3 `1.125rem`, Nebentext/figcaption `0.875rem`, Nav und `.marken-hinweis` `0.8125rem`. Die Werte 0.72/0.78/0.82/0.85/0.95/1.1/1.4 verschwinden ersatzlos. Gleicher Zug: `#1a1c22` durch das Text-Token ersetzen.

**Vorgeschlagener Befehl:** `/impeccable typeset`

### [P0] Ein einziger Handlungsknopf auf bis zu 6.450 px Seitenhöhe

**Warum es zählt:** Auf allen sieben geprüften Seiten existiert genau ein `a.start`, stets im ersten Drittel. Mobil liegt er auf `katastrophenschutz.html` bei y=519 — hinter 116 px Kopfnav und einem Neun-Zeilen-Absatz, also unter der Falz eines 812-px-Geräts. Danach folgen 5.900 px ohne jedes Angebot. Wer die 885 Wörter wirklich liest, ist der bestqualifizierte Besucher, den diese Seiten je bekommen, und wird nie gefragt. Im Persuade-Modus ist das der teuerste Einzelfehler.

**Fix:** Zwei weitere `a.start` generatorseitig über einen Marker-Block analog zu `<!-- NAV:START -->`: einer unmittelbar vor dem FAQ-Block mit kontextspezifischer Beschriftung („THW-Bogen jetzt ausfüllen", „Einsatz-Sammlung öffnen"), einer als letztes Element des Main — *vor* Fußzeile und Markenhinweis — mit der Rückversicherungszeile darunter: „Kostenlos, ohne Anmeldung, alle Daten bleiben auf deinem Gerät." Das löst zugleich das Peak-End-Problem.

**Vorgeschlagener Befehl:** `/impeccable bolder`

### [P1] Die Bundesländer-Tabelle rollt mobil ohne Tastaturzugang — und sagt dasselbe wie die Karte darüber

**Warum es zählt:** Zwei Befunde in einem Bauteil. Erstens Redundanz: `figure.laenderkarte` (543 px) und `div.tabellenrahmen` (910 px) transportieren beide „welches Bundesland hat eine Seite" — 1.453 px für eine Landesauswahl. Zweitens, schwerwiegender: Die Tabelle rollt bei 375 px seitlich (380 px Inhalt in 343 px Rahmen — im Browser gemessen) und trägt weder `tabindex` noch `role="region"` noch ein Label. DESIGN.md schreibt für genau diesen Fall die Rollbereich-Regel vor, und die App erfüllt sie über `<TabellenScroll>`. Auf den Landingpages existiert die Spalte „Inhalt" für Tastaturnutzer am Handy schlicht nicht. Bemerkenswert: Der Detektor hat das nicht gefunden — er misst Seitenscrollen, und das gibt es korrekt nicht.

**Fix:** (a) `div.tabellenrahmen` in `content-laenderkarte.mts` um `tabindex="0" role="region" aria-label="Bundesländer mit Landesvorlagen"` und einen sichtbaren Fokusring ergänzen. (b) Die Tabelle auf zwei Spalten kürzen (Land, Anzahl Bögen) oder durch eine nach Anzahl sortierte Linkliste ersetzen; die ausführliche Beschreibung gehört auf die Länderseite, nicht auf den Hub.

**Vorgeschlagener Befehl:** `/impeccable audit`

### [P1] Keine progressive Offenlegung — `<details>` kommt auf keiner Seite vor

**Warum es zählt:** `anleitung.html` hat 1.212 Wörter, 8 h2 + 8 h3 und acht dauerhaft ausgeklappte FAQ-Antworten. Das ist die Seite, auf der jemand mit einer *konkreten* Frage landet („Was kostet die App?") — und er muss durch acht Antworten scrollen, um seine zu finden. Auf `thw.html`, `meldekopf.html` und `katastrophenschutz.html` je drei bis vier. Das FAQ-Schema (`FAQPage`) ist bereits ausgezeichnet; die SEO-Wirkung bleibt bei `<details>` erhalten.

**Fix:** FAQ-Paare (h3 + p) generatorseitig in `<details><summary>` fassen, das erste mit `open`. Auf `anleitung.html` zusätzlich ein Sprungmenü aus den acht h2 direkt unter der h1 — die Seite ist der Nachschlage-Ort und sollte sich wie einer verhalten.

**Vorgeschlagener Befehl:** `/impeccable distill`

### [P2] `figure.foto` zerschneidet die Fahrzeugfotos auf dem Desktop

**Warum es zählt:** Feste 260 px Höhe bei 100 % Breite ergibt bei 1280 px Viewport ein 704×260-Fenster auf ein 701×526-Bild — die Hälfte fällt weg, und ohne `object-position` wird mittig geschnitten. Vom Arzttruppwagen auf `katastrophenschutz.html` sind Räder und Kühlergrill zu sehen, das Fahrzeug als Ganzes nicht. Mobil stimmt das Bild. Bei dieser Zielgruppe ist das Foto kein Dekor, sondern Wiedererkennung („so ein Fahrzeug fahre ich"); ein angeschnittener ATW leistet das nicht und wirkt wie ein Platzhalter.

**Fix:** `figure.foto img { height: auto; aspect-ratio: 4 / 3; object-fit: cover; object-position: center 40% }` — oder die feste Höhe streichen und die natürliche Bildhöhe stehen lassen. `width`/`height` sind im Markup gesetzt, Layout-Shift entsteht nicht.

**Vorgeschlagener Befehl:** `/impeccable layout`

## Kognitive Last

**5 von 8 Punkten fallen durch — Einstufung: hoch.**

Fehlschläge: Single focus (Karte und Tabelle verfolgen zwei Ziele im selben Abschnitt) · Chunking (6er-Liste, 5–8 h2 je Seite, 16-Zeilen-Tabelle, 19-Link-Fußzeile) · Gruppierung (Fußzeile: 19 Ziele in einer punktgetrennten Kette) · Visuelle Hierarchie (drei Ebenen auf 6,4 px) · ≤4 Optionen (siehe unten) · Progressive Offenlegung (kein `<details>`).

Bestanden: Eins nach dem anderen (linearer Lesefluss, keine Modals) · Arbeitsgedächtnis (nichts muss über einen Abschnitt hinweg behalten werden).

**Entscheidungspunkte mit mehr als 4 sichtbaren Optionen:** Kopfnavigation 7 Einträge (mobil zweizeilig, 116 px Kopfhöhe = 14 % des Viewports vor dem ersten Wort) · Aufklappmenü „Katastrophenschutz" 12 Länder · „Alle Themen" 6 · „Hilfsorganisationen" 5 · Fußzeile 19 Links · Länderkarte 12 klickbare plus 4 optisch fast gleiche tote Flächen · Bundesländer-Tabelle 16 Zeilen · Fließtext-Links: `thw.html` 32, `katastrophenschutz.html` 58, `katastrophenschutz-niedersachsen.html` 48 · `uebersicht.html` 66 Links in 7 Gruppen.

## Emotionale Reise

Der Auftakt ist handwerklich richtig: `thw.html` beginnt mit der Frage, die die Führungsstelle wirklich stellt, und beantwortet die drei Zweifel im selben Absatz — kostenlos, offline, ohne Anmeldung. Der Knopf steht direkt danach.

Dann kommt ein Tal von 4.000 px ohne jedes Handlungsangebot.

Das Ende ist emotional falsch besetzt. Was nach dem letzten Absatz steht: 19 Fußlinks, dann der Markenhinweis „keine Zusammenarbeit mit den hier genannten Organisationen und Behörden und keine Unterstützung durch sie." Das Letzte, was ein Besucher mitnimmt, ist eine juristische Distanzierung. Der Peak liegt bei 7 % Scrolltiefe, das Ende ist ein Haftungsausschluss. Der Hinweis muss bleiben — er darf nur nicht das letzte Wort sein.

Die Rückversicherung ist teils fehlplatziert: Die eigentliche BOS-Sorge — *wo bleiben Personennamen und Erreichbarkeiten meiner Helfer?* — wird auf den Persuade-Seiten nirgends beantwortet. Sie steht als FAQ auf `anleitung.html` und auf `open-source-datenschutz.html`, im Aufklappmenü „Alle Themen" an fünfter Stelle. Der Zweifel entsteht am Knopf, die Antwort liegt zwei Klicks entfernt. Der Satz aus PRODUCT.md — „alle Daten bleiben auf dem Gerät", laut Positionierung das tragende Alleinstellungsmerkmal — steht auf `thw.html` nicht.

Am besten geführt ist `papier-oder-digital.html`: „Die ehrliche Antwort: kein Entweder-oder" nimmt den Verkaufsdruck und schließt mit „Ausprobieren kostet nichts". Der einzige Seitenschluss im Set, der emotional richtig endet — und ausgerechnet dort fehlt der zweite Knopf.

## Persona-Warnsignale

**Jordan (Ersteinsteiger):** Sieht als erste Fläche 116 px Kopfnav mit sieben Rubriken, bevor die Seite gesagt hat, was sie ist. Der Knopf „Bogen jetzt ausfüllen" führt auf `./` — ob dahinter ein Download, eine Registrierung oder ein Formular liegt, steht nicht am Knopf. Die Antwort auf „muss ich mich anmelden, wo landen die Namen meiner Helfer?" liegt zwei Klicks entfernt. Die Liste „Vorbelegt statt abgetippt" öffnet mit dem Kürzelbeispiel „OODE" ohne Auflösung.

**Riley (Stresstester):** Klickt in der Karte auf Schleswig-Holstein und bekommt nichts — keine Cursor-Änderung, kein Hinweis, nur ein `title`-Tooltip nach 1,5 s. Tabbt durch `katastrophenschutz.html`: Sprunglink, 7 Nav-Einträge, alle 23 Aufklapp-Links (`:focus-within` öffnet sie), 58 Main-Links — die rollende Bundesländer-Tabelle ist dabei nicht ansteuerbar. Sucht auf `uebersicht.html` Sachsen-Anhalt und findet weder das Land noch einen Hinweis, warum vier fehlen. Öffnet Hub und Länderseite nebeneinander: beide h1 beginnen gleich, beide Fußzeilen identisch, ohne Breadcrumb ist die Hierarchie nicht erkennbar.

**Casey (abgelenkt, mobil, im Fahrzeug):** Der einzige Knopf liegt bei y=519, unter der Falz. Danach 5.900 px ohne zweites Angebot — wer scrollt und wieder aufsieht, hat keinen Wiedereinstieg. Bildunterschriften bei 0,72 rem (11,5 px) sind mit Handschuh nicht lesbar. Der Tipp auf „Katastrophenschutz" öffnet keine Klappe (auf Touch bewusst aus), sondern lädt eine 6.450 px hohe Seite, um dort ein Land zu wählen.

**Zugführer am Meldekopf (projektspezifisch, entscheidet in 60 Sekunden):** `meldekopf.html` hat 784 Wörter und sechs h2, bevor die Antwort kommt. Der Beleg, der ihn überzeugt — „per QR-Scan sofort, eine Einheit in Minuten" — steht in PRODUCT.md, aber nicht als Zahl im ersten Bildschirm. Kein Screenshot der Stärkeübersicht oben: die eine Ansicht, an der er in fünf Sekunden erkennt, ob das seinem Meldevordruck entspricht, kommt zu spät. Und kein Satz dazu, was passiert, wenn eine eintreffende Einheit *kein* QR-PDF dabeihat.

**Ortsbeauftragter, nachts am Handy (projektspezifisch):** Die Seiten kennen keinen Dunkelmodus. Das ist regelkonform — DESIGN.md verbietet `prefers-color-scheme`, und die App-Modi hängen am Schalter —, aber die Landingpages haben keinen Schalter, also existiert die Option für ihn nicht. Er bekommt `#f2f3f7` mit blauer H1 ins dunkeladaptierte Auge. Der Nacht-Modus, das stärkste Produktargument für genau seine Situation, wird auf `thw.html` nirgends erwähnt.

## Kleinere Beobachtungen

- **Trefferflächen:** 31–58 Elemente je Seite unter 44 px; nach Abzug der Fließtext-Links bleiben 28–42. Kopfnav 29 px, Fußnav 16 px, Sprunglink und Haupt-Knopf je 43 px. WCAG 2.5.8 (24 px) ist erfüllt und die Fußnav fällt korrekt unter die Fließtext-Ausnahme — aber das eigene `--ziel-basis` von 44 px verfehlt ausgerechnet die primäre Aktion des Produkts, um einen Pixel, und der Wert ist zufällig aus Padding und Zeilenhöhe entstanden statt aus dem Token abgeleitet.
- **Fußzeile:** 19 Links ohne Gruppen, 264 px hoch auf dem Handy, danach der Haftungsausschluss. DESIGN.md führt „die Fußzeilen-Gruppentitel" ausdrücklich in der Versalzeile; die App gliedert, die Landingpages nicht. Vier Gruppen (*Loslegen* · *Organisationen* · *Behörden und Länder* · *Rechtliches*) machen daraus vier Entscheidungen statt neunzehn.
- `h2 { clear: both }` steht doppelt — Artefakt der Regex-Nachzieherei.
- Der Kommentar in `content-stil.mts` verspricht eine Angleichung „an die Handschrift der App", liefert drei Werte. Er führt die nächste Person, die eine Seite anlegt, in die Irre.
- 58 Links auf 885 Wörter (`katastrophenschutz.html`) — etwa alle 15 Wörter einer. Über der Schwelle, ab der Fließtext optisch zerfällt.
- H1 und `<title>` von `uebersicht.html` sind identisch; auf allen anderen Seiten sinnvoll differenziert.
- Alle sieben Seiten teilen dasselbe `og:image`. Beim Teilen in einer OV-Gruppe sehen THW-, DRK- und Meldekopf-Seite identisch aus.
- `figure.zeichen` floatet rechts, bricht unter 34 rem korrekt um, Caption passt sich an — die einzige Stelle im Set, an der ein Bauteil eigenständig durchgestaltet wurde.
- Die Karte färbt das aktuelle Land in der Kennfarbe: eine *Status*aussage statt einer Aktion. Streng genommen nicht regelkonform, inhaltlich richtig — ein Fall, den DESIGN.md nicht abdeckt.

## Fragen

1. **Wenn Archivo für eine Landingpage zu teuer ist — warum wurde die Kompensation nie gebaut?** Eine DIN-Anmutung ohne DIN-Schrift ist machbar: engere Zeilenhöhe, Versalzeilen aus dem System-Stack, härtere Linien, Kartenrahmen. Nichts davon existiert. War die Systemschrift der Grund oder der Anlass, die visuelle Angleichung ganz zu lassen?
2. **Warum steht das tragende Alleinstellungsmerkmal nicht auf den Seiten, die verkaufen sollen?** Bei einer Zielgruppe, die Personendaten von Ehrenamtlichen erfasst, ist Datenhoheit nicht ein Argument unter vielen — es ist *das* Argument. Warum trägt es keine eigene Sektion mit dem Knopf darunter?
3. **Was leistet die Deutschlandkarte, wenn direkt darunter die vollständige Tabelle steht?** Entweder die Karte ersetzt die Tabelle (mit Zahlen in den Flächen), oder die Tabelle ersetzt die Karte. Beides nebeneinander ist Verlegenheit.
4. **Wer hat entschieden, dass eine Seite genau einen Knopf haben darf?** Gegenüber einer Zielgruppe, die nichts bezahlt und nichts preisgibt, ist Zurückhaltung keine Höflichkeit, sondern eine verpasste Frage. Was ginge kaputt, wenn am Ende noch einmal stünde: „Kostet nichts. Braucht keine Anmeldung. Probier's aus"?
5. **33 Seiten, aber kein Vertrag darüber, was eine Seite ist.** Jede trägt ihr eigenes `<style>`, und die Konsequenz ist ein Skript, das per Regex drei Werte über 33 Dateien repariert. Bei der nächsten Entscheidung wird eine vierte Regex geschrieben. Ab welcher Zahl von Regeln ist ein gemeinsames `content.css` billiger als die Regex-Sammlung, die die Regeln nachträglich wieder hineinschreibt?
