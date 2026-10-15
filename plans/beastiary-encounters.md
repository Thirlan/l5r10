# Beastiary encounters

Status: Planned. No PRs are complete.

## Goal

Select a specific creature when an encounter roll succeeds.
Base the selection on the map cell terrain, climate, vegetation, and river values.
Store creature data in [beastiary.js](../docs/scripts/beastiary.js).
Build weighted lookup tables in [encounter-check.js](../docs/scripts/encounter-check.js).

## Confirmed decisions

- Name the file `beastiary.js`. Keep the class names `Beastiary`, `BeastiaryLookUpTable`, and `Beast`.
- Add an `encounterType` field to `Beastiary`: `"spirit"`, `"shadowland"`, `"animal"`, or `"criminal"`.
- Build one lookup table for each encounter type and each terrain, climate, vegetation, and river combination.
- `rollEncounter` returns an array of `Beast` instances. It returns one beast at most per encounter type.
- Map levels control only the encounter chance. They do not filter beasts by rank.
- If an encounter triggers and its table is empty, skip that encounter type.
- Remove `getSkillAndTN`. Use the beast `avoidSkillCheck` list instead.
- Skill checks use the shape `{ skill, trait, tn }`.
- A raw trait roll uses an empty `skill` string. Example: `{ skill: "", trait: "Stamina", tn: 15 }`.
- `impactSkillCheck` is an empty list for a fight. A non-empty list makes the encounter a skill trial.
- Keep all map inputs numeric. Use catalog `.id` values for terrain, climate, vegetation, and river.
- Keep `Math.random()` inside the module. Tests mock `Math.random()`.

## Class design

### `Beastiary` (beastiary.js)

| Field | Type | Rule |
|-|-|-|
| `name` | string | Not empty. |
| `encounterType` | string | One of the four encounter types. |
| `rank` | number | Integer from 1 to 5. |
| `weight` | number | Integer from 1 to 100. 1 is unlikely; 100 is very likely. |
| `terrain` | number[] | Valid `TERRAIN` IDs. Not empty. |
| `climate` | number[] | Valid `CLIMATE` IDs. Not empty. |
| `vegetation` | number[] | Valid `VEGETATION` IDs. Not empty. |
| `river` | number[] | Valid `RIVER` IDs. Not empty. |
| `spotSkillCheck` | SkillCheck[] | Checks that detect the creature. |
| `avoidSkillCheck` | SkillCheck[] | Alternative checks that avoid the creature. |
| `impactSkillCheck` | SkillCheck[] | Empty for a fight. Otherwise a skill trial. |

- The constructor validates all fields and throws `TypeError` for bad values.
- Instances and their lists are frozen.
- Export `BEASTIARY`, a frozen array of all entries.

### `SkillCheck` (skill-check.js)

- Fields: `skill` (string, can be empty), `trait` (string, not empty), `tn` (positive integer).
- Instances are frozen.
- Add `SkillCheck` to [coding-glossary.md](../coding-glossary.md).

### `Beast` (encounter-check.js)

| Field | Type |
|-|-|
| `name` | string |
| `rank` | number, 1 to 5 |
| `selectionFrom` | number, inclusive |
| `selectionTo` | number, exclusive |
| `spotSkillCheck` | SkillCheck[] |
| `avoidSkillCheck` | SkillCheck[] |
| `impactSkillCheck` | SkillCheck[] |

### `BeastiaryLookUpTable` (encounter-check.js)

| Field | Type |
|-|-|
| `terrain` | number |
| `climate` | number |
| `vegetation` | number |
| `river` | number |
| `diceRollSize` | number, starts at 0 |
| `beastList` | Beast[] |

- `add(beastiary)`:
  1. Set `selectionFrom` to the current `diceRollSize`.
  2. Increase `diceRollSize` by `beastiary.weight`.
  3. Set `selectionTo` to the new `diceRollSize`.
  4. Append the new `Beast` to `beastList`.
- `select()`:
  1. Return `undefined` if `diceRollSize` is 0.
  2. Roll `Math.floor(Math.random() * diceRollSize)`.
  3. Return the beast where `selectionFrom <= roll < selectionTo`.
- Freeze the table after the build is complete.

## Lookup table build

- Loop over each encounter type and each `TERRAIN`, `CLIMATE`, `VEGETATION`, and `RIVER` value.
- Add each `Beastiary` entry whose type and four ID lists match.
- Store tables in a private `Map`. Use a key built from the type and four IDs.
- Build all tables once when the module loads.
- Export `getLookUpTable(encounterType, terrain, climate, vegetation, river)`.

## `rollEncounter` signature

```js
rollEncounter(spirit, shadowland, animal, criminal, terrain, climate, vegetation, river)
```

- Validate the four levels as integers from 0 to 5.
- Validate terrain, climate, vegetation, and river as known catalog IDs.
- Roll each encounter type independently, as now.
- For each triggered type, select a beast from the matching table.
- Return the selected `Beast` instances in input order.

## Data guidance

- Use creature names and concepts only. Do not copy rulebook text or stat blocks.
- Do not use named, unique oni.
- Keep criminals to five entries, one for each rank.
- Skip harmless animals.
- Omit legendary or unique beings: Phoenix, Kitsu, Jinn, Akkorokamui, and the Great Sea Spider.
- Omit indoor phenomena, such as Mokumokuren.
- Omit sentient races that are not threats: Naga, Nezumi, and Busimin.

### TN guidance

- Base TN: 10 + 5 × rank.
- Spot checks use Perception. Examples: Hunting, Investigation, or Lore: Spirits.
- Avoid checks use Horsemanship (Agility), Athletics (Strength), or Stealth (Agility).
- Stealthy creatures add 5 to the spot TN.
- Fast or flying creatures add 5 to the Athletics and Horsemanship avoid TN.
- Impact checks use Medicine (Intelligence), raw Stamina, raw Willpower, or Etiquette (Awareness).

### Habitat short names

- Land: FLAT, HILLS, MOUNTAINS, WETLANDS, CLIFF.
- Water: WATER, COASTAL_WATER, OCEAN.
- Living climates: TEMPERATE, TROPICAL, DESERT, POLAR.
- Tainted climates: WASTE, SHADOWLAND.
- Any: all values in the catalog.

## Roster

`W` is weight. `Veg` is vegetation. `I` means a non-empty `impactSkillCheck`.

### Animals

| Name | Rank | W | Terrain | Climate | Veg | River | I |
|-|-|-|-|-|-|-|-|
| Wild Dog Pack | 1 | 60 | FLAT, HILLS | TEMPERATE, DESERT | Any | Any | |
| Mamushi Viper | 1 | 50 | FLAT, HILLS, WETLANDS | TEMPERATE, TROPICAL | PRESENT | Any | I |
| Giant Hornet Swarm | 1 | 40 | FLAT, HILLS | TEMPERATE, TROPICAL | PRESENT | Any | I |
| Mukade Centipede | 1 | 30 | FLAT, WETLANDS | TROPICAL | PRESENT | Any | I |
| Scorpion | 1 | 40 | FLAT, HILLS | DESERT | NONE | NONE | I |
| Death-Worm | 4 | 10 | FLAT | DESERT | NONE | NONE | |
| Jackal Pack | 1 | 30 | FLAT, HILLS | DESERT | Any | Any | |
| Griffon | 4 | 10 | FLAT, HILLS, MOUNTAINS | DESERT | Any | Any | |
| Manticore | 4 | 10 | FLAT, HILLS, MOUNTAINS | DESERT | Any | Any | |
| Guawa | 4 | 10 | FLAT, HILLS, MOUNTAINS | DESERT | Any | Any | |
| Rattlesnake | 2 | 10 | FLAT, HILLS, MOUNTAINS | DESERT | Any | Any | |
| Jellyfish Bloom | 1 | 30 | COASTAL_WATER, OCEAN | TEMPERATE, TROPICAL | Any | Any | I |
| Serow Stampede | 1 | 20 | MOUNTAINS, CLIFF | TEMPERATE, POLAR | Any | Any | |
| Boar | 2 | 50 | HILLS, MOUNTAINS | TEMPERATE | PRESENT | Any | |
| Wolf Pack | 2 | 50 | FLAT, HILLS, MOUNTAINS | TEMPERATE, POLAR | Any | Any | |
| Mountain Ape Troop | 2 | 30 | MOUNTAINS, CLIFF | TEMPERATE, POLAR | Any | Any | |
| Wild Horse Stampede | 2 | 20 | FLAT | TEMPERATE, DESERT | NONE | Any | I |
| Shinomen Spider | 2 | 30 | FLAT, HILLS | TROPICAL | PRESENT | Any | I |
| Black Bear | 3 | 30 | HILLS, MOUNTAINS | TEMPERATE | PRESENT | Any | |
| Shark | 4 | 30 | COASTAL_WATER, OCEAN | TEMPERATE, TROPICAL | Any | Any | |
| Brown Bear | 3 | 20 | HILLS, MOUNTAINS | POLAR | Any | Any | |
| Lion | 3 | 15 | FLAT | TEMPERATE | NONE | Any | |
| Tiger | 3 | 15 | FLAT, HILLS | TROPICAL | PRESENT | Any | |

### Criminals

| Name | Rank | W | Terrain | Climate | Veg | River | I |
|-|-|-|-|-|-|-|-|
| Cutpurse | 1 | 100 | Land | Living climates | Any | Any | I |
| Peasant Bandits | 2 | 100 | Land | Living climates | Any | Any | |
| Ronin Bandit Gang | 3 | 50 | Land | Living climates | Any | Any | |
| Smugglers | 4 | 30 | Water, WETLANDS | Living climates | Any | Any | |
| Gaijin Bandit Gang | 5 | 1 | Any | Living climates | Any | Any | I |

### Shadowland creatures

All entries use the living and tainted climates unless noted.

| Name | Rank | W | Terrain | Climate | Veg | River | I |
|-|-|-|-|-|-|-|-|
| Bakemono Raiders | 1 | 80 | Land | All | Any | Any | |
| Swamp Goblins | 1 | 40 | WETLANDS | All | Any | Any | |
| Mountain Goblins | 1 | 40 | HILLS, MOUNTAINS, CLIFF | All | Any | Any | |
| Pekkle no Oni | 1 | 30 | Land | All | Any | Any | I |
| Zombie Peasants | 1 | 50 | Land | All | Any | Any | |
| Shadow Wing | 1 | 30 | Land | All | Any | Any | |
| Gokimono Swarm | 2 | 30 | FLAT, WETLANDS | All | Any | Any | I |
| Hounds of the Lost | 2 | 30 | Land | All | Any | Any | |
| Skeletal Bushi | 2 | 40 | Land | All | Any | Any | |
| Kyofu | 2 | 20 | Land | All | Any | Any | I |
| Kyorinrin | 2 | 10 | Land | All | Any | Any | |
| Penanggalan | 3 | 20 | Land | All | Any | Any | |
| Harionago | 3 | 15 | Land | All | PRESENT | Any | |
| Bog Hag | 3 | 20 | WETLANDS | All | Any | Any | |
| Kumo | 3 | 20 | HILLS, MOUNTAINS | All | PRESENT | Any | |
| Ashi no Oni | 3 | 20 | Land | All | Any | Any | |
| Suiteiru no Oni | 3 | 20 | Water, WETLANDS | All | Any | Any | |
| Kansen Possession | 3 | 15 | Any | All | Any | Any | I |
| Shadowlands Troll | 4 | 25 | Land | All | Any | Any | |
| Shadowlands Ogre | 4 | 20 | Land | All | Any | Any | |
| Revenant | 4 | 15 | Land | All | Any | Any | |
| Onikage Rider | 4 | 10 | FLAT, HILLS | All | Any | Any | |
| Bonestealer | 4 | 10 | Land | All | Any | Any | |
| Skull Tide | 4 | 10 | FLAT, HILLS | All | Any | Any | |
| Uragirimono | 4 | 10 | Land | All | Any | Any | |
| Shokushu no Oni | 4 | 10 | Land, Water | All | Any | Any | |
| Sodatsu no Oni | 4 | 10 | Land | All | Any | Any | I |
| Tsuburu no Oni | 5 | 5 | Land | All | Any | Any | |
| Shikibu no Oni | 5 | 5 | Land | All | Any | Any | I |
| Ryu Saino Oni | 5 | 3 | Any | All | Any | Any | |
| Ashura | 5 | 3 | Land | All | Any | Any | |
| Gashadokuro | 5 | 3 | FLAT, HILLS | All | Any | Any | I |

### Spirits

All entries use the living climates unless noted.

| Name | Rank | W | Terrain | Climate | Veg | River | I |
|-|-|-|-|-|-|-|-|
| Hinotoma | 1 | 50 | FLAT, WETLANDS | Living | Any | Any | I |
| Kodama | 1 | 40 | Land | TEMPERATE, TROPICAL | PRESENT | Any | I |
| Mujina | 1 | 40 | FLAT, HILLS | Living | Any | Any | I |
| Tanuki | 1 | 50 | FLAT, HILLS | TEMPERATE | PRESENT | Any | I |
| Yobuko | 1 | 30 | MOUNTAINS, CLIFF | Living | Any | Any | I |
| Amikiri | 1 | 30 | WATER, COASTAL_WATER, WETLANDS | Living | Any | Any | I |
| Basan | 1 | 20 | HILLS, MOUNTAINS | TEMPERATE, TROPICAL | PRESENT | Any | I |
| Gaki | 2 | 40 | Land | Living, WASTE | Any | Any | |
| Kappa | 2 | 50 | WATER, WETLANDS, FLAT | TEMPERATE, TROPICAL | Any | PRESENT | |
| Kitsune | 2 | 30 | FLAT, HILLS | TEMPERATE | PRESENT | Any | I |
| Bakeneko | 2 | 30 | FLAT, HILLS | TEMPERATE, TROPICAL | Any | Any | |
| Koumori | 2 | 20 | HILLS, MOUNTAINS, CLIFF | Living | Any | Any | |
| Shojo | 2 | 20 | COASTAL_WATER, OCEAN | TEMPERATE, TROPICAL | Any | Any | I |
| Ubume | 2 | 20 | FLAT, HILLS, WETLANDS | Living | Any | Any | I |
| Fudoshi Tanglevine | 2 | 20 | FLAT, HILLS | TROPICAL, TEMPERATE | PRESENT | Any | |
| Kenku | 3 | 15 | MOUNTAINS, CLIFF | TEMPERATE | PRESENT | Any | |
| Tengu | 3 | 20 | MOUNTAINS, CLIFF | TEMPERATE, POLAR | Any | Any | |
| Konaki-jiji | 3 | 15 | FLAT, HILLS | Living | Any | Any | I |
| Nure-onna | 3 | 15 | WATER, COASTAL_WATER, WETLANDS | TEMPERATE, TROPICAL | Any | Any | |
| Nekomata | 3 | 15 | HILLS, MOUNTAINS | TEMPERATE | PRESENT | Any | |
| Satori | 3 | 15 | MOUNTAINS | TEMPERATE, POLAR | PRESENT | Any | I |
| Spirit Hound | 3 | 15 | Land | Living | Any | Any | |
| Yuki-onna | 3 | 30 | MOUNTAINS, HILLS, FLAT | POLAR | Any | Any | I |
| Ningyo | 3 | 10 | COASTAL_WATER, OCEAN | Living | Any | Any | I |
| Onryo | 4 | 10 | Land | Living, WASTE | Any | Any | |
| Toshigoku Spirit | 4 | 10 | FLAT, HILLS | Living, WASTE | Any | Any | |
| Returned Spirit | 4 | 10 | Land | Living, WASTE | Any | Any | I |
| Wanyudo | 4 | 8 | FLAT, HILLS | Living | NONE | Any | |
| Nue | 4 | 8 | HILLS, MOUNTAINS | TEMPERATE, TROPICAL | PRESENT | Any | |
| Wani | 4 | 10 | WATER, WETLANDS | TROPICAL | Any | PRESENT | |
| Isonade | 4 | 8 | OCEAN, COASTAL_WATER | Living | Any | Any | |
| Goryo | 5 | 3 | Land | Living, WASTE | Any | Any | I |
| Orochi | 5 | 3 | OCEAN, WATER | Living | Any | Any | |
| Ki-rin | 5 | 2 | FLAT, HILLS, MOUNTAINS | TEMPERATE | PRESENT | Any | I |

## PR breakdown

Each PR is 200 lines or fewer, including tests.

### PR 1: Beastiary classes

- Create [beastiary.js](../docs/scripts/beastiary.js) with `SkillCheck` and `Beastiary`.
- Export an empty frozen `BEASTIARY` array.
- Create `tests/beastiary.test.mjs` for field validation and immutability.
- Add `SkillCheck` to [coding-glossary.md](../coding-glossary.md).

Acceptance criteria:
- Invalid names, types, ranks, weights, IDs, and skill checks throw `TypeError`.
- Instances and their lists are frozen.

### PR 2: Animals and criminals

- Add the animal and criminal roster entries to `BEASTIARY`.
- Add tests for entry counts, unique names, and one criminal for each rank.

### PR 3: Shadowland creatures, part 1

- Add ranks 1 to 3 from the Shadowland roster.

### PR 4: Shadowland creatures, part 2

- Add ranks 4 and 5 from the Shadowland roster.
- Add tests for entry counts and unique names.

### PR 5: Spirits, part 1

- Add ranks 1 and 2 from the spirit roster.

### PR 6: Spirits, part 2

- Add ranks 3 to 5 from the spirit roster.
- Add tests for entry counts and unique names.

### PR 7: Lookup tables and encounter selection

- Add `Beast` and `BeastiaryLookUpTable` to [encounter-check.js](../docs/scripts/encounter-check.js).
- Build all lookup tables when the module loads.
- Export `getLookUpTable`.
- Extend `rollEncounter` with terrain, climate, vegetation, and river.
- Remove `getSkillAndTN` and the `ENCOUNTERS` TN values.
- Update `tests/encounter-check.test.mjs`.

Acceptance criteria:
- Selection ranges are contiguous and start at 0.
- `diceRollSize` equals the sum of the matching weights.
- The roll boundaries select the correct beast.
- Empty tables skip the encounter type.
- `rollEncounter` returns `Beast` instances in input order.
