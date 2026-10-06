# Audit „Helfer im Feld“, Runde 4 (Feldtauglichkeit)

Stand: 05.10.2026 · Prüfer: Rollenaudit `thw-field-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 3dd2ab5.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-3-Befunde ([../runde-3/README.md → Stand der Behebung](../runde-3/README.md#stand-der-behebung)).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch`, Locale de-DE, `deviceScaleFactor` 2. Grundeinstellung
Telefon 360 × 640 px, dazu 320 × 568 und quer 640 × 360. Bedient wurde mit
`tap()`, jeder Lauf in einem eigenen Browser-Kontext mit frischem Speicher;
elf weitere Prüfer nutzten denselben Server, Zeitangaben sind deshalb nur
grob. Zustände kamen über `localStorage`-Seeds aus `examples/thw/` mit
`uebung: false`, `stand` und Einsatzzeitraum auf heute gesetzt: Vorlagen
(`eeb.vorlagen.v1`: B Ulm mit 8 Personen und 2 Fahrzeugen, FGr WP (A)
Freiburg mit 10 Personen), Entwürfe (`eeb.entwurf.v1`: B Ulm mit Ort
„Hochwasser Neu-Ulm, Deichverteidigung“; Großbogen „Verstärkter
Bergungszug“ Oldenburg mit 38 Personen, sieben QR-Teile) und der
Anzeigemodus (`eeb.anzeigemodus.v1`: Standard, Feld, Nacht). Eine
Einsatz-Sammlung (`eeb.einsaetze.v1`) habe ich nicht gebraucht, die
Meldekopf-Seite gehört nicht zu dieser Rolle. Getestet habe ich zuerst ohne
Blick in frühere Berichte; den Runde-3-Bericht samt „Stand der Behebung“
habe ich erst danach gelesen und gezielt nachgeprüft, die anderen
Runde-4-Berichte zuletzt.

Rolle: Helfer einer Bergungsgruppe, praktisch erfahren, bedient die App
selten, steht mit dem Telefon in einer Hand am Fahrzeug und wird
zwischendurch gerufen.

Szenarien, jeweils vom natürlichen Einstieg aus:

1. **Mit Vorlage ausrücken:** Startseite → „Einsatz vorbereiten: B Ulm“ →
   Musterung (einmal alle da, einmal eine Person abgewählt) → „Einsatz
   starten“ → Ort/Auftrag, „Einsatzbeginn eintragen“ → „Weiter →“ bis „Zur
   Übersicht →“ → „Bogen übergeben…“ → „QR-Code im Vollbild zeigen“ →
   „Schließen“ → „Ja, gescannt — übergeben“. Abgeschlossen: **ja**.
2. **Großer Bogen in sieben Teilen:** Verstärkter Bergungszug, QR-Vollbild
   hochkant und quer, nach Teil 1 „Schließen“, Zurück-Taste nach Teil 1 und
   nach Teil 7. Abgeschlossen: **ja**.
3. **Ohne Vorlage neu anfangen:** „Neuen Bogen erstellen“, Einheitstyp und
   OV tippen, ohne einen Vorschlag anzutippen, dann „Weiter →“.
   Abgeschlossen: **ja, aber mit unbemerkt unvollständiger Einheit**
   (R4-H1).
4. **Nachmeldung nach der Übergabe:** Nach bestätigter Übergabe in Schritt 3
   eine Person entfernen (Kurz-Liste), zurück zur Übersicht. Abgeschlossen:
   **ja** (R4-H2).
5. **Unterbrechung und Fehlgriffe:** In Schritt 3 „+ Person hinzufügen“,
   Vorname tippen, sofort neu laden; „Verwerfen“ und „Bogen schließen“ mit
   Rückfrage; Vorlage löschen und zurückholen; Zurück-Taste im Vollbild.
   Abgeschlossen: **ja**.
6. **Offline:** Laden bis „Jetzt offline bereit“, Netz aus, neu laden,
   „Fortsetzen“, „PDF erzeugen“, QR-Vollbild. Abgeschlossen: **ja**.
7. **Feld und Nacht:** Startseite, Schritt 3 und 5, Übersicht und
   QR-Vollbild; Farbkontraste aller Texte in Schritt 2 und Übersicht
   berechnet. Abgeschlossen: **ja** (R4-H3).

**Nicht prüfbar** und deshalb als *nicht geprüft* markiert: echte
Handschuhe, nasse Finger, Sonnenlicht und Dunkelheit am echten Display,
Kamera-Scan (auch ob sieben Teile am echten Gerät zügig durchgehen),
USB-Handscanner, Bildschirmtastatur und ihr Einfluss auf die untere Leiste,
native Datums- und Auswahllisten von Android/iOS, native Builds, echtes
Drucken. Die Datumsfelder rendert headless Chromium trotz `lang="de"` und
`navigator.language` de-DE im US-Format („10/05/2026“); das werte ich nicht.

## Urteil

Die Kernaufgabe trägt, und sie trägt jetzt auch an den Stellen, an denen sie
in Runde 3 gewackelt hat. Vom Startbildschirm mit Vorlage bis zum QR-Code
sind es der Knopf „Einsatz vorbereiten: B Ulm“ ganz oben, die Musterung
(„Alle sind vorab angehakt — wer oder was fehlt, antippen und abwählen“, bei
unveränderter Liste die Rückfrage „Alle aus der Vorlage dabei?“), der Ort,
viermal „Weiter →“ und „Bogen übergeben…“. Jede Arbeitsansicht beginnt oben,
auch nach Scrollen auf der Startseite. Das QR-Vollbild zeigt „Teil 1 von 7“
groß über dem Code, lässt sich nach einem einzelnen Teil nicht stillschweigend
schließen und fragt am Ende „Hat die Gegenstelle alle 7 Teile gescannt?“. Der
Vermerk sagt danach ehrlich, was die App weiß („QR-Code gezeigt … — Empfang
nicht bestätigt“ bzw. „✓ Übergeben … (bestätigt)“), und eine spätere
Änderung meldet sich mit der alten und neuen Stärke („0 / 2 / 6 / 8 →
0 / 2 / 5 / 7 — neu übergeben“). Autospeicher, Offline-Neustart, Rückfragen
mit Rückholplatz und Rückgängig-Leiste halten.

Was bleibt, liegt am Rand der Kernaufgabe. Der einzige Befund mit
Einsatzfolge betrifft den Einstieg ohne Vorlage: Wer Einheitstyp oder OV
ausschreibt, statt den Vorschlag anzutippen, bekommt ein grünes Häkchen und
„✓ Alle Angaben vollständig und plausibel“, obwohl die Einheit nur als
Freitext im Bogen steht (R4-H1). Dazu kommen Kleinigkeiten an der Kurz-Liste
und an Beschriftungen.

## Befunde

Zählung: P0: 0 · P1: 0 · P2: 1 · P3: 4.

### R4-H1 [P2] Ausgeschriebener Einheitstyp oder kleingeschriebener OV bleibt Freitext, Schritt 1 und Übersicht melden trotzdem „fertig“ (neu)

**Priorität:** P2

**Kennzeichnung:** gemessen (gespeicherter Bogen ausgelesen); Folge am
Meldekopf ist Risiko.

**Fundstelle / Aufgabe:** „Neuen Bogen erstellen“ → Schritt 1 „Einheit“,
Felder „Einheitstyp“ und „Name (Pflicht)“, danach „Weiter →“ ohne einen
Vorschlag anzutippen (Szenario 3). Code: `src/app/hilfen.ts`,
`schrittStatus()` (`typGesetzt` zählt Freitext wie einen erkannten Typ), und
die Vorschlagsfelder in `src/app/schritte/einheit.tsx`; die Prüfliste der
Übersicht kennt keinen Punkt für einen nicht erkannten Typ.

**Beobachtung:** Beide Felder zeigen beim Tippen eine gute Vorschlagsliste
(„B Bergungsgruppe“, „B (ASH) …“; „Ulm OULM · 89079 Ulm“). Was gespeichert
wird, wenn der Helfer den Vorschlag nicht antippt, sondern einfach „Weiter →“
drückt:

| Eingabe Einheitstyp / OV | gespeichert |
| --- | --- |
| „B“ / „Ulm“ | Typ-Code 4 (Bergungsgruppe), OV Ulm mit Kürzel OULM, Telefon, E-Mail |
| „Bergungsgruppe“ / „ulm“ | Typ **Freitext** „Bergungsgruppe“, OV **„ulm“** ohne Kürzel und Kontakt |
| „Bergung“ / „Ulm “ | Typ **Freitext** „Bergung“, OV Ulm erkannt |
| „Berg“ / „Ul“ | Typ Freitext „Berg“, OV „Ul“ |

In allen Fällen steht in der Schrittleiste „1 ✓“. Die Übersicht zeigt
„THW · Berg · Ul“ und listet als offene Punkte nur „Stärke ist 0“ und
„Ort/Auftrag ist noch leer“; mit Personal und Ort stünde dort
„✓ Alle Angaben vollständig und plausibel“. Das Zeichen im Kopf zeigt statt
des taktischen Zeichens den Text „Berg“.

**Reaktion des Helfers:** „Bergungsgruppe hab ich ausgeschrieben, steht ja
da, und der Haken ist grün.“ Dass die Liste unter dem Feld eine Auswahl ist
und nicht nur eine Tipphilfe, sieht er nicht; die Langform auszuschreiben
ist für ihn das Gründlichste, was er tun kann.

**Problem:** Die App erkennt den eigenen Typ nur über das Kürzel oder den
angetippten Vorschlag, nicht über die ausgeschriebene Bezeichnung und nicht
über einen kleingeschriebenen OV-Namen. Der Unterschied ist am Bildschirm
nicht zu sehen, und Häkchen und Prüfliste bestätigen den Freitext als
fertig.

**Folge im Einsatz:** Der Meldekopf bekommt eine Einheit ohne Typ-Code und
ohne Dienststellen-Kürzel. Taktisches Zeichen, Soll-Vergleich nach StAN und
die Zuordnung zu einer schon gemeldeten Fassung derselben Einheit hängen am
Code (Risiko, am Meldekopf nicht nachgeprüft); im ungünstigen Fall steht
dieselbe Gruppe zweimal in der Liste, einmal als „Bergungsgruppe“ und einmal
als „B“. Rückfragen an den OV gehen ohne Telefon und E-Mail.

**Empfehlung:** Eine Eingabe, die genau einer Bezeichnung oder einem
OV-Namen entspricht (ohne Groß-/Kleinschreibung, ohne Leerzeichen am Rand),
beim Verlassen des Feldes automatisch übernehmen. Bleibt es Freitext, im
Feld sichtbar sagen „nicht aus der Liste — Vorschlag antippen oder als
eigener Typ behalten“, Schritt 1 dann nicht mit ✓ zeigen und in der
Übersicht als offenen Punkt führen („Einheitstyp nicht erkannt“).

**Nachprüfung:** „Bergungsgruppe“ und „ulm“ tippen, ohne Vorschlag „Weiter
→“: Typ-Code 4 und OV Ulm (OULM) im Bogen. „Berg“ und „Ul“: Schritt 1 nicht
„✓“, Übersicht nennt den Punkt.

### R4-H2 [P3] Kurz-Liste ist am Telefon keine kurze Liste (Rest von R3-H6)

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Schritt 3 „Personal“ → „Kurz-Liste (Tabelle)“, B
Ulm mit 8 Personen, 360 × 640; Person entfernen nach der Übergabe
(Szenario 4).

**Beobachtung:** Die Tabelle ist 634 px breit in einem 326 px breiten
Rahmen. Im ersten Bild stehen „Stelle“, „Vorname“, „Nachname“; „Zählt als“
ist auf „Manns“ abgeschnitten, Geschlecht, die Sortierknöpfe und „✕“ liegen
seitlich außer Sicht. Weil ▲, ▼ und ⇑ untereinander stehen, ist jede Zeile
rund 160 px hoch; acht Personen sind damit auch in der Kurz-Liste rund zwei
Bildschirme lang. Wer zum „✕“ wischt, sieht die Namen nicht mehr. Die
Rückfrage nennt die Person aber („Vogel, Michael entfernen? … Person
entfernen / Abbrechen“), danach kommt „Entfernt: Vogel, Michael ·
Rückgängig“.

**Reaktion des Helfers:** „Kurz-Liste“ klingt nach dem schnellen Weg. Er
findet eine Tabelle, die er seitlich schieben muss, und geht zurück zu den
Karten.

**Problem:** Die Ansicht hält am Telefon nicht, was ihr Name verspricht.

**Folge im Einsatz:** Gering. Der Nachzügler-Weg über „+ Person
hinzufügen“ oben (Sprung zur neuen Karte, Cursor im Vornamen) trägt, und die
Rückfrage mit Namen verhindert Fehlgriffe beim Entfernen. Kostet Zeit, wenn
jemand „Zählt als“ für mehrere Personen prüfen will.

**Empfehlung:** Auf schmalen Bildschirmen die Kurz-Liste als eine Zeile je
Person zeigen (Name, „Zählt als“, ein Menü-Knopf für Sortieren/Entfernen)
statt als breite Tabelle; die Sortierknöpfe nebeneinander statt
untereinander.

**Nachprüfung:** 360 × 640, 8 Personen: Name, „Zählt als“ und Entfernen
ohne seitliches Schieben im Bild; acht Zeilen in höchstens einem Bildschirm.

Verweis: Die Breite der Tabelle bei 320 px und die Lage des Entfernen-Knopfs
stehen auch im Bericht [Handschuh-Bedienung](handschuh-bedienung.md).

### R4-H3 [P3] Stärke-Leiste der Musterung kürzt ihre Beschriftung (neu, Folge der R3-H1-Behebung)

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Vorlage → „Einsatz vorbereiten“, klebende
Stärke-Leiste oben (Szenario 1).

**Beobachtung:** Die Leiste klebt beim Scrollen oben und zählt mit, wie in
Runde 3 empfohlen. Ihre Beschriftungen werden gekürzt: 360 × 640 Standard
„FÜHRER / UNTERF. / MANNSC… / GESAMT“, 320 × 568 im Feld-Modus
„FÜH… / UNT… / MAN… / GES…“. Im Assistenten steht dieselbe Stärke als
„0 / 2 / 6 / 8 (F / UF / M / Ges)“.

**Reaktion des Helfers:** Die Zahlen liest er, die Reihenfolge F / UF / M /
Ges kennt er vom Papierbogen. „MAN…“ und „GES…“ wirken wie ein
Darstellungsfehler.

**Problem:** Abgeschnittene Wörter an der Stelle, die die Zählung
absichern soll.

**Folge im Einsatz:** Gering; das Muster ist bekannt.

**Empfehlung:** Die Kürzel verwenden, die der Bogen selbst nutzt (F / UF / M
/ Ges), oder die Beschriftung unter 360 px in einer kleineren Stufe setzen.

**Nachprüfung:** 320 × 568 Feld-Modus: alle vier Beschriftungen ohne „…“.

### R4-H4 [P3] Neue Person ist ungefragt „M“ und „Fleisch“ (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet; Folge ist Risiko.

**Fundstelle / Aufgabe:** Schritt 3 → „+ Person hinzufügen“ (Szenario 5).
Code: Vorgaben in `src/app/hilfen.ts` (`ernaehrung: Ernaehrung.FLEISCH`),
Geschlecht 0 = M im Format (`vendor/eeb-format/src/model.ts`).

**Beobachtung:** Die neue Karte „Person 9 von 9“ zeigt „Geschlecht M“ und
„Ernährung Fleisch“ als gesetzte Werte; eine Auswahl „keine Angabe“ gibt es
nicht. Beide fließen sofort in „Geschlecht: 7 männl. / 1 weibl.“ bzw. die
Unterbringung und in „Verpflegung … davon 1 vegetarisch“.

**Reaktion des Helfers:** Er trägt die Nachzüglerin mit Vor- und Nachname
ein und drückt „Weiter →“. Die beiden Auswahlfelder darunter hält er für
erledigt.

**Problem:** Eine Vorgabe sieht aus wie eine Angabe.

**Folge im Einsatz:** Unterbringung (getrennte Räume) und Verpflegung
(vegetarisch/vegan) können um einzelne Köpfe falsch geplant werden. Gering,
weil der Meldekopf meist nachfragt.

**Empfehlung:** Die Vorgabe bei neuen Personen als „bitte wählen“
kennzeichnen (z. B. hervorgehobener Rahmen, bis jemand die Auswahl
berührt hat) und in der Übersicht zählen, bei wie vielen Personen Geschlecht
und Ernährung nur vorbelegt sind. Ein echtes „keine Angabe“ bräuchte ein
Formatfeld und ist eine eigene Entscheidung.

**Nachprüfung:** Neue Person anlegen, nur Namen tippen: Die Karte zeigt
sichtbar, dass Geschlecht und Ernährung noch nicht gewählt sind.

### R4-H5 [P3] Kleinere Stolpersteine bei Begriffen und Hervorhebung (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Beobachtung:**
- **Anzeigemodus:** Im Kopf des Assistenten steht oben rechts ein großer
  weißer Knopf „Standard ▾“, unten in der Leiste „◐“ ohne Text. Was
  „Standard“ meint, steht erst nach dem Tippen da (Standard / Dunkel / Feld /
  Nacht, 42 px hoch). Für den Helfer klingt „Standard“ nach einer
  Bogen-Einstellung.
- **Rückholplatz:** Die Startseite nennt den verworfenen Bogen „Zuletzt
  verdrängter Bogen“; die Quittung nach „Verwerfen“ sagt „Rückholung unten
  auf der Startseite“, die Karte steht aber oben unter dem Titel.
- **Mehrteiliges QR-Vollbild:** Während noch Teile fehlen, ist „Schließen“
  der dunkle Hauptknopf und „Weiter zu Teil 2 →“ hell umrandet, 8 px
  darüber. Die Rückfrage „Teil 2 von 7 wurde noch nicht gezeigt“ fängt den
  Fehlgriff ab; die Blickführung zeigt trotzdem auf den falschen Knopf.
- **Nach der Musterung:** Von „Einsatz starten“ bis zur Übergabe führt
  „Weiter →“ durch Personal, Fahrzeuge und Sofortbedarf, die gerade erst aus
  der Vorlage kamen (vier Tipps). Ein „Weiter zur Übergabe“ in Schritt 2
  fehlt. Gering, die Leiste unten klebt.

**Reaktion des Helfers:** Kurzes Zögern bei „Standard“ und „verdrängt“;
beim mehrteiligen Code greift der Daumen zum dunklen Knopf.

**Folge im Einsatz:** Gering.

**Empfehlung:** Knopf „Ansicht: Standard ▾“ bzw. „◐ Ansicht“ beschriften;
„Zuletzt geschlossener Bogen“ statt „verdrängt“ und die Lage in der Quittung
richtig nennen; im mehrteiligen Vollbild „Weiter zu Teil n“ als
Hauptknopf zeigen, „Schließen“ erst nach dem letzten Teil; nach einer
Musterung in Schritt 2 zusätzlich „Zur Übergabe →“ anbieten.

**Nachprüfung:** Neuen Helfer fragen, wofür „Standard“ steht; im
Siebener-Code die Hervorhebung prüfen; nach „Einsatz starten“ mit Ort in
höchstens zwei Tipps zur Übersicht.

Verweise auf andere Runde-4-Berichte (dort zuerst festgehalten, hier nur
mitgesehen): Im Feld-Modus ragt „Zur Übersicht →“ bei 360 px über den
rechten Rand (gemessen x 228–402 px, Text abgeschnitten); „+ übergeordnete
Ebene“ und „OV/RB/LV-Vorlage“ stoßen ohne Abstand aneinander; ein grober
Tipp unter „Weiter zu Teil 2“ trifft „Schließen“ — alle in
[Handschuh-Bedienung](handschuh-bedienung.md).

## Bestätigtes

- **Hauptweg oben:** Mit Vorlage steht „Einsatz vorbereiten: B Ulm“ als
  erster Knopf unter „Meinen Bogen ausfüllen“ (360 × 640 Standard bei
  388 px mit zwei Vorlagen); „Fortsetzen“ der Entwurfskarte bei 291–335 px
  (Standard), 357–410 px (Feld), 380–434 px (320 × 568 Feld), 252–296 px
  (quer).
- **Jede Ansicht beginnt oben:** Vorlagenkarte nach 894/1 210/1 325/764 px
  Scrollen → Musterung bei 0 px; „Fortsetzen“ nach Scrollen → 0 px.
- **Musterung:** Kopftext „Alle sind vorab angehakt — wer oder was fehlt,
  antippen und abwählen.“, Zeilen 294 × 64 px, Stärke-Leiste klebt oben,
  „Einsatz starten · 8 Pers · 2 Fz“. Ohne Abwahl Rückfrage „Alle aus der
  Vorlage dabei? Gemeldet werden alle 8 Personen und alle 2 Fahrzeuge …“.
  Sofortbedarf und „Bemerkung aus der Vorlage“ stehen als nicht angehakte
  Kästchen da und kommen ohne Haken nicht in den Bogen.
- **QR-Vollbild:** Einheit, Stärke und Stand über dem Code; „Teil n von 7“
  groß darüber; Code 328 px (360 × 640), 288 px (320 × 568), quer 328 px ab
  16 px, „Schließen“ jeweils im Bild. Nacht-Modus: weiße Platte, dunkler
  Rand.
- **Übergabe-Vermerk:** Schließen nach Teil 1 von 7 → „Teil 2 von 7 wurde
  noch nicht gezeigt. Ohne ihn hat die Gegenstelle den Bogen nicht.“ Nach
  allen Teilen „Hat die Gegenstelle alle 7 Teile gescannt? Die App kann das
  nicht selbst sehen.“ Zurück-Taste nach Teil 1: kein Vermerk; nach Teil 7:
  „QR-Code gezeigt 20:56 Uhr — Empfang nicht bestätigt.“ Bestätigt:
  „✓ Übergeben 20:44 Uhr (bestätigt) — seitdem unverändert.“
- **Änderung nach Übergabe:** „⚠ Seit der Übergabe 20:45 Uhr geändert
  (Stärke 0 / 2 / 6 / 8 → 0 / 2 / 5 / 7) — neu übergeben, damit der
  Meldekopf den Stand hat.“
- **Fehlgriffe:** „Person entfernen“ mit Namen in der Rückfrage und
  „Rückgängig“; „Verwerfen“ und „Bogen schließen“ nennen den Bogen und den
  Rückholplatz; Vorlage „Löschen“ → „in den Papierkorb gelegt (30 Tage
  rückholbar). Rückgängig“.
- **Unterbrechung:** Neue Person, „Jonas“ getippt, nach 150 ms neu geladen:
  Startseite mit Karte „Stärke 0 / 2 / 7 / 9 … gespeichert“, Name erhalten,
  „Fortsetzen“ öffnet Schritt 3.
- **Offline:** „Jetzt offline bereit“ nach rund 3 s, Neustart ohne Netz,
  „PDF erzeugen“ → „PDF gespeichert: eeb-…_THW_Ulm_Bergungsgruppe.pdf — liegt
  im Download-Ordner des Browsers.“
- **Lesbarkeit:** In Schritt 2 und Übersicht kein Text unter 4,5 : 1 in
  Standard, Feld und Nacht (aus den berechneten Farben).
- **Offene Punkte:** „Ort/Auftrag ist noch leer“ steht in Schritt 2 als
  Hinweis und in der Übersicht als antippbarer Punkt; „Weiter →“ blockiert
  nicht.

## Abgleich mit Runde 3

Grundlage: [../runde-3/feldtauglichkeit.md](../runde-3/feldtauglichkeit.md)
samt „Stand der Behebung“ und [../runde-3/README.md](../runde-3/README.md).

| Runde-3-Befund | Stand laut Bericht | Bewertung Runde 4 | Beobachtung |
| --- | --- | --- | --- |
| R3-H1 Einstieg von der Startseite mitten im Formular | behoben | **hält** | Musterung, Assistent und „Fortsetzen“ beginnen nach 764–1 325 px Scrollen bei 0 px. Die klebende Stärke-Leiste kürzt ihre Beschriftung (R4-H3). |
| R3-H2 QR-Vollbild: „Teil 1 von 2“ verdeckt, quer abgeschnitten | behoben | **hält** | „Teil 1 von 7“ über dem Code, Code und Ruhezone ganz im Bild (quer ab 16 px), „Schließen“ im Bild. Hervorhebung von „Schließen“ statt „Weiter“ als Rest (R4-H5). |
| R3-H3 „Übergeben“ nach kurzem Blick | behoben | **hält** | Nach Teil 1 kein Vermerk, Rückfrage nach allen Teilen, „gezeigt“ und „bestätigt“ getrennt, auch über die Zurück-Taste. |
| R3-H4 Musterung: alles angehakt, Text sagt „abhaken“ | behoben | **hält** | Text passt zur Vorgabe, Rückfrage „Alle aus der Vorlage dabei?“ ohne Abwahl, nach einer Abwahl ohne Rückfrage. |
| R3-H5 Knöpfe des Helfers unter dem Bildrand | behoben | **hält** | „Einsatz vorbereiten: …“ und „Fortsetzen“ im ersten Bild in allen drei Größen und im Feld-Modus. |
| R3-H6 Nachzügler: 18 Bildschirme | weitgehend | **hält, Rest bleibt** | „+ Person hinzufügen“ über der Liste springt zur neuen Karte, Cursor im Vornamen. Die Kurz-Liste rollt am Telefon weiter seitlich (R4-H2). |
| R3-H7 Kleinere Stolpersteine | weitgehend | **hält** | THW-Beispiel „z. B. Bergungsgruppe, FGr Wasserschaden/Pumpen“, Knopf „Bogen schließen“, „Bemerkung aus der Vorlage“ als Kästchen. Weiße QR-Platte im Nacht-Modus bewusst offen. |

Einordnung: Alle sieben Runde-3-Befunde halten; keiner hat sich ins
Gegenteil verkehrt. Zwei neue Kleinigkeiten sind Folgen der Behebungen
(R4-H3 aus R3-H1, die Hervorhebung in R4-H5 aus R3-H2). R4-H1 ist neu und
lag in Runde 3 außerhalb der geprüften Wege, weil dort immer ein Vorschlag
angetippt wurde. R4-H2 ist der Rest von R3-H6.

## Abschluss

- **Aufgabe geschafft:** Mit Vorlage bis zum bestätigten QR-Code: ja.
  Siebenteiliger Code: ja. Neuer Bogen ohne Vorlage: ja, aber die Einheit
  kann unbemerkt als Freitext durchgehen (R4-H1). Nachmeldung nach Übergabe,
  Wiedereinstieg nach Neuladen, offline: ja.
- **Fremde Hilfe nötig:** nein.
- **Mentales Modell:** Papierbogen aus der Mappe (Vorlage), Fehlende
  streichen, Ort eintragen, vorzeigen, nachfragen „hast du’s?“. Die App folgt
  dem jetzt auch in der Bildschirmführung, bis hin zur Frage nach dem Scan.
- **Größtes Einsatzrisiko:** Ein von Hand begonnener Bogen, dessen Einheit
  nur als Freitext ankommt, während die App „vollständig und plausibel“
  meldet (R4-H1).
- **Top-Priorität für die nächste Iteration:** Ausgeschriebene Bezeichnung
  und OV-Namen beim Verlassen des Feldes erkennen, nicht erkannte Einheit als
  offenen Punkt führen (R4-H1).

**Verständnisprüfung**

- Orientierung: **verstanden**. Jede Ansicht beginnt oben, Schrittleiste
  mit Haken, Überschrift im Bild.
- Nächster Schritt: **verstanden**. „Einsatz vorbereiten: B Ulm“, „Einsatz
  starten · 8 Pers · 2 Fz“, „Weiter →“, „Bogen übergeben…“, „Weiter zu
  Teil n →“.
- Systemzustand: **verstanden, mit einer Lücke**. Speicherzeile,
  Offline-Hinweis und Übergabe-Vermerk sagen, was die App weiß; das Häkchen
  an Schritt 1 sagt bei Freitext mehr (R4-H1).
- Fehlerbehebung: **verstanden**. Rückfragen mit Namen, Rückgängig,
  Papierkorb, Rückholplatz, Zurück-Taste.
- Feldtauglichkeit: **geeignet, nicht vollständig geprüft**. Handschuhe,
  Sonnenlicht, Kamera-Scan mehrteiliger Codes und native Builds gehören in
  einen Praxistest.

## Stand der Behebung

Stand 06.10.2026, Paket 3 „Layout, 200 % Schrift, Touch, Sicht“.
Geprüft mit Typprüfung, Unit-Tests (2 562 grün), Verhaltenstests (137 Szenarien, 1 749 Schritte grün) und
Nachmessung im Dev-Server (360 × 640, 320 × 568, 640 × 360,
`isMobile`/`hasTouch`, de-DE, Port 5180, Schrift 100 % und 200 %). Aufgeführt
sind nur die Befunde dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R4-H2 Kurz-Liste ist am Telefon keine kurze Liste | teilweise | Unter 44rem Rahmenbreite (in der tatsächlichen Schrift) ist jede Person eine Karte aus sechs Spalten: Stelle und die drei Pfeile nebeneinander, Vorname und Nachname, „Zählt als“ und Geschlecht, ✕ am Zeilenende. Nichts liegt mehr außerhalb des Bilds (`scrollWidth` des Rahmens gleich `clientWidth`: 326 px bei 360, 280 px im Feld-Modus bei 320 px, auch bei 200 %); Name, „Zählt als“, Geschlecht, Reihenfolge und Entfernen stehen ohne seitliches Schieben im Bild, jedes Ziel 44 px (Feld 54 px). Die Spaltenköpfe bleiben für Vorlesesoftware im Baum (ausdrückliche Tabellenrollen). Nicht erreicht: „acht Zeilen in höchstens einem Bildschirm“ — eine Person misst 168 px (Feld 202 px, vorher rund 160 px), weil Vorname/Nachname, „Zählt als“/Geschlecht und die Pfeile je eine Zeile mit vollem Tippziel brauchen; acht Personen sind rund zwei Bildschirme lang. Ein Menü-Knopf für Sortieren und Entfernen würde das ändern, kostet aber einen Tipp mehr und den Umbau der Tabelle. **Paket 5 (06.10.2026):** erneut geprüft, nicht geändert. Eine Person ist mit drei Zeilen zu je einem vollen Tippziel (44 px, Feld 54 px) kaum unter 168 px zu bringen: Name, „Zählt als“, Geschlecht und die vier Knöpfe (▲ ▼ ⇑ ✕) passen bei 326 px nicht in zwei Zeilen, ohne die Ziele unter das Handschuhmaß zu drücken. Acht Zeilen in einem Bildschirm gehen nur mit einem Menü-Knopf je Zeile (Sortieren, Entfernen) und damit mit einem Tipp mehr beim Entfernen, dessen Rückfrage ohnehin bleibt; das ist ein Umbau der Tabelle und kein Nachziehen. |
| R4-H3 Stärke-Leiste der Musterung kürzt ihre Beschriftung | behoben | Unter 24rem Leistenbreite (Container-Abfrage, `rem` der Seite) tragen die vier Felder die Kürzel des Bogens, „F“, „UF“, „M“, „Ges“; das ausgeschriebene Wort bleibt für Vorlesesoftware im Baum. Nachlauf (Vorlage „B Regen (Stamm)“ → Einsatz vorbereiten): 360 × 640 und 320 × 568 in Standard und Feld sowie 390 px: alle Beschriftungen ohne „…“; quer (640 px) stehen „FÜHRER / UNTERF. / MANNSCH. / GESAMT“ ausgeschrieben. |


Stand 06.10.2026, Paket 4 „Uhr, Speicher, Löschen, Offline, Zeiten".
Geprüft mit Typprüfung, Unit-Tests (2 614 grün), Verhaltenstests (137 Szenarien, 1 749 Schritte
grün) und Nachmessung im Browser (360 × 640, `isMobile`/`hasTouch`, de-DE;
Dev-Server Port 5180, für den Service Worker Produktionsbuild mit
`vite preview` Port 4174 hinter einem drosselnden Reverse-Proxy). Aufgeführt
sind nur die Befunde dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R4-H1 Ausgeschriebener Einheitstyp / kleingeschriebener OV bleibt Freitext bei „✓" | behoben | Beim Verlassen löst das Typfeld auch den ausgeschriebenen Namen („Bergungsgruppe") auf, ohne Rücksicht auf Groß-/Kleinschreibung und Randleerzeichen, bei genau einem Treffer; das OV-Feld findet „ulm" als „Ulm" (Kürzel, Telefon, E-Mail). Bleibt der Typ Freitext, sagt das Feld nach dem Verlassen „„Berg" ist nicht aus der Liste — Vorschlag antippen oder als eigener Typ behalten", Schritt 1 zeigt kein „✓" mehr und die Übersicht führt „Einheitstyp „Berg" nicht erkannt" als offenen Punkt (nicht in der Schnellerfassung). Ein OV-Name ohne Verzeichnis-Treffer trägt den Hinweis, dass Kürzel und Kontakt fehlen. |
| R4-H4 Neue Person ist ungefragt „M" und „Fleisch" | teilweise | Geschlecht und Ernährung einer mit „+ Person hinzufügen" angelegten Karte sind gestrichelt und gelb hinterlegt, ein Hinweis nennt „nur vorbelegt (M, Fleisch) — bitte wählen"; er verschwindet je Feld, sobald es berührt wird. Offen: die Zählung in der Übersicht („bei n Personen nur vorbelegt") und ein echtes „keine Angabe", weil beides ein Formatfeld brauchte (Transportformat bleibt unverändert); der Merker gilt je Karte und Sitzung. |
| R4-H5 Kleinere Stolpersteine bei Begriffen und Hervorhebung | weitgehend | Knopf im Assistenten-Kopf „Ansicht: Standard ▾" (Name für Vorlesesoftware gleichlautend; 360 px: 140 × 44 px, kein seitliches Überlaufen, auch 320 px im Feld-Modus). Rückholplatz „Zuletzt geschlossener Bogen" / „Zuletzt geschlossenen Bogen zurückholen", die Quittung nach „Verwerfen" sagt „Rückholung oben auf der Startseite". Mehrteiliges QR-Vollbild: „Weiter zu Teil n →" ist der dunkle Hauptknopf, solange Teile fehlen, „Schließen" tritt zurück (gleiches Maß und gleicher Platz) und wird nach dem letzten Teil wieder Hauptknopf. Nach „Einsatz starten" bietet Schritt 2 „Zur Übergabe →" an. Nicht beschriftet: das „◐" in der Fußleiste (Platz, vgl. R4-M3) — es trägt den Namen „Ansicht: Standard – ändern" und einen Tooltip. |
