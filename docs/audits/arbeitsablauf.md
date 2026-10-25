# Audit „Arbeitsablauf" (Einheit → Meldekopf → Folgemeldung → Schichtübergabe)

Stand: 27.09.2026 · Prüfer: Rollenaudit `thw-workflow-reviewer` · Prüfgegenstand:
Web-App, Produktionsbuild (`vite build` + `vite preview`), Zweig
`claude/thw-reviewer-skills-dr76q1`, Commit `f455018`.

Reiner Prüfbericht, keine Codeänderung.
> *Nachtrag 28.09.2026:* Die Befunde dieses Berichts sind behoben oder mit
> Begründung zurückgestellt; der Stand je Befund steht in
> [README.md → Stand der Behebung](README.md#stand-der-behebung).


## Prüfaufbau

Drei Geräte als getrennte Browser-Kontexte (Chromium/Playwright, 360 × 640,
`isMobile`/`hasTouch`, de-DE), keine Kamera. Der QR-Weg wurde durch den
gleichwertigen Link-Weg („Weitere Formate → Link teilen", Inhalt identisch zum
QR-Code) und durch PDF-Dateien ersetzt. Gerät A trägt einen realen Bogen
(Zugtrupp TZ, 4 Personen, 2 Fahrzeuge, keine Übung), Gerät B ist der
Meldekopf, Gerät C die ablösende Führungsstelle.

Erwartete Arbeitsfolge (Annahmen, wo der reale THW-Ablauf nicht bekannt ist,
sind gekennzeichnet):

1. Alarm im OV. Der Zugführer stellt den Bogen aus einer Vorbereitung zusammen
   (Annahme: die Stammbesetzung ist bekannt, wer tatsächlich mitfährt, wird
   angekreuzt), ergänzt Auftrag und Fahrzeuge.
2. Fahrt, Ankunft am Bereitstellungsraum. Übergabe an den Meldekopf — vor Ort
   ohne Netz per QR/Nahbereich, vorab per Mail-PDF oder Link.
3. Der Meldekopf nimmt die Meldung in seine Sammlung, sieht Stärke und Bedarf.
4. Lage ändert sich: eine Person fällt aus. Die Einheit meldet neu; der
   Meldekopf hängt die Folgemeldung an und sieht, was sich geändert hat.
5. Die Einheit rückt ab; der Meldekopf setzt den Status.
6. Schichtwechsel: die Sammlung geht an die ablösende Führungsstelle (Gerät C)
   und muss dort vollständig, mit Historie und Status, weiterlaufen.
7. Einsatzende: die Sammlung wird als Abschlussdokument gesichert.

Nicht prüfbar hier: Kamera-Scan und Nahbereichs-Weitergabe (AirDrop/Quick
Share) selbst; geprüft ist nur, wo deren Ergebnis — ein Link — in der App
landet. Sammel-PDF-Inhalt wurde nur über den Rückimport geprüft, nicht gelesen.

## Urteil

Der Kern des Ablaufs trägt: Bogen vorbereiten, ausfüllen, übergeben, am
Meldekopf zusammenzählen, Folgemeldung mit Änderungsanzeige, Übergabe der
ganzen Sammlung an ein anderes Gerät samt Status und Historie. Die
Vorlagen-Funktion mit „Einsatz vorbereiten" (Personal und Fahrzeuge
abhaken, „Einsatz starten · 4 Pers · 2 Fz") bildet den Alarmfall so ab, wie er
läuft. Reibung entsteht am Meldekopf bei allem, was nicht durch die Kamera
kommt: Link, Nahbereich und Datei laufen über den Bereich „meinen Bogen", mit
einer Rückfrage, die vom „angefangenen Bogen" spricht, und fünf Tipps bis zur
Sammlung. Die Weitergabe der Sammlung heißt „Sammel-PDF" und verweigert sich,
sobald alle Einheiten abgerückt sind — also genau zum Einsatzende. Der
Abrückzeitpunkt wird nicht festgehalten. Die Aufgabe ist ohne fremde Hilfe zu
schaffen, Schritt 7 aber nicht.

## Befunde

### W1 [P1] Meldungen per Link, Nahbereich oder Datei kommen am Meldekopf außerhalb des Einsatzes an

Fundstelle: Gerät B hat den Einsatz „Hochwasser Albstadt" offen; Gerät A
schickt eine Folgemeldung als Link (derselbe Inhalt wie QR-Code, derselbe
Weg wie Nahbereichs-Senden). Gleiches Bild beim Mail-Weg „Aus Datei laden…".
Beobachtung: Der Link öffnet zuerst die Rückfrage „Empfangenen Bogen öffnen?
Der angefangene Bogen ‚THW Albstadt Zugtrupp Technischer Zug' wird durch die
empfangene Meldung ersetzt." Der „angefangene Bogen" ist die vorige
aufgenommene Meldung derselben Einheit — aus Sicht des Meldekopfs gibt es
keinen eigenen Bogen. Nach „Meldung öffnen" landet der Bediener in der
Gesamtübersicht des fremden Bogens, mit „Bearbeiten"-Knöpfen, „Bogen
übergeben…" und „Als Vorlage speichern". Erst „In Einsatz aufnehmen…" →
Einsatz wählen → „Als neue Fassung anhängen" bringt ihn zurück. Fünf Tipps
und zwei Kontextwechsel; innerhalb des Einsatzes gibt es dagegen „Bogen
scannen…" und „Bögen einlesen…" (JSON, PDF, Bilder), die direkt aufnehmen.
Erwartung der Rolle: Wer am Meldekopf steht und einen Bogen bekommt — egal
wie —, will ihn in die offene Sammlung legen. Der Bogen selbst interessiert
ihn nur als Meldung, nicht als etwas, das er bearbeiten könnte.
Auswirkung im Einsatz: Bei zehn eintreffenden Einheiten per Nahbereich zehnmal
derselbe Umweg; die Rückfrage verunsichert („welchen angefangenen Bogen habe
ich?"), und die Übersicht lädt dazu ein, im fremden Bogen zu tippen. Wer dort
„Bogen übergeben…" statt „In Einsatz aufnehmen…" nimmt, gibt den Bogen weiter,
ohne dass er in der Lage zählt.
Empfehlung: Sobald eine Sammlung existiert, eingehende Bögen (Link, Nahbereich,
Datei) als erste Option direkt in die zuletzt offene Sammlung anbieten
(„In ‚Hochwasser Albstadt' aufnehmen"), ohne Umweg über die Übersicht; die
Rückfrage zum verdrängten Entwurf nur zeigen, wenn dort wirklich ein eigener,
bearbeiteter Bogen liegt. Der Empfang sollte den Meldekopf-Modus behalten.
Verifikation: Mit offener Sammlung einen Link öffnen — in höchstens zwei Tipps
muss die Meldung in der Sammlung liegen, ohne Frage nach einem eigenen Bogen.

### W2 [P1] Die Weitergabe der Sammlung heißt „Sammel-PDF" und verweigert sich am Einsatzende

Fundstelle: Einsatzansicht, Knopfleiste „Sammel-PDF (alle Bögen) · Übersicht
als CSV · Alle Daten als CSV · Excel-Liste"; Startseite „Einsatz importieren…".
Beobachtung: Der einzige Weg, die Sammlung mit Zügen, Status und Historie an
ein anderes Gerät zu geben, ist die Sammel-PDF; dass sie das trägt und über
„Einsatz importieren…" wieder eingelesen wird, steht nur im Tooltip (auf dem
Telefon unsichtbar). Der Rückimport auf Gerät C funktioniert und bringt beide
Einheiten samt Status „abgerückt" mit. Sind aber alle Einheiten abgerückt,
antwortet der Knopf: „Keine anwesenden Einheiten für die Sammel-PDF." Es gibt
dann keinen Weg mehr, die Sammlung zu sichern oder zu übergeben.
Erwartung der Rolle: Ein Knopf „Einsatz weitergeben" oder „Einsatz sichern",
der immer geht — vor allem am Ende, wenn die Sammlung ins Archiv oder zur
nächsten Stelle soll.
Auswirkung im Einsatz: Die Schichtübergabe hängt an einem Knopf, dessen Name
etwas anderes verspricht (ein Druckstück). Am Einsatzende, wenn alle
abgerückt sind, lässt sich die Dokumentation weder weitergeben noch sichern —
sie lebt nur noch im Browserspeicher dieses einen Geräts, mit 30-Tage-
Papierkorb als einziger Rückversicherung. (Annahme: die Führungsstelle
braucht die Sammlung nach Einsatzende für Abrechnung und Nachweis.)
Empfehlung: Einen eigenen, so benannten Weg „Einsatz weitergeben / sichern"
neben der Sammel-PDF, der unabhängig vom Anwesenheitsstand funktioniert und
im Text sagt, dass alles (auch Abgerückte, Historie, Züge) mitgeht. Die
Sammel-PDF bei null Anwesenden nicht verweigern, sondern mit Hinweis
erzeugen.
Verifikation: Einsatz mit zwei abgerückten Einheiten — Weitergabe an Gerät C
muss gelingen und beide Einheiten samt Status zeigen.

### W3 [P2] „Abrücken" hält keinen Zeitpunkt fest

Fundstelle: Einsatzansicht, Karte der Einheit, Knopf „Abrücken" (neben „Zug
zuordnen"); Gegenrichtung „Als anwesend".
Beobachtung: Ein Tipp setzt den Status sofort, ohne Rückfrage; die Summen
fallen auf null. Die Karte zeigt „abgerückt", aber keine Uhrzeit. Im
gespeicherten Eintrag steht nur `empfangenAm` (Eintreffen) und `status`; ein
Abrück-Zeitpunkt wird nicht abgelegt und erscheint folglich weder in der
Historie noch in CSV oder Sammel-PDF.
Erwartung der Rolle: „Wann ist Crailsheim abgerückt?" ist die Frage, die der
nächste Schichtführer und die Abrechnung stellen; der Zeitpunkt ist ebenso
wichtig wie das Eintreffen.
Auswirkung im Einsatz: Die Abrückzeit muss parallel auf Papier oder im
Einsatztagebuch geführt werden (Doppelpflege), sonst ist sie weg. Ein
versehentlicher Tipp auf „Abrücken" nimmt die Einheit aus allen Summen; der
Rückweg „Als anwesend" ist da, ändert aber nichts daran, dass es keine Spur
gibt.
Empfehlung: Beim Statuswechsel den Zeitpunkt speichern (vorbelegt „jetzt",
korrigierbar) und auf der Karte, in der Historie und in den Exporten zeigen;
den Wechsel kurz quittieren („Crailsheim abgerückt 20:19 — Rückgängig").
Verifikation: Einheit abrücken lassen, Sammlung auf Gerät C importieren — die
Abrückzeit muss dort lesbar sein.

### W4 [P2] Verpflegung wird doppelt geführt und am Meldekopf anders gezählt als gemeldet

Fundstelle: Schritt 5 „Sofortbedarf" (Feld Verpflegung, Personen), Schritt 3
nach Entfernen einer Person, Einsatzansicht „Bedarf (anwesende Einheiten)".
Beobachtung: Nach dem Entfernen einer Person meldet Schritt 3: „Verpflegung für
4 Personen angefordert, die Gesamtstärke ist aber 3" — die Zahl in Schritt 5
bleibt bei 4 und muss von Hand nachgezogen werden. Am Meldekopf zeigt „Bedarf"
dann „Verpflegung 3 (1 vegetarisch)", obwohl der Bogen ausdrücklich 4
anfordert: Die Summe wird aus der Personenzahl gebildet, das Bedarfsfeld des
Bogens geht in die Summe nicht ein.
Erwartung der Rolle: Ein Feld für den Bedarf, und der Meldekopf summiert, was
gemeldet wurde. Wer bewusst 4 anfordert, weil ein Nachzügler kommt, will das
beim Meldekopf sehen.
Auswirkung im Einsatz: Abweichungen zwischen „gemeldet" und „gezählt", die
niemand sieht — in beide Richtungen (zu wenig bestellt, oder Bedarf im Bogen
nicht angepasst). Der Hinweis in Schritt 3 hilft nur, wenn man ihn liest.
Empfehlung: Entweder das Bedarfsfeld an die Stärke koppeln (Abweichung nur als
bewusster Zusatz) oder am Meldekopf den gemeldeten Bedarf summieren und die
Abweichung zur Stärke kennzeichnen. Eine Angabe, ein Ort.
Verifikation: Bogen mit Stärke 3 und Verpflegung 4 übergeben — Meldekopf muss 4
zeigen oder die Abweichung benennen.

### W5 [P3] Nach dem Neuladen steht der Meldekopf auf der Startseite

Fundstelle: Einsatzansicht, Seite neu laden (Browser-Neustart, Akku, Tab
verworfen).
Beobachtung: Die App startet auf der Startseite; die Sammlung steht dort als
Karte mit „Öffnen", ein Tipp führt zurück. Nichts geht verloren.
Erwartung der Rolle: Dort weitermachen, wo man war.
Auswirkung im Einsatz: Ein Tipp und ein Moment Suchen — bei jedem
Kaltstart. Auf einem Tablet am Meldekopf, das zwischendurch einschläft, passiert
das oft.
Empfehlung: Die zuletzt offene Sammlung beim Start wieder öffnen (mit
sichtbarem Rückweg zur Startseite).
Verifikation: Einsatz öffnen, neu laden — Einsatzansicht muss stehen.

### W6 [P3] „PDF erzeugen" und „Sammel-PDF" quittieren nicht

Fundstelle: Übergabe-Dialog „PDF erzeugen"; Einsatzansicht „Sammel-PDF".
Beobachtung: Die Datei wird erzeugt (Download beobachtet), der Dialog bleibt
unverändert offen, in der App erscheint keine Meldung. Ob es geklappt hat,
zeigt nur der Browser — auf dem Telefon oft nur kurz.
Erwartung der Rolle: „PDF gespeichert: eeb-…Albstadt.pdf" oder direkt das
Teilen-Fenster.
Auswirkung im Einsatz: Doppelte Klicks, doppelte Dateien, Unsicherheit, ob die
Mail an den Meldekopf einen Anhang hat.
Empfehlung: Kurze Statuszeile mit Dateiname nach dem Erzeugen, auf dem Telefon
den Teilen-Weg anbieten.
Verifikation: PDF erzeugen — die App selbst muss den Erfolg nennen.

### W7 [P3] Herkunft einer Meldung nach Datei-Aufnahme ist „manuell"

Fundstelle: Bogen per „Aus Datei laden…" (PDF aus einer Mail) geöffnet und
über „In Einsatz aufnehmen…" abgelegt.
Beobachtung: Der Eintrag trägt die Quelle „manuell" (im Speicher; die Karte
zeigt den Link-Weg als „Scan"). Die Signatur wird getrennt angezeigt, das
fängt die Echtheitsfrage ab — aber „manuell" heißt in der Einsatzansicht auch
„vom Bediener eingetippt".
Erwartung der Rolle: Unterscheiden können, ob die Einheit selbst gemeldet hat
(Scan, Datei, Link) oder der Meldekopf sie eingetragen hat.
Auswirkung im Einsatz: Bei Rückfragen wird nachgetippten Angaben weniger
getraut; hier zu Unrecht.
Empfehlung: Quelle „Datei" bzw. „Link" führen, „manuell" nur für die Erfassung
von Hand.
Verifikation: Bogen aus PDF aufnehmen — Karte muss „Datei" zeigen.

## Was gut funktioniert und erhalten bleiben sollte

Vorlage → „Einsatz vorbereiten": Die gespeicherte Vorlage zeigt Personal und
Fahrzeuge als Ankreuzliste mit Stärke-Vorschau, „Einsatz starten · 4 Pers ·
2 Fz" legt den Bogen an. Das ist der Alarmfall, wie er läuft — Stamm bekannt,
Anwesenheit ankreuzen.

Folgemeldung: „Einheit ist bereits gemeldet — Als neue Fassung anhängen / Als
eigene Einheit führen", danach auf der Karte „seit 170805jul26: Stärke 4 → 3",
„Änderungen", „Historie (2)". Genau das braucht die Schichtübergabe.

Übergabe der Sammlung an Gerät C (über Sammel-PDF → „Einsatz importieren…"):
beide Einheiten, Status „abgerückt", Summen — alles da, ein Tipp, kein Dialog.

Ein zu großer Bogen wird ohne Zutun in zwei QR-Teile geteilt und beim Empfang
zusammengesetzt; empfangene Bögen tragen „Empfangen als: ✓ signiert von …",
und die Weitergabe eines unveränderten fremden Bogens bleibt mit
Original-Signatur gegengezeichnet.

Der Entwurf überlebt jede Unterbrechung; „Fortsetzen" springt in die
Übersicht. Die offenen Punkte stehen im Übergabe-Dialog.

Innerhalb des Einsatzes gibt es die direkten Aufnahmewege „Bogen scannen…"
und „Bögen einlesen…" (auch Stapel von Fotos/PDFs) — W1 ist nur die Lücke für
Link und Nahbereich.

## Abschluss

- Aufgabe geschafft: Schritte 1–6 ja, mit Umwegen bei Link/Datei-Empfang (W1);
  Schritt 7 (Sicherung/Weitergabe nach Einsatzende) nein (W2).
- Fremde Hilfe nötig: nein — außer für die Frage, wie die Sammlung zum
  nächsten Gerät kommt (steht nur im Tooltip).
- Größtes Missverständnis: „Sammel-PDF (alle Bögen)" ist in Wahrheit die
  Übergabedatei der ganzen Sammlung — und wird als Druckstück gelesen.
- Größtes Einsatzrisiko: Am Einsatzende, wenn alle abgerückt sind, lässt sich
  die Sammlung nicht mehr weitergeben oder sichern; Abrückzeiten sind nirgends
  festgehalten.
- Top-Priorität für die nächste Iteration: Einen immer verfügbaren Weg
  „Einsatz weitergeben / sichern" (W2), gefolgt vom direkten Empfang in die
  offene Sammlung (W1).
