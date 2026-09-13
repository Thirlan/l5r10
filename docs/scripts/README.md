# Script data notes

## `travel-time.csv`

- The file starts with a `schema` column set to `kmph-v1`, followed by a `kmph` column that stores sustained travel speed in kilometers per hour.
- `-1` still means the travel combination is forbidden.
- The previous `Time to travel` header was replaced, so any importer of this file should now read the `kmph` column and can use `schema=kmph-v1` to distinguish the new format.
