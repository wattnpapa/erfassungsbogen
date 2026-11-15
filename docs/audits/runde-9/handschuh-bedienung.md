# Audit „Handschuh-Bedienung“, Runde 9 (Touch-Ziele, Abstände, Doppeltipps, Rückfragen, Zoom)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-glove-touch-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `c789947`.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-8-Befunde. Geprüft sind die in Runde 8 geänderten Stellen, soweit sie die
Bedienung mit Handschuh berühren: Rückfragen bei Browser-Zoom 200 %, Knopfabstand
quer, Fußleiste und klebende Leisten bei 180 × 320, Sprungmarke, „Eingaben
verwerfen…“, Tipp-Sperre nach dem Öffnen einer Rückfrage, Zwei-Fenster-Rückfrage
mit Werten, Lagemonitor, Nummern-Verschiebung in der Rückfrage „Meldung
entfernen?“, Musterung, Schrittleiste und Kopf bei Zoom.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, je Lauf ein eigener
Browser-Kontext. Viewports 360 × 640 (Grundeinstellung), 320 × 568, 640 × 360
quer, Tablet 820 × 1180; Browser-Zoom 200 % nachgestellt (halbierter CSS-Viewport,
vierfache Pixeldichte: 180 × 320, 160 × 284, 320 × 180) und `html { font-size: 200% }`
(auch bei 320 × 568). Das ist kein echter Chrome-Zoom: Ein CSS-Pixel ist dort
doppelt so groß wie am Gerät ohne Zoom.

Zustände per `localStorage`-Seed, jeweils mit `uebung: false` und `stand` auf
heute: `eeb.entwurf.v1` (Großbogen Verstärkter Bergungszug, 38 Personen, 10
Fahrzeuge), `eeb.einsaetze.v1` (Sammlung „Hochwasser Musterstadt“ aus sechs
Übungsbögen, einmal mit `vomPapier`), `eeb.vorlagen.v1` (über „Als Vorlage
speichern“ erzeugt). Den Zwei-Fenster-Fall erzeugte ein zweiter Tab im selben
Kontext, der „Diesel“ im Entwurf änderte.

Blindprüfung: Die Berichte unter `docs/audits/` habe ich erst nach den ersten
Messungen gelesen (Startseite, Schritte 1 bis 6 in sieben Viewports, Zielgrößen
und Abstände, Einsatzansicht, Karten, Rückfragen, Lagemonitor, Zwei-Fenster-Leiste,
Doppeltipp-Versuche). Gemessen habe ich Rechtecke per `getBoundingClientRect`
(feste und klebende Elemente getrennt gezählt) und Tipps per `touchscreen.tap`.
Maßstab wie in Runde 8: 44 px Mindestkante, 8 px Mindestabstand, mit
Arbeitshandschuh eher 48 px und 12 px. Elf weitere Prüfer nutzten den Server
gleichzeitig; Zeitmessungen sind unsicher. Doppeltipps stelle ich mit 100, 450 und
900 ms Abstand an derselben Bildschirmstelle nach.

Hinweis zur Messmethode: `locator.tap()` von Playwright scrollt und tippt in einem
Zug; auf der Sammlungsseite blieb der Tipp dabei mehrfach ohne Wirkung, ein
`touchscreen.tap` nach dem Scrollen funktionierte jedes Mal. Ich werte das als
Eigenheit der Werkzeugkette, nicht als Befund; ein echter Finger-Test steht aus.

**Nicht prüfbar:** echte Handschuhe auf echtem Glas, echte Bildschirmtastatur
(nachgestellt durch niedrigeren Viewport), Wischen und Ziehen, Safari/WebKit,
native Datums- und Zeitpicker, echter Browser-Zoom, echte Systemschrift,
Geräteuhr-Warnung (R7-G8/H9, Grenze), R6-O9 (Grenze), das späte Zurückkehren
eines eigenen `history.back()` (nicht nachgestellt), „Eingaben verwerfen…“ bei
Zoom (Formular öffnete sich in der Nachstellung nicht).

Kennzeichnung: **gemessen** heißt Zahl aus dem Browser, **beobachtet** heißt im
Ablauf oder auf dem Bildschirmfoto gesehen, **Risiko** heißt plausibel, aber nicht
nachgestellt.

## Urteil

Die Runde-8-Behebungen tragen. Die Rückfragen sind bei nachgestelltem Zoom 200 %
bedienbar: hochkant (180 × 320, 160 × 284) stehen „Zurücksetzen“ und „Abbrechen,
Bogen behalten“ untereinander (130 bzw. 110 px breit, 44 und 58 px hoch, 17 px
Lücke), der Rumpf ist 139 bzw. 103 px hoch und rollt; quer (320 × 180) liegen die
Knöpfe 121 px breit nebeneinander, 24 px Lücke, Rumpf 106 px. Bei 360 × 640 und
320 × 568 (auch mit 200 % Schrift) bleiben 41 bis 81 px zwischen Folgeknopf und
Abbruch. Die Fußleiste des Assistenten nimmt bei Zoom 22 % der Bildhöhe, quer 16 %.
Die Sprungmarke endet in allen gemessenen Lagen bei −8 px. „Eingaben verwerfen…“
ist ein Knopf von 173 × 44 px mit 16 px Lücke zu „Später“. Die Zwei-Fenster-Leiste
nennt beide Stände mit Zeit und Personenzahl, die Knöpfe sind 44 bis 56 px hoch. Die
Rückfrage „Meldung entfernen?“ nennt die Nummernverschiebung („Die Einheiten Nr.
2–6 rücken auf und heißen danach Nr. 1–5“). Der Lagemonitor hat 44-px-Knöpfe mit 7
bis 14 px Lücke.

Reibung bleibt an Stellen, die bei Zoom 200 % aus den Behebungen von Runde 8
folgen: Auf den Sammlungsseiten bleibt rechts ein 60-px-Streifen für die Ecke „◐“
frei, der Inhalt hat nur 62 % der Breite (R9-G1). Die klebende Kopfzeile der
Dialoge nimmt bei Zoom über die Hälfte des Fensters (R9-G2). Dazu kommen vier
weitere P3-Reste. Es gibt keinen P0, P1 und P2. Alle Aufgaben (Personal
durchblättern, Person verschieben und entfernen, Bogen übergeben, Bogen schließen,
Einsatz öffnen, Einheit abrücken und entfernen, Zwei-Fenster-Stand entscheiden,
Lagemonitor bedienen, Vorlage mustern) sind ohne fremde Hilfe zu schaffen.

## Befunde

### R9-G1 [P3] Zoom 200 % hochkant: Sammlungsseiten lassen rechts 60 px frei, Inhalt nur 62 % der Breite, Wortbruch

**Priorität:** P3

**Kennzeichnung:** gemessen und beobachtet (Nachstellung des Zooms, 180 × 320).

**Fundstelle / Aufgabe:** Startseite → „Hochwasser Musterstadt“ öffnen →
Einheitenliste, Karten, Ausgabeblock. `index.html`, Regel
`html:has(.anzeige-balken) main { padding-right: … 60px … }` im Block
`@media (max-width: 16rem)` (aus R8-M9). Bildschirmfotos `k_telefonZ.png`,
`k2_telefonZ.png`.

**Beobachtung:** Bei 180 × 320 hat `main.einsatz-detail` links 8 px, rechts 60 px
Innenabstand; die Karten (`section.karte`) sind 112 px breit (x 8 bis 120 von 180).
Der Streifen ist für den Ecken-Knopf „◐“ (62 px, unten rechts) reserviert, der
Knopf steht aber nur am unteren Bildrand; im übrigen Bild bleibt ein Drittel der
Breite leer. In der schmalen Spalte bricht das Wort „eingetroffen“ im Kennzeichen
„kürzlich eingetroffen“ mitten im Wort („eingetroffe / n“), die Überschrift
„Einheiten (6 gemeldet · 6 zählend)“ steht in vier Zeilen, „Karten“ und „Tabelle“
stehen untereinander. Die Aktionsknöpfe der aufgeklappten Karte sind 94 px breit
und stehen einzeln untereinander. Bei 360 × 640, 320 × 568 und 200 % Schrift tritt
das nicht auf (Rand 16 px, Inhalt 328 bzw. 288 px).

**Erwartung der Rolle:** Wer die Seite am Telefon auf 200 % zieht, nutzt die
volle Breite; der Platz für die Ecke wird nur am unteren Rand freigehalten.

**Auswirkung im Einsatz:** Mehr Zeilenumbrüche, mehr Rollen, kleinere Trefferfläche
je Karte (94 statt rund 150 px); kein Fehltipp nachgestellt. Die Karte ist
weiterhin als Ganzes Ziel.

**Empfehlung:** Den Streifen nur dort freihalten, wo der Knopf liegt (unterer
Rand des Inhalts), nicht über die ganze Höhe; oder den Knopf bei sehr schmalem
Bild in die Fußzeile der Seite legen. Verwandt mit der bekannten Grenze R7-G4/M8,
aber eigene Ursache (Breite statt Höhe).

**Nachprüfung:** 180 × 320: Karte „Einheiten“ mindestens 150 px breit; kein
Wortbruch im Kennzeichen.

### R9-G2 [P3] Dialoge bei Zoom 200 %: klebende Kopfzeile nimmt 53 bis 61 % des Fensters, Titel bricht im Wort

**Priorität:** P3

**Kennzeichnung:** gemessen und beobachtet (Dialog „Bogen übergeben“; Bildschirmfoto
`z0.png`, `t_telefonZ.png`).

**Fundstelle / Aufgabe:** Schritt 6 → „Bogen übergeben…“; `dialog > .kopfzeile:first-child`
(klebend, aus R8-M5). Gilt für die einfachen Dialoge der Klasse `teilen-dialog`;
die Rückfragen (`abfrage`) haben keine klebende Kopfzeile.

**Beobachtung:** Kopfzeile (Titel und „Schließen“ in zwei Zeilen) und Fensterhöhe:
360 × 640: 101 von 608 px (17 %); 320 × 568 mit 200 % Schrift: 120 von 536 px
(22 %); 640 × 360: 68 von 328 px (21 %); 180 × 320: 154 von 288 px (53 %);
160 × 284: 154 von 252 px (61 %); 320 × 180: 101 von 168 px (60 %). Bei 180 × 320
steht der Titel als „Bogen / übergebe / n“ (Wortbruch), darunter „Schließen“ mit
98 × 44 px; für den Inhalt bleiben rund 130 px. Beim Anspringen eines Knopfs mit
`scrollIntoView({block:"center"})` lag das Ziel unter der klebenden Kopfzeile
(`elementFromPoint` lieferte „Schließen“); ein Tipp traf dort den falschen Knopf.
Mit dem Ziel am unteren Rand funktionierte der Tipp.

**Erwartung der Rolle:** Beim Rollen im Dialog bleibt höchstens ein Viertel der
Höhe belegt; ein Ziel unter der klebenden Zeile ist per Rollen erreichbar.

**Auswirkung im Einsatz:** Bei Zoom bleibt wenig Inhalt im Bild, und ein
angesprungenes Ziel kann unter der Kopfzeile verschwinden. „Schließen“ bleibt
stets im Bild, deshalb kein Datenverlust.

**Empfehlung:** Die Kopfzeile bei niedrigem Bild nicht kleben lassen (nur
„Schließen“ als schmale Leiste) und den Titel nicht mitten im Wort brechen.

**Nachprüfung:** 180 × 320, 160 × 284, 320 × 180: Kopfzeile höchstens ein Drittel
des Fensters; Titel ohne Wortbruch.

### R9-G3 [P3] Schritt 2: „Dies ist eine Übung“ liegt ohne Lücke über dem Aufklapp-Feld „Datenschutzfrist“

**Priorität:** P3

**Kennzeichnung:** gemessen (360 × 640, 320 × 568, 200 % Schrift, Zoom); Risiko
für den Fehltipp.

**Fundstelle / Aufgabe:** Schritt 2 „Einsatz“, Kontrollkästchen „Dies ist eine
Übung“ (174 × 44 px, y 263) und `summary` „Datenschutzfrist: Namen werden nach 90
Tagen anonymisiert“ (294 × 64 px, y 307).

**Beobachtung:** Beide Ziele grenzen mit 0 px aneinander. Die Kästchen „Einsatzbeginn
eintragen“ und „Einsatzende eintragen“ darüber haben 22 px Abstand. Das Kästchen
„Übung“ schaltet die Kennzeichnung des ganzen Bogens um (Übung statt Einsatz), das
Aufklappfeld ist harmlos.

**Erwartung der Rolle:** Die Aktion mit Folge für den Bogen hat mindestens 12 px
Luft zu Nachbarn.

**Auswirkung im Einsatz:** Wer mit Handschuh die Zeile „Datenschutzfrist“ öffnen
will und zu hoch trifft, markiert den Bogen als Übung. Das sieht man am Haken, und
ein zweiter Tipp macht es rückgängig; unbemerkt würde der Bogen als Übung weitergegeben.

**Empfehlung:** 12 bis 16 px Abstand zwischen beiden oder das Aufklappfeld an das
Ende der Karte setzen.

**Nachprüfung:** Abstand „Dies ist eine Übung“ zu „Datenschutzfrist“ mindestens 12 px.

### R9-G4 [P3] Quer 640 × 360: „‹ Startseite“ liegt 2 px über den Schritt-Tabs 4 bis 6, die Ansicht steht doppelt

**Priorität:** P3

**Kennzeichnung:** gemessen (Schritt 1 bis 6; Bildschirmfoto `s_quer_2.png`).

**Fundstelle / Aufgabe:** Kopf des Assistenten quer: „‹ Startseite“ (80 × 44 px bei
x 307, y 5), Schritt-Tabs 4, 5, 6 (51 × 44 px, y 51), Segmente „Standard / Feld /
Dunkel / Nacht“ (69, 44, 58, 52 px breit, 0 px Lücke), Fußleiste mit „◐ Ansicht“.

**Beobachtung:** Der Abstand von „‹ Startseite“ zu den Tabs darunter ist 2 px.
„Startseite“ verlässt den Assistenten (der Entwurf bleibt, „Fortsetzen“ holt ihn
zurück). Die Ansichtswahl gibt es quer zweimal: als vier aneinanderliegende
Segmente oben und als „◐ Ansicht“ unten. Hochkant (360 × 640) liegt „Startseite“
mit 13 px Abstand über der Schrittleiste.

**Erwartung der Rolle:** Das Ziel, das den Ablauf verlässt, liegt nicht 2 px
neben den Zielen zum Weitergehen.

**Auswirkung im Einsatz:** Ein Handschuhfinger, der Schritt 4, 5 oder 6 sucht,
trifft quer leicht „Startseite“ und muss über „Fortsetzen“ zurück. Kein
Datenverlust, ein Umweg.

**Empfehlung:** Quer 8 bis 12 px Lücke zwischen Zeile und Schrittleiste; die
Ansichtswahl nur an einer Stelle anbieten.

**Nachprüfung:** 640 × 360: Abstand „‹ Startseite“ zu den Tabs mindestens 8 px.

### R9-G5 [P3] Feste Leisten bei Zoom: Zwei-Fenster-Leiste, Fußleiste und Genauer-Ansicht belegen bis zu 72 % der Bildhöhe

**Priorität:** P3

**Kennzeichnung:** gemessen (Zwei-Fenster-Zustand, 5 Viewports).

**Fundstelle / Aufgabe:** Schritt 5 mit zweitem Fenster, das „Diesel“ ändert;
`div.fest-warnung` (fest oben) und `footer.assistent-nav` (fest unten).

**Beobachtung:** Fest oben stehen 104 px (16 %, 360 × 640), 88 px (28 %, 180 × 320),
53 px (15 %, 640 × 360) und 53 px (29 %, 320 × 180). Die Fußleiste kommt mit 70 px
(22 %) bzw. 56 px hinzu. Zusammen sind das bei 180 × 320 50 %, bei 320 × 180 61 %.
Nach „Genauer“ wächst die Leiste auf 160 px (50 %, 180 × 320), 142 px (50 %,
160 × 284), 90 px (50 %, 320 × 180) und 272 px (42 %, 360 × 640) und rollt dann in
sich (Inhalt 490 px bei 159 px sichtbar). Bei 180 × 320 ist die erste Zeile
abgeschnitten („Das…“), der Knopf heißt dort „Entscheiden“. „Anderen Stand laden“
(74 × 56 px) und „Meine Fassung behalten“ (74 × 56 px) sind erst nach Rollen in der
Leiste sichtbar.

**Erwartung der Rolle:** Beide Entscheidungsknöpfe stehen ohne Rollen im Bild, und
unter der Leiste bleibt mehr als die Hälfte für das Formular.

**Auswirkung im Einsatz:** Selten (nur mit zwei offenen Fenstern) und nur bei Zoom
relevant; die Entscheidung bleibt möglich, kostet aber Rollen in einer
Leiste, die selbst ein Fenster im Fenster ist.

**Empfehlung:** Bei niedrigem Bild die Entscheidungsknöpfe in der kompakten Leiste
lassen (ohne „Genauer“) oder die Leiste als Dialog öffnen.

**Nachprüfung:** 180 × 320 mit Zwei-Fenster-Zustand: beide Entscheidungsknöpfe ohne
Rollen im Bild nach „Entscheiden“; feste Leisten zusammen höchstens 60 %.

### R9-G6 [P3] Zahlenfelder ohne `inputmode`, Eingabetaste springt nicht weiter; „Weiter“ ist bei offener Tastatur ausgeblendet

**Priorität:** P3

**Kennzeichnung:** beobachtet (Attribute, Eingabetaste, niedriger Viewport); die echte
Tastatur nicht geprüft (Risiko).

**Fundstelle / Aufgabe:** Schritt 5 „Sofortbedarf“ (vier `type="number"` ohne
`inputmode`), Schritt 4 (Sitzplätze mit `inputmode="numeric"`); `src/app/tastatur.ts`.

**Beobachtung:** In Schritt 5 haben Verpflegung, Diesel, Benzin und Gemisch kein
`inputmode`, kein `enterkeyhint`; „Enter“ im Feld lässt den Fokus im Feld. Bei
nachgestellter Tastatur (Viewport auf 45 % der Höhe) setzt die App `tastatur-offen`
und blendet die Fußleiste samt „Weiter“ aus (gewollt, R4-G3); danach muss die
Tastatur geschlossen werden, um „Weiter“ zu erreichen. Schritt 3 hat 76 Textfelder
mit `autocomplete="off"`, aber ohne `enterkeyhint`.

**Erwartung der Rolle:** Beim Tippen von Zahlen erscheint ein reiner Ziffernblock,
und eine „Weiter“-Taste der Tastatur führt zum nächsten Feld.

**Auswirkung im Einsatz:** Mit Handschuh sind kleine Zeichen und Umschalttasten
der Tastatur mühsam; die Liter-Felder werden bei Systemen mit Zahlen-Tastatur mit
Komma und Vorzeichen angeboten. Ein Fehler entsteht nicht, es kostet Tipps.

**Empfehlung:** `inputmode="numeric"` (bzw. `decimal`) und `enterkeyhint="next"`
in Schritt 5 und 3; im letzten Feld „Fertig“.

**Nachprüfung:** Auf einem Telefon: Schritt 5 zeigt den Ziffernblock, die
Eingabetaste springt zum nächsten Feld.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Zielgrößen:** In den Schritten 1 bis 6, der Einsatzansicht, der Tabellenansicht
  und im Tablet (820 × 1180) sind alle Knöpfe, Eingaben und Auswahlfelder
  mindestens 44 px hoch; in Schritt 3 (328 Ziele) und Schritt 4 (109 Ziele) nichts
  unter 44 px. Zeilen der Personenliste: 44 × 44 px für „▲ ▼ ⇑“ mit 12 px Lücke,
  „✕“ 44 × 44 px mit 24 px Abstand zu den Feldern.
- **Aktionsknöpfe der Einheitenkarte:** 44 px hoch, 8 px Lücke; „Entfernen“ (rot) ist
  in „Mehr…“ verborgen und liegt 79 px von „Verschieben…“ entfernt.
- **„Abrücken“:** Quittung „Abgerückt 06:53: Nr. 1 …“ mit „Rückgängig“
  (222 × 44 px) und „✕“, 12 px Lücke, über dem Ansichtsbalken.
- **Person verschieben:** „▼“ folgt der Person (Rollen 520 → 750); ein zweiter Tipp
  nach 150 ms an gleicher Stelle wird ignoriert, nach 2 s verschiebt er dieselbe
  Person weiter.
- **Rückfragen:** „Für neuen Einsatz vorbereiten?“ nennt Zeitraum, Ort/Auftrag und
  Sofortbedarf; „Meldung entfernen?“ nennt die neue Nummerierung und das Ende von
  „Rückgängig“ beim Neuladen; „Einsatz löschen?“ nennt den Papierkorb (30 Tage).
- **Zwei-Fenster-Leiste:** „Dort … gespeichert 07:09:43 Uhr, 38 Personen. Hier: Stand
  …, zuletzt gespeichert …“ und beide Entscheidungen; hochkant 360 × 640 stehen
  „Anderen Stand laden“ und „Meine Fassung behalten“ 164 × 44 px nebeneinander im
  Bild.
- **Lagemonitor:** 360 × 640, 320 × 568 mit 200 % Schrift, 640 × 360, 180 × 320,
  320 × 180: „Einsatzdaten“, „Optionen“ 44 px hoch (14 und 7 px Lücke), Stufen-
  knöpfe, „Vollbild“ (80 px), „Schließen“ (97 px) 44 px hoch, 7 bis 9 px Lücke; kein
  seitlicher Überlauf.
- **Musterung:** Stärkeleiste 85 px + Fußleiste 67 px (24 %) bei 360 × 640; bei Zoom
  nur die Fußleiste (21 %); Zeilen 64 px hoch als ganzes Ziel.
- **Fußleiste und Tastatur:** Bei nachgestellter Tastatur verschwindet die Fußleiste,
  das Feld bleibt im Bild (72 bis 116 px von 288 px).
- **Kein seitlicher Überlauf** in Schritten 1 bis 6, Einsatzansicht und Lagemonitor
  bei allen sieben Lagen (`scrollWidth` gleich Bildbreite).
- **Keine Pflichtgesten.**

## Abgleich mit Runde 8

Grundlage: [../runde-8/handschuh-bedienung.md](../runde-8/handschuh-bedienung.md)
mit „Stand der Behebung“ in der [README von Runde 8](../runde-8/README.md).

| Runde-8-Befund | Stand laut README | Bewertung Runde 9 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R8-G1 Rückfragen bei Zoom 200 % (P2) | behoben | **hält** | 180 × 320: Knöpfe 130 × 44 und 130 × 58 px untereinander, 17 px Lücke, Rumpf 139 px; 160 × 284: 110 px breit, Rumpf 103 px; 320 × 180: 121 px breit nebeneinander, 24 px Lücke, Rumpf 106 px. Der Rumpf rollt (3,5 Zeilen sichtbar). |
| R8-G2 Fußleiste bei Zoom (P3) | behoben | **hält** | 70 px = 22 % (180 × 320, 160 × 284 = 25 %), quer-Zoom 56 px = 31 %, quer 56 px = 16 %. „Weiter →“ in Schritt 3 mit Wort, in Schritt 5 bei 180 px nur „→“. |
| R8-G3 Sprungmarke ragt ins Bild (P3) | behoben | **hält** | Unterkante −8 px: 360 × 640 (158 × 36 bei y −44), 320 × 568 mit 200 % (205 × 55 bei y −63), 180 × 320. |
| R8-G4 Klebende Leisten in der Musterung (P3) | behoben | **hält** | 360 × 640: 85 + 67 px (24 %); 320 × 568 mit 200 %: 96 + 73 px (30 %); 180 × 320: nur Fußleiste 67 px (21 %). |
| R8-G5 Knopfabstand quer (P3) | behoben | **hält** | Quer 235 und 235 px breit, 24 px Lücke, gleiche Oberkante; hochkant 41 px (360 × 640), 81 px (320 × 568 mit 200 %). |
| R8-G6 „Eingaben verwerfen…“ (P3) | behoben (nicht im Browser gemessen) | **hält** | 173 × 44 px, 16 px Lücke zu „Später“ (360 × 640 und quer). Zoom nicht geprüft. |
| R8-H5/S4 Prellschutz 450/800 ms (Grenze) | teilweise | **Grenze, Stand** | Doppeltipp an gleicher Stelle: Rückfrage „Bogen schließen“ bleibt bei 100 ms offen, bestätigt bei 450 und 900 ms (Entwurf weg, Startseite); „Einsatz löschen“ bleibt bei 100 und 450 ms offen, bei 900 ms schließt der Zweittipp die Rückfrage ohne Löschen; „Person entfernen“ bleibt in allen drei Fällen offen. Der Bogen bleibt über „Zuletzt geschlossener Bogen“ erreichbar. |
| R8-D5 „Rückgängig“ unter „Abrücken“ (Grenze) | teilweise | **Grenze, Stand** | Quittung mit „Rückgängig“ steht über dem Ansichtsbalken, nicht auf der Knopfstelle (360 × 640). Zweittipp-Sperre nicht gesondert geprüft. |
| R8-D2/W1 Nummern-Verschiebung | behoben | **hält** | Text in „Meldung entfernen?“ (siehe Bestätigtes). |
| R8-N6/E4 Zwei-Fenster-Rückfrage mit Werten | behoben | **hält** | Beide Stände mit Zeit und Personenzahl; Leistenhöhe siehe R9-G5. |
| R8-L1/L3–L5 Lagemonitor | behoben | **hält** | 6 von 6 Einheiten im Bild, Knöpfe 44 px; Stufenknopf heißt „Stufe: Dunkel · heller: Hell“, 197 × 44 px. |
| R8-M5 Dialoge: Kopfzeile bleibt oben | behoben | **hält, Nebenwirkung** | „Schließen“ stets im Bild; bei Zoom 53 bis 61 % (R9-G2). |
| R8-M9 „Bedarf:“ bei 180 px | behoben | **hält, Nebenwirkung** | Wert unter der Beschriftung; 60-px-Streifen rechts (R9-G1). |
| R7-G4/M8 Ecken-Knopf hochkant | Grenze | **Grenze, Stand** | Hochkant 62 × 44 px unten rechts bzw. Balken 46 px; unverändert. Eigene Folge: R9-G1. |
| R7-G8/H9 Geräteuhr-Warnung bei 200 % und 320 × 568 | Grenze | **nicht geprüft** | Außerhalb dieses Laufs, Stand wie in Runde 8. |
| R6-G6 Schrittleiste ohne Lücke | offen | **offen** | 72/53/53/53/53/44 px bei 360 px, 0 px Lücke; quer 2 px bis „Startseite“ (R9-G4). |
| R7-N9 Ziffern der Schrittleiste | Grenze | **Grenze, Stand** | Unverändert; „← Zurück zu Schritt 5 (Sofortbedarf)“ 259 × 44 px am Ende der Übersicht. |
| R6-O9, R7-N1, R8-A1, R8-M6 | Grenzen | **nicht geprüft** | Außerhalb der Rolle. |

## Abschluss

- **Aufgabe geschafft:** ja. Alle Abläufe der Rolle bei 100 % und 200 % Schrift
  sowie bei nachgestelltem Browser-Zoom 200 %; bei Zoom mit mehr Rollen
  (R9-G1, R9-G2, R9-G5).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Dies ist eine Übung“ sieht neben dem
  Aufklappfeld „Datenschutzfrist“ wie eine Zeile derselben Art aus; beide sitzen
  ohne Lücke aufeinander (R9-G3).
- **Größtes Einsatzrisiko:** Bei Zoom 200 % bleibt nach Kopfzeile, festen Leisten und
  Randstreifen nur ein Teil des Bildes für den Inhalt, so dass Karten und Dialoge
  nur durch viel Rollen bedienbar sind (R9-G1, R9-G2, R9-G5); ein Datenverlust
  entsteht daraus nicht.
- **Top-Priorität für die nächste Iteration:** Den 60-px-Streifen rechts nur dort
  freihalten, wo die Ecke „◐“ liegt, und die klebende Dialog-Kopfzeile bei
  niedrigem Bild kleiner oder nicht klebend setzen (R9-G1, R9-G2).

## Zusammenfassung

Befunde: **P0 0 · P1 0 · P2 0 · P3 6**. Neu: R9-G1 bis R9-G6 (alle P3). Von den
Runde-8-Befunden halten G1 (P2), G2, G3, G4, G5, G6; Grenzen bleiben R8-H5/S4,
R8-D5, R7-G4/M8; R6-G6 bleibt offen. Skripte und Bildschirmfotos liegen außerhalb
des Repositorys im Scratchpad (`runde9/g/`).
