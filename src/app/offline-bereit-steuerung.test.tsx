/**
 * Zweite Stufe des Offline-Vorrats, wenn der Service Worker die Seite erst nach
 * „ready" übernimmt.
 *
 * Beide Ereignisse kommen in derselben Millisekunde; in neuen Chrome-Versionen
 * steht „ready" oft vorn. Die Startseite lud die Beispielbögen und Themenseiten
 * dann nie nach, und ohne Netz stand „fehlen noch (0 von 474)" da — das
 * E2E-Szenario „Ohne Netz startet die App weiter" scheiterte daran.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

vi.mock("./nativ", () => ({ istNativ: () => false }));

const { zusatzNachladen } = vi.hoisted(() => ({
  zusatzNachladen: vi.fn(async () => ({ fertig: 2, gesamt: 2 })),
}));
vi.mock("./offline-vorrat", () => ({
  umfangLaden: async () => ({ kern: [], zusatz: [{ url: "a.html", size: 1 }, { url: "b.html", size: 1 }] }),
  kernFortschritt: async () => null,
  zusatzNachladen,
  mb: (n: number) => String(n),
}));

const { useOfflineStand } = await import("./offline-bereit");

function Messpunkt() {
  const s = useOfflineStand();
  return <p data-testid="stand">{s.stand}</p>;
}

/** Service-Worker-Container, dessen Steuerung sich von Hand setzen lässt. */
function falscherContainer() {
  const ziel = new EventTarget();
  const container = Object.assign(ziel, {
    controller: null as object | null,
    ready: Promise.resolve({}),
  });
  Object.defineProperty(navigator, "serviceWorker", { value: container, configurable: true });
  return container;
}

describe("useOfflineStand: Steuerung kommt nach „ready“", () => {
  beforeEach(() => zusatzNachladen.mockClear());
  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(navigator, "serviceWorker");
  });

  it("lädt die zweite Stufe erst, wenn der Service Worker die Seite steuert, und dann von selbst", async () => {
    const sw = falscherContainer();
    render(<Messpunkt />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    // „ready" ist da, die Seite wird aber noch nicht gesteuert: nichts zu laden.
    expect(zusatzNachladen).not.toHaveBeenCalled();

    await act(async () => {
      sw.controller = {};
      sw.dispatchEvent(new Event("controllerchange"));
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(zusatzNachladen).toHaveBeenCalledTimes(1);
  });

  it("lädt sofort, wenn die Seite beim Start schon gesteuert wird", async () => {
    const sw = falscherContainer();
    sw.controller = {};
    render(<Messpunkt />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(zusatzNachladen).toHaveBeenCalledTimes(1);
  });
});
