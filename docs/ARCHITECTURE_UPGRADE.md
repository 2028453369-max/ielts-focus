# IELTS Focus architecture upgrade

This branch keeps the current IELTS Focus UI intact while replacing fragile
single-page/localStorage-only internals with small independent modules.

The design is independently implemented after reviewing several public IELTS
projects. No GPL source code is copied.

## What we are adopting as ideas

From mature IELTS practice apps:
- IndexedDB as the durable browser data store.
- Separate practice attempts from derived statistics.
- A material-library manifest instead of hard-coded file paths.
- Export/import backup so browser storage is not a single point of failure.
- Review scheduling based on practice history.
- Resource adapters so local files and cloud files use the same UI.

## Target modules

1. core-store.js
   - IndexedDB database
   - settings, progress, attempts, reviews
   - legacy migration from ieltsFocusAppV3
   - JSON backup/export

2. material-library.js
   - loads materials-manifest.json
   - builds GitHub Release asset URLs
   - category/search helpers
   - PDF/audio/video metadata

3. progress-engine.js
   - records attempts
   - derives daily/weekly statistics
   - wrong-answer queue
   - lightweight review scheduling

## Important constraint

The user's study plan stays intentionally light:
- workdays: 2 required tasks
- optional work never blocks progress
- no streak penalty or backlog pressure

The architecture should support this behavior rather than turn the app into a
high-pressure exam dashboard.
