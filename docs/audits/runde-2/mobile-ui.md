# Audit „Mobile UI", Runde 2 (Darstellung und Bedienung auf Telefon und Tablet)

Stand: 28.09.2026 · Prüfer: Rollenaudit `mobile-ui-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/adoring-sagan-9vnriv`, Commit 354209b.

Reiner Prüfbericht, keine Codeänderung. Für diese Rolle gibt es keinen
Runde-1-Bericht.

## Prüfaufbau

Chromium (Playwright, `/opt/pw-browsers/chromium`), `isMobile`/`hasTouch`,
Locale de-DE. Viewports 320 × 568, 360 × 640, 390 × 844, 640 × 360 (Telefon
quer) und 820 × 1180 (Tablet). Jeder Viewport lief einmal mit normaler
Schrift und einmal mit 200 % Schriftgröße. Die 200 % habe ich als
`html { font-size: 200% !important }` eingespielt. Ein Inline-Stil am
`<html>` reicht dafür nicht, weil die App das `style`-Attribut beim Setzen
der Organisationsfarben überschreibt. Die App bemisst Schrift und Ziele in
`rem`, deshalb wirkt die Einstellung überall. Dazu kam ein Lauf mit
`prefers-reduced-motion: reduce`.

Zustände entstanden durch Bedienung und durch `localStorage`-Seeds aus
`examples/thw/`: `eeb.entwurf.v1` mit „THW Ulm Bergungsgruppe" (8 Personen,
2 Fahrzeuge) bzw. mit dem Großbogen (QR in 7 Teilen) und `eeb.einsaetze.v1`
mit einer Übungssammlung aus 24 Einheiten, davon 3 abgerückt. Geprüft habe
ich Startseite, Assistentenschritte 1 bis 6, Übersicht, Übergabe-Dialog samt
„Weitere Formate", QR-Vollbild (einteilig und segmentiert), Scanner ohne
Kamera, Einsatz-Sammlung als Karten und als Tabelle, Details, die Dialoge
„Einheit manuell erfassen", „Verschieben", „Entfernen", „Löschen",
„Datensicherung" und „Namen einfügen" sowie die Begleitseiten `anleitung`,
`datenschutz`, `meldekopf` und `vorlage`.

Gemessen habe ich:
- `scrollWidth` von Dokument und Layout-Fenster (`innerWidth`) gegen den
  sichtbaren Ausschnitt (`visualViewport`);
- die Lage und den Flächenanteil fester und klebender Elemente;
- Dialoge und Overlays: Rolle, `aria-modal`, Fokus beim Öffnen, Tab-Folge
  über 6 bis 25 Schritte, Escape, Fokus nach dem Schließen;
- ob die Seite hinter einem Overlay rollt, per Mausrad und per Wischen. Das
  Wischen habe ich über CDP `Input.dispatchTouchEvent` nachgestellt;
- Formularattribute (`type`, `inputmode`, `autocomplete`, Beschriftung) und
  zugängliche Namen, per Accessibility-Snapshot;
- Scrollposition und Fokus beim Wechsel von Schritt und Ansicht.

Skripte und Screenshots liegen außerhalb des Repositorys im Scratchpad.

**Prioritäten:** Der Skill verwendet Critical / High / Medium / Low. Ich habe
das auf P0 / P1 / P2 / P3 abgebildet (Critical → P0, High → P1, Medium → P2,
Low → P3).

**Kennzeichnung der Nachweise:** *gemessen* heißt im Testbrowser
reproduziert. *Plausibles Risiko* heißt aus Messung oder CSS abgeleitet, auf
einem Gerät aber nicht beobachtet. *Nicht prüfbar* ist in einem eigenen
Abschnitt gesammelt.

Getestet habe ich zuerst ohne Blick in die anderen Runde-2-Berichte. Danach
habe ich sie gelesen. Wo sich ein Befund mit einem THW-Rollenbericht deckt,
verweise ich auf dessen Kennung und zähle ihn nicht mit. Die eigenen Befunde
liegen dort, wo die Rollenberichte nicht hinsehen: Schriftskalierung,
Overlay-Semantik, zugängliche Namen, Formularattribute und Safe-Area.

## Urteil

Bei normaler Schriftgröße ist die App auf dem Telefon solide gebaut. Von 320
bis 820 px läuft keine Seite seitlich über, mit einer Ausnahme: die
Einsatz-Tabelle (R2-G2). Eingabefelder haben 16 px Schrift und 44 px Höhe.
Die feste Fußleiste belegt 8 bis 17 % der Höhe. Die nativen Dialoge fangen
den Fokus, schließen mit Escape und geben den Fokus zurück. Der Scanner hält
„Abbrechen" mit `100dvh` und klebender Leiste auf jeder Höhe im Bild. Die
Rückmeldungen aus Runde 1 zur Querlage und zu `scroll-padding` sind sichtbar
umgesetzt.

Bei doppelter Schriftgröße bricht dieses Gerüst. Mehrere Stellen setzen
Text ohne Umbruch (Stärke „0 / 2 / 6 / 8", Bedarfsmarken, Summenleiste,
Vorschlagsfeld). Dadurch wird die Seite breiter als das Gerät, das
Layout-Fenster wächst mit, und feste Elemente wandern aus dem Bild. Auf 360 ×
640 liegt dann in Schritt 3 die ganze Fußleiste mit „Weiter" unter dem
sichtbaren Ausschnitt. Im QR-Vollbild ist „Schließen" nicht erreichbar.
Hinzu kommen zwei Punkte, die Vorlese- und Tastaturnutzer treffen: Die
beiden Vollbild-Overlays (QR und Scanner) sind nicht modal, und die
Einheitenkarten am Meldekopf haben weder Überschriften noch eindeutige
Knopfnamen.

Die Hauptaufgabe, einen Bogen erfassen und übergeben, gelingt bei normaler
Schrift auf allen geprüften Größen. Mit 200 % Schrift gelingt sie auf dem
Telefon nur, wenn man die Seite von Hand herauszoomt.

## Befunde

### R2-M1 [P1] Bei 200 % Schriftgröße wird die Seite breiter als das Gerät, Fußleiste und „Weiter" wandern aus dem Bild (neu)

**Priorität:** P1

**Nachweis:** gemessen (Schrift per `html { font-size: 200% }`, siehe
Prüfaufbau). Wie die Systemschrift echter Geräte wirkt, habe ich nicht
geprüft.

**Fundstelle:** Assistent (Schritte 1, 3, 5), Übersicht, Einsatz-Sammlung,
Begleitseiten; 320 × 568, 360 × 640, 390 × 844 und 640 × 360.

**Beobachtung / Messwert:**

| Ansicht (200 %) | Dokumentbreite | Ursache (gemessen) |
| --- | --- | --- |
| Übersicht, 360 × 640 | 466 px | Stärke `strong` „0 / 2 / 6 / 8" mit `white-space: nowrap` |
| Schritt 3 „Personal", 360 × 640 | 482 px | Feld „Funktion hinzufügen" (`span.autocomplete`) |
| Einsatz-Sammlung, 360 × 640 | 442 px | Marken „Unterbringung angefordert", „alt" (`nowrap`) |
| Einsatz-Sammlung, 640 × 360 | 968 px | Summenleiste (`div.gesamt`) |
| Einsatz-Tabelle, 360 × 640 | 3 348 px | wie R2-G2, verdoppelt |
| Anleitung / Datenschutz / Vorlage | 542 / 625 / 561 px | Inhaltsverzeichnis-Links bis 480 px, lange Links |
| Startseite | 391 px | – |

Die Folgen am Assistenten, 360 × 640:
- **Schritt 1:** Die Fußleiste ist 179 px hoch, also 28 % des Bildes. Die
  Knöpfe sind 133 px hoch, weil „← Zurück" und „Weiter →" zweizeilig
  umbrechen. „Weiter →" reicht von 272 bis 439 px und steht damit 79 px über
  den rechten Rand hinaus; im Bild ist „Wei…" zu lesen. Die Überschrift
  „1. Einheit" beginnt bei 1 556 px, zweieinhalb Bildhöhen tiefer.
- **Schritt 3:** Das Dokument ist 482 px breit, das Layout-Fenster wächst mit
  (`innerHeight` 857). Die Fußleiste beginnt bei 678 px, also *unterhalb* des
  sichtbaren 640-px-Ausschnitts. „Zurück" und „Weiter" sind ohne
  Herauszoomen nicht zu sehen.
- **390 × 844, Schritt 5:** Die Fußleiste ist 227 px hoch (27 %), „Zur
  Übersicht →" reicht bis 488 px.

Bei 100 % bleibt jede dieser Ansichten auf allen fünf Viewports in der
Gerätebreite.

**Auswirkung:** Wer die Systemschrift hochstellt, etwa wegen Lesebrille,
Sonnenlicht oder Sehschwäche, verliert auf dem Telefon die Navigation des
Assistenten. Den Primärknopf findet er nur durch seitliches Wischen oder
durch Herauszoomen. Herauszoomen macht die vergrößerte Schrift wieder klein.
Beim seitlichen Wischen rutscht die Seite weg, wie in R2-G2 für die Tabelle
beschrieben. Kopf und Fußleiste lassen im ersten Bild kein Formularfeld
übrig (vgl. R2-H7 bei 100 %).

**Empfehlung:** Text, der auf 320 px mit doppelter Schrift nicht passt, muss
umbrechen dürfen: Stärke, Marken, Summen, Vorschlagsfeld und
Inhaltsverzeichnis. Die Fußleiste soll bei großer Schrift nicht mitwachsen.
Die Knöpfe bleiben dann einzeilig, notfalls mit kürzerem Text („Weiter"). Der
Assistenten-Kopf soll sich bei großer Schrift verdichten, wie es im
Querformat schon geschieht.

**Verifikation:** 360 × 640 und 320 × 568 bei 200 % Schrift, alle Schritte,
Übersicht, Einsatz (Karten) und Begleitseiten. `document.documentElement.scrollWidth`
muss gleich der Gerätebreite sein. Die Fußleiste mit beiden Knöpfen muss
vollständig im Bild stehen, und über der Fußleiste muss mindestens ein
Eingabefeld sichtbar sein.

### R2-M2 [P2] QR-Vollbild rollt nicht und passt nicht sicher ins Bild; „Schließen" kann unerreichbar werden (neu; Umfeld R2-H5, R2-O7)

**Priorität:** P2

**Nachweis:** gemessen. Das Verhalten bei eingeblendeter Browserleiste ist
ein plausibles Risiko.

**Fundstelle:** Übersicht → „Bogen übergeben…" → „QR-Code im Vollbild
zeigen" (`div.qr-vollbild`).

**Beobachtung / Messwert:**
- Das Overlay ist `position: fixed; inset: 0` mit `overflow: visible` und
  rollt nicht. Die Bildgröße richtet sich nach `vh`
  (`min(92vw − 3rem, 68vh − 3rem)`).
- **Segmentierter Bogen (7 Teile), 640 × 360 quer, 100 %:** Der Inhalt ist
  365 px hoch bei 360 px Fenster. „← Voriger Teil", „Nächster Teil →" und
  „Schließen" liegen bei 321–365 px, sind also 5 px abgeschnitten. Das
  QR-Bild beginnt bei −5 px, die Ruhezone fängt das auf.
- **200 % Schrift, 360 × 640:** Die Übersicht ist 466 px breit (R2-M1), und
  das Overlay folgt dem vergrößerten Layout-Fenster (466 × 827). „Schließen"
  liegt bei 619–707 px, unter dem sichtbaren Ausschnitt, und der QR-Code ist
  rechts abgeschnitten. Playwright kann „Schließen" nicht in den sichtbaren
  Bereich rollen, der Klick scheitert.
- Escape schließt das QR-Vollbild nicht (geprüft bei 360, 390 und 640 px).
  Der Scanner schließt mit Escape.

Aus dem CSS: Der Scanner wurde für genau diesen Fall umgebaut, mit `100dvh`
und rollendem Overlay; der Kommentar dort beschreibt, dass `inset: 0` bei
sichtbarer Browserleiste den Ausgang verdeckt. Das QR-Vollbild hat diese
Behandlung nicht. Plausibles Risiko: Auf einem Telefon quer mit
eingeblendeter Browserleiste fehlen mehr als 5 px. Ein segmentierter Bogen
lässt sich dann nicht weiterblättern.

**Auswirkung:** Die Übergabe per QR ist der Kernweg der App. Wer das Gerät
quer hält oder mit großer Schrift arbeitet, sieht die Blätterknöpfe
angeschnitten oder gar nicht. Zum Schließen bleibt nur die Zurück-Geste, und
die springt einen Schritt zu weit (R2-H5). Am Meldekopf-Laptop fehlt dazu
Escape.

**Empfehlung:** Das QR-Vollbild wie den Scanner behandeln: Höhe nach `dvh`,
das Overlay rollt, und die Knopfleiste klebt unten. Im Querformat Code und
Knöpfe nebeneinander setzen. Escape schließt.

**Verifikation:** Großbogen, 640 × 360 und 360 × 640 bei 200 % Schrift:
Code, „Nächster Teil →" und „Schließen" müssen vollständig sichtbar oder
per Rollen erreichbar sein, und Escape muss schließen.

### R2-M3 [P2] QR-Vollbild und Scanner sind nicht modal: Fokus bleibt dahinter, die verdeckte Seite ist bedienbar und rollt (neu)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle:** QR-Vollbild (`div.qr-vollbild`) und Scanner (`div.scanner`),
360 × 640. Zum Vergleich die nativen Dialoge „Bogen übergeben",
„Einheit für den Einsatz erfassen?" und „Namen einfügen".

**Beobachtung / Messwert:**

| Prüfung | Native Dialoge | QR-Vollbild | Scanner |
| --- | --- | --- | --- |
| Rolle / modal | `<dialog>`, `:modal` | `role="dialog"`, kein `aria-modal` | `role="dialog"`, kein `aria-modal` |
| Fokus nach dem Öffnen | im Dialog („Schließen" bzw. Aktion) | bleibt auf „Bogen übergeben…" hinter dem Overlay | bleibt auf „QR-Code scannen…" hinter dem Overlay |
| Tab-Folge | bleibt im Dialog | 8 von 8 Schritten auf verdeckten Knöpfen („In Einsatz aufnehmen…", „Als Vorlage speichern", „Neuer Bogen", „Bearbeiten" …) | 4 von 6 Schritten auf verdeckten Elementen (Dateifeld, „Neue Einsatz-Sammlung…", „Einheit schnell erfassen…") |
| Escape | schließt | schließt nicht (R2-M2) | schließt |
| Seite dahinter rollt | ja, siehe R2-M8 | ja: Wischen auf dem Code 1 295 → 1 717 px | ja: Mausrad 396 → 796 px |
| Fokus nach dem Schließen | zurück auf den Auslöser | auf `BODY`, Seite an anderer Stelle als vorher | – |

„Schließen" im QR-Vollbild schließt zugleich den Übergabe-Dialog. Man
landet auf der Übersicht, aber nicht an der Stelle, von der man kam.

**Auswirkung:**
- *Gemessen:* Tastaturnutzer, etwa am Meldekopf-Laptop oder mit
  Bluetooth-Tastatur am Tablet, bewegen den Fokus unsichtbar über die
  verdeckte Seite.
- *Plausibles Risiko:* Bei TalkBack oder VoiceOver erreicht die
  Wischnavigation Knöpfe, die hinter dem Overlay liegen. Der Nutzer hört „Neuer
  Bogen", während er den QR-Code zeigt. Ein Enter ohne vorher gepufferte
  Handscanner-Zeichen betätigt den fokussierten Knopf hinter dem Scanner. Der
  Handscanner-Lauscher fängt Enter nur ab einer Mindestlänge ab
  (`qr-scanner-web.tsx`).

**Empfehlung:** Beide Overlays als modale Dialoge führen, am einfachsten als
`<dialog>` mit `showModal()` wie die übrigen Dialoge. Beim Öffnen den Fokus
auf den Ausgang oder die Überschrift setzen, beim Schließen auf den
Auslöser zurückgeben, und die Seite dahinter festhalten.

**Verifikation:** QR-Vollbild und Scanner öffnen und 10× Tab drücken: Der
Fokus muss im Overlay bleiben. Auf dem Overlay wischen: `scrollY` der Seite
muss gleich bleiben. Schließen: Der Fokus muss auf „Bogen übergeben…" bzw.
„QR-Code scannen…" stehen. Mit TalkBack durch das QR-Vollbild wischen: Nur
Code, Hinweis und Knöpfe dürfen angesagt werden.

### R2-M4 [P2] Einsatz-Sammlung: Einheitenkarten ohne Überschrift und Liste, 24 gleichlautende Knopfsätze (neu; Umfeld R2-K7, R2-H9)

**Priorität:** P2

**Nachweis:** gemessen (DOM und Accessibility-Snapshot). Mit einem echten
Vorleseprogramm nicht geprüft.

**Fundstelle:** Einsatz-Sammlung, Kartenansicht, 24 Einheiten.

**Beobachtung / Messwert:**
- Der Einheitsname steht in einem `span.muster-name`, nicht in einer
  Überschrift. Die Karten sind keine Listeneinträge (`div.einheit-zeile`,
  keine `ul`/`li`). Die Überschriftenfolge der Seite springt von
  „Einheiten (24 gemeldet · 21 zählend)" (240 px) direkt zu
  „Einsatz verwalten" (11 102 px).
- Die Knöpfe tragen keinen Einheitsbezug im zugänglichen Namen:

  | Knopfname | Anzahl |
  | --- | --- |
  | „ändern" | 27× |
  | „Details" | 24× |
  | „Bogen als PDF" | 24× |
  | „Zug zuordnen" | 24× |
  | „Auftrag/Notiz" | 24× |
  | „Verschieben…" | 24× |
  | „Entfernen" | 24× |
  | „Abrücken" | 21× |
  | „1 Lücke" | 10× |

  Im Assistenten ist das gelöst: „Person 2 entfernen", „Lehmann, Karsten
  entfernen", „Erreichbarkeit 5556134834 entfernen".

**Auswirkung:** Ein Nutzer mit Vorleseprogramm kann nicht von Einheit zu
Einheit springen, sondern muss sich durch rund 9 Knöpfe je Karte wischen.
Eine Knopfliste zeigt 21× „Abrücken" ohne Einheit. Wer darüber abrückt oder
entfernt, trifft die Einheit nur über ihre Position; „Abrücken" wirkt ohne
Rückfrage (R2-H4, R2-G4).

**Empfehlung:** Jede Einheit als Listeneintrag mit dem Namen als Überschrift
(h3) setzen. Knöpfe über `aria-label` oder `aria-describedby` mit dem
Einheitsnamen verbinden, etwa „Abrücken: THW Albstadt Zugtrupp", wie es der
Assistent schon macht.

**Verifikation:** Accessibility-Snapshot der Kartenansicht: 24 Überschriften
der Ebene 3 mit Einheitsnamen, und kein Knopfname kommt mehr als einmal ohne
Einheitsbezug vor.

### R2-M5 [P3] Personal-Schnelleingabe: Namensfelder ohne zugänglichen Namen, „Namen einfügen" nur mit Platzhalter (neu)

**Priorität:** P3

**Nachweis:** gemessen (Accessibility-Snapshot).

**Fundstelle:** Schritt 3 → „Schnelleingabe (Tabelle)" sowie der Dialog
„Namen einfügen…".

**Beobachtung / Messwert:**
- Die 16 Textfelder für Vor- und Nachname (8 Personen) haben keinen
  zugänglichen Namen. Der Snapshot zeigt `textbox: Karsten`, also nur den
  Wert. Die Auswahlfelder derselben Zeile heißen dagegen „Person 1: Zählt
  als" und „Person 1: Geschlecht".
- Im Dialog „Namen einfügen" hat das Textfeld kein `<label>`. Sein Name
  stammt aus dem Platzhalter „Muster, Max / Erika Musterfrau / …", und der
  verschwindet mit der ersten Eingabe.

**Auswirkung:** Bei der Navigation von Feld zu Feld (Vorleser,
Bildschirmtastatur mit „Weiter"-Taste) ist nicht zu hören, ob gerade Vor-
oder Nachname dran ist. Ein leeres Feld wird nur als „Bearbeitungsfeld"
angesagt. Vertauschte Namen landen auf dem Bogen.

**Empfehlung:** Die Textfelder so benennen wie die Auswahlfelder („Person 1:
Vorname", „Person 1: Nachname"). Das Textfeld in „Namen einfügen" mit einer
sichtbaren Beschriftung versehen.

**Verifikation:** Snapshot der Tabelle: jedes Textfeld mit Namen „Person n:
Vorname/Nachname". Im Dialog hat das Textfeld einen Namen, auch wenn Text
darin steht.

### R2-M6 [P3] Formularattribute laden das Autofill des Telefons zu falschen Einträgen ein (neu)

**Priorität:** P3

**Nachweis:** Die Attribute sind gemessen. Die Wirkung ist ein plausibles
Risiko; Autofill und Autokorrektur lassen sich im Testbrowser nicht
nachstellen.

**Fundstelle:** Schritt 1 „Zugehörigkeit / Kontaktstellen", Schritt 3
Personenkarten, Schritt 4 Fahrzeuge.

**Beobachtung / Messwert:**
- Telefon und E-Mail der Dienststellen OV/RB/LV (je 3×) tragen
  `autocomplete="tel"` bzw. `autocomplete="email"`. Diese Werte stehen im
  Browser für die *eigenen* Kontaktdaten des Gerätebesitzers.
- Vorname und Nachname der Personenkarten haben kein `autocomplete`, also
  greift der Browser-Standard. Die Beschriftungen „Vorname" und „Nachname"
  sind typische Auslöser für Namensvorschläge.
- „Kennzeichen" (Platzhalter „OL-FW 2041 / THW-84397"), „Kennzahlen" und
  „Dienststellen-Kürzel" haben weder `autocapitalize="characters"` noch
  `spellcheck="false"`.
- Richtig gesetzt ist dagegen „Name/Kontakt hinterlegen" (Absender):
  `name`, `email`, `tel`. Dort sind die eigenen Daten gemeint.

**Auswirkung:** Das Telefon bietet für die OV-Rufnummer die private
Handynummer des Helfers an. Ein Tipp auf den Vorschlag, und die
Privatnummer steht als Dienststellenkontakt auf dem Bogen, der an den
Meldekopf geht. In den Personenkarten schlägt das Telefon den eigenen Namen
für jede Person vor. Beim Kennzeichen kann die Autokorrektur
Buchstabenfolgen verändern oder kleinschreiben.

**Empfehlung:** Die Kontaktfelder der Dienststellen und die Personennamen
mit `autocomplete="off"` versehen (Personen gegebenenfalls
`autocomplete="section-person-n …"` nur dort, wo Autofill gewollt ist).
Kennzeichen, Kennzahlen und Kürzel mit `autocapitalize="characters"`,
`autocorrect="off"` und `spellcheck="false"`.

**Verifikation:** Auf einem Android- und einem iOS-Telefon mit hinterlegter
eigener Kontaktkarte das Feld „Telefon" der OV-Zeile und „Vorname" einer
Person antippen: Es darf kein Kontaktvorschlag erscheinen. „thw 84397" ins
Kennzeichen tippen: Es erscheint in Großbuchstaben und unverändert.

### R2-M7 [P3] Safe-Area der Fußleiste: eine spätere Regel hebt „max()" und die Querformat-Verdichtung auf (neu)

**Priorität:** P3

**Nachweis:** Der berechnete Stil ist gemessen. Die Wirkung auf Geräten mit
Home-Indikator ist ein plausibles Risiko: `env(safe-area-inset-*)` ist im
Testbrowser 0.

**Fundstelle:** `footer.nav` im Assistenten; `index.html`, Regeln um Zeile
1119 und 1158 gegen die spätere Regel im Safe-Area-Block (um Zeile 2331).

**Beobachtung / Messwert:**
- Die erste Regel setzt `padding-bottom: max(0.7rem, env(safe-area-inset-bottom))`.
  Ihr Kommentar begründet ausdrücklich „max() statt Addition". Die
  Querformat-Regel setzt `max(0.25rem, …)`.
- Eine spätere, gleich spezifische Regel setzt
  `padding-bottom: calc(0.7rem + env(safe-area-inset-bottom))`, ebenso links
  und rechts `calc(1rem + env(…))`, und gewinnt.
- Gemessen bei 640 × 360: `padding-bottom` 11,2 px statt der vorgesehenen
  4 px. Die Fußleiste ist 60 px hoch statt rund 53 px. Die
  Querformat-Verdichtung wirkt oben (4 px), unten nicht.

**Auswirkung:** Auf einem Telefon mit Home-Indikator (Hochformat typisch
34 px) wird die Fußleiste rund 11 px höher als beabsichtigt, im Querformat
kommen die 7 px aus der Messung dazu. Das ist wenig. Es trifft aber genau
die Querlage, in der der Bericht R2-H7 und der CSS-Kommentar jeden Pixel
Formular zählen.

**Empfehlung:** Die spätere Safe-Area-Regel für `footer.nav` streichen oder
auf `max()` umstellen, damit die Querformat-Regel greift.

**Verifikation:** 640 × 360: berechnetes `padding-bottom` der Fußleiste
4 px. Mit simuliertem Inset von 34 px (iOS-Simulator) ist das
`padding-bottom` 34 px, nicht 45 px.

### R2-M8 [P3] Native Dialoge: Die Seite dahinter rollt beim Wischen mit (neu)

**Priorität:** P3

**Nachweis:** gemessen (Wischen per CDP-Touch, Mausrad).

**Fundstelle:** Übergabe-Dialog, „Einheit für den Einsatz erfassen?",
360 × 640.

**Beobachtung / Messwert:** Bei offenem Übergabe-Dialog rollte ein Wischen
auf der abgedunkelten Fläche die Übersicht von 417 auf 852 px, ein zweites
Wischen auf 1 295 px. Beim Dialog „Einheit für den Einsatz erfassen?" rollte
das Mausrad die Einsatzansicht von 587 auf 987 px. Der Dialog selbst bleibt
stehen. `body` und `html` bleiben `overflow: visible`.

**Auswirkung:** Nach dem Schließen steht die Seite woanders als vor dem
Öffnen. Wer gerade eine bestimmte Einheit in der Liste im Blick hatte, sucht
sie neu (vgl. R2-H4 und R2-S3 zu Sprüngen in der Einsatzansicht). Kein
Datenrisiko.

**Empfehlung:** Solange ein modaler Dialog offen ist, die Seite festhalten,
etwa mit `overflow: hidden` am Dokument oder
`overscroll-behavior: contain` am Dialog.

**Verifikation:** Dialog öffnen, dreimal auf der Abdeckung wischen,
schließen: `scrollY` wie vor dem Öffnen.

## Bestätigt aus anderen Runde-2-Berichten

Diese Stellen habe ich unabhängig beobachtet. Sie sind dort beschrieben und
werden hier nicht als eigene Befunde gezählt.

- **R2-H1** ([feldtauglichkeit.md](feldtauglichkeit.md)): Beim
  Schrittwechsel bleibt die Scrollposition stehen. Ich habe es mit
  reduzierter Bewegung gemessen: Aus Schritt 2 unten (962 px) öffnet
  „Weiter →" Schritt 3 bei 1 754 px, „3. Personal" steht bei −1 309 px. Im
  Bild sind die Erreichbarkeit von Person 1 und der Anfang von Person 2. Für
  Vorleser kommt hinzu: Der Fokus bleibt auf „Weiter →", die neue Überschrift
  wird weder fokussiert noch angesagt. Die Empfehlung in R2-H1 (Fokus auf die
  Überschrift) deckt das ab.
- **R2-S3** ([stress-und-unterbrechung.md](stress-und-unterbrechung.md)):
  Startseite bei 1 194 px → „Öffnen" → Einsatzansicht bei 1 194 px. Die
  Einsatzüberschrift steht bei −1 072 px, im Bild sind Export-Knöpfe und
  Filter. Dasselbe gilt für „Neuen Bogen erstellen" (343 px übernommen,
  „1. Einheit" bei −15 px).
- **R2-G2 / R2-K5** ([handschuh-bedienung.md](handschuh-bedienung.md),
  [fuehrungssicht.md](fuehrungssicht.md)): Die Einsatz-Tabelle macht die
  Seite breit. Die Werte sind auf allen fünf Viewports gleich: 1 685 px
  Dokumentbreite; bei 320 bis 390 px wächst das Layout-Fenster auf das Vierfache der
  Gerätebreite (360 → 1 440, 390 → 1 560). Ursache sind die `span.nur-sr`
  in den Spaltenköpfen (`position: absolute`, der Rollrahmen ist `static`
  und schneidet sie nicht ab). Per `scrollTo` ließ sich die Seite auf
  `scrollX` 245 schieben, rechts nur leere Fläche. Bei 200 % Schrift sind es
  3 348 px (R2-M1).
- **R2-H7** ([feldtauglichkeit.md](feldtauglichkeit.md)): Der
  Assistenten-Kopf ist groß. Bei 320 × 568, Schritt 5, reichen Kopf und
  Übungsband bis rund 440 px. Die Fußleiste ist 91 px hoch, weil
  „← Zurück" und „Zur Übersicht →" zweizeilig umbrechen. Dazwischen steht nur
  der Anfang der Schrittüberschrift, kein Feld.
- **R2-H8** ([feldtauglichkeit.md](feldtauglichkeit.md)): Die Datumsfelder
  in Schritt 2 sind abgeschnitten („09/28/202"). Das US-Format ist eine
  Eigenheit von headless Chromium, die Breite von 112 px nicht.
- **R2-H5** ([feldtauglichkeit.md](feldtauglichkeit.md)): Geräte-Zurück bei
  offenem Übergabe-Dialog (Einstieg über „Fortsetzen") schließt den Dialog
  und verlässt den Assistenten Richtung Startseite. Aus dem QR-Vollbild
  landet man ebenfalls auf der Startseite.
- **R2-G3** ([handschuh-bedienung.md](handschuh-bedienung.md)): Die
  Zielmaße sind dieselben: Schrittleiste 78–136 × 40 px, „ändern"
  41 × 28 px, „1 Lücke" 47 × 30 px, Chip-✕ 32 × 32 px, „Weitere Formate"
  (Aufklapper im Übergabe-Dialog) 29 px hoch.
- **R2-L4** ([nacht-und-sicht.md](nacht-und-sicht.md)): Fokusrahmen in der
  Schrittleiste; nicht erneut gemessen, im Screenshot bestätigt.

## Beobachtungen je Viewport

| Viewport | 100 % Schrift | 200 % Schrift |
| --- | --- | --- |
| 320 × 568 | Kein Überlauf außer Tabelle. Fußleiste 67 px (12 %), in Schritt 5 91 px (zweizeilige Knöpfe). Dialog „Datensicherung" rollt, „Sicherung erstellen…" halb am Rand. | Seite bis 482 px breit, Fußleiste 179 px (31 %), „Weiter" bis 439 px. |
| 360 × 640 | Kein Überlauf außer Tabelle. Fußleiste 67 px (10 %). E-Mail-Felder der RB/LV-Zeile 167 px breit, Adressen abgeschnitten. | „Weiter" außerhalb, in Schritt 3 die ganze Fußleiste unter dem Bild, „Schließen" im QR-Vollbild unerreichbar. |
| 390 × 844 | Kein Überlauf außer Tabelle. Fußleiste 8 %. Übergabe-Dialog vollständig im Bild. | Fußleiste 227 px in Schritt 5, Übersicht 465 px, Einsatz 442 px. |
| 640 × 360 | Kopf verdichtet. Fußleiste 60 px (17 %). Übergabe-Dialog rollt ab „Link teilen". QR segmentiert 5 px abgeschnitten (R2-M2). | Einsatz 968 px breit, Dialoge belegen 81 % der Höhe und rollen. |
| 820 × 1180 | Zweispaltige Formulare, Karten mit Knopfzeilen, gut nutzbar. Nur die Tabelle läuft über (R2-G2/R2-K5). | nicht gesondert geprüft |

## Was gut funktioniert

- Bei 100 % läuft von 320 bis 820 px keine Ansicht seitlich über, außer der
  Einsatz-Tabelle. Auch die Begleitseiten und alle Dialoge bleiben in der
  Breite.
- Eingabefelder haben 16 px Schrift (kein Auto-Zoom unter iOS) und 44 px
  Höhe. `type="tel"`/`"email"`/`"date"`/`"number"` und
  `inputmode="numeric"`/`"tel"` sind überwiegend passend gesetzt (Ausnahme:
  Sofortbedarf, siehe R2-G5).
- Das Viewport-Meta erlaubt Zoomen (`width=device-width, initial-scale=1,
  viewport-fit=cover`, kein `user-scalable=no`). Damit bleibt bei R2-M1 und
  R2-M2 wenigstens der Notweg über das Herauszoomen.
- Die nativen Dialoge fangen den Fokus, schließen mit Escape, geben den
  Fokus an den Auslöser zurück und rollen in sich, wenn sie höher als das
  Fenster sind.
- Der Scanner: klebende Aktionsleiste mit Safe-Area, `100dvh`, rollendes
  Overlay, Escape. „Abbrechen" war auf allen Viewports erreichbar.
- Schrittleiste mit `aria-current="step"` und Status im Namen („3. Personal —
  ausgefüllt"), Themenwahl und Karten/Tabelle als `aria-pressed`-Gruppen,
  Tabellenrahmen mit `role="region"`, `tabindex="0"` und dem Namen
  „… — seitlich rollbar". Die Knöpfe im Assistenten tragen eindeutige Namen
  („Person 2 an die erste Stelle").
- `prefers-reduced-motion: reduce` schaltet Übergänge und Animationen ab.
  Die zwei Farbquittungen bleiben bewusst erhalten, sie bewegen nichts. Es
  gibt kein weiches Scrollen, das dabei stören könnte.
- Die Querformat-Verdichtung des Assistenten-Kopfs wirkt (bis auf R2-M7).
  `scroll-padding-bottom` hält ein fokussiertes Feld über der Fußleiste.

## Nicht prüfbar

- Echte Geräte: Systemschriftgröße unter Android und iOS, Safari-Seitenzoom,
  Autofill-Vorschläge, Autokorrektur, Kamera.
- Bildschirmtastatur: Ob „Weiter" oder ein Dialogknopf bei offener
  Tastatur verdeckt wird, ließ sich nicht nachstellen.
- Safe-Area-Einsätze (Notch, Home-Indikator): `env()` ist im Testbrowser 0,
  R2-M7 ist deshalb aus dem berechneten Stil abgeleitet.
- Eingeblendete oder ausgeblendete Browserleiste (Unterschied zwischen `vh`
  und `dvh`) für R2-M2.
- Vorleseprogramme (TalkBack, VoiceOver). R2-M3 bis R2-M5 beruhen auf
  Accessibility-Snapshot, DOM und Tab-Folge.
- Die PDF-Vorschau (headless Chromium zeigt eine dunkle Fläche).

## Abschluss

- **Aufgabe geschafft:** Bogen erfassen und übergeben bei normaler Schrift
  auf allen fünf Viewports: ja. Bei 200 % Schrift auf dem Telefon: nur mit
  Herauszoomen (R2-M1, R2-M2).
- **Größtes Mobile-Risiko:** Mit hochgestellter Schrift verschwinden
  „Weiter" und die ganze Fußleiste aus dem Bild, und das QR-Vollbild lässt
  sich nicht über „Schließen" verlassen (R2-M1, R2-M2).
- **Was zuerst beheben:**
  1. Kein Text ohne Umbruch, der die Seite verbreitert, und eine
     Fußleiste, die bei großer Schrift einzeilig bleibt (R2-M1). Das behebt
     zugleich den Kern von R2-M2 bei großer Schrift.
  2. Das QR-Vollbild wie den Scanner bauen: rollend, `dvh`, klebende
     Knöpfe, Escape (R2-M2).
  3. QR-Vollbild und Scanner als modale Dialoge mit Fokusführung (R2-M3).
  4. Einheitenkarten mit Überschrift und eindeutigen Knopfnamen (R2-M4).
  5. Die `nur-sr`-Spaltenköpfe der Einsatz-Tabelle einfangen (R2-G2); das
     ist eine Zeile CSS mit großer Wirkung auf allen Größen.
- **Top-Priorität für die nächste Iteration:** R2-M1. Die App muss mit
  doppelter Schrift auf 320 bis 390 px ohne seitliches Überlaufen
  funktionieren, und die Fußleiste mit „Weiter" muss immer vollständig im
  Bild stehen.
