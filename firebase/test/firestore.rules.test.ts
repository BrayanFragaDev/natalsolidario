import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { PERFIS, temPermissao, type Perfil } from '@natal/shared';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-natal-solidario',
    firestore: { rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

function usuarioDoc(perfis: Perfil[], ativo = true) {
  return {
    nome: 'Pessoa Teste',
    email: 'pessoa@teste.local',
    telefone: null,
    perfis,
    ativo,
    criadoEm: new Date(),
    criadoPor: null,
    atualizadoEm: new Date(),
  };
}

async function semear(dados: Record<string, object>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    for (const [caminho, valor] of Object.entries(dados)) {
      await setDoc(doc(ctx.firestore(), caminho), valor);
    }
  });
}

function como(uid: string) {
  return env.authenticatedContext(uid).firestore();
}

describe('usuarios e auditoria por perfil (espelho da matriz)', () => {
  for (const perfil of PERFIS) {
    it(`${perfil}: leitura de outro usuário segue usuarios:ver`, async () => {
      await semear({ 'usuarios/eu': usuarioDoc([perfil]), 'usuarios/outro': usuarioDoc(['editor']) });
      const leitura = getDoc(doc(como('eu'), 'usuarios/outro'));
      await (temPermissao([perfil], 'usuarios:ver') ? assertSucceeds(leitura) : assertFails(leitura));
    });

    it(`${perfil}: leitura da auditoria segue auditoria:ver`, async () => {
      await semear({ 'usuarios/eu': usuarioDoc([perfil]), 'auditoria/x': { acao: 'teste' } });
      const leitura = getDoc(doc(como('eu'), 'auditoria/x'));
      await (temPermissao([perfil], 'auditoria:ver') ? assertSucceeds(leitura) : assertFails(leitura));
    });
  }
});

describe('usuário desativado', () => {
  it('admin desativado não lê outros usuários nem a auditoria', async () => {
    await semear({
      'usuarios/eu': usuarioDoc(['admin'], false),
      'usuarios/outro': usuarioDoc(['editor']),
      'auditoria/x': { acao: 'teste' },
    });
    await assertFails(getDoc(doc(como('eu'), 'usuarios/outro')));
    await assertFails(getDoc(doc(como('eu'), 'auditoria/x')));
  });
});

describe('próprio documento', () => {
  beforeEach(async () => {
    await semear({ 'usuarios/eu': usuarioDoc(['admin']) });
  });

  it('lê o próprio documento', async () => {
    await assertSucceeds(getDoc(doc(como('eu'), 'usuarios/eu')));
  });

  it('membro também lê o próprio documento', async () => {
    await semear({ 'usuarios/m': usuarioDoc(['membro']) });
    await assertSucceeds(getDoc(doc(como('m'), 'usuarios/m')));
  });

  it('atualiza nome e telefone', async () => {
    await assertSucceeds(
      updateDoc(doc(como('eu'), 'usuarios/eu'), {
        nome: 'Novo Nome',
        telefone: '11987654321',
        atualizadoEm: serverTimestamp(),
      }),
    );
  });

  it('pode limpar o telefone', async () => {
    await assertSucceeds(updateDoc(doc(como('eu'), 'usuarios/eu'), { telefone: null }));
  });

  it.each([
    ['perfis', { perfis: ['admin', 'diretoria'] }],
    ['ativo', { ativo: false }],
    ['email', { email: 'outro@teste.local' }],
    ['criadoPor', { criadoPor: 'eu' }],
  ])('não altera %s, mesmo sendo admin', async (_campo, dados) => {
    await assertFails(updateDoc(doc(como('eu'), 'usuarios/eu'), dados));
  });

  it('recusa telefone com letras e nome vazio', async () => {
    await assertFails(updateDoc(doc(como('eu'), 'usuarios/eu'), { telefone: 'abc' }));
    await assertFails(updateDoc(doc(como('eu'), 'usuarios/eu'), { nome: '' }));
  });

  it('usuário desativado não altera o próprio documento nem se reativa', async () => {
    await semear({ 'usuarios/d': usuarioDoc(['editor'], false) });
    await assertFails(updateDoc(doc(como('d'), 'usuarios/d'), { nome: 'Outro Nome' }));
    await assertFails(updateDoc(doc(como('d'), 'usuarios/d'), { ativo: true }));
  });

  it('não altera o documento de outra pessoa', async () => {
    await semear({ 'usuarios/outro': usuarioDoc(['editor']) });
    await assertFails(updateDoc(doc(como('eu'), 'usuarios/outro'), { nome: 'Invasor' }));
  });
});

describe('escritas proibidas para qualquer cliente', () => {
  beforeEach(async () => {
    await semear({ 'usuarios/eu': usuarioDoc(['admin']), 'auditoria/x': { acao: 'teste' } });
  });

  it('admin não cria nem apaga usuários', async () => {
    await assertFails(setDoc(doc(como('eu'), 'usuarios/novo'), usuarioDoc(['admin'])));
    await assertFails(deleteDoc(doc(como('eu'), 'usuarios/eu')));
  });

  it('usuário sem documento não cria o próprio cadastro', async () => {
    await assertFails(setDoc(doc(como('estranho'), 'usuarios/estranho'), usuarioDoc(['admin'])));
  });

  it('ninguém grava na auditoria', async () => {
    await assertFails(setDoc(doc(como('eu'), 'auditoria/y'), { acao: 'falsa' }));
    await assertFails(updateDoc(doc(como('eu'), 'auditoria/x'), { acao: 'alterada' }));
    await assertFails(deleteDoc(doc(como('eu'), 'auditoria/x')));
  });
});

describe('sem login', () => {
  it('não lê nada', async () => {
    await semear({ 'usuarios/eu': usuarioDoc(['admin']), 'auditoria/x': { acao: 'teste' } });
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, 'usuarios/eu')));
    await assertFails(getDoc(doc(anon, 'auditoria/x')));
  });
});

describe('coleções não previstas', () => {
  it('são negadas por padrão', async () => {
    await semear({ 'usuarios/eu': usuarioDoc(['admin']) });
    await assertFails(setDoc(doc(como('eu'), 'qualquer/coisa'), { a: 1 }));
    await assertFails(getDoc(doc(como('eu'), 'qualquer/coisa')));
  });
});
