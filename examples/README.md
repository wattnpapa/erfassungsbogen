# Beispiel-Erfassungsbögen

100 generierte Beispiel-Einheiten aus ganz Deutschland (40 exakt im
StAN-Soll, 60 mit zufälligen Abweichungen bei Personal und/oder
Fahrzeugen) plus ein bewusst übergroßer Stress-Test-Bogen, der die
QR-Segmentierung auslöst. Funkrufnamen nach Taschenkarte THW-Funkrufnamen
(Stand 02/2022).

Neu erzeugen mit: `npm run beispiele` (deterministisch, fester Zufalls-Seed).

| Datei | Einheit | OV | Landesverband | Stärke | Fz | Abweichung |
|---|---|---|---|---|---|---|
| 001-albstadt-ztr-tz | ZTr TZ | Albstadt | Baden-Württemberg | 1/1/2/4 | 2 | Fahrzeug zusätzlich |
| 002-biberach-riss-fgr-o-b | FGr O (B) | Biberach/Riß | Baden-Württemberg | 0/2/7/9 | 2 | Fahrzeug fehlt, Fahrzeug zusätzlich |
| 003-crailsheim-fgr-w-a | FGr W (A) | Crailsheim | Baden-Württemberg | 0/3/9/12 | 3 | — |
| 004-freiburg-fgr-wp-a | FGr WP (A) | Freiburg | Baden-Württemberg | 0/3/11/14 | 4 | Personal +2 |
| 005-hassmersheim-fgr-w-a | FGr W (A) | Haßmersheim | Baden-Württemberg | 0/3/9/12 | 3 | — |
| 006-karlsruhe-ztr-tz | ZTr TZ | Karlsruhe | Baden-Württemberg | 1/1/2/4 | 2 | Fahrzeug zusätzlich |
| 007-laufenburg-ztr-fz-log | ZTr FZ Log | Laufenburg | Baden-Württemberg | 1/1/2/4 | 1 | — |
| 008-muellheim-fgr-sb-b | FGr SB (B) | Müllheim | Baden-Württemberg | 0/3/9/12 | 2 | — |
| 009-oberhausen-rheinhausen-b | B | Oberhausen-Rheinhausen | Baden-Württemberg | 0/2/7/9 | 2 | Fahrzeug fehlt, Fahrzeug zusätzlich |
| 010-radolfzell-tr-log-ts | Tr Log-TS | Radolfzell | Baden-Württemberg | 0/1/2/3 | 1 | Personal -1, Fahrzeug fehlt |
| 011-rottweil-tr-ul | Tr UL | Rottweil | Baden-Württemberg | 0/1/3/4 | 1 | — |
| 012-sinsheim-fgr-w-b | FGr W (B) | Sinsheim | Baden-Württemberg | 0/3/10/13 | 2 | Personal +1, Fahrzeug fehlt, Fahrzeug zusätzlich |
| 013-ulm-b | B | Ulm | Baden-Württemberg | 0/2/6/8 | 2 | Personal -1 |
| 014-weinsberg-fgr-oel-c | FGr Öl (C) | Weinsberg | Baden-Württemberg | 0/4/16/20 | 2 | Personal +2, Fahrzeug fehlt |
| 015-ansbach-fgr-log-mw | FGr Log-MW | Ansbach | Bayern | 0/4/10/14 | 8 | Personal -2, Fahrzeug fehlt |
| 016-bamberg-fgr-w-a | FGr W (A) | Bamberg | Bayern | 0/3/7/10 | 2 | Personal -2, Fahrzeug fehlt |
| 017-deggendorf-fgr-wp-a | FGr WP (A) | Deggendorf | Bayern | 0/3/9/12 | 4 | — |
| 018-erlangen-fgr-oel-b | FGr Öl (B) | Erlangen | Bayern | 0/4/12/16 | 2 | Personal -2, Fahrzeug fehlt |
| 019-fuessen-fgr-k-a | FGr K (A) | Füssen | Bayern | 0/3/4/7 | 3 | Personal -2, Fahrzeug fehlt |
| 020-hilpoltstein-fgr-n | FGr N | Hilpoltstein | Bayern | 0/2/5/7 | 3 | Personal -2, Fahrzeug fehlt, Fahrzeug zusätzlich |
| 021-kirchehrenbach-b | B | Kirchehrenbach | Bayern | 0/2/7/9 | 2 | — |
| 022-landshut-ztr-tz | ZTr TZ | Landshut | Bayern | 1/1/2/4 | 1 | — |
| 023-markt-schwaben-ztr-fz-log | ZTr FZ Log | Markt Schwaben | Bayern | 1/1/2/4 | 1 | — |
| 024-muehldorf-b | B | Mühldorf | Bayern | 0/2/7/9 | 2 | — |
| 025-neu-ulm-fgr-f | FGr F | Neu-Ulm | Bayern | 0/3/4/7 | 2 | — |
| 026-obernburg-b-ash | B (ASH) | Obernburg | Bayern | 0/2/12/14 | 4 | Personal +2, Fahrzeug zusätzlich |
| 027-regen-b | B | Regen | Bayern | 0/2/7/9 | 2 | — |
| 028-schwabach-fgr-n | FGr N | Schwabach | Bayern | 0/2/7/9 | 3 | — |
| 029-starnberg-b | B | Starnberg | Bayern | 0/2/4/6 | 2 | Personal -3 |
| 030-weiden-fgr-k-a | FGr K (A) | Weiden | Bayern | 0/3/7/10 | 5 | Personal +1, Fahrzeug zusätzlich |
| 031-berlin-lichtenberg-fgr-o-c | FGr O (C) | Berlin Lichtenberg | Berlin, Brandenburg, Sachsen-Anhalt | 0/2/3/5 | 2 | Personal -1, Fahrzeug zusätzlich |
| 032-berlin-tempelhof-schoeneberg-b-ash | B (ASH) | Berlin Tempelhof-Schöneberg | Berlin, Brandenburg, Sachsen-Anhalt | 0/2/10/12 | 3 | — |
| 033-cottbus-fgr-i | FGr I | Cottbus | Berlin, Brandenburg, Sachsen-Anhalt | 0/3/9/12 | 3 | — |
| 034-halberstadt-fgr-r-a | FGr R (A) | Halberstadt | Berlin, Brandenburg, Sachsen-Anhalt | 0/2/6/8 | 5 | Personal -1, Fahrzeug zusätzlich |
| 035-merseburg-b | B | Merseburg | Berlin, Brandenburg, Sachsen-Anhalt | 0/2/9/11 | 2 | Personal +2 |
| 036-rathenow-b | B | Rathenow | Berlin, Brandenburg, Sachsen-Anhalt | 0/2/6/8 | 3 | Personal -1, Fahrzeug zusätzlich |
| 037-weissenfels-ztr-tz | ZTr TZ | Weißenfels | Berlin, Brandenburg, Sachsen-Anhalt | 1/1/2/4 | 2 | Fahrzeug zusätzlich |
| 038-bad-lauterberg-fgr-brb | FGr BrB | Bad Lauterberg | Bremen, Niedersachsen | 0/4/14/18 | 2 | — |
| 039-bremen-sued-fgr-r-b | FGr R (B) | Bremen Süd | Bremen, Niedersachsen | 0/2/8/10 | 3 | Personal +1, Fahrzeug fehlt |
| 040-cloppenburg-fgr-n | FGr N | Cloppenburg | Bremen, Niedersachsen | 0/2/6/8 | 3 | Personal -1, Fahrzeug fehlt, Fahrzeug zusätzlich |
| 041-gieboldehausen-fgr-oel-a | FGr Öl (A) | Gieboldehausen | Bremen, Niedersachsen | 0/4/13/17 | 4 | Personal -1, Fahrzeug zusätzlich |
| 042-hannover-langenhagen-fgr-e | FGr E | Hannover/Langenhagen | Bremen, Niedersachsen | 0/2/7/9 | 3 | — |
| 043-kutenholz-ztr-tz | ZTr TZ | Kutenholz | Bremen, Niedersachsen | 1/1/3/5 | 2 | Personal +1, Fahrzeug zusätzlich |
| 044-lueneburg-b | B | Lüneburg | Bremen, Niedersachsen | 0/2/5/7 | 1 | Personal -2, Fahrzeug fehlt |
| 045-northeim-ztr-tz | ZTr TZ | Northeim | Bremen, Niedersachsen | 1/1/2/4 | 1 | — |
| 046-peine-tr-ess | Tr ESS | Peine | Bremen, Niedersachsen | 0/1/4/5 | 2 | Personal +1, Fahrzeug zusätzlich |
| 047-schoeningen-fgr-r-b | FGr R (B) | Schöningen | Bremen, Niedersachsen | 0/2/7/9 | 4 | — |
| 048-syke-b | B | Syke | Bremen, Niedersachsen | 0/2/4/6 | 1 | Personal -3, Fahrzeug fehlt |
| 049-wilhelmshaven-fgr-w-a | FGr W (A) | Wilhelmshaven | Bremen, Niedersachsen | 0/3/9/12 | 3 | — |
| 050-bad-segeberg-fgr-tw | FGr TW | Bad Segeberg | Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | 0/3/15/18 | 4 | — |
| 051-eckernfoerde-fgr-r-c | FGr R (C) | Eckernförde | Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | 0/2/6/8 | 3 | Personal -1, Fahrzeug fehlt |
| 052-hamburg-mitte-fgr-log-mw | FGr Log-MW | Hamburg Mitte | Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | 0/4/9/13 | 9 | Personal -3 |
| 053-hamburg-wandsbek-b-ash | B (ASH) | Hamburg-Wandsbek | Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | 0/2/9/11 | 4 | Personal -1, Fahrzeug zusätzlich |
| 054-luebeck-fgr-log-v | FGr Log-V | Lübeck | Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | 0/3/9/12 | 3 | — |
| 055-neustadt-fgr-log-v | FGr Log-V | Neustadt | Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | 0/3/10/13 | 3 | Personal +1 |
| 056-pasewalk-ztr-tz | ZTr TZ | Pasewalk | Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | 1/1/2/4 | 2 | Fahrzeug zusätzlich |
| 057-schleswig-fgr-r-a | FGr R (A) | Schleswig | Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | 0/2/8/10 | 3 | Personal +1, Fahrzeug fehlt |
| 058-wahlstedt-fgr-n | FGr N | Wahlstedt | Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein | 0/2/7/9 | 3 | — |
| 059-andernach-b | B | Andernach | Hessen, Rheinland-Pfalz, Saarland | 0/2/8/10 | 2 | Personal +1 |
| 060-bad-wildungen-b | B | Bad Wildungen | Hessen, Rheinland-Pfalz, Saarland | 0/2/7/9 | 2 | — |
| 061-bitburg-fgr-r-b | FGr R (B) | Bitburg | Hessen, Rheinland-Pfalz, Saarland | 0/2/6/8 | 4 | Personal -1 |
| 062-dillingen-saar-b | B | Dillingen (Saar) | Hessen, Rheinland-Pfalz, Saarland | 0/2/4/6 | 2 | Personal -3 |
| 063-friedberg-hessen-fgr-r-b | FGr R (B) | Friedberg/Hessen | Hessen, Rheinland-Pfalz, Saarland | 0/2/7/9 | 4 | — |
| 064-giessen-fgr-o-a | FGr O (A) | Gießen | Hessen, Rheinland-Pfalz, Saarland | 0/2/6/8 | 2 | Personal -1 |
| 065-heidenrod-fgr-wp-a | FGr WP (A) | Heidenrod | Hessen, Rheinland-Pfalz, Saarland | 0/3/8/11 | 3 | Personal -1, Fahrzeug fehlt |
| 066-homburg-ztr-tz | ZTr TZ | Homburg | Hessen, Rheinland-Pfalz, Saarland | 1/1/2/4 | 1 | — |
| 067-kassel-fgr-n | FGr N | Kassel | Hessen, Rheinland-Pfalz, Saarland | 0/2/4/6 | 3 | Personal -3 |
| 068-lebach-tr-ess | Tr ESS | Lebach | Hessen, Rheinland-Pfalz, Saarland | 0/1/2/3 | 1 | Personal -1 |
| 069-melsungen-fgr-i | FGr I | Melsungen | Hessen, Rheinland-Pfalz, Saarland | 0/3/9/12 | 3 | — |
| 070-neustadt-an-der-weinstrasse-fgr-w-b | FGr W (B) | Neustadt an der Weinstraße | Hessen, Rheinland-Pfalz, Saarland | 0/3/6/9 | 2 | Personal -3 |
| 071-pfungstadt-fgr-log-v | FGr Log-V | Pfungstadt | Hessen, Rheinland-Pfalz, Saarland | 0/3/9/12 | 3 | — |
| 072-saarburg-fgr-n | FGr N | Saarburg | Hessen, Rheinland-Pfalz, Saarland | 0/2/7/9 | 4 | Fahrzeug zusätzlich |
| 073-speyer-tr-mhp | Tr MHP | Speyer | Hessen, Rheinland-Pfalz, Saarland | 0/1/2/3 | 1 | Personal -1 |
| 074-theley-fgr-sb-b | FGr SB (B) | Theley | Hessen, Rheinland-Pfalz, Saarland | 0/3/10/13 | 2 | Personal +1 |
| 075-westerburg-fgr-r-c | FGr R (C) | Westerburg | Hessen, Rheinland-Pfalz, Saarland | 0/2/5/7 | 4 | Personal -2 |
| 076-worms-b | B | Worms | Hessen, Rheinland-Pfalz, Saarland | 0/2/8/10 | 2 | Personal +1, Fahrzeug fehlt, Fahrzeug zusätzlich |
| 077-altena-ztr-tz | ZTr TZ | Altena | Nordrhein-Westfalen | 1/1/4/6 | 1 | Personal +2 |
| 078-bergheim-b | B | Bergheim | Nordrhein-Westfalen | 0/2/7/9 | 2 | — |
| 079-bochum-fgr-r-a | FGr R (A) | Bochum | Nordrhein-Westfalen | 0/2/7/9 | 4 | — |
| 080-bueren-fgr-n | FGr N | Büren | Nordrhein-Westfalen | 0/2/5/7 | 2 | Personal -2, Fahrzeug fehlt |
| 081-duisburg-fgr-wp-b | FGr WP (B) | Duisburg | Nordrhein-Westfalen | 0/3/9/12 | 4 | — |
| 082-eschweiler-fgr-n | FGr N | Eschweiler | Nordrhein-Westfalen | 0/2/6/8 | 3 | Personal -1 |
| 083-grevenbroich-fgr-o-a | FGr O (A) | Grevenbroich | Nordrhein-Westfalen | 0/2/7/9 | 2 | — |
| 084-hallenberg-hesborn-fgr-r-a | FGr R (A) | Hallenberg-Hesborn | Nordrhein-Westfalen | 0/2/7/9 | 4 | — |
| 085-heiligenhaus-wuelfrath-fgr-e | FGr E | Heiligenhaus/Wülfrath | Nordrhein-Westfalen | 0/2/5/7 | 3 | Personal -2 |
| 086-hueckelhoven-fgr-e | FGr E | Hückelhoven | Nordrhein-Westfalen | 0/2/6/8 | 3 | Personal -1 |
| 087-kempen-fgr-tw | FGr TW | Kempen | Nordrhein-Westfalen | 0/3/16/19 | 5 | Personal +1, Fahrzeug zusätzlich |
| 088-lemgo-fgr-wp-b | FGr WP (B) | Lemgo | Nordrhein-Westfalen | 0/3/8/11 | 3 | Personal -1, Fahrzeug fehlt |
| 089-luedinghausen-fgr-w-a | FGr W (A) | Lüdinghausen | Nordrhein-Westfalen | 0/3/9/12 | 3 | — |
| 090-muelheim-tr-ul | Tr UL | Mülheim | Nordrhein-Westfalen | 0/1/4/5 | 1 | Personal +1 |
| 091-oelde-fgr-sp | FGr Sp | Oelde | Nordrhein-Westfalen | 0/2/4/6 | 2 | — |
| 092-schleiden-fgr-n | FGr N | Schleiden | Nordrhein-Westfalen | 0/2/7/9 | 3 | — |
| 093-stolberg-ztr-tz | ZTr TZ | Stolberg | Nordrhein-Westfalen | 1/1/2/4 | 2 | Fahrzeug zusätzlich |
| 094-waldbroel-fgr-k-b | FGr K (B) | Waldbröl | Nordrhein-Westfalen | 0/4/9/13 | 6 | — |
| 095-wesel-ztr-fz-fk | ZTr FZ FK | Wesel | Nordrhein-Westfalen | 1/1/3/5 | 2 | Personal +1, Fahrzeug zusätzlich |
| 096-aue-schwarzenberg-fgr-i | FGr I | Aue-Schwarzenberg | Sachsen, Thüringen | 0/3/9/12 | 3 | — |
| 097-eilenburg-fgr-o-b | FGr O (B) | Eilenburg | Sachsen, Thüringen | 0/2/9/11 | 3 | Personal +2, Fahrzeug zusätzlich |
| 098-grimma-fgr-n | FGr N | Grimma | Sachsen, Thüringen | 0/2/7/9 | 3 | — |
| 099-plauen-fgr-wp-c | FGr WP (C) | Plauen | Sachsen, Thüringen | 0/3/8/11 | 3 | Personal -1, Fahrzeug fehlt |
| 100-suhl-b | B | Suhl | Sachsen, Thüringen | 0/2/7/9 | 2 | — |
| grossbogen-verstaerkter-bergungszug | Verstärkter Bergungszug | Oldenburg (NI) | Bremen, Niedersachsen | 1/9/28/38 | 10 | Großbogen (Stress-Test QR-Segmentierung) |
