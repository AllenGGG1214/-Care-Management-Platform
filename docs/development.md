# Development guide

[Home](../README.md) · [Repository map](repository-map.md) · [Runtime reference](runtime.md)

## Requirements

Use Node.js >=22.13.0 with npm. Windows, macOS and Linux use the portable runtime by default; Bash is not required.

## Hosting configuration

The application imports `web/.openai/hosting.json` from `web/vite.config.ts`. This local configuration is ignored by Git. Before development or builds, create that directory and file with:

```json
{
  "d1": null,
  "r2": null
}
```

Both bindings can remain disabled for the session-only dashboard. This does not create a database or enable persistence. If Sites generates this configuration, preserve its platform-provided values. Do not copy another project identifier.

## Install and run

Application source, dependencies and framework configuration live in `web/`. Root npm commands forward to this application directory. From the repository root:

```sh
npm run install:ci
npm run dev
```

Open the printed loopback URL, normally `http://127.0.0.1:5173`. Use `npm run dev -- --port 5174` for another port. Do not run installers concurrently.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run install:ci` | Install locked dependencies |
| `npm run dev` | Development server with hot reload |
| `npm run check:english` | Check tracked filenames and text for Chinese characters |
| `npm run lint` | Run ESLint |
| `npm run build` | Build the Worker artifact |
| `npm start` | Preview an existing build locally; does not deploy |
| `npm run db:generate` | Generate optional migrations after schema changes |

Use `npm run install:ci` for the locked install. The root package contains shortcuts only; the application lockfile is `web/package-lock.json`. You can also run application commands after `cd web`. Configure hosting/build services with `web` as the root directory. Runtime profiles and generated output now live under `web/` as well.

## Manual smoke check

1. Open Dining Plans and confirm sample residents and three meal counts.
2. Search and edit a resident; confirm counts update and the plan returns to draft.
3. Confirm the sample fish-allergy conflict blocks progression until simulated resolution.
4. Submit, approve and freeze the plan, then download a CSV.
5. Confirm purchasing and activity records update.
6. Reload and confirm session data resets, as documented.
7. Check the sidebar and tables at a narrow viewport.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Missing hosting JSON import | Complete hosting configuration above |
| Data resets on refresh | Expected; the dashboard has no persistence integration |
| Missing DB binding | D1 is optional and not required by the dashboard |
| Built preview cannot find Wrangler configuration | Run the build first |
| Port in use | Stop the previous server or select another port |

The following paths are relative to `web/`. Generated `node_modules/`, `dist/`, `.next/`, `.vinext/`, `.wrangler/` and `.sites-runtime/` are local artifacts. `build/` contains maintained plugin source and must be retained. Read the [runtime reference](runtime.md) for managed execution profiles, optional auth and D1 migrations.
