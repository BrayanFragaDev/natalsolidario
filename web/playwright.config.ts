import { defineConfig, devices } from '@playwright/test';

// Rodar com `npm run test:e2e -w web`, que sobe os emuladores antes.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  globalSetup: './e2e/semente.ts',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx next dev --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_USAR_EMULADORES: 'true',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-natal-solidario',
    },
  },
});
