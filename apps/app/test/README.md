# @m5/app Testing

## Architecture

This app uses **`node:test`** with **`tsx`** (esbuild-powered TS loader) for testing.

### Test files

- **`*.test.ts`** — Pure logic tests. These import data/config modules and test
  pure functions without React rendering. **All pass** ✅
- **`screens/**/*.test.tsx`** — Component rendering tests using
  `react-test-renderer`. These are **SKIPPED** by the default `pnpm test`
  command due to a known esbuild limitation.

## Known Issue: esbuild × react-native

**Root cause**: esbuild v0.25.9 (used by tsx v4) cannot transform
`react-native/index.js` (v0.74.5) because it uses a `typeof` pattern
that esbuild's parser flags as unexpected.

```
Error: Transform failed with 1 error:
react-native/index.js:14:7: ERROR: Unexpected "typeof"
```

This affects any test file that:
1. Has `.test.tsx` extension (tsx uses a different transform path for JSX)
2. Directly or transitively imports (or has `require` for) `react-native`

The 4 affected files:
- `screens/cs/CustomerFeedbackScreen.test.tsx`
- `screens/home/HomeScreen.test.tsx`
- `screens/scan/ScanScreen.test.tsx`
- `screens/settings/SettingsScreen.test.tsx`

### Resolution path

These component rendering tests need vitest with:

```json
{
  "test": {
    "environment": "node",
    "server": { "deps": { "inline": ["react-native"] } }
  }
}
```

And a `react-native` mock module for the node test environment.

## Running tests

```bash
# Logic tests (222 tests, all pass)
pnpm test

# Render tests (needs vitest setup — not yet configured)
pnpm test:render
```
