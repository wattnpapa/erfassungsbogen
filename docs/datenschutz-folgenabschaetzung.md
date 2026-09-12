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
  (Electron), Android (Capacitor); iOS in Vorbereitung.
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
- Optionaler Ausdruck (PDF) oder Tabellenexport (CSV/Excel).

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

- **Keine automatische Löschfrist.** Daten verbleiben im `localStorage` des
  jeweiligen Geräts, bis sie manuell gelöscht werden oder der Browser-/App-
  Speicher geleert wird.
- Eine **Papierkorb-Funktion** existiert (`sicherung.ts`, `vorlagen.ts`,
  `@bos/meldekopf/papierkorb`): gelöschte Einträge lassen sich vor endgültiger
  Löschung wiederherstellen.
- **Strukturelle Grenze:** Sobald ein Bogen als QR-Code gescannt, als PDF
  gedruckt oder als Datei exportiert wurde, hat die App auf diese Kopien keinen
  Zugriff mehr (vertiefend 6.3).
- **Empfehlung:** eine eigene, dokumentierte Löschfrist für digital gespeicherte
  Bögen und für Papierausdrucke festlegen, da die Software selbst keine erzwingt.

### 5.8 Empfänger und Datenübermittlung an Dritte

| Übermittlung | Ziel | Enthält Bogen-/Personaldaten? | Rechtsgrundlage/Anmerkung |
| --- | --- | --- | --- |
| QR-Code/Datei-Weitergabe im Meldeweg | Nächste Einheit/Führungsstelle | Ja, zweckgemäß | Kernfunktion der App, siehe 5.6 |
| GoatCounter-Zählpixel | `erfassungsbogen.goatcounter.com` | Nein — laut Quellcode werden nur Pfad, Titel, Referrer und Geräteklasse (iOS/Android/Desktop) übertragen, keine Cookies, keine geräteübergreifende ID, keine Bogen-Inhalte | Art. 6 Abs. 1 lit. f DSGVO; ein Widerspruch (Art. 21 DSGVO) ist über einen dokumentierten URL-Parameter (`skipgc`) technisch vorgesehen |
| Update-Prüfung (nur Desktop) | GitHub Releases | Nein, nur technische Metadaten der Anfrage (u. a. IP-Adresse als Transportdatum) | Berechtigtes Interesse an sicherem, aktuellem Software-Stand |

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
| R1 | Verlust/Diebstahl eines Geräts mit unverschlüsseltem `localStorage` → Zugriff auf alle lokal gespeicherten Bögen und die Absenderkarte | V | Mittel | Mittel (Namen, Kontaktdaten, ggf. Fahrzeugkennzeichen mehrerer Personen) | Mittel |
| R2 | Verlust/Fehlleitung eines gedruckten PDF- oder exportierten CSV/Excel-Dokuments | V | Mittel | Mittel | Mittel |
| R3 | Kein technisch erzwungener Löschzeitpunkt → Daten verbleiben ggf. länger als nötig auf Geräten | Vf/T | Hoch (Standardverhalten ohne organisatorische Vorgabe) | Niedrig-Mittel | Mittel |
| R4 | Diebstahl/Auslesen des privaten Signaturschlüssels vom Gerät (unverschlüsselt im `localStorage`) → Signieren im Namen des Geräts | I | Niedrig | Niedrig (Trust-Modell ist ohnehin nur TOFU) | Niedrig |
| R5 | ~~Speicher-Überlastung durch präparierte Import-Datei (fehlende Obergrenze bei der Dekomprimierung)~~ **behoben mit `c7604e9`** (`inflateRawBegrenzt`, Deckel 4 MiB) | Vf | Niedrig | Niedrig (Verfügbarkeits-, kein Vertraulichkeitsrisiko) | ~~Niedrig~~ → Sehr niedrig |
| R6 | Keine Verkettbarkeits-Kontrolle: Kennzeichen/Funkrufname in Sammel-Exporten könnten über mehrere Einsätze hinweg dieselbe Person/Fahrzeug wiedererkennbar machen | N | Niedrig-Mittel | Niedrig | Niedrig |
| R7 | Fehlende eigene Zugriffssperre der App (verlässt sich auf Betriebssystem-/Gerätesperre) | V | Mittel | Niedrig-Mittel | Niedrig-Mittel |
| R8 | Strukturelle Grenze der Betroffenenrechte bei bereits weitergereichten Kopien (6.3) | Iv | Hoch (systembedingt) | Niedrig-Mittel | Mittel |
| R9 | GoatCounter/Update-Check als einzige Netzwerkkontaktpunkte — technische Metadaten (IP-Adresse) fallen bei einem Dritten an | T | Hoch (jeder Aufruf) | Sehr niedrig | Niedrig |

**Höchste Einzelrisiken:** R1 (Geräteverlust), R2 (Papier-/Exportverlust) und R8
(strukturelle Grenze der Betroffenenrechte) — alle drei primär organisatorisch.

## 8. Abhilfemaßnahmen (Art. 35 Abs. 7 lit. d DSGVO)

| # | Bezug | Maßnahme | Art | Verantwortlich | Restrisiko nach Umsetzung |
| --- | --- | --- | --- | --- | --- |
| M1 | R1 | Verbindliche Geräte-Bildschirmsperre (PIN/Biometrie) als Dienstanweisung; wo verfügbar, Festplatten-/Profilverschlüsselung aktivieren | Organisatorisch/technisch | `[Organisation/IT-Verantwortliche/r]` | Niedrig |
| M2 | R1, R4 | Perspektivisch: Ablage sensibler Daten über plattformeigene sichere Speicher (z. B. Electron `safeStorage`/Betriebssystem-Schlüsselbund) statt `localStorage` — als Hinweis an den Projektbetreiber | Technisch (Weiterentwicklung) | `[Projektbetreiber/Maintainer]` | Niedrig (nach Umsetzung) |
| M3 | R2, R8 | Dienstanweisung: gedruckte/exportierte Bögen wie das bisherige Papierformular behandeln (Aufbewahrung, Zugriffsschutz, dokumentierte Vernichtung) | Organisatorisch | `[Organisation]` | Niedrig-Mittel |
| M4 | R3 | Eigene, dokumentierte Löschfrist für digital gespeicherte Bögen festlegen und die Papierkorb-Funktion in einer Kurzanleitung erklären | Organisatorisch | `[Organisation/Datenschutzbeauftragte/r]` | Niedrig |
| M5 | R8 | Verfahrensanweisung für Auskunfts-/Löschanfragen, die auch bereits weitergereichte Bögen einschließt | Organisatorisch | `[Organisation/Datenschutzbeauftragte/r]` | Niedrig-Mittel |
| M6 | R5 | **Erledigt (`c7604e9`):** Obergrenze für die Größe dekomprimierter Importe ist umgesetzt (`MAX_ENTPACKT = 4 MiB`, streamend geprüft). Für die Organisation bleibt: eine App-Version ab diesem Stand einsetzen | Technisch (umgesetzt) | `[Projektbetreiber/Maintainer]` | erledigt |
| M7 | R6 | Bei organisationsübergreifenden Sammel-Exporten prüfen, ob Kennzeichen/Funkrufname wirklich benötigt werden, und optionale Felder leer lassen | Organisatorisch | `[erfassende/exportierende Person]` | Sehr niedrig |
| M8 | R7 | App-eigene Zugriffssperre ist nicht vorgesehen — ersatzweise über Geräterichtlinie (M1) sicherstellen | Organisatorisch | `[Organisation]` | Niedrig |
| M9 | R9, 5.8 | Vor Produktivbetrieb klären, wer für die GoatCounter-Messung verantwortlich ist und ob eine Vereinbarung nach Art. 26 oder 28 DSGVO nötig ist; alternativ Widerspruchsparameter (`skipgc`) organisationsweit hinterlegen | Organisatorisch/rechtlich | `[Organisation/Datenschutzbeauftragte/r]` | Sehr niedrig |
| M10 | 6.4 | Eigene Datenschutzinformation für Nutzer/Personal erstellen (Zweck, Speicherort, Rechte, Kontakt) | Organisatorisch | `[Organisation]` | — (Transparenzpflicht) |

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
