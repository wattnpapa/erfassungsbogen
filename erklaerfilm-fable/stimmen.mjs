/**
 * Erzeugt je Sprechzeile des Drehbuchs eine MP3 per ElevenLabs (Text-to-Speech)
 * und schreibt build/stimmen.json mit Dauer je Zeile.
 *
 * Cache: ton/stimmen/<id>-<hash>.mp3 – ändert sich Text, Stimme oder Einstellung,
 * entsteht eine neue Datei; unveränderte Zeilen werden nicht neu erzeugt.
 *
 *   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node erklaerfilm-fable/stimmen.mjs [zeilenId …]
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { SPRECHER, alleZeilen } from "./drehbuch.mjs";
import { anfrageBinaer, dauer, existiert, hash, parallel } from "./elevenlabs.mjs";

const HIER = fileURLToPath(new URL(".", import.meta.url));
const TON = HIER + "ton/stimmen/";
const BUILD = HIER + "build/";
const MODELL = "eleven_multilingual_v2";

const nurIds = new Set(process.argv.slice(2));
await mkdir(TON, { recursive: true });
await mkdir(BUILD, { recursive: true });

const zeilen = alleZeilen().filter((z) => nurIds.size === 0 || nurIds.has(z.id));
const index = {};

await parallel(
  zeilen.map((zeile) => async () => {
    const sprecher = SPRECHER[zeile.sprecher];
    if (!sprecher) throw new Error(`Unbekannter Sprecher ${zeile.sprecher} in ${zeile.id}`);
    const text = zeile.tts ?? zeile.text;
    const body = { text, model_id: MODELL, voice_settings: sprecher.settings, language_code: "de" };
    const h = hash({ voiceId: sprecher.voiceId, body });
    const datei = `${TON}${zeile.id}-${h}.mp3`;
    if (!(await existiert(datei))) {
      console.log(`→ ${zeile.id} (${sprecher.name.split(",")[0]}): ${text.slice(0, 60)}…`);
      await anfrageBinaer(`/text-to-speech/${sprecher.voiceId}?output_format=mp3_44100_128`, body, datei);
    }
    index[zeile.id] = { datei: `ton/stimmen/${zeile.id}-${h}.mp3`, dauer: await dauer(datei), sprecher: zeile.sprecher, text: zeile.text, funk: !!zeile.funk };
  }),
  2,
);

// Bestehenden Index ergänzen, falls nur einzelne Zeilen neu erzeugt wurden.
const alt = nurIds.size ? (await import("./elevenlabs.mjs")).jsonLesen(BUILD + "stimmen.json", {}) : {};
const gesamt = { ...(await alt), ...index };
const sortiert = Object.fromEntries(alleZeilen().filter((z) => gesamt[z.id]).map((z) => [z.id, gesamt[z.id]]));
await writeFile(BUILD + "stimmen.json", JSON.stringify(sortiert, null, 2));
const summe = Object.values(sortiert).reduce((s, e) => s + e.dauer, 0);
console.log(`${Object.keys(sortiert).length} Zeilen, Sprechzeit gesamt ${summe.toFixed(1)} s`);
