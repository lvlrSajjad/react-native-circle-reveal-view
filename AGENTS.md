# AGENTS.md

Guidance for AI coding agents and human contributors working in this repository.

## What this package is

`react-native-circle-reveal-view` is a small, dependency-free React Native component that reveals or hides its children with an expanding circle animation. It is pure JavaScript/TypeScript: there is no native code, no autolinking and no config plugin.

- Public entry: `src/index.tsx`
- Component: `src/CircleRevealView.tsx` (single file, function component, `forwardRef`)
- Tests: `src/__tests__/`
- Example screen: `example/App.tsx` (type-checked, not a runnable app)
- Machine-readable summary: `llms.txt`

## Public API (keep stable)

- Named export `CircleRevealView` and default export (same component).
- Types `CircleRevealViewProps`, `CircleRevealViewRef`, `RevealOrigin`.
- Ref methods `expand()`, `collapse()`, `toggle()` return `Promise<void>`; `isExpanded()` returns `boolean`.
- Deprecated prop `revealPositionArray` must keep working as an alias of `revealOrigin`.

Any change to the API needs a README update, a CHANGELOG entry and a semver-appropriate version bump.

## Commands

```bash
npm install          # installs dev deps and runs `prepare` (bob build)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (flat config in eslint.config.mjs)
npm test             # jest with @react-native/jest-preset
npm run prepare      # build lib/ (commonjs + module + typescript)
npm run release:check
```

CI (`.github/workflows/ci.yml`) runs typecheck, lint, test and build on every push and pull request. All four must pass.

## Conventions

- TypeScript strict mode. No `any`. Prefer `import type` for types.
- Animations must keep `useNativeDriver: true`. Do not animate layout props (width, height, top, left).
- Do not add runtime dependencies. `react` and `react-native` are peer dependencies only.
- Do not add native code. If a feature needs it, it belongs in a different package.
- Keep the component in one file unless it grows past ~400 lines.
- Tests use `@testing-library/react-native` v14: `render`, `fireEvent` and `act` are async and must be awaited. Use `jest.useFakeTimers()` and `jest.advanceTimersByTime()` to drive `Animated`.
- Formatting is Prettier (config in `package.json`). Two spaces, single quotes, semicolons.
- Commit messages: short imperative subject, optional body. Conventional Commits prefixes (`feat:`, `fix:`, `docs:`, `chore:`) are welcome but not enforced.

## Releasing

1. Update `version` in `package.json` and add a section to `CHANGELOG.md`.
2. `npm run release:check` must pass.
3. Commit, tag `vX.Y.Z`, push with tags.
4. Create a GitHub release for the tag. `.github/workflows/publish.yml` publishes to npm with provenance.
   It needs either npm Trusted Publishing configured for this repository or an `NPM_TOKEN` secret.
   Manual alternative: `npm publish` from a clean checkout (`prepack` rebuilds `lib/`).

## Things that look wrong but are intentional

- `lib/` is git-ignored and built on `prepare`/`prepack`.
- The component returns `null` while collapsed so it does not affect layout when hidden.
- Before the first `onLayout`, the circle falls back to window-width sizing. This matches 0.x behaviour and only affects the first frame.
- `package.json` `types` points at `lib/typescript/commonjs/index.d.ts` (no `src/` segment) because `tsconfig.build.json` has a single root directory.
