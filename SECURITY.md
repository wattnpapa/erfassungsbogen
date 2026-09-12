# Sicherheit

Dieses Dokument beschreibt, wie Schwachstellen in der App „Erfassungsbogen" und
den zugehörigen Bibliotheken gemeldet werden.

## Geltungsbereich

Der Meldeweg gilt für das Hauptrepository und die vier eingebundenen Submodule
unter `vendor/`. Alle fünf werden von derselben Person betreut, eine Meldung
genügt also auch dann, wenn unklar ist, in welchem Teil der Fehler steckt.

| Repository | Inhalt |
| --- | --- |
| [wattnpapa/erfassungsbogen](https://github.com/wattnpapa/erfassungsbogen) | Die App selbst (Web, Desktop, iOS/Android) |
| [wattnpapa/eeb-format](https://github.com/wattnpapa/eeb-format) | Datenmodell, Transportcodec (Base41, Segmentierung), Ed25519-Signatur |
| [wattnpapa/bos-meldekopf](https://github.com/wattnpapa/bos-meldekopf) | Meldekopf-Kern (Sammlung und Auswertung eingehender Bögen) |
| [wattnpapa/bos-vokabulare](https://github.com/wattnpapa/bos-vokabulare) | Vokabulare für Organisationen, Einheiten, Qualifikationen |
| [wattnpapa/bos-taktische-zeichen](https://github.com/wattnpapa/bos-taktische-zeichen) | Taktische Zeichen als SVG |

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

Bitte Schwachstellen nicht über öffentliche Issues, Pull Requests oder
Diskussionen melden. Zwei Wege stehen offen:

- **Private Vulnerability Reporting auf GitHub** (bevorzugt): im betroffenen
  Repository unter „Security" → „Report a vulnerability". Für das Hauptrepo:
  <https://github.com/wattnpapa/erfassungsbogen/security/advisories/new>.
- **E-Mail** an <johannes.rudolph@thw-oldenburg.de>, Betreff mit dem Wort
  „Sicherheit".

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
  nach der Meldung. Wer meldet, wird auf Wunsch im Security Advisory genannt.

Kommt innerhalb von 30 Tagen keine Antwort, ist eine erneute Meldung über den
jeweils anderen Weg sinnvoll, bevor die Sache öffentlich gemacht wird.

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
