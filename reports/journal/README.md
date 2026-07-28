Flight recorders, one file per run: `<UTC date>-<slot|manual>.md`. Written
incrementally (the engine appends via RUN_JOURNAL; the run appends at step
boundaries) and committed with whatever lands next, so a run that dies still
leaves evidence. Prune files older than 14 days when adding a new one.
