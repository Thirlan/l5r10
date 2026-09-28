# Economy Data — Implementation Plan

This document is the coding implementation plan for building out the economy data
files for the L5R 10th Century project. **The scope of this plan is JUST the
creation of the JSON data files** — no runtime/simulation code is written here.
Those files are consumed later by an economy simulation that is out of scope.

The base resources in [`layers.json`](./layers.json) (the `resource`,
`settlement`, and `infrastructure` layers) are the inspiration for this work. The map
resource layer lists what a resource tile   is but not what it produces (e.g. `horse ranch` produces horses, horse hair). The economy files expand that seed into the full chain of raw
resources, processed goods, jobs, and buildings.

---

## 1. Goals & Scope

Produce the following data files under `docs/scripts/`:

| # | File | Purpose |
|---|------|---------|
| 1 | `item_type.json` | Exhaustive catalog of every raw resource and craftable item. |
| 2 | `job_type.json` | Every job in a feudal Edo-period economy and what each job consumes/desires. |
| 3 | `building_type.json` | Buildings, the job slots they offer, and their input→output recipes. |
| 4 | `settlement.json` | Settlement definitions derived from the `settlement` layer. Represents the settlements on the map and aggregates buildings|
| 5 | `unit_type.json` | Individual military/economic units that make up a strategic unit. |
| 6 | `strategic_unit_type.json` | Higher-level (army/trade caravan/army supply caravan/merchant fleet/naval fleet/monster) units built from `unit.json`. |
| 7 | `resource_output_type.json` | links a specific resource type with a specific building type |
| 8 | `clan_preference.json` | modifies the weights in job_type.json to reflect clan preferences. |
| 9 | `citizen_type.json` | list of all possible civilizans and the population counter for each (e.g. peasants are 100) |

Ultimately job_type and citizen_type will belong to a citizen class in the javascript code. So a given citizen instance will have a job of job type, be a citizen of citizen type, will have skills that will help determine how efficient they are in the building, will have money they can use to buy things.

Settlements.json will be how we load the map with real instances. Settlement will contain all the cities on the map. Settlements will be populated with buildings and the buildings will be populated with citizens and goods.

Resources.json will be how we load the map with buildings into the resource tiles. Resources will behave like settlements but with a single building, with the exception of ocean resources (fish, crabs, shrimp, squids, etc), which will instead be spawned as strategic units and must be harvested by a fishing fleet (strategic unit type).

The world map will be populated with strategic_unit_types. In the case of merchants they will travel around the map carrying goods to sell from one place to another. The shadowlands will have armies spawn that march towards the crab lands. The crab will have armies that will fight the shadowland armies. The yobanjin will have small raiding armies spawn in the north and attack the dragon, unicorn and phoenix randomly. Giant creatures, like sea monsters or monstrous oni will be represented with a single army and single unit inside of it.

All in all this will create a living simulation using the map that can be turned on and will increment every day so we can watch how everything behaves. this will be a new map called "world simulation".

---

## 2. Global Conventions

These conventions apply across every file below.

- **IDs are numbers** Once published, an ID is never
  reused for a different thing for a specific type (item, )
- **Cross-file references use the ID.** Every `id` inside an `input`,
  `output`, `food`, `drink`, `housing`, etc. must resolve to an entry in the
  file it points at (usually `item.json`).
- **Units:** weight in **grams**, volume/size in **cm³**. Keep raw numbers
  (no unit suffixes) so consumers can compute freely.
- **Quality** is one of `normal` or `high`.
- **Tool/durable quantity convention:** a single durable item (tool, weapon,
  armor, container, furniture, machinery, ship, land transport) should be produced in granular amounts, such as a stack of **1000** sub-units. One physical hammer = 1000 units. This lets the model handle wear, tear, and breakage quickly and efficiently, but does not always accurately represent the actual number of hammers. buildings, vehicles (e.g. boats), armor and weapons, are always in units of 1.
  - Consumables (food, drink, fuels, raw/processed/combined resources) have varying units as well, but since most are instantly consumed they do not need the granularity of tools. It is all just a matter of the qty produced.
- **JSON style:** 2-space indentation, top-level object with a metadata header
  and a data array, matching the existing files in this folder. Example shape:

  ```json
  {
    "schemaVersion": 1,
    "description": "…",
    "items": [ /* … */ ]
  }
  ```

---

## 3. File Schemas

### 3.1 `item_type.json`

An exhaustive list of every raw resource and craftable item. Items list is larger than
the map layer set because one source (e.g. a horse) yields many items (horse
hair, manure, leather, meat, bone, etc.).

Each item entry:

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | |
| `name` | string | Human-readable display name. |
| `type` | string[] | One or more type tags (see taxonomy). Multi-type is allowed. |
| `weight` | number | Weight in grams (per single natural unit). |
| `size` | number | Volume in cm³ (per single natural unit). |
| `quality` | string | `normal` or `high`. |
| `physical` | boolean | `false` for non-physical items (e.g. entertainment). |

**Type taxonomy** (an item may carry several):

`raw resource`, `processed resource`, `combined resource`, `food`, `drink`,
`discretionary consumable`, `clothing`, `armor`, `weapon`, `fashion accessory`,
`tool`, `container`, `furniture`, `machinery`, `ship`, `land transportation`,
`building material`, `fuel`, `building`, `entertainment`.

- Multi-type example: a **wood plank** is `["processed resource",
  "building material", "fuel"]`.
- `entertainment` items sometimes set `physical: false` (e.g. a performance, a story), or true (a pillow book).
- The taxonomy is open-ended: new categories can be added when a real item does
  not fit an existing tag, but prefer reusing existing tags.

**Coverage checklist** (used to keep the catalog exhaustive):

- For every `resource`-layer entry in `layers.json`, enumerate:
  1. the raw resource(s) it yields,
  2. every by-product (e.g. horse → hair, manure, leather, meat, bone, sinew),
  3. the processed resources refined from those raws,
  4. the combined resources (alloys, blends) made from processed resources,
  5. the finished goods (food, drink, clothing, armor, weapons, tools,
     containers, furniture, machinery, ships, transport, building materials,
     fuels, buildings, entertainment) that consume them.
- Every `id` referenced by `job.json` and `building.json` must exist here.

### 3.2 `job_type.json`

Every job in a feudal Edo-period economy (farmer, fisher, miner, smith,
carpenter, weaver, dyer, brewer, sake maker, potter, cooper, fletcher, armorer,
sword smith, tanner, merchant, innkeeper, geisha, actor, monk, magistrate,
samurai retainer, porter, ferryman, stablehand, etc.).

Each job entry:

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | |
| `name` | string | Display name. |
| `status` | number | The job's L5R social **Status** rating. |
| `food` | {id, qty, weight}[] | Desired food items. |
| `drink` | {id, qty, weight}[] | Desired drink items. |
| `clothing` | {id, qty, weight}[] | Desired clothing items. |
| `accessories` | {id, qty, weight}[] | Desired fashion accessories. |
| `entertainment` | {id, qty, weight}[] | Desired entertainment items. |

- **weight encodes desirability:** within each array, entries are listed from
  **most** to **least** desired. (A worker's luxury bento appears before plain
  rice.)
- Every referenced `id` must resolve in `item.json`.
- `status` uses the same L5R Status scale referenced elsewhere in the project.

### 3.3 `building_type.json`

A list of buildings and what they produce.

Each building entry:

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | |
| `name` | string | Display name. |
| `jobSlots` | {jobId, capacity}[] | Job slots supported; `jobId` → `job.json`, `capacity` = total workers. |
| `input_items` | {id, qty}[] | Items consumed each production cycle. |
| `input_items` | {id, qty}[] | Items consumed each production cycle. |
| `output_items` | {id, qty}[] | Items produced each production cycle. |
| `input_job` | {id, qty}[] | Items consumed each production cycle. |
| `output_job` | {id, qty}[] | Items produced each production cycle. |
|'production time' | number | time in days | time to produce the item |
| storage_capacity | number | capacity in cm3 for storing input and output. |

- `input` items are fully **consumed**; `output` items are produced.
- Some buildings produce no outputs. Their existence provides other benefits but must be maintained (e.g. walls, castles and ports).
- Input should not only include what is needed to make the output item, but what is needed to maintain the building
- Some buildings are training grounds that transform jobs into other jobs. Most create items and are training grounds (example, a foundry both produces steel and trains new recruits so can work the job.)
- `jobSlots[*].jobId` must resolve in `job.json`; all `input`/`output` `id`s must
  resolve in `item.json`.
- Buildings that are also placeable items (peasant hut, granary, castle, Kyuden)
  should have a matching `building`-typed entry in `item.json` for housing
  references, while their *production* behavior lives here.

### 3.4 `settlement.json`

Derived from the `settlement` layer in `layers.json` (Village/Mura, City/Toshi,
Capital/Shuto, Fortification, Castle/Shiro, Kyuden/Palace, Small Shrine, Large
Shrine).

Each settlement entry (proposed):

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | should match the settlement on the map |
| typeId | number | settlement id type from the map |
| `englishName` | string | From the layer entry. |
| `rokuganiName` | string | From the layer entry. |
| `buildings` | {id, idType}[] | Buildings typically present; `idType` → `building.json`, whereas id is a unique id for the instance of that building. |

- The layer’s numeric `id`/`englishType`/`rokuganiType` values carry over
  verbatim so the map and economy stay in sync.

### 3.5 `unit_type.json`

Individual units (economic or military) — e.g. `ashigaru_spearman`,
`samurai_cavalry`, `merchant wagon`, `merchant ship`, `fishing boat`, crabs, fish, shrimp, deep sea fish, squid.

Each unit entry (proposed):

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | |
| `name` | string | Display name. |
| `equipment` | {id, qty}[] | Items a unit is outfitted with; `id` → `item.json`. |
| `upkeep` 
 N/A| | Not needed. Comes from job |
| `jobId` | number | Optional link to a `job.json` role. |
| `unit_size` | number | the size of the unit |

### 3.6 `strategic_unit_type.json`

Higher-level formations composed of `unit.json` entries — e.g. `legion`,
`baggage_train`, `patrol`.

Each strategic-unit entry:

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | |
| 'type' | string | legion, naval fleet, merchant fleet, crabs, squids, fish, shrimp, deep sea fish |

### 3.7 `resource_output_type`

replaces /workspaces/l5r10/docs/scripts/resource_output.js (what is currently in that file should move to a building)

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | maps back to the layer |
| 'building_type' | number | maps to a building id in building_type.json |

This helps establish the link from resource to a building and the building is the one that outputs the resources when worked by citizens (mostly peasants).

This is a 1 to 1 relationship. A single resource should not be linked to more than 1 building. Skip the sea resources since they are units that are hunted.

### 3.8 `clan_preferences.json`

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | |
| `name` | string | The clan for this preference |
| `food` | {id, weight}[] | Desired food items. |
| `drink` | {id, weight}[] | Desired drink items. |
| `clothing` | {id, weight}[] | Desired clothing items. |
| `accessories` | {id, weight}[] | Desired fashion accessories. |
| `entertainment` | {id, weight}[] | Desired entertainment items. |

This adds preferences on top of the job preferences. For the kuge, high buge and low buge the job preference will be fairly basic and this is where things will get creative and add flavor.

### 3.9 `citizen_type.json`

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | |
| `type` | string | the different kinds of citizen |
| `population_count` | number | how much one instance of this citizen type counts for population |
| `max_job_status` | number | the highest job status this citizen can take. |
| `min_job_status` | number | the lowest job status this citizen can take. |

This file is used to help track the kinds of citizens there are. Since this is a caste system the citizens are quite restricted on jobs that can be taken.

Below is the recommended list.
- kuge, population of 1, status range of (7 to 10]
- high buge, population of 1, max status (4 to 7]
- low buge, population of 10, [1 to 4]
- peasants, population of 100, [0.4 to 1)
- crafters, population of 10, [0.1 to 0.1]
- merchants, population of 1, [0.1 to 0.1]
- geisha, population of 10, [-1 to -1]
- eta, population of 10, [-2 to -2]

The purpose of this file ultimately is so that when we do implement the game logic we don't have to handle each individual citizen out of a population of 12 million and instead we can handle the bulk of the population (peasants) with fewer programming objects since the ratio is 1 object to 100 peasants.

---

## 4. Pull Request Breakdown

Work is sequenced so that referenced files exist before the files that reference
them. Each PR is self-contained and reviewable.

### PR 1 — Item taxonomy & schema scaffold
- Add `item.json` with the metadata header, the full **type taxonomy**
- Seed items for every entry in the `resource` layer (raw resources only).
- Add a schema/README note. **No** downstream files yet.
- *Depends on:* none.

### PR 2 — Item catalog: by-products & processed resources
- Expand `item.json` with by-products (horse → hair, manure, leather, meat,
  bone, sinew; lumber → bark, sawdust; etc.) and processed resources
  (ingots, planks, cloth, flour, charcoal…).
- *Depends on:* PR 1.

### PR 3 — Item catalog: finished goods
- Add combined resources, food, drink, discretionary consumables, clothing,
  armor, weapons, fashion accessories, tools, containers, furniture, machinery,
  ships, land transportation, building materials, fuels, buildings, and
  entertainment. Apply `stackUnits` per §2.
- Completes the exhaustive `item.json`.
- *Depends on:* PR 2.

### PR 4 — Jobs
- Add `job.json` covering every feudal/Edo-period job with `status` and the
  desire arrays (`food`, `drink`, `clothing`, `accessories`, `entertainment`,
  `housing`), each ordered most→least desired.
- All referenced item IDs must already exist from PRs 1–3.
- *Depends on:* PR 3.

### PR 5 — Buildings
- Add `building.json` with `jobSlots`, `input`, and `output` for every building
  (farms, mines, workshops, breweries, shrines, castles, Kyuden, etc.).
- References jobs (PR 4) and items (PRs 1–3).
- *Depends on:* PR 4.

### PR 6 — Settlements
- Add `settlement.json` from the `settlement` layer, wiring in `buildings`
  references to `building.json`.
- *Depends on:* PR 5.

### PR 7 — Units
- Add `unit.json` (equipment/upkeep referencing items; optional job link).
- *Depends on:* PR 5 (items/jobs).

### PR 8 — Strategic units
- Add `strategic_unit.json` composing `unit.json` entries.
- *Depends on:* PR 7.

### PR 9 — Validation tooling (optional but recommended)
- Add a lightweight validation script/notes that checks: unique IDs per file,
  every cross-file reference resolves, `quality` ∈ {normal, high}, `physical`
  boolean present, and `stackUnits` ∈ {1, 100, 1000}.
- *Depends on:* the files it validates.

---

## 5. Validation & Acceptance Criteria

For each data PR, reviewers confirm:

1. **Well-formed JSON**, 2-space indent, metadata header + data array.
2. **Unique IDs** within the file.
3. **Referential integrity:** every `id`/`jobId`/`unitId` referenced resolves in
   its target file.
4. **Enum correctness:** `quality` ∈ {`normal`, `high`}; item `type` values come
   from the taxonomy; `physical` is boolean.
5. **Convention compliance:** durable items carry `stackUnits` of 100 or 1000;
   consumables use 1; buildings are never multiplied.
6. **Ordering:** `job.json` desire arrays are sorted most→least desired.
7. **Coverage:** the `item.json` coverage checklist (§3.1) is satisfied for each
   resource-layer source touched by the PR.

---

## 6. Open Questions

- Confirm the proposed schemas for `settlement.json`, `unit.json`, and
  `strategic_unit.json` (§3.4–3.6) before filling in data.
- Decide the exact `stackUnits` value (100 vs 1000) per durable type — proposal:
  1000 for high-wear/finely-made goods (weapons, armor, precision tools), 100
  for everyday tools/containers/furniture.
- Confirm whether housing in `job.json` references `building`-typed items in
  `item.json` or entries in `building.json` (proposal: `item.json` building
  entries, so a job can "want" a dwelling without a production recipe).
