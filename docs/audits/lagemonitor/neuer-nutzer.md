# Helfer ohne Einweisung — Lagemonitor (R6-N)

Rolle: THW-Helfer, der den Lagemonitor zum ersten Mal sieht, ohne Handbuch.
Geprüft im Produktionsbuild (Port 4173), Chrome 153; Einsatzansicht bei
1280 × 800, Monitor bei 1920 × 1080. Der Prüfer ging ohne Vorwissen von der
Startseite in den Einsatz „Wattsturm 2026", suchte den Lagemonitor, trug
Funkrufname und Einsatzbeginn („Jetzt") ein, öffnete den Monitor und sah sich
die Zustände „voll" und „leer" mit allen aufklappbaren Bereichen an. Der Monitor
selbst hat keine Eingabefelder, bedienbar sind nur Hell, Vollbild, Schließen.

Urteil: Der Monitor ist optisch eindeutig, die Zeit sofort lesbar. Die Zahlen
und Kürzel bleiben ohne Vorwissen unbeschriftet; aus dem Monitor allein erfährt
man nicht, was „8 / 33 / 152 // 193" bedeutet. Den Weg zu Funkrufname und Beginn
erfährt man nur über die zugeklappten „Einsatzdaten". Die Aufgabe „Monitor
öffnen, Funkrufname und Beginn eintragen" ist nur durch Scrollen bis ans
Seitenende machbar.

## Befunde

### R6-N1 (P1) — Der Lagemonitor ist in der App kaum auffindbar

- Fundstelle: Startseite und Einsatzansicht (1280 × 800).
- Beobachtung: Auf der Startseite kommt weder „Lagemonitor" noch „Fernseher"
  vor (Textsuche negativ). In der Einsatzansicht steht der Block „Lagemonitor
  für den Fernseher" ganz unten, bei y ≈ 3341 von 4826 px Seitenhöhe, hinter
  16 Einheitenkarten und zwischen „Einsatz weitergeben / sichern" und den
  CSV/Excel-Exporten. Ein Hinweis oder Knopf weiter oben fehlt.
- Folge: Ein Helfer, der den Monitor nicht kennt, sucht lange oder gibt auf. Je
  mehr Einheiten erfasst sind, desto weiter unten liegt der Block, genau dann
  braucht man den Monitor.
- Empfehlung: Einen Einstieg („Lage auf Fernseher anzeigen") oben in der
  Einsatzansicht, der zum Block springt oder den Monitor öffnet.
- Nachprüfung: Mit 16 Einheiten bei 1280 × 800 ohne Scrollen den Einstieg finden.

### R6-N2 (P1) — Die Stärkezeile ist unbeschriftet

- Fundstelle: Monitor, Zeile 4 „8 / 33 / 152 // 193".
- Beobachtung: Keine Beschriftung, keine Legende F/U/M; die Tabelle trägt nur
  „F U M" als Spaltenköpfe, ebenfalls ohne Erklärung. Die Unterstreichung der
  Gesamtzahl erklärt nichts, „Einsatzdaten" nennt die Stärke nicht, die
  Tabelle hat keine Summenzeile.
- Folge: Ein Helfer rät „Fahrzeuge? Gruppen? Zugstärke?", F kann er mit
  „Fahrzeug" verwechseln. Die wichtigste Zahl am Fernseher wird falsch gelesen.
  Annahme: Führungskräfte kennen die Schreibweise F/U/M, Mitfahrende im MTW
  nicht unbedingt.
- Empfehlung: Kleinzeile oder Legende „Führer / Unterführer / Mannschaft //
  gesamt" und eine Summenzeile in der Tabelle.
- Nachprüfung: Einen Laien am Monitor fragen, was die Zahlen bedeuten, ohne dass
  er das Hauptfenster sieht.

### R6-N3 (P2) — Hinweise zum Eintragen stehen nur zugeklappt und mit einem Begriff, den die App nicht benutzt

- Fundstelle: Monitor, „Einsatzdaten", Einsatz „leer", 1920 × 1080.
- Beobachtung: Die Hauptzeile zeigt „Einsatzbeginn nicht gesetzt" ohne Hinweis;
  erst „Einsatzdaten" aufgeklappt sagt „nicht gesetzt (in der Einsatzansicht
  einstellen)". „Einsatzansicht" kommt als Bezeichnung in der App nirgends vor.
- Folge: Der Helfer probiert am Monitor herum, findet den Weg nicht oder
  schließt den Monitor.
- Empfehlung: Kurzer Hinweis direkt unter der Zeile („im Hauptfenster beim
  Einsatz eintragen") oder eine verständlichere Bezeichnung.
- Nachprüfung: Monitor „leer" öffnen und fragen, wo man den Beginn setzt.

### R6-N4 (P2) — Zwei Namen untereinander, ohne Beschriftung

- Fundstelle: Monitor, Zeilen 1 und 2.
- Beobachtung: Oben „Salus Übungsleitung" (Funkrufname), darunter „Wattsturm
  2026" (Einsatzname); der Monitor sagt nicht, welche Zeile was ist. Ohne
  Funkrufnamen steht der Einsatzname allein oben.
- Folge: Die oberste Zeile wechselt je nach Pflege ihre Bedeutung; wer den
  Fernseher liest, kann das nicht wissen.
- Empfehlung: Beschriftung oder unterschiedliche Gestaltung; die
  Funkrufname-Zeile bei fehlendem Namen erkennbar leer lassen.
- Nachprüfung: Monitor „voll" und „leer" nebeneinander ansehen.

### R6-N5 (P2) — Bedienelemente im Block der Einsatzansicht teils mehrdeutig

- Fundstelle: Block „Lagemonitor für den Fernseher".
- Beobachtung: Neben dem Einsatzbeginn steht „Löschen", wenige Zeilen weiter
  unten „Einsatz löschen…"; man kann nicht ableiten, ob „Löschen" nur den Beginn
  betrifft. „Jetzt" überschrieb den vorhandenen Beginn (6 h 27 min zurück)
  sofort ohne Rückfrage, die Dauer sprang auf „0 Stunden, 0 Minuten". Das
  Funkrufname-Feld bestätigt das Speichern nicht (der Monitor zeigte den Namen
  aber sofort). Das Beginn-Feld zeigte in der Prüfumgebung US-Format
  („10/18/2026, 01:43 AM"), vermutlich Umgebungsbesonderheit, für deutsche
  Geräte nicht belegt.
- Folge: Ein versehentlicher Klick auf „Jetzt" setzt die Einsatzdauer am
  Fernseher falsch, bis jemand es merkt.
- Empfehlung: „Löschen" eindeutig beschriften („Beginn entfernen"); beim
  Überschreiben den alten Wert zeigen oder zurücknehmbar machen.
- Nachprüfung: Beginn setzen, „Jetzt" klicken, prüfen, ob der Vorwert erkennbar
  ist.

### R6-N6 (P3) — Zeitangabe und Tabellenköpfe ohne Wissen schwer lesbar

- Fundstelle: Monitor, DTG „18 0810 okt 26" und Tabelle.
- Beobachtung: Keine Beschriftung „Datum/Uhrzeit", die Reihenfolge Tag,
  Uhrzeit, Monat, Jahr fällt erst beim Hinsehen auf („okt 26" kann nach
  „Oktober 2026" oder „26. Oktober" aussehen). „Orga" ist abgekürzt, „Feuerwehr"
  und „Einheitentyp" brechen mitten im Wort um. Der Funkrufname einer Einheit
  stammt vom ersten Fahrzeug (bewusste Entscheidung), viele Zeilen zeigen „–",
  „21/10" in den Rufnamen ist unerklärt. „Hell" nennt die Aktion, nicht den
  Zustand.
- Folge: Kleine Hürden, keine falsche Entscheidung. Die DTG-Schreibweise dürfte
  THW-Führungskräften geläufig sein (Annahme).
- Empfehlung: Spaltenbreiten so, dass nichts mitten im Wort bricht; „Orga"
  ausschreiben; die Rufnamen-Spalte erklären.
- Nachprüfung: „voll" bei 1920 × 1080 und 1366 × 768 auf Wortumbrüche prüfen.

## Was gut ist

- Die Zeit ist aus der Entfernung sofort lesbar, groß und rot.
- Der Hinweistext im Block erklärt „zweites Fenster, HDMI, erweiterter
  Bildschirm, ohne Personennamen" verständlich.
- Ohne Einheiten zeigt der Monitor „Noch keine Einheit gemeldet." und
  „Einsatzbeginn nicht gesetzt" statt leer zu bleiben.
- Funkrufname und Beginn werden vom Monitor sofort übernommen.
- Alle Bereiche sind zu Beginn zugeklappt, der Fernseher zeigt nur das Wichtige.

## Zählung

| P0 | P1 | P2 | P3 |
| --- | --- | --- | --- |
| 0 | 2 | 3 | 1 |

Fremde Hilfe nötig: ja, um die Bedeutung der Stärkezeile (F/U/M, „//") zu erfahren.
Größtes Einsatzrisiko: Ein Laie liest die Stärkezahlen am Fernseher falsch oder
gar nicht und trifft darauf Entscheidungen. Wichtigster nächster Schritt:
Stärkezeile beschriften und einen leicht auffindbaren Einstieg zum Lagemonitor
oben in der Einsatzansicht schaffen.
