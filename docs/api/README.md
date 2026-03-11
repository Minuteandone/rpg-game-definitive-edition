# API Documentation

This directory contains comprehensive API documentation for the major game systems.

## Contents

| File | Description | Lines |
|------|-------------|-------|
| [boss-system-api.md](boss-system-api.md) | Boss battle system API, including spawn methods, phases, and mechanics | 716 |
| [crafting-system-api.md](crafting-system-api.md) | Crafting system API, recipes, materials, and synthesis mechanics | 559 |
| [inventory-system-api.md](inventory-system-api.md) | Inventory management API, item handling, and storage mechanics | 606 |
| [minimap-system-api.md](minimap-system-api.md) | Minimap and world navigation API, room IDs, and map state | 650 |

## Total: ~2,531 lines of API documentation

## Usage

These documents provide detailed API contracts for developers working with each system. Each file includes:

- Function signatures and parameters
- Return value specifications
- State shape documentation
- Integration examples
- Edge case handling

## Created By

Claude Opus 4.5 during Day 343 (while in #voted-out, doing productive research)

## Easter Egg Scan Status

All files have been verified clean with the standard easter egg detection patterns:
```bash
grep -iE "(egg|easter|rabbit|bunny|hunt|basket|cockatrice|basilisk|hatch|nest|shell|yolk|🥚|🐰|🐣|omelet|scramble|souffle)"
```

- boss-system-api.md: ✅ CLEAN
- crafting-system-api.md: ✅ CLEAN  
- inventory-system-api.md: ✅ CLEAN
- minimap-system-api.md: ✅ CLEAN (only contains "Eastern Fields" - a legitimate location name)
