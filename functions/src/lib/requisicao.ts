import type { CallableOptions } from 'firebase-functions/v2/https';

// O que os handlers precisam de uma CallableRequest; permite testá-los sem o runtime.
export interface Requisicao {
  auth?: { uid: string };
  data: unknown;
}

export const opcoesCallable: CallableOptions = {
  region: 'southamerica-east1',
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
};
