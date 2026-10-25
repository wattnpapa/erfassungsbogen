# Audit „Neuer Nutzer", Runde 6 (THW-Helfer ohne Einweisung)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-new-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 03a0011. Zwei spätere Commits auf main (nur Lagemonitor) sind im
geprüften Build nicht enthalten.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-5-Befunde. Die Prüfung begann am 17.10.2026 und wurde nach einer
Unterbrechung am 23.10.2026 zu Ende geführt (Server zwischenzeitlich neu
gestartet, gleicher Build).

## Prüfaufbau

Wie in Runde 5: Playwright aus `node_modules`, Chromium unter
`/opt/pw-browsers/chromium`, `isMobile`/`hasTouch`, Locale de-DE, Telefon
360 × 640 (Gerätepixelverhältnis 2). Produktionsbuild unter
`http://localhost:4173`, je Lauf ein eigener Browser-Kontext. Elf weitere
Prüfer nutzten den Server gleichzeitig; Zeiten habe ich nicht gewertet; die 75 ms in R6-N1
sind ein Ablauf (geschlossen von selbst), kein Lastwert.

Zustände entstanden zum Teil durch Bedienung (leeres Gerät → „Neuen Bogen
erstellen“, „Neue Einsatz-Sammlung…“, Dateien in „Bögen einlesen…“, „Aus Datei
laden…“, „Einsatz importieren…“), zum Teil durch `localStorage`-Seeds
(`eeb.entwurf.v1`, `eeb.einsaetze.v1`, `eeb.uhr.v1`) aus `examples/`, jeweils
mit `uebung: false`. Bei den Seeds setzte ich `stand` und Einsatzzeitraum der
Beispielbögen auf heute, sonst fiel die Datenschutzfrist sofort an („DATENSCHUTZ-
FRIST ABGELAUFEN“ beim ersten Öffnen von `001-albstadt-ztr-tz`, dessen Stand 92
Tage alt ist; das ist Seed-Wirkung, kein Befund).

Bögen: THW `001-albstadt-ztr-tz`, `002-biberach-riss-fgr-o-b`,
`003-crailsheim-fgr-w-a`, `010-radolfzell-tr-log-ts`; DRK `seg-sanitaet` und
`bhp25-behandlung-rot`; Feuerwehr `niedersachsen/gruppe-sudheim`; DLRG
`wrz-mittelbaden-tauchgruppe`; Bundeswehr `panzerpionierzug`; ASB
`einsatzeinheit-sanitaetsgruppe`; BBK `dekontaminationszug-verletzte`;
Katastrophenschutz Bayern `ff-hlk-abc-abwehr-…-ingolstadt`. Abgeleitete
Prüfbögen: Albstadt ohne Einheitstyp mit drei Personen („Papierphase“),
Biberach mit späterem Stand und zwei Personen weniger.

Ich habe zuerst ohne Blick in Anleitung, Dokumentation oder frühere Berichte
getestet. Danach habe ich `runde-5/neuer-nutzer.md` mit „Stand der Behebung“
und `runde-5/README.md` gelesen, erst zuletzt die übrigen Runde-6-Berichte
(Stand beim Lesen: elf lagen vor, teils als Rohnotizen).

Szenarien: (1) eigenen Bogen anlegen und übergeben, dazu Bögen sieben
Organisationen lesen; (2) Meldekopf: Sammlung anlegen, fünf bis sechs Bögen
aufnehmen, Karte aufklappen, Einsatz löschen und zurückholen, Einsatz als PDF
sichern und wieder importieren; (3) Rückfragen („Wohin damit?“, „Einheit ist
bereits gemeldet“, „Ist das dieselbe Einheit?“); (4) Papier-Rückweg („Lage vom
Papier abgleichen…“ mit „Nr. laut Blatt“), Blanko-Vordruck; (5) Geräteuhr,
Fehlerseite, Ansicht, Anleitung.

**Nicht prüfbar:** Kamera-Scan mit echtem Bild, USB-Handscanner, echte
Handschuhe und echtes Licht, echte Bildschirmtastatur, native Datums- und
Auswahllisten (headless Chromium zeigte „10/17/2026“ im US-Format; ich werte
das nicht), WebKit/Safari, echtes Drucken und PDF-Betrachter (die Blanko-PDF
habe ich mit `pdftoppm` gerastert), native Builds (Electron/Android), ein
echter Sprung der Geräteuhr (nur der Zustand danach per Seed). Das Einlesen
einer gedruckten, wieder fotografierten Sammel-PDF habe ich nicht nachgespielt:
Die Einträge „vom Papier“ entstanden über `vomPapier` im Seed, die Rückfragen
über Dateien (JSON), nicht über QR-Bilder. Ein echter Kaltstart über einen
Link (neuer Tab) war nicht Teil meiner Läufe; R6-N1 ist mit frisch geladener
Seite (erster Verlaufseintrag) belegt.

## Urteil

Der eigene Bogen gelingt ohne Hilfe: Startseite, sechs Schritte, Übersicht und
„Bogen übergeben…“ sind verständlich, die Hinweise lenken (z. B. „Vom Papier
abtippen? … erst Schritt 4“, die Erklärung von „Nur Stärke“, „Zeitraum bis“).
Die Geräteuhr-Warnung trägt: Sie nennt zwei Daten, sagt, dass bis zur Antwort
nichts gelöscht wird, nennt Sammlungen und Namen und fragt vor dem Löschen
ein zweites Mal. Die Fehlerseite sagt in Alltagssprache, dass die Daten noch
da sind. Der Papier-Abgleich mit „Nr. laut Blatt“ ist beschriftet, wie ein
Helfer mit dem Papierblatt es erwartet, und meldet doppelte Nummern.
„Einsatz löschen“ und „Person entfernen“ sagen, wohin die Daten gehen, und
bieten „Rückgängig“.

Reibung entsteht an einer Stelle, die ein Neuling am Meldekopf sofort trifft:
Die Rückfrage, die direkt auf „Wohin damit?“ folgt, schließt sich nach rund
75 ms selbst. Wer von der Startseite aus eine Datei, einen Link oder einen Scan
übernimmt und die Einheit schon in der Sammlung hat (Folgemeldung, ähnlicher
Name), bekommt nur „… nicht aufgenommen.“ ohne Grund, und das bei jedem Versuch
(R6-N1). Der Ausweg (Sammlung öffnen, dort „Bögen einlesen…“) steht nirgends.
Dazu kommen drei P2: Der Stapelimport zählt eine Einheit ohne Typ neben ihrer
Fassung mit Typ doppelt, ohne Hinweis (R6-N2); die Karte „Lage noch nicht
abgeglichen“ bleibt nach dem Abgleich mit falscher Aussage stehen (R6-N3); die
Fehlerseite führt bei einem Fehler in einer einzelnen Sammlung nur zu „Neu
laden“ und „Alle Daten löschen“ (R6-N4). Sieben P3 betreffen Beschriftungen und
Kleinigkeiten.

Aufgabe 1 gelingt ohne fremde Hilfe. Aufgabe 2 und 4 gelingen, solange der
Helfer in der Sammlung bleibt; die Rückfragen von der Startseite aus gelingen
nicht (R6-N1).

## Befunde

### R6-N1 [P1] Eine Rückfrage, die direkt auf „Wohin damit?“ folgt, schließt sich nach rund 75 ms selbst; die Meldung heißt dann „… nicht aufgenommen.“ (neu)

**Priorität:** P1

**Kennzeichnung:** gemessen (Wiederholung 3 von 3 bei „Ist das dieselbe
Einheit?“ mit Klick, Touch-Tipp und Enter; 1 von 1 bei „Einheit ist bereits
gemeldet“); Ursache im Code gelesen, nicht durch Eingriff belegt.

**Fundstelle / Aufgabe:** Startseite mit Sammlung „Hochwasser Test“ (5
Einheiten) → Datei laden (Eingabefeld hinter „Aus Datei laden…“) →
„Wohin damit?“ → „In „Hochwasser Test“ aufnehmen“. Code:
`src/app/modal-overlay.ts` (`ersteEbeneBetreten`, `ersteEbeneVerlassen`, dort
`setTimeout(…, 80)` mit `history.back()`), `src/app/dialoge.tsx`
(`Dialogfenster`, `beiSchluss`), Aufruf in `src/app/app.tsx` (Rückfragen ab Z.
1790 und 1851, „nicht aufgenommen“ Z. 1840 und 1902).

**Beobachtung:**
- Mit Datei `a-ohne-typ.json` („THW Albstadt“, Stärke 3) bei vorhandener
  Einheit „THW Albstadt Zugtrupp Technischer Zug“: „Wohin damit?“ erscheint
  und lässt sich bedienen. Nach der Wahl öffnet „Ist das dieselbe Einheit?“
  und ist rund 75 ms später wieder zu, ohne dass jemand etwas tippte. Danach
  steht über der Startseite „„THW Albstadt“ nicht aufgenommen.“, kein Grund,
  keine Wahl.
- Mit `b-neu.json` (Biberach, neuerer Stand, zwei Personen weniger) dasselbe
  mit „Einheit ist bereits gemeldet“.
- Das Dialog-Protokoll (MutationObserver auf `dialog[open]`): „Wohin damit?“ zu
  bei 1428 ms, „Ist das dieselbe Einheit?“ auf bei 1447 ms, zu bei 1520 ms.
  Der Zeitabstand zum Schließen der ersten Rückfrage (rund 92 ms) passt zur
  80-ms-Verzögerung in `ersteEbeneVerlassen`: Der Verlaufseintrag der ersten
  Rückfrage wird erst nach dem Öffnen der zweiten verbraucht und scheint als
  „Zurück“ der zweiten gelesen zu werden (Ursache: Vermutung aus dem Code).
- Aus der geöffneten Sammlung („Bögen einlesen…“) tritt der Fehler nicht auf:
  Folgemeldung Biberach wird aufgenommen und als „Folgemeldung 13:29: ▼ Stärke
  11 → 9 (−2)“ gemeldet. Die Startseite ist der erste Verlaufseintrag der
  App, deshalb legt die erste Rückfrage dort einen eigenen Eintrag an
  (Behebung von R5-S5).

**Erwartung der Rolle:** Wenn eine Frage kommt, bleibt sie stehen, bis ich
antworte. Wenn die App etwas nicht übernimmt, sagt sie, warum.

**Folge:** Am Meldekopf ist „Datei oder Link vom Startbildschirm“ der
nächstliegende Weg. Die Nachmeldung einer schon gemeldeten Einheit kommt auf
diesem Weg nie an; der Helfer sieht „nicht aufgenommen“ und versucht es noch
einmal, mit demselben Ergebnis. Er hält die Datei für kaputt oder meldet die
Einheit mit dem alten Stand weiter. Die Lage zeigt weiter die ältere Meldung.

**Empfehlung:** Eine Folgerückfrage darf nicht von der Aufräum-Rückkehr der
vorigen geschlossen werden (die verzögerte Rückkehr nur verbrauchen, wenn
keine neue Rückfrage offen ist oder ihren eigenen Eintrag trägt). Solange das
nicht so ist: „nicht aufgenommen“ mit Grund und Ausweg („Frage wurde
abgebrochen — Sammlung öffnen und dort „Bögen einlesen…“ nutzen“).

**Nachprüfung:** Frische Seite, Sammlung mit „THW Biberach …“, Datei
`b-neu.json` über die Startseite laden, „Wohin damit?“ beantworten: „Einheit
ist bereits gemeldet“ muss offen bleiben, bis eine Wahl getroffen ist. Ebenso
„Ist das dieselbe Einheit?“ mit der Datei ohne Einheitstyp. Dazu: Zurück-Geste
bei einer einzelnen Rückfrage schließt weiter nur die Rückfrage (heute
bestätigt, siehe „Abgleich mit Runde 5“).

### R6-N2 [P2] Stapelimport legt eine Einheit ohne Typ neben ihrer Fassung mit Typ an und zählt beide, ohne es zu sagen (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet (Gesamtstärke 40 → 43).

**Fundstelle / Aufgabe:** Sammlung mit „THW Albstadt Zugtrupp Technischer Zug“
(Stärke 4) → „Bögen einlesen…“ → Datei `a-ohne-typ.json` („THW Albstadt“,
1 / 1 / 1 / 3). Code: `src/app/app.tsx` Z. 1851 ff. (Kommentar: „Im Stapel
keine Frage: dort gilt „anhalten kostet mehr als nachträglich
zusammenführen““).

**Beobachtung:** Quittung „1 Bogen aufgenommen.“, „Neu seit der letzten
Kenntnisnahme: THW Albstadt — neu gemeldet“. Die Liste zeigt „Nr. 6 THW
Albstadt“ und „Nr. 1 THW Albstadt Zugtrupp Technischer Zug“; die Summe steigt
von 40 auf 43. Weder Quittung noch Karte erwähnen die mögliche Doppelung. An
der Karte stehen „kürzlich eingetroffen“ und „Hinweise: Verpflegung 4 statt
Stärke 3“, nicht aber „gleicher Ort wie Nr. 1“. Die Zusammenführung, auf die
der Code verweist, finde ich als Helfer nicht: unter „Mehr…“ habe ich sie nicht
geöffnet (nicht geprüft).

**Erwartung der Rolle:** Zwei Karten „THW Albstadt“ in einer Lage sehen für
mich nach einer Einheit aus. Wenn die App sie trotzdem zweimal zählt, sagt sie
es.

**Folge:** Die Stärke am Meldekopf ist um die Doppelmeldung zu hoch; wer das
Lageblatt weitergibt, meldet eine Einheit zweimal.

**Empfehlung:** Im Stapel nicht fragen, aber die Quittung nach dem Muster der
Folgemeldung ergänzen: „THW Albstadt ähnelt „THW Albstadt Zugtrupp …“ (Nr. 1)
— zusammenführen?“ mit einem Tipp. Die Marke gehört auch an die Karte.

**Nachprüfung:** Sammlung mit Albstadt (mit Typ), Datei ohne Typ im Stapel
einlesen: Quittung und Karte nennen die mögliche Doppelung, ein Tipp führt
zusammen, die Summe sinkt wieder auf 40 (mit der Stärke der neueren Meldung).

### R6-N3 [P2] Nach „Abgleich übernehmen“ bleibt die Karte „Lage noch nicht abgeglichen … ohne Zug, Auftrag und Nummer“ stehen, obwohl Nummer und Zug eingetragen sind (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Sammlung mit fünf Einheiten „vom Papier“ → „Lage vom
Papier abgleichen…“ → „Nr. laut Blatt“ 3 (Albstadt), 1 (Biberach), Zug „Zug A“
bei Albstadt, keine Eintreffzeit → „Abgleich übernehmen“. Code:
`src/app/papier-abgleich-ui.tsx` (Texte Z. 155–205, `offenVomPapier` Z. 22).

**Beobachtung:**
- Doppelte „Nr.“ (2 und 2) wird abgefangen: „„Nr. 2“ steht bei THW Albstadt …
  und THW Biberach … Nichts übernommen.“ — klar.
- Nach gültiger Eingabe kommen nacheinander zwei Hinweisfenster mit je „Alles
  klar“: „Eintreffzeit nicht bestätigt“ (für 5 Einheiten) und „Nummern neu
  vergeben“ (für 3 Einheiten). Beide Fenster nennen die Einheiten nicht; welche
  drei neue Nummern bekamen (Crailsheim 2, Radolfzell 4, DRK 5), steht nur in
  der Liste.
- Danach steht die Karte „Vom Papier eingelesen, Lage noch nicht abgeglichen: 5
  Einheiten. … alle stehen als anwesend, ohne Zug, Auftrag und Nummer. Die
  Angaben vom Blatt … hier in einem Schritt eintragen.“ unverändert da, mit
  dem Knopf „Lage vom Papier abgleichen…“. Alle fünf Karten tragen weiter
  „vom Papier, Zeiten prüfen“. Erst eine Eintreffzeit je Einheit nimmt sie
  heraus (fünf Datumsfelder auf einem Telefon).
- Die Liste ist nicht nach „Nr.“ geordnet: Nr. 5, 3, 1, 2, 4.

**Erwartung der Rolle:** Nach „Abgleich übernehmen“ ist abgeglichen. Was noch
fehlt, steht als Rest („noch 5 ohne Eintreffzeit“), nicht als Wiederholung der
Ausgangslage.

**Folge:** Der Helfer glaubt, der Abgleich sei nicht angekommen, und gibt ihn
noch einmal ein (mit Neuvergabe derselben Nummern) oder lässt die falsche
Aussage stehen. Wer mit dem Blatt an der Wand arbeitet, sucht „Nr. 3“ in einer
Liste, die mit „Nr. 5“ beginnt.

**Empfehlung:** Die Karte nach dem Abgleich neu fassen („Abgeglichen bis auf die
Eintreffzeit: 5 Einheiten“, Knopf „Eintreffzeiten nachtragen…“). Die beiden
Hinweisfenster zu einem zusammenlegen und die betroffenen Einheiten nennen.
Optional „nach Nr. sortieren“ vorn anbieten, sobald Blatt-Nummern vergeben
sind.

**Nachprüfung:** Abgleich mit Nr. und Zug, ohne Zeit: Karte nennt nur noch das
Fehlende; ein Hinweisfenster; Reihenfolge nach Nr. wählbar.

### R6-N4 [P2] Fehlerseite bei einer kaputten Sammlung: „Neu laden“ führt zum selben Absturz, der Einzelweg steht nicht da (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet (Seed: Sammlung, deren zweiter Eintrag keinen
`einheit`-Block hat); Ausweg im Code nur gelesen.

**Fundstelle / Aufgabe:** Startseite → „„Hochwasser Test“ öffnen“ → „Hier ist
etwas schiefgelaufen“. Code: `src/app/fehlerfaenger.tsx` Z. 92–127.

**Beobachtung:** Die Seite ist freundlich und eindeutig („Deine Daten liegen
weiter auf diesem Gerät — durch den Fehler wurde nichts gelöscht“). Sie bietet
„Neu laden“, „Zur Startseite“, „Daten sichern“, „Technische Angabe (für die
Fehlersuche)“ und „Hilft nichts? Alle Daten löschen“. „Zur Startseite“ führt
auf die Startseite, die die Sammlung wie vorher zeigt; beim erneuten Öffnen
stürzt sie wieder. Dass die Startseite die Sammlung einzeln löschen kann
(„Löschen…“, „Papierkorb“), sagt die Fehlerseite nicht. „Technische Angabe …“
und „Hilft nichts? …“ stehen ohne Pfeil und ohne Rahmen da und sehen wie
Fließtext aus; aufgeklappt zeigt das Erste nur den englischen Programmtext
(„Cannot read properties of undefined (reading ‘organisation’)“).

**Erwartung der Rolle:** Nach „Neu laden“ erwarte ich, dass es geht. Wenn nicht,
erwarte ich als nächsten Schritt „diese eine Sammlung sichern oder löschen“, nicht
„alles löschen“.

**Folge:** Bei einem Datenfehler in einer Sammlung steht der Helfer vor einer
Schleife und als letztem sichtbarem Mittel dem Löschen der gesamten App-Daten
(mit Haken und Rückfrage, aber ohne den milderen Weg). Die zwei aufklappbaren
Stellen übersieht er.

**Empfehlung:** Nach dem Absturz in einer Sammlung auf der Fehlerseite sagen:
„Ein Einsatz konnte nicht gezeigt werden. Auf der Startseite lässt er sich
löschen; vorher „Daten sichern“.“ Die beiden Aufklapper mit Pfeil und
Rahmen versehen.

**Nachprüfung:** Seed wie oben: Fehlerseite nennt den Einzelweg; „Zur
Startseite“ → „Löschen…“ am Einsatz entfernt ihn, die App läuft; die Aufklapper
sind als Bedienelemente erkennbar.

### R6-N5 [P3] Im Assistenten gibt es zwei Ansicht-Schalter mit demselben Namen, beide lassen sich gleichzeitig öffnen (Rest von R5-N4)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Assistent, 360 × 640: Kopf „Ansicht: Standard ▾“
(`.anzeige-klappe`) und Fußleiste „◐ Ansicht“ (`.anzeige-leiste-knopf`, beide
`aria-label` „Ansicht: Standard – ändern“). Code: `src/app/anzeige-schalter.tsx`.

**Beobachtung:** Beide öffnen dieselbe Wahl (Standard, Feld, Dunkel, Nacht).
Nach dem Tipp auf beide stehen die Wahl im Kopf (schiebt Leiste und Schritte um
rund 125 px nach unten) und die Wahl über der Fußleiste gleichzeitig offen.
Die Namen sind jetzt einheitlich („Ansicht“, R5-N4 hält); die Doppelung bleibt.

**Erwartung der Rolle:** Ein Schalter, eine Stelle.

**Folge:** Gering: Nach dem Tipp auf den Kopf ist die Seite verschoben, wer
dann die Fußleiste nutzt, sieht zwei Wahlen.

**Empfehlung:** Beim Öffnen des einen den anderen schließen.

**Nachprüfung:** Beide nacheinander antippen: immer nur eine Wahl offen.

### R6-N6 [P3] „⇑“ ist in der Kartenansicht der Personen unerklärt (Rest von R5-N8)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Schritt 3, „Alle Angaben (Karten)“ (Voreinstellung),
Knöpfe „▲ ▼ ⇑“ je Person. Der Absatz darunter erklärt „▲/▼“, nicht „⇑“.

**Beobachtung:** Die Kurz-Liste trägt den Satz „„⇑“ setzt eine Person ganz nach
oben — und damit an diese Stelle.“ (R5-N8 behoben). Die Kartenansicht, die jeder
zuerst sieht, trägt ihn nicht.

**Erwartung der Rolle:** Die Erklärung steht dort, wo der Knopf steht.

**Folge:** Gering: Der Helfer lässt „⇑“ aus oder tippt es zum Probieren; es ist
umkehrbar.

**Empfehlung:** Den Satz in beide Ansichten.

**Nachprüfung:** Schritt 3, Karten: Satz über „⇑“ vorhanden.

### R6-N7 [P3] Ein Tipp auf einen „offenen Punkt“ der Übersicht springt an den Anfang des Schritts, der Hinweis liegt unter dem Bildrand (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet (DRK `bhp25-behandlung-rot`).

**Fundstelle / Aufgabe:** Übersicht „⚠ 2 offene Punkte für die Weitergabe —
antippen zum Beheben“ → Tipp auf „Alle 8 Personen stehen auf Geschlecht
„männlich“ …“ bzw. „Sitzplätze: 3 …“.

**Beobachtung:** Der erste Tipp führt zu „3. Personal“, der zweite zu „4.
Fahrzeuge“, jeweils an den Schrittanfang. Die Warnung liegt unter „Stärke
(abgeleitet)“ gerade am unteren Bildrand; das Fahrzeugfeld „Sitzplätze“ trägt
den Platzhalter „3 (Richtwert,“, der abgeschnitten ist. Die Stelle selbst
(Geschlecht der Personen, Sitzplatz-Feld) ist nicht markiert.

**Erwartung der Rolle:** „Antippen zum Beheben“ bringt mich an das Feld.

**Folge:** Ein bis zwei Wisch-Bewegungen und die Frage, welches Feld gemeint ist.

**Empfehlung:** Zum betroffenen Feld scrollen und es kurz hervorheben.

**Nachprüfung:** Tipp auf den Punkt: Das Feld steht im Bild.

### R6-N8 [P3] Bei Bögen anderer Organisationen wiederholt die Übersicht den Einheitstyp als Zeilenbeschriftung (Rest von R5-N6)

**Priorität:** P3

**Kennzeichnung:** beobachtet (DRK `bhp25-behandlung-rot`, ASB, BBK, Bayern).

**Fundstelle / Aufgabe:** Übersicht → Block „Einheit“.

**Beobachtung:** Der Block zeigt „Einheitstyp: Behandlung Kat. ROT (BHP 25)“ und
darunter die Zeile „Behandlung Kat. ROT (BHP 25) | Buchenrode“, in der der Typ
als Beschriftung der Ebene steht. Beim ASB steht „Sanitätsgruppe (Einsatzeinheit)
| Rheindorf“. Die Titelzeile („DRK · Behandlung Kat. ROT (BHP 25) · Buchenrode“)
und die Karten der Sammlung sind in Ordnung (R5-N6 dort behoben).

**Erwartung der Rolle:** Eine Zeile je Angabe, die erste Ebene nach ihrer Rolle
benannt.

**Folge:** Gering: Der Neuling hält die Wiederholung für eine zweite Einheit.

**Empfehlung:** Die erste Ebene ohne Beschriftung oder als „Standort“ zeigen,
wenn Beschriftung und Typ gleich lauten.

**Nachprüfung:** DRK-Bogen: Block „Einheit“ nennt den Typ einmal.

### R6-N9 [P3] „1 brauchen eine andere Mitfahrgelegenheit“ (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet (ASB `einsatzeinheit-sanitaetsgruppe`).

**Fundstelle / Aufgabe:** Übersicht, offener Punkt. Code: `src/app/hilfen.ts`
Z. 653.

**Beobachtung:** „Sitzplätze: 9 in den erfassten Fahrzeugen für 10 Personen — 1
brauchen eine andere Mitfahrgelegenheit“. Der Satz ist sonst klar und als
Feststellung formuliert.

**Erwartung der Rolle:** „1 braucht …“.

**Folge:** Keine über den Stil hinaus; ein Fehler im Wortlaut senkt das
Vertrauen in die Rechnung.

**Empfehlung:** Einzahl und Mehrzahl unterscheiden.

**Nachprüfung:** Einheit mit genau einer Person ohne Sitz: „1 braucht …“.

### R6-N10 [P3] Die Quittung des Blanko-Vordrucks schiebt den eben getippten Knopf nach unten (Risiko)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Verschiebung gemessen: Knopf bei y = 568, danach
unter der Quittung); die Folge für einen zweiten Tipp ist Risiko.

**Fundstelle / Aufgabe:** Startseite, „Leeren Vordruck drucken (PDF)“.

**Beobachtung:** Die Quittung „Blanko-Vordruck erzeugt (2 Seiten A4, zum
Ausfüllen mit der Hand).“ erscheint über der Karte „Meinen Bogen ausfüllen“ und
schiebt alles um rund 66 px nach unten. Der Download beginnt (Datei
`einheiten-erfassungsbogen-blanko.pdf`, 2 Seiten). An der alten Stelle liegt
jetzt „Aus Datei laden…“.

**Erwartung der Rolle:** Nach dem Tipp bleibt der Knopf, wo er war.

**Folge:** Ein Doppeltipp mit Handschuh öffnet die Dateiwahl. Folgenlos, aber
verwirrend.

**Empfehlung:** Quittung in der Nähe des Knopfs ohne Verschiebung (reservierter
Platz) oder als Toast.

**Nachprüfung:** Tipp auf „Leeren Vordruck drucken (PDF)“: Der Knopf bleibt
stehen.

### R6-N11 [P3] Einzelne Beschriftungen sagen etwas anderes, als sie tun (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** (a) Startseite, Entwurfskarte „Verwerfen“; (b) Warnung
„Geräteuhr prüfen“ und Rückfrage „Datum stimmt — jetzt aufräumen?“; (c)
Einsatzseite „Excel-Liste (Format „Oldenburg“)“; (d) Rückfrage „Lang, Sabine
entfernen?“.

**Beobachtung:**
- (a) Der Knopf heißt „Verwerfen“, die Rückfrage „Angefangenen Bogen
  verwerfen?“ sagt „wird geschlossen. Der Stand bleibt … unter „Zuletzt
  geschlossenen Bogen zurückholen“ erreichbar.“ Ein Wort für zwei Dinge
  (verwerfen / schließen); die Folge ist harmlos, der Text beruhigt, der Knopf
  droht.
- (b) „aufräumen“ meint hier das endgültige Löschen („nicht im Papierkorb“);
  das Fenster sagt es im Text, die Überschrift nicht. „1 Sammlung“ wird nicht
  mit Namen genannt; die Warnung hat keinen Weg zur Sammlung (nur „Abbrechen“
  und „Sammlung öffnen“ im Text).
- (c) „Oldenburg“ steht auf der Einsatzseite als einziges Vorkommen des Worts,
  ohne sichtbare Erklärung (R5-N7 nennt sie unter dem Knopf; in meinem Lauf
  war dort nichts zu sehen).
- (d) „Die erfassten Angaben dieser Person gehen verloren“ — und gleich danach
  die Quittung „Entfernt: Lang, Sabine“ mit „Rückgängig“.

**Erwartung der Rolle:** Wort und Wirkung stimmen überein; „gehen verloren“
heißt, es gibt kein Zurück.

**Folge:** Vermeidbare Unsicherheit, kein Datenverlust.

**Empfehlung:** (a) „Bogen schließen“ wie in der Übersicht; (b) „Datum stimmt —
jetzt endgültig löschen?“ und die Sammlung mit Namen; (c) die Beschriftung
einmal erklären („für das Meldeformular der Stabsstelle Oldenburg“, falls das
zutrifft — Annahme); (d) „Die Angaben werden entfernt; „Rückgängig“ holt sie
zurück.“

**Nachprüfung:** Texte lesen; der Neuling kann Folgen aus Knopf und Überschrift
ableiten.

## Verweise auf Befunde in anderen Runde-6-Berichten

Diese Stellen habe ich selbst gesehen und zähle sie hier nicht:

- **Rückfrage verwirft sich selbst (R6-N1):** `arbeitsablauf.md` führt den
  Befund-Kandidaten W1 (Kaltstart über Link, „Einheit ist bereits gemeldet“
  wird nach rund 240 ms verworfen, aus der Sammlung geht es). Gleiches
  Verhalten; die Ursache (80-ms-Rückkehr der ersten Rückfrage) und den Weg
  über „Wohin damit?“ habe ich hier ergänzt.
- **„Bedarf:“ bricht mitten im Wort (Bed / arf:) und klebt an „Verpflegung …“:**
  `fehler-und-wiederanlauf.md`, `mobile-ui.md`.
- **„⚠ Anderer Einsatz?“:** R6-K7 ([fuehrungssicht.md](fuehrungssicht.md)). In
  meinem Lauf: frische Sammlung mit Namen, drei Bögen (Crailsheim, Radolfzell,
  DRK) ohne Marke; in der Sammlung mit fünf gemischten Bögen trugen drei die
  Marke, die zum „Hochwasser“-Namen nicht passten.
- **Import-Quittung „Einsatz importieren…“:** R6-K6. Mein Lauf: „Einsatz
  „Hochwasser Test“: keine neue Einheit. Jetzt 5 Einheiten, davon 5 anwesend.
  Stand der Datei: letzte Meldung …“ (verständlich).
- **Beiblatt-Hinweis des Blanko mit 6,5 pt:** R6-A4 ([analog-first.md](analog-first.md)).
- **Ansicht-Wahl: Zusatzzeile unter 4,5:1:** R6-L5 ([nacht-und-sicht.md](nacht-und-sicht.md)).

## Bestätigtes

- **Startseite:** Zweck, zwei Rollen, „So funktioniert’s“, Ladefortschritt und
  danach „Jetzt offline bereit“; mit Entwurf steht die Karte mit „Fortsetzen /
  Verwerfen“ vorn, die Rückfrage vor „Verwerfen“ nennt den Rückholplatz.
- **Wizard:** Sechs Schritte mit Häkchen und „offen“ je Schritt; Schritt 1 bietet
  Vorlagen; Schritt 2 erklärt „Zeitraum bis“ samt Folge („Zeitraum vorbei“);
  Schritt 3 weist auf die Papierreihenfolge hin; die Wahl „Nur Stärke
  (Meldekopf-Schnellerfassung)“ ist erklärt; Schritt 5 nennt Verpflegung,
  Betriebsstoff, Unterbringung, Ruhezeit. „Weiter“ blockiert nicht, die
  Warnungen stehen sichtbar.
- **Übersicht und Übergabe:** „Bogen übergeben…“ führt zu „QR-Code im Vollbild
  zeigen“, „PDF erzeugen“ und „Weitere Formate“. Die Zeile „Unterbringung:
  8 männl. / …“ statt „Geschlecht:“ ist gewollt (nur bei angeforderter
  Unterbringung) und lesbar.
- **Geräteuhr:** Warnung nennt zwei Daten, „bis du antwortest, löscht und
  anonymisiert die App nichts“, nennt „1 Sammlung und die Namen im eigenen Bogen“
  und fragt vor dem Löschen noch einmal („Datum stimmt — jetzt aufräumen?“,
  „Ja, Datum stimmt — löschen“ rot, „Abbrechen“). „Uhr korrigieren“ erklärt
  den Weg (Geräteeinstellungen, „Neu prüfen“).
- **Fehlerseite:** Alltagssprache, „Deine Daten liegen weiter auf diesem Gerät“,
  vier Wege, Löschen hinter Haken und Knopf „Endgültig löschen“.
- **Rückfragen in der Sammlung:** „Bögen einlesen…“ bei Dublette: „0 Bögen
  aufgenommen, 1 bereits vorhanden.“; Folgemeldung mit „Folgemeldung 13:29:
  ▼ Stärke 11 → 9 (−2)“ und Marke „neue Fassung“. „Wohin damit?“ nennt
  Stärke, die Sammlung, die Folge für den angefangenen Bogen und den
  Rückholplatz.
- **Papier-Abgleich:** Beschriftungen „Nr. laut Blatt (leer = App vergibt)“,
  „Eingetroffen am (leer = Zeit des Einlesens, nicht bestätigt)“, „Zug (leer =
  ohne)“; doppelte Nummern werden mit beiden Namen abgewiesen, ohne etwas zu
  übernehmen.
- **Quittungen mit „Rückgängig“:** „Entfernt: Lang, Sabine — Rückgängig ×“ (Person)
  und „Einsatz … in den Papierkorb gelegt (30 Tage rückholbar). Rückgängig“ mit
  Link „Papierkorb Einsätze (1)“; „Rückgängig“ holt den Einsatz mit Stand zurück.
- **Neue Beschriftungen:** „Ansicht“ (Kopf, Fußleiste, Sammlungsseite) und
  „Hinweise“ (Karte „Hinweise: Verpflegung 4 statt Stärke 3“) lesen sich ohne
  Erklärung.
- **Blanko-Vordruck:** Quittung „2 Seiten A4, zum Ausfüllen mit der Hand“; die
  Datei hat zwei Seiten mit Feldern für Meldekopf-Nr., Zug, Einheit, Fahrzeuge,
  Personal, Sofortbedarf.
- **Andere Organisationen:** Feuerwehr, DLRG, DRK, Bundeswehr, ASB, BBK und
  Bayern öffnen ohne Fehler; die Titelzeile nennt Organisation, Typ und Ort ohne
  Doppelung („DRK · Behandlung Kat. ROT (BHP 25) · Buchenrode“); die Kopffarbe
  folgt der Organisation (DRK rot).
- **Einsatz importieren in vorhandene Sammlung:** meldet „keine neue Einheit“
  und die Summen, ohne etwas zu verdoppeln.

## Abgleich mit Runde 5

Grundlage: [../runde-5/neuer-nutzer.md](../runde-5/neuer-nutzer.md) mit „Stand
der Behebung“ und [../runde-5/README.md](../runde-5/README.md).

| Runde-5-Befund | Stand laut Runde 5 | Bewertung Runde 6 | Beobachtung |
| --- | --- | --- | --- |
| R5-N1 „⚠ Anderer Einsatz?“ bei frischer Sammlung (P2) | behoben | hält | Frische Sammlung „Hochwasser Weser“ nur mit Namen: nach dem 1., 2. und 3. Bogen (Crailsheim, Radolfzell, DRK) keine Marke. Neue Seite: Verschwinden der Marke (R6-K7). |
| R5-N2 Rat „Zeitraum bis“ gegen „Zeitraum vorbei“ (P3) | behoben (Wortlaut) | hält | Schritt 2 nennt die Folge („… sonst steht die Einheit am Folgetag beim Meldekopf als „Zeitraum vorbei““). |
| R5-N3 Neuladen springt in halbfertige Aufnahme (P3) | behoben | hält (nur gestreift) | Nach „Bogen öffnen“, „‹ Startseite“ und Neuladen steht die Startseite mit der Karte „Fortsetzen / Verwerfen“. Eine fremde Erfassung mit Marke `fremd.startseite` habe ich nicht gezielt nachgestellt. |
| R5-N4 Ansichtsschalter heißt dreimal anders (P3) | behoben | hält mit Rest | Name überall „Ansicht“. Im Assistenten bleiben zwei Schalter (Kopf und Fußleiste), beide gleichzeitig offen möglich (R6-N5). |
| R5-N5 „Rückfrage“ meint Hinweisliste (P3) | behoben | hält | An der Karte „Hinweise: Verpflegung 4 statt Stärke 3“; „Rückfrage“ blieb den Dialogen. |
| R5-N6 Namensteile doppelt (P3) | behoben | hält teilweise | Titelzeilen und Karten ohne Doppelung. In der Übersicht (Block „Einheit“) steht der Einheitstyp bei DRK, ASB, BBK zweimal (R6-N8). |
| R5-N7 Fachwörter ohne Erklärung (P3) | teilweise behoben | hält teilweise | „Nur Stärke (Meldekopf-Schnellerfassung)“ erklärt. „Format „Oldenburg““ in meinem Lauf ohne sichtbare Erklärung, Fachwörter und Verben mit Doppelsinn (R6-N11). |
| R5-N8 „⇑“ nur im Tooltip (P3) | behoben | hält teilweise | In der Kurz-Liste steht der Satz; in der Kartenansicht (Voreinstellung) nicht (R6-N6). |
| R5-N9 „Lage vom Papier abgleichen…“ zweimal (P3) | behoben | hält (nicht gesondert nachgestellt) | Mit offenem Bericht nicht nachgestellt; ohne Bericht trägt die Karte den Knopf einmal. |
| R5-S5 Zurück-Geste bei Rückfrage auf der ersten Ansicht (Verweis) | behoben | hält für eine Rückfrage, verkehrt sich bei der zweiten | „Zurück“ schließt „Angefangenen Bogen verwerfen?“ und die App bleibt. Dieselbe Maßnahme (eigener Verlaufseintrag, Rückkehr nach 80 ms) lässt die zweite von zwei aufeinanderfolgenden Rückfragen von selbst zugehen (R6-N1). |
| R5-A1 Papier-Abgleich schreibt die Einlesezeit nicht mehr als Eintreffzeit fort (P1) | behoben | hält | „Eingetroffen am“ ist leer vorbelegt; ohne Zeit bleiben Marke „vom Papier, Zeiten prüfen“ und Hinweisfenster „Eintreffzeit nicht bestätigt“ stehen, wie beschrieben. Der Text der Karte „… ohne Zug, Auftrag und Nummer“ passt danach nicht mehr (R6-N3). |
| R4-A1 „Nr. laut Blatt“ im Abgleich (Verweis) | behoben, mit Grenze | hält | Feld beschriftet, doppelte Nummern mit beiden Namen abgewiesen, Hinweis „Nummern neu vergeben“ bei leeren Feldern; die Liste ist nicht nach Nr. geordnet (R6-N3). |
| R5-D1 Uhrsprung gilt nach einem Tag als bestätigt (P1, Verweis) | behoben | hält | Warnung bleibt, zweite Rückfrage vor dem Löschen, Sammlungsanzahl genannt. |
| R5-E1 Fehlerfänger statt weißer App (P1, Verweis) | behoben | hält mit Rest | Seite erscheint, nennt die Daten, bietet vier Wege; bei Fehler in einer Sammlung führt „Neu laden“ wieder dorthin und der Einzelweg fehlt (R6-N4). |
| Quittungen mit „Rückgängig“ (aus R2-G1/R5-E3, Verweis) | behoben | hält | Person entfernen und Einsatz in den Papierkorb: sichtbare Quittung, „Rückgängig“ wirkt. Das Zusammenspiel zweier „Rückgängig“ nach „Ja — als neue Fassung“ (R5-E3) habe ich wegen R6-N1 nicht von der Startseite aus erreicht; in der Sammlung nicht gezielt geprüft. |

Verkehrt hat sich nichts im Ganzen; die Verschiebung ist R5-S5 → R6-N1: Die
Behebung der Zurück-Geste auf der ersten Ansicht trägt (wahrscheinlich) die
Folgerückfrage mit weg.

Bilanz: Von den neun Runde-5-Befunden meiner Rolle halten R5-N1, R5-N2, R5-N3
und R5-N5, vier halten teilweise (R5-N4, R5-N6, R5-N7, R5-N8), einer ist nicht
gesondert nachgestellt (R5-N9). Neu sind ein P1, drei P2 und sieben P3 (R6-N1 bis
R6-N11).

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (eigener Bogen, Meldekopf in der Sammlung,
  Papier-Abgleich ja; Nachmeldung über die Startseite nein).
- **Fremde Hilfe nötig:** nein für den eigenen Bogen; ja, sobald eine
  Folgemeldung von der Startseite aus ankommen soll und „nicht aufgenommen“
  ohne Grund erscheint.
- **Größtes Missverständnis:** „Lage noch nicht abgeglichen“ nach getanem
  Abgleich liest der Helfer als „hat nicht geklappt“ (R6-N3).
- **Größtes Einsatzrisiko:** Die Nachmeldung einer schon gemeldeten Einheit über
  Datei, Link oder Scan von der Startseite wird von der App selbst abgebrochen,
  und die Lage zeigt weiter den alten Stand (R6-N1).
- **Top-Priorität für die nächste Iteration:** Folgerückfragen nach „Wohin damit?“
  dürfen sich nicht selbst schließen (R6-N1).

## Stand der Behebung

Stand 23.10.2026, auf demselben Zweig mit Typprüfung, Unit-Tests, Verhaltenstests (137 von 137 Szenarien) und, wo es sich messen ließ, Nachmessung im Browser (Playwright, Produktionsbuild). 8 behoben, 3 teilweise, 0 offen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R6-N1 | behoben | Eine Folgerückfrage übernimmt den Verlaufseintrag der vorigen, statt von deren verzögerter Rückkehr geschlossen zu werden (`modal-overlay.ts`). Unit-Test mit dem Ablauf Rückfrage → Folgerückfrage. |
| R6-N2 | teilweise | Die Quittung des Stapelimports nennt die mögliche Doppelung („ähnelt …, beide zählen getrennt, Zusammenführen an der Karte“). Ein Tipp zum Zusammenführen und die Marke an der Karte fehlen. |
| R6-N3 | teilweise | Ein Hinweisfenster mit den Namen statt zwei; die Karte heißt nach dem Abgleich „Abgeglichen bis auf die Eintreffzeit“ mit dem Knopf „Eintreffzeiten nachtragen…“. „Nach Nr. sortieren“ fehlt. |
| R6-N4 | behoben | Die Fehlerseite nennt den Einzelweg („Löschen…“ auf der Startseite), die Aufklapper tragen Rahmen und Pfeil. Der Bestand wird zudem beim Lesen geprüft (R6-E1). |
| R6-N5 | behoben | Öffnet eine der beiden Ansicht-Wahlen, schließt die andere (`anzeige-schalter.tsx`). |
| R6-N6 | behoben | Der Satz zu „⇑“ steht auch in der Kartenansicht. |
| R6-N7 | behoben | Die offenen Punkte „Alle Personen männlich“ und „Sitzplätze“ springen zum Feld (`feld-geschlecht-0`, `feld-sitzplaetze-0`). |
| R6-N8 | behoben | Heißt die erste Ebene wie der Einheitstyp, steht „Standort“ als Beschriftung. |
| R6-N9 | behoben | „1 braucht …“ statt „1 brauchen …“. |
| R6-N10 | behoben | Die Quittung steht unter dem Knopf, nicht über der Karte; nichts rückt nach. |
| R6-N11 | teilweise | (b) Rückfrage heißt „… jetzt endgültig löschen?“ und nennt die Sammlungen (R6-D3), (d) die Rückfrage zu „Person entfernen“ nennt „Rückgängig“. (a) „Verwerfen“ und (c) die Erklärung von „Oldenburg“ bleiben (der Knopf hat einen Tooltip). |
