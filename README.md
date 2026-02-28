# @ztachi007/react-native-drag-sort-strip

A high-performance, fully customizable horizontal drag-and-sort strip for React Native. Built with `react-native-reanimated` and `react-native-gesture-handler` for buttery smooth 60 FPS animations.

![npm version](https://img.shields.io/npm/v/@ztachi007/react-native-drag-sort-strip.svg)
![license](https://img.shields.io/npm/l/@ztachi007/react-native-drag-sort-strip.svg)

## Features

- 🚀 **High Performance**: Powered by Reanimated 2/3 for UI thread animations.
- 👆 **Smart Gestures**: Long-press to activate drag, auto-scrolling when dragging near edges.
- 🗑 **Drop Zone Support**: Drag items to a specific area (e.g., a trash can) to delete them.
- 🧩 **Zero Configuration**: Works out of the box with sensible defaults.
- 📱 **Cross Platform**: Works on iOS and Android.
-  TS **TypeScript**: Written in TypeScript with full type definitions.

## Installation

```bash
npm install @ztachi007/react-native-drag-sort-strip
# or
yarn add @ztachi007/react-native-drag-sort-strip
```

### Peer Dependencies

This library requires `react-native-reanimated` and `react-native-gesture-handler`.

```bash
npm install react-native-reanimated react-native-gesture-handler
```

## Usage

Here is a minimal example. You only need to provide the `data` array and a `renderItem` function.

```tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import DragSortStrip from '@ztachi007/react-native-drag-sort-strip';

const App = () => {
  const [data, setData] = useState([
    { id: '1', text: 'Item 1' },
    { id: '2', text: 'Item 2' },
    { id: '3', text: 'Item 3' },
    { id: '4', text: 'Item 4' },
    { id: '5', text: 'Item 5' },
  ]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
      <DragSortStrip
        data={data}
        onDataChange={setData}
        renderItem={(item) => (
          <View style={{
            width: 80,
            height: 80,
            backgroundColor: 'white',
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 3,
          }}>
            <Text>{item.text}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default App;
```

## Props

| Prop | Type | Default | Description |
|Data Props|
| `data` | `T[]` | **Required** | The array of data items to render. |
| `onDataChange` | `(data: T[]) => void` | **Required** | Callback when the order changes. |
| `keyExtractor` | `(item: T) => string` | `item.id` | Function to get unique key for an item. |
|Render Props|
| `renderItem` | `(item: T) => React.ReactNode` | **Required** | Function to render each item. |
|Layout Props|
| `itemWidth` | `number` | `80` | Width of each item. |
| `itemHeight` | `number` | `80` | Height of each item. |
| `itemGap` | `number` | `0` | Horizontal gap between items. |
| `contentPaddingHorizontal` | `number` | `12` | Horizontal padding for the scroll container. |
|Behavior Props|
| `longPressDuration` | `number` | `300` | Duration (ms) to trigger drag. |
| `autoScrollSpeed` | `number` | `5` | Speed of auto-scrolling when dragging near edges. |
| `autoScrollEdgeThreshold` | `number` | `50` | Distance from edge to trigger auto-scroll. |
|Drop Zone Props|
| `dropZone` | `LayoutRectangle` | `undefined` | Layout of the drop zone (e.g., trash bin). |
| `onEnterDropZone` | `() => void` | - | Called when dragged item enters drop zone. |
| `onLeaveDropZone` | `() => void` | - | Called when dragged item leaves drop zone. |
| `onDrop` | `(item: T) => void` | - | Called when item is dropped in the drop zone. |

## Advanced Usage: Drop to Delete

To implement "drag to delete", you need to measure the layout of your trash bin and pass it to the `dropZone` prop.

```tsx
import React, { useState, useRef } from 'react';
import { View, Text, LayoutRectangle } from 'react-native';
import DragSortStrip from '@ztachi007/react-native-drag-sort-strip';

const App = () => {
  const [data, setData] = useState([...]);
  const [dropZone, setDropZone] = useState<LayoutRectangle | undefined>(undefined);
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <DragSortStrip
        data={data}
        onDataChange={setData}
        dropZone={dropZone}
        onEnterDropZone={() => setIsHoveringDelete(true)}
        onLeaveDropZone={() => setIsHoveringDelete(false)}
        onDrop={(item) => {
            console.log('Deleted:', item);
            // Logic to remove item from data is handled by onDataChange, 
            // but you might want to show a confirmation or animation here.
            // Note: The library handles reordering, but for deletion 
            // you should filter the data in onDataChange or here.
            setData(prev => prev.filter(i => i.id !== item.id));
        }}
        renderItem={...}
      />

      <View 
        style={{ 
          height: 100, 
          backgroundColor: isHoveringDelete ? 'red' : 'gray',
          justifyContent: 'center', 
          alignItems: 'center' 
        }}
        onLayout={(e) => setDropZone(e.nativeEvent.layout)}
      >
        <Text style={{ color: 'white' }}>Trash Bin</Text>
      </View>
    </View>
  );
};
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
