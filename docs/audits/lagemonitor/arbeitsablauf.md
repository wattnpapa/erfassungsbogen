# Arbeitsablauf — Lagemonitor (R6-W)

Rolle: Prüfer für vollständige Abläufe statt einzelner Bildschirme (Einsatz
anlegen, Fernseher einrichten, Einheiten erfassen, abrücken, ablegen,
übergeben). Geprüft im Produktionsbuild (Port 4173), Chrome 153 (Playwright,
Service Worker blockiert), Monitor 1920 × 1080, Einsatzansicht 1280 × 800, zwei
Fenster in einem Kontext; ein zweites „Gerät" war ein frischer Kontext.

Erwartete Arbeitsfolge (Annahme): Einsatz anlegen, Fernseher einrichten
(Funkrufname, Beginn, Monitor öffnen), Einheiten laufend erfassen, Abrückende
abmelden, Einsatz bei Wechsel oder Ende ablegen, gegebenenfalls an ein zweites
Gerät übergeben.

Nachgestellt: Einsatz „Sturm Ost" mit Ort angelegt, Monitor geöffnet,
Funkrufname und Beginn gesetzt; zwei Einheiten per „Einheit manuell erfassen"
aufgenommen (eine mit Fahrzeug mit Funkrufname), eine abgerückt und wieder
anwesend gesetzt; Beginn mehrfach geändert (Vergangenheit, Zukunft, 3 und 48
Tage); Einsatz gewechselt, gelöscht und per Rückgängig zurückgeholt; Einsatz als
Sammel-PDF exportiert, in einem zweiten Kontext importiert und dort erneut
importiert.

Urteil: Der Hauptablauf trägt. Der Monitor folgt dem Hauptfenster innerhalb von
etwa 0,3 s (storage-Ereignis), nicht erst nach 5 s, bei Aufnahme, Abrücken,
Wiederanwesend, Funkrufname und Beginn; Löschen und Rückgängig werden sauber
gespiegelt. Reibung entsteht an den Rändern: Übergabe auf ein zweites Gerät,
Funkrufname je Einsatz, und der Fernseher sagt nicht, wofür er gerade zeigt.

## Befunde

### R6-W1 (P1) — Übergabe an ein zweites Gerät verliert Funkrufname und Einsatzbeginn

- Fundstelle: „Einsatz weitergeben / sichern" (Sammel-PDF) auf Gerät 1, „Einsatz
  importieren…" auf Gerät 2, dann Lagemonitor.
- Beobachtung: Der Import übernahm Einsatz und 16 Einheiten („Einsatz „Wattsturm
  2026" übernommen: 16 Einheiten, davon 16 anwesend"). Auf Gerät 2 waren
  Funkrufname- und Beginn-Feld leer, `eeb.lagefunkruf.v1` und `eeb.lagebeginn.v1`
  waren `null`. Der Monitor von Gerät 2 zeigte „Wattsturm 2026" ohne Funkrufnamen
  und mit „Einsatzbeginn nicht gesetzt"; Gerät 1 hatte „Salus Übungsleitung" und
  6 Stunden 27 Minuten. Der Text zur Übergabe verspricht „allen Meldungen, Zeiten,
  Historie und Zügen" und nennt diese beiden Angaben nicht. Der erneute Import
  auf Gerät 2 ist unschädlich („keine neue Einheit") und überschreibt nichts.
- Folge: Bei Ablösung oder Zweitgerät steht am zweiten Fernseher still die falsche
  Lage: Der Einsatzdauer-Zähler verschwindet, die Führungsstelle ist anonym.
  Niemand merkt es, bis jemand hinschaut; die Einsatzdauer ist bei Schichtwechsel
  die wichtigste Angabe.
- Empfehlung: Beide Angaben in die Übergabedatei aufnehmen; mindestens nach dem
  Import den Hinweis „Funkrufname und Einsatzbeginn wurden nicht mit übergeben,
  bitte eintragen" zeigen.
- Nachprüfung: Export, Import in frischem Kontext, Monitor öffnen; Funkrufname und
  Dauer sind dieselben wie am Quellgerät.

### R6-W2 (P2) — Der Funkrufname muss je Einsatz neu getippt werden

- Fundstelle: Einsatzansicht, Block „Lagemonitor für den Fernseher".
- Beobachtung: Der Funkrufname der Führungsstelle ist je Einsatz-Kennung
  gespeichert. In „Hochwasser Süd" waren Funkrufname und Beginn leer, obwohl in
  „Wattsturm" „Salus Übungsleitung" stand. Beim Anlegen eines neuen Einsatzes wird
  weder gefragt noch vorbelegt; nach dem Anlegen bleibt man auf der Startseite und
  muss den Einsatz erst öffnen.
- Folge: Derselbe Funkrufname (die Führungsstelle ändert sich in einer Lage nicht)
  wird bei jedem neuen Einsatz, jeder Übung, jedem Folgetag wieder eingetragen;
  wer es vergisst, hat am Fernseher keine Zeile 1.
- Empfehlung: Den zuletzt benutzten Funkrufnamen als Vorschlag anbieten oder einen
  Standardwert je Gerät; alternativ das Feld schon im Dialog „Neue
  Einsatz-Sammlung" anbieten.
- Nachprüfung: Zwei Einsätze nacheinander anlegen; der zweite verlangt den
  Funkrufnamen nicht erneut.

### R6-W3 (P2) — Das Hauptfenster zeigt nicht, welcher Einsatz am Fernseher läuft

- Fundstelle: Einsatzansicht und Startseite bei geöffnetem Monitor.
- Beobachtung: Der Monitor bleibt fest an der Einsatz-Kennung. Wechselt man im
  Hauptfenster von „Wattsturm 2026" zu „Hochwasser Süd", zeigt der Fernseher weiter
  Wattsturm, auch nach über 5 s. Das ist folgerichtig, aber nirgends im Hauptfenster
  steht ein Hinweis wie „Fernseher zeigt: Wattsturm 2026"; der Block taucht nur in
  der Einsatzansicht des jeweiligen Einsatzes auf, und „Lagemonitor öffnen" nennt
  kein Ziel. Ein zweiter Klick öffnet kein doppeltes Fenster, sondern nutzt das
  bestehende (geprüft); ob dabei zum neuen Einsatz gewechselt wird, wurde nicht
  gesondert geprüft.
- Folge: Wer in der Hektik einen neuen Einsatz öffnet und Einheiten erfasst, glaubt,
  der Fernseher zeige sie; dort steht ein alter Stand, unbemerkt.
- Empfehlung: Am Monitor und im Hauptfenster einen deutlichen Hinweis auf das Ziel,
  z. B. einen Warnstreifen, wenn die Einsatzansicht nicht zum Monitor passt.
- Nachprüfung: Monitor öffnen, im Hauptfenster einen anderen Einsatz öffnen, Einheit
  erfassen; das Hauptfenster zeigt den Unterschied.

### R6-W4 (P2) — „Alle abgerückt" ist am Fernseher nicht von „nichts gemeldet" zu unterscheiden

- Fundstelle: Monitor, aufgeklappte Einheitentabelle und Stärkezeile.
- Beobachtung: Mit einer abgerückten und einer verbleibenden Einheit sinkt die
  Stärke von 1/3/9 // 13 auf 1/1/2 // 4, die Zeile verschwindet aus der Tabelle
  (richtig). Nach dem Abrücken der letzten Einheit zeigt der Monitor „0 / 0 / 0 // 0"
  und „Noch keine Einheit gemeldet." — derselbe Text wie bei einem Einsatz ohne
  jede Meldung.
- Folge: Unter Zeitdruck lassen sich „nie jemand da gewesen" und „alle schon weg"
  nicht auseinanderhalten; die Einsatzdauer läuft weiter, die Stärke ist 0.
- Empfehlung: Bei einem Stand ohne Anwesende, aber mit Meldungen: „Alle Einheiten
  abgerückt", eventuell mit Anzahl; Abgerückte können sonst bewusst aus der
  Tabelle bleiben.
- Nachprüfung: Eine Einheit aufnehmen und abrücken; der Monitor unterscheidet das
  von einem leeren Einsatz.

### R6-W5 (P3) — „Einsatz beginnt noch" blitzt bis zu 5 s nach „Jetzt"

- Fundstelle: Einsatzansicht, Knopf „Jetzt", Monitor, Zeile Einsatzdauer.
- Beobachtung: 100 ms nach „Jetzt" zeigt der Monitor „Einsatz beginnt noch", nach
  6 s „0 Stunden, 0 Minuten", nach 1 min „0 Stunden, 1 Minute". Der Monitor rechnet
  mit seiner Uhr vom letzten Takt; der gesetzte Beginn liegt einen Augenblick „in der
  Zukunft". Für einen echten zukünftigen Beginn (2026-10-19) ist der Text richtig.
  „3 Tage, 0 Stunden, 17 Minuten" und „47 Tage, 0 Stunden, 17 Minuten" werden
  richtig gezeigt.
- Folge: Ein kurzer, irritierender Falschtext, genau dann, wenn jemand am Fernseher
  prüft, ob seine Eingabe angekommen ist.
- Empfehlung: Einen Beginn bis zu wenigen Sekunden in der Zukunft als „0 Minuten"
  behandeln.
- Nachprüfung: „Jetzt" drücken, Monitor sofort ansehen.

### R6-W6 (P3) — Einsatzname und Ort sind nach dem Anlegen nicht änderbar

- Fundstelle: Dialog „Neue Einsatz-Sammlung anlegen" und Einsatzansicht.
- Beobachtung: In der Einsatzansicht gibt es nur „ändern" für Eintreffzeiten,
  keinen Knopf zum Umbenennen oder zum Bearbeiten von Art und Ort (im Code sind nur
  Vorlagen umbenennbar). Der Name steht als Zeile 2 am Fernseher; der Monitor zeigt
  „Einsatz · Deich 3" unter „Einsatzdaten".
- Folge: Ein Tippfehler im Namen oder ein später präzisierter Ort steht für die
  gesamte Lage auf dem Fernseher; Abhilfe nur durch Neuanlegen und Import.
- Empfehlung: Umbenennen und Ort ändern in der Einsatzansicht.
- Nachprüfung: Einsatz anlegen, Namen ändern, Monitor prüfen.

### R6-W7 (P3) — Abrücken ohne Bestätigung, nur mit Rückgängig-Hinweis

- Fundstelle: Einheitenkarte, Knopf „Abrücken".
- Beobachtung: Kein Dialog; es erscheint „Abgerückt 08:16: Nr. 2 …" mit Rückgängig,
  und der Monitor ändert sofort die Stärke. Die Meldung überdeckte im
  1280 × 800-Fenster teilweise die darunterliegende Karte.
- Folge: Eine Fehlbedienung ändert sofort die Stärkezeile am Fernseher; durch
  Rückgängig und „Wieder anwesend" (beides geprüft) gut aufgefangen.
- Empfehlung: So belassen; nur prüfen, dass die Rückgängig-Meldung lange genug
  steht und nichts Bedienbares verdeckt.

Nicht geprüft oder Annahme: Das Ziehen des Fensters auf einen zweiten Bildschirm
und echte Mehrbildschirm-Fensterverwaltung; die Tastatureingabe in das
Datum/Uhrzeit-Feld (Playwright-Locale en-US mit AM/PM, der Tippversuch blieb
leer, kein Befund). „Schichtwechsel" wurde als Wechsel der Bedienperson bei
laufendem Einsatz verstanden (Annahme): Beginn und Funkrufname bleiben am Gerät
erhalten, die Software kennt aber keine Schicht, keinen Bearbeiter und keine
Übergabenotiz — kein Defekt, aber auch keine Hilfe. Die Dialog-Knöpfe („Einsatz
anlegen") reagieren in den ersten Sekunden bewusst nicht (Prellschutz); das war
kein Fehler, sondern ein zu schnelles Skript.

## Was gut ist

- Aktualisierung in etwa 0,3 s bei Aufnahme, Abrücken, Wiederanwesend,
  Funkrufname (je Tastendruck) und Beginn, ohne Neuladen.
- Löschen des angezeigten Einsatzes: Der Monitor zeigt groß „Dieser Einsatz ist auf
  diesem Gerät nicht (mehr) vorhanden." mit „Schließen"; mit Rückgängig oder
  Papierkorb kehrt er ohne Zutun mit allen Daten zurück.
- „Lagemonitor öffnen" öffnet bei erneutem Klick kein zweites Fenster.
- Die Einsatzdauer rechnet über Tage und zeigt einen künftigen Beginn ehrlich an.
- Der Re-Import desselben Einsatzes ist idempotent („keine neue Einheit").
- Der Funkrufname der Einheit entsteht aus Kennwort, Ort und Kennzahl („Heros
  Jever 1/1"); eine Einheit ohne Fahrzeug mit Funkrufnamen zeigt „–". Die
  Einsatzdaten im Monitor weisen auf die Einsatzansicht als Eingabeort hin.

## Zählung

| P0 | P1 | P2 | P3 |
| --- | --- | --- | --- |
| 0 | 1 | 3 | 3 |

Größtes Einsatzrisiko: Ein Fernseher zeigt unbemerkt einen anderen Einsatz oder
eine unvollständige Übergabe (ohne Einsatzbeginn), weil das Hauptfenster das nicht
anzeigt. Wichtigster nächster Schritt: Funkrufname und Einsatzbeginn in die
Übergabedatei aufnehmen (R6-W1), danach den Funkrufnamen für neue Einsätze
vorschlagen (R6-W2).
