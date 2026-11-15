# Audit „Helfer im Feld“, Runde 10 (Feldtauglichkeit)

Stand: 25.10.2026 · Prüfer: Rollenaudit `thw-field-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `441811c` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-9-Befunde
([../runde-9/feldtauglichkeit.md](../runde-9/feldtauglichkeit.md) und
[../runde-9/README.md → Stand der Behebung](../runde-9/README.md#stand-der-behebung-25102026)).
Geprüft wurden außerdem die parallel auf `main` eingegangenen Änderungen aus der
Erprobung (Feld „Ort der Einheit (Pflicht)“, Einheiten-Anzahl-Fläche,
linksbündige Organisationslisten).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, jeder Lauf in einem
eigenen Browser-Kontext mit frischem Speicher, weil elf weitere Prüfer denselben
Server nutzten; der Server wurde weder neu gebaut noch angefasst. Grundeinstellung
Telefon 360 × 640 px, dazu 320 × 568, quer 640 × 360, ein Maß mit 340 px Höhe
als Stand-in für eine eingeblendete Bildschirmtastatur, Browser-Zoom 200 %
über halbierte CSS-Pixel (180 × 320) und `html { font-size: 200% }` („200 %
Schrift“). Bedient wurde mit `tap()`. **Zeiten sind unter Last gemessen und nur
grob.**

Zustände kamen über `localStorage`-Seeds (`uebung: false`, `stand` auf heute,
Einsatzzeitraum auf den 25.10.2026 gesetzt, damit „Zeitraum vorbei“ aus den
Übungsbögen die Messungen nicht überlagert): Entwurf „Verstärkter Bergungszug“
Oldenburg (38 Personen), Sammlung „Hochwasser Musterstadt“ mit sechs THW-Bögen,
ein abgeschnittener Rohtext der Sammlung neben einem Entwurf „Ulm“. Daneben
Bedienung ohne Seed (Neuer Bogen, Einheit manuell erfassen, Schnellerfassung).
Skripte und Bilder liegen im Scratchpad unter `runde10/h/`.

Reihenfolge: Zuerst blind getestet, ohne Berichte unter `docs/audits/` zu lesen:
Startseite, „Neuen Bogen erstellen“ mit Einheitstyp-Eingabe durch Schritt 1
bis 5, „Nur Stärke“ mit Rückfrage und Zahlenfeldern (Komma, Minus, Text, leer,
1000), Sofortbedarf-Schalter, Übersicht und „Bogen übergeben“ samt QR-Vollbild,
Sammlung am Telefon, „Einheit manuell erfassen…“ mit Neuladen mittendrin und
„In Einsatz übernehmen“ mit Sollstärke-Rückfrage, „Einheit schnell erfassen“,
Karte aufklappen mit Abrücken und Rückgängig, Lagemonitor in fünf Maßen,
beschädigter Speicher. Danach den Runde-9-Bericht meiner Rolle und den Stand der
Behebung gelesen und R9-H1 bis R9-H6 einzeln nachgemessen. Befunde anderer
Runde-10-Berichte kenne ich nicht.

Rolle: Helfer einer Bergungsgruppe oder Meldekopf-Helfer, praktisch erfahren,
bedient die App selten, steht mit dem Telefon in einer Hand am Fahrzeug oder am
Meldekopf und wird zwischendurch gerufen.

Szenarien, jeweils vom natürlichen Einstieg aus:

1. **Neuen Bogen anlegen:** Startseite → „Neuen Bogen erstellen“ → Einheitstyp
   „Bergungs“ tippen, „B Bergungsgruppe“ wählen → Ort → Schritte 2 bis 5.
   Abgeschlossen: **ja**. Der Typ bringt 9 StAN-Plätze und 2 Fahrzeuge mit; die
   Warnungen je Schritt nennen, was zu prüfen ist.
2. **Bogen übergeben:** Entwurf → „Fortsetzen“ → Übersicht → „Bogen übergeben…“
   → „QR-Code im Vollbild zeigen“ (7 Teile, „Weiter zu Teil 2 →“).
   Abgeschlossen: **ja**, auch bei 180 × 320.
3. **Meldekopf, Einheit im Stehen aufnehmen:** Sammlung öffnen → „Einheit
   manuell erfassen…“ → Zug, Nr., Typ, Ort → „In Einsatz übernehmen“ → Rückfrage
   „Nur Sollplätze“ → „Als Sollstärke ablegen“ bzw. „Nur Stärke“ mit Zahlen.
   Abgeschlossen: **ja**.
4. **Unterbrechung:** Neuladen nach Eingabe von Nr., Zug, Typ und Ort in der
   manuellen Aufnahme. Abgeschlossen: **ja**, alles wiederhergestellt.
5. **Abrücken und Rückgängig:** zwei Einheiten abrücken, „Rückgängig“, Leiste
   schließen, „Wieder anwesend“ an der Karte. Abgeschlossen: **ja**.
6. **Lagemonitor am Telefon:** hoch, klein, quer, 200 % Schrift, Zoom 200 %.
   Abgeschlossen: **ja**.
7. **Beschädigter Speicher:** abgeschnittene Sammlung. Abgeschlossen: **ja**.

**Nicht prüfbar** und deshalb *nicht geprüft*: echte Handschuhe und nasse Finger,
Sonnenlicht und Dunkelheit am Display, Kamera-Scan, native Zeit- und
Datumsauswahl (der Testbrowser zeigt 12-Stunden-Zeit und Monat/Tag/Jahr, das
sagt nichts über Telefone mit deutscher Systemsprache), echte Bildschirmtastatur,
Zurück-Geste der installierten App, WebKit/Safari, echtes Drucken, Wake-Lock,
Offline nach geladenem Dienst (in diesem Lauf nicht erneut gemessen; Runde 9:
ja).

## Urteil

Der Kernweg trägt, und die Runde-9-Behebungen meiner Rolle halten alle. Der
Dialog „Bogen übergeben“ zeigt „QR-Code im Vollbild zeigen“ bei 180 × 320 bei
101 bis 169 px von 320 (Runde 9: 583 px). Die Schnellerfassung mit Typ
„Bergungsgruppe“ und nur Zahlen bleibt ohne Warnungen und ohne Hinweise in der
Karte. Der Lagemonitor rechnet alle Größen von einer Basis, die Summe ist
größer als ihre Beschriftung, kein Wortbruch in der Tabelle. Der Hinweis zum
beschädigten Speicher nennt jetzt „Sammlung „Hochwasser Musterstadt“ (etwa 2
Meldungen)“, sagt, dass nichts gelöscht ist, und nennt den Weg auf Papier. Die
Zahlenfelder lesen Komma, Minus und Text verständlich, die Schalter fragen
vor dem Leeren, die Wahl-Rückfragen zeigen bis zu drei Wege im festen Fuß.

Neu sind vier Kleinigkeiten (P3): das umbenannte Pflichtfeld „Ort der Einheit“
widerspricht den Hinweisen darunter, die weiter „Name“ sagen (R10-H1); die
Rückfrage „Beiseitegelegtes entfernen“ nennt nicht, was entfernt wird
(R10-H2); der Lagemonitor schreibt die Uhr ohne Doppelpunkt (R10-H3); und die
Rückfrage „Nur die Stärke melden?“ zählt „2 erfasste Personen“, wo der Bogen
9 Plätze trägt (R10-H4). Kein P0, kein P1, kein P2.

## Befunde

Zählung (ohne die Verweise unten): P0: 0 · P1: 0 · P2: 0 · P3: 4.

### R10-H1 [P3] Pflichtfeld heißt „Ort der Einheit“, die Hinweise darunter und die Schnellerfassung sprechen weiter vom „Namen“ (neu, Nebenwirkung der Umbenennung)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Wortlaut aus `innerText`, Bild `a2-1.png`,
Schnellerfassung `f1-2`); Wirkung auf den Helfer ist *Risiko*.

**Fundstelle / Aufgabe:** Schritt 1 „Einheit“, Block „Zugehörigkeit /
Kontaktstellen“, in „Neuen Bogen erstellen“, in „Einheit manuell erfassen…“ und
in „Einheit schnell erfassen“.

**Beobachtung:** Das Feld der untersten Ebene heißt „Ort der Einheit (Pflicht)“.
Direkt darüber steht „Aus Name, Organisation und Einheitstyp bildet sich die
Bezeichnung auf dem Bogen“, darunter die Warnung „⚠ Zugehörigkeit: Der Name der
eigenen Einheit (unterste Ebene) fehlt.“; die Schnellerfassung sagt „Es reichen
der Name der Einheit hier und die Stärke in Schritt 3“. Die Bezeichnung auf dem
Bogen („THW Pforzheim Bergungsgruppe“) bestätigt, dass „Ort“ gemeint ist. Die
Beschriftung bleibt „Ort der Einheit“ auch bei Ebene „LV – Landesverband“,
„RB – Regionalbereich“, „Freitext…“ und Organisation „Feuerwehr“ (für einen
Landesverband ist „Bremen, Niedersachsen“ kein Ort der Einheit). Eingetragen
verschwindet die Warnung.

**Erwartung der Rolle:** Das Feld, die Warnung und der Hinweis nennen dasselbe
Wort.

**Reaktion des Helfers:** „Ort — das ist der Einsatzort. Und die Warnung will
einen Namen?“ Wer am Meldekopf den Einsatzort einträgt, bekommt eine falsche
Bezeichnung auf dem Bogen.

**Folge im Einsatz:** Gering; die Warnung wird beim ersten Eintragen weg, die
Bezeichnung steht sichtbar auf der Karte. Am Meldekopf kann der Standort statt
des Heimatortes („Pforzheim“ gegen „Einsatzort Musterstadt“) in der Bezeichnung
landen.

**Empfehlung:** Warnung, Erklärsatz und Schnellerfassungs-Hinweis auf „Ort der
Einheit“ umstellen, im Feld einen Zusatz wie „Heimatort, z. B. Ulm — nicht der
Einsatzort“ zeigen; bei LV und RB das Wort „Name“ behalten.

**Nachprüfung:** Schritt 1 leer: Feld, Warnung und Erklärsatz tragen dasselbe
Wort; Ebene „LV“ wählen: Beschriftung passt zur Ebene.

### R10-H2 [P3] „Beiseitegelegte Einträge entfernen?“ nennt nicht, was entfernt wird (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Dialogtext, Bild `g5-2.png`).

**Fundstelle / Aufgabe:** Startseite mit abgeschnittener Sammlung → Hinweis
„Nicht lesbar: …“ aufklappen → „Beiseitegelegtes entfernen…“.

**Beobachtung:** Der Hinweis nennt „Sammlung „Hochwasser Musterstadt“ (etwa 2
Meldungen)“. Die Rückfrage dazu sagt „Die beiseitegelegten, unlesbaren Einträge
werden endgültig gelöscht; auch der beschädigte Text am alten Ort wird durch den
lesbaren Rest ersetzt.“ — ohne Namen, ohne Zahl. Fokus liegt auf „Abbrechen“,
„Daten sichern…“ wird genannt, die Knöpfe heißen „Endgültig entfernen“ und
„Abbrechen“.

**Erwartung der Rolle:** Vor dem endgültigen Löschen steht, was gelöscht wird:
„Sammlung „Hochwasser Musterstadt“ (etwa 2 Meldungen)“.

**Reaktion des Helfers:** „Welche Einträge? Ist das unser Einsatz?“

**Folge im Einsatz:** Gering; Fokus auf „Abbrechen“ und der Satz „vorher Daten
sichern“ fangen den Fehltipp ab.

**Empfehlung:** Namen und Zahl aus dem Hinweis in die Rückfrage übernehmen.

**Nachprüfung:** Abgeschnittene Sammlung setzen, „Beiseitegelegtes entfernen…“:
Rückfrage nennt „Hochwasser Musterstadt“.

### R10-H3 [P3] Lagemonitor schreibt die Uhr „25 1028 okt 26“ ohne Doppelpunkt und trennt den Tag vom Monat durch die Uhrzeit (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Bild `g3-telefon-200.png`, `c4-telefon.png`).
Wie Stab und Fernseher die Schreibweise lesen, ist *Annahme*.

**Fundstelle / Aufgabe:** `?lagemonitor=<id>`, Block „Uhr“.

**Beobachtung:** Die Uhr steht als „25 **1028** okt 26“ (Tag, Uhrzeit ohne
Doppelpunkt groß, Monat, Jahr). Die übrige App schreibt „10:28 Uhr“ und
„25.10.2026“.

**Erwartung der Rolle:** Uhrzeit mit Doppelpunkt oder „Uhr“, Datum zusammenhängend.

**Reaktion des Helfers:** Er liest „fünfundzwanzig, tausendachtundzwanzig“ und
braucht einen Blick, um „10:28“ zu erkennen. Wer die Datum-Zeit-Gruppe aus dem
Funk kennt, liest sie richtig.

**Folge im Einsatz:** Gering; am Fernseher mit Stab vertraut.

**Empfehlung:** „25.10.26 · 10:28 Uhr“ oder Datum klein über der Uhrzeit.

**Nachprüfung:** Lagemonitor öffnen: Uhrzeit mit Doppelpunkt, Datum in einem Stück.

### R10-H4 [P3] „Nur Stärke melden?“ zählt „2 erfasste Personen“, obwohl 9 Plätze vorbelegt sind (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Dialogtext aus `dialog[open]`).

**Fundstelle / Aufgabe:** Sammlung → „Einheit manuell erfassen…“ → Typ
„Bergungsgruppe“, Ort → Schritt 3 → „Nur Stärke (Meldekopf-Schnellerfassung)“.

**Beobachtung:** Schritt 1 sagt „Vorbelegt nach StAN: 9 Personen (Namen offen)“,
Schritt 3 zeigt 9 Plätze. Die Rückfrage sagt „2 erfasste Personen zählen dann
nicht mehr einzeln — die Stärke wird von Hand geführt und startet mit 0 / 2 / 7 /
9. Die Namen bleiben als Erreichbarkeiten erhalten.“ Mit dem Großbogen (38
Personen) stimmt die Zahl („38 erfasste Personen …“).

**Erwartung der Rolle:** Die Zahl in der Rückfrage passt zur Zahl auf dem
Bildschirm davor; leere Sollplätze heißen nicht „erfasste Personen“.

**Reaktion des Helfers:** „Zwei? Es sind doch neun.“

**Folge im Einsatz:** Gering; die Zahlen danach (0 / 2 / 7 / 9) stimmen.

**Empfehlung:** Bei Vorbelegung ohne Namen sagen „9 Sollplätze nach StAN werden
durch die Zahlen ersetzt“; „erfasste Personen“ nur für ausgefüllte Karten.

**Nachprüfung:** Neue Einheit mit Typ „Bergungsgruppe“, „Nur Stärke“: Rückfrage
nennt dieselbe Zahl wie Schritt 3.

### Verweise auf andere Berichte und bekannte Grenzen

Nicht doppelt gezählt, hier nur Stand:

- **Ecken-Knopf „◐ Ansicht“ hochkant** (R7-G4/M8): In der Sammlung liegt der feste
  Balken (170 × 44 px bei y = 590) über den Knöpfen einer aufgeklappten Karte
  („Bogen als PDF“, „Abrücken“, „Zug zuordnen“ bei y = 559 bis 655); unverändert.
- **Feste Leisten bei Zoom** (R9-G5): Fußleiste der manuellen Aufnahme (Zeile „In
  Einsatz übernehmen“ plus Weiter) 128 px; bei 360 × 640 20 %, 320 × 568 23 %, bei
  180 × 320 40 % der Höhe, bei 340 px Höhe (Tastatur nachgestellt) 34 %. Das
  fokussierte Feld bleibt über der Leiste (`scroll-padding-bottom` 160 px): Nr.,
  Zug und Zeit lagen bei 104 bis 180 px, Leiste ab 226 px. Stand: teilweise,
  bedienbar.
- **Sollstärke zählt mit** (R8-A1): „Davon 1 Einheit nur Sollstärke, nicht
  gemeldet (9 Personen) — zählt in der Summe mit“ am Monitor-Kopf der Sammlung,
  Marke „Sollstärke, nicht gemeldet“ an der Karte; verständlich, Stand: bekannte
  Grenze mit Marke.
- **Ziffern der Schrittleiste** (R7-N9): Reiter 44 × 44 bis 73 × 44 px, Abstand 0,
  mit „offen“ und „✓“; unverändert.
- **Prellschutz** (R8-H5/S4): Hauptknopf einer Rückfrage ab etwa 900 ms im Skript
  getippt, wirkt; „Einheit manuell erfassen…“ nach dem Öffnen der Sammlung wirkte
  in je einem Lauf bei 300, 700, 1000 und 1500 ms (zwei Läufe), kein Verschlucken
  beobachtet. Ein Tipp auf „Nur Stärke melden“ direkt (ohne Wartezeit) nach dem
  Öffnen der Rückfrage blieb wirkungslos, was dem Wert „600 ms“ entspricht.
- **Uhrstand in der Zukunft** (R6-O9), **Geräteuhr-Warnung bei 200 % und
  320 × 568** (R7-G8/H9), **kein Zusammenführen-Tipp** (R7-N1), **klebende
  Namensspalte** (R8-M6, R9-M3): nicht geprüft.

## Bestätigtes

- **Kernweg neuer Bogen:** „Bergungs“ tippen, Vorschläge „B Bergungsgruppe“,
  „B (ASH) Bergungsgruppe (Abstützsystem Holz)“ und „FGr BT …“ (je 44 px und höher);
  Zeitraum ist mit heute vorbelegt, „Ort/Auftrag ist noch leer“, Schritt 3 meldet
  „7 Personenkarten ohne Angaben zählen in die Stärke — ausfüllen oder entfernen“
  und bietet „9 leere Plätze entfernen“. Reiter tragen „1 ✓“, „3 offen“.
- **Neuladen mittendrin:** Nr. „7“, Zug „2. BZ Süd“, Typ „Bergungsgruppe“ und
  Ort „Pforzheim“ der manuellen Aufnahme stehen nach dem Neuladen wieder da („Entwurf
  vom 25.10.26 … wiederhergestellt“); die manuelle Aufnahme behält die Zettel-
  Angaben (R9-S1).
- **„Nur Sollplätze, keine gemeldete Stärke“:** „In Einsatz übernehmen“ ohne Zahlen
  → drei Wege („Stärke jetzt eintragen“, „Als Sollstärke ablegen“, „Abbrechen“) im
  Bild bei 360 × 640 (R9-W1). Danach Karte „Nr. 7 … 2. BZ Süd“ mit Marke
  „Sollstärke, nicht gemeldet“; Summe 68 mit Satz zum Anteil.
- **Zahlenfelder (R9-E1):** „3,5“ → 4 mit „„3,5“ auf ganze Zahlen gerundet: 4.“,
  „-2“ → „Minus geht nicht — „-2“ wurde nicht übernommen“, „abc“ → „„abc“ ist
  keine Zahl — nicht übernommen.“; `inputmode` numerisch, Weiter-Taste „next“. 600
  Mannschaft bei 38 Personen: „⚠ Stärke: 600 Mannschaft — stimmt das?“; leeres Feld
  wird 0 und löst „mehr Führer als Mannschaft“ und „Verpflegung übersteigt die
  Gesamtstärke“ aus.
- **Schalter mit Rückfrage (R9-D1):** „Sofortbedarf erfassen“ aus → „Sofortbedarf
  entfernen?“ mit „Diese Angaben gehen verloren: Diesel 620 l, Benzin 40 l, Gemisch
  20 l, Unterbringung, Ruhezeit.“ und „Sofortbedarf entfernen / Behalten“.
- **Bogen übergeben bei Zoom (R9-H1):** Dialog 172 px breit, Titel 1 Zeile (18 px),
  Hauptknopf 101 bis 169 px; bei 360 × 640 213 bis 257 px; 320 × 568 mit 200 %
  Schrift 161 bis 237 px. QR-Vollbild: „Teil 1 von 7“, „Weiter zu Teil 2 →“,
  „←“ 39 × 44 px, „Schließen“.
- **Fortsetzen bei Zoom (R9-H6):** 180 × 320 mit Großbogen: 217 bis 261 px von 320,
  ganz im Bild.
- **Schnellerfassung ohne Hinweisrauschen (R9-H2):** Typ „Bergungsgruppe“, Unterführer
  1, Mannschaft 5: keine Warnung in Schritt 3, in der Karte „Stärke 0 / 1 / 5 / 6“
  ohne „Hinweise“.
- **Lagemonitor (R9-H3):** 360 × 640 mit 200 % Schrift: alle Beschriftungen und
  Namen 22 px, Summe „1 / 15 / 43 // 59“ unterstrichen und fett; 320: 19,6 px;
  Zoom 200 %: 11 px bei Skalierung 2; quer 28 px. Kein Seitenüberlauf, F/U/M im
  Bild (rechte Kante 348 / 309 / 172 / 621 px), Tabelle bricht an Leerstellen
  („Heros Oberhausen-Rheinhausen / 22/51“). Optionen: „Stufe: Dunkel“, „Dunkler“,
  „Heller (weiß)“, „Vollbild“, „Schließen“. Ein Tipp auf „Lagemonitor öffnen“ öffnet
  einen zweiten Reiter mit `?lagemonitor=<id>`.
- **Beschädigter Speicher (R9-H4):** Hinweis „Nicht lesbar: Sammlung „Hochwasser
  Musterstadt“ (etwa 2 Meldungen). Liegt beiseite, fehlt in Listen und Zählung. ›“
  mit Aufklappen: „Beiseitegelegt heißt: nicht gelöscht, aber noch keine Kopie —
  erst „Daten sichern…“ legt eine Datei an (Downloads).“, „Weg zurück auf Papier:
  die letzte Sammel-PDF …“, „Daten sichern…“, „Beiseitegelegtes entfernen…“ mit
  Fokus auf „Abbrechen“. `eeb.unlesbar.v1` gesetzt.
- **Abrücken und Rückgängig:** Leiste „Abgerückt 14:33: Nr. 2 …“ mit „Rückgängig“ und
  „✕“; nach „Rückgängig“ „Wieder anwesend: Abrücken von Nr. 2 … zurückgenommen.“. Eine
  zweite, ältere Abrückung nimmt „Wieder anwesend“ an der Karte zurück; sie liegt
  nicht mehr in der Leiste, ist aber findbar.
- **„Einheit schnell erfassen“:** Rückfrage „für welche Sammlung?“ mit drei Wegen,
  danach derselbe Assistent mit Satz „Schnellerfassung: Es reichen der Name der
  Einheit hier und die Stärke in Schritt 3“ (siehe R10-H1).
- **Fokus über der Leiste:** Nr.-Feld, Zug-Feld und Zeitfeld stehen bei 340 px
  Höhe (Tastatur nachgestellt) mit Unterkante 116 bis 180 px über der Leiste ab
  226 px.

## Abgleich mit Runde 9

Grundlage: [../runde-9/feldtauglichkeit.md](../runde-9/feldtauglichkeit.md) samt
„Stand der Behebung“.

| Runde-9-Befund | Stand laut Bericht | Bewertung Runde 10 | Beobachtung |
| --- | --- | --- | --- |
| R9-H1 „Bogen übergeben“ bei Zoom 200 % | behoben | **hält** | Hauptknopf bei 101 bis 169 px von 320; Titel eine Zeile; Dialog 172 px. |
| R9-H2 Hinweisrauschen in der Schnellerfassung | behoben | **hält** | Keine Warnung in Schritt 3, keine Hinweise in der Karte. Rest: Zahl in der Rückfrage (R10-H4). |
| R9-H3 Monitor am Telefon bei großer Schrift | behoben | **hält** | Alle Größen von einer Basis (22 px bei 360 × 640 mit 200 % Schrift), Summe fett und unterstrichen, kein Wortbruch. |
| R9-H4 Wortlaut Beiseitelegen-Hinweis | behoben | **hält, Rest** | Nennt Namen, Zahl, Papier-Weg, „Daten sichern…“; die Entfernen-Rückfrage nennt sie nicht (R10-H2). |
| R9-H5 Folgetipp nach Seitenwechsel | behoben | **hält** | Kein Verschlucken bei 300 bis 1500 ms beobachtet (je ein Lauf, unter Last). |
| R9-H6 Fortsetzen bei Zoom 200 % | behoben | **hält** | 217 bis 261 px von 320. |

Zu den Runde-9-Änderungen anderer Rollen, soweit sie meinen Weg berührten:

| Runde-9-Änderung | Bewertung Runde 10 | Beobachtung |
| --- | --- | --- |
| Zahlenfelder lesen den Text selbst (Komma, Minus, Weiter-Taste) | **hält** | Gerundet mit Hinweis, Minus abgelehnt, Text abgelehnt, `inputmode` numerisch. |
| Schalter „Sofortbedarf erfassen“ mit Rückfrage | **hält** | Nennt die verlorenen Werte; „Funkrufname“ nicht gezielt geprüft. |
| Wahl-Rückfragen mit bis zu drei Wegen im festen Fuß | **hält** | „Nur Sollplätze“ und „Schnell erfassen: für welche Sammlung?“ ganz im Bild bei 360 × 640. |
| Rohtext-Rettung, „Beiseitegelegtes entfernen…“ | **hält, Rest** | Siehe R9-H4. Bei vollem Speicher nicht geprüft. |
| Rückwege (Stapel für Meldungen, Fahrzeug/Ebene im Sitzungsspeicher) | **teilweise geprüft** | Nur eine „Rückgängig“-Leiste zugleich; ältere Abrückung über „Wieder anwesend“ an der Karte. Fahrzeug/Ebene nach Neuladen nicht gezielt geprüft. |
| Manuelle Aufnahme behält Zettel-Angaben | **hält** | Nr., Zug, Typ, Ort nach Neuladen da; Zug „2. BZ Süd“ steht an Karte Nr. 7. |
| Sollstärke-Marke in Monitor/Kachel | **hält** | Kopf der Sammlung nennt „davon 1 Einheit nur Sollstärke“. CSV, Excel, Lageblatt nicht geprüft. |
| Zug-Normalisierung „n. Zug“, Umschrift in Personenliste | **nicht gezielt geprüft** | Gehört nicht zum Helferweg. |
| Lagemonitor (Telefon ohne Ort-Spalte, Stufentasten, Warnung bernstein) | **hält, Rest** | Stufentasten gesehen; Sperre von 1,5 s und bernsteinfarbene Warnung nicht gemessen. Uhrformat (R10-H3). |
| Layout bei Zoom 180 × 320, Druck-CSS, ASCII-Dateinamen | **teilweise geprüft** | Kein Seitenüberlauf in sieben Maßen; Druck und Dateinamen nicht geprüft. |
| Tipp-Sperre 600 ms nach Ansichtswechsel | **hält** | Siehe R9-H5. |
| main: „Ort der Einheit (Pflicht)“ | **Nebenwirkung** | Widerspricht den Hinweisen (R10-H1). |
| main: Einheiten-Anzahl-Fläche, linksbündige Organisationslisten | **nicht gezielt geprüft** | Auswahlliste der Organisation ist beim Antippen eine Systemliste; Anzahl-Fläche in dieser Prüfung nicht angesprochen. |

Bekannte Grenzen: siehe „Verweise auf andere Berichte und bekannte Grenzen“.

## Abschluss

- **Aufgabe geschafft:** Neuer Bogen bis Schritt 5: ja. Bogen übergeben mit QR
  in 7 Teilen: ja, auch bei Zoom 200 %. Einheit am Meldekopf aufnehmen
  (manuell, Sollstärke, Nur Stärke): ja. Unterbrechung durch Neuladen: ja.
  Abrücken und zurück: ja. Lagemonitor am Telefon: ja. Beschädigten Speicher
  bemerken: ja.
- **Fremde Hilfe nötig:** nein; beim beschädigten Speicher geht die Datei an den
  Betreuer, das sagt der Hinweis selbst.
- **Mentales Modell:** Papierbogen aus der Mappe, Fehlendes streichen, vorzeigen;
  am Meldekopf: Zettel abtippen, Zahlen zählen, Einheit ablegen.
- **Größtes Einsatzrisiko:** Kein P0, P1 oder P2. Am nächsten kommt R10-H1: Am
  Meldekopf kann der Einsatzort statt des Heimatortes der Einheit im Feld „Ort der
  Einheit“ landen, solange die Warnung „Name fehlt“ sagt.
- **Top-Priorität für die nächste Iteration:** Wortlaut zum Feld „Ort der Einheit“
  in Warnung, Erklärsatz und Schnellerfassung angleichen (R10-H1); danach die
  Zahl in der Rückfrage „Nur die Stärke melden?“ (R10-H4).

**Verständnisprüfung**

- Orientierung: **verstanden**. Schrittleiste mit Zustandswort, „Aufnahme für:
  Hochwasser Musterstadt“, Sammlung mit Summen und Hinweis zur Sollstärke.
- Nächster Schritt: **verstanden**. „Weiter →“, „In Einsatz übernehmen“, „Zur
  Übersicht →“, „Weiter zu Teil 2 →“.
- Systemzustand: **verstanden**. „✓ gespeichert · … nur auf diesem Gerät“,
  „Entwurf … wiederhergestellt“, Marke „Sollstärke, nicht gemeldet“, Hinweis zum
  beschädigten Speicher mit Namen. Uhrformat im Monitor uneinheitlich (R10-H3).
- Fehlerbehebung: **verstanden**. Rückfragen mit Folgen und Werten, „Rückgängig“,
  „Wieder anwesend“, gerundete und abgelehnte Zahlen mit Satz.
- Feldtauglichkeit: **geeignet, nicht vollständig geprüft**. Handschuhe,
  Sonnenlicht, Kamera-Scan, Bildschirmtastatur, native Zeit- und Datumsauswahl,
  Zurück-Geste der installierten App und echtes Drucken gehören in einen
  Praxistest.
