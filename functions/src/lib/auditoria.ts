import { FieldValue, type Transaction } from 'firebase-admin/firestore';
import { db } from './admin';
import type { Ator } from './autorizacao';

export interface DadosAuditoria {
  acao: string;
  entidade: string;
  entidadeId: string;
  antes: object | null;
  depois: object | null;
}

export function registrarAuditoria(
  tx: Transaction,
  ator: Pick<Ator, 'uid' | 'nome'>,
  dados: DadosAuditoria,
): void {
  tx.create(db.collection('auditoria').doc(), {
    atorUid: ator.uid,
    atorNome: ator.nome,
    ...dados,
    em: FieldValue.serverTimestamp(),
  });
}
