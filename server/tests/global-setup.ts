import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { TEST_DATABASE_URL, TEST_UPLOAD_DIR } from './test-env.js';

// Gira una volta sola, prima di tutti i test: cancella i residui del giro precedente
// e crea il database temporaneo applicando le stesse migrazioni della produzione.
export default function setup() {
  fs.rmSync('tests/.tmp', { recursive: true, force: true });
  fs.mkdirSync(TEST_UPLOAD_DIR, { recursive: true });
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
