import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/lib/admin';
import { reconfirmarPermissao } from '../src/lib/autorizacao';
import { limparFirestore, semearUsuario } from './apoio';

beforeEach(async () => {
  await limparFirestore();
});

describe('reconfirmarPermissao (dentro da transação)', () => {
  it('aceita ator ainda ativo com a permissão', async () => {
    await semearUsuario('a1', { perfis: ['admin'] });
    await expect(
      db.runTransaction((tx) => reconfirmarPermissao(tx, 'a1', 'usuarios:gerenciar')),
    ).resolves.toBeUndefined();
  });

  it('recusa ator desativado depois da primeira checagem', async () => {
    await semearUsuario('a1', { perfis: ['admin'], ativo: false });
    await expect(
      db.runTransaction((tx) => reconfirmarPermissao(tx, 'a1', 'usuarios:gerenciar')),
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('recusa ator rebaixado depois da primeira checagem', async () => {
    await semearUsuario('a1', { perfis: ['diretoria'] });
    await expect(
      db.runTransaction((tx) => reconfirmarPermissao(tx, 'a1', 'usuarios:gerenciar')),
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });
});
