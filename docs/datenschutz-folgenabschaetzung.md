# Datenschutz-Folgenabschätzung

**Digitaler Einheiten-Erfassungsbogen — Vorlage/Entwurf**
Grundlage: Repository `wattnpapa/erfassungsbogen`, Stand 2026-11-28 — Version 0.1 (Entwurf)

> Diese Markdown-Datei ist die gepflegte Fassung (ursprünglich aus
> `DSFA-Erfassungsbogen.docx`). Der Text beschreibt den Stand des Repositorys
> zum oben genannten Datum; der Änderungsverlauf steht in der Git-Historie
> dieser Datei.

## Hinweis zu diesem Dokument

Dies ist ein technisch fundierter Entwurf, **keine Rechtsberatung** und keine
fertige, rechtsverbindliche Datenschutz-Folgenabschätzung. Er wurde auf Basis
einer Analyse des öffentlichen Quellcodes von `wattnpapa/erfassungsbogen`
(Stand 2026-11-28, `main`, inkl. der vier Kern-Submodule) erstellt
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

**Abgrenzung:** Das Sammeln der Bögen mehrerer Einheiten am Meldekopf
(Einsatz-Sammlung, Lagemonitor, Sammel-PDF, Lageblatt, Sammlungs-Exporte) ist
Sache der eigenständigen Meldekopf-App (Repository `wattnpapa/meldekopf`,
`meldekopf.erfassungsbogen.app`). Die Folgenabschätzung dafür führt die
Meldekopf-App (`docs/datenschutz-folgenabschaetzung.md` dort). Dieses Dokument
behandelt den Erfassungsbogen selbst und, soweit vorhanden, den Altbestand an
Sammlungen auf einem Gerät (5.7).

## 1. Zusammenfassung

Der digitale Einheiten-Erfassungsbogen ersetzt einen papierenen Vordruck, mit dem
BOS-Einheiten und Hilfsorganisationen im Einsatz- und Übungsfall Stärke,
Personal, Fahrzeuge und Sofortbedarf erfassen und an eine Führungsstelle
weitergeben. Die App verarbeitet dabei personenbezogene Daten des eigenen
Personals (Namen, teils Kontaktdaten, Fahrerlaubnisse, logistikrelevante Angaben
wie Ernährungsform) sowie optional freiwillige Kontaktangaben des Absenders.
Liest eine Dienststelle ihre Helferliste als Personalstamm ein, liegen auf dem
Gerät auch Daten von Angehörigen, die an keinem Einsatz teilnehmen (5.3, 5.7).

Zentrales Architekturmerkmal mit unmittelbarer Datenschutz-Relevanz: Es gibt
keinen Server, keine Cloud, keine Nutzerkonten. Alle Daten bleiben auf dem
jeweiligen Endgerät (`localStorage`); die Übergabe zwischen zwei Geräten läuft
ausschließlich über einen selbst-enthaltenen QR-Code, Link oder Datei-Export —
ohne dass eine dritte Stelle die Daten zu sehen bekommt. Das minimiert eine ganze
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

**Datenschutzfrist:** Die App anonymisiert die Personaldaten eines Bogens
90 Tage nach seiner letzten Änderung, auch in fremden, empfangenen Bögen.
Ausgenommen sind Übungsbögen und Vorlagen.
- **Wirkung:** Der Speicherbegrenzung ist technisch und nicht nur
  organisatorisch Rechnung getragen. R3 ist deshalb niedrig, R1 und R8 sind
  niedrig-mittel.
- **Nicht erfasst:** QR-Code, PDF und Exporte selbst (R2), Bildschirmfotos
  und Bildschirmaufnahmen der App (R13) sowie der Personalstamm (R12).
- **Folgerisiken der Frist:** R10 (Datenverlust durch eine falsche Uhr) und R11
  (fristfreie Übungsbögen mit echten Daten).

**Vergleich mit dem Papierverfahren (6.5):** Gemessen an der heutigen Praxis
(vorbereitete Namensliste, Durchstreichen, Foto oder Scan am Meldekopf,
Weiterleitung per Mail oder Messenger, Kopien ohne Löschkontrolle auf den
Laufwerken der Führungsstelle) verarbeitet die App bei bestimmungsgemäßer
Nutzung weniger Daten: Die Musterung lässt Abwesende gar nicht erst in den
Bogen, und das Fotografieren am Meldekopf entfällt. Mehr als das Papier gibt
sie mit Geschlecht und Ernährung je Person (R14), im Mischweg mit vorab
gedrucktem PDF (R15) und mit Links im Chatverlauf (R16) preis.

## 2. Rahmendaten

| Feld | Angabe |
| --- | --- |
| Bezeichnung der Verarbeitungstätigkeit | Digitaler Einheiten-Erfassungsbogen (App „Erfassungsbogen") |
| Verantwortlicher (Art. 4 Nr. 7 DSGVO) | `[Name der einsetzenden Organisation]` |
| Vertreten durch | `[Name, Funktion]` |
| Datenschutzbeauftragte/r (falls bestellt) | `[Name, Kontakt]` |
| Ersteller dieses Entwurfs | KI-gestützte Analyse des öffentlichen Quellcodes (Claude), auf Anforderung von `[Name]` |
| Grundlage | Repository `wattnpapa/erfassungsbogen`, Stand 2026-11-28, `main`, inkl. Submodule (Schema 13) |
| Version dieses Dokuments | 0.1 (Entwurf) |
| Datum | `[Datum der Freigabe einfügen]` |
| Nächste Überprüfung | `[Datum, spätestens bei wesentlicher Änderung der Software oder des Einsatzzwecks]` |
| Anlass der DSFA | Ersteinführung der App bei `[Organisation]` / Regelmäßige Überprüfung |

## 3. Systembeschreibung (Kurzfassung)

Ausführlich beschrieben in der [Arc42-Architekturdokumentation](arc42-architektur.md);
hier die für die DSFA relevante Kurzfassung:

- **Plattformen:** Web/PWA (erfassungsbogen.app), Windows- und Linux-Desktop
  (Electron), Android (Capacitor); iOS in Vorbereitung. Der macOS-Desktop-Build
  ist im Release-Workflow (`release.yml`) stillgelegt. Dieselbe Webfassung wird
  aus demselben Build zusätzlich als GitLab Pages auf dem Open-CoDE-Spiegel
  veröffentlicht (gleicher Code, anderer Host — siehe 5.8).
- **Keine Server-Infrastruktur.** Jede fachliche Verarbeitung läuft auf dem
  Endgerät. Keine zentrale Datenbank, keine Nutzerkonten, keine Anmeldung.
- **Datenübergabe zwischen zwei Geräten** ausschließlich über einen
  selbst-enthaltenen Kanal: QR-Code (Kamera-Scan oder USB-Handscanner), Link
  mit dem Bogen im Fragment, Datei-Export/-Import oder Nahfeld-Freigabe
  (AirDrop/Quick Share) — nie über eine Netzverbindung zwischen den beiden
  Geräten selbst.
- **Kein Sammeln in dieser App.** Bögen mehrerer Einheiten führt die
  eigenständige Meldekopf-App zusammen. Der Erfassungsbogen verweist auf sie
  (ein Link auf der Startseite, die App ruft dort nichts ab) und kann einen
  Bogen an sie übergeben (5.8). Ein empfangener Bogen öffnet sich hier direkt
  als Arbeitsbogen.
- **Optionale kryptografische Signatur** (Ed25519, `@noble/ed25519`) bestätigt,
  dass ein weitergereichter Bogen unverändert vom Inhaber eines bestimmten,
  lokal erzeugten Schlüssels stammt — ohne Rückschluss auf eine reale Identität
  (kein PKI-Modell, siehe 5.4).
- **Zwei externe Netzverbindungen** außerhalb der eigentlichen Bogen-Funktion:
  (1) GoatCounter-Reichweitenmessung beim App-Start, (2) Prüfung auf neue
  Versionen bei GitHub Releases (nur Desktop-Variante) — siehe 5.8.

## 4. Erforderlichkeitsprüfung (Art. 35 Abs. 1, 3 DSGVO)

### 4.1 Regelbeispiele Art. 35 Abs. 3 DSGVO

| Regelbeispiel | Einschlägig? | Begründung |
| --- | --- | --- |
| (a) Systematische und umfassende Bewertung persönlicher Aspekte, automatisierte Entscheidung mit Rechtswirkung | Nein | Die App trifft keine automatisierten Entscheidungen über Personen; sie erfasst und summiert Angaben. |
| (b) Umfangreiche Verarbeitung besonderer Kategorien (Art. 9) oder strafrechtlicher Daten | Nein | Im Datenmodell existiert kein Feld für Gesundheits-, Gewerkschafts-, Religions- oder ähnliche Art.-9-Daten. Berufsbezeichnungen aus dem mitgelieferten Vokabular sind allgemeine Berufsangaben, keine Gesundheitsdaten der betroffenen Person. Die Ernährungsform dient der Verpflegungsplanung; sie kann im Einzelfall Rückschlüsse auf Religion oder Gesundheit zulassen, wird aber nicht umfangreich und nicht zu diesem Zweck verarbeitet (5.4). |
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
| Große Datenmengen (Umfang, geografische Reichweite, Anzahl Betroffener) | Teilweise | Pro Bogen i. d. R. wenige bis einige Dutzend Personen. Ein eingelesener Personalstamm umfasst die Helferliste einer Dienststelle (technisch höchstens 3000 Zeilen, üblich weit weniger) — im Sinne der Kriterien kein „großer Umfang" wie bei bundesweiten Registern. |
| Zusammenführung/Abgleich von Datensätzen aus verschiedenen Quellen | Nein | Die App führt keine Meldungen mehrerer Einheiten zusammen (das geschieht in der Meldekopf-App) und gleicht nicht mit externen Registern ab. Der Personalstamm stammt aus der Liste der eigenen Dienststelle. |
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
  eine Einheit im Einsatz- oder Übungsfall. Statt einer Einheit kann ein Bogen
  auch eine einzeln anrückende Person mit Sonderaufgabe melden (Fachberater/in,
  Baufachberater/in, Technische/r Berater/in).
- Weitergabe dieser Angaben an eine Führungsstelle/einen Meldekopf ohne
  Netzverbindung, auch als Übergabe an die Meldekopf-App auf demselben Gerät.
- Ausdruck als PDF im Layout des gewohnten Papierformulars, inklusive QR-Code;
  dazu ein Blanko-Vordruck als Papier-Reserve.
- Export des Bogens als CSV-Tabelle.
- Übernahme eines ausgefüllten THW-Word-Bogens (`.docx`) in die App, damit eine
  Einheit, die ihren Bogen mit der Word-Vorlage des THW erstellt hat, nicht
  abgetippt werden muss.
- Zusammenstellen der Mannschaft eines Bogens aus einem lokal eingelesenen
  Personalstamm (Helferliste der Dienststelle) oder aus einer gespeicherten
  Vorlage (Stammdaten der eigenen Einheit).
- Weitergabe einer gespeicherten Vorlage an ein anderes Gerät oder in eine vom
  Nutzer gewählte Ablage, damit sie geräteunabhängig verfügbar ist.
- Optional: Bestätigung der Herkunft eines weitergereichten Bogens durch eine
  geräteseitige digitale Signatur.
- Anonyme Reichweitenmessung der App-Nutzung (siehe 5.8).

Nicht Zweck dieser App ist die Zusammenführung mehrerer Meldungen zu einer
Kräfteübersicht; sie liegt bei der Meldekopf-App.

### 5.2 Beteiligte

| Rolle | Wer | Anmerkung |
| --- | --- | --- |
| Verantwortlicher | `[einsetzende Organisation]` | Für die eigene Nutzung der App |
| Auftragsverarbeiter (Art. 28 DSGVO) | Keiner für den Kern-Anwendungsfall | Es gibt keinen Server, der im Auftrag personenbezogene Daten verarbeitet |
| Externer Dienst (Reichweitenmessung) | GoatCounter (`erfassungsbogen.goatcounter.com`) | Cookielos, kein Personenbezug zu den Erfassungsbogen-Daten; Verantwortlichkeit gesondert zu klären (siehe 5.8) |
| Empfänger innerhalb des Meldewegs | Andere Einheiten, Meldekopf (Meldekopf-App), übergeordnete Führungsstellen | Erhalten die im Bogen enthaltenen Daten über QR/Link/Datei/Ausdruck; werden dadurch ggf. selbst zu (gemeinsam) Verantwortlichen. Die übergeordnete Führungsstelle übernimmt Bögen über den geteilten Link selbst in ihre Tabelle |

### 5.3 Betroffene Personen

- **Eigenes Personal der Einheit:** Name, Funktion, ggf. Kontaktdaten (bei
  Führungskräften), Fahrerlaubnisse, Ernährungsform, Geschlecht (für
  Unterbringungsplanung).
- **Einzeln gemeldete Person:** Meldet ein Bogen eine Einzelperson, steht die
  Meldung als Ganzes für genau eine namentlich bekannte Person. Die
  Datenkategorien sind dieselben wie je Person einer Einheit.
- **Angehörige der Dienststelle im Personalstamm:** Hat die Organisation ihre
  Helferliste eingelesen, liegen auf dem Gerät Angaben auch zu Personen, die an
  keinem Einsatz teilnehmen (5.4, 5.7).
- **Meldende/absendende Person** (freiwillig): Name, E-Mail und/oder
  Telefonnummer über die optionale „Absenderkarte".
- **Mittelbar:** Personal fremder Einheiten, sobald deren Bogen auf dem Gerät
  geöffnet wird (Scan, Link, Datei), sowie Personal in Einsatz-Sammlungen, die
  als Altbestand noch auf dem Gerät liegen (5.7).

### 5.4 Kategorien personenbezogener Daten

| Kategorie | Felder | Pflicht/optional | Fundstelle |
| --- | --- | --- | --- |
| Identität | Vorname, Nachname | Pflicht je Personaleintrag | `Person` (`model.ts`) |
| Funktion/Qualifikation | Funktionen, Zusatzqualifikationen (inkl. Beruf — als Freitext mit Präfix „Beruf: " im selben Feld, eigenes Eingabefeld in der App), Fahrerlaubnis(se), Stärke-Rolle | Teils Pflicht, teils optional | `Person`, `src/app/beruf.ts` |
| Organisatorische Zuordnung | Dienststelle/Ortsverband der Person, nur wenn abweichend von der Einheit | Optional | `Person.dienststelle` — organisatorische Angabe, kein besonderes Datum nach Art. 9 |
| Unterbringungs-/verpflegungsrelevante Angaben | Geschlecht (M/W/D), Ernährungsform (inkl. vegetarisch/vegan) | Pflicht je Personaleintrag | `Person` — kein Gesundheitsdatum im Sinne Art. 9 DSGVO, dient der Logistikplanung; die Ernährungsform kann im Einzelfall Rückschlüsse auf Religion oder Gesundheit zulassen |
| Kontaktdaten | Telefon, E-Mail (jeweils dienstlich oder privat gekennzeichnet), Funkrufname der Person (dienstliche Kennung des Handfunkgeräts, stets dienstlich) | Optional, laut Code-Kommentar „i. d. R. nur Führungskräfte" | `Kontakt`, `KontaktArt` |
| Fahrzeugbezogen (potenziell personenbeziehbar) | Kennzeichen, Funkrufname; ohne Personenbezug: Farbe des taktischen Zeichens (kommunal oder grau, für Gerät von Partnern) | Optional | `Fahrzeug` |
| Freitext der Einheit | „Sonstiges" (Bemerkung der Einheit); nimmt beim Word-Import auch auf, was sich keinem Feld zuordnen lässt | Optional | `Erfassungsbogen.sonstiges` — kann Personenbezug enthalten, entfällt mit der Anonymisierung (5.7) |
| Freiwillige Absenderangabe | Name, E-Mail, Telefon | Vollständig freiwillig (Opt-in) | Absenderkarte, `docs/datenmodell.md` |
| Geräteschlüssel | Öffentlicher Ed25519-Schlüssel (kein Personenbezug für sich allein) | Automatisch, lokal erzeugt | `signatur.ts` |
| Einsatzkontext | Einsatzort/-auftrag, Zeitraum mit optionaler Uhrzeit zu „von" und „bis" (ISO 8601 mit dem Zeitzonen-Offset des erfassenden Geräts) | Pflicht | `Einsatz` — Angabe zum Einsatz der Einheit, kein Merkmal einzelner Helfer; kann in Verbindung mit Personaldaten mittelbar Rückschlüsse auf Aufenthaltsorte erlauben. Der Offset verrät nur die Zeitzone |
| Personalstamm (nur auf dem Gerät, nicht im Bogen) | Je Person der Helferliste: Name, Rolle, Funktion, Qualifikationen, Fahrerlaubnisklassen, Teileinheit; Rufnummer abwählbar; Geschlecht und Ernährung nur nach ausdrücklichem Anhaken | Optional; liest die Organisation selbst aus CSV oder Excel ein | `src/app/personalstamm.ts`, `eeb.personalstamm.v1` — in Bogen, QR-Code, PDF und Exporte gelangen nur die ausgewählten Personen (5.7) |

Dieselben Kategorien können in Zuständen stehen, die die App nicht lesen oder
noch nicht ablegen kann: im beiseitegelegten, unlesbaren Entwurf, im
beiseitegelegten Bestand unlesbarer Vorlagen und Sammlungen und in den
Merkern des Sitzungsspeichers (5.7). Es sind dieselben Bögen, keine weiteren
Datenkategorien.

Bei einem Bogen für eine Einzelperson ist die Meldung als Ganzes
personenbezogen. Der Fingerabdruck, über den eine Sammlung beim Empfänger
(Meldekopf-App) Folgemeldungen zuordnet, enthält dann den Namen der Person; er
bleibt wie die Sammlung auf dem Gerät des Empfängers.

**Nicht enthalten:** Gesundheitsdaten, besondere Kategorien nach Art. 9 DSGVO,
biometrische Daten, strafrechtliche Daten.

### 5.5 Verarbeitungsvorgänge / Datenfluss

- Eingabe durch die erfassende Person im Formular-Assistenten (lokal). Bei
  Namensfeldern sind Autokorrektur und Rechtschreibprüfung ausgeschaltet, damit
  Browser und Tastatur keine Namen in Wörterbücher übernehmen (Art. 25 DSGVO).
- Auf Wunsch Auswahl der Mannschaft aus dem Personalstamm oder einer Vorlage.
  Der Personalstamm entsteht durch Einlesen einer CSV- oder Excel-Datei der
  Dienststelle; die Datei wird lokal gelesen, vor dem Übernehmen lassen sich
  Rufnummern abwählen, Geschlecht und Ernährung kommen nur mit Haken mit
  (datenschutzfreundliche Voreinstellung, Art. 25 Abs. 2 DSGVO).
- Fortlaufendes Zwischenspeichern als Entwurf (`localStorage`).
- Anzeige am Bildschirm. Der Sichtschutz „Namen verbergen" (Fußzeile und
  Schritt 3, ab Werk aus, auf allen Plattformen) zeigt Personennamen in der
  Oberfläche als Balken fester Breite: in den Namensfeldern, solange sie keinen
  Fokus haben, in Übersicht, Vorlagen, Personalstamm, Absenderangabe,
  Rückfragen, Hinweisen und Quittungen. Antippen oder Tastatur deckt einen Namen
  für 15 Sekunden auf; ein Bildschirmvorleser sagt dort „Name verborgen" an,
  in Eingabefeldern liest er den Inhalt weiter vor. Rufnummern und die
  Erreichbarkeit unter dem Namen in der Übersicht bleiben sichtbar. PDF,
  CSV, Link und QR-Code entstehen aus dem Bogen und bleiben vollständig. Die
  installierten Fassungen sperren zusätzlich Bildschirmfotos, soweit die
  Plattform das erlaubt (ab Werk an, abschaltbar; Grenzen je Plattform in M14).
  Ein Bildschirmfoto, das trotzdem entsteht, ist eine Kopie außerhalb der App
  (5.7, R13).
- Auf „Bogen übergeben": Kodierung in ein kompaktes Binärformat, Kompression
  (DeflateRaw), optionale Signatur, Kodierung als QR-taugliche Zeichenkette
  (Base41). Daraus entstehen QR-Code, Link (Bogen im Fragment), PDF mit QR-Code
  oder die Übergabe „An Meldekopf-App geben" (5.8).
- Übergabe an ein zweites Gerät ausschließlich über den physisch/lokal
  begrenzten Kanal — zu keinem Zeitpunkt über einen Server.
- Beim Empfänger: Dekodierung, optionale Signaturprüfung (reiner Anzeigestatus,
  blockiert die Übernahme nie). Der Bogen öffnet sich als Arbeitsbogen; liegt
  dort schon ein angefangener Bogen, fragt die App vorher und legt ihn auf den
  Rückholplatz (5.7). Ein USB-Handscanner wird auch ohne offenes Scanner-Fenster
  angenommen und nimmt denselben Weg wie ein Bogen-Link. Ist die
  Datenschutzfrist eines eingelesenen Bogens abgelaufen, wird er gleich
  anonymisiert übernommen.
- Alternativ: Einlesen eines THW-Word-Bogens (`.docx` aus den Vorlagen
  `06-*_Erfassungsbogen.dotx`) vom Gerät. Die App liest die Formularfelder
  lokal und baut daraus einen Bogen (unsigniert) mit denselben Kategorien wie
  der Papier- und der App-Bogen (5.4). Was sich keinem Feld zuordnen lässt
  (etwa Faxnummern, Zahl der Vegetarier, Unterbringung nach Geschlecht als
  Kopfzahlen, unbekannte Felder), steht im Freitext „Sonstiges"; die Quittung
  nach dem Import nennt es. Die Word-Datei selbst bleibt, wo sie war, und wird
  von der App nicht gespeichert. Für den so entstandenen Bogen gelten Frist und
  Löschwege wie für jeden anderen.
- Optionaler Ausdruck (PDF) oder Tabellenexport (CSV) des Bogens. Das PDF
  enthält den Bogen im Formularlayout, den QR-Code und den Bogen als
  eingebettete Daten. Es druckt je Person auch die Zählrolle (F/UF/M),
  trägt im Seitenrand Nr., Einheit und Blattzahl sowie Platz zum Quittieren von
  Hand, vermerkt, bis wann die Namen im Code gültig sind (Datenschutzfrist),
  und kennzeichnet Namen, die für den Druck vereinfacht („(vereinfacht)") oder
  aus kyrillischer bzw. griechischer Schrift umgeschrieben („(Umschrift)")
  wurden (Richtigkeit, Art. 5 Abs. 1 lit. d DSGVO). Vorbelegungen nach StAN
  druckt es nicht als gemeldet. Die CSV enthält alle Angaben des Bogens bis zur
  einzelnen Person und zum einzelnen Fahrzeug. Die Dateinamen tragen Datum,
  Uhrzeit und den Namen der Einheit. Handschriftliche Vermerke auf dem Papier
  bleiben Papier; die App liest sie nicht.
- „Vorlage teilen": die Vorlage als signierter QR-Code/Link oder als
  unsignierte JSON-Datei (`eeb-vorlage-*.json`). Die Datei trägt nur diese
  eine Vorlage, keinen Geräteschlüssel. Beim Empfänger entsteht daraus wieder
  eine Vorlage in `localStorage`; der offene Arbeitsbogen bleibt unberührt.
  Vorlagen sind von der Datenschutzfrist ausgenommen (5.7) — eine geteilte
  Vorlage ebenso.
- Übungsbögen (erfundene Namen und Rufnummern, keine personenbezogenen Daten)
  lassen sich als Sammel-PDF und als ZIP-Archiv mit einer PDF je Bogen
  herunterladen; erzeugt lokal, ohne Server. Die Übungsbögen niedersächsischer
  Wachen (Ortsfeuerwehren, Standorte von DRK, JUH, MHD, ASB) tragen echte
  Fahrzeugdaten der Organisationen (Funkrufname, Kennzeichen, Typ, Name der
  Wache) nach bos-fahrzeuge.info; das sind Angaben zu Dienstfahrzeugen, keine
  personenbezogenen Daten. Die Personen darin bleiben erfunden. Abgerufen wird
  nur beim Erzeugen der Bögen im Projekt (`npm run quellen:bos-fahrzeuge`),
  nicht aus der App. Wer einen Übungsbogen als Grundlage nimmt und die
  Übungsmarke abwählt, wird gefragt, solange noch Beispielnamen oder -nummern
  im Bogen stehen.

Eine vollständige technische Darstellung inkl. Sequenzdiagrammen findet sich in
Kapitel 6 der [Arc42-Dokumentation](arc42-architektur.md).

### 5.6 Rechtsgrundlagen (durch die einsetzende Organisation zu bestätigen)

| Verarbeitung | Mögliche Rechtsgrundlage | Anmerkung |
| --- | --- | --- |
| Erfassung von Personal-/Einsatzdaten durch BOS-Einheiten mit hoheitlichem Auftrag | Art. 6 Abs. 1 lit. e DSGVO i. V. m. `[einschlägiges Landesgesetz, z. B. THW-Gesetz, Feuerwehrgesetz des Landes]` | Regelfall für Behörden/öffentlich-rechtliche Organisationen |
| Erfassung durch privatrechtlich organisierte Hilfsorganisationen ohne hoheitlichen Auftrag | Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Einsatzfähigkeit) oder vertragliche/mitgliedschaftliche Grundlage | Im Einzelfall zu prüfen |
| Freiwillige Absenderkarte | Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch aktives Opt-in) | Nichtausfüllen hat keine Nachteile |
| Anonyme Reichweitenmessung (GoatCounter) | Art. 6 Abs. 1 lit. f DSGVO — so im Quellcode dokumentiert (`src/app/statistik.ts`) | Kein Personenbezug zu den Bogen-Inhalten; siehe 5.8 |
| Personalstamm (Helferliste der Dienststelle auf dem Gerät) | Wie die Erfassung selbst (lit. e bzw. lit. f); für Geschlecht und Ernährung im Stamm gesondert zu prüfen | Betrifft auch Personen ohne Einsatzbezug; `[Organisation: Rechtsgrundlage und Erforderlichkeit bestätigen]` |

Der Kopfkommentar von `src/app/statistik.ts` nennt ausdrücklich Art. 6 Abs. 1
lit. f DSGVO und begründet, weshalb § 25 TDDDG nicht greift (keine Cookies, kein
Storage-Zugriff durch den Dienst, keine geräteübergreifende ID).

### 5.7 Speicherdauer und Löschung

**Datenschutzfrist (technisch erzwungen).** 90 Tage nach der letzten Änderung
eines Bogens (`stand`) entfernt die App die personenbezogenen Angaben
dauerhaft. Das sind Namen, Funktionen, Zusatzqualifikationen (samt Berufen),
Fahrerlaubnisse, Kontakte und Dienststelle der Personen, Telefon/E-Mail der
Hierarchie-Ebenen und der Freitext „Sonstiges". Stärke, Unterbringung und
Verpflegung bleiben als Summen erhalten (Stärkerolle, Geschlecht und Ernährung
je namenloser „Einsatzkraft n").

- **Wirkt auf:** jeden eingelesenen Bogen (Scan, Link, Datei/PDF, Word-Bogen),
  den Entwurf, den Bogen auf dem Rückholplatz und jede Meldung einer
  Einsatz-Sammlung im Altbestand (samt empfangenem Rohpayload und
  Signaturnachweis mit Absenderangaben). Die Regel steht in
  `vendor/eeb-format/src/datenschutzfrist.ts` und leitet sich ohne Schemafeld
  aus `stand` ab; sie greift damit für alle je verteilten QR-Codes.
- **Ausgenommen:** Bögen mit dem Haken „Dies ist eine Übung" (UI-Hinweis beim
  Haken und im Übungs-Störer) sowie „Meine Vorlagen" als Stammdaten der eigenen
  Einheit. Beide bleiben unbefristet gespeichert, bis sie manuell gelöscht
  werden. Der Personalstamm ist kein Bogen; die Frist erfasst ihn nicht (siehe
  unten).
- **Ankündigung:** Die Entwurfskarte kündigt die Anonymisierung 14 Tage vorher
  an; jede Bearbeitung startet die Frist neu. Anonymisierte Bögen sind als
  solche gekennzeichnet; die App zeigt und druckt für sie keine Rufnummern und
  Fahrerlaubnisse.
- **Uhr:** Die Frist rechnet mit einer geprüften Geräteuhr
  (`src/app/datenschutz-uhr.ts`, Merkzettel `eeb.uhr.v1`). Weicht die Uhr um
  mehr als 60 Tage vom letzten Start ab (vor oder zurück), löscht und
  anonymisiert die App nichts und fragt „Geräteuhr prüfen". Ein solcher Sprung
  wird nie durch Zeitablauf bestätigt: Es gilt weiter der letzte akzeptierte
  Zeitpunkt, bis der Helfer „Geräteuhr stimmt" bestätigt (nach einer Rückfrage,
  die in Zahlen nennt, was dann endgültig gelöscht oder anonymisiert wird) oder
  die Uhr wieder zum letzten Start passt. Ein kleinerer Sprung gilt als echte
  Zeit; die App fragt aber auch dann, wenn durch ihn etwas fällig würde, das
  noch nicht angekündigt war. Dieselbe Uhr gilt für Aufräum- und
  Papierkorbfrist und für die Fristen des Beiseitegelegten.
- **Grenze:** Der QR-Code selbst, die eingebetteten Daten im PDF und
  CSV-Exporte bleiben unverändert und unverschlüsselt. Ein fremder Decoder
  liest sie vollständig. Die Frist ist eine Speicherbegrenzung in der App, kein
  Schutz des Transportwegs und keine Anonymisierung im Rechtssinn für bereits
  weitergegebene Kopien.

**Speicherorte mit Personenbezug oder Schlüsselmaterial** (`localStorage` des
Geräts, unverschlüsselt):

| Schlüssel | Inhalt | Dauer und Löschweg |
| --- | --- | --- |
| `eeb.entwurf.v1` | Der offene Arbeitsbogen (eigener oder empfangener) mit allen Angaben | Bis zum Verwerfen, Schließen oder Ersetzen; Datenschutzfrist 90 Tage |
| `eeb.entwurf.ersetzt.v1` | Rückholplatz: genau ein verdrängter, geschlossener oder verworfener Bogen | Wird vom nächsten verdrängten Bogen überschrieben (die Rückfrage nennt das); dieselbe Datenschutzfrist |
| `eeb.entwurf.beschaedigt.v1` | Ein Entwurf, den die App nicht lesen kann (abgeschnitten, Pflichtfeld fehlt), unverändert beiseitegelegt statt überschrieben | Die Datenschutzfrist erreicht ihn nicht, weil die App ihn nicht lesen kann; er fällt deshalb 90 Tage nach dem Beiseitelegen selbst weg. Die Startseite nennt Ursache und Frist und bietet „Als Datei sichern" und „Entfernen…" an |
| `eeb.vorlagen.v1` | „Meine Vorlagen": Mannschaftslisten der eigenen Einheit, samt Papierkorb; je Vorlage der Zeitpunkt, zu dem die Mannschaft zuletzt geändert oder bestätigt wurde | Unbefristet bis zum Löschen; gelöschte Vorlagen 30 Tage im Papierkorb. Die Karte nennt den Stand der Mannschaft und fragt nach 180 Tagen ohne Änderung, ob jemand ausgeschieden ist (M15) |
| `eeb.personalstamm.v1` | Helferliste der Dienststelle (5.4), Zeitpunkt des Einlesens, Name der Quelldatei | Keine automatische Löschfrist. Die Startseite zeigt das Datum des Einlesens und erinnert nach 90 Tagen; „Personalstamm löschen…" entfernt ihn. Nicht Teil der Datensicherung |
| `eeb.absenderkarte.v1` | Freiwillige Kontaktangaben der meldenden Person | Bis zum Leeren der Karte |
| `eeb.geraeteschluessel.v1` | Ed25519-Schlüsselpaar des Geräts, privater Schlüssel im Klartext | Bis „Geräteschlüssel neu erzeugen" (siehe unten) |
| `eeb.unlesbar.v1` | Beiseitegelegtes: unlesbare Vorlagen, Sammlungen und Meldungen des Altbestands, halb geschriebene Gesamttexte, eine beschädigte Absenderkarte — unverändert, kann Namen, Funktionen, Erreichbarkeiten und die Anschrift der erfassenden Stelle tragen | 90 Tage ab dem Beiseitelegen; früher über „Beiseitegelegtes entfernen…" (mit Rückfrage) |
| `eeb.geschlecht-geprueft.v1` | Prüfsummen (FNV-1a) über Namen und Geschlecht einer Besetzung, die jemand in Schritt 3 als „alle männlich" bestätigt hat; keine Namen im Klartext | Höchstens 50 Einträge, die ältesten fallen heraus |
| `eeb.beispiel-herkunft.v1`, `eeb.beispiel-offen.v1` | Namen und Nummern eines geöffneten Beispiel- oder Übungsbogens (in der Regel erfundene Daten) bzw. eine Prüfsumme des offenen Beispiels | Weg, sobald kein Bogen mehr offen ist |
| `eeb.einsaetze.v1` und Begleitschlüssel | Altbestand an Einsatz-Sammlungen (siehe unten) | Aufräumfrist 90 Tage, Datenschutzfrist je Meldung, oder gezieltes Löschen |

**Speicherorte ohne Personenbezug** (`localStorage`): Uhr-Merkzettel
(`eeb.uhr.v1`), Zeitpunkt und Zahlenstand der letzten Datensicherung
(`eeb.sicherung.zuletzt.v1`, `eeb.sicherung.stand.v1`), Stand des
Offline-Vorrats (`eeb.offline-zusatz.v1`, zwei Zähler), die Haken einer
unterbrochenen Musterung (`eeb.musterung.v1`: Kennung der Vorlage,
Wahrheitswerte je Stelle, Zeitpunkt; höchstens einen Tag, mit dem Ende der
Musterung gelöscht), Anzeige-Einstellungen (`eeb.anzeigemodus.v1`,
`eeb.feldmodus.v1`), die Wahl von Kamera und Scanweg (`eeb-kamera`,
`eeb-scanweg`: „Handscanner statt Kamera"), der Widerspruch gegen die
Reichweitenmessung (`skipgc`) und ein kurzlebiger Probeeintrag zur Messung des
freien Speichers (`eeb.speicherprobe`).

**Sitzungsspeicher des Tabs** (`sessionStorage`; nicht in der Datensicherung,
weg mit dem Schließen des Tabs und mit „Alle Daten löschen"):

| Schlüssel | Inhalt | Dauer |
| --- | --- | --- |
| `eeb.wartet.fragment` | Der Link eines empfangenen Bogens, über den noch nicht entschieden ist; enthält den Bogen wie der Link selbst | Bis zur Antwort auf die Rückfrage, damit ein Neuladen erneut fragt, statt den Bogen zu verlieren |
| `eeb.personal.rueckweg` | Die zuletzt im Schritt „Personal" entfernten Personen mit Namen, Funktionen und Erreichbarkeiten, nur für dieselbe Einheit | 15 Minuten; entfernt beim Verwerfen, Schließen und Übergeben des Bogens |
| `eeb.fahrzeug.rueckweg`, `eeb.ebene.rueckweg` | Zuletzt entferntes Fahrzeug bzw. entfernte Hierarchie-Ebene (mit Kürzel, Telefon, E-Mail) | 15 Minuten |
| `eeb.funkruf.merker.<Index>` | Ausgeschalteter Funkrufname eines Fahrzeugs (Kennwort und Kennzahlen) | 15 Minuten |
| `eeb.einsatz.rueckweg` | Zeitraum, Ort/Auftrag und Sofortbedarf vor „Für neuen Einsatz vorbereiten" | 15 Minuten |
| `eeb.vorbelegung.rueckweg` | Unbenannte Sollplätze vor „Vorbelegung entfernen" | 15 Minuten |
| `eeb.abgleich.fortsetzen`, `eeb.rueck.meldekopf`, `eeb.ansicht-stelle.v1`, `eeb.beispiel-pfad.v1` | Inhaltsleere Merker („1"), Ansicht-Kennung und Bildlaufstelle, Pfad im Beispiel-Dialog; keine Personendaten | Bis zum Ende des Tabs |

**Rückholplatz und eingehende Bögen.** Ein eingehender Bogen (Link, Scan,
Datei) verdrängt den angefangenen Bogen erst nach Rückfrage, auch beim
Kaltstart über einen Link; eine Datei wird vor der Rückfrage gelesen, eine
unbrauchbare Datei verdrängt nichts. Ein Bogen, der dem offenen gleicht,
ersetzt nichts. Die Bearbeitung einer gespeicherten Vorlage verdrängt keinen
eigenen Bogen vom Rückholplatz. Ein zweites Fenster überschreibt den Entwurf
eines anderen Fensters nicht still, sondern legt ihn nach Rückfrage auf den
Rückholplatz; „Meine Fassung behalten" legt den Stand des anderen Fensters
ebenso dort ab. Ein in einem anderen Fenster gelöschter Bogen wird nicht
zurückgeschrieben — ein Löschen bleibt gelöscht. Der Rückholplatz trägt die
letzte Bearbeitung des Bogens als Stand. Ein Entwurf aus der Zeit, als diese
App selbst sammelte, kann noch die Marke `fremd` tragen (Kennung der
Ziel-Sammlung, Beginn der Erfassung, Nr. und Zug laut Zettel; keine
Personendaten).

**Voller oder gesperrter Speicher.** Die Fristen greifen bei jedem Lesen;
zurückgeschrieben wird nur, wenn dabei etwas bereinigt wurde. Scheitert das
Zurückschreiben, zeigt die App die Daten bereits bereinigt an und meldet den
Speicher; im Gerätespeicher stehen sie bis zum nächsten gelungenen
Schreibvorgang unbereinigt. Ein geschlossener oder ersetzter Bogen wird bei
vollem Speicher nicht verworfen, sondern auf den Rückholplatz umgelegt, und
die Meldung bietet die Datei an. Beschädigte Daten werden nicht überschrieben,
solange sie sich nicht beiseitelegen lassen (Verfügbarkeit, Art. 32 Abs. 1
lit. b DSGVO).

**Personalstamm.** Der Stamm verlässt das Gerät nicht: In Bogen, QR-Code, PDF
und Exporte gelangen nur die ausgewählten Personen, die Datensicherung enthält
ihn nicht, und beim Einspielen einer Sicherung bleibt er auf dem Gerät. Ein
zweites Gerät liest die Datei der Dienststelle selbst ein. „Personalstamm
löschen…" und „Alle Daten löschen" entfernen ihn. Weil es keine automatische
Löschfrist gibt, sollte die Organisation in ihrer Fassung dieser Vorlage
festlegen: `[wer die Liste einliest; auf welchen Geräten sie liegen darf; wann
sie zu erneuern oder zu löschen ist]` (R12, M13).

**Altbestand an Einsatz-Sammlungen.** Geräte, auf denen der Erfassungsbogen
früher selbst gesammelt hat, können unter `eeb.einsaetze.v1` noch
Einsatz-Sammlungen mit den Bögen fremder Einheiten tragen. Die App zeigt sie
nicht an; die Startseite nennt ihre Zahl (`src/app/meldekopf-altbestand.ts`)
und bietet zwei Wege: eine Datensicherung erstellen, die die Meldekopf-App
einspielt, oder den Altbestand nach Rückfrage vom Gerät löschen. Gelesen wird
er weiter über den Kern (`src/app/einsaetze-lesen.ts`), sodass dessen Fristen
gelten: Eine Sammlung, die 90 Tage nicht geändert wurde, wird endgültig
gelöscht, gelöschte Sammlungen liegen 30 Tage im Papierkorb, und die
Datenschutzfrist anonymisiert jede Meldung für sich. Nach einer automatischen
Löschung nennt die Startseite die Sammlung einmal beim Namen
(`eeb.aufgeraeumt.v1`: Name, Zeitraum, Zahl der Meldungen). Zum Altbestand
gehören Begleitschlüssel: mit möglichem Personenbezug der Papierkorb
entfernter Meldungen (`eeb.meldungen-papierkorb.v1`, samt Namen), der
Abschlussvermerk (`eeb.abschluss.v1`, mit frei getipptem Empfänger der
Übergabe) und die Import-Widersprüche (`eeb.widersprueche.v1`, Einheitsnamen
und Feldwerte); ohne Personenbezug die Export-, Lageblatt-, Weitergabe- und
Kenntnis-Stände (`eeb.export-stand.v2`, `eeb.lageblatt-stand.v1`,
`eeb.weitergabe-stand.v1`, `eeb.kenntnis-stand.v1`: Kennungen, Prüfsummen,
Zeitpunkte), `eeb.entfernt.v1`, `eeb.letzterEinsatz.v1`, `eeb.lagebeginn.v1`,
`eeb.lagefunkruf.v1`, `eeb.lagestufe.v1`, `eeb.nummernhinweis.v1`,
`eeb.schnellOrganisation.v1` und zwei Ansichts-Einstellungen
(`eeb.einheiten-ansicht`, `eeb.einheiten-tabelle-alle-spalten`). Diese Begleitschlüssel pflegt die App nicht
weiter; sie verschwinden mit dem Löschen des Altbestands oder mit „Alle Daten
löschen" und wandern mit der Datensicherung in die Meldekopf-App.
`[Organisation: Altbestand auf den Geräten prüfen und überführen oder löschen]`

**Datensicherung.** „Sicherung erstellen" schreibt alle `eeb.`-Einträge des
`localStorage` außer dem Personalstamm in eine JSON-Datei. Die Datei enthält
Personendaten und den privaten Geräteschlüssel — ihre Ablage ist
organisatorisch zu regeln. „Sicherung einspielen…" ersetzt die App-Daten des
Geräts ohne Papierkorb (`src/app/sicherung.ts`); Uhr-Merkzettel, Stand des
Offline-Vorrats und Personalstamm bleiben dabei beim Gerät. Die Rückfrage
nennt, was auf dem Gerät ersetzt wird (Sammlungen des Altbestands mit Namen
und Meldungszahl, Vorlagen, Entwurf, Bogen auf dem Rückholplatz, Absenderkarte,
Geräteschlüssel mit Kurzform, beiseitegelegter Bestand) und was die Datei
bringt, bietet „Vorher Sicherung erstellen…" an und verlangt einen Haken,
sobald auf dem Gerät etwas ersetzt wird. Den Uhrstand der Datei übernimmt sie
nicht und nennt, was aus der Datei sofort wieder unter die Fristen fällt —
eine alte Sicherung bringt nicht, was in ihr steht, sondern was nach den
Fristen übrig bleibt.

**Alle Daten löschen.** Entfernt alle `eeb.`-Einträge aus `localStorage`
(einschließlich Personalstamm, Rückholplatz, Beiseitegelegtem und Altbestand)
und aus dem Sitzungsspeicher des Tabs. Die Rückfrage zählt den Bogen auf dem
Rückholplatz und den beiseitegelegten Bestand ausdrücklich mit auf.

**Verfügbarkeit.** Der Browser darf den lokalen Speicher einer Website räumen.
Die Web-App bittet deshalb um dauerhaften Speicher
(`navigator.storage.persist`), zeigt den Status und die letzte Sicherung in
der Datensicherung und erinnert in der Fußzeile nach drei Tagen ohne
Sicherung. Dauerhafter Speicher verlängert die Speicherdauer nicht über die
Fristen oben hinaus; er verhindert nur die Räumung durch den Browser.

**Geräteschlüssel.** Der private Signaturschlüssel lässt sich einzeln
verwerfen — „Geräteschlüssel neu erzeugen" in der Fußzeile löscht ihn nach
einer Rückfrage und setzt sofort ein neues Paar
(`src/app/geraete-schluessel.ts`). Gedacht ist der Weg für den Verdacht einer
Kompromittierung; die Bogendaten bleiben dabei unangetastet. Empfänger müssen
die Kurzform danach neu abgleichen.

**Strukturelle Grenze.** Sobald ein Bogen als QR-Code gescannt, als Link
geteilt, als PDF gedruckt oder als Datei exportiert wurde, hat die App auf
diese Kopien keinen Zugriff mehr (vertiefend 6.3).

**Bildschirmfotos und Bildschirmaufnahmen.** Ein Bildschirmfoto der App ist
eine Bilddatei des Betriebssystems, keine Ablage der App. Es liegt in der
Fotogalerie, je nach Geräteeinstellung auch in deren Cloud-Sicherung (iCloud-
Fotos, Google Fotos, OneDrive-Kamera-Upload), und wandert von dort leicht in
Messenger. Weder die Datenschutzfrist noch „Bogen löschen", Papierkorb oder
„Alle Daten auf diesem Gerät löschen" erreichen es. Die App kann es nur
verhindern, nicht nachträglich entfernen: Die Screenshot-Sperre der Android-
und der Desktop-App unter Windows hält Namen aus dem Bild heraus, iOS und der
Browser lassen das nicht zu (M14, R13).

**Empfehlung.** Die App erzwingt eine Frist nur für Bögen in der App. Für
Papierausdrucke, Exporte, Sicherungsdateien, Bildschirmfotos, Übungsbögen,
Vorlagen und den Personalstamm sollte die Organisation eigene, dokumentierte
Löschfristen festlegen und prüfen, ob 90 Tage zum eigenen Zweck passen (M4).

### 5.8 Empfänger und Datenübermittlung an Dritte

| Übermittlung | Ziel | Enthält Bogen-/Personaldaten? | Rechtsgrundlage/Anmerkung |
| --- | --- | --- | --- |
| QR-Code/Link/Datei-Weitergabe im Meldeweg | Nächste Einheit/Meldekopf/Führungsstelle | Ja, zweckgemäß | Kernfunktion der App, siehe 5.6. Die App überträgt selbst nichts; beim Teilen eines Links wählt der Nutzer den Kanal (Messenger, Mail) |
| „An Meldekopf-App geben" | Meldekopf-App (`meldekopf.erfassungsbogen.app`) auf demselben Gerät | Ja — dieselben Daten wie „Link teilen", als Link-Fragment | Derselbe Empfänger wie im Meldeweg (der Meldekopf). Das Fragment wird nicht an einen Server gesendet; die Meldekopf-App nimmt es beim Öffnen auf und fragt, in welche Sammlung der Bogen gehört. Der Abruf der Meldekopf-App selbst ist deren Auslieferung und in deren DSFA beschrieben |
| Vorlage teilen (Link/Datei) | Vom Nutzer gewählt: eigenes zweites Gerät, Messenger, Mail, Cloud-Ablage | Ja — Namen, Funktionen, Fahrerlaubnisse und Erreichbarkeiten der ganzen Mannschaft | Die App überträgt selbst nichts, sie erzeugt nur Link bzw. Datei; der Dialog weist vor dem Teilen auf den Inhalt hin. Legt ein Nutzer die Datei in einen Cloud-Dienst, ist dieser Dienst Empfänger im Sinne der DSGVO. `[einsetzende Organisation: zulässige Ablageorte für Vorlagen festlegen]` |
| Datensicherung (Datei) | Vom Nutzer gewählter Ablageort; zum Überführen eines Altbestands die Meldekopf-App | Ja — alle App-Daten außer dem Personalstamm, dazu der private Geräteschlüssel | Die App erzeugt nur die Datei. `[einsetzende Organisation: zulässige Ablageorte für Sicherungen festlegen]` |
| GoatCounter-Zählpixel | `erfassungsbogen.goatcounter.com` | Nein — laut Quellcode werden nur Pfad, Titel, Referrer und Geräteklasse (iOS/Android/Desktop) übertragen, keine Cookies, keine geräteübergreifende ID, keine Bogen-Inhalte | Art. 6 Abs. 1 lit. f DSGVO; ein Widerspruch (Art. 21 DSGVO) ist im Datenschutz-Dialog der Fußzeile möglich („Nicht mitzählen", gespeichert als `skipgc`). Dazu feste Ereignisnamen zum Erklärfilm der Startseite (gestartet, halb, zu Ende gesehen; in den Apps: Link geöffnet), je Seitenaufruf höchstens einmal, ohne Referrer; der Widerspruch gilt auch dafür |
| Update-Prüfung (Desktop-App über `electron-updater`; Android-App über `api.github.com`, Download der APK erst auf Tippen) | GitHub (Releases) | Nein, nur technische Metadaten der Anfrage (u. a. IP-Adresse als Transportdatum) | Berechtigtes Interesse an sicherem, aktuellem Software-Stand |
| Abruf der Webfassung | GitHub Pages (erfassungsbogen.app) **oder** GitLab Pages auf Open CoDE (`gitlab.opencode.de`) | Nein, nur technische Metadaten der Anfrage (u. a. IP-Adresse als Transportdatum) | Ausliefern der Anwendung selbst. Welcher der beiden Hoster diese Metadaten sieht, entscheidet allein die aufgerufene Adresse; der ausgelieferte Code ist identisch. Bei der Open-CoDE-Fassung liegt das Hosting bei der Betreiberin der Plattform — für Verwaltungen kann genau das der Grund für diesen Weg sein. Dazu gehört der Erklärfilm der Startseite (`public/video/`): gleicher Host, abgerufen erst beim Abspielen, keine zusätzlichen Daten |

Keine Übermittlung sind: der Verweis der Startseite auf die Meldekopf-App (ein
Link, die App ruft dort nichts ab), antippbare Rufnummern und E-Mail-Adressen
im Bogen (Verknüpfungen, die das Gerät öffnet) und der Personalstamm, der das
Gerät nicht verlässt.

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
- Kontaktdaten (Telefon/E-Mail/Funkrufname) sind laut Code-Kommentar „i. d. R. nur
  Führungskräfte" vorgesehen.
- Zu einzelnen Personen gibt es kein Freitext-Feld für beliebige Zusatzangaben
  außerhalb der definierten, zweckgebundenen Felder. Der Freitext „Sonstiges"
  gilt dem Bogen als Ganzem und entfällt mit der Anonymisierung.
- Der Personalstamm bleibt auf dem Gerät und außerhalb der Datensicherung;
  Rufnummern sind beim Einlesen abwählbar, Geschlecht und Ernährung kommen nur
  nach ausdrücklichem Anhaken mit (Art. 25 Abs. 2 DSGVO).
- Wo sich das Gerät etwas über Personen merken muss, ohne die Daten zu brauchen,
  speichert es Prüfsummen statt Namen (`eeb.geschlecht-geprueft.v1`).
- Die QR-Kapazitätsgrenze (Zielgröße ≤ Version 18) wirkt als technischer Druck
  gegen das Anhäufen unnötiger Felder.
- Der CSV-Export ist bewusst gegen Formel-Injection abgesichert — ein Zeichen
  dafür, dass beim Datenexport auch die Integrität der Empfängerseite
  mitgedacht wurde.

### 6.2 Richtigkeit und Speicherbegrenzung

Schema-Migrationen (`hilfen.ts`) verhindern, dass ältere Datensätze mit
veralteten Feldbedeutungen fehlinterpretiert werden; Bögen ab Schema 2 bleiben
lesbar. Eine inhaltliche Richtigkeitsprüfung der Nutzereingaben findet —
erwartungsgemäß für ein Erfassungswerkzeug — nicht statt. Der Richtigkeit
dienen die Kennzeichnungen in PDF und CSV (vereinfachte oder umgeschriebene
Namen, nicht gemeldete Sollstärke, Vorbelegungen nicht als gemeldet; 5.5) und
die Rückfrage, bevor Beispielnamen als echte Angaben weitergegeben werden.

Die **Speicherbegrenzung** (Art. 5 Abs. 1 lit. e DSGVO) setzt die App technisch
um: Nach der Datenschutzfrist von 90 Tagen (5.7) sind die Personaldaten eines
Bogens in der App nicht mehr vorhanden. Dahinter steht Datenschutz durch
Technikgestaltung nach Art. 25 DSGVO. Die Speicherbegrenzung hängt damit nicht
allein an einer Dienstanweisung. Sie wirkt auch auf Kopien in anderen
App-Installationen.

Drei Einschränkungen bleiben:
- **Übungsbögen und Vorlagen** sind bewusst ausgenommen (R11/M11).
- **Der Personalstamm** hat keine automatische Löschfrist, nur eine Erinnerung
  nach 90 Tagen (R12/M13).
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
  weitergereicht oder ausgedruckt wurde, und nicht ein Bildschirmfoto in der
  Fotogalerie eines Geräts oder in deren Cloud-Sicherung. Davon weiß
  niemand außer der Person, die es gemacht hat.
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

Die App enthält in der Fußzeile einen Datenschutz-Dialog des Projektbetreibers
(Auslieferung der Website, erfasste Bogendaten samt dem Verbleib geteilter Links
im Browserverlauf, Speicherung im Endgerät und
Reichweitenmessung mit Widerspruchsschalter, Betroffenenrechte). Er beschreibt
die App und ihre offizielle Auslieferung, nicht die Verarbeitung durch die
einsetzende Organisation. Deren eigene Datenschutzinformation für das erfasste
Personal — einschließlich der Personen im Personalstamm — muss die
Organisation selbst bereitstellen (z. B. als Aushang/Dienstanweisung, M10).

### 6.5 Vergleich mit dem Papierverfahren

Die Verarbeitung ist nicht neu. Einheiten melden ihre Stärke am Meldekopf seit
jeher mit einem Erfassungsbogen auf Papier, beim THW mit den Word-Vorlagen
`06-*_Erfassungsbogen.dotx`. Die Verhältnismäßigkeit der App bemisst sich
deshalb nicht an „keine Verarbeitung", sondern an dem Verfahren, das sie
ersetzt oder ergänzt. Dieser Abschnitt stellt beide nebeneinander. Das
Papierverfahren ist so beschrieben, wie es in der Praxis läuft, nicht wie es
auf dem Vordruck gedacht ist.

**Das Papierverfahren in der Praxis.** In der persönlichen Einsatzvorbereitung
legen Führer und Unterführer einen Ausdruck mit allen Namen ihrer Einheit in
die Führungsmappe, so wird es teils auch gelehrt. Im Einsatz streicht der
Einheitsführer die Helfer durch, die nicht mitfahren, und gibt das Blatt am
Meldekopf ab. Die durchgestrichenen Namen bleiben lesbar. Am Meldekopf wird der
Bogen eingescannt oder mit einem Telefon fotografiert und auf irgendeinem Weg
zur Führungsstelle weitergeleitet: als Mail, über einen Messenger, auf einem
Stick. Dort wird er im Einsatztagebuch dokumentiert und liegt danach als Scan
oder Foto auf Arbeitsplatzrechnern, Netzlaufwerken und den Telefonen, mit denen
fotografiert wurde, oft auch in deren Cloud-Sicherung. Eine Löschkontrolle für
diese Kopien gibt es nicht. Der Ausdruck in der Führungsmappe hat keine Frist;
er wird ersetzt, wenn jemand eine neue Liste druckt.

Der Vordruck selbst ist dabei sparsamer als seine Praxis: Verpflegung
(„davon vegetarisch") und Unterbringung nach Geschlecht stehen dort nur als
Kopfzahlen, nicht je Person. Der Word-Import der App bildet das ab
(`src/app/word-bogen.ts`, Kopfzahlen landen unter „Sonstiges").

**Gegenüberstellung.**

| Schritt | Papierverfahren heute | Erfassungsbogen-App | Bewertung |
| --- | --- | --- | --- |
| Vorbereitung | Ausdruck der ganzen Einheit in der Führungsmappe, unbefristet | „Meine Vorlagen" mit der ganzen Mannschaft, unbefristet (5.7), auf einem Gerät mit Gerätesperre (M1); per „Vorlage teilen" leicht zu vervielfältigen | Gleichwertig. Die Vorlage ist besser geschützt als eine offene Mappe, wenn das Gerät gesperrt ist, aber schneller kopiert. Anders als die Mappe erinnert die Vorlage nach 180 Tagen daran, die Mannschaft zu prüfen (M15) |
| Abwesende streichen | Durchstreichen; die Namen bleiben lesbar und gehen mit zum Meldekopf und in jede Kopie | Musterung „Einsatz vorbereiten": abgewählte Personen kommen gar nicht in den Bogen (`vorlageInstanziieren` in `src/app/vorlagen.ts`), die Vorlage bleibt unangetastet | Besser. Personen, die nicht am Einsatz teilnehmen, verlassen das Gerät nicht. Ausnahme: ein vorab gedrucktes PDF der ganzen Einheit, das mit dem Stift gestrichen wird (R15) |
| Inhalt je Person | Name, Funktion, Qualifikation, Fahrerlaubnis; Verpflegung und Unterbringung als Kopfzahlen | Zusätzlich Geschlecht und Ernährungsform je Person im Datenmodell, im QR-Code, im Link und in der CSV; das PDF druckt nur Summen | Schlechter. Die Zuordnung zur einzelnen Person geht über den Vordruck hinaus (R14, M17) |
| Übergabe am Meldekopf | Blatt abgeben | QR-Code scannen, Link, Datei, Nahfeld, oder weiter Papier (PDF, Blanko-Vordruck) | Gleichwertig bis besser: Der Meldekopf erhält die Daten strukturiert und muss nichts fotografieren |
| Weiterleitung zur Führungsstelle | Foto/Scan per Mail, Messenger, Stick; Kopien auf privaten Telefonen und deren Cloud | In der Meldekopf-App weitergereicht; dort wo sie nicht genutzt wird, als PDF, CSV oder Link — dann dieselbe Kopierkette wie heute | Besser, soweit Meldekopf und Führungsstelle die Apps nutzen; sonst gleich. Ein Link im Messenger trägt den ganzen Bogen als Text im Chatverlauf (R16) |
| Dokumentation im Einsatztagebuch | Scan oder Original als Anlage | PDF oder Ausdruck als Anlage | Gleich. Die Aufbewahrung im Einsatztagebuch folgt dessen eigenen Regeln, nicht dieser App |
| Löschung | Keine Kontrolle über Scans, Fotos, Mails, Festplatten | Datenschutzfrist von 90 Tagen für jeden Bogen in einer App-Installation, auch für empfangene (5.7); keine Wirkung auf PDF, CSV, QR-Inhalt und Bildschirmfotos | Besser für digitale Kopien in den Apps, gleich für alles, was als Datei oder Bild herausgegeben wurde |
| Lesbarkeit für Unbefugte | Jeder, der das Blatt oder Foto findet | Jeder, der Gerät, Datei oder QR-Code in die Hand bekommt (unverschlüsselt) | Gleich. Die Signatur verbessert nur die Integrität, nicht die Vertraulichkeit |
| Neue Empfänger | Keine | Hoster der Webfassung und GoatCounter mit technischen Metadaten, ohne Bogendaten (5.8) | Geringfügig schlechter, abschaltbar bzw. durch Installation der App vermeidbar |
| Umfang auf dem Gerät | Liste der eigenen Einheit | Optional der Personalstamm der ganzen Dienststelle (R12) | Schlechter, wo ein Personalstamm eingelesen wird |

**Ergebnis des Vergleichs.** Bei bestimmungsgemäßer Nutzung, also Vorlage plus
Musterung und Übergabe per QR-Code an die Meldekopf-App, verarbeitet die App
weniger personenbezogene Daten als das Papierverfahren in seiner heutigen
Praxis. Zwei Gründe tragen das. Personen, die nicht mitfahren, stehen gar nicht
erst im Bogen, während sie auf dem gestrichenen Blatt in jeden Scan wandern.
Und der Schritt, an dem heute die unkontrollierten Kopien entstehen, das
Fotografieren und Mailen am Meldekopf, entfällt, wenn der Meldekopf scannt.
Digitale Kopien in den Apps verfallen nach 90 Tagen; für Scans auf den
Festplatten einer Führungsstelle gibt es heute keine Entsprechung.

Schlechter als das Papier ist die App an drei Stellen. Sie überträgt Geschlecht
und Ernährungsform je Person, wo der Vordruck nur Summen kennt (R14). Sie
erlaubt einen Mischweg, in dem ein vorab gedrucktes PDF der ganzen Einheit mit
dem Stift gestrichen wird: Der QR-Code und die eingebetteten Daten tragen dann
auch die gestrichenen Personen, vollständig und maschinenlesbar (R15). Und ein
geteilter Link legt den ganzen Bogen als Text in einen Chatverlauf, ohne
Frist (R16). R16 mildert ein Hinweis an jedem Link-Weg (M18); R14 und R15 lassen sich technisch entschärfen (M16, M17).

Ob der Gewinn eintritt, hängt am Rest der Kette. Exportiert die Führungsstelle
PDF oder CSV auf ihre Laufwerke, steht sie dort, wo sie heute mit dem Scan
steht. Die Organisation sollte deshalb die Weiterleitung vom Meldekopf zur
Führungsstelle mitregeln (M19); die App kann das nicht.

## 7. Risikobewertung (Art. 35 Abs. 7 lit. c DSGVO)

Schutzziele in Anlehnung an das Standard-Datenschutzmodell (SDM): Vertraulichkeit
(V), Integrität (I), Verfügbarkeit (Vf), Transparenz (T), Intervenierbarkeit
(Iv), Nichtverkettung (N).

| # | Risiko | Schutzziel | Eintrittswahrscheinlichkeit | Schwere für Betroffene | Gesamt |
| --- | --- | --- | --- | --- | --- |
| R1 | Verlust/Diebstahl eines Geräts mit unverschlüsseltem `localStorage` → Zugriff auf die lokal gespeicherten Bögen und die Absenderkarte | V | Mittel | Niedrig-Mittel: wegen der Datenschutzfrist (5.7) nur Personaldaten der letzten 90 Tage, dazu Übungsbögen, Vorlagen und Beiseitegelegtes (zum Personalstamm siehe R12) | Niedrig-Mittel |
| R2 | Verlust/Fehlleitung eines gedruckten PDF- oder exportierten CSV-Dokuments, eines geteilten Links oder einer Sicherungsdatei | V | Mittel | Mittel | Mittel (von der Datenschutzfrist nicht erfasst) |
| R3 | Speicherung über den Zweck hinaus: Für Bögen ist die Datenschutzfrist umgesetzt (5.7, nach 90 Tagen anonymisiert). Ohne Frist bleiben Übungsbögen und Vorlagen | Vf/T | Niedrig (nur fristfreie Übungsbögen/Vorlagen) | Niedrig-Mittel | Niedrig |
| R4 | Diebstahl/Auslesen des privaten Signaturschlüssels vom Gerät (unverschlüsselt im `localStorage`) oder aus einer Sicherungsdatei → Signieren im Namen des Geräts | I | Niedrig | Niedrig (Trust-Modell ist ohnehin nur TOFU; der Schlüssel ist über die Fußzeile austauschbar, siehe 5.7) | Niedrig |
| R5 | Speicher-Überlastung durch präparierte Import-Datei. Die Dekomprimierung ist begrenzt (`inflateRawBegrenzt`, Deckel `MAX_ENTPACKT` = 4 MiB) | Vf | Sehr niedrig | Niedrig (Verfügbarkeits-, kein Vertraulichkeitsrisiko) | Sehr niedrig |
| R6 | Keine Verkettbarkeits-Kontrolle: Kennzeichen/Funkrufname in Bögen und Exporten könnten über mehrere Einsätze hinweg dieselbe Person/dasselbe Fahrzeug wiedererkennbar machen | N | Niedrig-Mittel | Niedrig | Niedrig |
| R7 | Fehlende eigene Zugriffssperre der App (verlässt sich auf Betriebssystem-/Gerätesperre) | V | Mittel | Niedrig-Mittel | Niedrig-Mittel |
| R8 | Strukturelle Grenze der Betroffenenrechte bei bereits weitergereichten Kopien (6.3) | Iv | Hoch (systembedingt) | Niedrig-Mittel: digitale Kopien in anderen App-Installationen verfallen nach 90 Tagen von selbst; Papier, Exporte und der QR-Inhalt selbst nicht | Niedrig-Mittel |
| R9 | GoatCounter/Update-Check als einzige Netzwerkkontaktpunkte — technische Metadaten (IP-Adresse) fallen bei einem Dritten an | T | Hoch (jeder Aufruf) | Sehr niedrig | Niedrig |
| R10 | Unumkehrbarer Verlust der Personaldaten im laufenden Einsatz durch die Datenschutzfrist — bei einer falsch gehenden Geräteuhr oder einer Lage, die länger als 90 Tage ohne Bearbeitung des Bogens läuft | Vf | Niedrig: Uhrsprünge über 60 Tage (vor oder zurück) halten Anonymisierung, Aufräum- und Papierkorbfrist an und werden nie durch Zeitablauf, sondern nur nach ausdrücklicher Bestätigung durch den Helfer mit Rückfrage übernommen; „Wiederherstellen" aus dem Papierkorb setzt die Aufräumfrist neu; Ankündigung 14 Tage vor Ablauf; jede Bearbeitung startet die Frist neu | Niedrig-Mittel (Stärke und Summen bleiben erhalten, Namen fehlen) | Niedrig |
| R11 | Übungsbögen sind von der Datenschutzfrist ausgenommen — enthalten sie echte Personaldaten, liegen diese unbefristet auf den Geräten | V | Mittel (Übungen mit echtem Personal sind üblich) | Niedrig-Mittel | Niedrig-Mittel |
| R12 | Verlorenes oder weitergegebenes Gerät mit eingelesenem Personalstamm → Zugriff auf die vollständige Helferliste der Dienststelle, auch auf Personen ohne Einsatzbezug; keine automatische Löschfrist | V | Niedrig-Mittel (nur Geräte, auf denen die Liste eingelesen wurde) | Mittel (ganze Dienststelle, je nach Einlesen mit Rufnummern, Geschlecht und Ernährung) | Niedrig-Mittel |
| R13 | Bildschirmfotos und Bildschirmaufnahmen mit Personaldaten (Personalliste, Übersicht, Personalstamm) liegen außerhalb der App: in der Fotogalerie, je nach Gerät in deren Cloud-Sicherung, nach Weitergabe in Messengern. Die Datenschutzfrist und alle Löschwege der App erreichen sie nicht. Kein neuer Zugriff: Wer das Bild macht, sieht die Daten berechtigt und kann denselben Bogen auch als PDF, CSV, Link oder QR-Code ausgeben, es ist ein weiterer Kopierweg wie bei R2 | V | Mittel: ein Bildschirmfoto ist schneller gemacht als ein Export, etwa für eine Rückfrage per Messenger, und die Galerie-Sicherung läuft auf vielen Geräten ungefragt. Die Sperre der Android- und der Windows-Desktop-App senkt das dort; iOS, macOS und Browser bleiben offen (M14) | Mittel (Namen, je nach Ansicht Rufnummern; Kopie bei einem Cloud-Anbieter, ohne Frist und ohne Wissen der Organisation) | Mittel |
| R14 | Geschlecht und Ernährungsform stehen je Person in Bogen, QR-Code, Link und CSV, obwohl Unterbringung und Verpflegung nur Summen brauchen und der Papiervordruck nur Kopfzahlen führt (6.5). „D" oder „vegan" an einem Namen lässt im Einzelfall Rückschlüsse auf Geschlechtsidentität, Religion oder Gesundheit zu; die Angabe geht an jeden Empfänger im Meldeweg | V/N | Hoch (jeder Bogen mit Namen) | Niedrig-Mittel | Niedrig-Mittel |
| R15 | Mischweg Papier: Ein Führer druckt in der Einsatzvorbereitung das PDF der ganzen Einheit und streicht im Einsatz mit dem Stift. Der Hinweis neben dem Code sagt „nicht scannen" (`stiftHinweis` in `src/app/pdf-dokument.ts`), QR-Code und eingebettete Daten tragen die gestrichenen Personen aber weiter vollständig, samt Erreichbarkeiten. Jeder Scan oder jedes Foto am Meldekopf nimmt sie mit | V | Mittel (das Vorbereiten auf Papier wird gelehrt) | Niedrig-Mittel (Personen ohne Einsatzbezug, maschinenlesbar) | Niedrig-Mittel |
| R16 | Ein über „Senden" oder „Link teilen" weitergegebener Bogen liegt als vollständiger Text im Verlauf des gewählten Messengers oder Mailprogramms, bei nicht Ende-zu-Ende-verschlüsselten Diensten auch beim Anbieter, ohne Frist. Beim Öffnen entfernt die App das Fragment aus der Adresszeile (`fragmentNehmen` in `src/app/app.tsx`). Chromium behält die ursprüngliche Adresse samt Bogen trotzdem im Verlauf (Test mit Chromium 1243, Profil-Datenbank `History`) und damit auch in einer eingeschalteten Browser-Synchronisierung beim Anbieter des Browsers; Safari und Firefox sind nicht geprüft. Dasselbe gilt für Vorlagen-Links | V | Mittel; durch den Hinweis an jedem Link-Weg (M18) niedrig-mittel | Mittel (ganze Mannschaft mit Erreichbarkeiten) | Niedrig-Mittel |

**Höchste Einzelrisiken:** R1 (Geräteverlust), R2 (Papier-/Exportverlust) und R8
(strukturelle Grenze der Betroffenenrechte) — alle drei primär organisatorisch.
Wo ein Personalstamm eingelesen ist, gehört R12 dazu. R13 (Bildschirmfotos)
steht neben R2: Beide sind Kopien, die die App nicht mehr erreicht, das
Bildschirmfoto ist nur leichter gemacht und landet ungefragt in einer
Cloud-Sicherung. R14 bis R16 sind die Stellen, an denen die App mehr
preisgibt als das Papierverfahren (6.5); sie sind technisch zu senken.

## 8. Abhilfemaßnahmen (Art. 35 Abs. 7 lit. d DSGVO)

| # | Bezug | Maßnahme | Art | Verantwortlich | Restrisiko nach Umsetzung |
| --- | --- | --- | --- | --- | --- |
| M1 | R1, R12 | Verbindliche Geräte-Bildschirmsperre (PIN/Biometrie) als Dienstanweisung; wo verfügbar, Festplatten-/Profilverschlüsselung aktivieren | Organisatorisch/technisch | `[Organisation/IT-Verantwortliche/r]` | Niedrig |
| M2 | R1, R4 | Perspektivisch: Ablage sensibler Daten über plattformeigene sichere Speicher (z. B. Electron `safeStorage`/Betriebssystem-Schlüsselbund) statt `localStorage` — als Hinweis an den Projektbetreiber | Technisch (Weiterentwicklung) | `[Projektbetreiber/Maintainer]` | Niedrig (nach Umsetzung) |
| M2a | R4 | Bei Verdacht auf Kompromittierung eines Geräts den Signaturschlüssel über „Geräteschlüssel neu erzeugen" (Fußzeile) austauschen und die neue Kurzform an Meldekopf/Führungsstelle geben; Zuständigkeit und Weg dafür festlegen | Organisatorisch (technische Grundlage vorhanden) | `[Organisation]` | Niedrig |
| M3 | R2, R8 | Dienstanweisung: gedruckte/exportierte Bögen wie das bisherige Papierformular behandeln (Aufbewahrung, Zugriffsschutz, dokumentierte Vernichtung); Sicherungsdateien wie einen Schlüssel behandeln und zulässige Ablageorte festlegen | Organisatorisch | `[Organisation]` | Niedrig-Mittel |
| M4 | R3 | Technisch umgesetzt: Datenschutzfrist von 90 Tagen (5.7). Für die Organisation bleibt: prüfen, ob 90 Tage zum eigenen Zweck passen, eine Frist für Papierausdrucke, Exporte und Sicherungsdateien festlegen, einen Altbestand an Sammlungen überführen oder löschen und die Papierkorb-Funktion in einer Kurzanleitung erklären | Technisch (umgesetzt) / Organisatorisch | `[Organisation/Datenschutzbeauftragte/r]` | Niedrig |
| M5 | R8 | Verfahrensanweisung für Auskunfts-/Löschanfragen, die auch bereits weitergereichte Bögen einschließt | Organisatorisch | `[Organisation/Datenschutzbeauftragte/r]` | Niedrig-Mittel |
| M6 | R5 | Umgesetzt: Obergrenze für die Größe dekomprimierter Importe (`MAX_ENTPACKT` = 4 MiB, streamend geprüft). Für die Organisation bleibt: eine aktuelle App-Version einsetzen | Technisch (umgesetzt) | `[Projektbetreiber/Maintainer]` | Sehr niedrig |
| M7 | R6 | Bei organisationsübergreifender Weitergabe prüfen, ob Kennzeichen/Funkrufname wirklich benötigt werden, und optionale Felder leer lassen | Organisatorisch | `[erfassende/exportierende Person]` | Sehr niedrig |
| M8 | R7 | App-eigene Zugriffssperre ist nicht vorgesehen — ersatzweise über Geräterichtlinie (M1) sicherstellen | Organisatorisch | `[Organisation]` | Niedrig |
| M9 | R9, 5.8 | Vor Produktivbetrieb klären, wer für die GoatCounter-Messung verantwortlich ist und ob eine Vereinbarung nach Art. 26 oder 28 DSGVO nötig ist; alternativ den Widerspruch („Nicht mitzählen" im Datenschutz-Dialog, `skipgc`) auf den Geräten der Organisation setzen | Organisatorisch/rechtlich | `[Organisation/Datenschutzbeauftragte/r]` | Sehr niedrig |
| M10 | 6.4 | Eigene Datenschutzinformation für Nutzer/Personal erstellen (Zweck, Speicherort, Rechte, Kontakt), einschließlich der Personen im Personalstamm | Organisatorisch | `[Organisation]` | — (Transparenzpflicht) |
| M11 | R11 | Dienstanweisung: In als Übung gekennzeichnete Bögen nur Personaldaten eintragen, deren unbefristete Speicherung vertretbar ist (sonst Beispielnamen oder Stärke-Erfassung nutzen); Übungsbögen nach der Übung manuell löschen. Die App weist beim Übungshaken und im Übungs-Störer darauf hin | Organisatorisch (technischer Hinweis vorhanden) | `[Organisation]` | Niedrig |
| M12 | R10 | Bei Lagen, die länger als 90 Tage laufen, die Bögen aktiv fortschreiben oder rechtzeitig als PDF sichern; die App kündigt die Anonymisierung 14 Tage vorher an. Die Frage „Geräteuhr prüfen" nicht ungelesen bestätigen | Organisatorisch | `[erfassende Person/Meldekopf]` | Niedrig |
| M13 | R12 | Personalstamm nur auf dienstlichen Geräten mit Gerätesperre (M1) einlesen; festlegen, wer die Liste einliest, auf welchen Geräten sie liegen darf und wann sie zu erneuern oder zu löschen ist; Rufnummern beim Einlesen abwählen, Geschlecht und Ernährung nur einlesen, wenn nötig. Die App erinnert 90 Tage nach dem Einlesen und bietet „Personalstamm löschen…" | Organisatorisch (technische Grundlage vorhanden) | `[Organisation/Datenschutzbeauftragte/r]` | Niedrig |
| M14 | R13, R2 | Dienstanweisung: keine Bildschirmfotos oder -aufnahmen mit Personaldaten; wo eines für eine Fehlermeldung oder Schulung nötig ist, mit Beispielnamen (Übungsbogen) oder mit „Namen verbergen" arbeiten und es danach löschen. Ein Bildschirmfoto mit Namen ist wie ein Export zu behandeln (M3). Auf Dienstgeräten die automatische Cloud-Sicherung der Fotogalerie abschalten oder auf einen von der Organisation freigegebenen Speicher legen. Technisch umgesetzt: Screenshot-Sperre ab Werk an und abschaltbar. Android-App: `FLAG_SECURE` sperrt Bildschirmfotos, Aufnahmen, Übertragung auf unsichere Anzeigen und die Vorschau in der App-Übersicht, nicht aber fremde Fenster, die die App öffnet (Kamera-Scanner, Teilen-Menü, Dateiauswahl). Desktop-App: `setContentProtection` nimmt die Fenster unter Windows (ab Windows 10 Version 2004) aus Bildschirmfotos und Aufnahmen; unter macOS umgehen neuere Aufnahmeprogramme auf Basis von ScreenCaptureKit die Sperre, unter Linux gibt es keine. iOS-App: keine Sperre möglich; bei Bildschirmaufnahme, Spiegelung und AirPlay sowie in der Vorschau des App-Umschalters ist der Inhalt verdeckt, nach einem Bildschirmfoto weist die App darauf hin, wohin es geraten ist. Browser/PWA: weder Sperre noch Erkennung. Auf allen Plattformen: Sichtschutz „Namen verbergen" (5.5). Gegen das Abfotografieren mit einem zweiten Gerät hilft keine dieser Maßnahmen | Organisatorisch / Technisch (umgesetzt) | `[Organisation/IT-Verantwortliche/r]` | Niedrig-Mittel (Android, Windows); Mittel (iOS, macOS, Browser, solange die Dienstanweisung nicht greift) |
| M15 | R1, 6.5 | Technisch umgesetzt: Jede Vorlagenkarte nennt den Stand der Mannschaft. Nach 180 Tagen ohne Änderung fragt sie, ob jemand ausgeschieden ist, und bietet „Mannschaft stimmt noch" an; Umbenennen zählt nicht als Prüfung (`VORLAGE_PRUEFEN_TAGE`, `mannschaftGeprueft` in `src/app/vorlagen.ts`). „Vorlage teilen" nennt vor dem Teilen die Zahl privater Rufnummern und Adressen. Für die Organisation bleibt: Ausgeschiedene aus Vorlagen entfernen, wenn die Karte fragt, und die Frage nicht ungelesen bestätigen | Technisch (umgesetzt) / Organisatorisch | `[Organisation]` | Niedrig |
| M16 | R15 | Vorschlag: Ein eigener Ausdruck „Liste zum Abhaken" aus einer Vorlage, ohne QR-Code und ohne eingebettete Daten, mit einer Spalte „dabei" und dem Satz, dass am Meldekopf ein Bogen aus der Musterung abgegeben wird. Ergänzend: Das Bogen-PDF fragt vor dem Druck, wenn es aus einer ungemusterten Vorlage stammt, ob wirklich alle mitfahren. Organisatorisch bis dahin: in der Einsatzvorbereitung die Vorlage in der App pflegen und erst nach der Musterung drucken; ein mit dem Stift gestrichenes PDF wie das Papierverfahren behandeln, nicht scannen und nicht fotografieren | Technisch (Vorschlag) / Organisatorisch | `[Projektbetreiber/Maintainer]`, `[Organisation]` | Niedrig |
| M17 | R14 | Vorschlag: Unterbringung und Verpflegung nur als Summen übertragen, wie auf dem Vordruck. Erster Schritt ohne Formatänderung: Geschlecht und Ernährung je Person in der CSV nur auf ausdrückliche Wahl ausgeben. Zweiter Schritt mit Schemaänderung: ein Bogen-Flag „nur Summen", bei dem QR-Code und Link Kopfzahlen statt Personenwerten tragen. Der zweite Schritt betrifft `vendor/eeb-format`, die VBA-Portierung, die Meldekopf-App und S1-Control und ist mit den Nutzern der Unterbringungsplanung abzustimmen, falls dort Zimmer je Person vergeben werden | Technisch (Vorschlag) | `[Projektbetreiber/Maintainer]` | Niedrig |
| M18 | R16 | Technisch umgesetzt: Am Weg „Link teilen" für Bögen und Vorlagen steht, dass der Link alle Namen und Erreichbarkeiten enthält, im Chat und im Browserverlauf der Gegenstelle bleibt, auch nach der Datenschutzfrist, und dass vor Ort QR-Code und Nahbereich der bessere Weg sind. Datenschutz-Dialog der App und Datenschutzerklärung der Website nennen den Browserverlauf und dessen Synchronisierung. Offen: Verhalten von Safari und Firefox prüfen. Organisatorisch: Bögen nicht über Messenger ohne Ende-zu-Ende-Verschlüsselung oder über private Konten weitergeben, Chats nach dem Einsatz löschen, auf Dienstgeräten die Synchronisierung des Browserverlaufs abschalten | Technisch (umgesetzt) / Organisatorisch | `[Organisation]` | Niedrig-Mittel |
| M19 | R2, R8, 6.5 | Weiterleitung vom Meldekopf zur Führungsstelle regeln: Bögen am Meldekopf per QR-Code einlesen statt fotografieren, keine Fotos von Bögen mit privaten Telefonen; festlegen, welche Kopie ins Einsatztagebuch geht (eine, als Anlage) und dass Scans, PDF- und CSV-Exporte außerhalb des Einsatztagebuchs nach Abschluss des Einsatzes gelöscht werden; Ablageort und Löschfrist für Exporte auf Laufwerken der Führungsstelle bestimmen. Die Regel gilt für Papierbögen genauso und schließt eine Lücke, die es ohne die App schon gibt | Organisatorisch | `[Organisation/Führungsstelle/Datenschutzbeauftragte/r]` | Niedrig-Mittel |

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
aufgeführten organisatorischen Maßnahmen (insbesondere M1, M3, M4, M5, M14 und,
wo ein Personalstamm eingelesen wird, M13) umgesetzt werden, verbleibt ein geringes
bis gering-mittleres Restrisiko für die Rechte und Freiheiten der betroffenen
Personen. Ein hohes Risiko im Sinne des Art. 36 DSGVO wird nicht gesehen.

Die Einschätzung stützt sich auf technische und organisatorische Maßnahmen:
- **Technisch umgesetzt** sind die Löschfrist für digital gespeicherte Bögen
  (Datenschutzfrist, M4), die Begrenzung der Dekomprimierung (M6) sowie
  Screenshot-Sperre und Sichtschutz (M14), Letztere mit plattformabhängiger
  Reichweite.
- **R1, R3 und R8** sind deshalb niedrig bis niedrig-mittel bewertet.
- **Folgerisiken der Frist** sind die niedrigen Risiken R10 und R11 mit den
  Maßnahmen M11 und M12.
- **Organisatorisch** hängt das Ergebnis an M1, M3 und M5 für Geräte, Papier,
  Exporte und bereits weitergegebene Kopien, an M14 für Bildschirmfotos (R13,
  vor allem auf iOS, macOS und im Browser) sowie an M13 für den Personalstamm.
- **Gegenüber dem Papierverfahren** (6.5) ist die App bei Nutzung von Vorlage,
  Musterung und QR-Übergabe datensparsamer. R14 bis R16 sind die Stellen, an
  denen sie mehr preisgibt. M15 und M18 sind umgesetzt, M16 und M17 stehen
  als Vorschlag für den Projektbetreiber,
  M19 regelt die Weiterleitung zur Führungsstelle, die heute schon ohne
  Löschkontrolle läuft.

Diese Einschätzung ersetzt keine rechtliche Prüfung.

| Rolle | Name | Datum | Unterschrift |
| --- | --- | --- | --- |
| Verantwortlicher/Leitung | `[Name]` | | |
| Datenschutzbeauftragte/r | `[Name]` | | |
| Ersteller/in dieses Entwurfs | KI-gestützte Analyse (Claude), fachlich zu verantworten durch `[Name]` | 2026-11-28 | |

## Anhang: Herangezogene Quellen

- `docs/datenmodell.md` — Datenmodell, QR-Payload-Format, Absenderkarte, Signaturkette
- `vendor/eeb-format/src/model.ts` — Feldebene der Entitäten Person, Fahrzeug, Einheit, Einsatz, Sofortbedarf
- `vendor/eeb-format/src/datenschutzfrist.ts`, `src/app/datenschutz-uhr.ts` — Datenschutzfrist, Anonymisierung, geprüfte Geräteuhr
- `vendor/eeb-format/src/signatur.ts` — Schlüsselerzeugung, Signatur, Verifikation
- `src/app/geraete-schluessel.ts`, `src/app/speicher-browser.ts` — lokale Speicherung, Schlüsselablage
- `src/app/entwurf.ts`, `src/app/unlesbar.ts`, `src/app/rueckweg-sitzung.ts`, `src/app/wartender-link.ts` — Entwurf, Rückholplatz, Beiseitegelegtes, Merker im Sitzungsspeicher
- `src/app/personalstamm.ts`, `src/app/personalstamm-import.ts` — Personalstamm
- `src/app/meldekopf-app.ts`, `src/app/meldekopf-altbestand.ts`, `src/app/einsaetze-lesen.ts` — Verweis auf die Meldekopf-App, Altbestand an Sammlungen
- `src/app/word-bogen.ts` — Import des THW-Word-Bogens, Kopfzahlen des Vordrucks
- `src/app/vorlagen.ts`, `src/app/vorlagen-ui.tsx` — Vorlagen und Musterung (`vorlageInstanziieren`)
- `src/app/pdf-dokument.ts` — Ausdruck, Hinweis zu Stiftänderungen (`stiftHinweis`)
- `src/app/statistik.ts` — Reichweitenmessung (GoatCounter), dokumentierte Rechtsgrundlage im Code-Kommentar
- `src/app/csv.ts`, `src/app/bogen-csv.ts` — Export-Format CSV und dessen Absicherung
- `src/app/sicherung.ts`, `src/app/vorlagen.ts` — Datensicherung, Löschen, Papierkorb
- `PRODUCT.md`, `docs/entwicklung.md` — Produktkontext und technische Gesamtübersicht
- [Arc42-Architekturdokumentation](arc42-architektur.md) und
  [Informationssicherheitskonzept](informationssicherheitskonzept.md) dieses Projekts
