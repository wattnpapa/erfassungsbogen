/**
 * Rendert die Comic-Blöcke Frame für Frame (Playwright → PNG → ffmpeg).
 *
 *   node erklaerfilm-fable/comic/rendern.mjs                 # intro und abspann
 *   node erklaerfilm-fable/comic/rendern.mjs intro           # nur ein Block
 *   node erklaerfilm-fable/comic/rendern.mjs intro --probe 2,15,30   # Probeframes nach build/comic-probe/
 *
 * Ergebnis: build/comic-<block>.mp4 (1920×1080, 25 fps, H.264, ohne Ton),
 * Länge = bloecke.<block>.dauer aus build/zeitplan.json.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const HIER = fileURLToPath(new URL(".", import.meta.url));
const WURZEL = normalize(join(HIER, ".."));
const BUILD = join(WURZEL, "build");
const FPS = 25;

const args = process.argv.slice(2);
const probeIdx = args.indexOf("--probe");
const probeZeiten = probeIdx >= 0 ? args[probeIdx + 1].split(",").map(Number) : null;
const bloecke = args.filter((a, i) => !a.startsWith("--") && (probeIdx < 0 || i !== probeIdx + 1));
const ziele = bloecke.length ? bloecke : ["intro", "abspann"];

const TYPEN = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml" };
const server = createServer((req, res) => {
  const pfad = normalize(join(WURZEL, decodeURIComponent(new URL(req.url, "http://x").pathname)));
  if (!pfad.startsWith(WURZEL)) { res.writeHead(403); return res.end(); }
  try {
    statSync(pfad);
    res.writeHead(200, { "Content-Type": TYPEN[extname(pfad)] ?? "application/octet-stream" });
    createReadStream(pfad).pipe(res);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const PORT = server.address().port;

const plan = JSON.parse(await readFile(join(BUILD, "zeitplan.json"), "utf8"));
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const seite = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
seite.on("pageerror", (e) => console.error("Seitenfehler:", e.message));

for (const block of ziele) {
  const dauer = plan.bloecke[block]?.dauer;
  if (dauer == null) throw new Error(`Block ${block} hat keine Dauer im Zeitplan`);
  await seite.goto(`http://127.0.0.1:${PORT}/comic/index.html?block=${block}`);
  await seite.waitForFunction(() => window.bereit === true, null, { timeout: 30000 });

  if (probeZeiten) {
    await mkdir(join(BUILD, "comic-probe"), { recursive: true });
    for (const t of probeZeiten) {
      await seite.evaluate((tt) => window.seek(tt), t);
      const datei = join(BUILD, "comic-probe", `${block}-${String(t).replace(".", "_")}.png`);
      await seite.screenshot({ path: datei, type: "png" });
      console.log("Probe", datei);
    }
    continue;
  }

  const frames = Math.round(dauer * FPS);
  const ziel = join(BUILD, `comic-${block}.mp4`);
  console.log(`${block}: ${frames} Frames (${dauer.toFixed(2)} s) → ${ziel}`);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-frames:v", String(frames), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FPS), "-movflags", "+faststart", ziel], { stdio: ["pipe", "inherit", "inherit"] });
  const fertig = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg Code ${c}`)))));
  const start = Date.now();
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    await seite.evaluate((tt) => window.seek(tt), t);
    const png = await seite.screenshot({ type: "png" });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 100 === 0) {
      const sek = (Date.now() - start) / 1000;
      process.stdout.write(`\r  Frame ${i}/${frames}  (${(i / Math.max(1, sek)).toFixed(1)} fps, noch ~${((frames - i) / Math.max(0.1, i / Math.max(1, sek))).toFixed(0)} s)   `);
    }
  }
  ff.stdin.end();
  await fertig;
  console.log(`\n  fertig in ${((Date.now() - start) / 1000).toFixed(0)} s`);
}

await browser.close();
server.close();
