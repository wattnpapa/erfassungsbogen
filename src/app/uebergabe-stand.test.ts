/** Stand gegenüber der letzten Übergabe (Audit Runde 2, R2-W2). */
import { describe, expect, it, vi } from "vitest";
vi.mock("./nativ", () => ({ istNativ: () => false, textTeilen: async () => {} }));
const { neuerBogen, neuePerson } = await import("./hilfen");
const { uebergabeBestaetigen, uebergabeFesthalten, uebergabeNachWeg, uebergabeText } = await import("./uebergabe-stand");

describe("uebergabeText", () => {
  it("meldet unverändert, dann die Stärkeänderung seit der Übergabe", () => {
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Ulm";
    b.personal = [neuePerson(), neuePerson()];
    const stand = uebergabeFesthalten(b, "qr", false, new Date(2026, 8, 28, 11, 23).getTime());
    expect(uebergabeText(b, stand)?.geaendert).toBe(false);

    const neu = { ...b, personal: [neuePerson()] };
    const t = uebergabeText(neu, stand)!;
    expect(t.geaendert).toBe(true);
    expect(t.text).toMatch(/Stärke 0 \/ 0 \/ 2 \/ 2 → 0 \/ 0 \/ 1 \/ 1/);
    expect(t.text).toMatch(/neu übergeben/);
  });

  it("gilt nicht für einen Bogen einer anderen Einheit", () => {
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Ulm";
    const stand = uebergabeFesthalten(b);
    const anderer = neuerBogen();
    anderer.einheit.hierarchie[0]!.name = "Aalen";
    expect(uebergabeText(anderer, stand)).toBeNull();
    expect(uebergabeText(b, null)).toBeNull();
  });

  it("sagt, was geschah, und „Übergeben“ erst nach Bestätigung (R3-H3, R3-A7)", () => {
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Ulm";
    const um = new Date().setHours(19, 14, 0, 0);
    expect(uebergabeText(b, uebergabeFesthalten(b, "pdf", false, um))?.text).toBe("PDF erzeugt 19:14 Uhr — Empfang nicht bestätigt.");
    expect(uebergabeText(b, uebergabeFesthalten(b, "qr", false, um))?.text).toBe("QR-Code gezeigt 19:14 Uhr — Empfang nicht bestätigt.");
    expect(uebergabeText(b, uebergabeFesthalten(b, "kopiert", false, um))?.offen).toBe(true);
    const bestaetigt = uebergabeBestaetigen(b, uebergabeFesthalten(b, "pdf", false, um))!;
    expect(uebergabeText(b, bestaetigt)).toEqual({ text: "✓ Übergeben 19:14 Uhr (bestätigt) — seitdem unverändert.", geaendert: false, offen: false });
    // Geändert nach einer unbestätigten PDF: kein „Übergabe" im Satz.
    const neu = { ...b, personal: [neuePerson()] };
    const t = uebergabeText(neu, uebergabeFesthalten(b, "pdf", false, um))!;
    expect(t.text).toMatch(/^⚠ Nach „PDF erzeugt 19:14 Uhr“ geändert .* — neu übergeben/);
    // Bestätigen gilt nur für den unveränderten Bogen.
    expect(uebergabeBestaetigen(neu, uebergabeFesthalten(b, "pdf", false, um))).toBeNull();
    // Stände von vor Runde 3 ohne Weg.
    const alt = { um, id: "x", einheit: uebergabeFesthalten(b).einheit, staerke: "0 / 0 / 0 / 0" };
    expect(uebergabeText(b, { ...alt, id: uebergabeFesthalten(b).id })?.text).toBe("Zuletzt weitergegeben 19:14 Uhr — Empfang nicht bestätigt.");
  });

  it("eine PDF nach bestätigter Übergabe lässt den bestätigten Stand stehen", () => {
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Ulm";
    const bestaetigt = uebergabeFesthalten(b, "qr", true, 1000);
    expect(uebergabeNachWeg(b, bestaetigt, "pdf", false, 2000)).toBe(bestaetigt);
    // Geänderter Bogen: der neue Weg gilt.
    const neu = { ...b, personal: [neuePerson()] };
    expect(uebergabeNachWeg(neu, bestaetigt, "pdf", false, 2000)).toMatchObject({ weg: "pdf", um: 2000 });
    expect(uebergabeNachWeg(b, null, "pdf", false, 2000).bestaetigt).toBeUndefined();
  });
});
