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
| 4 | `settlement.json` | Settlement **instances** placed on the map (derived from the `settlement` layer) that aggregate buildings. |
| 5 | `unit_type.json` | Individual military/economic units that make up a strategic unit. |
| 6 | `strategic_unit_type.json` | Higher-level (army/trade caravan/army supply caravan/merchant fleet/naval fleet/monster) units built from `unit_type.json`. |
| 7 | `resource_output_type.json` | links a specific resource type with a specific building type |
| 8 | `clan_preference.json` | modifies the weights in job_type.json to reflect clan preferences. |
| 9 | `citizen_type.json` | list of all possible civilizans and the population counter for each (e.g. peasants are 100) |

Ultimately job_type and citizen_type will belong to a citizen class in the javascript code. So a given citizen instance will have a job of job type, be a citizen of citizen type, will have skills that will help determine how efficient they are in the building, will have money they can use to buy things.

Settlement instances (`settlement.json`) are how we load the map with real
instances. It contains all the cities on the map. Settlements are populated with
buildings and the buildings are populated with citizens and goods.

Resource instances are how we load the map with buildings into the resource
tiles. Resources behave like settlements but with a single building, with the
exception of ocean resources (fish, crabs, shrimp, squids, etc), which are
instead spawned as strategic units and must be harvested by a fishing fleet
(strategic unit type). *(The resource-instance file is not yet enumerated in
§1 — see Open Questions §6.)*

The world map will be populated with strategic_unit_types. In the case of merchants they will travel around the map carrying goods to sell from one place to another. The shadowlands will have armies spawn that march towards the crab lands. The crab will have armies that will fight the shadowland armies. The yobanjin will have small raiding armies spawn in the north and attack the dragon, unicorn and phoenix randomly. Giant creatures, like sea monsters or monstrous oni will be represented with a single army and single unit inside of it.

All in all this will create a living simulation using the map that can be turned on and will increment every day so we can watch how everything behaves. this will be a new map called "world simulation".

---

## 2. Global Conventions

These conventions apply across every file below.

- **IDs are numbers.** Each type file owns its own ID space (item IDs are
  unique among items, job IDs among jobs, building IDs among buildings, etc.).
  Once published, an ID is never reused for a different thing within that type.
- **Cross-file references use the ID.** Every `id` inside an `input`,
  `output`, `food`, `drink`, `housing`, etc. must resolve to an entry in the
  file it points at (usually `item_type.json`).
- **File splitting:** any type file that grows unwieldy may be split into
  category files that share a single ID space (e.g. `item_type_weapon.json`,
  `item_type_food.json`). Splitting does **not** create separate ID spaces —
  an item ID is still globally unique across every `item_type_*.json` file, so
  cross-file references stay valid. See §3.1.
- **Units:** weight in **grams**, volume/size in **cm³**. Keep raw numbers
  (no unit suffixes) so consumers can compute freely.
- **Quality** is one of `normal` or `high`.
- **Tool/durable quantity convention:** durable goods are counted in **sub-units**
  so the model can handle wear, tear, and breakage quickly. A single tool
  (hammer, saw, anvil, fishing net, etc.) is produced and stored as a stack of
  **1000** sub-units — one physical hammer = 1000 units. This is a production/
  storage `qty` convention only; there is **no** per-item field for it (§3.1).
  Buildings, vehicles (ships, carts), armor, and weapons are always counted in
  units of **1** (one recipe cycle yields one physical object).
  - Consumables (food, drink, fuels, raw/processed/combined resources) are
    counted in whatever natural `qty` a recipe produces; because most are
    consumed immediately they do not need sub-unit granularity.
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

> **Splitting:** this file is expected to become the largest in the set. When
> it does, split it by category into `item_type_<category>.json` files
> (e.g. `item_type_raw.json`, `item_type_weapon.json`, `item_type_food.json`)
> that share one global item ID space (see §2). Until then a single
> `item_type.json` is fine.

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
- Every `id` referenced by `job_type.json` and `building_type.json` must exist here.

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
| `housing` | {id, qty, weight}[] | Desired housing (`building`-typed items in `item_type.json`). |

- **weight encodes desirability:** within each array, entries are listed from
  **most** to **least** desired. (A worker's luxury bento appears before plain
  rice.)
- Every referenced `id` must resolve in `item_type.json`.
- `status` uses the same L5R Status scale referenced elsewhere in the project.

### 3.3 `building_type.json`

A list of buildings and what they produce.

Each building entry:

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | |
| `name` | string | Display name. |
| `jobSlots` | {jobId, capacity}[] | Job slots supported; `jobId` → `job_type.json`, `capacity` = total workers. |
| `input_items` | {id, qty}[] | Items consumed each production cycle; `id` → `item_type.json`. |
| `output_items` | {id, qty}[] | Items produced each production cycle; `id` → `item_type.json`. |
| `input_job` | {id, qty}[] | Workers consumed by a training cycle; `id` → `job_type.json`. |
| `output_job` | {id, qty}[] | Workers produced by a training cycle; `id` → `job_type.json`. |
| `production_time` | number | Time in days to complete one production cycle. |
| `storage_capacity` | number | Storage capacity in cm³ for input and output items. |

- `input` items are fully **consumed**; `output` items are produced.
- Some buildings produce no outputs. Their existence provides other benefits but must be maintained (e.g. walls, castles and ports).
- Input should not only include what is needed to make the output item, but what is needed to maintain the building
- Some buildings are training grounds that transform jobs into other jobs via
  `input_job`/`output_job`. Most buildings produce items; some do both (e.g. a
  foundry produces steel *and* trains new recruits into smiths).
- `jobSlots[*].jobId`, `input_job`, and `output_job` must resolve in
  `job_type.json`; all `input_items`/`output_items` `id`s must resolve in
  `item_type.json`.
- Buildings that are also placeable items (peasant hut, granary, castle, Kyuden)
  should have a matching `building`-typed entry in `item_type.json` for housing
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
| `buildings` | {id, idType}[] | Buildings typically present; `idType` → `building_type.json`, whereas id is a unique id for the instance of that building. |

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
| `equipment` | {id, qty}[] | Items a unit is outfitted with; `id` → `item_type.json`. |
| `jobId` | number | Optional link to a `job_type.json` role. Upkeep/desires come from the job — there is no separate upkeep field. |
| `unit_size` | number | The size of the unit. |

### 3.6 `strategic_unit_type.json`

Higher-level formations composed of `unit_type.json` entries — e.g. `legion`,
`baggage_train`, `patrol`.

Each strategic-unit entry:

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | |
| `type` | string | Formation kind: legion, naval fleet, merchant fleet, crabs, squids, fish, shrimp, deep sea fish. |
| `units` | {typeId, qty}[] | Composition; `typeId` → `unit_type.json`. |

### 3.7 `resource_output_type.json`

Replaces [`resource_output.js`](./resource_output.js) (the yield numbers currently
in that file should move onto the linked building's recipe).

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | Maps back to the `resource` layer id in `layers.json`. |
| `building_type` | number | Maps to a building id in `building_type.json`. |

This helps establish the link from resource to a building and the building is the one that outputs the resources when worked by citizens (mostly peasants).

This is a 1 to 1 relationship. A single resource should not be linked to more than 1 building. Skip the sea resources since they are units that are hunted.

### 3.8 `clan_preference.json`

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | |
| `name` | string | The clan for this preference |
| `food` | {id, weight}[] | Desired food items; `id` → `item_type.json`. |
| `drink` | {id, weight}[] | Desired drink items; `id` → `item_type.json`. |
| `clothing` | {id, weight}[] | Desired clothing items; `id` → `item_type.json`. |
| `accessories` | {id, weight}[] | Desired fashion accessories; `id` → `item_type.json`. |
| `entertainment` | {id, weight}[] | Desired entertainment items; `id` → `item_type.json`. |

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

Below is the recommended list. Status is written as a `min..max` interval where
`[`/`]` are inclusive bounds and `(`/`)` are exclusive bounds.

- **kuge** — population 1, status (7, 10]
- **high buge** — population 1, status (4, 7]
- **low buge** — population 10, status [1, 4]
- **peasants** — population 100, status [0.4, 1)
- **crafters** — population 10, status [0.1, 0.1]
- **merchants** — population 1, status [0.1, 0.1]
- **geisha** — population 10, status [-1, -1]
- **eta** — population 10, status [-2, -2]

The purpose of this file ultimately is so that when we do implement the game logic we don't have to handle each individual citizen out of a population of 12 million and instead we can handle the bulk of the population (peasants) with fewer programming objects since the ratio is 1 object to 100 peasants.

---

## 4. Implementation Phases

Instead of building each file to completion one at a time, work proceeds in
**horizontal passes**. Every phase touches the same small set of *core* files
and adds one new tier of the production chain across all of them at once. This
keeps every file internally consistent at every step: after each phase the data
set is self-contained and simulatable for the tiers completed so far.

**Core files touched each phase:**

| File | When touched |
|------|--------------|
| `item_type.json` | Every phase (add the new items for that tier). |
| `job_type.json` | Every phase (add the jobs that make/handle them). |
| `building_type.json` | Every phase (add the buildings + recipes). |
| `resource_output_type.json` | **Phase 1 only** (maps map resource tiles → raw-resource buildings). |
| `citizen_type.json` | **Phase 1** (foundation) and **Phase 11** (population). |

Each phase is one PR. Every referenced ID must already exist (raws before
processed, processed before combined, etc.), so phases are strictly ordered.
Split `item_type.json` into `item_type_<category>.json` files (see §2/§3.1) as
soon as a phase would make it unwieldy.

### Phase 1 — Base (raw) resources from the map (done)
- `citizen_type.json`: finalize the caste list from §3.9 (mostly already set up).
- `item_type.json`: the raw resource(s) each `resource`-layer tile yields
  (iron ore, lumber, rice, silk, tea, ore, clay, stone, etc.) plus their raw
  by-products.
- `job_type.json`: harvesting jobs (miner, lumberjack, rice farmer, herder…).
- `building_type.json`: the buildings that output raw resources (iron mine,
  lumber mill, rice paddy, gold mine → gold ore, etc.).
- `resource_output_type.json`: 1:1 link from each land `resource` tile id to its
  producing building. Skip ocean tiles (they are hunted units).
- *Depends on:* none.

### Phase 2 — Processed resources (done)
- Items/jobs/buildings that refine raws into processed goods (gold ore → gold
  bars, lumber → planks, ore → ingots, rice → polished rice, silk → thread…).
- *Depends on:* Phase 1.

### Phase 3 — Combined (composite) resources (done)
- Items/jobs/buildings that blend processed goods into composites (copper + tin
  → bronze, alloys, dyed cloth, blended pigments…).
- *Depends on:* Phase 2.

### Phase 4 — Tools
- Items/jobs/buildings for tools (wood hammers, smith hammers, anvils,
  chopsticks, saws, practice swords, fishing nets…). Tools use the 1000-sub-unit
  convention (§2).
- *Depends on:* Phase 3.

### Phase 5 — Weapons & armor
- Items/jobs/buildings for weapons and armor (katana, yari, yumi, do-maru…).
  Counted in units of 1 (§2).
- *Depends on:* Phase 4 (tools/materials).

### Phase 6 — Vehicles
- Items/jobs/buildings for vehicles (fishing ships, merchant ships, merchant
  carts). Counted in units of 1.
- *Depends on:* Phase 4.

### Phase 7 — Entertainment
- Items/jobs/buildings for entertainment (performances, stories, pillow books,
  instruments…). Some items are `physical: false`.
- *Depends on:* Phase 3.

### Phase 8 — Food
- Items/jobs/buildings that turn raw/processed food into prepared dishes and
  drinks (sake, miso, bento, tea…).
- *Depends on:* Phase 3.

### Phase 9 — Clothing
- Items/jobs/buildings for clothing and fashion accessories (kimono, obi,
  sandals, hairpins…).
- *Depends on:* Phase 3.

### Phase 10 — Job-training buildings
- Buildings that transform jobs into other jobs via `input_job`/`output_job`
  (e.g. Ashigaru Military Training Grounds → spearmen, archers). Adds the new
  trained jobs to `job_type.json`.
- *Depends on:* Phases 4–5 (trainees need equipment).

### Phase 11 — Population / housing
- Housing buildings (merchant house, low-buge house, high-buge house, kuge
  house…) that create new citizens. Adds housing `building`-typed items to
  `item_type.json`, housing recipes to `building_type.json`, and wires the
  population output back to `citizen_type.json`.
- *Depends on:* Phases 1–9 (housing consumes finished goods).

### Later phases — remaining type files
Once the production chain (Phases 1–11) is complete, add the higher-level files
that reference it:

- **Settlements** — `settlement.json` instances placed from the `settlement`
  layer, wiring `buildings` → `building_type.json`. *Depends on: Phase 11.*
- **Units** — `unit_type.json` (equipment → items, optional job link).
  *Depends on: Phase 5.*
- **Strategic units** — `strategic_unit_type.json` composing `unit_type.json`
  entries. *Depends on: Units.*
- **Clan preferences** — `clan_preference.json` weighting desires per clan.
  *Depends on: Phases 7–9 (the items being preferred).*
- **Validation tooling** *(optional)* — a lightweight script/notes checking
  unique IDs per file, resolvable cross-file references, `quality` ∈
  {normal, high}, and boolean `physical`. *Depends on: the files it validates.*

---

## 5. Validation & Acceptance Criteria

For each data PR, reviewers confirm:

1. **Well-formed JSON**, 2-space indent, metadata header + data array.
2. **Unique IDs** within each type's ID space (including across split
   `item_type_*.json` files).
3. **Referential integrity:** every `id`/`jobId`/`typeId` referenced resolves in
   its target file (`item_type.json`, `job_type.json`, `building_type.json`,
   `unit_type.json`).
4. **Enum correctness:** `quality` ∈ {`normal`, `high`}; item `type` values come
   from the taxonomy; `physical` is boolean.
5. **Convention compliance:** durable tools use the 1000-sub-unit `qty`
   convention; buildings, vehicles, armor, and weapons are counted in units of 1;
   consumables use natural `qty` (§2).
6. **Ordering:** `job_type.json` desire arrays are sorted most→least desired.
7. **Coverage:** the `item_type.json` coverage checklist (§3.1) is satisfied for
   each resource-layer source touched by the phase.

---

## 6. Open Questions

- Confirm the proposed schemas for `settlement.json`, `unit_type.json`, and
  `strategic_unit_type.json` (§3.4–3.6) before filling in data.
- **Resource instances:** the narrative (§1) describes loading resource *tiles*
  with buildings, but §1 only lists `resource_output_type.json` (a type→building
  map). Decide whether a separate resource-instance file is needed (parallel to
  `settlement.json`) and, if so, name it and add its schema.
- Confirm whether housing in `job_type.json` references `building`-typed items in
  `item_type.json` or entries in `building_type.json` (current proposal:
  `building`-typed items in `item_type.json`, so a job can "want" a dwelling
  without a production recipe).
