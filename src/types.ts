import type React from "react";
import type { StyleProp, ViewStyle } from "react-native";

/**
 * Configuration for an external Drop Zone.
 * When dragging starts, this zone is rendered above the strip.
 * Callbacks are triggered when the dragged item's center enters this zone.
 */
export interface DropZoneConfig {
  /** Height of the zone (px), extending upwards from the top of the strip */
  height: number;
  /**
   * Custom render function for the drop zone.
   * @param isOver Whether the dragged item is currently hovering over this zone
   */
  render: (isOver: boolean) => React.ReactElement;
  /** Triggered when the user releases the item in the zone. Passes the key of the released item. */
  onDrop: (key: string) => void;
}

/**
 * Props for the DragSortStrip component.
 *
 * @template T Type of the list item data
 */
export interface DragSortStripProps<T> {
  /** List data */
  data: T[];
  /** Function to extract a unique key for each item */
  keyExtractor: (item: T) => string;
  /**
   * Render function for each list item.
   * The component internally wraps this in a gesture handler, so NO Touchable components are needed.
   * @param item The data item
   * @param isActive Whether the item is currently being dragged (opacity is 0 in original position, shown in overlay)
   * @param index The index of the item in the data array
   */
  renderItem: (item: T, isActive: boolean, index: number) => React.ReactElement;
  /**
   * Render function for the dragging overlay (the floating view following the finger).
   * If not provided, it reuses `renderItem(item, true, -1)`.
   */
  renderDragOverlayItem?: (item: T) => React.ReactElement;
  /** Callback when reordering ends, passing the new array of keys */
  onReorder: (newKeys: string[]) => void;
  /** Callback when an item is pressed (short tap) */
  onItemPress?: (key: string) => void;
  /** Callback when dragging starts (long press activated). Useful for triggering haptic feedback. */
  onDragStart?: () => void;
  /** Callback when the dragged item enters the drop zone. Useful for triggering haptic feedback. */
  onEnterDropZone?: () => void;
  /** Callback when the dragged item leaves the drop zone. */
  onLeaveDropZone?: () => void;
  /** Configuration for an external drop zone (e.g., for deletion) */
  dropZone?: DropZoneConfig;
  /** Width of each item (px) */
  itemWidth: number;
  /** Height of each item (px) */
  itemHeight: number;
  /** Gap between items (px, default 0) */
  itemGap?: number;
  /** Horizontal padding of the list container (px, default 12) */
  contentPaddingHorizontal?: number;
  /** Vertical padding of the list container (px, default 10) */
  contentPaddingVertical?: number;
  /** Duration of long press to activate dragging (ms, default 250) */
  longPressDuration?: number;
  /** Custom style for the strip root container */
  style?: StyleProp<ViewStyle>;
}
