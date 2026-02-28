import React, { useCallback, useMemo, useRef } from "react";
import Animated, { runOnJS, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { SharedDrag } from "./sharedDrag";

const SPRING_CFG = { mass: 0.4, damping: 18, stiffness: 220 } as const;

interface SortItemProps<T> {
  index: number;
  itemKey: string;
  children: React.ReactElement;
  shared: SharedDrag;
  itemWidth: number;
  itemGap: number;
  longPressDuration: number;
  onPress: (key: string) => void;
}

/**
 * A single sortable list item.
 *
 * Minimal responsibilities:
 *  - Handles "Short Tap" (Gesture.Tap) only.
 *  - Plays spring animation to shift position based on shared.fromIdx / toIdx (other items making way).
 *  - Opacity -> 0 when being dragged (floating overlay is rendered at DragSortStrip level).
 *
 * Drag gestures are handled entirely by the Strip-level GestureDetector in DragSortStrip,
 * avoiding issues with Pan gestures nested inside ScrollView getting cancelled or stuck.
 */
function SortItemInner<T>(props: SortItemProps<T>): React.ReactElement {
  const { index, itemKey, children, shared, itemWidth, itemGap, longPressDuration } = props;

  // ── Stable callback ref: avoids useMemo dependency on onPress changes ──
  const onPressRef = useRef(props.onPress);
  onPressRef.current = props.onPress;
  const stablePress = useCallback((key: string) => onPressRef.current(key), []);

  // ── Tap Gesture (Short press for selection) ──
  // maxDuration is slightly shorter than longPressDuration to ensure Tap fails
  // before the Strip-level Pan activates at longPressDuration, avoiding conflicts.
  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(longPressDuration - 10)
        .onEnd(() => {
          "worklet";
          runOnJS(stablePress)(itemKey);
        }),
    [itemKey, longPressDuration, stablePress]
  );

  // ── Spring Displacement: Other items shift to make way ──
  const animStyle = useAnimatedStyle(() => {
    const from = shared.fromIdx.value;
    const to = shared.toIdx.value;
    if (from === -1 || from === index) {
      return { transform: [{ translateX: 0 }] };
    }
    const step = itemWidth + itemGap;
    let shift = 0;
    if (from < index && index <= to) shift = -step; // Shift left
    else if (to <= index && index < from) shift = step; // Shift right
    return { transform: [{ translateX: withSpring(shift, SPRING_CFG) }] };
  });

  // ── Transparent when being dragged (Overlay takes over) ──
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: shared.fromIdx.value === index ? 0 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[animStyle, opacityStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}

export const SortItem = React.memo(SortItemInner) as typeof SortItemInner;
