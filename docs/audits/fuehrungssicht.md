# Audit „Führungssicht" (Lage erfassen, Abweichungen sehen, Stand übergeben)

Stand: 27.09.2026 · Prüfer: Rollenaudit `thw-command-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite build` + `vite preview`),
Zweig `claude/thw-reviewer-skills-dr76q1`, Commit `841dade`.

Reiner Prüfbericht, keine Codeänderung.

## Prüfaufbau

Chromium (Playwright), Tablet 820 × 1180 und Telefon 360 × 640, de-DE.
Sammlung „Hochwasser Neckar · BR Sporthalle Rottenburg" mit acht Einheiten
aus den THW-Beispielbögen: drei im 1. Zug, drei im 2. Zug, zwei ohne Zug;
eine abgerückt, eine als Übung gekennzeichnet, eine manuell erfasst; eine
mit Ruhezeit und Unterbringung angefordert, eine mit 400 l Diesel; eine
mit Folgemeldung (4 → 3). Geprüft aus Sicht der Führungskraft, die die
Sammlung übernimmt: Was ist da, was ist neu, wer braucht was, was fehlt,
wo kommt eine Meldung her, und was gebe ich der Ablösung.

Annahmen: Die Führungsstelle braucht je Einheit Eintreffzeit, Status,
offenen Bedarf und den Auftrag, den sie der Einheit gegeben hat; eine
Ablösung übernimmt ohne mündliche Erklärung.

## Urteil

Die erste Frage — wie stark bin ich? — beantwortet die Ansicht auf einen
Blick: 6 Einheiten, 2 / 13 / 38 / 53, Bedarf gesamt, Zwischensummen je Zug,
und die Übung ist ausgenommen und als solche benannt. Die zweite Frage —
wer braucht jetzt was? — beantwortet sie nicht: Ruhezeit „3×" und
Unterbringung „2× angefordert" stehen nur als Summe, keine Karte und keine
Tabellenspalte sagt, welche Einheit. Die dritte Frage — seit wann ist wer
da? — hat keine Antwort auf der Karte: Dort steht der Stand des Absenders,
nicht die Eintreffzeit, und Abrückzeiten gibt es nicht. Abweichungen
zwischen Meldungen (Stärke 4 → 3) sind dagegen sofort sichtbar, Herkunft und
Signatur stehen an jeder Karte. Die Übergabe an die Ablösung geht per
Datei, mit den im Arbeitsablauf- und Analog-Audit benannten Lücken.

## Befunde

### K1 [P1] Bedarf und Sofortbedarf nur als Summe — welche Einheit, steht nirgends

Fundstelle: Einsatzansicht, Block „Bedarf (anwesende Einheiten)" („Ruhezeit:
3×", „Unterbringung … 2× angefordert", „Diesel 700 l"); Karten der
Einheiten (Zeile „THW · Stärke 0 / 3 / 9 / 12 · Stand 161923jul26 · Scan");
Tabelle (Spalten Stärke, Verpflegung, Unterbringung M/W/D, Kraftstoff,
Kfz, Stand).
Beobachtung: Um zu sehen, wer Ruhezeit braucht, wer Unterbringung
angefordert hat oder wer die 400 l Diesel meldet, muss man je Karte
„Details" öffnen — bei acht Einheiten acht Mal, bei 30 dreißig Mal. Die
Tabelle hat keine Spalte für Ruhezeit, Unterbringung angefordert oder
„Sofortbedarf ja/nein"; der Freitext „Sonstiges" der Bögen taucht nur in
den Details auf.
Erwartung der Rolle: Was eine Einheit sofort braucht, steht auf ihrer
Karte — als kurze Marke („Ruhezeit", „Unterbringung", „400 l Diesel") —
und in der Tabelle als Spalte, damit ich sortieren kann: „wer schläft
zuerst?".
Auswirkung im Einsatz: Der Bedarf wird als Summe an die Logistik gemeldet,
ohne Zuordnung; Ruhezeiten werden vergessen, weil sie nur in Details
stehen. Die Führungskraft führt die Zuordnung nebenbei auf Papier.
Empfehlung: Bedarfsmarken auf der Karte (nur wenn gesetzt, damit nichts
alarmiert, was leer ist), Spalte „Sofortbedarf" in der Tabelle, Filter
„nur mit offenem Bedarf".
Verifikation: Sammlung mit einer Einheit mit Ruhezeit — ohne Details zu
öffnen muss erkennbar sein, welche.

### K2 [P1] Kein Zeitbezug je Einheit: Stand statt Eintreffzeit, nichts für Abrücken, nichts für „neu"

Fundstelle: Karten („Stand 170805jul26") und Tabelle (Spalte „Stand");
Sortierung „Eintreffzeit (neueste zuerst)".
Beobachtung: Die einzige Zeit auf Karte und Tabelle ist der Stand des
Absenders in Datum-Zeit-Gruppe — der Zeitpunkt, zu dem die Einheit ihren
Bogen zuletzt geändert hat, hier ein Datum aus dem Juli in einer
September-Lage, ohne Hinweis auf das Alter. Wann die Meldung am Meldekopf
eingetroffen ist, steht nirgends, obwohl die App den Wert hat (Sortierung
nach Eintreffzeit funktioniert, zeigt aber keine Zahl). Wann eine Einheit
abgerückt ist, wird nicht gespeichert (Arbeitsablauf-Audit W3). Eine
Meldung, die vor vier Minuten kam, sieht aus wie eine von vor sechs
Stunden; nichts ist als „neu seit Schichtbeginn" markiert.
Erwartung der Rolle: „eingetroffen 09:40", „Folgemeldung 13:52",
„abgerückt 15:10" — und ein Blick, was seit meiner Übernahme dazukam.
Auswirkung im Einsatz: Die Übersicht taugt nicht für Einsatztagebuch und
Abrechnung; die Ablösung kann Reihenfolge und Dauer der Anwesenheiten
nicht nachvollziehen; ein monatealter Stand fällt nicht auf.
Empfehlung: Eintreffzeit auf Karte und in Tabelle (Uhrzeit, bei anderem
Tag mit Datum), Abrückzeit dazu; „neu" für Meldungen jünger als eine
wählbare Zeit oder seit dem letzten Öffnen; Stand nur als Zusatz, mit
Warnung, wenn er älter als der Einsatz ist.
Verifikation: Sammlung öffnen — für jede Einheit müssen Eintreffzeit und,
falls abgerückt, Abrückzeit ohne Tipp lesbar sein.

### K3 [P2] Lücken und Unbestätigtes einer Meldung sind auf der Karte unsichtbar

Fundstelle: Karten der Einheiten; Herkunftszeile („Scan · ✓ signiert …" /
„Manuell").
Beobachtung: Herkunft und Signatur stehen an jeder Karte — das ist gut.
Aber ob ein Bogen lückenhaft ist (keine Rufnummer, Stärke ohne
Namensliste, Auftrag leer, Verpflegung weicht von Stärke ab — alles Dinge,
die die App der Einheit selbst als „offene Punkte" zeigt), erkennt der
Meldekopf auf der Karte nicht; in den Details stehen die Werte, aber ohne
die Prüfliste. Bei „Manuell" fehlt, wer es eingetragen hat (kein
Bearbeiter, keine Absenderangabe möglich).
Nachweis: beobachtet für Herkunft/Signatur; die fehlende Lückenanzeige ist
aus den Karten abgeleitet (plausible Risikostelle, mit lückenhaftem Bogen
nicht eigens getestet).
Erwartung der Rolle: Eine Meldung ohne Rückrufnummer oder ohne Namen ist
„unbestätigt" und trägt ein Zeichen, damit ich nachfrage, solange die
Einheit noch vor mir steht.
Auswirkung im Einsatz: Die Lücke fällt auf, wenn man anrufen will — dann
ist die Einheit im Gelände.
Empfehlung: Die offenen Punkte des Bogens als kleine Marke auf die Karte
(„2 Lücken: keine Rufnummer, kein Auftrag") und als Filter; bei manueller
Erfassung ein Feld „erfasst von".
Verifikation: Bogen ohne Rufnummer scannen — die Karte muss es zeigen.

### K4 [P2] Drei Zahlen für „wie viele Einheiten"

Fundstelle: Kopfzahl „6 Einheiten", Listenüberschrift „Einheiten (8)",
Tabellen-Summenzeile „Summe (7 anwesend)".
Beobachtung: 8 gemeldete Einheiten, davon 1 abgerückt und 1 Übung. Die
Kopfzahl zählt 6 (ohne Abgerückte, ohne Übung), die Summenzeile nennt „7
anwesend" (die Übung als anwesend gezählt), rechnet aber die Stärke 53 —
also ohne die Übung. Die Übungsmeldung wird oben erklärt, gut; die
Summenzeile widerspricht ihr trotzdem.
Erwartung der Rolle: Eine Zahl für „anwesend und zählend", eine für
„gemeldet insgesamt", beide beschriftet.
Auswirkung im Einsatz: Bei der Weitermeldung an die nächste Ebene wird
die falsche Zahl abgelesen; drei Zahlen kosten Nachrechnen.
Empfehlung: Summenzeile „Summe (6 zählend · 1 Übung · 1 abgerückt)";
Kopfzahl mit derselben Erklärung als Tooltip/Untertitel.
Verifikation: Sammlung mit Übung und Abgerückter — alle Zahlen müssen
dieselbe Zählweise nennen.

### K5 [P2] Kein Platz für den Auftrag, den die Führungsstelle einer Einheit gibt

Fundstelle: Karte und Details einer Einheit; „Zug zuordnen", „Aufteilen".
Beobachtung: Zu einer Einheit lässt sich ein Zug, eine Teil-Bezeichnung
und der Status setzen; einen Auftrag („Deichabschnitt Nord ab 14:00"),
eine Notiz („Rückruf 15:00 wegen Pumpe") oder einen Einsatzort der
Führungsstelle gibt es nicht. Der „Ort / Auftrag" in den Details ist der,
den die Einheit selbst gemeldet hat.
Erwartung der Rolle (Annahme über den Ablauf): „Wer macht was?" ist die
Frage nach dem vergebenen Auftrag, nicht nach dem gemeldeten.
Auswirkung im Einsatz: Die Zuteilung steht auf dem Whiteboard, die Stärke
im Tablet; die Ablösung braucht beides und eine mündliche Erklärung.
Empfehlung: Ein Freitextfeld „Auftrag / Notiz der Führungsstelle" je
Einheit, sichtbar auf der Karte, in der Tabelle und im Übergabeblatt.
Verifikation: Auftrag eintragen, Sammlung auf Gerät C importieren — der
Auftrag muss dort stehen.

### K6 [P3] Der Einstieg in die Liste liegt auf dem Tablet unter dem Falz

Fundstelle: Einsatzansicht, Tablet 820 × 1180: Übungshinweis, Kopfzahlen,
Bedarf, Zwischensummen, zwei Knopfreihen — die erste Einheit beginnt bei
etwa 1 750 px.
Beobachtung: Die Summen sind die richtige Überschrift, die Zwischensummen
je Zug nehmen aber allein 450 px; die Qualifikationsliste des Filters
mischt Funktionen (BoFü, Masch. Pumpen) mit Fahrerlaubnisklassen (AM, B,
BE, C, C1, C1E, CE — je „52").
Erwartung der Rolle: Summen kompakt, Liste sofort; im Filter die Frage
„wer kann was?" ohne Fahrerlaubnis-Rauschen.
Auswirkung im Einsatz: Ein Wisch mehr pro Blick, ein längerer Filter;
gering.
Empfehlung: Zwischensummen einklappbar; Filter in zwei Gruppen
(Funktionen / Fahrerlaubnis).
Verifikation: Erste Einheit auf dem Tablet ohne Wischen sichtbar.

## Was gut funktioniert und erhalten bleiben sollte

Kopfzahlen 6 · 2 / 13 / 38 / 53 und Bedarf gesamt sind in zwei Sekunden
gelesen; Zwischensummen je Zug beantworten „was hat der 1. Zug?".

Die Übung ist ausgenommen und benannt („1 Übungsmeldung zählt nicht in
diese Lage (THW Karlsruhe …). Die Summen unten sind ohne sie gerechnet."),
in der Liste als „ÜBUNG" markiert; Abgerückte sind durchgestrichen und
beschriftet.

Abweichungen: „seit 170805jul26: Stärke 4 → 3" direkt auf der Karte,
„Änderungen" und „Historie (2)" dahinter — genau das, was die Ablösung
braucht.

Herkunft: „Scan · ✓ signiert 937e 7f4f …" bzw. „Manuell" an jeder Karte;
eine bekannte Kurzform lässt sich vergleichen.

Suche, Sortierung (Name, Eintreffzeit, Zug, Organisation) und der
Qualifikationsfilter („BoFü (4)") beantworten „wer kann was?" in einem
Tipp; Tabelle mit Summenzeile und Sortierung per Spaltenkopf.

Details öffnen inline und schließen mit „Details schließen" — die Liste
bleibt an Ort und Stelle; die Orientierung geht nicht verloren.

Übergabe: Sammel-PDF mit eingebetteter Sammlung, Import auf dem nächsten
Gerät mit Status und Historie (Lücken in W2, A1).

## Abschluss

- Aufgabe geschafft: mit Umwegen — Stärke ja, Bedarf je Einheit und
  Zeiten nur über Details oder gar nicht.
- Fremde Hilfe nötig: nein für den Stand, ja für die Übergabe (Aufträge
  und Zeiten müssen mündlich mitgegeben werden).
- Größtes Missverständnis: „Stand" auf der Karte wird als Eintreffzeit
  gelesen — es ist der Bearbeitungsstand des Absenders.
- Größtes Einsatzrisiko: Sofortbedarf (Ruhezeit, Unterbringung) ist nur als
  Summe sichtbar; welche Einheit ihn hat, geht in der Liste unter.
- Top-Priorität für die nächste Iteration: Bedarfsmarken und Eintreff-/
  Abrückzeit auf Karte, Tabelle und Übergabeblatt (K1, K2).
