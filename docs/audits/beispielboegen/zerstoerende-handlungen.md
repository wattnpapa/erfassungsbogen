# Audit „Zerstörende Handlungen“, Schwerpunkt Beispielbögen (Anzeigen ersetzt den offenen Bogen, Übungskennzeichnung, Link)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-11-08 ·
Prüfgegenstand: Live-Seite `https://erfassungsbogen.app/` (Version `v2026.1108.2056`), Code-Stand
Commit `0dd56d4` (`main`). Nur der Bereich Beispielbögen: Abschnitt „Beispielbögen“ unter
„So funktioniert’s“ mit „Beispielbögen ansehen“, der Dialog „Beispielbögen“ (Register,
Pfadleiste, Tabelle mit Anzeigen/PDF/Link) und was ein angezeigter Beispielbogen danach in der
App auslösen kann.

**Zählung: P0 0 · P1 1 · P2 1 · P3 2 · Hinweise 5** (BB-D1 bis BB-D4; Hinweise H1 bis H5).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md` und
`runde-21/zerstoerende-handlungen.md` (Aufbau). Zum Nachschlagen: `src/app/fusszeile.tsx`
(Dialog, `beispielAnsehen`, `beispielLinkHolen`), `src/app/app.tsx` (`oeffneBeispiel`,
`darfBogenErsetzen`, `folgenFuerOffenenBogen`), `src/app/beispiel-herkunft.ts`.

## Prüfaufbau

Chromium über das vorinstallierte `playwright`, `chromium.launch()` ohne Optionen, gegen die
Live-Seite. `isMobile`/`hasTouch`, Locale de-DE, Viewport 360 × 640, `deviceScaleFactor` 1,
je Szenario ein frischer Browserkontext (leerer Speicher), Zwischenablage-Rechte erteilt. Kein
Eingriff ins DOM, kein Skript in die Seite. Zustand ausschließlich über die Bedienung: eigener
Entwurf über „Neuen Bogen erstellen“ (Ort „Musterstadt-EIGEN“, Telefon), Einsatz-Sammlung
„Hochwasser Echt“ (Art Einsatz) über „Neue Einsatz-Sammlung…“, fremde Erfassung über „Einheit
manuell erfassen…“. Beispiele: Ordner THW, Zeilen „Zugtrupp Technischer Zug, Albstadt“ und
„Fachgruppe Ortung (B), Biberach/Riß“. Skripte und Screenshots in
`/tmp/claude-0/audit-zerstoerend/` (außerhalb des Repositorys).

Durchgespielt:

1. Eigener halber Entwurf → Beispiel anzeigen → Rückfrage → Startseite (Rückholplatz).
2. Danach ein zweites Beispiel anzeigen; ebenso „Bogen schließen“ und „Neuen Bogen erstellen“
   bei offenem Beispiel; Weg „endgültig löschen“ und Weg „vorher als Datei sichern“.
3. Rückweg über „Zuletzt geschlossenen Bogen zurückholen“ bei offenem Beispiel.
4. Offene Einsatz-Sammlung und offene fremde Erfassung → Beispiel anzeigen.
5. Beispiel → „In Einsatz-Sammlung ablegen…“ in eine Sammlung der Art „Einsatz“.
6. Beispiel → „Als Vorlage speichern“ → „Einsatz vorbereiten“ → „Dies ist eine Übung“ abwählen;
   ebenso nach „Bogen schließen“ → „Zurückholen“; zum Vergleich direkt am geöffneten Beispiel.
7. Beispiel → „Bogen übergeben…“ → „Für neuen Einsatz vorbereiten“.
8. „Link“ im Dialog mit vorher gefüllter Zwischenablage; den kopierten Link auf einem
   „Empfangsgerät“ (frischer Kontext mit eigenem Entwurf und Einsatz-Sammlung) öffnen.

## Annahmen

- Wer die Beispielbögen öffnet, schaut sich typischerweise mehr als einen an (der Dialog führt
  101 THW-Bögen in einer Liste, die Ordner insgesamt über 3.600). Das ist die Grundlage für
  BB-D1.
- Ein Helfer, der einen passenden Beispielbogen findet, nimmt ihn plausibel als Ausgangspunkt
  für die eigene Einheit (Vorlage oder Weiterbearbeiten). Ob das im THW so gewollt ist, ist
  nicht Gegenstand dieser Prüfung; die App sieht es mit „Als Vorlage speichern“ selbst vor.
- In headless Chromium gibt es kein `navigator.share`; der Link-Weg lief deshalb über die
  Zwischenablage. Auf Telefonen mit Share-Sheet greift stattdessen das Teilen-Menü.

## Urteil

Die erste Rückfrage „Beispielbogen öffnen?“ ist klar: Sie nennt den eigenen Bogen mit Namen,
sagt, dass er auf den Rückholplatz wandert, die sichere Wahl hat den Fokus, die Knöpfe stehen
24 px auseinander. Der Rückweg über „Zurückholen“ tauscht sauber. Eine offene fremde Erfassung
wird rot und ausdrücklich als „wird verworfen“ angekündigt, eine angelegte Einsatz-Sammlung
bleibt unberührt, und eine abgelegte Übungsmeldung zählt in der Lage nicht mit.

Das Problem liegt einen Schritt weiter: **Der unveränderte Beispielbogen belegt danach den
einzigen Rückholplatz wie ein echter Entwurf.** Wer ein zweites Beispiel ansieht, das erste
schließt oder einen neuen Bogen beginnt, verliert den eigenen Entwurf endgültig, ohne
Papierkorb. Die Rückfrage warnt zwar, aber mit dem Knopf „alten Bogen endgültig löschen“, den
man beim Durchblättern auf das eben angesehene Beispiel bezieht. Zweitens geht der Schutz vor
erfundenen Namen und Rufnummern (R14-E6) verloren, sobald das Beispiel über eine Vorlage oder
über Schließen/Zurückholen weiterlebt; dann lässt sich „Übung“ ohne jede Rückfrage abwählen.
Die Aufgabe „Beispiel ansehen und zum eigenen Bogen zurückkehren“ ist ohne fremde Hilfe
lösbar, wenn man den Weg „Zurückholen“ nimmt; der naheliegende Weg „Beispiel schließen“ führt
in die Falle von BB-D1.

## Befunde

### BB-D1 [P1] Ein zweites Beispiel (oder „Beispiel schließen“) löscht den eigenen Entwurf vom Rückholplatz endgültig

**Typ:** Bedienung (Datenverlust mit Warnung, missverständliche Knopfbeschriftung).
**Kennzeichnung:** gemessen (360 × 640, mehrfach, frische Kontexte).

**Fundstelle:** Dialog „Beispielbögen“ → „Anzeigen“ beim zweiten Beispiel; ebenso „Bogen
schließen“ und „Neuen Bogen erstellen“, solange ein Beispiel offen ist und der eigene Entwurf
auf dem Rückholplatz liegt.

**Beobachtung:**
1. Eigener Entwurf „THW Musterstadt-EIGEN“, dann Beispiel „Albstadt“ anzeigen. Rückfrage:
   „Der angefangene Bogen „THW Musterstadt-EIGEN“ wird durch den Beispielbogen ersetzt. Der
   Stand bleibt auf der Startseite unter „Zuletzt geschlossenen Bogen zurückholen“ erreichbar.“
   Dass dieser Platz nur einen Bogen fasst und schon das nächste Beispiel ihn braucht, steht
   hier nicht.
2. Startseite danach: oben das Beispiel als offener Bogen („THW Albstadt Zugtrupp Technischer
   Zug · Einsatz 17.07.2026 – 18.07.2026 · Fortsetzen / Bogen schließen“), darunter der eigene
   Entwurf als „Zuletzt geschlossener Bogen“.
3. Zweites Beispiel „Biberach/Riß“ anzeigen. Rückfrage: „Der angefangene Bogen „THW Albstadt
   Zugtrupp Technischer Zug“ wird durch den Beispielbogen ersetzt. Der Bogen „THW
   Musterstadt-EIGEN“ … auf dem Platz „Zuletzt geschlossener Bogen“ wird dabei endgültig
   gelöscht …“. Knöpfe: „Beispielbogen öffnen — den alten Bogen vorher als Datei sichern“
   (Primärfarbe), „Beispielbogen öffnen — alten Bogen endgültig löschen“ (rot), „Abbrechen“
   (Fokus).
4. Nach „alten Bogen endgültig löschen“: Rückholplatz enthält jetzt das **unveränderte**
   Beispiel „Albstadt“, der eigene Entwurf ist nirgends mehr im Speicher (geprüft über alle
   `localStorage`-Einträge), es gibt keinen Papierkorb für Bögen.
5. Dieselbe Folge haben „Bogen schließen“ am offenen Beispiel („Der Bogen wird geschlossen,
   nicht gelöscht. Der Bogen „THW Musterstadt-EIGEN“ … wird dabei endgültig gelöscht“) und
   „Neuen Bogen erstellen“ („Neu anfangen — alten Bogen endgültig löschen“).
6. Der Weg „vorher als Datei sichern“ lädt `eeb-THW_Musterstadt-EIGEN.json` herunter und rettet
   den Entwurf, siehe H2.

**Erwartung der Rolle:** Ein Beispiel ist zum Anschauen da; es kann jederzeit wieder aus der
Liste geholt werden und darf den eigenen Bogen nicht verdrängen. „Alter Bogen“ ist beim
Durchblättern das Beispiel, das man gerade gesehen hat, nicht der eigene Entwurf.

**Auswirkung im Einsatz:** Der Helfer füllt den eigenen Bogen halb aus, will in den
Beispielen nachsehen, „wie die anderen das eintragen“, schaut zwei oder drei an und bestätigt
die zweite Rückfrage im Glauben, das vorige Beispiel werde verworfen. Der eigene Bogen ist
weg und muss am Meldekopf neu erfasst werden. Am kritischsten ist Schritt 5: Wer zum eigenen
Bogen zurück will und dafür das Beispiel schließt (der naheliegende Weg), verliert genau den
Bogen, zu dem er zurückwollte.

**Empfehlung:** Ein unverändertes Beispiel nicht auf den Rückholplatz legen (es ist jederzeit
wieder aus der Liste zu holen); erst wenn im Beispiel etwas geändert wurde, wie ein Entwurf
behandeln. Mindestens in den Rückfragen „Beispielbogen“ statt „angefangener Bogen“ sagen und
den Verlust-Knopf mit dem Namen des eigenen Bogens beschriften („„THW Musterstadt-EIGEN“
endgültig löschen“) statt „alten Bogen“. Beim Schließen eines Beispiels anbieten, den eigenen
Bogen gleich zurückzuholen.

**Nachprüfung:** Eigener Entwurf, drei Beispiele nacheinander anzeigen, das letzte schließen:
eigener Entwurf ist weiterhin zurückholbar, keine Rückfrage nennt „endgültig gelöscht“.

### BB-D2 [P2] Übungsschutz für Beispieldaten geht über Vorlage und Schließen/Zurückholen verloren: „Übung“ lässt sich ohne Rückfrage abwählen

**Typ:** Bedienung (Kennzeichnung geht verloren, fiktive Daten werden zu echten).
**Kennzeichnung:** gemessen (360 × 640).

**Fundstelle:** Geöffnetes Beispiel → „Als Vorlage speichern“ → Startseite „Gespeicherte
Vorlagen“ → „Einsatz vorbereiten“ → „Bogen anlegen“ → Schritt 2 „Dies ist eine Übung“. Ebenso:
Beispiel → „Bogen schließen“ → „Zuletzt geschlossenen Bogen zurückholen“ → Schritt 2.

**Beobachtung:**
1. Direkt am geöffneten Beispiel fragt die App beim Abwählen von „Dies ist eine Übung“ korrekt:
   „Beispieldaten im Bogen — 4 Personen („Lang, Sabine“, „Sommer, Sandra“ …) und 2 Rufnummern
   stammen aus einem Beispiel- oder Übungsbogen und sind vermutlich erfunden …“ mit Fokus auf
   „Übung beibehalten“.
2. „Als Vorlage speichern“ übernimmt den Namen „THW Albstadt Zugtrupp Technischer Zug“ und die
   Übungsmarke (`uebung: true` in der gespeicherten Vorlage). Die Vorlagenkarte auf der
   Startseite und die Musterung („Alle sind vorab angehakt …“) zeigen **keine** Übungs- oder
   Beispielkennzeichnung.
3. Schon beim Schließen des Beispiels wird die Merkliste der Beispielnamen geleert
   (`eeb.beispiel-herkunft.v1` fehlt danach). Der aus der Vorlage angelegte Bogen trägt den
   Störer „ÜBUNG — …“, aber das Abwählen von „Dies ist eine Übung“ geschieht **ohne Rückfrage**;
   der Störer verschwindet, Personal „Lang, Sabine“ mit Rufnummer 5556968346 usw. bleibt.
4. Gleiches nach „Bogen schließen“ → „Zurückholen“ des Beispiels: keine Merkliste, Abwählen ohne
   Rückfrage.
5. Gegenprobe: „Bogen übergeben…“ → „Für neuen Einsatz vorbereiten“ am offenen Beispiel behält
   Übungsmarke und Schutz.

**Erwartung der Rolle:** Ein Bogen aus einem Beispiel bleibt als solcher erkennbar, egal über
welchen Weg er weiterlebt; die Warnung vor erfundenen Namen und Nummern kommt immer, wenn diese
noch drinstehen.

**Auswirkung im Einsatz:** Wer sich aus einem passenden Beispiel eine Vorlage für den eigenen
OV baut und später (Tage danach) „Einsatz vorbereiten“ tippt, hat einen Bogen mit erfundenen
Personen und Rufnummern, der nach einem Haken als echter Einsatzbogen per QR/PDF/Link an den
Meldekopf geht. Dort stehen dann falsche Namen in der Stärkemeldung und Rückrufe gehen ins
Leere. Abgemildert, weil der Bogen bis zum Abwählen den Übungsstörer trägt.

**Empfehlung:** Die Herkunft „aus Beispiel“ am Bogen bzw. an der Vorlage festhalten statt nur
in einer Sitzungsliste, sodass Vorlage, Rückholplatz und daraus angelegte Bögen die Rückfrage
beim Abwählen weiter auslösen. Vorlagenkarte und Musterung mit „Übung / aus Beispiel“
kennzeichnen; beim Speichern einer Vorlage aus einem Beispiel kurz darauf hinweisen.

**Nachprüfung:** Beispiel → Vorlage → schließen → „Einsatz vorbereiten“ → „Übung“ abwählen:
Rückfrage „Beispieldaten im Bogen“ erscheint. Ebenso nach Schließen und Zurückholen.

### BB-D3 [P3] Beispielbogen landet mit einem Tipp in einer echten Einsatz-Sammlung, ohne Hinweis auf „Beispiel“

**Typ:** Bedienung/Text. **Kennzeichnung:** gemessen (360 × 640).

**Fundstelle:** Geöffnetes Beispiel → „In Einsatz-Sammlung ablegen…“ → Sammlung „Hochwasser
Echt“ (Art Einsatz); außerdem Empfang des Beispiel-Links auf einem Gerät mit dieser Sammlung.

**Beobachtung:**
1. Der Dialog sagt „Dein Bogen wird als Meldung abgelegt …“; ein Tipp auf „Hochwasser Echt“
   legt sofort ab, keine Rückfrage, kein Hinweis auf Beispiel/Übung.
2. In der Sammlung: „Zuletzt abgelegt: Nr. 1 „THW Albstadt Zugtrupp Technischer Zug“ — Nummer
   auf den Zettel schreiben“; die Karte trägt „ÜBUNG“, Kopf „0 Einheiten (+1 Übung)“, „Nichts
   gezählt: die eine eingegangene Meldung ist Übung …“. Zusätzlich steht dort „Dein eigener
   Bogen „THW Albstadt Zugtrupp Technischer Zug“ ist noch offen.“
3. Link-Empfang: „Meldung von „THW Albstadt …“ empfangen — Stärke 1 / 1 / 2 // 4 · ÜBUNG. Wohin
   damit?“, Fokus auf „In „Hochwasser Echt“ aufnehmen“.

**Erwartung der Rolle:** Ein Beispiel in einer echten Lage ist fast immer ein Versehen und
sollte vorher benannt werden.

**Auswirkung im Einsatz:** Die Lagezahlen bleiben richtig (Übung zählt nicht), aber die fiktive
Einheit belegt die laufende Nummer 1 („auf den Zettel schreiben“), steht in Karten, Tabelle und
den Exporten der echten Sammlung (CSV mit Spalte „ÜBUNG“) und muss am Meldekopf von Hand
entfernt werden. Die Bezeichnung „dein eigener Bogen“ für ein Beispiel verwirrt zusätzlich.

**Empfehlung:** Beim Ablegen und beim Empfang eines Übungsbogens in eine Sammlung der Art
„Einsatz“ kurz nachfragen („Übungsbogen in den Einsatz „Hochwasser Echt“ aufnehmen? Er zählt
nicht, erhält aber eine Nummer“), Fokus auf „Abbrechen“; Beispiele im Text nicht „dein Bogen“
nennen.

**Nachprüfung:** Beispiel ablegen in Sammlung der Art Einsatz: Rückfrage nennt „Übung“ und
die Nummer, ohne Bestätigung keine Meldung.

### BB-D4 [P3] Auf der Startseite ist ein geöffnetes oder geschlossenes Beispiel nicht als Beispiel/Übung zu erkennen

**Typ:** Text/Kennzeichnung. **Kennzeichnung:** gemessen (360 × 640, Screenshot
`s3-4-start-nach-beispiel.png`).

**Fundstelle:** Startseite nach „Anzeigen“: Karte des offenen Bogens und Karte „Zuletzt
geschlossener Bogen“; Rückfragen „Beispielbogen öffnen?“, „Geschlossenen Bogen zurückholen?“.

**Beobachtung:** Die Karte „THW Albstadt Zugtrupp Technischer Zug · Einsatz 17.07.2026 –
18.07.2026 · Stärke 1 / 1 / 2 // 4“ sieht aus wie ein eigener Entwurf; kein „Beispiel“, kein
„ÜBUNG“. Gleiches für die Rückholkarte („… · 4 Personen“). Die Rückfragen nennen das Beispiel
„Der angefangene Bogen „THW Albstadt …““. Erst in der Bogenansicht steht der Störer „ÜBUNG“
und kurz „Beispielbogen geöffnet — fiktive Daten …“.

**Erwartung der Rolle:** Auf einen Blick unterscheiden, welche Karte der eigene Bogen und
welche ein Beispiel ist, gerade wenn beide gleichzeitig auf der Startseite stehen.

**Auswirkung im Einsatz:** Unter Zeitdruck tippt der Helfer „Fortsetzen“ am Beispiel oder holt
das Falsche zurück; zusammen mit BB-D1 wird unklar, welcher der zwei Bögen bei „endgültig
gelöscht“ gemeint ist.

**Empfehlung:** Übungs-/Beispielmarke auf beiden Startseitenkarten (wie das „ÜBUNG“-Abzeichen
auf den Einsatzkarten) und in den Rückfragen „Beispielbogen „…““ statt „angefangener Bogen“.

**Nachprüfung:** Beispiel anzeigen, Startseite: beide Karten unterscheidbar, Rückfragen nennen
das Beispiel als Beispiel.

## Hinweise (ohne Priorität)

Keine Beeinträchtigung der Aufgabe belegt; zur Entscheidung durch das Projekt.

- **H1 [Bedienung] „Link“ überschreibt die Zwischenablage.** Vorher eingelegter Text („WICHTIG:
  Rufnummer Einsatzleiter …“) ist nach „Link“ ersetzt durch die Bogen-URL (625 Zeichen). Das
  ist durch das ausdrückliche Antippen gedeckt und keine ungefragte Handlung. Die Quittung ist
  nur der Knopftext „Kopiert“ für rund 3 s; sie sagt weder „in die Zwischenablage“ noch, dass
  es ein Übungsbogen ist. Ob die Quittung per Screenreader angesagt wird, nicht geprüft.
- **H2 [Text] Sicherung beim Verdrängen ohne Quittung.** „… vorher als Datei sichern“ lädt
  `eeb-THW_Musterstadt-EIGEN.json` herunter (Inhalt geprüft), die Meldung danach nennt nur
  „Beispielbogen geöffnet — fiktive Daten …“, nicht Dateiname oder Ablage, und nicht, wie der
  Bogen aus der Datei zurückkommt („Aus Datei laden…“).
- **H3 [Bedienung] Offene fremde Erfassung wird verworfen, ohne Sicherungsweg.** Rückfrage
  „Die angefangene Erfassung „THW Fremdort-ERFASSUNG“ … ist noch in keiner Sammlung und wird
  verworfen“, roter Knopf, Fokus auf „Abbrechen“ — klar. Anders als beim eigenen Bogen gibt es
  hier kein „vorher sichern“ und keinen Hinweis „erst in die Sammlung übernehmen“.
- **H4 [Text] „Anzeigen“, „PDF“, „Link“ je Zeile ohne Bezug.** Die Tabelle hat 101 gleich
  benannte Knöpfe „Anzeigen“; wer mit Vorlesefunktion oder Sprachsteuerung arbeitet, hört nicht,
  welcher Bogen ersetzt wird. Außerhalb des Rollenschwerpunkts, nur erwähnt.
- **H5 [Text] „Bogen übergeben…“ am Beispiel ohne Übungshinweis im Dialog.** Der Dialog nennt
  „Dieser Bogen gehört zum Einsatz 17.07.2026 – 18.07.2026 — gilt er noch?“, aber nicht, dass
  er als Übung/Beispiel übergeben wird; der Störer steht nur auf der verdeckten Seite dahinter.
  Laut Dialogerklärung tragen die PDFs das Wasserzeichen „ÜBUNG“ (PDF-Inhalt nicht geprüft).

## Geprüft ohne Befund

- Erste Rückfrage „Beispielbogen öffnen?“ bei eigenem Entwurf: nennt den Bogen mit Namen und den
  Rückholplatz, Fokus auf „Abbrechen“, 24 px Abstand zwischen „Beispielbogen öffnen“ und
  „Abbrechen“, Knöpfe 302 × 44 px.
- Rückweg „Zuletzt geschlossenen Bogen zurückholen“ bei offenem Beispiel: tauscht, eigener
  Entwurf wieder offen, Beispiel auf dem Rückholplatz; Quittung „Bogen „THW Musterstadt-EIGEN“
  zurückgeholt.“
- Offene Einsatz-Sammlung: bleibt beim Anzeigen eines Beispiels samt Erfassungshinweis
  erhalten; eine fremde Erfassung wird nur nach roter Rückfrage verworfen (H3).
- Übungsmeldung in einer Einsatz-Sammlung: ÜBUNG-Abzeichen, nicht gezählt, eigene Zeile
  „1 Übungsmeldung nicht gezählt — anzeigen“.
- „Dies ist eine Übung“ direkt am geöffneten Beispiel abwählen: spezifische Rückfrage
  „Beispieldaten im Bogen“ mit Fokus auf „Übung beibehalten“.
- „Für neuen Einsatz vorbereiten“ am Beispiel: Rückfrage mit Folgen, „Rückgängig“, Übungsmarke
  und Beispielschutz bleiben.
- Link-Empfang eines Beispiels: Auswahl „Wohin damit?“ nennt ÜBUNG und dass „Bogen öffnen“ den
  eigenen Entwurf ersetzt (Rückholplatz).

## Nicht prüfbar / nicht geprüft

Share-Sheet (`navigator.share` fehlt im Testbrowser), native Apps, Kamera-Scan der
Beispiel-QR-Codes, Inhalt der erzeugten PDFs (Wasserzeichen), Offline-Verhalten des Dialogs,
Screenreader-Ansage der Quittung „Kopiert“, zweites Fenster mit eigenem Entwurf, voller
Speicher beim Anzeigen eines Beispiels, Doppeltipp auf „Anzeigen“ während des Ladens.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (Beispiel ansehen und zurück geht über „Zurückholen“; der
  naheliegende Weg „Beispiel schließen“ bzw. „nächstes Beispiel“ kostet den eigenen Entwurf,
  BB-D1)
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „alten Bogen endgültig löschen“ wird auf das eben angesehene
  Beispiel bezogen, gemeint ist der eigene Entwurf (BB-D1).
- **Größtes Einsatzrisiko:** Erfundene Personen und Rufnummern aus einem Beispiel gehen über
  eine Vorlage ohne Warnung als echter Einsatzbogen an den Meldekopf (BB-D2).
- **Top-Priorität für die nächste Iteration:** Ein unverändertes Beispiel nicht auf den
  Rückholplatz legen, damit es den eigenen Entwurf nie verdrängt (BB-D1).
