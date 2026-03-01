# React Native Drag Sort Strip

A highly customizable, performant drag-and-sort strip component for React Native, powered by **Reanimated v3** and **Gesture Handler v2**.

Supports 2D free drag, horizontal sorting, and **drag-to-delete** (drop zone) interactions.

![Demo](https://via.placeholder.com/600x200?text=Demo+Gif+Here)

## Features

- 🚀 **60 FPS Animations**: Built with `react-native-reanimated` (Shared Values) for zero-latency UI thread performance.
- 👆 **Smooth Gestures**: Uses `react-native-gesture-handler` for responsive touch handling.
- 🗑️ **Drag to Delete**: Built-in support for dragging items into a "drop zone" (e.g., trash bin) to delete.
- 🧩 **Customizable**: Full control over item rendering, dimensions, gaps, and overlay appearance.
- 📱 **Expo Compatible**: Works seamlessly with Expo and bare React Native projects.

## Installation

```bash
npm install @ztachi007/react-native-drag-sort-strip
# or
yarn add @ztachi007/react-native-drag-sort-strip
```

### Peer Dependencies

Ensure you have installed the required peer dependencies:

```bash
npm install react-native-reanimated react-native-gesture-handler
```

> Don't forget to add `react-native-reanimated/plugin` to your `babel.config.js`.

## Usage

### Basic Example

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DragSortStrip } from '@ztachi007/react-native-drag-sort-strip';

const DATA = [
  { id: '1', text: 'Item 1' },
  { id: '2', text: 'Item 2' },
  { id: '3', text: 'Item 3' },
  { id: '4', text: 'Item 4' },
];

export default function App() {
  const [data, setData] = useState(DATA);

  return (
    <View style={styles.container}>
      <DragSortStrip
        data={data}
        keyExtractor={(item) => item.id}
        onReorder={(newKeys) => {
          // Reorder your data based on the new keys
          const newData = newKeys.map(key => data.find(i => i.id === key)!);
          setData(newData);
        }}
        renderItem={(item) => (
          <View style={styles.item}>
            <Text>{item.text}</Text>
          </View>
        )}
        itemWidth={100}
        itemHeight={100}
        itemGap={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 50,
  },
  item: {
    width: 100,
    height: 100,
    backgroundColor: '#4DB6AC',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});
```

## Props

### Required Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| **`data`** | `T[]` | Array of data items to render. |
| **`keyExtractor`** | `(item: T) => string` | Function to return a unique key for each item. |
| **`renderItem`** | `(item: T, isActive: boolean, index: number) => React.ReactElement` | Function to render each item. `isActive` is true when the item is being dragged (usually rendered transparently). |
| **`onReorder`** | `(newKeys: string[]) => void` | Callback fired when drag ends with a new order. Receives an array of item keys in the new order. |
| **`itemWidth`** | `number` | Width of each item in pixels. |
| **`itemHeight`** | `number` | Height of each item in pixels. |

### Optional Configuration

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `itemGap` | `number` | `0` | Horizontal gap between items (px). |
| `contentPaddingHorizontal` | `number` | `12` | Horizontal padding for the scroll container start/end. |
| `contentPaddingVertical` | `number` | `10` | Vertical padding for the scroll container top/bottom. |
| `longPressDuration` | `number` | `250` | Duration (ms) to hold an item before drag starts. |
| `style` | `StyleProp<ViewStyle>` | - | Style for the strip container. |

### Interaction Callbacks

| Prop | Type | Description |
| :--- | :--- | :--- |
| `onItemPress` | `(key: string) => void` | Called when an item is tapped (short press). |
| `onDragStart` | `() => void` | Called when drag gesture is activated. Useful for triggering haptic feedback. |
| `renderDragOverlayItem` | `(item: T) => React.ReactElement` | Custom render function for the floating item being dragged. If omitted, reuses `renderItem` with `isActive=true`. |

### Drop Zone (Drag to Delete)

Props for configuring a "Drop Zone" (e.g., a trash bin area above the strip).

| Prop | Type | Description |
| :--- | :--- | :--- |
| `dropZone` | `DropZoneConfig` | Configuration object for the drop zone (see below). |
| `onEnterDropZone` | `() => void` | Called when the dragged item enters the drop zone. |
| `onLeaveDropZone` | `() => void` | Called when the dragged item leaves the drop zone. |

#### `DropZoneConfig` Interface

```typescript
interface DropZoneConfig {
  /** Height of the zone (px), extending upwards from the top of the strip */
  height: number;
  
  /** 
   * Custom render function for the drop zone UI.
   * @param isOver - Boolean indicating if an item is currently hovering over the zone.
   */
  render: (isOver: boolean) => React.ReactElement;
  
  /** 
   * Callback triggered when an item is dropped into the zone.
   * @param key - The key of the dropped item.
   */
  onDrop: (key: string) => void;
}
```

## Advanced Usage: Drag to Delete

To implement "Drag to Delete", provide the `dropZone` prop. The drop zone appears **above** the strip when dragging starts.

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DragSortStrip } from '@ztachi007/react-native-drag-sort-strip';

export default function App() {
  const [data, setData] = useState([...]);

  const handleDelete = (key: string) => {
    console.log('Delete item:', key);
    setData(prev => prev.filter(item => item.id !== key));
  };

  return (
    <DragSortStrip
      data={data}
      // ... other required props
      dropZone={{
        height: 100, // Height of the drop zone area
        onDrop: handleDelete,
        render: (isOver) => (
          <View style={[
            styles.trashBin, 
            { backgroundColor: isOver ? '#FFCDD2' : '#E0E0E0' }
          ]}>
            <Text>{isOver ? 'Release to Delete' : 'Drag Here to Delete'}</Text>
          </View>
        )
      }}
      onEnterDropZone={() => console.log('Entered trash')}
      onLeaveDropZone={() => console.log('Left trash')}
    />
  );
}

const styles = StyleSheet.create({
  trashBin: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  }
});
```

## License

MIT
