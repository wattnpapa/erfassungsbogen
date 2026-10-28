# Audit „Fehler und Wiederanlauf“, Runde 19 (Bedienfehler provozieren, selbst korrigieren)

- **Prüfer:** Rollenaudit `thw-error-recovery-reviewer`
- **Datum:** 2026-10-28
- **Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 14 (davon 7 neu, 7 alt mit Verweis)
- **Gegenstand:** Web-App im Produktionsbuild auf `http://localhost:4173`, Code-Stand Commit `0ac0d7f` (`main`). Reiner Prüfbericht, keine Codeänderung.
- **Maßstab:** Es gibt keine „bekannten Grenzen“ zum Auslassen. Reste aus `runde-18` (Abschnitt „Stand der Behebung“) und früheren Runden, die im echten Browser noch zu sehen sind, stehen mit Verweis im Feld „Neu oder alt (Verweis)“. Behebungen, die im Browser nicht mehr zu beobachten sind, stehen nur unter „Bestätigt“. Vorab gelesen: `docs/audits/README.md`, „Stand der Behebung“ und `fehler-und-wiederanlauf.md` in `runde-18`.

## Prüfaufbau

Playwright (globales Modul `/opt/node22/lib/node_modules/playwright`, `chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE, Dichte 2, Tipps als Touch-Tipps mit Koordinaten. Viewports 390 x 844 (Hauptlauf), 360 x 640, 320 x 568 und Querformat 640 x 360 (Startseite, Assistent Schritt 1 bis 6: seitlicher Überlauf, Zielgrößen, Schriftgrößen). Frischer Browserkontext je Lauf. Einsatzdaten: Sammlung „Hochwasser Weser“ (Ort Oldenburg) mit 2, 3 oder 6 Beispielbögen aus `examples/thw/` (Kopien mit `uebung: false`, heutigem Zeitraum), über „Bögen einlesen…“; dazu defekte Datei, Textdatei, fremdes JSON, leeres Bild, Duplikat, älterer Stand. Nichts installiert, kein Prozess mit `pkill` beendet.

Geprüft: Startseite (Lage der Knöpfe über 6 s), Assistent Schritt 1 bis 6 (Typ-Vorschläge, Ort mit Mehrdeutigkeit „Neustadt“, Telefon- und E-Mail-Fehleingaben, Doppeltipp auf „Weiter“, Zeitraum vertauscht, „Namen einfügen…“, Sofortbedarf mit 9999 / 99999 / 999999 / „-3“ / „abc“ / „1,5“ / Verpflegung 9000, Neuladen mit „Fortsetzen“, Browser-Zurück und -Vor, „Bogen übergeben…“, „Bogen schließen“ samt „Zurückholen“, „Neuen Bogen erstellen“ und „Aus Datei laden…“ bei vorhandenem Entwurf), Schnellerfassung (Ort fehlt, Stärke 0, Zähler mit 120 und 400 ms Tippabstand, Stärke 940, Plausibilitätsfrage), Sammlung (anlegen mit Doppeltipp, Einlesen, Karte aufklappen, „Abrücken“ mit „Rückgängig“, „Mehr…“, „Entfernen“ mit Abbrechen nach 100 bis 300 ms und Bestätigen nach 0,3 s und 1,3 s, Quittung, Neuladen, Papierkorb, „Zurückholen“, Nummernvergabe nach „Entfernen“, „Stärke ändern…“, „Zug zuordnen“, Tabelle bei 390 und 360 px, Scanner ohne Kamera, Datei-Einlesen, Exporte mit Dateinamen, „Übergabe vermerken…“, „Einsatz als beendet markieren“ / „Wieder öffnen“, „Einsatz löschen…“, „Alle Daten löschen“, „Einsatz importieren…“ mit Einzelbogen, alle Abrücken und danach Exporte).

Nicht geprüft: echte Kamera, echte Bildschirmtastatur (Tastaturhöhe verschiebt die Lage der Warnungen und Knöpfe zusätzlich), native Builds, Nahbereich, Inhalt von Lageblatt und Sammel-PDF.

## Urteil aus Sicht der Rolle

Die Fehlerabsicherung trägt. Zahlendreher werden vor der Wirkung erkannt (Stärke 940 Mannschaft, 99.999 l Diesel, Verpflegung 9000 für 9 Personen, Fragedialog „Stimmt die Stärke?“), jede zerstörende Handlung fragt mit Folgen, Doppeltipps führen genau eine Aktion aus, Neuladen und Browser-Zurück kosten keine Eingaben, und jede Korrektur gelang ohne fremde Hilfe. Datenverlust fand ich nicht. Übrig sind 14 Randpunkte, alle P3. Der häufigste Typ: Hinweise oder Bedienelemente liegen dort, wo der Helfer in der Eile nicht hinsieht (Warnung weit unter dem Feld, Primärknopf unter dem Falz, Quittung über den Kartenknöpfen).

### Behebungen der Runde 18, im echten Browser geprüft und gehalten (nicht als Befund)

- **Tipp-Sperren mit sichtbarer Gegenhandlung:** Der Bestätigungsknopf einer Rückfrage ist in der ersten Sekunde blass (Deckkraft 0,55, `aria-disabled`) und danach voll; „Abbrechen“ wirkt schon 100 bis 300 ms nach dem Öffnen und schließt die Rückfrage; Doppeltipp auf „Weiter“, „Einsatz anlegen“ und „Abrücken“ wirkt genau einmal.
- **Quittungsleiste:** „Abgerückt …“ und „Entfernt …“ erscheinen mit „Rückgängig“ und „✕“; „Rückgängig“ stellt die Einheit wieder her (Prüfung nach 0,7 s).
- **Nummern bleiben:** Nach „Entfernen“ von Nr. 2 bleiben 1, 3 bis 6 unverändert, ein neu eingelesener Bogen erhält Nr. 4 (nicht 2); die Rückfrage nennt das vorab („Nr. 2 bleibt frei“).
- **Papierkorb:** Nach Neuladen steht über der Liste „1 entfernte Meldung im Papierkorb — ansehen und zurückholen ↓“ (öffnet den Abschnitt); „Zurückholen“ (113 px breit) und „Endgültig löschen…“ (161 px) stehen mit 84 px Abstand; „Zurückholen“ stellt die Meldung wieder her.
- **Übergabe und Abschluss:** Abschnitt „Übergabe und Abschluss“ zeigt je Weg „○ noch nicht / ✓ erzeugt …“; „Einsatz als beendet markieren“ nennt die offenen Wege und lässt sich mit „Wieder öffnen“ zurücknehmen; Alle-Daten-löschen-Rückfrage mit Haken, Sicherungsangebot und Aufzählung der Betroffenen.
- **Dateinamen:** `2026-10-28_0301_eeb-einsatz_Hochwasser_Weser.csv`, `…-alle-daten_…csv`, `…-oldenburg_….xlsx`, `…eeb-lageblatt_….pdf`, `…eeb-einsatz_….pdf` (Datum zuerst, Einsatzname).
- **Tabelle am Telefon:** Kein seitlicher Überlauf bei 390 und 360 px; Tipp auf eine Zeile öffnet die Karte in „Karten“; Köpfe 12 px.
- **Hauptaktion oben, Scanner ohne Kamera:** „Bogen scannen…“ steht als erster Knopf (y = 361 bis 400); der Scanner ohne Kamera nennt „Dieses Gerät meldet keine nutzbare Kamera“, bietet „Kamera erneut versuchen“, „QR aus Bild einlesen…“ und den Handscanner; Knopfleiste ohne Überlauf bei 390 und 360 px.
- **„Gehört zu dieser Lage“:** Je Karte vorhanden, 171 x 44 px (R18-E2 behoben).
- **Fehlermeldungen beim Einlesen:** Defekte Datei, fremdes JSON, Textdatei, Bild ohne QR, Duplikat („0 Bögen aufgenommen, 1 bereits vorhanden“) und älterer Stand („nur in die Historie gelegt“) werden einzeln und konkret gemeldet.
- **Erstbesuch-Sprung:** Lage der Hauptknöpfe der Startseite über 6 s unverändert (390: y = 440 / 830, 360: y = 395 / 753).

## Befunde

### R19-E1 (P3) Zweiter Tipp auf denselben Knopf innerhalb etwa einer Sekunde bleibt ohne Rückmeldung

- **Neu oder alt (Verweis):** alt, Rest von R18-E1 (der Bestätigungsknopf in der Rückfrage ist inzwischen sichtbar abgedunkelt; der öffnende Knopf selbst nicht).
- **Ort:** Sammlung, aufgeklappte Karte → „Mehr…“ → „Entfernen“; 390 x 844.
- **Beobachtung:** „Entfernen“ tippen, Rückfrage mit „Abbrechen“ schließen und „Entfernen“ erneut tippen: Liegt der zweite Tipp 900 ms nach dem ersten, öffnet sich nichts; bei 1300, 1600, 2000 und 2500 ms öffnet sich die Rückfrage. Es gibt weder Wackeln, Abdunkeln des Knopfes noch Hinweis.
- **Folge:** Wer sich vertippt hat („Abbrechen“) und sofort neu ansetzt, hält den Knopf für defekt und tippt ein drittes Mal.
- **Empfehlung:** Die Sperre nur für echte Doppeltipps (unter etwa 300 ms) oder den Knopf während der Sperre sichtbar abdunkeln.

### R19-E2 (P3) Schnellerfassung zählt die Schritte doppelt und uneinheitlich

- **Neu oder alt (Verweis):** neu.
- **Ort:** Sammlung → „Einheit schnell erfassen (nur Stärke)…“, Schritt 2 und 3; 390 x 844.
- **Beobachtung:** Kopfzeile „Schritt 2 von 4: Personal“, Überschrift darunter „3. Personal“; „Schritt 3 von 4: Fahrzeuge“ mit Überschrift „4. Fahrzeuge“. Der Text in Schritt 2 („…erst Schritt 4“) verweist auf eine Nummer, die es in der Schnellerfassung so nicht gibt (Fahrzeuge sind dort Schritt 3).
- **Folge:** Der Helfer weiß nicht, wie viele Schritte noch kommen (zwei Zählungen mit Versatz 1).
- **Empfehlung:** Eine Zählung; Überschriften und Hinweise der Schnellerfassung auf deren eigene Nummern.

### R19-E3 (P3) Schnellerfassung: Pflichtfeld „Ort“ liegt unter der ersten Bildschirmhöhe, „Weiter“ ohne Ort geht ohne Meldung

- **Neu oder alt (Verweis):** alt, Rest von R18-W7 (erstes Eingabefeld der Schnellerfassung bei y = 248 statt unter 200; die damals gemessene Lage gehörte zu eingeklappten Feldern, das erste sichtbare Feld „Organisation“ liegt bei y = 384).
- **Ort:** Sammlung → Schnellerfassung, Schritt 1; 390 x 844.
- **Beobachtung:** Über „Ort der Einheit (Pflicht)“ (y = 870 von 844 sichtbaren) liegen „Angaben vom Zettel“, Organisation, Organisationsname, Einheitstyp, Ebene. „Weiter“ ohne Ort führt kommentarlos zu Schritt 2; erst „In Einsatz übernehmen“ fängt mit der Rückfrage „Ort der Einheit fehlt“ (mit Knopf „Zum Feld“) ab.
- **Folge:** Für „Ort und Stärke vom Zettel“ muss man das einzige Pflichtfeld erst suchen; der Fehler zeigt sich einen Schritt später.
- **Empfehlung:** In der Schnellerfassung den Ort als erstes Feld (oder „Weiter“ mit derselben Rückfrage sperren).

### R19-E4 (P3) Warnungen im Assistenten stehen weit unter dem Feld, das sie meinen

- **Neu oder alt (Verweis):** neu.
- **Ort:** Assistent Schritt 1 (E-Mail) und Schritt 2 (Zeitraum); 390 x 844.
- **Beobachtung:** Schritt 1: Feld „E-Mail“ bei y = 1047, die Warnung „E-Mail … ohne „@“ — stimmt das?“ erscheint bei y = 2249 unter allen Ebenen. Schritt 2: „bis“ vor „von“ (Felder bei y = 406 und 492) meldet die Warnung bei y = 940, „Ort/Auftrag ist noch leer“ bei y = 993. Die Warnung selbst ist konkret und korrekt.
- **Folge:** Der Helfer sieht die Warnung nicht, solange er im Feld tippt (mit Bildschirmtastatur noch weniger); er erfährt es erst auf der Übersicht.
- **Empfehlung:** Die Meldung direkt unter das Feld setzen (zusätzlich zur Sammelliste).

### R19-E5 (P3) Quittungsleiste ist 118 bis 136 px hoch, bleibt stehen und verdeckt Kartenknöpfe

- **Neu oder alt (Verweis):** alt, R18-A8 (Höhe nach „Entfernen“ nicht neu gemessen) und R18-D5; jetzt gemessen.
- **Ort:** Sammlung, nach „Entfernen“ oder „Abrücken“.
- **Beobachtung:** Höhe 118 px bei 390 x 844, 119 px bei 360 x 640, 136 px (24 % der Höhe) bei 320 x 568; bei „Abgerückt …“ 67 px. Sie bleibt auch nach 26 s stehen (bis zur nächsten Aktion oder „✕“) und verdeckt am unteren Rand die Knöpfe der aufgeklappten Karte („Zuklappen“, dritte Knopfreihe).
- **Folge:** Der Daumen trifft beim Weiterarbeiten auf eine Leiste statt auf den Knopf; auf kleinen Telefonen fehlt ein Viertel der Fläche.
- **Empfehlung:** Leiste auf eine Zeile kürzen (Text kürzen, „Rückgängig“ daneben) und nach etwa 15 bis 20 s ausblenden (Papierkorb und Rückholweg bleiben).

### R19-E6 (P3) „Stärke ändern…“ bei 320 x 568: Feld „Mannschaft“ hinter der Knopfleiste

- **Neu oder alt (Verweis):** alt, R18-S4 (Höhe der Sollstärke-Rückfrage nicht im Browser gemessen); jetzt gemessen.
- **Ort:** Sammlung → Karte → „Mehr…“ → „Stärke ändern…“; 320 x 568.
- **Beobachtung:** Das Fenster ist 536 px hoch und scrollt innen; „Stärke übernehmen“ und „Abbrechen“ kleben unten und verdecken das Feld „Mannschaft“ (Feld y = 434, Knopf y = 439) und die Zeile „Gesamt“; nur „Führer“ und „Unterführer“ sind ohne Bildlauf erreichbar. Bei 390 x 844 (571 px) und 360 x 640 (595 px) passt es.
- **Folge:** Wer „Mannschaft“ ändern will (die häufigste Korrektur), muss im Fenster scrollen, mit der Tastatur noch weiter.
- **Empfehlung:** Erklärtext kürzen oder einklappen, damit alle drei Felder über der Knopfleiste stehen.

### R19-E7 (P3) Aufgeklappte Karte in „Feld“ bei 320 x 568 noch rund 1,4 Bildschirme hoch

- **Neu oder alt (Verweis):** alt, Rest von R18-M7 (1139 px); jetzt 805 px bei Karte Nr. 2 (726 px bei 360 x 640).
- **Ort:** Sammlung, Ansicht „Feld“, Karte aufgeklappt.
- **Beobachtung:** Kartenhöhe 805 px bei 320 x 568, ohne seitlichen Überlauf.
- **Folge:** Beim Handeln an der Karte (Abrücken, Zug) verschwindet der Kartenkopf mit Namen aus dem Bild.
- **Empfehlung:** Hinweistexte der Karte bei kleiner Höhe einklappen.

### R19-E8 (P3) Fußzeilen-Linklisten und „Karten | Tabelle“ liegen 4 bis 6 px auseinander

- **Neu oder alt (Verweis):** alt, R18-G5.
- **Ort:** Startseite und Sammlung, Fußbereich („Für deine Organisation“: THW, Feuerwehr, DLRG … im Abstand 48 px bei 44 px Höhe; „Karten“ endet bei x = 272, „Tabelle“ beginnt bei x = 278); 390 x 844.
- **Beobachtung:** Zielgrößen 44 px, Abstände 4 px (Fußzeile) und 6 px (Umschalter).
- **Folge:** Mit Handschuh trifft der Daumen leicht den Nachbarlink bzw. die andere Ansicht.
- **Empfehlung:** Mindestens 8 px Abstand zwischen Zielen, bei Umschaltern ein gemeinsames Segmentfeld.

### R19-E9 (P3) Statusmarke „offen“ im Schrittband ist 9,8 px klein und unklar

- **Neu oder alt (Verweis):** neu.
- **Ort:** Assistent (eigener Bogen), Schrittband oben; 390 x 844 und 360 x 640.
- **Beobachtung:** Die Marke „offen“ unter Schritt 3 und 4 hat 9,8 px Schrift; sie steht auch bei Schritt 4, den man noch nicht besucht hat, ohne zu sagen, ob „offen“ „nicht begonnen“ oder „Warnung offen“ heißt. Schritt 5 und 6 tragen keine Marke.
- **Folge:** Der Helfer deutet „offen“ als „unvollständig“ und bleibt hängen, obwohl „Weiter“ geht.
- **Empfehlung:** „Warnung“ mit Zahl statt „offen“, mindestens 12 px.

### R19-E10 (P3) „Namen einfügen…“: „Übernehmen“ liegt erst nach einem Bildlauf im Fenster

- **Neu oder alt (Verweis):** neu (zu R17-E1, das die Reihenfolge-Wahl betraf).
- **Ort:** Assistent Schritt 3 → „Namen einfügen…“, drei Namen ohne Komma; 390 x 844.
- **Beobachtung:** Das Fenster enthält Eingabefeld (210 px hoch für drei Zeilen), „Liste leeren“, Lesart-Wahl und Vorschau; „3 Personen übernehmen“ steht bei y = 1054 (sichtbar bis 844). Bis die Lesart gewählt ist, ist der Knopf gesperrt; der Grund steht unter dem Knopf, also ebenfalls außerhalb des Bildes.
- **Folge:** Wer die Liste eingefügt hat, sieht keinen Weg weiter und scrollt im Fenster.
- **Empfehlung:** Knopf und Grund der Sperre unten im Fenster festhalten.

### R19-E11 (P3) „Übergabe vermerken…“ lässt „An“ leer

- **Neu oder alt (Verweis):** neu.
- **Ort:** Sammlung → „Übergabe und Abschluss“ → „Übergabe vermerken…“; 390 x 844.
- **Beobachtung:** „Vermerken“ mit leerem Feld „An (Name oder Stelle)“ gibt „✓ Übergabe vermerkt 28.10.2026, 03:02“ ohne Empfänger, ohne Rückfrage. „Vermerk entfernen“ steht daneben.
- **Folge:** Der Vermerk sagt später nicht, an wen übergeben wurde; das Kästchen „übertragen“ auf Papier hat denselben Mangel.
- **Empfehlung:** Leeres Feld mit Rückfrage „Ohne Empfänger vermerken?“ oder das Feld als „optional“ kennzeichnen.

### R19-E12 (P3) Telefonfeld: Hinweis „entfernt“ nennt beim Tippen nur das zuletzt entfernte Zeichen

- **Neu oder alt (Verweis):** alt, Rest von R18-E6 (beim Einfügen behoben).
- **Ort:** Assistent Schritt 1, Feld „Telefon“; 390 x 844.
- **Beobachtung:** Eingefügt (`fill`) ergibt „abc 12x“ den Hinweis „Nur Ziffern übernommen („abc“, „x“ entfernt)“. Zeichen für Zeichen getippt ergibt das Feld „12“ und den Hinweis „(„x“ entfernt)“.
- **Folge:** Gering: Der Hinweis wirkt unvollständig.
- **Empfehlung:** Hinweis über alle entfernten Zeichen führen, bis das Feld verlassen wird.

### R19-E13 (P3) Startseite: Einstieg „Neue Einsatz-Sammlung…“ liegt unter der ersten Bildschirmhöhe

- **Neu oder alt (Verweis):** neu (zu „Hauptaktion oben“, R18).
- **Ort:** Startseite; 390 x 844 und 360 x 640.
- **Beobachtung:** „Neuen Bogen erstellen“ y = 440 (390) bzw. 395 (360); „Neue Einsatz-Sammlung…“ y = 830 bis 875 (390, abgeschnitten) bzw. 753 (360, außerhalb). Meldekopf-Aufgaben (Sammlung, Schnellerfassung, Einsatz importieren) sind erst nach Bildlauf sichtbar. Ein vorhandener Einsatz steht in der Startseite unter „Einsatz-Sammlung (Meldekopf)“, ebenfalls unter dem Falz.
- **Folge:** Wer als Meldekopf startet, sieht zuerst den Einstieg „Meinen Bogen ausfüllen“ und fragt sich, ob er richtig ist.
- **Empfehlung:** Zwei gleichberechtigte Einstiege oben (Bogen / Sammlung) oder den zuletzt benutzten Weg zuerst.

### R19-E14 (P3) Übersicht: Fahrzeugtabelle ist 542 px breit und wischt seitlich

- **Neu oder alt (Verweis):** neu.
- **Ort:** Assistent Schritt 6 „Fahrzeuge (4)“; 390 x 844 und 360 x 640.
- **Beobachtung:** Fünf Spalten, Tabelle 542 px in 356 bzw. 326 px Kasten; Hinweis „Zum Weiterlesen seitlich wischen →“. „Sitzplätze“ und „Ausstattung (StAN)“ liegen außerhalb. Die Personaltabelle (3 Spalten) passt.
- **Folge:** Die Prüfung vor dem Übergeben („Ausstattung nein?“) fällt leicht aus.
- **Empfehlung:** Auf dem Telefon die Fahrzeuge als Karten zeigen oder die Spalten auf Typ, Kennzeichen, Sitzplätze begrenzen.

## Kein Befund (geprüft, trägt)

- Zahlendreher und Plausibilität: Stärke 940 Mannschaft → „stimmt das?“ und Rückfrage „Stimmt die Stärke?“; Diesel 9999 / 99999 → „mehr als 1.000 l je Fahrzeug“; 999999 → „auf 99999 gesetzt“; „-3“ und „abc“ → „nicht übernommen, es gilt weiter …“; „1,5“ → „gerundet: 2“; Verpflegung 9000 → „für 9000 Personen … Gesamtstärke ist 9“.
- E-Mail: „max.thw.de“, „max@thw“, „a b@c.de“, „max@@x.de“ werden mit Ort gewarnt; ohne Ort steht dieselbe Warnung mit Präfix „Zugehörigkeit:“.
- Bogen schützen: „Aus Datei laden…“ und „Neuen Bogen erstellen“ bei vorhandenem Entwurf fragen mit „Der Stand bleibt … unter „Zuletzt geschlossenen Bogen zurückholen“ erreichbar“; „Bogen schließen“ → „geschlossen, nicht gelöscht“, „Zurückholen“ geht.
- Doppelte „Einsatz anlegen“-Tipps legen einen Einsatz an; „Einsatz löschen…“ nennt 30 Tage Papierkorb; „Einsatz importieren…“ mit Einzelbogen bietet „Einsatz anlegen“ statt Fehler.
- Browser-Zurück im Assistenten geht schrittweise (3 → 2 → 1 → Startseite), Vor geht wieder vor; Neuladen bietet „Fortsetzen“.
- Alle Einheiten abgerückt: Lageblatt, Sammel-PDF und CSV lassen sich weiter erzeugen.

## Abschluss

- **Aufgabe geschafft:** ja (Bogen erfassen, Fehler machen, korrigieren, übergeben, schließen und zurückholen; Sammlung führen, Einheiten einlesen, abrücken, entfernen, zurückholen, Stärke ändern, exportieren, Einsatz beenden und wieder öffnen) — ohne Umwege.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „offen“ im Schrittband und die ausbleibende Reaktion auf einen zweiten Tipp wirken wie ein Fehler der App (R19-E9, R19-E1).
- **Größtes Einsatzrisiko:** Eine Warnung, die weit unter dem Feld steht, wird nicht gelesen; die Fehleingabe geht ungewarnt in die Übersicht (R19-E4).
- **Top-Priorität für die nächste Iteration:** Warnungen unter das jeweilige Feld setzen und die Primärknöpfe in Dialogen (Namen einfügen, Stärke ändern) im Bild festhalten (R19-E4, R19-E10, R19-E6).
