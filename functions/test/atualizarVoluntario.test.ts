import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/lib/admin';
import { atualizar } from '../src/voluntarios/atualizar';
import { limparFirestore, semearUsuario } from './apoio';

beforeEach(async () => {
  await limparFirestore();
  await semearUsuario('coord', { nome: 'Coordenação', perfis: ['coord_voluntarios'] });
  await semearUsuario('dir', { perfis: ['diretoria'] });
  await db.doc('voluntarios/v1').set({ nome: 'Maria', status: 'novo', anotacoes: null });
});

describe('atualizar', () => {
  it('coordenação muda o status, com auditoria só do campo alterado', async () => {
    await expect(atualizar({ auth: { uid: 'coord' }, data: { id: 'v1', status: 'ativo' } })).resolves.toEqual({
      ok: true,
    });
    expect((await db.doc('voluntarios/v1').get()).data()).toMatchObject({ status: 'ativo', anotacoes: null });
    const registros = (await db.collection('auditoria').get()).docs.map((d) => d.data());
    expect(registros).toEqual([
      expect.objectContaining({
        atorNome: 'Coordenação',
        acao: 'voluntario.atualizar',
        entidadeId: 'v1',
        antes: { status: 'novo' },
        depois: { status: 'ativo' },
      }),
    ]);
  });

  it('grava anotações e aceita limpá-las', async () => {
    await atualizar({ auth: { uid: 'coord' }, data: { id: 'v1', anotacoes: '  Ligar sábado  ' } });
    expect((await db.doc('voluntarios/v1').get()).data()?.anotacoes).toBe('Ligar sábado');
    await atualizar({ auth: { uid: 'coord' }, data: { id: 'v1', anotacoes: '' } });
    expect((await db.doc('voluntarios/v1').get()).data()?.anotacoes).toBeNull();
  });

  it('diretoria só vê: permission-denied', async () => {
    await expect(atualizar({ auth: { uid: 'dir' }, data: { id: 'v1', status: 'ativo' } })).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it('id inexistente → not-found; sem campos ou anotação longa → invalid-argument', async () => {
    await expect(atualizar({ auth: { uid: 'coord' }, data: { id: 'x', status: 'ativo' } })).rejects.toMatchObject({
      code: 'not-found',
    });
    await expect(atualizar({ auth: { uid: 'coord' }, data: { id: 'v1' } })).rejects.toMatchObject({
      code: 'invalid-argument',
    });
    await expect(
      atualizar({ auth: { uid: 'coord' }, data: { id: 'v1', anotacoes: 'a'.repeat(2001) } }),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
    await expect(
      atualizar({ auth: { uid: 'coord' }, data: { id: 'v1', status: 'sumido' } }),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });
});
