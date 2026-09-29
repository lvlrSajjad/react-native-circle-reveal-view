# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-09-29

### Added

- `reduceMotion` prop (`'system'` | `true` | `false`, default `'system'`). When the OS "Reduce Motion"
  accessibility setting is on, reveal and hide happen instantly. Callbacks and promises still fire.

### Fixed

- Closed the long-standing "Better documentation" issue with the new README.

## [1.0.0] - 2026-09-29

Complete rewrite for current React Native.

### Added

- TypeScript source with exported `CircleRevealViewProps`, `CircleRevealViewRef` and `RevealOrigin` types.
- Named export `CircleRevealView` (the default export is kept).
- `revealOrigin` prop (replaces `revealPositionArray`, which still works).
- `fadeDuration`, `easing`, `contentContainerStyle` and `initiallyExpanded` props.
- `onExpanded` and `onCollapsed` callbacks.
- `expand()`, `collapse()` and `toggle()` now return a `Promise<void>` that resolves when the animation finishes.
- `isExpanded()` on the ref.
- The circle is sized from the measured container instead of the window width, so it always covers the view.
- All `View` props are forwarded to the container.
- Dual CommonJS and ES module build via `react-native-builder-bob`, with `exports` map.
- Unit tests, ESLint, CI on GitHub Actions, `llms.txt` and `AGENTS.md`.

### Changed

- Function component with hooks instead of a class component.
- **Breaking:** `react-native-animatable` is no longer required. The fade is done with `Animated`.
- **Breaking:** requires React Native 0.71+ and React 18+.
- License field corrected to `Apache-2.0`.

### Removed

- Dependency on `react-native-animatable`.

## [0.0.2] - 2022-05-14

- Bug fix release.

## [0.0.1] - 2019

- Initial release.

[1.1.0]: https://github.com/lvlrSajjad/react-native-circle-reveal-view/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/lvlrSajjad/react-native-circle-reveal-view/compare/v0.0.2...v1.0.0
[0.0.2]: https://github.com/lvlrSajjad/react-native-circle-reveal-view/releases/tag/v0.0.2
