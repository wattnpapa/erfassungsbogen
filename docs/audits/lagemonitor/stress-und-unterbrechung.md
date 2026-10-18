# Stress und Unterbrechung — Lagemonitor (R6-S)

Rolle: technisch-praktisch versierter THW-Helfer unter Zeitdruck, Lärm,
Unterbrechungen. Geprüft im Produktionsbuild (Port 4173), Chrome 153
(Playwright), Einsatzansicht 1280 × 800, Monitor 1920 × 1080, Einsätze
„Hochwasser Süd" (leer) und „Wattsturm 2026" (voll).

Durchgespielt: Funkrufname eintragen und ohne Bestätigung neu laden; „Jetzt" für
den Einsatzbeginn, Beginn leeren, Beginn in die Zukunft, langen Funkrufnamen
eingeben; „Lagemonitor öffnen" mit und ohne Popup-Sperre und mehrfach geklickt;
Hauptfenster schließen; Einsatz im Speicher entfernen; Monitor von Hand
geöffnet und über „Schließen" beendet; gezielt nach einem Hinweis auf „letzte
Aktualisierung" gesucht.

Urteil: Das Eintragen ist schnell und unterbrechungsfest. Beide Felder speichern
sofort beim Tippen, ein Neuladen mitten im Eintrag verliert nichts und bringt den
Einsatz wieder in die Einsatzansicht. Der Monitor reagiert in unter 50 ms auf
Änderungen im Hauptfenster. Schwach sind zwei Stellen: die blockierte
Popup-Öffnung und die fehlende Anzeige, ob der Monitor noch lebt.

## Befunde

### R6-S1 (P1) — Popup blockiert: „Lagemonitor öffnen" macht still das Hauptfenster zum Monitor

- Fundstelle: Einsatzansicht, Block „Lagemonitor für den Fernseher", Knopf
  „Lagemonitor öffnen". Nachgestellt, indem das Öffnen eines neuen Fensters
  blockiert wurde (`window.open` liefert `null`).
- Beobachtung: Kein Hinweis, keine Meldung. Dasselbe Fenster lädt stattdessen
  `?lagemonitor=<ID>`; die Zahl der Fenster bleibt 1, die Einsatzansicht ist weg.
  Zurück geht es nur über Optionen, dann Schließen (führte im Test zur
  Einsatzansicht „Hochwasser Süd"). Die Rückkehr funktioniert, der Weg dorthin
  steht nirgends beschrieben.
- Folge: Der Helfer zieht „das Fenster" auf den Fernseher und hat auf dem Laptop
  nichts zum Weiterarbeiten. Ohne Hinweis hält er das für einen Absturz; im Lärm
  wird dann wild neu geladen oder die Adresse von Hand angepasst.
- Empfehlung: Bei blockiertem Popup einen deutlichen Hinweis („Fenster wurde
  blockiert, Monitor läuft jetzt hier. Zurück: Optionen, Schließen") und eine
  Anleitung, Popups für die Seite zu erlauben; „Schließen" im Monitor soll vom
  Fernsehplatz aus erreichbar bleiben.
- Nachprüfung: Browser-Popups sperren, Knopf drücken: Es wird ein Hinweis sichtbar,
  der Weg zurück ist in einem Schritt erkennbar.

### R6-S2 (P1) — Keine Anzeige „Stand/letzte Aktualisierung": ein eingefrorener Monitor sieht aus wie ein lebender

- Fundstelle: Monitor (1920 × 1080, alle drei Bereiche aufgeklappt).
- Beobachtung: Im gesamten Seitentext kommt weder „Stand" noch „aktualisiert" noch
  „zuletzt" vor, es gibt keine Sekundenanzeige, kein `<time>`-Element, keine
  Live-Region. Einziges Lebenszeichen ist die DTG-Minute und die Einsatzdauer in
  Minuten. Ein eingefrorenes Fenster ist deshalb frühestens nach etwa 60 s
  erkennbar, und nur, wenn jemand genau auf die Minutenziffer achtet. Wird das
  Hauptfenster geschlossen, bleibt der Monitor ohne Hinweis stehen und zeigt die
  zuletzt gespeicherten Daten; der Betrachter sieht nicht, dass keine neuen
  Meldungen mehr einlaufen.
- Folge: Die Führungskraft liest eine veraltete Stärke als aktuell, z. B. wenn das
  Hauptfenster hängt, der Laptop im Standby ist oder die Erfassung in einem
  anderen Browser oder Profil mit eigenem Speicher läuft. Das ist im Einsatz die
  gefährlichste Fehlinterpretation dieser Ansicht. Ein Hängen des Fensters selbst
  konnte der Prüfer nicht erzeugen; die Aussage beruht auf der fehlenden Anzeige.
- Empfehlung: Eine kleine, lesbare Zeile „Stand der Daten: 18 0812" (Zeitpunkt der
  letzten Änderung im Speicher) und ein Puls- oder Sekundenindikator, der nur
  läuft, wenn die 5-s-Aktualisierung arbeitet; wird der Stand zu alt, deutlich
  warnen (Farbe plus Text).
- Nachprüfung: Timer anhalten oder Fenster verdecken: Binnen kurzer Zeit
  erscheint eine Warnung; die Stand-Zeile ändert sich bei neuer Erfassung.

### R6-S3 (P2) — Nach „Jetzt" zeigt der Monitor bis zum nächsten Takt „Einsatz beginnt noch"

- Fundstelle: Einsatzansicht, Knopf „Jetzt", danach Monitor, Zeile Einsatzdauer.
- Beobachtung: Der gespeicherte Beginn stimmt (Differenz zur Systemzeit 8 ms).
  Trotzdem steht am Monitor „Einsatz beginnt noch" (gemessen um 08:12:44, Wechsel
  auf „0 Stunden, 0 Minuten" erst um 08:13:05). Bei einem Beginn in der Zukunft
  ist der Text richtig.
- Folge: Wer „Jetzt" drückt und zum Fernseher schaut, glaubt, der Beginn sei
  falsch gesetzt, und tippt erneut oder verändert das Feld — ein Vertrauensverlust
  unter Zeitdruck.
- Empfehlung: Bei „Jetzt" direkt „0 Stunden, 0 Minuten" anzeigen (Ursache:
  Zeitstempel des Taktes liegt vor dem gespeicherten Beginn).
- Nachprüfung: „Jetzt" drücken und binnen 5 s den Monitor lesen.

### R6-S4 (P2) — Langer Funkrufname wird still abgeschnitten

- Fundstelle: Monitor, Kopfzeile, 1920 × 1080.
- Beobachtung: „Heros Übungsleitung Einsatzabschnitt Nordhafen Bereitstellungsraum
  Alpha" erscheint zweizeilig und endet auf „Bereitstellun", ohne
  Auslassungszeichen. Im Eingabefeld gibt es keine Längenwarnung.
- Folge: Ein am Fernseher falsch gelesener Funkrufname kann zu einem falschen Ruf
  führen; die Kürzung ist nicht erkennbar.
- Empfehlung: Schrift verkleinern statt abschneiden oder Auslassungszeichen
  setzen; im Eingabefeld eine Längengrenze mit Zähler.
- Nachprüfung: Namen mit 60 und 80 Zeichen eintragen.

### R6-S5 (P3) — Block liegt weit unten in der Einsatzansicht

- Fundstelle: Einsatzansicht 1280 × 800, nach „Einsatz weitergeben / sichern",
  Lageblatt und Blanko-Vordruck.
- Beobachtung: Man muss scrollen; ein Sprungverweis wie bei „Weitergeben,
  Lageblatt, Export ↓" fehlt für den Monitor. Der erklärende Text ist ein langer
  Absatz.
- Folge: In Eile sucht man den Block zwischen Exportknöpfen, ein kleiner
  Zeitverlust.
- Empfehlung: Sprungverweis oder Knopf „Lagemonitor" im oberen Bereich.
- Nachprüfung: Von der Startseite aus zählen, wie viele Klicks und Scrolls bis zum
  Knopf nötig sind.

Nicht belegt (Prüfhinweis): Teil-Eingabe im Feld „Einsatzbeginn". Nachdem nur das
Datum getippt war, blieb der Feldwert leer und nichts wurde gespeichert; ob die
Uhrzeit anschließend übernommen wird, ließ sich mit der Tastatursimulation nicht
sicher klären. Bitte mit echtem Gerät prüfen: Datum tippen, Uhrzeit offen lassen,
Seite verlassen, wiederkommen. Gleiches gilt für das Feldformat (hier
amerikanisch, abhängig vom Gebietsschema).

## Was gut ist

- Funkrufname und Einsatzbeginn werden sofort beim Tippen gespeichert, kein
  Speichern-Knopf nötig; Neuladen verliert nichts.
- Ein zweiter und dritter Klick auf „Lagemonitor öffnen" erzeugt kein weiteres
  Fenster, das vorhandene wird wiederverwendet.
- Änderungen im Hauptfenster erscheinen im Monitor in unter 50 ms (Funkrufname
  44 ms, Einsatzbeginn 4 ms).
- Wird der Einsatz im Speicher entfernt, zeigt der Monitor nach spätestens 5 s
  klar „Dieser Einsatz ist auf diesem Gerät nicht (mehr) vorhanden" mit
  „Schließen".
- „Schließen" bringt auch bei von Hand geöffneter Adresse zur App zurück.
- Der leere Einsatzbeginn wird lesbar als „Einsatzbeginn nicht gesetzt" gezeigt;
  die DTG-Zeile ist bei 1920 × 1080 groß und kontrastreich.

## Zählung

| P0 | P1 | P2 | P3 |
| --- | --- | --- | --- |
| 0 | 2 | 2 | 1 |

Größtes Einsatzrisiko: Ein eingefrorener oder vom Hauptfenster abgekoppelter
Monitor sieht aus wie ein aktueller und zeigt keinen Stand der Daten (R6-S2).
Wichtigster nächster Schritt: Eine Zeile „Stand der Daten" mit Warnung bei zu
altem Stand im Monitor einbauen.
