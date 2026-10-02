import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In sviluppo Vite serve il frontend sulla porta 5173 e inoltra le chiamate /api
// al backend Express sulla porta 3000. In produzione questo file non serve:
// il backend serve direttamente la cartella dist/ compilata.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
