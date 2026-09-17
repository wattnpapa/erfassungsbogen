# Feldtauglichkeits-Audit (Sicht eines THW-Helfers)

Stand: 17.09.2026 · Prüfer: Rollenaudit „THW-Helfer im Feld" (Skill
`thw-field-user-reviewer`) · Prüfgegenstand: Web-App, Zweig
`claude/thw-helfer-skill-audit-z6zv73`, Commit `b7a12c5`.

## Prüfaufbau

Getestet mit Chromium (Playwright), Viewport 360 × 640 px, `isMobile`/`hasTouch`,
Locale de-DE — also auf einem kleinen Telefon-Bildschirm, nicht auf dem Desktop.
Zwei Stände: Dev-Server (`vite`) für den Durchlauf, Produktionsbuild
(`vite preview`) für Service-Worker und Offline-Verhalten.

Szenarien, jeweils vom natürlichen Einstieg aus:

1. Neuen Bogen anlegen, Einheit/Einsatz/Personal erfassen, zur Übersicht,
   Bogen übergeben. Abgeschlossen: ja.
2. Unterbrechung — App neu laden mitten im Ausfüllen. Abgeschlossen: ja.
3. Fehler machen — eine erfasste Person wieder entfernen. Abgeschlossen: ja,
   aber verlustreich (siehe F1).
4. Ohne Netz arbeiten — offline neu laden, Bogen weiterführen, QR erzeugen.
   Abgeschlossen: ja.
5. QR-Code scannen auf einem Gerät ohne Kamera. Abgeschlossen: ja
   (Handscanner-Weg).
6. Meldekopf-Schnellerfassung „nur Stärke". Abgeschlossen: ja.

Nicht prüfbar in dieser Umgebung und deshalb als *nicht geprüft* markiert:
Sonnenlicht und Dunkelheit, Bedienung mit Handschuhen, Kamera-Scan mit echtem
QR-Code, USB-Handscanner, iOS- und Android-Build, Ladezeiten auf echter
Telefon-Hardware.

Mentales Modell, mit dem ein Helfer ankommt: Er kennt den Papierbogen. Er
erwartet, dass er ihn der Reihe nach ausfüllt, am Ende etwas in der Hand hat,
das der Meldekopf mitnehmen kann — und dass nichts verloren geht, wenn er
zwischendurch weggerufen wird. Die App bedient dieses Modell weitgehend: Der
Assistent folgt der Reihenfolge des Papierbogens, die Übersicht am Ende sieht
aus wie der ausgefüllte Bogen.

## Befunde

### F1 [P1] Person und Fahrzeug werden ohne Rückfrage gelöscht

Nachweis: beobachtet, reproduziert.
Ort: Schritt 3 „Personal", Knopf „Person entfernen" in der Personenkarte;
gleich gebaut in Schritt 4, „Fahrzeug entfernen"
(`src/app/schritte/personal.tsx:312`, `src/app/schritte/fahrzeuge.tsx:96`).
Reaktion des Helfers: Er tippt in einer engen Karte zwischen Sortierpfeilen,
Rollen-Auswahl und Ansprechpartner-Marke — und rechnet damit, dass eine
Löschung nachfragt, weil „Neuer Bogen" und „Entwurf verwerfen" das tun.
Problem: Der Klick löscht sofort. Keine Rückfrage, kein „Rückgängig", kein
Hinweis. Getestet mit einer Person, bei der Vor- und Nachname eingetragen
waren: Karte weg, Stärke fällt von 0/0/1/1 auf 0/0/0/0.
Betriebliche Folge: Erfasste Personendaten (Name, Funktion, Qualifikationen,
Erreichbarkeit — bei voller Erfassung ein Dutzend Felder) sind mit einem
Fehlgriff verloren und müssen neu getippt werden. Bei zwölf Personen in der
Liste trifft der Fehlgriff außerdem womöglich die falsche Karte, weil die Karte
keine sichtbare Nummer trägt (siehe F8).
Empfehlung: Denselben Bestätigungsdialog verwenden, den „Aktuellen Bogen
verwerfen?" schon hat — oder, feldtauglicher, sofort löschen und für zehn
Sekunden ein „Person entfernt · Rückgängig" einblenden. Der Dialog sollte
benennen, wen es trifft („Meyer, Jan entfernen?").
Nachprüfen: Person mit Namen anlegen, „Person entfernen" tippen — es muss
entweder eine Rückfrage kommen oder eine Wiederherstellung möglich sein.

### F2 [P1] Der Übergabe-Dialog wiederholt die offenen Punkte nicht

Nachweis: beobachtet, reproduziert.
Ort: Übersicht → „Bogen übergeben…" → „QR-Code im Vollbild zeigen" /
„PDF erzeugen".
Reaktion des Helfers: Der Meldekopf steht daneben und wartet. Er tippt
„übergeben", zeigt den Code, fertig. Die Warnungen weiter oben auf der
Übersicht hat er beim Scrollen überflogen.
Problem: Ein Bogen ohne Einheitsnamen, ohne Ort/Auftrag und mit Stärke 0 lässt
sich ohne jeden Hinweis als QR-Code und als PDF übergeben. Die Übersicht zählt
in diesem Zustand „3 offene Punkte für die Weitergabe" auf — der Dialog, in dem
die Weitergabe tatsächlich passiert, zeigt davon nichts.
Betriebliche Folge: Der Meldekopf bekommt eine Meldung, aus der weder hervorgeht,
welche Einheit gemeldet hat, noch mit welcher Stärke. Das fällt erst dort auf,
wo es teuer ist: beim Zusammenzählen. Rückfragen sind ohne hinterlegten Absender
nicht möglich.
Empfehlung: Die offenen Punkte in den Übergabe-Dialog übernehmen — kurz, oben,
antippbar wie auf der Übersicht. Das Übergeben nicht sperren (es gibt Lagen, in
denen eine Teilmeldung richtig ist), aber sichtbar quittieren lassen: „3 offene
Punkte — trotzdem übergeben".
Nachprüfen: Leeren Bogen anlegen, sofort „Bogen übergeben…" — die offenen Punkte
müssen im Dialog stehen.

### F3 [P2] „Name (Pflicht)" ist keine Pflicht

Nachweis: beobachtet.
Ort: Schritt 1 „Einheit", Feld mit der Beschriftung „Name (Pflicht)", Knopf
„Weiter →".
Reaktion des Helfers: „Pflicht" heißt für ihn: ohne das hier komme ich nicht
weiter, und wenn doch, sagt es mir jemand.
Problem: „Weiter" führt mit leerem Feld kommentarlos auf Schritt 2. Die einzige
Rückmeldung ist ein „•" statt „✓" in der Schrittleiste — ein Zeichen, dessen
Bedeutung nirgends erklärt wird. Der Fehler fällt erst in der Übersicht auf,
fünf Schritte später.
Betriebliche Folge: Der Bogen wird bis zum Ende ausgefüllt und trägt dann
„(Standort offen)" als Einheitsbezeichnung. Korrigieren heißt zurückspringen,
wenn die Zeit knapp ist.
Empfehlung: Beim Verlassen des Schrittes einen Hinweis direkt am Feld zeigen
(„ohne Namen kann der Meldekopf die Einheit nicht zuordnen") und das Feld
markieren. Weiterlaufen lassen ist in Ordnung, stumm weiterlaufen nicht.
Nachprüfen: Schritt 1 mit leerem Namen verlassen — am Feld muss eine Rückmeldung
stehen.

### F4 [P2] Die Stärke-Zahlen brauchen die Tastatur, die Nebenzahlen nicht

Nachweis: beobachtet.
Ort: Schritt 3 im Modus „Nur Stärke (Meldekopf-Schnellerfassung)": Führer,
Unterführer, Mannschaft, Gesamt.
Reaktion des Helfers: Er zählt durch, tippt die Zahl ein — mit Handschuh, im
Stehen, das Telefon in einer Hand.
Problem: Die vier Stärke-Felder sind nackte Zahleneingaben (112 × 44 px), die
Tastatur muss auf. Direkt darunter haben „vegetarisch" und „vegan" große
−/+-Knöpfe (60 × 52 px). Ausgerechnet die Zahlen, um die es geht, sind die
umständlicheren.
Betriebliche Folge: Die Schnellerfassung ist langsamer als nötig, und die
aufklappende Tastatur verdeckt die restlichen Felder.
Empfehlung: Die −/+-Knöpfe auch für Führer, Unterführer und Mannschaft anbieten
(Tippen auf das Feld weiter für direkte Eingabe). Das ist dieselbe Mechanik, die
bei der Verpflegung schon funktioniert.
Nachprüfen: „Einheit schnell erfassen (nur Stärke)" öffnen — eine Stärke von
0/1/8 muss ohne Tastatur eingebbar sein.

### F5 [P2] Im Feld-Thema bleibt für das Formular kaum Platz

Nachweis: beobachtet, Viewport 360 × 640.
Ort: Kopfbereich in allen Assistentenschritten, Thema „Feld".
Reaktion des Helfers: Er wählt das Thema, das „Feld" heißt, weil er im Feld ist.
Problem: Logo, Themenumschalter, Speicherhinweis und die sechszeilige
Schrittleiste belegen im Feld-Thema rund 390 von 640 px. Sichtbar bleibt eine
Überschrift und eine Optionszeile. Im Standard-Thema sind es rund 330 px.
Betriebliche Folge: Jede Eingabe beginnt mit Scrollen; beim Zurückspringen
zwischen Schritten landet der Blick wieder oben. Die untere Leiste mit
„Zurück/Weiter" ist dagegen gut gelöst und bleibt stehen.
Empfehlung: Den Kopf beim Scrollen zusammenschrumpfen lassen (Schrittleiste auf
eine Zeile, Logo klein), oder die Themenwahl aus dem Assistenten in die
Startseite/Einstellungen verschieben — im Einsatz wird sie einmal gesetzt, nicht
laufend.
Nachprüfen: Feld-Thema, Schritt 3 öffnen — ohne Scrollen muss mindestens das
erste Eingabefeld sichtbar sein.

### F6 [P2] Telefon und E-Mail öffnen die Buchstabentastatur

Nachweis: beobachtet (`type=text`, kein `inputmode`, kein `autocomplete`).
Ort: Schritt 1, „Zugehörigkeit / Kontaktstellen", Felder Telefon und E-Mail;
gleiches Muster bei den Erreichbarkeiten der Personen.
Reaktion des Helfers: Nummer eintippen, mit Daumen, im Regen.
Problem: Ohne `inputmode="tel"` bzw. `type="email"` erscheint die normale
Tastatur; Ziffern liegen eine Umschaltung tiefer.
Betriebliche Folge: Mehr Tipparbeit und mehr Tippfehler ausgerechnet bei der
Nummer, über die der Meldekopf zurückruft.
Empfehlung: `inputmode="tel"` und `autocomplete="tel"` für Telefon,
`type="email"`/`inputmode="email"` für E-Mail.
Nachprüfen: Auf einem Telefon das Telefonfeld antippen — der Ziffernblock muss
zuerst kommen.

### F7 [P2] Kästchen und Auswahlpunkte sind 18 × 18 px groß

Nachweis: beobachtet, gemessen.
Ort: durchgehend — „Dies ist eine Übung" (Schritt 2), „Personal vollständig
erfassen" / „Nur Stärke" und „Detail-Karten" / „Schnelleingabe" (Schritt 3),
„Unterbringung M/W/D angeben".
Reaktion des Helfers: Er zielt mit dem Handschuh auf das Kästchen, nicht auf den
Text daneben.
Problem: Die Kästchen selbst messen 18 × 18 px, die zugehörige Label-Zeile
24 px Höhe. Empfohlen sind rund 44 px. Getroffen wird die Beschriftung mit, aber
nur in ihrer Textzeile.
Betriebliche Folge: Fehlversuche bei nasser oder behandschuhter Hand,
besonders bei „Dies ist eine Übung" — ein Kästchen, dessen falscher Zustand die
Meldung beim Meldekopf in die falsche Spalte schiebt.
Empfehlung: Die Trefferfläche der Beschriftung auf mindestens 44 px Höhe ziehen
und Kästchen im Feld-Thema mitwachsen lassen.
Nachprüfen: Trefferflächen messen; im Feld-Thema gegenprüfen.

### F8 [P3] Personenkarten tragen keine sichtbare Nummer

Nachweis: beobachtet.
Ort: Schritt 3, Detail-Karten.
Problem: In der Karte steht kein „Person 1", nur die Felder Vorname/Nachname.
Für Hilfstechnik ist die Nummer vorhanden (`aria-label="Person 1 entfernen"`),
sichtbar ist sie nicht. Bei mehreren noch namenlosen Personen sind die Karten
nicht auseinanderzuhalten.
Betriebliche Folge: Beim Nachtragen und beim Entfernen (F1) trifft es leicht die
falsche Karte.
Empfehlung: Kartenkopf mit laufender Nummer und, sobald vorhanden, Name und
Rolle — auch als Anker beim Zurückspringen aus der Übersicht.
Nachprüfen: Drei leere Personen anlegen — jede Karte muss eindeutig benannt sein.

### F9 [P3] PDF-Vorschau ohne erkennbaren Fortschritt

Nachweis: beobachtet (4,6 s im Emulator ohne Drosselung); auf echter
Telefon-Hardware eher länger (nicht geprüft).
Ort: Übersicht, „PDF-Vorschau" → „Vorschau anzeigen".
Problem: Der Knopf wechselt auf „Vorschau wird erzeugt…" und wird grau — das
sieht aus wie ein gesperrter Knopf, nicht wie Arbeit. Kein Fortschritt, keine
Zeitangabe.
Betriebliche Folge: Unter Zeitdruck wird mehrfach getippt oder abgebrochen.
Empfehlung: Sichtbare Aktivität (Balken oder Punktanimation) und ein Satz, was
gerade passiert („Bogen wird gesetzt, QR-Code wird gerechnet").
Nachprüfen: Mit gedrosselter CPU (4×) prüfen, ob der Zustand als „arbeitet"
lesbar ist.

### F10 [P3] „Einheit schnell erfassen (nur Stärke)" sieht aus wie der volle Bogen

Nachweis: beobachtet.
Ort: Startseite, Meldekopf-Bereich → „Einheit schnell erfassen (nur Stärke)…".
Problem: Der Einstieg landet im selben sechsschrittigen Assistenten mit
Schritt 1 „Einheit", Schritt 4 „Fahrzeuge", Schritt 5 „Sofortbedarf". Dass der
Schnellmodus nur den Stärke-Teil meint, zeigt erst Schritt 3.
Betriebliche Folge: Der Meldekopf-Bediener, der eine eintreffende Einheit in
zwanzig Sekunden aufnehmen will, rechnet mit einem kurzen Formular und sieht
sechs Schritte.
Empfehlung: Im Schnellmodus die nicht benötigten Schritte ausblenden oder
sichtbar als „übersprungen" kennzeichnen, und den Modus im Kopf benennen.
Nachprüfen: Über den Schnell-Einstieg starten — der Modus muss auf Schritt 1
erkennbar sein.

## Was gut funktioniert und bitte erhalten bleiben sollte

Der Entwurf überlebt die Unterbrechung. Nach einem Neuladen mitten im Ausfüllen
steht oben auf der Startseite eine Karte mit Einheit, Stärke und Uhrzeit sowie
„Fortsetzen"/„Verwerfen", und „Fortsetzen" springt an die Stelle zurück, an der
man war. Der Speicherhinweis („automatisch gespeichert · 17:33 Uhr — bleibt auf
diesem Gerät") beantwortet genau die Frage, die ein Helfer an dieser Stelle hat.

Offline hält, was die Startseite verspricht. Mit dem Produktionsbuild getestet:
Netz abgeschaltet, Seite neu geladen — App startet, Entwurf ist da, Übersicht
rechnet, QR-Code wird erzeugt. Das ist der Kern des Verfahrens und er trägt.

Der Scanner ohne Kamera sagt, was zu tun ist: „Dieses Gerät meldet keine
nutzbare Kamera" und direkt daneben der Handscanner-Weg samt Hinweis auf
Tastaturbelegung und Enter-Abschluss. So sollten Fehlermeldungen aussehen.

Die untere Leiste mit „← Zurück" und „Weiter →" bleibt stehen, beide Knöpfe sind
über 100 × 44 px groß und liegen im Daumenbereich.

Der Vollbild-QR hält per Wake Lock den Bildschirm an und sagt, dass hohe
Helligkeit beim Scannen hilft.

Das Nacht-Thema arbeitet mit Bernstein auf dunklem Grund statt mit gedimmtem
Weiß — brauchbar für den Bereitstellungsraum bei Dunkelheit.

Die offenen Punkte auf der Übersicht sind antippbar und führen an die Stelle,
an der sie sich beheben lassen. Genau das fehlt im Übergabe-Dialog (F2).

Die zerstörenden Aktionen auf Bogenebene fragen nach: „Aktuellen Bogen
verwerfen? — ,THW Oldenburg' wird geschlossen und der gespeicherte Entwurf
gelöscht" mit rotem „Verwerfen und neu beginnen" gegen „Abbrechen". Dieses
Muster ist die Vorlage für F1.

## Verständnisprüfung

Orientierung: verstanden. Schrittleiste, Schrittüberschrift und Rückweg zur
Startseite sind jederzeit sichtbar. Einschränkung: das „•" in der Schrittleiste
ist unerklärt (F3).

Nächster Schritt: verstanden. Der Assistent führt, „Weiter" ist eindeutig, die
Übersicht listet die offenen Punkte auf.

Systemzustand: unsicher. Der Speicherstand wird sauber gemeldet, der Zustand
„fertig zur Weitergabe" dagegen nicht an der Stelle, an der weitergegeben wird
(F2), und der Erzeugungsvorgang der PDF ist nicht als Arbeit erkennbar (F9).

Fehlerbehebung: gescheitert für den Fall Personenlöschung — keine Rückfrage,
kein Rückgängig (F1). Sonst gut: Schrittwechsel und Zurückspringen verlieren
nichts, Neuladen und Offline-Neustart ebenfalls nicht.

Feldtauglichkeit: eingeschränkt, nicht vollständig geprüft. Das Fundament stimmt
— offline, Entwurfsrettung, Papier-Layout, Handscanner-Rückfallweg. Was fehlt,
ist die Härtung gegen den Fehlgriff (F1, F7) und gegen die unvollständige
Meldung im entscheidenden Moment (F2). Sonnenlicht, Handschuhe, Kamera-Scan und
die nativen Builds sind hier nicht prüfbar gewesen und gehören in einen
Praxistest.
