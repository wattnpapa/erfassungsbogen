# Beispiel-Erfassungsbögen — Katastrophenschutz Berlin

18 generierte Beispiel-Teileinheiten nach der Berliner
**Verordnung über den Katastrophenschutzdienst** (KatSD-VO vom 20. Dezember
2001, GVBl. Nr. 1/2002 S. 1, zuletzt geändert durch Verordnung vom 07.11.2011,
GVBl. S. 532) und ihrer **Anlage zu § 8** „Gesamtstärke der Einheiten des
Katastrophenschutzdienstes".

Alle Personen, Bezirks-Zuordnungen, Wachennummern und Kennzeichen sind
**fiktiv**.

## Warum die Anlage anders aufgebaut ist als in anderen Bundesländern

Berlin ist kreisfrei und kennt keine Landkreis-Stückzahlen. Die Anlage listet
je Fachdienst (ABC-Dienst, Betreuungsdienst, Brandschutzdienst, Sanitätsdienst)
stattdessen eine **landesweite Gesamtzahl an Fahrzeugen je Teileinheiten-Typ**
sowie die daraus resultierende Helferstärke bei **doppelter Besetzung**. Für
den Betreuungsdienst gilt das für **sieben Betreuungsplätze 500 (BTP 500)**,
für den Sanitätsdienst für **sieben Behandlungsplätze 25 (BHP 25)** und die
zugehörigen **sieben Patiententransportzüge 10 (PTZ 10)**, für den
Brandschutzdienst für die Feuerwehr-Bereitschaften der Freiwilligen
Feuerwehren.

Jeder Bogen bildet **eine Instanz einer Teileinheit mit einfacher Besetzung**
ab (eine Besatzung), nicht die doppelte Besetzung der Anlage. Die
Selbstprüfung rechnet das Personal jedes Bogens auf die landesweite
Instanzenzahl hoch (**× 2 × Instanzen**, Spalte „Instanzen") und vergleicht
mit der Spalte „Helfer (Anlage, doppelt)"; ebenso werden die Fachdienst-Summen
und die „Insgesamt"-Zeile der Anlage (267 Fahrzeuge / 2.392 Helfer) geprüft.

## Träger

§ 2 Absatz 1 KatSG Berlin nennt als Träger die Berliner Feuerwehr, die
Berliner Polizei sowie anerkannte private Hilfsorganisationen. Die
KatSD-VO-Anlage weist einen Träger nur für den **Brandschutzdienst**
ausdrücklich aus (Fußnote 2: „Die Fahrzeuge sind den Freiwilligen Feuerwehren
zugeordnet" — deckungsgleich mit der BBK-Meldung von 2023 über zehn
KatS-Fahrzeuge für die Berliner Freiwilligen Feuerwehren).

Für ABC-Dienst, Betreuungsdienst und Sanitätsdienst nennt die Verordnung
**keinen Träger je Teileinheit**. Hier redaktionell gewählt:

* **ABC-Dienst**: Regieeinheit der Berliner Feuerwehr.
* **Sanitätsdienst** (BHP 25 / PTZ 10): **DRK** — die einzige mit dieser
  Quellenlage belegbare Trägerschaft (der DRK-Kreisverband Berlin-Nordost
  betreibt nachweislich einen Behandlungsplatz 25).
* **Betreuungsdienst**: über ASB, DRK, JUH und MHD gestreut, um die Bandbreite
  der mitwirkenden Hilfsorganisationen zu zeigen.

Das ist eine **redaktionelle Annahme, keine Verordnungsvorgabe** — vermerkt im
Feld „Sonstiges" jedes einzelnen Bogens.

## Funkrufnamen

Berlin führt — anders als die übrigen bisher abgebildeten Länder — **keine
OPTA-Kennzahlen**. Der Funkkennziffernvergleich der Bundesländer
(fwthwrd.wordpress.com, Stand 2020/2023) nennt für Berlin durchgängig:

> „Klartextbezeichnung des Fahrzeugs gefolgt von Wachennummer"

Das App-Datenmodell verlangt für jeden Funkrufnamen ein Kennwort und
numerische Teilkennzahlen; eine reine Klartext-Kennung lässt sich darin nicht
verlustfrei abbilden. Genähert wird daher mit

> `<Kennwort der Trägerorganisation> <Bezirk> <Wachennummer>[/<laufende Nummer>]`

Der Fahrzeugtyp steht ohnehin im Klartext im Feld „Typ" jedes Fahrzeugs auf
dem Bogen (Spalte „Änderungen bzw. Sondergerät"). Die Wachennummern sind
vierstellig fiktiv, angelehnt an das reale Nummernschema der Berliner
Feuerwehr (Bezirk mal 100, z. B. „12xx" für Friedrichshain-Kreuzberg). Kennwort
je Trägerorganisation: Feuerwehr „Florian", DRK „Rotkreuz", ASB „Sama", JUH
„Akkon", MHD „Johannes".

Neu erzeugen mit: `npm run beispiele:kats-be` (deterministisch, fester
Zufalls-Seed).

| Datei | Fachdienst | Verband | Bezirk | Stärke (einfach) | Instanzen | Fz (Anlage) | Helfer (Anlage, doppelt) |
|---|---|---|---|---|---|---|---|
| abc-dienst-messleitfahrzeug-abc-dienst-landesweit | ABC-Dienst | ABC-Dienst (landesweit) | Mitte | 1/0/3/4 | 3 | 3 | 24 |
| abc-dienst-erkundungs-trupp-abc-dienst-landesweit | ABC-Dienst | ABC-Dienst (landesweit) | Friedrichshain-Kreuzberg | 0/1/3/4 | 14 | 14 | 112 |
| abc-dienst-dekonp-gruppe-abc-dienst-landesweit | ABC-Dienst | ABC-Dienst (landesweit) | Pankow | 0/1/5/6 | 9 | 9 | 108 |
| abc-dienst-dekong-gruppe-abc-dienst-landesweit | ABC-Dienst | ABC-Dienst (landesweit) | Charlottenburg-Wilmersdorf | 0/1/5/6 | 1 | 1 | 12 |
| betreuungsdienst-fuehrungs-trupp-betreuungsplatz-500-btp-500 | Betreuungsdienst | Betreuungsplatz 500 (BTP 500) | Spandau | 1/1/4/6 | 7 | 7 | 84 |
| betreuungsdienst-logistik-gruppe-betreuungsplatz-500-btp-500 | Betreuungsdienst | Betreuungsplatz 500 (BTP 500) | Steglitz-Zehlendorf | 0/0/3/3 | 7 | 7 | 42 |
| betreuungsdienst-betreuungs-gruppe-betreuungsplatz-500-btp-500 | Betreuungsdienst | Betreuungsplatz 500 (BTP 500) | Tempelhof-Schöneberg | 0/1/5/6 | 14 | 14 | 168 |
| betreuungsdienst-verpflegungs-gruppe-betreuungsplatz-500-btp-500 | Betreuungsdienst | Betreuungsplatz 500 (BTP 500) | Neukölln | 0/1/8/9 | 14 | 28 | 252 |
| betreuungsdienst-transportgruppe-betreuungsplatz-500-btp-500 | Betreuungsdienst | Betreuungsplatz 500 (BTP 500) | Treptow-Köpenick | 0/0/2/2 | 14 | 14 | 56 |
| brandschutzdienst-loeschgruppe-feuerwehr-bereitschaft-fwb | Brandschutzdienst | Feuerwehr-Bereitschaft (FwB) | Marzahn-Hellersdorf | 0/1/5/6 | 60 | 60 | 720 |
| brandschutzdienst-schlauchtrupp-feuerwehr-bereitschaft-fwb | Brandschutzdienst | Feuerwehr-Bereitschaft (FwB) | Lichtenberg | 0/1/2/3 | 12 | 12 | 72 |
| sanitaetsdienst-fuehrungs-trupp-behandlungsplatz-25-bhp-25 | Sanitätsdienst | Behandlungsplatz 25 (BHP 25) | Reinickendorf | 1/1/2/4 | 7 | 7 | 56 |
| sanitaetsdienst-logistik-trupp-behandlungsplatz-25-bhp-25 | Sanitätsdienst | Behandlungsplatz 25 (BHP 25) | Mitte | 0/1/1/2 | 7 | 7 | 28 |
| sanitaetsdienst-sanitaets-gruppe-behandlungsplatz-25-bhp-25 | Sanitätsdienst | Behandlungsplatz 25 (BHP 25) | Friedrichshain-Kreuzberg | 0/1/5/6 | 21 | 21 | 252 |
| sanitaetsdienst-betreuungsgruppe-behandlungsplatz-25-bhp-25 | Sanitätsdienst | Behandlungsplatz 25 (BHP 25) | Pankow | 0/1/5/6 | 14 | 14 | 168 |
| sanitaetsdienst-gruppe-technik-und-sicherheit-behandlungsplatz-25-bhp-25 | Sanitätsdienst | Behandlungsplatz 25 (BHP 25) | Charlottenburg-Wilmersdorf | 0/1/3/4 | 7 | 7 | 56 |
| sanitaetsdienst-fuehrungs-trupp-patiententransportzug-10-ptz-10 | Sanitätsdienst | Patiententransportzug 10 (PTZ 10) | Spandau | 1/1/1/3 | 7 | 7 | 42 |
| sanitaetsdienst-verletztentransport-trupp-patiententransportzug-10-ptz-10 | Sanitätsdienst | Patiententransportzug 10 (PTZ 10) | Steglitz-Zehlendorf | 0/1/1/2 | 35 | 35 | 140 |

Quelle: KatSD-VO Berlin, Anlage zu § 8.
