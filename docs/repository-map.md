# Repository map

[Home](../README.md) · [Development](development.md) · [Delivery scope](implementation.md)

## Root layout

Only three top-level folders are used: `web/` for the complete application, `docs/` for documentation and references, and `.github/` for repository automation. Root `package.json` forwards familiar npm commands into `web/`. Framework configuration and the application lockfile stay inside `web/`.

All application paths in the tables below are relative to `web/`; `.github/` remains relative to the repository root.

## Business code

| Location | Responsibility |
| --- | --- |
| `app/page.tsx` | All dashboard sections, sample residents, menus, plan workflow, purchasing, CSV generation and dialogs |
| `app/globals.css` | Dashboard appearance, responsive and print styling |
| `app/layout.tsx` | Root document layout and metadata |
| `components/ui/` | Shared UI primitives, including starter components |
| `hooks/use-mobile.ts` | Shared mobile viewport hook |
| `lib/utils.ts` | Shared utility functions |
| `public/` | Static assets |

Resident Profiles, Dining Plans and Purchasing are conditional views inside `app/page.tsx`, rather than separate routes. State currently lives in React hooks in that page. Start there for business behavior; start in `app/globals.css` for appearance.

## Optional infrastructure

| Location | Responsibility | Current role |
| --- | --- | --- |
| `app/chatgpt-auth.ts` | Platform authentication helpers | Available for future integration |
| `db/index.ts` | Worker D1 binding and Drizzle access | Starter infrastructure |
| `db/schema.ts` | Database schema | Empty starter schema |
| `drizzle/` | Migration metadata | Scaffolding, not persisted care data |
| `examples/d1/` | Example API and schema | Reference code outside active routes |
| `cloudflare-env.d.ts` | Worker binding types | Type declarations |

These files do not mean the dashboard has an integrated backend. Read [delivery scope](implementation.md) for actual behavior.

## Tooling

| Location | Responsibility |
| --- | --- |
| `vite.config.ts` | Vinext, Sites plugin and local Cloudflare bindings |
| `build/sites-vite-plugin.ts` | Maintained build integration source; retain this directory |
| `scripts/run-framework.mjs` | Development/build runner for the selected execution profile |
| `scripts/execution-profile.mjs` | Checkout-local runtime profile |
| `scripts/install-*`, `scripts/pnpm-install.mjs` | Dependency installation helpers |
| `scripts/sites-env.*` | Local tool environment and state locations |
| `scripts/build-verified.sh` | Managed Linux build wrapper |
| `scripts/check-english.mjs` | Tracked-content language audit |
| `.github/workflows/english-content.yml` | Automated English-content check |
| `package.json`, `package-lock.json` | Commands, dependencies and locked versions |
| `tsconfig.json`, `eslint.config.mjs` | TypeScript and lint configuration |
| `components.json`, `postcss.config.mjs` | UI and CSS tooling |
| `next.config.ts` | Framework configuration |
| `drizzle.config.ts` | Optional migration generator |
| `vendor/` | Vendored stylesheet and license |

## Documentation and references

- [Development](development.md): setup, commands and smoke checks.
- [Runtime reference](runtime.md): inherited hosting and runtime instructions.
- [Delivery scope](implementation.md): implemented features and explicit limitations.
- [Architecture](references/architecture.md): intended production system.
- [HTML prototype](references/prototype.html): visual reference.

Read delivery scope before architecture, which includes capabilities the demo has not implemented. Generated dependency and runtime directories are not application source.

## Next refactoring priorities

These are future steps, not changes included in this documentation cleanup.

1. Extract sample residents, meals and ingredients into a demo-data module.
2. Extract resident, plan, purchasing and activity views into feature components.
3. Extract pure serving-count, purchasing and CSV functions for independent verification.
4. Introduce persistence and server-side workflow rules with explicit schema and migration review.
5. Review starter components and examples for removal only after checking imports and requirements.

Keep framework configuration at the application root (`web/`) and preserve build plugin source and licenses.
