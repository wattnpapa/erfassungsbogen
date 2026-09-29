/** Stand gegenüber der letzten Übergabe (Audit Runde 2, R2-W2). */
import { describe, expect, it, vi } from "vitest";
vi.mock("./nativ", () => ({ istNativ: () => false, textTeilen: async () => {} }));
const { neuerBogen, neuePerson } = await import("./hilfen");
const { uebergabeFesthalten, uebergabeText } = await import("./uebergabe-stand");

describe("uebergabeText", () => {
  it("meldet unverändert, dann die Stärkeänderung seit der Übergabe", () => {
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Ulm";
    b.personal = [neuePerson(), neuePerson()];
    const stand = uebergabeFesthalten(b, new Date(2026, 8, 28, 11, 23).getTime());
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
});
