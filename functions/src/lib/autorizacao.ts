import { ehPerfil, temPermissao, type Perfil, type Permissao } from '@natal/shared';
import { HttpsError } from 'firebase-functions/v2/https';
import { db } from './admin';

export interface Ator {
  uid: string;
  nome: string;
  perfis: Perfil[];
}

// Lê usuarios/{uid} em vez dos claims: um token revogado continua válido
// por até 1 hora, e a desativação precisa valer na hora.
export async function exigirPermissao(
  authCtx: { uid: string } | undefined,
  permissao: Permissao,
): Promise<Ator> {
  if (!authCtx) {
    throw new HttpsError('unauthenticated', 'Faça login para continuar.');
  }

  const snap = await db.doc(`usuarios/${authCtx.uid}`).get();
  const dados = snap.data();
  const perfis = Array.isArray(dados?.perfis) ? dados.perfis.filter(ehPerfil) : [];

  if (!dados || dados.ativo !== true || !temPermissao(perfis, permissao)) {
    throw new HttpsError('permission-denied', 'Você não tem permissão para esta ação.');
  }

  return { uid: authCtx.uid, nome: String(dados.nome ?? ''), perfis };
}
