# Resident Profiles and Independent Dining Plans for Care Homes

## Architecture and Functional List

> Version: v1.0
>
> System purpose: an independent application that delivers standalone files. It does not depend on ERP or require an external purchasing integration. Business data is stored internally, and files can be delivered to kitchen and purchasing staff.
>
> Design status: a development baseline. Confirm the technology stack, hosting environment, compliance requirements and scale during technical review.

---

## 1. Business Goals and Boundaries

### 1.1 Business Goals

Use health and dietary information in resident profiles to generate, automatically or with staff assistance:

1. Breakfast, lunch and dinner menus for the next day.
2. Serving counts for regular, low-sodium, soft and other meal types.
3. Kitchen production plans.
4. Special meal and portioning instructions.
5. Ingredient purchase lists.
6. Standalone printable or downloadable files.
7. Records of reviews, delivery, changes and exception handling.

### 1.2 System Boundaries

**Included:** resident profiles; recipe and ingredient reference data; dietary rules and restriction checks; menu generation; dietitian review; kitchen production plans; purchase lists; file export; activity auditing; and data backup.

**Excluded:** ERP integration; automatic issuance of formal purchase orders; automatic supplier connections; automatic price comparison; automatic payments; and real-time synchronization with external inventory systems.

Import and export interfaces can be added later. Version one must not depend on an ERP or purchasing system.

---

## 2. Recommended Overall Architecture

### 2.1 Architecture Style

Use a **modular monolith with standalone file output**:

- One backend application hosts multiple business modules.
- Modules collaborate through explicit service interfaces.
- A shared database stores business data.
- A shared file service produces Excel, PDF and printable files.
- Keep version one in a single deployment to reduce development and operational complexity.
- Menu planning, purchasing and notifications can become separate services if future scale requires it.

### 2.2 Architecture Diagram

```text
Mobile app / Web administration
  Caregivers: update resident status and view tasks
  Dietitians: review menus and confirm special meals
  Kitchen supervisors: view production plans and record serving
  Purchasing staff: view purchase lists and update purchase status
  Care supervisors: release plans and resolve exceptions
                       |
                 HTTPS / JSON
                       v
API Router / BFF
  Login and token validation
  Role authorization
  Facility / building / room scope checks
  Request validation and consistent error handling
  Audit event entry point
                       |
                       v
Backend business modules
  Users and access: login, roles, scopes
  Resident profiles: health, diet, admission status
  Recipe reference data: dishes, ingredients, specifications
  Rules and validation: allergies, restrictions, meal types
                       |
                       v
  Menu plans: generate, split, review and release
                       |
          +------------+-------------+
          v                          v
  Kitchen production          Purchase plans
  Orders, special meals,      Quantity conversion,
  serving records             lists and exports
          +------------+-------------+
                       v
  File export: Excel, PDF, print sheets
  Notifications and exceptions: pending reviews, conflicts, shortages
  Audit and backup: logs, backups, restore
                       |
                       v
Data layer
  Relational database:
    Users, roles, resident profiles
    Recipes, ingredients, rules and meal plans
    Production plans, purchase lists and approval states
  File storage:
    Exported menus, production orders and purchase lists
    Avatars, attachments and review attachments
  Audit logs:
    Views, changes, reviews, release, export and exception handling
                       |
          Standalone file delivery boundary
                       v
Kitchen / Purchasing recipients
  Download files
  Print files
  Staff deliver files through internal organizational channels
```

---

## 3. Core Business Workflows

### 3.1 Next-Day Menu and Purchasing

```text
Day T-1: caregivers update resident status
    -> Read active resident profiles
    -> Read recipes, ingredients and dietary rules
    -> Generate candidate breakfast, lunch and dinner menus
    -> Count servings by regular, low-sodium, soft and other meal types
    -> Validate allergies, restrictions, swallowing needs and status
    -> Conflict?
         Yes: flag exception, block release and notify dietitian
         No: continue
    -> Dietitian reviews and adjusts
    -> Freeze menu version
    -> Generate kitchen production plan
    -> Generate purchase list from menu and serving counts
    -> Authorized staff confirm
    -> Export menu, production orders and purchase list
    -> Kitchen and purchasing staff receive files and execute manually
    -> Record actual serving, purchasing and exception outcomes
```

### 3.2 Temporary Changes

Applies to new admissions, leave, discharge, temporary fasting and changes to dietary requirements:

1. Authorized staff update admission status or dietary requirements.
2. Determine whether the current plan has been released.
3. Before release, recalculate serving counts and the purchase list directly.
4. After release, create a change version.
5. Repeat allergy and restriction checks.
6. Notify the dietitian and kitchen supervisor.
7. After confirmation, export the change document.
8. Retain the original version; do not overwrite it without a trace.

---

## 4. Backend Module Design

### 4.1 Users and Access

**Responsibilities:** sign-in and sign-out, identity management, roles, facility/building/room scopes, page and endpoint authorization, and prevention of unauthorized access to sensitive health and dietary information.

**Primary endpoints:**

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/users/me
GET  /api/users
POST /api/users
PATCH /api/users/{userId}
GET  /api/roles
```

**Rules:**

- Caregivers see only residents within their authorized scope.
- Dietitians see health and dietary information relevant to menu planning.
- Kitchen staff see production plans and special meal instructions; full health profiles are not available by default.
- Purchasing staff see only purchase lists and purchase notes.
- Every access to sensitive information creates an audit record.

### 4.2 Resident Profiles

**Responsibilities:** manage basic resident information, rooms, buildings, admission status, meal types, special care requirements, allergies, restrictions, swallowing ability and nutrition requirements. Support temporary changes and effective dates.

**Primary endpoints:**

```text
GET    /api/residents
POST   /api/residents
GET    /api/residents/{residentId}
PATCH  /api/residents/{residentId}
GET    /api/residents/{residentId}/diet-profile
PUT    /api/residents/{residentId}/diet-profile
POST   /api/residents/{residentId}/status-changes
GET    /api/residents/{residentId}/history
```

**Core data:**

```text
ResidentProfile
- resident_id
- name
- gender
- birth_date
- room_id
- building_id
- admission_status
- care_level
- effective_from
- effective_to

ResidentDietProfile
- resident_id
- meal_type
- allergies
- forbidden_ingredients
- swallowing_level
- salt_restriction
- texture_requirement
- nutrition_requirements
- food_preferences
- notes
- effective_from
- effective_to
```

### 4.3 Recipe Reference Data

**Responsibilities:** manage dishes, ingredients, specifications, meal periods, applicable meal types, preparation instructions, restriction tags and standard ingredient amounts.

**Primary endpoints:**

```text
GET    /api/recipes
POST   /api/recipes
GET    /api/recipes/{recipeId}
PATCH  /api/recipes/{recipeId}
GET    /api/ingredients
POST   /api/ingredients
PATCH  /api/ingredients/{ingredientId}
GET    /api/meal-types
```

**Example data:**

```text
Recipe
- recipe_id
- dish_name
- meal_period: breakfast / lunch / dinner
- applicable_meal_types
- preparation_method
- prohibited_tags
- nutrition_tags
- active_status

RecipeIngredient
- recipe_id
- ingredient_id
- specification
- amount_per_serving
- unit
- preparation_note
```

### 4.4 Rules and Validation

**Responsibilities:** match dishes to resident profiles, detect allergies and restricted ingredients, check meal texture against swallowing ability, verify special meal quantities, check active resident status, and produce blocking, warning or informational results.

| Severity | Meaning | Handling |
| --- | --- | --- |
| Blocking | Explicit allergy or restriction conflict | Release is prohibited until resolved |
| Warning | Missing information or potential risk | Dietitian confirmation required to continue |
| Information | Routine operational reminder | Continue while retaining a record |

**Primary endpoints:**

```text
POST /api/validation/recipe-plan
GET  /api/validation/results/{planId}
POST /api/validation/results/{resultId}/resolve
GET  /api/rules
POST /api/rules
PATCH /api/rules/{ruleId}
```

### 4.5 Menu Plans

**Responsibilities:** create drafts, select plan dates, generate next-day meals, count servings by meal type, run validation, submit for dietitian review, return for changes and another review, and freeze confirmed versions.

**State machine:**

```text
DRAFT
  -> VALIDATING
  -> WAITING_NUTRITIONIST_REVIEW
       -> REWORK_REQUIRED -> DRAFT
       -> APPROVED
  -> FROZEN
  -> EXPORTED / SENT
  -> COMPLETED
```

**Primary endpoints:**

```text
POST /api/meal-plans
GET  /api/meal-plans?date=YYYY-MM-DD
GET  /api/meal-plans/{planId}
POST /api/meal-plans/{planId}/generate
POST /api/meal-plans/{planId}/validate
POST /api/meal-plans/{planId}/submit-review
POST /api/meal-plans/{planId}/approve
POST /api/meal-plans/{planId}/reject
POST /api/meal-plans/{planId}/freeze
POST /api/meal-plans/{planId}/regenerate
```

### 4.6 Kitchen Production Plans

**Responsibilities:** generate production orders from frozen menus, calculate servings by meal period and type, provide special meal instructions and preparation/portioning/serving times, support kitchen supervisor confirmation, and record actual serving and substitutions.

**Primary endpoints:**

```text
POST /api/production-orders/from-meal-plan/{planId}
GET  /api/production-orders?date=YYYY-MM-DD
GET  /api/production-orders/{orderId}
POST /api/production-orders/{orderId}/confirm
POST /api/production-orders/{orderId}/report-exception
POST /api/production-orders/{orderId}/record-serving
```

**Minimum production order fields:** plan date, meal period, dish names, total servings, regular servings, low-sodium servings, soft servings, special preparation requirements, preparation time, serving time, kitchen confirmation status and exception notes.

### 4.7 Purchase Plans

**Responsibilities:** read ingredient amounts from frozen menus, convert amounts using serving counts, aggregate by ingredient, apply a waste allowance, create standalone purchase lists, allow manual adjustments with reasons, and export purchasing files.

**Quantity calculation:**

```text
Purchase quantity
= Sum(Standard amount per serving * Planned servings)
  * (1 + Waste allowance)
  - Available inventory
```

If version one does not maintain inventory, simplify to:

```text
Purchase quantity
= Sum(Standard amount per serving * Planned servings)
  * (1 + Waste allowance)
```

**Primary endpoints:**

```text
POST /api/purchase-lists/from-meal-plan/{planId}
GET  /api/purchase-lists?date=YYYY-MM-DD
GET  /api/purchase-lists/{listId}
PATCH /api/purchase-lists/{listId}/items/{itemId}
POST /api/purchase-lists/{listId}/submit
POST /api/purchase-lists/{listId}/approve
POST /api/purchase-lists/{listId}/export
```

**Purchase list fields:** purchase date, usage date, ingredient name, specification, quantity, unit, meal period, associated dishes, purchasing notes, status and adjustment reason.

### 4.8 File Export

**Responsibilities:** generate menu files, kitchen production orders, purchase lists and print-friendly versions; preserve file versions; support download and re-export.

**Output names:**

```text
YYYY-MM-DD_next-day-menu.xlsx
YYYY-MM-DD_kitchen-production-order.xlsx
YYYY-MM-DD_purchase-list.xlsx
YYYY-MM-DD_special-meal-instructions.pdf
```

**Export controls:** include the plan date and version in every file; never silently overwrite frozen versions; retain a record of each re-export; include only the information necessary for the recipient's role.

### 4.9 Notifications and Exceptions

Notify staff about pending reviews, allergy conflicts, insufficient special meals, plans the kitchen cannot execute, unconfirmed purchase lists and temporary changes.

Version one can use in-app notifications and page alerts. SMS, WeCom and email are later extensions.

### 4.10 Audit and Backup

**Responsibilities:** record sensitive-data views, before/after values for important changes, reviews, release, exports and exception resolution; create database and file backups; support recovery drills.

**Example events:**

```text
VIEW_RESIDENT_DIET_PROFILE
UPDATE_ALLERGY
GENERATE_MEAL_PLAN
VALIDATE_RECIPE
APPROVE_MEAL_PLAN
FREEZE_MEAL_PLAN
EXPORT_PRODUCTION_ORDER
EXPORT_PURCHASE_LIST
REPORT_KITCHEN_EXCEPTION
```

---

## 5. Data Model Relationships

```text
User ---------------- Role
  |                     |
  +-- Scope ------ Building / Room

ResidentProfile ---- ResidentDietProfile
       |                      |
       +-----------+----------+
                   v
                MealPlan
                 |    |
                 |    +-- MealPlanItem -- Recipe -- RecipeIngredient -- Ingredient
                 |    +-- ValidationResult
                 |    +-- ProductionOrder -- ProductionException
                 |    +-- PurchaseList -- PurchaseItem
                 +-- ApprovalRecord

All core entities -- AuditLog
All exported files -- FileArtifact
```

---

## 6. API Design Principles

### 6.1 General Principles

- Use HTTPS and JSON requests/responses.
- Give every business object a unique ID.
- Return a version and update timestamp from every write operation.
- Support pagination, filters and sorting on list endpoints.
- Audit all important operations.
- Preserve historical business records through statuses or archival rather than physical deletion.

### 6.2 Consistent Response Format

```json
{
  "success": true,
  "data": {},
  "error": null,
  "requestId": "request-id"
}
```

Example error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ALLERGY_CONFLICT",
    "message": "The menu contains a restricted ingredient for a resident. The plan cannot be released."
  },
  "requestId": "request-id"
}
```

---

## 7. Frontend Pages and Backend Modules

| Page | Primary users | Backend modules |
| --- | --- | --- |
| Sign-in | All users | Users and access |
| Resident list | Caregivers, dietitians, supervisors | Profiles |
| Resident profile details | Caregivers, dietitians | Profiles, audit |
| Dietary rule editor | Dietitians, supervisors | Profiles, rules |
| Recipe library | Dietitians, administrators | Recipe reference data |
| Next-day menu workspace | Dietitians | Menu plans, validation |
| Review page | Dietitians, supervisors | Review and release |
| Kitchen production orders | Kitchen and care supervisors | Kitchen production |
| Purchase lists | Purchasing staff, supervisors | Purchase plans |
| File export center | Authorized staff | File export |
| Exception center | Dietitians, kitchen supervisors, supervisors | Notifications and exceptions |
| Audit logs | Administrators, supervisors | Audit |
| Backup management | Administrators | Backup and recovery |

---

## 8. Implementation Stages

### Stage 0: Technical and Business Confirmation

**Goal:** freeze version-one boundaries.

Confirm roles and access scopes, daily kitchen file formats, regular/low-sodium/soft meal categories, sources of recipe and ingredient standards, dietitian review responsibility, whether the waste allowance is a system parameter, and backup locations/access methods.

**Deliverables:** role/access matrix, meal-type dictionary, recipe field list, ingredient field list and sample document layouts.

### Stage 1: Project Foundation and Authentication

1. Create frontend, backend and database projects.
2. Configure development, test and production environments.
3. Implement sign-in, sign-out and tokens.
4. Add role authorization middleware.
5. Add consistent errors and request logs.
6. Establish database migrations.
7. Establish a basic test framework.

**Acceptance:** users can sign in; different roles access appropriate pages; unauthorized endpoints return access errors; authentication and authorization events are audited.

### Stage 2: Resident Profiles

1. Create basic resident information tables.
2. Create dietary profile tables.
3. Create allergy and restriction tables.
4. Create status-change tables.
5. Implement lists, details, creation and editing.
6. Implement effective dates and historical versions.
7. Optionally provide a manual reference-data import template.

**Acceptance:** profiles can be created; allergies, restrictions, swallowing ability and meal types can be maintained; change history is visible; allergies are structured data rather than free-form notes.

### Stage 3: Recipe and Ingredient Library

1. Create recipe tables.
2. Create ingredient tables.
3. Associate recipes and ingredients.
4. Define standard amounts and units.
5. Define meal periods and meal types.
6. Define restriction tags.
7. Implement creation, editing, deactivation and queries.

**Acceptance:** a dish can contain several ingredients; each ingredient has specifications, a unit and a standard amount; recipes identify suitable meal types; deactivated recipes cannot enter new plans.

### Stage 4: Rules and Validation Engine

1. Define allergy, restriction, texture, meal-type and status rules.
2. Define blocking, warning and informational severity levels.
3. Match recipes against resident profiles.
4. Validate at plan level.
5. Display conflicts.
6. Record resolution and reasons.
7. Save the rule version used for every validation.

**Acceptance:** explicit allergy conflicts block release; warnings require dietitian confirmation; results identify the resident, dish and ingredient; changing rules does not rewrite historical validation records.

### Stage 5: Menu Plans and Review

1. Create dated plans.
2. Generate candidate menus for three meals.
3. Aggregate servings by meal type.
4. Run validation.
5. Implement dietitian review.
6. Support return for changes and recalculation.
7. Freeze versions.
8. Create versions for temporary changes.

**Acceptance:** next-day plans can be generated; dishes and servings are visible for each meal; regular, low-sodium, soft and other categories are shown; blocking conflicts prevent release; review, return and freeze actions record an actor and timestamp.

### Stage 6: Kitchen Production

1. Generate orders from frozen menus.
2. Split by meal period and type.
3. Generate special meal instructions.
4. Generate preparation and serving times.
5. Support kitchen supervisor confirmation.
6. Support feedback for unworkable plans, shortages and substitutions.
7. Record actual serving quantities.

**Acceptance:** the kitchen sees only execution information; special servings are clearly shown; production and menu versions match; feedback notifies the dietitian or supervisor.

### Stage 7: Purchase Lists

1. Read ingredients from frozen menus.
2. Calculate quantities from servings and standard amounts.
3. Aggregate by ingredient, specification and unit.
4. Apply the waste allowance.
5. Permit manual adjustments by purchasing staff.
6. Record adjustment reasons.
7. Generate purchase lists.
8. Support Excel, PDF and print versions.

**Acceptance:** lists include ingredients, specifications, quantities, units and purchase dates; identical ingredients can be aggregated; manual edits retain original values and reasons; plan dates and versions are included.

### Stage 8: File Center and Notifications

1. Build the file generation service.
2. Define versioned filenames.
3. Implement download and re-export.
4. Add in-app pending-action alerts.
5. Add blocking-conflict alerts.
6. Add unreviewed and unconfirmed-item alerts.

**Acceptance:** menu, production and purchase files download independently; staff can print or send them directly; no ERP is required to generate files; exports are audited.

### Stage 9: Audit, Backup and Launch Preparation

1. Complete auditing of key actions.
2. Complete data backups.
3. Complete file backups.
4. Run recovery drills.
5. Test access permissions.
6. Test allergy conflicts.
7. Test consistency across versions.
8. Prepare user training and operating manuals.

**Acceptance:** allergy edits and menu approvals/releases are attributable to staff; business data and exports can be restored; key workflows have signed user acceptance records.

---

## 9. Functional List

### 9.1 Identifier Rules

- Stable identifiers: `FL-001` through `FL-024`.
- `MVP`: required in version one.
- `Phase 2`: implement after version one is stable.

### 9.2 Functions

| ID | Function | Module | Description | Priority | Release |
| --- | --- | --- | --- | --- | --- |
| FL-001 | Sign-in and role access | Users and access | Support caregivers, dietitians, kitchen supervisors, purchasing staff, care supervisors and administrators with role-based access. | High | MVP |
| FL-002 | Resident profile management | Resident profiles | Maintain basic details, room, care level, diet, status and temporary changes. | High | MVP |
| FL-003 | Health and dietary constraints | Resident profiles | Maintain allergies, restrictions, swallowing ability, nutrition needs, preferences and special meal instructions. | High | MVP |
| FL-004 | Resident status changes | Resident profiles | Record admission, discharge, leave, temporary fasting and diet adjustments. | High | MVP |
| FL-005 | Recipe library | Menu management | Maintain dishes, ingredients, specifications, meal periods, suitable meal types, restrictions and preparation instructions. | High | MVP |
| FL-006 | Next-day menu generation | Menu management | Generate breakfast, lunch and dinner for the selected date, matching regular, low-sodium, soft and other meal types. | High | MVP |
| FL-007 | Serving aggregation | Menu management | Aggregate production servings by meal, building, meal type and resident count. | High | MVP |
| FL-008 | Allergy and restriction validation | Menu management | Check dishes and ingredients against allergies/restrictions in resident profiles and show conflicts. | High | MVP |
| FL-009 | Special meal alternatives | Menu management | Suggest soft, low-sodium or other alternatives for residents unable to eat standard dishes, for dietitian review. | High | MVP |
| FL-010 | Dietitian menu review | Review and release | Review validation results, adjust recommendations, confirm menus or return them for changes. | High | MVP |
| FL-011 | Menu version management | Review and release | Preserve draft, review and released versions, including actor, time and reason. | Medium | MVP |
| FL-012 | Production plan generation | Kitchen operations | Convert confirmed menus into orders by meal, including dishes, servings, special meals and times. | High | MVP |
| FL-013 | Kitchen review and confirmation | Kitchen operations | Let supervisors confirm executable items and report shortages, substitutions or unworkable items. | High | MVP |
| FL-014 | Portioning and delivery instructions | Kitchen operations | Produce special meal labels, room/building allocations, portioning requirements and delivery notes. | Medium | MVP |
| FL-015 | Actual serving records | Kitchen operations | Record actual quantities, serving times, shortages, substitutions and exception reasons. | Medium | MVP |
| FL-016 | Automatic purchase aggregation | Purchasing | Generate lists from confirmed menus, serving counts and ingredient amount rules. | High | MVP |
| FL-017 | Purchase specifications and quantities | Purchasing | Display/edit ingredient names, specifications, quantities, units and purchase dates with reasons. | High | MVP |
| FL-018 | Purchase review and delivery | Purchasing | Authorized staff confirm lists and send them to purchasing staff or export standalone files. | High | MVP |
| FL-019 | Manual inventory checks | Purchasing | Enter existing stock and calculate purchase gaps without external inventory or ERP dependencies. | Medium | Phase 2 |
| FL-020 | Intake and leftovers | Care records | Record actual intake, refused meals, leftovers and exceptions to inform future plans. | Medium | Phase 2 |
| FL-021 | Notifications and exception alerts | Operational support | Alert on allergies, shortages, pending reviews, insufficient special meals and temporary status changes. | High | MVP |
| FL-022 | Standalone file export | File delivery | Export menus, production orders and purchase lists to Excel, PDF or print-friendly files. | High | MVP |
| FL-023 | Activity audit logs | Security and audit | Record views, changes, reviews, release, delivery, export and exception handling. | High | MVP |
| FL-024 | Reference-data backup and recovery | Platform management | Periodically back up standalone files, databases and attachments and verify restoration. | High | MVP |

---

## 10. MVP Development Order

Follow these dependencies:

```text
FL-001 Users and access
    -> FL-002 / FL-003 / FL-004 Resident profiles
    -> FL-005 Recipe and ingredient library
    -> FL-008 Rules and restriction validation
    -> FL-006 / FL-007 Menu generation and serving aggregation
    -> FL-010 / FL-011 Review and version management
    -> FL-012 / FL-013 / FL-014 / FL-015 Kitchen production
    -> FL-016 / FL-017 / FL-018 Purchase lists
    -> FL-022 File export
    -> FL-021 Notifications
    -> FL-023 / FL-024 Audit and backup
```

---

## 11. Nonfunctional Requirements

| Category | Version-one requirement |
| --- | --- |
| Security | Sign-in, role access, least privilege, encryption in transit and sensitive-field access auditing |
| Data consistency | Frozen menus, production orders and purchase lists share the same plan version |
| Traceability | Track all review, release, export, modification and exception actions |
| Usability | Mobile views support quick caregiver checks; administration supports dietitian/kitchen batch operations |
| Maintainability | Clear module boundaries; configurable rules, recipes and meal types |
| Extensibility | Inventory, suppliers, pricing and ERP interfaces can be added later; version one has no such dependency |
| File reliability | Menu, production and purchase exports carry dates, versions and generation records |
| Recoverability | Verify backup and restoration of databases, exported files and attachments |
| Performance | Confirm targets through load testing based on resident counts, users and plan volume |

---

## 12. Key Risks and Controls

| Risk | Control |
| --- | --- |
| Incorrect allergy or restriction data | Structured fields, two-person review, blocking validation and change auditing |
| Generated menus unsuitable for individuals | Treat generated output as suggestions requiring dietitian review |
| Incorrect purchase quantities | Retain standard amounts, servings, units and calculation details; permit review |
| Kitchen using an outdated version | Include dates, versions and status; never silently overwrite old versions |
| Admission or leave changes not synchronized | Recalculate and notify on status changes |
| Files sent to the wrong recipients | Minimize content by role and record download/export actions |
| Data loss | Regular backups, recovery drills and retained file versions |
| Version-one scope too large | Prioritize profiles, menu review, production orders, purchase lists and export |

---

## 13. Architecture Decision Records

### ADR-001: Modular Monolith Instead of Microservices

**Status:** Proposed

**Context:** version one must quickly validate resident profiles, menus, kitchen production and purchasing-file workflows. No ERP integration or large-scale concurrency requirement has been established.

**Decision:** use a modular backend monolith. Preserve boundaries in code and database design while deploying version one as a single application.

**Benefits:** simpler development and deployment; suitable for small teams; easier consistency; menus, production orders and purchase lists can share one transaction boundary; services can still be separated later.

**Trade-offs:** dependencies need strict control; a deployment failure can affect several functions; later separation requires service communication and data boundaries.

### ADR-002: Standalone File Delivery Instead of ERP Integration

**Status:** Proposed

**Context:** the system must remain independent of ERP. Kitchen and purchasing staff receive plans as standalone files.

**Decision:** generate Excel, PDF or print-friendly files that authorized staff download, print or deliver through internal channels.

**Trade-offs:** purchasing status is not automatically written back; delivery requires staff; dates and versions require strict management.

### ADR-003: Automatic Suggestions with Human Review and Release

**Status:** Proposed

**Context:** resident health, allergies and dietary requirements are sensitive operational information. Release must not rely solely on automatic rules.

**Decision:** automatically suggest menus and purchases, require dietitian review, and allow authorized staff to release or export only afterward.

**Trade-offs:** an additional review step; unreviewed plans cannot enter final production; exception reminders and pending-action management are needed.

---

## 14. Development Acceptance Checklist

### Functions

- [ ] Maintain resident profiles.
- [ ] Maintain allergies, restrictions, swallowing ability and meal types.
- [ ] Maintain recipes, ingredients, specifications and standard amounts.
- [ ] Generate the next day's three meals.
- [ ] Count servings by meal type.
- [ ] Validate allergies and restrictions.
- [ ] Block release when blocking conflicts exist.
- [ ] Allow dietitians to review, return and confirm plans.
- [ ] Generate kitchen production orders.
- [ ] Generate purchase lists.
- [ ] Export standalone files.
- [ ] Record actual serving and exceptions.
- [ ] View review, release, export and change logs.
- [ ] Back up and restore data.

### Architecture

- [ ] Central authentication and authorization at the API layer.
- [ ] Clear business module boundaries.
- [ ] Menus, production orders and purchase lists linked by plan version.
- [ ] No hard dependency on ERP.
- [ ] Independently operating file export.
- [ ] Audit records for key actions.
- [ ] Backup and recovery verified in practice.

### Business Decisions to Confirm

- [ ] Dietitian review responsibility.
- [ ] Kitchen document formats.
- [ ] Purchase-list delivery method.
- [ ] Standard amounts and waste allowance.
- [ ] Permitted ingredient substitution rules.
- [ ] Retention and backup schedules.
- [ ] Actual user and resident counts.

---

## 15. Conclusion

Start with an independent, auditable care-home dining platform centered on file delivery:

```text
Resident profiles
    -> Menu generation
    -> Rule validation
    -> Dietitian review
    -> Kitchen production orders
    -> Purchase lists
    -> Standalone file delivery
```

Version one is independent of ERP and prioritizes three outcomes:

1. Resident dietary requirements are not overlooked.
2. Kitchen staff receive clear, actionable production information.
3. Purchasing staff receive ingredient lists they can review and export.
