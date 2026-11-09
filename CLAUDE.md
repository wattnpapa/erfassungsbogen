# Hinweise für Claude Code

## Änderungsverlauf („Was ist neu“) bei JEDER sichtbaren Änderung fortschreiben

Der Changelog der App ist `src/app/aenderungen.ts` (in der App: Versionsnummer
in der Fußzeile → „Was ist neu“). Er wird von Hand gepflegt und ist schon
vergessen worden. Deshalb gilt ohne Ausnahme:

- **Jeder Commit, der etwas ändert, das man in der App, auf dem Papier (PDF,
  Blanko-Vordruck, Sammel-PDF, Lageblatt), in Exporten oder auf der Website
  bemerkt, trägt im selben Commit einen Eintrag in `AENDERUNGEN` nach.** Nicht
  „später“, nicht in einem eigenen Aufräum-Commit.
- Ein Eintrag je Tag (`datum` als ISO-Datum, Tag des Commits), neueste oben.
  Gibt es den Tag schon, den Punkt dort ergänzen. Ein Punkt = ein ganzer Satz
  aus Nutzersicht, ohne Dateinamen, Ticketnummern oder Fachjargon der
  Entwicklung.
- Beginnt ein neuer Monat, braucht `MONATE` einen Satz für ihn (der Test in
  `fusszeile.test.tsx` prüft das). Kommt in einem laufenden Monat etwas
  Größeres dazu, den Monatssatz nachziehen.
- Draußen bleiben reine Technik-Änderungen ohne sichtbare Wirkung:
  Abhängigkeiten, Tests, Refactorings, Prüfberichte unter `docs/audits/`.
- Vor dem Commit prüfen: `git diff --cached --stat` zeigt Änderungen unter
  `src/`, `public/` oder `vendor/` mit sichtbarer Wirkung, aber nicht
  `src/app/aenderungen.ts`? Dann fehlt der Eintrag.

## Begleitdokumente bei Änderungen mitziehen

Neben `README.md`, `PRODUCT.md`, `DESIGN.md` und den Dateien unter `docs/` gibt
es drei **Begleitdokumente**, die den Ist-Stand von Architektur, Sicherheit und
Datenschutz beschreiben:

| Dokument | Inhalt |
| --- | --- |
| [docs/arc42-architektur.md](docs/arc42-architektur.md) | Arc42-Architekturdokumentation (Bausteine, Laufzeit, Verteilung, ADRs, Risiken, Glossar) |
| [docs/informationssicherheitskonzept.md](docs/informationssicherheitskonzept.md) | Informationssicherheitskonzept nach BSI 200-2/200-3 (Vorlage für einsetzende Organisationen) |
| [docs/datenschutz-folgenabschaetzung.md](docs/datenschutz-folgenabschaetzung.md) | Datenschutz-Folgenabschätzung nach Art. 35 DSGVO (Vorlage) |

**Regel:** Bei Änderungen am Code prüfen, ob eines dieser Dokumente nachgezogen
werden muss, und die Anpassung im selben Arbeitsschritt vornehmen. Sie stehen
sonst schnell falsch da — sie enthalten konkrete Zahlen, Dateinamen und
Konfigurationswerte.

Typische Auslöser (nicht abschließend):

- **Datenmodell / Schema** (`vendor/eeb-format/src/model.ts`,
  `SCHEMA_VERSION`, neue oder entfallene Felder) → Arc42 Kap. 4.5/8.4/12, DSFA
  Abschnitt 5.4 (Datenkategorien).
- **Transportformat, Codec, Signatur** (`codec.ts`, `signatur.ts`, Base41,
  Segmentierung, `MAX_STUFEN`) → Arc42 Kap. 8.5/9 (ADR-004, ADR-005), ISK 5.2.
- **Speicherorte und Persistenz** (`localStorage`-Nutzung, Geräteschlüssel,
  Absenderkarte, Papierkorb, Löschwege) → ISK 3.3/5.5, DSFA 5.7 und
  Risikotabelle.
- **Content-Security-Policy, Electron-Härtung, Berechtigungen**
  (`vite.config.ts`, `electron/main.js`) → ISK 5.1/5.3/6.2, Arc42 Kap. 8.3.
- **Netzwerkverbindungen** (GoatCounter, Update-Prüfung, neue Fremd-Hosts) →
  ISK 3.4, DSFA 5.8 — hier ist jede Änderung datenschutzrelevant.
- **Plattformen und Auslieferung** (neue/entfallene Zielplattform,
  Release-Workflow, Signierung, macOS-Job) → Arc42 Kap. 2.2/7, ISK 3.2/6.4,
  DSFA Abschnitt 3.
- **Submodul-Struktur und geteilter Kern** (`vendor/`, `.gitmodules`, ADR-003) →
  Arc42 Kap. 1.4/5/9/11.
- **Exportwege** (CSV, XLSX, PDF, neue Empfängerformate) → ISK 5.4, DSFA 5.1/5.5.
- **Software-Lieferkette** (SBOM, `npm audit`, Dependabot, neue Abhängigkeiten)
  → ISK 6.4, Arc42 Kap. 2.1/8.3/8.6/8.7.

## Portierungen des Formats in `vendor/eeb-format/ports/` mitziehen

Im Format-Repo liegen unter `ports/` handgepflegte Leser des EEB-Formats in
anderen Sprachen (derzeit VBA für Excel). Sie werden nicht generiert. Wer
hier etwas ändert, das sie betrifft, zieht sie **im selben Arbeitsschritt**
nach (die Regel im Detail: `vendor/eeb-format/CLAUDE.md`):

- **Formatänderung im Submodul** (`SCHEMA_VERSION`, Felder, Flag-Bits,
  Marker, Segmentierung) → im Format-Repo die Portierungen anpassen,
  `npm run ports:testvektoren` und `npm run ports:pruefen` dort; erst dann
  den Submodul-Stand hier heben.
- **Vokabular** (`vendor/bos-vokabulare`: neue Codes bei Einheitstypen,
  Funktionen, Fahrzeugtypen, Kennwörtern, Ebenen) →
  `npm run vokabular:excel-vba` erzeugt
  `vendor/eeb-format/ports/vba/m_digitalerEEBVokabular.bas` neu; das Ergebnis
  im Format-Repo committen und den Submodul-Stand heben. Die CI prüft mit
  `npm run vokabular:excel-vba -- --pruefen`, dass das Modul zum Vokabular
  passt.
- **Neue Freitext-Konventionen** (wie das Präfix `Beruf: `) → die
  Portierungen müssen sie genauso trennen/anzeigen.

Wenn eine Änderung eine dieser Stellen berührt, die Änderung im Dokument
vornehmen und den *Prüfvermerk*/Stand dort aktualisieren. Ist die Anpassung
größer als der Codewechsel selbst, wenigstens im Dokument vermerken, dass der
Abschnitt veraltet ist — lieber ein sichtbarer Hinweis als eine stillschweigend
falsche Angabe.

Die Quell-Fassungen (`ISK-Erfassungsbogen.docx`, `DSFA-Erfassungsbogen.docx`,
`Arc42-Erfassungsbogen.pdf`) liegen außerhalb des Repositorys; die Markdown-
Dateien unter `docs/` sind die zu pflegende Fassung.
