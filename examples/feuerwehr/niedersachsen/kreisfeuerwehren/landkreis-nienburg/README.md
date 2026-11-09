# Beispiel-Erfassungsbögen — Kreisfeuerwehr Landkreis Nienburg/Weser

20 Bögen für Kreiseinheiten der Kreisfeuerwehr Landkreis Nienburg/Weser. Eine
Einheit aus mehreren Teileinheiten hat einen eigenen Ordner mit einem Bogen je
Teileinheit; eine Einheit, die als Ganzes ausrückt, ist ein einzelner Bogen.

Quellen (abgerufen am 09.11.2026):

- https://www.kfv-nienburg.de/einheiten/kfb-nord/
- https://www.kfv-nienburg.de/einheiten/kfb-sued/
- https://www.kfv-nienburg.de/einheiten/kfb-umwelt/
- https://www.kfv-nienburg.de/einheiten/tel/
- https://www.kfv-nienburg.de/einheiten/drohnengruppe-tel/
- https://www.kfv-nienburg.de/einheiten/abc-zug/
- https://www.kfv-nienburg.de/einheiten/fachzug-ruest-rettung/
- https://www.kfv-nienburg.de/einheiten/versorgungszug/
- https://www.kfv-nienburg.de/einheiten/logistikgruppe/

Die Funkrufnamen der KFB Nord stehen so da, wie die Seite sie nennt („FloNi 80-79-1“). Die KFB Süd nennt keine. Fahrzeugtypen ohne Nummer auf der Seite („LF Heemsen“, „HLF Nendorf“) stehen ohne Nummer da; „GW-Logostik“ ist als GW-L berichtigt.

Die Züge I bis III der KFB Umwelt stellen laut Seite je mindestens zwei Gruppen für den ABC-Einsatz und einen Führungstrupp; Fahrzeuge nennt die Seite nicht, die Bögen führen nur Personal. Zug 4 ist der ABC-Zug mit Geräteeinheit; die Angaben der eigenen ABC-Zug-Seite (40 Kräfte, 8 Fahrzeuge, 4 Abrollbehälter) stehen dort unter „Sonstiges“.

Beim Fachzug Rüst/Rettung fährt der ABC-Zug den Wechsellader mit dem Abrollbehälter, die beteiligten Ortsfeuerwehren kommen mit ihren Löschgruppenfahrzeugen, deren Typ die Seite nicht nennt. Die Drohnengruppe nennt kein eigenes Fahrzeug.

Alle Personen sind fiktiv, auch die auf den Seiten namentlich genannten
Führungskräfte; ebenso Kennzeichen und Einsatzaufträge. Jede Person trägt ihre
Ortsfeuerwehr als Dienststelle, die Funktion nennt das Fahrzeug. Gemeinsame
Regeln aller Landkreise: [../README.md](../README.md).

Neu erzeugen mit: `npm run beispiele:kreisfeuerwehr-nds`

## Kreisfeuerwehrbereitschaft Nord

5 Bögen, zusammen 6/29/140/175.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| kfb-nord/01-fuehrungsstaffel | Führungsstaffel | 2/3/22/27 | Krad FTZ, Krad FTZ, MTW FTZ, MTW Haßbergen, FüKW TEL, ELW 2 TEL, RTW DRK SEG Nienburg |
| kfb-nord/02-1-fachzug-wasserfoerderung | 1. Fachzug Wasserförderung | 1/7/40/48 | LF 16 TS Buchhorst-Behlingen, LF 8 Rodewald, LF 10/6 Erichshagen-Wölpe, TSF Wenden, TSF Gandesbergen, GW-L2 Steimbke, MTF Wendenborstel |
| kfb-nord/03-2-fachzug-wassertransport | 2. Fachzug Wassertransport | 1/7/19/27 | MTW Eystrup, TLF 8/24 Linsburg, TLF 8/24 Holte-Langeln, TLF 16/24 Holtorf, TLF 16/25 Hassel, TSF Hämelhausen, TLF 8 Wienbergen |
| kfb-nord/04-3-fachzug-technische-hilfeleistung | 3. Fachzug Technische Hilfeleistung | 1/5/21/27 | ELW 1 Marklohe, HLF 20/20 Wietzen, GW/Z Drakenburg, RTW DRK SEG Landesbergen, LF 10/6 Marklohe |
| kfb-nord/05-4-fachzug-brandbekaempfung | 4. Fachzug Brandbekämpfung | 1/7/38/46 | ELW 1 Gadesbünden, LF Heemsen, LF Langendamm, TSF Rohrsen, TSF Wechold, TSF Magelsen, TSF Bötenberg |

## Kreisfeuerwehrbereitschaft Süd

5 Bögen, zusammen 6/31/145/182.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| kfb-sued/01-technische-einsatzleitung-und-fuehrungsgruppe | Technische Einsatzleitung und Führungsgruppe | 2/2/21/25 | ELW 1 TEL, ELW 2 TEL, MTW FTZ, MTW Warmsen, Krad Kreisfeuerwehr, Krad Kreisfeuerwehr |
| kfb-sued/02-1-fachzug-wasserfoerderung | 1. Fachzug Wasserförderung | 1/9/41/51 | MTF Elo Raddestorf, MTW Essern, TSF-W Sapelloh, TSF-W Lohhof, TSF-W Harrienstedt, TSF Hoysinghausen, LF 10/6 Diepenau, SW 2000 Uchte, GW-L Münchehagen |
| kfb-sued/03-2-fachzug-wassertransport | 2. Fachzug Wassertransport | 1/7/19/27 | MTF Landesbergen, TLF 8/18 Loccum, TLF 3000 Bohnhorst, TLF 4000 Stolzenau, TLF 3000 Liebenau, TSF-W Brokeloh, TLF 2000 Leese |
| kfb-sued/04-3-fachzug-technische-hilfeleistung | 3. Fachzug Technische Hilfeleistung | 1/6/35/42 | HLF Nendorf, TSF Bruchhagen, HLF Deblinghausen, GW-L Steyerberg, HLF Husum, MLF Bühren |
| kfb-sued/05-4-fachzug-logistik-personalreserve | 4. Fachzug Logistik & Personalreserve | 1/7/29/37 | MTW Rehburg, HLF Rehburg, TSF Müsleringen, TSF Schinna, TSF Leeseringen, RTW JUH Landesbergen, RTW ASB Rehburg |

## Kreisfeuerwehrbereitschaft Umwelt

5 Bögen, zusammen 7/10/57/74.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| kfb-umwelt/01-bereitschaftsfuehrung-umwelt | Bereitschaftsführung Umwelt | 2/0/0/2 | keine genannt |
| kfb-umwelt/02-zug-i-nord | Zug I Nord | 1/3/17/21 | keine genannt |
| kfb-umwelt/03-zug-ii-mitte | Zug II Mitte | 1/2/18/21 | keine genannt |
| kfb-umwelt/04-zug-iii-sued | Zug III Süd | 1/3/17/21 | keine genannt |
| kfb-umwelt/05-zug-4-abc-zug-und-geraeteeinheit | Zug 4 ABC-Zug und Geräteeinheit | 2/2/5/9 | GW-G FTZ, WLF Nienburg, AB Atemschutz Nienburg, GW-L Nienburg, AB TroLF 750 Nienburg |

## Technische Einsatzleitung (TEL)

Ein Bogen, zusammen 2/4/5/11.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| technische-einsatzleitung | Technische Einsatzleitung (TEL) | 2/4/5/11 | FüKW TEL, ELW 2 TEL |

## Drohnengruppe der TEL

Ein Bogen, zusammen 1/1/7/9.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| drohnengruppe-tel | Drohnengruppe | 1/1/7/9 | keine genannt |

## Fachzug Rüst/Rettung

Ein Bogen, zusammen 1/5/41/47.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| fachzug-ruest-rettung | Fachzug Rüst/Rettung | 1/5/41/47 | LF Wietzen, LF Buchhorst-Behlingen-Mehlbergen, LF Balge-Holzbalge-Sebbenhausen, LF Steyerberg, LF Deblinghausen, WLF FTZ, AB Rüst/Rettung FTZ |

## Versorgungszug

Ein Bogen, zusammen 1/1/9/11.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| versorgungszug | Versorgungszug | 1/1/9/11 | MTW Wietzen, GW-V Wietzen, LKW Wietzen, Anh Spülmobil Wietzen, Anh Kühl Wietzen |

## Logistikgruppe

Ein Bogen, zusammen 1/1/7/9.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| logistikgruppe | Logistikgruppe | 1/1/7/9 | MTW Stöckse, MTW KJF, WLF Kreisfeuerwehr, Teleskoplader Kreisfeuerwehr, AB Logistik Kreisfeuerwehr, AB Infrastruktur Kreisfeuerwehr, AB Aufenthalt Kreisfeuerwehr, Anh KJF |
