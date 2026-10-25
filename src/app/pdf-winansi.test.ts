/**
 * Die PDF-Schrift ist Helvetica mit WinAnsi-Kodierung. Was sie nicht kennt,
 * druckt pdfkit als Fremdzeichen: „Verpflegung 12 ≠ Stärke 8" stand auf dem
 * Lageblatt als „12 ″` Stärke 8" (Audit Runde 5, R5-K2). Der Test setzt alle
 * Texte der Dokumente aus echten Beispielbögen zusammen und prüft jedes
 * Zeichen gegen Windows-1252.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("./nativ", () => ({ istNativ: () => false, textTeilen: async () => {}, binaerTeilen: async () => {} }));

import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import type { QrSatz } from "./hilfen";
import { BLANKO_ZEILEN, leererBogen } from "./blanko";
import {
  winAnsiText,
  einsatzLageblattDokument,
  einsatzPdfDokument,
  pdfDokument,
  type SammelBogen,
  type UebersichtEintrag,
} from "./pdf-dokument";

/** Alle Zeichen, die Windows-1252 (und damit WinAnsi) kennt, dazu Zeilenumbruch und Nullbreiten-Leerzeichen (Umbruchhilfe). */
const WINANSI = (() => {
  const menge = new Set<string>(["\n", "\u200B"]);
  // 0x20–0x7E ASCII und 0xA0–0xFF wie Latin-1; der Bereich dazwischen ist bei Windows-1252 belegt
  // (nicht über TextDecoder, den manche Node-Builds ohne die Tabelle ausliefern).
  for (let b = 0x20; b <= 0x7e; b++) menge.add(String.fromCharCode(b));
  for (let b = 0xa0; b <= 0xff; b++) menge.add(String.fromCharCode(b));
  for (const z of "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ") menge.add(z);
  return menge;
})();

/** Alle Textknoten eines Dokuments (Inhalt, Kopf- und Fußzeile). */
function pdfTexte(dd: TDocumentDefinitions): string[] {
  const aus: string[] = [];
  const geh = (k: unknown): void => {
    if (typeof k === "string") {
      aus.push(k);
    } else if (Array.isArray(k)) {
      k.forEach(geh);
    } else if (k && typeof k === "object") {
      for (const [name, wert] of Object.entries(k as Record<string, unknown>)) {
        // Bilder, Grafiken, Links und Kennungen sind kein gedruckter Text.
        if (["image", "svg", "link", "id", "layout", "color", "fillColor", "widths", "margin", "style"].includes(name)) continue;
        geh(wert);
      }
    }
  };
  geh(dd.content);
  for (const feld of [dd.header, dd.footer]) {
    if (typeof feld === "function") geh(feld(1, 3, { width: 595, height: 842, orientation: "portrait" }));
    else geh(feld);
  }
  return aus;
}

function fremdzeichen(dd: TDocumentDefinitions): string[] {
  const funde = new Set<string>();
  for (const t of pdfTexte(dd)) {
    for (const z of t) if (!WINANSI.has(z)) funde.add(`${z} (U+${z.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}) in „${t.slice(0, 60)}“`);
  }
  return [...funde];
}

const QR: QrSatz = {
  teile: [{ datenUrl: "data:image/png;base64,AAAA", url: "https://x/#1", teilNr: 1, anzahl: 1, version: 13 }],
  segmentiert: false,
  zeichen: 100,
  version: 13,
  vollUrl: "https://x/#V",
  stufen: 1,
  weitergeleitet: false,
};

function beispiele(): Erfassungsbogen[] {
  const wurzel = fileURLToPath(new URL("../../examples/", import.meta.url));
  const dateien = (d: string): string[] =>
    readdirSync(d).flatMap((f) => {
      const p = join(d, f);
      return statSync(p).isDirectory() ? dateien(p) : p.endsWith(".json") ? [p] : [];
    });
  return dateien(wurzel)
    .map((p) => JSON.parse(readFileSync(p, "utf8")) as Erfassungsbogen)
    .filter((b) => b.einheit && Array.isArray(b.personal));
}

describe("PDF-Texte nur in WinAnsi (R5-K2)", () => {
  const boegen = beispiele();

  it("der Test sieht wirklich Fremdzeichen (Gegenprobe)", () => {
    expect(WINANSI.has("≠")).toBe(false);
    expect(WINANSI.has("→")).toBe(false);
    expect(WINANSI.has("ä")).toBe(true);
    expect(WINANSI.has("„")).toBe(true);
    expect(WINANSI.has("…")).toBe(true);
  });

  it("Lageblatt und Sammel-PDF aller Beispielbögen, mit Vorfassung und allen Marken", () => {
    const eintraege: UebersichtEintrag[] = boegen.map((b, i) => {
      // Vorfassung mit weniger Personal, anderem Auftrag und mehr Verpflegung: füllt die Spalte „Veränderung".
      const vorher = structuredClone(b);
      vorher.personal = vorher.personal.slice(1);
      vorher.einsatz = { ...vorher.einsatz, ortAuftrag: "anderer Ort" };
      if (vorher.sofortbedarf) vorher.sofortbedarf = { ...vorher.sofortbedarf, verpflegungPersonen: 99, dieselLiter: 7 };
      return {
        bogen: b,
        ...(i % 2 === 0 ? { vorher } : {}),
        zugEtikett: `${1 + (i % 3)}. Zug`,
        eingetroffenAm: Date.UTC(2026, 9, 5, 8, 0),
        nummer: i + 1,
        abgerueckt: i % 7 === 0,
        zeitUnbestaetigt: i % 5 === 0,
        notiz: "Pumpe 2 defekt – Ersatzpumpe „unterwegs“ …",
        ...(i % 11 === 0 ? { rueckkehr: { abgerueckAm: Date.UTC(2026, 9, 5, 9, 0) } } : {}),
        ...(i % 13 === 0 ? { fremderOrt: "Hochwasser Weser" } : {}),
      };
    });
    const lage = einsatzLageblattDokument("Großlage – Übung „Weser“", eintraege);
    expect(fremdzeichen(lage)).toEqual([]);
    const sammel = einsatzPdfDokument(
      "Großlage",
      eintraege.map((e) => ({ ...e, qr: QR }) as SammelBogen),
      undefined,
      Date.UTC(2026, 9, 5, 12, 0),
      Date.UTC(2026, 9, 5, 10, 0),
    );
    expect(fremdzeichen(sammel)).toEqual([]);
  }, 60_000);

  it("Einzel-PDF aller Beispielbögen und der Blanko-Vordruck", () => {
    const funde = new Set<string>();
    for (const b of boegen) for (const f of fremdzeichen(pdfDokument(b, QR))) funde.add(f);
    expect([...funde]).toEqual([]);
    expect(fremdzeichen(pdfDokument(leererBogen(), null, BLANKO_ZEILEN))).toEqual([]);
  }, 60_000);

  it("winAnsiText ersetzt Fremdzeichen lesbar und lässt Deutsches in Ruhe", () => {
    expect(winAnsiText("Verpflegung 12 ≠ Stärke 8")).toBe("Verpflegung 12 != Stärke 8");
    expect(winAnsiText("Pumpe ≥ 5 l → defekt")).toBe("Pumpe >= 5 l -> defekt");
    expect(winAnsiText("Łódź, Gyöngyös, ć")).toBe("Lódz, Gyöngyös, c");
    expect(winAnsiText("Übung „Weser“ – 5 € · ½ … ß")).toBe("Übung „Weser“ – 5 € · ½ … ß");
    expect(winAnsiText("Lage 🚒 offen")).toBe("Lage ? offen");
  });

  it("das Lageblatt druckt den Verpflegungshinweis ohne „≠“ (R5-K2)", () => {
    const b = structuredClone(beispiele()[0]!);
    b.sofortbedarf = { ...b.sofortbedarf!, verpflegungPersonen: b.personal.length + 4 };
    const lage = pdfTexte(einsatzLageblattDokument("Lage", [{ bogen: b }])).join("\n").replace(/\u200B/g, "");
    expect(lage).toMatch(/Verpflegung \d+ statt Stärke \d+/);
    expect(lage).not.toContain("≠");
  });

  it("die Kurzformen der Prüfpunkte kennen keine Fremdzeichen", async () => {
    const { lueckeKurz } = await import("./einheiten-tabelle");
    const proben = [
      "Verpflegung für 12 Personen angefordert, die Gesamtstärke ist aber 8.",
      "Aufteilung nach Geschlecht: 3 weicht von der Gesamtstärke ab",
      "Stärke: 5 + 1 + 2 ergibt nicht die Gesamtstärke 9.",
    ];
    for (const p of proben) for (const z of lueckeKurz(p)) expect(WINANSI.has(z), `${z} in ${lueckeKurz(p)}`).toBe(true);
  });
});
