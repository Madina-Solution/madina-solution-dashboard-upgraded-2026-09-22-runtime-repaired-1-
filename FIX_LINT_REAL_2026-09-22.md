# Real lint repair — 2026-09-22

The remaining ESLint failures were repaired without disabling the rules:

- Finance transaction filtering no longer uses manual `useMemo` where the React Compiler could not preserve it.
- Admin Messages initial fetch is deferred through browser callbacks and interval cleanup is explicit.
- Admin Messages selection cleanup happens in event handlers rather than synchronous state mutation inside effects.
- Customer notification UI uses visibility-aware background refresh.
