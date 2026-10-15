# Beastiary encounters

Status: Planned. No PRs are complete.

## Goal

Select a specific creature when an encounter roll succeeds.
Base the selection on the map cell terrain, climate, vegetation, and river values.
Store creature data in [beastiary.js](../docs/scripts/beastiary.js).
Build weighted lookup tables in [encounter-check.js](../docs/scripts/encounter-check.js).

## Confirmed decisions

- Name the files `beast.js`, `beastiary.js`, `beast-selection.js`, and `skill-check.js`.
- Use the class names `Beast`, `BeastSelection`, `BeastiaryLookUpTable`, and `SkillCheck`.
- `Beast` holds creature data. `BeastSelection` holds one weighted lookup table entry.
- Add an `encounterType` field to `Beast`: `"spirit"`, `"shadowland"`, `"animal"`, or `"criminal"`.
- Build one lookup table for each encounter type and each terrain, climate, vegetation, and river combination.
- `rollEncounter` returns an array of `BeastSelection` instances. It returns one at most per encounter type.
- Map levels control only the encounter chance. They do not filter beasts by rank.
- If an encounter triggers and its table is empty, skip that encounter type.
- Remove `getSkillAndTN`. Use the beast `avoidSkillCheck` list instead.
- Skill checks use the shape `{ skill, trait, tn }`.
- A raw trait roll uses an empty `skill` string. Example: `{ skill: "", trait: "Stamina", tn: 15 }`.
- `impactSkillCheck` is an empty list for a fight. A non-empty list makes the encounter a skill trial.
- Keep all map inputs numeric. Use catalog `.id` values for terrain, climate, vegetation, and river.
- Keep `Math.random()` inside the module. Tests mock `Math.random()`.

## Class design

### `Beast` (beast.js)

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
| `avoidSkillCheck` | SkillCheck[] | Checks that avoid the creature if spotted. If empty then a spot check was sufficient, such as spotting a small snake before it bites. Spotting a flying Chimera however still requires a hide or horsemanship. |
| `escapeSkillCheck` | SkillCheck[] | Checks to escape the creature if not spotted (some will overlap with avoid). |
| `impactSkillCheck` | SkillCheck[] | Empty for a fight. Otherwise a skill trial. |

- The constructor validates all fields and throws `TypeError` for bad values.
- Instances and their lists are frozen.

### `BEASTIARY` (beastiary.js)

- Export `BEASTIARY`, a frozen array of all `Beast` entries.

### `SkillCheck` (skill-check.js)

- Fields: `skill` (string, can be empty), `trait` (string, not empty), `tn` (positive integer).
- Instances are frozen.
- Add `SkillCheck` to [coding-glossary.md](../coding-glossary.md).

### `BeastSelection` (beast-selection.js)

| Field | Type | Rule |
|-|-|-|
| `name` | string | Copied from `Beast`. |
| `encounterType` | string | One of the four encounter types. |
| `rank` | number | Integer from 1 to 5. |
| `selectionFrom` | number | Inclusive. |
| `selectionTo` | number | Exclusive. |
| `spotSkillCheck` | SkillCheck[] | Checks that detect the creature. |
| `avoidSkillCheck` | SkillCheck[] | Checks that avoid the creature if spotted. If empty then a spot check was sufficient, such as spotting a small snake before it bites. Spotting a flying Chimera however still requires a hide or horsemanship. |
| `escapeSkillCheck` | SkillCheck[] | Checks to escape the creature if not spotted (some will overlap with avoid). |
| `impactSkillCheck` | SkillCheck[] | Empty for a fight. Otherwise a skill trial. |

- Instances and their lists are frozen.

### `BeastiaryLookUpTable` (encounter-check.js)

| Field | Type |
|-|-|
| `terrain` | number |
| `climate` | number |
| `vegetation` | number |
| `river` | number |
| `diceRollSize` | number, starts at 0 |
| `beastList` | BeastSelection[] |

- `add(beast)`:
  1. Set `selectionFrom` to the current `diceRollSize`.
  2. Increase `diceRollSize` by `beast.weight`.
  3. Set `selectionTo` to the new `diceRollSize`.
  4. Append the new `BeastSelection` to `beastList`.
- `select()`:
  1. Return `undefined` if `diceRollSize` is 0.
  2. Roll `Math.floor(Math.random() * diceRollSize)`.
  3. Return the `BeastSelection` where `selectionFrom <= roll < selectionTo`.
- Freeze the table after the build is complete.

## Lookup table build

- Loop over each encounter type and each `TERRAIN`, `CLIMATE`, `VEGETATION`, and `RIVER` value.
- Add each `Beast` whose type and four ID lists match.
- Store tables in a private `Map`. Use a key built from the type and four IDs.
- Build all tables once when the module loads.
- Export `getLookUpTable(encounterType, terrain, climate, vegetation, river)`.

## `rollEncounter` signature

```js
rollEncounter(criminal, animal, spirit, shadowland, terrain, climate, vegetation, river)
```

- Validate the four levels as integers from 0 to 5.
- Validate terrain, climate, vegetation, and river as known catalog IDs.
- Roll each encounter type sequentially, stopping at the first encounter.
- select a beast from the matching table.
- Return the selected `BeastSelection`.

## Data guidance

- Use creature names and concepts only. Do not copy rulebook text or stat blocks.
- Do not use named, unique oni.
- Keep criminals to six entries. Each rank from 1 to 5 has at least one entry.
- Skip harmless animals.
- Omit legendary or unique beings: Phoenix, Kitsu, Akkorokamui, and the Great Sea Spider.
- Include Jinn as generic desert elementals. Do not use named Jinn.
- Include Mokumokuren only as a haunting of abandoned mountain or marsh shrines.
- Omit sentient races that are not threats: Nezumi and Busimin.
- Include Naga only as guardians of hidden marsh/forest cities
- Include Zokujin as territorial tunnel dwellers.

### TN guidance

- Base TN: 10 + 5 × rank.
- Spot checks use Perception. Examples: Hunting, Investigation, or Lore: Spirits.
- Avoid checks use Horsemanship (Agility), Athletics (Strength), or Stealth (Agility).
- Leave the avoid list empty when spotting the creature is enough. Example: a small snake.
- Escape checks use the same skills as avoid checks. Add 5 to the TN because the creature was not spotted.
- Do not leave the escape list empty.
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
| Giant Spider | 2 | 30 | FLAT, HILLS | TROPICAL | PRESENT | Any | I |
| Black Bear | 3 | 30 | HILLS, MOUNTAINS | TEMPERATE | PRESENT | Any | |
| Shark | 4 | 30 | COASTAL_WATER, OCEAN | TEMPERATE, TROPICAL | Any | Any | |
| Brown Bear | 3 | 20 | HILLS, MOUNTAINS | POLAR | Any | Any | |
| Lion | 3 | 15 | FLAT | TEMPERATE | NONE | Any | |
| Tiger | 3 | 15 | FLAT, HILLS | TROPICAL | PRESENT | Any | |

### Criminals

| Name | Rank | W | Terrain | Climate | Veg | River | I |
|-|-|-|-|-|-|-|-|
| Cutpurse | 1 | 20 | Land | Living climates | Any | Any | I |
| Peasant Bandits | 2 | 100 | Land | Living climates | Any | Any | |
| Ronin Bandits | 3 | 50 | Land | Living climates | Any | Any | |
| Smugglers | 3 | 10 | Water, WETLANDS | Living climates | NONE | NONE | |
| Pirates | 4 | 10 | COASTAL_WATER, OCEAN | Living climates | NONE | NONE | |
| Gaijin Bandits | 5 | 1 | Any | Living climates | Any | Any | |

### Shadowland creatures

All entries use the living and tainted climates unless noted.

| Name | Rank | W | Terrain | Climate | Veg | River | I |
|-|-|-|-|-|-|-|-|
| Bakemono Raiders | 1 | 80 | Land | All | Any | Any | |
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
| Kumo | 3 | 20 | HILLS, MOUNTAINS, WETLANDS | All | PRESENT | Any | |
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
| Ningyo | 3 | 10 | WATER, COASTAL_WATER, OCEAN, WETLANDS | Living | Any | Any | I |
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

### Desert creatures

Source: Burning Sands additions in [monsters.txt](../monsters.txt).
All entries use the DESERT climate unless noted.
Desert land: FLAT, HILLS, MOUNTAINS, CLIFF.
Manticore and Guawa are already in the animal roster. Do not add them again.
Giant Burrowing Worm is a sinkhole skill trial. Death-Worm stays a fight.

| Name | Type | Rank | W | Terrain | Climate | Veg | River | I |
|-|-|-|-|-|-|-|-|-|
| Silt-Stalker | animal | 2 | 30 | FLAT, WETLANDS | DESERT | NONE | Any | |
| Sun-Viper | animal | 2 | 30 | FLAT, HILLS | DESERT | Any | Any | I |
| Giant Tortoise | animal | 2 | 10 | FLAT | DESERT | Any | Any | |
| Flame-Core Scorpion | animal | 3 | 20 | FLAT, HILLS | DESERT | NONE | NONE | I |
| Sand-Drake | animal | 4 | 10 | FLAT, HILLS | DESERT | NONE | NONE | |
| Giant Burrowing Worm | animal | 5 | 3 | FLAT | DESERT | NONE | NONE | I |
| Hanajin | spirit | 3 | 15 | Desert land | DESERT | Any | Any | I |
| Qabalistic Phantom | spirit | 3 | 10 | Desert land | DESERT, WASTE | Any | Any | I |
| Obsidian Golem | spirit | 4 | 8 | HILLS, MOUNTAINS, CLIFF | DESERT | Any | Any | |
| Flame Jinn | spirit | 4 | 5 | Desert land | DESERT | NONE | Any | |
| Sea Jinn | spirit | 4 | 5 | WATER, COASTAL_WATER | DESERT | Any | Any | I |
| Wind Jinn | spirit | 4 | 5 | Desert land | DESERT | Any | Any | I |
| Sand Jinn | spirit | 4 | 5 | FLAT, HILLS | DESERT | NONE | Any | |
| Ka Jinn | spirit | 5 | 2 | Desert land | DESERT | Any | Any | I |
| Grave-Ghoul | shadowland | 2 | 30 | FLAT, HILLS | DESERT, WASTE | Any | Any | |
| Jackal Fiend | shadowland | 3 | 20 | Desert land | DESERT, WASTE | Any | Any | |
| Khadi Horror | shadowland | 4 | 10 | Desert land | DESERT, WASTE | Any | Any | |
| Ashalan Abomination | shadowland | 5 | 3 | Desert land | DESERT | Any | Any | |

Impact checks for desert entries:
- Sun-Viper: Medicine (Intelligence) or raw Stamina against heat-stroke venom.
- Flame-Core Scorpion: Medicine (Intelligence) or raw Stamina against burning venom.
- Giant Burrowing Worm: Athletics (Agility) to escape the sinkhole.
- Hanajin: Investigation (Perception) to find the impostor.
- Qabalistic Phantom: raw Willpower to resist the magical backlash.
- Sea Jinn: Athletics (Strength) to survive the flood.
- Wind Jinn: Athletics (Strength) or raw Stamina to endure the tornado.
- Ka Jinn: raw Willpower, or Etiquette (Awareness) to bargain.

### Mountain creatures

Source: mountain additions in [monsters.txt](../monsters.txt).
Tengu, Kenku, Satori, Gaki, and Nue are already in the spirit roster. Do not add them again.
Mountain land: HILLS, MOUNTAINS, CLIFF.

| Name | Type | Rank | W | Terrain | Climate | Veg | River | I |
|-|-|-|-|-|-|-|-|-|
| Oni-bi | spirit | 1 | 30 | MOUNTAINS, CLIFF, WETLANDS | TEMPERATE, POLAR, TROPICAL | Any | Any | I |
| Zokujin | spirit | 2 | 20 | MOUNTAINS, CLIFF | Living | Any | Any | |
| Mokumokuren | spirit | 2 | 10 | Mountain land, WETLANDS | TEMPERATE, POLAR, TROPICAL | Any | Any | I |
| Yama-bito | spirit | 2 | 25 | Mountain land | TEMPERATE, POLAR | Any | Any | |
| Yama-uba | spirit | 3 | 15 | Mountain land, WETLANDS | TEMPERATE, POLAR, TROPICAL | PRESENT | Any | |
| Mountain Troll | animal | 4 | 10 | MOUNTAINS, CLIFF | TEMPERATE, POLAR | Any | Any | |

Notes for mountain entries:
- Oni-bi: Athletics (Agility) to avoid a fall from the cliff edge or into deep mud.
- Mokumokuren: raw Willpower to resist fear in the haunted shrine.
- Yama-bito and Yama-uba disguise themselves. Add 5 to their spot TN.
- Mountain Troll is not Tainted. It is separate from the Shadowlands Troll.

### Swamp creatures

Source: swamp additions in [monsters.txt](../monsters.txt).
These entries already exist: Bog Hag, Kumo, Kappa, Ningyo, Yama-uba, Oni-bi, Gaki, and Mokumokuren.
Kumo, Ningyo, Yama-uba, Oni-bi, and Mokumokuren now include WETLANDS. Do not add them again.
Bakemono Raiders cover all goblins, including Mud, Swamp, and Mountain Goblins. Do not add goblin variants.
Giant Alligator is a mundane animal. Wani stays a separate spirit.
Swamp Troll is not Tainted. It is separate from the Shadowlands Troll.

| Name | Type | Rank | W | Terrain | Climate | Veg | River | I |
|-|-|-|-|-|-|-|-|-|
| Great Marsh Leech | animal | 1 | 40 | WETLANDS, WATER | TEMPERATE, TROPICAL | Any | Any | I |
| Mizugumo | animal | 2 | 25 | WETLANDS, WATER | TEMPERATE, TROPICAL | Any | Any | |
| Giant Alligator | animal | 3 | 20 | WETLANDS, WATER | TROPICAL | Any | Any | |
| Swamp Troll | animal | 4 | 10 | WETLANDS | TEMPERATE, TROPICAL | Any | Any | |
| Hydra | animal | 5 | 2 | WETLANDS, COASTAL_WATER | TEMPERATE, TROPICAL | Any | Any | |
| Yurei | spirit | 2 | 25 | WETLANDS | Living | Any | Any | I |
| Gokuri | spirit | 2 | 20 | WETLANDS | Living, WASTE | Any | Any | |
| Corrupted Water Kami | spirit | 3 | 10 | WETLANDS, WATER | Living | Any | Any | I |
| Naga Guardian | spirit | 3 | 5 | WETLANDS | TROPICAL | PRESENT | Any | |
| Marsh Undead | shadowland | 2 | 30 | WETLANDS | All | Any | Any | |
| Sanjuro | shadowland | 3 | 15 | WETLANDS | All | Any | Any | |

Notes for swamp entries:
- Great Marsh Leech: Medicine (Intelligence) or raw Stamina against blood loss.
- Yurei: raw Willpower to resist fear.
- Corrupted Water Kami: Athletics (Strength) to escape the drowning vortex.
- Mizugumo and Sanjuro ambush from hiding. Add 5 to their spot TN.

## PR breakdown

Each PR is 200 lines or fewer, including tests.

### PR 1: Beast classes

- Create [skill-check.js](../docs/scripts/skill-check.js) with `SkillCheck`.
- Create [beast.js](../docs/scripts/beast.js) with `Beast`.
- Create [beastiary.js](../docs/scripts/beastiary.js). Export an empty frozen `BEASTIARY` array.
- Create `tests/skill-check.test.mjs` and `tests/beast.test.mjs` for field validation and immutability.
- Add `SkillCheck` to [coding-glossary.md](../coding-glossary.md).

Acceptance criteria:
- Invalid names, types, ranks, weights, IDs, and skill checks throw `TypeError`.
- An empty `escapeSkillCheck` list throws `TypeError`.
- Instances and their lists are frozen.

### PR 2: Animals and criminals

- Add the animal and criminal roster entries to `BEASTIARY`.
- Add tests for entry counts, unique names, and at least one criminal for each rank.

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

### PR 7: Desert creatures

- Add all entries from the Desert creatures roster.
- Add tests for entry counts and unique names across the full `BEASTIARY`.

Acceptance criteria:
- Manticore and Guawa appear once only.
- Each Jinn uses only the DESERT climate.

### PR 8: Mountain creatures

- Add all entries from the Mountain creatures roster.
- Add tests for entry counts and unique names across the full `BEASTIARY`.

Acceptance criteria:
- Tengu, Kenku, Satori, Gaki, and Nue appear once only.
- Mountain Troll and Shadowlands Troll are separate entries.

### PR 9: Swamp creatures

- Add all entries from the Swamp creatures roster.
- Add tests for entry counts and unique names across the full `BEASTIARY`.

Acceptance criteria:
- Existing swamp entries appear once only and include WETLANDS.
- No goblin variant is a separate entry.
- Giant Alligator and Wani are separate entries.

### PR 10: Lookup tables and encounter selection

- Create [beast-selection.js](../docs/scripts/beast-selection.js) with `BeastSelection`.
- Add `BeastiaryLookUpTable` to [encounter-check.js](../docs/scripts/encounter-check.js).
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
- `rollEncounter` returns `BeastSelection` instances in input order.
