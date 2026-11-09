/**
 * Tonmischung: Stimmen, Effekte und Musikbetten auf eine Spur (build/ton.wav).
 *
 * Zeitachse des Films = Comic-Intro (Ton führt) + App (Bild führt, Marken aus
 * build/app-marken.json) + Comic-Abspann (Ton führt). Musik wird unter Sprache
 * per Sidechain abgesenkt (Ducking), Funkzeilen bandbegrenzt.
 *
 *   node erklaerfilm-fable/mischen.mjs
 * Fehlt app-marken.json (App noch nicht aufgenommen), werden die App-Zeilen
 * probeweise hintereinander gelegt – nur für Tests der Mischung.
 */
import { writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { jsonLesen } from "./elevenlabs.mjs";
import { MUSIK } from "./drehbuch.mjs";

const exec = promisify(execFile);
const HIER = fileURLToPath(new URL(".", import.meta.url));
const BUILD = HIER + "build/";

const plan = await jsonLesen(BUILD + "zeitplan.json", null);
const klaenge = await jsonLesen(BUILD + "klaenge.json", null);
if (!plan || !klaenge) throw new Error("Erst zeitplan.mjs und klaenge.mjs laufen lassen.");
let marken = await jsonLesen(BUILD + "app-marken.json", null);
if (!marken) {
  console.warn("⚠ build/app-marken.json fehlt – App-Zeilen werden probeweise hintereinander gelegt.");
  let t = 1.0;
  const zeilen = {};
  for (const s of plan.bloecke.app.szenen) for (const z of s.zeilen) { zeilen[z.id] = t; t += z.dauer + 1.2; }
  marken = { dauer: t + 1.5, zeilen, sfx: [], kapitel: [] };
}

/** Pegel je Effekt-Schlüssel in dB. */
const SFX_PEGEL = {
  regen: -17, "regen-leise": -21, donner: -13, "zelt-plane": -16, "lkw-anfahrt": -11, "funk-klick": -13,
  "papier-nass": -13, taschenrechner: -15, stift: -15, "scan-piep": -9, wusch: -12, stempel: -9,
  klick: -15, tippen: -19, bestaetigt: -13, blaettern: -15,
};

const D1 = plan.bloecke.intro.dauer;
const D2 = marken.dauer;
const D3 = plan.bloecke.abspann.dauer;
const GESAMT = D1 + D2 + D3;
const versatz = { intro: 0, app: D1, abspann: D1 + D2 };

// ---------------------------------------------------------------- Ereignisse sammeln
const stimmen = []; // {datei, at, funk}
const effekte = []; // {key, at, dauer?, ausblenden?}
for (const block of Object.values(plan.bloecke)) {
  for (const szene of block.szenen) {
    for (const z of szene.zeilen) {
      const at = block.visuellGefuehrt ? versatz[block.id] + (marken.zeilen[z.id] ?? NaN) : versatz[block.id] + z.start;
      if (Number.isNaN(at)) { console.warn(`⚠ Keine Marke für ${z.id} – Zeile entfällt in der Mischung.`); continue; }
      stimmen.push({ id: z.id, datei: HIER + z.datei, at, funk: z.funk, dauer: z.dauer, text: z.text, sprecher: z.sprecher });
    }
    if (!block.visuellGefuehrt) for (const c of szene.sfx) effekte.push({ ...c, at: versatz[block.id] + c.at });
  }
}
for (const c of marken.sfx ?? []) effekte.push({ ...c, at: versatz.app + c.at });

// ---------------------------------------------------------------- Filtergraph
const inputs = [];
const filter = [];
const ms = (s) => Math.round(s * 1000);
function input(datei) { inputs.push(datei); return inputs.length - 1; }

// Stimmen
const stimmLabels = [];
for (const s of stimmen) {
  const i = input(s.datei);
  const funk = s.funk ? "highpass=f=350,lowpass=f=3200,acompressor=threshold=-22dB:ratio=5:attack=5:release=80,volume=6dB," : "";
  const l = `v${i}`;
  filter.push(`[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo,loudnorm=I=-19:TP=-2:LRA=9,${funk}adelay=${ms(s.at)}|${ms(s.at)}[${l}]`);
  stimmLabels.push(l);
}
filter.push(`${stimmLabels.map((l) => `[${l}]`).join("")}amix=inputs=${stimmLabels.length}:normalize=0:dropout_transition=0,apad=whole_dur=${GESAMT}[stimmen]`);
filter.push(`[stimmen]asplit=2[stimmen_mix][stimmen_sc]`);

// Effekte
const sfxLabels = [];
for (const c of effekte) {
  const def = klaenge.sfx[c.key];
  if (!def) { console.warn(`⚠ Unbekannter Effekt ${c.key}`); continue; }
  const wiederholungen = c.mehrfach ?? 1;
  for (let k = 0; k < wiederholungen; k++) {
    const i = input(HIER + def.datei);
    const at = c.at + k * 0.55;
    const pegel = SFX_PEGEL[c.key] ?? -14;
    let kette = `[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo`;
    if (c.dauer != null && c.dauer > def.dauer) kette += `,aloop=loop=-1:size=2147483647`;
    if (c.dauer != null) {
      kette += `,atrim=duration=${c.dauer.toFixed(3)},afade=t=in:d=0.6`;
      kette += `,afade=t=out:st=${Math.max(0, c.dauer - (c.ausblenden ? 2.0 : 1.2)).toFixed(3)}:d=${c.ausblenden ? 2.0 : 1.2}`;
    }
    kette += `,volume=${pegel}dB,adelay=${ms(at)}|${ms(at)}[s${i}]`;
    filter.push(kette);
    sfxLabels.push(`s${i}`);
  }
}
filter.push(`${sfxLabels.map((l) => `[${l}]`).join("")}amix=inputs=${sfxLabels.length}:normalize=0:dropout_transition=0,apad=whole_dur=${GESAMT}[sfx]`);

// Musik je Block (mit kleinem Überhang für weiche Übergänge)
const musikBloecke = [
  { key: plan.bloecke.intro.musik, at: 0, dauer: D1 + 1.0, ein: 2.5, aus: 3.0 },
  { key: plan.bloecke.app.musik, at: D1 - 0.5, dauer: D2 + 1.0, ein: 3.0, aus: 3.0 },
  { key: plan.bloecke.abspann.musik, at: D1 + D2 - 0.5, dauer: D3 + 0.5, ein: 2.0, aus: 2.5 },
];
const musikLabels = [];
for (const m of musikBloecke) {
  const def = klaenge.musik[m.key];
  if (!def) throw new Error(`Musik ${m.key} fehlt`);
  const i = input(HIER + def.datei);
  let kette = `[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo`;
  if (m.dauer > def.dauer) kette += `,aloop=loop=-1:size=2147483647`;
  kette += `,atrim=duration=${m.dauer.toFixed(3)},afade=t=in:d=${m.ein},afade=t=out:st=${(m.dauer - m.aus).toFixed(3)}:d=${m.aus}`;
  kette += `,volume=${MUSIK[m.key].pegelDb}dB,adelay=${ms(m.at)}|${ms(m.at)}[m${i}]`;
  filter.push(kette);
  musikLabels.push(`m${i}`);
}
filter.push(`${musikLabels.map((l) => `[${l}]`).join("")}amix=inputs=${musikLabels.length}:normalize=0:dropout_transition=0,apad=whole_dur=${GESAMT}[musik]`);
// Ducking: Musik sinkt unter Sprache
filter.push(`[musik][stimmen_sc]sidechaincompress=threshold=0.02:ratio=3:attack=40:release=900:makeup=1[musik_duck]`);
filter.push(`[stimmen_mix][sfx][musik_duck]amix=inputs=3:normalize=0:dropout_transition=0,alimiter=limit=0.95:level=0,loudnorm=I=-16:TP=-1.5:LRA=11[aus]`);

await writeFile(BUILD + "mischung.filter", filter.join(";\n"));
const args = ["-y", "-hide_banner", "-loglevel", "error", ...inputs.flatMap((d) => ["-i", d]), "-filter_complex_script", BUILD + "mischung.filter", "-map", "[aus]", "-t", GESAMT.toFixed(3), "-ar", "48000", "-ac", "2", BUILD + "ton.wav"];
console.log(`${stimmen.length} Stimmen, ${sfxLabels.length} Effekte, ${musikLabels.length} Musikbetten → ${GESAMT.toFixed(1)} s`);
await exec("ffmpeg", args, { maxBuffer: 1 << 26 });
await writeFile(BUILD + "mischung.json", JSON.stringify({ dauer: GESAMT, bloecke: { intro: D1, app: D2, abspann: D3 }, stimmen: stimmen.map(({ datei, ...r }) => r), effekte }, null, 2));
console.log("build/ton.wav geschrieben");
