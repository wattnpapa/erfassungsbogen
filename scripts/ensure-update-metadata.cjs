// Stellt sicher, dass electron-updater-Metadaten (latest*.yml) in release/
// liegen. electron-builder legt sie bei Datums-Versionen mit Prerelease-Teil
// (z. B. 2026.7.11-18.47) nicht unter diesem Namen an — dann schreiben wir
// sie selbst. Übernommen aus S1-Control (ensure-update-metadata.cjs).
//
// Windows hat zwei Architekturen (x64 und arm64) und electron-updater kennt
// dort nur EINEN Standardnamen: Wer zuletzt gebaut hat, gewinnt die
// latest.yml. Deshalb wird sie hier auf das x64-Paket festgenagelt und für
// ARM64 eine eigene latest-arm64.yml geschrieben, die die ARM-Installation
// über ihren eigenen Kanal liest (siehe electron/main.js). Sonst würde sich
// ein ARM64-Gerät beim nächsten Update das emulierte x64-Paket installieren —
// und damit den Kamerazugriff (QR-Scan) verlieren.
//
// Aufruf: node scripts/ensure-update-metadata.cjs <mac|win|linux>
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function fehler(nachricht) {
  console.error(nachricht);
  process.exit(1);
}

function sha512Base64(dateiPfad) {
  return crypto.createHash("sha512").update(fs.readFileSync(dateiPfad)).digest("base64");
}

// Pro Plattform das Artefakt, auf das die Update-Metadaten zeigen:
// mac aktualisiert über das zip, win über die NSIS-exe, linux über das deb.
function artefaktWaehlen(plattform, ordner, arch) {
  const dateien = fs.readdirSync(ordner);
  if (plattform === "mac") {
    return dateien.find((n) => n.endsWith(".zip") && n.includes("-mac-")) ?? null;
  }
  if (plattform === "win") {
    return dateien.find((n) => n.endsWith(".exe") && n.includes(`-win-${arch}.`)) ?? null;
  }
  if (plattform === "linux") {
    return dateien.find((n) => n.endsWith(".deb") && n.includes("-linux-")) ?? null;
  }
  return null;
}

function yamlBauen(version, artefaktName, groesse, sha512) {
  return [
    `version: ${version}`,
    `files:`,
    `  - url: ${artefaktName}`,
    `    sha512: ${sha512}`,
    `    size: ${groesse}`,
    `path: ${artefaktName}`,
    `sha512: ${sha512}`,
    `releaseDate: '${new Date().toISOString()}'`,
    ``,
  ].join("\n");
}

/** Zeigt eine vorhandene YAML schon auf genau dieses Artefakt? */
function zeigtAuf(zielPfad, artefakt) {
  if (!fs.existsSync(zielPfad)) return false;
  return new RegExp(`^path: ${artefakt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m")
    .test(fs.readFileSync(zielPfad, "utf8"));
}

/**
 * Eine Metadatendatei sicherstellen. Vorhandene bleiben stehen, solange sie
 * auf das erwartete Artefakt zeigen — die von electron-builder erzeugten
 * enthalten zusätzlich die Blockmap für differenzielle Updates.
 */
function metadatenSichern(ordner, ziel, artefakt, version) {
  const zielPfad = path.join(ordner, ziel);
  if (zeigtAuf(zielPfad, artefakt)) {
    console.log(`vorhanden: ${ziel} → ${artefakt}`);
    return;
  }
  const artefaktPfad = path.join(ordner, artefakt);
  const groesse = fs.statSync(artefaktPfad).size;
  fs.writeFileSync(zielPfad, yamlBauen(version, artefakt, groesse, sha512Base64(artefaktPfad)), "utf8");
  console.log(`erzeugt: ${ziel} → ${artefakt}`);
}

function main() {
  const plattform = process.argv[2];
  if (!["mac", "win", "linux"].includes(plattform ?? "")) {
    fehler("Aufruf: node scripts/ensure-update-metadata.cjs <mac|win|linux>");
  }

  const ordner = path.resolve(process.cwd(), "release");
  const version = process.env.BUILD_SEMVER || process.env.BUILD_VERSION;
  if (!version) {
    fehler("Update-Metadaten nicht erzeugbar: BUILD_SEMVER/BUILD_VERSION fehlt");
  }

  // Windows: je Architektur ein eigener Update-Kanal.
  const ziele = plattform === "win"
    ? [{ ziel: "latest.yml", arch: "x64" }, { ziel: "latest-arm64.yml", arch: "arm64" }]
    : [{ ziel: plattform === "mac" ? "latest-mac.yml" : "latest-linux.yml" }];

  for (const { ziel, arch } of ziele) {
    // Nicht-Windows: eine bereits vorhandene Datei genügt (ohne Arch-Bezug).
    if (!arch && fs.existsSync(path.join(ordner, ziel))) {
      console.log(`vorhanden: ${ziel}`);
      continue;
    }
    const artefakt = artefaktWaehlen(plattform, ordner, arch);
    if (!artefakt) {
      fehler(`${ziel} nicht erzeugbar: kein passendes Artefakt in release/`);
    }
    metadatenSichern(ordner, ziel, artefakt, version);
  }
}

main();
