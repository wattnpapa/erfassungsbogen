# Audit „Führungssicht", Runde 8 (Lage führen, Lagemonitor, Stand übergeben)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-command-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `3fee6e5` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Der Server wurde weder neu gebaut noch
neu gestartet. Der Bericht prüft die Behebungen aus
[Runde 7](../runde-7/fuehrungssicht.md) (Abschnitt „Stand der Behebung" in der
[README](../runde-7/README.md)) und achtet auf Nebenwirkungen der übrigen
Runde-7-Änderungen (Zwei-Fenster-Abgleich, Rückfragen, Geräteuhr, Layout bei
großer Schrift).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`), Locale
de-DE, je Lauf ein eigener Browser-Kontext. Telefon 360 × 640 (`isMobile`,
`hasTouch`) als Grundeinstellung, dazu 320 × 568, 640 × 360 quer, Tablet
820 × 1180, `html { font-size: 200% }`. Der Lagemonitor zusätzlich ohne Touch
auf 1920 × 1080, 1366 × 768 und 1280 × 720.

Ich habe zuerst blind getestet (ohne die Berichte unter `docs/audits/` zu
lesen) und danach den Runde-7-Bericht und „Stand der Behebung" gelesen.

Zustände aus `localStorage`-Seeds (`eeb.einsaetze.v1`), `uebung: false`,
`stand` auf heute, Einsatzzeitraum der Bögen auf heute gesetzt (sonst tragen
alle Einheiten „Zeitraum vorbei"; das ist Seed-Artefakt und zählt nicht):
- Sammlung „Hochwasser Musterstadt" mit 6, 8, 14 und 30 Einheiten aus
  `examples/thw/`, teils mit Abrückungen, Folgemeldungen (Stärke −2 bis −3),
  Zügen, Meldezeiten 5 Stunden und 3 Tage alt, in der Zukunft (2 Stunden und
  3 Minuten), als Übung, leer, alle abgerückt;
- Übergabe: Sammel-PDF über „Einsatz weitergeben / sichern" mit gesetztem
  Funkrufnamen und „Jetzt" als Beginn erzeugt, in einem zweiten Kontext über
  „Einsatz importieren…" eingelesen, Monitor dort geöffnet;
- zwei Fenster desselben Kontexts (Zug zuordnen in einem, Ansicht im anderen);
- Lageblatt mit `pdftotext` gelesen.

Bedient: Karten auf- und zuklappen, „Zug zuordnen" (drei Schreibweisen),
„Auftrag/Notiz", „Abrücken" mit „Rückgängig", Zähler „ohne Auftrag", Karten und
Tabelle, „Einsatz löschen…", Lagemonitor (zweites Fenster per Adresse
`?lagemonitor=<Id>`), Stufenwahl des Monitors.

**Nicht prüfbar:** echter Fernseher, Sitzabstand, Vollbild und Wachhalten im
Headless-Chromium, Drucken, Kamera, WebKit. Ob die Zwei-Fenster-Leiste im
Meldekopf-Betrieb erscheint, habe ich nicht erzwungen: Im Einsatz glichen sich
beide Fenster still an (siehe Bestätigtes). Für den Monitor in einem echten
zweiten Fenster habe ich die Adresse direkt aufgerufen.

## Urteil

Die Runde-7-Umbauten für die Führung halten. Der Lagemonitor bleibt auf allen
geprüften Fernsehgrößen im Bild: Stärke, Einheiten, Fahrzeuge, höchstens drei
Bewegungszeilen mit „+ n weitere Bewegungen", Folgemeldung mit Betrag
(„Stärke 19 → 16 (−3)"), die Tabelle füllt den Rest der Bildhöhe und nennt
„+ n weitere Einheiten". Meldezeiten in der Zukunft werden benannt („Zeiten
prüfen (Geräteuhr?)") statt „gerade eben" zu behaupten, ein Datenstand ab einer
Stunde steht rot und mit Warnzeichen da, „Noch nichts gemeldet" und „Alle 6
Einheiten abgerückt" stehen je einmal. Zug wird beim Zuordnen angeboten und
normalisiert („1. Zug", „1.Zug", „1. zug" werden ein Zug), die Karte nennt den
Auftrag, ein Zähler „n ohne Auftrag · m ohne Zug" filtert mit einem Tipp. Die
Übergabe nimmt Funkrufname und Beginn jetzt mit, die Quittung sagt es.

Reibung bleibt an den Rändern der Anzeige: Am Telefon liegen die Spalten
F/U/M des Monitors außerhalb des Bildes, auf dem Tablet liegen in der
Einsatztabelle Auftrag und Eingetroffen hinter dem Rollrand. Befunde mit P0
oder P1 habe ich nicht gefunden.

Die Aufgabe — Lage führen, Monitor einrichten, übergeben — lässt sich ohne
fremde Hilfe erledigen.

## Befunde

### R8-K1 [P2] Lagemonitor am Telefon: Spalten F / U / M liegen außerhalb des Bildes, ohne Hinweis

**Priorität:** P2

**Kennzeichnung:** gemessen (360 × 640 und 320 × 568; `getBoundingClientRect`,
`scrollWidth`).

**Fundstelle / Aufgabe:** Lagemonitor, Tabelle „Einheiten" bei schmalem
Fenster. Code: `src/app/lagemonitor.css` (`.lm-tabelle`).

**Beobachtung:** Die Tabelle ist 448 px breit in einem Rahmen von 336 px
(360 px Fenster) bzw. 298 px (320 px). Die Kopfzellen F, U und M liegen bei
380 bis 460 px, also rechts hinter dem Rand; im Bild stehen Orga, Ort,
Funkrufname und ein angeschnittener Einheitentyp („Bergungsgrup", „Materialwirtsc").
Ein Hinweis, dass rechts noch Spalten folgen, ist nicht zu sehen. Die
Gesamtstärke steht oben im Bild; die Stärke je Einheit nur nach seitlichem
Rollen.

**Erwartung der Rolle:** Die Zahl, nach der ich die Zeile lese (Stärke), steht
im Bild; Namensspalten dürfen dafür kürzer werden oder entfallen.

**Folge:** Wer das Telefon als Monitor nutzt (Annahme: am Meldekopf ohne
Fernseher), liest eine Liste von Funkrufnamen ohne Zahlen und muss erraten,
dass man quer wischen kann.

**Empfehlung:** Am Telefon Einheitentyp und Orga zurücknehmen oder
umbrechen, F/U/M im Bild halten; sonst einen sichtbaren Rollhinweis
(angeschnittene Spalte genügt nicht).

**Nachprüfung:** 360 × 640 und 320 × 568: Alle drei Zahlenspalten sind ohne
Rollen im Bild.

### R8-K2 [P2] Einsatztabelle am Tablet: Auftrag und Eingetroffen liegen hinter dem Rollrand, die Spalte „Bedarf" nimmt den Platz

**Priorität:** P2

**Kennzeichnung:** gemessen (820 × 1180, 14 Einheiten; Tabelle 1 791 px in
754 px Rahmen) und beobachtet (Screenshot).

**Fundstelle / Aufgabe:** Einsatzansicht → „Tabelle".

**Beobachtung:** Sichtbar sind Einheit, Zug, F, U, M, Ges., Kfz und der Bedarf;
Letzterer ist eine breite Spalte mit viel leerem Raum rechts vom Text. Die
Spalten „Eingetr.", „Auftrag / Notiz der Führungsstelle" und „Abger." folgen
erst nach dem Rollen (die Spalte „Eingetr." ist im Bild nur als Rand
angeschnitten). Weitere 12 Spalten (Verpflegung, Unterbringung, Kraftstoffe,
Stand) liegen dahinter.

**Erwartung der Rolle:** In der Tabelle, die für den Überblick gedacht ist,
stehen Auftrag und Eingetroffen vor den Verpflegungs- und Kraftstoffzahlen.

**Folge:** „Wer macht was?" ist die erste Führungsfrage; die Tabelle
beantwortet sie nur nach seitlichem Rollen. Die Karten tun es zeilenweise
(gekürzt, R8-K3).

**Empfehlung:** Spaltenreihenfolge nach Führungsfragen: Einheit, Zug, Stärke,
Auftrag, Eingetroffen; Bedarf und Details danach, Bedarfsspalte begrenzen.

**Nachprüfung:** Tablet 820 × 1180, 14 Einheiten: Auftrag steht ohne Rollen
im Bild.

### R8-K3 [P3] Auftrag auf der Karte wird nach 40 Zeichen gekürzt; die Zeitangabe am Ende fehlt

**Priorität:** P3

**Kennzeichnung:** gemessen (Telefon 360 × 640).

**Fundstelle / Aufgabe:** Einsatzansicht, zugeklappte Karte nach „Auftrag/Notiz".

**Beobachtung:** Eingegeben: „Deichabschnitt Nord ab 14:00 Sandsäcke füllen und
verlegen, Schicht bis 22:00". Die Karte zeigt „Auftrag: Deichabschnitt Nord ab
14:00 Sa…". Das Ende („Schicht bis 22:00") steht nur nach dem Aufklappen. Der
Filter „ohne Auftrag" funktioniert (5 Treffer, „Filter aufheben").

**Erwartung der Rolle:** Auftrag in einer Zeile reicht für „wer macht was";
Befristungen am Ende gehören zur Entscheidung („wann wird die Einheit frei?").

**Folge:** Gering; ein Tipp auf die Karte schafft Abhilfe.

**Empfehlung:** Zwei Zeilen zulassen oder nach der Kürzung die Zeichenzahl
nennen; Erwähnung in der Anleitung, dass der Anfang zählt.

**Nachprüfung:** Auftrag mit 80 Zeichen: Beide Zeiten sind auf der Karte oder
der Hinweis „(mehr)" ist sichtbar.

### R8-K4 [P3] Einsatzansicht am Telefon: Die erste Einheit steht bei 1 142 px, bei 200 % Schrift bei 2 452 px

**Priorität:** P3

**Kennzeichnung:** gemessen (6 Einheiten: 1 142 px bei 640 px Bildhöhe; 14
Einheiten: 1 164 px; 320 × 568: 1 253 px; 200 %: 2 452 px; quer 640 × 360:
1 164 px).

**Fundstelle / Aufgabe:** Einsatzansicht, Strecke zwischen Summenblock und
Einheitenliste: drei Eingangsknöpfe („Bogen scannen…", „Einheit manuell
erfassen…", „Bögen einlesen…"), „Bedarf", Sprunglink, Listenkopf, Zähler,
Filter.

**Beobachtung:** Die Summen (Einheiten, Führer, Unterführer, Mannschaft,
gesamt) stehen im ersten Bild. Die erste Einheitenkarte erscheint erst nach rund
zwei Bildschirmen, bei 200 % nach vier. Der Sprunglink gilt nur dem Export
(„Weitergeben, Lageblatt, Export ↓"), keiner springt zur Liste.

**Erwartung der Rolle:** Wer die Lage prüft, kommt mit einer Geste zu den
Einheiten; Eingangsknöpfe sind im Einsatz selten, die Lage ständig.

**Folge:** Gering; ein Mehraufwand pro Blick, am Telefon bei Bewegung
spürbar.

**Empfehlung:** „Zu den Einheiten ↓" neben „Weitergeben …" anbieten oder die
Eingangsknöpfe zu einer Zeile verdichten.

**Nachprüfung:** Telefon 360 × 640: Erste Karte bei höchstens 900 px.

### R8-K5 [P3] Lagemonitor: Tabellenzeilen ohne erkennbares Auswahlkriterium; Restplatz unter „+ n weitere" bleibt leer

**Priorität:** P3

**Kennzeichnung:** gemessen (1920 × 1080, 1366 × 768, 1280 × 720, 30 Einheiten)
und beobachtet (Reihenfolge).

**Fundstelle / Aufgabe:** Lagemonitor, Abschnitt „Einheiten".

**Beobachtung:** Bei 30 Einheiten stehen bei 1366 × 768 und 1280 × 720 je 3
Zeilen im Bild, bei 1920 × 1080 vier, darunter „+ 24 weitere Einheiten" bzw.
„+ 23 weitere Einheiten"; unter dieser Zeile bleiben rund 65 px (1366 × 768)
bis 80 px (1920 × 1080) leer, zusätzliche Zeilen würden dort passen. Die
Reihenfolge wechselt mit dem Zustand: bei einer Übung neueste Meldung zuerst
(Karlsruhe, Haßmersheim, Freiburg), bei gleichen Meldezeiten Nr. aufsteigend.
Das Kriterium steht nirgends im Bild.

**Erwartung der Rolle:** Bei Kürzung sagt das Bild, nach welcher Regel
(„zuletzt gemeldet" oder Nr.), und nutzt den freien Platz.

**Folge:** Gering. Bei großer Lage sehen 3 von 27 Einheiten wie die
vollständige Liste aus, solange man „+ n" nicht liest.

**Empfehlung:** Die Zeile „+ n weitere Einheiten" um das Kriterium ergänzen
(„neueste zuerst"); die Zeilenzahl auf den tatsächlichen Platz auslegen.

**Nachprüfung:** 1366 × 768, 30 Einheiten: Kriterium im Bild, kein leerer
Streifen von mehr als einer Zeilenhöhe.

## Verweise auf Befunde in anderen Berichten

Nicht erneut gezählt: die Grenzen aus Runde 7 (R6-O9, R7-G4/M8, R7-G8/H9,
R7-N1, R7-N9); ich habe sie nicht nachgestellt, ihr Stand ist unverändert
bekannt. Die Stufe „Hell" wird bewusst nicht gemerkt (Code-Kommentar R7-L3);
nach einem Neuladen steht deshalb die zuletzt gemerkte Stufe („Gedimmt"), nicht
„Hell" — beobachtet, als Absicht dokumentiert, daher kein Befund.

## Bestätigtes

- **Monitor, Bildhöhe:** Bei 11 anwesenden Einheiten und 3 Abrückungen (14
  Bögen, 2 Folgemeldungen) liegt die Tabelle bei 1920 × 1080 zwischen 679 und
  895 px, Seitenhöhe 1 080 px (kein Rollen); gleiches bei 1366 × 768 und
  1280 × 720.
- **Bewegungen:** „Folgemeldung: THW Weinsberg … – Stärke 19 → 16 (−3) gerade
  eben", „Eingetroffen: … vor 4 Min", „+ 8 weitere Bewegungen".
- **Zukunftszeiten:** Zwei Stunden Vorlauf: „Meldezeiten liegen in der Zukunft –
  Zeiten prüfen (Geräteuhr?)", „Dauer unklar", Bewegungen „liegt in der
  Zukunft". Drei Minuten Vorlauf: „gerade eben" (Toleranz).
- **Zustände:** leer „Noch nichts gemeldet" (einmal), alle abgerückt „Alle 6
  Einheiten abgerückt", Beginn gesetzt „seit Beginn", sonst „seit erster
  Meldung", 5 Stunden alt „⚠ letzte Meldung vor 5 Std 0 Min" in Rot, Übung
  „ÜBUNG – keine Echtlage".
- **Übergabe:** Das Sammel-PDF trägt Funkrufname und Beginn; im zweiten
  Kontext: „Für den Lagemonitor übernommen: Einsatzbeginn 23.10.26, 21:31 Uhr,
  Funkrufname „Salus Führung 1"". Der Monitor dort zeigt beides.
- **Zug:** Vorschlagsliste mit dem schon vergebenen Zug, drei Schreibweisen
  ergeben einen Zug; „3 ohne Zug".
- **Sortierung/Legende:** Standard „Nr. (wie auf dem Lageblatt)", Legende „Stärke
  auf den Karten: Führer / Unterführer / Mannschaft / Gesamt." steht über der
  Liste.
- **Zwei Fenster:** Zug zuordnen im zweiten Fenster erscheint im ersten ohne
  Neuladen („Zwischensummen nach Zug (2 Züge)").
- **Rückfrage „Einsatz löschen?":** Fokus auf „Abbrechen", beide Knöpfe 44 px,
  bei 320 × 568 mit 200 % Schrift im Bild (Fuß bei 447 bis 535 px), quer
  nebeneinander.
- **Abrücken:** Ein Tipp, danach „Abgerückt 21:36: Nr. 1 …" mit „Rückgängig"; die
  Einheit steht als „ABGERÜCKT" in der Liste, die Summen sinken.
- **Lageblatt:** Zug, „ab …" für Abgerückte, „Summe laut Gerät (5 zählend · 1
  abgerückt)", Veränderungsspalte „Gesamtstärke: von 7 auf 5" (gelesen mit
  `pdftotext`).
- **Anzeigebreite:** Kein seitlicher Überlauf der Seite bei 320, 360, 640 und
  820 px (`scrollWidth` gleich Fensterbreite), auch bei 200 % Schrift.

## Abgleich mit Runde 7

Grundlage: [../runde-7/fuehrungssicht.md](../runde-7/fuehrungssicht.md)
einschließlich „Stand der Behebung".

| Runde-7-Befund | Stand laut Runde 7 | Bewertung Runde 8 | Beobachtung |
| --- | --- | --- | --- |
| R7-K1 Tabelle unter der Bildkante (P2) | behoben | hält | Tabelle im Bild bei 1920, 1366, 1280; Rest „+ n weitere Einheiten". Neu: Restplatz und Kriterium (R8-K5), Telefon (R8-K1). |
| R7-K2 Bewegungen still gekürzt (P2) | behoben | hält | Drei Zeilen, „+ 8 weitere Bewegungen", Folgemeldung mit „(−3)". |
| R7-K3 Zukunftszeiten (P2) | behoben | hält | Warnung statt „gerade eben"; 3 Minuten Toleranz. |
| R7-K4 Zug als freier Text (P2) | behoben | hält | Vorschlagsliste und Normalisierung nachgestellt. |
| R7-K5 Funkruf/Beginn reisen nicht mit (P2) | behoben | hält | Sammel-PDF, Import, Monitor im zweiten Kontext. |
| R7-K6 Auftrag nur aufgeklappt, kein Zähler (P2) | behoben | hält, mit Rest | Karte „Auftrag: …", Zähler und Filter; Kürzung auf 40 Zeichen (R8-K3), Tabelle am Tablet (R8-K2). |
| R7-K7 Wortbruch „Orga" (P3) | behoben | hält | „THW", „Orga" ungebrochen; am Telefon fehlt Platz für Zahlenspalten (R8-K1). |
| R7-K8 Widersprüche im Hauptbild (P3) | behoben | hält | Vier Zustände mit je einer Aussage; Datenstand ab 60 Min rot. |
| R7-K9 Sortierung nach Nr., Legende (P3) | behoben | hält | Standard „Nr.", Legende über der Liste. |
| R7-L2/G3/M6 Monitor am Telefon | behoben | teilweise | Schrift lesbar, Seite rollt; Zahlenspalten außerhalb (R8-K1). |
| R7-L3 Nacht-Stufe | behoben | hält | Stufen Dunkel → Gedimmt → Hell, „Hell" bewusst nicht gemerkt. |
| R7-M2/O1/G6 Zwei-Fenster-Leiste | behoben | nicht nachgestellt | Im Einsatz gleichen sich beide Fenster still an; Leiste im Bogen nicht erzwungen. |
| R7-W1/E4 Rückfragen überdecken Wahl | behoben | hält (Stichprobe) | „Einsatz löschen?" bei 200 % und 320 × 568: Fuß im Bild, Fokus auf „Abbrechen". |

Bilanz: Alle neun Runde-7-Befunde der Führungssicht halten. Nebenwirkungen
sind Randfälle der Anzeige (R8-K1, R8-K2); verkehrt hat sich keine Behebung.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Am Telefon wirkt die Monitor-Liste vollständig,
  obwohl die Zahlenspalten rechts außerhalb des Bildes liegen (R8-K1).
- **Größtes Einsatzrisiko:** Die Tabelle am Tablet stellt den Bedarf vor den
  Auftrag, die Führungsfrage „Wer macht was?" braucht seitliches Rollen
  (R8-K2); sonst keines, das über P2 hinausgeht.
- **Top-Priorität für die nächste Iteration:** F / U / M des Monitors am
  Telefon im Bild halten und die Einsatztabelle nach Führungsfragen ordnen
  (R8-K1, R8-K2).
