import { beforeEach, describe, expect, it } from 'vitest';
import { auth, db } from '../src/lib/admin';
import { convidar } from '../src/usuarios/convidar';
import { desativar, reativar } from '../src/usuarios/situacao';
import { limparAuth, limparFirestore, semearUsuario } from './apoio';

beforeEach(async () => {
  await limparFirestore();
  await limparAuth();
  await semearUsuario('adm', { nome: 'Admin', perfis: ['admin'] }, true);
});

describe('desativar', () => {
  it('desativa no documento e no Auth, com auditoria', async () => {
    await semearUsuario('ed', { perfis: ['editor'] }, true);

    await expect(desativar({ auth: { uid: 'adm' }, data: { uid: 'ed' } })).resolves.toEqual({ ok: true });

    expect((await db.doc('usuarios/ed').get()).data()?.ativo).toBe(false);
    expect((await auth.getUser('ed')).disabled).toBe(true);
    const registros = (await db.collection('auditoria').get()).docs.map((d) => d.data());
    expect(registros).toEqual([
      expect.objectContaining({ acao: 'usuario.desativar', entidadeId: 'ed', antes: { ativo: true }, depois: { ativo: false } }),
    ]);
  });

  it('admin desativado perde o acesso às Functions mesmo com token válido', async () => {
    await semearUsuario('adm2', { perfis: ['admin'] }, true);
    await desativar({ auth: { uid: 'adm' }, data: { uid: 'adm2' } });

    await expect(
      convidar({ auth: { uid: 'adm2' }, data: { nome: 'Bia', email: 'bia@teste.local', perfis: ['editor'] } }),
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('não desativa o último admin ativo', async () => {
    await expect(desativar({ auth: { uid: 'adm' }, data: { uid: 'adm' } })).rejects.toMatchObject({
      code: 'failed-precondition',
    });
    expect((await db.doc('usuarios/adm').get()).data()?.ativo).toBe(true);
    expect((await auth.getUser('adm')).disabled).toBe(false);
  });

  it('usuário inexistente → not-found', async () => {
    await expect(desativar({ auth: { uid: 'adm' }, data: { uid: 'ninguem' } })).rejects.toMatchObject({
      code: 'not-found',
    });
  });
});

describe('reativar', () => {
  it('volta ativo no documento e no Auth, com auditoria', async () => {
    await semearUsuario('ed', { perfis: ['editor'] }, true);
    await desativar({ auth: { uid: 'adm' }, data: { uid: 'ed' } });

    await expect(reativar({ auth: { uid: 'adm' }, data: { uid: 'ed' } })).resolves.toEqual({ ok: true });

    expect((await db.doc('usuarios/ed').get()).data()?.ativo).toBe(true);
    expect((await auth.getUser('ed')).disabled).toBe(false);
    const acoes = (await db.collection('auditoria').get()).docs.map((d) => d.data().acao).sort();
    expect(acoes).toEqual(['usuario.desativar', 'usuario.reativar']);
  });

  it('diretoria não reativa', async () => {
    await semearUsuario('dir', { perfis: ['diretoria'] }, true);
    await expect(reativar({ auth: { uid: 'dir' }, data: { uid: 'adm' } })).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });
});
