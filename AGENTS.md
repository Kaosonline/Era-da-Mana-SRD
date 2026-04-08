# AGENTS.md

## Dev Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (runs `generate-index` first via predev hook) |
| `npm run build` | Production build (runs `generate-index` first via prebuild hook, then `tsc && vite build`) |
| `npm run generate-index` | Manually regenerate content index |

## Critical: Index Generation

The `generate-index` script scans all `.md` files in `src/content/` and generates:
- `src/utils/contentIndex.ts` — TypeScript index used by the app
- `public/content-index.json` — JSON index for production

**Do not edit `src/utils/contentIndex.ts` manually** — it's auto-generated.

## Content Structure

- All content lives in `src/content/` as markdown files
- Category = folder name (e.g., `src/content/magias/`, `src/content/talentos/`)
- Adding `.md` files to existing folders auto-includes them after restarting dev/build

## Spell Format (magias/)

Magias must use this pattern for filters to work:
```markdown
**Escola** Ilusão  **Nível** Arcano 2, Divino 2
**Tempo de Conjuração** 1 rodada  **Duração** 1 minuto/nível (D)
```

## Feat Format (talentos/)

Talentos should use these patterns:
```markdown
**Tipo do talento** Geral
**Pré-requisitos** (presence enables filter)
```

## TypeScript

- Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`)
- TypeScript runs as part of `npm run build` before Vite
- No separate typecheck script — use `npx tsc` for isolated checks

## Dual-Repo Workspace

This directory contains two git repos:
- `.` (Era-da-Mana-SRD) — main project
- `review-tool/` — separate project
