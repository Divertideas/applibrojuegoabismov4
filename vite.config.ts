import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Config para GitHub Pages del repo "applibrojuegoabismo"
export default defineConfig({
  plugins: [react()],
  base: '/applibrojuegoabismo/', // nombre del repo en GitHub
  build: {
    outDir: 'docs', // aquí se generará la web
  },
});
