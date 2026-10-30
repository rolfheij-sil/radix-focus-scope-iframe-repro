import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// The installed version, printed on the page (the package's `exports` hides its package.json).
// Falls back to a placeholder where node_modules cannot be read (for example some web sandboxes).
let focusScopeVersion = 'unknown';
try {
  focusScopeVersion = JSON.parse(
    readFileSync('node_modules/@radix-ui/react-focus-scope/package.json', 'utf8'),
  ).version;
} catch {
  // keep the fallback
}

// esnext target: src/main.tsx uses top-level await.
export default defineConfig({
  plugins: [react()],
  define: { __FOCUS_SCOPE_VERSION__: JSON.stringify(focusScopeVersion) },
  build: { target: 'esnext' },
  esbuild: { target: 'esnext' },
  optimizeDeps: { esbuildOptions: { target: 'esnext' } },
});
