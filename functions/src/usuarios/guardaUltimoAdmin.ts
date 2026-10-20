import type { Transaction } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../lib/admin';

// Lida dentro da transação: duas remoções simultâneas não passam juntas,
// porque a segunda é refeita e já enxerga a primeira.
export async function garantirOutroAdminAtivo(tx: Transaction, uidSaindo: string): Promise<void> {
  const admins = await tx.get(
    db.collection('usuarios').where('ativo', '==', true).where('perfis', 'array-contains', 'admin'),
  );
  if (!admins.docs.some((d) => d.id !== uidSaindo)) {
    throw new HttpsError('failed-precondition', 'O sistema precisa de pelo menos um administrador ativo.');
  }
}
