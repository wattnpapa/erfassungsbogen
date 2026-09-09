/**
 * Die Eingangs-Quittung ist die einzige Auskunft darüber, WELCHE Zeile zum
 * gerade aufgenommenen Bogen gehört. Geprüft wird deshalb genau das, was diese
 * Auskunft kaputt macht: eine Quittung beim ersten Malen (dann quittiert die
 * ganze Liste), eine zweite Quittung nach Suche oder Sortierung (dann quittiert
 * etwas längst Dagewesenes) und eine ausbleibende Quittung bei der
 * Folgemeldung derselben Einheit (dann ändert sich eine Zeile still).
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { useEingangsquittung } from "./eintrag-bewegung";

function Zeile({ marke, kennung }: { marke: string | null; kennung: string }) {
  const el = useEingangsquittung<HTMLDivElement>(marke);
  return <div ref={el} data-testid={kennung} />;
}

const quittiert = (c: HTMLElement, kennung: string) =>
  c.querySelector(`[data-testid="${kennung}"]`)!.classList.contains("eingegangen");

describe("useEingangsquittung", () => {
  it("lässt eine Zeile still, die nicht gemeint ist", () => {
    const { container } = render(<Zeile marke={null} kennung="a" />);
    expect(quittiert(container, "a")).toBe(false);
  });

  it("quittiert die gemeinte Zeile", () => {
    const { container } = render(<Zeile marke="thw-hameln#1" kennung="a" />);
    expect(quittiert(container, "a")).toBe(true);
  });

  it("quittiert dieselbe Marke kein zweites Mal — auch nicht nach einem Neuaufbau der Liste", () => {
    const erste = render(<Zeile marke="fw-hameln#1" kennung="a" />);
    expect(quittiert(erste.container, "a")).toBe(true);
    erste.unmount();
    // Suche, Filter oder Sortierung hängen die Zeile neu ein — der Eingang ist
    // derselbe, es kam nichts Neues.
    const zweite = render(<Zeile marke="fw-hameln#1" kennung="a" />);
    expect(quittiert(zweite.container, "a")).toBe(false);
  });

  it("quittiert die Folgemeldung derselben Einheit erneut", () => {
    const { container, rerender } = render(<Zeile marke="thw-nienburg#1" kennung="a" />);
    expect(quittiert(container, "a")).toBe(true);
    // Zweiter Eingang, gleicher Schlüssel: nur der Zähler unterscheidet ihn.
    rerender(<Zeile marke="thw-nienburg#2" kennung="a" />);
    expect(quittiert(container, "a")).toBe(true);
  });

  it("holt die quittierte Zeile in den Sichtbereich, ohne zu rollen", () => {
    const gerufen: unknown[] = [];
    const proto = HTMLElement.prototype as unknown as { scrollIntoView?: unknown };
    const vorher = proto.scrollIntoView;
    proto.scrollIntoView = function (opt: unknown) { gerufen.push(opt); };
    try {
      render(<Zeile marke="drk-ol#7" kennung="a" />);
    } finally {
      if (vorher === undefined) delete proto.scrollIntoView;
      else proto.scrollIntoView = vorher;
    }
    expect(gerufen).toEqual([{ block: "nearest", inline: "nearest" }]);
  });
});
