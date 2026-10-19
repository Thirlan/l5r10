# Shugenja Spell Metadata

## Goal

Standardize the spell tables in `docs/character_creation/shugenja.html`.

## Scope

- Format each spell table with consistent indentation.
- Add Casting Time after Ring/Mastery, based on Mastery Level unless the spell specifies another time.
- Use Flavor for narrative text and Effect for mechanical outcomes.
- Preserve existing spell content and existing Flavor/Effect rows.
- Correct malformed table markup found during the update.

## Acceptance Criteria

- Every spell table has Ring/Mastery, Casting Time, Flavor, and Effect rows.
- Each standard Casting Time equals one Complex Action per Mastery Level.
- Each explicit casting-time exception retains its stated duration.
- No Description rows remain in spell tables.
- All table and row tags are balanced and consistently indented.
- The explanatory spell-descriptor list defines Casting Time, Flavor, and Effect.
