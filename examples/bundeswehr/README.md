# Beispiel-Erfassungsbögen — Bundeswehr im Katastropheneinsatz (Amtshilfe)

5 Beispielbögen für Bundeswehr-Einheiten, die bei Katastrophen im
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

Quellen: [Wikipedia „Verbindungskommando"](https://de.wikipedia.org/wiki/Verbindungskommando),
[Wikipedia „SAR-Dienst für Luftfahrzeuge in Deutschland"](https://de.wikipedia.org/wiki/SAR-Dienst_f%C3%BCr_Luftfahrzeuge_in_Deutschland).

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
