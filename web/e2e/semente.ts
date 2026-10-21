import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJETO = 'demo-natal-solidario';
export const SENHA = 'senha-teste-123';

const PESSOAS = [
  { uid: 'e2e-admin', nome: 'Admin Teste', email: 'admin@teste.local', perfis: ['admin'] },
  { uid: 'e2e-editor', nome: 'Editor Teste', email: 'editor@teste.local', perfis: ['editor'] },
  { uid: 'e2e-editor2', nome: 'Editora Dois', email: 'editor2@teste.local', perfis: ['editor'] },
  { uid: 'e2e-diretoria', nome: 'Diretoria Teste', email: 'diretoria@teste.local', perfis: ['diretoria'] },
];

export default async function semear() {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!firestoreHost || !authHost) {
    throw new Error('Rode pelo emulador: npm run test:e2e -w web');
  }
  await fetch(`http://${firestoreHost}/emulator/v1/projects/${PROJETO}/databases/natalsolidario/documents`, {
    method: 'DELETE',
  });
  await fetch(`http://${authHost}/emulator/v1/projects/${PROJETO}/accounts`, { method: 'DELETE' });

  const app = getApps()[0] ?? initializeApp({ projectId: PROJETO });
  const auth = getAuth(app);
  const db = getFirestore(app, 'natalsolidario');

  for (const p of PESSOAS) {
    await auth.createUser({ uid: p.uid, email: p.email, password: SENHA, displayName: p.nome });
    await auth.setCustomUserClaims(p.uid, { perfis: p.perfis });
    await db.doc(`usuarios/${p.uid}`).set({
      nome: p.nome,
      email: p.email,
      telefone: null,
      perfis: p.perfis,
      ativo: true,
      criadoEm: new Date(),
      criadoPor: null,
      atualizadoEm: new Date(),
    });
  }
}
