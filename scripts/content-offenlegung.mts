/**
 * Senkt die kognitive Last der Content-Seiten unter public/ an den drei
 * Stellen, an denen sie aus der schieren Menge sichtbarer Zeilen entsteht:
 *
 * 1. **FAQ als `<details>`** — Jede Seite mit einem Block „Häufige Fragen …"
 *    zeigte alle Antworten dauerhaft ausgeklappt. Auf anleitung.html sind das
 *    acht Antworten in einem 1.212-Wörter-Text: Wer mit einer konkreten Frage
 *    kommt („Was kostet die App?"), scrollt an allen anderen vorbei. Die Paare
 *    aus Überschrift und Antwort werden zu `<details><summary>` — das erste
 *    offen, damit erkennbar bleibt, dass hier etwas aufklappt. Frage- und
 *    Antworttexte bleiben wörtlich; die `<h3>` bleiben `<h3>` (im `<summary>`
 *    erlaubt), damit Gliederung und JSON-LD unberührt bleiben.
 *
 *    **Ausdruck und Skriptfreiheit:** `<details>` ist reines HTML und braucht
 *    kein JavaScript. Für den Ausdruck steht am Ende des CSS-Blocks eine
 *    `@media print`-Regel, die jedes Aufklappelement öffnet — ein ausgedruckter
 *    Bogen darf nichts verschlucken. Sie deckt beide Bauweisen der Browser ab:
 *    die alte über `details > *` und die neue über `::details-content`.
 *
 *    **Sprungziele:** Jeder Aufklapper trägt eine `id` — die von
 *    `content-faq.mts` gesetzte, wo eine steht, sonst eine aus der Frage
 *    abgeleitete. Damit ein geteilter Link auf eine einzelne Frage etwas nützt,
 *    öffnen dieselben zwei Schreibweisen den Block auch bei `:target`; ohne
 *    CSS-Unterstützung bleibt er zugeklappt und ein Klick öffnet ihn.
 *
 * 2. **Sprungmenü auf anleitung.html** — Die Seite ist der Nachschlage-Ort und
 *    soll sich wie einer verhalten. Direkt unter der `h1` steht jetzt ein
 *    Inhaltsverzeichnis aus den vorhandenen `h2`; die Sprungziele entstehen als
 *    Kennung aus dem Überschriftentext, die Überschriften selbst bleiben
 *    unverändert. Weil die Einträge Listenpunkte sind und nicht Links im
 *    Fließtext, greift die WCAG-2.5.8-Ausnahme hier nicht — sie bekommen die
 *    volle Trefferfläche (`--ziel-basis`, 2.75rem).
 *
 * 3. **Karte und Tabelle auf katastrophenschutz.html** — Beide beantworten
 *    dieselbe Frage („welches Bundesland hat eine Seite?") und kosteten
 *    zusammen rund 1.450 px, wovon die Tabelle allein 910 px im oberen Drittel
 *    einnahm. Die Karte bleibt samt ihrer Konstruktion (`aria-hidden`,
 *    `tabindex="-1"`, Bildunterschrift). Was sich ändert:
 *    - Unter der Karte steht die **Textfassung als knappe Zeile**: alle zwölf
 *      Länder als Links, nach Anzahl der Bögen absteigend. Sie ist der Zugang
 *      für Tastatur und Screenreader, den die ausgeblendete Karte nicht bietet,
 *      und sie ist **ohne Aufklappen** erreichbar.
 *    - Die ausführliche Tabelle mit der Inhaltsspalte wandert hinter ein
 *      `<details>`. Kein Wort geht verloren, sie steht nur nicht mehr als
 *      910-px-Wand zwischen dem ersten und dem zweiten Handlungsknopf.
 *    Die Zahlen der Kurzliste werden aus der Tabelle gelesen, nicht gesetzt —
 *    es gibt genau eine Quelle für sie.
 *
 * Aufruf (Node ≥ 22): npm run content-offenlegung
 *
 * Idempotent: Alle drei Umbauten lesen ihren Ausgangsstoff aus dem Ergebnis des
 * vorherigen Laufs zurück (die `<h3>`/`<p>`-Paare stehen im `<details>` genauso
 * wie vorher im Text, die Tabelle steht unverändert im Aufklappblock). Ein
 * zweiter Lauf meldet 0 Änderungen.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(wurzel, "public");

// ---------------------------------------------------------------------------
// (1) FAQ-Paare in <details>
// ---------------------------------------------------------------------------

/**
 * Der FAQ-Bereich einer Seite: von der Überschrift „Häufige Fragen …" bis zur
 * nächsten `h2`, zum Abschlussblock oder zum Ende des `main`. Group 1 ist der
 * Einzug, Group 2 die Überschrift selbst, Group 3 der umzubauende Inhalt.
 */
const FAQ_MUSTER =
  /([ \t]*)(<h2[^>]*>\s*Häufige Fragen[\s\S]*?<\/h2>)([\s\S]*?)(?=\n[ \t]*<h2|\n[ \t]*<!-- HANDLUNG:ABSCHLUSS:START -->|\n[ \t]*<\/main>|\n[ \t]*<footer)/;

/**
 * Ein Frage-Antwort-Paar — in der rohen Fassung (`<h3>` gefolgt von `<p>`) wie
 * in der bereits umgebauten (`<details><summary><h3>…`). Beide Formen im selben
 * Muster, damit der zweite Lauf denselben Stoff liest wie der erste und
 * dasselbe Ergebnis schreibt.
 *
 * Group 1 ist der Einzug der Zeile, Group 2 sind die Attribute eines bereits
 * vorhandenen `<details>`, Group 3 die Frage, Group 4 die Antwort.
 *
 * Group 2 ist nicht kosmetisch: `content-faq.mts` schreibt dort das Sprungziel
 * der Frage (`id="frage-…"`). Stünde im Muster weiter nur `(?: open)?`,
 * verfehlte es jedes `<details>` mit Kennung — und das Paar würde ein zweites
 * Mal eingewickelt, mit verschachtelten Aufklappern und verlorenem Sprungziel
 * als Ergebnis.
 */
const PAAR_MUSTER =
  /([ \t]*)(?:<details class="frage"([^>]*)>\s*<summary>\s*)?<h3[^>]*>([\s\S]*?)<\/h3>(?:\s*<\/summary>)?\s*(<p[\s\S]*?<\/p>)(?:\s*<\/details>)?/g;

/**
 * Fortsetzungszeilen der Antwort auf den Einzug im Aufklappblock legen. Die
 * Ersetzung ist ein Fixpunkt: Ein zweiter Durchlauf trifft bereits den
 * Zieleinzug und ändert nichts mehr.
 */
function einruecken(html: string, einzug: string): string {
  return html.replace(/\n[ \t]*/g, `\n${einzug}`);
}

/**
 * Jedes Frage-Antwort-Paar **an seinem Platz** ersetzen, statt den Bereich aus
 * den gefundenen Paaren neu zusammenzusetzen. Das ist der Unterschied zwischen
 * „umbauen" und „überschreiben": Im FAQ-Bereich steht auf mehreren Seiten noch
 * anderes — der Kartenblock der Länderseiten etwa —, und ein Neuaufbau aus nur
 * den Paaren löscht es wortlos. Hier bleibt alles stehen, was kein Paar ist.
 */
function faqUmbauen(html: string): { html: string; anzahl: number } {
  let anzahl = 0;
  const neu = html.replace(FAQ_MUSTER, (ganz, einzug: string, h2: string, rumpf: string) => {
    let nummer = 0;
    const umgebaut = rumpf.replace(
      PAAR_MUSTER,
      (_treffer, zeileneinzug: string, attribute: string | undefined, frage: string, antwort: string) => {
        const ein = zeileneinzug || einzug;
        const offen = nummer++ === 0 ? " open" : "";
        // Ein vorhandenes Sprungziel bleibt, was es ist — es steht in geteilten
        // Links. Nur wo noch keines ist (ein Aufklapper, den ein anderer
        // Generator als nacktes h3/p-Paar hinterlässt), wird eines aus der
        // Frage abgeleitet.
        const id = attribute?.match(/\bid="([^"]+)"/)?.[1] ?? `frage-${kennung(reintext(frage))}`;
        return (
          `${ein}<details class="frage" id="${id}"${offen}>\n` +
          `${ein}  <summary><h3>${frage.trim()}</h3></summary>\n` +
          `${ein}  ${einruecken(antwort, `${ein}  `)}\n` +
          `${ein}</details>`
        );
      },
    );
    if (nummer === 0) return ganz;
    anzahl += nummer;
    return `${einzug}${h2}${umgebaut}`;
  });
  return { html: neu, anzahl };
}

// ---------------------------------------------------------------------------
// (2) Sprungmenü auf anleitung.html
// ---------------------------------------------------------------------------

/** Seite, die ein Sprungmenü bekommt: der Nachschlage-Ort des Angebots. */
const SPRUNGMENUE_SEITE = "anleitung.html";

/** Kennung aus einem Überschriftentext — die Überschrift selbst bleibt unberührt. */
function kennung(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Reintext einer Überschrift, ohne Auszeichnung und ohne Entities. */
function reintext(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&(?:quot|#34);/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const SPRUNGMENUE_MUSTER = /\n?[ \t]*<!-- SPRUNGMENUE:START -->[\s\S]*?<!-- SPRUNGMENUE:END -->/;

/**
 * Alle `h2` des Textbereichs mit Kennung versehen und darüber ein
 * Inhaltsverzeichnis setzen. Überschriften innerhalb der von anderen
 * Generatoren erzeugten Blöcke (`HANDLUNG:*`) bleiben außen vor: Sie würden
 * beim nächsten Lauf jenes Generators ihre Kennung wieder verlieren, und zwei
 * Skripte, die sich gegenseitig überschreiben, konvergieren nie.
 */
function sprungmenueSetzen(html: string): { html: string; anzahl: number } {
  const hauptteil = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  if (!hauptteil) return { html, anzahl: 0 };

  const gesperrt = [...html.matchAll(/<!-- HANDLUNG:[A-Z]+:START -->[\s\S]*?<!-- HANDLUNG:[A-Z]+:END -->/g)].map(
    (m) => [m.index!, m.index! + m[0].length] as const,
  );
  const imBlock = (pos: number) => gesperrt.some(([a, b]) => pos >= a && pos < b);

  const eintraege: { id: string; text: string }[] = [];
  let neu = html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g, (ganz, attr: string, inhalt: string, index: number) => {
    if (index < hauptteil.index! || imBlock(index)) return ganz;
    const text = reintext(inhalt);
    // Eine vorhandene Kennung gilt. `content-faq.mts` setzt an der
    // FAQ-Überschrift `id="haeufige-fragen"` — ein Sprungziel, das geteilt wird
    // und deshalb den Wortlaut überleben muss. Aus dem Text neu abgeleitet
    // wanderte es mit jeder Umformulierung mit, und die beiden Generatoren
    // schrieben sich abwechselnd um, statt zu konvergieren.
    const id = attr.match(/\bid="([^"]+)"/)?.[1] ?? kennung(text);
    if (!id) return ganz;
    eintraege.push({ id, text });
    const ohneId = attr.replace(/\s*\bid="[^"]*"/, "");
    return `<h2 id="${id}"${ohneId}>${inhalt}</h2>`;
  });

  if (eintraege.length === 0) return { html, anzahl: 0 };

  const punkte = eintraege
    .map((e) => `        <li><a href="#${e.id}">${e.text}</a></li>`)
    .join("\n");
  const block = `<!-- SPRUNGMENUE:START -->
    <nav class="sprungmenue" aria-label="Inhalt dieser Seite">
      <p class="sprungmenue-titel">Auf dieser Seite</p>
      <ul>
${punkte}
      </ul>
    </nav>
    <!-- SPRUNGMENUE:END -->`;

  if (SPRUNGMENUE_MUSTER.test(neu)) {
    neu = neu.replace(SPRUNGMENUE_MUSTER, `\n    ${block}`);
  } else {
    neu = neu.replace(/(<h1[^>]*>[\s\S]*?<\/h1>)/, `$1\n\n    ${block}`);
  }
  return { html: neu, anzahl: eintraege.length };
}

// ---------------------------------------------------------------------------
// (3) Karte und Tabelle auf katastrophenschutz.html
// ---------------------------------------------------------------------------

const KATS_SEITE = "katastrophenschutz.html";

/** Der erzeugte Bereich: Kurzliste plus Aufklappblock mit der Tabelle. */
const LANDESBLOCK_MUSTER =
  /[ \t]*<!-- LAENDERLISTE:START -->[\s\S]*?<!-- LANDESTABELLE:END -->/;

/** Die Landesvorlagen-Tabelle in ihrem Rollbereich (Schritt 3), unverändert übernommen. */
const TABELLE_MUSTER = /<div class="tabellenrahmen"[^>]*>\s*<table>[\s\S]*?<\/table>\s*<\/div>/;

/** Beschriftung des Aufklappblocks — ein Bedienelement braucht einen Namen. */
const TABELLE_TITEL = "Was in den einzelnen Landesvorlagen steckt";

interface LandZeile {
  href: string;
  name: string;
  anzahl: number;
}

/** Land, Anzahl und Ziel aus den Tabellenzeilen lesen — eine Quelle für die Zahlen. */
function landesZeilen(tabelle: string): LandZeile[] {
  const zeilen: LandZeile[] = [];
  for (const [, href, name, inhalt] of tabelle.matchAll(
    /<tr><td><a href="([^"]+)">([^<]+)<\/a><\/td><td>([\s\S]*?)<\/td><\/tr>/g,
  )) {
    const treffer = inhalt!.match(/(\d+)\s+Bögen/);
    if (!treffer) continue;
    zeilen.push({ href: href!, name: name!, anzahl: Number(treffer[1]) });
  }
  return zeilen;
}

function landesblockUmbauen(html: string): { html: string; anzahl: number } {
  const vorhanden = html.match(LANDESBLOCK_MUSTER);
  const quelle = vorhanden ? vorhanden[0] : html.match(new RegExp(`[ \\t]*${TABELLE_MUSTER.source}`))?.[0];
  if (!quelle) return { html, anzahl: 0 };

  const tabelle = quelle.match(TABELLE_MUSTER)?.[0];
  if (!tabelle) return { html, anzahl: 0 };

  const zeilen = landesZeilen(tabelle);
  if (zeilen.length === 0) return { html, anzahl: 0 };

  // Absteigend nach Anzahl: Wer „welches Land ist am weitesten?" fragt, liest
  // die Antwort vorn statt sie aus zwölf Zeilen zusammenzusuchen. Bei gleicher
  // Anzahl entscheidet der Name, damit die Reihenfolge stabil bleibt.
  const sortiert = [...zeilen].sort((a, b) => b.anzahl - a.anzahl || a.name.localeCompare(b.name, "de"));
  const links = sortiert
    .map((l) => `<a href="${l.href}">${l.name}</a> <span class="anzahl">${l.anzahl} Bögen</span>`)
    .join("\n      ·\n      ");

  const block = `    <!-- LAENDERLISTE:START -->
    <p class="laenderliste">
      ${links}
    </p>
    <!-- LAENDERLISTE:END -->
    <!-- LANDESTABELLE:START -->
    <details class="aufklapp">
      <summary>${TABELLE_TITEL}</summary>
      ${tabelle}
    </details>
    <!-- LANDESTABELLE:END -->`;

  return { html: html.replace(vorhanden ? LANDESBLOCK_MUSTER : new RegExp(`[ \\t]*${TABELLE_MUSTER.source}`), block), anzahl: zeilen.length };
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

/**
 * Alle Maße kommen aus den Token: Trefferflächen aus `--ziel-basis` (2.75rem),
 * Schriftgrade aus der Leiter (0.8125 / 0.875 / 1 rem). Kein `border-radius`
 * (Null-Radius-Regel), kein Schatten an einer ruhenden Fläche, kein
 * `prefers-color-scheme`. Stünde hier ein Zwischenwert, zöge ihn
 * content-stil.mts beim nächsten Lauf um — die Generatoren müssen in beliebiger
 * Reihenfolge laufen können.
 */
const CSS = `/* OFFENLEGUNG:CSS:START */
    /* Aufklappblöcke. Der Griff ist als Bedienelement erkennbar: volle
       Trefferfläche, eigenes Vorzeichen, Fokusring im App-Muster
       (outline in der Kennfarbe, wie index.html und die Rollbereiche). Der
       eigene Marker statt des Systemdreiecks, weil das Dreieck in Safari links
       außerhalb der Textkante sitzt und die Zeile gegen die Überschriften
       darüber verschiebt. */
    .frage, .aufklapp { border-top: 1px solid var(--rand); }
    /* Abschlusskante. Der Stapel trug nur Oberkanten und franste unten in die
       Handlungsaufforderung aus — in einer Optik, die von geschlossenen Kästen
       lebt, ein sichtbarer Bruch. Die Unterkante hängt am **Stapel**, nicht am
       letzten Element der Seite: :has(~ .frage) fragt, ob unter demselben
       Elternteil noch ein Aufklapper folgt. .frage:last-of-type hätte
       dasselbe geleistet, solange die letzte Frage auch das letzte <details>
       der Seite ist — steht dort eines Tages hinter dem Abschlussknopf noch
       eines (der Länderblock stand schon einmal dort), rutschte die Kante
       wortlos dorthin. Ohne :has()-Unterstützung fehlt sie; mehr passiert
       nicht. */
    .frage:not(:has(~ .frage)), .aufklapp:not(:has(~ .aufklapp)) { border-bottom: 1px solid var(--rand); }
    .frage > summary, .aufklapp > summary { display: flex; align-items: center; gap: 0.6rem; min-height: 2.75rem; cursor: pointer; list-style: none; font-weight: 600; }
    .frage > summary::-webkit-details-marker, .aufklapp > summary::-webkit-details-marker { display: none; }
    /* Das Vorzeichen steht im Zweittext-Ton (#5c6478 — DESIGN.md führt ihn als
       --text-2; die Content-Seiten tragen den Wert wörtlich, ein Token dafür
       haben sie nicht), nicht in der Kennfarbe. Die Kennfarben-Regel gibt das
       Blau dem Kopfbalken und der primären Aktion; drei bis sechs blaue
       Pluszeichen je Seite nahmen dem einen Knopf, auf den es ankommt (.start
       im Abschlussblock), genau die Signalwirkung, für die er die Farbe trägt.
       Sichtbar bleibt es: gemessen auf dem Seitengrund (#f2f3f7) 5,34:1 — über
       den 4,5:1 aus WCAG 1.4.3 und weit über den 3:1 für Bedienteile. Der
       Fokusring darunter bleibt blau: Er zeigt einen Zustand an und ist keine
       Dekoration. */
    .frage > summary::before, .aufklapp > summary::before { content: "+"; flex: none; width: 1rem; text-align: center; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-weight: 700; color: #5c6478; }
    .frage[open] > summary::before, .aufklapp[open] > summary::before { content: "−"; }
    .frage > summary:focus-visible, .aufklapp > summary:focus-visible { outline: 3px solid var(--blau); outline-offset: 2px; }
    /* Die Frage bleibt eine h3 (im summary erlaubt) — Gliederung und JSON-LD
       bleiben damit unberührt. Nur der Blocksatz muss weichen, sonst rutscht
       sie unter das Vorzeichen. */
    .frage > summary h3 { display: inline; margin: 0; padding: 0; border: 0; }
    .frage > p, .aufklapp > .tabellenrahmen, .aufklapp > .tabelle { margin-top: 0; margin-bottom: 1rem; }
    /* Sprungziel. Ein Link auf eine einzelne Frage ist das, was im Ehrenamt
       tatsächlich weitergereicht wird („guck mal, wo die Daten bleiben") — und
       er taugt nur, wenn die Frage aufgeklappt ankommt. Von selbst öffnet sich
       ein <details> beim Anker-Treffer nicht, und ein Skript gibt es auf diesen
       Seiten nicht (dieselbe Prämisse wie bei der Landkarte: offline, ohne
       Skript, im Ausdruck). Also derselbe Kniff wie beim Drucken, in beiden
       Schreibweisen: die ältere über den Kindselektor, die neuere über
       ::details-content. Wo beides nicht greift, bleibt die Frage zugeklappt —
       sichtbar ist sie trotzdem, und ein Klick öffnet sie. Kaputt ist nichts.
       Das Vorzeichen zeigt „−", damit der Zustand nicht lügt; scroll-margin
       hält die Zeile vom oberen Fensterrand frei. */
    .frage:target, [id]:target { scroll-margin-top: 1rem; }
    .frage:target > *:not(summary) { display: block; }
    .frage:target::details-content { content-visibility: visible; display: block; }
    .frage:target:not([open]) > summary::before { content: "−"; }
    /* Ausdruck: Ein ausgedruckter Bogen darf nichts verschlucken. Zwei
       Schreibweisen, weil die Browser das Element unterschiedlich bauen — die
       ältere über den Kindselektor, die neuere über ::details-content. */
    @media print {
      details { display: block; }
      details > summary { display: block; }
      details > *:not(summary) { display: block; }
      details::details-content { content-visibility: visible; display: block; }
      .frage > summary::before, .aufklapp > summary::before { content: ""; width: 0; }
    }
    /* Sprungmenü: Listenpunkte sind keine Links im Fließtext, die
       WCAG-2.5.8-Ausnahme greift hier nicht — volle Trefferfläche. Mehrspaltig
       ab der Breite, ab der zwei Spalten nicht umbrechen; auf dem Handy
       einspaltig. */
    .sprungmenue { margin: 1.2rem 0 2rem; padding-top: 0.8rem; border-top: 1px solid var(--rand); }
    .sprungmenue-titel { margin: 0 0 0.4rem; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-weight: 700; font-size: 0.8125rem; letter-spacing: 0.1em; text-transform: uppercase; color: #5c6478; }
    .sprungmenue ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 0 1.5rem; }
    .sprungmenue li { margin: 0; }
    .sprungmenue a { display: flex; align-items: center; min-height: 2.75rem; }
    /* Textfassung der Karte: dieselben zwölf Ziele als Zeile, nach Anzahl
       geordnet. Sie steht außerhalb des Aufklappblocks, weil die Karte
       aria-hidden ist und dies der einzige Zugang für Tastatur und
       Screenreader bleibt. Als punktgetrennter Textblock fällt sie unter die
       WCAG-2.5.8-Ausnahme für Links im Fließtext. */
    .laenderliste { margin: 0.8rem 0 1.2rem; line-height: 2; }
    .laenderliste .anzahl { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: 0.875rem; color: #5c6478; }
    /* OFFENLEGUNG:CSS:END */`;

const CSS_MUSTER = /\/\* OFFENLEGUNG:CSS:START \*\/[\s\S]*?\/\* OFFENLEGUNG:CSS:END \*\//;

function cssEinsetzen(html: string): string {
  if (CSS_MUSTER.test(html)) return html.replace(CSS_MUSTER, CSS);
  return html.replace("  </style>", `${CSS}\n  </style>`);
}

// ---------------------------------------------------------------------------

function main(): void {
  const dateien = readdirSync(publicDir).filter((d) => d.endsWith(".html"));
  let geaendert = 0;
  let fragen = 0;
  let punkte = 0;
  let laender = 0;

  for (const datei of dateien) {
    const pfad = join(publicDir, datei);
    const vorher = readFileSync(pfad, "utf8");
    let neu = vorher;

    const faq = faqUmbauen(neu);
    neu = faq.html;
    fragen += faq.anzahl;

    if (datei === SPRUNGMENUE_SEITE) {
      const menue = sprungmenueSetzen(neu);
      neu = menue.html;
      punkte += menue.anzahl;
    }

    if (datei === KATS_SEITE) {
      const block = landesblockUmbauen(neu);
      neu = block.html;
      laender += block.anzahl;
    }

    // Der CSS-Block gehört auf jede Seite, die am Ende ein Aufklappelement oder
    // ein Sprungmenü trägt — und nur dorthin. Seiten ohne beides bleiben
    // unverändert, statt ungenutzte Regeln mitzuschleppen.
    if (/<details\b/.test(neu) || /class="sprungmenue"/.test(neu)) neu = cssEinsetzen(neu);

    if (neu !== vorher) {
      writeFileSync(pfad, neu, "utf8");
      geaendert++;
    }
  }

  console.log(
    `Progressive Offenlegung: ${geaendert}/${dateien.length} Seiten — ` +
      `${fragen} Fragen aufklappbar, ${punkte} Sprungmenü-Einträge, ${laender} Länder in der Kurzliste.`,
  );
}

main();
