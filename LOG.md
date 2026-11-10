# 1.3.8 — 04/09/2026

- restored the heavier segmented lower road markers beneath the completion dial so Project Gone keeps the chunkier original gauge treatment
- retained the current footer and filter polish unchanged

# 1.3.7 — 04/09/2026

- removed the boxed active-state treatment from the achievement filters so only the underline denotes the live selection
- retained and carried forward the footer metadata alignment nudge, including the small extra inset on the portfolio item

# 1.3.6 — 04/09/2026

## Shared interface polish

- Rebuilt the universal footer metadata row with cleaner spacing, lighter typography and better-balanced column widths.
- Replaced the generic GitHub glyph with the GitHub mark and upgraded the Project, Author and Portfolio symbols.
- Ensured the full `philforster.co.uk` portfolio address remains visible at desktop footer widths.
- Removed hard-coded teal footer chrome and made borders/backgrounds derive from each tracker's own palette.
- Retained the project/game badge geometry unchanged in the footer.
- Reworked the All / Unlocked / Locked / Unknown controls into compact instrument-style filters with meaningful state icons and state-aware active accents.

# 1.3.4 — 04/09/2026

- Improved installer-to-application handoff: Finish now launches the tracker and keeps the bespoke installer visible until the application splash has actually appeared (with a bounded fail-safe), removing the previous dead pause.
- Replaced the temporary-uninstaller `cmd.exe` / loopback `ping` deletion delay with a detached, hidden PowerShell cleanup process so no terminal window flashes during uninstall.
- `RELEASE` remains intentionally clean: the current Setup executable only.
- Shared Bespoke Deployment Shell updated to v2.0.4.

# Days Gone Achievement Tracker — Development Log

## v1.3.3 — 04/09/2026

- Corrected the bespoke installer-shell version source after the three-stage Windows build produced a Setup executable with the previous deployment-UI package version in its filename.
- Synchronized the root package, `deployment-ui/project.json` and `deployment-ui/package.json` versions and made the installer artifact name resolve explicitly from the root package version.
- Advanced **Shared Bespoke Deployment Shell** to v2.0.3 and strengthened deployment preflight checks so version drift between the tracker, deployment project and deployment UI fails before packaging.
- Added deployment-shell package description/author metadata to remove the Electron Builder metadata warnings seen during Windows packaging.
- No visible installer/uninstaller design, per-user deployment behaviour, tracker UI or game-reading logic changed in this patch.
- Updated `README.md`, `LOG.md`, package versions and expected Setup filenames for this iteration.

## v1.3.2 — 04/09/2026

- Standardised the bespoke installer/uninstaller on a **current-user-only** deployment model across all four tracker projects.
- Changed the default installation root to `%LOCALAPPDATA%\Programs\Days Gone Achievement Tracker` and updated the visible scope label from **ALL USERS** to **CURRENT USER**.
- Removed the deployment shell's PowerShell/UAC elevation path; the silent NSIS worker now runs directly with `/currentuser` for both installation and removal.
- Changed Electron Builder's internal NSIS worker to `perMachine: false` and `allowElevation: false`, keeping desktop/Start Menu shortcuts and uninstall registration inside the current user's Windows profile.
- Restricted custom install locations to the current Windows user profile so selecting a protected machine-wide location cannot silently reintroduce an elevation requirement.
- Advanced **Shared Bespoke Deployment Shell** to v2.0.2; strengthened deployment preflight checks to reject all-users scope, elevation logic or an all-users UI label.
- Kept the approved bespoke visual design and state flow unchanged. Updated `README.md`, `LOG.md`, package version and deployment project version for this iteration.

## v1.3.1 — 04/09/2026

- Corrected the Windows deployment orchestrator after `spawnSync` returned `EINVAL` when attempting to execute Electron Builder's `.cmd` shim directly.
- The shared build now invokes `electron-builder/out/cli/cli.js` with the active Node executable, avoiding Windows batch-shim spawning entirely while preserving the same three-stage uninstaller → silent NSIS engine → installer-shell pipeline.
- Advanced **Shared Bespoke Deployment Shell** to v2.0.1 and propagated the identical orchestration correction across all four tracker projects.
- Strengthened `tools/deployment-preflight.js` to reject direct `electron-builder.cmd` / `.bin` shim execution and require the JavaScript CLI invocation contract.
- No visible installer/uninstaller design, tracker UI, Steam/save logic or deployment mechanics were changed in this patch.
- Updated `README.md`, `LOG.md`, package version and deployment project version for this iteration; Windows runtime validation remains the release gate.

## v1.3.0 — 04/09/2026

- Replaced the failed assisted-NSIS wizard skin with **Shared Bespoke Deployment Shell v2.0.0**.
- The visible installer/uninstaller is now a frameless Electron UI; NSIS is invoked only in silent mode as the deployment engine and can no longer leak wizard pages, white panels or native installer buttons into the normal journey.
- Added shared Ready → Installing → Complete/Error and Confirm uninstall → Removing → Complete/Error state flows, custom in-window folder selector with no native Windows browse dialog, custom controls, bespoke default-enabled **Launch Project Gone** checkbox, keyboard focus states and project-specific artwork/accent configuration.
- Added a three-stage Windows build: bespoke uninstaller shell → silent NSIS engine → bespoke Setup shell with the engine embedded as an internal resource.
- Redirected Add/Remove Programs and quiet-uninstall registration to the bespoke uninstaller shell; silent upgrade/removal requests are forwarded to the hidden raw NSIS uninstaller.
- Archived the previous `build/installer.nsh` / `build/installer/` assisted-wizard implementation under `build/legacy-assisted-installer/`; it is no longer referenced by the active build.
- Replaced the old installer preflight with `tools/deployment-preflight.js`, which verifies UI/engine separation and required shared assets before packaging.
- Extended deployment preflight coverage to reject native file/folder dialogs and require the bespoke directory browser bridge, keeping UAC/security prompts as the only Windows-owned visible surfaces.
- Updated `BUILD-WINDOWS.bat`, `README.md`, `LOG.md`, package version and project deployment configuration for this iteration.

## v1.2.5 — 04/09/2026

- Removed the dead installer-only `BSI_SkipDefaultFinish` function that Windows `makensis` reported as warning 6010; Electron Builder treats NSIS warnings as fatal during packaging.
- Confirmed against the exact Electron Builder 26.15.7 `assistedInstaller.nsh` contract that defining `customFinishPage` replaces the default installer Finish-page branch entirely, so no installer Finish-page pre-hook is required or valid.
- Advanced **Shared Bespoke Installer Framework** to v1.0.5 and propagated the identical correction across all four tracker projects.
- Strengthened `tools/installer-preflight.js` to forbid a phantom installer Finish-page pre-hook/function and to flag unreferenced shared `BSI_*` functions before Windows packaging where statically detectable.
- Kept the bespoke in-place completion state, default-enabled **Launch Project Gone** control, installer/uninstaller visuals, application UI and tracker logic unchanged.
- Updated `README.md`, `LOG.md` and package version for this iteration; Windows compile/runtime validation remains the release gate.

## v1.2.4 — 04/09/2026

- Corrected the shared launch-on-Finish architecture after Windows `makensis` showed that directly expanding `UAC_AsUser_ExecShell` inside the bespoke framework occurs before Electron Builder has made the UAC plugin available to that compile section.
- Advanced **Shared Bespoke Installer Framework** to v1.0.4 and removed plugin-dependent launch calls from the early shared function body that Electron Builder compiles before its broker plug-ins are available.
- Launch-on-Finish is now defined inside the late `customFinishPage` expansion, matching Electron Builder's own `StartApp` placement and using its supported `StdUtils.ExecShellAsUser` broker while the stock Finish page remains suppressed.
- Strengthened `tools/installer-preflight.js` to reject plugin-dependent launch calls in early Function bodies and require the late-bound launch-broker contract.
- No visible installer/uninstaller design, application UI, achievement logic, Steam/save handling or project-specific skin was changed in this patch.
- Updated `README.md`, `LOG.md` and package version for this iteration; Windows compilation/runtime validation remains the release gate.

## v1.2.3 — 04/09/2026

- Removed the shared framework dependency on `StdUtils::ExecShellAsUser` after the Windows Electron Builder NSIS bundle failed compilation because the `StdUtils` runtime plugin was not present.
- Advanced **Shared Bespoke Installer Framework** to v1.0.3 and switched Launch-on-Finish to the UAC plugin already used by Electron Builder's multi-user installer flow: elevated inner installs call `UAC_AsUser_ExecShell`, while non-elevated installs use normal `ExecShell`.
- Preserved the bespoke **Launch [Project Name]** toggle, checked by default, and the requirement that Finish launches the tracker at the interactive user's normal integrity level rather than elevated.
- Strengthened `tools/installer-preflight.js` to require the UAC launch-broker contract and reject any reintroduction of `StdUtils::ExecShellAsUser`.
- No visible installer/uninstaller design, application UI, achievement logic, Steam/save handling or project-specific skin was changed in this patch.
- Updated `README.md`, `LOG.md` and package version for this iteration; Windows compilation/runtime validation remains the release gate.

## v1.2.2 — 04/09/2026

- Removed two dead shared NSIS bitmap-handle variables (`BSI.ToggleOnBmp` and `BSI.ToggleOffBmp`) that triggered makensis warning 6001; Electron Builder treats NSIS warnings as fatal during packaging.
- Advanced **Shared Bespoke Installer Framework** to v1.0.2 and propagated the identical framework correction across all four tracker projects.
- Strengthened `tools/installer-preflight.js` to reject unused `BSI.*` NSIS variable declarations before Electron Builder starts, preventing the same warnings-as-errors build failure from reaching makensis.
- No visible installer/uninstaller design, application UI, achievement logic, Steam/save handling or project skin was changed in this patch.
- Updated `README.md`, `LOG.md` and package version for this iteration; Windows compile/runtime validation remains the release gate.

## v1.2.1 — 04/09/2026

- Corrected the shared `customUnInstallSection` compile contract after Windows `makensis` rejected the hidden finalisation section for calling `un.BSI_InstallCompleted` from a section that was not itself classified as uninstall code.
- Renamed the hidden post-removal finalisation section to an `un.*` section and marked it `SectionIn RO`, matching NSIS/Electron Builder uninstall-section requirements while preserving the synchronous Removing → Complete transition.
- Advanced **Shared Bespoke Installer Framework** from v1.0.0 to **v1.0.1** and propagated the identical framework fix across all four tracker projects.
- Strengthened `tools/installer-preflight.js` so a custom uninstall section now fails preflight unless it is an `un.*`, required, non-optional section; this exact compile failure can no longer pass the project preflight unnoticed.
- No application UI, Steam/save logic, achievement data or project-specific installer skin was changed in this patch.
- Updated `README.md`, `LOG.md` and package version for this iteration. Windows compilation/runtime verification remains the release gate.

## v1.2.0 — 04/09/2026

- Replaced the previous project-specific MUI/wizard skin with **Shared Bespoke Installer Framework v1.0.0**, reused verbatim across all four tracker projects.
- Reduced `build/installer.nsh` to a two-include entry point: project-specific configuration/assets plus the shared state/deployment framework.
- Rebuilt the visible installer as a persistent branded shell with Ready → Installing → Complete/Error states and no intentionally exposed standard Welcome, Directory or Finish wizard pages.
- Rebuilt the uninstaller on the same shared shell with Confirm uninstall → Removing → Complete/Error states.
- Added project-specific setup/removal shell artwork, accent configuration and copy for **Project Gone / Days Gone** while keeping common behaviour in one framework.
- Added the bespoke **Launch Project Gone** completion toggle, checked by default; Finish launches through the interactive user token when enabled and exits without launching when disabled.
- Kept NSIS/Electron Builder responsible for deployment mechanics only: elevation, payload extraction/removal, install scope/path, registry data, shortcuts, Add/Remove Programs registration and upgrade handling.
- Added shared installer preflight checks for architecture drift, forbidden native/wizard UI patterns, required assets/configuration and framework identity.
- Updated `README.md`, package version and installer documentation for this iteration. Final Windows NSIS compilation and visual/runtime verification remain Windows target checks.

## v1.1.1 — 04/09/2026

- Refined the motorcycle/road completion gauge so the 0–100 scale sits on a protected outer rail and no tick label is washed through by the live completion arc.
- Repositioned the road-meter detail to preserve the Days Gone instrumentation character without competing with completion text or scale marks.
- Kept Steam authority, achievement mappings, save parsing, splash, installer and uninstaller behaviour unchanged; installer presentation remains deliberately deferred.

## v1.1.0 — 04/09/2026

- Realigned Project Gone with the shared four-project tracker framework while preserving its Days Gone-specific drifter/road-ledger presentation.
- Applied the new Project Gone badge across footer, application/shortcut icon, installer icon and uninstaller icon surfaces.
- Aligned the installer and uninstaller to the shared polished branded progress experience, including game-specific artwork and the slim integrated progress treatment.
- Kept the established rust/red Project Gone identity and game-specific interface language intact.
- No Steam authority, achievement mapping, save parsing or write behaviour was changed.

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
