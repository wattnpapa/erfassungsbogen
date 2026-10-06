# Audit „Nacht und Sicht“, Runde 5 (Dunkelheit, Blendung, Sonnenlicht, Farbcodierung)

Stand: 06.10.2026 · Prüfer: Rollenaudit `thw-night-visibility-reviewer` ·
Prüfgegenstand: Web-App einschließlich der Begleitseiten unter `public/`,
Produktionsbuild (`vite preview`, Port 4173), Commit c0cbae0 (Code-Stand
entspricht 4fcdbaf).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-4-Befunde. Geprüft habe ich zuerst ohne Kenntnis der Berichte von
Runde 4 und Runde 5; den Abgleich habe ich erst danach gemacht. Beim Anlegen
des Berichtsgerüsts habe ich Aufbau und Ton des Runde-4-Berichts gelesen,
seine Befunde und Behebungen erst nach den Messungen.

## Prüfaufbau

Produktionsbuild über `vite preview` (http://localhost:4173), Playwright aus
`node_modules` mit Chromium aus `/opt/pw-browsers/chromium`, `isMobile`/
`hasTouch`, Locale de-DE, Telefon 360 × 640 bei Pixelverhältnis 2 (für
Kopfzeile, Autosave-Zeile und „◐“ zusätzlich 320 × 568), je Messung ein
eigener Browser-Kontext, weil elf weitere Prüfer denselben Server nutzen.
Geprüft in allen vier Modi (Standard, Feld, Dunkel, Nacht) und mit
Systemeinstellung „dunkel“ ohne gespeicherte Wahl.

Zustände über `localStorage`-Seeds (`uebung: false`, `stand` auf heute):

- THW: Entwurf FGr Öl (C) Weinsberg (`examples/thw/014-…`), Einsatz-Sammlung
  „Hochwasser Neckar“ mit sieben Meldungen (eine abgerückt, eine mit gültiger,
  eine mit ungültiger Signatur, mehrere mit Ruhezeit, „Anderer Einsatz?“ und
  „Zeitraum vorbei“), eine ruhende Übungssammlung (70 Tage), eine Vorlage;
  zusätzlich zwei Meldungen mit `vomPapier` für die Papier-Abgleich-Karte.
- Kennfarbe des Kopfbalkens: je ein Entwurf für THW, DRK
  (`examples/drk/seg-sanitaet`), DLRG (`examples/dlrg/wrz-mittelbaden-…`),
  Feuerwehr (`examples/feuerwehr/niedersachsen/gruppe-sudheim`), ASB
  (`examples/asb/…`), Bundeswehr (`examples/bundeswehr/panzerpionierzug`) sowie
  Polizei, Rettungsdienst, Malteser und Johanniter (Bogen aus `examples/thw`
  bzw. `examples/drk`, Organisation im Seed umgestellt), je in allen fünf
  Zuständen. Dazu je eine Einsatz-Sammlung mit DRK-, Feuerwehr-, DLRG-,
  Bundeswehr- und ASB-Bögen in vier Modi.

Durchlaufen: Startseite (vier Bildlagen), Assistent Schritt 1–5,
Gesamtübersicht, Übergabe-Dialog, QR-Vollbild, PDF-Vorschau, Einsatz-Detail
(Kopf, Kartenliste, Tabelle, Verwalten, Papier-Abgleich), Lageblatt und
Blanko-Vordruck (von der Einsatzansicht und von der Startseite), Moduswechsel
über „◐“ (Assistent und Einsatzansicht, alle zwölf Wechsel zwischen den vier
Modi), „Bögen einlesen…“ mit falscher Datei in vier Modi, Kaltstart mit um
2,5 s verzögertem App-Bundle (System-dunkel, Nacht, Dunkel), alle 36
Begleitseiten in allen fünf Zuständen (180 Aufrufe), Anleitung mit allen
Aufnahmen in Nacht und Dunkel.

Kontraste sind **gerechnet**: für jeden sichtbaren Textknoten Schriftfarbe
gegen die tatsächlich darunterliegende Fläche (Deckkraft der Vorfahren
eingerechnet), WCAG-Formel, Schwelle 4,5:1 bzw. 3:1 für große Schrift.
Blendung als mittlerer Luma-Wert (sRGB, 0–255) und Anteil heller Bildpunkte
(Luma > 200) je Bildschirmfoto. Farbfehlsicht (Deuteranopie-Matrix) und
Graustufen als Bildfilter auf Bildschirmfotos der Einsatzansicht. Alle
Bildschirmfotos habe ich angesehen, nicht nur gerechnet.

**Nicht prüfbar:** echtes Licht (Sonne, Arbeitsscheinwerfer, Rotlicht),
tatsächliche Displayhelligkeit, Spiegelung und Blickwinkel realer Geräte,
OLED-Schwarz, WebKit/Safari, die native Android-/iOS-Fassung, Kamera-Scanner
im Dunkeln, Ausdruck auf Papier. Der eingebettete PDF-Betrachter (Vorschau im
Übergabe-Dialog) und die geöffnete Lageblatt-/Vordruck-PDF bleiben im
Headless-Chromium leer bzw. werden als Datei heruntergeladen; wie sie auf
einem Telefon nachts aussehen, ist nicht beobachtet, nur aus der PDF-Natur
(weißes Papier) geschlossen. Die Dauer der PDF-Erzeugung (R5-L4) wurde bei
parallel laufender Last anderer Prüfer gemessen.

## Urteil

Das Lichtkonzept hält und hat die beiden Runde-4-Befunde an den Kennfarben
tatsächlich behoben. Im Nacht-Modus liegt kein aktiver Text unter 4,5:1
(knappster Wert 4,54:1, „Letzte Meldung …“ auf dem Bernsteinknopf; sonst
4,71:1 Logo und Gesamtzahl), im Dunkel-Modus keiner unter 5,9:1. Der
Kopfbalken ist nachts für alle zehn geprüften Organisationen #221f16; im
Dunkel-Modus ist er für DRK, Feuerwehr, DLRG, ASB, Bundeswehr, Malteser und
Johanniter abgedunkelt (z. B. DRK #e30613 → #7d0b12), der kleinste Text im
Kopf liegt bei 6,38:1 (DLRG). „‹ Startseite“ und „✓ gespeichert · … Uhr · nur
auf diesem Gerät“ bestehen in allen Modi und bei allen Kennfarben. Über 18
Bildlagen der App liegt das Luma-Mittel nachts zwischen 18 und 38, im
Dunkel-Modus zwischen 24 und 49, im Standard-Modus zwischen 174 und 242, im
Feld-Modus zwischen 155 und 236. Der Kaltstart ist dunkel (Luma-Mittel 24 in
Nacht, 31 bei System-dunkel, 40 in Dunkel). Alle 36 Begleitseiten sind in
allen fünf Zuständen ohne Text unter 4,5:1; Fotos und Anleitungsaufnahmen
tragen `brightness(0.7)`. Zustände tragen überall Wort oder Zeichen
(„✓“/„offen“, „ABGERÜCKT“ mit Durchstreichung, gefülltes „⚠ Signatur
ungültig“, „● Ruhezeit“, „vom Papier, Zeiten prüfen“); unter Deuteranopie und
in Graustufen geht keiner verloren.

Reibung gibt es an drei Stellen, alle klein. Der neue feste „◐“-Knopf der
Einsatzansicht (R4-L3-Behebung) liegt als 44-px-Quadrat auf dem linken
Seitenrand und deckt bei fast jeder Scrollposition Zeilenanfänge, „⚠“-Marken
und Kästchen ab (R5-L1). Im Feld-Modus ist die um den Ort verlängerte
Speicherzeile im Kopf abgeschnitten, genau dort, wo „nur auf diesem Gerät“
steht (R5-L2), und der Kopf trägt dort bei sieben Organisationen nur 4,5–4,6:1
(R5-L3). Lageblatt, Blanko-Vordruck und Sammel-PDF sind weiße
Papierseiten ohne Nachtfassung, und nach dem Tipp auf „Blanko-Vordruck“
erscheint rund vier Sekunden nichts (R5-L4, R5-L5).

Die Aufgabe gelingt bei Nacht und in der Sonne ohne fremde Hilfe: Bogen
erfassen, übergeben, am Meldekopf sammeln, Lageblatt und Vordruck ziehen,
in der Anleitung nachschlagen.

## Befunde

Keine P0- und keine P1-Befunde. Ein P2-Befund, sechs P3-Befunde.

### R5-L1 [P2] Fester „◐“ in der Einsatzansicht liegt über Text, Marken und Kästchen am linken Rand (neu, Nebenwirkung der R4-L3-Behebung)

**Priorität:** P2

**Kennzeichnung:** gemessen (Überdeckung), beobachtet (Bildschirmfotos).

**Fundstelle / Aufgabe:** Einsatzansicht „Hochwasser Neckar“, alle Modi, unten
links, `.anzeige-leiste-knopf`. Code: `src/app/anzeige-schalter.tsx`
(`AnzeigeLeistenKnopf`), Stil in `index.html`.

**Beobachtung:** Der Knopf ist 44 × 44 px (Feld-Modus 48 × 48 px) mit 12 px
Abstand links und unten, fest im Bild, und folgt dem Inhalt beim Scrollen. Die
Einsatzseite reserviert dafür keinen Rand. Ich habe die Seite in Schritten von
120 px durchgescrollt und je Position geprüft, ob die Box eines Textes oder
Bedienelements die Fläche des Knopfes schneidet:

| Bildschirm | Seitenhöhe | Positionen mit Überdeckung |
| --- | --- | --- |
| 360 × 640 Standard | 4 409 px | 29 von 32 |
| 360 × 640 Nacht | 4 481 px | 28 von 33 |
| 360 × 640 Feld | 6 037 px | 43 von 45 |
| 320 × 568 Standard | 5 054 px | 36 von 38 |
| 320 × 568 Nacht | 5 111 px | 37 von 38 |
| 320 × 568 Feld | 6 635 px | 49 von 51 |

Nicht jeder Treffer verdeckt Zeichen (volle Breite Knöpfe schneiden die Fläche
auch, ohne dass der Knopf auf dem Beschriftungstext liegt). Auf den
Bildschirmfotos verdeckt er aber sichtbar: den Zeilenanfang „Kraftstoff“ →
„…ftstoff“ in „Bedarf (anwesende Einheiten)“, den Anfang von „Stärke 0 / 1 / 2
/ 3“ in der Karte „Nr. 1“, das „⚠“ der Marke „Anderer Einsatz?“, das Wort „vom“
in „vom Papier, Zeiten prüfen“ und das Kästchen „Nur neue Bögen seit dem
letzten Export“ (Kästchen und Knopf überlappen sich bei Bildlage
„Nachtrag“). Eine Marke „⚠“ ist ein Warnzeichen, das auf dem Knopf verschwindet.

**Verweis:** Die Überdeckung ist in anderen Runde-5-Berichten ebenfalls
erwähnt (Randbemerkung in [fuehrungssicht.md](fuehrungssicht.md), Kästchen
„Nur neue Bögen …“ und Schaltflächentext in [neuer-nutzer.md](neuer-nutzer.md));
die Zahlen zur Häufigkeit und die Nachtsicht sind hier.

**Erwartung der Rolle:** Der Umschalter ist da, wenn das Licht wechselt, und
liegt nicht über dem, was ich gerade lese oder antippe.

**Auswirkung im Einsatz:** Wer nachts am Meldekopf durch die Liste wischt,
liest ständig an Zeilen vorbei, deren Anfang fehlt, und tippt neben dem Knopf
mit dem Handschuh leicht den Moduswechsel statt das Kästchen oder die Marke.
Das Menü öffnet sich, ein zweiter Tipp schließt es. Ein Datenverlust entsteht
nicht, ein Moduswechsel aus Versehen im Zelt ist aber genau das, was die
Rolle vermeiden will.

**Empfehlung:** Dem Knopf einen Platz geben, den kein Inhalt belegt: etwa
einen linken Rand an der Einsatzseite, den Knopf an den rechten Rand neben
den Daumen, wo die Karten keinen Text führen, oder den Knopf beim Scrollen
nach unten zurückziehen. Eine der drei Lösungen reicht. Nachts den Knopf
nicht zusätzlich mit einem Schatten über Text legen.

**Nachprüfung:** Einsatzansicht, 360 × 640 und 320 × 568, Nacht und Feld,
Scroll in 120-px-Schritten: kein Zeichen eines Textes oder einer Marke und
keine Schaltfläche liegt unter dem Knopf. Kästchen „Nur neue Bögen …“ und
Marke „⚠ Anderer Einsatz?“ ohne Berührung des Knopfes antippbar.

### R5-L2 [P3] Feld-Modus: Speicherzeile im Kopf abgeschnitten, in den übrigen Modi ohne Reserve (neu, Nebenwirkung der R4-L1-Behebung)

**Priorität:** P3

**Kennzeichnung:** gemessen; fehlende Reserve in den anderen Modi ist ein
Risiko.

**Fundstelle / Aufgabe:** Assistent, Kopfbalken, `.seiten-kopf .autosave`
(`white-space: nowrap`, `text-overflow: ellipsis`).

**Beobachtung:** Die Zeile heißt jetzt „✓ gespeichert · 11:53 Uhr · nur auf
diesem Gerät“. Gemessen (Schriftbreite gegen Zeilenbreite):

| Bildschirm | Modus | Text | Zeile | Ergebnis |
| --- | --- | --- | --- | --- |
| 360 × 640 | Standard, Dunkel, Nacht | 328 px | 328 px | passt ohne Reserve |
| 360 × 640 | Feld | 333 px | 324 px | abgeschnitten „… nur auf diesem G…“ |
| 320 × 568 | Standard, Dunkel, Nacht | 288 px | 288 px | passt ohne Reserve |
| 320 × 568 | Feld | 333 px | 284 px | abgeschnitten (rund 50 px fehlen) |

Auf dem Bildschirmfoto Feld/DRK steht „✓ gespeichert · 11:33 Uhr · nur auf
diesem G…“. Der Hinweis „nur auf diesem Gerät“ ist der Teil, der sagt, dass
die Daten nicht woanders liegen.

**Erwartung der Rolle:** Die Zeile mit der Bestätigung steht vollständig da,
besonders im Modus für draußen.

**Auswirkung im Einsatz:** Gering. „✓ gespeichert“ und die Uhrzeit bleiben
lesbar, der Zusatz „nur auf diesem Gerät“ nicht. In den anderen Modi genügt
eine etwas breitere Systemschrift oder eine zweistellige Stunde mit
Sekunden-Zusatz, damit die Zeile ebenfalls abreißt.

**Empfehlung:** Zeile zweizeilig umbrechen lassen oder kürzen („✓ gespeichert
11:33 · nur hier“); in jedem Fall nicht auf einer Zeile mit Auslassungspunkten.

**Nachprüfung:** Schritt 1–5, 320 × 568 und 360 × 640, alle vier Modi, mit
Systemschrift 130 %: der gesamte Text der Zeile ist sichtbar.

### R5-L3 [P3] Feld-Modus: Kopfbalken behält die volle Kennfarbe, Weiß darauf bei sieben Organisationen nur 4,5–4,6:1 (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen; die Wirkung in der Sonne ist ein Risiko.

**Fundstelle / Aufgabe:** Assistent, Kopfbalken im Feld-Modus. Kennfarben in
`src/app/org-farben.ts`.

**Beobachtung:** Der Feld-Modus ist die Darstellung „große Tippziele und
maximaler Kontrast“ (Schwarz auf Hellgrau, 2-px-Rahmen). Der Kopfbalken
bleibt aber in der Kennfarbe, die Schrift darauf ist Weiß:

| Organisation | Kopfbalken | Kontrast „‹ Startseite“, Ziffern |
| --- | --- | --- |
| DRK, Malteser, Johanniter, Rettungsdienst | #e30613 | 4,56:1 |
| DLRG | #9c6b00 | 4,53:1 |
| Feuerwehr | #c8102e | 4,62:1 |
| ASB | #a34700 | 4,63:1 |
| Bundeswehr | #4b5320 | 5,75:1 |
| THW, Polizei | #20214f | 9,66:1 |

Alles über 4,5:1, aber auf der Fläche, die im Feld-Modus sonst 21:1 bietet,
der niedrigste Wert der Seite. Die Statusleiste (`theme-color`) ist im
Feld-Modus ebenfalls voll in #e30613 bzw. #9c6b00.

**Erwartung der Rolle:** Wer „Feld“ für die Sonne wählt, bekommt auch im Kopf
den höchsten Kontrast.

**Auswirkung im Einsatz:** Gering. Der Kopf enthält Rückweg, Modus und
Schrittleiste; bei Sonne auf dem Display sind 4,5:1 auf einer sattroten oder
gelb-braunen Fläche knapp, der Rest des Bildschirms bleibt gut lesbar.

**Empfehlung:** Im Feld-Modus die Kopfschrift auf mindestens 7:1 rechnen
(Weiß auf abgedunkelter Kennfarbe, wie es für Dunkel schon geschieht) oder
den Kopf in Feld in die schwarzweiße Darstellung ziehen.

**Nachprüfung:** Entwurf je Organisation, Feld-Modus: alle Texte im Kopf
≥ 7:1.

### R5-L4 [P3] „Blanko-Vordruck“ und „Lageblatt“: rund vier Sekunden ohne Rückmeldung, Bestätigung weit unter dem Bild, auf der Startseite keine (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (Lage der Meldung, Dauer unter Last), beobachtet
(Startseite).

**Fundstelle / Aufgabe:** Einsatzansicht, „Lageblatt (A4 quer)“ und
„Blanko-Vordruck (Papier-Reserve)“; Startseite, „Blanko-Vordruck (PDF)“. Code:
`src/app/app.tsx`, `blankoVordruck()` (Meldung „Blanko-Vordruck erzeugt (2
Seiten A4, …)“), `lageblatt()`.

**Beobachtung:**

- Nach dem Tipp auf „Blanko-Vordruck (Papier-Reserve)“ ändert sich vier
  Sekunden lang nichts auf dem Bildschirm (Knopfbeschriftung gleich, kein
  `aria-busy`, keine Zeile „wird erzeugt“); dann kommt der Download. Gemessen
  bei parallel laufender Last anderer Prüfer, auf einem Telefon vermutlich
  länger. In zwei weiteren Läufen kam der Download nach 15 bzw. 20 s nicht an;
  ob das Last oder ein Fehler war, ist nicht geklärt.
- Die Bestätigung „Blanko-Vordruck erzeugt …“ und „Lageblatt erzeugt (A4
  quer).“ steht als statische Zeile am Seitenende: Bei der Einsatzansicht liegt
  sie bei 1 091 bzw. 1 163 px bei einer Bildhöhe von 640 px, also 450 bis
  520 px unter dem Bild. Beim Lageblatt steht immerhin direkt unter den Knöpfen
  „Lageblatt erstellt … · seitdem keine neue Meldung“; beim Blanko-Vordruck
  gibt es nichts Entsprechendes.
- Von der Startseite lädt „Blanko-Vordruck (PDF)“ die Datei, aber keine Zeile
  im Bild bestätigt es.

**Erwartung der Rolle:** Nach dem Tipp sehe ich sofort „wird erzeugt“ und
danach „erzeugt“, dort, wo ich getippt habe.

**Auswirkung im Einsatz:** Wer nachts im Zelt auf den Knopf tippt und nichts
sieht, tippt ein zweites Mal und bekommt zwei PDFs oder nimmt an, das
Papier-Reserve-Blatt sei nicht erzeugt worden.

**Empfehlung:** Knopf während der Erzeugung sperren und beschriften („wird
erzeugt …“), die Bestätigung als Zeile direkt unter den Knöpfen oder als
kurzes Banner im Bild.

**Nachprüfung:** Einsatzansicht und Startseite, Tipp auf Blanko-Vordruck: nach
unter 300 ms sichtbarer Zustand am Knopf, Bestätigung ohne Scrollen im Bild.

### R5-L5 [P3] Lageblatt, Blanko-Vordruck und Sammel-PDF sind weiße Papierseiten, es gibt keine Nachtansicht (neu)

**Priorität:** P3

**Kennzeichnung:** Risiko; die Erzeugung als Download ist beobachtet, das Bild
auf einem Telefon ist nicht prüfbar.

**Fundstelle / Aufgabe:** Einsatzansicht, „Lageblatt (A4 quer)“,
„Blanko-Vordruck (Papier-Reserve)“, „Einsatz weitergeben / sichern“; Übergabe-
Dialog, „PDF-Vorschau“. Code: `src/app/pdf*`.

**Beobachtung:** Lageblatt und Blanko-Vordruck sind PDF-Downloads
(`eeb-lageblatt-…pdf`, `einheiten-erfassungsbogen-blanko.pdf`); es gibt keine
Bildschirmansicht in einem der vier Modi. Die Texte um die Knöpfe sind in
Nacht und Dunkel in Ordnung (Kontrast und Helligkeit gemessen), die Papier-
Abgleich-Karte und die Marken „vom Papier, Zeiten prüfen“ (Umriss, Amber auf
Nacht-Grund) ebenfalls. Die eingebettete „PDF-Vorschau“ im Übergabe-Dialog ist
im Testbrowser leer.

**Erwartung der Rolle:** Das Lageblatt ist ein Aushang für die Wand; wer es
nachts auf dem Telefon aufruft, bekommt eine weiße A4-Seite im Betrachter.

**Auswirkung im Einsatz:** Gering und gewollt: Das Lageblatt und der Vordruck
sind zum Ausdrucken da. Wer sie nachts am Telefon prüft, blendet für diesen
Moment voll. Ein Hinweis fehlt.

**Empfehlung:** Einen Satz bei den Knöpfen („Weißes Papierblatt – zum Drucken,
nicht zum Ablesen bei Nacht“) oder eine Textansicht der Lage im Nacht-Modus.
Die Einsatzansicht selbst ist bereits die nachtfeste Lageübersicht.

**Nachprüfung:** Auf einem Telefon im Nacht-Modus Lageblatt und Vordruck
öffnen: Hinweis vorhanden, PDF-Vorschau im Dialog nach Augenschein geprüft.

### R5-L6 [P3] Anleitung: helle Aufnahmen bleiben nachts die hellsten Flächen der Seite (beobachtet, Rest von R3-L4)

**Priorität:** P3

**Kennzeichnung:** gemessen (Luma), beobachtet.

**Fundstelle / Aufgabe:** `public/anleitung.html`, Aufnahmen
`start-breit.webp`, `start-schmal.webp`; Bilder in den Organisationsseiten.

**Beobachtung:** Aufnahmen und Fotos tragen in Nacht, Dunkel und System-dunkel
`brightness(0.7)`. Die Aufnahmen zeigen die App im Standard-Modus; nach dem
Filter hat die Aufnahme „Startseite“ im Nacht-Modus ein Luma-Mittel von 137
(Seitengrund 12). Die Aufnahme ist zudem so klein (328 px breit für ein
1 280-px-Bild), dass die Schrift darin nicht zu lesen ist. Die
Handscanner-Codes bleiben weiß, wie sie sein müssen.

**Erwartung der Rolle:** Die Anleitung blendet nachts nicht mit einem hellen
Block.

**Auswirkung im Einsatz:** Gering; die Anleitung wird selten nachts gelesen.

**Empfehlung:** Aufnahmen zusätzlich in Dunkel erzeugen und per `prefers-color-
scheme`/Modusklasse tauschen, oder den Filter auf 0,5 setzen.

**Nachprüfung:** Anleitung im Nacht-Modus, Aufnahmen: Luma-Mittel < 90.

### R5-L7 [P3] Moduswechsel im Assistenten: Stelle springt aus dem Feld-Modus heraus um 44–49 px (beobachtet, Rest von R4-L3)

**Priorität:** P3

**Kennzeichnung:** beobachtet; die Sonde ist grob.

**Fundstelle / Aufgabe:** Assistent Schritt 3, `scrollY` 900, Wechsel über
„◐“. Code: `src/app/anzeige-schalter.tsx`, `ankerInBildmitte()`.

**Beobachtung:** Ich habe das Element in der Bildmitte vor und nach dem
Wechsel verglichen. Aus Nacht, Dunkel und Standard heraus bleibt es auf ±1 px
stehen (Einsatzansicht und Assistent, alle neun Wechsel). Aus dem Feld-Modus
heraus steht „Vorname Nachname Zählt als Führer/in …“, ein hohes Element, vorher
bei −20 px und nachher bei +28 bis +29 px: 44 bis 49 px Versatz. Der Anker
liegt dort in einer Zeile, die höher ist als die Suche zulässt. Wechsel in den
Feld-Modus hinein vergrößert die Schrift und verschiebt `scrollY` um rund 520
px; dabei bleibt das Element in der Bildmitte (±1 px).

**Erwartung der Rolle:** Nach dem Wechsel stehe ich an derselben Stelle.

**Auswirkung im Einsatz:** Ein kurzer Blick nach dem Wechsel; kein
Informationsverlust.

**Empfehlung:** Auch hohe Elemente als Anker zulassen und an der Oberkante
verankern, die nicht mehr als zwei Zeilen scrollt.

**Nachprüfung:** 360 × 640, Schritt 3, `scrollY` 900 bis 4 500, Feld → jeder
Modus: höchstens 40 px Versatz.

## Bestätigtes

- **Text in der App:** Startseite (vier Bildlagen), Assistent Schritte 1–5,
  Gesamtübersicht (drei Bildlagen), Einsatzansicht (Kopf, vier Bildlagen
  Karten, Tabelle): in Standard, Feld, Dunkel, Nacht und System-dunkel kein
  aktiver Text unter 4,5:1. Ausnahme nur der deaktivierte Knopf „← Zurück“ in
  Schritt 1 (2,59 bis 3,37:1, `disabled`). Knappste Werte nachts: 4,54:1
  „Letzte Meldung …“ auf dem Bernsteinknopf, 4,71:1 Logo und „65“.
  Papier-Abgleich-Karte, Fehlerzeile, Übergabe-Dialog und QR-Vollbild ohne Wert
  unter der Schwelle.
- **Kennfarben:** Zehn Organisationen × fünf Zustände (Assistent, Schritt 2,
  alle sichtbaren Texte): kein Text unter 4,5:1; knappste Werte 4,53:1 (DLRG
  Standard und Feld), 4,56:1 (DRK/Malteser/Johanniter/Rettungsdienst), 4,71:1
  (alle Nacht-Fälle). Nacht-Kopf überall #221f16, `theme-color` ebenso.
  Dunkel-Kopf: DRK #7d0b12 (6,47:1), Feuerwehr #800b1e (6,56:1), DLRG #533b07
  (6,38:1), ASB #623009 (6,78:1), Bundeswehr #3a4119 (6,88:1); THW und
  Polizei #20214f (7,03:1) unverändert. Die Einsatzansicht trägt für alle
  Organisationen ihr eigenes Marineblau (#12275e, 8,17:1 Dunkel, 7,41:1 Feld).
- **„‹ Startseite“ und Speicherzeile:** in allen Modi und bei allen Kennfarben
  ≥ 4,56:1 (R4-L1, R4-L2 behoben).
- **Begleitseiten:** 36 Seiten × 5 Zustände (180 Aufrufe), kein Text unter 4,5:1
  und kein Fehler beim Laden. Luma-Mittel Nacht 26–54, Dunkel 34–61, Feld
  207–226, Standard 211–236. Anteil heller Bildpunkte nachts 1,7–6,1 %,
  Dunkel 2,8–7,5 %. Fotos und Aufnahmen `brightness(0.7)`.
- **Helligkeit der App:** Luma-Mittel je Bildlage Nacht 18–38, Dunkel 24–49,
  Standard 174–242, Feld 155–236; Anteil heller Bildpunkte (Luma > 200) Nacht
  höchstens 3,9 %, Dunkel höchstens 4,9 %. Größter Einzelwert nachts 231
  (eine Bildpunkt-Kante des Wappens), in Schritt 4 107 Punkte über 230 (die
  Unterlage des Fahrzeugzeichens, bewusst).
- **Kaltstart:** Bei um 2,5 s verzögertem App-Bundle zeigt das Gerüst sofort
  den dunklen Grund (Luma-Mittel Nacht 24, System-dunkel 31, Dunkel 40).
- **Kein Nur-Farbe-Zustand:** Schrittleiste mit „✓“ und „offen“, aktiver
  Schritt unterstrichen. „ABGERÜCKT“ als Marke mit Durchstreichung und
  gestrichelter Kante, „⚠ Signatur ungültig“ als gefüllte Marke (unter
  Deuteranopie und in Graustufen vom Umriss der übrigen Marken klar zu
  trennen), „● Ruhezeit“, „● Unterbr.“, „⚠ Anderer Einsatz?“, „vom Papier“.
- **Fehlerzeile:** „⚠ „falsch.json“ stammt nicht aus dieser App …“ mit Zeichen
  und Rahmen, in Nacht und Dunkel getönt, im Bild bei 461 px (Nacht) und 409 px
  (Feld), Schrift in der Textfarbe (Kontrast ≥ 4,71:1).
- **Moduswechsel:** „◐“ im Assistenten und in der Einsatzansicht; Stelle
  bleibt auf ±1 px (Einsatzansicht, alle zwölf Wechsel; Assistent, neun von
  zwölf), ausgenommen R5-L7. Der Umschalter im Kopf liegt in der Reihenfolge
  Standard, Feld, Dunkel, Nacht.
- **Native Bedienelemente:** Kästchen „Nur neue Bögen …“ nachts mit Rahmen
  4,83:1 gegen den Grund; Optionsringe, Kalendersymbol und Handscanner-Rahmen
  warm (Nacht, Schritt 1–3: größter Wert Luma 206).
- **QR-Vollbild:** weiße Platte bewusst, 33 % helle Bildpunkte (Nacht),
  Handscanner-Codes in der Anleitung weiß und ungefiltert.
- **Übergabe-Dialog, Scanner, Rückfrage „Einsatz löschen?“:** nachts nach
  Augenschein ohne Auffälligkeit; „Einsatz löschen…“ in Alarmton auf dunklem
  Grund.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Der Knopf „◐“ in der Einsatzansicht wirkt wie
  ein Teil des Inhalts, weil er auf dessen Text liegt (R5-L1).
- **Größtes Einsatzrisiko:** Ein versehentlicher Tipp auf „◐“ statt auf ein
  Kästchen oder eine Warnmarke am linken Rand (R5-L1).
- **Top-Priorität für die nächste Iteration:** Dem „◐“ der Einsatzansicht einen
  Platz ohne Inhalt geben und die Speicherzeile im Feld-Modus nicht abschneiden
  (R5-L1, R5-L2).

## Abgleich mit Runde 4

Grundlage: [../runde-4/nacht-und-sicht.md](../runde-4/nacht-und-sicht.md) samt
„Stand der Behebung“ und [../runde-4/README.md](../runde-4/README.md).

| Runde-4-Befund | Stand laut Bericht | Bewertung Runde 5 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R4-L1 „✓ automatisch gespeichert“ grün auf der Kennfarbe, Dunkel (P2) | behoben | **hält, Nebenwirkung** | Kopf im Dunkel-Modus: alle Texte ≥ 6,38:1 für zehn Organisationen, Speicherzeile lesbar. Der längere Text „· nur auf diesem Gerät“ ist im Feld-Modus bei 360 und 320 px abgeschnitten (R5-L2); in den anderen Modi passt er ohne Reserve. |
| R4-L2 „‹ Startseite“ unter 4,5:1, roter Balken im Dunkel-Modus (P3) | behoben | **hält, Rest bleibt** | „‹ Startseite“ ≥ 4,53:1 in allen Modi und bei allen Kennfarben; Dunkel-Kopf DRK #7d0b12, Feuerwehr #800b1e, DLRG #533b07, ASB #623009, `theme-color` folgt. Im Feld-Modus bleibt die volle Kennfarbe mit 4,53–4,63:1 (R5-L3). |
| R4-L3 „◐“ hält die Stelle nicht immer, Einsatzansicht ohne Umschalter (P3) | behoben | **hält teilweise, mit Nebenwirkung** | Einsatzansicht: fester „◐“ vorhanden, Stelle ±1 px in allen zwölf Wechseln; Assistent: ±1 px, aus Feld heraus 44–49 px (R5-L7). Der feste Knopf liegt bei 28–49 von 32–51 Scrollpositionen über Inhalt (R5-L1). |
| R4-L4 Kleinere Sichtreste (P3) | behoben | **hält** | Native Elemente warm (Nacht, Schritt 1–3 größter Wert Luma 206, Schritt 4: 107 Punkte über 230 durch das Fahrzeugzeichen, bewusst). Fehlerzeile „⚠“ mit Rahmen. „⚠ Signatur ungültig“ gefüllt, unter Deuteranopie von den Umriss-Marken unterscheidbar. Umschalter-Reihenfolge Standard, Feld, Dunkel, Nacht. Anleitungs-Aufnahme `start-schmal` zeigt „Standard ▾“. Offener Rest: Aufnahmen bleiben hell (R5-L6). |

Keine Behebung hat sich ins Gegenteil verkehrt. Von vier Runde-4-Befunden
halten zwei vollständig oder mit kleinem Rest (R4-L2, R4-L4), einer mit einer
Nebenwirkung (R4-L1: Zeile jetzt abgeschnitten im Feld-Modus), einer wirkt
nur teilweise (R4-L3: Stelle hält, aber der neue feste Knopf deckt Inhalt ab).
Neu in Runde 5: R5-L1 (P2), R5-L2 bis R5-L7 (P3). Zusammen: 0 × P0, 0 × P1,
1 × P2, 6 × P3.
