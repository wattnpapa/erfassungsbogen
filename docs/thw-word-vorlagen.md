# THW-Word-Vorlagen (06-*_Erfassungsbogen.dotx): lassen sie sich auslesen?

Stand: 2026-11-09. Grundlage: das Paket `EEB_2026.zip` (44 Vorlagen
`06-*_Erfassungsbogen.dotx`) und ein Testbogen, den Word aus
`06-K_A_Erfassungsbogen.dotx` ausgefüllt und unter macOS als PDF gedruckt hat
(`eeb_k_test.pdf`). Die Dateien liegen nicht im Repository.

## Kurzantwort

Die ausgefüllte Word-Datei (`.docx`) lässt sich zuverlässig strukturiert
lesen. Das daraus gedruckte PDF nicht.

## Die Word-Datei

Jede Vorlage enthält 146 bis 147 klassische Word-Formularfelder (`FORMTEXT`,
`FORMCHECKBOX`, im XML `w:ffData` mit `w:name`). Die Namen sind in allen 44
Vorlagen gleich; die Vorlagen unterscheiden sich nur in den Vorbelegungen
(Einheitstyp, Fahrzeuge). Der Wert eines Felds steht im Dokument zwischen
`fldChar separate` und `fldChar end`, Kästchen als `w:checked`.

| Feldname | Inhalt | Ziel im Datenmodell |
| --- | --- | --- |
| `Teileinheit` (Vorbelegung, z. B. „FGr Kommunikation (A)“) | Einheitstyp | `einheit.einheitsTyp` über das THW-Vokabular |
| `Fü`, `UFü`, `He`, `Gesamt` | Stärke | nur zur Kontrolle; die App zählt aus dem Personal |
| `FüKr` | Name der Führungskraft (Kopf) | Abgleich mit `personal[0]` |
| `OV`, `RB`, `LV` mit `_Tel`, `_Fax`, `_Mail` | Hierarchie | `einheit.hierarchie[]` (Fax hat kein Feld im Modell) |
| `Einsatzzeitraum`, `Einsatzort`, `Einsatzbeginn`, `Einsatzende` | Einsatz | `einsatz.*`; der Zeitraum ist Freitext („1.1.25 - 31.12.27“) und muss geparst werden |
| `Fz_1` … `Fz_5` mit `_Kennz`, `_FuRn`, `_StAN_ja`, `_StAN_nein`, `_Sonder` | Fahrzeuge | `fahrzeuge[]`, Typ über das Fahrzeug-Vokabular |
| `FüKr_1` … `FüKr_3` mit `_Zusatzf`, `_Name`, `_OV`, `_Mobil`, `_Mobil_dientli`, `_Mobil_privat`, `_Mail` | Führungskräfte | `personal[]` mit Kontakten (D/P) |
| `He_1` … `He_17` mit `_Zusatzf`, `_Name`, `_OV` | Helfer | `personal[]` |
| `int_ext_He_1` … `_6` mit `_Name`, `_Quali` | Qualifikationen | `zusatzqualifikationen` der Person mit gleichem Namen |
| `Verpflegung`, `Personenzahl`, `Vegetarier`, `Betriebsstoff`, `Liter_Diesel`, `Liter_Benzin`, `Liter_Gemisch`, `Ruhezeit`, `Unterbringung`, `Männlich`, `Weiblich`, `Divers` | Sofortbedarf | `sofortbedarf` |

Worauf ein Leser achten muss:

- Die Funktionen der Personalzeilen („GrFü /“, „TrFü /“, „He /“, beim
  Zugtrupp „ZFü /“, beim Stab „SGL /“) sind fester Text vor dem Feld
  `…_Zusatzf`, kein Feld. Sie müssen aus dem Text neben dem Feld oder aus der
  Zeilenposition gelesen werden.
- Mehrere Felder tragen Vorbelegungen, die keine Angabe sind: `_Fax` „- 18“,
  `_Mail` „@thw.de“, `Fz_N_Kennz` „THW-“. Steht nur die Vorbelegung drin, ist
  das Feld leer.
- Namen stehen als ein Feld „Name, Vorname“; die Reihenfolge ist nicht
  erzwungen (im Testbogen nur der Vorname).
- Die Kapazität ist fest: 3 Führungskräfte, 17 Helfer, 5 Fahrzeuge,
  6 Qualifikationen. Mehr geht nur über den „Erfassungsbogen Sonstige“, also
  eine zweite Datei.
- Für das Lesen genügt das, was die App schon mitbringt: Eine `.docx` ist ein
  ZIP-Archiv, `word/document.xml` lässt sich mit `pako` (`inflateRaw`) entpacken
  und mit `DOMParser` lesen. Eine neue Abhängigkeit braucht es nicht.

## Das gedruckte PDF

Das Testbogen-PDF stammt aus dem Druckdialog („Als PDF sichern“, Producer
„macOS Quartz PDFContext“). Darin sind keine Formularfelder (`Form: none`),
keine Tags und keine eingebetteten Daten mehr enthalten, sondern nur noch
Glyphen an Koordinaten und Linien. Ein Leser müsste die Felder über ihre Lage
auf der Seite wiederfinden. Das geht für genau diese Vorlage, kippt aber, sobald
Word anders umbricht (Ersatzschrift für BundesSans Office, längere Einträge,
andere Word-Version). Leere Felder verschwinden spurlos, Vorbelegungen wie
„Fax: - 18“ sind vom Inhalt nicht zu unterscheiden, und die Kästchen sind
gezeichnete Rechtecke mit Kreuz. Das ist für einen Import, auf den sich der
Meldekopf verlassen soll, zu unsicher.

Nicht geprüft ist der PDF-Export von Word unter Windows („Speichern unter →
PDF“). Dass er die Feldnamen als Formularfelder mitnimmt, ist nicht zu
erwarten; vor einem Import über diesen Weg wäre das an einer echten Datei zu
prüfen. Der zuverlässige Weg bleibt die `.docx`.

## Vorschlag

Ein Import „THW-Word-Bogen (.docx)“ neben dem bestehenden Datei-Import: Feld
für Feld nach der Tabelle oben, Vorbelegungen herausfiltern, Funktionen aus dem
festen Text der Zeile, Einheitstyp aus `Teileinheit`, und alles, was sich nicht
zuordnen lässt, unter „Sonstiges“.

Umgesetzt am 2026-11-09 in `src/app/word-bogen.ts` (Tests:
`word-bogen.test.ts` mit einer per Code gebauten Minimal-.docx). Einstieg:
„Aus Datei laden…“ und „Bögen einlesen…“ nehmen `.docx` an. Festlegungen
dabei:

- Funktion aus dem festen Text vor `…_Zusatzf`: ZFü und SGL zählen als
  Führer, ZTrFü, GrFü, TrFü und psFK (PSF) als Unterführer, He als
  Mannschaft. „FüKr /“ (Vorlage Sonstige) wird Freitext-Funktion „FüKr“ mit
  Stärkerolle Unterführer.
- Zusatzfunktionen über das Funktionsvokabular, „Kf CE“ (oder „CE“, „C1E“ …)
  als Fahrerlaubnis, Rest als Freitext.
- Namen ohne Komma stehen ganz im Nachnamen.
- Fahrzeugzeilen zählen nur mit Kennzeichen, Funkrufname, Kreuz oder
  Sondergerät; der StAN-Fahrzeugname allein ist Vorbelegung.
- `int_ext_He_N` wird der Person mit gleichem Namen (sonst eindeutigem
  Nachnamen) zugeordnet, sonst Sonstiges.
- Einsatzbeginn/-ende ohne Datum beziehen sich auf den ersten Tag des
  Zeitraums (Ende vor Beginn: Folgetag); die Quittung sagt es.
- Zahl der Vegetarier und M/W/D bleiben unter Sonstiges: im Modell hängen sie
  an den Personen, die der Word-Bogen nicht kennzeichnet.
- Die Stärke im Kopf wird nur verglichen; bei Abweichung nennt die Quittung
  beide Zahlen.

## Layout

Aus derselben Vorlage stammt das Raster des App-PDFs (`pdf-dokument.ts`,
Konstanten `RASTER`, `BOGEN_RAENDER`, `ZEILE_HOCH`, `ZEILE_PERSONAL`):
Rahmen 474,9 pt breit ab x = 74,4 pt, oben ab 41 pt, Linien 0,5 pt,
Kopfzeilen 28,35 pt, Personalzeilen 19,85 pt, Titelbalken in #003399, rechts
im Titel beim THW die Wortbildmarke aus der Vorlage (`pdf-logo-thw.ts`).
