/**
 * Rückfragen, Eingaben und Hinweise in der Oberfläche der App — der Ersatz für
 * `window.prompt`, `window.confirm` und `window.alert`.
 *
 * Warum überhaupt: In der iOS-App (WKWebView unter Capacitor) beantwortet das
 * System die eingebauten JavaScript-Dialoge nicht — `prompt` liefert dort sofort
 * `null`, der Knopf tut also scheinbar nichts. Genau daran scheiterte „Neuen
 * Einsatz anlegen" auf dem Telefon. Im Browser erscheinen die Systemdialoge
 * zwar, sind aber ein Fremdkörper: keine Erklärung, kein zweites Feld, keine
 * Beschriftung der Knöpfe außer OK/Abbrechen.
 *
 * Der Zugang ist bewusst imperativ (`await frageText(...)`), damit die über die
 * App verteilten Aufrufstellen so schlicht bleiben wie vorher mit
 * `window.prompt`. Gezeichnet wird alles von einer einzigen Schicht, die die App
 * einmal einhängt (`<Dialogschicht />`); eine Warteschlange sorgt dafür, dass
 * zwei gleichzeitig gestellte Fragen nacheinander erscheinen statt sich zu
 * überschreiben.
 */

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

/** Ein Eingabefeld einer Abfrage. `name` ist der Schlüssel im Ergebnis. */
export type Eingabefeld = {
  name: string;
  label: string;
  vorgabe?: string;
  platzhalter?: string;
  /** Leere Eingabe erlaubt. Ohne Angabe ist das Feld Pflicht. */
  optional?: boolean;
  mehrzeilig?: boolean;
  /** Gesetzt = Auswahlliste statt Textfeld (Wert = `wert` des Eintrags). */
  auswahl?: { wert: string; label: string }[];
};

/** Ein benannter Weg in einer Rückfrage — mehr als OK/Abbrechen. */
export type Antwortweg = {
  /** Rückgabewert; darf nicht leer sein, leer bedeutet Abbruch. */
  wert: string;
  label: string;
  /** Erklärt, was dieser Weg bedeutet — steht unter dem Knopf. */
  hinweis?: ReactNode;
  /** Zerstörende Wahl: Knopf in der Alarmfarbe. */
  gefahr?: boolean;
};

type Eingabeabfrage = {
  art: "eingabe";
  titel: string;
  hinweis?: ReactNode;
  felder: Eingabefeld[];
  ok: string;
};

type Wahlabfrage = {
  art: "wahl";
  titel: string;
  text: ReactNode;
  wege: Antwortweg[];
  /** Beschriftung des Abbruchknopfes. */
  abbruch: string;
};

type Hinweisabfrage = {
  art: "hinweis";
  titel: string;
  text?: ReactNode;
  /** Text, den der Nutzer markieren und kopieren können soll. */
  kopiertext?: string;
  ok: string;
};

type Abfrage = (Eingabeabfrage | Wahlabfrage | Hinweisabfrage) & { nr: number };

// ------------------------------------------------------------ Warteschlange

type Wartend = { abfrage: Abfrage; loesen: (wert: never) => void };

let naechsteNr = 1;
const warteschlange: Wartend[] = [];
const zuhoerer = new Set<(a: Abfrage | null) => void>();

function verkuenden(): void {
  const vorn = warteschlange[0]?.abfrage ?? null;
  for (const z of zuhoerer) z(vorn);
}

function stellen<T>(abfrage: Eingabeabfrage | Wahlabfrage | Hinweisabfrage): Promise<T> {
  return new Promise<T>((loesen) => {
    warteschlange.push({ abfrage: { ...abfrage, nr: naechsteNr++ }, loesen: loesen as (w: never) => void });
    verkuenden();
  });
}

/** Antwort der vordersten Abfrage abgeben und die nächste anzeigen. */
function beantworten(wert: unknown): void {
  const vorn = warteschlange.shift();
  verkuenden();
  vorn?.loesen(wert as never);
}

// ------------------------------------------------------------------- Zugang

/**
 * Mehrere Felder in einem Dialog erfragen. Rückgabe: die Werte je `name`
 * (getrimmt) oder `null` bei Abbruch — wie beim alten `window.prompt` ist
 * „abgebrochen" damit von „leer gelassen" unterscheidbar.
 */
export function frageFelder(a: {
  titel: string;
  felder: Eingabefeld[];
  hinweis?: ReactNode;
  ok?: string;
}): Promise<Record<string, string> | null> {
  return stellen({ art: "eingabe", titel: a.titel, hinweis: a.hinweis, felder: a.felder, ok: a.ok ?? "Übernehmen" });
}

/** Ein einzelnes Feld erfragen — der direkte Ersatz für `window.prompt`. */
export async function frageText(a: {
  titel: string;
  label: string;
  vorgabe?: string;
  platzhalter?: string;
  hinweis?: ReactNode;
  ok?: string;
  optional?: boolean;
  mehrzeilig?: boolean;
}): Promise<string | null> {
  const werte = await frageFelder({
    titel: a.titel,
    hinweis: a.hinweis,
    ok: a.ok,
    felder: [
      {
        name: "wert",
        label: a.label,
        vorgabe: a.vorgabe,
        platzhalter: a.platzhalter,
        optional: a.optional,
        mehrzeilig: a.mehrzeilig,
      },
    ],
  });
  return werte ? (werte.wert ?? "") : null;
}

/**
 * Zwischen mehreren benannten Wegen wählen lassen. Rückgabe: `wert` des
 * gewählten Weges oder `null` bei Abbruch. Für Fälle, in denen „OK/Abbrechen"
 * die Frage verfälscht (siehe die Rückfrage bei doppelt gemeldeten Einheiten).
 */
export function frageWahl(a: {
  titel: string;
  text: ReactNode;
  wege: Antwortweg[];
  abbruch?: string;
}): Promise<string | null> {
  return stellen({ art: "wahl", titel: a.titel, text: a.text, wege: a.wege, abbruch: a.abbruch ?? "Abbrechen" });
}

/** Ja/Nein-Rückfrage — der Ersatz für `window.confirm`. */
export async function frageJaNein(a: {
  titel: string;
  text: ReactNode;
  /** Beschriftung der bejahenden Antwort; sagt, was passiert. */
  ok?: string;
  abbruch?: string;
  /** Zerstörende Aktion: Knopf in der Alarmfarbe. */
  gefahr?: boolean;
}): Promise<boolean> {
  const wahl = await frageWahl({
    titel: a.titel,
    text: a.text,
    abbruch: a.abbruch,
    wege: [{ wert: "ja", label: a.ok ?? "Fortfahren", gefahr: a.gefahr }],
  });
  return wahl === "ja";
}

/**
 * Alle wartenden Abfragen als abgebrochen beantworten. Für Tests: nach dem
 * Abräumen des DOM kann sie niemand mehr beantworten, und eine offen gebliebene
 * Frage stünde sonst in der nächsten Bühne vor der erwarteten (siehe
 * src/test/oberflaeche.ts).
 */
export function dialogeZuruecksetzen(): void {
  while (warteschlange.length > 0) beantworten(null);
}

/** Etwas mitteilen (auf Wunsch mit Text zum Kopieren) — Ersatz für `window.alert`. */
export function zeigeHinweis(a: {
  titel: string;
  text?: ReactNode;
  kopiertext?: string;
  ok?: string;
}): Promise<void> {
  return stellen({ art: "hinweis", titel: a.titel, text: a.text, kopiertext: a.kopiertext, ok: a.ok ?? "Alles klar" });
}

// ------------------------------------------------------------------ Anzeige

/**
 * Die eine Stelle, an der Abfragen erscheinen. Die App hängt sie einmal ein
 * (siehe `App`); Tests, die eine einzelne Komponente rendern, brauchen sie
 * ebenfalls, sonst wartet ein `await frageJaNein(...)` ewig.
 */
export function Dialogschicht() {
  const [abfrage, setAbfrage] = useState<Abfrage | null>(null);
  useEffect(() => {
    zuhoerer.add(setAbfrage);
    setAbfrage(warteschlange[0]?.abfrage ?? null); // ggf. schon Wartendes zeigen
    return () => {
      zuhoerer.delete(setAbfrage);
    };
  }, []);
  // `key`: jede Abfrage bekommt ein frisches Fenster samt leerem Eingabestand.
  return abfrage ? <Dialogfenster key={abfrage.nr} abfrage={abfrage} /> : null;
}

function Dialogfenster({ abfrage }: { abfrage: Abfrage }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const erstes = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [werte, setWerte] = useState<Record<string, string>>(() =>
    abfrage.art === "eingabe"
      ? Object.fromEntries(abfrage.felder.map((f) => [f.name, f.vorgabe ?? f.auswahl?.[0]?.wert ?? ""]))
      : {},
  );

  /** Erstes Feld merken — es bekommt den Fokus, sobald das Fenster offen ist. */
  const merkeErstes = (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    erstes.current = el;
  };

  useEffect(() => {
    dialog.current?.showModal();
    // Wie beim alten `window.prompt` steht eine Vorgabe markiert da:
    // weitertippen ersetzt sie, ohne sie erst löschen zu müssen. Vor dem
    // `showModal()` geht das nicht — ein geschlossener Dialog ist unsichtbar
    // und nichts darin fokussierbar.
    erstes.current?.focus();
    erstes.current?.select();
  }, []);

  /** Pflichtfeld noch leer → die bejahende Antwort bleibt gesperrt. */
  const unvollstaendig =
    abfrage.art === "eingabe" &&
    abfrage.felder.some((f) => !f.optional && !(werte[f.name] ?? "").trim());

  /**
   * Abschicken schließt das Fenster mit dem Wert des gedrückten Knopfes. Das
   * Formular ist dabei nur das Mittel für die Enter-Taste: sie löst den ersten
   * Submit-Knopf aus — also die bejahende Antwort — und tut nichts, solange der
   * gesperrt ist. Geschlossen wird von Hand, nicht über `method="dialog"`, damit
   * der Weg überall gleich läuft (jsdom kennt die Formular-Absendung nicht).
   */
  function absenden(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const knopf = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    dialog.current?.close(knopf?.value ?? "");
  }

  /**
   * Der eine Ausgang: Knopf, Enter-Taste, „Abbrechen" und Esc laufen alle über
   * `close()` und damit hier vorbei — die Zusage wird genau einmal eingelöst.
   */
  function beiSchluss() {
    const wert = dialog.current?.returnValue ?? "";
    if (abfrage.art === "hinweis") {
      beantworten(undefined);
    } else if (abfrage.art === "wahl") {
      beantworten(wert || null);
    } else {
      beantworten(
        wert === "ok"
          ? Object.fromEntries(Object.entries(werte).map(([k, v]) => [k, v.trim()]))
          : null,
      );
    }
  }

  const abbrechen = (
    <button type="button" onClick={() => dialog.current?.close("")}>
      Abbrechen
    </button>
  );

  return (
    <dialog ref={dialog} className="abfrage" aria-label={abfrage.titel} onClose={beiSchluss}>
      <form onSubmit={absenden}>
        <h2>{abfrage.titel}</h2>

        {abfrage.art === "eingabe" && (
          <>
            {abfrage.hinweis && <p className="hinweis">{abfrage.hinweis}</p>}
            {abfrage.felder.map((f, i) => (
              <label className="feld" key={f.name}>
                {f.label}
                {f.auswahl ? (
                  // `aria-label` obendrauf: Bei einer Auswahlliste im
                  // umschließenden <label> zählen die Optionstexte mit zur
                  // Beschriftung („Art Einsatz Übung Veranstaltung") — die
                  // Vorlesesoftware nennt dann die halbe Liste als Feldnamen.
                  <select
                    aria-label={f.label}
                    value={werte[f.name] ?? ""}
                    onChange={(e) => setWerte({ ...werte, [f.name]: e.target.value })}
                  >
                    {f.auswahl.map((o) => (
                      <option key={o.wert} value={o.wert}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.mehrzeilig ? (
                  <textarea
                    ref={i === 0 ? merkeErstes : undefined}
                    rows={4}
                    value={werte[f.name] ?? ""}
                    placeholder={f.platzhalter}
                    onChange={(e) => setWerte({ ...werte, [f.name]: e.target.value })}
                  />
                ) : (
                  <input
                    ref={i === 0 ? merkeErstes : undefined}
                    type="text"
                    value={werte[f.name] ?? ""}
                    placeholder={f.platzhalter}
                    onChange={(e) => setWerte({ ...werte, [f.name]: e.target.value })}
                  />
                )}
              </label>
            ))}
            <div className="abfrage-aktionen">
              <button type="submit" value="ok" className="primaer" disabled={unvollstaendig}>
                {abfrage.ok}
              </button>
              {abbrechen}
            </div>
          </>
        )}

        {abfrage.art === "wahl" && (
          <>
            <p>{abfrage.text}</p>
            {abfrage.wege.map((w, i) => (
              <div className="abfrage-weg" key={w.wert}>
                <button
                  type="submit"
                  value={w.wert}
                  className={w.gefahr ? "gefahr" : i === 0 ? "primaer" : ""}
                >
                  {w.label}
                </button>
                {w.hinweis && <p className="hinweis">{w.hinweis}</p>}
              </div>
            ))}
            <div className="abfrage-aktionen">
              <button type="button" onClick={() => dialog.current?.close("")}>
                {abfrage.abbruch}
              </button>
            </div>
          </>
        )}

        {abfrage.art === "hinweis" && (
          <>
            {abfrage.text && <p>{abfrage.text}</p>}
            {abfrage.kopiertext && (
              <textarea
                className="kopiertext"
                readOnly
                rows={3}
                value={abfrage.kopiertext}
                ref={merkeErstes}
              />
            )}
            <div className="abfrage-aktionen">
              <button type="submit" value="ok" className="primaer">
                {abfrage.ok}
              </button>
            </div>
          </>
        )}
      </form>
    </dialog>
  );
}
