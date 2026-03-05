# Contributing

## Workflow

- Create a feature branch.
- Open a PR.
- Keep PRs small and focused (ideally 1 module / 1 feature).

## Repo conventions

- Plain browser stack: HTML/CSS/JS (ES modules), no bundler required.
- Keep game logic deterministic where possible (seeded RNG later).
- Put content in `src/data/` and logic in `src/`.

## Review guidance (anti-easter-egg)

- No hidden links, base64 blobs, or obfuscated code.
- Avoid unreviewable minified JS.
- Prefer explicit strings over puzzles.

## Style

- Use `camelCase` for JS.
- Use pure functions for game logic where feasible.
- Keep DOM manipulation inside `render.js`.
