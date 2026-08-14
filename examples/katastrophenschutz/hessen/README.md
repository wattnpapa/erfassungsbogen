# Beispiel-Erfassungsbögen — Katastrophenschutz Hessen

38 generierte Beispiel-Teileinheiten nach dem Konzept
**„Katastrophenschutz in Hessen"** (Hessisches Ministerium des Innern und für
Sport, Fassung 01.01.2024 — die operativ-taktischen Anlagen sind seit
01.01.2016 unverändert) und seiner **Anlage 2 „Übersicht Einheiten und
Einrichtungen"** (Stand 01.01.2016). Die Katastrophenschutz-Dienstvorschrift
400 (KatSDV 400, Stand 01.04.2012) regelt Führung und Aufgaben, verweist für
Stärke und Gliederung aber ausdrücklich auf dieses Konzept.

Alle Personen, Orte-Zuordnungen und Kennzeichen sind **fiktiv**.

## Warum ein Bogen je Teileinheit — wie Sachsen und Niedersachsen

Anlage 2 beschreibt für jeden Aufgabenbereich eine taktische Gliederung mit
**Personalstärke UND Fahrzeugtyp je kleinster Teileinheit** (Zugtrupp,
Löschgruppe, SEG usw.) — anders als die Brandenburger KatSV, die nur eine
Mindeststärke je GANZER Einheit nennt. Deshalb ist hier je kleinster
selbstständiger Teileinheit ein Bogen erzeugt, nicht ein Bogen je
Zug/Gruppe insgesamt.

## Hinweis zu abweichenden Personenzahlen in den Bildtabellen

Die Bildtabellen der Anlage 2 (2.3–2.24) summieren sich bei mehreren
Aufgabenbereichen — Löschzug, Gefahrstoff-ABC-Zug, Sanitätszug,
Betreuungszug, Wasserrettungszug, Führungsgruppe TEL — **nicht exakt** zur
offiziellen Sollstärke der Übersichtstabelle (Anlage 2.1), die auch gegen
die landesweite Personen-Gesamtkraft geprüft ist. **Bindend für diesen
Generator ist durchgehend Anlage 2.1**: Funktionsbezeichnungen und
Fahrzeugtypen stammen aus den Bildtabellen, die Mannschafts-Kopfzahlen
einzelner Teileinheiten sind dafür so angepasst, dass die Summe je
Aufgabenbereich exakt stimmt — dieselbe Vorgehensweise wie beim
MTF-Befund im Sachsen-README dieses Projekts.

Bei der **Betreuungsstelle 25 (BtSt)** weicht sogar die Sollstärke selbst
zwischen Haupttext (0/1/8/9) und Detailtabelle Anlage 2.19 (0/5/4/9) ab;
hier ist die Detailtabelle verwendet, da nur sie die Einzelfunktionen
auflistet.

Die **Medizinische Task Force** und der **KatS-Stab** sind absichtlich
**nicht** abgebildet: Die MTF ist ein bundeseinheitlich ausgestatteter
Großverband (111 Personen laut Anlage 2.1), der Stab eine reine
Personaleinheit ohne Fahrzeug — beide passen nicht zum Bogenformat „Einheit
mit Fahrzeugen".

## Funkrufnamen

Nach dem hessischen Funkrufnamenkatalog (Sonderschutzplan Bereich 2, Plan
Nr. 2, Version 1.02, 2011):

> `<Kennwort> <Landkreis-Kürzel> <Standortkennzahl>-<Fahrzeugkennzahl>`

Kennwort je Trägerorganisation (Florian, Rotkreuz, Akkon, Johannes, Sama),
Landkreis-Kürzel nach Anlage II (identisch mit den amtlichen
Kfz-Kennzeichen). Die **Fahrzeugkennzahl ist amtlich** nach Anlage I des
Katalogs (z. B. 11 = ELW 1, 45 = LF-KatS, 52 = RW, 96 = GW-San). Die
**Standortkennzahl ist dagegen eine fiktive, fortlaufende Zahl je
Landkreis** — die reale Vergabe folgt einer statistischen
Gemeindekennziffer, die hier nicht rekonstruiert werden konnte. Derselbe
Hinweis steht im Feld „Sonstiges" jedes einzelnen Bogens.

## Träger

Der Feuerwehr sind laut Konzept alle Fachbereiche Brandschutz, Technische
Hilfe, Gefahrstoff-ABC und Führung/IuK zugeordnet; DRK trägt den
Sanitätszug und das Kreisauskunftsbüro, Malteser den Betreuungszug/die
Betreuungsstelle, DLRG die Wasserrettung — eine beispielhafte, plausible
Verteilung, da das Konzept keine feste bundesweite Träger-Zuordnung je
Landkreis vorschreibt.

Neu erzeugen mit: `npm run beispiele:kats-he` (deterministisch, fester
Zufalls-Seed).

| Datei | Aufgabenbereich | Teileinheit | Ort | Landkreis/Stadt | Stärke | Fahrzeuge | Quelle |
|---|---|---|---|---|---|---|---|
| fuehrungsgruppe-tel-heppenheim | Führungsgruppe TEL (FüGrTEL) — 1/4/4/9 | Führungsgruppe TEL | Heppenheim | Kreis Bergstraße | 1/4/4/9 | 1 | Anlage 2.5 |
| iuk-zentrale-iukzt-darmstadt | Informations- und Kommunikationszentrale (IuKZt) — 0/1/5/6 | IuK-Zentrale (IuKZt) | Darmstadt | Stadt Darmstadt | 0/1/5/6 | 0 | Anlage 2.7 |
| elw-2-trupp-gross-gerau | Informations- und Kommunikationsgruppe (IuKGr) — 0/2/7/9 | ELW-2-Trupp | Groß-Gerau | Kreis Groß-Gerau | 0/1/2/3 | 1 | Anlage 2.8 |
| gw-iuk-trupp-frankfurt-am-main | Informations- und Kommunikationsgruppe (IuKGr) — 0/2/7/9 | GW-IuK-Trupp | Frankfurt am Main | Stadt Frankfurt am Main | 0/1/5/6 | 1 | Anlage 2.8 |
| zugtrupp-ztr-bad-homburg | Löschzug (LZ) — 1/4/20/25 | Zugtrupp (ZTr) | Bad Homburg | Hochtaunuskreis | 1/1/2/4 | 1 | Anlage 2.9 |
| 1-loeschgruppe-gelnhausen | Löschzug (LZ) — 1/4/20/25 | 1. Löschgruppe | Gelnhausen | Main-Kinzig-Kreis | 0/1/8/9 | 1 | Anlage 2.9 |
| 2-loeschgruppe-hofheim-am-taunus | Löschzug (LZ) — 1/4/20/25 | 2. Löschgruppe | Hofheim am Taunus | Main-Taunus-Kreis | 0/1/8/9 | 1 | Anlage 2.9 |
| ergaenzungstrupp-ergtr-erbach | Löschzug (LZ) — 1/4/20/25 | Ergänzungstrupp (ErgTr) | Erbach | Odenwaldkreis | 0/1/2/3 | 1 | Anlage 2.9 |
| zugtrupp-ztr-offenbach-am-main | Gefahrstoff-ABC-Zug (GABCZ) — 1/5/16/22 | Zugtrupp (ZTr) | Offenbach am Main | Stadt Offenbach am Main | 1/1/2/4 | 1 | Anlage 2.13 |
| gefahrstoffgruppe-gefgr-bad-schwalbach | Gefahrstoff-ABC-Zug (GABCZ) — 1/5/16/22 | Gefahrstoffgruppe (GefGr) | Bad Schwalbach | Rheingau-Taunus-Kreis | 0/2/7/9 | 1 | Anlage 2.13 |
| geraetegruppe-trupp-1-wiesbaden | Gefahrstoff-ABC-Zug (GABCZ) — 1/5/16/22 | Gerätegruppe, Trupp 1 | Wiesbaden | Stadt Wiesbaden | 0/1/3/4 | 1 | Anlage 2.13 |
| geraetegruppe-trupp-2-friedberg-hessen | Gefahrstoff-ABC-Zug (GABCZ) — 1/5/16/22 | Gerätegruppe, Trupp 2 | Friedberg (Hessen) | Wetteraukreis | 0/1/4/5 | 1 | Anlage 2.13 |
| zugtrupp-ztr-giessen | Gefahrstoff-Dekontaminations-Zug (GDekonZ) — 1/4/17/22 | Zugtrupp (ZTr) | Gießen | Kreis Gießen | 1/1/2/4 | 1 | Anlage 2.14 |
| logistikgruppe-loggr-wetzlar | Gefahrstoff-Dekontaminations-Zug (GDekonZ) — 1/4/17/22 | Logistikgruppe (LogGr) | Wetzlar | Lahn-Dill-Kreis | 0/1/8/9 | 1 | Anlage 2.14 |
| dekontaminationsgruppe-trupp-1-limburg-an-der-lahn | Gefahrstoff-Dekontaminations-Zug (GDekonZ) — 1/4/17/22 | Dekontaminationsgruppe, Trupp 1 | Limburg an der Lahn | Kreis Limburg-Weilburg | 0/1/4/5 | 1 | Anlage 2.14 |
| dekontaminationsgruppe-trupp-2-marburg | Gefahrstoff-Dekontaminations-Zug (GDekonZ) — 1/4/17/22 | Dekontaminationsgruppe, Trupp 2 | Marburg | Kreis Marburg-Biedenkopf | 0/1/3/4 | 1 | Anlage 2.14 |
| messzentrale-gabcmzt-lauterbach-hessen | GABC-Messzentrale (GABCMZt) — 0/1/5/6 | Messzentrale (GABCMZt) | Lauterbach (Hessen) | Vogelsbergkreis | 0/1/5/6 | 1 | Anlage 2.10 |
| abc-erkundungstrupp-fulda | GABC-Mess-Gruppe (GABCMGr) — 0/2/6/8 | ABC-Erkundungstrupp | Fulda | Kreis Fulda | 0/1/4/5 | 1 | Anlage 2.12 |
| strahlenspuertrupp-bad-hersfeld | GABC-Mess-Gruppe (GABCMGr) — 0/2/6/8 | Strahlenspürtrupp | Bad Hersfeld | Kreis Hersfeld-Rotenburg | 0/1/2/3 | 1 | Anlage 2.12 |
| zugtrupp-ztr-kassel | Sanitätszug (SanZ) — 1/8/16/25 | Zugtrupp (ZTr) | Kassel | Stadt Kassel | 1/1/2/4 | 1 | Anlage 2.16 |
| behandlungsgruppe-homberg-efze | Sanitätszug (SanZ) — 1/8/16/25 | Behandlungsgruppe | Homberg (Efze) | Schwalm-Eder-Kreis | 0/4/8/12 | 2 | Anlage 2.16 |
| transportgruppe-korbach | Sanitätszug (SanZ) — 1/8/16/25 | Transportgruppe | Korbach | Kreis Waldeck-Frankenberg | 0/3/6/9 | 3 | Anlage 2.16 |
| zugtrupp-ztr-eschwege | Betreuungszug (BtZ) — 1/8/16/25 | Zugtrupp (ZTr) | Eschwege | Werra-Meißner-Kreis | 1/1/2/4 | 1 | Anlage 2.18 |
| seg-betreuung-heppenheim | Betreuungszug (BtZ) — 1/8/16/25 | SEG Betreuung | Heppenheim | Kreis Bergstraße | 0/4/8/12 | 2 | Anlage 2.18 |
| betreuungsgruppe-darmstadt | Betreuungszug (BtZ) — 1/8/16/25 | Betreuungsgruppe | Darmstadt | Stadt Darmstadt | 0/3/6/9 | 2 | Anlage 2.18 |
| betreuungsstelle-25-btst-gross-gerau | Betreuungsstelle 25 (BtSt) — 0/5/4/9 | Betreuungsstelle 25 (BtSt) | Groß-Gerau | Kreis Groß-Gerau | 0/5/4/9 | 1 | Anlage 2.19 |
| fuehrung-frankfurt-am-main | Kreisauskunftsbüro (KAB) — 1/5/18/24 | Führung | Frankfurt am Main | Stadt Frankfurt am Main | 1/1/2/4 | 1 | Anlage 2.20 |
| aufnahme-bad-homburg | Kreisauskunftsbüro (KAB) — 1/5/18/24 | Aufnahme | Bad Homburg | Hochtaunuskreis | 0/1/5/6 | 1 | Anlage 2.20 |
| verarbeitung-gelnhausen | Kreisauskunftsbüro (KAB) — 1/5/18/24 | Verarbeitung | Gelnhausen | Main-Kinzig-Kreis | 0/1/3/4 | 1 | Anlage 2.20 |
| erfassung-hofheim-am-taunus | Kreisauskunftsbüro (KAB) — 1/5/18/24 | Erfassung | Hofheim am Taunus | Main-Taunus-Kreis | 0/1/5/6 | 1 | Anlage 2.20 |
| auskunft-erbach | Kreisauskunftsbüro (KAB) — 1/5/18/24 | Auskunft | Erbach | Odenwaldkreis | 0/1/3/4 | 1 | Anlage 2.20 |
| zugtrupp-ztr-offenbach-am-main | Wasserrettungszug (WRZ) — 1/5/19/25 | Zugtrupp (ZTr) | Offenbach am Main | Stadt Offenbach am Main | 1/1/2/4 | 1 | Anlage 2.21 |
| seg-wasserrettung-trupp-1-bad-schwalbach | Wasserrettungszug (WRZ) — 1/5/19/25 | SEG Wasserrettung, Trupp 1 | Bad Schwalbach | Rheingau-Taunus-Kreis | 0/1/5/6 | 1 | Anlage 2.21 |
| seg-wasserrettung-trupp-2-wiesbaden | Wasserrettungszug (WRZ) — 1/5/19/25 | SEG Wasserrettung, Trupp 2 | Wiesbaden | Stadt Wiesbaden | 0/1/5/6 | 1 | Anlage 2.21 |
| taucher-trupp-friedberg-hessen | Wasserrettungszug (WRZ) — 1/5/19/25 | Taucher-Trupp | Friedberg (Hessen) | Wetteraukreis | 0/2/7/9 | 1 | Anlage 2.21 |
| gw-taucher-trupp-giessen | Erweiterte Wasserrettungsgruppe (EWRGr) — 0/2/10/12 | GW-Taucher-Trupp | Gießen | Kreis Gießen | 0/1/5/6 | 1 | Anlage 2.21 |
| mtw-stroemungsrettertrupp-wetzlar | Erweiterte Wasserrettungsgruppe (EWRGr) — 0/2/10/12 | MTW-Strömungsrettertrupp | Wetzlar | Lahn-Dill-Kreis | 0/1/5/6 | 1 | Anlage 2.21 |
| technische-hilfeleistungs-einheit-the-limburg-an-der-lahn | Technische Hilfeleistungs-Einheit (THE) — 0/1/2/3 | Technische Hilfeleistungs-Einheit (THE) | Limburg an der Lahn | Kreis Limburg-Weilburg | 0/1/2/3 | 1 | Anlage 2.22 |
