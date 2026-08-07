import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Waagerecht rollbarer Bereich um eine breite Tabelle.
 *
 * Auf schmalen Fenstern rollt die Tabelle seitlich (siehe `.tabellen-scroll`
 * in index.html). Ohne Tastaturzugang ist der abgeschnittene Teil für alle
 * unerreichbar, die nicht wischen können: die Spalte „Erreichbarkeit" eines
 * Bogens existiert dann schlicht nicht mehr. Ein rollbarer Bereich braucht
 * deshalb `tabindex`, damit er den Fokus annehmen und mit den Pfeiltasten
 * gerollt werden kann (WCAG 2.1.1).
 *
 * Der Fokus wird aber nur vergeben, solange wirklich etwas verdeckt ist.
 * Fest gesetzt stünde am Breitbild vor jeder Tabelle ein Tabstopp ohne Zweck —
 * und in der Personal-Übersicht liegen davon mehrere hintereinander. Deshalb
 * misst die Komponente die tatsächliche Überbreite und meldet den Bereich nur
 * dann als benannte Region an.
 */
export function TabellenScroll({ titel, children }: { titel: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rollbar, setRollbar] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const messen = () => setRollbar(el.scrollWidth > el.clientWidth + 1);
    messen();
    // Auf Größenänderung des Bereichs UND seines Inhalts hören: eine neue
    // Person in der Tabelle ändert die Breite, ohne dass das Fenster sich rührt.
    if (typeof ResizeObserver === "undefined") return;
    const beobachter = new ResizeObserver(messen);
    beobachter.observe(el);
    if (el.firstElementChild) beobachter.observe(el.firstElementChild);
    return () => beobachter.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="tabellen-scroll"
      // Nur der rollbare Zustand ist eine Region — sonst bliebe eine leere
      // Landmarke in der Vorleseansicht stehen, die nichts abgrenzt.
      {...(rollbar
        ? { tabIndex: 0, role: "region", "aria-label": `${titel} — seitlich rollbar` }
        : {})}
    >
      {children}
    </div>
  );
}
