# Beispiel-Erfassungsbögen — Katastrophenschutz Baden-Württemberg

14 generierte Beispiel-Einheiten nach der baden-württembergischen
**VwV KatSD** (Verwaltungsvorschrift des Innenministeriums über die Stärke und
Gliederung des Katastrophenschutzdienstes, vom 24. September 2012, GABl. Nr. 12
vom 31. Oktober 2012, S. 802) mit ihren **Anlagen 2** (Brandschutz, Technische
Hilfe, ABC-Schutz), **3** (Sanität und Betreuung), **4** (Wasserrettung) und
**5** (Veterinärwesen).

Alle Einheiten werden in **Doppelbesetzung** vorgehalten; die angegebenen
Stärken sind jeweils die **einfache Besetzung**.

Alle Personen, Standort-Zuordnungen und Kennzeichen sind **fiktiv**.

## Warum ein Bogen je Einheit — und nicht je Teileinheit

Wie die Brandenburgische KatSV stellt die VwV KatSD die taktischen Einheiten
als **geschlossene Züge mit interner Fahrzeug-Tabelle** dar, nicht als
unabhängig einsetzbare Teileinheiten wie die SächsKatSVO oder die KatS-StAN
Niedersachsen. Deshalb gibt es hier 14 Bögen — einen je
taktischer Einheit — statt einer Zerlegung in Trupps, Staffeln und Gruppen.
Eine solche Gliederung wäre frei erfunden.

## Zur Landkreis-Zuordnung

Die VwV KatSD weist die Einheiten der Anlage 2 konkreten Land- und
Stadtkreisen je Regierungsbezirk zu. Diese Einzeltabelle lag beim Erstellen
dieses Generators nicht vollständig vor. Die hier gezeigten Standorte sind
deshalb **beispielhaft** gewählt — reale, plausible Land-/Stadtkreise über
alle vier Regierungsbezirke (Stuttgart, Karlsruhe, Freiburg, Tübingen)
gestreut, aber **nicht** Zeile für Zeile der Verordnungstabelle entnommen.
**Stärke- und Fahrzeugdaten dagegen sind verordnungsgenau** und werden beim
Generieren gegen die Anlagen geprüft. Bei drei Einheiten (Bergrettungszug,
Luftkrankentransporttrupp, Veterinärzug) ist zusätzlich die reale
Standortliste bekannt; dort wurde einer der tatsächlichen Standorte verwendet
(Veterinärzug: einer von Schwäbisch Hall, Freiburg, Ravensburg).

## Funkrufnamen

Nach dem Funkrufnamenplan für die nichtpolizeilichen BOS Baden-Württemberg
(Erlass 5-0268.7/1 vom 21.07.2003 des Innenministeriums):

> `<Kennwort> <Ortsbezeichnung> <1. Teilkennzahl>/<2. Teilkennzahl>-<3. Teilkennzahl>`

* **Kennwort** je Trägerorganisation — Feuerwehr „Florian", ASB „Sama",
  Bergwacht „Bergwacht", DLRG „Pelikan", DRK „Rotkreuz", JUH „Akkon", Malteser
  „Johannes", Katastrophenschutzbehörden (Regieeinheiten) „Kater", THW
  „Heros", Rettungshunde „Antonius". Kennwörter, die nicht im globalen
  Vokabular stehen (Bergwacht, Antonius, Kater), werden als Freitext geführt.
* **Ortsbezeichnung** ist Gemeinde bzw. Landkreis; haben Stadt- und Landkreis
  denselben Namen, bekommt der Landkreis den Zusatz „-Land" (in diesen
  Beispielen nicht aufgetreten, da keine zwei gleichnamigen Kreise gewählt
  wurden).
* **1. Teilkennzahl** = Standort (fiktiv, Vergabe liegt bei der unteren
  Katastrophenschutzbehörde).
* **2. Teilkennzahl** = Funkkennziffer des Fahrzeugtyps. Bekannt sind aus dem
  Erlass nur die Ankerpunkte 10 KdoW, 11 ELW1/FüKW, 12 ELW2; alle weiteren
  Kennziffern hier (19 MTW, 20 (H)LF20/16, 22 LF-KatS, 24 (H)LF10/20, 30
  GW-T/GW-L, 31 SW2000, 32 AB-Schlauch, 40 RW, 41 GW-G/AB-G, 42 GW-AS/AB-AS,
  43 Dekon-LKW P, 44 ABC-ErkKW, 60 GW-San, 61 KTW, 62 GW-Bt/Log, 63
  GW-Technik, 70 GW-W, 71 Bergrettungsfahrzeug, 72 GW-StrR, 73 GW-Boot, 74
  GW-Tauchen, 80 Lkw Veterinärzug, 90 Luftrettung) sind **plausibel, aber
  nicht vollständig amtlich belegt** — sie dienen nur dazu, vollständige und
  in sich stimmige Funkrufnamen zu zeigen.
* **3. Teilkennzahl** = Ordnungsnummer, laufend je Funkkennziffer.
* **Anhänger** (Boots-, Tauchanhänger) führen keinen Funkrufnamen und zählen
  nicht als Einsatz-Kfz. Der Rettungshubschrauber des Luftkrankentransport-
  trupps führt in dieser vereinfachten Darstellung ebenfalls eine
  Funkkennziffer (90); tatsächlich gilt für Luftfahrzeuge ein eigenes
  Kennzeichnungssystem.

## Träger

Die Fachdienste Brandschutz, Technische Hilfe und ABC-Schutz (Anlage 2) sind
durchgängig den öffentlichen Feuerwehren zugeordnet. Sanität und Betreuung
(Anlage 3) verteilen sich beispielhaft auf DRK, ASB, Bergwacht (organisatorisch
beim DRK), Johanniter und die Rettungshundestaffeln (Kennwort „Antonius").
Der Wasserrettungszug (Anlage 4) ist der DLRG zugeordnet, der Veterinärzug
(Anlage 5) als Regieeinheit der unteren Katastrophenschutzbehörde
(Kennwort „Kater").

Neu erzeugen mit: `npm run beispiele:kats-bw` (deterministisch, fester Zufalls-Seed).

| Datei | Anlage | Einheit | Ort | Regierungsbezirk | Stärke | Kfz (Anlage) | Fahrzeuge im Bogen | Landesweit |
|---|---|---|---|---|---|---|---|---|
| fuee-fuehrungseinheit-ludwigsburg | Anlage 2 | FüE | Ludwigsburg | Stuttgart | 4/3/5/12 | 5 | 5 | 36 |
| zbb-zug-brandbekaempfung-stuttgart | Anlage 2 | ZBB | Stuttgart | Stuttgart | 1/3/16/20 | 4 | 4 | 50 |
| zlw-zug-loeschwasserversorgung-rastatt | Anlage 2 | ZLW | Rastatt | Karlsruhe | 1/4/13/18 | 6 | 6 | 56 |
| zth-zug-technische-hilfe-reutlingen | Anlage 2 | ZTH | Reutlingen | Tübingen | 1/3/12/16 | 4 | 4 | 51 |
| zhw-zug-hochwasser-offenburg | Anlage 2 | ZHW | Offenburg | Freiburg | 1/4/13/18 | 5 | 5 | 36 |
| zg-zug-gefahrstoff-mannheim | Anlage 2 | ZG | Mannheim | Karlsruhe | 1/5/15/21 | 6 | 6 | 34 |
| zmd-zug-messen-und-dekontamination-karlsruhe | Anlage 2 | ZMD | Karlsruhe | Karlsruhe | 1/4/16/21 | 5 | 5 | 42 |
| ee-ev-einsatzeinheit-erstversorgung-waiblingen | Anlage 3 | EE-EV | Waiblingen | Stuttgart | 3/5/24/32 | 8 | 8 | 66 |
| ee-b-einsatzeinheit-behandlung-konstanz | Anlage 3 | EE-B | Konstanz | Freiburg | 3/5/24/32 | 8 | 8 | 54 |
| brz-bergrettungszug-waldshut-tiengen | Anlage 3 | BRZ | Waldshut-Tiengen | Freiburg | 2/3/23/28 | 4 | 4 | 6 |
| lkt-luftkrankentransporttrupp-boeblingen | Anlage 3 | LKT | Böblingen | Stuttgart | 1/1/1/3 | 1 | 1 | 7 |
| rhs-rettungshundestaffel-biberach-an-der-riss | Anlage 3 | RHS | Biberach an der Riß | Tübingen | 0/1/6/7 | 1 | 1 | 5 |
| wrz-wasserrettungszug-friedrichshafen | Anlage 4 | WRZ | Friedrichshafen | Tübingen | 1/4/16/21 | 6 | 8 | 10 |
| vetz-veterinaerzug-ravensburg | Anlage 5 | VetZ | Ravensburg | Tübingen | 2/0/18/20 | 1 | 1 | 3 |

Die Spalte **Kfz (Anlage)** ist die Zahl der Einsatz-Kfz laut Verordnung,
**Fahrzeuge im Bogen** zählt zusätzlich die mitgeführten Anhänger, und
**Landesweit** ist die Gesamtzahl dieses Einheitstyps in Baden-Württemberg
(keine Personalstärke).
