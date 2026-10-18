# Führungssicht — Lagemonitor (R6-K)

Rolle: THW-Führungskraft in einer kleinen Führungsstelle, Sitzplatz im
Zugtrupp-MTW, Fernseher in einigen Metern Abstand. Geprüft im Produktionsbuild
(Port 4173), Chrome 153, Fenster 1920 × 1080, 1366 × 768 und 3840 × 2160,
Einsätze „voll" (16 Einheiten), „leer" und „kurz". Zu- und aufgeklappt
gemessen, Seitenhöhen verglichen, „Einsatzdaten" geöffnet und 6,5 s gewartet,
um den Einfluss der 5-s-Aktualisierung zu sehen.

Urteil: Der zugeklappte Kopf ist vom Sitzplatz aus in unter 3 s lesbar
(Funkrufname, Einsatzname, rote Zeit, Stärke, Dauer). Die Einheitentabelle
erreicht das nicht: Sie passt mit 16 Einheiten nicht auf den Bildschirm und
ist ohne Scrollen nicht entscheidungsfähig. Zahl der Fahrzeuge und Gesamtzahl
der Einheiten sind versteckt, eine Zug-Zuordnung sowie Ankunft und Abrücken
fehlen.

## Befunde

### R6-K1 (P1) — Tabelle passt nicht auf den Fernseher

- Fundstelle: „Einheiten" aufgeklappt, Einsatz „voll", 1920 × 1080.
- Beobachtung: Die Seitenhöhe wächst von 1080 auf 2064 px. Die Tabelle beginnt
  bei y ≈ 660, sichtbar sind der Tabellenkopf und etwa 7 von 16 Zeilen; der
  Rest liegt etwa 984 px unter der Kante. Bei 1366 × 768 sind es 1488 px, bei
  4K 4064 gegenüber 2160 px. Die Schrift ist mit 39,7 px (4K: 79 px) gut
  lesbar, es fehlt die Höhe. Die Kopfblöcke belegen rund 60 % der Höhe, vor
  allem die Zeitzeile mit etwa 480 px.
- Folge: Die Führungskraft muss scrollen, der Monitor ist aber reine Anzeige.
  Der Blick auf die Gesamtlage geht verloren, denn die Zeit scrollt weg; die
  Zeilen 9 bis 16 (DRK, Feuerwehr, Meldekopf, Räumen, BtLS) sieht man nie
  zusammen mit der Zeit.
- Empfehlung: Bei aufgeklappter Tabelle den Kopf auf eine schmale Zeile
  verdichten (Zeit, Stärke und Dauer nebeneinander) und die Tabelle ohne
  Scrollen füllen lassen; alternativ zwei Spalten, wenn die Zeilenzahl über
  der Höhe liegt. Mindestens: kein Scrollen bei 16 Einheiten bei 1080p,
  weitere Zeilen über automatisches Blättern.
- Nachprüfung: Einsatz „voll", Einheiten aufklappen, bei 1920 × 1080
  `scrollHeight` gleich Fensterhöhe, Zeit und alle 16 Zeilen sichtbar.

### R6-K2 (P1) — Gesamtzahl Einheiten und Fahrzeuge nur im zugeklappten Abschnitt

- Fundstelle: „Einsatzdaten", Einsatz „voll".
- Beobachtung: Dort stehen „Einheiten 16", „Fahrzeuge 9", Art und
  Einsatzbeginn, zugeklappt unsichtbar. Der Kopf enthält nur Stärke und Dauer.
  Die Tabelle hat keine Summenzeile.
- Folge: Die Standardfrage der Lagebesprechung und der Meldung an die nächste
  Ebene („wie viele Einheiten, wie viele Fahrzeuge, wie stark") braucht zwei
  Aufklappvorgänge. Annahme: Die übergeordnete Führung fragt in der Regel nach
  Einheiten und Fahrzeugen.
- Empfehlung: Einheiten- und Fahrzeugzahl dauerhaft sichtbar bei der
  Stärkezeile, z. B. „16 Einheiten / 9 Fahrzeuge | 8 / 33 / 152 // 193".
- Nachprüfung: Beide Zahlen sind zugeklappt ohne Interaktion lesbar und ändern
  sich beim Erfassen eines Fahrzeugs.

### R6-K3 (P1) — Standardbild zeigt keine Einheiten, Zustand wird nicht gemerkt

- Fundstelle: alle drei Abschnitte, Start und Aktualisierung.
- Beobachtung: Das Standardbild ist zugeklappt, also ohne Einheiten. Aufklappen
  ist Mausbedienung am Laptop. Nach dem Aufklappen und Scrollen auf 500 px
  blieben Scrollstand und offene Abschnitte über 6,5 s und die
  Aktualisierung erhalten (gut). Mehrere Abschnitte können gleichzeitig offen
  sein, dann wächst die Seite weiter.
- Folge: Die wichtigste Information (wer ist da) ist standardmäßig nicht
  sichtbar; wird der Laptop zugeklappt oder bedient jemand anders, bleibt der
  Fernseher im falschen Zustand.
- Empfehlung: Einheiten standardmäßig offen, sofern sie auf den Bildschirm
  passen (siehe K1); gewählten Zustand je Einsatz merken.
- Nachprüfung: Neuer Start des Monitors zeigt die Tabelle ohne Klick; der
  Zustand bleibt nach Neuladen.

### R6-K4 (P2) — Keine Zug-Zuordnung, Reihenfolge nicht erklärt

- Fundstelle: Tabelle, Einsatz „voll".
- Beobachtung: Die 16 Zeilen stehen in Meldereihenfolge, THW-Einheiten sind
  durch DRK und Feuerwehr zerschnitten (Zeilen 13 bis 16). Es gibt keine
  Zug-Spalte (bewusste Entscheidung) und keine Gruppierung nach Organisation.
  Der Zeile „Übungsort Nord" (3 / 16 / 79, 98 Personen, mehr als die Hälfte der
  Gesamtstärke 193) sieht man nicht an, ob die anderen THW-Einheiten dazugehören.
- Folge: Aufgabenteilung und Unterstellung muss man im Kopf behalten; für die
  Meldung „Zug X mit Stärke Y" muss man selbst addieren.
- Empfehlung: Wählbare Gruppierung oder Sortierung nach Organisation mit
  Teilsumme je Orga. Eine Zug-Zuordnung als eigenes Feld ist ein größerer
  Eingriff (Frage, ob die App Unterstellungen kennt), wünschenswert, kein Muss.
- Nachprüfung: Teilsummen je Orga ergeben die Gesamtstärke (8 / 33 / 152 // 193).

### R6-K5 (P2) — Keine Angabe zu Ankunft oder Abrücken

- Fundstelle: Tabelle und Einsatzdaten.
- Beobachtung: Die Tabelle zeigt nur „anwesende" Einheiten ohne Zeitbezug: keine
  Eintreffzeit, keine Kennzeichnung „neu eingetroffen", keine abgerückten
  Einheiten. Annahme: Die Datenerfassung kennt diese Zeitpunkte (nicht geprüft).
- Folge: Die Führungskraft sieht den Zustand, nicht die Entwicklung. „Wer ist in
  der letzten Stunde dazugekommen?" beantwortet der Monitor nicht; eine
  abrückende Einheit verschwindet, die Stärke sinkt ohne Erklärung.
- Empfehlung: Neu hinzugekommene Zeilen einige Minuten markieren und eine
  Spalte „an" (Ankunftszeit) anbieten, falls das Datenmodell es hergibt.
- Nachprüfung: Im Hauptfenster eine Einheit erfassen; im Monitor erscheint sie
  markiert.

### R6-K6 (P2) — Umbrüche mitten im Wort

- Fundstelle: Tabelle, 1920 × 1080 voll.
- Beobachtung: „Einheitentyp" bricht zu „Einheitenty / p", „Feuerwehr" zu
  „Feuerweh / r" (beide Feuerwehr-Zeilen); „Haverie Kommando" und „Heros
  Übungsort Nord 21/10" brechen auf zwei Zeilen. Die Zeilen sind unterschiedlich
  hoch, das kostet zusätzlich Höhe (K1). Die Spalte „Orga" ist zu schmal, die
  Funkrufname-Spalte zu breit.
- Folge: „Feuerweh r" irritiert am Fernseher und kostet Lesezeit.
- Empfehlung: Spaltenbreiten an den Inhalt anpassen oder abkürzen („FW"),
  kein Umbruch innerhalb eines Wortes.
- Nachprüfung: Keine Zeile bricht innerhalb eines Wortes bei 1920 × 1080 und
  1366 × 768.

### R6-K7 (P2) — Keine Summenzeile, F/U/M nur für Eingewiesene

- Fundstelle: Tabelle, Spaltenköpfe F, U, M.
- Beobachtung: Die Kürzel sind nur für Eingewiesene verständlich. Eine
  Summenzeile fehlt; die Zahlen im Kopf lassen sich nicht an der Tabelle
  gegenprüfen (der Prüfer hat nachgerechnet: 8, 33, 152 stimmen).
- Folge: Bei einem Abgleich mit der Meldung der Einheit hilft keine
  Prüfsumme.
- Empfehlung: Summenzeile am Tabellenende, z. B. „16 Einheiten, 8 / 33 / 152 // 193".
- Nachprüfung: Summenzeile gleich der Stärkezeile im Kopf.

### R6-K8 (P3) — Fehlende Angaben nicht unterscheidbar

- Fundstelle: Tabelle, Spalten Einheitentyp und Funkrufname.
- Beobachtung: In „voll" steht in 7 von 16 Zeilen „–" beim Funkrufnamen. Das
  kann bedeuten: kein Fahrzeug, Fahrzeug ohne Funkrufname, nicht erfasst. Zeit
  und Dauer haben dagegen ehrliche Texte („Einsatzbeginn nicht gesetzt",
  „Noch keine Einheit gemeldet.").
- Folge: Man erkennt nicht, ob die Einheit nicht funkt oder nur nicht
  eingetragen ist.
- Empfehlung: „ohne Funk" oder leer mit klarer Bedeutung statt Strich.
- Nachprüfung: Einheit ohne Fahrzeug gegen Einheit mit Fahrzeug ohne
  Funkrufnamen vergleichen.

### R6-K9 (P3) — Zeitzeile belegt unverhältnismäßig viel Fläche

- Fundstelle: Kopf, 1080p zugeklappt.
- Beobachtung: Die Zeit belegt etwa 480 von 1080 px, die Zeichenhöhe etwa 150 px.
  Aus mehreren Metern gut lesbar, aber auf Kosten der Tabelle (K1).
- Empfehlung: siehe K1.

## Was gut ist

- Zugeklappt auf einen Blick fehlerfrei: Funkrufname, Einsatzname, rote Zeit,
  Stärke mit unterstrichener Gesamtzahl, Dauer; kein Scrollen bei allen drei
  Größen.
- Die Tabellenschrift skaliert (39,7 px bei 1080p, 79 px bei 4K), kein
  waagerechter Überlauf.
- Leerzustände sind ehrlich.
- Zustand (Scrollstand, offene Abschnitte) bleibt bei der 5-s-Aktualisierung
  erhalten.
- Die Stärkesummen stimmen mit der Tabelle überein.
- Keine Personennamen am Fernseher; ohne Funkrufnamen rückt der Einsatzname nach
  oben.

## Zählung

| P0 | P1 | P2 | P3 |
| --- | --- | --- | --- |
| 0 | 3 | 4 | 2 |

Größtes Einsatzrisiko: Einheiten in den unteren Zeilen und die Fahrzeugzahl
werden in der Lagebesprechung übersehen oder falsch gemeldet. Wichtigster
nächster Schritt: Die Tabelle bei 16 Einheiten ohne Scrollen auf 1920 × 1080
sichtbar machen (verdichteter Kopf, keine Wortumbrüche) und Einheiten- und
Fahrzeugzahl in den Kopf nehmen.
