import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  LayoutRectangle,
} from 'react-native';
import DragSortStrip from '@ztachi007/react-native-drag-sort-strip';

// Define the item type
type Item = {
  id: string;
  label: string;
  color: string;
};

// Generate some initial data
const INITIAL_DATA: Item[] = [
  { id: '1', label: '🍎 Apple', color: '#FFCDD2' },
  { id: '2', label: '🍌 Banana', color: '#FFF9C4' },
  { id: '3', label: '🍇 Grape', color: '#E1BEE7' },
  { id: '4', label: '🍊 Orange', color: '#FFE0B2' },
  { id: '5', label: '🥝 Kiwi', color: '#C8E6C9' },
  { id: '6', label: '🍉 Melon', color: '#FFCDD2' },
  { id: '7', label: '🫐 Berry', color: '#C5CAE9' },
];

export default function App() {
  const [data, setData] = useState<Item[]>(INITIAL_DATA);
  const [dropZone, setDropZone] = useState<LayoutRectangle | undefined>(undefined);
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);

  const handleDelete = useCallback((item: Item) => {
    console.log('Deleted item:', item);
    setData((prev) => prev.filter((i) => i.id !== item.id));
  }, []);

  const handleAddItem = useCallback(() => {
    const newId = Date.now().toString();
    const newItem: Item = {
      id: newId,
      label: `New ${data.length + 1}`,
      color: '#B2DFDB',
    };
    setData((prev) => [...prev, newItem]);
  }, [data.length]);

  const renderItem = useCallback((item: Item) => {
    return (
      <View style={[styles.item, { backgroundColor: item.color }]}>
        <Text style={styles.itemText}>{item.label}</Text>
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Drag Sort Strip Example</Text>
        <Text style={styles.subtitle}>Long press to drag, drop to trash to delete</Text>
      </View>

      <View style={styles.stripContainer}>
        <DragSortStrip
          data={data}
          onDataChange={setData}
          renderItem={renderItem}
          itemWidth={100}
          itemHeight={100}
          itemGap={10}
          contentPaddingHorizontal={20}
          dropZone={dropZone}
          onEnterDropZone={() => setIsHoveringDelete(true)}
          onLeaveDropZone={() => setIsHoveringDelete(false)}
          onDrop={handleDelete}
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>

        <View
          style={[
            styles.trashZone,
            isHoveringDelete && styles.trashZoneActive,
          ]}
          onLayout={(e) => setDropZone(e.nativeEvent.layout)}
        >
          <Text style={[
            styles.trashText,
            isHoveringDelete && styles.trashTextActive
          ]}>
            {isHoveringDelete ? 'Release to Delete' : '🗑 Drag Here to Delete'}
          </Text>
        </View>
      </View>

      <View style={styles.debugInfo}>
        <Text style={styles.debugTitle}>Current Order:</Text>
        <Text style={styles.debugText}>
          {data.map(i => i.label).join(' → ')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  stripContainer: {
    height: 140,
    justifyContent: 'center',
    marginVertical: 20,
  },
  item: {
    width: 100,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  controls: {
    padding: 20,
    alignItems: 'center',
    gap: 20,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  trashZone: {
    width: '100%',
    height: 120,
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  trashZoneActive: {
    borderColor: '#FF5252',
    backgroundColor: '#FFEBEE',
    transform: [{ scale: 1.02 }],
  },
  trashText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  trashTextActive: {
    color: '#FF5252',
    fontWeight: 'bold',
  },
  debugInfo: {
    padding: 20,
    marginTop: 'auto',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
  },
});
