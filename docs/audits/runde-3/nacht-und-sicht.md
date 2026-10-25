# Audit „Nacht und Sicht“, Runde 3 (Dunkelheit, Blendung, Sonnenlicht, Farbcodierung)

Stand: 04.10.2026 · Prüfer: Rollenaudit `thw-night-visibility-reviewer` ·
Prüfgegenstand: Web-App einschließlich der Begleitseiten unter `public/`,
Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/gifted-cray-ngieaz`, Commit 33ed426.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-2-Befunde. Geprüft habe ich zuerst ohne Kenntnis des Runde-2-Berichts.
Den Abgleich habe ich erst danach gemacht.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, Pixeldichte 2.
Die vier Anzeigemodi Standard, Feld, Dunkel und Nacht habe ich über
`eeb.anzeigemodus.v1` gesetzt. Dazu kam ein Durchgang ohne gespeicherte
Wahl mit `colorScheme: dark` (System-dunkel), einmal mit und einmal ohne
Daten. Jeder Durchgang lief in einem eigenen Browser-Kontext.

Als Zustände dienten Seeds aus `examples/thw/`, alle mit `uebung: false`:

- `eeb.entwurf.v1`: 001 Albstadt ZTr TZ, offen in Schritt 3.
- `eeb.vorlagen.v1`: eine Vorlage aus 011 Rottweil.
- `eeb.einsaetze.v1`: Sammlung „Hochwasser Neckar“ mit acht Bögen
  (002–009). Davon ist einer abgerückt und einer zusammengeführt, einer
  trägt eine gültige Signatur und einer eine ungültige.

Rolle: Helfer, der das Telefon nachts in der Fahrzeugkabine oder im Zelt
bedient, tagsüber in der Sonne am Meldekopf steht und zwischendurch in der
Anleitung nachschlägt.

Ansichten je Modus:

- Startseite mit und ohne Daten.
- Assistent, Schritte 1–6, jeweils über die ganze Höhe.
- Neuer, leerer Bogen mit „Weiter“, Schrittleiste mit „offen“.
- Dialoge „Bogen übergeben“, „Angefangenen Bogen verwerfen?“, „Alle lokalen
  Daten löschen“ und „Einheit schnell erfassen“.
- QR-Vollbild, Scanner ohne Kamera, PDF-Vorschau.
- Einsatzansicht mit Karten (zu und aufgeklappt) und als Tabelle.
- „Aus Datei laden…“ und „Bögen einlesen…“ mit falscher und mit gültiger
  Datei.
- Alle 36 Seiten unter `public/` in Nacht, Dunkel und System-dunkel.

Gemessen habe ich so:

- **Kontrast:** WCAG-Verhältnis für jeden sichtbaren Textknoten aus der
  berechneten Schrift- und Grundfarbe. Transparenz und die Deckkraft aller
  Vorfahren sind eingerechnet. Schwelle 4,5:1, bei großer Schrift 3:1.
  Deaktivierte Knöpfe nenne ich, werte sie aber nicht als Befund.
  Rahmen bzw. Füllung von Bedienelementen habe ich gegen den Grund gemessen
  (Schwelle 3:1). Platzhalter- und Rahmenfarben habe ich zusätzlich aus
  den Modus-Tokens in `index.html` nachgerechnet.
- **Helle Flächen:** Anteil der Bildpunkte mit relativer Luminanz über 0,5
  und mittlere Luminanz je Screenshot. Gezählt habe ich in einer Canvas über
  die PNG-Aufnahme. Die Schwelle liegt niedriger als in Runde 2 (0,7/0,9);
  die Prozentwerte sind deshalb nicht 1:1 vergleichbar.
- **Einzelpixel:** Farbproben aus den Aufnahmen, etwa für die Punkte des
  taktischen Zeichens.
- **Übergänge:** Kaltstart bei 6-fach gedrosselter CPU, Aufnahme alle 120 ms.
  Wechsel der Systemeinstellung während der Sitzung. Themenwechsel mitten
  in Schritt 3 mit eingetipptem Text.
- **Nur-Farbe:** Einsatzansicht und Übersicht unter CDP-Simulation
  Deuteranopie und Achromatopsie, jeweils in Standard und Nacht.
- **Fokus:** Tab auf die Schrittleiste, Rahmenfarbe gegen den Kopfbalken.

**Nicht prüfbar:**

- Echte Umgebungshelligkeit, Displayhelligkeit, Spiegelung auf dem Glas und
  die Dunkeladaption des Auges. Aussagen dazu sind als Risiko markiert.
- Der Inhalt der PDF-Vorschau: headless Chromium zeigt im Rahmen nur eine
  dunkle Fläche. Den Filter habe ich gemessen, das Blatt nicht gesehen.
- Kamera-Scan und damit die Eingangsquittung nach einem echten Scan.
- Native Datums- und Auswahllisten.
- Die nativen Builds. Für iOS und Android gelten im Code eigene Regeln für
  das Zeichen im Kopf, siehe R3-L5.
- Graustufen- und Farbfilter des Telefons selbst; hier nur per CDP
  nachgebildet.

## Urteil

Das Lichtkonzept der App hält auch in Runde 3. Im Nacht-Modus fällt kein
aktiver Text unter 4,5:1. Die Startseite hat eine mittlere Luminanz von
0,043, im Standard-Modus sind es 0,698. Weniger als 3 % der Bildpunkte
liegen über Luminanz 0,5. Hell ist im Nacht-Modus nur noch die
QR-Ruhezone. Zustände tragen überall ein Wort oder Zeichen: „offen“ und „✓“
in der Schrittleiste, „⚠“, „ABGERÜCKT“ mit Durchstreichung, „Ruhezeit“. In
Graustufen geht nichts verloren. Beim Kaltstart gibt es keinen hellen
Blitz. Die Systemeinstellung schaltet eine laufende Sitzung nicht um, und
ein Themenwechsel lässt Eingaben stehen. Die Begleitseiten sind in allen
dunklen Varianten lesbar: 36 von 36 Seiten ohne Text unter 4,5:1. Damit ist
der P1 aus Runde 2 erledigt.

Reibung entsteht an drei Stellen. Erstens erscheint am Meldekopf nach
„Bögen einlesen…“ die Rückmeldung, ob erfolgreich oder nicht, rund
2 100–2 300 px unterhalb des Bildes. Der Helfer sieht nach dem Tippen
nichts (R3-L1). Zweitens steht eine ungültige Signatur nur in der
aufgeklappten Karte. In der zugeklappten Liste und in der Tabelle fehlt
jedes Zeichen dafür (R3-L2). Drittens ist die Abblendung abgerückter
Einheiten in den Karten behoben, in der Tabellenansicht aber nicht (R3-L3).
Dazu kommen kleinere Reste. Die Fotos und App-Screenshots auf den
Begleitseiten sind im Dunkel-Modus und bei System-dunkel ungedimmt. Das
Größenzeichen am taktischen Zeichen verschwindet im Dunkeln. Der
Moduswechsel ist im Assistenten nur ganz oben erreichbar.

Die eigentliche Aufgabe gelingt bei Nacht und in der Sonne ohne fremde
Hilfe: Bogen erfassen, übergeben, am Meldekopf sammeln, in der Anleitung
nachschlagen.

## Befunde

Keine P0- und keine P1-Befunde.

### R3-L1 [P2] Einsatzansicht: Rückmeldung nach „Bögen einlesen…“ steht weit außerhalb des Bildes (Rest von R2-L2)

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Einsatzansicht „Hochwasser Neckar“ → „Bögen
einlesen…“ → Datei wählen. Gilt für alle Modi; gemessen im Nacht-Modus.

**Beobachtung:**

- Der Knopf liegt bei scrollY 579 im Bild.
- Bei einer Datei, die kein Bogen ist, erscheint „„falsch.json“ stammt nicht
  aus dieser App. …“ (Klasse `fehler`) bei Oberkante 2 711 px, also rund
  2 130 px unter dem sichtbaren Bereich.
- Bei einer gültigen Datei (030 Weiden) steht „1 Bogen aufgenommen.“ bei
  Oberkante 2 848 px.
- Die Ansicht springt in keinem der beiden Fälle. Der Screenshot nach dem
  Einlesen ist unverändert: Bedarf, Exportknöpfe, Hinweistext.
- Auf der Startseite ist derselbe Fall behoben. Dort steht die Meldung mit
  `role="alert"` bei 239–304 px voll im Bild.

**Erwartung der Rolle:** Nach dem Tippen sehe ich dort, wo ich hinschaue, ob
es geklappt hat.

**Auswirkung im Einsatz:** Bei gedimmtem Display oder in der Sonne gibt es
überhaupt kein Signal. Der Helfer liest dieselbe Datei erneut ein. Bei einer
falschen Datei wartet er oder hält den Vorgang für erledigt, obwohl nichts
aufgenommen wurde. Der Zähler „6 Einheiten“ oben steht beim Einlesen
ebenfalls außerhalb des Bildes. Er hilft nur, wenn man weiß, worauf man
achten muss.

**Empfehlung:** Rückmeldungen auf „Bögen einlesen…“ und „Bogen scannen…“ am
Knopf oder als Hinweis am unteren Bildrand zeigen. Sie sollten angesagt
werden und lange genug stehen, wie auf der Startseite. Die neu aufgenommene
Einheit sollte bei Bedarf ins Bild rollen.

**Nachprüfung:** 360 × 640, Einsatzansicht, Knopf „Bögen einlesen…“ in
Bildmitte. Einmal mit falscher, einmal mit gültiger Datei: Die Meldung
steht in beiden Fällen ohne Scrollen vollständig im Viewport.

### R3-L2 [P2] „Signatur ungültig“ nur in der aufgeklappten Karte sichtbar

**Priorität:** P2

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Einsatzansicht, Einheitenliste (Karten
zugeklappt) und Tabellenansicht. Eintrag Nr. 5 „THW Haßmersheim
Fachgruppe Wassergefahren (A)“ trägt eine ungültige Signatur.

**Beobachtung:**

- Zugeklappt zeigt die Karte Name, Stärke, „● Ruhezeit“, „● Unterbringung
  angefordert“, Diesel und Benzin. Sie sieht genauso aus wie die
  unauffälligen Karten.
- Erst nach „Aufklappen“ erscheint in der dritten Zeile „⚠ Signatur
  ungültig“, in Alarmfarbe (Nacht #e08a7e auf #17150f, 7,05:1).
- Die Tabellenansicht hat 21 Spalten. Keine davon zeigt einen Signaturstatus,
  und im Tabellentext steht weder „⚠“ noch „ungültig“.
- Kein Element der zugeklappten Liste trägt einen Titel oder ein
  aria-label mit „Signatur“.

**Erwartung der Rolle:** Was nicht stimmt, sehe ich beim Überfliegen der
Liste, ohne jede Karte zu öffnen. Am Meldekopf schaue ich nachts im Zelt
auf acht oder mehr Karten.

**Auswirkung im Einsatz:** Ein Bogen mit gebrochener Signatur geht in die
Summen ein und sieht aus wie jeder andere. Ob der Inhalt unterwegs verändert
wurde, merkt nur, wer zufällig genau diese Karte aufklappt. Die
Alarmfarbe ist gut gewählt, wirkt aber nur dort, wo man sie sieht.

**Empfehlung:** Die ungültige Signatur in der zugeklappten Karte als Marke
zeigen, mit Zeichen und Wort, wie „Ruhezeit“. In der Tabelle sollte sie in
der Einheitenspalte erscheinen. Gültig signierte Bögen brauchen das nicht.

**Nachprüfung:** Sammlung mit einem Eintrag `signatur.zustand =
"ungueltig"`. In Karten- und Tabellenansicht ist der Eintrag ohne
Aufklappen als auffällig erkennbar, auch in Graustufen.

### R3-L3 [P3] Tabellenansicht: abgerückte und zusammengeführte Zeilen auf 55 % Deckkraft (Rest von R2-L5)

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Einsatzansicht → „Tabelle“. Betroffen sind
Nr. 6 (abgerückt) und Nr. 4 (zusammengeführt).

**Beobachtung:** In den Karten ist R2-L5 behoben: volle Deckkraft,
durchgestrichener Name, Marke „ABGERÜCKT“ bzw. „ZUSAMMENGEFÜHRT“ mit Rahmen,
gestrichelte Kante links. Kein Kartentext liegt unter der Schwelle. In der
Tabelle steht die ganze Zeile weiter auf Deckkraft 0,55 (`table.einheiten-tabelle tr.gestrichen`):

| Modus | Statuswort „abgerückt“ und „Nr.“ | Name, Zahlen, Zeiten | Marke „alt“ |
| --- | --- | --- | --- |
| Standard | 2,33:1 | 4,08:1 | 2,64:1 |
| Feld | 3,44:1 | über 4,5:1 | 2,64:1 |
| Dunkel | 3,38:1 | über 4,5:1 | 4,14:1 |
| Nacht | 2,77:1 | 4,30:1 | 3,49:1 |

Das Statuswort ist zusätzlich durchgestrichen. Auf dem Screenshot im
Nacht-Modus ist „abgerückt“ unter der Durchstreichung kaum zu entziffern.

**Erwartung der Rolle:** Abgerückt darf zurücktreten, das Wort, das den
Zustand nennt, aber nicht. Im Feld-Modus tritt nach eigener Beschreibung
„nichts zurück“.

**Auswirkung im Einsatz:** Gering, solange Durchstreichung und graue Zeile
den Zustand tragen. Wer in der Sonne wissen will, ob eine Zeile abgerückt
oder zusammengeführt ist, muss in die Karten wechseln.

**Empfehlung:** In der Tabelle dieselbe Lösung wie in den Karten:
Durchstreichung des Namens, Statuswort ohne Durchstreichung in voller
Deckkraft.

**Nachprüfung:** Tabellenansicht mit einer abgerückten Einheit, alle
Modi: Statuswort ≥ 4,5:1, übrige Zellen ≥ 3:1 (Feld ≥ 4,5:1).

### R3-L4 [P3] Begleitseiten im Dunkel-Modus und bei System-dunkel: Fotos und App-Screenshots ungedimmt

**Priorität:** P3

**Kennzeichnung:** gemessen. Die Blendwirkung ist ein Risiko.

**Fundstelle / Aufgabe:** `anleitung.html`, `asb.html`, `thw.html`,
`feuerwehr.html` und alle übrigen Seiten mit Bildern. Betroffen sind der
Dunkel-Modus und ein Gerät ohne gespeicherte Wahl mit dunkler
Systemeinstellung.

**Beobachtung:**

- Im Nacht-Modus stehen alle Bilder auf `brightness(0.7)`. Über eine ganze
  Seite liegt der Anteil heller Bildpunkte bei 2–7 %, der hellste Pixel bei
  Luminanz 0,62.
- Im Dunkel-Modus haben die Bilder keinen Filter (`filter: none`). Über eine
  ganze Seite sind 8–23 % der Bildpunkte hell, bei `asb.html` und
  `johanniter.html` 23 %.
- Im Viewport auf dem App-Screenshot der Anleitung (`start-schmal.png`,
  272 × 586 px) sind 55 % der Bildpunkte sehr hell. Auf dem Screenshot in
  `asb.html` sind es 47 %.
- Der Anleitungs-Screenshot zeigt außerdem einen veralteten Stand: einen
  Umschalter mit nur drei Modi (Standard, Feld, Nacht) und eine andere
  Startseite.
- Die Handscanner-Strichcodes bleiben in allen Modi weiß. Das ist richtig,
  denn sie müssen vom Bildschirm gescannt werden.

**Erwartung der Rolle:** Wer den Dunkel-Modus wählt oder sein Telefon auf
dunkel stellt, bekommt auch in der Anleitung keine weißen Flächen über eine
halbe Bildschirmhöhe.

**Auswirkung im Einsatz:** Im abgedunkelten Raum blendet beim Scrollen
durch die Anleitung ein weißer Telefon-Screenshot. Im Nacht-Modus tritt das
nicht auf. Der veraltete Screenshot passt nicht zu dem, was der Helfer in
der App sieht (vier Modi), und erschwert das Wiederfinden.

**Empfehlung:** Bilder im Dunkel-Modus ebenfalls leicht dimmen, die
Strichcodes ausgenommen. App-Screenshots in der Anleitung auf den
aktuellen Stand bringen, am besten auch in einer dunklen Fassung.

**Nachprüfung:** `anleitung.html` und `asb.html` im Dunkel-Modus und bei
System-dunkel: höchstens 10 % helle Bildpunkte je Viewport beim Scrollen.
Die Screenshots zeigen den Umschalter mit vier Modi.

### R3-L5 [P3] Taktisches Zeichen auf dunklem Grund: Größenzeichen unsichtbar

**Priorität:** P3

**Kennzeichnung:** gemessen (Web). Für iOS und Android nur Risiko, aus dem
Stilblatt abgeleitet.

**Fundstelle / Aufgabe:** Startseite, Entwurfskarte. Übersicht (Schritt 6)
oberhalb von „THW · Zugtrupp Technischer Zug · Albstadt“. Dunkel- und
Nacht-Modus.

**Beobachtung:**

- Das Zeichen hat außerhalb des Rechtecks keinen eigenen Grund. Das
  Größenzeichen darüber ist schwarz (0/0/0) gezeichnet, beim Zugtrupp ein
  Punkt.
- Auf der Karte misst der Punkt 1,15:1 (Nacht, gegen 23/21/15) bzw. 1,21:1
  (Dunkel). Auf den Screenshots ist er nur bei genauem Hinsehen zu ahnen.
- Auch die gedimmte Rechteckfläche hebt sich im Nacht-Modus kaum ab: 1,15:1
  gegen die Karte. Erkennbar bleibt das Zeichen über den hellen Rand, die
  weißen Punkte und das Kürzel „TZ“.
- Im Kopf des Assistenten steht das Zeichen auf weißer Unterlage
  (`background: #fff`). Dort ist der Punkt sichtbar, die Unterlage misst
  im Nacht-Modus 174/165/149.
- Für `.platform-ios` und `.platform-android` nimmt das Stilblatt diese
  Unterlage weg. In den Apps fehlt das Größenzeichen dann vermutlich auch im
  Kopf (nicht geprüft).

**Erwartung der Rolle:** Das taktische Zeichen zeigt die Einheitsgröße auf
einen Blick, auch nachts.

**Auswirkung im Einsatz:** Gering, weil die Bezeichnung daneben ausgeschrieben
ist. Wer sich am Zeichen orientiert, sieht im Dunkeln keine Größe und kann
Trupp, Gruppe und Zug am Zeichen nicht unterscheiden.

**Empfehlung:** Dem Zeichen auf dunklem Grund eine gedämpfte helle Unterlage
geben, wie im Kopf der Web-App, oder das Größenzeichen in der Textfarbe
des Modus zeichnen.

**Nachprüfung:** Startseite und Übersicht im Dunkel- und Nacht-Modus sowie
in der Android-App: Das Größenzeichen über dem Rechteck hat ≥ 3:1 gegen
seinen Grund.

### R3-L6 [P3] Moduswechsel im Assistenten nur ganz oben erreichbar

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Assistent, Schritt 3 „Personal“ (5 939 px hoch),
mitten in der vierten Person. Das Licht im Fahrzeug geht aus, und der
Helfer will auf „Nacht“ stellen.

**Beobachtung:** Der Umschalter („Standard ▾“ bzw. „Nacht ▾“) steht im Kopf.
Der Kopf ist nicht angeheftet (`position: static`): Bei scrollY 1 500 liegt
der Knopf bei −1 487 px. Die Fußzeile des Assistenten enthält nur
„Impressum · Datenschutz · Anleitung“, keinen Umschalter. Die feste untere
Leiste enthält nur „← Zurück / Weiter →“. Um umzuschalten, muss man
rund 3 100 px nach oben scrollen. Danach steht man oben im Schritt und muss
die Stelle wieder suchen. Der eingetippte Text bleibt erhalten.

**Erwartung der Rolle:** Wenn das Licht wechselt, schalte ich mit einem
Griff um, ohne meine Stelle im Formular zu verlieren.

**Auswirkung im Einsatz:** Bis man oben ist, blendet der helle Bildschirm
weiter. Danach kostet es Zeit, die Stelle in einer langen Personalliste
wiederzufinden.

**Empfehlung:** Den Umschalter auch von unten erreichbar machen, etwa in der
Fußzeile des Assistenten wie auf der Startseite oder über die feste untere
Leiste. Die Position soll dabei erhalten bleiben.

**Nachprüfung:** Schritt 3, mittig gescrollt: Umschalten auf Nacht mit
höchstens zwei Tipps, ohne dass sich scrollY ändert.

### R3-L7 [P3] Kleinere Sichtreste (Sammelbefund)

**Priorität:** P3

**Kennzeichnung:** je Punkt angegeben.

- **Platzhalter im Nacht-Modus (gemessen):** `--text-3` #877c66 auf dem
  Feldgrund #17150f misst 4,44:1, knapp unter 4,5:1. Betroffen sind zum
  Beispiel „z. B. THW Ortsverband Ulm“ und „Funktion…“. In Dunkel sind es
  5,22:1, in Standard 4,69:1.
- **Hinweis „Wird für den Offline-Betrieb geladen“ (gemessen):** Der Rahmen
  steht in der Gut-Farbe, die Schrift in der Warnfarbe. Im Nacht-Modus
  liegen beide Töne bei 1,32:1 zueinander (#8fae63 / #d9b96a). „Lädt“ und
  „bereit“ unterscheiden sich damit praktisch nur über „⏳“ bzw. „✓“ und den
  Wortlaut. Das genügt, aber der grüne Rahmen sagt „in Ordnung“, solange
  noch geladen wird.
- **Dialog „Bogen übergeben“ (beobachtet):** Ist der Einsatzzeitraum vorbei,
  stehen zwei gleich gefärbte Primärknöpfe untereinander. Oben steht „Für
  neuen Einsatz vorbereiten“, das den Bogen verändert, darunter „QR-Code im
  Vollbild zeigen“. Nachts sind beide gleich bernsteinfarben. Die eigentliche
  Übergabe hebt sich nicht ab.
- **Umschalter im Feld-Modus (beobachtet):** „Standard“ und „Dunkel“ stehen
  als weiße Felder ohne Trennlinie nebeneinander. Die Segmentgrenze ist
  nicht zu sehen.
- **Rahmen in Standard und Feld (gemessen):** Die Nebenknöpfe der
  Einsatzansicht auf dem Seitengrund haben einen Rahmen von 2,79:1 (#8b94a9
  auf #f3f5f9). Das betrifft „Einheit manuell erfassen…“, „Bögen einlesen…“,
  „Lageblatt“ und die Exportknöpfe. Die Warnmarken „Ruhezeit“ und
  „Unterbringung angefordert“ haben im Feld-Modus einen Rahmen von 1,79:1
  (#ddbe79 auf Weiß). Die Schrift trägt in beiden Fällen, in der Sonne
  verschwimmen aber die Kanten.

**Empfehlung:** Platzhalter nachts um eine Stufe aufhellen. Der Ladehinweis
braucht einen Rahmen in Warnfarbe. Im Übergabe-Dialog sollte nur ein
Primärknopf stehen. Der Feld-Umschalter braucht Trennlinien. Rahmen auf dem
Seitengrund und Markenrahmen im Feld-Modus ≥ 3:1.

**Nachprüfung:** Je Punkt erneut messen bzw. ansehen; Schwellen wie
angegeben.

## Bestätigtes

- **Text in der App:** Assistent (6 Schritte), Startseite, Dialoge,
  Einsatzansicht (Karten), QR-Vollbild und Scanner: kein aktiver Text unter
  4,5:1 in allen vier Modi. Ausnahmen sind nur deaktivierte Knöpfe, etwa
  „← Zurück“ in Schritt 1 mit 2,86:1 in Nacht, und die Tabelle (R3-L3).
  Warnungen und Fehler liegen nachts über 7:1, zum Beispiel „⚠ Signatur
  ungültig“ mit 7,05:1.
- **Begleitseiten:** 36 von 36 Seiten in Nacht, Dunkel und System-dunkel
  ohne Text unter 4,5:1. Klasse und Grund werden korrekt übernommen.
- **Helligkeit Nacht:** Startseite mit mittlerer Luminanz 0,043 und 3,0 %
  hellen Bildpunkten. Zum Vergleich: Dunkel 0,064 und 3,8 %, Standard 0,698
  und 71,7 %. Die Übersicht ist bis zur QR-Platte dunkel.
- **QR-Vollbild:** Die weiße Platte misst 331 × 331 px. Das sind 47,5 % des
  Bildes und 34,6 % helle Bildpunkte, im Standard-Modus 80,8 %. Der Rest
  ist Nacht-Grund. Darunter steht der Hinweis „Display-Helligkeit hoch
  stellen hilft beim Scannen“.
- **Kaltstart:** Im Nacht-Modus bei gedrosselter CPU liegt die mittlere
  Luminanz von der ersten Aufnahme an bei 0,006 bis 0,043. Bei System-dunkel
  ohne Wahl ist sie konstant 0,064. Es gibt keinen hellen Blitz.
- **Systemwechsel:** Ein Wechsel von `colorScheme` während der Sitzung
  schaltet den Modus nicht um.
- **Themenwechsel während der Eingabe:** Der eingetippte Vorname bleibt
  stehen, die Klasse wechselt sofort.
- **Browserleiste:** `theme-color` steht im Nacht-Modus auf #221f16, in den
  anderen Modi auf der Kennfarbe (#20214f beim THW-Bogen).
- **Feldrahmen:** Dunkel 3,45:1 und Nacht 3,41:1 gegen die Karte. Leere
  Felder sind auf den Screenshots klar umrissen.
- **Fokus in der Schrittleiste:** Rahmen in der Kopf-Schriftfarbe, 15,09:1
  in Standard, Feld und Dunkel, 10,47:1 in Nacht.
- **Schrittleiste:** „offen“ als Wort und „✓“. Der aktive Schritt ist
  zusätzlich unterstrichen (3 px). In Nacht haben „offen“ und der aktive
  Schritt dieselbe Bernsteinfarbe, die Unterstreichung trennt sie.
- **Nicht nur Farbe:** Unter Deuteranopie und Achromatopsie bleiben
  erkennbar: „ABGERÜCKT“ und „ZUSAMMENGEFÜHRT“ mit Durchstreichung und
  gestrichelter Kante, „● Ruhezeit“, „● Unterbringung angefordert“,
  „⚠ Signatur ungültig“ und „⚠ 1 offener Punkt“.
- **Scanner nachts:** Überschrift und Anleitung im warmen Nacht-Text,
  Fehlerzeile im Nacht-Alarmton, Grund schwarz.
- **PDF-Vorschau:** Der Rahmen hat im Nacht-Modus `brightness(0.55)
  sepia(0.35)`. Den Inhalt konnte ich nicht prüfen (siehe Prüfaufbau).
- **Dateifehler auf der Startseite:** Die Meldung steht mit `role="alert"`
  bei 239–304 px voll im Bild, nachts 7:1.
- **Feld-Modus:** Schwarz auf Hellgrau, 112 % Schrift, 2-px-Rahmen,
  Statusmarken mit dunkler Schrift. Für die Sonne die richtige Antwort.

## Abschluss

- **Aufgabe geschafft:** ja. Am Meldekopf mit Umweg: Ob „Bögen einlesen…“
  geklappt hat, sieht man erst nach Scrollen (R3-L1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Nach „Bögen einlesen…“ passiert scheinbar
  nichts, weil Erfolg wie Fehler 2 000 px tiefer stehen (R3-L1).
- **Größtes Einsatzrisiko:** Ein Bogen mit ungültiger Signatur fällt in der
  zugeklappten Liste und in der Tabelle nicht auf und geht unbemerkt in die
  Summen ein (R3-L2).
- **Top-Priorität für die nächste Iteration:** Rückmeldungen der
  Einsatzansicht ins Bild holen, wie auf der Startseite (R3-L1).

## Abgleich mit Runde 2

Grundlage: [../runde-2/nacht-und-sicht.md](../runde-2/nacht-und-sicht.md)
und [../runde-2/README.md → Stand der Behebung](../runde-2/README.md#stand-der-behebung).

| Runde-2-Befund | Stand laut README | Bewertung Runde 3 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R2-L1 Begleitseiten dunkel unlesbar (P1) | behoben | **hält** | 36 von 36 Seiten in Nacht, Dunkel und System-dunkel ohne Text unter 4,5:1. Neu daneben: Bilder im Dunkel-Modus ungedimmt, bis 55 % helle Bildpunkte im Viewport, Anleitungs-Screenshot veraltet (R3-L4). Das ist keine Folge der Behebung; die Bilder fielen neben dem unlesbaren Text in Runde 2 nur nicht auf. |
| R2-L2 Dateifehler außerhalb des Bildes (P2) | behoben (Startseite), Einsatzansicht unverändert | **wirkt teilweise** | Startseite: Meldung bei 239–304 px im Bild, `role="alert"`. Einsatzansicht: Fehler bei 2 711 px, Erfolg „1 Bogen aufgenommen.“ bei 2 848 px, Knopf bei scrollY 579. Weiter offen als R3-L1. |
| R2-L3 Feldrahmen dunkel (P3) | behoben | **hält** | Dunkel 3,45:1, Nacht 3,41:1. Leere Felder sind auf allen Schritt-Screenshots umrissen. |
| R2-L4 Fokus in der Schrittleiste (P3) | behoben | **hält** | Kopf-Schriftfarbe, 15,09:1 (Standard, Feld, Dunkel), 10,47:1 (Nacht). |
| R2-L5 Abgerückt gedimmt (P3) | behoben | **wirkt teilweise** | Karten: volle Deckkraft, Durchstreichung, Marke mit Rahmen, kein Text unter der Schwelle. Tabellenansicht: Zeilen weiter auf 0,55, Statuswort 2,33:1 (Standard) bis 3,44:1 (Feld). Weiter offen als R3-L3. |
| R2-L6 Helle Reste im Nacht-Thema (P3) | behoben, QR-Platte bleibt weiß | **hält** | Scanner-Texte im Nacht-Ton, PDF-Rahmen gefiltert, `theme-color` #221f16. QR-Platte unverändert weiß mit 47,5 % der Fläche; das ist eine bewusste Entscheidung und hier kein Befund. |

Keine Behebung hat sich verkehrt. Bilanz: Von sechs Runde-2-Befunden halten
vier (R2-L1, R2-L3, R2-L4, R2-L6). Zwei wirken teilweise: R2-L2 und R2-L5
sind jeweils nur in einer von zwei Ansichten behoben. Neu in Runde 3:
R3-L2 (P2), R3-L4, R3-L5, R3-L6 und R3-L7 (alle P3). R3-L1 und R3-L3 sind
die Reste von R2-L2 und R2-L5. Zusammen: 0 × P0, 0 × P1, 2 × P2, 5 × P3.

## Stand der Behebung

Stand 05.10.2026, Paket „Rückmeldungen im Bild, Scrollposition, Doppeltipp,
Rückgängig". Geprüft mit Typprüfung, Unit-Tests (2 352 grün) und Nachmessung
im Dev-Server (360 × 640, 320 × 568, 640 × 360, `isMobile`/`hasTouch`,
de-DE). Aufgeführt sind nur die Befunde dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R3-L1 Rückmeldung nach „Bögen einlesen…“ außerhalb des Bilds | behoben | Rückmeldung (Erfolg und Fehler) direkt unter den Aufnahme-Knöpfen, holt sich ins Bild, `role="alert"` bei Fehlern, bleibt bis zum nächsten Einlesen; Bilderstapel-Bericht am selben Platz. Nachlauf mit dem Knopf in Bildmitte: falsche Datei 382–454 px (360 × 640), 345–441 px (320 × 568), 216–264 px (640 × 360), vorher 2 711 px; gültige Datei 382–424 / 345–387 / 222–264 px. Nach „In Einsatz übernehmen“ und Scan steht „Zuletzt eingelesen“ ganz im Bild (siehe R3-S7). |

Stand 05.10.2026, Paket „Begriffe, Sicht, Rückfragen, Kleinkram“. Geprüft mit Typprüfung, Unit- und
Oberflächentests (2 418 grün) und Nachmessung im Dev-Server (360 × 640,
320 × 568, 640 × 360, Standard / Feld / Dunkel / Nacht, `isMobile`/`hasTouch`,
de-DE; Kontraste aus den berechneten Farben). Aufgeführt sind nur die Befunde
dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R3-L2 „Signatur ungültig“ nur aufgeklappt | behoben | Marke „⚠ Signatur ungültig“ mit Rahmen im Kopf jeder Karte (zu- und aufgeklappt) und im Zeilenkopf der Tabelle; gültige Signaturen ohne Marke. Nachlauf (8 Einheiten, alle zugeklappt): Schrift und Rahmen 7,41 (Standard, Feld), 8,71 (Dunkel), 7,05:1 (Nacht). |
| R3-L3 Tabelle: Abgerückte auf 55 % Deckkraft | behoben | Keine Deckkraft mehr; nur der Name durchgestrichen, Statuswort als Marke, Zahlen in der Nebentextfarbe. Nachlauf: Statuswort 18,43 / 21,0 / 14,46 / 11,61:1 (Standard / Feld / Dunkel / Nacht, vorher 2,33 / 3,44 / 3,38 / 2,77), „Nr.“ und Zahlen 5,92 / 14,18 / 8,17 / 6,31:1, „alt“ 7,51 / 7,51 / 10,27 / 8,15:1. |
| R3-L4 Begleitseiten: Bilder im Dunkel-Modus ungedimmt | weitgehend | `scripts/content-stil.mts` dimmt Fotos und Bildschirmfotos auch im Dunkel-Modus (und bei System-dunkel) mit `brightness(0.7)`, Strichcodes ausgenommen; 36 Seiten neu erzeugt, Generator-Test prüft es. Alle 12 Aufnahmen neu (vier Modi im Umschalter, aktuelle Startseite und Einsatzansicht; Beispiele ohne Übungsband, Zeitraum ab heute). Nachlauf: Bildfläche in Dunkel/System-dunkel/Nacht 0 % helle Bildpunkte (Standard 72–81 %). Je Viewport höchstens 10,5 % (Anleitung), 11,5 % (asb), 12,3 % (johanniter) im Dunkel-Modus — derselbe Wert mit ausgeblendeten Bildern, er kommt von der hellen Schrift. Offen: eigene dunkle Fassung der Aufnahmen. |
| R3-L5 Größenzeichen auf dunklem Grund unsichtbar | behoben | In Dunkel und Nacht trägt jedes taktische Zeichen die helle Unterlage (gedämpft durch den Modusfilter), auch im App-Kopf (`platform-ios`/`-android`). Nachlauf (Startseitenkarte, Kopf, Übersicht; Web und `platform-android`): Punkt 14,88:1 (Dunkel), 8,62:1 (Nacht), vorher 1,21 bzw. 1,15:1. Die nativen Apps selbst nicht geprüft. |
| R3-L6 Moduswechsel nur ganz oben | behoben | Knopf „◐“ in der festen Fußleiste des Assistenten; ein Tipp klappt die vier Modi auf, der zweite wählt; das Element in der Bildmitte bleibt an seiner Stelle. Unter 360 px trägt „← Zurück“ nur den Pfeil. Nachlauf (Schritt 3, halbe Höhe): zwei Tipps bis Nacht, Element 279 → 279 px (360 × 640, 320 × 568 Feld), 178 → 178 px (640 × 360); Leiste in allen Größen gerätebreit. |
| R3-L7 Kleinere Sichtreste | behoben | Nacht `--text-3` #8c816b (Platzhalter 4,75:1, vorher 4,44); Ladehinweis mit Rahmen in Schriftfarbe; im Übergabe-Dialog nur „QR-Code im Vollbild zeigen“ als Primärknopf; Segmentgrenzen in `--linie-stark` (3,37 / 18,58 / 3,45 / 3,41:1, vorher unsichtbar); `--n-400` #838ca1 (Knopfrahmen auf Seitengrund 3,09:1, vorher 2,79); Markenrahmen Feld #9c7a24 (4,02:1, vorher 1,79). |
