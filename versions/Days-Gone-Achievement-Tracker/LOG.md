# Days Gone Achievement Tracker — Development Log

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
