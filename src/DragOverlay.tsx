import React from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { StyleSheet } from "react-native";
import type { SharedDrag } from "./sharedDrag";

interface DragOverlayProps {
  /** Content to follow the finger (provided by parent) */
  children: React.ReactElement | null;
  /** Shared drag state */
  shared: SharedDrag;
  /** Item width */
  itemWidth: number;
  /** Item height */
  itemHeight: number;
  /** Strip root view layout Y offset relative to parent container (if needed for padding etc., default 0) */
  stripLayoutOffsetY?: number;
}

/**
 * Floating overlay that follows the finger, absolutely positioned over the strip.
 * Updates position directly on the UI thread via SharedValue for zero frame delay.
 */
export function DragOverlay({
  children,
  shared,
  itemWidth,
  itemHeight,
  stripLayoutOffsetY = 0,
}: DragOverlayProps): React.ReactElement | null {
  const style = useAnimatedStyle(() => {
    const isDragging = shared.fromIdx.value !== -1;
    if (!isDragging) return { opacity: 0, pointerEvents: "none" };

    // Convert screen absolute coordinates to coordinates relative to the strip root container
    const left = shared.overlayX.value - shared.stripAbsX.value;
    const top = shared.overlayY.value - shared.stripAbsY.value + stripLayoutOffsetY;

    return {
      opacity: 1,
      transform: [{ translateX: left }, { translateY: top }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { width: itemWidth, height: itemHeight }, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 999,
    // Shadow to enhance "floating" effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
});
