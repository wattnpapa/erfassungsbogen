/* Bühne: lädt den Zeitplan, wählt den Block (?block=intro|abspann) und stellt
 * window.seek(t) bereit – der komplette Bildzustand wird je Aufruf neu aufgebaut. */
import { SZENEN } from "./szenen.js";

const params = new URLSearchParams(location.search);
const BLOCK = params.get("block") ?? "intro";
const buehne = document.getElementById("buehne");

const plan = await (await fetch("../build/zeitplan.json")).json();
const block = plan.bloecke[BLOCK];
if (!block) throw new Error(`Block ${BLOCK} nicht im Zeitplan`);
window.block = block;
window.dauer = block.dauer;

const zeilen = Object.fromEntries(block.szenen.flatMap((s) => s.zeilen).map((z) => [z.id, z]));

function szeneBei(t) {
  let akt = block.szenen[0];
  for (const s of block.szenen) if (t >= s.start) akt = s;
  return akt;
}

window.seek = function seek(t) {
  const szene = szeneBei(t);
  const fn = SZENEN[szene.id];
  if (!fn) throw new Error(`Keine Szenenfunktion für ${szene.id}`);
  const ctx = {
    t,
    u: t - szene.start,
    S: szene,
    L: (id) => zeilen[id],
    /** nächste Zeile nach id in dieser Szene (für „alt“-Dimmen) */
    naechste: (id) => {
      const i = szene.zeilen.findIndex((z) => z.id === id);
      return i >= 0 ? szene.zeilen[i + 1] : undefined;
    },
    alle: zeilen,
  };
  buehne.innerHTML = fn(ctx);
  return true;
};

// Schriften sicher geladen, bevor gerendert wird.
await document.fonts.load("40px 'Patrick Hand'");
await document.fonts.load("40px 'Bangers'");
await document.fonts.load("700 40px 'Comic Neue'");
await document.fonts.load("400 40px 'Comic Neue'");
window.bereit = true;
if (params.has("t")) window.seek(Number(params.get("t")));
