# Ultimate Gridfinity Generator – Projekt-Spezifikation (Stand: 2. November 2026)

> **Zweck dieser Datei:** Kontext für Claude Code und andere Agenten. Sie fasst alle Entscheidungen, Maße und offenen Punkte der Planung zusammen. Projektname: *Ultimate Gridfinity Generator* (Deckel zuerst).
> **Quellenhinweis:** Zahlen und Aussagen stammen aus den am Ende verlinkten Quellen. Wo etwas abgeleitet, angenommen oder unsicher ist, steht es ausdrücklich dabei.

---

## 1. Ziel und Rahmen

- Offene App, Bezahlfunktionen vielleicht später. Wenn die Web-App läuft, kommen Extras dazu, die evtl. kostenpflichtig sind. Der Umfang des MakerWorld-Scripts (auch Bin, Baseplate, Schiebedeckel, Beschriftung) ist ausdrücklich in Ordnung.
- Erster Schritt: ein **MakerWorld-Customizer** (OpenSCAD-Script) für **Gridfinity-Deckel**, um dort Punkte zu sammeln.
- Danach: eigene **Web-App (PWA)** mit derselben Funktion. Ablauf (Nutzer, 2. November 2026): Claude Code baut die App zuerst mit den Deckeln und zeigt nur diese Optionen. Der Nutzer testet; ist alles gut, geht Claude Code das nächste Feature an (Bin, Baseplate, Schiebedeckel und so weiter, eines nach dem anderen).
- **Unabhängig bleiben:** keine Abhängigkeit von fremden Roadmaps (SolidCraft-Plugins erst später, wenn sie ausgereift sind).
- **Der Gridfinity-Standard gilt wie die Bibel.** Alle Maße laufen im Gridfinity-System, Basis 7 (Höhe) und 42 (Raster).
- Keine Zertifikate/kein Code-Signing nötig (Web-App).

## 2. Phasen und Stand

| Phase | Inhalt | Stand |
|---|---|---|
| A | MakerWorld-Script (OpenSCAD, Parametric Model Maker) | Fertig (vom Nutzer, außerhalb der Web-App entstanden); dient als Test-Orakel, Kopie in `reference/gridfinity_generator.scad` |
| A-Fix | Mehrzellen-Deckel: Fuß durchgehend statt Kreuz in der Mitte, `foot_layout` mit `merged` (Standard) und `per_cell` | Erledigt, im Script enthalten |
| B | Web-App (PWA), Deckel | Stack und Toolchain entschieden (ADR-0004), Design entschieden (`docs/design/`), Prompt noch nicht geschrieben |
| C | Bins und Baseplates (Standard), Schiebedeckel, Füller für freien Platz, jeweils als nächstes Feature nach dem Test des vorigen | später |
| D | SolidCraft-Plugin | später, wenn Plugin-System ausgereift |
| E | Schubladen-Planer, Druckknopf-Verbinder für aufgefüllte Platten, Text an Bin-Wänden, Farbe nach Höhe, Bin-Innenraum, eigenes Druckbett | geplant, erst nach Deploy und Veröffentlichung (Nutzer, 4. November 2026) |

**Zurückgestellt/verworfen:** Desktop-App mit Tauri oder Electron (Entscheidung: Web-App).

## 3. Funktionsumfang

### 3.1 Deckel (Phase A/B)

- **Maße:** Länge und Breite im 42-mm-Raster (Eingabe in Einheiten).
- **Fuß:** Gridfinity-Fuß mit Deckplatte. Der Deckel sitzt im Stacking Lip eines Bins bzw. auf einer Baseplate. **Keine Nut**.
- **Fuß-Layout** bei Deckeln größer als 1×1:
  - `merged` (Standard): ein durchgehender Fuß um die gesamte Außenkontur, ohne Kreuz, mit geschlossener Unterseite.
  - `per_cell`: ein Fuß pro Zelle (z. B. um vier 1×1-Bins mit einem Deckel zu schließen).
- **Varianten:**
  - **Staubschutz:** Fuß plus dünne Platte, nichts steht darüber.
  - **Stapelbar:** zusätzlich Stacking Lip auf der Platte, rundherum oder nur an den Ecken (`full | corners_only`, Eck-Lip-Länge als Parameter).
  - Beide Varianten sind getrennte Optionen.
- **Plattendicke:** frei (manuell, mm) oder automatisch (so, dass die Gesamthöhe ein Vielfaches von 7 mm ist; 1u ergibt 2,25 mm).
- **Hohlfuß:** Sockel ausgehöhlt (Filamentersparnis). Der Hohlraum ist ein einziger gerader Ausschnitt von unten (kein Profil, keine Lippe innen), eingerückt um die Hohlfuß-Wand von der Fußunterkante; er endet 1,45 mm unter der Platte, dieser zusätzliche Boden im Hohlfuß trägt die Magnettaschen mit (Nutzer, 2. November 2026). Idee ist neu, bisher war der Fuß voll.
- **Magnete (Entscheidung des Nutzers, 2. November 2026):** Beim Deckel sitzen die **Eckmagnete an der Oberseite** (Tasche 6,1 Ø × 2,1, Parameter): konsistent mit den anderen Teilen, und es bleibt Platz für ein Label. Der Deckel hat **keinen Mittenmagneten** und **keine Eckmagnete im Fuß**, weil der Mittenmagnet mit dem Label kollidieren würde. Die Magnettaschen sitzen nur in den **vier äußersten Ecken** des Teils: Die Tasche geht von der Oberseite 2,1 mm (änderbar bis 3,9) in die Platte; die Platte bleibt bei 2,25 mm (Spec, automatisch). Bei vollem Fuß liegt der Fuß unter der Tasche und es bleibt mindestens 0,8 mm Material unter dem Taschenboden (abgeleitet aus dem Script, das 0,8 mm über dem höchsten Magneten hält; die Regel stammt aus dem Script, nicht aus der offiziellen Gridfinity-Spec). Bei Hohlfuß trägt der Boden von 1,45 mm unter der Platte: unter der Standardtasche bleiben 0,15 mm Platte plus 1,45 mm Boden, zusammen 1,6 mm (Nutzer, 2. November 2026, nach dem Test). Keine Zylinder, kein Polster. Ein 1×1-Deckel bekommt Magnete in alle vier Ecken, ein 4×4-Deckel nur in die äußersten vier Ecken; bei einem großen Bin mit mehreren Füßen gilt dasselbe. Der **Mittenmagnet** (kein Spec-Bestandteil, eigene Parameter) gehört ausschließlich in die **Füße** (Bins) und in die **Baseplate**: In der Baseplate sitzt er auf der Nabe mit vier Rippen (`center_ribs`); im Bin-Fuß gibt es keine Rippen, nur einen 1,2 mm breiten Rand um die Tasche, der den Magneten hält. Bei einem großen Bin sitzen die Mittenmagnete wie die Eckmagnete nur in den Eckfüßen (Nutzer, 2. November 2026).
- **Beschriftung:** Text (Schrift wählbar) und Symbol (SVG-Upload), jeweils skalierbar, mit Offset und Rotation. Modus pro Element: `none | raised | engraved | flush`.
- **Farben:** Deckel und Beschriftung getrennt wählbar.
- **Druckausrichtung:** wählbar (normal oder kopfüber). Bei `flush` druckt man kopfüber, dann liegt die Beschriftung auf der Platte.
- **Griffe:** vorerst gestrichen.

### 3.2 Später (Phase C)

- **Bins und Baseplates im Standard** (Mittenmagnet optional). Die Parametergruppen je Teil stehen in `docs/design/ui-spec.md` Abschnitt 8. Der Umfang eines Bins ist durch das Raster vorgegeben (Nutzer, 2. November 2026): Breite und Tiefe in Zellen, Höhe in 7-mm-Einheiten, dazu die Optionen aus dem Script (Lip-Stil, Fuß, Magnete, Wand und Boden); keine Fächer, kein Scoop, kein Label-Tab.
- **Schiebedeckel** (Bin mit Nut, Deckel bündig mit Bin-Oberkante). Referenz: Gridfinity Extended (Parameter: Deckeldicke, Mindestwand, Auflage, Spiel, Ausschnitt, später Griffstil, Rastnase, Text). Bei Schiebedeckel nur Lip-Variante „none“ (Überhänge, Stapeln).
- **Füller für freien Platz** (Schubladen), entschieden (Nutzer, 2. November 2026): Der Füller gehört zum Umfang. Der Nutzer gibt Breite und Länge seiner Schublade an. Die Baseplate wird erzeugt; ist sie zu klein für das Maß, wird der Rest massiv aufgefüllt (Fit-to-Drawer wie in rebuilt-openscad: Mindestmaß in mm, massiver Füllrand, Lage per Faktor −1 bis 1). Das Script macht das bereits. Später kommt die Höhe der Schublade dazu: Sie sperrt die Höhe von Bins und Deckeln auf das, was in die Schublade passt. Verlängerte Bins und Halbzellen-Taschen sind nicht geplant. Umsetzung als eigenes Feature in Phase C.

### 3.3 Nach Deploy und Veröffentlichung (Phase E)

Entscheidung des Nutzers, 4. November 2026: Diese Funktionen kommen erst nach dem Deploy und der Veröffentlichung der App, jeweils eine nach der anderen und nach dem Test des Nutzers.

- **Schubladen-Planer.** Wenn der Nutzer eine Baseplate hat und weiß, was hineinkommt, plant er Bins und Deckel direkt in der Software für die Schublade (Platzierung auf dem Zellraster, Höhe durch die Schubladenhöhe begrenzt). Export: eine 3MF oder alle STLs gezippt (eine Datei je Teil). Offen: ob die 3MF die Schublade wie geplant oder die Teile für den Druck auf dem Bett zeigt (Abschnitt 9, Punkt 10).
- **Verbinder für aufgefüllte Basen.** Druckknöpfe wie bei Lego (Zapfen und Buchse), die in die aufgefüllten (massiven) Segmente kommen und geteilte oder aufgefüllte Platten verbinden. Welches Spiel passt, weiß der Nutzer erst nach Testdrucken; das Spiel ist danach vom Nutzer einstellbar (custom). Bis dahin werden keine Werte erfunden (Abschnitt 9, Punkt 12).
- **Text an Bin-Wänden.** Text wird in die Wände eines Bins eingestanzt (graviert), mit den eingebauten Schriften oder einer hochgeladenen Schriftdatei wie beim Deckel-Label. Die Gravurtiefe lässt immer Wandmaterial stehen (Abschnitt 9, Punkt 11).
- **Farbe nach Höhe.** In den Farbeinstellungen kommt eine Sektion mit Farbbändern, daneben ein Plus für ein weiteres Band. Die Basis ist die vom Nutzer gewählte Teilfarbe. Die Bänder liegen von unten nach oben über die ganze Höhe des Teils: Jedes Band hat eine Höhe, das erste beginnt am Druckbett, das nächste darauf, und das oberste Band nimmt den Rest. Beispiel: Bei einem 20 mm hohen Teil mit den untersten zwei Bändern zu je 5 mm und dem dritten mit 3 mm bleiben 7 mm für das oberste. Idee und Regeln des Nutzers, 4. November 2026 (Abschnitt 9, Punkt 13).
- **Bin-Innenraum.** Trennwände teilen den Bin in Fächer, dazu Schaufelrampe und Label-Fahne. Maße und Eingabe entscheidet der Nutzer (Abschnitt 9, Punkt 14).
- **Eigenes Druckbett.** Der Nutzer gibt Breite, Tiefe und Höhe seines Druckers ein; Bed-Check, roter Rand und Warnung lesen diese Werte und rechnen live (Abschnitt 9, Punkt 15). Heute vorhanden: quadratisches Bett mit abgerundeten Ecken und Bauhöhe.

## 4. Gridfinity-Spec: Konstanten (alle in mm)

**Regel für den Code:** alle Konstanten an einer einzigen Stelle mit Quellenangabe, Tests gegen jede Spec-Zahl. Braucht der Code ein Maß, das hier nicht steht, soll er stoppen und es melden, statt einen Wert zu raten.

| Größe | Wert | Anmerkung |
|---|---|---|
| Raster | 42 | Basis 42 |
| Höheneinheit | 7 | Basis 7 |
| Toleranz Bin | 0,5 gesamt (0,25 pro Seite) | Außenmaß = n × 42 − 0,5 (1x1 = 41,5; 2x2 = 83,5) |
| Bin-Eckradius außen | 3,75 | Durchmesser 7,5 |
| Fuß-Eckradien (gestuft) | 3,75 → 1,6 → 0,8 | Plan: 7,5Ø / 3,2Ø / 1,6Ø |
| Baseplate-Eckradius | 4,0 | 8,0Ø |
| Fußprofil (von unten) | 0,8 (45°) / 1,8 senkrecht / 2,15 (45°) | Höhe gesamt 4,75 |
| Fuß-Unterkante (1u) | 35,6 breit | = 41,5 − 2 × 2,95 |
| Nutzraum der ersten 7-mm-Lage | 2,25 | 7 − 4,75 |
| Stacking Lip (von unten) | 0,7 (45°) / 1,8 senkrecht / 1,9 (45°) | Höhe 4,4, Tiefe 2,6, 0,25 Offset zum Fuß; zählt **nicht** zur 7-mm-Höhe |
| Beispiel mit Lip | 1x1x3 = 25,4 hoch; 2u = 18,4 | Praxis: Lip wird auch mit 3,75 oder 3,69 (0,5-Rundung) gebaut |
| Baseplate-Profil | 0,7 / 1,8 / 2,15 | Wand 4,65 hoch, nominal „~5“, 0,25 Offset |
| Magnet | 6 × 2 | Tasche 6,1 Ø × 2,1 tief als Startwert, vom Nutzer änderbar (Entscheidung des Nutzers). 0,1 mm Spiel pro Maß macht laut Nutzer jeder, deshalb gilt die Tasche als Standard |
| Schraubenloch | 3,0Ø | wird bei gewählten Schrauben in die Mitte der Magnettasche durchgestoßen (Boolean), mehr nicht; am Deckel gestrichen (Nutzer, 2. November 2026), nur für Bins |
| Baseplate-Radien | R4 außen, R1,85 und R1,15 innen | alle Ecken gleich, Lochlage symmetrisch |
| Baseplate-Lochlage | 26 Lochabstand, 8 von der Zellkante, 5,15 von der Fußkante | 8 = (42 − 26) / 2; 5,15 = 8 − 2,85 |
| Baseplate-Profilbreiten | 2,85 je Seite unten, 2,15 je Seite an der Wand; 36,3 und 37,7; Steg unten 5,7 | 36,3 = 42 − 2 × 2,85; 37,7 = 42 − 2 × 2,15 |
| Bin senkrechte Wandbreite | 37,2 | = 41,5 − 2 × 2,15 |
| Stacking Lip, Varianten | rund (R0,5) und scharf (ohne Rundung) | gleiches Profil 0,7 / 1,8 / 1,9, Tiefe 2,6 |
| Lochmitte | 4,8 von der untersten Fußkante | abgeleitet: 7,75 von der Außenwand, 26 mm Lochabstand |
| Halbraster 21 mm, eigene Rastergröße | Community-Erweiterung | nicht Teil der Spec |

**Maßstab:** Die Referenzzeichnungen in `reference/gridfinity-reference-drawings/` (Stu142, 2023-11-10) und die offizielle Dokumentation (Gridfinity-Spezifikation, Printables) sind der Maßstab. Der Nutzer behandelt beides wie die Spec („die Bibel“). Die Zeichnungen enthalten die vollständigen Maße und sind für Agenten die Referenz. Die Zeichnungen und die Tabelle oben stimmen überein.

**Magnettasche (Entscheidung des Nutzers):** Eine Tasche 6,1 Ø × 2,1 tief als Startwert; Durchmesser und Tiefe wählt der Nutzer. Sind Schrauben gewählt, wird in die Mitte der Tasche ein 3-mm-Loch durchgestoßen (Boolean), mehr nicht. Es gibt keine größeren Löcher. Andere Magnetgrößen sind möglich; die Obergrenzen sind berechnete Geometriegrenzen, keine Spec-Zahlen: Eckmagnet-Tasche bis 8,1 Ø (bleibt 0,75 mm Wand am Fußrand), Mittenmagnet bis 10 Ø. Die Zeichnungen zeigen dazu abweichende Lochmaße (Magnetloch 6,5 Ø × 2,4, Baseplate-Schraubenloch 3,5 Ø, Bin-Schraubenloch 6 tief); diese Maße gelten im Projekt nicht, maßgeblich ist diese Entscheidung.

**Nicht in der Spec (als Parameter; keine Kennzeichnung in der Oberfläche, Nutzer 2. November 2026):** Wandstärke, Bodenstärke, Deckelplatte, Spiel, Wandstärke im Hohlfuß, Eck-Lip-Länge, Prägetiefe.

**Standardwerte (vom Nutzer bestätigt, 2. November 2026):**

| Parameter | Default |
|---|---|
| Wand im Hohlfuß (`foot_wall`) | 1,2 |
| Haut bei hohlem Bin-Fuß (`foot_skin`) | 0,8 |
| Eck-Lip-Länge (`corner_len`) | 10 |
| Prägetiefe | 0,6 |
| Schiebedeckel-Spiel | 0,3 |
| Mittenmagnet | 5,0 × 2,0, Spiel 0,2 |
| Texthöhe (`text_size`) | 5,0, zugleich Minimum (Nutzer, 2. November 2026; vorher 8, dann war ein Wort wie ENGRAVED zu breit für einen 1×1-Deckel); Obergrenze 30 laut Script |
| Farben | Solange der Nutzer keine Farbe wählt, bleiben die Bauteile in Stone `#9DA39A`; der Text ist Schwarz (Platzhalter) |

**Regel (Nutzer):** Der Spec-Wert ist immer Minimum und Standard. Der Nutzer kann ihn nur vergrößern, kleiner geht nicht, und nur bis zu einer Obergrenze (Limit) je Parameter. Die Obergrenzen sind Geometriegrenzen, bei denen die Teile noch nicht kollidieren. Das gilt für alle Werte mit Spec- oder Standardwert (Tabellen in diesem Abschnitt). Das gilt auch für die Plattendicke: Standard laut Spec (automatisch: Gesamthöhe ein Vielfaches von 7 mm, 1u = 2,25 mm), manuell nur größer. Der Maßstab ist entschieden: Referenzzeichnungen und offizielle Dokumentation, siehe oben.

## 5. Lizenz

- Gridfinity stand ursprünglich unter CC BY-NC-SA 4.0 und wurde laut mehreren Quellen später von Zack Freedman auf **MIT** umgestellt. Zack Freedmans Dateien nennen „Copyright (c) 2023 Zachary Freedman and Voidstar Lab LLC“. Das Design-Reference-v5-Blatt nennt noch CC BY-NC-SA.
- MIT erlaubt Nutzung, Änderung, Weitergabe und Verkauf, verlangt aber, den Copyright- und Lizenzhinweis in allen Kopien oder wesentlichen Teilen beizulegen (Dateikopf der .scad, Beschreibung auf MakerWorld).
- Ein Forenbeitrag weist darauf hin, dass MIT mehr Rechte gewährt als die MakerWorld-„Standard Digital File License“ und das kollidieren kann. Das ist eine Forenmeinung, keine Auskunft von MakerWorld.
- Prüfung der Originalquellen (2. November 2026): Die Printables-Seite der Gridfinity-Spezifikation nennt **MIT**. gridfinity-rebuilt-openscad schreibt in der README „licensed under the same license as Gridfinity, being a MIT License“. Die Ankündigung des Wechsels durch Zack Freedman ist nur über ein Video und einen GitHub-Issue (kennetek/gridfinity-rebuilt-openscad #96) belegt; ein eigener Lizenztext oder ein schriftlicher Zusatz von ihm wurde nicht gefunden.
- Die Referenzzeichnungen (Stu142, GitHub-Repository Stu142/Gridfinity-Documentation) stehen laut LICENSE-Datei dort unter **CC BY-NC-SA 4.0**. Das gilt für diese Dateien, solange sie im Repository liegen (Quellenangabe, nicht kommerziell, Weitergabe unter gleichen Bedingungen).
- Eigene Lizenz des Projekts: **CC BY-NC-SA 4.0** (Entscheidung des Nutzers, 2. November 2026). Wunsch dahinter: Die Software ist offen einsehbar, Dritte dürfen sie nicht verkaufen; nur der Nutzer darf kommerziell verwerten (als Lizenzgeber darf er das). Hinweise: Creative Commons rät selbst von CC-Lizenzen für Software ab; NC-Lizenzen sind nicht „Open Source“ im Sinne der OSI. Offen: ob die Lizenz auch die Ausgabedateien der App umfasst, wie mit Beiträgen Dritter umgegangen wird, und wann eine `LICENSE`-Datei angelegt wird (vorher fragen). Die Lizenzen der eingebundenen Schriften und Pakete stehen in `skills/licences-and-credits/SKILL.md` und werden in der App auf einer Seite „OSS Licenses“ mit Links zu den offiziellen Seiten angezeigt. Keine Rechtsberatung.
- Libraries: gridfinity-rebuilt-openscad ist MIT. OpenSCAD selbst ist GPL (WASM-Einbettung würde die ganze App unter GPL stellen). brepkit ist ab 3.0.0 AGPL-3.0 oder kommerziell (bis 2.129.x MIT/Apache). Manifold: Apache-2.0, opentype.js: MIT.

## 6. MakerWorld-Script (Phase A)

### 6.1 Regeln des Parametric Model Maker (PMM)

- Läuft OpenSCAD **2021.01** auf MakerWorlds Servern. Eine .scad-Datei als Rohdatei im Listing macht den Customize-Button.
- **Eine Datei**, keine `include`/`use`, keine lokalen Dateien, keine externen Libraries (installiert sind u. a. BOSL2, gridfinity-rebuilt-openscad, threads-scad, Stand März 2025). Das Script ist bewusst selbstständig.
- Customizer-Syntax: `/* [Gruppe] */`, Dropdowns per Kommentar, Farben als Hex-String mit `// color`, Schriften mit `// font` (nur auf MakerWorld installierte Schriften). SVG-Upload nach dem dokumentierten Default-Asset-Muster; wenn das nicht sauber geht, nur Text liefern.
- **Kein Multi-Plate** (`mw_plate_N`), sonst gibt es keinen STL-Download.
- **Farben:** jeder Farbkörper als eigenes `color()`-Kind auf oberster Ebene. Kein `union()` über Farben hinweg (lazy-union fehlt, sonst bricht die Filamentzuordnung). Farben kommen nur im 3MF an, nicht im STL. Bekannte Schwächen: Filamentzuordnung in Bambu Studio, 3MF-Download schlägt manchmal fehl.
- Dateiname ohne Leerzeichen.
- Renderzeit niedrig halten (kein `minkowski`, kein `hull` über Text).
- UI-Texte auf Englisch. Dateikopf mit Gridfinity-Credit und MIT-Hinweis.
- **Testen ohne Veröffentlichen:** makerworld.com/en/makerlab/parametricModelMaker öffnen, „Blank“ anlegen, Code links einfügen (Forenhinweis); „Sample Code“-Icon zeigt alle Widgets. Danach als Listing hochladen (ein Bild eines gedruckten Modells ist nötig).
- **Punkte:** MakerWorld vergibt laut Community-Post Punkte für Customize-Nutzung, die Formel ist seit Juni 2025 nicht mehr öffentlich.

### 6.2 Inhalt des Prompts für Claude Code (zusammengefasst)

1. Quellen nur offiziell/Original, Spec-Zahlen aus Abschnitt 4, bei Abweichung melden, nicht still ändern.
2. **Phase 1 Deckel:** `units_x`, `units_y`, Plattendicke manuell/auto, Variante Staubschutz/stapelbar, `lip_mode full|corners_only`, Hohlfuß `none|open`, Magnete (Ecke an der Oberseite, kein Mittenmagnet, siehe 3.1; das Script wurde am 2. November 2026 entsprechend angepasst), Text/Symbol je `none|raised|engraved|flush`, Farben, `print_orientation foot_down|upside_down`.
3. **Fix `foot_layout`:** `merged` (Standard) oder `per_cell`, Hohlraum folgt im Script dem jeweiligen Profil (Script-Stand: Magnete pro Zelle); die Web-App schneidet einen geraden Ausschnitt und setzt Magnete nur in die vier äußersten Ecken, siehe 3.1.
4. **Phase 2:** Bin und Baseplate (nur Größe, Höhe, Lip-Stil, Fuß-Optionen; Baseplate mit Fit-to-Drawer).
5. **Phase 3:** Schiebedeckel mit Nut, Aussparung, Spiel.
6. **Prüfung** mit OpenSCAD-CLI (Manifold-Backend), STL-Auswertung in Python/trimesh: u. a. Lid 1x1 BBox 41,5 × 41,5 × 7,0; 2x1: 83,5 × 41,5; Fuß-Unterkante 35,6; stackable 1x1 mit Platte 2,25: Höhe 11,4; Bin 1x1x3: 21 (mit Lip 25,4); Passprobe ohne Überschneidung (Spalt ca. 0,25); Mesh geschlossen für 1×1 bis 4×4. Nach jeder Phase prüfen und berichten.

## 7. Web-App (Phase B)

### 7.1 Entscheidungen

- **Plattform:** Web-App als **PWA**, statisch ausgeliefert vom eigenen Server des Nutzers.
- **Rechnen im Browser** (Rechner des Nutzers), kein Server-Rechnen, kein Server-Speicher für STL/3MF.
- **Export vorerst nur STL und 3MF** (kein STEP).
- **Geometriekern:** **Manifold WASM** (`manifold-3d`, Apache-2.0, Datei 476 kB), im Web Worker. Mesh-Kern, wasserdichte Meshes, Booleans, Extrusion, Revolve, Hull, 2D-Offset. WASM-Build ist nur seriell, kein SharedArrayBuffer nötig.
- **Text:** `opentype.js` (MIT) liefert Bézier-Pfade der Buchstaben → in Polygone umrechnen → extrudieren. Schriftdateien selbst mitliefern (Lizenz jeder Schrift prüfen, Dateigröße im Blick behalten).
- **Symbol (SVG):** Pfade einlesen, in Polygone umrechnen, wie beim Text.
- **Vorschau:** three.js (Manifold-Doku hat Beispiele).
- **UI:** Svelte.
- **Stand Phase B (Deckel), 2. November 2026, Entscheidungen des Nutzers im Test:** Labels (Raised, Flush) sitzen direkt auf der Platte, kein Spalt (`flush_gap` entfällt); die Teile bleiben getrennte Meshes. Schrift „Other“ = eigene Schriftdatei des Nutzers (.ttf, .otf, .woff, bis 2 MB), base64 in der Modell-Datei; die Lizenz liegt beim Nutzer. Landing-Seite zuerst gestrichen (2. November), am 4. November 2026 vom Nutzer wieder gewünscht und gebaut (`docs/design/ui-spec.md` 2.1; Editor unter `#/editor`; der Dialog „OSS Licenses“ liegt auf beiden Seiten). Hosting ist nicht Aufgabe dieses Repos. Parametergruppen sind standardmäßig geschlossen. Plattendicke-Standard „Auto“. Label-Standardwerte bestätigt: `icon_size` 14, `label_gap` 3, `symbol_scale` 1, Offset-Grenze ± halbe Deckelgröße. Bed-Check mit den Druckbereichen der offiziellen Bambu-Studio-Maschinenprofile (P2S 256 × 256 × 256 ohne Sperrzone; P1S, P1P, X1, X1C, X1E 250 mm Höhe mit Sperrzone 18 × 28 mm vorne links; dazu A2L, H2D Pro, H2C, X2D; H3C und P3S fehlen bewusst, nicht released). Modelle im Browser: „Download as ZIP and clear“. Modell-Datei: JSON, Schemaversion 1, Werte werden auf das Limit geklemmt, nie unter das Spec-Minimum. Text: glyphenweise mit Kerning, ohne Ligaturen (opentype.js stürzt bei Inter ab). Eigene SVG: 96 dpi. Zusätzlich gebaut: Report-Bug-Button (GitHub-Issues), Kamera-Animation 240 ms. Label-Randabstand: Text und Symbol halten 3 mm zur Deckelkante (gemessen am abgerundeten Umriss); darunter erscheint eine Warnung, und die Vorschau zeichnet den Streifen als diagonale Balken in `#84161C` und `#3F0709`; Engraved bleibt mit dieser Warnung erhalten. Vorschau-Boden: das Druckbett des gewählten Druckers, immer dunkel, mit der echten Plattenform (256-mm-Drucker wie P2S, H2-Familie und A1 mini mit eigener Form, aus Bildern des Nutzers gemessen, etwa 1 mm genau), dazu „Custom size“ (Quadrat mit abgerundeten Ecken, 50 bis 600 mm, plus Bauhöhe 20 bis 600 mm); der vom Drucker freigehaltene Bereich wird nicht gezeichnet, der Bed-Check beachtet ihn weiter. Ausgabespalte 340 px breit. Teiltyp-Schalter in der Reihenfolge Base, Bin, Lid. Hohlfuß-Boden: der Hohlraum endet 1,45 mm unter der Platte. Nach dem Passtest: der Fuß passt. Technische Entscheidungen: ADR 0005 bis 0008. Oracle-Abweichungen (ADR-0006): Labels ohne Spalt, Hohlfuß ohne Stütze unter den Taschen, keine Schraubenlöcher am Deckel, Text nicht verglichen.
- **STL:** eigener Binär-Writer.
- **3MF (Stand ADR-0008):** reines 3MF Core, ein Objekt aus Komponenten (Lid, Lip, Text, Symbol), Farben als `m:colorgroup` (Bambu Studio liest `basematerials` nicht); ursprünglich geplant: Teile als **getrennte Objekte** mit Basismaterial-Farbe. Manifold bringt `lib/export-3mf` mit, alternativ JSZip (3MF = ZIP mit XML). Bambu Studio speichert die Filamentzuordnung in eigenen Metadaten (`project_settings.config`), die Zuordnung der Farben ist slicer-abhängig. Die Teile dürfen nicht zu einem Körper verschmelzen.
- **Speichern:** Modelle als JSON (Modelltyp, Schemaversion, Parameter, Text, Farben, SVG als String). Vorerst im Browser (localStorage/IndexedDB) und als Datei zum Herunterladen/Laden. Teilen per URL-Zustand wäre möglich (Scadder-Prinzip). Konten und Server-Speicher erst bei Bezahlfunktionen (Django + allauth wäre ein Weg).
- **Datei speichern:** `<a download>` funktioniert in allen gängigen Browsern. `showSaveFilePicker` (Speicherort wählen) gibt es nur in Chrome und Edge (ab 86), Firefox und Safari nicht → Fallback nötig.
- **PWA:** HTTPS ist Pflicht (Service Worker, Installierbarkeit). Manifest mit `name`, `icons`, `start_url`, `display`. Chrome und Edge installieren PWAs unter Windows, Linux, macOS. Firefox und Safari installieren auf dem Desktop keine PWAs (Safari unter macOS 14: „Zum Dock hinzufügen“). Offline-Betrieb braucht einen Service Worker.
- **Test-Orakel:** Die .scad-Datei dient als Referenz (gleiche Parameternamen, Maße und Volumen gegeneinander prüfen). Die Geometrie existiert dadurch zweimal (OpenSCAD und JS), das ist ein bewusster Preis.

### 7.2 Verworfene oder zurückgestellte Alternativen

| Option | Warum nicht jetzt |
|---|---|
| OpenSCAD WASM | GPL (ganze App unter GPL), ca. 14 MB, kein STEP |
| OpenCascade.js / occt-wasm | ca. 4–9 MB, LGPL; erst bei STEP |
| brepkit / brepjs | Rust/WASM, STEP, für Gridfinity erprobt; ab 3.0.0 AGPL; Größe nicht dokumentiert |
| truck, SolidCraft-Kernel | Kernel im Umbau (solidcore in Prüfung, noch nicht nutzbar) |
| SolidCraft-Plugins | WASM-Plugins mit `run(command, args)`, laut Design-Dokument sandboxed; one-shot zuerst, parametrisch später; UI pro Plugin erst später; nur ausgereift sinnvoll |
| Electron | Chromium eingebaut, Installer rund 60–290 MB; später möglich |
| Tauri 2 | klein (Rust), braucht Rust-Toolchain; Rust-Thema in eigenem Chat |
| Neutralinojs | klein, ohne Rust; System-WebView-Eigenheiten |

### 7.3 Schrift für die Oberfläche (vorläufig entschieden)

- **Entscheidung (Nutzer, 2. November 2026):** Vorerst bleiben die bereits gewählten Schriften. In der App gilt **Inter** für Text und **IBM Plex Mono** für Zahlen, bis der Nutzer etwas anderes sagt. IBM Plex Sans (SemiBold) bleibt nur eine Auswahlmöglichkeit für den Deckeltext im Script. Später änderbar. Die Shortlist unten ist zurückgestellt und bleibt eine Option.

- **Früheres Ziel (zurückgestellt):** nicht Inter und nicht IBM Plex (zu verbreitet). Laut Quellen ist Inter die am häufigsten genannte Web-Schrift in Design-Systemen (36 von 488 geprüften Systemen). Nutzungszahlen der Alternativen wurden nicht gefunden.
- **Shortlist** (alle SIL Open Font License, variabel):
  - Hanken Grotesk: README nennt `tnum`, `lnum`, `case`; Weight 100–900; steigt in Beliebtheitslisten gerade.
  - Schibsted Grotesk: neo-grotesk, für Oberflächen gebaut; `tnum` nicht gefunden.
  - Golos UI (ParaType): Uniwidth-Gewichte (Zeilen springen beim Gewichtswechsel nicht); `tnum` nicht gefunden.
  - Weitere: Instrument Sans, Host Grotesk, Ubuntu Sans.
  - Mono (optional): Red Hat Mono, Reddit Sans Mono (beide OFL).
- **Prüfen** an den echten Dateien: tabellarische Ziffern (`font-variant-numeric: tabular-nums`, nur wenn die Schrift `tnum` mitbringt), die Zeichen Ø, ×, °, −, Gewichte. Testtexte: `41,5 × 41,5 × 7,0 mm`, `6,5Ø`, `45°`, `−0,25`, jeweils mit und ohne `tabular-nums`.
- **Lokal einbinden**, kein Google-CDN: Das LG München I hat am 20.01.2022 (3 O 17493/20) die dynamische Einbindung von Google Fonts ohne Einwilligung für rechtswidrig erklärt (100 € Schadensersatz). Lokal gehostete Schriften sind davon nicht betroffen. Keine Rechtsberatung. Passt zur PWA (offline).
- **Deckeltext-Schrift** getrennt entscheiden: Auf MakerWorld sind laut Community-Post die meisten Google Fonts installiert (Liste „Font Index“ in der inoffiziellen PMM-Doku). Eine Google-Font-Schrift wählen, damit .scad und Web-App übereinstimmen. Für den Druck dicke Gewichte (Hanken Grotesk bis 900, Golos Text bis Black).

## 8. Wettbewerb und Abgrenzung

- **gridfinitygenerator.com** (Marcus Svensson): Box, Baseplate, Cutout (STL-Import), Collection; STL und STEP; freie Wände, Ledges, Scoops; Eckmagnete/-schrauben; verbindbare Baseplates; Konto mit Bibliothek. Nicht erwähnt: Deckel, Text/Embossing, Farbe/3MF, Fächer automatisch, Wandmuster, Halbraster.
- **gridfinitylayouttool.com** (Andy Aragon): Bin- und Baseplate-Generator mit Layout-Planer, STL/STEP/3MF mit Farbe, Fächer, Wandausschnitte, Label-Tabs, Bodeneinsätze, Pen-Tool, Randpolster, Bett-Splitting; läuft laut brepkit-README mit brepkit.
- **Gridfinity Extended (OpenSCAD):** Schiebedeckel mit vielen Parametern, Item-Holder, Tray (Mittenmagnet unter dem Tray), Wandmuster, Fingerrutsche, Holzschraube in der Mitte.
- **gridfinity-rebuilt-openscad (MIT):** Standard-Bins, Lip-Stile, Fit-to-Drawer.
- **Perplexing Labs:** Deckel, Lip-Stile, M3, Thumbscrew, Vase-Bins.
- **Mögliche Abgrenzung:** Fuß-Deckel mit SVG/Text/Farbe, Hohlfuß, stapelbar mit Eck-Lip, Mittenmagnet, Schiebedeckel mit Beschriftung, Füller für freien Platz. Zusätzliche Wünsche: Array und Alignment für Cutouts, Holzschrauben-Senkung, Booleans außen am Objekt.

## 9. Offene Entscheidungen

1. Erledigt (2. November 2026): Die Werte aus Abschnitt 4 (Hohlfuß-Wand, Eck-Lip-Länge, Prägetiefe, Spiel, Mittenmagnet) gelten als Standard.
2. Erledigt (2. November 2026): Plattendicke Standard und Minimum laut Spec, nur größer änderbar.
3. Erledigt (2. November 2026): Der Bin-Umfang ist durch das Raster vorgegeben (Abschnitt 3.2); keine Fächer, kein Scoop, kein Label-Tab.
4. Erledigt (2. November 2026): Füller = Fit-to-Drawer wie im Script (Schubladenbreite und -länge, Rest massiv aufgefüllt); später Schubladenhöhe, die die Höhe von Bins und Deckeln sperrt (Abschnitt 3.2).
5. Erledigt (2. November 2026): Der Mittenmagnet sitzt nur in den Füßen (Bins) und in der Baseplate, nicht im Deckel (Abschnitt 3.1). Baseplate: Nabe auf vier Rippen. Bin-Fuß: keine Rippen, nur ein 1,2 mm breiter Rand um die Tasche.
6. **UI-Schrift:** Vorerst Inter für Text und IBM Plex Mono für Zahlen (Entscheidung vom 2. November 2026, später änderbar). Die Shortlist in Abschnitt 7.3 ist zurückgestellt.
7. Eigene Lizenz des Projekts: ~~offen~~ entschieden, CC BY-NC-SA 4.0 (2. November 2026, Abschnitt 5). Offen bleiben Ausgabedateien, Beiträge Dritter und der Zeitpunkt der `LICENSE`-Datei.
8. Wann Prompt für Claude Code (Web-App): Nutzer sagt Bescheid.
9. Phase E (Abschnitt 3.3) startet erst nach Deploy und Veröffentlichung; der Nutzer sagt Bescheid.
10. **Export des Schubladen-Planers:** 3MF als geplante Schublade (alle Teile an ihrem Platz) oder Teile für den Druck auf dem Bett angeordnet? Enthält der Plan die Baseplate? Entscheidet der Nutzer.
11. **Text an Bin-Wänden:** Welche Wände (alle vier, nur vorne, je Wand), Position und Ausrichtung, Standard und Grenze der Gravurtiefe, gemeinsame Texteinstellungen mit dem Deckel-Label. Entscheidet der Nutzer.
12. **Werte der Druckknopf-Verbinder:** Zapfendurchmesser und -höhe, Buchsentiefe, Standard und Grenzen des Spiels. Der Nutzer entscheidet nach Testdrucken; bis dahin wird kein Wert erfunden.
13. **Farbe nach Höhe:** Entschieden (4. November 2026): Basis ist die Teilfarbe des Nutzers, die Bänder liegen von unten über die ganze Höhe, jedes mit eigener Höhe, das oberste nimmt den Rest. Offen: Hat das oberste Band eine eigene Farbwahl (Vorgabe: die Teilfarbe)? Höchstzahl der Bänder, Einrasten auf die Schichthöhe, Bänder für alle Teile oder je Teil (Platte, Lippe, Text). STL hat keine Farben und bleibt eine Datei. Entscheidet der Nutzer.
14. **Bin-Innenraum:** Eingabe der Fächer (Anzahl je Achse mit gleicher Teilung oder freie Wandpositionen), Mindest- und Standardwert für Dicke und Höhe der Trennwände, Größe der Schaufelrampe und welche Fächer sie bekommen, Größe und Winkel der Label-Fahne. Entscheidet der Nutzer; es wird kein Wert erfunden.
15. **Eigenes Druckbett:** nur quadratisch oder auch rechteckig, ob eine freigehaltene Ecke eingegeben werden kann, ob es auch die Bauhöhe festlegt. Entscheidet der Nutzer.

## 10. Arbeitsregeln für den KI-Assistenten (aus den Vorgaben des Nutzers)

- Korrekte, kohärente Aussagen. Kein Lob um des Lobes willen, kein Marketing.
- Fakten und Optionen liefern, keine Anweisungen vorgeben, die Entscheidung liegt beim Nutzer.
- Bei Wissenslücken selbst in Originalquellen nachsehen (offizielle Repos, Releases, Doku), nicht auf Aggregatorseiten verlassen. Ist die Quelle nicht erreichbar, offen sagen.
- **Code wird erst geschrieben, wenn der Nutzer es sagt.**
- Antworten kurz halten (Handy), Antwort zuerst.

## 10b. Hinweise zu Markdown-Dateien im Repo (Claude Code, laut Doku)

- `CLAUDE.md` wird zu Beginn jeder Sitzung geladen und kostet Tokens. Ziel: unter 200 Zeilen („Längere Dateien verbrauchen mehr Kontext und senken die Befolgung“).
- `@pfad/zur/datei`-Imports laden beim Start vollständig und **sparen keine Tokens**, sie ordnen nur (maximal 4–5 Hops tief; Imports in Code-Spans werden ignoriert).
- `CLAUDE.md` in Unterordnern lädt erst, wenn Claude Dateien in diesem Ordner liest.
- Pfadbezogene Regeln in `.claude/rules/` laden nur bei passenden Dateien. Mehrschrittige Abläufe gehören in Skills.
- Alle gefundenen `CLAUDE.md`-Dateien werden aneinandergehängt, nicht überschrieben. Widersprüche können dazu führen, dass Claude willkürlich eine Anweisung wählt.
- `/context` zeigt, welche Memory-Dateien tatsächlich geladen sind. Zusätzlich gibt es „Auto Memory“ (Claude schreibt eigene Notizen, die ersten 200 Zeilen bzw. 25 KB von `MEMORY.md` werden geladen).
- Praxis (keine Doku): Regeln und Befehle in `CLAUDE.md`, Spezifikation (diese Datei) und Entscheidungen getrennt halten, damit der Agent nur lädt, was er braucht.

## 11. Quellen (Auswahl)

- Gridfinity-Spezifikation (Printables): https://www.printables.com/model/417152-gridfinity-specification
- Lizenzwechsel, Hinweis auf Zacks Video: https://github.com/kennetek/gridfinity-rebuilt-openscad/issues/96
- Referenzzeichnungen (Stu142, 2023-11-10, CC BY-NC-SA 4.0): https://github.com/Stu142/Gridfinity-Documentation, Kopie in `reference/gridfinity-reference-drawings/`
- Gridfinity Design Reference v5 (willtree8, Draft/WIP): Bild vom Nutzer, liegt nicht im Repository; nicht mehr der Maßstab
- gridfinity-rebuilt-openscad (MIT): https://github.com/kennetek/gridfinity-rebuilt-openscad
- Gridfinity Extended Doku (Schiebedeckel): https://docs.ostat.com/docs/openscad/gridfinity-extended/cup-lid/
- MakerWorld, Customizer erstellen: https://makerworld.com/en/community/post/193546
- Inoffizielle PMM-Doku: https://nelsonjchen.github.io/unofficial-makerworld-parametric-model-maker-openscad-docs/
- PMM Multi-Color (V0.9.0): https://forum.bambulab.com/t/paramatric-model-maker-v0-9-0-support-multi-color-modeling/100160
- Manifold: https://manifoldcad.org/jsdocs/index.html, wasm 476 kB: https://app.unpkg.com/manifold-3d@3.2.1/files/manifold.wasm
- Gridfinity auf Manifold (Beispielprojekt): https://www.mintlify.com/tunelko/gridfinity-BambuLab-3D/development/technology-stack
- opentype.js: https://github.com/opentypejs/opentype.js
- brepkit: https://github.com/andymai/brepkit
- gridfinitygenerator.com: https://gridfinitygenerator.com/en/changelog
- gridfinitylayouttool.com: https://gridfinitylayouttool.com/gridfinity-generator
- SolidCraft Plugin-Design: plugins.md im Repository (vom Nutzer bereitgestellt), Release-Notes: https://github.com/tangency-labs/solidcraft/releases
- web.dev, Datei speichern: https://web.dev/articles/files/save-a-file
- MDN, PWAs installierbar machen: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- Claude Code Memory (CLAUDE.md, Imports, Rules): https://code.claude.com/docs/en/memory
- Hanken Grotesk: https://github.com/marcologous/hanken-grotesk
- Golos UI/Text: https://pimpmytype.com/font/golos/
- Schriften in Design-Systemen (Inter-Anteil): https://www.lazyweb.com/research/most-common-primary-font-in-design-systems.md
- LG München I zu Google Fonts (Uni Regensburg): https://www.uni-regensburg.de/universitaet/aktuelles/nachrichten/nachricht/04-04-2022_dynamische-einbindung-von-google-fonts-ohne-einwilligung-verstoesst-gegen-dsgvo
- CSS `font-variant-numeric`: https://tailwindcss.com/docs/font-variant-numeric
