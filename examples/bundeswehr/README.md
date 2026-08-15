# Beispiel-Erfassungsbögen — Bundeswehr im Katastropheneinsatz (Amtshilfe)

8 Beispielbögen für Bundeswehr-Einheiten, die bei Katastrophen im
Inland Amtshilfe leisten (Art. 35 GG).

**Recherchestand:** Für die meisten angefragten Einheitstypen (Sanitätsregiment,
ABC-Abwehrkompanie, Pionierkompanie, Feldjägerdienstkommando, Hubschrauber­
geschwader …) veröffentlicht die Bundeswehr keine STAN (Stärke- und
Ausrüstungsnachweisung) mit Funktions-/Rollenliste — anders als bei den
KatS-Landesverordnungen oder dem BBK-Rahmenkonzept MTF
(siehe scripts/bbk-bundeseinheiten-beispielboegen.mts). Nur für zwei Typen ist
die Besetzung mit namentlichen Funktionsbezeichnungen öffentlich (Wikipedia,
mit Einzelnachweis auf bundeswehr.de) belegt:

- **Kreis-/Bezirksverbindungskommando (KVK/BVK):** 13 Dienstposten laut Quelle,
  davon 4 mit veröffentlichtem Funktionstitel (Leiter/BeaBwZMZ, Stellvertreter,
  Sanitätsstabsoffizier, Sanitätsfeldwebel) — nur diese vier sind hier
  abgebildet, um nichts zu erfinden.
- **SAR-Kommando (Heer) Nörvenich/Niederstetten/Holzdorf-Schönewalde:**
  Hubschrauber-Crew mit 2 Hubschrauberführern + 1 Luftrettungsmeister (HHO).

Für die **Pioniertruppe** (Ergänzung 2026-08, Hochwasser-/Katastrophenschutz-Bezug)
gibt es keine vergleichbare Dienstposten-Gesamtliste, aber einzelne belegte
Eckdaten auf bundeswehr.de:

- **Panzerpionierzug:** 43 Dienstposten laut bundeswehr.de-Karriereportal
  ("Zugführer eines Pionierzuges"); die Aufteilung in Zugtrupp/Gruppen ist
  eine erfundene, aber plausible Strukturskizze.
- **Schwimmbrückenzug (M3):** Besatzung 3/Fahrzeug (Landfahrer, Wasserfahrer,
  Schwimmbrückenpionier) × 8 Fahrzeuge für eine 100-m-Brücke = 24 Personen,
  beides wörtlich bundeswehr.de-belegt; nur die Zugführung ist ergänzt.
- **Pioniermaschinenzug:** Kompanie-Gliederung laut Wikipedia
  ("Pioniermaschinenzug mit … Baggern und Radladern"), Personalstärke (20)
  mangels Quelle geschätzt.

Quellen: [Wikipedia „Verbindungskommando"](https://de.wikipedia.org/wiki/Verbindungskommando),
[Wikipedia „SAR-Dienst für Luftfahrzeuge in Deutschland"](https://de.wikipedia.org/wiki/SAR-Dienst_f%C3%BCr_Luftfahrzeuge_in_Deutschland),
[bundeswehr.de „Zugführer eines Pionierzuges"](https://www.bundeswehr.de/de/auftrag/einsaetze/missionen/ich-bin-im-einsatz/efp-zugfuehrer-pioniere-5787548),
[bundeswehr.de „Schwimmschnellbrücke Amphibie M3"](https://www.bundeswehr.de/de/ausruestung-technik-bundeswehr/landsysteme-bundeswehr/schwimmschnellbruecke-amphibie-m3),
[Wikipedia „Panzerpioniere (Bundeswehr)"](https://de.wikipedia.org/wiki/Panzerpioniere_(Bundeswehr)).

**Anders als die KatS-StAN der Länder oder das BBK-Rahmenkonzept MTF ist hier
KEINE vollständige Personalstärke je Einheit dokumentiert** — die Bögen bilden
bewusst nur die öffentlich belegten Funktionen ab (siehe Kopfkommentar im
Generator-Skript für Details je Einheitstyp). Die Beispielbögen liegen flach
hier (kein Bundesland-Unterordner, da Bundeswehr-Organisation) und erscheinen
NICHT in der Landesvorlagen-Auswahl, sondern nur in der
Beispielbögen-Übersicht der App — wie die BBK-, THW- und DLRG-Beispiele.

Alle Personen, Kontakte und Luftfahrzeugkennungen sind **fiktiv**.

Neu erzeugen mit: `npm run beispiele:bundeswehr` (deterministisch, fester Zufalls-Seed).

| Datei | Einheit | Stärke | Fahrzeuge |
|---|---|---|---|
| kreisverbindungskommando | Kreisverbindungskommando (KVK) | 3/1/0/4 | 0 |
| bezirksverbindungskommando | Bezirksverbindungskommando (BVK) | 3/1/0/4 | 0 |
| sar-kommando-noervenich | SAR-Kommando Nörvenich | 2/1/0/3 | 1 |
| sar-kommando-niederstetten | SAR-Kommando Niederstetten | 4/2/0/6 | 2 |
| sar-kommando-holzdorf-schoenewalde | SAR-Kommando Holzdorf/Schönewalde | 2/1/0/3 | 1 |
| panzerpionierzug | Panzerpionierzug | 1/4/38/43 | 5 |
| schwimmbrueckenzug-m3 | Schwimmbrückenzug (M3) | 1/8/16/25 | 8 |
| pioniermaschinenzug | Pioniermaschinenzug | 1/9/10/20 | 5 |
