# Prüfbericht Runde 21: Stress und Unterbrechung

- **Prüfer:** Rolle „Stress und Unterbrechung“ (thw-stress-test-user), erfahrener Helfer unter Zeitdruck, mit Unterbrechungen und wenig Aufmerksamkeit
- **Datum:** 2026-10-29
- **Code-Stand:** Commit `f007590` (= `main`), Produktionsbuild, `http://localhost:4173`
- **Zählung:** P0: 1 · P1: 0 · P2: 0 · P3: 4 · Hinweise: 6
- **Methode:** Playwright (globales Modul `/opt/node22/lib/node_modules/playwright`, `chromium.launch()` ohne Optionen, je Lauf neuer Kontext, `isMobile`/`hasTouch`, Locale de-DE, Dichte 2), Viewports 390x844, 360x640, 320x568, 568x320, 640x360, 844x390. Tipps per `touchscreen.tap`. Voller Speicher: `localStorage` bis zum Quota-Fehler gefüllt (rund 5,24 Mio. Zeichen). Offline: `context.setOffline(true)` nach dem ersten Laden (Wartezeit 6 bis 7 s, Vorrat vollständig) und Neuladen im Offline-Zustand. Verzögertes Nachladen: Routen mit 3 bis 4 s Verzögerung, ohne Service Worker.
- **Maßstab:** Keine „bekannten Grenzen“. Gelesen: `docs/audits/README.md`, „Stand der Behebung“ in `runde-20/README.md`, `runde-20/stress-und-unterbrechung.md`. Auch als „offen“ geführte Punkte sind gemeldet, soweit im Browser noch zu sehen.
- **Nicht geprüft:** echte Kamera, Lärm, Handschuhe, echte Bildschirmtastatur, WebKit, native Builds, Teilen-Menü, Nacht/Dunkel, echter Produktionshost (nur `vite preview`).
- **Kennzeichnung:** *gemessen* = im Testbrowser reproduziert, *Risiko* = abgeleitet.

## Urteil aus Sicht der Rolle

Online und im Telefonformat trägt die App unter Stress gut: Einsatz anlegen, Einheit schnell erfassen, Doppeltipp (nur eine Einheit), Neuladen mitten im Assistenten (Entwurf kommt zurück), Zurück-Geste, Ortswechsel und alle Speicher-voll-Wege halten. **Offline bricht der wichtigste Teil weg:** Die Einsatzansicht lässt sich nicht öffnen (R21-S1). Das ist genau der nachgeladene Teil aus Runde 20. Der Rest (Bogen, PDF, Scanner-Ausweichansicht, Zeichen, Themenseiten) arbeitet offline.

## Haltbarkeit der Behebungen aus Runde 20 (im echten Browser)

| Behebung | Ergebnis |
| --- | --- |
| Bogen bei vollem Speicher schließen | hält: Startseite zeigt „Zuletzt geschlossener Bogen … zurückholen“ |
| Bogen ersetzen („Neuen Bogen erstellen“) bei vollem Speicher | hält: Kopfzeile „Nicht gespeichert … Was tun?“; Startseite warnt „Beim Schließen gehen die Änderungen verloren“ |
| Zurückholen bei angefangenem, ungespeichertem Bogen | hält: Rückfrage nennt beide Bögen, der verdrängte Bogen wird zum „zuletzt geschlossenen“ |
| „Endgültig löschen…“ im Notweg | hält: zweite Rückfrage „… endgültig löschen?“ mit Hinweis „einzige Kopie“, danach Quittung (Hinweis H2) |
| „THW THW Oldenburg“ | hält: „THW · (Einheitstyp offen) · Oldenburg“ |
| „Ort der Einheit ändern…“ | hält: Feld ohne Präfix, Karte „Ort … am Meldekopf geändert“, Historie, „Rückgängig“ |
| Ortsvorschlag | hält: „meint vielleicht OV Flensburg (OFLE)“ |
| Quittung nach „In Einsatz übernehmen“ | hält: Leiste mit Nummer am unteren Bildrand (verschwindet nach etwa 10 s) |
| Scanner ohne Kamera quer (568x320, „Feld“) | hält: Rahmen vollständig, kein innerer Bildlauf |
| Assistent quer („Feld“) | hält: Ortsfeld liegt über der Fußleiste (Vollassistent 120 bis 173 von 263, Schnellerfassung 150 bis 204 von 263) |
| Dialoge bei 320 px | halten: sechs Dialoge, alle Knöpfe im Bild, kein Querlauf |
| Tabelle am Telefon | hält teilweise: im Rahmen, kein Überlauf (Rest R21-S4) |
| Nachgeladene Teile online | hält: Einsatzansicht und Zeichen erscheinen ohne sichtbaren Platzhalter oder Sprung; bei künstlich 4 s verzögerter Zeichensammlung bleibt eine Lücke von 110 px, danach Sprung 0,047 (Hinweis H6) |

## Befunde

### R21-S1 [P0, Bedienung] Einsatzansicht lässt sich offline nicht öffnen; die Startseite behauptet „Funktioniert komplett offline“

- **Neu oder alt (Verweis):** neu (Folge der Nachladung aus Runde 20, „Startbündel halbiert“)
- **Kennzeichnung:** gemessen (mehrfach; Skripte `t11`, `t12`, `t39`)
- **Ort / Aufgabe:** Einsatz-Sammlung öffnen („Öffnen“ auf der Startseite, Neuladen in einem offenen Einsatz, „In Einsatz übernehmen“ nach Offline-Neuladen), ohne Netz.
- **Beobachtung:** Nach dem ersten Laden Netz getrennt (Vorrat vollständig, 659 Einträge, alle 59 Dateien in `dist/assets` offline abrufbar). Beim Öffnen eines Einsatzes erscheint „Hier ist etwas schiefgelaufen – Die Ansicht ließ sich nicht aufbauen“. Konsole: `Unable to preload CSS for http://localhost:4173/assets/index-Bp0pLAQP.css`. Ursache: Der Nachlade-Baustein `einsaetze-ui-*.js` verlangt die Datei `assets/index-Bp0pLAQP.css`; sie liegt weder in `dist/assets` noch im Service-Worker-Vorrat (nur `lagemonitor-ui-*.css`). Online fällt das nur auf, weil `vite preview` für die fehlende Datei die Startseite mit Status 200 liefert (`text/html`). Mit einem echten 404 (Route-Simulation) stürzt die Einsatzansicht **auch online** ab. Neuladen hilft offline nicht, der Dialog empfiehlt „Zuerst neu laden“, bietet „Hilft nichts? Alle Daten löschen“ an und erwähnt das fehlende Netz nicht. Dieselbe Seite zeigt zuvor „✓ Funktioniert komplett offline“. Offline gehen dagegen: Startseite, Bogen ausfüllen, PDF, Scanner-Ausweichansicht, Themenseiten, Schnellerfassung (auch nach Neuladen, Entwurf kommt zurück). Nach „In Einsatz übernehmen“ geht es zurück in die (abstürzende) Einsatzansicht.
- **Folge:** Ein Meldekopf ohne Netz kommt an keinen seiner Bögen, kann weder Lage ansehen noch Sammel-PDF, Lageblatt oder CSV erzeugen. Die Daten bleiben auf dem Gerät, sind aber nicht erreichbar; die falsche Zusage „komplett offline“ verhindert, dass der Helfer rechtzeitig ein Papier-Rückfall wählt. Auf einem Host, der für die fehlende Datei 404 liefert, betrifft es auch den Online-Betrieb.
- **Empfehlung:** Den Verweis auf die nicht vorhandene CSS-Datei aus dem Nachlade-Baustein entfernen oder die Datei erzeugen und in den Vorrat aufnehmen; im Build prüfen, dass jede in den Abhängigkeitslisten genannte Datei existiert und im Vorrat liegt. Zusätzlich einen Offline-Test der Einsatzansicht in die CI aufnehmen. Der Absturzdialog sollte bei fehlendem Netz „Kein Netz“ sagen und nicht zum Löschen raten.
- **Nachprüfung:** Erst laden, Netz trennen, Startseite neu laden, „Öffnen“: Einsatzansicht erscheint, Bögen und Export gehen. Dasselbe nach Neuladen im geöffneten Einsatz. Zusätzlich `index-Bp0pLAQP.css` auf 404 stellen: Einsatzansicht bleibt nutzbar.

### R21-S2 [P3, Text] Schnellerfassung zählt „Schritt 2 von 4“, nennt aber „3. Personal“; Rückweg heißt „Schritt 4 (Fahrzeuge)“

- **Neu oder alt (Verweis):** alt, teilweise behoben: R20 Schrittzählung der Schnellerfassung (A2, W3, H3, K4, N3)
- **Kennzeichnung:** gemessen (390x844)
- **Ort / Aufgabe:** Einsatz → „Einheit schnell erfassen“ → Weiter.
- **Beobachtung:** Kopf „Schritt 2 von 4: Personal“ über der Überschrift „3. Personal“; „Schritt 3 von 4: Fahrzeuge“ über „4. Fahrzeuge“; in der Übersicht „← Zurück zu Schritt 4 (Fahrzeuge)“. In der Reiterleiste stehen die Nummern 1 bis 6 mit „2 –“ und „5 –“ für entfallene Schritte.
- **Folge:** Zwei Zählungen nebeneinander; nach einer Unterbrechung ist unklar, ob noch ein Schritt fehlt.
- **Empfehlung:** Eine Zählung verwenden, im Kopf und in der Überschrift.
- **Nachprüfung:** Schnellerfassung durchgehen: Nummer im Kopf, in der Überschrift und im Rückweg stimmen überein.

### R21-S3 [P3, Layout/Abstand] Erste Einheitenkarte liegt in der Einsatzansicht bei etwa 1165 px

- **Neu oder alt (Verweis):** alt, R20-W6/H5/G6 („nicht ganz erreicht“)
- **Kennzeichnung:** gemessen (Einsatz mit 3 Einheiten: Überschrift „Einheiten (3 gemeldet …)“ bei 930, erste Karte bei 1165 px bei 390x844; bei 360x640 bei 918 und 1153)
- **Ort / Aufgabe:** Einsatzansicht nach Aufnahme einer Einheit.
- **Beobachtung:** Vor der Liste stehen Kennzahlen, vier Aufnahmeknöpfe, „Zuletzt abgelegt“ samt „Zug dieser Einheit/Zuordnen“, Bedarf und die Linkzeile; die Liste beginnt rund 1,4 Bildschirme tiefer.
- **Folge:** Wer „Was ist angekommen?“ sehen will, scrollt; zwei Bestätigungen (Karte „Zuletzt abgelegt“ und Quittungsleiste) sagen dasselbe.
- **Empfehlung:** Die Liste vor „Zuletzt abgelegt“ und Bedarf zeigen oder die Quittung auf die Leiste beschränken.
- **Nachprüfung:** 390x844 nach dem Einlesen: erste Karte unter 960 px.

### R21-S4 [P3, Layout/Abstand] Tabelle: Name unten, Zahlen oben ausgerichtet

- **Neu oder alt (Verweis):** alt, R20-S5 / R19-N8 (Rest)
- **Kennzeichnung:** gemessen (390, 360, 320 px: Tabelle liegt jetzt im Rahmen, Zeilen 57 px, Zellen „Stärke“ und „Eingetroffen“ oben, Name unten)
- **Ort / Aufgabe:** Einsatzansicht → „Tabelle“.
- **Beobachtung:** In jeder Zeile steht der Name tiefer als die Zahlen; bei umbrochenem Namen („THW Bremen / Mitte“) wächst der Versatz.
- **Folge:** Das Auge verfolgt eine Zeile über zwei Höhen; bei drei Zeilen und Stress kann eine Zahl der Nachbarzeile zugeordnet werden.
- **Empfehlung:** Alle Zellen gleich (oben oder mittig) ausrichten.
- **Nachprüfung:** 360x640: Name und Zahlen einer Zeile auf einer Höhe.

### R21-S5 [P3, Layout/Abstand] Warnzeile „Gerätespeicher ist voll“ nimmt die halbe Startseite ein

- **Neu oder alt (Verweis):** alt, verwandt R20-H13/N9/L3/O2 (Texte bei vollem Speicher)
- **Kennzeichnung:** gemessen (390x844, voller Speicher)
- **Ort / Aufgabe:** Startseite bei vollem Speicher.
- **Beobachtung:** Die Warnung hat acht Zeilen (rund 470 px) mit „5 von 5 Mio. Zeichen“ und einer Aufzählung von Löschwegen. Die Aufnahmeknöpfe beginnen bei y = 798 von 844; auf 360x640 liegen sie unter dem Bildrand.
- **Folge:** Genau dann, wenn schnell gehandelt werden muss, steht die Aufgabe außerhalb des Bildes und der Text verlangt Lesezeit.
- **Empfehlung:** Zwei Zeilen und ein Knopf „Platz schaffen“ mit den Wegen dahinter.
- **Nachprüfung:** 360x640 bei vollem Speicher: Warnung höchstens drei Zeilen, „Neuen Bogen erstellen“ im Bild.

## Hinweise (ohne Priorität)

- **H1 „In Einsatz  übernehmen“ hat eine Doppellücke** (alt, R20-H1), sichtbar in Fußleiste, hoch und quer.
- **H2 „Verschieben…“ wird angeboten, obwohl es keinen anderen Einsatz gibt;** erst die Antwort „Es gibt keine andere Einsatz-Sammlung“ klärt es.
- **H3 „Endgültig löschen…“ im Notweg ignoriert Tipps in der ersten Sekunde** (`aria-disabled`, rund 1 s nach Erscheinen), ohne sichtbare Sperre und ohne „Einen Moment …“ wie bei anderen Sperren. Ein früher Tipp bleibt folgenlos.
- **H4 Scanner-Ausweichansicht hochkant:** „Fertig“ 52 px breit (44 hoch), „Kamera erneut versuchen“ linksbündig, Rest mittig (alt, R20-H4).
- **H5 Ortsfeld meldet bei „THW Oldenburg“ „Kein Ort mit diesem Namen in der Liste – Schreibweise prüfen“,** obwohl das Ergebnis richtig „THW · … · Oldenburg“ lautet.
- **H6 Zeichensammlung bei langsamem Netz:** das Zeichen fehlt als unsichtbare Lücke (110 px in der Übersicht), keine Anzeige „wird geladen“; im Normalfall (Vorrat) nicht zu sehen.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (online ja; offline ist der Einsatz nicht erreichbar)
- **Fremde Hilfe nötig:** ja (offline: Einsatz nicht erreichbar)
- **Größtes Missverständnis:** „Funktioniert komplett offline“ stimmt für die Einsatzansicht nicht.
- **Größtes Einsatzrisiko:** Meldekopf ohne Netz kommt nicht an die gesammelten Bögen (R21-S1).
- **Top-Priorität für die nächste Iteration:** R21-S1, fehlende CSS-Abhängigkeit des Einsatz-Bausteins beheben und Offline-Test aufnehmen.
