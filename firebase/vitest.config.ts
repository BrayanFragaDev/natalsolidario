import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Os testes compartilham o mesmo emulador; rodar em série evita interferência.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
