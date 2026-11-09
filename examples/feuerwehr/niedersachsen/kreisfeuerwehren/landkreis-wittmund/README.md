# Beispiel-Erfassungsbögen — Kreisfeuerwehr Landkreis Wittmund

6 Bögen für Kreiseinheiten der Kreisfeuerwehr Landkreis Wittmund. Eine
Einheit aus mehreren Teileinheiten hat einen eigenen Ordner mit einem Bogen je
Teileinheit; eine Einheit, die als Ganzes ausrückt, ist ein einzelner Bogen.

Quellen (abgerufen am 09.11.2026):

- https://kfv-wittmund.de/kfb/
- https://kfv-wittmund.de/tel/

Die Seite der Bereitschaft zeigt Führungsstaffel und Fachzüge als Grafiken mit Funktion, Funkrufname und Ortsfeuerwehr; übernommen ist, was dort steht. Zugführung und Stellvertretung kommen aus den Ortsfeuerwehren, die die Grafiken nennen. Die Drohne (Funkrufname 80-79-2) ist kein Fahrzeug und steht beim MTF-Drohne.

TEL und IuK nutzen ELW 2, MTF-TEL und Anhänger-TEL, dieselben Fahrzeuge wie die Führungsstaffel der Bereitschaft.

Alle Personen sind fiktiv, auch die auf den Seiten namentlich genannten
Führungskräfte; ebenso Kennzeichen und Einsatzaufträge. Jede Person trägt ihre
Ortsfeuerwehr als Dienststelle, die Funktion nennt das Fahrzeug. Gemeinsame
Regeln aller Landkreise: [../README.md](../README.md).

Neu erzeugen mit: `npm run beispiele:kreisfeuerwehr-nds`

## Kreisfeuerwehrbereitschaft Wittmund

5 Bögen, zusammen 7/21/85/113.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| kfb/01-fuehrungsstaffel | Führungsstaffel | 3/2/16/21 | KdoW Kreisfeuerwehr, ELW 2 Kreisfeuerwehr, MTF TEL Kreisfeuerwehr, Anh TEL Kreisfeuerwehr, MTF Drohne Ochtersum |
| kfb/02-fachzug-1-wasserfoerderung | Fachzug 1 Wasserförderung | 1/4/21/26 | MTF Schweindorf, LF 8/6 Stedesdorf, LF 8/6 Wiesede, SW KatS Marx |
| kfb/03-fachzug-2-wassertransport | Fachzug 2 Wassertransport | 1/6/16/23 | MTF Horsten, TLF 16/24 Schweindorf, TLF 2000 Spiekeroog, TLF 2000 Neuharlingersiel, TLF 3000 Friedeburg, StLF 20/25 Leerhafe-Hovel |
| kfb/04-fachzug-3-gewaesserschutz | Fachzug 3 Gewässerschutz | 1/4/18/23 | MTF Carolinensiel, GW-G Esens, LF 10 Ochtersum, MLF Eggelingen |
| kfb/05-fachzug-4-logistik | Fachzug 4 Logistik | 1/5/14/20 | MTF Kreisfeuerwehr, MTF Ardorf, GW-L2 Blomberg, WLF-K Kreisfeuerwehr, LKW Holtgast, FKH 57/5 Holtgast |

## TEL und IuK

Ein Bogen, zusammen 2/5/6/13.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| tel-iuk | Technische Einsatzleitung und IuK | 2/5/6/13 | MTF TEL Kreisfeuerwehr, ELW 2 Kreisfeuerwehr, Anh TEL Kreisfeuerwehr |
