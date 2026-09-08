/**
 * Der Stempel gehört dem Teil, der GERADE eingegangen ist — nicht jedem
 * gefüllten Kästchen. Vorher hing die Bewegung an der Füllung und lief damit
 * beim Öffnen des Scanners für jeden längst gesammelten Teil erneut: eine
 * Quittung für nichts, genau in dem Moment, in dem der Blick nach dem
 * fehlenden Teil sucht.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { TeilQuittung } from "./teil-quittung";
import type { SegmentTeil } from "@bos/eeb-format/codec";

function stand(anzahl: number, haben: number[]): SegmentTeil[] {
  return haben.map((teilNr) => ({ teilNr, anzahl, id: 7, chunk: new Uint8Array() }));
}

/** Teilnummern der Kästchen, die gerade den Stempel tragen. */
function gestempelt(behaelter: HTMLElement): string[] {
  return [...behaelter.querySelectorAll("li.frisch")].map((li) => li.getAttribute("data-teil") ?? "");
}

describe("TeilQuittung", () => {
  it("stempelt beim ersten Malen nichts — der Stand ist keine Änderung", () => {
    const { container } = render(<TeilQuittung teile={stand(4, [1, 2])} />);
    expect(container.querySelectorAll("li.ein")).toHaveLength(2);
    expect(gestempelt(container)).toEqual([]);
  });

  it("stempelt nur den neu eingegangenen Teil", () => {
    const { container, rerender } = render(<TeilQuittung teile={stand(4, [1])} />);
    rerender(<TeilQuittung teile={stand(4, [1, 3])} />);
    expect(gestempelt(container)).toEqual(["3"]);
  });

  it("stempelt bei unverändertem Stand nicht nach", () => {
    const { container, rerender } = render(<TeilQuittung teile={stand(4, [1, 3])} />);
    rerender(<TeilQuittung teile={stand(4, [3, 1])} />);
    expect(gestempelt(container)).toEqual([]);
  });

  it("stempelt denselben Teil in einer neuen Sammlung erneut", () => {
    const { container, rerender } = render(<TeilQuittung teile={stand(4, [1, 2])} />);
    rerender(<TeilQuittung teile={stand(4, [])} />);
    rerender(<TeilQuittung teile={stand(4, [2])} />);
    expect(gestempelt(container)).toEqual(["2"]);
  });

  it("rendert nichts bei unsegmentiertem Transport", () => {
    const { container } = render(<TeilQuittung teile={stand(1, [1])} />);
    expect(container.querySelector("ol")).toBeNull();
  });
});
