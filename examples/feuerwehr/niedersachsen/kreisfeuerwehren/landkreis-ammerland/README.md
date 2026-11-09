# Beispiel-Erfassungsbögen — Kreisfeuerwehr Landkreis Ammerland

9 Bögen für Kreiseinheiten der Kreisfeuerwehr Landkreis Ammerland. Eine
Einheit aus mehreren Teileinheiten hat einen eigenen Ordner mit einem Bogen je
Teileinheit; eine Einheit, die als Ganzes ausrückt, ist ein einzelner Bogen.

Quellen (abgerufen am 09.11.2026):

- https://www.kreisfeuerwehr-ammerland.de/kreisfeuerwehrbereitschaft/
- https://www.kreisfeuerwehr-ammerland.de/fuehrungsgruppe-ammerland-tel/
- https://www.kreisfeuerwehr-ammerland.de/fachzug-iuk/
- https://www.kreisfeuerwehr-ammerland.de/gefahrgutzug/
- https://www.kreisfeuerwehr-ammerland.de/absturzsicherung-abstusi/

Die Seite der Bereitschaft spricht von vier Fachzügen, führt aber fünf auf; abgebildet sind alle fünf. Die Funkrufnamen stehen so da, wie die Seite sie nennt. Auf dem MTW jedes Fachzugs sitzt der Zugtrupp (Zugführung, Stellvertretung, zwei Führungsassistenzen, Fahrer).

TEL und Fachzug IuK nutzen ELW 2, MTW und KdoW der Technischen Zentrale, dieselben Fahrzeuge wie die Führungsgruppe der Bereitschaft. Der Gefahrgutzug nennt nur seine acht Gefahrgutgruppen, keine Fahrzeuge; sein Bogen führt deshalb nur Personal. Die Fachgruppe Absturzsicherung ist auf ihrer Seite ein Ausbilderteam ohne eigene Einsatzstärke und fehlt hier.

Alle Personen sind fiktiv, auch die auf den Seiten namentlich genannten
Führungskräfte; ebenso Kennzeichen und Einsatzaufträge. Jede Person trägt ihre
Ortsfeuerwehr als Dienststelle, die Funktion nennt das Fahrzeug. Gemeinsame
Regeln aller Landkreise: [../README.md](../README.md).

Neu erzeugen mit: `npm run beispiele:kreisfeuerwehr-nds`

## Kreisfeuerwehrbereitschaft Ammerland

6 Bögen, zusammen 7/27/108/142.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| kfb/01-fuehrungsgruppe | Führungsgruppe | 2/1/12/15 | KdoW TZ, MTW TZ, ELW 2 TZ |
| kfb/02-fachzug-brandschutz-1 | Fachzug Brandschutz 1 | 1/4/21/26 | MTW Edewecht, LF KatS Apen, LF 8/6 Edewecht, SW KatS TZ |
| kfb/03-fachzug-technische-hilfeleistung | Fachzug Technische Hilfeleistung | 1/4/21/26 | MTW Westerstede, HLF 10 Ohrwege, LF 10 Bokel-Augustfehn, RW Husbäke |
| kfb/04-fachzug-vegetationsbrandbekaempfung | Fachzug Vegetationsbrandbekämpfung | 1/6/13/20 | MTW Rastede, TLF 3000 Petersfehn, TLF 8/18 Friedrichsfehn, TLF 3000 Ocholt-Howiek, TLF 3000 Halsbek, GW-L Ipwege-Wahnbek |
| kfb/05-fachzug-brandschutz-2 | Fachzug Brandschutz 2 | 1/4/15/20 | MTW Wiefelstede, TLF 20/24 Wiefelstede, LF 20 Westerstede, GW-L Bad Zwischenahn |
| kfb/06-fachzug-verpflegung-logistik-eigenschutz | Fachzug Verpflegung, Logistik, Eigenschutz | 1/8/26/35 | MTW Hollriede, MTW Hahn, GW-L Jeddeloh II, MTW Apen, GW-L Apen, MTW Spohle, GW-L Hollwege, GW-L TZ |

## Technische Einsatzleitung (TEL)

Ein Bogen, zusammen 5/1/1/7.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| technische-einsatzleitung | Technische Einsatzleitung (TEL) | 5/1/1/7 | ELW 2 TZ |

## Fachzug IuK

Ein Bogen, zusammen 1/3/11/15.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| fachzug-iuk | Fachzug IuK | 1/3/11/15 | ELW 2 TZ, MTW TZ, KdoW TZ |

## Gefahrgutzug

Ein Bogen, zusammen 1/9/65/75.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| gefahrgutzug | Gefahrgutzug | 1/9/65/75 | keine genannt |
