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
    const bloecke = [...html.matchAll(/<details class="frage"(?: open)?>([\s\S]*?)<\/details>/g)];
    expect(bloecke.length).toBeGreaterThan(0);
    for (const [, rumpf] of bloecke) {
      expect(rumpf).toMatch(/<summary><h3>[\s\S]+?<\/h3><\/summary>/);
    }
    // Genau der erste Block steht offen: Ohne ihn sähe der Bereich aus wie eine
    // Liste von Überschriften, und niemand käme auf die Idee zu klicken.
    expect((html.match(/<details class="frage" open>/g) ?? []).length).toBe(1);
    expect(html.indexOf('<details class="frage" open>')).toBe(html.indexOf('<details class="frage"'));
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

  it.each(MIT_FAQ)("%s: im Ausdruck stehen die Aufklapper offen", (datei) => {
    const html = lies(datei);
    const druck = html.match(/@media print \{[\s\S]*?\n {4}\}/)?.[0] ?? "";
    expect(druck).toMatch(/details > \*:not\(summary\) \{ display: block; \}/);
    expect(druck).toMatch(/details::details-content/);
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
});
