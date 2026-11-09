/**
 * Zeitachse der Comic-Blöcke aus den Tonlängen (build/stimmen.json).
 *
 * Für jeden Comic-Block (intro, abspann) werden Szenen und Zeilen auf eine
 * Zeitachse ab 0 gelegt: pauseDavor → Zeile → pauseDanach, am Szenenende ein
 * kurzer Nachlauf. SFX-Cues werden aufgelöst („nach:<id>“ = Zeilenende,
 * „bei:<id>“ = Zeilenbeginn, Zahl = Sekunden ab Szenenbeginn).
 *
 * Für den App-Block stehen nur die Zeilen mit ihren Dauern drin; die Marken
 * setzt app/aufnahme.mjs beim Aufnehmen (build/app-marken.json).
 *
 * Ergebnis: build/zeitplan.json
 *   node erklaerfilm-fable/zeitplan.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BLOECKE } from "./drehbuch.mjs";

const HIER = fileURLToPath(new URL(".", import.meta.url));
const stimmen = JSON.parse(await readFile(HIER + "build/stimmen.json", "utf8"));

const PAUSE_DAVOR = 0.5;
const PAUSE_DANACH = 0.35;
const SZENEN_NACHLAUF = 0.6;

function runde(x) {
  return Math.round(x * 1000) / 1000;
}

const plan = { fps: 25, bloecke: {} };

for (const block of BLOECKE) {
  const visuellGefuehrt = block.id === "app";
  let t = 0;
  const szenen = [];
  for (const szene of block.szenen) {
    const start = t;
    const zeilen = [];
    for (const zeile of szene.zeilen) {
      const ton = stimmen[zeile.id];
      if (!ton) throw new Error(`Keine Tonspur für ${zeile.id} – erst stimmen.mjs laufen lassen.`);
      if (!visuellGefuehrt) t += zeile.pauseDavor ?? PAUSE_DAVOR;
      zeilen.push({
        id: zeile.id,
        sprecher: zeile.sprecher,
        text: zeile.text,
        funk: !!zeile.funk,
        datei: ton.datei,
        dauer: runde(ton.dauer),
        ...(visuellGefuehrt ? {} : { start: runde(t), ende: runde(t + ton.dauer) }),
      });
      if (!visuellGefuehrt) t += ton.dauer + (zeile.pauseDanach ?? PAUSE_DANACH);
    }
    if (!visuellGefuehrt) t += SZENEN_NACHLAUF;
    const ende = t;
    const beiZeile = (id, feld) => {
      const z = zeilen.find((x) => x.id === id);
      if (!z) throw new Error(`SFX-Cue verweist auf unbekannte Zeile ${id} in Szene ${szene.id}`);
      return z[feld];
    };
    const sfx = (szene.sfx ?? []).map((cue) => {
      let at;
      if (typeof cue.at === "number") at = start + cue.at;
      else if (cue.at.startsWith("nach:")) at = beiZeile(cue.at.slice(5), "ende");
      else if (cue.at.startsWith("bei:")) at = beiZeile(cue.at.slice(4), "start");
      else throw new Error(`Unbekannter Cue ${cue.at}`);
      const dauer = cue.dauer === "szene" ? ende - at : cue.dauer;
      return { key: cue.key, at: runde(at), ...(dauer != null ? { dauer: runde(dauer) } : {}), ...(cue.ausblenden ? { ausblenden: true } : {}), ...(cue.mehrfach ? { mehrfach: cue.mehrfach } : {}) };
    });
    szenen.push({ id: szene.id, bild: szene.bild, caption: szene.caption, ...(visuellGefuehrt ? {} : { start: runde(start), ende: runde(ende) }), zeilen, sfx });
  }
  plan.bloecke[block.id] = { id: block.id, musik: block.musik, visuellGefuehrt, ...(visuellGefuehrt ? {} : { dauer: runde(t) }), szenen };
}

await writeFile(HIER + "build/zeitplan.json", JSON.stringify(plan, null, 2));
for (const b of Object.values(plan.bloecke)) {
  const sprech = b.szenen.flatMap((s) => s.zeilen).reduce((s, z) => s + z.dauer, 0);
  console.log(`${b.id}: ${b.dauer != null ? b.dauer.toFixed(1) + " s Bild, " : ""}${sprech.toFixed(1)} s Sprache, ${b.szenen.length} Szenen`);
}
