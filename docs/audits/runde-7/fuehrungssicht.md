# Audit „Führungssicht", Runde 7 (Lage führen, Lagemonitor, Stand übergeben)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-command-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `a52f20a` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Der Server wurde weder neu gebaut
noch neu gestartet. Der Bericht prüft die Behebungen aus
[Runde 6](../runde-6/fuehrungssicht.md) (Abschnitt „Stand der Behebung") nach
und achtet auf Nebenwirkungen der übrigen Runde-6-Änderungen (Zwei-Fenster-
Abgleich, Exportstand, Rückfragen, Fußleiste, Deckel bei großer Schrift).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`), Locale
de-DE. Jeder Lauf hatte einen eigenen Browser-Kontext, weil elf weitere Prüfer
denselben Server nutzten. Telefon 360 × 640 (`isMobile`, `hasTouch`) als
Grundeinstellung, dazu 320 × 568, 640 × 360 quer und Tablet 820 × 1180, mit
`html { font-size: 200% }`. Der Lagemonitor zusätzlich ohne Touch auf
1920 × 1080, 1366 × 768 und 1280 × 720 (Fernseher, Laptop).

Ich habe zuerst blind getestet (ohne die Berichte unter `docs/audits/` zu
lesen; nur die Gliederung von `mobile-ui.md` habe ich für die Form angesehen)
und danach den Runde-6-Bericht samt „Stand der Behebung" gelesen.

Zustände aus `localStorage`-Seeds (`eeb.einsaetze.v1`), alle mit
`uebung: false` und `stand` auf heute:
- Sammlung „Hochwasser Musterstadt", 6 Einheiten aus `examples/thw/`
  (Albstadt, Bamberg, Crailsheim, Hamburg Mitte, Oberhausen-Rheinhausen, Ulm);
- eine Variante mit 14 Einheiten, eine mit 5 abgerückten Einheiten, eine
  Übung mit Ort, eine mit leerer Sammlung, eine mit allen abgerückt, eine mit
  Meldungen 5 Stunden und 3 Tage alt, eine mit Meldezeiten in der Zukunft
  (nachgestellt für eine nachträglich korrigierte Geräteuhr);
- Folgemeldungen und eine ältere Fassung habe ich über „Bögen einlesen…"
  (JSON-Dateien) eingespielt, auch nach dem Abrücken;
- Übergabe: Sammel-PDF über „Einsatz weitergeben / sichern" erzeugt und in
  einem zweiten Kontext über „Einsatz importieren…" eingelesen;
- zwei Fenster desselben Kontexts auf derselben Einsatzansicht.

Bedient: Karten auf- und zuklappen, „Abrücken", „Zug zuordnen",
„Auftrag/Notiz", Suche/Sortierung/Filter, Karten und Tabelle, Lageblatt (PDF,
mit `pdftotext` gelesen), Übersicht-CSV, Exportstand-Zeilen, Lagemonitor
(zweites Fenster, mit Funkrufname und „Jetzt" für den Beginn).

**Nicht prüfbar:** echter Fernseher und Sitzabstand, Fenstersuche auf dem
zweiten Bildschirm, Vollbild und Wachhalten im Headless-Chromium, echtes
Drucken, Kamera, WebKit. Das Datum „Einsatzbeginn" habe ich nur über „Jetzt"
gesetzt. Die „Zeitraum vorbei"-Hinweise stammen aus den Seeds (Beispielbögen
tragen Einsatzzeiträume im Juli 2026) und zählen nicht als Befund.

## Urteil

Die Umbauten aus Runde 6 halten im Kern. Der Lagemonitor sagt jetzt, was sich
bewegt hat: Einheiten, Fahrzeuge, Zahl der Abgerückten, „letzte Meldung vor …"
und die Bewegungen der letzten 15 Minuten mit Namen („Abgerückt: THW …",
„Folgemeldung: …"). „Alle 6 Einheiten abgerückt" unterscheidet sich von
„Noch nichts gemeldet", eine Übung trägt „ÜBUNG – keine Echtlage" in Rot, der
Einsatzbeginn fällt auf „seit erster Meldung" zurück, statt einen Fehler zu
zeigen. Der Exportstand arbeitet ehrlich: Nach Abrücken und Zugänderung steht
unter dem Lageblatt „seitdem 2 Änderungen (Abrücken, Zug) — Aushang ist nicht
mehr aktuell, neu drucken". Eine Folgemeldung nach dem Abrücken kommt mit
„⚠ wieder anwesend — war abgerückt … zählt wieder mit" in der Quittung; eine
ältere Fassung wird „nur in die Historie gelegt". Zwei Fenster derselben
Einsatzansicht bleiben ohne Zutun gleich (4 zählend in beiden), Zug, Auftrag
und Abrückung reisen im Sammel-PDF mit.

Reibung entsteht an fünf Stellen. Auf dem Fernseher schieben die neuen
Bewegungszeilen die Einheitentabelle aus dem Bild (bei drei Bewegungen liegt
sie bei 1920 × 1080 vollständig unterhalb der Bildkante), und mehr als drei
Bewegungen werden still gekürzt. Der Monitor erkennt Meldezeiten in der
Zukunft nicht und schreibt „Noch nichts gemeldet" neben „6 Einheiten". Der
Zug ist ein freies Textfeld ohne Vorschlag; drei Schreibweisen ergeben drei
Züge mit eigenen Zwischensummen. Funkrufname und Beginn gehen mit der Übergabe
verloren. Und der Inhalt eines Auftrags ist nur nach dem Aufklappen der Karte
lesbar; ein Zähler oder Filter „ohne Auftrag" fehlt.

Die Aufgabe — Lage führen, Monitor einrichten, übergeben — lässt sich ohne
fremde Hilfe erledigen. Befunde mit P0 oder P1 habe ich nicht gefunden.

## Befunde

### R7-K1 [P2] Lagemonitor: Mit Bewegungszeilen liegt die Einheitentabelle unter der Bildkante, die Dauerzeile wird abgeschnitten (Rest von R6-L2, durch R6-K1 verschärft)

**Priorität:** P2

**Kennzeichnung:** gemessen (1920 × 1080, 1366 × 768, 1280 × 720;
`getBoundingClientRect`).

**Fundstelle / Aufgabe:** Lagemonitor, Hauptbild und Abschnitt „Einheiten".
Code: `src/app/lagemonitor-ui.tsx` (Zeilen `lm-bewegung`),
`src/app/lagemonitor.css` (`.lm-klapp[open] .lm-tabelle { max-height: 38vh }`).

**Beobachtung:**
- 11 anwesende Einheiten, 3 abgerückt (drei Bewegungszeilen): Seitenhöhe
  1 722 px bei 1 080 px Bildhöhe, Oberkante der Tabelle bei 1 190 px, also
  unterhalb des Bildes. Ohne Rollen sind null Tabellenzeilen sichtbar; auch
  die Zeile „seit erster Meldung: …" wird am unteren Rand angeschnitten.
- Ohne Bewegung (6 Einheiten) beginnt die Tabelle bei 805 px; im Bild sind
  rund 2,5 Zeilen. Die Tabelle rollt zusätzlich in sich (410 px bei
  1 080 px), im Rahmen sind 2 von 11 Zeilen sichtbar.
- 1366 × 768 und 1280 × 720 verhalten sich gleich (Tabelle bei 861 bzw.
  811 px, jeweils unter dem Bild).
- Der Monitor rollt nicht von selbst. Ein Fernseher hat in der Regel keine
  Maus.

**Erwartung der Rolle:** Was der Monitor zeigt, steht im Bild: Stärke,
Bewegungen, Dauer und zumindest eine Kurzliste („+ 8 weitere"). Was nicht
passt, wird gekürzt und gezählt, nicht außerhalb des Bildes versteckt.

**Folge:** Gerade bei Bewegung — wenn die Führung hinsieht — verschwindet die
Liste, aus der man sieht, welche Einheit wo steht. Die Dauerzeile, die
einzige Zeitgröße des Einsatzes, ist angeschnitten.

**Empfehlung:** Bewegungszeilen kleiner setzen oder zu einer Zeile bündeln;
Tabelle auf den Rest der Bildhöhe begrenzen, mit „+ n weitere" statt
Rollleiste; Dauerzeile oberhalb der Bewegungen.

**Nachprüfung:** 1920 × 1080 mit 11 anwesenden und 3 abgerückten Einheiten:
Dauer und mindestens vier Tabellenzeilen ohne Rollen im Bild, bei mehr
Einheiten „+ n weitere".

### R7-K2 [P2] Lagemonitor: Mehr als drei Bewegungen werden still abgeschnitten; die Folgemeldung nennt keinen Betrag

**Priorität:** P2

**Kennzeichnung:** gemessen (Seed: fünf Abrückungen und eine Folgemeldung
innerhalb von 15 Minuten) und im Code gelesen
(`bild.bewegungen.slice(0, 3)`).

**Fundstelle / Aufgabe:** Lagemonitor, Bewegungszeilen unter der Kopfzeile
„… abgerückt".

**Beobachtung:** Die Kopfzeile sagt „1 Einheit · 2 Fahrzeuge · 5 abgerückt";
darunter stehen drei Zeilen („Folgemeldung: THW Albstadt …", zwei Mal
„Abgerückt: …"). Drei weitere Abrückungen fehlen, ohne Hinweis. Die
Folgemeldung nennt nur den Namen; in der Einsatzansicht steht dazu „Stärke
4 → 2 (−2)", auf dem Monitor springt die Stärke von 4 auf 1 ohne Betrag.

**Erwartung der Rolle:** „+ 3 weitere Bewegungen" oder alle Zeilen; bei der
Folgemeldung die Änderung („Albstadt: Stärke 4 → 1").

**Folge:** Wer vor dem Bildschirm eine Zahl diskutiert, erfährt nur einen
Teil der Gründe und hält die übrigen für Fehler.

**Empfehlung:** Anzahl der ausgelassenen Bewegungen nennen; bei der
Folgemeldung die Stärkeänderung auf die Zeile setzen.

**Nachprüfung:** Fünf Abrückungen innerhalb von 15 Minuten: Der Monitor nennt
alle fünf oder „+ 2 weitere". Folgemeldung mit −3: Die Zeile nennt „−3".

### R7-K3 [P2] Lagemonitor: Meldezeiten in der Zukunft werden als „gerade eben" und „Noch nichts gemeldet" angezeigt

**Priorität:** P2

**Kennzeichnung:** gemessen (Seed mit `empfangenAm` zwei Stunden in der
Zukunft, nachgestellt für eine nachträglich korrigierte Geräteuhr) und im Code
gelesen (`alterText` mit `Math.max(0, …)`, `dauerText` liefert bei
`jetzt < beginn` `null`).

**Fundstelle / Aufgabe:** Lagemonitor, Zeilen „letzte Meldung …" und
„seit erster Meldung …". Code: `src/app/lagemonitor.ts` (`alterText`,
`dauerText`), `src/app/lagemonitor-ui.tsx` (`dauerZeile`).

**Beobachtung:** Bei sechs Einheiten steht im Bild „6 Einheiten · 22
Fahrzeuge", „letzte Meldung gerade eben" und darunter „Noch nichts gemeldet".
Die App selbst warnt in solchen Fällen an der Karte (Runde 6, Bericht
`fehler-und-wiederanlauf.md`: „Eingetroffen … liegt in der Zukunft"); der
Monitor kennt die Warnung nicht.

**Erwartung der Rolle:** Ein Widerspruch im Bild wird gar nicht erst gezeigt;
bei unplausiblen Zeiten steht „Zeiten prüfen (Geräteuhr?)".

**Folge:** Ein Telefon ohne Netzzeit, das nach dem Start nachgestellt wird
(Annahme, aber im Feld üblich), erzeugt einen Monitor, der behauptet, es sei
noch nichts gemeldet, obwohl sechs Einheiten in der Tabelle stehen.

**Empfehlung:** Zukunftszeiten erkennen und benennen, statt „gerade eben" und
„Noch nichts gemeldet" zu schreiben.

**Nachprüfung:** Sammlung mit Meldezeit in der Zukunft: Der Monitor nennt die
Abweichung und widerspricht sich nicht.

### R7-K4 [P2] „Zug zuordnen": freier Text ohne Vorschlag; „1. Zug", „1.Zug" und „1. zug" werden drei Züge

**Priorität:** P2

**Kennzeichnung:** gemessen (drei Zuordnungen in der Einsatzansicht, danach
„Zwischensummen nach Zug").

**Fundstelle / Aufgabe:** Karte → „Zug zuordnen"; Block „Zwischensummen nach
Zug". Das Feld trägt `aria-label="Zug"` und `placeholder="z. B. 2. Zug"`, aber
keine Vorschlagsliste (`list` fehlt).

**Beobachtung:** Nach „1. Zug", „1.Zug" und „1. zug" für drei Einheiten steht
dort „Zwischensummen nach Zug (4 Züge)": drei getrennte Zeilen mit je einer
Einheit und eigenen Summen, dazu „Ohne Zug". Beim zweiten Zuordnen bietet das
Feld den schon vergebenen Zug nicht an. Lageblatt und CSV übernehmen die
Schreibweise.

**Erwartung der Rolle:** Bereits vergebene Züge stehen als Antippliste da; die
Schreibweise wird nicht mehrfach getippt.

**Folge:** Die Zwischensumme je Zug, die die Führung für die Gliederung der
Lage braucht, ist falsch, sobald zwei Hände den Zug verschieden schreiben. Bei
20 Einheiten und mehreren Bedienern ist das der Normalfall.

**Empfehlung:** Vorhandene Züge als Auswahl anbieten, die Eingabe gegen
vorhandene Züge ohne Rücksicht auf Groß-/Kleinschreibung und Leerzeichen
abgleichen („Meinten Sie 1. Zug?").

**Nachprüfung:** Zweite Einheit zuordnen: Der erste Zug steht als Antippziel
da; „1.Zug" und „1. zug" führen zum selben Zug.

### R7-K5 [P2] Übergabe: Funkrufname und Einsatzbeginn des Monitors reisen nicht mit (Rest von R6-K4)

**Priorität:** P2

**Kennzeichnung:** gemessen (Sammel-PDF vom ersten Kontext, Import im zweiten;
Monitor in beiden).

**Fundstelle / Aufgabe:** „Einsatz weitergeben / sichern" → „Einsatz
importieren…" → „Lagemonitor öffnen".

**Beobachtung:** Gerät 1 (Funkrufname „Salus Führung 1", Beginn „Jetzt"): Der
Monitor zeigt als erste Zeile „Salus Führung 1" und die Dauer. Gerät 2 nach
dem Import: Zug „1. Zug", Auftrag und Abrückung sind da („Einsatz … übernommen:
6 Einheiten, davon 5 anwesend"), der Monitor zeigt aber nur „Hochwasser
Musterstadt" ohne Funkrufname und „seit erster Meldung: …" statt der Dauer ab
Beginn. Das Fallback ohne Beginn funktioniert (R6-K4 teilweise behoben), die
Übergabe benennt den Beginn aber weiterhin nicht.

**Erwartung der Rolle:** Wer die Lage übernimmt, bekommt Beginn und
Funkrufname mit oder erfährt in der Quittung, dass beides zu setzen ist.

**Folge:** Nach jeder Ablösung steht auf dem Fernseher eine andere Zeitbasis
und ein anderer Kopf als vorher, ohne dass jemand es merkt.

**Empfehlung:** Beginn und Funkrufname in die Weitergabe aufnehmen, sonst die
Quittung um einen Satz ergänzen („Einsatzbeginn und Funkrufname des Monitors
neu eintragen").

**Nachprüfung:** Beginn und Funkrufname setzen, Sammel-PDF auf einem zweiten
Gerät importieren: Monitor zeigt beides.

### R7-K6 [P2] Auftrag: Inhalt nur nach dem Aufklappen lesbar; kein Zähler oder Filter „ohne Auftrag" oder „ohne Zug"

**Priorität:** P2

**Kennzeichnung:** beobachtet (Telefon 360 × 640, Karte zu- und aufgeklappt,
Filterliste geöffnet).

**Fundstelle / Aufgabe:** Einsatzansicht, Einheitenliste; „Suchen, sortieren,
filtern".

**Beobachtung:** Die zugeklappte Karte zeigt „Auftrag ✓", nicht „Deichabschnitt
Nord ab 14:00"; der Text steht erst in der aufgeklappten Karte und in der
Tabelle (letzte Spalte) und im Lageblatt. Die Filter sind: Suche, Sortierung,
Qualifikation, „nur dringender Bedarf (ohne Kraftstoff)". Es gibt keinen
Filter und keinen Zähler für „ohne Auftrag", „ohne Zug", „abgerückt" oder
„Hinweise offen".

**Erwartung der Rolle:** Auf der Karte steht, wer was macht (Auftrag in einer
Zeile); oben die Zahl der Einheiten ohne Auftrag.

**Folge:** Die Frage „Wer hat noch keinen Auftrag?" lässt sich bei 20
Einheiten nur durch Durchsehen jeder Karte beantworten.

**Empfehlung:** Auftragstext (gekürzt) auf die Karte; Zähler „x ohne Auftrag"
und Filter für Auftrag und Zug.

**Nachprüfung:** Drei von sechs Einheiten mit Auftrag: Der Kopf nennt „3 ohne
Auftrag", ein Tipp filtert sie; die Karte zeigt den Auftragstext.

### R7-K7 [P3] Lagemonitor: Spalte „Orga" bricht mitten im Wort („TH / W", „Org / a"), auch bei 1920 px

**Priorität:** P3

**Kennzeichnung:** gemessen (1920 × 1080: Spalte 109 px bei 39,7 px Schrift;
Telefon).

**Fundstelle / Aufgabe:** Lagemonitor, Tabelle „Einheiten".
`src/app/lagemonitor.css` Zeile 42 (`overflow-wrap: anywhere`).

**Beobachtung:** „THW" steht in jeder Zeile als „TH" und „W", die Kopfzelle
als „Org" und „a". Die Spalte bleibt auf 109 px, obwohl daneben Platz ist;
auch die Spalte „Einheitentyp" bricht „Materialwirtschaft" im Wort („…scha /
ft" am Telefon).

**Erwartung der Rolle:** Kürzel bleiben ganz.

**Folge:** Gering; auf dem Fernseher wirkt die Tabelle fehlerhaft.

**Empfehlung:** Für Tabellenzellen `overflow-wrap: normal` und Mindestbreite
für „Orga".

**Nachprüfung:** „THW" und „Orga" stehen in einer Zeile.

### R7-K8 [P3] Lagemonitor: Kleine Widersprüche und Lücken im Hauptbild

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Lagemonitor, Zustände „leer", „alle abgerückt",
Beginn gesetzt, Sammlung mit Ort.

**Beobachtung:**
- Leere Sammlung: „Noch nichts gemeldet" steht zweimal untereinander (Lage-
  und Dauerzeile).
- Alle sechs abgerückt: Das Hauptbild sagt „Alle 6 Einheiten abgerückt", die
  Tabelle darunter „Noch keine Einheit gemeldet."
- Beginn gesetzt: Die Dauer steht ohne Beschriftung („0 Stunden, 0 Minuten"),
  ohne Beginn mit „seit erster Meldung:".
- Sammlung mit Ort „Heilbronn": Der Ort steht im Hauptbild nirgends mehr
  (nur im zugeklappten „Einsatzdaten"); der Name allein trägt ihn nicht.
- Datenstand: „letzte Meldung vor 5 Std 0 Min" und „vor 3 Tagen" sehen aus
  wie „vor 1 Min" (gleiche Schrift, gleiche Farbe).

**Erwartung der Rolle:** Eine Aussage pro Zeile, Dauer mit Wort („seit
Beginn"), alte Daten sichtbar abgesetzt.

**Folge:** Gering.

**Empfehlung:** Zeilen zusammenfassen, Wort ergänzen, ab einer Stunde Alter
den Datenstand hervorheben.

**Nachprüfung:** Die vier Zustände zeigen je eine Aussage; Datenstand ab 60
Minuten hervorgehoben.

### R7-K9 [P3] Einheitenliste: Standardsortierung A–Z, keine Sortierung nach Nr.; Stärke ohne Beschriftung auf der Karte

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Einheitenliste, „Sortierung" und Karten.

**Beobachtung:** Die Liste steht nach Name (Nr. 6, 2, 5, 1, 4, 3). Das
Lageblatt ist nach Nr. sortiert, und die Nr. ist die Nummer, die am Funk
genannt wird. Sortieroptionen: Name, Zuletzt gemeldet, Eintreffzeit, Zug,
Organisation; „Nr." fehlt. Die Karten nennen „Stärke 1 / 1 / 2 / 4" ohne
Legende (F / U / M / gesamt); die Kopfzeilen der Einsatzansicht und die
Tabelle beschriften sie, die Karte nicht. Das Suchfeld schneidet den
Platzhalter ab („Einheit, Organisation, Ort, Zug, Ken…").

**Erwartung der Rolle:** Reihenfolge wie auf dem Lageblatt, Stärke mit Legende.

**Folge:** Gering; wer das Lageblatt neben das Gerät legt, sucht die Zeilen.

**Empfehlung:** Sortierung „Nr." anbieten (Standard), Legende einmal über der
Liste.

**Nachprüfung:** Liste und Lageblatt haben dieselbe Reihenfolge; die Legende
steht über der Liste.

## Verweise auf Befunde in anderen Berichten

Hier nicht erneut gezählt:

- **„Bedarf:" bricht mitten im Wort („Bed / arf:")** in der Kopfzeile der
  Einsatzansicht, weiter vorhanden (gemessen: `summary` mit `display: flex`,
  `strong` auf 32,6 px geschrumpft): siehe [mobile-ui.md](../runde-6/mobile-ui.md)
  und [nacht-und-sicht.md](../runde-6/nacht-und-sicht.md) (Runde 6).
- **Doppelte Ansicht-Wahl im Kopf und im festen Balken** am Telefon, quer
  (640 × 360): siehe [mobile-ui.md](../runde-6/mobile-ui.md), R6-M8 und
  folgende.
- **Block „Lagemonitor für den Fernseher" weit unten** (Telefon, 6 Einheiten
  bei 2 850 von 4 480 px, 14 Einheiten bei 4 043 px, 200 % Schrift bei
  8 098 px): R6-K5, weiter teilweise (Tabelle unten).

## Bestätigtes

- **Bewegung auf dem Monitor:** „Abgerückt: THW …" mit „gerade eben" bzw. „vor
  2 Min" erscheint nach dem Abrücken in der App ohne Zutun im offenen Monitor;
  „Folgemeldung: …" erscheint bei neuer Fassung.
- **Hauptbild des Monitors:** Stärke mit Beschriftung („Stärke F / U / M //
  gesamt"), „6 Einheiten · 22 Fahrzeuge · 1 abgerückt", „letzte Meldung vor 1
  Min", Dauer; „Alle 6 Einheiten abgerückt" statt „0 / 0 / 0"; Übung als rote
  Kopfzeile.
- **Exportstand:** „Lageblatt erstellt … · seitdem keine neue Meldung", nach
  Abrücken und Zug „seitdem 2 Änderungen (Abrücken, Zug) — Aushang ist nicht
  mehr aktuell, neu drucken"; auch für die Übersicht-CSV je Format eigener
  Bezugspunkt.
- **Folgemeldung:** Quittung „Folgemeldung 17:46: Stärke 4 → 2 (−2)", Karte
  „neue Fassung · Folgem. 17:46 · 4 → 2 · Verpfl. 4 (St. 2)"; nach dem Abrücken
  „⚠ wieder anwesend — war abgerückt … zählt wieder mit"; ältere Fassung
  „älterer Stand als der vorhandene … — nur in die Historie gelegt".
- **Zwei Fenster:** Abrücken im ersten Fenster erscheint im zweiten ohne
  Neuladen; ein Abrücken im zweiten Fenster führt zu 4 zählend in beiden, nach
  dem Neuladen bleibt es.
- **Lageblatt und CSV:** Zug, Auftrag, Abrückzeit („ab …"), Block
  „Abgerückt (1)" und „Summe laut Gerät (5 zählend · 1 abgerückt)"; Spalte
  „Auftrag/Notiz" in der Übersicht-CSV.
- **Übergabe:** Zug, Auftrag und Abrückung kommen über Sammel-PDF und Import auf
  das zweite Gerät.
- **Anzeigebreite:** Kein seitlicher Überlauf bei 320, 360, 640 und 820 px
  (auch bei 200 % Schrift); Tablet zeigt Bedarf offen und Suchzeile im ersten
  Bild.

## Abgleich mit Runde 6

Grundlage: [../runde-6/fuehrungssicht.md](../runde-6/fuehrungssicht.md)
einschließlich „Stand der Behebung".

| Runde-6-Befund | Stand laut Runde 6 | Bewertung Runde 7 | Beobachtung |
| --- | --- | --- | --- |
| R6-K1 Monitor ohne Bewegung und Datenstand (P1) | behoben | hält | Einheiten, Fahrzeuge, abgerückt, „letzte Meldung vor …", Bewegungen mit Namen; „alle abgerückt" ≠ „leer". Rest: Kürzung auf drei ohne „+ n" und Folgemeldung ohne Betrag (R7-K2). |
| R6-K2 Gewichtung Uhr/Stärke (P2) | teilweise | teilweise | Stärke beschriftet, Einheiten und Fahrzeuge im Hauptbild; die Uhr nimmt weiter rund 22 % der Bildhöhe, die Stärke 13 %. Mit Bewegungszeilen liegt die Tabelle außerhalb des Bildes (R7-K1). |
| R6-K3 Übung nicht erkennbar (P2) | behoben | hält | „ÜBUNG – keine Echtlage" in Rot oberhalb des Namens. Der Ort steht im Hauptbild nicht mehr (R7-K8). |
| R6-K4 Beginn nur von Hand, nicht in der Weitergabe (P2) | teilweise | teilweise | Fallback „seit erster Meldung" hält; Beginn und Funkrufname reisen weiter nicht mit (R7-K5). |
| R6-K5 Block am Seitenende (P2) | teilweise | teilweise | Block hinter den Export-Knöpfen, Erklärung bei den Knöpfen. Kein Kurzlink; Knopf bei 2 850 px (Telefon, 6 Einheiten). |
| R6-K6 Import-Quittung Nummernwechsel (P2) | behoben | nicht nachgestellt | Ein Gerät mit abweichenden Nummern habe ich nicht aufgebaut; Quittungen für Folgemeldung, ältere Fassung und Übernahme sind klar. |
| R6-K7 „Anderer Einsatz?" verschwindet (P2) | behoben | nicht nachgestellt | Im Seed trägt jede Einheit den Hinweis, weil alle Bögen andere Orte nennen; ein Fall mit zwei gleichen Fremdwörtern wurde nicht gebaut. |
| R6-K8 Kleinigkeiten „Zuletzt gemeldet" (P3) | offen | gegenstandslos | Die Liste gibt es nicht mehr; Datenstand ab einer Stunde nicht abgesetzt (R7-K8). |
| R6-K9 Sammel-PDF-Knopf „nur neue Bögen" (P3) | teilweise | nicht nachgestellt | Erste Lieferung nicht geprüft; Exportstand-Zeilen (Übersicht-CSV) stimmen. |
| R6-K10 Schreibweise Unterbringungsänderung (P3) | offen | nicht nachgestellt | Keine Folgemeldung mit geänderter Unterbringung eingespielt. |

Bilanz: Von zehn Runde-6-Befunden halten drei ganz (K1, K3 und die
Gegenstandslosigkeit von K8), drei sind weiter teilweise (K2, K4, K5), vier
habe ich nicht nachgestellt. Verkehrt hat sich keine Behebung; Nebenwirkung
der neuen Bewegungszeilen ist die verdrängte Tabelle (R7-K1).

## Abschluss

- **Aufgabe geschafft:** ja, mit Umwegen (Auftrag nur im aufgeklappten Zustand
  lesbar, Zug als freier Text, Beginn und Funkrufname nach Übergabe neu setzen).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Der Auftragshaken auf der Karte sieht nach einem
  gelesenen Auftrag aus, ist aber nur ein Hinweis, dass einer da ist (R7-K6).
- **Größtes Einsatzrisiko:** Der Monitor zeigt bei Bewegung die Stärke, aber
  nicht mehr die Einheitenliste, und kürzt die Gründe ohne Hinweis (R7-K1,
  R7-K2); Zwischensummen je Zug laufen bei uneinheitlicher Schreibweise
  auseinander (R7-K4).
- **Top-Priorität für die nächste Iteration:** Den Monitor auf die Bildhöhe
  auslegen: Bewegungen bündeln, Dauer vor die Tabelle, Tabelle auf den Rest
  mit „+ n weitere" (R7-K1, R7-K2).
