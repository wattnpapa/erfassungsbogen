# Beispiel-Erfassungsbögen — Kreisfeuerwehr Landkreis Emsland

9 Bögen für Kreiseinheiten der Kreisfeuerwehr Landkreis Emsland. Eine
Einheit aus mehreren Teileinheiten hat einen eigenen Ordner mit einem Bogen je
Teileinheit; eine Einheit, die als Ganzes ausrückt, ist ein einzelner Bogen.

Quellen (abgerufen am 09.11.2026):

- https://kfv-asd-huemmling.de/index.php/einheiten/kreisbereitschaft
- https://kfv-asd-huemmling.de/index.php/einheiten/kreisbereitschaft/1-zug
- https://kfv-asd-huemmling.de/index.php/einheiten/kreisbereitschaft/2-zug
- https://kfv-asd-huemmling.de/index.php/einheiten/kreisbereitschaft/3-zug
- https://kfv-asd-huemmling.de/index.php/einheiten/kreisbereitschaft/4-zug
- https://kfv-asd-huemmling.de/index.php/einheiten/iuk-gruppe-tel
- https://kfv-asd-huemmling.de/index.php/einheiten/cbrn-nord

Abgebildet ist der Brandschutzabschnitt Nord (Altkreis Aschendorf-Hümmling, Kreisfeuerwehrverband Aschendorf-Hümmling). Der Landkreis Emsland hat drei Kreisfeuerwehrbereitschaften (Nord, Mitte, Süd); Mitte und Süd fehlen hier.

Die Seiten nennen je Zug die Stärke (etwa 1 / 4 / 22 = 27) und die Fahrzeuge, aber nicht die Besatzung je Fahrzeug. Die Besatzungen sind so verteilt, dass die Summe der Seite getroffen wird. Das Rettungsboot des 3. Zuges steht als Anhänger ohne eigene Besatzung da. Funkrufnamen nennen die Seiten nicht; die Fahrzeuge stehen ohne da.

Die IuK-Gruppe/TEL (48 Mitglieder) nennt keine Fahrzeuge; ihr Bogen führt Leitung und Stabsfunktionen ohne Fahrzeug.

Alle Personen sind fiktiv, auch die auf den Seiten namentlich genannten
Führungskräfte; ebenso Kennzeichen und Einsatzaufträge. Jede Person trägt ihre
Ortsfeuerwehr als Dienststelle, die Funktion nennt das Fahrzeug. Gemeinsame
Regeln aller Landkreise: [../README.md](../README.md).

Neu erzeugen mit: `npm run beispiele:kreisfeuerwehr-nds`

## Kreisfeuerwehrbereitschaft Nord

5 Bögen, zusammen 7/19/90/116.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| kfb-nord/01-fuehrung-kfb-nord | Führung KFB Nord | 3/0/0/3 | keine genannt |
| kfb-nord/02-1-zug-wassertransport | 1. Zug Wassertransport | 1/5/12/18 | ELW 1 Aschendorf, LF 10/6 Berssen, TLF 20/40 Papenburg-Untenende, TLF 16/25 Esterwegen, TLF 16/25 Spahnharrenstätte |
| kfb-nord/03-2-zug-wasserfoerderung | 2. Zug Wasserförderung | 1/4/20/25 | ELW 1 Werlte, LF 16 TS Lathen, LF 8 Lorup, SW 2000 Werlte |
| kfb-nord/04-3-zug-technische-hilfeleistung | 3. Zug Technische Hilfeleistung | 1/4/22/27 | MZF Heede, LF 8 Dersum, LF 10/6 Börger, RW 2 Dörpen, Anh Rettungsboot Rhede |
| kfb-nord/05-4-zug-logistik-und-verpflegung | 4. Zug Logistik und Verpflegung | 1/6/36/43 | ELW 1 Obenende, LF 10/6 Lahn, LF 10/6 Surwold, LF 8/6 Hilkenbrook, LKW Dekon FTZ, GW MHD Papenburg |

## IuK-Gruppe / TEL Nord

Ein Bogen, zusammen 3/4/6/13.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| iuk-gruppe-tel | IuK-Gruppe / TEL | 3/4/6/13 | keine genannt |

## CBRN-Einheit Nord

3 Bögen, zusammen 3/7/25/35.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| cbrn-nord/01-gefahrgutzug-emsland-nord | Gefahrgutzug Emsland Nord | 1/5/19/25 | ELW 1 Papenburg, GW-G Papenburg, MTW Papenburg, LF 10/6 Kluse, TLF 16/24 Sustrum |
| cbrn-nord/02-gruppe-dekontamination | Gruppe Dekontamination | 1/1/4/6 | GW Dekon P1 Werpeloh |
| cbrn-nord/03-gruppe-messen-und-spueren | Gruppe Messen und Spüren | 1/1/2/4 | GW Messtechnik Werlte |
