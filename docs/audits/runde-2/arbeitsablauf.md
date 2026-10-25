# Audit „Arbeitsablauf", Runde 2 (Einheit → Meldekopf → Folgemeldung → Schichtübergabe → nächster Einsatz)

Stand: 28.09.2026 · Prüfer: Rollenaudit `thw-workflow-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/adoring-sagan-9vnriv`, Commit 354209b.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-1-Befunde vom 27.09.2026.

## Prüfaufbau

Chromium (Playwright, `/opt/pw-browsers/chromium`), Viewport 360 × 640 px,
`isMobile`/`hasTouch`, Locale de-DE, keine Kamera. Jedes Gerät ist ein
eigener Browser-Kontext mit eigenem Speicher. Zwischen den Skriptläufen blieb
der Zustand jedes Geräts erhalten. Alle Zustände sind durch Bedienung
entstanden, `localStorage`-Seeds waren nicht nötig. Den QR-Weg habe ich durch
den inhaltsgleichen Link ersetzt („Weitere Formate → Link teilen",
`navigator.share` gestubbt), den Mail-Weg durch die erzeugte PDF-Datei.
Getestet habe ich zuerst ohne Blick in frühere Berichte. Den Runde-1-Bericht,
die Tabelle „Stand der Behebung" und die vorliegenden Runde-2-Berichte habe
ich erst danach gelesen.

Geräte:

- **A** – Telefon des Gruppenführers, THW OV Ulm, Bergungsgruppe.
- **M** – Meldekopf-Tablet (im selben Viewport geprüft), Sammlung „Hochwasser
  Donau 2026".
- **T** – ablösendes Tablet der nächsten Schicht.
- **B** – zweites Telefon, Zugführer mit eigenem Bogen (Zugtrupp, OV
  Biberach), der am Bereitstellungsraum auch Einheiten schnell aufnimmt.

Erwartete Arbeitsfolge. Wo der reale THW-Ablauf nicht bekannt ist, steht
**Annahme**:

1. Alarm, der Gruppenführer legt den Bogen an: Einheit, Einsatz, Namen der
   Mitfahrenden, Fahrzeuge, Sofortbedarf. **Annahme:** Die Namen liegen oft
   schon als Liste vor (Alarmierungs-App, Chat) und werden eingefügt.
2. Unterbrechung während der Fahrt, später weitermachen.
3. Ankunft am Meldekopf. Übergabe per QR, Link oder PDF, und der Meldekopf
   hat die Einheit in der Lage.
4. Lageänderung: Eine Person fällt aus, ein Truppmitglied wird Unterführer.
   Die Einheit meldet neu, und der Meldekopf sieht, was sich geändert hat.
5. Der Meldekopf nimmt eine Einheit ohne Bogen schnell auf, ordnet Züge zu,
   vermerkt Aufträge und lässt Einheiten abrücken.
6. Schichtwechsel: Die Sammlung geht an T und läuft dort weiter. Das alte
   Gerät bekommt noch einen Nachzügler, und T übernimmt ihn nachträglich.
7. Einsatzende auf Einheitsseite: Beginn und Ende eintragen, den Bogen für
   den nächsten Einsatz vorbereiten. **Annahme:** Beim nächsten Alarm
   fährt ein Teil der Stammbesetzung mit.
8. Ein Zugführer führt den eigenen Bogen und nimmt auf demselben Telefon
   fremde Einheiten auf.

Durchgeführt:

- **Szenario 1 (A):** „Neuen Bogen erstellen" → Einheitstyp „Bergungsgruppe"
  → OV „Ulm" aus den Vorschlägen (RB, LV werden ergänzt) → Neuladen →
  „Fortsetzen" → Einsatzort → „Namen einfügen…" mit 9 Zeilen → Kennzeichen →
  Sofortbedarf (Diesel 120 l) → „Bogen übergeben…": QR-Vollbild, Link, PDF.
- **Szenario 2 (A → M):** M legt die Sammlung an und öffnet den Link. A
  macht Maier zum Unterführer, entfernt Fischer und sendet neu. M hängt
  die neue Fassung an und prüft „Änderungen" und „Historie". Dann sendet A
  den ersten Link noch einmal (veraltete Fassung). M liest das PDF von A
  zusätzlich über „Bögen einlesen…" in eine frische Sammlung ein.
- **Szenario 3 (M):** Schnellerfassung THW Neu-Ulm FGr WP (A) von der
  Startseite, „In Einsatz aufnehmen…", „Zug zuordnen" (1. TZ) für beide,
  „Auftrag/Notiz", „Abrücken".
- **Szenario 4 (M → T):** „Einsatz weitergeben / sichern" → T „Einsatz
  importieren…". T lässt Ulm abrücken. M nimmt Kulmbach per Link auf und
  exportiert erneut, T importiert noch einmal. Danach sichert T bei null
  Anwesenden und erzeugt ein „Lageblatt (1 Seite)".
- **Szenario 5 (B):** eigener Bogen Zugtrupp, Sammlung „Übung Zugführer",
  dann zwei Schnellerfassungen (Neu-Ulm, Kulmbach) von der Startseite, jede
  abgelegt.
- **Szenario 6 (A):** Einsatzbeginn und -ende eintragen, „Als Vorlage
  speichern", „Neuer Bogen", „Einsatz vorbereiten" mit zwei abgewählten
  Personen, „Einsatz starten".

Nicht prüfbar waren der Kamera-Scan, die Nahbereichs-Weitergabe, der
Handscanner und die nativen Builds. Inhalt von Lageblatt, Sammel-PDF, CSV und
Excel habe ich nicht gegengelesen; die Dateien wurden nur erzeugt oder
zurückimportiert.

## Urteil

Der Kernablauf trägt jetzt von Anfang bis Ende. Ein Bogen ist in wenigen
Minuten angelegt. Der Meldekopf nimmt einen Link mit einem Tipp in die offene
Sammlung und eine Folgemeldung mit zwei Tipps. Danach sieht er „seit
281123sep26: Stärke 9 → 8" samt Personenliste der Änderungen. Zug, Auftrag,
Abrückzeit und Historie wandern mit der Sammlung auf das Ablösegerät. Ein
zweiter Import ergänzt dort nur das Neue und lässt lokale Statuswechsel
stehen. Das Einsatzende ist gesichert. Die Runde-1-Lücken (Empfang außerhalb
der Sammlung, keine Weitergabe am Einsatzende, keine Abrückzeit) sind zu.

Reibung entsteht an den Übergängen zwischen zwei Einsätzen und zwischen zwei
Rollen auf einem Gerät. Der vorbereitete Folgeeinsatz übernimmt still den
Kraftstoff- und Verpflegungsbedarf des letzten Einsatzes (R2-W1). Das Telefon
der Einheit zeigt nicht, ob der Meldekopf den aktuellen Stand hat (R2-W2).
Die Schnellerfassung zählt ungeprüfte Soll-Fahrzeuge in die Lage (R2-W3).
Unabhängig nachgestellt habe ich den schwersten Befund aus
[neuer-nutzer.md](neuer-nutzer.md): Wer auf einem Telefon den eigenen Bogen
führt und zweimal schnell erfasst, verliert den eigenen Bogen (R2-N1). Die
Marke „alt" steht an jeder Meldung, auch an einer vier Minuten alten
(R2-N4).

Die Aufgabe ist ohne fremde Hilfe zu schaffen. Szenario 5 (Doppelrolle auf
einem Gerät) endet aber mit Datenverlust.

## Befunde

### R2-W1 [P1] Der vorbereitete Folgeeinsatz übernimmt den Sofortbedarf des letzten Einsatzes (neu)

**Priorität:** P1

**Fundstelle / Aufgabe:** Gerät A nach Einsatzende. Gesamtübersicht → „Als
Vorlage speichern" → „Neuer Bogen" → Startseite „Gespeicherte Vorlagen" →
„Einsatz vorbereiten" → zwei Personen abwählen → „Einsatz starten …" →
Übersicht (Stärke danach 0 / 1 / 5 / 6).

**Beobachtung:** Der neue Bogen setzt die Einsatzdaten zurück: Zeitraum
heute, „Ort / Auftrag —", „Beginn / Ende — / —". Unter „Sofortbedarf &
Sonstiges" steht aber weiter „Verpflegung 8 Personen" und „Betriebsstoff
120 l Diesel" aus dem vorigen Einsatz. Die Prüfpunkte melden nur die
Verpflegung („Verpflegung für 8 Personen angefordert, die Gesamtstärke ist
aber 6"), der Diesel bleibt ohne Hinweis. Im Personal-Schritt zieht die
Verpflegung beim Entfernen einer Person mit (Folgemeldung „Verpflegung: 9
Personen → 8 Personen"); über die Musterung geschieht das nicht. Am
Meldekopf erscheint dieser Diesel als Bedarfsmarke „Diesel 120 l" auf der
Karte und in „Kraftstoff" der Summe.

**Erwartung der Rolle:** Die Vorlage hält fest, *wer und was* die Einheit
ist. Was sie *jetzt* braucht, fragt jeder neue Einsatz neu ab, wie Ort und
Beginn.

**Auswirkung im Einsatz:** Die Einheit meldet beim nächsten Alarm einen
Kraftstoffbedarf, den sie nicht hat, und der Meldekopf plant oder bestellt
danach. Wer den Sofortbedarf beim Ausfüllen überspringt (er ist optional),
bemerkt es nicht. Der Fehler wandert still über Gerätegrenzen in die Lage.

**Empfehlung:** Beim Start aus einer Vorlage den Sofortbedarf leeren oder
ausdrücklich zur Bestätigung vorlegen („aus Vorlage: 120 l Diesel —
übernehmen?"). Verpflegung auch nach der Musterung an die Stärke koppeln.

**Verifikation:** Bogen mit 120 l Diesel als Vorlage speichern, „Einsatz
vorbereiten" → „Einsatz starten": Die Übersicht darf keinen Kraftstoffbedarf
zeigen, den niemand in diesem Einsatz eingetragen oder bestätigt hat, und die
Verpflegung muss der Stärke entsprechen.

### R2-W2 [P2] Das Telefon der Einheit zeigt nicht, ob der Meldekopf den aktuellen Stand hat (neu)

**Priorität:** P2

**Fundstelle / Aufgabe:** Gerät A, nach der ersten Übergabe (Link, 11:23)
Stärke geändert (Maier → Unterführer, Fischer entfernt). Startseite,
Gesamtübersicht, Dialog „Bogen übergeben".

**Beobachtung:** Die Startseite zeigt „Stärke 0 / 1 / 7 / 8 · gespeichert
11:29 Uhr". Nirgends steht, dass der Bogen um 11:23 übergeben wurde und
sich seitdem geändert hat. Übersicht und Übergabe-Dialog sehen genauso aus
wie vor der ersten Übergabe. Ob eine neue Übergabe nötig ist, muss der
Gruppenführer selbst im Kopf behalten. (Am Meldekopf ist die Seite gut
gelöst: „seit 281123sep26: Stärke 9 → 8", „Änderungen", „Historie (2)".)

**Erwartung der Rolle:** „Zuletzt übergeben 11:23 — seitdem geändert:
Stärke 9 → 8" dort, wo ich den Bogen wieder öffne. Das ist der Anstoß,
neu zu melden.

**Auswirkung im Einsatz:** Stärkeänderungen erreichen den Meldekopf nur,
wenn jemand daran denkt. Die Lage führt dann eine Person, die längst
abgelöst ist, oder verliert einen Unterführer aus dem Blick. Ohne Netz gibt
es keinen Rückkanal; umso wichtiger ist der Hinweis auf der eigenen Seite.

**Empfehlung:** Den Zeitpunkt der letzten Übergabe (QR, Link, PDF,
Nahbereich) am Bogen merken und auf Startseite und Übersicht zeigen. Weicht
der Bogen davon ab, die geänderten Kernzahlen nennen und „Neu übergeben"
anbieten.

**Verifikation:** Bogen übergeben, eine Person entfernen, App neu laden: Die
Startseite muss „seit der Übergabe um … geändert" mit der Stärkeänderung
zeigen.

### R2-W3 [P2] Schnellerfassung zählt ungeprüfte Soll-Fahrzeuge in die Lage (neu; Umfeld R2-N6)

**Priorität:** P2

**Fundstelle / Aufgabe:** Gerät M, Startseite → „Einheit schnell erfassen
(nur Stärke)…" → Name „Neu-Ulm", Einheitstyp „FGr WP (A)" → Stärke 0/1/8 →
„In Einsatz aufnehmen…".

**Beobachtung:** Mit dem Einheitstyp kommen „Vorbelegt nach StAN: 4
Fahrzeuge (Kennzeichen offen)". Der Meldekopf hat nur die Stärke erfragt.
Nach dem Ablegen steigt „Fahrzeuge" in der Summe von 2 auf 6; die Karte
trägt „6 Lücken" (Ort/Auftrag, Erreichbarkeit, viermal Kennzeichen). Weg
bis zum Ablegen: sechs Schritte, darunter Schritt 2 „Wofür deine Einheit
gemeldet wird" und Schritt 4 mit vier Fahrzeugkarten. Der Vorbelegungstext
auf Schritt 1 sagt auch bei reinen Fahrzeugen: „Sie zählen in die Stärke".

**Erwartung der Rolle:** Schnellerfassung heißt: Name, Stärke, fertig. Was
ich nicht gesehen habe, zählt nicht. Die Fahrzeugzahl in der Lage stammt von
der Einheit oder von mir.

**Auswirkung im Einsatz:** Die Fahrzeugsumme am Meldekopf enthält Soll-
Fahrzeuge, die möglicherweise gar nicht gekommen sind (**Annahme:**
Fachgruppen rücken nicht immer mit dem vollen StAN-Fahrzeugsatz aus). Wer
Stellplätze oder Kraftstoff nach dieser Summe plant, rechnet falsch. Die
„Lücken" der Schnellerfassungen verwässern die Marke für echte Lücken.

**Empfehlung:** In der Schnellerfassung keine Fahrzeug-Vorbelegung laden
oder sie als „Soll, nicht bestätigt" führen und nicht mitzählen. Der
Schnellerfassung nur die Lücken vorhalten, die zu ihr gehören. Zum Rest des
Wegs (Zielsammlung, Rückweg, Schrittfolge) siehe R2-N6.

**Verifikation:** Eine FGr WP nur mit Stärke schnell erfassen und ablegen:
„Fahrzeuge" in der Summe darf sich nicht ändern, die Karte darf keine
Kennzeichen-Lücken tragen.

### R2-W4 [P3] Einsatzzeiten laufen nur in eine Richtung (neu)

**Priorität:** P3

**Fundstelle / Aufgabe:** Gerät A, Schritt 2 „Einsatz"; Gerät M, Karte
„eingetroffen 11:26 ändern · abgerückt 11:38 ändern".

**Beobachtung:** Schritt 2 erklärt bei „Einsatzbeginn eintragen /
Einsatzende eintragen": „meist trägt das der Meldekopf beim Eintreffen bzw.
Abrücken ein". Die Zeiten des Meldekopfs stehen aber nur in *seiner*
Sammlung. In den Bogen der Einheit kommen sie nicht zurück. Der Bogen auf A
zeigt „Beginn / Ende — / —", bis die Einheit selbst etwas einträgt.

**Erwartung der Rolle:** Wenn der Meldekopf die Zeiten führt, brauche ich
sie nicht. Wenn nicht, sagt mir die App, dass ich sie selbst eintragen muss.

**Auswirkung im Einsatz:** Wer dem Hinweis folgt, hat im eigenen PDF keine
Einsatzzeiten. **Annahme:** Die Einheit braucht Beginn und Ende für eigene
Nachweise (Einsatzbericht, Freistellung, Abrechnung). Die Zeiten werden dann
nachträglich aus dem Gedächtnis oder per Rückfrage beim Meldekopf ergänzt.

**Empfehlung:** Den Hinweis auf die Rolle der Einheit beziehen: „Für den
eigenen Bogen hier eintragen; der Meldekopf führt seine Zeiten getrennt".
Alternativ vor der Übergabe oder am Einsatzende auf leere Zeiten hinweisen.

**Verifikation:** Einen Helfer den Bogen bis zum Einsatzende führen lassen,
ohne Hinweis. Das erzeugte PDF muss Beginn und Ende tragen, oder die App
muss vorher sichtbar danach gefragt haben.

### R2-W5 [P3] Nach der Schichtübergabe führen zwei Geräte dieselbe Sammlung, ohne es zu zeigen (neu)

**Priorität:** P3

**Fundstelle / Aufgabe:** Gerät M → „Einsatz weitergeben / sichern" → Gerät
T „Einsatz importieren…"; danach beide Geräte weiter bedient.

**Beobachtung:** Nach der Übergabe arbeitet M normal weiter, ohne Hinweis,
dass die Sammlung jetzt bei T geführt wird. M nahm Kulmbach auf, T ließ Ulm
abrücken. Ein zweiter Import auf T meldete „1 neue Meldung(en) ergänzt" und
ließ das Abrücken auf T stehen. Das Zusammenführen funktioniert also, aber
nur, wenn jemand erneut exportiert und importiert. Umgekehrt weiß M nichts
von T. Die Sammlung hat keinen Abschluss: Bei null Anwesenden steht sie
unverändert mit „0 Einheit(en) anwesend" und „Löschen…" auf der Startseite,
einen Zustand „abgeschlossen / übergeben an" gibt es nicht.

**Erwartung der Rolle:** Nach der Übergabe sagt das alte Gerät „übergeben
um 11:39 — hier nur noch lesen oder Nachzügler weiterreichen". Am Ende
kann ich eine Sammlung abschließen, damit niemand mehr hineinbucht.

**Auswirkung im Einsatz:** Ein Nachzügler landet auf dem alten Tablet und
fehlt in der Lage der neuen Schicht, bis jemand es bemerkt. Nach mehreren
Einsätzen stehen offene Sammlungen nebeneinander, die alle gleich aussehen.

**Empfehlung:** Den Export als Übergabe vermerken („Übergeben 11:39") und in
der Einsatzansicht zeigen. Einen Abschluss der Sammlung anbieten, der nur
noch Lesen und Weitergeben erlaubt und auf der Startseite erkennbar ist.

**Verifikation:** Sammlung übergeben und auf dem alten Gerät öffnen: Der
Übergabezeitpunkt muss sichtbar sein. Eine abgeschlossene Sammlung darf beim
Link-Empfang nicht als Ziel angeboten werden.

### R2-W6 [P3] Kleinere Brüche im Ablauf (neu)

**Priorität:** P3

**Fundstelle / Aufgabe:** verschiedene, siehe Liste.

**Beobachtung:**
- **QR-Vollbild ohne Absenderangabe:** Das Vollbild zeigt nur den Code und
  „Der Bildschirm bleibt an …", keine Einheit und keine Stärke. Wer am
  Meldekopf mehrere Telefone nacheinander scannt, kann vor dem Scan nicht
  gegenprüfen, welcher Bogen gerade gezeigt wird.
- **PDF-Import ohne Siegel:** Derselbe Bogen kommt über den Link mit „✓
  signiert 3b72 2a23 9877 d890" an. Über „Bögen einlesen…" als PDF heißt er
  nur „Aus Datei"; die Meldung trägt keine Signatur. Laut Übersicht steht
  derselbe Code auf der letzten PDF-Seite.
- **Eintreffzeit springt:** Direkt nach „Als neue Fassung anhängen" zeigte
  die Karte „eingetroffen 11:30" (Zeit der Folgemeldung), nach dem Neuladen
  richtig „eingetroffen 11:26". Einmal beobachtet.
- **„Verwerfen" sagt mehr, als passiert:** Der Dialog zu „Neuer Bogen" sagt
  „… der gespeicherte Entwurf gelöscht". Danach steht der Bogen als „Zuletzt
  verdrängter Bogen" zur Rückholung bereit.

**Erwartung der Rolle:** Vor dem Scan sehe ich, *wen* ich scanne. Derselbe
Bogen ist auf jedem Weg gleich echt. Zeiten stehen fest. Dialoge sagen, was
geschieht.

**Auswirkung im Einsatz:** Einzelne Rückfragen und kurze Unsicherheit.
Einmal wird eine Mail-Meldung für weniger vertrauenswürdig gehalten als
dieselbe per QR.

**Empfehlung:** Einheitsname und Stärke groß über dem Vollbild-QR. Siegel
beim PDF-Import aus dem QR mitlesen. Eintreffzeit der Folgemeldung sofort
richtig anzeigen. Den Verwerfen-Text an die Rückholung anpassen.

**Verifikation:** Jeden Punkt einzeln nachstellen, wie oben beschrieben.

## Bestätigt aus anderen Runde-2-Berichten

Die folgenden Stellen habe ich unabhängig beobachtet. Sie sind in
[neuer-nutzer.md](neuer-nutzer.md) beschrieben und werden hier nicht noch
einmal als eigene Befunde gezählt:

- **R2-N1 [P0]** Doppelrolle auf einem Telefon (Szenario 5). Eigener Bogen
  „THW Biberach/Baden Zugtrupp Fachzug Führung/Kommunikation" angelegt, dann
  von der Startseite zwei Einheiten schnell erfasst und abgelegt. Die erste
  Rückfrage verspricht „bleibt … unter ‚Zuletzt verdrängten Bogen
  zurückholen' erreichbar". Die zweite fragt nur nach „THW Neu-Ulm", die
  schon in der Sammlung liegt. Danach ist der Zugtrupp-Bogen weg: nicht auf
  der Startseite, in keinem `localStorage`-Schlüssel. Aus Ablaufsicht ist das
  der typische Zugführer-Fall: eigener Bogen und Meldekopf im
  Bereitstellungsraum auf einem Gerät.
- **R2-N2 [P1]** „Namen einfügen…" mit 9 Zeilen ersetzte die StAN-Sollplätze
  samt GrFü und TrFü. Die Stärke fiel von 0/2/7/9 auf 0/0/9/9, die Vorschau
  zeigte jede Zeile „· Mannschaft". Ergänzend: Keiner der Prüfpunkte in
  Übersicht und Übergabe-Dialog meldet eine Bergungsgruppe ohne jede
  Führungskraft. Der Fehler reiste so ungebremst bis an den Meldekopf
  (Karte „Stärke 0 / 0 / 9 / 9"). Erst die Folgemeldung korrigierte ihn.
- **R2-N4 [P2]** Marke „alt" an jeder Meldung dieser Prüfung: am per Link
  empfangenen Bogen (Stand 11:23, eingetroffen 11:26), an der Folgemeldung,
  an der Schnellerfassung (Stand 11:32, eingetroffen 11:32), am PDF-Import und
  nach dem Import auf T. Im gespeicherten Eintrag steht `bogen.stand` als
  Minutenwert (`3545963`), die Eintreffzeit als Millisekunden. Die Prüfung
  „mehr als 24 Stunden" schlägt damit immer an. Weil die Marke ausnahmslos an
  jeder Meldung steht, wiegt sie aus Ablaufsicht schwerer als P2. Der
  Meldekopf lernt, sie zu übersehen, und erkennt den echten Fall nicht
  mehr (ein am Vortag ausgefüllter, nie aktualisierter Bogen).
- **R2-N5 [P2]** Nach dem Ablegen der Schnellerfassung Neu-Ulm (Stärke 9, ohne
  Sofortbedarf) zeigte M „GESAMT 17", aber „Verpflegung 8".
- **R2-N6 [P2]** Schnellerfassung von der Startseite: „‹ Startseite",
  Schritt 2 „Wofür deine Einheit gemeldet wird", Ablegen-Dialog „Dein Bogen
  wird als Meldung abgelegt und bleibt hier geöffnet"; der fremde Bogen
  steht danach als eigener Entwurf auf der Startseite. Die Fahrzeugfolge
  daraus steht in R2-W3.
- **R2-N7 [P2]** „Fortsetzen" nach Unterbrechung in Schritt 1 öffnete die
  Gesamtübersicht. „‹ Einsätze" aus einer frisch angelegten Sammlung führte
  auf Gerät B in die Gesamtübersicht des eigenen Entwurfs, auf M (ohne
  eigenen Entwurf) zur Startseite.

## Was gut funktioniert und erhalten bleiben sollte

- **Empfang in die Sammlung:** Ein Link mit offener Sammlung öffnet „Meldung
  von ‚THW Ulm Bergungsgruppe' empfangen — Stärke 0 / 0 / 9 / 9. Wohin
  damit?" mit „In ‚Hochwasser Donau 2026' aufnehmen" als erster Wahl. Der
  empfangene Bogen liegt danach nicht als Entwurf auf der Startseite.
- **Folgemeldung:** „Einheit ist bereits gemeldet — Als neue Fassung
  anhängen". Danach zeigt die Karte „seit 281123sep26: Stärke 9 → 8", und
  „Änderungen" listet „Unterführer: 0 → 1 … − Fischer, Ole (Mannschaft) …
  Maier, Klaus — Funktion: Mannschaft → Unterführer … Verpflegung: 9 → 8".
  Das ist die Schichtübergabe-Information in einem Blick.
- **Wiederholung ohne Rückfrage:** Die ältere Fassung, noch einmal gesendet,
  wird mit „Bereits vorhanden — übersprungen (gleicher Inhalt)" quittiert.
- **Schichtübergabe:** „Einsatz weitergeben / sichern" funktioniert auch bei
  null Anwesenden und quittiert „… mit allen Meldungen, Zeiten und
  Historie". Auf T sind Zug „1. TZ", „Auftrag/Notiz: Deich Söflingen
  Abschnitt 3 ab 12:00", „abgerückt 11:38" und „Historie (2)" da. Der zweite
  Import ergänzt nur das Neue.
- **Abrücken:** Quittung „‚THW Neu-Ulm …' abgerückt 11:38 — Rückgängig",
  Summen fallen sofort, Karte „abgerückt 11:38 ändern", „Als anwesend" als
  Rückweg.
- **Vorlage und Musterung:** „Einsatz vorbereiten" als Ankreuzliste mit
  Stärke-Vorschau, „Einsatz starten · 8 Pers · 2 Fz" (vor dem Abwählen). Einsatzort und Zeiten
  werden dabei zurückgesetzt, anders als der Sofortbedarf (R2-W1).
- **OV-Vorschlag:** „Ulm" füllt Kürzel, Rufnummer, Mail sowie RB Biberach und
  LV Baden-Württemberg; der Funkrufname „Heros Ulm 22/51" steht am GKW. Das
  erspart Doppeleingaben, die sonst auf jedem Bogen neu anfielen.
- **Wiedereinstieg:** Neuladen am Meldekopf öffnet die zuletzt offene
  Sammlung. Auf dem Einheitstelefon steht der Entwurf mit „Fortsetzen" oben.
- **Quittungen:** „✓ PDF gespeichert: eeb-281144sep26_THW_Ulm_Bergungsgruppe.pdf
  — liegt im Download-Ordner des Browsers", „1 Bogen/Bögen aufgenommen.",
  „Einsatz … 1 neue Meldung(en) ergänzt."

## Abschluss

- **Aufgabe geschafft:** mit Umwegen. Einheit melden, neu melden, sammeln,
  abrücken, Schicht übergeben und Einsatz sichern: ja. Nächsten Einsatz
  vorbereiten: ja, aber mit falschem Sofortbedarf (R2-W1). Eigener Bogen und
  Meldekopf auf einem Telefon: nein, der eigene Bogen ging verloren (R2-N1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die Vorlage gilt als Stammdaten der Einheit,
  bringt aber den Kraftstoff- und Verpflegungsbedarf des letzten Einsatzes mit
  (R2-W1).
- **Größtes Einsatzrisiko:** Ein Zugführer, der auf demselben Telefon den
  eigenen Bogen führt und zwei Einheiten schnell aufnimmt, verliert den
  eigenen Bogen ohne Warnung (R2-N1). Unter den eigenen Befunden: falscher
  Bedarf und unbemerkt veraltete Stärke reisen still zum Meldekopf (R2-W1,
  R2-W2).
- **Top-Priorität für die nächste Iteration:** Fremde Schnellerfassungen dürfen
  den eigenen Bogen nie verdrängen (R2-N1). Danach: Sofortbedarf beim Start aus
  einer Vorlage nicht still übernehmen (R2-W1).

## Abgleich mit Runde 1

Grundlage: [../arbeitsablauf.md](../arbeitsablauf.md) und
[../README.md → Stand der Behebung](../README.md#stand-der-behebung).

| Runde-1-Befund | Bewertung Runde 2 | Beobachtung |
| --- | --- | --- |
| W1 Empfang außerhalb des Einsatzes | bestätigt behoben | Link bei offener Sammlung: ein Tipp „In ‚Hochwasser Donau 2026' aufnehmen" (Folgemeldung: zwei), ohne Umweg über die Übersicht. Der empfangene Bogen bleibt danach nicht als Entwurf stehen. Datei-Weg im Einsatz: „Bögen einlesen…" mit „1 Bogen/Bögen aufgenommen.". Nahbereich nicht prüfbar. Rest: Siegel geht beim PDF-Import verloren (R2-W6). Die Schnellerfassung von der Startseite hat das Entwurfsproblem weiter (R2-N1, R2-N6). |
| W2 Weitergabe der Sammlung | bestätigt behoben | „Einsatz weitergeben / sichern" mit Erklärtext im Bild, funktioniert bei null Anwesenden. T übernimmt Zug, Notiz, Abrückzeit und Historie, ein zweiter Import ergänzt nur das Neue. Offen bleibt, dass das alte Gerät nichts von der Übergabe weiß (R2-W5). |
| W3 Abrücken ohne Zeitpunkt | bestätigt behoben | „abgerückt 11:38 — Rückgängig", Karte „abgerückt 11:38 ändern", nach dem Import auf T erhalten. CSV- und PDF-Inhalt nicht gegengelesen. |
| W4 Verpflegung doppelt geführt | teilweise | Im Personal-Schritt zieht die Verpflegung mit (Folgemeldung „Verpflegung: 9 Personen → 8 Personen"). Nach „Einsatz vorbereiten" bleibt sie beim alten Wert (8 bei Stärke 6), nur ein Prüfpunkt meldet es (R2-W1). Schnellerfassung ohne Sofortbedarf fehlt in der Bedarfssumme (R2-N5). Die Bedarfsmarke für eine Abweichung am Meldekopf habe ich nicht geprüft. |
| W5 Kaltstart auf der Startseite | bestätigt behoben | Neuladen am Meldekopf öffnet direkt die Sammlung „Hochwasser Donau 2026". |
| W6 PDF ohne Quittung | bestätigt behoben | „✓ PDF gespeichert: … — liegt im Download-Ordner des Browsers" im Übergabe-Dialog, Quittung auch nach „Einsatz weitergeben / sichern". Den Knopf „Sammel-PDF" selbst habe ich nicht bedient. |
| W7 Quelle „manuell" | bestätigt behoben | Karten zeigen „Empfangen" (Link), „Manuell erfasst" (Schnellerfassung), „Aus Datei" (PDF). Rest zum fehlenden Siegel beim PDF in R2-W6. |

Einordnung der eigenen Befunde: R2-W1 bis R2-W6 sind neu. R2-W1 enthält den
Rest von W4, R2-W5 den Rest von W2, R2-W6 den Rest von W1/W7 (Siegel beim
PDF-Import). R2-W3 ergänzt R2-N6 um die Folge für die Fahrzeugsumme.

Bilanz: Von sieben Runde-1-Befunden sind sechs bestätigt behoben (W1–W3,
W5–W7), W4 ist teilweise umgesetzt. Das größte Runde-1-Risiko ist weg: Die
Sammlung lässt sich am Einsatzende sichern und weitergeben, mit
Abrückzeiten. Die neuen Risiken liegen an den Rändern des Ablaufs: beim
Übergang zum nächsten Einsatz (R2-W1), beim Rückkanal zur Einheit (R2-W2) und
bei der Doppelrolle auf einem Gerät (R2-N1).
