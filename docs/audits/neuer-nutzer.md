# Audit „Neuer Nutzer" (THW-Helfer ohne Einweisung)

Stand: 27.09.2026 · Prüfer: Rollenaudit `thw-new-user-reviewer` · Prüfgegenstand:
Web-App, Produktionsbuild (`vite build` + `vite preview`), Zweig
`claude/thw-reviewer-skills-dr76q1`, Commit `f19e7f2`.

Reiner Prüfbericht, keine Codeänderung.
> *Nachtrag 28.09.2026:* Die Befunde dieses Berichts sind behoben oder mit
> Begründung zurückgestellt; der Stand je Befund steht in
> [README.md → Stand der Behebung](README.md#stand-der-behebung).


## Prüfaufbau

Chromium (Playwright), Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale
de-DE, ohne Kamera. Keine Anleitung gelesen, keine Landingpage besucht — Einstieg
direkt über die Startseite, so wie ein Helfer, dem jemand den Link geschickt hat.

Rolle: Helfer eines THW-Ortsverbands, kennt den Papier-Erfassungsbogen vom
Sehen, hat die App nie benutzt. Aufgaben:

1. Die eigene Einheit melden und dem Meldekopf übergeben.
2. Am Meldekopf eine eintreffende fremde Einheit ohne QR-Code aufnehmen.
3. Einen QR-Code einlesen (Gerät ohne Kamera).

Nicht prüfbar hier: Kamera-Scan, Handscanner, native Builds, Datumseingabe im
Systemdialog des Telefons (Chromium zeigt Datumsfelder in dieser Umgebung
englisch formatiert, das ist kein Befund der App).

## Urteil

Der erste Screen erklärt, wofür die App da ist, und trennt die beiden Rollen
sauber: „Meinen Bogen ausfüllen" gegen „Bögen sammeln (Meldekopf)". Aufgabe 1
gelingt ohne Hilfe; der Assistent folgt der Reihenfolge des Papierbogens, die
Übersicht zählt offene Punkte auf und führt hin, die Übergabe erklärt sich
selbst. Reibung entsteht an drei Stellen: das Wort „Einsatz" hat in der App
drei Bedeutungen, die manuelle Erfassung am Meldekopf sieht aus wie der
eigene Bogen und kennt keinen sichtbaren Rückweg in den Einsatz, und der
Scanner ohne Kamera hat auf einem kleinen Display keinen erreichbaren Ausgang.
Aufgabe 2 gelingt mit Umwegen, Aufgabe 3 endet in einer Sackgasse.

## Befunde

### F1 [P1] Scanner ohne Kamera: „Abbrechen" liegt außerhalb des Bildschirms

Fundstelle: Startseite → „QR-Code scannen…" auf einem Gerät ohne nutzbare
Kamera, Viewport 360 × 640.
Beobachtung: Der Scan-Modus ist ein festes Vollbild (`position: fixed`,
Höhe `100dvh`, kein Scrollen). Mit der Meldung „Dieses Gerät meldet keine
nutzbare Kamera" und dem Handscanner-Block ist der Inhalt 732 px hoch; sichtbar
sind davon 640. „Abbrechen" steht bei 687 px und ist weder durch Wischen noch
über die Escape-Taste erreichbar. Sichtbar bleibt nur „Kamera erneut
versuchen", das ins selbe Bild zurückführt. Tippen neben den Dialog tut
nichts. Der einzige Ausweg war das Neuladen der Seite.
Erwartung der Rolle: Ein Vollbild hat unten oder oben einen Knopf, der es
schließt; notfalls tut es der Zurück-Weg des Telefons.
Auswirkung im Einsatz: Wer am Meldekopf ohne Kamerafreigabe (abgelehnte
Berechtigung, Diensttelefon ohne Kamera, alter Browser) den Scan öffnet, sitzt
fest und lädt neu. Der Entwurf überlebt das, die Sammlung auch, aber der
Helfer weiß das in dem Moment nicht und rechnet mit Datenverlust.
Empfehlung: Der Ausgang muss auf jeder Displayhöhe im Sichtbereich stehen:
„Abbrechen" nach oben oder in eine feste Leiste, den Inhalt dazwischen
scrollbar machen, und Escape schließen lassen. Zusätzlich gehört der
Handscanner-Erklärtext hinter ein Aufklappen, damit er die Knöpfe nicht
verdrängt.
Verifikation: Ohne Kamera bei 360 × 640 den Scan öffnen — „Abbrechen" muss
ohne Scrollen sichtbar und antippbar sein; Escape muss schließen.

### F2 [P1] „Einheit manuell erfassen…" im Einsatz ist vom eigenen Bogen nicht zu unterscheiden

Fundstelle: Einsatz „Hochwasser Hunte" → „Einheit manuell erfassen…".
Beobachtung: Es öffnet sich derselbe sechsschrittige Assistent mit demselben
Kopf („Einheiten-Erfassungsbogen", „‹ Startseite", Schrittleiste) wie beim
eigenen Bogen. Nirgends steht, dass diese Erfassung zu „Hochwasser Hunte"
gehört. Der Rückweg heißt „‹ Startseite" — und er tut genau das: Er verlässt
den Einsatz, und die halb erfasste fremde Einheit liegt danach oben auf der
Startseite als „THW Wardenburg · Fortsetzen / Verwerfen", also an der Stelle,
an der die App sonst *meinen* Bogen zeigt. Der Knopf, der die Erfassung in
den Einsatz zurückbringt („In Einsatz übernehmen"), steht erst auf Schritt 6.
Erwartung der Rolle: „Einheit manuell erfassen" im Einsatz ist ein kurzes
Aufnahmeformular *dieses* Einsatzes; „Zurück" führt in die Einsatzliste, und
was ich dort eingebe, taucht dort auch wieder auf.
Auswirkung im Einsatz: Der Meldekopf-Bediener glaubt nach „‹ Startseite",
die Aufnahme sei verloren oder — schlimmer — er habe seinen eigenen Bogen
überschrieben. Bei mehreren eintreffenden Einheiten hintereinander ist zudem
nicht erkennbar, ob der Assistent gerade Einheit A oder B enthält.
Empfehlung: Den Kopf in diesem Modus mit dem Einsatznamen beschriften („Aufnahme
für: Hochwasser Hunte"), den Rückweg „‹ Einsatz" nennen und in die Sammlung
führen, und den Abschluss („In Einsatz übernehmen") auf jedem Schritt in der
unteren Leiste anbieten, nicht nur auf Schritt 6.
Verifikation: Aus einem Einsatz heraus manuell erfassen, auf Schritt 1 den
Rückweg nehmen — man muss im Einsatz landen und sehen, was mit der Eingabe
passiert ist.

### F3 [P2] „Einsatz" bedeutet drei verschiedene Dinge

Fundstelle: Startseite „Neuer Einsatz…", Assistent Schritt „2. Einsatz",
Übersicht „In Einsatz aufnehmen…", Einsatzansicht „Einsatz löschen…".
Beobachtung: „Neuer Einsatz…" legt eine Sammelmappe des Meldekopfs an (Dialog
mit Name, Art, Ort — ohne jede Stärkeangabe). Schritt 2 „Einsatz" ist der
Auftrag der eigenen Einheit. „In Einsatz aufnehmen…" legt den eigenen Bogen
als Meldung in so eine Sammelmappe.
Erwartung der Rolle: Ein Helfer, der gerade in einen Einsatz ausrückt, liest
„Neuer Einsatz…" als den naheliegenden Anfang seiner Meldung. Er landet in
einem Dialog, der nach „Name" und „Art" fragt, tippt womöglich seinen
OV-Namen ein und hat danach eine leere Sammlung „THW Oldenburg" auf der
Startseite. „In Einsatz aufnehmen…" liest er als „Einheit als im Einsatz
befindlich melden" — ein Statuswechsel, nicht ein Ablagevorgang.
Auswirkung im Einsatz: Irrweg mit Zeitverlust; im schlimmsten Fall wird die
eigene Stärke nie erfasst, weil der Helfer glaubt, mit „Neuer Einsatz" habe
er sich gemeldet. Die Startseite mildert das durch die zwei Kästen mit
Erklärtext, doch beide Kästen liegen unter dem Falz und die Knopfbeschriftung
allein trägt es nicht.
Empfehlung: Die Sammelmappe des Meldekopfs anders benennen als den Auftrag im
Bogen („Neue Sammlung anlegen…" / „Bogen in eine Sammlung legen…"), oder
zumindest den Knopf um das Ziel ergänzen („Neuer Einsatz (Sammlung für
eintreffende Bögen)…"). Der Dialog „In Einsatz aufnehmen" erklärt sich im
Text gut; der Knopf in der Übersicht sollte dasselbe tun.
Verifikation: Fünf ungeschulte Helfer mit der Aufgabe „melde deine Einheit"
auf die Startseite setzen — keiner darf bei „Neuer Einsatz…" landen.

### F4 [P2] „Zeitraum bis" ist mit dem heutigen Datum vorbelegt, obwohl der Text sagt, es dürfe offen bleiben

Fundstelle: Schritt 2 „Einsatz", Felder „Zeitraum von" / „Zeitraum bis".
Beobachtung: Beide Felder tragen beim Anlegen das heutige Datum. Der Hilfetext
darüber sagt: „‚Zeitraum bis' darf offen bleiben, solange das Ende noch nicht
feststeht." Die Übersicht zeigt anschließend „Zeitraum 27.09.2026 –
27.09.2026".
Erwartung der Rolle: Was offen bleiben darf, ist auch leer. Ein vorbelegtes
Feld hat jemand bewusst gesetzt.
Auswirkung im Einsatz: Jede Meldung, in der der Helfer das Feld nicht
anfasst, behauptet einen Eintagseinsatz. Am Meldekopf und im Sammel-PDF steht
dann für alle Einheiten dasselbe Ende — eine Angabe, die niemand gemacht hat,
aber jeder für gemacht hält (Annahme: die Führungsstelle liest „bis" als
geplantes Ende der Verfügbarkeit).
Empfehlung: „Zeitraum bis" leer lassen und im Bogen als „offen" ausgeben;
wenn eine Vorbelegung gewünscht ist, sie sichtbar als Vorschlag kennzeichnen.
Verifikation: Neuen Bogen anlegen, Schritt 2 unberührt lassen — die
Übersicht darf kein Enddatum zeigen.

### F5 [P2] Die Kästchen „Einsatzbeginn" und „Einsatzende" erklären nicht, was ein Haken tut

Fundstelle: Schritt 2, zwei Kästchen ohne Erläuterung.
Beobachtung: Ein Haken setzt kommentarlos die aktuelle Uhrzeit und blendet
darunter ein Datum-Uhrzeit-Feld ein. Dass es sich um den Zeitstempel handelt,
mit dem der Meldekopf die Einheit als eingetroffen bzw. entlassen führt, steht
nirgends; der Modellkommentar sagt „oft erst vor Ort/am Meldekopf gefüllt".
Erwartung der Rolle: Ein Kästchen mit der Beschriftung „Einsatzende" liest der
Helfer als „ich melde das Ende" — oder als Frage, ob der Einsatz ein Ende hat.
Auswirkung im Einsatz: Ein versehentlich gesetztes „Einsatzende" schickt mit
dem QR-Code einen Abmelde-Zeitstempel mit. Ob die Gegenstelle die Einheit
daraufhin als abgerückt führt, ist hier nicht geprüft (Annahme), der Bogen
sagt es jedenfalls so.
Empfehlung: Beschriften, was passiert: „Eintreffen protokollieren (jetzt)" /
„Abrücken protokollieren (jetzt)", mit dem Hinweis, dass der Meldekopf das
meist selbst setzt.
Verifikation: Ungeschulter Helfer soll die Frage „Wann seid ihr angekommen?"
im Bogen beantworten — er muss das richtige Kästchen finden und die Uhrzeit
korrigieren können.

### F6 [P2] Der erste Formularschritt warnt vor Lücken in Schritten, die noch gar nicht dran waren

Fundstelle: Schritt 1 „Einheit", unten drei gelbe Hinweise, bevor irgendetwas
eingegeben ist: „Der Name der eigenen Einheit fehlt", „Stärke ist 0 — es ist
noch kein Personal erfasst", „Ort/Auftrag ist noch leer". Die beiden letzten
betreffen Schritt 3 und 2.
Beobachtung: Die Hinweise zu Schritt 2 und 3 sind antippbar und springen dorthin.
Der Hinweis zum Namen (der einzige, der auf Schritt 1 gehört) steht als
erster, aber optisch gleichwertig. In der Schrittleiste erscheint nach der
ersten Eingabe ein „•" hinter „1. Einheit", dessen Bedeutung nirgends steht
(im Feldtauglichkeits-Audit als Rest von F3 bereits notiert).
Erwartung der Rolle: Der erste Screen sagt mir, was *hier* zu tun ist.
Warnungen kommen, wenn ich etwas ausgelassen habe, nicht bevor ich anfangen
konnte.
Auswirkung im Einsatz: Der Helfer lernt auf dem ersten Screen, dass gelbe
Kästen ohnehin immer da sind, und überliest sie später — auch die, die
zählen (kein Name, keine Rufnummer). Wer den Hinweisen folgt, springt auf
Schritt 3, bevor Schritt 1 fertig ist.
Empfehlung: Auf einem Schritt nur die Lücken dieses Schritts zeigen; die
Gesamtliste gehört in die Übersicht und in den Übergabe-Dialog, wo sie schon
gut steht. Das „•" in der Schrittleiste als „begonnen" beschriften oder durch
ein Wort ersetzen.
Verifikation: Frischen Bogen öffnen — Schritt 1 darf höchstens auf den
fehlenden Namen hinweisen.

### F7 [P2] Begriffe, die Produktwissen voraussetzen

Fundstelle: Schritt 1 „Kürzel (z. B. OODE)"; Schritt 3 „Stärkerolle (vor Ort)",
„Ansprechpartner/in"; Schritt 4 „Ausstattung nach StAN — / ja / nein" und die
Meldung „Sitzplätze: 0 für 1 Person — 1 Fahrzeug ohne hinterlegte
Sitzplatzzahl, die Rechnung ist unvollständig", sobald ein leeres Fahrzeug
angelegt ist; Übersicht „Signiert mit dem Echtheits-Siegel dieses Geräts:
af73 2820 0a37 d478", „Absender: keine Angabe · Name/Kontakt hinterlegen…".
Beobachtung: Alle Begriffe sind ohne Erklärung am Feld; „Was das Siegel
belegt" ist ein Aufklapper, der zugeklappt beginnt. „Absender: keine Angabe"
steht in derselben Tonlage wie die offenen Punkte, ist aber freiwillig — das
steht erst im Kleingedruckten darunter.
Erwartung der Rolle: „Kürzel" ist irgendeine Abkürzung (der Helfer tippt
vielleicht „OV OL"); „OODE" sagt nur Verwaltungsleuten etwas. „Stärkerolle"
liest er als Frage, was er heute ist — das trifft, aber „(vor Ort)" wirkt
wie eine Ortsangabe. „Ansprechpartner/in" ist ein Kästchen ohne Aussage, ob
es einen oder mehrere geben darf. Die Sitzplatz-Rechnung erschrickt, bevor er
ein einziges Feld angefasst hat. Die Hex-Ziffern des Siegels lesen sich wie
etwas, das er abschreiben oder vergleichen müsste.
Auswirkung im Einsatz: Kein Ablaufbruch, aber Zögern an fünf Stellen und
gelegentlich falsche Eingaben (Kürzel als Freitext, Ansprechpartner nie
gesetzt). Der Siegel-Block kostet Aufmerksamkeit an der Stelle, an der der
Helfer eigentlich nur den QR-Code zeigen will.
Empfehlung: Kürzel als „Dienststellen-Kürzel (optional, z. B. OODE für OV
Oldenburg)"; „Stärkerolle" mit einem Halbsatz („zählt als Führer /
Unterführer / Mannschaft"); Ansprechpartner als „Erreichbar für Rückfragen";
die Sitzplatz-Rechnung erst zeigen, wenn Fahrzeugtyp oder Sitzplätze
eingetragen sind; Siegel-Fingerabdruck im Aufklapper statt in der Karte.
Verifikation: Einem ungeschulten Helfer die fünf Begriffe zeigen und
erklären lassen, was die App von ihm will.

### F8 [P3] Eine leere Personenkarte zählt sofort als Mannschaft 1 und Unterbringung M 1

Fundstelle: Schritt 3, „+ Person hinzufügen".
Beobachtung: Noch bevor ein Buchstabe getippt ist, springt die Stärke auf
0 / 0 / 1 / 1 und die Unterbringung auf „M 1 / W 0 / D 0". Ein gelber Hinweis
sagt dazu „1 Personenkarte ohne Angaben zählt in die Stärke — ausfüllen oder
entfernen".
Erwartung der Rolle: Eine Zahl in der Stärke steht für eine erfasste Person.
Auswirkung im Einsatz: Der Hinweis fängt es ab, und die Übersicht nennt
leere Karten beim Namen (aus einem früheren Review). Bleibt: die
Geschlechts-Vorbelegung „M" erzeugt eine Unterbringungszahl, die niemand
eingetragen hat; ein ungeschulter Helfer bemerkt sie nicht.
Empfehlung: Karte erst zählen, wenn sie einen Namen oder eine Rolle hat;
Geschlecht ohne Vorbelegung starten.
Verifikation: Drei leere Karten anlegen — Stärke und Unterbringung müssen
0 bleiben.

## Was gut funktioniert

Die Startseite beantwortet die ersten drei Fragen eines Neulings: wofür
(„Bogen digital erfassen, als PDF drucken … per QR-Code ohne
Internetverbindung"), was mit meinen Daten passiert („Funktioniert komplett
offline — alle Daten bleiben auf diesem Gerät") und wo ich anfange (zwei Kästen
mit je einem Hauptknopf). Die Rollentrennung „Meinen Bogen ausfüllen" gegen
„Bögen sammeln (Meldekopf)" trifft die Praxis.

Die Schrittleiste nennt die Schritte in der Reihenfolge des Papierbogens;
„Weiter →" und „← Zurück" liegen fest unten. Die Übersicht sieht aus wie der
ausgefüllte Bogen, jede Karte hat „Bearbeiten", die offenen Punkte sind
antippbar und der Übergabe-Dialog wiederholt sie.

Wer die Seite mittendrin verlässt, findet oben auf der Startseite „THW
Oldenburg · Stärke 0 / 0 / 1 / 1 · gespeichert 19:58 Uhr — Fortsetzen /
Verwerfen". Der Speicherhinweis „automatisch gespeichert · bleibt auf diesem
Gerät" steht im Kopf jedes Schritts.

Zerstörende Aktionen fragen nach und nennen, was es trifft („‚THW Oldenburg'
wird geschlossen und der gespeicherte Entwurf gelöscht").

Der Einheitstyp bietet die vollständige THW-Gliederung (46 Einträge mit
Langnamen), der OV-Name schlägt aus der Dienststellenliste vor und füllt RB und
LV samt Rufnummern nach.

Der Scanner ohne Kamera erklärt den Handscanner-Weg verständlich — nur der
Ausgang fehlt (F1).

## Abschluss

- Aufgabe geschafft: Aufgabe 1 (eigene Einheit melden) ja; Aufgabe 2
  (fremde Einheit am Meldekopf manuell aufnehmen) mit Umwegen; Aufgabe 3
  (Scan ohne Kamera) nein — Sackgasse ohne Ausgang.
- Fremde Hilfe nötig: nein für Aufgabe 1, ja für den Ausweg aus dem Scanner.
- Größtes Missverständnis: „Neuer Einsatz…" wird als Beginn der eigenen
  Meldung gelesen, ist aber die Sammelmappe des Meldekopfs.
- Größtes Einsatzrisiko: Jede unberührte Meldung trägt ein Einsatzende „heute"
  (F4), und die Kästchen „Einsatzbeginn/-ende" setzen ungefragt Zeitstempel (F5).
- Top-Priorität für die nächste Iteration: Scanner-Ausgang auf jeder
  Displayhöhe erreichbar machen (F1), direkt danach die Einsatz-Aufnahme
  als solche kennzeichnen und mit Rückweg versehen (F2).
