import { ehPerfil, temPermissao, type Perfil, type Permissao } from '@natal/shared';
import type { DocumentData, Transaction } from 'firebase-admin/firestore';
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
  return { uid: authCtx.uid, ...conferir(snap.data(), permissao) };
}

// Repete a checagem dentro da transação: se ela for refeita porque o próprio
// ator foi rebaixado ou desativado ao mesmo tempo, a operação é recusada.
export async function reconfirmarPermissao(tx: Transaction, uid: string, permissao: Permissao): Promise<void> {
  conferir((await tx.get(db.doc(`usuarios/${uid}`))).data(), permissao);
}

function conferir(dados: DocumentData | undefined, permissao: Permissao): Omit<Ator, 'uid'> {
  const perfis = Array.isArray(dados?.perfis) ? dados.perfis.filter(ehPerfil) : [];
  if (!dados || dados.ativo !== true || !temPermissao(perfis, permissao)) {
    throw new HttpsError('permission-denied', 'Você não tem permissão para esta ação.');
  }
  return { nome: String(dados.nome ?? ''), perfis };
}
