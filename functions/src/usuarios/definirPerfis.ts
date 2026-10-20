import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { auth, db } from '../lib/admin';
import { registrarAuditoria } from '../lib/auditoria';
import { exigirPermissao } from '../lib/autorizacao';
import type { Requisicao } from '../lib/requisicao';
import { esquemaPerfis, esquemaUid, validar } from '../lib/validacao';
import { garantirOutroAdminAtivo } from './guardaUltimoAdmin';

const esquemaEntrada = z.object({ uid: esquemaUid, perfis: esquemaPerfis });

export async function definirPerfis(req: Requisicao): Promise<{ ok: true }> {
  const ator = await exigirPermissao(req.auth, 'usuarios:gerenciar');
  const { uid, perfis } = validar(esquemaEntrada, req.data);

  await db.runTransaction(async (tx) => {
    const ref = db.doc(`usuarios/${uid}`);
    const snap = await tx.get(ref);
    const atual = snap.data();
    if (!atual) throw new HttpsError('not-found', 'Usuário não encontrado.');

    const perfisAntes: string[] = atual.perfis ?? [];
    if (atual.ativo === true && perfisAntes.includes('admin') && !perfis.includes('admin')) {
      await garantirOutroAdminAtivo(tx, uid);
    }

    tx.update(ref, { perfis, atualizadoEm: FieldValue.serverTimestamp() });
    registrarAuditoria(tx, ator, {
      acao: 'usuario.definirPerfis',
      entidade: 'usuarios',
      entidadeId: uid,
      antes: { perfis: perfisAntes },
      depois: { perfis },
    });
  });

  await auth.setCustomUserClaims(uid, { perfis });
  await auth.revokeRefreshTokens(uid);
  return { ok: true };
}
