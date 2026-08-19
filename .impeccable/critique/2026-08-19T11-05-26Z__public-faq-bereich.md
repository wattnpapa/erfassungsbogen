---
target: FAQ-Bereich der SEO-Landingpages
total_score: 22
max_score: 36
na_heuristics: 9
p0_count: 2
p1_count: 3
timestamp: 2026-08-19T11-05-26Z
slug: public-faq-bereich
---
Method: dual-agent (A: Design-Review · B: Detektor + Browser)

Ziel: FAQ-Bereich über die SEO-Landingpages — `public/*.html`, `<details class="frage">` plus JSON-LD `FAQPage`. 28 Seiten mit Accordion, 101 Frageblöcke, 29 Seiten mit FAQPage-Schema.

## Design Health Score

| # | Heuristik | Punkte | Kernproblem |
|---|-----------|--------|-------------|
| 1 | Sichtbarkeit des Systemstatus | 3 | `+`/`−` wechselt korrekt, aber der geschlossene Zustand verrät nichts über Länge oder Inhalt der Antwort; kein „x von y". |
| 2 | Übereinstimmung System ↔ reale Welt | 4 | Stärkste Fläche: Bereitstellungsraum, StAN, Bergungsräumgerät, DV 102 — die Fachsprache stimmt durchgängig. |
| 3 | Nutzerkontrolle und Freiheit | 2 | Keine Anker je Frage, kein „alle aufklappen", keine Deep-Links. Eine Antwort ist nicht verlinkbar. |
| 4 | Konsistenz und Standards | 1 | Nur 2 von 28 Seiten haben sichtbaren Text und Schema-Text deckungsgleich; 14 Seiten haben zusätzlich eine Frage zu wenig im Schema; `papier-oder-digital.html` hat ein FAQPage ohne jede sichtbare FAQ. |
| 5 | Fehlervermeidung | 3 | Der Druck-Override klappt alle `<details>` auf (zwei Schreibweisen, alt + `::details-content`) — durchdacht. Abzug: kein `id` je Frage, kein Wiederfinden nach Reload. |
| 6 | Wiedererkennen statt Erinnern | 2 | Nur die erste Frage ist offen; bei 8 Fragen (`anleitung.html`) muss aus Titeln geraten werden. |
| 7 | Flexibilität und Effizienz | 1 | Kein Sprunglink auf 27 von 28 Seiten, keine Suche, kein Filter. Wer über die Suchmaschine mit einer konkreten Frage kommt, scrollt bis ans Seitenende. |
| 8 | Ästhetik und minimalistisches Design | 3 | Ruhig und formularhaft — Abzug für den Kennfarben-Marker und den fehlenden Abschlussstrich unter der letzten Frage. |
| 9 | Fehler erkennen/beheben | n/a | Statisches `<details>` ohne Zustände, die fehlschlagen können. |
| 10 | Hilfe und Dokumentation | 3 | Die FAQ *ist* die Hilfe und leistet das gut; Abzug, weil auf 17 Seiten der Datenschutz-Verweis und auf 18 die Kostenfrage im FAQ fehlen. |
| **Gesamt** | | **22/36** | **Mittelfeld — solide Substanz, systematische Auslieferungsfehler** |

Heuristik 9 als `n/a` gewertet, Maximum entsprechend 36 statt 40.

## Design-Spezifitäts-Urteil

**LLM-Bewertung:** Der Inhalt ist produktspezifisch und stellenweise exzellent — die Gestaltung ist ein austauschbares Accordion.

„Zählt der Fahrzeugführer als Führer oder als Unterführer?" (`staerkemeldung-feuerwehr.html:532`), „Warum legt die App nur neun Personalplätze an, obwohl es eine Reserve gibt?" (`thw-fachgruppe-notversorgung-erfassungsbogen.html:468`), „Woher kommen die Funkrufnamen?" mit dem offenen Eingeständnis, dass kein amtliches Verzeichnis auffindbar war (`katastrophenschutz-bayern.html:461`) — das schreibt niemand, der nicht in der Einheit war. Das ist der wirksamste Vertrauensbeweis der Seiten, wirksamer als jedes Testimonial, das hier ohnehin fehlen muss.

Die Hülle hält da nicht mit. Der Marker `+`/`−` steht in `var(--blau)` (`thw.html:185`) — die Kennfarbe, die laut Kennfarben-Regel nur Kopfbalken und Primäraktion tragen dürfen. Jetzt trägt sie auf jeder Landingpage drei bis acht dekorative Pluszeichen und konkurriert mit dem einzigen Knopf, der zählt. `.frage` hat nur `border-top` (`thw.html:182`): der Stapel bekommt keinen Abschlussstrich und franst in die Handlungsaufforderung aus — in einer Behördenformular-Optik, die von geschlossenen Kästen lebt, kein Detail.

Und drei völlig verschiedene FAQ-Sorten sehen identisch aus: Fachterminologie (Stärkemeldung), Quellenkritik (Länderseiten: „Sind die Vorlagen amtlich? Nein — …") und Einwandbehandlung (Organisationsseiten: Kosten, Konto, Daten). Die dritte ist die austauschbarste und steht in acht Varianten desselben Absatzes.

**Deterministischer Scan:** `detect.mjs` auf 11 repräsentativen Seiten: Exit 2, **25 Funde** — `design-system-color` 15×, `em-dash-overuse` 8×, `side-tab` 2×. **Keiner davon betrifft den FAQ-Bereich.** Bewertung: `rgba(0,0,0,0.15)` ist auf 11 von 11 Seiten identisch — konsistente Schattenfarbe, die nur in DESIGN.md fehlt, keine Drift. `em-dash-overuse` ist auf englische Kadenz kalibriert und feuert am deutschen Gedankenstrich als reguläre Interpunktion. `side-tab` (`staerkemeldung-feuerwehr.html:46`, `thw-fachgruppe-raeumen-erfassungsbogen.html:58`) trifft Hinweiskästen, nicht die FAQ — ist aber ein echter Regelbruch gegen die Deckzeilen-Regel und gehört separat behandelt. Alle vier: für diese Kritik Fehlalarme.

Die eigentliche deterministische Evidenz kam aus der Eigenprüfung über alle 28 Seiten, nicht aus dem Detektor — und die ist hart:

- **2 von 28** Seiten haben sichtbaren Fragetext und Schema-Fragetext deckungsgleich (`asb.html`, `malteser.html`). Auf 12 Seiten ist die Schnittmenge **null**.
- **14 Seiten** haben eine sichtbare Frage mehr als das Schema — nachgeprüft: 12 Länderseiten plus `bbk.html` und `bundeswehr.html`, immer die letzte sichtbare Frage.
- **`papier-oder-digital.html`**: FAQPage mit 2 Fragen, **null** `<details>`. Im Browser gegengeprüft — beide Fragetexte kommen in `document.body.innerText` nicht vor.
- **27 verschiedene H2-Wortlaute auf 28 Seiten**, mit drei konkurrierenden Präpositionsmustern („aus dem/der …", „zum/zur …", „zu den …") und uneinheitlicher Bezeichnerlänge („FGr R im Erfassungsbogen" gegen „FGr N").
- **1 von 28** Seiten hat einen Sprunganker (`anleitung.html`, `id="haeufige-fragen"`). Die übrigen 27 haben weder ID am H2 noch ein FAQ-Containerelement — die `details` hängen direkt in `main#inhalt`.
- 26 von 101 Blöcken (25,7 %) entfallen auf zwei Fragen: „Sind die Vorlagen amtlich?" (12×) und „Was ist mit anderen Bundesländern?" (12×).
- Antwortlängen: Median 253 Zeichen, Max 604 (`katastrophenschutz-nordrhein-westfalen`) = 2,4× Median.

**Browser-Messung** (lokaler Server, seither gestoppt): Das Accordion ist handwerklich sauber. `summary` 44 px bei 1280 px, 54 px bei 375 px — kein Element unter 44 px. Kontrast 16,62:1 für Frage und Antwort. Kein horizontaler Überlauf bei 375 px. Fokusring real per Tab geprüft: `outline: 3px solid rgb(18,39,94)`, Offset 2 px, `:focus-visible` greift. Toggeln in beide Richtungen auf drei Seiten verifiziert. Keine Konsolenmeldungen.

**Overlays:** Die Injektion gelang während der Messung, das Overlay-DOM war vorhanden, Konsolenfunde `em-dash-overuse` (22 auf thw, 11 auf papier-oder-digital) und `edge-flush-cards` (9 — Fehlalarm, das sind `<td>` einer Vergleichstabelle). **Es steht dir jetzt kein Overlay-Tab mehr offen:** der Server wurde nach der Messung wieder gestoppt, wie es die Kritik verlangt.

Zwei Messungen konnten nicht sauber erhoben werden und sind es wert, dass du sie kennst: Screenshots lieferten in diesem Harness nur einfarbige Flächen (alle Zahlen oben sind deshalb gemessen, nicht abgelesen), und Enter/Space per Tasteninjektion erreichte das Dokument nicht — das Toggeln ist per Aktivierungsklick belegt, die Tastaturbedienung liegt bei nativem `<details>` ohnehin beim Browser.

## Gesamteindruck

Die FAQ ist inhaltlich das Beste an diesen Seiten und technisch das Nachlässigste. Jemand hat sich hingesetzt und die Fragen aufgeschrieben, die in Einheiten wirklich gestellt werden — und dann wurde derselbe Text ein zweites Mal, in anderer Formulierung, ins JSON-LD geschrieben, wo er seither auseinanderdriftet. Das ist keine Design-Schwäche, das ist eine fehlende Single Source of Truth: 26 von 28 Seiten liefern der Suchmaschine eine andere Frage als dem Menschen, und eine Seite liefert dem Menschen gar keine.

Die größte Chance liegt nicht im Zufügen, sondern im Zusammenziehen: **eine Quelle für Frage und Antwort, aus der sowohl das sichtbare `<details>` als auch das Schema generiert werden.** Das erledigt Priority Issue 1, 2 und 3 in einem Zug und macht die Fragen zum ersten Mal pflegbar.

## Was funktioniert

1. **Fachsprachliche Präzision, die Vertrauen erzeugt.** `staerkemeldung-feuerwehr.html:521-560` beantwortet „Was bedeuten die Zahlen 1/8/9?" und die Führer/Unterführer-Frage sauber („Maßgeblich ist die Stellung in der gemeldeten Einheit, nicht die Ausbildung"). Das erzeugt genau das Gefühl, das die Seite braucht: *Die verstehen das.*
2. **Intellektuelle Redlichkeit als Verkaufsargument.** „Sind die Vorlagen amtlich? Nein — … Maßgeblich bleibt die jeweilige Landesregelung; deshalb kannst du jede Vorbelegung frei anpassen" (`katastrophenschutz.html:536-543`). Der Satz nimmt das Nein und dreht es in Handlungsfreiheit. Im BOS-Umfeld wirkt das stärker als jede Behauptung.
3. **Der Ausdruck ist mitgedacht — und die Bedienung stimmt.** `thw.html:196-202` klappt im Druck alle `<details>` auf, in zwei Schreibweisen für alte und neue Browser, und entfernt den `+`-Marker. Dazu: 44/54 px Trefferflächen, 16,62:1 Kontrast, sichtbarer Fokusring im App-Muster — gemessen, nicht behauptet.

## Priority Issues

### [P0] FAQPage-Schema ohne sichtbare FAQ
**Was:** `public/papier-oder-digital.html:452-467` liefert ein `FAQPage` mit zwei Fragen („Ersetzt der digitale Erfassungsbogen das Papier?", „Ist eine Excel-Tabelle nicht genauso gut?"), die im Dokument nirgends stehen — die Seite hat null `details.frage`. Im Browser gegengeprüft.
**Warum es zählt:** Google verlangt für FAQ-Markup sichtbaren Inhalt auf der Seite. Ein Verstoß kostet das Rich Result und kann eine manuelle Maßnahme gegen die Domain auslösen — die dann alle 28 anderen FAQ-Seiten mitnimmt. Wer über das Snippet kommt, findet die versprochene Antwort nicht.
**Fix:** Einen sichtbaren `<h2>Häufige Fragen</h2>`-Block mit genau diesen beiden `<details class="frage">` vor `HANDLUNG:ABSCHLUSS` einsetzen — die Antworttexte liegen fertig im Schema. Alternativ das FAQPage-Objekt aus dem `@graph` entfernen.
**Befehl:** `/impeccable harden`

### [P0] Sichtbarer Fragetext und Schema-Fragetext driften systematisch auseinander
**Was:** Nur 2 von 28 Seiten sind deckungsgleich. `thw.html:470` „Brauche ich dafür eine Freigabe oder ein Konto?" ↔ `thw.html:592` „Braucht der Einheiten-Erfassungsbogen für das THW eine Freigabe oder ein Konto?". `feuerwehr.html:458` ↔ `:581`. Schwerster Fall: `anleitung.html:542` zeigt „Kann ich einen Bogen später ändern oder wiederverwenden?", das Schema an gleicher Position (`:729`) meldet „Wie sammelt ein Meldekopf mehrere Einheiten?" — eine Frage, die es auf der Seite nicht gibt. Auf 12 Seiten ist die Schnittmenge null.
**Warum es zählt:** Der Nutzer klickt im Suchergebnis auf eine Frage und landet auf einer Seite, auf der sie anders oder gar nicht dasteht — Erwartungsbruch im Moment des Erstkontakts, plus dasselbe Richtlinienrisiko wie oben. Und: die keywordreiche Fassung geht an die Maschine, die schlechtere an den Menschen.
**Fix:** Eine Quelle je Frage/Antwort, aus der beides generiert wird — die JSON-LD-Blöcke entstehen ohnehin in `scripts/content-*.mts`. Wo Keyword-Anreicherung gewünscht ist, gehört sie in den sichtbaren `<h3>`, nicht ins Schema.
**Befehl:** `/impeccable harden`

### [P1] Auf 14 Seiten fehlt die letzte sichtbare Frage im Schema
**Was:** Nachgeprüft und bestätigt: 12 Länderseiten (`katastrophenschutz-*`) plus `bbk.html:386` und `bundeswehr.html:403`. Bei den Länderseiten immer „Was ist mit anderen Bundesländern?", bei den beiden anderen die Träger-Frage — also durchgängig der generierte `LAENDER`-/Träger-Block, den die Schema-Erzeugung nicht mitnimmt.
**Warum es zählt:** Die FAQ hat je nach Zugangsweg einen anderen Umfang, und es fehlt ausgerechnet die Frage, die den internen Verweisgraph aufspannt.
**Fix:** Entweder die generierten Blöcke in die Schema-Erzeugung einbeziehen — oder, besser, diese Frage ganz aus dem FAQ herausnehmen (siehe nächster Punkt).
**Befehl:** `/impeccable harden`

### [P1] Der Länder-Absprung steht als letzte FAQ direkt vor dem Knopf
**Was:** `katastrophenschutz-bayern.html:469-484` und zehn Schwesterseiten: eine `details.frage` mit elf Landeslinks plus Übersichtslink, unmittelbar vor `HANDLUNG:ABSCHLUSS:START` (`:487`).
**Warum es zählt:** Zwölf sichtbare Optionen an einem Entscheidungspunkt, an dem es genau eine geben soll — „Bogen jetzt ausfüllen". Peak-End-Regel: der letzte Eindruck vor der Handlungsaufforderung ist eine Liste von Wegen woanders hin. Davor endet die vorletzte Frage auf „Nein — … nicht amtlich belegt". Die Seite verabschiedet den Leser mit zwei Verneinungen und einer Abbiegung. Wer auf der Bayern-Seite ist, weil er in Bayern ist, braucht die Liste nicht; wer falsch gelandet ist, braucht sie oben.
**Fix:** Die Landesnavigation aus dem FAQ herausziehen — als eigenen Block unterhalb des Abschluss-CTA oder in die vorhandene Fußnavigation. Die FAQ endet dann auf einer beantworteten Sachfrage.
**Befehl:** `/impeccable layout`

### [P1] Die Datenschutzfrage fehlt genau dort, wo die Fallhöhe am größten ist
**Was:** Wo bleiben die Personendaten der Einsatzkräfte? Beantwortet auf `drk.html:392`, `feuerwehr.html:465`, `bundeswehr.html:392`, `dlrg.html:463`, `malteser.html:419`, `asb.html`. Fehlt vollständig auf allen zwölf Länderseiten, auf `katastrophenschutz.html`, `meldekopf.html`, `staerkemeldung-feuerwehr.html` und allen drei Fachgruppenseiten. Auf `meldekopf.html:424-462` — der Seite, auf der jemand die Kräfte *fremder* Einheiten einsammelt — steht im gesamten FAQ kein Wort dazu und kein Link auf die Datenschutzerklärung. Parallel dazu fehlt auf 18 von 28 Seiten im FAQ, dass die App nichts kostet; der Satz steht nur im Kleingedruckten unter dem Knopf.
**Warum es zählt:** Die FAQ ist die Stelle, an der Einwände ausgeräumt werden. Die zwei größten Einwände im Ehrenamt sind „Was kostet das?" und „Was sage ich meinem Datenschutzbeauftragten?" — und beide sind auf der Mehrzahl der Seiten nicht adressiert, obwohl mit `open-source-datenschutz.html` das Material dafür vorliegt.
**Befehl:** `/impeccable clarify`

### [P2] Kein Sprunganker, keine Deep-Links — die FAQ liegt am Ende und ist unerreichbar
**Was:** 1 von 28 Seiten hat `id="haeufige-fragen"` (`anleitung.html:492`, verlinkt von `:331`). 27 FAQ-H2 haben keine ID, keine einzige `details.frage` auf keiner Seite hat eine.
**Warum es zählt:** Diese Seiten sind Sucheinstiege. Wer mit einer konkreten Frage kommt, scrollt an 400 Zeilen vorbei oder springt ab. Und keine Antwort lässt sich einem Kameraden schicken — im Ehrenamt der übliche Weg, wie so ein Werkzeug weitergereicht wird.
**Fix:** `id="haeufige-fragen"` auf jede FAQ-`h2`, sprechende `id` je `details` (`frage-datenschutz`), Sprunglink „Häufige Fragen" in `scripts/content-nav.mts` — das Muster existiert bereits.
**Befehl:** `/impeccable adapt`

## Persona-Red-Flags

**Der Zugführer am Meldekopf** — gibt Personendaten fremder Organisationen in ein Gerät ein, das ihm nicht gehört. `meldekopf.html:424-462` beantwortet Bereitstellungsraum, Internet, Doppelscan, Mehrfach-Einsätze — kein Wort dazu, wo die Namen landen und wer sie löscht, kein Link auf die Datenschutzerklärung im gesamten FAQ. Die Seite mit der höchsten datenschutzrechtlichen Fallhöhe hat die geringste Rückversicherung.

**Der Ortsbeauftragte vor der Einführung** — `thw.html:470` beantwortet „Brauche ich eine Freigabe?" mit „Nein". Technisch richtig, dienstrechtlich zu kurz. Die Frage, die tatsächlich gestellt wird, lautet „Was sage ich meinem Datenschutzbeauftragten?", und darauf gibt es auf keiner Seite eine FAQ-Antwort.

**Der Feuerwehrmann, der über Google auf einer Länderseite landet** — auf `katastrophenschutz-niedersachsen.html` erfährt er in der FAQ nicht, dass die App kostenlos ist, nicht, wo die Daten bleiben, und nicht, ob er ein Konto braucht. Nur, dass die Vorlagen nicht amtlich sind und dass es elf andere Bundesländer gibt.

**Der Nutzer mit Screenreader** — kein Red Flag, sondern das Gegenteil. `<h3>` im `<summary>` macht die Fragen über die Überschriftenliste auffindbar, `tabIndex` 0 nativ, Fokusring gemessen sichtbar (3 px, Offset 2 px, `:focus-visible`). Bewusst so gebaut und im CSS dokumentiert (`thw.html:188-190`).

## Kleinere Beobachtungen

- `.frage` hat nur `border-top` (`thw.html:182`) — kein Abschlussstrich, die letzte Antwort läuft ohne Kante in den CTA.
- Der Marker `+`/`−` in `var(--blau)` (`thw.html:185`) verletzt die Kennfarben-Regel; `var(--zweittext)` wäre der konforme Ton.
- 27 verschiedene H2-Wortlaute auf 28 Seiten, drei konkurrierende Präpositionsmuster. „Häufige Fragen zur FGr R **im Erfassungsbogen**" gegen „Häufige Fragen zur FGr N".
- Antwortlänge Max 604 Zeichen (`katastrophenschutz-nordrhein-westfalen`) gegen Median 253 — ein Ausreißer bei 2,4× Median.
- Alle 28 Seiten öffnen konsequent genau die erste Frage. Die Regel wird eingehalten, ist aber inhaltlich nicht priorisiert: `drk.html:392` öffnet die Datenschutzfrage, `malteser.html:398` öffnet „Passt das PDF zum gewohnten Papierbogen?" und stellt Datenschutz zugeklappt an dritte Stelle — gleiche Zielgruppe, gleiche Sorge, andere Priorität ohne erkennbaren Grund.
- Fragestil konsequent in der Ich-Perspektive des Nutzers („Brauche ich…", „Kann ich…") — bis auf die Schema-Varianten, die in die Produkt-Perspektive kippen. Genau die Wendung, die den Drift verursacht.
- `min-height: 2.75rem` am `summary` (`thw.html:183`) — die Feld-Perspektive stimmt, obwohl diese Seiten am Schreibtisch gelesen werden.
- Zwei `side-tab`-Treffer (`staerkemeldung-feuerwehr.html:46`, `thw-fachgruppe-raeumen-erfassungsbogen.html:58`): `border-left: 4px solid var(--blau)` gegen die Deckzeilen-Regel. Außerhalb der FAQ, aber im selben Blickfeld.

## Fragen zum Nachdenken

1. Wenn dieselbe Frage auf acht Seiten in acht Formulierungen steht — welche ist die richtige, und warum steht die richtige nicht auf allen acht?
2. Die FAQ soll letzte Einwände ausräumen. Warum steht auf 18 von 28 Seiten der wichtigste Einwandkiller — *es kostet nichts* — nicht in der FAQ, aber auf allen 28 im Kleingedruckten unter dem Knopf?
3. Der Schema-Text ist überall länger und keywordreicher als der sichtbare. Wenn die keywordreiche Formulierung besser ist — warum bekommt der Mensch dann die schlechtere?
4. `meldekopf.html` ist die Seite, auf der jemand die Personendaten *fremder* Einheiten einsammelt. Warum ist das die einzige Kategorie ohne Datenschutzfrage?
5. Elf Landeslinks in einer zugeklappten Antwort direkt vor der Handlungsaufforderung: Ist das eine Antwort auf eine häufige Frage — oder Navigation im FAQ-Gewand, weil dort noch Platz war?
6. Warum darf der `+`-Marker die Kennfarbe tragen, wenn die Regel lautet: nur Kopfbalken und Primäraktion?
