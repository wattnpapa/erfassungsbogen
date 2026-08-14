# Beispiel-Erfassungsbögen — Katastrophenschutz Saarland

13 generierte Beispiel-Einheiten der Katastrophenschutz-relevanten
Sanitäts- und Betreuungsdienst-Konzeptionen des **DRK-Landesverbandes Saarland
e.V.**

## Warum keine Landesverordnung wie in anderen Ländern

Die saarländische **Katastrophenschutz-Organisationsverordnung** (KatOrgVO
vom 13.10.2014) regelt in § 2 Abs. 1 ausdrücklich nur, dass die oberste
Katastrophenschutzbehörde Stärke, Gliederung und Ausstattung "in gesonderten
Konzeptionen" bestimmt — sie selbst enthält **keine einzige Stärke- oder
Fahrzeugzahl**, anders als z. B. Berlins KatSD-VO oder Baden-Württembergs
VwV KatSD.

Diese "gesonderten Konzeptionen" für Sanitäts- und Betreuungsdienst
(§ 6/§ 7 KatOrgVO) hat das DRK im Saarland öffentlich dokumentiert und mit
echten Stärke- und (teils) Fahrzeugangaben versehen — landesweit einheitlich
für alle sieben DRK-Kreisverbände, beschlossen vom Landesausschuss der
Bereitschaften. Auf diesen Konzeptionen beruhen alle Bögen hier:

* **Sanitätsdienst**: "Die Sanitätsstaffel im DRK Landesverband Saarland
  e.V.", "Der Behandlungsplatz 10 (BHP 10 SAL)", "Der Behandlungsplatz 25
  (BHP 25)" (alle 16.02.2014) sowie "Die Patiententransportkomponenten des
  DRK im Saarland" (17.11.2020, Version 28.09.2024).
* **Betreuungsdienst**: "Mindestanforderungen an Strukturen des
  DRK-Betreuungsdienstes im Landesverband Saarland e.V." (Bundesfassung
  15.10.2011, Saarland-Fassung beschlossen 01.03.2015).

Alle Personen, Standort-Zuordnungen und Kennzeichen sind **fiktiv**.

## Fahrzeuge: quellengenau nur bei sieben von 13 Bögen

> Bei **BHP 25** (Transportkomponente) und den **vier
> Patiententransportkomponenten** (PT-G 5, PT-GA 5, PT-Z 10, PT-ZA 10) sind
> Fahrzeugtyp UND -zahl **wörtlich der Quelle entnommen** und werden beim
> Generieren geprüft (Spalte **Fahrzeuge quellengenau**).
>
> Bei allen anderen Einheiten (Sanitätsstaffel, BHP 10, Betreuungsstaffel/
> -gruppe, BTP 200/500, DRK-Einsatzeinheit) nennt die jeweilige DRK-SAL-
> Konzeption **keine** Fahrzeuge — hier sind die Fahrzeugtypen plausibel nach
> den generischen Ausstattungslisten der KatOrgVO belegt (§ 6 Abs. 4:
> "Gerätewagen-Sanität, Krankentransportwagen, Mannschaftstransportwagen und
> Geräteanhänger"; § 7 Abs. 4: "Betreuungs-Lastkraftwagen, Feldkochherde,
> Mannschaftstransportwagen und Geräteanhänger"). Derselbe Hinweis steht im
> Feld „Sonstiges" jedes betroffenen Bogens.
>
> Der **Betreuer vor Ort (BvO)** führt laut Quelle bewusst kein Fahrzeug.

## Funkrufnamen

Nach der **Verwaltungsvorschrift über Funkrufnamen für nichtpolizeiliche
Behörden und Organisationen mit Sicherheitsaufgaben (npolBOS) im Saarland**
vom 24.02.2014 (in Kraft seit 01.04.2014, erlassen auf Grundlage von § 54
Abs. 2 SBKG):

> `<Kennwort> <Einsatzbereich> <Standortkennzahl>-<Fahrzeugkennzahl>-<lfd. Nr.>`
>
> Beispiel der VV: `ROTKREUZ ST. WENDEL 0-83-1` (1. RTW des DRK-
> Kreisverbands St. Wendel)

* **Kennwort** DRK = „ROTKREUZ" (Nr. 2.1 der VV).
* **Einsatzbereich** = Gemeindeverband im Klartext (Nr. 2.2); für den
  Regionalverband Saarbrücken genügt laut VV die Bezeichnung
  „REGIONALVERBAND".
* **Standortkennzahl** „0", weil die hier abgebildeten Einheiten
  Kreisverbands-Pools ohne festen Standort sind (VV Nr. 2.3: "Fahrzeuge
  einer Organisation, die keinem Standort zugeordnet werden können ...
  erhalten die Standortkennzahl 0").
* **Fahrzeugkennzahl** nach VV Nr. 2.4.1/2.4.6/2.4.8: KdoW 10, ELW 1 11,
  MTW 18, MTW-Z (Sanitäts-/Betreuungsdienst-Variante) 17, GW-San 61,
  GW-Betreuung 63, GW-Verpflegung 64, NEF 82, RTW 83, KTW 85, LKW 92.
* **Laufende Nummer**, je Fahrzeugkennzahl am Standort neu gezählt.

## Träger

Alle Bögen sind DRK-Kreisverbände des Landesverbandes Saarland e.V., über
sechs Standorte gestreut (Saarbrücken, Saarlouis, Merzig-Wadern,
Neunkirchen, St. Wendel, Homburg/Saarpfalz-Kreis).

Neu erzeugen mit: `npm run beispiele:kats-sl` (deterministisch, fester
Zufalls-Seed).

| Datei | Fachdienst | Einheit | DRK-Kreisverband | Stärke | Fahrzeuge | Fahrzeuge quellengenau |
|---|---|---|---|---|---|---|
| bhp-5-drk-sal-sanitaetsstaffel-unfallhilfsstelle-uhs-saarlouis | Sanitätsdienst | BHP 5 DRK SAL | Saarlouis | 0/1/5/6 | 1 | nein |
| bhp-10-drk-sal-behandlungsplatz-10-basismodul-neunkirchen | Sanitätsdienst | BHP 10 DRK SAL | Neunkirchen | 2/4/12/18 | 2 | nein |
| bhp-25-drk-sal-behandlungsplatz-25-saarbruecken | Sanitätsdienst | BHP 25 DRK SAL | Saarbrücken | 6/6/25/37 | 6 | ja |
| pt-g-5-drk-sal-patiententransport-gruppe-merzig-wadern | Sanitätsdienst | PT-G 5 DRK SAL | Merzig-Wadern | 1/1/10/12 | 6 | ja |
| pt-ga-5-drk-sal-patiententransport-gruppe-arzt-st-wendel | Sanitätsdienst | PT-GA 5 DRK SAL | St. Wendel | 2/2/10/14 | 7 | ja |
| pt-z-10-drk-sal-patiententransport-zug-homburg | Sanitätsdienst | PT-Z 10 DRK SAL | Homburg | 1/4/17/22 | 11 | ja |
| pt-za-10-drk-sal-patiententransport-zug-arzt-saarlouis | Sanitätsdienst | PT-ZA 10 DRK SAL | Saarlouis | 3/6/17/26 | 13 | ja |
| bvo-betreuer-vor-ort-saarbruecken | Betreuungsdienst | BvO | Saarbrücken | 0/0/1/1 | 0 | ja |
| betreuungsstaffel-betreuungsstaffel-saarlouis | Betreuungsdienst | Betreuungsstaffel | Saarlouis | 0/1/5/6 | 1 | nein |
| betreuungsgruppe-betreuungsgruppe-merzig-wadern | Betreuungsdienst | Betreuungsgruppe | Merzig-Wadern | 0/2/10/12 | 2 | nein |
| btp-200-sal-betreuungsplatz-200-neunkirchen | Betreuungsdienst | BTP 200 – SAL | Neunkirchen | 1/4/17/22 | 4 | nein |
| btp-500-sal-betreuungsplatz-500-st-wendel | Betreuungsdienst | BTP 500 – SAL | St. Wendel | 1/12/50/63 | 9 | nein |
| drk-einsatzeinheit-drk-einsatzeinheit-sanitaet-betreuung-homburg | Sanitäts- und Betreuungsdienst | DRK-Einsatzeinheit | Homburg | 1/6/23/30 | 6 | nein |
