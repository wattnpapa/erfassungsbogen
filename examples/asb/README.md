# Beispiel-Erfassungsbögen — ASB-Einsatzeinheit

4 Beispielbögen zur vierteiligen Einsatzeinheit, wie sie der
ASB gemeinsam mit den anderen Hilfsorganisationen im Katastrophenschutz
Nordrhein-Westfalens stellt. Zusammen
2/8/23/33.

Quelle: [„Die Einsatzeinheit NRW", DRK-Kreisverband Wuppertal e. V.](https://www.drk-w.de/katastrophenschutz/katastrophenschutz-in-nrw/katastrophenschutz-in-nrw/die-einsatzeinheit-nrw.html) —
beschreibt das landeseinheitliche NRW-Modell, das auch der ASB nutzt (bestätigt
durch die [Sanitätsgruppen-Seite des ASB Niederrhein e. V.](https://www.asb-niederrhein.de/unsere-angebote/katastrophenschutz/sanitaetsgruppe),
die dieselbe Fahrzeug- und Rollenkombination — GWSan 25, KTW4, RTW — für die
eigene Einsatzeinheit beschreibt).

**Anders als die CSV-Rechercheliste** (die für den ASB „Sanitätszug",
„Sanitätsgruppe" und „Rettungsgruppe" mit grober Personenzahl, aber ohne
Einzelrollen nennt) folgen diese Bögen der Gliederung der Quelle: vier
Komponenten der Einsatzeinheit statt dreier Zug-Teileinheiten. Die
Sanitätsgruppe deckt dieselbe Idee ab — Grundmodul plus RTW-Erweiterung, in
einigen Regionalverbänden „Rettungsgruppe" genannt.

Alle Personen, Kontakte und Kfz-Kennzeichen sind **fiktiv**; der
ASB-Kreisverband „Rheindorf e. V." existiert nicht.

Neu erzeugen mit: `npm run beispiele:asb-san` (deterministisch, fester Zufalls-Seed).

| Datei | Komponente | Stärke | Fz | Funkkennung (Sama Rheindorf …) |
|---|---|---|---|---|
| einsatzeinheit-fuehrungskomponente | Führungskomponente (Einsatzeinheit) | 1/1/2/4 | 1 | 41-19-1 |
| einsatzeinheit-sanitaetsgruppe | Sanitätsgruppe (Einsatzeinheit) | 1/3/6/10 | 3 | 41-96-1, 41-92-1, 41-83-1 |
| einsatzeinheit-betreuungskomponente | Betreuungskomponente (Einsatzeinheit) | 0/3/12/15 | 4 | 41-16-1, 41-16-2, 41-16-3, 41-65-1 |
| einsatzeinheit-technikkomponente | Technikkomponente (Einsatzeinheit) | 0/1/3/4 | 1 | 41-64-1 |
