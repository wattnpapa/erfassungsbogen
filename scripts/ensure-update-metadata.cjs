// Stellt sicher, dass electron-updater-Metadaten (latest*.yml) in release/
// liegen. electron-builder legt sie bei Datums-Versionen mit Prerelease-Teil
// (z. B. 2026.7.11-18.47) nicht unter diesem Namen an — dann schreiben wir
// sie selbst. Übernommen aus S1-Control (ensure-update-metadata.cjs).
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
function artefaktWaehlen(plattform, ordner) {
  const dateien = fs.readdirSync(ordner);
  if (plattform === "mac") {
    return dateien.find((n) => n.endsWith(".zip") && n.includes("-mac-")) ?? null;
  }
  if (plattform === "win") {
    return dateien.find((n) => n.endsWith(".exe") && n.includes("-win-")) ?? null;
  }
  if (plattform === "linux") {
    return dateien.find((n) => n.endsWith(".deb") && n.includes("-linux-")) ?? null;
  }
  return null;
}

function zielDateiname(plattform) {
  return { mac: "latest-mac.yml", win: "latest.yml", linux: "latest-linux.yml" }[plattform];
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

function main() {
  const plattform = process.argv[2];
  if (!["mac", "win", "linux"].includes(plattform ?? "")) {
    fehler("Aufruf: node scripts/ensure-update-metadata.cjs <mac|win|linux>");
  }

  const ordner = path.resolve(process.cwd(), "release");
  const ziel = zielDateiname(plattform);
  const zielPfad = path.join(ordner, ziel);
  if (fs.existsSync(zielPfad)) {
    console.log(`vorhanden: ${ziel}`);
    return;
  }

  const artefakt = artefaktWaehlen(plattform, ordner);
  if (!artefakt) {
    fehler(`${ziel} nicht erzeugbar: kein passendes Artefakt in release/`);
  }

  const version = process.env.BUILD_SEMVER || process.env.BUILD_VERSION;
  if (!version) {
    fehler(`${ziel} nicht erzeugbar: BUILD_SEMVER/BUILD_VERSION fehlt`);
  }

  const artefaktPfad = path.join(ordner, artefakt);
  const groesse = fs.statSync(artefaktPfad).size;
  fs.writeFileSync(zielPfad, yamlBauen(version, artefakt, groesse, sha512Base64(artefaktPfad)), "utf8");
  console.log(`erzeugt: ${ziel}`);
}

main();
