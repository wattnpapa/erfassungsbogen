# Beispiel-Erfassungsbögen — Katastrophenschutz Sachsen

33 generierte Beispiel-Einheiten nach der Sächsischen
Katastrophenschutzverordnung (SächsKatSVO, Anlagen 1–10) und der VwV
KatS-Einheiten. Abgebildet ist je kleinster selbstständiger Teileinheit ein
Bogen; die Züge, die Medizinische Task Force und die Schnell-Einsatz-Gruppe sind
in ihre Teileinheiten zerlegt.

Die Stärkeangaben der SächsKatSVO lauten „ZFü/GrFü/Mannschaft/Gesamt" (bei
Führungsgruppen und MTF zusätzlich mit Verbandsführer) und bilden exakt die
Führer/Unterführer/Mannschaft-Systematik des Bogens ab; Notärzte führt die
Verordnung in der ZFü-Spalte, sie zählen hier deshalb als Führer. Die in der
Verordnung in Klammern angegebene **Doppelbesetzung** (Ablösung) ist nicht
abgebildet — die Bögen zeigen die einfache Sollstärke. Jede erzeugte Stärke wird
beim Generieren gegen die Verordnung geprüft.

Alle Personen, Standort-Zuordnungen und Kennzeichen sind **fiktiv**.

Die **Funkrufnamen** folgen der Funkrufnamen-Richtlinie des SMI vom 2. September
1998, ergänzt durch die Erlasse vom 14. Juni 2012 (Anpassung an neue
Feuerwehrfahrzeugnormen und Katastrophenschutzeinheiten — mit einer
Beispiel-Anlage je KatS-Einheit) und vom 30. Juli 2020 (LF-KatS = 45, RW = 52):

> `<Kennwort> <Ort> <erste>/<zweite>/<dritte> Teilkennzahl`

* **Kennwort** nach Nr. 4.1 je Trägerorganisation — Feuerwehr „Florian", DRK
  „Rotkreuz", JUH „Akkon", MHD „Johannes", ASB „Sama", DLRG „Pelikan", dazu
  „Bergwacht" für die Bergrettung und „Antonius" für Rettungshundestaffeln, die
  keiner Hilfsorganisation angehören.
* **Orts-/Bereichsbezeichnung** ist bei Fahrzeugen der Standort (Gemeinde); die
  Landkreisbezeichnung mit dem Kennwort „Kater" gilt nur für die
  funktionsbezogenen Kennungen der Zug- und Verbandsführer (Nr. 4.4) und ist
  hier nicht abgebildet.
* **Erste Teilkennzahl** (Nr. 4.3.1): erste Ziffer = Fachdienst der betreibenden
  Organisation (1 Brandschutz, 4 Sanitätswesen, 7 Wasserrettung), zweite Ziffer =
  Einheit/Standort (hier durchgängig 1).
* **Zweite Teilkennzahl** (Nr. 4.3.2) = Fahrzeugtyp, **dritte Teilkennzahl**
  (Nr. 4.3.3) = laufende Nummer; die „1" wird auch bei nur einem Fahrzeug
  geführt. Anhänger (Feldkochherd, Kühl- und Schlauchanhänger) führen keinen
  Funkrufnamen.

Weil die Träger der Beispiel-Anlage 2012 entnommen sind, sind die Einheiten
**trägergemischt**: ein Einsatzzug verteilt sich etwa auf JUH (Führungstrupp),
DRK (Sanitätsgruppe), ASB (Transportstaffel) und MHD (Betreuungsgruppe).

## Hinweis zur Medizinischen Task Force

Die Kopfzeile der Anlage 3 gibt für die MTF die Mannschaftsstärke
**2/11/17/80/110** an (VFü/ZFü/GrFü/Mannschaft/Gesamt). Die Summe der
Besetzungsspalten der zugehörigen Tabellenzeilen ergibt dagegen
**2/11/11/86/110**: Verbandsführer, Zugführer und Gesamtstärke stimmen überein,
die Aufteilung zwischen Gruppenführern (11 statt 17) und Mannschaft (86 statt 80)
weicht um sechs Personen ab. Die Bögen folgen den **Tabellenzeilen**, weil nur
diese die Zuordnung zu den einzelnen Fahrzeugen und damit zu den Teileinheiten
festlegen. Für die übrigen Einheiten — auch den Einsatzzug (2/4/26/32) — stimmen
Kopfzeile und Tabellensumme exakt überein.

Neu erzeugen mit: `npm run beispiele:kats-sn` (deterministisch, fester Zufalls-Seed).

| Datei | Fachdienst | Verband | Teileinheit | Ort | Untere KatS-Behörde | Stärke | Fz | Quelle |
|---|---|---|---|---|---|---|---|---|
| fuehrungstrupp-gefahrgutzug-dresden | ABC-Gefahrenabwehr | Gefahrgutzug (KatS-GGZ) | Führungstrupp Gefahrgutzug | Dresden | Landeshauptstadt Dresden | 1/1/2/4 | 1 | SächsKatSVO Anlage 1 |
| loeschgruppe-gefahrgutzug-grimma | ABC-Gefahrenabwehr | Gefahrgutzug (KatS-GGZ) | Löschgruppe Gefahrgutzug | Grimma | Landkreis Leipzig | 0/1/8/9 | 1 | SächsKatSVO Anlage 1 |
| dekontaminationsstaffel-eilenburg | ABC-Gefahrenabwehr | Gefahrgutzug (KatS-GGZ) | Dekontaminationsstaffel | Eilenburg | Landkreis Nordsachsen | 0/1/5/6 | 1 | SächsKatSVO Anlage 1 |
| geraetetrupp-gefahrgut-werdau | ABC-Gefahrenabwehr | Gefahrgutzug (KatS-GGZ) | Gerätetrupp Gefahrgut | Werdau | Landkreis Zwickau | 0/1/2/3 | 1 | SächsKatSVO Anlage 1 |
| fuehrungstrupp-abc-erkundungszug-stollberg | ABC-Gefahrenabwehr | ABC-Erkundungszug (KatS-ABC-ErkZ) | Führungstrupp ABC-Erkundungszug | Stollberg | Erzgebirgskreis | 1/1/2/4 | 1 | SächsKatSVO Anlage 1 |
| mess-und-erkundungstrupp-grossenhain | ABC-Gefahrenabwehr | ABC-Erkundungszug (KatS-ABC-ErkZ) | Mess- und Erkundungstrupp | Großenhain | Landkreis Meißen | 0/1/3/4 | 1 | SächsKatSVO Anlage 1 |
| fuehrungstrupp-loeschzug-retten-dippoldiswalde | Brandschutz | Löschzug Retten (KatS-LZR) | Führungstrupp Löschzug Retten | Dippoldiswalde | Landkreis Sächsische Schweiz-Osterzgebirge | 1/1/2/4 | 1 | SächsKatSVO Anlage 2 |
| loeschgruppe-loeschzug-retten-kamenz | Brandschutz | Löschzug Retten (KatS-LZR) | Löschgruppe Löschzug Retten | Kamenz | Landkreis Bautzen | 0/1/8/9 | 1 | SächsKatSVO Anlage 2 |
| ruesttrupp-weisswasser | Brandschutz | Löschzug Retten (KatS-LZR) | Rüsttrupp | Weißwasser | Landkreis Görlitz | 0/1/2/3 | 1 | SächsKatSVO Anlage 2 |
| fuehrungstrupp-loeschzug-wasserversorgung-hainichen | Brandschutz | Löschzug Wasserversorgung (KatS-LZW) | Führungstrupp Löschzug Wasserversorgung | Hainichen | Landkreis Mittelsachsen | 1/1/2/4 | 1 | SächsKatSVO Anlage 2 |
| loeschgruppe-loeschzug-wasserversorgung-reichenbach | Brandschutz | Löschzug Wasserversorgung (KatS-LZW) | Löschgruppe Löschzug Wasserversorgung | Reichenbach | Vogtlandkreis | 0/1/8/9 | 1 | SächsKatSVO Anlage 2 |
| schlauchtrupp-annaberg-buchholz | Brandschutz | Löschzug Wasserversorgung (KatS-LZW) | Schlauchtrupp | Annaberg-Buchholz | Erzgebirgskreis | 0/1/2/3 | 2 | SächsKatSVO Anlage 2 |
| fuehrungstrupp-loeschzug-waldbrand-wurzen | Brandschutz | Löschzug Waldbrand (KatS-LZWb) | Führungstrupp Löschzug Waldbrand | Wurzen | Landkreis Leipzig | 1/1/2/4 | 1 | SächsKatSVO Anlage 2 |
| loeschtrupp-waldbrand-delitzsch | Brandschutz | Löschzug Waldbrand (KatS-LZWb) | Löschtrupp Waldbrand | Delitzsch | Landkreis Nordsachsen | 0/1/2/3 | 1 | SächsKatSVO Anlage 2 |
| fuehrungstrupp-einsatzzug-hohenstein-ernstthal | Sanitätswesen und Betreuung | Einsatzzug (KatS-EZ) | Führungstrupp Einsatzzug | Hohenstein-Ernstthal | Landkreis Zwickau | 1/1/1/3 | 1 | SächsKatSVO Anlage 3 |
| sanitaetsgruppe-einsatzzug-goerlitz | Sanitätswesen und Betreuung | Einsatzzug (KatS-EZ) | Sanitätsgruppe Einsatzzug | Görlitz | Landkreis Görlitz | 1/1/7/9 | 2 | SächsKatSVO Anlage 3 |
| transportstaffel-einsatzzug-freiberg | Sanitätswesen und Betreuung | Einsatzzug (KatS-EZ) | Transportstaffel Einsatzzug | Freiberg | Landkreis Mittelsachsen | 0/1/5/6 | 3 | SächsKatSVO Anlage 3 |
| betreuungsgruppe-einsatzzug-sebnitz | Sanitätswesen und Betreuung | Einsatzzug (KatS-EZ) | Betreuungsgruppe Einsatzzug | Sebnitz | Landkreis Sächsische Schweiz-Osterzgebirge | 0/1/10/11 | 2 | SächsKatSVO Anlage 3 |
| verpflegungstrupp-einsatzzug-bischofswerda | Sanitätswesen und Betreuung | Einsatzzug (KatS-EZ) | Verpflegungstrupp Einsatzzug | Bischofswerda | Landkreis Bautzen | 0/0/3/3 | 3 | SächsKatSVO Anlage 3 |
| fuehrungsstaffel-mtf-leipzig | Medizinische Task Force | Medizinische Task Force (MTF) | Führungsstaffel MTF | Leipzig | Stadt Leipzig | 3/2/1/6 | 1 | SächsKatSVO Anlage 3 |
| behandlungszug-1-mtf-torgau | Medizinische Task Force | Medizinische Task Force (MTF) | Behandlungszug 1 MTF | Torgau | Landkreis Nordsachsen | 4/3/22/29 | 5 | SächsKatSVO Anlage 3 |
| behandlungszug-2-mtf-zwickau | Medizinische Task Force | Medizinische Task Force (MTF) | Behandlungszug 2 MTF | Zwickau | Landkreis Zwickau | 4/3/26/33 | 5 | SächsKatSVO Anlage 3 |
| zug-dekontamination-verletzter-mtf-aue-bad-schlema | Medizinische Task Force | Medizinische Task Force (MTF) | Zug Dekontamination Verletzter MTF | Aue-Bad Schlema | Erzgebirgskreis | 1/3/20/24 | 3 | SächsKatSVO Anlage 3 |
| logistik-und-transportzug-mtf-meissen | Medizinische Task Force | Medizinische Task Force (MTF) | Logistik- und Transportzug MTF | Meißen | Landkreis Meißen | 1/0/17/18 | 10 | SächsKatSVO Anlage 3 |
| wasserrettungstrupp-pirna | Wasserrettung | Wasserrettungsgruppe (KatS-WRGr) | Wasserrettungstrupp | Pirna | Landkreis Sächsische Schweiz-Osterzgebirge | 0/1/4/5 | 2 | SächsKatSVO Anlage 4 |
| taucheinsatztrupp-bautzen | Wasserrettung | Wasserrettungsgruppe (KatS-WRGr) | Taucheinsatztrupp | Bautzen | Landkreis Bautzen | 0/1/4/5 | 2 | SächsKatSVO Anlage 4 |
| bergrettungsgruppe-zittau | Bergrettung | Bergrettungsgruppe (KatS-BergRGr) | Bergrettungsgruppe | Zittau | Landkreis Görlitz | 0/1/7/8 | 1 | SächsKatSVO Anlage 5 |
| rettungshundestaffel-doebeln | Rettungshunde | Rettungshundestaffel (KatS-RettHundSt) | Rettungshundestaffel | Döbeln | Landkreis Mittelsachsen | 0/1/5/6 | 1 | SächsKatSVO Anlage 6 |
| fuehrungsgruppe-brandschutz-plauen | Führung | Führungsgruppe Brandschutz (FüGr BS) | Führungsgruppe Brandschutz | Plauen | Vogtlandkreis | 3/0/1/4 | 1 | SächsKatSVO Anlage 7 |
| fuehrungsgruppe-sanitaetswesen-und-betreuung-chemnitz | Führung | Führungsgruppe Sanitätswesen und Betreuung (FüGr San/Bt) | Führungsgruppe Sanitätswesen und Betreuung | Chemnitz | Stadt Chemnitz | 3/0/1/4 | 1 | SächsKatSVO Anlage 8 |
| funktrupp-borna | Führung | Funktrupp (FuTr) | Funktrupp | Borna | Landkreis Leipzig | 0/1/1/2 | 1 | SächsKatSVO Anlage 9 |
| sanitaetsstaffel-seg-oschatz | Schnell-Einsatz-Gruppe | Schnell-Einsatz-Gruppe (SEG) | Sanitätsstaffel SEG | Oschatz | Landkreis Nordsachsen | 1/1/4/6 | 1 | SächsKatSVO Anlage 10 |
| sanitaetstransportstaffel-seg-glauchau | Schnell-Einsatz-Gruppe | Schnell-Einsatz-Gruppe (SEG) | Sanitätstransportstaffel SEG | Glauchau | Landkreis Zwickau | 0/0/6/6 | 3 | SächsKatSVO Anlage 10 |
