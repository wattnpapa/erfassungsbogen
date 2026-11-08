# Rollenaudits, Schwerpunkt Beispielbögen (Stand 08.11.2026)

Schwerpunktrunde außerhalb der Rundenzählung: zwölf Prüfberichte (elf THW-Rollen und
Mobile-UI), geprüft wurde nur der Bereich Beispielbögen. Prüfgegenstand ist die Live-Seite
https://erfassungsbogen.app/ auf Stand `main` Commit `0dd56d4`, also nach dem Umbau vom
08.11.2026: eigener Abschnitt „Beispielbögen“ auf der Startseite unter „So funktioniert’s“
mit Primärknopf „Beispielbögen ansehen“, Fußzeilen-Link entfallen, Dialog mit Register,
Pfadleiste, Bogenzahl und einzeiligen Aktionen. Gegen einen lokalen Produktionsbuild ließ
sich nicht prüfen, weil das private Submodul `vendor/bos-meldekopf` in der Prüfumgebung
fehlte. Reine Prüfberichte ohne Codeänderung. Befund-IDs `BB-<Rolle><Nr.>`.

| Bericht | P0 | P1 | P2 | P3 | Hinweise |
| --- | --- | --- | --- | --- | --- |
| [Neuer Nutzer](neuer-nutzer.md) | 0 | 0 | 1 | 7 | 9 |
| [Feldtauglichkeit](feldtauglichkeit.md) | 0 | 0 | 4 | 7 | 6 |
| [Arbeitsablauf](arbeitsablauf.md) | 0 | 2 | 4 | 4 | 6 |
| [Fehler und Wiederanlauf](fehler-und-wiederanlauf.md) | 0 | 1 | 3 | 6 | 5 |
| [Zerstörende Handlungen](zerstoerende-handlungen.md) | 0 | 1 | 1 | 2 | 5 |
| [Offline und Speicher](offline-und-speicher.md) | 0 | 0 | 2 | 2 | 3 |
| [Stress und Unterbrechung](stress-und-unterbrechung.md) | 0 | 1 | 4 | 4 | 6 |
| [Handschuh-Bedienung](handschuh-bedienung.md) | 0 | 0 | 3 | 3 | 4 |
| [Nacht und Sicht](nacht-und-sicht.md) | 0 | 0 | 1 | 1 | 6 |
| [Führungssicht](fuehrungssicht.md) | 0 | 1 | 4 | 3 | 6 |
| [Analog-first](analog-first.md) | 0 | 0 | 2 | 6 | 3 |
| [Mobile-UI](mobile-ui.md) | 0 | 1 | 2 | 6 | 4 |
| Summe der Berichte (mit Doppelungen) | 0 | 7 | 31 | 51 | 63 |

## Sachverhalte ohne Doppelungen

Viele Befunde beschreiben denselben Sachverhalt aus verschiedenen Rollen. Zusammengefasst
bleiben 21 Sachverhalte; die Priorität ist jeweils die höchste, die ein Bericht vergeben hat.

| Nr. | Sachverhalt | Höchste Prio. | Befunde |
| --- | --- | --- | --- |
| 1 | Ein zweites „Anzeigen“ verdrängt den eigenen Entwurf vom einzigen Rückholplatz „Zuletzt geschlossener Bogen“; die Rückfrage nennt das unveränderte Beispiel „angefangenen Bogen“ und bietet „alten Bogen endgültig löschen“ an | P1 | BB-D1, BB-W1, BB-E2, BB-H1, BB-N1; Folge in BB-K1, BB-A1 |
| 2 | Die Bögen der Ortsverbände (3 533 von 3 634 THW-Bögen) liegen nie im Offline-Vorrat, die Startseite meldet trotzdem „komplett offline“, die Meldung im Ordner verspricht ein Nachladen, das nicht kommt; einmal ohne Netz geöffnet fehlt der Ordner bis zum Neuladen | P1 | BB-S1, BB-O1, BB-H3, BB-E3 |
| 3 | Kein Sammelweg: mehrere Bögen nicht auswählbar, kein Sammel-PDF, kein „alle in Einsatz-Sammlung“; der Umweg über PDF und „Bögen einlesen…“ steht nirgends | P1 | BB-K1, BB-W4, BB-A1 |
| 4 | Register bricht bei 150–200 % Schrift und schon bei 320 px buchstabenweise um („AS/B“, „THW“ 0 px breit) | P1 | BB-M1 |
| 5 | Escape, Zurück-Geste oder Schließen während „Anzeigen“/„PDF“ bricht nicht ab; die Rückfrage erscheint Sekunden später in der eigenen Arbeit | P1 | BB-E1 |
| 6 | „Praktische Ausbildung › Einlagen Kräfte Hannover“: vier verschiedene Bögen mit gleichem Namen, die Sammlung führt sie still als eine Einheit (6 statt 27 Helfer) | P1 | BB-W2 |
| 7 | Ordnerpfad geht verloren: nach „Anzeigen“, Schließen, Escape und Neuladen beginnt der Dialog bei „Alle“; die Zurück-Geste schließt den Dialog statt eine Ebene hoch zu gehen; aus Bogen und Einsatz-Sammlung kein Zugang | P2 | BB-S3, BB-G3, BB-E4, BB-H2, BB-N2, BB-W3 |
| 8 | Beim Ordnerwechsel bleibt die Scrollposition, Pfadleiste und „‹ Zurück“ sind außer Sicht und nicht angeheftet; Fokus fällt auf `<body>`; Pfadleiste in tiefen Ordnern 190–235 px hoch, „›“ im Ordnernamen täuscht Ebenen vor, „Alle“ nur 24 px breit | P2 | BB-S4, BB-M3, BB-S8, BB-G4, BB-G5, BB-E7, BB-H5, BB-N3, BB-M4, BB-M5, BB-O4 |
| 9 | Zwischen etwa 545 und 900 px Fensterbreite (quer, Tablet) bleibt die Tabelle; „PDF“ angeschnitten, „Link“ außerhalb des Dialogs. Ursache: Umschaltung an `@media (max-width: 34rem)` statt an der Dialogbreite | P2 | BB-G1, BB-H4, BB-K2, BB-M2 |
| 10 | Keine Suche, kein Filter, keine Sortierung; ein OV nur über LV › RSt › OV (6–7 Tipps) | P2 | BB-S2, BB-K4, BB-W8 |
| 11 | Inhalte springen beim Nachladen: Karten rutschen bis 50 px (Fehltipp „Link“ → „Anzeigen“ der nächsten Karte), der OV-Ordner erscheint später über der Liste, die THW-Zahl springt von 101 auf 3 634 | P2 | BB-G2, BB-S5, BB-H10, BB-N6 |
| 12 | Übungskennzeichnung geht nach der Übernahme verloren: über Vorlage oder Zurückholen lässt sich „Übung“ ohne Rückfrage abwählen, die fiktiven Personen bleiben; Startseite, Vorlage und Rückfragen zeigen kein „Beispiel“; Ablage in echte Sammlung ohne Rückfrage | P2 | BB-D2, BB-D3, BB-D4, BB-E8, BB-N8, BB-W10, BB-W7 |
| 13 | Vielen OV-Ordnern öffnen verdrängt alle übrigen Beispielbögen und Themenfotos aus dem Gerät (gemeinsame Grenze `eeb-zusatz`, `maxEntries: 1500`) | P2 | BB-O2 |
| 14 | Taktische Zeichen in Dunkel und Nacht ohne helle Unterlage und Dämpfung (1,15 : 1); dem Bild fehlt die Klasse `einheit-avatar` | P2 | BB-L1 |
| 15 | Ein weitergegebener Beispiel-Link öffnet beim Teilnehmer als „Meldung einer fremden Einheit“; die App warnt vor dem Schritt, den er tun soll | P2 | BB-W6 |
| 16 | Beispieldaten veraltet und warnungsreich: vergangene Zeiträume („Stand vor 50/995 Tagen“), „Tippfehler im Jahr?“, Geschlecht nur vorbelegt, „Personal fehlt“; Übungslagen innerhalb eines Zuges verschieden | P2 | BB-W5, BB-K6, BB-H6, BB-N4, BB-E9, BB-A8, BB-W9 |
| 17 | Bezeichnungen in den Daten: Ländernamen in Versalien ohne Umlaut („BADENWUERTTEMBERG“, Ersatzwert in `ordnerLabel`), Doppelwörter in der Herkunft („SAR-Leitstelle SAR-Leitstelle Münster“), Herkunft je Ordner anders aufgebaut, lose Bögen neben Ordnern, fehlende Länder ohne Hinweis | P2 | BB-K5, BB-E10, BB-K8, BB-L2, BB-H7, BB-M8, BB-A7, BB-N5, BB-W8 |
| 18 | Meldekopf-Kasten der Beispiel-PDF passt weder zum Blanko-Vordruck noch zum Abgleich-Formular | P2 | BB-A2 |
| 19 | Ohne Netz: Fehlermeldung springt ans Listenende und bleibt nach Ordnerwechsel stehen, kein „Erneut laden“, kein Nachladen bei Netzrückkehr | P3 | BB-E5, BB-O3 |
| 20 | Rückmeldungen und Papier: PDF ohne Quittung (bei langsamem Netz 22 s), Dateiname ohne „Übung“/„Beispiel“ und mehrfach gleich, Wasserzeichen blass (8 %), Übungszeile nur auf Seite 1, keine Leerzeile für Nachträge | P3 | BB-H9, BB-A6, BB-A4, BB-A3, BB-A5, BB-S9 |
| 21 | Startseite und Dialoglage: Einstieg 2,2–3,4 Bildschirme tief, drei gleich gefärbte Primärknöpfe, „Schließen“ springt beim Ordnerwechsel, Doppeltipp öffnet falschen Unterordner, Feld-Modus 360 px bricht „Schließen“ unter den Titel | P3 | BB-N7, BB-M7, BB-S7, BB-M6, BB-G6, BB-E6, BB-H11, BB-M9 |

## Folgen des Umbaus vom 08.11.2026

Einige Befunde gehen direkt auf den Umbau zurück, der dieser Runde vorausging, und sind
deshalb zuerst zu beheben:

- Nr. 4 (BB-M1): Das Register lässt dem Namen neben Bogenzahl und „›“ keinen Mindestplatz.
- Nr. 9: `.beispiel-aktionen` bricht seit dem Umbau nicht mehr um; dadurch wird die Tabelle
  zwischen Kartengrenze und Desktop breiter als der Dialog.
- Nr. 8: Pfadleiste ohne Fokusführung, ohne Anheften, Pfadziele schmal.
- Nr. 21 (BB-M7): Der Primärknopf „Beispielbögen ansehen“ ist der dritte auf der Startseite.
- Hinweise: Der Aufklapper „Was sind Beispielbögen?“ verlor durch `display: flex` sein
  Aufklappzeichen (Nacht und Sicht H3, Feldtauglichkeit H1); der Reiter in der Kennfarbe im
  Register widerspricht laut Mobile-UI H3 einer Regel in DESIGN.md.

Hinweise mit Datenbezug, die über die Priorität hinaus geprüft werden sollten: Die fiktiven
OV-Bögen nennen echte Dienststellen-Mailadressen (Arbeitsablauf H3, z. B. eine Poststelle
eines Landesverbands), das DLRG-Beispiel eine echt wirkende Adresse (Neuer Nutzer H9).

## Stand der Behebung

Noch offen (08.11.2026).
