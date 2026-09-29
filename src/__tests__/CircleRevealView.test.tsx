import React, { createRef } from 'react';
import { AccessibilityInfo, Animated, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { CircleRevealView } from '../CircleRevealView';
import type { CircleRevealViewRef } from '../CircleRevealView';

const DURATION = 300;
const FADE = 100;

async function renderView(props: Partial<React.ComponentProps<typeof CircleRevealView>> = {}) {
  const ref = createRef<CircleRevealViewRef>();
  const utils = await render(
    <CircleRevealView
      ref={ref}
      testID="reveal"
      duration={DURATION}
      fadeDuration={FADE}
      revealOrigin={{ bottom: true, right: true }}
      {...props}
    >
      <Text>Hello</Text>
    </CircleRevealView>
  );
  return { ref, ...utils };
}

async function runAnimation(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  // The RN jest preset ships shared jest.fn() mocks (e.g. AccessibilityInfo); clear their history.
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CircleRevealView', () => {
  it('renders nothing until expanded', async () => {
    await renderView();
    expect(screen.queryByText('Hello')).toBeNull();
    expect(screen.queryByTestId('reveal')).toBeNull();
  });

  it('renders children immediately when initiallyExpanded', async () => {
    const { ref } = await renderView({ initiallyExpanded: true });
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(ref.current?.isExpanded()).toBe(true);
  });

  it('expand() mounts children and resolves after the animation', async () => {
    const onExpanded = jest.fn();
    const { ref } = await renderView({ onExpanded });

    let settled = false;
    await act(async () => {
      void ref.current!.expand().then(() => {
        settled = true;
      });
    });

    expect(screen.getByText('Hello')).toBeTruthy();
    expect(ref.current?.isExpanded()).toBe(true);
    expect(onExpanded).not.toHaveBeenCalled();

    await runAnimation(DURATION + FADE + 50);

    expect(settled).toBe(true);
    expect(onExpanded).toHaveBeenCalledTimes(1);
  });

  it('collapse() unmounts children after the animation', async () => {
    const onCollapsed = jest.fn();
    const { ref } = await renderView({ initiallyExpanded: true, onCollapsed });

    await act(async () => {
      void ref.current!.collapse();
    });
    // Still mounted while animating out.
    expect(screen.getByText('Hello')).toBeTruthy();

    await runAnimation(DURATION + 50);

    expect(screen.queryByText('Hello')).toBeNull();
    expect(ref.current?.isExpanded()).toBe(false);
    expect(onCollapsed).toHaveBeenCalledTimes(1);
  });

  it('toggle() alternates between expanded and collapsed', async () => {
    const { ref } = await renderView();

    await act(async () => {
      void ref.current!.toggle();
    });
    await runAnimation(DURATION + FADE + 50);
    expect(ref.current?.isExpanded()).toBe(true);
    expect(screen.getByText('Hello')).toBeTruthy();

    await act(async () => {
      void ref.current!.toggle();
    });
    await runAnimation(DURATION + 50);
    expect(ref.current?.isExpanded()).toBe(false);
    expect(screen.queryByText('Hello')).toBeNull();
  });

  it('ignores calls while an animation is running', async () => {
    const onExpanded = jest.fn();
    const { ref } = await renderView({ onExpanded });

    await act(async () => {
      void ref.current!.expand();
      void ref.current!.collapse(); // ignored: still animating in
    });
    await runAnimation(DURATION + FADE + 50);

    expect(onExpanded).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('sizes the circle from the measured container', async () => {
    const { ref } = await renderView();
    await act(async () => {
      void ref.current!.expand();
    });

    await fireEvent(screen.getByTestId('reveal'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 200 } },
    });
    await runAnimation(DURATION + FADE + 50);

    const container = screen.getByTestId('reveal');
    const circle = container.children[0] as unknown as { props: { style: unknown } };
    expect(circle.props.style).toEqual(
      expect.objectContaining({
        width: 300,
        height: 300,
        borderRadius: 150,
        bottom: -150,
        right: -150,
      })
    );
  });

  it('still accepts the deprecated revealPositionArray prop', async () => {
    const ref = createRef<CircleRevealViewRef>();
    await render(
      <CircleRevealView ref={ref} initiallyExpanded revealPositionArray={{ top: true, left: true }}>
        <Text>Legacy</Text>
      </CircleRevealView>
    );
    expect(screen.getByText('Legacy')).toBeTruthy();
  });

  describe('reduceMotion', () => {
    // The jest preset's native animated mock ends every animation after a fixed timer,
    // so we assert on the durations handed to Animated.timing instead of on elapsed time.
    const timingDurations = (spy: jest.SpyInstance) =>
      spy.mock.calls.map((call) => (call[1] as { duration?: number }).duration);

    it('reveals instantly when reduceMotion is true', async () => {
      const timing = jest.spyOn(Animated, 'timing');
      const onExpanded = jest.fn();
      const { ref } = await renderView({ reduceMotion: true, onExpanded });
      await act(async () => {
        void ref.current!.expand();
      });
      expect(timingDurations(timing)).toEqual([0, 0]);
      await runAnimation(DURATION + FADE + 50);
      expect(onExpanded).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Hello')).toBeTruthy();
      timing.mockRestore();
    });

    it('follows the OS setting by default', async () => {
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValueOnce(true);
      const timing = jest.spyOn(Animated, 'timing');

      const { ref, unmount } = await renderView();
      await act(async () => {}); // let the isReduceMotionEnabled promise settle
      expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalledTimes(1);
      expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
        'reduceMotionChanged',
        expect.any(Function)
      );

      await act(async () => {
        void ref.current!.expand();
      });
      expect(timingDurations(timing)).toEqual([0, 0]);

      const listener = (AccessibilityInfo.addEventListener as jest.Mock).mock;
      const index = listener.calls.findIndex((call) => call[0] === 'reduceMotionChanged');
      const subscription = listener.results[index]!.value as { remove: jest.Mock };
      await unmount();
      expect(subscription.remove).toHaveBeenCalled();
      timing.mockRestore();
    });

    it('ignores the OS setting when reduceMotion is false', async () => {
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValueOnce(true);
      const timing = jest.spyOn(Animated, 'timing');

      const { ref } = await renderView({ reduceMotion: false });
      await act(async () => {});
      expect(AccessibilityInfo.isReduceMotionEnabled).not.toHaveBeenCalled();

      await act(async () => {
        void ref.current!.expand();
      });
      expect(timingDurations(timing)).toEqual([DURATION, FADE]);
      timing.mockRestore();
    });
  });
});
