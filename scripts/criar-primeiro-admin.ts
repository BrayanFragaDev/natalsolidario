// Cria o primeiro administrador de um ambiente. Rodar uma única vez:
//   npm run criar-admin -w @natal/scripts -- --projeto <id> --email <e-mail> --nome "<nome>"
// Usa as Application Default Credentials (gcloud auth application-default login).
// Contra os emuladores, defina FIRESTORE_EMULATOR_HOST e FIREBASE_AUTH_EMULATOR_HOST.
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { initializeApp } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, type Firestore } from 'firebase-admin/firestore';

export async function criarPrimeiroAdmin(
  db: Firestore,
  auth: Auth,
  dados: { email: string; nome: string },
): Promise<{ uid: string; link: string }> {
  const email = dados.email.trim().toLowerCase();
  const nome = dados.nome.trim();

  const admins = await db.collection('usuarios').where('perfis', 'array-contains', 'admin').limit(1).get();
  if (!admins.empty) {
    throw new Error('Já existe um administrador. Use a tela de usuários.');
  }

  const uid = await auth
    .getUserByEmail(email)
    .then((u) => u.uid)
    .catch(async (e: { code?: string }) => {
      if (e.code !== 'auth/user-not-found') throw e;
      return (await auth.createUser({ email, displayName: nome })).uid;
    });

  await auth.setCustomUserClaims(uid, { perfis: ['admin'] });

  const usuario = { nome, email, telefone: null, perfis: ['admin'], ativo: true, criadoPor: null };
  const batch = db.batch();
  batch.set(db.doc(`usuarios/${uid}`), {
    ...usuario,
    criadoEm: FieldValue.serverTimestamp(),
    atualizadoEm: FieldValue.serverTimestamp(),
  });
  batch.create(db.collection('auditoria').doc(), {
    atorUid: 'script',
    atorNome: 'Script inicial',
    acao: 'usuario.criarPrimeiroAdmin',
    entidade: 'usuarios',
    entidadeId: uid,
    antes: null,
    depois: usuario,
    em: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return { uid, link: await auth.generatePasswordResetLink(email) };
}

async function principal(): Promise<void> {
  const { values } = parseArgs({
    options: { projeto: { type: 'string' }, email: { type: 'string' }, nome: { type: 'string' } },
  });
  if (!values.projeto || !values.email || !values.nome) {
    console.error('Uso: npm run criar-admin -w @natal/scripts -- --projeto <id> --email <e-mail> --nome "<nome>"');
    process.exit(1);
  }

  const app = initializeApp({ projectId: values.projeto });
  const { uid, link } = await criarPrimeiroAdmin(getFirestore(app), getAuth(app), {
    email: values.email,
    nome: values.nome,
  });
  console.log(`Administrador criado (uid ${uid}).`);
  console.log(`Link para definir a senha:\n${link}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((e: Error) => {
    console.error(e.message);
    process.exit(1);
  });
}
