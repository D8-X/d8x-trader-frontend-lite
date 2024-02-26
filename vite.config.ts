// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'vite';
// eslint-disable-next-line import/no-extraneous-dependencies
import react from '@vitejs/plugin-react';
// eslint-disable-next-line import/no-extraneous-dependencies
import viteTsconfigPaths from 'vite-tsconfig-paths';
// eslint-disable-next-line import/no-extraneous-dependencies
import svgr from 'vite-plugin-svgr';
// eslint-disable-next-line import/no-extraneous-dependencies
import { checker } from 'vite-plugin-checker';
// eslint-disable-next-line import/no-extraneous-dependencies
import stylelintPlugin from 'vite-plugin-stylelint';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'build',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: [
      {
        // this is required for the SCSS modules
        find: /^~(.*)$/,
        replacement: 'src/$1',
      },
    ],
  },
  plugins: [
    react(),
    viteTsconfigPaths(),
    // svgr options: https://react-svgr.com/docs/options/
    svgr({
      svgrOptions: { icon: true },
      include: ['**/*.svg', '**/*.svg?react'],
      exclude: ['**/*.chain.svg'],
    }),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
    }),
    stylelintPlugin(),
    nodePolyfills(),
  ],
  server: {
    open: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
  optimizeDeps: {
    include: ['@d8x/perpetuals-sdk'],
  },
});
