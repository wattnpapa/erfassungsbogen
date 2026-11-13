# Alle THW-Einheiten aller Ortsverbände

Für Übungen: je Einheit eines Ortsverbands ein Beispiel-Erfassungsbogen,
gegliedert nach Landesverband › Regionalstelle › Ortsverband. 3533 Bögen aus 667 Ortsverbänden.

- Einheiten je OV: [thw.blafusel.de](https://thw.blafusel.de/) (inoffizielle OV-Karte), Stand
  2026-11-08, Momentaufnahme in `scripts/quellen/thw-ov-einheiten.json`.
  Die Karte kann vom tatsächlichen Stand eines OV abweichen.
- Zuordnung OV → Regionalstelle → Landesverband aus `thw-ov-regionalstruktur.ts`.
- Immer genau StAN-Stärke (Personal und Fahrzeuge), keine Abweichungen.
- Alle Personen erfunden, alle Rufnummern beginnen mit 555. Alle Bögen sind als
  Übung gekennzeichnet (Übungstag 19.09.2026).
- Funkrufnamen nach Taschenkarte THW-Funkrufnamen (02/2022): 1. TZ 21/22/23/24,
  2. TZ 26/27/28, 3. TZ 71/72/73, sonst die feste Kennzahl der Einheit.
- Bergungsgruppen mit Abstützsystem Holz stehen als B (ASH) im Bogen.

Neu erzeugen mit `npm run beispiele:thw-ov` (deterministisch);
`npm run beispiele:thw-ov -- --abrufen` lädt vorher die Einheitenliste neu.

Die Dateien beginnen mit `ov-` und gehören nicht zum automatischen
Offline-Vorrat der Web-App: Ein Bogen wird beim ersten Öffnen geladen und
bleibt danach auf dem Gerät.

## Landesverbände

| Landesverband | OVs | Bögen | Helfer |
|---|---|---|---|
| Baden-Württemberg | 93 | 471 | 3844 |
| Bayern | 111 | 592 | 4864 |
| Berlin, Brandenburg, Sachsen-Anhalt | 48 | 246 | 2026 |
| Bremen, Niedersachsen | 79 | 404 | 3345 |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | 57 | 325 | 2690 |
| Hessen, Rheinland-Pfalz, Saarland | 118 | 584 | 4782 |
| Nordrhein-Westfalen | 127 | 706 | 5809 |
| Sachsen, Thüringen | 34 | 205 | 1700 |

## Einheitstypen

| Einheit | Anzahl |
|---|---|
| ZTr TZ | 712 |
| B | 680 |
| FGr N | 658 |
| FGr E | 121 |
| FGr WP (A) | 98 |
| FGr I | 79 |
| FGr R (B) | 75 |
| FGr SB (A) | 72 |
| FGr W (A) | 71 |
| FGr Log-MW | 66 |
| FGr Log-V | 66 |
| ZTr FZ FK | 66 |
| FGr F | 66 |
| FGr R (C) | 58 |
| FGr K (A) | 58 |
| ZTr FZ Log | 57 |
| FGr R (A) | 52 |
| Tr UL | 50 |
| B (ASH) | 47 |
| FGr W (B) | 47 |
| Tr ESS | 46 |
| FGr O (C) | 44 |
| FGr Sp | 44 |
| FGr WP (B) | 33 |
| Tr MHP | 27 |
| FGr O (A) | 23 |
| Tr Log-TS | 17 |
| FGr BrB | 16 |
| FGr BT | 13 |
| FGr TW | 13 |
| FGr Öl (C) | 11 |
| FGr O (B) | 10 |
| FGr SB (B) | 10 |
| FGr WP (C) | 10 |
| FGr K (B) | 8 |
| FGr Öl (B) | 7 |
| FGr Öl (A) | 2 |

## Ortsverbände

| Landesverband | Regionalstelle | Ortsverband | Einheiten |
|---|---|---|---|
| Baden-Württemberg | Biberach | Biberach/Riß | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Baden-Württemberg | Biberach | Blaubeuren | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Baden-Württemberg | Biberach | Ehingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr BT (1. TZ), FGr E (1. TZ) |
| Baden-Württemberg | Biberach | Friedrichshafen | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Baden-Württemberg | Biberach | Pfullendorf | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Biberach | Riedlingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Biberach | Überlingen | ZTr TZ (1. TZ), B (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Biberach | Ulm | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Biberach | Wangen | ZTr FZ FK, FGr F, FGr K (A), FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Biberach | Weingarten | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (C) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), Tr UL (1. TZ) |
| Baden-Württemberg | Freiburg | Achern | FGr Log-V, ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ), FGr BT (1. TZ) |
| Baden-Württemberg | Freiburg | Biberach/Baden | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Freiburg | Breisach | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Baden-Württemberg | Freiburg | Emmendingen | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), FGr BT (1. TZ), FGr E (1. TZ) |
| Baden-Württemberg | Freiburg | Freiburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Baden-Württemberg | Freiburg | Kehl | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Freiburg | Lahr | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Freiburg | Lörrach | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Baden-Württemberg | Freiburg | Müllheim | Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Freiburg | Offenburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (B) (1. TZ) |
| Baden-Württemberg | Freiburg | Rheinfelden | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Freiburg | Schopfheim | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Göppingen | Aalen | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Baden-Württemberg | Göppingen | Ellwangen | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Göppingen | Geislingen | ZTr TZ (1. TZ), B (1. TZ), FGr I (1. TZ), FGr E (1. TZ) |
| Baden-Württemberg | Göppingen | Göppingen | ZTr FZ Log, FGr Log-MW, FGr Log-V, Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Göppingen | Gruibingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Göppingen | Heidenheim | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Göppingen | Kirchheim/Teck | ZTr FZ FK, FGr F, ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), Tr ESS (1. TZ) |
| Baden-Württemberg | Göppingen | Neuhausen | FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Göppingen | Ostfildern | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Göppingen | Schwäbisch Gmünd | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Baden-Württemberg | Heilbronn | Crailsheim | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Heilbronn | Heilbronn | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr W (A) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Heilbronn | Igersheim | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Heilbronn | Künzelsau | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Heilbronn | Pfedelbach | ZTr TZ (1. TZ), B (1. TZ), FGr BrB (1. TZ), FGr SB (A) (1. TZ), FGr I (1. TZ) |
| Baden-Württemberg | Heilbronn | Schwäbisch Hall | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Baden-Württemberg | Heilbronn | Weinsberg | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Heilbronn | Wertheim | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Heilbronn | Widdern | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Baden-Württemberg | Karlsruhe | Baden-Baden | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Baden-Württemberg | Karlsruhe | Bühl | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Karlsruhe | Dettenheim | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Karlsruhe | Karlsruhe | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Baden-Württemberg | Karlsruhe | Mühlacker | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Baden-Württemberg | Karlsruhe | Neuenbürg-Arnbach | ZTr TZ (1. TZ), B (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Baden-Württemberg | Karlsruhe | Niefern-Öschelbronn | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Karlsruhe | Oberhausen-Rheinhausen | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Karlsruhe | Pforzheim | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Baden-Württemberg | Karlsruhe | Rastatt | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Karlsruhe | Waghäusel | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Mannheim | Adelsheim | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Baden-Württemberg | Mannheim | Eberbach | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Mannheim | Haßmersheim | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Mannheim | Heidelberg | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr O (B) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr WP (C) (1. TZ) |
| Baden-Württemberg | Mannheim | Ladenburg | ZTr TZ (1. TZ), B (1. TZ), Tr ESS (1. TZ), FGr WP (B) (1. TZ) |
| Baden-Württemberg | Mannheim | Mannheim | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Baden-Württemberg | Mannheim | Neckargemünd | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Mannheim | Neunkirchen | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr Sp (1. TZ) |
| Baden-Württemberg | Mannheim | Sinsheim | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Mannheim | Wiesloch-Walldorf | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Stuttgart | Backnang | ZTr TZ (1. TZ), B (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), Tr MHP (1. TZ), Tr UL (1. TZ), FGr WP (B) (1. TZ) |
| Baden-Württemberg | Stuttgart | Bietigheim-Bissingen | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Stuttgart | Böblingen | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Stuttgart | Calw | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Stuttgart | Leonberg | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr Öl (C) (1. TZ) |
| Baden-Württemberg | Stuttgart | Ludwigsburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Stuttgart | Schorndorf | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (A) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Stuttgart | Stuttgart | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr N (2. TZ), FGr I (2. TZ), FGr E (2. TZ) |
| Baden-Württemberg | Tübingen | Albstadt | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr SB (B) (1. TZ) |
| Baden-Württemberg | Tübingen | Balingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Tübingen | Freudenstadt | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Tübingen | Hechingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Baden-Württemberg | Tübingen | Horb | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Tübingen | Münsingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Baden-Württemberg | Tübingen | Ofterdingen | ZTr FZ FK, FGr F, FGr K (B), ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), Tr ESS (1. TZ) |
| Baden-Württemberg | Tübingen | Reutlingen | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Tübingen | Rottenburg | ZTr TZ (1. TZ), B (1. TZ), FGr E (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Tübingen | Tübingen | ZTr TZ (1. TZ), B (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr TW (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Bad Säckingen | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr SB (A) (1. TZ), Tr UL (1. TZ), FGr I (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Donaueschingen | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Konstanz | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Laufenburg | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Radolfzell | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Rottweil | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Schramberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Singen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Stockach | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr BT (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Trossingen | Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Tuttlingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Villingen-Schwenningen | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Baden-Württemberg | Villingen-Schwenningen | Waldshut-Tiengen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bayern | Bad Tölz | Bad Aibling | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Bad Tölz | Garmisch-Partenkirchen | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bayern | Bad Tölz | Geretsried | ZTr FZ FK, FGr F, FGr K (A), ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Bad Tölz | Landsberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bayern | Bad Tölz | Miesbach | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Bayern | Bad Tölz | Rosenheim | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr W (A) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr BT (1. TZ), FGr I (1. TZ), FGr WP (B) (1. TZ) |
| Bayern | Bad Tölz | Schongau | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bayern | Bad Tölz | Starnberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr TW (1. TZ) |
| Bayern | Bad Tölz | Weilheim | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Bamberg | Bad Kissingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Bamberg | Bad Staffelstein | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Bamberg | Bamberg | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bayern | Bamberg | Coburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bayern | Bamberg | Forchheim | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), Tr MHP (1. TZ), FGr BT (1. TZ), FGr WP (C) (1. TZ) |
| Bayern | Bamberg | Gerolzhofen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Bamberg | Haßfurt | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Bayern | Bamberg | Kirchehrenbach | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Bamberg | Mellrichstadt | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Bamberg | Schweinfurt | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), Tr ESS (1. TZ) |
| Bayern | Hof | Bayreuth | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Hof | Hof | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Hof | Kronach | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Bayern | Hof | Kulmbach | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bayern | Hof | Marktredwitz | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ) |
| Bayern | Hof | Naila | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bayern | Hof | Pegnitz | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ), FGr E (1. TZ) |
| Bayern | Hof | Selb | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Hof | Weiden | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Bayern | Ingolstadt | Dillingen | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Ingolstadt | Donauwörth | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ) |
| Bayern | Ingolstadt | Eichstätt | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Bayern | Ingolstadt | Gunzenhausen | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bayern | Ingolstadt | Hilpoltstein | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Bayern | Ingolstadt | Ingolstadt | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Bayern | Ingolstadt | Neuburg | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Bayern | Ingolstadt | Nördlingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bayern | Ingolstadt | Pfaffenhofen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr WP (C) (1. TZ) |
| Bayern | Ingolstadt | Roth | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bayern | Ingolstadt | Treuchtlingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Karlstadt | Alzenau | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Karlstadt | Aschaffenburg | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Karlstadt | Karlstadt | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bayern | Karlstadt | Kitzingen | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Bayern | Karlstadt | Lohr | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Bayern | Karlstadt | Marktheidenfeld | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Bayern | Karlstadt | Miltenberg | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Bayern | Karlstadt | Obernburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ), FGr Öl (C) (1. TZ) |
| Bayern | Karlstadt | Ochsenfurt | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr BT (1. TZ), FGr E (1. TZ) |
| Bayern | Karlstadt | Würzburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bayern | Kempten | Füssen | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Bayern | Kempten | Günzburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bayern | Kempten | Kaufbeuren | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bayern | Kempten | Kempten | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Bayern | Kempten | Krumbach | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Kempten | Lindau | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr BT (1. TZ) |
| Bayern | Kempten | Lindenberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Kempten | Memmingen | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), Tr UL (1. TZ) |
| Bayern | Kempten | Neu-Ulm | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr BT (1. TZ) |
| Bayern | Kempten | Sonthofen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Bayern | Mühldorf | Altötting | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Mühldorf | Berchtesgadener Land | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (B) (1. TZ), Tr ESS (1. TZ) |
| Bayern | Mühldorf | Eggenfelden | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Bayern | Mühldorf | Ergolding | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Mühldorf | Landshut | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr O (C) (1. TZ), FGr Sp (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr W (B) (2. TZ), FGr N (2. TZ), FGr BT (2. TZ), FGr WP (A) (2. TZ) |
| Bayern | Mühldorf | Mühldorf | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Bayern | Mühldorf | Simbach | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Bayern | Mühldorf | Traunreut | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Bayern | Mühldorf | Traunstein | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bayern | München | Augsburg | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr R (A) (2. TZ), FGr Sp (2. TZ) |
| Bayern | München | Dachau | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bayern | München | Freising | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr WP (B) (1. TZ) |
| Bayern | München | Friedberg | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | München | Fürstenfeldbruck | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bayern | München | Markt Schwaben | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr E (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr R (A) (2. TZ), FGr Sp (2. TZ) |
| Bayern | München | München-Land | Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bayern | München | München-Mitte | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr W (B) (2. TZ) |
| Bayern | München | München-Ost | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr O (C) (2. TZ), FGr SB (A) (2. TZ) |
| Bayern | München | München-West | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr N (2. TZ), FGr E (2. TZ) |
| Bayern | München | Schwabmünchen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Bayern | Nürnberg | Ansbach | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Bayern | Nürnberg | Baiersdorf | ZTr TZ (1. TZ), B (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), FGr E (1. TZ) |
| Bayern | Nürnberg | Dinkelsbühl | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bayern | Nürnberg | Erlangen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), FGr WP (B) (1. TZ) |
| Bayern | Nürnberg | Feuchtwangen | ZTr TZ (1. TZ), B (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Bayern | Nürnberg | Fürth | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr BrB (2. TZ), FGr I (2. TZ) |
| Bayern | Nürnberg | Neustadt an der Aisch | Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Nürnberg | Nürnberg | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr W (A) (2. TZ), ZTr TZ (4. TZ), B (4. TZ), FGr N (4. TZ), FGr I (4. TZ) |
| Bayern | Nürnberg | Rothenburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Nürnberg | Schwabach | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Schwandorf | Amberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Schwandorf | Cham | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Schwandorf | Lauf | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Bayern | Schwandorf | Nabburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (C) (1. TZ) |
| Bayern | Schwandorf | Neumarkt | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bayern | Schwandorf | Neunburg vorm Wald | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bayern | Schwandorf | Oberviechtach | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bayern | Schwandorf | Parsberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Schwandorf | Roding | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Bayern | Schwandorf | Schwandorf | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bayern | Schwandorf | Sulzbach-Rosenberg | ZTr TZ (1. TZ), B (1. TZ), FGr O (B) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ) |
| Bayern | Straubing | Bogen | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bayern | Straubing | Deggendorf | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Bayern | Straubing | Kelheim | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr Öl (C) (1. TZ) |
| Bayern | Straubing | Laaber | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bayern | Straubing | Mallersdorf | ZTr TZ (1. TZ), B (1. TZ), FGr E (1. TZ) |
| Bayern | Straubing | Passau | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (A) (1. TZ) |
| Bayern | Straubing | Regen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bayern | Straubing | Regensburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bayern | Straubing | Straubing | ZTr FZ FK, FGr F, FGr K (B), ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Bayern | Straubing | Vilshofen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bayern | Straubing | Wörth | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Berlin | Berlin Charlottenburg-Wilmersdorf | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), Tr UL (1. TZ), FGr WP (A) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Berlin | Berlin Friedrichshain-Kreuzberg | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Berlin | Berlin Lichtenberg | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr Öl (C) (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr N (2. TZ), FGr E (2. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Berlin | Berlin Marzahn-Hellersdorf | Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Berlin | Berlin Neukölln | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Berlin | Berlin Pankow | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr I (1. TZ), FGr E (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Berlin | Berlin Reinickendorf | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ), FGr E (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr W (A) (2. TZ), FGr N (2. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Berlin | Berlin Spandau | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr O (C) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr TW (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Berlin | Berlin Treptow-Köpenick | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (A) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Berlin | Berlin-Mitte | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), B (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Frankfurt (Oder) | Cottbus | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Frankfurt (Oder) | Eberswalde | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr E (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Frankfurt (Oder) | Forst (Lausitz) | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Frankfurt (Oder) | Frankfurt (Oder) | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Frankfurt (Oder) | Fürstenwalde/Spree | FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Frankfurt (Oder) | Prenzlau | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Frankfurt (Oder) | Seelow | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Frankfurt (Oder) | Senftenberg | ZTr TZ (1. TZ), B (1. TZ), FGr WP (A) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Halle | Dessau | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Halle | Halle (Saale) | ZTr FZ FK, FGr F, FGr K (A), FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Halle | Merseburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Halle | Naumburg | ZTr TZ (1. TZ), B (1. TZ), FGr I (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Halle | Sangerhausen | FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Halle | Weißenfels | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Halle | Wittenberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Halle | Wolfen-Bitterfeld | ZTr TZ (1. TZ), B (1. TZ), FGr WP (A) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Magdeburg | Bernburg | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Magdeburg | Burg | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Magdeburg | Calbe | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Magdeburg | Halberstadt | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Magdeburg | Haldensleben | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Magdeburg | Magdeburg | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr E (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Magdeburg | Oschersleben | ZTr TZ (1. TZ), B (1. TZ), FGr WP (A) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Magdeburg | Quedlinburg | FGr Log-MW, ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr O (B) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), Tr ESS (1. TZ), Tr UL (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Magdeburg | Salzwedel | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Magdeburg | Staßfurt | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Magdeburg | Stendal | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Potsdam | Bad Belzig | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Potsdam | Berlin Steglitz-Zehlendorf | ZTr FZ Log, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr O (C) (2. TZ), Tr UL (2. TZ), FGr E (2. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Potsdam | Berlin Tempelhof-Schöneberg | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr SB (A) (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr N (2. TZ), FGr I (2. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Potsdam | Brandenburg an der Havel | FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Potsdam | Gransee | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Potsdam | Herzberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Potsdam | Luckenwalde | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Potsdam | Neuruppin | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Potsdam | Potsdam | ZTr FZ FK, FGr F, FGr K (B), ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Potsdam | Rathenow | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Berlin, Brandenburg, Sachsen-Anhalt | Potsdam | Wittenberge | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ) |
| Bremen, Niedersachsen | Braunschweig | Braunschweig | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr Sp (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr N (2. TZ), FGr WP (A) (2. TZ) |
| Bremen, Niedersachsen | Braunschweig | Elze | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr I (1. TZ) |
| Bremen, Niedersachsen | Braunschweig | Gifhorn | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bremen, Niedersachsen | Braunschweig | Helmstedt | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Braunschweig | Hildesheim | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Braunschweig | Peine | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bremen, Niedersachsen | Braunschweig | Salzgitter | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Braunschweig | Sarstedt | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bremen, Niedersachsen | Braunschweig | Schöningen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Bremen, Niedersachsen | Braunschweig | Wolfenbüttel | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr TW (1. TZ) |
| Bremen, Niedersachsen | Braunschweig | Wolfsburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bremen, Niedersachsen | Bremen | Bremen Mitte | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Bremen | Bremen Nord | ZTr FZ FK, FGr F, FGr K (A), ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bremen, Niedersachsen | Bremen | Bremen Ost | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (B) (1. TZ) |
| Bremen, Niedersachsen | Bremen | Bremen Süd | FGr Log-V, ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr W (A) (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Bremen | Bremerhaven | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), FGr Öl (B) (1. TZ) |
| Bremen, Niedersachsen | Bremen | Cuxhaven | ZTr TZ (1. TZ), B (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), FGr Öl (B) (1. TZ) |
| Bremen, Niedersachsen | Bremen | Delmenhorst | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Bremen | Hude-Bookholzberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bremen, Niedersachsen | Bremen | Osterholz-Scharmbeck | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Bremen | Wardenburg | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), FGr I (1. TZ) |
| Bremen, Niedersachsen | Buxtehude | Buxtehude | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bremen, Niedersachsen | Buxtehude | Kutenholz | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Buxtehude | Lüchow-Dannenberg | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Buxtehude | Lüneburg | FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), FGr E (1. TZ) |
| Bremen, Niedersachsen | Buxtehude | Rotenburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Buxtehude | Stade | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Bremen, Niedersachsen | Buxtehude | Stelle-Winsen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bremen, Niedersachsen | Buxtehude | Uelzen | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), FGr I (1. TZ) |
| Bremen, Niedersachsen | Göttingen | Bad Lauterberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bremen, Niedersachsen | Göttingen | Clausthal-Zellerfeld | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Göttingen | Einbeck | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bremen, Niedersachsen | Göttingen | Gieboldehausen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Göttingen | Goslar | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bremen, Niedersachsen | Göttingen | Göttingen | FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr TW (1. TZ), FGr WP (A) (1. TZ) |
| Bremen, Niedersachsen | Göttingen | Hann. Münden | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Göttingen | Holzminden | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Bremen, Niedersachsen | Göttingen | Northeim | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Bremen, Niedersachsen | Göttingen | Osterode - NI | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bremen, Niedersachsen | Hannover | Bückeburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bremen, Niedersachsen | Hannover | Burgdorf | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Hannover | Hameln | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Hannover | Hannover/Langenhagen | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (B) (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr O (C) (2. TZ), FGr E (2. TZ), Tr UL (2. TZ) |
| Bremen, Niedersachsen | Hannover | Lehrte | ZTr FZ FK, FGr F, FGr K (B), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bremen, Niedersachsen | Hannover | Rinteln | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Hannover | Ronnenberg | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr O (B) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bremen, Niedersachsen | Hannover | Springe | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Bremen, Niedersachsen | Hannover | Stadthagen | Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bremen, Niedersachsen | Hannover | Wunstorf | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), FGr WP (A) (1. TZ) |
| Bremen, Niedersachsen | Lingen | Bad Essen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (C) (1. TZ) |
| Bremen, Niedersachsen | Lingen | Cloppenburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr BT (1. TZ), FGr Öl (C) (1. TZ) |
| Bremen, Niedersachsen | Lingen | Lingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Bremen, Niedersachsen | Lingen | Lohne | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Bremen, Niedersachsen | Lingen | Melle | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Lingen | Meppen | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Lingen | Nordhorn | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bremen, Niedersachsen | Lingen | Osnabrück | FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr SB (A) (1. TZ), FGr I (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr N (2. TZ), FGr E (2. TZ) |
| Bremen, Niedersachsen | Lingen | Papenburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Lingen | Quakenbrück | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Oldenburg | Aurich | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Oldenburg | Emden | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ) |
| Bremen, Niedersachsen | Oldenburg | Jever | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Bremen, Niedersachsen | Oldenburg | Leer | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bremen, Niedersachsen | Oldenburg | Norden | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), FGr Öl (B) (1. TZ) |
| Bremen, Niedersachsen | Oldenburg | Nordenham | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), FGr Öl (A) (1. TZ) |
| Bremen, Niedersachsen | Oldenburg | Oldenburg (NI) | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), FGr I (1. TZ) |
| Bremen, Niedersachsen | Oldenburg | Varel | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Bremen, Niedersachsen | Oldenburg | Westerstede | ZTr FZ Log, FGr Log-MW, Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Oldenburg | Wilhelmshaven | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Verden | Achim | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr SB (B) (1. TZ), Tr ESS (1. TZ) |
| Bremen, Niedersachsen | Verden | Bassum | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Verden | Celle | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Verden | Fallingbostel-Walsrode | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Verden | Hoya | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Verden | Nienburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Verden | Soltau | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Bremen, Niedersachsen | Verden | Sulingen | ZTr TZ (1. TZ), B (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Bremen, Niedersachsen | Verden | Syke | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Bremen, Niedersachsen | Verden | Verden | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), FGr WP (A) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Hamburg | Hamburg Mitte | Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr Öl (B) (3. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Hamburg | Hamburg Nord | ZTr TZ (1. TZ), B (1. TZ), FGr SB (A) (1. TZ), FGr I (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr R (B) (2. TZ), FGr O (C) (2. TZ), FGr N (2. TZ), Tr UL (2. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Hamburg | Hamburg-Altona | ZTr TZ (1. TZ), B (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ), FGr I (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr R (B) (2. TZ), FGr Sp (2. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Hamburg | Hamburg-Bergedorf | B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr WP (B) (2. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Hamburg | Hamburg-Eimsbüttel | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), Tr ESS (2. TZ), FGr WP (A) (2. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Hamburg | Hamburg-Harburg | ZTr FZ FK, FGr F, FGr K (B), ZTr FZ Log, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), FGr SB (B) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Hamburg | Hamburg-Wandsbek | FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr R (A) (2. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Lübeck | Ahrensburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr I (1. TZ), FGr E (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Lübeck | Bad Oldesloe | ZTr FZ Log, FGr Log-MW, Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Lübeck | Eutin | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Lübeck | Lauenburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Lübeck | Lübeck | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr Öl (A) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Lübeck | Mölln | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Lübeck | Neustadt | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Lübeck | Oldenburg in Holstein | ZTr TZ (1. TZ), B (1. TZ), FGr WP (B) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Lübeck | Plön | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Lübeck | Preetz | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), Tr ESS (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Lübeck | Ratzeburg | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Neumünster | Bad Segeberg | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr E (1. TZ), FGr WP (B) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Neumünster | Barmstedt | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Neumünster | Burg-Hochdonn | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Neumünster | Elmshorn | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (A) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Neumünster | Heide | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Neumünster | Itzehoe | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr TW (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Neumünster | Kaltenkirchen | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Neumünster | Meldorf | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Neumünster | Neumünster | ZTr FZ FK, FGr F, FGr K (A), FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr O (A) (1. TZ), FGr O (B) (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Neumünster | Norderstedt | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Neumünster | Pinneberg | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr W (A) (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Neumünster | Wahlstedt | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schleswig | Eckernförde | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schleswig | Flensburg | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schleswig | Husum | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schleswig | Kiel | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), Tr UL (1. TZ), FGr Öl (B) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schleswig | Niebüll | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), FGr WP (B) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schleswig | Rendsburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schleswig | Schleswig | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr BT (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schleswig | Sörup | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schleswig | Tönning | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schwerin | Bad Doberan | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr Öl (B) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schwerin | Gadebusch | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schwerin | Güstrow | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schwerin | Ludwigslust | FGr Log-MW, FGr Log-V, Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schwerin | Parchim | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schwerin | Rostock | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), FGr E (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schwerin | Schwerin | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Schwerin | Wismar | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), FGr WP (A) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Stralsund | Barth | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Stralsund | Bergen auf Rügen | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr WP (C) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Stralsund | Demmin | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Stralsund | Greifswald | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), Tr MHP (1. TZ), FGr E (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Stralsund | Neubrandenburg | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Stralsund | Neustrelitz | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Stralsund | Pasewalk | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Stralsund | Stralsund | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr O (B) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr E (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr E (2. TZ), FGr Öl (B) (2. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Stralsund | Waren | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | Stralsund | Wolgast | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), FGr Öl (C) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Bad Kreuznach | Alzey | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Bad Kreuznach | Bad Kreuznach | FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Bad Kreuznach | Bingen | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Bad Kreuznach | Frankenthal | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr E (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Bad Kreuznach | Idar-Oberstein | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Bad Kreuznach | Ludwigshafen | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Bad Kreuznach | Mainz | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (B) (1. TZ), Tr ESS (1. TZ), FGr I (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Bad Kreuznach | Simmern | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Bad Kreuznach | Worms | ZTr FZ Log, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Bad Kreuznach | Wörrstadt | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr TW (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Darmstadt | Bensheim | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Darmstadt | Darmstadt | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Darmstadt | Groß-Gerau | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr O (B) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Darmstadt | Groß-Umstadt | ZTr FZ Log, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Darmstadt | Heppenheim | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Darmstadt | Lampertheim | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Darmstadt | Michelstadt | FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Darmstadt | Ober-Ramstadt | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Darmstadt | Pfungstadt | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Darmstadt | Rüsselsheim | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), FGr TW (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Darmstadt | Viernheim | ZTr TZ (1. TZ), B (1. TZ), FGr O (B) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Frankfurt am Main | Bad Homburg | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Frankfurt am Main | Frankfurt | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr R (A) (2. TZ), FGr N (2. TZ), FGr Öl (C) (2. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Frankfurt am Main | Friedberg/Hessen | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Frankfurt am Main | Geisenheim | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Frankfurt am Main | Heidenrod | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Frankfurt am Main | Hofheim | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Frankfurt am Main | Idstein | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Frankfurt am Main | Neu-Isenburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Frankfurt am Main | Offenbach | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr W (A) (2. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Frankfurt am Main | Seligenstadt | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Frankfurt am Main | Wiesbaden | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gelnhausen | Alsfeld | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gelnhausen | Bad Orb | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr I (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gelnhausen | Erlensee | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gelnhausen | Fulda | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gelnhausen | Gelnhausen | ZTr FZ FK, FGr F, FGr K (B), ZTr TZ (1. TZ), B (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gelnhausen | Hünfeld | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr SB (A) (1. TZ), Tr ESS (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gelnhausen | Lauterbach | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gelnhausen | Neuhof | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gelnhausen | Steinau | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gelnhausen | Wächtersbach | ZTr TZ (1. TZ), B (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gießen | Bad Wildungen | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gießen | Biedenkopf | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gießen | Dillenburg | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gießen | Frankenberg | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gießen | Gießen | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr I (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gießen | Grünberg | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gießen | Korbach | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gießen | Limburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gießen | Marburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr O (B) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gießen | Weilburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Gießen | Wetzlar | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr E (2. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Homberg | Bad Hersfeld | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Homberg | Eschwege | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Homberg | Fritzlar | Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Homberg | Großalmerode | ZTr FZ Log, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Homberg | Hofgeismar | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Homberg | Homberg | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Homberg | Kassel | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Homberg | Melsungen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Homberg | Rotenburg - HE | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr TW (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Homberg | Schwalmstadt | ZTr TZ (1. TZ), B (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Homberg | Witzenhausen | FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Homberg | Wolfhagen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Koblenz | Ahrweiler | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Koblenz | Andernach | ZTr TZ (1. TZ), B (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Koblenz | Bendorf | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Koblenz | Betzdorf | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Koblenz | Koblenz | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr Öl (C) (3. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Koblenz | Lahnstein | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (C) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Koblenz | Mayen | Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Koblenz | Montabaur | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Koblenz | Neuwied | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Koblenz | Sinzig | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Koblenz | Westerburg | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Merzig | Beckingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Merzig | Dillingen (Saar) | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Merzig | Freisen | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Merzig | Lebach | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Merzig | Mettlach | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Merzig | Nohfelden | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Merzig | Perl-Obermosel | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Merzig | Saarlouis | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Merzig | Saarwellingen | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Merzig | St. Wendel | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Merzig | Theley | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Merzig | Wadern | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Neustadt a.d.W. | Bad Bergzabern | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Neustadt a.d.W. | Germersheim | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Neustadt a.d.W. | Hauenstein | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Neustadt a.d.W. | Kaiserslautern | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Neustadt a.d.W. | Landau | ZTr FZ FK, FGr F, FGr K (A), FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr O (B) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Neustadt a.d.W. | Neustadt an der Weinstraße | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Neustadt a.d.W. | Pirmasens | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Neustadt a.d.W. | Speyer | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Neustadt a.d.W. | Zweibrücken | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Saarbrücken | Blieskastel-Aßweiler | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Saarbrücken | Friedrichsthal | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Saarbrücken | Heusweiler | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Saarbrücken | Homburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Saarbrücken | Illingen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Saarbrücken | Neunkirchen (Saar) | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Saarbrücken | Riegelsberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Saarbrücken | Saarbrücken | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Saarbrücken | Spiesen-Elversberg | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Saarbrücken | St. Ingbert | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Saarbrücken | Sulzbach | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Saarbrücken | Völklingen-Püttlingen | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Trier | Bitburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr I (1. TZ), FGr E (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Trier | Cochem | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Trier | Daun-Vulkaneifel | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Trier | Hermeskeil | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), FGr WP (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Trier | Prüm | ZTr FZ Log, FGr Log-MW, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Trier | Saarburg | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Trier | Trier | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Trier | Wittlich | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Hessen, Rheinland-Pfalz, Saarland | Trier | Zell | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Aachen | Aachen | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr O (A) (2. TZ), FGr SB (A) (2. TZ) |
| Nordrhein-Westfalen | Aachen | Alsdorf | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Nordrhein-Westfalen | Aachen | Düren | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Aachen | Eschweiler | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Aachen | Euskirchen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Aachen | Herzogenrath | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Aachen | Hürtgenwald | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Nordrhein-Westfalen | Aachen | Jülich | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Aachen | Nörvenich | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Nordrhein-Westfalen | Aachen | Schleiden | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Aachen | Simmerath | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Aachen | Stolberg | ZTr TZ (1. TZ), B (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Nordrhein-Westfalen | Arnsberg | Arnsberg | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Arnsberg | Brilon | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Nordrhein-Westfalen | Arnsberg | Büren | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Nordrhein-Westfalen | Arnsberg | Hallenberg-Hesborn | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Arnsberg | Höxter | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Arnsberg | Lippstadt | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Nordrhein-Westfalen | Arnsberg | Meschede | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Arnsberg | Paderborn | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr E (1. TZ), ZTr TZ (2. TZ), B (ASH) (2. TZ), FGr N (2. TZ), Tr ESS (2. TZ), FGr WP (A) (2. TZ) |
| Nordrhein-Westfalen | Arnsberg | Soest | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Arnsberg | Warburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Nordrhein-Westfalen | Bielefeld | Bielefeld | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (B) (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Nordrhein-Westfalen | Bielefeld | Bünde | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Bielefeld | Detmold | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Nordrhein-Westfalen | Bielefeld | Gütersloh | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Bielefeld | Halle | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Bielefeld | Herford | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Nordrhein-Westfalen | Bielefeld | Lemgo | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr TW (1. TZ) |
| Nordrhein-Westfalen | Bielefeld | Lübbecke | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Bielefeld | Minden | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Nordrhein-Westfalen | Bielefeld | Vlotho | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Bochum | Bochum | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr N (2. TZ), FGr E (2. TZ), FGr WP (A) (2. TZ) |
| Nordrhein-Westfalen | Bochum | Hagen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Bochum | Hattingen | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr I (1. TZ) |
| Nordrhein-Westfalen | Bochum | Herne | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Bochum | Remscheid | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (B) (1. TZ), Tr ESS (1. TZ) |
| Nordrhein-Westfalen | Bochum | Schwelm | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Bochum | Wanne-Eickel | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Bochum | Wetter | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Bochum | Witten | ZTr TZ (1. TZ), B (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Bochum | Wuppertal | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr O (A) (2. TZ), FGr SB (A) (2. TZ), FGr I (2. TZ) |
| Nordrhein-Westfalen | Dortmund | Altena | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Dortmund | Balve | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Dortmund | Dortmund | ZTr FZ FK, FGr F, FGr K (A), ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr W (A) (2. TZ), FGr N (2. TZ), Tr ESS (2. TZ), FGr I (2. TZ) |
| Nordrhein-Westfalen | Dortmund | Halver | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Dortmund | Hamm | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr Öl (C) (1. TZ) |
| Nordrhein-Westfalen | Dortmund | Iserlohn | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr WP (B) (1. TZ) |
| Nordrhein-Westfalen | Dortmund | Kamen-Bergkamen | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ) |
| Nordrhein-Westfalen | Dortmund | Lüdenscheid | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Nordrhein-Westfalen | Dortmund | Lünen | ZTr TZ (1. TZ), B (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Dortmund | Unna-Schwerte | ZTr TZ (1. TZ), B (1. TZ), B (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Nordrhein-Westfalen | Dortmund | Werne | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Düsseldorf | Duisburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ), FGr E (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr R (A) (2. TZ), FGr W (B) (2. TZ), FGr N (2. TZ) |
| Nordrhein-Westfalen | Düsseldorf | Düsseldorf | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr R (B) (2. TZ), FGr Sp (2. TZ), FGr N (2. TZ) |
| Nordrhein-Westfalen | Düsseldorf | Haan | ZTr TZ (1. TZ), B (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Düsseldorf | Heiligenhaus/Wülfrath | ZTr TZ (1. TZ), B (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Düsseldorf | Hilden | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr I (1. TZ) |
| Nordrhein-Westfalen | Düsseldorf | Mülheim | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (C) (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Düsseldorf | Ratingen | ZTr TZ (1. TZ), B (1. TZ), FGr O (A) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Düsseldorf | Solingen | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Düsseldorf | Velbert | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (B) (1. TZ) |
| Nordrhein-Westfalen | Gelsenkirchen | Bottrop | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), FGr WP (B) (1. TZ) |
| Nordrhein-Westfalen | Gelsenkirchen | Castrop-Rauxel | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Gelsenkirchen | Datteln | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Gelsenkirchen | Essen | ZTr FZ FK, FGr F, FGr K (A), ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr N (2. TZ), FGr WP (C) (2. TZ), FGr Öl (C) (2. TZ) |
| Nordrhein-Westfalen | Gelsenkirchen | Gelsenkirchen | ZTr TZ (1. TZ), B (1. TZ), B (ASH) (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Gelsenkirchen | Gladbeck/Dorsten | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Gelsenkirchen | Haltern am See | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Gelsenkirchen | Herten | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Nordrhein-Westfalen | Gelsenkirchen | Marl | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Nordrhein-Westfalen | Gelsenkirchen | Recklinghausen | ZTr TZ (1. TZ), B (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Gelsenkirchen | Waltrop | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Nordrhein-Westfalen | Köln | Bad Honnef | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Nordrhein-Westfalen | Köln | Bergheim | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Köln | Bergisch Gladbach | ZTr TZ (1. TZ), B (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Köln | Beuel | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ), FGr E (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr W (B) (2. TZ), FGr N (2. TZ) |
| Nordrhein-Westfalen | Köln | Bonn | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Köln | Bornheim | Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Köln | Brühl | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Köln | Köln Nord-West | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (B) (1. TZ), FGr I (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Köln | Köln-Ost | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr R (B) (2. TZ), FGr N (2. TZ) |
| Nordrhein-Westfalen | Köln | Köln-Porz | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Köln | Leverkusen | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Köln | Siegburg | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), ZTr TZ (2. TZ), B (2. TZ), B (2. TZ), FGr WP (A) (2. TZ) |
| Nordrhein-Westfalen | Mönchengladbach | Erkelenz | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Mönchengladbach | Grevenbroich | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Mönchengladbach | Hückelhoven | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Nordrhein-Westfalen | Mönchengladbach | Kempen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Mönchengladbach | Krefeld | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr I (2. TZ) |
| Nordrhein-Westfalen | Mönchengladbach | Mönchengladbach | ZTr FZ Log, FGr Log-MW, FGr Log-V, Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), B (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Mönchengladbach | Nettetal | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Mönchengladbach | Neuss | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr W (B) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Mönchengladbach | Übach-Palenberg | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Mönchengladbach | Viersen | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr O (A) (1. TZ), FGr SB (A) (1. TZ), Tr UL (1. TZ) |
| Nordrhein-Westfalen | Münster | Beckum | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ), FGr SB (B) (1. TZ), Tr ESS (1. TZ) |
| Nordrhein-Westfalen | Münster | Coesfeld | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Nordrhein-Westfalen | Münster | Dülmen | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Münster | Greven | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Nordrhein-Westfalen | Münster | Havixbeck | ZTr TZ (1. TZ), B (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Nordrhein-Westfalen | Münster | Ibbenbüren | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr TW (1. TZ) |
| Nordrhein-Westfalen | Münster | Lengerich | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Münster | Lüdinghausen | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Münster | Münster | ZTr FZ FK, FGr F, FGr K (B), ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Münster | Oelde | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Münster | Rheine | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Münster | Warendorf | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Olpe | Attendorn | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Olpe | Bad Berleburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Olpe | Bergneustadt | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Olpe | Gummersbach | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Olpe | Hückeswagen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Olpe | Lennestadt | ZTr TZ (1. TZ), B (1. TZ), FGr SB (A) (1. TZ) |
| Nordrhein-Westfalen | Olpe | Olpe | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ) |
| Nordrhein-Westfalen | Olpe | Siegen | ZTr FZ FK, FGr F, FGr K (A), ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Olpe | Waldbröl | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Olpe | Wermelskirchen | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Nordrhein-Westfalen | Wesel | Ahaus | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Nordrhein-Westfalen | Wesel | Bocholt/Borken | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Nordrhein-Westfalen | Wesel | Dinslaken | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Nordrhein-Westfalen | Wesel | Emmerich | ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr W (A) (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ) |
| Nordrhein-Westfalen | Wesel | Geldern | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Wesel | Gronau | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Wesel | Kleve | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ) |
| Nordrhein-Westfalen | Wesel | Moers | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Nordrhein-Westfalen | Wesel | Oberhausen | ZTr FZ FK, FGr F, FGr K (A), ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Nordrhein-Westfalen | Wesel | Wesel | ZTr TZ (1. TZ), B (1. TZ), FGr W (B) (1. TZ), FGr N (1. TZ) |
| Sachsen, Thüringen | Chemnitz | Annaberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr E (1. TZ) |
| Sachsen, Thüringen | Chemnitz | Aue-Schwarzenberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Sachsen, Thüringen | Chemnitz | Chemnitz | ZTr FZ FK, FGr F, FGr K (A), ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr I (2. TZ) |
| Sachsen, Thüringen | Chemnitz | Döbeln | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ) |
| Sachsen, Thüringen | Chemnitz | Freiberg | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ) |
| Sachsen, Thüringen | Chemnitz | Plauen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Sachsen, Thüringen | Chemnitz | Reichenbach | ZTr TZ (1. TZ), B (1. TZ), FGr O (C) (1. TZ), FGr N (1. TZ), FGr SB (B) (1. TZ) |
| Sachsen, Thüringen | Chemnitz | Zwickau | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), FGr TW (1. TZ) |
| Sachsen, Thüringen | Dresden | Bautzen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), FGr WP (A) (1. TZ) |
| Sachsen, Thüringen | Dresden | Dippoldiswalde | ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), Tr UL (1. TZ) |
| Sachsen, Thüringen | Dresden | Dresden | ZTr FZ FK, FGr F, FGr K (B), FGr Log-MW, ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr BrB (2. TZ), FGr I (2. TZ) |
| Sachsen, Thüringen | Dresden | Görlitz | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr N (1. TZ) |
| Sachsen, Thüringen | Dresden | Kamenz | FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Sachsen, Thüringen | Dresden | Pirna | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr Sp (1. TZ), FGr N (1. TZ), FGr BT (1. TZ) |
| Sachsen, Thüringen | Dresden | Radebeul | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr W (A) (2. TZ) |
| Sachsen, Thüringen | Dresden | Riesa | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), FGr WP (C) (1. TZ) |
| Sachsen, Thüringen | Dresden | Zittau | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ) |
| Sachsen, Thüringen | Erfurt | Apolda | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (C) (1. TZ) |
| Sachsen, Thüringen | Erfurt | Eisenach | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr SB (A) (1. TZ), FGr E (1. TZ), FGr WP (B) (1. TZ) |
| Sachsen, Thüringen | Erfurt | Erfurt | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (ASH) (1. TZ), FGr R (B) (1. TZ), FGr N (1. TZ), Tr ESS (1. TZ), FGr TW (1. TZ) |
| Sachsen, Thüringen | Erfurt | Gotha | Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Sachsen, Thüringen | Erfurt | Heiligenstadt | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Sachsen, Thüringen | Erfurt | Nordhausen | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Sachsen, Thüringen | Erfurt | Rudolstadt/Saalfeld | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr WP (B) (1. TZ) |
| Sachsen, Thüringen | Erfurt | Sondershausen | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr BrB (1. TZ), FGr N (1. TZ) |
| Sachsen, Thüringen | Erfurt | Sonneberg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr E (1. TZ) |
| Sachsen, Thüringen | Erfurt | Suhl | ZTr FZ Log, FGr Log-MW, FGr Log-V, ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr Sp (2. TZ) |
| Sachsen, Thüringen | Leipzig | Altenburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr UL (1. TZ), FGr E (1. TZ) |
| Sachsen, Thüringen | Leipzig | Borna | ZTr TZ (1. TZ), B (1. TZ), FGr R (A) (1. TZ), FGr N (1. TZ), FGr WP (A) (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr Öl (C) (2. TZ) |
| Sachsen, Thüringen | Leipzig | Eilenburg | ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), Tr MHP (1. TZ), FGr WP (A) (1. TZ) |
| Sachsen, Thüringen | Leipzig | Gera | ZTr TZ (1. TZ), B (1. TZ), FGr R (C) (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ), FGr I (1. TZ) |
| Sachsen, Thüringen | Leipzig | Grimma | ZTr FZ Log, FGr Log-MW, FGr Log-V, Tr Log-TS, ZTr TZ (1. TZ), B (1. TZ), FGr N (1. TZ), FGr E (1. TZ) |
| Sachsen, Thüringen | Leipzig | Leipzig | ZTr FZ FK, FGr F, FGr K (A), ZTr TZ (1. TZ), B (1. TZ), FGr R (B) (1. TZ), FGr SB (A) (1. TZ), Tr ESS (1. TZ), ZTr TZ (2. TZ), B (2. TZ), FGr N (2. TZ) |
| Sachsen, Thüringen | Leipzig | Torgau | ZTr TZ (1. TZ), B (1. TZ), FGr W (A) (1. TZ), FGr O (A) (1. TZ), FGr N (1. TZ) |
