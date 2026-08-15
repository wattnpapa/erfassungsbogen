// @vitest-environment jsdom
// Die Logiktests laufen sonst in Node; hier braucht es einen XML-Parser, um die
// erzeugte Sitemap wirklich gegen das Schema zu prüfen statt gegen Textmuster.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import {
  DATEIEN,
  eintraegeErzeugen,
  eintraegeSammeln,
  istFlacherKlon,
  letztesCommitDatum,
  quellen,
  sitemapErzeugen,
  sitemapXml,
} from "./sitemap";

const WURZEL = join(import.meta.dirname, "..");

/**
 * Verzeichnisinhalt von public/ wie readdirSync ihn liefert (unsortiert),
 * dazu die verlinkten Downloads mit ihrem Pfad — genau die Liste, die auch
 * eintraegeErzeugen zusammenstellt.
 */
const PUBLIC_ECHT = [...readdirSync(join(WURZEL, "public")), ...Object.keys(DATEIEN)];

/** Adressen der Nicht-HTML-Einträge (Downloads) — sie haben kein Canonical. */
const DATEI_ADRESSEN = Object.keys(DATEIEN).map((d) => `https://erfassungsbogen.app/${d}`);

/** Fester Datumsgeber, damit die Sammellogik ohne git prüfbar bleibt. */
const FESTES_DATUM = () => "2026-01-31";

/** Adresse aus dem rel="canonical" einer Seite — die Sitemap muss sie treffen. */
function canonical(datei: string): string | undefined {
  const html = readFileSync(join(WURZEL, datei), "utf8");
  return html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1];
}

/** Parst als XML und liefert das Dokument; wirft bei nicht wohlgeformtem XML. */
function xmlParsen(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const fehler = doc.querySelector("parsererror");
  if (fehler) throw new Error(`XML nicht wohlgeformt: ${fehler.textContent}`);
  return doc;
}

describe("eintraegeSammeln", () => {
  it("nimmt die Startseite und jede öffentliche Seite auf, aber nicht die 404", () => {
    const locs = eintraegeSammeln(["anleitung.html", "404.html", "impressum.html"], FESTES_DATUM).map((e) => e.loc);
    expect(locs).toContain("https://erfassungsbogen.app/");
    expect(locs).toContain("https://erfassungsbogen.app/anleitung.html");
    expect(locs).toContain("https://erfassungsbogen.app/impressum.html");
    expect(locs).not.toContain("https://erfassungsbogen.app/404.html");
  });

  it("übergeht alles, was keine Seite ist (Icons, robots.txt, Unterordner)", () => {
    const locs = eintraegeSammeln(["robots.txt", "icon.svg", "og-bild.jpg", "icons"], FESTES_DATUM).map((e) => e.loc);
    expect(locs).toEqual(["https://erfassungsbogen.app/"]);
  });

  it("hält die gewollte Reihenfolge und die priority-Werte der bisherigen Sitemap", () => {
    const eintraege = eintraegeSammeln(PUBLIC_ECHT, FESTES_DATUM);
    expect(eintraege.slice(0, 4).map((e) => [e.loc, e.priority])).toEqual([
      ["https://erfassungsbogen.app/", "1.0"],
      ["https://erfassungsbogen.app/anleitung.html", "0.8"],
      ["https://erfassungsbogen.app/vorlage.html", "0.8"],
      ["https://erfassungsbogen.app/thw.html", "0.7"],
    ]);
    const werte = Object.fromEntries(eintraege.map((e) => [e.loc, e.priority]));
    expect(werte["https://erfassungsbogen.app/papier-oder-digital.html"]).toBe("0.6");
    expect(werte["https://erfassungsbogen.app/impressum.html"]).toBe("0.3");
    expect(werte["https://erfassungsbogen.app/datenschutz.html"]).toBe("0.3");
  });

  it("hängt eine neue Seite hinter die bekannten Seiten mit 0.7 an", () => {
    const eintraege = eintraegeSammeln([...PUBLIC_ECHT, "bergwacht.html"], FESTES_DATUM);
    const seiten = eintraege.filter((e) => !DATEI_ADRESSEN.includes(e.loc));
    expect(seiten[seiten.length - 1]).toMatchObject({
      loc: "https://erfassungsbogen.app/bergwacht.html",
      priority: "0.7",
    });
  });

  it("nimmt die verlinkten Downloads auf — aber nur, solange die Datei da ist", () => {
    const eintraege = eintraegeSammeln(PUBLIC_ECHT, FESTES_DATUM);
    // Die Downloads stehen am Ende, hinter allen Seiten.
    expect(eintraege.slice(-DATEI_ADRESSEN.length).map((e) => e.loc)).toEqual(DATEI_ADRESSEN);
    for (const [datei, prioritaet] of Object.entries(DATEIEN)) {
      const eintrag = eintraege.find((e) => e.loc.endsWith(`/${datei}`));
      expect(eintrag, `${datei} fehlt in der Sitemap`).toBeDefined();
      expect(eintrag!.priority).toBe(prioritaet);
      // lastmod kommt aus genau dieser Datei, nicht aus dem Ordner.
      expect(quellen(datei)).toEqual([`public/${datei}`]);
    }
    // Fehlt die Datei in public/, darf auch kein Eintrag entstehen.
    const ohneDownloads = eintraegeSammeln(
      PUBLIC_ECHT.filter((d) => !(d in DATEIEN)),
      FESTES_DATUM,
    ).map((e) => e.loc);
    for (const adresse of DATEI_ADRESSEN) expect(ohneDownloads).not.toContain(adresse);
  });

  it("hält jede gelistete Download-Datei auch wirklich in public/ vor", () => {
    for (const datei of Object.keys(DATEIEN)) {
      expect(() => readFileSync(join(WURZEL, "public", datei)), `${datei} fehlt`).not.toThrow();
    }
  });

  it("lässt eine gelöschte Seite weg, auch wenn sie noch in der priority-Tabelle steht", () => {
    const ohneDlrg = PUBLIC_ECHT.filter((d) => d !== "dlrg.html");
    const locs = eintraegeSammeln(ohneDlrg, FESTES_DATUM).map((e) => e.loc);
    expect(locs).not.toContain("https://erfassungsbogen.app/dlrg.html");
    expect(locs).toContain("https://erfassungsbogen.app/drk.html");
  });

  it("deckt sich Adresse für Adresse mit den canonical-Angaben der Seiten", () => {
    const erwartet = new Set([canonical("index.html")]);
    for (const datei of PUBLIC_ECHT.filter((d) => d.endsWith(".html") && d !== "404.html")) {
      const adresse = canonical(join("public", datei));
      expect(adresse, `${datei} hat kein rel="canonical"`).toBeDefined();
      erwartet.add(adresse);
    }
    // Downloads tragen kein Canonical und werden darum getrennt geprüft (siehe
    // den Test darüber); für die HTML-Seiten muss die Deckung exakt bleiben:
    // keine Seite ohne Sitemap-Eintrag, kein Eintrag ohne Seite, keine Dublette.
    const locs = eintraegeSammeln(PUBLIC_ECHT, FESTES_DATUM)
      .map((e) => e.loc)
      .filter((loc) => !DATEI_ADRESSEN.includes(loc));
    expect(new Set(locs)).toEqual(erwartet);
    expect(locs).toHaveLength(erwartet.size);
  });
});

describe("Datumslogik", () => {
  it("liest das Datum der Startseite aus index.html UND src/ — die App ist die Startseite", () => {
    // Eine Änderung an einer Komponente ändert die Startseite, ohne die
    // index.html anzufassen; stünde src/ nicht dabei, veraltete das Datum.
    expect(quellen("")).toEqual(["index.html", "src"]);
  });

  it("liest das Datum einer Textseite aus genau ihrer Datei in public/", () => {
    expect(quellen("anleitung.html")).toEqual(["public/anleitung.html"]);
  });

  it("fragt für jeden Eintrag die zugehörigen Quelldateien ab und übernimmt das Datum", () => {
    const gefragt: string[][] = [];
    const eintraege = eintraegeSammeln(["anleitung.html"], (pfade) => {
      gefragt.push(pfade);
      return pfade[0] === "index.html" ? "2026-02-01" : "2026-03-04";
    });
    expect(gefragt).toEqual([["index.html", "src"], ["public/anleitung.html"]]);
    expect(eintraege.map((e) => e.lastmod)).toEqual(["2026-02-01", "2026-03-04"]);
  });

  it("lässt lastmod weg, wenn git kein Datum kennt (neue Seite, flacher Klon)", () => {
    const eintraege = eintraegeSammeln(["anleitung.html"], () => undefined);
    expect(eintraege.every((e) => e.lastmod === undefined)).toBe(true);
    // Ohne lastmod bleibt das Dokument gültig — nur das Frische-Signal fehlt.
    const doc = xmlParsen(sitemapXml(eintraege));
    expect(doc.querySelectorAll("url")).toHaveLength(2);
    expect(doc.querySelectorAll("lastmod")).toHaveLength(0);
    expect(doc.querySelectorAll("priority")).toHaveLength(2);
  });
});

describe("sitemapXml", () => {
  const eintraege = eintraegeSammeln(PUBLIC_ECHT, FESTES_DATUM);
  const doc = xmlParsen(sitemapXml(eintraege));

  it("ist wohlgeformtes XML mit dem Sitemap-0.9-Namensraum", () => {
    expect(doc.documentElement.tagName).toBe("urlset");
    expect(doc.documentElement.namespaceURI).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");
    expect(doc.querySelectorAll("url")).toHaveLength(eintraege.length);
  });

  it("nennt je <url> nur die Schema-Elemente und das in der vorgeschriebenen Reihenfolge", () => {
    for (const url of doc.querySelectorAll("url")) {
      const kinder = [...url.children].map((k) => k.tagName);
      expect(kinder).toEqual(["loc", "lastmod", "priority"]);
    }
  });

  it("führt ausschließlich absolute https-Adressen", () => {
    for (const loc of doc.querySelectorAll("loc")) {
      const adresse = loc.textContent ?? "";
      expect(adresse).toMatch(/^https:\/\/erfassungsbogen\.app\//);
      expect(() => new URL(adresse)).not.toThrow();
    }
  });

  it("schreibt lastmod als YYYY-MM-DD und priority zwischen 0.0 und 1.0", () => {
    for (const url of doc.querySelectorAll("url")) {
      expect(url.querySelector("lastmod")!.textContent).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const priority = Number(url.querySelector("priority")!.textContent);
      expect(priority).toBeGreaterThanOrEqual(0);
      expect(priority).toBeLessThanOrEqual(1);
    }
  });

  it("maskiert & und < in der Adresse, damit kein XML zerbricht", () => {
    const xml = sitemapXml([{ loc: "https://erfassungsbogen.app/a&b.html", priority: "0.7" }]);
    expect(xml).toContain("<loc>https://erfassungsbogen.app/a&amp;b.html</loc>");
    expect(xmlParsen(xml).querySelector("loc")!.textContent).toBe("https://erfassungsbogen.app/a&b.html");
  });
});

describe("flache Git-Historie", () => {
  // Ein Wegwerf-Repo mit zwei Commits, davon einer flach geklont. Zwei Commits
  // braucht es, damit beim Klonen überhaupt etwas abzuschneiden ist.
  const tmp = mkdtempSync(join(tmpdir(), "eeb-sitemap-"));
  const voll = join(tmp, "voll");
  const flach = join(tmp, "flach");

  const git = (wo: string, ...argumente: string[]) =>
    execFileSync("git", argumente, { cwd: wo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

  /** Das Skript liest %cs, also das Committer-Datum — nicht `git commit --date`. */
  const commit = (datum: string, nachricht: string) =>
    execFileSync("git", ["commit", "--quiet", "-m", nachricht], {
      cwd: voll,
      stdio: ["ignore", "pipe", "ignore"],
      env: { ...process.env, GIT_COMMITTER_DATE: `${datum}T10:00:00Z`, GIT_AUTHOR_DATE: `${datum}T10:00:00Z` },
    });

  mkdirSync(join(voll, "public"), { recursive: true });
  git(tmp, "init", "--quiet", "--initial-branch=main", voll);
  git(voll, "config", "user.email", "test@example.invalid");
  git(voll, "config", "user.name", "Test");
  writeFileSync(join(voll, "public", "anleitung.html"), "<html></html>");
  writeFileSync(join(voll, "index.html"), "<html></html>");
  git(voll, "add", "-A");
  commit("2026-01-02", "erster");
  writeFileSync(join(voll, "public", "impressum.html"), "<html></html>");
  git(voll, "add", "-A");
  commit("2026-03-04", "zweiter");
  git(tmp, "clone", "--quiet", "--depth", "1", `file://${voll}`, flach);

  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it("erkennt den flachen Klon und die vollständige Historie", () => {
    expect(istFlacherKlon(flach)).toBe(true);
    expect(istFlacherKlon(voll)).toBe(false);
  });

  it("würde im flachen Klon jeder Seite dasselbe Datum zuschreiben — genau die Falle", () => {
    // Nicht „kein Datum", sondern für alle Seiten dasselbe: das macht den
    // flachen Klon gefährlich und die Prüfung nötig.
    const anleitung = letztesCommitDatum(["public/anleitung.html"], flach);
    const impressum = letztesCommitDatum(["public/impressum.html"], flach);
    expect(anleitung).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(anleitung).toBe(impressum);
    // Mit voller Historie tragen die beiden Seiten ihre eigenen Daten.
    expect(letztesCommitDatum(["public/anleitung.html"], voll)).toBe("2026-01-02");
    expect(letztesCommitDatum(["public/impressum.html"], voll)).toBe("2026-03-04");
  });

  it("lässt lastmod im flachen Klon weg und warnt", () => {
    const warnung = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const eintraege = eintraegeErzeugen(flach);
      expect(eintraege.length).toBeGreaterThan(0);
      expect(eintraege.every((e) => e.lastmod === undefined)).toBe(true);
      expect(warnung).toHaveBeenCalledWith(expect.stringContaining("fetch-depth: 0"));
    } finally {
      warnung.mockRestore();
    }
  });

  it("nennt bei voller Historie die Daten der jeweiligen Seite", () => {
    const daten = Object.fromEntries(eintraegeErzeugen(voll).map((e) => [e.loc, e.lastmod]));
    expect(daten["https://erfassungsbogen.app/anleitung.html"]).toBe("2026-01-02");
    expect(daten["https://erfassungsbogen.app/impressum.html"]).toBe("2026-03-04");
    // Die Startseite hängt an index.html UND src/ — hier nur der erste Commit.
    expect(daten["https://erfassungsbogen.app/"]).toBe("2026-01-02");
  });
});

describe("sitemapErzeugen (mit echtem git-Aufruf)", () => {
  // Bei flachem Klon (fetch-depth: 1) kennt git die älteren Commits nicht;
  // dann fehlen Datumsangaben. Geprüft wird darum nur: was da ist, ist gültig.
  const doc = xmlParsen(sitemapErzeugen(WURZEL));

  it("liefert für die echten Seiten ein gültiges Dokument", () => {
    expect(doc.querySelectorAll("url").length).toBeGreaterThanOrEqual(PUBLIC_ECHT.filter((d) => d.endsWith(".html")).length);
    for (const loc of doc.querySelectorAll("loc")) {
      // Startseite, Textseite oder ein verlinkter Download aus einem Unterordner.
      expect(loc.textContent).toMatch(
        /^https:\/\/erfassungsbogen\.app\/([a-z0-9-]+\.html|[a-z0-9-]+\/[a-z0-9-]+\.[a-z0-9]+)?$/,
      );
    }
  });

  it("nennt echte Commit-Daten im Format YYYY-MM-DD", () => {
    for (const lastmod of doc.querySelectorAll("lastmod")) {
      expect(lastmod.textContent).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(lastmod.textContent!).getTime()).not.toBeNaN();
    }
  });
});
