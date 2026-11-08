/**
 * Erklärfilm als MP4 rendern.
 *
 *   node erklaerfilm/rendern.mjs                  ganzer Film → erklaerfilm/ausgabe/erklaerfilm.mp4
 *   node erklaerfilm/rendern.mjs --standbilder    ein Bild je Szene → ausgabe/standbilder/
 *   node erklaerfilm/rendern.mjs --von 60 --bis 90   nur ein Ausschnitt
 *   node erklaerfilm/rendern.mjs --ohne-untertitel
 *
 * Bild: film.html wird im Browser Bild für Bild auf die Zeit gesetzt
 * (window.film.zeige) und abfotografiert, die Bilder gehen per Pipe an ffmpeg.
 * Ton: alle Sprachzeilen aus audio/ an ihre Startzeit gelegt; Funkzeilen
 * bekommen einen Bandpass. Geräusche (audio/geraeusch-*.mp3) und eine
 * optionale Musik (audio/musik.mp3) liegen leise darunter.
 *
 * Braucht ffmpeg im PATH. CHROMIUM_PFAD setzt einen anderen Browser.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = fileURLToPath(new URL("..", import.meta.url));
const ORDNER = fileURLToPath(new URL(".", import.meta.url));
const AUSGABE = join(ORDNER, "ausgabe");
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const wert = (n, ersatz) => {
  const i = args.indexOf(n);
  return i >= 0 ? Number(args[i + 1]) : ersatz;
};

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".mp3": "audio/mpeg", ".pdf": "application/pdf",
};

/** Kleiner statischer Server über dem Repo (film.html lädt ../public/…). */
function server() {
  return new Promise((fertig) => {
    const s = createServer(async (req, res) => {
      const pfad = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
      const datei = join(WURZEL, pfad);
      if (!datei.startsWith(WURZEL) || !existsSync(datei) || !(await stat(datei)).isFile()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "content-type": MIME[extname(datei)] ?? "application/octet-stream", "cache-control": "no-store" });
      createReadStream(datei).pipe(res);
    });
    s.listen(0, "127.0.0.1", () => fertig(s));
  });
}

function ausfuehren(befehl, argumente, eingabe) {
  return new Promise((fertig, fehler) => {
    const p = spawn(befehl, argumente, { stdio: [eingabe ? "pipe" : "ignore", "ignore", "pipe"] });
    let log = "";
    p.stderr.on("data", (d) => (log = (log + d).slice(-4000)));
    p.on("exit", (c) => (c === 0 ? fertig() : fehler(new Error(`${befehl} ${c}\n${log}`))));
    if (eingabe) eingabe(p.stdin);
  });
}

const srtZeit = (s) => {
  const ms = Math.max(0, Math.round(s * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor(ms / 60000) % 60).padStart(2, "0");
  const sec = String(Math.floor(ms / 1000) % 60).padStart(2, "0");
  return `${h}:${m}:${sec},${String(ms % 1000).padStart(3, "0")}`;
};

const s = await server();
const basis = `http://127.0.0.1:${s.address().port}/erklaerfilm/film.html?render=1${flag("--ohne-untertitel") ? "&untertitel=0" : ""}`;
const browser = await chromium.launch(process.env.CHROMIUM_PFAD ? { executablePath: process.env.CHROMIUM_PFAD } : {});
try {
  const seite = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  seite.on("console", (m) => m.type() === "warning" && console.warn("film:", m.text()));
  seite.on("pageerror", (f) => console.error("film:", f.message));
  await seite.goto(basis);
  await seite.waitForFunction(() => window.film?.bereit, null, { timeout: 60_000 });
  const plan = await seite.evaluate(() => window.film.plan());
  const dauer = await seite.evaluate(() => window.film.dauer);
  const fps = wert("--fps", await seite.evaluate(() => window.film.fps));
  await mkdir(AUSGABE, { recursive: true });
  console.log(`Film: ${dauer.toFixed(1)} s, ${plan.length} Szenen`);

  if (flag("--standbilder")) {
    const ziel = join(AUSGABE, "standbilder");
    await mkdir(ziel, { recursive: true });
    for (const sz of plan) {
      // Ein Bild mitten in jede Zeile (Blasen sichtbar), sonst Szenenmitte.
      const zeiten = sz.zeilen.length ? sz.zeilen.map((z) => (z.start + z.ende) / 2) : [(sz.start + sz.ende) / 2];
      for (const [i, t] of zeiten.entries()) {
        await seite.evaluate((t) => window.film.zeige(t), t);
        await seite.screenshot({ path: join(ziel, `${sz.id}-${i + 1}.png`) });
      }
      console.log(sz.id);
    }
  } else {
    const von = wert("--von", 0);
    const bis = Math.min(wert("--bis", dauer), dauer);
    const bilder = Math.round((bis - von) * fps);
    const stumm = join(AUSGABE, "bild.mp4");
    const start = Date.now();
    await ausfuehren(
      "ffmpeg",
      ["-y", "-f", "image2pipe", "-framerate", String(fps), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", stumm],
      async (stdin) => {
        for (let n = 0; n < bilder; n++) {
          await seite.evaluate((t) => window.film.zeige(t), von + n / fps);
          const jpg = await seite.screenshot({ type: "jpeg", quality: 92 });
          if (!stdin.write(jpg)) await new Promise((r) => stdin.once("drain", r));
          if (n % (fps * 5) === 0) process.stdout.write(`\r${(n / fps).toFixed(0)} / ${(bis - von).toFixed(0)} s`);
        }
        stdin.end();
      },
    );
    console.log(`\rBild fertig in ${((Date.now() - start) / 1000).toFixed(0)} s`);

    // ── Ton mischen ─────────────────────────────────────────────────────
    const eingaben = [];
    const filter = [];
    const spuren = [];
    const audio = (n) => join(ORDNER, "audio", n);
    const drehbuch = JSON.parse(await readFile(join(ORDNER, "drehbuch.json"), "utf8"));
    for (const sz of plan) {
      for (const z of sz.zeilen) {
        if (!z.echt || z.ende < von || z.start > bis) continue;
        const i = eingaben.push(["-i", audio(`${z.id}.mp3`)]); // Eingang 0 ist das Bild
        const ms = Math.max(0, Math.round((z.start - von) * 1000));
        const funk = z.funk ? ",highpass=f=350,lowpass=f=3200,acompressor=threshold=-18dB:ratio=6,volume=1.4" : "";
        filter.push(`[${i}:a]aresample=44100,aformat=channel_layouts=stereo${funk},adelay=${ms}|${ms}[s${i}]`);
        spuren.push(`[s${i}]`);
      }
      // Geräusche: Schleifen über die ganze Szene, Einzelgeräusche kurz nach Szenenbeginn.
      for (const name of sz.geraeusche) {
        const datei = audio(`geraeusch-${name}.mp3`);
        const def = drehbuch.geraeusche?.[name];
        if (!existsSync(datei) || !def || sz.ende < von || sz.start > bis) continue;
        const i = eingaben.push(def.schleife ? ["-stream_loop", "-1", "-i", datei] : ["-i", datei]); // Eingang 0 ist das Bild
        const beginn = Math.max(sz.start, von);
        const laenge = sz.ende - beginn;
        const ms = Math.round((beginn - von + (def.schleife ? 0 : 0.4)) * 1000);
        const blende = Math.min(0.6, laenge / 3).toFixed(2);
        filter.push(
          `[${i}:a]aresample=44100,aformat=channel_layouts=stereo,atrim=0:${laenge.toFixed(2)},afade=t=in:d=${blende},afade=t=out:st=${(laenge - Number(blende)).toFixed(2)}:d=${blende},volume=${def.lautstaerke ?? 0.3},adelay=${ms}|${ms}[g${i}]`,
        );
        spuren.push(`[g${i}]`);
      }
    }
    const musik = audio("musik.mp3");
    if (existsSync(musik)) {
      const i = eingaben.push(["-stream_loop", "-1", "-i", musik]); // Eingang 0 ist das Bild
      filter.push(`[${i}:a]aresample=44100,aformat=channel_layouts=stereo,atrim=0:${(bis - von).toFixed(2)},volume=0.12,afade=t=out:st=${(bis - von - 3).toFixed(2)}:d=3[m${i}]`);
      spuren.push(`[m${i}]`);
    }
    const ziel = join(AUSGABE, flag("--von") || flag("--bis") ? `erklaerfilm-${von}-${bis}.mp4` : "erklaerfilm.mp4");
    if (spuren.length) {
      filter.push(`${spuren.join("")}amix=inputs=${spuren.length}:normalize=0:duration=longest,alimiter=limit=0.95,apad[ton]`);
      await ausfuehren("ffmpeg", [
        "-y", "-i", stumm, ...eingaben.flat(), "-filter_complex", filter.join(";"),
        "-map", "0:v", "-map", "[ton]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", ziel,
      ]);
    } else {
      console.log("Keine Sprachaufnahmen gefunden — Film ohne Ton (npm run erklaerfilm:stimmen).");
      await ausfuehren("ffmpeg", ["-y", "-i", stumm, "-c", "copy", ziel]);
    }

    // Untertitel zum Hochladen (YouTube, Vimeo, Intranet).
    let n = 0;
    const srt = plan
      .flatMap((sz) => sz.zeilen)
      .filter((z) => z.ende > von && z.start < bis)
      .map((z) => `${++n}\n${srtZeit(z.start - von)} --> ${srtZeit(z.ende - von)}\n${z.text}\n`)
      .join("\n");
    await writeFile(ziel.replace(/\.mp4$/, ".srt"), srt);
    console.log(`Fertig: ${ziel}`);
  }
} finally {
  await browser.close();
  s.close();
}
