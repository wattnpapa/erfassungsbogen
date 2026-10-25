# Audit „Offline und Speicher", Runde 2 (Funkloch, Kaltstart ohne Netz, voller Speicher)

Stand: 28.09.2026 · Prüfer: Rollenaudit `thw-offline-resilience-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild mit Service Worker (`vite preview`,
Port 4173), Zweig `claude/adoring-sagan-9vnriv`, Commit 354209b.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-1-Befunde vom 27.09.2026. Die Commits nach 354209b auf dem Zweig
ändern nur Prüfberichte unter `docs/audits/runde-2/`; `src/`, `vendor/` und
der laufende Build sind unverändert.

## Prüfaufbau

Chromium (Playwright, `/opt/pw-browsers/chromium`), Viewport 360 × 640 px,
`isMobile`/`hasTouch`, Locale de-DE, keine Kamera. Ich habe persistente
Browserprofile benutzt, damit ein einmal installierter Service Worker einen
neuen Browserstart übersteht, wie auf einem echten Telefon. Netz habe ich
über `context.setOffline` bzw. die Startoption `offline` abgeschaltet.
Langsames und abbrechendes Netz habe ich über `context.route` nachgestellt.
Diese Umleitung greift nachweislich auch für die Anfragen des Service
Workers. Zustände habe ich teils per `localStorage`-Seed aus `examples/thw/`
gesetzt (`eeb.entwurf.v1` mit 013 Ulm B, Links aus 003 Crailsheim und dem
Großbogen), sonst durch Bedienung. Einen vollen Speicher habe ich erzeugt,
indem ich `localStorage` mit Füllschlüsseln bis auf das letzte Zeichen
gefüllt habe. Auf die Füllschlüssel hat die App keinen Einfluss. Die
Beispielbögen tragen `uebung: true`, deshalb steht in allen Bildern der
Übungs-Störer. Auf das Offline-Verhalten hat das keinen Einfluss.

Getestet habe ich zuerst ohne Blick in frühere Berichte. Den Runde-1-Bericht,
die Tabelle „Stand der Behebung" und die vorliegenden Runde-2-Berichte habe
ich erst danach gelesen.

Rolle: Helfer, der nicht mit Netz rechnet. Er will weiterarbeiten und wissen,
was mit seinen Eingaben passiert. Die App hat keinen Server, deshalb heißt
„angekommen" hier: Die Gegenstelle hat QR, Link oder Datei eingelesen.
Szenarien:

1. **Erstbesuch und Offline-Bereitschaft:** Erstbesuch mit gutem Netz. Dann
   mit 600 ms Verzögerung je Anfrage und nach 30 s ins Funkloch. Dann ein
   Netz, das nach 40 Anfragen abbricht. Danach jeweils offline neu laden.
2. **Kaltstart ohne Netz:** neuer Browserstart mit installiertem Service
   Worker im Offline-Modus. Startseite, „Fortsetzen", Anleitung,
   Datenschutz, Beispielbögen, Blanko-Vorlage.
3. **Arbeiten ohne Netz:** Entwurf fortsetzen, Einsatzort ändern, mitten im
   Tippen mehrmals zwischen online und offline wechseln. Neuladen bei
   abbrechender Verbindung (Verbindungsabbruch bei jeder Anfrage) und bei 5 s
   Verzögerung je Anfrage.
4. **Übergeben ohne Netz:** PDF erzeugen, Link teilen, QR-Vollbild. Dasselbe
   auch ohne fertigen Offline-Cache.
5. **Empfangen ohne Netz:** Link auf einem Gerät mit Service Worker, auf
   einem nie besuchten Gerät und zweimal hintereinander in dieselbe
   Sammlung. Außerdem das PDF über „Aus Datei laden…". Sammlung offline
   weitergeben (Sammel-PDF, Excel-Liste, „Einsatz weitergeben / sichern").
6. **Zwei Zustände:** derselbe Entwurf in zwei Tabs, dieselbe Sammlung in
   zwei Tabs mit einem Empfang im zweiten.
7. **Voller Speicher:** Eingabe im Assistenten, PDF, Neuladen, eigenen Bogen
   in eine Sammlung ablegen, fremden Bogen per Link am Meldekopf aufnehmen,
   „Als Vorlage speichern", „Neue Einsatz-Sammlung…". Speicheranzeige in der
   Datensicherung.

Nicht prüfbar: Kamera-Scan und Nahbereichs-Weitergabe (keine Kamera, kein
zweites Gerät), die echte Domain `erfassungsbogen.app` (der geteilte Link
zeigt dorthin, geprüft habe ich mit demselben Fragment auf `localhost`), die
Speicherräumung durch Safari/iOS und andere Browser, das Update-Banner bei
einer neuen Fassung (dafür wäre ein zweiter Build nötig gewesen) und die
nativen Builds.

## Urteil

Nach dem ersten vollständigen Laden ist die App ohne Netz voll da. Ein
Kaltstart im Offline-Modus zeigt Startseite, Entwurf und „Fortsetzen". Bei
5 s Verzögerung je Anfrage stand „Fortsetzen" nach 173 ms, ohne dass eine
Anfrage ins Netz ging. Ein Verbindungsabbruch bei jeder Anfrage stört das
Neuladen nicht. PDF, Link, QR-Vollbild, PDF-Einlesen, Sammel-PDF und
Excel-Liste gehen offline. Ein Wechsel zwischen online und offline mitten im
Tippen ändert an der Oberfläche gar nichts, und das ist hier richtig. Die
Statuszeile sagt ehrlich „bleibt auf diesem Gerät" und meldet einen vollen
Speicher beim Tippen sofort mit dem letzten gesicherten Stand. Eine doppelt
eingelesene Meldung wird als gleicher Inhalt übersprungen. Die Beispielbögen
gehen jetzt offline.

Reibung entsteht an drei Stellen. **Erstens** verspricht die Startseite
„✓ Funktioniert komplett offline", bevor die App tatsächlich offline bereit
ist. Wer beim ersten Aufruf ein schwaches Netz hat und dann ins Funkloch
fährt, bekommt beim nächsten Öffnen die Fehlerseite des Browsers. Von der
App erfährt er davon vorher nichts. **Zweitens** sind die Meldungen bei
vollem Speicher uneinheitlich. Beim Tippen stimmt die Meldung. Beim Ablegen
in eine Sammlung steht sie aber nicht dort, wo gehandelt wurde. Beim
Anlegen einer Sammlung und beim Speichern einer Vorlage fehlt sie ganz. Am
Meldekopf ist der empfangene Bogen dann verworfen, und die Meldung steht
3½ Bildschirme tiefer. **Drittens** ist der „letzte sichere Stand" schwer
zu erkennen. Der Zeitstempel „gespeichert" wird schon beim bloßen Öffnen
erneuert. Ein Entwurf vom Freitag heißt am Montag „gespeichert 12:36 Uhr".
Zwei Fenster mit demselben Bogen überschreiben sich still.

Die Aufgaben „offline weiterarbeiten, übergeben, empfangen" gelingen ohne
fremde Hilfe, solange der erste Besuch vollständig war und der Speicher
nicht voll ist.

## Befunde

### R2-O1 [P1] „Funktioniert komplett offline" steht da, bevor die App offline bereit ist (neu)

**Priorität:** P1

**Nachweis:** beobachtet (Erstbesuch mit gedrosseltem und mit abbrechendem
Netz); die Wirkung im echten Mobilfunk ist ein plausibles Risiko.

**Fundstelle / Aufgabe:** Startseite beim ersten Aufruf, Zeile unter dem
Titel „✓ Funktioniert komplett offline — alle Daten bleiben auf diesem
Gerät." Danach ohne Netz neu laden oder den Bogen als PDF ausgeben.

**Beobachtung:**
- Die Zeile steht sofort beim ersten Aufruf da, unabhängig davon, ob die
  App schon offline bereit ist. Eine Rückmeldung wie „jetzt offline bereit"
  oder einen Fortschritt gibt es nicht. Der Offline-Cache umfasst 551
  Dateien, rund 14,7 MB laut `navigator.storage.estimate()`.
- Gedrosseltes Netz (600 ms je Anfrage): Die Seite war nach 1,4 s
  bedienbar. Nach 31 s lagen 44 von 551 Dateien im Cache, und der Service
  Worker hatte die Seite noch nicht übernommen. Offline neu geladen:
  Browserfehler `ERR_INTERNET_DISCONNECTED`, keine App.
- Abbrechendes Netz (nach 40 Anfragen Funkloch): 23 Dateien im Cache, kein
  aktiver Service Worker. Die Startseite zeigt weiter „✓ Funktioniert
  komplett offline". „Neuen Bogen erstellen" funktioniert, die Statuszeile
  meldet „✓ automatisch gespeichert". Offline neu laden bringt wieder die
  Fehlerseite des Browsers. Erst ein Neuladen mit Netz holt alle 551
  Dateien nach.
- Derselbe Zustand bei offenem Bogen (Service Worker nicht fertig, dann
  offline): „PDF erzeugen" meldet „PDF: Der Baustein dafür ließ sich nicht
  nachladen. Dafür braucht die App einmal Netz — mit Verbindung die Seite neu
  laden …". Die Meldung ist verständlich und ehrlich, widerspricht aber der
  Zusage oben auf der Startseite. QR-Vollbild und Link gehen in diesem
  Zustand.

**Erwartung der Rolle:** Die App sagt mir, *ab wann* sie ohne Netz
funktioniert. Solange sie noch lädt, steht dort „wird für den Offline-Betrieb
geladen …" und nicht „funktioniert komplett offline". Ist sie fertig, will
ich das einmal sehen.

**Auswirkung im Einsatz:** Ein Helfer ruft den Link zur App erst auf der
Anfahrt auf, im Fahrzeug mit wechselndem Mobilfunk. Er füllt den Bogen aus,
und die App sagt ihm „komplett offline". Im Bereitstellungsraum ohne Netz
wird der Tab vom System beendet oder er lädt neu. Dann steht dort eine
Fehlerseite des Browsers statt seines Bogens, obwohl der Entwurf im Speicher
liegt. Übergeben kann er ihn erst wieder, wenn er Netz hat. Bis dahin bleibt
nur Papier, und er weiß nicht, warum.

**Empfehlung:** Die Offline-Zusage erst zeigen, wenn die App tatsächlich
vollständig im Gerät liegt. Bis dahin sichtbar sagen „Wird für den
Offline-Betrieb geladen — bitte mit Netz geöffnet lassen". Den Abschluss
einmal quittieren („Jetzt offline bereit"). Scheitert das Laden, soll die
App das sagen und beim nächsten Netz erneut laden.

**Verifikation:** Erstbesuch mit gedrosseltem Netz, nach 10 s offline gehen:
Die Startseite darf bis dahin nicht „funktioniert komplett offline"
behaupten. Nach vollständigem Laden muss die Bereitschaft einmal sichtbar
bestätigt werden, und ein Offline-Neuladen muss die App zeigen.

### R2-O2 [P1] Voller Speicher: Beim Ablegen, Empfangen, Anlegen und als Vorlage fehlt die Meldung dort, wo gehandelt wird (Wiederaufnahme von O1)

**Priorität:** P1

**Nachweis:** beobachtet (Speicher bis zum letzten Zeichen gefüllt, jeweils
danach neu geladen und den Speicher geprüft).

**Fundstelle / Aufgabe:** Übersicht → „In Einsatz aufnehmen…"; am Meldekopf
Link empfangen → „In ‚Übung Ulm' aufnehmen"; Übersicht → „Als Vorlage
speichern"; Startseite → „Neue Einsatz-Sammlung…".

**Beobachtung:**
- **Eigenen Bogen ablegen:** Ich habe „Schnell-Test" als Ziel gewählt. Der
  Dialog schließt, und der Assistent zeigt weiter „✓ automatisch
  gespeichert" und „✓ Alle Angaben vollständig und plausibel". Eine Meldung
  erscheint nicht. Die Sammlung hat 0 Einträge, der Entwurf ist erhalten.
  Den Fehler („Speichern fehlgeschlagen — der Speicher dieses Geräts ist
  voll …") findet man erst, wenn man über „‹ Startseite" zurückgeht, und
  dort unterhalb des ersten Bildschirms (y = 711 px bei 640 px Höhe).
- **Fremden Bogen am Meldekopf aufnehmen** (Link von Crailsheim, 0/3/9/12):
  Die Seite steht oben. Die Kacheln bleiben bei „1 Einheit · 8 gesamt", eine
  Zeile im Bild gibt es nicht. Dieselbe Fehlermeldung steht als
  `role="status"` am Seitenende über der Fußzeile, bei y = 2 270 px von
  3 456 px. Nach dem Neuladen ist Crailsheim weder in der Sammlung noch als
  Entwurf auf dem Gerät. Der eingelesene Bogen ist verworfen.
- **„Als Vorlage speichern" → „Vorlage speichern":** Der Dialog schließt,
  und es erscheint keine Meldung. In der Konsole steht ein unbehandelter
  Fehler: „Setting the value of 'eeb.vorlagen.v1' exceeded the quota". Mit
  freiem Speicher kommt an derselben Stelle „Als Vorlage ‚THW Ulm
  Bergungsgruppe' gespeichert."
- **„Neue Einsatz-Sammlung…" → „Einsatz anlegen":** Der Dialog schließt, die
  Startseite bleibt stehen, und es gibt weder eine Sammlung noch eine
  Meldung. In der Konsole: „… 'eeb.einsaetze.v1' exceeded the quota".
- Im Assistenten ist es dagegen gut gelöst: Beim Tippen erscheint sofort
  „⚠ Nicht gespeichert — der Speicher dieses Geräts ist voll. Der Bogen
  bleibt geöffnet; bitte jetzt ‚Bogen übergeben' (PDF) … Letzter gesicherter
  Stand: 12:40 Uhr." Das PDF entsteht auch bei vollem Speicher. Nach dem
  Neuladen stand der Bogen tatsächlich auf dem gemeldeten Stand.

**Erwartung der Rolle:** Wenn etwas nicht gespeichert werden konnte, sehe ich
das dort, wo ich getippt habe. Ein Bogen, den ich gerade eingelesen habe,
bleibt so lange offen, bis er sicher abgelegt ist.

**Auswirkung im Einsatz:** Am Meldekopf-Tablet, das über Tage sammelt, ist
der volle Speicher der wahrscheinlichste Fall (siehe Runde 1). Die Einheit
zeigt ihren QR oder schickt den Link und fährt weiter. Der Meldekopf tippt
„aufnehmen", sieht keine Veränderung außer einer gleichbleibenden Zahl und
hält den Eingang vielleicht für erledigt. Der Bogen ist dann weg, und die
Einheit fehlt in der Lage. Beim eigenen Bogen und bei Vorlage oder Sammlung
geht nichts verloren, aber der Helfer glaubt, abgelegt oder angelegt zu
haben, und sucht später vergeblich.

**Empfehlung:** Jede Schreibhandlung meldet ein Scheitern im sichtbaren Bild
an der Stelle der Handlung, am besten im noch offenen Dialog. Ein
empfangener Bogen, der nicht abgelegt werden konnte, bleibt geöffnet oder in
der Empfangsansicht, damit ihn niemand ein zweites Mal scannen muss. Vorlage
und Sammlung melden ihr Scheitern genauso wie der Assistent.

**Verifikation:** Speicher füllen und jede der vier Handlungen auslösen: Die
Meldung muss ohne Rollen im Bild stehen. Der empfangene Bogen muss nach dem
Fehlschlag noch auf dem Gerät sein und später ohne erneuten Scan abgelegt
werden können.

### R2-O3 [P2] „gespeichert" zeigt die Öffnungszeit, nicht den Stand des Entwurfs (neu)

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Startseite mit angefangenem Bogen (Entwurfskarte
und Meldung darunter); Statuszeile im Assistenten.

**Beobachtung:** Ich habe einen Entwurf mit Stand 25.09.2026, 12:36 Uhr
(drei Tage alt) eingespielt und die App am 28.09. um 12:36 offline geöffnet.
- Beim ersten Öffnen stehen auf demselben Bildschirm zwei Angaben: auf der
  Karte „Stärke 0 / 2 / 6 / 8 · gespeichert 12:36 Uhr" (ohne Datum, also
  scheinbar heute) und darunter „Entwurf vom 25.09.26, 12:36 Uhr
  wiederhergestellt."
- Schon das Öffnen schreibt den Entwurf neu, mit der aktuellen Uhrzeit. Im
  Speicher stand danach der 28.09. um 12:36. Beim zweiten Öffnen sagen beide
  Zeilen den 28.09.: „gespeichert 12:36 Uhr" und „Entwurf vom 28.09.26,
  12:36 Uhr wiederhergestellt". Dass der Inhalt drei Tage alt ist, sieht man
  nirgends mehr.
- Die Statuszeile im Assistenten meldet nach „Fortsetzen" ebenfalls
  „✓ automatisch gespeichert · 12:36 Uhr", auch ohne dass etwas geändert
  wurde.

**Erwartung der Rolle:** „Gespeichert um" heißt: So alt ist mein letzter
Eintrag. Ist er nicht von heute, steht das Datum dabei.

**Auswirkung im Einsatz:** Wer die App morgens öffnet, sieht auf der Karte
die Stärke vom letzten Dienstabend mit „gespeichert 7:40 Uhr". Er hält sie
für aktuell und übergibt sie, obwohl zwei Helfer nicht mitgekommen sind.
Ob die letzten Eingaben vor einem Absturz noch drin sind, lässt sich an der
Uhrzeit ebenfalls nicht ablesen.

**Empfehlung:** Als „gespeichert" nur die Zeit der letzten *Änderung*
führen. Bloßes Öffnen soll sie nicht verschieben. Ist die Änderung nicht
von heute, das Datum dazuschreiben. Beide Zeilen der Startseite sollen
dieselbe Angabe machen.

**Verifikation:** Entwurf mit Stand von vor drei Tagen öffnen, schließen,
erneut öffnen: Karte und Meldung müssen beide Male das Datum von vor drei
Tagen zeigen.

### R2-O4 [P2] Zwei Fenster mit demselben Bogen überschreiben sich still (neu)

**Priorität:** P2

**Nachweis:** beobachtet (zwei Tabs im selben Profil, offline).

**Fundstelle / Aufgabe:** Eigener Bogen in Tab A und Tab B geöffnet (z. B.
installierte App und ein Link aus dem Messenger, der im Browser aufgeht).
Schritt 2 „Einsatzort / Auftrag".

**Beobachtung:** A trägt „Ort TAB-A-Aenderung" ein, B danach „Ort
TAB-B-Aenderung". Beide melden „✓ automatisch gespeichert · 12:44 Uhr". Im
Speicher steht B. A zeigt weiter seinen eigenen Text, ohne Hinweis. Tippt A
weiter („Ort TAB-A-zweite"), steht A im Speicher, und die Änderung aus B ist
ohne jede Meldung weg. Bei der Einsatz-Sammlung geht nichts verloren: Tab B
nahm Oldenburg auf (3 Einheiten), Tab A zeigte weiter „2 gemeldet". Nach
„Abrücken" in A standen alle drei Einheiten im Speicher und im Bild. Bis zu
dieser Handlung zeigt A aber einen veralteten Stand, ohne das zu sagen.

**Erwartung der Rolle:** Wenn derselbe Bogen woanders geändert wurde, sagt
mir die App das, bevor sie meine Fassung darüberschreibt.

**Auswirkung im Einsatz:** Auf Telefonen geht ein geteilter Link oft im
Browser auf, während die App schon offen ist. Wer in beiden Fenstern
nachträgt, verliert die Einträge aus einem davon. Die Statuszeile meldet
dabei in beiden „gespeichert". Am Meldekopf zeigt ein zweites Fenster eine
zu kleine Stärke, bis dort jemand etwas tippt.

**Empfehlung:** Änderungen aus einem anderen Fenster erkennen und
übernehmen, oder vor dem Überschreiben fragen („Dieser Bogen wurde in einem
anderen Fenster geändert — neu laden?"). Eine offene Sammlungsansicht soll
sich bei Änderungen aus einem anderen Fenster selbst auffrischen.

**Verifikation:** Zwei Tabs, abwechselnd im selben Feld ändern: Keine
Eingabe darf ohne Hinweis verloren gehen. Empfang in Tab B: Tab A zeigt die
neue Summe ohne eigene Handlung.

### R2-O5 [P2] Link-Übergabe verschweigt, dass die Gegenstelle die App schon einmal mit Netz geöffnet haben muss (neu)

**Priorität:** P2

**Nachweis:** beobachtet auf `localhost`. Für die echte Domain ist es ein
plausibles Risiko (nicht prüfbar).

**Fundstelle / Aufgabe:** „Bogen übergeben…" → „Weitere Formate" → „Link
teilen", Text: „Für Chat, Mail oder Notiz: derselbe Inhalt wie im QR-Code —
öffnet den Bogen beim Antippen."

**Beobachtung:** Der Link lautet `https://erfassungsbogen.app/#…` (632
Zeichen) und wurde offline in die Zwischenablage kopiert („Link kopiert ✓").
Mit demselben Fragment auf `localhost`:
- Gerät mit Service Worker, offline: Der Bogen öffnet, „Empfangen als:
  ✓ signiert …", und die Sammlung wird angeboten.
- Nie besuchtes Gerät, offline: Fehlerseite des Browsers
  (`ERR_INTERNET_DISCONNECTED`), kein Bogen, kein Hinweis.

Der Dialog sagt dazu nichts. „Ganz ohne Internet" steht auf der Startseite
für alle drei Wege.

**Erwartung der Rolle:** Beim Link steht, was die Gegenstelle braucht:
„öffnet sich ohne Netz nur, wenn die App dort schon einmal geladen wurde —
sonst QR oder PDF".

**Auswirkung im Einsatz:** Der Link wird per Messenger an einen
Verbandsführer geschickt, solange es noch Netz gibt. Der hat die App nie
geöffnet und tippt ihn erst im Funkloch an. Dann sieht er nur eine
Fehlerseite. Der Absender glaubt, übergeben zu haben.

**Empfehlung:** Am Link-Knopf kurz sagen, dass die Gegenstelle die App
einmal mit Netz geöffnet haben muss, und für den Fall ohne Netz auf QR oder
PDF verweisen. Beim PDF steckt der Bogen im QR der letzten Seite und reist
ohne diese Voraussetzung.

**Verifikation:** Hinweistext am Link-Knopf lesen. Einen Link auf einem nie
besuchten Gerät offline öffnen: Der Absender muss vorher gewusst haben, dass
das nicht geht.

### R2-O6 [P2] Der Gerätespeicher ist nicht gegen Räumung durch den Browser gesichert, und an eine Sicherung erinnert niemand (neu)

**Priorität:** P2

**Nachweis:** Beobachtet sind `navigator.storage.persisted()` = `false` und
der Dialog „Datensicherung" ohne Angabe zur letzten Sicherung. Die Räumung
selbst ist ein plausibles Risiko und hier nicht prüfbar.

**Fundstelle / Aufgabe:** Startseite („alle Daten bleiben auf diesem
Gerät"), Fußzeile → „Datensicherung".

**Beobachtung:** Die App bittet den Browser nicht um dauerhaften Speicher.
Im Prüfprofil war `persisted()` `false`. Der Dialog „Datensicherung" bietet
„Sicherung erstellen…" an (offline getestet, die Datei entstand). Wann
zuletzt gesichert wurde, sagt er nicht, und von sich aus erinnert die App
nirgends daran. Die Aussage „alle Daten bleiben auf diesem Gerät" steht
ohne Einschränkung da.

**Erwartung der Rolle:** Wenn alles nur auf diesem Gerät liegt, will ich
wissen, wie sicher es dort liegt. Ich will auch wissen, wann ich zuletzt
eine Kopie gezogen habe.

**Auswirkung im Einsatz:** Browser dürfen Website-Daten räumen, wenn der
Gerätespeicher knapp wird. Safari auf iOS löscht die Daten einer nicht auf
dem Homebildschirm abgelegten Seite nach längerer Nichtnutzung (Annahme nach
bekanntem Browserverhalten, hier nicht geprüft). Dazu kommen „Browserdaten
löschen" und Aufräum-Apps. Trifft das die Vorlagen der Einheit oder eine
ruhende Sammlung, ist alles weg, und es gibt keinen Server, der es noch
hätte.

**Empfehlung:** Den Browser um dauerhaften Speicher bitten und das Ergebnis
in der Datensicherung zeigen. „Letzte Sicherung: …" anzeigen und bei
wertvollen Beständen (Vorlagen, laufende Sammlungen) nach einiger Zeit an
eine Sicherung erinnern. Auf iOS zum Ablegen auf dem Homebildschirm raten.

**Verifikation:** Datensicherung öffnen: Sie zeigt, ob der Speicher
dauerhaft ist und wann zuletzt gesichert wurde. Nach einer Sicherung
erscheint das Datum dort.

### R2-O7 [P3] Kleinere Stellen zu Speicheranzeige, Blanko-Vordruck und QR-Vollbild (neu; Speicheranzeige als Rest von O4)

**Priorität:** P3

**Nachweis:** Die ersten drei Punkte sind beobachtet. Der vierte ist
teilweise beobachtet, das Ergebnis war nicht eindeutig.

**Fundstelle / Aufgabe:** siehe Liste.

**Beobachtung:**
- **Speicheranzeige:** Bei vollem Speicher zeigt die Datensicherung
  „Belegter Speicher: etwa 10 von 5 MB". Die Anzeige rechnet Zeichen × 2
  gegen 5 MB, Chromium lässt aber rund 5 Mio. Zeichen zu. Die Zeile warnt
  also früh, was harmlos ist, zeigt am Ende aber einen Widerspruch. Die
  Warnung ab 70 % erscheint nur in diesem Dialog. Startseite und
  Einsatzansicht blieben bei vollem Speicher ohne Hinweis.
- **Aufräum-Hinweis:** Die Fehlermeldungen raten „Papierkorb leeren …
  oder vorher eine Sicherung erstellen". Eine Sicherung schafft keinen
  Platz, und womit man wirklich Platz schafft (welche Sammlung wie groß
  ist), sagt die App nicht.
- **QR-Vollbild:** Die Anzeige zeigt nur den Code, „Der Bildschirm bleibt an
  …" und „Schließen". Welche Einheit und welcher Stand gerade gezeigt wird,
  steht nicht dabei. Nach dem Schließen hinterlässt die Übergabe keine Spur
  am Bogen (siehe Verweis R2-W2 unten).
- **Blanko-Vordruck:** `downloads/einheiten-erfassungsbogen-blanko.pdf`
  steht nicht in der Offline-Liste des Service Workers. Offline direkt
  aufgerufen: `ERR_INTERNET_DISCONNECTED`. Ein Klick auf „Blanko-PDF
  herunterladen" in `vorlage.html` lieferte in der Testumgebung trotzdem
  eine Datei. Vermutlich lief der Download an der Offline-Nachbildung
  vorbei. Das Ergebnis ist nicht eindeutig.

**Erwartung der Rolle:** Die Zahlen stimmen, und der Vordruck für die
Papier-Rückfallebene ist gerade dann da, wenn kein Netz da ist.

**Auswirkung im Einsatz:** Kleine Unsicherheiten. Der Blanko-Vordruck fehlt
womöglich genau in der Lage, für die er gedacht ist (Gerät fällt aus,
Drucker im Bereitstellungsraum, kein Netz).

**Empfehlung:** Speicheranzeige auf die tatsächliche Grenze beziehen und die
Warnung auch in der Einsatzansicht zeigen. Im Hinweis nennen, welche
Sammlungen wie viel belegen. Den Blanko-Vordruck in den Offline-Cache
nehmen. Im QR-Vollbild Einheit und Stand in einer Zeile dazuschreiben.

**Verifikation:** Speicher füllen: Anzeige ≤ 100 %, Warnung in der
Einsatzansicht. Blanko-PDF auf einem echten Gerät im Flugmodus
herunterladen. QR-Vollbild zeigt Einheit und Stand.

## Bestätigt aus anderen Runde-2-Berichten

Diese Stellen habe ich unabhängig beobachtet. Sie sind in den genannten
Berichten beschrieben und werden hier nicht noch einmal als eigene Befunde
gezählt:

- **R2-W2 [P2]:** Das Telefon der Einheit zeigt nicht, was übergeben wurde.
  Nach PDF (Quittung „✓ PDF gespeichert: eeb-281237sep26_THW_Ulm_…pdf" nur
  im offenen Dialog), „Link kopiert ✓" und QR-Vollbild sehen Übersicht und
  Startseitenkarte aus wie vorher. Eine spätere Änderung wird nirgends als
  „seit der Übergabe geändert" markiert. Für diese Rolle ist das die offene
  Hälfte von „was ist angekommen". Die App kann Ankunft ohne Rückkanal nicht
  wissen, sagt das aber auch nicht („Übergabe erst erledigt, wenn die
  Gegenstelle den Eingang bestätigt").
- **R2-H4 [P2]:** Rückmeldungen am Seitenende außerhalb des Bilds. R2-O2 ist
  derselbe Fehler bei der Speicher-voll-Meldung in der Einsatzansicht
  (y = 2 270 px).

## Was gut funktioniert und erhalten bleiben sollte

- **Kaltstart ohne Netz:** Neuer Browserstart im Offline-Modus mit
  installiertem Service Worker: Startseite mit Entwurfskarte und
  „Fortsetzen", Anleitung und Datenschutz (Status 200), zuletzt offene
  Sammlung.
- **Cache vor Netz:** Bei 5 s Verzögerung je Anfrage stand „Fortsetzen"
  nach 173 ms, 0 Anfragen gingen ins Netz. Bei Verbindungsabbruch bei jeder
  Anfrage lädt die App normal.
- **Wechsel online/offline** mitten im Tippen: keine neue Zeile, keine
  Störung, keine Anfrage an fremde Hosts (auf `localhost` beobachtet).
- **Übergabe offline:** PDF in 0,7 s mit Quittung im Dialog, Link in die
  Zwischenablage, QR-Vollbild. Am Meldekopf offline: Sammel-PDF,
  Excel-Liste „Oldenburg" und „Einsatz weitergeben / sichern". Danach
  „Zuletzt exportiert Mo., 12:47 · seitdem keine neuen Bögen".
- **Empfang offline:** Link öffnet mit Signaturprüfung und fragt „Wohin
  damit?". Das eigene PDF lässt sich über „Aus Datei laden…" wieder
  einlesen.
- **Wiederholung ohne Dublette:** Derselbe Link zweimal in dieselbe
  Sammlung: „Bereits vorhanden — übersprungen (gleicher Inhalt). Die Zeile
  in der Liste ist quittiert." Die Sammlung hat einen Eintrag.
- **Ehrliche Statuszeile beim Tippen** mit vollem Speicher und Nennung des
  letzten gesicherten Stands. PDF geht auch dann.
- **Sammlung in zwei Fenstern:** Schreibvorgänge führen die Stände zusammen,
  eine Aufnahme im anderen Fenster geht nicht verloren (nur die Anzeige
  hinkt, R2-O4).
- **Nachladefehler** werden verständlich übersetzt („Dafür braucht die App
  einmal Netz …") statt Browsertext.

## Abschluss

- **Aufgabe geschafft:** ja, nach einem vollständigen Erstbesuch und bei
  freiem Speicher. Mit Umwegen, wenn der Erstbesuch abbrach (App lädt
  offline nicht, R2-O1). Bei vollem Speicher am Meldekopf: nein, der
  empfangene Bogen ist verworfen (R2-O2).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „✓ Funktioniert komplett offline" steht schon
  da, bevor die App im Gerät liegt. Wer ihr glaubt, steht im Funkloch vor
  einer Fehlerseite (R2-O1).
- **Größtes Einsatzrisiko:** Am Meldekopf mit vollem Speicher wird ein
  gerade eingelesener Bogen verworfen, und die einzige Meldung steht 3½
  Bildschirme unter dem Bild. Die Einheit fehlt in der Lage (R2-O2).
- **Top-Priorität für die nächste Iteration:** Jede Speicherhandlung meldet
  ihr Scheitern im Bild. Ein empfangener Bogen bleibt erhalten, bis er sicher
  abgelegt ist (R2-O2). Direkt danach soll die Offline-Zusage an die
  tatsächliche Bereitschaft gekoppelt werden (R2-O1).

## Abgleich mit Runde 1

Grundlage: [../offline-und-speicher.md](../offline-und-speicher.md) und
[../README.md → Stand der Behebung](../README.md#stand-der-behebung).

| Runde-1-Befund | Bewertung Runde 2 | Beobachtung |
| --- | --- | --- |
| O1 Voller Speicher: „gespeichert" ohne Speichern, Aufnahme verliert den Bogen | teilweise | Behoben: Die Statuszeile meldet „⚠ Nicht gespeichert … Letzter gesicherter Stand: 12:40 Uhr", und der Stand nach dem Neuladen stimmt damit überein. Scheitert das Ablegen des eigenen Bogens, bleibt der Entwurf erhalten. Offen: Die Meldung dazu erscheint nur auf der Startseite, nicht im Assistenten. Ein am Meldekopf empfangener Bogen wird bei vollem Speicher verworfen, die Meldung steht außerhalb des Bilds. „Als Vorlage speichern" und „Neue Einsatz-Sammlung…" scheitern ohne Meldung (R2-O2). |
| O2 Beispielbögen reagieren offline nicht | bestätigt behoben | Offline: Fußzeile → „Beispielbögen" → THW → „Anzeigen" (101 Knöpfe) → Rückfrage → „Beispielbogen geöffnet — fiktive Daten …", Stärke 1/1/2/4. Der Offline-Cache umfasst jetzt 551 Einträge statt 108, die JSON-Beispiele gehören dazu. |
| O3 Rückfrage „bereits gemeldet" vor der Gleichheitsprüfung | bestätigt behoben | Zweiter Empfang desselben Links: Nach dem Zieldialog „Wohin damit?" gibt es keine Frage „bereits gemeldet", sondern direkt „Bereits vorhanden — übersprungen (gleicher Inhalt)". Die Sammlung hat einen Eintrag. |
| O4 Kein Blick auf den Speicherstand | teilweise | Die Datensicherung zeigt „Belegter Speicher: etwa 0 von 5 MB" bzw. bei vollem Speicher die Warnung mit Aufräum-Hinweis. Die Zahl läuft dann aber auf „10 von 5 MB", und die 70-%-Warnung steht nur in diesem Dialog, nicht in Startseite oder Einsatzansicht (R2-O7). |

Aus „Was gut funktioniert" in Runde 1 ist eine Aussage einzuschränken: „Nach
dem ersten Besuch ist alles da" gilt nur für einen *vollständigen* ersten
Besuch. Bricht er ab, bleibt die App ohne Offline-Cache, zeigt aber
dieselbe Zusage (R2-O1). Die übrigen Stärken (Offline-Neuladen, PDF, Link,
Empfang per Link, Dubletten-Erkennung, Statuszeile „bleibt auf diesem
Gerät") sind unverändert bestätigt.

Einordnung der eigenen Befunde: R2-O1 und R2-O3 bis R2-O6 sind neu. R2-O2
nimmt O1 wieder auf, R2-O7 enthält den Rest von O4. Nur als Verweis geführt
(nicht gezählt): R2-W2, R2-H4.

Bilanz: Von vier Runde-1-Befunden sind zwei bestätigt behoben (O2, O3) und
zwei teilweise (O1, O4). Keiner ist weiterhin offen. Der Kern von O1, die
falsche „gespeichert"-Anzeige und der stille Verlust des eigenen Bogens,
ist gelöst. Offen ist, dass die Fehlermeldung an allen anderen
Schreibstellen und beim Empfang am Meldekopf im Bild steht.
