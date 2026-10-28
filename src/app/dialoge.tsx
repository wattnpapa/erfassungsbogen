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

import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { istSichereGegenhandlung, ortSperren, tippVerworfenZeigen } from "./tipp-schutz";
import { zahlMarkieren } from "./zahl-eingabe";
import { ersteEbeneBetreten, ersteEbeneVerlassen } from "./modal-overlay";

/** Ein Eingabefeld einer Abfrage. `name` ist der Schlüssel im Ergebnis. */
export type Eingabefeld = {
  name: string;
  label: string;
  vorgabe?: string;
  platzhalter?: string;
  /** Leere Eingabe erlaubt. Ohne Angabe ist das Feld Pflicht. */
  optional?: boolean;
  mehrzeilig?: boolean;
  /** Zahlenfeld: Ziffernblock auf dem Telefon (`inputmode`), „Weiter" der Tastatur (R9-G6). */
  zahl?: boolean;
  /** Gesetzt = Auswahlliste statt Textfeld (Wert = `wert` des Eintrags). */
  auswahl?: { wert: string; label: string }[];
  /** Dieses Feld bekommt beim Öffnen den Fokus (sonst das erste) — „Ort eintragen…" landet im Feld „Ort" (R17-S4). */
  fokus?: boolean;
};

/** Index des Felds, das beim Öffnen den Fokus bekommt: das mit `fokus`, sonst das erste. */
export function fokusIndex(felder: Eingabefeld[]): number {
  return Math.max(0, felder.findIndex((f) => f.fokus));
}

/** Ein benannter Weg in einer Rückfrage — mehr als OK/Abbrechen. */
export type Antwortweg = {
  /** Rückgabewert; darf nicht leer sein, leer bedeutet Abbruch. */
  wert: string;
  label: string;
  /** Erklärt, was dieser Weg bedeutet — steht unter dem Knopf. */
  hinweis?: ReactNode;
  /** Ein Satz unter dem Knopf im festen Fuß statt eines Eintrags in der Liste des Rumpfs (R18-S4); ersetzt `hinweis`. */
  kurz?: string;
  /** Zerstörende Wahl: Knopf in der Alarmfarbe. */
  gefahr?: boolean;
};

type Eingabeabfrage = {
  art: "eingabe";
  titel: string;
  hinweis?: ReactNode;
  felder: Eingabefeld[];
  ok: string;
  /** Laufende Zeile unter den Feldern (z. B. eine Summe), aus den aktuellen Werten gerechnet (R12-H2). */
  zeile?: (werte: Record<string, string>) => string;
};

type Wahlabfrage = {
  art: "wahl";
  titel: string;
  text: ReactNode;
  wege: Antwortweg[];
  /** Beschriftung des Abbruchknopfes. */
  abbruch: string;
  /** `abbruch`: Der Fokus liegt beim Öffnen auf „Abbrechen", auch ohne zerstörende Wahl (R7-E4). */
  fokus?: "abbruch";
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
  zeile?: (werte: Record<string, string>) => string;
}): Promise<Record<string, string> | null> {
  return stellen({ art: "eingabe", titel: a.titel, hinweis: a.hinweis, felder: a.felder, ok: a.ok ?? "Übernehmen", zeile: a.zeile });
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
  fokus?: "abbruch";
}): Promise<string | null> {
  return stellen({ art: "wahl", titel: a.titel, text: a.text, wege: a.wege, abbruch: a.abbruch ?? "Abbrechen", fokus: a.fokus });
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
  /** `abbruch`: Der Fokus liegt auf „Abbrechen", der Wahl, die nichts verändert (R7-E4). */
  fokus?: "abbruch";
}): Promise<boolean> {
  const wahl = await frageWahl({
    titel: a.titel,
    text: a.text,
    abbruch: a.abbruch,
    fokus: a.fokus,
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

/**
 * Ein Feld im rollenden Rumpf eines Dialogs so weit ins Bild rollen, dass es nicht unter der festen Knopfzeile
 * liegt (R10-L1). `nearest`: Passt es schon, bleibt alles stehen; die Frage steht nur dann nicht mehr ganz oben,
 * wenn das Feld sonst verdeckt wäre.
 */
function feldInsBild(el: Element | null | undefined): void {
  if (!el) return;
  // Mit Beschriftung, solange beides in den Rumpf passt; sonst das Feld selbst.
  const label = el.closest("label");
  const rumpf = el.closest(".abfrage-rumpf");
  const ziel = label && rumpf && label.getBoundingClientRect().height <= rumpf.clientHeight ? label : el;
  ziel.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}

/** So viele benannte Wege stehen im festen Fuß der Rückfrage; mehr rollen im Rumpf. */
const WEGE_IM_FUSS = 3;

// ------------------------------------------------------------------ Anzeige

/**
 * Prellschutz: So lange nach dem Öffnen nimmt das Fenster keinen Tipp an.
 * Die Rückfrage erscheint in Bildmitte, oft genau unter dem Finger, der den
 * Löschknopf gerade getroffen hat — ein prellender Handschuh oder ein
 * Doppeltipp bestätigte sie dann gleich mit (Audit Runde 2, R2-G1). Tastatur
 * (Enter, Esc) ist nicht betroffen: ein Klick aus der Tastatur trägt
 * `detail === 0`.
 *
 * Das allein reichte nicht: Ein zögernder zweiter Tipp kommt mit Handschuh
 * bis zu einer Sekunde später, und nach 551 ms bestätigte er „Person
 * entfernen", nach 574 ms „Einsatz löschen" (Audit Runde 4, R4-G1). Darum
 * sperrt das Fenster beim Öffnen zusätzlich die Stelle des auslösenden Tipps
 * für `ORTSSPERRE_MS` (1,5 s, tipp-schutz.ts) — derselbe Schutz wie nach
 * „Abrücken". Ein Tipp daneben, etwa auf „Abbrechen", wirkt nach dem
 * Prellschutz sofort.
 */
// Der Prüfstand (features/support/haken.ts) setzt ihn vor dem Laden auf 0.
let prellschutzMs: number = (globalThis as { __EEB_PRELLSCHUTZ_MS?: number }).__EEB_PRELLSCHUTZ_MS ?? 350;

/** Für Tests: Prellschutz setzen (0 = aus). Gibt den alten Wert zurück. */
export function prellschutzSetzen(ms: number): number {
  const alt = prellschutzMs;
  prellschutzMs = ms;
  return alt;
}

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
  const abbruchKnopf = useRef<HTMLButtonElement>(null);
  const rumpf = useRef<HTMLDivElement>(null);
  const geoeffnetUm = useRef(Date.now());
  const eigeneEbene = useRef(false);
  // Mit zerstörender Wahl länger: Ein zögernder Zweittipp kam bis ~0,6 s später (R4-G1); weil die
  // Ortssperre die Knöpfe der Rückfrage nicht mehr erfasst (R8-H5), trägt der Prellschutz das allein.
  // R18: 0,65 s statt 0,8 s (und 0,35 s statt 0,45 s), dafür sichtbar: Die gesperrten Antworten stehen gedämpft da.
  const sperrDauer = prellschutzMs === 0 ? 0 : abfrage.art === "wahl" && abfrage.wege.some((w) => w.gefahr) ? Math.max(prellschutzMs, 650) : prellschutzMs;
  const [wartet, setWartet] = useState(sperrDauer > 0 && abfrage.art !== "hinweis");
  useEffect(() => {
    if (!wartet) return;
    const uhr = setTimeout(() => setWartet(false), sperrDauer);
    return () => clearTimeout(uhr);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim Öffnen
  }, []);

  /** Zeiger-Klicks kurz nach dem Öffnen verschlucken (siehe `prellschutzMs`). */
  function prellschutz(e: MouseEvent<HTMLFormElement>) {
    // „Abbrechen", „Schließen" und „Verstanden" nehmen nichts weg: nie gesperrt (R18-S3, D2, H4, E1).
    if (istSichereGegenhandlung(e.target)) return;
    if (e.detail > 0 && Date.now() - geoeffnetUm.current < sperrDauer) {
      e.preventDefault();
      e.stopPropagation();
      // Der verworfene Tipp sagt es: „Einen Moment …" auf dem Knopf, nicht im Text (R9-S2).
      tippVerworfenZeigen(e.nativeEvent);
    }
  }
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
    geoeffnetUm.current = Date.now();
    // Auf dem ersten Verlaufseintrag verließe Zurück sonst die App (R5-S5).
    eigeneEbene.current = ersteEbeneBetreten() || eigeneEbene.current; // StrictMode ruft den Effekt zweimal auf
    // Die Fingerstelle des Auslösers: Dort liegt jetzt womöglich der
    // bestätigende Knopf (R4-G1).
    // Die Sperre gilt hinter dem Dialog (R8-H5, R8-S4): Tipps auf die Knöpfe der Rückfrage selbst
    // fängt nur der Prellschutz ab, ein bewusster Tipp nach dem Lesen geht durch.
    ortSperren(undefined, undefined, { nurAusserhalbRueckfrage: true });
    // Wie beim alten `window.prompt` steht eine Vorgabe markiert da:
    // weitertippen ersetzt sie, ohne sie erst löschen zu müssen. Vor dem
    // `showModal()` geht das nicht — ein geschlossener Dialog ist unsichtbar
    // und nichts darin fokussierbar.
    // preventScroll: Der Fokus auf einen Knopf am Ende riss den Dialog bis ganz
    // unten; die Überschrift und die Frage lagen dann über der Kante (R7-E4).
    erstes.current?.focus({ preventScroll: true });
    erstes.current?.select();
    // Steht eine zerstörende Antwort im Dialog, liegt der Fokus auf dem Weg,
    // der nichts verändert: Vorher hatte der rote Knopf ihn, und ein Enter
    // oder ein Tipp auf den hervorgehobenen Knopf ersetzte (Audit Runde 4,
    // R4-E2).
    if (abfrage.art === "wahl" && (abfrage.fokus === "abbruch" || abfrage.wege.some((w) => w.gefahr))) {
      abbruchKnopf.current?.focus({ preventScroll: true });
    }
    // Die Frage steht beim Öffnen zuerst im Bild, auch bei großer Schrift.
    rumpf.current?.scrollTo?.(0, 0);
    if (dialog.current) dialog.current.scrollTop = 0;
    // Eingabefeld ins Bild rollen: Bei Zoom 200 % lag das Feld unter der festen Knopfzeile (R10-L1).
    feldInsBild(erstes.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim Öffnen; jede Abfrage hat ein eigenes Fenster
  }, []);

  /** Pflichtfeld noch leer → die bejahende Antwort bleibt gesperrt. */
  const fehlend =
    abfrage.art === "eingabe" ? abfrage.felder.filter((f) => !f.optional && !(werte[f.name] ?? "").trim()) : [];
  const unvollstaendig = fehlend.length > 0;

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
    if (eigeneEbene.current) {
      eigeneEbene.current = false;
      ersteEbeneVerlassen();
    }
    const wert = dialog.current?.returnValue ?? "";
    if (abfrage.art === "hinweis") {
      beantworten(undefined);
    } else if (abfrage.art === "wahl") {
      // Nach einer bestätigten zerstörenden Antwort rückt oft die nächste
      // Karte unter den Finger (Person entfernen: ihr Knopf liegt dort, wo
      // eben die Bestätigung lag). Auch die Stelle der Bestätigung bleibt
      // gesperrt, und jeder dort verworfene Nachtipp verlängert die Sperre
      // (R5-S3).
      if (wert && abfrage.wege.some((w) => w.gefahr)) ortSperren(undefined, undefined, { verlaengern: true });
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
    <button type="button" data-sicher="" onClick={() => dialog.current?.close("")}>
      Abbrechen
    </button>
  );

  // Bis zu drei Wege stehen mit „Abbrechen" im festen Fuß — auch mit Erklärtext: Im Rumpf lagen sie bei
  // Querformat, großer Schrift und im Zoom-Fenster hinter dem Text, im Bild stand nur „Abbrechen"
  // (R9-W1, R9-M2). Die Erklärungen wandern dann als Liste in den Rumpf und hängen per `aria-describedby`
  // an ihrem Knopf. Längere Listen (Einsatz wählen) rollen im Rumpf.
  const idBasis = useId();
  const wegeImFuss = abfrage.art === "wahl" && abfrage.wege.length <= WEGE_IM_FUSS;
  const wegKnopf = (w: Antwortweg, i: number) => (
    <div className="abfrage-weg" key={w.wert}>
      <button
        type="submit"
        value={w.wert}
        className={`${w.gefahr ? "gefahr" : i === 0 ? "primaer" : ""}${wartet ? " wartet" : ""}`.trim()}
        aria-disabled={wartet || undefined}
        aria-describedby={wegeImFuss && (w.hinweis || w.kurz) ? `${idBasis}-w${i}` : undefined}
      >
        {w.label}
      </button>
      {!wegeImFuss && w.hinweis && <p className="hinweis">{w.hinweis}</p>}
      {wegeImFuss && w.kurz && <p className="hinweis weg-kurz" id={`${idBasis}-w${i}`}>{w.kurz}</p>}
    </div>
  );

  return (
    <dialog ref={dialog} className="abfrage" aria-label={abfrage.titel} onClose={beiSchluss}>
      <form onSubmit={absenden} onClickCapture={prellschutz}>
        {/* Zwei Bereiche: Frage und Wege rollen im Rumpf, die Antwortzeile am
            Fuß steht fest. Der Fuß klebte vorher per `sticky` im selben
            Rollbereich und deckte bei großer Schrift die Wahl darüber (R7-W1). */}
        <div className="abfrage-rumpf" ref={rumpf}>
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
                    onFocus={(e) => feldInsBild(e.currentTarget)}
                  >
                    {f.auswahl.map((o) => (
                      <option key={o.wert} value={o.wert}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.mehrzeilig ? (
                  <textarea
                    ref={i === fokusIndex(abfrage.felder) ? merkeErstes : undefined}
                    rows={4}
                    autoCorrect="off"
                    spellCheck={false}
                    value={werte[f.name] ?? ""}
                    placeholder={f.platzhalter}
                    onChange={(e) => setWerte({ ...werte, [f.name]: e.target.value })}
                    onFocus={(e) => feldInsBild(e.currentTarget)}
                  />
                ) : (
                  <input
                    ref={i === fokusIndex(abfrage.felder) ? merkeErstes : undefined}
                    type="text"
                    // Namen, Orte, Rufnamen: keine Autokorrektur, keine Rechtschreibprüfung (R17-H2).
                    autoCorrect="off"
                    spellCheck={false}
                    {...(f.zahl ? { inputMode: "numeric" as const } : {})}
                    enterKeyHint={i < abfrage.felder.length - 1 ? "next" : "done"}
                    value={werte[f.name] ?? ""}
                    placeholder={f.platzhalter}
                    onChange={(e) => setWerte({ ...werte, [f.name]: e.target.value })}
                    onFocus={(e) => {
                      feldInsBild(e.currentTarget);
                      if (f.zahl) zahlMarkieren(e); // alle Zahlenfelder des Dialogs gleich: Antippen markiert (R16-S1)
                    }}
                  />
                )}
              </label>
            ))}
            {abfrage.zeile && (
              <p className="dialog-zeile" role="status" aria-live="polite">
                <strong>{abfrage.zeile(werte)}</strong>
              </p>
            )}
          </>
        )}

        {abfrage.art === "wahl" && (
          <>
            <p>{abfrage.text}</p>
            {wegeImFuss && abfrage.wege.some((w) => w.hinweis && !w.kurz) && (
              <ul className="abfrage-wegehinweise">
                {abfrage.wege.map((w, i) =>
                  w.hinweis && !w.kurz ? (
                    <li key={w.wert} id={`${idBasis}-w${i}`}>
                      <strong>{w.label}:</strong> {w.hinweis}
                    </li>
                  ) : null,
                )}
              </ul>
            )}
            {!wegeImFuss && abfrage.wege.map((w, i) => wegKnopf(w, i))}
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
          </>
        )}
        </div>

        {abfrage.art === "eingabe" && unvollstaendig && (
          <p className="hinweis abfrage-fehlt" role="status">
            {abfrage.ok} geht erst, wenn {fehlend.length === 1 ? "das Feld" : "die Felder"}{" "}
            {fehlend.map((f) => `„${f.label}“`).join(", ")} {fehlend.length === 1 ? "ausgefüllt ist" : "ausgefüllt sind"}
            {fehlend.some((f) => f.zahl) ? " — ist keiner da, eine 0 eintragen." : "."}
          </p>
        )}

        {abfrage.art === "eingabe" && (
          <div className="abfrage-aktionen">
            <button type="submit" value="ok" className={`primaer${wartet ? " wartet" : ""}`} aria-disabled={wartet || undefined} disabled={unvollstaendig}>
              {abfrage.ok}
            </button>
            {abbrechen}
          </div>
        )}

        {abfrage.art === "wahl" && (
          <div className="abfrage-fuss">
            {wegeImFuss && abfrage.wege.map((w, i) => wegKnopf(w, i))}
            {/* Steht eine zerstörende Antwort im Dialog, rückt „Abbrechen"
                sichtbar ab: Beide Knöpfe lagen keine zwei Fingerbreit
                auseinander, und der obere ist der, der nichts zurücknimmt. */}
            <div className={`abfrage-aktionen${abfrage.wege.some((w) => w.gefahr) ? " abgesetzt" : ""}`}>
              <button type="button" ref={abbruchKnopf} data-sicher="" onClick={() => dialog.current?.close("")}>
                {abfrage.abbruch}
              </button>
            </div>
          </div>
        )}

        {abfrage.art === "hinweis" && (
          <div className="abfrage-aktionen">
            <button type="submit" value="ok" className="primaer" data-sicher="">
              {abfrage.ok}
            </button>
          </div>
        )}
      </form>
    </dialog>
  );
}
