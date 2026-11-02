/**
 * Telefonnummern und E-Mail-Adressen als antippbare Verknüpfungen (R12-W1): Wer „Rückfrage" liest, ruft mit einem Tipp
 * an, statt die Nummer abzutippen (mit Handschuhen, nebenbei am Funk). Das Format der Nummer bleibt, wie die Einheit es
 * eingetragen hat; nur der Verweis (`tel:`) enthält die bereinigte Nummer.
 *
 * Die Werte stammen aus fremden Bögen und Signaturen: Der Verweis wird deshalb aus einem engen Zeichensatz gebaut, nie
 * aus dem rohen Text.
 */

import type { ReactNode } from "react";
import type { Absenderkarte } from "@bos/eeb-format/signatur";
import { KontaktArt, type Kontakt } from "@bos/eeb-format/model";

/** `tel:`-Ziel aus einer eingetragenen Nummer („0170 555-1234", „+49 170 …"); `null`, wenn keine Nummer erkennbar ist. */
export function telefonHref(text: string | undefined | null): string | null {
  const t = (text ?? "").trim();
  if (!/^[+\d][\d\s()/.\-+]*$/.test(t)) return null;
  const ziffern = t.replace(/\D/g, "");
  if (ziffern.length < 3 || ziffern.length > 20) return null;
  return `tel:${t.startsWith("+") ? "+" : ""}${ziffern}`;
}

/** `mailto:`-Ziel aus einer Adresse; `null`, wenn sie nicht wie eine Adresse aussieht. */
export function mailHref(text: string | undefined | null): string | null {
  const t = (text ?? "").trim();
  if (!/^[^\s@<>"'?&=,;:]+@[^\s@<>"'?&=,;:]+\.[^\s@<>"'?&=,;:]+$/.test(t))
    return null;
  return `mailto:${encodeURIComponent(t).replace(/%40/g, "@")}`;
}

/** Eine Nummer oder Adresse: als Verweis (44 px Zielhöhe), wenn erkennbar, sonst als Text. */
export function KontaktLink({
  art,
  wert,
  kinder,
}: {
  art: "tel" | "mail";
  wert: string;
  kinder?: ReactNode;
}) {
  const href = art === "tel" ? telefonHref(wert) : mailHref(wert);
  if (!href) return <>{kinder ?? wert}</>;
  return (
    <a className="kontakt-link" href={href}>
      {kinder ?? wert}
    </a>
  );
}

/** „Hans Beispiel · hans@example.org · 0170 5551234" mit antippbarer Adresse und Nummer. */
export function AbsenderKontakt({
  karte,
}: {
  karte: Absenderkarte | undefined;
}) {
  if (!karte) return null;
  const teile: ReactNode[] = [];
  if (karte.name) teile.push(<span key="n">{karte.name}</span>);
  if (karte.email)
    teile.push(<KontaktLink key="e" art="mail" wert={karte.email} />);
  if (karte.telefon)
    teile.push(<KontaktLink key="t" art="tel" wert={karte.telefon} />);
  return (
    <>
      {teile.map((t, i) => (
        <span key={i}>
          {i > 0 && " · "}
          {t}
        </span>
      ))}
    </>
  );
}

/** Erreichbarkeit einer Person wie `kontaktText` („Mobil: 0171… (D)"), Nummer bzw. Adresse antippbar. */
export function PersonKontakt({ kontakt }: { kontakt: Kontakt }) {
  const kz = kontakt.dienstlich ? "D" : "P";
  if (kontakt.emailTemplate != null) return <>{`eMail: — (${kz})`}</>;
  // Ein Funkrufname ist weder wählbar noch privat: nur Text, ohne (D)/(P).
  if (kontakt.art === KontaktArt.FUNK)
    return <>{`Funk: ${kontakt.wert ?? ""}`}</>;
  const bez =
    kontakt.art === KontaktArt.EMAIL
      ? "eMail"
      : kontakt.art === KontaktArt.MOBIL
        ? "Mobil"
        : "Tel";
  const wert = kontakt.wert ?? "";
  return (
    <>
      {bez}:{" "}
      <KontaktLink
        art={kontakt.art === KontaktArt.EMAIL ? "mail" : "tel"}
        wert={wert}
      />{" "}
      ({kz})
    </>
  );
}
