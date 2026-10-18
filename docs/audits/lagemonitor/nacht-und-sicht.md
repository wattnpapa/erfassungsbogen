# Nacht und Sicht — Lagemonitor (R6-L)

Rolle: THW-Helfer, Fahrzeugkabine nachts, wechselnde Beleuchtung, Sonne durch
die Scheibe. Geprüft wurde der Lagemonitor im Produktionsbuild
(`vite build` + `vite preview`, Port 4173) mit Chrome 153 (Headless), Fenster
1920 × 1080 und 1366 × 768 (leerer Einsatz), Einsätze „voll" (16 Einheiten)
und „leer". Der Prüfer hat den Monitor zu- und aufgeklappt angesehen, Farben,
Schriftgrößen und Deckkraft aus dem Browser gelesen, die Kontraste nach der
WCAG-Formel selbst gerechnet und in den Optionen auf „Hell" umgeschaltet.
Nicht prüfbar: reale Fernsehhelligkeit, Spiegelung und Sonne auf einem echten
Gerät, Rot-Grün-Simulation.

Urteil: Schrift und Zeit sind sehr gut lesbar, der Kontrast ist hoch. Das
Risiko liegt in der Blendung, in den blauen Linien und im Hell-Umschalter.
Zustände werden nirgends allein über Farbe vermittelt.

Gerechnete Kontraste:

| Paarung | Kontrast |
| --- | --- |
| Weiß auf Schwarz | 21 : 1 |
| Rot #ff0000 auf Schwarz | 5,25 : 1 |
| Blau #0000ff auf Schwarz (Rahmen) | 2,44 : 1 |
| Weiß auf Blau | 8,6 : 1 |
| Graue Kopfzeile und Beschriftungen (Weiß, Deckkraft 0,75) | 11,4 : 1 |
| Hell-Modus: Rot #cc0000 auf Weiß | 5,9 : 1 |
| Hell-Modus: Blau #0000cc auf Weiß | 11,2 : 1 |
| Hell-Modus: graue Kopfzeile auf Weiß | 10,4 : 1 |

## Befunde

### R6-L1 (P1) — Hell/Dunkel ist versteckt, wird nicht gemerkt und blendet nachts

- Fundstelle: Optionen (zu Beginn zugeklappt, ganz unten), Knöpfe Hell,
  Vollbild, Schließen.
- Beobachtung: Der Umschalter liegt im zugeklappten letzten Block. Nach „Hell"
  und Neuladen war der Monitor wieder dunkel (Klasse `lm`, nicht `lm-hell`),
  alle Blöcke wieder zu: Die Wahl wird nicht gespeichert. Die Knöpfe sind
  reinweiß (#fff) mit dunkler Schrift, 58 px hoch, und im Dunkelmodus die
  einzigen sehr hellen Flächen. „Hell" nennt das Ziel, nicht den Zustand. Es
  gibt nur zwei Stufen, keine gedimmte Mitte.
- Folge: Wer tagsüber auf Hell gestellt hat, muss es nach jedem Neuladen oder
  Neustart des Fensters wiederholen. Bei Sonne durch die Scheibe spiegelt ein
  schwarzer Fernseher stark, die Zeit ist schwer zu lesen. Nachts blenden die
  drei weißen Knöpfe beim Öffnen der Optionen.
- Empfehlung: Wahl je Gerät speichern, aktuellen Zustand sichtbar machen (z. B.
  „Hell: aus"), Knöpfe im Dunkelmodus dunkel mit heller Schrift und Rand
  darstellen, optional automatische Wahl nach Tageszeit.
- Nachprüfung: Auf Hell stellen, neu laden: Hell bleibt. Optionen im
  Dunkelmodus öffnen: keine weißen Flächen.

### R6-L2 (P2) — Blaue Rahmen sind zu dunkel und zu dünn für die Lesedistanz

- Fundstelle: Zeilenrahmen (3 px) und Tabellenlinien (1 px), Dunkelmodus.
- Beobachtung: Reines Blau auf Schwarz hat 2,44 : 1, unter den üblichen 3 : 1
  für Linien, und die niedrigste Helligkeit der Grundfarben. Die
  1-px-Tabellenlinien sind im Screenshot kaum zu sehen. Im Hell-Modus ist
  derselbe Rahmen (#0000cc auf Weiß, 11,2 : 1) deutlich kräftiger, die Modi
  sind ungleich.
- Folge: Aus mehreren Metern verschwinden die Zeilentrennungen der Tabelle,
  man verrutscht leicht in die Nachbarzeile (Funkrufname, Einheitentyp, F/U/M).
  Reines Blau auf Schwarz kann an manchen Fernsehern flimmern (plausibel,
  nicht gemessen).
- Empfehlung: helleres Blau oder Cyan (mindestens 3 : 1, besser 4,5 : 1),
  Tabellenlinien kräftiger oder durch Zeilenabstand und Zebra ersetzen.
- Nachprüfung: Graustufen-Screenshot aus 3 m Abstand: Zeilen erkennbar.
  Kontrast der Rahmenfarbe mindestens 3 : 1.

### R6-L3 (P2) — Große weiße Flächen und weiße Schrift auf reinem Schwarz blenden bei Dunkeladaption

- Fundstelle: Zeilen 1, 2, 4, 5 (Schrift 65 bis 76 px), Tabelle, Dunkelmodus.
- Beobachtung: Rein weiß auf rein schwarz, 21 : 1, maximal. Die rote Zeit
  (5,25 : 1, 227 px) blendet dagegen nicht und schont die Nachtsicht eher. Der
  Hell-Modus füllt das ganze Fenster weiß (auch der Body wird #fff).
- Folge: Nach dem Blick auf den Fernseher sieht man nachts draußen schlechter.
  Bei Hell nachts wäre der ganze Fernseher eine Leuchtfläche.
- Empfehlung: Text im Dunkelmodus auf etwa 85 bis 90 Prozent dämpfen (z. B.
  #e6e6e6), Zeit rot lassen, Hell-Modus als reinen Tagmodus kennzeichnen.
- Nachprüfung: Auf echtem Fernseher bei Nachtbeleuchtung vergleichen, Kontrast
  des gedämpften Texts weiter mindestens 7 : 1.

### R6-L4 (P2) — Tabellenumbrüche mitten im Wort

- Fundstelle: Einheitentabelle, 1920 px, aufgeklappt.
- Beobachtung: „Einheitentyp" bricht als „Einheitenty / p", „Feuerwehr" als
  „Feuerweh / r". Die Marke „–" für einen fehlenden Funkrufnamen ist ein dünner
  Strich.
- Folge: Aus der Entfernung liest man „Feuerweh" und „r" als zwei Dinge, die
  Spaltenbreiten passen nicht zum Inhalt.
- Empfehlung: Spaltenbreite oder Schrift anpassen, Umbruch nur an Leerzeichen,
  Kopf „Typ" erwägen, „–" durch eine deutlichere Marke ersetzen („ohne").
- Nachprüfung: Beide Wörter bei 1920 und 1366 ohne Wortbruch.

### R6-L5 (P3) — Beschriftungen sind lesbar, aber klein

- Beobachtung: Tabellenkopf 39,7 px bei Deckkraft 0,75, Einsatzdaten und
  Klappköpfe 34,6 px, Kontrast etwa 11 : 1, nur die Größe ist die Grenze.
  Aufgeklappt braucht der Einsatz mit 16 Einheiten etwa 2420 px Höhe, der
  Fernseher zeigt 1080 px.
- Folge: Die Kopfzeile wird erst nahe am Fernseher gelesen; die Zeilen unten
  rutschen aus dem Bild (Scrollen ohne Eingabe ist nicht vorgesehen).
- Empfehlung: Kopfzeile auf volle Deckkraft, Beschriftungen mindestens so groß
  wie der Tabellentext.
- Nachprüfung: Lesbar aus 3 m bei 1920 × 1080.

## Was gut ist

- Die Zeit ist rot, 227 px, fett: sofort lesbar, 5,25 : 1.
- Kein Zustand ist nur über Farbe codiert; Bedeutung steckt in Größe,
  Unterstreichung (gesamt) und Wortlaut („Einsatzbeginn nicht gesetzt"). Es gibt
  keine Rot-Grün-Unterscheidungen.
- Graue Beschriftungen halten 10 bis 11 : 1.
- Im Hell-Modus bleiben alle Kontraste gut.
- Der leere Einsatz zeigt eindeutige Texte („0 / 0 / 0 // 0",
  „Einsatzbeginn nicht gesetzt") ohne Fehlermeldung.
- Das Umschalten Hell/Dunkel unterbricht Anzeige und Aktualisierung nicht.

## Zählung

| P0 | P1 | P2 | P3 |
| --- | --- | --- | --- |
| 0 | 1 | 3 | 1 |

Größtes Einsatzrisiko: Ein Fernseher in Reinweiß oder der weiße Optionsblock
blendet nachts im Fahrzeug, und die Tag/Nacht-Wahl geht beim Neuladen
verloren. Wichtigster nächster Schritt: Hell/Dunkel je Gerät speichern, den
Zustand sichtbar machen und die Optionsknöpfe im Dunkelmodus nicht weiß
darstellen.
