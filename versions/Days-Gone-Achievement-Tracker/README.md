# Days Gone Achievement Tracker

A read-only Windows desktop tracker for all **67 Days Gone Steam achievements**, including **22 exact cumulative counters**.

## What it reads

- Steam App ID `1259420`.
- Locked/unlocked state and unlock timestamps from the logged-in Steam client's local UserStats API.
- Numeric progress from the matching `DG1_STAT_n` value in Steam.
- Achievement names, descriptions, hidden flags and thresholds from Days Gone's local Steam schema.
- Steam Community pages only as a privacy-dependent fallback.

The app does not edit Days Gone saves, game files, Steam statistics or achievement state. A Days Gone save file is not required.

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
RELEASE\Days-Gone-Achievement-Tracker-Setup-v0.1.0.exe
```

The full source ZIP contains both BAT files, the silent VBS launcher, all source, tests, installer theme assets and build configuration. `node_modules`, `dist` and `RELEASE` are intentionally excluded.

## Discovery

The tracker resolves Steam from the Windows registry, reads `libraryfolders.vdf`, finds `appmanifest_1259420.acf`, and locates Days Gone's own `steam_api64.dll`. The local schema is read from Steam's `appcache\stats\UserGameStatsSchema_1259420.bin`.

For an unusual installation, set `DAYS_GONE_GAME_PATH` to the Days Gone install directory before launch.

## Counter integrity

The tracker does not guess by nearby strings or broad keywords. Each cumulative achievement is connected to the exact Steam statistic stored in its schema progress block—for example `DG1_ACH_26` uses `DG1_STAT_26` for **You've Got Red on You**. If an exact counter is unavailable, the app leaves the number unavailable while retaining Steam's locked/unlocked state.

## Visual identity

The application, splash, icons and assisted installer use an original charcoal/asphalt, weathered-pine and rust-orange road theme. The artwork is original and does not include copied game logos or official key art.

© 2026 Phil Forster · https://philforster.co.uk
