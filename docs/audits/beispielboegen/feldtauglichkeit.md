# Audit „Helfer im Feld“, Schwerpunkt Beispielbögen (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-11-08 ·
Prüfgegenstand: Live-Seite `https://erfassungsbogen.app/` (frisch deployt, Code-Stand Commit `0dd56d4`, `main`), nur der Bereich
Beispielbögen: Startseiten-Abschnitt „Beispielbögen“ mit „Beispielbögen ansehen“, Dialog „Beispielbögen“ (Erklärung, Register,
Pfadleiste, tiefe Ordner, Tabelle/Karten, Ladezustand) und die Folgen von „Anzeigen“, „PDF“ und „Link“.

Zählung: **P0 0 · P1 0 · P2 4 · P3 7 · Hinweise 6** (Hinweise ohne Priorität, nicht in der Zählung)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md` und `runde-21/feldtauglichkeit.md`
(Aufbau); zum Nachschlagen `src/app/fusszeile.tsx` (Dialog), `src/app/app.tsx` (`BeispielboegenStart`, `oeffneBeispiel`). Je
Sachverhalt ein Befund; der Typ steht im Kopf jedes Befunds (Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast). Wo
andere Berichte dieser Schwerpunktrunde denselben Sachverhalt melden, steht der Verweis im Feld „Gleicher Sachverhalt“.

## Prüfaufbau

Playwright/Chromium (globales Modul, `chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE, Pixeldichte 1,
frischer Kontext je Lauf, Tipps als Touch-Tipps; Skripte und Bildschirmfotos unter `/tmp/claude-0/audit-feld/` (`bb*.js`,
`bb/*.png`). Viewports: Telefon 360 × 640 und 390 × 844, Querformat 640 × 360; Anzeigemodus „Standard“ und „Feld“ (über den
Schalter „Ansicht“ im Kopf umgestellt). DOM nicht verändert, kein Skript eingeschleust; gelesen wurden nur Lage, Größe, Bildlauf
und berechnete Stile.

Wege: (1) Startseite ohne Bogen → „Beispielbögen ansehen“ → alle neun Register → THW › Alle Einheiten aller Ortsverbände › LV ›
RSt › OV (Baden-Württemberg/Biberach, Niedersachsen/Oldenburg, Bayern/Bad Tölz, NRW/Aachen), Katastrophenschutz › Bundesland,
DRK, Feuerwehr, Praktische Ausbildung; (2) „Anzeigen“ ohne eigenen Bogen, mit angefangenem eigenem Bogen („THW Oldenburg“,
nur Ort eingetragen) und ein zweites Mal danach; „Abbrechen“ in der Rückfrage; (3) „PDF“ (Download gespeichert, Text und Seite 1
gerendert), „Link“ (Zwischenablage-Berechtigung erteilt, Inhalt ausgelesen); (4) Zurück-Geste (`goBack`) im tiefen Ordner;
(5) Doppeltipp auf eine Registerzeile; (6) Ladezustand mit Drosselung über das Chrome-DevTools-Protokoll („langsames 3G“
400 kBit/s, 400 ms; Service Worker blockiert) und ungedrosselt, Zeitverlauf alle 100 ms bis 1 s gemessen; (7) Offline: online
geladen bis „✓ Jetzt offline bereit“ (nach 70 s), weitere 120 s gewartet, Netz getrennt (`setOffline`), neu geladen, Dialog,
„Anzeigen“ und „PDF“ in THW, OV-Ordnern und Katastrophenschutz; (8) Stichprobe von sechs Beispielbögen nach „Anzeigen“ auf
offene Punkte.

## Annahmen

- Beispielbögen dienen Ausbildung, Übung und dem Kennenlernen der App; sie werden typischerweise in der Unterkunft, beim
  Dienstabend oder vor der Übung angesehen, seltener unter Zeitdruck am Einsatzort. Die Prioritäten sind darauf bezogen.
- Ein Helfer schaut sich meist mehr als einen Beispielbogen an (z. B. „seinen“ Gruppentyp und den Zugtrupp).
- Wer bereits einen eigenen Bogen angefangen hat, will ihn behalten.

## Nicht prüfbar (Not verified)

Echte Handschuhe, nasse Finger, Sonne und Dunkelheit am Display; WebKit/Safari; das echte Teilen-Menü (Chromium im Test hat kein
`navigator.share`, deshalb lief „Link“ über die Zwischenablage); die Download-Anzeige eines echten Android-Browsers nach „PDF“;
echtes Mobilnetz (Drosselung nur angenähert); Telefon-Zurück-Taste (angenähert über `goBack`); Druck der PDF.

## Urteil

Aufgabe „Einen Beispielbogen meiner Einheit finden, ansehen, als PDF holen, Link weitergeben“: **abgeschlossen, mit Mühe an
einzelnen Stellen**. Online im Hochformat geht der Weg ohne Hilfe: Register mit Bogenzahl, ein echter „‹ Zurück“-Knopf, Karten
mit drei 44 px hohen Knöpfen, Rückfrage vor dem Ersetzen des eigenen Bogens, Störer „ÜBUNG“ in der App und Wasserzeichen
„ÜBUNG“ in der PDF. Reibung entsteht, (a) wenn man mehr als ein Beispiel ansieht, während ein eigener Bogen angefangen ist:
dann soll man den eigenen Bogen sichern oder „endgültig löschen“ (BB-H1); (b) an der Zurück-Geste, die den ganzen Dialog samt
Pfad schließt (BB-H2); (c) offline, wo 3 533 der 3 634 THW-Bögen fehlen, obwohl die Startseite „komplett offline“ meldet (BB-H3);
(d) im Querformat, wo die Knöpfe neben dem Bild liegen (BB-H4).

Erwartetes Bild des Helfers: „Das ist ein Ordner mit Musterbögen wie im Schrank vom OV. Ich blättere zu meinem OV, schaue mir
den Bogen an, lege ihn zurück, nehme den nächsten.“ Das Zurücklegen passt nicht dazu: ein angesehener Beispielbogen wird zum
„angefangenen Bogen“ und belegt dieselben Plätze wie die eigene Arbeit.

## Bestätigt (funktioniert und sollte bei Umbauten erhalten bleiben)

- **Einstieg:** Abschnitt „Beispielbögen“ steht direkt unter „So funktioniert’s“ (360 × 640: y = 1 712, Knopf 182 × 44; Feld
  218 × 54), kurzer Erklärsatz, ein Primärknopf. Der Fußzeilen-Link ist weg; der Abschnitt ist der einzige Einstieg und reicht.
- **Dialog-Start:** öffnet in 11 ms; die Erklärung ist eingeklappt (44 px), die neun Register stehen sofort da, jede Zeile ganz
  antippbar (278 × 52 bis 64 px), Bogenzahl rechts. Bei 390 × 844 alle neun ohne Rollen im Bild.
- **Pfadleiste:** „‹ Zurück“ 84 × 44 als echter Knopf, Pfad „Alle › THW › … › OV Biberach/Riß“ mit klickbaren Zwischenstufen,
  die letzte Stufe fett. Beim Wechsel aus einer gerollten Registerliste in eine Ordnerebene springt der Bildlauf in den meisten
  Fällen auf 0 (Ausnahme BB-H5).
- **Karten am Telefon:** hochkant keine Tabelle, sondern Karten (Tabelle 278 px in 278 px, kein seitliches Überlaufen bei 360 und
  390); Zeichen, Einheitstyp, Zug, Ort, Träger, Stärke „1/1/2//4“, Fahrzeugzahl; Knöpfe „Anzeigen“ 104 × 44, „PDF“ 72 × 44,
  „Link“ 71 × 44 (Feld 125/86/85 × 54). Schriften 13 bis 14 px (Feld 15,7 bis 16,8), Grau rgb(92, 100, 120) auf Weiß ≈ 5,9 : 1.
- **Ladezustand:** „101 Bögen · Angaben werden geladen … 21 von 101“ zählt sichtbar hoch (ungedrosselt fertig nach 4 bis 6 s);
  „…“ statt „—“ in noch nicht geladenen Zeilen.
- **Während „PDF“/„Link“/„Anzeigen“:** „wird vorbereitet …“ in der Zeile, alle Knöpfe gesperrt; ein Doppeltipp löst nichts
  doppelt aus. Doppeltipp auf eine Registerzeile („Alle Einheiten …“, 120 ms Abstand) öffnete nur eine Ebene.
- **„Anzeigen“ ohne eigenen Bogen:** sofort Übersicht, Störer „ÜBUNG — Dieser Bogen ist als Übung gekennzeichnet …“, Meldung
  „Beispielbogen geöffnet — fiktive Daten zum Ansehen und Ausprobieren.“
- **„Anzeigen“ mit eigenem Bogen:** Rückfrage „Beispielbogen öffnen? Der angefangene Bogen „THW Oldenburg“ wird durch den
  Beispielbogen ersetzt. Der Stand bleibt auf der Startseite unter „Zuletzt geschlossenen Bogen zurückholen“ erreichbar.“ mit
  „Beispielbogen öffnen“ / „Abbrechen“ (je 302 × 44, 24 px Abstand); „Abbrechen“ lässt den Dialog „Beispielbögen“ offen. Nach
  dem Öffnen steht „THW Oldenburg“ tatsächlich auf dem Rückholplatz.
- **PDF:** Download „bhp25-behandlung-gelb.pdf“ nach 2,5 s (ungedrosselt), drei Seiten; Kopfzeile „ÜBUNG — Dieser Bogen beschreibt
  keinen echten Einsatz.“ und diagonales Wasserzeichen „ÜBUNG“ über der Seite.
- **Link:** Knopf wechselt für 3 s auf „Kopiert“; Zwischenablage enthält `https://erfassungsbogen.app/#…` (915 Zeichen).
- **Schließen:** Fokus geht zurück auf „Beispielbögen ansehen“, die Startseite bleibt an derselben Stelle (scrollY 1 593 vor
  und nach).
- **Offline, kleiner Bestand:** Register und Zahlen erscheinen offline vollständig; Bögen der Ordner THW (101), DRK, Katastrophenschutz
  usw. öffnen und erzeugen offline die PDF („001-albstadt-ztr-tz.pdf“, „1-loeschgruppe-gelnhausen.pdf“).

## Befunde

### BB-H1 [P2] Zweiter Beispielbogen verdrängt den eigenen Entwurf vom Rückholplatz: Rückfrage verlangt „sichern“ oder „endgültig löschen“

- **Typ:** Daten/Verlust
- **Gleicher Sachverhalt:** BB-E2, BB-D1, BB-K1 (andere Berichte dieser Runde).
- **Evidence:** Observed (360 × 640).
- **Ort:** Startseite mit angefangenem Bogen → „Beispielbögen ansehen“ → ASB › „Anzeigen“ → „Beispielbogen öffnen“ → Startseite →
  „Beispielbögen ansehen“ → DLRG › „Anzeigen“.
- **Beobachtung:** Der erste Beispielbogen wird zum „angefangenen Bogen“ (Karte „ASB-Kreisverband Rheindorf e. V.
  Betreuungskomponente (Einsatzeinheit)“ mit „Fortsetzen“), der eigene „THW Oldenburg“ rückt auf „Zuletzt geschlossener Bogen“.
  Beim zweiten Beispiel erscheint: „Der angefangene Bogen „ASB-Kreisverband Rheindorf …“ wird durch den Beispielbogen ersetzt. Der
  Bogen „THW Oldenburg“ (Stand 08.11.26, 21:10 Uhr) auf dem Platz „Zuletzt geschlossener Bogen“ wird dabei endgültig gelöscht: Er
  fasst nur einen Bogen. …“ mit drei Knöpfen: „Beispielbogen öffnen — den alten Bogen vorher als Datei sichern“ (rot, gefüllt),
  „Beispielbogen öffnen — alten Bogen endgültig löschen“ (rot umrandet), „Abbrechen“. Der Text ist neun Zeilen lang (Dialog
  488 px), „alter Bogen“ meint hier den eigenen, nicht den gerade angesehenen ASB-Bogen.
- **Erwartung des Helfers:** „Ich habe mir nur ein Muster angesehen; das lege ich zurück. Mein eigener Bogen ist davon nicht
  betroffen.“
- **Folge:** Wer zwei Beispiele ansieht, muss seinen eigenen Bogen als Datei sichern oder ihn endgültig löschen lassen, um ein
  fiktives Muster anzusehen, das jederzeit wieder aus dem Dialog zu holen wäre. Der Schutz greift (keine stille Löschung), aber
  der Helfer muss einen langen Text lesen und zwischen zwei ähnlich roten Knöpfen wählen; „alten Bogen endgültig löschen“ ist bei
  flüchtigem Lesen als „das alte Beispiel weg“ zu verstehen.
- **Empfehlung:** Ein geöffneter Beispielbogen sollte weder den Rückholplatz belegen noch den eigenen Bogen dorthin verschieben,
  solange er unverändert ist (er ist ja wieder zu holen); erst eine Änderung macht ihn zu „eigener Arbeit“. Mindestens: ein
  unverändertes Beispiel beim nächsten Beispiel ohne Rückfrage ersetzen und den eigenen Bogen auf dem Rückholplatz lassen.
- **Nachprüfung:** Eigenen Bogen anfangen, zwei Beispiele nacheinander öffnen: Keine Frage nach „endgültig löschen“; der eigene
  Bogen ist danach über die Startseite wieder zu holen.

### BB-H2 [P2] Zurück-Geste schließt den ganzen Dialog; beim Wiederöffnen steht man wieder bei „Alle“

- **Typ:** Bedienung
- **Gleicher Sachverhalt:** BB-E4, BB-S3, BB-G3.
- **Evidence:** Observed (360 × 640, Zurück über `goBack`, entspricht Zurück-Taste/-Wisch; auf echtem Android Likely gleich).
- **Ort:** Dialog „Beispielbögen“ in Tiefe 5 (Alle › THW › Alle Einheiten aller Ortsverbände › Bayern › RSt Bad Tölz).
- **Beobachtung:** Zurück-Geste: Dialog zu, Adresse bleibt `https://erfassungsbogen.app/` (gut: die App wird nicht verlassen). Erneut
  „Beispielbögen ansehen“: keine Pfadleiste, wieder die neun Register ganz oben. Der Code setzt beim Öffnen den Pfad bewusst auf
  leer. Dasselbe nach „Anzeigen“ und Rückkehr zur Startseite.
- **Erwartung des Helfers:** Zurück heißt „eine Ebene hoch“, wie im Dateimanager des Telefons. Und: „Ich mach den Ordner wieder
  auf, wo ich war.“
- **Folge:** Für den Vergleich von zwei Bögen eines OV fünf Register erneut tippen (dazu je nach Stand 2 bis 3 Bildschirme auf der
  Startseite rollen, siehe Hinweis 3). Wer die Geste aus Gewohnheit nutzt, fliegt jedes Mal heraus.
- **Empfehlung:** Zurück-Geste im Dialog eine Ordnerebene hoch, erst auf „Alle“ den Dialog schließen; den letzten Pfad für die
  Sitzung merken und beim Wiederöffnen dort beginnen (mit „Alle“ als sichtbarem Ausweg).
- **Nachprüfung:** In Tiefe 5 die Zurück-Taste: Pfad endet auf „RSt Bad Tölz“ eine Ebene höher; Dialog schließen und öffnen: Pfad
  wie zuvor.

### BB-H3 [P2] Offline fehlen 3 533 der 3 634 THW-Bögen, obwohl die Startseite „Funktioniert komplett offline“ meldet; die Fehlermeldung verweist auf diese Zeile

- **Typ:** Bedienung (Funktion offline nicht nutzbar)
- **Gleicher Sachverhalt:** BB-S1 (dort P1), BB-E3, BB-E5.
- **Evidence:** Observed (360 × 640, zweimal).
- **Ort:** Dialog „Beispielbögen“ offline › THW › Alle Einheiten aller Ortsverbände › beliebiger OV › „Anzeigen“ / „PDF“.
- **Beobachtung:** Online geladen bis „✓ Jetzt offline bereit. Funktioniert komplett offline — alle Daten bleiben auf diesem
  Gerät.“ (70 s), weitere 120 s gewartet, Netz getrennt, neu geladen. Das Register zeigt „THW 3.634 Bögen“, der OV-Ordner öffnet,
  die Karten aber zeigen Dateinamen („ov-bad-aibling-01-1-tz-ztr-tz“), „nicht geladen“, „Stärke —“, und die Knöpfe „Anzeigen“,
  „PDF“, „Link“ sind aktiv. Darunter: „Einige Beispielbögen liegen noch nicht auf dem Gerät — sie werden mit Netz nachgeladen (siehe
  Offline-Zeile der Startseite).“ Nach „Anzeigen“: „Bogen konnte nicht geladen werden: Dieser Beispielbogen liegt noch nicht auf
  dem Gerät — Beispielbögen werden nach dem ersten Laden mit Netz nachgeladen (siehe Offline-Zeile der Startseite).“ Die
  Offline-Zeile sagt aber nur „✓ Funktioniert komplett offline …“. Im Zusatzvorrat lagen 12 OV-Einträge (nur der vorher online
  geöffnete OV Aachen); die 101 Bögen direkt unter THW und Katastrophenschutz gingen offline.
- **Erwartung des Helfers:** „Offline bereit“ heißt auch die Muster sind da — für den Ausbildungsabend in der Halle ohne Netz.
- **Folge:** Gerade die Bögen des eigenen OV (der naheliegende Grund, die Beispiele zu öffnen) fehlen ohne Netz. Die Meldung
  schickt den Helfer zu einer Zeile, die das Gegenteil behauptet; er weiß nicht, ob Warten, Neuladen oder WLAN hilft. Für den
  Einsatz selbst ohne Folgen (fiktive Daten), daher P2.
- **Empfehlung:** Entweder die OV-Bögen in den Offline-Vorrat nehmen (und die Startseite erst „komplett offline“ melden, wenn sie
  da sind) oder ehrlich sagen: „Beispielbögen der Ortsverbände brauchen Netz; offline verfügbar: THW (101), DRK, …“. Nicht
  verfügbare Karten als solche kennzeichnen und ihre Knöpfe sperren, statt einen Fehler nach dem Tipp zu zeigen.
- **Nachprüfung:** Wie oben offline: OV-Ordner zeigt entweder geladene Karten oder einen klaren Hinweis „nur mit Netz“; der Text der
  Startseite passt dazu.

### BB-H4 [P2] Querformat 640 × 360: Tabelle statt Karten, „PDF“ angeschnitten, „Link“ außerhalb des Bildes; nur drei von neun Registern sichtbar

- **Typ:** Layout/Abstand
- **Gleicher Sachverhalt:** BB-G1, BB-K2 (Tablet).
- **Evidence:** Observed (640 × 360, Standard).
- **Ort:** Dialog „Beispielbögen“ › THW › … › OV Oldenburg (NI).
- **Beobachtung:** Ab dieser Breite steht eine Tabelle (Köpfe Einheit/Herkunft/Stärke/Bogen). Innenbreite des Rollbereichs 494 px,
  Inhalt 684 px; „Anzeigen“ bei x = 488 im Bild, „PDF“ bei x = 598 halb hinter dem Dialogrand (Dialog endet bei x = 592), „Link“ bei
  x = 677 ganz außerhalb. Kein sichtbarer Hinweis auf seitliches Rollen. Auf der obersten Ebene stehen bei 328 px Dialoghöhe nur
  drei der neun Register ganz im Bild (THW als letzte Zeile nicht).
- **Erwartung des Helfers:** Telefon quer gelegt, um mehr zu sehen; alle Knöpfe einer Zeile wie hochkant.
- **Folge:** „Link“ wird nicht gefunden, „PDF“ ist nur halb zu treffen; wer den Seitwärtswisch findet, verliert dabei die Spalte
  „Einheit“ aus dem Bild und weiß nicht mehr, zu welcher Zeile der Knopf gehört.
- **Empfehlung:** Bei geringer Höhe/Breite (Querformat Telefon) bei den Karten bleiben oder die Aktionsspalte neben der Einheit
  fest halten; „Bogen“-Spalte zuerst schmal machen (Symbole mit Beschriftung untereinander).
- **Nachprüfung:** 640 × 360 und 844 × 390: alle drei Knöpfe der ersten Zeile ohne Seitwärtsrollen im Bild.

### BB-H5 [P3] Ordner mit Bögen öffnet mitten in der Liste; „‹ Zurück“ und Pfad rollen weg (THW-Ordner 30 789 px lang)

- **Typ:** Layout/Abstand
- **Gleicher Sachverhalt:** BB-E7, BB-S4, BB-G5.
- **Evidence:** Observed (360 × 640, 640 × 360, Feld).
- **Ort:** Dialog › Tipp auf ein OV-Register, das erst durch Rollen erreichbar war; Ordner „THW“ mit 101 Karten.
- **Beobachtung:** Beim Wechsel in eine Ordnerebene springt der Bildlauf meist auf 0; beim Wechsel in einen OV (Ebene mit Tabelle)
  bleibt er stehen: scrollTop 321 → 332 (360 × 640), 466 → 525 (640 × 360); „‹ Zurück“ liegt dann bei y = −187 bzw. −380, im Feld
  steht oben „9 Bögen“ und die erste Karte, der Pfad ist nicht zu sehen. Die Pfadleiste ist nicht angeheftet: im Ordner THW
  (101 Karten, Dialoginhalt 30 789 px, rund 50 Bildschirme) ist „‹ Zurück“ nach dem Rollen ans Ende 30 000 px entfernt.
- **Erwartung des Helfers:** Nach dem Tippen auf „OV Oldenburg“ sieht er oben „OV Oldenburg“ und darunter die Bögen; „Zurück“ bleibt
  greifbar.
- **Folge:** Kurze Unsicherheit „bin ich im richtigen OV?“; zurück nur durch langes Rollen nach oben oder über die Zurück-Geste, die
  den Dialog schließt (BB-H2).
- **Empfehlung:** Bei jedem Ebenenwechsel an den Anfang springen; „‹ Zurück“ mit dem letzten Pfadteil im Dialogkopf anheften.
- **Nachprüfung:** Aus gerollter Registerliste einen OV öffnen: Pfad und „‹ Zurück“ oben im Bild; im Ordner THW ans Ende rollen:
  „‹ Zurück“ weiter sichtbar.

### BB-H6 [P3] Jeder Beispielbogen öffnet mit „⚠ offene Punkte“; THW-OV-Bögen zeigen im Kopf „3 Personal fehlt“

- **Typ:** Text (Inhalt der Beispiele)
- **Gleicher Sachverhalt:** BB-E9, BB-K6.
- **Evidence:** Observed (390 × 844 und 360 × 640, sechs von sechs Stichproben).
- **Ort:** Nach „Anzeigen“ › Übersicht.
- **Beobachtung:** THW OV Oldenburg (Zugtrupp FZ FK): „⚠ 2 offene Punkte für die Weitergabe — antippen zum Beheben: Einsatzzeitraum
  19.09.2026 ist vorbei … / Alle 4 Personen stehen auf Geschlecht „männlich“ — das ist die Vorbelegung. Bitte prüfen“; im Kopf
  Reiter „3 fehlt“. THW (Albstadt), Feuerwehr Niedersachsen, Katastrophenschutz Hessen, Bundeswehr: 1 bis 2 Punkte, immer
  „Einsatzzeitraum … ist vorbei“. Praktische Ausbildung (JUH Hannover): 3 Punkte, dazu „liegt mehr als ein Jahr entfernt — Tippfehler im
  Jahr?“ und „Kennzeichen H-JU XXX steht mehrfach in der Fahrzeugliste“.
- **Erwartung des Helfers:** Ein Muster zeigt, wie ein fertiger, sauberer Bogen aussieht.
- **Folge:** Der Helfer hält das Muster für fehlerhaft oder denkt, er habe beim Öffnen etwas falsch gemacht; die Warnungen, die im
  Ernstfall schützen, nutzen sich ab.
- **Empfehlung:** Beispiele so pflegen, dass sie ohne Warnung durchgehen (Personen mit gesetztem Geschlecht, eindeutige Kennzeichen),
  und bei Übungs-/Beispielbögen die Zeitraum-Warnung als Hinweis „Beispiel: Zeitraum fiktiv“ führen oder auslassen.
- **Nachprüfung:** Stichprobe aus jedem Register: Übersicht ohne „⚠“, kein Reiter „fehlt“.

### BB-H7 [P3] Katastrophenschutz: Ländernamen in Großbuchstaben ohne Umlaut und Bindestrich, uneinheitlich, vier Länder fehlen

- **Typ:** Text
- **Gleicher Sachverhalt:** BB-E10, BB-K8.
- **Evidence:** Observed (360 × 640).
- **Ort:** Dialog › Katastrophenschutz.
- **Beobachtung:** Register: „BADENWUERTTEMBERG“, „BAYERN“, „BERLIN“, „Brandenburg“, „HESSEN“, „MECKLENBURG VORPOMMERN“, „Niedersachsen“,
  „NORDRHEIN WESTFALEN“, „RHEINLAND PFALZ“, „SAARLAND“, „Sachsen“, „Thüringen“. Bremen, Hamburg, Sachsen-Anhalt und
  Schleswig-Holstein fehlen ohne Hinweis. Im THW-Ordner dagegen „Baden-Württemberg“, „Nordrhein-Westfalen“.
- **Erwartung des Helfers:** Länder wie überall geschrieben; „mein Land“ ist da oder es steht, warum nicht.
- **Folge:** Wirkt wie ein Fehler oder Platzhalter; „BADENWUERTTEMBERG“ liest sich schlecht. Wer Schleswig-Holstein sucht, sucht
  vergeblich.
- **Empfehlung:** Ordnernamen anzeigen wie amtlich geschrieben; fehlende Länder entweder ergänzen oder unter der Liste nennen.
- **Nachprüfung:** Register Katastrophenschutz in gemischter Schreibung mit Umlaut und Bindestrich.

### BB-H8 [P3] Während des Ladens und offline stehen Dateinamen als Einheitsname

- **Typ:** Text
- **Evidence:** Observed (640 × 360 online nach 2,6 s; 360 × 640 offline; langsames 3G).
- **Ort:** Karte bzw. Tabellenzeile eines Bogens, solange die Angaben nicht geladen sind.
- **Beobachtung:** „ov-oldenburg-ni-03-fz-fk-fgr-k-a“, „ov-bad-aibling-04-1-tz-fgr-e“, „grossbogen-verstaerkter-bergungszug“ statt
  „Fachgruppe Führung/Kommunikation …“; Herkunft „…“ bzw. „nicht geladen“, Stärke „—“. Die Knöpfe sind dabei schon aktiv. Bei
  langsamem 3G dauert das Füllen der 101 THW-Karten über 12 s.
- **Erwartung des Helfers:** Klartext, oder sichtbar „wird geladen“.
- **Folge:** Technische Kürzel, die man nicht lesen kann; offline zusammen mit BB-H3 der Eindruck „kaputt“.
- **Empfehlung:** Statt des Dateinamens den Ordner-/Zugnamen (der ist schon da) und „Angaben werden geladen“ bzw. offline „nur mit
  Netz“ zeigen.
- **Nachprüfung:** Gedrosselt und offline: keine Zeile mit Bindestrich-Kürzel als Hauptzeile.

### BB-H9 [P3] „PDF“ bei langsamem Netz 22 s mit nur „wird vorbereitet …“; nach dem Download und nach „Link“ kaum Quittung

- **Typ:** Bedienung (Rückmeldung)
- **Evidence:** Observed (360 × 640, langsames 3G gedrosselt; ungedrosselt 2,5 s).
- **Ort:** Karte › „PDF“, „Link“.
- **Beobachtung:** Nach „PDF“ steht in der Karte unter dem Einheitsnamen „wird vorbereitet …“ (13 px grau); alle Knöpfe aller Karten
  sind gesperrt. Die Datei kam nach 21,96 s. Danach kein Text im Dialog („PDF gespeichert …“), die Knöpfe werden einfach wieder
  aktiv. Wer „PDF“ unten in einer Karte tippt, sieht den Hinweis oberhalb, oft schon außer Bild. „Link“ wechselt die Beschriftung für
  3 s auf „Kopiert“, sonst nichts.
- **Erwartung des Helfers:** „Läuft“ mit Fortschritt, am Ende „fertig, liegt in Downloads“.
- **Folge:** Nach 5 bis 10 s ohne Änderung hält der Helfer es für hängend, tippt anderswo (gesperrt) oder schließt den Dialog. Ob der
  Download kam, zeigt nur der Browser (auf echtem Gerät nicht geprüft).
- **Empfehlung:** Hinweis in der Knopfzeile („PDF wird erstellt …“ am Knopf selbst), nach Abschluss kurze Quittung im Dialog mit
  Dateiname; bei „Link“ eine Zeile „Link kopiert — in Messenger einfügen“.
- **Nachprüfung:** Gedrosselt „PDF“: Fortschritt am Knopf sichtbar, danach Quittung mit Dateiname.

### BB-H10 [P3] Ordner und lose Bögen auf derselben Ebene; bei langsamem Netz erscheint der Unterordner erst später oberhalb der Liste

- **Typ:** Bedienung (Orientierung)
- **Gleicher Sachverhalt:** BB-S5, BB-S6, BB-G2.
- **Evidence:** Observed (360 × 640, ungedrosselt und langsames 3G).
- **Ort:** Dialog › THW, DRK, Feuerwehr.
- **Beobachtung:** Unter „THW“ stehen der Ordner „Alle Einheiten aller Ortsverbände (LV › RSt › OV) · 3.533 Bögen“ und darunter
  „101 Bögen“ als Karten (Albstadt, Biberach/Riß, Crailsheim, …), ohne Erklärung, was die 101 von den 3 533 unterscheidet. Unter „DRK“
  ein Ordner „Niedersachsen · 8 Bögen“ plus 8 lose Bögen (darunter „Landesverband Saarland“); unter „Feuerwehr“ nur ein Ordner
  „Niedersachsen“ (ein Tipp ohne Wahl). Bei langsamem 3G zeigt die oberste Ebene zunächst „THW 101 Bögen“, im THW-Ordner fehlt der
  Unterordner 1 bis 2 s lang; dann erscheint er über der Liste (Zähler „101 Bögen“ springt auf y = 279), die Karten darunter rücken.
- **Erwartung des Helfers:** Ein Ordner enthält entweder Unterordner oder Bögen; „mein OV“ findet man über eine Ebene, deren Sinn klar ist.
- **Folge:** Wer schnell tippt, sieht nur 101 Bögen und hält den OV-Bestand für nicht vorhanden; der späte Ordner schiebt das Tippziel
  weg (Fehltipp möglich).
- **Empfehlung:** Lose Bögen in einen benannten Ordner (z. B. „Auswahl: je ein Bogen pro Einheitstyp“); Ordner mit nur einem Unterordner
  direkt öffnen; während des Nachladens Platz für den Unterordner freihalten oder „weitere Ordner werden geladen“ zeigen.
- **Nachprüfung:** THW-Ebene zeigt nur Ordner mit verständlichen Namen; gedrosselt springt nichts nach unten.

### BB-H11 [P3] Modus „Feld“ (360 × 640): „(Bundeseinheiten“ / „)“ getrennt, „Schließen“ unter dem Titel, Pfadleiste halbe Dialoghöhe, THW außer Sicht

- **Typ:** Layout/Abstand
- **Gleicher Sachverhalt:** BB-S8 (Pfadleiste).
- **Evidence:** Observed (360 × 640, Feld).
- **Ort:** Dialog „Beispielbögen“ oberste Ebene und OV-Ebene.
- **Beobachtung:** Register „BBK (Bundeseinheiten“ mit der schließenden Klammer allein in der dritten Zeile. „Schließen“ (Feld) bricht
  unter den Titel, Kopf 128 px. Auf der obersten Ebene stehen sechs von neun Registern im Bild; „THW“ (die größte Gruppe, alphabetisch
  zuletzt) erst nach dem Rollen. In Tiefe 5 ist die Pfadleiste 314 px hoch, 52 % der Dialoghöhe 604 px; der Zähler „9 Bögen“ beginnt bei
  y = 532, die erste Karte bei y = 568 (Standard: Pfadleiste 212 px).
- **Erwartung des Helfers:** Im Feld-Modus große Schrift, aber das Wichtigste (Bögen) im ersten Bild.
- **Folge:** Gering; ein Wischer mehr je Ebene, die getrennte Klammer wirkt unfertig.
- **Empfehlung:** Pfad im Feld-Modus einzeilig kürzen („‹ Zurück · … › RSt Oldenburg › OV Oldenburg“), Klammer nicht allein umbrechen
  lassen, „Schließen“ als kompakten Knopf neben dem Titel.
- **Nachprüfung:** Feld 360 × 640 in Tiefe 5: erste Karte oberhalb von y = 400; keine allein stehende Klammer.

## Hinweise (ohne Priorität, keine Beeinträchtigung der Aufgabe)

1. **Erklärung ohne Aufklapp-Zeichen:** „Was sind Beispielbögen? Was heißen Anzeigen, PDF und Link?“ ist 14 px blau, ohne Dreieck
   (Zusammenfassung als Flexbox, Marker fehlt); wirkt wie ein Verweis auf eine andere Seite. Aufgeklappt 363 px.
2. **Schmale Pfadziele:** „Alle“ 23,5 × 44 px, „THW“ 31,7 × 44 px; mit Handschuh knapp. „‹ Zurück“ (84 × 44) ist der sichere Weg.
3. **Lage des Abschnitts:** „Beispielbögen ansehen“ liegt bei 360 × 640 bei y = 1 843 (2,9 Bildschirme), mit angefangenem Bogen
   tiefer (Abschnitt y = 1 972), bei 390 × 844 2,2, im Feld-Modus 3,4 Bildschirme. Für den Übungszweck ausreichend, nach jedem
   „Anzeigen“ aber erneut zu rollen (BB-H2).
4. **PDF-Dateiname ohne „Beispiel“:** „bhp25-behandlung-gelb.pdf“, „001-albstadt-ztr-tz.pdf“; im Download-Ordner neben echten Bögen
   nicht als Muster zu erkennen (in der Datei selbst steht „ÜBUNG“ deutlich).
5. **Startseite nach „Anzeigen“:** Die Karte „ASB-Kreisverband Rheindorf … · Fortsetzen“ sagt nicht „Beispiel“ oder „Übung“; nur die
   Kopffarbe unterscheidet sich (siehe BB-D4, BB-E8).
6. **Ordnernamen in „Praktische Ausbildung“:** „Einlagen Kräfte Hannover“, „JUH OV Akkonia“, „JUH RV Malter“ sind ohne Vorwissen
   nicht einzuordnen (was ist eine „Einlage“?).

## Comprehension check

- Orientation: understood (Pfadleiste, Register mit Zahl; uncertain nach Ebenenwechsel in einen OV und in langen Listen, BB-H5, und auf der gemischten THW-Ebene, BB-H10)
- Next action: understood (drei klar beschriftete Knöpfe je Karte; im Querformat failed für „Link“, BB-H4)
- System status: uncertain (Ladezähler gut; PDF bei langsamem Netz ohne Fortschritt, BB-H9; offline „komplett offline“ gegen „nicht geladen“, BB-H3)
- Error recovery: uncertain (Rückfrage vor dem Ersetzen gut, „Abbrechen“ hält den Dialog; beim zweiten Beispiel Wahl zwischen „sichern“ und „endgültig löschen“, BB-H1; Zurück-Geste wirft den Pfad weg, BB-H2)
- Field suitability: limited (online hochkant suitable; offline für OV-Bögen und im Querformat eingeschränkt)
