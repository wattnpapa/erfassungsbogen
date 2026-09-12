/**
 * SBOM (Software Bill of Materials) im CycloneDX-Format erzeugen.
 *
 * Hintergrund: Wer die App im Behördenumfeld einsetzt, muss beantworten können,
 * welche fremden Bausteine darin stecken — und wer eine Schwachstellenmeldung
 * bewerten will, braucht dieselbe Liste maschinenlesbar. Ohne SBOM heißt das
 * jedes Mal: Baum von Hand durchgehen. Mit SBOM liest ein Werkzeug die Datei:
 *
 *     grype sbom:sbom.cdx.json
 *
 * oder Hochladen in OWASP Dependency-Track. Die Datei entsteht im CI bei jedem
 * Release und hängt am GitHub-Release; lokal:
 *
 *     npm run sbom                    # schreibt sbom.cdx.json
 *     npm run sbom -- --aus pfad.json # anderer Ablageort
 *
 * Quelle sind die `package-lock.json`-Dateien — des Hauptrepos und der vier
 * Kern-Submodule unter `vendor/` (ADR-003). Bewusst NICHT `node_modules`:
 * ein Lockfile (`lockfileVersion` 3) trägt den vollständig aufgelösten Baum mit
 * exakter Version, Tarball-URL und Integritäts-Hash je Paket. Es muss also
 * nichts installiert und nichts heruntergeladen sein, damit das hier läuft —
 * das Ergebnis ist trotzdem dasselbe wie nach einem `npm ci`.
 *
 * `scope` unterscheidet, was in der ausgelieferten App landet (`required`) und
 * was reines Bau-/Testwerkzeug ist (`optional`): npm markiert Letzteres im
 * Lockfile mit `dev`. Ein Scanner-Treffer auf ein Paket mit `optional` betrifft
 * den Build-Rechner, keinen Einsatzrechner — der Unterschied entscheidet, wie
 * eilig eine Meldung ist. Zusätzlich hält die Eigenschaft
 * `erfassungsbogen:usedIn` fest, aus welchem der fünf Pakete eine Abhängigkeit
 * stammt, damit ein Treffer nicht erst gesucht werden muss.
 *
 * Die Seriennummer wird aus dem Inhalt abgeleitet statt zufällig gezogen: zwei
 * Läufe über denselben Baum ergeben dieselbe Datei (bis auf den Zeitstempel),
 * ein Diff zeigt also echte Änderungen am Abhängigkeitsbaum statt Rauschen.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = fileURLToPath(new URL("..", import.meta.url));

/** Hauptrepo zuerst, danach die vier Kern-Submodule (ADR-003). */
const PAKET_ORTE = ["", "vendor/eeb-format", "vendor/bos-meldekopf", "vendor/bos-vokabulare", "vendor/bos-taktische-zeichen"];

interface LockEintrag {
  name?: string;
  version?: string;
  resolved?: string;
  integrity?: string;
  dev?: boolean;
  devOptional?: boolean;
  link?: boolean;
}

interface Lockfile {
  name?: string;
  version?: string;
  packages?: Record<string, LockEintrag>;
}

interface Hash {
  alg: string;
  content: string;
}

interface Komponente {
  type: "library";
  "bom-ref": string;
  name: string;
  version: string;
  scope: "required" | "optional";
  purl?: string;
  externalReferences?: { type: string; url: string }[];
  hashes?: Hash[];
  properties?: { name: string; value: string }[];
}

/** Sammelt je Paket-Version, aus welchem Herkunftspaket sie kommt und ob dort Laufzeit. */
interface Sammelstelle {
  name: string;
  version: string;
  resolved?: string;
  integrity?: string;
  /** true, sobald die Abhängigkeit in mindestens einem Paket zur Laufzeit gebraucht wird. */
  laufzeit: boolean;
  /** Herkunft je Paket: „@bos/meldekopf (dev)". Sortiert, damit die Ausgabe stabil bleibt. */
  herkunft: Set<string>;
}

/**
 * Paketname aus einem Lockfile-Schlüssel. `node_modules/a/node_modules/b` ist
 * die verschachtelte Auflösung von `b` — maßgeblich ist immer der Teil hinter
 * dem LETZTEN `node_modules/`, sonst zählte dieselbe Version doppelt.
 */
function nameAusSchluessel(schluessel: string): string {
  const stelle = schluessel.lastIndexOf("node_modules/");
  return stelle < 0 ? schluessel : schluessel.slice(stelle + "node_modules/".length);
}

/**
 * npm schreibt Integritäts-Hashes als Subresource Integrity („sha512-<base64>"),
 * CycloneDX erwartet Algorithmus und Hex getrennt. Mehrere Hashes können durch
 * Leerzeichen getrennt in einem Feld stehen.
 */
function hashes(integrity: string | undefined): Hash[] | undefined {
  if (!integrity) return undefined;
  const namen: Record<string, string> = { sha512: "SHA-512", sha256: "SHA-256", sha384: "SHA-384", sha1: "SHA-1" };
  const liste = integrity
    .split(/\s+/)
    .map((eintrag) => {
      const [alg, base64] = eintrag.split("-", 2);
      const cdx = namen[alg ?? ""];
      if (!cdx || !base64) return null;
      return { alg: cdx, content: Buffer.from(base64, "base64").toString("hex") };
    })
    .filter((h): h is Hash => h != null);
  return liste.length ? liste : undefined;
}

/** Package-URL nach purl-Spezifikation; der `@scope` wird prozentkodiert. */
function purl(name: string, version: string): string {
  if (!name.startsWith("@")) return `pkg:npm/${name}@${version}`;
  const [bereich, rest] = name.split("/", 2);
  return `pkg:npm/${encodeURIComponent(bereich!)}/${rest}@${version}`;
}

function lockfileLesen(ort: string): { paket: string; lock: Lockfile } | null {
  const datei = join(WURZEL, ort, "package-lock.json");
  if (!existsSync(datei)) return null;
  const lock = JSON.parse(readFileSync(datei, "utf8")) as Lockfile;
  return { paket: lock.packages?.[""]?.name ?? lock.name ?? ort, lock };
}

/**
 * Commit des Submoduls als Version des Kern-Bausteins. Die vier `package.json`
 * dort stehen alle auf `0.0.0` (sie werden nicht auf npm veröffentlicht) —
 * identifizierbar ist ein Stand nur über den Commit, und genau den braucht,
 * wer einen ausgelieferten Build später einem Quellstand zuordnen will.
 */
function submodulStand(ort: string): string {
  try {
    return execFileSync("git", ["-C", join(WURZEL, ort), "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "unbekannt"; // Tarball statt Git-Checkout
  }
}

/** Alle Lockfiles einlesen und zu einer deduplizierten Komponentenliste verschmelzen. */
function sammeln(): { komponenten: Komponente[]; eigene: { name: string; ort: string }[]; fehlend: string[] } {
  const gesammelt = new Map<string, Sammelstelle>();
  const eigene: { name: string; ort: string }[] = [];
  const fehlend: string[] = [];

  for (const ort of PAKET_ORTE) {
    const gelesen = lockfileLesen(ort);
    if (!gelesen) {
      // Submodul nicht ausgecheckt: lieber laut abbrechen als eine SBOM
      // ausliefern, der ein Viertel des Baums fehlt.
      fehlend.push(ort || ".");
      continue;
    }
    const { paket, lock } = gelesen;
    if (ort) eigene.push({ name: paket, ort });

    for (const [schluessel, eintrag] of Object.entries(lock.packages ?? {})) {
      if (!schluessel.includes("node_modules/")) continue; // Wurzeleintrag und Workspaces
      if (eintrag.link) continue; // `file:`-Verweis auf ein Submodul, kein Fremdpaket
      const name = eintrag.name ?? nameAusSchluessel(schluessel);
      const version = eintrag.version;
      if (!version) continue;
      // Die vier Kern-Bausteine hängen als `file:`-Abhängigkeit im Baum; sie
      // sind eigener Quelltext und stehen weiter unten als eigene Komponente.
      if (name.startsWith("@bos/")) continue;

      const laufzeit = !eintrag.dev && !eintrag.devOptional;
      const stelle = gesammelt.get(`${name}@${version}`) ?? {
        name,
        version,
        resolved: eintrag.resolved,
        integrity: eintrag.integrity,
        laufzeit: false,
        herkunft: new Set<string>(),
      };
      stelle.laufzeit ||= laufzeit;
      stelle.resolved ??= eintrag.resolved;
      stelle.integrity ??= eintrag.integrity;
      stelle.herkunft.add(`${paket} (${laufzeit ? "prod" : "dev"})`);
      gesammelt.set(`${name}@${version}`, stelle);
    }
  }

  const komponenten = [...gesammelt.values()]
    .sort((a, b) => a.name.localeCompare(b.name, "en") || a.version.localeCompare(b.version, "en"))
    .map<Komponente>((s) => ({
      type: "library",
      "bom-ref": `${s.name}@${s.version}`,
      name: s.name,
      version: s.version,
      scope: s.laufzeit ? "required" : "optional",
      purl: purl(s.name, s.version),
      ...(s.resolved ? { externalReferences: [{ type: "distribution", url: s.resolved }] } : {}),
      ...(hashes(s.integrity) ? { hashes: hashes(s.integrity) } : {}),
      properties: [...s.herkunft].sort().map((value) => ({ name: "erfassungsbogen:usedIn", value })),
    }));

  return { komponenten, eigene, fehlend };
}

/**
 * Seriennummer aus dem Inhalt ableiten (UUID-Form, Version-4-Bits gesetzt).
 * Zufällig gezogen änderte sie sich bei jedem Lauf, und ein Diff der SBOM
 * zeigte immer eine Änderung — auch wenn sich am Baum nichts getan hat.
 */
function seriennummer(inhalt: string): string {
  const h = createHash("sha256").update(inhalt).digest("hex");
  const teile = [h.slice(0, 8), h.slice(8, 12), `4${h.slice(13, 16)}`, `8${h.slice(17, 20)}`, h.slice(20, 32)];
  return `urn:uuid:${teile.join("-")}`;
}

function sbomErzeugen(): string {
  const { komponenten, eigene, fehlend } = sammeln();
  if (fehlend.length) {
    throw new Error(
      `Kein package-lock.json in: ${fehlend.join(", ")}. Submodule auschecken (git submodule update --init --recursive), sonst fehlt der halbe Baum in der SBOM.`,
    );
  }

  const paket = JSON.parse(readFileSync(join(WURZEL, "package.json"), "utf8")) as { name: string; version: string; description?: string };
  const version = process.env.APP_BUILD_VERSION || paket.version;

  // Die vier Kern-Bausteine sind eigener Quelltext, kein Registry-Paket:
  // bewusst OHNE purl (es gibt kein `pkg:npm/@bos/...`, das man scannen
  // könnte) und mit Verweis auf das jeweilige Submodul-Repo.
  const kern = eigene
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .map<Komponente>(({ name, ort }) => {
      const commit = submodulStand(ort);
      return {
        type: "library",
        "bom-ref": `${name}@${commit}`,
        name,
        version: commit,
        scope: "required",
        properties: [
          { name: "erfassungsbogen:usedIn", value: `${paket.name} (prod, vendored)` },
          { name: "erfassungsbogen:vendorPath", value: ort },
        ],
      };
    });

  const alle = [...kern, ...komponenten];
  const bom = {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    serialNumber: seriennummer(JSON.stringify(alle)),
    version: 1,
    metadata: {
      // Reproduzierbare Builds können den Zeitstempel über SOURCE_DATE_EPOCH
      // festnageln; sonst ist es die Laufzeit.
      timestamp: new Date(process.env.SOURCE_DATE_EPOCH ? Number(process.env.SOURCE_DATE_EPOCH) * 1000 : Date.now())
        .toISOString()
        .replace(/\.\d{3}Z$/, "Z"),
      tools: { components: [{ type: "application", name: "scripts/sbom.ts", version: "1.0.0" }] },
      component: {
        type: "application",
        "bom-ref": `${paket.name}@${version}`,
        name: paket.name,
        version,
        description: paket.description,
        licenses: [{ license: { id: "EUPL-1.2" } }],
      },
    },
    components: alle,
  };
  return `${JSON.stringify(bom, null, 2)}\n`;
}

const ausIndex = process.argv.indexOf("--aus");
const ziel = ausIndex >= 0 ? process.argv[ausIndex + 1]! : join(WURZEL, "sbom.cdx.json");
const inhalt = sbomErzeugen();
writeFileSync(ziel, inhalt);
const anzahl = (JSON.parse(inhalt) as { components: Komponente[] }).components;
const laufzeit = anzahl.filter((k) => k.scope === "required").length;
console.log(`SBOM geschrieben: ${ziel}`);
console.log(`  ${anzahl.length} Komponenten — davon ${laufzeit} mit Laufzeit-Rolle, ${anzahl.length - laufzeit} reines Bau-/Testwerkzeug`);
