# Informationssicherheitskonzept

**Digitaler Einheiten-Erfassungsbogen — Vorlage/Entwurf**
Grundlage: Repository `wattnpapa/erfassungsbogen`, Stand 2026-09-12 — Version 0.1 (Entwurf)

> **Quelle dieses Dokuments.** Markdown-Fassung von `ISK-Erfassungsbogen.docx`.
> Die technischen Aussagen wurden am 2026-09-12 gegen `main` (Commit `c7604e9`)
> und den angehefteten Submodul-Commit `87b40dd` nachgeprüft; Ergänzungen und
> Korrekturen sind als *Prüfvermerk* gekennzeichnet.
>
> **Wichtig:** Der Entwurf entstand auf dem Stand vom 2026-09-11. Der Commit
> „Sicherheitsbericht umsetzen: SBOM, CSP ohne unsafe-inline, Entpack-Grenze"
> (`c7604e9`, 2026-09-12) hat drei der hier genannten Schwachstellen bereits
> behoben: die Dekomprimierungs-Obergrenze (6.2/R2/M2), `'unsafe-inline'` bei
> `script-src` (5.3/6.2/R4/M4) und die fehlende Schwachstellenprüfung der
> Abhängigkeiten (6.4/R8/M8). Die betroffenen Abschnitte sind entsprechend
> gekennzeichnet.
>
> **Nachgezogen 2026-09-13:** Datenschutzfrist — nach 90 Tagen anonymisiert die
> App die Personaldaten gespeicherter und eingelesener Bögen, Übungen
> ausgenommen (3.3, 5.5; Branch `feat/datenschutzfrist`).
>
> **Nachgezogen 2026-09-23:** „Vorlage teilen" (Issue #26) — eine einzelne
> Vorlage lässt sich als signierter QR-Code/Link oder als unsignierte
> JSON-Datei weitergeben und wieder einlesen (3.3 D5, 5.4).
>
> **Nachgezogen 2026-09-27:** Teilexport „Nur neue Bögen seit dem letzten
> Export" — die App merkt sich je Einsatz-Sammlung, welche Meldungen schon
> exportiert wurden (3.3 D2b, 5.4).
>
> **Nachgezogen 2026-09-28:** Rückholung des Entwurfs (Audit Runde 2, R2-N1,
> R2-E1, R2-K1) — der Entwurf kennzeichnet die Erfassung einer fremden Einheit
> am Meldekopf; sie darf den eigenen Bogen nicht mehr vom Rückholplatz
> verdrängen und wird im Zweifel mit Ansage verworfen. Folgemeldungen erben auf
> jedem Eingangsweg Zug, Auftrag und Eintreffzeit (3.3 D1, D2c).
>
> **Nachgezogen 2026-09-29:** Excel-Liste „Oldenburg" (Audit Runde 2, R2-K2) —
> trägt jetzt Eintreff-/Abrückzeit und den Auftrag/die Notiz der
> Führungsstelle; nicht zählende Einheiten stehen in einem Block außerhalb der
> SUBTOTAL-Summen (5.4).
>
> **Nachgezogen 2026-09-29:** „Entfernen" einer Meldung (Audit Runde 2, R2-D1)
> nimmt die Einheit jetzt mit allen Fassungen aus der Einsatz-Sammlung; bisher
> blieb die ältere Fassung samt Personendaten stehen und zählte wieder. Eine
> einzelne Fassung lässt sich getrennt in der Historie verwerfen (5.5).
>
> **Nachgezogen 2026-09-29:** Stand am Meldekopf auf den Bogenseiten der
> Sammel-PDF (Audit Runde 2, R2-A1) — Eintreff-/Abrückzeit, Zug und
> Auftrag/Notiz stehen zusätzlich über jedem Bogen und neben jedem QR-Code;
> der QR-Code selbst bleibt unverändert (kein Formatwechsel) (5.4).
>
> **Nachgezogen 2026-09-29:** „Sicherung einspielen" (Audit Runde 2, R2-D3)
> prüft die Datei vor der Rückfrage und nennt dort die laufenden Sammlungen des
> Geräts mit Namen und Meldungszahl sowie den Inhalt der Datei; es bietet
> „Vorher Sicherung erstellen…" an und verlangt einen Haken, sobald laufende
> Sammlungen ersetzt würden (5.5).
>
> **Nachgezogen 2026-09-29:** Gedächtnis entfernter Meldungen (Audit Runde 2,
> R2-D4) — die App merkt sich je Sammlung die Kennungen vor Ort entfernter
> Einträge (`eeb.entfernt.v1`) und fragt bei „Einsatz importieren…", bevor sie
> eine davon wieder aufnimmt (3.3 D2e, 5.5).
>
> **Nachgezogen 2026-09-29:** Dauerhafter Speicher und Sicherungs-Erinnerung
> (Audit Runde 2, R2-O6) — die Web-App bittet den Browser um dauerhaften
> Speicher (`navigator.storage.persist`), sobald Sammlungen mit Meldungen oder
> Vorlagen vorliegen, zeigt den Status und die letzte Sicherung in der
> Datensicherung und erinnert in der Fußzeile nach drei Tagen ohne Sicherung
> (3.3 D2f, 5.5).
>
> **Nachgezogen 2026-09-29:** Zwei Fenster, ein Entwurf (Audit Runde 2, R2-O4)
> — ein Fenster überschreibt den Entwurf nicht mehr still, wenn ein anderes
> Fenster ihn inzwischen geändert hat, sondern fragt; Einsatz-Sammlungen
> werden bei Änderungen aus einem anderen Fenster neu eingelesen (3.3 D1).
>
> **Nachgezogen 2026-09-29:** Die Quittung mit „Rückgängig" nach Entfernen und
> Abrücken steht fest im Daumenbereich statt am Seitenanfang (Audit Runde 2,
> R2-H4); Lebensdauer des Rückwegs präzisiert, keine neue Speicherung (5.5).
>
> **Nachgezogen 2026-09-29:** Vermerke der Führungsstelle (Audit Runde 2,
> R2-K6) — Zug, Auftrag/Notiz, Zeitkorrektur und Abrücken werden mit Uhrzeit
> als Zusatzfeld `vermerke` am Eintrag festgehalten (Vorwert eines Auftrags
> steht im Vermerk, also auch dessen Freitext); Herkunft einer Meldung auf
> Karte und in den CSV-Exporten einheitlich benannt (3.3 D2c).
>
> **Nachgezogen 2026-09-29:** Automatische Löschung ruhender Sammlungen (Audit
> Runde 2, R2-D5) — nach der Löschung nennt die Startseite die entfernte
> Sammlung einmal beim Namen (neuer Speicherort `eeb.aufgeraeumt.v1`, ohne
> Personendaten); die Ankündigung ab Tag 60 nennt die tatsächliche Ruhezeit
> (3.3 D2g).
>
> **Nachgezogen 2026-09-29:** Lageblatt/Übergabeblatt (Audit Runde 2, R2-K3) —
> Zug, Bedarf und Lückenzahl je Einheit, Änderungen als „von … auf …",
> Bedarf und Zwischensummen nebeneinander (5.4).
>
> **Nachgezogen 2026-09-29:** Lageblatt zum Weiterführen (Audit Runde 2,
> R2-A3) — Funkrufname und Rückrufnummer je Einheit, freie Zeilen; Zeitpunkt
> des letzten Lageblatts wird gemerkt (3.3 D2h, 5.4).
>
> **Nachgezogen 2026-09-29:** Hinweis „von Hand geändert" neben dem QR-Code
> (Audit Runde 2, R2-A4) — Stiftkorrekturen stecken nicht im Code (5.4).
>
> **Nachgezogen 2026-09-29:** Foto-Einlesen (Audit Runde 2, R2-A2) — liest
> alle QR-Codes eines Bildes und merkt Teile unvollständiger mehrteiliger
> Bögen bis zu einer Stunde im Arbeitsspeicher (nicht im Gerätespeicher) für
> den nächsten Durchgang (5.5).
>
> **Nachgezogen 2026-09-29:** Rückweg bei Aufteilen und Einsatz löschen (Audit
> Runde 2, R2-D6) — „Rückgängig" nach dem Aufteilen entfernt die beiden dabei
> angelegten Einträge und merkt ihre Kennungen in `eeb.entfernt.v1`; „Einsatz
> löschen" quittiert auf der Startseite mit „Rückgängig" aus dem Papierkorb.
> Kein neuer Speicherort (5.5).
>
> **Nachgezogen 2026-09-29:** Übergabevermerk (Audit Runde 2, R2-W5) — nach
> „Einsatz weitergeben / sichern" merkt sich die App Zeitpunkt und Kennungen
> der weitergegebenen Meldungen (neuer Speicherort `eeb.weitergabe-stand.v1`,
> ohne Personendaten) und zeigt ihn in der Einsatzansicht und auf der
> Startseitenkarte (3.3 D2i).
>
> **Nachgezogen 2026-09-29:** Lageblatt und Sammel-PDF (Audit Runde 2, R2-A6)
> — laufende Nummer je Meldung („Nr. 3", aus der Eingangsreihenfolge, wie an
> der Karte), Zeitpunkte einheitlich „TT.MM.JJJJ, hh:mm", Blanko-Vordruck mit
> Stärke-Legende. Keine neuen Daten (5.4).
>
> **Nachgezogen 2026-10-04:** Kenntnisnahme in der Einsatzansicht (Audit
> Runde 3, R3-K1) — die App merkt sich je Sammlung, welche Meldungen beim
> letzten „Zur Kenntnis genommen" schon da waren (neuer Speicherort
> `eeb.kenntnis-stand.v1`, nur Kennungen und Zeitpunkt, keine
> Personendaten), und nennt bis dahin neue Einheiten und Folgemeldungen auch
> nach einem Neuladen (3.3 D2j).
>
> **Nachgezogen 2026-10-04:** Bemerkung der Einheit (Audit Runde 3, R3-K3) —
> der Freitext „Sonstiges" des Bogens steht jetzt auch auf der Karte, auf
> Lageblatt und Übergabeblatt (unter dem Auftrag, auf dem Lageblatt gekürzt)
> und in der Übersichts-CSV (neue letzte Spalte „Bemerkung (Einheit)"); die
> Suche der Einsatzansicht findet ihn. In „Alle Daten als CSV", der
> Excel-Liste und dem Bogen-PDF stand er schon. Kein neuer Speicherort,
> CSV mit der bestehenden Formel-Abwehr (5.4).
>
> **Nachgezogen 2026-10-05:** Exporte der Einsatz-Sammlung (Audit Runde 3,
> R3-K7) — Übersichts-CSV und „Alle Daten als CSV" führen die laufende
> Nummer der Meldung („Nr." bzw. „Meldung Nr.") wie Karte und Lageblatt und
> schreiben alle Zeitpunkte einheitlich „TT.MM.JJJJ, hh:mm". „Alle Daten als
> CSV" enthält zusätzlich Eingetroffen, Abgerückt und Auftrag/Notiz der
> Führungsstelle (Freitext, bisher nur in Übersichts-CSV, Excel und PDF); die
> Spalte „Auftrag" heißt dort „Ort/Auftrag (Bogen)". Die Excel-Liste speichert
> die Summenwerte der Kopfzeile mit. Kein neuer Speicherort, keine neue
> Datenkategorie, CSV mit der bestehenden Formel-Abwehr (5.4).
>
> **Nachgezogen 2026-10-05:** Rückholplatz des Entwurfs (Audit Runde 3,
> R3-S1, R3-D2) — ein eingehender Bogen-Link verdrängt den angefangenen Bogen
> erst nach Rückfrage, auch bei laufender App (Fragmentwechsel, Universal
> Link) und beim Kaltstart; vorher wanderte der Entwurf beim Kaltstart schon
> beim Laden auf den Rückholplatz und löschte den dort liegenden Bogen ohne
> Hinweis. Kein neuer Speicherort (3.3 D1). Ebenso (R3-D1, R3-E2): Die
> Bearbeitung einer gespeicherten Vorlage kommt unverändert nie auf den
> Rückholplatz und verdrängt dort verändert keinen eigenen Bogen; „Aus Datei
> laden…" liest die Datei, bevor gefragt und verdrängt wird — eine
> unbrauchbare Datei lässt beide Plätze unberührt.
>
> **Nachgezogen 2026-10-05:** Beginn der Meldekopf-Erfassung (Audit Runde 3,
> R3-S6) — die Marke `fremd` am Entwurf trägt zusätzlich den Zeitpunkt, zu dem
> die Erfassung begann (`beginn`); liegen bis zur Übernahme mehr als fünf
> Minuten, fragt die App, ob er als Eintreffzeit gilt. Keine Personendaten,
> kein neuer Speicherort (3.3 D1).
>
> **Nachgezogen 2026-10-05:** Zwei Fenster (Audit Runde 3, R3-S3) — ein
> Fenster ohne eigenen Bogen, das einen neuen anlegt, überschreibt den
> Entwurf eines anderen Fensters nicht mehr still: Rückfrage mit Namen, dann
> liegt der fremde Stand auf dem Rückholplatz. Die Konfliktwarnung steht fest
> am oberen Bildrand (3.3 D1).
>
> **Nachgezogen 2026-10-05:** Abgleich beim Einsatz-Import (Audit Runde 3,
> R3-W1, R3-W2) — „Einsatz importieren…" übernimmt jetzt auch Abrücken, Zug,
> Auftrag und Eintreffzeit bekannter Einheiten vom anderen Gerät (jüngerer
> Vermerk gilt, Widersprüche stehen in Quittung und Verlauf), statt sie still
> zu verwerfen — Integrität der Lage. Der Weitergabe-Stand
> `eeb.weitergabe-stand.v1` führt zusätzlich Prüfsummen (FNV-1a) der bekannten
> Vermerke und den Zeitpunkt der letzten Übernahme, keinen Auftragstext
> (3.3 D2i).
>
> **Nachgezogen 2026-10-05:** Rückweg vom Papier (Audit Runde 3, R3-A2) —
> aus Bildern eingelesene neue Einheiten tragen am Eintrag der Sammlung den
> Zeitpunkt des Einlesens (`vomPapier`, keine Personendaten) und die Marke
> „vom Papier, Zeiten prüfen", bis Eintreffzeit, Status und Zug vom Blatt
> abgeglichen sind. Das Feld reist mit Sammel-PDF und Einsatz-Transport wie
> die übrigen Zusätze der Führungsstelle (3.3 D2).
>
> **Nachgezogen 2026-10-05:** Speicher und Offline (Audit Runde 3, R3-O2) —
> Lesen der Einsatz-Sammlungen schreibt nicht mehr: Eine Hülle in
> `src/app/speicher-schonend.ts` überspringt Schreibvorgänge mit
> unverändertem Text (vorher schrieb jedes Lesen die ganze Liste zurück, bei
> 5 Mio. Zeichen 64 Mio. Zeichen allein beim Start). Scheitert das
> Zurückschreiben einer Frist-Bereinigung beim bloßen Lesen (Speicher voll
> oder gesperrt), erscheint die Liste trotzdem, und Startseite bzw.
> Einsatzansicht melden den Speicher — vorher blieb der Bildschirm leer
> (Verfügbarkeit, 5.5). Kein neuer Speicherort; das gemerkte Lese-Ergebnis
> liegt nur im Arbeitsspeicher der geöffneten Seite.
>
> **Nachgezogen 2026-10-05:** Offline-Vorrat in zwei Stufen (Audit Runde 3,
> R3-O3, `vite.config.ts`, `scripts/precache-aufteilung.ts`,
> `src/app/offline-vorrat.ts`) — der Service Worker ist nach dem Kern
> (6,7 MB) aktiv statt nach allen 10,7 MB; Beispielbögen und Themenseiten
> lädt die Seite danach in den Laufzeit-Cache `eeb-zusatz`. Die Liste dafür
> (`offline-zusatz.json`) entsteht beim Build. Keine neuen Hosts, CSP
> unverändert (nur Abrufe an die eigene Herkunft, `connect-src 'self'`), keine
> personenbezogenen Daten im Cache (3.4 unverändert).
>
> **Nachgezogen 2026-10-05:** Speichermeldungen (Audit Runde 3, R3-O4) —
> „voll" und „gesperrt" werden unterschieden: Scheitert ein Schreibvorgang,
> prüft die App mit einem Ein-Zeichen-Eintrag `eeb.speicherprobe`, der sofort
> wieder entfernt wird (keine Daten), ob der Speicher überhaupt etwas annimmt.
> Ein gesperrter Speicher (Privatmodus, blockierte Website-Daten) wird als
> solcher benannt statt „Papierkorb leeren" zu empfehlen. Steht „Nicht
> gespeichert", fragt der Browser vor dem Schließen oder Neuladen nach
> (`beforeunload`, wo der Browser es zulässt). Anteile einzelner Sammlungen
> sind auf 100 % gedeckelt.
>
> **Nachgezogen 2026-10-05:** Geräteschlüssel bei vollem Speicher (Audit
> Runde 3, R3-E1) — scheitert das erstmalige Speichern des privaten
> Schlüssels, signiert die App mit einem Schlüssel nur für diese Sitzung
> (`src/app/geraete-schluessel.ts`), sagt das in der Übersicht am Siegel und
> speichert ihn, sobald wieder Platz ist. QR-Code und PDF entstehen damit
> auch auf einem frischen Gerät mit vollem Speicher; Speicherfehler erscheinen
> nirgends mehr als englischer Programmtext (`fehlerText`). Signaturformat
> unverändert (3.3 D4).
>
> **Nachgezogen 2026-10-05:** Rückwege (Audit Runde 3, R3-D4, R3-G1, R3-D3)
> — „Rückgängig" nach dem Entfernen einer Meldung bleibt beim Verlassen und
> Wiederöffnen der Einsatzansicht erhalten, bis die Seite neu lädt (weiter
> nur Arbeitsspeicher). „Person entfernen" und neu „Fahrzeug entfernen"
> halten die entfernte Person bzw. das Fahrzeug im Arbeitsspeicher, bis die
> Quittung geschlossen, ersetzt oder der Schritt verlassen wird. „Alle Daten
> löschen" nennt den Bogen auf dem Rückholplatz. Kein neuer Speicherort (5.5).
>
> **Nachgezogen 2026-10-05:** Rückfragen, Links, Rückholplatz (Audit Runde 4,
> Paket 1) — ein Kaltstart-Link auf einem Gerät mit Sammlung, aber ohne
> eigenen Bogen öffnete den fremden Bogen als eigenen Entwurf; jetzt fragt
> er „Wohin damit?" (R4-W3). „Aus Datei laden…" fragt bei vorhandener
> Sammlung ebenso (R4-N2). Derselbe Bogen ein zweites Mal geöffnet ersetzt
> nichts und löscht den Rückholplatz nicht mehr (R4-E2). „Meine Fassung
> behalten" legt den Stand des anderen Fensters auf den Rückholplatz statt
> ihn zu verwerfen (R4-S4). Neu ist ein inhaltsleerer Merker im
> **`sessionStorage`** (`eeb.abgleich.fortsetzen`, nur der Wert „1", lebt
> bis zum Schließen des Tabs), damit die Seite nach „Stand aus dem anderen
> Fenster laden" im Bogen beginnt (3.3 D1). „Sicherung einspielen" nennt
> jetzt Rückholplatz, Absenderkarte und Geräteschlüssel (mit Kurzform vorher
> und nachher) und verlangt den Haken, sobald auf dem Gerät überhaupt etwas
> verloren geht (R4-D2, 5.5). Zurück schließt eine offene Rückfrage als
> „Abbrechen", statt die Ansicht dahinter zu wechseln (R4-S1).
>
> **Nachgezogen 2026-10-06:** Meldungsfassungen, Exportstand, Führungssicht
> (Audit Runde 4, Paket 2) — „Nur neue Bögen" hat je Format (Sammel-PDF,
> Übersichts-CSV, Alle-Daten-CSV, Excel) einen eigenen Stand
> (`eeb.export-stand.v2`, 3.3 D2b); „Einsatz weitergeben / sichern" an die
> Ablösung und das Lageblatt verbrauchen ihn nicht (R4-W2). Alle Stände
> führen den Zustand je Einheit als Prüfsummen (Status samt Abrückzeit, Zug,
> Auftrag, Eintreffzeit), damit ein Abrücken als Änderung zählt und ein
> „Rückgängig" es zurücknimmt (R4-K1, R4-W7); der Nachtrag enthält die
> geänderten Einheiten. Neue Zusatzfelder am Eintrag: `ersetztDurch`/`ersetztAm`
> (welche Fassung gilt, R4-W1) und `nummer` (Nr. vom Papier, R4-A1) — keine
> Personendaten. Der Umschlag einer Nachtrag-PDF trägt `nachtragSeit`, der
> Import ohne die Lage fragt nach (R4-W4). Die Übersichts-CSV trennt
> „Unterbringung angefordert" und „WC/Dusche" und führt die Rückfragen
> (R4-W5, R4-K8); die Rückfragen prüfen den Einsatzzeitraum (R4-W6).
> Exportwege 5.4, Speicherorte 3.3.
>
> **Nachgezogen 2026-10-06:** Uhr, Speicher, Löschen, Offline, Zeiten (Audit
> Runde 4, Paket 4) — Aufräum- und Papierkorbfrist rechnen mit der **geprüften
> Geräteuhr**, nicht mehr mit der ungeprüften `Date.now()` des Kerns: Eine
> Hülle zwischen Kern und `localStorage` (`src/app/uhr-korrektur.ts`) zeigt
> dem Kern bei unplausibel vorgehender Uhr das Alter, das die geprüfte Uhr
> ergibt, und schreibt ehrliche Zeitstempel zurück; die Datenschutzfrist des
> Entwurfs, die Vorlagen-Papierkorb-Frist und die Aufräum-Nachricht nutzen
> dieselbe Prüfung (`src/app/datenschutz-uhr.ts`, R4-D1; 3.3 D2a, 5.5).
> Der Sprung gilt jetzt ab 60 Tagen gegenüber dem letzten Start (vorher 366
> Tage — ein falsch gestelltes Jahr kam durch und löschte beim Start die
> laufende Sammlung). Neu ist ein Speicherort ohne Personendaten: die Haken
> einer unterbrochenen Musterung (`eeb.musterung.v1`, 3.3 D2k, R4-E7). Der
> Rückweg einer entfernten Meldung bleibt im Arbeitsspeicher; die Rückfrage
> sagt das vorher und nennt, ob die Meldung in einem Export steht (R4-D3,
> 5.5). Der Papierkorb nennt Datum und Restzeit der endgültigen Entfernung,
> „Endgültig löschen…" und „Alle lokalen Daten löschen" nennen Sammlungen
> ohne jeden Export (R4-D5, 5.5). Der Rückholplatz trägt als Stand die letzte
> Bearbeitung des Bogens (R4-S5, 3.3 D1). Offline: Bricht das Erstladen ab
> und verwirft der Browser die Service-Worker-Registrierung, registriert die
> Seite neu und meldet „Laden abgebrochen" (`src/app/offline-bereit.ts`,
> R4-O1, 6.1); „PDF erzeugen" ohne geladenen Baustein nennt den QR-Code.
> Keine neuen Hosts, CSP unverändert.
>
> **Nachgezogen 2026-10-06:** Papier, Vordruck, Begriffe (Audit Runde 4,
> Paket 5) — Das Lageblatt trägt immer mindestens fünf Nachtragszeilen (passen
> sie nicht mehr auf die letzte Seite, bekommen sie eine eigene Rückseite) mit
> einer Spalte „übertragen" für den Haken „ins Gerät übertragen"; eine
> Einheitszeile bricht nicht mehr über den Seitenwechsel (R4-A3, R4-A4,
> R4-A7). Der Blanko-Vordruck trägt oben den Kasten „Meldekopf" mit Nr.,
> Eingang, Zug, Übung und „ins Gerät übertragen"; die ausgelieferte Datei
> unter `public/downloads/` ist neu erzeugt (R4-A4, R4-A8). Jede Codeseite
> nennt Einheit, Funkrufname und Stand, das Kästchen „von Hand geändert"
> steht auf dem Bogen neben der Stärke (R4-A5). Die Sammel-PDF setzt Bögen,
> die mit der letzten Zeile allein auf einer Seite enden würden, per Probesatz
> enger (R4-A7). Der Bericht von „Bögen einlesen…" fasst Bilder ohne Code
> zusammen (R4-A6). Keine neuen Daten, keine neuen Speicherorte, keine neuen
> Hosts, CSP unverändert. Exportwege 5.4.

## Hinweis zu diesem Dokument

Dies ist eine KI-gestützt erstellte Entwurfsvorlage, keine geprüfte oder
freigegebene Fassung. Grundlage ist eine technische Analyse des öffentlich
einsehbaren Quellcodes des Repositorys `wattnpapa/erfassungsbogen` (Stand siehe
Rahmendaten) samt der eingebundenen Submodule. Das Dokument ersetzt weder die
Bestellung und Mitwirkung einer/eines IT-Sicherheitsbeauftragten noch eine
formale Freigabe durch die Leitung der einsetzenden Organisation.

Die Anwendung hat keinen zentralen Betreiber: Es gibt keinen Server, keine
zentrale Datenhaltung und keine Nutzerkonten — jede Organisation
(THW-Ortsverband, Feuerwehr, Hilfsorganisation, Kommune …) setzt die App
eigenständig auf ihren eigenen Geräten ein. Ein pauschales, für alle
Organisationen gültiges Sicherheitskonzept kann es daher nicht geben. Dieses
Dokument ist deshalb bewusst als ausfüllbare Vorlage angelegt: Textstellen in
eckigen Klammern, z. B. `[Name der einsetzenden Organisation]`, markieren
durchgängig die Punkte, die jede Organisation für sich selbst ergänzen oder
bestätigen muss — insbesondere organisatorische Zuständigkeiten, den konkreten
Geräte-/Rollout-Kontext und die endgültige Schutzbedarfsfeststellung.

Struktur und Terminologie orientieren sich an BSI-Standard 200-2
(IT-Grundschutz-Methodik): Strukturanalyse, Schutzbedarfsfeststellung,
Modellierung anhand einschlägiger Bausteine des IT-Grundschutz-Kompendiums,
IT-Grundschutz-Check (Ist-Soll-Vergleich) und ergänzende Risikoanalyse für
Zielobjekte mit erhöhtem Schutzbedarf. Es handelt sich **nicht** um ein
vollständiges, auditfähiges IT-Grundschutz-Profil — dafür fehlen unter anderem
die physische und organisatorische Umgebung jeder einzelnen einsetzenden
Organisation, die aus dem Quellcode allein nicht ableitbar ist.

## 1. Zusammenfassung

Der digitale Einheiten-Erfassungsbogen ist eine Offline-first
Web-/Desktop-/Mobil-Anwendung für BOS-Einheiten (Behörden und Organisationen mit
Sicherheitsaufgaben), die Stärke-, Fahrzeug- und Bedarfsmeldungen im Einsatz- und
Übungsfall erfasst, zusammenführt und weitergibt. Die Architektur ist bewusst
serverlos: Es gibt keine zentrale Infrastruktur, jede Installation ist
eigenständig, und Daten wandern ausschließlich über einen physisch/lokal
begrenzten Kanal (QR-Code-Scan, Datei-Export/-Import, Nahfeld-Freigabe) zwischen
zwei Geräten.

Diese Architektur eliminiert eine ganze Klasse klassischer IT-Sicherheitsrisiken
(kein Server, der kompromittiert werden kann; keine Netzwerk-Angriffsfläche
zwischen den Geräten; keine zentrale Datenbank mit Massenzugriff). Sie
verschiebt die Verantwortung für Vertraulichkeit und Verfügbarkeit jedoch fast
vollständig auf das einzelne Endgerät und dessen Absicherung durch
Betriebssystem, Gerätesperre und die einsetzende Organisation.

Die technische Analyse des Quellcodes zeigt eine überdurchschnittlich sorgfältige
Sicherheitsgrundhaltung: kontextisolierter Electron-Prozess ohne Node-Zugriff im
Renderer, eine restriktive Content-Security-Policy, eine bewusst minimale
Rechtevergabe (nur Kamera und Zwischenablage), eine dokumentierte kryptografische
Signaturkette zur Herkunftsprüfung sowie Schutzmaßnahmen gegen
CSV-Formel-Injection beim Excel-Export. Gleichzeitig bestehen einige konkrete,
benennbare Schwachstellen bzw. Verbesserungspotenziale (unter anderem eine nicht
größenbegrenzte Dekomprimierung beim Import, ein unverschlüsselt abgelegter
privater Signaturschlüssel und eine CSP mit `unsafe-inline`), die in Abschnitt 6
und 8 mit konkreten Maßnahmen hinterlegt sind.

> *Prüfvermerk:* Mit `c7604e9` sind davon zwei erledigt — die Dekomprimierung ist
> auf 4 MiB gedeckelt (`inflateRawBegrenzt`), und `script-src` kommt ohne
> `'unsafe-inline'` aus (Hash-Freigabe der drei Inline-Blöcke). Offen bleibt der
> unverschlüsselt abgelegte private Signaturschlüssel (6.3/R3/M3).
>
> *Nachtrag:* Der private Schlüssel liegt weiterhin unverschlüsselt, der
> Wiederherstellungsweg dazu ist aber jetzt in der App selbst vorhanden:
> „Geräteschlüssel neu erzeugen" in der Fußzeile tauscht das Schlüsselpaar nach
> einer Rückfrage aus (M3). Ebenfalls neu: `SECURITY.md` beschreibt den
> Meldeweg für Schwachstellen im Hauptrepository und den vier Submodulen
> (6.4).

**Gesamteinschätzung dieses Entwurfs:** Unter der Voraussetzung, dass die in
Abschnitt 8 aufgeführten organisatorischen Maßnahmen (insbesondere
Geräteabsicherung und Sensibilisierung) durch die einsetzende Organisation
umgesetzt werden, ist von einem für den Einsatzzweck angemessenen, überwiegend
soliden Sicherheitsniveau auszugehen. Eine abschließende Bewertung obliegt
der/dem IT-Sicherheitsbeauftragten der jeweiligen Organisation.

## 2. Rahmendaten

| Feld | Angabe |
| --- | --- |
| Bezeichnung des Informationsverbunds | Digitaler Einheiten-Erfassungsbogen (App „Erfassungsbogen") |
| Verantwortlich für IT-Sicherheit | `[Name der einsetzenden Organisation, z. B. „THW-Ortsverband …", „Freiwillige Feuerwehr …"]` |
| IT-Sicherheitsbeauftragte/r | `[Name, Kontakt]` |
| Vertreten durch | `[Name, Funktion]` |
| Ersteller dieses Entwurfs | KI-gestützte Analyse des öffentlichen Quellcodes (Claude), auf Anforderung von `[Name]` |
| Grundlage | Repository `wattnpapa/erfassungsbogen`, Checkout-Stand 2026-09-11/12, `main`, inkl. Submodule `@bos/eeb-format`, `@bos/meldekopf`, `@bos/vokabulare`, `@bos/taktische-zeichen` |
| Geltungsbereich dieses Dokuments | Die Anwendung „Erfassungsbogen" selbst (Client-Software) sowie ihre Build-, Auslieferungs- und Update-Kette. **Nicht enthalten:** die physische und organisatorische IT-Sicherheit der einsetzenden Organisation (Gebäude, Netzwerk, sonstige Fachverfahren) |
| Version dieses Dokuments | 0.1 (Entwurf) |
| Datum der Freigabe | `[Datum der Freigabe einfügen]` |
| Nächste Überprüfung | `[Datum, spätestens bei Versions-Update mit sicherheitsrelevanten Änderungen oder nach 12 Monaten]` |
| Anlass | Ersteinführung der App bei `[Organisation]` / Regelmäßige Überprüfung |

## 3. Strukturanalyse

### 3.1 Überblick über den Informationsverbund

Die Anwendung besteht ausschließlich aus Client-Software, die auf den Endgeräten
der Einsatzkräfte läuft. Es existiert kein Anwendungsserver, keine zentrale
Datenbank und keine Benutzerverwaltung.

### 3.2 Zielobjekte: Anwendungen und Plattformen

| # | Zielobjekt | Beschreibung | Plattform(en) |
| --- | --- | --- | --- |
| A1 | Web-App / PWA | Hauptauslieferungsform unter erfassungsbogen.app; als Progressive Web App vollständig offlinefähig (Service Worker precacht alle Bausteine; Beispielbögen und Themenseiten seit 2026-10-05 als zweite Stufe nach der Aktivierung, R3-O3). Zusätzlich aus demselben Build als GitLab Pages auf dem Open-CoDE-Spiegel veröffentlicht (`.gitlab-ci.yml`, Job `pages`) — identischer Code, anderer Host; Installer und Auto-Update laufen unverändert über GitHub | Browser (Desktop/Mobil) |
| A2 | Desktop-App | Electron-Wrapper um dieselbe Web-App, für Windows, macOS und Linux; Auslieferung über GitHub Releases mit Auto-Update | Windows, macOS, Linux |
| A3 | Android-App | Capacitor-Wrapper um dieselbe Web-App | Android |
| A4 | iOS-App | Capacitor-Wrapper, laut Quellcode/Dokumentation in Vorbereitung, zum Analysezeitpunkt noch nicht produktiv | iOS (geplant) |

> *Prüfvermerk zu A2:* Der macOS-Build ist in `release.yml` per `if: false`
> stillgelegt (Kommentar vom 2026-09-05, Code-Signatur scheitert auf dem
> GitHub-Runner). Für macOS gibt es damit derzeit **kein** ausgeliefertes
> Desktop-Paket; produktiv verteilt werden Windows (x64 und arm64) und Linux
> (.deb/.pacman). Beim Rollout ist das zu berücksichtigen.

Alle vier Auslieferungsformen teilen sich denselben Anwendungscode (`dist/` aus
dem Vite-Build); es gibt keine serverseitige Variante.

### 3.3 Zielobjekte: Daten

| # | Zielobjekt | Beschreibung | Speicherort |
| --- | --- | --- | --- |
| D1 | Erfassungsbogen-Entwurf | Aktuell bearbeiteter Bogen (Personal, Fahrzeuge, Einsatz, Sofortbedarf); Personaldaten 90 Tage nach der letzten Änderung anonymisiert, außer bei Übungen (5.5). Wird eine Vorlage bearbeitet, trägt der Entwurf zusätzlich deren Kennung (`vorlageId`, keine Personendaten); ist er die Erfassung einer fremden Einheit am Meldekopf, die Marke `fremd` mit der Kennung der Ziel-Sammlung und dem Beginn der Erfassung (`beginn`, Zeitpunkt; Vorschlag für die Eintreffzeit, R3-S6; keine Personendaten). Außerdem der zuletzt offene Schritt (`schritt`) und der Stand der letzten Übergabe (`uebergabe`: Zeitpunkt, Inhaltskennung, Stärke als Zahlen, seit R3-H3 auch der Weg — QR gezeigt, PDF erzeugt, Link, Nahbereich — und ob der Nutzer den Empfang bestätigt hat; keine Personendaten, R2-N7/R2-W2). Ein verdrängter oder verworfener Bogen liegt auf einem einzigen Rückholplatz (`eeb.entwurf.ersetzt.v1`), gleiche Frist; als Stand trägt er seit 2026-10-06 die letzte Bearbeitung des Bogens, nicht den Zeitpunkt des Schließens (R4-S5); eine fremde Erfassung verdrängt dort nie einen eigenen Bogen, sondern wird dann nach Rückfrage verworfen (`src/app/entwurf.ts`). Ein eingehender Bogen (Link, Scan, Datei) verdrängt den angefangenen Bogen erst nach einer Rückfrage, die auch nennt, welcher Bogen dabei vom Rückholplatz fällt — das gilt seit R3-S1/R3-D2 auch für Links bei laufender App und beim Kaltstart. Eine Datei wird vorher gelesen; eine unbrauchbare Datei verdrängt nichts (R3-E2). Die Bearbeitung einer Vorlage kommt unverändert nicht auf den Rückholplatz und verdrängt dort verändert keinen eigenen Bogen (R3-D1). Sind zwei Fenster offen, schreibt ein Fenster nur über den Stand, den es selbst zuletzt geschrieben hat; hat ein anderes Fenster den Entwurf geändert, speichert es nicht und fragt („Stand aus dem anderen Fenster laden" / „Meine Fassung behalten", `src/app/fenster-abgleich.tsx`, `storage`-Ereignis, R2-O4); die Warnung steht fest am oberen Bildrand, und ein Fenster ohne eigenen Bogen legt den Entwurf eines anderen Fensters vor dem Anlegen nach Rückfrage auf den Rückholplatz (`entwurfAusAnderemFenster`, R3-S3); „Meine Fassung behalten" legt den Stand des anderen Fensters ebenfalls auf den Rückholplatz und fragt, wenn dabei ein dritter Bogen fiele (R4-S4). Ein eingehender Bogen, der dem offenen gleicht, ersetzt nichts und verdrängt nichts (R4-E2); ein Kaltstart-Link oder „Aus Datei laden…" auf einem Gerät mit Sammlung fragt zuerst „Wohin damit?" und legt eine fremde Meldung nicht als eigenen Entwurf ab (R4-W3, R4-N2) | `localStorage` des Geräts (`eeb.entwurf.v1`, `eeb.entwurf.ersetzt.v1`); nach „Stand aus dem anderen Fenster laden" kurz ein inhaltsleerer Merker im `sessionStorage` des Tabs (`eeb.abgleich.fortsetzen`, wird beim nächsten Start gelesen und gelöscht, R4-S4) |
| D2 | Gesicherte/archivierte Bögen | Übergebene bzw. empfangene Bögen inkl. Papierkorb (vor endgültiger Löschung); Meldungen der Einsatz-Sammlung unterliegen derselben Datenschutzfrist, Vorlagen nicht (5.5) | `localStorage` des Geräts |
| D2a | Uhrstand für alle Fristen | Zuletzt akzeptierter Zeitpunkt der Geräteuhr, ggf. unbestätigter Sprung; seit 2026-10-06 (R4-D1) gilt ein Vorsprung von mehr als 60 Tagen gegenüber dem letzten Start als Sprung und hält Datenschutzfrist, Aufräumfrist und Papierkorbfrist an (Uhrkorrektur-Hülle, `src/app/uhr-korrektur.ts`); keine Personendaten | `localStorage` des Geräts (`eeb.uhr.v1`), wandert mit der Datensicherung mit |
| D2b | Export-Stand je Einsatz-Sammlung **und Format** (seit 2026-10-06, R4-W2) | Je Format (Sammel-PDF, Übersichts-CSV, Alle-Daten-CSV, Excel) Kennungen der Meldungen, die beim letzten Export in diesem Format schon in der Sammlung standen, samt Zeitpunkt und dem Zustand je Einheit (Prüfsummen von Status samt Abrückzeit, Zug, Auftrag, Eintreffzeit; kein Auftragstext) — Grundlage für „Nur neue Bögen seit dem letzten Export" und „seitdem n Änderungen" (5.4); keine Personendaten, nur zufällige Kennungen und Prüfsummen. Der alte gemeinsame Merker (`eeb.export-stand.v1`) wird nicht übernommen und beim ersten Schreiben gelöscht | `localStorage` des Geräts (`eeb.export-stand.v2`), wandert mit der Datensicherung mit, fällt mit „Alle Daten löschen" weg |
| D2c | Zusatzfelder je Meldung der Einsatz-Sammlung | Eintreff- und Abrückzeit (`eingetroffenAm`, `abgerueckAm`, Geräteuhr) sowie eine Notiz/Auftrag der Führungsstelle (`notiz`, Freitext — kann Personenbezug enthalten, z. B. „Rückruf Hr. Meyer 15:00"); seit 2026-09-29 zusätzlich `vermerke` (Zeitstempel + Text je Handlung der Führungsstelle: Zug, Auftrag samt Vorwert, Zeitkorrektur, Abrücken; R2-K6). Seit 2026-10-06 zusätzlich `ersetztDurch`/`ersetztAm` (Kennung der Fassung, die an Stelle einer verdrängten gilt, und Zeitpunkt; R4-W1) und `nummer` (laufende Nummer vom gedruckten Lageblatt, nur nach dem Papier-Abgleich; R4-A1) — keine Personendaten. Eine Folgemeldung derselben Einheit erbt Eintreffzeit, Notiz und Zug der Vorgängerin auf jedem Eingangsweg (`meldungAufnehmen`). Reisen mit der Sammlung in Sammel-PDF und Einsatz-Transport mit; unterliegen mit der Meldung dem Papierkorb und der Löschung (`src/app/eintrag-zeiten.ts`) | `localStorage` des Geräts (`eeb.einsaetze.v1`, am Eintrag) |
| D2d | Zuletzt offene Sammlung | Kennung und Zeitpunkt der zuletzt geöffneten Einsatz-Sammlung, 12 Stunden gültig; keine Personendaten | `localStorage` des Geräts (`eeb.letzterEinsatz.v1`) |
| D2e | Entfernte Meldungen je Einsatz-Sammlung | Kennungen der Einträge, die vor Ort über „Entfernen" oder „Fassung verwerfen…" herausgenommen wurden — damit „Einsatz importieren…" sie nicht still zurückholt, sondern nachfragt (`src/app/entfernte-meldungen.ts`, Audit Runde 2, R2-D4); keine Personendaten, nur zufällige Kennungen; „Rückgängig" nimmt sie wieder heraus, Einträge endgültig gelöschter Sammlungen fallen beim nächsten Schreiben weg | `localStorage` des Geräts (`eeb.entfernt.v1`), wandert mit der Datensicherung mit, fällt mit „Alle Daten löschen" weg |
| D2f | Zeitpunkt der letzten Sicherung | Wann auf diesem Gerät zuletzt „Sicherung erstellen…" ausgelöst wurde — Grundlage für die Anzeige in der Datensicherung und die Erinnerung nach drei Tagen (`src/app/sicherung.ts`, Audit Runde 2, R2-O6); keine Personendaten | `localStorage` des Geräts (`eeb.sicherung.zuletzt.v1`), steht in der Sicherung selbst, fällt mit „Alle Daten löschen" weg |
| D2g | Nachricht über automatisch gelöschte Sammlungen (seit 2026-09-29, R2-D5) | Name, Zeitraum (angelegt/zuletzt geändert), Zahl der Einheiten und Meldungen sowie Löschzeitpunkt einer Sammlung, die die Aufräumfrist (90 Tage ohne Änderung) überschritten hat; keine Personendaten, Name der Sammlung als Freitext. Vorgemerkt von einer Hülle um die Ablage (`src/app/aufraeum-hinweis.ts`), bevor der Kern die Sammlung verwirft; bleibt bis „Verstanden" auf der Startseite | `localStorage` des Geräts (`eeb.aufgeraeumt.v1`), fällt mit „Alle Daten löschen" weg |
| D2h | Lageblatt-Stand je Einsatz-Sammlung (seit 2026-09-29, R2-A3) | Zeitpunkt des zuletzt erzeugten Lageblatts, Kennungen der Meldungen darauf und (seit 2026-10-06, R4-K1) der Zustand je Einheit als Prüfsummen — Grundlage für „Lageblatt erstellt … · seitdem n neue Meldungen und m Änderungen"; keine Personendaten | `localStorage` des Geräts (`eeb.lageblatt-stand.v1`), fällt mit „Alle Daten löschen" weg |
| D2i | Weitergabe-Stand je Einsatz-Sammlung (seit 2026-09-29, R2-W5; erweitert 2026-10-05, R3-W2) | Zeitpunkt der letzten Weitergabe der ganzen Sammlung („Einsatz weitergeben / sichern"), Kennungen der Meldungen darin, der Zustand je Einheit als Prüfsummen (seit 2026-10-06 statt der Vermerke, R4-K1/R4-W7; ältere Stände zählen weiter Vermerk-Prüfsummen) und Zeitpunkt der letzten Übernahme per Import — Grundlage des Übergabevermerks „Weitergegeben … · seitdem n neue Meldungen und m Änderungen"; keine Personendaten, kein Auftragstext | `localStorage` des Geräts (`eeb.weitergabe-stand.v1`), fällt mit „Alle Daten löschen" weg |
| D2j | Kenntnis-Stand je Einsatz-Sammlung (seit 2026-10-04, R3-K1) | Zeitpunkt der letzten Kenntnisnahme („Zur Kenntnis genommen" in der Einsatzansicht, beim ersten Öffnen einer Sammlung vorbelegt) und Kennungen der Meldungen, die da schon in der Sammlung standen — Grundlage der Sammelquittung „Neu seit der letzten Kenntnisnahme" und der Marken „neu"/„neue Fassung" (seit 2026-10-06 mit dem Vermerk, ob die Kenntnisnahme getippt wurde, R4-K7); je Gerät, reist nicht mit der Sammlung; keine Personendaten | `localStorage` des Geräts (`eeb.kenntnis-stand.v1`), fällt mit „Alle Daten löschen" weg |
| D2k | Haken einer unterbrochenen Musterung (seit 2026-10-06, R4-E7) | Kennung und Fassung (`geaendert`) der Vorlage, die gemustert wird, die angehakten Plätze als Wahrheitswerte nach Stelle (Personal, Fahrzeuge, Sofortbedarf, Bemerkung) und der Zeitpunkt des letzten Hakens — damit die Auswahl ein Neuladen übersteht; gilt höchstens einen Tag und nur für dieselbe Fassung der Vorlage, wird mit dem Ende der Musterung (Start, Abbrechen, Wechsel der Ansicht) gelöscht (`src/app/musterung-stand.ts`); keine Namen, keine Personendaten | `localStorage` des Geräts (`eeb.musterung.v1`), wandert mit der Datensicherung mit, fällt mit „Alle Daten löschen" weg |
| D3 | Absenderkarte | Freiwillige Kontaktangabe (Name/E-Mail/Telefon) der meldenden Person | `localStorage` des Geräts |
| D4 | Privater Geräteschlüssel | Ed25519-Schlüssel zur Signatur weitergereichter Bögen | `localStorage` des Geräts, **unverschlüsselt als Hex**; lässt er sich beim ersten Erzeugen nicht speichern (Speicher voll/gesperrt), nur im Arbeitsspeicher der offenen Seite, bis Platz ist (seit 2026-10-05, R3-E1) |
| D5 | QR-Payload / Exportdatei | Binär kodierter, komprimierter Bogen zur Übergabe an ein zweites Gerät; ebenso eine geteilte Vorlage (QR/Link mit Marker `V.`, oder JSON-Datei `eeb-vorlage-*.json`) | Transient (QR-Code-Anzeige) bzw. Datei auf dem Gerät oder in einer vom Nutzer gewählten Ablage (z. B. Cloud-Ordner) |
| D6 | Ausgedruckte/exportierte Kopien | PDF-Ausdruck im Papier-Layout, CSV-/Excel-Export für Führungsstellen | Außerhalb der App (Papier, Dateisystem des Empfängers) |

> *Prüfvermerk zu D4:* Bestätigt — `src/app/geraete-schluessel.ts` legt den
> privaten Schlüssel als Hex-String im `localStorage` ab (Kopfkommentar: „Der
> private Schlüssel liegt als Hex im localStorage").

### 3.4 Zielobjekte: Kommunikationsverbindungen

| # | Zielobjekt | Ziel | Zweck | Absicherung |
| --- | --- | --- | --- | --- |
| K1 | Geräte-zu-Geräte-Übergabe | Kein Netzwerk — QR-Kamera-Scan, USB-Handscanner, Datei-Export/-Import, Nahfeld-Freigabe (AirDrop/Quick Share) | Übergabe eines Bogens zwischen zwei Geräten | Physisch/lokal begrenzter Kanal; optionale Ed25519-Signatur zur Herkunftsprüfung |
| K2 | GoatCounter-Reichweitenmessung | `https://erfassungsbogen.goatcounter.com` | Anonyme Nutzungsstatistik beim App-Start | Cookielos, keine Cross-Device-ID, laut Code-Dokumentation keine Bogen-Inhalte übertragen |
| K3 | GitHub-Releases-Abfrage | github.com bzw. GitHub-Release-Assets | Prüfung auf neue App-Version (nur Desktop-Variante, `electron-updater`) | HTTPS; Signatur-/Zertifikatsprüfung abhängig vom CI-Build (siehe 6.4) |

Es existieren keine weiteren Netzwerkverbindungen der eigentlichen
Bogen-Funktion — dies ist durch die Content-Security-Policy des Builds technisch
erzwungen (siehe 5.3).

> *Prüfvermerk zum zweiten Web-Host:* Wird die Anwendung über die GitLab-Pages-
> Fassung auf Open CoDE aufgerufen (siehe 3.2/3.6), gelten K1 bis K3
> unverändert — es ist derselbe Build. K2 zählt dabei in denselben
> GoatCounter-Bestand; unterschieden wird nur über den Zählpfad, nicht über den
> Host. Zusätzlich entstehen Abrufmetadaten (u. a. IP-Adresse) beim Betreiber
> der Plattform anstelle von GitHub Pages.

### 3.5 Zielobjekte: IT-Systeme (Endgeräte)

Die Endgeräte selbst (Smartphones, Tablets, Notebooks, Desktop-PCs) sind
Zielobjekte im Sinne der Strukturanalyse, liegen aber außerhalb des
Einflussbereichs der Software und sind durch die einsetzende Organisation zu
erfassen und abzusichern (Geräteverwaltung, Bildschirmsperre,
Festplattenverschlüsselung, Betriebssystem-Updates).

### 3.6 Zielobjekte: Build-, Auslieferungs- und Update-Kette

| # | Zielobjekt | Beschreibung |
| --- | --- | --- |
| B1 | Quellcode-Repository | `wattnpapa/erfassungsbogen` samt vier Submodulen (`@bos/*`), öffentlich auf GitHub |
| B2 | CI/CD-Pipeline | GitHub Actions (`ci.yml`: Tests/Typecheck; `release.yml`: Build und Veröffentlichung der Auslieferungspakete; `spiegel-opencode.yml`: einseitiger Quellcode-Spiegel nach Open CoDE, authentifiziert über einen Deploy-Key im CI-Secret `OPENCODE_SSH_KEY` mit Schreibrecht ausschließlich auf dem Spiegel-Repository). Auf dem Spiegel selbst läuft GitLab CI (`.gitlab-ci.yml`): Prüfstufe als Nachbildung von `ci.yml` (Typprüfung, Tests, Build, Bundle-Budget, SBOM, `npm audit`, E2E) und darauf aufbauend Job `pages` (nur Standardzweig) mit Build und Veröffentlichung der Webfassung; dazu die Stufe `pakete` mit denselben Paketbauten wie `release.yml` (Linux und Android automatisch, Windows und macOS nur mit eigenem Runner und manuell ausgelöst). Die Pakete bleiben Job-Artefakte; ein GitLab-Release oder Tag entsteht nicht, dieser Teil ist nur auskommentiert vorbereitet. Die Submodule werden per HTTPS aus den öffentlichen GitHub-Repositories gezogen |
| B3 | Abhängigkeiten (Software-Lieferkette) | npm-Pakete gemäß `package-lock.json` je Teilprojekt, versioniert und gepinnt |
| B4 | Code-Signing-Material | Zertifikate/Schlüssel für macOS-Notarisierung und Windows-Signierung, als CI-Secrets hinterlegt (bedingt vorhanden, siehe 6.4). Der Android-Keystore liegt als CI-Secret im GitHub-Repository. Die Paketbauten auf dem Open-CoDE-Spiegel bauen ohne hinterlegtes Material **unsigniert**; sollen sie signieren, ist dasselbe Schlüsselmaterial zusätzlich dort als CI-Variable zu hinterlegen — dann verdoppelt sich der Ort, an dem es liegt, und das ist eine eigene Entscheidung (`.gitlab-ci.yml` nennt die Variablen) |
| B5 | Auto-Update-Kanal | `electron-updater` gegen GitHub Releases (nur Desktop) |

## 4. Schutzbedarfsfeststellung

Bewertung je Grundwert (Vertraulichkeit, Integrität, Verfügbarkeit) nach dem
dreistufigen BSI-Schema *normal – hoch – sehr hoch*. Die Einstufung geht vom
typischen BOS-Einsatzkontext aus; eine endgültige, organisationsspezifische
Einstufung obliegt der einsetzenden Organisation.

| Zielobjekt | Vertraulichkeit | Integrität | Verfügbarkeit | Begründung |
| --- | --- | --- | --- | --- |
| D1/D2 Erfassungsbogen-Daten | Normal | Hoch | Hoch | Enthält Personal-/Kontaktdaten (normaler Schutzbedarf, keine Art.-9-Daten); falsche Stärke-/Bedarfszahlen können zu Fehlentscheidungen der Einsatzleitung führen; die App muss auch ohne Netz/Strom über Stunden funktionieren. |
| D3 Absenderkarte | Normal | Normal | Normal | Freiwillige, Opt-in-Kontaktangabe; überschaubarer Personenkreis. |
| D4 Privater Geräteschlüssel | Hoch | Hoch | Normal | Kompromittierung erlaubt Signieren im Namen des Geräts — kein direkter Zugriff auf fremde Personendaten, aber Verlust der Herkunftsgarantie für alle künftigen Meldungen dieses Geräts. |
| D5 QR-Payload/Exportdatei | Normal | Hoch | Normal | Transportformat; Integrität während der Übergabe ist der eigentliche Zweck der Signatur. |
| D6 Ausgedruckte/exportierte Kopien | Normal | Normal | Normal | Sobald exportiert, strukturell außerhalb der Kontrolle der App. |
| A1–A4 Anwendung selbst | — | Hoch | Hoch | Manipulierte App-Instanzen gefährden die Integrität aller damit erzeugten Meldungen; Ausfall im Einsatzfall kann die Einsatzabwicklung behindern. |
| K1 Geräte-zu-Geräte-Übergabe | Normal | Hoch | Normal | Kernfunktion der App; Integrität der übertragenen Daten ist zentral. |
| B1–B5 Build-/Update-Kette | — | Hoch | Normal | Eine kompromittierte Build- oder Update-Kette könnte manipulierte Software an alle Nutzer verteilen (Supply-Chain-Risiko). |

**Vererbungsprinzip:** Der hohe Integritätsschutzbedarf der
Erfassungsbogen-Daten (D1/D2) vererbt sich auf alle Zielobjekte, die diese Daten
verarbeiten oder übertragen (K1, D5) sowie auf die Anwendung selbst (A1–A4) und
deren Auslieferungskette (B1–B5).

## 5. Modellierung: eingesetzte Sicherheitsmaßnahmen laut Quellcode

### 5.1 Anwendungsarchitektur und Rechtevergabe (Electron-Desktop)

Der Electron-Hauptprozess (`electron/main.js`) ist nach aktuellem Stand der
Technik gehärtet:

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — der
  Renderer-Prozess hat keinerlei Zugriff auf Node.js- oder Electron-APIs; es
  existiert kein Preload-Skript, das eine Brücke schlagen könnte.
- **Minimale Rechtevergabe:** Der Permission-Handler erlaubt ausschließlich
  `media` (Kamera für QR-Scan) und Zwischenablage-Zugriff
  (`clipboard-read`, `clipboard-sanitized-write`); alle anderen
  Berechtigungsanfragen werden pauschal abgelehnt.
- **Kontrollierte externe Links:** `setWindowOpenHandler` und `will-navigate`
  fangen jede Navigation zu einer fremden URL ab und öffnen sie im
  System-Standardbrowser statt im App-Fenster.
- `hardenedRuntime: true` für macOS-Builds.

> *Prüfvermerk:* Alle vier Punkte im Code bestätigt (`electron/main.js`,
> `package.json` Feld `build`).

### 5.2 Kryptografische Herkunfts- und Integritätsprüfung

Jeder weitergereichte Bogen kann optional mit dem lokal erzeugten
Ed25519-Schlüsselpaar des Geräts signiert werden
(`vendor/eeb-format/src/signatur.ts`, `src/app/geraete-schluessel.ts`). Das
Modell ist bewusst Trust-on-First-Use (TOFU), kein PKI-Aufbau: Die Signatur
bestätigt, dass ein weitergereichter Bogen unverändert vom Inhaber eines
bestimmten, lokal erzeugten Schlüssels stammt — nicht die reale Identität einer
Person. Mehrstufige Weitergaben werden als Signaturkette (`EEB2C`-Container,
begrenzt auf `MAX_STUFEN = 32`) abgebildet.

*Nachgezogen 2026-09-29 (Audit Runde 2, R2-W6):* Das in eine PDF eingebettete
Bogen-JSON ist unsigniert. Beim Einlesen einer Einzelbogen-PDF in eine
Sammlung („Bögen einlesen…", `boegenAusDatei`/`siegelAusPdfQr` in
`src/app/app.tsx`) wird deshalb zusätzlich der QR-Code der PDF gelesen. Trägt
er eine Signatur und gehört er zur selben Fassung (Einheitsschlüssel und
`stand` gleich), wird der Bogen **aus dem QR** übernommen, samt Signaturstatus
und Original-Payload für das spätere Gegenzeichnen. Der eingebettete Bogen
bekommt das Siegel nie: nur der Inhalt des QR ist signiert, eine nachträglich
geänderte Einbettung würde sonst als geprüft erscheinen. Passt der QR nicht
oder ist er unlesbar, bleibt es beim eingebetteten Bogen ohne Nachweis.

### 5.3 Content-Security-Policy

Der Produktions-Build setzt eine restriktive CSP als `<meta>`-Header
(`vite.config.ts`):

```
default-src 'self' file:; base-uri 'none'; object-src 'none'; form-action 'none';
script-src 'self' file: 'wasm-unsafe-eval' 'sha256-…' 'sha256-…' 'sha256-…';
style-src 'self' file: 'unsafe-inline';
img-src 'self' file: data: blob: https://erfassungsbogen.goatcounter.com;
font-src 'self' file: data:; frame-src 'self' file: blob:;
connect-src 'self' file: https://erfassungsbogen.goatcounter.com
```

Positiv hervorzuheben: `object-src 'none'`, `base-uri 'none'` und
`form-action 'none'` unterbinden ganze Klassen von Angriffen;
`connect-src`/`img-src` sind auf genau einen fremden Host begrenzt — jede
Datenausleitung an eine andere Herkunft ist technisch unterbunden.

> *Prüfvermerk (Stand `c7604e9`):* `script-src` kommt **ohne** `'unsafe-inline'`
> aus — die drei Inline-`<script>`-Blöcke der `index.html` werden beim Bauen
> gehasht und einzeln per `sha256-…` freigegeben; ein nachträglich eingehängtes
> Skript wird damit blockiert. `style-src` behält `'unsafe-inline'` bewusst, weil
> React `style`-Attribute an Elementen setzt. Die ursprüngliche
> Entwurfsfassung dieses Dokuments beschrieb noch die alte Policy mit
> `'unsafe-inline'` auch bei `script-src`.
>
> *Prüfvermerk (Stand 2026-09-27):* `script-src` trägt zusätzlich
> `'wasm-unsafe-eval'`. Die Freigabe erlaubt ausschließlich das Kompilieren von
> WebAssembly-Modulen (kein `eval`, kein Inline-Skript) und ist nötig für den
> QR-Decoder ZXing (`assets/zxing_reader-*.wasm`, aus dem eigenen Bundle):
> ohne sie verweigerte der Browser das Modul, und die App fiel still auf den
> reineren JavaScript-Decoder jsQR zurück. Die Angriffsfläche wächst dadurch
> nicht — geladen werden kann weiterhin nur, was `'self'` liefert.

### 5.4 Schutz bei Datenexport

- **CSV-Export** (`src/app/csv.ts`): Werte, die mit `=` `+` `-` `@` oder
  Tab/CR beginnen, werden mit einem führenden `'` versehen — eine dokumentierte,
  korrekt umgesetzte Abwehr gegen CSV-Formel-Injection.
- **XLSX-Export** (`src/app/xlsx.ts`): korrektes XML-Escaping der Zellinhalte.

> *Prüfvermerk:* Beides im Code bestätigt (`FORMEL_START = /^[=+\-@\t\r]/`;
> `&`/`<`-Escaping im XLSX-Writer).

- **Lageblatt und Übergabeblatt der Einsatz-Sammlung** (`src/app/pdf.ts`,
  `pdf-dokument.ts`, seit 2026-09-27): Das Übergabeblatt (Seite 1 der
  Sammel-PDF „Einsatz weitergeben / sichern") und das einseitige „Lageblatt"
  führen je Einheit Eintreff- und Abrückzeit sowie den Auftrag/die Notiz der
  Führungsstelle (Freitext) — abgerückte Einheiten stehen als eigener Block,
  damit Papier und eingebettete Sammlung denselben Stand zeigen. Dieselben
  drei Spalten stehen in der Übersichts-CSV (`einsatz-csv.ts`), dort mit der
  bestehenden Formel-Abwehr. Die Sammel-PDF entsteht auch ohne anwesende
  Einheiten (Einsatzende). Wohin Ausdruck und Datei gelangen, entscheidet
  weiterhin der Nutzer (DSFA 5.8).
  Seit 2026-09-29 (R2-A1) trägt in der Sammel-PDF zusätzlich jede Bogenseite
  den Kasten „Stand am Meldekopf" (Eintreff-/Abrückzeit, Zug, Auftrag/Notiz) —
  über dem Formular und auf jeder QR-Seite, mit dem Hinweis, dass der QR-Code
  nur den Bogen der Einheit enthält. Die Notiz der Führungsstelle steht damit
  im Ausdruck nicht mehr nur auf Seite 1, sondern bei der Einheit; in den
  QR-Code gelangt sie weiterhin nicht. Wer den Ausdruck nur über die QR-Codes
  wieder einliest, bekommt die Angaben nicht zurück — die App sagt das in der
  Rückmeldung und verweist bei einer Sammel-PDF-Datei auf „Einsatz
  importieren…" (`qr-stapel.ts`, `einsatz-transport.ts: pdfInhaltArt`).
  Seit 2026-09-29 (R2-K3) führen Übergabeblatt und Lageblatt je Einheit
  zusätzlich Zug, Bedarf (Ruhezeit, Unterbringung, Kraftstoff) und die Zahl
  der Lücken der Meldung; Änderungen stehen als „von … auf …" (die
  PDF-Standardschrift kennt den Pfeil nicht). Das Lageblatt heißt jetzt
  „Lageblatt (A4 quer)" und passt bis etwa zwölf Einheiten auf eine Seite
  (seit 2026-10-04 mit der Bemerkung der Einheit bis etwa zehn; Stärke und
  Bedarf stehen dafür als Kopfleiste oben auf Seite 1, R3-K6).
  Seit 2026-09-29 (R2-A3) trägt das Lageblatt zusätzlich je Einheit
  Funkrufname und Rückrufnummer der Führungskraft (Personenbezug auf dem
  Aushang — Aushangort entsprechend wählen) und freie Zeilen für Nachträge.
  Seit 2026-10-04 (R3-K3) steht in der Spalte „Auftrag / Notiz" darunter
  kursiv die Bemerkung der Einheit („Sonstiges", Freitext — kann Personenbezug
  enthalten; auf dem Lageblatt auf 110 Zeichen gekürzt), und die
  Übersichts-CSV führt sie als letzte Spalte „Bemerkung (Einheit)".
  Die ganze Sammel-PDF gibt es nur noch über „Einsatz weitergeben / sichern";
  der Teilexport „nur neue Bögen" heißt `eeb-einsatz-nachtrag-….pdf`.
  Seit 2026-09-29 (R2-A4) steht neben jedem QR-Code eines Bogen-PDF das
  Kästchen „[  ] von Hand geändert" mit dem Stand (DTG), den der Code trägt:
  Eine Stiftkorrektur auf dem Ausdruck steckt nicht im Code, und wer scannt,
  soll das vorher sehen. Die Rückmeldung von „Bögen einlesen…" wiederholt den
  Hinweis (`STIFT_HINWEIS`, `qr-stapel.ts`). Integrität: Papier und Gerät
  können weiterhin auseinanderlaufen; der Hinweis macht es nur sichtbar.
  *Nachgezogen 2026-10-05 (Audit Runde 3, R3-A3, R3-A5, R3-A6):* Auf den
  Seiten eines mehrteiligen Codes stehen Anleitung, Stift-Kästchen und Kasten
  „Stand am Meldekopf" neben den Codes statt darunter (keine fast leeren
  Folgeseiten mehr). Das Lageblatt füllt die letzte Seite mit
  Nachtragszeilen (gemessen in einem Probesatz, `einsatzLageblattSeiteFuellen`)
  und trägt unter „Summe laut Gerät" eine leere Zeile „Summe einschl.
  Nachträge (von Hand)"; ein leeres Lageblatt druckt Ausfülllinien statt
  Nullen. Das Einzel-PDF führt je Person die Zählrolle (F/UF/M), die Stärke
  mit Legende und — nur wo es keine Seite kostet (`einzelPdfDokument`) — zwei
  freie Personalzeilen und einen leeren Fahrzeugblock. Kein neuer Inhalt aus
  der Sammlung, keine neue Datenkategorie: die Zählrolle ist Teil des Bogens
  und steht schon im QR-Code und in der CSV.
  *Nachgezogen 2026-10-05 (R3-A7):* Den Blanko-Vordruck erzeugt die App jetzt
  auch selbst (Einsatzansicht, Übergabe-Dialog unter „Weitere Formate",
  Fußzeile; `blankoPdfErzeugen` aus `src/app/blanko.ts`, derselben Quelle wie
  die ausgelieferte Datei). Er enthält keine Daten des Geräts.
  *Nachgezogen 2026-10-06 (Audit Runde 4, R4-A3 bis R4-A8):* Das Lageblatt
  setzt die Nachtragszeilen in eine eigene Tabelle mit den Spalten der
  Einheitenzeilen und einer schmalen Spalte „übertragen" (Kästchen und Kürzel
  zum Ausfüllen mit dem Stift — kein App-Feld, nichts davon wird eingelesen).
  `einsatzLageblattSeiteFuellen` misst in höchstens zwei Probesätzen ohne Bilder
  und trägt immer mindestens fünf Zeilen: passen sie auf die letzte Seite,
  füllen sie diese; sonst stehen sie auf einer eigenen letzten Seite mit
  Spaltenköpfen („Nachträge von Hand: Seite 2"). Vorher blieben bei sechs bis
  zehn Einheiten zwei Zeilen, der Bedarf stand bei 30 Einheiten allein auf
  einer vierten Seite. Zeilen werden nicht mehr über den Seitenrand geteilt.
  In der Sammel-PDF kostete der Kasten „Stand am Meldekopf" 36 von 443
  Beispielbögen die letzte Zeile des Sofortbedarfs auf einer eigenen Seite;
  `einsatzPdfDokumentGesetzt` misst das in einem Probesatz ohne Bilder und ohne
  eingebettete Dateien und setzt nur diese Bögen enger (kleinerer
  Innenabstand), der Sofortbedarf-Kasten bleibt ganz. Jede Codeseite trägt eine
  Kopfzeile mit Einheit, Funkrufname und Stand (Angaben, die schon auf Bogen
  und Lageblatt stehen); das Kästchen „von Hand geändert" steht nicht mehr auf
  der Codeseite, sondern auf dem Bogen neben der Stärke. Der Blanko-Vordruck
  trägt den Kasten „Meldekopf" (Nr., eingegangen am/um, Zug, „Übung",
  „ins Gerät übertragen von (Kürzel)"), bleibt bei zwei Seiten und enthält
  weiter keine Daten des Geräts. Der Bericht von „Bögen einlesen…" nennt
  Bilder ohne Code in einer Zeile mit den ersten drei Dateinamen (Namen der
  vom Nutzer gewählten Dateien, nur auf dem Bildschirm) und trägt „Lage vom
  Papier abgleichen…" als Knopf. Das Lageblatt hat damit bei etwa sechs bis
  zehn Einheiten zwei Seiten (Seite 2 sind die Nachtragszeilen).
- **Excel-Liste „Oldenburg"** (`src/app/oldenburg-xlsx.ts`, seit 2026-09-29,
  Audit Runde 2, R2-K2): führt dieselben Führungsstellen-Angaben — Eintreffzeit
  in „eingetr. / zugew.", Abrückzeit in „Einsatz-ende", Auftrag/Notiz
  (Freitext) in „Aufträge". Der Freitext steht als `inlineStr` in der Zelle
  und wird von Excel nie als Formel ausgewertet; `&`/`<` escapt der
  XLSX-Writer. Die SUBTOTAL-Summen laufen nur über die in die Lage zählenden
  Einheiten (dieselbe Regel wie App und CSV); abgerückte, aufgegangene und
  Übungsmeldungen stehen gekennzeichnet in einem Block darunter — eine zu
  hohe Stärke in der Liste der nächsten Ebene wäre ein Integritätsfehler.

- **Teilexport „Nur neue Bögen seit dem letzten Export"**
  (`src/app/export-stand.ts`, seit 2026-09-27): Sammel-PDF, beide CSV-Wege und
  die Excel-Liste lassen sich auf die Meldungen beschränken, die beim letzten
  Export dieses Einsatzes noch nicht in der Sammlung standen. Die Sammel-PDF
  bettet dann auch nur diese Meldungen als JSON ein; die Vorfassung einer
  Folgemeldung dient nur dem Diff auf der Seite. Als „übergeben" gilt der
  Stand erst nach gelungenem Export — ein abgebrochenes Share-Sheet der App
  verbucht nichts (`nativ.ts`: `teilen()` meldet den Abbruch). Vorgabe bleibt
  der Gesamtexport; die Wahl wird nicht gespeichert.
  *Nachgezogen 2026-10-06 (Audit Runde 4, R4-W2, R4-K1, R4-W4):* Der Bezugspunkt
  ist je Format getrennt (`eeb.export-stand.v2`): Excel für die eigene Liste
  verbraucht den Nachtrag-PDF nicht, „Einsatz weitergeben / sichern" an die
  Ablösung keines von beiden. Der Nachtrag enthält neben den neuen Meldungen die
  geltende Fassung jeder Einheit mit Änderung seit dem Stand (Abrücken, Zug,
  Auftrag, Eintreffzeit). Ein Nachtrag steht als solcher im Kopf („NACHTRAG
  seit …, nicht die ganze Lage"), in Summen, Fußzeile und Dateinamen
  (`nachtrag-seit-…`); der Umschlag der Nachtrag-PDF trägt den Zusatz
  `nachtragSeit`, der Import auf einem Gerät ohne die Sammlung fragt nach. Die
  Übersichts-CSV führt „Unterbringung angefordert M/W/D" nur für Einheiten mit
  Anforderung, „WC/Dusche M/W/D" für alle Anwesenden, Fahrzeuge als Anzahl und
  Liste und eine Spalte „Rückfrage" (offene Punkte der Meldung, Freitext aus
  Bogenangaben — kann Personenbezug enthalten); die Excel-Bemerkung trägt
  dieselben Rückfragen und lässt ein vor dem Eintreffen abgelaufenes
  „Verfügbar bis" leer. Lageblatt und Sammel-PDF drucken die Rückfragen ganz
  (Lageblatt als Stichworte), der Kasten „Stand am Meldekopf" die laufende Nummer.
- **Vorlage teilen** (`src/app/vorlagen-ui.tsx`, `vorlagen.ts`,
  `vorlageTransportErzeugen` in `hilfen.ts`, seit 2026-09-23): QR-Code und Link
  tragen die Vorlage mit dem Geräteschlüssel signiert, wie beim Bogen. Die
  JSON-Datei (`format: "eeb-vorlage"`) enthält nur Name und Bogen dieser einen
  Vorlage, **keinen** Geräteschlüssel und keine übrigen App-Daten; sie ist
  unsigniert. Beim Einlesen wird das Format und das Bogenschema geprüft
  (`vorlageAusDatei`, `bogenPruefen`); eine Datei aus einer neueren App-Version
  wird abgewiesen. Der Dialog weist vor den Knöpfen darauf hin, dass die
  Vorlage Namen und Erreichbarkeiten enthält. Wohin die Datei gelangt (etwa in
  eine Cloud), entscheidet der Nutzer; die einsetzende Organisation sollte das
  regeln (siehe DSFA 5.8).

### 5.5 Datensparsamkeit und Löschung

- **Datenschutzfrist** (`vendor/eeb-format/src/datenschutzfrist.ts`): 90 Tage
  nach der letzten Änderung eines Bogens entfernt die App Namen, Funktionen,
  Qualifikationen, Fahrerlaubnisse und Erreichbarkeiten dauerhaft. Das gilt
  für eingelesene Bögen (Scan, Link, Datei, Einsatz-Import), für jede Meldung
  der Einsatz-Sammlung und für den Entwurf. Bei den Meldungen fallen auch der
  Rohpayload und der Signaturnachweis weg. Übungsbögen und Vorlagen sind
  ausgenommen. Eine Uhr, die mehr als 60 Tage nach vorn springt, wird erst
  übernommen, wenn sie sich einen Tag später bestätigt (`geraeteuhrPruefen`,
  `src/app/datenschutz-uhr.ts`; bis 2026-10-05 galt das Format-Maß von 366
  Tagen, `uhrPruefen`, R4-D1). Das schützt vor Datenverlust durch eine
  falsch gehende Uhr. Dieselbe geprüfte Uhr gilt für Aufräum- und
  Papierkorbfrist (siehe dort); solange sie zurückgehalten wird, zeigen
  Startseite und Einsatzansicht „Geräteuhr prüfen" und die App löscht und
  anonymisiert nichts. Bleibende Grenze: Ein Sprung unter 60 Tagen zählt als
  echte Zeit und kann Papierkorb-Einträge (30 Tage) und ruhende Sammlungen bis
  zu 60 Tage früher entfernen. Gegen Absicht schützt die Frist nicht: Der QR-Code bleibt
  unverschlüsselt, und eine zurückgestellte Uhr wird nicht abgefangen.
- **Aufräumfrist ruhender Einsatz-Sammlungen** (`@bos/meldekopf/einsaetze`):
  90 Tage ohne Änderung, dann endgültig gelöscht; Ankündigung ab Tag 60.
  *Nachgezogen 2026-10-06 (Audit Runde 4, R4-D1):* Der Kern rechnet mit
  `Date.now()` (Submodul, nicht änderbar) und löschte bei vorgestellter
  Geräteuhr beim Start die laufende Sammlung endgültig. Eine Hülle um die
  Ablage (`src/app/uhr-korrektur.ts`, in `speicher-browser.ts` zwischen
  Beobachter und schonender Hülle eingehängt) verschiebt bei zurückgehaltener
  Uhr die Zeitstempel `geaendert` und `geloeschtAm` der Sammlungen beim Lesen
  um den Vorsprung und beim Schreiben zurück; der Kern sieht das Alter der
  geprüften Uhr, im Speicher stehen ehrliche Zeitstempel. Nachprüfung mit
  `page.clock`: Sammlung und Papierkorb bleiben bei +365 und +400 Tagen
  vollständig, nach zurückgestellter Uhr ist alles unverändert da.
- **Papierkorb-Funktion** (`src/app/sicherung.ts`, `src/app/vorlagen.ts`,
  `@bos/meldekopf/papierkorb`): gelöschte Einträge lassen sich vor endgültiger
  Löschung wiederherstellen. Seit 2026-10-06 (R4-D5) nennt der Papierkorb von
  Einsätzen und Vorlagen das Datum der endgültigen Entfernung und die
  Restzeit, ab drei Tagen hervorgehoben (`src/app/papierkorb-frist.ts`);
  die Frist der Vorlagen rechnet mit der geprüften Uhr (R4-D1).
  „Endgültig löschen…" im Papierkorb und „Alle lokalen Daten löschen" nennen
  Sammlungen mit Meldungen, von denen es keinen Export, kein Lageblatt und
  keine Weitergabe gibt (`exportVorhanden`, `datenUmfang().ohneExport`) — dort
  ist die Sammlung die einzige Kopie.
- **Meldung aus einer Einsatz-Sammlung entfernen** (`einheitEntfernen`,
  `src/app/eintrag-zeiten.ts`, seit 2026-09-29): nimmt die Einheit mit
  **allen** Fassungen (Folgemeldungen) samt Zusatzfeldern aus dem Speicher;
  abgeteilte Truppteile mit eigenem Fingerabdruck bleiben. „Rückgängig" (in
  der Quittungsleiste am unteren Bildrand) hält die Einträge nur im
  Arbeitsspeicher der geöffneten Seite, bis die Quittung geschlossen, von
  einer neueren ersetzt oder die Seite neu geladen wird; das Verlassen der
  Einsatzansicht beendet ihn seit 2026-10-05 nicht mehr (R3-D4) — es gibt
  keinen Papierkorb für einzelne Meldungen. *Nachgezogen 2026-10-06 (R4-D3):*
  Der Rückweg bleibt bewusst im Arbeitsspeicher — ein dauerhafter Papierkorb
  hielte fremde Personendaten an einem weiteren Speicherort. Stattdessen sagt
  die Rückfrage vor dem Entfernen, dass „Rückgängig" nur bis zum Neuladen oder
  Beenden der App hält (das Betriebssystem beendet die App im Hintergrund),
  und nennt, ob die Meldung in einem Export, Lageblatt oder einer Weitergabe
  dieser Sammlung steht (`letzterStandMit`, `src/app/export-stand.ts`).
  „Stärke ändern…", „Zusammenführen" und eine Folgemeldung haben ein
  „Rückgängig", das die neue Fassung wieder herausnimmt (R4-E4, R4-D5). „Fassung
  verwerfen…" in der Historie nimmt gezielt eine einzelne Fassung heraus.
  Die Kennungen der entfernten Einträge bleiben in `eeb.entfernt.v1` (D2e);
  „Einsatz importieren…" fragt, bevor es eine davon wieder aufnimmt, und lässt
  sie ohne Zustimmung draußen (seit 2026-09-29, R2-D4).
- **Sicherung einspielen** (`src/app/sicherung.ts`, `src/app/fusszeile.tsx`):
  ersetzt alle `eeb.*`-Einträge des Geräts ohne Papierkorb — dieselbe Folge
  wie „Alle Daten löschen". Seit 2026-09-29 (R2-D3) wird die Datei vorher
  geprüft (eine kaputte Datei ändert nichts), die Rückfrage nennt die
  laufenden Sammlungen des Geräts und den Inhalt der Datei, bietet „Vorher
  Sicherung erstellen…" an und verlangt einen Haken, sobald laufende
  Sammlungen mit Meldungen betroffen sind.
  *Nachgezogen 2026-10-05 (Audit Runde 4, R4-D2):* Die Aufzählung nennt
  dieselben Posten wie „Alle Daten löschen" — Vorlagen getrennt nach aktiv
  und Papierkorb, den Bogen auf dem Rückholplatz, die Absenderkarte und den
  Signatur-Geräteschlüssel mit Kurzform vorher (Gerät) und nachher (Datei).
  Der Haken ist Pflicht, sobald auf dem Gerät überhaupt etwas verloren geht
  (Sammlung, Vorlage, Entwurf, Rückholplatz, Absenderkarte oder
  Geräteschlüssel). Gelöscht wird weiter alles unter `eeb.`.
- **Verfügbarkeit des Gerätespeichers** (`src/app/speicher-browser.ts`,
  `src/app/sicherung.ts`, seit 2026-09-29, R2-O6): Browser dürfen
  Website-Daten bei Platzmangel oder (Safari) nach längerer Nichtnutzung
  räumen. Die Web-App bittet deshalb beim Start um dauerhaften Speicher
  (`navigator.storage.persist`), sobald Sammlungen mit Meldungen oder Vorlagen
  vorliegen, und zeigt in der Datensicherung, ob der Browser zugestimmt hat
  (mit Knopf zum erneuten Anfragen und dem Rat, die App auf iOS auf den
  Home-Bildschirm zu legen). Die native App fragt nicht — dort gehört der
  Speicher der App. Dazu zeigt die Datensicherung die letzte Sicherung, und
  die Fußzeile erinnert, wenn wertvolle Daten seit drei Tagen ungesichert sind.
  Eine Sicherungspflicht erzwingt die App nicht; organisatorisch regeln.
  Seit 2026-10-05 (R3-O2) hängt das Anzeigen nicht mehr an einem
  Schreibzugriff: Lesen schreibt nur, wenn eine Frist wirklich etwas
  bereinigt hat (`src/app/speicher-schonend.ts`); scheitert das, zeigt die App
  die Daten und meldet den vollen bzw. gesperrten Speicher.
- **Gemerkte Teile beim Foto-Einlesen** (`TeileMerker`, `src/app/qr-stapel.ts`,
  seit 2026-09-29, R2-A2): Teile eines unvollständigen mehrteiligen Bogens
  warten je Einsatz höchstens eine Stunde nach dem letzten neuen Teil im
  Arbeitsspeicher auf den Rest; Neuladen oder „Gemerkte Teile verwerfen"
  löscht sie sofort. Kein `localStorage`.
- **Schema-Migration** (`src/app/hilfen.ts`): verhindert, dass ältere Datensätze
  mit veralteten Feldbedeutungen fehlinterpretiert werden.
- **Absenderkarte vollständig optional** (Opt-in), ohne Eingabe als „keine
  Karte" kodiert.

### 5.6 Update-Mechanismus

`electron-updater` prüft bei jedem Start der Desktop-Variante gegen die neuesten
GitHub Releases, lädt Updates im Hintergrund und bietet einen Neustart an;
Fehler (kein Netz, kein Release, unsignierter Build) werden bewusst still
ignoriert, um den für Offline-Betrieb ausgelegten Programmstart nicht zu
blockieren.

## 6. IT-Grundschutz-Check (Ist-Soll-Vergleich)

Auswahl der einschlägigen Bausteine, soweit aus dem Quellcode heraus bewertbar.
Kein vollständiges Audit — Bausteine mit organisatorischem Schwerpunkt (z. B.
ORP.1 Organisation, INF.1 Gebäude) sind nicht Gegenstand dieses Dokuments.

### 6.1 APP.1.4 Mobile Anwendungen (Client) / APP.1.1 Client-Anwendungen allgemein

| Anforderung (sinngemäß) | Status | Fundstelle/Anmerkung |
| --- | --- | --- |
| Minimale Rechtevergabe der Anwendung | Erfüllt | `electron/main.js`: nur `media`, `clipboard-*` erlaubt |
| Sichere Speicherung sensibler Daten auf dem Endgerät | Teilweise erfüllt | Fachdaten in `localStorage`; privater Signaturschlüssel dort unverschlüsselt (siehe 6.3) |
| Deaktivierung nicht benötigter Schnittstellen | Erfüllt | CSP unterbindet jede Netzverbindung außer den zwei dokumentierten Zielen |
| Sichere Update-Mechanismen | Teilweise erfüllt | Vorhanden (`electron-updater`), Signierung/Notarisierung aber bedingt auf CI-Secrets (siehe 6.4) |
| Zusage „offline bereit" entspricht dem Gerätezustand | Erfüllt (seit 2026-10-06, R4-O1) | Bricht das Erstladen ab und verwirft der Browser die Service-Worker-Registrierung, registriert die Seite beim `online`-Ereignis und bei 20 s stehendem Zähler neu (`installationAnstossen`, `src/app/offline-bereit.ts`); fehlt die Registrierung, steht „Laden abgebrochen … mit Netz einmal neu laden" mit Knopf statt „wird geladen". Geprüft mit einem drosselnden Reverse-Proxy, der die Verbindung abweist |

### 6.2 SYS.2.1 Allgemeiner Client / CON.10 Entwicklung von Webanwendungen

| Anforderung (sinngemäß) | Status | Fundstelle/Anmerkung |
| --- | --- | --- |
| Content-Security-Policy zur Reduktion der Angriffsfläche | Erfüllt (Skript) / bewusster Rest (Style) | `script-src` ohne `'unsafe-inline'`, Inline-Blöcke per `sha256`-Hash freigegeben; `style-src` behält `'unsafe-inline'` wegen der `style`-Attribute von React (siehe 5.3) |
| Eingabevalidierung / Schutz vor Injection | Erfüllt (für die geprüften Exportpfade) | CSV-Formel-Injection-Schutz, korrektes XLSX-Escaping |
| Robustheit gegenüber fehlerhaften/böswilligen Eingabedaten | Erfüllt | Dekomprimierung importierter QR-/Dateidaten läuft über `inflateRawBegrenzt` (`src/app/hilfen.ts`) mit Obergrenze `MAX_ENTPACKT = 4 MiB`, streamend geprüft — bricht ab, bevor der Speicher volläuft |
| Kontextisolation bei hybriden Apps (Electron/Capacitor) | Erfüllt | `contextIsolation`, `sandbox`, kein Preload |

> *Prüfvermerk (Stand `c7604e9`):* Der `browserKompressor` in
> `src/app/hilfen.ts` reicht `inflateRawBegrenzt` in den Codec hinein; die
> Streaming-Fassung prüft die entpackte Größe stückweise (pako meldet in
> 16-KiB-Blöcken) und wirft bei Überschreitung einen `RangeError`. Die
> ursprüngliche Bewertung „Offen" ist damit überholt. Der Codec selbst
> (`vendor/eeb-format/src/codec.ts`) bleibt unverändert — die Grenze sitzt beim
> hineingereichten Kompressor, nicht im Kern.

### 6.3 CON.8 Software-Entwicklung / Kryptokonzept

| Anforderung (sinngemäß) | Status | Fundstelle/Anmerkung |
| --- | --- | --- |
| Dokumentiertes Schlüsselkonzept | Erfüllt | Trust-Modell in `docs/datenmodell.md` explizit beschrieben |
| Schutz privater Schlüssel gegen unbefugten Zugriff | Nicht erfüllt | Privater Ed25519-Schlüssel liegt als Klartext-Hex im `localStorage` — jede Anwendung/jeder Prozess mit Zugriff auf den Browser-/App-Speicher des Geräts kann ihn auslesen |
| Sichere kryptografische Verfahren | Erfüllt | Ed25519 ist ein etabliertes, als sicher geltendes Verfahren |
| Schlüsselwechsel bei Kompromittierungsverdacht möglich | Erfüllt | „Geräteschlüssel neu erzeugen" in der Fußzeile (`fusszeile.tsx` → `geraeteSchluesselLoeschen()`/`geraeteSchluesselSicherstellen()` in `src/app/geraete-schluessel.ts`): Rückfrage, dann neues Schlüsselpaar samt Anzeige der neuen Kurzform. Kein Widerruf des alten Schlüssels — Empfänger müssen die Kurzform neu abgleichen (TOFU-Modell, keine PKI) |

### 6.4 OPS.1.1.6 Software-Tests und Freigaben / Software-Lieferkette

| Anforderung (sinngemäß) | Status | Fundstelle/Anmerkung |
| --- | --- | --- |
| Automatisierte Tests vor Veröffentlichung | Erfüllt | GitHub-Actions-Workflow `ci.yml` (Unit-Tests via Vitest, E2E via Cucumber, Typecheck) |
| Signierte/verifizierbare Auslieferungspakete | Teilweise erfüllt | macOS-Notarisierung und Code-Signing sind in `release.yml` vorgesehen, greifen aber nur, wenn die entsprechenden CI-Secrets hinterlegt sind; ohne diese entsteht laut Workflow-Kommentar bewusst ein unsignierter Build. **Ergänzung:** der macOS-Job ist derzeit ganz stillgelegt (`if: false`) |
| Versionierte, nachvollziehbare Abhängigkeiten | Erfüllt | `package-lock.json` je Teilprojekt/Submodul, Versionen gepinnt |
| Regelmäßige Prüfung auf bekannte Schwachstellen in Abhängigkeiten (SCA) | Erfüllt | `.github/dependabot.yml` (wöchentlich, npm + GitHub-Actions), `npm audit --omit=dev --audit-level=high` als blockierender CI-Schritt, `npm audit` über das Bau-/Testwerkzeug als Hinweis |
| Stückliste der ausgelieferten Software (SBOM) | Erfüllt | `npm run sbom` (`scripts/sbom.ts`) erzeugt CycloneDX 1.6 aus den fünf `package-lock.json`; im CI als Artefakt, im Release als Asset |
| Dokumentierter Meldeweg für Schwachstellen | Erfüllt | `SECURITY.md` im Hauptrepository: Geltungsbereich (Hauptrepo + die vier `vendor/`-Submodule), Private Vulnerability Reporting auf GitHub bzw. E-Mail, angestrebte Fristen (7 Tage Eingangsbestätigung, 30 Tage Einschätzung, Veröffentlichung nach Fix bzw. spätestens nach 90 Tagen) |

> *Prüfvermerk zu SCA (Stand `c7604e9`):* Die ursprüngliche Bewertung „Offen"
> ist überholt. Dependabot läuft wöchentlich montags über npm und
> GitHub-Actions, `@bos/*` ist ausgenommen (Submodule über `file:`); `npm audit`
> blockiert ab „hoch" über die Laufzeit-Abhängigkeiten und protokolliert das
> Bau-/Testwerkzeug ohne Blockade.

## 7. Ergänzende Risikoanalyse (BSI-Standard 200-3, Auswahl)

| # | Gefährdung | Betroffenes Zielobjekt | Eintrittswahrscheinlichkeit | Schadenshöhe | Gesamt |
| --- | --- | --- | --- | --- | --- |
| R1 | Verlust/Diebstahl eines Geräts mit ungesperrtem Zugriff | D1–D4 (alle lokalen Daten) | Mittel (Einsatzgeräte werden im Feld mitgeführt) | Hoch (Zugriff auf alle lokal gespeicherten Bögen, Absenderkarte, Signaturschlüssel) | **Hoch** |
| R2 | ~~Dekomprimierungs-Angriff über präparierte Importdatei (`inflateRaw` ohne Größenlimit)~~ **behoben mit `c7604e9`** (Deckel 4 MiB) | A1–A4 (Anwendungsverfügbarkeit) | Niedrig-Mittel | Mittel (Speicherüberlastung/Absturz; kein Datenabfluss) | ~~Mittel~~ → Sehr niedrig |
| R3 | Diebstahl/Auslesen des unverschlüsselten privaten Signaturschlüssels | D4, K1 (Vertrauenskette) | Niedrig (setzt Gerätezugriff oder weitere Schwachstelle voraus) | Mittel (Signieren im Namen des Geräts möglich) — durch den Austausch des Schlüssels (M3) auf die Zeit bis zum Bemerken und den Abgleich der neuen Kurzform begrenzbar | Niedrig-Mittel |
| R4 | Cross-Site-Scripting trotz CSP — ~~über `'unsafe-inline'` bei `script-src`~~ **mit `c7604e9` auf Hash-Freigabe umgestellt**; Restrisiko nur noch über `style-src 'unsafe-inline'` | A1 (Web-App) | Niedrig (CSP schränkt Auswirkungen stark ein) | Mittel (potenziell Zugriff auf `localStorage`-Inhalte des Tabs) | ~~Niedrig-Mittel~~ → Niedrig |
| R5 | Kompromittierte oder manipulierte Build-/Update-Kette | B1–B5, A2 (Desktop) | Niedrig | Hoch (Verteilung manipulierter Software an alle Nutzer der Plattform) | Mittel-Hoch |
| R6 | Fehlende Signaturprüfung durch den Empfänger (Signatur ist optional) | K1, D1/D2 (Integrität) | Mittel (Prüfung könnte im Alltag vernachlässigt werden) | Mittel (unbemerkt verfälschte Meldung erreicht die Führung) | Mittel |
| R7 | Ausfall der Anwendung im Einsatzfall (Gerätedefekt, Akku, Absturz) | A1–A4 (Verfügbarkeit) | Mittel (typisches Einsatzrisiko) | Hoch | **Hoch** (durch Papierform als Rückfallebene begrenzt) |
| R8 | ~~Fehlende automatisierte Schwachstellenprüfung der Abhängigkeiten (SCA)~~ **behoben mit `c7604e9`** (Dependabot, `npm audit` im CI, SBOM) | B3 (Software-Lieferkette) | Mittel | Mittel | ~~Mittel~~ → Niedrig |

**Höchste Einzelrisiken:** R1 (Geräteverlust) und R7 (Ausfall im Einsatzfall)
sind primär organisatorisch/physisch bedingt; R5 (Lieferkette) liegt in der
Verantwortung des Projektbetreibers, nicht der einzelnen einsetzenden
Organisation.

## 8. Maßnahmenplan

| # | Bezug | Maßnahme | Art | Verantwortlich | Priorität |
| --- | --- | --- | --- | --- | --- |
| M1 | R1 | Verbindliche Geräte-Bildschirmsperre (PIN/Biometrie) als Dienstanweisung; wo verfügbar, Festplatten-/Profilverschlüsselung (BitLocker/FileVault/Android-Geräteverschlüsselung) aktivieren | Organisatorisch/technisch (Geräte-Ebene) | `[Organisation/IT-Verantwortliche/r]` | Hoch |
| M2 | R2 | **Erledigt (`c7604e9`):** Ausgabegrößenbegrenzung bei der Dekomprimierung ist umgesetzt (`MAX_ENTPACKT = 4 MiB`). Für die Organisation bleibt nur: eine App-Version ab diesem Stand einsetzen | Technisch (umgesetzt) | `[Projektbetreiber/Maintainer]` | erledigt |
| M3 | R3 | Bis zu einer verschlüsselten Ablage des privaten Schlüssels: Geräteabsicherung (M1) als kompensierende Maßnahme; Prozess für Neuerzeugung des Geräteschlüssels bei Kompromittierungsverdacht etablieren. **Technisch bereitgestellt:** der Knopf „Geräteschlüssel neu erzeugen" in der Fußzeile der App verwirft den bisherigen Schlüssel und erzeugt sofort ein neues Paar; die neue Kurzform steht in der Bestätigung. Für die Organisation bleibt: festlegen, wer den Verdacht meldet, wer den Knopf drückt und wie die neue Kurzform den Empfängern (Meldekopf, Führungsstelle) bekannt gemacht wird | Organisatorisch (technische Grundlage vorhanden) | `[Organisation]` | Mittel |
| M4 | R4 | **Weitgehend erledigt (`c7604e9`):** `script-src` ist auf Hash-Freigabe umgestellt. Offen bleibt `style-src 'unsafe-inline'` (bewusster Trade-off wegen React-`style`-Attributen) | Technisch (Software-Weiterentwicklung) | `[Projektbetreiber/Maintainer]` | Niedrig |
| M5 | R5 | Vor Rollout prüfen, dass ausschließlich signierte/notarisierte Pakete eingesetzt werden, sofern verfügbar; bei unsignierten Builds Bezugsquelle (offizielles GitHub-Release) verbindlich vorgeben und Prüfsummen dokumentieren | Organisatorisch | `[Organisation/IT-Verantwortliche/r]` | Hoch |
| M6 | R6 | Dienstanweisung: Empfangene Bögen mit Signatur sind vor Übernahme in die Sammelübersicht auf gültige Signatur zu prüfen, insbesondere bei mehrstufiger Weitergabe | Organisatorisch | `[Organisation/Meldekopf-Verantwortliche/r]` | Mittel |
| M7 | R7 | Papierform als dokumentierte Rückfallebene vorhalten (Blanko-Formulare); Ladezustand der Einsatzgeräte vor Einsatzbeginn prüfen; Zusatzakkus vorhalten | Organisatorisch | `[Organisation/Einsatzleitung]` | Hoch |
| M8 | R8 | Beim Projekt selbst erledigt (`c7604e9`: Dependabot, `npm audit`, SBOM). Für die Organisation bleibt: regelmäßige (mind. halbjährliche) Prüfung neuer App-Versionen auf sicherheitsrelevante Änderungen im Änderungsprotokoll; als Prozess dokumentieren | Organisatorisch | `[Organisation]` | Mittel |
| M9 | Alle | Sensibilisierung der Einsatzkräfte: Kurzunterweisung zu Gerätesperre, Umgang mit exportierten Ausdrucken/Dateien (D6) und Meldung bei Geräteverlust | Organisatorisch/personell | `[Organisation/Ausbildungsverantwortliche/r]` | Hoch |
| M10 | — | Diesen Entwurf durch die/den IT-Sicherheitsbeauftragte/n prüfen und freigeben lassen, insbesondere die Schutzbedarfsfeststellung (Abschnitt 4) | Organisatorisch | `[IT-Sicherheitsbeauftragte/r]` | Hoch |

## 9. Restrisikobetrachtung

Unter der Voraussetzung, dass die organisatorischen Maßnahmen M1, M5, M7 und M9
umgesetzt werden, verbleibt nach Einschätzung dieses Entwurfs ein **mittleres bis
geringes Restrisiko**. Die verbleibenden technischen Schwachstellen (R2
Dekomprimierung, R3 Schlüsselspeicherung, R4 CSP) liegen überwiegend im
Verantwortungsbereich der Software-Weiterentwicklung und sind durch die
einsetzende Organisation nicht direkt behebbar.

Diese Einschätzung ersetzt keine rechtliche oder technische Prüfung.

## 10. Fortschreibung

Dieses Konzept ist zu überprüfen und fortzuschreiben:

- bei jeder App-Version mit sicherheitsrelevanten Änderungen (z. B. Änderungen an
  CSP, Schlüsselverwaltung, Update-Mechanismus),
- bei wesentlichen Änderungen des Einsatzkontexts oder Geräteumfangs der
  einsetzenden Organisation,
- mindestens jedoch einmal jährlich.

## 11. Ergebnis und Freigabe

| Rolle | Name | Datum | Unterschrift |
| --- | --- | --- | --- |
| IT-Sicherheitsbeauftragte/r | `[Name]` | | |
| Verantwortlich/Leitung | `[Name]` | | |
| Ersteller/in dieses Entwurfs | KI-gestützte Analyse (Claude), fachlich zu verantworten durch `[Name]` | 2026-09-12 | |

## Anhang: Herangezogene Quellen

Dieses Sicherheitskonzept stützt sich ausschließlich auf öffentlich einsehbaren
Quellcode und dessen Code-Kommentare/Dokumentation:

- `electron/main.js` — Electron-Sicherheitskonfiguration (Sandbox, Rechtevergabe, externe Navigation)
- `vite.config.ts` — Content-Security-Policy des Produktions-Builds
- `vendor/eeb-format/src/signatur.ts`, `src/app/geraete-schluessel.ts` — Schlüsselerzeugung, Signatur, Speicherung
- `vendor/eeb-format/src/codec.ts` — QR-/Datei-Payload-Format, Kompression/Dekompression
- `src/app/csv.ts`, `src/app/xlsx.ts` — Exportformate und deren Absicherung
- `src/app/sicherung.ts`, `src/app/vorlagen.ts`, `src/app/hilfen.ts` — Papierkorb-/Löschfunktion, Schema-Migration
- `docs/datenmodell.md` — Datenmodell, Trust-Modell, QR-Payload-Format
- `package.json` (Feld `build`), `.github/workflows/release.yml`, `.github/workflows/ci.yml` — Build-, Signier- und CI/CD-Konfiguration
- `PRODUCT.md`, `docs/entwicklung.md` — Produktkontext und technische Gesamtübersicht
- [Arc42-Architekturdokumentation](arc42-architektur.md) dieses Projekts
