# Audit „Zerstörende Handlungen" (Löschen, Überschreiben, Statuswechsel)

Stand: 27.09.2026 · Prüfer: Rollenaudit `thw-destructive-action-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite build` + `vite preview`),
Zweig `claude/thw-reviewer-skills-dr76q1`, Commit `c425b12`.

Reiner Prüfbericht, keine Codeänderung.
> *Nachtrag 28.09.2026:* Die Befunde dieses Berichts sind behoben oder mit
> Begründung zurückgestellt; der Stand je Befund steht in
> [README.md → Stand der Behebung](README.md#stand-der-behebung).
 Baut auf dem Stand nach
`541cf68` („Zerstörende Handlungen absichern") und `2023551` (Entwurf
schützen) auf; was dort abgestellt wurde, ist unten unter „Was gut
funktioniert" nachgemessen.

## Prüfaufbau

Chromium (Playwright), 360 × 640, `isMobile`/`hasTouch`, de-DE. Ausgangslage:
ein voller eigener Bogen (Zugtrupp TZ, 4 Personen mit Rufnummern und
Funktionen, 2 Fahrzeuge), eine Einsatz-Sammlung mit zwei Einheiten, eine
Vorlage. Jede Aktion, die Daten entfernt, überschreibt oder einen Status
setzt, wurde ausgelöst und der Dialog, die Knopflage, die Folge und der
Rückweg festgehalten. Doppelauslösung wurde mit Doppelklick bzw. zweitem
Tipp an derselben Stelle geprüft.

Geprüfte Aktionen: Entwurf verwerfen · Neuer Bogen · Aus Datei/Link laden
bei vorhandenem Entwurf · Person entfernen (Karte und Tabelle) · Fahrzeug
entfernen · Kontakt ✕ · Funktions-Chip × · Ebene ✕ · Umschalten „Nur Stärke" ·
In Einsatz aufnehmen (neue Fassung / eigene Einheit) · Abrücken / Als
anwesend · Meldung entfernen · Aufteilen · Zug zuordnen · Einsatz löschen
(Startseite und Ansicht) · Papierkorb: Wiederherstellen / Endgültig löschen ·
Vorlage löschen · Absenderkarte · Geräteschlüssel neu erzeugen · Alle Daten
löschen · Sicherung einspielen · Einsatz anlegen (Doppelklick).

Nicht prüfbar: Kamera-Scan als Auslöser, Gesten (Wischen), Hardware-Zurück auf
Android, Verhalten der nativen Builds.

## Urteil

Die großen Hebel sind gut gesichert: Einsatz löschen führt in einen
30-Tage-Papierkorb und sagt, wie viele Einheiten betroffen sind; „Alle Daten
löschen" zählt auf, was verschwindet, verlangt ein Kästchen und bietet vorher
die Sicherung an; „Meldung entfernen" hat ein „Rückgängig"; Karten-Löschungen
von Personen und Fahrzeugen fragen mit Namen nach; „Abbrechen" steht in jedem
Dialog 85 px unter dem roten Knopf. Ungesichert geblieben sind die kleinen
Hebel mit großer Wirkung: Das Entfernen einer Person in der
Schnelleingabe-Tabelle löscht sofort und endgültig, ein Tipp auf das
Auswahlfeld „Nur Stärke" setzt die gemeldete Stärke eines voll erfassten
Bogens auf 0, und „Abrücken" wechselt ohne Frage, ohne Quittung und mit einem
Knopf, der an derselben Stelle sofort zurückschaltet.

## Befunde

### D1 [P1] Schnelleingabe-Tabelle: „Person entfernen" löscht sofort und endgültig

Fundstelle: Schritt 3, Ansicht „Schnelleingabe (Tabelle)", letzte Spalte
jeder Zeile (41 × 44 px, neben den Sortierpfeilen, bei 360 px Breite erst
nach seitlichem Scrollen sichtbar).
Beobachtung: Ein Tipp entfernt die Zeile — hier „Lang, Sabine" (Zugführerin,
Rufnummer, Funktion ZFü, Fahrerlaubnis) — ohne Dialog, ohne „Rückgängig", ohne
Meldung. Die Stärke fällt von 4 auf 3. In der Karten-Ansicht fragt derselbe
Vorgang mit Namen nach („Lang, Sabine entfernen? … gehen verloren").
Erwartung der Rolle: Dieselbe Sicherung wie in der Karte. Wer die Tabelle
nimmt, tut das, weil er zwölf Zeilen schnell durchgeht — also mit dem Finger
knapp neben den Sortierpfeilen.
Auswirkung im Einsatz: Eine komplett erfasste Person ist mit einem Fehlgriff
weg, samt der Angaben, die in der Tabelle gar nicht sichtbar sind
(Qualifikationen, Erreichbarkeiten). Wird das nicht bemerkt, geht die Meldung
mit falscher Stärke und ohne die Führungskraft an den Meldekopf.
Empfehlung: Rückfrage mit Namen wie in der Karte, oder Löschen mit
zehnsekündigem „Rückgängig" in der Statuszeile. Den Löschknopf von den
Sortierpfeilen abrücken.
Verifikation: In der Tabelle „Person 1 entfernen" tippen — es muss eine
Rückfrage oder ein Rückweg erscheinen.

### D2 [P1] Ein Tipp auf „Nur Stärke" meldet einen vollen Bogen mit Stärke 0

Fundstelle: Schritt 3, Auswahlfelder „Personal vollständig erfassen" /
„Nur Stärke (Meldekopf-Schnellerfassung)" direkt unter der Überschrift.
Beobachtung: Bei einem Bogen mit vier erfassten Personen setzt der Wechsel auf
„Nur Stärke" die gemeldete Stärke auf 0 / 0 / 0 / 0 und die Unterbringung auf
„keine Angabe". Die Übersicht und der Übergabe-Dialog übernehmen das
(„Stärke ist 0 — es ist noch kein Personal erfasst", „Es sind 4
Ansprechpartner erfasst, die Gesamtstärke ist aber nur 0"). Die Personenkarten
bleiben unter den Stärke-Zählern stehen, die Namen sind nicht gelöscht, und
der Rückschalter stellt die abgeleitete Stärke wieder her. Die Verpflegung
zeigt in diesem Zustand „1 von 0 vegetarisch/vegan".
Erwartung der Rolle: Ein Auswahlfeld zwischen zwei Erfassungsarten liest sich
wie eine Ansichtsoption. Niemand rechnet damit, dass die Zahl, die auf dem
Bogen steht, dadurch auf 0 fällt, während die Personen darunter weiter
gelistet sind.
Auswirkung im Einsatz: Ein versehentlicher Tipp (das Feld ist 18 × 18 px, die
Zeile 44 px hoch, direkt über den Karten) und der Bogen geht mit Stärke 0 an
den Meldekopf; dort zählt die Einheit nicht. Die offenen Punkte warnen zwar,
aber mit Texten, die vom fehlenden Personal sprechen, nicht vom Umschalter.
Empfehlung: Beim Umschalten mit vorhandenem Personal nachfragen und die
Folge nennen („4 erfasste Personen werden nicht mehr gezählt — Stärke bitte
von Hand eintragen"), oder die manuelle Stärke mit der abgeleiteten
vorbelegen. Die Karten in diesem Modus ausblenden oder als „nicht gezählt"
kennzeichnen. Die Warnung in der Übersicht auf den Umschalter zeigen lassen.
Verifikation: Vollen Bogen auf „Nur Stärke" schalten — die Übersicht darf
nicht kommentarlos 0 / 0 / 0 / 0 zeigen.

### D3 [P2] Kleine ✕-Ziele löschen Rufnummern, Funktionen und Ebenen ohne Frage

Fundstelle: Schritt 1 „✕" an einer übergeordneten Ebene (44 × 44 px); Schritt
3 „✕" an einer Erreichbarkeit (43 × 44 px) und „×" an einem Funktions-Chip
(24 × 24 px).
Beobachtung: Alle drei löschen sofort. Geprüft: Die Ebene „RB Tübingen" samt
Rufnummer und Postfach war weg, die Mobilnummer der Zugführerin war weg, die
Funktion „ZFü" war weg — kein Dialog, keine Meldung, kein Rückweg. Die
✕-Knöpfe tragen keine sprechende Beschriftung (kein `aria-label`), der Chip-×
ist das kleinste Ziel der App.
Erwartung der Rolle: Ein × neben einem Wert entfernt den Wert — das ist klar.
Nicht klar ist, dass es keinen Weg zurück gibt, und die Rufnummer der
Führungskraft ist die Angabe, über die der Meldekopf zurückruft.
Auswirkung im Einsatz: Rufnummer oder Funktion fehlen auf dem Bogen; das
fällt erst auf, wenn der Meldekopf anrufen will. Die Ebene lässt sich über
„OV/RB/LV-Vorlage" nachfüllen, die Nummer muss neu getippt werden.
Empfehlung: Für Erreichbarkeiten und Ebenen mit Inhalt ein kurzes
„Rückgängig" nach dem Entfernen; Chip-× auf mindestens 32 px; leere Zeilen
weiterhin ohne Frage.
Verifikation: Erreichbarkeit mit Nummer per ✕ entfernen — ein Rückweg muss
sichtbar sein.

### D4 [P2] „Abrücken" wechselt ohne Frage, ohne Quittung und ohne Spur

Fundstelle: Einsatzansicht, Karte der Einheit, Knopf „Abrücken" (93 × 44 px)
zwischen „Bogen als PDF" und „Zug zuordnen".
Beobachtung: Ein Tipp: die Einheit ist „abgerückt", die Summen oben fallen
sofort (Einheiten 2 → 1, Gesamt 16 → 4), die Statuszeile am Fuß ändert sich
nicht (sie zeigt weiter die letzte Meldung „… aufgenommen"). An derselben
Stelle steht jetzt „Als anwesend" (121 × 44 px). Ein zweiter Tipp an derselben
Stelle — Doppeltipp, Nachwackeln mit dem Handschuh — schaltet zurück auf
anwesend; danach steht nirgends, dass etwas passiert ist. Ein Zeitpunkt des
Wechsels wird nicht gespeichert (siehe Arbeitsablauf-Audit W3).
Erwartung der Rolle: Statuswechsel einer Einheit sind Einträge fürs
Einsatztagebuch — mit Uhrzeit und einer Bestätigung, die man liest.
Auswirkung im Einsatz: Die Lage stimmt nicht mit der Anzeige überein, ohne
dass es jemand merkt: Eine Einheit gilt als weg (oder wieder da), und niemand
kann sagen, wann. Bei Verpflegung und Unterbringung wird mit falscher Zahl
bestellt.
Empfehlung: Kurze Quittung mit Uhrzeit und „Rückgängig" („Crailsheim
abgerückt 20:19 — Rückgängig"); den Gegenknopf nicht an derselben Stelle
erscheinen lassen; Zeitpunkt speichern.
Verifikation: Abrücken doppelt tippen — die Anzeige muss den Endzustand
eindeutig nennen, mit Uhrzeit.

### D5 [P2] „In Einsatz aufnehmen…" schließt den eigenen Bogen — ohne dass der Knopf es sagt

Fundstelle: Übersicht, Knopf „In Einsatz aufnehmen…"; Dialog „Der Bogen wird
als Meldung abgelegt und hier geschlossen".
Beobachtung: Nach der Aufnahme ist der Entwurf weg: Die Startseite zeigt
weder „Fortsetzen" noch ein „zurückholen". In der Einsatzansicht gibt es
„Details" und „Bogen als PDF", aber keinen Weg, die Meldung wieder als
bearbeitbaren Bogen zu öffnen. Wer die falsche Wahl trifft („Als eigene
Einheit führen" statt „neue Fassung"), bekommt eine Doppelzählung (3
Einheiten, 20 Gesamt statt 16) und muss die Doppelte entfernen; das ist
möglich und rückgängig.
Erwartung der Rolle: Ein Zugführer, der seine Teileinheiten sammelt, nimmt
auch den eigenen Bogen in die Sammlung — und will ihn danach weiter pflegen.
„Aufnehmen" klingt nach Kopie, nicht nach Umzug.
Auswirkung im Einsatz: Der Bogen ist nur noch als Meldung im Einsatz und als
PDF erreichbar; jede Änderung (ein Helfer kommt nach) braucht den Umweg
PDF → „Aus Datei laden…" → bearbeiten → erneut aufnehmen. Wer das nicht weiß,
tippt den Bogen neu.
Empfehlung: Den Knopf ehrlich beschriften („In Einsatz ablegen und
schließen…") oder — besser — den eigenen Bogen behalten und aus der
Einsatzkarte ein „Bogen bearbeiten" anbieten.
Verifikation: Eigenen Bogen aufnehmen, dann eine Person nachtragen — ohne
PDF-Umweg.

### D6 [P3] Vorlage „Löschen" wandert stumm in den Papierkorb

Fundstelle: Startseite, Vorlagenkarte, roter Knopf „Löschen" rechts unten
(83 × 44 px, abgesetzt von „Teilen…").
Beobachtung: Kein Dialog, keine Statuszeile; die Karte verschwindet, oben
erscheint „Papierkorb (1)". Von dort ist die Vorlage 30 Tage lang mit
„Wiederherstellen" zurückzuholen; „Endgültig löschen…" fragt mit Namen nach.
Erwartung der Rolle: Eine kurze Zeile „Vorlage ‚ZTr TZ' in den Papierkorb —
Rückgängig".
Auswirkung im Einsatz: Gering; die Rückholung ist da, nur nicht angekündigt.
Empfehlung: Statuszeile mit „Rückgängig" wie bei „Meldung entfernen".
Verifikation: Vorlage löschen — Meldung muss den Rückweg nennen.

### D7 [P3] Der eigene Bogen hat keinen Papierkorb

Fundstelle: Startseite „Verwerfen" (Dialog: „Das lässt sich nicht rückgängig
machen"), Übersicht „Neuer Bogen" („… der gespeicherte Entwurf gelöscht").
Beobachtung: Beide Dialoge sind spezifisch, nennen die Einheit und färben den
Löschknopf rot; ein Kästchen oder eine Rückholung gibt es nicht. Einsätze und
Vorlagen haben einen 30-Tage-Papierkorb, der verdrängte Bogen einen zweiten
Speicherplatz — der bewusst verworfene Bogen nichts davon.
Erwartung der Rolle: Wer nach einem 14-Stunden-Tag „Verwerfen" statt
„Fortsetzen" trifft, will den Bogen am nächsten Morgen zurück.
Auswirkung im Einsatz: Ein voller Bogen (Namen, Nummern, Fahrzeuge) ist mit
zwei Tipps weg; die Dialoge fangen den Reflex ab, nicht die Verwechslung.
Empfehlung: Verworfene Bögen wie Einsätze in den Papierkorb legen.
Verifikation: Bogen verwerfen — er muss im Papierkorb liegen.

## Was gut funktioniert und erhalten bleiben sollte

„Alle Daten löschen" zählt auf (0 Vorlagen, 1 Einsatz mit 2 Bögen, der
Entwurf, Absenderkarte, Geräteschlüssel, Einstellungen), verlangt das Kästchen
„Ja, alle lokalen Daten … endgültig löschen" und bietet „Vorher Sicherung
erstellen…" an.

„Geräteschlüssel neu erzeugen?" erklärt die Folge (andere Kurzform, alte
Bögen nur gegen den alten Schlüssel prüfbar, nicht wiederherstellbar) und
nennt den einzigen guten Grund (Verdacht auf Schlüsselverlust).

„Sicherung einspielen?" sagt, dass alles ersetzt wird, und listet, was.

„Einsatz löschen?" nennt Name und Zahl der Einheiten, führt in den Papierkorb
(30 Tage), und „Endgültig löschen…" fragt dort noch einmal mit Namen.
„Wiederherstellen" und „Endgültig löschen…" liegen 125 px auseinander.

„Meldung entfernen?" nennt Einheit und Stand, und danach steht „Meldung …
entfernt. Rückgängig".

Personen- und Fahrzeugkarten fragen mit Namen und Aufzählung der verlorenen
Angaben; leere Karten gehen ohne Frage.

„Einheit ist bereits gemeldet" erklärt beide Wege in je einem Satz; die
falsche Wahl lässt sich durch Entfernen der Doppelten korrigieren.

Ein eingehender Link oder eine Datei verdrängt einen begonnenen Bogen nur nach
Rückfrage und legt ihn zum Zurückholen ab (zur Wortwahl am Meldekopf siehe
Arbeitsablauf-Audit W1).

Doppelklick auf „Einsatz anlegen" legt genau einen Einsatz an. In allen
Dialogen steht „Abbrechen" 85 px unter dem roten Knopf, beide 272 × 44 px.

## Abschluss

- Aufgabe geschafft: ja — die großen Löschwege sind sicher; die kleinen
  (Tabelle, Umschalter, ✕) nicht.
- Fremde Hilfe nötig: nein.
- Größtes Missverständnis: „Nur Stärke" sieht aus wie eine Ansichtsoption,
  setzt aber die gemeldete Stärke auf 0.
- Größtes Einsatzrisiko: Eine voll erfasste Führungskraft verschwindet in der
  Tabelle mit einem Tipp neben den Sortierpfeilen — ohne Frage, ohne Rückweg.
- Top-Priorität für die nächste Iteration: Die Tabellen-Löschung auf den
  Stand der Karten-Löschung bringen (D1), danach den Umschalter „Nur Stärke"
  absichern (D2).
