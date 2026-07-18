# Beispiel-Erfassungsbögen — Katastrophenschutz Thüringen

45 generierte Beispiel-Teileinheiten nach der Thüringer
**Katastrophenschutzverordnung** (ThürKatSVO vom 10. November 2020, Anlagen 1
bis 17), wie sie die Broschüre „ThürKatSVO in Schaubildern" (TMIK,
Ausgabe 1/2021) je Einheit als Gliederungsbild wiedergibt.

Abgebildet ist — wie bei Sachsen und Niedersachsen — je kleinster selbstständiger
Teileinheit ein Bogen; die Züge sind in ihre Teileinheiten zerlegt. Die
Schaubilder geben Stärke **und** Fahrzeug je Teileinheit an, die Fahrzeugtypen
sind hier also verordnungsseitig belegt (anders als in Brandenburg).

Alle Personen, Standort-Zuordnungen, Wachennummern und Kennzeichen sind
**fiktiv**.

## Zwei Modellierungsentscheidungen

* **Einheitsführer:** In den Schaubildern steht der Einheitsführer als eigener
  Kasten ohne Fahrzeug. Er ist hier der Führungseinheit bzw. der ersten
  Teileinheit zugeschlagen, statt einen fahrzeuglosen Ein-Personen-Bogen zu
  erzeugen. Jeder betroffene Bogen vermerkt das im Feld „Sonstiges".
* **Mehrfach gleiche Teileinheiten** (vier Transporttrupps im Sanitätszug, drei
  Wasserrettungsstaffeln, zwei Gruppen der Einsatzzüge, zwei Logistikstaffeln,
  zwei Bergrettungsgruppen, zwei Führungsstaffeln des Landes-Führungsstabes)
  ergeben **einen** Bogen. Die Spalte „je Verband" der Tabelle nennt die Zahl im
  Verband; die Summenprüfung rechnet sie entsprechend hoch.

Geprüft wird beim Generieren die Stärke jeder Teileinheit gegen ihr Schaubild
**und** die Summe aller Teileinheiten gegen die Mannschaftsstärke des Verbandes.

## Hinweis zur Führungsstaffel (Anlage 1)

Das Schaubild der **Katastrophenschutz-Führungsstaffel** ist das einzige, das
**keine Fahrzeuge** ausweist. Die beiden Bögen bilden das so ab und führen
deshalb keine Fahrzeuge — das ist kein Fehler der Generierung.

## Hinweis zum Führungsstab des Landes (Anlage 17)

Die Kopfzeile der Anlage 17 gibt die Mannschaftsstärke **10/0/9/19** an. Die
Summe der Kästen ergibt dagegen **9/1/9/19**: Gesamtstärke und Mannschaft
stimmen überein, der Führungsunterstützungstrupp führt in seinem Kasten aber
einen Unterführer (0/1/2/3), den die Kopfzeile als Führer zählt. Die Bögen
folgen den **Kästen**, weil nur diese das Personal den Fahrzeugen zuordnen. Für
alle übrigen Einheiten stimmen Kopfzeile und Summe exakt überein.

## Funkrufnamen

Nach der Funkrufnamenregelung Thüringen (Anlage 10 der funktechnischen und
funkbetrieblichen Richtlinien, Version 1.0 vom 3. Juli 2017, auf Basis der
OPTA-Richtlinie der BDBOS):

> `<Kennwort> <Einsatzbereich> <Wache> <Fahrzeugkennzahl> <laufende Nummer>`
>
> Beispiel der Richtlinie: `Florian Weimar 1 44 1`

* **Kennwort** nach Nr. 2.1. Für den Katastrophenschutz ist das **„Kater"**;
  von Hilfsorganisationen getragene Einheiten führen deren Grundrufnamen —
  DRK „Rotkreuz", ASB „Sama", JUH „Akkon", MHD „Johannes", DLRG „Pelikan",
  dazu „Bergwacht" und „Wasserwacht". Die Fußnote der Richtlinie stellt klar,
  dass KatS-Fahrzeuge nur bei Einsätzen des örtlichen Brandschutzes und der
  Allgemeinen Hilfe „Florian" führen — hier geht es um
  Katastrophenschutzeinsätze, deshalb durchgängig „Kater".
* **Standortkenner** (Nr. 2.2) ist der Einsatzbereich — Landkreis bzw.
  kreisfreie Stadt — mit einer Wachennummer darunter. Die Landeseinheiten an der
  Landesfeuerwehr- und Katastrophenschutzschule führen „Thüringen Schule".
* **Fahrzeugkennzahl** nach dem Kennzahlenplan Nr. 2.3 (u. a. 10 KdoW,
  11 ELW 1/FüKW, 12 ELW 2, 19 MTW, 23 TLF 3000, 24 TLF 4000, 45 LF 20 KatS,
  53 GW-Dekon, 54 GW-G, 56 GW-A/S, 57 GW-Mess, 58 CBRN MLK/ErkKw, 62 SW-KatS,
  65 WLF, 72 RW, 74 GW Berg- und Höhenrettung, 75 GW-W/GW-Tauch, 76 Boote,
  85 KTW, 95 GW San, 96 GW Beh, 97 GW Log, 98 GW Bt).
* **Laufende Nummer** unterscheidet mehrere Fahrzeuge derselben Art.
* **Anhänger und Boote auf Trailern** sind ohne Kfz-Kennzeichen geführt.

Neu erzeugen mit: `npm run beispiele:kats-th` (deterministisch, fester Zufalls-Seed).

| Datei | Einheit | Teileinheit | Ort | Untere KatS-Behörde | Stärke | je Verband | Fz | Quelle |
|---|---|---|---|---|---|---|---|---|
| fuehrungseinheit-suhl | KatS-FüSt | Führungseinheit | Suhl | Stadt Suhl | 2/0/2/4 | 1 | — | Anlage 1 |
| fuehrungsunterstuetzungstrupp-ilmenau | KatS-FüSt | Führungsunterstützungstrupp | Ilmenau | Ilm-Kreis | 2/0/1/3 | 1 | — | Anlage 1 |
| fuehrungseinheit-einsatzzug-retten-sonneberg | KatS-EZ Retten | Führungseinheit Einsatzzug Retten | Sonneberg | Landkreis Sonneberg | 1/1/2/4 | 1 | 1 | Anlage 2 |
| gruppe-einsatzzug-retten-schmoelln | KatS-EZ Retten | Gruppe Einsatzzug Retten | Schmölln | Landkreis Altenburger Land | 0/1/8/9 | 2 | 1 | Anlage 2 |
| staffel-einsatzzug-retten-eisenberg | KatS-EZ Retten | Staffel Einsatzzug Retten | Eisenberg | Saale-Holzland-Kreis | 0/1/4/5 | 1 | 2 | Anlage 2 |
| fuehrungseinheit-sanitaetszug-ruhla | KatS-SanZ | Führungseinheit Sanitätszug | Ruhla | Wartburgkreis | 1/1/2/4 | 1 | 1 | Anlage 3 |
| sanitaetsgruppe-waltershausen | KatS-SanZ | Sanitätsgruppe | Waltershausen | Landkreis Gotha | 3/1/7/11 | 1 | 2 | Anlage 3 |
| transporttrupp-sanitaetszug-saalfeld | KatS-SanZ | Transporttrupp Sanitätszug | Saalfeld | Landkreis Saalfeld-Rudolstadt | 0/1/1/2 | 4 | 1 | Anlage 3 |
| fuehrungseinheit-betreuungszug-jena | KatS-BetrZ | Führungseinheit Betreuungszug | Jena | Stadt Jena | 1/1/2/4 | 1 | 1 | Anlage 4 |
| betreuungsgruppe-arnstadt | KatS-BetrZ | Betreuungsgruppe | Arnstadt | Ilm-Kreis | 0/1/9/10 | 1 | 2 | Anlage 4 |
| verpflegungsstaffel-soemmerda | KatS-BetrZ | Verpflegungsstaffel | Sömmerda | Landkreis Sömmerda | 0/1/5/6 | 1 | 2 | Anlage 4 |
| unterkunftsstaffel-altenburg | KatS-BetrZ | Unterkunftsstaffel | Altenburg | Landkreis Altenburger Land | 0/1/5/6 | 1 | 1 | Anlage 4 |
| betreuungstrupp-psychosoziale-notfallversorgung-nordhausen | KatS-BetrZ | Betreuungstrupp Psychosoziale Notfallversorgung | Nordhausen | Landkreis Nordhausen | 0/1/1/2 | 1 | 1 | Anlage 4 |
| fuehrungseinheit-gefahrgutzug-bad-salzungen | KatS-GGZ | Führungseinheit Gefahrgutzug | Bad Salzungen | Wartburgkreis | 1/1/2/4 | 1 | 1 | Anlage 5 |
| erkundungsgruppe-gefahrgutzug-gotha | KatS-GGZ | Erkundungsgruppe Gefahrgutzug | Gotha | Landkreis Gotha | 0/1/7/8 | 1 | 2 | Anlage 5 |
| gefahrenabwehrstaffel-poessneck | KatS-GGZ | Gefahrenabwehrstaffel | Pößneck | Saale-Orla-Kreis | 0/1/5/6 | 1 | 2 | Anlage 5 |
| dekontaminationsstaffel-einsatzkraefte-gera | KatS-GGZ | Dekontaminationsstaffel Einsatzkräfte | Gera | Stadt Gera | 0/1/5/6 | 1 | 1 | Anlage 5 |
| dekontaminationsstaffel-personen-hildburghausen | KatS-GGZ | Dekontaminationsstaffel Personen | Hildburghausen | Landkreis Hildburghausen | 0/1/5/6 | 1 | 1 | Anlage 5 |
| fuehrungseinheit-einsatzzug-wasser-schmalkalden | KatS-EZ Wasser | Führungseinheit Einsatzzug Wasser | Schmalkalden | Landkreis Schmalkalden-Meiningen | 1/1/2/4 | 1 | 1 | Anlage 6 |
| gruppe-einsatzzug-wasser-eisenach | KatS-EZ Wasser | Gruppe Einsatzzug Wasser | Eisenach | Stadt Eisenach | 0/1/8/9 | 2 | 1 | Anlage 6 |
| staffel-einsatzzug-wasser-artern | KatS-EZ Wasser | Staffel Einsatzzug Wasser | Artern | Kyffhäuserkreis | 0/1/4/5 | 1 | 2 | Anlage 6 |
| fuehrungseinheit-logistikzug-bad-langensalza | KatS-LogZ | Führungseinheit Logistikzug | Bad Langensalza | Unstrut-Hainich-Kreis | 1/0/1/2 | 1 | 1 | Anlage 7 |
| logistikstaffel-leinefelde-worbis | KatS-LogZ | Logistikstaffel | Leinefelde-Worbis | Landkreis Eichsfeld | 0/1/5/6 | 2 | 1 | Anlage 7 |
| logistiktrupp-schleiz | KatS-LogZ | Logistiktrupp | Schleiz | Saale-Orla-Kreis | 0/1/2/3 | 1 | 1 | Anlage 7 |
| fuehrungseinheit-bergrettungszug-erfurt | KatS-BRZ | Führungseinheit Bergrettungszug | Erfurt | Stadt Erfurt | 1/1/2/4 | 1 | 2 | Anlage 8 |
| bergrettungsgruppe-zeulenroda-triebes | KatS-BRZ | Bergrettungsgruppe | Zeulenroda-Triebes | Landkreis Greiz | 0/1/8/9 | 2 | 3 | Anlage 8 |
| fuehrungseinheit-wasserrettungszug-meiningen | KatS-WRZ | Führungseinheit Wasserrettungszug | Meiningen | Landkreis Schmalkalden-Meiningen | 1/1/2/4 | 1 | 1 | Anlage 9 |
| wasserrettungsstaffel-weimar | KatS-WRZ | Wasserrettungsstaffel | Weimar | Stadt Weimar | 0/1/5/6 | 3 | 2 | Anlage 9 |
| taucherstaffel-sondershausen | KatS-WRZ | Taucherstaffel | Sondershausen | Kyffhäuserkreis | 0/1/5/6 | 1 | 2 | Anlage 9 |
| sanitaetsstaffel-behandlungsplatz-muehlhausen | KatS-UE BHP | Sanitätsstaffel Behandlungsplatz | Mühlhausen | Unstrut-Hainich-Kreis | 0/1/5/6 | 1 | 1 | Anlage 10 |
| techniktrupp-behandlungsplatz-heilbad-heiligenstadt | KatS-UE BHP | Techniktrupp Behandlungsplatz | Heilbad Heiligenstadt | Landkreis Eichsfeld | 0/0/3/3 | 1 | 1 | Anlage 10 |
| 1-wassertransporttrupp-hermsdorf | KatS-UE Wassertransport | 1. Wassertransporttrupp | Hermsdorf | Saale-Holzland-Kreis | 0/1/2/3 | 1 | 1 | Anlage 11 |
| 2-wassertransporttrupp-apolda | KatS-UE Wassertransport | 2. Wassertransporttrupp | Apolda | Landkreis Weimarer Land | 0/0/3/3 | 1 | 1 | Anlage 11 |
| dekontaminationsgruppe-erstversorgung-greiz | KatS-UE DekonEV | Dekontaminationsgruppe Erstversorgung | Greiz | Landkreis Greiz | 1/1/7/9 | 1 | 1 | Anlage 12 |
| dekontaminationsstaffel-erstversorgung-rudolstadt | KatS-UE DekonEV | Dekontaminationsstaffel Erstversorgung | Rudolstadt | Landkreis Saalfeld-Rudolstadt | 0/1/5/6 | 1 | 1 | Anlage 12 |
| messleitung-suhl | KatS-UE Messleitung | Messleitung | Suhl | Stadt Suhl | 1/1/2/4 | 1 | 1 | Anlage 13 |
| fuehrungseinheit-fuehrungsgruppe-ilmenau | KatS-FüGr | Führungseinheit Führungsgruppe | Ilmenau | Ilm-Kreis | 4/0/2/6 | 1 | 1 | Anlage 14 |
| fuehrungsunterstuetzungstrupp-fuehrungsgruppe-sonneberg | KatS-FüGr | Führungsunterstützungstrupp Führungsgruppe | Sonneberg | Landkreis Sonneberg | 1/0/2/3 | 1 | 1 | Anlage 14 |
| fuehrungsunterstuetzungstrupp-medizinische-rettung-schmoelln | KatS-UE Führung Med. Rettung | Führungsunterstützungstrupp Medizinische Rettung | Schmölln | Landkreis Altenburger Land | 2/0/1/3 | 1 | 1 | Anlage 15 |
| fuehrungseinheit-rettungshunde-ortungstechnik-eisenberg | KatS-RHOT | Führungseinheit Rettungshunde/Ortungstechnik | Eisenberg | Saale-Holzland-Kreis | 1/1/2/4 | 1 | 1 | Anlage 16 |
| einheit-ortungstechnik-ruhla | KatS-RHOT | Einheit Ortungstechnik | Ruhla | Wartburgkreis | 0/1/2/3 | 1 | 1 | Anlage 16 |
| einheit-rettungshunde-waltershausen | KatS-RHOT | Einheit Rettungshunde | Waltershausen | Landkreis Gotha | 0/1/5/6 | 1 | 1 | Anlage 16 |
| fuehrungseinheit-fuehrungsstab-bad-koestritz | KatS-FüStab | Führungseinheit Führungsstab | Bad Köstritz | Landesfeuerwehr- und Katastrophenschutzschule Thüringen | 1/0/3/4 | 1 | 1 | Anlage 17 |
| fuehrungsstaffel-fuehrungsstab-bad-koestritz | KatS-FüStab | Führungsstaffel Führungsstab | Bad Köstritz | Landesfeuerwehr- und Katastrophenschutzschule Thüringen | 4/0/2/6 | 2 | 1 | Anlage 17 |
| fuehrungsunterstuetzungstrupp-fuehrungsstab-bad-koestritz | KatS-FüStab | Führungsunterstützungstrupp Führungsstab | Bad Köstritz | Landesfeuerwehr- und Katastrophenschutzschule Thüringen | 0/1/2/3 | 1 | 1 | Anlage 17 |
