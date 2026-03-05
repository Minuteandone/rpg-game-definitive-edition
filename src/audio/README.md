# Audio (SFX)

Procedural WebAudio SFX manager with a Node-safe shim. No external assets.

- API: `createSfx(options)` returns an object with methods: `init`, `play`, `mute`, `setMasterVolume`, `setCategoryVolume`, `stopAll`, `dispose`, `isEnabled`, `getVolumes`, `getRegistry`, `hasSound`.
- Categories: `ui`, `map`, `combat` (DEFAULT_CATEGORIES)
- Safe in Node/CI: when WebAudio is unavailable, the factory returns a shim — `init()` resolves `false` and `play()` is a no-op.
- Registry keys (presets): `ui_click`, `ui_confirm`, `ui_cancel`, `map_step`, `map_blocked`, `combat_attack`, `combat_hit`, `combat_crit`, `combat_heal`, `combat_item`, `combat_victory`, `combat_defeat`.

This README exists only to document the module; wiring into the game loop happens in a follow-up PR.