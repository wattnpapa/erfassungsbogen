---
name: Erfassungsbogen
description: Digitaler Einheiten-Erfassungsbogen für BOS — amtlich, aber wach.
colors:
  akzent: "#12275e"
  akzent-hell: "#1d3d8f"
  auf-akzent: "#ffffff"
  grund: "#f3f5f9"
  flaeche: "#ffffff"
  flaeche-2: "#e8ebf2"
  text: "#11141b"
  text-2: "#5c6478"
  text-3: "#8b94a9"
  linie-fein: "#d7dce7"
  linie: "#bcc3d3"
  linie-stark: "#8b94a9"
  gut: "#146b3a"
  gut-fond: "#e8f4ed"
  gut-linie: "#a9d3bc"
  warn-text: "#6d4700"
  warn-fond: "#fdf4dd"
  warn-linie: "#ddbe79"
  alarm: "#a4231c"
  alarm-fond: "#fdecea"
  alarm-linie: "#eaa79d"
typography:
  display:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.5
  daten:
    fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
rounded:
  none: "0px"
spacing:
  r-1: "0.25rem"
  r-2: "0.5rem"
  r-3: "0.75rem"
  r-4: "1rem"
  r-5: "1.5rem"
  r-6: "2rem"
components:
  button-default:
    backgroundColor: "{colors.flaeche}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "0.5rem 0.9rem"
    height: "2.25rem"
  button-default-hover:
    backgroundColor: "{colors.flaeche}"
    textColor: "{colors.akzent}"
  button-primaer:
    backgroundColor: "{colors.akzent}"
    textColor: "{colors.auf-akzent}"
    rounded: "{rounded.none}"
    padding: "0.5rem 0.9rem"
    height: "2.25rem"
  button-primaer-hover:
    backgroundColor: "{colors.akzent-hell}"
    textColor: "{colors.auf-akzent}"
  input:
    backgroundColor: "{colors.flaeche}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "0.45rem 0.55rem"
    height: "2.25rem"
  karte:
    backgroundColor: "{colors.flaeche}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "{spacing.r-4}"
---

# Design System: Erfassungsbogen

## Overview

**Creative North Star: „Amtlich, aber wach"**

Die Oberfläche ist ein Behördenformular, das digital wurde — und dabei wach geblieben ist. Kantig, verbindlich, papiernah: alles steht wie gedruckt, nichts schwebt, nichts glänzt. Zugleich ist jedes Detail auf den Einsatz draußen gerechnet: große Tippziele, harte Linien statt zarter Grautöne, drei ausdrücklich wählbare Anzeigemodi (Dunkel für den Dienstabend, Feld für pralle Sonne und Handschuhe, Nacht für die Dunkeladaption im Zelt). Die Stimmung: nüchtern, verbindlich, robust, unaufgeregt.

Technisch trägt das System eine einzige Token-Quelle (Inline-`<style>` in `index.html`): Rollen-Token (`--grund`, `--flaeche`, `--text`, `--linie`, `--akzent` …) statt Rohwerten in Komponenten. Die Anzeigemodi (`.feld-modus`, `.dunkel-modus`, `.nacht-modus`) und die Plattform-Layer (`.platform-ios`, `.platform-android` mit eigenen `--ios-*`/`--md-*`-Paletten) belegen dieselben Token neu, statt Komponenten zu überschreiben. Die Kennfarbe der Organisation (`org-farben.ts`) wird als `--org-akzent*` auf `<html>` gesetzt und färbt Kopfbalken und Primäraktionen; ohne offenen Bogen greift das THW-Blau.

Bewusste Abgrenzung (bestätigt): keine Consumer-App-Ästhetik — keine schwebenden Kacheln, keine Verläufe, keine runden Ecken, keine verspielten Illustrationen.

**Key Characteristics:**
- Rechteckig und kantenbetont — Behördenformular, nicht App-Kachel (Radius überall 0)
- Rahmen und Weißraum tragen die Struktur, nicht Schatten
- Rollen-Token als einzige Quelle; Modi und Plattformen belegen sie nur neu
- Überschriften tragen Gewicht statt Farbe; die Kennfarbe bleibt selten und dadurch signalstark
- Für draußen gebaut: Feld-Modus mit 112 % Schrift, 2-px-Linien und 48-px-Tippzielen

## Colors

Eine kühle, leicht ins Blaue gekippte Neutralpalette unter einer einzigen, organisationsabhängigen Kennfarbe — plus organisationsunabhängige Signalfarben.

### Primary
- **Ultramarin-Dienstblau** (#12275e): Standard-Kennfarbe (THW-nah), Standardwert von `--akzent: var(--org-akzent, #12275e)`. Trägt Kopfbalken, primäre Knöpfe, Fokusringe und den aktiven Schritt. Je Organisation ersetzt `org-farben.ts` sie zur Laufzeit (Feuerrot #c8102e, DRK-Rot #e30613, Oliv #4b5320 …).
- **Dienstblau, aufgehellt** (#1d3d8f): Hover und Links (`--akzent-hell`).
- **Weiß auf Kennfarbe** (#ffffff): Schrift auf der Kennfarbe (`--auf-akzent`); alle Org-Töne sind bewusst dunkel gehalten, damit Weiß darauf trägt.

### Neutral
- **Blaukühles Papierweiß** (#f3f5f9): Seitengrund (`--grund`, Stufe n-50).
- **Formularweiß** (#ffffff): Karten, Eingaben, Knöpfe (`--flaeche`).
- **Zweite Fläche** (#e8ebf2): abgesetzte Bereiche, Hover in Listen (`--flaeche-2`).
- **Tintenschwarz** (#11141b): Fließtext und Überschriften (`--text`).
- **Aktenschrift-Grau** (#5c6478): Zweittext, Beschriftungen (`--text-2`).
- **Hinweis-Grau** (#8b94a9): Dritttext, Platzhalter (`--text-3`) — dient zugleich als starke Linie (`--linie-stark`) an Eingaben und Knöpfen.
- **Linienwerte** (#d7dce7 fein / #bcc3d3 normal): Kartenrahmen, Trenner.

### Tertiary
Signalfarben — bewusst getrennt von der Kennfarbe, damit „erledigt" und „Achtung" in jeder Organisation gleich aussehen. Jedes Signal trägt dieselbe Dreier-Rolle (Text, Fond, Linie), damit ein Zustand überall als derselbe Kasten erscheinen kann:
- **Einsatzgrün** (#146b3a auf #e8f4ed, Linie #a9d3bc): erledigt, gültig, Offline-Zusage, „bereit zur Weitergabe" (`--gut`, `--gut-fond`, `--gut-linie`).
- **Warnbraun auf Aktengelb** (#6d4700 auf #fdf4dd, Linie #ddbe79): Warnhinweise (`--warn-*`).
- **Alarmrot** (#a4231c auf #fdecea, Linie #eaa79d): Fehler, Alarme, gebrochene Signaturen (`--alarm`, `--alarm-fond`, `--alarm-linie`).

### Named Rules
**Die Kennfarben-Regel.** Die Kennfarbe gehört dem Kopfbalken und der primären Aktion. Überschriften tragen Gewicht statt Farbe — so verliert die Kennfarbe nie ihre Signalwirkung.

**Die Signal-Regel.** `--gut(-*)`, `--warn-*` und `--alarm(-*)` sind organisationsunabhängig konstant. Eine DRK-rote Oberfläche darf „Fehler" nie mit der Hausfarbe verwechselbar machen.

**Die Modus-Regel.** Neue Farben werden nie als Rohwert in eine Komponente geschrieben, sondern als Rollen-Token angelegt und in allen vier Belegungen (Hell, Dunkel, Feld, Nacht) definiert — sonst entsteht das „halb angewandte Dunkel", das die Modi ausdrücklich verhindern.

## Typography

**Display/Body Font:** Archivo Variable (DIN-Linie; Fallback system-ui) — im Bundle, offline, nie vom CDN.
**Daten-Font:** ui-monospace-Stapel (SF Mono, Menlo, Consolas) für dicktengleiche Daten wie Stärkeangaben.

**Character:** Eine technische Grotesk in DIN-Tradition — liest sich wie ein sauber gesetztes amtliches Formular, nicht wie eine Marketing-Seite. Hierarchie entsteht über Gewicht (700 vs. 400) und Größe, nie über Farbe.

### Hierarchy
- **Display** (700, 1.625rem/`--t-2xl`, lh 1.15, ls −0.02em): `h1`, eine je Ansicht; `text-wrap: balance`.
- **Headline** (700, 1.3125rem/`--t-xl`, lh 1.2, ls −0.015em): `h2`-Abschnittsüberschriften, ohne Linie, ohne Farbe.
- **Title** (700, 0.9375rem/`--t-m`): `h3`-Gruppentitel innerhalb von Karten.
- **Body** (400, 0.9375rem/`--t-m`, lh 1.5): Fließtext; Einleitungen max. 48ch.
- **Label** (600, 0.75rem/`--t-xs`, Farbe `--text-2`): Feldbeschriftungen (`label.feld`) — halbfett und dunkel statt hellgrau, damit der Feldname draußen so sicher lesbar ist wie sein Inhalt.
- **Daten** (Mono, 0.9375rem): Stärken, Kennzeichen, alles Tabellarische.

### Named Rules
**Die Gewichts-Regel.** Hierarchie trägt Gewicht, nicht Farbe. Farbige Überschriften sind verboten; die Kennfarbe bleibt Aktionen vorbehalten.

**Die Feld-Modus-Schrift-Regel.** Der Feld-Modus hebt die Grundschrift auf 112 % und die kleinsten Grade an (`--t-xs` → 0.8125rem); nichts läuft draußen über Opacity oder Grauwerte zurück.

## Layout

Eine zentrierte Inhaltsspalte (`main`, max-width 60rem, Padding `--r-5`/`--r-4`, unten 6rem Freiraum für die fixe Schritt-Navigation). Formulare als umbruchfähige Zeilen (`.zeile`: Flex, `gap 0.8rem`, `flex-wrap`; Felder `flex: 1 1 10rem`, schmale Felder `0 1 7rem`) — das Layout trägt sich vom Telefon bis zum Desktop überwiegend aus dem Umbruch selbst. Startseite linksbündig: ein Satzspiegel mit fester linker Kante wirkt verbindlicher als die zentrierte Mittelachse.

Der Rhythmus kommt aus der `--r-1`…`--r-6`-Skala (0.25–2rem), und er ist gestaffelt: eng innerhalb einer Gruppe, `--r-4` zwischen Karten, `--r-6` als Absatz zwischen zwei Zwecken. Karten sind nicht automatisch je eine Reihe — zwei knappe Karten paaren sich ab 48rem zu einem Block (`.karten-paar`), statt halbleer über die volle Breite zu laufen. Tippziele: Grundmaß 2.25rem, plus globaler Zuschlag `--ziel` (0 im Standard, 0.75rem im Feld-Modus → 48-px-Ziele; Stepper-Knöpfe dort 3.75rem).

Vier benannte Umbruchpunkte, jeder an einer Inhaltsgrenze statt an einer Gerätebreite: **30rem** (Knopfreihen werden zur Spalte voller Breite, die Stärke-Leiste auf zwei Spalten), **40rem** (rollbare Tabellen laufen bis an die Kartenkante), **48rem** (Kartenpaarung), **540px** (Aktionsgruppen in Kartenköpfen brechen linksbündig um).

### Named Rules

**Die Absatz-Regel.** Gleichmäßig gestapelte Karten sind keine Gliederung. Ein Wechsel des Zwecks bekommt einen doppelten Kartenabstand (`--r-6`) als sichtbaren Absatz — in der Übersicht genau einen: dort, wo das Nachlesen aufhört und das Weitergeben anfängt. Weißraum trägt die Struktur, keine Trennlinie und kein Kasten.

**Die Leerspalten-Regel.** Eine Spalte, die für den ganzen Bogen leer ist, wird nicht gezeigt. Optionale Angaben ohne Inhalt sind keine Information — sie kosten auf dem Telefon genau die Breite, die der eigentlichen Auskunft fehlt.

**Die Zeilentrenner-Regel.** Wiederholte Einträge einer Liste trennt eine Haarlinie plus Innenabstand, kein Kasten je Eintrag. Ohne sie liegt der Abstand innerhalb eines Eintrags so groß wie der zwischen zweien, und bei 30–50 Meldungen einer Großlage verschwimmt die Liste zu einer Fläche.

**Die Navigationsraum-Regel.** Die 6rem Fußraum unter `main` halten die fixe Schritt-Navigation frei und gelten nur, wo sie erscheint; Startseite und Übersicht ziehen sie auf `--r-6` zurück (`main.start`, `main.ohne-nav`). Bewusst als Abzug statt als Zuschlag: eine vergessene Ansicht behält den großen Wert und verdeckt nichts.

## Elevation & Depth

Flach im Stand: Karten und Knöpfe liegen schattenlos auf dem Grund, getrennt durch 1-px-Rahmen und Weißraum — nicht über abgerundete, schwebende Kacheln. Schatten existieren ausschließlich strukturell an Überlagerungen, die wirklich über dem Inhalt schweben.

### Shadow Vocabulary
- **Vorschlagsliste** (`box-shadow: 0 4px 12px rgba(0,0,0,0.15)`): Autocomplete-Dropdown über dem Formular.
- **Dialoge/Overlays** (`0 8px 24px rgba(0,0,0,0.25)` bis `0 24px 64px rgba(0,0,0,0.35)`): modale Ebenen, gestaffelt nach Gewicht.

### Named Rules
**Die Flach-im-Stand-Regel.** Eine Fläche bekommt nur dann einen Schatten, wenn sie tatsächlich über dem Inhalt schwebt (Dropdown, Dialog). Karten, Knöpfe und Eingaben bleiben schattenlos.

## Shapes

Rechteckig und kantenbetont: `--radius: 0px` global — Behördenformular, nicht App-Kachel. Linien sind 1px (`--strich`/`--strich-stark`), im Feld-Modus 2px. Abgeleitete, nicht editierbare Werte tragen einen gestrichelten Rahmen (`output.abgeleitet`), der Papierkorb einen gestrichelten Kartenrahmen. Der Seitenkopf endet an einer harten 4-px-Unterkante (`--kopf-kante`), statt in den Inhalt auszulaufen.

### Named Rules
**Die Null-Radius-Regel.** Kein Element bekommt einen eigenen `border-radius`. Alles referenziert `var(--radius)`, und der ist 0. (Die Plattform-Layer dürfen ihn systemkonform neu belegen — nie die Komponente selbst.)

## Components

Komponenten-Gefühl (bestätigt): **robust und werkzeughaft — gebaut für Handschuhe und Zeitdruck.**

### Buttons
- **Shape:** rechteckig (0px), Rahmen 1px `--linie-stark`.
- **Default:** Fläche `--flaeche`, Text `--text`, 600, Padding 0.5rem 0.9rem, min-height 2.25rem + `--ziel`; `-webkit-appearance: none` (iOS-WKWebView tönt Button-Text sonst systemblau).
- **Hover / Focus:** Hover färbt Rahmen und Text in die Kennfarbe; Tastaturfokus überall gleich: `outline: var(--fokus) solid var(--akzent)` (3px, im Feld-Modus 4px).
- **Primär (`button.primaer`):** Kennfarbe als Fläche, weiße Schrift; Hover hellt zur `--akzent-hell` auf. Eine primäre Aktion je Ansicht.
- **Disabled:** `opacity: 0.4` — die einzige zulässige Opacity-Abschwächung (der Feld-Modus hebt andere auf).

### Inputs / Fields
- **Style:** weiße Fläche, 1px-Rahmen `--linie-stark`, 0px Radius, Padding 0.45rem 0.55rem, min-height 2.25rem + `--ziel`.
- **Beschriftung:** `label.feld` über dem Feld (0.75rem, 600, `--text-2`); Feld füllt die Spaltenbreite.
- **Focus:** Fokusring in der Kennfarbe plus Rahmenfarbe `--akzent`.
- **Abgeleitet:** `output.abgeleitet` gestrichelt auf `--flaeche-2` — sichtbar „errechnet, nicht eingetippt".
- **Checkbox/Radio:** `accent-color: var(--akzent)`; im Feld-Modus 1.7rem groß.

### Cards / Containers
- **Corner Style:** 0px.
- **Background:** `--flaeche` auf `--grund`; Rahmen 1px `--linie`.
- **Shadow Strategy:** keiner (siehe Elevation).
- **Internal Padding:** `--r-4`, Stapelabstand `--r-4`.

### Navigation (Seitenkopf)
- Kopfbalken in der Kennfarbe (`--kopf-fond`), weiße Schrift, harte 4-px-Unterkante als dunklerer Schatten der Kennfarbe; Schrittleiste darin mit 3-px-Unterstrich (`--kopf-strich`) am aktiven Schritt.
- Eigene `--kopf-*`-Token, damit iOS/Android ihn ohne Spezifitäts-Wettrennen auf ihre Systemkopfzeile zurücksetzen können und der Nacht-Modus ihn abdunkeln kann (nachts bleibt der Balken dunkel — eine vollflächige Kennfarbe wäre die hellste Stelle im Bild).

### Autocomplete / Vorschlagsliste (Signature Component)
Absolut positionierte Liste unter dem Feld: weiße Fläche, 1px-Rahmen `--linie-stark`, der einzige Nicht-Overlay-Schatten des Systems (0 4px 12px), aktive Zeile auf `--flaeche-2`. Vorschläge tragen Zweittext als `small` in `--text-2`.

### Teil-Quittung (mehrteiliger QR-Transport)
Kästchenzeile für den segmentierten Transport (`teil-quittung.tsx`): je Teil ein Kästchen in `--schrift-daten`, Größe in `em` (die 112-%-Schrift des Feld-Modus vergrößert sie mit, ohne eigenen Modus-Block). Eingegangene Teile sind gefüllt (`--gut`, Schrift `--grund` — beide sind in jeder Belegung gegenläufig hell/dunkel, deshalb trägt die Schrift auch im aufgehellten Grün von Dunkel und Nacht), offene bleiben leer mit Linie `--linie-stark`. Der Unterschied liegt in der **Füllung**, nicht allein in der Farbe. Die Farben laufen über eigene Kanäle (`--quittung-*`), weil die Zeile in zwei Welten steht: auf den Token-Flächen und im Scanner-Overlay über dem Kamerabild, wo sie — wie der übrige Overlay-Text — auf Weiß/Schwarz umschaltet. Der Fortschrittssatz daneben bleibt die maßgebliche Auskunft (Screenreader, nativer System-Scanner); die Zeile ist `aria-hidden`.

### Anzeigemodi (Systemverhalten, nicht Komponente)
- **Dunkel** (`.dunkel-modus`): neutrale Invertierung (#0f1116/#171a21), Kennfarbe wechselt auf den aufgehellten Org-Ton (`--org-akzent-dunkel`), Kopfbalken behält die Kennfarbe.
- **Feld** (`.feld-modus`): hell, maximaler Kontrast — Text #000, alle Linien #111318 und 2px, Schrift 112 %, Tippziele 48px, keine Opacity-Abstufungen.
- **Nacht** (`.nacht-modus`): warm gedimmt (#0d0c08, Text #d9cdb6), Kennfarbe weicht Bernstein (#a8791a) — sattes Organisationsblau wäre genau das Licht, das die Dunkeladaption zerstört. Kopfbalken bleibt dunkel.
- QR-Bilder behalten in jedem Modus ihre weiße Ruhezone (`background: #fff; padding: 8px`) — sonst unscannbar.

## Do's and Don'ts

### Do:
- **Do** neue Farben als Rollen-Token in `index.html` anlegen und in allen vier Belegungen (Hell, Dunkel, Feld, Nacht) definieren — plus, wo nötig, in den Plattform-Layern `--ios-*`/`--md-*`.
- **Do** Trefferflächen über `calc(… + var(--ziel))` bauen, damit der Feld-Modus sie automatisch auf 48px zieht.
- **Do** Fokus sichtbar und einheitlich halten: `outline: var(--fokus) solid var(--akzent)`.
- **Do** Daten (Stärken, Kennzeichen) in `--schrift-daten` (Monospace) setzen.
- **Do** die Kennfarbe der Organisation über `wendeOrgAkzentAn()` (org-farben.ts) beziehen — nie eine Org-Farbe hart in CSS schreiben.
- **Do** Abstände nach Bedeutung staffeln: eng innerhalb einer Gruppe, `--r-4` zwischen Karten, `--r-6` als Absatz zwischen Zwecken (Absatz-Regel).
- **Do** knappe Karten paaren, statt sie halbleer über die volle Breite laufen zu lassen (`.karten-paar` ab 48rem).

### Don't:
- **Don't** `border-radius` mit eigenem Wert setzen — nur `var(--radius)` (Null-Radius-Regel).
- **Don't** Schatten an ruhende Flächen hängen; Schatten nur an Dropdown/Dialog (Flach-im-Stand-Regel).
- **Don't** `prefers-color-scheme` auswerten — die Modi schalten ausschließlich über den Schalter und die `<html>`-Klasse (bestätigt: ein halb angewandtes Dunkel ist im Einsatz schlimmer als eine helle Oberfläche).
- **Don't** Text über Opacity oder helle Grauwerte zurücktreten lassen, wo der Feld-Modus greift — dort gilt: nichts tritt zurück.
- **Don't** Verläufe, schwebende Kacheln, runde Ecken oder verspielte Illustrationen einführen (bestätigte Anti-Referenz: Consumer-App-Ästhetik).
- **Don't** Schrift vom CDN laden — Archivo liegt im Bundle und muss offline verfügbar bleiben (PWA-Precache).
- **Don't** in Spaltenrichtung `flex-wrap: wrap` mit einem Kind auf `flex-basis: 100%` kombinieren — der Umbruch geht dann in eine ZWEITE SPALTE und die Knöpfe laufen aus der Karte heraus. Regeln mit voller Hauptachsen-Basis gehören in eine `min-width`-Abfrage.
- **Don't** dieselbe Zahl in zwei Größen setzen: die Stärke trägt überall die dicktengleiche Zählwert-Figur (Übersicht wie Einsatz-Sammlung).
