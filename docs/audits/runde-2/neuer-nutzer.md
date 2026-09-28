# Audit „Neuer Nutzer", Runde 2 (THW-Helfer ohne Einweisung)

Stand: 28.09.2026 · Prüfer: Rollenaudit `thw-new-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/adoring-sagan-9vnriv`, Commit 354209b.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-1-Befunde vom 27.09.2026.

## Prüfaufbau

Chromium (Playwright, `/opt/pw-browsers/chromium`), Viewport 360 × 640 px,
`isMobile`/`hasTouch`, Locale de-DE. Ohne Kamera; für den Scanner zusätzlich
mit simuliertem Kameragerät bei verweigerter und bei erteilter Berechtigung.
Getestet habe ich zuerst ohne Blick in die Anleitung, in frühere Berichte
oder in die Dokumentation. Den Runde-1-Bericht und die Tabelle „Stand der
Behebung" habe ich erst danach gelesen. Alle Zustände sind durch Bedienung
entstanden, `localStorage`-Seeds habe ich nicht gebraucht; zwischen den
Skriptläufen blieb der Browserzustand erhalten.

Rolle: Helfer eines THW-Ortsverbands, kennt den Papier-Erfassungsbogen, hat
die App nie gesehen. Szenarien:

1. **Eigenen Bogen melden:** Neuer Bogen → Einheitstyp „Bergungsgruppe" →
   OV „Ulm" aus den Vorschlägen → Einsatzort, Einsatzbeginn → Namen in
   Karten, Tabelle und über „Namen einfügen…" → Kennzeichen → Sofortbedarf
   → Übersicht → „Bogen übergeben…" (QR-Vollbild, PDF, weitere Formate).
2. **Unterbrechen und wieder einsteigen:** Neuladen mitten im Schritt,
   „Fortsetzen", „Verwerfen", Browser-Zurück im Assistenten.
3. **Am Meldekopf sammeln:** „Neue Einsatz-Sammlung…" → „Einheit manuell
   erfassen…" im Einsatz sowie „Einheit schnell erfassen (nur Stärke)…" von
   der Startseite → „In Einsatz aufnehmen…" → „Abrücken", „Entfernen".
4. **QR einlesen:** Scanner ohne Kamera und mit verweigerter Kamera. Den
   eigenen Bogen habe ich per „QR aus Bild einlesen…" (Screenshot des
   Vollbild-QR) in die Sammlung übernommen.
5. **Beides auf einem Gerät:** Der eigene Bogen ist angefangen, dann werden
   am selben Telefon fremde Einheiten schnell erfasst.

Nicht prüfbar waren der Kamera-Scan mit echtem Bild, der Handscanner, die
native Datumsauswahl, die nativen Builds und die Bildschirmtastatur. Auch die
PDF-Vorschau ließ sich nicht prüfen, weil headless Chromium im Vorschau-Rahmen
nur eine dunkle Fläche zeigt; das werte ich nicht als Befund. Das PDF selbst
wurde erzeugt und heruntergeladen, sein Inhalt aber nicht gegengelesen.

## Urteil

Der Einstieg trägt. Die Startseite sagt, wofür die App da ist, und trennt
„Meinen Bogen ausfüllen" von „Bögen sammeln (Meldekopf)". Der Assistent führt
in der Reihenfolge des Papierbogens. Der Einheitstyp mit Kurz- und Langnamen
und der OV-Vorschlag, der RB und LV samt Rufnummern nachträgt, nehmen einem
Neuling viel Tipparbeit ab. Übergabe-Dialog, QR-Vollbild und PDF-Quittung
erklären sich selbst. Die Ausgänge aus Runde 1 sind erreichbar: „Abbrechen"
im Scanner, Browser-Zurück, „‹ Einsatz …" in der Einsatz-Erfassung.

Reibung entsteht jetzt in der Tiefe, nicht mehr am Einstieg. In Schritt 3
überschreiben zwei naheliegende Knöpfe still, was der Helfer vorher
eingetragen oder vorbelegt bekommen hat. Die Schrittleiste meldet
„ausgefüllt", obwohl nur Sollplätze stehen. Wer auf *einem* Telefon den
eigenen Bogen führt und zugleich am Meldekopf schnell erfasst, verliert
beobachtet den eigenen Bogen. Die Dialoge versprechen dabei, er bleibe
erreichbar.

Aufgabe 1 (eigener Bogen) gelingt ohne fremde Hilfe. Aufgabe 3 (Meldekopf)
gelingt über die Einsatzansicht, über die Schnellerfassung von der
Startseite nur mit Umwegen. Das Zusammenspiel aus Szenario 5 endet in einem
Datenverlust.

## Befunde

### R2-N1 [P0] Schnellerfassung von der Startseite verdrängt den eigenen Bogen endgültig (neu)

**Priorität:** P0

**Fundstelle / Aufgabe:** Startseite mit angefangenem eigenem Bogen „THW Ulm
Bergungsgruppe" (7 Namen eingetragen) → „Einheit schnell erfassen (nur
Stärke)…" → Rückfrage bestätigen → fremde Einheit „Aalen" mit Stärke
1/2/9/12 → Übersicht → „In Einsatz aufnehmen…" → „Hochwasser Donau". Danach
über die Startseite die nächste Einheit schnell erfassen.

**Beobachtung:** Die erste Rückfrage sagt: „Der angefangene Bogen ‚THW Ulm
Bergungsgruppe' wird durch die schnell zu erfassende Einheit ersetzt. Er
bleibt auf der Startseite unter ‚Zuletzt verdrängten Bogen zurückholen'
erreichbar." Nach dem Ablegen bleibt „THW Aalen" als Entwurf offen; der Dialog
sagt dazu „Dein Bogen … bleibt hier geöffnet". Die zweite Schnellerfassung
fragt nur noch nach „THW Aalen" und verspricht wieder „bleibt …
erreichbar". Danach zeigt die Startseite „THW Aalen" als verdrängten Bogen.
„THW Ulm Bergungsgruppe" ist weg: Keiner der Namen steht noch irgendwo im
Gerätespeicher, und einen Papierkorb für Bögen gibt es nicht. Dasselbe passiert,
wenn man zwei Schnellerfassungen einfach abbricht (Startseite → schnell
erfassen → „‹ Startseite" → noch einmal). Der Weg über die Einsatzansicht
(„Einheit manuell erfassen…" → „In Einsatz übernehmen") schließt die fremde
Erfassung dagegen und lässt den eigenen Bogen in der Rückholung stehen. Die
beiden Wege verhalten sich unterschiedlich, obwohl sie für den Helfer dasselbe
tun.

**Erwartung der Rolle:** „Mein Bogen" ist etwas anderes als die Einheiten,
die ich für andere erfasse. Wenn ein Dialog sagt „bleibt erreichbar", glaube
ich das auch für den nächsten Schritt. Der Verwerfen-Dialog der Startseite
sagt ehrlich „…bis ein anderer Bogen diesen Platz braucht"; der
Schnellerfassungs-Dialog sagt das nicht.

**Auswirkung im Einsatz:** Ein Zug- oder Gruppenführer füllt vor der Abfahrt
den eigenen Bogen aus und nimmt im Bereitstellungsraum mit demselben Telefon
zwei nachrückende Einheiten auf. Danach ist der eigene Bogen samt Namensliste
verloren. Er merkt es erst, wenn er ihn übergeben will, und muss alles neu
erfassen.

**Empfehlung:** Fremde Schnellerfassungen dürfen den eigenen Bogen nie
verdrängen. Nach dem Ablegen in der Sammlung sollte die Schnellerfassung
geschlossen sein, wie auf dem Weg über die Einsatzansicht. Mindestens muss die
Rückfrage sagen, welcher Bogen dabei endgültig verloren geht.

**Verifikation:** Eigenen Bogen mit Namen anlegen, dann dreimal hintereinander
von der Startseite schnell erfassen und ablegen. Der eigene Bogen muss danach
noch mit allen Namen zurückholbar sein.

### R2-N2 [P1] „Namen einfügen…" und „StAN-Sollplätze laden" überschreiben still, was schon dasteht (neu)

**Priorität:** P1

**Fundstelle / Aufgabe:** Schritt 3 „Personal" nach der Wahl „Bergungsgruppe"
(9 Sollplätze, davon GrFü und TrFü als Funktion).

**Beobachtung:**
- „Namen einfügen…" mit zwei Zeilen („Maier, Klaus" / „Anna Schulz"): Die
  Vorschau zeigt „Maier, Klaus · Mannschaft" / „Schulz, Anna · Mannschaft"
  und „2 Personen übernehmen". Nach dem Übernehmen sind alle 9 Sollplätze
  weg, mit ihnen die Funktionen GrFü und TrFü. Die Stärke springt von
  0/2/7/9 auf 0/0/2/2 (bei fünf Namen auf 0/0/5/5). Ein „Rückgängig" fehlt,
  und weder Vorschau noch Dialog kündigen das an. Zeilen wie „GrFü Maier,
  Klaus" werden als Name „GrFü Maier" übernommen.
- „StAN-Sollplätze laden (9 Personen)": Nachdem 7 Namen eingetragen sind, ist
  der Knopf wieder aktiv. Die Rückfrage lautet: „Die aktuelle Personalliste
  (9 Personen) wird durch die 9 Sollplätze der StAN ersetzt." Hervorgehoben
  ist „Ersetzen". Danach sind alle 7 Namen gelöscht, ein „Rückgängig" gibt es
  nicht. Weil die Stärke bei 0/2/7/9 bleibt, sieht der Helfer an der Zahl
  nicht, dass etwas verloren ging.

**Erwartung der Rolle:** Eingefügte Namen füllen die leeren Plätze auf, der
erste in die GrFü-Stelle. „Sollplätze laden" ergänzt, was fehlt. „Ersetzt"
heißt für einen Neuling nicht, dass die eingetippten Namen gelöscht werden.

**Auswirkung im Einsatz:** Beim ersten Weg fehlt die Führung in der Stärke:
Der Meldekopf sieht 0 Unterführer. Beim zweiten Weg sind die Namen weg, und der
Helfer tippt sie unter Zeitdruck neu, oft nicht mehr vollständig.

**Empfehlung:** Namen zuerst in die leeren Sollplätze einsetzen und das in der
Vorschau zeigen („Maier, Klaus → Platz 1 GrFü"). In der Rückfrage die
betroffenen Namen nennen („7 eingetragene Namen gehen verloren"). Nach beiden
Aktionen eine Quittung mit „Rückgängig" anbieten, wie beim Abrücken.

**Verifikation:** Sollplätze laden, 2 Namen einfügen: Die Stärke muss 0/2/7/9
bleiben, und die Namen müssen auf GrFü und TrFü stehen. Mit 7 Namen
„Sollplätze laden" antippen: Die Rückfrage muss den Namensverlust nennen, und
„Rückgängig" muss alles zurückbringen.

### R2-N3 [P2] Schrittleiste meldet „ausgefüllt", solange nur Sollplätze stehen (neu; „•" als Wiederaufnahme von F6)

**Priorität:** P2

**Fundstelle / Aufgabe:** Schrittleiste oben im Assistenten, direkt nach der
Wahl des Einheitstyps.

**Beobachtung:** Noch bevor Schritt 3 oder 4 besucht wurde, tragen
„3. Personal" und „4. Fahrzeuge" einen Haken; das Screenreader-Label heißt
„ausgefüllt". Die Übersicht zählt zur selben Zeit acht offene Punkte auf,
darunter „7 Personenkarten ohne Angaben" und zwei Fahrzeuge ohne Kennzeichen.
„1. Einheit" zeigt nach der ersten Eingabe weiter nur „•". Das Wort
„begonnen" steht bloß im unsichtbaren Label.

**Erwartung der Rolle:** Ein Haken heißt: erledigt, kann ich überspringen.

**Auswirkung im Einsatz:** Wer sich an den Haken orientiert, springt von
Schritt 2 direkt zur Übersicht und übergibt einen Bogen mit neun namenlosen
Personen. Der Übergabe-Dialog warnt zwar, aber der Helfer hat vorher gelernt,
dass Gelb „immer da" ist.

**Empfehlung:** Haken erst setzen, wenn der Schritt keine eigenen Prüfpunkte
mehr hat. Vorher ein sichtbares Wort („vorbelegt", „begonnen") statt Symbol.

**Verifikation:** Einheitstyp wählen, ohne Schritt 3 zu öffnen: „3. Personal"
darf keinen Haken tragen.

### R2-N4 [P2] Meldekopf-Karte: Marke „alt" an einem Bogen, der 9 Minuten alt ist (neu)

**Priorität:** P2

**Fundstelle / Aufgabe:** Einsatz-Sammlung, Karte der gescannten Einheit
„THW Ulm Bergungsgruppe".

**Beobachtung:** Auf der Karte steht „eingetroffen 10:51 · Stand 281042sep26
[alt] · Empfangen". Laut Tooltip bedeutet „alt": „Der Stand des Absenders
liegt mehr als 24 Stunden vor dem Eintreffen." Tatsächlich lagen zwischen
Stand und Eintreffen 9 Minuten am selben Tag. Daneben stehen „neu" und
„✓ signiert a502 b8b7 5742 c71b". Die Stand-Zeit ist in der Schreibweise
„281042sep26" angegeben, die ein Neuling nicht auf Anhieb liest; der
PDF-Dateiname ist genauso aufgebaut.

**Erwartung der Rolle:** „alt" heißt, dass die Zahlen nicht mehr stimmen und
ich nachfragen muss.

**Auswirkung im Einsatz:** Der Meldekopf misstraut einer frischen Meldung,
fragt per Funk nach oder lässt neu melden. Wenn die Marke öfter falsch
anschlägt, übersieht man sie bald auch dann, wenn sie stimmt.

**Empfehlung:** Die Marke erst nach tatsächlich 24 Stunden setzen. Zeiten in
Karte und Dateiname lesbar ausgeben („28.09., 10:42"), den Fingerabdruck des
Siegels nur im Aufklapper zeigen.

**Verifikation:** Einen gerade erstellten Bogen scannen. Die Karte darf keine
Marke „alt" tragen.

### R2-N5 [P2] „Bedarf (anwesende Einheiten)" zeigt Verpflegung 0 bei 12 anwesenden Helfern (neu)

**Priorität:** P2

**Fundstelle / Aufgabe:** Einsatz-Sammlung nach dem Ablegen der
Schnellerfassung „THW Aalen", Stärke 1/2/9/12, Sofortbedarf nicht
angekreuzt.

**Beobachtung:** Die Kopfzahlen zeigen 12 Gesamt, der Kasten darunter
„Verpflegung 0 (0 vegetarisch / 0 vegan)". In der Schnellerfassung selbst
stand zuvor „0 von 12 vegetarisch/vegan · 12 sonstige". Bei der gescannten
Bergungsgruppe mit angekreuztem Sofortbedarf zeigte der Kasten 9.

**Erwartung der Rolle:** Unter „Bedarf" steht, wie viele Essen ich bestellen
muss.

**Auswirkung im Einsatz:** Wer die Zahl so weitergibt, bestellt für die
schnell erfassten Einheiten kein Essen. Ob die Führungsstelle „Bedarf" wirklich
als Bestellmenge liest, ist eine Annahme.

**Empfehlung:** Kennzeichnen, dass Einheiten ohne Sofortbedarfsangabe fehlen
(„Verpflegung 0 · 1 Einheit ohne Angabe"), oder aus der Stärke vorbelegen wie
im eigenen Bogen.

**Verifikation:** Eine Einheit nur mit Stärke 12 aufnehmen. Der Bedarfskasten
muss 12 zeigen oder ausdrücklich „ohne Angabe" nennen.

### R2-N6 [P2] Schnellerfassung von der Startseite spricht wie der eigene Bogen (Wiederaufnahme von F2, anderer Einstieg)

**Priorität:** P2

**Fundstelle / Aufgabe:** Startseite → „Einheit schnell erfassen (nur
Stärke)…".

**Beobachtung:** Anders als „Einheit manuell erfassen…" in der Einsatzansicht,
das seit Runde 1 „‹ Einsatz ‚Hochwasser Donau'" und „Aufnahme für:
Hochwasser Donau" zeigt, heißt der Rückweg hier „‹ Startseite". Eine Marke
fehlt, und in der unteren Leiste gibt es kein „In Einsatz übernehmen". Der
Hinweis sagt „Es reichen der Name der Einheit hier und die Stärke in Schritt
3", doch „Weiter →" führt auf Schritt 2 mit dem Text „Wofür deine Einheit
gemeldet wird". Der Ablegen-Dialog beginnt mit „Dein Bogen wird als Meldung
abgelegt und bleibt hier geöffnet", zeigt danach aber die Einsatzansicht. Die
Schrittleiste zeigt „1. Einheit •", obwohl der Name vollständig ist.

**Erwartung der Rolle:** Ich erfasse eine *fremde* Einheit für eine Sammlung.
Die App sagt mir, für welche, und bringt mich nach dem Speichern dorthin.

**Auswirkung im Einsatz:** Der Helfer weiß nicht, ob er gerade seinen
eigenen Bogen bearbeitet, und nimmt den Umweg über Schritt 2 und die
Übersicht. Genau diese Unklarheit führt in den Verlust aus R2-N1.

**Empfehlung:** Die Schnellerfassung von der Startseite wie die Erfassung im
Einsatz behandeln: Zielsammlung zuerst wählen, dann Marke, Rückweg „‹ Einsatz"
und „In Einsatz übernehmen" auf jedem Schritt. „Weiter" soll direkt zur
Stärke führen. Überall „die Einheit" statt „dein Bogen" schreiben.

**Verifikation:** Von der Startseite schnell erfassen. Auf jedem Schritt muss
die Zielsammlung sichtbar sein, und nach dem Übernehmen darf kein Entwurf auf
der Startseite liegen.

### R2-N7 [P2] Rückwege führen woanders hin, als sie heißen (neu; „In Einsatz aufnehmen" als Rest von F3)

**Priorität:** P2

**Fundstelle / Aufgabe:** Kopfzeile der Einsatzansicht, Karte „Fortsetzen"
auf der Startseite, Knopf in der Übersicht.

**Beobachtung:**
- „‹ Einsätze" führt ohne offenen Entwurf zur Startseite. Liegt ein Entwurf
  vor, führt es in dessen Gesamtübersicht, beobachtet mit dem eigenen Bogen
  „THW Ulm Bergungsgruppe" und mit der fremden Schnellerfassung „THW Aalen".
  Eine Liste der Einsätze bekommt man in keinem der beiden Fälle zu sehen.
- „Fortsetzen" öffnet nach einer Unterbrechung auf Schritt 1 nicht Schritt 1,
  sondern die Gesamtübersicht mit acht gelben Punkten.
- Der Knopf in der Übersicht heißt weiter „In Einsatz aufnehmen…". Nur der
  Dialog dahinter wurde zu „In Einsatz-Sammlung ablegen" umbenannt.

**Erwartung der Rolle:** „Einsätze" zeigt die Einsätze. „Fortsetzen" bringt
mich dorthin, wo ich aufgehört habe.

**Auswirkung im Einsatz:** Man verliert die Orientierung, besonders am
Meldekopf, wo man zwischen Sammlung und Erfassung hin und her wechselt. Der
Helfer glaubt, im falschen Bogen zu sein, und bricht ab.

**Empfehlung:** Den Rückweg so beschriften, wie er wirkt, oder ihn immer zur
Startseite mit der Einsatzliste führen. „Fortsetzen" soll den zuletzt offenen
Schritt öffnen. Den Knopf in der Übersicht wie den Dialog benennen („In
Einsatz-Sammlung ablegen…").

**Verifikation:** Mit offenem Entwurf aus einer Sammlung „‹ Einsätze" tippen:
Die Liste der Einsätze muss erscheinen. Auf Schritt 1 unterbrechen, dann
„Fortsetzen": Schritt 1 muss offen sein.

### R2-N8 [P2] Schritt 3: erstes Namensfeld rund 900 px unter dem Einstieg, Sollstelle erst unter Geschlecht und Fahrerlaubnis (neu)

**Priorität:** P2

**Fundstelle / Aufgabe:** Schritt 3 „Personal" mit 9 Sollplätzen, Ansicht
nach „Weiter →".

**Beobachtung:** Der erste Bildschirm zeigt drei gelbe Hinweise und die Knöpfe
„Vorbelegung entfernen (9 Personen ohne Namen)" und „StAN-Sollplätze laden".
Das erste Vornamenfeld steht rund 900 px tiefer, die ganze Seite ist etwa
10 000 px lang. Welche Stelle eine Karte besetzt, verrät der Chip „GrFü" oder
„TrFü" unter Geschlecht, Ernährung und Fahrerlaubnis, also erst nach dem
Namensfeld. In der „Schnelleingabe (Tabelle)" fehlt die Funktion ganz (Spalten:
Vorname, Nachname, Zählt als, Geschlecht), und die Tabelle ist 651 px breit bei
326 px Platz. Der größte Knopf im ersten Bild, „Vorbelegung entfernen",
entfernt ohne Rückfrage alle neun Sollplätze. Namen gehen dabei nicht
verloren, und „Sollplätze laden" holt die Plätze zurück.

**Erwartung der Rolle:** Oben steht, wer auf welche Stelle gehört, und
darunter tippe ich die Namen ein.

**Auswirkung im Einsatz:** Namen landen in der falschen Sollstelle, etwa der
Gruppenführer auf einer Helferkarte, und die Stärke „Führer / Unterführer"
stimmt dann nicht. Der Helfer scrollt lange, bevor er das erste Feld erreicht.

**Empfehlung:** Die Sollstelle in den Kartenkopf setzen („Person 1 von 9 ·
GrFü") und in der Tabelle als erste Spalte zeigen. Vorbelegungs-Knöpfe und
Hinweise unter die Liste legen oder einklappen.

**Verifikation:** Schritt 3 mit Sollplätzen öffnen: Das erste Namensfeld und
seine Sollstelle müssen ohne Scrollen sichtbar sein.

### R2-N9 [P3] Kleinere Stolpersteine bei Begriffen und Platzhaltern (neu; Siegel-Ziffern als Rest von F7)

**Priorität:** P3

**Fundstelle / Aufgabe:** Mehrere Stellen.

**Beobachtung:**
- Schritt 1 bei Organisation THW: Der Platzhalter „Organisationsname" lautet
  „z. B. Freiwillige Feuerwehr Wardenburg".
- Schritt 4: Der Kennzeichen-Platzhalter „OL-FW 2041 / THW-84397" steht in
  kräftigem Grau und sieht aus wie ein eingetragener Wert. Beim Funkrufnamen
  ist „eigener Standort" angehakt, ohne Erklärung. Der Funkrufname
  „Heros … 22/51" ist vorbelegt; ob das für Ulm stimmt, prüft der Helfer
  nicht (Annahme: Vorbelegung aus der StAN, nicht aus dem OV).
- Die Stärke „0 / 2 / 7 / 9" steht auf der Entwurfskarte der Startseite und
  in der Übersicht ohne Legende; nur Schritt 3 erklärt
  „Führer / Unterführer / Mannschaft / Gesamt".
- Im QR-Vollbild steht kein Name der Einheit. Wer mehrere Bögen zeigt, sieht
  nicht, welcher gerade offen ist.
- Oben in jedem Schritt stehen die Umschalter „Standard / Dunkel / Feld /
  Nacht". „Feld" lässt sich als Formularbegriff missverstehen, bis man den
  Tooltip liest.

**Erwartung der Rolle:** Beispiele passen zur eigenen Organisation, leere
Felder sehen leer aus, und Zahlen tragen ihre Bedeutung.

**Auswirkung im Einsatz:** Das Kennzeichen wird ausgelassen, weil das Feld
voll aussieht (die Übersicht fängt es ab). Ansonsten kurzes Zögern.

**Empfehlung:** Platzhalter nach Organisation wählen und blasser setzen,
„eigener Standort" mit einem Halbsatz erklären, die Stärke überall mit
„F / UF / M / Ges" beschriften und den Einheitsnamen im QR-Vollbild zeigen.

**Verifikation:** Die Stellen einem ungeschulten Helfer zeigen und ihn sagen
lassen, was dort eingetragen ist und was die Zahlen bedeuten.

## Was gut funktioniert

- Die Startseite erklärt Zweck, Offline-Betrieb und die beiden Rollen. „Neuen
  Bogen erstellen" ist im ersten Bild erreichbar.
- Der Einheitstyp wird mit Kurzname und Langname vorgeschlagen (Suche
  „Berg" → B, B (ASH), FGr BT, FGr SB …). Der OV-Name füllt RB und LV mit
  Kürzel, Rufnummer und Mail nach.
- Schritt 1 und 2 warnen nur noch über ihre eigenen Lücken. „Einsatzbeginn
  eintragen" erklärt, dass es die aktuelle Uhrzeit setzt.
- Übersicht und Übergabe-Dialog listen offene Punkte antippbar auf und sagen
  „Übergeben ist trotzdem möglich". Das PDF quittiert mit Dateinamen und
  Ablageort.
- Das QR-Vollbild ist groß, mit dem Hinweis „Bildschirm bleibt an —
  Helligkeit hoch". Der eigene Code ließ sich aus einem Bildschirmfoto wieder
  einlesen und landete mit Stärke, Bedarf und Siegel in der Sammlung.
- Der Scanner erklärt eine blockierte Kamera mit beiden Einstellungswegen.
  „Abbrechen" ist auch bei langer Meldung sichtbar, Escape schließt.
- Rückfragen stehen vor „Neuer Bogen", „Verwerfen", „Entfernen" und dem
  Überschreiben durch Schnellerfassung. „Abrücken" quittiert mit Uhrzeit und
  „Rückgängig".
- Browser-Zurück geht im Assistenten Schritt für Schritt zurück. Nach dem
  Neuladen steht der Entwurf mit „Fortsetzen / Verwerfen" oben.

## Abschluss

- **Aufgabe geschafft:** eigener Bogen: ja. Meldekopf-Aufnahme: über die
  Einsatzansicht ja, über die Schnellerfassung der Startseite mit Umwegen.
  Eigener Bogen plus Meldekopf auf einem Gerät: nein, der eigene Bogen ging
  verloren (R2-N1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Namen einfügen…" füllt nicht die
  vorbelegten Stellen auf, sondern ersetzt sie samt GrFü/TrFü (R2-N2).
- **Größtes Einsatzrisiko:** Zwei Schnellerfassungen auf demselben Telefon
  löschen den eigenen Bogen, obwohl jede Rückfrage verspricht, er bleibe
  erreichbar (R2-N1).
- **Top-Priorität für die nächste Iteration:** Fremde Schnellerfassungen
  dürfen den eigenen Bogen nie verdrängen, und nach dem Ablegen darf kein
  fremder Entwurf offen bleiben (R2-N1).

## Abgleich mit Runde 1

Grundlage: [../neuer-nutzer.md](../neuer-nutzer.md) und
[../README.md → Stand der Behebung](../README.md#stand-der-behebung).

| Runde-1-Befund | Bewertung Runde 2 | Beobachtung |
| --- | --- | --- |
| F1 Scanner ohne Ausgang | bestätigt behoben | Ohne Kamera und bei blockierter Kamera steht „Abbrechen" im Sichtbereich (unten, bei 360 × 640). Escape schließt, Hinweise zum Handscanner sind eingeklappt. |
| F2 Erfassung im Einsatz wie eigener Bogen | teilweise | Aus der Einsatzansicht behoben: Kopf „‹ Einsatz ‚Hochwasser Donau'", Marke „Aufnahme für: …", „In Einsatz übernehmen" schon auf Schritt 1, Rückweg landet im Einsatz mit „Angefangene Erfassung … Weiter erfassen". Die Schnellerfassung von der Startseite hat keins davon (R2-N6) und verursacht R2-N1. |
| F3 „Einsatz" dreifach belegt | teilweise | Die Startseite sagt „Neue Einsatz-Sammlung…", der Dialog „In Einsatz-Sammlung ablegen". Der Knopf in der Übersicht heißt weiter „In Einsatz aufnehmen…", der Rückweg „‹ Einsätze" führt nicht zu Einsätzen (R2-N7). |
| F4 „Zeitraum bis" vorbelegt | teilweise (wie dokumentiert) | Das Feld heißt „Zeitraum bis (Vorschlag: wie Beginn)" und hat einen Erklärtext. Die Übersicht zeigt weiter „28.09.2026 – 28.09.2026"; leer bleibt es erst nach dem Schemawechsel. |
| F5 Einsatzbeginn/-ende unklar | bestätigt behoben | „Einsatzbeginn eintragen" / „Einsatzende eintragen" mit dem Hinweis „Setzt die aktuelle Uhrzeit, danach änderbar — meist trägt das der Meldekopf …". Das Feld „Einsatzbeginn (Datum, Uhrzeit)" erscheint beschriftet. |
| F6 Hinweise anderer Schritte | teilweise | Schritt 1 zeigt nur „Name fehlt", Schritt 2 nur „Ort/Auftrag leer": behoben. Das „•" in der Schrittleiste ist sichtbar weiter ohne Wort; neu kommen die falschen Haken hinzu (R2-N3). |
| F7 Produktbegriffe | bestätigt behoben (Rest in R2-N9/R2-N4) | „Dienststellen-Kürzel (optional)", „Zählt als", „Erreichbar für Rückfragen", Sitzplätze „9 für 9 Personen", Siegel in der Übersicht ohne Ziffern. Auf der Meldekopf-Karte stehen die Siegel-Ziffern weiter offen da. |
| F8 Leere Karte zählt, Geschlecht „M" | weiterhin offen (bewusst zurückgestellt) | Sollplätze zählen sofort in die Stärke, „Unterbringung M 9 / W 0 / D 0" mit dem Prüfpunkt „bei allen Personen steht die Vorbelegung ‚M'". Die Absicherung wirkt wie in der README beschrieben. |

Einordnung der eigenen Befunde: R2-N1, R2-N2, R2-N4, R2-N5 und R2-N8 sind
neu. R2-N6 nimmt F2 für den zweiten Einstieg wieder auf. R2-N3 ist neu und
greift den Rest von F6 („•") auf, R2-N7 ist neu und enthält den Rest von F3,
R2-N9 ist neu und enthält den Rest von F7.

Bilanz: Von acht Runde-1-Befunden sind drei bestätigt behoben (F1, F5, F7).
Vier sind teilweise umgesetzt (F2, F3, F6 sowie F4 wie dokumentiert), F8 ist
wie angekündigt offen. Die Runde-1-Sackgasse (F1) ist weg. Der schwerste neue
Befund (R2-N1) liegt auf einem Weg, den die F2-Behebung nicht erfasst hat.
