import type { Perfil } from '@natal/shared';
import { auth, db } from '../src/lib/admin';

const PROJETO = process.env.GCLOUD_PROJECT ?? 'demo-natal-solidario';

export async function limparFirestore(): Promise<void> {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (!host) throw new Error('Rode os testes pelo emulador (npm test -w functions).');
  await fetch(`http://${host}/emulator/v1/projects/${PROJETO}/databases/natalsolidario/documents`, { method: 'DELETE' });
}

export async function limparAuth(): Promise<void> {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!host) throw new Error('Rode os testes pelo emulador (npm test -w functions).');
  await fetch(`http://${host}/emulator/v1/projects/${PROJETO}/accounts`, { method: 'DELETE' });
}

export async function semearUsuario(
  uid: string,
  dados: { nome?: string; email?: string; perfis: Perfil[]; ativo?: boolean },
  comAuth = false,
): Promise<void> {
  const email = dados.email ?? `${uid}@teste.local`;
  if (comAuth) {
    await auth.createUser({ uid, email, displayName: dados.nome ?? 'Pessoa Teste' });
    await auth.setCustomUserClaims(uid, { perfis: dados.perfis });
  }
  await db.doc(`usuarios/${uid}`).set({
    nome: dados.nome ?? 'Pessoa Teste',
    email,
    telefone: null,
    perfis: dados.perfis,
    ativo: dados.ativo ?? true,
    criadoEm: new Date(),
    criadoPor: null,
    atualizadoEm: new Date(),
  });
}
