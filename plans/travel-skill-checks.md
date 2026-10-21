# Travel skill checks

Status: Complete.

## Confirmed decisions

- Use eight square-grid neighbors: N, NE, E, SE, S, SW, W, NW.
- Each method describes checks. It does not roll dice or inspect character skills.
- Do not check travel papers or skill permission flags.
- Terrain checks and traversal checks remain separate.
- A route can require both checks, including two river crossings.
- Return one `SkillCheck` or `null` from the terrain method.
- River and cliff methods return `SkillCheck[]`, with one entry per crossing.
- Return an empty array when the feature does not cross the route.
- Border checks use a separate module and return two alternative `SkillCheck` objects or `null`.
- Checkpoint alternatives are Forgery/Intelligence TN 20 and Stealth/Agility TN 20.
- A checkpoint requires different clan IDs and roads on both cells.
- Entering or leaving a neutral cell also crosses a border.
- Border, river, cliff, and ordinary terrain checks are independent. The caller decides priority.
- Terrain checks retain all Sailing logic for now, including river Sailing.
- Terrain checks no longer select river swimming or cliff climbing checks.
- Boats use Sailing/Intelligence instead of swimming.
- Shadowland land travel uses Lore: Shadowlands/Perception.
- Walking uses Athletics/Stamina when terrain exceeds the combined environmental modifier.
- Other land travel uses Survival/Perception.
- Crossing a cliff or swimming uses Athletics/Strength.
- Roads and footpaths bridge rivers.
- Bridges bypass swimming checks, but do not remove Sailing checks.
- Roads bypass cliffs. Footpaths bypass cliffs only for foot travel.
- Use saved river and cliff directions to distinguish crossing from parallel movement.
- Use neighboring cells to detect diagonal barriers between cells.

## TN rules

Start at TN 5. Add integer modifiers. The minimum TN is 5.

| Input | Modifier |
|-|-|
| Climate: temperate, tropical, desert, waste, polar, shadowland | 0, 1, 2, 3, 4, 5 |
| Water climate: temperate, tropical, desert, waste, polar, shadowland | 0, 0, 0, 0, 4, 5 |
| Terrain: flat, hills, wetlands, mountains, cliff | 0, 1, 2, 3, 4 |
| Vegetation | +1 |
| Water: inland, river downstream, river upstream, coast, ocean | 0, 4, 8, 12, 16 |
| Road | -4 |
| Footpath | -2 |
| River crossing base | 9 |
| Cliff crossing base | 9 |

Apply environmental modifiers to the selected check.
For boats, the water modifier replaces the land terrain modifier.
For land crossings, the crossing base replaces the land terrain modifier.
Infrastructure bonuses reduce exposure but do not reduce boat checks.
Ports do not reduce TN.
Upstream river crossings add 4.
The shared `RIVER_AGAINST_CURRENT_MODIFIER` table uses `false` for downstream and `true` for upstream.
Sailing and river crossing checks both use this table.
The separate `WATER_CLIMATE_MODIFIER` table applies to sailing, swimming, and river crossings.
Walking beside rivers, bridges, and cliff checks keep the land climate table.
Vegetation and infrastructure TN values use separate lookup tables.
Vegetation is the only cover input. There is no separate forest flag or modifier.
Each table lists every supported value, including values with a zero modifier.
All six TN modifier tables are exported from [terrain-skill-check-tn-modifiers.js](../docs/scripts/travel/terrain-skill-check-tn-modifiers.js).
The `TERRAIN_MODIFIER` table includes land and water terrain IDs.
Terrain checks and shared travel rules import their tables from that module.
Roads bridge inland water for land travel, but do not bridge coastal water or ocean.

## API

- Use numeric catalog IDs in map cells and string transport names from the speed module.
- Missing cell layers use the map's existing zero-value defaults.
- Reject invalid explicit values with `TypeError`.
- Movement direction uses the existing numeric order, from north at 0 to northwest at 7.
- `terrain-skill-check.js`: `getSkillAndTN(mode, cell, direction, isAgainstCurrent = false)`.
- `river-skill-check.js`: `getSkillAndTN(mode, cell, neighbors, direction, isAgainstCurrent = false)`.
- `cliff-skill-check.js`: `getSkillAndTN(mode, cell, neighbors, direction)`.
- Remove `terrain-traversal-skill-check.js` after moving its logic.
- `border-skill-check.js`: `getSkillAndTN(cell, destination)`.
- Border checks validate only clan and infrastructure IDs, with missing values set to zero.
- `neighbors` contains eight cells in direction order. Use `null` for cells outside the map.
- Each feature method checks the current cell and the diagonal barrier between neighboring cells.
- Return within-cell checks before diagonal crossing checks.
- Two separate crossings return two checks, even when their TNs match.
- Ordinary terrain checks retain land travel, open-water swimming, and Sailing.
- A clear land tile returns Survival/Perception TN 5.
- River flags follow the flow direction.
- Cardinal cliff flags identify the edge on the lower side.
- Diagonal cliff flags identify a normal to the cliff line.
- Active rivers and cliffs must have at least one saved direction.
- A diagonal river connects the two flanking cells across the movement line.
- Either flanking river can supply the connecting flow direction.
- A diagonal cliff requires matching cliff lines in both flanking cells.
- A continuous bridge or cliff bypass needs infrastructure on both route cells.
- Keep travel speed rules unchanged.

## Small PR sequence

Each change set must contain no more than 200 changed code lines.
Documentation does not count toward this limit.

1. Add shared input validation and directional crossing helpers.
   - Create `travel-skill-rules.js`.
   - Add tests for directions, validation, crossings, and parallel movement.
2. Replace terrain check selection and its core tests.
   - Update `terrain-skill-check.js` and the existing test cases within the 200-line limit.
   - Verify the single-check contract, transport modes, and basic TN values.
3. Complete terrain regression coverage.
   - Add tests for exact TN values, bridges, climate ordering, and skill traits.
4. Add separate border and terrain traversal checks.
   - Create `terrain-traversal-skill-check.js` and `border-skill-check.js`, with separate focused tests.
   - Verify rotated diagonal crossings and checkpoint alternatives within the 200-line limit.
5. Complete regression coverage and documentation.
   - Verify bridges, missing neighbors, priority, and separate tile and boundary checks.
   - Run the project format and lint script and focused regression tests.

No pull request or commit is created unless requested.

### River and cliff extraction

Use additional change sets of no more than 200 changed code lines:

1. Extract shared neighbor validation and add the river module.
   - Validate eight neighbors and the selected destination.
   - Move within-cell and diagonal river crossing detection into `river-skill-check.js`.
2. Add the cliff module and remove the combined traversal module.
   - Move both cliff crossing cases into `cliff-skill-check.js`.
   - Remove crossing selection from `terrain-skill-check.js`; preserve Sailing.
3. Replace combined traversal tests with river tests.
   - Check rotations, flow direction, bridges, climate, invalid inputs, and two crossings.
4. Add cliff tests and update ordinary terrain tests.
   - Check normals, bypasses, climate, invalid inputs, and two crossings.
   - Verify land and Sailing behavior after extraction.
5. Update API documentation and run focused tests and required lint checks.

## Validation

- All 190 focused border, terrain, river, cliff, and shared travel rule tests pass.
- New and updated skill modules have full line and branch coverage.
- JavaScript lint passes.
- The required format and lint script reports 12 existing HTML validation errors.
- Those errors are in `docs/character_creation/shugenja.html` and `docs/rules/movement.html`.
- Unrelated formatter changes were removed.
