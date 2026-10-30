import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site at https://afunne.github.io/Teoretik/
// so production builds need that sub-path. `npm run dev` keeps using "/".
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/Teoretik/' : '/',
  server: { port: 5173, open: true },
}));
