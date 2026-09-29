# Datenschutz-Folgenabschätzung

**Digitaler Einheiten-Erfassungsbogen — Vorlage/Entwurf**
Grundlage: Repository `wattnpapa/erfassungsbogen`, Stand 2026-09-12 — Version 0.1 (Entwurf)

> **Quelle dieses Dokuments.** Markdown-Fassung von `DSFA-Erfassungsbogen.docx`.
> Die technischen Aussagen wurden am 2026-09-12 gegen `main` (Commit `c7604e9`)
> und den angehefteten Submodul-Commit `87b40dd` nachgeprüft; Ergänzungen und
> Korrekturen sind als *Prüfvermerk* gekennzeichnet.
>
> **Wichtig:** Der Commit „Sicherheitsbericht umsetzen" (`c7604e9`, 2026-09-12)
> hat das in R5/M6 genannte Dekomprimierungs-Risiko bereits behoben.
>
> **Nachgezogen 2026-09-13 — Datenschutzfrist:** Die App anonymisiert
> Personaldaten 90 Tage nach der letzten Änderung eines Bogens, Übungsbögen und
> Vorlagen ausgenommen.
> - **Geändert:** 5.7, 6.2, die Risiken R1/R3/R8, die neuen Risiken R10/R11,
>   die Maßnahmen M4/M11/M12, Abschnitt 1 und Abschnitt 10.
> - **Grenze:** QR-Codes, PDF und Exporte selbst bleiben unverschlüsselt
>   lesbar.
>
> **Nachgezogen 2026-09-23 — Vorlage teilen (Issue #26):** Eine gespeicherte
> Vorlage (Mannschaftsliste einer Einheit) lässt sich als QR-Code, Link oder
> JSON-Datei weitergeben, ausdrücklich auch zur Ablage in einer Cloud. Geändert:
> 5.1, 5.5, 5.8.
>
> **Nachgezogen 2026-09-27 — Teilexport „Nur neue Bögen seit dem letzten
> Export":** Der Meldekopf kann dem Stab nur die seit der letzten Weitergabe
> neuen Meldungen nachliefern; dafür merkt sich die App je Einsatz-Sammlung die
> Kennungen der bereits exportierten Meldungen. Geändert: 5.7.
>
> **Nachgezogen 2026-09-28 — Rückholplatz des Entwurfs:** Eine am Meldekopf
> angefangene Erfassung einer fremden Einheit verdrängt den eigenen Bogen nicht
> mehr vom Rückholplatz; sie wird stattdessen nach Rückfrage verworfen.
> Geändert: 5.7.
>
> **Nachgezogen 2026-09-29 — Excel-Liste „Oldenburg" (Audit Runde 2, R2-K2):**
> Die Excel-Liste für die übergeordnete Führungsstelle trägt jetzt auch
> Eintreffzeit, Abrückzeit und den Auftrag/die Notiz der Führungsstelle
> (Freitext) je Einheit; abgerückte, aufgegangene und Übungsmeldungen stehen in
> einem eigenen Block außerhalb der Summen. Damit verlässt der Notiz-Freitext
> das Meldekopf-Gerät auch über diesen Exportweg. Geändert: 5.1, 5.5.
>
> **Nachgezogen 2026-09-29 — Meldung entfernen (Audit Runde 2, R2-D1):**
> „Entfernen" löscht eine Einheit der Einsatz-Sammlung jetzt mit allen
> Fassungen; bisher blieben die älteren Fassungen samt Personendaten
> gespeichert. Geändert: 5.7.
>
> **Nachgezogen 2026-09-29 — Stand am Meldekopf auf den Bogenseiten (Audit
> Runde 2, R2-A1):** Die Sammel-PDF wiederholt Eintreff-/Abrückzeit, Zug und
> Auftrag/Notiz je Einheit über deren Bogen und neben dem QR-Code. Keine neuen
> Daten, kein neuer Empfänger; der QR-Code bleibt unverändert. Geändert: 5.1,
> 5.5.
>
> **Nachgezogen 2026-09-29 — Sicherung einspielen (Audit Runde 2, R2-D3):**
> Die Rückfrage vor dem Ersetzen nennt die laufenden Sammlungen des Geräts
> und den Inhalt der Datei, bietet eine Sicherung vorher an und verlangt einen
> Haken, wenn laufende Sammlungen betroffen sind. Keine neuen Daten.
> Geändert: 5.7.
>
> **Nachgezogen 2026-09-29 — Entfernte Meldungen kommen nicht still zurück
> (Audit Runde 2, R2-D4):** Die App merkt sich je Sammlung die Kennungen vor
> Ort entfernter Einträge (`eeb.entfernt.v1`, keine Personendaten) und fragt
> bei „Einsatz importieren…", bevor sie eine davon wieder aufnimmt.
> Geändert: 5.7.
>
> **Nachgezogen 2026-09-29 — Dauerhafter Speicher und Sicherungs-Erinnerung
> (Audit Runde 2, R2-O6):** Die Web-App bittet den Browser um dauerhaften
> Speicher, sobald Sammlungen mit Meldungen oder Vorlagen vorliegen, und merkt
> sich den Zeitpunkt der letzten Sicherung (`eeb.sicherung.zuletzt.v1`, keine
> Personendaten). Keine Netzverbindung, kein neuer Empfänger. Geändert: 5.7.
>
> **Nachgezogen 2026-09-29 — Quittung nach Entfernen (Audit Runde 2, R2-H4):**
> „Rückgängig" steht jetzt in einer festen Leiste am unteren Bildrand; die
> Lebensdauer des Rückwegs (nur Arbeitsspeicher) ist präzisiert. Keine neue
> Speicherung. Geändert: 5.7.
>
> **Nachgezogen 2026-09-29 — Vermerke der Führungsstelle (Audit Runde 2,
> R2-K6):** Zug, Auftrag/Notiz, Zeitkorrekturen und Abrücken werden je Meldung
> mit Uhrzeit protokolliert (Zusatzfeld `vermerke`). Ein geänderter Auftrag
> bleibt damit als Vorwert im Vermerk stehen, bis die Sammlung gelöscht wird —
> Freitext mit Personenbezug lebt also so lange wie die Sammlung, nicht nur bis
> zur nächsten Änderung. Kein neuer Empfänger. Geändert: 5.7.
>
> **Nachgezogen 2026-09-29 — Nachricht nach automatischer Löschung (Audit
> Runde 2, R2-D5):** Nach Ablauf der Aufräumfrist merkt sich die App Name,
> Zeitraum und Zahl der Meldungen der gelöschten Sammlung (ohne
> Personendaten), bis die Nachricht auf der Startseite quittiert ist. Die
> Löschung selbst bleibt unverändert. Geändert: 5.7.
>
> **Nachgezogen 2026-09-29 — Lageblatt zum Weiterführen (Audit Runde 2,
> R2-A3):** Das Lageblatt nennt je Einheit Funkrufname und Rückrufnummer der
> Führungskraft (Initial, Nachname, Nummer) — neu auf diesem Ausdruck, auf dem
> Einzelbogen und in der Excel-Liste stand sie schon. Die App merkt sich, wann
> zuletzt ein Lageblatt erzeugt wurde (`eeb.lageblatt-stand.v1`, nur
> Kennungen und Zeitpunkt). Geändert: 5.1, 5.7.

## Hinweis zu diesem Dokument

Dies ist ein technisch fundierter Entwurf, **keine Rechtsberatung** und keine
fertige, rechtsverbindliche Datenschutz-Folgenabschätzung. Er wurde auf Basis
einer Analyse des öffentlichen Quellcodes von `wattnpapa/erfassungsbogen`
(Checkout-Stand 2026-09-11/12, `main`, inkl. der vier Kern-Submodule) erstellt
und beschreibt, was die Software technisch tut — nicht, wie eine konkrete
Organisation sie einsetzt, konfiguriert oder rechtlich einordnet.

Die App hat keinen zentralen Betreiber: Es gibt keinen Server, keine Cloud, kein
Nutzerkonto. Jede Einheit/Organisation, die die App einsetzt, wird dadurch
faktisch selbst zum datenschutzrechtlich Verantwortlichen für ihre eigene
Nutzung (Art. 4 Nr. 7 DSGVO). Dieses Dokument ist deshalb als ausfüllbare
Vorlage angelegt: Platzhalter in eckigen Klammern sind von der jeweiligen
Organisation zu ergänzen, bevor das Dokument als eigene DSFA verabschiedet wird.

Vor einer verbindlichen Nutzung sollte diese Vorlage von der/dem behördlichen
bzw. betrieblichen Datenschutzbeauftragten (Art. 37 ff. DSGVO) geprüft, ergänzt
und formell freigegeben werden. Rechtsgrundlagen (Abschnitt 5.6) sind bewusst
als Optionen dargestellt, da sie von Rechtsform und Bundesland der einsetzenden
Organisation abhängen.

## 1. Zusammenfassung

Der digitale Einheiten-Erfassungsbogen ersetzt einen papierenen Vordruck, mit dem
BOS-Einheiten und Hilfsorganisationen im Einsatz- und Übungsfall Stärke,
Personal, Fahrzeuge und Sofortbedarf erfassen und an eine Führungsstelle
weitergeben. Die App verarbeitet dabei personenbezogene Daten des eigenen
Personals (Namen, teils Kontaktdaten, Fahrerlaubnisse, logistikrelevante Angaben
wie Ernährungsform) sowie optional freiwillige Kontaktangaben des Absenders.

Zentrales Architekturmerkmal mit unmittelbarer Datenschutz-Relevanz: Es gibt
keinen Server, keine Cloud, keine Nutzerkonten. Alle Daten bleiben auf dem
jeweiligen Endgerät (`localStorage`); die Übergabe zwischen zwei Geräten läuft
ausschließlich über einen selbst-enthaltenen QR-Code oder Datei-Export — ohne
dass eine dritte Stelle die Daten zu sehen bekommt. Das minimiert eine ganze
Risikoklasse, verschiebt die verbleibenden Risiken aber vollständig auf das
einzelne Gerät und den einzelnen Ausdruck/Export (Abschnitt 7).

**Ergebnis der Erforderlichkeitsprüfung (Abschnitt 4):** Nach den
Schwellwertkriterien der Art.-29-Datenschutzgruppe (WP248) ist eine DSFA nach
Art. 35 DSGVO für den Kern-Anwendungsfall nicht zwingend vorgeschrieben.
Aufgrund der Verarbeitung von Personaldaten im Einsatzkontext und der
strukturellen Besonderheiten eines serverlosen Systems (Abschnitt 6.3) wird die
Durchführung dennoch empfohlen.

**Gesamtrisiko** (vor Berücksichtigung organisationsspezifischer Maßnahmen):
gering bis mittel. Die höchsten Einzelrisiken betreffen den Verlust/Diebstahl
eines Endgeräts (unverschlüsselter lokaler Speicher, Abschnitt 7) und den Umgang
mit gedruckten/exportierten Kopien (Abschnitt 6.3).

**Datenschutzfrist (seit 2026-09-13):** Die App anonymisiert die Personaldaten
eines Bogens 90 Tage nach seiner letzten Änderung, auch in fremden, empfangenen
Bögen. Ausgenommen sind Übungsbögen und Vorlagen.
- **Wirkung:** Der Speicherbegrenzung ist damit technisch statt nur
  organisatorisch Rechnung getragen. R3 sinkt auf niedrig, R1 und R8 auf
  niedrig-mittel.
- **Nicht erfasst:** QR-Code, PDF und Exporte selbst. R2 bleibt deshalb
  unverändert.
- **Neue Risiken:** R10 (Datenverlust durch eine falsche Uhr) und R11
  (fristfreie Übungsbögen mit echten Daten).

## 2. Rahmendaten

| Feld | Angabe |
| --- | --- |
| Bezeichnung der Verarbeitungstätigkeit | Digitaler Einheiten-Erfassungsbogen (App „Erfassungsbogen") |
| Verantwortlicher (Art. 4 Nr. 7 DSGVO) | `[Name der einsetzenden Organisation]` |
| Vertreten durch | `[Name, Funktion]` |
| Datenschutzbeauftragte/r (falls bestellt) | `[Name, Kontakt]` |
| Ersteller dieses Entwurfs | KI-gestützte Analyse des öffentlichen Quellcodes (Claude), auf Anforderung von `[Name]` |
| Grundlage | Repository `wattnpapa/erfassungsbogen`, Checkout-Stand 2026-09-11/12, `main`, inkl. Submodule |
| Version dieses Dokuments | 0.1 (Entwurf) |
| Datum | `[Datum der Freigabe einfügen]` |
| Nächste Überprüfung | `[Datum, spätestens bei wesentlicher Änderung der Software oder des Einsatzzwecks]` |
| Anlass der DSFA | Ersteinführung der App bei `[Organisation]` / Regelmäßige Überprüfung |

## 3. Systembeschreibung (Kurzfassung)

Ausführlich beschrieben in der [Arc42-Architekturdokumentation](arc42-architektur.md);
hier die für die DSFA relevante Kurzfassung:

- **Plattformen:** Web/PWA (erfassungsbogen.app), Windows- und Linux-Desktop
  (Electron), Android (Capacitor); iOS in Vorbereitung. Dieselbe Webfassung wird
  aus demselben Build zusätzlich als GitLab Pages auf dem Open-CoDE-Spiegel
  veröffentlicht (gleicher Code, anderer Host — siehe 5.8).
- **Keine Server-Infrastruktur.** Jede fachliche Verarbeitung läuft auf dem
  Endgerät. Keine zentrale Datenbank, keine Nutzerkonten, keine Anmeldung.
- **Datenübergabe zwischen zwei Geräten** ausschließlich über einen
  selbst-enthaltenen Kanal: QR-Code (Kamera-Scan oder USB-Handscanner),
  Datei-Export/-Import oder Nahfeld-Freigabe (AirDrop/Quick Share) — nie über
  eine Netzverbindung zwischen den beiden Geräten selbst.
- **Optionale kryptografische Signatur** (Ed25519, `@noble/ed25519`) bestätigt,
  dass ein weitergereichter Bogen unverändert vom Inhaber eines bestimmten,
  lokal erzeugten Schlüssels stammt — ohne Rückschluss auf eine reale Identität
  (kein PKI-Modell, siehe 5.4).
- **Zwei externe Netzverbindungen** außerhalb der eigentlichen Bogen-Funktion:
  (1) GoatCounter-Reichweitenmessung beim App-Start, (2) Prüfung auf neue
  Versionen bei GitHub Releases (nur Desktop-Variante) — siehe 5.8.

> *Prüfvermerk zu den Plattformen:* Der macOS-Desktop-Build ist in `release.yml`
> derzeit stillgelegt (`if: false`, Stand 2026-09-05); die Nennung von nur
> Windows und Linux ist insoweit zutreffend.

## 4. Erforderlichkeitsprüfung (Art. 35 Abs. 1, 3 DSGVO)

### 4.1 Regelbeispiele Art. 35 Abs. 3 DSGVO

| Regelbeispiel | Einschlägig? | Begründung |
| --- | --- | --- |
| (a) Systematische und umfassende Bewertung persönlicher Aspekte, automatisierte Entscheidung mit Rechtswirkung | Nein | Die App trifft keine automatisierten Entscheidungen über Personen; sie erfasst und summiert Angaben. |
| (b) Umfangreiche Verarbeitung besonderer Kategorien (Art. 9) oder strafrechtlicher Daten | Nein | Im Datenmodell existiert kein Feld für Gesundheits-, Gewerkschafts-, Religions- oder ähnliche Art.-9-Daten. Berufsbezeichnungen aus dem mitgelieferten Vokabular sind allgemeine Berufsangaben, keine Gesundheitsdaten der betroffenen Person. |
| (c) Umfangreiche systematische Überwachung öffentlich zugänglicher Bereiche | Nein | Keine Überwachungsfunktion. |

Keines der drei Regelbeispiele ist erfüllt — eine DSFA ist nach Art. 35 Abs. 3
DSGVO nicht automatisch vorgeschrieben.

### 4.2 Ergänzende WP248-Kriterien

| Kriterium | Erfüllt? | Anmerkung |
| --- | --- | --- |
| Bewertung/Scoring von Personen | Nein | — |
| Automatisierte Entscheidung mit Rechts-/ähnlicher Wirkung | Nein | — |
| Systematische Überwachung | Nein | — |
| Besondere Kategorien personenbezogener Daten / höchstpersönliche Daten | Nein | Siehe 4.1 (b) |
| Große Datenmengen (Umfang, geografische Reichweite, Anzahl Betroffener) | Teilweise | Pro Einsatz i. d. R. wenige bis einige Dutzend Personen je Einheit; bei einer Großlage am Meldekopf kumulativ mehr — im Sinne der Kriterien aber kein „großer Umfang" wie bei bundesweiten Registern. |
| Zusammenführung/Abgleich von Datensätzen aus verschiedenen Quellen | Teilweise | Der Meldekopf führt Meldungen mehrerer Einheiten zusammen — zweckgebunden innerhalb desselben Einsatzes, nicht quellenübergreifend (kein Abgleich mit externen Registern). |
| Daten von schutzbedürftigen Betroffenen | Teilweise | Erfasstes Personal steht in einem dienstlichen/ehrenamtlichen Verhältnis zur eigenen Organisation — kein besonders schutzbedürftiges Abhängigkeitsverhältnis im klassischen Sinn, aber die Einsatzsituation selbst rechtfertigt erhöhte Sorgfalt. |
| Einsatz neuer Technologien / neuartiger Verarbeitungsarten | Nein | QR-Code-Übergabe und Ed25519-Signatur sind etablierte Verfahren. |
| Verweigerung eines Dienstes/Vertrags bei fehlender Einwilligung | Nein | Keine Dienstleistung, die von einer Einwilligung abhängt. |

### 4.3 Ergebnis

Formal ist eine DSFA nach Art. 35 DSGVO für den beschriebenen
Kern-Anwendungsfall **nicht zwingend erforderlich**.

**Empfehlung dieses Entwurfs:** Die DSFA dennoch freiwillig durchzuführen, weil
(1) Personaldaten im Einsatzkontext erfasst werden, (2) die Architektur ohne
Server strukturelle Besonderheiten bei den Betroffenenrechten mit sich bringt
(Abschnitt 6.3), und (3) eine dokumentierte Prüfung im Zweifel die eigene
Sorgfalt belegt. Diese Einschätzung ist durch die/den Datenschutzbeauftragte/n
zu bestätigen, insbesondere falls landesrechtliche Vorgaben eigene Schwellenwerte
definieren.

## 5. Systematische Beschreibung der Verarbeitung (Art. 35 Abs. 7 lit. a DSGVO)

### 5.1 Zwecke der Verarbeitung

- Erfassung von Einheit, Einsatz, Personal, Fahrzeugen und Sofortbedarf durch
  eine Einheit im Einsatz- oder Übungsfall.
- Weitergabe dieser Angaben an eine Führungsstelle/einen Meldekopf ohne
  Netzverbindung.
- Zusammenführung mehrerer eingegangener Meldungen zu einer Sammelübersicht
  (Stärke- und Bedarfssummen) beim Meldekopf.
- Ausdruck als PDF im Layout des gewohnten Papierformulars, inklusive QR-Code.
- Export als CSV bzw. organisationsspezifisches Excel-Format.
- Führung der Kräfteübersicht am Meldekopf mit Eintreff- und Abrückzeit je
  Einheit und einer Notiz/einem Auftrag der Führungsstelle; Ausgabe als
  Übergabeblatt (Sammel-PDF mit eingebetteter Sammlung) und einseitiges
  Lageblatt für Wand, Ablösung und Einsatztagebuch (seit 2026-09-27); dieselben
  Angaben gehen seit 2026-09-29 auch in die Excel-Liste „Oldenburg" für die
  übergeordnete Führungsstelle. Seit 2026-09-29 steht dieser Stand in der Sammel-PDF zusätzlich über jedem Bogen
  und neben seinem QR-Code, damit ein Ausdruck ohne Seite 1 nicht eine
  abgerückte Einheit als anwesend zeigt (R2-A1). Seit 2026-09-29 (R2-A3) trägt
  das Lageblatt je Einheit auch Funkrufname und Rückrufnummer der
  Führungskraft (Nummer mit Initial und Nachname) sowie freie Zeilen zum
  handschriftlichen Nachtragen — damit die Einheit bei Geräteausfall ohne
  Gerät erreichbar bleibt.
- Weitergabe einer gespeicherten Vorlage (Stammdaten der eigenen Einheit) an ein
  anderes Gerät oder in eine vom Nutzer gewählte Ablage, damit sie
  geräteunabhängig verfügbar ist.
- Optional: Bestätigung der Herkunft eines weitergereichten Bogens durch eine
  geräteseitige digitale Signatur.
- Anonyme Reichweitenmessung der App-Nutzung (siehe 5.8).

### 5.2 Beteiligte

| Rolle | Wer | Anmerkung |
| --- | --- | --- |
| Verantwortlicher | `[einsetzende Organisation]` | Für die eigene Nutzung der App |
| Auftragsverarbeiter (Art. 28 DSGVO) | Keiner für den Kern-Anwendungsfall | Es gibt keinen Server, der im Auftrag personenbezogene Daten verarbeitet |
| Externer Dienst (Reichweitenmessung) | GoatCounter (`erfassungsbogen.goatcounter.com`) | Cookielos, kein Personenbezug zu den Erfassungsbogen-Daten; Verantwortlichkeit gesondert zu klären (siehe 5.8) |
| Empfänger innerhalb des Meldewegs | Andere Einheiten, übergeordnete Führungsstellen | Erhalten die im Bogen enthaltenen Daten über QR/Datei/Ausdruck; werden dadurch ggf. selbst zu (gemeinsam) Verantwortlichen |

### 5.3 Betroffene Personen

- **Eigenes Personal der Einheit:** Name, Funktion, ggf. Kontaktdaten (bei
  Führungskräften), Fahrerlaubnisse, Ernährungsform, Geschlecht (für
  Unterbringungsplanung).
- **Meldende/absendende Person** (freiwillig): Name, E-Mail und/oder
  Telefonnummer über die optionale „Absenderkarte".
- **Mittelbar:** Personal fremder Einheiten, sobald deren Bogen am Meldekopf
  gesammelt wird.

### 5.4 Kategorien personenbezogener Daten

| Kategorie | Felder | Pflicht/optional | Fundstelle |
| --- | --- | --- | --- |
| Identität | Vorname, Nachname | Pflicht je Personaleintrag | `Person` (`model.ts`) |
| Funktion/Qualifikation | Funktionen, Zusatzqualifikationen, Fahrerlaubnis(se), Stärke-Rolle | Teils Pflicht, teils optional | `Person` |
| Unterbringungs-/verpflegungsrelevante Angaben | Geschlecht (M/W/D), Ernährungsform (inkl. vegetarisch/vegan) | Pflicht je Personaleintrag | `Person` — kein Gesundheitsdatum im Sinne Art. 9 DSGVO, dient der Logistikplanung |
| Kontaktdaten | Telefon, E-Mail | Optional, laut Code-Kommentar „i. d. R. nur Führungskräfte" | `Kontakt` |
| Fahrzeugbezogen (potenziell personenbeziehbar) | Kennzeichen, Funkrufname | Optional | `Fahrzeug` |
| Freiwillige Absenderangabe | Name, E-Mail, Telefon | Vollständig freiwillig (Opt-in) | Absenderkarte, `docs/datenmodell.md` |
| Geräteschlüssel | Öffentlicher Ed25519-Schlüssel (kein Personenbezug für sich allein) | Automatisch, lokal erzeugt | `signatur.ts` |
| Einsatzkontext | Einsatzort/-auftrag, Zeitraum | Pflicht | `Einsatz` — kann in Verbindung mit Personaldaten mittelbar Rückschlüsse auf Aufenthaltsorte erlauben |
| Führungsstellen-Zusatz je Meldung (Einsatz-Sammlung) | Eintreffzeit, Abrückzeit, Auftrag/Notiz der Führungsstelle (Freitext) | Optional, nur am Meldekopf-Gerät | `MeldeEintrag` (App-seitige Erweiterung `src/app/eintrag-zeiten.ts`, seit 2026-09-27) — die Zeiten sind Einsatzdokumentation ohne eigenen Personenbezug; der Freitext kann Namen enthalten (z. B. Rückruf-Vermerk) und unterliegt derselben Löschung wie die Meldung (Papierkorb, Aufräumfrist); die 90-Tage-Anonymisierung erfasst ihn nicht |

**Nicht enthalten:** Gesundheitsdaten, besondere Kategorien nach Art. 9 DSGVO,
biometrische Daten, strafrechtliche Daten.

### 5.5 Verarbeitungsvorgänge / Datenfluss

- Eingabe durch die erfassende Person im Formular-Assistenten (lokal).
- Fortlaufendes Zwischenspeichern als Entwurf (`localStorage`).
- Auf „Bogen übergeben": Kodierung in ein kompaktes Binärformat, Kompression
  (DeflateRaw), optionale Signatur, Kodierung als QR-taugliche Zeichenkette
  (Base41) oder Datei-Export.
- Übergabe an ein zweites Gerät ausschließlich über den physisch/lokal
  begrenzten Kanal — zu keinem Zeitpunkt über einen Server.
- Beim Empfänger: Dekodierung, optionale Signaturprüfung (reiner Anzeigestatus,
  blockiert den Import nie), Aufnahme in die lokale Einsatz-Sammlung.
- Aggregation mehrerer Meldungen zu Summen beim Meldekopf.
- Optionaler Ausdruck (PDF) oder Tabellenexport (CSV/Excel). Übersichts-CSV,
  Lageblatt und Excel-Liste „Oldenburg" führen je Einheit auch die
  Führungsstellen-Zusätze (Eintreff-/Abrückzeit, Auftrag/Notiz als Freitext,
  siehe 5.4); die Excel-Liste enthält außerdem die Erreichbarkeit der
  Führungskraft (Name und Kontakt). Abgerückte Einheiten bleiben in allen drei
  Ausgaben sichtbar, zählen aber nicht in die Summen. In der Sammel-PDF trägt jede Bogenseite den Kasten „Stand am Meldekopf"
  (Eintreff-/Abrückzeit, Zug, Auftrag/Notiz — die Notiz ist Freitext und kann
  Personenbezug haben); der QR-Code enthält davon nichts. Wird ein Ausdruck
  über die QR-Codes wieder eingelesen, kommen nur die Bögen zurück; die App
  weist auf das Nachtragen von Hand hin (seit 2026-09-29, R2-A1).
- „Vorlage teilen": die Vorlage als signierter QR-Code/Link oder als
  unsignierte JSON-Datei (`eeb-vorlage-*.json`). Die Datei trägt nur diese
  eine Vorlage, keinen Geräteschlüssel. Beim Empfänger entsteht daraus wieder
  eine Vorlage in `localStorage`; der offene Arbeitsbogen bleibt unberührt.
  Vorlagen sind von der Datenschutzfrist ausgenommen (5.7) — eine geteilte
  Vorlage ebenso.

Eine vollständige technische Darstellung inkl. Sequenzdiagrammen findet sich in
Kapitel 6 der [Arc42-Dokumentation](arc42-architektur.md).

### 5.6 Rechtsgrundlagen (durch die einsetzende Organisation zu bestätigen)

| Verarbeitung | Mögliche Rechtsgrundlage | Anmerkung |
| --- | --- | --- |
| Erfassung von Personal-/Einsatzdaten durch BOS-Einheiten mit hoheitlichem Auftrag | Art. 6 Abs. 1 lit. e DSGVO i. V. m. `[einschlägiges Landesgesetz, z. B. THW-Gesetz, Feuerwehrgesetz des Landes]` | Regelfall für Behörden/öffentlich-rechtliche Organisationen |
| Erfassung durch privatrechtlich organisierte Hilfsorganisationen ohne hoheitlichen Auftrag | Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Einsatzfähigkeit) oder vertragliche/mitgliedschaftliche Grundlage | Im Einzelfall zu prüfen |
| Freiwillige Absenderkarte | Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch aktives Opt-in) | Nichtausfüllen hat keine Nachteile |
| Anonyme Reichweitenmessung (GoatCounter) | Art. 6 Abs. 1 lit. f DSGVO — so im Quellcode dokumentiert (`src/app/statistik.ts`) | Kein Personenbezug zu den Bogen-Inhalten; siehe 5.8 |

> *Prüfvermerk:* Der Kopfkommentar von `src/app/statistik.ts` nennt ausdrücklich
> Art. 6 Abs. 1 lit. f DSGVO und begründet, weshalb § 25 TDDDG nicht greift
> (keine Cookies, kein Storage-Zugriff, keine geräteübergreifende ID).

### 5.7 Speicherdauer und Löschung

- **Datenschutzfrist (technisch erzwungen):** 90 Tage nach der letzten Änderung
  eines Bogens (`stand`) entfernt die App die personenbezogenen Angaben
  dauerhaft. Das sind Namen, Funktionen, Zusatzqualifikationen,
  Fahrerlaubnisse, Kontakte der Personen, Telefon/E-Mail der
  Hierarchie-Ebenen und der Freitext „Sonstiges". Stärke, Unterbringung und
  Verpflegung bleiben als Summen erhalten.
  - **Wirkt auf:** jeden eingelesenen Bogen (Scan, Link, Datei/PDF,
    Einsatz-Import), jede Meldung einer Einsatz-Sammlung (samt empfangenem
    Rohpayload und Signaturnachweis mit Absenderangaben) und den Entwurf. Die
    Regel steht in `vendor/eeb-format/src/datenschutzfrist.ts` und leitet sich
    ohne Schemafeld aus `stand` ab. Sie greift damit auch für alle vor ihrer
    Einführung verteilten QR-Codes.
  - **Ausgenommen:** Bögen mit dem Haken „Dies ist eine Übung" (UI-Hinweis
    beim Haken und im Übungs-Störer) sowie „Meine Vorlagen" als Stammdaten der
    eigenen Einheit. Beide bleiben unbefristet gespeichert, bis sie manuell
    gelöscht werden.
  - **Grenze:** Der QR-Code selbst, das eingebettete JSON im PDF und
    CSV-/Excel-Exporte bleiben unverändert und unverschlüsselt. Ein fremder
    Decoder oder eine ältere App-Version liest sie vollständig. Die Frist ist
    eine Speicherbegrenzung in der App, kein Schutz des Transportwegs und keine
    Anonymisierung im Rechtssinn für bereits weitergegebene Kopien.
- **Aufräumfrist ruhender Einsatz-Sammlungen:** Eine Sammlung, die 90 Tage
  nicht geändert wurde, löscht die App endgültig (Ankündigung ab Tag 60).
  Mit ihr gehen auch die Zusatzfelder je Meldung (Eintreff-/Abrückzeit,
  Notiz und Vermerke der Führungsstelle) und die Merkung der zuletzt offenen Sammlung
  (`eeb.letzterEinsatz.v1`, ohne Personenbezug, 12 Stunden gültig). Seit
  2026-09-29 nennt die Startseite eine so gelöschte Sammlung danach einmal
  beim Namen (Zeitraum, Zahl der Meldungen), bis „Verstanden" gedrückt wird
  (`eeb.aufgeraeumt.v1`, `src/app/aufraeum-hinweis.ts`; nur Sammlungsname und
  Zahlen, keine Personendaten; Audit Runde 2, R2-D5).
- **Lageblatt-Stand (seit 2026-09-29, R2-A3):** Zeitpunkt des zuletzt
  erzeugten Lageblatts und die Kennungen der Meldungen darauf
  (`eeb.lageblatt-stand.v1`, `src/app/export-stand.ts`) — wie der
  Export-Stand ohne Personendaten, fällt mit „Alle Daten löschen" weg.
- Eine **Papierkorb-Funktion** existiert (`sicherung.ts`, `vorlagen.ts`,
  `@bos/meldekopf/papierkorb`): gelöschte Einträge lassen sich vor endgültiger
  Löschung wiederherstellen.
- **Einzelne Meldung entfernen (seit 2026-09-29 vollständig):** „Entfernen" an
  einer Einheit der Einsatz-Sammlung löscht alle ihre Fassungen samt
  Zusatzfeldern (`einheitEntfernen`, `src/app/eintrag-zeiten.ts`). Vorher
  blieb bei Folgemeldungen die ältere Fassung mit ihren Personendaten stehen
  (Audit Runde 2, R2-D1). Der Rückweg „Rückgängig" lebt nur im Arbeitsspeicher
  der offenen Ansicht, nicht im Gerätespeicher, und endet, sobald die
  Quittung geschlossen, von einer neueren ersetzt oder die Ansicht verlassen
  wird. Seit 2026-09-29 merkt sich die
  App die Kennungen der entfernten Einträge (`eeb.entfernt.v1`, nur zufällige
  Kennungen, `src/app/entfernte-meldungen.ts`): Bringt ein „Einsatz
  importieren…" eine davon zurück, wird gefragt, und ohne Zustimmung bleibt sie
  draußen (R2-D4) — eine entfernte Meldung samt Personendaten kehrt also nicht
  still in den Speicher zurück.
- **Sicherung einspielen:** ersetzt alle App-Daten des Geräts ohne
  Papierkorb (`src/app/sicherung.ts`). Seit 2026-09-29 nennt die Rückfrage
  die laufenden Sammlungen mit Namen und Meldungszahl sowie den Inhalt der
  Datei, bietet „Vorher Sicherung erstellen…" an und verlangt einen Haken,
  sobald laufende Sammlungen betroffen sind (Audit Runde 2, R2-D3) — damit
  gehen fremde Meldungen nicht mehr unbemerkt verloren (Verfügbarkeit).
- **Verfügbarkeit (seit 2026-09-29, R2-O6):** Der Browser darf den lokalen
  Speicher einer Website räumen; dann wären auch fremde Meldungen verloren,
  bevor sie weitergegeben sind. Die Web-App bittet deshalb um dauerhaften
  Speicher (`navigator.storage.persist`), sobald Sammlungen mit Meldungen oder
  Vorlagen vorliegen, zeigt den Status und die letzte Sicherung in der
  Datensicherung (`eeb.sicherung.zuletzt.v1`, nur ein Zeitpunkt) und erinnert
  in der Fußzeile nach drei Tagen ohne Sicherung. Dauerhafter Speicher
  verlängert die Speicherdauer nicht über die Fristen oben hinaus; er
  verhindert nur die Räumung durch den Browser. Die Sicherungsdatei selbst
  enthält Personendaten und den privaten Schlüssel — ihre Ablage ist
  organisatorisch zu regeln.
- **Strukturelle Grenze:** Sobald ein Bogen als QR-Code gescannt, als PDF
  gedruckt oder als Datei exportiert wurde, hat die App auf diese Kopien keinen
  Zugriff mehr (vertiefend 6.3).
- **Export-Stand (seit 2026-09-27):** Damit der Meldekopf dem Stab nur die seit
  dem letzten Export neuen Bögen nachliefern kann, merkt sich die App je
  Einsatz-Sammlung die Kennungen der bereits exportierten Meldungen und den
  Zeitpunkt (`src/app/export-stand.ts`, `eeb.export-stand.v1`). Das sind keine
  Personendaten; der Eintrag wird mit „Alle Daten löschen" entfernt und beim
  nächsten Export um Stände endgültig gelöschter Sammlungen bereinigt. Er
  verkleinert die Zahl der weitergegebenen Kopien (Datenminimierung beim
  Empfänger), ersetzt aber keine Löschregel dort.
- **Rückholplatz des Entwurfs (seit 2026-09-28 mit Vorrang für den eigenen
  Bogen):** Ein verdrängter oder verworfener Bogen liegt auf genau einem
  Rückholplatz (`eeb.entwurf.ersetzt.v1`, dieselbe Datenschutzfrist wie der
  Entwurf) und wird vom nächsten verdrängten Bogen überschrieben; die
  Rückfrage nennt das. Die Erfassung einer fremden Einheit am Meldekopf
  (Marke `fremd` am Entwurf, nur die Kennung der Ziel-Sammlung) verdrängt dort
  keinen eigenen Bogen, sondern wird nach Rückfrage verworfen — sie ist noch
  in keiner Sammlung und muss neu erfasst werden (`src/app/entwurf.ts`).
- **Empfehlung:** eine eigene, dokumentierte Löschfrist für digital gespeicherte
  Bögen und für Papierausdrucke festlegen, da die Software selbst keine erzwingt.
- **Geräteschlüssel:** Der private Signaturschlüssel lässt sich einzeln
  verwerfen — „Geräteschlüssel neu erzeugen" in der Fußzeile löscht ihn nach
  einer Rückfrage und setzt sofort ein neues Paar
  (`src/app/geraete-schluessel.ts`). Gedacht ist der Weg für den Verdacht einer
  Kompromittierung; die Bogendaten bleiben dabei unangetastet. Empfänger müssen
  die Kurzform danach neu abgleichen.

### 5.8 Empfänger und Datenübermittlung an Dritte

| Übermittlung | Ziel | Enthält Bogen-/Personaldaten? | Rechtsgrundlage/Anmerkung |
| --- | --- | --- | --- |
| QR-Code/Datei-Weitergabe im Meldeweg | Nächste Einheit/Führungsstelle | Ja, zweckgemäß | Kernfunktion der App, siehe 5.6 |
| Vorlage teilen (Link/Datei) | Vom Nutzer gewählt: eigenes zweites Gerät, Messenger, Mail, Cloud-Ablage | Ja — Namen, Funktionen, Fahrerlaubnisse und Erreichbarkeiten der ganzen Mannschaft | Die App überträgt selbst nichts, sie erzeugt nur Link bzw. Datei; der Dialog weist vor dem Teilen auf den Inhalt hin. Legt ein Nutzer die Datei in einen Cloud-Dienst, ist dieser Dienst Empfänger im Sinne der DSGVO. `[einsetzende Organisation: zulässige Ablageorte für Vorlagen festlegen]` |
| GoatCounter-Zählpixel | `erfassungsbogen.goatcounter.com` | Nein — laut Quellcode werden nur Pfad, Titel, Referrer und Geräteklasse (iOS/Android/Desktop) übertragen, keine Cookies, keine geräteübergreifende ID, keine Bogen-Inhalte | Art. 6 Abs. 1 lit. f DSGVO; ein Widerspruch (Art. 21 DSGVO) ist über einen dokumentierten URL-Parameter (`skipgc`) technisch vorgesehen |
| Update-Prüfung (nur Desktop) | GitHub Releases | Nein, nur technische Metadaten der Anfrage (u. a. IP-Adresse als Transportdatum) | Berechtigtes Interesse an sicherem, aktuellem Software-Stand |
| Abruf der Webfassung | GitHub Pages (erfassungsbogen.app) **oder** GitLab Pages auf Open CoDE (`gitlab.opencode.de`) | Nein, nur technische Metadaten der Anfrage (u. a. IP-Adresse als Transportdatum) | Ausliefern der Anwendung selbst. Welcher der beiden Hoster diese Metadaten sieht, entscheidet allein die aufgerufene Adresse; der ausgelieferte Code ist identisch. Bei der Open-CoDE-Fassung liegt das Hosting bei der Betreiberin der Plattform — für Verwaltungen kann genau das der Grund für diesen Weg sein |

**Offene Detailfrage für die einsetzende Organisation:** Wer im Sinne der DSGVO
für die GoatCounter-Messung verantwortlich ist (der Projektbetreiber bei Nutzung
der offiziellen App-Auslieferung, oder die einsetzende Organisation bei einem
eigenen Build), sollte geklärt und ggf. in einer Auftragsverarbeitungs- oder
Verantwortlichkeitsvereinbarung festgehalten werden. Ebenso ist zu prüfen, ob
die IP-Adresse als technisch unvermeidbares Transportdatum bei GoatCounter
selbst protokolliert wird.

## 6. Bewertung der Notwendigkeit und Verhältnismäßigkeit (Art. 35 Abs. 7 lit. b DSGVO)

### 6.1 Zweckbindung und Datenminimierung

Die Software zeigt an mehreren Stellen erkennbare Datensparsamkeit „by Design":

- Die Absenderkarte ist vollständig optional (Opt-in) und wird ohne Eingabe als
  „keine Karte" kodiert.
- Kontaktdaten (Telefon/E-Mail) sind laut Code-Kommentar „i. d. R. nur
  Führungskräfte" vorgesehen.
- Es gibt kein Freitext-Feld für beliebige Zusatzangaben zu Personen außerhalb
  der definierten, zweckgebundenen Felder.
- Die QR-Kapazitätsgrenze (Zielgröße ≤ Version 18) wirkt als technischer Druck
  gegen das Anhäufen unnötiger Felder.
- Excel-/CSV-Export ist bewusst gegen Formel-Injection abgesichert — ein Zeichen
  dafür, dass beim Datenexport auch die Integrität der Empfängerseite
  mitgedacht wurde.

### 6.2 Richtigkeit und Speicherbegrenzung

Schema-Migrationen (`hilfen.ts`) verhindern, dass ältere Datensätze mit
veralteten Feldbedeutungen fehlinterpretiert werden. Eine inhaltliche
Richtigkeitsprüfung der Nutzereingaben findet — erwartungsgemäß für ein
Erfassungswerkzeug — nicht statt.

Die **Speicherbegrenzung** (Art. 5 Abs. 1 lit. e DSGVO) setzt die App seit
2026-09-13 technisch um: Nach der Datenschutzfrist von 90 Tagen (5.7) sind die
Personaldaten eines Bogens in der App nicht mehr vorhanden. Dahinter steht
Datenschutz durch Technikgestaltung nach Art. 25 DSGVO. Die Speicherbegrenzung
hängt damit nicht mehr allein an einer Dienstanweisung. Sie wirkt auch auf
Kopien in anderen App-Installationen, soweit diese einen Stand mit Frist
nutzen.

Zwei Einschränkungen bleiben:
- **Übungsbögen** sind bewusst ausgenommen (R11/M11).
- **Kein Schutz gegen Absicht:** Wer den unverschlüsselten QR-Code mit einem
  eigenen Decoder liest oder die Geräteuhr zurückstellt, umgeht die Frist. Sie
  ist deshalb als Zugriffshürde und Speicherbegrenzung zu werten, nicht als
  Anonymisierung der übermittelten Daten.

### 6.3 Betroffenenrechte in einem dezentralen System — strukturelle Grenze

Dies ist der wichtigste Verhältnismäßigkeitsaspekt der gesamten Architektur:

Weil es keine zentrale Instanz gibt, die alle Kopien eines Bogens kennt, kann
niemand — auch nicht die ursprünglich erfassende Organisation — nach einer
Weitergabe zusichern, wo überall eine Kopie der Daten noch existiert. Das
betrifft insbesondere:

- **Auskunftsrecht (Art. 15 DSGVO):** durchsetzbar nur gegenüber der jeweils
  datenverarbeitenden Stelle, bei der die Daten aktuell liegen — nicht zentral
  über „die App".
- **Recht auf Löschung (Art. 17 DSGVO):** die erfassende Organisation kann ihre
  eigene lokale Kopie löschen, aber nicht die eines Bogens, der bereits
  weitergereicht oder ausgedruckt wurde.
- **Berichtigung (Art. 16 DSGVO):** eine Korrektur wirkt nur auf zukünftig neu
  erzeugte Exporte, nicht auf bereits verteilte Kopien.

Dies ist kein Software-Mangel, sondern eine bewusste Architekturentscheidung
(kein Server = kein zentraler Angriffspunkt, keine Cloud-Abhängigkeit, volle
Funktion ohne Internet) — mit der Kehrseite, dass Betroffenenrechte
organisatorisch statt technisch sichergestellt werden müssen. **Empfehlung:** Die
einsetzende Organisation sollte in ihrer Datenschutzinformation transparent
machen, dass ein einmal weitergereichter oder ausgedruckter Bogen wie ein
physisches Dokument zu behandeln ist, und Verfahrensanweisungen für den Umgang
mit Auskunfts-/Löschanfragen festlegen.

### 6.4 Transparenz

Die App selbst enthält keine eingebaute Datenschutzerklärung für Endnutzer
(nicht Teil des analysierten Codes) — typisch für eine reine Client-Anwendung,
muss aber von der einsetzenden Organisation nachgeholt werden (z. B. als
Aushang/Dienstanweisung).

## 7. Risikobewertung (Art. 35 Abs. 7 lit. c DSGVO)

Schutzziele in Anlehnung an das Standard-Datenschutzmodell (SDM): Vertraulichkeit
(V), Integrität (I), Verfügbarkeit (Vf), Transparenz (T), Intervenierbarkeit
(Iv), Nichtverkettung (N).

| # | Risiko | Schutzziel | Eintrittswahrscheinlichkeit | Schwere für Betroffene | Gesamt |
| --- | --- | --- | --- | --- | --- |
| R1 | Verlust/Diebstahl eines Geräts mit unverschlüsseltem `localStorage` → Zugriff auf die lokal gespeicherten Bögen und die Absenderkarte | V | Mittel | ~~Mittel~~ → Niedrig-Mittel: seit der Datenschutzfrist (5.7) nur noch Personaldaten der letzten 90 Tage, dazu Übungsbögen und Vorlagen | ~~Mittel~~ → Niedrig-Mittel |
| R2 | Verlust/Fehlleitung eines gedruckten PDF- oder exportierten CSV/Excel-Dokuments | V | Mittel | Mittel | Mittel (von der Datenschutzfrist nicht erfasst) |
| R3 | ~~Kein technisch erzwungener Löschzeitpunkt~~ → **Datenschutzfrist umgesetzt** (5.7): nach 90 Tagen anonymisiert. Offen bleiben Übungsbögen und Vorlagen ohne Frist | Vf/T | ~~Hoch~~ → Niedrig (nur noch fristfreie Übungsbögen/Vorlagen) | Niedrig-Mittel | ~~Mittel~~ → Niedrig |
| R4 | Diebstahl/Auslesen des privaten Signaturschlüssels vom Gerät (unverschlüsselt im `localStorage`) → Signieren im Namen des Geräts | I | Niedrig | Niedrig (Trust-Modell ist ohnehin nur TOFU; der Schlüssel ist über die Fußzeile austauschbar, siehe 5.7) | Niedrig |
| R5 | ~~Speicher-Überlastung durch präparierte Import-Datei (fehlende Obergrenze bei der Dekomprimierung)~~ **behoben mit `c7604e9`** (`inflateRawBegrenzt`, Deckel 4 MiB) | Vf | Niedrig | Niedrig (Verfügbarkeits-, kein Vertraulichkeitsrisiko) | ~~Niedrig~~ → Sehr niedrig |
| R6 | Keine Verkettbarkeits-Kontrolle: Kennzeichen/Funkrufname in Sammel-Exporten könnten über mehrere Einsätze hinweg dieselbe Person/Fahrzeug wiedererkennbar machen | N | Niedrig-Mittel | Niedrig | Niedrig |
| R7 | Fehlende eigene Zugriffssperre der App (verlässt sich auf Betriebssystem-/Gerätesperre) | V | Mittel | Niedrig-Mittel | Niedrig-Mittel |
| R8 | Strukturelle Grenze der Betroffenenrechte bei bereits weitergereichten Kopien (6.3) | Iv | Hoch (systembedingt) | Niedrig-Mittel | ~~Mittel~~ → Niedrig-Mittel: digitale Kopien in anderen App-Installationen (ab dem Stand mit Datenschutzfrist) verfallen nach 90 Tagen von selbst; Papier, Exporte und der QR-Inhalt selbst nicht |
| R9 | GoatCounter/Update-Check als einzige Netzwerkkontaktpunkte — technische Metadaten (IP-Adresse) fallen bei einem Dritten an | T | Hoch (jeder Aufruf) | Sehr niedrig | Niedrig |
| R10 | **Neu mit der Datenschutzfrist:** unumkehrbarer Verlust der Personaldaten im laufenden Einsatz — durch eine falsch vorgehende Geräteuhr oder eine Lage, die länger als 90 Tage ohne Bearbeitung des Bogens läuft | Vf | Niedrig (Uhrsprünge über 366 Tage werden erst nach Bestätigung einen Tag später übernommen; Ankündigung 14 Tage vor Ablauf; jede Bearbeitung startet die Frist neu) | Niedrig-Mittel (Stärke und Summen bleiben erhalten, Namen fehlen) | Niedrig |
| R11 | **Neu mit der Datenschutzfrist:** Übungsbögen sind von der Frist ausgenommen — enthalten sie echte Personaldaten, liegen diese unbefristet auf den Geräten | V | Mittel (Übungen mit echtem Personal sind üblich) | Niedrig-Mittel | Niedrig-Mittel |

**Höchste Einzelrisiken:** R1 (Geräteverlust), R2 (Papier-/Exportverlust) und R8
(strukturelle Grenze der Betroffenenrechte) — alle drei primär organisatorisch.

## 8. Abhilfemaßnahmen (Art. 35 Abs. 7 lit. d DSGVO)

| # | Bezug | Maßnahme | Art | Verantwortlich | Restrisiko nach Umsetzung |
| --- | --- | --- | --- | --- | --- |
| M1 | R1 | Verbindliche Geräte-Bildschirmsperre (PIN/Biometrie) als Dienstanweisung; wo verfügbar, Festplatten-/Profilverschlüsselung aktivieren | Organisatorisch/technisch | `[Organisation/IT-Verantwortliche/r]` | Niedrig |
| M2 | R1, R4 | Perspektivisch: Ablage sensibler Daten über plattformeigene sichere Speicher (z. B. Electron `safeStorage`/Betriebssystem-Schlüsselbund) statt `localStorage` — als Hinweis an den Projektbetreiber | Technisch (Weiterentwicklung) | `[Projektbetreiber/Maintainer]` | Niedrig (nach Umsetzung) |
| M2a | R4 | Bei Verdacht auf Kompromittierung eines Geräts den Signaturschlüssel über „Geräteschlüssel neu erzeugen" (Fußzeile) austauschen und die neue Kurzform an Meldekopf/Führungsstelle geben; Zuständigkeit und Weg dafür festlegen | Organisatorisch (technische Grundlage vorhanden) | `[Organisation]` | Niedrig |
| M3 | R2, R8 | Dienstanweisung: gedruckte/exportierte Bögen wie das bisherige Papierformular behandeln (Aufbewahrung, Zugriffsschutz, dokumentierte Vernichtung) | Organisatorisch | `[Organisation]` | Niedrig-Mittel |
| M4 | R3 | ~~Eigene, dokumentierte Löschfrist für digital gespeicherte Bögen festlegen~~ **Technisch umgesetzt:** Datenschutzfrist von 90 Tagen (5.7). Für die Organisation bleibt: prüfen, ob 90 Tage zum eigenen Zweck passen, eine Frist für Papierausdrucke und Exporte festlegen und die Papierkorb-Funktion in einer Kurzanleitung erklären | Technisch (umgesetzt) / Organisatorisch | `[Organisation/Datenschutzbeauftragte/r]` | Niedrig |
| M5 | R8 | Verfahrensanweisung für Auskunfts-/Löschanfragen, die auch bereits weitergereichte Bögen einschließt | Organisatorisch | `[Organisation/Datenschutzbeauftragte/r]` | Niedrig-Mittel |
| M6 | R5 | **Erledigt (`c7604e9`):** Obergrenze für die Größe dekomprimierter Importe ist umgesetzt (`MAX_ENTPACKT = 4 MiB`, streamend geprüft). Für die Organisation bleibt: eine App-Version ab diesem Stand einsetzen | Technisch (umgesetzt) | `[Projektbetreiber/Maintainer]` | erledigt |
| M7 | R6 | Bei organisationsübergreifenden Sammel-Exporten prüfen, ob Kennzeichen/Funkrufname wirklich benötigt werden, und optionale Felder leer lassen | Organisatorisch | `[erfassende/exportierende Person]` | Sehr niedrig |
| M8 | R7 | App-eigene Zugriffssperre ist nicht vorgesehen — ersatzweise über Geräterichtlinie (M1) sicherstellen | Organisatorisch | `[Organisation]` | Niedrig |
| M9 | R9, 5.8 | Vor Produktivbetrieb klären, wer für die GoatCounter-Messung verantwortlich ist und ob eine Vereinbarung nach Art. 26 oder 28 DSGVO nötig ist; alternativ Widerspruchsparameter (`skipgc`) organisationsweit hinterlegen | Organisatorisch/rechtlich | `[Organisation/Datenschutzbeauftragte/r]` | Sehr niedrig |
| M10 | 6.4 | Eigene Datenschutzinformation für Nutzer/Personal erstellen (Zweck, Speicherort, Rechte, Kontakt) | Organisatorisch | `[Organisation]` | — (Transparenzpflicht) |
| M11 | R11 | Dienstanweisung: In als Übung gekennzeichnete Bögen nur Personaldaten eintragen, deren unbefristete Speicherung vertretbar ist (sonst Beispielnamen oder Stärke-Erfassung nutzen); Übungsbögen nach der Übung manuell löschen. Die App weist beim Übungshaken und im Übungs-Störer darauf hin | Organisatorisch (technischer Hinweis vorhanden) | `[Organisation]` | Niedrig |
| M12 | R10 | Bei Lagen, die länger als 90 Tage laufen, die Bögen aktiv fortschreiben oder rechtzeitig als PDF sichern; die App kündigt die Anonymisierung 14 Tage vorher an | Organisatorisch | `[erfassende Person/Meldekopf]` | Niedrig |

## 9. Konsultation

- **Interne Konsultation (Art. 35 Abs. 2 DSGVO):** Diese Vorlage ist vor Freigabe
  der/dem behördlichen bzw. betrieblichen Datenschutzbeauftragten vorzulegen.
  Wurde sie eingeholt? `[Ja/Nein, Datum, Name]`
- **Anhörung Betroffener/Personalvertretung** (soweit einschlägig):
  `[ggf. Personalrat/Betriebsrat/Vertrauensleute einbinden]`
- **Konsultation der Aufsichtsbehörde (Art. 36 DSGVO):** Nur erforderlich, falls
  nach Umsetzung der Maßnahmen ein hohes Restrisiko verbleibt. Nach dieser
  Einschätzung ist das nicht der Fall — vorbehaltlich der Bestätigung durch
  die/den Datenschutzbeauftragte/n.

## 10. Ergebnis und Freigabe

**Gesamteinschätzung:** Unter der Voraussetzung, dass die in Abschnitt 8
aufgeführten organisatorischen Maßnahmen (insbesondere M1, M3, M4, M5) umgesetzt
werden, verbleibt ein geringes bis gering-mittleres Restrisiko für die Rechte und
Freiheiten der betroffenen Personen. Ein hohes Risiko im Sinne des Art. 36 DSGVO
wird nicht gesehen.

Seit der technischen Datenschutzfrist (2026-09-13, 5.7) stützt sich diese
Einschätzung weniger auf organisatorische Maßnahmen:
- **M4:** Die Löschfrist für digital gespeicherte Bögen ist in der App
  umgesetzt.
- **R1, R3 und R8** sind gesunken.
- **Neu hinzugekommen** sind die niedrigen Risiken R10 und R11 mit den
  Maßnahmen M11 und M12.
- **Unverändert** hängt das Ergebnis an M1, M3 und M5 für Geräte, Papier,
  Exporte und bereits weitergegebene Kopien.

Diese Einschätzung ersetzt keine rechtliche Prüfung.

| Rolle | Name | Datum | Unterschrift |
| --- | --- | --- | --- |
| Verantwortlicher/Leitung | `[Name]` | | |
| Datenschutzbeauftragte/r | `[Name]` | | |
| Ersteller/in dieses Entwurfs | KI-gestützte Analyse (Claude), fachlich zu verantworten durch `[Name]` | 2026-09-12 | |

## Anhang: Herangezogene Quellen

- `docs/datenmodell.md` — Datenmodell, QR-Payload-Format, Absenderkarte, Signaturkette
- `vendor/eeb-format/src/model.ts` — Feldebene der Entitäten Person, Fahrzeug, Einheit, Einsatz, Sofortbedarf
- `vendor/eeb-format/src/signatur.ts` — Schlüsselerzeugung, Signatur, Verifikation
- `src/app/geraete-schluessel.ts`, `src/app/speicher-browser.ts` — lokale Speicherung, Schlüsselablage
- `src/app/statistik.ts` — Reichweitenmessung (GoatCounter), dokumentierte Rechtsgrundlage im Code-Kommentar
- `src/app/csv.ts`, `src/app/xlsx.ts` — Export-Formate und deren Absicherung
- `src/app/sicherung.ts`, `src/app/vorlagen.ts` — Papierkorb-/Löschfunktion
- `PRODUCT.md`, `docs/entwicklung.md` — Produktkontext und technische Gesamtübersicht
- [Arc42-Architekturdokumentation](arc42-architektur.md) und
  [Informationssicherheitskonzept](informationssicherheitskonzept.md) dieses Projekts
