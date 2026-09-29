<h1 align="center">react-native-circle-reveal-view</h1>

<p align="center">
  Reveal or hide any view with an animated expanding circle.<br/>
  Zero dependencies · TypeScript · native-driver animations · Expo & New Architecture ready
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-circle-reveal-view"><img src="https://img.shields.io/npm/v/react-native-circle-reveal-view.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/react-native-circle-reveal-view"><img src="https://img.shields.io/npm/dm/react-native-circle-reveal-view.svg" alt="npm downloads"></a>
  <a href="https://github.com/lvlrSajjad/react-native-circle-reveal-view/actions/workflows/ci.yml"><img src="https://github.com/lvlrSajjad/react-native-circle-reveal-view/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/react-native-circle-reveal-view.svg" alt="license"></a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/lvlrSajjad/react-native-circle-reveal-view/master/docs/demo.gif" width="300" alt="Circle reveal demo">
</p>

## Features

- **Pure JavaScript.** No native code, no linking, no extra dependencies. Works in Expo Go.
- **Native driver.** The circle scale and content fade run on the UI thread.
- **Any origin.** Reveal from any corner, any edge, or the center.
- **Container aware.** The circle is sized from the measured container, so it always covers it, on any screen.
- **Imperative and promise-based.** `expand()`, `collapse()` and `toggle()` resolve when the animation finishes.
- **Accessible.** Honors the OS "Reduce Motion" setting out of the box.
- **Typed.** Written in TypeScript with full JSDoc on every prop.
- **Works everywhere.** React Native 0.71+, React 18/19, Old and New Architecture, iOS, Android and Web.

## Installation

```bash
npm install react-native-circle-reveal-view
```

```bash
yarn add react-native-circle-reveal-view
```

No further setup. The package has no native code and no peer dependencies beyond `react` and `react-native`.

## Quick start

```tsx
import { useRef } from 'react';
import { Button, Text, View } from 'react-native';
import { CircleRevealView } from 'react-native-circle-reveal-view';
import type { CircleRevealViewRef } from 'react-native-circle-reveal-view';

export function Screen() {
  const revealRef = useRef<CircleRevealViewRef>(null);

  return (
    <View style={{ flex: 1 }}>
      <Button title="Toggle" onPress={() => revealRef.current?.toggle()} />

      <CircleRevealView
        ref={revealRef}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 240 }}
        backgroundColor="#1f6feb"
        duration={450}
        revealOrigin={{ bottom: true, right: true }}
      >
        <Text style={{ color: 'white', padding: 24 }}>Revealed content</Text>
      </CircleRevealView>
    </View>
  );
}
```

A complete, copy-pasteable screen lives in [`example/App.tsx`](./example/App.tsx).

## API

### `<CircleRevealView />`

Accepts every [`View`](https://reactnative.dev/docs/view#props) prop plus the following.

| Prop                    | Type                            | Default                                                                     | Description                                                                                                                |
| ----------------------- | ------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `children`              | `ReactNode`                     | —                                                                           | Content shown inside the revealed area. Mounted only while revealed.                                                       |
| `backgroundColor`       | `ColorValue`                    | `'#ffffff'`                                                                 | Fill color of the circle, which becomes the background of the revealed area.                                               |
| `duration`              | `number`                        | `500`                                                                       | Milliseconds for the circle to grow or shrink.                                                                             |
| `fadeDuration`          | `number`                        | `200`                                                                       | Milliseconds for the children to fade in after the circle, or out before it.                                               |
| `easing`                | `EasingFunction`                | `Easing.out(Easing.cubic)` on expand, `Easing.in(Easing.cubic)` on collapse | Easing for the circle animation.                                                                                           |
| `revealOrigin`          | [`RevealOrigin`](#revealorigin) | `{}` (center)                                                               | Corner or edge the circle grows from.                                                                                      |
| `style`                 | `StyleProp<ViewStyle>`          | —                                                                           | Style of the outer container. Usually absolutely positioned.                                                               |
| `contentContainerStyle` | `StyleProp<ViewStyle>`          | —                                                                           | Style of the wrapper around `children`.                                                                                    |
| `initiallyExpanded`     | `boolean`                       | `false`                                                                     | Start revealed, without animating.                                                                                         |
| `reduceMotion`          | `boolean \| 'system'`           | `'system'`                                                                  | `'system'` reveals instantly when the OS "Reduce Motion" setting is on. `true` is always instant, `false` always animates. |
| `onExpanded`            | `() => void`                    | —                                                                           | Called when the reveal animation finishes.                                                                                 |
| `onCollapsed`           | `() => void`                    | —                                                                           | Called when the hide animation finishes and children unmount.                                                              |
| `revealPositionArray`   | `RevealOrigin`                  | —                                                                           | **Deprecated.** Alias of `revealOrigin` kept for 0.x compatibility.                                                        |

### `RevealOrigin`

```ts
interface RevealOrigin {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}
```

Use at most one vertical flag and one horizontal flag. An axis you leave out is centered.

| Value                           | Circle grows from         |
| ------------------------------- | ------------------------- |
| `{ bottom: true, right: true }` | bottom-right corner       |
| `{ top: true, left: true }`     | top-left corner           |
| `{ bottom: true }`              | middle of the bottom edge |
| `{ left: true }`                | middle of the left edge   |
| `{}`                            | center of the view        |

### Ref: `CircleRevealViewRef`

| Method         | Returns         | Description                                                                                                   |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `expand()`     | `Promise<void>` | Mounts the children and plays the reveal. Resolves when done. No-op if already revealed or animating.         |
| `collapse()`   | `Promise<void>` | Plays the hide animation and unmounts the children. Resolves when done. No-op if already hidden or animating. |
| `toggle()`     | `Promise<void>` | `expand()` when hidden, `collapse()` when revealed.                                                           |
| `isExpanded()` | `boolean`       | `true` while revealed, including during the reveal animation.                                                 |

```tsx
await revealRef.current?.expand();
console.log(revealRef.current?.isExpanded()); // true
```

## How it works

1. `expand()` mounts the container (with `overflow: 'hidden'`) and measures it.
2. A circle whose diameter is the larger side of the container is placed at the chosen origin and scaled from 0 until it covers the container's diagonal.
3. The children fade in on top. `collapse()` runs the same steps in reverse and unmounts the children.

Both animations use `useNativeDriver: true`. When the user has turned on "Reduce Motion" in iOS or Android accessibility settings, both steps run with a duration of `0`, so the content appears and disappears instantly while every callback and promise still fires. Override with the `reduceMotion` prop.

## Recipes

**Bottom sheet style action bar** (as in the demo above)

```tsx
<CircleRevealView
  ref={revealRef}
  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 220 }}
  backgroundColor="#1f6feb"
  revealOrigin={{ bottom: true, right: true }}
>
  {/* actions */}
</CircleRevealView>
```

**Full-screen overlay revealed from a button**

```tsx
<CircleRevealView
  ref={revealRef}
  style={StyleSheet.absoluteFill}
  backgroundColor="#000000cc"
  revealOrigin={{ top: true, right: true }}
  duration={600}
>
  {/* overlay */}
</CircleRevealView>
```

**Chaining with other animations**

```tsx
await revealRef.current?.expand();
await runNextAnimation();
```

## Migrating from 0.x

Version 1.0 is a rewrite. The old API still works, with these differences.

| 0.x                                                              | 1.x                                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `import CircleTransition from 'react-native-circle-reveal-view'` | Still works. Preferred: `import { CircleRevealView } from '...'`                    |
| Requires `react-native-animatable`                               | No dependencies. Uninstall `react-native-animatable` if nothing else uses it.       |
| `revealPositionArray={{ bottom: true }}`                         | Still works. Preferred: `revealOrigin={{ bottom: true }}`                           |
| `expand()` / `collapse()` / `toggle()` return `undefined`        | Return a `Promise<void>`                                                            |
| Circle sized from the window width                               | Circle sized from the measured container                                            |
| Class component, `ref` gives the instance                        | Function component, `ref` gives a [`CircleRevealViewRef`](#ref-circlerevealviewref) |
| No types                                                         | TypeScript types included                                                           |

## Requirements

- React Native 0.71 or newer (older versions will probably work but are untested)
- React 18 or newer
- Expo SDK 48 or newer if you use Expo

## Contributing

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run prepare   # builds lib/ with react-native-builder-bob
```

See [AGENTS.md](./AGENTS.md) for repository conventions (also useful for AI coding assistants) and [CHANGELOG.md](./CHANGELOG.md) for release notes.

## License

[Apache-2.0](./LICENSE) © Sajjad Asadi
