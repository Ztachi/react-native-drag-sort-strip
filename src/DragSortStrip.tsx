/**
 * DragSortStrip — Horizontal Sortable Strip with 2D free drag and external Drop Zone deletion support.
 *
 * ── Architecture Key ──
 * The drag Pan gesture is registered on the Strip root view (parent of ScrollView), not inside items.
 * This ensures that ScrollView's scrollEnabled changes or NativeViewGestureHandler configs
 * do not affect the Pan gesture lifecycle, completely solving "onStart fires but onUpdate/onEnd doesn't" issues.
 *
 * ── Interaction Flow ──
 *  1. Long press item (longPressDuration ms) -> item transparent + floating overlay appears + haptic
 *  2. Drag overlay:
 *     - Horizontal: other items spring aside to make room, reorder on release
 *     - Drag upwards into drop zone: zone highlights + haptic
 *  3. Release:
 *     - In drop zone -> Delete (callback)
 *     - Otherwise -> Reorder (snap to new position)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { runOnJS, useAnimatedScrollHandler } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { SortItem } from "./SortItem";
import { DragOverlay } from "./DragOverlay";
import { useSharedDrag } from "./sharedDrag";
import type { DragSortStripProps } from "./types";

const LOG = "[DragSortStrip]";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

/** Clamp value between min and max (callable from worklet) */
function clamp(v: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(v, min), max);
}

export function DragSortStrip<T>(props: DragSortStripProps<T>): React.ReactElement {
  const {
    data,
    keyExtractor,
    renderItem,
    renderDragOverlayItem,
    onReorder,
    onItemPress,
    onDragStart,
    onEnterDropZone,
    onLeaveDropZone,
    dropZone,
    itemWidth,
    itemHeight,
    itemGap = 0,
    contentPaddingHorizontal = 12,
    contentPaddingVertical = 10,
    longPressDuration = 250,
    style,
  } = props;

  // ── React State (Only for controlling ScrollView and Drop Zone UI) ──
  const [isDragging, setIsDragging] = useState(false);
  const [isOverDrop, setIsOverDrop] = useState(false);
  /** Key of the currently dragged item, used for rendering overlay content */
  const dragKeyRef = useRef<string | undefined>(undefined);

  // ── Shared Values (Direct UI thread manipulation, zero latency) ──
  const shared = useSharedDrag();

  // Sync count when data changes
  useEffect(() => {
    shared.count.value = data.length;
  }, [data.length, shared.count]);

  // ── Refs ──
  const rootRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);

  // ── Scroll Offset Tracking ──
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      shared.scrollX.value = e.contentOffset.x;
    },
  });

  // ── Measure Strip Absolute Coordinates ──
  const measureStrip = useCallback(() => {
    rootRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      shared.stripAbsX.value = pageX;
      shared.stripAbsY.value = pageY;
      // eslint-disable-next-line no-console
      // console.log(LOG, "strip measured:", { pageX, pageY });
    });
  }, [shared.stripAbsX, shared.stripAbsY]);

  // ── JS Thread Callbacks (Proxied via ref to ensure stableXxx references never change) ──
  // Key Design: stripPanGesture is created once via useMemo and never recreated.
  // JS handlers like handleActivate / handleRelease might update with data changes.
  // Using ref proxy allows worklet to always call the latest version.

  const handleActivate = useCallback(
    (idx: number) => {
      const item = data[idx];
      if (!item) return;
      const key = keyExtractor(item);
      dragKeyRef.current = key;
      setIsDragging(true);
      // Disable scrolling during drag
      scrollRef.current?.setNativeProps({ scrollEnabled: false });
      onDragStart?.();
    },
    [data, keyExtractor, onDragStart]
  );

  const handleEnterDrop = useCallback(() => {
    setIsOverDrop(true);
    onEnterDropZone?.();
  }, [onEnterDropZone]);

  const handleLeaveDrop = useCallback(() => {
    setIsOverDrop(false);
    onLeaveDropZone?.();
  }, [onLeaveDropZone]);

  const handleRelease = useCallback(
    (from: number, to: number, isDrop: boolean) => {
      setIsDragging(false);
      setIsOverDrop(false);
      scrollRef.current?.setNativeProps({ scrollEnabled: true });

      const item = data[from];
      if (!item) return; // Should not happen

      if (isDrop && dropZone) {
        // Trigger drop (delete)
        dropZone.onDrop(keyExtractor(item));
      } else if (from !== to) {
        // Trigger reorder
        // Construct new array
        const newData = [...data];
        const [moved] = newData.splice(from, 1);
        newData.splice(to, 0, moved);
        const newKeys = newData.map(keyExtractor);
        onReorder(newKeys);
      }
      dragKeyRef.current = undefined;
    },
    [data, dropZone, keyExtractor, onReorder]
  );

  // Stable Refs
  const onActivateRef = useRef(handleActivate);
  onActivateRef.current = handleActivate;
  const onEnterDropRef = useRef(handleEnterDrop);
  onEnterDropRef.current = handleEnterDrop;
  const onLeaveDropRef = useRef(handleLeaveDrop);
  onLeaveDropRef.current = handleLeaveDrop;
  const onReleaseRef = useRef(handleRelease);
  onReleaseRef.current = handleRelease;

  // ── Global Pan Gesture (Registered on Root View) ──
  const stripPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(longPressDuration)
        .onStart((e) => {
          "worklet";
          // 1. Calculate which item is pressed based on absolute coordinates
          // Absolute X on screen
          const absX = e.absoluteX;
          // Relative X inside ScrollView content = absX - stripAbsX + scrollX - padding
          const relX =
            absX -
            shared.stripAbsX.value +
            shared.scrollX.value -
            contentPaddingHorizontal;

          // Item full width (width + gap)
          const step = itemWidth + itemGap;
          // Index = floor(relX / step)
          const idx = Math.floor(relX / step);

          // Boundary check
          if (idx < 0 || idx >= shared.count.value) {
            // Clicked outside items (padding area), cancel gesture
            return; // TODO: Can we cancel manually? Usually fail()
          }

          // Initialize shared values
          shared.fromIdx.value = idx;
          shared.toIdx.value = idx;
          shared.startAbsX.value = e.absoluteX;
          shared.startAbsY.value = e.absoluteY;
          shared.overlayX.value = e.absoluteX - itemWidth / 2; // Center overlay
          shared.overlayY.value = e.absoluteY - itemHeight / 2;

          // Call JS callback
          runOnJS(onActivateRef.current)(idx);
        })
        .onUpdate((e) => {
          "worklet";
          if (shared.fromIdx.value === -1) return;

          // 1. Update Overlay position
          // Overlay follows finger (centered)
          // Delta calculation: current absolute - start absolute
          const dx = e.absoluteX - shared.startAbsX.value;
          const dy = e.absoluteY - shared.startAbsY.value;

          // Initial center position of the item
          // We want the overlay to stick to the finger.
          // Simplest: overlay pos = touch pos - half size
          shared.overlayX.value = e.absoluteX - itemWidth / 2;
          shared.overlayY.value = e.absoluteY - itemHeight / 2;

          // 2. Drop Zone Check
          if (dropZone) {
            // Drop zone area: from strip top (stripAbsY) upwards by dropZone.height
            // Check if touch point is in drop zone
            // We use the finger Y (e.absoluteY) to check.
            // Drop zone range: [stripAbsY - dropZone.height, stripAbsY]
            // Let's add some buffer? No, simple check.
            const stripTop = shared.stripAbsY.value;
            const zoneTop = stripTop - dropZone.height;
            const isOver = e.absoluteY < stripTop && e.absoluteY > zoneTop;

            if (isOver !== shared.isOverDrop.value) {
              shared.isOverDrop.value = isOver;
              if (isOver) runOnJS(onEnterDropRef.current)();
              else runOnJS(onLeaveDropRef.current)();
            }
          }

          // 3. Reorder Logic (Calculate new index)
          // If in drop zone, do not reorder? Or keep reordering?
          // Usually if dragging up to delete, we might want the gap to close or stay.
          // Let's keep reordering active for smoother visual.

          // Current finger relative X in content
          const relX =
            e.absoluteX -
            shared.stripAbsX.value +
            shared.scrollX.value -
            contentPaddingHorizontal;
          const step = itemWidth + itemGap;
          // Raw target index
          let target = Math.round((relX - itemWidth / 2) / step);
          // Clamp
          target = clamp(target, 0, shared.count.value - 1);

          if (target !== shared.toIdx.value) {
            shared.toIdx.value = target;
            // Haptic could be added here via runOnJS
          }
        })
        .onEnd(() => {
          "worklet";
          if (shared.fromIdx.value === -1) return;
          const from = shared.fromIdx.value;
          const to = shared.toIdx.value;
          const isDrop = shared.isOverDrop.value;

          // Reset shared state
          shared.fromIdx.value = -1;
          shared.toIdx.value = -1;
          shared.isOverDrop.value = false;

          runOnJS(onReleaseRef.current)(from, to, isDrop);
        }),
    [
      contentPaddingHorizontal,
      dropZone,
      itemGap,
      itemHeight,
      itemWidth,
      longPressDuration,
      shared,
    ]
  );

  // ── Render ──

  // Find dragged item data for Overlay
  const draggedItem =
    isDragging && dragKeyRef.current
      ? data.find((d) => keyExtractor(d) === dragKeyRef.current)
      : null;

  return (
    <GestureDetector gesture={stripPanGesture}>
      {/* Root View: Captures Pan gestures and measures layout */}
      <View
        ref={rootRef}
        style={[styles.container, style]}
        onLayout={measureStrip}
        collapsable={false} // Ensure measurement works on Android
      >
        {/* Drop Zone (Rendered above if active) */}
        {dropZone && isDragging && (
          <View
            style={[
              styles.dropZone,
              { height: dropZone.height, top: -dropZone.height },
            ]}
          >
            {dropZone.render(isOverDrop)}
          </View>
        )}

        {/* Horizontal Scroll List */}
        <AnimatedScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingHorizontal: contentPaddingHorizontal,
            paddingVertical: contentPaddingVertical,
          }}
        >
          {data.map((item, index) => {
            const key = keyExtractor(item);
            // Optimization: If dragging, this item is transparent anyway.
            // But we need it for layout spacing.
            return (
              <View
                key={key}
                style={{
                  width: itemWidth,
                  height: itemHeight,
                  marginRight: index === data.length - 1 ? 0 : itemGap,
                }}
              >
                <SortItem
                  index={index}
                  itemKey={key}
                  shared={shared}
                  itemWidth={itemWidth}
                  itemGap={itemGap}
                  longPressDuration={longPressDuration}
                  onPress={onItemPress || (() => {})}
                >
                  {renderItem(item, false, index)}
                </SortItem>
              </View>
            );
          })}
        </AnimatedScrollView>

        {/* Drag Overlay (Floating on top) */}
        <DragOverlay
          shared={shared}
          itemWidth={itemWidth}
          itemHeight={itemHeight}
          // Offset logic:
          // The overlay uses overlayX/Y which are screen absolute.
          // We translate it relative to Strip Root.
          // stripLayoutOffsetY is not needed if we just place it absolute in Root.
          // But wait, DragOverlay logic uses:
          // left = overlayX - stripAbsX
          // top = overlayY - stripAbsY + offset
          // If this component is inside Root View (which is relative),
          // `left: 0` aligns with Root View left.
          // So the math is correct.
        >
          {draggedItem
            ? renderDragOverlayItem
              ? renderDragOverlayItem(draggedItem)
              : renderItem(draggedItem, true, -1)
            : null}
        </DragOverlay>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    // position: 'relative', // Default is relative
    zIndex: 1, // Ensure above other content if needed
  },
  dropZone: {
    position: "absolute",
    left: 0,
    right: 0,
    // top set dynamically
    zIndex: 0, // Behind the overlay (overlay is zIndex 999)
    justifyContent: "center",
    alignItems: "center",
  },
});
