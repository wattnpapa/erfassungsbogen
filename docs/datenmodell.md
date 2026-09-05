# Datenmodell Einheiten-Erfassungsbogen (EEB)

**Stufe 1** — Datenmodell und QR-Code-Kodierung. Stand: 2026-08-05, **Schema-Version 8**
(v8 = mehrere Fahrerlaubnisklassen je Person `weitereFahrerlaubnisse`; v7 = `stand`
minutengenau als Zeitpunkt statt Kalendertag; v6 = Übungs-Kennzeichnung
`uebung`; v5 = Einheitsname in der Hierarchie; v4 = ein einziges Kennzeichen-Feld;
v3 = Ernährungsform je Person; v2 = organisationsübergreifend; v1 war THW-spezifisch).

**Abwärtskompatibilität (Pflicht):** Schema-Änderungen dürfen ältere QR-Codes/Dateien nie
unlesbar machen. `decodeBinaer` (`src/codec.ts`) und `bogenLaden`/`migriereBogen`
(`src/app/hilfen.ts`) akzeptieren jede Version `2..SCHEMA_VERSION`, füllen fehlende Felder
mit Defaults und überführen entfallene Felder (z. B. v2 `Sofortbedarf.davonVegetarisch`
→ `verpflegungManuell`); danach wird der Bogen auf `SCHEMA_VERSION` gehoben.

**Vorwärtskompatibilität (kleinste tragende Version):** Encoder und JSON-Exporte
schreiben nicht stur `SCHEMA_VERSION`, sondern `transportSchemaVersion(b)`
(`src/model.ts`) — die kleinste Version, die den Inhalt trägt. Ein Bogen ohne
Übungs-Flag bleibt Schema 5 und damit für ältere App-Stände lesbar; nur ein
Übungsbogen fordert Schema 6. Dass ein alter Stand ihn dann mit „nicht
unterstützte Schema-Version" ablehnt, ist gewollt: lieber gar nicht anzeigen
als eine Übung unmarkiert wie einen echten Bogen. Im Binärformat sitzt das
Flag in Bit 4 des Personal-Flags-Bytes und kostet 0 Byte extra.

Ein `stand` mit Uhrzeit (≠ Mitternacht) fordert Schema 7: erst dort ist er als
Zeitpunkt (uint32, Minuten) kodiert; bis Schema 6 war er ein Kalendertag (uint16),
beim Herabschreiben rechnet `mitTransportVersion` auf Tage zurück. Da jede
Bearbeitung den Stand minutengenau neu datiert, sind neue Bögen praktisch immer
Schema 7 (+2 Bytes im QR). Beim Lesen älterer Versionen wird Mitternacht angenommen.

Eine Person mit mehr als einer Fahrerlaubnisklasse (B + A — Klassen, die sich
nicht gegenseitig einschließen) fordert Schema 8: die weiteren Klassen stehen
als Varint-Zähler + je 1 Byte hinter dem Ernährungs-Byte. Bögen, in denen jede
Person höchstens eine Klasse hat, bleiben bei Schema ≤ 7 lesbar (der Zähler
wird dann gar nicht geschrieben).

**Bewusste Ausnahme (v4):** Bis v3 stand das THW-Kennzeichen als Zahl im QR-Code
(Flag 16 im Fahrzeug-Byte). Dieses Sonderformat ist entfallen; es gibt nur noch ein
Kennzeichen als String. Beim Decodieren alter QR-Codes wird die Zahl nur noch
übersprungen, damit der übrige Datenstrom lesbar bleibt — **das Kennzeichen bleibt
dort leer**. In JSON-Dateien und Vorlagen wird es dagegen migriert (84397 → „THW-84397").

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
3. Kompression so weit treiben, dass ein gut scannbarer QR-Code (Ziel: ≤ Version 18,
   Fehlerkorrektur M) entsteht; darüber lieber mehrere grobe Codes (Segmentierung)
   als einen feinen.

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
| Fahrerlaubnis (EU-Klassen AM…DE) | „Kf CE" / „Kf B+A" | 4 Bit Enum; weitere Klassen ab Schema 8 (Varint + je 1 Byte); „Kf" implizit |
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

Anschließend: Binärstrom → Deflate → **Base41** → QR-Code im alphanumerischen
Modus (5,5 statt 8 Bit je Zeichen). Das Prinzip entspricht Base45 beim
EU-Impfzertifikat, nutzt aber ein URL-sicheres Alphabet — siehe
„Transportkodierung" unten.

## Entitäten

Verbindliche Typdefinitionen: [`src/model.ts`](../src/model.ts).

### Erfassungsbogen (Wurzel)

| Feld | Typ | Pflicht | Bemerkung |
|---|---|---|---|
| schemaVersion | uint | ✓ | für Migrationen |
| stand | Zeitpunkt | ✓ | letzte Bearbeitung, minutengenau (ab Schema 7; davor Kalendertag). Anzeige als NATO-Zeitgruppe, z. B. „161039jul26" |
| uebung | bool | – | ab Schema 6: Bogen ist eine Übung (Störer, PDF-Wasserzeichen, Kennzeichnung in Sammlungen); fehlt = echter Bogen |
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
| standortRef | number | Referenz ins mitgelieferte Standort-Verzeichnis (THW: offizielle OV-Nummer). Wenn gesetzt, entfällt die hierarchie im QR komplett; im Modell bleibt sie für Anzeige/PDF gefüllt |
| hierarchie | `HierarchieEbene[]` | 1..n Ebenen, unterste zuerst. Die **erste Ebene ist die eigene Einheit** und Pflicht — Bezeichnung als Vokabular (`src/vokabulare/ebenen.ts`: THW OV→RB→LV, FW Gemeinde→LK→Bezirk→Land, DRK OV→KV→LV, …; Codes steigen mit der Hierarchie), Name + optionale Kontakte |

Der **Anzeigename** der Einheit wird abgeleitet statt erfasst: Organisation (bzw.
`organisationName`) + Name der ersten Ebene + Einheitstyp, z. B. „THW Oldenburg (NI)
FGr K (A)" (`einheitAnzeigename` in `src/app/hilfen.ts`). Bis Schema 4 gab es
daneben ein Freitextfeld `name` — faktisch eine Doppeleingabe zur ersten Ebene.
Alte QR-Codes und JSON-Dateien bleiben lesbar: der Slot im Binärformat wird als
leerer String weitergeschrieben, ein gefüllter Altname ohne Hierarchie wird beim
Dekodieren zur ersten Ebene.

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
| weitereFahrerlaubnisse | `Fahrerlaubnis[]?` | ab Schema 8: Klassen neben der Hauptklasse, die sich nicht gegenseitig einschließen (B + A); nur gesetzt, wenn nicht leer |
| geschlecht | Enum | M/W/D (2 Bit) |
| ernaehrung | Enum | Fleisch/Vegetarisch/Vegan (2 Bit) — Verpflegung wird **abgeleitet** |
| kontakte | `Kontakt[]` | Art (Mobil/Festnetz/eMail), D/P-Flag, BCD bzw. Template |
| zusatzqualifikationen | `VokabularWert[]` | „weitere interne/externe Qualifikationen" |

### Fahrzeug

| Feld | Typ | Bemerkung |
|---|---|---|
| typ | `VokabularWert` | Org-Namensraum |
| kennzeichen | string | Wie am Fahrzeug angeschrieben: „OL-FW 2041", „THW-84397" |
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
QR-Inhalt (URL):  "https://erfassungsbogen.app/#" ‖ "B." ‖ Base41(Payload)
Payload (binär):  0x45 0x45 0x42 0x32 ('EEB2') ‖ DeflateRaw(Binärstrom)
```

Der URL-Präfix ist der App-Identifikator: Die native Kamera von iOS/Android
erkennt die URL und öffnet die App (Universal Link) bzw. die Web-App. Die
Daten stehen im Fragment (`#`) und werden daher nie an einen Server gesendet.
Der Decoder akzeptiert die volle URL oder den nackten Payload;
die Magic-Bytes 'EEB2' im Binärteil bleiben die Format-Kennung.

### Transportkodierung „B." (Base41)

Der Datenteil wird **Base41** kodiert und trägt dafür den Marker `B.` vor sich.
Grund ist der Kodiermodus des QR-Codes: Base64url enthält Kleinbuchstaben und
`_` und zwingt den Code damit in den **Byte-Modus** — 8 Bit QR-Kapazität je
Zeichen für 6 Bit Nutzdaten, ein Viertel der Kapazität verfällt. Der
**alphanumerische Modus** kostet nur 5,5 Bit je Zeichen, kennt aber nur
`0-9 A-Z SPACE $ % * + - . / :`.

Base41 nutzt davon 41 Zeichen — ohne SPACE (in URLs nicht erlaubt), ohne `%`
(Escape-Zeichen), ohne `.` (trennt die Marker) und ohne `+` (wird von manchen
Parsern als Leerzeichen gelesen). Wegen 41³ = 68921 ≥ 65536 werden aus **2 Bytes
3 Zeichen** — dasselbe Verhältnis wie bei Base45 (RFC 9285), nur mit
URL-sicherem Alphabet.

Der Präfix bleibt in Kleinbuchstaben: Der QR-Encoder mischt die Modi von selbst
und legt ein Byte-Segment für den Präfix neben ein Alphanumerik-Segment für die
Daten. Eine Großschreibung der URL würde nur ~0,12 QR-Versionsstufen bringen und
dafür Universal Links und Kamera-Apps riskieren.

**Wirkung** (227 Beispielbögen, unsigniert, Fehlerkorrektur M): QR-Version im
Mittel 20,50 → 17,66, Modulkante 99 → 88; 222 statt 216 Bögen passen in einen
einzelnen Code. Binärformat und Deflate-Kompression bleiben unberührt.

**Abwärtskompatibel beim Lesen.** `.` kommt weder im Base41- noch im
Base64url-Alphabet vor, der Marker ist also eindeutig. Datenteile **ohne**
Marker werden weiterhin als Base64url gelesen — jeder je gedruckte QR-Code
bleibt gültig, auch gemischte Segment-Sätze. Umgekehrt gilt das nicht: Eine
App-Version von vor der Umstellung kann einen `B.`-Code nicht lesen und lehnt
ihn mit „Kein EEB2-QR-Code" ab (wie schon bei den Markern `V.` und `EEBS.`).

**Textlink bleibt Base64url.** Der teilbare App-Link („Bogen übergeben" →
Link) ist bewusst **nicht** Base41: dessen Sonderzeichen (`$ * / :`) brechen
in Chat-Programmen die Link-Erkennung ab — der Link wird dort zerhackt oder
nur teilweise anklickbar. Der Textlink nutzt darum das markerlose
Base64url-Format (`A–Z a–z 0–9 - _`, zudem ~11 % kürzer), das jeder je
veröffentlichte Decoder liest. Base41 zahlt sich nur im QR-Bild aus
(alphanumerischer Modus); in einem Textlink zählt allein die Link-Erkennung.

### Signatur „EEB2C" (Ed25519, n Stufen)

Jeder von der App erzeugte QR-Code (Bogen, Vorlage, PDF-Seite) wird signiert; der
Geräteschlüssel wird dafür beim ersten Bedarf einmalig erzeugt. Gelesen werden
weiterhin auch unsignierte `'EEB2'`-Codes.

Es gibt **einen** signierten Container. Er trägt eine **Liste von Stufen** — der
Meldeweg des Bogens. Stufe 1 ist der Ersteller; wer einen fremden Bogen
unverändert weiterreicht, hängt eine Stufe an (siehe „Signaturkette" unten). Der
Normalfall ist `n=1`.

```
Signierter Payload:  0x45 0x45 0x42 0x32 0x43 ('EEB2C')
                     ‖ varint(n)                  (Stufen, 1…32)
                     ‖ stufe_1 … stufe_n
                     ‖ DeflateRaw(Binärstrom)

stufe_k            = pubkey[32]                   (Ed25519, roher Schlüssel)
                     ‖ signatur[64]
                     ‖ varint(kartenLen) ‖ karte  (kartenLen 0 = keine Karte)
```

- **Magic-Reihenfolge.** `'EEB2C'` beginnt mit `'EEB2'`, der Decoder prüft daher
  **zuerst** die 5 Bytes und erst dann die 4. Unsignierte `'EEB2'`-Codes
  (Deflate-Strom direkt hinter dem Magic) werden unverändert gelesen. Der
  Deflate-Strom hinter den Stufen ist **byte-identisch** zum unsignierten
  Payload — die Stufen sind reine Hülle.
- **Signaturumfang.** Stufe k zeichnet **ihren Kartenblock ‖ die Stufen 1…k−1 ‖
  den komprimierten Strom** — nicht Magic und nicht ihren eigenen Schlüssel.
  Dass die Vorgängerstufen mitgezeichnet werden, macht den Meldeweg
  manipulationsfest: eine Stufe lässt sich nicht entfernen, einfügen oder
  umsortieren, ohne jede spätere Signatur zu brechen. Manipulation an den
  Nutzdaten bricht alle Stufen; ein Angreifer kann jedoch neu signieren — die
  Signatur belegt **Herkunft** (welcher Schlüssel), nicht Unveränderbarkeit
  gegen den Schlüsselinhaber selbst.
- **Verifikation blockiert den Import nie.** Ergebnis ist ein Anzeigehinweis:
  „✓ signiert von <Kurzform>" / „nicht signiert" / „Signatur ungültig".
  Maßgeblich ist die **letzte** Stufe — sie belegt, von wem dieser Bogen kam.
- **Stufenzahl gedeckelt** (32, `MAX_STUFEN`). Reale Meldewege haben eine bis
  drei; die Grenze hält einen aufgeblähten Payload früh und mit klarer Meldung
  auf, statt ihn n-mal kryptografisch prüfen zu lassen.
- **Größenbudget.** Eine Stufe kostet 97 Bytes (32 Schlüssel + 64 Signatur + 1
  Kartenlänge), dazu 5 Magic + 1 Stufenzahl. Netto **+99 Bytes** gegenüber
  unsigniert bei `n=1` (das 4-Byte-`EEB2`-Magic wird durch das 5-Byte-`EEB2C`
  ersetzt), nach Base41 ~+149 Zeichen. Gemessen am vollen THW-Bogen:
  unsigniert QR v13 → signiert QR v17 — noch unter dem Ziel ≤ v18.
- **Vorlagen/Segmentierung orthogonal.** Der Vorlagen-Marker `V.` und die
  Base41/URL-Hülle liegen um den ganzen Payload; ein signierter Vorlagen-QR ist
  `#V.B.` ‖ Base41(`EEB2C…`).

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

### Absenderkarte (freiwillige Kontaktangaben, je Stufe)

Ein Schlüssel-Fingerabdruck ist wiedererkennbar, aber stumm. Wer möchte, hinterlegt
deshalb **einmalig** am Gerät Name, E-Mail und/oder Telefonnummer; diese
**Absenderkarte** reist danach in jedem übergebenen Bogen (QR, Link, PDF) mit und
gibt der Gegenstelle einen Rückkanal für Rückfragen.

Die Karte gehört zur **Stufe**, nicht zum Payload: jede Stelle im Meldeweg trägt
ihre eigene (oder keine).

```
karte:               flags[1]          (Bit 0 Name, Bit 1 E-Mail, Bit 2 Telefon)
                     ‖ je gesetztem Bit: varint(Länge) ‖ UTF-8
```

- **Opt-in ohne Formatwechsel.** Ohne hinterlegte Karte steht in der Stufe nur
  `kartenLen = 0` — ein Byte, das ohnehin im Container steht. Eine Karte ohne
  jeden gefüllten Wert zählt als keine Karte (byte-identischer Payload).
- **Mitsigniert.** Der Kartenblock steht am Anfang der von der Stufe signierten
  Bytes. Eine ausgetauschte Karte bricht die Prüfung; angezeigt wird sie deshalb
  **nur** bei gültiger Signatur. Unbekannte Flagbits und überschüssige Bytes am
  Kartenende werden ignoriert, damit spätere Felder alte Leser nicht blind machen.
- **Keine Identitätszusicherung.** Die Karte ist eine **Eigenangabe** des
  Absenders — sie belegt so viel wie ein selbst geschriebener Briefkopf. Sie macht
  den Absender ansprechbar; verifiziert wird außerhalb der App (Rückruf).
  Die Oberfläche formuliert das entsprechend („Eigene Angabe des Absenders").
- **Größenbudget.** Flagbyte + Längen-Varint + Feldinhalte, unkomprimiert.
  Realistisch ~40–70 Bytes, gedeckelt auf 40 / 48 / 24 Zeichen (Name / E-Mail /
  Telefon); nach Base41 ~+60–105 Zeichen. Am vollen THW-Bogen bleibt der QR
  damit weiterhin unter dem Ziel ≤ v18.
- **Datenschutz.** Personenbezogene Daten, freiwillig und jederzeit löschbar
  (`eeb.absenderkarte.v1` im `localStorage`, wandert über die Datensicherung mit).
  Referenz: [`src/app/absenderkarte.ts`](../src/app/absenderkarte.ts).

### Signaturkette beim Weiterreichen (Gegenzeichnen)

Ein gescannter Bogen wird oft weitergegeben — der Meldekopf sammelt Bögen fremder
Einheiten und reicht sie an die nächste Führungsstelle. Würde die App den Bogen
dabei neu signieren, stünde beim nächsten Empfänger **das weiterreichende Gerät
als Ursprung**; die Herkunft wäre nach dem ersten Meldeschritt verloren.

Deshalb wird ein **unverändert** weitergereichter Bogen **gegengezeichnet**: der
komprimierte Strom und alle bisherigen Stufen bleiben wörtlich erhalten, das
eigene Gerät hängt nur eine Stufe an und bezeugt damit die Weitergabe.

- **Eine Stufe je Stelle.** `n` wächst von 1 (Ersteller) über 2 (Meldekopf) auf
  3 (Leitstelle) — der Meldeweg steht als Liste im Container, ohne
  Verschachtelung und ohne Sonderfall.
- **Reihenfolge mitsigniert.** Weil Stufe k die Stufen 1…k−1 mitzeichnet, bricht
  jedes Entfernen, Einfügen oder Umsortieren die späteren Signaturen. Der Weg
  ist damit so belastbar wie die einzelnen Signaturen.
- **Unverändert heißt unverändert.** Angehängt wird nur, wenn der offene Bogen
  exakt dem empfangenen Payload entspricht. Nach jeder Bearbeitung ist es ein
  eigener Bogen: dann wird mit einer einzelnen Stufe selbst signiert, und die
  Oberfläche sagt das.
- **Anzeige.** „Meldeweg: <Ursprung> → <Zwischenstelle> → <Absender>". Eine
  gebrochene frühere Stufe entwertet die letzte **nicht** — die belegt weiter,
  was der letzte Absender übergeben hat; unbelegt ist dann nur der behauptete
  Ursprung.
- **Größenbudget.** 97 Bytes je zusätzlicher Stufe, plus die Karte jener Stelle.
- **Aufbewahrung.** Nur die Rohbytes tragen die fremden Signaturen, ein
  dekodierter Bogen nicht. Der empfangene Payload wird deshalb am offenen Bogen
  und je Meldung in der Einsatz-Sammlung (`herkunft`, Base64url) mitgeführt.
  Meldungen ohne dieses Feld (manuell erfasst, unsigniert empfangen, ältere
  Sammlungen) werden selbst signiert.
  Referenz: [`src/signatur.ts`](../src/signatur.ts) (`gegengezeichnetePayloadBytes`).

Binärstrom: Felder in fester Reihenfolge, Varint-Längen, UTF-8-Strings, Optionals
über Flag-Bits, Vokabular-Werte als Varint-Code (0 = Freitext folgt).
Referenzimplementierung: [`prototype/qr-size-check.mjs`](../prototype/qr-size-check.mjs).

**Integrität:** QR-Fehlerkorrektur (ECC M = 15 %) sichert den Transport; Deflate
schlägt bei Bitfehlern ohnehin fehl. **Authentizität** stets per
Ed25519-Signatur (Container `EEB2C`, netto +99 Bytes bei einer Stufe) — siehe
„Signatur" oben.

**Gemessene Größen** (siehe README): voller THW-Bogen 511 Bytes → QR v18
(mit OV-Verzeichnis-Referenz 411 Bytes → QR v15); Meldekopf-Schnellerfassung
191 Bytes → QR v10. Budget ≤ v18 = **512 Payload-Bytes** (Base41 in der App-URL,
ECC M) — der Regelfall ist damit die Aufteilung auf mehrere Codes.

### Segmentierung auf mehrere QR-Codes (Fallback)

Der Normalfall bleibt **ein** QR-Code (unverändert, s. o.). Nur wenn ein Bogen so
groß wird, dass der Single-QR das Budget (Ziel ≤ Version 18, ECC M) überschreitet,
wird der **Payload** auf mehrere QR-Codes aufgeteilt — jeder Teil auf höchstens
Version 13 (276 Payload-Bytes), damit die Module grob und aus Distanz scannbar
bleiben. Jeder Teil ist eine eigene
App-URL mit einem Text-Kopf im Fragment — analog zum Vorlagen-Marker `V.` und wie
dieser außerhalb des Base41- und Base64url-Alphabets, also nie mit einem Payload
verwechselbar:

```
Segment-QR (URL):  "https://erfassungsbogen.app/#" ‖ "EEBS." ‖ teilNr "." anzahl "." id "." "B." Base41(Chunk)
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

**Abwärtskompatibel:** Passt der Bogen in einen QR (über die 443 Beispielbögen
gemessen 73 — der Regelfall ist die Aufteilung), wird **kein** Kopf erzeugt; der
Single-QR-Roundtrip ist Byte-für-Byte identisch zu vorher. Ein bereits gedruckter
QR-Code bleibt unabhängig vom Budget lesbar — die Schwellen betreffen nur das
Erzeugen. Referenz: [`src/codec.ts`](../src/codec.ts)
(`segmentPayloadUrls`, `parseSegmentUrl`, `segmentSammeln`, `segmenteZuBogen`).

## Meldekopf-Workflow (Anforderungen an die App, Stufe 2+)

1. **Minimale Pflichtfelder:** Organisation, Name der ersten Ebene, Stärke (3 Zahlen),
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
  (`EEB2C`, `src/codec.ts` + `src/signatur.ts`), Verifikation bei Import,
  Signaturkette beim Weiterreichen.
