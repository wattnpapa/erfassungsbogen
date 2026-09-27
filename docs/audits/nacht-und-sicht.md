# Audit „Nacht und Sicht" (Dunkelheit, Blendung, Sonnenlicht, Farbcodierung)

Stand: 27.09.2026 · Prüfer: Rollenaudit `thw-night-visibility-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite build` + `vite preview`),
Zweig `claude/thw-reviewer-skills-dr76q1`, Commit `999e8b1`.

Reiner Prüfbericht, keine Codeänderung.

## Prüfaufbau

Chromium (Playwright), 360 × 640, `isMobile`/`hasTouch`, de-DE, einmal mit
Systemeinstellung „dunkel". Für jedes der vier Themen (Standard, Dunkel,
Feld, Nacht) wurden Startseite, Schritt 3, Übersicht, Vollbild-QR,
Einsatzansicht und Scanner aufgenommen und für jeden sichtbaren Text das
Kontrastverhältnis gegen den tatsächlichen Hintergrund berechnet (Schwelle
4,5:1, große Schrift 3:1). Dazu: Themenwechsel während eines Dialogs,
Erhalt des Themas nach Neuladen, Übergang auf die Begleitseiten
(Anleitung), Lage des Umschalters auf jedem Screen.

Nicht prüfbar: echte Leuchtdichte, Blendung durch Sonnenlicht auf dem Glas,
entsättigte Darstellung (Graustufen-Modus des Telefons), Rot-Grün-Schwäche —
dafür wurden die Codierungen von Zuständen auf Farbabhängigkeit geprüft.

## Urteil

Die App hat, was die meisten Einsatz-Apps nicht haben: ein echtes
Nacht-Thema mit Bernstein auf fast Schwarz (13/12/8), nicht nur gedimmtes
Weiß, und in allen vier Themen erreicht jeder gemessene Text den Kontrast
von 4,5:1 — auch die kleinen Zeilen wie „Stand 170805jul26 · Scan". Zustände
tragen immer ein Zeichen oder ein Wort (⚠, ✓, „abgerückt" mit
Durchstreichung, „Übung"), nichts hängt allein an der Farbe. Reibung
entsteht beim Wechsel: Der Vollbild-QR flutet auch im Nacht-Thema den ganzen
Bildschirm weiß, die Anleitung und die Themenseiten kennen das Thema nicht,
die Systemeinstellung „dunkel" wird nicht übernommen, und in der
Einsatzansicht liegt der Umschalter 2 000 px tief in der Fußzeile.

## Befunde

### N1 [P2] Vollbild-QR: ganzer Bildschirm weiß, auch im Nacht-Thema

Fundstelle: Übersicht → „Bogen übergeben…" → „QR-Code im Vollbild zeigen",
Thema Nacht und Dunkel.
Beobachtung: Das Vollbild ist auf ganzer Fläche Weiß (255/255/255), der Code
belegt etwa 40 % davon; der Hinweis „Display-Helligkeit hoch stellen hilft
beim Scannen" steht darunter. Der Rest der App ist in diesem Moment
dunkelbraun-schwarz.
Erwartung der Rolle: Der Code braucht Weiß um sich (Ruhezone), nicht der
ganze Bildschirm. Nachts im Bereitstellungsraum ist ein weißes Telefon in
der Hand eine Lampe — für den, der es hält, und für den, der drauf schaut.
Auswirkung im Einsatz: Nachtsicht weg für eine halbe Minute, beide Beteiligte
blinzeln; das Telefon wird abgeschirmt gehalten, was das Scannen erschwert —
das Gegenteil dessen, was der Hinweis will.
Empfehlung: Code mit weißem Rahmen (ein Modul Ruhezone plus Rand) auf dem
Hintergrund des Themas; Helligkeitshinweis behalten. Alternativ ein
„Dunkler Rand"-Schalter im Vollbild.
Verifikation: Vollbild-QR im Nacht-Thema — außerhalb des Codes plus Rand
darf keine große weiße Fläche stehen; Scan mit einem zweiten Telefon muss
weiter gelingen.

### N2 [P2] Anleitung und Themenseiten fallen aus dem Nacht-Thema

Fundstelle: Aus der App (Thema Nacht) auf „Anleitung" oder eine
Organisationsseite in der Fußzeile; ebenso die Landingpages als Einstieg.
Beobachtung: Die Anleitung öffnet hellgrau-weiß (242/243/247), unabhängig
vom gewählten Thema und von der Systemeinstellung. Zurück in der App ist es
wieder dunkel.
Erwartung der Rolle: Wer nachts nachschlägt, wie der Handscanner
eingerichtet wird, erwartet dieselbe Dunkelheit.
Auswirkung im Einsatz: Weißer Vollbildschirm genau in der Situation, in der
man Hilfe sucht; Nachtsicht weg, Seite wird zugehalten oder nicht gelesen.
Empfehlung: Thema (mindestens hell/dunkel) auf die statischen Seiten
übertragen; ersatzweise die Systemeinstellung dort respektieren.
Verifikation: Nacht-Thema wählen, Anleitung öffnen — sie muss dunkel sein.

### N3 [P2] Der Themenumschalter fehlt in der Einsatzansicht oben

Fundstelle: Einsatzansicht (Meldekopf), Karten wie Tabelle.
Beobachtung: Der Umschalter steht nur in der Fußzeile unter „Darstellung",
bei y = 2 086 px von 2 264 px Seitenhöhe. Im Assistenten steht er im Kopf.
Erwartung der Rolle: Es wird dunkel, ich bin in der Sammlung, ich will mit
einem Griff auf Nacht.
Auswirkung im Einsatz: Fünf Bildschirmhöhen scrollen, während Einheiten
eintreffen — oder es bleibt hell, und das Tablet blendet den ganzen Abend.
Empfehlung: Umschalter im Kopf der Einsatzansicht wie im Assistenten;
zusätzlich die Systemeinstellung als Vorgabe (N4).
Verifikation: Einsatz öffnen — der Umschalter muss ohne Scrollen erreichbar
sein.

### N4 [P3] Die Systemeinstellung „dunkel" wird nicht übernommen

Fundstelle: Erster Aufruf mit Systemeinstellung dunkel.
Beobachtung: Die App startet hell (243/245/249). Ein gewähltes Thema bleibt
nach Neuladen erhalten; es gibt aber keine Vorgabe aus dem System und keine
automatische Umschaltung nach Tageszeit — was für die Vorhersehbarkeit gut
ist (kein Vorgang wird unterbrochen; der Wechsel während eines offenen
Dialogs lässt den Dialog offen).
Erwartung der Rolle: Wer das Telefon abends auf dunkel gestellt hat, erwartet
das auch von der App — mindestens beim ersten Start.
Auswirkung im Einsatz: Ein heller erster Screen bei Nacht, ein Tipp zum
Umstellen. Gering, aber genau der erste Eindruck bei Kaltstart im Dunkeln.
Empfehlung: Ohne gespeichertes Thema die Systemeinstellung übernehmen
(hell → Standard, dunkel → Dunkel); die manuelle Wahl bleibt vorrangig und
wird nie automatisch überschrieben.
Verifikation: Gespeichertes Thema löschen, System auf dunkel, App öffnen —
sie muss dunkel starten.

### N5 [P3] Das taktische Zeichen bleibt im Nacht-Thema leuchtend blau-weiß

Fundstelle: Kopf des Assistenten, Übersicht (Zeichen der Einheit), Vorlagen-
und Einsatzkarten.
Beobachtung: Das Zeichen wird in Blau auf Weiß gerendert, unabhängig vom
Thema — im Nacht-Thema der hellste Fleck des Screens, klein, aber im Kopf
dauerhaft sichtbar.
Erwartung der Rolle: Das Zeichen muss erkennbar bleiben, nicht leuchten.
Auswirkung im Einsatz: Gering; ein kleiner Blendfleck.
Empfehlung: Im Nacht-Thema das Zeichen in Bernstein-Linie auf dunklem Grund
oder mit reduzierter Helligkeit zeichnen.
Verifikation: Nacht-Thema, Assistent — kein weißer Fleck im Kopf.

## Was gut funktioniert und erhalten bleiben sollte

Vier Themen, alle mit messbar ausreichendem Kontrast: In 24 Aufnahmen
(6 Screens × 4 Themen) kein Text unter 4,5:1. Das Nacht-Thema arbeitet mit
Bernstein (217/205/182 auf 13/12/8), die Warnfarbe ist ein blasses Rot, die
Bestätigungsfarbe ein gedecktes Grün — unterscheidbar auch bei geringer
Displayhelligkeit.

Zustände sind nie nur Farbe: ⚠ vor jeder Warnung, ✓ vor „automatisch
gespeichert", „signiert", „Alle Angaben vollständig"; die Schrittleiste
trägt ✓ bzw. „•" als Zeichen; abgerückte Einheiten sind durchgestrichen,
ausgegraut und mit dem Wort „abgerückt" beschriftet; Übungen tragen einen
Textstörer. Eine Rot-Grün-Schwäche nimmt nichts weg.

Das Feld-Thema (Schwarz auf Hellgrau, größere Schrift, dickere Linien) ist
die richtige Antwort auf Sonnenlicht: maximaler Kontrast statt Farbe.

Der Scanner ist in jedem Thema schwarz mit hellem Text — keine Blendung
beim Zielen. Der Themenwechsel unterbricht nichts: offene Dialoge bleiben
offen, Eingaben bleiben stehen, das Thema überlebt das Neuladen.

Der Vollbild-QR hält den Bildschirm wach und sagt, dass Helligkeit beim
Scannen hilft — das ist richtig, nur die Fläche ist zu groß (N1).

## Abschluss

- Aufgabe geschafft: ja.
- Fremde Hilfe nötig: nein.
- Größtes Missverständnis: „Nacht" gilt für die App, aber nicht für die
  Anleitung und nicht für den Vollbild-QR.
- Größtes Einsatzrisiko: Der weiße Vollbild-QR nimmt beiden Beteiligten im
  Dunkeln die Nachtsicht — Blendung statt Scannen.
- Top-Priorität für die nächste Iteration: Vollbild-QR mit weißem Rahmen auf
  dunklem Grund (N1), danach den Umschalter in den Kopf der Einsatzansicht
  (N3).
