// Prüft die statischen Content-Seiten unter public/ auf die Fehler, die beim
// Schreiben von Hand entstehen und die im Browser unsichtbar bleiben: ungültiges
// JSON-LD, tote interne Links, fehlende Bilddateien, Meta-Angaben, die in der
// Suchergebnisliste abgeschnitten werden.
//
// Anlass: Auf bundeswehr.html beendete ein gerades Anführungszeichen in
// „Bundeswehr" den JSON-String vorzeitig — der komplette @graph (Breadcrumb und
// FAQPage) war damit für Suchmaschinen wertlos, ohne dass die Seite anders
// aussah. Ein Test, der jeden ld+json-Block einmal durch JSON.parse schickt,
// hätte das beim Schreiben gefangen.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WURZEL = join(import.meta.dirname, "..");
const PUBLIC = join(WURZEL, "public");

const SEITEN = readdirSync(PUBLIC).filter((d) => d.endsWith(".html"));

/** 404.html wird nie indexiert und trägt deshalb weder Canonical noch JSON-LD. */
const OHNE_META = new Set(["404.html"]);
const INHALTSSEITEN = SEITEN.filter((d) => !OHNE_META.has(d));

/**
 * Seiten, die nicht werben: das Verzeichnis, die Rechtstexte, der technische
 * Nachweis und die Fehlerseite. Alles Übrige sind Organisations- und
 * Anwendungsfall-Seiten, die einem Besucher mehr als eine Gelegenheit zum
 * Handeln geben müssen — genau ein Knopf im ersten Drittel liegt auf dem Handy
 * unter der Falz, und danach folgen bis zu 5.900 px ohne jedes Angebot
 * (scripts/content-handlung.mts).
 */
const OHNE_WERBUNG = new Set([
  "404.html",
  "uebersicht.html",
  "impressum.html",
  "datenschutz.html",
  "open-source-datenschutz.html",
]);
const PERSUADE = SEITEN.filter((d) => !OHNE_WERBUNG.has(d));

/**
 * Google kürzt Titel bei rund 60 und Beschreibungen bei rund 160 Zeichen. Wird
 * gekürzt, fällt das Ende weg — und dort steht bei den Länder- und
 * Fachgruppen-Seiten genau das Wort, das die Seite von ihren Geschwistern
 * unterscheidet.
 */
const TITEL_MAX = 60;
const BESCHREIBUNG_MAX = 160;

function lies(datei: string): string {
  return readFileSync(join(PUBLIC, datei), "utf8");
}

describe("Content-Seiten unter public/", () => {
  it.each(INHALTSSEITEN)("%s: jeder ld+json-Block ist gültiges JSON", (datei) => {
    const html = lies(datei);
    const bloecke = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(bloecke.length).toBeGreaterThan(0);
    for (const [, roh] of bloecke) {
      expect(() => JSON.parse(roh ?? "")).not.toThrow();
    }
  });

  it.each(SEITEN)("%s: interne Links zeigen auf vorhandene Dateien", (datei) => {
    const html = lies(datei);
    const ziele = [...new Set([...html.matchAll(/href="\.\/([^"#?]+)(?:[#?][^"]*)?"/g)].map((m) => m[1]))];
    const tot = ziele.filter((z) => z && !existsSync(join(PUBLIC, z)));
    expect(tot).toEqual([]);
  });

  it.each(SEITEN)("%s: eingebundene Bilder liegen im Verzeichnis", (datei) => {
    const html = lies(datei);
    const quellen = [...new Set([...html.matchAll(/src="\.\/([^"]+)"/g)].map((m) => m[1]))];
    const fehlend = quellen.filter((q) => q && !existsSync(join(PUBLIC, q)));
    expect(fehlend).toEqual([]);
  });

  it.each(INHALTSSEITEN)("%s: Titel bleibt unter der Kürzungsgrenze", (datei) => {
    const titel = lies(datei).match(/<title>([\s\S]*?)<\/title>/)?.[1];
    expect(titel).toBeDefined();
    expect(titel!.length).toBeLessThanOrEqual(TITEL_MAX);
  });

  it.each(INHALTSSEITEN)("%s: Beschreibung bleibt unter der Kürzungsgrenze", (datei) => {
    const text = lies(datei).match(/<meta name="description" content="([\s\S]*?)">/)?.[1];
    expect(text).toBeDefined();
    expect(text!.length).toBeLessThanOrEqual(BESCHREIBUNG_MAX);
  });

  it.each(INHALTSSEITEN)("%s: og:url und canonical zeigen auf dieselbe Adresse", (datei) => {
    const html = lies(datei);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const ogUrl = html.match(/property="og:url" content="([^"]+)"/)?.[1];
    expect(canonical).toBe(`https://erfassungsbogen.app/${datei}`);
    expect(ogUrl).toBe(canonical);
  });

  it.each(SEITEN)("%s: genau eine h1 und Sprache ausgezeichnet", (datei) => {
    const html = lies(datei);
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(html).toMatch(/<html lang="de">/);
  });

  it.each(PERSUADE)("%s: trägt mindestens zwei Handlungsknöpfe", (datei) => {
    const knoepfe = lies(datei).match(/<a class="start"/g) ?? [];
    expect(knoepfe.length).toBeGreaterThanOrEqual(2);
  });

  it.each(PERSUADE)("%s: der letzte Knopf steht vor Fußzeile und Markenhinweis", (datei) => {
    const html = lies(datei);
    const letzterKnopf = html.lastIndexOf('<a class="start"');
    const fusszeile = html.indexOf("<footer");
    const markenhinweis = html.indexOf("<!-- HINWEIS:START -->");
    expect(letzterKnopf).toBeGreaterThan(-1);
    expect(fusszeile).toBeGreaterThan(-1);
    expect(markenhinweis).toBeGreaterThan(-1);
    expect(letzterKnopf).toBeLessThan(fusszeile);
    expect(fusszeile).toBeLessThan(markenhinweis);
  });

  // Die Rollbereich-Regel aus DESIGN.md: Eine Tabelle, die seitlich rollt, ist
  // ohne Tastaturzugang für alle abgeschnitten, die nicht wischen können. Auf
  // den statischen Seiten setzt scripts/content-rollbereich.mts den Zugang fest
  // (kein Skript zur Laufzeit) — dieser Test hält fest, dass keine Tabelle beim
  // Anlegen einer neuen Seite ohne ihn ins Netz geht.
  it.each(SEITEN)("%s: jeder rollende Tabellencontainer ist eine benannte Region", (datei) => {
    const html = lies(datei);
    const ohneRegion = [...html.matchAll(/<div class="(?:tabellenrahmen|tabelle)"[^>]*>/g)]
      .map((m) => m[0])
      .filter((tag) => !/\btabindex="0"/.test(tag) || !/\brole="region"/.test(tag) || !/\baria-label="[^"]+"/.test(tag));
    expect(ohneRegion).toEqual([]);
  });

  it.each(SEITEN)("%s: keine Tabelle steht ohne Rollbereich", (datei) => {
    const html = lies(datei);
    const ohneRahmen = [...html.matchAll(/<table\b[^>]*>/g)].filter((m) => {
      const davor = html.slice(0, m.index).trimEnd();
      return !/<div class="(?:tabellenrahmen|tabelle)"[^>]*>$/.test(davor);
    });
    expect(ohneRahmen.map((m) => m[0])).toEqual([]);
  });

  it.each(SEITEN)("%s: jedes Bild trägt ein alt-Attribut", (datei) => {
    const ohneAlt = [...lies(datei).matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).filter((i) => !/\balt=/.test(i));
    expect(ohneAlt).toEqual([]);
  });

  // --- Progressive Offenlegung (scripts/content-offenlegung.mts) ----------

  const MIT_FAQ = SEITEN.filter((d) => /<details class="frage"/.test(lies(d)));

  it.each(MIT_FAQ)("%s: jeder Aufklapper trägt genau eine Frage im summary", (datei) => {
    const html = lies(datei);
    const bloecke = [...html.matchAll(/<details class="frage"[^>]*>([\s\S]*?)<\/details>/g)];
    expect(bloecke.length).toBeGreaterThan(0);
    for (const [, rumpf] of bloecke) {
      expect(rumpf).toMatch(/<summary><h3>[\s\S]+?<\/h3><\/summary>/);
    }
    // Genau der erste Block steht offen: Ohne ihn sähe der Bereich aus wie eine
    // Liste von Überschriften, und niemand käme auf die Idee zu klicken.
    expect((html.match(/<details class="frage"[^>]*\bopen>/g) ?? []).length).toBe(1);
    expect(html.search(/<details class="frage"[^>]*\bopen>/)).toBe(html.indexOf('<details class="frage"'));
  });

  // --- Sprungziele im FAQ-Bereich (scripts/content-faq.mts) ---------------

  /**
   * Diese Seiten sind Sucheinstiege, und im Ehrenamt wird ein Werkzeug
   * weitergereicht, indem man einen Link schickt. Beides scheitert an einem
   * FAQ-Bereich ohne Adressen: Vor dem Umbau trug genau eine der 28 Seiten
   * eine Kennung an der FAQ-Überschrift, und kein einziger Aufklapper auf
   * keiner Seite hatte eine.
   */
  it.each(MIT_FAQ)("%s: die FAQ-Überschrift ist anspringbar", (datei) => {
    const html = lies(datei);
    const bereich = html.match(/<!-- FAQ:START -->([\s\S]*?)<!-- FAQ:END -->/)?.[1];
    expect(bereich).toBeDefined();
    // Auf jeder Seite dieselbe Kennung — sonst müsste man sie je Seite
    // nachschlagen, und ein Verweis auf „die häufigen Fragen" ließe sich nicht
    // seitenunabhängig schreiben.
    expect(bereich).toMatch(/<h2[^>]*\bid="haeufige-fragen"/);
  });

  it.each(MIT_FAQ)("%s: jeder Aufklapper hat eine eigene Adresse", (datei) => {
    const html = lies(datei);
    const bloecke = [...html.matchAll(/<details class="frage"([^>]*)>/g)].map((m) => m[1]!);
    expect(bloecke.length).toBeGreaterThan(0);
    const ohneId = bloecke.filter((attr) => !/\bid="[^"]+"/.test(attr));
    expect(ohneId).toEqual([]);
  });

  // --- Länder-Absprung hinter dem Knopf (scripts/content-laender.mts) -----

  const MIT_LAENDERBLOCK = SEITEN.filter((d) => /<!-- LAENDER:START -->/.test(lies(d)));

  it.each(MIT_LAENDERBLOCK)("%s: der Länder-Absprung steht hinter dem Abschlussknopf", (datei) => {
    const html = lies(datei);
    // Vorher war er die letzte Frage im FAQ und damit das Letzte, was ein
    // Besucher vor der Handlungsaufforderung las: zwölf Wege woanders hin an
    // genau der Stelle, an der es einen geben soll.
    expect(html.indexOf("<!-- LAENDER:START -->")).toBeGreaterThan(html.indexOf("<!-- HANDLUNG:ABSCHLUSS:END -->"));
    // Und er ist keine Frage mehr — also weder ein Aufklapper noch im Schema.
    const block = html.match(/<!-- LAENDER:START -->([\s\S]*?)<!-- LAENDER:END -->/)![1]!;
    expect(block).not.toMatch(/<details/);
    expect(block).toMatch(/<h2[^>]*>Andere Bundesländer<\/h2>/);
    // Die Karte bleibt bei ihm: Sie ist aria-hidden, dieser Absatz ist ihr
    // einziger Zugang für Tastatur und Screenreader.
    const karte = html.indexOf("<!-- KARTE:START -->");
    if (karte !== -1) expect(karte).toBeGreaterThan(html.indexOf("<!-- LAENDER:END -->"));
  });

  it.each(SEITEN)("%s: keine Kennung ist zweimal vergeben", (datei) => {
    // Zwei gleiche `id` auf einer Seite heißt: Der Browser springt zur ersten,
    // und der Link auf die zweite ist still kaputt.
    const ids = [...lies(datei).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
    const doppelt = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect([...new Set(doppelt)]).toEqual([]);
  });

  // Der SEO-Wert dieser Blöcke steckt im FAQPage-JSON-LD. Es muss nach dem
  // Umbau gültig bleiben und darf keine Frage nennen, deren Antworttext von der
  // Seite verschwunden ist — sonst verspricht das Auszeichnungsschema etwas,
  // das die Seite nicht mehr zeigt.
  it.each(MIT_FAQ)("%s: das FAQPage-JSON-LD passt zum sichtbaren Inhalt", (datei) => {
    const html = lies(datei);
    const flach = (o: unknown): Record<string, unknown>[] =>
      Array.isArray(o)
        ? o.flatMap(flach)
        : o && typeof o === "object" && "@graph" in o
          ? flach((o as { "@graph": unknown })["@graph"])
          : [o as Record<string, unknown>];
    // Anführungszeichen vereinheitlichen: Im JSON-LD stehen sie teils gerade,
    // im Fließtext typografisch. Für die Frage „steht die Antwort noch auf der
    // Seite?" ist das kein Unterschied.
    const glatt = (s: string) => s.replace(/[„“”"]/g, '"').replace(/\s+/g, " ");
    const text = glatt(html.replace(/<[^>]+>/g, " "));
    let gepruefteFragen = 0;
    for (const [, roh] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      for (const knoten of flach(JSON.parse(roh ?? ""))) {
        if (!knoten || knoten["@type"] !== "FAQPage") continue;
        const fragen = (knoten.mainEntity ?? []) as { name: string; acceptedAnswer: { text: string } }[];
        expect(fragen.length).toBeGreaterThan(0);
        for (const frage of fragen) {
          expect(frage.name.length).toBeGreaterThan(0);
          expect(frage.acceptedAnswer.text.length).toBeGreaterThan(0);
          gepruefteFragen++;
        }
        // Höchstens so viele Fragen wie sichtbare Aufklapper: Jede ausgezeichnete
        // Frage hat auf der Seite ein Gegenstück.
        const aufklapper = (html.match(/<details class="frage"/g) ?? []).length;
        expect(fragen.length).toBeLessThanOrEqual(aufklapper);
        // Und der Anfang jeder Antwort steht weiterhin im Text der Seite. Nur
        // der Anfang: Einzelne Auszeichnungstexte weichen im weiteren Verlauf
        // schon länger vom Fließtext ab (etwa bundeswehr.html) — dieser Test
        // sichert den Umbau, er ist keine nachträgliche Redaktionsprüfung.
        for (const frage of fragen) {
          expect(text).toContain(glatt(frage.acceptedAnswer.text).slice(0, 40));
        }
      }
    }
    expect(gepruefteFragen).toBeGreaterThan(0);
  });

  // --- FAQ aus einer Quelle (scripts/content-faq.mts) ---------------------

  /**
   * Sichtbarer Aufklapper und `FAQPage`-Eintrag entstanden früher getrennt und
   * liefen auseinander: Auf `papier-oder-digital.html` stand ein FAQPage ganz
   * ohne sichtbare Frage (was Google als Verstoß gegen die Richtlinie für
   * FAQ-Auszeichnung wertet und mit einer manuellen Maßnahme gegen die Domain
   * beantworten kann), auf zwölf weiteren Seiten hatten sichtbarer und
   * ausgezeichneter Fragetext keine einzige Frage gemeinsam. Seit
   * content-faq.mts stammt beides aus derselben Quelle; diese Tests halten
   * fest, dass es dabei bleibt — auch wenn ein anderer Generator (etwa
   * content-laender.mts) eine weitere Frage in den Bereich setzt und
   * content-faq danach nicht erneut läuft.
   */
  const MIT_FAQPAGE = SEITEN.filter((d) => /"@type":\s*"FAQPage"/.test(lies(d)));

  /** Klartext wie im Generator: Tags ersatzlos weg, Entities auf, Leerraum zusammen. */
  const klartext = (html: string) =>
    html
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&(?:quot|#34);/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();

  const sichtbareFragen = (html: string) =>
    [...html.matchAll(/<details class="frage"[^>]*>\s*<summary>\s*<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) =>
      klartext(m[1] ?? ""),
    );

  const schemaFragen = (html: string) => {
    const liste = html.match(/"@type":\s*"FAQPage"[\s\S]*?"mainEntity":\s*\[([\s\S]*?)\n[ \t]*\]/)?.[1] ?? "";
    return [...liste.matchAll(/"name":\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`) as string);
  };

  it.each(MIT_FAQPAGE)("%s: trägt zu jeder ausgezeichneten Frage eine sichtbare", (datei) => {
    // Der eigentliche Punkt: FAQ-Auszeichnung ohne sichtbaren Inhalt ist ein
    // Richtlinienverstoß, kein Schönheitsfehler.
    expect(sichtbareFragen(lies(datei)).length).toBeGreaterThan(0);
  });

  it.each(MIT_FAQPAGE)("%s: sichtbare und ausgezeichnete Fragen sind gleich viele", (datei) => {
    const html = lies(datei);
    expect(schemaFragen(html).length).toBe(sichtbareFragen(html).length);
  });

  it.each(MIT_FAQPAGE)("%s: sichtbare und ausgezeichnete Fragetexte sind dieselben", (datei) => {
    const html = lies(datei);
    // In Dokumentreihenfolge verglichen, nicht nur als Menge: Der Generator
    // schreibt beide Listen in einem Durchgang, ein Versatz wäre schon ein
    // Fehler.
    expect(schemaFragen(html)).toEqual(sichtbareFragen(html));
  });

  it.each(MIT_FAQPAGE)("%s: genau ein Aufklapper steht offen", (datei) => {
    const html = lies(datei);
    expect((html.match(/<details class="frage"[^>]*\bopen>/g) ?? []).length).toBe(1);
  });

  it.each(MIT_FAQ)("%s: im Ausdruck stehen die Aufklapper offen", (datei) => {
    const html = lies(datei);
    const druck = html.match(/@media print \{[\s\S]*?\n {4}\}/)?.[0] ?? "";
    expect(druck).toMatch(/details > \*:not\(summary\) \{ display: block; \}/);
    expect(druck).toMatch(/details::details-content/);
  });

  it.each(MIT_FAQ)("%s: die angesprungene Frage kommt aufgeklappt an", (datei) => {
    // Ein geteilter Link auf eine einzelne Frage nützt nur, wenn sie offen
    // ankommt — von selbst öffnet sich ein <details> beim Anker-Treffer nicht.
    // Gelöst ohne Skript, deshalb in beiden Schreibweisen wie beim Ausdruck.
    const html = lies(datei);
    expect(html).toMatch(/\.frage:target > \*:not\(summary\) \{ display: block; \}/);
    expect(html).toMatch(/\.frage:target::details-content \{ content-visibility: visible;/);
  });

  // --- Sprungmenü auf anleitung.html --------------------------------------

  it("anleitung.html: jede h2 des Textbereichs hat einen Sprungmenü-Eintrag", () => {
    const html = lies("anleitung.html");
    const menue = html.match(/<!-- SPRUNGMENUE:START -->([\s\S]*?)<!-- SPRUNGMENUE:END -->/)?.[1];
    expect(menue).toBeDefined();
    const ziele = [...menue!.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
    expect(ziele.length).toBeGreaterThan(0);
    // Jedes Ziel existiert …
    for (const id of ziele) expect(html).toContain(`<h2 id="${id}"`);
    // … und keine h2 des Textbereichs fehlt im Menü. Überschriften in den
    // Blöcken anderer Generatoren bleiben außen vor (sie verlören ihre Kennung
    // beim nächsten Lauf jenes Generators).
    const hauptteil = html.match(/<main[\s\S]*?<\/main>/)![0];
    const ausBloecken = hauptteil.replace(/<!-- HANDLUNG:[A-Z]+:START -->[\s\S]*?<!-- HANDLUNG:[A-Z]+:END -->/g, "");
    const ueberschriften = [...ausBloecken.matchAll(/<h2\b[^>]*>/g)].length;
    expect(ziele.length).toBe(ueberschriften);
  });

  // --- Fußzeile in Gruppen (scripts/content-nav.mts) -----------------------

  /**
   * Die Gruppierung darf keinen Link verschlucken: Die Fußzeile ist auf jeder
   * Seite der Weg zu allen anderen Bereichen. Geprüft wird gegen die Liste, die
   * der Generator schreibt — abgelesen von der Übersichtsseite, die als einzige
   * keinen ihrer eigenen Links unterdrückt … außer ihrem eigenen.
   */
  const FUSSNAV_ZIELE = [
    "./",
    "./uebersicht.html",
    "./anleitung.html",
    "./vorlage.html",
    "./meldekopf.html",
    "./papier-oder-digital.html",
    "./thw.html",
    "./feuerwehr.html",
    "./staerkemeldung-feuerwehr.html",
    "./drk.html",
    "./johanniter.html",
    "./malteser.html",
    "./asb.html",
    "./dlrg.html",
    "./katastrophenschutz.html",
    "./bbk.html",
    "./bundeswehr.html",
    "./open-source-datenschutz.html",
    "./datenschutz.html",
    "./autor.html",
    "./impressum.html",
  ];

  const MIT_FUSSNAV = SEITEN.filter((d) => /<!-- FUSSNAV:START -->/.test(lies(d)));

  it.each(MIT_FUSSNAV)("%s: die Fußzeile führt alle Bereiche in Gruppen", (datei) => {
    const fuss = lies(datei).match(/<!-- FUSSNAV:START -->([\s\S]*?)<!-- FUSSNAV:END -->/)![1]!;
    const ziele = [...fuss.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]);
    // Der Link auf die eigene Seite entfällt, alle anderen stehen da.
    const erwartet = FUSSNAV_ZIELE.filter((z) => z !== `./${datei}`);
    expect(ziele.sort()).toEqual(erwartet.sort());
    // Gruppentitel in der Versalzeile, keine Gruppe ohne Links.
    const titel = [...fuss.matchAll(/<p class="fussnav-titel">([^<]+)<\/p>/g)].map((m) => m[1]);
    expect(titel.length).toBeGreaterThanOrEqual(3);
    for (const gruppe of fuss.split('<div class="fussnav-gruppe">').slice(1)) {
      expect(gruppe).toMatch(/<a href="/);
    }
  });

  const MIT_FOTO = SEITEN.filter((d) => /figure\.foto img\s*\{/.test(lies(d)));

  it.each(MIT_FOTO)("%s: kein Foto wird auf eine feste Pixelhöhe zugeschnitten", (datei) => {
    // Eine feste `height` in px auf `figure.foto img` schneidet das Bild auf ein
    // Fenster zu, dessen Verhältnis mit dem Viewport wandert — auf dem Desktop
    // blieb vom Fahrzeug ein Streifen aus Rädern und Kühlergrill übrig. Für
    // diese Zielgruppe ist das Foto Wiedererkennung, kein Dekor.
    const regel = lies(datei).match(/figure\.foto img\s*\{([^}]*)\}/)![1]!;
    expect(regel).not.toMatch(/height:\s*[0-9.]+px/);
    expect(regel).toMatch(/height:\s*auto/);
    // `cover` würde auch mit `max-height` wieder schneiden.
    expect(regel).not.toMatch(/object-fit:\s*cover/);
  });

  it.each(SEITEN)("%s: Fließtextblöcke haben eine begrenzte Zeilenlänge", (datei) => {
    const html = lies(datei);
    // Bildunterzeile und Markenhinweis liefen über die volle Inhaltsspalte
    // (rund 99 bzw. 108 Zeichen je Zeile).
    for (const selektor of [/^[ \t]*figcaption \{([^}]*)\}/m, /\.marken-hinweis \{([^}]*)\}/]) {
      const regel = html.match(selektor)?.[1];
      if (regel === undefined) continue;
      expect(regel).toMatch(/max-width:\s*[0-9.]+ch/);
    }
  });

  it.each(SEITEN)("%s: die h1 bricht ausgeglichen um", (datei) => {
    const regel = lies(datei).match(/^[ \t]*h1 \{([^}]*)\}/m)![1]!;
    expect(regel).toMatch(/text-wrap:\s*balance/);
    // Der Grad bleibt die geregelte Leiterstufe --t-2xl; kein clamp mit
    // Zwischenwerten.
    expect(regel).toMatch(/font-size:\s*1\.75rem/);
  });

  /**
   * Deckzeilen-Regel (DESIGN.md): Ein Kasten, der sich abheben soll, bekommt die
   * 4-px-Oberkante des Vordrucks — nie einen Streifen an der linken Flanke. Der
   * Seitenstreifen ist die Handschrift der Consumer-Oberflächen; auf diesen
   * Seiten trug er zusätzlich die Kennfarbe und stand damit ein zweites Mal
   * neben dem einen Knopf, dem sie gehört.
   *
   * Ausnahme: open-source-datenschutz.html trug den Streifen zum Zeitpunkt
   * dieser Umstellung noch, weil an der Seite fremde, laufende Änderungen
   * hingen und sie nicht geschrieben werden durfte. Die Regel steht in
   * scripts/content-stil.mts; ein Lauf von `npm run content-stil` zieht die
   * Seite nach — danach gehört dieser Eintrag gestrichen.
   */
  const SEITENSTREIFEN_AUSNAHME = new Set(["open-source-datenschutz.html"]);
  const OHNE_AUSNAHME = SEITEN.filter((d) => !SEITENSTREIFEN_AUSNAHME.has(d));

  it.each(OHNE_AUSNAHME)("%s: kein farbiger Streifen an der linken Flanke", (datei) => {
    const stil = lies(datei).match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
    // 1 px links ist ein Kastenrand, ab 2 px ist es ein Streifen.
    expect(stil).not.toMatch(/border-left:\s*(?:[2-9]|[1-9]\d)px/);
  });

  const MIT_AUFKLAPP = SEITEN.filter((d) => /<details class="(?:frage|aufklapp)"/.test(lies(d)));

  it.each(MIT_AUFKLAPP)("%s: das Aufklapp-Vorzeichen trägt nicht die Kennfarbe", (datei) => {
    // Kennfarben-Regel: Das Blau gehört dem Kopfbalken und der primären Aktion.
    // Drei bis sechs blaue Pluszeichen je Seite nehmen dem Knopf das Signal.
    const regel = lies(datei).match(/\.frage > summary::before[^{]*\{([^}]*)\}/)![1]!;
    expect(regel).not.toMatch(/var\(--blau/);
    expect(regel).toMatch(/color:\s*#5c6478/);
  });

  it.each(MIT_AUFKLAPP)("%s: der Aufklapp-Stapel hat eine Abschlusskante", (datei) => {
    // .frage hatte nur border-top; der Stapel franste unten in die
    // Handlungsaufforderung aus. Die Kante hängt am letzten Aufklapper des
    // Stapels, nicht am letzten <details> der Seite.
    const stil = lies(datei).match(/<style>([\s\S]*?)<\/style>/)![1]!;
    const regel = stil.match(/\.frage:not\(:has\(~ \.frage\)\)[^{]*\{([^}]*)\}/)?.[1];
    expect(regel).toBeDefined();
    expect(regel).toMatch(/border-bottom:\s*1px solid var\(--rand\)/);
  });

  const MIT_LANDESABSPRUNG = SEITEN.filter((d) => /<h2 id="andere-bundeslaender">/.test(lies(d)));

  it("der Landesabsprung steht auf allen zwölf Länderseiten", () => {
    expect(MIT_LANDESABSPRUNG.length).toBe(12);
  });

  it.each(MIT_LANDESABSPRUNG)("%s: der Landesabsprung tritt hinter die Inhaltsüberschriften zurück", (datei) => {
    // Der Block steht hinter dem Abschlussknopf und ist Navigation nach dem
    // Ziel. Als h2 in voller Stärke behauptete er Gleichrang mit den
    // Inhaltsabschnitten davor. Gliederung und Anker bleiben, das Bild nicht:
    // Versalzeile statt Headline, Linie darüber statt darunter.
    const stil = lies(datei).match(/<style>([\s\S]*?)<\/style>/)![1]!;
    const regel = stil.match(/h2#andere-bundeslaender \{([^}]*)\}/)?.[1];
    expect(regel).toBeDefined();
    expect(regel).toMatch(/font-size:\s*0\.8125rem/);
    expect(regel).toMatch(/text-transform:\s*uppercase/);
    expect(regel).toMatch(/border-top:\s*1px solid var\(--rand\)/);
    expect(regel).toMatch(/border-bottom:\s*0/);
    expect(regel).not.toMatch(/var\(--blau/);
  });
});
