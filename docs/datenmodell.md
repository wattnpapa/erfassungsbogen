# Datenmodell Einheiten-Erfassungsbogen (EEB)

**Stufe 1** — Datenmodell und QR-Code-Kodierung. Stand: 2026-07-12, **Schema-Version 3**
(v3 = Ernährungsform je Person; v2 = organisationsübergreifend; v1 war THW-spezifisch).

**Abwärtskompatibilität (Pflicht):** Schema-Änderungen dürfen ältere QR-Codes/Dateien nie
unlesbar machen. `decodeBinaer` (`src/codec.ts`) und `bogenLaden`/`migriereBogen`
(`src/app/hilfen.ts`) akzeptieren jede Version `2..SCHEMA_VERSION`, füllen fehlende Felder
mit Defaults und überführen entfallene Felder (z. B. v2 `Sofortbedarf.davonVegetarisch`
→ `verpflegungManuell`); danach wird der Bogen auf `SCHEMA_VERSION` gehoben.

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
| Ernährung (Fleisch/Vegetarisch/Vegan) | — | 2 Bit → Verpflegungs-Zusammenfassung **abgeleitet** |
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
| verpflegungManuell | {vegetarisch,vegan} | – | nur wenn Personal nicht einzeln erfasst |
| fahrzeuge | `Fahrzeug[]` | ✓ | |
| sofortbedarf | `Sofortbedarf` | – | |
| sonstiges | string | – | Inhalt „Erfassungsbogen Sonstige" |

Abgeleitet (nie gespeichert, außer manuell überschrieben): Stärke, Unterbringung
M/W/D, Verpflegung (vegetarisch/vegan), Ansprechpartner (erste Führungskraft mit Kontakt).

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
| ernaehrung | Enum | Fleisch/Vegetarisch/Vegan (2 Bit) — Verpflegung wird **abgeleitet** |
| kontakte | `Kontakt[]` | Art (Mobil/Festnetz/eMail), D/P-Flag, BCD bzw. Template |
| zusatzqualifikationen | `VokabularWert[]` | „weitere interne/externe Qualifikationen" |

### Fahrzeug

| Feld | Typ | Bemerkung |
|---|---|---|
| typ | `VokabularWert` | Org-Namensraum |
| thwKennzeichen ODER kennzeichenFreitext | Varint / string | „THW-84397" → 84397; sonst „OL-FW 2041" |
| funkrufname | `Funkrufname` | Kennwort + Standort-Flag + Teile `[18,13]` bzw. `[11,48,1]`. THW: bei der StAN-Fahrzeug-Vorbelegung aus der Funkrufnamenregelung (Taschenkarte, `src/vokabulare/thw-funkrufnamen.ts`) vorbelegt — Teileinheit-Zahl aus dem Einheitstyp (1. Zug/TZ), Fahrzeug-Zahl je Fahrzeug; editierbar |
| stanKonform | bool? | „Ausstattung nach StAN/Norm" — `undefined` = Frage nicht anwendbar (z. B. Fremdorganisation) |
| aenderungen | string | Freitext, meist leer |

### Sofortbedarf

Verpflegung (Personenzahl), Betriebsstoff (Diesel/Benzin/Gemisch in Litern),
Unterbringung (bool), Ruhezeit erforderlich (bool). Die Aufteilung vegetarisch/vegan
wird aus den Ernährungsangaben der Personen **abgeleitet** (`verpflegung()` in
`model.ts`) — im Meldekopf-Modus (`NUR_STAERKE`, kein Einzelpersonal) ersatzweise
über `verpflegungManuell`.

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

### Signatur „EEB2S" (Ed25519)

Jeder von der App erzeugte QR-Code (Bogen, Vorlage, PDF-Seite) wird signiert; der
Geräteschlüssel wird dafür beim ersten Bedarf einmalig erzeugt. Gelesen werden
weiterhin auch unsignierte `'EEB2'`-Codes.

Ein signierter Payload trägt ein **eigenes 5-Byte-Magic** und zwischen Magic und
Nutzdaten den öffentlichen Schlüssel und die Signatur:

```
Signierter Payload:  0x45 0x45 0x42 0x32 0x53 ('EEB2S')
                     ‖ pubkey[32]      (Ed25519, roher öffentlicher Schlüssel)
                     ‖ signatur[64]    (Ed25519 über den DeflateRaw-Strom)
                     ‖ DeflateRaw(Binärstrom)
```

- **Abwärtskompatibel.** `'EEB2S'` beginnt zwar mit `'EEB2'`, der Decoder prüft
  aber **zuerst** die 5 Signatur-Bytes und erst dann die 4 EEB2-Bytes. Alte,
  unsignierte `'EEB2'`-Codes (Deflate-Strom direkt hinter dem Magic) werden
  unverändert gelesen. Der Deflate-Strom hinter der Signatur ist **byte-identisch**
  zum unsignierten Payload — die Signatur ist reine Hülle.
- **Signaturumfang.** Signiert wird genau der komprimierte Binärstrom
  (`DeflateRaw(Binärstrom)`), nicht Magic/Schlüssel. Manipulation an den Nutzdaten
  bricht die Prüfung; ein Angreifer kann jedoch neu signieren — die Signatur
  belegt **Herkunft** (welcher Schlüssel), nicht Unveränderbarkeit gegen den
  Schlüsselinhaber selbst.
- **Verifikation blockiert den Import nie.** Ergebnis ist ein Anzeigehinweis:
  „✓ signiert von <Kurzform>" / „nicht signiert" / „Signatur ungültig".
- **Größenbudget.** Die Signaturhülle ist 101 Bytes (5 Magic + 32 Schlüssel +
  64 Signatur); netto wächst der Payload um **+97 Bytes** gegenüber unsigniert
  (das 4-Byte-`EEB2`-Magic wird durch das 5-Byte-`EEB2S` ersetzt), nach Base64url
  ~+130 Zeichen. Gemessen am vollen THW-Bogen: unsigniert QR v13 → signiert QR
  v17 — deutlich unter dem Ziel ≤ v25.
- **Vorlagen/Segmentierung orthogonal.** Der Vorlagen-Marker `V.` und die
  Base64url/URL-Hülle liegen um den ganzen Payload; ein signierter Vorlagen-QR ist
  `#V.` ‖ Base64url(`EEB2S…`).

**Schlüsselverwaltung (bewusst simpel, kein Server).** Jedes Gerät erzeugt lokal
**einmalig** ein Ed25519-Schlüsselpaar; der private Schlüssel bleibt im
Gerätespeicher (`localStorage`, nie in QR/URL/Datei). Der öffentliche Schlüssel ist
in der App anzeig- und exportierbar (Kurzform = die ersten Bytes als Hex).

**Trust-Modell (TOFU-artig, dokumentiert einfach):** Es gibt **keine** zentrale
Zertifizierung. „✓ signiert von <Kurzform>" heißt: „dieser Datensatz stammt
unverändert vom Inhaber genau dieses Schlüssels" — **nicht**, dass der Schlüssel
zu einer bestimmten Person/Dienststelle gehört. Vertrauen entsteht außerhalb der
App (Schlüssel-Kurzform am Meldekopf abgleichen, bekannte Absender wiedererkennen).
Der Nutzen ist Integrität + Wiedererkennbarkeit, nicht PKI.

Binärstrom: Felder in fester Reihenfolge, Varint-Längen, UTF-8-Strings, Optionals
über Flag-Bits, Vokabular-Werte als Varint-Code (0 = Freitext folgt).
Referenzimplementierung: [`prototype/qr-size-check.mjs`](../prototype/qr-size-check.mjs).

**Integrität:** QR-Fehlerkorrektur (ECC M = 15 %) sichert den Transport; Deflate
schlägt bei Bitfehlern ohnehin fehl. **Authentizität** stets per
Ed25519-Signatur (Container `EEB2S`, netto +97 Bytes) — siehe „Signatur" oben.

**Gemessene Größen** (siehe README): voller THW-Bogen 511 Bytes → QR v18
(mit OV-Verzeichnis-Referenz 411 Bytes → QR v15); Meldekopf-Schnellerfassung
191 Bytes → QR v10. Budget ≤ v25 (997 Bytes bei ECC M) wird stets deutlich
unterschritten.

### Segmentierung auf mehrere QR-Codes (Fallback)

Der Normalfall bleibt **ein** QR-Code (unverändert, s. o.). Nur wenn ein Bogen so
groß wird, dass der Single-QR das Budget (Ziel ≤ Version 25, ECC M) überschreitet,
wird der **Payload** auf mehrere QR-Codes aufgeteilt. Jeder Teil ist eine eigene
App-URL mit einem Text-Kopf im Fragment — analog zum Vorlagen-Marker `V.` und wie
dieser außerhalb des Base64url-Alphabets, also nie mit einem Payload verwechselbar:

```
Segment-QR (URL):  "https://erfassungsbogen.app/#" ‖ "EEBS." ‖ teilNr "." anzahl "." id "." Base64url(Chunk)
```

| Kopf-Feld | Bedeutung |
|---|---|
| `teilNr` | 1-basierte Nummer dieses Teils (dezimal) |
| `anzahl` | Gesamtzahl der Teile (dezimal, ≥ 2) |
| `id` | 32-Bit-Prüfsumme (FNV-1a) über den **gesamten** Payload (dezimal). Bindet die Teile aneinander (Teile fremder Bögen tragen eine andere `id`) und prüft nach dem Zusammensetzen die Unversehrtheit. |
| `Chunk` | fortlaufender Byte-Abschnitt des Payloads. Alle Chunks in `teilNr`-Reihenfolge aneinandergehängt ergeben exakt den Single-QR-Payload (`'EEB2'` ‖ DeflateRaw). |

**Zusammensetzen:** Der Scanner sammelt Teile mit gleicher `id`/`anzahl`, ignoriert
Duplikate, meldet den Fortschritt („Teil 1 von 2"), und dekodiert erst, wenn alle
`1..anzahl` vorliegen. Fehlt ein Teil, bleibt der Sammelstand unvollständig; ist die
Prüfsumme nach dem Zusammensetzen falsch, wird abgelehnt. Ein zwischendurch
gescannter fremder oder unsegmentierter Code wird sofort separat behandelt.

**Abwärtskompatibel:** Passt der Bogen in einen QR (aktuell immer der Fall —
voller THW-Bogen ≈ v18), wird **kein** Kopf erzeugt; der Single-QR-Roundtrip ist
Byte-für-Byte identisch zu vorher. Referenz: [`src/codec.ts`](../src/codec.ts)
(`segmentPayloadUrls`, `parseSegmentUrl`, `segmentSammeln`, `segmenteZuBogen`).

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
- ~~Signatur/Authentizität ja/nein.~~ Umgesetzt: Ed25519-Signatur (immer aktiv)
  (`EEB2S`, `src/codec.ts` + `src/signatur.ts`), Verifikation bei Import.
