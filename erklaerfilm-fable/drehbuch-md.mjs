/**
 * Schreibt DREHBUCH.md aus drehbuch.mjs (plus Dauern aus build/stimmen.json, falls vorhanden).
 *   node erklaerfilm-fable/drehbuch-md.mjs
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BLOECKE, EINHEIT, MUSIK, SFX, SPRECHER } from "./drehbuch.mjs";
import { jsonLesen } from "./elevenlabs.mjs";

const HIER = fileURLToPath(new URL(".", import.meta.url));
const stimmen = await jsonLesen(HIER + "build/stimmen.json", {});
const marken = await jsonLesen(HIER + "build/app-marken.json", null);
const plan = await jsonLesen(HIER + "build/zeitplan.json", null);

const TITEL = { intro: "Block 1 · Comic: Meldekopf Oldenburg bei Nacht", app: "Block 2 · Die App, Seite für Seite", abspann: "Block 3 · Comic: Abspann" };
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

let md = `# Drehbuch „Meldekopf Oldenburg“

Erklärfilm zum digitalen Einheiten-Erfassungsbogen (erfassungsbogen.app), 1080p, deutsch.
Quelle dieser Datei ist \`drehbuch.mjs\`; dieses Markdown wird daraus erzeugt (\`node erklaerfilm-fable/drehbuch-md.mjs\`).

## Idee

Ein Meldekopf des THW im Sturm: Oldenburg, Bereitstellungsraum an den Weser-Ems-Hallen, nachts, die Hunte steigt.
Einheiten rollen an, jede bringt ihren Erfassungsbogen. Auf Papier heißt das entziffern, nachfragen, rechnen, abtippen.
Dann kommt eine Einheit mit QR-Code, ein Piep, fertig. Der Film kippt vom Comic in die echte App und zeigt Seite für
Seite, wie dieser Bogen entsteht, und wie der Meldekopf ihn einsammelt und zusammenzählt. Zum Schluss zurück in den Comic.

Fiktive Lage, fiktive Personen. Ortsverbände, Einheitstypen, Fahrzeuge und Funkrufnamen folgen dem THW-Vokabular des Projekts
(Fachgruppe Wasserschaden/Pumpen (B) aus Oldenburg: Heros Oldenburg 48/43 und 48/34, Bergungsgruppe Delmenhorst: Heros Delmenhorst 22/51,
Fachgruppe N Cloppenburg: Heros Cloppenburg 24/55, Zugtrupp Westerstede: Heros Westerstede 21/10).

## Stimmen (ElevenLabs, deutsch)

| Rolle | Stimme | Einsatz |
| --- | --- | --- |
`;
for (const [k, s] of Object.entries(SPRECHER)) {
  const n = Object.values(stimmen).filter((x) => x.sprecher === k).length;
  md += `| ${s.name} | ${s.voiceId} | ${n} Zeilen |\n`;
}
md += `
Aussprache: Funkrufnamen werden als Zahlwörter gesprochen („zweiundzwanzig einundfünfzig“), StAN als „Schtan“, PDF als „Pe-De-Eff“,
die Adresse als „erfassungsbogen punkt app“. Funkverkehr (Spalte „Funk“) wird in der Mischung bandbegrenzt wie ein Handfunkgerät.

`;

for (const block of BLOECKE) {
  md += `## ${TITEL[block.id]}\n\nMusikbett: „${block.musik}“ – ${MUSIK[block.musik].prompt}\n\n`;
  for (const szene of block.szenen) {
    const ps = plan?.bloecke?.[block.id]?.szenen.find((s) => s.id === szene.id);
    const zeit = ps?.start != null ? ` (${mmss(ps.start)}–${mmss(ps.ende)})` : "";
    md += `### Szene „${szene.id}“${zeit}\n\n**Bild:** ${szene.bild}\n\n`;
    if (szene.caption) md += `**Caption:** ${szene.caption}\n\n`;
    if (szene.sfx?.length) md += `**Ton:** ${szene.sfx.map((c) => `${c.key} @ ${c.at}${c.dauer ? ` (${c.dauer})` : ""}`).join(", ")}\n\n`;
    md += `| Nr. | Sprecher | Text | Funk | Dauer |\n| --- | --- | --- | --- | --- |\n`;
    for (const z of szene.zeilen) {
      const d = stimmen[z.id]?.dauer;
      const marke = marken?.zeilen?.[z.id];
      md += `| ${z.id} | ${SPRECHER[z.sprecher].name.split(",")[0]} | ${z.text}${z.tts && z.tts !== z.text ? `<br><small>gesprochen: ${z.tts}</small>` : ""} | ${z.funk ? "ja" : ""} | ${d ? d.toFixed(1) + " s" : "–"}${marke != null ? ` ab ${mmss(marke)} (App)` : ""} |\n`;
    }
    md += "\n";
  }
}

md += `## Daten der gezeigten Einheit\n\n`;
md += `- Ort der Einheit: ${EINHEIT.ortVorschlag} (Suche „${EINHEIT.ortSuche}“)\n- Einheitstyp: ${EINHEIT.einheitstypVorschlag} (Suche „${EINHEIT.einheitstypSuche}“)\n- Einsatzort/Auftrag: ${EINHEIT.einsatzOrt}\n- Namen (StAN-Plätze): ${EINHEIT.namen.join(", ")}\n- Kennzeichen: ${EINHEIT.kennzeichen.join(", ")}\n- Sofortbedarf: Verpflegung für 12, ${EINHEIT.dieselLiter} l Diesel\n\n`;

md += `## Soundeffekte\n\n| Schlüssel | Prompt | Dauer |\n| --- | --- | --- |\n`;
for (const [k, s] of Object.entries(SFX)) md += `| ${k} | ${s.prompt} | ${s.dauer} s${s.loop ? " (Schleife)" : ""} |\n`;
md += `\n## Musik\n\n| Schlüssel | Prompt | Länge | Pegel |\n| --- | --- | --- | --- |\n`;
for (const [k, m] of Object.entries(MUSIK)) md += `| ${k} | ${m.prompt} | ${m.laengeMs / 1000} s | ${m.pegelDb} dB |\n`;

await writeFile(HIER + "DREHBUCH.md", md);
console.log("DREHBUCH.md geschrieben");
