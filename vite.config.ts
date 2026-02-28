/*
 * @Author: ztachi(legendryztachi@gmail.com)
 * @Date: 2026-02-28 18:46:46
 * @LastEditors: ztachi(legendryztachi@gmail.com)
 * @LastEditTime: 2026-02-28 18:46:47
 * @FilePath: /lib/react-native-drag-sort-strip/vite.config.ts
 * @Description: 
 */
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ReactNativeDragSortStrip',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-native',
        'react-native-reanimated',
        'react-native-gesture-handler',
      ],
      output: {
        globals: {
          react: 'React',
          'react-native': 'ReactNative',
          'react-native-reanimated': 'Reanimated',
          'react-native-gesture-handler': 'GestureHandler',
        },
      },
    },
  },
});
