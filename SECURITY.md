# Sicherheit

Dieses Dokument beschreibt, wie Schwachstellen in der App „Erfassungsbogen" und
den zugehörigen Bibliotheken gemeldet werden.

## Geltungsbereich

Der Meldeweg gilt für das Hauptrepository und die vier eingebundenen Submodule
unter `vendor/`. Alle fünf werden von derselben Person betreut, eine Meldung
genügt also auch dann, wenn unklar ist, in welchem Teil der Fehler steckt.

| Repository | Inhalt |
| --- | --- |
| [oc000172112778/erfassungsbogen](https://gitlab.opencode.de/oc000172112778/erfassungsbogen) (Open CoDE) | Die App selbst (Web, Desktop, iOS/Android) |
| [wattnpapa/eeb-format](https://github.com/wattnpapa/eeb-format) | Datenmodell, Transportcodec (Base41, Segmentierung), Ed25519-Signatur |
| [wattnpapa/bos-meldekopf](https://github.com/wattnpapa/bos-meldekopf) | Meldekopf-Kern (Sammlung und Auswertung eingehender Bögen) |
| [wattnpapa/bos-vokabulare](https://github.com/wattnpapa/bos-vokabulare) | Vokabulare für Organisationen, Einheiten, Qualifikationen |
| [wattnpapa/bos-taktische-zeichen](https://github.com/wattnpapa/bos-taktische-zeichen) | Taktische Zeichen als SVG |

Das Hauptrepository liegt auf Open CoDE, der Open-Source-Plattform der
öffentlichen Verwaltung. Die vier Submodule liegen vorerst weiter auf GitHub;
der Meldeweg unten gilt unverändert für alle fünf.

Nicht in den Geltungsbereich fallen die Installationen einsetzender
Organisationen: Die App hat keinen Server und keinen zentralen Betreiber, jede
Organisation betreibt sie auf ihren eigenen Geräten. Für Geräteabsicherung,
Rollout und die organisatorischen Maßnahmen ist die jeweilige Organisation
zuständig; siehe
[docs/informationssicherheitskonzept.md](docs/informationssicherheitskonzept.md).

## Unterstützte Versionen

Gepflegt wird der jeweils aktuelle Stand von `main` und das daraus gebaute
letzte Release. Ältere Releases bekommen keine Nachbesserungen: Die Web-App
unter <https://erfassungsbogen.app> wird mit jedem Release neu ausgeliefert, für
Desktop- und Mobilinstallationen ist ein Update auf die aktuelle Version der
Weg.

## Meldung

Bitte Schwachstellen nicht über öffentliche Issues, Merge Requests, Pull
Requests oder Diskussionen melden. Diese Wege stehen offen:

- **E-Mail** an <johannes.rudolph@thw-oldenburg.de> (bevorzugt), Betreff mit
  dem Wort „Sicherheit". Dieser Weg gilt für alle fünf Repositories und ist
  seit dem Umzug nach Open CoDE der Hauptweg: ein Gegenstück zum privaten
  Vulnerability Reporting von GitHub gibt es dort nicht.
- **Vertrauliches Issue auf Open CoDE**: im Hauptrepository ein Issue anlegen
  und dabei „Diese Frage ist vertraulich" (`Confidential`) ankreuzen — dann
  sehen es nur Projektmitglieder. Bitte keine öffentlichen Issues, Merge
  Requests oder Pull Requests für Schwachstellen verwenden.
- Für die vier Submodule steht auf GitHub weiterhin das private Vulnerability
  Reporting offen („Security" → „Report a vulnerability"), solange sie dort
  liegen.

Hilfreich für die Meldung sind: betroffenes Repository und Version bzw. Commit,
eine Beschreibung der Auswirkung, die Schritte zum Nachstellen (gern mit einem
Beispielbogen oder QR-Inhalt) sowie die Umgebung, in der der Fehler auftritt
(Browser, Desktop-App, iOS/Android). Ein Vorschlag zur Behebung ist willkommen,
aber nicht nötig.

## Ablauf

Das Projekt wird ehrenamtlich neben dem Hauptberuf betreut, feste Reaktionszeiten
gibt es deshalb nicht. Angestrebt sind:

- Eingangsbestätigung innerhalb von 7 Tagen.
- Einschätzung, ob und wie die Meldung behoben wird, innerhalb von 30 Tagen.
- Veröffentlichung erst, wenn ein Fix ausgeliefert ist, spätestens aber 90 Tage
  nach der Meldung. Wer meldet, wird auf Wunsch in der Veröffentlichung genannt.

Kommt innerhalb von 30 Tagen keine Antwort, ist eine erneute Meldung über einen
der anderen Wege sinnvoll, bevor die Sache öffentlich gemacht wird.

## Was besonders interessiert

Die Angriffsfläche ist klein, weil die App ohne Server und ohne Konten arbeitet.
Besonders relevant sind darum:

- Verarbeitung fremder Eingaben: QR-Codes, Bogen-Links, importierte Dateien und
  Sicherungen — also alles, was von einem anderen Gerät hereinkommt
  (Dekomprimierung, Codec, Schema-Prüfung).
- Umgehung oder Fälschung der Ed25519-Signatur und ihrer Kette bei
  mehrstufiger Weitergabe.
- Ausbruch aus der Content-Security-Policy oder aus der Electron-Härtung
  (Kontextisolierung, kein Node im Renderer).
- Ungewollter Abfluss von Bogendaten aus dem Gerät, etwa über Exportwege oder
  über eine Verbindung zu einem fremden Host.
- Formel-Injection und vergleichbare Wirkungen in den Exporten (CSV, XLSX).

Bekannt und dokumentiert ist, dass der private Signatur-Geräteschlüssel
unverschlüsselt im `localStorage` liegt (R3 im Informationssicherheitskonzept).
Eine Meldung dazu ist nicht nötig. Bei Verdacht auf Kompromittierung erzeugt der
Knopf „Geräteschlüssel neu erzeugen" in der Fußzeile ein neues Schlüsselpaar;
Empfänger müssen die Kurzform danach neu abgleichen.

## Bug-Bounty

Es gibt kein Bounty-Programm und keine Vergütung. Das Projekt ist kostenlos und
quelloffen (Open Source).
