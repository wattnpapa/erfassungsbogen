# Audit „Helfer im Feld", Runde 2 (Feldtauglichkeit)

Stand: 28.09.2026 · Prüfer: Rollenaudit `thw-field-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/adoring-sagan-9vnriv`, Commit 354209b.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung des
[Feldtauglichkeits-Audits](../../feldtauglichkeit-audit.md) vom 17.09.2026
und der Rollenaudits vom 27.09.2026.

## Prüfaufbau

Chromium (Playwright, `/opt/pw-browsers/chromium`), Viewport 360 × 640 px,
`isMobile`/`hasTouch`, Locale de-DE, ohne Kamera. Bedient wurde mit
`tap()`, nicht mit Klicks, jeder Lauf mit frischem Browserzustand. Getestet
habe ich zuerst ohne Blick in frühere Berichte. Den Runde-1-Bericht, die
Tabelle „Stand der Behebung" und den Runde-2-Bericht
[neuer-nutzer.md](neuer-nutzer.md) habe ich erst danach gelesen. Für die
Meldekopf-Szenarien habe ich fünf Beispielbögen aus `examples/thw/` über
„Bögen einlesen…" als Dateien geladen, also so, wie es ein Nutzer tun würde,
und keine `localStorage`-Seeds verwendet.

Rolle: Helfer einer Bergungsgruppe, praktisch erfahren, bedient die App
selten, steht im Bereitstellungsraum mit dem Telefon in einer Hand und wird
zwischendurch gerufen. Er kennt den Papierbogen und erwartet, dass er ihn der
Reihe nach ausfüllt, am Ende etwas zum Vorzeigen hat und nach einer
Unterbrechung dort weitermacht, wo er war.

Szenarien, jeweils vom natürlichen Einstieg aus:

1. **Eigenen Bogen melden:** „Neuen Bogen erstellen" → Einheitstyp „Berg…"
   → „B Bergungsgruppe" → OV „Ulm" aus den Vorschlägen → Ort/Auftrag,
   „Einsatzbeginn eintragen" → Personal (Karten, Tabelle, „Namen
   einfügen…") → Fahrzeuge → Sofortbedarf → Übersicht → „Bogen übergeben…"
   → „QR-Code im Vollbild zeigen". Abgeschlossen: **mit Schwierigkeiten**.
2. **Lücke beheben:** In der Übersicht den offenen Punkt „Fahrzeug 1 hat
   noch kein Kennzeichen." antippen und das Kennzeichen eintippen.
   Abgeschlossen: **mit Schwierigkeiten** (R2-H2).
3. **Unterbrechung:** Mitten in Schritt 3 neu laden, einmal online, einmal
   offline (Service Worker aktiv). Danach „Fortsetzen", „Verwerfen" und
   „Neuer Bogen" mit Rückholung. Abgeschlossen: **ja, mit Suchen** (R2-H3).
4. **Fehlgriffe und Rückwege:** Geräte-Zurück im Assistenten und im
   QR-Vollbild, Person mit Namen entfernen, „Weiter" ohne Eingaben bis zur
   Übersicht. Abgeschlossen: **ja**, mit Befunden (R2-H5).
5. **Meldekopf:** „Neue Einsatz-Sammlung…" (Art „Einsatz" und „Übung") →
   fünf Bögen einlesen → Summen lesen → „Abrücken" → „Entfernen";
   außerdem „Einheit schnell erfassen (nur Stärke)…" mit den −/+-Zählern
   und „In Einsatz aufnehmen…". Abgeschlossen: **ja**, mit Befund R2-H4.
6. **Feld und Nacht:** Themen „Feld" und „Nacht" auf Assistent und
   Übersicht; PDF-Vorschau bei sechsfach gedrosselter CPU.
   Abgeschlossen: **ja**.

Nicht prüfbar und deshalb als *nicht geprüft* markiert: echte Handschuhe,
nasse Finger, Sonnenlicht und Dunkelheit am echten Display, Kamera-Scan,
USB-Handscanner, Bildschirmtastatur, native Datums- und Auswahllisten von
Android/iOS, die nativen Builds und Ladezeiten auf echter Hardware. Die
Datumsfelder zeigt headless Chromium unabhängig von der Locale im
US-Format; was dort zu sehen ist, werte ich nur als Hinweis (R2-H8).

## Urteil

Das Fundament hält. Offline-Neustart, Autospeicher-Zeile („✓ automatisch
gespeichert · 11:00 Uhr — bleibt auf diesem Gerät"), Entwurfsrettung,
Rückholung verworfener Bögen, Rückfragen mit Namen und die Trennung von
Übungs- und Einsatzmeldungen am Meldekopf funktionieren so, wie ein Helfer
es erwartet. Die Stärke-Zähler der Schnellerfassung (52 × 52 px) sind ohne
Tastatur bedienbar.

Die Schwäche liegt jetzt in der **Blickführung zwischen den Bildschirmen**.
Nach „Weiter →" beginnt der nächste Schritt dort, wo der vorige aufgehört
hat, also mitten im Formular oder an seinem Ende. Die Überschrift und die
ersten Felder liegen dann über dem Bildrand (R2-H1). Dasselbe Muster zeigt
sich beim Neuladen (R2-H3), beim Sprung aus einem offenen Punkt (R2-H2) und
bei der Abrück-Quittung am Meldekopf (R2-H4). Jede dieser Rückmeldungen ist
vorhanden, sie steht nur nicht dort, wo der Daumen gerade ist. Ein Helfer,
der nur auf den sichtbaren Ausschnitt schaut, übersieht Felder, sucht den
Wiedereinstieg oder bemerkt ein „Rückgängig" nicht.

Die Aufgabe „eigenen Bogen melden" gelingt ohne fremde Hilfe, kostet aber
Scrollen und Suchen. Der Helfer erkennt am Ende sicher, dass der Bogen fertig
ist: Die Übersicht zählt die offenen Punkte auf, und der Übergabe-Dialog
wiederholt sie.

## Befunde

### R2-H1 [P1] Nach „Weiter →" öffnet der nächste Schritt mitten im Formular (neu)

**Priorität:** P1

**Nachweis:** beobachtet, gemessen, in mehreren Läufen reproduziert.

**Fundstelle / Aufgabe:** Assistent, Schrittwechsel über die untere Leiste
„Weiter →", Szenario 1.

**Beobachtung:** Beim Wechsel bleibt die Scrollposition des vorigen
Schritts stehen, begrenzt nur durch die Länge der neuen Seite. Gemessen
nach dem Ausfüllen von Schritt 1: Beim Tippen auf „Weiter" stand die Seite
bei 849 px (das OV-Namensfeld war hochgerollt). Danach:

| Schritt nach „Weiter" | Scrollposition | Oberkante der Schrittüberschrift |
| --- | --- | --- |
| 2. Einsatz | 694 px (Seitenende) | −326 px |
| 3. Personal | 849 px | −481 px |
| 4. Fahrzeuge | 849 px | −481 px |
| 5. Sofortbedarf | 210 px | +158 px (kurze Seite) |

Im ersten Bild von Schritt 2 stehen „Einsatzbeginn eintragen", „Einsatzende
eintragen", der gelbe Hinweis „⚠ Ort/Auftrag ist noch leer." und „Dies ist
eine Übung". Das Feld „Einsatzort / Auftrag" und die Zeitraumfelder liegen
über dem Bildrand. In Schritt 3 fehlen die Überschrift und die Wahl
„Personal vollständig erfassen / Nur Stärke", in Schritt 4 das Feld
„Fahrzeugtyp" des ersten Fahrzeugs. Wer Schritt 1 ohne Scrollen verlässt,
landet korrekt oben, bei 343 px mit der Überschrift an der Oberkante.

**Reaktion des Helfers:** „Weiter" heißt: neue Seite, oben anfangen. Er
liest, was er sieht, beantwortet es und tippt wieder „Weiter". Den gelben
Hinweis „Ort/Auftrag ist noch leer" sieht er, das Feld dazu nicht. Er
sucht es unter dem Hinweis.

**Problem:** Der sichtbare Ausschnitt passt nicht zur Schrittlogik. Der
Anfang jedes Schritts, meist mit den wichtigsten Feldern, wird übersprungen,
ohne dass es auffällt, denn die Seite sieht vollständig aus.

**Auswirkung im Einsatz:** Felder wie Ort/Auftrag, Zeitraum, die
Personal-Betriebsart oder der Fahrzeugtyp bleiben leer oder falsch. Die
Übersicht fängt einen Teil davon als offene Punkte ab. Dann muss der Helfer
aber zurückspringen, also genau die Arbeit machen, die der Assistent ihm
ersparen sollte. Unter Zeitdruck wird der Bogen mit Lücken übergeben.

**Empfehlung:** Bei jedem Schrittwechsel (Weiter, Zurück, Tippen in der
Schrittleiste) an den Anfang des neuen Schritts springen, sodass die
Schrittüberschrift direkt unter dem Kopf steht. Den Fokus auf die
Überschrift setzen, nicht auf das erste Feld, damit keine Tastatur
aufspringt.

**Nachprüfung:** In Schritt 1 bis zum Namensfeld scrollen, Namen wählen,
„Weiter →". In Schritt 2, 3 und 4 muss die Schrittüberschrift ohne
Scrollen im Bild stehen. Dasselbe gilt für „← Zurück".

### R2-H2 [P2] Offener Punkt „antippen zum Beheben" springt hin, setzt aber den Cursor nicht (neu)

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Gesamtübersicht → „⚠ 6 offene Punkte für die
Weitergabe — antippen zum Beheben:" → „Fahrzeug 1 hat noch kein
Kennzeichen." (Szenario 2).

**Beobachtung:** Der Sprung führt richtig auf Schritt 4. Das
Kennzeichenfeld steht aber genau an der Oberkante (−4 px), seine
Beschriftung „Kennzeichen" liegt darüber und ist nicht zu sehen. Der Fokus
bleibt auf der Seite (`document.activeElement` = `BODY`). Direkt danach
eingetippter Text („UL-THW 123") landete nirgends und stand danach nicht im
Entwurf. Die Zeilen „Fahrzeug 1/2 hat noch kein Kennzeichen." sind in der
Übersicht 30 px hoch, im Übergabe-Dialog 51 px.

**Reaktion des Helfers:** „Antippen zum Beheben" heißt für ihn: Ich tippe,
und dann tippe ich das Kennzeichen ein. Er sieht ein leeres Feld mit
blassem Beispieltext „OL-FW 2041 / THW-84397" ohne Beschriftung und weiß
nicht sicher, ob es das richtige ist.

**Problem:** Der Sprung endet einen Schritt vor dem Ziel. Das Feld muss
noch gefunden, erkannt und angetippt werden, und das an der Bildoberkante,
also am weitesten vom Daumen entfernt.

**Auswirkung im Einsatz:** Zusätzlicher Griff, und die Eingabe geht beim
ersten Versuch ins Leere. Bei „Keine telefonische Erreichbarkeit" oder
„7 Personenkarten ohne Angaben" ist das Ziel noch weniger eindeutig.

**Empfehlung:** Beim Sprung das betroffene Feld samt Beschriftung
mit etwas Abstand unter dem Kopf platzieren und kurz hervorheben. Bei
Textfeldern den Fokus setzen, wenn die Tastatur dort erwünscht ist. Die
Punkte in der Übersicht auf 44 px Zielhöhe bringen, wie im Dialog.

**Nachprüfung:** Offenen Punkt „Fahrzeug 1 hat noch kein Kennzeichen."
antippen: Die Beschriftung „Kennzeichen" muss sichtbar sein, und direkt
eingetippter Text muss im Feld landen.

### R2-H3 [P2] Nach dem Neuladen steht die Startseite an der alten Scrollposition, „Fortsetzen" liegt 1 100 px darüber (neu)

**Priorität:** P2

**Nachweis:** beobachtet, online und offline gleich.

**Fundstelle / Aufgabe:** Szenario 3: In Schritt 3 „Personal" auf 1 500 px
gescrollt, Seite neu geladen (steht für: Browser vom System beendet, App
neu geöffnet, Tab neu geladen).

**Beobachtung:** Die App öffnet die Startseite, nicht den Assistenten.
Der Browser stellt dabei die alte Scrollposition wieder her (1 560 px). Im
ersten Bild steht „Absender für übergebene Bögen" und „So funktioniert’s".
Die Karte mit „THW Ulm Bergungsgruppe · Stärke 0 / 2 / 7 / 9 ·
gespeichert 11:05 Uhr", „Fortsetzen" und „Verwerfen" sowie der Hinweis
„Entwurf … wiederhergestellt." liegen 1 103 px über dem Bildrand. Nach
„Fortsetzen" öffnet die Gesamtübersicht, nicht Schritt 3 (siehe R2-N7).

**Reaktion des Helfers:** „Wo ist mein Bogen? Ist er weg?" Er sieht eine
Erklärseite und keinen Hinweis auf seinen Entwurf.

**Problem:** Die Entwurfsrettung funktioniert, aber sie ist im ersten Bild
nicht zu sehen. Ob der Bogen überlebt hat, erfährt nur, wer zufällig nach
oben scrollt.

**Auswirkung im Einsatz:** Der Helfer glaubt an einen Datenverlust und
beginnt mit „Neuen Bogen erstellen" von vorn, das liegt ebenfalls nicht im
Bild. Oder er fragt nach, statt weiterzumachen. Der eigentliche Vorteil der
App, dass nach einer Unterbrechung nichts verloren ist, kommt nicht an.

**Empfehlung:** Die Startseite nach dem Laden immer oben öffnen, jedenfalls
wenn ein Entwurf wiederhergestellt wurde. Besser: nach einer Unterbrechung
direkt den zuletzt offenen Schritt zeigen, mit dem Hinweis
„Entwurf wiederhergestellt".

**Nachprüfung:** In Schritt 3 weit nach unten scrollen, neu laden: Die
Entwurfskarte mit „Fortsetzen" muss ohne Scrollen sichtbar sein.

### R2-H4 [P2] Abrück-Quittung mit „Rückgängig" erscheint oben auf der Seite, 2 100 px außerhalb des Bilds (Wiederaufnahme von D4)

**Priorität:** P2

**Nachweis:** beobachtet, gemessen.

**Fundstelle / Aufgabe:** Einsatz-Sammlung mit fünf eingelesenen Bögen,
Karte „THW Landshut Zugtrupp Technischer Zug", Knopf „Abrücken"
(Szenario 5).

**Beobachtung:** „Abrücken" wirkt sofort, ohne Rückfrage. Die Karte wird
blass, der Name durchgestrichen, es erscheinen „abgerückt 11:07 ändern" und
„Als anwesend". Die Quittung „‚THW Landshut Zugtrupp Technischer Zug'
abgerückt 11:07 — Rückgängig" steht über den Summen am Seitenanfang: bei
Scrollposition 2 381 px auf −2 113 px, also nicht im Bild. Der Knopf
„Rückgängig" misst 74 × 30 px. Auch die Summenzeile, die von 5/39 auf
4/35 fällt, steht nicht im Bild. „Entfernen" fragt dagegen nach („Meldung
entfernen? … samt Historie").

**Reaktion des Helfers:** Er hat beim Scrollen durch die Kartenliste mit dem
Handschuh „Abrücken" erwischt, denn die Karten tragen je neun Knöpfe. Er sieht
eine blasse Karte, liest aber keine Meldung, die ihm sagt, was passiert ist
und wie er es zurücknimmt.

**Problem:** Die Rücknahme ist vorhanden, liegt aber nicht dort, wo die
Handlung passiert ist. „Als anwesend" an der Karte ist der brauchbare
Rückweg, doch sein Name sagt nicht, dass er das Abrücken zurücknimmt.

**Auswirkung im Einsatz:** Eine versehentlich abgerückte Einheit fällt aus
den Summen und aus dem Bedarf (Verpflegung, Unterbringung, Kraftstoff).
Bemerkt der Bediener es nicht, meldet er zu wenig Kräfte weiter.

**Empfehlung:** Die Quittung am unteren Bildrand einblenden, im
Daumenbereich, mit mindestens 44 px hohem „Rückgängig", und einige Sekunden
stehen lassen. Alternativ direkt an der Karte. „Als anwesend" in „Abrücken
zurücknehmen" umbenennen.

**Nachprüfung:** In einer Sammlung mit fünf Einheiten zur zweiten Karte
scrollen, „Abrücken" tippen: Quittung und „Rückgängig" müssen ohne
Scrollen sichtbar und mit einem Daumen treffbar sein.

### R2-H5 [P2] Geräte-Zurück: aus Schritt 1 raus aus der App, im QR-Vollbild einen Schritt zu weit (Wiederaufnahme von E3)

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Szenario 4, Zurück-Taste des Browsers bzw.
Android-Zurück-Geste.

**Beobachtung:**
- Assistent: Von Schritt 3 führt Zurück auf Schritt 2, dann auf Schritt 1,
  das stimmt. Das nächste Zurück verlässt die App (`about:blank`) und führt
  nicht zur Startseite. „Neuen Bogen erstellen" legt keinen eigenen Eintrag
  im Verlauf an: `history.length` bleibt 4. Aus der Einsatzansicht führt
  Zurück dagegen richtig zur Startseite.
- QR-Vollbild aus „Bogen übergeben…": Zurück schließt Vollbild *und*
  Dialog und landet auf Schritt 5 „Sofortbedarf", nicht auf der Übersicht.

**Reaktion des Helfers:** Zurück heißt: eine Ebene zurück. Den QR-Code
schließt er mit der Zurück-Geste, weil „Schließen" in der Bildmitte liegt
und er das Telefon gerade dem Meldekopf hinhält.

**Problem:** Die Zurück-Taste verhält sich an zwei Stellen anders als
erwartet: einmal aus der App hinaus, einmal einen Bildschirm zu weit.

**Auswirkung im Einsatz:** Daten gehen nicht verloren, weil der Entwurf
gespeichert ist. Der Helfer muss die App aber neu öffnen oder aus Schritt 5
zur Übersicht zurückfinden, um den Code erneut zu zeigen. Die App wirkt
dabei „abgestürzt".

**Empfehlung:** Den Einstieg in den Assistenten als eigenen Verlaufseintrag
anlegen, sodass Zurück aus Schritt 1 auf die Startseite führt. Vollbild und
Dialoge als eigene Einträge führen: Zurück schließt nur die oberste Ebene.

**Nachprüfung:** Startseite → „Neuen Bogen erstellen" → Zurück: Die
Startseite muss erscheinen. Übersicht → „Bogen übergeben…" → „QR-Code im
Vollbild zeigen" → Zurück: Der Übergabe-Dialog oder die Übersicht muss
erscheinen.

### R2-H6 [P2] Übergabe-Dialog: bei mehreren offenen Punkten liegen QR und PDF unter dem ersten Bild (neu, Folge der F2-Behebung)

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Übersicht → „Bogen übergeben…" mit sechs
offenen Punkten (Bergungsgruppe mit Sollplätzen ohne Namen und
Kennzeichen).

**Beobachtung:** Das erste Bild des Dialogs zeigt die Überschrift,
„Schließen" und die sechs gelben Punkte. „QR-Code im Vollbild zeigen"
steht bei 706 px, „PDF erzeugen" bei 782 px, beide erst nach Scrollen im
Dialog. Der Satz „Übergeben ist trotzdem möglich …" steht dazwischen am
Bildrand.

**Reaktion des Helfers:** Der Meldekopf wartet. Er tippt „Bogen
übergeben…", sieht eine gelbe Liste und keinen Knopf zum Übergeben. Er
schließt womöglich wieder und sucht woanders.

**Problem:** Die Rückfrage aus Runde 1 (F2) ist richtig, verdrängt aber
die eigentliche Handlung aus dem Bild. Der häufigste Fall, eine
Teilmeldung mit Lücken, ist damit der unbequemste.

**Auswirkung im Einsatz:** Einige Sekunden Verzögerung an der Übergabe, im
schlechtesten Fall bricht der Helfer ab oder übergibt auf Papier.

**Empfehlung:** Die Transportknöpfe zuerst zeigen und die offenen Punkte
darunter oder eingeklappt als „6 offene Punkte ansehen". Die Anzahl
sichtbar über den Knöpfen lassen, etwa „⚠ 6 offene Punkte — QR-Code
trotzdem zeigen".

**Nachprüfung:** Bogen mit sechs offenen Punkten, „Bogen übergeben…": „QR-Code
im Vollbild zeigen" muss ohne Scrollen sichtbar sein.

### R2-H7 [P2] Assistenten-Kopf belegt wieder die Hälfte des Bildschirms (Wiederaufnahme von F5)

**Priorität:** P2

**Nachweis:** beobachtet, gemessen. Die Messart von Runde 1 ist nicht
dokumentiert, der Vergleich ist daher ungefähr.

**Fundstelle / Aufgabe:** Kopf des Assistenten (Rücksprung, Themenwahl,
Titel, Speicherzeile, Schrittleiste), Schritt 3, Seite ganz oben.

**Beobachtung:** Unterkante des Kopfs bei 327 px im Standard-Thema und
394 px im Feld-Thema. Runde 1 meldete nach der Behebung 254 bzw. 353 px.
„‹ Startseite" und der Themen-Umschalter stehen auf zwei Zeilen, die
Schrittleiste läuft über drei Zeilen („6. Übersicht" allein in der
dritten). Im Feld-Thema beginnt das erste Bedienelement von Schritt 3 bei
512 px. Bis zur Fußleiste bei rund 573 px bleibt eine Zeile Formular.

**Reaktion des Helfers:** Er wählt „Feld", weil er im Feld ist, und sieht
danach vor allem Kopf.

**Problem:** Gerade das Thema für den Außeneinsatz lässt am wenigsten Platz
für die Arbeit. Zusammen mit R2-H1 sieht der Helfer entweder den Kopf ohne
Formular oder das Formular ohne Anfang.

**Auswirkung im Einsatz:** Mehr Scrollen je Schritt und damit mehr
Gelegenheit, Felder zu übersehen.

**Empfehlung:** Die Runde-1-Maßnahme prüfen: Rücksprung und Umschalter in
eine Zeile, Themenwahl aus dem Assistenten in die Startseite verlegen.
Die Schrittleiste beim Scrollen auf eine Zeile mit „Schritt 3 von 6 ·
Personal" verkürzen.

**Nachprüfung:** Feld-Thema, 360 × 640, Schritt 3 oben: Mindestens das erste
Eingabefeld samt Beschriftung muss oberhalb der Fußleiste stehen.

### R2-H8 [P3] Datumsfelder sind zu schmal für ein vollständiges Datum (neu)

**Priorität:** P3

**Nachweis:** wahrscheinlich. Beobachtet in headless Chromium, das
unabhängig von `locale` und `--lang=de-DE` im US-Format „09/28/20…" rendert.
Die Anzeige auf echten Android- und iOS-Geräten ist nicht geprüft.

**Fundstelle / Aufgabe:** Schritt 2, „Zeitraum von" und „Zeitraum bis
(Vorschlag: wie Beginn)", je 112 px breit.

**Beobachtung:** Das Jahr ist abgeschnitten („09/28/20:"). Die
Beschriftung „Zeitraum bis (Vorschlag: wie Beginn)" bricht auf drei Zeilen
um.

**Reaktion des Helfers:** Er prüft das Datum mit einem Blick und sieht nur
Tag und Monat.

**Problem / Auswirkung im Einsatz:** Bei Einsätzen über den Jahreswechsel
oder bei einem falsch übernommenen Vorjahresbogen fällt ein falsches Jahr
nicht auf. Geringe Folge, denn die Übersicht zeigt „28.09.2026 –
28.09.2026" vollständig.

**Empfehlung:** Datumsfelder auf voller Breite untereinander setzen.

**Nachprüfung:** Auf einem echten Android- und einem iOS-Telefon Schritt 2
öffnen: Das Datum muss vollständig mit Jahr lesbar sein.

### R2-H9 [P3] Kleinere Stolpersteine (neu)

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Beobachtung:**
- Übersicht → „Neuer Bogen": Die Rückfrage sagt „… wird geschlossen und der
  gespeicherte Entwurf gelöscht". Tatsächlich steht der Bogen danach auf der
  Startseite unter „Zuletzt verdrängten Bogen zurückholen". Nach
  „Verwerfen und neu beginnen" landet man auf der Startseite, nicht in
  einem neuen Bogen. Die Warnung ist also strenger als die Wirkung (vgl.
  R2-N1 für den umgekehrten Fall).
- Schnellerfassung von der Startseite: Schritt 1 sagt „Einsatzdaten …
  können offen bleiben", die Übersicht zählt „Ort/Auftrag ist noch leer."
  trotzdem als offenen Punkt für die Weitergabe.
- Meldekopf-Karte: Jede Einheit trägt neun Knöpfe (Details, Bogen als PDF,
  Abrücken, Zug zuordnen, Auftrag/Notiz, Aufteilen…, Verschieben…,
  Entfernen, dazu „ändern"). Eine Karte ist rund 450 px hoch, bei
  20 Einheiten ergibt das eine sehr lange Liste. Die Links „ändern" neben
  „eingetroffen" und „abgerückt" messen 41 × 28 px und stehen dicht
  beieinander.

**Reaktion des Helfers:** Kurzes Zögern: Ist der Bogen jetzt weg oder
nicht? Muss ich den Ort doch eintragen? Welches „ändern" ist welches?

**Auswirkung im Einsatz:** Gering. Am Meldekopf erhöht die Knopfdichte das
Risiko eines Fehlgriffs beim Scrollen (siehe R2-H4).

**Empfehlung:** Rückfragetexte an die tatsächliche Wirkung anpassen. In
der Schnellerfassung Ort/Auftrag nicht als Weitergabelücke zählen. Die
seltenen Kartenaktionen (Aufteilen, Verschieben, Entfernen) hinter „Mehr…"
legen und „ändern" zu vollen Zielen machen.

**Nachprüfung:** „Neuer Bogen" bestätigen und die Startseite prüfen. Den
Text mit der Wirkung vergleichen. In der Sammlung die Kartenhöhe und die
Zielgrößen messen.

## Bestätigt aus anderen Runde-2-Berichten

Diese Stellen habe ich unabhängig beobachtet. Sie sind in
[neuer-nutzer.md](neuer-nutzer.md) ausführlich beschrieben und werden hier
nicht noch einmal als eigene Befunde gezählt:

- **R2-N2** „Namen einfügen…" ersetzt die Sollplätze: Fünf Zeilen
  eingefügt, die Stärke fiel von 0 / 2 / 7 / 9 auf 0 / 0 / 5 / 5. GrFü und
  TrFü waren weg, alle als Mannschaft. Der Dialog kündigt das nicht an, ein
  „Rückgängig" fehlt. Für den Helfer im Feld ist das der gefährlichste
  Fehlgriff im eigenen Bogen, denn der Meldekopf sieht eine Einheit ohne
  Führung.
- **R2-N3** Haken an „3. Personal" und „4. Fahrzeuge" direkt nach der
  Typwahl (Label „ausgefüllt"), obwohl kein Name und kein Kennzeichen
  eingetragen sind.
- **R2-N7** „Fortsetzen" nach Unterbrechung in Schritt 3 öffnet die
  Gesamtübersicht (siehe auch R2-H3).
- **R2-N8** Schritt 3 mit neun Sollplätzen ist rund 10 100 px lang. Die
  „Schnelleingabe (Tabelle)" zeigt keine Funktion, „Zählt als" ist auf
  „Unterfü…" abgeschnitten, die Tabelle rollt seitlich.
- **R2-N9** Platzhalter „z. B. Freiwillige Feuerwehr Wardenburg" und
  „z. B. Löschzug, SEG Sanität" bei Organisation THW.

Nicht nachgestellt habe ich R2-N1 (Verdrängung durch zwei
Schnellerfassungen), R2-N5 und R2-N6. R2-N4 („alt") ließ sich mit den
Beispielbögen nicht prüfen: Deren Stand liegt im Juli, dort ist „alt"
richtig.

## Was gut funktioniert und erhalten bleiben sollte

- **Offline:** Der Service Worker ist aktiv. Mit abgeschaltetem Netz lädt
  die App neu, der Entwurf ist da („Entwurf vom 28.09.26, 11:05 Uhr
  wiederhergestellt.").
- **Speicherzeile:** „✓ automatisch gespeichert · 11:00 Uhr — bleibt auf
  diesem Gerät" beantwortet auf jedem Schritt die Frage, ob etwas verloren
  gehen kann.
- **Einheitstyp und OV-Vorschlag:** „Berg" findet B, B (ASH), FGr BT, FGr
  SB. „Ulm" füllt Kürzel, Telefon, E-Mail sowie RB Biberach und LV
  Baden-Württemberg nach. Das spart am Telefon viel Tipparbeit.
- **Schnellerfassung:** −/+-Zähler für Führer, Unterführer, Mannschaft und
  Verpflegung, 52 × 52 px. Eine Stärke 0/1/8 ist ohne Tastatur eingegeben.
- **Rückfragen mit Namen:** „Meyer, Jan entfernen? Die erfassten Angaben
  dieser Person gehen verloren …" mit „Abbrechen". „Verwerfen" auf der
  Startseite nennt den Bogen und die Rückholung. „Meldung entfernen?" am
  Meldekopf nennt Einheit und Stand.
- **Übung gegen Lage:** Fünf Übungsbögen in einer Sammlung der Art
  „Einsatz" werden angezeigt, aber ausdrücklich nicht gezählt („5
  Übungsmeldungen zählt nicht in diese Lage …"). Das verhindert eine
  falsche Kräftemeldung.
- **Scanner ohne Kamera:** „Dieses Gerät meldet keine nutzbare Kamera" mit
  Handscanner-Weg, „QR aus Bild einlesen…" und „Abbrechen".
- **QR-Vollbild:** Großer Code mit Hinweis „Der Bildschirm bleibt an —
  Display-Helligkeit hoch stellen hilft beim Scannen."
- **PDF-Vorschau unter Last:** Bei sechsfach gedrosselter CPU steht „Der
  Bogen wird gesetzt und der QR-Code gerechnet … Die App arbeitet, sie
  hängt nicht."
- **Themen:** „Feld" mit schwarzen Rahmen und großer Stärke-Anzeige,
  „Nacht" mit Bernstein auf Dunkel. Beide sind gut lesbar (am echten
  Display nicht geprüft).
- **Kästchen und Auswahlpunkte:** Die Beschriftungszeilen sind 44 px hoch,
  z. B. „Einsatzbeginn eintragen" mit 209 × 44 px.

## Abschluss

- **Aufgabe geschafft:** Eigener Bogen bis zum QR-Vollbild: ja, mit
  Schwierigkeiten (R2-H1, R2-H2, R2-H6). Wiedereinstieg nach Neuladen: ja,
  nach Suchen (R2-H3). Meldekopf-Sammlung mit Abrücken und Entfernen: ja
  (R2-H4). Schnellerfassung nur Stärke: ja.
- **Fremde Hilfe nötig:** nein.
- **Mentales Modell:** Papierbogen von oben nach unten, jede neue Seite
  beginnt oben, Zurück heißt eine Ebene zurück. Der Assistent bedient das
  inhaltlich, aber die Bildschirmführung (Scrollposition, Zurück-Taste)
  weicht davon ab.
- **Größtes Einsatzrisiko:** Beim eigenen Bogen der stille Verlust der
  Führungsrollen durch „Namen einfügen…" (R2-N2). Unter den eigenen
  Befunden übersprungene Felder durch Schritte, die in der Mitte beginnen
  (R2-H1).
- **Top-Priorität für die nächste Iteration:** Jeder Bildschirmwechsel
  beginnt oben (R2-H1, R2-H3). Jede Quittung erscheint im Daumenbereich
  (R2-H4).

**Verständnisprüfung**

- Orientierung: **unsicher**. Wo man ist, verraten Schrittleiste und
  Speicherzeile. Nach „Weiter" und nach dem Neuladen fehlt aber der Anfang
  des Bildschirms (R2-H1, R2-H3).
- Nächster Schritt: **verstanden**. „Weiter →", „Zur Übersicht →" und
  „Bogen übergeben…" sind eindeutig. Im Übergabe-Dialog muss man den
  nächsten Schritt erst suchen (R2-H6).
- Systemzustand: **verstanden**, mit Einschränkung. Die Speicherzeile und
  die offenen Punkte sind klar. Die Haken der Schrittleiste täuschen
  (R2-N3), die Abrück-Quittung ist nicht im Bild (R2-H4).
- Fehlerbehebung: **verstanden**, mit Einschränkungen. Rückfragen und
  Rückholung tragen. „Namen einfügen…" ist nicht umkehrbar (R2-N2), die
  Zurück-Taste führt aus Schritt 1 aus der App (R2-H5).
- Feldtauglichkeit: **eingeschränkt, nicht vollständig geprüft**. Offline,
  Entwurfsrettung und Übergabe tragen. Die Blickführung kostet unter Druck
  Felder und Zeit. Handschuhe, Sonnenlicht, Kamera und native Builds
  gehören weiter in einen Praxistest.

## Abgleich mit Runde 1

Grundlage: [../../feldtauglichkeit-audit.md](../../feldtauglichkeit-audit.md)
und [../README.md → Stand der Behebung](../README.md#stand-der-behebung).

| Runde-1-Befund | Bewertung Runde 2 | Beobachtung |
| --- | --- | --- |
| F1 Person/Fahrzeug ohne Rückfrage gelöscht | bestätigt behoben | Person mit Namen: „Meyer, Jan entfernen? …" mit „Person entfernen" gegen „Abbrechen". „Abbrechen" behält die Person. Fahrzeug nicht einzeln nachgeprüft. Nicht abgedeckt ist das stille Überschreiben durch „Namen einfügen…" (R2-N2). |
| F2 Übergabe-Dialog ohne offene Punkte | bestätigt behoben | Der Dialog nennt alle sechs Punkte antippbar und „Übergeben ist trotzdem möglich …". Neue Folge: Die Transportknöpfe rutschen unter das erste Bild (R2-H6). |
| F3 „Name (Pflicht)" keine Pflicht | bestätigt behoben | „⚠ Zugehörigkeit: Der Name der eigenen Einheit (unterste Ebene) fehlt." steht auf Schritt 1 und in der Übersicht. „Weiter" lässt weiterlaufen, wie beabsichtigt. |
| F4 Stärke nur per Tastatur | bestätigt behoben | −/+ für Führer, Unterführer, Mannschaft, 52 × 52 px. Drei Tipps und eine direkte Eingabe ergaben 0/1/8/9. |
| F5 Kopf im Feld-Thema zu hoch | weiterhin offen | Gemessen 327 px (Standard) und 394 px (Feld) Kopfunterkante statt der gemeldeten 254/353 px. Rücksprung und Umschalter stehen auf zwei Zeilen (R2-H7). Messart von Runde 1 nicht bekannt. |
| F6 Telefon/E-Mail mit Buchstabentastatur | bestätigt behoben (Tastatur selbst nicht geprüft) | Felder sind `type="tel"` bzw. `type="email"`. Die eingeblendete Bildschirmtastatur war nicht prüfbar. |
| F7 Kästchen 18 × 18 px | bestätigt behoben | Beschriftungszeilen 44 px hoch (z. B. 209 × 44, 174 × 44). Das Kästchen selbst misst 24 × 24 px. Echte Handschuhe nicht geprüft. |
| F8 Karten ohne Nummer | bestätigt behoben | „Person 1 von 9" und „Fahrzeug 1 von 2" über den Karten. Die Sollstelle steht weiter erst unten in der Karte (R2-N8). |
| F9 PDF-Vorschau ohne Fortschritt | bestätigt behoben | „Vorschau wird erzeugt…" mit `aria-busy` und dem Satz „Die App arbeitet, sie hängt nicht.", beobachtet bei sechsfach gedrosselter CPU. |
| F10 Schnellerfassung wie voller Bogen | teilweise | Marke „Schnellerfassung" im Kopf und Satz „Es reichen der Name … und die Stärke in Schritt 3". Weiter sechs Schritte, und die Übersicht zählt Ort/Auftrag als Lücke (R2-H9). Rest in R2-N6. |

Einordnung der eigenen Befunde: R2-H1, R2-H2, R2-H3, R2-H6, R2-H8 und
R2-H9 sind neu. R2-H7 nimmt F5 wieder auf. R2-H4 nimmt D4 aus
[zerstoerende-handlungen.md](../zerstoerende-handlungen.md) wieder auf: Die
Quittung mit „Rückgängig" gibt es, aber außerhalb des Bilds. R2-H5 nimmt E3
aus [fehler-und-wiederanlauf.md](../fehler-und-wiederanlauf.md) für den
Einstieg in den Assistenten und das QR-Vollbild wieder auf.

Bilanz: Von zehn Runde-1-Befunden sind acht bestätigt behoben (F1–F4,
F6–F9; F6 ohne Blick auf die echte Tastatur). F10 ist teilweise umgesetzt,
F5 ist nach Messung wieder offen. Die Härtung gegen Fehlgriffe und die
Lückenmeldung aus Runde 1 tragen. Die neuen Befunde betreffen fast alle
dieselbe Ursache: Nach einem Wechsel steht nicht im Bild, was der Helfer als
Nächstes braucht.
