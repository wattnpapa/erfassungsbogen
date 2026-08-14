# Beispiel-Erfassungsbögen — Katastrophenschutz Nordrhein-Westfalen

13 generierte Beispiel-Teileinheiten nach dem Konzept
**„Vorgeplante überörtliche Hilfe im Sanitäts- und Betreuungsdienst im Land
Nordrhein-Westfalen"** (VüH-SanBt NRW, Version 2.1, Ausgabe 15.11.2024,
Innenministerium NRW / Institut der Feuerwehr NRW).

Alle Personen, Kreis-Zuordnungen, Wachennummern und Kennzeichen sind
**fiktiv**.

## Warum NRW anders erschlossen wurde als die meisten anderen Länder

NRW kennt keine Katastrophenschutz-Verordnung mit Anlage/Schaubildern je
Einheit wie z. B. Thüringen oder Sachsen. Stattdessen führt das Land seit
2013 landesweit einheitliche **Katastrophenschutz-Konzepte** ein — mit
derselben Verbindlichkeit, aber als eigenständige Innenministeriums-Dokumente
statt als Verordnungsanlage. Das hier verwendete Konzept ist aktuell
(Version 2.1 vom 15.11.2024) und enthält je Teileinheit/Modul eine exakte
Rollenliste **und** Fahrzeugausstattung — vergleichbar detailliert wie die
Schaubilder der ThürKatSVO.

## Die zwei abgebildeten Bausteine

* **Einsatzeinheit NRW (EE NRW)** — die überall in NRW landesweit
  einheitlich eingeführte Basiseinheit (Erlass vom 23.08.2013), 33
  Funktionen (1/7/25/33) in vier Teileinheiten: Führung, Sanität, Betreuung,
  Unterstützung.
* **Behandlungsplatz 50 NRW (BHP 50 NRW)** — der aus mindestens zwei
  Einsatzeinheiten NRW plus Feuerwehr/Rettungsdienst gebildete
  sanitätsdienstliche Großverband, 78 Funktionen (9/5/64/78) in neun
  Modulen: Führungsstaffel, Eingangssichtung, Behandlungsbereich „Kritische
  Patienten" (rot/gelb), Behandlungsbereich „Unkritische Patienten" (grün),
  Logistik (Führung), Interner Patiententransport, Technische Unterstützung,
  Verpflegung, Ausgangsdokumentation.

**Nicht abgebildet**, obwohl als Landeskonzepte real existierend: der
Betreuungsplatz 500 NRW (BTP 500 NRW, 72 Funktionen — dasselbe Dokument, aber
mit mehr Untermodulen als hier ausgewertet), der Patiententransport-Zug 10
NRW (PT-Z 10 NRW, 20 Funktionen), das sechsteilige ABC-Schutz-Konzept NRW und
der Wasserrettungszug NRW (WR-Z NRW, 44 Funktionen). Für diese vier Konzepte
liegen Gesamtstärke und Mindest-Fahrzeugzahl vor, aber keine mit
vertretbarem Aufwand ausgewertete Rollenliste je Teileinheit — das kann in
einem Folgeschritt ergänzt werden.

## Träger

Für die Einsatzeinheit NRW nennt das Dokument „in der Regel … Kräfte einer
anerkannten Hilfsorganisation" (ASB, DRK, JUH, MHD), lässt aber ausdrücklich
zu, dass unterschiedliche Teileinheiten von unterschiedlichen Organisationen
gebildet werden. Für den BHP 50 NRW nennt das Dokument keine Organisation je
Modul. Die Trägerzuordnung je Bogen ist daher **redaktionell gewählt**, um
die Bandbreite der mitwirkenden Organisationen zu zeigen — keine
Dokumentvorgabe.

## Funkrufnamen

Für NRW wurde kein landeseigener, öffentlich zugänglicher
Fahrzeugkennzahlen-Katalog gefunden. Genähert wird daher — wie bei Thüringen
und Bayern — mit der bundesweiten OPTA-Richtlinie der BDBOS als Vorbild:

> `<Kennwort> <Kreis/kreisfreie Stadt> <Wache> <Fahrzeugkennzahl>[/<lfd. Nr.>]`

Kennwort je Trägerorganisation: DRK „Rotkreuz", ASB „Sama", JUH „Akkon", MHD
„Johannes", Feuerwehr „Florian". Die Fahrzeugkennzahlen selbst sind **kein
NRW-amtliches Schema**, sondern eine plausible, an die OPTA-Systematik
angelehnte Zuordnung.

Neu erzeugen mit: `npm run beispiele:kats-nw` (deterministisch, fester
Zufalls-Seed).

| Datei | Verband | Teileinheit/Modul | Kreis | Stärke (F/U/M/Gesamt) |
|---|---|---|---|---|
| einsatzeinheit-nrw-teileinheit-fuehrung-te-fue | Einsatzeinheit NRW | Teileinheit Führung (TE Fü) | Kreis Soest | 1/1/2/4 |
| einsatzeinheit-nrw-teileinheit-sanitaet-te-san | Einsatzeinheit NRW | Teileinheit Sanität (TE San) | Kreis Paderborn | 0/1/9/10 |
| einsatzeinheit-nrw-teileinheit-betreuung-te-bt | Einsatzeinheit NRW | Teileinheit Betreuung (TE Bt) | Kreis Unna | 0/4/11/15 |
| einsatzeinheit-nrw-teileinheit-unterstuetzung-te-ust | Einsatzeinheit NRW | Teileinheit Unterstützung (TE Ust) | Märkischer Kreis | 0/1/3/4 |
| bhp-50-nrw-fuehrungsstaffel | BHP 50 NRW | Führungsstaffel | Hochsauerlandkreis | 3/1/2/6 |
| bhp-50-nrw-eingangssichtung | BHP 50 NRW | Eingangssichtung | Kreis Recklinghausen | 1/0/5/6 |
| bhp-50-nrw-behandlungsbereich-kritische-patienten-rot-gelb | BHP 50 NRW | Behandlungsbereich „Kritische Patienten" (rot/gelb) | Kreis Steinfurt | 4/0/19/23 |
| bhp-50-nrw-behandlungsbereich-unkritische-patienten-gruen | BHP 50 NRW | Behandlungsbereich „Unkritische Patienten" (grün) | Kreis Warendorf | 0/1/11/12 |
| bhp-50-nrw-logistik-fuehrung | BHP 50 NRW | Logistik (Führung) | Rhein-Sieg-Kreis | 1/0/1/2 |
| bhp-50-nrw-interner-patiententransport | BHP 50 NRW | Interner Patiententransport | Rhein-Kreis Neuss | 0/0/16/16 |
| bhp-50-nrw-technische-unterstuetzung | BHP 50 NRW | Technische Unterstützung | Kreis Viersen | 0/1/5/6 |
| bhp-50-nrw-verpflegung | BHP 50 NRW | Verpflegung | Kreis Minden-Lübbecke | 0/1/2/3 |
| bhp-50-nrw-ausgangsdokumentation | BHP 50 NRW | Ausgangsdokumentation | Kreis Lippe | 0/1/3/4 |

Quelle: VüH-SanBt NRW, Version 2.1 (15.11.2024).
