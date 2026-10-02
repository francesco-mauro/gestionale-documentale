import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL, TEST_UPLOAD_DIR } from './tests/test-env.js';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Prepara il database temporaneo prima di tutti i test (vedi tests/global-setup.ts).
    globalSetup: ['tests/global-setup.ts'],
    // Le variabili che il backend leggerà durante i test: database e cartella uploads temporanei.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      UPLOAD_DIR: TEST_UPLOAD_DIR,
    },
    // C'è un solo database di test: i file di test girano uno alla volta, non in parallelo.
    fileParallelism: false,
  },
});
