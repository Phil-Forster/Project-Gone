# Days Gone Achievement Tracker — Development Log

## v1.0.0 — 03/09/2026

- Promoted Project Gone to the first full release and rebuilt the visible application around a Days Gone-specific drifter/road-ledger identity.
- Added a Drifter Achievement Ledger header, Oregon road instrumentation, motorcycle-style completion gauge, road telemetry and Achievement road ledger catalogue.
- Reworded expanded achievement dossiers to use Steam record, odometer/counter progress, selected-save road evidence and road-note terminology while preserving all existing Steam/save logic.
- Kept the ten-image Days Gone full-bleed art rotation, bespoke Project Gone installer/uninstaller flow and universal footer with the future GitHub slot retained.
- No achievement authority, save-writing behaviour or Steam mapping was changed.

## v0.3.1 — 03/09/2026

- Fixed two malformed multiline NSIS label strings on the install-complete and uninstall-complete pages that caused `makensis` to report an unterminated string.
- Kept the bespoke Project Drive-spec installer journey and game-specific artwork unchanged.
- Extended installer preflight to fail immediately when an `NSD_CreateLabel` quoted string is split across physical source lines.

## v0.3.0 — 03/09/2026

- Rebuilt the Windows installer and uninstaller around the validated Project Drive assisted-installer journey, including bespoke palette-matched controls, completion pages, launch-after-finish choice and upgrade/reinstall settle handling.
- Added Days Gone / Project Gone installer header and sidebar artwork plus a Project Gone-specific application header treatment.
- Expanded full-bleed achievement artwork from six to ten game-specific scenes and kept deterministic preloading/assignment.
- Reserved the universal footer GitHub slot with a non-link **Repository pending** state until the Project Gone repository is published; no URL was invented.
- Kept **SPOILERS CONTAINED**, dynamic version/year metadata, Phil Forster attribution and the Project Gone footer identity.
- Added the installer preflight to `BUILD-WINDOWS.bat` so NSIS flow/compile-warning regressions are caught before Electron Builder runs.

## v0.2.7 — 03/09/2026

- Refined the universal footer presentation for **Project Gone** with a cleaner, simpler road emblem better suited to the Days Gone identity.
- Changed the persistent warning copy from **SPOILERS AHEAD** to **SPOILERS CONTAINED** to better match the footer context.
- Added the `spoiler-disclaimer` hook to the footer warning so the Guide can reliably target the persistent spoiler notice.
- Preserved automatic year/version handling, Project Gone identity, author attribution and the portfolio link while leaving repository links omitted unless a verified URL is available.

## v0.2.6 — 03/09/2026

- Replaced the legacy one-line copyright footer with the universal tracker footer using the **Project Gone** identity and game-specific accent/icon treatment.
- Moved the persistent spoiler warning into the footer so it remains visible without duplicating the same warning above the achievement filters.
- Added compact project identity, author and portfolio blocks; repository/home links remain omitted unless the project exposes a real URL.
- Footer copyright year is derived from the local system date and the displayed version is read from Electron `app.getVersion()` through the restricted preload bridge.
- Added responsive footer stacking and explicit high-contrast states for text, links, warning copy and focus indicators.

## v0.2.5 — 03/09/2026

- Reworked NSIS installer/uninstaller theming so every sibling and nested assisted-installer dialog is themed, not only the first page container.
- Added native control coverage for combo boxes, rich-edit variants, links, list/tree views and progress controls; content controls now detach stock light visual styling before palette application.
- Reduced installer recolour latency from 120 ms to 40 ms to minimise visible system-colour flashes during page changes.
- Added the shared Project Island spoiler notice to the main tracker and as the first Guide step.
- Bumped the Guide completion key so existing users see the new spoiler guidance once.

## v0.2.4 — Full-bleed card landscapes

- Replaced the lower-right transparent cutout treatment after visual testing showed the artwork looked detached from the card.
- Added six full-width 1400×788 road, mountain, lookout, camp, tunnel and lumber-mill landscapes.
- Changed card artwork to `cover` the complete unused panel beneath vertical and horizontal readability gradients.
- Kept deterministic assignment, image preloading and the splash decode handshake from v0.2.3.

## v0.2.3 — Card-art variation and splash preload

- Replaced the single repeated achievement-card road scene with six original, optimised Days Gone-themed environment overlays.
- Added stable per-achievement artwork assignment covering road, fire lookout, survivor camp, tunnel, lumber mill and rural chapel scenes.
- Preloaded and decoded all card artwork concurrently with the initial Steam dashboard request.
- Added an explicit renderer-to-main decode handshake so the splash is fully paintable before its window is shown.
- Retained a 1.5-second splash fail-safe so a damaged image can never block application startup.

## v0.2.2 — Local Steam playtime

- Added Steam playtime from the signed-in account's local Steam configuration.
- Kept playtime independent of optional save evidence and achievement counters.

## v0.2.1 — Guide spotlight correction

- Fixed the guide overlay tinting the highlighted point of interest.
- Moved visual page dimming to the active guide target so every highlighted control remains clear and fully readable, including targets inside nested stacking contexts.

## v0.2.0 — Steam-first source toolkit

- Kept Steam as the permanent primary authority while adding optional save context.
- Added portable Days Gone save discovery under `%LOCALAPPDATA%\BendGame\Saved`, including Steam-ID subfolders.
- Added a folder browser, save selector, Steam-only option and save-folder shortcut.
- Parsed the supplied/current `profile.sav` GVAS header and its 66-record internal trophy table read-only.
- Exposed each profile trophy's current value, target and completion flag as separate supporting evidence.
- Reworked every expanded achievement into Steam result, numeric progress, selected-save evidence, and requirements/guidance sections.
- Added category labels and explicit wording where Steam defines no numeric counter.
- Added an original full-window Oregon road-and-motorcycle background, optimised to a 48 KB WebP and layered beneath readability overlays.
- Preserved every existing Steam mapping and all 22 exact counters.

## v0.1.1 — Unreal Steamworks discovery fix

- Fixed `steam_api64.dll` discovery for Days Gone's deeper Unreal Engine runtime layout.
- Added direct probes for common versioned Steamworks folders.
- Increased the bounded recursive search from five to twelve directory levels.
- Added a regression test proving discovery works when the DLL is six levels below the game directory.

## v0.1.0 — Days Gone test case

- Forked from the confirmed-good SOTF Achievement Tracker v0.6.9 architecture.
- Changed Steam App ID from `1326470` to Days Gone App ID `1259420`.
- Removed the Sons of the Forest save dependency and save-folder watcher.
- Added Steam-account discovery through `loginusers.vdf`.
- Added all 67 current Days Gone achievement definitions from `UserGameStatsSchema_1259420.bin`.
- Added exact, schema-backed mapping for all 22 cumulative achievement counters.
- Preserved local Steam UserStats as the primary authority and Steam Community as fallback.
- Added Days Gone installation discovery through Steam registry, library VDF and app manifest data.
- Added a distinct charcoal/asphalt and rust-orange UI, original road-and-bike artwork, new app icon and matching installer assets.
- Retained `START-WINDOWS.bat`, `START-WINDOWS.vbs` and `BUILD-WINDOWS.bat`.
- Updated the product, executable, shortcut and installer artifact names for a separate application identity.
- Kept all operations read-only: no saves, game files, Steam stats or achievement state are modified.
