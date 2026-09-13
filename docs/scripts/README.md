# Script data notes

## `travel-time.csv`

- The file keeps `kmph` as the first column for the numeric speed value and appends a trailing `schema` column set to `kmph-v1` to identify the format explicitly.
- `-1` still means the travel combination is forbidden.
- The previous `Time to travel` header was replaced, so any importer of this file should now read the `kmph` column and can use `schema=kmph-v1` to distinguish the new format.
