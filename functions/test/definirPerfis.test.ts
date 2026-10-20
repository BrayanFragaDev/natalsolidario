import { beforeEach, describe, expect, it } from 'vitest';
import { auth, db } from '../src/lib/admin';
import { definirPerfis } from '../src/usuarios/definirPerfis';
import { limparAuth, limparFirestore, semearUsuario } from './apoio';

beforeEach(async () => {
  await limparFirestore();
  await limparAuth();
  await semearUsuario('adm', { nome: 'Admin', perfis: ['admin'] }, true);
});

describe('definirPerfis', () => {
  it('troca os perfis no documento, nos claims e registra a auditoria', async () => {
    await semearUsuario('ed', { perfis: ['editor'] }, true);

    await expect(definirPerfis({ auth: { uid: 'adm' }, data: { uid: 'ed', perfis: ['tesouraria'] } })).resolves.toEqual({
      ok: true,
    });

    expect((await db.doc('usuarios/ed').get()).data()?.perfis).toEqual(['tesouraria']);
    expect((await auth.getUser('ed')).customClaims).toEqual({ perfis: ['tesouraria'] });
    const registros = (await db.collection('auditoria').get()).docs.map((d) => d.data());
    expect(registros).toEqual([
      expect.objectContaining({
        acao: 'usuario.definirPerfis',
        entidadeId: 'ed',
        antes: { perfis: ['editor'] },
        depois: { perfis: ['tesouraria'] },
      }),
    ]);
  });

  it('o único admin não pode remover o próprio perfil admin', async () => {
    await expect(
      definirPerfis({ auth: { uid: 'adm' }, data: { uid: 'adm', perfis: ['diretoria'] } }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'O sistema precisa de pelo menos um administrador ativo.',
    });
    expect((await db.doc('usuarios/adm').get()).data()?.perfis).toEqual(['admin']);
  });

  it('dois admins removendo um ao outro ao mesmo tempo: só um consegue', async () => {
    await semearUsuario('adm2', { nome: 'Admin 2', perfis: ['admin'] }, true);

    const resultados = await Promise.allSettled([
      definirPerfis({ auth: { uid: 'adm' }, data: { uid: 'adm2', perfis: ['diretoria'] } }),
      definirPerfis({ auth: { uid: 'adm2' }, data: { uid: 'adm', perfis: ['diretoria'] } }),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const admins = await db
      .collection('usuarios')
      .where('ativo', '==', true)
      .where('perfis', 'array-contains', 'admin')
      .get();
    expect(admins.size).toBe(1);
  });

  it('usuário inexistente → not-found', async () => {
    await expect(
      definirPerfis({ auth: { uid: 'adm' }, data: { uid: 'ninguem', perfis: ['editor'] } }),
    ).rejects.toMatchObject({ code: 'not-found' });
  });

  it('diretoria não define perfis', async () => {
    await semearUsuario('dir', { perfis: ['diretoria'] }, true);
    await expect(
      definirPerfis({ auth: { uid: 'dir' }, data: { uid: 'dir', perfis: ['admin'] } }),
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('perfis inválidos → invalid-argument', async () => {
    await expect(
      definirPerfis({ auth: { uid: 'adm' }, data: { uid: 'adm', perfis: [] } }),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });
});
