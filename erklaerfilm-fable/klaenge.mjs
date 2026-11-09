/**
 * Soundeffekte und Musikbetten per ElevenLabs (Sound Generation / Music).
 * Ergebnis: ton/sfx/<key>-<hash>.mp3, ton/musik/<key>-<hash>.mp3, build/klaenge.json.
 *
 *   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node erklaerfilm-fable/klaenge.mjs [key …]
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { MUSIK, SFX } from "./drehbuch.mjs";
import { anfrageBinaer, dauer, existiert, hash, jsonLesen, parallel } from "./elevenlabs.mjs";

const HIER = fileURLToPath(new URL(".", import.meta.url));
const BUILD = HIER + "build/";
const nur = new Set(process.argv.slice(2));
await mkdir(HIER + "ton/sfx", { recursive: true });
await mkdir(HIER + "ton/musik", { recursive: true });
await mkdir(BUILD, { recursive: true });

const index = await jsonLesen(BUILD + "klaenge.json", { sfx: {}, musik: {} });

const aufgaben = [];
for (const [key, def] of Object.entries(SFX)) {
  if (nur.size && !nur.has(key)) continue;
  aufgaben.push(async () => {
    const body = { text: def.prompt, duration_seconds: Math.min(22, Math.max(0.5, def.dauer)), prompt_influence: 0.5, loop: !!def.loop };
    const h = hash(body);
    const rel = `ton/sfx/${key}-${h}.mp3`;
    if (!(await existiert(HIER + rel))) {
      console.log(`→ SFX ${key}`);
      await anfrageBinaer("/sound-generation?output_format=mp3_44100_128", body, HIER + rel);
    }
    index.sfx[key] = { datei: rel, dauer: await dauer(HIER + rel), loop: !!def.loop };
  });
}
for (const [key, def] of Object.entries(MUSIK)) {
  if (nur.size && !nur.has(key)) continue;
  aufgaben.push(async () => {
    const body = { prompt: def.prompt, music_length_ms: def.laengeMs, force_instrumental: true };
    const h = hash(body);
    const rel = `ton/musik/${key}-${h}.mp3`;
    if (!(await existiert(HIER + rel))) {
      console.log(`→ Musik ${key} (${def.laengeMs / 1000} s)`);
      await anfrageBinaer("/music?output_format=mp3_44100_128", body, HIER + rel);
    }
    index.musik[key] = { datei: rel, dauer: await dauer(HIER + rel), pegelDb: def.pegelDb };
  });
}
await parallel(aufgaben, 1);
await writeFile(BUILD + "klaenge.json", JSON.stringify(index, null, 2));
console.log(`${Object.keys(index.sfx).length} Effekte, ${Object.keys(index.musik).length} Musikbetten`);
