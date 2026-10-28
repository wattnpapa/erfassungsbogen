/**
 * Telefonfeld mit ehrlicher Rückmeldung (R11-E3): Was beim Tippen entfernt oder abgetrennt wird, steht als Satz
 * unter dem Feld; eine auffällig kurze Nummer bekommt nach dem Verlassen den „stimmt das?"-Hinweis. Das führende
 * „+" bleibt erhalten. Gehört in ein `Feld` (dessen Beschriftung benennt das Eingabefeld).
 */

import { useRef, useState, type ComponentProps } from "react";
import { telefonKurzHinweis, telefonTippen, type TelefonRest } from "../telefon-eingabe";
import { FREMDE_DATEN, ZahlMeldung } from "./bausteine";

export function TelefonFeld(
  props: { wert: string | undefined; setzen: (wert: string) => void } & Omit<
    ComponentProps<"input">,
    "value" | "onChange" | "type" | "inputMode"
  >,
) {
  const { wert, setzen, onBlur, onFocus, ...rest } = props;
  const [hinweis, setHinweis] = useState("");
  const [kurz, setKurz] = useState(false);
  // R19-E12: Beim zeichenweisen Tippen sammeln sich die entfernten Stücke („abc", „x") bis zum nächsten Betreten des Felds.
  const [entfernt, setEntfernt] = useState<string[]>([]);
  const ziffernZahl = useRef(0);
  // Text, der hinter einem getippten Trenner folgt (R12-E1); `undefined` = normale Eingabe.
  const [nachTrenner, setNachTrenner] = useState<TelefonRest>(undefined);
  return (
    <>
      <input
        {...FREMDE_DATEN}
        {...rest}
        type="tel"
        inputMode="tel"
        value={wert ?? ""}
        onChange={(ev) => {
          const r = telefonTippen(wert, ev.target.value, nachTrenner);
          setNachTrenner(r.rest);
          let alle = entfernt;
          if (r.entfernt) {
            // Zeichen ohne Ziffer dazwischen gehören zum selben Stück („a", „b", „c" → „abc"); eine Ziffer trennt.
            const dran = alle.length > 0 && r.wert.length === ziffernZahl.current;
            alle = dran ? [...alle.slice(0, -1), alle[alle.length - 1]! + r.entfernt.join("")] : [...alle, ...r.entfernt];
            ziffernZahl.current = r.wert.length;
            setEntfernt(alle);
          }
          const alleSatz = alle.length > 0 ? `Nur Ziffern übernommen („${alle.join('", „')}" entfernt).` : "";
          setHinweis(r.hinweis === "" || r.hinweis.startsWith("Nur Ziffern übernommen") ? alleSatz || r.hinweis : r.hinweis);
          setKurz(false);
          setzen(r.wert);
        }}
        onFocus={(ev) => {
          setKurz(false);
          setEntfernt([]);
          onFocus?.(ev);
        }}
        onBlur={(ev) => {
          setKurz(true);
          setNachTrenner(undefined);
          onBlur?.(ev);
        }}
      />
      <ZahlMeldung meldung={hinweis || (kurz ? telefonKurzHinweis(wert) : "")} />
    </>
  );
}
