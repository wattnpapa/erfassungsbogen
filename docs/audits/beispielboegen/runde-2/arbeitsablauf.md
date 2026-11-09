# Prüfbericht Schwerpunkt Beispielbögen, Runde 2: Arbeitsablauf

- **Prüfer:** Rolle „Arbeitsablauf“ (thw-workflow-reviewer). Wie in Runde 1 spiele ich drei Personen nacheinander: den Ausbilder, der eine Übung vorbereitet, den Teilnehmer, der eine Einheit spielt, und den Meldekopf, der die Bögen aufnimmt.
- **Datum:** 2026-11-09
- **Prüfgegenstand:** Nur der Bereich Beispielbögen auf der Live-Seite `https://erfassungsbogen.app/`, Stand `main` Commit `085a93b` (Fußzeile `v2026.1109.833`). Geprüft sind der Dialog „Beispielbögen“ (jetzt mit Suche, gemerktem Ordner und „Alle … in eine Übungs-Sammlung“) und alles, was danach kommt: „Anzeigen“, „PDF“, „Link“, die Übungs-Sammlung mit Sammel-PDF und Lageblatt, der Empfang beim Teilnehmer, die Aufnahme am Meldekopf, Vorlage und Rückweg.
- **Code zum Nachschlagen (nicht geändert):** `src/app/beispiele-dialog.tsx` (`beispielKopie`, `alleAlsUebung`, `suchTreffer`, `beispieleOeffnen`), `src/app/app.tsx` (`oeffneBeispiel`, `beispielUnveraendert`, `beispieleAlsUebung`, `bogenInSammlung`), `src/app/schritte/uebersicht.tsx` (`uebungEmpfangen`), `src/app/beispiel-heute.ts`.
- **Grundlage:** Bericht aus Runde 1 (`../arbeitsablauf.md`, BB-W1 bis BB-W10, H1 bis H6) und „Stand der Behebung“ Nr. 1 bis 21 in `../README.md`.
- **Maßstab:** Der ganze Ablauf zählt mehr als der einzelne Bildschirm. Je Ursache gibt es einen Befund.
- **Zählung (neue Befunde):** P0: 0 · P1: 0 · P2: 2 · P3: 3 · Hinweise (ohne Priorität): 7
- **Nachprüfung Runde 1:** behoben 5 (BB-W2, BB-W4, BB-W6, BB-W7, BB-W8) · teilweise 4 (BB-W1, BB-W3, BB-W5, BB-W10) · offen 1 (BB-W9)

## Prüfaufbau

- Playwright (`require('playwright')`, `chromium.launch()` ohne Optionen), Locale de-DE, `deviceScaleFactor` 1, `hasTouch`, bei 360 × 640 zusätzlich `isMobile`. Jeder Lauf startet mit einem frischen Profil gegen die Live-Seite. Getrennte Geräte (Ausbilder, Teilnehmer, Meldekopf) sind getrennte Browser-Kontexte. Ein Gerät, das später weiterarbeitet, wird über `storageState` fortgeführt. Skripte und Bildschirmfotos liegen in `/tmp/claude-0/r2-ablauf/`.
- Viewports: 360 × 640 (Teilnehmer, Durchblättern, Rückweg) und 820 × 1180 (Ausbilder am Schreibtisch, Meldekopf).
- Für den „Übungstag später“ habe ich die Uhr des Browsers mit `context.clock.install` auf den 14.11.2026, 10:00 Uhr gestellt, also fünf Tage nach der Vorbereitung. Das ist kein Eingriff in die Seite.
- Durchgespielte Abläufe:
  1. **Übungsvorbereitung (Ausbilder, Tablet).** Dialog › Suche „Bad Aibling“ › Treffer „OV Bad Aibling“ › „Alle 4 in eine Übungs-Sammlung“. Danach Sammel-PDF („Einsatz weitergeben / sichern“) und Lageblatt geladen und mit `pdftotext` gelesen. Außerdem vier Einzel-PDFs und dasselbe für „Praktische Ausbildung › Einlagen Kräfte Hannover“ (23 Bögen). Zuletzt ein zweiter OV (Miesbach) und ein wiederholter Sammelweg.
  2. **Teilnehmer (Telefon).** Der Ausbilder kopiert mit „Link“ die Bergungsgruppe Bad Aibling (683 Zeichen, Zwischenablage). Der Teilnehmer öffnet den Link in einem leeren Profil, dann „Bogen übergeben…“. Danach Neuladen und „Fortsetzen“.
  3. **Meldekopf (Tablet).** (a) Neue Sammlung der Art „Übung“, darin „Bögen einlesen…“ mit den vier Einzel-PDFs. (b) Dieselben PDFs in die vom Sammelweg schon gefüllte Sammlung. (c) Beides am „Übungstag“ fünf Tage später, dazu der Link beim Teilnehmer an diesem Tag.
  4. **Durchblättern mit eigenem Entwurf (Telefon).** Bogen „THW Musterstadt“ angefangen, dann drei DRK-Beispiele nacheinander mit „Anzeigen“. Zweiter Lauf: ein Beispiel öffnen, Seite neu laden, nächstes Beispiel.
  5. **Rückweg.** Nach „Anzeigen“ und nach dem Sammelweg über „‹ Startseite“ › „Beispielbögen ansehen“. Außerdem die Zurück-Taste des Browsers.
  6. **Ablage in eine echte Sammlung.** Sammlung der Art „Einsatz“ anlegen, Beispiel › „In Einsatz-Sammlung ablegen…“ › diese Sammlung.
  7. **Vorlage.** Beispiel › „Als Vorlage speichern“ › Startseite.
- Die Seite wurde nicht verändert: kein `addScriptTag`, keine DOM-Eingriffe. Gelesen wurde über `innerText` und `boundingBox`, die Zwischenablage über `navigator.clipboard.readText()` mit erteilter Berechtigung.

## Annahmen

- **A1 (wie Runde 1, Annahme):** Für eine Meldekopf-Übung sucht der Ausbilder vorab passende Bögen aus, zum Beispiel einen Zug, einen OV oder die Einheiten einer Region. Er gibt sie den Teilnehmern als Ausdruck oder Link. Die Teilnehmer melden sich damit am Meldekopf, und dort wird gescannt oder eingelesen. Geübt wird also gerade das Eingehen der Meldungen. Eine THW-Vorschrift dazu kenne ich nicht.
- **A2 (neu, Annahme):** Die Vorbereitung liegt meist Tage vor der Übung. PDFs werden am Schreibtisch erzeugt und gedruckt, Links vorab verschickt.
- **A3 (wie Runde 1):** Ein echter eigener Entwurf ist wichtiger als jedes Beispiel. Ein Beispiel lässt sich jederzeit neu laden.

## Nicht prüfbar

- Kamera-Scan der QR-Codes vom Display des Teilnehmers oder vom Papier. Ersatzweise habe ich Link und PDF-Einlesen geprüft. Wie lange drei Teil-Codes am Meldekopf dauern (BB2-W2), ist deshalb nicht gemessen.
- Das echte Share-Sheet (App, iOS/Android). Headless gab es nur die Zwischenablage („Kopiert“).
- Ausdruck auf Papier, native Builds, Betrieb ohne Netz.
- „Einsatz importieren…“ des Sammel-PDFs auf einem zweiten Meldekopf-Gerät habe ich nicht durchgespielt.

## Urteil aus Sicht der Rolle

Die großen Hindernisse aus Runde 1 sind weg. Der Ausbilder findet „OV Bad Aibling“ jetzt mit der Suche und einem Tipp. Mit einem weiteren Tipp liegt der ganze OV als Sammlung der Art „Übung“ vor: 4 Einheiten, 31 Helfer, Sammel-PDF und Lageblatt sofort verfügbar, ohne „Stand vor … Tagen“ und ohne „Zeitraum vorbei“. Die Hannover-Einlage ergibt jetzt 23 getrennte Einheiten mit 252 Helfern, die vier Teile des 2. Einsatzzugs tragen ihren Teil im Namen. Beim Teilnehmer steht „Bogen übergeben…“ vorn, darunter ein klarer Satz für Teilnehmer und Meldekopf. Durchblättern mehrerer Beispiele lässt den eigenen Entwurf in Ruhe, und der Dialog öffnet wieder im zuletzt benutzten Ordner. Ein Übungsbogen, der in eine echte Sammlung soll, löst jetzt eine Rückfrage aus.

Reibung entsteht an drei Stellen:

- Der neue Sammelweg baut eine **fertige Lage** auf dem Gerät des Ausbilders. Alle Einheiten sind dort schon „eingetroffen“, und das Sammel-PDF druckt auf jeden Bogen „Stand am Meldekopf … Eingetroffen 08:43“. Für die eigentliche Übung, in der Teilnehmer sich mit ihrem Bogen am Meldekopf melden (A1), muss der Ausbilder weiter jeden Bogen einzeln als PDF oder Link holen (BB2-W1).
- Ein per Link empfangener Übungsbogen zeigt dem Teilnehmer **drei Teil-QR-Codes statt einem** (BB2-W2).
- Die Datierung auf heute geschieht **beim Erzeugen**, nicht am Übungstag. Wer am Montag druckt und am Samstag übt, hat wieder „⚠ Stand vor 5 Tagen“ und „Zeitraum vorbei“ (BB-W5, teilweise). Außerdem kehrt nach einem Neuladen der alte Fehler aus BB-W1 vollständig zurück (BB-W1, teilweise).

## Nachprüfung Runde 1

### BB-W1 [P1 → Rest P2] Beispiel verdrängt eigenen Entwurf: **teilweise**

- **Behoben im normalen Ablauf:** Mit dem Entwurf „THW Musterstadt“ fragt das erste „Anzeigen“ wie vorgesehen: „Der angefangene Bogen „THW Musterstadt“ wird durch den Beispielbogen ersetzt …“. Danach ersetzen das zweite und dritte Beispiel einander ohne Rückfrage. „THW Musterstadt“ bleibt dabei unter „Zuletzt geschlossenen Bogen zurückholen“. Die Meldung sagt das ausdrücklich: „Solange du nichts änderst, ersetzt das nächste Beispiel ihn ohne Rückfrage. Dein eigener Bogen „THW Musterstadt“ liegt auf der Startseite …“. Die Startkarte trägt „BEISPIEL“.
- **Noch zu beobachten:** Beispiel öffnen, Seite neu laden (auf dem Telefon reicht dafür, dass der Browser den Tab verwirft, während man telefoniert), dann ein zweites Beispiel öffnen. Es erscheint wieder wörtlich die alte Rückfrage: „Der angefangene Bogen „DRK-Kreisverband Buchenrode e. V. Behandlung Kat. GELB (BHP 25)“ wird … ersetzt. Der Bogen „THW Musterstadt“ … auf dem Platz „Zuletzt geschlossener Bogen“ wird dabei endgültig gelöscht“, mit „Beispielbogen öffnen — alten Bogen endgültig löschen“. Die Startkarte zeigt nach dem Neuladen „ÜBUNG“ statt „BEISPIEL“ und „Entwurf … wiederhergestellt“. Die zuvor gegebene Zusage „ersetzt das nächste Beispiel ihn ohne Rückfrage“ stimmt dann nicht mehr (Bild `33-nach-reload-rueckfrage.png`). Das ist im README als „nur im Arbeitsspeicher“ vermerkt. Aus Nutzersicht ist es aber derselbe Fehler wie in Runde 1, nur seltener.
- **Empfehlung:** Das Merkmal „unverändertes Beispiel“ mit dem Entwurf speichern, so dass es ein Neuladen übersteht. Gelingt das nicht, darf ein Beispiel wenigstens nie den Rückholplatz eines echten Bogens überschreiben.

### BB-W2 [P1] Hannover-Einlage fasst vier Bögen zu einer Einheit zusammen: **behoben**

- Im Register heißen die ersten vier Zeilen jetzt „2. Einsatzzug Landeshauptstadt Hannover – Zugtrupp“, „– 1. Sanitätsgruppe“, „– 2. Sanitätsgruppe“ und „– Betreuungsgruppe“.
- Der Sammelweg mit allen 23 Bögen ergibt „23 EINHEITEN … 252 GESAMT“, die vier Teile stehen als Nr. 1 bis 4 getrennt. Nachprüfung aus Runde 1 erfüllt.
- Neu sichtbar in dieser Lage: „Hinweise: Kennzeichen doppelt“ auf den Karten (BB2-W4).

### BB-W3 [P2 → Rest P3] Kein Rückweg nach „Anzeigen“: **teilweise**

- **Behoben:** Der Dialog öffnet nach „Anzeigen“, nach dem Sammelweg und nach dem Neuladen im zuletzt offenen Ordner (z. B. „Alle › THW › … › RSt Bad Tölz › OV Bad Aibling“). Das zeitraubende Durchklicken der fünf Ebenen entfällt.
- **Noch zu beobachten:**
  - Im geöffneten Beispiel gibt es weiter keinen Knopf „Zurück zu den Beispielbögen“. Der Weg führt über „‹ Startseite“ und Scrollen zu „Beispielbögen ansehen“. Der Knopf liegt bei 360 × 640 mit offenem Bogen bei y = 2 328 bis 2 352, also im vierten Bildschirm.
  - Die Zurück-Taste des Browsers führt nach „Anzeigen“ auf die Startseite, nicht in den Dialog.
  - Das README nennt den fehlenden Knopf selbst als offen.

### BB-W4 [P2] Kein Sammelweg: **behoben** (neue Folgefragen siehe BB2-W1, BB2-W3)

- „Alle 4 in eine Übungs-Sammlung“ steht im Ordner direkt über der Liste (bei 360 × 640 auf y = 470, ohne Scrollen). Ein Tipp legt die Sammlung „Übung: …“ an und öffnet sie. Noch ein Tipp („Einsatz weitergeben / sichern“) liefert in 4,6 s das Sammel-PDF (9 Seiten), ein weiterer in 1,2 s das Lageblatt. Damit ist die Nachprüfung aus Runde 1 erfüllt: höchstens drei Tipps.
- Nicht umgesetzt ist der Teil der Empfehlung, der in einer leeren Sammlung der Art „Übung“ auf Beispielbögen verweist (siehe H5).

### BB-W5 [P2] Vergangene Zeiträume: **teilweise**

- **Behoben am Tag der Vorbereitung:** Geöffnet, per Link, als PDF und im Sammelweg tragen die Bögen den Zeitraum „09.11.2026 – 10.11.2026“ und den Stand von jetzt. Weder „Stand vor … Tagen“ noch „Zeitraum vorbei“ erscheinen.
- **Noch zu beobachten (A2):** Die Datierung geschieht beim Erzeugen. Am simulierten Übungstag fünf Tage später:
  - Die vorab angelegte Übungs-Sammlung meldet „Letzte Meldung ⚠ … (vor 5 Tagen) · ⚠ älteste Meldung vor 5 Tagen, 4 von 4 älter als 1 Std“.
  - Die vorab gedruckten Einzel-PDFs, in eine neue Übungs-Sammlung eingelesen, zeigen auf jeder Karte „⚠ Stand vor 5 Tagen“ und „Hinweise: Zeitraum vorbei“.
  - Der vorab verschickte Link zeigt beim Teilnehmer „⚠ 1 offener Punkt für die Weitergabe — Einsatzzeitraum 09.11.2026 – 10.11.2026 ist vorbei — gilt dieser Bogen noch für den aktuellen Einsatz?“.
  - Der Normalfall „Übung vorbereiten“ trifft also genau das alte Warnbild. Dazu kommen Warnungen aus den Daten selbst, die das README als offen führt: „Sitzplätze fehlen: 6“ (FGr E Bad Aibling) und „Kennzeichen doppelt“ (BB2-W4).
- **Empfehlung:** Ein Bogen, der als Übungsbogen eingeht (Einlesen in eine Sammlung der Art „Übung“, Öffnen eines Übungs-Links), sollte beim Empfang nicht als veraltet gewarnt werden. Alternativ fragt der Sammelweg und „PDF“ einmal nach dem Übungsdatum.
- **Nachprüfung:** Uhr fünf Tage vorstellen, vorab erzeugte PDFs in eine Übungs-Sammlung einlesen. Ergebnis: kein „Stand vor 5 Tagen“, kein „Zeitraum vorbei“.

### BB-W6 [P2] Link öffnet beim Teilnehmer als „fremde Einheit“: **behoben**

- Erste und dunkel hervorgehobene Schaltfläche ist jetzt „Bogen übergeben…“, darunter steht: „Empfangener Übungsbogen: Zum Melden am Meldekopf „Bogen übergeben…“ (QR-Code, PDF oder Link). Wer den Meldekopf spielt, legt ihn in eine Sammlung der Art „Übung“.“ Der Satz „Meldung einer fremden Einheit“ fehlt (Bild `10-teilnehmer.png`). Nachprüfung erfüllt.
- Neu aufgefallen ist dabei der QR-Code in drei Teilen (BB2-W2).

### BB-W7 [P3] Übungsbögen in einer Sammlung der Art „Einsatz“: **behoben**

- Beim Ablegen in „Echter Einsatz“ (Art „Einsatz“) kommt vor der Aufnahme die Rückfrage „Übungsbogen in diese Sammlung? … In „Echter Einsatz“ zählt er nicht in die Lage, bekommt aber eine Nummer. Für Übungen gibt es Sammlungen der Art „Übung“.“ mit „Trotzdem ablegen“ und „Abbrechen“ (Bild `72-ablage-einsatz.png`).

### BB-W8 [P3] Nur über Ordner auffindbar, Ländernamen uneinheitlich: **behoben** (Rest siehe BB2-W5)

- Suchfeld „Ort, OV oder Einheit“ vorhanden. „Bad Aibling“ findet den OV-Ordner, „Bad Tölz“ die Regionalstelle mit 49 Bögen.
- Unter „Katastrophenschutz“ stehen „Baden-Württemberg“, „Mecklenburg-Vorpommern“, „Nordrhein-Westfalen“ normal geschrieben.
- Lose Bögen tragen den Hinweis „8 Bögen direkt in „DRK“, außerhalb der Ordner oben“.

### BB-W9 [P3] Verschiedene Übungslagen innerhalb eines Zuges: **offen**

- OV Bad Aibling, 1. TZ: Zugtrupp und Bergungsgruppe „Sturmtief »Quirin« Bruckmühl“, FGr N „Stromausfall Bruckmühl“, FGr E „Flächenlage Bruckmühl“. Damit sind es drei Lagen bei vier Bögen.
- OV Miesbach, 1. TZ: „Sturmtief »Quirin«“, „Hochwasser“, „Sturmschäden“, „Eisgang/Verklausung“, „Stromausfall“, also fünf Lagen bei fünf Bögen.
- Mit dem Sammelweg fällt das stärker auf als in Runde 1, weil jetzt der ganze Zug in einer Lage steht. Das Sammel-PDF zeigt für denselben Zug die verschiedenen Aufträge direkt untereinander. Das README erwähnt den Punkt unter Nr. 16, behoben ist nur die Datierung.

### BB-W10 [P3] Vorlage aus Beispiel nicht erkennbar: **teilweise**

- **Behoben:** Die Vorlagenkarte heißt „THW Bad Aibling Bergungsgruppe“ und trägt jetzt „ÜBUNG“.
- **Offen:** Das Angebot „Als Grundlage für meine Einheit — Namen leeren, Übung abwählen?“ fehlt. Der Speicherdialog fragt nur nach dem Namen. Gering, weil die Übungskennung jetzt sichtbar ist.

### Hinweise aus Runde 1

- **H2 PDF-Dateinamen:** behoben, mit neuer Folge (H2 unten).
- **H3 echte Dienststellen-Adressen:** offen. Weiter „OV-Aibling@thw.de“, „Poststelle.RSt_Bad-Toelz@thw.de“ und „Poststelle.LVBY@thw.de“, jetzt auch im Sammel-PDF.
- **H4 „Dein Bogen“ beim Ablegen eines Beispiels:** offen, wörtlich unverändert.
- **H5 und H6:** nicht Gegenstand dieser Runde.

## Neue Befunde

### BB2-W1 [P2] Typ Ablauf/Rolle: Der Sammelweg baut eine fertige Lage beim Ausbilder. Für das Verteilen an die Teilnehmer bleibt es beim Einzel-Download

- **Fundstelle:** Dialog › „OV Bad Aibling“ › „Alle 4 in eine Übungs-Sammlung“ › Sammlung › „Einsatz weitergeben / sichern“ (Sammel-PDF). 820 × 1180. Code: `beispieleAlsUebung` (`meldungAufnehmen(…, { quelle: "manuell" })`).
- **Beobachtung:**
  - Nach dem Tipp sind auf dem Gerät des Ausbilders alle vier Einheiten „kürzlich eingetroffen“: „eingetroffen 09.11.2026, 08:43 … am Meldekopf von Hand erfasst“, alle zur selben Minute. Von Hand erfasst hat sie niemand.
  - Das Sammel-PDF ist eine Übergabe-Übersicht mit Lage, Summen und „Erstmeldung“. Über jedem Bogen steht „Stand am Meldekopf (…): Nr. 1 · Eingetroffen 09.11.2026, 08:43 · anwesend · Zug: – · Auftrag / Notiz: –“. Als Handzettel für einen Teilnehmer, der sich erst noch melden soll, taugt es so nicht.
  - Für die Teilnehmer bleibt deshalb nur der alte Weg: je Bogen „PDF“ (1,4 bis 3,3 s, je ein eigener Download) oder „Link“. Bei der Hannover-Einlage sind das 23 Einzelschritte.
  - Liest der Meldekopf die Teilnehmer-PDFs dann in die schon gefüllte Sammlung ein, entstehen vier „Folgemeldung … inhaltlich unverändert“. Das ist richtig gelöst, aber kein Übungseffekt.
  - Der Hinweis am Knopf sagt nur „mit Sammel-PDF, Lageblatt und Weitergabe“, nicht, wofür der Weg gedacht ist (Lage zum Vorzeigen oder Material zum Verteilen).
- **Folge:** Für eine Meldekopf-Übung nach A1 hilft der Sammelweg kaum. Er erzeugt das Ergebnis, das der Meldekopf erst erarbeiten soll. Das Austeilen an die Teilnehmer kostet weiter einen Download je Bogen. Wer die Sammlung samt Sammel-PDF an den Meldekopf weitergibt, nimmt ihm die Übung vorweg. Und der Eintrag „am Meldekopf von Hand erfasst“ ist in der Auswertung falsch.
- **Empfehlung:** Zwei Ausgänge je Ordner anbieten. (1) „Alle n als PDF zum Austeilen“: ein PDF mit den Bögen nacheinander, ohne Meldekopf-Kasten und ohne Eingangszeit, ein Bogen je Blatt mit QR-Code. (2) Der bestehende Weg „in eine Übungs-Sammlung“ für eine vorgefertigte Lage, dann mit Herkunft „aus Beispielbögen übernommen“ statt „am Meldekopf von Hand erfasst“. Am Knopf in einem Satz sagen, welcher Weg wofür ist.
- **Nachprüfung:** Ordner „OV Bad Aibling“: Mit höchstens zwei Tipps liegt ein PDF vor, das vier verteilbare Bögen ohne „Eingetroffen“ und ohne Lage enthält. Karten aus dem Sammelweg nennen nicht mehr „von Hand erfasst“.

### BB2-W2 [P2] Typ Ablauf/Übergabe: Ein per Link empfangener Übungsbogen zeigt dem Teilnehmer drei QR-Teile statt einem

- **Fundstelle:** Teilnehmer (360 × 640) öffnet den Link der Bergungsgruppe Bad Aibling › Übersicht › „QR-Code (Offline-Transport)“ bzw. „Bogen übergeben…“ › „QR-Code im Vollbild zeigen“. Bild `11-teilnehmer-full.png`.
- **Beobachtung:**
  - Beim Teilnehmer steht: „Bogen zu groß für einen Code — in 3 Teile aufgeteilt. Alle Teile nacheinander scannen … Beim Absender waren es 1 Code: Die Gegenzeichnung dieses Geräts (Weitergabe bezeugt, mit Absenderangaben) reist zusätzlich mit.“ Dazu „Teil 1 / 3“ bis „Teil 3 / 3“ und „Unveränderter Bogen von fremder Stelle: Der Code trägt weiterhin die Original-Signatur; dieses Gerät hat nur gegengezeichnet“.
  - Beim Ausbilder („Anzeigen“) ist derselbe Bogen ein einzelner Code.
  - Nach Neuladen und „Fortsetzen“ zeigt der Teilnehmer plötzlich nur einen Code („Signiert mit dem Echtheits-Siegel dieses Geräts“). Auch der Satz „Empfangener Übungsbogen …“ und „Empfangen als: ✓ signiert …“ sind dann verschwunden.
- **Folge:** Gerade der Schritt, der am Meldekopf geübt werden soll, wird künstlich dreimal so lang. Jeder Teilnehmer zeigt drei Codes nacheinander, der Meldekopf scannt drei, und der erklärende Text ist Signaturtechnik statt Einsatzsprache. Ob es ein oder drei Codes sind, hängt zudem davon ab, ob die Seite zwischendurch neu geladen wurde. Die Kamerazeit selbst ist nicht gemessen (siehe „Nicht prüfbar“).
- **Empfehlung:** Für einen unveränderten Übungsbogen aus den Beispielbögen beim Empfänger keinen Gegenzeichnungs-Zuschlag in den Code legen, so dass derselbe eine Code wie beim Ausbilder entsteht. Wenigstens den Teilnehmer nicht mit „fremder Stelle“ und „gegengezeichnet“ ansprechen. Das Verhalten vor und nach dem Neuladen angleichen.
- **Nachprüfung:** Link im leeren Profil öffnen. Ergebnis: ein QR-Code, gleich viele Teile wie beim Ausbilder, vor und nach dem Neuladen.

### BB2-W3 [P3] Typ Ablauf: Der Sammelweg gilt nur für genau einen Ordner. Wiederholen erzeugt stille Doppel, und der Name ist der ganze Pfad

- **Fundstelle:** Dialog › „RSt Bad Tölz“ (9 OV, 49 Bögen), Suchergebnis, zweiter Sammelweg. 360 × 640 und 820 × 1180.
- **Beobachtung:**
  - Der Knopf erscheint nur, wo Bögen direkt im Ordner liegen. In „RSt Bad Tölz“ („0 Bögen, 9 Unterordner“) und in Suchergebnissen fehlt er. Für eine Übung „Einheiten einer Region“ (A1) gibt es keinen Sammelweg.
  - Der Sammelweg für einen zweiten OV (Miesbach) legt eine zweite, getrennte Sammlung an. Ein „zu bestehender Sammlung hinzufügen“ gibt es nicht.
  - Ein zweiter Tipp auf denselben Ordner legt ohne Hinweis eine zweite, gleichnamige Sammlung mit denselben vier Einheiten an. Auf der Startseite und im Ablage-Dialog stehen dann zwei identische Einträge.
  - Der Name ist der volle Pfad: „Übung: THW › Alle Einheiten aller Ortsverbände (nach Landesverband, Regionalstelle, OV) › Bayern › RSt Bad Tölz › OV Bad Aibling“ (138 Zeichen). Bei 360 × 640 belegt er sieben Zeilen im Kopf der Sammlung (Bild `91-sammlung-360.png`). Zwei Sammlungen unterscheiden sich erst im letzten Wort. Auch Sammel-PDF und Lageblatt tragen den Pfad im Dateinamen (rund 150 Zeichen) und in jeder Fußzeile.
  - Der Ort bleibt leer („Ort eintragen…“), obwohl alle Bögen „Bruckmühl“ nennen.
- **Folge:** Eine Übung über zwei OV oder eine RSt führt zurück zu Einzel-PDFs und „Bögen einlesen…“. Wer versehentlich zweimal tippt, hat doppelte Sammlungen und muss die richtige an langen, gleich anfangenden Namen erkennen.
- **Empfehlung:** Sammelweg auch auf höheren Ebenen und für Suchergebnisse, mit Bogenzahl im Knopf. Gibt es schon eine Übungs-Sammlung aus Beispielbögen, die Wahl „neu anlegen / in „…“ hinzufügen“ anbieten. Bei gleichem Ordner auf die vorhandene Sammlung hinweisen. Als Namen den letzten Ordner verwenden („Übung: OV Bad Aibling“).
- **Nachprüfung:** In „RSt Bad Tölz“ steht ein Sammelknopf. Ein zweiter Tipp auf denselben Ordner fragt nach. Der Sammlungsname passt bei 360 px in höchstens zwei Zeilen.

### BB2-W4 [P3] Typ Inhalt: Platzhalter-Kennzeichen erzeugen in der Hannover-Übungslage „Kennzeichen doppelt“ auf fast jeder Karte

- **Fundstelle:** Übungs-Sammlung „Übung: Praktische Ausbildung › Einlagen Kräfte Hannover“ (Sammelweg, 23 Bögen), Karten. Daten in `examples/praktische-ausbildung/hannover/`.
- **Beobachtung:** Auf den Karten Nr. 1 bis 5 steht „Hinweise: Kennzeichen doppelt“, weitere Karten habe ich nicht einzeln gelesen. Die Daten tragen Platzhalter: „H-JU XXX“ in 11 Bögen, „H-X XXX“ in 5, dazu „H-XXXX“, „H-J XXX“ und „NI“ mehrfach innerhalb eines Bogens. Damit können 19 von 23 Bögen die Warnung auslösen.
- **Folge:** In der Ausbildungseinlage ist „Kennzeichen doppelt“ ein Dauerzustand. Gerade dieser Hinweis, im Ernstfall ein Zeichen für eine doppelt gemeldete Einheit, wird beim Üben weggelernt. Es ist dieselbe Wirkung wie in BB-W5, nur aus einer anderen Ursache.
- **Empfehlung:** In den Hannover-Bögen eindeutige fiktive Kennzeichen vergeben, wie bei den OV-Bögen („THW-60328“).
- **Nachprüfung:** Sammelweg „Einlagen Kräfte Hannover“: keine Karte trägt „Kennzeichen doppelt“.

### BB2-W5 [P3] Typ Navigation: Die Suche trifft Wortteile über Wortgrenzen und listet dadurch fremde Bögen zuerst

- **Fundstelle:** Dialog › Suchen › „Bad Aibling“. 820 × 1180. Code: `suchTreffer` (`text.includes(w)`).
- **Beobachtung:** Ergebnis „1 Ordner, 5 Bögen“. Als erster Bogen steht „Einsatzeinheit Erstversorgung (EE-EV) · Rems-Murr-Kreis · Deutsches Rotes Kreuz Rems-Murr-Kreis“, vor den vier Bögen aus Bad Aibling. Der Grund: „bad“ steckt in „badenwuerttemberg“ und „aibling“ in „waiblingen“.
- **Folge:** Gering, weil der richtige Ordner oben steht. Wer aber direkt auf den ersten Bogen tippt, hat eine DRK-Einheit statt eines THW-Zugtrupps. Bei kurzen Ortsnamen wie „Hof“ oder „Au“ werden die Fehltreffer zahlreicher.
- **Empfehlung:** Wörter am Wortanfang vergleichen und Treffer im eigenen Pfad- bzw. Ortsnamen vorn einsortieren.
- **Nachprüfung:** „Bad Aibling“ listet nur Bögen aus Bad Aibling.

## Hinweise (ohne Priorität)

- **H1 Funktioniert:** Die Suche mit einem Tipp auf den Ordner ersetzt die fünf Ordnertipps. Die Quittung nach „PDF“ („… erzeugt — liegt im Download-Ordner.“) erscheint. Ein Übungsbogen in einer Übungs-Sammlung gilt als zählend. Das Einlesen derselben PDFs in eine schon gefüllte Sammlung ergibt saubere „Folgemeldung … inhaltlich unverändert“ statt Doppel. „Bogen schließen“ und Ablage-Rückfrage tun, was sie sagen. Die Startkarte trägt „BEISPIEL“, solange nicht neu geladen wurde.
- **H2 Dateinamen jetzt lang und doppelt:** `uebung-beispiel-thw-ortsverbaende-lv-bayern-rst-bad-toelz-ov-bad-aibling-ov-bad-aibling-01-1-tz-ztr-tz.pdf` (103 Zeichen, „ov-bad-aibling“ zweimal). Im Download-Ordner des Telefons ist davon nur der Anfang sichtbar, der bei allen Bögen gleich ist.
- **H3 Echte Dienststellen-Adressen** (aus Runde 1, offen): Jetzt stehen „Poststelle.LVBY@thw.de“ und „Poststelle.RSt_Bad-Toelz@thw.de“ auch im Sammel-PDF jeder Übungslage.
- **H4 „Dein Bogen“** im Ablage-Dialog eines Beispiels (aus Runde 1, offen): „Dein Bogen wird als Meldung abgelegt … dein Bogen bleibt unter „Fortsetzen““.
- **H5 Leere Übungs-Sammlung ohne Verweis:** Eine neue Sammlung der Art „Übung“ zeigt nur „Noch keine Meldung. Bogen scannen oder manuell erfassen.“ Der Satz „Mit Beispielbögen füllen…“ aus der Empfehlung zu BB-W4 fehlt. Der Meldekopf, der selbst üben will, erfährt hier nicht, dass es Beispielbögen gibt.
- **H6 Korrektur zu Runde 1:** „OV Bad Aibling“ enthält 4 Bögen, nicht 6 wie in BB-W4 aus Runde 1 angegeben. Die Daten im Repository enthalten ebenfalls vier.
- **H7 Teilnehmer nach Neuladen:** Ein empfangener Übungslink überlebt das Neuladen als „Entwurf … wiederhergestellt“. Nach „Fortsetzen“ ist der Bogen aber ein eigener Bogen des Teilnehmers: Hinweis für Teilnehmer und Meldekopf weg, Signatur jetzt „dieses Geräts“. Für die Übung schadet das nicht („Bogen übergeben…“ bleibt vorn), es erklärt aber das wechselnde Verhalten in BB2-W2.

## Abschluss

- **Aufgabe geschafft:** ja, mit Umwegen beim Verteilen. Eine Übungslage aus einem OV oder der Hannover-Einlage entsteht mit zwei Tipps und stimmt (4 / 31 bzw. 23 / 252). Die Teilnehmerbögen müssen weiter einzeln als PDF oder Link geholt werden. Bei Vorbereitung an einem früheren Tag kommen die Alterswarnungen zurück.
- **Fremde Hilfe nötig:** nein. Der Teilnehmer wird jetzt richtig zu „Bogen übergeben…“ geführt.
- **Größtes Missverständnis:** „Alle … in eine Übungs-Sammlung“ klingt nach „Übung vorbereiten“, liefert aber die fertige Lage mit allen Einheiten schon „eingetroffen“ statt Material für die Teilnehmer (BB2-W1).
- **Größtes Einsatzrisiko:** Nach einem Neuladen gilt ein angesehenes Beispiel wieder als „angefangener Bogen“, und die Rückfrage bietet an, den echten Entwurf auf dem Rückholplatz „endgültig“ zu löschen (BB-W1, Rest).
- **Top-Priorität für die nächste Iteration:** Ein Sammel-PDF „zum Austeilen“ je Ordner, ohne Meldekopf-Stand und Eingangszeit (BB2-W1). Unmittelbar danach den Status „unverändertes Beispiel“ über das Neuladen retten (BB-W1).
