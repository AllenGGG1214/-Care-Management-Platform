# ANJU Care Platform

An English-language care-home operations prototype built with React, TypeScript, Tailwind CSS and Vinext. It demonstrates resident profiles, daily meal planning, kitchen production and purchasing.

**Current status:** browser-session demo with 86 sample residents. Refreshing resets data. Database helpers and authentication utilities are starter infrastructure; the current dashboard does not integrate persistence or role enforcement.

## Start here

| Your goal | Read |
| --- | --- |
| Run the demo | [Development guide](docs/development.md) |
| Find the right source file | [Repository map](docs/repository-map.md) |
| Understand delivered features and limits | [Delivery scope](docs/implementation.md) |
| Understand the intended production system | [Architecture reference](docs/references/architecture.md) |
| Inspect the original visual reference | [HTML prototype](docs/references/prototype.html) |
| Configure hosting, authentication or optional D1 | [Runtime reference](docs/runtime.md) |

## Quick start

Use Node.js **22.13.0 or later**, with npm installed.

1. Clone the repository and enter its directory.
2. Create the missing local hosting configuration described in [Development setup](docs/development.md#hosting-configuration).
3. Install and start:

```sh
npm run install:ci
npm run dev
```

Open the loopback URL printed by the server, normally port 5173.

## Demo workflow

1. Review resident profiles and meal types.
2. Open Dining Plans and resolve the sample fish-allergy conflict.
3. Submit the plan, simulate approval and freeze its version.
4. Review production and purchasing quantities.
5. Download CSV files or print the page.

Profile changes return the plan to draft. Approvals and dietary checks are demonstrations; see [the full limitations](docs/implementation.md#explicit-limitations).

## Repository at a glance

```text
web/             Complete application: source, assets, dependencies and tooling
docs/            Guides, delivery scope and original references
.github/         Automated repository checks
README.md        Project entry point
package.json     Root command shortcuts (application dependencies live in web/)
.gitignore       Local files excluded from Git
```

The dashboard sections currently live together in `web/app/page.tsx`. Start there for business behavior and in `web/app/globals.css` for appearance. [The repository map](docs/repository-map.md) explains each area and the next refactoring steps.

All application configuration stays together inside `web/`. Root npm commands forward to that directory; use `npm run install:ci` for the locked application install, rather than `npm ci` at the repository root. Configure deployment services to use **web** as their project/root directory.

## Checks

```sh
npm run check:english
npm run lint
npm run build
```

The English-content check scans tracked filenames and text, including escaped Unicode. Keep repository documentation and source in English. User-entered content follows its own input and locale settings. Detailed framework instructions are preserved in the [runtime reference](docs/runtime.md).
