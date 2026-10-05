# Audit „Helfer im Feld“, Runde 3 (Feldtauglichkeit)

Stand: 04.10.2026 · Prüfer: Rollenaudit `thw-field-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/gifted-cray-ngieaz`, Commit 33ed426.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-2-Befunde ([../runde-2/README.md → Stand der Behebung](../runde-2/README.md#stand-der-behebung)).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--lang=de-DE`), `isMobile`/`hasTouch`, Locale de-DE. Grundeinstellung
Telefon 360 × 640 px, dazu 320 × 568, 390 × 844 und quer 640 × 360. Bedient
wurde mit `tap()`, jeder Lauf in einem eigenen Browser-Kontext mit frischem
Speicher. Zustände kamen über `localStorage`-Seeds aus `examples/thw/` mit
`uebung: false`: zwei Vorlagen (`eeb.vorlagen.v1`: FGr WP (A) Freiburg mit
10 Personen und 3 Fahrzeugen, B Ulm mit 8 Personen), ein Entwurf
(`eeb.entwurf.v1`, B Ulm bzw. FGr WP Freiburg) und eine Einsatz-Sammlung
„Hochwasser Neckar“ mit sechs Einheiten (`eeb.einsaetze.v1`). Getestet habe
ich zuerst ohne Blick in frühere Berichte. Den Runde-2-Bericht und die Tabelle
„Stand der Behebung“ habe ich erst danach gelesen und gezielt nachgeprüft.

Rolle: Helfer einer Fachgruppe, praktisch erfahren, bedient die App selten,
steht mit dem Telefon in einer Hand am Fahrzeug oder im Bereitstellungsraum
und wird zwischendurch gerufen. Die Einheit hat eine Vorlage auf dem Gerät.

Szenarien, jeweils vom natürlichen Einstieg aus:

1. **Mit Vorlage ausrücken:** Startseite → Vorlage „FGr WP (A) Freiburg“ →
   „Einsatz vorbereiten“ → Anwesende abhaken (zwei Helfer und ein Anhänger
   fehlen) → „Einsatz starten“ → Ort/Auftrag, „Einsatzbeginn eintragen“ →
   „Weiter →“ bis „Zur Übersicht →“ → „Bogen übergeben…“ → „QR-Code im
   Vollbild zeigen“. Abgeschlossen: **mit Schwierigkeiten** (R3-H1, R3-H2,
   R3-H4).
2. **Ohne Vorlage neu anfangen:** „Neuen Bogen erstellen“, „Weiter →“ ohne
   Eingaben. Abgeschlossen: **ja**, Einstieg mitten im Formular (R3-H1).
3. **Unterbrechung:** Mitten in Schritt 2 tippen und sofort neu laden; in
   Schritt 3 auf 1 500 px scrollen und neu laden; danach „Fortsetzen“. Online
   und offline (Service Worker aktiv). Abgeschlossen: **ja**.
4. **Fehlgriffe und Rückwege:** Browser-Zurück im Assistenten, nach „Neuen
   Bogen erstellen“ und im QR-Vollbild; „Verwerfen“, „Neuer Bogen“, Vorlage
   über einen angefangenen Bogen anlegen. Abgeschlossen: **ja**.
5. **Nachzügler eintragen:** In Schritt 3 „+ Person hinzufügen“, Wechsel auf
   „Schnelleingabe (Tabelle)“. Abgeschlossen: **mit Schwierigkeiten**
   (R3-H6).
6. **Am Meldekopf aushelfen:** „Einheit schnell erfassen (nur Stärke)…“ für
   die Sammlung; in der Sammlung eine Einheit „Abrücken“. Abgeschlossen:
   **ja**, Einstieg mitten im Formular (R3-H1).
7. **Feld und Nacht:** Themen „Feld“ und „Nacht“ auf Startseite, Assistent,
   Übersicht und QR-Vollbild. Abgeschlossen: **ja**.

**Nicht prüfbar** und deshalb als *nicht geprüft* markiert: echte
Handschuhe, nasse Finger, Sonnenlicht und Dunkelheit am echten Display,
Kamera-Scan (auch ob ein zweiteiliger Code am echten Scanner zügig
durchgeht), USB-Handscanner, Bildschirmtastatur und ihr Einfluss auf die
untere Leiste, native Datums- und Auswahllisten von Android/iOS, native
Builds, echtes Drucken. Die Datumsfelder rendert headless Chromium trotz
`--lang=de-DE` im US-Format („10/04/2026“); das werte ich nicht.

## Urteil

Die Kernaufgabe trägt. Wer die Vorlage seiner Einheit auf dem Gerät hat,
kommt mit rund einem Dutzend Tipps und der Eingabe des Einsatzorts vom Startbildschirm zum QR-Code: Musterung mit
großen Zeilen (294 × 64 px je Person), „Einsatz starten · 10 Pers · 3 Fz“
mit Zählung im Knopf, Schritt 2 mit Ort/Auftrag, Übersicht mit
„✓ Alle Angaben vollständig und plausibel“ oder einer antippbaren Liste
offener Punkte. Autospeicher, Entwurfsrettung nach Neuladen, Offline-Betrieb
nach rund 4 s Ladezeit, Rückfragen mit Namen und Rückholplatz halten. Die
großen Runde-2-Baustellen der Blickführung sind innerhalb des Assistenten
behoben: Jeder Schrittwechsel beginnt oben, offene Punkte setzen den Cursor
ins Feld, die Rückgängig-Leiste steht im Daumenbereich.

Übrig ist dasselbe Muster an einer anderen Stelle: **der Sprung von der
Startseite in eine Arbeitsansicht.** Die Startseite ist lang, die wichtigen
Knöpfe („Fortsetzen“ im Feld-Thema, „Einsatz vorbereiten“ an der Vorlage,
„Einheit schnell erfassen“) liegen unter dem Bildrand. Wer dorthin scrollt
und tippt, landet in Musterung, Assistent oder Schnellerfassung an derselben
Scrollposition, also mitten im Formular (R3-H1). In der Musterung fehlen
dann gerade die Führungskräfte oben in der Liste und die Stärke-Leiste.

Bei der Übergabe selbst stören zwei Dinge: Im QR-Vollbild hochkant verdeckt
die klebende Knopfleiste den Hinweis „Teil 1 von 2“ (R3-H2), und die App
vermerkt „Übergeben … — seitdem unverändert“, sobald der Code einen
Augenblick zu sehen war, auch wenn nur Teil 1 von 2 gezeigt wurde (R3-H3).

## Befunde

Zählung: P0: 0 · P1: 1 · P2: 5 · P3: 1.

### R3-H1 [P1] Von der Startseite aus öffnen Assistent, Musterung und Schnellerfassung mitten im Formular (neu, gleiche Ursache wie R2-H1)

**Priorität:** P1

**Kennzeichnung:** gemessen, in mehreren Läufen reproduziert.

**Fundstelle / Aufgabe:** Startseite → „Neuen Bogen erstellen“,
„Fortsetzen“, Vorlagenkarte „Einsatz vorbereiten“, „Einheit schnell
erfassen (nur Stärke)…“ → „Für ‚Hochwasser Neckar‘ erfassen“ (Szenarien 1,
2, 3, 6).

**Beobachtung:** Beim Wechsel von der Startseite in die Arbeitsansicht
bleibt die Scrollposition der Startseite stehen. Gemessen auf 360 × 640,
jeweils Scrollposition und Lage des ersten Inhalts danach:

| Einstieg | Startseite gescrollt | danach | Was über dem Bildrand liegt |
| --- | --- | --- | --- |
| „Neuen Bogen erstellen“ (Hand-Scroll 250 px) | 250 px | 250 px | Kopf, Speicherzeile, „1. Einheit“, „Organisation“ |
| Vorlage → „Einsatz vorbereiten“ | 819 px | 819 px | Kopf, Hinweis „Anwesende abhaken lassen …“, Stärke-Leiste 0 / 3 / 7 / 10, die ersten fünf Personen (alle drei Unterführer) |
| „Einheit schnell erfassen“ → Sammlung | 572 px | 572 px | Marke „Schnellerfassung · Aufnahme für: Hochwasser Neckar“, „Eingetroffen um (vom Meldeblock)“, „Organisation“ |
| „Fortsetzen“, Feld-Thema | 385 px | 385 px | Kopf, Datenschutzfrist-Hinweis, Überschrift „2. Einsatz“ |
| „Fortsetzen“, 320 × 568 Standard | 305 px | 305 px | wie oben |
| „Fortsetzen“, 320 × 568 Feld | 524 px | 524 px | wie oben, erstes Feld bei 67 px |

Nur wenn der Knopf ohne Scrollen im ersten Bild liegt (360 × 640 Standard,
„Fortsetzen“ bei 543 px), beginnt die Ansicht oben. Die Gegenprobe zeigt,
dass es anders geht: „Öffnen“ an der Einsatz-Sammlung landet bei 0 px, und
jeder Schrittwechsel innerhalb des Assistenten beginnt oben (R2-H1 behoben).
Der Kopf des Assistenten klebt nicht; nach dem Einstieg ist auch die Zeile
„✓ automatisch gespeichert“ nicht zu sehen.

**Reaktion des Helfers:** In der Musterung sieht er Sven Winkler bis
Dominik Ernst und darunter die Fahrzeuge, alle angehakt. Er nimmt die zwei
Fehlenden raus, die er sieht, und tippt unten „Einsatz starten“. Dass oben
noch fünf Personen stehen, darunter die Gruppenführerin, sieht er nicht. In
der Schnellerfassung sieht er „Organisationsname“ und „Einheitstyp“ statt
„Eingetroffen um“ und die Marke, für welche Sammlung er erfasst.

**Problem:** Die App zeigt einen Ausschnitt, der wie ein vollständiger
Bildschirm aussieht. Anfang, Zusammenfassung und Kontext liegen darüber.
Das trifft gerade die Wege, die ein Helfer im Feld am häufigsten nimmt,
denn deren Knöpfe liegen fast immer unter dem ersten Bild (siehe R3-H5).

**Folge im Einsatz:** In der Musterung kann eine abwesende Person oben in
der Liste angehakt bleiben; die Stärke-Leiste, die das auffangen würde,
steht nicht im Bild. Die Einheit meldet eine Person zu viel, im
ungünstigen Fall eine Führungskraft, die nicht da ist. In der
Schnellerfassung bleibt „Eingetroffen um“ leer, die App setzt dann die
Übernahmezeit.

**Empfehlung:** Jeden Wechsel von der Startseite in eine Arbeitsansicht
(Assistent, Musterung, Schnellerfassung, Fortsetzen) oben beginnen lassen,
wie beim Schrittwechsel: Kopf und Überschrift im Bild, Fokus auf die
Überschrift. Die Musterung sollte die Stärke-Leiste beim Scrollen sichtbar
halten.

**Nachprüfung:** Auf 360 × 640 die Startseite bis zur Vorlagenkarte
scrollen, „Einsatz vorbereiten“ tippen: Überschrift, Stärke-Leiste und
„Lisa Becker“ müssen ohne Scrollen sichtbar sein. Dasselbe für „Neuen Bogen
erstellen“ nach 250 px, „Fortsetzen“ im Feld-Thema und „Einheit schnell
erfassen“.

### R3-H2 [P2] QR-Vollbild: Knopfleiste verdeckt „Teil 1 von 2“, quer ist der Code oben abgeschnitten (neu, Folge der R2-M2-Behebung)

**Priorität:** P2

**Kennzeichnung:** gemessen; Folge für den Scan ist Risiko (Kamera nicht
prüfbar).

**Fundstelle / Aufgabe:** Übersicht → „Bogen übergeben…“ → „QR-Code im
Vollbild zeigen“, FGr WP (A) Freiburg mit 10 Personen (Szenario 1).

**Beobachtung:**
- Der Bogen braucht zwei Codes. Ohne Ort/Auftrag passt er in einen, mit
  „Hochwasser Neckar“ (17 Zeichen) sind es zwei. Die B Ulm mit 8 Personen
  passt in einen.
- **Hochkant 360 × 640:** Der Hinweis „Teil 1 von 2 — alle Teile
  nacheinander scannen lassen.“ steht bei 516–564 px, „Der Bildschirm
  bleibt an …“ bei 577–616 px. Die klebende Knopfleiste („← Voriger Teil“,
  „Nächster Teil →“, „Schließen“) liegt mit deckendem Hintergrund bei
  517–640 px darüber. Im ersten Bild ist von beiden Sätzen nichts zu sehen,
  erst nach 112 px Scrollen im Vollbild. Auf 320 × 568 genauso; dort
  überdeckt die Leiste zusätzlich den unteren weißen Rand des Codes bis auf
  rund 16 px. Auf 390 × 844 ist alles sichtbar.
- **Quer 640 × 360:** Der Code beginnt bei −39 px, die Kopfzeile bei
  −13 px. Mit Scrollposition 0 ist dieser Teil nicht erreichbar; die obere
  Ruhezone des Codes fehlt, die Positionsmarken stoßen an den Bildrand.
  „Schließen“ liegt bei 355–399 px halb unter dem Bildrand.

**Reaktion des Helfers:** Er hält das Telefon dem Meldekopf hin. Dass es
zwei Teile sind, verrät ihm nur der blasse Knopf „← Voriger Teil“. Er wartet
auf ein Zeichen der Gegenstelle oder schließt nach dem ersten Code.

**Problem:** Die Anzeige, die den Ablauf erklärt („Teil 1 von 2“), ist
genau die, die verdeckt wird. Quer ist der Code selbst beschnitten.

**Folge im Einsatz:** Der zweite Teil wird leicht vergessen; die
Gegenstelle hat dann keinen vollständigen Bogen und muss nachfragen. Quer
kann der Scan scheitern oder länger dauern (Risiko). Dass der Bogen durch
eine Ortsangabe von einem auf zwei Codes springt, ist für den Helfer nicht
vorhersehbar.

**Empfehlung:** „Teil 1 von 2“ groß in die Kopfzeile über den Code oder in
die Knopfleiste selbst setzen („Nächster Teil (2 von 2) →“). Die Knopfleiste
darf den Code und seine Ruhezone nie überdecken. Quer den Inhalt oben
beginnen lassen, nicht vertikal zentrieren, wenn er höher ist als der
Bildschirm.

**Nachprüfung:** Freiburg-Bogen mit Ort, 360 × 640 und 320 × 568: „Teil 1
von 2“ muss ohne Scrollen sichtbar sein. 640 × 360: Oberkante des Codes samt
weißem Rand ≥ 0 px.

### R3-H3 [P2] „Übergeben … — seitdem unverändert“ schon nach einem kurzen Blick auf den Code, auch bei Teil 1 von 2 (neu, Folge der R2-W2-Behebung)

**Priorität:** P2

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** QR-Vollbild öffnen und nach 0,3 s „Schließen“,
danach Übersicht und Startseite (Szenarien 1 und 4).

**Beobachtung:** Ohne dass jemand gescannt hat, steht in der Übersicht
„Übergeben 19:21 Uhr — seitdem unverändert.“ Beim zweiteiligen Bogen gilt
das ebenso, wenn nur „Teil 1 von 2“ gezeigt und nie auf „Nächster Teil →“
getippt wurde („Übergeben 19:29 Uhr — seitdem unverändert.“). Nach einer
Änderung meldet die Startseitenkarte richtig „⚠ Seit der Übergabe 19:21 Uhr
geändert — neu übergeben, damit der Meldekopf den Stand hat.“

**Reaktion des Helfers:** Er wurde beim Vorzeigen weggerufen. Später sieht
er „Übergeben 19:21 Uhr — seitdem unverändert“ und hakt die Meldung ab.

**Problem:** Die App kann nicht wissen, ob gescannt wurde, formuliert aber
so, als wüsste sie es. Der Vermerk aus R2-W2 ist nützlich für „seitdem
geändert“, als Bestätigung ist er zu stark.

**Folge im Einsatz:** Eine Einheit hält sich für gemeldet, der Meldekopf hat
sie nicht oder nur halb (Teil 1). Fällt erst bei der Kräfteabfrage auf.

**Empfehlung:** Ehrlich benennen, was passiert ist: „QR-Code gezeigt
19:21 Uhr“ bzw. „PDF erzeugt 19:21 Uhr“. Bei mehreren Teilen erst vermerken,
wenn alle Teile gezeigt wurden, sonst „Teil 1 von 2 gezeigt“. Optional beim
Schließen kurz fragen: „Hat die Gegenstelle alles gescannt? Ja / Noch nicht“.

**Nachprüfung:** Zweiteiligen Bogen öffnen, nur Teil 1 zeigen, schließen:
Die Übersicht darf nicht „Übergeben … unverändert“ melden.

### R3-H4 [P2] Musterung: alle Personen sind vorab angehakt, der Text sagt „Anwesende abhaken“ (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet; Folge ist Risiko.

**Fundstelle / Aufgabe:** Vorlage → „Einsatz vorbereiten“ (Szenario 1).

**Beobachtung:** Kopftext „Anwesende abhaken lassen — die Vorlage bleibt
unverändert.“ Darunter „Personal (10/10)“ und „Fahrzeuge (3/3)“, jede Zeile
schon angehakt. Der Knopf heißt sofort „Einsatz starten · 10 Pers · 3 Fz“.
Wer nichts anfasst, meldet die volle Vorlage. Der Sofortbedarf aus der
Vorlage ist dagegen richtig nicht angehakt (R2-W1).

**Reaktion des Helfers:** „Abhaken“ heißt für ihn: Ich mache Haken an die,
die da sind. Er sieht lauter Haken und nimmt an, das habe schon jemand
erledigt, oder er tippt auf Anwesende und entfernt damit gerade deren
Haken.

**Problem:** Anweisung und Vorgabe widersprechen sich. Zusammen mit R3-H1
(Liste beginnt mitten drin) wird die Musterung leicht übersprungen.

**Folge im Einsatz:** Zu hohe Stärke am Meldekopf, falsche Verpflegungs-
und Unterbringungszahlen.

**Empfehlung:** Text an die Vorgabe anpassen („Fehlende abwählen“) oder die
Vorgabe an den Text (alle aus, „Alle anwesend“ als ein Tipp). Die Zählung im
Knopf beibehalten, sie ist der beste Prüfpunkt.

**Nachprüfung:** Neuen Helfer die Musterung ohne Erklärung machen lassen:
Er muss die Abwesenden zuverlässig herausnehmen.

### R3-H5 [P2] Startseite: die Knöpfe des Helfers liegen unter dem Bildrand, die Vorlagen unter dem Meldekopf-Block (neu)

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Startseite mit Entwurf bzw. mit Vorlagen,
360 × 640 (Szenarien 1 und 3).

**Beobachtung:**
- „Fortsetzen“ der Entwurfskarte: Standard 543 px (im Bild), Nacht 548 px,
  **Feld 651 px** (unter dem Bildrand von 640 px). Darüber stehen Titel,
  Themenwahl und der Hinweis „Wird für den Offline-Betrieb geladen …“ bzw.
  „Jetzt offline bereit“.
- „Einsatz vorbereiten“ an der ersten Vorlage: Standard 1 069 px, Feld
  1 340 px, also 1,7 bzw. 2,1 Bildschirme tief. Davor kommen „Meinen Bogen
  ausfüllen“ und der ganze Block „Bögen sammeln (Meldekopf)“ mit drei
  Knöpfen. Ohne Vorlagen steht „Neuen Bogen erstellen“ beim ersten Aufruf
  bei 613 px, also halb angeschnitten.

**Reaktion des Helfers:** Er hat die Vorlage seiner Einheit gespeichert,
sieht sie aber nicht. Er tippt „Neuen Bogen erstellen“ und fängt von vorn
an, oder er scrollt und landet wegen R3-H1 mitten in der Musterung.

**Problem:** Die Reihenfolge der Startseite folgt den Rollen (eigener
Bogen, Meldekopf, Vorlagen), nicht der Häufigkeit. Für den Helfer mit
Vorlage ist „Einsatz vorbereiten“ der Hauptweg.

**Folge im Einsatz:** Zeitverlust und doppelte Erfassung; im Feld-Thema
ist selbst die Wiederaufnahme nach einer Unterbrechung nicht im ersten Bild.

**Empfehlung:** Gespeicherte Vorlagen direkt unter „Meinen Bogen
ausfüllen“ zeigen, vor dem Meldekopf-Block; bei einer Standard-Vorlage
„Einsatz vorbereiten: FGr WP (A) Freiburg“ als ersten Knopf. Im Feld-Thema
Titel und Offline-Hinweis verdichten, sodass „Fortsetzen“ im ersten Bild
steht.

**Nachprüfung:** 360 × 640, Feld-Thema, mit Entwurf: „Fortsetzen“
vollständig über 640 px. Mit Vorlage: „Einsatz vorbereiten“ im ersten oder
zweiten Bild (unter 640 px Seitenposition bzw. vor dem Meldekopf-Block).

### R3-H6 [P2] Nachzügler eintragen: 18 Bildschirme bis „+ Person hinzufügen“, die Tabelle hilft am Telefon nicht (Wiederaufnahme von R2-N8)

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Schritt 3 „Personal“, FGr WP (A) mit 10 Personen,
Ansicht „Detail-Karten“ (Szenario 5).

**Beobachtung:** Die Seite ist 12 070 px hoch, „+ Person hinzufügen“ steht
bei 11 575 px, also rund 18 Bildschirme tief. Im Feld-Thema ist eine
Personenkarte rund 1 700 px hoch. Nach dem Tippen erscheint „Person 11 von
11“ im Bild, der Fokus bleibt auf dem Knopf (Tastatur geht nicht auf, das
ist in Ordnung). „Schnelleingabe (Tabelle)“ kürzt die Seite auf 2 971 px,
zeigt auf 360 px aber nur „Stelle / Vorname / Nachname“; jede Zeile ist
160–215 px hoch, „Zählt als“ und die weiteren Spalten liegen seitlich außer
Sicht. Über der Liste stehen zwei Auswahlgruppen („Personal vollständig
erfassen / Nur Stärke (Meldekopf-Schnellerfassung)“ und „Detail-Karten /
Schnelleingabe (Tabelle)“) sowie „Namen einfügen…“.

**Reaktion des Helfers:** „Ich will nur noch Jan Meyer dazuschreiben.“ Er
wischt lange, bevor er den Knopf findet. „Detail-Karten“ und „Schnelleingabe
(Tabelle)“ sind für ihn Programmbegriffe.

**Problem:** Der häufige Fall im laufenden Einsatz (eine Person dazu, eine
weg) kostet am meisten Weg.

**Folge im Einsatz:** Zeit und Aufmerksamkeit; Nachzügler werden eher
mündlich gemeldet als im Bogen nachgetragen, der Bogen veraltet.

**Empfehlung:** „+ Person hinzufügen“ zusätzlich oben über der Liste
anbieten; Karten standardmäßig zugeklappt (Name, Funktion, Zählt als) und
erst beim Antippen voll. Die Ansichtswahl in Alltagssprache („Kurz-Liste /
Alle Angaben“).

**Nachprüfung:** 360 × 640, 10 Personen: Eine elfte Person mit Namen und
„Zählt als“ in höchstens drei Bildschirmen Weg anlegen.

### R3-H7 [P3] Kleinere Stolpersteine (teils Wiederaufnahme von R2-N9 und R2-H9)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Beobachtung:**
- Schritt 1 bei Organisation THW: „Organisationsname“ zeigt jetzt
  „z. B. THW Ortsverband Ulm“, „Einheitstyp“ aber weiter „z. B. Löschzug,
  SEG Sanität“ (auch in der Schnellerfassung).
- Übersicht: Der Knopf heißt „Neuer Bogen“, die Rückfrage „Bogen
  schließen?“ und führt zur Startseite („Einen neuen Bogen beginnst du auf
  der Startseite.“). Text und Wirkung stimmen jetzt, nur der Knopfname nicht.
- „Sonstiges (Freitext)“ wird aus der Vorlage übernommen: „2 Sollplätze
  unbesetzt. Anh Plane/Spriegel in Instandsetzung — nicht mit ausgerückt.“
  Nach der Musterung mit einem Helfer weniger stimmt die Zahl nicht mehr,
  die App weist nicht darauf hin.
- QR-Vollbild im Nacht-Thema: weiße Platte von 331 × 331 px auf dunklem
  Grund. Für den Scan nötig, nachts blendet es (am echten Display nicht
  geprüft).

**Reaktion des Helfers:** Kurzes Zögern bei „Löschzug“ im THW-Bogen; bei
„Neuer Bogen“ erwartet er einen leeren Bogen und steht auf der Startseite.
Den alten Sonstiges-Text liest er nicht mehr.

**Folge im Einsatz:** Gering; beim Sonstiges-Text eine falsche Angabe im
übergebenen Bogen.

**Empfehlung:** Einheitstyp-Beispiel je Organisation („z. B. Bergungsgruppe,
FGr Wasserschaden/Pumpen“). Knopf „Bogen schließen“ nennen. In der
Musterung den übernommenen Sonstiges-Text als Kästchen „aus der Vorlage
übernehmen“ zeigen wie den Sofortbedarf.

**Nachprüfung:** THW wählen, Platzhalter lesen; „Neuer Bogen“ tippen und
Wirkung mit Namen vergleichen; Vorlage mit Sonstiges-Text mustern.

## Bestätigtes

- **Schrittwechsel beginnt oben:** Nach „Einsatz starten“, „Weiter →“ und
  Tippen in der Schrittleiste steht die Überschrift bei 0 px Scroll im Bild,
  auch aus 250 px heraus.
- **Offline:** „⏳ Wird für den Offline-Betrieb geladen — bitte mit Netz
  geöffnet lassen“ wechselt nach rund 4 s auf „✓ Jetzt offline bereit“. Mit
  abgeschaltetem Netz lädt die App neu, Musterung, Übersicht und „PDF
  erzeugen“ funktionieren („✓ PDF gespeichert: eeb-041925okt26_THW_Freiburg_…pdf
  — liegt im Download-Ordner des Browsers“).
- **Autospeicher:** In Schritt 2 „Sturm Ulm Süd“ getippt und sofort neu
  geladen: Die Startseite steht oben, die Karte zeigt „gespeichert 19:25 Uhr“,
  „Fortsetzen“ öffnet Schritt 2 mit dem Text.
- **Offene Punkte:** „Ort/Auftrag ist noch leer.“ (149 × 44 px) springt in
  Schritt 2, der Cursor steht im Feld (bei 250 px), Getipptes landet dort.
  Der Übergabe-Dialog zeigt „⚠ 1 offener Punkt — ansehen · Übergeben ist
  trotzdem möglich“ und darunter sofort „QR-Code im Vollbild zeigen“.
- **Zurück-Taste:** „Neuen Bogen erstellen“ → Zurück führt zur Startseite;
  im Assistenten geht Zurück schrittweise; im QR-Vollbild führt Zurück auf
  die Übersicht.
- **Rückfragen:** „Verwerfen“, „Neuer Bogen“ und „Einsatz vorbereiten“ über
  einem angefangenen Bogen nennen den Bogen und den Rückholplatz
  („bleibt auf der Startseite unter ‚Zuletzt verdrängten Bogen zurückholen‘
  erreichbar“).
- **Musterung:** Ganze Zeile als Ziel (294 × 64 px), Funktion unter dem
  Namen, Stärke-Leiste zählt mit (0 / 3 / 5 / 8 nach zwei Abwahlen), Knopf
  „Einsatz starten · 8 Pers · 2 Fz“.
- **Kopf:** Standard 360 × 640 Unterkante 131 px, Schrittleiste einzeilig mit
  Haken, Datumsfelder 294 px breit.
- **Meldekopf:** „Abrücken“ quittiert unten mit „Rückgängig“ 108 × 44 px bei
  566 px; „Öffnen“ der Sammlung beginnt oben.
- **QR-Vollbild:** Einheit, Stärke und Stand über dem Code; „Der Bildschirm
  bleibt an — Display-Helligkeit hoch stellen hilft beim Scannen.“
- **Hinweise zur Aktualität:** Datenschutzfrist-Band mit Datum und Resttagen;
  abgelaufener Einsatzzeitraum als offener Punkt statt „✓ plausibel“.

## Abgleich mit Runde 2

Grundlage: [../runde-2/feldtauglichkeit.md](../runde-2/feldtauglichkeit.md)
und [../runde-2/README.md → Stand der Behebung](../runde-2/README.md#stand-der-behebung).

| Runde-2-Befund | Stand laut README | Bewertung Runde 3 | Beobachtung |
| --- | --- | --- | --- |
| R2-H1 Schritt öffnet mitten im Formular | behoben | **hält, aber Muster lebt weiter** | Innerhalb des Assistenten beginnt jeder Schritt oben. Der Einstieg von der Startseite übernimmt die Scrollposition weiter (R3-H1). |
| R2-H2 Offener Punkt ohne Cursor | behoben | hält | Cursor im Feld Ort/Auftrag, Eingabe kommt an. |
| R2-H3 Startseite nach Neuladen | behoben | hält | Nach Neuladen aus 1 500 px steht die Startseite bei 0 px, Karte mit „Fortsetzen“ im Bild (Standard). Im Feld-Thema liegt „Fortsetzen“ bei 651 px knapp darunter (R3-H5). |
| R2-H4 Quittung außerhalb des Bilds | behoben | hält | „Rückgängig“ 108 × 44 px bei 566 px. |
| R2-H5 Geräte-Zurück | behoben | hält | Siehe „Bestätigtes“. Im QR-Vollbild schließt Zurück Vollbild und Übergabe-Dialog und zeigt die Übersicht; das erfüllt die Runde-2-Nachprüfung. |
| R2-H6 Übergabeknöpfe unter dem Bild | behoben | hält | Offene Punkte eingeklappt, „QR-Code im Vollbild zeigen“ bei 246 px. |
| R2-H7 Kopf zu hoch | weitgehend | hält (Standard) | 131 px im Standard-Thema. Im Feld-Thema nicht am Seitenanfang gemessen, weil der Einstieg mitten im Schritt landete (R3-H1). |
| R2-H8 Datumsfelder zu schmal | behoben | hält | 294 px je Feld; Datumsformat headless nicht wertbar. |
| R2-H9 Rückfragen und Stolpersteine | behoben | **teilweise** | Rückfragetext stimmt jetzt; der Knopf heißt weiter „Neuer Bogen“ (R3-H7). |
| R2-N7 Rückwege / Fortsetzen | behoben | hält | „Fortsetzen“ öffnet den zuletzt offenen Schritt (Schritt 2 bzw. 3). |
| R2-N8 Erstes Namensfeld tief | behoben | **teilweise** | Sollstelle im Kartenkopf („Person 1 von 10 · GrFü“). Seite weiter 12 070 px, Tabelle rollt seitlich (R3-H6). |
| R2-N9 Begriffe und Platzhalter | weitgehend | **teilweise** | Organisationsname angepasst, Einheitstyp weiter „z. B. Löschzug, SEG Sanität“ bei THW (R3-H7). |
| R2-O1 Offline-Zusage zu früh | behoben | hält | Ladehinweis → „Jetzt offline bereit“ nach rund 4 s, Offline-Neustart funktioniert. |
| R2-W1 Sofortbedarf aus Vorlage | behoben | hält | „Diesel 180 l“ als Kästchen, Vorgabe aus. Der Sonstiges-Text wird dagegen ungefragt übernommen (R3-H7). |
| R2-W2 Übergabestand | behoben | **wirkt, schießt über** | „Seit der Übergabe … geändert — neu übergeben“ ist hilfreich. „Übergeben … unverändert“ entsteht aber schon durch bloßes Öffnen des Codes, auch bei Teil 1 von 2 (R3-H3). |
| R2-W6 QR-Vollbild mit Einheit, Stärke, Stand | behoben | hält | Kopfzeile im Vollbild vorhanden. |
| R2-M2 QR-Vollbild rollt nicht | behoben | **verkehrt (teilweise)** | Das Vollbild rollt, die Knopfleiste klebt unten, verdeckt dadurch aber hochkant „Teil 1 von 2“. Quer zweispaltig, doch der Code beginnt bei −39 px (R3-H2). |
| R2-S1 Alter Entwurf als „plausibel“ | behoben | hält | Abgelaufener Zeitraum steht als offener Punkt in der Übersicht. |
| R2-N2 Namen einfügen | behoben | nicht nachgeprüft | In dieser Runde nicht bedient. |

Einordnung der eigenen Befunde: R3-H1 ist neu, hat aber dieselbe Ursache
wie R2-H1 und R2-H3 an einer noch nicht behandelten Stelle. R3-H2 ist eine
Folge der R2-M2-Behebung, R3-H3 eine Folge der R2-W2-Behebung. R3-H4 und
R3-H5 sind neu. R3-H6 nimmt R2-N8 wieder auf, R3-H7 Reste von R2-N9 und
R2-H9.

Bilanz: Von den neun eigenen Runde-2-Befunden (R2-H1 bis R2-H9) halten acht,
R2-H9 ist teilweise umgesetzt. Von den übrigen nachgeprüften Behebungen
halten fünf, drei wirken teilweise (R2-N8, R2-N9, R2-W2), und eine hat
sich teilweise verkehrt (R2-M2).

## Abschluss

- **Aufgabe geschafft:** Mit Vorlage bis zum QR-Code: ja, mit
  Schwierigkeiten (R3-H1, R3-H2, R3-H4). Neuer Bogen: ja. Wiedereinstieg
  nach Neuladen, online und offline: ja. Nachzügler eintragen: ja, mit viel
  Scrollen (R3-H6). Schnellerfassung am Meldekopf: ja.
- **Fremde Hilfe nötig:** nein.
- **Mentales Modell:** Papierbogen aus der Mappe holen (Vorlage), Fehlende
  streichen, Ort eintragen, vorzeigen. Jede neue Seite beginnt oben. Die
  App bedient das inhaltlich gut; beim Sprung von der Startseite und bei der
  Mehrteil-Übergabe weicht die Bildschirmführung davon ab.
- **Größtes Einsatzrisiko:** Eine zu hohe Stärke aus der Musterung, weil die
  Liste mitten drin beginnt und alle vorab angehakt sind (R3-H1 mit R3-H4).
  Danach eine nur halb übergebene Meldung, die die App als „Übergeben“
  vermerkt (R3-H2 mit R3-H3).
- **Top-Priorität für die nächste Iteration:** Jede Arbeitsansicht beginnt
  oben, auch beim Einstieg von der Startseite (R3-H1). „Teil x von y“
  unverdeckbar im QR-Vollbild (R3-H2).

**Verständnisprüfung**

- Orientierung: **unsicher**. Im Assistenten klar (Schrittleiste,
  Überschrift oben). Nach dem Einstieg von der Startseite fehlen Kopf und
  Überschrift (R3-H1).
- Nächster Schritt: **verstanden**. „Einsatz starten · n Pers · n Fz“,
  „Weiter →“, „Zur Übersicht →“, „Bogen übergeben…“ sind eindeutig.
- Systemzustand: **unsicher**. Speicherzeile und Offline-Hinweis sind klar;
  „Übergeben … unverändert“ behauptet mehr, als die App weiß (R3-H3), und
  „Teil 1 von 2“ ist verdeckt (R3-H2).
- Fehlerbehebung: **verstanden**. Rückfragen mit Namen, Rückholplatz,
  Rückgängig-Leiste und Zurück-Taste tragen.
- Feldtauglichkeit: **eingeschränkt, nicht vollständig geprüft**. Offline,
  Autospeicher und Übergabe tragen. Handschuhe, Sonnenlicht, Kamera-Scan
  zweiteiliger Codes und native Builds gehören in einen Praxistest.

## Stand der Behebung

Stand 05.10.2026, Paket „Rückmeldungen im Bild, Scrollposition, Doppeltipp,
Rückgängig". Geprüft mit Typprüfung, Unit-Tests (2 352 grün) und Nachmessung
im Dev-Server (360 × 640, 320 × 568, 640 × 360, `isMobile`/`hasTouch`,
de-DE). Aufgeführt sind nur die Befunde dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R3-H1 Von der Startseite aus mitten im Formular | behoben | Jeder Wechsel der Ansicht (Assistent, Musterung, Schnellerfassung, „Fortsetzen“) beginnt oben, der Fokus liegt auf der Überschrift; ein Sprung auf ein Feld (R2-H2) hat Vorrang. Stärke-Leiste der Musterung klebt einzeilig oben (90 px). Nachlauf (360 × 640, 320 × 568, 640 × 360): „Einsatz vorbereiten“ von 840/963/711 px → 0 px, Überschrift bei 64/64/56 px, „Lisa Becker“ bei 381/381/338 px; Leiste nach 800 px Rollen bei 0 px; „Eingetroffen um“ bei 208 px (quer 161 px). |
| R3-H5 Knöpfe des Helfers unter dem Bildrand, Vorlagen hinter dem Meldekopf | weitgehend | „Meinen Bogen ausfüllen“ bietet bis zu zwei Vorlagen als „Einsatz vorbereiten: <Name>“ an; Offline-Hinweis unter der Entwurfskarte; Zeichen neben dem Namen. Nachlauf: „Fortsetzen“ 360 × 640 Standard 367–411 px (vorher 540–584), Feld 473–527 px (649–703); „Einsatz vorbereiten“ bei 706 px statt 1 401 px. Offen: 320 × 568 im Feld-Modus steht „Fortsetzen“ bei 599–653 px, noch unter dem Rand. |
| R3-H6 Nachzügler: 18 Bildschirme bis „+ Person hinzufügen“ | weitgehend | Ab zwei Personen steht „+ Person hinzufügen“ auch über der Liste; ein Tipp springt zur neuen Karte, Cursor im Vornamen. Ansichtswahl „Alle Angaben (Karten)“ / „Kurz-Liste (Tabelle)“. Nachlauf (FGr WP (A), 10 Personen): Knopf bei 524/528/402 px statt 11 531/12 615/6 311 px; nach dem Tipp „Person 11 von 11“, Vorname bei 75 px, „Zählt als“ bei 225–293 px, Weg höchstens ein Bildschirm. Offen: Karten standardmäßig zugeklappt. |
