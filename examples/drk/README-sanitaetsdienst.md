# Beispiel-Erfassungsbögen — DRK-Sanitätsdienst (SEG San, BHP 25)

8 Beispielbögen zu zwei bundesweit gebräuchlichen
DRK-Sanitätsdienstformationen: der Schnelleinsatzgruppe Sanität (SEG San) und
den sieben Teileinheiten des Behandlungsplatzes 25 (BHP 25). Zusammen
7/7/33/47.

Quelle: „DRK Dienstvorschrift 400, Ausgabe Saarland (DRK DV 400 SAL) — Der
Sanitätseinsatz" und „Der Behandlungsplatz 25 (BHP 25 SAL)", DRK-Landesverband
Saarland e. V. Beide Formationen gehören zur multifunktionalen
„Einsatzeinheit" nach DRK-Dienstvorschrift 400, die bundesweit denselben
Grundaufbau hat — die konkreten Stärkezahlen sind aber Landesverbandssache,
hier also die Saarland-Ausprägung.

**Nicht abgebildet:** Sanitätszug, Betreuungszug und Betreuungsstelle. Sie
sind strukturell dieselbe multifunktionale Einsatzeinheit (Zugtrupp,
Sanitätsgruppe, Betreuungsgruppe, Trupp Technik und Sicherheit), die
examples/drk/niedersachsen/ (siehe README dort) bereits mit vollständigen
Funktionslisten als komplette DRK-Bereitschaft abdeckt.

**Fahrzeuge sind modelliert:** Die Quelle nennt für den BHP 25 mehrere
Umsetzungsmöglichkeiten (ein GWRett, ein BHP-25-Anhänger oder mehrere
BHP-10-Module), ohne sich auf Fahrzeugtypen je Teileinheit festzulegen. Hier
ist die modulare Variante mit je einem Fahrzeug je Teileinheit angenommen.

Alle Personen, Kontakte und Kfz-Kennzeichen sind **fiktiv**; der
DRK-Kreisverband „Buchenrode e. V." existiert nicht.

Neu erzeugen mit: `npm run beispiele:drk-san` (deterministisch, fester Zufalls-Seed).

| Datei | Teileinheit | Stärke | Fz | Funkkennung (Rotkreuz Buchenrode …) |
|---|---|---|---|---|
| seg-sanitaet | Schnelleinsatzgruppe Sanität (SEG San) | 1/1/8/10 | 2 | 55-96-1, 55-17-1 |
| bhp25-fuehrungstrupp | Führungstrupp (BHP 25) | 2/1/1/4 | 1 | 55-10-1 |
| bhp25-sichtung-triage | Sichtung und Registrierung (BHP 25) | 2/1/2/5 | 1 | 55-17-2 |
| bhp25-behandlung-rot | Behandlung Kat. ROT (BHP 25) | 2/0/6/8 | 1 | 55-96-2 |
| bhp25-behandlung-gelb | Behandlung Kat. GELB (BHP 25) | 0/1/4/5 | 1 | 55-17-3 |
| bhp25-behandlung-gruen | Behandlung Kat. GRÜN (BHP 25) | 0/1/4/5 | 1 | 55-17-4 |
| bhp25-betreuungsstaffel | Betreuungsstaffel (BHP 25) | 0/1/5/6 | 1 | 55-16-1 |
| bhp25-logistiktrupp | Logistiktrupp (BHP 25) | 0/1/3/4 | 1 | 55-64-1 |
