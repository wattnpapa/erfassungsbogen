# Beispiel-Erfassungsbögen — Kreisfeuerwehr Landkreis Schaumburg

12 Bögen für Kreiseinheiten der Kreisfeuerwehr Landkreis Schaumburg. Eine
Einheit aus mehreren Teileinheiten hat einen eigenen Ordner mit einem Bogen je
Teileinheit; eine Einheit, die als Ganzes ausrückt, ist ein einzelner Bogen.

Quellen (abgerufen am 09.11.2026):

- https://www.kfv-schaumburg.de/m/seite/429425/kreisfeuerwehrbereitschaften.html
- https://www.kfv-schaumburg.de/m/seite/429440/nord.html
- https://daten2.verwaltungsportal.de/dateien/seitengenerator/6ee23f349a8eb1e180922ad9c7f8775f197754/kfb_nord.pdf
- https://www.kfv-schaumburg.de/m/seite/429441/s%C3%BCd.html

Zwei Kreisfeuerwehrbereitschaften nach den Brandschutzabschnitten Nord und Süd, je rund 130 Einsatzkräfte. Grundlage sind die Organigramme auf den Seiten Nord und Süd. Für Nord liegt zusätzlich eine Liste (PDF) mit Funkrufnamen und Besatzungsstärken je Fahrzeug vor; beides ist übernommen, wo das Fahrzeug im Organigramm steht.

Organigramm und PDF der KFB Nord weichen ab: Im 2. Zug steht im Organigramm ein TLF 16/25 Meerbeck-Niedernwöhren, im PDF ein GW-Z; die Führung hat im Organigramm KdoW und ELW 1 Meerbeck-Niedernwöhren, im PDF zwei ELW 1. Abgebildet ist das Organigramm. Die KFB Süd nennt keine Funkrufnamen und Stärken; dort gilt die Normbesatzung. Fernmeldezug und Team Presse hängen in beiden Organigrammen an der Bereitschaftsführung und fehlen hier.

Alle Personen sind fiktiv, auch die auf den Seiten namentlich genannten
Führungskräfte; ebenso Kennzeichen und Einsatzaufträge. Jede Person trägt ihre
Ortsfeuerwehr als Dienststelle, die Funktion nennt das Fahrzeug. Gemeinsame
Regeln aller Landkreise: [../README.md](../README.md).

Neu erzeugen mit: `npm run beispiele:kreisfeuerwehr-nds`

## Kreisfeuerwehrbereitschaft Nord

6 Bögen, zusammen 7/25/90/122.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| kfb-nord/01-fuehrungsgruppe | Führungsgruppe | 2/0/5/7 | KdoW Kreisfeuerwehr, ELW 1 Meerbeck-Niedernwöhren, Krad Wiedenbrügge, Krad Lüdersfeld |
| kfb-nord/02-1-zug-brandbekaempfung-und-besondere-aufgaben | 1. Zug Brandbekämpfung und besondere Aufgaben | 1/5/25/31 | ELW 1 Wölpinghausen, LF 8 Lauenhagen, TSF-W Wiedenbrügge, TLF 8/18 Sachsenhagen, LF 8/6 Lüdersfeld |
| kfb-nord/03-2-zug-brandbekaempfung-und-besondere-aufgaben | 2. Zug Brandbekämpfung und besondere Aufgaben | 1/5/19/25 | MTW Probsthagen, StLF 10/6 Waltringhausen, TSF Ohndorf, TSF Riepen, TLF 16/25 Meerbeck-Niedernwöhren |
| kfb-nord/04-3-zug-wasserfoerderung | 3. Zug Wasserförderung | 1/6/16/23 | MTW Enzen, LF 16 TS Stadthagen, LF 16 TS Beckedorf, TLF 16/25 Lindhorst, GW-L1 Lindhorst, GW-L1 Horsten |
| kfb-nord/05-4-zug-technische-hilfeleistung | 4. Zug Technische Hilfeleistung | 1/5/19/25 | ELW 1 Rodenberg, HLF 10 Pohle, LF 8 Hülsede-Meinsen, RW 2 Rodenberg, TLF 8/18 Haste |
| kfb-nord/06-logistikkomponente-versorgung | Logistikkomponente Versorgung | 1/4/6/11 | MTW Apelern, GW-L1 Apelern, TSF Antendorf, TSF FeldKH Lyhren |

## Kreisfeuerwehrbereitschaft Süd

6 Bögen, zusammen 7/25/111/143.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
| kfb-sued/01-fuehrungsgruppe | Führungsgruppe | 2/0/6/8 | KdoW Kreisfeuerwehr, ELW 1 Bückeburg, Krad Rusbend, Krad Schaumburg |
| kfb-sued/02-1-zug-brandbekaempfung-und-besondere-aufgaben | 1. Zug Brandbekämpfung und besondere Aufgaben | 1/5/27/33 | MTW Schaumburg, LF 10 Möllenbeck, TLF 8/18 Deckbergen, LF 8 Krankenhagen, TSF-W Wennenkamp |
| kfb-sued/03-2-zug-brandbekaempfung-und-besondere-aufgaben | 2. Zug Brandbekämpfung und besondere Aufgaben | 1/5/24/30 | MTW Krainhagen, LF 8 Rolfshagen, RW 1 Meinsen-Warber-Achum, TSF-W Röcke, TSF-W Helpsen |
| kfb-sued/04-3-zug-wasserfoerderung | 3. Zug Wasserförderung | 1/6/26/33 | MTW Meinsen-Warber-Achum, LF 16/12 Steinbergen, SW 2000 Evesen, TSF-W Kathrinhagen, TSF-W Hattendorf, GW-L1 Gelldorf |
| kfb-sued/05-4-zug-wassertransport | 4. Zug Wassertransport | 1/6/17/24 | MTW Seggebruch, TSF-W Buchholz, TLF 8/18 Gelldorf, TLF 8/18 Exten, TLF 24/50 Bückeburg, TLF 8/18 KFW |
| kfb-sued/06-logistikkomponente-versorgung | Logistikkomponente Versorgung | 1/3/11/15 | TSF Antendorf, MZF Bergdorf, GW-L Rinteln |
