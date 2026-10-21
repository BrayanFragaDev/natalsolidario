import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getBytes, ref, uploadBytes } from 'firebase/storage';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import type { Perfil } from '@natal/shared';

const PROJETO = 'demo-natal-solidario';
let env: RulesTestEnvironment;
// As regras do Storage leem o banco "natalsolidario"; a semente vai por Admin SDK.
const banco = getFirestore(getApps()[0] ?? initializeApp({ projectId: PROJETO }), 'natalsolidario');

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJETO,
    storage: { rules: readFileSync(resolve(__dirname, '../storage.rules'), 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJETO}/databases/natalsolidario/documents`,
    { method: 'DELETE' },
  );
  const pessoas: [string, Perfil[], boolean][] = [
    ['adm', ['admin'], true],
    ['ed', ['editor'], true],
    ['tes', ['tesouraria'], true],
    ['inativo', ['admin'], false],
  ];
  for (const [uid, perfis, ativo] of pessoas) {
    await banco.doc(`usuarios/${uid}`).set({ nome: uid, perfis, ativo });
  }
});

function bytes(mb: number): Uint8Array {
  return new Uint8Array(Math.round(mb * 1024 * 1024));
}

function storageDe(uid: string | null) {
  return (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).storage();
}

async function enviar(uid: string | null, caminho: string, mb: number, contentType: string) {
  return uploadBytes(ref(storageDe(uid), caminho), bytes(mb), { contentType });
}

describe('portal/', () => {
  it('admin envia logo (lê usuarios no banco natalsolidario)', async () => {
    await assertSucceeds(enviar('adm', 'portal/logo.png', 0.01, 'image/png'));
  });

  it('editor e anônimo não enviam; admin inativo também não', async () => {
    await assertFails(enviar('ed', 'portal/logo.png', 0.01, 'image/png'));
    await assertFails(enviar(null, 'portal/logo.png', 0.01, 'image/png'));
    await assertFails(enviar('inativo', 'portal/logo.png', 0.01, 'image/png'));
  });

  it('logo acima de 1 MB é recusado', async () => {
    await assertFails(enviar('adm', 'portal/logo.png', 1.2, 'image/png'));
  });
});

describe('publicacoes/', () => {
  it('editor envia imagem de 1 MB', async () => {
    await assertSucceeds(enviar('ed', 'publicacoes/p1/a.webp', 1, 'image/webp'));
  });

  it('recusa 6 MB, PDF e perfil sem permissão', async () => {
    await assertFails(enviar('ed', 'publicacoes/p1/a.webp', 6, 'image/webp'));
    await assertFails(enviar('ed', 'publicacoes/p1/a.pdf', 0.1, 'application/pdf'));
    await assertFails(enviar('tes', 'publicacoes/p1/a.webp', 0.1, 'image/webp'));
  });
});

describe('transparencia/', () => {
  it('tesouraria envia PDF de 1 MB', async () => {
    await assertSucceeds(enviar('tes', 'transparencia/d1.pdf', 1, 'application/pdf'));
  });

  it('recusa editor, imagem e PDF acima de 20 MB', async () => {
    await assertFails(enviar('ed', 'transparencia/d1.pdf', 0.1, 'application/pdf'));
    await assertFails(enviar('tes', 'transparencia/d1.png', 0.1, 'image/png'));
    await assertFails(enviar('tes', 'transparencia/d1.pdf', 21, 'application/pdf'));
  });
});

describe('leitura pública', () => {
  it('anônimo lê arquivos públicos e nada fora deles', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const s = ctx.storage();
      await uploadBytes(ref(s, 'publicacoes/p1/a.webp'), bytes(0.01), { contentType: 'image/webp' });
      await uploadBytes(ref(s, 'outros/x.txt'), bytes(0.01), { contentType: 'text/plain' });
    });
    await assertSucceeds(getBytes(ref(storageDe(null), 'publicacoes/p1/a.webp')));
    await assertFails(getBytes(ref(storageDe(null), 'outros/x.txt')));
  });
});
