# Audit „Stress und Unterbrechung" (Zeitdruck, Ablenkung, Wiedereinstieg)

Stand: 27.09.2026 · Prüfer: Rollenaudit `thw-stress-test-user` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite build` + `vite preview`),
Zweig `claude/thw-reviewer-skills-dr76q1`, Commit `17f72ce`.

Reiner Prüfbericht, keine Codeänderung. Baut auf den vorigen Audits auf;
Befunde, die dort schon stehen, werden hier nur als Stressfalle
eingeordnet und verwiesen, nicht wiederholt.

## Prüfaufbau

Chromium (Playwright), 360 × 640, `isMobile`/`hasTouch`, de-DE. Rolle: ein
Gruppenführer, der zwischen Fahrzeug, Funk und Meldekopf zehn Sekunden für
jeden Bildschirm hat; am Meldekopf ein Helfer, bei dem drei Einheiten
gleichzeitig ankommen. Gemessen: Tipps und Wörter auf dem schnellsten Weg
(Vorlage → Übergabe), Wortmengen der Dialoge, Verhalten bei Unterbrechung
(Neuladen, Rausgehen) mitten im Scannen, mitten in Inline-Formularen
(Zug zuordnen), bei gesetztem Suchfilter, beim doppelten Scan derselben
Einheit im Stapelbetrieb.

Nicht prüfbar: echter Lärm, echte Unterbrechung durch Personen; das
Ergebnis stützt sich auf Zustände, die nach einer Unterbrechung sichtbar
sind, und auf die Zahl der Entscheidungen, die ein Bildschirm verlangt.

## Urteil

Der Schnellweg ist schnell: Aus einer gespeicherten Vorlage sind es fünf
Tipps bis zum Vollbild-QR, die Vorbereitung ist eine Ankreuzliste („Einsatz
starten · 4 Pers · 2 Fz"), der neue Bogen trägt weder alten Auftrag noch
altes Datum. Der Stapelbetrieb am Meldekopf quittiert jede Aufnahme im
Scanner und bleibt bereit („1 Bogen in diesem Durchgang. Nächsten Bogen
zeigen…"). Jede Unterbrechung im Assistenten kostet nichts, weil der
Entwurf bei jedem Tastendruck gesichert ist. Die Stressfallen liegen
woanders: Ein zweiter Scan derselben Einheit — der Reflex, wenn man sich
nicht sicher ist — wirft mitten im Stapel einen Dialog mit zwei
Fachantworten auf; nach einer Unterbrechung landet der Meldekopf auf der
Startseite, wo oben ein fremder Bogen als „mein Bogen" mit „Verwerfen"
steht; und mehrere Bedienelemente laden unter Zeitdruck zur plausiblen,
aber falschen Aktion ein (Liste unten).

## Befunde

### S1 [P1] Stapelbetrieb: der zweite Scan derselben Einheit stoppt mit einer Fachfrage

Fundstelle: Einsatzansicht → „Bogen scannen…" (Kiosk), zweiter Scan
derselben Einheit — sei es, weil der Helfer nicht sicher war, ob der erste
angekommen ist, oder weil die Einheit ihren Bogen nochmal zeigt.
Beobachtung: Über dem Scanner erscheint der Dialog „Einheit ist bereits
gemeldet — Als neue Fassung anhängen / Als eigene Einheit führen /
Abbrechen", die Scanner-Statuszeile springt auf „Bereit — warte auf den
Handscanner". Bei identischem Inhalt folgt nach der Wahl „Bereits
vorhanden — übersprungen (gleicher Inhalt)" (siehe Offline-Audit O3); die
Frage wäre also gar nicht nötig gewesen. Bei verändertem Inhalt ist die
Frage nötig, aber sie verlangt eine Einordnung („Folgemeldung oder zweite
gleichnamige Einheit?"), während die nächste Einheit den Code hinhält.
Erwartung der Rolle: Gleicher Bogen → „schon drin", weiter. Veränderter
Bogen → als Folgemeldung anhängen, denn das ist laut Dialog selbst „der
Normalfall"; die Ausnahme (zweite gleichnamige Einheit) darf ein Weg sein,
den man hinterher wählt.
Auswirkung im Einsatz: Der Stapel steht, der Helfer liest 40 Wörter, die
Warteschlange am Meldekopf wächst; unter Druck wird die zweite Option
gewählt (sie steht groß da) und die Einheit zählt doppelt.
Empfehlung: Gleicher Inhalt: nur Quittung, Scanner bleibt bereit.
Veränderter Inhalt im Kiosk: automatisch als Folgemeldung anhängen und in
der Quittung nennen („Folgemeldung angehängt — Stärke 4 → 3; als eigene
Einheit führen?" als Nebenweg).
Verifikation: Dieselbe Einheit dreimal hintereinander scannen — der Scanner
darf nie einen Dialog zeigen; die Karte muss danach genau eine Einheit mit
Historie zeigen.

### S2 [P1] Nach der Unterbrechung steht am Meldekopf ein fremder Bogen als „mein Bogen" ganz oben

Fundstelle: Meldekopf-Gerät nach Neuladen, Browser-Neustart oder
Hardware-Zurück (Fehler-Audit E3); Startseite.
Beobachtung: Die Startseite beginnt mit der Entwurfskarte „THW Albstadt
Zugtrupp Technischer Zug · Stärke 1 / 1 / 2 / 4 · gespeichert 20:51 Uhr —
Fortsetzen / Verwerfen", sobald am Meldekopf je ein Bogen per Link oder
Datei geöffnet wurde (Arbeitsablauf-Audit W1). Die Sammlung „Hochwasser
Albstadt — Öffnen" steht darunter, unter dem Falz (Startseite: 45 Wörter
über dem Falz, sieben Hauptknöpfe insgesamt).
Erwartung der Rolle: Nach dem Wiedereinstieg das sehen, woran man
gearbeitet hat: die Sammlung mit ihren Summen.
Auswirkung im Einsatz: Unter Stress zwei plausible Fehlgriffe: „Verwerfen"
(„das ist die alte Meldung, weg damit" — der Dialog nennt zwar die Einheit,
aber nicht, dass es die letzte empfangene Meldung ist) oder „Fortsetzen"
und dann in einem fremden Bogen tippen. Der eigentliche Weg („Öffnen" bei
der Sammlung) ist der dritte Knopf von oben nach Scrollen.
Empfehlung: Zuletzt offene Sammlung beim Start wieder öffnen (Arbeitsablauf-
Audit W5); empfangene fremde Bögen am Meldekopf nicht in den eigenen
Entwurfsplatz legen (W1); die Entwurfskarte kennzeichnen, wenn ihr Inhalt
empfangen statt selbst erfasst wurde („Empfangen von …").
Verifikation: Am Meldekopf Link empfangen, aufnehmen, neu laden — die
Sammlung muss oben stehen, kein fremder Bogen als Entwurf.

### S3 [P2] Sieben Stellen, an denen die plausible Aktion die falsche ist

Fundstelle und Beobachtung (je im genannten Audit belegt):

- „Neuer Einsatz…" als Anfang der eigenen Meldung gelesen → leere
  Sammelmappe statt Bogen (Neuer-Nutzer F3).
- „Nur Stärke" als Ansichtsoption gelesen → Bogen meldet 0 / 0 / 0 / 0
  (Zerstörende Handlungen D2).
- „‹ Startseite" in der Einsatz-Erfassung als „zurück zum Einsatz"
  gelesen → verlässt die Sammlung, fremde Einheit wird eigener Entwurf
  (Neuer-Nutzer F2).
- Hardware-Zurück als „einen Schritt zurück" → verlässt die App
  (Fehler E3).
- „Abrücken" zweimal getippt → Einheit wieder anwesend, ohne Meldung
  (Zerstörende Handlungen D4).
- „Bogen übergeben…" statt „In Einsatz aufnehmen…" auf dem empfangenen
  Bogen → weitergegeben, aber nicht gezählt (Arbeitsablauf W1).
- „Sammel-PDF" als Druckstück gelesen, nicht als Übergabedatei → die
  Sammlung wird nie weitergegeben (Arbeitsablauf W2).

Erwartung der Rolle: Unter Zeitdruck wird der Knopf genommen, dessen Wort
zum Ziel passt. Die Wörter „Einsatz", „Startseite", „Stärke", „Zurück"
müssen dann das tun, was sie sagen.
Auswirkung im Einsatz: Jede dieser Fallen ist einzeln belegt; gemeinsam
ist ihnen, dass die Software korrekt reagiert und der Helfer es erst
später merkt — beim Meldekopf, in der Summe, am nächsten Morgen.
Empfehlung: Die Beschriftungen an den sieben Stellen so wählen, dass sie
die Folge nennen (siehe die Einzelaudits); für Statuswechsel und
Moduswechsel eine Quittung mit Rückgängig.
Verifikation: Fünf Helfer je Aufgabe unter Zeitvorgabe (30 s pro Schritt);
keine der sieben Fallen darf zuschnappen.

### S4 [P2] Dialoge und Schritte mit Text, der unter Stress nicht gelesen wird

Fundstelle: Übergabe-Dialog (99 Wörter, davon 40 Erklärtext unter den drei
Knöpfen), Schritt 2 (Datenschutzfrist: 48 Wörter bei jedem Besuch des
Schritts), „In Einsatz aufnehmen" (ein Satz mit Semikolon und Klammer als
Erklärung vor der Auswahl), „Alle Daten löschen" (rund 90 Wörter — hier
angemessen), Scanner ohne Kamera (rund 90 Wörter, verdrängen den Ausgang;
Neuer-Nutzer F1).
Beobachtung: Der Text steht jeweils zwischen dem Helfer und dem Knopf oder
unter ihm; im Übergabe-Dialog liegt der zweite Hauptweg („PDF erzeugen")
480 px tief, nach zwei Erklärabsätzen.
Erwartung der Rolle: Knöpfe zuerst, Erklärung darunter, Dauerhinweise
(Datenschutzfrist) einmal statt bei jedem Besuch.
Auswirkung im Einsatz: Der Text wird überflogen; die Information, die darin
steckt („bis darf offen bleiben", „hier geschlossen"), kommt nicht an —
genau die Sätze, die zwei der Fallen in S3 entschärfen sollen.
Empfehlung: In Dialogen die Handlung nach oben, Erklärung als ein Satz;
die Datenschutzfrist auf Schritt 2 hinter ein Aufklappen oder einmalig
beim ersten Bogen; im Scanner den Erklärtext einklappbar.
Verifikation: Jeder Dialog: Handlungsknöpfe innerhalb der ersten 300 px,
Erklärtext unter 30 Wörtern über den Knöpfen.

### S5 [P3] Inline-Formulare am Meldekopf vergessen halbe Eingaben, der Assistent nicht

Fundstelle: Einsatzansicht, „Zug zuordnen" (Eingabefeld „z. B. 2. Zug",
Speichern/Abbrechen) und „Aufteilen…" (Ankreuzliste); Suchfeld über der
Einheitenliste.
Beobachtung: „1. Zug" eingetippt, kurz in die Einsatzliste und zurück: Feld
leer, Zuordnung nicht gesetzt, keine Meldung. Der Assistent sichert
dagegen jeden Tastendruck. Das Suchfeld setzt sich beim Verlassen zurück —
das ist richtig, denn ein vergessener Filter hätte Einheiten
„verschwinden" lassen; die Überschrift sagt außerdem „Einheiten (1 von 2)".
Erwartung der Rolle: Entweder wird gespeichert, sobald ich etwas eintippe,
oder die Software sagt beim Verlassen, dass etwas offen ist.
Auswirkung im Einsatz: Ein Zug bleibt unzugeordnet, die Zwischensumme je
Zug stimmt nicht; gering, weil der Vorgang kurz ist.
Empfehlung: Halb ausgefüllte Inline-Formulare beim Verlassen kurz
anzeigen („Zug-Zuordnung für Crailsheim nicht gespeichert") oder direkt
beim Tippen übernehmen.
Verifikation: Zug eintippen, Ansicht wechseln, zurück — Zuordnung steht
oder eine Meldung nennt den Verlust.

## Was gut funktioniert und erhalten bleiben sollte

Schnellweg: Vorlage → „Einsatz vorbereiten" (56 Wörter, Ankreuzliste,
Stärke-Vorschau) → „Einsatz starten · 4 Pers · 2 Fz" → Schritt 2 mit
leerem Auftrag und heutigem Datum → Übersicht → Übergabe → Vollbild-QR:
fünf Tipps, ein Pflichttext (der Auftrag).

Stapelbetrieb: Der Scanner im Einsatz bleibt nach jeder Aufnahme offen und
quittiert mit Namen und Zähler („✓ ‚THW Albstadt …' aufgenommen — 1 Bogen in
diesem Durchgang. Nächsten Bogen zeigen…"); Übungsbögen werden dabei als
nicht zählend genannt.

Unterbrechung im Assistenten: Jeder Tastendruck ist gesichert, „Fortsetzen"
führt in die Übersicht, die Schrittleiste zeigt mit ✓, was fertig ist —
eine Rekonstruktion ist nicht nötig.

Suchfilter setzt sich beim Verlassen zurück und ist, solange er gilt, in
der Überschrift sichtbar („1 von 2").

Doppeltippen erzeugt nirgends Duplikate (Einsatz anlegen, Aufnahme,
Person hinzufügen).

Die Rückfragen sind kurz und nennen den Gegenstand („‚THW Albstadt …'
entfernen?") — das ist in zehn Sekunden zu erfassen.

## Abschluss

- Aufgabe geschafft: ja — Melden über Vorlage in fünf Tipps; Stapelbetrieb
  am Meldekopf mit Umwegen bei Wiederholungsscans.
- Fremde Hilfe nötig: nein.
- Größtes Missverständnis: Die Entwurfskarte auf der Startseite zeigt am
  Meldekopf den zuletzt empfangenen fremden Bogen als „meinen".
- Größtes Einsatzrisiko: Der Wiederholungsscan im Stapel hält den Meldekopf
  mit einer Fachfrage an, deren zweite Antwort doppelt zählt.
- Top-Priorität für die nächste Iteration: Im Kiosk keine Rückfrage —
  gleicher Inhalt quittieren, veränderter Inhalt als Folgemeldung anhängen
  (S1).
