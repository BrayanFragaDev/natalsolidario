import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/lib/admin';
import { exigirPermissao } from '../src/lib/autorizacao';
import { limparFirestore, semearUsuario } from './apoio';

beforeEach(async () => {
  await limparFirestore();
});

describe('exigirPermissao', () => {
  it('sem login → unauthenticated', async () => {
    await expect(exigirPermissao(undefined, 'admin:acessar')).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('admin ativo recebe o ator', async () => {
    await semearUsuario('a1', { nome: 'Ana Admin', perfis: ['admin'] });
    await expect(exigirPermissao({ uid: 'a1' }, 'usuarios:gerenciar')).resolves.toEqual({
      uid: 'a1',
      nome: 'Ana Admin',
      perfis: ['admin'],
    });
  });

  it('admin desativado → permission-denied', async () => {
    await semearUsuario('a2', { perfis: ['admin'], ativo: false });
    await expect(exigirPermissao({ uid: 'a2' }, 'admin:acessar')).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('diretoria pedindo usuarios:gerenciar → permission-denied', async () => {
    await semearUsuario('d1', { perfis: ['diretoria'] });
    await expect(exigirPermissao({ uid: 'd1' }, 'usuarios:gerenciar')).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it('usuário sem documento → permission-denied', async () => {
    await expect(exigirPermissao({ uid: 'fantasma' }, 'admin:acessar')).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it('perfis desconhecidos gravados no documento são ignorados', async () => {
    await db.doc('usuarios/x1').set({ nome: 'X', perfis: ['root'], ativo: true });
    await expect(exigirPermissao({ uid: 'x1' }, 'admin:acessar')).rejects.toMatchObject({ code: 'permission-denied' });
  });
});
