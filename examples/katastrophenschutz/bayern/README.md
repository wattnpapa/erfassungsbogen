# Beispiel-Erfassungsbögen — Katastrophenschutz/Bevölkerungsschutz Bayern

12 generierte Beispiel-Komponenten für den bayerischen Bevölkerungsschutz.

## Warum keine Landesverordnung wie bei den anderen Ländern

Anders als z. B. Thüringen (ThürKatSVO) oder Baden-Württemberg (VwV KatSD)
regelt das **Bayerische Katastrophenschutzgesetz (BayKSG)** keine landesweit
verbindliche Stärke- und Ausrüstungsnachweisung je KatS-Teileinheit — das ist
in Bayern Sache der Landkreise und kreisfreien Städte. Eine solche Tabelle war
trotz mehrerer Suchanfragen nicht auffindbar.

Gefunden wurde stattdessen die **bayernweit standardisierte Konzeption der
Feuerwehr-Hilfeleistungskontingente**, die das Staatsministerium des Innern
den Landkreisen und kreisfreien Städten vorgibt — mit realen Personenzahlen
UND Fahrzeuglisten je Komponente, öffentlich dokumentiert von der
Freiwilligen Feuerwehr München:
<https://www.ffw-muenchen.de/ueber-uns/hilfeleistungskontingente/>

Ergänzt um die **Schnell-Einsatz-Gruppen (SEG) des Bayerischen Roten
Kreuzes** — SEG San und SEG Bt —, ebenfalls ein bayernweites Konzept, hier aus
dem „Handbuch für Einsatzkräfte in den Bereitschaften" (Stand 15.03.2005) des
Kreisverbands Höchstadt:
<https://www.brk-hoechstadt.de/Downloads/Handbuch_fuer_Einsatzkraefte.pdf>

Diese Struktur ist damit — wie die niedersächsische Feuerwehrverordnung
(`scripts/kats-nds-beispielboegen.mts`) — ein bayernweit standardisiertes
Konzept mit real dokumentierten Stärke- und Fahrzeugangaben je Komponente,
kein Pendant zu einer Landesverordnung.

## Was quellengenau ist — und was modelliert

**Gesamtstärke und Fahrzeugliste** je Komponente sind der Quelle entnommen und
werden beim Generieren dagegen geprüft. Wo die Quelle nur die Gesamtstärke und
die Fahrzeugliste, aber **keine Einzelrollen** nennt (z. B. wer genau
Gruppenführer, Maschinist oder Truppmann ist), ist die Verteilung auf
Funktionen ein **plausibles, in sich stimmiges Modell** und nicht wörtlich der
Quelle entnommen — das ist je Bogen im Feld „Sonstiges" vermerkt.

Die **Grundkomponenten** „Führung/Verbindung", „Logistik", „Unterkunft" und
„Sanitätsdienst" werden laut Quelle in allen vier Kontingenttypen (Standard,
Hochwasser/Pumpen, Sturmschaden/Dachsicherung, ABC-Abwehr) baugleich gestellt
— hier deshalb nur je einmal abgebildet, nicht viermal. Die Grundkomponente
„Personal" (zwei Löschzüge) wird im Kontingenttyp „Standard" laut Quelle
zusätzlich als baugleiche **Spezialkomponente** „Personal" ein zweites Mal
gestellt (macht die 104 Gesamtkräfte des Standard-Kontingents aus
15+12+7+2+34+34) — auch das ist hier nur einmal abgebildet.

## Funkrufnamen

Ein bayerisches Funkrufnamenverzeichnis mit amtlichen Fahrzeug-Kennzahlen war
nicht auffindbar. Wie bei Thüringen wird deshalb die **bundesweite
OPTA-Systematik** der BDBOS analog angewendet:

> `<Kennwort> <Ortsbezeichnung> <Standort>/<Fahrzeugkennzahl>-<laufende Nummer>`

* **Kennwort** nach dem globalen FUNKRUF_KENNWOERTER-Vokabular: Feuerwehr
  „Florian", Bayerisches Rotes Kreuz „Rotkreuz".
* **Ortsbezeichnung** ist der Landkreis bzw. die kreisfreie Stadt.
* **Standort** und **Fahrzeugkennzahl** sind — wie in Baden-Württemberg —
  plausibel gewählt, aber **nicht amtlich belegt**.
* **Anhänger** (Verpflegungsanhänger, Lichtmast, Feldkochherd) führen keinen
  Funkrufnamen und zählen nicht als Einsatz-Kfz.

## Zur Standort-Zuordnung

Feuerwehr-Hilfeleistungskontingente und BRK-SEG gibt es in nahezu jedem
bayerischen Landkreis bzw. jeder kreisfreien Stadt. Welche Komponente hier an
welchem Ort steht, ist **beispielhaft** über alle sieben Regierungsbezirke
gestreut — Stärke und Fahrzeuge dagegen sind wie oben beschrieben
quellengenau.

Alle Personen, Standort-Zuordnungen und Kennzeichen sind **fiktiv**.

Neu erzeugen mit: `npm run beispiele:kats-by` (deterministisch, fester Zufalls-Seed).

| Datei | Konzept | Komponente | Ort | Regierungsbezirk | Stärke | Fahrzeuge im Bogen |
|---|---|---|---|---|---|---|
| ff-hlk-fuehrung-grundkomponente-fuehrung-verbindung-muenchen | Feuerwehr-Hilfeleistungskontingent (Grundkomponenten) | Grundkomponente „Führung/Verbindung” | München | Oberbayern | 7/1/7/15 | 5 |
| ff-hlk-logistik-grundkomponente-logistik-augsburg | Feuerwehr-Hilfeleistungskontingent (Grundkomponenten) | Grundkomponente „Logistik” | Augsburg | Schwaben | 0/1/11/12 | 5 |
| ff-hlk-unterkunft-grundkomponente-unterkunft-nuernberg | Feuerwehr-Hilfeleistungskontingent (Grundkomponenten) | Grundkomponente „Unterkunft” | Nürnberg | Mittelfranken | 0/1/6/7 | 3 |
| ff-hlk-sanitaetsdienst-grundkomponente-sanitaetsdienst-eigenschutz-wuerzburg | Feuerwehr-Hilfeleistungskontingent (Grundkomponenten) | Grundkomponente „Sanitätsdienst” (Eigenschutz) | Würzburg | Unterfranken | 0/1/1/2 | 1 |
| ff-hlk-personal-grundkomponente-personal-2-loeschzuege-regensburg | Feuerwehr-Hilfeleistungskontingent Standard | Grundkomponente „Personal” (2 Löschzüge) | Regensburg | Oberpfalz | 3/6/25/34 | 7 |
| ff-hlk-hochwasser-spezialkomponente-hochwasser-pumpen-bayreuth | Feuerwehr-Hilfeleistungskontingent Hochwasser/Pumpen | Spezialkomponente „Hochwasser/Pumpen” | Bayreuth | Oberfranken | 3/6/42/51 | 10 |
| ff-hlk-sturmschaden-spezialkomponente-sturmschaden-dachsicherung-passau | Feuerwehr-Hilfeleistungskontingent Sturmschaden/Dachsicherung | Spezialkomponente „Sturmschaden/Dachsicherung” | Passau | Niederbayern | 3/9/39/51 | 12 |
| ff-hlk-abc-abwehr-spezialkomponente-abc-abwehr-ingolstadt | Feuerwehr-Hilfeleistungskontingent ABC-Abwehr | Spezialkomponente „ABC-Abwehr” | Ingolstadt | Oberbayern | 2/10/39/51 | 12 |
| ff-hlk-wfs-wasserfoerdersystem-bayern-eigenstaendiges-kontingent-erster-abmarsch-fuerth | Feuerwehr-Hilfeleistungskontingent Wasserfördersystem Bayern | Wasserfördersystem Bayern (eigenständiges Kontingent, erster Abmarsch) | Fürth | Mittelfranken | 1/2/11/14 | 6 |
| seg-san-seg-san-arzttrupp-transporttrupp-landshut | BRK Schnell-Einsatz-Gruppe Sanitätsdienst (SEG San) | SEG San (Arzttrupp/Transporttrupp) | Landshut | Niederbayern | 1/1/8/10 | 3 |
| seg-bt-betreuung-seg-bt-betreuungstrupp-fuer-soziale-betreuung-landshut | BRK Schnell-Einsatz-Gruppe Betreuung (SEG Bt) | SEG Bt — Betreuungstrupp für soziale Betreuung | Landshut | Niederbayern | 0/1/11/12 | 2 |
| seg-bt-verpflegung-seg-bt-verpflegungstrupp-kempten-allgaeu | BRK Schnell-Einsatz-Gruppe Betreuung (SEG Bt) | SEG Bt — Verpflegungstrupp | Kempten (Allgäu) | Schwaben | 0/1/2/3 | 2 |
