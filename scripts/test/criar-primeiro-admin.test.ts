import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { beforeEach, describe, expect, it } from 'vitest';
import { criarPrimeiroAdmin } from '../criar-primeiro-admin';

const PROJETO = 'demo-natal-solidario';
const app = getApps()[0] ?? initializeApp({ projectId: PROJETO });
const db = getFirestore(app);
const auth = getAuth(app);

beforeEach(async () => {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJETO}/databases/(default)/documents`, {
    method: 'DELETE',
  });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJETO}/accounts`, {
    method: 'DELETE',
  });
});

describe('criarPrimeiroAdmin', () => {
  it('cria conta, claims, documento e auditoria', async () => {
    const { uid, link } = await criarPrimeiroAdmin(db, auth, { email: ' Dono@Ong.org ', nome: 'Dona da ONG' });

    expect((await auth.getUser(uid)).customClaims).toEqual({ perfis: ['admin'] });
    expect((await db.doc(`usuarios/${uid}`).get()).data()).toMatchObject({
      nome: 'Dona da ONG',
      email: 'dono@ong.org',
      telefone: null,
      perfis: ['admin'],
      ativo: true,
      criadoPor: null,
    });
    const auditoria = (await db.collection('auditoria').get()).docs.map((d) => d.data());
    expect(auditoria).toEqual([
      expect.objectContaining({ atorUid: 'script', atorNome: 'Script inicial', acao: 'usuario.criarPrimeiroAdmin' }),
    ]);
    expect(link).toMatch(/^https?:\/\//);
  });

  it('reaproveita uma conta do Auth que já existe', async () => {
    const existente = await auth.createUser({ email: 'dono@ong.org' });
    const { uid } = await criarPrimeiroAdmin(db, auth, { email: 'dono@ong.org', nome: 'Dona da ONG' });
    expect(uid).toBe(existente.uid);
  });

  it('recusa a segunda execução', async () => {
    await criarPrimeiroAdmin(db, auth, { email: 'dono@ong.org', nome: 'Dona da ONG' });
    await expect(criarPrimeiroAdmin(db, auth, { email: 'outro@ong.org', nome: 'Outra Pessoa' })).rejects.toThrow(
      'Já existe um administrador. Use a tela de usuários.',
    );
  });
});
