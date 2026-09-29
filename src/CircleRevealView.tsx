import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import type {
  ColorValue,
  EasingFunction,
  LayoutChangeEvent,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native';

/**
 * Where the reveal circle grows from.
 *
 * Combine at most one vertical flag (`top` / `bottom`) with at most one horizontal flag
 * (`left` / `right`). Omitting an axis centers the circle on that axis, so an empty object
 * reveals from the center of the view.
 *
 * @example { bottom: true, right: true } // grows from the bottom-right corner
 * @example { top: true }                 // grows from the top-center edge
 * @example {}                            // grows from the center
 */
export interface RevealOrigin {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

/**
 * Imperative handle exposed through `ref`.
 */
export interface CircleRevealViewRef {
  /** Mounts the children and plays the reveal animation. Resolves when the animation finishes. */
  expand: () => Promise<void>;
  /** Plays the hide animation and unmounts the children. Resolves when the animation finishes. */
  collapse: () => Promise<void>;
  /** Calls `expand` when hidden and `collapse` when visible. */
  toggle: () => Promise<void>;
  /** `true` while the view is revealed (including while it is animating in). */
  isExpanded: () => boolean;
}

export interface CircleRevealViewProps extends Omit<ViewProps, 'style' | 'children'> {
  /** Content rendered inside the revealed area. */
  children?: React.ReactNode;
  /**
   * Fill color of the expanding circle. Becomes the background of the revealed area.
   * @default '#ffffff'
   */
  backgroundColor?: ColorValue;
  /**
   * Duration in milliseconds of the circle scale animation (both expand and collapse).
   * @default 500
   */
  duration?: number;
  /**
   * Duration in milliseconds of the children fade-in/fade-out that follows the circle.
   * @default 200
   */
  fadeDuration?: number;
  /**
   * Easing used for the circle scale animation.
   * @default Easing.out(Easing.cubic)
   */
  easing?: EasingFunction;
  /**
   * Corner or edge the circle grows from. See {@link RevealOrigin}.
   * @default {} (center)
   */
  revealOrigin?: RevealOrigin;
  /**
   * @deprecated Use `revealOrigin`. Kept for backwards compatibility with 0.x.
   */
  revealPositionArray?: RevealOrigin;
  /**
   * Style applied to the outer container. Usually you want to position it absolutely.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Style applied to the wrapper around `children`.
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Render the view already revealed on first mount, without animating.
   * @default false
   */
  initiallyExpanded?: boolean;
  /**
   * Controls the animation when the user has enabled "Reduce Motion" in their OS settings.
   * - `'system'`: follow the OS setting; when it is on, reveal and hide instantly (no animation).
   * - `true`: always instant.
   * - `false`: always animate, ignoring the OS setting.
   * @default 'system'
   */
  reduceMotion?: boolean | 'system';
  /** Called after the reveal animation has finished. */
  onExpanded?: () => void;
  /** Called after the hide animation has finished and children have been unmounted. */
  onCollapsed?: () => void;
}

const DEFAULT_DURATION = 500;
const DEFAULT_FADE_DURATION = 200;
const DEFAULT_BACKGROUND = '#ffffff';
// Small safety margin so anti-aliased circle edges never peek through at the corners.
const COVERAGE_MARGIN = 1.05;

interface Size {
  width: number;
  height: number;
}

/** Tracks the OS "Reduce Motion" setting. Only subscribes when `enabled` is true. */
function useSystemReduceMotion(enabled: boolean): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch(() => {
        // Native module unavailable (e.g. tests, some web setups): keep animating.
      });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      if (active) setReduced(value);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [enabled]);
  return enabled && reduced;
}

/**
 * Animated view that reveals or hides its children with an expanding circle.
 *
 * Control it imperatively through the ref: `expand()`, `collapse()`, `toggle()`.
 * Animations run on the native driver.
 */
export const CircleRevealView = forwardRef<CircleRevealViewRef, CircleRevealViewProps>(
  function CircleRevealView(
    {
      children,
      backgroundColor = DEFAULT_BACKGROUND,
      duration = DEFAULT_DURATION,
      fadeDuration = DEFAULT_FADE_DURATION,
      easing,
      revealOrigin,
      revealPositionArray,
      style,
      contentContainerStyle,
      initiallyExpanded = false,
      reduceMotion = 'system',
      onExpanded,
      onCollapsed,
      ...viewProps
    },
    ref
  ) {
    const origin = revealOrigin ?? revealPositionArray ?? {};
    const window = useWindowDimensions();
    const systemReduceMotion = useSystemReduceMotion(reduceMotion === 'system');
    const instant = reduceMotion === true || systemReduceMotion;

    const [visible, setVisible] = useState(initiallyExpanded);
    const [size, setSize] = useState<Size | null>(null);

    // 0 = fully collapsed, 1 = fully expanded. Interpolated to the real scale below.
    const [progress] = useState(() => new Animated.Value(initiallyExpanded ? 1 : 0));
    const [contentOpacity] = useState(() => new Animated.Value(initiallyExpanded ? 1 : 0));

    const animatingRef = useRef(false);
    const visibleRef = useRef(initiallyExpanded);
    const mountedRef = useRef(true);
    const pendingExpandRef = useRef<((finished: boolean) => void) | null>(null);
    const runningRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        runningRef.current?.stop();
      };
    }, []);

    // Until the container has been measured, fall back to the window width like 0.x did.
    const measured: Size = size ?? { width: window.width, height: window.width };
    const diameter = Math.max(measured.width, measured.height, 1);
    const targetScale = useMemo(() => {
      const diagonal = Math.hypot(measured.width, measured.height);
      return (diagonal / (diameter / 2)) * COVERAGE_MARGIN;
    }, [measured.width, measured.height, diameter]);

    const scale = useMemo(
      () => progress.interpolate({ inputRange: [0, 1], outputRange: [0.00001, targetScale] }),
      [progress, targetScale]
    );

    const circlePosition = useMemo<ViewStyle>(() => {
      const half = diameter / 2;
      const vertical: ViewStyle = origin.top
        ? { top: -half }
        : origin.bottom
          ? { bottom: -half }
          : { top: measured.height / 2 - half };
      const horizontal: ViewStyle = origin.left
        ? { left: -half }
        : origin.right
          ? { right: -half }
          : { left: measured.width / 2 - half };
      return { ...vertical, ...horizontal };
    }, [
      diameter,
      measured.width,
      measured.height,
      origin.top,
      origin.bottom,
      origin.left,
      origin.right,
    ]);

    const onLayout = useCallback(
      (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((prev) =>
          prev && prev.width === width && prev.height === height ? prev : { width, height }
        );
        viewProps.onLayout?.(event);
      },
      [viewProps]
    );

    const timing = useCallback(
      (value: Animated.Value, toValue: number, ms: number, ease?: EasingFunction) =>
        Animated.timing(value, {
          toValue,
          duration: ms,
          easing: ease,
          useNativeDriver: true,
        }),
      []
    );

    // The expand animation must start after the container has mounted, so it is kicked off here.
    useEffect(() => {
      if (!visible || !pendingExpandRef.current) return;
      const done = pendingExpandRef.current;
      pendingExpandRef.current = null;

      const animation = Animated.sequence([
        timing(progress, 1, instant ? 0 : duration, easing ?? Easing.out(Easing.cubic)),
        timing(contentOpacity, 1, instant ? 0 : fadeDuration),
      ]);
      runningRef.current = animation;
      animation.start(({ finished }) => {
        runningRef.current = null;
        animatingRef.current = false;
        if (finished && mountedRef.current) onExpanded?.();
        done(finished);
      });
    }, [
      visible,
      progress,
      contentOpacity,
      timing,
      duration,
      fadeDuration,
      easing,
      instant,
      onExpanded,
    ]);

    const expand = useCallback((): Promise<void> => {
      if (animatingRef.current || visibleRef.current) return Promise.resolve();
      animatingRef.current = true;
      visibleRef.current = true;
      return new Promise<void>((resolve) => {
        pendingExpandRef.current = () => resolve();
        setVisible(true);
      });
    }, []);

    const collapse = useCallback((): Promise<void> => {
      if (animatingRef.current || !visibleRef.current) return Promise.resolve();
      animatingRef.current = true;
      visibleRef.current = false;

      return new Promise<void>((resolve) => {
        const animation = Animated.parallel([
          timing(contentOpacity, 0, instant ? 0 : fadeDuration),
          timing(progress, 0, instant ? 0 : duration, easing ?? Easing.in(Easing.cubic)),
        ]);
        runningRef.current = animation;
        animation.start(({ finished }) => {
          runningRef.current = null;
          animatingRef.current = false;
          if (finished && mountedRef.current) {
            setVisible(false);
            onCollapsed?.();
          }
          resolve();
        });
      });
    }, [contentOpacity, progress, timing, duration, fadeDuration, easing, instant, onCollapsed]);

    const toggle = useCallback(
      () => (visibleRef.current ? collapse() : expand()),
      [collapse, expand]
    );

    useImperativeHandle(
      ref,
      () => ({ expand, collapse, toggle, isExpanded: () => visibleRef.current }),
      [expand, collapse, toggle]
    );

    if (!visible) return null;

    return (
      <View
        accessibilityState={{ expanded: true }}
        {...viewProps}
        onLayout={onLayout}
        style={[style, styles.container]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.circle,
            circlePosition,
            {
              width: diameter,
              height: diameter,
              borderRadius: diameter / 2,
              backgroundColor,
              transform: [{ scale }],
            },
          ]}
        />
        <Animated.View style={[styles.content, contentContainerStyle, { opacity: contentOpacity }]}>
          {children}
        </Animated.View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
  },
  content: {
    flex: 1,
  },
});

export default CircleRevealView;
