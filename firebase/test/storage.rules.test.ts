import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadString } from 'firebase/storage';
import { afterAll, beforeAll, describe, it } from 'vitest';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-natal-solidario',
    storage: { rules: readFileSync(resolve(__dirname, '../storage.rules'), 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe('storage na Base', () => {
  it('nega leitura e escrita para usuário logado', async () => {
    const storage = env.authenticatedContext('eu').storage();
    await assertFails(uploadString(ref(storage, 'qualquer/arquivo.txt'), 'oi'));
    await assertFails(getBytes(ref(storage, 'qualquer/arquivo.txt')));
  });

  it('nega escrita sem login', async () => {
    const storage = env.unauthenticatedContext().storage();
    await assertFails(uploadString(ref(storage, 'qualquer/arquivo.txt'), 'oi'));
  });
});
