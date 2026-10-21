import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/lib/admin';
import { definirPixHandler } from '../src/portal/definirPix';
import { limparFirestore, semearUsuario } from './apoio';

const pix = { tipo: 'cpf', chave: '529.982.247-25', nomeRecebedor: 'Grupo Natal Solidario', cidade: 'Sao Paulo' };

beforeEach(async () => {
  await limparFirestore();
  await semearUsuario('adm', { nome: 'Admin', perfis: ['admin'] });
  await semearUsuario('ed', { perfis: ['editor'] });
});

describe('definirPix', () => {
  it('admin grava a chave normalizada com auditoria', async () => {
    await expect(definirPixHandler({ auth: { uid: 'adm' }, data: pix })).resolves.toEqual({ ok: true });
    expect((await db.doc('config/pix').get()).data()).toMatchObject({
      tipo: 'cpf',
      chave: '52998224725',
      nomeRecebedor: 'Grupo Natal Solidario',
      cidade: 'Sao Paulo',
    });
    const registros = (await db.collection('auditoria').get()).docs.map((d) => d.data());
    expect(registros).toEqual([
      expect.objectContaining({ acao: 'pix.definir', entidade: 'config', entidadeId: 'pix', antes: null }),
    ]);
  });

  it('segunda alteração registra o antes', async () => {
    await definirPixHandler({ auth: { uid: 'adm' }, data: pix });
    await definirPixHandler({ auth: { uid: 'adm' }, data: { ...pix, tipo: 'email', chave: 'Doe@Ong.org' } });
    const registros = (await db.collection('auditoria').orderBy('em').get()).docs.map((d) => d.data());
    expect(registros[1]).toMatchObject({
      antes: { tipo: 'cpf', chave: '52998224725' },
      depois: { tipo: 'email', chave: 'doe@ong.org' },
    });
  });

  it('editor não define o Pix', async () => {
    await expect(definirPixHandler({ auth: { uid: 'ed' }, data: pix })).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it.each([
    ['cpf', '111.111.111-11', 'CPF inválido.'],
    ['cnpj', '11.222.333/0001-80', 'CNPJ inválido.'],
    ['email', 'doe@', 'E-mail inválido.'],
    ['telefone', '1198765', 'Telefone inválido. Use DDD e número.'],
    ['aleatoria', 'abc', 'Chave aleatória inválida.'],
  ])('%s inválido → mensagem própria', async (tipo, chave, mensagem) => {
    await expect(
      definirPixHandler({ auth: { uid: 'adm' }, data: { ...pix, tipo, chave } }),
    ).rejects.toMatchObject({ code: 'invalid-argument', message: mensagem });
  });

  it('nome com 26 caracteres e cidade com 16 são recusados', async () => {
    await expect(
      definirPixHandler({ auth: { uid: 'adm' }, data: { ...pix, nomeRecebedor: 'a'.repeat(26) } }),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
    await expect(
      definirPixHandler({ auth: { uid: 'adm' }, data: { ...pix, cidade: 'a'.repeat(16) } }),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });
});
