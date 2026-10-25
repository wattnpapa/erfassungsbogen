# Beispiel-Erfassungsbögen — Praktische Ausbildung

41 Bögen aus vier Bogensätzen einer praktischen Ausbildung (Vordruck
„Einheitenerfassungsbogen" der Johanniter-Akademie Niedersachsen/Bremen), eins zu
eins übernommen. Die Stärkezahlen im Format VF/ZF/Arzt – GF – TF/He – Gesamt entsprechen
Führer/Unterführer/Mannschaft/Gesamt der App.

Namen, Funktionen, Qualifikationen, Fahrzeuge, Kennzeichen und Rufnamen stehen so da,
wie sie auf den Vordrucken stehen, einschließlich ihrer Eigenheiten:

- Leere Namensplätze (Akkonia, Zugtrupp: Zugführer und Stellvertreter ohne Namen).
- Kennzeichen-Platzhalter „H-JU XXX" auf den handschriftlichen Bögen aus Hannover.
- Doppelt vergebene Angaben: Kennzeichen „AK-JU 39" (Akkonia, 1. Betreuungsgruppe und
  Transportgruppe), Rufname „52-79-1" (zwei Krads der SEG Aller-Leine), Michael Kurzer als
  Gruppenführer in Verpflegungsgruppe und PSNV-Staffel (Akkonia).
- Malter, Zugtrupp: Funkrufname „54-17-1" im Feld Kommunikation, „56-17-1" beim ELW 2.
- Hannover, SEG Wunstorf: Die Stärke-Zeile lautet 1/4/22/28, summiert sich aber auf 27
  (die Teileinheiten auf dem Bogen ergeben ebenfalls 27). Das Datenmodell leitet die
  Gesamtstärke aus den Teilzahlen ab, der Bogen steht deshalb als 1/4/22/27 da.
- Malter, 1. Betreuungstrupp: Das zweite Fahrzeug des 1. Betreuungstrupps (Malter) hat nur das
  Kennzeichen „MA-" ohne Fahrzeugtyp und fehlt deshalb.

Was das Datenmodell nicht kennt, steht im Feld „Sonstiges": Fachdienst-Kreuze,
Hauptleistung (BHP/BTP mit Plätzen), das Feld Kommunikation und handschriftliche
Bemerkungen. Bei Malter hängt die „Begründung meiner Planung" von der letzten Seite am
Bogen der Verpflegungsgruppe.

Ergänzt, weil das Modell sie verlangt und die Vordrucke sie nicht führen: Geschlecht
(nach Vornamen, nur für die Unterbringungsauswertung), Ernährung „Fleisch",
Fahrerlaubnis „keine Angabe", Einsatzbezeichnung und Datum 17.02.2024 (Datum der
Unterschrift auf den Vordrucken), bei JUH-Bögen mit nackten Rufnamen das Kennwort „Akkon".
Telefon, Fax und E-Mail der SEG Aller-Leine sind im Original echt und hier durch
Platzhalter ersetzt (555…, *.example).

Die Bögen aus Hannover liegen als Papierscan ohne Namensliste vor und sind im Modus
„Nur Stärke" angelegt. Gelesen wurde handschriftlich; unsicher sind „LKW Lbw Sto" und der
Rufname „Akkon Holland XX XX XX" (Wunstorf).

Alle Bögen sind als Übung gekennzeichnet.

Neu erzeugen mit: `npm run beispiele:ausbildung` (deterministisch).

## JUH RV Malter (`malter/`)

5 Bögen, zusammen 2/4/27/33.

| Datei | Einheit | Organisation | Stärke | Fz | Erfassung |
|---|---|---|---|---|---|
| 01-zugtrupp | Zugtrupp (Ztr) | JUH Malter | 2/0/2/4 | 1 | mit Namen |
| 02-1-betreuungsgruppe | 1. Betreuungsgruppe | JUH Malter | 0/1/9/10 | 2 | mit Namen |
| 03-2-betreuungsgruppe | 2. Betreuungsgruppe | JUH Malter | 0/1/7/8 | 2 | mit Namen |
| 04-1-betreuungstrupp | 1. Betreuungstrupp | JUH Malter | 0/1/1/2 | 1 | mit Namen |
| 05-verpflegungsgruppe | Verpflegungsgruppe | JUH Malter | 0/1/8/9 | 4 | mit Namen |

## JUH OV Akkonia (`akkonia/`)

7 Bögen, zusammen 3/6/39/48.

| Datei | Einheit | Organisation | Stärke | Fz | Erfassung |
|---|---|---|---|---|---|
| 01-zugtrupp | Zugtrupp (Ztr) | JUH Akkonia | 2/0/2/4 | 1 | mit Namen |
| 02-1-sanitaetsgruppe | 1. Sanitätsgruppe | JUH Akkonia | 1/1/7/9 | 2 | mit Namen |
| 03-2-sanitaetsgruppe | 2. Sanitätsgruppe | JUH Akkonia | 0/1/5/6 | 2 | mit Namen |
| 04-1-betreuungsgruppe | 1. Betreuungsgruppe | JUH Akkonia | 0/1/8/9 | 2 | mit Namen |
| 05-transportgruppe | Transportgruppe | JUH Akkonia | 0/1/7/8 | 4 | mit Namen |
| 06-verpflegungsgruppe | Verpflegungsgruppe | JUH Akkonia | 0/1/5/6 | 4 | mit Namen |
| 07-psnv-staffel | PSNV-Staffel | JUH Akkonia | 0/1/5/6 | 2 | mit Namen |

## JUH OV Johannesburg (`johannesburg/`)

6 Bögen, zusammen 5/3/32/40.

| Datei | Einheit | Organisation | Stärke | Fz | Erfassung |
|---|---|---|---|---|---|
| 01-zugtrupp | Zugtrupp (Ztr) | JUH Johannesburg | 2/0/2/4 | 1 | mit Namen |
| 02-1-sanitaetsgruppe | 1. Sanitätsgruppe | JUH Johannesburg | 1/1/8/10 | 2 | mit Namen |
| 03-2-sanitaetsgruppe | 2. Sanitätsgruppe | JUH Johannesburg | 0/1/5/6 | 1 | mit Namen |
| 04-transportgruppe | Transportgruppe | JUH Johannesburg | 2/0/6/8 | 4 | mit Namen |
| 05-technik-und-sicherheit | Technik und Sicherheit | JUH Johannesburg | 0/1/9/10 | 4 | mit Namen |
| 06-kradmelder | Kradmelder | JUH Johannesburg | 0/0/2/2 | 2 | mit Namen |

## Einlagen Kräfte Landeshauptstadt Hannover (`hannover/`)

23 Bögen, zusammen 16/41/195/252.

| Datei | Einheit | Organisation | Stärke | Fz | Erfassung |
|---|---|---|---|---|---|
| 01-2-einsatzzug-zugtrupp | 2. Einsatzzug Landeshauptstadt Hannover | JUH Hannover-Wasserturm | 1/1/2/4 | 2 | nur Stärke |
| 02-2-einsatzzug-1-sanitaetsgruppe | 2. Einsatzzug Landeshauptstadt Hannover | JUH Hannover-Wasserturm | 0/1/7/8 | 2 | nur Stärke |
| 03-2-einsatzzug-2-sanitaetsgruppe | 2. Einsatzzug Landeshauptstadt Hannover | JUH Hannover-Wasserturm | 0/1/8/9 | 2 | nur Stärke |
| 04-2-einsatzzug-betreuungsgruppe | 2. Einsatzzug Landeshauptstadt Hannover | JUH Hannover-Wasserturm | 0/1/5/6 | 2 | nur Stärke |
| 05-3-einsatzzug | 3. Einsatzzug Landeshauptstadt Hannover | JUH Hannover-Wasserturm | 1/4/23/28 | 7 | nur Stärke |
| 06-1-fuehrungsgruppe | 1. Führungsgruppe Landeshauptstadt Hannover | JUH Hannover-Wasserturm | 4/3/2/9 | 4 | nur Stärke |
| 07-2-fuehrungsgruppe | 2. Führungsgruppe Landeshauptstadt Hannover | MHD Hannover | 4/3/2/9 | 3 | nur Stärke |
| 08-2-verpflegungsgruppe | 2. Verpflegungsgruppe Landeshauptstadt Hannover | JUH Hannover-Wasserturm | 0/1/8/9 | 4 | nur Stärke |
| 09-3-verpflegungsgruppe | 3. Verpflegungsgruppe Landeshauptstadt Hannover | JUH Hannover-Wasserturm | 0/1/5/6 | 4 | nur Stärke |
| 10-4-verpflegungsgruppe | 4. Verpflegungsgruppe Landeshauptstadt Hannover | MHD Hannover | 0/1/8/9 | 4 | nur Stärke |
| 11-2-gruppe-technik-und-logistik | 2. Gruppe T+L Landeshauptstadt Hannover | JUH Wasserturm | 0/1/5/6 | 5 | nur Stärke |
| 12-1-staffel-psnv | 1. Staffel PSNV Landeshauptstadt Hannover | JUH Hannover-Wasserturm | 0/1/4/5 | 2 | nur Stärke |
| 13-1-einsatzzug | 1. Einsatzzug Landeshauptstadt Hannover | DRK Hannover (Mitte) | 3/4/24/31 | 5 | nur Stärke |
| 14-4-einsatzzug | 4. Einsatzzug Landeshauptstadt Hannover | ASB/MHD Hannover | 1/4/16/21 | 4 | nur Stärke |
| 15-1-gruppe-technik-und-logistik | 1. Gruppe T+L Landeshauptstadt Hannover | DRK Hannover | 0/1/8/9 | 4 | nur Stärke |
| 16-2-patiententransportstaffel | 2. Patiententransp. Staffel LHH | ASB Hannover | 0/1/5/6 | 3 | nur Stärke |
| 17-3-patiententransportstaffel | 3. Patiententransportstaffel LHH | DRK Hannover | 0/1/5/6 | 3 | nur Stärke |
| 18-4-patiententransportstaffel | 4. Patiententransportstaffel LHH | JUH Hannover-Wasserturm | 0/1/5/6 | 3 | nur Stärke |
| 19-seg-aller-leine-zugtrupp | Zugtrupp (Einsatzzug / San-Zug) | JUH Aller-Leine | 1/0/4/5 | 3 | nur Stärke |
| 20-seg-aller-leine-gw-san | GW-SAN (Einsatzzug / San-Zug) | JUH Aller-Leine | 0/1/7/8 | 2 | nur Stärke |
| 21-seg-aller-leine-patiententransportgruppe | Patiententransportgruppe (Einsatzzug / San-Zug) | JUH Aller-Leine | 0/1/9/10 | 5 | nur Stärke |
| 22-seg-san-landesbergen | SEG-San | JUH Landesbergen | 0/4/11/15 | 5 | nur Stärke |
| 23-seg-wunstorf-san-betreuungszug | SEG (San/Betr-Zug / Einsatzzug) | JUH Wunstorf-Steinhuder Meer | 1/4/22/27 | 9 | nur Stärke |
