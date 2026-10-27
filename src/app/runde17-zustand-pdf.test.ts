/**
 * Runde 17, Block Zustand: Die Sammel-PDF meldet „fertig“ erst, wenn der Download wirklich ausgelöst ist (D4, O1, A4).
 */
import { describe, expect, it, vi } from "vitest";

const ereignisse: string[] = [];
const download = vi.fn(async (name: string) => {
  ereignisse.push(`download-start ${name}`);
  await new Promise((f) => setTimeout(f, 60));
  ereignisse.push(`download-ende ${name}`);
});

vi.mock("pdfmake/build/pdfmake", () => ({
  default: {
    addVirtualFileSystem: () => {},
    addFontContainer: () => {},
    addFonts: () => {},
    createPdf: () => ({ download, getBuffer: async () => new Uint8Array(), getBase64: async () => "" }),
  },
}));

describe("R17-D4 Der Download ist abgewartet", () => {
  it("blankoPdfErzeugen kehrt erst nach dem Ende des Downloads zurück, nicht schon nach dem Anstoß", async () => {
    const { blankoPdfErzeugen } = await import("./pdf");
    const ok = await blankoPdfErzeugen();
    ereignisse.push("zurueck");
    expect(ok).toBe(true);
    expect(ereignisse.map((e) => e.split(" ")[0])).toEqual(["download-start", "download-ende", "zurueck"]);
  });
});
