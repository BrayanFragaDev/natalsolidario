import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { auth, db } from '../src/lib/admin';
import { convidar } from '../src/usuarios/convidar';
import { limparAuth, limparFirestore, semearUsuario } from './apoio';

const comoAdmin = { uid: 'adm' };
const entrada = { nome: 'Ana Souza', email: ' Ana@Exemplo.com ', telefone: '11987654321', perfis: ['editor'] };

beforeEach(async () => {
  await limparFirestore();
  await limparAuth();
  await semearUsuario('adm', { nome: 'Admin', perfis: ['admin'] });
  delete process.env.CONVITE_POR_EMAIL;
});

afterEach(() => {
  delete process.env.CONVITE_POR_EMAIL;
});

describe('convidar', () => {
  it('cria conta, claims, documento e auditoria; devolve o link sem e-mail configurado', async () => {
    const { uid, linkConvite } = await convidar({ auth: comoAdmin, data: entrada });

    const usuario = await auth.getUser(uid);
    expect(usuario.email).toBe('ana@exemplo.com');
    expect(usuario.customClaims).toEqual({ perfis: ['editor'] });

    const doc = (await db.doc(`usuarios/${uid}`).get()).data();
    expect(doc).toMatchObject({
      nome: 'Ana Souza',
      email: 'ana@exemplo.com',
      telefone: '11987654321',
      perfis: ['editor'],
      ativo: true,
      criadoPor: 'adm',
    });

    const auditoria = await db.collection('auditoria').get();
    expect(auditoria.size).toBe(1);
    expect(auditoria.docs[0]!.data()).toMatchObject({
      atorUid: 'adm',
      atorNome: 'Admin',
      acao: 'usuario.convidar',
      entidade: 'usuarios',
      entidadeId: uid,
      antes: null,
      depois: { email: 'ana@exemplo.com', perfis: ['editor'], ativo: true },
    });

    expect(typeof linkConvite).toBe('string');
  });

  it('com e-mail configurado, enfileira a mensagem e não devolve o link', async () => {
    process.env.CONVITE_POR_EMAIL = 'true';
    const { linkConvite } = await convidar({ auth: comoAdmin, data: entrada });
    expect(linkConvite).toBeNull();
    const mail = await db.collection('mail').get();
    expect(mail.size).toBe(1);
    expect(mail.docs[0]!.data()).toMatchObject({
      to: 'ana@exemplo.com',
      message: { subject: 'Convite para o Natal Solidário' },
    });
  });

  it('segundo convite para o mesmo e-mail (com outra grafia) → already-exists', async () => {
    await convidar({ auth: comoAdmin, data: entrada });
    await expect(
      convidar({ auth: comoAdmin, data: { ...entrada, email: 'ana@exemplo.com' } }),
    ).rejects.toMatchObject({ code: 'already-exists', message: 'Já existe um usuário com este e-mail.' });
    expect((await db.collection('usuarios').get()).size).toBe(2);
  });

  it('adota a conta criada por um login com Google recusado (conta sem documento)', async () => {
    const orfa = await auth.createUser({ email: 'ana@exemplo.com' });

    const { uid } = await convidar({ auth: comoAdmin, data: entrada });

    expect(uid).toBe(orfa.uid);
    expect((await auth.getUser(uid)).customClaims).toEqual({ perfis: ['editor'] });
    expect((await db.doc(`usuarios/${uid}`).get()).data()).toMatchObject({ email: 'ana@exemplo.com', ativo: true });
    const acoes = (await db.collection('auditoria').get()).docs.map((d) => d.data().acao);
    expect(acoes).toEqual(['usuario.convidar']);
  });

  it('diretoria não pode convidar', async () => {
    await semearUsuario('dir', { perfis: ['diretoria'] });
    await expect(convidar({ auth: { uid: 'dir' }, data: entrada })).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it.each([
    ['nome vazio', { nome: '' }],
    ['perfil inexistente', { perfis: ['root'] }],
    ['perfis vazios', { perfis: [] }],
    ['telefone com letras', { telefone: 'abc' }],
  ])('%s → invalid-argument, sem criar conta', async (_caso, troca) => {
    await expect(convidar({ auth: comoAdmin, data: { ...entrada, ...troca } })).rejects.toMatchObject({
      code: 'invalid-argument',
    });
    const contas = await auth.listUsers();
    expect(contas.users).toHaveLength(0);
  });

  it('escapa HTML do nome no e-mail', async () => {
    process.env.CONVITE_POR_EMAIL = 'true';
    await convidar({ auth: comoAdmin, data: { ...entrada, nome: '<b>Ana</b>' } });
    const mail = (await db.collection('mail').get()).docs[0]!.data();
    expect(mail.message.html).toContain('&lt;b&gt;Ana&lt;/b&gt;');
    expect(mail.message.html).not.toContain('<b>Ana</b>');
  });
});
