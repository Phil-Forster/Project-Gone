# Days Gone Achievement Tracker

### v1.0.0 — game-native interface redesign

- Rebuilt the application hierarchy around a Days Gone drifter/road-ledger language rather than generic dashboard cards.
- Added the **Drifter Achievement Ledger**, Oregon road instrumentation, motorcycle-gauge completion display and road-record telemetry.
- Reframed the achievement list as an **Achievement road ledger** with game-specific Steam record, odometer/counter, selected-save road evidence and road-note terminology.
- Preserved the ten-scene full-bleed Days Gone artwork pool, bespoke Project Gone installer/uninstaller and universal footer with the GitHub slot reserved for the future repository.

### v0.3.1 — NSIS compile correction

- Corrected malformed multiline text in the bespoke installer and uninstaller completion pages.
- Installer preflight now rejects unterminated `NSD_CreateLabel` strings before Electron Builder runs.

### v0.3.0 — Project Drive parity pass

- Bespoke Project Gone installer/uninstaller using the validated Project Drive assisted-install journey.
- Days Gone-specific installer header/sidebar artwork and Project Gone application header treatment.
- Ten full-bleed, game-specific achievement scenes with deterministic preloading/assignment.
- Universal footer reserves the GitHub slot as **Repository pending** until a verified Project Gone repository exists.
- Footer retains **SPOILERS CONTAINED**, dynamic version/year, author and portfolio information.
- Installer preflight runs automatically before Windows packaging.

A read-only Windows desktop tracker for all **67 Days Gone Steam achievements**, including **22 exact Steam counters** and optional evidence from a selected Days Gone save.

Current build: **v1.0.0 — game-native interface redesign**.


## Spoiler notice

Achievement names, requirements and in-app guidance may reveal story details, locations, enemies or progression. Use the tracker at your own discretion if you want to avoid spoilers.

## What it reads

- Steam App ID `1259420`.
- Locked/unlocked state and unlock timestamps from the logged-in Steam client's local UserStats API.
- Numeric progress from the matching `DG1_STAT_n` value in Steam.
- Achievement names, descriptions, hidden flags and thresholds from Days Gone's local Steam schema.
- Steam Community pages only as a privacy-dependent fallback.
- Automatically discovered or manually chosen Days Gone `.sav` files as optional supporting context.
- The 66-record internal trophy table in `profile.sav`, including its current values, targets and completion flags.

Steam is always the primary achievement authority. Save data is shown separately and never replaces Steam state. The app does not edit Days Gone saves, game files, Steam statistics or achievement state, and a save file is not required.

## Requirements

- Windows 10 or 11 x64.
- Days Gone installed through Steam.
- Steam running and signed in.
- For source/development use: Node.js and npm.

## Start from source

Double-click `START-WINDOWS.bat`. On first run it installs the pinned project dependencies, then launches through `START-WINDOWS.vbs` without leaving a console window open.

You can also run:

```text
npm install
npm start
```

## Build the Windows installer

Double-click `BUILD-WINDOWS.bat`. The script verifies the local runtime is not locked, installs the pinned builder if needed, builds the x64 NSIS installer and copies the result to:

```text
RELEASE\Days-Gone-Achievement-Tracker-Setup-v0.2.6.exe
```

The full source ZIP contains both BAT files, the silent VBS launcher, all source, tests, installer theme assets and build configuration. `node_modules`, `dist` and `RELEASE` are intentionally excluded.

## Discovery

The tracker resolves Steam from the Windows registry, reads `libraryfolders.vdf`, finds `appmanifest_1259420.acf`, and locates Days Gone's own `steam_api64.dll`. The local schema is read from Steam's `appcache\stats\UserGameStatsSchema_1259420.bin`.

Save discovery is independent of the Steam/game drive. It searches `%LOCALAPPDATA%\BendGame\Saved`, including Steam-ID profile folders, and also accepts a manually chosen folder. The default is **Steam only**.

Steam playtime is read locally for the signed-in account from Steam's own `localconfig.vdf` and displayed independently of save evidence.

For an unusual installation, set `DAYS_GONE_GAME_PATH` to the Days Gone install directory before launch.

## Counter integrity

The tracker does not guess by nearby strings or broad keywords. Each cumulative achievement is connected to the exact Steam statistic stored in its schema progress block—for example `DG1_ACH_26` uses `DG1_STAT_26` for **You've Got Red on You**. If an exact counter is unavailable, the app leaves the number unavailable while retaining Steam's locked/unlocked state.

## Visual identity

The application, splash, icons and assisted installer use an original charcoal/asphalt, weathered-pine and rust-orange road theme. The main background is an optimised original 1672×941 WebP road-and-motorcycle scene. Six predecoded, full-width card landscapes rotate through road, mountain, lookout, camp, tunnel and mill environments. The images cover the complete surplus panel beneath controlled dark gradients. The artwork does not include copied game logos or official key art.

### Shared tracker footer

The application uses the universal achievement-tracker footer structure while presenting this tracker as **Project Gone**. It includes the persistent spoiler warning, Phil Forster attribution, portfolio link, automatic copyright year and the running Electron package version. The standard GitHub footer slot is present as **Repository pending** until a verified Project Gone repository is published; no URL is invented.

© 2026 Phil Forster · https://philforster.co.uk
