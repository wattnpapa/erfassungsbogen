# Prüfbericht Runde 19: Arbeitsablauf

- **Prüfer:** Rolle „Arbeitsablauf“ (thw-workflow-reviewer), Meldekopf-Bediener und Helfer mit eigenem Bogen in einer Person
- **Datum:** 2026-10-28
- **Code-Stand:** Commit `0ac0d7f` (= `main`, Runde 18), Produktionsbuild, `http://localhost:4173`
- **Methode:** Playwright (globales Modul, `chromium.launch()` ohne Optionen, frisches Profil je Lauf), `isMobile`/`hasTouch`, Locale de-DE, Viewports 360 x 640, 390 x 844 und 320 x 568 (nur Kartenhöhe). Bögen: fünf bis sechs THW-Beispielbögen aus `examples/thw/` mit `uebung: false` und aktuellem Stand. Downloads (Lageblatt, CSV, Nachtrags-CSV, Excel, Sammel-PDF) erzeugt und geöffnet. Kein Code geändert. Nicht geprüft: echte Kamera, Nahbereich, Bildschirmtastatur, native Builds.
- **Maßstab:** Keine „bekannten Grenzen“. Auch Punkte, die in Runde 18 als offen oder teilweise geführt wurden, sind gemeldet, wenn sie im Browser noch zu sehen sind.
- **Zählung:** P0: 0 · P1: 0 · P2: 1 · P3: 11

## Urteil aus Sicht der Rolle

Erwartete Arbeitsfolge (Annahme, kein bekannter THW-Vorschrifttext): Der Meldekopf legt einen Einsatz an, nimmt Bögen auf, ordnet Zug zu, rückt Einheiten ab, gibt die Lage weiter (Lageblatt, CSV, Sammel-PDF, Nachtrag), vermerkt die Übergabe und markiert den Einsatz als beendet. Daneben steht der eigene Bogen bis zur Übergabe.

Beide Strecken ließen sich ohne fremde Hilfe, ohne doppelte Eingabe und ohne Datenverlust durchlaufen. Die Runde-18-Behebungen halten fast durchweg. Die Reibung liegt jetzt am Abschluss (Übergabe-Häkchen bleiben nach neuen Meldungen stehen) und in Resten bei der Erstorientierung am kleinen Telefon.

## Haltbarkeit der Behebungen aus Runde 18 (im echten Browser)

| Behebung | Ergebnis |
| --- | --- |
| Tipp-Sperre „Meldung entfernen“ | hält: Tipp nach 300 ms bleibt ohne Wirkung, Knopf steht blass gestrichelt und ist `aria-disabled`; nach etwa 1 s wirkt er (Rest siehe R19-W11) |
| Nummern bleiben nach „Entfernen“ | hält: Rückfrage „Nr. 1 bleibt frei, die übrigen Nummern (2–5) bleiben“; Karten heißen danach Nr. 2 bis 5 |
| Quittungsleiste | hält: „Zug „1. Zug“ gesetzt: 5 Einheiten“ bleibt auch nach 20 s mit Zahl; Entfernen-Quittung vollständig („Nr. 1 bleibt frei. 7 Tage im Papierkorb unter der Liste.“) |
| Papierkorb Meldungen | hält: nach Neuladen „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar“; „Zurückholen“ und „Endgültig löschen…“ 54 px auseinander |
| Abrücken | hält: Doppeltipp führt zu einer Abrückung, „✓ Abgerückt“ (Bestätigung, deaktiviert), nach 15 bis 20 s „Wieder anwesend“ |
| Dateinamen | halten: `2026-10-28_0253_eeb-lageblatt_Hochwasser_Weser.pdf`, `…-einsatz-nachtrag_…csv`, `…-oldenburg_….xlsx` |
| Nachtrags-Bereich | besser: Haken „Nur neue Bögen“ zeigt Bezug direkt in den Knöpfen („Übersicht als CSV — Nachtrag (1 Einheit)“) |
| Tabelle am Telefon 360 px | hält: kein seitlicher Überlauf (360 von 360), Kopf 12 px, Abgerückte durchgestrichen am Ende |
| Hauptaktion im leeren Einsatz | hält: „Bogen scannen…“ bei 361 px im ersten Bild |
| Scanner ohne Kamera | hält: Hinweis, „QR aus Bild einlesen…“ und „Fertig“ in der Fußleiste, Handscanner-Anleitung |
| Neuladen / Zurück-Geste | halten: Einsatz und Bildlaufstelle (2080 px) bleiben; Zurück führt zur Startseite |
| Lageblatt „Stärke“ | hält: überall „1/1/2/4“ und „1/12/36/49“ |
| „Gehört zu dieser Lage“ | hält: 44 px hoch |

## Befunde

### R19-W1 [P2] „Übergabe und Abschluss“ führt Häkchen weiter, obwohl danach neue Meldungen kamen

- **Neu oder alt (Verweis):** neu (Teilverweis auf R18-A8 und R18-D5, Übergabe und Abschluss)
- **Ort:** Einsatzansicht › „Übergabe und Abschluss“, 360 x 640.
- **Beobachtung:** Lageblatt und „Übersicht als CSV“ erzeugt, Übergabe vermerkt, Einsatz als beendet markiert, danach eine sechste Einheit eingelesen. Die Liste zeigt weiter „✓ Lageblatt: erzeugt 02:55“, „✓ Übersicht als CSV“, „✓ Übergabe vermerkt 02:55“ und „Einsatz beendet — noch offen: Weitergabe-Datei, Excel-Liste, Datensicherung“. Drei Absätze weiter oben steht dagegen „Lageblatt erstellt … seitdem 1 neue Meldung — Aushang ist nicht mehr aktuell“. Der Einsatz bleibt „beendet“, auch wenn eine Meldung hinzukommt. „Alle Daten als CSV“ taucht in der Liste gar nicht auf.
- **Folge:** Der Abschlussblock, der Sicherheit geben soll, behauptet am Einsatzende einen Stand, der nicht mehr stimmt. Die später eingegangene Einheit fehlt in der übergebenen Lage, ohne dass der Helfer es merkt.
- **Empfehlung:** Häkchen nur für Stände vergeben, die die aktuelle Meldungsmenge enthalten; sonst „⚠ seitdem 1 neue Meldung“. Vermerkte Übergabe und „beendet“ bei neuer Meldung sichtbar als überholt zeigen. „Alle Daten als CSV“ in die Liste aufnehmen.
- **Verifikation:** Lageblatt erzeugen, Übergabe vermerken, beenden, Bogen einlesen: Abschlussblock nennt die neue Meldung.

### R19-W2 [P3] Fußleisten-Knopf „In Einsatz übernehmen“ ragt bei 360 px aus dem Knopf

- **Neu oder alt (Verweis):** neu
- **Ort:** Schnellerfassung, Fußleiste, 360 x 640.
- **Beobachtung:** Knopf 121 px breit, Beschriftung 134 px (`white-space: nowrap`, `overflow: visible`); das letzte „n“ von „übernehmen“ steht weiß auf weißem Grund außerhalb. Bei 390 px passt es (157 von 157).
- **Folge:** Die zentrale Aktion der Schnellerfassung wirkt abgeschnitten („übernehme“).
- **Empfehlung:** Umbruch erlauben oder Knopf der Beschriftung anpassen.
- **Verifikation:** 360 x 640, Schnellerfassung öffnen: Beschriftung vollständig im Knopf.

### R19-W3 [P3] Startseite: „Neue Einsatz-Sammlung…“ liegt bei 360 x 640 unter dem Falz

- **Neu oder alt (Verweis):** alt, R18-S1 (Rest auf der Startseite; im Einsatz selbst behoben)
- **Ort:** Startseite ohne Einsatz, 360 x 640.
- **Beobachtung:** „Neuen Bogen erstellen“ bei 395 px, „Neue Einsatz-Sammlung…“ bei 753 px (Falz 640 px). Der Meldekopf muss einen Bildschirm scrollen, der Helfer mit eigenem Bogen nicht.
- **Folge:** Beim ersten Start des Meldekopfs ist der Einstieg nicht im ersten Bild.
- **Empfehlung:** Beide Einstiege nebeneinander oder untereinander im ersten Bild, oder Rollenwahl am Anfang.
- **Verifikation:** 360 x 640: beide Einstiege im ersten Bild.

### R19-W4 [P3] Nach dem Einlesen liegt die Einheitenliste mehr als drei Bildschirme unter dem Kopf

- **Neu oder alt (Verweis):** alt, verwandt mit R18-S1 und R18-K3
- **Ort:** Einsatzansicht nach „Bögen einlesen…“, 360 x 640.
- **Beobachtung:** Vor der Liste (erste Karte bei etwa 2150 px) stehen Kennzahlen, Aufnahmeknöpfe, Aufnahmequittung, „Neu seit der letzten Kenntnisnahme“ (bei 5 Einheiten fünf lange Zeilen), Zug-Formular, Bedarf und zwei Sprungverweise.
- **Folge:** Nach jeder Aufnahme muss der Bediener suchen oder „Zur Einheitenliste ↓“ nutzen, um die Einheit zu sehen.
- **Empfehlung:** Neu-Block ab einer Einheit eingeklappt; Liste unmittelbar nach den Kennzahlen.
- **Verifikation:** 5 Bögen einlesen: erste Karte innerhalb von zwei Bildschirmen.

### R19-W5 [P3] Schnellerfassung: Kopf und Hinweiszeile verbrauchen ein Viertel des Bildes

- **Neu oder alt (Verweis):** alt, R18-W7 (verbessert, nicht behoben)
- **Ort:** Einsatz › „Einheit schnell erfassen…“, 360 x 640.
- **Beobachtung:** Kopf, Speicherzeile, „Schritt 1 von 4“ und aufgeklappte Zeile „Angaben vom Zettel (optional)“ bei 169 px; das erste Eingabefeld (Organisation) bei etwa 384 px. Soll: unter 200 px.
- **Folge:** Beim Eintragen von Ort und Stärke wird weiterhin viel gescrollt.
- **Empfehlung:** „Angaben vom Zettel“ unter die Pflichtfelder, Kopf auf eine Zeile.
- **Verifikation:** 360 x 640: erstes Eingabefeld oberhalb von 200 px.

### R19-W6 [P3] Aufgeklappte Karte bei 320 x 568 ist 918 px hoch

- **Neu oder alt (Verweis):** alt, R18-M7 (Standardansicht gemessen; vorher 1139 px in „Feld“)
- **Ort:** Einsatzansicht, Karte aufgeklappt mit „Mehr…“, 320 x 568.
- **Beobachtung:** Karte 918 px hoch bei 568 px Bildhöhe; Knopfreihen und Hinweise gestapelt.
- **Folge:** Zum Abrücken, Zug setzen und Entfernen mehrmals scrollen.
- **Empfehlung:** Aktionen kompakter, Hinweise einklappen.
- **Verifikation:** 320 x 568 aufklappen: unter etwa 700 px.

### R19-W7 [P3] „Karten | Tabelle“ und „Standard | Feld“ mit 6 bis 8 px Abstand

- **Neu oder alt (Verweis):** alt, R18-G5
- **Ort:** Kopf der Einheitenliste (Karten 169–242, Tabelle 248–327 px) und Fußzeile (Standard/Feld, 8 px).
- **Beobachtung:** Nebeneinanderliegende Umschalter mit 6 und 8 px Abstand; die Fußzeilen-Linklisten selbst haben 16 px.
- **Folge:** Mit Handschuh Fehltipp auf den Nachbarn möglich (reversibel, aber irritierend).
- **Empfehlung:** Mindestens 12 px Abstand.
- **Verifikation:** 360 x 640 messen.

### R19-W8 [P3] Aktionsraster „Mehr…“: Beschriftungen abgeschnitten, „Entfernen“ 8 px neben „Verschieben…“

- **Neu oder alt (Verweis):** neu (Entfernen-Abstand: R16-H, damals 81 px)
- **Ort:** Karte › „Mehr…“, 360 x 640.
- **Beobachtung:** „Verschieben…“ (`scrollWidth` > `clientWidth`) und „Als Übung kennzeichnen…“ laufen in die Knopfränder („kennzeichnen…“ endet mit Auslassung). Der rote Knopf „Entfernen“ (138–222) liegt 8 px neben „Verschieben…“ (46–130).
- **Folge:** Beschriftung nicht voll lesbar; das Löschen neben dem Verschieben ist eng. Die Rückfrage mit Tipp-Sperre und die Papierkorb-Rückholung fangen den Fehltipp ab.
- **Empfehlung:** Zwei statt drei Spalten, „Entfernen“ mit Abstand in eigener Zeile.
- **Verifikation:** 360 x 640 „Mehr…“ öffnen: alle Beschriftungen vollständig, 24 px zu „Entfernen“.

### R19-W9 [P3] Tabelle am Telefon schneidet Einheitsnamen ab

- **Neu oder alt (Verweis):** alt, R18-E5/R18-S10 (Bedienung vorhanden, Namen gekürzt)
- **Ort:** Einsatzansicht › „Tabelle“, 360 x 640.
- **Beobachtung:** Erste Spalte 111 px; „THW Crailsheim Fachgruppe Wassergefahre…“, „THW Haßmersheim Fachgruppe…“. Der Typ („Wassergefahren (A)“) ist bei Haßmersheim nicht sichtbar. Der Abgerückte wandert ans Tabellenende.
- **Folge:** Zwei Einheiten gleichen Typs sind in der Tabelle nur an Ort und Nummer erkennbar.
- **Empfehlung:** Namen auf zwei Zeilen mit Typ-Kürzel, nicht abschneiden.
- **Verifikation:** 360 x 640 Tabelle: Typ jeder Einheit lesbar.

### R19-W10 [P3] Rückfrage „Einsatz löschen?“ nennt den Exportstand nicht

- **Neu oder alt (Verweis):** neu
- **Ort:** Startseite › Einsatz › „Löschen…“.
- **Beobachtung:** Der Dialog sagt „mit 5 gemeldeten Einheiten wandert in den Papierkorb … 30 Tage“. Die Karte darüber zeigt „Lageblatt: noch keins · Export: noch keiner“; die Rückfrage zum Entfernen einer einzelnen Meldung nennt das („Noch kein Export und keine Weitergabe davon“), diese nicht.
- **Folge:** Ein nie übergebener Einsatz wird mit gleicher Gelassenheit gelöscht wie ein übergebener. Zurückholbar, daher nur P3.
- **Empfehlung:** Exportstand in die Rückfrage übernehmen.
- **Verifikation:** Einsatz ohne Export löschen: Hinweis „noch nichts übergeben“.

### R19-W11 [P3] Tipp-Sperre nur als blasse Schrift sichtbar, ohne Hinweis

- **Neu oder alt (Verweis):** alt, R18-W3 (Teil)
- **Ort:** Rückfrage „Meldung entfernen?“, ersten ca. 1,2 s.
- **Beobachtung:** Der Knopf ist deaktiviert und rosa-gestrichelt; ein Tipp nach 300 ms bewirkt nichts, ohne Erklärung. Nach einer Sekunde wird er normal.
- **Folge:** Der Helfer tippt erneut und zweifelt kurz.
- **Empfehlung:** Zusatz „gleich bereit“ oder Fortschrittsanzeige im Knopf.
- **Verifikation:** Rückfrage öffnen, 300 ms tippen: sichtbare Begründung.

### R19-W12 [P3] Quittungsleiste bleibt nach „Abrücken“ stehen und verdeckt ein Sechstel des Bildes

- **Neu oder alt (Verweis):** alt, R18-H1/R18-D5 (Rest)
- **Ort:** Einsatzansicht unten, 360 x 640.
- **Beobachtung:** „Abgerückt 02:59: Nr. 1 …“ steht auch nach über 20 s, etwa 110 von 640 px hoch, und überdeckt Tabellenzeilen und Knöpfe darunter. Schließen nur über „✕“.
- **Folge:** Beim Weiterarbeiten fehlt die unterste Zeile; wer sie nicht wegtippt, scrollt dagegen an.
- **Empfehlung:** Nach etwa 15 s auf eine einzeilige Leiste verkleinern.
- **Verifikation:** Abrücken, 20 s warten: Leiste höchstens 50 px.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Die Häkchen unter „Übergabe und Abschluss“ lesen sich wie „alles Aktuelle ist übergeben“, gelten aber nur für den Zeitpunkt der Erzeugung (R19-W1).
- **Größtes Einsatzrisiko:** Eine nach der Übergabe eingegangene Meldung fehlt unbemerkt in der übergebenen Lage (R19-W1); Datenverlust im Ablauf wurde nicht beobachtet.
- **Top-Priorität für die nächste Iteration:** R19-W1 (Abschlussblock gegen neue Meldungen absichern).
