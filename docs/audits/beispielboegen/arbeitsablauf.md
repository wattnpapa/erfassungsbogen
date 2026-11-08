# Prüfbericht Schwerpunkt Beispielbögen: Arbeitsablauf

- **Prüfer:** Rolle „Arbeitsablauf“ (thw-workflow-reviewer). Ich spiele drei Personen nacheinander: den Ausbilder, der eine Übung vorbereitet, den Teilnehmer, der eine Einheit spielt, und den Meldekopf, der die Bögen aufnimmt.
- **Datum:** 2026-11-08
- **Prüfgegenstand:** Nur der Bereich Beispielbögen auf der Live-Seite `https://erfassungsbogen.app/`, Stand `main` Commit `0dd56d4` (Fußzeile `v2026.1108.2056`). Geprüft sind der Abschnitt „Beispielbögen“ auf der Startseite mit dem Knopf „Beispielbögen ansehen“, der Dialog „Beispielbögen“ (Erklärung, Register, Pfadleiste, tiefe Ordner, Tabelle und Karten, Ladezustand) und alles, was danach kommt: „Anzeigen“, „PDF“ und „Link“. Dazu die Folgeschritte Vorlage, Einsatz-Sammlung und Rückweg.
- **Code zum Nachschlagen (nicht geändert):** `src/app/fusszeile.tsx` (Dialog, `beispielAnsehen`, `beispielHolen`, `beispielLinkHolen`, `beispieleOeffnen`), `src/app/app.tsx` (`BeispielboegenStart`, `oeffneBeispiel`), Stile in `index.html`.
- **Maßstab:** Der ganze Ablauf zählt mehr als der einzelne Bildschirm. Je Ursache gibt es einen Befund. Geschmacksfragen stehen unter den Hinweisen.
- **Zählung:** P0: 0 · P1: 2 · P2: 4 · P3: 4 · Hinweise (ohne Priorität): 6

## Prüfaufbau

- Playwright (`require('playwright')`, `chromium.launch()` ohne Optionen), Locale de-DE, `deviceScaleFactor` 1, `hasTouch`. Für 360 × 640 zusätzlich `isMobile`. Jeder Lauf startet mit einem frischen Profil gegen die Live-Seite. Skripte und Bildschirmfotos liegen in `/tmp/claude-0/audit-ablauf/`.
- Viewports: 360 × 640 (Hauptlauf) und 820 × 1180 (Tablet: Ausbilder am Schreibtisch, Meldekopf).
- Durchgespielte Abläufe:
  1. **Übungsvorbereitung.** Startseite › „Beispielbögen ansehen“ › THW › Alle Einheiten aller Ortsverbände › Bayern › RSt Bad Tölz › OV Bad Aibling. Dort drei Bögen als PDF geladen und einen Link kopiert.
  2. **Teilnehmer.** Den kopierten Link in einem zweiten, leeren Profil geöffnet.
  3. **Meldekopf.** „Neue Einsatz-Sammlung…“ mit Art „Übung“, dann die drei PDFs über „Bögen einlesen…“ aufgenommen. Dasselbe mit vier PDFs aus „Praktische Ausbildung › Einlagen Kräfte Hannover“. Dazu der Weg über „Anzeigen“ › „In Einsatz-Sammlung ablegen…“ in eine Sammlung mit der Vorgabe „Einsatz“.
  4. **Durchblättern.** Mehrere Beispiele nacheinander mit „Anzeigen“ geöffnet, einmal ohne und einmal mit eigenem angefangenem Bogen („THW Musterstadt“).
  5. **Beispiel als Ausgangspunkt.** „Anzeigen“ › „Als Vorlage speichern“ › Bogen schließen › Vorlage › „Bogen anlegen“.
  6. **Rückweg.** Nach „Anzeigen“ zurück zu den Beispielen, über „‹ Startseite“ und über die Zurück-Taste des Browsers.
  7. **Register.** Alle Ordner außer „THW › Alle Einheiten“ automatisch durchlaufen und nach Zeilen mit gleicher Einheit und Herkunft gesucht.
- Die Seite wurde nicht verändert: kein `addScriptTag`, keine DOM-Eingriffe. Gelesen wurde nur über `innerText`, `boundingBox` und `elementFromPoint`, die Zwischenablage über `navigator.clipboard.readText()` mit erteilter Berechtigung.

## Annahmen

- **A1 (Ablauf, Annahme):** Für eine Meldekopf-Übung sucht der Ausbilder vorab passende Bögen aus, zum Beispiel einen Zug oder die Einheiten einer Region. Er gibt sie den Teilnehmern als Ausdruck oder Link. Die Teilnehmer melden sich damit am Meldekopf, und dort wird gescannt oder eingelesen. Am Ende soll die Lage stimmen, also Einheitenzahl und Stärke. Eine THW-Vorschrift dazu kenne ich nicht.
- **A2:** Wer einen Beispielbogen als Ausgangspunkt nimmt, will daraus seinen eigenen Bogen oder eine Vorlage seiner Einheit machen und die fiktiven Namen ersetzen.
- **A3:** Die Rangfolge „echter eigener Bogen vor Beispielbogen“ ist für den Nutzer selbstverständlich. Ein Beispiel lässt sich jederzeit neu laden, der eigene Entwurf nicht.

## Nicht prüfbar

- Das echte Share-Sheet (App, iOS/Android). Headless gab es nur den Weg über die Zwischenablage („Kopiert“).
- Kamera-Scan eines gedruckten Beispiel-PDFs. Ersatzweise habe ich die PDF-Datei über „Bögen einlesen…“ aufgenommen.
- Ausdruck und Lesbarkeit des Wasserzeichens auf Papier. Der Text „ÜBUNG — Dieser Bogen beschreibt keinen echten Einsatz.“ steht im PDF (geprüft mit `pdftotext`).
- Beispielbögen ohne Netz (zweite Stufe des Offline-Vorrats). Native Builds.

## Urteil aus Sicht der Rolle

Der Einstieg ist gut zu finden, wenn man bis zum Abschnitt scrollt. Danach lassen sich die Ordner gut durchgehen: Die Pfadleiste mit „‹ Zurück“ und anklickbaren Ebenen funktioniert, die Bogenzahlen stimmen, und der Ladezustand („Angaben werden geladen … 21 von 101“) ist ehrlich. Der kürzeste brauchbare Übungsweg funktioniert ohne fremde Hilfe: einzeln „PDF“ laden, dann in der Einsatz-Sammlung „Bögen einlesen…“ mit allen Dateien. Aus drei Bögen von OV Bad Aibling wurden drei Einheiten mit „ÜBUNG“-Kennung.

Sobald man mehr als einen Bogen braucht, wird es mühsam:

- Wer Beispiele nacheinander mit „Anzeigen“ ansieht, verdrängt beim zweiten Mal seinen eigenen angefangenen Bogen. Er muss dann zwischen „vorher sichern“ und „endgültig löschen“ wählen, obwohl er nur fiktive Bögen angeschaut hat (BB-W1).
- Im Ordner „Praktische Ausbildung“, also genau dort, wo man Übungsmaterial sucht, laufen vier verschiedene Bögen am Meldekopf still zu einer Einheit zusammen. Die Lage zeigt dann 6 statt 27 Helfer (BB-W2).
- Nach „Anzeigen“ führt kein Weg zurück an die Stelle im Register (BB-W3). Ein Sammelweg für einen ganzen Ordner fehlt (BB-W4).
- Alle Beispiele tragen vergangene Zeiträume, deshalb ist eine damit gefüllte Übungslage voller Warnungen (BB-W5).

## Befunde

### BB-W1 [P1] Typ Daten/Verlust: Beim Durchblättern mehrerer Beispiele wird der eigene angefangene Bogen verdrängt, ab dem zweiten Beispiel bis zum „endgültig löschen“

- **Fundstelle:** Dialog „Beispielbögen“ › Tabelle › „Anzeigen“, zweimal hintereinander (dazwischen „‹ Startseite“ › „Beispielbögen ansehen“). 360 × 640 und 820 × 1180. Code: `oeffneBeispiel` mit `darfBogenErsetzen` in `src/app/app.tsx`.
- **Beobachtung:**
  - Mit eigenem Entwurf „THW Musterstadt“ fragt das erste „Anzeigen“: „Der angefangene Bogen „THW Musterstadt“ wird durch den Beispielbogen ersetzt. Der Stand bleibt auf der Startseite unter „Zuletzt geschlossenen Bogen zurückholen“ erreichbar.“ Das ist richtig und klar.
  - Beim zweiten „Anzeigen“ heißt der **unveränderte Beispielbogen** plötzlich „Der angefangene Bogen „DRK-Kreisverband Moorlande e. V. Betreuungsgruppe (Bereitschaft, BT-Kombi)““. Weiter steht dort: „Der Bogen „THW Musterstadt“ … auf dem Platz „Zuletzt geschlossener Bogen“ wird dabei endgültig gelöscht: Er fasst nur einen Bogen.“ Zur Wahl stehen „Beispielbogen öffnen — den alten Bogen vorher als Datei sichern“, „Beispielbogen öffnen — alten Bogen endgültig löschen“ und „Abbrechen“.
  - Ohne eigenen Bogen fragt schon das zweite Beispiel nach („Der angefangene Bogen „DRK … BT-Kombi“ wird … ersetzt“). Beim dritten kommt die „endgültig gelöscht“-Rückfrage für das erste Beispiel, das niemand angefasst hat.
  - Einen Weg, ein Beispiel nur anzusehen, ohne dass es „mein Bogen“ wird, gibt es nicht. „PDF“ ist die einzige Alternative.
- **Folge:** Ein Ausbilder, der vier oder fünf Bögen vergleicht, um passende für seine Übung zu finden, bekommt ab dem zweiten Bogen Rückfragen, die nach Datenverlust klingen. Spätestens beim dritten muss er über seinen echten Entwurf entscheiden. Unter Zeitdruck drückt man die Variante „endgültig löschen“, weil man ja nur Beispiele ansieht, und der Entwurf der eigenen Einheit ist weg. Gleichzeitig belegt ein beliebig neu ladbares fiktives Beispiel den einzigen Rückholplatz.
- **Empfehlung:** Ein unverändertes Beispiel nicht als „angefangenen Bogen“ behandeln. Es sollte ohne Rückfrage ersetzt werden und weder den Rückholplatz belegen noch einen echten Entwurf von dort verdrängen. Erst eine Änderung am Beispiel macht es zu einem eigenen Bogen. Alternativ „Anzeigen“ als reine Ansicht neben dem eigenen Bogen öffnen, mit „Zurück zu den Beispielbögen“.
- **Nachprüfung:** Eigenen Entwurf anlegen, dann drei Beispiele nacheinander mit „Anzeigen“ öffnen. Höchstens beim ersten kommt eine Rückfrage. Danach liegt „THW Musterstadt“ weiter unter „Zuletzt geschlossenen Bogen zurückholen“, und keine Rückfrage enthält „endgültig“.

### BB-W2 [P1] Typ Daten/Inhalt: „Praktische Ausbildung › Einlagen Kräfte Hannover“: vier verschiedene Bögen werden am Meldekopf zu einer Einheit zusammengelegt

- **Fundstelle:** Dialog › „Praktische Ausbildung“ › „Einlagen Kräfte Hannover“ (23 Bögen), Zeilen 1 bis 4. Danach Einsatz-Sammlung (Art „Übung“) › „Bögen einlesen…“. 820 × 1180.
- **Beobachtung:**
  - Die ersten vier Zeilen heißen alle „2. Einsatzzug Landeshauptstadt Hannover · Hannover-Wasserturm · Johanniter (JUH)“, mit Stärke 1/1/2//4, 0/1/7//8, 0/1/8//9 und 0/1/5//6. Nur die Dateinamen zeigen, was gemeint ist: `01-2-einsatzzug-zugtrupp.pdf`, `02-2-einsatzzug-1-sanitaetsgruppe.pdf`, `03-…-2-sanitaetsgruppe.pdf`, `04-…-betreuungsgruppe.pdf`. Auch im geöffneten Bogen steht als Einheitstyp nur „2. Einsatzzug Landeshauptstadt Hannover“.
  - Nach dem Einlesen der vier PDFs meldet die Sammlung „4 Bögen aufgenommen“, zählt aber „1 EINHEITEN … 6 GESAMT“. Die Karte lautet „Nr. 1 … 2. Einsatzzug Landeshauptstadt Hannover ÜBUNG neue Fassung“, und unter „Neu seit dem letzten Mal (1)“ steht „Folgemeldung 21:19: Stärke 9 → 6 (−3)“.
  - Die automatische Suche über alle anderen Ordner (ohne „THW › Alle Einheiten“) fand sonst keine doppelten Zeilen.
- **Folge:** Der Meldekopf übt mit einer Lage von 6 statt 27 Helfern und hält Zugtrupp und zwei Sanitätsgruppen für ältere Fassungen der Betreuungsgruppe. Wer die Übung auswertet, sucht den Fehler beim Meldekopf. Ausgerechnet der Ordner, der für Ausbildung gedacht ist, erzeugt also eine falsche Lage. Auch im Register kann der Ausbilder die vier Zeilen nur an der Stärke unterscheiden.
- **Empfehlung:** In diesen Bögen den Teil der Einheit (Zugtrupp, 1./2. Sanitätsgruppe, Betreuungsgruppe) als Einheitstyp oder Namenszusatz führen, so dass Register, Karte und Abgleich sie trennen. Zusätzlich darf „4 Bögen aufgenommen“ nicht still in „1 Einheit“ münden. Hilfreich wäre ein Hinweis wie „3 davon als neue Fassung derselben Einheit übernommen“ mit Rückfrage.
- **Nachprüfung:** Die vier PDFs in eine leere Übungs-Sammlung einlesen. Ergebnis: 4 Einheiten mit 27 Gesamt, und im Register sind vier unterscheidbare Namen zu sehen.

### BB-W3 [P2] Typ Navigation: Nach „Anzeigen“ führt kein Weg zurück zu den Beispielen. Der Einstieg liegt tief auf der Startseite, und der Dialog beginnt wieder ganz oben

- **Fundstelle:** Geöffnetes Beispiel › „‹ Startseite“ › Abschnitt „Beispielbögen“ › „Beispielbögen ansehen“. Code: `beispieleOeffnen` setzt `setBeispielPfad([])`.
- **Beobachtung:**
  - Nach „Anzeigen“ schließt der Dialog und es erscheint „Beispielbogen geöffnet — fiktive Daten zum Ansehen und Ausprobieren.“ Einen Knopf „Zurück zu den Beispielbögen“ gibt es nicht. Die Zurück-Taste des Browsers führt zur Startseite, nicht in den Dialog.
  - Auf der Startseite liegt der Knopf „Beispielbögen ansehen“ beim Erststart bei y = 1 843 (360 × 640), also auf dem dritten Bildschirm, und bei y = 1 570 auf dem Tablet (Bild 1 180 hoch). Sobald ein Bogen offen ist, wandert der Abschnitt ans Ende hinter „Absender“ und „So funktioniert’s“, auf y = 2 214 (3,5 Bildschirme).
  - Der Dialog beginnt danach wieder bei „Alle“. Zurück zu „OV Bad Aibling“ sind fünf Tipps nötig (THW › Alle Einheiten … › Bayern › RSt Bad Tölz › OV Bad Aibling), dazu Warten auf den Ladezustand.
  - Aus der Einsatz-Sammlung gibt es keinen Zugang. In der Einsatzansicht steht weder ein Knopf noch ein Hinweis, auch nicht in der vollen Fußzeile. Ebenso wenig im geöffneten Bogen.
- **Folge:** Vergleichen („Ist die Bergungsgruppe oder die FGr N passender?“) kostet je Bogen etwa acht Tipps und drei Bildschirme Scrollen. Wer nicht mehr weiß, wo der Einstieg war, findet ihn nur auf der Startseite. Das ist neu, weil der Fußzeilen-Link entfallen ist.
- **Empfehlung:** Den zuletzt geöffneten Ordner beim erneuten Öffnen beibehalten, zumindest innerhalb einer Sitzung. Im geöffneten Beispiel einen Knopf „Zurück zu den Beispielbögen“ an die Meldung „Beispielbogen geöffnet …“ setzen. Ob die Einsatz-Sammlung einen Zugang braucht, siehe BB-W4.
- **Nachprüfung:** OV öffnen, „Anzeigen“, dann mit einem Tipp zurück in denselben Ordner, mit derselben Tabelle und ohne Scrollen auf der Startseite.

### BB-W4 [P2] Typ Ablauf: Für eine Übung gibt es keinen Sammelweg. Jeder Bogen wird einzeln geladen, und der Weg in die Sammlung ist nicht beschrieben

- **Fundstelle:** Dialog › Ordner mit Tabelle (z. B. „OV Bad Aibling“, 6 Bögen) › „PDF“ / „Link“ / „Anzeigen“. Einsatz-Sammlung › „Bögen einlesen…“.
- **Beobachtung:**
  - Je Zeile gibt es nur „Anzeigen“, „PDF“ und „Link“. Für einen ganzen Ordner (Zug, OV, Ausbildungseinlage) gibt es weder „alle als PDF“ noch ein Sammel-PDF noch „in Einsatz-Sammlung übernehmen“.
  - Drei PDFs von Bad Aibling dauerten 4,0 s, 0,8 s und 0,7 s, jedes als eigener Download und ohne Meldung im Dialog.
  - Der Weg über „Anzeigen“ › „In Einsatz-Sammlung ablegen…“ funktioniert. Er kostet aber je Bogen: Startseite, Scrollen, Dialog, fünf Ordnertipps, „Anzeigen“, Rückfrage (BB-W1), „In Einsatz-Sammlung ablegen…“ und Sammlung wählen.
  - Der kurze Weg (alle PDFs laden, in der Sammlung „Bögen einlesen…“ mit Mehrfachauswahl) funktioniert und hat aus drei Dateien drei Einheiten gemacht. Er steht aber nirgends. Die Erklärung im Dialog spricht nur von „zum Testen des QR-Imports“.
  - Die Einsatz-Sammlung mit Art „Übung“ bietet im leeren Zustand nur „Noch keine Meldung. Bogen scannen oder manuell erfassen.“ und keinen Hinweis auf Beispielbögen.
- **Folge:** Eine Übung mit einem Zug (5 bis 8 Bögen) oder einer Einlage (23 Bögen) vorzubereiten, kostet viele einzelne Downloads oder sehr viele Tipps. Wer den Umweg über „Bögen einlesen…“ nicht kennt, legt jeden Bogen einzeln ab und gerät dabei in die Rückfragen aus BB-W1.
- **Empfehlung:** Je Ordner „Alle n Bögen als PDF“ (ein Sammel-PDF zum Drucken und Verteilen) und „Alle in eine Einsatz-Sammlung übernehmen…“ anbieten. In einer leeren Sammlung der Art „Übung“ einen Verweis „Mit Beispielbögen füllen…“ setzen. Damit wäre die Frage aus dem Auftrag beantwortet: Ein Zugang aus der Sammlung ist für Meldekopf-Übungen nötig, für echte Einsätze nicht.
- **Nachprüfung:** Ordner „OV Bad Aibling“: Mit höchstens drei Tipps liegen alle sechs Bögen als eine PDF vor bzw. als sechs Einheiten in einer Übungs-Sammlung.

### BB-W5 [P2] Typ Inhalt/Zustand: Alle Beispiele tragen vergangene Zeiträume. Eine Übungslage ist dadurch voller Warnungen

- **Fundstelle:** Geöffnetes Beispiel, Einsatz-Sammlung nach dem Einlesen. Daten: OV Bad Aibling 19.09.2026, DRK 14.06.2025 und 22.03.2025, Praktische Ausbildung 17.02.2024.
- **Beobachtung:**
  - Im geöffneten Beispiel steht „⚠ 1 offener Punkt für die Weitergabe — Einsatzzeitraum 19.09.2026 – 20.09.2026 ist vorbei — gilt dieser Bogen noch für den aktuellen Einsatz?“. Beim Teilnehmer, der den Bogen per Link öffnet, steht dasselbe.
  - Am Meldekopf zeigt jede Karte „⚠ Stand vor 50 Tagen“ und „Zeitraum vorbei“, der Kopf meldet „⚠ älteste Meldung vor 50 Tagen, 3 von 3 älter als 1 Std“. Bei der Hannover-Einlage steht „vor 995 Tagen“, im Bogen außerdem „liegt mehr als ein Jahr“.
- **Folge:** Eine Übung mit Beispielbögen übt vor allem das Wegklicken von Warnungen. Die Warnung „Zeitraum vorbei“, im Ernstfall ein wichtiger Hinweis auf einen alten Bogen, verliert ihren Wert. Wer die Daten anpassen will, muss jeden Bogen einzeln bearbeiten.
- **Empfehlung:** Beim Öffnen, im PDF, im Link und beim Übernehmen eines Beispiels Zeitraum und Stand auf „heute“ setzen, oder das Datum beim Sammelweg (BB-W4) einmal für alle abfragen. Die Übung-Kennung bleibt dabei erhalten.
- **Nachprüfung:** Drei Beispiele in eine Übungs-Sammlung übernehmen. Es erscheint weder „Stand vor … Tagen“ noch „Zeitraum vorbei“.

### BB-W6 [P2] Typ Ablauf/Rolle: Ein per Link weitergegebenes Beispiel öffnet beim Teilnehmer als „Meldung einer fremden Einheit“. Der Hauptknopf führt in die falsche Rolle

- **Fundstelle:** Dialog › „Link“ (Ausbilder, Zwischenablage, Knopf zeigt „Kopiert“), dann Link im leeren Profil des Teilnehmers öffnen. 360 × 640. Bild `60-link-teilnehmer.png`.
- **Beobachtung:**
  - Der Link (588 Zeichen) öffnet den Bogen direkt. Erste und dunkel hervorgehobene Schaltfläche ist „In Einsatz-Sammlung ablegen…“. Darunter steht: „Meldung einer fremden Einheit: Sie gehört in eine Einsatz-Sammlung. „Bogen übergeben…“ gäbe sie mit dem Siegel dieses Geräts weiter. Ändern macht daraus einen eigenen Bogen dieses Geräts.“ und „Empfangen als: ✓ signiert von e78b ef37 …“.
  - Öffnet der Ausbilder denselben Bogen über „Anzeigen“, ist es dagegen sein eigener Bogen: „Bogen übergeben…“ steht vorn, und es heißt „Signiert mit dem Echtheits-Siegel dieses Geräts“.
- **Folge:** Der Teilnehmer soll die Einheit spielen und sich mit dem QR-Code am Meldekopf melden (Annahme A1). Die App rät ihm, den Bogen in eine eigene Sammlung zu legen, und warnt vor genau dem Schritt, den er tun soll. Er fragt den Ausbilder, oder die Übung beginnt mit einem Fehlgriff. Derselbe Beispielbogen verhält sich je nach Weg anders.
- **Empfehlung:** Ein Link aus den Beispielbögen öffnet beim Empfänger wie „Anzeigen“, also als eigener Übungsbogen mit „Bogen übergeben…“ vorn, oder er sagt ausdrücklich „Beispielbogen — zum Melden am Meldekopf: Bogen übergeben…“. In der Erklärung des Dialogs ein Satz zum Weitergeben an Übungsteilnehmer.
- **Nachprüfung:** Link im leeren Profil öffnen. Als erste Aktion steht „Bogen übergeben…“, der Text nennt kein „fremde Einheit“ und warnt nicht vor dem Übergeben.

### BB-W7 [P3] Typ Ablauf: In einer Sammlung mit der Vorgabe „Einsatz“ zählen abgelegte Beispiele nicht

- **Fundstelle:** „Neue Einsatz-Sammlung…“ (Art vorbelegt mit „Einsatz“), dann Beispiel › „In Einsatz-Sammlung ablegen…“.
- **Beobachtung:**
  - Nach zwei abgelegten Beispielen steht da: „0 EINHEITEN (+2 ÜBUNG) … Nichts gezählt: alle 2 eingegangenen Meldungen sind Übung und zählen nicht in diese Lage.“ und „Zuletzt abgelegt: Nr. 2 … jetzt 0 Einheiten, Gesamt 0“.
  - Mit Art „Übung“ zählen sie (3 Einheiten, 22 Gesamt).
  - Der Ablage-Dialog zeigt die Art der Sammlung („Einsatz · 0 Einheiten anwesend“), warnt aber nicht.
- **Folge:** Gering, weil der Text es erklärt. Ein Ausbilder, der die Art beim Anlegen übersehen hat, beginnt aber mit einer leeren Lage und muss die Sammlung neu anlegen oder die Art ändern.
- **Empfehlung:** Beim Ablegen eines Übungsbogens in eine Sammlung der Art „Einsatz“ kurz rückfragen („Sammlung ist ein Einsatz — Übungsbögen zählen nicht. Als Übung führen?“).
- **Nachprüfung:** Beispiel in eine Sammlung der Art „Einsatz“ ablegen. Rückfrage oder Hinweis erscheint vor dem Ablegen.

### BB-W8 [P3] Typ Navigation/Text: Bögen lassen sich nur über die Ordner finden. Die Ordner sind uneinheitlich benannt und gemischt

- **Fundstelle:** Dialog, oberste Ebene und Unterordner. 360 × 640.
- **Beobachtung:**
  - Es gibt keine Suche und keinen Filter (Einheitstyp, Ort, Stärke) über 3 634 THW-Bögen. Wer die „Fachgruppe Wassergefahren“ oder seinen eigenen OV sucht, muss LV und RSt kennen.
  - „THW“ enthält neben dem Ordner „Alle Einheiten …“ 101 lose Bögen (je einer aus vielen OV) ohne Erklärung, wozu sie dienen. Am Telefon ist das eine Kartenliste von rund 250 px je Bogen, also etwa 40 Bildschirme.
  - „Katastrophenschutz“ benennt die Länder uneinheitlich: „BADENWUERTTEMBERG“, „MECKLENBURG VORPOMMERN“, „NORDRHEIN WESTFALEN“ neben „Brandenburg“, „Niedersachsen“, „Thüringen“.
  - „DRK“ enthält acht lose Saarland-Bögen und daneben einen Ordner „Niedersachsen“.
- **Folge:** Das Suchen kostet Zeit, und die Großschreibung wirkt wie ein Datenfehler. Die eigentliche Arbeit klappt aber.
- **Empfehlung:** Ein Suchfeld über Einheit und Ort für den aktuellen Ordner und alles darunter. Ländernamen einheitlich schreiben. Lose Bögen in einen benannten Ordner legen („Auswahl: je ein Bogen“, „Saarland“).
- **Nachprüfung:** „Wassergefahren“ eintippen, Treffer erscheinen ohne Ordnerwahl. Alle Ländernamen sind in normaler Schreibweise.

### BB-W9 [P3] Typ Inhalt: Innerhalb eines Zuges tragen die Beispiele verschiedene Übungslagen

- **Fundstelle:** OV Bad Aibling, 1. Technischer Zug: Zugtrupp, Bergungsgruppe, FGr N (Bildschirm und PDF).
- **Beobachtung:** Zugtrupp und Bergungsgruppe haben „Übung: Sturmtief »Quirin« Bruckmühl — …“, die FGr N desselben Zuges „Übung: Stromausfall Bruckmühl — Notstromeinspeisung“.
- **Folge:** Bei einer Zug-Übung sieht der Meldekopf zwei Lagen für einen Zug und fragt nach. Das ist gering, für eine geschlossene Übung aber störend.
- **Empfehlung:** Je Zug (Ordner) eine gemeinsame Übungslage, abweichende Aufträge nur absichtlich und dann im Ordner vermerkt.
- **Nachprüfung:** Alle Bögen eines Zuges in einem OV haben denselben Ort und dieselbe Lage.

### BB-W10 [P3] Typ Ablauf: Eine Vorlage aus einem Beispiel ist auf der Startseite nicht als Übung oder Beispiel erkennbar

- **Fundstelle:** Beispiel › „Als Vorlage speichern“ › Startseite › „Gespeicherte Vorlagen“ › Vorlage › „Bogen anlegen“.
- **Beobachtung:**
  - Die Vorlage heißt „THW Bad Aibling Bergungsgruppe“, und die Karte zeigt „THW · Bergungsgruppe · Stärke 0 / 2 / 7 // 9 · 9 Personen · 2 Fahrzeuge“, ohne „Übung“ oder „Beispiel“.
  - Der Bogen aus der Vorlage startet richtig in Schritt 2 mit leerem Zeitraum. Er bleibt als Übung gekennzeichnet (Störer, Haken „Dies ist eine Übung“) und enthält die neun fiktiven Namen.
- **Folge:** Gering. Wer das Beispiel als Grundlage für die eigene Einheit nimmt, sieht erst im Bogen, dass er Übung abwählen und neun Namen ersetzen muss. Wer mehrere Vorlagen hat, unterscheidet die Beispiel-Vorlage nicht von einer echten.
- **Empfehlung:** Vorlagen aus Beispielen auf der Karte mit „Übung · aus Beispielbogen“ kennzeichnen. Beim Speichern anbieten: „Als Grundlage für meine Einheit — Namen leeren, Übung abwählen?“.
- **Nachprüfung:** Vorlage aus Beispiel speichern. Die Karte trägt die Kennzeichnung, und auf Wunsch entsteht ein Bogen ohne fiktive Namen und ohne Übung.

## Hinweise (ohne Priorität)

- **H1 Funktioniert:** Die Rückfrage beim ersten Ersetzen nennt den eigenen Bogen beim Namen und den Rückholplatz. Das Zurückholen funktioniert, „Bogen schließen“ ebenso. Die PDFs tragen „ÜBUNG — Dieser Bogen beschreibt keinen echten Einsatz.“ und einen Kopf für den Meldekopf („Nr. ___ · eingegangen …“). „Link“ meldet „Kopiert“ in der Zeile. Mehrfach-Einlesen von PDFs funktioniert (3 → 3 Einheiten mit „ÜBUNG“).
- **H2 PDF-Dateinamen:** `ov-bad-aibling-01-1-tz-ztr-tz.pdf` und `01-2-einsatzzug-zugtrupp.pdf` sagen nichts von Übung oder Beispiel. Im Download-Ordner neben echten Bögen ist das nicht zu unterscheiden, der PDF-Titel „Erfassungsbogen THW Bad Aibling Zugtrupp Technischer Zug, Stand …“ ebenso wenig. Erst das Wasserzeichen zeigt es.
- **H3 Echte Dienststellen-Adressen in fiktiven Bögen:** Die OV-Beispiele nennen „OV-Aibling@thw.de“ und „Poststelle.LVBY@thw.de“ neben fiktiven 555-Rufnummern. Wird bei einer Übung die Rückfrage geübt, landet eine Mail womöglich bei einer echten Stelle (plausibles Risiko, nicht beobachtet).
- **H4 Ablage-Text:** „In Einsatz-Sammlung ablegen“ sagt beim Beispiel „Dein Bogen wird als Meldung abgelegt … dein Bogen bleibt unter „Fortsetzen““. Für ein fiktives Beispiel passt „Dein“ nicht. Folgt aus derselben Ursache wie BB-W1.
- **H5 Hintergrund unter dem Dialog:** Bei 360 × 640 endet der Dialog bei y = 624. Darunter scheint die Startseite durch („Für Einsatz, Übung …“). Das ist nur optisch.
- **H6 Ladezustand:** Während „Angaben werden geladen … 21 von 101“ sind „Anzeigen“, „PDF“ und „Link“ schon bedienbar. In noch nicht geladenen Zeilen steht nur „…“. Das ist ehrlich und störte im Ablauf nicht.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen. Ein einzelner Bogen ist schnell angesehen, als PDF geladen oder geteilt. Eine Übung mit mehreren Bögen gelingt nur über Einzel-Downloads und „Bögen einlesen…“. Die Hannover-Einlage ergibt dabei eine falsche Lage.
- **Fremde Hilfe nötig:** nein für den Ausbilder. Der Teilnehmer mit Link braucht womöglich Hilfe (BB-W6).
- **Größtes Missverständnis:** Ein nur angesehenes Beispiel gilt als „angefangener Bogen“ und verdrängt den echten eigenen Entwurf bis zur Wahl „endgültig löschen“ (BB-W1).
- **Größtes Einsatzrisiko:** Im Ausbildungsordner werden vier Bögen still zu einer Einheit zusammengefasst, und die Übungslage zeigt 6 statt 27 Helfer (BB-W2). Außerhalb der Übung droht der Verlust des eigenen Entwurfs (BB-W1).
- **Top-Priorität für die nächste Iteration:** BB-W1. Unveränderte Beispiele ohne Rückfrage ersetzen und nie auf den Rückholplatz legen. Unmittelbar danach die Einheitstypen der Hannover-Einlage trennen (BB-W2).
