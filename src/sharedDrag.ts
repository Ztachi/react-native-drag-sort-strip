import { useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

/**
 * Shared UI thread state for dragging synchronization.
 * Uses Reanimated SharedValues to update animations directly on the UI thread.
 */
export interface SharedDrag {
  /** Original index of the dragged item, -1 = not dragging */
  fromIdx: SharedValue<number>;
  /** Current target sort index (calculated in real-time during drag) */
  toIdx: SharedValue<number>;
  /** Screen absolute X of the item when drag activated (left edge) */
  startAbsX: SharedValue<number>;
  /** Screen absolute Y of the item when drag activated (top edge) */
  startAbsY: SharedValue<number>;
  /** Current screen absolute X of the overlay */
  overlayX: SharedValue<number>;
  /** Current screen absolute Y of the overlay */
  overlayY: SharedValue<number>;
  /** Screen absolute X of the Strip root container */
  stripAbsX: SharedValue<number>;
  /** Screen absolute Y of the Strip root container */
  stripAbsY: SharedValue<number>;
  /** Horizontal scroll offset (px) */
  scrollX: SharedValue<number>;
  /** Total item count (used to clamp target index) */
  count: SharedValue<number>;
  /** Whether the item is hovering over the drop zone */
  isOverDrop: SharedValue<boolean>;
}

/**
 * Creates all shared values for dragging.
 * Uses useMemo([]) to ensure the returned object reference is permanent,
 * preventing child components' useMemo gestures from being invalidated on every render.
 */
export function useSharedDrag(): SharedDrag {
  const fromIdx = useSharedValue(-1);
  const toIdx = useSharedValue(-1);
  const startAbsX = useSharedValue(0);
  const startAbsY = useSharedValue(0);
  const overlayX = useSharedValue(0);
  const overlayY = useSharedValue(0);
  const stripAbsX = useSharedValue(0);
  const stripAbsY = useSharedValue(0);
  const scrollX = useSharedValue(0);
  const count = useSharedValue(0);
  const isOverDrop = useSharedValue(false);

  return useMemo(
    () => ({
      fromIdx,
      toIdx,
      startAbsX,
      startAbsY,
      overlayX,
      overlayY,
      stripAbsX,
      stripAbsY,
      scrollX,
      count,
      isOverDrop,
    }),
    [
      fromIdx,
      toIdx,
      startAbsX,
      startAbsY,
      overlayX,
      overlayY,
      stripAbsX,
      stripAbsY,
      scrollX,
      count,
      isOverDrop,
    ]
  );
}
