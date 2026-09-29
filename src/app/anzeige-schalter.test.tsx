/**
 * Anzeigemodus-Umschalter, klappbare Form im Assistenten-Kopf (Audit Runde 2,
 * R2-H7): Auf dem Telefon steht nur der gewählte Modus als Klappknopf im Kopf,
 * die vier Segmente klappen auf. Ausgeblendet wird per CSS — im Baum müssen
 * immer alle vier Segmente stehen, sonst wäre der Umschalter für Tastatur
 * und Vorlesesoftware auf breiten Fenstern (dort ist der Klappknopf
 * unsichtbar) nicht mehr bedienbar.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnzeigeSchalter } from "./anzeige-schalter";
import { anzeigeModus } from "./anzeige-modus";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
});

describe("AnzeigeSchalter", () => {
  it("ohne klappbar: vier Segmente, kein Klappknopf", () => {
    render(<AnzeigeSchalter />);
    const gruppe = screen.getByRole("group", { name: "Anzeigemodus" });
    expect(gruppe.querySelectorAll("button")).toHaveLength(4);
    expect(gruppe.querySelector(".anzeige-klappe")).toBeNull();
  });

  it("klappbar: Klappknopf nennt den gewählten Modus und steuert aufgeklappt/zu", async () => {
    const u = userEvent.setup();
    render(<AnzeigeSchalter klappbar />);
    const gruppe = screen.getByRole("group", { name: "Anzeigemodus" });
    const klappe = screen.getByRole("button", { name: /^Anzeigemodus Standard/ });
    expect(klappe.getAttribute("aria-expanded")).toBe("false");
    expect(gruppe.classList.contains("offen")).toBe(false);
    // Alle vier Segmente stehen trotzdem im Baum.
    for (const name of ["Standard", "Dunkel", "Feld", "Nacht"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }

    await u.click(klappe);
    expect(klappe.getAttribute("aria-expanded")).toBe("true");
    expect(gruppe.classList.contains("offen")).toBe(true);

    // Eine Wahl setzt den Modus und klappt wieder zu.
    await u.click(screen.getByRole("button", { name: "Nacht" }));
    expect(anzeigeModus()).toBe("nacht");
    expect(gruppe.classList.contains("offen")).toBe(false);
    expect(screen.getByRole("button", { name: /^Anzeigemodus Nacht/ }).getAttribute("aria-expanded")).toBe("false");
  });
});
