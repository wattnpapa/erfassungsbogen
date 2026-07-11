# Datenmodell Einheiten-Erfassungsbogen (EEB)

**Stufe 1** — Datenmodell und QR-Code-Kodierung. Stand: 2026-07-10, **Schema-Version 2**
(v2 = organisationsübergreifend; v1 war THW-spezifisch).

Der Bogen ist **BOS-übergreifend**: THW, Feuerwehr, Polizei, Hilfsorganisationen
(DRK/JUH/MHD/ASB), DLRG, Bundeswehr, Rettungsdienst — und beliebige sonstige
Organisationen, die an einem Einsatz teilnehmen.

## Anwendungsfälle

1. **Eigenerfassung** (klassisch, z. B. THW): Einheit füllt ihren Bogen vollständig
   selbst aus — jede Person einzeln mit Funktionen, Fahrerlaubnis, Kontakten.
2. **Meldekopf-Schnellerfassung**: Eine Einheit trifft **ohne** eigenen Bogen ein.
   Am Meldekopf wird sie auf dem Tablet in wenigen Minuten erfasst — nur die
   Stärkezahlen, Führungskraft mit Erreichbarkeit, Fahrzeuge, Sofortbedarf.
   Ergebnis: Bogen digital erstellt, gedruckt, weitergegeben; QR-Code enthält alles.

Beide Fälle nutzen dasselbe Schema; der Modus steckt in `personalErfassung`
(`VOLLSTAENDIG` / `NUR_STAERKE`).

## Ziele

1. Alle Informationen eines Erfassungsbogens strukturiert abbilden (Eingabe → PDF-Druck).
2. Denselben Datensatz **offline** über einen einzelnen QR-Code transportieren.
3. Kompression so weit treiben, dass ein gut scannbarer QR-Code (Ziel: ≤ Version 25,
   Fehlerkorrektur M) entsteht.

## Kernidee der Kompression: namensraumbasierte Vokabulare

Freitext ist der Feind. Fast alles auf dem Bogen ist **kontrolliertes Vokabular** —
aber jede Organisation hat ihr eigenes (THW: FmKW, GrFü; FW: LF 20, Zugführer;
RD: RTW, NEF). Deshalb:

- Der `OrganisationsTyp` (1 Byte) wählt den **Namensraum**. Alle Vokabular-Felder
  (Einheitstyp, Funktionen, Fahrzeugtypen, Hierarchie-Ebenen, Qualifikationen)
  werden innerhalb dieses Namensraums als 1-Byte-Code aufgelöst.
- Jeder Vokabular-Wert hat einen **Freitext-Ausweg** (`code 0` + String). Damit sind
  auch unbekannte Organisationen und exotische Fahrzeuge abbildbar — sie kosten nur
  mehr Bytes.

| Feld | Statt Text | Kodierung |
|---|---|---|
| Organisation | „Technisches Hilfswerk" | 1 Byte Enum |
| Einheitstyp (FGr K (A), Löschzug, SEG …) | Text | 1 Byte Code im Org-Namensraum, Freitext-Ausweg |
| Funktion (GrFü, Zugführer, AGT …) | „GrFü / Kf C, SGL" | Codes im Org-Namensraum, je 1 Byte |
| Stärkerolle | — | 2 Bit explizit (Führer/Unterführer/Mannschaft) → Stärkemeldung org-unabhängig ableitbar |
| Fahrerlaubnis (EU-Klassen AM…DE) | „Kf CE" | 4 Bit Enum; „Kf" implizit |
| Geschlecht (M/W/D) | — | 2 Bit → Unterbringungszahlen **abgeleitet** |
| Fahrzeugtyp | „Anh Versorgung 2t" / „LF 20" | 1 Byte Code im Org-Namensraum |
| Kennzeichen | „THW-95039" / „OL-FW 2041" | THW: Zahl als Varint (2–3 Bytes); sonst Freitext |
| Funkrufname | „Heros Oldenburg 18/13", „Florian Wardenburg 11/48/1" | Kennwort-Code (global: Heros, Florian, Rotkreuz, Akkon …) + Flag „eigener Standort" + n×1 Byte Teile |
| Telefonnummern | „0170 1234501" | BCD-gepackt (2 Ziffern/Byte) |
| Datum | „14.05.2025" | `EebDatum`: Tage seit 2020-01-01, uint16 |
| Zeitpunkt (Einsatzbeginn/-ende) | „14.05.2025 08:30" | `EebZeitpunkt`: Minuten seit 2020-01-01 (lokale Wandzeit), uint32 |
| THW-Standort | OV-Name + OV/RB/LV-Kontakte (~150 Bytes) | `standortRef`: OV-Nummer als Varint (2 Bytes), aufgelöst über mitgeliefertes Verzeichnis |
| Org-Standard-eMail | „vorname.nachname@thw-oldenburg.de" | 1 Byte Template-Referenz |
| Stärke (0/3/17/20) | — | **abgeleitet** aus Stärkerollen — oder manuell (Meldekopf-Modus, 3 Bytes) |

Anschließend: Binärstrom → Deflate → QR-Code (Byte-Modus) bzw. optional Base45 →
QR-Code (Alphanumerisch-Modus, wie beim EU-Impfzertifikat — nur nötig, wenn ältere
Scanner keinen Byte-Modus beherrschen).

## Entitäten

Verbindliche Typdefinitionen: [`src/model.ts`](../src/model.ts).

### Erfassungsbogen (Wurzel)

| Feld | Typ | Pflicht | Bemerkung |
|---|---|---|---|
| schemaVersion | uint | ✓ | für Migrationen |
| stand | Datum | ✓ | |
| einheit | `Einheit` | ✓ | Organisation, Typ, Hierarchie |
| einsatz | `Einsatz` | ✓ | Zeitraum, Ort, Auftrag, Beginn/Ende |
| personalErfassung | Enum | ✓ | `VOLLSTAENDIG` / `NUR_STAERKE` |
| personal | `Person[]` | ✓ | bei `NUR_STAERKE`: nur Führungskräfte/Ansprechpartner |
| staerkeManuell | `Staerke` | bei `NUR_STAERKE` | Führer/Unterführer/Mannschaft (Gesamt = Summe) |
| unterbringungManuell | {m,w,d} | – | nur wenn Personal nicht einzeln erfasst |
| fahrzeuge | `Fahrzeug[]` | ✓ | |
| sofortbedarf | `Sofortbedarf` | – | |
| sonstiges | string | – | Inhalt „Erfassungsbogen Sonstige" |

Abgeleitet (nie gespeichert, außer manuell überschrieben): Stärke, Unterbringung
M/W/D, Ansprechpartner (erste Führungskraft mit Kontakt).

### Einheit

| Feld | Typ | Bemerkung |
|---|---|---|
| organisation | Enum `OrganisationsTyp` | THW, FEUERWEHR, POLIZEI, DRK, …, SONSTIGE |
| organisationName | string | Pflicht bei SONSTIGE („Freiwillige Feuerwehr Wardenburg") |
| einheitsTyp | `VokabularWert` | FGr K (A), Löschzug, SEG Sanität, … |
| standortRef | number | Referenz ins mitgelieferte Standort-Verzeichnis (THW: offizielle OV-Nummer). Wenn gesetzt, entfallen name + hierarchie im QR komplett; im Modell bleiben sie für Anzeige/PDF gefüllt |
| name | string | „OV Oldenburg - Ni", „LZ Wardenburg" |
| hierarchie | `HierarchieEbene[]` | generisch: THW OV/RB/LV; FW Gemeinde/Landkreis; DRK KV/LV — Bezeichnung als Vokabular, Name + optionale Kontakte |

**Zeitfelder** werden im gesamten Modell einheitlich numerisch gespeichert und erst
bei Anzeige/PDF formatiert (`datumZuIso`/`zeitpunktZuIso` in `src/model.ts`).
Bewusst **kein Unix-Timestamp**: Kalenderdaten als UTC-Zeitpunkt kippen je nach
Zeitzone/Sommerzeit um einen Tag und kosten 4 statt 2 Bytes; für Zeitpunkte reicht
Minutengenauigkeit in lokaler Wandzeit (= das, was auf dem Papierbogen steht).

**Standort-Verzeichnis (THW):** Die App liefert eine Tabelle aller THW-Ortsverbände
mit (OV-Nummer, Name, Kontakte, RB, LV) aus — ~700 Einträge, wenige zehn KB.
Der QR trägt dann nur die OV-Nummer. Trade-off: der QR ist nicht mehr vollständig
selbsterklärend; kann die scannende App die Nummer nicht auflösen (veraltetes
Verzeichnis), zeigt sie „THW OV #1540" und fordert ein Update an. Der Absender kann
deshalb wählen, ob mit Referenz (kompakt) oder ausgeschrieben (selbsttragend)
kodiert wird. Für andere BOS gibt es zunächst kein Verzeichnis — dort bleibt die
ausgeschriebene Hierarchie der Normalfall.

### Person

| Feld | Typ | Bemerkung |
|---|---|---|
| nachname, vorname | string | einziger nennenswerter Freitext |
| staerkeRolle | Enum | Führer / Unterführer / Mannschaft (2 Bit) — org-unabhängig |
| funktionen | `VokabularWert[]` | Anzeige-Funktionen im Org-Namensraum |
| fahrerlaubnis | Enum | EU-Klassen (4 Bit) |
| geschlecht | Enum | M/W/D (2 Bit) |
| kontakte | `Kontakt[]` | Art (Mobil/Festnetz/eMail), D/P-Flag, BCD bzw. Template |
| zusatzqualifikationen | `VokabularWert[]` | „weitere interne/externe Qualifikationen" |

### Fahrzeug

| Feld | Typ | Bemerkung |
|---|---|---|
| typ | `VokabularWert` | Org-Namensraum |
| thwKennzeichen ODER kennzeichenFreitext | Varint / string | „THW-84397" → 84397; sonst „OL-FW 2041" |
| funkrufname | `Funkrufname` | Kennwort + Standort-Flag + Teile `[18,13]` bzw. `[11,48,1]` |
| stanKonform | bool? | „Ausstattung nach StAN/Norm" — `undefined` = Frage nicht anwendbar (z. B. Fremdorganisation) |
| aenderungen | string | Freitext, meist leer |

### Sofortbedarf

Verpflegung (Personen, davon vegetarisch), Betriebsstoff (Diesel/Benzin/Gemisch in
Litern), Unterbringung (bool), Ruhezeit erforderlich (bool).

## QR-Payload-Format „EEB2"

```
QR-Inhalt (URL):  "https://erfassungsbogen.app/#" ‖ Base64url(Payload)
Payload (binär):  0x45 0x45 0x42 0x32 ('EEB2') ‖ DeflateRaw(Binärstrom)
```

Der URL-Präfix ist der App-Identifikator: Die native Kamera von iOS/Android
erkennt die URL und öffnet die App (Universal Link) bzw. die Web-App. Die
Daten stehen im Fragment (`#`) und werden daher nie an einen Server gesendet.
Der Decoder akzeptiert die volle URL oder den nackten Base64url-Payload;
die Magic-Bytes 'EEB2' im Binärteil bleiben die Format-Kennung.

Binärstrom: Felder in fester Reihenfolge, Varint-Längen, UTF-8-Strings, Optionals
über Flag-Bits, Vokabular-Werte als Varint-Code (0 = Freitext folgt).
Referenzimplementierung: [`prototype/qr-size-check.mjs`](../prototype/qr-size-check.mjs).

**Integrität:** QR-Fehlerkorrektur (ECC M = 15 %) sichert den Transport; Deflate
schlägt bei Bitfehlern ohnehin fehl. Optional später: Ed25519-Signatur (+64 Bytes).

**Gemessene Größen** (siehe README): voller THW-Bogen 511 Bytes → QR v18
(mit OV-Verzeichnis-Referenz 411 Bytes → QR v15); Meldekopf-Schnellerfassung
191 Bytes → QR v10. Budget ≤ v25 (997 Bytes bei ECC M) wird stets deutlich
unterschritten.

**Fallback:** Segmentierung auf 2 QR-Codes ist im Format vorgesehen
(Header-Byte `teilNr/anzahl`), nach aktueller Messung aber nicht nötig.

## Meldekopf-Workflow (Anforderungen an die App, Stufe 2+)

1. **Minimale Pflichtfelder:** Organisation, Einheitsname, Stärke (3 Zahlen),
   eine Führungskraft mit Mobilnummer. Alles andere optional & nachtragbar.
2. **Vorbelegung:** Einsatz/Übung wird am Meldekopf einmal konfiguriert und für
   jede erfasste Einheit vorbelegt (Zeitraum, Ort/Auftrag, Einsatzbeginn = jetzt).
3. **Große Touch-Ziele, Auswahl statt Tippen:** Organisations- und Fahrzeugtypen
   als Buttons/Listen aus den Vokabularen; Freitext nur als Ausweg.
4. **Ausgabe:** PDF im Layout des Papier-Bogens (drucken & weitergeben) + QR-Code
   auf dem Bogen, damit nachgelagerte Stellen den Datensatz einscannen können.

## Offene Punkte für Stufe 2

- Vokabular-Tabellen ausarbeiten (`src/vokabulare.ts`): je Organisation
  Einheitstypen, Funktionen, Fahrzeugtypen, Hierarchie-Ebenen, Qualifikationen,
  Email-Templates; global die Funkrufnamen-Kennwörter. Versionierung der Tabellen
  (Codes sind append-only, nie umdeuten).
- Decoder (Gegenstück zum Encoder) + QR-Rendering/Scanning.
- THW-OV-Verzeichnis befüllen (Quelle: öffentliche THW-Dienststellenliste) und
  Aktualisierungsweg festlegen. (Format ist umgesetzt, siehe `standortRef`.)
- Deflate-Preset-Dictionary aus typischen Bögen (~10–20 % zusätzliche Ersparnis).
- Signatur/Authentizität ja/nein.
