# Audit „Nacht und Sicht", Runde 2 (Dunkelheit, Blendung, Sonnenlicht, Farbcodierung)

Stand: 28.09.2026 · Prüfer: Rollenaudit `thw-night-visibility-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/adoring-sagan-9vnriv`, Commit 354209b.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-1-Befunde vom 27.09.2026.

## Prüfaufbau

Chromium (Playwright, `/opt/pw-browsers/chromium`), Viewport 360 × 640 px,
`isMobile`/`hasTouch`, Locale de-DE, Pixeldichte 2. Die vier Themen
Standard, Dunkel, Feld und Nacht habe ich über den gespeicherten
Anzeigemodus gesetzt. Zusätzlich lief ein Durchgang ohne gespeicherte Wahl,
einmal mit `colorScheme` light und einmal mit dark. Als Zustände dienten ein
Entwurf aus `examples/thw/014-weinsberg-fgr-oel-c.json` (Seed
`eeb.entwurf.v1`) und eine Übungs-Sammlung „Hochwasser Neckar“. Diese habe
ich über die Bedienung angelegt: sechs Beispielbögen über „Bögen einlesen…“,
eine Einheit abgerückt.

Rolle: Helfer, der das Telefon nachts in der Fahrzeugkabine oder im Zelt
bedient, tagsüber in der Sonne am Meldekopf steht und zwischendurch in der
Anleitung nachschlägt.

Gemessen habe ich je Thema auf 15 Ansichten: Startseite, Entwurfskarte,
Schritte 1, 3, 4, 5, 6, leerer Schritt 2 mit Warnung, Dialog „Bogen
übergeben“, QR-Vollbild, PDF-Vorschau, Scanner ohne Kamera, Anleitung,
Datenschutz, unbekannte URL. Dazu kamen die Einsatzansicht, die Fehlermeldung
nach einer falschen Datei und alle 36 statischen Seiten unter `public/`.

- **Kontrast:** Für jeden sichtbaren Text das WCAG-Verhältnis aus der
  berechneten Schrift- und Hintergrundfarbe, einschließlich
  Transparenz und Deckkraft der Vorfahren. Schwelle 4,5:1, große Schrift
  3:1. Deaktivierte Knöpfe sind ausgenommen, wie in WCAG vorgesehen.
  Bei Eingabefeldern und Knöpfen habe ich den Rahmen gegen den Grund gemessen
  (Schwelle 3:1). Den Fokusrahmen habe ich per Tab auf 29 Elementen je Thema
  gegen den Grund gemessen.
- **Helle Flächen:** Anteil der Bildpunkte mit relativer Luminanz über 0,7
  bzw. 0,9 im Viewport-Screenshot.
- **Übergänge:** Kaltstart mit 2,5 s verzögertem App-Bundle (Screenshot alle
  250 ms). Wechsel App → `anleitung.html` → zurück per CDP-Screencast,
  Bild für Bild. Themenwechsel während einer Eingabe. Wechsel der
  Systemeinstellung während der Sitzung.
- **Nur-Farbe:** Einsatzansicht und Übersicht als Graustufen-Aufnahme
  (`filter: grayscale(1)`) und mit Deuteranopie-Matrix (feColorMatrix) im
  Standard- und im Nacht-Thema.
- **Sonne:** Schriftgrade, Schriftstärken und Kontraste der Summen,
  Statusmarken und Nebenzeilen im Standard- und im Feld-Thema.

Nicht prüfbar sind echte Umgebungshelligkeit, Displayhelligkeit, Spiegelung
auf dem Glas und Dunkeladaption des Auges. Aussagen dazu sind als Risiko
gekennzeichnet, nicht als Beobachtung. Ebenfalls nicht prüfbar: die native
Datums- und Auswahlliste des Betriebssystems (headless Chromium zeichnet sie
nicht), der Inhalt der PDF-Vorschau (headless Chromium zeigt im Rahmen nur
eine graue Fläche), die nativen Builds, die ausgelieferte Seite
`https://erfassungsbogen.app/anleitung.html` (auf sie verlinkt die Fußzeile;
kein Netz in der Testumgebung) und Graustufen-/Farbfilter des Telefons selbst
(hier nur per CSS nachgebildet).

## Urteil

In der App selbst trägt das Lichtkonzept. Im Nacht-Thema liegt der Anteil
sehr heller Bildpunkte auf allen Formular- und Dialogansichten bei 0 bis
0,1 %, im Dunkel-Thema bei 0,6 bis 3 %. Kein Text der App fällt unter 4,5:1,
abgesehen von deaktivierten Knöpfen und abgerückten Einheiten (R2-L5).
Das Feld-Thema liefert in der Sonne mindestens 6,86:1. Die Summen am
Meldekopf stehen mit 26 px fett bei 18,4:1. Zustände tragen immer ein
Zeichen oder ein Wort; in Graustufen und bei simulierter Rot-Grün-Schwäche
geht nichts verloren. Beim Kaltstart gibt es keinen weißen Blitz, und der
Themenwechsel lässt Eingaben stehen. Alle fünf Runde-1-Befunde sind in der
App umgesetzt.

Die Behebung von N2 hat dafür an anderer Stelle einen Fehler erzeugt. Die
Begleitseiten übernehmen jetzt das dunkle Thema, die Schrift bleibt dabei
aber fast schwarz. Anleitung, Datenschutz, Impressum und alle übrigen 33
statischen Seiten zeigen im Dunkel- und im Nacht-Thema Überschriften und
Fließtext bei 1,01 bis 1,06:1. Lesbar sind dort nur Links und Kopfzeile.
Das trifft auch jeden, der nie ein Thema gewählt hat und dessen Telefon auf
dunkel steht. Kleinere Reibung entsteht bei einer Fehlermeldung außerhalb
des Bildes, schwachen Feldrahmen im Dunkeln, einem unsichtbaren Fokusrahmen
in der Schrittleiste und einigen hellen Resten im Nacht-Thema.

Die eigentliche Aufgabe (Bogen erfassen, übergeben, am Meldekopf sammeln)
gelingt bei Nacht und in der Sonne ohne fremde Hilfe. Nachschlagen in der
Anleitung gelingt im Dunkeln nicht, man muss erst in der App auf „Standard“
umstellen, und dann blendet die Seite.

## Befunde

### R2-L1 [P1] Begleitseiten im Dunkel- und Nacht-Thema: Text praktisch unsichtbar (neu, Folge der N2-Behebung)

**Priorität:** P1

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Aus der App „Anleitung“, „Datenschutz“ oder
„Impressum“ in der Fußzeile. Ebenso direkt `anleitung.html` und alle
Themen- und Organisationsseiten (`thw.html`, `meldekopf.html`,
`katastrophenschutz-*.html`, `404.html` …). Betroffen sind Thema Dunkel und
Nacht, und ohne gespeicherte Wahl auch jedes Gerät mit
Systemeinstellung „dunkel“.

**Beobachtung:** Die Seiten erscheinen dunkel: Grund 13/12/8 (Nacht) bzw.
15/17/22 (Dunkel), Klasse `nacht-modus` bzw. `dunkel-modus` gesetzt. Die
Schrift von Überschriften, Absätzen, Listen und Tabellen steht aber auf
17/20/27, also fast schwarz auf fast schwarz. Gemessen auf 36 von 36
statischen Seiten, in beiden Themen:

| Seite | Texte gesamt | davon unter 2:1 | niedrigster Wert |
| --- | --- | --- | --- |
| anleitung.html | 153 | 83 | 1,01:1 (Nacht) / 1,02:1 (Dunkel) |
| datenschutz.html | 71 | 33 | 1,06:1 / 1,02:1 |
| impressum.html | 52 | 13 | wie oben |
| open-source-datenschutz.html | 157 | 115 | wie oben |
| thw.html | 97 | 41 | wie oben |
| 404.html | 8 | 2 (die Überschrift) | wie oben |

Die H1 „Einheiten-Erfassungsbogen: Anleitung und häufige Fragen“ ist auf dem
Screenshot nur als Schatten erkennbar, die Schrittliste „Bogen erstellen“
gar nicht. Lesbar bleiben nur Links (Bernstein bzw. Hellblau), die
Kopfzeile und Zweittext. Mit `colorScheme: dark` und leerem Speicher
entsteht dasselbe Bild. Auf den Seiten gibt es keinen Themenumschalter.

**Erwartung der Rolle:** Ich suche nachts, wie der Handscanner auf
„Deutsch“ gestellt wird. Die App verweist mich dafür selbst auf die
Anleitung. Dort erwarte ich dasselbe dunkle, lesbare Bild wie in der App.

**Auswirkung im Einsatz:** Die Anleitung ist im Dunkeln nicht zu lesen. Der
Helfer muss zurück in die App, auf „Standard“ stellen, die Anleitung neu
öffnen und hat dann doch den weißen Bildschirm, den Runde 1 (N2) beseitigen
wollte. Bei Telefonen mit dunkler Systemeinstellung wirkt die Anleitung
auch tagsüber leer. Datenschutz und Impressum sind in diesem Zustand
ebenfalls nicht lesbar.

**Empfehlung:** Auf den Begleitseiten muss im Dunkel- und Nacht-Thema die
Fließtext- und Überschriftenfarbe hell sein, wie in der App (dort 231/234/241
bzw. 217/205/182). Als Hinweis für die Entwickler: Der Seitengenerator
(`scripts/content-stil.mts`) schreibt `--text` offenbar überall auf
`#11141b` zurück, auch in den Themenblöcken. Die Prüfung sollte alle
Seiten und beide dunklen Themen abdecken, nicht nur eine Stichprobe.

**Verifikation:** Für alle Dateien unter `public/*.html` in den Themen
Dunkel und Nacht sowie ohne Wahl bei Systemeinstellung dunkel: Kein Text
unter 4,5:1. Die H1 der Anleitung muss auf dem Telefon bei niedriger
Helligkeit lesbar sein.

### R2-L2 [P2] Fehlermeldung nach „Aus Datei laden…“ erscheint außerhalb des Bildes (neu; Umfeld R2-E5, R2-H4)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Startseite ohne Entwurf → nach unten scrollen →
„Aus Datei laden…“ → Datei, die kein Erfassungsbogen ist (gültiges JSON,
falsches Schema). Alle vier Themen.

**Beobachtung:** Um den Knopf zu erreichen, muss man bei 360 × 640 auf
scrollY ≈ 460–530 scrollen. Die Meldung „Keine gültige Erfassungsbogen-Datei
(Schema-Version 2–9 erwartet).“ erscheint oben im Einleitungsbereich:
Oberkante −36 px, Unterkante +7 px im Viewport. Man sieht einen roten
Anschnitt am oberen Bildrand, der Rest der Seite bleibt unverändert. Die
Meldung hat weder `role="alert"` noch eine Live-Region. Ihr Kontrast
ist in Ordnung: 6,8:1 (Standard), 6,2:1 (Feld), 9,4:1 (Dunkel), 7,6:1
(Nacht).

**Erwartung der Rolle:** Die Meldung steht dort, wo ich getippt habe, oder
die Ansicht springt zu ihr.

**Auswirkung im Einsatz:** Bei gedimmtem Display oder in der Sonne ist ein
7-px-Streifen am Bildrand nicht zu sehen. Der Helfer hält den Vorgang für
gescheitert ohne Grund oder für nicht erfolgt und versucht es mehrfach. Das
ist dasselbe Muster wie bei der Abrück-Quittung in R2-H4. Den Inhalt der
Meldung behandelt R2-E5.

**Empfehlung:** Rückmeldungen auf eine Handlung im sichtbaren Bereich
zeigen, am Knopf oder als Hinweis am unteren Rand. Sie sollten auch
angesagt werden.

**Verifikation:** 360 × 640, Startseite ohne Entwurf, zum Knopf scrollen,
falsche Datei laden: Die Meldung muss vollständig im Viewport stehen, ohne
zu scrollen.

### R2-L3 [P3] Eingabefelder im Dunkel- und Nacht-Thema: Rahmen unter 3:1, keine eigene Füllung (neu)

**Priorität:** P3

**Nachweis:** gemessen. Die Wirkung bei geringer Displayhelligkeit ist ein
plausibles Risiko, nicht beobachtet.

**Fundstelle / Aufgabe:** Assistent Schritte 1–6, Startseite, Dialoge;
Thema Dunkel und Nacht.

**Beobachtung:** Eingabefelder, Auswahllisten und Nebenknöpfe haben einen
1-px-Rahmen mit 2,43:1 (Nacht, 92/84/64 auf 23/21/15) bzw. 2,54:1 (Dunkel)
gegen den Kartengrund. Ihre Füllung ist mit dem Kartengrund identisch
(Verhältnis 1:1). Betroffen sind 22 Elemente in Schritt 1 und 291 in
Schritt 3. In Standard und Feld liegen alle Rahmen über 3:1.

**Erwartung der Rolle:** Nachts, Display auf kleinster Stufe: Ich sehe,
wo das nächste leere Feld ist.

**Auswirkung im Einsatz:** Leere Felder zeichnen sich nur über den
Platzhalter ab. Bei gedimmtem Display und Blick von schräg (Telefon in der
Halterung) muss man suchen, wo getippt werden kann.

**Empfehlung:** Feldrahmen in beiden dunklen Themen auf mindestens 3:1
anheben, oder den Feldern eine vom Kartengrund abgesetzte Füllung geben,
ohne dass sie heller als der Text wird.

**Verifikation:** Rahmen-Kontrast aller `input`, `select`, `textarea` im
Nacht- und Dunkel-Thema ≥ 3:1. Schritt 3 bei minimaler Helligkeit auf einem
echten Telefon ansehen.

### R2-L4 [P3] Fokusrahmen in der Schrittleiste unsichtbar (Standard und Feld) (neu)

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Assistent, Tab-Taste auf die Schrittleiste im
Kopf (Tastatur am Meldekopf-Laptop oder Bluetooth-Tastatur am Tablet).

**Beobachtung:** Der Fokusrahmen (3 px, im Feld-Thema 4 px) hat dieselbe
Farbe wie der Kopfbalken, 32/33/79 auf 32/33/79, also 1,0:1. Auf dem
Screenshot ist „5. Sofortbedarf“ fokussiert und von den Nachbarn nicht zu
unterscheiden. Im Dunkel-Thema misst der Rahmen 6,45:1, im Nacht-Thema
4,24:1. Die Datumsfelder zeigen beim Fokus keinen Rahmen, nur eine dunklere
Kante. Alle anderen fokussierbaren Elemente sind sichtbar markiert.

**Erwartung der Rolle:** Wer mit Tastatur arbeitet, sieht immer, wo er ist
— gerade im Feld-Thema.

**Auswirkung im Einsatz:** Gering. Wer am Meldekopf per Tastatur arbeitet,
verliert in der Schrittleiste die Position und springt ungewollt in einen
anderen Schritt.

**Empfehlung:** Den Fokus im Kopfbalken in einer Farbe zeigen, die sich
vom Balken abhebt, zum Beispiel in der Kopf-Schriftfarbe.

**Verifikation:** In Standard und Feld per Tab auf jeden Schritt: Der
Rahmen muss ≥ 3:1 gegen den Kopfbalken haben.

### R2-L5 [P3] Abgerückte Einheiten: 55 % Deckkraft drückt Text unter 3:1, auch im Feld-Thema (neu)

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Einsatzansicht, Karte einer abgerückten Einheit
(„THW Ansbach …“, abgerückt).

**Beobachtung:** Die ganze Karte steht auf Deckkraft 0,55. Damit fallen
„THW · Stärke 0/4/14/18“ und „eingetroffen … abgerückt 13:49“ auf 2,33:1
(Standard), 2,77:1 (Nacht) und 3,38:1 (Dunkel). Die Marken „ÜBUNG“, „alt“
und „Diesel 335 l“ liegen bei 2,64:1, im Feld-Thema ebenfalls bei 2,64:1,
„ändern“ bei 3,0:1. Auch die Knöpfe „Als anwesend“ und „Entfernen“ sind
gedimmt. Der Zustand selbst ist sauber codiert, durch Durchstreichung und
das Wort „abgerückt“, und bleibt in Graustufen erkennbar.

**Erwartung der Rolle:** Abgerückt darf zurücktreten, aber im Feld-Thema
tritt laut Beschreibung „nichts zurück“. Stärke und Abrückzeit einer
abgerückten Einheit werden bei Rückfragen gebraucht, ebenso der Knopf
„Als anwesend“, falls versehentlich abgerückt wurde.

**Auswirkung im Einsatz:** In der Sonne sind Stärke und Zeit der
abgerückten Einheit schwer zu lesen, und der Rückweg „Als anwesend“ ist
blass.

**Empfehlung:** Abgerückte Einheiten über Durchstreichung, Wort und Grund
absetzen statt über Deckkraft. Im Feld-Thema mindestens 4,5:1 halten.
Knöpfe in voller Deckkraft lassen.

**Verifikation:** Einsatzansicht mit einer abgerückten Einheit, alle
Themen: kein Text der Karte unter 4,5:1 (Feld) bzw. 3:1 (übrige).

### R2-L6 [P3] Helle Reste im Nacht-Thema (Scanner, QR-Platte, PDF-Vorschau, Browserleiste) (neu; Rest von N1)

**Priorität:** P3

**Nachweis:** Scanner, QR-Platte und Browserleiste gemessen. PDF-Vorschau
nur als Risiko: Sie ist in headless Chromium nicht darstellbar.

**Fundstelle / Aufgabe:** Nacht-Thema: „QR-Code scannen…“; „Bogen
übergeben…“ → Vollbild; Übersicht → „Vorschau anzeigen“; Kopf des Browsers
bzw. der installierten PWA.

**Beobachtung:**
- **Scanner:** Überschrift und Anleitung im Scanner stehen in reinem Weiß
  (255/255/255) statt im warmen Nacht-Text (217/205/182, Luminanz ≈ 206).
  Die Fehlerzeile ist ein kühles Rosa (255/180/171) statt des Nacht-Alarms
  (224/138/126). Der Scanner ist damit im Nacht-Thema der hellste Text der
  App.
- **QR-Vollbild:** Die weiße Platte misst 332 × 331 px, das sind 48 % des
  Bildschirms und 33,6 % sehr helle Bildpunkte. Im Standard-Thema sind es
  78 %. Die Platte ist für den Scan nötig. Sie steht aber in reinem Weiß
  ohne gedimmte Variante.
- **PDF-Vorschau:** Der Vorschau-Rahmen (`iframe.pdf-rahmen`) hat im
  Nacht-Thema keinen Filter. Anleitungsfotos werden auf 0,7 gedimmt, die
  Vorschau nicht. In einem Browser mit eingebautem PDF-Betrachter steht
  dort voraussichtlich ein weißes A4-Blatt über mehr als die halbe
  Bildschirmhöhe.
- **Browserleiste:** `theme-color` bleibt auch im Nacht-Thema auf der
  Kennfarbe der Organisation (#20214f, gemessen am THW-Bogen). Android färbt damit voraussichtlich Status-
  und Adressleiste ein, bei Organisationen mit roter Kennfarbe vermutlich rot (nicht geprüft).

**Erwartung der Rolle:** Nachts ist nur das hell, was hell sein muss, also
die Ruhezone des Codes, und auch die nur so lange wie nötig.

**Auswirkung im Einsatz:** Einzeln gering. Beim Scannen im Zelt ist der
weiße Text des Scanners und beim Übergeben die weiße Platte der hellste
Punkt. Eine weiße PDF-Vorschau würde die Dunkeladaption kosten (Risiko).

**Empfehlung:** Scanner-Texte aus den Themenfarben nehmen. PDF-Vorschau im
Nacht-Thema gedimmt zeigen oder vorher darauf hinweisen. `theme-color` im
Nacht-Thema auf den dunklen Kopf-Ton setzen. Prüfen, ob die QR-Platte mit
einem gedämpften Hellgrau zuverlässig gescannt wird; nur dann umstellen.

**Verifikation:** Nacht-Thema, Scanner: Text ≤ Luminanz des Nacht-Texts.
PDF-Vorschau auf echtem Gerät: kein reinweißes Blatt ohne Dimmung.
QR-Scan mit gedimmter Platte an drei Telefonen.

## Was gut funktioniert

- **Nacht-Thema in der App:** Grund 13/12/8, Text 217/205/182. Anteil sehr
  heller Pixel 0–0,1 % auf Start, Assistent, Übersicht, Dialog,
  Einsatzansicht. Die Startseite im Dunkel-Thema hat 2,2 %.
- **Kontrast:** In der App kein aktiver Text unter 4,5:1 außer bei R2-L5.
  Kleinster Wert Standard 4,96:1, Dunkel 7,03:1, Nacht 4,71:1, Feld 6,86:1.
  In der Einsatzansicht kein Text unter 13 px und keine Schriftstärke unter
  400. Warnungen („⚠ 1 offener Punkt …“) und Fehlermeldungen liegen in
  allen Themen über 6:1.
- **Nicht nur Farbe:** Schrittleiste mit „✓“ bzw. „•“, Warnungen mit „⚠“,
  Marken als Wörter („ÜBUNG“, „neu“, „alt“, „Ruhezeit“, „Unterbringung
  angefordert“, „1 Lücke“), abgerückt mit Durchstreichung und Wort. In
  Graustufen und unter Deuteranopie-Simulation bleibt jede Information
  erhalten; „Entfernen“ unterscheidet sich dann nur noch durch das Wort,
  das genügt.
- **Übergänge:** Kaltstart im Nacht-Thema mit verzögertem Bundle: hell-Anteil
  konstant 1,1 % von der ersten Aufnahme an, also kein weißer Blitz. Wechsel
  App ↔ Anleitung: höchstens 3 % (Nacht) bzw. 8 % (Dunkel) helle Pixel in
  einzelnen Frames.
- **Vorhersehbarer Themenwechsel:** Ohne Wahl startet die App bei
  System-dunkel im Dunkel-Thema, ohne etwas zu speichern. Ein Wechsel der
  Systemeinstellung während der Sitzung schaltet nicht um, erst beim
  nächsten Start. Ein Themenwechsel während der Eingabe lässt den Text
  stehen und den Schritt offen.
- **Taktisches Zeichen:** gedimmt (hellster Pixel Luminanz 166 gegenüber
  206 des Nacht-Texts).
- **Feld-Thema:** Schwarz auf Hellgrau, 112 % Schrift, Rahmen 2 px, Summen
  18,4:1. Die richtige Antwort auf Sonnenlicht, abgesehen von R2-L5.

Überschneidungen ohne eigenen Befund: Datumsfelder abgeschnitten („09/28/20:“,
112 px breit), siehe R2-H8. Hoher Assistenten-Kopf, siehe R2-H7. Inhalt der
Dateifehlermeldung, siehe R2-E5.

## Abschluss

- **Aufgabe geschafft:** In der App ja, bei Nacht wie in der Sonne.
  Nachschlagen in Anleitung, Datenschutz oder Impressum im Dunkel-/Nacht-Thema
  nein, nur mit Umweg über „Standard“ (R2-L1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die Anleitung wirkt im Dunkeln leer. Man sieht
  nur Links, und die dunkle Seite sieht aus wie „fertig geladen, aber ohne
  Inhalt“ (R2-L1).
- **Größtes Einsatzrisiko:** Wer nachts in der Anleitung Hilfe sucht (etwa
  zum Handscanner), kann sie nicht lesen und muss dafür auf ein helles
  Thema umschalten, das die Dunkeladaption kostet (R2-L1).
- **Top-Priorität für die nächste Iteration:** Textfarbe der Begleitseiten
  im Dunkel- und Nacht-Thema korrigieren und das für alle 36 Seiten
  automatisch prüfen (R2-L1).

## Abgleich mit Runde 1

Grundlage: [../nacht-und-sicht.md](../nacht-und-sicht.md) und
[../README.md → Stand der Behebung](../README.md#stand-der-behebung).

| Runde-1-Befund | Bewertung Runde 2 | Messwert / Beobachtung |
| --- | --- | --- |
| N1 Vollbild-QR ganz weiß | bestätigt behoben (Rest in R2-L6) | Nacht und Dunkel: weiße Platte 332 × 331 px = 48 % der Fläche, 33,6 % sehr helle Pixel, Rest Themengrund 13/12/8. Die Platte selbst ist reinweiß. |
| N2 Begleitseiten ohne Thema | weiterhin offen in neuer Form (R2-L1) | Thema wird übernommen (Klasse gesetzt, Grund dunkel, kein Blitz), aber Fließtext und Überschriften 17/20/27 auf Dunkel: 1,01–1,06:1 auf 36 von 36 Seiten. Vorher hell und lesbar, jetzt dunkel und unlesbar. |
| N3 Umschalter tief in der Einsatzansicht | bestätigt behoben | Umschalter im Kopf der Einsatzansicht bei y = 68 px (zusätzlich in der Fußzeile bei y = 5 748 px von 5 986 px). |
| N4 Systemeinstellung nicht übernommen | bestätigt behoben | `colorScheme: dark` ohne Wahl → `dunkel-modus`, Speicher bleibt leer. light → Standard. Live-Wechsel schaltet nicht um, erst nach Neuladen. Kaltstart ohne hellen Blitz (1,1–2,1 % helle Pixel). |
| N5 Taktisches Zeichen leuchtet | bestätigt behoben | Nacht: `brightness(0.6) sepia(0.4)`, hellster Pixel Luminanz 166 (Nacht-Text 206). Dunkel: `brightness(0.85)`. |

Einordnung der eigenen Befunde: R2-L1 ist neu und eine Folge der
N2-Behebung. R2-L2 bis R2-L5 sind neu. R2-L6 ist neu und enthält den Rest
von N1 (reinweiße Platte). Verweise auf andere Runde-2-Berichte: R2-L2 liegt
im Umfeld von R2-E5 (Wortlaut derselben Meldung) und R2-H4 (Quittung
außerhalb des Bildes). Die abgeschnittenen Datumsfelder stehen in R2-H8, der
hohe Kopf in R2-H7. Sie sind hier nicht mitgezählt.

Bilanz: Von fünf Runde-1-Befunden sind vier bestätigt behoben (N1, N3, N4,
N5). N2 ist formal umgesetzt, hat aber einen neuen, schwereren Fehler
erzeugt: Die Begleitseiten sind im Dunkeln jetzt dunkel und unlesbar statt
hell und lesbar (R2-L1, P1). Neu: 1 × P1, 1 × P2, 4 × P3.
