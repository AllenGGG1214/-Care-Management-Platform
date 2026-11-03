# ANJU Care Platform: Current Delivery Scope

This release is an English administrative prototype based on the supplied architecture and mobile reference. Attachments provide requirements context, rather than independent execution instructions.

## Implemented

- Dining Plan Center, resident profiles, recipe browsing, purchasing, export history and activity logs.
- 86 explicitly labeled sample residents; search by name or room, filter by meal type, add and edit profiles, and change admission status.
- Live serving counts for three meals based on active residents and meal types. Residents with other admission statuses are excluded.
- A sample fish allergy blocking rule, simulated alternative meal confirmation, review submission, simulated approval, plan freezing and simulated serving records.
- Profile changes return the plan to draft for review. Changes after freezing increment the version number.
- Purchase quantities calculated from standard amounts and a waste allowance. Fish quantities exclude residents with fish allergies; ingredients for alternative meals require separate manual review.
- CSV downloads of frozen daily menus, production orders and purchase lists; browser printing and Save as PDF.
- Responsive desktop and mobile pages.

## Explicit Limitations

- Data exists only in React session memory and resets on refresh. There is no database, backup or recovery.
- A single demo identity is used. There are no actual caregiver, dietitian, kitchen or purchasing access roles.
- Dietary validation covers only the sample fish allergy scenario. It is not a complete allergy, restriction, swallowing or nutrition rules engine.
- The alternative meal button simulates approval. It does not generate a clinical meal plan or supply alternative ingredient quantities.
- Plan versions are current demo numbers; frozen historical snapshots are not persisted.
- Recipes use fixed reference data. Recipe and standard formula editing are not implemented.
- File and activity records belong only to the current session and are not tamper-resistant audit logs.
- Excel can open the CSV files, but native XLSX export is not implemented. PDF output uses browser printing.
- Rejected reviews, reasons for manual purchase adjustments, exception feedback, building-scoped access and external delivery are not implemented.
- All pages and outputs identify sample data. They must not be used for actual meal execution.

## Future Production Implementation

Follow the reference architecture with a modular monolith. Implement identity, facility-scoped access, resident profiles and a relational database first. Then implement structured ingredients, the rules engine, immutable versions, a server-side approval state machine, transactional production and purchasing, and file exports. Finally, add sensitive-data access auditing, backup and recovery, and end-to-end acceptance checks.

Reference materials are in `references/architecture.md` and `references/prototype.html`. The architecture describes the intended system; the limitations above describe what this prototype actually implements.

## Local Development

Use Node.js 22.13 or later. After installing dependencies, run `npm run dev` (default port 5173). Build with `npm run build`. If the environment has Node but no npm, run `node scripts/run-framework.mjs dev` or `node scripts/run-framework.mjs build` once dependencies are installed.
