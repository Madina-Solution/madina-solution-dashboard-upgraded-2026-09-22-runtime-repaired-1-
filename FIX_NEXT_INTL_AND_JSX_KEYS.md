# Fix: next-intl dependency + product JSX keys

`package.json` already declares `next-intl` as a production dependency. If the editor still reports `Cannot find module 'next-intl/plugin'` or `next-intl/server`, rebuild the dependency tree from the project root:

```bash
rm -rf node_modules .next
npm install next-intl@4.14.5
npm install
```

Then restart VS Code's TypeScript server and run:

```bash
npm run typecheck
npm run lint
npm run build
```

The product detail JSX key warnings were fixed in source by storing component references (`Clock3`, `Truck`, `Package`, `ShieldCheck`) in the data array and rendering them with a component key-safe map, instead of creating JSX elements inside the source array.
