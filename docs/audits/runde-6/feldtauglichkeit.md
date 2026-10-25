# Audit „Helfer im Feld“, Runde 6 (Feldtauglichkeit)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-field-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 03a0011.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-5-Befunde ([../runde-5/README.md → Stand der Behebung](../runde-5/README.md#stand-der-behebung)).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch`, Locale de-DE, Zeitzone Europe/Berlin. Grundeinstellung
Telefon 360 × 640 px, dazu 320 × 568 und quer 640 × 360. Bedient wurde mit
`tap()` bzw. `touchscreen.tap()` auf Koordinaten (für Doppeltipps), jeder Lauf
in einem eigenen Browser-Kontext mit frischem Speicher. Elf weitere Prüfer
nutzten denselben Server; **Zeitangaben sind deshalb nur grob und unter Last
gemessen.** Zustände kamen über `localStorage`-Seeds mit `uebung: false`:
Vorlage (`eeb.vorlagen.v1`) aus `examples/thw/` (001 Albstadt Zugtrupp mit 4
Personen, der Großbogen „Verstärkter Bergungszug“ Oldenburg mit 38 Personen,
10 Fahrzeugen und 6 QR-Teilen) und Bögen anderer Organisationen (DRK BHP 25
Behandlung Gelb, Feuerwehr Niedersachsen Gruppe, Katastrophenschutz Bayern
ABC-Abwehr, DLRG Führungstrupp, ASB Betreuungskomponente, BBK Logistikzug,
Patiententransportgruppe und Behandlungsbereitschaft mit 66 Personen,
Bundeswehr Panzerpionierzug mit 43 Personen). Für echtes Offline lief vor dem
Server ein kleiner Weiterleitungs-Proxy, den ich abschalten konnte
(`setOffline` erfasst den Service Worker nicht). Skripte und Bilder liegen im
Scratchpad unter `runde6/feld/`.

Reihenfolge: Ich habe den Runde-5-Bericht (samt „Stand der Behebung“) und die
Übersicht **vor** den Läufen gelesen, weil ich zuerst dort den Prüfaufbau
nachschlug; der Blindtest ist damit nicht vollständig. Gegenmaßnahme: Alle
Läufe sind frisch gemessen und folgen den Aufgaben, nicht den Befunden; die
Befunde R6-H1 bis H6 sind nicht aus Runde 5 abgeleitet. Die anderen
Runde-6-Berichte habe ich erst nach den Messungen angesehen (soweit schon
vorhanden).

Rolle: Helfer einer Bergungsgruppe, praktisch erfahren, bedient die App
selten, steht mit dem Telefon in einer Hand am Fahrzeug und wird
zwischendurch gerufen.

Szenarien, jeweils vom natürlichen Einstieg aus:

1. **Mit Vorlage ausrücken:** „Einsatz vorbereiten: Meine Einheit“ →
   Musterung → „Bogen anlegen“ → Ort → „Weiter →“ bis Übersicht → „Bogen
   übergeben…“ → „QR-Code im Vollbild zeigen“ → „Schließen“ → „Ja, gescannt —
   übergeben“ → Neuladen. Abgeschlossen: **ja**.
2. **Musterung mit „Alle abwählen“:** 38, 43 und 66 Personen; alle abwählen,
   acht anhaken, anlegen; beide Gruppen leer anlegen. Abgeschlossen: **ja**.
3. **Großbogen in sechs Teilen:** QR-Vollbild bei 360 × 640, 320 × 568 und
   640 × 360; Doppeltipp, Tipp-Abstände 150 bis 1 700 ms, „Schließen“ nach
   Teil 6 binnen 300 ms, Browser-Zurück, Drehen, Bestätigung, Neuladen.
   Abgeschlossen: **ja**.
4. **Offline:** Laden bis „Jetzt offline bereit“, Netz aus, Neuladen, ganzer
   Weg bis zum bestätigten Mehrteiler (14 Personen, 4 Teile), Neuladen
   offline. Abgeschlossen: **ja**.
5. **Kurz-Liste ab 13 Personen:** Schritt 3 bei 11, 12, 15, 38 und 66
   Personen. Abgeschlossen: **ja**.
6. **Bögen anderer Organisationen:** Musterung, Dialog und Vollbild mit 1 bis
   6 Teilen. Abgeschlossen: **ja**.
7. **Sicht und Schrift:** Musterung bei 200 % Schrift (hoch und quer).

**Nicht prüfbar** und deshalb als *nicht geprüft* markiert: echte
Handschuhe, nasse Finger, Sonnenlicht und Dunkelheit am echten Display,
Kamera-Scan (auch ob sechs Teile am echten Gerät mit der 1,5-s-Mindestzeit
sicher lesen), USB-Handscanner, Bildschirmtastatur und ihr Einfluss auf die
untere Leiste, native Datums- und Auswahllisten von Android/iOS,
WebKit/Safari, native Builds, echtes Drucken, Wake-Lock am echten Gerät. Die
Datumsfelder rendert headless Chromium im US-Format; das werte ich nicht.
Alle Zeiten stammen aus einem Rechner unter hoher Last und gelten als
unsicher.

## Urteil

Die Kernaufgabe trägt, auch am Großbogen und ohne Netz, und das neue
QR-Vollbild löst genau das Risiko, das in Runde 5 oben stand. Ein Doppeltipp
auf „Weiter zu Teil n →“ überspringt keinen Teil mehr (Tipp 150 ms nach dem
ersten: Teil bleibt; die Stelle nimmt etwa 1,5 s nichts an), und ein Teil, der
nur aufblitzte, zählt nicht als gezeigt: Wer sich in 1,6-s-Schritten durch
sechs Teile klickt und nach Teil 6 sofort „Schließen“ tippt, liest „Teil 6 von
6 wurde noch nicht gezeigt. Ohne ihn hat die Gegenstelle den Bogen nicht.“ mit
„Teil 6 von 6 zeigen“ / „Trotzdem schließen“; wer schon den ersten Teil nach
0,4 s weitergeschaltet hat, wird beim Schließen auf Teil 1 zurückgeschickt.
Browser-Zurück öffnet dieselbe Rückfrage, Drehen hält den Teil.
„Trotzdem schließen“ legt keinen Übergabevermerk an, der Bogen gilt dann nicht
als übergeben.

Die Musterung ist mit „Alle abwählen“ und der klebenden Kopfzeile („Personal
(8/38)“) für die Fälle „nur ein Teil rückt aus“ brauchbar geworden; ab 13
Personen beginnt Schritt 3 mit der Kurz-Liste. Der Weg von der Vorlage bis zum
bestätigten Code bleibt bei acht Tipps plus Ort. Das Bestätigen und das
Neuladen („✓ Übergeben 13:15 Uhr (bestätigt) — seitdem unverändert“) laufen
online und offline gleich.

Offen ist eine Lücke in der neuen Tipp-Sperre: An „Weiter →“ im Schritt 3
erscheint beim Nachtipp der Hinweis „Einen Moment …“. Im QR-Vollbild liegt er
im Bild nicht sichtbar (R6-H1). Sonst nur Kleinigkeiten: eine Rückfrage, die die
Mindestzeit nicht erklärt (R6-H2), lange Listen bei 12 Personen (R6-H3), die
klebende Kopfzeile bei großer Schrift und quer (R6-H4), leer anlegbare
Musterung (R6-H5) und der erste Knopf quer (R6-H6). Weder P0 noch P1.

## Befunde

Zählung (ohne die Verweise unten): P0: 0 · P1: 0 · P2: 1 · P3: 5.

### R6-H1 [P2] Nachtipp im QR-Vollbild bleibt stumm: „Einen Moment …“ liegt hinter dem Vollbild (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet (Bild nach dem zweiten Tipp im Vollbild ohne
Hinweis; Element im Seitenbaum vorhanden, Oberkante 457 px, im Bild nicht zu
sehen).

**Fundstelle / Aufgabe:** Großbogen, „QR-Code im Vollbild zeigen“, „Weiter zu
Teil n →“ (Szenario 3). Code: Hinweis `.tipp-moment` (Tipp-Sperre,
`src/app/tipp-schutz.ts` und Aufrufer), Vollbild in
`src/app/schritte/uebersicht.tsx`.

**Beobachtung:** Im Schritt 3 bis 5 zeigt ein zweiter Tipp innerhalb 1,5 s
über dem Knopf „Einen Moment …“ (Bild 19-sperre). Im QR-Vollbild lässt der
zweite Tipp (150 bis 1 200 ms später) den Teil unverändert, aber das Bild
zeigt nichts: Der Hinweis steht im Seitenbaum (sichtbar, Deckkraft 1,
z-index 60), wird aber vom Vollbild verdeckt (Bild 21-weiter-toast, 22-toast-300).
Ein Tipp 700 ms nach dem ersten bleibt ebenfalls ohne jede Rückmeldung. Auch
„Schließen“ unmittelbar (unter 300 ms) nach „Teil n zeigen“ wird ohne
Hinweis verworfen.

**Reaktion des Helfers:** Er tippt „Weiter zu Teil 3 →“, sieht Teil 2, tippt
noch einmal, weil Teil 2 vielleicht nicht gescannt wurde, und es passiert
nichts. Er hält die App für hängend und tippt ein drittes Mal, ein viertes
Mal.

**Problem:** Die Sperre schützt hier am wichtigsten Ort, erklärt sich aber
dort nicht. Außerhalb des Vollbilds hat die App das nach R5-S2 behoben.

**Folge im Einsatz:** Kein falscher Zustand (die Sperre hält), aber Zweifel
und Zeitverlust in dem Moment, in dem die Gegenstelle auf das Display
schaut; das Vollbild ist die Stelle, an der man nicht lange nachdenken soll.

**Empfehlung:** Den Hinweis im Vollbild selbst anzeigen (im Dialog, nicht in
der Ebene darunter) oder den Knopf für die 1,5 s sichtbar als „gesperrt“
darstellen (abgeblendet, Zähler). Ebenso nach „Teil n zeigen“.

**Nachprüfung:** Großbogen, Vollbild: Zweiter Tipp 150 ms nach dem ersten
zeigt „Einen Moment …“ im Bild (Aufnahme nach 100 ms).

### R6-H2 [P3] „Teil n von 6 wurde noch nicht gezeigt“ nennt die Mindestzeit nicht und widerspricht dem, was der Helfer sah (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Vollbild, „Schließen“ kurz nach dem Wechsel zu
einem Teil (Szenario 3). Code: `src/app/schritte/uebersicht.tsx` (Rückfrage
„Teil fehlt“, Mindestzeit R5-S1).

**Beobachtung:** Wer nach Teil 6 nach 300 ms „Schließen“ tippt, liest „Teil 6
von 6 wurde noch nicht gezeigt“, obwohl der Code auf dem Display stand. Von
der Mindestzeit steht im Vollbild nichts (kein „1,5 s“, kein Wort wie „lange
genug“). Nach „Teil 6 von 6 zeigen“ wird ein „Schließen“ innerhalb 300 ms
lautlos verworfen, erst nach rund 1,6 s kommt „Hat die Gegenstelle alle 6 Teile
gescannt?“. „Trotzdem schließen“ beendet ohne Vermerk (kein „✓ Übergeben“ auf
der Startseite).

**Reaktion des Helfers:** „Doch, den habe ich gerade gezeigt.“ Wer es eilig hat,
tippt „Trotzdem schließen“ und hat danach keinen Übergabevermerk.

**Problem:** Die Meldung stimmt technisch (der Teil zählte nicht), sagt es aber
anders, als es der Helfer erlebt hat. Die Regel ist nur im Verhalten sichtbar.

**Folge im Einsatz:** Gering; der Helfer zeigt Teile unnötig noch einmal oder
bestätigt am Ende von Hand. Am echten Gerät wird der Scan eher länger als
1,5 s dauern; ob die Hürde dort hindert, ist nicht geprüft.

**Empfehlung:** Text auf das Erlebte umstellen: „Teil 6 von 6 stand zu kurz im
Bild (unter 1,5 s) — noch einmal zeigen, bis die Gegenstelle ihn hat.“ Dazu
im Vollbild unter „Teil n von 6“ den gezeigten Teil kurz abhaken („✓ gezeigt“
nach 1,5 s), damit der Helfer die Regel sieht.

**Nachprüfung:** Teil 6 nach 300 ms schließen: Text nennt die Zeit; nach 1,6 s
zeigt das Vollbild „✓ gezeigt“ für den Teil.

### R6-H3 [P3] Karten bis 12 Personen: 14 458 px; Kurz-Liste ab 13: Zeile 197 px, 38 Personen 8 826 px (Rest von R5-H2)

**Priorität:** P3

**Kennzeichnung:** gemessen (`scrollHeight`).

**Fundstelle / Aufgabe:** Schritt 3 „Personal“ (Szenario 5). Code:
`src/app/schritte/personal.tsx`.

**Beobachtung:** Ab 13 Personen beginnt Schritt 3 mit der Kurz-Liste (15
Personen 4 419 px, 38 Personen 8 826 px, 66 Personen 14 748 px), die Karten
tragen oben „Viele Personen — die Kurz-Liste (eine Zeile je Person) zeigt mehr
auf einmal“. Mit 12 Personen (BBK Patiententransportgruppe) beginnt die App
noch mit Karten: 14 458 px, rund 23 Bildschirme. Die Zeile der Kurz-Liste ist
197 px hoch (Runde 5: 168 px); 38 Personen sind rund 14 Bildschirme. Die
Auswahl „Alle Angaben (Karten) / Kurz-Liste (Tabelle)“ liegt erst nach dem
ersten Bildschirm (Bild 12-kurz-s2). Die Felder Vorname, Nachname, „Zählt als“
und Geschlecht der Zeile haben keine sichtbaren Beschriftungen.

**Reaktion des Helfers:** Wer in der 38er-Liste eine Person ändern will,
scrollt lange; „Kurz-Liste“ liest er nicht als „schnelle Liste“.

**Problem:** Die Schwelle 13 greift gerade nach der längsten Kartenliste; die
Kurz-Liste ist wegen der Handschuhmaße kaum kürzer als zuvor je Person.

**Folge im Einsatz:** Gering; nach der Musterung muss meist nichts geändert
werden, „Zur Übergabe →“ umgeht den Schritt.

**Empfehlung:** Schwelle auf etwa 8 Personen senken (Karten sind bei neun
Personen schon 10 000 px, siehe Mobile-UI-Notiz N6) und Zeilenhöhe der
Kurz-Liste prüfen.

**Nachprüfung:** 12 Personen: Schritt 3 beginnt in der Liste; eine Zeile
höchstens rund 150 px.

Verweis: Karten bei neun Personen 10 954 px in
[mobile-ui.md](mobile-ui.md) (N6).

### R6-H4 [P3] Musterung: Die klebende Kopfzeile nimmt bei 320 px 93, bei 200 % Schrift 238 px (hoch) bzw. 186 von 360 px (quer) (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (Oberkante und Höhe per `getBoundingClientRect`,
Bilder 17-sticky-*, 23-200-*).

**Fundstelle / Aufgabe:** Musterung, Vorlage mit mehr als 10 Zeilen (Szenario
2 und 7). Code: `src/app/vorlagen-ui.tsx`.

**Beobachtung:** Bei 43 Personen klebt „Personal (n/43)“ mit „Alle abwählen“
oben: 360 × 640 etwa 80 px, 320 × 568 93 px (der Knopf bricht unter die
Überschrift), 640 × 360 60 px. Bei 200 % Schrift sind es 238 px (hoch) und 186
px (quer), dazu die feste Leiste „Bogen anlegen“ (57 px): Im Querformat bleibt
eine Zeile Liste im Bild (Bild 23-200-640x360). Unter der Kopfzeile scheinen
am oberen Rand Reste der Stärke-Leiste („FÜHRER / UNTERF. / MANNSCH. / GESAMT“,
halb abgeschnitten) durch (Bild 17-sticky-640x360).

**Reaktion des Helfers:** Beim Abwählen sieht er „Personal (8/43)“ immer im
Bild und weiß, wie viele noch gelten. Bei großer Schrift und quer bleibt zu
wenig Liste zum Abhaken.

**Problem:** Die klebende Kopfzeile löst R5-H1 gut, kostet aber bei 200 %
Schrift quer fast die halbe Höhe.

**Folge im Einsatz:** Gering; Randfall (Schrift 200 % und quer).

**Empfehlung:** Bei kleiner Höhe (unter etwa 400 px) die Kopfzeile nicht
kleben lassen oder auf eine Zeile mit Knopf rechts bringen; das Durchscheinen
der Stärke-Leiste unter der Kopfzeile abdecken.

**Nachprüfung:** 640 × 360 bei 200 % Schrift: Liste mindestens drei Zeilen im
Bild; keine Reste der Stärke-Leiste unter der Kopfzeile.

### R6-H5 [P3] Musterung: Beide Gruppen abwählen legt ohne Rückfrage einen Bogen mit „0 Pers · 0 Fz“ an (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Musterung (Szenario 2). Code:
`src/app/vorlagen-ui.tsx`.

**Beobachtung:** „Alle abwählen“ bei Personal und Fahrzeugen (je ein Tipp)
lässt „Bogen anlegen · 0 Pers · 0 Fz“ stehen; der Knopf ist nicht gesperrt und
legt den Bogen ohne Rückfrage an. Danach meldet Schritt 3 „⚠ Stärke ist 0 — es
ist noch kein Personal erfasst“ und bietet „Aus der Vorlage ergänzen… (66)“
an, die Rückholung ist also da.

**Reaktion des Helfers:** Er wollte „nur diese acht“ und hat beim ersten Tipp
versehentlich beide Gruppen oder den falschen Knopf erwischt; der Zähler 0/66
zeigt es ihm.

**Problem:** Der Knopf „Alle abwählen“ ist bei Handschuhen gut zu treffen, aber
ein leerer Bogen entsteht ohne Frage.

**Folge im Einsatz:** Gering, die Wiederherstellung steht unmittelbar im
Schritt 3.

**Empfehlung:** Bei 0 Personen am Knopf „Bogen anlegen · 0 Pers“ die Frage
„Keine Person aus der Vorlage?“ mit „Zurück zur Liste“ stellen, so wie schon
bei „Alle aus der Vorlage dabei?“.

**Nachprüfung:** Beide Gruppen abwählen, „Bogen anlegen“ tippen: Rückfrage
erscheint.

### R6-H6 [P3] Erster Hauptknopf quer mit Vorlage knapp unter dem Bild (Rest von R5-M2)

**Priorität:** P3

**Kennzeichnung:** gemessen (Oberkante, erster Besuch, Ladehinweis zu sehen).

**Fundstelle / Aufgabe:** Startseite mit Vorlage (Szenario 1).

**Beobachtung:** Oberkante von „Einsatz vorbereiten: Meine Einheit“: 449 px
bei 360 × 640, 440 bei 320 × 568 (der Knopf ist 69 px hoch), 362 bei 640 ×
360 und damit 2 px unter dem Bildrand. Ohne Vorlage liegt „Neuen Bogen
erstellen“ bei 397, 411 und 328 px (Runde 5: 655, 692, 514). Der gelbe
Ladehinweis „Wird für den Offline-Betrieb geladen…“ steht beim ersten Besuch
vier Zeilen hoch über dem Knopf (Bild 16-start-640x360-v).

**Reaktion des Helfers:** Quer sieht er beim ersten Besuch keine Handlung.

**Problem:** Der Weg ist deutlich besser als in Runde 5, quer mit Vorlage aber
im ersten Bild noch nicht erreicht.

**Folge im Einsatz:** Gering; ein Wisch.

**Empfehlung:** Den Ladehinweis quer auf zwei Zeilen kürzen.

**Nachprüfung:** 640 × 360, erster Besuch mit Vorlage: Oberkante des ersten
Knopfs höchstens 320 px.

### Verweise auf andere Runde-6-Berichte

Dort zuerst festgehalten, von mir unabhängig nachgestellt, hier nicht
doppelt gezählt:

- **QR-Sperre 1,5 s und „Teil n wurde noch nicht gezeigt“**
  ([stress-und-unterbrechung.md](stress-und-unterbrechung.md)): Meine Messung
  stimmt überein (zweiter Tipp binnen 150 bis 1 200 ms wirkt nicht, ab 1 500
  ms ja). Die fehlende Anzeige im Vollbild steht oben als R6-H1.
- **Fußleiste Schritt 5 und Ansicht-Wahl doppelt**
  ([mobile-ui.md](mobile-ui.md), N1, N9): In meinen Läufen bei 360 × 640 keine
  Überlappung; bei 320 × 568 nicht gezielt geprüft.

## Bestätigtes

- **Kernweg:** Mit Vorlage „Einsatz vorbereiten: Meine Einheit“, Musterung,
  „Bogen anlegen · 4 Pers · 2 Fz“, Ort, Übergabe, Code, „Schließen“ und
  „Ja, gescannt — übergeben“; nach Neuladen „✓ Übergeben 13:15 Uhr (bestätigt)
  — seitdem unverändert“ auf der Startseite.
- **Musterung:** „Alle sind vorab angehakt — wer oder was fehlt, antippen und
  abwählen.“ „Alle abwählen“ je Gruppe, danach „Alle anhaken“; „Personal
  (0/38)“, acht anhaken → „Bogen anlegen · 8 Pers · 10 Fz“ und Stärke-Leiste
  1/3/4/8. Abgewählte Zeilen sind durchgestrichen und grau. „Personal (8/38)“
  klebt beim Rollen. Nach 0 Personen: „⚠ Stärke ist 0 …“ und „Aus der Vorlage
  ergänzen… (66)“.
- **QR-Vollbild:** „Teil 1 von 6“ über dem Code, „Weiter zu Teil 2 →“ als
  dunkler Hauptknopf, „← Teil 1“, „Schließen“; Code 323 px (360 × 640), 251 px
  (320 × 568), 328 px (quer, links neben dem Bedienblock, Bild 10-t1-640x360).
  Doppeltipp überspringt nichts; „Teil n von 6 wurde noch nicht gezeigt“ mit
  „zeigen“ / „Trotzdem schließen“; „Hat die Gegenstelle alle 6 Teile
  gescannt? Die App kann das nicht selbst sehen.“ mit „Ja, gescannt —
  übergeben“, „Nicht sicher“, „← Code wieder zeigen“; Browser-Zurück öffnet
  dieselbe Rückfrage; Drehen hält den Teil.
- **Offline:** Nach „Jetzt offline bereit“ Neuladen ohne Netz, Musterung,
  Mehrteiler (4 Teile), Bestätigung und Neuladen ohne Abweichung.
- **Nachtipp außerhalb des Vollbilds:** „Weiter →“ im Schritt 2 bis 6: zweiter
  Tipp nach 250 ms zeigt „Einen Moment …“ und bleibt ohne Wirkung, nach
  1,9 s geht es weiter.
- **PDF erzeugen:** Der Knopf wird sofort gesperrt („PDF wird erstellt…“,
  `disabled`), ein zweiter Tipp ist nicht möglich, eine Datei.
- **„+ Person hinzufügen“ unten:** Cursor im neuen Namensfeld (`INPUT`).
- **Andere Organisationen:** DRK (1 Code), Feuerwehr (2 Teile), Katastrophen-
  schutz Bayern (6 Teile, 276 px), DLRG (1 Code, „⚠ 2 offene Punkte —
  ansehen · Übergeben ist trotzdem möglich“), ASB (3 Teile), Bundeswehr 43
  Personen (4 Teile), BBK 66 Personen (6 Teile): Musterung, Dialog und Vollbild
  laufen, der Dialog nennt vorab die Zahl der Teile.
- **Stärke 0:** Wer mit 0 Personen anlegt, liest „⚠ Stärke ist 0“ im Schritt 3.

## Abgleich mit Runde 5

Grundlage: [../runde-5/feldtauglichkeit.md](../runde-5/feldtauglichkeit.md)
samt „Stand der Behebung“ und [../runde-5/README.md](../runde-5/README.md).

| Runde-5-Befund | Stand laut Bericht | Bewertung Runde 6 | Beobachtung |
| --- | --- | --- | --- |
| R5-H1 Musterung kennt nur „Alle anhaken“ | behoben | **hält** | „Alle abwählen“, solange alle angehakt sind, sonst „Alle anhaken“; 38 → 0/38, acht anhaken; Kopfzeile klebt. Nebenwirkung: Beide Gruppen leer legt ohne Frage einen leeren Bogen an, und bei 320 px oder 200 % Schrift nimmt die Kopfzeile viel Platz (R6-H4, R6-H5). |
| R5-H2 Karten bei Großbogen 88 Bildschirme hoch | behoben (ab 13 Personen Kurz-Liste) | **teilweise** | 38 Personen beginnen in der Kurz-Liste (8 826 px statt 56 258 px), Hinweis über den Karten steht. Aber 12 Personen beginnen mit Karten (14 458 px), die Kurz-Zeile ist mit 197 px länger als in Runde 5 (168 px), 38 Personen noch 14 Bildschirme; die Beschriftung „Kurz-Liste (Tabelle)“ blieb (R6-H3). |
| R5-H3 „+ Person hinzufügen“ unten setzt keinen Fokus | behoben | **hält** | Unterer Knopf: Cursor im Namensfeld der neuen Karte. |
| R5-H4 PDF-Erzeugung ohne Sperre | (Risiko, in Paket 4) | **hält** | Knopf gesperrt, „PDF wird erstellt…“, eine Datei bei Doppeltipp. |

Zu den Verweisen von Runde 5:

| Runde-5-Befund | Bewertung Runde 6 | Beobachtung |
| --- | --- | --- |
| R5-S1/R5-G1 Doppeltipp in „Weiter zu Teil n →“ überspringt Teile | **hält, mit einer Lücke** | Doppeltipp (150 ms) bleibt auf dem Teil; ein nur kurz gezeigter Teil gilt nicht als gezeigt, „Schließen“ fragt „Teil n … noch nicht gezeigt“. Die Lücke: Der Nachtipp bleibt im Vollbild ohne sichtbaren Hinweis (R6-H1), und die Meldung erklärt die Mindestzeit nicht (R6-H2). |
| R5-S2/R5-G5 Zweiter Tipp binnen 1,5 s verfällt ohne Rückmeldung | **teilweise** | Außerhalb des Vollbilds erscheint „Einen Moment …“ über dem Knopf. Im QR-Vollbild nicht sichtbar (R6-H1). Eine Wirkung ins Gegenteil gab es nicht. |
| R5-M2 Erstbesuch: im ersten Bild steht keine Aktion | **teilweise** | Ohne Vorlage 397/411/328 px (vorher 655/692/514), mit Vorlage 449/440/362 px; quer mit Vorlage knapp unter dem Bild (R6-H6). |
| R5-G2 Kurz-Liste mit überlappenden Knöpfen | **hält in der Sache, Zeile länger** | Keine Überlappung im Bild 12-kurz-s2; Zeile 197 px (R6-H3). |
| R5-O1 Netz bricht im Erstladen ab | nicht gezielt geprüft | Erstladen mit Ladehinweis („0,7 von 6,9 MB — bitte mit Netz geöffnet lassen“) beobachtet; der Abbruch wurde in diesem Lauf nicht nachgestellt. |
| R5-L1 „◐“ ohne Text in der Fußleiste | **hält** | Fußleiste zeigt „◐ Ansicht“ mit Text (Bild 11-personal-kurz). |

Einordnung: Von den vier Befunden meiner Rolle halten R5-H1, R5-H3 und R5-H4,
R5-H2 wirkt nur teilweise. Keiner hat sich ins Gegenteil verkehrt, aber die
Behebung von R5-H2 hat die Zeile der Kurz-Liste länger gemacht (197 statt 168
px) und die Schwelle so gesetzt, dass 12 Personen bei den Karten bleiben. Die
Tipp-Sperre aus R5-S1 und R5-S2 wirkt im QR-Vollbild nur teilweise: Sie
schützt, aber sie schweigt dort.

## Abschluss

- **Aufgabe geschafft:** Mit Vorlage bis zum bestätigten QR-Code: ja.
  Sechsteiliger Code: ja. Offline und nach Neuladen: ja. Mit „Alle abwählen“
  eine Teilmenge ausrücken lassen: ja.
- **Fremde Hilfe nötig:** nein.
- **Mentales Modell:** Papierbogen aus der Mappe (Vorlage), Fehlende
  streichen, Ort eintragen, vorzeigen, nachfragen „hast du’s?“. Die App folgt
  dem bis in die Sprache der Rückfragen.
- **Größtes Einsatzrisiko:** Kein P0 oder P1 mehr in meinem Weg. Das größte
  Restrisiko ist Zweifel im QR-Vollbild: Ein Nachtipp wird verworfen, ohne
  dass es sichtbar wird (R6-H1), und die Mindestzeit kennt nur, wer sie
  erlebt.
- **Top-Priorität für die nächste Iteration:** „Einen Moment …“ bzw. die Sperre
  im Vollbild sichtbar machen (R6-H1) und die Meldung „noch nicht gezeigt“ mit
  der Mindestzeit erklären (R6-H2).

**Verständnisprüfung**

- Orientierung: **verstanden**. Schrittleiste mit Haken, „Teil n von 6“ über
  dem Code.
- Nächster Schritt: **verstanden**. „Einsatz vorbereiten: …“, „Bogen anlegen“,
  „Weiter zu Teil n →“, „Ja, gescannt — übergeben“.
- Systemzustand: **verstanden, mit einer Lücke**. Übergabevermerk, Speicherzeile
  und Teil-Anzeige stimmen; die Sperre im Vollbild ist unsichtbar (R6-H1).
- Fehlerbehebung: **verstanden**. Rückfragen mit Namen, „Nicht sicher“,
  „Code wieder zeigen“, „Aus der Vorlage ergänzen…“, Neuladen ohne Verlust.
- Feldtauglichkeit: **geeignet, nicht vollständig geprüft**. Handschuhe,
  Sonnenlicht, Kamera-Scan mit 1,5 s Mindestzeit, Bildschirmtastatur und
  native Builds gehören in einen Praxistest.

## Stand der Behebung

Stand 23.10.2026, auf demselben Zweig mit Typprüfung, Unit-Tests, Verhaltenstests (137 von 137 Szenarien) und, wo es sich messen ließ, Nachmessung im Browser (Playwright, Produktionsbuild). 2 behoben, 2 teilweise, 2 offen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R6-H1 | behoben | Der Hinweis „Einen Moment …“ wird in das oberste offene Fenster gehängt und steht damit im QR-Vollbild im Bild (`tipp-schutz.ts`, Unit-Test). Eine Aufnahme im Browser steht aus. |
| R6-H2 | teilweise | Die Rückfrage nennt die Mindestzeit („mindestens 1,5 s im Bild“). Ein Haken „✓ gezeigt“ im Vollbild fehlt. |
| R6-H3 | offen | Länge der Kartenliste (14 458 px bei 12 Personen) unverändert; eine Neugestaltung der Kurz-Liste steht aus. |
| R6-H4 | offen | Die klebende Kopfzeile der Musterung bleibt bei 320 px und 200 % Schrift hoch. |
| R6-H5 | behoben | Bei 0 Personen fragt „Bogen anlegen“ („Keine Person aus der Vorlage?“). |
| R6-H6 | teilweise | Der Umschalter der Musterung behält seine Breite und sperrt die Stelle 1,5 s (R6-G4). Die Lage des ersten Hauptknopfs im Querformat mit Vorlage ist nicht geändert. |
