# Beispiel-Erfassungsbögen — Katastrophenschutz Rheinland-Pfalz

37 generierte Beispiel-Fähigkeitsmodule nach der rheinland-pfälzischen
**Katastrophenschutzverordnung** (KatS-LVO vom 4. September 2025, GVBl. Nr. 18 vom
25.09.2025, S. 513) und der dazugehörigen **„Handlungsanweisung zum Vollzug der
Anlage 1 der KatS-LVO"** (Landesamt für Brand- und Katastrophenschutz
Rheinland-Pfalz, Stand 18. November 2025).

Alle Personen, Standort-Zuordnungen und Kennzeichen sind **fiktiv**.

## Warum ein anderes Zerlegungsmuster als Sachsen/Niedersachsen/Thüringen/Brandenburg

Die KatS-LVO selbst regelt in ihrer **Anlage 1** (zu §§ 2 und 3) keine Einheiten
mit Personalstärke und Fahrzeugliste, sondern abstrakte **Fähigkeiten**
(z. B. `SAN-01`) mit reinen Vorhaltungs-Stückzahlen je Landkreis-Größenklasse
(klein/mittel/groß/RDB/Land) — ohne jede Personal- oder Fahrzeugangabe. Das ist
ein grundlegend anderes Regelungsmodell als in den anderen Bundesländern, die
entweder Teileinheiten (Sachsen, Niedersachsen, Thüringen) oder wenigstens ganze
Einheiten mit Mindeststärke (Brandenburg) unmittelbar in der Verordnung nennen.

Diese Fähigkeiten werden erst durch die **Handlungsanweisung** zu konkreten
**Fähigkeitsmodulen** mit Fahrzeugen, Zusatzmaterial, Personalstärke
(Führer/Unterführer/Mannschaft/Gesamt) und Qualifikationsanforderungen — jeweils
in einer Umsetzungs-Variante „Standard (I)" und optionalen Alternativen. Diese
Handlungsanweisung ist **verbindlich** (Fachaufsicht und Weisungsrecht nach
§ 4 Abs. 6 Satz 2 LBKG) und damit die maßgebliche Quelle für Personalstärke und
Fahrzeuge dieser Beispielbögen.

**Modellierungsentscheidung:** Ein Bogen je Fähigkeitsmodul (analog Brandenburg,
keine weitere Zerlegung in Teileinheiten) — jedes Modul IST bereits die
kleinste in der Handlungsanweisung benannte Einheit. Abgebildet ist jeweils nur
die **Standard (I)**-Umsetzung; Alternativen (gleichwertige Bestandsfahrzeuge,
Teil D der Handlungsanweisung) sind nicht zusätzlich als eigene Bögen enthalten.
**LOG-01** (Instandsetzung stationär) fehlt bewusst: Die Handlungsanweisung weist
dafür keine Personal-/Fahrzeug-Umsetzung aus — sie wird zentral durch das LfBK
am Standort Koblenz abgebildet, ist also keine von Landkreisen/kreisfreien
Städten vorzuhaltende Einheit.

## Was verordnungsgenau ist — und was nicht

> **Personalstärke und Fahrzeuge sind exakt der Handlungsanweisung entnommen**
> und werden beim Generieren gegen sie geprüft. Wo die dort namentlich
> genannten Qualifikationen (z. B. „8 AGT") die angegebene Ebenen-Stärke nicht
> ausschöpfen, füllen generisch benannte Stellen ohne Sonderqualifikation
> (z. B. „Truppmann/Truppfrau", „Kraftfahrer/-in") auf die amtliche Sollstärke
> auf.
>
> **Nicht amtlich geregelt** und deshalb hier frei, aber plausibel gewählt:
> die **Trägerorganisation** je Modul (die Handlungsanweisung nennt außer bei
> CBRN-04 — stationär bei der Berufsfeuerwehr Ludwigshafen — keinen Träger;
> Zuordnung hier nach Abschnitt A 4.3 der Handlungsanweisung: Sanitäts-,
> Betreuungs- und Verpflegungsdienst sowie PSNV über die Hilfsorganisationen
> der „Arbeitsgemeinschaft der Hilfsorganisationen im Katastrophenschutz
> Rheinland-Pfalz" — DRK, Johanniter, ASB, Malteser im Wechsel —, Wasserrettung
> über die DLRG, alle übrigen Module über die Feuerwehr als Regieeinheit der
> unteren Katastrophenschutzbehörde) sowie Standort-Zuordnung, Personen und
> Kennzeichen.
>
> **Funkrufnamen bleiben leer.** Das landeseinheitliche OPTA-Rufnamenschema
> nach § 31 KatS-LVO wird vom Landesamt für Brand- und Katastrophenschutz
> festgelegt; ein öffentlich zugängliches Funkrufnamenverzeichnis für dieses
> Schema war nicht auffindbar. Statt eines erfundenen Schemas bleibt das Feld
> leer.

Derselbe Hinweis steht im Feld „Sonstiges" jedes einzelnen Bogens.

Neu erzeugen mit: `npm run beispiele:kats-rp` (deterministisch, fester Zufalls-Seed).

| Kürzel | Fähigkeitsmodul | Aufgabenfeld | Ort | Stärke | Fahrzeuge |
|---|---|---|---|---|---|
| FÜ-01 | Führung-Staffel | Führung | Mainz | 3/0/3/6 | 2 |
| FÜ-02 | Interdisziplinäre Führungsgruppe | Führung | Koblenz | 5/0/4/9 | 4 |
| FÜ-03 | Interdisziplinärer Führungsstab | Führung | Trier | 13/0/10/23 | 5 |
| FÜ-04 | Führungsunterstützung gesundheitlicher Bevölkerungsschutz | Führung | Ludwigshafen am Rhein | 3/0/3/6 | 2 |
| FÜ-05 | Führung - Gesundheitlicher Bevölkerungsschutz | Führung | Kaiserslautern | 14/0/10/24 | 7 |
| FÜ-06 | Führung – Bildgebende Fernerkundung | Führung | Neuwied | 0/1/2/3 | 1 |
| BS-01 | Brandbekämpfung – schlauchgebunden | Brandschutz | Bad Kreuznach | 1/2/17/20 | 3 |
| BS-02 | Brandbekämpfung – Wassertransport im Einsatzraum | Brandschutz | Bitburg | 1/3/6/10 | 4 |
| BS-03 | Brandbekämpfung – Wassertransport zum Einsatzraum (B-Schlauch) | Brandschutz | Alzey | 1/2/17/20 | 4 |
| BS-04 | Brandbekämpfung – Wassertransport zum Einsatzraum (F-Schlauch) | Brandschutz | Pirmasens | 1/2/16/19 | 4 |
| TH-01 | Technische Hilfe - Rettung | Technische Hilfe | Worms | 2/3/17/22 | 4 |
| TH-02 | Technische Hilfe - Sandsack | Technische Hilfe | Speyer | 2/1/18/21 | 4 |
| TH-03 | Technische Hilfe - Pumpen/Beleuchtung | Technische Hilfe | Altenkirchen (Ww.) | 0/1/2/3 | 1 |
| CBRN-01 | CBRN-Schutz – Retten und Eindämmen | CBRN-Schutz | Bernkastel-Kues | 2/4/16/22 | 5 |
| CBRN-02 | CBRN-Schutz – Messen | CBRN-Schutz | Mainz | 2/5/12/19 | 5 |
| CBRN-03 | CBRN-Schutz – radioaktiver Kontaminationsnachweis | CBRN-Schutz | Koblenz | 2/3/20/25 | 4 |
| CBRN-04 | Landesanalysesystem | CBRN-Schutz | Trier | 1/1/4/6 | 3 |
| SAN-01 | Sanitätsdienst - Behandlung | Sanitätsdienst | Ludwigshafen am Rhein | 0/1/11/12 | 3 |
| SAN-02 | Sanitätsdienst - Transport | Sanitätsdienst | Kaiserslautern | 1/1/7/9 | 4 |
| SAN-03 | Sanitätsdienst – Behandlungsplatz 50 | Sanitätsdienst | Neuwied | 3/0/6/9 | 4 |
| BT-01 | Betreuung – Soziale Betreuung | Betreuungsdienst | Bad Kreuznach | 0/1/5/6 | 1 |
| BT-02 | Betreuung - Unterkunft | Betreuungsdienst | Bitburg | 0/1/5/6 | 2 |
| BT-03 | Betreuung – Betreuungsplatz 500 | Betreuungsdienst | Alzey | 3/0/4/7 | 4 |
| WR-01 | Wasserrettung - Fließgewässer | Wasserrettung | Pirmasens | 2/2/18/22 | 6 |
| WR-02 | Wasserrettung - Tauchen | Wasserrettung | Worms | 0/2/6/8 | 2 |
| RG-01 | Rettung aus unwegsamem Gelände - SRHT | Rettung aus unwegsamem Gelände | Speyer | 0/1/4/5 | 1 |
| RG-02 | Rettung aus unwegsamem Gelände – SRHT Windenrettung | Rettung aus unwegsamem Gelände | Altenkirchen (Ww.) | 0/1/5/6 | 1 |
| RG-03 | Rettung aus unwegsamem Gelände - RHOT | Rettung aus unwegsamem Gelände | Bernkastel-Kues | 0/1/6/7 | 2 |
| V-01 | Verpflegung-Mahlzeiten | Verpflegung | Mainz | 0/1/8/9 | 3 |
| V-02 | Verpflegung-Getränke | Verpflegung | Koblenz | 0/1/8/9 | 3 |
| LOG-02 | Logistik – Treibstoffversorgung | Logistik | Trier | 0/1/5/6 | 2 |
| LOG-03 | Logistik - Transport von Stückgut | Logistik | Ludwigshafen am Rhein | 0/1/2/3 | 1 |
| LOG-04 | Logistik - Transport von Schüttgut | Logistik | Kaiserslautern | 0/1/5/6 | 2 |
| LOG-05 | Logistik - Personentransport | Logistik | Neuwied | 0/1/7/8 | 8 |
| PSNV-01 | Psychosoziale Notfallversorgung | PSNV | Bad Kreuznach | 0/1/8/9 | 1 |
| BM-01 | VOST - Virtual Operations Support Team | Bevölkerungsinformation | Bitburg | 1/0/5/6 | 1 |
| BM-02 | Bevölkerungsinformation und Medienarbeit - PuMA | Bevölkerungsinformation | Alzey | 4/0/2/6 | 2 |

Quelle: KatS-LVO Rheinland-Pfalz vom 4. September 2025 (GVBl. Nr. 18 vom
25.09.2025, S. 513–531) und „Handlungsanweisung zum Vollzug der Anlage 1 der
KatS-LVO" (LfBK Rheinland-Pfalz, Stand 18. November 2025).
