/**
 * DREHBUCH.md aus drehbuch.json erzeugen — die lesbare Fassung für Sprecher,
 * Abnahme und Korrekturlesen. Maßgeblich bleibt drehbuch.json.
 *
 *   node erklaerfilm/drehbuch-md.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ORDNER = fileURLToPath(new URL(".", import.meta.url));
const d = JSON.parse(await readFile(ORDNER + "drehbuch.json", "utf8"));
const BILD = {
  titel: "Titelbild",
  rueckspulen: "Übergang: Zurückspulen",
  abspann: "Abspann",
  app: "App-Aufnahme",
  comic: "Comic-Panel",
};

let md = `# Drehbuch: ${d.titel}\n\n`;
md += `Erzeugt aus \`drehbuch.json\` mit \`node erklaerfilm/drehbuch-md.mjs\` — Änderungen bitte dort.\n\n`;
md += `## Rollen\n\n| Rolle | Beschreibung |\n| --- | --- |\n`;
for (const s of Object.values(d.sprecher)) md += `| ${s.name} | ${s.rolle} |\n`;
let teil = "";
for (const sz of d.szenen) {
  if (sz.teil !== teil) {
    teil = sz.teil;
    md += `\n## ${teil}\n`;
  }
  const b = sz.bild;
  md += `\n### Szene ${sz.id} · ${BILD[b.art] ?? b.art}${b.panel ? ` „${b.panel}“` : ""}${b.schild ? ` · ${b.schild}` : ""}\n\n`;
  if (b.ort) md += `*${b.ort}*\n\n`;
  for (const z of sz.zeilen) {
    const name = d.sprecher[z.sprecher]?.name ?? z.sprecher;
    const funk = z.funk || d.sprecher[z.sprecher]?.funk ? " (über Funk)" : "";
    md += `**${name}${funk}:** ${z.text}\n`;
    if (z.sprechtext) md += `<br>*Aussprache:* ${z.sprechtext}\n`;
    if (z.bilder?.length) md += `<br>*Bild:* ${z.bilder.join(" → ")}\n`;
    md += `\n`;
  }
  if (sz.geraeusche?.length) md += `*Geräusche:* ${sz.geraeusche.map((g) => d.geraeusche[g]?.beschreibung ?? g).join("; ")}\n`;
}
await writeFile(ORDNER + "DREHBUCH.md", md);
console.log("DREHBUCH.md geschrieben");
