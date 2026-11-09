# Audit „Zerstörende Handlungen“, Beispielbögen Runde 2 (unverändertes Beispiel ohne Rückfrage, Übungsschutz, Sammelweg)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-11-09 ·
Prüfgegenstand: Live-Seite `https://erfassungsbogen.app/` (Version `v2026.1109.833`), Code-Stand
Commit `085a93b` (`main`). Nur der Bereich Beispielbögen, Schwerpunkt der Umbau aus „Stand der
Behebung“ in `../README.md`: Ein unverändertes Beispiel (`offenesBeispiel` in `src/app/app.tsx`)
wird ohne Rückfrage ersetzt oder geschlossen und belegt den Rückholplatz nicht; Rückfrage vor der
Ablage eines Übungsbogens in eine Sammlung, die keine Übung ist; neue Sammlung aus Übungsbogen mit
Art „Übung“; Sammelweg „Alle … in eine Übungs-Sammlung“; Marken BEISPIEL/ÜBUNG; Namensprüfung
beim Abwählen von „Übung“ nach Zurückholen, Musterung und „Vorlage bearbeiten“.

**Zählung: P0 0 · P1 0 · P2 3 · P3 1 · Hinweise 5** (BB2-D1 bis BB2-D4; Hinweise H1 bis H5).

**Nachprüfung Runde 1:** BB-D1 teilweise · BB-D2 behoben · BB-D3 behoben · BB-D4 teilweise.

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `../zerstoerende-handlungen.md` (Runde 1)
und `../README.md` mit „Stand der Behebung“. Zum Nachschlagen: `src/app/app.tsx`
(`beispielUnveraendert`, `darfBogenErsetzen`, `merkeVerdraengt`, `folgenFuerOffenenBogen`,
`entwurfWegwerfen`, `oeffneBeispiel`, `beispieleAlsUebung`, `bogenInSammlung`, Empfangsweg um
`darfBogenErsetzen({ titel: "Empfangenen Bogen öffnen?" … })`), `src/app/schritte/uebersicht.tsx`
(`bogenVerwerfen`), `src/app/beispiele-dialog.tsx` (`alleAlsUebung`), `src/app/beispiel-herkunft.ts`.

## Prüfaufbau

Chromium über das vorinstallierte `playwright`, `chromium.launch()` ohne Optionen, gegen die
Live-Seite. `isMobile`/`hasTouch`, Locale de-DE, Viewport 360 × 640, `deviceScaleFactor` 1, je
Szenario ein frischer Browserkontext, Zwischenablage-Rechte erteilt. Kein Eingriff ins DOM, kein
Skript in die Seite; `localStorage` nur gelesen (Rückholplatz `eeb.entwurf.ersetzt.v1`, Entwurf
`eeb.entwurf.v1`). Zustand über die Bedienung: eigener Entwurf „THW Musterstadt-EIGEN“ über „Neuen
Bogen erstellen“, Einsatz-Sammlung „Hochwasser Echt“ (Art Einsatz). Beispiele aus Ordner THW:
Zeile 1 „Albstadt“, 2 „Biberach/Riß“, 3 „Crailsheim“. Ein echter Bogen als Link („Bogen
übergeben…“ → „Link kopieren“ an einem Bogen „Echtort-FREMD“) und als Datei (`eeb-dateiort.json`,
Bogen „Dateiort-ECHT“). Skripte und Screenshots in `/tmp/claude-0/r2-zerstoerend/` (außerhalb
des Repositorys).

Durchgespielt:

1. Eigener Entwurf → drei Beispiele nacheinander → Startkarte „Bogen schließen“ (`s1.js`).
2. Unverändertes Beispiel → „Bogen schließen“ in der Gesamtübersicht; danach Beispiel → „Neuen
   Bogen erstellen“ (`s2.js`).
3. Grenzfälle „minimal geändert“ (`s3.js`): nur Schritte durchblättern; Feld „Einsatzort /
   Auftrag“ antippen und verlassen; ein Zeichen tippen und wieder löschen; „Dies ist eine Übung“
   abwählen → „Übung beibehalten“; abwählen → „Trotzdem als Einsatz“ → wieder anhaken. Jeweils
   danach das nächste Beispiel.
4. Beispiel wirklich geändert bzw. Beispiel offen + Neuladen → nächstes Beispiel (`s4.js`).
5. Beispiel offen + Link eines echten Bogens, einmal im selben Tab, einmal in neuem Tab
   (`s9.js`); Beispiel offen + „Aus Datei laden…“ (`s10.js`).
6. Eigener Entwurf + mehrere Beispiele + „Zurückholen“; geändertes Beispiel zurückholen und
   „Übung“ abwählen (`s11.js`).
7. Beispiel → „In Einsatz-Sammlung ablegen…“ → „Hochwasser Echt“: Rückfrage, Abbrechen, Trotzdem;
   „Neue Sammlung anlegen…“ aus dem Übungsbogen (`s5.js`).
8. „Alle 101 in eine Übungs-Sammlung“ zweimal nacheinander (`s6.js`).
9. Beispiel → „Als Vorlage speichern“ → schließen → Vorlagenkarte → „Einsatz vorbereiten“ →
   Musterung → „Übung“ abwählen; „Bearbeiten“ (Vorlage) → „Übung“ abwählen (`s7.js`).
10. Beispiel-Link empfangen (frischer Kontext, mit Einsatz-Sammlung bzw. eigenem Entwurf) →
    „aufnehmen“ bzw. „Meldung öffnen“ → „Übung“ abwählen (`s12.js`, `s13.js`).
11. Hinweise H1, H2, H4, H5 aus Runde 1 (`s14.js`).

## Annahmen

- Die Live-Version `v2026.1109.833` entspricht `main` Commit `085a93b`; lokal bauen ging nicht.
- Auf Telefonen öffnet ein angetippter Link aus Messenger oder Mail die App meist in einem neuen
  Tab bzw. startet sie neu; ebenso verwirft das Betriebssystem Hintergrund-Tabs. Für die App ist
  das ein Neuladen. Grundlage für BB2-D2.
- Wer ein Beispiel als Ausgangspunkt für den eigenen Bogen nimmt, ändert es (Fall „geändert“). Wer
  nur nachsieht, ändert nichts. Beides ist plausibel.

## Urteil

Der Kern von Runde 1 ist behoben und hält den Grenzfällen stand: Ein unverändertes Beispiel wird
vom nächsten Beispiel, von „Neuen Bogen erstellen“, von einem Link im selben Tab und von „Aus Datei
laden…“ ohne Rückfrage ersetzt, und der eigene Entwurf bleibt auf dem Rückholplatz. Auch
Durchblättern, Antippen eines Feldes, Tippen und Löschen und das Hin- und Herschalten von „Übung“
gelten zu Recht als unverändert. Die Startkarte sagt „BEISPIEL“, „Bogen schließen“ dort schließt
still mit klarer Quittung. Die Rückfrage vor der Ablage in eine echte Sammlung nennt Übung und
Nummer, der Fokus liegt auf „Abbrechen“. Die Namensprüfung beim Abwählen von „Übung“ greift nach
Vorlage, Musterung, „Vorlage bearbeiten“ und Zurückholen.

Reibung bleibt an den Rändern. Erstens droht „Bogen schließen“ in der Gesamtübersicht am
unveränderten Beispiel rot mit dem endgültigen Löschen des eigenen Bogens, obwohl gar nichts
gelöscht wird (BB2-D1). Zweitens ist die Erkennung nur im Arbeitsspeicher: Nach einem Neuladen,
und damit auch beim Öffnen eines echten Links in neuem Tab, ist die Falle aus Runde 1 mit
demselben Wortlaut wieder da (BB2-D2). Drittens lässt ein per Link oder QR-Code empfangenes Beispiel
„Übung“ ohne Namensprüfung abwählen (BB2-D3). Der Sammelweg legt bei jedem Tipp eine weitere,
gleichnamige Sammlung an (BB2-D4). Die Aufgabe „Beispiele ansehen und zum eigenen Bogen zurück“
gelingt ohne fremde Hilfe.

## Nachprüfung Runde 1

### BB-D1 [P1] Zweites Beispiel / „Beispiel schließen“ löscht den eigenen Entwurf vom Rückholplatz: **teilweise**

- Behoben, gemessen: Eigener Entwurf → Albstadt (Rückfrage wie bisher, Fokus „Abbrechen“) →
  Biberach/Riß → Crailsheim ohne Rückfrage; Rückholplatz nach jedem Schritt „Musterstadt-EIGEN“.
  Meldung nach „Anzeigen“: „Solange du nichts änderst, ersetzt das nächste Beispiel ihn ohne
  Rückfrage. Dein eigener Bogen „THW Musterstadt-EIGEN“ liegt auf der Startseite …“.
  Startkarte „Bogen schließen“ am Beispiel: keine Rückfrage, Quittung „Beispielbogen geschlossen —
  er liegt weiter unter „Beispielbögen“ bereit. Dein eigener Bogen … liegt …“, Rückholplatz
  unverändert. „Neuen Bogen erstellen“ bei offenem Beispiel: keine Rückfrage, eigener Entwurf
  bleibt. „Zurückholen“ bei offenem Beispiel: ohne Rückfrage, eigener Entwurf offen.
- Grenzfälle „minimal geändert“ (Durchblättern, Feld antippen, Zeichen tippen und löschen, Übung
  ab und wieder an, „Übung beibehalten“): jeweils weiter „BEISPIEL“, nächstes Beispiel ohne
  Rückfrage.
- Offen: Gesamtübersicht „Bogen schließen“ warnt fälschlich (BB2-D1); nach Neuladen oder neuem
  Tab und nach einer echten Änderung gilt der Wortlaut aus Runde 1 unverändert („Der angefangene
  Bogen „THW Albstadt …““, „alten Bogen endgültig löschen“), siehe BB2-D2.

### BB-D2 [P2] Übungsschutz geht über Vorlage und Schließen/Zurückholen verloren: **behoben**

- Gemessen: Beispiel → „Als Vorlage speichern“ → schließen → Vorlagenkarte trägt „ÜBUNG“ →
  „Einsatz vorbereiten“ → „Ja, alle sind da“ → „Dies ist eine Übung“ abwählen: Rückfrage
  „Beispieldaten im Bogen — 4 Personen („Lang, Sabine“, „Sommer, Sandra“ …) und 2 Rufnummern …“,
  Fokus „Übung beibehalten“. Ebenso nach „Bearbeiten“ an der Vorlage und nach Zurückholen eines
  geänderten Beispiels.
- Rest ohne Priorität: Musterung ohne Übungs-/Beispielmarke, „Als Vorlage speichern“ ohne Hinweis
  auf Beispieldaten (H5). Eine neue Lücke auf dem Empfangsweg: BB2-D3.

### BB-D3 [P3] Beispielbogen landet mit einem Tipp in einer echten Einsatz-Sammlung: **behoben**

- Gemessen: „In Einsatz-Sammlung ablegen…“ → „Hochwasser Echt“: Rückfrage „Übungsbogen in diese
  Sammlung? — „THW Albstadt …“ ist als ÜBUNG gekennzeichnet. In „Hochwasser Echt“ zählt er nicht in
  die Lage, bekommt aber eine Nummer. Für Übungen gibt es Sammlungen der Art „Übung“.“, Knöpfe
  „Trotzdem ablegen“ / „Abbrechen“ (Fokus), 24 px Abstand. Abbrechen: „… nicht aufgenommen.“
  Ebenso nach Link-Empfang und „In „Hochwasser Echt“ aufnehmen“.
- „Neue Sammlung anlegen…“ aus dem Übungsbogen: Art „Übung“ vorbelegt.
- Kiosk-Scan nicht prüfbar (Kamera). Laut Code (`bogenInSammlung`, `kiosk`) dort keine Rückfrage,
  nur der Quittungssatz „Achtung: als ÜBUNG gekennzeichnet — zählt nicht in die Lage.“
- Rest ohne Priorität: „Dein Bogen“ für das Beispiel im Ablagedialog und in der Sammlung (H4).

### BB-D4 [P3] Beispiel auf der Startseite nicht als Beispiel/Übung erkennbar: **teilweise**

- Behoben: Offene Karte „THW Albstadt Zugtrupp Technischer Zug BEISPIEL“; geändert bzw. auf dem
  Rückholplatz „ÜBUNG“; Vorlagenkarte „ÜBUNG“.
- Offen: Die Rückfragen nennen ein geändertes oder neu geladenes Beispiel weiter „Der angefangene
  Bogen „THW Albstadt …““, die Meldung danach „Dein eigener Bogen „THW Albstadt …““ (BB2-D2). Nach
  Neuladen wechselt die Marke ohne Änderung von „BEISPIEL“ auf „ÜBUNG“. Musterung ohne Marke (H5).

### Hinweise aus Runde 1

- H1 „Link“ überschreibt die Zwischenablage, Quittung nur „Kopiert“: offen, unverändert.
- H2 Sicherung beim Verdrängen ohne Quittung: offen. Download `eeb-THW_Musterstadt-EIGEN.json`
  gemessen; die Meldung danach nennt die Datei nicht und bezeichnet das Beispiel als „Dein eigener
  Bogen“ (in BB2-D2 aufgenommen).
- H3 fremde Erfassung ohne Sicherungsweg: nicht erneut geprüft.
- H4 „Anzeigen“/„PDF“/„Link“ ohne Bezug: offen (kein `aria-label`, keine Beschreibung).
- H5 „Bogen übergeben…“ am Beispiel ohne Übungshinweis im Dialog: offen.

## Neue Befunde

### BB2-D1 [P2] „Bogen schließen“ in der Gesamtübersicht droht am unveränderten Beispiel rot mit dem Löschen des eigenen Bogens

**Typ:** Text/Bedienung (falsche Verlustwarnung). **Kennzeichnung:** gemessen (360 × 640,
Screenshot `s2-uebersicht-schliessen.png`).

**Fundstelle:** Unverändertes Beispiel offen, eigener Entwurf auf dem Rückholplatz → Bogenansicht
„Gesamtübersicht“ → „Bogen schließen“. Code: `uebersicht.tsx` `bogenVerwerfen` holt den Satz aus
`schliessenFolgen` = `folgenFuerOffenenBogen()`, das `beispielUnveraendert` nicht kennt; der
Startseitenweg `entwurfWegwerfen` kennt es.

**Beobachtung:** Rückfrage „Bogen schließen? — Der Bogen wird geschlossen, nicht gelöscht. Der
Bogen „THW Musterstadt-EIGEN“ (Stand 09.11.26, 08:45 Uhr) auf dem Platz „Zuletzt geschlossener
Bogen“ wird dabei endgültig gelöscht: Er fasst nur einen Bogen. Nur der jetzt ersetzte Stand
bleibt auf der Startseite unter „Zuletzt geschlossenen Bogen zurückholen“ erreichbar.“ Knopf
„Schließen, zur Startseite“ rot, Fokus „Abbrechen“. Nach Bestätigung liegt der eigene Entwurf
**unverändert** auf dem Rückholplatz, das Beispiel ist nicht dort; beide Sätze stimmen also nicht.
Danach keine Quittung (auf dem Startseitenweg: „Beispielbogen geschlossen — …“). Derselbe Knopf
auf der Startkarte schließt ohne Rückfrage.

**Erwartung der Rolle:** Derselbe Knopf „Bogen schließen“ sagt überall dasselbe, und eine rote
Warnung bedeutet, dass wirklich etwas verloren geht.

**Auswirkung im Einsatz:** Wer vom Beispiel zurück zum eigenen Bogen will und den naheliegenden
Knopf im Bogen nimmt, liest, dass genau sein Bogen gelöscht wird. Er bricht ab und sucht einen
Umweg, oder er bestätigt und hält den eigenen Bogen für verloren und erfasst ihn neu. Schwerer
wiegt die Gewöhnung: Wer einmal erlebt, dass „endgültig gelöscht“ nicht stimmte, klickt die
nächste, echte Warnung (BB2-D2) eher weg.

**Empfehlung:** Am unveränderten Beispiel aus der Gesamtübersicht genauso wie von der Startkarte
schließen: ohne Rückfrage oder mit dem Satz „Beispielbogen schließen — er liegt weiter unter
„Beispielbögen“ bereit; dein Bogen „…“ bleibt zurückholbar“, nicht rot, mit derselben Quittung.

**Nachprüfung:** Eigener Entwurf, Beispiel anzeigen, in der Gesamtübersicht „Bogen schließen“:
keine Rückfrage mit „endgültig gelöscht“, Quittung nennt den wartenden eigenen Bogen.

### BB2-D2 [P2] Nach Neuladen, in neuem Tab oder nach einer Änderung steht die Falle aus Runde 1 mit unverändertem Wortlaut wieder da

**Typ:** Bedienung/Text (Datenverlust mit Warnung, missverständliche Knopfbeschriftung).
**Kennzeichnung:** gemessen (360 × 640, `s4.js`, `s9.js`, `s14.js`).

**Fundstelle:** Beispiel offen, eigener Entwurf auf dem Rückholplatz, dann (a) Seite neu laden →
nächstes Beispiel; (b) Link eines echten Bogens in neuem Tab öffnen; (c) im Beispiel ein Feld
wirklich ändern → nächstes Beispiel. `offenesBeispiel` ist nur ein `useRef`.

**Beobachtung:**
1. (a) Nach Neuladen: Startkarte „THW Albstadt Zugtrupp Technischer Zug ÜBUNG — Entwurf vom
   09.11.26, 08:52 Uhr wiederhergestellt“ (vorher „BEISPIEL“, nichts geändert). Nächstes Beispiel:
   „Beispielbogen öffnen? — Der angefangene Bogen „THW Albstadt …“ wird durch den Beispielbogen
   ersetzt. Der Bogen „THW Musterstadt-EIGEN“ … wird dabei endgültig gelöscht …“, Knöpfe
   „… den alten Bogen vorher als Datei sichern“ (primär), „… alten Bogen endgültig löschen“
   (rot), „Abbrechen“ (Fokus). Nach „endgültig löschen“ liegt das unveränderte Beispiel auf dem
   Rückholplatz, der eigene Entwurf ist weg.
2. (b) Echter Link in neuem Tab: dieselbe Rückfrage als „Empfangenen Bogen öffnen?“ mit „Meldung
   öffnen — alten Bogen endgültig löschen“. Im selben Tab (Sprung nur im `#`) dagegen ohne
   Rückfrage, eigener Entwurf bleibt.
3. (c) Nach Änderung von „Einsatzort / Auftrag“: Startkarte „ÜBUNG“, dieselbe Rückfrage. Das ist
   gewollt, aber Wortlaut und Knopf sind die aus Runde 1.
4. In allen drei Fällen sagt die Meldung danach: „Dein eigener Bogen „THW Albstadt Zugtrupp
   Technischer Zug“ liegt auf der Startseite unter „Zuletzt geschlossenen Bogen zurückholen“.“
   Auch nach „vorher als Datei sichern“: Der eigene Bogen steckt dann nur in der Datei
   `eeb-THW_Musterstadt-EIGEN.json`, die Meldung nennt die Datei nicht.

**Erwartung der Rolle:** Ein Beispiel bleibt ein Beispiel, auch nach einem Neustart der App. Wenn
schon gefragt wird, dann mit dem Namen des Bogens, der verloren geht, und „dein eigener Bogen“ ist
der eigene, nicht das Beispiel.

**Auswirkung im Einsatz:** Telefon kurz weggelegt, App aus dem Hintergrund neu geladen, oder ein
Kamerad schickt einen Link: Schon ist der Zustand aus Runde 1 zurück, mit dem Knopf „alten Bogen
endgültig löschen“, den man auf das Beispiel bezieht. Der eigene Bogen geht verloren. Danach
behauptet die App, „dein eigener Bogen“ liege auf der Startseite, und dort liegt das Beispiel.
Gemildert: Die Rückfrage nennt den eigenen Bogen mit Namen, der sichere Weg „vorher als Datei
sichern“ ist der Primärknopf, der Fokus liegt auf „Abbrechen“. Deshalb P2 statt P1.

**Empfehlung:** Die Herkunft „unverändertes Beispiel“ mit dem Entwurf speichern (etwa als
Prüfsumme oder Marke neben dem Entwurf), damit Neuladen und neuer Tab sie nicht verlieren. In der
Rückfrage den Verlust-Knopf mit dem Namen beschriften („„THW Musterstadt-EIGEN“ endgültig
löschen“) und das Beispiel „Beispielbogen „…“ (geändert)“ nennen statt „angefangener Bogen“.
„Dein eigener Bogen“ nur für einen Bogen sagen, der nicht aus einem Beispiel stammt; nach
„sichern“ den Dateinamen nennen.

**Nachprüfung:** Eigener Entwurf, Beispiel anzeigen, Seite neu laden, nächstes Beispiel: keine
Rückfrage, eigener Entwurf zurückholbar. Echter Link in neuem Tab: ebenso. Geändertes Beispiel:
Rückfrage nennt im Verlust-Knopf den Namen des eigenen Bogens.

### BB2-D3 [P2] Per Link oder QR-Code empfangenes Beispiel: „Übung“ lässt sich ohne Namensprüfung abwählen

**Typ:** Bedienung (Kennzeichnung geht verloren, fiktive Daten werden zu echten).
**Kennzeichnung:** gemessen (Link-Weg, `s13.js`); QR-Scan nach Code gleich (derselbe Empfangsweg,
kein `beispielMerken`), nicht gemessen.

**Fundstelle:** „Link“ im Dialog „Beispielbögen“ → Link auf anderem Gerät öffnen → „Empfangenen
Bogen öffnen?“ → „Meldung öffnen“ → Schritt 2 „Dies ist eine Übung“ abwählen. Code: Der
Empfangsweg in `app.tsx` setzt den Bogen ohne `beispielMerken`, anders als Datei, Vorlage,
Musterung und Zurückholen.

**Beobachtung:** Der Bogen öffnet mit „Empfangener Übungsbogen: Zum Melden am Meldekopf „Bogen
übergeben…“ …“. Abwählen von „Dies ist eine Übung“: **keine** Rückfrage, Haken weg. Startkarte
danach „THW Albstadt Zugtrupp Technischer Zug“ ohne jede Marke, Personal „Lang, Sabine“ usw. mit
Rufnummern bleibt. Der Speicher enthält keinen Eintrag `eeb.beispiel-herkunft.v1`. Gegenprobe:
Dasselbe Beispiel über „Anzeigen“ fragt „Beispieldaten im Bogen“.

**Erwartung der Rolle:** Ein Beispiel ist ein Beispiel, egal ob ich es selbst angezeigt oder vom
Ausbilder als Link bekommen habe.

**Auswirkung im Einsatz:** Gerade der Link-Weg ist für Übungen gedacht (README Nr. 15: Teilnehmer
bekommen das Beispiel per Link). Ein Teilnehmer, der den Bogen danach als Grundlage für den echten
Einsatz nimmt und nur „Übung“ abwählt, schickt erfundene Namen und Nummern als Einsatzbogen an den
Meldekopf, ohne die Warnung, die alle anderen Wege jetzt zeigen.

**Empfehlung:** Beim Öffnen eines empfangenen Bogens mit Übungsmarke die Namen und Nummern genauso
merken wie beim Öffnen aus einer Datei.

**Nachprüfung:** Beispiel-Link in frischem Browser öffnen, „Meldung öffnen“, „Übung“ abwählen:
Rückfrage „Beispieldaten im Bogen“ erscheint. Ebenso nach Scan des QR-Codes einer Beispiel-PDF.

### BB2-D4 [P3] „Alle … in eine Übungs-Sammlung“ legt bei jedem Tipp eine weitere gleichnamige Sammlung an

**Typ:** Bedienung (Doppelung, Speicherverbrauch). **Kennzeichnung:** gemessen (360 × 640,
`s6.js`, Screenshot `s6-start-zwei-uebungen.png`).

**Fundstelle:** Dialog „Beispielbögen“ → Ordner THW → „Alle 101 in eine Übungs-Sammlung“, zweimal.

**Beobachtung:** Jeder Tipp legt ohne Rückfrage eine neue Sammlung an und öffnet sie (rund 5 s
beim ersten, beim zweiten Mal sofort). Danach stehen auf der Startseite zwei Sammlungen mit
demselben Namen „Übung: THW“, je 101 Einheiten. Die Einsatz-Sammlungen belegen danach
644 363 Zeichen im Speicher (`eeb.einsaetze.v1`), also rund 320 000 Zeichen je Durchgang. Ein
Hinweis „gibt es schon“ kommt nicht. Der eigene Entwurf bleibt unberührt.

**Erwartung der Rolle:** Ein zweiter Tipp öffnet die schon angelegte Übung oder fragt, ob eine
zweite gewollt ist.

**Auswirkung im Einsatz:** Wer in der Ausbildung den Knopf zweimal nimmt (aus dem Ordner zurück,
noch einmal versucht), hat zwei gleich benannte Sammlungen und weiß nicht, in welche er weiter
aufnimmt oder welche er weitergibt. Mit jedem Durchgang füllt sich der Gerätespeicher, den
Entwurf und echte Sammlungen brauchen; aufräumen geht nur über „Löschen…“ an jeder Sammlung.

**Empfehlung:** Gibt es schon eine Sammlung aus diesem Ordner, sie öffnen oder kurz fragen
(„„Übung: THW“ gibt es schon — öffnen oder eine zweite anlegen?“); eine zweite mit Datum oder
Nummer im Namen unterscheidbar machen.

**Nachprüfung:** Zweimal „Alle … in eine Übungs-Sammlung“ im selben Ordner: keine zweite
gleichnamige Sammlung ohne Rückfrage.

## Hinweise (ohne Priorität)

- **H1 [Bedienung] Nach „Abbrechen“ der Übungsrückfrage bleibt die Sammlungsauswahl offen, Fokus
  auf der Einsatz-Sammlung.** Ein zweiter Tipp oder Enter auf derselben Stelle stellt die Frage
  erneut, mehr nicht. Die Quittung „… nicht aufgenommen.“ steht verdeckt dahinter.
- **H2 [Bedienung] Link-Empfang eines Übungsbogens: „Wohin damit?“ hat den Fokus auf „In
  „Hochwasser Echt“ aufnehmen“ (Art Einsatz).** Die folgende Übungsrückfrage fängt das ab; der
  erste Dialog könnte bei ÜBUNG schon „Abbrechen“ fokussieren oder auf Übungs-Sammlungen
  hinweisen.
- **H3 [Text] Neue Sammlung aus Übungsbogen:** Art „Übung“ ist vorbelegt, Titel und Knopf sagen
  aber „Neue Einsatz-Sammlung anlegen“ / „Einsatz anlegen“, Beispielname „Hochwasser Weser“.
- **H4 [Text] Das Beispiel heißt weiter „dein Bogen“.** Ablagedialog „Dein Bogen wird als Meldung
  abgelegt …“, Sammlung „Dein eigener Bogen „THW Albstadt …“ ist noch offen.“ (Rest von BB-D3).
- **H5 [Kennzeichnung] Musterung und „Als Vorlage speichern“ ohne Beispielhinweis.** Die Musterung
  einer Vorlage aus einem Beispiel zeigt kein „ÜBUNG“/„Beispiel“; „Als Vorlage speichern“ am
  Beispiel speichert ohne Hinweis auf erfundene Namen. Die Namensprüfung greift später (BB-D2).

## Geprüft ohne Befund

- Unverändertes Beispiel ersetzt durch nächstes Beispiel, „Neuen Bogen erstellen“, Link im selben
  Tab, „Aus Datei laden…“: keine Rückfrage, eigener Entwurf bleibt auf dem Rückholplatz, Meldung
  nennt ihn.
- „Minimal geändert“: Durchblättern, Feld antippen, Zeichen tippen und löschen, Übung ab/an,
  „Übung beibehalten“: bleibt „BEISPIEL“.
- Startkarte „Bogen schließen“ am Beispiel: still, mit klarer Quittung.
- „Zurückholen“ bei unverändertem Beispiel ohne Rückfrage; bei geändertem Beispiel Tausch mit
  Rückfrage, Fokus „Abbrechen“; „Übung“-Abwählen danach mit Namensprüfung.
- Übungsrückfrage vor Ablage in echte Sammlung (Wortlaut, Fokus, Abstand), auch nach Link-Empfang.
- Sammelweg: eigener Entwurf bleibt unberührt, Quittung „Dein eigener Bogen … ist noch offen“.
- Marken: „BEISPIEL“ (offen, unverändert), „ÜBUNG“ (geändert, Rückholplatz, Vorlage).

## Nicht prüfbar / nicht geprüft

Kiosk-Scan und QR-Scan mit Kamera (nur nach Code bewertet), Share-Sheet, native Apps, zweites
Fenster mit eigenem Entwurf bei offenem Beispiel, voller Speicher während des Sammelwegs,
Löschen der doppelten Sammlungen, Screenreader-Ansagen, Hinweis H3 aus Runde 1.

## Abschluss

- **Aufgabe geschafft:** ja (Beispiele ansehen und zurück geht jetzt auch über „nächstes
  Beispiel“ und Startkarte „Bogen schließen“; Umweg nötig nur beim Schließen aus der
  Gesamtübersicht, BB2-D1)
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Bogen schließen“ im Beispiel kündigt rot das Löschen des eigenen
  Bogens an, das gar nicht passiert (BB2-D1).
- **Größtes Einsatzrisiko:** Nach Neuladen oder einem Link in neuem Tab ist das Beispiel wieder
  ein „angefangener Bogen“, und „alten Bogen endgültig löschen“ kostet den eigenen Entwurf
  (BB2-D2).
- **Top-Priorität für die nächste Iteration:** Die Herkunft „unverändertes Beispiel“ mit dem
  Entwurf speichern, damit sie Neuladen und neuen Tab übersteht (BB2-D2).
