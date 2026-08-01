# Beispiel-Erfassungsbögen — DRK-Bereitschaft Niedersachsen

8 Beispiel-Einheiten nach der „Einsatzhandakte" einer
DRK-Bereitschaft in Niedersachsen (Stand 03/25) — der Aufstellung, mit der eine
Bereitschaft ihre Teileinheiten mit Fahrzeug, Funkkennung, Meldeweg und Stärke
meldet. Je Teileinheit ein Bogen; zusammen ergeben sie die Bereitschaft mit
3/10/36/49.

Anders als die KatS-StAN der Länder ist das keine landesrechtliche
Stärkevorgabe, sondern die Verbandsgliederung des DRK. In der
Landesvorlagen-Auswahl (Schritt 1) erscheinen die Einheiten deshalb unter
Niedersachsen als eigene Gruppe „DRK-Bereitschaft" neben Katastrophenschutz und
Feuerwehrverordnung.

**Träger und Standort sind erfunden:** Die Bögen laufen auf einen
DRK-Kreisverband Moorlande e. V. — den gibt es so wenig wie die Gemeinde Moorlande.
Abgebildet ist die Gliederung, nicht die Aufstellung eines bestimmten Vereins.
Personen, Kontakte und Kfz-Kennzeichen sind ebenfalls **fiktiv**.

Die Funkrufnamen folgen dem OPTA-Schema Niedersachsen mit dem Kennwort
„Rotkreuz": die örtliche Kennung (87) ist frei erfunden, Fahrzeug- und
Ordnungskennung entsprechen Anlage 2 des Erlasses — sie tragen den Fahrzeugtyp
und sind damit die eigentliche Aussage. Genauso halten es die
KatS-Beispielbögen der Länder.

Neu erzeugen mit: `npm run beispiele:drk-nds` (deterministisch, fester Zufalls-Seed).

| Datei | Teileinheit | Stärke | Fz | Funkkennung (Rotkreuz Moorlande …) |
|---|---|---|---|---|
| bereitschaft-einheitsfuehrung-kdow | Einheitsführung (Bereitschaft) | 1/1/0/2 | 1 | 87-10-1 |
| bereitschaft-sanitaetsgruppe-gw-san | Sanitätsgruppe (Bereitschaft) | 1/1/4/6 | 1 | 87-96-1 |
| bereitschaft-betreuungsgruppe-bt-kombi | Betreuungsgruppe (Bereitschaft, BT-Kombi) | 0/1/8/9 | 1 | 87-16-1 |
| bereitschaft-betreuungsgruppe-mtw | Betreuungsgruppe (Bereitschaft, MTW) | 0/1/8/9 | 1 | 87-17-2 |
| bereitschaft-gruppe-iuk-elw | Gruppe Information und Kommunikation (IuK) | 1/0/2/3 | 1 | 87-19-1 |
| bereitschaft-verpflegungsgruppe | Verpflegungsgruppe (Bereitschaft) | 0/1/8/9 | 4 | 87-17-1, —, —, — |
| bereitschaft-gruppe-technik-und-sicherheit | Gruppe Technik und Sicherheit | 0/1/2/3 | 2 | 87-64-1, — |
| bereitschaft-rettungsdienst-rtw-ktw | Rettungsdienst (RTW/KTW) | 0/4/4/8 | 4 | 87-83-1, 87-93-2, 87-93-1, 87-92-1 |
