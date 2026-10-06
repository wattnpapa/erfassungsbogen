# Audit „Helfer im Feld“, Runde 5 (Feldtauglichkeit)

Stand: 06.10.2026 · Prüfer: Rollenaudit `thw-field-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit c0cbae0 (Code entspricht 4fcdbaf).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-4-Befunde ([../runde-4/README.md → Stand der Behebung](../runde-4/README.md#stand-der-behebung)).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch`, Locale de-DE, Zeitzone Europe/Berlin. Grundeinstellung
Telefon 360 × 640 px, dazu 320 × 568 und quer 640 × 360. Bedient wurde mit
`tap()`, jeder Lauf in einem eigenen Browser-Kontext mit frischem Speicher.
Elf weitere Prüfer nutzten denselben Server (Last im Mittel 27 bis 31);
**Zeitangaben sind deshalb nur grob und unter Last gemessen.** Zustände kamen
über `localStorage`-Seeds mit `uebung: false`: Vorlagen (`eeb.vorlagen.v1`)
aus `examples/thw/` (001 Albstadt Zugtrupp mit 4 Personen und 2 Fahrzeugen,
013 Ulm B, 004 Freiburg FGr WP, der Stress-Test-Bogen „Verstärkter
Bergungszug“ Oldenburg mit 38 Personen und 6 QR-Teilen) und Bögen anderer
Organisationen (DRK BHP-25 und SEG, DRK Niedersachsen, Feuerwehr
Niedersachsen, Katastrophenschutz Bayern, DLRG Tauchgruppe, ASB
Sanitätsgruppe, BBK Führungsgruppe, Bundeswehr Panzerpionierzug mit 43
Personen), Entwurf (`eeb.entwurf.v1`) und Anzeigemodus (`eeb.anzeigemodus.v1`).
Für echtes Offline lief vor dem Server ein kleiner Weiterleitungs-Proxy, den
ich abschalten konnte (CDP-Drosselung und `setOffline` erfassen den Service
Worker nicht). Eine Einsatz-Sammlung habe ich nicht gebraucht, die
Meldekopf-Seite gehört nicht zu dieser Rolle. Getestet habe ich zuerst ohne
Blick in frühere Berichte; den Runde-4-Bericht samt „Stand der Behebung“ und
die Übersicht habe ich erst danach gelesen und gezielt nachgeprüft, die
anderen Runde-5-Berichte zuletzt (soweit sie schon da waren).

Rolle: Helfer einer Bergungsgruppe, praktisch erfahren, bedient die App
selten, steht mit dem Telefon in einer Hand am Fahrzeug und wird
zwischendurch gerufen.

Szenarien, jeweils vom natürlichen Einstieg aus:

1. **Mit Vorlage ausrücken:** Startseite → „Einsatz vorbereiten: Meine
   Einheit“ → Musterung (alle da; Rückfrage „Alle aus der Vorlage dabei?“;
   einzelne Person und Fahrzeug abgewählt) → „Bogen anlegen“ → Ort →
   „Weiter →“ bzw. „Zur Übergabe →“ → „Bogen übergeben…“ → „QR-Code im
   Vollbild zeigen“ → „Schließen“ → „Ja, gescannt — übergeben“ → Neuladen.
   Abgeschlossen: **ja**. Der kürzeste Weg sind acht Tipps und der Ort.
2. **Großbogen in sechs Teilen:** Verstärkter Bergungszug, QR-Vollbild
   hochkant (360 × 640, 320 × 568) und quer (640 × 360), alle Teile
   durchgeschaltet, Abbruch nach Teil 3, Drehen und Hintergrund mitten im
   Code, Bestätigung, Neuladen. Abgeschlossen: **ja**.
3. **Offline:** Laden bis „Jetzt offline bereit“, Netz aus, neu laden,
   kompletter Weg bis zum bestätigten Großbogen, Neuladen offline; außerdem
   Netzabbruch mitten im Erstladen. Abgeschlossen: **ja**.
4. **Ohne Vorlage neu anfangen:** „Neuen Bogen erstellen“, Einheitstyp und
   OV ausgeschrieben bzw. nur angefangen („Berg“, „Ul“). Abgeschlossen:
   **ja**.
5. **Nachzügler und Änderung nach der Übergabe:** „+ Person hinzufügen“
   (oben und unten), Nachname ändern nach bestätigter Übergabe, Zurück-Taste.
   Abgeschlossen: **ja**.
6. **Unterbrechung:** Ort tippen und sofort neu laden (0 bis 1 500 ms),
   neu laden mitten in Schritt 4, „Verwerfen“, Querformat. Abgeschlossen:
   **ja**.
7. **Bögen anderer Organisationen:** Musterung und „Bogen übergeben…“ bei
   DRK, Feuerwehr, Katastrophenschutz, DLRG, ASB, BBK und Bundeswehr
   (mehrteilige Codes mit 2 bis 6 Teilen, Kennfarbe der Organisation).
   Abgeschlossen: **ja**, mit einem Befund (R5-H1).
8. **Sicht:** Standard, Feld, Nacht an Übergabe-Dialog und QR-Vollbild,
   200 % Schrift (`html { font-size: 200% }`) an Übergabe-Dialog und QR.

**Nicht prüfbar** und deshalb als *nicht geprüft* markiert: echte
Handschuhe, nasse Finger, Sonnenlicht und Dunkelheit am echten Display,
Kamera-Scan (auch ob sechs Teile am echten Gerät zügig durchgehen und ob die
Codes bei 4,4 CSS-Pixeln je Modul sicher lesen), USB-Handscanner,
Bildschirmtastatur und ihr Einfluss auf die untere Leiste, native Datums-
und Auswahllisten von Android/iOS, WebKit/Safari, native Builds, echtes
Drucken. Die Datumsfelder rendert headless Chromium trotz de-DE im
US-Format („10/06/2026“, „02:10 PM“); das werte ich nicht. Die Zeit der
PDF-Erzeugung und alles andere mit Uhr stammt aus einem Rechner unter hoher
Last und gilt als unsicher.

## Urteil

Die Kernaufgabe trägt weiter, und sie trägt auch am Großbogen und ohne Netz.
Mit Vorlage sind es „Einsatz vorbereiten: …“, Musterung („Alle sind vorab
angehakt — wer oder was fehlt, antippen und abwählen“), die Rückfrage „Alle
aus der Vorlage dabei?“, Ort, „Zur Übergabe →“, „Bogen übergeben…“, der
Code, „Schließen“ und die Frage „Hat die Gegenstelle den Code gescannt? Die
App kann das nicht selbst sehen.“ Der Vermerk „✓ Übergeben 13:39 Uhr
(bestätigt) — seitdem unverändert“ steht auch nach Neuladen auf der
Startseite, eine Änderung danach meldet sich mit „⚠ Seit der Übergabe … 
geändert — neu übergeben“. Der sechsteilige Code lässt sich nach Teil 3 nicht
stillschweigend schließen („Teil 4 von 6 wurde noch nicht gezeigt“), hält
Drehen und Hintergrundwechsel aus, und der Offline-Weg samt Bestätigung und
Neuladen läuft ohne Netz identisch. Bricht das Netz mitten im Erstladen ab,
sagt die Zeile nach rund 20 bis 30 s „⚠ Laden abgebrochen bei 1,7 von 6,8 MB“
und lädt nach Rückkehr des Netzes selbst weiter.

Der einzige Fehlgriff, der in meinem Lauf zu einer falschen Übergabe führt,
steht schon in anderen Berichten: Ein Doppeltipp auf „Weiter zu Teil n →“
überspringt einen Teil, und die App fragt am Ende trotzdem „alle 6 Teile
gescannt?“ (gemessen: zwei Tipps im Abstand 200 ms, Teil 1 → 3; Verweis auf
R5-S1 und R5-G1 unten). Er gehört in der Rangfolge ganz nach oben. Neu in
diesem Bericht sind eine Lücke in der Musterung großer Vorlagen (R5-H1) und
drei Kleinigkeiten.

## Befunde

Zählung (ohne die Verweise unten): P0: 0 · P1: 0 · P2: 1 · P3: 3.

### R5-H1 [P2] Musterung kennt nur „Alle anhaken“: Wer aus einer großen Vorlage nur wenige mitnimmt, muss jede andere Zeile einzeln abwählen (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet (Tipp auf „Alle anhaken“ mehrfach, Zähler
unverändert); Zahl der Tipps aus der Zeilenzahl gemessen.

**Fundstelle / Aufgabe:** Vorlage → „Einsatz vorbereiten“ → Musterung
(Szenario 1 und 7). Code: `src/app/vorlagen-ui.tsx` (Zeilen 461 und 481,
beide Knöpfe setzen nur `true`).

**Beobachtung:** Über „Personal“ und über „Fahrzeuge“ steht je ein Knopf
„Alle anhaken“. Sind schon alle angehakt, wie nach dem Öffnen immer, tut er
sichtbar nichts (Bundeswehr-Vorlage: 48 Haken vorher, 48 nach dem ersten und
zweiten Tipp). Ein Gegenstück „Alle abwählen“ gibt es nicht. Bei der
Panzerpionierzug-Vorlage steht die Liste auf 43 Personen und die Seite ist
5 456 px hoch (rund neun Bildschirme); rückt nur eine Gruppe mit acht
Personen aus, sind 35 Zeilen einzeln abzuwählen. Die Feuerwehr-Vorlage
(20 Personen, 3 505 px) und die Großbogen-Vorlage (38 Personen) gehen in
dieselbe Richtung.

**Reaktion des Helfers:** „Alle anhaken“ liest er als Schalter und erwartet
beim zweiten Tipp „alle ab“. Dass der Knopf nur einseitig wirkt, merkt er
erst, wenn er auf der Liste nichts ändert.

**Problem:** Die Musterung ist für „alle da, einzelne fehlen“ gebaut und
macht den umgekehrten Fall („nur diese sind da“) zu Fleißarbeit. Der Knopf
sieht bei vollständiger Auswahl wirksam aus, ist es aber nicht.

**Folge im Einsatz:** Zeitverlust und Fehlgriffe bei Zug- und
Stammvorlagen, deren Teil ausrückt; wer ermüdet, lässt Personen angehakt
stehen, die nicht dabei sind, und meldet eine zu hohe Stärke. Die
Rückfrage „Alle aus der Vorlage dabei?“ erscheint nur bei unveränderter
Liste und hilft dann nicht.

**Empfehlung:** Den Knopf zum Umschalter machen („Alle abwählen“, sobald
alle angehakt sind) oder zusätzlich „Keine“ anbieten. Bei Vorlagen mit mehr
als etwa zehn Personen die Zähler „Personal (43/43)“ klebend halten, damit
beim Abwählen im Bild bleibt, wie viele noch gelten.

**Nachprüfung:** Vorlage mit 43 Personen, „Einsatz vorbereiten“: Ein Tipp
setzt alle auf „nicht angehakt“ (Zähler 0/43), danach lassen sich acht
Personen anhaken, „Bogen anlegen · 8 Pers“.

### R5-H2 [P3] Personal als „Alle Angaben (Karten)“: bei 38 Personen 56 058 px Seitenhöhe, die Kurz-Liste bleibt bei 168 px je Person (neu, Rest von R4-H2)

**Priorität:** P3

**Kennzeichnung:** gemessen (`scrollHeight`).

**Fundstelle / Aufgabe:** Schritt 3 „Personal“, Großbogen-Vorlage, 360 ×
640 (Szenario 2). Code: `src/app/schritte/personal.tsx`.

**Beobachtung:** Die Voreinstellung ist „Alle Angaben (Karten)“. Mit 38
Personen ist die Seite 56 058 px hoch, rund 88 Bildschirme; eine Karte
braucht mehr als 1 000 px. In der „Kurz-Liste (Tabelle)“ sind es 7 646 px,
rund zwölf Bildschirme. Eine Person misst dort weiter 168 px (Ulm B: 168,
169, 188, 169, 169), acht Personen sind rund zwei Bildschirme lang. Die
Wahl zwischen Karten und Kurz-Liste steht unter zwei Stärke-Zeilen am Anfang
des Schritts; ohne Hinweis, dass die Karten bei großen Bögen die lange Wahl
sind.

**Reaktion des Helfers:** Er will bei einer Person den Namen ändern und
scrollt. Dass es oben einen kürzeren Weg gibt, sieht er nicht, weil die
Bezeichnung „Kurz-Liste (Tabelle)“ nach Tabellenkalkulation klingt.

**Problem:** Ab etwa zwölf Personen ist der Standard unpraktisch, ohne dass
die App es sagt oder von selbst die kurze Ansicht anbietet.

**Folge im Einsatz:** Gering. Nach einer Musterung muss meist nichts mehr
geändert werden, „Zur Übergabe →“ umgeht den Schritt. Wer eine Person
nachträgt, nimmt „+ Person hinzufügen“ (Sprung zur neuen Karte).

**Empfehlung:** Bei mehr als zwölf Personen mit der Kurz-Liste beginnen
oder oben „Viele Personen — Kurz-Liste zeigt mehr auf einmal“ anbieten. Die
Beschriftung „Kurz-Liste (Tabelle)“ durch „Liste, eine Zeile je Person“
ersetzen.

**Nachprüfung:** Großbogen-Vorlage, Schritt 3: Erste Ansicht höchstens
rund zehn Bildschirme lang oder Hinweis auf die Liste im ersten Bild.

Verweis: Die Zeilenhöhe der Kurz-Liste und die Lage von „✕“ stehen in
[R5-G2](handschuh-bedienung.md) (Handschuh-Bedienung); die fehlende
Beschriftung der Felder neuer Personen in der Kurz-Liste in
[R5-M5](mobile-ui.md).

### R5-H3 [P3] „+ Person hinzufügen“ unter der Liste springt zur neuen Karte, lässt den Cursor aber auf dem Knopf (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Schritt 3, 4 Personen, Karten-Ansicht (Szenario
5). Zwei Knöpfe gleicher Beschriftung: oben (Zugriffsname „+ Person
hinzufügen (springt zur neuen Person)“) und unten, hinter der letzten Karte
(dunkel, `class="primaer"`).

**Beobachtung:** Der obere Knopf legt „Person 5 von 5“ an, scrollt hin und
setzt den Cursor in den Vornamen (`activeElement` ist ein `INPUT`, im Bild).
Der untere Knopf scrollt ebenfalls zur neuen Karte (scrollY 5 265), lässt
den Fokus aber auf sich selbst, und der Knopf liegt dann rund 700 px unter
dem Bild (`activeElement` ein `BUTTON`, nicht im Bild). Die Bildschirmtastatur
öffnet sich nicht; getippter Text landet nirgends (Tastaturereignisse in der
Prüfung, nicht am echten Gerät).

**Reaktion des Helfers:** Er steht am Ende der Liste, tippt den dunklen
Knopf und erwartet wie beim oberen den Cursor im Namen. Ein Tipp ins Feld
fehlt ihm, und er merkt es erst, wenn er zu tippen beginnt.

**Problem:** Zwei gleich beschriftete Knöpfe verhalten sich verschieden; der
Standardweg am Ende der Liste ist der schwächere.

**Folge im Einsatz:** Gering, ein Tipp mehr. Für Vorlesesoftware springt der
Fokus ans Seitenende ohne Hinweis auf die neue Karte.

**Empfehlung:** Beide Knöpfe gleich behandeln: neue Karte, Fokus im Vornamen.

**Nachprüfung:** Mit 4 Personen unteren Knopf tippen: `activeElement` ist der
Vorname der neuen Karte, im Bild.

### R5-H4 [P3] „PDF erzeugen“ beim Großbogen: rund sechs Sekunden und ein stehendes Bild (Risiko, unter Last gemessen)

**Priorität:** P3

**Kennzeichnung:** Risiko; Zeiten unter Last gemessen (Last 27) und deshalb
unsicher.

**Fundstelle / Aufgabe:** Übergabe-Dialog → „PDF erzeugen“, Großbogen mit 38
Personen (Szenario 2).

**Beobachtung:** Nach dem Tipp steht sofort „PDF wird erstellt…“; die
Datei war nach 5,9 s da (Download-Ereignis), danach „✓ PDF gespeichert:
eeb-…_THW_Oldenburg_NI_Verstärkter_Bergungszug.pdf — liegt im Download-Ordner
des Browsers“. In der Zeit stand das Bild bis zu 2 s still (größte
Bildlücke 2 055 ms). Der erste Lauf brauchte 8,8 s bis zum Download.

**Reaktion des Helfers:** Die Rückmeldung genügt; wer den Knopf in der Zeit
noch einmal tippt, bekommt vermutlich zwei Dateien (nicht nachgestellt).

**Problem:** Auf einem schwächeren Telefon dürfte die Zeit länger sein; die
App zeigt keinen Fortschritt und sperrt den Knopf nicht (Risiko, nicht
gemessen).

**Folge im Einsatz:** Gering; der QR-Code ist der Hauptweg, das PDF der
Ersatz.

**Empfehlung:** Knopf während der Erzeugung sperren („PDF wird erstellt…“
im Knopf selbst) und den Namen der Datei in der Quittung beibehalten.

**Nachprüfung:** Auf einem Telefon der unteren Preisklasse messen; zweimal
schnell tippen: eine Datei.

Verweis: Gleiche Wartezeit ohne Rückmeldung beim Blanko-Vordruck und beim
Lageblatt in [R5-L4](nacht-und-sicht.md); Doppeldateien bei der Sammel-PDF in
`offline-und-speicher.md` (Arbeitsnotiz dort).

### Verweise auf andere Runde-5-Berichte

Dort zuerst festgehalten, von mir unabhängig nachgestellt, hier nicht
doppelt gezählt:

- **Doppeltipp in „Weiter zu Teil n →“ überspringt einen Teil**
  ([R5-S1](stress-und-unterbrechung.md), [R5-G1](handschuh-bedienung.md)).
  Gemessen im Großbogen: zwei Tipps im Abstand 200 ms, Teil 1 → 3, 3 → 5,
  5 → 6; Teil 2 und 4 standen 200 ms im Bild; „Schließen“ nach Teil 6 fragt
  „Hat die Gegenstelle alle 6 Teile gescannt?“ ohne Hinweis. Auch bei 700 ms
  zwischen den Tipps rutschte Teil 3 → 5 durch; eine Sperre gibt es dort
  nicht. Ich stufe das in der
  Kernaufgabe als höchste Priorität ein (die Gegenstelle bekommt einen Bogen
  ohne Teil 2, der Sender bestätigt „übergeben“).
- **Zweiter Tipp binnen 1,5 s an derselben Stelle verfällt ohne
  Rückmeldung** ([R5-S2](stress-und-unterbrechung.md),
  [R5-G5](handschuh-bedienung.md)). Gemessen an „Weiter →“ von Schritt 3
  nach 4: ein Tipp nach 200 bis 1 100 ms nach dem vorigen wirkt nicht, nach
  1 500 ms schon.
- **Erstbesuch: im ersten Bild steht keine Aktion**
  ([R5-M2](mobile-ui.md)). Mein Messwert für den ersten Hauptknopf („Neuen
  Bogen erstellen“) ohne Vorlage: Oberkante 655 px bei 640 px Höhe, 692 bei
  568, 514 bei 360 (quer); mit Vorlage 464, 495 und 398.
- **„◐“ ohne Text in der Fußleiste** und schwebend ([R5-L1](nacht-und-sicht.md),
  Notizen in `neuer-nutzer.md`).
- **Namensvorschläge unter der Fußleiste**: Bei „Einheitstyp“ im Assistenten
  (360 × 640) liegen von sechs Vorschlägen nur drei über der Leiste; die
  Liste scrollt mit der Seite weiter (Notiz in `neuer-nutzer.md`, mit
  Tastatur [R5-S4](stress-und-unterbrechung.md)).

## Bestätigtes

- **Kernweg:** Mit Vorlage acht Tipps und der Ort; „Einsatz vorbereiten:
  Meine Einheit“ als erster Knopf (Oberkante 464 px bei 360 × 640, 495 bei
  320 × 568, 398 quer). Nach der Musterung bietet Schritt 2 „Zur Übergabe →“
  neben „Weiter →“.
- **Musterung:** Rückfrage „Alle aus der Vorlage dabei? Gemeldet werden alle 4
  Personen und alle 2 Fahrzeuge der Vorlage. Fehlt jemand, vorher in der
  Liste abwählen.“ („Ja, alle sind da“ / „Zurück zur Liste“); nach Abwahl
  „Bogen anlegen · 3 Pers · 1 Fz“ ohne Rückfrage; Sofortbedarf und
  „Bemerkung aus der Vorlage“ nicht angehakt.
- **Übergabe-Vermerk:** Nach „Schließen“ „Hat die Gegenstelle den Code
  gescannt? Die App kann das nicht selbst sehen.“ mit „Ja, gescannt —
  übergeben“, „Nicht sicher“, „← Code wieder zeigen“; „Nicht sicher“ ergibt
  „QR-Code gezeigt 13:53 Uhr — Empfang nicht bestätigt. Gegenstelle hat ihn —
  als übergeben vermerken“; Bestätigung bleibt nach Neuladen auf der
  Startseite sichtbar.
- **Mehrteiliger Code:** „Teil 1 von 6“ groß über dem Code, „Weiter zu Teil
  2 →“ als dunkler Hauptknopf, im letzten Teil „Teil 6 von 6 ist der letzte“
  und „Schließen“ als Hauptknopf; Abbruch nach Teil 3 → „Teil 4 von 6 wurde
  noch nicht gezeigt. Ohne ihn hat die Gegenstelle den Bogen nicht.“ mit
  „Teil 4 von 6 zeigen“ / „Trotzdem schließen“. Code 251 px (320 × 568),
  328 px (360 × 640, quer ab 16 px); Drehen und Hintergrundwechsel halten
  Teil 3. Der Dialog nennt vorab „6 Teile nacheinander“.
- **Änderung nach Übergabe:** „⚠ Seit der Übergabe 13:52 Uhr geändert — neu
  übergeben, damit der Meldekopf den Stand hat.“; Zurück-Taste führt
  Übersicht → Personal → Übersicht.
- **Offline:** „Jetzt offline bereit“ nach rund 12 s, danach „Funktioniert
  komplett offline“; Neuladen ohne Netz, Musterung, Großbogen mit sechs
  Teilen, Bestätigung und Neuladen offline ohne Abweichung. Netz weg im
  Erstladen: nach 10 s noch „wird geladen“, nach 30 s „⚠ Laden abgebrochen
  bei 1,7 von 6,8 MB — mit Netz einmal neu laden, dann geht es weiter. Bis
  dahin diese Seite ohne Netz nicht neu laden.“ mit Knopf „Jetzt neu
  laden“; mit Netz läuft es ohne Zutun weiter. Bildschirm bleibt im
  QR-Vollbild an (`wakeLock` in `src/app/schritte/uebersicht.tsx`; am echten
  Gerät nicht geprüft).
- **Unterbrechung:** Ort getippt und nach 0, 100, 400 und 1 500 ms neu
  geladen: jedes Mal im Entwurf. „Fortsetzen“ öffnet den Schritt, in dem man
  war (Schritt 4). „Verwerfen“ fragt „Angefangenen Bogen verwerfen?“ und
  nennt den Rückholplatz („Zuletzt geschlossenen Bogen zurückholen“).
- **Nur Stärke:** „Nur die Stärke melden?“ nennt, was passiert („4 erfasste
  Personen zählen dann nicht mehr einzeln … Die Namen bleiben als
  Erreichbarkeiten erhalten“) und bietet „Abbrechen“.
- **Einsatzbeginn:** Kästchen „Einsatzbeginn eintragen“ merkt sich die
  Uhrzeit beim Abwählen und Wiederanwählen (06:30 blieb erhalten).
- **Touchziele:** In Schritt 2 bis 6 und Übersicht jedes Ziel mindestens 44
  px (Ausnahme nur das ausgeblendete „Zum Inhalt springen“).
- **Anzeige:** Feld und Nacht ändern am QR nichts (weiße Platte); 200 %
  Schrift: Übergabe-Dialog und QR bleiben benutzbar, kein seitliches
  Überlaufen (`scrollWidth` 360). Kennfarben der Organisationen (DRK rot,
  Nacht gelb) tragen die Hauptknöpfe.
- **Andere Organisationen:** Musterung, Dialog und mehrteiliger Code laufen
  bei DRK, Feuerwehr, Katastrophenschutz, DLRG, ASB, BBK und Bundeswehr
  ohne Seitenfehler (2 bis 6 Teile; „⚠ n offene Punkte — ansehen · Übergeben
  ist trotzdem möglich“ mit klarem Text, z. B. „Sitzplätze: 3 in den
  erfassten Fahrzeugen für 8 Personen“).
- **Empfang per Link:** Link teilen → in zweitem Kontext geöffnet → „Empfangen
  als: ✓ signiert von ffcc c41b a056 f2ed — Herkunft belegt (nicht die
  Identität des Absenders)“.

## Abgleich mit Runde 4

Grundlage: [../runde-4/feldtauglichkeit.md](../runde-4/feldtauglichkeit.md)
samt „Stand der Behebung“ und [../runde-4/README.md](../runde-4/README.md).

| Runde-4-Befund | Stand laut Bericht | Bewertung Runde 5 | Beobachtung |
| --- | --- | --- | --- |
| R4-H1 Ausgeschriebener Typ / kleiner OV bleibt Freitext bei „✓“ | behoben | **hält** | „Bergungsgruppe“ + „ulm“ ergibt Typ-Code 4 und OV Ulm (OULM, Telefon, E-Mail, RB Biberach, LV Baden-Württemberg); Schritt 1 „✓“. „Berg“ + „Ul“: Hinweis „„Berg“ ist nicht aus der Liste — Vorschlag antippen oder als eigener Typ behalten. Ohne Typ-Code fehlen das taktische Zeichen und der Soll-Vergleich.“, Schritt 1 „offen“, Übersicht führt „⚠ Einheitstyp „Berg“ nicht erkannt“. Dieselbe Zeile steht beim Großbogen („Verstärkter Bergungszug“ nicht in der Liste). |
| R4-H2 Kurz-Liste ist am Telefon keine kurze Liste | teilweise (Paket 3, in Paket 5 erneut bestätigt) | **teilweise, wie berichtet** | Nichts liegt mehr außerhalb des Bilds (Rahmen 294 px bei 294). Eine Person misst weiter 168 px (Ulm B: 168/169/188), acht Personen sind rund zwei Bildschirme lang; mit 38 Personen 7 646 px. Das Handschuhmaß ist der Grund, das Ziel „acht Zeilen in einem Bildschirm“ bleibt unerreicht. Neue Nebenwirkungen stehen bei R5-G2 und R5-M5; für große Bögen siehe R5-H2. |
| R4-H3 Stärke-Leiste der Musterung kürzt ihre Beschriftung | behoben | **hält** | 360 × 640 und 320 × 568 (Feld): „F / UF / M / GES“ ohne „…“, Zahlen groß. Im Assistenten steht „(F / UF / M / Ges)“; die Leiste schreibt „GES“, der Assistent „Ges“, ein Unterschied nur in der Groß-Schreibung. |
| R4-H4 Neue Person ist ungefragt „M“ und „Fleisch“ | teilweise | **teilweise, wie berichtet** | Geschlecht und Ernährung der neuen Karte gestrichelt und gelb, „nur vorbelegt (M, Fleisch) — bitte wählen“. Offen bleiben Zählung in der Übersicht und ein echtes „keine Angabe“ (Formatfeld). In der Kurz-Liste fehlt die Beschriftung der Felder (R5-M5). |
| R4-H5 Kleinere Stolpersteine | weitgehend | **hält, Rest bleibt** | „Ansicht: Standard ▾“ im Kopf beschriftet; „Zuletzt geschlossener Bogen“ und „Rückholung oben auf der Startseite“ stimmen; im Mehrteiler ist „Weiter zu Teil n →“ der dunkle Hauptknopf; Schritt 2 bietet „Zur Übergabe →“. Rest: das „◐“ in der Fußleiste hat weiter keinen Text (Verweis R5-L1, `neuer-nutzer.md`). |

Zu den berichtsübergreifenden Punkten der Runde-4-Übersicht, soweit mein Weg
sie berührt:

| Runde-4-Befund | Bewertung Runde 5 | Beobachtung |
| --- | --- | --- |
| R4-S2 Doppeltipp übersprang Schritt 2 („Weiter →“) | **teilweise, mit Nebenwirkung** | Die Ortssperre hält den Doppeltipp auf „Weiter →“ ab (kein übersprungener Schritt in meinen Läufen). Sie verwirft aber jeden zweiten Tipp binnen etwa 1,5 s lautlos (R5-S2, R5-G5). |
| R4-S2/R4-S3 Sperre auch für „Weiter zu Teil n →“ im QR-Vollbild | **hält nicht für den Code (Lücke)** | Dort gibt es keine Sperre: Ein Doppeltipp überspringt einen Teil, der Schluss fragt unverändert „alle 6 Teile gescannt?“. Die Behebung von R4-S2 deckt genau die Stelle nicht ab, an der ein übersprungener Schritt eine fehlende Datenübergabe bedeutet (R5-S1, R5-G1). |
| R4-O1 Netz bricht im Erstladen ab, Zeile sagt weiter „wird geladen“ | **hält** | Nach 20 bis 30 s „⚠ Laden abgebrochen“ mit Knopf; Wiederaufnahme mit Netz ohne Zutun. In den ersten 20 s sagt die Zeile weiter „wird geladen“; ein Neuladen in dieser Zeit endet im Browser-Fehler („ERR_EMPTY_RESPONSE“), wovor die Zeile ab dem Abbruch warnt, vorher nicht (gemessen). |
| R4-M4/R4-G2 QR-Weg bei 200 % Schrift | **hält für das Vollbild** | QR-Vollbild bei 200 % unverändert benutzbar; der Weg dorthin ist laut [R5-M1](mobile-ui.md) bis zu zwei Bildschirme tief. |

Einordnung: Von den fünf Runde-4-Befunden meiner Rolle halten R4-H1, R4-H3
und R4-H5 (mit dem bekannten Rest am „◐“), R4-H2 und R4-H4 sind teilweise
behoben, genau wie in „Stand der Behebung“ beschrieben. Keiner hat sich
ins Gegenteil verkehrt. Nur teilweise wirkt dagegen die Behebung von R4-S2
an einer Stelle außerhalb meiner Befunde, dem mehrteiligen QR-Vollbild
(siehe Verweise); die Ortssperre ist dort nicht gesetzt, und ihre Wirkung
auf „Weiter →“ ist eine neue lautlose Nebenwirkung.

## Abschluss

- **Aufgabe geschafft:** Mit Vorlage bis zum bestätigten QR-Code: ja.
  Sechsteiliger Code: ja (mit sauberem Einzeltipp je Teil). Neuer Bogen ohne
  Vorlage: ja. Nachmeldung nach der Übergabe, Wiedereinstieg nach Neuladen,
  Netzverlust im Erstladen und vollständig offline: ja.
- **Fremde Hilfe nötig:** nein.
- **Mentales Modell:** Papierbogen aus der Mappe (Vorlage), Fehlende
  streichen, Ort eintragen, vorzeigen, nachfragen „hast du’s?“. Die App folgt
  dem bis in die Sprache der Rückfragen; nur bei „nur diese sind da“
  (R5-H1) muss der Helfer gegen die Liste arbeiten.
- **Größtes Einsatzrisiko:** Ein Doppeltipp im mehrteiligen QR-Vollbild, der
  einen Teil überspringt, während die App danach die Gegenstelle als „alle
  Teile gescannt“ bestätigen lässt (R5-S1, R5-G1).
- **Top-Priorität für die nächste Iteration:** Im QR-Vollbild einen Teil erst
  als „gezeigt“ zählen, wenn er eine Mindestzeit im Bild stand, und „Weiter
  zu Teil n →“ wie „Weiter →“ ortsgesperrt halten (Verweise); danach „Alle
  abwählen“ in der Musterung (R5-H1).

**Verständnisprüfung**

- Orientierung: **verstanden**. Schrittleiste mit Haken und „offen“, Überschrift
  im Bild, nach „Fortsetzen“ im richtigen Schritt.
- Nächster Schritt: **verstanden**. „Einsatz vorbereiten: …“, „Bogen
  anlegen · 4 Pers · 2 Fz“, „Zur Übergabe →“, „Bogen übergeben…“, „QR-Code
  im Vollbild zeigen“, „Weiter zu Teil n →“.
- Systemzustand: **verstanden, mit einer Lücke**. Speicherzeile,
  Offline-Hinweis, Übergabe-Vermerk und Teil-Anzeige sagen, was die App
  weiß; der Hinweis „alle 6 Teile gescannt?“ unterscheidet nicht zwischen
  gezeigten und nur kurz aufgeblitzten Teilen (Verweis).
- Fehlerbehebung: **verstanden**. Rückfragen mit Namen und Rückholplatz,
  Zurück-Taste, „Nicht sicher“, „Code wieder zeigen“, Neuladen ohne Verlust.
- Feldtauglichkeit: **geeignet, nicht vollständig geprüft**. Handschuhe,
  Sonnenlicht, Kamera-Scan mehrteiliger Codes, Bildschirmtastatur und
  native Builds gehören in einen Praxistest.
