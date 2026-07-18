# Beispiel-Erfassungsbögen — Katastrophenschutz Brandenburg

8 generierte Beispiel-Einheiten nach der Brandenburgischen
**Katastrophenschutzverordnung** (KatSV vom 17. Oktober 2012, zuletzt geändert
durch Verordnung vom 16. Dezember 2021) und ihrer **Anlage zu § 4 Absatz 1**
„Übersicht zur Mindestausstattung von Fachdiensten und Einheiten der unteren
Katastrophenschutzbehörden".

Alle Personen, Standort-Zuordnungen, Gemeindeschlüssel und Kennzeichen sind
**fiktiv**.

## Warum ein Bogen je Einheit — und nicht je Teileinheit

Anders als die SächsKatSVO und die KatS-StAN Niedersachsen regelt die
Brandenburger Anlage je Einheit nur

* die **personelle Mindeststärke** (Führer / Unterführer / Helfer / Gesamt) und
* eine **Mindestzahl an Einsatz-Kfz** (Einsatzfahrzeuge mit verlasteter Ausrüstung).

Sie nennt **weder Fahrzeugtypen noch eine Untergliederung in Teileinheiten**.
Deshalb gibt es hier acht Bögen — einen je Einheit der Anlage — statt einer
Zerlegung in Trupps, Staffeln und Gruppen wie bei Sachsen und Niedersachsen.
Eine solche Gliederung wäre frei erfunden.

Aus demselben Grund gilt für die Fahrzeuge:

> **Stärke und Anzahl der Einsatz-Kfz sind verordnungsgenau** und werden beim
> Generieren gegen die Anlage geprüft. Die **Fahrzeugtypen dagegen sind nicht
> verordnungsgeregelt** — sie sind hier beispielhaft aus dem Katalog
> „Funkkennziffern Feuerwehr & Rettungsdienst im Land Brandenburg" belegt, damit
> die Bögen vollständige und im Land stimmige Funkrufnamen zeigen. Verbindlich
> ist stattdessen die Technikausstattung nach den Ausführungsvorschriften gemäß
> § 8 KatSV, die nicht Teil der Verordnung ist.

Derselbe Hinweis steht im Feld „Sonstiges" jedes einzelnen Bogens.

## Funkrufnamen

Nach dem Katalog „Funkkennziffern Feuerwehr & Rettungsdienst im Land
Brandenburg":

> `<Kennwort> <Bereich> <Amt/Gemeinde/Stadt>/<Funkkennziffer>/<Ordnungsnummer>`
>
> Beispiel des Katalogs: `Florian Fläming 10 / 41 / 03`

* **Ortsbezeichnung** ist — anders als in Sachsen — die **Bereichs-/Kreis-
  bezeichnung**, nicht die Gemeinde; die Gemeinde steckt in der **ersten
  Teilkennzahl** (Amt, Gemeinde, Stadt). Die Vergabe dieser Schlüssel liegt bei
  der unteren Katastrophenschutzbehörde, die Werte hier sind fiktiv.
* **Zweite Teilkennzahl** = Funkkennziffer des Fahrzeugtyps aus dem Katalog
  (z. B. 11 ELW 1, 12 ELW 2, 19 MTW, 24 TLF 24/50, 33 DL(K) 23/12, 44 LF 16/20,
  45 LF 16-TS, 54 GW-G, 57 GW-Mess, 58 GW-W, 59 sonstiger GW, 63 SW 2000-Tr,
  65 WLF, 74 LKW, 75 GW-Licht, 79 MZB, 82 NEF, 83 RTW, 85 KTW, 87 GKTW,
  88 RTB, 89 sonstiges Rettungsfahrzeug).
* **Dritte Teilkennzahl** = Ordnungsnummer, laufend je Funkkennziffer.
* **Kennwort** je Trägerorganisation — Feuerwehr „Florian", DRK „Rotkreuz",
  JUH „Akkon", ASB „Sama", DLRG „Pelikan". Der Katalog selbst deckt Feuerwehr
  und Rettungsdienst ab; die Hilfsorganisationen führen dieselben Kennziffern
  unter ihrem eigenen Kennwort.
* **Anhänger** (Feldkochherd, Netzersatzanlage) führen keinen Funkrufnamen und
  zählen nicht als Einsatz-Kfz.

## Träger

Die Einheiten werden von den öffentlichen Feuerwehren und den mitwirkenden
Hilfsorganisationen nach § 18 Absatz 1 BbgBKG getragen; die Aufgabenträger
können sie auch selbst als **Regieeinheiten** betreiben (§ 3 Absatz 1 KatSV).
Die Zuordnung hier ist beispielhaft gewählt und über die unteren
Katastrophenschutzbehörden gestreut. Nach § 3 Absatz 2 KatSV können die Behörden
insbesondere in den Fachdiensten Versorgung und Bergung/Instandsetzung mit dem
**THW** zusammenwirken — abgebildet ist die SEE-VE hier als Regieeinheit der
unteren Katastrophenschutzbehörde.

Neu erzeugen mit: `npm run beispiele:kats-bb` (deterministisch, fester Zufalls-Seed).

| Datei | Fachdienst | Einheit | Ort | Untere KatS-Behörde | Stärke | Kfz (Anlage) | Fahrzeuge im Bogen |
|---|---|---|---|---|---|---|---|
| seg-fue-schnelleinsatzgruppe-fuehrungsunterstuetzung-neuruppin | Führung | SEG-Fü | Neuruppin | Landkreis Ostprignitz-Ruppin | 0/1/8/9 | 3 | 3 |
| bse-brandschutzeinheit-cottbus | Brandschutz | BSE | Cottbus | Stadt Cottbus | 5/13/55/73 | 15 | 15 |
| gse-gefahrstoffeinheit-schwedt-oder | Gefahrstoffschutz | GSE | Schwedt/Oder | Landkreis Uckermark | 1/7/24/32 | 7 | 7 |
| see-san-schnelleinsatzeinheit-sanitaet-potsdam | Sanitätsdienst | SEE-San | Potsdam | Landeshauptstadt Potsdam | 1/10/27/38 | 10 | 10 |
| seg-bt-schnelleinsatzgruppe-betreuung-luckenwalde | Betreuung | SEG-Bt | Luckenwalde | Landkreis Teltow-Fläming | 0/1/8/9 | 2 | 2 |
| seg-v-schnelleinsatzgruppe-verpflegung-eberswalde | Betreuung | SEG-V | Eberswalde | Landkreis Barnim | 0/1/8/9 | 3 | 4 |
| seg-w-schnelleinsatzgruppe-wassergefahren-brandenburg-an-der-havel | Bergung, Teilbereich Wassergefahren | SEG-W | Brandenburg an der Havel | Stadt Brandenburg an der Havel | 0/2/8/10 | 4 | 4 |
| see-ve-schnelleinsatzeinheit-versorgung-energie-senftenberg | Versorgung | SEE-VE | Senftenberg | Landkreis Oberspreewald-Lausitz | 0/1/5/6 | 2 | 3 |

Die Spalte **Kfz (Anlage)** ist die Mindestzahl der Verordnung, **Fahrzeuge im
Bogen** zählt zusätzlich die mitgeführten Anhänger.
