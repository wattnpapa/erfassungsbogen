# Audit „Handschuh-Bedienung" (Touch-Ziele, Abstände, Gesten, Formate)

Stand: 27.09.2026 · Prüfer: Rollenaudit `thw-glove-touch-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite build` + `vite preview`),
Zweig `claude/thw-reviewer-skills-dr76q1`, Commit `f350010`.

Reiner Prüfbericht, keine Codeänderung.

## Prüfaufbau

Chromium (Playwright), 360 × 640 Hochformat und 640 × 360 Querformat,
`isMobile`/`hasTouch`, de-DE. Auf jedem Kernscreen (Startseite, Schritte 1–6,
Personal-Tabelle, Übergabe-Dialog, Einsatzansicht als Karten und Tabelle,
Details) wurden alle sichtbaren Bedienelemente vermessen: Zielgröße, Abstand
zum nächsten Ziel, Lage gegensätzlicher Aktionen. Gleiche Messung im
Feld-Thema. Maßstab: 44 px als Mindestkante, 8 px als Mindestabstand — mit
Arbeitshandschuh eher 48 px.

Nicht prüfbar: echte Handschuhe auf echtem Glas, Regen auf dem Display,
Bildschirmtastatur (die Emulation öffnet keine), Wisch-Gesten des Systems,
native Builds.

## Urteil

Die Hauptwege sind handschuhtauglich gebaut: „Weiter/Zurück" fest unten mit
101 × 44 px, Formularfelder 44 px hoch, Dialogknöpfe 272 × 44 px mit 41 px
Abstand, im Feld-Thema wächst fast alles auf 51–54 px, Kästchen auf 30 px.
Der Zähler für die Stärke erspart die Tastatur, Vorschlagslisten und
StAN-Vorbelegung ersparen Tipperei. Reibung bleibt an drei Stellen: Die
Sortierpfeile in Personen- und Fahrzeugkarten sind 36 px schmal, 4 px
auseinander und in der Tabelle unmittelbar neben einem Löschknopf ohne
Rückfrage; die Funktions-Chips haben ein 24-px-Kreuz; und im Querformat
bleiben für das Formular 118 von 360 px übrig. Die Aufgabe ist ohne Hilfe
zu schaffen; die Fehlgriffe kosten Zeit, in der Tabelle auch Daten.

## Befunde

### G1 [P1] Sortierpfeile 36 px breit mit 4 px Abstand — in der Tabelle direkt neben dem Löschen

Fundstelle: Schritt 3 (Karten und Schnelleingabe-Tabelle), Schritt 4:
„nach oben" / „nach unten" / „an die erste Stelle", je 36 × 44 px, 4 px
Abstand; in der Tabelle folgt 17 px weiter „Person entfernen" (41 × 44 px),
das ohne Rückfrage löscht (siehe Audit Zerstörende Handlungen D1). Im
Feld-Thema 45 × 54 px, Abstand unverändert.
Beobachtung: Drei Pfeile nebeneinander in 116 px Breite. Die Tabelle ist
603 px breit und muss bei 360 px seitlich gewischt werden, die Pfeile und das
Löschen liegen am rechten Rand.
Erwartung der Rolle: Mit Handschuh trifft man 36 px Ziele mit 4 px Abstand
nur mit Glück; ein Fehlgriff sortiert um (harmlos) — oder löscht (Tabelle).
Auswirkung im Einsatz: Umsortieren ist reversibel, Löschen in der Tabelle
nicht. Reihenfolgen werden versehentlich verändert, was beim Abgleich mit dem
Papierbogen verwirrt.
Empfehlung: Pfeile auf 44 px und 8 px Abstand (Feld: 48/12), oder das
Sortieren hinter einen Griff bzw. ein Menü legen; das Löschen in der Tabelle
von den Pfeilen trennen und wie in der Karte absichern.
Verifikation: Mit Handschuh zehnmal „nach unten" treffen — kein Fehlgriff
auf „entfernen".

### G2 [P2] Funktions-Chips: 24 × 24 px Kreuz, 27 px im Feld-Thema

Fundstelle: Schritt 3, „Funktionen / Zusatzfunktionen" und „Weitere
Qualifikationen" (Chips wie „ZFü ×", „Kf CE ×"); Fahrerlaubnisklassen ebenso.
Beobachtung: Das Kreuz ist mit 24 × 24 px das kleinste Ziel der App, mehrere
Chips stehen dicht nebeneinander (Chip „He ×" neben „Spr ×"). Löschen ohne
Rückfrage.
Erwartung der Rolle: Chips lassen sich mit dem ganzen Finger treffen; das
Entfernen ist eher selten, das versehentliche Treffen beim Scrollen häufig.
Auswirkung im Einsatz: Eine Funktion (ZFü) oder Klasse (CE) verschwindet beim
Durchwischen; bemerkt wird es erst am Meldekopf, wenn der Zugführer als
Mannschaft geführt ist.
Empfehlung: Chip als Ganzes 44 px hoch, Kreuz mindestens 32 px mit eigenem
Abstand, im Feld-Thema 44 px.
Verifikation: Chip-Kreuz messen; mit Handschuh über die Chip-Zeile scrollen,
ohne einen zu verlieren.

### G3 [P2] Querformat: 118 px Formularfläche zwischen Kopf und Fußleiste

Fundstelle: Assistent, 640 × 360 (Telefon quer, wie es im Fahrzeughalter
liegt).
Beobachtung: Kopf (Startseite-Link, Themenwahl, Logo/Titel, zweizeilige
Schrittleiste) endet bei 181 px, die feste Fußleiste beginnt bei 299 px.
Sichtbar bleiben 118 px: die Überschrift „3. Personal" und eine
Auswahlzeile. Jedes Feld wird einzeln in diesen Streifen gescrollt; öffnet
sich dazu die Tastatur (hier nicht emulierbar, auf Android halbiert sie die
Höhe nochmals), bleibt vom Formular nichts. Im Feld-Thema endet der Kopf bei
215 px.
Erwartung der Rolle: Im Querformat rutscht der Kopf weg oder wird einzeilig;
die Fußleiste darf bleiben.
Auswirkung im Einsatz: Ausfüllen im Querformat ist ein Scroll-Zoll-Verfahren;
im Fahrzeughalter wird eher gar nicht erfasst, sondern später — oder auf
Papier.
Empfehlung: Kopf im Querformat auf eine Zeile (Rücksprung, Titel,
Schrittzähler „3/6") und nicht mitscrollen lassen; Themenwahl aus dem
Assistenten nehmen (siehe Feldtauglichkeits-Audit F5).
Verifikation: 640 × 360, Schritt 3 — mindestens zwei Formularzeilen ohne
Scrollen sichtbar.

### G4 [P2] Kopf- und Fußzeilen-Bedienung mit 24–30 px Höhe, 6–7 px Abstand

Fundstelle: Kopf jedes Schritts: „‹ Startseite" 80 × 30 px, 7 px neben dem
Themenumschalter (4 Knöpfe à 30 px hoch, 0 px Abstand); Startseite und
Einsatzansicht unten: „Datensicherung", „Beispielbögen", „Geräteschlüssel
neu erzeugen", „Alle Daten löschen" (30 px hoch, 6 px Abstand), Link-Listen
mit 24 px Zeilen und 6 px Abstand.
Beobachtung: Der Rücksprung „‹ Startseite" liegt in der Zeile der Themenwahl;
im Feld-Thema 90 × 34 bzw. 39 px, also auch dort unter dem Maß. „Alle Daten
löschen" sitzt 6 px unter „Geräteschlüssel neu erzeugen" — beide durch
Dialoge abgesichert, aber der erste Griff daneben ist mit Handschuh die
Regel.
Erwartung der Rolle: Der Rückweg ist ein Knopf, kein Textlink; alles, was
Daten betrifft, hat Luft um sich.
Auswirkung im Einsatz: Rücksprung trifft die Themenwahl („Nacht" statt
Startseite — bei Sonne ein dunkler Bildschirm), Fußzeilenknöpfe verfehlen;
Dialoge fangen die Datenwege ab, kosten aber einen Abbrechen-Tipp.
Empfehlung: „‹ Startseite" als 44-px-Knopf (Feld 48) mit Abstand zur
Themenwahl; Datenaktionen in der Fußzeile als Knöpfe mit 44 px und 12 px
Abstand, „Alle Daten löschen" abgesetzt.
Verifikation: Kopfzeile messen; Rücksprung mit Handschuh zehnmal treffen.

### G5 [P3] Kästchen und Auswahlpunkte selbst bleiben 18 px, Tabellenköpfe 9–20 px

Fundstelle: Kästchen/Radios im Standard-Thema 18 × 18 px (Zeile 44 px, seit
Feldtauglichkeits-Audit F7 als Ganzes antippbar), Feld-Thema 30 px;
Einsatz-Tabelle: Sortierköpfe „F", „U", „M" 9 × 20 px, andere 26–61 × 20 px.
Beobachtung: Die Zeile trifft man, das sichtbare Kästchen nicht — der Blick
zielt aber auf das Kästchen. Die Tabellenköpfe sortieren nur (reversibel),
sind aber mit Handschuh nicht zu treffen.
Erwartung der Rolle: Was ich anschaue, kann ich treffen.
Auswirkung im Einsatz: Zweiter Versuch beim Ankreuzen; Sortieren der
Einsatztabelle praktisch nur am Rechner.
Empfehlung: Kästchen im Standard-Thema auf 24–28 px; Tabellenköpfe als ganze
Zellen mit 44 px Höhe antippbar.
Verifikation: Kästchen und Tabellenköpfe messen.

### G6 [P3] Fußleiste liegt über dem letzten Feld — und die Übersichtsknöpfe stehen 6 px auseinander

Fundstelle: Alle Schritte: Die feste Fußleiste (67 px, Feld 78 px) überlagert
beim Scrollen das jeweils unterste Feld („Einheitstyp", „Einsatzort",
„Fahrzeugtyp", „Diesel"). Übersicht: „In Einsatz aufnehmen…", „Als Vorlage
speichern", „Neuer Bogen" 6 px auseinander.
Beobachtung: Ein Tipp auf ein Feld, das gerade unter die Leiste rutscht,
trifft „Weiter" oder „Zurück" — der Schritt wechselt, die Eingabe bleibt
erhalten. „Neuer Bogen" (mit Rückfrage) sitzt 6 px neben „Als Vorlage
speichern".
Erwartung der Rolle: Der Streifen über der Leiste ist frei, gegensätzliche
Knöpfe haben Luft.
Auswirkung im Einsatz: Gering — ein ungewollter Schrittwechsel und ein
„Abbrechen".
Empfehlung: Inhalt bekommt am Ende so viel Abstand, dass kein Feld unter
der Leiste enden kann; Übersichtsknöpfe auf 12 px Abstand.
Verifikation: Bis zum Ende scrollen — das letzte Feld muss frei über der
Leiste stehen.

## Was gut funktioniert und erhalten bleiben sollte

„← Zurück" (106 × 44) und „Weiter →" (101 × 44, Feld 115 × 51) fest unten,
links und rechts getrennt; Dialoge: 272 × 44 px Knöpfe, „Abbrechen" 41 px
unter der gefährlichen Aktion; Karten in der Einsatzansicht: alle Knöpfe
≥ 90 × 44 (Feld 54 px), „Entfernen" allein rechts.

Das Feld-Thema hebt fast alles auf 51–54 px, Kästchen auf 30 px, und ist mit
einem Tipp erreichbar (dessen Ziel selbst 30–39 px misst, G4).

Tastatur vermeiden: −/+-Zähler für Stärke, Verpflegung und Unterbringung;
Vorschlagslisten für OV-Name (füllt RB/LV samt Rufnummern nach), Einheitstyp,
Fahrzeugtyp, Funktionen; StAN-Sollplätze auf Knopfdruck; „Namen einfügen…"
aus der Zwischenablage; `inputmode="tel"` am Telefonfeld.

Keine Pflichtgesten: kein Wischen zum Löschen, kein Langdruck, kein Ziehen;
Sortieren über Knöpfe (wenn auch zu kleine, G1). Die Personal-Tabelle
scrollt seitlich in einem eigenen Rahmen, die Seite bleibt stehen.

Vollbild-QR mit Wake Lock und Schließen-Knopf; Scanner-Knöpfe 195 × 44 und
102 × 44 (zum Ausgang siehe Neuer-Nutzer-Audit F1).

## Abschluss

- Aufgabe geschafft: ja.
- Fremde Hilfe nötig: nein.
- Größtes Missverständnis: Die Zeile eines Kästchens ist antippbar, das
  Kästchen sieht nicht so aus.
- Größtes Einsatzrisiko: Sortierpfeile mit 4 px Abstand neben einem
  dialoglosen Löschknopf in der Personal-Tabelle.
- Top-Priorität für die nächste Iteration: Sortierpfeile und Chip-Kreuze auf
  44 px mit echtem Abstand, Tabellen-Löschen absichern (G1, G2).
