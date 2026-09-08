/**
 * Diamant-Prüfung: genau eine Kopie jedes Kern-Bausteins im Abhängigkeitsbaum.
 *
 * `@bos/eeb-format` liefert die Typen des Bogens; `@bos/meldekopf`,
 * `@bos/vokabulare` und `@bos/taktische-zeichen` bauen darauf auf. Binden die
 * drei das Format je selbst als normale Abhängigkeit ein, liegen mehrere
 * Kopien im Baum — und TypeScript sieht dann mehrere verschiedene Typen
 * „Bogen". Die Fehlermeldung nennt zweimal denselben Namen und sieht
 * unerklärlich aus; die Ursache steht in keinem Stapelabzug.
 *
 * Gegenmaßnahme aus ADR-003: das Format ist in den anderen Bausteinen
 * `peerDependency`, nicht `dependency`, und dieses Repo liefert die einzige
 * Kopie unter `vendor/eeb-format`. Diese Prüfung hält beides fest:
 *
 *  1. Kein Kern-Baustein führt einen anderen als `dependency` — nur als
 *     `peerDependency`.
 *  2. Von jedem Baustein liegt höchstens ein `package.json` im Baum.
 *
 * Läuft ohne Netz und ohne Bau; gedacht als schneller CI-Schritt vor den Tests.
 *
 *     npm run kern-kopien
 */

import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = fileURLToPath(new URL("..", import.meta.url));

/** Die Bausteine aus ADR-003. `eeb-format` steht bewusst zuerst: es ist der
 *  Baustein, den alle anderen sehen, und damit der eigentliche Diamant. */
const KERN_PAKETE = [
  "@bos/eeb-format",
  "@bos/meldekopf",
  "@bos/vokabulare",
  "@bos/taktische-zeichen",
];

interface PaketDatei {
  name?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

function lies(pfad: string): PaketDatei {
  return JSON.parse(readFileSync(pfad, "utf8")) as PaketDatei;
}

/**
 * Alle `package.json` unterhalb eines Verzeichnisses. `node_modules` wird
 * mitgenommen — dort entstehen die Doppelkopien —, `.git` und `dist` nicht.
 */
function paketDateien(verzeichnis: string, tiefe = 0): string[] {
  if (tiefe > 12 || !existsSync(verzeichnis)) return [];
  const treffer: string[] = [];
  for (const eintrag of readdirSync(verzeichnis, { withFileTypes: true })) {
    if (eintrag.name === ".git" || eintrag.name === "dist" || eintrag.name === "coverage") continue;
    const pfad = join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) treffer.push(...paketDateien(pfad, tiefe + 1));
    else if (eintrag.name === "package.json") treffer.push(pfad);
  }
  return treffer;
}

export function pruefen(wurzel = WURZEL): string[] {
  const klagen: string[] = [];
  const dateien = [
    ...paketDateien(join(wurzel, "vendor")),
    ...paketDateien(join(wurzel, "node_modules", "@bos")),
  ];
  const eigen = join(wurzel, "package.json");
  if (existsSync(eigen)) dateien.push(eigen);

  // 1. Kern-Bausteine dürfen einander nur als peerDependency führen.
  for (const datei of dateien) {
    const paket = lies(datei);
    if (!paket.name || !KERN_PAKETE.includes(paket.name)) continue;
    for (const abhaengigkeit of Object.keys(paket.dependencies ?? {})) {
      if (KERN_PAKETE.includes(abhaengigkeit)) {
        klagen.push(
          `${paket.name} führt ${abhaengigkeit} als dependency. ` +
            "Im Kern gehört das in peerDependencies, sonst liegt es doppelt im Baum " +
            "(ADR-003, Nachtrag „Diamant auf eeb-format\").",
        );
      }
    }
  }

  // 2. Höchstens eine Kopie je Baustein — über den aufgelösten Pfad gezählt,
  //    damit ein Symlink (file:-Abhängigkeit) nicht als zweite Kopie zählt.
  for (const kernPaket of KERN_PAKETE) {
    const orte = new Set(
      dateien
        .filter((d) => lies(d).name === kernPaket)
        .map((d) => realpathSync(d)),
    );
    if (orte.size > 1) {
      klagen.push(
        `${kernPaket} liegt ${orte.size}-mal im Baum:\n    ` +
          [...orte].map((o) => o.replace(wurzel, "")).join("\n    ") +
          "\n  TypeScript sieht dann verschiedene Typen gleichen Namens.",
      );
    }
  }
  return klagen;
}

function main(): void {
  const klagen = pruefen();
  if (klagen.length === 0) {
    console.log("Kern-Bausteine: genau eine Kopie je Baustein, keine dependency-Verweise untereinander.");
    return;
  }
  console.error("Diamant-Prüfung fehlgeschlagen:");
  for (const klage of klagen) console.error(`  - ${klage}`);
  process.exitCode = 1;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main();
