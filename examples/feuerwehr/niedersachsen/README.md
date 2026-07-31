# Beispiel-Erfassungsbögen — Feuerwehren Niedersachsen (Nds. FwVO)

12 generierte Beispiel-Einheiten nach der **Niedersächsischen
Feuerwehrverordnung** (Nds. FwVO vom 08.04.2025). Abgebildet sind zwei Familien:

- **Taktische Einheiten (§ 2 Abs. 2)** — Selbständiger Trupp, Staffel, Gruppe und
  der Zug in allen drei Varianten, jeweils mit dem zur Besatzung passenden
  Feuerwehrfahrzeug nach Anlage 1. Das ist die Einheit, die ausrückt oder
  überörtliche Hilfe leistet.
- **Arten von Ortsfeuerwehren (§ 1 Abs. 1)** — Grundausstattungs-, Stützpunkt- und
  Schwerpunktfeuerwehr mit der **personellen Mindeststärke nach § 3 Abs. 2**
  (Ortsbrandmeisterin oder Ortsbrandmeister, Stellvertretung, die Funktionen der
  maßgeblichen taktischen Einheit und 100 % Personalreserve) sowie der
  **Mindestausrüstung nach § 4**.

Die Stärkerolle folgt der Stellung in der Einheit, nicht der höchsten Ausbildung:
Führung der Einheit → F, Truppführungen und Teileinheitsführungen im Zug → U,
alle weiteren einsatzspezifischen Funktionen → M.

Alle Personen, die Zuordnung der Einheiten zu Ortsfeuerwehren und die Kennzeichen
sind **fiktiv**; die Ortsfeuerwehren liegen in Gemeinden ohne Berufsfeuerwehr, für
die §§ 1, 3 und 4 gelten. Die Funkrufnamen folgen dem OPTA-Schema Niedersachsen
(RdErl. MI v. 01.03.2024, Nds. MBl. 2024 Nr. 125): „Florian <Landkreis>
<örtl. Kennung>/<Fahrzeugkennung>/<Ordnungskennung>". Die örtlichen Kennungen
(Gemeindekennziffern) sind fiktiv; die Fahrzeugkennungen folgen derselben
Systematik wie in den KatS-Beispielen.

Die Kurzbezeichnungen der Fahrzeuge (LF 10, MLF, StLF 20 …) sind die in der Praxis
gebräuchlichen; der Typ nach Anlage 1 samt Mindestausstattung steht bei jedem
Fahrzeug im Feld „Änderungen bzw. Sondergerät".

Neu erzeugen mit: `npm run beispiele:fw-nds` (deterministisch, fester Zufalls-Seed).

| Datei | Familie | Einheit | Ortsfeuerwehr | Stärke F/U/M/Σ | Fahrzeuge | Fundstelle Nds. FwVO |
|---|---|---|---|---|---|---|
| selbstaendiger-trupp-bookholzberg | Taktische Einheit | Selbständiger Trupp | Bookholzberg (Gemeinde Ganderkesee) | 1/0/2/3 | TLF 2000 | § 2 Abs. 2 Satz 1 Nr. 1, § 4 Abs. 3 Satz 1 Nr. 2 Buchst. a |
| staffel-hemmoor | Taktische Einheit | Staffel | Hemmoor (Stadt Hemmoor) | 1/2/3/6 | MLF | § 2 Abs. 2 Satz 1 Nr. 2, § 4 Abs. 3 Satz 1 Nr. 3 |
| gruppe-sudheim | Taktische Einheit | Gruppe | Sudheim (Stadt Northeim) | 1/3/5/9 | LF 10 | § 2 Abs. 2 Satz 1 Nr. 3, § 4 Abs. 3 Satz 1 Nr. 1 |
| zug-variante-1-zwei-gruppen-hundsmuehlen | Taktische Einheit | Zug (Variante 1: zwei Gruppen) | Hundsmühlen (Gemeinde Wardenburg) | 1/9/12/22 | ELW 1, LF 20, LF 20 | § 2 Abs. 2 Satz 2, § 4 Abs. 4 Satz 1 Nr. 1 |
| zug-variante-2-gruppe-staffel-und-selbstaendiger-trupp-ottensen | Taktische Einheit | Zug (Variante 2: Gruppe, Staffel und Selbständiger Trupp) | Ottensen (Stadt Buxtehude) | 1/9/12/22 | ELW 1, LF 20, StLF 20, DLK 23 | § 2 Abs. 2 Satz 2 Nr. 2 Buchst. b, § 4 Abs. 4 Satz 1 Nr. 2 |
| zug-variante-3-gruppe-und-drei-selbstaendige-trupps-laxten | Taktische Einheit | Zug (Variante 3: Gruppe und drei Selbständige Trupps) | Laxten (Stadt Lingen (Ems)) | 1/8/13/22 | ELW 1, LF 20, TLF 4000, DLK 23, WLF, AB Rüst | § 2 Abs. 2 Satz 2 Nr. 2 Buchst. c, § 4 Abs. 4 Satz 1 Nr. 3 |
| grundausstattungsfeuerwehr-wietzendorf | Ortsfeuerwehr | Grundausstattungsfeuerwehr | Wietzendorf (Gemeinde Wietzendorf) | 2/8/10/20 | TSF | § 1 Abs. 1 Nr. 1, § 3 Abs. 1 Nr. 1 und Abs. 2, § 4 Abs. 2 |
| stuetzpunktfeuerwehr-gruppe-und-selbstaendiger-trupp-ocholt | Ortsfeuerwehr | Stützpunktfeuerwehr (Gruppe und Selbständiger Trupp) | Ocholt (Stadt Westerstede) | 2/10/14/26 | LF 10, RW | § 1 Abs. 1 Nr. 2, § 3 Abs. 1 Nr. 2 Buchst. a und Abs. 2, § 4 Abs. 3 Satz 1 Nr. 1 und 2 Buchst. c |
| stuetzpunktfeuerwehr-zwei-staffeln-versen | Ortsfeuerwehr | Stützpunktfeuerwehr (zwei Staffeln) | Versen (Stadt Meppen) | 2/12/12/26 | MLF, MLF | § 1 Abs. 1 Nr. 2, § 3 Abs. 1 Nr. 2 Buchst. b und Abs. 2, § 4 Abs. 3 Satz 1 Nr. 3 |
| schwerpunktfeuerwehr-zug-variante-1-lenglern | Ortsfeuerwehr | Schwerpunktfeuerwehr (Zug, Variante 1) | Lenglern (Gemeinde Bovenden) | 4/18/24/46 | ELW 1, LF 20, LF 20 | § 1 Abs. 1 Nr. 3, § 3 Abs. 1 Nr. 3 und Abs. 2, § 4 Abs. 4 Satz 1 Nr. 1 |
| schwerpunktfeuerwehr-zug-variante-2-bookholzberg | Ortsfeuerwehr | Schwerpunktfeuerwehr (Zug, Variante 2) | Bookholzberg (Gemeinde Ganderkesee) | 4/18/24/46 | ELW 1, LF 20, GW-L2, RW | § 1 Abs. 1 Nr. 3, § 3 Abs. 1 Nr. 3 und Abs. 2, § 4 Abs. 4 Satz 1 Nr. 2 |
| schwerpunktfeuerwehr-zug-variante-3-hemmoor | Ortsfeuerwehr | Schwerpunktfeuerwehr (Zug, Variante 3) | Hemmoor (Stadt Hemmoor) | 4/16/26/46 | ELW 1, LF 20, TLF 4000, DLK 23, WLF, AB Rüst | § 1 Abs. 1 Nr. 3, § 3 Abs. 1 Nr. 3 und Abs. 2, § 4 Abs. 4 Satz 1 Nr. 3 |
