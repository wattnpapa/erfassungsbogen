# Audit „Führungssicht“, Schwerpunkt Beispielbögen (Kräfteansatz für eine Übung zusammenstellen)

Prüfer: Rollenaudit `thw-command-reviewer` · Datum: 2026-11-08 ·
Prüfgegenstand: Live-Seite https://erfassungsbogen.app/ (Version
`v2026.1108.2056`), Code-Stand Commit `0dd56d4` (`main`). Nur der Bereich
Beispielbögen: Abschnitt „Beispielbögen“ auf der Startseite mit dem Knopf
„Beispielbögen ansehen“ und der Dialog „Beispielbögen“ (Register,
Pfadleiste, Tabelle Einheit/Herkunft/Stärke/Bogen, Aktionen Anzeigen/PDF/Link).
Der Weg der Bögen in eine Einsatz-Sammlung wurde mitgeprüft, weil er zur
Aufgabe der Rolle gehört.

Zählung: **P0: 0 · P1: 1 · P2: 4 · P3: 3** · Hinweise (ohne Priorität): 6

Reiner Prüfbericht, keine Codeänderung. Je Sachverhalt ein Befund. P3 steht nur
dort, wo die Aufgabe der Führung tatsächlich beeinträchtigt wird;
Abwägungsfragen stehen unter „Hinweise“. Taktische Fragen (welche Einheiten
ein Zug haben sollte, ob eine Stärke „richtig“ ist) bewerte ich nicht.

## Rolle und Aufgabe

Führungskraft oder Ausbilder, der für eine Stabsrahmen- oder Meldekopf-Übung
einen realistischen Kräfteansatz zusammenstellen will: zum Beispiel einen
Technischen Zug mit Fachgruppen aus einem THW-Ortsverband oder einen
KatS-Zug eines Landes. Der Ansatz soll verglichen, ausgewählt, an die
Übungsteilnehmer weitergegeben und in eine Einsatz-Sammlung (Übung)
übernommen werden.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen), Locale de-DE,
`deviceScaleFactor` 1. Ansichten: Desktop 1280x900, Tablet 820x1180
(`isMobile`/`hasTouch`), Telefon 390x844 (`isMobile`/`hasTouch`). Skripte und
Bildschirmfotos unter `/tmp/claude-0/audit-fuehrung/`. Keine Eingriffe ins
DOM, keine eingeschleusten Skripte; einzig die Dateiauswahl bei „Bögen
einlesen…“ wurde über `setInputFiles` bedient (entspricht der Auswahl im
Dateidialog).

Geprüft:

- Startseite: Lage des Abschnitts (bei 1280x900 ab y = 1 438 px, also im
  zweiten Bild), Text, Knopf.
- Register oberste Ebene (ASB 4, BBK 5, Bundeswehr 8, DLRG 7, DRK 16,
  Feuerwehr 12, Katastrophenschutz 290, Praktische Ausbildung 41,
  THW 3.634 Bögen), THW (101 Bögen direkt plus „Alle Einheiten aller
  Ortsverbände (LV › RSt › OV)“ mit 3.533), Abstieg bis OV Schweinfurt,
  OV Forchheim und OV Landshut (zwei Technische Züge), Katastrophenschutz
  Hessen (37) und Niedersachsen (33).
- Tabelle: Inhalt je Zeile, Zeilenhöhe, seitliches Rollen, Ladeanzeige.
- „Link“ (Zwischenablage, mit Berechtigung): 657 Zeichen langer Bogen-Link,
  Knopf zeigt „Kopiert“.
- „Anzeigen“ → „In Einsatz-Sammlung ablegen…“ für drei Bögen nacheinander
  (Klicks gezählt, Rückfragen mitgeschrieben).
- „PDF“ für alle sechs Bögen von OV Schweinfurt (rund 4 bis 10 s), danach
  neue Einsatz-Sammlung, einmal mit Art „Einsatz“, einmal mit Art „Übung“,
  und „Bögen einlesen…“ mit allen sechs PDF auf einmal.

## Annahmen

- Für eine Übung ist es üblich, einen Zug aus einer Herkunft (ein OV, ein
  Landkreis) zusammenzustellen und die Stärke des Ansatzes vorab zu kennen.
  Das ist eine Annahme über die Übungsvorbereitung, keine Vorschrift.
- Die Beispielbögen sind ausdrücklich zum „Ansehen, für Übungen oder zum
  Testen des QR-Imports“ gedacht (Erklärung im Dialog); deshalb messe ich sie
  an der Aufgabe „Übung vorbereiten“.

## Nicht prüfbar

- Lokaler Produktionsbuild (privates Submodul fehlt); geprüft wurde nur die
  Live-Seite.
- Echtes Share-Sheet am Telefon oder Tablet (im Headless-Browser gibt es keins;
  „Link“ ging in die Zwischenablage, „PDF“ als Download).
- Drucken der PDF, Scannen der eingebetteten QR-Codes mit Kamera.
- Electron- und Capacitor-Fassung.

## Urteil

Zum **Ansehen** einzelner Bögen taugt der Bereich: Das Register ist klar, die
Bogenzahlen stehen dran, die Pfadleiste führt zurück, der zuletzt geöffnete
Ordner bleibt beim Wiederöffnen stehen, und auf OV-Ebene steht sogar der Zug
(„1. Technischer Zug“, „2. Technischer Zug“) unter der Einheit, in der
Reihenfolge des Zuges. Die Schreibweise 0/2/9//11 mit Fahrzeugzahl ist auf
einen Blick lesbar.

Zum **Zusammenstellen eines Kräfteansatzes** taugt er nur mit Umwegen. Es gibt
keine Auswahl mehrerer Bögen, keine Summe, keine Suche und keine Sortierung.
Der naheliegende Weg in eine Einsatz-Sammlung („Anzeigen“ → „In
Einsatz-Sammlung ablegen…“) kostet rund elf Klicks je Bogen und fragt ab dem
dritten Bogen, ob ein alter Bogen „endgültig gelöscht“ werden soll (BB-K1).
Der Weg, der wirklich funktioniert, ist nirgends beschrieben: jeden Bogen
einzeln als PDF laden und dann alle PDF in der Sammlung mit „Bögen
einlesen…“ auf einmal aufnehmen. Am Tablet (820 px) sind ausgerechnet „PDF“
und „Link“ abgeschnitten (BB-K2). Ohne fremde Hilfe schafft die Aufgabe nur,
wer auf den PDF-Umweg selbst kommt.

Geprüft und in Ordnung (nicht gemeldet):

- Pfad bleibt erhalten: Nach „Anzeigen“, Ablegen und Rückkehr auf die
  Startseite öffnet der Dialog wieder bei „… › RSt Bamberg › OV Schweinfurt“.
- Ladeanzeige „Angaben werden geladen … x von y“ über der Tabelle; leere
  Zellen zeigen „…“ statt „—“.
- Doppelte Einheitstypen sind über die fett gesetzte Herkunft
  unterscheidbar (THW-Liste: „Fachgruppe Wassergefahren (A)“ fünfmal, aus
  Crailsheim, Haßmersheim, Bamberg, Wilhelmshaven usw.); auf OV-Ebene trennt
  der Zughinweis zwei gleichnamige Bergungsgruppen (OV Landshut).
- Mit Art „Übung“ zählt die Sammlung die eingelesenen Beispielbögen: sechs
  Einheiten, 1/11/32//44 (OV Schweinfurt).
- Telefon 390x844: Tabelle wird zu Karten, kein seitliches Rollen
  (308/308 px), alle drei Aktionen sichtbar.

## Befunde

### BB-K1 [P1] Mehrere Beispielbögen lassen sich weder auf einmal weitergeben noch in eine Einsatz-Sammlung übernehmen; der naheliegende Weg fragt nach „endgültig löschen“

- **Typ:** Arbeitsablauf.
- **Neu oder alt (Verweis):** neu.
- **Ort:** Dialog „Beispielbögen“, Tabelle eines Ordners (geprüft OV
  Schweinfurt, sechs Bögen), Aktionen „Anzeigen“, „PDF“, „Link“; danach
  „In Einsatz-Sammlung ablegen…“ im geöffneten Bogen. 1280x900.
- **Beobachtung:** Jede Zeile hat nur Einzelaktionen; es gibt keine
  Auswahlkästchen und keine Aktion für den ganzen Ordner („alle sechs als PDF“,
  „alle in Sammlung“, „Links als Liste“). Gemessene Wege:
  - *Anzeigen → Ablegen:* Für den ersten Bogen 11 Klicks (Dialog öffnen,
    fünf Ordnerebenen, „Anzeigen“, „In Einsatz-Sammlung ablegen…“, „Neue
    Sammlung anlegen…“, Name, „Einsatz anlegen“), für jeden weiteren wieder
    11 (Startseite, Dialog, „Anzeigen“, Rückfrage „Beispielbogen öffnen?“,
    Ablegen, Sammlung wählen …). Der Beispielbogen wird dabei jedes Mal zum
    „eigenen Bogen“ („Dein eigener Bogen ‚THW Schweinfurt Zugtrupp
    Technischer Zug‘ ist noch offen. Bogen fortsetzen“). Beim dritten Bogen
    lautet die Rückfrage: „Der Bogen ‚THW Schweinfurt Zugtrupp Technischer Zug‘
    … auf dem Platz ‚Zuletzt geschlossener Bogen‘ wird dabei endgültig
    gelöscht“, mit den Knöpfen „Beispielbogen öffnen — den alten Bogen vorher
    als Datei sichern“ und „Beispielbogen öffnen — alten Bogen endgültig
    löschen“ (rot). Dieser Bogen liegt zu dem Zeitpunkt längst als Nr. 1 in der
    Sammlung. Für einen Zug mit neun Einheiten (OV Forchheim) wären das rund
    100 Klicks und sieben solcher Rückfragen.
  - *PDF → Bögen einlesen:* Sechs Klicks auf „PDF“ (sechs Downloads,
    zusammen 4 bis 10 s), dann in einer neuen Sammlung „Bögen einlesen…“ mit
    allen sechs Dateien: „6 Bögen aufgenommen“. Das funktioniert, steht aber
    weder in der Erklärung des Dialogs („PDF erzeugt ihn im aktuellen Layout –
    die eingebetteten QR-Codes lassen sich direkt mit der App scannen“) noch
    am Abschnitt auf der Startseite.
  - *Link:* je Klick ein Link (657 Zeichen) in die Zwischenablage, „Kopiert“
    für 3 s; sechs Bögen sind sechs einzelne Kopiervorgänge und Nachrichten.
  - Der Dialog ist nur von der Startseite erreichbar, nicht aus der geöffneten
    Einsatz-Sammlung heraus.
- **Folge:** Wer eine Übung vorbereitet, will „diesen Zug“ in die Sammlung
  oder an die Teilnehmer geben. Der sichtbare Weg ist so lang, dass man nach
  dem zweiten Bogen aufgibt oder sich verzählt (welche Fachgruppe ist schon
  drin?), und die Rückfrage mit „endgültig löschen“ verunsichert, obwohl
  nichts verloren geht. Wer sie falsch versteht und „vorher als Datei
  sichern“ wählt, sammelt für jeden Bogen eine weitere Datei. Ohne
  Kenntnis des PDF-Umwegs ist die Aufgabe praktisch nicht in vertretbarer Zeit
  zu schaffen.
- **Empfehlung:** Mehrfachauswahl in der Tabelle (Kästchen je Zeile und
  „alle in diesem Ordner“) mit den Aktionen „In Einsatz-Sammlung
  übernehmen…“ (Sammlung wählen oder neu anlegen, Art „Übung“ vorgewählt),
  „PDF der Auswahl“ (eine Datei oder ein Stapel) und „Links der Auswahl
  kopieren“. Beispielbögen beim Übernehmen nicht über den Platz „eigener
  Bogen“ führen, damit keine Ersetzen-/Löschen-Rückfrage entsteht. Solange es
  das nicht gibt: den PDF-Umweg in der Erklärung nennen („Mehrere Bögen in
  eine Sammlung: PDF laden, dort ‚Bögen einlesen…‘ mit allen Dateien“) und den
  Dialog auch aus der Sammlung erreichbar machen.
- **Nachprüfung:** OV Forchheim (zehn Bögen) mit höchstens fünf Klicks ab
  geöffnetem Ordner in eine neue Übungs-Sammlung übernehmen; dabei keine
  Rückfrage zum Ersetzen oder Löschen eines Bogens; Sammlung zählt zehn
  Einheiten.

### BB-K2 [P2] Tablet 820 px: „PDF“ und „Link“ liegen außerhalb des sichtbaren Bereichs der Tabelle

- **Typ:** Layout.
- **Neu oder alt (Verweis):** neu.
- **Ort:** Dialog „Beispielbögen“, jede Tabelle (geprüft THW 101 Bögen,
  OV Forchheim, Katastrophenschutz Hessen). 820x1180, Hochformat.
- **Beobachtung:** Der Dialog ist 656 px breit (80 % der Fensterbreite), der
  Rollbereich der Tabelle endet bei x = 713. Die Knöpfe der ersten Zeile
  enden bei x = 705 („Anzeigen“), 783 („PDF“) und 861 („Link“). In der
  THW-Liste und bei Hessen ist „PDF“ angeschnitten und „Link“ ganz verdeckt,
  bei OV Forchheim ist „Link“ nur als Rand zu sehen (Tabelle 685 bzw. 763 bzw.
  769 px breit in 606 px Rollbereich). Im Bildschirmfoto ist kein Hinweis auf
  seitliches Rollen zu erkennen; links und rechts des Dialogs bleiben je rund
  80 px ungenutzt. Bei 1280x900 und bei 390x844 (Kartenform) sind alle drei
  Knöpfe sichtbar.
- **Folge:** Am Tablet, dem typischen Gerät in der Übungsvorbereitung und am
  Meldekopf, sieht man nur „Anzeigen“. Ausgerechnet „PDF“, der einzige
  brauchbare Weg für mehrere Bögen (BB-K1), muss erst durch Wischen innerhalb
  der Tabelle gefunden werden; wer es nicht weiß, hält die Aktionen für nicht
  vorhanden.
- **Empfehlung:** Bei dieser Breite entweder die Kartenform wie am Telefon
  verwenden oder die Aktionen untereinander/als Symbolknöpfe in die Spalte
  setzen; den Dialog die verfügbare Breite nutzen lassen. Alle drei Aktionen
  ohne seitliches Rollen sichtbar.
- **Nachprüfung:** 768x1024, 820x1180 und 1024x768: in jeder Zeile liegen
  alle drei Knöpfe vollständig im Rollbereich (rechter Rand Knopf ≤ rechter
  Rand Rollbereich), kein seitliches Rollen der Tabelle.

### BB-K3 [P2] Keine Summe: Stärke und Fahrzeuge eines Ordners oder Zuges muss man im Kopf addieren

- **Typ:** Informationsdichte.
- **Neu oder alt (Verweis):** neu.
- **Ort:** Tabelle eines OV-Ordners, Spalte „Stärke“. Geprüft OV Schweinfurt,
  OV Forchheim, OV Landshut. Alle Ansichten.
- **Beobachtung:** Über der Tabelle steht nur die Bogenzahl („11 Bögen“).
  Weder eine Gesamtzeile noch Zwischensummen je Zug. OV Landshut mit zwei
  Technischen Zügen ergibt nachgerechnet 1/9/24//34 (1. TZ, fünf Einheiten),
  1/13/41//55 (2. TZ, sechs Einheiten), zusammen 2/22/65//89 und 25 Fahrzeuge;
  nichts davon steht im Dialog. Erst nach dem Übernehmen in eine
  Übungs-Sammlung erscheint die Summe (OV Schweinfurt 1/11/32//44).
- **Folge:** Beim Vergleichen zweier Ortsverbände oder beim Abgleich mit einer
  Vorgabe („Zug mit rund 40 Kräften“) rechnet man auf dem Zettel, mit zehn
  Brüchen pro Ordner. Fehler fallen erst nach der aufwendigen Übernahme auf.
- **Empfehlung:** Unter der Tabelle eine Summenzeile in derselben
  Schreibweise mit Fahrzeugzahl; auf OV-Ebene zusätzlich je Zug (die
  Zugangabe ist ja schon da). Mit Mehrfachauswahl (BB-K1) die Summe der
  Auswahl.
- **Nachprüfung:** OV Landshut zeigt „1. Technischer Zug 1/9/24//34 ·
  2. Technischer Zug 1/13/41//55 · gesamt 2/22/65//89, 25 Fahrzeuge“ (oder
  gleichwertig), ohne Kopfrechnen.

### BB-K4 [P2] Keine Suche, kein Filter, keine Sortierung: einen OV oder alle Einheiten eines Typs findet man nur, wenn man die Ordnerkette kennt

- **Typ:** Navigation.
- **Neu oder alt (Verweis):** neu.
- **Ort:** Dialog „Beispielbögen“, Register und Tabellen. Alle Ansichten.
- **Beobachtung:** Ein bestimmter Ortsverband ist nur über „THW › Alle
  Einheiten aller Ortsverbände › Landesverband › Regionalstelle › OV“
  erreichbar (sechs Klicks ab Startseite); wer nicht weiß, dass Forchheim zur
  RSt Bamberg gehört, öffnet Regionalstellen auf Verdacht. Ein Suchfeld gibt es
  nicht. Die Tabellen sind fest nach Dateiname geordnet (THW-Liste: nach
  Landesverband und laufender Nummer; Katastrophenschutz: alphabetisch nach
  Einheitsbezeichnung), Spaltenköpfe sind nicht sortierbar, ein Filter nach
  Einheitstyp fehlt. „Alle Fachgruppen Wassergefahren“ oder „alle Zugtrupps“
  über 3.533 Bögen hinweg lassen sich nicht zusammenstellen; in der
  101er-Liste stehen 16 Bergungsgruppen und fünf „Fachgruppe Wassergefahren
  (A)“ verstreut zwischen den anderen.
- **Folge:** Wer einen Ansatz um einen bestimmten Einheitstyp ergänzen will
  (zum Beispiel eine zweite Fachgruppe W aus der Nachbarschaft), blättert
  Ordner für Ordner. Vergleichen nach Stärke oder Fahrzeugen ist nur durch
  Scrollen und Merken möglich.
- **Empfehlung:** Ein Suchfeld über alle Bögen (Ort, OV, Einheitstyp,
  Kürzel), Treffer mit Pfad; dazu in der Tabelle Sortierung nach Einheit,
  Herkunft und Stärke oder ein Filter nach Einheitstyp.
- **Nachprüfung:** „Forchheim“ eintippen → OV Forchheim mit zehn Bögen in
  höchstens zwei Schritten; „Wassergefahren“ eintippen → alle Fachgruppen W
  mit Ort.

### BB-K5 [P2] Herkunft und Zugzugehörigkeit sind je nach Ordner anders zu lesen; bei Hessen fehlt der Ort, der Träger steht doppelt

- **Typ:** Erkennbarkeit/Konsistenz.
- **Neu oder alt (Verweis):** neu.
- **Ort:** Spalte „Herkunft“ und Zughinweis unter „Einheit“; Ordner THW
  (101 Bögen), THW OV-Ebene, Katastrophenschutz Hessen und Niedersachsen.
  1280x900 und 820x1180.
- **Beobachtung:**
  - THW OV-Ebene: fett der Ort, darunter „THW“ und Landesverband; unter der
    Einheit der Zug („1. Technischer Zug“). Gut lesbar.
  - THW, 101 Bögen direkt im Ordner: kein Zughinweis, obwohl auch hier
    Zugtrupps und Fachgruppen stehen.
  - Katastrophenschutz Niedersachsen: fett der Ort („Westerstede“), kein
    Hinweis auf einen Zug; ein „Zugtrupp Sanitäts- und Betreuungszug (ZTr
    SBZ)“ steht in Wittmund, Sanitäts- und Betreuungsgruppen in Cloppenburg und
    Holzminden, ohne dass erkennbar wäre, ob sie zusammengehören.
  - Katastrophenschutz Hessen: fett steht in der Spalte „Herkunft“ der Zug
    („Löschzug (LZ)“, „Kreisauskunftsbüro (KAB)“, „Sanitätszug (SanZ)“), nicht
    der Ort; ein Ort steht in keiner Spalte. Bei DRK, MHD und DLRG steht der
    Träger doppelt: „Deutsches Rotes Kreuz — Kreisverband Hochtaunuskreis“ und
    darunter „Kreisverband DRK-Kreisverband Hochtaunuskreis“. Die Zeilen werden
    am Tablet dadurch bis rund 170 px hoch. Fünf Zeilen „Zugtrupp (ZTr)“
    unterscheiden sich nur über diese Herkunftszeilen. Die drei Bögen mit
    „Löschzug (LZ)“ (1. Löschgruppe, 2. Löschgruppe, Ergänzungstrupp) kommen aus
    Main-Kinzig-, Main-Taunus- und Odenwaldkreis; ob „Löschzug (LZ)“ ein
    bestimmter Zug oder nur die Art ist, bleibt offen.
- **Folge:** Wer einen KatS-Zug eines Landes zusammenstellen will, kann nicht
  ablesen, welche Bögen einen Zug bilden und woher sie kommen. In Hessen
  verwechselt man leicht den Zugnamen mit der Herkunft; doppelte Trägerzeilen
  kosten Lesezeit und Platz. Bei der Übernahme gehen Zugangaben ohnehin
  verloren (BB-K7).
- **Empfehlung:** Eine Herkunftsspalte, die überall gleich aufgebaut ist (Ort
  fett, darunter Träger einmal, darunter oberste Ebene), und eine eigene,
  überall gleich gefüllte Angabe „Zug/Verband“, wo es eine gibt; doppelte
  Trägernamen zusammenfassen.
- **Nachprüfung:** In THW, Niedersachsen und Hessen steht in der
  Herkunftsspalte fett ein Ort; keine Zeile nennt denselben Träger zweimal; wo
  Bögen zu einem Zug gehören, steht der Zug in derselben Form wie auf
  OV-Ebene.

### BB-K6 [P3] Übernommene Beispielbögen sind sofort „veraltet“: „Stand vor 50 Tagen“, „älter als 24 h“, „Einsatzzeitraum … ist vorbei“

- **Typ:** Statusklarheit.
- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatz-Sammlung nach „Bögen einlesen…“ der sechs Bögen von
  OV Schweinfurt (Art „Übung“), Tabellenansicht; geöffneter Beispielbogen
  nach „Anzeigen“. 1280x900.
- **Beobachtung:** Alle Beispielbögen tragen einen Stand vom 19.09.2026.
  In der Sammlung steht bei jeder Einheit „⚠ Stand vor 50 Tagen“ und
  „19.09.2026, 06:36 älter als 24 h“; die Eintreffzeit ist die Einlesezeit
  mit „*“. Der geöffnete Bogen meldet „Einsatzzeitraum 19.09.2026 ist vorbei —
  gilt dieser Bogen noch für den aktuellen Einsatz?“.
- **Folge:** Eine frisch vorbereitete Übungslage ist von Anfang an voller
  Warnzeichen. Teilnehmer lernen dabei, die Veraltet-Warnung zu übergehen,
  die im Ernstfall gerade auffallen soll; der Ausbilder muss jede Warnung vor
  der Übung erklären.
- **Empfehlung:** Beispielbögen beim Öffnen und Übernehmen auf „jetzt“
  datieren (Stand und Einsatzzeitraum), oder beim Übernehmen anbieten:
  „Stand auf heute setzen (Übung)“.
- **Nachprüfung:** Sechs Beispielbögen in eine neue Übungs-Sammlung übernehmen:
  keine Veraltet-Warnung, kein Hinweis „Einsatzzeitraum ist vorbei“.

### BB-K7 [P3] Zug aus der Liste und Art „Übung“ kommen in der Sammlung nicht an

- **Typ:** Arbeitsablauf.
- **Neu oder alt (Verweis):** neu.
- **Ort:** Übernahme von OV Schweinfurt (Dialog zeigt sechsmal „1. Technischer
  Zug“) in eine Einsatz-Sammlung, über beide Wege aus BB-K1. 1280x900.
- **Beobachtung:** Nach dem Einlesen steht „6 ohne Zug“ und „Zug für 6
  Einheiten ohne Zug: Zuordnen“; die Zugangabe aus dem Dialog ist nicht im
  Bogen. Über „In Einsatz-Sammlung ablegen…“ → „Neue Sammlung anlegen…“ ist
  die Art „Einsatz“ vorgewählt, obwohl jeder Beispielbogen eine Übung ist;
  dann steht die Lage auf 0/0/0//0 mit „Nichts gezählt: alle 2 eingegangenen
  Meldungen sind Übung und zählen nicht in diese Lage“. Mit Art „Übung“ zählt
  sie (1/11/32//44).
- **Folge:** Der Zug muss von Hand wieder eingetragen werden (bei zwei Zügen
  getrennt), und wer die Art nicht umstellt, hat eine Übungslage mit lauter
  Nullen. Beides ist schnell behoben, kostet aber Nachdenken an einer Stelle,
  an der der Ausbilder schon den nächsten Bogen sucht.
- **Empfehlung:** Den Zug als Angabe in den Bogen der OV-Beispiele aufnehmen,
  damit er in der Sammlung gesetzt ist; bei einer neuen Sammlung, die aus
  einem Übungsbogen heraus angelegt wird, Art „Übung“ vorwählen.
- **Nachprüfung:** OV Landshut übernehmen: zwei Züge „1. Technischer Zug“
  (fünf Einheiten) und „2. Technischer Zug“ (sechs) ohne Nacharbeit; neue
  Sammlung aus einem Beispielbogen hat Art „Übung“.

### BB-K8 [P3] Ländernamen im Register „Katastrophenschutz“ teils in Großbuchstaben ohne Umlaut und Bindestrich

- **Typ:** Erkennbarkeit.
- **Neu oder alt (Verweis):** neu.
- **Ort:** Register „Katastrophenschutz“ (12 Länder) und Pfadleiste. Alle
  Ansichten.
- **Beobachtung:** „BADENWUERTTEMBERG“, „BAYERN“, „BERLIN“, „HESSEN“,
  „MECKLENBURG VORPOMMERN“, „NORDRHEIN WESTFALEN“, „RHEINLAND PFALZ“,
  „SAARLAND“ stehen in Großbuchstaben, „Brandenburg“, „Niedersachsen“,
  „Sachsen“, „Thüringen“ normal geschrieben. Die Pfadleiste übernimmt das
  („Alle › Katastrophenschutz › HESSEN“).
- **Folge:** Die Liste wirkt wie zwei verschiedene Quellen; beim schnellen
  Überfliegen sucht man „Baden-Württemberg“ und findet es nicht sofort. Der
  Eindruck „hier ist noch etwas unfertig“ mindert das Vertrauen in die übrigen
  Angaben.
- **Empfehlung:** Für alle Länder die amtliche Schreibweise anzeigen.
- **Nachprüfung:** Register zeigt zwölf Ländernamen in einheitlicher
  Schreibweise mit Umlauten und Bindestrichen.

## Hinweise (ohne Priorität)

Abwägungs- und Geschmacksfragen oder Beobachtungen ohne erkennbare
Beeinträchtigung der Aufgabe; nicht in der Zählung.

- **H1 (Telefon):** Bei 390x844 ist jede Karte 197 bis 227 px hoch; es passen
  gut drei Einheiten auf einen Bildschirm, die THW-Liste mit 101 Bögen ist
  rund 24 400 px lang (Desktop 8 300 px). Zum Ansehen reicht das, zum
  Vergleichen nicht; für die Rolle ist das Telefon aber nicht das Hauptgerät.
- **H2 (Zeichen):** Die taktischen Zeichen in der Spalte „Einheit“ sind rund
  30 px hoch; die Innenbeschriftung („Log-V“, „MHP“, „WP“) ist darin nicht zu
  lesen. Der Name steht daneben, deshalb kein Befund; als Erkennungshilfe
  beim Überfliegen wirkt nur die Grundform und die Farbe.
- **H3 (Pfad):** Der Ordnername „Alle Einheiten aller Ortsverbände (LV › RSt ›
  OV)“ ist lang; bei 1280 px bricht er im Register auf drei Zeilen um, bei
  820 px und 390 px schiebt er die Pfadleiste auf zwei bis drei Zeilen. Das
  „›“ im Namen sieht dort aus wie ein weiterer Pfadschritt.
- **H4 (Daten):** „Fachgruppe Schwere Bergung (A)“ steht in OV Schweinfurt und
  OV Forchheim mit „0 Fahrzeuge“, „IuK-Zentrale (IuKZt)“ in Hessen ebenso.
  Ob das so gewollt ist, kann ich nicht beurteilen; in einer Übungslage fällt
  es auf und wird nachgefragt.
- **H5 (Startseite):** Der Abschnitt „Beispielbögen“ steht bei 1280x900 erst
  ab y = 1 438 px, unter dem Erklärfilm und „So funktioniert's“. Für
  Erstnutzer passt das; wer regelmäßig Übungen vorbereitet, scrollt jedes Mal.
- **H6 (Reihenfolge):** In OV Forchheim steht die „Fachgruppe
  Logistik-Verpflegung“ (Fachzug Logistik) vor dem Zugtrupp des 1. Technischen
  Zuges, weil nach Dateiname sortiert wird. Mit dem Zughinweis ist das
  lesbar, eine Gruppierung je Zug mit Überschrift wäre klarer (siehe BB-K3).

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (Ansehen und Vergleichen ja, Übernehmen
  mehrerer Bögen nur über den nicht beschriebenen PDF-Umweg).
- **Fremde Hilfe nötig:** ja, für das Übernehmen eines ganzen Zuges in die
  Sammlung, es sei denn, man kommt selbst auf „PDF laden, dann Bögen
  einlesen…“.
- **Größtes Missverständnis:** Die Rückfrage „alten Bogen endgültig löschen“
  beim dritten Beispielbogen lässt glauben, dass beim Zusammenstellen gerade
  eine schon abgelegte Einheit verloren geht.
- **Größtes Einsatzrisiko:** Eine Übungslage, die aus Beispielbögen
  zusammengestellt ist, zeigt durchgehend Veraltet-Warnungen und, bei Art
  „Einsatz“, lauter Nullen; Teilnehmer üben so das Übersehen von Warnungen.
- **Top-Priorität für die nächste Iteration:** Mehrfachauswahl im Dialog mit
  „In Einsatz-Sammlung übernehmen…“ (Art „Übung“ vorgewählt) und einer Summe
  der Auswahl.
